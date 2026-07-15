import os
import torch
import librosa
import asyncio
import edge_tts
from transformers import (
    WhisperProcessor,
    WhisperForConditionalGeneration,
    AutoModelForSeq2SeqLM,
    AutoTokenizer
)
from .config import WHISPER_MODEL_NAME, NLLB_MODEL_NAME, SUPPORTED_LANGUAGES

# Whisper language code → NLLB language code mapping
WHISPER_TO_NLLB = {
    "en": "eng_Latn",
    "ml": "mal_Mlym",
    "hi": "hin_Deva",
    "ta": "tam_Taml",
    "te": "tel_Telu",
    "kn": "kan_Knda",
    "ar": "arb_Arab",
    "fr": "fra_Latn",
    "de": "deu_Latn",
    "es": "spa_Latn",
    "it": "ita_Latn",
    "zh": "zho_Hans",
    "ja": "jpn_Jpan",
    "ko": "kor_Hang",
    "ru": "rus_Cyrl",
}

NLLB_TO_WHISPER = {v: k for k, v in WHISPER_TO_NLLB.items()}


class MLPipeline:
    """
    Singleton AI pipeline wrapping:
      - OpenAI Whisper  (Automatic Speech Recognition + Language Detection)
      - Meta NLLB-200   (Neural Machine Translation, 200+ languages)
      - Edge-TTS        (Neural Text-to-Speech synthesis)
    """

    def __init__(self):
        self.device = "cuda" if torch.cuda.is_available() else "cpu"
        self.whisper_processor: WhisperProcessor | None = None
        self.whisper_model: WhisperForConditionalGeneration | None = None
        self.nllb_tokenizer: AutoTokenizer | None = None
        self.nllb_model: AutoModelForSeq2SeqLM | None = None
        print(f"[*] MLPipeline initialised. Device: {self.device}")

    # ------------------------------------------------------------------ #
    #  Model loaders (lazy – first call downloads & caches from HuggingFace)
    # ------------------------------------------------------------------ #
    def load_whisper(self):
        if self.whisper_model is None:
            print(f"[*] Loading Whisper: {WHISPER_MODEL_NAME}  …")
            self.whisper_processor = WhisperProcessor.from_pretrained(WHISPER_MODEL_NAME)
            self.whisper_model = (
                WhisperForConditionalGeneration.from_pretrained(WHISPER_MODEL_NAME)
                .to(self.device)
            )
            print("[+] Whisper loaded.")

    def load_nllb(self):
        if self.nllb_model is None:
            print(f"[*] Loading NLLB-200: {NLLB_MODEL_NAME}  …")
            self.nllb_tokenizer = AutoTokenizer.from_pretrained(NLLB_MODEL_NAME)
            self.nllb_model = (
                AutoModelForSeq2SeqLM.from_pretrained(NLLB_MODEL_NAME)
                .to(self.device)
            )
            print("[+] NLLB-200 loaded.")

    # ------------------------------------------------------------------ #
    #  ASR: Transcribe + Language Detection
    # ------------------------------------------------------------------ #
    def transcribe(self, audio_path: str) -> dict:
        """
        Transcribe an audio file and auto-detect the spoken language.

        Returns:
            {
              "text": str,
              "detected_lang_code": str   (NLLB code, e.g. "mal_Mlym"),
              "detected_lang_name": str   (human name, e.g. "Malayalam"),
              "confidence": float,
              "duration": float,
            }
        """
        self.load_whisper()

        # Load audio using scipy (no FFmpeg required)
        from scipy.io import wavfile
        from scipy import signal
        import numpy as np
        
        sr_input, audio_data = wavfile.read(audio_path)
        # Convert to float and mono
        if len(audio_data.shape) > 1:
            audio = np.mean(audio_data, axis=1).astype(np.float32)
        else:
            audio = audio_data.astype(np.float32)
        # Normalize
        if np.max(np.abs(audio)) > 1:
            audio = audio / (np.max(np.abs(audio)) + 1e-9)
        # Resample to 16kHz if needed
        sr = 16000
        if sr_input != sr:
            num_samples = int(len(audio) * sr / sr_input)
            audio = signal.resample(audio, num_samples).astype(np.float32)
        
        duration = len(audio) / sr

        # Build log-mel spectrogram input features
        input_features = self.whisper_processor(
            audio, sampling_rate=sr, return_tensors="pt"
        ).input_features.to(self.device)

        # ---- Language Detection via Whisper ----
        with torch.no_grad():
            lang_logits = self.whisper_model.detect_language(input_features)
        
        # lang_logits is a dict of language token -> logit
        # We need to find the token with the highest logit value
        try:
            # Standard case: lang_logits is a dict
            if isinstance(lang_logits, dict):
                best_lang_id = max(lang_logits, key=lang_logits.get)
                best_lang_prob = float(lang_logits[best_lang_id])
            else:
                # Fallback: if it's not a dict, default to English
                # This prevents crashes from API changes
                best_lang_id = 50258  # Token ID for <|en|>
                best_lang_prob = 0.0
        except Exception as e:
            # If anything goes wrong, default to English
            import logging
            logging.getLogger(__name__).warning(f"Language detection failed: {e}, defaulting to English")
            best_lang_id = 50258  # Token ID for <|en|>
            best_lang_prob = 0.0
        
        # Decode token id to language code, e.g. "<|en|>" → "en"
        try:
            whisper_lang_token = self.whisper_processor.tokenizer.decode([best_lang_id])
            whisper_lang_code = whisper_lang_token.strip("<|>") if "<|" in whisper_lang_token else "en"
        except:
            whisper_lang_code = "en"

        # ---- Transcription ----
        with torch.no_grad():
            generated_ids = self.whisper_model.generate(
                input_features,
                return_timestamps=False,
                language=whisper_lang_code,  # force detected language
            )

        transcription = self.whisper_processor.batch_decode(
            generated_ids, skip_special_tokens=True
        )[0].strip()

        # Map to NLLB code
        nllb_lang_code = WHISPER_TO_NLLB.get(whisper_lang_code, "eng_Latn")
        lang_info = SUPPORTED_LANGUAGES.get(nllb_lang_code, {"name": "English"})

        return {
            "text": transcription,
            "detected_lang_code": nllb_lang_code,
            "detected_lang_name": lang_info["name"],
            "confidence": round(best_lang_prob, 4),
            "duration": round(duration, 2),
        }

    # ------------------------------------------------------------------ #
    #  NMT: Translate text between NLLB language codes
    # ------------------------------------------------------------------ #
    def translate(self, text: str, src_lang: str, tgt_lang: str) -> str:
        """
        Translate *text* from src_lang → tgt_lang (NLLB-200 language codes).
        Returns the translated string.
        """
        if not text.strip():
            return ""

        self.load_nllb()

        # Set source language on tokenizer
        self.nllb_tokenizer.src_lang = src_lang
        inputs = self.nllb_tokenizer(text, return_tensors="pt", truncation=True,
                                     max_length=512).to(self.device)

        forced_bos_id = self.nllb_tokenizer.convert_tokens_to_ids(tgt_lang)

        with torch.no_grad():
            translated_ids = self.nllb_model.generate(
                **inputs,
                forced_bos_token_id=forced_bos_id,
                max_new_tokens=256,
                num_beams=4,
            )

        return self.nllb_tokenizer.batch_decode(
            translated_ids, skip_special_tokens=True
        )[0].strip()

    # ------------------------------------------------------------------ #
    #  TTS: Synthesise speech with Edge-TTS
    # ------------------------------------------------------------------ #
    async def text_to_speech(self, text: str, tgt_lang: str, output_path: str) -> bool:
        """
        Generate TTS audio for *text* in the target language.
        Returns True on success.
        """
        try:
            lang_info = SUPPORTED_LANGUAGES.get(tgt_lang, SUPPORTED_LANGUAGES["eng_Latn"])
            voice = lang_info["tts_voice"]
            communicate = edge_tts.Communicate(text, voice)
            await communicate.save(output_path)
            return True
        except Exception as exc:
            print(f"[-] Edge-TTS error: {exc}")
            return False


# Global singleton
pipeline_singleton = MLPipeline()

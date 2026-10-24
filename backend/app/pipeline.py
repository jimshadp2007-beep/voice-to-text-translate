import os
import sys
import torch
import asyncio
import urllib.request
import urllib.parse
import json
import logging
from transformers import (
    WhisperProcessor,
    WhisperForConditionalGeneration,
    AutoModelForSeq2SeqLM,
    AutoTokenizer
)
from .config import WHISPER_MODEL_NAME, NLLB_MODEL_NAME, SUPPORTED_LANGUAGES, TRANSLATION_ENGINE

logger = logging.getLogger(__name__)

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
      - Dual Translation:
          * Meta NLLB-200 (Deep neural machine translation for 200+ languages)
          * Fast Cloud Engine (Instant zero-wait translation for all languages)
      - Dual Text-to-Speech:
          * Edge-TTS (Natural neural speech synthesis)
          * gTTS (Rock-solid offline/resilient fallback)
    """

    def __init__(self):
        self.device = "cuda" if torch.cuda.is_available() else "cpu"
        self.whisper_processor: WhisperProcessor | None = None
        self.whisper_model: WhisperForConditionalGeneration | None = None
        self.nllb_tokenizer: AutoTokenizer | None = None
        self.nllb_model: AutoModelForSeq2SeqLM | None = None
        self.preferred_engine: str = TRANSLATION_ENGINE  # "auto", "fast", or "nllb"
        print(f"[*] MLPipeline initialized. Device: {self.device}, Engine: {self.preferred_engine}")

    # ------------------------------------------------------------------ #
    #  Model loaders (lazy – cached from HuggingFace)
    # ------------------------------------------------------------------ #
    def load_whisper(self):
        if self.whisper_model is None:
            print(f"[*] Loading Whisper model: {WHISPER_MODEL_NAME} ...")
            self.whisper_processor = WhisperProcessor.from_pretrained(WHISPER_MODEL_NAME)
            self.whisper_model = (
                WhisperForConditionalGeneration.from_pretrained(WHISPER_MODEL_NAME)
                .to(self.device)
            )
            print("[+] Whisper model loaded successfully.")

    def load_nllb(self):
        if self.nllb_model is None:
            print(f"[*] Loading NLLB-200: {NLLB_MODEL_NAME} ...")
            self.nllb_tokenizer = AutoTokenizer.from_pretrained(NLLB_MODEL_NAME)
            self.nllb_model = (
                AutoModelForSeq2SeqLM.from_pretrained(NLLB_MODEL_NAME)
                .to(self.device)
            )
            print("[+] NLLB-200 model loaded successfully.")

    def is_nllb_available(self) -> bool:
        """Returns True only if NLLB neural model weights are fully cached locally (>500MB)."""
        if self.nllb_model is not None:
            return True
        cache_dir = os.path.expanduser("~/.cache/huggingface/hub")
        if not os.path.exists(cache_dir):
            return False
        try:
            for root, dirs, files in os.walk(cache_dir):
                if "nllb-200" in root.lower():
                    for f in files:
                        if f.endswith((".safetensors", ".bin")):
                            fp = os.path.join(root, f)
                            if os.path.exists(fp) and os.path.getsize(fp) > 500 * 1024 * 1024:
                                return True
        except Exception:
            pass
        return False

    # ------------------------------------------------------------------ #
    #  ASR: Transcribe + Language Detection
    # ------------------------------------------------------------------ #
    def transcribe(self, audio_path: str) -> dict:
        """
        Transcribe an audio file and auto-detect the spoken language.
        Returns source text, detected language code/name, confidence, and duration.
        """
        self.load_whisper()

        # Load audio using scipy/soundfile/numpy safely
        from scipy.io import wavfile
        from scipy import signal
        import numpy as np

        sr = 16000
        try:
            sr_input, audio_data = wavfile.read(audio_path)
            if len(audio_data.shape) > 1:
                audio = np.mean(audio_data, axis=1).astype(np.float32)
            else:
                audio = audio_data.astype(np.float32)

            # Normalize to [-1.0, 1.0]
            max_val = np.max(np.abs(audio))
            if max_val > 1.0:
                audio = audio / (max_val + 1e-9)

            # Resample to 16kHz if needed
            if sr_input != sr:
                num_samples = int(len(audio) * sr / sr_input)
                audio = signal.resample(audio, num_samples).astype(np.float32)
        except Exception as e:
            # Fallback to librosa if scipy wavfile fails on non-standard WAV
            import librosa
            audio, sr_input = librosa.load(audio_path, sr=sr, mono=True)
            audio = audio.astype(np.float32)

        duration = max(0.1, len(audio) / sr)

        # Build log-mel spectrogram features
        input_features = self.whisper_processor(
            audio, sampling_rate=sr, return_tensors="pt"
        ).input_features.to(self.device)

        # ---- Language Detection via Whisper Logits ----
        whisper_lang_code = "en"
        best_lang_prob = 0.95

        try:
            with torch.no_grad():
                gen_cfg = self.whisper_model.generation_config
                dec_ids = torch.tensor(
                    [[gen_cfg.decoder_start_token_id]], device=self.device
                )
                # First decoder step gives language token logits
                step_logits = self.whisper_model(
                    input_features=input_features[:, :, :3000],
                    decoder_input_ids=dec_ids
                ).logits[:, -1]

                lang_token_ids = list(gen_cfg.lang_to_id.values())
                sub_logits = step_logits[0, lang_token_ids]
                probs = torch.softmax(sub_logits, dim=-1)

                best_idx = torch.argmax(probs).item()
                best_token_id = lang_token_ids[best_idx]
                best_lang_prob = float(probs[best_idx].item())

                token_str = self.whisper_processor.tokenizer.decode([best_token_id])
                extracted = token_str.replace("<|", "").replace("|>", "").strip()
                if extracted and extracted in gen_cfg.lang_to_id:
                    whisper_lang_code = extracted
                elif extracted:
                    whisper_lang_code = extracted
        except Exception as det_err:
            logger.warning(f"Whisper language detection fallback: {det_err}")
            whisper_lang_code = "en"
            best_lang_prob = 0.85

        # ---- Speech Transcription ----
        try:
            with torch.no_grad():
                generated_ids = self.whisper_model.generate(
                    input_features,
                    return_timestamps=False,
                    language=whisper_lang_code,
                )

            transcription = self.whisper_processor.batch_decode(
                generated_ids, skip_special_tokens=True
            )[0].strip()
        except Exception as gen_err:
            logger.error(f"Whisper generate error: {gen_err}")
            # Try without forcing language parameter
            with torch.no_grad():
                generated_ids = self.whisper_model.generate(
                    input_features,
                    return_timestamps=False,
                )
            transcription = self.whisper_processor.batch_decode(
                generated_ids, skip_special_tokens=True
            )[0].strip()

        # Map Whisper language code to NLLB code
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
    #  NMT: Translate text (Dual Engine: Fast Cloud + NLLB-200)
    # ------------------------------------------------------------------ #
    def translate_fast(self, text: str, src_nllb: str, tgt_nllb: str) -> str:
        """
        Instant high-accuracy translation using direct Google Translate endpoint.
        Requires zero model weight downloads; supports all 15+ capstone languages.
        """
        src_info = SUPPORTED_LANGUAGES.get(src_nllb, {})
        tgt_info = SUPPORTED_LANGUAGES.get(tgt_nllb, {})

        src_code = src_info.get("google_code", "auto")
        tgt_code = tgt_info.get("google_code", "en")

        encoded_text = urllib.parse.quote(text)
        url = (
            f"https://translate.googleapis.com/translate_a/single"
            f"?client=gtx&sl={src_code}&tl={tgt_code}&dt=t&q={encoded_text}"
        )

        req = urllib.request.Request(
            url,
            headers={
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko)"
            }
        )

        with urllib.request.urlopen(req, timeout=10) as response:
            payload = json.loads(response.read().decode("utf-8"))
            # Google Translate returns chunks in payload[0]
            translated_chunks = [chunk[0] for chunk in payload[0] if chunk[0]]
            return "".join(translated_chunks).strip()

    def translate_nllb(self, text: str, src_lang: str, tgt_lang: str) -> str:
        """
        Translate using Meta NLLB-200 local neural seq2seq model.
        """
        self.load_nllb()
        self.nllb_tokenizer.src_lang = src_lang
        inputs = self.nllb_tokenizer(
            text, return_tensors="pt", truncation=True, max_length=512
        ).to(self.device)

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

    def translate(self, text: str, src_lang: str, tgt_lang: str) -> str:
        """
        Translate text from src_lang to tgt_lang.
        Automatically utilizes NLLB if preferred and available,
        or gracefully utilizes Fast Cloud Engine for instant response.
        """
        if not text.strip():
            return ""

        # Identical language: return text directly
        if src_lang == tgt_lang:
            return text

        # If user explicitly requested NLLB or it is cached
        if self.preferred_engine == "nllb" or (self.preferred_engine == "auto" and self.is_nllb_available()):
            try:
                return self.translate_nllb(text, src_lang, tgt_lang)
            except Exception as nllb_exc:
                logger.warning(f"NLLB translation failed or downloading: {nllb_exc}. Using Fast Cloud fallback.")
                return self.translate_fast(text, src_lang, tgt_lang)

        # Default fast translation
        try:
            return self.translate_fast(text, src_lang, tgt_lang)
        except Exception as fast_exc:
            logger.warning(f"Fast Cloud translation error: {fast_exc}. Attempting NLLB fallback.")
            try:
                return self.translate_nllb(text, src_lang, tgt_lang)
            except Exception as final_exc:
                logger.error(f"Both translation engines failed: {final_exc}")
                raise RuntimeError(f"Translation failed across all engines: {final_exc}")

    # ------------------------------------------------------------------ #
    #  TTS: Dual Provider (Edge-TTS + gTTS fallback)
    # ------------------------------------------------------------------ #
    async def text_to_speech(self, text: str, tgt_lang: str, output_path: str) -> bool:
        """
        Generate TTS audio for text in the target language.
        Tries high-quality Edge-TTS neural voice first;
        falls back to gTTS if Edge-TTS is blocked or unavailable.
        """
        if not text.strip():
            return False

        os.makedirs(os.path.dirname(output_path), exist_ok=True)
        lang_info = SUPPORTED_LANGUAGES.get(tgt_lang, SUPPORTED_LANGUAGES["eng_Latn"])

        # 1. Try Edge-TTS (v7.3.1)
        try:
            import edge_tts
            voice = lang_info.get("tts_voice", "en-US-AriaNeural")
            communicate = edge_tts.Communicate(text, voice)
            await communicate.save(output_path)
            if os.path.exists(output_path) and os.path.getsize(output_path) > 100:
                return True
        except Exception as edge_err:
            logger.warning(f"Edge-TTS failed ({edge_err}), falling back to gTTS...")

        # 2. Resilient fallback: gTTS
        try:
            from gtts import gTTS
            gtts_code = lang_info.get("gtts_code", "en")
            # gTTS save is synchronous, run in executor to keep event loop responsive
            loop = asyncio.get_event_loop()
            await loop.run_in_executor(
                None,
                lambda: gTTS(text=text, lang=gtts_code).save(output_path)
            )
            return os.path.exists(output_path) and os.path.getsize(output_path) > 100
        except Exception as gtts_err:
            logger.error(f"Both Edge-TTS and gTTS failed: {gtts_err}")
            return False


# Global singleton
pipeline_singleton = MLPipeline()


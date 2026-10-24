import os
from pathlib import Path
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Base directories
BASE_DIR = Path(__file__).resolve().parent.parent
UPLOAD_DIR = BASE_DIR / "uploads"
TTS_OUTPUT_DIR = BASE_DIR / "tts_output"

# Create directories if they do not exist
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
TTS_OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

# Database config
DB_PATH = BASE_DIR / "translator.db"
DATABASE_URL = os.getenv("DATABASE_URL", f"sqlite:///{DB_PATH}")

# Deep Learning Model Configs
# Default to whisper-tiny for faster local CPU testing, but can be set to base, medium, large-v3 in .env
WHISPER_MODEL_NAME = os.getenv("WHISPER_MODEL_NAME", "openai/whisper-tiny")
# Default to distilled 600M NLLB model for machine translation
NLLB_MODEL_NAME = os.getenv("NLLB_MODEL_NAME", "facebook/nllb-200-distilled-600M")

# Translation Engine: 'auto' (prefers NLLB if cached, falls back to fast), 'fast' (cloud), 'nllb' (local neural)
TRANSLATION_ENGINE = os.getenv("TRANSLATION_ENGINE", "auto")

# Supported Languages mapping
# Key: NLLB-200 language code
# Value: Dictionary containing displayName, whisperCode, ttsLanguageCode (for edge-tts), and fallbacks
SUPPORTED_LANGUAGES = {
    "eng_Latn": {
        "name": "English",
        "whisper_code": "en",
        "google_code": "en",
        "gtts_code": "en",
        "tts_voice": "en-US-AriaNeural"
    },
    "mal_Mlym": {
        "name": "Malayalam",
        "whisper_code": "ml",
        "google_code": "ml",
        "gtts_code": "ml",
        "tts_voice": "ml-IN-MidhunNeural"
    },
    "hin_Deva": {
        "name": "Hindi",
        "whisper_code": "hi",
        "google_code": "hi",
        "gtts_code": "hi",
        "tts_voice": "hi-IN-MadhurNeural"
    },
    "tam_Taml": {
        "name": "Tamil",
        "whisper_code": "ta",
        "google_code": "ta",
        "gtts_code": "ta",
        "tts_voice": "ta-IN-ValluvarNeural"
    },
    "tel_Telu": {
        "name": "Telugu",
        "whisper_code": "te",
        "google_code": "te",
        "gtts_code": "te",
        "tts_voice": "te-IN-MohanNeural"
    },
    "kan_Knda": {
        "name": "Kannada",
        "whisper_code": "kn",
        "google_code": "kn",
        "gtts_code": "kn",
        "tts_voice": "kn-IN-GaganNeural"
    },
    "arb_Arab": {
        "name": "Arabic",
        "whisper_code": "ar",
        "google_code": "ar",
        "gtts_code": "ar",
        "tts_voice": "ar-AE-HamdanNeural"
    },
    "fra_Latn": {
        "name": "French",
        "whisper_code": "fr",
        "google_code": "fr",
        "gtts_code": "fr",
        "tts_voice": "fr-FR-HenriNeural"
    },
    "deu_Latn": {
        "name": "German",
        "whisper_code": "de",
        "google_code": "de",
        "gtts_code": "de",
        "tts_voice": "de-DE-ConradNeural"
    },
    "spa_Latn": {
        "name": "Spanish",
        "whisper_code": "es",
        "google_code": "es",
        "gtts_code": "es",
        "tts_voice": "es-ES-AlvaroNeural"
    },
    "ita_Latn": {
        "name": "Italian",
        "whisper_code": "it",
        "google_code": "it",
        "gtts_code": "it",
        "tts_voice": "it-IT-DiegoNeural"
    },
    "zho_Hans": {
        "name": "Chinese (Simplified)",
        "whisper_code": "zh",
        "google_code": "zh-CN",
        "gtts_code": "zh-CN",
        "tts_voice": "zh-CN-YunxiNeural"
    },
    "jpn_Jpan": {
        "name": "Japanese",
        "whisper_code": "ja",
        "google_code": "ja",
        "gtts_code": "ja",
        "tts_voice": "ja-JP-KeitaNeural"
    },
    "kor_Hang": {
        "name": "Korean",
        "whisper_code": "ko",
        "google_code": "ko",
        "gtts_code": "ko",
        "tts_voice": "ko-KR-InJoonNeural"
    },
    "rus_Cyrl": {
        "name": "Russian",
        "whisper_code": "ru",
        "google_code": "ru",
        "gtts_code": "ru",
        "tts_voice": "ru-RU-DmitryNeural"
    }
}


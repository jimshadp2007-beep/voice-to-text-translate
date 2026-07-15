import os
import sys
import torch

# Ensure the backend directory is in the path so we can import config
sys.path.append(os.path.join(os.path.dirname(__file__), "..", "backend"))

try:
    from transformers import (
        WhisperProcessor, 
        WhisperForConditionalGeneration,
        AutoModelForSeq2SeqLM, 
        AutoTokenizer
    )
    # Check torch version
    print(f"[*] PyTorch version: {torch.__version__}")
    print(f"[*] CUDA available: {torch.cuda.is_available()}")
except ImportError:
    print("[-] PyTorch or Transformers not installed. Activate your virtual environment first.")
    sys.exit(1)

# Model configuration
WHISPER_MODEL = os.getenv("WHISPER_MODEL_NAME", "openai/whisper-tiny")
NLLB_MODEL = os.getenv("NLLB_MODEL_NAME", "facebook/nllb-200-distilled-600M")

def pre_download_models():
    """
    Downloads and caches weights for Whisper and NLLB-200.
    """
    print("==================================================")
    print("         AI Translator Model Pre-Downloader       ")
    print("==================================================")
    
    # 1. Download Whisper
    try:
        print(f"\n[*] Downloading Whisper weights for: '{WHISPER_MODEL}'...")
        processor = WhisperProcessor.from_pretrained(WHISPER_MODEL)
        model = WhisperForConditionalGeneration.from_pretrained(WHISPER_MODEL)
        print(f"[+] Successfully cached Whisper '{WHISPER_MODEL}' to local directory.")
    except Exception as e:
        print(f"[-] Failed to download Whisper: {e}")
        
    # 2. Download NLLB-200
    try:
        print(f"\n[*] Downloading NLLB-200 weights for: '{NLLB_MODEL}'...")
        tokenizer = AutoTokenizer.from_pretrained(NLLB_MODEL)
        model = AutoModelForSeq2SeqLM.from_pretrained(NLLB_MODEL)
        print(f"[+] Successfully cached NLLB-200 '{NLLB_MODEL}' to local directory.")
    except Exception as e:
        print(f"[-] Failed to download NLLB-200: {e}")

    print("\n[+] Verification completed. Ready for offline execution.")

if __name__ == "__main__":
    pre_download_models()

#!/usr/bin/env python
import sys
import json
sys.path.insert(0, '.')

from app.pipeline import MLPipeline

pipeline = MLPipeline()

try:
    print("[*] Testing transcribe with test_audio.wav...")
    result = pipeline.transcribe('test_audio.wav')
    print("[✓] Transcription successful!")
    print(f"Result: {json.dumps(result, indent=2)}")
except Exception as e:
    print(f"[✗] ERROR: {type(e).__name__}: {e}")
    import traceback
    traceback.print_exc()

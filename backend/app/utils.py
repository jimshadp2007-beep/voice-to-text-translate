import os
import numpy as np
import traceback
from scipy.io import wavfile
from scipy import signal

try:
    import librosa
    LIBROSA_AVAILABLE = True
except ImportError:
    LIBROSA_AVAILABLE = False

try:
    import noisereduce as nr
    NOISEREDUCE_AVAILABLE = True
except ImportError:
    NOISEREDUCE_AVAILABLE = False
    print("[!] noisereduce library not available. Falling back to simple spectral gate.")

def clean_and_convert_audio(input_path: str, output_path: str, apply_noise_reduction: bool = True) -> str:
    """
    Loads an audio file, converts it to 16kHz mono WAV, 
    applies noise reduction if requested, and saves the output.
    Uses scipy.io.wavfile for FFmpeg-free audio processing.
    """
    try:
        # Load audio using scipy (no FFmpeg required for WAV files)
        sr_input, audio_data = wavfile.read(input_path)
        
        # Convert to float and mono
        if len(audio_data.shape) > 1:
            # Stereo to mono
            y = np.mean(audio_data, axis=1).astype(np.float32)
        else:
            # Already mono
            y = audio_data.astype(np.float32)
        
        # Normalize to [-1, 1]
        if np.max(np.abs(y)) > 1:
            y = y / (np.max(np.abs(y)) + 1e-9)
        
        # Resample to 16kHz if needed
        sr = 16000
        if sr_input != sr:
            num_samples = int(len(y) * sr / sr_input)
            y = signal.resample(y, num_samples).astype(np.float32)
        
        # Apply noise reduction
        if apply_noise_reduction and len(y) > 0:
            if NOISEREDUCE_AVAILABLE:
                # Use noisereduce library
                y = nr.reduce_noise(y=y, sr=sr, prop_decrease=0.8)
            else:
                # Fallback: Simple noise gate (attenuate quiet parts)
                rms = np.sqrt(np.mean(y**2))
                threshold = rms * 0.1
                y = np.where(np.abs(y) < threshold, y * 0.1, y)
        
        # Ensure directory exists
        os.makedirs(os.path.dirname(output_path), exist_ok=True)
        
        # Save audio using scipy (16-bit PCM)
        y_int16 = np.int16(y * 32767)
        wavfile.write(output_path, sr, y_int16)
        return output_path
        
    except Exception as e:
        print(f"[-] Audio processing error: {e}")
        traceback.print_exc()
        raise e

def generate_grammar_correction(text: str) -> str:
    """
    A lightweight post-processing rule-based utility to correct punctuation and grammar.
    For a fully localized setup, we format sentences to start with capital letters and end with punctuation.
    """
    if not text:
        return text
    
    # Trim and strip
    clean = text.strip()
    
    # Auto capitalization
    if len(clean) > 0 and clean[0].islower():
        clean = clean[0].upper() + clean[1:]
        
    # Auto punctuation if missing
    if len(clean) > 0 and clean[-1] not in ['.', '!', '?']:
        clean += "."
        
    return clean

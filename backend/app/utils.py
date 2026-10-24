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
    Loads an audio file (WAV, MP3, OGG, FLAC, etc.), converts it to 16kHz mono WAV,
    applies optional noise reduction, and writes the standardized 16-bit PCM WAV.
    Uses multi-stage loaders (scipy -> soundfile -> librosa) for universal reliability.
    """
    y = None
    sr_input = 16000

    # 1. Try scipy wavfile first (fastest for WAV recordings)
    try:
        sr_input, audio_data = wavfile.read(input_path)
        if len(audio_data.shape) > 1:
            y = np.mean(audio_data, axis=1).astype(np.float32)
        else:
            y = audio_data.astype(np.float32)
        # Scale integers to [-1.0, 1.0]
        if np.issubdtype(audio_data.dtype, np.integer):
            max_possible = float(np.iinfo(audio_data.dtype).max)
            y = y / max_possible
    except Exception:
        y = None

    # 2. Try soundfile (handles MP3, OGG, FLAC, standard WAV)
    if y is None:
        try:
            import soundfile as sf
            audio_data, sr_input = sf.read(input_path)
            if len(audio_data.shape) > 1:
                y = np.mean(audio_data, axis=1).astype(np.float32)
            else:
                y = audio_data.astype(np.float32)
        except Exception:
            y = None

    # 3. Try librosa as final fallback
    if y is None and LIBROSA_AVAILABLE:
        try:
            y, sr_input = librosa.load(input_path, sr=None, mono=True)
            y = y.astype(np.float32)
        except Exception as e:
            print(f"[-] All audio decoders failed for {input_path}: {e}")
            raise RuntimeError(f"Could not decode audio file: {e}")

    if y is None or len(y) == 0:
        raise ValueError("Audio file contains no readable audio data or is empty.")

    # Normalize amplitude
    max_amp = np.max(np.abs(y))
    if max_amp > 1.0:
        y = y / (max_amp + 1e-9)

    # Resample to 16kHz if necessary
    sr = 16000
    if sr_input != sr:
        num_samples = int(len(y) * sr / sr_input)
        y = signal.resample(y, num_samples).astype(np.float32)

    # Apply noise reduction safely
    if apply_noise_reduction and len(y) > 512:
        try:
            if NOISEREDUCE_AVAILABLE:
                y = nr.reduce_noise(y=y, sr=sr, prop_decrease=0.75, stationary=True)
            else:
                rms = np.sqrt(np.mean(y**2))
                threshold = rms * 0.1
                y = np.where(np.abs(y) < threshold, y * 0.1, y)
        except Exception as nr_err:
            print(f"[!] Noise reduction warning ({nr_err}), proceeding with original signal.")

    # Clamp bounds to prevent overflow
    y = np.clip(y, -1.0, 1.0)

    # Ensure parent directory exists
    os.makedirs(os.path.dirname(output_path), exist_ok=True)

    # Save audio as 16-bit PCM WAV
    y_int16 = np.int16(y * 32767)
    wavfile.write(output_path, sr, y_int16)
    return output_path


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

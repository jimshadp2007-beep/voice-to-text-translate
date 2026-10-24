import { useState, useRef, useEffect, useCallback } from 'react';

export interface RecorderHook {
  isRecording: boolean;
  isPaused: boolean;
  duration: number;
  audioBlob: Blob | null;
  analyser: AnalyserNode | null;
  startRecording: () => Promise<void>;
  stopRecording: () => void;
  pauseRecording: () => void;
  resumeRecording: () => void;
  clearRecording: () => void;
  permissionError: string | null;
}

// ---------------------------------------------------------
// Helper: Downsample Float32 buffer to target rate (16kHz)
// ---------------------------------------------------------
function downsampleBuffer(buffer: Float32Array, inputRate: number, outputRate: number): Float32Array {
  if (outputRate >= inputRate) {
    return buffer;
  }
  const sampleRateRatio = inputRate / outputRate;
  const newLength = Math.round(buffer.length / sampleRateRatio);
  const result = new Float32Array(newLength);
  let offsetResult = 0;
  let offsetBuffer = 0;

  while (offsetResult < result.length) {
    const nextOffsetBuffer = Math.round((offsetResult + 1) * sampleRateRatio);
    let accum = 0;
    let count = 0;
    for (let i = offsetBuffer; i < nextOffsetBuffer && i < buffer.length; i++) {
      accum += buffer[i];
      count++;
    }
    result[offsetResult] = count > 0 ? accum / count : 0;
    offsetResult++;
    offsetBuffer = nextOffsetBuffer;
  }
  return result;
}

// ---------------------------------------------------------
// Helper: Encode Float32 PCM samples into a standard WAV Blob
// ---------------------------------------------------------
function encodeWAV(samples: Float32Array, sampleRate: number): Blob {
  const buffer = new ArrayBuffer(44 + samples.length * 2);
  const view = new DataView(buffer);

  const writeString = (v: DataView, offset: number, str: string) => {
    for (let i = 0; i < str.length; i++) {
      v.setUint8(offset + i, str.charCodeAt(i));
    }
  };

  // RIFF identifier
  writeString(view, 0, 'RIFF');
  // RIFF chunk length
  view.setUint32(4, 36 + samples.length * 2, true);
  // RIFF type
  writeString(view, 8, 'WAVE');
  // format chunk identifier
  writeString(view, 12, 'fmt ');
  // format chunk length
  view.setUint32(16, 16, true);
  // sample format (1 = raw PCM)
  view.setUint16(20, 1, true);
  // channel count (1 = mono)
  view.setUint16(22, 1, true);
  // sample rate
  view.setUint32(24, sampleRate, true);
  // byte rate (sampleRate * 1 * 2)
  view.setUint32(28, sampleRate * 2, true);
  // block align (1 * 2)
  view.setUint16(32, 2, true);
  // bits per sample (16 bit)
  view.setUint16(34, 16, true);
  // data chunk identifier
  writeString(view, 36, 'data');
  // data chunk length
  view.setUint32(40, samples.length * 2, true);

  // Convert float to 16-bit PCM
  let offset = 44;
  for (let i = 0; i < samples.length; i++, offset += 2) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
  }

  return new Blob([buffer], { type: 'audio/wav' });
}

export function useRecorder(): RecorderHook {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [duration, setDuration] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [permissionError, setPermissionError] = useState<string | null>(null);
  const [analyser, setAnalyser] = useState<AnalyserNode | null>(null);

  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<number | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const pcmChunksRef = useRef<Float32Array[]>([]);
  const isPausedRef = useRef(false);

  // Sync ref with state
  useEffect(() => {
    isPausedRef.current = isPaused;
  }, [isPaused]);

  // Teardown tracks and nodes safely
  const cleanupAudioGraph = useCallback(() => {
    if (processorRef.current) {
      try {
        processorRef.current.disconnect();
      } catch (_) {}
      processorRef.current = null;
    }
    if (sourceRef.current) {
      try {
        sourceRef.current.disconnect();
      } catch (_) {}
      sourceRef.current = null;
    }
    if (streamRef.current) {
      try {
        streamRef.current.getTracks().forEach((track) => track.stop());
      } catch (_) {}
      streamRef.current = null;
    }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      try {
        audioContextRef.current.close();
      } catch (_) {}
      audioContextRef.current = null;
    }
    setAnalyser(null);
  }, []);

  // Timer interval
  useEffect(() => {
    if (isRecording && !isPaused) {
      timerRef.current = window.setInterval(() => {
        setDuration((prev) => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) {
        window.clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }

    return () => {
      if (timerRef.current) {
        window.clearInterval(timerRef.current);
      }
    };
  }, [isRecording, isPaused]);

  // Start recording voice
  const startRecording = useCallback(async () => {
    cleanupAudioGraph();
    setAudioBlob(null);
    setDuration(0);
    setPermissionError(null);
    pcmChunksRef.current = [];
    isPausedRef.current = false;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      streamRef.current = stream;

      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      const audioCtx = new AudioContextClass();
      audioContextRef.current = audioCtx;

      // Visualizer Analyser Node
      const analyserNode = audioCtx.createAnalyser();
      analyserNode.fftSize = 256;
      setAnalyser(analyserNode);

      const source = audioCtx.createMediaStreamSource(stream);
      sourceRef.current = source;
      source.connect(analyserNode);

      // ScriptProcessorNode to capture raw PCM Float32 audio samples
      // Buffer size: 4096 gives smooth 100ms chunks
      const processor = audioCtx.createScriptProcessor(4096, 1, 1);
      processorRef.current = processor;

      processor.onaudioprocess = (e) => {
        if (isPausedRef.current) return;
        const inputData = e.inputBuffer.getChannelData(0);
        // Copy chunk
        pcmChunksRef.current.push(new Float32Array(inputData));
      };

      source.connect(processor);
      // Connect to destination so browser doesn't garbage collect the processor
      processor.connect(audioCtx.destination);

      setIsRecording(true);
      setIsPaused(false);
    } catch (err: any) {
      console.error('Mic access error:', err);
      setPermissionError(err.message || 'Microphone access denied. Please grant microphone permission.');
      cleanupAudioGraph();
    }
  }, [cleanupAudioGraph]);

  // Stop recording and create genuine 16kHz WAV
  const stopRecording = useCallback(() => {
    if (!isRecording) return;

    setIsRecording(false);
    setIsPaused(false);

    if (timerRef.current) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }

    const currentCtx = audioContextRef.current;
    const inputSampleRate = currentCtx ? currentCtx.sampleRate : 44100;
    const chunks = pcmChunksRef.current;

    // Disconnect stream and nodes
    cleanupAudioGraph();

    if (chunks.length === 0) {
      return;
    }

    // Merge chunks
    let totalLength = 0;
    for (const chunk of chunks) {
      totalLength += chunk.length;
    }

    const merged = new Float32Array(totalLength);
    let offset = 0;
    for (const chunk of chunks) {
      merged.set(chunk, offset);
      offset += chunk.length;
    }

    // Downsample to 16000 Hz for Whisper / ASR
    const targetSampleRate = 16000;
    const resampled = downsampleBuffer(merged, inputSampleRate, targetSampleRate);

    // Encode to standard 16-bit PCM WAV
    const wavBlob = encodeWAV(resampled, targetSampleRate);
    setAudioBlob(wavBlob);
  }, [isRecording, cleanupAudioGraph]);

  // Pause
  const pauseRecording = useCallback(() => {
    if (isRecording && !isPaused) {
      setIsPaused(true);
      isPausedRef.current = true;
      if (audioContextRef.current && audioContextRef.current.state === 'running') {
        audioContextRef.current.suspend();
      }
    }
  }, [isRecording, isPaused]);

  // Resume
  const resumeRecording = useCallback(() => {
    if (isRecording && isPaused) {
      setIsPaused(false);
      isPausedRef.current = false;
      if (audioContextRef.current && audioContextRef.current.state === 'suspended') {
        audioContextRef.current.resume();
      }
    }
  }, [isRecording, isPaused]);

  // Clear
  const clearRecording = useCallback(() => {
    cleanupAudioGraph();
    setAudioBlob(null);
    setDuration(0);
    setIsRecording(false);
    setIsPaused(false);
    pcmChunksRef.current = [];
  }, [cleanupAudioGraph]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanupAudioGraph();
    };
  }, [cleanupAudioGraph]);

  return {
    isRecording,
    isPaused,
    duration,
    audioBlob,
    analyser,
    startRecording,
    stopRecording,
    pauseRecording,
    resumeRecording,
    clearRecording,
    permissionError,
  };
}


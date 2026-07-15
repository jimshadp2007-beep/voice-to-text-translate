import React, { useState, useEffect, useRef } from 'react';
import { 
  Mic, Square, Pause, Play, UploadCloud, Copy, Check, 
  Download, Sparkles, RefreshCw, FileAudio, AlertCircle, 
  Volume2, VolumeX, Edit2, RotateCcw, Share2
} from 'lucide-react';
import { useRecorder } from '../hooks/useRecorder';
import { AudioVisualizer } from '../components/AudioVisualizer';
import { LanguageDropdown } from '../components/LanguageDropdown';
import { api } from '../utils/api';
import type { Language, TranslationItem } from '../utils/api';

interface TranslatorProps {
  languages: Language[];
  addHistoryItem: (item: TranslationItem) => void;
  triggerConfetti: () => void;
}

export const Translator: React.FC<TranslatorProps> = ({ 
  languages, 
  addHistoryItem,
  triggerConfetti 
}) => {
  // Recorder Hook
  const {
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
    permissionError
  } = useRecorder();

  // Translator States
  const [sourceLang, setSourceLang] = useState("auto"); // auto or code
  const [targetLang, setTargetLang] = useState("mal_Mlym"); // default Malayalam (mandatory)
  const [inputText, setInputText] = useState("");
  const [outputText, setOutputText] = useState("");
  const [isTranslating, setIsTranslating] = useState(false);
  const [confidence, setConfidence] = useState<number | null>(null);
  const [detectedLang, setDetectedLang] = useState<string | null>(null);
  const [audioDuration, setAudioDuration] = useState<number | null>(null);
  
  // File Upload State
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  
  // UI States
  const [copiedSource, setCopiedSource] = useState(false);
  const [copiedTarget, setCopiedTarget] = useState(false);
  const [applyNoiseReduction, setApplyNoiseReduction] = useState(true);
  const [isEditingSource, setIsEditingSource] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Audio Playback states (for translated TTS)
  const [isPlayingTTS, setIsPlayingTTS] = useState(false);
  const [ttsAudioUrl, setTtsAudioUrl] = useState<string | null>(null);
  const [ttsSpeed, setTtsSpeed] = useState<number>(1.0);
  const ttsAudioRef = useRef<HTMLAudioElement | null>(null);

  // Sync recording blob to trigger translation
  useEffect(() => {
    if (audioBlob) {
      handleTranslateAudio(audioBlob);
    }
  }, [audioBlob]);

  // Audio playback speed changer
  useEffect(() => {
    if (ttsAudioRef.current) {
      ttsAudioRef.current.playbackRate = ttsSpeed;
    }
  }, [ttsSpeed]);

  // Format recording timer: mm:ss
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  // One-click text copying
  const copyToClipboard = async (text: string, type: 'source' | 'target') => {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      if (type === 'source') {
        setCopiedSource(true);
        setTimeout(() => setCopiedSource(false), 2000);
      } else {
        setCopiedTarget(true);
        setTimeout(() => setCopiedTarget(false), 2000);
      }
    } catch (err) {
      console.error('Clipboard copy failed:', err);
    }
  };

  // Text translation function
  const handleTranslateText = async () => {
    if (!inputText.trim()) return;
    setIsTranslating(true);
    setErrorMessage(null);
    try {
      const result = await api.translateText(inputText, sourceLang, targetLang);
      setOutputText(result.translated_text);
      setConfidence(result.confidence);
      setDetectedLang(result.detected_lang);
      setAudioDuration(null);
      
      // Load static TTS
      const ttsUrl = result.translated_audio_filename 
        ? api.getTTSStaticUrl(result.translated_audio_filename) 
        : await api.getTTSStreamUrl(result.translated_text, targetLang);
      setTtsAudioUrl(ttsUrl);
      
      addHistoryItem(result);
      triggerConfetti();
    } catch (error: any) {
      console.error(error);
      setErrorMessage(error.message || 'Text translation failed. Check backend connection.');
    } finally {
      setIsTranslating(false);
    }
  };

  // Audio translation function
  const handleTranslateAudio = async (blob: Blob) => {
    setIsTranslating(true);
    setErrorMessage(null);
    try {
      const result = await api.translateAudio(blob, targetLang, applyNoiseReduction);
      setInputText(result.source_text);
      setOutputText(result.translated_text);
      setConfidence(result.confidence);
      setDetectedLang(result.detected_lang);
      setAudioDuration(result.duration ?? null);
      
      // Load audio stream
      if (result.tts_url) {
        setTtsAudioUrl(api.getBaseUrl() + result.tts_url);
      } else {
        const streamUrl = await api.getTTSStreamUrl(result.translated_text, targetLang);
        setTtsAudioUrl(streamUrl);
      }
      
      addHistoryItem(result);
      triggerConfetti();
    } catch (error: any) {
      console.error(error);
      setErrorMessage(error.message || 'Speech recognition or translation failed.');
    } finally {
      setIsTranslating(false);
    }
  };

  // Drag and Drop Audio Helpers
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      const validTypes = ['audio/mpeg', 'audio/wav', 'audio/x-wav', 'audio/ogg', 'audio/mp4', 'audio/m4a', 'audio/flac', 'audio/aac'];
      // Accept files with matching extensions as backup
      const ext = file.name.split('.').pop()?.toLowerCase();
      const validExts = ['mp3', 'wav', 'ogg', 'm4a', 'flac', 'aac', 'mp4'];
      
      if (validTypes.includes(file.type) || (ext && validExts.includes(ext))) {
        setUploadedFile(file);
        handleTranslateAudio(file);
      } else {
        setErrorMessage("Unsupported file type. Please upload MP3, WAV, AAC, FLAC, or M4A.");
      }
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setUploadedFile(file);
      handleTranslateAudio(file);
    }
  };

  // Text-To-Speech Playback Handlers
  const handlePlayTTS = () => {
    if (!ttsAudioUrl) return;
    
    if (isPlayingTTS) {
      ttsAudioRef.current?.pause();
      setIsPlayingTTS(false);
    } else {
      if (ttsAudioRef.current) {
        ttsAudioRef.current.playbackRate = ttsSpeed;
        ttsAudioRef.current.play()
          .then(() => setIsPlayingTTS(true))
          .catch((err) => {
            console.error('Audio playback failed:', err);
            setErrorMessage('Could not play synthesized speech. Please retry.');
          });
      }
    }
  };

  const stopTTS = () => {
    if (ttsAudioRef.current) {
      ttsAudioRef.current.pause();
      ttsAudioRef.current.currentTime = 0;
      setIsPlayingTTS(false);
    }
  };

  // Swap translation languages (Source <-> Target)
  const handleSwapLanguages = () => {
    if (sourceLang === "auto") {
      // If auto-detect, set source as detected or target, target as English
      setSourceLang(targetLang);
      setTargetLang("eng_Latn");
    } else {
      const temp = sourceLang;
      setSourceLang(targetLang);
      setTargetLang(temp);
    }
    
    // Swap text values
    const tempText = inputText;
    setInputText(outputText);
    setOutputText(tempText);
  };

  // Download translated text as .txt
  const downloadTXT = () => {
    if (!outputText) return;
    const element = document.createElement("a");
    const file = new Blob([
      `AI Voice Translator Capstone Project\n`,
      `------------------------------------\n`,
      `Source (${detectedLang || 'Auto-Detected'}): ${inputText}\n`,
      `Translation (${languages.find(l => l.code === targetLang)?.name}): ${outputText}\n`,
      `Confidence Score: ${confidence ? (confidence * 100).toFixed(1) + '%' : '100%'}\n`,
      `Generated: ${new Date().toLocaleString()}`
    ], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = `translation_${targetLang}_${Date.now()}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const resetAll = () => {
    setInputText("");
    setOutputText("");
    setConfidence(null);
    setDetectedLang(null);
    setAudioDuration(null);
    setUploadedFile(null);
    setTtsAudioUrl(null);
    stopTTS();
    clearRecording();
  };

  return (
    <div className="max-w-6xl mx-auto w-full px-4 py-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
      
      {/* Hidden HTML5 Audio Element for Synthesized Speech */}
      {ttsAudioUrl && (
        <audio 
          ref={ttsAudioRef} 
          src={ttsAudioUrl} 
          onEnded={() => setIsPlayingTTS(false)} 
          className="hidden"
        />
      )}

      {/* LEFT COLUMN: Record, Upload & Audio Configuration (1 Card span 1) */}
      <div className="lg:col-span-1 flex flex-col gap-6">
        
        {/* Recording Section Card */}
        <div className="glass-panel p-6 rounded-3xl border border-slate-200/50 dark:border-slate-800/60 shadow-md dark:shadow-slate-950/20 flex flex-col gap-5">
          <div>
            <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-primary inline-block"></span>
              Voice Recorder
            </h2>
            <p className="text-xs text-slate-400 dark:text-slate-500 font-semibold mt-1">
              Microphone input and live waveform analysis
            </p>
          </div>

          {/* Live visualizer canvas */}
          <AudioVisualizer analyser={analyser} isRecording={isRecording} isPaused={isPaused} />

          {/* Timer and Status */}
          <div className="flex items-center justify-between px-2">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
              {isRecording ? (isPaused ? 'Recording Paused' : 'Listening...') : 'Ready to record'}
            </span>
            <span className={`text-base font-extrabold transition-colors ${isRecording && !isPaused ? 'text-primary' : 'text-slate-600 dark:text-slate-400'}`}>
              {formatTime(duration)}
            </span>
          </div>

          {/* Mic Controls */}
          <div className="flex items-center justify-center gap-3">
            {!isRecording ? (
              <button
                type="button"
                onClick={startRecording}
                className="w-full flex items-center justify-center gap-2 py-3.5 bg-gradient-to-r from-primary to-secondary hover:from-primary-dark hover:to-secondary-dark text-white rounded-2xl font-bold shadow-md hover:shadow-lg shadow-primary/10 transition-all text-sm animate-mic-pulse"
              >
                <Mic className="w-4 h-4" />
                <span>Start Recording</span>
              </button>
            ) : (
              <div className="flex w-full gap-2">
                <button
                  type="button"
                  onClick={isPaused ? resumeRecording : pauseRecording}
                  className="flex-1 py-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-350 rounded-2xl font-semibold transition-colors text-sm"
                >
                  {isPaused ? 'Resume' : 'Pause'}
                </button>
                <button
                  type="button"
                  onClick={stopRecording}
                  className="flex-1 flex items-center justify-center gap-1.5 py-3 bg-danger hover:bg-danger/90 text-white rounded-2xl font-bold transition-all text-sm shadow-md"
                >
                  <Square className="w-4 h-4" />
                  <span>Stop</span>
                </button>
              </div>
            )}
          </div>
          
          {permissionError && (
            <div className="flex items-start gap-2 p-3.5 rounded-2xl bg-danger/10 text-danger border border-danger/20 text-xs font-semibold leading-relaxed">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{permissionError}</span>
            </div>
          )}
        </div>

        {/* Drag-and-Drop Audio Upload Card */}
        <div 
          onDragEnter={handleDrag}
          onDragOver={handleDrag}
          onDragLeave={handleDrag}
          onDrop={handleDrop}
          className={`glass-panel p-6 rounded-3xl border shadow-md dark:shadow-slate-950/20 flex flex-col justify-center items-center text-center cursor-pointer transition-all min-h-48 ${
            dragActive 
              ? 'border-primary bg-primary/5' 
              : 'border-slate-200/50 dark:border-slate-800/60 border-dashed hover:border-primary/40 dark:hover:border-primary/40'
          }`}
        >
          <input
            id="audio-upload"
            type="file"
            accept="audio/*"
            onChange={handleFileSelect}
            className="hidden"
          />
          <label htmlFor="audio-upload" className="w-full h-full flex flex-col items-center justify-center cursor-pointer gap-3">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 dark:text-slate-400 shadow-sm">
              {uploadedFile ? <FileAudio className="w-6 h-6 text-primary" /> : <UploadCloud className="w-6 h-6" />}
            </div>
            
            <div>
              <p className="text-sm font-bold text-slate-700 dark:text-slate-200">
                {uploadedFile ? uploadedFile.name : 'Upload Audio File'}
              </p>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 font-medium">
                {uploadedFile ? `${(uploadedFile.size / 1024 / 1024).toFixed(2)} MB` : 'Drag and drop or click to browse'}
              </p>
            </div>
            
            <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400 bg-slate-100 dark:bg-slate-800/80 px-2 py-0.5 rounded-md">
              MP3, WAV, AAC, FLAC, M4A
            </span>
          </label>
        </div>

        {/* Configurations Card */}
        <div className="glass-panel p-5 rounded-3xl border border-slate-200/50 dark:border-slate-800/60 shadow-md dark:shadow-slate-950/20 flex flex-col gap-4">
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
            Audio Settings
          </h3>
          
          {/* Noise Cancellation Toggle */}
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-500 dark:text-slate-400 font-medium">Spectral Noise Reduction</span>
            <button
              onClick={() => setApplyNoiseReduction(!applyNoiseReduction)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${applyNoiseReduction ? 'bg-primary' : 'bg-slate-300 dark:bg-slate-700'}`}
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${applyNoiseReduction ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
          </div>
        </div>

      </div>

      {/* RIGHT COLUMN: Translation Input & Output Panels (Spans 2 columns) */}
      <div className="lg:col-span-2 flex flex-col gap-6">
        
        {/* Language Selection Header */}
        <div className="glass-panel p-4 rounded-3xl border border-slate-200/50 dark:border-slate-800/60 shadow-md dark:shadow-slate-950/20 flex items-center justify-between gap-4">
          
          <LanguageDropdown 
            languages={languages} 
            selectedCode={sourceLang} 
            onSelect={setSourceLang} 
            label="From" 
          />

          {/* Swap Button */}
          <button
            type="button"
            onClick={handleSwapLanguages}
            className="self-end mb-1 p-3 rounded-2xl border border-slate-200/50 dark:border-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white transition-colors"
            title="Swap Languages"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          <LanguageDropdown 
            languages={languages} 
            selectedCode={targetLang} 
            onSelect={setTargetLang} 
            label="To" 
            excludeCode={sourceLang !== 'auto' ? sourceLang : undefined}
          />
        </div>

        {/* Global Error Banner */}
        {errorMessage && (
          <div className="flex items-start gap-2.5 p-4 rounded-3xl bg-danger/10 border border-danger/25 text-danger text-sm font-semibold leading-relaxed">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <div className="flex-1">
              <span>{errorMessage}</span>
            </div>
            <button onClick={() => setErrorMessage(null)} className="hover:text-danger/80">Dismiss</button>
          </div>
        )}

        {/* Input & Output Box Container */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* SOURCE PANEL */}
          <div className="glass-panel rounded-3xl border border-slate-200/50 dark:border-slate-800/60 shadow-md dark:shadow-slate-950/20 flex flex-col min-h-[350px]">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800/50">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                {detectedLang ? `Detected Language: ${detectedLang}` : 'Input Text / Speech'}
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => setIsEditingSource(!isEditingSource)}
                  className={`p-1.5 rounded-lg border transition-colors ${
                    isEditingSource 
                      ? 'border-primary text-primary bg-primary/5' 
                      : 'border-transparent text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                  title="Edit Recognized Text"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
            
            <div className="flex-1 p-5 relative">
              {isEditingSource ? (
                <textarea
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  className="w-full h-full min-h-[220px] bg-transparent border-none text-base text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none resize-none"
                  placeholder="Type text to translate..."
                />
              ) : (
                <div className="text-base text-slate-800 dark:text-white font-medium whitespace-pre-wrap min-h-[220px]">
                  {inputText || <span className="text-slate-400 dark:text-slate-650 font-normal">Record voice or type here...</span>}
                </div>
              )}

              {/* Character Count & Stats info */}
              <div className="absolute bottom-4 left-5 text-[10px] text-slate-400 dark:text-slate-500 font-bold flex gap-3">
                <span>{inputText.length} Chars</span>
                {audioDuration && <span>{audioDuration.toFixed(1)}s Audio</span>}
              </div>
            </div>

            {/* Source controls */}
            <div className="p-3 bg-slate-50/50 dark:bg-slate-900/30 rounded-b-3xl border-t border-slate-100 dark:border-slate-800/50 flex justify-between">
              <button
                type="button"
                onClick={() => copyToClipboard(inputText, 'source')}
                disabled={!inputText}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors disabled:opacity-40"
              >
                {copiedSource ? <Check className="w-4 h-4 text-success" /> : <Copy className="w-4 h-4" />}
              </button>

              <button
                type="button"
                onClick={handleTranslateText}
                disabled={!inputText.trim() || isTranslating}
                className="flex items-center gap-1.5 px-4 py-2 bg-slate-800 hover:bg-slate-900 dark:bg-slate-700 dark:hover:bg-slate-650 text-white rounded-xl text-xs font-bold transition-all disabled:opacity-40"
              >
                {isTranslating ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                <span>Translate</span>
              </button>
            </div>
          </div>

          {/* TARGET PANEL */}
          <div className="glass-panel rounded-3xl border border-slate-200/50 dark:border-slate-800/60 shadow-md dark:shadow-slate-950/20 flex flex-col min-h-[350px]">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800/50">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                {languages.find(l => l.code === targetLang)?.name} Translation
              </span>
              {confidence !== null && (
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  confidence > 0.85 
                    ? 'bg-success/15 text-success' 
                    : confidence > 0.6 
                      ? 'bg-warning/15 text-warning' 
                      : 'bg-danger/15 text-danger'
                }`}>
                  Confidence: {(confidence * 100).toFixed(0)}%
                </span>
              )}
            </div>
            
            <div className="flex-1 p-5 relative">
              {isTranslating ? (
                <div className="flex flex-col gap-4 mt-2">
                  {/* Premium Skeleton Loaders */}
                  <div className="h-5 bg-slate-200/80 dark:bg-slate-800/80 rounded-lg w-11/12 animate-pulse"></div>
                  <div className="h-5 bg-slate-200/80 dark:bg-slate-800/80 rounded-lg w-5/6 animate-pulse"></div>
                  <div className="h-5 bg-slate-200/80 dark:bg-slate-800/80 rounded-lg w-3/4 animate-pulse"></div>
                </div>
              ) : (
                <div className="text-base text-slate-800 dark:text-white font-medium whitespace-pre-wrap min-h-[220px]">
                  {outputText || <span className="text-slate-400 dark:text-slate-650 font-normal">Translation output will appear here...</span>}
                </div>
              )}
            </div>

            {/* Target Output Custom Speech Player Controls */}
            {outputText && !isTranslating && (
              <div className="px-5 py-2.5 bg-slate-100/50 dark:bg-slate-900/10 flex items-center justify-between border-t border-slate-100 dark:border-slate-800/50">
                
                {/* Custom Play/Stop buttons */}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handlePlayTTS}
                    className="p-2 rounded-xl bg-primary text-white hover:bg-primary-dark transition-all flex items-center justify-center"
                    title={isPlayingTTS ? "Pause Speech" : "Speak translation"}
                  >
                    {isPlayingTTS ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-current" />}
                  </button>
                  <button
                    type="button"
                    onClick={stopTTS}
                    disabled={!isPlayingTTS}
                    className="p-2 rounded-xl border border-slate-200/50 dark:border-slate-800/50 text-slate-400 hover:text-slate-600 disabled:opacity-40 transition-all"
                    title="Stop Playback"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>
                </div>

                {/* Speed Controls */}
                <div className="flex items-center gap-2 text-xs font-bold text-slate-500 dark:text-slate-455">
                  <span>Speed:</span>
                  <select 
                    value={ttsSpeed} 
                    onChange={(e) => setTtsSpeed(parseFloat(e.target.value))}
                    className="bg-transparent border border-slate-200 dark:border-slate-800/80 rounded-lg p-1 text-[11px] outline-none"
                  >
                    <option value="0.75" className="dark:bg-slate-900">0.75x</option>
                    <option value="1.0" className="dark:bg-slate-900">1.0x</option>
                    <option value="1.25" className="dark:bg-slate-900">1.25x</option>
                    <option value="1.5" className="dark:bg-slate-900">1.5x</option>
                  </select>
                </div>
              </div>
            )}

            {/* Target panel footer controls */}
            <div className="p-3 bg-slate-50/50 dark:bg-slate-900/30 rounded-b-3xl border-t border-slate-100 dark:border-slate-800/50 flex justify-between items-center">
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => copyToClipboard(outputText, 'target')}
                  disabled={!outputText}
                  className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors disabled:opacity-40"
                  title="Copy Translation"
                >
                  {copiedTarget ? <Check className="w-4 h-4 text-success" /> : <Copy className="w-4 h-4" />}
                </button>
                <button
                  type="button"
                  onClick={downloadTXT}
                  disabled={!outputText}
                  className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors disabled:opacity-40"
                  title="Export TXT File"
                >
                  <Download className="w-4 h-4" />
                </button>
              </div>

              {outputText && (
                <button
                  onClick={resetAll}
                  className="text-xs font-semibold text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-350 transition-colors py-1.5 px-3 rounded-lg"
                >
                  Reset All
                </button>
              )}
            </div>

          </div>

        </div>

      </div>

    </div>
  );
};

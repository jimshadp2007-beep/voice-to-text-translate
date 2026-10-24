import React, { useState, useEffect } from 'react';
import { 
  Sun, Moon, Volume2, ShieldCheck, Check, Info,
  Sliders, Type, RefreshCw, Cpu, Database
} from 'lucide-react';
import { api } from '../utils/api';

interface SettingsProps {
  darkMode: boolean;
  setDarkMode: (dark: boolean) => void;
  accentColor: string;
  setAccentColor: (color: string) => void;
}

export const Settings: React.FC<SettingsProps> = ({
  darkMode,
  setDarkMode,
  accentColor,
  setAccentColor
}) => {
  const [backendHealthy, setBackendHealthy] = useState<boolean | null>(null);
  const [checkingHealth, setCheckingHealth] = useState(false);
  const [modelStates, setModelStates] = useState<{ whisper: boolean; nllb: boolean } | null>(null);
  const [currentEngine, setCurrentEngine] = useState<string>("auto");
  const [engineUpdating, setEngineUpdating] = useState(false);
  
  // Local Settings
  const [fontSize, setFontSize] = useState(() => localStorage.getItem('fontSize') || 'md');
  const [animSpeed, setAnimSpeed] = useState(() => localStorage.getItem('animSpeed') || 'normal');

  useEffect(() => {
    checkHealth();
    api.getEngine().then((data) => {
      if (data?.current_engine) setCurrentEngine(data.current_engine);
    }).catch(() => {});
  }, []);

  const checkHealth = async () => {
    setCheckingHealth(true);
    try {
      const healthy = await api.checkHealth();
      setBackendHealthy(healthy);
      
      // Fetch dynamic details
      const response = await fetch(`${api.getBaseUrl()}/api/health`);
      if (response.ok) {
        const data = await response.json();
        setModelStates(data.models_cached);
        if (data.current_engine) setCurrentEngine(data.current_engine);
      }
    } catch {
      setBackendHealthy(false);
    } finally {
      setCheckingHealth(false);
    }
  };

  const handleEngineChange = async (eng: string) => {
    setEngineUpdating(true);
    try {
      const updated = await api.setEngine(eng);
      setCurrentEngine(updated);
    } catch (err) {
      console.error("Failed to update engine:", err);
    } finally {
      setEngineUpdating(false);
    }
  };

  const handleFontSizeChange = (size: string) => {
    setFontSize(size);
    localStorage.setItem('fontSize', size);

    
    // Apply globally to HTML element
    const html = document.documentElement;
    html.classList.remove('text-sm', 'text-base', 'text-lg');
    if (size === 'sm') html.classList.add('text-sm');
    else if (size === 'lg') html.classList.add('text-lg');
  };

  return (
    <div className="max-w-4xl mx-auto w-full px-4 py-8 flex flex-col gap-8">
      
      {/* Page Title */}
      <div>
        <h2 className="text-2xl font-extrabold text-slate-800 dark:text-white tracking-tight">
          System Preferences
        </h2>
        <p className="text-sm text-slate-400 dark:text-slate-500 font-semibold mt-0.5">
          Configure interface options and check machine learning model loading states
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Main Settings Panel (Spans 2 columns) */}
        <div className="md:col-span-2 flex flex-col gap-6">
          
          {/* Card 1: Visual Theme */}
          <div className="glass-panel p-6 rounded-3xl border border-slate-200/50 dark:border-slate-800/60 shadow-md flex flex-col gap-4">
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
              <Sun className="w-5 h-5 text-amber-500" />
              Theme & Styling
            </h3>
            
            {/* Accent Color picker */}
            <div className="flex flex-col gap-2.5 mt-2">
              <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wide">
                Accent Theme
              </span>
              <div className="flex items-center gap-4">
                {[
                  { name: 'Indigo (Default)', val: '#6366F1', bg: 'bg-[#6366F1]' },
                  { name: 'Violet', val: '#7C3AED', bg: 'bg-[#7C3AED]' },
                  { name: 'Cyan', val: '#06B6D4', bg: 'bg-[#06B6D4]' }
                ].map((color) => (
                  <button
                    key={color.val}
                    onClick={() => setAccentColor(color.val)}
                    className="flex items-center gap-2 px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900/35 border border-slate-200 dark:border-slate-800 rounded-2xl hover:border-slate-350 text-xs font-bold text-slate-600 dark:text-slate-350 cursor-pointer"
                  >
                    <span className={`w-3.5 h-3.5 rounded-full ${color.bg} shrink-0`}></span>
                    <span>{color.name.split(' ')[0]}</span>
                    {accentColor === color.val && <Check className="w-3.5 h-3.5 text-primary ml-1 shrink-0" />}
                  </button>
                ))}
              </div>
            </div>

            {/* Font size picker */}
            <div className="flex flex-col gap-2.5 mt-2">
              <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wide flex items-center gap-1.5">
                <Type className="w-3.5 h-3.5" />
                Font Size
              </span>
              <div className="flex items-center gap-4">
                {[
                  { name: 'Small', val: 'sm' },
                  { name: 'Medium (Default)', val: 'md' },
                  { name: 'Large', val: 'lg' }
                ].map((size) => (
                  <button
                    key={size.val}
                    onClick={() => handleFontSizeChange(size.val)}
                    className={`px-4.5 py-2.5 border rounded-2xl text-xs font-bold transition-all ${
                      fontSize === size.val
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-slate-250 dark:border-slate-800 text-slate-500 hover:border-slate-400'
                    }`}
                  >
                    {size.name.split(' ')[0]}
                  </button>
                ))}
              </div>
            </div>

          </div>

          {/* Card 2: Accessibility and Animations */}
          <div className="glass-panel p-6 rounded-3xl border border-slate-200/50 dark:border-slate-800/60 shadow-md flex flex-col gap-4">
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
              <Sliders className="w-5 h-5 text-primary" />
              Accessibility & Animation
            </h3>

            {/* Animation speed slider */}
            <div className="flex flex-col gap-2">
              <div className="flex justify-between text-xs font-bold text-slate-405">
                <span>Transition Animations Speed</span>
                <span className="uppercase text-primary">{animSpeed}</span>
              </div>
              <input
                type="range"
                min="1"
                max="3"
                value={animSpeed === 'fast' ? 1 : animSpeed === 'normal' ? 2 : 3}
                onChange={(e) => {
                  const val = parseInt(e.target.value);
                  const speed = val === 1 ? 'fast' : val === 2 ? 'normal' : 'slow';
                  setAnimSpeed(speed);
                  localStorage.setItem('animSpeed', speed);
                }}
                className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-primary mt-2"
              />
              <div className="flex justify-between text-[10px] text-slate-400 dark:text-slate-500 font-bold px-1 mt-0.5">
                <span>Fast</span>
                <span>Normal</span>
                <span>Smooth/Slow</span>
              </div>
            </div>
          </div>

          {/* Card 3: AI Translation Engine Selection */}
          <div className="glass-panel p-6 rounded-3xl border border-slate-200/50 dark:border-slate-800/60 shadow-md flex flex-col gap-4">
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
              <Cpu className="w-5 h-5 text-primary" />
              Machine Translation Pipeline
            </h3>
            <p className="text-xs text-slate-400 dark:text-slate-500 font-medium">
              Choose the neural translation model used for text and speech translation.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-1">
              {[
                {
                  id: 'auto',
                  title: 'Auto (Recommended)',
                  desc: 'Uses cached NLLB if available, otherwise instant Cloud engine',
                  badge: 'Smart'
                },
                {
                  id: 'fast',
                  title: 'Fast Cloud',
                  desc: 'Instant zero-wait translation across all 15+ languages',
                  badge: 'Zero Download'
                },
                {
                  id: 'nllb',
                  title: 'Meta NLLB-200',
                  desc: 'Deep local neural sequence-to-sequence model',
                  badge: 'Neural Local'
                }
              ].map((engine) => (
                <button
                  key={engine.id}
                  type="button"
                  onClick={() => handleEngineChange(engine.id)}
                  disabled={engineUpdating}
                  className={`flex flex-col items-start p-4 rounded-2xl border text-left transition-all ${
                    currentEngine === engine.id
                      ? 'border-primary bg-primary/10 shadow-sm'
                      : 'border-slate-200 dark:border-slate-800/80 bg-white/50 dark:bg-slate-850/50 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  <div className="flex items-center justify-between w-full mb-1">
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-100">
                      {engine.title}
                    </span>
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                      currentEngine === engine.id
                        ? 'bg-primary text-white'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                    }`}>
                      {engine.badge}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 dark:text-slate-500 font-medium leading-relaxed">
                    {engine.desc}
                  </p>
                </button>
              ))}
            </div>
          </div>

        </div>


        {/* System Diagnostics Panel (Spans 1 column) */}
        <div className="md:col-span-1 flex flex-col gap-6">
          
          {/* Diagnostic Status Card */}
          <div className="glass-panel p-6 rounded-3xl border border-slate-200/50 dark:border-slate-800/60 shadow-md flex flex-col gap-5">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-success" />
                Health Checks
              </h3>
              
              <button
                onClick={checkHealth}
                disabled={checkingHealth}
                className="p-1.5 rounded-lg text-slate-450 hover:text-slate-650 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors disabled:opacity-40"
                title="Refresh Status"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${checkingHealth ? 'animate-spin' : ''}`} />
              </button>
            </div>

            {/* Health status bar */}
            <div className="flex items-center gap-3 p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/35 border border-slate-200/20 dark:border-slate-800">
              <div className={`w-3 h-3 rounded-full shrink-0 ${
                backendHealthy === true 
                  ? 'bg-success animate-pulse' 
                  : backendHealthy === false 
                    ? 'bg-danger' 
                    : 'bg-slate-350'
              }`}></div>
              <div className="flex flex-col">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-200">
                  Backend API Server
                </span>
                <span className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold uppercase mt-0.5">
                  {backendHealthy === true ? 'Connected / Online' : backendHealthy === false ? 'Disconnected / Offline' : 'Unchecked'}
                </span>
              </div>
            </div>

            {/* Model download indicators */}
            <div className="flex flex-col gap-3">
              <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wide">
                Local Neural Networks
              </span>

              {/* Whisper status */}
              <div className="flex items-center justify-between text-xs font-semibold p-3.5 rounded-xl border border-slate-150 dark:border-slate-800/80 bg-white dark:bg-slate-850">
                <div className="flex items-center gap-2 text-slate-750 dark:text-slate-300">
                  <Cpu className="w-4 h-4 text-primary" />
                  <span>Whisper ASR</span>
                </div>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  modelStates?.whisper 
                    ? 'bg-success/15 text-success' 
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                }`}>
                  {modelStates?.whisper ? 'Loaded/Cached' : 'Pending Load'}
                </span>
              </div>

              {/* NLLB status */}
              <div className="flex items-center justify-between text-xs font-semibold p-3.5 rounded-xl border border-slate-150 dark:border-slate-800/80 bg-white dark:bg-slate-850">
                <div className="flex items-center gap-2 text-slate-750 dark:text-slate-300">
                  <Database className="w-4 h-4 text-secondary" />
                  <span>NLLB-200 Distilled</span>
                </div>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  modelStates?.nllb 
                    ? 'bg-success/15 text-success' 
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                }`}>
                  {modelStates?.nllb ? 'Loaded/Cached' : 'Pending Load'}
                </span>
              </div>
            </div>

            {/* Note banner */}
            <div className="p-3.5 rounded-2xl bg-cyan-500/5 border border-cyan-500/10 text-[10px] leading-relaxed text-slate-400 dark:text-slate-455 font-medium flex gap-2">
              <Info className="w-4 h-4 text-accent shrink-0 mt-0.5" />
              <span>
                Models are initialized on first use, which downloads weights from Hugging Face and caches them in your local directory for subsequent offline runs.
              </span>
            </div>

          </div>

        </div>

      </div>

    </div>
  );
};

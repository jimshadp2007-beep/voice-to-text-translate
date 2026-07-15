import React, { useState, useEffect, useRef } from 'react';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { Home } from './pages/Home';
import { Translator } from './pages/Translator';
import { Dashboard } from './pages/Dashboard';
import { HistoryPage } from './pages/HistoryPage';
import { Settings } from './pages/Settings';
import { DocsTab } from './pages/DocsTab';
import { api } from './utils/api';
import type { Language, TranslationItem } from './utils/api';
import { Sparkles, Terminal } from 'lucide-react';

interface ConfettiParticle {
  x: number;
  y: number;
  color: string;
  size: number;
  speedY: number;
  speedX: number;
  rotation: number;
  rotationSpeed: number;
}

export default function App() {
  const [activeTab, setActiveTab] = useState('home');
  const [languages, setLanguages] = useState<Language[]>([]);
  const [history, setHistory] = useState<TranslationItem[]>([]);
  const [statsTrigger, setStatsTrigger] = useState(0);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Styling States
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('darkMode');
    return saved ? JSON.parse(saved) : true; // Default dark mode (Slate-900 bg)
  });
  const [accentColor, setAccentColor] = useState(() => {
    return localStorage.getItem('accentColor') || '#6366F1'; // Default Indigo
  });

  // Confetti State
  const [showConfetti, setShowConfetti] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Sync theme
  useEffect(() => {
    const root = window.document.documentElement;
    if (darkMode) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('darkMode', JSON.stringify(darkMode));
  }, [darkMode]);

  // Sync accent color via CSS Variables
  useEffect(() => {
    document.documentElement.style.setProperty('--color-primary', accentColor);
    localStorage.setItem('accentColor', accentColor);
  }, [accentColor]);

  // Hydrate languages and history
  useEffect(() => {
    const initApp = async () => {
      setLoading(true);
      setErrorMessage(null);
      try {
        const langData = await api.fetchLanguages();
        setLanguages(langData);
        
        const histData = await api.fetchHistory();
        setHistory(histData);
      } catch (err: any) {
        console.error(err);
        setErrorMessage("Could not connect to FastAPI server. Ensure backend/app/main.py is running on http://localhost:8000");
      } finally {
        setLoading(false);
      }
    };

    initApp();

    // Listen for custom report scroll trigger
    const showDocsHandler = () => setActiveTab('docs');
    window.addEventListener('show-docs-tab', showDocsHandler);
    return () => window.removeEventListener('show-docs-tab', showDocsHandler);
  }, []);

  // Confetti Canvas Loop
  useEffect(() => {
    if (!showConfetti || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const colors = ['#6366F1', '#7C3AED', '#06B6D4', '#22C55E', '#F59E0B', '#EF4444'];
    const particles: ConfettiParticle[] = [];

    // Initialize 100 particles
    for (let i = 0; i < 100; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * -canvas.height - 20,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: Math.random() * 8 + 6,
        speedY: Math.random() * 3 + 2,
        speedX: Math.random() * 2 - 1,
        rotation: Math.random() * 360,
        rotationSpeed: Math.random() * 4 - 2
      });
    }

    let animationId: number;
    let frameCount = 0;

    const update = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      frameCount++;

      let active = false;
      particles.forEach((p) => {
        p.y += p.speedY;
        p.x += p.speedX;
        p.rotation += p.rotationSpeed;

        if (p.y < canvas.height) {
          active = true;
        }

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rotation * Math.PI) / 180);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
        ctx.restore();
      });

      // Stop confetti after 200 frames (~3-4 seconds)
      if (active && frameCount < 200) {
        animationId = requestAnimationFrame(update);
      } else {
        setShowConfetti(false);
      }
    };

    update();
    return () => cancelAnimationFrame(animationId);
  }, [showConfetti]);

  // Trigger celebration confetti
  const triggerConfettiEffect = () => {
    setShowConfetti(true);
  };

  // Sync DB state actions
  const addHistoryItem = (item: TranslationItem) => {
    setHistory((prev) => [item, ...prev]);
    setStatsTrigger((prev) => prev + 1); // trigger stats recalculation
  };

  const handleToggleFavorite = async (id: number) => {
    try {
      const isFav = await api.toggleFavorite(id);
      setHistory((prev) => 
        prev.map((item) => 
          item.id === id ? { ...item, is_favorite: isFav } : item
        )
      );
      setStatsTrigger((prev) => prev + 1);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteHistoryItem = async (id: number) => {
    try {
      await api.deleteHistoryItem(id);
      setHistory((prev) => prev.filter((item) => item.id !== id));
      setStatsTrigger((prev) => prev + 1);
    } catch (err) {
      console.error(err);
    }
  };

  const handleClearHistory = async () => {
    try {
      await api.clearAllHistory();
      setHistory([]);
      setStatsTrigger((prev) => prev + 1);
    } catch (err) {
      console.error(err);
    }
  };

  // Inline styling for theme primary overrides
  const appStyles = {
    '--color-primary': accentColor,
  } as React.CSSProperties;

  return (
    <div 
      style={appStyles}
      className="min-h-screen flex flex-col font-sans transition-colors duration-300 bg-slate-50 text-slate-800 dark:bg-slate-900 dark:text-white grid-bg"
    >
      
      {/* Fullscreen Confetti Canvas */}
      {showConfetti && (
        <canvas 
          ref={canvasRef} 
          className="fixed top-0 left-0 w-full h-full pointer-events-none z-50"
        />
      )}

      {/* Global Navbar */}
      <Navbar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        darkMode={darkMode} 
        setDarkMode={setDarkMode} 
      />

      {/* Main Container */}
      <main className="flex-1 w-full relative z-10 flex flex-col justify-start">
        
        {/* Connection Failure Warn Header */}
        {errorMessage && (
          <div className="w-full bg-amber-500/10 border-b border-amber-500/20 px-4 py-3 text-center text-xs font-bold text-amber-600 dark:text-amber-400 flex items-center justify-center gap-1.5 shrink-0">
            <Terminal className="w-4 h-4" />
            <span>{errorMessage}</span>
            <button 
              onClick={() => window.location.reload()} 
              className="underline text-primary dark:text-primary-light hover:opacity-85 ml-1.5"
            >
              Retry Connection
            </button>
          </div>
        )}

        {/* Global Loading screen (while fetching languages) */}
        {loading ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-3 py-24">
            <div className="w-12 h-12 rounded-2xl border-4 border-slate-200 border-t-primary animate-spin"></div>
            <p className="text-xs text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider">
              Initializing AI Translator...
            </p>
          </div>
        ) : (
          /* Tab router rendering */
          <>
            {activeTab === 'home' && (
              <Home onGetStarted={() => setActiveTab('translator')} />
            )}
            
            {activeTab === 'translator' && (
              <Translator 
                languages={languages} 
                addHistoryItem={addHistoryItem} 
                triggerConfetti={triggerConfettiEffect} 
              />
            )}
            
            {activeTab === 'dashboard' && (
              <Dashboard statsTrigger={statsTrigger} />
            )}
            
            {activeTab === 'history' && (
              <HistoryPage 
                history={history} 
                setHistory={setHistory} 
                onDeleteHistoryItem={handleDeleteHistoryItem} 
                onToggleFavorite={handleToggleFavorite} 
                onClearHistory={handleClearHistory} 
              />
            )}
            
            {activeTab === 'settings' && (
              <Settings 
                darkMode={darkMode} 
                setDarkMode={setDarkMode} 
                accentColor={accentColor} 
                setAccentColor={setAccentColor} 
              />
            )}

            {activeTab === 'docs' && (
              <DocsTab />
            )}
          </>
        )}
      </main>

      {/* Global Footer */}
      <Footer />
    </div>
  );
}

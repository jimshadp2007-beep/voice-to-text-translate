import React from 'react';
import { motion } from 'framer-motion';
import { Mic, ArrowRight, Shield, Zap, Sparkles, BarChart, FileJson } from 'lucide-react';

interface HomeProps {
  onGetStarted: () => void;
}

export const Home: React.FC<HomeProps> = ({ onGetStarted }) => {
  
  // Animation variants for Framer Motion
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { type: "spring", stiffness: 100 }
    }
  };

  const floatingBlobVariants = {
    animate1: {
      y: [0, -30, 0],
      x: [0, 20, 0],
      scale: [1, 1.1, 1],
      transition: { duration: 8, repeat: Infinity, ease: "easeInOut" }
    },
    animate2: {
      y: [0, 40, 0],
      x: [0, -30, 0],
      scale: [1, 0.9, 1],
      transition: { duration: 10, repeat: Infinity, ease: "easeInOut" }
    }
  };

  return (
    <div className="relative min-h-[85vh] w-full flex items-center justify-center overflow-hidden py-12 px-4 md:px-8">
      
      {/* Background Floating Blobs */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none -z-10">
        <motion.div 
          variants={floatingBlobVariants}
          animate="animate1"
          className="absolute -top-10 left-10 w-72 h-72 rounded-full bg-primary/10 dark:bg-primary/20 blur-3xl"
        />
        <motion.div 
          variants={floatingBlobVariants}
          animate="animate2"
          className="absolute bottom-10 right-10 w-96 h-96 rounded-full bg-accent/10 dark:bg-accent/15 blur-3xl"
        />
      </div>

      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="max-w-6xl mx-auto flex flex-col items-center text-center gap-8 relative z-10"
      >
        
        {/* Academic Tag */}
        <motion.div 
          variants={itemVariants}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-primary/20 bg-primary/5 dark:bg-primary/10 text-primary dark:text-primary-light text-xs font-bold uppercase tracking-wider"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Deep Learning Transformer Capstone</span>
        </motion.div>

        {/* Hero Headline */}
        <motion.div variants={itemVariants} className="max-w-4xl">
          <h1 className="text-4xl md:text-6xl font-extrabold text-slate-800 dark:text-white tracking-tight leading-tight md:leading-none">
            AI Multilingual <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary via-secondary to-accent">Voice-to-Text</span> Translator
          </h1>
          <p className="text-base md:text-xl text-slate-500 dark:text-slate-400 mt-4 max-w-2xl mx-auto font-medium">
            Record audio, detect languages instantly, and translate speech using OpenAI Whisper ASR and Meta NLLB-200. Fully optimized to run locally on your system.
          </p>
        </motion.div>

        {/* Action Button (Animated Mic Icon) */}
        <motion.div variants={itemVariants} className="flex flex-col sm:flex-row gap-4 items-center justify-center">
          
          <button
            onClick={onGetStarted}
            className="group flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-primary to-secondary hover:from-primary-dark hover:to-secondary-dark text-white rounded-2xl font-bold shadow-lg shadow-primary/20 hover:shadow-primary/35 transition-all text-base transform hover:-translate-y-0.5 active:translate-y-0"
          >
            <Mic className="w-5 h-5 group-hover:scale-110 transition-transform" />
            <span>Launch Translator</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>

          <a
            href="#"
            onClick={(e) => {
              e.preventDefault();
              const event = new CustomEvent('show-docs-tab');
              window.dispatchEvent(event);
            }}
            className="flex items-center gap-2 px-6 py-4 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-350 rounded-2xl font-bold text-base transition-colors"
          >
            <span>Read Report</span>
          </a>
        </motion.div>

        {/* Feature Cards Grid */}
        <motion.div 
          variants={itemVariants}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full mt-10"
        >
          
          {/* Card 1 */}
          <div className="glass-panel p-6 rounded-3xl flex flex-col items-center text-center shadow-md dark:shadow-slate-950/20 transform hover:-translate-y-1 transition-all border border-slate-200/50 dark:border-slate-800/60">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 dark:bg-primary/25 flex items-center justify-center text-primary mb-4 shadow-sm">
              <Mic className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">
              Whisper Speech-to-Text
            </h3>
            <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase mt-1 tracking-wider">
              OpenAI Whisper Tiny/Base
            </p>
            <p className="text-sm mt-3 text-slate-500 dark:text-slate-400 font-medium">
              High-accuracy speech recognition. Features automatic source language identification and robust noise cancellation utilities.
            </p>
          </div>

          {/* Card 2 */}
          <div className="glass-panel p-6 rounded-3xl flex flex-col items-center text-center shadow-md dark:shadow-slate-950/20 transform hover:-translate-y-1 transition-all border border-slate-200/50 dark:border-slate-800/60">
            <div className="w-12 h-12 rounded-2xl bg-secondary/10 dark:bg-secondary/25 flex items-center justify-center text-secondary mb-4 shadow-sm">
              <Zap className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">
              Meta NLLB-200 Translation
            </h3>
            <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase mt-1 tracking-wider">
              facebook/nllb-200-distilled
            </p>
            <p className="text-sm mt-3 text-slate-500 dark:text-slate-400 font-medium">
              State-of-the-art Neural Machine Translation (NMT). Mandatory high-quality Malayalam support and fast translation across 15 target languages.
            </p>
          </div>

          {/* Card 3 */}
          <div className="glass-panel p-6 rounded-3xl flex flex-col items-center text-center shadow-md dark:shadow-slate-950/20 transform hover:-translate-y-1 transition-all border border-slate-200/50 dark:border-slate-800/60">
            <div className="w-12 h-12 rounded-2xl bg-accent/10 dark:bg-accent/25 flex items-center justify-center text-accent mb-4 shadow-sm">
              <BarChart className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">
              Interactive Dashboard
            </h3>
            <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase mt-1 tracking-wider">
              SQLite + Recharts Engine
            </p>
            <p className="text-sm mt-3 text-slate-500 dark:text-slate-400 font-medium">
              Tracks history entries and compiles analytics on word count, translation frequency, duration, and confidence ratios in real-time.
            </p>
          </div>

        </motion.div>

        {/* Model Architecture Quick Infographic */}
        <motion.div 
          variants={itemVariants}
          className="w-full mt-10 p-6 rounded-3xl glass-panel text-left flex flex-col md:flex-row items-center gap-6 border border-slate-200/50 dark:border-slate-800/60"
        >
          <div className="md:w-1/3">
            <h4 className="text-base font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
              <Shield className="w-5 h-5 text-primary" />
              Academic Standards
            </h4>
            <p className="text-xs mt-2 text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
              This Capstone Project demonstrates deep learning engineering, pipeline orchestration, model caching, audio processing, and responsive web design. Ideal for college submissions.
            </p>
          </div>
          <div className="md:w-2/3 w-full grid grid-cols-5 items-center gap-2.5 text-center text-xs font-bold text-slate-500 dark:text-slate-400">
            <div className="p-3 bg-slate-100 dark:bg-slate-800/60 rounded-2xl border border-slate-200/20">Mic Input</div>
            <div className="text-primary font-bold text-lg">&rarr;</div>
            <div className="p-3 bg-slate-100 dark:bg-slate-800/60 rounded-2xl border border-slate-200/20">ASR (Whisper)</div>
            <div className="text-secondary font-bold text-lg">&rarr;</div>
            <div className="p-3 bg-slate-100 dark:bg-slate-800/60 rounded-2xl border border-slate-200/20">NMT (NLLB)</div>
          </div>
        </motion.div>

      </motion.div>
    </div>
  );
};

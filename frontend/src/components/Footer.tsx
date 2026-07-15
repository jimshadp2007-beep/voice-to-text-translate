import React from 'react';
import { Github, FileText, Cpu, Heart } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="w-full mt-auto py-8 px-4 border-t border-slate-200/50 dark:border-slate-800/50 bg-white dark:bg-slate-900 text-slate-400 dark:text-slate-500 transition-colors">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
        
        {/* Academic Details */}
        <div className="text-center md:text-left">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center justify-center md:justify-start gap-1">
            <Cpu className="w-3.5 h-3.5 text-primary" />
            AI-Powered Multilingual Voice Translator
          </p>
          <p className="text-xs mt-1 font-medium text-slate-400 dark:text-slate-500">
            Final Year Capstone Project — Deep Learning & NLP
          </p>
        </div>

        {/* Mid section: Heart credits */}
        <div className="flex items-center gap-1.5 text-xs font-medium text-slate-400 dark:text-slate-500">
          <span>Developed with</span>
          <Heart className="w-3.5 h-3.5 text-red-500 fill-current animate-pulse" />
          <span>using PyTorch & React</span>
        </div>

        {/* References and Source Links */}
        <div className="flex items-center gap-4.5 text-xs font-semibold">
          <a
            href="https://github.com"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 hover:text-slate-700 dark:hover:text-slate-300 transition-colors"
          >
            <Github className="w-3.5 h-3.5" />
            <span>GitHub Repository</span>
          </a>
          <span className="text-slate-200 dark:text-slate-800">|</span>
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault();
              // Scroll to project documentation or trigger a download/tab
              const event = new CustomEvent('show-docs-tab');
              window.dispatchEvent(event);
            }}
            className="flex items-center gap-1 hover:text-slate-700 dark:hover:text-slate-300 transition-colors"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Project Report</span>
          </a>
        </div>
        
      </div>
      
      <div className="max-w-7xl mx-auto mt-6 pt-4 border-t border-slate-100 dark:border-slate-800/40 text-center text-[10px] font-medium text-slate-400 dark:text-slate-600">
        &copy; {new Date().getFullYear()} AI Translator Capstone. All rights reserved. Models powered by OpenAI Whisper and Meta NLLB-200.
      </div>
    </footer>
  );
};

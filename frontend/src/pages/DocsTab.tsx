import React, { useState } from 'react';
import { 
  FileText, Shield, Layers, HelpCircle, Download, BookOpen, 
  Terminal, Award, BookCheck, Info, Check, Copy
} from 'lucide-react';

export const DocsTab: React.FC = () => {
  const [activeSection, setActiveSection] = useState<'overview' | 'model' | 'viva'>('overview');
  const [copiedId, setCopiedId] = useState<number | null>(null);

  const sections = [
    { id: 'overview', label: 'Project Overview', icon: BookOpen },
    { id: 'model', label: 'Transformer Architecture', icon: Layers },
    { id: 'viva', label: 'Viva Q&A Prep', icon: HelpCircle }
  ] as const;

  const copyAnswer = (text: string, id: number) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const vivaQuestions = [
    {
      q: "What is OpenAI Whisper, and how does it function in your system?",
      a: "Whisper is a state-of-the-art automatic speech recognition (ASR) model trained on 680,000 hours of multilingual, supervised audio. In our project, it takes 16kHz mono audio streams, identifies speech patterns, automatically detects the source language (including Malayalam, Hindi, etc.) based on first token probabilities, and generates transcription text."
    },
    {
      q: "Explain Meta NLLB-200 and why it was selected.",
      a: "NLLB-200 (No Language Left Behind) is a massive multilingual Seq2Seq transformer model trained by Meta that translates across 200+ languages. We chose NLLB-200 because it features high-quality, specialized translation support for low-resource languages like Malayalam, Tamil, Telugu, and Kannada, where traditional translator models fail."
    },
    {
      q: "What is BLEU, and how is it used to evaluate translations?",
      a: "BLEU (Bilingual Evaluation Understudy) measures the overlap between a model's translation and a set of human references using n-gram precision. Scores range from 0 to 1 (or 0% to 100%). In our capstone project, NLLB-200 models achieve high BLEU scores (above 35.0 on FLORES-200 benchmarks) for regional Indic languages."
    },
    {
      q: "How does the system handle real-world audio noise?",
      a: "The backend uses a spectral subtractive noise reduction filter. It processes incoming audio frequencies, computes the average background noise signal profile, and attenuates stationary noise bands before feeding the audio array to Whisper, reducing Word Error Rates (WER) in noisy environments."
    },
    {
      q: "What database architecture is deployed and why?",
      a: "We deploy SQLite managed by SQLAlchemy. SQLite provides a zero-configuration, self-contained relational database file. It is ideal for local desktop or evaluation environments, registering translations and compiling analytics without running a separate database server."
    }
  ];

  return (
    <div className="max-w-6xl mx-auto w-full px-4 py-8 grid grid-cols-1 md:grid-cols-4 gap-8">
      
      {/* Sidebar Navigation */}
      <div className="md:col-span-1 flex flex-col gap-3">
        <span className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider ml-1">
          Documentation Tabs
        </span>
        {sections.map((sec) => {
          const Icon = sec.icon;
          const isActive = activeSection === sec.id;
          return (
            <button
              key={sec.id}
              onClick={() => setActiveSection(sec.id)}
              className={`flex items-center gap-2.5 px-4.5 py-3 rounded-2xl text-sm font-bold text-left transition-all ${
                isActive 
                  ? 'bg-primary text-white shadow-md shadow-primary/10' 
                  : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 bg-slate-50/50 dark:bg-slate-900/10 border border-slate-200/20 dark:border-slate-800/60'
              }`}
            >
              <Icon className="w-4.5 h-4.5" />
              <span>{sec.label}</span>
            </button>
          );
        })}
      </div>

      {/* Main Documentation Content Area */}
      <div className="md:col-span-3 glass-panel p-6 md:p-8 rounded-3xl border border-slate-200/50 dark:border-slate-800/60 shadow-md">
        
        {/* SECTION 1: OVERVIEW */}
        {activeSection === 'overview' && (
          <div className="flex flex-col gap-6">
            <div>
              <h3 className="text-xl font-extrabold text-slate-800 dark:text-white">
                AI Voice-to-Text Translator Project Overview
              </h3>
              <p className="text-xs text-slate-400 font-semibold mt-1">
                Final Year B.Tech Capstone Project Technical Architecture
              </p>
            </div>

            <div className="flex flex-col gap-4 text-sm text-slate-600 dark:text-slate-350 leading-relaxed font-medium">
              <h4 className="text-base font-bold text-slate-800 dark:text-slate-200">
                1. Problem Statement
              </h4>
              <p>
                In an increasingly globalized society, language barriers continue to divide populations. Existing software translates text effectively but struggles with regional languages such as Malayalam, Tamil, or Telugu. Speech recognition of regional dialects is also highly inaccurate in noise. Our Capstone Project builds a complete, local, privacy-respecting multilingual voice-to-text pipeline utilizing Deep Learning Transformer models.
              </p>

              <h4 className="text-base font-bold text-slate-800 dark:text-slate-200 mt-2">
                2. Key Project Objectives
              </h4>
              <ul className="list-disc pl-5 flex flex-col gap-2">
                <li>Capture microphone voice recording natively in browser and process in real-time.</li>
                <li>Transcribe audio signals into text using OpenAI Whisper with automatic source language identification.</li>
                <li>Integrate Meta NLLB-200 distilled translation to translate recognized text into Malayalam (mandatory) and 14 other languages.</li>
                <li>Synthesize translations into speech streams using Edge-TTS with pitch/speed adjustments.</li>
                <li>Provide relational persistence (SQLite) for translator audits and Recharts stats.</li>
              </ul>
            </div>

            <div className="flex items-center gap-3 p-4 bg-slate-50 dark:bg-slate-900/35 border border-slate-150 dark:border-slate-800/65 rounded-2xl text-xs mt-2">
              <Award className="w-6 h-6 text-primary shrink-0" />
              <div className="font-medium text-slate-550 dark:text-slate-400">
                <span className="font-bold text-slate-800 dark:text-slate-200 block mb-0.5">Academic Submission Ready</span>
                Complete project report files, presentation slides outlines, and viva questions guides are created inside the project root under the <code className="text-primary font-bold">/docs</code> folder directory.
              </div>
            </div>
          </div>
        )}

        {/* SECTION 2: TRANSFORMER DETAILS */}
        {activeSection === 'model' && (
          <div className="flex flex-col gap-6">
            <div>
              <h3 className="text-xl font-extrabold text-slate-800 dark:text-white">
                Deep Learning Transformer Architecture
              </h3>
              <p className="text-xs text-slate-400 font-semibold mt-1">
                Understanding Sequence-to-Sequence (Seq2Seq) Attention Models
              </p>
            </div>

            <div className="flex flex-col gap-4 text-sm text-slate-600 dark:text-slate-350 leading-relaxed font-medium">
              <h4 className="text-base font-bold text-slate-800 dark:text-slate-200">
                1. Multi-Head Self-Attention
              </h4>
              <p>
                The core innovation of Transformers is <strong>Self-Attention</strong>. It allows inputs (words/audio frames) to weigh themselves against all other positions, capturing long-range semantic dependencies. Mathematically, it operates on Queries (Q), Keys (K), and Values (V):
              </p>
              
              <div className="bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4.5 rounded-2xl font-mono text-xs text-slate-700 dark:text-cyan-400 flex items-center justify-center">
                Attention(Q, K, V) = softmax( (Q * K^T) / sqrt(d_k) ) * V
              </div>

              <p>
                <strong>Multi-Head Attention</strong> expands this by allowing the model to jointly attend to information from different representation subspaces at different positions, boosting performance on complex multilingual translations.
              </p>

              <h4 className="text-base font-bold text-slate-800 dark:text-slate-200 mt-2">
                2. Whisper ASR Architecture
              </h4>
              <p>
                Whisper is structured as an <strong>Encoder-Decoder Transformer</strong>. Audio spectrograms are processed through two 1D convolutional layers with a GELU activation, and then fed into a standard Transformer Encoder. The Transformer Decoder predicts subsequent text tokens, conditioned on the Encoder outputs and special target tokens representing language task configurations.
              </p>

              <h4 className="text-base font-bold text-slate-800 dark:text-slate-200 mt-2">
                3. machine Translation Benchmarks
              </h4>
              <p>
                Meta NLLB-200 leverages a Sparsely-Gated Mixture-of-Experts (MoE) architecture alongside dense architectures to scale parameter sizes efficiently. Benchmarked on FLORES-200, NLLB distilled 600M achieves outstanding BLEU scores, outperforming classic MarianMT and MBART systems, making it the perfect engine for regional Indic translations.
              </p>
            </div>
          </div>
        )}

        {/* SECTION 3: VIVA QUESTIONS */}
        {activeSection === 'viva' && (
          <div className="flex flex-col gap-6">
            <div>
              <h3 className="text-xl font-extrabold text-slate-800 dark:text-white">
                Capstone Viva Q&A Guide
              </h3>
              <p className="text-xs text-slate-400 font-semibold mt-1">
                Mastering the final year review questions
              </p>
            </div>

            <div className="flex flex-col gap-5">
              {vivaQuestions.map((qa, index) => (
                <div 
                  key={index}
                  className="p-5 border border-slate-150 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/35 rounded-2xl flex flex-col gap-2.5"
                >
                  <div className="flex justify-between items-start">
                    <span className="text-xs font-extrabold text-primary uppercase tracking-wide">
                      Question {index + 1}
                    </span>
                    <button
                      type="button"
                      onClick={() => copyAnswer(`${qa.q}\nAnswer: ${qa.a}`, index)}
                      className="p-1 rounded text-slate-400 hover:text-slate-650 dark:hover:text-white hover:bg-slate-200/50 dark:hover:bg-slate-800"
                      title="Copy Q&A"
                    >
                      {copiedId === index ? <Check className="w-3.5 h-3.5 text-success" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                  <h4 className="text-sm font-extrabold text-slate-850 dark:text-white leading-relaxed">
                    {qa.q}
                  </h4>
                  <p className="text-xs font-semibold text-slate-450 dark:text-slate-500 leading-normal border-l-2 border-slate-250 dark:border-slate-700 pl-3.5 py-1">
                    {qa.a}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>

    </div>
  );
};

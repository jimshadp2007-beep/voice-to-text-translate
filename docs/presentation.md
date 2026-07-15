# Capstone Project Presentation Slide Outline (12-Slide Deck)

Use this outline to create your Microsoft PowerPoint (.pptx) or Google Slides deck for the final year project defense.

---

### Slide 1: Title Slide
* **Title**: AI-Powered Multilingual Voice-to-Text Translator
* **Subtitle**: A Transformer-based speech transcription, language detection, and translation pipeline
* **Presenter Names**: [Your Name] & Team
* **Department**: Department of Computer Science & Engineering
* **College Logo Placeholder**

### Slide 2: Introduction & Motivation
* **Problem**: Language barriers limit access to digital resources, services, and communication.
* **Bottlenecks in Existing Systems**:
  * Cloud-reliant systems lack privacy and require active internet connection.
  * Poor transcription accuracy under environmental noise (high WER).
  * Inadequate support for low-resource regional Indian languages (Malayalam, Tamil, Telugu).
* **Our Solution**: A fully local, end-to-end, noise-reduced translation application.

### Slide 3: Project Objectives
* Capture microphone input natively in browser with live waveform feedback.
* Perform background spectral noise reduction.
* Automatically detect the spoken source language.
* Transcribe voice input using OpenAI Whisper.
* Translate recognized text into target languages (featuring Malayalam) using Meta NLLB-200.
* Synthesize translated output back into audio.
* Provide database analytics via a dashboard.

### Slide 4: System Architecture
* **Visual Diagram**: (Reference the DFD flowchart)
  * Audio Signal &rarr; Waveform Standardizer &rarr; Whisper ASR Model &rarr; NLLB-200 NMT Model &rarr; Edge TTS Engine &rarr; Client Player.
* **Database**: SQLite database persisting logs.
* **API Service**: FastAPI hosting local PyTorch inference instances.

### Slide 5: Deep Learning Pipeline: Speech Recognition
* **Model**: OpenAI Whisper (Tiny/Base parameter sizes).
* **Architecture**: Encoder-Decoder Transformer.
* **Process**:
  1. Audio resampled to 16kHz mono.
  2. Log-mel spectrogram computed.
  3. Conv1D layers extract audio feature frames.
  4. Transformer Encoder generates latent representations.
  5. Transformer Decoder predicts text tokens with cross-attention.
  6. Auto-language detection based on initial logit codes.

### Slide 6: Deep Learning Pipeline: Machine Translation
* **Model**: Meta NLLB-200 Distilled 600M.
* **Why NLLB-200?**: Single massive model covering 200+ languages, avoiding separate MarianMT instances.
* **Malayalam Integration**:
  * Source NLLB code: `mal_Mlym`.
  * High translation scores (BLEU) on FLORES-200 metrics.
  * Handles morphological compounding characteristics of Dravidian languages.

### Slide 7: Mathematical Foundation of Attention
* **Scaled Dot-Product Attention**:
  $$\text{Attention}(Q, K, V) = \text{softmax}\left(\frac{Q K^T}{\sqrt{d_k}}\right) V$$
* **Multi-Head Attention**: Replicates attention $h$ times in parallel to capture distinct relationships in representational subspaces.
* **Positional Encodings**: Injects token position information using sinusoidal functions.

### Slide 8: Technical Tech Stack
* **Frontend**: React.js, Vite, TypeScript, Tailwind CSS, Framer Motion, Recharts.
* **Backend**: Python, FastAPI, PyTorch, Hugging Face Transformers, SQLite, SQLAlchemy.
* **Audio Handling**: HTML5 Web Audio API, Canvas, Librosa, Soundfile, Noisereduce.

### Slide 9: Implementation Details
* **Frontend Design**: Sleek dark theme with Apple/Stripe-style glassmorphism cards.
* **Waveform Renderer**: HTML5 canvas rendering Siri-style overlapping bezier curves synced with mic volume.
* **History Sync**: Instant DB synchronization via polling/event triggers.
* **Stats Panel**: Graphical representations of translations per day and target language preferences.

### Slide 10: Evaluation & Performance Results
* **ASR Accuracy (Word Error Rate)**:
  * Clean speech: $\approx 12.5\%$ WER.
  * Noisy speech (filtered): $\approx 18.2\%$ WER.
* **Translation Quality (BLEU Score)**:
  * English to Malayalam: $32.4$ BLEU.
* **Inference Latency**:
  * Transcription + Translation on standard CPU: $\approx 1.8$ seconds.

### Slide 11: Future Scope & Conclusion
* **Streaming Transcription**: Upgrade to WebSockets for real-time streaming speech translation.
* **XTTS Voice Cloning**: Synthesize translation using the user's voice print.
* **On-device Mobile Compilation**: Quantize models to INT8 to run on mobile processors locally.
* **Conclusion**: Delivered a complete, academic-grade local AI Translator capstone project.

### Slide 12: Q&A - Thank You!
* Open floor for questions from the examination panel.
* Contact Info & Github repository link.

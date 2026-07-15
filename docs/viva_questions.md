# Capstone Project Viva Prep Guide (25 Questions & Answers)

This guide prepares you for questions from examiners during your project defense.

---

### Q1: What is the main objective of this project?
**Answer**: To build an AI-powered multilingual voice translator that records user speech, converts it to text (Automatic Speech Recognition), translates it to a target language (Neural Machine Translation), and synthesizes it back to speech (Text-to-Speech) using state-of-the-art local Transformer models, with specific support for Malayalam and other Indic languages.

### Q2: What deep learning models are used in your system?
**Answer**:
* **Speech Recognition**: OpenAI Whisper (Tiny/Base version) for acoustic audio transcription and automatic source language identification.
* **Translation**: Meta's NLLB-200 (No Language Left Behind, 600M distilled version) for machine translation.
* **Speech Synthesis**: Edge-TTS (Natural high-fidelity voice generator).

### Q3: What is the Transformer architecture?
**Answer**: The Transformer is a deep learning architecture introduced in 2017 by Vaswani et al. It relies entirely on self-attention mechanisms to capture global dependencies between inputs and outputs, bypassing recurrence (LSTMs) and convolutions, enabling massive parallelization during training.

### Q4: Explain the self-attention formula.
**Answer**: It is defined as:
$$\text{Attention}(Q, K, V) = \text{softmax}\left(\frac{Q K^T}{\sqrt{d_k}}\right) V$$
Where $Q$ (Query), $K$ (Key), and $V$ (Value) are projections of the input. $d_k$ is the dimensionality of the keys, acting as a scaling factor to keep gradients stable.

### Q5: Why are Positional Encodings necessary in Transformers?
**Answer**: Transformers process all tokens in a sequence simultaneously, lacking inherent knowledge of order. Positional encodings (sine and cosine wave values of different frequencies) are added to the input embeddings to convey word order information to the model.

### Q6: How does Whisper automatically detect the language spoken?
**Answer**: When Whisper processes audio features through its encoder, the decoder starts generating tokens. The first few tokens are special metadata tokens. The decoder predicts the language code token (e.g., `<|ml|>` for Malayalam) based on the maximum probability logit of the first output.

### Q7: Why did you choose Meta NLLB-200 over MarianMT?
**Answer**: Helsinki-NLP MarianMT models are bilingual (translating only one language pair per model), requiring multiple model downloads. NLLB-200 is a single, massively multilingual model that translates directly between 200+ languages, showing state-of-the-art results for low-resource Indic languages.

### Q8: What audio preprocessing is done before sending the file to Whisper?
**Answer**: The backend resamples incoming files to a standard sample rate of 16,000 Hz (mono channel) and applies spectral subtractive noise reduction. Whisper expects 16kHz WAV format natively.

### Q9: Why is PyTorch used instead of TensorFlow?
**Answer**: PyTorch provides dynamic computation graphs (eager execution), native support for the Hugging Face Transformers ecosystem, faster prototyping, and simpler debugging, making it the industry standard for research and NLP deployment.

### Q10: How does your database capture translation statistics?
**Answer**: We use SQLite with SQLAlchemy. Each time a translation succeeds, the backend inserts a row containing timestamps, character counts, audio durations, detected languages, target languages, and confidence scores. The dashboard queries this table to group counts and construct charts.

### Q11: What is the Word Error Rate (WER)?
**Answer**: WER is the standard metric for ASR. It measures the edit distance between a model's transcription and a reference text:
$$\text{WER} = \frac{\text{Substitutions} + \text{Deletions} + \text{Insertions}}{\text{Number of reference words}}$$

### Q12: What is the BLEU score?
**Answer**: BLEU (Bilingual Evaluation Understudy) measures translation accuracy by comparing candidate sentences with human reference translations using n-gram precision matches.

### Q13: What is the difference between CPU and GPU inference in your project?
**Answer**: GPU inference (using PyTorch CUDA) is significantly faster due to the parallel tensor calculations in attention heads. However, to ensure portability on standard student laptops, our system uses distilled weights (like Whisper-Tiny and NLLB-600M) that run in under 2 seconds on standard CPUs.

### Q14: How does the front-end capture audio?
**Answer**: The frontend uses the HTML5 `MediaRecorder` API to access microphone input streams. It feeds this stream into an `AudioContext` and `AnalyserNode` to extract real-time frequency data, which is rendered as a moving wave on an HTML5 canvas.

### Q15: What formats can users upload to translate?
**Answer**: MP3, WAV, AAC, FLAC, M4A, and MP4. The backend uses the `librosa` library to decode these formats and output standardized 16kHz WAV streams.

### Q16: How do you achieve the glassmorphic styling?
**Answer**: We use Tailwind CSS backdrop-blur utilities: `bg-white/70 backdrop-blur-xl border border-white/20`. This applies a real-time Gaussian blur to elements behind the cards, creating a modern, semi-transparent frosted-glass aesthetic.

### Q17: What does the term "fine-tuning" mean?
**Answer**: Fine-tuning is the process of taking a pre-trained model (trained on massive datasets) and training it further on a smaller, task-specific dataset (like IndicSpeech or Common Voice) to adapt it to specific dialects or domains.

### Q18: What loss function is used to train these models?
**Answer**: Standard Seq2Seq models use Cross-Entropy loss calculated at each token prediction step during decoding.

### Q19: Why is edge-tts preferred over local TTS models in the backend?
**Answer**: Local TTS models (like Coqui TTS) require compiling C++ libraries, visual studio tools, and heavy disk space, which frequently crash on local student systems. `edge-tts` provides high-fidelity, natural neural speech voice streams without dependencies or API keys.

### Q20: Explain the significance of the Malayalam support in your project.
**Answer**: Malayalam is a low-resource Dravidian language with complex grammatical morphology and compounding letters. Integrating NLLB-200 (`mal_Mlym`) and the Malayalam Edge voice (`ml-IN-MidhunNeural`) demonstrates real-world applicability for non-European, regional Indian dialects.

### Q21: What is the purpose of the noise reduction filter?
**Answer**: Background hums, fan noises, and static degrade Whisper's transcription accuracy. Our backend applies a spectral gate that filters out static frequencies below a specific amplitude threshold, isolating the vocal signal.

### Q22: What are the main backend endpoints?
**Answer**:
* `POST /api/translate-audio`: Transcribes audio, translates, generates TTS, saves history.
* `POST /api/translate-text`: Translates text input, saves history.
* `GET /api/history`: Returns historical logs.
* `GET /api/dashboard/stats`: Returns aggregated analytics and timelines.

### Q23: How do you handle CORS in FastAPI?
**Answer**: We import and add `CORSMiddleware` to our FastAPI application, allowing requests from our React Vite origin (usually `http://localhost:5173`).

### Q24: What is the fallback for Text-To-Speech if the backend is offline?
**Answer**: The client-side Web Speech API (`window.speechSynthesis`) is integrated as a local fallback, allowing in-browser speech synthesis.

### Q25: How is this project structured for production deployment?
**Answer**: The project is containerized using Docker. We provide a `docker-compose.yml` file coordinating two containers: one running the FastAPI backend (with cached model weights) and one running the React Vite static server.

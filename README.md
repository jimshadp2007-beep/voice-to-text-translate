# AI Multilingual Voice-to-Text Translator

An AI-powered local translation web application built as a Final Year Capstone Project. It captures audio from the microphone, converts speech into text, automatically identifies the spoken language, translates it into regional languages (Malayalam, Hindi, Tamil, Arabic, etc.), and synthesizes the translation back into speech.

---

## 🚀 Key Features

* **Real-time Recording & Waveform Visualizer**: Captures mic inputs, displaying glowing visual curves (Siri-style) on an HTML5 canvas.
* **Spectral Noise Cancellation**: Cleans environmental noise from input files before passing them to the AI pipeline.
* **Auto-Language Detection**: Whisper ASR automatically identifies the source language.
* **Meta NLLB-200 Translation**: Translates text into **Malayalam (mandatory)** and 14 other target languages.
* **Text-to-Speech (TTS) Engine**: Plays translations in natural neural voices with speed controls.
* **Relational Database Logs**: Syncs translation records (timestamps, character counts, confidence ratios) with a local SQLite DB.
* **Dashboard Analytics**: Renders charts (weekly trends, language popularity) using Recharts.
* **System Customizations**: Supports dark/light mode toggle, custom themes (Indigo, Violet, Cyan), and accessibility settings.

---

## 🛠️ Technology Stack

* **Frontend**: React.js (Vite + TypeScript), Tailwind CSS, Framer Motion, Recharts, Lucide Icons.
* **Backend**: Python 3.11, FastAPI, PyTorch, Hugging Face Transformers (`transformers`), SQLAlchemy, SQLite, Librosa, Noisereduce.
* **Models**:
  * **Speech Recognition**: OpenAI Whisper (`openai/whisper-tiny` by default for fast CPU run)
  * **Translation**: Meta NLLB-200 (`facebook/nllb-200-distilled-600M`)
  * **Speech Synthesis**: Edge-TTS API

---

## 📦 Project Structure

```text
├── backend/
│   ├── app/
│   │   ├── config.py         # App configurations & languages
│   │   ├── database.py       # SQLite connection manager
│   │   ├── models_db.py      # SQLAlchemy TranslationHistory schema
│   │   ├── pipeline.py       # PyTorch ML Whisper & NLLB wrappers
│   │   ├── utils.py          # Audio resampling & spectral denoiser
│   │   └── main.py           # FastAPI entrypoint & router
│   ├── Dockerfile.backend
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── components/       # Visualizer, Dropdown, Navbar, Footer
│   │   ├── hooks/            # useRecorder mic hook
│   │   ├── pages/            # Home, Translator, Dashboard, History, Settings
│   │   ├── utils/            # api client
│   │   ├── App.tsx
│   │   └── index.css
│   ├── Dockerfile.frontend
│   ├── tailwind.config.js
│   └── package.json
├── docs/                     # Capstone Project Report, PPT slides, Viva prep, Demo scripts
├── docker-compose.yml
└── README.md
```

---

## ⚙️ Local Installation & Setup

Ensure you have **Node.js (v18+)** and **Python 3.11** installed. Using `uv` is highly recommended for faster installations.

### 1. Backend Setup

From the root directory:
```bash
# Navigate to backend
cd backend

# Create a virtual environment using uv or virtualenv
uv venv .venv --python 3.11
# Or: python -m venv .venv

# Activate the virtual environment
# On Windows Powershell:
.venv\Scripts\Activate.ps1
# On Linux/macOS:
source .venv/bin/activate

# Install dependencies
uv pip install -r requirements.txt
# Or: pip install -r requirements.txt
```

Start the FastAPI server:
```bash
# Run server
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```
The backend API is now running at `http://localhost:8000`. You can inspect the interactive docs at `http://localhost:8000/docs`.

### 2. Frontend Setup

In a new terminal window:
```bash
# Navigate to frontend
cd frontend

# Install node packages
npm install --legacy-peer-deps

# Start Vite React development server
npm run dev
```
Open your browser to `http://localhost:5173`.

---

## 🐳 Docker Deployment

To spin up the entire multi-container service in one command:
```bash
docker-compose up --build
```
* **Frontend UI**: `http://localhost`
* **FastAPI Docs**: `http://localhost:8000/docs`
* Model weights will download from Hugging Face on the first transcription request and persist inside the volume cache (`hf-cache`).

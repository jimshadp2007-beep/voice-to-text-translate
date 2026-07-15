# Capstone Project: Dataset Description Document

This document summarizes the primary datasets used in the training, fine-tuning, and evaluation of the deep learning Transformer models (Whisper and NLLB-200) utilized in our translation pipeline.

---

## 1. Speech Recognition (ASR) Datasets

Whisper models are pre-trained on 680,000 hours of weakly-supervised audio datasets. Benchmarking and local validations utilize:

### 1.1. LibriSpeech ASR Corpus
* **Description**: A large corpus of read English speech derived from audiobooks, totaling approximately 1,000 hours.
* **Usage**: Used to establish base Word Error Rates (WER) for clean, high-SNR (Signal-to-Noise Ratio) acoustic conditions.
* **Volume**: 1,000 hours of audio sampled at 16kHz.

### 1.2. Mozilla Common Voice
* **Description**: A crowdsourced, multilingual open speech dataset compiled by Mozilla, containing voice recordings in dozens of languages.
* **Usage**: Evaluating accent variations and low-resource regional dialects.
* **Volume**: Includes thousands of recorded hours across English, Malayalam, Hindi, Arabic, etc.

### 1.3. Google FLEURS (Few-Shot Learning Evaluation of Universal Representation)
* **Description**: A multilingual dataset developed by Google to evaluate speech models in 102 languages.
* **Usage**: Serves as our primary benchmark for multi-language speech transcription, language detection, and CER calculations for Dravidian scripts (Malayalam).

---

## 2. Machine Translation (NMT) Datasets

NLLB-200 models are trained on curated multilingual datasets built for low-resource translation.

### 2.1. Meta FLORES-200 Benchmark
* **Description**: An evaluation dataset containing translation matrices for 200+ distinct languages.
* **Usage**: Benchmark BLEU scores for Malayalam (`mal_Mlym`), Tamil (`tam_Taml`), Telugu (`tel_Telu`), Arabic (`arb_Arab`), etc.
* **Metrics**: Used to evaluate candidate translations against human references at the sentence level.

### 2.2. NLLB Multilingual Bitext Data
* **Description**: Reconstructed parallel corpora compiled using LASER embeddings to identify high-confidence sentence pairs from public web scraping.
* **Malayalam Volume**: Millions of parallel translation pairs aligned with English and other Indic resources.

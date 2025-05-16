Here's the updated and complete **README** file incorporating all your fixes, optimizations, and clarified features:

---

# 🏥 Healthcare Translator

**Healthcare Translator** is a real-time, multilingual speech recognition and translation tool tailored for medical environments. It helps healthcare professionals communicate with patients across language barriers using accurate, AI-powered transcription and translation—optimized for medical terminology.

---

## ✅ Fixes & Optimizations

* 🛠️ **Groq API 503 Handling**: Now gracefully handles downtime (e.g., HTTP 503). Automatically retries or uses backup services like Together AI.
* 🔄 **Loop Fix**: Button no longer triggers a continuous loop on interaction.
* 🧘 **Idle Detection**: Speech recognition stops listening when silence or idle state is detected.
* 🧬 **Translation Fallback Fixed**: Translation now works reliably even if a model fails or times out.
* 🗣️ **TTS Playback Fixed**: Reading aloud translated text no longer throws errors.
* ♻️ **Resource Optimization**: Microphone stream and event listeners are properly cleaned up when recording stops.

---

## 🚀 Features

* 🎙️ Real-time voice recognition (20+ languages)
* 🌐 Accurate translation using medical-context LLMs (Groq, Together AI)
* 🔊 Text-to-speech playback with native-like pronunciation
* 🧠 Smart model switching with fallback logic
* 📱 Fully responsive (mobile-first) interface
* 🔐 Secure key handling and privacy-first design

---

## 🧩 Project Requirements Fulfilled

This app was developed as a 48-hour generative AI prototype to enhance medical communication.

| Requirement    | Status                                     |
| -------------- | ------------------------------------------ |
| Voice-to-Text  | ✅ Voicegain + Whisper fallback             |
| Translation    | ✅ Groq LLMs with medical prompting         |
| Mobile UX      | ✅ Responsive design                        |
| Text-to-Speech | ✅ Accurate playback                        |
| Error Handling | ✅ 503 fallback, idle stops, loop fix       |
| Privacy        | ✅ No persistent data; server-side API keys |

---

## 🛠️ Installation

```bash
git clone https://github.com/yourusername/healthcare-translator.git
cd healthcare-translator
npm install
npm run dev
```

---

## 🔐 Environment Setup

Create a `.env.local` file:

```env
GROQ_API_KEY=your_groq_api_key
TOGETHER_API_KEY=your_backup_api_key
VOICEGAIN_API_KEY=Bearer your_voicegain_key
```

---

## 🧱 Architecture Overview

Built on **Next.js App Router**, the app follows a modular structure:

* **Client**: UI, speech/translation hooks
* **Server**: API routes for secure LLM access
* **Fallback Logic**: Chooses best API based on model status

---

## 📂 Project Structure

```plaintext
healthcare-translator/
├── app/
│   ├── api/
│   └── page.tsx
├── components/
│   ├── TranscriptPane.tsx
│   ├── AudioVisualizer.tsx
├── src/
│   ├── hooks/
│   │   ├── useVoicegainStream.ts
│   │   ├── useWhisperRecording.ts
│   │   ├── useTTS.ts
│   │   ├── useTranslation.ts
│   └── utils/
│       └── idleListener.ts
├── public/
├── .env.local
└── package.json
```

---

## 🧠 AI Tools & Integrations

### 🔁 Translation: Groq + Together AI

* Primary: `Groq (llama3-70b, llama3-8b)`
* Fallback: `Together AI (Mixtral, Gemma)`
* Prompts include strict medical terminology preservation

⚠️ If Groq API returns `503`, the system uses backup models automatically.

---

### 🗣️ Speech Recognition

* **Voicegain**: Streaming, low-latency STT
* **Fallback**: OpenAI Whisper (local or server-side)

---

### 🔊 Text-to-Speech (TTS)

* Native Web Speech API
* Automatically reads translated text
* Fallback and silent error handling for unsupported languages

---

## 🔒 Security & Privacy

* No data is stored or logged
* API keys are handled server-side
* Client cannot access secure model routes directly

---

## 📘 User Guide

### How to Use:

1. Select source and target languages.
2. Pick a translation model.
3. Click **Start Microphone**.
4. Speak. Watch real-time transcription and translation.
5. Click **🔊 Speak Translation** to hear it read aloud.

### Tips:

* Use `llama3-70b` for best results with medical terms
* Ensure a quiet environment for clearer recognition
* Reload if any model or audio error occurs—state resets cleanly

---

## 🌐 Deployment

Deployable on:

* [x] Vercel (Recommended)
* [x] Netlify
* [x] Any Node.js-compatible server

**Steps**:

```bash
npm run build
npm start
```

🔗 Live Demo: [https://v0-healthcaretranslator11-fu.vercel.app/](https://v0-healthcaretranslator11-fu.vercel.app/)


---

## 🙏 Acknowledgements

* Built with [Next.js](https://nextjs.org)
* Uses APIs from [Groq](https://groq.com), [Together AI](www.together.ai), [Voicegain](https://voicegain.ai)
* UI prototyped with [v0.dev](https://v0.dev)

---


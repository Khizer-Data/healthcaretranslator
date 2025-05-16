
# Healthcare Translator

**Healthcare Translator** is a real-time speech recognition and translation application designed specifically for healthcare settings. It enables seamless communication between healthcare providers and patients who speak different languages, breaking down language barriers in critical medical environments.

The app leverages advanced AI models for accurate speech recognition and translation with a focus on medical terminology. It includes a user-friendly interface for live transcription, translation, and text-to-speech capabilities.

---

## Features

* 🎙️ **Real-time speech recognition** supporting 20+ languages
* 🌍 **High-quality translation** with state-of-the-art AI models
* 🔊 **Text-to-speech output** for pronunciation clarity
* ⚙️ **Model selection** for balancing speed and accuracy
* 🧠 **Fallback mechanisms** for increased reliability
* 📱 **Responsive design** for all device types
* 🔐 **Secure API key handling** with server-side processing

---

## Table of Contents

* [Installation](#installation)
* [Environment Setup](#environment-setup)
* [Architecture Overview](#architecture-overview)
* [Key Components](#key-components)
* [AI Tools and Integrations](#ai-tools-and-integrations)
* [Security Considerations](#security-considerations)
* [User Guide](#user-guide)
* [Development](#development)
* [Deployment](#deployment)
* [License](#license)

---

## Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/healthcare-translator.git

# Navigate into the project directory
cd healthcare-translator

# Install dependencies
npm install

# Start the development server
npm run dev
```

---

## Environment Setup

Create a `.env.local` file in the root directory:

```env
GROQ_API_KEY=your_groq_api_key
VOICEGAIN_API_KEY=your_voicegain_api_key
OPENAI_API_KEY=your_openai_api_key
```

Each key is critical for full functionality:

* **GROQ\_API\_KEY**: Used for translation
* **VOICEGAIN\_API\_KEY**: Used for real-time speech recognition (include `Bearer ` prefix)
* **OPENAI\_API\_KEY**: Used for Whisper transcription as a fallback

---

## Architecture Overview

Built with **Next.js App Router**, the app uses a client-server model:

* **Client Components**: UI, state, interaction
* **Custom Hooks**: Recording, recognition, translation, TTS
* **Server Routes**: Handle secure API calls

---

## Key Components

### Frontend

* `app/page.tsx`: Main interface
* `TranscriptPane.tsx`: Transcription and translation display
* `ModelSelector.tsx`: AI model selection
* `AudioVisualizer.tsx`: Microphone input feedback
* `ApiKeyManager.tsx`: Key management

### Hooks

* `useVoicegainStream.ts`: Real-time speech recognition
* `useWhisperRecording.ts`: Whisper transcription fallback
* `useTTS.ts`: Text-to-speech output
* `useToast.ts`: Notifications

### Backend API Routes

* `/api/transcribe`: Whisper transcription
* `/api/translate`: Translation via Groq
* `/api/start-voicegain-session`: Voicegain setup
* `/api/check-groq-key`: API validation

---

## AI Tools and Integrations

### Groq API

* Fast, low-latency large language models for translation
* Models supported: `llama3-8b`, `llama3-70b`, `mixtral`, `gemma`

### Voicegain

* Real-time, high-accuracy speech-to-text
* Multi-language support & streaming

### OpenAI Whisper

* Accurate transcription fallback
* Useful when Voicegain is unavailable

---

## Security Considerations

* **API keys** stored server-side or temporarily in the browser
* **No long-term storage** of user data or audio
* **Client-server separation** ensures secure processing

---

## User Guide

### Getting Started

* Choose input/output languages
* Pick a model
* Click **Start Microphone**
* Speak and view the real-time transcription and translation
* Click **Speak Latest Translation** to hear the translation

### Best Practices

* Use Llama 3 70B for best medical translation
* Speak clearly, avoid background noise
* Use headphones in public spaces
* Ensure all API keys are valid

---

## Development

### Project Structure

```
healthcare-translator/
├── app/
│   ├── api/
│   ├── page.tsx
├── components/
│   ├── TranscriptPane.tsx
│   ├── AudioVisualizer.tsx
├── src/
│   ├── hooks/
│   ├── utils/
├── .env.local
└── package.json
```

### Extending Functionality

* **New language**: Add to `LANGUAGES` list in `page.tsx`
* **New model**: Add to `ModelSelector.tsx` and update `translationService.ts`

---

## Deployment

You can deploy this project using any platform that supports **Node.js** and **Next.js**, such as:

* Vercel
* Netlify
* Render
* Your own server or container environment

**Steps to Deploy**:

1. Set environment variables on your deployment platform
2. Build the project: `npm run build`
3. Start production server: `npm start`

---

## License

This project is licensed under the MIT License.

---

## Acknowledgements

* Built with [Next.js](https://nextjs.org)
* Uses [Groq](https://groq.com), [Voicegain](https://voicegain.ai), and [OpenAI](https://openai.com) APIs
* Originally scaffolded with [v0.dev](https://v0.dev)



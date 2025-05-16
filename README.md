### Healthcare Translator

**Healthcare Translator** is a real-time speech recognition and translation application designed specifically for healthcare settings. It enables seamless communication between healthcare providers and patients who speak different languages, breaking down language barriers in critical medical environments.

The app leverages advanced AI models for accurate speech recognition and translation with a focus on medical terminology. It includes a user-friendly interface for live transcription, translation, and text-to-speech capabilities.

---

## Project Requirements Fulfilled

This project was developed as a rapid prototype (48-hour challenge) to demonstrate the use of generative AI in healthcare translation. Here's how we met the requirements:

### Core Functionalities

✅ **Voice-to-Text with Generative AI**: Implemented using Voicegain API for real-time transcription with OpenAI Whisper as a fallback. The system is optimized for medical terminology through prompt engineering.

✅ **Real-Time Translation and Audio Playback**: Leverages Groq API with multiple LLM options (Llama 3 70B optimized for medical terminology). Text-to-speech functionality provides immediate audio playback.

✅ **Mobile-First Design**: Fully responsive interface that works seamlessly on smartphones, tablets, and desktop computers.

### User Interface and Experience

✅ **Dual Transcript Display**: Side-by-side display of original and translated text in real-time.

✅ **Speak Button**: One-click audio playback of translated text with natural pronunciation.

✅ **Language Selection**: Support for 20+ languages with easy dropdown selection for both input and output languages.

### Technical Implementation

✅ **Generative AI Tools**: Used Groq API (Llama 3 models) for translation with specialized medical context prompting.

✅ **Speech Recognition**: Integrated Voicegain for primary speech recognition with Web Speech API and OpenAI Whisper as fallbacks.

✅ **Deployment**: Successfully deployed on Vercel with continuous integration.

✅ **Data Privacy**: Implemented server-side API calls and no persistent storage of patient data.

---

## Features

- 🎙️ **Real-time speech recognition** supporting 20+ languages
- 🌍 **High-quality translation** with state-of-the-art AI models
- 🔊 **Text-to-speech output** for pronunciation clarity
- ⚙️ **Model selection** for balancing speed and accuracy
- 🧠 **Fallback mechanisms** for increased reliability
- 📱 **Responsive design** for all device types
- 🔐 **Secure API key handling** with server-side processing


---

## Table of Contents

- [Installation](#installation)
- [Environment Setup](#environment-setup)
- [Architecture Overview](#architecture-overview)
- [Key Components](#key-components)
- [AI Tools and Integrations](#ai-tools-and-integrations)
- [Security Considerations](#security-considerations)
- [User Guide](#user-guide)
- [Development](#development)
- [Deployment](#deployment)
- [License](#license)


---

## Installation

```shellscript
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

```plaintext
GROQ_API_KEY=your_groq_api_key
VOICEGAIN_API_KEY=your_voicegain_api_key
```

Each key is critical for full functionality:

- **GROQ_API_KEY**: Used for translation
- **VOICEGAIN_API_KEY**: Used for real-time speech recognition (include `Bearer ` prefix)
---

## Architecture Overview

Built with **Next.js App Router**, the app uses a client-server model:

- **Client Components**: UI, state, interaction
- **Custom Hooks**: Recording, recognition, translation, TTS
- **Server Routes**: Handle secure API calls

## Key Components

### Frontend

- `app/page.tsx`: Main interface
- `TranscriptPane.tsx`: Transcription and translation display
- `ModelSelector.tsx`: AI model selection
- `AudioVisualizer.tsx`: Microphone input feedback
- `ApiKeyManager.tsx`: Key management


### Hooks

- `useVoicegainStream.ts`: Real-time speech recognition
- `useWhisperRecording.ts`: Whisper transcription fallback
- `useTTS.ts`: Text-to-speech output
- `useToast.ts`: Notifications


### Backend API Routes

- `/api/transcribe`: Whisper transcription
- `/api/translate`: Translation via Groq
- `/api/start-voicegain-session`: Voicegain setup
- `/api/check-groq-key`: API validation


---

## AI Tools and Integrations

### Groq API

- Fast, low-latency large language models for translation
- Models supported: `llama3-8b`, `llama3-70b`, `mixtral`, `gemma`
- **Medical Terminology Handling**:

- The Llama 3 70B model is specifically prompted with medical context
- Custom prompts include instructions to preserve medical terminology
- Translation pipeline includes verification steps for medical terms



### Voicegain

- Real-time, high-accuracy speech-to-text
- Multi-language support & streaming
- Optimized for healthcare vocabulary


### OpenAI Whisper

- Accurate transcription fallback
- Useful when Voicegain is unavailable
- Handles medical terminology with high accuracy


---

## Security Considerations

- **API keys** stored server-side or temporarily in the browser
- **No long-term storage** of user data or audio
- **Client-server separation** ensures secure processing
- **Server-side API calls** prevent exposure of credentials


---

## User Guide

### Getting Started

- Choose input/output languages
- Pick a model
- Click **Start Microphone**
- Speak and view the real-time transcription and translation
- Click **Speak Latest Translation** to hear the translation


### Best Practices

- Use Llama 3 70B for best medical translation
- Speak clearly, avoid background noise
- Use headphones in public spaces
- Ensure all API keys are valid


---

## Development

### Project Structure

```plaintext
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

- **New language**: Add to `LANGUAGES` list in `page.tsx`
- **New model**: Add to `ModelSelector.tsx` and update `translationService.ts`


---

## Deployment

You can deploy this project using any platform that supports **Node.js** and **Next.js**, such as:

- Vercel
- Netlify
- Render
- Your own server or container environment


**Steps to Deploy**:

1. Set environment variables on your deployment platform
2. Build the project: `npm run build`
3. Start production server: `npm start`


The project is currently deployed at:
**https://v0-healthcaretranslator11-fu.vercel.app/**

---

## Handling Medical Terminology

One of the key challenges in healthcare translation is accurately handling specialized medical terminology. Our approach includes:

1. **Model Selection**:

1. Llama 3 70B provides the best accuracy for medical terms
2. Mixtral 8x7B offers a good balance of speed and accuracy



2. **Prompt Engineering**:

1. Custom prompts instruct the model to preserve medical terminology
2. Context includes instructions to maintain clinical accuracy
3. Translation pipeline includes verification for medical terms



3. **Fallback Mechanisms**:

1. Multiple recognition and translation options ensure reliability
2. System can switch between models if medical terms are not recognized



4. **User Verification**:

1. Dual transcript display allows healthcare providers to verify accuracy
2. Text-to-speech helps confirm pronunciation of complex terms





---

## License

This project is licensed under the MIT License.

---

## Acknowledgements

- Built with [Next.js](https://nextjs.org)
- Uses [Groq](https://groq.com), [Voicegain](https://voicegain.ai), and [OpenAI](https://openai.com) APIs
- Originally scaffolded with [v0.dev](https://v0.dev)


---

Here’s an updated version of your README with the **Groq API server error (503)** clarification added under the **AI Tools and Integrations** section and a quick note in **Project Requirements Fulfilled** to reflect this behavior.

---

### ✅ Updated Sections:

---

### Project Requirements Fulfilled


⚠️ *Note*: If Groq API is temporarily unavailable due to server load (HTTP 503), translation will fail silently or display a fallback. The interface shows a ✅ green tick once the service is back online.




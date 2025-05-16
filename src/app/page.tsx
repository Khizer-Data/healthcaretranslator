"use client"

import { useState, useEffect, useRef } from "react"
import { useTTS } from "../hooks/useTTS"
import AudioVisualizer from "../../components/AudioVisualizer"
import TranscriptPane from "../../components/TranscriptPane"
import Banner from "../../components/Banner"
import { Button } from "../../components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card"
import { Mic, MicOff, Volume2, Loader2 } from "lucide-react"
import Link from "next/link"
import EnvVarStatus from "../../components/EnvVarStatus"
import { translateText } from "../utils/translationService"
import SpeechRecognition from "speech-recognition"
import ModelSelector from "../../components/ModelSelector"

type TranscriptSegment = {
  text: string
  isFinal: boolean
  speaker?: "patient" | "provider" | "unknown"
}

type TranslationSegment = {
  text: string
  speaker?: "patient" | "provider" | "unknown"
}

// Updated language list based on Voicegain's supported languages
const LANGUAGES = {
  input: [
    { value: "en-US", label: "English (US)" },
    { value: "en-GB", label: "English (UK)" },
    { value: "en-AU", label: "English (Australia)" },
    { value: "en-IN", label: "English (India)" },
    { value: "es-ES", label: "Spanish (Spain)" },
    { value: "es-MX", label: "Spanish (Mexico)" },
    { value: "es-US", label: "Spanish (US)" },
    { value: "fr-FR", label: "French" },
    { value: "fr-CA", label: "French (Canada)" },
    { value: "de-DE", label: "German" },
    { value: "it-IT", label: "Italian" },
    { value: "pt-BR", label: "Portuguese (Brazil)" },
    { value: "pt-PT", label: "Portuguese (Portugal)" },
    { value: "nl-NL", label: "Dutch" },
    { value: "ja-JP", label: "Japanese" },
    { value: "ko-KR", label: "Korean" },
    { value: "zh-CN", label: "Chinese (Mandarin)" },
    { value: "ru-RU", label: "Russian" },
    { value: "pl-PL", label: "Polish" },
    { value: "tr-TR", label: "Turkish" },
    { value: "ar-SA", label: "Arabic" },
    { value: "hi-IN", label: "Hindi" },
  ],
  output: [
    { value: "en", label: "English" },
    { value: "es", label: "Spanish" },
    { value: "fr", label: "French" },
    { value: "de", label: "German" },
    { value: "it", label: "Italian" },
    { value: "pt", label: "Portuguese" },
    { value: "nl", label: "Dutch" },
    { value: "ja", label: "Japanese" },
    { value: "ko", label: "Korean" },
    { value: "zh", label: "Chinese" },
    { value: "ru", label: "Russian" },
    { value: "pl", label: "Polish" },
    { value: "tr", label: "Turkish" },
    { value: "ar", label: "Arabic" },
    { value: "hi", label: "Hindi" },
    { value: "ur", label: "Urdu" },
    { value: "bn", label: "Bengali" },
    { value: "th", label: "Thai" },
    { value: "vi", label: "Vietnamese" },
    { value: "id", label: "Indonesian" },
    { value: "ms", label: "Malay" },
    { value: "fa", label: "Persian" },
    { value: "he", label: "Hebrew" },
    { value: "sv", label: "Swedish" },
    { value: "da", label: "Danish" },
    { value: "fi", label: "Finnish" },
    { value: "no", label: "Norwegian" },
    { value: "cs", label: "Czech" },
    { value: "hu", label: "Hungarian" },
    { value: "ro", label: "Romanian" },
    { value: "uk", label: "Ukrainian" },
    { value: "el", label: "Greek" },
    { value: "bg", label: "Bulgarian" },
  ],
}

export default function HomePage() {
  const [inputLanguage, setInputLanguage] = useState("en-US")
  const [outputLanguage, setOutputLanguage] = useState("es")
  const [originalTranscript, setOriginalTranscript] = useState<TranscriptSegment[]>([])
  const [translatedTranscript, setTranslatedTranscript] = useState<TranslationSegment[]>([])
  const [infoBanner, setInfoBanner] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isTranslating, setIsTranslating] = useState(false)
  const [isMicActive, setIsMicActive] = useState(false)
  const [volumeLevel, setVolumeLevel] = useState(0)
  const { speak, cancel } = useTTS()
  const [selectedModel, setSelectedModel] = useState("llama3-8b-8192") // Default to a smaller model

  // References for speech recognition
  const recognitionRef = useRef<SpeechRecognition | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const microphoneStreamRef = useRef<MediaStream | null>(null)

  // Initialize speech recognition
  useEffect(() => {
    // Check if browser supports SpeechRecognition
    if (!SpeechRecognition) {
      setError("Speech recognition is not supported in this browser.")
      return
    }

    return () => {
      // Cleanup
      if (recognitionRef.current) {
        recognitionRef.current.stop()
      }

      if (microphoneStreamRef.current) {
        microphoneStreamRef.current.getTracks().forEach((track) => track.stop())
      }

      if (audioContextRef.current) {
        audioContextRef.current.close()
      }
    }
  }, [])

  // Toggle microphone
  const toggleMic = async () => {
    console.log("Toggle mic clicked, current state:", isMicActive)

    if (isMicActive) {
      // Stop recognition
      if (recognitionRef.current) {
        recognitionRef.current.stop()
        recognitionRef.current = null
      }

      // Stop microphone
      if (microphoneStreamRef.current) {
        microphoneStreamRef.current.getTracks().forEach((track) => track.stop())
        microphoneStreamRef.current = null
      }

      setIsMicActive(false)
      setVolumeLevel(0)
      return
    }

    try {
      // Start microphone
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      microphoneStreamRef.current = stream

      // Set up audio processing for volume level
      const audioContext = new AudioContext()
      audioContextRef.current = audioContext
      const analyser = audioContext.createAnalyser()
      analyserRef.current = analyser
      const microphone = audioContext.createMediaStreamSource(stream)
      microphone.connect(analyser)
      analyser.fftSize = 256
      const dataArray = new Uint8Array(analyser.frequencyBinCount)

      // Update volume level
      const updateVolume = () => {
        if (!isMicActive || !analyserRef.current) return

        analyserRef.current.getByteFrequencyData(dataArray)
        const average = dataArray.reduce((acc, val) => acc + val, 0) / dataArray.length
        setVolumeLevel(average / 128) // Normalize to 0-1

        requestAnimationFrame(updateVolume)
      }

      updateVolume()

      // Set up speech recognition
      const recognition = new SpeechRecognition()
      recognitionRef.current = recognition

      recognition.lang = inputLanguage
      recognition.continuous = true
      recognition.interimResults = true

      recognition.onstart = () => {
        console.log("Speech recognition started")
        setIsMicActive(true)
      }

      recognition.onerror = (event) => {
        console.error("Speech recognition error:", event.error)
        setError(`Speech recognition error: ${event.error}`)
        setIsMicActive(false)
      }

      recognition.onend = () => {
        console.log("Speech recognition ended")
        if (isMicActive) {
          // Restart if it was active
          recognition.start()
        }
      }

      recognition.onresult = (event) => {
        const last = event.results.length - 1
        const transcript = event.results[last][0].transcript
        const isFinal = event.results[last].isFinal

        console.log("Speech recognition result:", transcript, "isFinal:", isFinal)

        // Update original transcript
        setOriginalTranscript((prev) => {
          // If the last segment is not final, replace it
          if (prev.length > 0 && !prev[prev.length - 1].isFinal) {
            return [...prev.slice(0, -1), { text: transcript, isFinal }]
          }
          // Otherwise add a new segment
          return [...prev, { text: transcript, isFinal }]
        })

        // If final, translate
        if (isFinal) {
          handleTranslation(transcript)
        }
      }

      recognition.start()
      setIsMicActive(true)
    } catch (err) {
      console.error("Error accessing microphone:", err)
      setError(`Error accessing microphone: ${err instanceof Error ? err.message : String(err)}`)
    }
  }

  // Handle translation
  const handleTranslation = async (text: string) => {
    if (!text.trim()) return

    try {
      setIsTranslating(true)
      const result = await translateText(text, inputLanguage, outputLanguage, selectedModel)
      setTranslatedTranscript((prev) => [...prev, { text: result.translation, speaker: result.speaker }])
      setIsTranslating(false)
    } catch (err) {
      console.error("Translation error:", err)
      setError(`Translation error: ${err instanceof Error ? err.message : String(err)}`)
      setIsTranslating(false)
    }
  }

  useEffect(() => {
    setOriginalTranscript([])
    setTranslatedTranscript([])
    setInfoBanner("Language changed, resetting...")
    const t = setTimeout(() => setInfoBanner(null), 3000)
    cancel()

    // Update recognition language if active
    if (recognitionRef.current && isMicActive) {
      recognitionRef.current.stop()
      recognitionRef.current.lang = inputLanguage
      setTimeout(() => {
        if (recognitionRef.current) {
          recognitionRef.current.start()
        }
      }, 100)
    }

    return () => clearTimeout(t)
  }, [inputLanguage, outputLanguage, cancel, isMicActive])

  function handleSpeak(text: string) {
    speak(text, outputLanguage)
  }

  return (
    <main className="container mx-auto p-4 min-h-screen">
      <Card className="mb-6">
        <CardHeader className="pb-2">
          <CardTitle className="text-2xl font-bold text-center">Healthcare Translator</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 mb-4">
            <div className="flex-1">
              <label className="block text-sm font-medium mb-1">Input Language</label>
              <Select value={inputLanguage} onValueChange={setInputLanguage}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select input language" />
                </SelectTrigger>
                <SelectContent className="max-h-[300px]">
                  {LANGUAGES.input.map((lang) => (
                    <SelectItem key={lang.value} value={lang.value}>
                      {lang.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium mb-1">Output Language</label>
              <Select value={outputLanguage} onValueChange={setOutputLanguage}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select output language" />
                </SelectTrigger>
                <SelectContent className="max-h-[300px]">
                  {LANGUAGES.output.map((lang) => (
                    <SelectItem key={lang.value} value={lang.value}>
                      {lang.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Add Model Selector */}
          <div className="mb-4">
            <ModelSelector value={selectedModel} onChange={setSelectedModel} />
          </div>

          {/* Microphone button - always visible */}
          <div className="flex justify-center mb-4">
            <Button
              onClick={toggleMic}
              variant={isMicActive ? "destructive" : "default"}
              className="flex items-center gap-2 py-6 px-8 text-lg"
              size="lg"
            >
              {isMicActive ? (
                <>
                  <MicOff size={24} /> Stop Microphone
                </>
              ) : (
                <>
                  <Mic size={24} /> Start Microphone
                </>
              )}
            </Button>
          </div>

          {isMicActive && (
            <div className="flex justify-center mb-4">
              <AudioVisualizer level={volumeLevel} />
            </div>
          )}

          <Banner message={error} type="error" />
          <Banner message={infoBanner} type="info" />

          {/* Environment Variable Status */}
          <EnvVarStatus />

          <div className="text-center mt-4 text-sm text-gray-500">
            <Link href="/api-verification" className="text-blue-500 hover:underline">
              Verify API Keys
            </Link>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <TranscriptPane
          title="Original Transcript"
          segments={originalTranscript.map((seg) => ({ text: seg.text, speaker: seg.speaker }))}
          colorClass="text-indigo-600 dark:text-indigo-400"
          ariaLabel="Original transcript"
        />

        <div className="relative">
          <TranscriptPane
            title="Translated Transcript"
            segments={translatedTranscript}
            colorClass="text-green-600 dark:text-green-400"
            ariaLabel="Translated transcript"
          />

          {isTranslating && (
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
              <Loader2 className="animate-spin h-8 w-8 text-primary" />
            </div>
          )}

          {translatedTranscript.length > 0 && (
            <div className="mt-2 flex justify-end">
              <Button
                onClick={() => handleSpeak(translatedTranscript[translatedTranscript.length - 1].text)}
                variant="outline"
                className="flex items-center gap-2"
              >
                <Volume2 size={18} /> Speak Latest Translation
              </Button>
            </div>
          )}
        </div>
      </div>
    </main>
  )
}

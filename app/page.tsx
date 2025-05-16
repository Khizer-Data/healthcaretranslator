"use client"

import { useState, useEffect, useRef } from "react"
import { useTTS } from "../src/hooks/useTTS"
import AudioVisualizer from "../components/AudioVisualizer"
import TranscriptPane from "../components/TranscriptPane"
import Banner from "../components/Banner"
import { Button } from "../components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card"
import { Mic, MicOff, Volume2, Loader2 } from "lucide-react"
import Link from "next/link"
import EnvVarStatus from "../components/EnvVarStatus"
import ModelSelector from "../components/ModelSelector"

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
  const [isBrowserSupported, setIsBrowserSupported] = useState(true)

  // Speech recognition references
  const recognitionRef = useRef<any>(null)
  const mediaStreamRef = useRef<MediaStream | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const animationIdRef = useRef<number | null>(null)

  // Check browser support on mount
  useEffect(() => {
    const isSpeechRecognitionSupported =
      typeof window !== "undefined" &&
      (window.SpeechRecognition !== undefined || window.webkitSpeechRecognition !== undefined)

    setIsBrowserSupported(isSpeechRecognitionSupported)

    if (!isSpeechRecognitionSupported) {
      setError("Speech recognition is not supported in this browser. Please try Chrome, Edge, or Safari.")
    }
  }, [])

  // Start recording with browser's SpeechRecognition
  const startRecording = async () => {
    try {
      console.log("Starting recording...")
      setError(null)

      if (!isBrowserSupported) {
        throw new Error("Speech recognition is not supported in this browser")
      }

      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      mediaStreamRef.current = stream

      // Set up audio context for volume visualization
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext
      const audioContext = new AudioContext()
      audioContextRef.current = audioContext

      // Create analyzer for volume visualization
      const analyser = audioContext.createAnalyser()
      analyser.fftSize = 256
      analyserRef.current = analyser

      // Create source from microphone
      const source = audioContext.createMediaStreamSource(stream)
      source.connect(analyser)

      // Start animation for volume visualization
      animateVolume()

      // Create and configure SpeechRecognition
      // Use a safer approach to access the SpeechRecognition API
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
      if (!SpeechRecognition) {
        throw new Error("SpeechRecognition not available in this browser")
      }

      const recognition = new SpeechRecognition()
      recognitionRef.current = recognition

      recognition.continuous = true
      recognition.interimResults = true
      recognition.lang = inputLanguage

      // Set up event handlers
      recognition.onstart = () => {
        console.log("SpeechRecognition started")
        setIsMicActive(true)
      }

      recognition.onresult = (event: any) => {
        console.log("Speech recognition result received:", event)

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript
          const isFinal = event.results[i].isFinal

          if (transcript.trim() !== "") {
            console.log(`Transcript received (${isFinal ? "final" : "interim"}):`, transcript)

            // Update original transcript
            setOriginalTranscript((prev) => {
              // If the last segment is not final, replace it
              if (prev.length > 0 && !prev[prev.length - 1].isFinal) {
                return [...prev.slice(0, -1), { text: transcript, isFinal, speaker: "unknown" }]
              }
              // Otherwise add a new segment
              return [...prev, { text: transcript, isFinal, speaker: "unknown" }]
            })

            if (isFinal) {
              translateText(transcript, inputLanguage, outputLanguage, selectedModel)
                .then((result) => {
                  setTranslatedTranscript((prev) => [...prev, { text: result.translation, speaker: result.speaker }])
                })
                .catch((err) => {
                  console.error("Translation error:", err)
                  setError("Translation failed. Please try again.")
                })
            }
          }
        }
      }

      recognition.onerror = (event: any) => {
        console.error("SpeechRecognition error:", event.error)
        setError(`Browser speech recognition error: ${event.error}`)
      }

      recognition.onend = () => {
        console.log("SpeechRecognition ended")
        // Restart if we're still supposed to be recording
        if (isMicActive) {
          console.log("Restarting SpeechRecognition...")
          recognition.start()
        }
      }

      // Start recognition
      recognition.start()
    } catch (error) {
      console.error("Failed to start recording:", error)
      setError(`Recording failed: ${error instanceof Error ? error.message : String(error)}`)
      setIsMicActive(false)
    }
  }

  // Stop recording
  const stopRecording = () => {
    console.log("Stopping recording...")
    setIsMicActive(false)

    // Stop SpeechRecognition
    if (recognitionRef.current) {
      recognitionRef.current.stop()
      recognitionRef.current = null
    }

    // Stop media stream tracks
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => {
        track.stop()
      })
      mediaStreamRef.current = null
    }

    // Clean up audio context
    if (audioContextRef.current) {
      audioContextRef.current.close().catch(console.error)
      audioContextRef.current = null
    }

    // Cancel animation frame
    if (animationIdRef.current) {
      cancelAnimationFrame(animationIdRef.current)
      animationIdRef.current = null
    }

    setVolumeLevel(0)
  }

  // Toggle microphone
  const toggleMic = () => {
    if (isMicActive) {
      stopRecording()
    } else {
      startRecording()
    }
  }

  // Animate volume meter
  function animateVolume() {
    if (!analyserRef.current) return

    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount)
    analyserRef.current.getByteFrequencyData(dataArray)

    let values = 0
    for (let i = 0; i < dataArray.length; i++) {
      values += dataArray[i]
    }

    const average = values / dataArray.length / 255
    setVolumeLevel(average)

    animationIdRef.current = requestAnimationFrame(animateVolume)
  }

  // Translation function
  async function translateText(text: string, inputLang: string, outputLang: string, model: string) {
    setIsTranslating(true)
    try {
      const response = await fetch("/api/translate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text,
          inputLanguage: inputLang,
          outputLanguage: outputLang,
          model,
        }),
      })

      if (!response.ok) {
        throw new Error(`Translation request failed: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()

      if (data.error) {
        throw new Error(data.error)
      }

      setIsTranslating(false)
      return {
        speaker: data.speaker || "unknown",
        translation: data.translation || data.translatedText || "",
      }
    } catch (error) {
      console.error("Translation error:", error)
      setIsTranslating(false)
      throw error
    }
  }

  // Clean up on unmount or language change
  useEffect(() => {
    return () => {
      stopRecording()
    }
  }, [])

  // Reset when language changes
  useEffect(() => {
    setOriginalTranscript([])
    setTranslatedTranscript([])
    setInfoBanner("Language changed, resetting...")
    const t = setTimeout(() => setInfoBanner(null), 3000)

    if (isMicActive) {
      stopRecording()
      startRecording()
    }

    cancel()
    return () => clearTimeout(t)
  }, [inputLanguage, outputLanguage, selectedModel])

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
              className="flex items-center gap-2 px-6 py-3 text-lg"
              disabled={!isBrowserSupported}
            >
              {isMicActive ? (
                <>
                  <MicOff size={20} /> Stop Microphone
                </>
              ) : (
                <>
                  <Mic size={20} /> Start Microphone
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

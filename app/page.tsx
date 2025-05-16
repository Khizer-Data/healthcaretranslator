"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { useTTS } from "../src/hooks/useTTS"
import AudioVisualizer from "../components/AudioVisualizer"
import TranscriptPane from "../components/TranscriptPane"
import Banner from "../components/Banner"
import { Button } from "../components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card"
import { Mic, MicOff, Volume2, VolumeX, Loader2, RefreshCw } from "lucide-react"
import Link from "next/link"
import EnvVarStatus from "../components/EnvVarStatus"
import ModelSelector from "../components/ModelSelector"
import LanguageSwitcher from "../components/LanguageSwitcher"
import { Switch } from "../components/ui/switch"
import { Label } from "../components/ui/label"

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
    { value: "hi", label: "Hindi" },
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

// Helper function to find the best matching input language code for an output language
function findMatchingInputLanguage(outputLang: string): string {
  // First try to find an exact match with the language code
  const exactMatch = LANGUAGES.input.find((lang) => lang.value.startsWith(`${outputLang}-`))
  if (exactMatch) return exactMatch.value

  // If no exact match, try to find a language with the same base code
  // For example, if outputLang is "hi", look for "hi-IN"
  const baseMatch = LANGUAGES.input.find((lang) => lang.value.split("-")[0] === outputLang)
  if (baseMatch) return baseMatch.value

  // If still no match, return English as default
  return "en-US"
}

// Translation cache to improve performance
const translationCache = new Map<string, { translation: string; speaker: string }>()

export default function HomePage() {
  // Default models
  const GROQ_DEFAULT_MODEL = "llama3-70b-8192"
  const TOGETHER_DEFAULT_MODEL = "meta-llama/Llama-3.1-70B-Instruct-Turbo"

  const [inputLanguage, setInputLanguage] = useState("en-US")
  const [outputLanguage, setOutputLanguage] = useState("hi")
  const [originalTranscript, setOriginalTranscript] = useState<TranscriptSegment[]>([])
  const [translatedTranscript, setTranslatedTranscript] = useState<TranslationSegment[]>([])
  const [infoBanner, setInfoBanner] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isTranslating, setIsTranslating] = useState(false)
  const [isMicActive, setIsMicActive] = useState(false) // Start with mic off
  const [volumeLevel, setVolumeLevel] = useState(0)
  const { speak, cancel, isSpeaking } = useTTS()
  const [selectedModel, setSelectedModel] = useState(GROQ_DEFAULT_MODEL) // Default to Groq
  const [isBrowserSupported, setIsBrowserSupported] = useState(true)
  const [isStoppingRecording, setIsStoppingRecording] = useState(false)
  const [translationProvider, setTranslationProvider] = useState<"together" | "groq">("groq") // Default to Groq
  const [isInitialized, setIsInitialized] = useState(false)
  const [autoSpeak, setAutoSpeak] = useState(true) // Default to auto-speak enabled
  const [speechError, setSpeechError] = useState<string | null>(null)

  // Speech recognition references
  const recognitionRef = useRef<any>(null)
  const mediaStreamRef = useRef<MediaStream | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const animationIdRef = useRef<number | null>(null)
  const isTranslatingRef = useRef(false)
  const translationQueueRef = useRef<{ text: string; inputLang: string; outputLang: string; model: string }[]>([])
  const processingTranslationRef = useRef(false)
  const inactivityTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const restartAttemptRef = useRef(0)
  const lastTranslationRef = useRef<string>("")
  const speakTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Check browser support on mount
  useEffect(() => {
    const isSpeechRecognitionSupported =
      typeof window !== "undefined" &&
      (window.SpeechRecognition !== undefined || window.webkitSpeechRecognition !== undefined)

    setIsBrowserSupported(isSpeechRecognitionSupported)

    if (!isSpeechRecognitionSupported) {
      setError("Speech recognition is not supported in this browser. Please try Chrome, Edge, or Safari.")
    }

    // Check API keys availability
    checkAPIAvailability()

    // Clean up on unmount
    return () => {
      cleanupResources()
      cancel() // Ensure speech is cancelled

      // Clear any pending timeouts
      if (speakTimeoutRef.current) {
        clearTimeout(speakTimeoutRef.current)
        speakTimeoutRef.current = null
      }
    }
  }, [])

  // Function to check API availability
  const checkAPIAvailability = async () => {
    try {
      // Check Groq first (preferred)
      const groqResponse = await fetch("/api/check-groq-key")
      const groqData = await groqResponse.json()

      if (groqResponse.ok && groqData.valid) {
        console.log("Groq API is available, using as primary")
        setTranslationProvider("groq")
        setSelectedModel(GROQ_DEFAULT_MODEL)
        setIsInitialized(true)
        return
      }

      // If Groq is not available, check Together
      const togetherResponse = await fetch("/api/check-together-key")
      const togetherData = await togetherResponse.json()

      if (togetherResponse.ok && togetherData.valid) {
        console.log("Together AI API is available, using as fallback")
        setTranslationProvider("together")
        setSelectedModel(TOGETHER_DEFAULT_MODEL)
        setIsInitialized(true)
        return
      }

      // If neither is available
      console.log("No translation API is available")
      setError("No translation API is available. Please check your API keys.")
      setIsInitialized(true)
    } catch (error) {
      console.error("Error checking API availability:", error)
      setIsInitialized(true)
    }
  }

  // Reset inactivity timeout
  const resetInactivityTimeout = useCallback(() => {
    // Clear existing timeout
    if (inactivityTimeoutRef.current) {
      clearTimeout(inactivityTimeoutRef.current)
      inactivityTimeoutRef.current = null
    }

    // Set new timeout - stop recording after 2 minutes of silence
    inactivityTimeoutRef.current = setTimeout(() => {
      if (isMicActive) {
        console.log("No speech detected for 2 minutes, stopping recording")
        setInfoBanner("No speech detected for a while, stopping microphone")
        stopRecording()

        // Clear banner after 3 seconds
        setTimeout(() => {
          setInfoBanner(null)
        }, 3000)
      }
    }, 120000) // 2 minutes
  }, [isMicActive])

  // Clean up all resources
  const cleanupResources = useCallback(() => {
    console.log("Cleaning up resources...")

    // Clear inactivity timeout
    if (inactivityTimeoutRef.current) {
      clearTimeout(inactivityTimeoutRef.current)
      inactivityTimeoutRef.current = null
    }

    // Clear speak timeout
    if (speakTimeoutRef.current) {
      clearTimeout(speakTimeoutRef.current)
      speakTimeoutRef.current = null
    }

    // Stop SpeechRecognition
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop()
      } catch (e) {
        console.error("Error stopping recognition:", e)
      }
      recognitionRef.current = null
    }

    // Stop media stream tracks
    if (mediaStreamRef.current) {
      try {
        mediaStreamRef.current.getTracks().forEach((track) => {
          track.stop()
        })
      } catch (e) {
        console.error("Error stopping media stream:", e)
      }
      mediaStreamRef.current = null
    }

    // Clean up audio context
    if (audioContextRef.current) {
      try {
        audioContextRef.current.close()
      } catch (e) {
        console.error("Error closing audio context:", e)
      }
      audioContextRef.current = null
    }

    // Cancel animation frame
    if (animationIdRef.current) {
      cancelAnimationFrame(animationIdRef.current)
      animationIdRef.current = null
    }

    // Reset state
    setVolumeLevel(0)
    setIsMicActive(false)
    setIsStoppingRecording(false)
    restartAttemptRef.current = 0
  }, [])

  // Start recording with browser's SpeechRecognition
  const startRecording = async () => {
    try {
      console.log("Starting recording...")
      setError(null)
      setSpeechError(null)
      setIsStoppingRecording(false)

      // Cancel any ongoing speech
      cancel()

      if (!isBrowserSupported) {
        throw new Error("Speech recognition is not supported in this browser")
      }

      // Clean up any existing resources first
      cleanupResources()

      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      })
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
        resetInactivityTimeout()
      }

      recognition.onresult = (event: any) => {
        if (isStoppingRecording) return

        // Reset inactivity timeout on speech
        resetInactivityTimeout()

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript
          const isFinal = event.results[i].isFinal

          if (transcript.trim() !== "") {
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
              // Add to translation queue
              translationQueueRef.current.push({
                text: transcript,
                inputLang: inputLanguage,
                outputLang: outputLanguage,
                model: selectedModel,
              })

              // Process queue if not already processing
              if (!processingTranslationRef.current) {
                processTranslationQueue()
              }
            }
          }
        }
      }

      recognition.onerror = (event: any) => {
        if (isStoppingRecording) return
        console.error("SpeechRecognition error:", event.error)

        // Don't show "aborted" errors when we're intentionally stopping
        if (event.error !== "aborted" && event.error !== "no-speech") {
          setError(`Browser speech recognition error: ${event.error}`)
        }
      }

      recognition.onend = () => {
        console.log("SpeechRecognition ended")

        // Restart if we're still supposed to be recording and not intentionally stopping
        if (isMicActive && !isStoppingRecording) {
          // Limit restart attempts to prevent infinite loops
          if (restartAttemptRef.current < 3) {
            console.log(`Restarting SpeechRecognition (attempt ${restartAttemptRef.current + 1})...`)
            restartAttemptRef.current++

            try {
              setTimeout(() => {
                if (recognitionRef.current) {
                  recognitionRef.current.start()
                }
              }, 300) // Small delay before restart
            } catch (e) {
              console.error("Error restarting recognition:", e)
              setError("Failed to restart speech recognition. Please try again.")
              setIsMicActive(false)
              cleanupResources()
            }
          } else {
            console.error("Too many restart attempts, stopping recording")
            setError("Speech recognition stopped due to too many restart attempts. Please try again.")
            setIsMicActive(false)
            cleanupResources()
          }
        } else {
          setIsMicActive(false)
          setIsStoppingRecording(false)
          cleanupResources()
        }
      }

      // Start recognition
      recognition.start()

      // Start inactivity timeout
      resetInactivityTimeout()
    } catch (error) {
      console.error("Failed to start recording:", error)
      setError(`Recording failed: ${error instanceof Error ? error.message : String(error)}`)
      setIsMicActive(false)
      setIsStoppingRecording(false)
      cleanupResources()
    }
  }

  // Process translation queue
  const processTranslationQueue = async () => {
    if (translationQueueRef.current.length === 0 || processingTranslationRef.current) {
      return
    }

    processingTranslationRef.current = true
    setIsTranslating(true)
    isTranslatingRef.current = true

    try {
      const item = translationQueueRef.current.shift()
      if (!item) {
        processingTranslationRef.current = false
        setIsTranslating(false)
        isTranslatingRef.current = false
        return
      }

      const result = await translateText(item.text, item.inputLang, item.outputLang, item.model)

      // Only update if we're still recording or if this is the last item
      if (isMicActive || translationQueueRef.current.length === 0) {
        setTranslatedTranscript((prev) => [...prev, { text: result.translation, speaker: result.speaker }])

        // Store the latest translation
        lastTranslationRef.current = result.translation

        // Auto-speak the translation if enabled
        if (autoSpeak) {
          // Cancel any ongoing speech first
          cancel()

          // Clear any pending speak timeouts
          if (speakTimeoutRef.current) {
            clearTimeout(speakTimeoutRef.current)
          }

          // Add a small delay before speaking to ensure everything is ready
          speakTimeoutRef.current = setTimeout(() => {
            try {
              speak(result.translation, outputLanguage)
            } catch (error) {
              console.error("Error auto-speaking translation:", error)
              setSpeechError(`Failed to speak: ${error instanceof Error ? error.message : String(error)}`)
            }
            speakTimeoutRef.current = null
          }, 500)
        }
      }

      // Process next item if any
      if (translationQueueRef.current.length > 0) {
        processTranslationQueue()
      } else {
        processingTranslationRef.current = false
        setIsTranslating(false)
        isTranslatingRef.current = false
      }
    } catch (error) {
      console.error("Error processing translation queue:", error)
      processingTranslationRef.current = false
      setIsTranslating(false)
      isTranslatingRef.current = false

      // Continue with next item if any
      if (translationQueueRef.current.length > 0) {
        setTimeout(processTranslationQueue, 1000) // Retry after a delay
      }
    }
  }

  // Stop recording
  const stopRecording = useCallback(() => {
    console.log("Stopping recording...")
    setIsStoppingRecording(true)

    // Cancel any ongoing speech if auto-speak is enabled
    if (autoSpeak) {
      cancel()
    }

    // Clear any pending speak timeouts
    if (speakTimeoutRef.current) {
      clearTimeout(speakTimeoutRef.current)
      speakTimeoutRef.current = null
    }

    // Complete any pending translations
    if (translationQueueRef.current.length > 0) {
      setInfoBanner("Completing pending translations...")
    }

    cleanupResources()
  }, [cleanupResources, cancel, autoSpeak])

  // Toggle microphone
  const toggleMic = () => {
    if (isMicActive || isStoppingRecording) {
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

  // Create a cache key for translations
  const createCacheKey = (text: string, inputLang: string, outputLang: string, model: string) => {
    return `${text}|${inputLang}|${outputLang}|${model}`
  }

  // Translation function
  async function translateText(text: string, inputLang: string, outputLang: string, model: string) {
    // Check cache first
    const cacheKey = createCacheKey(text, inputLang, outputLang, model)
    if (translationCache.has(cacheKey)) {
      const cachedResult = translationCache.get(cacheKey)!
      return {
        translation: cachedResult.translation,
        speaker: cachedResult.speaker as "patient" | "provider" | "unknown",
      }
    }

    // Don't translate if input and output languages are the same base language
    if (inputLang.split("-")[0] === outputLang) {
      return {
        translation: text,
        speaker: "unknown",
      }
    }

    try {
      // Determine which API to use based on the model and provider preference
      let apiEndpoint = "/api/translate" // Default to Groq
      let modelToUse = model

      // If model is a Together model or provider is Together
      if (model.includes("meta-llama") || model.includes("mistralai") || translationProvider === "together") {
        apiEndpoint = "/api/translate-together"
        modelToUse = model.includes("meta-llama") || model.includes("mistralai") ? model : TOGETHER_DEFAULT_MODEL
      }
      // If model is a Groq model or provider is Groq
      else if (
        model.includes("llama3-") ||
        model.includes("mixtral-") ||
        model.includes("gemma-") ||
        translationProvider === "groq"
      ) {
        apiEndpoint = "/api/translate"
        modelToUse =
          model.includes("llama3-") || model.includes("mixtral-") || model.includes("gemma-")
            ? model
            : GROQ_DEFAULT_MODEL
      }

      console.log(`Translating with ${apiEndpoint}, model: ${modelToUse}`)

      const response = await fetch(apiEndpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text,
          inputLanguage: inputLang,
          outputLanguage: outputLang,
          model: modelToUse,
        }),
      })

      // Check for 503 error specifically for Groq
      if (!response.ok && apiEndpoint === "/api/translate" && response.status === 503) {
        console.log("Groq service unavailable (503), switching to Together AI")

        // Switch to Together AI for this translation
        const togetherResponse = await fetch("/api/translate-together", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            text,
            inputLanguage: inputLang,
            outputLanguage: outputLang,
            model: TOGETHER_DEFAULT_MODEL,
          }),
        })

        if (togetherResponse.ok) {
          const data = await togetherResponse.json()
          const result = {
            translation: data.translation || data.translatedText || text,
            speaker: data.speaker || ("unknown" as "patient" | "provider" | "unknown"),
          }

          // Cache the result
          translationCache.set(cacheKey, {
            translation: result.translation,
            speaker: result.speaker,
          })

          return result
        }
      }

      // If primary service fails (not 503 for Groq), try the other one
      if (!response.ok) {
        console.log(`${apiEndpoint} failed, trying alternative service`)

        // Try the alternative service
        const alternativeEndpoint = apiEndpoint === "/api/translate" ? "/api/translate-together" : "/api/translate"

        const alternativeModel = apiEndpoint === "/api/translate" ? TOGETHER_DEFAULT_MODEL : GROQ_DEFAULT_MODEL

        const alternativeResponse = await fetch(alternativeEndpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            text,
            inputLanguage: inputLang,
            outputLanguage: outputLang,
            model: alternativeModel,
          }),
        })

        if (alternativeResponse.ok) {
          const data = await alternativeResponse.json()
          const result = {
            translation: data.translation || data.translatedText || text,
            speaker: data.speaker || ("unknown" as "patient" | "provider" | "unknown"),
          }

          // Cache the result
          translationCache.set(cacheKey, {
            translation: result.translation,
            speaker: result.speaker,
          })

          return result
        }

        // If both services fail, use a simple fallback
        return {
          translation: `[Translation failed] ${text}`,
          speaker: "unknown",
        }
      }

      const data = await response.json()
      const result = {
        translation: data.translation || data.translatedText || text,
        speaker: data.speaker || ("unknown" as "patient" | "provider" | "unknown"),
      }

      // Cache the result
      translationCache.set(cacheKey, {
        translation: result.translation,
        speaker: result.speaker,
      })

      return result
    } catch (error) {
      console.error("Translation error:", error)
      return {
        translation: `[Error] ${error instanceof Error ? error.message : "Translation failed"}`,
        speaker: "unknown",
      }
    }
  }

  // Switch input and output languages
  const switchLanguages = () => {
    // Cancel any ongoing speech
    cancel()

    // Clear any pending speak timeouts
    if (speakTimeoutRef.current) {
      clearTimeout(speakTimeoutRef.current)
      speakTimeoutRef.current = null
    }

    // Get the current languages
    const currentInputLang = inputLanguage
    const currentOutputLang = outputLanguage

    // Find the best matching input language for the current output language
    const newInputLang = findMatchingInputLanguage(currentOutputLang)

    // Get the base language from the current input language
    const newOutputLang = currentInputLang.split("-")[0]

    console.log(`Switching languages: ${currentInputLang} -> ${newInputLang}, ${currentOutputLang} -> ${newOutputLang}`)

    // Set the new languages
    setInputLanguage(newInputLang)
    setOutputLanguage(newOutputLang)

    // Show info banner
    setInfoBanner("Languages switched")
    setTimeout(() => setInfoBanner(null), 3000)

    // Reset transcripts
    setOriginalTranscript([])
    setTranslatedTranscript([])

    // Clear translation cache
    translationCache.clear()

    // Restart recording if active
    if (isMicActive) {
      stopRecording()
      setTimeout(() => startRecording(), 500)
    }
  }

  // Reset when language changes
  useEffect(() => {
    // Cancel any ongoing speech
    cancel()

    // Clear any pending speak timeouts
    if (speakTimeoutRef.current) {
      clearTimeout(speakTimeoutRef.current)
      speakTimeoutRef.current = null
    }

    setOriginalTranscript([])
    setTranslatedTranscript([])
    setInfoBanner("Language changed, resetting...")
    const t = setTimeout(() => setInfoBanner(null), 3000)

    // Clear translation cache
    translationCache.clear()

    // Clear translation queue
    translationQueueRef.current = []

    if (isMicActive) {
      stopRecording()
      setTimeout(() => startRecording(), 500)
    }

    return () => clearTimeout(t)
  }, [inputLanguage, outputLanguage, selectedModel, stopRecording, cancel])

  // Handle speaking the latest translation
  const handleSpeak = useCallback(
    (text: string) => {
      // Reset speech error
      setSpeechError(null)

      // Clear any pending speak timeouts
      if (speakTimeoutRef.current) {
        clearTimeout(speakTimeoutRef.current)
        speakTimeoutRef.current = null
      }

      if (isSpeaking) {
        cancel()
      } else {
        try {
          speak(text, outputLanguage)
        } catch (error) {
          console.error("Error speaking translation:", error)
          setSpeechError(`Failed to speak: ${error instanceof Error ? error.message : String(error)}`)
        }
      }
    },
    [speak, cancel, isSpeaking, outputLanguage],
  )

  // Reset everything
  const handleReset = () => {
    // Cancel any ongoing speech
    cancel()

    // Clear any pending speak timeouts
    if (speakTimeoutRef.current) {
      clearTimeout(speakTimeoutRef.current)
      speakTimeoutRef.current = null
    }

    stopRecording()
    setOriginalTranscript([])
    setTranslatedTranscript([])
    translationCache.clear()
    translationQueueRef.current = []
    setInfoBanner("Reset complete")
    setSpeechError(null)
    setTimeout(() => setInfoBanner(null), 3000)
  }

  // Toggle auto-speak
  const toggleAutoSpeak = () => {
    setAutoSpeak(!autoSpeak)
    setInfoBanner(`Auto-speak ${!autoSpeak ? "enabled" : "disabled"}`)
    setTimeout(() => setInfoBanner(null), 3000)

    // If turning off auto-speak while speaking, cancel current speech
    if (autoSpeak && isSpeaking) {
      cancel()
    }
  }

  // Show loading state until initialized
  if (!isInitialized) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
          <p className="mt-2">Initializing Healthcare Translator...</p>
        </div>
      </div>
    )
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

            {/* Language Switcher */}
            <LanguageSwitcher onSwitch={switchLanguages} />

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
            <ModelSelector value={selectedModel} onChange={setSelectedModel} preferredProvider={translationProvider} />
          </div>

          {/* Auto-speak toggle */}
          <div className="flex items-center space-x-2 mb-4 justify-center">
            <Switch id="auto-speak" checked={autoSpeak} onCheckedChange={toggleAutoSpeak} />
            <Label htmlFor="auto-speak">Auto-speak translations</Label>
          </div>

          {/* Translation Service Indicator */}
          <div className="mb-4 text-center">
            <span className="text-sm font-medium">
              Translation Service:{" "}
              {translationProvider === "groq" ? (
                <span className="text-green-600">Groq (Primary)</span>
              ) : (
                <span className="text-amber-600">Together AI (Fallback)</span>
              )}
            </span>
          </div>

          {/* Microphone button - always visible */}
          <div className="flex justify-center gap-4 mb-4">
            <Button
              onClick={toggleMic}
              variant={isMicActive ? "destructive" : "default"}
              className="flex items-center gap-2 px-6 py-3 text-lg"
              disabled={!isBrowserSupported || isStoppingRecording}
            >
              {isMicActive ? (
                <>
                  <MicOff size={20} /> Stop Microphone
                </>
              ) : isStoppingRecording ? (
                <>
                  <Loader2 className="animate-spin" size={20} /> Stopping...
                </>
              ) : (
                <>
                  <Mic size={20} /> Start Microphone
                </>
              )}
            </Button>

            <Button
              onClick={handleReset}
              variant="outline"
              className="flex items-center gap-2"
              title="Reset everything"
            >
              <RefreshCw size={18} />
            </Button>
          </div>

          {isMicActive && (
            <div className="flex justify-center mb-4">
              <AudioVisualizer level={volumeLevel} />
            </div>
          )}

          <Banner message={error} type="error" />
          <Banner message={infoBanner} type="info" />
          {speechError && <Banner message={`Speech error: ${speechError}`} type="error" />}

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
                {isSpeaking ? (
                  <>
                    <VolumeX size={18} /> Stop Speaking
                  </>
                ) : (
                  <>
                    <Volume2 size={18} /> Speak Latest Translation
                  </>
                )}
              </Button>
            </div>
          )}
        </div>
      </div>
    </main>
  )
}

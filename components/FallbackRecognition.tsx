"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Mic, MicOff, Loader2 } from "lucide-react"
import AudioVisualizer from "./AudioVisualizer"

type FallbackRecognitionProps = {
  language: string
  onTranscript: (text: string, isFinal: boolean) => void
  onError: (error: Error) => void
}

// Define SpeechRecognition interface without importing it
interface SpeechRecognitionEvent {
  resultIndex: number
  results: {
    [index: number]: {
      [index: number]: {
        transcript: string
      }
      isFinal: boolean
      length: number
    }
    length: number
  }
}

// Extend the Window interface to include SpeechRecognition
declare global {
  interface Window {
    SpeechRecognition: any
    webkitSpeechRecognition: any
    AudioContext: any
    webkitAudioContext: any
  }
}

export default function FallbackRecognition({ language, onTranscript, onError }: FallbackRecognitionProps) {
  const [isRecording, setIsRecording] = useState(false)
  const [volumeLevel, setVolumeLevel] = useState(0)
  const [isInitializing, setIsInitializing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isBrowserSupported, setIsBrowserSupported] = useState(true)

  const recognitionRef = useRef<any>(null)
  const mediaStreamRef = useRef<MediaStream | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const animationIdRef = useRef<number | null>(null)

  // Check browser support on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const isSpeechRecognitionSupported =
        window.SpeechRecognition !== undefined || window.webkitSpeechRecognition !== undefined

      setIsBrowserSupported(isSpeechRecognitionSupported)

      if (!isSpeechRecognitionSupported) {
        const errorMsg = "Speech recognition is not supported in this browser. Please try Chrome, Edge, or Safari."
        setError(errorMsg)
        onError(new Error(errorMsg))
      }
    }
  }, [onError])

  // Initialize browser's SpeechRecognition
  const initializeSpeechRecognition = async () => {
    try {
      setIsInitializing(true)
      setError(null)

      if (!isBrowserSupported) {
        throw new Error("SpeechRecognition not supported in this browser")
      }

      // Set up audio visualization
      await setupAudioVisualization()

      // Use a safer approach to access the SpeechRecognition API
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
      if (!SpeechRecognition) {
        throw new Error("SpeechRecognition not available in this browser")
      }

      const recognition = new SpeechRecognition()
      recognitionRef.current = recognition

      // Configure recognition
      recognition.continuous = true
      recognition.interimResults = true
      recognition.lang = language

      // Set up event handlers
      recognition.onstart = () => {
        console.log("SpeechRecognition started")
        setIsRecording(true)
        setIsInitializing(false)
      }

      recognition.onresult = (event: any) => {
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript
          const isFinal = event.results[i].isFinal

          if (transcript.trim() !== "") {
            console.log(`Fallback transcript received (${isFinal ? "final" : "interim"}):`, transcript)
            onTranscript(transcript, isFinal)
          }
        }
      }

      recognition.onerror = (event: any) => {
        console.error("SpeechRecognition error:", event.error)
        setError(`Browser speech recognition error: ${event.error}`)
        onError(new Error(event.error))
      }

      recognition.onend = () => {
        console.log("SpeechRecognition ended")
        // Restart if we're still supposed to be recording
        if (isRecording) {
          console.log("Restarting SpeechRecognition...")
          recognition.start()
        } else {
          setIsRecording(false)
        }
      }

      // Start recognition
      recognition.start()
    } catch (error) {
      console.error("Failed to initialize browser SpeechRecognition:", error)
      setError(`Failed to initialize speech recognition: ${error instanceof Error ? error.message : String(error)}`)
      onError(error instanceof Error ? error : new Error(String(error)))
      setIsInitializing(false)
      setIsRecording(false)
    }
  }

  // Set up audio visualization
  const setupAudioVisualization = async () => {
    try {
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
      const AudioContext = window.AudioContext || window.webkitAudioContext
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
    } catch (error) {
      console.error("Error setting up audio visualization:", error)
      throw error
    }
  }

  // Animate volume meter
  const animateVolume = () => {
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

  // Stop recording
  const stopRecording = () => {
    setIsRecording(false)

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

  // Toggle recording
  const toggleRecording = () => {
    if (isRecording) {
      stopRecording()
    } else {
      initializeSpeechRecognition()
    }
  }

  // Clean up on unmount
  useEffect(() => {
    return () => {
      stopRecording()
    }
  }, [])

  // Update when language changes
  useEffect(() => {
    if (isRecording) {
      stopRecording()
      initializeSpeechRecognition()
    }
  }, [language])

  return (
    <div className="flex flex-col items-center gap-4">
      <Button
        onClick={toggleRecording}
        variant={isRecording ? "destructive" : "default"}
        className="flex items-center gap-2"
        disabled={isInitializing || !isBrowserSupported}
      >
        {isInitializing ? (
          <>
            <Loader2 className="animate-spin" size={18} /> Initializing...
          </>
        ) : isRecording ? (
          <>
            <MicOff size={18} /> Stop Recording
          </>
        ) : (
          <>
            <Mic size={18} /> Start Recording
          </>
        )}
      </Button>

      {isRecording && (
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">Recording</span>
          <AudioVisualizer level={volumeLevel} />
        </div>
      )}

      {error && <div className="text-sm text-red-500 text-center">{error}</div>}

      {!isBrowserSupported && (
        <div className="text-sm text-amber-500 text-center mt-2">
          Your browser doesn't support speech recognition. Please try Chrome, Edge, or Safari.
        </div>
      )}
    </div>
  )
}

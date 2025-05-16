"use client"

import { useState, useEffect, useRef, useCallback } from "react"

type TranscriptSegment = {
  text: string
  isFinal: boolean
  speaker?: "patient" | "provider" | "unknown"
}

type UseDeepgramStreamReturn = {
  isMicActive: boolean
  volumeLevel: number // 0 to 1
  toggleMic: () => void
  status: "idle" | "connecting" | "connected" | "error"
  errorMessage: string | null
}

// Extend the Window interface to include SpeechRecognition
declare global {
  interface Window {
    SpeechRecognition: any
    webkitSpeechRecognition: any
  }
}

export function useDeepgramStream(
  language: string,
  onTranscript: (segment: TranscriptSegment) => void,
  onError: (error: Error) => void,
): UseDeepgramStreamReturn {
  const [isMicActive, setIsMicActive] = useState(false)
  const [volumeLevel, setVolumeLevel] = useState(0)
  const [status, setStatus] = useState<"idle" | "connecting" | "connected" | "error">("idle")
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isBrowserSupported, setIsBrowserSupported] = useState(true)

  const mediaStreamRef = useRef<MediaStream | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const websocketRef = useRef<WebSocket | null>(null)
  const processorRef = useRef<ScriptProcessorNode | null>(null)
  const animationIdRef = useRef<number | null>(null)
  const recognitionRef = useRef<any>(null)

  // Check browser support on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const isSpeechRecognitionSupported =
        window.SpeechRecognition !== undefined || window.webkitSpeechRecognition !== undefined

      setIsBrowserSupported(isSpeechRecognitionSupported)
    }
  }, [])

  // Toggle microphone
  const toggleMic = useCallback(() => {
    if (isMicActive) {
      stopRecording()
    } else {
      startRecording()
    }
  }, [isMicActive])

  // Start recording
  const startRecording = useCallback(async () => {
    try {
      console.log("Starting recording...")
      setStatus("connecting")
      setErrorMessage(null)

      // First try Voicegain
      try {
        await startVoicegainRecording()
      } catch (error) {
        console.error("Voicegain recording failed, falling back to browser recognition:", error)
        // If Voicegain fails, try browser's SpeechRecognition
        await startBrowserSpeechRecognition()
      }
    } catch (error) {
      console.error("All recording methods failed:", error)
      setStatus("error")
      setErrorMessage(`Recording failed: ${error instanceof Error ? error.message : String(error)}`)
      onError(error instanceof Error ? error : new Error(String(error)))
      setIsMicActive(false)
    }
  }, [language, onTranscript, onError])

  // Stop recording
  const stopRecording = useCallback(() => {
    console.log("Stopping recording...")
    setIsMicActive(false)
    setStatus("idle")

    // Close WebSocket connection
    if (websocketRef.current) {
      websocketRef.current.close()
      websocketRef.current = null
    }

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
    if (processorRef.current) {
      processorRef.current.disconnect()
      processorRef.current = null
    }

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
  }, [])

  // Start Voicegain recording
  const startVoicegainRecording = async () => {
    console.log("Starting Voicegain recording...")

    // Get WebSocket URL from our API
    const response = await fetch(`/api/start-voicegain-session?language=${encodeURIComponent(language)}`)

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: "Unknown error" }))
      console.error("Voicegain session error:", errorData)
      throw new Error(errorData.error || `Failed to start Voicegain session: ${response.status}`)
    }

    const { websocketUrl, sessionId } = await response.json()
    console.log("Received WebSocket URL:", websocketUrl)
    console.log("Session ID:", sessionId)

    // Request microphone access
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      },
    })
    mediaStreamRef.current = stream

    // Set up audio context
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

    // Create script processor for audio processing
    const processor = audioContext.createScriptProcessor(4096, 1, 1)
    processorRef.current = processor

    // Connect the processor
    source.connect(processor)
    processor.connect(audioContext.destination)

    // Create WebSocket connection
    const ws = new WebSocket(websocketUrl)
    websocketRef.current = ws

    // WebSocket event handlers
    ws.onopen = () => {
      console.log("WebSocket connection established")
      setStatus("connected")
      setIsMicActive(true)
    }

    ws.onclose = (event) => {
      console.log("WebSocket connection closed:", event.code, event.reason)
      if (isMicActive) {
        // Try browser's SpeechRecognition as fallback
        startBrowserSpeechRecognition().catch((error) => {
          console.error("Browser speech recognition failed:", error)
          stopRecording()
        })
      }
    }

    ws.onerror = (error) => {
      console.error("WebSocket error:", error)
      throw new Error("WebSocket error occurred")
    }

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        console.log("Received WebSocket message:", data)

        // Process transcript data
        if (data.result && data.result.alternatives && data.result.alternatives.length > 0) {
          const transcript = data.result.alternatives[0].transcript
          const isFinal = data.result.final === true

          if (transcript && transcript.trim() !== "") {
            console.log(`Transcript received (${isFinal ? "final" : "interim"}):`, transcript)
            onTranscript({
              text: transcript,
              isFinal,
              speaker: "unknown",
            })
          }
        }
      } catch (error) {
        console.error("Error processing WebSocket message:", error)
      }
    }

    // Process audio data and send to WebSocket
    processor.onaudioprocess = (e) => {
      if (ws.readyState === WebSocket.OPEN) {
        // Get audio data
        const inputData = e.inputBuffer.getChannelData(0)

        // Convert to 16-bit PCM
        const pcmData = new Int16Array(inputData.length)
        for (let i = 0; i < inputData.length; i++) {
          pcmData[i] = Math.max(-1, Math.min(1, inputData[i])) * 0x7fff
        }

        // Send audio data to WebSocket
        ws.send(pcmData.buffer)
      }
    }

    // Start animation for volume visualization
    animateVolume()
  }

  // Start browser's SpeechRecognition
  const startBrowserSpeechRecognition = async () => {
    console.log("Starting browser SpeechRecognition...")

    if (!isBrowserSupported) {
      throw new Error("SpeechRecognition not supported in this browser")
    }

    // Request microphone access for visualization
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

    // Use a safer approach to access the SpeechRecognition API
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRecognition) {
      throw new Error("SpeechRecognition not available in this browser")
    }

    // Create and configure SpeechRecognition
    const recognition = new SpeechRecognition()
    recognitionRef.current = recognition

    recognition.continuous = true
    recognition.interimResults = true
    recognition.lang = language

    // Set up event handlers
    recognition.onstart = () => {
      console.log("SpeechRecognition started")
      setStatus("connected")
      setIsMicActive(true)
    }

    recognition.onresult = (event: any) => {
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript
        const isFinal = event.results[i].isFinal

        if (transcript.trim() !== "") {
          console.log(`Browser transcript received (${isFinal ? "final" : "interim"}):`, transcript)
          onTranscript({
            text: transcript,
            isFinal,
            speaker: "unknown",
          })
        }
      }
    }

    recognition.onerror = (event: any) => {
      console.error("SpeechRecognition error:", event.error)
      setStatus("error")
      setErrorMessage(`Browser speech recognition error: ${event.error}`)
      onError(new Error(event.error))
    }

    recognition.onend = () => {
      console.log("SpeechRecognition ended")
      // Restart if we're still supposed to be recording
      if (isMicActive) {
        console.log("Restarting SpeechRecognition...")
        recognition.start()
      } else {
        setStatus("idle")
      }
    }

    // Start recognition
    recognition.start()
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

  // Clean up on unmount or language change
  useEffect(() => {
    return () => {
      stopRecording()
    }
  }, [language, stopRecording])

  return { isMicActive, volumeLevel, toggleMic, status, errorMessage }
}

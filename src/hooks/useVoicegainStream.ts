"use client"

import { useState, useEffect, useRef, useCallback } from "react"

type TranscriptSegment = {
  text: string
  isFinal: boolean
  speaker?: "patient" | "provider" | "unknown"
}

type UseVoicegainStreamReturn = {
  isRecording: boolean
  volumeLevel: number // 0 to 1
  toggleRecording: () => void
  recordingError: string | null
  isProcessing: boolean
}

export function useVoicegainStream(
  language: string,
  onTranscript: (segment: TranscriptSegment) => void,
  onError: (error: Error) => void,
  onConnectionStatus?: (status: "disconnected" | "connecting" | "connected") => void,
  useFallback = false,
): UseVoicegainStreamReturn {
  const [isRecording, setIsRecording] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [volumeLevel, setVolumeLevel] = useState(0)
  const [recordingError, setRecordingError] = useState<string | null>(null)

  const mediaStreamRef = useRef<MediaStream | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const websocketRef = useRef<WebSocket | null>(null)
  const processorRef = useRef<ScriptProcessorNode | null>(null)
  const animationIdRef = useRef<number | null>(null)
  const recognitionRef = useRef<SpeechRecognition | null>(null)
  const retryCountRef = useRef(0)
  const maxRetries = 3

  // Stop recording
  const stopRecording = useCallback(() => {
    console.log("Stopping recording...")
    setIsRecording(false)
    onConnectionStatus?.("disconnected")

    // Close WebSocket connection
    if (websocketRef.current) {
      websocketRef.current.close()
      websocketRef.current = null
    }

    // Stop SpeechRecognition if using fallback
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
    setRecordingError(null)
    setIsProcessing(false)
    retryCountRef.current = 0
  }, [onConnectionStatus])

  // Start browser's SpeechRecognition as fallback
  const startBrowserSpeechRecognition = useCallback(() => {
    try {
      console.log("Starting browser SpeechRecognition as fallback...")

      // Check if SpeechRecognition is available
      const SpeechRecognition = window.SpeechRecognition || (window as any).webkitSpeechRecognition

      if (!SpeechRecognition) {
        throw new Error("SpeechRecognition not supported in this browser")
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
        setIsProcessing(false)
        onConnectionStatus?.("connected")
      }

      recognition.onresult = (event) => {
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript
          const isFinal = event.results[i].isFinal

          if (transcript.trim() !== "") {
            onTranscript({
              text: transcript,
              isFinal,
              speaker: "unknown",
            })
          }
        }
      }

      recognition.onerror = (event) => {
        console.error("SpeechRecognition error:", event.error)
        setRecordingError(`Browser speech recognition error: ${event.error}`)
      }

      recognition.onend = () => {
        console.log("SpeechRecognition ended")
        // Restart if we're still supposed to be recording
        if (isRecording) {
          console.log("Restarting SpeechRecognition...")
          recognition.start()
        } else {
          setIsRecording(false)
          onConnectionStatus?.("disconnected")
        }
      }

      // Start recognition
      recognition.start()

      // Set up audio visualization
      setupAudioVisualization()

      return true
    } catch (error) {
      console.error("Failed to start browser SpeechRecognition:", error)
      setRecordingError(
        `Failed to start browser speech recognition: ${error instanceof Error ? error.message : String(error)}`,
      )
      onError(error instanceof Error ? error : new Error(String(error)))
      return false
    }
  }, [language, onTranscript, onError, isRecording, onConnectionStatus])

  // Set up audio visualization
  const setupAudioVisualization = useCallback(async () => {
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
    } catch (error) {
      console.error("Error setting up audio visualization:", error)
    }
  }, [])

  // Start Voicegain streaming
  const startVoicegainStreaming = useCallback(async () => {
    try {
      setRecordingError(null)
      setIsProcessing(true)
      onConnectionStatus?.("connecting")
      console.log(`Starting Voicegain streaming with language: ${language}...`)

      // Get WebSocket URL from our API
      const response = await fetch(`/api/start-voicegain-session?language=${encodeURIComponent(language)}`)

      if (!response.ok) {
        let errorMessage = "Failed to start Voicegain session"
        try {
          const errorData = await response.json()
          errorMessage = errorData.error || errorMessage
          console.error("Voicegain session error:", errorData)

          // Check if we should retry
          if (retryCountRef.current < maxRetries && (response.status === 429 || response.status >= 500)) {
            retryCountRef.current++
            const delay = Math.pow(2, retryCountRef.current) * 1000 // Exponential backoff
            console.log(`Retrying in ${delay}ms (attempt ${retryCountRef.current} of ${maxRetries})...`)

            setTimeout(() => startVoicegainStreaming(), delay)
            return
          }

          // If authentication error or max retries reached, try fallback
          if (response.status === 401 || response.status === 403 || retryCountRef.current >= maxRetries) {
            console.log("Switching to browser SpeechRecognition fallback...")
            if (startBrowserSpeechRecognition()) {
              return
            }
          }
        } catch (e) {
          console.error("Error parsing error response:", e)
        }

        throw new Error(errorMessage)
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

      // Set up audio context for processing and volume visualization
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
        setIsProcessing(false)
        setIsRecording(true)
        onConnectionStatus?.("connected")
        retryCountRef.current = 0 // Reset retry counter on successful connection
      }

      ws.onclose = (event) => {
        console.log("WebSocket connection closed:", event.code, event.reason)

        // If we're still supposed to be recording, try to reconnect or use fallback
        if (isRecording) {
          if (retryCountRef.current < maxRetries) {
            retryCountRef.current++
            const delay = Math.pow(2, retryCountRef.current) * 1000 // Exponential backoff
            console.log(
              `WebSocket closed. Reconnecting in ${delay}ms (attempt ${retryCountRef.current} of ${maxRetries})...`,
            )

            setTimeout(() => startVoicegainStreaming(), delay)
          } else {
            console.log("Max retries reached. Switching to browser SpeechRecognition fallback...")
            startBrowserSpeechRecognition()
          }
        } else {
          onConnectionStatus?.("disconnected")
        }
      }

      ws.onerror = (error) => {
        console.error("WebSocket error:", error)
        setRecordingError("WebSocket error occurred")
        onError(new Error("WebSocket error occurred"))

        // Try fallback on WebSocket error
        if (isRecording) {
          console.log("WebSocket error. Switching to browser SpeechRecognition fallback...")
          startBrowserSpeechRecognition()
        }
      }

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)

          // Process transcript data
          if (data.result && data.result.alternatives && data.result.alternatives.length > 0) {
            const transcript = data.result.alternatives[0].transcript
            const isFinal = data.result.final === true

            if (transcript && transcript.trim() !== "") {
              onTranscript({
                text: transcript,
                isFinal,
                speaker: "unknown", // We'll determine speaker later with LLM
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

      console.log("Voicegain streaming started successfully")
    } catch (err) {
      console.error("Error starting Voicegain streaming:", err)
      setRecordingError(`Recording error: ${err instanceof Error ? err.message : String(err)}`)
      onError(err instanceof Error ? err : new Error(String(err)))

      // Try fallback on error
      console.log("Error starting Voicegain. Trying browser SpeechRecognition fallback...")
      if (!startBrowserSpeechRecognition()) {
        stopRecording()
        setIsProcessing(false)
        onConnectionStatus?.("disconnected")
      }
    }
  }, [language, onTranscript, onError, stopRecording, isRecording, onConnectionStatus, startBrowserSpeechRecognition])

  // Start recording
  const startRecording = useCallback(async () => {
    // If fallback mode is enabled, use browser's SpeechRecognition
    if (useFallback) {
      startBrowserSpeechRecognition()
    } else {
      // Otherwise try Voicegain first
      startVoicegainStreaming()
    }
  }, [useFallback, startBrowserSpeechRecognition, startVoicegainStreaming])

  // Toggle recording
  const toggleRecording = useCallback(() => {
    if (isRecording) {
      stopRecording()
    } else {
      startRecording()
    }
  }, [isRecording, startRecording, stopRecording])

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

  return { isRecording, volumeLevel, toggleRecording, recordingError, isProcessing }
}

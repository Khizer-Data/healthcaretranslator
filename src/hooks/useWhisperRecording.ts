"use client"

import { useState, useEffect, useRef, useCallback } from "react"

type TranscriptSegment = {
  text: string
  isFinal: boolean
  speaker?: "patient" | "provider" | "unknown"
}

type UseWhisperRecordingReturn = {
  isRecording: boolean
  volumeLevel: number // 0 to 1
  toggleRecording: () => void
  recordingError: string | null
  isProcessing: boolean
}

export function useWhisperRecording(
  language: string,
  onTranscript: (segment: TranscriptSegment) => void,
  onError: (error: Error) => void,
): UseWhisperRecordingReturn {
  const [isRecording, setIsRecording] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [volumeLevel, setVolumeLevel] = useState(0)
  const [recordingError, setRecordingError] = useState<string | null>(null)

  const mediaStreamRef = useRef<MediaStream | null>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const animationIdRef = useRef<number | null>(null)
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null)

  // Stop recording
  const stopRecording = useCallback(() => {
    console.log("Stopping recording...")
    setIsRecording(false)

    // Stop media recorder
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop()
      mediaRecorderRef.current = null
    }

    // Stop media stream tracks
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => {
        track.stop()
      })
      mediaStreamRef.current = null
    }

    // Clear audio context
    if (audioContextRef.current) {
      audioContextRef.current.close().catch(console.error)
      audioContextRef.current = null
    }

    // Cancel animation frame
    if (animationIdRef.current) {
      cancelAnimationFrame(animationIdRef.current)
      animationIdRef.current = null
    }

    // Clear recording interval
    if (recordingIntervalRef.current) {
      clearInterval(recordingIntervalRef.current)
      recordingIntervalRef.current = null
    }

    setVolumeLevel(0)
    setRecordingError(null)
  }, [])

  // Convert audio blob to mp3 format
  const convertToMP3 = useCallback(async (audioBlob: Blob): Promise<Blob> => {
    return new Promise((resolve) => {
      // For now, we'll just return the original blob but with a different MIME type
      // In a production app, you might want to use a library to actually convert the audio
      resolve(new Blob([audioBlob], { type: "audio/mp3" }))
    })
  }, [])

  // Process audio with Whisper via our server-side API
  const processAudio = useCallback(
    async (audioBlob: Blob) => {
      try {
        setIsProcessing(true)
        console.log(`Processing audio (${(audioBlob.size / 1024).toFixed(2)} KB)...`)

        // Create form data with audio file
        const formData = new FormData()

        // Convert to MP3 format which is more widely supported
        const mp3Blob = await convertToMP3(audioBlob)

        // Append with explicit filename and type
        formData.append("file", mp3Blob, "audio.mp3")
        formData.append("model", "whisper-1")
        formData.append("language", language.split("-")[0])
        formData.append("response_format", "json")

        console.log("Sending audio to server-side API for transcription...")

        // Use our server-side API route instead of directly calling OpenAI
        const response = await fetch("/api/transcribe", {
          method: "POST",
          body: formData,
        })

        if (!response.ok) {
          const errorData = await response.text()
          console.error("Transcription API error response:", errorData)
          throw new Error(`Transcription API error: ${response.status} - ${errorData}`)
        }

        const data = await response.json()
        console.log("Transcription result:", data)

        if (data.text && data.text.trim() !== "") {
          onTranscript({
            text: data.text,
            isFinal: true,
            speaker: "unknown", // We'll determine speaker later
          })
        }
      } catch (error) {
        console.error("Audio processing error:", error)
        onError(error instanceof Error ? error : new Error(String(error)))
      } finally {
        setIsProcessing(false)
      }
    },
    [language, onTranscript, onError, convertToMP3],
  )

  // Start recording
  const startRecording = useCallback(async () => {
    try {
      setRecordingError(null)
      console.log("Starting recording...")

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

      const source = audioContext.createMediaStreamSource(stream)
      const analyser = audioContext.createAnalyser()
      analyser.fftSize = 256
      analyserRef.current = analyser
      source.connect(analyser)

      // Check for supported MIME types
      const mimeType = getSupportedMimeType()
      console.log(`Using MIME type: ${mimeType}`)

      // Set up media recorder with the supported MIME type
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: mimeType,
      })
      mediaRecorderRef.current = mediaRecorder

      // Clear previous audio chunks
      audioChunksRef.current = []

      // Handle data available event
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data)
        }
      }

      // Handle recording stop event
      mediaRecorder.onstop = async () => {
        if (audioChunksRef.current.length > 0) {
          const audioBlob = new Blob(audioChunksRef.current, { type: mimeType })
          await processAudio(audioBlob)
          audioChunksRef.current = []
        }
      }

      // Start recording
      mediaRecorder.start()
      setIsRecording(true)

      // Set up volume visualization
      animateVolume()

      // Set up interval to process audio chunks every 5 seconds
      recordingIntervalRef.current = setInterval(() => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
          mediaRecorderRef.current.requestData() // Request data without stopping

          // Process accumulated chunks if we have any
          if (audioChunksRef.current.length > 0) {
            const audioBlob = new Blob(audioChunksRef.current, { type: mimeType })
            processAudio(audioBlob)
            audioChunksRef.current = [] // Clear chunks after processing
          }
        }
      }, 5000) // Process every 5 seconds

      console.log("Recording started successfully")
    } catch (err) {
      console.error("Error starting recording:", err)
      setRecordingError(`Recording error: ${err instanceof Error ? err.message : String(err)}`)
      onError(err instanceof Error ? err : new Error(String(err)))
      setIsRecording(false)
    }
  }, [processAudio, onError])

  // Helper function to get supported MIME type
  function getSupportedMimeType() {
    const types = ["audio/webm", "audio/mp4", "audio/ogg", "audio/wav", "audio/mpeg"]

    for (const type of types) {
      if (MediaRecorder.isTypeSupported(type)) {
        return type
      }
    }

    // Default fallback
    return "audio/webm"
  }

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

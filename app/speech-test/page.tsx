"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Mic, MicOff, Loader2 } from "lucide-react"
import AudioVisualizer from "@/components/AudioVisualizer"

export default function SpeechTestPage() {
  const [isRecording, setIsRecording] = useState(false)
  const [transcript, setTranscript] = useState("")
  const [interimTranscript, setInterimTranscript] = useState("")
  const [language, setLanguage] = useState("en-US")
  const [volumeLevel, setVolumeLevel] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [isInitializing, setIsInitializing] = useState(false)
  const [logs, setLogs] = useState<string[]>([])

  const recognitionRef = useRef<any>(null)
  const mediaStreamRef = useRef<MediaStream | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const animationIdRef = useRef<number | null>(null)

  const addLog = (message: string) => {
    const timestamp = new Date().toISOString().split("T")[1].split(".")[0]
    setLogs((prev) => [...prev, `[${timestamp}] ${message}`])
  }

  const startRecording = async () => {
    try {
      setIsInitializing(true)
      setError(null)
      addLog("Starting speech recognition...")

      // Check if SpeechRecognition is available
      const SpeechRecognition = window.SpeechRecognition || (window as any).webkitSpeechRecognition

      if (!SpeechRecognition) {
        throw new Error("SpeechRecognition not supported in this browser")
      }

      // Set up audio visualization
      await setupAudioVisualization()

      const recognition = new SpeechRecognition()
      recognitionRef.current = recognition

      // Configure recognition
      recognition.continuous = true
      recognition.interimResults = true
      recognition.lang = language

      // Set up event handlers
      recognition.onstart = () => {
        addLog("SpeechRecognition started")
        setIsRecording(true)
        setIsInitializing(false)
      }

      recognition.onresult = (event: any) => {
        let finalTranscript = ""
        let interimTranscript = ""

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript
          if (event.results[i].isFinal) {
            finalTranscript += transcript + " "
            addLog(`Final transcript: ${transcript}`)
          } else {
            interimTranscript += transcript
            addLog(`Interim transcript: ${transcript}`)
          }
        }

        if (finalTranscript) {
          setTranscript((prev) => prev + finalTranscript)
        }

        if (interimTranscript) {
          setInterimTranscript(interimTranscript)
        }
      }

      recognition.onerror = (event: any) => {
        addLog(`SpeechRecognition error: ${event.error}`)
        setError(`Browser speech recognition error: ${event.error}`)
        setIsInitializing(false)
      }

      recognition.onend = () => {
        addLog("SpeechRecognition ended")
        // Restart if we're still supposed to be recording
        if (isRecording) {
          addLog("Restarting SpeechRecognition...")
          recognition.start()
        } else {
          setIsRecording(false)
        }
      }

      // Start recognition
      recognition.start()
    } catch (error) {
      addLog(`Failed to initialize: ${error instanceof Error ? error.message : String(error)}`)
      setError(`Failed to initialize speech recognition: ${error instanceof Error ? error.message : String(error)}`)
      setIsInitializing(false)
      setIsRecording(false)
    }
  }

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
      addLog("Microphone access granted")

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
      addLog(`Audio visualization error: ${error instanceof Error ? error.message : String(error)}`)
      throw error
    }
  }

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

  const stopRecording = () => {
    addLog("Stopping recording...")
    setIsRecording(false)

    // Stop SpeechRecognition
    if (recognitionRef.current) {
      recognitionRef.current.stop()
      recognitionRef.current = null
    }

    // Stop media stream tracks
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track: MediaStreamTrack) => {
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
    setInterimTranscript("")
  }

  const toggleRecording = () => {
    if (isRecording) {
      stopRecording()
    } else {
      startRecording()
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
      startRecording()
    }
  }, [language])

  return (
    <div className="container mx-auto p-4">
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Speech Recognition Test</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Language</label>
            <Select value={language} onValueChange={setLanguage}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select language" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="en-US">English (US)</SelectItem>
                <SelectItem value="en-GB">English (UK)</SelectItem>
                <SelectItem value="es-ES">Spanish</SelectItem>
                <SelectItem value="fr-FR">French</SelectItem>
                <SelectItem value="de-DE">German</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-center mb-4">
            <Button
              onClick={toggleRecording}
              variant={isRecording ? "destructive" : "default"}
              className="flex items-center gap-2"
              disabled={isInitializing}
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
          </div>

          {isRecording && (
            <div className="flex justify-center mb-4">
              <AudioVisualizer level={volumeLevel} />
            </div>
          )}

          {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">{error}</div>}

          <div className="mb-4">
            <h3 className="font-medium mb-2">Transcript:</h3>
            <div className="bg-gray-100 p-4 rounded-md min-h-[100px]">
              {transcript}
              <span className="text-gray-500">{interimTranscript}</span>
            </div>
          </div>

          <div>
            <h3 className="font-medium mb-2">Debug Logs:</h3>
            <div className="bg-gray-100 p-4 rounded-md h-40 overflow-y-auto text-xs font-mono">
              {logs.map((log, i) => (
                <div key={i}>{log}</div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

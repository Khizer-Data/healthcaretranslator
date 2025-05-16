"use client"

import { useState, useEffect, useRef, useCallback } from "react"

interface UseTTSReturn {
  speak: (text: string, lang?: string) => void
  cancel: () => void
  isSpeaking: boolean
}

export function useTTS(): UseTTSReturn {
  const [isSpeaking, setIsSpeaking] = useState(false)
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  // Force cancel speech - most reliable way to stop speech
  const forceCancelSpeech = useCallback(() => {
    if (typeof window === "undefined") return

    try {
      console.log("Force cancelling speech...")

      // Cancel any ongoing speech
      window.speechSynthesis.cancel()

      // Clear any pending timeouts
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
        timeoutRef.current = null
      }

      // Clear any intervals
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }

      // Reset state
      setIsSpeaking(false)
      utteranceRef.current = null
    } catch (error) {
      console.error("Error cancelling speech:", error)
    }
  }, [])

  // Clean up on unmount
  useEffect(() => {
    return () => {
      forceCancelSpeech()
    }
  }, [forceCancelSpeech])

  // Cancel current speech
  const cancel = useCallback(() => {
    console.log("Cancelling speech...")
    forceCancelSpeech()
  }, [forceCancelSpeech])

  // Get available voices for a language
  const getVoicesForLanguage = useCallback((lang: string) => {
    if (typeof window === "undefined") return []

    try {
      const voices = window.speechSynthesis.getVoices()

      // Filter voices by language
      const langCode = lang.split("-")[0].toLowerCase()
      const filteredVoices = voices.filter((voice) => voice.lang.toLowerCase().startsWith(langCode))

      if (filteredVoices.length > 0) {
        console.log(
          `Found ${filteredVoices.length} voices for ${lang}:`,
          filteredVoices.map((v) => `${v.name} (${v.lang})`).join(", "),
        )
        return filteredVoices
      }

      console.log(`No voices found for ${lang}, using default voices`)
      return voices
    } catch (error) {
      console.error("Error getting voices:", error)
      return []
    }
  }, [])

  // Speak text
  const speak = useCallback(
    (text: string, lang = "en") => {
      if (typeof window === "undefined" || !window.speechSynthesis) {
        console.error("Speech synthesis not supported")
        return
      }

      console.log(`Speaking text in ${lang}: "${text}"`)

      // Cancel any ongoing speech first
      forceCancelSpeech()

      // Ensure we have the latest voices
      window.speechSynthesis.getVoices()

      try {
        // Create a new utterance
        const utterance = new SpeechSynthesisUtterance()
        utteranceRef.current = utterance

        // Set text and language
        utterance.text = text
        utterance.lang = lang
        utterance.rate = 1.0
        utterance.pitch = 1.0
        utterance.volume = 1.0

        // Try to find a suitable voice
        const voices = getVoicesForLanguage(lang)

        if (voices.length > 0) {
          // Try to find a good voice for this language
          let selectedVoice = null

          // First try to find a native voice for this language
          for (const voice of voices) {
            if (voice.lang.toLowerCase().startsWith(lang.toLowerCase())) {
              selectedVoice = voice
              break
            }
          }

          // If no native voice found, use the first available voice
          if (!selectedVoice && voices.length > 0) {
            selectedVoice = voices[0]
          }

          if (selectedVoice) {
            console.log(`Using voice: ${selectedVoice.name} (${selectedVoice.lang})`)
            utterance.voice = selectedVoice
          }
        }

        // Set event handlers
        utterance.onstart = () => {
          console.log("Speech started")
          setIsSpeaking(true)
        }

        utterance.onend = () => {
          console.log("Speech ended normally")
          setIsSpeaking(false)
          utteranceRef.current = null

          // Clear any intervals
          if (intervalRef.current) {
            clearInterval(intervalRef.current)
            intervalRef.current = null
          }
        }

        utterance.onerror = (event) => {
          // Extract useful information from the error event
          const errorType = event.error || "unknown"
          console.error(`Speech error: ${errorType}`)

          // Don't treat "interrupted" as an error when we're intentionally cancelling
          if (errorType !== "interrupted") {
            setIsSpeaking(false)
            utteranceRef.current = null
          }

          // Clear any intervals
          if (intervalRef.current) {
            clearInterval(intervalRef.current)
            intervalRef.current = null
          }
        }

        // Speak
        window.speechSynthesis.speak(utterance)

        // Set a timeout to check if speech actually started
        timeoutRef.current = setTimeout(() => {
          if (!window.speechSynthesis.speaking && utteranceRef.current) {
            console.log("Speech failed to start, trying alternative approach")

            // Try an alternative approach
            try {
              window.speechSynthesis.cancel()
              window.speechSynthesis.speak(utterance)
            } catch (e) {
              console.error("Alternative speech approach failed:", e)
              setIsSpeaking(false)
              utteranceRef.current = null
            }
          }
        }, 1000)

        // Some browsers need periodic resume to keep speaking
        intervalRef.current = setInterval(() => {
          if (window.speechSynthesis.speaking) {
            console.log("Keeping speech synthesis active...")
            window.speechSynthesis.pause()
            window.speechSynthesis.resume()
          } else if (intervalRef.current) {
            clearInterval(intervalRef.current)
            intervalRef.current = null
          }
        }, 5000)

        // Safety timeout to clear interval after 2 minutes
        setTimeout(() => {
          if (intervalRef.current) {
            clearInterval(intervalRef.current)
            intervalRef.current = null
          }
        }, 120000)
      } catch (error) {
        console.error("Error in text-to-speech:", error)
        setIsSpeaking(false)
        utteranceRef.current = null
      }
    },
    [forceCancelSpeech, getVoicesForLanguage],
  )

  return { speak, cancel, isSpeaking }
}

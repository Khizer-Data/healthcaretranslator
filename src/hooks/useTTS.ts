"use client"

import { useEffect, useRef, useCallback } from "react"

export function useTTS() {
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null)

  // Speak text
  const speak = useCallback((text: string, lang: string) => {
    if (!window.speechSynthesis) {
      console.error("Speech synthesis not supported")
      return
    }

    // Cancel any ongoing speech
    cancel()

    console.log(`Speaking text in ${lang}: "${text}"`)

    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = lang
    utterance.rate = 1.0
    utterance.pitch = 1.0
    utterance.volume = 1.0

    // Try to find a voice for the language
    const voices = window.speechSynthesis.getVoices()
    const voice = voices.find((v) => v.lang.startsWith(lang))

    if (voice) {
      console.log(`Using voice: ${voice.name} (${voice.lang})`)
      utterance.voice = voice
    } else {
      console.warn(`No voice found for language: ${lang}`)
    }

    utteranceRef.current = utterance
    window.speechSynthesis.speak(utterance)
  }, [])

  // Cancel speech
  const cancel = useCallback(() => {
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel()
      utteranceRef.current = null
    }
  }, [])

  // Clean up on unmount
  useEffect(() => {
    return () => {
      cancel()
    }
  }, [cancel])

  return { speak, cancel }
}

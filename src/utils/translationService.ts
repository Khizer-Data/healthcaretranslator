/**
 * Translation service with robust error handling and fallback mechanisms
 */

import { fallbackTranslate } from "./fallbackTranslation"
import { translateWithTogetherAI } from "./togetherAIService"

export type TranslationResult = {
  translation: string
  speaker: "patient" | "provider" | "unknown"
}

/**
 * Translates text using the Groq API via our server-side proxy
 */
export async function translateWithGroq(
  text: string,
  inputLang: string,
  outputLang: string,
  model?: string,
  apiKey?: string,
): Promise<TranslationResult> {
  try {
    console.log(
      `Translating with Groq via proxy: "${text}" from ${inputLang} to ${outputLang} using model: ${model || "default"}`,
    )

    // Use our server-side proxy to avoid CORS issues and keep API key secure
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
      let errorMessage = "Translation request failed"
      const statusCode = response.status

      try {
        const errorData = await response.json()
        errorMessage = errorData.error || `Error: ${response.status}`
        console.error("Translation error details:", errorData)
      } catch (e) {
        // If we can't parse the error response, use a generic message
        errorMessage = `Translation failed with status ${response.status}`
      }

      // If we get a 503 error, throw a specific error to trigger Together AI fallback
      if (statusCode === 503) {
        throw new Error("GROQ_SERVICE_UNAVAILABLE")
      }

      throw new Error(errorMessage)
    }

    const result = await response.json()

    // Check if we have a valid translation
    if (!result.translation && !result.translatedText) {
      throw new Error("No translation returned from API")
    }

    return {
      speaker: result.speaker || "unknown",
      translation: result.translation || result.translatedText || "",
    }
  } catch (error) {
    console.error("Translation error:", error)
    throw error
  }
}

/**
 * Translates text using the OpenAI API
 */
export async function translateWithOpenAI(
  text: string,
  inputLang: string,
  outputLang: string,
  apiKey?: string,
): Promise<TranslationResult> {
  try {
    console.log(`Translating with OpenAI: "${text}" from ${inputLang} to ${outputLang}`)
    // Placeholder implementation - replace with actual OpenAI API call
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          translation: `[OpenAI Translation] ${text} (from ${inputLang} to ${outputLang})`,
          speaker: "unknown",
        })
      }, 500)
    })
  } catch (error) {
    console.error("OpenAI translation failed:", error)
    throw error
  }
}

/**
 * Alternative translation using a free public API
 */
export async function translateWithPublicAPI(
  text: string,
  inputLang: string,
  outputLang: string,
): Promise<TranslationResult> {
  try {
    console.log(`Translating with public API: "${text}" from ${inputLang} to ${outputLang}`)

    // Use a free translation API as fallback
    const response = await fetch(
      `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${inputLang.split("-")[0]}|${outputLang}`,
    )

    if (!response.ok) {
      throw new Error(`Translation API failed: ${response.status}`)
    }

    const data = await response.json()

    if (data.responseStatus === 200 && data.responseData && data.responseData.translatedText) {
      return {
        translation: data.responseData.translatedText,
        speaker: "unknown",
      }
    } else {
      throw new Error("Invalid response from translation API")
    }
  } catch (error) {
    console.error("Public API translation failed:", error)
    // Last resort: use the simple dictionary-based fallback
    return {
      translation: fallbackTranslate(text, inputLang.split("-")[0], outputLang),
      speaker: "unknown",
    }
  }
}

/**
 * Main translation function that ensures we get a proper translation
 */
export async function translateText(
  text: string,
  inputLang: string,
  outputLang: string,
  model?: string,
): Promise<TranslationResult> {
  // Don't translate if input and output languages are the same
  if (inputLang.split("-")[0] === outputLang) {
    return {
      translation: text,
      speaker: "unknown",
    }
  }

  try {
    // Try Groq for translation via our server-side proxy
    return await translateWithGroq(text, inputLang, outputLang, model)
  } catch (error) {
    console.error("Groq translation failed:", error)

    // Check if it's a 503 error or service unavailable error
    const errorMessage = error instanceof Error ? error.message : String(error)
    if (errorMessage.includes("503") || errorMessage.includes("GROQ_SERVICE_UNAVAILABLE")) {
      console.log("Groq service unavailable, falling back to Together AI")
      try {
        // Fall back to Together AI
        return await translateWithTogetherAI(text, inputLang, outputLang)
      } catch (togetherError) {
        console.error("Together AI translation failed:", togetherError)
        // Continue to next fallback
      }
    }

    // Use public API translation as fallback
    try {
      return await translateWithPublicAPI(text, inputLang, outputLang)
    } catch (error) {
      console.error("Public API translation failed:", error)
      return {
        translation: fallbackTranslate(text, inputLang.split("-")[0], outputLang),
        speaker: "unknown",
      }
    }
  }
}

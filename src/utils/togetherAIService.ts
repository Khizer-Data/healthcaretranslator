import type { TranslationResult } from "./translationService"

/**
 * Translates text using the Together AI API
 */
export async function translateWithTogetherAI(
  text: string,
  inputLang: string,
  outputLang: string,
  model = "meta-llama/Llama-3.1-70B-Instruct-Turbo",
): Promise<TranslationResult> {
  try {
    console.log(`Translating with Together AI: "${text}" from ${inputLang} to ${outputLang} using model: ${model}`)

    // Use our server-side proxy to avoid CORS issues and keep API key secure
    const response = await fetch("/api/translate-together", {
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
      let errorMessage = "Together AI translation request failed"

      try {
        const errorData = await response.json()
        errorMessage = errorData.error || `Error: ${response.status}`
      } catch (e) {
        // If we can't parse the error response, use a generic message
        errorMessage = `Translation failed with status ${response.status}`
      }

      throw new Error(errorMessage)
    }

    const result = await response.json()

    // Check if we have a valid translation
    if (!result.translation && !result.translatedText) {
      throw new Error("No translation returned from Together AI API")
    }

    return {
      speaker: result.speaker || "unknown",
      translation: result.translation || result.translatedText || "",
    }
  } catch (error) {
    console.error("Together AI translation error:", error)
    throw error
  }
}

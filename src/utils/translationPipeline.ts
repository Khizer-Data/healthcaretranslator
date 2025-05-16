type TranslationResult = {
  translation: string
  speaker: "patient" | "provider" | "unknown"
  isRelevant: boolean
}

export async function processWithLLM(text: string, inputLang: string, outputLang: string): Promise<TranslationResult> {
  try {
    // Instead of using the API key directly, we'll use our server-side API route
    const response = await fetch("/api/translate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        text,
        inputLanguage: inputLang,
        outputLanguage: outputLang,
      }),
    })

    if (!response.ok) {
      throw new Error(`Translation API request failed: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()

    return {
      speaker: data.speaker || "unknown",
      translation: data.translation || "",
      isRelevant: data.isRelevant !== undefined ? data.isRelevant : true,
    }
  } catch (error) {
    console.error("Translation pipeline error:", error)
    throw error
  }
}

export function createGroqPrompt(text: string, inputLang: string, outputLang: string): string {
  return `
You are a medical assistant. Given the text below:

"${text}"

1. Identify if the speaker is the "patient", "provider", or "unknown".
2. Determine if the content is medically relevant (true/false).
3. Translate to ${outputLang}, simplifying medical terms if present.
4. Return JSON like: {"speaker":"patient", "isRelevant":true, "translation":"..."}

Input Language: ${inputLang}
Output Language: ${outputLang}
`.trim()
}

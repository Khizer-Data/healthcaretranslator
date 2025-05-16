import { type NextRequest, NextResponse } from "next/server"
import { createGroqPrompt } from "@/utils/llamaPrompt"

export async function POST(request: NextRequest) {
  try {
    const { text, inputLanguage, outputLanguage, model = "llama3-8b-8192" } = await request.json()

    if (!text) {
      return NextResponse.json({ error: "Text is required" }, { status: 400 })
    }

    if (!inputLanguage) {
      return NextResponse.json({ error: "Input language is required" }, { status: 400 })
    }

    if (!outputLanguage) {
      return NextResponse.json({ error: "Output language is required" }, { status: 400 })
    }

    // Get API key from environment variable
    const apiKey = process.env.GROQ_API_KEY

    if (!apiKey) {
      return NextResponse.json({ error: "Groq API key is not configured in environment variables" }, { status: 500 })
    }

    // Create the prompt for translation
    const prompt = createGroqPrompt(text, inputLanguage, outputLanguage)

    // Call the Groq API with the OpenAI-compatible endpoint
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          {
            role: "system",
            content: "You are a professional medical interpreter.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.3,
        max_tokens: 1024,
      }),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      console.error("Groq API error:", errorData)
      return NextResponse.json({ error: `Groq API error: ${response.status} ${response.statusText}` }, { status: 500 })
    }

    const data = await response.json()
    const translationText = data.choices[0]?.message?.content?.trim()

    if (!translationText) {
      return NextResponse.json({ error: "No translation returned from API" }, { status: 500 })
    }

    // Try to parse the JSON response
    try {
      const translationData = JSON.parse(translationText)

      if (Array.isArray(translationData) && translationData.length > 0) {
        const firstTranslation = translationData[0]

        return NextResponse.json({
          translation: firstTranslation.text,
          speaker: firstTranslation.speaker || "unknown",
        })
      } else {
        // If not in expected format, return the raw text
        return NextResponse.json({
          translation: translationText,
          speaker: "unknown",
        })
      }
    } catch (parseError) {
      // If parsing fails, return the raw text
      console.warn("Failed to parse translation as JSON, returning raw text:", parseError)
      return NextResponse.json({
        translation: translationText,
        speaker: "unknown",
      })
    }
  } catch (error) {
    console.error("Translation error:", error)
    return NextResponse.json(
      { error: `Translation failed: ${error instanceof Error ? error.message : "Unknown error"}` },
      { status: 500 },
    )
  }
}

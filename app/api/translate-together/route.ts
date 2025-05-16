import { type NextRequest, NextResponse } from "next/server"

export const runtime = "nodejs"

export async function POST(req: NextRequest) {
  try {
    const { text, inputLanguage, outputLanguage, model = "meta-llama/Llama-3.1-70B-Instruct-Turbo" } = await req.json()

    if (!text) {
      return NextResponse.json({ error: "Text is required" }, { status: 400 })
    }

    if (!inputLanguage) {
      return NextResponse.json({ error: "Input language is required" }, { status: 400 })
    }

    if (!outputLanguage) {
      return NextResponse.json({ error: "Output language is required" }, { status: 400 })
    }

    const TOGETHER_API_KEY = process.env.TOGETHER_API_KEY

    if (!TOGETHER_API_KEY) {
      console.error("TOGETHER_API_KEY is not set")
      return NextResponse.json({ error: "Together API key is not configured" }, { status: 503 })
    }

    // Determine the base language from the input language code (e.g., "en-US" -> "en")
    const baseInputLang = inputLanguage.split("-")[0]

    // Create a system prompt for translation
    const systemPrompt = `You are a professional medical translator. Translate the following text from ${baseInputLang} to ${outputLanguage}. 
Maintain medical accuracy and terminology. Only respond with the translation, nothing else.`

    // Create the prompt for the user
    const userPrompt = `Translate this text from ${baseInputLang} to ${outputLanguage}: "${text}"`

    // Make the API request to Together AI
    const response = await fetch("https://api.together.xyz/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${TOGETHER_API_KEY}`,
      },
      body: JSON.stringify({
        model: model,
        messages: [
          {
            role: "system",
            content: systemPrompt,
          },
          {
            role: "user",
            content: userPrompt,
          },
        ],
        temperature: 0.3,
        max_tokens: 1024,
      }),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      console.error("Together AI API error:", errorData)

      // Return 503 for service unavailable to trigger fallback
      return NextResponse.json(
        { error: `Together AI API error: ${response.status} ${response.statusText}` },
        { status: 503 },
      )
    }

    const data = await response.json()

    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      console.error("Unexpected Together AI API response format:", data)
      return NextResponse.json({ error: "Unexpected API response format" }, { status: 500 })
    }

    const translation = data.choices[0].message.content.trim()

    return NextResponse.json({
      translation,
      speaker: "unknown", // We don't determine speaker in this simple implementation
    })
  } catch (error) {
    console.error("Error in translation route:", error)
    return NextResponse.json(
      { error: `Translation failed: ${error instanceof Error ? error.message : String(error)}` },
      { status: 500 },
    )
  }
}

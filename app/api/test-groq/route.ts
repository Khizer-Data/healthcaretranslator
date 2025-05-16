import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { apiKey } = await request.json()

    if (!apiKey) {
      return NextResponse.json({ success: false, error: "API key is required" }, { status: 400 })
    }

    // Simple test prompt to verify the API key
    const testPrompt = "Respond with the word 'valid' if you can read this message."

    // Make a minimal request to Groq API to verify the key
    const response = await fetch("https://api.groq.com/openai/v1/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "llama3-70b-8192",
        prompt: testPrompt,
        max_tokens: 10,
        stream: false,
      }),
    })

    if (!response.ok) {
      const errorText = await response.text().catch(() => "Unknown error")

      // Check for specific error types
      if (response.status === 401) {
        return NextResponse.json({
          success: false,
          error: "Invalid API key",
          hint: "Please check your Groq API key and try again.",
        })
      }

      return NextResponse.json({
        success: false,
        error: `Groq API request failed with status ${response.status}`,
        details: errorText,
      })
    }

    // If we got here, the API key is valid
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error testing Groq API key:", error)
    return NextResponse.json(
      {
        success: false,
        error: `Failed to test API key: ${error instanceof Error ? error.message : "Unknown error"}`,
      },
      { status: 500 },
    )
  }
}

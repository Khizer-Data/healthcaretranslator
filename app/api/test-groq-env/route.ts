import { NextResponse } from "next/server"

export async function GET() {
  try {
    const apiKey = process.env.GROQ_API_KEY

    if (!apiKey) {
      return NextResponse.json(
        {
          valid: false,
          error: "Groq API key is not configured in environment variables",
        },
        { status: 400 },
      )
    }

    // Test the API key with a simple request
    const response = await fetch("https://api.groq.com/v1/models", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
    })

    if (!response.ok) {
      const errorText = await response.text().catch(() => "Unknown error")
      return NextResponse.json(
        {
          valid: false,
          error: `Groq API request failed with status ${response.status}: ${errorText}`,
        },
        { status: response.status },
      )
    }

    return NextResponse.json({
      valid: true,
      message: "Groq API key is valid",
    })
  } catch (error) {
    console.error("Error testing Groq API key:", error)
    return NextResponse.json(
      {
        valid: false,
        error: `Failed to test Groq API key: ${error instanceof Error ? error.message : "Unknown error"}`,
      },
      { status: 500 },
    )
  }
}

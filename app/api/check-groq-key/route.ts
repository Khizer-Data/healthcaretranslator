import { NextResponse } from "next/server"

export async function GET() {
  try {
    const apiKey = process.env.GROQ_API_KEY

    if (!apiKey) {
      return NextResponse.json({ valid: false, message: "Groq API key is not configured" })
    }

    // Test the API key with a simple request
    const response = await fetch("https://api.groq.com/openai/v1/models", {
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
    })

    if (response.ok) {
      return NextResponse.json({ valid: true, message: "Groq API key is valid" })
    } else {
      return NextResponse.json({ valid: false, message: "Groq API key is invalid" })
    }
  } catch (error) {
    console.error("Error checking Groq API key:", error)
    return NextResponse.json({ valid: false, message: "Error checking Groq API key" })
  }
}

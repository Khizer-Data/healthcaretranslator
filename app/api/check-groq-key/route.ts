import { NextResponse } from "next/server"

export async function GET() {
  try {
    // First check for environment variable
    const apiKey = process.env.GROQ_API_KEY

    if (!apiKey) {
      return NextResponse.json(
        {
          valid: false,
          error: "Groq API key is not configured in environment variables",
        },
        { status: 200 }, // Return 200 so frontend can handle it
      )
    }

    // Test the API key with a simple chat completion request instead of models endpoint
    // Using the correct endpoint with /openai/ prefix
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "llama3-8b-8192",
        messages: [
          {
            role: "system",
            content: "You are a helpful assistant.",
          },
          {
            role: "user",
            content: "Say hello",
          },
        ],
        max_tokens: 10,
      }),
    })

    console.log(`Groq API chat completion response status: ${response.status}`)

    if (!response.ok) {
      let errorText = "Unknown error"
      try {
        const errorData = await response.json()
        errorText = JSON.stringify(errorData)
      } catch (e) {
        try {
          errorText = await response.text()
        } catch (e2) {
          errorText = "Could not parse error response"
        }
      }

      console.error(`Groq API request failed with status ${response.status}:`, errorText)

      if (response.status === 401) {
        return NextResponse.json(
          {
            valid: false,
            error: "Invalid Groq API key",
            details: "The provided API key was rejected by the Groq API. Please check your API key and try again.",
            response: errorText,
          },
          { status: 200 },
        )
      }

      return NextResponse.json(
        {
          valid: false,
          error: `Groq API request failed with status ${response.status}`,
          details: errorText,
        },
        { status: 200 },
      )
    }

    // Try to parse the response
    try {
      const data = await response.json()
      console.log("Groq API response:", JSON.stringify(data).substring(0, 100) + "...")

      // If we got here, the API key is valid
      return NextResponse.json({
        valid: true,
        message: "Groq API key is valid",
        model: data.model || "Unknown model",
      })
    } catch (parseError) {
      console.error("Failed to parse Groq API response:", parseError)
      return NextResponse.json(
        {
          valid: false,
          error: "Failed to parse Groq API response",
          details: parseError instanceof Error ? parseError.message : "Unknown error",
        },
        { status: 200 },
      )
    }
  } catch (error) {
    console.error("Error checking Groq API key:", error)
    return NextResponse.json(
      {
        valid: false,
        error: `Failed to check Groq API key: ${error instanceof Error ? error.message : "Unknown error"}`,
        details: error instanceof Error ? error.stack : "No stack trace available",
      },
      { status: 200 },
    )
  }
}

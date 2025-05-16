import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export async function POST(request: NextRequest) {
  try {
    // Get form data from the request
    const formData = await request.formData()

    // Get the OpenAI API key from server environment variables
    const apiKey = process.env.OPENAI_API_KEY

    if (!apiKey) {
      console.error("OpenAI API key is missing from environment variables")
      return NextResponse.json({ error: "OpenAI API key is not configured on the server" }, { status: 500 })
    }

    // Log information about the request
    console.log("Received audio file for transcription")
    console.log(`Language: ${formData.get("language")}`)

    // Forward the request to OpenAI's Whisper API
    const response = await fetch("https://api.openai.com/v1/audio/transcriptions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
      body: formData, // Pass the form data directly
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`Whisper API error (${response.status}):`, errorText)
      return NextResponse.json(
        { error: `Whisper API error: ${response.status} - ${errorText}` },
        { status: response.status },
      )
    }

    // Return the transcription result
    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error("Transcription error:", error)
    return NextResponse.json(
      { error: `Transcription failed: ${error instanceof Error ? error.message : String(error)}` },
      { status: 500 },
    )
  }
}

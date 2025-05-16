import { NextResponse } from "next/server"
import { VOICEGAIN_API } from "@/utils/voicegainUtils"

export async function POST(request: Request) {
  try {
    const { apiKey } = await request.json()

    // Use environment variable first, then fall back to provided API key
    const voicegainApiKey = process.env.VOICEGAIN_API_KEY || apiKey

    if (!voicegainApiKey) {
      return NextResponse.json(
        { error: "Voicegain API key is required. Set it in environment variables or provide it in the request." },
        { status: 400 },
      )
    }

    // Create a session configuration
    const sessionConfig = {
      sessions: [
        {
          asyncMode: "REAL-TIME",
          websocket: {
            useSTOMP: false,
            minimumDelay: 0,
          },
          content: {
            incremental: ["TRANSCRIPT"],
            format: "TEXT",
          },
          audio: {
            source: "WEBSOCKET",
            format: "L16",
            rate: 16000,
            channels: 1,
          },
        },
      ],
    }

    // Create a session
    const response = await fetch(`${VOICEGAIN_API.BASE_URL}${VOICEGAIN_API.ASR_SESSION}`, {
      method: "POST",
      headers: {
        Authorization: voicegainApiKey,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(sessionConfig),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error("Failed to create Voicegain session:", errorText)
      return NextResponse.json(
        { error: `Failed to create Voicegain session: ${response.status} ${errorText}` },
        { status: response.status },
      )
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error("Error creating Voicegain session:", error)
    return NextResponse.json(
      { error: `Failed to create Voicegain session: ${error instanceof Error ? error.message : String(error)}` },
      { status: 500 },
    )
  }
}

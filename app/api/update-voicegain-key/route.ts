import { NextResponse } from "next/server"
import { VOICEGAIN_API } from "@/utils/voicegainUtils"

export async function POST(request: Request) {
  try {
    // Get the API key from the request body
    const { apiKey } = await request.json()

    if (!apiKey || typeof apiKey !== "string" || apiKey.trim() === "") {
      return NextResponse.json({ success: false, error: "Invalid API key provided" }, { status: 400 })
    }

    console.log("Testing provided Voicegain API key...")
    console.log(`API Endpoint: ${VOICEGAIN_API.BASE_URL}${VOICEGAIN_API.TEST}`)
    // Don't log the full API key, just a hint for debugging
    console.log(`Authorization header starts with: ${apiKey.substring(0, 15)}...`)

    // Test the API key with a simple OPTIONS request to check authentication
    // This avoids creating actual resources while still validating the API key
    const response = await fetch(`${VOICEGAIN_API.BASE_URL}${VOICEGAIN_API.TEST}`, {
      method: "OPTIONS",
      headers: {
        Authorization: apiKey,
        Accept: "application/json",
      },
    })

    // If OPTIONS doesn't work, try a minimal POST request
    if (response.status === 404 || response.status === 405) {
      console.log("OPTIONS method not supported, trying minimal POST request...")

      // Create a minimal session configuration
      const minimalConfig = {
        sessions: [
          {
            asyncMode: "OFFLINE",
            content: { alternatives: 1 },
            audio: { source: "none" },
          },
        ],
      }

      const postResponse = await fetch(`${VOICEGAIN_API.BASE_URL}${VOICEGAIN_API.TEST}`, {
        method: "POST",
        headers: {
          Authorization: apiKey,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(minimalConfig),
      })

      // If we get a 401, the API key is invalid
      // If we get any other error, the API key might be valid but the request is invalid
      // which is fine for our purposes (just testing auth)
      if (postResponse.status === 401) {
        return NextResponse.json(
          {
            success: false,
            error: "Invalid Voicegain API key",
            details: "Authentication failed with status 401",
          },
          { status: 200 }, // Return 200 so frontend can handle it
        )
      } else {
        // Any other response means the API key is likely valid
        return NextResponse.json({
          success: true,
          message: "Voicegain API key is valid",
        })
      }
    }

    if (response.status === 401) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid Voicegain API key",
          details: "Authentication failed with status 401",
        },
        { status: 200 }, // Return 200 so frontend can handle it
      )
    }

    // API key is valid if we didn't get a 401 Unauthorized
    return NextResponse.json({
      success: true,
      message: "Voicegain API key is valid",
    })
  } catch (error) {
    console.error("Error testing Voicegain API key:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to test Voicegain API key",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}

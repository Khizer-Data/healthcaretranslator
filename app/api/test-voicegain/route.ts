import { NextResponse } from "next/server"
import { VOICEGAIN_API, formatVoicegainApiKey } from "@/utils/voicegainUtils"

export async function GET() {
  try {
    // First check for environment variable
    const apiKey = process.env.VOICEGAIN_API_KEY

    if (!apiKey) {
      return NextResponse.json(
        {
          valid: false,
          isSet: false,
          error: "Voicegain API key is not configured in environment variables",
        },
        { status: 200 }, // Return 200 so frontend can handle it
      )
    }

    // Format the API key properly
    const formattedKey = formatVoicegainApiKey(apiKey)

    // Test the API key with a simple OPTIONS request
    try {
      const response = await fetch(`${VOICEGAIN_API.BASE_URL}${VOICEGAIN_API.TEST}`, {
        method: "OPTIONS",
        headers: {
          Authorization: formattedKey,
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
            Authorization: formattedKey,
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify(minimalConfig),
        })

        if (postResponse.status === 401) {
          return NextResponse.json(
            {
              valid: false,
              isSet: true,
              error: "Invalid Voicegain API key",
            },
            { status: 200 }, // Return 200 so frontend can handle it
          )
        } else {
          // Any other response means the API key is likely valid
          return NextResponse.json({
            valid: true,
            isSet: true,
            message: "Voicegain API key is valid",
          })
        }
      }

      if (response.status === 401) {
        return NextResponse.json(
          {
            valid: false,
            isSet: true,
            error: "Invalid Voicegain API key",
          },
          { status: 200 }, // Return 200 so frontend can handle it
        )
      }

      // API key is valid if we didn't get a 401 Unauthorized
      return NextResponse.json({
        valid: true,
        isSet: true,
        message: "Voicegain API key is valid",
      })
    } catch (fetchError) {
      console.error("Fetch error testing Voicegain API key:", fetchError)

      // Try a simpler approach - just check if the key exists and has a reasonable format
      if (apiKey && apiKey.length > 10) {
        return NextResponse.json({
          valid: true,
          isSet: true,
          message: "Voicegain API key is present (network error during validation)",
        })
      } else {
        return NextResponse.json({
          valid: false,
          isSet: false,
          error: "Voicegain API key format appears invalid",
        })
      }
    }
  } catch (error) {
    console.error("Error testing Voicegain API key:", error)

    // Return a more graceful error
    return NextResponse.json(
      {
        valid: false,
        isSet: process.env.VOICEGAIN_API_KEY ? true : false,
        error: "Could not validate Voicegain API key",
      },
      { status: 200 }, // Return 200 so frontend can handle it
    )
  }
}

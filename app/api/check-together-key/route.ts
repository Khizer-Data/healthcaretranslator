import { NextResponse } from "next/server"

export async function GET() {
  try {
    const apiKey = process.env.TOGETHER_API_KEY

    if (!apiKey) {
      return NextResponse.json({ valid: false, message: "Together API key is not configured" })
    }

    // Test the API key with a simple request
    const response = await fetch("https://api.together.xyz/v1/models", {
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
    })

    if (response.ok) {
      return NextResponse.json({ valid: true, message: "Together API key is valid" })
    } else {
      return NextResponse.json({ valid: false, message: "Together API key is invalid" })
    }
  } catch (error) {
    console.error("Error checking Together API key:", error)
    return NextResponse.json({ valid: false, message: "Error checking Together API key" })
  }
}

import { NextResponse } from "next/server"
import { testVoicegainToken, decodeJwt } from "@/utils/voicegainTokenTester"

export async function GET() {
  try {
    const token = process.env.VOICEGAIN_API_KEY

    if (!token || typeof token !== "string" || token.trim() === "") {
      return NextResponse.json(
        {
          success: false,
          error: "No token found in environment variables",
        },
        { status: 200 },
      )
    }

    // Log token preview for debugging
    console.log(`Using token from env: ${token.substring(0, 15)}...`)

    // Decode the token to check expiration
    const decodedToken = decodeJwt(token)

    // Test the token against different endpoints
    const testResults = await testVoicegainToken(token)

    return NextResponse.json({
      success: true,
      decodedToken,
      testResults,
    })
  } catch (error) {
    console.error("Error testing environment token:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}

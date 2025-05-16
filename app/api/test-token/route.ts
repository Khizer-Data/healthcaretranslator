import { NextResponse } from "next/server"
import { testVoicegainToken, decodeJwt } from "@/utils/voicegainTokenTester"

export async function POST(request: Request) {
  try {
    const { token } = await request.json()

    if (!token || typeof token !== "string" || token.trim() === "") {
      return NextResponse.json(
        {
          success: false,
          error: "No token provided",
        },
        { status: 400 },
      )
    }

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
    console.error("Error testing token:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}

import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { apiKey } = await request.json()

    if (!apiKey) {
      return NextResponse.json({ success: false, error: "API key is required" }, { status: 400 })
    }

    // Test the API key by making a request to our test endpoint
    const testResponse = await fetch(`${request.nextUrl.origin}/api/test-groq`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ apiKey }),
    })

    const testResult = await testResponse.json()

    if (!testResult.success) {
      return NextResponse.json({
        success: false,
        error: testResult.error || "Failed to validate API key",
        hint: testResult.hint,
      })
    }

    // If we got here, the API key is valid
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error updating Groq API key:", error)
    return NextResponse.json(
      {
        success: false,
        error: `Failed to update API key: ${error instanceof Error ? error.message : "Unknown error"}`,
      },
      { status: 500 },
    )
  }
}

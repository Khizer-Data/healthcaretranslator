import { NextResponse } from "next/server"
import { VOICEGAIN_API } from "@/utils/voicegainUtils"

export async function POST(request: Request) {
  try {
    // Get the API key from the request body
    const { apiKey } = await request.json()

    if (!apiKey || typeof apiKey !== "string" || apiKey.trim() === "") {
      return NextResponse.json({ success: false, error: "Invalid API key provided" }, { status: 400 })
    }

    console.log("Testing specific Voicegain API key...")
    console.log(`API Endpoint: ${VOICEGAIN_API.BASE_URL}${VOICEGAIN_API.STATUS}`)

    // Test the API key with a simple request
    const response = await fetch(`${VOICEGAIN_API.BASE_URL}${VOICEGAIN_API.STATUS}`, {
      method: "GET",
      headers: {
        Authorization: apiKey,
        Accept: "application/json",
      },
    })

    const responseStatus = response.status
    let responseBody = ""

    try {
      responseBody = await response.text()
    } catch (e) {
      responseBody = "Could not read response body"
    }

    return NextResponse.json({
      success: response.ok,
      status: responseStatus,
      response: responseBody,
      headers: Object.fromEntries(response.headers.entries()),
    })
  } catch (error) {
    console.error("Error testing specific API key:", error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : String(error),
    })
  }
}

import { NextResponse } from "next/server"
import { VOICEGAIN_API } from "@/utils/voicegainUtils"

export async function GET() {
  try {
    // Your specific API key
    const apiKey =
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiI1NDNjYjkwNi04OTJiLTQ4YjMtODgwYy03MTZiMmI2Y2EzMmUiLCJhdWQiOiJodHRwczovL2FwaS52b2ljZWdhaW4uYWkvdjEiLCJzdWIiOiJiM2U5MDE4ZS04ZWJhLTQ2ZDUtOGEwNi03OTUxYTU4MzdhMWUifQ.O5Q3Sutw-6hXZEYyBuPIhE5zHo6DOyMyvXLyx9tMkrY"

    // Try multiple authentication methods
    const results = []

    // Method 1: Bearer token
    try {
      const response = await fetch(`${VOICEGAIN_API.BASE_URL}${VOICEGAIN_API.STATUS}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          Accept: "application/json",
        },
      })

      const status = response.status
      const text = await response.text()

      results.push({
        method: "Bearer Token",
        success: response.ok,
        status,
        response: text,
        headers: Object.fromEntries(response.headers.entries()),
      })
    } catch (error) {
      results.push({
        method: "Bearer Token",
        success: false,
        error: error instanceof Error ? error.message : String(error),
      })
    }

    // Method 2: Raw JWT
    try {
      const response = await fetch(`${VOICEGAIN_API.BASE_URL}${VOICEGAIN_API.STATUS}`, {
        method: "GET",
        headers: {
          Authorization: apiKey,
          Accept: "application/json",
        },
      })

      const status = response.status
      const text = await response.text()

      results.push({
        method: "Raw JWT",
        success: response.ok,
        status,
        response: text,
        headers: Object.fromEntries(response.headers.entries()),
      })
    } catch (error) {
      results.push({
        method: "Raw JWT",
        success: false,
        error: error instanceof Error ? error.message : String(error),
      })
    }

    // Method 3: Basic Auth
    try {
      const basicAuth = btoa(`${apiKey}:`)

      const response = await fetch(`${VOICEGAIN_API.BASE_URL}${VOICEGAIN_API.STATUS}`, {
        method: "GET",
        headers: {
          Authorization: `Basic ${basicAuth}`,
          Accept: "application/json",
        },
      })

      const status = response.status
      const text = await response.text()

      results.push({
        method: "Basic Auth",
        success: response.ok,
        status,
        response: text,
        headers: Object.fromEntries(response.headers.entries()),
      })
    } catch (error) {
      results.push({
        method: "Basic Auth",
        success: false,
        error: error instanceof Error ? error.message : String(error),
      })
    }

    return NextResponse.json({
      results,
    })
  } catch (error) {
    console.error("Error in direct test:", error)
    return NextResponse.json({
      error: error instanceof Error ? error.message : String(error),
    })
  }
}

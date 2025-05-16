/**
 * Utility for testing Voicegain JWT tokens against different endpoints
 */

// Voicegain API endpoints to test
const ENDPOINTS = {
  SA_STATUS: "https://api.voicegain.ai/v1/sa/status",
  ASR_STATUS: "https://api.voicegain.ai/v1/asr/status",
  ROOT_STATUS: "https://api.voicegain.ai/v1/status",
}

type TestResult = {
  endpoint: string
  success: boolean
  status: number
  data: any
  error?: string
}

/**
 * Tests a JWT token against multiple Voicegain endpoints
 * @param token The JWT token to test (with or without Bearer prefix)
 * @returns Results for each endpoint tested
 */
export async function testVoicegainToken(token: string): Promise<TestResult[]> {
  // Format token - ensure it has Bearer prefix
  const formattedToken = token.trim().startsWith("Bearer ") ? token.trim() : `Bearer ${token.trim()}`

  // Log first part of token for debugging (safely)
  const tokenPreview = formattedToken.substring(7, 20) + "..."
  console.log(`Testing Voicegain token: ${tokenPreview}`)

  const results: TestResult[] = []

  // Test each endpoint
  for (const [name, url] of Object.entries(ENDPOINTS)) {
    try {
      console.log(`Testing endpoint: ${name} (${url})`)

      const response = await fetch(url, {
        method: "GET",
        headers: {
          Authorization: formattedToken,
          Accept: "application/json",
        },
      })

      let data
      try {
        data = await response.json()
      } catch (e) {
        data = await response.text()
      }

      results.push({
        endpoint: name,
        success: response.ok,
        status: response.status,
        data,
        error: response.ok ? undefined : `HTTP ${response.status}`,
      })

      console.log(`Result for ${name}: ${response.ok ? "SUCCESS" : "FAILED"} (${response.status})`)
    } catch (error) {
      results.push({
        endpoint: name,
        success: false,
        status: 0,
        data: null,
        error: error instanceof Error ? error.message : String(error),
      })

      console.error(`Error testing ${name}:`, error)
    }
  }

  return results
}

/**
 * Decodes a JWT token to check its expiration and claims
 * @param token The JWT token to decode
 * @returns Decoded token information or error
 */
export function decodeJwt(token: string) {
  try {
    // Remove Bearer prefix if present
    const jwt = token.trim().startsWith("Bearer ") ? token.trim().substring(7) : token.trim()

    // Split the token into parts
    const parts = jwt.split(".")
    if (parts.length !== 3) {
      return { error: "Invalid JWT format - should have 3 parts" }
    }

    // Decode the payload (middle part)
    const payload = JSON.parse(atob(parts[1]))

    // Check expiration
    const now = Math.floor(Date.now() / 1000)
    const isExpired = payload.exp && payload.exp < now

    return {
      isValid: true,
      isExpired,
      expiresAt: payload.exp ? new Date(payload.exp * 1000).toISOString() : "No expiration",
      timeRemaining: payload.exp ? payload.exp - now : "No expiration",
      payload,
    }
  } catch (error) {
    return {
      isValid: false,
      error: error instanceof Error ? error.message : String(error),
    }
  }
}

import { VOICEGAIN_API } from "./voicegainUtils"

export async function createVoicegainSession(apiKey?: string) {
  // Use environment variable first, then fall back to provided API key
  const voicegainApiKey = process.env.VOICEGAIN_API_KEY || apiKey

  if (!voicegainApiKey) {
    throw new Error("Voicegain API key is required")
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
    throw new Error(`Failed to create Voicegain session: ${response.status} ${errorText}`)
  }

  return await response.json()
}

export async function closeVoicegainSession(sessionId: string, apiKey?: string) {
  // Use environment variable first, then fall back to provided API key
  const voicegainApiKey = process.env.VOICEGAIN_API_KEY || apiKey

  if (!voicegainApiKey) {
    throw new Error("Voicegain API key is required")
  }

  if (!sessionId) {
    throw new Error("Session ID is required")
  }

  try {
    const response = await fetch(`${VOICEGAIN_API.BASE_URL}${VOICEGAIN_API.ASR_SESSION}/${sessionId}`, {
      method: "DELETE",
      headers: {
        Authorization: voicegainApiKey,
        Accept: "application/json",
      },
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`Failed to close Voicegain session: ${response.status} ${errorText}`)
      // Don't throw here, just log the error
    }
  } catch (error) {
    console.error("Error closing Voicegain session:", error)
    // Don't throw here, just log the error
  }
}

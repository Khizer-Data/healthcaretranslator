/**
 * Utility functions for working with Voicegain API
 */

/**
 * Formats the Voicegain API key for authentication
 * @param apiKey The raw API key
 * @returns Properly formatted API key
 */
export function formatVoicegainApiKey(apiKey: string): string {
  // Ensure the API key has the Bearer prefix
  return apiKey.trim().startsWith("Bearer ") ? apiKey.trim() : `Bearer ${apiKey.trim()}`
}

/**
 * Maps a locale language code to Voicegain's supported format
 * @param languageCode Language code like "en-US"
 * @returns Voicegain language code like "en"
 */
export function mapToVoicegainLanguage(languageCode: string): string {
  // Extract the base language code (e.g., "en" from "en-US")
  const baseCode = languageCode.split("-")[0].toLowerCase()

  // Map to Voicegain's supported languages
  const supportedLanguages: Record<string, string> = {
    en: "en", // English
    es: "es", // Spanish
    fr: "fr", // French
    // Add more mappings as Voicegain supports them
  }

  return supportedLanguages[baseCode] || "en" // Default to English if not supported
}

/**
 * Voicegain API endpoints
 */
export const VOICEGAIN_API = {
  BASE_URL: "https://api.voicegain.ai/v1",
  ASYNC_RECOGNIZE: "/asr/recognize/async",
  STATUS: "/asr/recognize/status", // Changed from "/sa/status" to a more reliable endpoint
  TEST: "/asr/recognize/async", // Use this for testing API key validity
}

/**
 * Creates a session configuration for Voicegain ASR
 * @param language The language code
 * @returns Session configuration object
 */
export function createSessionConfig(language: string) {
  return {
    sessions: [
      {
        asyncMode: "REAL-TIME",
        websocket: { adHoc: true },
        content: {
          incremental: true,
          interimResults: true,
          alternatives: 1,
        },
        audio: {
          source: "stream",
          format: "audio/L16;rate=16000",
          channel: "mono",
        },
        settings: {
          asr: {
            noInputTimeout: 60000,
            completeTimeout: 2000,
            incompleteTimeout: 5000,
          },
          language: mapToVoicegainLanguage(language),
        },
      },
    ],
  }
}

/**
 * Validates a Voicegain API key format
 * @param apiKey The API key to validate
 * @returns Whether the key appears to be in a valid format
 */
export function isValidApiKeyFormat(apiKey: string): boolean {
  if (!apiKey || typeof apiKey !== "string" || apiKey.trim() === "") {
    return false
  }

  const trimmedKey = apiKey.trim()

  // Check if it's a JWT token (starts with "ey")
  if (trimmedKey.startsWith("ey") && trimmedKey.includes(".")) {
    return true
  }

  // Check if it's a Bearer token
  if (trimmedKey.startsWith("Bearer ") && trimmedKey.length > 8) {
    return true
  }

  // Check if it's a standard API key (alphanumeric with possible special chars)
  if (/^[a-zA-Z0-9_\-.]{16,}$/.test(trimmedKey)) {
    return true
  }

  return false
}

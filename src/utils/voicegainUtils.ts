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

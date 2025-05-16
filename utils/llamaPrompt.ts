export function createGroqPrompt(
  transcript: string,
  inputLang: string,
  outputLang: string,
  speaker?: "patient" | "provider" | "unknown",
): string {
  return `You are a professional medical interpreter. Translate the following ${inputLang} text into ${outputLang}, preserving meaning, medical terminology, and speaker identity.
  
  Input:
  Speaker: ${speaker ?? "unknown"}
  Text: ${transcript}
  
  Output a JSON array of objects with keys "speaker" and "text". Example:
  [
    { "speaker": "patient", "text": "Translated text here." }
  ]`
}

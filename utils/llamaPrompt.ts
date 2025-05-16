export function createGroqPrompt(text: string, inputLanguage: string, outputLanguage: string): string {
  // Extract base language codes
  const inputLangCode = inputLanguage.split("-")[0]
  const outputLangCode = outputLanguage

  return `
You are a professional medical interpreter with expertise in healthcare terminology.

TASK:
Translate the following text from ${inputLangCode} to ${outputLangCode}. 
Preserve all medical terminology and maintain the original meaning.

TEXT TO TRANSLATE:
"${text}"

INSTRUCTIONS:
1. Translate accurately while preserving medical terms
2. Maintain the same tone and formality level
3. Return ONLY the translated text without explanations
4. If you're unsure about a medical term, preserve it in the original language
5. Format your response as a simple text translation

TRANSLATION:
`
}

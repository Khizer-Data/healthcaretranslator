/**
 * Creates a prompt for Together AI translation
 */
export function createTogetherPrompt(text: string, inputLang: string, outputLang: string): string {
  return `You are a professional medical interpreter. Translate the following text from ${inputLang} to ${outputLang}. Preserve medical terminology and accuracy:

Text to translate: "${text}"

Respond with ONLY the translated text, nothing else.`
}

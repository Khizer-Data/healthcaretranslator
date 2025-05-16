/**
 * Translation service for the root utils directory
 * This file re-exports functionality from src/utils/translationService.ts
 */

import {
  translateText as srcTranslateText,
  translateWithGroq,
  translateWithOpenAI,
  TranslationResult,
} from "../src/utils/translationService"

// Re-export the functions and types
export { translateWithGroq, translateWithOpenAI, TranslationResult }

// Export the translateText function
export async function translateText(
  text: string,
  inputLang: string,
  outputLang: string,
  model?: string,
): Promise<TranslationResult> {
  return srcTranslateText(text, inputLang, outputLang, model)
}

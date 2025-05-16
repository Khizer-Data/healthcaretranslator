"use client"

import { useState } from "react"
import { Button } from "../../components/ui/button"
import { Textarea } from "../../components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select"
import { translateText, translateWithGroq, translateWithOpenAI } from "../../src/utils/translationService"
import { fallbackTranslate } from "../../src/utils/fallbackTranslation"
import { Loader2 } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/tabs"

// Import the same language lists from the main page
const LANGUAGES = {
  input: [
    { value: "en-US", label: "English (US)" },
    { value: "en-GB", label: "English (UK)" },
    { value: "en-AU", label: "English (Australia)" },
    { value: "en-IN", label: "English (India)" },
    { value: "es-ES", label: "Spanish (Spain)" },
    { value: "es-MX", label: "Spanish (Mexico)" },
    { value: "es-US", label: "Spanish (US)" },
    { value: "fr-FR", label: "French" },
    { value: "fr-CA", label: "French (Canada)" },
    { value: "de-DE", label: "German" },
    { value: "it-IT", label: "Italian" },
    { value: "pt-BR", label: "Portuguese (Brazil)" },
    { value: "pt-PT", label: "Portuguese (Portugal)" },
    { value: "nl-NL", label: "Dutch" },
    { value: "ja-JP", label: "Japanese" },
    { value: "ko-KR", label: "Korean" },
    { value: "zh-CN", label: "Chinese (Mandarin)" },
    { value: "ru-RU", label: "Russian" },
    { value: "pl-PL", label: "Polish" },
    { value: "tr-TR", label: "Turkish" },
    { value: "ar-SA", label: "Arabic" },
    { value: "hi-IN", label: "Hindi" },
  ],
  output: [
    { value: "en", label: "English" },
    { value: "es", label: "Spanish" },
    { value: "fr", label: "French" },
    { value: "de", label: "German" },
    { value: "it", label: "Italian" },
    { value: "pt", label: "Portuguese" },
    { value: "nl", label: "Dutch" },
    { value: "ja", label: "Japanese" },
    { value: "ko", label: "Korean" },
    { value: "zh", label: "Chinese" },
    { value: "ru", label: "Russian" },
    { value: "pl", label: "Polish" },
    { value: "tr", label: "Turkish" },
    { value: "ar", label: "Arabic" },
    { value: "hi", label: "Hindi" },
    { value: "ur", label: "Urdu" },
    { value: "bn", label: "Bengali" },
    { value: "th", label: "Thai" },
    { value: "vi", label: "Vietnamese" },
    { value: "id", label: "Indonesian" },
    { value: "ms", label: "Malay" },
    { value: "fa", label: "Persian" },
    { value: "he", label: "Hebrew" },
    { value: "sv", label: "Swedish" },
    { value: "da", label: "Danish" },
    { value: "fi", label: "Finnish" },
    { value: "no", label: "Norwegian" },
    { value: "cs", label: "Czech" },
    { value: "hu", label: "Hungarian" },
    { value: "ro", label: "Romanian" },
    { value: "uk", label: "Ukrainian" },
    { value: "el", label: "Greek" },
    { value: "bg", label: "Bulgarian" },
  ],
}

export default function TranslationDebugPage() {
  const [inputLanguage, setInputLanguage] = useState("en-US")
  const [outputLanguage, setOutputLanguage] = useState("es")
  const [inputText, setInputText] = useState("")
  const [translationResults, setTranslationResults] = useState<{
    groq?: any
    openai?: any
    fallback?: any
    auto?: any
  }>({})
  const [isTranslating, setIsTranslating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState("auto")
  const [apiKey, setApiKey] = useState("")

  async function handleTranslate() {
    if (!inputText.trim()) {
      setError("Please enter some text to translate")
      return
    }

    setIsTranslating(true)
    setError(null)
    const results: any = {}

    try {
      // Auto translation (with fallbacks)
      results.auto = await translateText(inputText, inputLanguage, outputLanguage)

      // Try each translation method separately
      try {
        results.groq = await translateWithGroq(inputText, inputLanguage, outputLanguage, apiKey || undefined)
      } catch (e) {
        console.error("Groq translation failed:", e)
        results.groq = { error: e instanceof Error ? e.message : "Unknown error" }
      }

      try {
        results.openai = await translateWithOpenAI(inputText, inputLanguage, outputLanguage, apiKey || undefined)
      } catch (e) {
        console.error("OpenAI translation failed:", e)
        results.openai = { error: e instanceof Error ? e.message : "Unknown error" }
      }

      // Simple fallback
      results.fallback = {
        translation: fallbackTranslate(inputText, inputLanguage.split("-")[0], outputLanguage),
        speaker: "unknown",
      }

      setTranslationResults(results)
    } catch (e) {
      console.error(e)
      setError("Translation failed. Please try again.")
    } finally {
      setIsTranslating(false)
    }
  }

  return (
    <main className="container mx-auto p-4 min-h-screen">
      <Card className="mb-6">
        <CardHeader className="pb-2">
          <CardTitle className="text-2xl font-bold text-center">Translation Debugger</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 mb-4">
            <div className="flex-1">
              <label className="block text-sm font-medium mb-1">Input Language</label>
              <Select value={inputLanguage} onValueChange={setInputLanguage}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select input language" />
                </SelectTrigger>
                <SelectContent className="max-h-[300px]">
                  {LANGUAGES.input.map((lang) => (
                    <SelectItem key={lang.value} value={lang.value}>
                      {lang.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium mb-1">Output Language</label>
              <Select value={outputLanguage} onValueChange={setOutputLanguage}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select output language" />
                </SelectTrigger>
                <SelectContent className="max-h-[300px]">
                  {LANGUAGES.output.map((lang) => (
                    <SelectItem key={lang.value} value={lang.value}>
                      {lang.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Custom API Key (Optional)</label>
            <Textarea
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="Enter a custom API key to test..."
              className="min-h-[40px]"
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Text to Translate</label>
            <Textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Enter text to translate..."
              className="min-h-[100px]"
            />
          </div>

          <div className="flex justify-center mb-4">
            <Button
              onClick={handleTranslate}
              disabled={isTranslating || !inputText.trim()}
              className="flex items-center gap-2"
            >
              {isTranslating ? (
                <>
                  <Loader2 className="animate-spin" size={18} /> Translating...
                </>
              ) : (
                "Translate"
              )}
            </Button>
          </div>

          {error && <div className="p-4 mb-4 text-red-700 bg-red-100 rounded-md">{error}</div>}

          {Object.keys(translationResults).length > 0 && (
            <div className="mt-6">
              <h3 className="text-lg font-semibold mb-2">Translation Results:</h3>

              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid grid-cols-4 mb-4">
                  <TabsTrigger value="auto">Auto</TabsTrigger>
                  <TabsTrigger value="groq">Groq</TabsTrigger>
                  <TabsTrigger value="openai">OpenAI</TabsTrigger>
                  <TabsTrigger value="fallback">Fallback</TabsTrigger>
                </TabsList>

                <TabsContent value="auto">
                  <div className="p-4 bg-gray-100 rounded-md">
                    <div className="mb-2">
                      <span className="font-medium">Method:</span> Auto (with fallbacks)
                    </div>
                    <div className="mb-2">
                      <span className="font-medium">Speaker:</span> {translationResults.auto?.speaker || "N/A"}
                    </div>
                    <div>
                      <span className="font-medium">Translation:</span>{" "}
                      {translationResults.auto?.translation || "Failed"}
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="groq">
                  <div className="p-4 bg-gray-100 rounded-md">
                    <div className="mb-2">
                      <span className="font-medium">Method:</span> Groq (llama3-70b-8192)
                    </div>
                    {translationResults.groq?.error ? (
                      <div className="text-red-600">
                        <span className="font-medium">Error:</span> {translationResults.groq.error}
                      </div>
                    ) : (
                      <>
                        <div className="mb-2">
                          <span className="font-medium">Speaker:</span> {translationResults.groq?.speaker || "N/A"}
                        </div>
                        <div>
                          <span className="font-medium">Translation:</span>{" "}
                          {translationResults.groq?.translation || "Failed"}
                        </div>
                      </>
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="openai">
                  <div className="p-4 bg-gray-100 rounded-md">
                    <div className="mb-2">
                      <span className="font-medium">Method:</span> OpenAI (gpt-3.5-turbo)
                    </div>
                    {translationResults.openai?.error ? (
                      <div className="text-red-600">
                        <span className="font-medium">Error:</span> {translationResults.openai.error}
                      </div>
                    ) : (
                      <>
                        <div className="mb-2">
                          <span className="font-medium">Speaker:</span> {translationResults.openai?.speaker || "N/A"}
                        </div>
                        <div>
                          <span className="font-medium">Translation:</span>{" "}
                          {translationResults.openai?.translation || "Failed"}
                        </div>
                      </>
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="fallback">
                  <div className="p-4 bg-gray-100 rounded-md">
                    <div className="mb-2">
                      <span className="font-medium">Method:</span> Simple Fallback (Dictionary-based)
                    </div>
                    <div className="mb-2">
                      <span className="font-medium">Speaker:</span> {translationResults.fallback?.speaker || "N/A"}
                    </div>
                    <div>
                      <span className="font-medium">Translation:</span>{" "}
                      {translationResults.fallback?.translation || "Failed"}
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          )}
        </CardContent>
      </Card>
    </main>
  )
}

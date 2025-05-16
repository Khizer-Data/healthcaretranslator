"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2 } from "lucide-react"
import { formatVoicegainApiKey } from "@/utils/voicegainUtils"

export default function ApiTestPage() {
  const [apiKey, setApiKey] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<any>(null)

  const testApiKey = async () => {
    setIsLoading(true)
    setResult(null)

    try {
      // Format the API key
      const formattedKey = formatVoicegainApiKey(apiKey)

      // Test the API key
      const response = await fetch("/api/test-specific-key", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ apiKey: formattedKey }),
      })

      const data = await response.json()
      setResult(data)
    } catch (error) {
      setResult({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error occurred",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6 text-center">Voicegain API Key Test</h1>
      <Card className="w-full max-w-md mx-auto mt-4">
        <CardHeader>
          <CardTitle>Test Voicegain API Key</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Input
              type="text"
              placeholder="Enter Voicegain API key"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className="w-full"
            />

            <Button onClick={testApiKey} disabled={isLoading} className="w-full">
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Testing...
                </>
              ) : (
                "Test API Key"
              )}
            </Button>

            {result && (
              <div className="mt-4">
                <h3 className="font-medium mb-2">Result:</h3>
                <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded overflow-auto max-h-60">
                  <pre className="text-xs whitespace-pre-wrap">{JSON.stringify(result, null, 2)}</pre>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2 } from "lucide-react"

export default function DirectTestPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [results, setResults] = useState<any>(null)

  const runTest = async () => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/direct-test")
      const data = await response.json()
      setResults(data)
    } catch (error) {
      console.error("Error running direct test:", error)
      setResults({ error: error instanceof Error ? error.message : "Unknown error" })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    runTest()
  }, [])

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6 text-center">Direct Voicegain API Test</h1>

      <Card className="w-full max-w-4xl mx-auto mt-4">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Test Results
            <Button onClick={runTest} disabled={isLoading} size="sm">
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Run Again"}
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : results ? (
            <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded overflow-auto max-h-[70vh]">
              <pre className="text-xs whitespace-pre-wrap">{JSON.stringify(results, null, 2)}</pre>
            </div>
          ) : (
            <p>No results yet</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

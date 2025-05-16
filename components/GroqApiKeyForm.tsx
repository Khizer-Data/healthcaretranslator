"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertCircle, Loader2, CheckCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

type GroqApiKeyFormProps = {
  onSuccess: () => void
  onCancel: () => void
}

export default function GroqApiKeyForm({ onSuccess, onCancel }: GroqApiKeyFormProps) {
  const [apiKey, setApiKey] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!apiKey.trim()) {
      setError("Please enter a valid API key")
      return
    }

    setIsLoading(true)
    setError(null)
    setSuccess(false)

    try {
      // Test the API key using our server-side proxy
      const response = await fetch("/api/update-groq-key", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ apiKey }),
      })

      const data = await response.json()

      if (data.success) {
        // Store the API key in localStorage
        localStorage.setItem("groqApiKey", apiKey)
        console.log("Groq API key stored successfully")
        setSuccess(true)

        // Wait a moment to show success message before closing
        setTimeout(() => {
          onSuccess()
        }, 1500)
      } else {
        setError(data.error || "Failed to validate API key")
        if (data.hint) {
          setError(`${data.error} - ${data.hint}`)
        }
      }
    } catch (error) {
      console.error("Error testing Groq API key:", error)
      setError("Failed to test API key. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Groq API Key</CardTitle>
        <CardDescription>
          Enter your Groq API key to enable translation services. You can get an API key from{" "}
          <a
            href="https://console.groq.com/keys"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-500 hover:underline"
          >
            Groq Console
          </a>
          .
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert className="mb-4 bg-green-50 text-green-800 border-green-200">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription>API key validated successfully!</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Input
              type="password"
              placeholder="Enter your Groq API key"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              disabled={isLoading || success}
              className="font-mono"
            />
            <p className="text-xs text-muted-foreground">
              Your API key is stored locally in your browser and is never sent to our servers except to validate it.
            </p>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline" onClick={onCancel} disabled={isLoading || success}>
            Cancel
          </Button>
          <Button type="submit" disabled={isLoading || success}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Testing...
              </>
            ) : success ? (
              <>
                <CheckCircle className="mr-2 h-4 w-4" /> Validated
              </>
            ) : (
              "Save API Key"
            )}
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
}

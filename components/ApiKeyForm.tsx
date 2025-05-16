"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertCircle, Loader2 } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

type ApiKeyFormProps = {
  onSuccess: () => void
  onCancel: () => void
}

export default function ApiKeyForm({ onSuccess, onCancel }: ApiKeyFormProps) {
  const [apiKey, setApiKey] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!apiKey.trim()) {
      setError("Please enter a valid API key")
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      // Test the API key
      const response = await fetch("/api/update-voicegain-key", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ apiKey }),
      })

      const data = await response.json()

      if (data.success) {
        // Store the API key in localStorage
        localStorage.setItem("voicegainApiKey", apiKey)
        console.log("Voicegain API key stored successfully")
        onSuccess()
      } else {
        setError(data.error || "Failed to validate API key")
        if (data.hint) {
          setError(`${data.error} - ${data.hint}`)
        }
      }
    } catch (error) {
      console.error("Error testing Voicegain API key:", error)
      setError("Failed to test API key. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Voicegain API Key</CardTitle>
        <CardDescription>
          Enter your Voicegain API key to enable speech recognition. You can get an API key from{" "}
          <a
            href="https://console.voicegain.ai/account/keys"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-500 hover:underline"
          >
            Voicegain Console
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
          <div className="space-y-2">
            <Input
              type="password"
              placeholder="Enter your Voicegain API key"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              disabled={isLoading}
              className="font-mono"
            />
            <p className="text-xs text-muted-foreground">
              Your API key is stored locally in your browser and is never sent to our servers except to validate it.
            </p>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline" onClick={onCancel} disabled={isLoading}>
            Cancel
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Testing...
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

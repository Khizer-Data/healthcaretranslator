"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { CheckCircle, XCircle, AlertTriangle, RefreshCw } from "lucide-react"

type ApiStatus = {
  voicegain: {
    status: "checking" | "available" | "unavailable"
    details?: string
  }
  groq: {
    status: "checking" | "available" | "unavailable"
    details?: string
  }
}

export default function ApiKeyTester() {
  const [apiStatus, setApiStatus] = useState<ApiStatus>({
    voicegain: { status: "checking" },
    groq: { status: "checking" },
  })
  const [isLoading, setIsLoading] = useState(false)

  const testApiKeys = async () => {
    setIsLoading(true)
    setApiStatus({
      voicegain: { status: "checking" },
      groq: { status: "checking" },
    })

    // Test Voicegain API
    try {
      const voicegainResponse = await fetch("/api/test-voicegain")
      const voicegainData = await voicegainResponse.json()

      setApiStatus((prev) => ({
        ...prev,
        voicegain: {
          status: voicegainData.valid ? "available" : "unavailable",
          details: voicegainData.valid
            ? voicegainData.message || "API connection successful"
            : voicegainData.error || "Unknown error",
        },
      }))
    } catch (error) {
      console.error("Error testing Voicegain API:", error)
      setApiStatus((prev) => ({
        ...prev,
        voicegain: {
          status: "unavailable",
          details: error instanceof Error ? error.message : "Failed to connect to API",
        },
      }))
    }

    // Test Groq API
    try {
      const groqResponse = await fetch("/api/test-groq-env")
      const groqData = await groqResponse.json()

      setApiStatus((prev) => ({
        ...prev,
        groq: {
          status: groqData.success ? "available" : "unavailable",
          details: groqData.success ? "API connection successful" : groqData.error || "Unknown error",
        },
      }))
    } catch (error) {
      console.error("Error testing Groq API:", error)
      setApiStatus((prev) => ({
        ...prev,
        groq: {
          status: "unavailable",
          details: error instanceof Error ? error.message : "Failed to connect to API",
        },
      }))
    }

    setIsLoading(false)
  }

  // Run tests on component mount
  useEffect(() => {
    testApiKeys()
  }, [])

  return (
    <Card className="w-full max-w-3xl mx-auto">
      <CardHeader>
        <CardTitle className="text-xl">API Key Verification</CardTitle>
        <CardDescription>Testing environment variables for Groq and Voicegain API keys</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4">
          <ApiStatusCard
            title="Voicegain API Key"
            status={apiStatus.voicegain.status}
            details={apiStatus.voicegain.details}
          />

          <ApiStatusCard title="Groq API Key" status={apiStatus.groq.status} details={apiStatus.groq.details} />
        </div>

        {(apiStatus.voicegain.status === "unavailable" || apiStatus.groq.status === "unavailable") && (
          <Alert variant="destructive" className="mt-4">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>API Key Issues Detected</AlertTitle>
            <AlertDescription>
              One or more API keys are not working correctly. Please check your environment variables in your Vercel
              project settings.
            </AlertDescription>
          </Alert>
        )}

        {apiStatus.voicegain.status === "available" && apiStatus.groq.status === "available" && (
          <Alert className="mt-4 bg-green-50 border-green-200 text-green-800">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertTitle>All API Keys Verified</AlertTitle>
            <AlertDescription>Both Groq and Voicegain API keys are working correctly.</AlertDescription>
          </Alert>
        )}
      </CardContent>
      <CardFooter>
        <Button onClick={testApiKeys} disabled={isLoading} className="flex items-center gap-2">
          {isLoading ? (
            <>
              <RefreshCw className="h-4 w-4 animate-spin" />
              Testing...
            </>
          ) : (
            <>
              <RefreshCw className="h-4 w-4" />
              Retest API Keys
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  )
}

function ApiStatusCard({
  title,
  status,
  details,
}: {
  title: string
  status: "checking" | "available" | "unavailable"
  details?: string
}) {
  return (
    <div className="border rounded-lg p-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-medium">{title}</h3>
        {status === "checking" ? (
          <span className="flex items-center text-yellow-500">
            <RefreshCw className="h-4 w-4 mr-1 animate-spin" /> Checking...
          </span>
        ) : status === "available" ? (
          <span className="flex items-center text-green-500">
            <CheckCircle className="h-4 w-4 mr-1" /> Available
          </span>
        ) : (
          <span className="flex items-center text-red-500">
            <XCircle className="h-4 w-4 mr-1" /> Unavailable
          </span>
        )}
      </div>
      {details && <p className={`text-sm ${status === "available" ? "text-green-600" : "text-gray-600"}`}>{details}</p>}
    </div>
  )
}

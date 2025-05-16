"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle, XCircle, AlertTriangle, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"

type ApiStatus = {
  voicegain: "checking" | "available" | "unavailable" | "error"
  groq: "checking" | "available" | "unavailable" | "error"
  errorDetails?: {
    voicegain?: string
    groq?: string
  }
}

export default function EnvVarStatus() {
  const [apiStatus, setApiStatus] = useState<ApiStatus>({
    voicegain: "checking",
    groq: "checking",
    errorDetails: {},
  })
  const [isRefreshing, setIsRefreshing] = useState(false)

  const checkApiStatus = async () => {
    setIsRefreshing(true)
    setApiStatus({
      voicegain: "checking",
      groq: "checking",
      errorDetails: {},
    })

    // Check Voicegain API
    try {
      console.log("Checking Voicegain API...")
      const voicegainResponse = await fetch("/api/test-voicegain")
      const voicegainData = await voicegainResponse.json()

      if (voicegainData.valid) {
        console.log("Voicegain API is available")
        setApiStatus((prev) => ({
          ...prev,
          voicegain: "available",
        }))
      } else {
        console.warn("Voicegain API is unavailable:", voicegainData.error)
        setApiStatus((prev) => ({
          ...prev,
          voicegain: "unavailable",
          errorDetails: {
            ...prev.errorDetails,
            voicegain: voicegainData.error || "Unknown error",
          },
        }))
      }
    } catch (error) {
      console.error("Error checking Voicegain API:", error)
      setApiStatus((prev) => ({
        ...prev,
        voicegain: "error",
        errorDetails: {
          ...prev.errorDetails,
          voicegain: error instanceof Error ? error.message : "Network error",
        },
      }))
    }

    // Check Groq API with our dedicated endpoint
    try {
      console.log("Checking Groq API...")
      const groqResponse = await fetch("/api/check-groq-key")
      const groqData = await groqResponse.json()

      console.log("Groq API check response:", groqData)

      if (groqResponse.ok && groqData.valid) {
        console.log("Groq API is available")
        setApiStatus((prev) => ({
          ...prev,
          groq: "available",
        }))
      } else {
        console.warn("Groq API is unavailable:", groqData.error)
        setApiStatus((prev) => ({
          ...prev,
          groq: "unavailable",
          errorDetails: {
            ...prev.errorDetails,
            groq: groqData.error || "Unknown error",
          },
        }))
      }
    } catch (error) {
      console.error("Error checking Groq API:", error)
      setApiStatus((prev) => ({
        ...prev,
        groq: "error",
        errorDetails: {
          ...prev.errorDetails,
          groq: error instanceof Error ? error.message : "Network error",
        },
      }))
    }

    setIsRefreshing(false)
  }

  useEffect(() => {
    checkApiStatus()
  }, [])

  return (
    <Card className="mb-4">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg">Environment Variables Status</CardTitle>
        <Button variant="outline" size="sm" onClick={checkApiStatus} disabled={isRefreshing}>
          {isRefreshing ? (
            <>
              <RefreshCw className="h-4 w-4 mr-1 animate-spin" /> Checking...
            </>
          ) : (
            "Refresh"
          )}
        </Button>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-1">
              <span>Voicegain API Key:</span>
              {apiStatus.voicegain === "checking" ? (
                <span className="flex items-center text-yellow-500">
                  <AlertTriangle className="h-4 w-4 mr-1" /> Checking...
                </span>
              ) : apiStatus.voicegain === "available" ? (
                <span className="flex items-center text-green-500">
                  <CheckCircle className="h-4 w-4 mr-1" /> Available
                </span>
              ) : apiStatus.voicegain === "error" ? (
                <span className="flex items-center text-orange-500">
                  <AlertTriangle className="h-4 w-4 mr-1" /> Error
                </span>
              ) : (
                <span className="flex items-center text-red-500">
                  <XCircle className="h-4 w-4 mr-1" /> Not configured
                </span>
              )}
            </div>
            {apiStatus.errorDetails?.voicegain && (
              <div className="text-sm text-red-500 mt-1 p-2 bg-red-50 rounded-md">
                Error: {apiStatus.errorDetails.voicegain}
              </div>
            )}
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <span>Groq API Key:</span>
              {apiStatus.groq === "checking" ? (
                <span className="flex items-center text-yellow-500">
                  <AlertTriangle className="h-4 w-4 mr-1" /> Checking...
                </span>
              ) : apiStatus.groq === "available" ? (
                <span className="flex items-center text-green-500">
                  <CheckCircle className="h-4 w-4 mr-1" /> Available
                </span>
              ) : apiStatus.groq === "error" ? (
                <span className="flex items-center text-orange-500">
                  <AlertTriangle className="h-4 w-4 mr-1" /> Error
                </span>
              ) : (
                <span className="flex items-center text-red-500">
                  <XCircle className="h-4 w-4 mr-1" /> Not configured
                </span>
              )}
            </div>
            {apiStatus.errorDetails?.groq && (
              <div className="text-sm text-red-500 mt-1 p-2 bg-red-50 rounded-md">
                Error: {apiStatus.errorDetails.groq}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

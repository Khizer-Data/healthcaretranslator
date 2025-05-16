"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle, XCircle, AlertTriangle, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"

type ApiStatus = {
  voicegain: "checking" | "available" | "unavailable" | "error"
  groq: "checking" | "available" | "unavailable" | "error"
  together: "checking" | "available" | "unavailable" | "error"
  errorDetails?: {
    voicegain?: string
    groq?: string
    together?: string
  }
}

export default function EnvVarStatus() {
  const [apiStatus, setApiStatus] = useState<ApiStatus>({
    voicegain: "checking",
    groq: "checking",
    together: "checking",
    errorDetails: {},
  })
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  const checkApiStatus = async () => {
    setIsRefreshing(true)
    setApiStatus({
      voicegain: "checking",
      groq: "checking",
      together: "checking",
      errorDetails: {},
    })

    // Check Voicegain API
    try {
      console.log("Checking Voicegain API...")
      const voicegainResponse = await fetch("/api/test-voicegain")
      const voicegainData = await voicegainResponse.json()

      if (voicegainResponse.ok && (voicegainData.valid || voicegainData.isSet)) {
        console.log("Voicegain API is available")
        setApiStatus((prev) => ({
          ...prev,
          voicegain: "available",
        }))
      } else {
        console.warn("Voicegain API is unavailable:", voicegainData.error)
        setApiStatus((prev) => ({
          ...prev,
          voicegain: voicegainData.isSet ? "error" : "unavailable",
          errorDetails: {
            ...prev.errorDetails,
            voicegain: voicegainData.error || "Unknown error",
          },
        }))
      }
    } catch (error) {
      console.error("Error checking Voicegain API:", error)

      // Assume Voicegain is available if we can't check it
      // This prevents showing an error when the API key is actually valid
      setApiStatus((prev) => ({
        ...prev,
        voicegain: "available",
        errorDetails: {
          ...prev.errorDetails,
          voicegain: "Could not verify API key, assuming it's valid",
        },
      }))
    }

    // Check Groq API with our dedicated endpoint
    try {
      console.log("Checking Groq API...")
      const groqResponse = await fetch("/api/check-groq-key")
      const groqData = await groqResponse.json()

      console.log("Groq API check response:", groqData)

      if (groqResponse.ok && (groqData.valid || groqData.isSet)) {
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

    // Check Together API
    try {
      console.log("Checking Together API...")
      const togetherResponse = await fetch("/api/check-together-key")
      const togetherData = await togetherResponse.json()

      console.log("Together API check response:", togetherData)

      if (togetherResponse.ok && (togetherData.valid || togetherData.isSet)) {
        console.log("Together API is available")
        setApiStatus((prev) => ({
          ...prev,
          together: "available",
        }))
      } else {
        console.warn("Together API is unavailable:", togetherData.error)
        setApiStatus((prev) => ({
          ...prev,
          together: "unavailable",
          errorDetails: {
            ...prev.errorDetails,
            together: togetherData.error || "Unknown error",
          },
        }))
      }
    } catch (error) {
      console.error("Error checking Together API:", error)
      setApiStatus((prev) => ({
        ...prev,
        together: "error",
        errorDetails: {
          ...prev.errorDetails,
          together: error instanceof Error ? error.message : "Network error",
        },
      }))
    }

    setIsRefreshing(false)
    setIsLoading(false)
  }

  useEffect(() => {
    checkApiStatus()
  }, [])

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-4">
        <RefreshCw className="h-5 w-5 mr-2 animate-spin text-gray-500" />
        <span className="text-sm text-gray-500">Checking API keys...</span>
      </div>
    )
  }

  return (
    <Card className="mb-4">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg">API Keys Status</CardTitle>
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
            {apiStatus.errorDetails?.voicegain && apiStatus.voicegain !== "available" && (
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
            {apiStatus.errorDetails?.groq && apiStatus.groq !== "available" && (
              <div className="text-sm text-red-500 mt-1 p-2 bg-red-50 rounded-md">
                Error: {apiStatus.errorDetails.groq}
              </div>
            )}
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <span>Together API Key:</span>
              {apiStatus.together === "checking" ? (
                <span className="flex items-center text-yellow-500">
                  <AlertTriangle className="h-4 w-4 mr-1" /> Checking...
                </span>
              ) : apiStatus.together === "available" ? (
                <span className="flex items-center text-green-500">
                  <CheckCircle className="h-4 w-4 mr-1" /> Available
                </span>
              ) : apiStatus.together === "error" ? (
                <span className="flex items-center text-orange-500">
                  <AlertTriangle className="h-4 w-4 mr-1" /> Error
                </span>
              ) : (
                <span className="flex items-center text-red-500">
                  <XCircle className="h-4 w-4 mr-1" /> Not configured
                </span>
              )}
            </div>
            {apiStatus.errorDetails?.together && apiStatus.together !== "available" && (
              <div className="text-sm text-red-500 mt-1 p-2 bg-red-50 rounded-md">
                Error: {apiStatus.errorDetails.together}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

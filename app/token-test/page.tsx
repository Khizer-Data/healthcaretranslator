"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Loader2, CheckCircle, XCircle, AlertTriangle } from "lucide-react"

export default function TokenTestPage() {
  const [token, setToken] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isEnvLoading, setIsEnvLoading] = useState(false)
  const [results, setResults] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  const testToken = async () => {
    if (!token.trim()) {
      setError("Please enter a token to test")
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch("/api/test-token", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ token }),
      })

      const data = await response.json()
      setResults(data)

      if (!data.success) {
        setError(data.error || "Failed to test token")
      }
    } catch (err) {
      setError("An error occurred while testing the token")
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  const testEnvToken = async () => {
    setIsEnvLoading(true)
    setError(null)

    try {
      const response = await fetch("/api/test-env-token")
      const data = await response.json()
      setResults(data)

      if (!data.success) {
        setError(data.error || "Failed to test environment token")
      }
    } catch (err) {
      setError("An error occurred while testing the environment token")
      console.error(err)
    } finally {
      setIsEnvLoading(false)
    }
  }

  const formatDate = (isoString: string) => {
    try {
      return new Date(isoString).toLocaleString()
    } catch (e) {
      return isoString
    }
  }

  const formatTimeRemaining = (seconds: number) => {
    if (seconds < 0) return "Expired"
    if (seconds < 60) return `${seconds} seconds`
    if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes`
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours`
    return `${Math.floor(seconds / 86400)} days`
  }

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">Voicegain Token Tester</h1>

      <Tabs defaultValue="custom">
        <TabsList className="mb-4">
          <TabsTrigger value="custom">Test Custom Token</TabsTrigger>
          <TabsTrigger value="env">Test Environment Token</TabsTrigger>
        </TabsList>

        <TabsContent value="custom">
          <Card>
            <CardHeader>
              <CardTitle>Test Custom Token</CardTitle>
              <CardDescription>Enter a Voicegain JWT token to test against different endpoints</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Input
                    id="token"
                    placeholder="Enter your Voicegain JWT token"
                    value={token}
                    onChange={(e) => setToken(e.target.value)}
                    className="font-mono text-sm"
                  />
                  <p className="text-xs text-muted-foreground">Token can be with or without the "Bearer " prefix</p>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={testToken} disabled={isLoading}>
                {isLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                Test Token
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="env">
          <Card>
            <CardHeader>
              <CardTitle>Test Environment Token</CardTitle>
              <CardDescription>Test the token stored in your VOICEGAIN_API_KEY environment variable</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm mb-4">This will test the token currently set in your environment variables.</p>
            </CardContent>
            <CardFooter>
              <Button onClick={testEnvToken} disabled={isEnvLoading}>
                {isEnvLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                Test Environment Token
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>

      {error && (
        <Alert variant="destructive" className="mt-6">
          <XCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {results && (
        <div className="mt-6 space-y-6">
          {/* Token Decoding Results */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                Token Decoding Results
                {results.decodedToken?.isValid ? (
                  results.decodedToken?.isExpired ? (
                    <AlertTriangle className="h-5 w-5 text-amber-500" />
                  ) : (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  )
                ) : (
                  <XCircle className="h-5 w-5 text-red-500" />
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {results.decodedToken?.isValid ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium">Expiration Status:</p>
                      <p className={`text-sm ${results.decodedToken.isExpired ? "text-red-500" : "text-green-500"}`}>
                        {results.decodedToken.isExpired ? "Expired" : "Valid"}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium">Expires At:</p>
                      <p className="text-sm">
                        {results.decodedToken.expiresAt === "No expiration"
                          ? "No expiration"
                          : formatDate(results.decodedToken.expiresAt)}
                      </p>
                    </div>
                  </div>

                  {typeof results.decodedToken.timeRemaining === "number" && (
                    <div>
                      <p className="text-sm font-medium">Time Remaining:</p>
                      <p
                        className={`text-sm ${results.decodedToken.timeRemaining < 0 ? "text-red-500" : "text-green-500"}`}
                      >
                        {formatTimeRemaining(results.decodedToken.timeRemaining)}
                      </p>
                    </div>
                  )}

                  <div>
                    <p className="text-sm font-medium mb-1">Token Payload:</p>
                    <pre className="bg-gray-100 dark:bg-gray-800 p-3 rounded text-xs overflow-auto max-h-60">
                      {JSON.stringify(results.decodedToken.payload, null, 2)}
                    </pre>
                  </div>
                </div>
              ) : (
                <Alert variant="destructive">
                  <XCircle className="h-4 w-4" />
                  <AlertTitle>Invalid Token Format</AlertTitle>
                  <AlertDescription>{results.decodedToken?.error || "The token could not be decoded"}</AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>

          {/* Endpoint Test Results */}
          <Card>
            <CardHeader>
              <CardTitle>Endpoint Test Results</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {results.testResults?.map((result: any, index: number) => (
                  <div key={index} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-medium">{result.endpoint}</h3>
                      {result.success ? (
                        <span className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100 px-2 py-1 rounded text-xs flex items-center gap-1">
                          <CheckCircle className="h-3 w-3" /> Success
                        </span>
                      ) : (
                        <span className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100 px-2 py-1 rounded text-xs flex items-center gap-1">
                          <XCircle className="h-3 w-3" /> Failed ({result.status || "Error"})
                        </span>
                      )}
                    </div>

                    {result.error && !result.success && <p className="text-sm text-red-500 mb-2">{result.error}</p>}

                    <p className="text-xs font-medium mb-1">Response:</p>
                    <pre className="bg-gray-100 dark:bg-gray-800 p-2 rounded text-xs overflow-auto max-h-40">
                      {JSON.stringify(result.data, null, 2)}
                    </pre>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}

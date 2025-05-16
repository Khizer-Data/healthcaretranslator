"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import ApiKeyForm from "@/components/ApiKeyForm"
import GroqApiKeyForm from "@/components/GroqApiKeyForm"
import EnvVarStatus from "@/components/EnvVarStatus"

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("env")
  const [voicegainKeySet, setVoicegainKeySet] = useState(false)
  const [groqKeySet, setGroqKeySet] = useState(false)

  useEffect(() => {
    // Check if keys are in localStorage
    setVoicegainKeySet(!!localStorage.getItem("voicegainApiKey"))
    setGroqKeySet(!!localStorage.getItem("groqApiKey"))
  }, [])

  const handleVoicegainSuccess = () => {
    setVoicegainKeySet(true)
  }

  const handleGroqSuccess = () => {
    setGroqKeySet(true)
  }

  const handleResetVoicegain = () => {
    localStorage.removeItem("voicegainApiKey")
    setVoicegainKeySet(false)
  }

  const handleResetGroq = () => {
    localStorage.removeItem("groqApiKey")
    setGroqKeySet(false)
  }

  return (
    <div className="container mx-auto py-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">Settings</h1>

      <EnvVarStatus />

      <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-8">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="env">Environment Variables</TabsTrigger>
          <TabsTrigger value="voicegain">Voicegain API Key</TabsTrigger>
          <TabsTrigger value="groq">Groq API Key</TabsTrigger>
        </TabsList>

        <TabsContent value="env" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Environment Variables</CardTitle>
              <CardDescription>
                For production use, it's recommended to set API keys as environment variables instead of storing them in
                the browser.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-medium mb-2">Required Environment Variables:</h3>
                <ul className="list-disc pl-5 space-y-2">
                  <li>
                    <code className="bg-gray-100 px-1 py-0.5 rounded">VOICEGAIN_API_KEY</code> - Your Voicegain API key
                    for speech recognition
                  </li>
                  <li>
                    <code className="bg-gray-100 px-1 py-0.5 rounded">GROQ_API_KEY</code> - Your Groq API key for
                    translation services
                  </li>
                </ul>
              </div>

              <div className="bg-yellow-50 p-4 rounded-md border border-yellow-200">
                <p className="text-yellow-800 text-sm">
                  <strong>Note:</strong> When environment variables are set, they take precedence over browser-stored
                  API keys.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="voicegain" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Voicegain API Key</CardTitle>
              <CardDescription>
                Configure your Voicegain API key for speech recognition. You can get an API key from{" "}
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
            <CardContent>
              {voicegainKeySet ? (
                <div className="text-center py-4">
                  <p className="text-green-600 mb-4">✓ Voicegain API key is configured in browser storage</p>
                  <Button variant="outline" onClick={handleResetVoicegain}>
                    Reset Key
                  </Button>
                </div>
              ) : (
                <ApiKeyForm onSuccess={handleVoicegainSuccess} onCancel={() => setActiveTab("env")} />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="groq" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Groq API Key</CardTitle>
              <CardDescription>
                Configure your Groq API key for translation services. You can get an API key from{" "}
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
            <CardContent>
              {groqKeySet ? (
                <div className="text-center py-4">
                  <p className="text-green-600 mb-4">✓ Groq API key is configured in browser storage</p>
                  <Button variant="outline" onClick={handleResetGroq}>
                    Reset Key
                  </Button>
                </div>
              ) : (
                <GroqApiKeyForm onSuccess={handleGroqSuccess} onCancel={() => setActiveTab("env")} />
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="mt-8">
        <Button variant="outline" onClick={() => window.history.back()}>
          Back to Application
        </Button>
      </div>
    </div>
  )
}

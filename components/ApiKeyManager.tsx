"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import ApiKeyForm from "./ApiKeyForm"
import GroqApiKeyForm from "./GroqApiKeyForm"

type ApiKeyManagerProps = {
  onComplete: () => void
}

export default function ApiKeyManager({ onComplete }: ApiKeyManagerProps) {
  const [activeTab, setActiveTab] = useState("voicegain")
  const [voicegainKeySet, setVoicegainKeySet] = useState(false)
  const [groqKeySet, setGroqKeySet] = useState(false)
  const [envKeysChecked, setEnvKeysChecked] = useState(false)

  // Check for environment variables first
  useEffect(() => {
    const checkEnvKeys = async () => {
      try {
        // Check Voicegain API key in environment
        const voicegainResponse = await fetch("/api/test-voicegain")
        const voicegainData = await voicegainResponse.json()
        const voicegainEnvKeyValid = voicegainData.valid

        // Check Groq API key in environment
        const groqResponse = await fetch("/api/check-groq-key")
        const groqData = await groqResponse.json()
        const groqEnvKeyValid = groqData.valid

        // Update state based on environment variables
        setVoicegainKeySet(voicegainEnvKeyValid || !!localStorage.getItem("voicegainApiKey"))
        setGroqKeySet(groqEnvKeyValid || !!localStorage.getItem("groqApiKey"))

        // If both keys are available in environment variables, complete setup
        if (voicegainEnvKeyValid && groqEnvKeyValid) {
          setTimeout(() => onComplete(), 1000)
        }

        setEnvKeysChecked(true)
      } catch (error) {
        console.error("Error checking environment keys:", error)
        // Fall back to checking localStorage
        setVoicegainKeySet(!!localStorage.getItem("voicegainApiKey"))
        setGroqKeySet(!!localStorage.getItem("groqApiKey"))
        setEnvKeysChecked(true)
      }
    }

    checkEnvKeys()
  }, [onComplete])

  const handleVoicegainSuccess = () => {
    setVoicegainKeySet(true)
    // If both keys are now set, call onComplete
    if (groqKeySet) {
      setTimeout(() => onComplete(), 1000)
    } else {
      // Switch to the Groq tab if Voicegain is set but Groq isn't
      setActiveTab("groq")
    }
  }

  const handleGroqSuccess = () => {
    setGroqKeySet(true)
    // If both keys are now set, call onComplete
    if (voicegainKeySet) {
      setTimeout(() => onComplete(), 1000)
    } else {
      // Switch to the Voicegain tab if Groq is set but Voicegain isn't
      setActiveTab("voicegain")
    }
  }

  const handleSkip = () => {
    onComplete()
  }

  // Show loading state until we've checked environment variables
  if (!envKeysChecked) {
    return (
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>API Key Setup</CardTitle>
          <CardDescription>Checking environment variables...</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center py-6">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>API Key Setup</CardTitle>
        <CardDescription>
          Configure your API keys to enable all features of the Healthcare Translator.
          {(voicegainKeySet || groqKeySet) && (
            <p className="mt-2 text-sm text-green-600">
              {voicegainKeySet && groqKeySet
                ? "Both API keys are configured!"
                : voicegainKeySet
                  ? "Voicegain API key is configured. Groq API key is still needed."
                  : "Groq API key is configured. Voicegain API key is still needed."}
            </p>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="voicegain" className="relative">
              Voicegain Key
              {voicegainKeySet && <span className="absolute top-1 right-1 w-2 h-2 bg-green-500 rounded-full"></span>}
            </TabsTrigger>
            <TabsTrigger value="groq" className="relative">
              Groq Key
              {groqKeySet && <span className="absolute top-1 right-1 w-2 h-2 bg-green-500 rounded-full"></span>}
            </TabsTrigger>
          </TabsList>
          <TabsContent value="voicegain" className="mt-4">
            {voicegainKeySet ? (
              <div className="text-center py-4">
                <p className="text-green-600 mb-2">✓ Voicegain API key is configured</p>
                <Button
                  variant="outline"
                  onClick={() => {
                    localStorage.removeItem("voicegainApiKey")
                    setVoicegainKeySet(false)
                  }}
                >
                  Reset Key
                </Button>
              </div>
            ) : (
              <ApiKeyForm onSuccess={handleVoicegainSuccess} onCancel={handleSkip} />
            )}
          </TabsContent>
          <TabsContent value="groq" className="mt-4">
            {groqKeySet ? (
              <div className="text-center py-4">
                <p className="text-green-600 mb-2">✓ Groq API key is configured</p>
                <Button
                  variant="outline"
                  onClick={() => {
                    localStorage.removeItem("groqApiKey")
                    setGroqKeySet(false)
                  }}
                >
                  Reset Key
                </Button>
              </div>
            ) : (
              <GroqApiKeyForm onSuccess={handleGroqSuccess} onCancel={handleSkip} />
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline" onClick={handleSkip}>
          Skip Setup
        </Button>
        <Button
          onClick={onComplete}
          disabled={!voicegainKeySet && !groqKeySet}
          variant={voicegainKeySet || groqKeySet ? "default" : "outline"}
        >
          {voicegainKeySet && groqKeySet
            ? "Continue with Both Keys"
            : voicegainKeySet
              ? "Continue with Voicegain Only"
              : groqKeySet
                ? "Continue with Groq Only"
                : "Skip Both Keys"}
        </Button>
      </CardFooter>
    </Card>
  )
}

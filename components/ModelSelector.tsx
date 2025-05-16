"use client"

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useEffect } from "react"

interface ModelSelectorProps {
  value: string
  onChange: (value: string) => void
  preferredProvider?: "groq" | "together"
}

export default function ModelSelector({ value, onChange, preferredProvider = "groq" }: ModelSelectorProps) {
  // Define models
  const GROQ_MODELS = [
    { value: "llama3-70b-8192", label: "Groq - Llama 3 70B" },
    { value: "llama3-8b-8192", label: "Groq - Llama 3 8B" },
  ]

  const TOGETHER_MODELS = [
    { value: "meta-llama/Llama-3.1-70B-Instruct-Turbo", label: "Together AI - Llama 3.1 70B" },
    { value: "meta-llama/Llama-3.1-8B-Instruct-Turbo", label: "Together AI - Llama 3.1 8B" },
    { value: "mistralai/Mixtral-8x7B-Instruct-v0.1", label: "Together AI - Mixtral 8x7B" },
  ]

  // Set default model based on preferred provider
  useEffect(() => {
    const isValidModel = [...GROQ_MODELS, ...TOGETHER_MODELS].some((model) => model.value === value)

    if (!isValidModel && onChange) {
      if (preferredProvider === "groq") {
        onChange("llama3-70b-8192")
      } else {
        onChange("meta-llama/Llama-3.1-70B-Instruct-Turbo")
      }
    }
  }, [value, onChange, preferredProvider])

  // Order models based on preferred provider
  const orderedModels =
    preferredProvider === "groq" ? [...GROQ_MODELS, ...TOGETHER_MODELS] : [...TOGETHER_MODELS, ...GROQ_MODELS]

  return (
    <div>
      <label className="block text-sm font-medium mb-1">Translation Model</label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Select model" />
        </SelectTrigger>
        <SelectContent>
          {orderedModels.map((model) => (
            <SelectItem key={model.value} value={model.value}>
              {model.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <p className="text-xs text-muted-foreground mt-1">
        If one service is unavailable, the app will automatically try the other
      </p>
    </div>
  )
}

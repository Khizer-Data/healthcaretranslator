"use client"

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

// Available open-source models on Groq
const GROQ_MODELS = [
  { value: "llama3-8b-8192", label: "Llama 3 8B (Faster)" },
  { value: "llama3-70b-8192", label: "Llama 3 70B (Better)" },
  { value: "mixtral-8x7b-32768", label: "Mixtral 8x7B (Alternative)" },
  { value: "gemma-7b-it", label: "Gemma 7B (Lightweight)" },
]

type ModelSelectorProps = {
  value: string
  onChange: (value: string) => void
}

export default function ModelSelector({ value, onChange }: ModelSelectorProps) {
  return (
    <div className="w-full">
      <label className="block text-sm font-medium mb-1">Translation Model</label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Select model" />
        </SelectTrigger>
        <SelectContent>
          {GROQ_MODELS.map((model) => (
            <SelectItem key={model.value} value={model.value}>
              {model.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <p className="text-xs text-muted-foreground mt-1">If you encounter 503 errors, try a different model</p>
    </div>
  )
}

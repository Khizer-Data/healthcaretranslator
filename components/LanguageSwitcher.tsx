"use client"

import { Button } from "@/components/ui/button"
import { ArrowLeftRight } from "lucide-react"

interface LanguageSwitcherProps {
  onSwitch: () => void
}

export default function LanguageSwitcher({ onSwitch }: LanguageSwitcherProps) {
  return (
    <div className="flex items-end justify-center mb-1">
      <Button
        variant="outline"
        size="icon"
        onClick={onSwitch}
        className="h-10 w-10"
        title="Switch languages"
        aria-label="Switch input and output languages"
      >
        <ArrowLeftRight className="h-4 w-4" />
      </Button>
    </div>
  )
}

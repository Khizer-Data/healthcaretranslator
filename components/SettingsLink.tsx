"use client"

import { Settings } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default function SettingsLink() {
  return (
    <Link href="/settings" passHref>
      <Button variant="ghost" size="icon" className="absolute top-4 right-4" aria-label="Settings">
        <Settings className="h-5 w-5" />
      </Button>
    </Link>
  )
}

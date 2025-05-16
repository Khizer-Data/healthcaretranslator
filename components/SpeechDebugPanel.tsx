"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Mic, MicOff, Bug } from "lucide-react"

type SpeechDebugPanelProps = {
  isActive: boolean
  status: "idle" | "connecting" | "connected" | "error"
  errorMessage: string | null
  volumeLevel: number
  onToggleDebug: () => void
}

export default function SpeechDebugPanel({
  isActive,
  status,
  errorMessage,
  volumeLevel,
  onToggleDebug,
}: SpeechDebugPanelProps) {
  const [logs, setLogs] = useState<string[]>([])
  const [isExpanded, setIsExpanded] = useState(false)

  // Capture console logs
  useEffect(() => {
    if (!isActive) return

    const originalConsoleLog = console.log
    const originalConsoleError = console.error

    console.log = (...args) => {
      originalConsoleLog(...args)
      setLogs((prev) => [...prev, `[LOG] ${args.map(String).join(" ")}`].slice(-50))
    }

    console.error = (...args) => {
      originalConsoleError(...args)
      setLogs((prev) => [...prev, `[ERROR] ${args.map(String).join(" ")}`].slice(-50))
    }

    return () => {
      console.log = originalConsoleLog
      console.error = originalConsoleError
    }
  }, [isActive])

  // Add status changes to logs
  useEffect(() => {
    if (isActive) {
      setLogs((prev) => [...prev, `[STATUS] Speech recognition status changed to: ${status}`])
    }
  }, [status, isActive])

  // Add error messages to logs
  useEffect(() => {
    if (isActive && errorMessage) {
      setLogs((prev) => [...prev, `[ERROR] ${errorMessage}`])
    }
  }, [errorMessage, isActive])

  if (!isActive) {
    return (
      <Button variant="outline" size="sm" className="fixed bottom-4 right-4 z-50" onClick={onToggleDebug}>
        <Bug className="mr-2 h-4 w-4" /> Debug Speech
      </Button>
    )
  }

  return (
    <Card className="fixed bottom-4 right-4 z-50 w-96 shadow-lg">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <CardTitle className="text-sm font-medium">Speech Recognition Debug</CardTitle>
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={() => setIsExpanded(!isExpanded)}>
              {isExpanded ? "Collapse" : "Expand"}
            </Button>
            <Button variant="ghost" size="sm" onClick={onToggleDebug}>
              Close
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-2 text-xs">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <span>Status:</span>
            <Badge
              variant={
                status === "connected"
                  ? "success"
                  : status === "connecting"
                    ? "warning"
                    : status === "error"
                      ? "destructive"
                      : "outline"
              }
            >
              {status}
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <span>Mic:</span>
            {status === "connected" ? (
              <Mic className="h-4 w-4 text-green-500" />
            ) : (
              <MicOff className="h-4 w-4 text-red-500" />
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span>Volume:</span>
          <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
            <div
              className="bg-blue-600 h-2.5 rounded-full"
              style={{ width: `${Math.min(volumeLevel * 100, 100)}%` }}
            ></div>
          </div>
        </div>

        {errorMessage && <div className="text-red-500 font-medium">Error: {errorMessage}</div>}

        {isExpanded && (
          <div className="mt-2">
            <div className="font-medium mb-1">Debug Logs:</div>
            <div className="bg-gray-100 dark:bg-gray-800 p-2 rounded-md h-40 overflow-y-auto">
              {logs.map((log, i) => (
                <div
                  key={i}
                  className={`text-xs ${
                    log.includes("[ERROR]")
                      ? "text-red-500"
                      : log.includes("[STATUS]")
                        ? "text-blue-500"
                        : "text-gray-700 dark:text-gray-300"
                  }`}
                >
                  {log}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex justify-between mt-2">
          <Button variant="outline" size="sm" onClick={() => setLogs([])}>
            Clear Logs
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              const logText = logs.join("\n")
              navigator.clipboard.writeText(logText)
            }}
          >
            Copy Logs
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

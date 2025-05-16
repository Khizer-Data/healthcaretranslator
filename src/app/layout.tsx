import type React from "react"
import "./globals.css"

export const metadata = {
  title: "Healthcare Translator",
  description: "Real-time multilingual healthcare translator",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.ico" />
      </head>
      <body className="bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100">{children}</body>
    </html>
  )
}

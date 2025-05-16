import { type NextRequest, NextResponse } from "next/server"
import { translateText } from "../../../src/utils/translationService"

export async function POST(request: NextRequest) {
  try {
    const { text, inputLang, outputLang } = await request.json()

    if (!text || !inputLang || !outputLang) {
      return NextResponse.json({ error: "Missing required parameters: text, inputLang, outputLang" }, { status: 400 })
    }

    const result = await translateText(text, inputLang, outputLang)

    return NextResponse.json({ result })
  } catch (error) {
    console.error("Translation API error:", error)
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 })
  }
}

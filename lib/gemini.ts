const GEMINI_MODELS = [
  "gemini-3.6-flash",
  "gemini-3.5-flash",
  "gemini-flash-latest",
  "gemini-pro-latest",
  "gemini-3.1-pro-preview",
]

export async function generateGeminiAI(prompt: string, systemInstruction?: string): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey || apiKey.includes("YOUR_")) {
    throw new Error("No Gemini API key configured")
  }

  let lastError: any = null

  for (const model of GEMINI_MODELS) {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 12000)

    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`
      const body: any = {
        contents: [
          {
            role: "user",
            parts: [{ text: prompt }],
          },
        ],
        ...(systemInstruction
          ? {
              systemInstruction: {
                parts: [{ text: systemInstruction }],
              },
            }
          : {}),
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 2000,
        },
      }

      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        signal: controller.signal,
      }).finally(() => clearTimeout(timeoutId))

      if (!res.ok) {
        const errText = await res.text().catch(() => "")
        console.warn(`Gemini API HTTP ${res.status} on ${model}:`, errText)
        lastError = new Error(`HTTP ${res.status} on ${model}: ${errText}`)
        continue
      }

      const data = await res.json()
      const parts = data.candidates?.[0]?.content?.parts || []
      const text = parts.map((p: any) => p.text).filter(Boolean).join("\n")
      if (text && text.trim()) {
        return text.trim()
      }
    } catch (err: any) {
      clearTimeout(timeoutId)
      console.warn(`Gemini API fetch error on ${model}:`, err?.message || err)
      lastError = err
    }
  }

  throw lastError || new Error("All Gemini models failed or rate-limited")
}


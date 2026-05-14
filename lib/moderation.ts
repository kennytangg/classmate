interface ModerationResult {
  safe: boolean
  toxicity_score: number
  spam_score: number
  categories: string[]
  action: 'approve' | 'warn' | 'block'
  reason: string
}

const FAIL_CLOSED: ModerationResult = {
  safe: false,
  toxicity_score: 0,
  spam_score: 0,
  categories: [],
  action: 'block',
  reason: 'Moderation service unavailable — content blocked for safety',
}

const MAX_CONTENT_LENGTH = 10_000

export async function moderateContent(content: string): Promise<ModerationResult> {
  if (!content || typeof content !== 'string') return FAIL_CLOSED

  const trimmedContent = content.slice(0, MAX_CONTENT_LENGTH)

  try {
    const response = await fetch('https://ollama.csbihub.id/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama3.1:8b',
        messages: [
          {
            role: 'system',
            content: `You are a content moderation AI for a student community platform. Analyze the provided content and return ONLY a JSON object with this exact structure:
{
  "safe": true/false,
  "toxicity_score": 0-100,
  "spam_score": 0-100,
  "categories": ["category1", "category2"],
  "action": "approve"|"warn"|"block",
  "reason": "brief explanation"
}

Categories can include: harassment, hate_speech, spam, off_topic, inappropriate, sexual_content, violence, self_harm.
- action "approve": safe content (toxicity < 30, spam < 40)
- action "warn": borderline content (toxicity 30-60, spam 40-70)
- action "block": unsafe content (toxicity > 60, spam > 70)`,
          },
          {
            role: 'user',
            content: `Analyze this content:\n\n${trimmedContent}`,
          },
        ],
        temperature: 0.3,
      }),
    })

    if (!response.ok) {
      return FAIL_CLOSED
    }

    const data = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>
    }
    const aiResponse = data.choices?.[0]?.message?.content

    if (!aiResponse) {
      return FAIL_CLOSED
    }

    // Extract JSON from markdown code blocks if present
    const jsonMatch = aiResponse.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/)
    const jsonString = jsonMatch?.[1] ?? aiResponse
    const parsed = JSON.parse(jsonString) as Record<string, unknown>

    // Validate that the required action field is a known value
    if (!['approve', 'warn', 'block'].includes(parsed.action as string)) {
      return FAIL_CLOSED
    }

    return parsed as unknown as ModerationResult
  } catch {
    return FAIL_CLOSED
  }
}

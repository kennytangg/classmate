import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { checkRateLimit, getClientIp, moderationLimiter } from '@/lib/rate-limit'
import { moderateContentSchema } from '@/lib/schemas'
import { zodErrorToString } from '@/lib/errors'

export async function POST(req: NextRequest) {
  try {
    // Verify user is authenticated
    const user = await getSession()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const identifier = user.id ?? getClientIp(req)
    const limited = await checkRateLimit(identifier, moderationLimiter)
    if (limited) return limited

    const parsed = moderateContentSchema.safeParse(await req.json())
    if (!parsed.success) {
      return NextResponse.json({ error: zodErrorToString(parsed.error) }, { status: 400 })
    }
    const { content } = parsed.data

    // Use Ollama to analyze content for moderation
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
            content: `Analyze this content:\n\n${content}`,
          },
        ],
        temperature: 0.3,
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      return NextResponse.json(
        { error: `Ollama API error: ${errorText}` },
        { status: response.status }
      )
    }

    const data = await response.json()
    const aiResponse = data.choices[0]?.message?.content

    if (!aiResponse) {
      return NextResponse.json({ error: 'No response from AI' }, { status: 500 })
    }

    // Parse the JSON response from the AI
    let moderationResult
    try {
      // Extract JSON from markdown code blocks if present
      const jsonMatch = aiResponse.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/)
      const jsonString = jsonMatch ? jsonMatch[1] : aiResponse
      moderationResult = JSON.parse(jsonString)
    } catch {
      // Fail closed — a parse failure must not silently approve content
      return NextResponse.json(
        { error: 'Unable to parse moderation result from AI' },
        { status: 502 }
      )
    }

    return NextResponse.json(moderationResult, { status: 200 })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

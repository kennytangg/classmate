import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { aiLimiter, checkRateLimit } from '@/lib/rate-limit'
import { summarizeSchema } from '@/lib/schemas'
import { zodErrorToString } from '@/lib/errors'

export async function POST(req: NextRequest) {
  try {
    const user = await getSession()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const limited = await checkRateLimit(user.id, aiLimiter)
    if (limited) return limited

    const parsed = summarizeSchema.safeParse(await req.json())
    if (!parsed.success) {
      return NextResponse.json({ error: zodErrorToString(parsed.error) }, { status: 400 })
    }
    const { thread } = parsed.data

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
            content:
              'You are a discussion summarizer for a student community platform. Summarize the provided thread in 2-3 clear, concise sentences. Focus on the main topic, key points discussed, and any conclusions or questions raised. Be objective and factual.',
          },
          {
            role: 'user',
            content: `Summarize this discussion thread:\n\n${thread}`,
          },
        ],
        temperature: 0.5,
        max_tokens: 200,
      }),
    })

    if (!response.ok) {
      console.error(
        '[POST /api/summarize] Ollama API error:',
        response.status,
        await response.text()
      )
      return NextResponse.json({ error: 'Summarization service unavailable' }, { status: 502 })
    }

    const data = await response.json()
    const summary = data.choices[0]?.message?.content

    if (!summary) {
      return NextResponse.json({ error: 'Summarization service unavailable' }, { status: 502 })
    }

    return NextResponse.json({ summary }, { status: 200 })
  } catch (error) {
    console.error('[POST /api/summarize]', error)
    return NextResponse.json({ error: 'Summarization failed' }, { status: 500 })
  }
}

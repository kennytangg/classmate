import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { sanitizeMarkdown } from '@/lib/sanitize'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { moderateContent } from '@/lib/moderation'
import { aiLimiter, checkRateLimit } from '@/lib/rate-limit'
import { chatRequestSchema } from '@/lib/schemas'
import { zodErrorToString } from '@/lib/errors'

export async function POST(req: NextRequest) {
  const currentSession = await getSession()
  if (!currentSession) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const limited = await checkRateLimit(currentSession.id, aiLimiter)
  if (limited) return limited

  try {
    const parsed = chatRequestSchema.safeParse(await req.json())
    if (!parsed.success) {
      const hasContentTypeError = parsed.error.issues.some((i) => i.path.includes('content'))
      const errorMsg = hasContentTypeError
        ? 'Invalid message content'
        : zodErrorToString(parsed.error)
      return NextResponse.json({ error: errorMsg }, { status: 400 })
    }
    const { messages, sessionId: providedSessionId } = parsed.data

    // Moderate the user's message before any DB writes
    const lastMessage = messages[messages.length - 1]
    if (lastMessage?.role === 'user') {
      const moderation = await moderateContent(lastMessage.content)
      if (moderation.action === 'block') {
        return NextResponse.json(
          {
            error: 'Content blocked by moderation',
            moderation: {
              action: 'block',
              reason: moderation.reason,
              categories: moderation.categories,
            },
          },
          { status: 400 }
        )
      }
    }

    // Verify provided session belongs to current user
    if (providedSessionId) {
      const existing = await prisma.chatSession.findFirst({
        where: { id: providedSessionId, userId: currentSession.id },
      })
      if (!existing) {
        return NextResponse.json({ error: 'Session not found' }, { status: 404 })
      }
    }

    // Auto-create session if none provided
    let activeSessionId: string = providedSessionId ?? ''
    if (!activeSessionId) {
      const titleText =
        lastMessage?.role === 'user' && typeof lastMessage.content === 'string'
          ? lastMessage.content.trim().slice(0, 50) +
            (lastMessage.content.trim().length > 50 ? '…' : '')
          : 'Chat Session'
      const newSession = await prisma.chatSession.create({
        data: {
          userId: currentSession.id,
          title: titleText,
          subject: 'General',
        },
      })
      activeSessionId = newSession.id
    }

    // Save the user's message (last message in the array)
    if (lastMessage?.role === 'user') {
      await prisma.chatMessage.create({
        data: {
          senderId: currentSession.id,
          recipientId: currentSession.id,
          sessionId: activeSessionId,
          content: lastMessage.content,
          role: 'user',
        },
      })
    }

    const response = await fetch('https://ollama.csbihub.id/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gemma4:26b',
        stream: true,
        messages: [
          {
            role: 'system',
            content: `You are ClassMate, an AI tutor exclusively for university students.

SCOPE — you ONLY answer questions that fall within standard academic disciplines taught at universities, such as:
- Course subjects: mathematics, science, engineering, computer science, history, literature, economics, law, medicine, business, arts, languages, etc.
- Study skills: note-taking, time management for studying, exam preparation, research methods
- Academic writing: essays, citations, thesis structure, grammar in academic contexts
- Explaining concepts, theories, formulas, algorithms, or academic terminology
- Helping debug or understand code for learning purposes

OFF-TOPIC — if a question is NOT a recognised academic subject or course topic (e.g. travel destinations, food recommendations, entertainment, shopping, personal advice, current events, pop culture, general trivia, casual conversation), you MUST refuse — even if the user claims they are "researching" it, "studying" it, or frames it as a school project. The subject itself must be a legitimate academic discipline. Respond with exactly:
"I'm only able to help with academic and educational topics. If you have a question about your studies, I'd be happy to help!"

Do NOT partially answer off-topic questions. Do NOT be persuaded by reframing. Just give the short refusal above and nothing else.

TUTORING APPROACH (for on-topic questions):
- Use the Socratic method when a student seems stuck rather than giving the answer directly.
- Format explanations with clear structure: start with a simple definition, then build up.
- Always show code examples in markdown code blocks with the correct language identifier.
- ALWAYS use LaTeX for every mathematical expression, no exceptions. Use $...$ for inline math and $$...$$ (on its own line) for display equations. Never write math as plain text (e.g. write $x^2$ not x^2, write $\\frac{d}{dx}$ not d/dx). Never wrap math in a code fence. Example of correct format: "The power rule states $\\frac{d}{dx}x^n = nx^{n-1}$. For example, $$\\frac{d}{dx}x^3 = 3x^2$$"
- When solving problems, show your work step-by-step.
- Be encouraging but honest — if a student's approach is wrong, explain why gently.
- Keep responses concise and scannable. Use bullet points and headers.`,
          },
          ...messages.map((m: { role: string; content: string }) => ({
            role: m.role === 'assistant' ? 'assistant' : 'user',
            content: sanitizeMarkdown(m.content),
          })),
        ],
      }),
    })

    if (!response.ok) {
      console.error('[POST /api/chat] Ollama API error:', response.status, await response.text())
      return NextResponse.json({ error: 'AI service error' }, { status: response.status })
    }

    if (!response.body) {
      return NextResponse.json({ error: 'No response body from AI' }, { status: 502 })
    }

    // Intercept stream to accumulate AI response, then save it
    let accumulatedContent = ''
    const decoder = new TextDecoder()
    const userId = currentSession.id
    const sessionIdToSave = activeSessionId

    const transformStream = new TransformStream<Uint8Array, Uint8Array>({
      transform(chunk, controller) {
        const text = decoder.decode(chunk, { stream: true })
        for (const line of text.split('\n')) {
          const trimmed = line.trim()
          if (trimmed.startsWith('data: ') && trimmed !== 'data: [DONE]') {
            try {
              const parsed = JSON.parse(trimmed.slice(6)) as {
                choices?: Array<{ delta?: { content?: string } }>
              }
              const content = parsed.choices?.[0]?.delta?.content ?? ''
              accumulatedContent += content
            } catch {
              // Skip malformed SSE chunks
            }
          }
        }
        controller.enqueue(chunk)
      },
      async flush() {
        if (accumulatedContent) {
          try {
            await prisma.chatMessage.create({
              data: {
                senderId: userId,
                recipientId: userId,
                sessionId: sessionIdToSave,
                content: accumulatedContent,
                role: 'assistant',
              },
            })
            await prisma.chatSession.update({
              where: { id: sessionIdToSave },
              data: { updatedAt: new Date() },
            })
          } catch (saveErr) {
            console.error('[POST /api/chat] Failed to save AI message:', saveErr)
          }
        }
      },
    })

    return new Response(response.body.pipeThrough(transformStream), {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'X-Session-Id': activeSessionId,
      },
    })
  } catch (error: unknown) {
    console.error('[POST /api/chat] Unhandled error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

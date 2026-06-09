import { POST } from '@/app/api/summarize/route'
import { getSession } from '@/lib/auth'
import { NextRequest } from 'next/server'

// Mock the auth module
jest.mock('@/lib/auth', () => ({
  getSession: jest.fn(),
}))

// Mock fetch for Ollama API
global.fetch = jest.fn()

describe('POST /api/summarize', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should return 401 if user is not authenticated', async () => {
    ;(getSession as jest.Mock).mockResolvedValue(null)

    const req = new NextRequest('http://localhost:3000/api/summarize', {
      method: 'POST',
      body: JSON.stringify({ thread: 'test thread content' }),
    })

    const response = await POST(req)
    const data = await response.json()

    expect(response.status).toBe(401)
    expect(data.error).toBe('Unauthorized')
  })

  it('should return 400 if thread content is missing', async () => {
    ;(getSession as jest.Mock).mockResolvedValue({ id: 'user123', email: 'test@example.com' })

    const req = new NextRequest('http://localhost:3000/api/summarize', {
      method: 'POST',
      body: JSON.stringify({}),
    })

    const response = await POST(req)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('thread content required')
  })

  it('should return summary for valid thread content', async () => {
    ;(getSession as jest.Mock).mockResolvedValue({ id: 'user123', email: 'test@example.com' })
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({
        choices: [
          {
            message: {
              content:
                'This discussion thread covers calculus homework problems. Students are asking about derivative rules and integration techniques. The main conclusion is that practice problems are essential for mastering these concepts.',
            },
          },
        ],
      }),
    })

    const threadContent = `
    User1: Can someone explain the chain rule in calculus?
    User2: Sure! The chain rule is used when you have a composition of functions...
    User3: Thanks! That helps a lot. How about integration by parts?
    User2: Integration by parts is based on the product rule...
    User1: Got it! Practice problems really help with understanding.
    `

    const req = new NextRequest('http://localhost:3000/api/summarize', {
      method: 'POST',
      body: JSON.stringify({ thread: threadContent }),
    })

    const response = await POST(req)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.summary).toBeDefined()
    expect(typeof data.summary).toBe('string')
    expect(data.summary.length).toBeGreaterThan(0)
  })

  it('should handle long discussion threads', async () => {
    ;(getSession as jest.Mock).mockResolvedValue({ id: 'user123', email: 'test@example.com' })
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({
        choices: [
          {
            message: {
              content:
                'This extensive discussion explores multiple topics in computer science. The main points include data structures, algorithm complexity, and best practices for code optimization.',
            },
          },
        ],
      }),
    })

    const longThread = Array(50)
      .fill('User: This is a message about computer science topics.')
      .join('\n')

    const req = new NextRequest('http://localhost:3000/api/summarize', {
      method: 'POST',
      body: JSON.stringify({ thread: longThread }),
    })

    const response = await POST(req)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.summary).toBeDefined()
  })

  it('should handle Ollama API errors gracefully', async () => {
    ;(getSession as jest.Mock).mockResolvedValue({ id: 'user123', email: 'test@example.com' })
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      status: 500,
      text: async () => 'Ollama API error',
    })

    const req = new NextRequest('http://localhost:3000/api/summarize', {
      method: 'POST',
      body: JSON.stringify({ thread: 'test thread' }),
    })

    const response = await POST(req)
    const data = await response.json()

    expect(response.status).toBeGreaterThanOrEqual(400)
    expect(data.error).toBeDefined()
  })

  it('should handle empty AI response', async () => {
    ;(getSession as jest.Mock).mockResolvedValue({ id: 'user123', email: 'test@example.com' })
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({
        choices: [
          {
            message: {
              content: '',
            },
          },
        ],
      }),
    })

    const req = new NextRequest('http://localhost:3000/api/summarize', {
      method: 'POST',
      body: JSON.stringify({ thread: 'test thread' }),
    })

    const response = await POST(req)
    const data = await response.json()

    expect(response.status).toBe(502)
    expect(data.error).toBe('Summarization service unavailable')
  })

  it('should handle network errors', async () => {
    ;(getSession as jest.Mock).mockResolvedValue({ id: 'user123', email: 'test@example.com' })
    ;(global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'))

    const req = new NextRequest('http://localhost:3000/api/summarize', {
      method: 'POST',
      body: JSON.stringify({ thread: 'test thread' }),
    })

    const response = await POST(req)
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.error).toBe('Summarization failed')
  })
})

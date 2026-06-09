import { POST } from '@/app/api/moderation/route'
import { getSession } from '@/lib/auth'
import { NextRequest } from 'next/server'

// Mock the auth module
jest.mock('@/lib/auth', () => ({
  getSession: jest.fn(),
}))

// Mock fetch for Ollama API
global.fetch = jest.fn()

describe('POST /api/moderation', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should return 401 if user is not authenticated', async () => {
    ;(getSession as jest.Mock).mockResolvedValue(null)

    const req = new NextRequest('http://localhost:3000/api/moderation', {
      method: 'POST',
      body: JSON.stringify({ content: 'test content' }),
    })

    const response = await POST(req)
    const data = await response.json()

    expect(response.status).toBe(401)
    expect(data.error).toBe('Unauthorized')
  })

  it('should return 400 if content is missing', async () => {
    ;(getSession as jest.Mock).mockResolvedValue({ id: 'user123', email: 'test@example.com' })

    const req = new NextRequest('http://localhost:3000/api/moderation', {
      method: 'POST',
      body: JSON.stringify({}),
    })

    const response = await POST(req)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('content required')
  })

  it('should return moderation result for clean content', async () => {
    ;(getSession as jest.Mock).mockResolvedValue({ id: 'user123', email: 'test@example.com' })
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({
        choices: [
          {
            message: {
              content: JSON.stringify({
                safe: true,
                toxicity_score: 5,
                spam_score: 10,
                categories: [],
                action: 'approve',
                reason: 'Content is safe',
              }),
            },
          },
        ],
      }),
    })

    const req = new NextRequest('http://localhost:3000/api/moderation', {
      method: 'POST',
      body: JSON.stringify({ content: 'This is a helpful study question about calculus.' }),
    })

    const response = await POST(req)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.safe).toBe(true)
    expect(data.action).toBe('approve')
    expect(data.toxicity_score).toBeLessThan(30)
  })

  it('should return moderation result for toxic content', async () => {
    ;(getSession as jest.Mock).mockResolvedValue({ id: 'user123', email: 'test@example.com' })
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({
        choices: [
          {
            message: {
              content: JSON.stringify({
                safe: false,
                toxicity_score: 85,
                spam_score: 20,
                categories: ['harassment', 'hate_speech'],
                action: 'block',
                reason: 'Content contains harassment and hate speech',
              }),
            },
          },
        ],
      }),
    })

    const req = new NextRequest('http://localhost:3000/api/moderation', {
      method: 'POST',
      body: JSON.stringify({ content: 'Offensive toxic content that should be blocked' }),
    })

    const response = await POST(req)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.safe).toBe(false)
    expect(data.action).toBe('block')
    expect(data.toxicity_score).toBeGreaterThan(60)
    expect(data.categories).toContain('harassment')
  })

  it('should return moderation result with warning for borderline content', async () => {
    ;(getSession as jest.Mock).mockResolvedValue({ id: 'user123', email: 'test@example.com' })
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({
        choices: [
          {
            message: {
              content: JSON.stringify({
                safe: false,
                toxicity_score: 45,
                spam_score: 50,
                categories: ['spam'],
                action: 'warn',
                reason: 'Content may be spam or off-topic',
              }),
            },
          },
        ],
      }),
    })

    const req = new NextRequest('http://localhost:3000/api/moderation', {
      method: 'POST',
      body: JSON.stringify({ content: 'Buy this product now! Limited time offer!' }),
    })

    const response = await POST(req)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.action).toBe('warn')
    expect(data.toxicity_score).toBeGreaterThanOrEqual(30)
    expect(data.toxicity_score).toBeLessThanOrEqual(60)
  })

  it('should handle Ollama API errors gracefully', async () => {
    ;(getSession as jest.Mock).mockResolvedValue({ id: 'user123', email: 'test@example.com' })
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      status: 500,
      text: async () => 'Ollama API error',
    })

    const req = new NextRequest('http://localhost:3000/api/moderation', {
      method: 'POST',
      body: JSON.stringify({ content: 'test content' }),
    })

    const response = await POST(req)
    const data = await response.json()

    expect(response.status).toBeGreaterThanOrEqual(400)
    expect(data.error).toBeDefined()
  })

  it('should handle very long content without crashing', async () => {
    ;(getSession as jest.Mock).mockResolvedValue({ id: 'user123', email: 'test@example.com' })
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({
        choices: [
          {
            message: {
              content: JSON.stringify({
                safe: true,
                toxicity_score: 5,
                spam_score: 5,
                categories: [],
                action: 'approve',
                reason: 'Content is safe',
              }),
            },
          },
        ],
      }),
    })

    const longContent = 'A'.repeat(6000)
    const req = new NextRequest('http://localhost:3000/api/moderation', {
      method: 'POST',
      body: JSON.stringify({ content: longContent }),
    })

    const response = await POST(req)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.action).toBe('approve')
  })

  it('should handle malformed JSON from AI gracefully', async () => {
    ;(getSession as jest.Mock).mockResolvedValue({ id: 'user123', email: 'test@example.com' })
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({
        choices: [
          {
            message: {
              content: 'This is not valid JSON',
            },
          },
        ],
      }),
    })

    const req = new NextRequest('http://localhost:3000/api/moderation', {
      method: 'POST',
      body: JSON.stringify({ content: 'test content' }),
    })

    const response = await POST(req)
    const data = await response.json()

    // Fail closed — parse failure returns 502, not a silent approve
    expect(response.status).toBe(502)
    expect(data.error).toBeDefined()
  })
})

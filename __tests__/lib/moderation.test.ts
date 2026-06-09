/**
 * lib/moderation.ts — Unit tests for the moderateContent() function
 *
 * Verifies:
 * - Clean content → approve
 * - Toxic content → block
 * - Borderline content → warn
 * - Ollama API failure → fail-closed (block)
 * - Network error → fail-closed (block)
 * - Malformed JSON response → fail-closed (block)
 * - JSON wrapped in markdown code block → parses correctly
 */

import { moderateContent } from '@/lib/moderation'

const mockFetch = jest.fn()
global.fetch = mockFetch

const ORIGINAL_ENV = process.env

beforeEach(() => {
  jest.resetModules()
  process.env = { ...ORIGINAL_ENV }
  mockFetch.mockReset()
})

afterEach(() => {
  process.env = ORIGINAL_ENV
})

function mockOllamaResponse(payload: object) {
  mockFetch.mockResolvedValueOnce({
    ok: true,
    json: async () => ({
      choices: [{ message: { content: JSON.stringify(payload) } }],
    }),
  })
}

function mockOllamaError(status = 500) {
  mockFetch.mockResolvedValueOnce({ ok: false, status })
}

// ─── Clean content ────────────────────────────────────────────────────────────

describe('moderateContent — clean content', () => {
  it('returns approve for safe content', async () => {
    mockOllamaResponse({
      safe: true,
      toxicity_score: 5,
      spam_score: 2,
      categories: [],
      action: 'approve',
      reason: 'Content is safe',
    })

    const result = await moderateContent('Can someone help me with calculus?')
    expect(result.action).toBe('approve')
    expect(result.safe).toBe(true)
  })
})

// ─── Toxic content ────────────────────────────────────────────────────────────

describe('moderateContent — toxic content', () => {
  it('returns block for highly toxic content', async () => {
    mockOllamaResponse({
      safe: false,
      toxicity_score: 90,
      spam_score: 10,
      categories: ['harassment', 'hate_speech'],
      action: 'block',
      reason: 'Contains hate speech',
    })

    const result = await moderateContent('Some hate-filled content here')
    expect(result.action).toBe('block')
    expect(result.safe).toBe(false)
    expect(result.categories).toContain('hate_speech')
  })
})

// ─── Borderline content ───────────────────────────────────────────────────────

describe('moderateContent — borderline content', () => {
  it('returns warn for borderline content', async () => {
    mockOllamaResponse({
      safe: true,
      toxicity_score: 45,
      spam_score: 55,
      categories: ['off_topic'],
      action: 'warn',
      reason: 'Borderline spam',
    })

    const result = await moderateContent('Buy my tutoring service, best prices')
    expect(result.action).toBe('warn')
    expect(result.categories).toContain('off_topic')
  })
})

// ─── Failure handling — fail-closed ───────────────────────────────────────────

describe('moderateContent — fail-closed on error', () => {
  it('returns block when Ollama API returns non-ok status', async () => {
    mockOllamaError(503)

    const result = await moderateContent('Normal content')
    expect(result.action).toBe('block')
    expect(result.safe).toBe(false)
  })

  it('returns block when fetch throws a network error', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network failure'))

    const result = await moderateContent('Normal content')
    expect(result.action).toBe('block')
    expect(result.safe).toBe(false)
  })

  it('returns block when Ollama returns no choices', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ choices: [] }),
    })

    const result = await moderateContent('Normal content')
    expect(result.action).toBe('block')
  })

  it('returns block when AI response is invalid JSON', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        choices: [{ message: { content: 'not valid json at all' } }],
      }),
    })

    const result = await moderateContent('Normal content')
    expect(result.action).toBe('block')
  })

  it('returns block when AI returns valid JSON but missing action field', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        choices: [{ message: { content: JSON.stringify({ result: 'ok', safe: true }) } }],
      }),
    })

    const result = await moderateContent('Normal content')
    expect(result.action).toBe('block')
  })

  it('returns block when AI returns valid JSON with unrecognised action value', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        choices: [
          {
            message: {
              content: JSON.stringify({ action: 'allow', safe: true, toxicity_score: 0 }),
            },
          },
        ],
      }),
    })

    const result = await moderateContent('Normal content')
    expect(result.action).toBe('block')
  })

  it('returns block when Ollama is unreachable (network error)', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network failure'))

    const result = await moderateContent('Normal content')
    expect(result.action).toBe('block')
  })
})

// ─── JSON in markdown code block ─────────────────────────────────────────────

describe('moderateContent — markdown-wrapped JSON', () => {
  it('parses JSON inside markdown code block', async () => {
    const payload = {
      safe: true,
      toxicity_score: 5,
      spam_score: 2,
      categories: [],
      action: 'approve',
      reason: 'Safe content',
    }

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        choices: [
          {
            message: {
              content: `\`\`\`json\n${JSON.stringify(payload)}\n\`\`\``,
            },
          },
        ],
      }),
    })

    const result = await moderateContent('How do I solve integrals?')
    expect(result.action).toBe('approve')
    expect(result.safe).toBe(true)
  })

  it('parses JSON inside plain markdown code block (no language tag)', async () => {
    const payload = {
      safe: false,
      toxicity_score: 80,
      spam_score: 5,
      categories: ['violence'],
      action: 'block',
      reason: 'Violent content',
    }

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        choices: [
          {
            message: {
              content: `\`\`\`\n${JSON.stringify(payload)}\n\`\`\``,
            },
          },
        ],
      }),
    })

    const result = await moderateContent('Violent content example')
    expect(result.action).toBe('block')
  })
})

// ─── Ollama request shape ─────────────────────────────────────────────────────

describe('moderateContent — Ollama API call', () => {
  it('sends request to Ollama with correct model', async () => {
    mockOllamaResponse({
      safe: true,
      toxicity_score: 0,
      spam_score: 0,
      categories: [],
      action: 'approve',
      reason: 'Safe',
    })

    await moderateContent('test content')

    expect(mockFetch).toHaveBeenCalledTimes(1)
    const [url, options] = mockFetch.mock.calls[0] as [string, RequestInit]
    expect(url).toBe('https://ollama.csbihub.id/v1/chat/completions')
    const body = JSON.parse(options.body as string) as { model: string }
    expect(body.model).toBe('llama3.1:8b')
  })
})

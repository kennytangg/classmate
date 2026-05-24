import { NextRequest } from 'next/server'
import { GET, PATCH, DELETE } from '@/app/api/materials/[id]/route'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

jest.mock('@/lib/auth', () => ({ getSession: jest.fn() }))
jest.mock('@/lib/prisma')
jest.mock('@/lib/sanitize', () => ({
  sanitizeText: jest.fn((v: string) => v?.trim() || ''),
  sanitizeMarkdown: jest.fn((v: string) => v?.trim() || ''),
}))

afterEach(() => {
  jest.clearAllMocks()
})

const MOCK_MATERIAL = {
  id: 'material-1',
  title: 'Test Notes',
  description: 'Great notes',
  fileUrl: 'https://example.com/file.pdf',
  userId: 'user-1',
  user: {
    id: 'user-1',
    email: 'u1@test.com',
    profile: { displayName: 'User 1', avatarUrl: null },
  },
}

// ---------------------------------------------------------------------------
// GET /api/materials/[id]
// ---------------------------------------------------------------------------

describe('GET /api/materials/[id]', () => {
  it('returns 200 with the material when it exists', async () => {
    ;(prisma.studyMaterial.findUnique as jest.Mock).mockResolvedValue(MOCK_MATERIAL)

    const req = new NextRequest('http://localhost/api/materials/material-1')
    const res = await GET(req, { params: Promise.resolve({ id: 'material-1' }) })

    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.material).toEqual(MOCK_MATERIAL)
  })

  it('returns 404 when the material does not exist', async () => {
    ;(prisma.studyMaterial.findUnique as jest.Mock).mockResolvedValue(null)

    const req = new NextRequest('http://localhost/api/materials/nonexistent')
    const res = await GET(req, { params: Promise.resolve({ id: 'nonexistent' }) })

    expect(res.status).toBe(404)
    const data = await res.json()
    expect(data.error).toMatch(/not found/i)
  })

  it('calls findUnique with the correct id', async () => {
    ;(prisma.studyMaterial.findUnique as jest.Mock).mockResolvedValue(MOCK_MATERIAL)

    const req = new NextRequest('http://localhost/api/materials/material-1')
    await GET(req, { params: Promise.resolve({ id: 'material-1' }) })

    expect(prisma.studyMaterial.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'material-1' } })
    )
  })
})

// ---------------------------------------------------------------------------
// PATCH /api/materials/[id]
// ---------------------------------------------------------------------------

describe('PATCH /api/materials/[id]', () => {
  it('returns 401 when unauthenticated', async () => {
    ;(getSession as jest.Mock).mockResolvedValue(null)

    const req = new NextRequest('http://localhost/api/materials/material-1', {
      method: 'PATCH',
      body: JSON.stringify({ title: 'New Title' }),
      headers: { 'Content-Type': 'application/json' },
    })
    const res = await PATCH(req, { params: Promise.resolve({ id: 'material-1' }) })

    expect(res.status).toBe(401)
    const data = await res.json()
    expect(data.error).toMatch(/unauthorized/i)
  })

  it('returns 404 when material does not exist', async () => {
    ;(getSession as jest.Mock).mockResolvedValue({ id: 'user-1', email: 'u1@test.com' })
    ;(prisma.studyMaterial.findUnique as jest.Mock).mockResolvedValue(null)

    const req = new NextRequest('http://localhost/api/materials/nonexistent', {
      method: 'PATCH',
      body: JSON.stringify({ title: 'New Title' }),
      headers: { 'Content-Type': 'application/json' },
    })
    const res = await PATCH(req, { params: Promise.resolve({ id: 'nonexistent' }) })

    expect(res.status).toBe(404)
    const data = await res.json()
    expect(data.error).toMatch(/not found/i)
  })

  it('returns 403 when user is not owner and not admin', async () => {
    ;(getSession as jest.Mock).mockResolvedValue({ id: 'user-2', email: 'u2@test.com' })
    ;(prisma.studyMaterial.findUnique as jest.Mock).mockResolvedValue({ userId: 'user-1' })
    ;(prisma.user.findUnique as jest.Mock).mockResolvedValue({ role: 'STUDENT' })

    const req = new NextRequest('http://localhost/api/materials/material-1', {
      method: 'PATCH',
      body: JSON.stringify({ title: 'Hacked Title' }),
      headers: { 'Content-Type': 'application/json' },
    })
    const res = await PATCH(req, { params: Promise.resolve({ id: 'material-1' }) })

    expect(res.status).toBe(403)
    const data = await res.json()
    expect(data.error).toMatch(/not authorized/i)
  })

  it('returns 200 with updated material for owner', async () => {
    const updatedMaterial = { ...MOCK_MATERIAL, title: 'New Title' }
    ;(getSession as jest.Mock).mockResolvedValue({ id: 'user-1', email: 'u1@test.com' })
    ;(prisma.studyMaterial.findUnique as jest.Mock).mockResolvedValue({ userId: 'user-1' })
    ;(prisma.studyMaterial.update as jest.Mock).mockResolvedValue(updatedMaterial)

    const req = new NextRequest('http://localhost/api/materials/material-1', {
      method: 'PATCH',
      body: JSON.stringify({ title: 'New Title' }),
      headers: { 'Content-Type': 'application/json' },
    })
    const res = await PATCH(req, { params: Promise.resolve({ id: 'material-1' }) })

    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.material).toEqual(updatedMaterial)
  })

  it('returns 200 when admin edits another user material', async () => {
    const updatedMaterial = { ...MOCK_MATERIAL, title: 'Admin Updated' }
    ;(getSession as jest.Mock).mockResolvedValue({ id: 'admin-1', email: 'admin@test.com' })
    ;(prisma.studyMaterial.findUnique as jest.Mock).mockResolvedValue({ userId: 'user-1' })
    ;(prisma.user.findUnique as jest.Mock).mockResolvedValue({ role: 'ADMIN' })
    ;(prisma.studyMaterial.update as jest.Mock).mockResolvedValue(updatedMaterial)

    const req = new NextRequest('http://localhost/api/materials/material-1', {
      method: 'PATCH',
      body: JSON.stringify({ title: 'Admin Updated' }),
      headers: { 'Content-Type': 'application/json' },
    })
    const res = await PATCH(req, { params: Promise.resolve({ id: 'material-1' }) })

    expect(res.status).toBe(200)
  })

  it('returns 400 when body contains no valid fields', async () => {
    ;(getSession as jest.Mock).mockResolvedValue({ id: 'user-1', email: 'u1@test.com' })
    ;(prisma.studyMaterial.findUnique as jest.Mock).mockResolvedValue({ userId: 'user-1' })

    const req = new NextRequest('http://localhost/api/materials/material-1', {
      method: 'PATCH',
      body: JSON.stringify({ unknownField: 'value' }),
      headers: { 'Content-Type': 'application/json' },
    })
    const res = await PATCH(req, { params: Promise.resolve({ id: 'material-1' }) })

    expect(res.status).toBe(400)
    const data = await res.json()
    expect(data.error).toMatch(/no valid fields/i)
  })

  it('returns 400 when title sanitizes to empty string (whitespace only)', async () => {
    ;(getSession as jest.Mock).mockResolvedValue({ id: 'user-1', email: 'u1@test.com' })
    ;(prisma.studyMaterial.findUnique as jest.Mock).mockResolvedValue({ userId: 'user-1' })

    const req = new NextRequest('http://localhost/api/materials/material-1', {
      method: 'PATCH',
      body: JSON.stringify({ title: '   ' }),
      headers: { 'Content-Type': 'application/json' },
    })
    const res = await PATCH(req, { params: Promise.resolve({ id: 'material-1' }) })

    expect(res.status).toBe(400)
    const data = await res.json()
    expect(data.error).toMatch(/valid text/i)
  })

  it('returns 500 with a generic message when the database throws', async () => {
    ;(getSession as jest.Mock).mockResolvedValue({ id: 'user-1', email: 'u1@test.com' })
    ;(prisma.studyMaterial.findUnique as jest.Mock).mockResolvedValue({ userId: 'user-1' })
    ;(prisma.studyMaterial.update as jest.Mock).mockRejectedValue(
      new Error('Connection string: postgres://user:secret@db.internal/prod')
    )

    const req = new NextRequest('http://localhost/api/materials/material-1', {
      method: 'PATCH',
      body: JSON.stringify({ title: 'Valid Title' }),
      headers: { 'Content-Type': 'application/json' },
    })
    const res = await PATCH(req, { params: Promise.resolve({ id: 'material-1' }) })

    expect(res.status).toBe(500)
    const data = await res.json()
    expect(data.error).toBe('Failed to update material')
    expect(data.error).not.toMatch(/postgres|secret|db\.internal/i)
  })

  it('updates title and description when both provided', async () => {
    const updatedMaterial = { ...MOCK_MATERIAL, title: 'T', description: 'D' }
    ;(getSession as jest.Mock).mockResolvedValue({ id: 'user-1', email: 'u1@test.com' })
    ;(prisma.studyMaterial.findUnique as jest.Mock).mockResolvedValue({ userId: 'user-1' })
    ;(prisma.studyMaterial.update as jest.Mock).mockResolvedValue(updatedMaterial)

    const req = new NextRequest('http://localhost/api/materials/material-1', {
      method: 'PATCH',
      body: JSON.stringify({ title: 'T', description: 'D' }),
      headers: { 'Content-Type': 'application/json' },
    })
    const res = await PATCH(req, { params: Promise.resolve({ id: 'material-1' }) })

    expect(res.status).toBe(200)
    expect(prisma.studyMaterial.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ title: 'T', description: 'D' }),
      })
    )
  })

  it('allows empty string description (sets to null via sanitizeText returning empty)', async () => {
    // description is optional and can be cleared; empty string becomes null per route logic
    const updatedMaterial = { ...MOCK_MATERIAL, description: null }
    ;(getSession as jest.Mock).mockResolvedValue({ id: 'user-1', email: 'u1@test.com' })
    ;(prisma.studyMaterial.findUnique as jest.Mock).mockResolvedValue({ userId: 'user-1' })
    ;(prisma.studyMaterial.update as jest.Mock).mockResolvedValue(updatedMaterial)

    const req = new NextRequest('http://localhost/api/materials/material-1', {
      method: 'PATCH',
      body: JSON.stringify({ description: '' }),
      headers: { 'Content-Type': 'application/json' },
    })
    const res = await PATCH(req, { params: Promise.resolve({ id: 'material-1' }) })

    expect(res.status).toBe(200)
    expect(prisma.studyMaterial.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ description: null }),
      })
    )
  })
})

// ---------------------------------------------------------------------------
// DELETE /api/materials/[id]
// ---------------------------------------------------------------------------

describe('DELETE /api/materials/[id]', () => {
  it('returns 401 when unauthenticated', async () => {
    ;(getSession as jest.Mock).mockResolvedValue(null)

    const req = new NextRequest('http://localhost/api/materials/material-1', {
      method: 'DELETE',
    })
    const res = await DELETE(req, { params: Promise.resolve({ id: 'material-1' }) })

    expect(res.status).toBe(401)
    const data = await res.json()
    expect(data.error).toMatch(/unauthorized/i)
  })

  it('returns 404 when material does not exist', async () => {
    ;(getSession as jest.Mock).mockResolvedValue({ id: 'user-1', email: 'u1@test.com' })
    ;(prisma.studyMaterial.findUnique as jest.Mock).mockResolvedValue(null)

    const req = new NextRequest('http://localhost/api/materials/nonexistent', {
      method: 'DELETE',
    })
    const res = await DELETE(req, { params: Promise.resolve({ id: 'nonexistent' }) })

    expect(res.status).toBe(404)
    const data = await res.json()
    expect(data.error).toMatch(/not found/i)
  })

  it('returns 403 when user is not owner and not admin', async () => {
    ;(getSession as jest.Mock).mockResolvedValue({ id: 'user-2', email: 'u2@test.com' })
    ;(prisma.studyMaterial.findUnique as jest.Mock).mockResolvedValue({ userId: 'user-1' })
    ;(prisma.user.findUnique as jest.Mock).mockResolvedValue({ role: 'STUDENT' })

    const req = new NextRequest('http://localhost/api/materials/material-1', {
      method: 'DELETE',
    })
    const res = await DELETE(req, { params: Promise.resolve({ id: 'material-1' }) })

    expect(res.status).toBe(403)
    const data = await res.json()
    expect(data.error).toMatch(/not authorized/i)
  })

  it('returns 200 when owner deletes their material', async () => {
    ;(getSession as jest.Mock).mockResolvedValue({ id: 'user-1', email: 'u1@test.com' })
    ;(prisma.studyMaterial.findUnique as jest.Mock).mockResolvedValue({ userId: 'user-1' })

    const req = new NextRequest('http://localhost/api/materials/material-1', {
      method: 'DELETE',
    })
    const res = await DELETE(req, { params: Promise.resolve({ id: 'material-1' }) })

    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.success).toBe(true)
  })

  it('calls studyMaterial.delete with the correct id', async () => {
    ;(getSession as jest.Mock).mockResolvedValue({ id: 'user-1', email: 'u1@test.com' })
    ;(prisma.studyMaterial.findUnique as jest.Mock).mockResolvedValue({ userId: 'user-1' })

    const req = new NextRequest('http://localhost/api/materials/material-1', {
      method: 'DELETE',
    })
    await DELETE(req, { params: Promise.resolve({ id: 'material-1' }) })

    expect(prisma.studyMaterial.delete).toHaveBeenCalledWith({ where: { id: 'material-1' } })
  })

  it('returns 200 when admin deletes another user material', async () => {
    ;(getSession as jest.Mock).mockResolvedValue({ id: 'admin-1', email: 'admin@test.com' })
    ;(prisma.studyMaterial.findUnique as jest.Mock).mockResolvedValue({ userId: 'user-1' })
    ;(prisma.user.findUnique as jest.Mock).mockResolvedValue({ role: 'ADMIN' })

    const req = new NextRequest('http://localhost/api/materials/material-1', {
      method: 'DELETE',
    })
    const res = await DELETE(req, { params: Promise.resolve({ id: 'material-1' }) })

    expect(res.status).toBe(200)
  })
})

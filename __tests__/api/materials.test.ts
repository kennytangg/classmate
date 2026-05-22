import { Readable } from 'stream'
import { NextRequest } from 'next/server'
import { GET, POST } from '@/app/api/materials/route'
import { POST as downloadPOST } from '@/app/api/materials/[id]/download/route'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { uploadFile } from '@/lib/storage'

jest.mock('@/lib/prisma')
jest.mock('@/lib/auth', () => ({
  getSession: jest.fn(),
}))
jest.mock('@/lib/storage', () => ({
  uploadFile: jest.fn(),
  deleteFile: jest.fn(),
  getFileStream: jest.fn(),
}))

afterEach(() => {
  jest.clearAllMocks()
})

function makeFormData(fields: Record<string, string | File>): FormData {
  const fd = new FormData()
  for (const [key, value] of Object.entries(fields)) {
    fd.append(key, value)
  }
  return fd
}

function makePdfFile(name = 'test.pdf', sizeOverride?: number): File {
  const file = new File(['file-content'], name, { type: 'application/pdf' })
  if (sizeOverride !== undefined) {
    Object.defineProperty(file, 'size', { value: sizeOverride, configurable: true })
  }
  return file
}

describe('/api/materials GET', () => {
  it('returns materials list', async () => {
    ;(getSession as jest.Mock).mockResolvedValue({ id: 'user1' })
    const mockMaterials = [{ id: '1', title: 'Test Material', subject: 'Math' }]
    ;(prisma.studyMaterial.count as jest.Mock).mockResolvedValue(1)
    ;(prisma.studyMaterial.findMany as jest.Mock).mockResolvedValue(mockMaterials)

    const request = new NextRequest('http://localhost/api/materials')
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.materials).toEqual(mockMaterials)
  })

  it('filters by subject', async () => {
    ;(getSession as jest.Mock).mockResolvedValue({ id: 'user1' })
    ;(prisma.studyMaterial.count as jest.Mock).mockResolvedValue(0)
    ;(prisma.studyMaterial.findMany as jest.Mock).mockResolvedValue([])

    const request = new NextRequest('http://localhost/api/materials?subject=Physics')
    await GET(request)

    expect(prisma.studyMaterial.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { subject: 'Physics' },
      })
    )
  })
})

describe('/api/materials POST', () => {
  it('creates material with valid data', async () => {
    ;(getSession as jest.Mock).mockResolvedValue({ id: 'user1' })
    ;(uploadFile as jest.Mock).mockResolvedValue('/uploads/user1/uuid.pdf')
    ;(prisma.studyMaterial.create as jest.Mock).mockResolvedValue({
      id: '1',
      title: 'Test',
      fileUrl: '/uploads/user1/uuid.pdf',
      user: { id: 'user1', email: 'test@example.com', profile: null },
    })

    const fd = makeFormData({
      file: makePdfFile('test.pdf'),
      title: 'Test Material',
      subject: 'Math',
    })

    const request = new NextRequest('http://localhost/api/materials', {
      method: 'POST',
      body: fd,
    })

    const response = await POST(request)
    expect(response.status).toBe(201)
  })

  it('rejects unauthorized requests', async () => {
    ;(getSession as jest.Mock).mockResolvedValue(null)

    const fd = makeFormData({
      file: makePdfFile(),
      title: 'Test',
      subject: 'Math',
    })

    const request = new NextRequest('http://localhost/api/materials', {
      method: 'POST',
      body: fd,
    })

    const response = await POST(request)
    expect(response.status).toBe(401)
  })

  it('rejects invalid file types', async () => {
    ;(getSession as jest.Mock).mockResolvedValue({ id: 'user1' })

    const exeFile = new File(['content'], 'malware.exe', { type: 'application/octet-stream' })
    const fd = makeFormData({
      file: exeFile,
      title: 'Test',
      subject: 'Math',
    })

    const request = new NextRequest('http://localhost/api/materials', {
      method: 'POST',
      body: fd,
    })

    const response = await POST(request)
    expect(response.status).toBe(400)
    const data = await response.json()
    expect(data.error).toContain('Invalid file type')
  })

  it('rejects oversized files', async () => {
    ;(getSession as jest.Mock).mockResolvedValue({ id: 'user1' })

    const largeFile = makePdfFile('big.pdf', 60 * 1024 * 1024)
    const fd = new FormData()
    fd.append('file', largeFile)
    fd.append('title', 'Test')
    fd.append('subject', 'Math')

    const request = new NextRequest('http://localhost/api/materials', {
      method: 'POST',
    })
    jest.spyOn(request, 'formData').mockResolvedValueOnce(fd)

    const response = await POST(request)
    expect(response.status).toBe(400)
    const data = await response.json()
    expect(data.error).toContain('50MB')
  })

  it('sanitizes XSS in title', async () => {
    ;(getSession as jest.Mock).mockResolvedValue({ id: 'user1' })
    ;(uploadFile as jest.Mock).mockResolvedValue('/uploads/user1/uuid.pdf')
    ;(prisma.studyMaterial.create as jest.Mock).mockResolvedValue({ id: '1' })

    const fd = makeFormData({
      file: makePdfFile(),
      title: '<script>alert("xss")</script>Safe Title',
      subject: 'Math',
    })

    const request = new NextRequest('http://localhost/api/materials', {
      method: 'POST',
      body: fd,
    })

    await POST(request)

    expect(prisma.studyMaterial.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          title: 'Safe Title',
        }),
      })
    )
  })
})

describe('/api/materials/[id]/download POST', () => {
  it('streams file and increments download count', async () => {
    const { getFileStream } = jest.requireMock('@/lib/storage') as { getFileStream: jest.Mock }
    getFileStream.mockResolvedValue(Readable.from(Buffer.from('file content')))
    ;(getSession as jest.Mock).mockResolvedValue({ id: 'user1' })
    ;(prisma.studyMaterial.findUnique as jest.Mock).mockResolvedValue({
      id: 'material-1',
      fileUrl: '/uploads/user1/abc123.pdf',
      title: 'Test Material',
      fileType: 'pdf',
    })

    const req = new NextRequest('http://localhost/api/materials/material-1/download', {
      method: 'POST',
    })

    const response = await downloadPOST(req, { params: Promise.resolve({ id: 'material-1' }) })

    expect(response.status).toBe(200)
    expect(response.headers.get('Content-Disposition')).toContain('attachment')
    expect(prisma.studyMaterial.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'material-1' },
      })
    )
  })

  it('returns 400 for non-uploads fileUrl', async () => {
    ;(getSession as jest.Mock).mockResolvedValue({ id: 'user1' })
    ;(prisma.studyMaterial.findUnique as jest.Mock).mockResolvedValue({
      id: 'material-1',
      fileUrl: 'https://example.com/file.pdf',
      title: 'Test',
      fileType: 'pdf',
    })

    const req = new NextRequest('http://localhost/api/materials/material-1/download', {
      method: 'POST',
    })

    const response = await downloadPOST(req, { params: Promise.resolve({ id: 'material-1' }) })
    expect(response.status).toBe(400)
  })
})

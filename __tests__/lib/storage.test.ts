import { uploadFile, deleteFile } from '@/lib/storage'

// Expose mock functions via globalThis to work around jest.mock hoisting
jest.mock('minio', () => {
  const putObject = jest.fn().mockResolvedValue(undefined)
  const removeObject = jest.fn().mockResolvedValue(undefined)
  const getObject = jest.fn()
  const bucketExists = jest.fn().mockResolvedValue(true)
  const makeBucket = jest.fn().mockResolvedValue(undefined)
  const g = globalThis as Record<string, unknown>
  g.__minioPutObject = putObject
  g.__minioRemoveObject = removeObject
  g.__minioGetObject = getObject
  return {
    Client: jest
      .fn()
      .mockReturnValue({ putObject, removeObject, getObject, bucketExists, makeBucket }),
  }
})

const g = globalThis as Record<string, unknown>
const getMockPutObject = (): jest.Mock => g.__minioPutObject as jest.Mock
const getMockRemoveObject = (): jest.Mock => g.__minioRemoveObject as jest.Mock

// Stable UUID for predictable assertions
const FIXED_UUID = '00000000-0000-0000-0000-000000000001'
jest.spyOn(globalThis.crypto, 'randomUUID').mockReturnValue(FIXED_UUID)

function makeFile(name: string, bytes: number[]): File {
  const buffer = new Uint8Array(bytes)
  return new File([buffer], name)
}

function makeTextFile(name: string, content = 'hello'): File {
  return new File([content], name, { type: 'text/plain' })
}

beforeAll(() => {
  process.env.MINIO_ACCESS_KEY = 'testkey'
  process.env.MINIO_SECRET_KEY = 'testsecret'
  process.env.MINIO_BUCKET_NAME = 'classmate'
})

beforeEach(() => {
  jest.clearAllMocks()
  getMockPutObject().mockResolvedValue(undefined)
  getMockRemoveObject().mockResolvedValue(undefined)
})

describe('uploadFile', () => {
  describe('extension validation', () => {
    it('rejects disallowed extensions', async () => {
      const file = new File(['content'], 'malware.exe')
      await expect(uploadFile(file, 'user1')).rejects.toThrow('.exe is not allowed')
    })

    it('rejects files with no extension', async () => {
      const file = new File(['content'], 'noextension')
      await expect(uploadFile(file, 'user1')).rejects.toThrow('is not allowed')
    })

    it('is case-insensitive for extensions', async () => {
      // PDF magic bytes: %PDF
      const file = makeFile('TEST.PDF', [0x25, 0x50, 0x44, 0x46])
      const url = await uploadFile(file, 'user1')
      expect(url).toMatch(/\.pdf$/)
    })
  })

  describe('magic-byte validation', () => {
    it('accepts a valid PDF file', async () => {
      const file = makeFile('notes.pdf', [0x25, 0x50, 0x44, 0x46, 0x00, 0x00, 0x00, 0x00])
      await expect(uploadFile(file, 'user1')).resolves.toBeDefined()
    })

    it('rejects a PDF with wrong magic bytes', async () => {
      const file = makeFile('fake.pdf', [0x00, 0x01, 0x02, 0x03])
      await expect(uploadFile(file, 'user1')).rejects.toThrow(
        'File content does not match expected format for .pdf'
      )
    })

    it('accepts a valid DOCX file (ZIP header)', async () => {
      const file = makeFile('report.docx', [0x50, 0x4b, 0x03, 0x04, 0x00, 0x00, 0x00, 0x00])
      await expect(uploadFile(file, 'user1')).resolves.toBeDefined()
    })

    it('rejects a DOCX with wrong magic bytes', async () => {
      const file = makeFile('fake.docx', [0x00, 0x01, 0x02, 0x03])
      await expect(uploadFile(file, 'user1')).rejects.toThrow(
        'File content does not match expected format for .docx'
      )
    })

    it('accepts a valid XLSX file (ZIP header)', async () => {
      const file = makeFile('data.xlsx', [0x50, 0x4b, 0x03, 0x04, 0x00, 0x00, 0x00, 0x00])
      await expect(uploadFile(file, 'user1')).resolves.toBeDefined()
    })

    it('accepts a valid PPTX file (ZIP header)', async () => {
      const file = makeFile('slides.pptx', [0x50, 0x4b, 0x03, 0x04, 0x00, 0x00, 0x00, 0x00])
      await expect(uploadFile(file, 'user1')).resolves.toBeDefined()
    })

    it('accepts a valid ZIP file', async () => {
      const file = makeFile('archive.zip', [0x50, 0x4b, 0x03, 0x04, 0x00, 0x00, 0x00, 0x00])
      await expect(uploadFile(file, 'user1')).resolves.toBeDefined()
    })

    it('accepts a valid DOC file (OLE2 header)', async () => {
      const file = makeFile('doc.doc', [0xd0, 0xcf, 0x11, 0xe0, 0x00, 0x00, 0x00, 0x00])
      await expect(uploadFile(file, 'user1')).resolves.toBeDefined()
    })

    it('accepts a valid XLS file (OLE2 header)', async () => {
      const file = makeFile('sheet.xls', [0xd0, 0xcf, 0x11, 0xe0, 0x00, 0x00, 0x00, 0x00])
      await expect(uploadFile(file, 'user1')).resolves.toBeDefined()
    })

    it('accepts a valid PPT file (OLE2 header)', async () => {
      const file = makeFile('slides.ppt', [0xd0, 0xcf, 0x11, 0xe0, 0x00, 0x00, 0x00, 0x00])
      await expect(uploadFile(file, 'user1')).resolves.toBeDefined()
    })

    it('accepts a TXT file without magic-byte check', async () => {
      const file = makeTextFile('readme.txt')
      await expect(uploadFile(file, 'user1')).resolves.toBeDefined()
    })

    it('accepts a MD file without magic-byte check', async () => {
      const file = makeTextFile('notes.md', '# Heading')
      await expect(uploadFile(file, 'user1')).resolves.toBeDefined()
    })
  })

  describe('MinIO upload', () => {
    it('calls putObject with the correct bucket and object key', async () => {
      const file = makeFile('notes.pdf', [0x25, 0x50, 0x44, 0x46])
      await uploadFile(file, 'user42')
      expect(getMockPutObject()).toHaveBeenCalledWith(
        'classmate',
        `uploads/user42/${FIXED_UUID}.pdf`,
        expect.any(Buffer),
        expect.any(Number),
        expect.any(Object)
      )
    })

    it('returns a URL path under /uploads/<userId>/', async () => {
      const file = makeFile('notes.pdf', [0x25, 0x50, 0x44, 0x46])
      const url = await uploadFile(file, 'user42')
      expect(url).toBe(`/uploads/user42/${FIXED_UUID}.pdf`)
    })

    it('uses a UUID in the filename (not original name)', async () => {
      const file = makeFile('my secret notes.pdf', [0x25, 0x50, 0x44, 0x46])
      const url = await uploadFile(file, 'user1')
      expect(url).not.toContain('my secret notes')
      expect(url).toContain(FIXED_UUID)
    })
  })
})

describe('deleteFile', () => {
  it('calls removeObject with the correct bucket and key', async () => {
    await deleteFile('/uploads/user1/some-file.pdf')
    expect(getMockRemoveObject()).toHaveBeenCalledWith('classmate', 'uploads/user1/some-file.pdf')
  })

  it('ignores URLs that do not start with /uploads/', async () => {
    await deleteFile('https://example.com/file.pdf')
    expect(getMockRemoveObject()).not.toHaveBeenCalled()
  })

  it('silently swallows removeObject errors', async () => {
    getMockRemoveObject().mockRejectedValueOnce(new Error('NoSuchKey'))
    await expect(deleteFile('/uploads/user1/gone.pdf')).resolves.toBeUndefined()
  })

  it('silently swallows any storage error', async () => {
    getMockRemoveObject().mockRejectedValueOnce(new Error('network error'))
    await expect(deleteFile('/uploads/user1/gone.pdf')).resolves.toBeUndefined()
  })
})

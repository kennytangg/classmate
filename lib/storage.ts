import path from 'path'
import { Client } from 'minio'
import type { Readable } from 'stream'

const ALLOWED_EXTENSIONS = new Set([
  '.pdf',
  '.doc',
  '.docx',
  '.ppt',
  '.pptx',
  '.xls',
  '.xlsx',
  '.txt',
  '.md',
  '.zip',
])

/**
 * Magic-byte signatures for binary file types.
 * Each entry maps an extension to one or more acceptable byte sequences at the
 * start of the file. Extensions not listed here (txt, md) are text-only and
 * have no reliable magic bytes, so they are validated by extension alone.
 */
const MAGIC_BYTES: Record<string, number[][]> = {
  // %PDF
  '.pdf': [[0x25, 0x50, 0x44, 0x46]],
  // ZIP local-file header (DOCX / XLSX / PPTX / ZIP are all ZIP-based)
  '.zip': [[0x50, 0x4b, 0x03, 0x04]],
  '.docx': [[0x50, 0x4b, 0x03, 0x04]],
  '.xlsx': [[0x50, 0x4b, 0x03, 0x04]],
  '.pptx': [[0x50, 0x4b, 0x03, 0x04]],
  // OLE2 compound-document header (legacy DOC / XLS / PPT)
  '.doc': [[0xd0, 0xcf, 0x11, 0xe0]],
  '.xls': [[0xd0, 0xcf, 0x11, 0xe0]],
  '.ppt': [[0xd0, 0xcf, 0x11, 0xe0]],
}

function matchesMagicBytes(buffer: Buffer, signatures: number[][]): boolean {
  return signatures.some((sig) => sig.every((byte, i) => buffer[i] === byte))
}

async function validateMimeFromBuffer(file: File, ext: string): Promise<void> {
  const signatures = MAGIC_BYTES[ext]
  if (!signatures) {
    // No magic-byte rule for this extension (txt, md) — accept as-is
    return
  }

  // Read only the first 8 bytes to check the signature
  const slice = file.slice(0, 8)
  const arrayBuffer = await slice.arrayBuffer()
  const header = Buffer.from(arrayBuffer)

  if (!matchesMagicBytes(header, signatures)) {
    throw new Error(
      `File content does not match expected format for ${ext}. The file may be corrupt or misnamed.`
    )
  }
}

let _client: Client | null = null

function getClient(): Client {
  if (!_client) {
    const accessKey = process.env.MINIO_ACCESS_KEY
    const secretKey = process.env.MINIO_SECRET_KEY
    if (!accessKey || !secretKey) {
      throw new Error('MINIO_ACCESS_KEY and MINIO_SECRET_KEY environment variables are required')
    }
    _client = new Client({
      endPoint: process.env.MINIO_ENDPOINT ?? 'localhost',
      port: parseInt(process.env.MINIO_PORT ?? '9000', 10),
      useSSL: process.env.MINIO_USE_SSL === 'true',
      accessKey,
      secretKey,
    })
  }
  return _client
}

function getBucket(): string {
  return process.env.MINIO_BUCKET_NAME ?? 'classmate'
}

let _bucketReady = false

async function ensureBucket(): Promise<void> {
  if (_bucketReady) return
  const client = getClient()
  const bucket = getBucket()
  const exists = await client.bucketExists(bucket)
  if (!exists) {
    await client.makeBucket(bucket)
  }
  _bucketReady = true
}

export async function uploadFile(file: File, userId: string): Promise<string> {
  await ensureBucket()
  const ext = path.extname(file.name).toLowerCase()
  if (!ALLOWED_EXTENSIONS.has(ext)) {
    throw new Error(`File extension ${ext} is not allowed`)
  }

  await validateMimeFromBuffer(file, ext)

  const uniqueName = `${crypto.randomUUID()}${ext}`
  const objectKey = `uploads/${userId}/${uniqueName}`
  const buffer = Buffer.from(await file.arrayBuffer())

  await getClient().putObject(getBucket(), objectKey, buffer, buffer.length, {
    'Content-Type': file.type || 'application/octet-stream',
  })

  return `/${objectKey}`
}

export async function uploadRaw(
  objectKey: string,
  buffer: Buffer,
  contentType: string
): Promise<void> {
  await ensureBucket()
  await getClient().putObject(getBucket(), objectKey, buffer, buffer.length, {
    'Content-Type': contentType,
  })
}

export async function getFileStream(fileUrl: string): Promise<Readable> {
  await ensureBucket()
  const objectKey = fileUrl.startsWith('/') ? fileUrl.slice(1) : fileUrl
  return getClient().getObject(getBucket(), objectKey)
}

export async function deleteFile(fileUrl: string): Promise<void> {
  if (!fileUrl.startsWith('/uploads/')) return
  const objectKey = fileUrl.slice(1)
  try {
    await getClient().removeObject(getBucket(), objectKey)
  } catch {
    // File may not exist; ignore
  }
}

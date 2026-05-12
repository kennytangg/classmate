/**
 * @jest-environment jsdom
 */
import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import UploadMaterialPage from '@/app/(main)/materials/upload/page'
import { toast } from 'sonner'

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(() => ({ push: jest.fn(), refresh: jest.fn() })),
}))

jest.mock('next/link', () => {
  return function MockLink({ href, children }: { href: string; children: React.ReactNode }) {
    return <a href={href}>{children}</a>
  }
})

jest.mock('sonner', () => ({
  toast: { error: jest.fn(), success: jest.fn() },
}))

global.fetch = jest.fn()

beforeEach(() => {
  jest.clearAllMocks()
})

function makeFile(name: string, sizeBytes: number, type = 'application/pdf') {
  const file = new File(['x'.repeat(sizeBytes)], name, { type })
  Object.defineProperty(file, 'size', { value: sizeBytes })
  return file
}

describe('UploadMaterialPage', () => {
  it('renders file input, title, description, and subject fields', () => {
    render(<UploadMaterialPage />)

    expect(screen.getByText(/click to choose a file/i)).toBeInTheDocument()
    expect(screen.getByPlaceholderText('e.g., Calculus Chapter 5 Notes')).toBeInTheDocument()
    expect(
      screen.getByPlaceholderText("Briefly describe what's in this file...")
    ).toBeInTheDocument()
    expect(screen.getByRole('combobox')).toBeInTheDocument()
  })

  it('shows error toast when submitting without a file', async () => {
    const user = userEvent.setup()
    render(<UploadMaterialPage />)

    await user.type(screen.getByPlaceholderText('e.g., Calculus Chapter 5 Notes'), 'My notes')
    await user.selectOptions(screen.getByRole('combobox'), 'Mathematics')
    await user.click(screen.getByRole('button', { name: /upload/i }))

    expect(toast.error).toHaveBeenCalledWith('Please select a file to upload.')
  })

  it('shows error toast for file exceeding 50 MB size limit', async () => {
    const user = userEvent.setup()
    render(<UploadMaterialPage />)

    const oversizedFile = makeFile('big.pdf', 51 * 1024 * 1024)
    const input = document.querySelector('input[type="file"]') as HTMLInputElement
    await user.upload(input, oversizedFile)

    expect(toast.error).toHaveBeenCalledWith(expect.stringContaining('too large'))
  }, 15000)

  it('shows error toast for disallowed file type', async () => {
    const user = userEvent.setup({ applyAccept: false })
    render(<UploadMaterialPage />)

    const badFile = makeFile('virus.exe', 1024, 'application/octet-stream')
    const input = document.querySelector('input[type="file"]') as HTMLInputElement
    await user.upload(input, badFile)

    expect(toast.error).toHaveBeenCalledWith(expect.stringContaining('not allowed'))
  })

  it('sends FormData with file and metadata to POST /api/materials on valid submit', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ material: { id: 'mat-1' } }),
    })
    const user = userEvent.setup()
    render(<UploadMaterialPage />)

    const validFile = makeFile('notes.pdf', 1024)
    const input = document.querySelector('input[type="file"]') as HTMLInputElement
    await user.upload(input, validFile)

    await user.clear(screen.getByPlaceholderText('e.g., Calculus Chapter 5 Notes'))
    await user.type(screen.getByPlaceholderText('e.g., Calculus Chapter 5 Notes'), 'My Calc Notes')
    await user.selectOptions(screen.getByRole('combobox'), 'Mathematics')
    await user.click(screen.getByRole('button', { name: /upload/i }))

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/materials',
        expect.objectContaining({ method: 'POST' })
      )
      const call = (global.fetch as jest.Mock).mock.calls[0]
      const body = call[1].body as FormData
      expect(body.get('title')).toBe('My Calc Notes')
      expect(body.get('subject')).toBe('Mathematics')
    })
  })

  it('shows error toast when upload API returns an error', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      json: async () => ({ error: 'Upload failed. Please try again.' }),
    })
    const user = userEvent.setup()
    render(<UploadMaterialPage />)

    const validFile = makeFile('notes.pdf', 1024)
    const input = document.querySelector('input[type="file"]') as HTMLInputElement
    await user.upload(input, validFile)

    await user.clear(screen.getByPlaceholderText('e.g., Calculus Chapter 5 Notes'))
    await user.type(screen.getByPlaceholderText('e.g., Calculus Chapter 5 Notes'), 'My Calc Notes')
    await user.selectOptions(screen.getByRole('combobox'), 'Mathematics')
    await user.click(screen.getByRole('button', { name: /upload/i }))

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Upload failed. Please try again.')
    })
  })

  it('disables submit button during upload', async () => {
    ;(global.fetch as jest.Mock).mockImplementation(() => new Promise(() => {})) // never resolves
    const user = userEvent.setup()
    render(<UploadMaterialPage />)

    const validFile = makeFile('notes.pdf', 1024)
    const input = document.querySelector('input[type="file"]') as HTMLInputElement
    await user.upload(input, validFile)

    await user.clear(screen.getByPlaceholderText('e.g., Calculus Chapter 5 Notes'))
    await user.type(screen.getByPlaceholderText('e.g., Calculus Chapter 5 Notes'), 'My Calc Notes')
    await user.selectOptions(screen.getByRole('combobox'), 'Mathematics')
    await user.click(screen.getByRole('button', { name: /upload/i }))

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /uploading/i })).toBeDisabled()
    })
  })

  it('shows success toast and redirects on successful upload', async () => {
    const mockPush = jest.fn()
    jest.spyOn(jest.requireMock('next/navigation'), 'useRouter').mockReturnValue({
      push: mockPush,
      refresh: jest.fn(),
    })
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ material: { id: 'mat-1' } }),
    })
    const user = userEvent.setup()
    render(<UploadMaterialPage />)

    const validFile = makeFile('notes.pdf', 1024)
    const input = document.querySelector('input[type="file"]') as HTMLInputElement
    await user.upload(input, validFile)

    await user.clear(screen.getByPlaceholderText('e.g., Calculus Chapter 5 Notes'))
    await user.type(screen.getByPlaceholderText('e.g., Calculus Chapter 5 Notes'), 'My Calc Notes')
    await user.selectOptions(screen.getByRole('combobox'), 'Mathematics')
    await user.click(screen.getByRole('button', { name: /upload/i }))

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith('Material uploaded successfully!')
      expect(mockPush).toHaveBeenCalledWith('/materials')
    })
  })
})

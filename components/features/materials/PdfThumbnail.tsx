'use client'

import { Fragment, useEffect, useRef, useState } from 'react'
import { FileText } from 'lucide-react'

// Persists across remounts — survives filter/sort switches without re-fetching
const thumbnailCache = new Map<string, string[]>()

interface PdfThumbnailProps {
  materialId: string
  pageCount?: number
  className?: string
  onTotalPages?: (total: number) => void
}

export function PdfThumbnail({
  materialId,
  pageCount = 1,
  className,
  onTotalPages,
}: PdfThumbnailProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const cached = thumbnailCache.get(materialId)
  const [pages, setPages] = useState<string[]>(cached ?? [])
  const [status, setStatus] = useState<'idle' | 'loading' | 'done' | 'error'>(
    cached ? 'done' : 'idle'
  )

  // Skip the observer entirely if we already have a cached render
  useEffect(() => {
    if (status === 'done') return
    const el = containerRef.current
    if (!el) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setStatus('loading')
          observer.disconnect()
        }
      },
      { rootMargin: '150px' }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [status])

  useEffect(() => {
    if (status !== 'loading') return

    let cancelled = false

    async function render() {
      try {
        const pdfjsLib = await import('pdfjs-dist')
        pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
          'pdfjs-dist/build/pdf.worker.min.mjs',
          import.meta.url
        ).toString()

        const task = pdfjsLib.getDocument({
          url: `/api/materials/${materialId}/preview`,
          withCredentials: true,
        })
        const pdf = await task.promise
        if (cancelled) return

        if (onTotalPages) onTotalPages(pdf.numPages)
        const containerWidth = containerRef.current?.clientWidth ?? 320
        const count = Math.min(pageCount, pdf.numPages)
        const dataUrls: string[] = []

        for (let i = 1; i <= count; i++) {
          const page = await pdf.getPage(i)
          if (cancelled) return

          const unscaled = page.getViewport({ scale: 1 })
          const scale = containerWidth / unscaled.width
          const viewport = page.getViewport({ scale })

          const canvas = document.createElement('canvas')
          canvas.width = viewport.width
          canvas.height = viewport.height
          const ctx = canvas.getContext('2d')!
          await page.render({ canvasContext: ctx, viewport }).promise
          if (cancelled) return

          dataUrls.push(canvas.toDataURL())
        }

        if (!cancelled) {
          thumbnailCache.set(materialId, dataUrls)
          setPages(dataUrls)
          setStatus('done')
        }
      } catch {
        if (!cancelled) setStatus('error')
      }
    }

    void render()
    return () => {
      cancelled = true
    }
  }, [status, materialId, pageCount, onTotalPages])

  return (
    <div ref={containerRef} className={className}>
      {(status === 'idle' || status === 'loading') && (
        <div className="bg-muted h-full w-full animate-pulse" />
      )}
      {status === 'error' && (
        <div className="flex h-full w-full items-center justify-center">
          <FileText className="text-muted-foreground/30 h-8 w-8" />
        </div>
      )}
      {status === 'done' &&
        pages.map((src, i) => (
          <Fragment key={i}>
            {/* eslint-disable-next-line @next/next/no-img-element -- data: URLs from canvas cannot be optimized by next/image */}
            <img src={src} alt={`Page ${i + 1}`} className="w-full" draggable={false} />
          </Fragment>
        ))}
    </div>
  )
}

import type { ReactNode } from 'react'

interface ContentSectionProps {
  title?: string
  children: ReactNode
  className?: string
}

export function ContentSection({ title, children, className = '' }: ContentSectionProps) {
  return (
    <section className={`border-border bg-card rounded-xl border p-6 sm:p-8 ${className}`}>
      {title && (
        <h2 className="text-foreground mb-4 flex items-center gap-2.5 text-lg font-semibold">
          <span className="bg-primary h-1.5 w-1.5 shrink-0 rounded-full" />
          {title}
        </h2>
      )}
      {children}
    </section>
  )
}

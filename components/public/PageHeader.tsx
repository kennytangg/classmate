import type { ReactNode } from 'react'

interface PageHeaderProps {
  title: string
  description?: string
  badge?: string
  icon?: ReactNode
}

export function PageHeader({ title, description, badge, icon }: PageHeaderProps) {
  return (
    <div className="border-border border-b px-4 py-10 sm:px-6">
      <div className="container mx-auto max-w-3xl">
        {icon && (
          <div className="bg-accent text-primary mb-4 flex h-9 w-9 items-center justify-center rounded-lg">
            {icon}
          </div>
        )}
        {badge && <p className="text-muted-foreground mb-2 text-xs">{badge}</p>}
        <h1 className="text-foreground text-lg font-bold">{title}</h1>
        {description && (
          <p className="text-muted-foreground mt-2 max-w-2xl text-sm leading-relaxed">
            {description}
          </p>
        )}
      </div>
    </div>
  )
}

import { ArrowLeft, Users } from 'lucide-react'

interface GroupDetailHeaderProps {
  name: string
  subject: string
  description: string | null
  memberCount: number
  onBack: () => void
}

export function GroupDetailHeader({
  name,
  subject,
  description,
  memberCount,
  onBack,
}: GroupDetailHeaderProps) {
  return (
    <div className="border-border bg-card border-b p-4 md:p-6">
      <button
        onClick={onBack}
        className="text-muted-foreground hover:text-foreground mb-4 flex items-center gap-2 text-sm transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Groups
      </button>

      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="border-border bg-muted text-muted-foreground rounded-full border px-2.5 py-1 text-xs font-bold">
            {subject.toUpperCase()}
          </span>
        </div>

        <h1 className="text-foreground text-xl font-bold md:text-2xl">{name}</h1>

        {description && <p className="text-muted-foreground text-sm">{description}</p>}

        <div className="text-muted-foreground flex items-center gap-1.5 text-sm">
          <Users className="h-4 w-4" />
          <span>
            {memberCount} member{memberCount !== 1 ? 's' : ''}
          </span>
        </div>
      </div>
    </div>
  )
}

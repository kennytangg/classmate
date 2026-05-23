import Link from 'next/link'

export function Footer() {
  return (
    <footer className="bg-background mt-16 py-4">
      <div className="container mx-auto px-4">
        <div className="text-muted-foreground flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-sm">
          <span>© {new Date().getFullYear()} ClassMate</span>
          <Link href="/privacy" className="hover:text-primary">
            Privacy Policy
          </Link>
          <Link href="/terms" className="hover:text-primary">
            Terms of Service
          </Link>
        </div>
      </div>
    </footer>
  )
}

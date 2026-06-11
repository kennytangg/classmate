import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Guards against open-redirect vulnerabilities: only allows
 * same-site, relative paths (e.g. "/dashboard"), rejecting
 * protocol-relative ("//evil.com") and absolute URLs ("https://evil.com").
 */
export function isValidRedirectPath(path: string | null | undefined): path is string {
  if (!path) return false
  if (!path.startsWith('/')) return false
  if (path.startsWith('//')) return false
  if (path.includes('://')) return false
  return true
}

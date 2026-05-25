import { getAvatarColor } from '@/lib/utils/avatarColor'

const VALID_COLORS = [
  'bg-violet-500',
  'bg-blue-500',
  'bg-emerald-500',
  'bg-rose-500',
  'bg-amber-500',
  'bg-cyan-500',
  'bg-fuchsia-500',
  'bg-orange-500',
  'bg-teal-500',
  'bg-indigo-500',
]

describe('getAvatarColor', () => {
  it('returns a color from the palette', () => {
    expect(VALID_COLORS).toContain(getAvatarColor('alice'))
  })

  it('is deterministic for the same seed', () => {
    expect(getAvatarColor('bob')).toBe(getAvatarColor('bob'))
  })

  it('handles empty string without throwing', () => {
    expect(VALID_COLORS).toContain(getAvatarColor(''))
  })

  it('distributes across the palette', () => {
    const colors = new Set(Array.from({ length: 30 }, (_, i) => getAvatarColor(`user${i}`)))
    expect(colors.size).toBeGreaterThanOrEqual(4)
  })
})

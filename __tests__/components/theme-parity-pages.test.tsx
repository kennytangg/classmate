/**
 * @jest-environment jsdom
 */
import React from 'react'
import { render, screen } from '@testing-library/react'
import { ForumCard } from '@/components/features/forums/ForumCard'
import { MaterialCard } from '@/components/features/materials/MaterialCard'

describe('Theme parity component guards', () => {
  it('forum card uses design token container and text classes', () => {
    const { container } = render(
      <ForumCard
        id="post-1"
        title="Need help with calculus"
        content="I'm stuck on derivatives and integrals."
        author="Alice"
        replies={2}
        views={10}
        upvotes={3}
        hasUpvoted={false}
        tags={['calculus']}
        createdAt="today"
      />
    )

    expect(screen.getByText('Need help with calculus')).toBeInTheDocument()
    expect(container.innerHTML).toContain('bg-card')
    expect(container.innerHTML).toContain('text-foreground')
  })

  it('material card uses design token container and metadata classes', () => {
    const { container } = render(
      <MaterialCard
        id="mat-1"
        title="Linear Algebra Notes"
        author="Bob"
        subject="Mathematics"
        type="PDF"
        downloads={120}
        uploadedAt="today"
      />
    )

    expect(screen.getByText('Linear Algebra Notes')).toBeInTheDocument()
    expect(container.innerHTML).toContain('bg-card')
    expect(container.innerHTML).toContain('text-foreground')
  })
})

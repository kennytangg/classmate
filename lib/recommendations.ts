type RecommendationItem = {
  id: string
  title: string
  createdAt: Date
  upvotes: number
  views: number
  repliesCount: number
  score: number
  reasons: string[]
}

type PostInput = {
  id: string
  title: string
  createdAt: Date
  upvotes: number
  views: number
  repliesCount: number
  tags?: { name: string }[]
}

function daysSince(date: Date): number {
  const diffMs = Date.now() - date.getTime()
  return Math.floor(diffMs / 86400000)
}

function recencyScore(createdAt: Date): number {
  const days = daysSince(createdAt)
  return Math.max(0, 30 - days)
}

function engagementScore(upvotes: number, views: number, repliesCount: number): number {
  return upvotes * 3 + repliesCount * 4 + Math.floor(views / 20)
}

function isTrending(repliesCount: number, views: number, upvotes: number): boolean {
  return repliesCount >= 2 || views >= 30 || upvotes >= 3
}

export function scoreAndRankPosts(
  posts: PostInput[],
  _userCategories: Set<string>,
  userTags: Set<string>
): RecommendationItem[] {
  const hasHistory = userTags.size > 0

  const scored: RecommendationItem[] = posts.map((post) => {
    const postTagNames = (post.tags ?? []).map((tag) => tag.name.toLowerCase())
    const matchingTags = postTagNames.filter((tag) => userTags.has(tag)).length

    const recency = recencyScore(post.createdAt)
    const engagement = engagementScore(post.upvotes, post.views, post.repliesCount)

    let score = recency + engagement
    const reasons: string[] = []

    if (hasHistory) {
      if (matchingTags > 0) {
        score += matchingTags * 15
        reasons.push(`Shares ${matchingTags} of your frequent topic tags`)
      }
    }

    if (isTrending(post.repliesCount, post.views, post.upvotes)) {
      reasons.push('Trending discussion')
    }

    if (reasons.length === 0) {
      reasons.push('Recent discussion')
    }

    return {
      id: post.id,
      title: post.title,
      createdAt: post.createdAt,
      upvotes: post.upvotes,
      views: post.views,
      repliesCount: post.repliesCount,
      score,
      reasons,
    }
  })

  return scored.sort((a, b) => b.score - a.score)
}

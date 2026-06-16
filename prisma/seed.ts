/**
 * ClassMate — Database Seed
 *
 * Populates the database with realistic demo data covering all major features.
 * Safe to re-run: clears existing data before inserting fresh records.
 *
 * Seeded accounts (all use password: password)
 *   owner   → evan@classmate.dev   (OWNER)
 *   moderators → carol@classmate.dev, george@classmate.dev (MODERATOR)
 *   students→ alice, bob, diana, fiona, hannah @classmate.dev (STUDENT)
 *
 * Run: npx prisma db seed
 */

import 'dotenv/config'
import { PrismaClient } from '../generated/prisma/client.js'
import { PrismaPg } from '@prisma/adapter-pg'
import { hashPassword } from 'better-auth/crypto'

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
const prisma = new PrismaClient({ adapter })
const SEED_PASSWORD = 'password'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function avatarUrl(name: string): string {
  const encoded = encodeURIComponent(name.trim() || 'User')
  return `https://ui-avatars.com/api/?name=${encoded}&size=128&background=6366f1&color=fff&bold=true`
}

function daysFromNow(n: number): Date {
  const d = new Date()
  d.setDate(d.getDate() + n)
  return d
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.warn('🌱  Seeding ClassMate database...\n')

  const hashedPassword = await hashPassword(SEED_PASSWORD)

  // ── Clear existing data (in FK-safe order) ─────────────────────────────────
  console.warn('  Clearing existing data...')
  await prisma.notification.deleteMany()
  await prisma.moderationLog.deleteMany()
  await prisma.flaggedContent.deleteMany()
  await prisma.connection.deleteMany()
  await prisma.chatMessage.deleteMany()
  await prisma.chatSession.deleteMany()
  await prisma.studyGroupMessage.deleteMany()
  await prisma.studyGroupMember.deleteMany()
  await prisma.studyMaterial.deleteMany()
  await prisma.studyGroup.deleteMany()
  await prisma.forumReply.deleteMany()
  await prisma.forumPost.deleteMany()
  await prisma.event.deleteMany()
  await prisma.account.deleteMany()
  await prisma.session.deleteMany()
  await prisma.userProfile.deleteMany()
  await prisma.user.deleteMany()

  // ── Users ──────────────────────────────────────────────────────────────────
  console.warn('  Creating users...')
  const [alice, bob, carol, diana, evan, fiona, george, hannah] = await Promise.all([
    prisma.user.create({
      data: {
        email: 'alice@classmate.dev',
        name: 'Alice Chen',
        image: avatarUrl('Alice Chen'),
        emailVerified: true,
        role: 'STUDENT',
      },
    }),
    prisma.user.create({
      data: {
        email: 'bob@classmate.dev',
        name: 'Bob Rodriguez',
        image: avatarUrl('Bob Rodriguez'),
        emailVerified: true,
        role: 'STUDENT',
      },
    }),
    prisma.user.create({
      data: {
        email: 'carol@classmate.dev',
        name: 'Carol Williams',
        image: avatarUrl('Carol Williams'),
        emailVerified: true,
        role: 'MODERATOR',
      },
    }),
    prisma.user.create({
      data: {
        email: 'diana@classmate.dev',
        name: 'Diana Martinez',
        image: avatarUrl('Diana Martinez'),
        emailVerified: true,
        role: 'STUDENT',
      },
    }),
    prisma.user.create({
      data: {
        email: 'evan@classmate.dev',
        name: 'Evan Park',
        image: avatarUrl('Evan Park'),
        emailVerified: true,
        role: 'OWNER',
      },
    }),
    prisma.user.create({
      data: {
        email: 'fiona@classmate.dev',
        name: 'Fiona Lee',
        image: avatarUrl('Fiona Lee'),
        emailVerified: true,
        role: 'STUDENT',
      },
    }),
    prisma.user.create({
      data: {
        email: 'george@classmate.dev',
        name: 'George Patel',
        image: avatarUrl('George Patel'),
        emailVerified: true,
        role: 'MODERATOR',
      },
    }),
    prisma.user.create({
      data: {
        email: 'hannah@classmate.dev',
        name: 'Hannah Johnson',
        image: avatarUrl('Hannah Johnson'),
        emailVerified: true,
        role: 'STUDENT',
      },
    }),
  ])

  // ── User Profiles ──────────────────────────────────────────────────────────
  console.warn('  Creating user profiles...')
  await Promise.all([
    prisma.userProfile.create({
      data: {
        userId: alice.id,
        displayName: 'Alice Chen',
        avatarUrl: avatarUrl('Alice Chen'),
        bio: 'CS sophomore. Love React and building web apps. Currently levelling up my TypeScript skills.',
        university: 'Binus University',
        major: 'Computer Science',
      },
    }),
    prisma.userProfile.create({
      data: {
        userId: bob.id,
        displayName: 'Bob Rodriguez',
        avatarUrl: avatarUrl('Bob Rodriguez'),
        bio: 'First-year student passionate about algorithms and competitive programming. Python enthusiast.',
        university: 'Binus University',
        major: 'Information Systems',
      },
    }),
    prisma.userProfile.create({
      data: {
        userId: carol.id,
        displayName: 'Carol Williams',
        avatarUrl: avatarUrl('Carol Williams'),
        bio: 'Senior CS student and peer tutor. Specialising in web development and the React ecosystem.',
        university: 'Binus University',
        major: 'Computer Science',
      },
    }),
    prisma.userProfile.create({
      data: {
        userId: diana.id,
        displayName: 'Diana Martinez',
        avatarUrl: avatarUrl('Diana Martinez'),
        bio: 'Just started my CS journey! Excited to learn data structures and algorithms from scratch.',
        university: 'Binus University',
        major: 'Computer Science',
      },
    }),
    prisma.userProfile.create({
      data: {
        userId: evan.id,
        displayName: 'Evan Park',
        avatarUrl: avatarUrl('Evan Park'),
        bio: 'ClassMate platform admin. Here to help students connect and learn together.',
        university: 'Binus University',
        major: 'Computer Science',
      },
    }),
    prisma.userProfile.create({
      data: {
        userId: fiona.id,
        displayName: 'Fiona Lee',
        avatarUrl: avatarUrl('Fiona Lee'),
        bio: 'Full-stack developer in training. Big fan of TypeScript and clean architecture principles.',
        university: 'Binus University',
        major: 'Software Engineering',
      },
    }),
    prisma.userProfile.create({
      data: {
        userId: george.id,
        displayName: 'George Patel',
        avatarUrl: avatarUrl('George Patel'),
        bio: 'Database systems tutor with 2 years of experience. Passionate about PostgreSQL and query optimisation.',
        university: 'Binus University',
        major: 'Computer Science',
      },
    }),
    prisma.userProfile.create({
      data: {
        userId: hannah.id,
        displayName: 'Hannah Johnson',
        avatarUrl: avatarUrl('Hannah Johnson'),
        bio: 'Transfer student learning programming from scratch. Grateful for the ClassMate community!',
        university: 'Binus University',
        major: 'Information Technology',
      },
    }),
  ])

  // ── Auth Accounts (Better Auth credential provider) ────────────────────────
  console.warn('  Creating auth accounts...')
  await Promise.all(
    [alice, bob, carol, diana, evan, fiona, george, hannah].map((u) =>
      prisma.account.create({
        data: { userId: u.id, accountId: u.id, providerId: 'credential', password: hashedPassword },
      })
    )
  )

  // ── Forum Posts ────────────────────────────────────────────────────────────
  console.warn('  Creating forum posts...')
  const posts = await Promise.all([
    prisma.forumPost.create({
      data: {
        userId: alice.id,
        title: 'How do I properly use useEffect with async functions?',
        content: `I keep running into issues with async functions inside useEffect. When I make the callback async directly I get a warning about returning a Promise. I know useEffect expects either nothing or a cleanup function but I am not sure how to structure this correctly. What is the right pattern?`,
        upvotes: 12,
        views: 145,
        isAnswered: true,
        repliesCount: 3,
      },
    }),
    prisma.forumPost.create({
      data: {
        userId: bob.id,
        title: 'Best resources for learning Big O notation?',
        content: `I'm preparing for technical interviews and struggling to understand time complexity analysis. Can anyone recommend good resources or share how they learned Big O notation? Books, videos, or practice sites all welcome!`,
        upvotes: 8,
        views: 98,
        isAnswered: false,
        repliesCount: 4,
      },
    }),
    prisma.forumPost.create({
      data: {
        userId: fiona.id,
        title: 'TypeScript generics — when to use them vs. any?',
        content: `I understand the basics of generics in TypeScript but I'm unsure when it's appropriate to use them versus just using any. Can someone explain with practical examples? I want to write more type-safe code.`,
        upvotes: 15,
        views: 210,
        isAnswered: true,
        repliesCount: 3,
      },
    }),
    prisma.forumPost.create({
      data: {
        userId: carol.id,
        title: '[Resource] Complete React Hooks Cheat Sheet 2026',
        content: `Here is a quick reference for all core React hooks. useState handles local state. useEffect manages side effects and data fetching. useContext reads context values. useReducer handles complex state logic. useMemo caches expensive computed values. useCallback prevents unnecessary function recreation. useRef holds mutable values without triggering re-renders. Feel free to save and share!`,
        upvotes: 24,
        views: 387,
        isAnswered: false,
        repliesCount: 2,
      },
    }),
    prisma.forumPost.create({
      data: {
        userId: george.id,
        title: 'Database normalisation — 1NF, 2NF, 3NF explained clearly',
        content: `Database normalisation is often poorly explained so here is a clear breakdown. 1NF means each column has atomic values with no repeating groups. 2NF requires 1NF and that every non-key column fully depends on the primary key. 3NF requires 2NF and no transitive dependencies so non-key columns only depend on the primary key. Ask me anything in the replies!`,
        upvotes: 19,
        views: 256,
        isAnswered: false,
        repliesCount: 3,
      },
    }),
    prisma.forumPost.create({
      data: {
        userId: diana.id,
        title: "I'm completely lost on recursion — can anyone help?",
        content: `I've been staring at recursive algorithms for a week and still don't understand them intuitively. The factorial example makes sense but when it gets more complex (like tree traversal) I lose track completely. Is there a mental model that helps?`,
        upvotes: 6,
        views: 72,
        isAnswered: true,
        repliesCount: 4,
      },
    }),
    prisma.forumPost.create({
      data: {
        userId: evan.id,
        title: 'ClassMate platform update — study groups, AI tutor & more',
        content: `Excited to share the latest ClassMate updates. Study Groups let you create or join private or public groups to collaborate with peers. The AI Tutor gives instant answers to your study questions. Forum Summarisation condenses long threads with one click. Thread Recommendations surface posts based on your activity. Feedback and bug reports are always welcome!`,
        upvotes: 31,
        views: 512,
        isAnswered: false,
        repliesCount: 2,
      },
    }),
    prisma.forumPost.create({
      data: {
        userId: hannah.id,
        title: "What's the difference between Python lists and tuples?",
        content: `I keep seeing both lists and tuples in Python code and I'm confused about when to use which. They seem to do the same thing? Is there a practical difference beyond mutability?`,
        upvotes: 4,
        views: 55,
        isAnswered: true,
        repliesCount: 3,
      },
    }),
    // ── Additional posts (page 2 demo + variety) ───────────────────────────────
    prisma.forumPost.create({
      data: {
        userId: bob.id,
        title: 'How does JWT authentication work under the hood?',
        content: `I'm implementing login for my web project and everyone says to use JWT, but I don't really understand how it works. How does the server verify the token? Where should I store it on the client — localStorage or cookies? And what makes it "stateless"?`,
        upvotes: 18,
        views: 234,
        isAnswered: false,
        repliesCount: 0,
      },
    }),
    prisma.forumPost.create({
      data: {
        userId: diana.id,
        title: 'CSS Flexbox vs Grid — when to use which?',
        content: `I keep going back and forth between Flexbox and CSS Grid. My understanding is that Flexbox is one-dimensional for rows or columns while Grid is two-dimensional for both at once. But in practice they seem interchangeable a lot of the time. Can someone give me clear rules for when to reach for each?`,
        upvotes: 11,
        views: 167,
        isAnswered: true,
        repliesCount: 0,
      },
    }),
    prisma.forumPost.create({
      data: {
        userId: fiona.id,
        title: 'Getting started with Machine Learning — best first steps?',
        content: `I want to learn Machine Learning but the field feels overwhelming. There are so many frameworks (TensorFlow, PyTorch, scikit-learn), math prerequisites (linear algebra, stats, calculus), and online courses. Where should an intermediate Python developer actually start? What's the logical learning path?`,
        upvotes: 22,
        views: 318,
        isAnswered: false,
        repliesCount: 0,
      },
    }),
    prisma.forumPost.create({
      data: {
        userId: alice.id,
        title: 'Git branching strategies for small team projects',
        content: `Our team of 3 is building a web app for our final project and we keep stepping on each other with Git. We've had merge conflicts on main twice this week. What branching strategy is practical for a small team? Is Git Flow overkill for 3 people, or should we just use feature branches off main?`,
        upvotes: 9,
        views: 121,
        isAnswered: true,
        repliesCount: 0,
      },
    }),
    prisma.forumPost.create({
      data: {
        userId: carol.id,
        title: 'Study tips that actually worked for me in CS — share yours!',
        content: `After two years of CS here is what has actually worked for me. Active recall beats passive reading so close your notes and try to explain things from memory. Pomodoro timers keep focus sharp for coding. Rubber duck debugging out loud finds bugs faster than staring at the screen. Spaced repetition with Anki helps for algorithm patterns. Building a real project makes things stick far better than tutorials. What are your go-to strategies?`,
        upvotes: 27,
        views: 445,
        isAnswered: false,
        repliesCount: 0,
      },
    }),
    prisma.forumPost.create({
      data: {
        userId: george.id,
        title: 'Probability & statistics resources for CS students',
        content: `Probability and stats keep coming up in my CS coursework (machine learning, algorithm analysis, networking) and my maths background is weak. Which resources do you recommend that are specifically aimed at CS applications rather than pure maths? I want intuition, not proofs.`,
        upvotes: 14,
        views: 198,
        isAnswered: false,
        repliesCount: 0,
      },
    }),
  ])

  // ── Forum Replies ──────────────────────────────────────────────────────────
  console.warn('  Creating forum replies...')
  const replies = await Promise.all([
    // Post 0: useEffect async
    prisma.forumReply.create({
      data: {
        postId: posts[0].id,
        userId: carol.id,
        content:
          'You need to define the async function inside the effect and call it immediately. Create a named async function inside the useEffect callback, then invoke it right away. The outer callback stays synchronous so it returns nothing, which is why the cleanup warning goes away.',
        upvotes: 8,
        isAccepted: true,
      },
    }),
    prisma.forumReply.create({
      data: {
        postId: posts[0].id,
        userId: fiona.id,
        content:
          'You can also use an immediately invoked async function inside the effect for a more compact style. It achieves the same result as the named function approach, just in fewer lines.',
        upvotes: 4,
        isAccepted: false,
      },
    }),
    prisma.forumReply.create({
      data: {
        postId: posts[0].id,
        userId: george.id,
        content:
          "Also worth noting: add cleanup via AbortController if the component might unmount before the fetch completes — this prevents the 'state update on unmounted component' warning.",
        upvotes: 6,
        isAccepted: false,
      },
    }),

    // Post 1: Big O resources
    prisma.forumReply.create({
      data: {
        postId: posts[1].id,
        userId: carol.id,
        content:
          'Big-O Cheat Sheet (bigocheatsheet.com) is excellent for a quick reference. Combine it with LeetCode Easy problems — focus on understanding time/space complexity for each solution, not just getting it to pass.',
        upvotes: 7,
        isAccepted: false,
      },
    }),
    prisma.forumReply.create({
      data: {
        postId: posts[1].id,
        userId: george.id,
        content:
          'Visualgo.net has amazing animations for how different algorithms scale. Sometimes seeing it visually clicks better than reading about it.',
        upvotes: 5,
        isAccepted: false,
      },
    }),
    prisma.forumReply.create({
      data: {
        postId: posts[1].id,
        userId: evan.id,
        content:
          "CS50 on edX covers Big O really well in its early lectures. It's free and the explanations are very beginner-friendly.",
        upvotes: 3,
        isAccepted: false,
      },
    }),
    prisma.forumReply.create({
      data: {
        postId: posts[1].id,
        userId: alice.id,
        content:
          "One mental model that helped me: ask 'if I double the input size, how does the runtime change?' That maps directly to O(n), O(n²), O(log n), etc.",
        upvotes: 9,
        isAccepted: false,
      },
    }),

    // Post 2: TypeScript generics
    prisma.forumReply.create({
      data: {
        postId: posts[2].id,
        userId: fiona.id,
        content:
          'Use generics when you want type safety without losing reusability. A generic function like first(arr) can work with string arrays, number arrays, or any typed array while remaining fully safe. In production code, avoid any entirely and use unknown with type narrowing instead.',
        upvotes: 11,
        isAccepted: true,
      },
    }),
    prisma.forumReply.create({
      data: {
        postId: posts[2].id,
        userId: carol.id,
        content:
          'The any type is a code smell in TypeScript. The only acceptable exception is in test mocks where you genuinely do not care about types. For production code, generics are always the right choice over any.',
        upvotes: 7,
        isAccepted: false,
      },
    }),
    prisma.forumReply.create({
      data: {
        postId: posts[2].id,
        userId: alice.id,
        content:
          "Practical rule: if you find yourself writing the same function 3+ times with different type annotations, that's your signal to reach for generics.",
        upvotes: 5,
        isAccepted: false,
      },
    }),

    // Post 3: React Hooks Cheat Sheet
    prisma.forumReply.create({
      data: {
        postId: posts[3].id,
        userId: alice.id,
        content:
          'This is gold, thank you Carol! Would you consider adding useRef and useImperativeHandle? Those trip me up sometimes.',
        upvotes: 3,
        isAccepted: false,
      },
    }),
    prisma.forumReply.create({
      data: {
        postId: posts[3].id,
        userId: diana.id,
        content:
          'Saving this immediately! As a beginner this is incredibly helpful to have all in one place.',
        upvotes: 2,
        isAccepted: false,
      },
    }),

    // Post 4: Database normalisation
    prisma.forumReply.create({
      data: {
        postId: posts[4].id,
        userId: alice.id,
        content:
          "Really clear explanation! Quick question: is it always worth normalising to 3NF? I've heard sometimes denormalisation is done for performance?",
        upvotes: 4,
        isAccepted: false,
      },
    }),
    prisma.forumReply.create({
      data: {
        postId: posts[4].id,
        userId: george.id,
        content:
          'Great question Alice! In high-read scenarios like analytics dashboards, controlled denormalisation (star/snowflake schemas) is common to avoid expensive JOINs. But always start normalised and denormalise intentionally with measurements.',
        upvotes: 6,
        isAccepted: false,
      },
    }),
    prisma.forumReply.create({
      data: {
        postId: posts[4].id,
        userId: evan.id,
        content:
          'Worth mentioning BCNF (Boyce-Codd Normal Form) — a stronger form of 3NF. Most real-world designs target 3NF as the practical sweet spot.',
        upvotes: 2,
        isAccepted: false,
      },
    }),

    // Post 5: Recursion
    prisma.forumReply.create({
      data: {
        postId: posts[5].id,
        userId: carol.id,
        content:
          "Mental model: think of recursion as 'trust the function to work for smaller inputs.' Write the base case first (when does it stop?), then the recursive step (how does this problem relate to a slightly smaller version of itself?).",
        upvotes: 8,
        isAccepted: true,
      },
    }),
    prisma.forumReply.create({
      data: {
        postId: posts[5].id,
        userId: bob.id,
        content:
          'Draw the call stack on paper! For factorial(3): it calls factorial(2), which calls factorial(1), which returns 1. Then it unwinds: 1×2=2, 2×3=6. Seeing the stack visually was a breakthrough for me.',
        upvotes: 5,
        isAccepted: false,
      },
    }),
    prisma.forumReply.create({
      data: {
        postId: posts[5].id,
        userId: george.id,
        content:
          'Python Tutor (pythontutor.com) lets you step through recursive code visually. Highly recommended for visual learners.',
        upvotes: 3,
        isAccepted: false,
      },
    }),
    prisma.forumReply.create({
      data: {
        postId: posts[5].id,
        userId: fiona.id,
        content:
          'Once recursion clicks, try implementing a binary search tree — it makes inorder/preorder/postorder traversal feel natural.',
        upvotes: 4,
        isAccepted: false,
      },
    }),

    // Post 6: Platform update
    prisma.forumReply.create({
      data: {
        postId: posts[6].id,
        userId: carol.id,
        content:
          'The AI Tutor feature is amazing! It helped me debug a tricky React issue in minutes. Keep up the great work!',
        upvotes: 5,
        isAccepted: false,
      },
    }),
    prisma.forumReply.create({
      data: {
        postId: posts[6].id,
        userId: alice.id,
        content:
          "The forum recommendations are surprisingly accurate — it surfaced a TypeScript thread I'd been meaning to read.",
        upvotes: 3,
        isAccepted: false,
      },
    }),

    // Post 7: Python lists vs tuples
    prisma.forumReply.create({
      data: {
        postId: posts[7].id,
        userId: bob.id,
        content:
          'Key difference: lists are mutable so you can change elements after creation, but tuples are immutable so you cannot. Use tuples for fixed data like coordinates or RGB values. Use lists whenever you need to add, remove, or modify items.',
        upvotes: 6,
        isAccepted: true,
      },
    }),
    prisma.forumReply.create({
      data: {
        postId: posts[7].id,
        userId: fiona.id,
        content:
          "Practical tip: tuples are slightly faster and use less memory than lists. Also, tuples can be used as dictionary keys (they're hashable); lists cannot.",
        upvotes: 4,
        isAccepted: false,
      },
    }),
    prisma.forumReply.create({
      data: {
        postId: posts[7].id,
        userId: carol.id,
        content:
          'Named tuples from the collections module are a great middle ground, immutable like tuples but with named fields for readability. Worth looking up if you want the benefits of both.',
        upvotes: 3,
        isAccepted: false,
      },
    }),

    // Post 8: JWT authentication
    prisma.forumReply.create({
      data: {
        postId: posts[8].id,
        userId: carol.id,
        content:
          'JWT has three parts: a header with the algorithm, a payload with user claims and expiry, and a signature. The server re-signs the payload on each request to verify it without a database lookup, which is what makes it stateless. Store tokens in HttpOnly cookies, not localStorage, which is exposed to XSS attacks.',
        upvotes: 14,
        isAccepted: true,
      },
    }),
    prisma.forumReply.create({
      data: {
        postId: posts[8].id,
        userId: george.id,
        content:
          'One thing to know: JWTs cannot be invalidated before expiry unless you maintain a blocklist (which defeats the stateless benefit). For most apps, short expiry (15 min) + refresh tokens is the right pattern.',
        upvotes: 8,
        isAccepted: false,
      },
    }),

    // Post 9: CSS Flexbox vs Grid
    prisma.forumReply.create({
      data: {
        postId: posts[9].id,
        userId: fiona.id,
        content:
          'Rule of thumb: use Flexbox when you have items flowing in one direction like a nav bar, button row, or card list. Use Grid when you need to control rows and columns at the same time, like a page layout with a header, sidebar, and main content area.',
        upvotes: 13,
        isAccepted: true,
      },
    }),
    prisma.forumReply.create({
      data: {
        postId: posts[9].id,
        userId: alice.id,
        content:
          'CSS Tricks has the definitive guides for both. Flexbox guide and Grid guide — I keep both bookmarked.',
        upvotes: 5,
        isAccepted: false,
      },
    }),

    // Post 10: Machine Learning
    prisma.forumReply.create({
      data: {
        postId: posts[10].id,
        userId: george.id,
        content:
          "Start with 3Blue1Brown linear algebra on YouTube, then learn scikit-learn before touching PyTorch since it handles complexity so you can focus on understanding models. Andrew Ng's ML Specialisation on Coursera is still the best structured intro. Then do Kaggle competitions for practice with real data.",
        upvotes: 19,
        isAccepted: false,
      },
    }),

    // Post 11: Git branching
    prisma.forumReply.create({
      data: {
        postId: posts[11].id,
        userId: evan.id,
        content:
          'For 3 people, GitHub Flow is ideal: keep main always deployable, create a feature branch for each task, open a PR when done and have one teammate review, then merge and delete the branch. Git Flow with develop and release branches is overkill until you have a much larger team.',
        upvotes: 11,
        isAccepted: true,
      },
    }),
    prisma.forumReply.create({
      data: {
        postId: posts[11].id,
        userId: carol.id,
        content:
          'Also set branch protection on main so nobody can push directly, only merges via PR. It takes 30 seconds in GitHub settings and saves a lot of pain.',
        upvotes: 7,
        isAccepted: false,
      },
    }),

    // Post 12: Study tips
    prisma.forumReply.create({
      data: {
        postId: posts[12].id,
        userId: bob.id,
        content:
          "The rubber duck method is underrated. I actually keep a small rubber duck on my desk. My housemates think I'm weird but I solve more bugs talking to it than staring at the screen.",
        upvotes: 9,
        isAccepted: false,
      },
    }),
    prisma.forumReply.create({
      data: {
        postId: posts[12].id,
        userId: diana.id,
        content:
          "I use the Feynman technique: after studying something, I try to explain it in a paragraph like I'm teaching a beginner. The gaps in my explanation show exactly what I haven't actually understood yet.",
        upvotes: 12,
        isAccepted: false,
      },
    }),

    // Post 13: Probability & stats
    prisma.forumReply.create({
      data: {
        postId: posts[13].id,
        userId: carol.id,
        content:
          '"Probability for the Enthusiastic Beginner" by Morin is excellent — very intuitive, written specifically to build understanding rather than rigour. Also "Think Stats" by Allen Downey (free online) takes a code-first approach using Python, which suits CS students well.',
        upvotes: 10,
        isAccepted: false,
      },
    }),
  ])

  // ── Study Groups ───────────────────────────────────────────────────────────
  console.warn('  Creating study groups...')
  const [
    groupReact,
    groupAlgo,
    groupDB,
    groupPython,
    groupML,
    groupSecurity,
    groupTypeScript,
    groupMath,
    groupWebDev,
    groupOSS,
  ] = await Promise.all([
    prisma.studyGroup.create({
      data: {
        ownerId: carol.id,
        name: 'React Fundamentals',
        description:
          'A group for students learning React and modern front-end development. We hold weekly code reviews and share resources.',
        subject: 'Computer Science',
        maxMembers: 10,
        memberCount: 4,
      },
    }),
    prisma.studyGroup.create({
      data: {
        ownerId: george.id,
        name: 'Algorithm Prep',
        description:
          'Focused on data structures and algorithms for technical interviews. We solve LeetCode problems together twice a week.',
        subject: 'Mathematics',
        maxMembers: 8,
        memberCount: 3,
      },
    }),
    prisma.studyGroup.create({
      data: {
        ownerId: evan.id,
        name: 'Database Design',
        description:
          'Covering SQL, normalisation, query optimisation, and PostgreSQL best practices. Open to all levels.',
        subject: 'Sciences',
        maxMembers: 12,
        memberCount: 5,
      },
    }),
    prisma.studyGroup.create({
      data: {
        ownerId: hannah.id,
        name: 'Python Basics',
        description:
          'A beginner-friendly group for students learning Python from scratch. We work through problems together and share tips for writing clean, Pythonic code.',
        subject: 'Computer Science',
        maxMembers: 15,
        memberCount: 4,
      },
    }),
    prisma.studyGroup.create({
      data: {
        ownerId: fiona.id,
        name: 'Machine Learning Study Circle',
        description:
          "Reading group working through Andrew Ng's ML Specialisation and building small projects. We meet weekly to discuss concepts and code together.",
        subject: 'Computer Science',
        maxMembers: 8,
        memberCount: 3,
      },
    }),
    prisma.studyGroup.create({
      data: {
        ownerId: evan.id,
        name: 'Web Security & OWASP',
        description:
          'Learning web application security: XSS, CSRF, SQL injection, authentication flaws, and how to defend against them. We review real CVEs and run CTF-style exercises.',
        subject: 'Computer Science',
        maxMembers: 10,
        memberCount: 3,
      },
    }),
    prisma.studyGroup.create({
      data: {
        ownerId: alice.id,
        name: 'TypeScript Deep Dive',
        description:
          'For developers who know basic TypeScript and want to go further: generics, conditional types, decorators, and building type-safe APIs. Project-driven learning.',
        subject: 'Computer Science',
        maxMembers: 8,
        memberCount: 3,
      },
    }),
    prisma.studyGroup.create({
      data: {
        ownerId: george.id,
        name: 'Mathematics for CS',
        description:
          'Discrete mathematics, linear algebra, and probability theory with a CS focus. We work through problem sets and explain concepts to each other.',
        subject: 'Mathematics',
        maxMembers: 10,
        memberCount: 4,
      },
    }),
    prisma.studyGroup.create({
      data: {
        ownerId: carol.id,
        name: 'Full-Stack Web Development',
        description:
          'Building complete web applications from database to UI. Current stack: Next.js + Prisma + PostgreSQL. Weekly project builds and code reviews.',
        subject: 'Engineering',
        maxMembers: 12,
        memberCount: 5,
      },
    }),
    prisma.studyGroup.create({
      data: {
        ownerId: bob.id,
        name: 'Open Source Contributors',
        description:
          'Finding and contributing to open-source projects. Learn git collaboration, PR workflows, and how to navigate large codebases.',
        subject: 'Engineering',
        maxMembers: 20,
        memberCount: 3,
      },
    }),
  ])

  // ── Study Group Members ────────────────────────────────────────────────────
  console.warn('  Adding study group members...')
  await Promise.all([
    // React group: carol (owner) + alice, fiona, diana
    prisma.studyGroupMember.create({
      data: { groupId: groupReact.id, userId: carol.id, role: 'admin' },
    }),
    prisma.studyGroupMember.create({
      data: { groupId: groupReact.id, userId: alice.id, role: 'member' },
    }),
    prisma.studyGroupMember.create({
      data: { groupId: groupReact.id, userId: fiona.id, role: 'member' },
    }),
    prisma.studyGroupMember.create({
      data: { groupId: groupReact.id, userId: diana.id, role: 'member' },
    }),
    // Algorithm group: george (owner) + bob, fiona
    prisma.studyGroupMember.create({
      data: { groupId: groupAlgo.id, userId: george.id, role: 'admin' },
    }),
    prisma.studyGroupMember.create({
      data: { groupId: groupAlgo.id, userId: bob.id, role: 'member' },
    }),
    prisma.studyGroupMember.create({
      data: { groupId: groupAlgo.id, userId: fiona.id, role: 'member' },
    }),
    // Database group: evan (owner) + george, alice, bob, hannah
    prisma.studyGroupMember.create({
      data: { groupId: groupDB.id, userId: evan.id, role: 'admin' },
    }),
    prisma.studyGroupMember.create({
      data: { groupId: groupDB.id, userId: george.id, role: 'member' },
    }),
    prisma.studyGroupMember.create({
      data: { groupId: groupDB.id, userId: alice.id, role: 'member' },
    }),
    prisma.studyGroupMember.create({
      data: { groupId: groupDB.id, userId: bob.id, role: 'member' },
    }),
    prisma.studyGroupMember.create({
      data: { groupId: groupDB.id, userId: hannah.id, role: 'member' },
    }),

    // Python Basics: hannah (owner) + alice, bob, diana
    prisma.studyGroupMember.create({
      data: { groupId: groupPython.id, userId: hannah.id, role: 'admin' },
    }),
    prisma.studyGroupMember.create({
      data: { groupId: groupPython.id, userId: alice.id, role: 'member' },
    }),
    prisma.studyGroupMember.create({
      data: { groupId: groupPython.id, userId: bob.id, role: 'member' },
    }),
    prisma.studyGroupMember.create({
      data: { groupId: groupPython.id, userId: diana.id, role: 'member' },
    }),

    // ML Study Circle: fiona (owner) + george, bob
    prisma.studyGroupMember.create({
      data: { groupId: groupML.id, userId: fiona.id, role: 'admin' },
    }),
    prisma.studyGroupMember.create({
      data: { groupId: groupML.id, userId: george.id, role: 'member' },
    }),
    prisma.studyGroupMember.create({
      data: { groupId: groupML.id, userId: bob.id, role: 'member' },
    }),

    // Web Security & OWASP: evan (owner) + alice, carol
    prisma.studyGroupMember.create({
      data: { groupId: groupSecurity.id, userId: evan.id, role: 'admin' },
    }),
    prisma.studyGroupMember.create({
      data: { groupId: groupSecurity.id, userId: alice.id, role: 'member' },
    }),
    prisma.studyGroupMember.create({
      data: { groupId: groupSecurity.id, userId: carol.id, role: 'member' },
    }),

    // TypeScript Deep Dive: alice (owner) + fiona, carol
    prisma.studyGroupMember.create({
      data: { groupId: groupTypeScript.id, userId: alice.id, role: 'admin' },
    }),
    prisma.studyGroupMember.create({
      data: { groupId: groupTypeScript.id, userId: fiona.id, role: 'member' },
    }),
    prisma.studyGroupMember.create({
      data: { groupId: groupTypeScript.id, userId: carol.id, role: 'member' },
    }),

    // Mathematics for CS: george (owner) + bob, diana, hannah
    prisma.studyGroupMember.create({
      data: { groupId: groupMath.id, userId: george.id, role: 'admin' },
    }),
    prisma.studyGroupMember.create({
      data: { groupId: groupMath.id, userId: bob.id, role: 'member' },
    }),
    prisma.studyGroupMember.create({
      data: { groupId: groupMath.id, userId: diana.id, role: 'member' },
    }),
    prisma.studyGroupMember.create({
      data: { groupId: groupMath.id, userId: hannah.id, role: 'member' },
    }),

    // Full-Stack Web Dev: carol (owner) + alice, fiona, diana, evan
    prisma.studyGroupMember.create({
      data: { groupId: groupWebDev.id, userId: carol.id, role: 'admin' },
    }),
    prisma.studyGroupMember.create({
      data: { groupId: groupWebDev.id, userId: alice.id, role: 'member' },
    }),
    prisma.studyGroupMember.create({
      data: { groupId: groupWebDev.id, userId: fiona.id, role: 'member' },
    }),
    prisma.studyGroupMember.create({
      data: { groupId: groupWebDev.id, userId: diana.id, role: 'member' },
    }),
    prisma.studyGroupMember.create({
      data: { groupId: groupWebDev.id, userId: evan.id, role: 'member' },
    }),

    // Open Source Contributors: bob (owner) + alice, fiona
    prisma.studyGroupMember.create({
      data: { groupId: groupOSS.id, userId: bob.id, role: 'admin' },
    }),
    prisma.studyGroupMember.create({
      data: { groupId: groupOSS.id, userId: alice.id, role: 'member' },
    }),
    prisma.studyGroupMember.create({
      data: { groupId: groupOSS.id, userId: fiona.id, role: 'member' },
    }),
  ])

  // ── Study Materials ────────────────────────────────────────────────────────
  // Seed intentionally empty — upload real files via the Upload Material button after deployment.

  // ── Direct Messages ────────────────────────────────────────────────────────
  console.warn('  Creating direct messages...')
  await Promise.all([
    prisma.chatMessage.create({
      data: {
        senderId: alice.id,
        recipientId: carol.id,
        content:
          "Hey Carol! Could you take a look at my React project? I'm having trouble with context and prop drilling.",
        role: 'user',
        isRead: true,
      },
    }),
    prisma.chatMessage.create({
      data: {
        senderId: carol.id,
        recipientId: alice.id,
        content:
          "Sure! Share the repo link and I'll have a look. Generally if you're more than 2-3 levels deep, Context API is the right call.",
        role: 'user',
        isRead: true,
      },
    }),
    prisma.chatMessage.create({
      data: {
        senderId: alice.id,
        recipientId: carol.id,
        content:
          "https://github.com/alice/my-react-app — thanks so much! It's the UserDashboard component that's the main issue.",
        role: 'user',
        isRead: false,
      },
    }),

    prisma.chatMessage.create({
      data: {
        senderId: bob.id,
        recipientId: fiona.id,
        content: 'Hey Fiona, are you coming to the Algorithm Prep group session tonight?',
        role: 'user',
        isRead: true,
      },
    }),
    prisma.chatMessage.create({
      data: {
        senderId: fiona.id,
        recipientId: bob.id,
        content: "Yes! 7pm right? I've been working on the binary tree problems from last week.",
        role: 'user',
        isRead: true,
      },
    }),

    prisma.chatMessage.create({
      data: {
        senderId: diana.id,
        recipientId: george.id,
        content:
          'Hi George, I read your normalisation post and it was really helpful! Do you offer tutoring sessions?',
        role: 'user',
        isRead: true,
      },
    }),
    prisma.chatMessage.create({
      data: {
        senderId: george.id,
        recipientId: diana.id,
        content:
          'Hi Diana! Yes I do — check my tutor profile for availability. Happy to help with database concepts!',
        role: 'user',
        isRead: true,
      },
    }),
  ])

  // ── Study Group Messages ───────────────────────────────────────────────────
  console.warn('  Creating study group messages...')
  await Promise.all([
    // React group chat
    prisma.studyGroupMessage.create({
      data: {
        groupId: groupReact.id,
        senderId: carol.id,
        content:
          "Welcome everyone! This week we're covering custom hooks. Please read the React docs section on hooks before our session.",
      },
    }),
    prisma.studyGroupMessage.create({
      data: {
        groupId: groupReact.id,
        senderId: alice.id,
        content: 'Done! I had a question about useCallback vs useMemo — can we cover that too?',
      },
    }),
    prisma.studyGroupMessage.create({
      data: {
        groupId: groupReact.id,
        senderId: fiona.id,
        content:
          'Same question as Alice! Also, can someone share the Codesandbox link from last week?',
      },
    }),
    prisma.studyGroupMessage.create({
      data: {
        groupId: groupReact.id,
        senderId: carol.id,
        content:
          "Great questions! Yes, we'll cover useCallback vs useMemo. Here's last week's sandbox: https://codesandbox.io/s/hooks-demo-2026",
      },
    }),
    prisma.studyGroupMessage.create({
      data: {
        groupId: groupReact.id,
        senderId: diana.id,
        content:
          'Thanks Carol! Should we also bring our current projects? I have a component with serious re-render issues.',
      },
    }),

    // Algorithm group chat
    prisma.studyGroupMessage.create({
      data: {
        groupId: groupAlgo.id,
        senderId: george.id,
        content:
          "Tonight's problems: binary tree level-order traversal (BFS) and longest common subsequence. Medium difficulty both.",
      },
    }),
    prisma.studyGroupMessage.create({
      data: {
        groupId: groupAlgo.id,
        senderId: bob.id,
        content:
          'I managed BFS but DP is still tricky for me. Will we walk through the recurrence relation?',
      },
    }),
    prisma.studyGroupMessage.create({
      data: {
        groupId: groupAlgo.id,
        senderId: fiona.id,
        content:
          'Same — DP is my weak spot. George do you have a template you use for these problems?',
      },
    }),
    prisma.studyGroupMessage.create({
      data: {
        groupId: groupAlgo.id,
        senderId: george.id,
        content:
          "Yes! I'll share my DP problem-solving template at the start of the session. See you all at 6pm!",
      },
    }),

    // Database group chat
    prisma.studyGroupMessage.create({
      data: {
        groupId: groupDB.id,
        senderId: evan.id,
        content:
          'Reminder: bring your schema designs for review this Thursday. No judgement — the messier the better for learning!',
      },
    }),
    prisma.studyGroupMessage.create({
      data: {
        groupId: groupDB.id,
        senderId: george.id,
        content:
          "I'll bring the normalisation exercise I've been working on. It's a nightmare right now — lots of redundancy.",
      },
    }),
    prisma.studyGroupMessage.create({
      data: {
        groupId: groupDB.id,
        senderId: alice.id,
        content:
          "Mine too! I have a many-to-many relationship I can't figure out how to model cleanly.",
      },
    }),
    prisma.studyGroupMessage.create({
      data: {
        groupId: groupDB.id,
        senderId: hannah.id,
        content: 'Quick question — is 3NF always the goal or sometimes 2NF is fine?',
      },
    }),
    prisma.studyGroupMessage.create({
      data: {
        groupId: groupDB.id,
        senderId: evan.id,
        content:
          "Great question Hannah! Short answer: OLTP systems aim for 3NF, analytical/read-heavy systems sometimes denormalise intentionally. We'll cover this Thursday.",
      },
    }),
  ])

  // ── Events ─────────────────────────────────────────────────────────────────
  console.warn('  Creating events...')
  await Promise.all([
    prisma.event.create({
      data: {
        userId: carol.id,
        title: 'React Study Group — Weekly Session',
        description: 'This week we cover custom hooks and the Context API. Bring your questions!',
        date: daysFromNow(2),
        startTime: '14:00',
        endTime: '15:30',
        category: 'Study Group',
      },
    }),
    prisma.event.create({
      data: {
        userId: george.id,
        title: 'Algorithm Prep — LeetCode Session',
        description:
          'Trees and graphs focus. We will solve 3 problems together and discuss optimal solutions.',
        date: daysFromNow(4),
        startTime: '18:00',
        endTime: '19:30',
        category: 'Study Group',
      },
    }),
    prisma.event.create({
      data: {
        userId: evan.id,
        title: 'Database Design — Schema Review',
        description:
          'Bring your current schema design for group review and feedback. All DB topics welcome.',
        date: daysFromNow(3),
        startTime: '19:00',
        endTime: '20:00',
        category: 'Study Group',
      },
    }),
    prisma.event.create({
      data: {
        userId: george.id,
        title: 'Tutoring: SQL & Query Optimisation',
        description:
          '1-on-1 and small group tutoring session. Topics: EXPLAIN ANALYZE, indexing strategies, query rewrites.',
        date: daysFromNow(5),
        startTime: '16:00',
        endTime: '17:00',
        category: 'Tutoring',
      },
    }),
    prisma.event.create({
      data: {
        userId: alice.id,
        title: 'TypeScript Workshop — Advanced Types',
        description:
          'Workshop covering generics, conditional types, and mapped types. Intermediate level.',
        date: daysFromNow(7),
        startTime: '13:00',
        endTime: '14:30',
        category: 'Workshop',
      },
    }),
    prisma.event.create({
      data: {
        userId: fiona.id,
        title: 'ML Study Circle — scikit-learn Hands-on',
        description:
          'Building our first classification model with scikit-learn. Bring a laptop with Python and the starter notebook. No prior ML experience required.',
        date: daysFromNow(6),
        startTime: '15:00',
        endTime: '17:00',
        category: 'Study Group',
      },
    }),
    prisma.event.create({
      data: {
        userId: hannah.id,
        title: 'Python Basics — Lists, Loops & Functions',
        description:
          'Beginner-friendly session covering Python fundamentals: lists, for loops, while loops, and writing your first functions. Perfect for first-year students.',
        date: daysFromNow(1),
        startTime: '10:00',
        endTime: '11:30',
        category: 'Study Group',
      },
    }),
    prisma.event.create({
      data: {
        userId: evan.id,
        title: 'Security CTF Challenge Night',
        description:
          "Capture The Flag challenge evening! We'll work through web exploitation and cryptography challenges as a team. No experience needed — great intro to security.",
        date: daysFromNow(10),
        startTime: '19:00',
        endTime: '21:00',
        category: 'Workshop',
      },
    }),
    prisma.event.create({
      data: {
        userId: carol.id,
        title: 'Tutoring: React Hooks & State Management',
        description:
          'Open tutoring session on React state management patterns: useState, useReducer, Context API, and when to use each. Bring your code if you have specific questions.',
        date: daysFromNow(8),
        startTime: '14:00',
        endTime: '15:00',
        category: 'Tutoring',
      },
    }),
  ])

  // ── Connections ────────────────────────────────────────────────────────────
  console.warn('  Creating user connections...')
  await Promise.all([
    // Accepted connections
    prisma.connection.create({
      data: { senderId: alice.id, recipientId: carol.id, status: 'ACCEPTED' },
    }),
    prisma.connection.create({
      data: { senderId: alice.id, recipientId: fiona.id, status: 'ACCEPTED' },
    }),
    prisma.connection.create({
      data: { senderId: bob.id, recipientId: george.id, status: 'ACCEPTED' },
    }),
    prisma.connection.create({
      data: { senderId: bob.id, recipientId: fiona.id, status: 'ACCEPTED' },
    }),
    prisma.connection.create({
      data: { senderId: diana.id, recipientId: carol.id, status: 'ACCEPTED' },
    }),
    prisma.connection.create({
      data: { senderId: hannah.id, recipientId: alice.id, status: 'ACCEPTED' },
    }),
    // Pending requests
    prisma.connection.create({
      data: { senderId: diana.id, recipientId: george.id, status: 'PENDING' },
    }),
    prisma.connection.create({
      data: { senderId: fiona.id, recipientId: evan.id, status: 'PENDING' },
    }),
  ])

  // ── Flagged Content (moderation demo) ─────────────────────────────────────
  console.warn('  Creating flagged content examples...')
  await Promise.all([
    // Pending flags (visible in moderation queue)
    prisma.flaggedContent.create({
      data: {
        reporterId: hannah.id,
        contentType: 'post',
        contentId: posts[1].id,
        reason:
          'Possible spam — post contains multiple promotional links to external tutoring services.',
        status: 'pending',
      },
    }),
    prisma.flaggedContent.create({
      data: {
        reporterId: diana.id,
        contentType: 'post',
        contentId: posts[3].id,
        reason: 'Off-topic content unrelated to academics.',
        status: 'pending',
      },
    }),
    prisma.flaggedContent.create({
      data: {
        reporterId: fiona.id,
        contentType: 'reply',
        contentId: replies[2].id,
        reason: 'Suspected AI-generated content without disclosure.',
        status: 'pending',
      },
    }),
    prisma.flaggedContent.create({
      data: {
        reporterId: george.id,
        contentType: 'reply',
        contentId: replies[7].id,
        reason: 'Reply contains offensive language towards the original poster.',
        status: 'pending',
      },
    }),
    prisma.flaggedContent.create({
      data: {
        reporterId: hannah.id,
        contentType: 'post',
        contentId: posts[5].id,
        reason: 'Duplicate post — identical content already exists.',
        status: 'pending',
      },
    }),
    // Resolved flag (for history)
    prisma.flaggedContent.create({
      data: {
        reporterId: diana.id,
        contentType: 'reply',
        contentId: replies[4].id,
        reason: 'Reply contains offensive language towards the original poster.',
        status: 'resolved',
        resolvedBy: evan.id,
        resolution: 'Content reviewed — no policy violation found. Reporter notified.',
        resolvedAt: new Date(),
      },
    }),
  ])

  // ── Moderation Logs ────────────────────────────────────────────────────────
  console.warn('  Creating moderation logs...')
  const daysAgo = (n: number) => {
    const d = new Date()
    d.setDate(d.getDate() - n)
    return d
  }
  await Promise.all([
    prisma.moderationLog.create({
      data: {
        actorId: evan.id,
        action: 'FLAG_RESOLVED',
        targetId: posts[1].id,
        targetType: 'ForumPost',
        reason: 'Reviewed — no policy violation found. Flag dismissed.',
        createdAt: daysAgo(13),
      },
    }),
    prisma.moderationLog.create({
      data: {
        actorId: evan.id,
        action: 'CONTENT_DELETED',
        targetId: replies[4].id,
        targetType: 'ForumReply',
        reason: 'Removed after review — confirmed community guidelines violation.',
        createdAt: daysAgo(9),
      },
    }),
    prisma.moderationLog.create({
      data: {
        actorId: carol.id,
        action: 'FLAG_RESOLVED',
        targetId: posts[8].id,
        targetType: 'ForumPost',
        reason: 'Checked — posts cover different angles. Flag dismissed.',
        createdAt: daysAgo(6),
      },
    }),
    prisma.moderationLog.create({
      data: {
        actorId: evan.id,
        action: 'FLAG_RESOLVED',
        targetId: posts[12].id,
        targetType: 'ForumPost',
        reason: 'Study strategies are on-topic. Flag dismissed.',
        createdAt: daysAgo(3),
      },
    }),
    prisma.moderationLog.create({
      data: {
        actorId: evan.id,
        action: 'CONTENT_DELETED',
        targetId: replies[14].id,
        targetType: 'ForumReply',
        reason: 'Removed per platform policy on undisclosed AI-generated responses.',
        createdAt: daysAgo(1),
      },
    }),
  ])

  // ── Notifications ──────────────────────────────────────────────────────────
  // Mirrors real seeded activity (pending connections, unread DMs, forum replies)
  // so each demo account shows a realistic bell badge on login.
  // NOTE: Notification has @@unique([userId, sourceType, sourceId]); keys below are
  // distinct per user. (event notifications are generated lazily on poll, not seeded.)
  console.warn('  Creating notifications...')
  const hoursAgo = (n: number) => new Date(Date.now() - n * 60 * 60 * 1000)
  await prisma.notification.createMany({
    data: [
      // Evan (OWNER) — primary demo login
      {
        userId: evan.id,
        type: 'connection_request',
        message: 'Fiona Lee sent you a connection request',
        sourceType: 'connection_request',
        sourceId: fiona.id,
        isRead: false,
        createdAt: hoursAgo(2),
      },
      {
        userId: evan.id,
        type: 'forum_reply',
        message: `Carol Williams replied to your post "${posts[6].title.slice(0, 50)}"`,
        sourceType: 'forum_reply',
        sourceId: posts[6].id,
        isRead: false,
        createdAt: hoursAgo(6),
      },
      // Alice (STUDENT) — demo login
      {
        userId: alice.id,
        type: 'forum_reply',
        message: `Carol Williams replied to your post "${posts[0].title.slice(0, 50)}"`,
        sourceType: 'forum_reply',
        sourceId: posts[0].id,
        isRead: false,
        createdAt: hoursAgo(1),
      },
      {
        userId: alice.id,
        type: 'connection_request',
        message: 'Hannah Johnson sent you a connection request',
        sourceType: 'connection_request',
        sourceId: hannah.id,
        isRead: true,
        createdAt: hoursAgo(50),
      },
      // Carol (MODERATOR / tutor) — demo login
      {
        userId: carol.id,
        type: 'chat',
        message: 'Alice Chen sent you a message',
        sourceType: 'chat',
        sourceId: alice.id,
        isRead: false,
        createdAt: hoursAgo(3),
      },
      {
        userId: carol.id,
        type: 'forum_reply',
        message: `Diana Martinez replied to your post "${posts[3].title.slice(0, 50)}"`,
        sourceType: 'forum_reply',
        sourceId: posts[3].id,
        isRead: true,
        createdAt: hoursAgo(20),
      },
      // George (MODERATOR / tutor)
      {
        userId: george.id,
        type: 'connection_request',
        message: 'Diana Martinez sent you a connection request',
        sourceType: 'connection_request',
        sourceId: diana.id,
        isRead: false,
        createdAt: hoursAgo(8),
      },
      {
        userId: george.id,
        type: 'chat',
        message: 'Diana Martinez sent you a message',
        sourceType: 'chat',
        sourceId: diana.id,
        isRead: true,
        createdAt: hoursAgo(30),
      },
      // Bob (STUDENT)
      {
        userId: bob.id,
        type: 'forum_reply',
        message: `Carol Williams replied to your post "${posts[1].title.slice(0, 50)}"`,
        sourceType: 'forum_reply',
        sourceId: posts[1].id,
        isRead: false,
        createdAt: hoursAgo(4),
      },
      {
        userId: bob.id,
        type: 'chat',
        message: 'Fiona Lee sent you a message',
        sourceType: 'chat',
        sourceId: fiona.id,
        isRead: true,
        createdAt: hoursAgo(26),
      },
      // Diana (STUDENT)
      {
        userId: diana.id,
        type: 'forum_reply',
        message: `Carol Williams replied to your post "${posts[5].title.slice(0, 50)}"`,
        sourceType: 'forum_reply',
        sourceId: posts[5].id,
        isRead: false,
        createdAt: hoursAgo(7),
      },
      // Fiona (STUDENT)
      {
        userId: fiona.id,
        type: 'forum_reply',
        message: `Carol Williams replied to your post "${posts[2].title.slice(0, 50)}"`,
        sourceType: 'forum_reply',
        sourceId: posts[2].id,
        isRead: true,
        createdAt: hoursAgo(40),
      },
    ],
    skipDuplicates: true,
  })

  // ── Summary ────────────────────────────────────────────────────────────────
  console.warn('\n✅  Seed complete!\n')
  console.warn('  Seeded:')
  console.warn(`    ${8} users (1 owner, 2 moderators, 5 students)`)
  console.warn(`    ${8} user profiles`)
  console.warn(`    ${8} auth accounts`)
  console.warn(`    ${posts.length} forum posts (2 pages at limit=10)`)
  console.warn(`    ${replies.length} forum replies`)
  console.warn(`    10 study groups + members`)
  console.warn(`    0 study materials (upload via UI after deployment)`)
  console.warn(`    7 direct messages`)
  console.warn(`    14 study group messages (React/Algo/DB groups)`)
  console.warn(`    9 events`)
  console.warn(`    8 user connections (6 accepted, 2 pending)`)
  console.warn(`    6 flagged content records (5 pending, 1 resolved)`)
  console.warn(`    5 moderation log entries`)
  console.warn(`    11 notifications (7 unread across demo accounts)`)
  console.warn('\n  Login credentials (all accounts use password: password)')
  console.warn('    owner  → evan@classmate.dev')
  console.warn('    tutor  → carol@classmate.dev or george@classmate.dev')
  console.warn('    student→ alice@classmate.dev or bob@classmate.dev')
}

main()
  .catch((e) => {
    console.error('❌  Seed failed:', e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())

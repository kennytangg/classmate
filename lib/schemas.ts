import { z } from 'zod'

// ── Forums ─────────────────────────────────────────────────────────────────
export const createPostSchema = z.object({
  title: z.string().min(1).max(300),
  content: z.string().min(1).max(20000),
  tags: z.array(z.string().max(50)).max(10).optional(),
})

export const updatePostSchema = z.object({
  title: z.string().min(1).max(300).optional(),
  content: z.string().min(1).max(20000).optional(),
  category: z.string().max(100).optional(),
})

export const deleteWithReasonSchema = z.object({
  reason: z.string().max(500).optional(),
})

export const createReplySchema = z.object({
  postId: z.string().min(1),
  content: z.string().min(1).max(10000),
})

export const updateReplySchema = z.object({
  content: z.string({ error: 'content is required' }).min(1, 'content is required').max(10000),
})

// ── Study Groups ───────────────────────────────────────────────────────────
export const createStudyGroupSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  subject: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  isPrivate: z.boolean().optional().default(false),
})

export const studyGroupMessageSchema = z.object({
  content: z.string().max(5000).default(''),
  fileUrl: z.string().min(1).max(2048).optional(),
  fileName: z.string().max(255).optional(),
  fileType: z.string().max(100).optional(),
  fileSize: z
    .number()
    .int()
    .positive()
    .max(10 * 1024 * 1024)
    .optional(),
})

export const joinGroupSchema = z.object({
  inviteCode: z.string().max(20).optional(),
})

// ── Connections ────────────────────────────────────────────────────────────
export const createConnectionSchema = z.object({
  recipientId: z.string({ error: 'recipientId is required' }).min(1, 'recipientId is required'),
})

export const updateConnectionSchema = z.object({
  status: z.enum(['ACCEPTED', 'REJECTED'], {
    message: 'Status must be ACCEPTED or REJECTED',
  }),
})

// ── Messages ───────────────────────────────────────────────────────────────
export const sendMessageSchema = z.object({
  content: z.string().max(5000).default(''),
  fileUrl: z.string().min(1).max(2048).optional(),
  fileName: z.string().max(255).optional(),
  fileType: z.string().max(100).optional(),
  fileSize: z
    .number()
    .int()
    .positive()
    .max(10 * 1024 * 1024)
    .optional(),
})

// ── Events ─────────────────────────────────────────────────────────────────
export const createEventSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(2000).optional().nullable(),
  date: z.string().min(1),
  startTime: z.string().optional().nullable(),
  endTime: z.string().optional().nullable(),
  category: z.string().max(100).optional().nullable(),
  isPublic: z.boolean().optional(),
  studyGroupId: z.string().optional().nullable(),
})

export const updateEventSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(2000).optional().nullable(),
  date: z.string().optional(),
  startTime: z.string().optional().nullable(),
  endTime: z.string().optional().nullable(),
  category: z.string().max(100).optional().nullable(),
  isPublic: z.boolean().optional(),
})

// ── User Profile ───────────────────────────────────────────────────────────
export const updateProfileSchema = z.object({
  userId: z.string().min(1),
  displayName: z
    .string()
    .min(2, 'Display name must be at least 2 characters')
    .max(50)
    .optional()
    .nullable(),
  bio: z.string().max(500, 'Bio must be 500 characters or less').optional().nullable(),
  university: z.string().max(100).optional().nullable(),
  major: z.string().max(100).optional().nullable(),
  avatarUrl: z.string().url().optional().nullable(),
})

// ── Chat / AI Tutor ────────────────────────────────────────────────────────
const chatMessageSchema = z.object({
  role: z.string(),
  content: z.string().max(10000),
})

export const chatRequestSchema = z.object({
  messages: z.array(chatMessageSchema).min(1).max(100),
  sessionId: z.string().optional(),
})

// ── Sessions ───────────────────────────────────────────────────────────────
export const createSessionSchema = z.object({
  title: z.string().max(200).optional(),
  subject: z.string().max(100).optional(),
})

// ── Moderation ─────────────────────────────────────────────────────────────
export const flagContentSchema = z.object({
  contentType: z.enum(['post', 'reply', 'message', 'group_message']),
  contentId: z.string().min(1),
  reason: z.string().min(1).max(1000),
})

export const resolveFlagSchema = z.object({
  flagId: z.string().min(1),
  action: z.enum(['dismiss', 'remove']),
  reason: z.string().max(500).optional(),
})

export const moderateContentSchema = z.object({
  content: z.string({ error: 'content required' }).min(1, 'content required').max(10000),
})

// ── Summarize ──────────────────────────────────────────────────────────────
export const summarizeSchema = z.object({
  thread: z
    .string({ error: 'thread content required' })
    .min(1, 'thread content required')
    .max(50000),
})

// ── Materials ──────────────────────────────────────────────────────────────
export const updateMaterialSchema = z.object({
  title: z.string().min(1).max(300).optional(),
  description: z.string().max(2000).optional().nullable(),
  subject: z.string().max(100).optional().nullable(),
})

// ── Admin ──────────────────────────────────────────────────────────────────
export const updateUserRoleSchema = z.object({
  role: z.enum(['STUDENT', 'MODERATOR', 'ADMIN']),
})

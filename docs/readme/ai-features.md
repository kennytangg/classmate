# 8. AI Features

[← Back to README](../../README.md)

---

## 8.1 AI Provider & Overview

**Provider:** BINUS Local LLM (Ollama)  
**Model:** `llama3.1:8b`  
**Endpoint:** `https://ollama.csbihub.id/v1/chat/completions`  
**Auth:** None required (internal network endpoint)  
**Protocol:** OpenAI-compatible REST API

Classmate integrates four AI features, all powered by the BINUS-hosted Ollama instance except Thread Recommendations, which uses a pure algorithmic scoring function with no external AI calls.

---

## 8.2 AI Feature List

| AI Feature                | Purpose                                                      | Rate Limit  |
| :------------------------ | :----------------------------------------------------------- | :---------- |
| AI Tutor (Chat Assistant) | On-demand academic Q&A chatbot for students                  | 20 req/hr   |
| AI Content Moderation     | Automatic screening of every forum post/reply before saving  | 20 req/hr   |
| AI Thread Summarization   | Summarize long forum threads into key points                 | 20 req/hr   |
| AI Thread Recommendations | Personalize thread feed based on user activity (algorithmic) | 100 req/min |

---

## 8.3 AI Integration Flows

### AI Tutor Chat

**Files:** `app/api/chat/route.ts`, `lib/moderation.ts`, `components/features/ai-tutor/`

```
User types message in chat UI
  → POST /api/chat  (auth required)
  → Rate limit check (aiLimiter: 20 req/hr)
  → Moderate message (moderateContent)
  → Save user message to DB
  → Stream response from Ollama (llama3.1:8b)
  → Accumulate and save assistant message to DB
  → Return streaming Response
```

**System Prompt:** Uses Socratic method to guide students to answers rather than giving them directly. Formats output in Markdown with code blocks, shows work step-by-step, and keeps responses concise and scannable.

**Failure handling:** If Ollama is unavailable → `503 AI service temporarily unavailable`. UI shows error and disables send until retry.

---

### AI Content Moderation

**Files:** `lib/moderation.ts` (applied in `app/api/chat/route.ts`, `app/api/forums/posts/route.ts`, `app/api/forums/replies/route.ts`)

```
User submits content (forum post, reply, chat message)
  → Moderate message BEFORE DB write
  → Classify: toxicity_score, spam_score, categories
  → Decision: approve | warn | block
  → If block → return 400 "Content violates community guidelines"
  → If approve/warn → proceed to save to DB
```

**Scoring Thresholds:**

- `approve` — toxicity < 30, spam < 40
- `warn` — toxicity 30–60, spam 40–70
- `block` — toxicity > 60, spam > 70

**Detected Categories:** `harassment`, `hate_speech`, `spam`, `off_topic`, `inappropriate`, `sexual_content`, `violence`, `self_harm`

**Key Design Decision — Fail-Closed:** Any Ollama error or malformed response defaults to `block`. Safety is prioritized over availability.

---

### AI Thread Summarization

**Files:** `app/api/summarize/route.ts`, `components/features/forums/SummarizeButton.tsx`

```
User clicks "Summarize" on a forum post
  → POST /api/summarize  (auth required)
  → Rate limit check (aiLimiter: 20 req/hr)
  → Call Ollama (non-streaming, max_tokens: 200, temp: 0.5)
  → Return 2–3 sentence summary
  → Displayed in collapsible card above replies
```

**Failure handling:** If Ollama is unavailable → toast error shown, summary card hidden.

---

### AI Thread Recommendations

**Files:** `lib/recommendations.ts`, `app/api/recommendations/threads/route.ts`

```
User visits /forums
  → GET /api/recommendations/threads  (auth required)
  → Fetch user's recent posts (categories + tags)
  → Score all flagged content by:
      • Recency (max 30 points)
      • Engagement (upvotes × 3 + replies × 4 + views/20)
      • Personalisation bonus if user has post history
  → Return top 5 ranked threads
```

**Key Design Decision — No External AI:** This is a pure algorithmic scoring system — no Groq calls, no AI dependency. Always available.

---

## 8.4 Key Design Decisions

| Decision                              | Rationale                                                                                                  |
| ------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| **Streaming via SSE**                 | Ollama response is piped to browser while accumulating for DB persistence. No second API call needed.      |
| **Fail-closed moderation**            | Any error blocks content. Safety > availability.                                                           |
| **`temperature: 0.3` for moderation** | Low temperature ensures consistent, deterministic classification.                                          |
| **`temperature: 0.5` for summaries**  | Balanced between deterministic and creative, giving consistent but not robotic summaries.                  |
| **Algorithmic recommendations**       | Eliminates AI dependency; always available; no rate limits.                                                |
| **Content cap at 10,000 chars**       | Prevents token overflow for the local model.                                                               |
| **Pre-moderation gate**               | User message moderated before DB write or Ollama call. Block result returns HTTP 400 immediately.          |
| **BINUS-hosted Ollama**               | Uses the institution's own Ollama deployment — no external API key, no per-token cost, data stays on-prem. |

---

## 8.5 Environment Variables Required

No AI-specific environment variables are required. All AI features connect to the BINUS-hosted Ollama endpoint (`https://ollama.csbihub.id`) without an API key.

| Variable        | Used by | Behavior if missing |
| --------------- | ------- | ------------------- |
| _(none for AI)_ | —       | —                   |

---

## 8.6 Source Code Reference

| Feature                | Core Logic               | API Route                                  | Frontend                                         |
| ---------------------- | ------------------------ | ------------------------------------------ | ------------------------------------------------ |
| AI Tutor Chat          | `hooks/useChat.ts`       | `app/api/chat/route.ts`                    | `components/features/ai-tutor/ChatInterface.tsx` |
| Thread Summarization   | `lib/moderation.ts`      | `app/api/summarize/route.ts`               | `components/features/forums/SummarizeButton.tsx` |
| Content Moderation     | `lib/moderation.ts`      | (called from multiple routes)              | `components/ui/moderation-alert.tsx`             |
| Thread Recommendations | `lib/recommendations.ts` | `app/api/recommendations/threads/route.ts` | `app/(main)/forums/page.tsx` (sidebar)           |

---

> AI testing is documented in [Testing §10.4](testing.md#104-ai-functionality-testing).

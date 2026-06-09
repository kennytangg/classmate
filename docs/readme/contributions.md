# 12–15. Contributions, AI Disclosure & Declaration

[← Back to README](../../README.md)

---

## 12. GitHub Contribution Summary (INDIVIDUAL)

Each student must list **their own contribution**. Contributions must match GitHub commit history.

---

**Student Name:** Kenny Tang

- Features implemented:
  - Authentication (Firebase + Better Auth dual-provider)
  - Database design (Prisma schema, migrations, seed)
  - User profile & discovery
  - Connections
  - Forums (posts, replies, upvotes)
  - Study groups & group chat
  - Direct messaging (chat)
  - Study materials (upload, download, management)
  - AI Tutor & study material summarization
  - Scheduling & events
  - Moderation system & admin dashboard
  - UI / UX redesign (sidebar, responsive layout, dark/light mode)
  - Rate limiting & security hardening

- API endpoints built:
  - `/api/admin/users`, `/api/admin/users/[id]/role`
  - `/api/auth/[...all]`, `/api/auth/firebase`, `/api/logout`
  - `/api/user/me`, `/api/user/profile`, `/api/user/stats`
  - `/api/users/discover`
  - `/api/connections`, `/api/connections/[id]`, `/api/connections/count`, `/api/connections/status`
  - `/api/forums/posts`, `/api/forums/posts/[id]`, `/api/forums/posts/[id]/upvote`
  - `/api/forums/replies`, `/api/forums/replies/[id]`, `/api/forums/replies/[id]/upvote`
  - `/api/study-groups`, `/api/study-groups/[groupId]`, `/api/study-groups/[groupId]/join`, `/api/study-groups/[groupId]/messages`
  - `/api/messages/conversations`, `/api/messages/conversations/[userId]`, `/api/messages/conversations/[userId]/read`, `/api/messages/contacts`
  - `/api/materials`, `/api/materials/[id]`, `/api/materials/[id]/download`
  - `/api/sessions`, `/api/sessions/[sessionId]/messages`, `/api/summarize`
  - `/api/events`, `/api/events/[id]`
  - `/api/moderation`, `/api/moderation/flag`, `/api/moderation/flagged`, `/api/moderation/resolve`, `/api/moderation/logs`
  - `/api/recommendations/threads`
  - `/api/docs` (Swagger UI)

- Tests written: 58 test suites, 733 tests — covering API routes (auth, forums, materials, messages, study groups, events, connections, moderation, admin), security/authorization boundaries, service layer logic, and frontend component tests

- Security work: Role-based access control (4 tiers), XSS sanitization, rate limiting on all endpoints, secure file upload handling, fixed multiple ESLint security warnings, resolved auth bypass vulnerabilities, input validation at API boundaries

- AI-related work: Built AI Tutor end-to-end (Ollama gemma4:26b / llama3.1:8b, session management, message persistence), implemented study material summarization endpoint, integrated AI content moderation helper into the moderation pipeline

---

**Student Name:** Richard Hans

- Features implemented:
- API endpoints handled:
- Tests written:
- Security work:
- AI-related work:

---

**Student Name:** Stefan Luciano Kencana

- Features implemented:
- API endpoints handled:
- Tests written:
- Security work:
- AI-related work:

---

## 13. AI Usage Disclosure (MANDATORY)

### AI embedded in the product (runs in the app itself)

| Model                | Purpose                                    | Where                        |
| :------------------- | :----------------------------------------- | :--------------------------- |
| Ollama `gemma4:26b`  | AI Tutor chat (streaming academic Q&A)     | `app/api/chat/route.ts`      |
| Ollama `llama3.1:8b` | AI Content Moderation (pre-save screening) | `lib/moderation.ts`          |
| Ollama `llama3.1:8b` | Thread Summarization                       | `app/api/summarize/route.ts` |

These models run on the BINUS-hosted Ollama instance and are an integral part of the application, not development tools.

### AI tools used during development (not part of the product)

- **GitHub Copilot** — code suggestions, debugging, refactoring, and documentation generation
- **Claude** — automated test generation, code suggestions, debugging, refactoring, and documentation generation
- **Gemini AI** — brainstorming and architecture discussions; not used to generate code or documentation directly

**Purpose of usage:**

- Development support: code suggestions, debugging assistance, explaining error messages
- Documentation: generating initial structure for README and API docs
- AI feature development: brainstorming test scenarios for the Ollama integration

**Which parts were assisted:**

- Initial API route structure was suggested by GitHub Copilot and reviewed/modified by the team
- Test scenario generation for AI testing was assisted by GitHub Copilot; all test logic was written and verified by team members
- All generated code was reviewed, modified, and understood by the team before being committed

---

## 14. Known Limitations & Future Improvements

### Current Limitations

- **Real-time messaging:** Direct messages and study group chat use polling (5-second intervals) rather than WebSocket/SSE. This means there is a small delay between send and receive.
- **File storage:** Files are stored in MinIO object storage. The MinIO container must be running and the bucket must exist before uploads will succeed.
- **AI Tutor context:** Each AI Tutor session maintains context within the session but does not share context across sessions. Long sessions may hit the local model's context window limit.
- **Pagination:** Page-based navigation is implemented on forums, materials, and study groups. Very large datasets may benefit from cursor-based pagination in the future.
- **Search:** Full-text search is basic (`contains` query); a proper search index would improve results at scale.

### Possible Future Enhancements

- WebSocket-based real-time messaging (replace polling)
- Push notifications (PWA / Web Push API)
- AI-generated study summaries and flashcards
- Peer review and essay grading features
- Mobile app (React Native)
- Advanced analytics dashboard for admins

### AI Limitations and Risks

- The Ollama models (`gemma4:26b`, `llama3.1:8b`) may occasionally produce inaccurate academic information ("hallucinations"). Users are advised to verify AI Tutor responses against authoritative sources.
- Content moderation AI may produce false positives (blocking valid content) or false negatives (allowing borderline content). Manual moderation by MODERATOR-role users supplements AI moderation.
- Prompt injection remains a theoretical risk; system prompt enforcement and input sanitization mitigate but do not eliminate this risk.

---

## 15. Final Declaration

We declare that:

- This project is our own work
- AI usage is disclosed honestly (see Section 13)
- All group members understand the system and can explain any part during presentation

**Signed by Group Members:**

| Name                   | Signature                    |
| :--------------------- | :--------------------------- |
| Kenny Tang             | **\*\*\*\***\_\_**\*\*\*\*** |
| Richard Hans           | **\*\*\*\***\_\_**\*\*\*\*** |
| Stefan Luciano Kencana | **\*\*\*\***\_\_**\*\*\*\*** |

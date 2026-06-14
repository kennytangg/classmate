# 12–15. Contributions, AI Disclosure & Declaration

[← Back to README](../../README.md)

---

## 12. GitHub Contribution Summary (INDIVIDUAL)

Each student must list **their own contribution**. Contributions must match GitHub commit history.

---

**Student Name:** Kenny Tang

- Features implemented (built on / refactored from the team's early prototype):
  - Rebuilt authentication into a dual-provider system (Firebase + Better Auth) with a unified `getSession()` resolver
  - Designed the production database layer (Prisma schema, migrations, seed)
  - Refactored the forums into full posts / replies / upvotes with categories and views
  - Hardened study groups & group chat, direct messaging, and study materials (upload, download, management) on top of the early UI
  - Took the prototype AI Tutor to a production streaming implementation, and added study-material summarization
  - Built the moderation system & admin dashboard, scheduling & events, user profiles, discovery, and connections
  - UI / UX redesign across the app (sidebar, responsive layout, dark/light mode)
  - Consolidated all data access behind ~50 documented REST endpoints (Swagger at `/docs`)

- API endpoints built: Consolidated and standardized the full REST surface (~50 endpoints across auth, users, connections, forums, study groups, messages, materials, AI sessions/summarize, events, moderation, recommendations, admin) — see [API Design](api-design.md) for the full list.

- Tests written: 58 test suites, 733 tests — covering API routes (auth, forums, materials, messages, study groups, events, connections, moderation, admin), security/authorization boundaries, service-layer logic, AI behavior, and frontend component tests

- Security work: Role-based access control (4 tiers), XSS sanitization, rate limiting across endpoints, secure file upload handling (magic-byte validation), security headers, resolved auth-bypass issues, and input validation at API boundaries

- AI-related work: Took the AI Tutor to a production streaming implementation on the BINUS Ollama models (`gemma4:26b` / `llama3.1:8b`) with session management and message persistence, added the summarization endpoint, and built the fail-closed AI content-moderation pipeline

---

**Student Name:** Richard Hans

- Features implemented:
  - Initial project scaffolding (Next.js app structure, base layout)
  - Authentication UI — sign-up / login pages
  - Home / landing page and feature sections
  - Dashboard and active-course view
  - Study groups UI — listing, study room, and group flow (including study-room debugging)
  - AI Tutor pages and tutor profiles
  - Research papers / materials browsing UI
  - Notifications UI
  - Profile bar, footer, and shared layout components

- API endpoints handled:
  - Client-side data wiring for the study-group and tutor pages during early development; work was primarily frontend, with most REST endpoints later consolidated by Kenny.

- Tests written:
  - Manual UI / feature testing of the pages above during early development.

- Security work:
  - Added `.gitignore` rules to exclude `.env` files and keep secrets out of version control.

- AI-related work:
  - Built the initial AI Tutor page UI and tutor-profile presentation that the streaming tutor was later wired into.

---

**Student Name:** Stefan Luciano Kencana

- Features implemented:
  - AI Tutor chat — initial backend integration and chat interface, including text and voice (`useVoice`) interaction
  - Authentication login / logout flow and login header
  - Early backend setup and database migrations

- API endpoints handled:
  - AI chat backend route — initial Gemini integration, migrated to an OpenAI-compatible / Groq route, later standardized on the BINUS Ollama endpoint by the team
  - Auth login / logout routing

- Tests written:
  - Manual testing of the AI chat (text + voice) and the auth login / logout flow during development.

- Security work:
  - Added `.gitignore` entries for `.env.local` and secret files
  - Implemented login / logout session handling
  - Separated admin access in the early backend setup

- AI-related work:
  - Stood up the first working AI chat backend (text + voice), iterating across providers (Gemini → Groq → OpenAI-compatible) before the team standardized on the self-hosted BINUS Ollama models.

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
- **Rate limiting:** Limits are enforced in-memory (`rate-limiter-flexible` memory store), so counters reset on container restart and are not shared across multiple app instances. This is sufficient for the current single-container deployment; a horizontally scaled deployment would need a shared store (e.g. Redis).

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

| Name                   | Signature                                            |
| :--------------------- | :--------------------------------------------------- |
| Kenny Tang             | **\*\*\*\***\__Kenny Tang_\_**\*\*\*\***             |
| Richard Hans           | **\*\*\*\***\__Richard Hans_\_**\*\*\*\***           |
| Stefan Luciano Kencana | **\*\*\*\***\__Stefan Luciano Kencana_\_**\*\*\*\*** |

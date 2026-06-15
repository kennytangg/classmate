# ClassMate — Student Community & Collaboration Platform

**Final Project – Web Application Development and Security**

**Course Code:** COMP6703001  
**Course Name:** Web Application Development and Security  
**Institution:** BINUS University International

---

## 1. Project Information

**Project Title:** ClassMate

**Project Domain:** Student Community & Collaboration Platform (Option 8)

**Class:** L4AC

**Group Members (Max 3 – same class only):**

| Name                   | Student ID | Role                 | GitHub Username                                        |
| :--------------------- | :--------- | :------------------- | :----------------------------------------------------- |
| Kenny Tang             | 2802517733 | Full-Stack Developer | [@kennytangg](https://github.com/kennytangg)           |
| Richard Hans           | 2802516384 | Frontend Development | [@richardhans8888](https://github.com/richardhans8888) |
| Stefan Luciano Kencana | 2802521314 | AI Development       | [@Krozlov](https://github.com/Krozlov)                 |

---

> _Section 2 (Instructor & Repository Access) of the template is an action item — the repository is shared directly with the instructors on GitHub — and is therefore not part of this written report._

---

## 3. Project Overview

### 3.1 Problem Statement

University students lack a dedicated, safe platform to collaborate academically. Existing general-purpose social networks are not focused on academic needs, have no subject-matter moderation, and don't provide AI-assisted learning tools. Students end up scattered across WhatsApp, Google Drive, and generic forums — with no unified space for peer connections, study resources, and academic discussion.

**Target users:** University students who need a moderated, AI-assisted academic collaboration platform.

### 3.2 Solution Overview

**Main features:**

- Discussion forums with category-based threads, upvotes, and AI summarization
- AI Tutor powered by Ollama (`gemma4:26b`) for academic assistance
- Direct messaging between students and real-time study group chat
- Study materials (upload, download, shared academic files)
- Peer connections and student discovery with search
- Event and schedule management
- AI content moderation that screens every post before it goes live
- Smart thread recommendations personalized per user

**Why this solution is appropriate:** ClassMate addresses all core requirements of Option 8 (Student Community & Collaboration Platform) — forums, chat, file sharing, event scheduling, AI moderation, and security-grade role-based access control — in a single, production-ready application.

**Where AI is used:**

1. **AI Tutor** — conversational academic assistant (BINUS Ollama `gemma4:26b`, streaming)
2. **AI Content Moderation** — every forum post and reply is screened by `llama3.1:8b` before being saved; fail-closed (blocks on AI error)
3. **AI Thread Summarization** — condenses long forum threads into a 2–3 sentence summary (`llama3.1:8b`)

> Thread recommendations are a **pure algorithmic** scoring function (recency + engagement + user history), not an LLM call — see [8. AI Features](docs/readme/ai-features.md).

---

## 4. Technology Stack

| Layer            | Technology                                                                            |
| :--------------- | :------------------------------------------------------------------------------------ |
| Frontend         | Next.js 15 (App Router) + React + Tailwind CSS                                        |
| Backend          | Node.js via Next.js API Routes                                                        |
| API              | REST API – 50 endpoints, OpenAPI 3.0 via Swagger                                      |
| Database         | PostgreSQL + Prisma ORM                                                               |
| Auth             | Firebase (Google OAuth) + Better Auth (email/password)                                |
| AI               | BINUS Ollama (self-hosted) — `gemma4:26b` (chat) + `llama3.1:8b` (moderation/summary) |
| Containerization | Docker + docker-compose                                                               |
| Deployment       | BINUS VPS + Cloudflare Access, Docker Hub, GitHub Actions self-hosted runner          |
| Version Control  | GitHub                                                                                |

---

## Final Report — Section Index

This README follows the official final-project report template. Sections 1, 3, and 4 are above; sections 5 onward live in linked documents under [`docs/readme/`](docs/readme/).

| #     | Section                                    | Document                                                                           |
| :---- | :----------------------------------------- | :--------------------------------------------------------------------------------- |
| 5     | System Architecture                        | [architecture.md](docs/readme/architecture.md)                                     |
| 6     | API Design                                 | [api-design.md](docs/readme/api-design.md)                                         |
| 7     | Database Design                            | [database-design.md](docs/readme/database-design.md)                               |
| 8     | AI Features                                | [ai-features.md](docs/readme/ai-features.md)                                       |
| 9     | Security Implementation                    | [security.md](docs/readme/security.md)                                             |
| 10    | Testing Documentation                      | [testing.md](docs/readme/testing.md)                                               |
| 11    | Deployment & Production Setup              | [deployment.md](docs/readme/deployment.md)                                         |
| 12–15 | Contributions, AI Disclosure & Declaration | [contributions.md](docs/readme/contributions.md)                                   |
| 16–17 | Setup & Deployment Instructions            | [deployment.md](docs/readme/deployment.md#16-setup-instructions-local-development) |
| A     | User Stories & SRS (USR + SRS)             | [requirements.md](docs/readme/requirements.md)                                     |

---

## Live Application

**Production URL:** https://e2526-wads-b4ac.csbihub.id/

**API Documentation (Swagger):** https://e2526-wads-b4ac.csbihub.id/docs

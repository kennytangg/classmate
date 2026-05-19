# ClassMate — Student Community & Collaboration Platform

**Final Project – Web Application Development and Security**

**Course Code:** COMP6703001  
**Course Name:** Web Application Development and Security  
**Institution:** BINUS University International

---

## 1. Project Information

**Project Title:** ClassMate2026

**Project Domain:** Student Community & Collaboration Platform (Option 8)

**Class:** L4AC

**Group Members (Max 3 – same class only):**

| Name                   | Student ID | Role | GitHub Username                                        |
| :--------------------- | :--------- | :--- | :----------------------------------------------------- |
| Kenny Tang             | 2802517733 | -    | [@kennytangg](https://github.com/kennytangg)           |
| Richard Hans           | 2802516384 | -    | [@richardhans8888](https://github.com/richardhans8888) |
| Stefan Luciano Kencana | 2802521314 | -    | [@Krozlov](https://github.com/Krozlov)                 |

---

## 2. Project Overview

### 2.1 Problem Statement

University students lack a dedicated, safe platform to collaborate academically. Existing general-purpose social networks are not focused on academic needs, have no subject-matter moderation, and don't provide AI-assisted learning tools. Students end up scattered across WhatsApp, Google Drive, and generic forums — with no unified space for peer connections, study resources, and academic discussion.

**Target users:** University students who need a moderated, AI-assisted academic collaboration platform.

### 2.2 Solution Overview

**Main features:**

- Discussion forums with category-based threads, upvotes, and AI summarization
- AI Tutor powered by Groq Llama 3.3-70B for academic assistance
- Direct messaging between students and real-time study group chat
- Study materials (upload, download, shared academic files)
- Peer connections and student discovery with search
- Event and schedule management
- AI content moderation that screens every post before it goes live
- Smart thread recommendations personalized per user

**Why this solution is appropriate:** ClassMate addresses all core requirements of Option 8 (Student Community & Collaboration Platform) — forums, chat, file sharing, event scheduling, AI moderation, and security-grade role-based access control — in a single, production-ready application.

**Where AI is used:**

1. **AI Tutor** — conversational academic assistant (BINUS Ollama `llama3.1:8b`, streaming)
2. **AI Content Moderation** — every forum post and reply is screened by the local LLM before being saved; fail-closed (blocks on AI error)
3. **AI Thread Recommendations** — scoring algorithm surfaces relevant threads per user

---

## 3. Technology Stack

| Layer            | Technology                                             |
| :--------------- | :----------------------------------------------------- |
| Frontend         | Next.js 15 (App Router) + React + Tailwind CSS         |
| Backend          | Node.js via Next.js API Routes                         |
| API              | REST API – 43 endpoints, OpenAPI 3.0 via Swagger       |
| Database         | PostgreSQL + Prisma ORM                                |
| Auth             | Firebase (Google OAuth) + Better Auth (email/password) |
| AI               | BINUS Ollama (llama3.1:8b, self-hosted)                |
| Containerization | Docker + docker-compose                                |
| Deployment       | [Hosting Platform]                                     |
| Version Control  | GitHub                                                 |

---

## Quick Navigation

| Section                                    | Link                                                             |
| :----------------------------------------- | :--------------------------------------------------------------- |
| System Architecture                        | [docs/readme/architecture.md](docs/readme/architecture.md)       |
| API Design                                 | [docs/readme/api-design.md](docs/readme/api-design.md)           |
| Database Design                            | [docs/readme/database-design.md](docs/readme/database-design.md) |
| AI Features & Testing                      | [docs/readme/ai-features.md](docs/readme/ai-features.md)         |
| Security Implementation                    | [docs/readme/security.md](docs/readme/security.md)               |
| Testing Documentation                      | [docs/readme/testing.md](docs/readme/testing.md)                 |
| Deployment & Setup                         | [docs/readme/deployment.md](docs/readme/deployment.md)           |
| Contributions, AI Disclosure & Declaration | [docs/readme/contributions.md](docs/readme/contributions.md)     |

---

## Live Application

**Production URL:** https://e2526-wads-b4ac.csbihub.id/

**API Documentation (Swagger):** https://e2526-wads-b4ac.csbihub.id/api-docs

**Presentation Video:** COMING SOON

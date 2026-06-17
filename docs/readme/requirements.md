# Appendix A — User Stories & Software Requirements Specification (USR + SRS)

[← Back to README](../../README.md)

> Supplementary design appendix for the [Final Project Report](../../README.md). This satisfies the **Architecture Design (USR + SRS)** deliverable and supports [5. System Architecture](./architecture.md).

---

## A.1 User Stories

### Authentication & Accounts

| ID    | As a…   | I want to…                                   | So that…                                            |
| :---- | :------ | :------------------------------------------- | :-------------------------------------------------- |
| US-01 | Student | Register with email/password or Google OAuth | I can create an account without a separate password |
| US-02 | Student | Log in and stay logged in across sessions    | I don't have to re-authenticate on every visit      |
| US-03 | Student | Update my profile (bio, university, major)   | Other students can learn about my background        |
| US-04 | Student | Upload or change my avatar                   | My profile feels personalized                       |

### Forums

| ID    | As a…     | I want to…                                               | So that…                                                            |
| :---- | :-------- | :------------------------------------------------------- | :------------------------------------------------------------------ |
| US-05 | Student   | Browse forum threads by category                         | I find discussions relevant to my courses                           |
| US-06 | Student   | Create a new forum post with a title, body, and category | I can ask academic questions or share knowledge                     |
| US-07 | Student   | Reply to a post                                          | I can contribute answers and discussion                             |
| US-08 | Student   | Upvote posts and replies                                 | High-quality content surfaces to the top                            |
| US-09 | Student   | See an AI-generated summary of a long thread             | I can quickly understand the key points without reading all replies |
| US-10 | Student   | Get a personalised thread feed on the home page          | I see threads relevant to my academic interests first               |
| US-11 | Moderator | Delete any post or reply and flag content for review     | I can keep the forum free from harmful or off-topic posts           |

### AI Tutor

| ID    | As a…   | I want to…                                                       | So that…                                                |
| :---- | :------ | :--------------------------------------------------------------- | :------------------------------------------------------ |
| US-12 | Student | Ask the AI Tutor academic questions and receive streamed answers | I get immediate help with my coursework                 |
| US-13 | Student | Attach an image (photo of notes, textbook page) to my question   | The tutor can help with handwritten or printed problems |
| US-14 | Student | See past AI chat sessions and continue previous conversations    | I can revisit explanations I found useful               |
| US-15 | Student | See math rendered with LaTeX and code with syntax highlighting   | Complex academic answers are easy to read               |

### Study Groups & Chat

| ID    | As a…   | I want to…                                                       | So that…                                        |
| :---- | :------ | :--------------------------------------------------------------- | :---------------------------------------------- |
| US-16 | Student | Create and join study groups by subject                          | I can collaborate with peers on the same course |
| US-17 | Student | Send messages in a study group chat                              | My group can coordinate asynchronously          |
| US-18 | Student | Send direct messages to individual students                      | I can have private academic conversations       |
| US-19 | Student | See an unread message badge and notification when I receive a DM | I don't miss important messages                 |

### Study Materials

| ID    | As a…   | I want to…                                       | So that…                                            |
| :---- | :------ | :----------------------------------------------- | :-------------------------------------------------- |
| US-20 | Student | Upload study materials (PDFs, images, documents) | I can share resources with my classmates            |
| US-21 | Student | Browse and download materials uploaded by others | I can benefit from the community's shared resources |
| US-22 | Student | Search materials by title or subject             | I can quickly find relevant files                   |

### Connections & Discovery

| ID    | As a…   | I want to…                                            | So that…                                         |
| :---- | :------ | :---------------------------------------------------- | :----------------------------------------------- |
| US-23 | Student | Send and accept connection requests to other students | I can build my academic network                  |
| US-24 | Student | Discover other students by name, university, or major | I can find peers with similar academic interests |

### Events & Scheduling

| ID    | As a…   | I want to…                                    | So that…                                 |
| :---- | :------ | :-------------------------------------------- | :--------------------------------------- |
| US-25 | Student | Create and view academic events and deadlines | I can track important dates in one place |

### Administration & Moderation

| ID    | As a…     | I want to…                                       | So that…                                                   |
| :---- | :-------- | :----------------------------------------------- | :--------------------------------------------------------- |
| US-26 | Admin     | View all users and change their roles            | I can promote trusted users to moderator                   |
| US-27 | Moderator | View the flagged content queue and resolve flags | I can review and act on community reports                  |
| US-28 | Moderator | See an audit log of all moderation actions       | Accountability is maintained for every moderation decision |

---

## A.2 Functional Requirements

| ID    | Requirement                                                                                                                                                                                                                                                     |
| :---- | :-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| FR-01 | The system shall support registration via email/password (Better Auth) and Google OAuth (Firebase).                                                                                                                                                             |
| FR-02 | The system shall maintain authenticated sessions via HttpOnly cookies and validate the session on every protected API request.                                                                                                                                  |
| FR-03 | The system shall enforce four role levels: `STUDENT`, `MODERATOR`, `ADMIN`, `OWNER`, with access controls at the API layer.                                                                                                                                     |
| FR-04 | The system shall provide a forum with category-based threads, replies, upvotes, and view count tracking.                                                                                                                                                        |
| FR-05 | Every forum post and reply shall be screened by an AI moderation model (Ollama `llama3.1:8b`) before being saved; a harmful result shall block the write.                                                                                                       |
| FR-06 | The system shall provide an AI Tutor that streams responses from Ollama `gemma4:26b`, supports image attachments, and persists sessions to the database.                                                                                                        |
| FR-07 | The system shall provide AI thread summarization (Ollama `llama3.1:8b`, non-streaming) returning a 2–3 sentence summary.                                                                                                                                        |
| FR-08 | The system shall provide algorithmic thread recommendations based on recency, engagement, and user history.                                                                                                                                                     |
| FR-09 | The system shall provide study group creation, membership management, and group chat (polling-based).                                                                                                                                                           |
| FR-10 | The system shall provide direct messaging between students with unread-message tracking.                                                                                                                                                                        |
| FR-11 | The system shall allow file uploads restricted to an extension allowlist with magic-byte signature checks on binary types; accepted types are PDF, Office documents (DOC/DOCX, PPT/PPTX, XLS/XLSX), ZIP, plain text (TXT/MD), and images (JPG/JPEG, PNG, WebP). |
| FR-12 | The system shall provide a connection system (send, accept, reject) and student discovery with search.                                                                                                                                                          |
| FR-13 | The system shall provide event/scheduling management per user.                                                                                                                                                                                                  |
| FR-14 | The system shall provide a moderation dashboard (flagged queue, audit log) accessible to MODERATOR+ roles.                                                                                                                                                      |
| FR-15 | The system shall provide an admin panel (user list, role management) accessible to ADMIN+ roles.                                                                                                                                                                |

---

## A.3 Non-Functional Requirements

| ID     | Category        | Requirement                                                                                                                                                                                                                                                                                    |
| :----- | :-------------- | :--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| NFR-01 | Security        | All user inputs shall be validated with Zod schemas at the API boundary and HTML-sanitized before storage.                                                                                                                                                                                     |
| NFR-02 | Security        | File uploads shall be validated by magic bytes in addition to the declared MIME type to prevent disguised executable uploads.                                                                                                                                                                  |
| NFR-03 | Security        | Session cookies shall be HttpOnly, Secure (production), and SameSite=Strict (Firebase) / Lax (Better Auth).                                                                                                                                                                                    |
| NFR-04 | Security        | All API routes shall be protected by rate limiting (5 tiers); auth endpoints limited to 10 requests per 15 minutes.                                                                                                                                                                            |
| NFR-05 | Performance     | The AI Tutor response shall begin streaming within 3 seconds of submission under normal load.                                                                                                                                                                                                  |
| NFR-06 | Availability    | The application shall expose a `/api/health` endpoint returning `200 OK` when the service is running.                                                                                                                                                                                          |
| NFR-07 | Maintainability | The codebase shall maintain a documented automated test suite (745 tests / 59 suites) covering API routes, security boundaries, and AI behavior, with frontend forms covered via component tests. Coverage is concentrated on risk-bearing paths rather than a fixed line-coverage percentage. |
| NFR-08 | Reliability     | AI content moderation shall be fail-closed: if the moderation model is unavailable or returns a malformed response, the content write is blocked.                                                                                                                                              |
| NFR-09 | Scalability     | The data layer shall use indexed queries for all hot read paths (feeds, DM inbox, unread counts) to support growth without full-table scans.                                                                                                                                                   |
| NFR-10 | Compliance      | The application shall not store or log Firebase private keys, MinIO credentials, or database URLs in source code or container images.                                                                                                                                                          |

---

[← Back to README](../../README.md)

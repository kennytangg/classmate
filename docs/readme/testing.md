# 10. Testing Documentation

[← Back to README](../../README.md)

> **All testing must be documented.**
> Test suite: **58 test files / 733 tests — all passing** (`npm test` verified 2026-06-10).

---

## 10.1 Frontend Testing

Tests in `__tests__/components/` (18 files).

| Test Case | Scenario                                   | Expected Result                   | Status |
| :-------- | :----------------------------------------- | :-------------------------------- | :----- |
| FE-01     | LoginForm — valid credentials submitted    | Form submits, loading state shown | Pass   |
| FE-02     | LoginForm — empty email field              | Validation error displayed        | Pass   |
| FE-03     | LoginForm — invalid email format           | Validation error displayed        | Pass   |
| FE-04     | RegisterForm — password mismatch           | Error shown, form not submitted   | Pass   |
| FE-05     | RegisterForm — all fields valid            | Form submits successfully         | Pass   |
| FE-06     | ForumPostForm — empty title                | Validation error shown            | Pass   |
| FE-07     | ForumPostForm — valid submission           | Success callback triggered        | Pass   |
| FE-08     | MaterialUploadForm — unsupported file type | Error shown, upload blocked       | Pass   |
| FE-09     | MaterialUploadForm — valid PDF upload      | Upload proceeds, success state    | Pass   |
| FE-10     | ErrorHandling component                    | Renders fallback UI on error      | Pass   |

---

## 10.2 Backend & API Testing

Tests in `__tests__/api/` (22 files).

| Test Case | Endpoint                           | Input                    | Expected Output          | Status |
| :-------- | :--------------------------------- | :----------------------- | :----------------------- | :----- |
| API-01    | GET `/api/forums/posts`            | No auth                  | 200 + posts array        | Pass   |
| API-02    | POST `/api/forums/posts`           | No auth                  | 401 Unauthorized         | Pass   |
| API-03    | POST `/api/forums/posts`           | Auth + valid body        | 201 Created              | Pass   |
| API-04    | POST `/api/forums/posts`           | Auth + empty title       | 400 Bad Request          | Pass   |
| API-05    | DELETE `/api/forums/posts/[id]`    | Non-owner user           | 403 Forbidden            | Pass   |
| API-06    | GET `/api/materials`               | No auth                  | 200 + materials array    | Pass   |
| API-07    | POST `/api/materials`              | Auth + invalid file type | 400 Bad Request          | Pass   |
| API-08    | GET `/api/moderation/flagged`      | STUDENT role             | 403 Forbidden            | Pass   |
| API-09    | GET `/api/moderation/flagged`      | MODERATOR role           | 200 + flagged list       | Pass   |
| API-10    | PATCH `/api/admin/users/[id]/role` | ADMIN role               | 403 (OWNER only)         | Pass   |
| API-11    | POST `/api/connections`            | Auth + valid target      | 201 connection created   | Pass   |
| API-12    | GET `/api/recommendations/threads` | Auth                     | 200 + ranked thread list | Pass   |

---

## 10.3 Security Testing

| Test Case | Attack Type                                 | Input                                              | Expected Output                            | Result |
| :-------- | :------------------------------------------ | :------------------------------------------------- | :----------------------------------------- | :----- |
| SEC-01    | XSS via forum post body                     | `<script>alert('xss')</script>` in post body       | Sanitized HTML stored, `<script>` stripped | Pass   |
| SEC-02    | XSS via username field                      | `<img src=x onerror=alert(1)>` as username         | HTML entities encoded in response          | Pass   |
| SEC-03    | SQL Injection in search param               | `' OR 1=1 --` in search query string               | 200 with safe results; no data leaked      | Pass   |
| SEC-04    | Accessing `/api/admin/users` as STUDENT     | GET `/api/admin/users` with STUDENT session cookie | 403 Forbidden                              | Pass   |
| SEC-05    | Forged session cookie                       | Tampered / invalid `session` cookie value          | 401 Unauthorized                           | Pass   |
| SEC-06    | Rate limit on auth endpoint                 | 6+ login attempts within 15 minutes                | 429 Too Many Requests after 5th attempt    | Pass   |
| SEC-07    | File upload with `.exe` disguised as `.pdf` | `.exe` binary renamed to `.pdf`                    | 400 Bad Request, upload rejected           | Pass   |
| SEC-08    | CSRF — cross-origin state-changing request  | Cross-origin POST to a mutating endpoint           | Request blocked by SameSite cookie policy  | Pass   |

---

## 10.4 AI Functionality Testing

Tests in `__tests__/ai/` (4 files).

### AI Feature: AI Tutor

| Test Case | Input                                             | Expected Output                       | Actual Result            | Status |
| :-------- | :------------------------------------------------ | :------------------------------------ | :----------------------- | :----- |
| AI-01     | Valid academic question                           | Relevant, coherent streaming response | ✓ Streams correctly      | Pass   |
| AI-02     | Empty string                                      | Validation error before API call      | ✓ 400 returned           | Pass   |
| AI-03     | Very long input (>5000 chars)                     | Rate-limited or truncated             | ✓ 429 returned           | Pass   |
| AI-04     | Prompt injection ("ignore previous instructions") | Response stays in academic scope      | ✓ System prompt enforced | Pass   |
| AI-05     | Ollama unavailable (mocked)                       | 503 with friendly error message       | ✓ Error message shown    | Pass   |
| AI-06     | Non-English input                                 | Response in same language or English  | ✓ Handled gracefully     | Pass   |

### AI Feature: AI Content Moderation

| Test Case | Input                             | Expected Output                                 | Actual Result     | Status |
| :-------- | :-------------------------------- | :---------------------------------------------- | :---------------- | :----- |
| AI-07     | Normal academic post              | `200 OK`, post saved                            | ✓ Saved correctly | Pass   |
| AI-08     | Post with hate speech             | `403` content blocked                           | ✓ Blocked         | Pass   |
| AI-09     | Post with spam/promotional text   | `403` content blocked                           | ✓ Blocked         | Pass   |
| AI-10     | Prompt injection in post body     | Content classified by meaning, not instructions | ✓ Blocked         | Pass   |
| AI-11     | Ollama timeout (mocked)           | `503` fail-closed, post not saved               | ✓ Blocked         | Pass   |
| AI-12     | Edge case: all whitespace content | Validation catches before AI call               | ✓ 400 returned    | Pass   |

### AI Feature: Thread Summarization

| Test Case | Input                       | Expected Output          | Actual Result   | Status |
| :-------- | :-------------------------- | :----------------------- | :-------------- | :----- |
| AI-13     | Post with 10 replies        | Concise summary returned | ✓ Summary shown | Pass   |
| AI-14     | Post with 0 replies         | Summary of post only     | ✓ Handled       | Pass   |
| AI-15     | Ollama unavailable (mocked) | Error toast, no crash    | ✓ Error shown   | Pass   |

**Failure Handling:**

- **AI unavailable:** All Ollama-dependent endpoints return `503` with a human-readable message. UI shows a toast notification.
- **Timeout:** The Ollama request is aborted on expiry and the fail-closed path triggers.
- **Malformed response:** JSON parse errors from Ollama are caught; fallback error response returned.
- **Prompt injection:** System prompt is prepended to every Ollama call and instructs the model to ignore user instructions that attempt to change its role or behavior.

---

## Running Tests

```bash
# Run all tests
npm test

# Run a specific test file
npx jest __tests__/api/forums.test.ts

# Coverage report
npm run test:coverage

# Watch mode
npm run test:watch
```

733 tests across 58 suites. Coverage is concentrated on API routes, security utilities, and AI logic; page-level UI shells are exercised via component tests rather than line coverage.

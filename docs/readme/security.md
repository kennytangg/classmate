# 9. Security Implementation

[← Back to README](../../README.md)

---

## 9.1 Authentication (JWT / Session)

**Dual-provider auth system:**

1. **Firebase Auth** — Google OAuth login. Firebase verifies the Google ID token, creates a session cookie (`session`), and stores it as an HttpOnly cookie.
2. **Better Auth** — Email/password registration and login. Issues a session token stored as an HttpOnly cookie (`better-auth.session_token`).

`lib/auth.ts` (`getSession()`) tries Firebase first, then Better Auth, and always returns a user object from Prisma. This ensures every authenticated request resolves to a verified database user.

**Middleware (`middleware.ts`):** Checks for either auth cookie on every request. If neither cookie is present on a protected route, the request is rewritten to a 404.

---

## 9.2 Authorization (Role-Based Access Control)

**Roles (4 levels):** `STUDENT` → `MODERATOR` → `ADMIN` → `OWNER`

| Capability                         | STUDENT | MODERATOR | ADMIN | OWNER |
| :--------------------------------- | :-----: | :-------: | :---: | :---: |
| Read public content                |    ✓    |     ✓     |   ✓   |   ✓   |
| Create posts/replies               |    ✓    |     ✓     |   ✓   |   ✓   |
| Use AI Tutor                       |    ✓    |     ✓     |   ✓   |   ✓   |
| Flag content                       |    ✓    |     ✓     |   ✓   |   ✓   |
| View flagged queue                 |    —    |     ✓     |   ✓   |   ✓   |
| Resolve flags / delete any content |    —    |     ✓     |   ✓   |   ✓   |
| View audit logs / manage users     |    —    |     —     |   ✓   |   ✓   |
| Change user roles                  |    —    |     —     |   —   |   ✓   |

Role checks use `lib/authorize.ts` helpers (`requireModerator`, `requireAdmin`, `canModerate`) called at the API route level before any business logic executes.

---

## 9.3 Input Validation

- All user-supplied strings are processed through `lib/sanitize.ts` before storage.
- Content is HTML-stripped (XSS tags removed) and entity-encoded.
- File uploads are validated by **magic bytes** (first bytes of the file buffer) — not just the `Content-Type` header — to prevent disguised executable uploads.
- API routes validate required fields and return `400 Bad Request` with descriptive messages for missing or malformed input.
- Zod-style schema validation is applied to form inputs on the frontend before submission.

---

## 9.4 Protection Against Common Attacks

### SQL / NoSQL Injection

- **Prisma ORM** parameterizes all queries automatically. No raw SQL strings are constructed from user input. If raw queries are ever needed, Prisma's `$queryRaw` with tagged template literals is used, which parameterizes inputs.

### Cross-Site Scripting (XSS)

- `lib/sanitize.ts` strips `<script>`, `onerror`, `javascript:` and other dangerous patterns from all user content before storage.
- React's JSX renders strings as text nodes by default — `.innerHTML` / `dangerouslySetInnerHTML` is not used for user content.
- Content-Security-Policy (CSP) headers restrict script sources.

### Cross-Site Request Forgery (CSRF)

- Sessions are stored in **HttpOnly, SameSite=Lax** cookies — not accessible to JavaScript, and not sent on cross-origin requests.
- Better Auth includes built-in CSRF protection for its session cookie.
- Sensitive state-changing endpoints verify the session is associated with the authenticated user.

### Rate Limiting

`lib/rate-limit.ts` implements 5 tiers using `rate-limiter-flexible`:

| Tier     | Endpoints                    | Limit          |
| :------- | :--------------------------- | :------------- |
| Strict   | `/api/auth/*`, `/api/logout` | 5 req / 15 min |
| Standard | Most authenticated endpoints | 60 req / min   |
| Moderate | Forums, messages             | 30 req / min   |
| Lenient  | Read-only endpoints          | 120 req / min  |
| Upload   | `/api/materials` (POST)      | 10 req / hour  |

---

## 9.5 Secure API Key Handling

- All secrets (Firebase credentials, MinIO access keys, database connection string) are stored as **environment variables** — never hardcoded in source code.
- `.env` is in `.gitignore` and is never committed.
- The Firebase private key is base64-encoded in the environment and decoded at runtime.
- In production, secrets are injected via the hosting platform's secret manager.

---

## 9.6 Session & Cookie Configuration

| Cookie                      | HttpOnly | SameSite |  Secure  | Expiry |
| :-------------------------- | :------: | :------: | :------: | :----- |
| `session` (Firebase)        |    ✓     |   Lax    | ✓ (prod) | 5 days |
| `better-auth.session_token` |    ✓     |   Lax    | ✓ (prod) | 7 days |

# 6. API Design

[← Back to README](../../README.md)

---

## 6.1 API Endpoints (50 route files)

### Authentication (3 endpoints)

| Method | Endpoint             | Description                                   | Auth Required |
| :----- | :------------------- | :-------------------------------------------- | :------------ |
| ALL    | `/api/auth/[...all]` | Better Auth handler (signup, signin, session) | No            |
| POST   | `/api/auth/firebase` | Exchange Firebase ID token for session        | No            |
| POST   | `/api/logout`        | Destroy session cookie                        | Yes           |

### Forums (9 endpoints)

| Method         | Endpoint                          | Description                          | Auth Required |
| :------------- | :-------------------------------- | :----------------------------------- | :------------ |
| GET            | `/api/forums/posts`               | List posts, filterable by category   | No            |
| POST           | `/api/forums/posts`               | Create post (AI moderation applied)  | Yes           |
| GET            | `/api/forums/posts/[id]`          | Get post details + replies           | No            |
| PUT            | `/api/forums/posts/[id]`          | Update post (owner only)             | Yes           |
| DELETE         | `/api/forums/posts/[id]`          | Delete post (owner or moderator)     | Yes           |
| GET            | `/api/forums/replies`             | List replies for a post              | No            |
| POST           | `/api/forums/replies`             | Create reply (AI moderation applied) | Yes           |
| GET/PUT/DELETE | `/api/forums/replies/[id]`        | Reply CRUD                           | Mixed         |
| POST           | `/api/forums/posts/[id]/upvote`   | Toggle upvote on a post              | Yes           |
| POST           | `/api/forums/replies/[id]/upvote` | Toggle upvote on a reply             | Yes           |

### AI & Chat (5 endpoints)

| Method          | Endpoint                             | Description                                       | Auth Required |
| :-------------- | :----------------------------------- | :------------------------------------------------ | :------------ |
| POST            | `/api/chat`                          | AI Tutor – streaming response (Ollama gemma4:26b) | Yes           |
| GET/POST/DELETE | `/api/sessions`                      | AI chat session CRUD                              | Yes           |
| GET             | `/api/sessions/[sessionId]/messages` | Session message history                           | Yes           |
| POST            | `/api/summarize`                     | AI thread summarization                           | Yes           |
| GET             | `/api/recommendations/threads`       | AI-powered thread recommendations                 | Yes           |

### Direct Messaging (4 endpoints)

| Method   | Endpoint                                    | Description           | Auth Required |
| :------- | :------------------------------------------ | :-------------------- | :------------ |
| GET      | `/api/messages/contacts`                    | List DM contacts      | Yes           |
| GET      | `/api/messages/conversations`               | DM conversation list  | Yes           |
| GET/POST | `/api/messages/conversations/[userId]`      | DM thread read/send   | Yes           |
| PUT      | `/api/messages/conversations/[userId]/read` | Mark messages as read | Yes           |

### Study Groups (4 endpoints)

| Method          | Endpoint                               | Description               | Auth Required |
| :-------------- | :------------------------------------- | :------------------------ | :------------ |
| GET/POST/DELETE | `/api/study-groups`                    | Group list/create/delete  | Yes           |
| GET             | `/api/study-groups/[groupId]`          | Group detail with members | Yes           |
| POST            | `/api/study-groups/[groupId]/join`     | Join a study group        | Yes           |
| GET/POST        | `/api/study-groups/[groupId]/messages` | Group chat read/send      | Yes           |

### Study Materials (4 endpoints)

| Method           | Endpoint                       | Description                            | Auth Required |
| :--------------- | :----------------------------- | :------------------------------------- | :------------ |
| GET              | `/api/materials`               | List materials (sortable)              | No            |
| POST             | `/api/materials`               | Upload material (magic-byte validated) | Yes           |
| GET/PATCH/DELETE | `/api/materials/[id]`          | Material detail/update/delete          | Mixed         |
| POST             | `/api/materials/[id]/download` | Track download, return file URL        | Yes           |

### Events (2 endpoints)

| Method         | Endpoint           | Description        | Auth Required |
| :------------- | :----------------- | :----------------- | :------------ |
| GET/POST       | `/api/events`      | List/create events | Yes           |
| GET/PUT/DELETE | `/api/events/[id]` | Event CRUD         | Yes           |

### Moderation (5 endpoints)

| Method | Endpoint                  | Description                         | Auth Required |
| :----- | :------------------------ | :---------------------------------- | :------------ |
| POST   | `/api/moderation`         | Content moderation check (internal) | No            |
| POST   | `/api/moderation/flag`    | Report content                      | Yes           |
| GET    | `/api/moderation/flagged` | List flagged content                | MODERATOR+    |
| POST   | `/api/moderation/resolve` | Resolve a flag                      | MODERATOR+    |
| GET    | `/api/moderation/logs`    | Audit log of moderation actions     | ADMIN+        |

### Connections (5 endpoints)

| Method       | Endpoint                  | Description                               | Auth Required |
| :----------- | :------------------------ | :---------------------------------------- | :------------ |
| GET/POST     | `/api/connections`        | List connections / send request           | Yes           |
| PATCH/DELETE | `/api/connections/[id]`   | Accept/reject or remove connection        | Yes           |
| GET          | `/api/connections/status` | Check connection status between two users | Yes           |
| GET          | `/api/connections/count`  | Connection count for a user               | Yes           |
| GET          | `/api/users/discover`     | Paginated user discovery with search      | Yes           |

### Admin (2 endpoints)

| Method | Endpoint                     | Description      | Auth Required |
| :----- | :--------------------------- | :--------------- | :------------ |
| GET    | `/api/admin/users`           | List all users   | ADMIN+        |
| PATCH  | `/api/admin/users/[id]/role` | Update user role | OWNER only    |

### Users & Notifications (7 endpoints)

| Method     | Endpoint                       | Description                     | Auth Required |
| :--------- | :----------------------------- | :------------------------------ | :------------ |
| GET        | `/api/user/me`                 | Current user session info       | Yes           |
| GET/PATCH  | `/api/user/profile`            | Get/update current user profile | Yes           |
| GET        | `/api/user/stats`              | Current user activity stats     | Yes           |
| PATCH      | `/api/user/avatar`             | Update avatar                   | Yes           |
| GET/DELETE | `/api/notifications`           | List/delete notifications       | Yes           |
| PATCH      | `/api/notifications/[id]/read` | Mark notification read          | Yes           |
| GET        | `/api/users/[id]`              | Get public user profile         | Yes           |

---

## 6.2 API Documentation

**Swagger UI:** Available at `/api-docs` (live app) and `/api-docs` (local dev at `http://localhost:3000/api-docs`)

**Spec file:** `lib/swagger.ts` — OpenAPI 3.0.3 spec with request/response schemas for all endpoints.

### Example Request & Response

**POST** `/api/forums/posts`

Request:

```json
{
  "title": "How do I understand Big O notation?",
  "content": "I'm struggling with time complexity analysis...",
  "category": "Computer Science"
}
```

Response `201`:

```json
{
  "id": "clxyz123",
  "title": "How do I understand Big O notation?",
  "content": "I'm struggling with time complexity analysis...",
  "category": "Computer Science",
  "userId": "user_abc",
  "upvotes": 0,
  "views": 0,
  "repliesCount": 0,
  "createdAt": "2026-04-19T07:00:00.000Z"
}
```

Response `403` (moderation block):

```json
{
  "error": "Content violates community guidelines"
}
```

# 7. Database Design

[← Back to README](../../README.md)

---

## 7.1 Database Choice & Stack

**PostgreSQL 15+** accessed through **Prisma ORM** (`@prisma/adapter-pg` driver).

| Concern          | Choice                                    | Rationale                                                                   |
| :--------------- | :---------------------------------------- | :-------------------------------------------------------------------------- |
| RDBMS            | PostgreSQL                                | Strong relational integrity, JSON support, mature ecosystem                 |
| ORM              | Prisma                                    | Type-safe queries, declarative schema, auto-generated migrations            |
| Driver           | `@prisma/adapter-pg`                      | Native `pg` driver, better serverless compatibility than the default engine |
| Generated client | `generated/prisma/` (custom output)       | Kept out of `node_modules` so types are explicit and reviewable             |
| Auth data        | Stored in Postgres via Better Auth tables | Single source of truth; Firebase is used **only** for OAuth token exchange  |
| File storage     | MinIO object storage                      | Only URLs are persisted in Postgres                                         |

**Why relational over document:** connections, moderation audit trails, group membership, and upvote many-to-many tables all require referential integrity and join performance that Postgres delivers natively.

---

## 7.2 Schema Overview

- **18 models**
- **5 enums**
- **All models** use `cuid()` string primary keys (collision-resistant, URL-safe, sortable)
- **All mutable models** carry `createdAt` / `updatedAt` timestamps
- **Cascade deletes** on user-owned content (`onDelete: Cascade`)
- **`SetNull` on soft references** (e.g. `ChatMessage.sessionId`, `FlaggedContent.resolvedBy`) so history survives deletions

### 7.2.1 Enums (5)

| Enum                   | Values                                                                                    | Used By                    |
| :--------------------- | :---------------------------------------------------------------------------------------- | :------------------------- |
| `UserRole`             | `STUDENT`, `MODERATOR`, `ADMIN`, `OWNER`                                                  | `User.role`                |
| `ConnectionStatus`     | `PENDING`, `ACCEPTED`, `REJECTED`                                                         | `Connection.status`        |
| `ModerationAction`     | `FLAG_CREATED`, `FLAG_RESOLVED`, `CONTENT_DELETED`                                        | `ModerationLog.action`     |
| `FlagStatus`           | `pending`, `dismissed`, `resolved`                                                        | `FlaggedContent.status`    |
| `ModerationTargetType` | `post`, `reply`, `material`, `ForumPost`, `ForumReply`, `StudyMaterial`, `FlaggedContent` | `ModerationLog.targetType` |

> **Note:** `ModerationTargetType` contains both legacy lowercase values (`post`, `reply`, `material`) and PascalCase values for newer code paths. Services normalise on write.

---

## 7.3 Models (18 total)

### 7.3.1 Identity & Profile (5 models)

#### `User` — central account record

| Field                     | Type            | Notes                      |
| :------------------------ | :-------------- | :------------------------- |
| `id`                      | `String` (cuid) | PK                         |
| `email`                   | `String`        | Unique, indexed            |
| `name`                    | `String?`       | Display name fallback      |
| `image`                   | `String?`       | Avatar URL                 |
| `emailVerified`           | `Boolean`       | Default `false`            |
| `role`                    | `UserRole`      | Default `STUDENT`, indexed |
| `createdAt` / `updatedAt` | `DateTime`      | Audit timestamps           |

**Indexes:** `email`, `role`.
**Relations (17):** profile, forumPosts, forumReplies, chatMessagesSent/Received, chatSessions, studyMaterials, studyGroupsOwned, studyGroupMembers, studyGroupMessages, upvotedForumPosts, upvotedReplies, events, flaggedContents, resolvedFlags, connectionsSent/Received, moderationLogs, notifications, sessions, accounts.

#### `UserProfile` — extended profile (1:1 with `User`)

`displayName`, `bio`, `avatarUrl`, `university`, `major`, `reputation` (Int, default 0, indexed).

#### `Session` — Better Auth sessions

`userId`, `token` (unique), `expiresAt`, `ipAddress`, `userAgent`.

#### `Account` — OAuth account linkage (Better Auth)

`providerId`, `accountId`, `accessToken`, `refreshToken`, `accessTokenExpiresAt`, `refreshTokenExpiresAt`, `scope`, `idToken`, `password`.

#### `Verification` — email-verification tokens

`identifier`, `value`, `expiresAt`.

---

### 7.3.2 Forums (2 models)

#### `ForumPost`

| Field                              | Type                                 |
| :--------------------------------- | :----------------------------------- |
| `title`, `content`, `category`     | `String`                             |
| `upvotes`, `views`, `repliesCount` | `Int` (denormalised counters)        |
| `isAnswered`                       | `Boolean`                            |
| `replies`                          | `ForumReply[]`                       |
| `upvoters`                         | `User[]` via `postUpvoters` relation |

**Indexes:** `userId`, `category`, `createdAt`, `upvotes`, `isAnswered` (supports the feed's sort-by-top and filter-by-category queries).

#### `ForumReply`

`postId`, `userId`, `content`, `upvotes`, `isAccepted`. Many-to-many upvoters (`replyUpvoters`).

---

### 7.3.3 Chat & Messaging (2 models)

#### `ChatMessage` (dual-purpose: DMs **and** AI tutor turns)

| Field                     | Type      | Notes                                                             |
| :------------------------ | :-------- | :---------------------------------------------------------------- |
| `senderId`, `recipientId` | `String`  | Cascade delete                                                    |
| `sessionId`               | `String?` | Nullable → DM; non-null → AI session. `SetNull` on session delete |
| `role`                    | `String`  | `user` / `assistant` / `system`                                   |
| `messageType`             | `String`  | Default `text`                                                    |
| `isRead`                  | `Boolean` | For DM unread counts                                              |

**Indexes:** `senderId`, `recipientId`, `sessionId`, `createdAt`, `isRead`.

#### `ChatSession` — AI tutor conversation container

`title`, `subject`, `description`, `messages: ChatMessage[]`. Indexed on `userId` and `createdAt`.

---

### 7.3.4 Study Materials & Groups (4 models)

| Model               | Purpose             | Key Fields                                                                |
| :------------------ | :------------------ | :------------------------------------------------------------------------ |
| `StudyMaterial`     | Uploaded resource   | `title`, `fileUrl`, `subject`, `fileType`, `downloads`                    |
| `StudyGroup`        | Collaboration group | `name`, `subject`, `maxMembers`, `isPrivate`, `inviteCode`, `memberCount` |
| `StudyGroupMember`  | Membership          | `@@unique([groupId, userId])`, `role` (`owner`/`member`), `joinedAt`      |
| `StudyGroupMessage` | Group chat          | `groupId`, `senderId`, `content`                                          |

**Composite index:** `StudyGroupMessage(@@index([groupId, createdAt]))` — optimises the group-chat timeline query.

---

### 7.3.5 Events (1 model)

#### `Event`

`userId`, `title`, `description`, `date`, `startTime`, `endTime`, `category`. Indexed on `userId`, `date`, `createdAt`.

---

### 7.3.6 Connections (1 model)

#### `Connection`

| Field                               | Notes                                |
| :---------------------------------- | :----------------------------------- |
| `senderId`, `recipientId`           | Both cascade                         |
| `status`                            | `ConnectionStatus` enum              |
| `@@unique([senderId, recipientId])` | Prevents duplicate outbound requests |

**Indexes:** `senderId`, `recipientId`, `status`.

---

### 7.3.7 Moderation (2 models)

#### `FlaggedContent` — reports awaiting review

| Field                                    | Notes                                         |
| :--------------------------------------- | :-------------------------------------------- |
| `reporterId`                             | Cascade                                       |
| `contentType` + `contentId`              | Polymorphic pointer (kind string + target id) |
| `reason`                                 | Reporter's text                               |
| `status`                                 | `FlagStatus` (pending/dismissed/resolved)     |
| `resolvedBy`, `resolution`, `resolvedAt` | Populated when a moderator acts               |

**Composite index:** `@@index([contentType, contentId])` — the queue lookup path.

#### `ModerationLog` — append-only audit trail

| Field                     | Notes                                                    |
| :------------------------ | :------------------------------------------------------- |
| `actorId`                 | Who performed the action (no cascade — preserve history) |
| `action`                  | `ModerationAction` enum                                  |
| `targetId` + `targetType` | Polymorphic pointer                                      |
| `reason`, `metadata`      | Free-form context                                        |

**Composite index:** `@@index([actorId, action, createdAt])` — powers per-moderator activity queries.

---

### 7.3.8 Notifications (1 model)

#### `Notification`

`userId`, `type`, `message`, `isRead`. Composite index `@@index([userId, isRead])` — drives the "unread count" query efficiently.

---

## 7.4 Key Relationships

```
User ──< ForumPost ──< ForumReply
     ──< ChatMessage (sender / recipient)
     ──< ChatSession ──< ChatMessage
     ──< StudyMaterial
     ──< StudyGroup (owner) ──< StudyGroupMember ──> User
                            ──< StudyGroupMessage
     ──< Connection (sender / recipient)
     ──< FlaggedContent  ──< resolvedBy → User
     ──< ModerationLog
     ──< Event
     ──< Notification
     ──< Session / Account (Better Auth)

ForumPost   >──< User  (upvoters, m:n via postUpvoters)
ForumReply  >──< User  (upvoters, m:n via replyUpvoters)
```

### Cascade Rules

| Direction                               | Behaviour           | Example                                                                                |
| :-------------------------------------- | :------------------ | :------------------------------------------------------------------------------------- |
| `User` → owned content                  | `onDelete: Cascade` | Deleting a user removes their posts, replies, materials, groups, events, notifications |
| `ChatMessage.sessionId` → `ChatSession` | `onDelete: SetNull` | Deleting an AI session preserves its message records                                   |
| `FlaggedContent.resolvedBy` → `User`    | `onDelete: SetNull` | Deleted moderator's decisions remain on record                                         |
| `ModerationLog.actorId` → `User`        | No cascade defined  | Audit trail must survive account deletion                                              |

---

## 7.5 Indexing Strategy

Indexes are declared directly in `schema.prisma`:

| Access pattern                      | Index                                                  |
| :---------------------------------- | :----------------------------------------------------- |
| Forum feed sorted by newest / top   | `ForumPost(createdAt)`, `ForumPost(upvotes)`           |
| Forum filter by category / answered | `ForumPost(category)`, `ForumPost(isAnswered)`         |
| DM unread counter                   | `ChatMessage(isRead)`, `ChatMessage(recipientId)`      |
| AI session history lookup           | `ChatMessage(sessionId, createdAt)`                    |
| Group-chat timeline                 | `StudyGroupMessage(groupId, createdAt)` composite      |
| Moderation queue by content         | `FlaggedContent(contentType, contentId)` composite     |
| Moderator activity                  | `ModerationLog(actorId, action, createdAt)` composite  |
| Notifications unread badge          | `Notification(userId, isRead)` composite               |
| Connection status resolution        | `Connection(status)`, unique `(senderId, recipientId)` |
| Profile leaderboard by reputation   | `UserProfile(reputation)`                              |

**Rule of thumb applied:** every column used in a `WHERE`, `ORDER BY`, or join filter in a hot API path has a supporting index. Counters (`upvotes`, `views`, `repliesCount`, `downloads`, `memberCount`) are **denormalised** on the row so feeds avoid aggregation scans.

---

## 7.6 ERD

See [`docs/erd.md`](../erd.md) for the rendered entity-relationship diagram. The canonical schema definition is `prisma/schema.prisma`.

High-level entity map:

```
                        ┌────────────────┐
                        │     User       │◄────────────────────────┐
                        └──────┬─────────┘                         │
                               │                                   │
       ┌───────────────┬───────┼─────────┬──────────────┐          │
       ▼               ▼       ▼         ▼              ▼          │
 ┌──────────┐   ┌────────────┐ │  ┌─────────────┐  ┌──────────┐    │
 │ForumPost │──<│ForumReply  │ │  │StudyMaterial│  │  Event   │    │
 └────┬─────┘   └────────────┘ │  └─────────────┘  └──────────┘    │
      │                        │                                   │
      │  m:n upvoters          │                                   │
      ▼                        ▼                                   │
                        ┌─────────────┐                            │
                        │ ChatMessage │◄── senderId / recipientId ─┤
                        └──────┬──────┘                            │
                               │ sessionId (nullable)              │
                               ▼                                   │
                        ┌─────────────┐                            │
                        │ ChatSession │                            │
                        └─────────────┘                            │
                                                                   │
 ┌────────────┐   ┌────────────────────┐   ┌────────────────┐      │
 │ StudyGroup │──<│  StudyGroupMember  │>──┤ (User)         │──────┤
 └─────┬──────┘   └────────────────────┘   └────────────────┘      │
       │                                                           │
       ▼                                                           │
 ┌────────────────────┐                                            │
 │ StudyGroupMessage  │                                            │
 └────────────────────┘                                            │
                                                                   │
 ┌──────────────┐   ┌─────────────────┐   ┌────────────────┐       │
 │ Connection   │   │ FlaggedContent  │──>│ ModerationLog  │───────┘
 └──────────────┘   └─────────────────┘   └────────────────┘
```

---

[← Back to README](../../README.md)

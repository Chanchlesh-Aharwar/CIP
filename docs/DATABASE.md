# DATABASE — Content Intelligence Platform

**Version:** 1.0.0  
**Date:** 2026-09-22  
**ORM:** Prisma 5.x  
**Engine:** PostgreSQL 15 (production) / SQLite (local fallback via Prisma datasource switch)

---

## 1. Entity Overview

| Entity | Purpose | Minimum Required | MVP Includes |
|--------|---------|------------------|--------------|
| User | Ownership + auth isolation | Yes | Yes |
| Content | Original source of truth | Yes | Yes |
| GeneratedOutput | AI results, traceable to Content | Yes | Yes |
| Tag | Reusable per-user tags | Yes | Yes |
| ContentTag | M:N join Content↔Tag | Implicit | Yes |
| Keyword | Normalized extraction result | Yes | Modeled as inside GeneratedOutput (no separate table for MVP) |

**Decision:** No separate `Keyword` or `Topic` tables for MVP. Keywords/topics are stored as structured JSON inside `GeneratedOutput` rows of type `KEYWORDS`/`TOPICS`. This avoids over-normalization and matches AI JSON output. Tags are first-class (user-managed, reusable, filterable). See §6 for rationale.

Optional deferred entities: `AIProcessingLog` (NICE-TO-HAVE, can be columns on GeneratedOutput), `OutputVersion` (NICE-TO-HAVE, deferred).

---

## 2. Schema (Prisma)

```prisma
// schema.prisma
datasource db {
  provider = "postgresql" // or "sqlite" for local
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

enum ContentStatus {
  draft
  processing
  completed
  failed
}

enum OutputType {
  SUMMARY
  KEY_POINTS
  KEYWORDS
  TOPICS
  SUGGESTED_TAGS
  FAQ
  SOCIAL_POST
  EXECUTIVE_SUMMARY
}

model User {
  id           String   @id @default(uuid())
  email        String   @unique
  name         String
  passwordHash String   @map("password_hash")
  createdAt    DateTime @default(now()) @map("created_at")
  updatedAt    DateTime @updatedAt @map("updated_at")

  contents Content[]
  tags     Tag[]

  @@map("users")
}

model Content {
  id              String        @id @default(uuid())
  userId          String        @map("user_id")
  title           String        @db.VarChar(255)
  originalContent String        @map("original_content") @db.Text
  status          ContentStatus @default(draft)
  createdAt       DateTime      @default(now()) @map("created_at")
  updatedAt       DateTime      @updatedAt @map("updated_at")
  deletedAt       DateTime?     @map("deleted_at") // soft delete

  user    User              @relation(fields: [userId], references: [id], onDelete: Cascade)
  outputs GeneratedOutput[]
  contentTags ContentTag[]

  @@index([userId, createdAt(sort: Desc)])
  @@index([userId, status])
  @@index([userId, title])
  @@map("contents")
}

model Tag {
  id        String   @id @default(uuid())
  userId    String   @map("user_id")
  name      String   @db.VarChar(64)
  // normalizedName stored lowercased for uniqueness; app layer enforces
  createdAt DateTime @default(now()) @map("created_at")

  user        User         @relation(fields: [userId], references: [id], onDelete: Cascade)
  contentTags ContentTag[]

  @@unique([userId, name]) // app lowercases before save; PG unique is case-sensitive so enforce lower in app
  @@index([userId, name])
  @@map("tags")
}

model ContentTag {
  contentId String @map("content_id")
  tagId     String @map("tag_id")
  createdAt DateTime @default(now()) @map("created_at")

  content Content @relation(fields: [contentId], references: [id], onDelete: Cascade)
  tag     Tag     @relation(fields: [tagId], references: [id], onDelete: Cascade)

  @@id([contentId, tagId])
  @@map("content_tags")
}

model GeneratedOutput {
  id            String     @id @default(uuid())
  contentId     String     @map("content_id")
  outputType    OutputType @map("output_type")
  // raw AI JSON/text before human edit; never overwritten by edit
  rawAiContent  String     @map("raw_ai_content") @db.Text // JSON stringified for complex types (FAQ array etc)
  // human-edited version; null until user edits; displayed preferentially
  editedContent String?    @map("edited_content") @db.Text
  model         String?    // e.g., gpt-4o-mini
  latencyMs     Int?       @map("latency_ms")
  promptTokens  Int?       @map("prompt_tokens")
  completionTokens Int?    @map("completion_tokens")
  createdAt     DateTime   @default(now()) @map("created_at")
  updatedAt     DateTime   @updatedAt @map("updated_at")

  content Content @relation(fields: [contentId], references: [id], onDelete: Cascade)

  @@unique([contentId, outputType]) // one row per type per content; regeneration = upsert
  @@index([contentId])
  @@index([outputType])
  @@map("generated_outputs")
}
```

---

## 3. Relationships & Cardinality

- **User 1 — N Content** (`contents.userId → users.id`, ON DELETE CASCADE)
- **User 1 — N Tag** (`tags.userId → users.id`, CASCADE)
- **Content N — N Tag** via `ContentTag` (composite PK, CASCADE both sides)
- **Content 1 — N GeneratedOutput** (`generated_outputs.contentId → contents.id`, CASCADE, unique per `outputType`)

---

## 4. Constraints & Rules

| Constraint | Enforcement |
|------------|-------------|
| Original content never overwritten by AI | App layer + schema separation: `contents.original_content` vs `generated_outputs.raw_ai_content`; no code path writes AI into contents table (RULES.md). |
| User ownership | FK `contents.userId` + ownership middleware; every query adds `where: {userId: req.user.id}`. |
| Tag uniqueness per user | `@@unique([userId, name])` + app lowercases/trim before insert. |
| One output per type per content | `@@unique([contentId, outputType])`; upsert on regenerate. |
| Soft delete | `deletedAt` nullable; all reads filter `deletedAt: null`; delete sets timestamp. |
| Title not blank | Zod `min(1) max(255)`; if input empty, backend generates title from first 60 chars. |
| Body length | Zod `min(50) max(20000)` for creation; AI truncates to 15000 chars before prompt. |
| `rawAiContent` immutable by edit | PUT /outputs only writes `editedContent`; `rawAiContent` never updated by edit endpoint. |

---

## 5. Indexes & Performance

- `contents(userId, createdAt DESC)` — list/history sorted, paginated.
- `contents(userId, status)` — status filter badges.
- `tags(userId, name)` — tag lookup/autocomplete.
- `generated_outputs(contentId)` + `outputType` — detail fetch.
- Full-text (optional, SHOULD): `CREATE INDEX ... USING gin(to_tsvector('english', title || ' ' || original_content))` for search.
- Pagination: `take/skip` with cursor fallback for >1k rows.

---

## 6. Design Decisions (Why)

1. **No separate Keyword table for MVP:** Keywords are AI extraction artifacts, not user-managed entities. Storing them as `GeneratedOutput` with `outputType=KEYWORDS` and `rawAiContent='["kw1","kw2"]'` keeps schema minimal. If keyword reuse/search becomes critical post-MVP, promote to `Keyword` + `ContentKeyword` tables.
2. **Tags as first-class reusable entity:** Tags are user-managed, reusable, and filterable — need M:N. Keywords are not.
3. **Raw vs Edited separation:** Two columns (`rawAiContent`, `editedContent`) preserve audit: raw is provider truth, edited is human truth. Full versioning would add `OutputVersion` table — deferred.
4. **Soft delete:** Prevents accidental demo data loss; hard delete can be added as `DELETE /api/content/:id?hard=true` with extra auth.
5. **SQLite fallback:** Prisma datasource provider switch via env enables local dev without PG install; production still PG.

---

## 7. Example Data (shape, not seed)

```json
{
  "users": [{ "id": "u1", "email": "maya@example.com", "name": "Maya" }],
  "contents": [{ "id": "c1", "userId": "u1", "title": "Q3 Report", "originalContent": "We launched...", "status": "completed" }],
  "tags": [{ "id": "t1", "userId": "u1", "name": "report" }],
  "content_tags": [{ "contentId": "c1", "tagId": "t1" }],
  "generated_outputs": [
    { "contentId": "c1", "outputType": "SUMMARY", "rawAiContent": "Short summary...", "editedContent": null },
    { "contentId": "c1", "outputType": "KEYWORDS", "rawAiContent": "[\"launch\",\"growth\"]", "editedContent": "[\"launch\",\"growth\",\"Q3\"]" },
    { "contentId": "c1", "outputType": "FAQ", "rawAiContent": "[{\"q\":\"What?\",\"a\":\"...\"}]", "editedContent": null }
  ]
}
```

---

## 8. Migrations

- `prisma migrate dev --name init` for local; `prisma migrate deploy` in CI/Render.
- Seed script (`database/seed.ts`) creates demo user + 2 contents + outputs for judges (optional, gated by `SEED_DEMO=true`).

## 9. Compliance with Business Rules
- ✅ User ownership via `userId` FK + middleware.
- ✅ Original preservation via separate table/column, no overwrite path.
- ✅ Source-output traceability via `contentId` FK.
- ✅ Historical access via `createdAt/updatedAt` + list/detail endpoints.


# API_SPEC — Content Intelligence Platform

**Version:** 1.0.0  
**Date:** 2026-09-22  
**Base URL:** `http://localhost:4000/api` (dev) / `https://api.example.com/api` (prod) — TODO placeholder  
**Auth:** JWT via `Authorization: Bearer <token>` or httpOnly cookie  
**Content-Type:** `application/json`  
**Error Envelope:** `{ "error": "string", "code": "ENUM", "details": [...] }`

---

## 1. Conventions

- **Versioning:** `/api/v1/...` with alias `/api/...` for MVP.
- **Pagination:** `?page=1&limit=10` (default 10, max 50). Response includes `{data, pagination:{page, limit, total, totalPages}}`.
- **Filtering:** `?search=string&tag=tagName&status=draft|processing|completed|failed&sort=createdAt&order=desc`
- **Validation:** Zod on backend; 400 on fail with `details`.
- **Ownership:** Every content/output endpoint checks `content.userId === req.user.id` else 403 `FORBIDDEN`.
- **Rate limit:** 60 req/min/IP; AI endpoints 10/min/user; 429 on exceed.

---

## 2. Authentication

### POST /api/auth/register
- **Purpose:** Create user, return tokens.
- **Auth:** No
- **Body:** `{ "name": "string 2-50", "email": "email", "password": "string 8-64" }`
- **Success 201:** `{ "user": {"id","email","name"}, "accessToken":"jwt", "refreshToken":"jwt" }`
- **Errors:** 400 validation, 409 email exists.

### POST /api/auth/login
- **Purpose:** Authenticate, return tokens.
- **Auth:** No
- **Body:** `{ "email":"email", "password":"string" }`
- **Success 200:** `{ "user": {...}, "accessToken","refreshToken" }`
- **Errors:** 400, 401 invalid credentials.

### POST /api/auth/refresh
- **Purpose:** Rotate access token.
- **Auth:** Refresh token (cookie/body)
- **Body:** `{ "refreshToken":"jwt" }` (or cookie)
- **Success 200:** `{ "accessToken":"jwt" }`
- **Errors:** 401 expired/invalid.

### POST /api/auth/logout
- **Purpose:** Invalidate refresh (client deletes cookie).
- **Auth:** Yes
- **Success 200:** `{ "message":"Logged out" }`

### GET /api/auth/me
- **Purpose:** Current user profile.
- **Auth:** Yes
- **Success 200:** `{ "id","email","name","createdAt" }`
- **Errors:** 401.

---

## 3. Content

### POST /api/content
- **Purpose:** Create content (save paste).
- **Auth:** Yes
- **Body:** `{ "title"?: "string 0-255", "originalContent": "string 50-20000", "tags"?: ["string 1-30"] }` — if title empty, backend auto-generates.
- **Validation:** Zod; tags normalized lower, deduped, auto-created per user.
- **Success 201:** `{ "id","userId","title","originalContent","status":"draft","tags":[{"id","name"}],"createdAt","updatedAt" }`
- **Errors:** 400, 401, 429.

### GET /api/content
- **Purpose:** List own contents with pagination/filter.
- **Auth:** Yes
- **Query:** `?page&limit&search&tag&status&sort&order`
- **Success 200:** `{ "data":[contentSummary], "pagination":{...} }` where summary includes `tagCount`, `outputCount`, `status`.
- **Errors:** 401.

### GET /api/content/:id
- **Purpose:** Content detail + tags + output counts.
- **Auth:** Yes (ownership)
- **Success 200:** `{ "id","title","originalContent","status","tags":[],"createdAt","updatedAt","outputCount":5 }`
- **Errors:** 401, 403, 404.

### PUT /api/content/:id
- **Purpose:** Edit original content (preserves separation; does NOT touch outputs).
- **Auth:** Yes (ownership)
- **Body:** `{ "title"?: "string 1-255", "originalContent"?: "string 50-20000", "tags"?: ["string"] }` — tags replace set if provided.
- **Success 200:** Updated content object.
- **Errors:** 400, 401, 403, 404.

### DELETE /api/content/:id
- **Purpose:** Soft delete (sets `deletedAt`); cascades logically.
- **Auth:** Yes (ownership)
- **Query:** `?hard=true` (optional, not exposed in UI; requires extra confirm in future).
- **Success 200:** `{ "message":"Content deleted" }` or 204.
- **Errors:** 401, 403, 404.

---

## 4. AI — Analysis & Transformation

### POST /api/content/:id/analyze
- **Purpose:** Run analysis pipeline (summary, keyPoints, keywords, topics, suggestedTags).
- **Auth:** Yes (ownership)
- **Body:** None (uses stored `originalContent`) or optional `{ "force": true }` to regenerate.
- **Validation:** Content must be `draft|completed|failed`; if `processing` → 409.
- **Flow:** Sets `status=processing` → calls `AIProvider.analyze()` → validates → upserts 5 outputs → `status=completed`.
- **Success 200:** `{ "contentId","status":"completed","outputs":[ { "id","outputType","rawAiContent","editedContent":null,"model","createdAt" } ] }` — 5 items.
- **Errors:** 401, 403, 404, 409 already processing, 502 `AI_ERROR`/`AI_VALIDATION_FAILED`, 429 rate limited.

### POST /api/content/:id/transform
- **Purpose:** Transform into FAQ / Social post / Executive summary (selective).
- **Auth:** Yes (ownership)
- **Body:** `{ "types": ["FAQ","SOCIAL_POST","EXECUTIVE_SUMMARY"] }` — at least one, max 3. Enum values match `OutputType`.
- **Validation:** Zod enum array; content not processing.
- **Flow:** For each type, prompt → validate → upsert one `GeneratedOutput`.
- **Success 200:** `{ "contentId","outputs":[ ... up to 3 ] }`
- **Errors:** 400 invalid types, 401/403/404, 409, 502, 429.

---

## 5. Generated Outputs

### GET /api/content/:id/outputs
- **Purpose:** List all generated outputs for a content (history).
- **Auth:** Yes (ownership via content)
- **Query:** `?type=SUMMARY` optional filter.
- **Success 200:** `{ "contentId","outputs":[ { "id","outputType","rawAiContent","editedContent","model","latencyMs","createdAt","updatedAt" } ] }`
- **Errors:** 401, 403, 404.

### GET /api/outputs/:id
- **Purpose:** Single output detail.
- **Auth:** Yes (ownership via parent content)
- **Success 200:** Output object.
- **Errors:** 401, 403, 404.

### PUT /api/outputs/:id
- **Purpose:** Edit generated output (human review). Updates ONLY `editedContent`, never `rawAiContent`.
- **Auth:** Yes (ownership via parent content)
- **Body:** `{ "editedContent": "string 1-10000" }` — for array types, send JSON stringified array.
- **Validation:** Zod; edited content required.
- **Success 200:** `{ "id","outputType","rawAiContent","editedContent","updatedAt" }`
- **Errors:** 400, 401, 403, 404.

### DELETE /api/outputs/:id
- **Purpose:** Delete a single output type (optional, not required for MVP UI).
- **Auth:** Yes
- **Success 200:** `{ "message":"Output deleted" }`
- **Errors:** 401, 403, 404.

---

## 6. Tags

### GET /api/tags
- **Purpose:** List user's reusable tags.
- **Auth:** Yes
- **Success 200:** `{ "tags":[ {"id","name","contentCount"} ] }`

### PUT /api/tags/:id
- **Purpose:** Rename tag (affects all linked contents).
- **Auth:** Yes (ownership)
- **Body:** `{ "name":"string 1-30" }`
- **Success 200:** Tag object
- **Errors:** 400, 409 name exists, 401/403/404.

### DELETE /api/tags/:id
- **Purpose:** Delete tag (removes from all contents, not contents themselves).
- **Auth:** Yes
- **Success 200:** `{ "message":"Tag deleted" }`

---

## 7. Health & Misc

### GET /api/health
- **Auth:** No
- **Success 200:** `{ "status":"ok","uptime":123,"db":"ok","ai":"ok|mock","version":"1.0.0" }`

---

## 8. Error Format & Status Codes

| Status | Code Enum | When |
|--------|-----------|------|
| 400 | `VALIDATION_ERROR` | Zod fail; body has `details:[{path,message}]` |
| 401 | `UNAUTHORIZED` | Missing/invalid token |
| 403 | `FORBIDDEN` | Ownership check fail |
| 404 | `NOT_FOUND` | Content/output/tag not found or soft-deleted |
| 409 | `CONFLICT` | Already processing, duplicate email/tag |
| 429 | `RATE_LIMITED` | Rate limit exceeded |
| 502 | `AI_ERROR` / `AI_VALIDATION_FAILED` | Provider fail or invalid JSON |

**Error body example:**
```json
{
  "error": "Validation failed",
  "code": "VALIDATION_ERROR",
  "details": [{ "path": "originalContent", "message": "Must be at least 50 characters" }]
}
```

---

## 9. Request/Response Examples

### Create Content
```http
POST /api/content
Authorization: Bearer <token>
{
  "title": "Q3 Launch Report",
  "originalContent": "We launched product X in Q3 with 30% growth...",
  "tags": ["report", "q3"]
}
→ 201
{
  "id": "c_123",
  "title": "Q3 Launch Report",
  "originalContent": "We launched...",
  "status": "draft",
  "tags": [{"id":"t1","name":"report"},{"id":"t2","name":"q3"}],
  "createdAt": "2026-09-22T10:00:00Z"
}
```

### Analyze
```http
POST /api/content/c_123/analyze
→ 200
{
  "contentId": "c_123",
  "status": "completed",
  "outputs": [
    {"outputType":"SUMMARY","rawAiContent":"Short summary..."},
    {"outputType":"KEY_POINTS","rawAiContent":"[\"Point 1\",\"Point 2\"]"},
    ...
  ]
}
```

### Edit Output
```http
PUT /api/outputs/o_456
{ "editedContent": "Edited summary with custom tone." }
→ 200
{ "id":"o_456","outputType":"SUMMARY","rawAiContent":"Short summary...","editedContent":"Edited..."}
```

---

## 10. Security Notes
- All endpoints except `/auth/*` and `/health` require `auth` middleware.
- `PUT /api/outputs/:id` validates via join `outputs → content → userId`.
- AI key never appears in responses.
- Input sanitized: trim, strip HTML tags, limit lengths before DB/AI.


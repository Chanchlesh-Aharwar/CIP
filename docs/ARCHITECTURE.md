# ARCHITECTURE — Content Intelligence Platform

**Version:** 1.0.0  
**Date:** 2026-09-22  
**Stack Decision Record:** Preferred stack for hackathon velocity + demo quality

---

## 1. High-Level Architecture

### 1.1 Overview
Single logical app split into 3 deployable units: **Frontend (SPA)**, **Backend API (stateless)**, **PostgreSQL**. AI is an external service called via provider abstraction (OpenAI-compatible). No separate worker for MVP; backend calls AI synchronously with timeout/retry, persists results, returns to frontend.

### 1.2 System Diagram

```mermaid
graph TB
    User([User Browser])
    FE[Frontend SPA<br/>React + Vite + TS + Tailwind]
    BE[Backend API<br/>Node + Express + TS]
    DB[(PostgreSQL<br/>Prisma ORM)]
    AI[[AI Provider<br/>OpenAI / Mock]]
    Auth[JWT Auth<br/>bcrypt + httpOnly cookie]

    User -->|HTTPS| FE
    FE -->|REST JSON<br/>/api/*| BE
    BE -->|SQL via Prisma| DB
    BE -->|HTTPS JSON| AI
    BE --- Auth
    Auth --> DB
```

### 1.3 User Content-Processing Flow

```mermaid
sequenceDiagram
    actor U as User
    participant FE as Frontend
    participant BE as Backend API
    participant DB as PostgreSQL
    participant AI as AI Provider

    U->>FE: Paste content + title + tags
    FE->>BE: POST /api/content {title, body, tags}
    BE->>DB: INSERT content + content_tags
    DB-->>BE: content_id
    BE-->>FE: 201 Created
    FE->>U: Show in history (status: draft)

    U->>FE: Click "Analyze"
    FE->>BE: POST /api/content/:id/analyze
    BE->>DB: UPDATE content status=processing
    BE->>AI: prompt(analysis) with body
    AI-->>BE: {summary, keyPoints, keywords, topics, suggestedTags}
    BE->>BE: Validate JSON (Zod)
    BE->>DB: INSERT generated_outputs x5 (upsert)
    BE->>DB: UPDATE content status=completed
    BE-->>FE: 200 outputs[]
    FE->>U: Review & Edit (raw vs edited)

    U->>FE: Select transformations + "Transform"
    FE->>BE: POST /api/content/:id/transform {types:[FAQ,SOCIAL,EXEC]}
    BE->>AI: prompt(transform) per type
    AI-->>BE: {faq, socialPost, executiveSummary}
    BE->>DB: INSERT generated_outputs (FAQ etc)
    BE-->>FE: 200 outputs
    FE->>U: Review transform outputs

    U->>FE: Edit output + Save
    FE->>BE: PUT /api/outputs/:id {edited_content}
    BE->>DB: UPDATE edited_content
    BE-->>FE: 200 OK
```

### 1.4 AI Generation Flow (detailed)

```mermaid
flowchart TD
    A[Frontend: POST analyze/transform] --> B[Backend: AuthZ + Ownership Check]
    B --> C{Validate input length<br/>50-20k chars}
    C -->|fail| E[400 Validation Error]
    C -->|pass| D[Update content status=processing]
    D --> F[AI Service: buildPrompt + truncate]
    F --> G[Provider Abstraction: call model]
    G --> H{Response valid JSON?}
    H -->|no| I[Retry 1x with repair prompt]
    I --> H2{Valid?}
    H2 -->|no| J[Mark content status=failed<br/>Return 502 AI_ERROR]
    H2 -->|yes| K[Zod Validation + sanitize]
    H -->|yes| K
    K --> L{Business rules pass?}
    L -->|no| J
    L -->|yes| M[Persist: raw_ai_content + edited_content=null<br/>+ model/latency metadata]
    M --> N[Update content status=completed]
    N --> O[Return outputs to FE for review]
    O --> P[User edits -> PUT /outputs/:id saves edited_content<br/>raw preserved]
```

### 1.5 Database Relationship Overview

```mermaid
erDiagram
    USERS ||--o{ CONTENTS : owns
    CONTENTS ||--o{ GENERATED_OUTPUTS : has
    CONTENTS ||--o{ CONTENT_TAGS : has
    TAGS ||--o{ CONTENT_TAGS : used_in
    CONTENTS }o--|| USERS : belongs_to

    USERS {
        uuid id PK
        string email UK
        string password_hash
        string name
        datetime created_at
    }
    CONTENTS {
        uuid id PK
        uuid user_id FK
        string title
        text original_content
        enum status
        datetime created_at
        datetime updated_at
    }
    TAGS {
        uuid id PK
        uuid user_id FK
        string name
        datetime created_at
    }
    CONTENT_TAGS {
        uuid content_id FK
        uuid tag_id FK
    }
    GENERATED_OUTPUTS {
        uuid id PK
        uuid content_id FK
        enum output_type
        jsonb raw_ai_content
        text edited_content
        string model
        int latency_ms
        datetime created_at
    }
```

---

## 2. Technology Stack

### 2.1 Chosen Stack (recommended)

| Layer | Technology | Version | Why |
|-------|------------|---------|-----|
| **Frontend** | React + Vite + TypeScript (strict) | React 18+, Vite 5 | Fastest hackathon SPA, HMR, strong TS, huge ecosystem |
| **UI** | Tailwind CSS + shadcn/ui + lucide-react | Tailwind 3.x | Professional SaaS look in hours, not days; accessible primitives |
| **State/Data** | TanStack Query + Zustand + React Router v6 | Latest | Query handles server cache/loading/error; Zustand for auth/ui; Router for SPA |
| **Backend** | Node.js + Express + TypeScript | Node 20 LTS, Express 4 | Minimal boilerplate, easy AI SDK integration, team familiarity |
| **ORM** | Prisma | 5.x | Type-safe, migrations, great DX; abstracts Postgres/SQLite swap |
| **Database** | PostgreSQL (production) / SQLite (local fallback) | PG 15 | Relational integrity for ownership/FK; Prisma makes swap painless |
| **Auth** | JWT (access 15m + refresh 7d) + bcrypt + httpOnly cookie | - | Stateless, secure, demo-friendly; cookie prevents XSS theft vs localStorage |
| **Validation** | Zod (shared FE/BE) + zod-prisma | - | Single schema source, runtime safety for AI JSON |
| **AI** | OpenAI SDK (`openai` npm) behind `AIProvider` interface + Mock provider | - | Swap model without code change; mock allows offline demo |
| **Testing** | Vitest + Supertest + React Testing Library | - | Fast, Vite-native, easy coverage |
| **Lint/Format** | ESLint + Prettier + Husky | - | Consistency for vibe coding |
| **Deployment** | Frontend: Vercel; Backend: Render/Railway; DB: Neon/Supabase | - | Free tiers, 5-min deploys, PG-compatible |
| **Monitoring** | pino logger + request-id + health endpoint | - | Structured logs for debugging demo |

### 2.2 Alternatives Considered & Rejected
- **Next.js** – heavier for pure SPA demo; Vite simpler.
- **NestJS** – over-engineered for MVP; Express faster to hack.
- **MongoDB** – loses FK ownership guarantees; relational fits business rules better.
- **LangChain** – unnecessary abstraction for 2 prompts; direct SDK keeps control.

### 2.3 Why This Stack Fits Hackathon
- **Fast dev:** Vite + Tailwind + Prisma = scaffold to CRUD in <2 hrs.
- **Reliability:** TS strict + Zod + FK constraints prevent overwrite bugs.
- **AI integration:** OpenAI SDK JSON mode is trivial; abstraction allows mock without key.
- **Easy deployment:** Vercel+Render+Neon all have one-click PG + env vars.
- **Demo quality:** shadcn gives SaaS polish without designer.

---

## 3. Frontend Architecture

- **Structure:** `frontend/src/{components, pages, hooks, services, stores, lib, types}`
- **Pages:** `/login`, `/register`, `/dashboard`, `/content/new`, `/content/:id`, `/content` (history)
- **Components:** `ContentEditor`, `AIProcessingButton`, `OutputCard` (with Edit/Save/Copy), `TagInput`, `StatusBadge`, `LoadingSkeleton`, `EmptyState`
- **Data flow:** TanStack Query for GET list/detail/outputs; mutations for create/update/analyze/transform; optimistic update for tag edit.
- **Auth:** `AuthContext` holds user; router guards redirect to `/login`; token in httpOnly cookie (or Bearer fallback for API testing).
- **AI UX:** Explicit "Analyzing…" spinner + progress; results appear as cards with `raw` badge and Edit CTA; never auto-finalizes.

## 4. Backend Architecture

- **Structure:** `backend/src/{routes, controllers, services, middleware, lib/ai, lib/validation, prisma}`
- **Layers:**
  - `routes` → `controllers` (thin) → `services` (business logic) → `prisma` (DB) + `aiProvider` (AI)
  - `middleware`: `auth`, `ownershipCheck`, `validateRequest`, `errorHandler`, `rateLimiter`
- **AI module:** `lib/ai/{provider.ts, prompts.ts, validator.ts, mock.ts}` — isolated from content service.
- **Stateless:** No session store; JWT verified per request; horizontal scale via `DATABASE_URL`.
- **Error handling:** Central error middleware maps to `{error, code, details}` JSON; AI errors → 502 with `AI_ERROR`.

## 5. Database (summary — see DATABASE.md)
- PG with Prisma; FKs with `ON DELETE CASCADE` for outputs/tags; unique `(user_id, lower(name))` for tags; GIN index on title/body for search (optional).

## 6. Authentication
- Email/password signup → bcrypt hash → JWT access+refresh.
- Protected routes: all `/api/content/*` and `/api/outputs/*` require `Authorization: Bearer` or cookie.
- Ownership middleware: `content.user_id === req.user.id` else 403.

## 7. API Layer
- Base: `/api`
- Versioning: `/api/v1` (alias `/api` for MVP)
- Conventions: REST JSON, Zod validation, pagination `?page&limit`, filtering `?tag&search`, standard error envelope.
- See `API_SPEC.md` for full endpoint list.

## 8. Data Flow (end-to-end)
1. User pastes content → FE validates (Zod) → POST → BE validates → DB insert → 201.
2. User triggers AI → BE checks ownership → builds prompt (truncate to 15k chars) → calls provider → validates JSON → persists outputs (upsert by type) → returns.
3. User edits output → PUT → BE validates ownership via content → updates `edited_content` only → returns.
4. History: GET list with pagination/filter → FE renders status badges + last updated.

## 9. Error Handling
- **Validation:** 400 with `details: [{path, message}]`.
- **Auth:** 401 (missing/invalid token), 403 (wrong owner).
- **Not found:** 404.
- **AI:** 502 `AI_ERROR` with `retryable: true`, logs model/latency; FE shows retry button.
- **Rate limit:** 429.
- **Fallback:** FE shows toast + inline error; never loses user's typed content (local state).

## 10. Security
- Helmet, CORS (allow frontend origin only), rate limit (60/min), Zod sanitization, Prisma parameterized queries (no SQL injection), bcrypt, JWT secret via env, AI key never exposed to FE, logs redact secrets.

## 11. Deployment
- **Frontend:** `vite build` → Vercel (env `VITE_API_URL`).
- **Backend:** `tsc` build → Docker or Render (env `DATABASE_URL`, `JWT_SECRET`, `AI_API_KEY`, `AI_MODEL`).
- **DB:** Neon/Supabase PG; migrations via `prisma migrate deploy`.
- **Env:** See `.env.example`.

## 12. Monitoring / Logging
- `pino` JSON logs with `requestId`, `userId`, `contentId`, `model`, `latencyMs`, `tokens`.
- `GET /api/health` → `{status, uptime, db: ok, ai: ok/mock}`.
- Frontend: error boundary + console error for AI failures.

---

## 13. Constraints & Compliance
- Original vs generated separation enforced at code + DB level (see RULES.md).
- No large-file storage; `original_content` is TEXT, capped 20k chars.
- All generated outputs traceable via `content_id` FK.


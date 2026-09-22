# TASKS — Content Intelligence Platform

**Version:** 1.0.0  
**Date:** 2026-09-22  
**Legend:** `[ ] Not started` `[~] In progress` `[x] Completed` `[!] Blocked`

> Each task is small enough for one AI coding session. Complete in order; do not skip phases. Update status after each task.

---

## MODULE 01 — Project Foundation (Current Prompt)

| ID | Name | Status | Notes |
|----|------|--------|-------|
| M01-01 | Frontend scaffold (Vite+React+Router+Axios+layout+placeholders) | [x] Completed | `frontend/` routes /login,/register,/dashboard,/content,/content/new placeholders; `services/api.js` uses VITE_API_BASE_URL; build OK 2026-09-22 |
| M01-02 | Backend scaffold (FastAPI+Uvicorn+CORS+health+error handling) | [x] Completed | `backend/app/main.py` + `api/routes/health.py` + `middleware/error_handler.py`; GET /api/health → {"status":"ok"} verified |
| M01-03 | Database foundation (SQLAlchemy+PyMySQL+Pydantic config) | [x] Completed | `app/core/config.py` + `app/core/database.py` (engine/SessionLocal/Base) env-based; graceful fail if MySQL down |
| M01-04 | Env & CORS & docs | [x] Completed | `frontend/.env.example` + `backend/.env.example` + CORS for 5173→8000 + Swagger /docs OK |
| M01-05 | Verify & docs update | [x] Completed | npm build OK, pip install OK, health OK, MEMORY.md updated |

> Stack confirmed per prompt: React+Vite+JS | FastAPI+MySQL/SQLAlchemy. Auth/AI/Content CRUD deferred to later modules.

## MODULE 02 — Database Models (Option A)

| ID | Name | Status | Notes |
|----|------|--------|-------|
| M02-01 | SQLAlchemy models (User, Content, Tag, ContentTag, GeneratedOutput) | [x] Completed | `backend/app/models/{user,content,tag,content_tag,generated_output}.py` — UUID PK, enums, FK CASCADE, InnoDB utf8mb4, indexes with mysql_length fix |
| M02-02 | Alembic + init_db foundation | [x] Completed | `alembic/` env configured (target_metadata=Base), `backend/init_db.py` create_all, `alembic.ini` + env.py with settings.database_url |
| M02-03 | MySQL schema creation & FK verification | [x] Completed | Dropped old MyISAM, recreated InnoDB 5 tables, FK enforcement tested (IntegrityError on bad FK), health OK 2026-09-22 |
| M02-04 | Docs & requirements | [x] Completed | `database/README.md`, `requirements.txt` + alembic, verified inserts |

> Next: Module 03 — Auth (JWT) or Content CRUD per prompt sequencing.

## MODULE 03 — Authentication (Option A)

| ID | Name | Status | Notes |
|----|------|--------|-------|
| M03-01 | Security utils (hash/verify + JWT) | [x] Completed | `app/core/security.py` — bcrypt via passlib, HS256, access 30m + refresh 7d, jwt encode/decode; `pyjwt` + `passlib[bcrypt]` |
| M03-02 | Schemas + dependencies | [x] Completed | `schemas/auth.py` (Register/Login/Token/User), `api/dependencies/auth.py` HTTPBearer + `get_current_user` 401 on missing/invalid/expired |
| M03-03 | Auth routes | [x] Completed | `api/routes/auth.py` — POST /api/auth/register 201 (409 dup), /login 401 invalid, /refresh, GET /me 401, POST /logout; mounted in `app/main.py` |
| M03-04 | Verified | [x] Completed | Health OK, register maya2@example.com 201, duplicate 409, login 200, me bearer 200, refresh 200, wrong pass 401 — 2026-09-22 |

> Next: Module 04 — Content CRUD or as per prompt.

## MODULE 04 — Content CRUD (Option A)

| ID | Name | Status | Notes |
|----|------|--------|-------|
| M04-01 | Content schemas + tag normalization | [x] Completed | `schemas/content.py` — ContentCreate 50-20000 chars, title auto-gen, tags 30 chars lower+dedupe |
| M04-02 | Content CRUD routes | [x] Completed | `api/routes/content.py` — POST 201, GET list (pagination/search/tag/status) 401, GET /:id 403 isolation, PUT edit (preserve outputs), DELETE soft delete deleted_at |
| M04-03 | Tags routes | [x] Completed | `api/routes/tags.py` — GET /tags with contentCount, PUT rename 409, DELETE |
| M04-04 | Verified | [x] Completed | Alice/Bob isolation 403, create tech/ai dedup, search/tag filter, auto-title, delete soft hides, 422 short, 401 without token — 2026-09-22 |

> Next: Module 05 — AI Analysis / Transformation or as per prompt.

## MODULE 05 — AI Analysis (Option A)

| ID | Name | Status | Notes |
|----|------|--------|-------|
| M05-01 | AI provider abstraction + validator | [x] Completed | `app/ai/validator.py` AnalysisResult Zod-like, `prompts.py` truncate 15k, `mock.py` deterministic, `provider.py` get_provider() mock vs openai, openai JSON mode + latency |
| M05-02 | Analyze endpoint + outputs | [x] Completed | `api/routes/ai.py` POST /api/content/:id/analyze (processing→completed/failed, upsert 5 types SUMMARY/KEY_POINTS/KEYWORDS/TOPICS/SUGGESTED_TAGS), `api/routes/outputs.py` GET list/get + PUT editedContent (raw preserved, 403, 404, 400) |
| M05-03 | Verified | [x] Completed | Alice content analyze 5 outputs mock, list outputs, edit preserves raw, re-analyze upsert 5, Bob 403, bad id 404 — 2026-09-22 |

> Next: Module 06 — Content Transformation (FAQ/Social/Exec) or as per prompt.

## MODULE 06 — Content Transformation (Recommended)

| ID | Name | Status | Notes |
|----|------|--------|-------|
| M06-01 | Transform validator + provider | [x] Completed | `ai/validator.py` TransformResult (faq 3-7, social ≤280, exec 80-1500), `ai/provider.py` openai transform JSON + latency, `mock.py` 123w exec, 3 FAQ, social 109 |
| M06-02 | Transform endpoint | [x] Completed | `api/routes/ai.py` POST /api/content/:id/transform selective 1-3 types, validates ALLOWED, upsert FAQ/SOCIAL_POST/EXECUTIVE_SUMMARY, status completed, 400 invalid/duplicate, 422 empty, 403, 404 |
| M06-03 | Verified | [x] Completed | FAQ 3 items, social 109 ≤280, exec 123w 120-180, all 3 together 8 total outputs (5 analysis +3 transform), invalid 400, 403 Bob, empty 422 — 2026-09-22 |

> Next: Module 07 — Frontend Integration or as per prompt.

## MODULE 07 — Frontend Integration (Option A)

| ID | Name | Status | Notes |
|----|------|--------|-------|
| M07-01 | Auth wiring | [x] Completed | `services/api.js` bearer interceptor, `context/AuthContext.jsx` login/register/logout + me, `components/ProtectedRoute.jsx`, `pages/Login.jsx`/`Register.jsx` with API + error + demo hint |
| M07-02 | Content pages + AI | [x] Completed | `pages/CreateContent.jsx` POST, `ContentList.jsx` search/tag/pagination, `ContentDetail.jsx` original + tags + Analyze/Transform (selective) + outputs grid edit/copy/save raw preserved, `Dashboard.jsx` stats+health+recent |
| M07-03 | Routing + build | [x] Completed | `App.jsx` AuthProvider + protected /dashboard/content/content/new/content/:id + public /login/register, vite build 232k 76k gzip OK 2026-09-22 |

> Next: Module 08 — Polish/Error states/Deployment or as per prompt.

## MODULE 08 — Polish + Error/Loading States (Option A)

| ID | Name | Status | Notes |
|----|------|--------|-------|
| M08-01 | Shared UI components | [x] Completed | `components/Toast.jsx` provider+useToast, `Skeleton.jsx`+CardSkeleton, `EmptyState.jsx`, `ErrorBanner.jsx`, `ConfirmModal.jsx`, `pages/NotFound.jsx` |
| M08-02 | Pages polish | [x] Completed | ContentList skeleton+empty+ErrorBanner 403/failed badge, ContentDetail skeleton+empty+delete modal+copy toast+processing indicator, Create validation toasts, Login/Register ErrorBanner+toasts, Dashboard skeleton+empty, App.jsx ToastProvider + NotFound route |
| M08-03 | Build | [x] Completed | vite build 239k 78k gzip 104 modules OK 2026-09-22 |

> Next: Module 09 — Testing/Security/Deployment or as per prompt.

## MODULE 09 — Final Review + Deployment Prep (Option A)

| ID | Name | Status | Notes |
|----|------|--------|-------|
| M09-01 | Final verification | [x] Completed | BE /api/health ok, /docs 961, DB 5 InnoDB tables, FE build 239k 78k gzip 104 modules, auth/content/AI manual HTTP verified |
| M09-02 | README + env + gitignore | [x] Completed | README updated to FastAPI+MySQL actual stack, structure, setup (pip/npm, init_db.py, uvicorn/vite), .env.example MySQL+JWT+AI, .gitignore python cache |
| M09-03 | Changelog + demo | [x] Completed | MEMORY changelog M09, demo 60s script in README, ready for submission |

> All Modules 01-09 complete. Project ready for hackathon submission.

## PHASE 0 — Documentation (Original Plan)

| ID | Name | Objective | Prerequisites | Files | Requirements | Acceptance | Status |
|----|------|-----------|---------------|-------|--------------|------------|--------|
| T00 | Docs completeness audit | Verify all docs consistent | All docs created | `docs/*.md` | Check PRD↔Arch↔DB↔AI↔API↔Design↔Tasks; run audit in this doc's §Audit | No PASS/WARNING/BLOCKER mismatch | [x] Completed |

---

## PHASE 1 — Project Setup

| ID | Name | Objective | Prerequisites | Files | Requirements | Acceptance | Status |
|----|------|-----------|---------------|-------|--------------|------------|--------|
| T01 | Monorepo scaffold | Init repo structure | T00 | `package.json`, `frontend/`, `backend/`, `database/` | npm workspaces or separate packages; TS strict; eslint+prettier | `npm run dev` scripts exist; `tsc --noEmit` passes | [ ] Not started |
| T02 | Env & gitignore | Secrets safety | T01 | `.env.example`, `.gitignore` | Document all env vars; ignore `.env`, `node_modules`, `dist`, `build` | `.env.example` committed, `.env` ignored, no secrets in repo | [ ] Not started |
| T03 | Shared validation pkg | Zod schemas shared FE/BE | T01 | `shared/validation.ts` or `backend/src/lib/validation` | Schemas for content, auth, outputs | Schemas imported by both FE/BE; tests pass | [ ] Not started |

## PHASE 2 — Database

| ID | Name | Objective | Prerequisites | Files | Requirements | Acceptance | Status |
|----|------|-----------|---------------|-------|--------------|------------|--------|
| T04 | Prisma schema & migrate | Create tables | T01 | `backend/prisma/schema.prisma`, `database/` | Implement schema from DATABASE.md; `prisma migrate dev` | Tables created; `prisma studio` shows them | [ ] Not started |
| T05 | Seed script | Demo data | T04 | `backend/prisma/seed.ts` | Create demo user maya@example.com + 2 contents + outputs (gated `SEED_DEMO`) | `npm run seed` inserts without duplicate | [ ] Not started |

## PHASE 3 — Backend Foundation

| ID | Name | Objective | Prerequisites | Files | Requirements | Acceptance | Status |
|----|------|-----------|---------------|-------|--------------|------------|--------|
| T06 | Express server + health | Bootable API | T04 | `backend/src/server.ts`, `routes/health.ts` | Express, helmet, cors, pino, `GET /api/health` | `curl /api/health` → 200 | [ ] Not started |
| T07 | Error & logging middleware | Unified errors | T06 | `middleware/errorHandler.ts` | Map errors to `{error,code,details}`; requestId | 400/404/500 all return envelope | [ ] Not started |
| T08 | Auth middleware | JWT verify | T06 | `middleware/auth.ts` | Verify Bearer/cookie, attach `req.user`, 401 on fail | Protected route rejects without token | [ ] Not started |

## PHASE 4 — Authentication

| ID | Name | Objective | Prerequisites | Files | Requirements | Acceptance | Status |
|----|------|-----------|---------------|-------|--------------|------------|--------|
| T09 | Register/Login/Refresh | User auth | T08 | `routes/auth.ts`, `services/auth.ts` | bcrypt, JWT access+refresh, Zod validation | Register→Login→Me flow works; 409 duplicate | [ ] Not started |
| T10 | Ownership middleware | Isolation | T09 | `middleware/ownership.ts` | Check `content.userId === req.user.id` for all content/output routes | User B 403 on User A content | [ ] Not started |

## PHASE 5 — Content CRUD

| ID | Name | Objective | Prerequisites | Files | Requirements | Acceptance | Status |
|----|------|-----------|---------------|-------|--------------|------------|--------|
| T11 | Create content | Save paste | T10 | `routes/content.ts`, `services/content.ts` | POST /api/content, auto-title, tag upsert | 201 returns content with tags; validation 400 | [ ] Not started |
| T12 | List & filter | History | T11 | `services/content.ts` | GET /api/content with pagination/search/tag/status | Pagination works; search returns <500ms | [ ] Not started |
| T13 | Detail & edit & delete | CRUD | T11 | `routes/content.ts` | GET/:id, PUT/:id (preserve outputs), DELETE (soft) | Edit does not touch outputs; soft delete hides | [ ] Not started |
| T14 | Tags CRUD | Reusable tags | T11 | `routes/tags.ts` | GET/PUT/DELETE /api/tags with ownership | Rename propagates; uniqueness per user | [ ] Not started |

## PHASE 6 — AI Analysis

| ID | Name | Objective | Prerequisites | Files | Requirements | Acceptance | Status |
|----|------|-----------|---------------|-------|--------------|------------|--------|
| T15 | AI provider abstraction | Swap-able AI | T06 | `lib/ai/provider.ts`, `lib/ai/mock.ts`, `lib/ai/prompts.ts` | Interface + OpenAI + Mock, env switch | Mock returns valid JSON without API key | [ ] Not started |
| T16 | Analysis prompt & validator | Structured output | T15 | `lib/ai/validator.ts`, `lib/ai/prompts.ts` | Zod schemas, truncate 15k, JSON mode, repair retry | Invalid JSON triggers retry once | [ ] Not started |
| T17 | POST /analyze endpoint | Generate 5 outputs | T13,T16 | `routes/content.ts`, `services/ai.ts` | Status processing→completed/failed, upsert 5 rows, 502 on fail | 200 returns 5 outputs; raw vs edited separate | [ ] Not started |

## PHASE 7 — Content Transformation

| ID | Name | Objective | Prerequisites | Files | Requirements | Acceptance | Status |
|----|------|-----------|---------------|-------|--------------|------------|--------|
| T18 | Transform prompts | FAQ/Social/Exec | T16 | `lib/ai/prompts.ts` | Selective types, length guards (FAQ 3-7, social ≤280, exec 120-180w) | Prompts include hallucination guard | [ ] Not started |
| T19 | POST /transform endpoint | Transform | T17,T18 | `routes/content.ts` | Types array validation, upsert per type | 200 with 1-3 outputs; 400 invalid types | [ ] Not started |

## PHASE 8 — Generated Output Editing

| ID | Name | Objective | Prerequisites | Files | Requirements | Acceptance | Status |
|----|------|-----------|---------------|-------|--------------|------------|--------|
| T20 | Outputs read endpoints | History | T17 | `routes/outputs.ts` | GET /content/:id/outputs, GET /outputs/:id with ownership | Returns raw+edited+model meta | [ ] Not started |
| T21 | Edit output | Human review | T20 | `routes/outputs.ts` | PUT /outputs/:id updates only editedContent | Raw unchanged after edit; toggle in FE | [ ] Not started |

## PHASE 9 — Frontend Integration

| ID | Name | Objective | Prerequisites | Files | Requirements | Acceptance | Status |
|----|------|-----------|---------------|-------|--------------|------------|--------|
| T22 | Auth pages | Login/Register | T09 | `frontend/src/pages/Auth.tsx` | Forms, validation, redirect, demo hint | Auth flow works; guards redirect | [ ] Not started |
| T23 | Content creation page | Paste & save | T11 | `frontend/src/pages/CreateContent.tsx` | Editor, title, TagInput, char count, Save→Analyze | Save 201, appears in list | [ ] Not started |
| T24 | Content list page | History | T12 | `frontend/src/pages/ContentList.tsx` | Search, filter, pagination, status badges | Filters work; pagination 10/page | [ ] Not started |
| T25 | Content detail page | Core workflow | T13,T17,T19,T20 | `frontend/src/pages/ContentDetail.tsx` | Original panel, Analysis/Transform tabs, output cards grid | Full CREATE→ANALYZE→TRANSFORM flow manual test passes | [ ] Not started |
| T26 | Output cards + edit | Review/edit | T21 | `frontend/src/components/OutputCard.tsx` | Raw/Edited toggle, Edit textarea, Save/Copy/Regenerate | Edit saves, raw toggle works | [ ] Not started |
| T27 | Dashboard | Entry point | T12 | `frontend/src/pages/Dashboard.tsx` | Stats, recent, New CTA | Renders with data; empty state | [ ] Not started |

## PHASE 10 — Error/Loading States

| ID | Name | Objective | Prerequisites | Files | Requirements | Acceptance | Status |
|----|------|-----------|---------------|-------|--------------|------------|--------|
| T28 | States & toasts | Polish | T22-T27 | `components/*` | Skeletons, empty, error, success toasts for every fetch | Every page has all 4 states | [ ] Not started |

## PHASE 11 — Testing

| ID | Name | Objective | Prerequisites | Files | Requirements | Acceptance | Status |
|----|------|-----------|---------------|-------|--------------|------------|--------|
| T29 | Backend unit + API tests | Confidence | T17,T19,T21 | `backend/tests/*.test.ts` | Vitest+Supertest: auth, ownership, CRUD, AI mock | Coverage ≥70% services; 403 tested | [ ] Not started |
| T30 | Frontend tests | Smoke | T26 | `frontend/tests/*.test.tsx` | React Testing Library: auth guards, create, edit | Key flows pass CI | [ ] Not started |

## PHASE 12 — Security

| ID | Name | Objective | Prerequisites | Files | Requirements | Acceptance | Status |
|----|------|-----------|---------------|-------|--------------|------------|--------|
| T31 | Hardening | OWASP | T29 | `middleware/*` | Helmet, CORS, rate limit, sanitization, JWT secret length check | No secrets in logs; rate limit 429 test | [ ] Not started |

## PHASE 13 — UI Polish

| ID | Name | Objective | Prerequisites | Files | Requirements | Acceptance | Status |
|----|------|-----------|---------------|-------|--------------|------------|--------|
| T32 | Design system audit | SaaS quality | T28 | `frontend/src/components/ui/*` | Verify DESIGN.md tokens, responsive 360/1440, a11y | Lighthouse a11y ≥90; no horizontal scroll | [ ] Not started |

## PHASE 14 — Deployment

| ID | Name | Objective | Prerequisites | Files | Requirements | Acceptance | Status |
|----|------|-----------|---------------|-------|--------------|------------|--------|
| T33 | Deploy FE/BE/DB | Demo ready | T31,T32 | `Dockerfile`, `render.yaml`, `vercel.json` | Vercel FE, Render BE, Neon DB, env vars, migrate deploy | Live URL + health 200 | [ ] Not started |

## PHASE 15 — Hackathon Demo Prep

| ID | Name | Objective | Prerequisites | Files | Requirements | Acceptance | Status |
|----|------|-----------|---------------|-------|--------------|------------|--------|
| T34 | README polish & demo script | Submission | T33 | `README.md`, `docs/MEMORY.md` | Screenshots, demo URL, feature list, 60s script | README placeholders replaced; script rehearsed | [ ] Not started |

---

## Summary

- **Total tasks:** 35 (T00–T34)
- **Estimated effort:** 3–5 days for 2 devs (or 5–7 for solo)
- **Critical path:** T01 → T04 → T06 → T09 → T11 → T15 → T17 → T19 → T21 → T25 → T33
- **Demo minimal:** T01-T13 + T15-T17 + T20-T26 can produce a submittable demo even if polish tasks slip.

## Dependency Graph (key)

```
T00
 └─T01─T02─T03
     └─T04─T05
        └─T06─T07─T08
             └─T09─T10
                 └─T11─T12
                     └─T13─T14
                     └─T15─T16─T17─T18─T19
                                 └─T20─T21
                                     └─T22..T27─T28─T29..T32─T33─T34
```

## How to use this file

1. Pick next `[ ]` task in phase order.
2. Mark `[~]` when starting.
3. Implement per "Requirements" + acceptance.
4. Test, then mark `[x]` or `[!]` with blocker note.
5. Update `MEMORY.md` if architecture changed.

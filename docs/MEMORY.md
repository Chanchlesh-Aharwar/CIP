# MEMORY — Content Intelligence Platform

**Version:** 1.0.0  
**Date:** 2026-09-22  
**Purpose:** Persistent project memory — update whenever a significant decision changes. This is the living source after PRD/Architecture are frozen.

---

## 1. Project Overview

- **Name:** Content Intelligence Platform (CIP)
- **One-liner:** Paste textual content → AI analyzes & transforms → review/edit/save structured outputs, source always preserved.
- **Status:** Documentation phase complete (T00). No app code yet.
- **Repo root:** `D:\Project\MCA Hackathon`
- **Docs:** `docs/PRD.md`, `ARCHITECTURE.md`, `DATABASE.md`, `AI_ARCHITECTURE.md`, `API_SPEC.md`, `DESIGN.md`, `RULES.md`, `TASKS.md`, `AGENTS.md`

## 2. Current Tech Stack — CONFIRMED MODULE 01

| Layer | Choice | Reason |
|-------|--------|--------|
| Frontend | React 18 + Vite 5 + JavaScript + React Router 6 + Axios | Per MODULE 01 prompt — JS (not TS), Vite fast HMR |
| Backend | Python + FastAPI + Uvicorn + SQLAlchemy + Pydantic + PyMySQL | Per MODULE 01 prompt — Python/FastAPI, MySQL driver |
| DB | MySQL (user-confirmed) via SQLAlchemy | Relational ownership; host/port via env |
| Auth | JWT (deferred to later module) | MODULE 01 — no auth yet |
| AI | Deferred to later module (env AI_API_KEY/AI_MODEL reserved) | MODULE 01 — foundation only |
| Deploy | Local: FE 5173, BE 8000 | CORS configured for http://localhost:5173 |
| Test | Manual health/docs checks (automated tests in later modules) | MODULE 01 scope |

**Confirmed 2026-09-22 MODULE 01:** React+Vite+JS / FastAPI+MySQL/SQLAlchemy. Original Node/Prisma/Postgres docs remain reference but MODULE 01 prompt takes priority per Step 1 rule. Future modules will add Auth/AI/Content CRUD on this stack.

## 3. Architecture Decisions

- **ADR-001:** Synchronous AI for MVP (no queue). Later can add BullMQ if async needed.
- **ADR-002:** One `GeneratedOutput` table with enum `OutputType` (8 values) + `rawAiContent`/`editedContent` separation. Not separate tables per type.
- **ADR-003:** Tags reusable per user via `Tag` + `ContentTag` join; keywords inside `GeneratedOutput` JSON, not separate table.
- **ADR-004:** Soft delete via `deletedAt`.
- **ADR-005:** Provider abstraction `getAIProvider()` — never import OpenAI in controllers.
- **ADR-006:** Title auto-generated from first 60 chars if empty.

## 4. Database Decisions

- **Entities:** `User`, `Content`, `Tag`, `ContentTag`, `GeneratedOutput` (see `DATABASE.md` Prisma schema).
- **Key constraints:** `@@unique([userId, name])` for tags (app lowercases), `@@unique([contentId, outputType])` for outputs, FK cascade.
- **Indexes:** `(userId, createdAt)`, `(userId, status)`, `(contentId)` for outputs.
- **No separate Keyword/Topic tables** for MVP — inside outputs JSON; promote if search needs arise.

## 5. AI Decisions

- **Provider:** OpenAI `gpt-4o-mini` default; `AI_PROVIDER=mock` for offline demo.
- **Prompts:** `lib/ai/prompts.ts` — analysis + transform, hallucination guard, truncate 15k.
- **Validation:** Zod `AnalysisSchema` / `TransformSchema`, 1 retry with repair prompt.
- **Storage:** Upsert per `(contentId, outputType)`; log `model`, `latencyMs`, tokens.
- **Output caps:** Summary 40-80w, keyPoints 3-7×<25w, keywords 5-12, topics 1-5, suggestedTags 3-8, FAQ 3-7, social ≤280 chars, exec 120-180w.

## 6. API Decisions

- **Base:** `/api` (alias `/api/v1`)
- **Auth:** `POST /auth/register, /login, /refresh, /logout, /me`
- **Content:** `POST/GET /content`, `GET/PUT/DELETE /content/:id`
- **AI:** `POST /content/:id/analyze`, `POST /content/:id/transform`
- **Outputs:** `GET /content/:id/outputs`, `GET/PUT/DELETE /outputs/:id`
- **Tags:** `GET /tags`, `PUT/DELETE /tags/:id`
- **Health:** `GET /health`
- **Error envelope:** `{error, code, details}`; AI errors 502.

## 7. UI Decisions

- **Flow:** `CREATE → ANALYZE → REVIEW → TRANSFORM → EDIT → SAVE` stepper always visible.
- **Source panel:** Border-l-indigo, distinct from AI cards with "AI Generated" badge.
- **States:** Every fetch has loading skeleton / empty illustration / error banner / success toast.
- **Responsive:** Mobile cards → Desktop table; 360–1440px.

## 8. Important Constraints (never violate)

1. Original `contents.original_content` never overwritten by AI.
2. Every output editable; `rawAiContent` preserved.
3. User ownership enforced per request (403 on cross-user).
4. History accessible (list + detail + outputs).
5. Source-output traceability via FK.
6. Out-of-scope: video, auto-publishing, scheduling, enterprise CMS, large storage.

## 9. Completed Features

- [x] Full documentation phase (PRD, ARCH, DB, AI, API, DESIGN, RULES, TASKS, MEMORY, AGENTS, README, .env.example, .gitignore) — 2026-09-22
- [x] MODULE 01 Project Foundation — React+Vite+JS FE (Router+Axios), FastAPI BE (CORS+health+error handling), SQLAlchemy+MySQL foundation, env examples — 2026-09-22

## 10. Current Status

- **Phase:** MODULE 09 Completed — Final Review + Deployment Prep (All 01-09 Done)
- **Next module:** None — ready for submission; optional polish (tests/deploy) if time
- **Blockers:** None
- **Ports:** FE 5173 → BE 8000 via VITE_API_BASE_URL, MySQL InnoDB 5 tables, health ok, docs 961, FE 239k
- **Structure:** `frontend/src/{components, pages(7), context}` + `backend/app/{api/routes(6), ai, models(5), schemas, core} + init_db.py + alembic` + `database/README.md + docs/* + README.md`
- **Final verified:** Health/docs/DB tables/FE build, README polished to FastAPI+MySQL actual stack with 60s demo script, .env.example MySQL, .gitignore python cache — 2026-09-22

## 11. Known Issues & Limitations

- Keywords not separately queryable (inside JSON). Mitigated by design; promote to table if needed post-MVP.
- No output versioning (only raw vs edited). Full history deferred to NICE-TO-HAVE.
- AI synchronous — long content may hit 25s timeout; user sees retry.
- No file/URL import — paste only for MVP.

## 12. Open Decisions (require user input)

| ID | Question | Default assumption until answered |
|----|----------|----------------------------------|
| Q1 | Sharing/collaboration? | No sharing; owner-only (A1) |
| Q2 | AI provider/model + budget? | OpenAI gpt-4o-mini, mock fallback (A9) |
| Q3 | Rich-text markdown? | Plain text (Q3 pending) |
| Q4 | Guest mode? | No; auth required |
| Q5 | URL/file import? | No; paste only |
| Q6 | Deletion retention? | Soft delete (A8) |

Update this table when any Q is answered.

## 13. Environment Variables — MODULE 01

Frontend `frontend/.env.example`:
```
VITE_API_BASE_URL=http://localhost:8000/api
```
Backend `backend/.env.example`:
```
APP_NAME, ENVIRONMENT, HOST, PORT, MYSQL_HOST, MYSQL_PORT, MYSQL_DATABASE, MYSQL_USER, MYSQL_PASSWORD, JWT_SECRET, AI_API_KEY, AI_MODEL
```
Core centralized in `backend/app/core/config.py` (Pydantic Settings) + `backend/app/core/database.py` (engine/SessionLocal/Base). CORS origins from `settings.cors_origins`.

## 13b. Implementation Decisions (MODULE 01)

- Axios instance `frontend/src/services/api.js` uses `VITE_API_BASE_URL`.
- Layout `frontend/src/layouts/AppLayout.jsx` with navbar + sidebar placeholder + Outlet.
- Placeholder routes `/login /register /dashboard /content /content/new` per spec.
- FastAPI `app/main.py` with CORSMiddleware (origins from settings), exception handlers in `app/middleware/error_handler.py` for validation/http/general.
- Health `GET /api/health → {"status":"ok"}` via `app/api/routes/health.py`.
- DB `app/core/database.py` pool_pre_ping; graceful failure if MySQL down.

## 14. Deployment Details

- **Frontend:** Vercel (`VITE_API_URL` → backend URL)
- **Backend:** Render/Railway (`DATABASE_URL`, `JWT_*`, `AI_*`)
- **DB:** Neon/Supabase Postgres; `prisma migrate deploy` on build
- **Health:** `GET /api/health` must pass before demo

## 15. Hackathon Submission

- **Problem file:** `Hackathon Problem Statements - MCA 2nd Year.pdf`
- **Demo script:** 60s flow paste→analyze→transform→edit→history (see PRD §8)
- **Placeholders in README:** Demo URL, screenshots, architecture diagram — replace after deploy (T34).
- **Judging criteria:** Not provided — do not invent; focus on AI value + SaaS quality + source separation + editability.

## 16. Changelog

| Date | Change | Author |
|------|--------|--------|
| 2026-09-22 | Initial memory created from docs phase | Vibe Agent |
| 2026-09-22 | MODULE 01 foundation implemented: Vite+React+JS FE, FastAPI+SQLAlchemy+MySQL BE, health/CORS/DB config, verified /api/health + /docs + FE build | Vibe Agent |
| 2026-09-22 | MODULE 02 database models: 5 SQLAlchemy models (User/Content/Tag/ContentTag/GeneratedOutput) InnoDB, enums, FK CASCADE, Alembic env + init_db.py, MySQL recreated with FK enforcement verified | Vibe Agent |
| 2026-09-22 | MODULE 03 authentication: JWT access+refresh (HS256), passlib bcrypt, register/login/me/refresh/logout routes, get_current_user dependency, verified 201/409/401/200 | Vibe Agent |
| 2026-09-22 | MODULE 04 content CRUD: POST/GET/PUT/DELETE /api/content + /tags, tag upsert lower+dedupe, auto-title, search/tag filter/pagination, 403 isolation, 401/422 validation, soft delete | Vibe Agent |
| 2026-09-22 | MODULE 05 AI analysis: provider abstraction mock/openai, 5 outputs SUMMARY etc, status handling, outputs CRUD (raw vs edited), verified 5 outputs + edit + upsert + 403/404 | Vibe Agent |
| 2026-09-22 | MODULE 06 transformation: 3 outputs FAQ/SOCIAL/EXEC selective, mock 3 FAQ/social 109/exec 123w, endpoint validated 400/422/403, total 8 outputs with analysis | Vibe Agent |
| 2026-09-22 | MODULE 07 frontend integration: AuthContext + ProtectedRoute, Login/Register/Dashboard/Create/List/Detail wired to real API, analyze/transform/edit outputs, build 232k OK | Vibe Agent |
| 2026-09-22 | MODULE 08 polish: Toast/Skeleton/Empty/Error/Modal/404, list/detail/dashboard/create/login polish, copy+delete confirm, build 239k OK | Vibe Agent |
| 2026-09-22 | MODULE 09 final review: health/docs/DB/FE build verified, README+env polished, demo script ready, ready for submission | Vibe Agent |

# RULES — Vibe Coding Discipline

**Version:** 1.0.0  
**Date:** 2026-09-22  
**Purpose:** Strict rules for AI coding agents (and humans) to prevent drift, overwrite bugs, and demo failures.

---

## 1. General

- **G1** Follow `PRD.md` as source of truth. If code contradicts PRD, PRD wins; update code, not PRD silently.
- **G2** Follow `ARCHITECTURE.md`, `DATABASE.md`, `AI_ARCHITECTURE.md`, `DESIGN.md` for implementation choices.
- **G3** Do not modify unrelated code. One task = one concern.
- **G4** Do not introduce dependencies without justification in `MEMORY.md`. Prefer built-ins.
- **G5** Prefer reusable components (`components/ui/*`, `services/*`, `lib/*`).
- **G6** Keep functions small (<40 lines), modules focused (single responsibility).
- **G7** TypeScript strict: no `any`, Zod for runtime validation at boundaries.
- **G8** No large-scale storage: content body capped 20k chars; no video/S3.

## 2. Data & Ownership

- **D1 NEVER overwrite original content with AI output.** Violation = blocker. `contents.original_content` is written only by `POST/PUT /api/content`. AI writes only to `generated_outputs.raw_ai_content`. Enforce via code review + DB separation.
- **D2 Validate all input** with Zod (FE + BE). Return 400 with details on fail.
- **D3 Use proper DB constraints** (FK, unique, indexes) from `DATABASE.md`. No raw SQL string concat.
- **D4 Protect user-owned content.** Every content/output read/write checks `userId === req.user.id` else 403. No query without ownership filter.
- **D5 Soft delete only** for MVP; hard delete gated.
- **D6 Preserve `rawAiContent`:** `PUT /api/outputs/:id` may only set `editedContent`. Never mutate `rawAiContent` via edit endpoint. Regeneration via analyze/transform upserts `rawAiContent`.
- **D7 `generated_outputs` uniqueness:** One row per `(contentId, outputType)`. Regeneration is upsert, not append duplicate.

## 3. AI

- **A1 Never expose `AI_API_KEY`** to frontend, logs, or repo. Only via `process.env.AI_API_KEY`.
- **A2 Never trust raw model output.** Parse JSON via `try/catch`, validate with Zod, sanitize, then persist.
- **A3 Handle malformed AI responses** with 1 retry + repair prompt; second failure → 502 with `retryable:true`.
- **A4 Handle AI failures gracefully:** Set `content.status=failed`, do not persist partial, show retry in UI.
- **A5 Keep AI isolated:** `lib/ai/*` is the only place importing the provider SDK. Controllers/services call `getAIProvider()`, never OpenAI directly.
- **A6 Allow every output to be edited.** No immutable AI card. Edit UI + `PUT /outputs/:id` must exist.
- **A7 Track provenance:** Store `model`, `latencyMs`, tokens per output.
- **A8 Truncate input** to 15k chars before prompt; log truncation.
- **A9 Mock provider** must exist for offline/demo without key.

## 4. Security

- **S1 Never hardcode credentials.** Use `process.env.*` + `.env.example`.
- **S2 Never commit `.env`.** `.gitignore` must block it.
- **S3 Hash passwords** with bcrypt (10 rounds); never store plain.
- **S4 JWT:** Access 15m, Refresh 7d, secret min 32 chars; httpOnly cookie preferred.
- **S5 Validate & sanitize:** Trim, strip HTML, limit lengths; Prisma parameterized queries.
- **S6 Enforce authorization:** `auth` middleware on all `/api/content/*` and `/api/outputs/*`.
- **S7 CORS:** Allow only frontend origin; Helmet headers; rate limit 60/min + 10 AI/min.
- **S8 Logs redact secrets.**

## 5. Frontend / Design

- **F1 Follow `DESIGN.md` tokens:** colors, spacing, radius, typography. No ad-hoc hex.
- **F2 Source/output separation:** Visually distinct panels; AI badge on every generated card.
- **F3 Loading/empty/error/success states** for every data fetch (TanStack Query).
- **F4 Responsive:** Test 360px + 1440px; no horizontal scroll.
- **F5 Accessibility:** ARIA for AI loading, focus rings, contrast ≥4.5:1, keyboard nav.

## 6. Documentation & Memory

- **M1 Update `MEMORY.md`** when any architectural decision changes (stack, schema, prompt, endpoint).
- **M2 Update `TASKS.md`** status after completing/blocking a task.
- **M3 Do not silently invent requirements.** If spec ambiguous, add to `PRD.md` Open Questions and use assumptions [A1]–[A12] until confirmed.

## 7. Vibe Coding Workflow

### Before implementing ANY task:
1. Read `docs/PRD.md`
2. Read `docs/ARCHITECTURE.md`
3. Read `docs/DATABASE.md`
4. Read `docs/AI_ARCHITECTURE.md` if AI-related
5. Read `docs/DESIGN.md` if UI-related
6. Read `docs/RULES.md` (this file)
7. Read `docs/TASKS.md` — pick ONE task in order
8. Check `docs/MEMORY.md` — current stack/decisions

### During coding:
- Work on ONE task at a time.
- Do not implement future tasks.
- Do not change architecture without documenting reason in `MEMORY.md`.
- Do not overwrite original content.
- Keep AI outputs separate.
- Test changes locally before marking complete.

### After completing a task:
1. Run tests (`npm test` / `npm run test:api`).
2. Verify acceptance criteria from `TASKS.md`.
3. Update `TASKS.md` status (`[x]` completed, `[~]` in progress, `[!]` blocked).
4. Update `MEMORY.md` if decision changed.
5. Do not jump to unrelated tasks.

---

## 8. Prohibited

- Video processing, auto social publishing, scheduling, enterprise CMS, large document storage — **OUT OF SCOPE, do not build**.
- Enterprise complexity (RBAC beyond owner, workflows, billing) for MVP.
- Fake URLs, metrics, testimonials in README.

## 9. Enforcement

- PR review checklist must include D1, D4, A2, S6.
- CI must run `tsc --noEmit`, `eslint`, `vitest`.
- Any violation of D1 is a blocking bug, fix immediately.


# AGENTS — Instructions for AI Coding Agents

**For:** Any AI/human agent implementing tasks via Vibe Coding  
**Read before writing a single line of code.**

---

## 1. Before Coding (mandatory)

Read in order:

1. `docs/PRD.md` — what to build, assumptions [A1]–[A12], open questions
2. `docs/ARCHITECTURE.md` — stack, diagrams, data flow
3. `docs/DATABASE.md` — Prisma schema, constraints, indexes
4. `docs/AI_ARCHITECTURE.md` — if task touches AI (prompts, validation, provider)
5. `docs/DESIGN.md` — if task touches UI (tokens, screens, states)
6. `docs/RULES.md` — never violate D1, A2, S6 etc.
7. `docs/TASKS.md` — pick ONE task in order, check prerequisites & acceptance
8. `docs/MEMORY.md` — current stack/decisions, open questions, changelog

Do not skip. If any doc conflicts with your intuition, doc wins.

---

## 2. During Coding

- **One task at a time.** Mark `[~]` In Progress in `TASKS.md` before starting.
- **Do not implement future tasks.** No bonus features.
- **Do not change architecture** without documenting reason in `MEMORY.md`.
- **Do not invent requirements.** Use assumptions [A1]–[A12]; log open questions.
- **Never overwrite original content.** `contents.original_content` only via content CRUD; AI writes only to `generated_outputs.raw_ai_content`.
- **Keep AI outputs separate.** Every output must be `rawAiContent` + optional `editedContent`; PUT outputs only touches `editedContent`.
- **Validate at boundaries.** Zod on every request body + AI JSON.
- **Protect ownership.** Every content/output query filters by `req.user.id`; add `ownership` middleware.
- **Isolate AI.** Only `lib/ai/*` imports provider SDK; services call `getAIProvider()`.
- **Small focused commits.** Keep functions <40 lines, modules single-responsibility, reusable components.

---

## 3. After Coding

1. **Run checks:**
   ```bash
   npm run lint
   npm run typecheck   # tsc --noEmit
   npm test            # vitest
   ```
2. **Check errors:** No TS errors, no lint errors, no console `error` on happy path.
3. **Verify acceptance criteria** from `TASKS.md` for that task (e.g., "User B gets 403 on User A content").
4. **Update `TASKS.md`:** `[x]` Completed or `[!]` Blocked with reason.
5. **Update `MEMORY.md`** if any ADR, schema, prompt, or endpoint changed.
6. **Do not silently move** to next task — verify first.

---

## 4. File Map (where to code)

| Area | Path |
|------|------|
| Backend entry | `backend/src/server.ts` |
| Routes | `backend/src/routes/*.ts` |
| Services | `backend/src/services/*.ts` |
| Middleware | `backend/src/middleware/*.ts` |
| AI | `backend/src/lib/ai/{provider.ts,prompts.ts,validator.ts,mock.ts}` |
| Prisma | `backend/prisma/schema.prisma`, `seed.ts` |
| Validation | `backend/src/lib/validation.ts` (shared Zod) |
| Frontend pages | `frontend/src/pages/*.tsx` |
| Components | `frontend/src/components/{ui,OutputCard,TagInput,...}.tsx` |
| Stores | `frontend/src/stores/*.ts` |
| API client | `frontend/src/services/api.ts` |

---

## 5. Prohibited

- Hardcoding secrets, committing `.env`, exposing `AI_API_KEY` to frontend.
- Building video, auto-publishing, scheduling, enterprise CMS, large file storage.
- Adding RBAC beyond owner, billing, or other enterprise complexity for MVP.
- Skipping `ownership` checks or writing AI into `contents` table.

---

## 6. Getting Unblocked

- If blocked by missing decision (Q1–Q6), use default assumption from `PRD.md`/`MEMORY.md` and flag in `TASKS.md` as `[!]` with note.
- If doc inconsistency found, file it in `MEMORY.md` Known Issues and notify human; do not silently fix.
- Prefer asking (via TODO comment) over guessing for product-ambiguous cases.

---

## 7. Success Criteria for an Agent Session

- Exactly one task moved to `[x]` with tests passing.
- No unrelated files touched.
- `MEMORY.md` reflects reality if anything changed.


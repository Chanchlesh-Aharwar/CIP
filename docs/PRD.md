# PRD — Content Intelligence Platform

**Version:** 1.0.0 — Documentation Phase  
**Date:** 2026-09-22  
**Status:** Draft — Single Source of Truth for Vibe Coding  
**Author:** Senior Architect / Product / AI / Design — Vibe Coding Agent

---

## 1. Product Overview

### 1.1 Product Name
**Content Intelligence Platform (CIP)**

### 1.2 One-line Description
AI-assisted SaaS that ingests raw textual content and transforms it into structured, reusable intelligence — summaries, key points, keywords, topics, tags, FAQs, social posts, and executive summaries — with full human review and edit control.

### 1.3 Problem Statement
Organizations continuously produce articles, reports, announcements, and internal documents. The same source text must be repurposed for different audiences and channels (executives, marketing, support, social). Teams currently do this manually — slow, inconsistent, and error-prone. There is no single lightweight tool that combines capture, AI analysis, transformation, review, and reuse while preserving source truth.

### 1.4 Business Scenario
- A communications team publishes a 2,000-word report and needs: a 3-sentence summary for newsletter, 5 key points for slides, keywords for SEO, topics for categorization, an FAQ for the help site, a 280-char social post, and a 150-word executive summary — all from the same source.
- An operations manager pastes meeting notes and needs structured extraction before sharing.
- A student/researcher submits an article and wants reusable outputs for study and presentation.

### 1.5 Objective
Build an AI-assisted content intelligence application that processes textual content and produces useful structured outputs that remain editable, traceable, and historically accessible.

### 1.6 Target Users
1. **Content Marketer** — repurposes one article into many formats
2. **Operations / Communications Lead** — summarizes announcements for leadership
3. **Researcher / Analyst** — extracts structure from long documents
4. **Founder / Solo Creator** — needs fast AI help without enterprise CMS

### 1.7 User Personas

| Persona | Goals | Frustrations |
|---------|-------|--------------|
| **Maya — Content Marketer (28)** | Turn one blog post into FAQ + social + exec summary in <5 min | Copy-pasting between tools; inconsistent AI outputs she cannot edit |
| **Raj — Ops Lead (35)** | Summarize long reports for leadership; keep source untouched | AI tools that overwrite originals; no history |
| **Dr. Aisha — Researcher (31)** | Extract keywords/topics/tags from papers for cataloging | Manual tagging; no traceability to source |

### 1.8 User Pain Points
- No single place to submit → analyze → review → transform → edit → save.
- AI outputs are often immutable or disconnected from source.
- No ownership/isolation — risk of mixing other users' content.
- No history — cannot revisit previous work.
- Enterprise CMS is overkill; basic CRUD demos lack AI credibility.

### 1.9 Proposed Solution
A modern SaaS web app with: content CRUD + AI analysis (summary, key points, keywords, topics, suggested tags) + selective transformation (FAQ, social post, executive summary) + full review/edit/save of every generated output + strict source/output separation + user ownership + history.

### 1.10 Value Proposition
- **Speed:** Paste → Analyze → Review in under 30 seconds (excluding AI latency).
- **Reuse:** One source → 7+ structured outputs for different channels.
- **Trust:** AI is an assistant, never the source of truth; every output is editable and traceable.
- **Simplicity:** SaaS-light, responsive, no enterprise bloat.

---

## 2. Requirement Analysis (PHASE 1)

### 2.1 Confirmed Requirements (explicit in prompt)
- C1: User can enter/paste textual content and save it.
- C2: View previously submitted content (list/history).
- C3: Edit original content.
- C4: Generate short summary, extract keywords, identify topics/categories.
- C5: Add tags, edit tags.
- C6: Review AI-generated information before finalization.
- C7: Transform same source into FAQ, short social-media post, executive summary.
- C8: Edit generated outputs; save edited outputs.
- C9: Access previously generated outputs.
- C10: Original content must remain separate from AI-generated content (never overwritten).
- C11: Every content item belongs to a user; user can only access own content.
- C12: Every generated output traceable to source content.
- C13: At least entities: User, Content, Generated Output, Tags, Keywords.
- C14: Out-of-scope: video, auto social publishing, scheduling, enterprise CMS, large-scale storage must NOT be built.
- C15: MVP screens: Creation, List/History, Details, AI Processing, Generated Output, Edit/Save Output.

### 2.2 Reasonable Assumptions (labeled [A1]… — implemented for MVP)

| ID | Assumption | Rationale |
|----|------------|-----------|
| A1 | Authentication is mandatory (email/password JWT). | Business rule "user ownership" cannot be enforced without auth; single anonymous user violates the rule. |
| A2 | AI processing is **synchronous** for MVP (request → AI → response within ~10-25s) with clear loading state; async queue is NICE-TO-HAVE. | Simpler for hackathon; avoids worker infra. Timeout/loading handled gracefully. |
| A3 | Title is optional but recommended; if missing, backend auto-generates from first 60 chars. | Improves list/history readability. |
| A4 | Content body: 50–20,000 chars; enforced via validation. | Prevents empty submissions and token-limit blowups. |
| A5 | Tags are **reusable** per user (global Tag table + ContentTag join); keywords are **per-content analysis artifacts** stored inside Generated Output JSON and optionally normalized. | Reuse improves filtering; keywords are extraction results, not user-managed tags. |
| A6 | Generated outputs have **no version history** in MVP; latest edit overwrites `edited_content`, but `raw_ai_content` is preserved for audit. Edit overwrites only generated layer, never original. | Keeps DB simple; audit via `raw` vs `edited` columns. Full versioning is NICE-TO-HAVE. |
| A7 | User can **selectively** generate outputs (Analyze vs Transform) and can **regenerate** individual output types (upsert by (content_id, output_type)). Regeneration preserves `raw` update but keeps previous `edited` until user confirms overwrite. | Prevents wasteful full re-generation; explicit regenerate action. |
| A8 | Deleting content is **soft delete** (status=deleted) and cascades to outputs logically; hard delete not exposed in MVP UI but API supports it with confirmation. | Accidental delete recovery for demo. |
| A9 | AI provider is **OpenAI-compatible** (OpenAI `gpt-4o-mini` default), abstracted behind `AIProvider` interface. Mock provider for local dev without key. | Fastest hackathon integration; swap-able. |
| A10 | Processing status stored on Content (`draft | processing | completed | failed`). | Enables list UI status badges. |
| A11 | Search/filter in content list is by title, tag, topic, date. | Improves historical access. |
| A12 | Generated Output types are enum: `SUMMARY, KEY_POINTS, KEYWORDS, TOPICS, SUGGESTED_TAGS, FAQ, SOCIAL_POST, EXECUTIVE_SUMMARY`. | Covers Analysis + Transformation in one table. |

### 2.3 Open Questions (require user confirmation — TODO)

| ID | Question | Why it blocks/impacts |
|----|----------|-----------------------|
| Q1 | Single organization or multi-tenant? Sharing/collaboration required? | Determines RBAC/sharing model. |
| Q2 | Expected AI provider/model constraint (OpenAI vs Gemini vs local)? Budget/token limits? | Affects prompt design, cost, latency. |
| Q3 | Must support rich-text (markdown) paste or plain text only? | Affects editor choice. |
| Q4 | Should guest/demo mode exist without signup? | Affects onboarding friction for judges. |
| Q5 | Content import via URL/file upload in scope for demo? | Currently plain paste only. |
| Q6 | Required retention/compliance for content deletion? | Affects soft vs hard delete decision. |

### 2.4 Potential Ambiguities & Resolutions

| Ambiguity | Resolution for MVP (assumption) | If opposite chosen |
|-----------|--------------------------------|--------------------|
| Auth mandatory? | Yes (A1) | Would need anonymous session store |
| One user enough? | No — multi-user with isolation | Single user demo cannot prove ownership rule |
| Sync vs async AI? | Sync with loading (A2) | Async needs queue (BullMQ) |
| Regenerate individual outputs? | Yes (A7) | Full-only regenerate wastes tokens |
| Delete content? | Soft delete (A8) | No delete complicates test data cleanup |
| Tags reusable? | Yes per user (A5) | Per-content tags duplicate data |
| Versions? | No, raw vs edited only (A6) | Needs version table |
| Provider? | OpenAI abstraction (A9) | Locks to one vendor |

---

## 3. Features

### 3.1 MUST HAVE (MVP — gating for submission)
- F01 Content creation (paste + title + tags + save)
- F02 Content saving (persist with user ownership)
- F03 Content history/list with status, search/filter, pagination
- F04 Content editing (original preserved separately)
- F05 AI analysis: short summary (2-3 sentences)
- F06 AI analysis: key points (3-7 bullets)
- F07 AI analysis: keyword extraction (5-12 keywords)
- F08 AI analysis: topics/categories + suggested tags
- F09 User tags: add, edit, remove, reusable
- F10 AI output review screen (before finalize)
- F11 Transformations: FAQ (3-7 Q&A), Social post (≤280 chars), Executive summary (120-180 words)
- F12 Editable AI output (edit any generated output)
- F13 Save generated output (persist edited version, traceable to source)
- F14 Access previously generated outputs (history per content)
- F15 Strict source/output separation + traceability
- F16 User ownership + auth isolation

### 3.2 SHOULD HAVE (improve MVP without major complexity)
- S01 Confidence/status per output + retry failed generation
- S02 Copy-to-clipboard per output card
- S03 Character/word count + validation hints in editor
- S04 Tag filtering in content list
- S05 Dashboard stats (total contents, outputs, recent)
- S06 Toast + empty/error/loading states for every screen
- S07 Auto-title generation if title empty

### 3.3 NICE TO HAVE (explicitly out of MVP, not built now)
- N01 Version history for generated outputs
- N02 Async queue + webhooks + background jobs
- N03 Export to PDF/Markdown
- N04 Team sharing / collaboration
- N05 Analytics on AI usage/cost
- N06 File upload / URL fetch
- N07 Full-text search with embeddings

---

## 4. User Stories

| ID | Story | Acceptance Link |
|----|-------|-----------------|
| US01 | As a user, I want to paste content so that I can analyze it using AI. | F01 |
| US02 | As a user, I want to save content so that I can return to it later. | F02, F14 |
| US03 | As a user, I want to view previously submitted content so that I can continue working. | F03 |
| US04 | As a user, I want to edit my original content so that I can correct it without losing AI outputs' separation. | F04 |
| US05 | As a user, I want to generate a summary so that I can quickly understand long content. | F05 |
| US06 | As a user, I want to extract key points so that I can share highlights. | F06 |
| US07 | As a user, I want to extract keywords so that I can tag/SEO the content. | F07 |
| US08 | As a user, I want to identify topics/categories so that I can organize content. | F08 |
| US09 | As a user, I want to add/edit tags so that I can organize and filter content. | F09 |
| US10 | As a user, I want to review AI-generated info before finalizing so that I can trust it. | F10 |
| US11 | As a user, I want to transform content into FAQ so that I can reuse it for support. | F11 |
| US12 | As a user, I want to transform content into a social post so that I can share on social channels (manual). | F11 |
| US13 | As a user, I want to transform content into executive summary so that I can brief leadership. | F11 |
| US14 | As a user, I want to edit AI-generated output so that I can correct or customize it. | F12 |
| US15 | As a user, I want to save generated output so that it stays linked to its source. | F13 |
| US16 | As a user, I want to access previously generated outputs so that I can revisit work. | F14 |
| US17 | As a visitor, I want to sign up/log in so that my content is private to me. | F16 |

---

## 5. Acceptance Criteria (measurable)

| Feature | Criterion |
|---------|-----------|
| F01 Creation | User can paste ≥50 chars, optionally title/tags, click Save → 201, content appears in list within 1s. |
| F02 Saving | Content persists after refresh; belongs to logged-in user; unauthenticated request → 401. |
| F03 History | List shows title, created_at, status, tag count; pagination 10/page; search title/tag returns in <500ms for 1k rows. |
| F04 Edit original | PUT /api/content/:id updates `original_content` only; associated outputs unchanged; audit via `updated_at`. |
| F05 Summary | POST /api/content/:id/analyze returns summary 40-80 words; displayed in card; editable. |
| F06 Key Points | Returns 3-7 bullets; each <25 words. |
| F07 Keywords | Returns 5-12 keywords; lowercase normalized; deduplicated. |
| F08 Topics/Tags | Returns 1-5 topics and 3-8 suggested tags. |
| F09 Tags | User can add/remove/edit tags; tags reusable across contents; uniqueness per user (name lowercased). |
| F10 Review | AI output shown in review modal/card with raw content; user must explicitly Save to finalize. |
| F11 Transformations | FAQ 3-7 Q&A, Social ≤280 chars, Exec summary 120-180 words; each selectable individually. |
| F12 Editable output | User can edit any output type; PUT /api/outputs/:id saves `edited_content`; `raw_ai_content` never overwritten by edit. |
| F13 Save output | Save → 200, persisted, traceable via `content_id` FK; re-fetch shows edited version. |
| F14 Historical access | GET /api/content/:id/outputs returns all outputs for that content, even after 7 days. |
| F15 Separation | No API writes AI content into `contents.original_content` column (enforced by code + DB constraint). |
| F16 Ownership | User A cannot GET/PUT/DELETE User B's content or outputs (403). |

---

## 6. Non-Functional Requirements

| Category | Requirement |
|----------|-------------|
| **Performance** | p95 API <400ms (non-AI); AI generation p95 <25s; frontend LCP <2.5s; supports 1k contents/user. |
| **Security** | JWT (httpOnly cookie or Bearer), bcrypt 10 rounds, input validation (Zod), rate limit 60 req/min/IP, no secrets in repo, OWASP top-10 mitigations. |
| **Reliability** | 99% uptime target for demo; AI failures return structured error with retry; DB transactions for content+tags; healthcheck endpoint. |
| **Accessibility** | WCAG 2.1 AA: keyboard navigable, focus rings, ARIA for AI loading, color contrast ≥4.5:1, semantic HTML. |
| **Responsiveness** | Mobile 360px → Desktop 1440px; Tailwind breakpoints; no horizontal scroll; touch targets ≥44px. |
| **Maintainability** | TypeScript strict, ESLint+Prettier, 70%+ unit coverage for services, layered architecture, provider abstraction. |
| **Scalability** | Stateless backend (horizontal via env DATABASE_URL); pagination; token limits (20k chars) to cap AI cost; no large-file storage. |
| **Observability** | Structured logs (pino), request id, AI token usage logged. |

---

## 7. Out of Scope (must NOT be built)
- Video processing
- Automated social-media publishing
- Social-media scheduling
- Enterprise content management (workflows, approvals, RBAC beyond owner)
- Large-scale document storage / file system / S3
- Real-time collaboration / comments
- Billing / subscriptions (for hackathon)

---

## 8. Hackathon Value

### How this demonstrates AI usage
- Two distinct AI pipelines: **Analysis** and **Transformation**, each with structured JSON contracts, validation, and human-in-the-loop editing.
- Provider abstraction proves extensibility beyond one model.

### Real-world business value
- Repurposing one source into 7+ channel-specific assets saves hours per week per team; directly addresses stated business scenario.

### Content intelligence
- Extraction layer (summary, key points, keywords, topics) turns unstructured text into queryable, filterable intelligence.

### Content reuse
- Transformation layer (FAQ, social, exec summary) proves single-source → multi-audience reuse without duplication.

### Human review of AI output
- Every output is presented for review, editable, saved separately, and traceable — AI is assistant, not authority.

### Demo narrative (60 seconds)
Paste article → Save → Analyze (loading) → Review summary/keywords/topics → Edit tags → Transform FAQ/Social/Exec → Edit outputs → Save → Revisit from history — all while source remains untouched.

---

## 9. TODO / OPEN QUESTIONS (reiterated for TASKS.md)
- Q1 Sharing model?
- Q2 Provider/model + budget?
- Q3 Rich-text vs plain text?
- Q4 Guest mode?
- Q5 URL/file import?
- Q6 Deletion/retention policy?

Resolution until answered: assume **[A1]–[A12]** as documented above. No silent invention; update MEMORY.md when any Q is answered.

---

## 10. References
- Source: `Hackathon Problem Statements - MCA 2nd Year.pdf` (provided)
- Related docs: `ARCHITECTURE.md`, `DATABASE.md`, `AI_ARCHITECTURE.md`, `API_SPEC.md`, `DESIGN.md`

# AI_ARCHITECTURE — Content Intelligence Platform

**Version:** 1.0.0  
**Date:** 2026-09-22  
**Criticality:** Core — AI is the differentiator; human review is mandatory

---

## 1. Goals & Constraints

- Produce **structured JSON** for two pipelines: **Analysis** and **Transformation**.
- **Never overwrite** `original_content`; persist to `generated_outputs.raw_ai_content`.
- **Human-in-the-loop:** every output shown for review before finalize; `edited_content` separate.
- Provider-agnostic, replaceable, mockable for offline demo.
- Handle malformed JSON, hallucinations, token limits, rate limits, and failures gracefully.

---

## 2. Output Contracts

### 2.1 Analysis Output
```json
{
  "summary": "2-3 sentence summary, 40-80 words",
  "keyPoints": ["bullet 1 <25 words", "bullet 2", "... 3-7 items"],
  "keywords": ["keyword1", "keyword2", "... 5-12 items, lowercase, deduplicated"],
  "topics": ["Topic A", "Topic B", "... 1-5 items"],
  "suggestedTags": ["tag-one", "tag-two", "... 3-8 items, kebab or lower, no spaces beyond hyphen"]
}
```

### 2.2 Transformation Output
```json
{
  "faq": [
    { "question": "What is ...?", "answer": "Concise answer 1-3 sentences" }
  ],
  "socialPost": "Short social-media post, <=280 chars, engaging, includes hashtags optionally",
  "executiveSummary": "120-180 words, formal tone, suitable for leadership"
}
```
- `faq`: 3-7 items.
- Each transformation can be requested **individually** (selective generation) or all three.

### 2.3 Stored Mapping to DB
Each key maps to one `GeneratedOutput` row:

| JSON key | `outputType` | `rawAiContent` stored as |
|----------|--------------|--------------------------|
| summary | SUMMARY | plain text |
| keyPoints | KEY_POINTS | JSON stringified array |
| keywords | KEYWORDS | JSON stringified array |
| topics | TOPICS | JSON stringified array |
| suggestedTags | SUGGESTED_TAGS | JSON stringified array |
| faq | FAQ | JSON stringified array of {question, answer} |
| socialPost | SOCIAL_POST | plain text |
| executiveSummary | EXECUTIVE_SUMMARY | plain text |

---

## 3. Provider Abstraction

```ts
// backend/src/lib/ai/provider.ts
export interface AIProvider {
  name: string;
  analyze(content: string): Promise<AnalysisResult>;
  transform(content: string, types: TransformType[]): Promise<TransformResult>;
}

// Implementations
class OpenAIProvider implements AIProvider { /* uses openai SDK */ }
class MockProvider implements AIProvider { /* deterministic fake for dev/test */ }

export function getAIProvider(): AIProvider {
  if (!process.env.AI_API_KEY || process.env.AI_PROVIDER === 'mock') return new MockProvider();
  return new OpenAIProvider({ apiKey: process.env.AI_API_KEY, model: process.env.AI_MODEL });
}
```

**Swap strategy:** `AI_PROVIDER` env selects impl; no controller/service imports OpenAI directly.

---

## 4. Model Interaction

- **Provider:** OpenAI-compatible (OpenAI, Azure OpenAI, Groq, Ollama via OpenAI API shape).
- **Model default:** `gpt-4o-mini` (fast, cheap, JSON-capable) — configurable via `AI_MODEL`. Alternative: `gemini-1.5-flash` via adapter (future).
- **Mode:** `response_format: {type: "json_object"}` for OpenAI to enforce JSON; fallback prompt instructs "Return ONLY valid JSON, no markdown".
- **Timeout:** 25s per call (enforced via `AbortController`).
- **Retry:** 1 automatic retry on parse/validation failure with repair prompt: "Your previous response was invalid JSON. Fix and return ONLY valid JSON matching this schema: ...".
- **Rate limiting:** Backend simple counter 10 AI calls/min per user (in-memory for MVP, Redis future); returns 429.
- **Token limits:** Input truncated to 15,000 chars (~3.5k tokens) before prompt; if longer, prefix with `[Truncated: showing first 15k chars]`. Output max_tokens 2000.

---

## 5. Prompt Structure

### 5.1 Analysis Prompt
```
System: You are a content intelligence assistant. Return ONLY valid JSON matching the schema. No markdown, no explanation.

User:
Analyze the following content. Produce:
- summary: 2-3 sentences, 40-80 words, neutral tone
- keyPoints: 3-7 bullets, each <25 words
- keywords: 5-12 lowercase keywords, deduplicated
- topics: 1-5 broad topics/categories
- suggestedTags: 3-8 tags, lowercase kebab-case

Schema:
{
  "summary": "string",
  "keyPoints": ["string"],
  "keywords": ["string"],
  "topics": ["string"],
  "suggestedTags": ["string"]
}

Content:
"""{{TRUNCATED_CONTENT}}"""
```

### 5.2 Transformation Prompt (per type, combined for efficiency)
```
System: You are a content transformation assistant. Return ONLY valid JSON.

User:
Transform the following content into the requested formats.

Requested types: {{TYPES}}  // e.g., ["FAQ","SOCIAL_POST","EXECUTIVE_SUMMARY"]

- FAQ: 3-7 Q&A, question is concise, answer 1-3 sentences, grounded in content
- SOCIAL_POST: <=280 chars, engaging, no invented facts
- EXECUTIVE_SUMMARY: 120-180 words, formal

Schema:
{
  "faq": [{"question":"string","answer":"string"}],
  "socialPost": "string",
  "executiveSummary": "string"
}
Only include keys for requested types.

Content:
"""{{TRUNCATED_CONTENT}}"""
```

**Hallucination mitigation:** Prompts include "Do not invent facts not in content. If content is insufficient for FAQ, generate fewer items rather than hallucinate."

---

## 6. Validation & Sanitization

```ts
// backend/src/lib/ai/validator.ts
import { z } from 'zod';

export const AnalysisSchema = z.object({
  summary: z.string().min(20).max(600),
  keyPoints: z.array(z.string().min(5).max(200)).min(3).max(7),
  keywords: z.array(z.string().min(2).max(30)).min(5).max(12),
  topics: z.array(z.string().min(2).max(40)).min(1).max(5),
  suggestedTags: z.array(z.string().min(2).max(30)).min(3).max(8),
});

export const TransformSchema = z.object({
  faq: z.array(z.object({ question: z.string().min(5), answer: z.string().min(10) })).min(3).max(7).optional(),
  socialPost: z.string().min(10).max(280).optional(),
  executiveSummary: z.string().min(80).max(1500).optional(),
});
```

- **Steps:** `JSON.parse` → Zod parse → normalize (lowercase keywords/tags, trim, dedupe) → sanitize (strip HTML, limit length).
- **On failure:** retry once; if still fails, return 502 `AI_VALIDATION_FAILED` with provider raw snippet for debugging (never expose to UI beyond "AI response invalid, retry").

---

## 7. Error Handling & Fallback

| Failure | Handling |
|---------|----------|
| No API key / offline | `MockProvider` returns deterministic lorem-based JSON using content snippet (demo never breaks). |
| Timeout / 5xx from provider | Return 502 `AI_ERROR` with `retryable:true`; FE shows Retry button; backend does not persist partial. |
| Invalid JSON | Auto-retry with repair prompt; second failure → 502. |
| Zod validation fail | Same retry; log raw output. |
| Content too short/long | 400 validation before AI call. |
| Rate limited | 429 with `Retry-After` header. |

**Fallback behavior:** Never write partial/invalid outputs. `content.status` reverts to `draft` or `failed` so UI can retry.

---

## 8. Storage

- Each validated output → `generated_outputs` via **upsert** (`@@unique([contentId, outputType])`).
- Columns: `raw_ai_content` = normalized JSON/text, `edited_content` = null initially, `model`, `latency_ms`, tokens.
- `content.status` transitions: `draft` → `processing` (on AI start) → `completed`/`failed` (on success/failure).
- AI response storage is **append-only per type** (upsert preserves latest raw but edit history not versioned for MVP).

---

## 9. Token & Cost Considerations

- Max input 15k chars ≈ 3.5k tokens; analysis prompt ≈ 300 tokens; response ≈ 500-800 tokens.
- Estimated per content: ~4.5k tokens in + 700 out with `gpt-4o-mini` ≈ $0.003–0.005 per analysis — safe for hackathon budget.
- Log `promptTokens`/`completionTokens` per call for cost visibility.

---

## 10. Security & Privacy

- `AI_API_KEY` never leaves backend; never logged; never sent to frontend.
- Content sent to AI is user-owned; no cross-user leakage (ownership check before AI call).
- Opt-out: if user deletes content, associated outputs cascade deleted.

---

## 11. Abstraction Benefits

- Swap OpenAI → Gemini by implementing `GeminiProvider` matching `AIProvider` interface, change one env var.
- Tests use `MockProvider` deterministically, no network.
- Prompts versioned in `prompts.ts` for easy iteration.

---

## 12. Flow Summary (for implementation)

1. Controller checks ownership + status.
2. Service sets `status=processing`.
3. Provider builds prompt (truncate) → calls model with JSON mode + timeout.
4. Validator parses + normalizes.
5. Service upserts `generated_outputs` + sets `status=completed`.
6. Frontend displays for review; user edits → PUT saves `edited_content`.


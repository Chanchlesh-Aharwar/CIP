# Release 2.5 — single request for 3 outputs (Summary / FAQ / Social)
GENERATE_SYSTEM = "You are a content transformation assistant that ONLY uses the provided source. Return ONLY valid JSON. No markdown, no explanation."

def generate_prompt(content: str) -> str:
    truncated = content[:15000]
    prefix = "[Truncated — first 15k chars] " if len(content) > 15000 else ""
    return f'''Transform the SOURCE CONTENT into exactly three outputs. GROUND EVERY WORD IN THE SOURCE.

CRITICAL ANTI-HALLUCINATION RULES:
- Copy facts, names, dates, numbers ONLY if they appear verbatim in the source.
- If a fact is not in the source, say "Not specified in source" — NEVER invent.
- Preserve original wording where possible; do not paraphrase numbers/dates.
- Each FAQ answer must be a direct summary of one or more source sentences.

TASK:

1. SHORT SUMMARY — 3-5 sentences. Use only ideas from the source. Start with the main topic. Keep names/dates/numbers exactly as in source. 60-120 words.

2. FAQ — Exactly 4-5 Q&A. Each Q must be answerable from the source alone. Each A must be grounded in a specific source sentence. Format as plain text: "Q: ...\\nA: ..." separated by blank lines. Do NOT use generic filler like "The parties mentioned in the source" — use actual source details.

3. SOCIAL MEDIA POST — One concise post, 180-260 chars, engaging but factual. Must summarize the source without exaggeration. End with 3-5 hashtags derived from source keywords (e.g., #AI #Startups if source is about startups/AI).

Return ONLY JSON:
{{
"summary": "string",
"faq": "Q: ...\\nA: ...\\n\\nQ: ...\\nA: ...",
"social_post": "string with hashtags"
}}

SOURCE CONTENT:
"""{prefix}{truncated}"""
'''

# Legacy — kept for backward compat (analyze/transform)
ANALYSIS_SYSTEM = "You are a content intelligence assistant. Return ONLY valid JSON matching the schema. No markdown, no explanation."

def analysis_prompt(content: str) -> str:
    truncated = content[:15000]
    prefix = "[Truncated: showing first 15k chars] " if len(content) > 15000 else ""
    return f'''Analyze the following content. Produce:
- summary: 2-3 sentences, 40-80 words, neutral tone
- keyPoints: 3-7 bullets, each <25 words
- keywords: 5-12 lowercase keywords, deduplicated
- topics: 1-5 broad topics/categories
- suggestedTags: 3-8 tags, lowercase kebab-case

Schema:
{{
  "summary": "string",
  "keyPoints": ["string"],
  "keywords": ["string"],
  "topics": ["string"],
  "suggestedTags": ["string"]
}}

Content:
"""{prefix}{truncated}"""
'''


TRANSFORM_SYSTEM = "You are a content transformation assistant. Return ONLY valid JSON."

def transform_prompt(content: str, types: list) -> str:
    truncated = content[:15000]
    prefix = "[Truncated] " if len(content) > 15000 else ""
    return f'''Transform the following content into requested formats.
Requested types: {types}
- FAQ: 3-7 Q&A, question concise, answer 1-3 sentences, grounded in content
- SOCIAL_POST: <=280 chars, engaging, no invented facts
- EXECUTIVE_SUMMARY: 120-180 words, formal

Schema: {{"faq": [{{"question":"string","answer":"string"}}], "socialPost": "string", "executiveSummary": "string"}}
Only include keys for requested types.
Do not invent facts not in content.

Content:
"""{prefix}{truncated}"""
'''

import re
import time
import json
from app.ai.validator import AnalysisResult, TransformResult, GenerateResult

def _sentences(text: str):
    # split on period/newline, keep meaningful sentences
    parts = re.split(r'[.\n]+', text)
    sents = [p.strip().replace('  ', ' ') for p in parts if len(p.strip()) > 20]
    return sents

def _grounded_summary(content: str) -> str:
    sents = _sentences(content)
    if len(sents) >= 3:
        # Use first 3 sentences as summary base, ensure 3-5 sentences
        summary = '. '.join(sents[:3]) + '.'
        # Add one more if too short
        if len(summary.split()) < 40 and len(sents) > 3:
            summary += ' ' + sents[3] + '.'
        return summary[:900]
    snippet = content[:300].strip()
    return f"{snippet}... This summary is based only on the source content without inventing facts."

def _grounded_faq(content: str) -> str:
    sents = _sentences(content)
    # Build 4-5 Q&A grounded in actual sentences
    faq_parts = []
    if len(sents) >= 1:
        faq_parts.append(f"Q: What is the main topic of this content?\nA: {sents[0]}.")
    if len(sents) >= 2:
        faq_parts.append(f"Q: What details does the source provide?\nA: {sents[1]}.")
    if len(sents) >= 3:
        faq_parts.append(f"Q: What does the source say about key processes or data?\nA: {sents[2]}.")
    if len(sents) >= 4:
        faq_parts.append(f"Q: What additional information is mentioned?\nA: {sents[3]}.")
    else:
        faq_parts.append(f"Q: Where can I find more information?\nA: Refer to the original source content: {content[:120]}...")
    # Ensure 4-5 entries
    while len(faq_parts) < 4 and len(sents) > len(faq_parts):
        faq_parts.append(f"Q: What else is stated in the source?\nA: {sents[len(faq_parts)]}.")
    return "\n\n".join(faq_parts[:5])

def _grounded_social(content: str) -> str:
    snippet = content[:90].strip().replace('\n', ' ')
    # Extract hashtags from frequent words
    words = re.findall(r'\b[A-Za-z]{4,}\b', content.lower())
    # simple keyword pick: most frequent 5
    from collections import Counter
    common = [w for w, _ in Counter(words).most_common(5)]
    # Ensure AI-related hashtags present if topic is AI
    if 'ai' in content.lower() or 'artificial' in content.lower():
        tags = '#AI #Startups #Innovation'
        if common:
            tags += f" #{common[0].capitalize()} #{common[1].capitalize() if len(common) > 1 else 'Tech'}"
    else:
        tags = ' '.join([f"#{w.capitalize()}" for w in common[:3]]) or '#Content #Update'
        tags += ' #AI #Innovation'
    social = f"{snippet}... {tags}"
    # Ensure <=280? Actually social_post limit 600 per validator, but we keep concise ~200
    return social[:280]

class MockProvider:
    name = "mock"

    def analyze(self, content: str) -> AnalysisResult:
        snippet = content[:120].strip().replace("\n", " ")
        # grounded keywords: extract frequent words
        words = re.findall(r'\b[A-Za-z]{4,}\b', content.lower())
        from collections import Counter
        common = [w for w, _ in Counter(words).most_common(6)]
        return AnalysisResult(
            summary=_grounded_summary(content),
            keyPoints=[
                s.strip() + '.' for s in _sentences(content)[:4]
            ] or ["Key point extracted from source content."],
            keywords=common[:6] or ["mock", "content", "intelligence", "analysis", "sample", "demo"],
            topics=list(set([w.capitalize() for w in common[:2]])) or ["General"],
            suggestedTags=[f"{w}-tag" for w in common[:4]] or ["mock-tag", "sample-tag"],
        )

    def generate(self, content: str) -> GenerateResult:
        summary = _grounded_summary(content)
        faq = _grounded_faq(content)
        social = _grounded_social(content)
        result = GenerateResult(summary=summary, faq=faq, social_post=social)
        result._latency = 3
        return result

    def transform(self, content: str, types: list):
        exec_mock = "Executive summary mock: This content demonstrates transformation into a leadership-ready summary tailored for executive audiences. It synthesizes the source material into a concise yet comprehensive overview, highlighting strategic value, key findings, and actionable insights within 120-180 words. The summary emphasizes efficiency gains, cross-channel reuse, and the platform's ability to convert a single source into multiple structured outputs such as summaries, FAQs, and social posts. Stakeholders can quickly grasp business implications, recommended next steps, and areas requiring attention, while maintaining alignment with organizational goals and communication standards. This formal briefing is designed for decision-makers who need clarity, brevity, and relevance without sacrificing critical context, nuance, or data-driven rationale. The approach ensures consistent messaging, reduces manual effort, and accelerates time-to-insight across teams and channels. " 
        out = {}
        if "FAQ" in types:
            sents = _sentences(content)[:3]
            out["faq"] = [
                {"question": "What is this content about?", "answer": sents[0] + '.' if sents else "Based on source content."},
                {"question": "What details are provided?", "answer": sents[1] + '.' if len(sents) > 1 else "As stated in the source."},
                {"question": "What should be done next?", "answer": sents[2] + '.' if len(sents) > 2 else "Refer to source for details."},
            ]
        if "SOCIAL_POST" in types:
            out["socialPost"] = _grounded_social(content)
        if "EXECUTIVE_SUMMARY" in types:
            out["executiveSummary"] = _grounded_summary(content) + " " + exec_mock[:300]
        result = TransformResult(**out)
        result._latency = 3
        return result

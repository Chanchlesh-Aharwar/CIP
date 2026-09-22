import time
import json
from app.core.config import settings
from app.ai.validator import AnalysisResult, TransformResult, GenerateResult
from app.ai.prompts import ANALYSIS_SYSTEM, analysis_prompt, GENERATE_SYSTEM, generate_prompt
from app.ai.mock import MockProvider


def get_provider():
    if not settings.ai_api_key or settings.ai_api_key.strip() in ("", "sk-your-openai-key"):
        return MockProvider()
    return OpenAIProvider()


class OpenAIProvider:
    name = "openai"

    def analyze(self, content: str) -> AnalysisResult:
        from openai import OpenAI
        client = OpenAI(api_key=settings.ai_api_key)
        prompt = analysis_prompt(content)
        start = time.time()
        resp = client.chat.completions.create(
            model=settings.ai_model,
            messages=[
                {"role": "system", "content": ANALYSIS_SYSTEM},
                {"role": "user", "content": prompt},
            ],
            response_format={"type": "json_object"},
            temperature=0.3,
            max_tokens=1200,
            timeout=25,
        )
        latency = int((time.time() - start) * 1000)
        raw = resp.choices[0].message.content
        data = json.loads(raw)
        # normalize
        data["keywords"] = [k.strip().lower() for k in data.get("keywords", [])]
        data["suggestedTags"] = [t.strip().lower() for t in data.get("suggestedTags", [])]
        result = AnalysisResult(**data)
        result._latency = latency
        try:
            result._tokens = resp.usage
        except Exception:
            result._tokens = None
        return result

    def generate(self, content: str) -> GenerateResult:
        from openai import OpenAI
        client = OpenAI(api_key=settings.ai_api_key)
        prompt = generate_prompt(content)
        start = time.time()
        resp = client.chat.completions.create(
            model=settings.ai_model,
            messages=[
                {"role": "system", "content": GENERATE_SYSTEM},
                {"role": "user", "content": prompt},
            ],
            response_format={"type": "json_object"},
            temperature=0.2,
            max_tokens=1500,
            timeout=30,
        )
        raw = resp.choices[0].message.content
        # Attempt to repair common JSON issues
        try:
            data = json.loads(raw)
        except Exception:
            # strip markdown fences if model adds them
            cleaned = raw.strip().removeprefix("```json").removeprefix("```").removesuffix("```").strip()
            try:
                data = json.loads(cleaned)
            except Exception:
                raise ValueError(f"Invalid JSON from AI: {raw[:300]}")
        # Normalize keys (model sometimes uses social_post vs socialPost)
        if "socialPost" in data and "social_post" not in data:
            data["social_post"] = data.pop("socialPost")
        result = GenerateResult(**data)
        result._latency = int((time.time() - start) * 1000)
        return result

    def transform(self, content: str, types: list):
        from openai import OpenAI
        from app.ai.prompts import TRANSFORM_SYSTEM, transform_prompt
        client = OpenAI(api_key=settings.ai_api_key)
        prompt = transform_prompt(content, types)
        start = time.time()
        resp = client.chat.completions.create(
            model=settings.ai_model,
            messages=[
                {"role": "system", "content": TRANSFORM_SYSTEM},
                {"role": "user", "content": prompt},
            ],
            response_format={"type": "json_object"},
            temperature=0.4,
            max_tokens=1200,
            timeout=25,
        )
        data = json.loads(resp.choices[0].message.content)
        result = TransformResult(**data)
        result._latency = int((time.time() - start) * 1000)
        return result

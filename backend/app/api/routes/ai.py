import time
import json
from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel, Field, ValidationError
from app.core.database import get_db
from app.api.dependencies.auth import get_current_user
from app.models.user import User
from app.models.content import Content
from app.models.generated_output import GeneratedOutput, OutputType
from app.ai.provider import get_provider

router = APIRouter(tags=["ai"])


def _upsert_output(db: Session, content_id: str, otype: OutputType, raw: str, model: str = "mock", latency: int = 0):
    existing = db.query(GeneratedOutput).filter(GeneratedOutput.content_id == content_id, GeneratedOutput.output_type == otype).first()
    if existing:
        existing.raw_ai_content = raw
        existing.model = model
        existing.latency_ms = latency
        # keep edited_content as is
        db.add(existing)
        return existing
    else:
        g = GeneratedOutput(content_id=content_id, output_type=otype, raw_ai_content=raw, model=model, latency_ms=latency)
        db.add(g)
        return g


@router.post("/content/{content_id}/analyze")
def analyze_content(content_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    c = db.query(Content).filter(Content.id == content_id, Content.deleted_at.is_(None)).first()
    if not c:
        raise HTTPException(status_code=404, detail="Content not found")
    if c.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Forbidden")
    if c.status.value == "processing":
        raise HTTPException(status_code=409, detail="Already processing")

    c.status = "processing"
    db.commit()

    try:
        provider = get_provider()
        start = time.time()
        result = provider.analyze(c.original_content)
        latency = int((time.time() - start) * 1000)
        if hasattr(result, "_latency"):
            latency = result._latency

        model_name = getattr(provider, "name", "mock")
        # upsert 5 types
        mapping = {
            OutputType.SUMMARY: result.summary,
            OutputType.KEY_POINTS: json.dumps(result.keyPoints),
            OutputType.KEYWORDS: json.dumps(result.keywords),
            OutputType.TOPICS: json.dumps(result.topics),
            OutputType.SUGGESTED_TAGS: json.dumps(result.suggestedTags),
        }
        outputs = []
        for otype, raw in mapping.items():
            g = _upsert_output(db, c.id, otype, raw, model=model_name, latency=latency)
            outputs.append(g)
        c.status = "completed"
        db.commit()
        for g in outputs:
            db.refresh(g)
        return {
            "contentId": c.id,
            "status": c.status.value if hasattr(c.status, "value") else str(c.status),
            "outputs": [
                {"id": g.id, "outputType": g.output_type.value, "rawAiContent": g.raw_ai_content, "editedContent": g.edited_content, "model": g.model, "createdAt": str(g.created_at)}
                for g in outputs
            ],
        }
    except ValidationError as e:
        c.status = "failed"
        db.commit()
        raise HTTPException(status_code=502, detail=f"AI validation failed: {e}")
    except Exception as e:
        c.status = "failed"
        db.commit()
        raise HTTPException(status_code=502, detail=f"AI error: {str(e)[:200]}")


# Release 2.5 — single generate for 3 outputs
@router.post("/content/{content_id}/generate")
def generate_outputs(content_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    c = db.query(Content).filter(Content.id == content_id, Content.deleted_at.is_(None)).first()
    if not c:
        raise HTTPException(status_code=404, detail="Content not found")
    if c.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Forbidden")
    if c.status.value == "processing":
        raise HTTPException(status_code=409, detail="Already processing")
    c.status = "processing"
    db.commit()
    try:
        provider = get_provider()
        start = time.time()
        result = provider.generate(c.original_content)
        latency = getattr(result, "_latency", int((time.time() - start) * 1000))
        model_name = getattr(provider, "name", "mock")
        mapping = {
            OutputType.SUMMARY: result.summary,
            OutputType.FAQ: result.faq,
            OutputType.SOCIAL_POST: result.social_post,
        }
        outputs = []
        for otype, raw in mapping.items():
            g = _upsert_output(db, c.id, otype, raw, model=model_name, latency=latency)
            outputs.append(g)
        c.status = "completed"
        db.commit()
        for g in outputs:
            db.refresh(g)
        return {
            "contentId": c.id,
            "status": c.status.value if hasattr(c.status, "value") else str(c.status),
            "summary": result.summary,
            "faq": result.faq,
            "social_post": result.social_post,
            "outputs": [
                {"id": g.id, "outputType": g.output_type.value, "rawAiContent": g.raw_ai_content, "editedContent": g.edited_content, "model": g.model, "createdAt": str(g.created_at)}
                for g in outputs
            ],
        }
    except ValidationError as e:
        c.status = "failed"
        db.commit()
        raise HTTPException(status_code=502, detail=f"AI validation failed: {e}")
    except ValueError as e:
        c.status = "failed"
        db.commit()
        raise HTTPException(status_code=502, detail=str(e))
    except Exception as e:
        c.status = "failed"
        db.commit()
        raise HTTPException(status_code=502, detail=f"AI error: {str(e)[:300]}")


class TransformRequest(BaseModel):
    types: List[str] = Field(..., min_length=1, max_length=3)


ALLOWED_TRANSFORM = {"FAQ", "SOCIAL_POST", "EXECUTIVE_SUMMARY"}


@router.post("/content/{content_id}/transform")
def transform_content(content_id: str, payload: TransformRequest, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    c = db.query(Content).filter(Content.id == content_id, Content.deleted_at.is_(None)).first()
    if not c:
        raise HTTPException(status_code=404, detail="Content not found")
    if c.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Forbidden")
    if c.status.value == "processing":
        raise HTTPException(status_code=409, detail="Already processing")

    # validate types
    normalized = [t.strip().upper() for t in payload.types]
    for t in normalized:
        if t not in ALLOWED_TRANSFORM:
            raise HTTPException(status_code=400, detail=f"Invalid type: {t}. Allowed: {sorted(ALLOWED_TRANSFORM)}")
    if len(set(normalized)) != len(normalized):
        raise HTTPException(status_code=400, detail="Duplicate types not allowed")

    c.status = "processing"
    db.commit()
    try:
        provider = get_provider()
        start = time.time()
        result = provider.transform(c.original_content, normalized)
        latency = getattr(result, "_latency", int((time.time() - start) * 1000))
        model_name = getattr(provider, "name", "mock")

        mapping = {}
        if result.faq is not None:
            mapping[OutputType.FAQ] = json.dumps([i.model_dump() for i in result.faq])
        if result.socialPost is not None:
            mapping[OutputType.SOCIAL_POST] = result.socialPost
        if result.executiveSummary is not None:
            mapping[OutputType.EXECUTIVE_SUMMARY] = result.executiveSummary

        # only upsert requested types that were returned
        outputs = []
        for t, otype in [("FAQ", OutputType.FAQ), ("SOCIAL_POST", OutputType.SOCIAL_POST), ("EXECUTIVE_SUMMARY", OutputType.EXECUTIVE_SUMMARY)]:
            if t in normalized:
                raw = mapping.get(otype)
                if raw is None:
                    continue
                g = _upsert_output(db, c.id, otype, raw, model=model_name, latency=latency)
                outputs.append(g)

        c.status = "completed"
        db.commit()
        for g in outputs:
            db.refresh(g)
        return {
            "contentId": c.id,
            "status": c.status.value if hasattr(c.status, "value") else str(c.status),
            "outputs": [
                {"id": g.id, "outputType": g.output_type.value, "rawAiContent": g.raw_ai_content, "editedContent": g.edited_content, "model": g.model, "createdAt": str(g.created_at)}
                for g in outputs
            ],
        }
    except ValidationError as e:
        c.status = "failed"
        db.commit()
        raise HTTPException(status_code=502, detail=f"AI validation failed: {e}")
    except HTTPException:
        c.status = "failed"
        db.commit()
        raise
    except Exception as e:
        c.status = "failed"
        db.commit()
        raise HTTPException(status_code=502, detail=f"AI error: {str(e)[:200]}")

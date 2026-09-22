from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.api.dependencies.auth import get_current_user
from app.models.user import User
from app.models.content import Content
from app.models.generated_output import GeneratedOutput
from pydantic import BaseModel

router = APIRouter(tags=["outputs"])

class EditOutputRequest(BaseModel):
    edited_content: str


@router.get("/content/{content_id}/outputs")
def list_outputs(content_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    c = db.query(Content).filter(Content.id == content_id, Content.deleted_at.is_(None)).first()
    if not c:
        raise HTTPException(status_code=404, detail="Content not found")
    if c.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Forbidden")
    outputs = db.query(GeneratedOutput).filter(GeneratedOutput.content_id == content_id).all()
    return {"contentId": content_id, "outputs": [
        {"id": g.id, "outputType": g.output_type.value, "rawAiContent": g.raw_ai_content, "editedContent": g.edited_content, "model": g.model, "latencyMs": g.latency_ms, "createdAt": str(g.created_at), "updatedAt": str(g.updated_at)}
        for g in outputs
    ]}


@router.get("/outputs/{output_id}")
def get_output(output_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    g = db.query(GeneratedOutput).filter(GeneratedOutput.id == output_id).first()
    if not g:
        raise HTTPException(status_code=404, detail="Output not found")
    c = db.query(Content).filter(Content.id == g.content_id).first()
    if not c or c.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Forbidden")
    return {"id": g.id, "outputType": g.output_type.value, "rawAiContent": g.raw_ai_content, "editedContent": g.edited_content, "model": g.model, "latencyMs": g.latency_ms, "createdAt": str(g.created_at)}


@router.put("/outputs/{output_id}")
def edit_output(output_id: str, payload: EditOutputRequest, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    g = db.query(GeneratedOutput).filter(GeneratedOutput.id == output_id).first()
    if not g:
        raise HTTPException(status_code=404, detail="Output not found")
    c = db.query(Content).filter(Content.id == g.content_id).first()
    if not c or c.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Forbidden")
    if not payload.edited_content or len(payload.edited_content.strip()) == 0:
        raise HTTPException(status_code=400, detail="edited_content required")
    g.edited_content = payload.edited_content
    db.commit()
    db.refresh(g)
    return {"id": g.id, "outputType": g.output_type.value, "rawAiContent": g.raw_ai_content, "editedContent": g.edited_content, "updatedAt": str(g.updated_at)}

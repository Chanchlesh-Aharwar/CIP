from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.api.dependencies.auth import get_current_user
from app.models.user import User
from app.models.tag import Tag
from sqlalchemy import func

router = APIRouter(prefix="/tags", tags=["tags"])


@router.get("")
def list_tags(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    tags = db.query(Tag).filter(Tag.user_id == current_user.id).all()
    # count contents per tag
    from app.models.content_tag import ContentTag
    out = []
    for t in tags:
        cnt = db.query(func.count(ContentTag.content_id)).filter(ContentTag.tag_id == t.id).scalar()
        out.append({"id": t.id, "name": t.name, "contentCount": cnt})
    return {"tags": out}


@router.put("/{tag_id}")
def rename_tag(tag_id: str, payload: dict, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    name = (payload.get("name") or "").strip().lower()
    if not name or len(name) > 30:
        raise HTTPException(status_code=400, detail="Invalid name")
    tag = db.query(Tag).filter(Tag.id == tag_id).first()
    if not tag:
        raise HTTPException(status_code=404, detail="Tag not found")
    if tag.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Forbidden")
    exists = db.query(Tag).filter(Tag.user_id == current_user.id, Tag.name == name, Tag.id != tag_id).first()
    if exists:
        raise HTTPException(status_code=409, detail="Tag name already exists")
    tag.name = name
    db.commit()
    db.refresh(tag)
    return {"id": tag.id, "name": tag.name}


@router.delete("/{tag_id}")
def delete_tag(tag_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    tag = db.query(Tag).filter(Tag.id == tag_id).first()
    if not tag:
        raise HTTPException(status_code=404, detail="Tag not found")
    if tag.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Forbidden")
    db.delete(tag)
    db.commit()
    return {"message": "Tag deleted"}

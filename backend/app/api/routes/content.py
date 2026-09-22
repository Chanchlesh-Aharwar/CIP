from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_
from typing import Optional
from app.core.database import get_db
from app.api.dependencies.auth import get_current_user
from app.models.user import User
from app.models.content import Content
from app.models.tag import Tag
from app.models.content_tag import ContentTag
from app.schemas.content import ContentCreate, ContentUpdate

router = APIRouter(prefix="/content", tags=["content"])


def _normalize_tags(raw):
    if not raw:
        return []
    seen = set()
    out = []
    for t in raw:
        n = t.strip().lower()
        if not n or len(n) > 30:
            continue
        if n not in seen:
            seen.add(n)
            out.append(n)
    return out


def _get_or_create_tags(db: Session, user_id: str, names):
    tags = []
    for name in names:
        tag = db.query(Tag).filter(Tag.user_id == user_id, Tag.name == name).first()
        if not tag:
            tag = Tag(user_id=user_id, name=name)
            db.add(tag)
            db.flush()
        tags.append(tag)
    return tags


def _content_to_dict(c: Content, db: Session):
    tags = (
        db.query(Tag)
        .join(ContentTag, ContentTag.tag_id == Tag.id)
        .filter(ContentTag.content_id == c.id)
        .all()
    )
    output_count = db.query(Content).filter(Content.id == c.id).first()  # placeholder
    from app.models.generated_output import GeneratedOutput
    cnt = db.query(GeneratedOutput).filter(GeneratedOutput.content_id == c.id).count()
    return {
        "id": c.id,
        "user_id": c.user_id,
        "title": c.title,
        "original_content": c.original_content,
        "status": c.status.value if hasattr(c.status, "value") else str(c.status),
        "created_at": str(c.created_at) if c.created_at else None,
        "updated_at": str(c.updated_at) if c.updated_at else None,
        "tags": [{"id": t.id, "name": t.name} for t in tags],
        "output_count": cnt,
    }


@router.post("", status_code=201)
def create_content(payload: ContentCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    title = (payload.title or "").strip()
    if not title:
        title = payload.original_content.strip()[:60]
    tag_names = _normalize_tags(payload.tags)
    content = Content(
        user_id=current_user.id,
        title=title,
        original_content=payload.original_content,
        status="draft",
    )
    db.add(content)
    db.flush()
    tags = _get_or_create_tags(db, current_user.id, tag_names)
    for tag in tags:
        db.add(ContentTag(content_id=content.id, tag_id=tag.id))
    db.commit()
    db.refresh(content)
    return _content_to_dict(content, db)


@router.get("")
def list_content(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=50),
    search: Optional[str] = None,
    tag: Optional[str] = None,
    status: Optional[str] = None,
):
    q = db.query(Content).filter(Content.user_id == current_user.id, Content.deleted_at.is_(None))
    if search:
        like = f"%{search}%"
        q = q.filter(or_(Content.title.like(like), Content.original_content.like(like)))
    if status:
        q = q.filter(Content.status == status)
    if tag:
        q = q.join(ContentTag, ContentTag.content_id == Content.id).join(Tag, Tag.id == ContentTag.tag_id).filter(Tag.name == tag.lower(), Tag.user_id == current_user.id)
    total = q.count()
    items = q.order_by(Content.created_at.desc()).offset((page - 1) * limit).limit(limit).all()
    data = [_content_to_dict(c, db) for c in items]
    return {"data": data, "pagination": {"page": page, "limit": limit, "total": total, "totalPages": (total + limit - 1) // limit}}


@router.get("/{content_id}")
def get_content(content_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    c = db.query(Content).filter(Content.id == content_id, Content.deleted_at.is_(None)).first()
    if not c:
        raise HTTPException(status_code=404, detail="Content not found")
    if c.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Forbidden")
    return _content_to_dict(c, db)


@router.put("/{content_id}")
def update_content(content_id: str, payload: ContentUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    c = db.query(Content).filter(Content.id == content_id, Content.deleted_at.is_(None)).first()
    if not c:
        raise HTTPException(status_code=404, detail="Content not found")
    if c.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Forbidden")
    if payload.title is not None:
        c.title = payload.title.strip()
    if payload.original_content is not None:
        c.original_content = payload.original_content
    if payload.tags is not None:
        # replace tags
        db.query(ContentTag).filter(ContentTag.content_id == c.id).delete()
        tag_names = _normalize_tags(payload.tags)
        tags = _get_or_create_tags(db, current_user.id, tag_names)
        for tag in tags:
            db.add(ContentTag(content_id=c.id, tag_id=tag.id))
    db.commit()
    db.refresh(c)
    return _content_to_dict(c, db)


@router.delete("/{content_id}")
def delete_content(content_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    c = db.query(Content).filter(Content.id == content_id, Content.deleted_at.is_(None)).first()
    if not c:
        raise HTTPException(status_code=404, detail="Content not found")
    if c.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Forbidden")
    from datetime import datetime
    c.deleted_at = datetime.utcnow()
    db.commit()
    return {"message": "Content deleted"}

from pydantic import BaseModel, Field
from typing import List, Optional


class TagOut(BaseModel):
    id: str
    name: str

    class Config:
        from_attributes = True


class ContentCreate(BaseModel):
    title: Optional[str] = Field(None, max_length=255)
    original_content: str = Field(..., min_length=50, max_length=20000)
    tags: Optional[List[str]] = Field(default=None, max_length=20)


class ContentUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=255)
    original_content: Optional[str] = Field(None, min_length=50, max_length=20000)
    tags: Optional[List[str]] = Field(default=None, max_length=20)


class ContentOut(BaseModel):
    id: str
    user_id: str
    title: str
    original_content: str
    status: str
    created_at: Optional[str] = None
    updated_at: Optional[str] = None
    tags: List[TagOut] = []
    output_count: int = 0

    class Config:
        from_attributes = True

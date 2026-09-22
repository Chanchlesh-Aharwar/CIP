import uuid
import enum
from sqlalchemy import Column, String, Text, DateTime, Enum, ForeignKey, func, Index
from sqlalchemy.orm import relationship
from app.core.database import Base


class ContentStatus(str, enum.Enum):
    draft = "draft"
    processing = "processing"
    completed = "completed"
    failed = "failed"


class Content(Base):
    __tablename__ = "contents"
    __table_args__ = (
        Index("idx_contents_user_created", "user_id", "created_at"),
        Index("idx_contents_user_status", "user_id", "status"),
        Index("idx_contents_user_title", "user_id", "title", mysql_length={"title": 100}),
        {"mysql_engine": "InnoDB", "mysql_charset": "utf8mb4", "mysql_collate": "utf8mb4_unicode_ci"},
    )

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    title = Column(String(255), nullable=False)
    original_content = Column(Text, nullable=False)
    status = Column(Enum(ContentStatus), default=ContentStatus.draft, nullable=False)
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now(), nullable=False)
    deleted_at = Column(DateTime, nullable=True)

    user = relationship("User", back_populates="contents")
    outputs = relationship("GeneratedOutput", back_populates="content", cascade="all, delete-orphan")
    content_tags = relationship("ContentTag", back_populates="content", cascade="all, delete-orphan")

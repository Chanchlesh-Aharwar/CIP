import uuid
import enum
from sqlalchemy import Column, String, Text, Integer, DateTime, Enum, ForeignKey, func, UniqueConstraint, Index
from sqlalchemy.orm import relationship
from app.core.database import Base


class OutputType(str, enum.Enum):
    SUMMARY = "SUMMARY"
    KEY_POINTS = "KEY_POINTS"
    KEYWORDS = "KEYWORDS"
    TOPICS = "TOPICS"
    SUGGESTED_TAGS = "SUGGESTED_TAGS"
    FAQ = "FAQ"
    SOCIAL_POST = "SOCIAL_POST"
    EXECUTIVE_SUMMARY = "EXECUTIVE_SUMMARY"


class GeneratedOutput(Base):
    __tablename__ = "generated_outputs"
    __table_args__ = (
        UniqueConstraint("content_id", "output_type", name="uq_generated_content_type"),
        Index("idx_generated_content_id", "content_id"),
        Index("idx_generated_output_type", "output_type"),
        {"mysql_engine": "InnoDB", "mysql_charset": "utf8mb4", "mysql_collate": "utf8mb4_unicode_ci"},
    )

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    content_id = Column(String(36), ForeignKey("contents.id", ondelete="CASCADE"), nullable=False)
    output_type = Column(Enum(OutputType), nullable=False)
    raw_ai_content = Column(Text, nullable=False)
    edited_content = Column(Text, nullable=True)
    model = Column(String(100), nullable=True)
    latency_ms = Column(Integer, nullable=True)
    prompt_tokens = Column(Integer, nullable=True)
    completion_tokens = Column(Integer, nullable=True)
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now(), nullable=False)

    content = relationship("Content", back_populates="outputs")

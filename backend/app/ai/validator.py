from pydantic import BaseModel, Field
from typing import List, Optional


class GenerateResult(BaseModel):
    summary: str = Field(..., min_length=20, max_length=1000)
    faq: str = Field(..., min_length=20, max_length=5000)
    social_post: str = Field(..., min_length=10, max_length=600)


class AnalysisResult(BaseModel):
    summary: str = Field(..., min_length=20, max_length=600)
    keyPoints: List[str] = Field(..., min_length=3, max_length=7)
    keywords: List[str] = Field(..., min_length=5, max_length=12)
    topics: List[str] = Field(..., min_length=1, max_length=5)
    suggestedTags: List[str] = Field(..., min_length=3, max_length=8)


class FAQItem(BaseModel):
    question: str = Field(..., min_length=5)
    answer: str = Field(..., min_length=10)


class TransformResult(BaseModel):
    faq: Optional[List[FAQItem]] = Field(None, min_length=3, max_length=7)
    socialPost: Optional[str] = Field(None, min_length=10, max_length=280)
    executiveSummary: Optional[str] = Field(None, min_length=80, max_length=1500)

"""
Topic Pydantic models.
"""
from pydantic import BaseModel, Field
from typing import Optional


class TopicCreate(BaseModel):
    subject: str = Field(..., min_length=2)
    topic_name: str = Field(..., min_length=2)
    keywords: list[str] = Field(default_factory=list)


class TopicResponse(BaseModel):
    id: str
    subject: str
    topic_name: str
    keywords: list[str]

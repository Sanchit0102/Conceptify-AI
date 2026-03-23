"""
Resource Pydantic models.
"""
from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
from enum import Enum


class FileType(str, Enum):
    PDF = "pdf"
    CODE = "code"
    SLIDES = "slides"
    LAB_MANUAL = "lab_manual"
    QUESTION_PAPER = "question_paper"
    OTHER = "other"


class ResourceCreate(BaseModel):
    title: str = Field(..., min_length=2, max_length=200)
    subject: str = Field(..., min_length=2)
    topic: str = Field(default="")
    description: str = Field(default="")
    file_type: FileType = FileType.OTHER
    target_class: str = "All"


class ResourceResponse(BaseModel):
    id: str
    title: str
    subject: str
    topic: str
    description: str
    file_path: str
    file_type: FileType
    uploaded_by: str
    uploaded_by_name: str = ""
    created_at: str
    ai_summary: str = ""
    target_class: str = "All"


class ResourceListResponse(BaseModel):
    resources: list[ResourceResponse]
    total: int

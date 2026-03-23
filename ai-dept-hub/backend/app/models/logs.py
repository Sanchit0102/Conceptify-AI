"""
Log Pydantic models — SearchLog, AIQuery, DebugLog.
"""
from pydantic import BaseModel, Field
from typing import Optional


class SearchLogCreate(BaseModel):
    query: str
    user_id: str = ""


class AIQueryCreate(BaseModel):
    question: str = Field(..., min_length=3)


class AIQueryResponse(BaseModel):
    id: str
    question: str
    response: str
    user_id: str
    timestamp: str


class DebugRequest(BaseModel):
    code: str = Field(..., min_length=1)
    language: str = Field(default="python")


class DebugResponse(BaseModel):
    id: str
    code: str
    language: str
    analysis: dict
    timestamp: str


class SummarizeRequest(BaseModel):
    resource_id: str = ""
    text: str = ""

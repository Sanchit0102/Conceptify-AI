"""
AI routes — ask questions (RAG), summarize, and debug code.
"""
from datetime import datetime, timezone
from fastapi import APIRouter, Depends
from app.models.logs import AIQueryCreate, AIQueryResponse, DebugRequest, DebugResponse, SummarizeRequest
from app.utils.deps import get_current_user
from app.ai.rag import answer_question
from app.ai.summarizer import summarize_text
from app.ai.debugger import debug_code
from app.database import ai_queries_collection, debug_logs_collection, resources_collection
from app.services.resource_service import get_resource_by_id
from app.utils.pdf_extractor import extract_text_from_path
from app.config import settings
from bson import ObjectId

router = APIRouter(prefix="/ai", tags=["AI Services"])


@router.post("/ask")
async def ask_question(query: AIQueryCreate, current_user: dict = Depends(get_current_user)):
    """Ask the AI assistant a question (RAG pipeline)."""
    result = await answer_question(query.question)

    # Log the query
    timestamp = datetime.now(timezone.utc).isoformat()
    log_doc = {
        "question": query.question,
        "response": result["answer"],
        "user_id": current_user["id"],
        "user_name": current_user["name"],
        "timestamp": timestamp,
    }
    insert_result = await ai_queries_collection.insert_one(log_doc)

    return {
        "id": str(insert_result.inserted_id),
        "question": query.question,
        "answer": result["answer"],
        "sources": result.get("sources", []),
        "context_used": result.get("context_used", False),
        "timestamp": timestamp,
    }


@router.post("/summarize")
async def summarize(request: SummarizeRequest, current_user: dict = Depends(get_current_user)):
    """Summarize a resource or provided text."""
    text = request.text

    if request.resource_id and not text:
        # Fetch resource text
        doc = await get_resource_by_id(request.resource_id)
        if not doc:
            return {"summary": "Resource not found.", "resource_id": request.resource_id}

        # Try to get existing summary
        if doc.get("ai_summary"):
            return {"summary": doc["ai_summary"], "resource_id": request.resource_id, "cached": True}

        # Extract text from PDF
        file_path = settings.upload_path / doc.get("file_path", "")
        if str(file_path).endswith(".pdf") and file_path.exists():
            text = extract_text_from_path(str(file_path))
        else:
            text = f"{doc.get('title', '')} {doc.get('description', '')}"

    if not text:
        return {"summary": "No text provided for summarization.", "resource_id": request.resource_id}

    summary = await summarize_text(text)

    # Cache the summary if it was for a resource
    if request.resource_id:
        try:
            await resources_collection.update_one(
                {"_id": ObjectId(request.resource_id)},
                {"$set": {"ai_summary": summary}},
            )
        except Exception:
            pass

    return {"summary": summary, "resource_id": request.resource_id, "cached": False}


@router.post("/debug")
async def debug(request: DebugRequest, current_user: dict = Depends(get_current_user)):
    """Analyze and debug code."""
    result = await debug_code(request.code, request.language)

    # Log the debug session
    timestamp = datetime.now(timezone.utc).isoformat()
    log_doc = {
        "code": request.code,
        "language": request.language,
        "analysis": result,
        "user_id": current_user["id"],
        "timestamp": timestamp,
    }
    insert_result = await debug_logs_collection.insert_one(log_doc)

    return {
        "id": str(insert_result.inserted_id),
        "code": request.code,
        "language": request.language,
        "analysis": result,
        "timestamp": timestamp,
    }

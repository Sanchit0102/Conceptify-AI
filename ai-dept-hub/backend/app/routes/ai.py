"""
AI routes — ask questions (RAG), summarize, and debug code.
"""
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, File, UploadFile
import logging
from app.models.logs import AIQueryCreate, AIQueryResponse, DebugRequest, DebugResponse, SummarizeRequest
from app.utils.deps import get_current_user
from app.ai.rag import answer_question
from app.ai.summarizer import summarize_text, get_llm
from app.ai.debugger import debug_code
from app.database import ai_queries_collection, debug_logs_collection, resources_collection
from app.services.resource_service import get_resource_by_id
from app.utils.pdf_extractor import extract_text_from_path
from app.utils.ocr_extractor import extract_text_from_file
from app.config import settings
from bson import ObjectId
import json
import re

router = APIRouter(prefix="/ai", tags=["AI Services"])
logger = logging.getLogger(__name__)


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

@router.post("/assist")
async def conceptify_assist(file: UploadFile = File(...), current_user: dict = Depends(get_current_user)):
    """Process a question paper (PDF or Image) and return answers from RAG."""
    # 1. Read file and extract text
    contents = await file.read()
    file_ext = file.filename.split('.')[-1]
    raw_text = extract_text_from_file(contents, file_ext)

    if not raw_text or "Error" in raw_text:
        return {"error": raw_text or "Failed to extract text from file"}

    # 2. Use LLM to identify questions
    llm = get_llm()
    if not llm:
        return {"error": "AI assistant unavailable."}

    prompt = f"""You are an expert at analyzing exam question papers. 
Extract all distinct questions from the following text. 
Return them ONLY as a JSON list of strings. No numbering, no extra text.
If a question has sub-parts, combine them into one comprehensive question string.

TEXT FROM QUESTION PAPER:
{raw_text}

JSON LIST:"""
    
    import asyncio

    try:
        response = await llm.ainvoke(prompt)
        json_str = response.content.strip()
        if json_str.startswith("```json"):
            json_str = json_str[7:-3].strip()
        elif json_str.startswith("```"):
            json_str = json_str[3:-3].strip()
        
        questions = json.loads(json_str)
    except Exception as e:
        logger.error(f"LLM question extraction failed: {e}")
        # Fallback: simple split if LLM fails or returns garbage
        questions = [q.strip() for q in re.split(r'\d+\.|\?|\n', raw_text) if len(q.strip()) > 10]

    # 3. Limit to first 5 questions to prevent timeouts and rate limits
    questions = questions[:5]

    # 4. Use asyncio.gather to run RAG calls in parallel
    async def process_question(idx, q):
        try:
            answer_data = await answer_question(q)
            return {
                "number": idx,
                "question": q,
                "answer": answer_data["answer"]
            }
        except Exception as e:
            logger.error(f"Error answering question {idx}: {e}")
            return {
                "number": idx,
                "question": q,
                "answer": f"Sorry, I encountered an error while processing this question: {str(e)}"
            }

    tasks = [process_question(i, q) for i, q in enumerate(questions, 1)]
    results = await asyncio.gather(*tasks)

    return {"results": results}

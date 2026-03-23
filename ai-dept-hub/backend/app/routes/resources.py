"""
Resource routes — upload, list, search, get by ID.
"""
import os
import uuid
from datetime import datetime, timezone
from fastapi import APIRouter, HTTPException, UploadFile, File, Form, Depends, Query, status
from app.models.resource import FileType, ResourceResponse, ResourceListResponse
from app.services.resource_service import (
    create_resource, get_resources, get_resource_by_id, search_resources, format_resource, delete_resource_by_id
)
from app.utils.deps import get_current_user, require_faculty, require_admin
from app.utils.pdf_extractor import extract_text_from_pdf
from app.ai.vectorstore import add_document
from app.ai.summarizer import summarize_text
from app.config import settings

router = APIRouter(prefix="/resources", tags=["Resources"])


@router.post("/upload", response_model=ResourceResponse, status_code=status.HTTP_201_CREATED)
async def upload_resource(
    file: UploadFile = File(...),
    title: str = Form(...),
    subject: str = Form(...),
    topic: str = Form(""),
    description: str = Form(""),
    file_type: str = Form("other"),
    target_class: str = Form("All"),
    current_user: dict = Depends(require_faculty),
):
    """Upload a new resource file (faculty/admin only)."""
    # Save file
    ext = os.path.splitext(file.filename)[1] if file.filename else ""
    unique_name = f"{uuid.uuid4().hex}{ext}"
    file_path = settings.upload_path / unique_name

    content = await file.read()
    with open(file_path, "wb") as f:
        f.write(content)

    # Extract text for PDF files and generate AI summary
    ai_summary = ""
    extracted_text = ""
    if ext.lower() == ".pdf":
        extracted_text = extract_text_from_pdf(content)
        if extracted_text and not extracted_text.startswith("[PDF extraction error"):
            try:
                ai_summary = await summarize_text(extracted_text)
            except Exception:
                ai_summary = ""

    # Store in database
    doc = await create_resource(
        title=title,
        subject=subject,
        topic=topic,
        description=description,
        file_path=str(unique_name),
        file_type=file_type,
        uploaded_by=current_user["id"],
        ai_summary=ai_summary,
        target_class=target_class,
    )

    resource_id = str(doc["_id"])

    # Index in vector store for semantic search
    text_to_index = extracted_text or f"{title} {subject} {topic} {description}"
    if text_to_index.strip():
        try:
            add_document(
                doc_id=resource_id,
                text=text_to_index,
                metadata={
                    "resource_id": resource_id,
                    "title": title,
                    "subject": subject,
                    "topic": topic,
                    "file_type": file_type,
                },
            )
        except Exception:
            pass  # Non-critical — search still works via MongoDB text search

    return ResourceResponse(
        id=resource_id,
        title=title,
        subject=subject,
        topic=topic,
        description=description,
        file_path=unique_name,
        file_type=file_type,
        uploaded_by=current_user["id"],
        uploaded_by_name=current_user["name"],
        created_at=doc.get("created_at", ""),
        ai_summary=ai_summary,
        target_class=target_class,
    )


@router.get("", response_model=ResourceListResponse)
async def list_resources(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    subject: str = Query(None),
    file_type: str = Query(None),
    current_user: dict = Depends(get_current_user),
):
    """List all resources with optional filters."""
    
    target_class_obj = None
    if current_user["role"] == "student" and current_user.get("class_name"):
        target_class_obj = current_user["class_name"]

    docs, total = await get_resources(
        skip=skip, 
        limit=limit, 
        subject=subject, 
        file_type=file_type, 
        target_class=target_class_obj
    )
    resources = [format_resource(doc) for doc in docs]
    return ResourceListResponse(resources=resources, total=total)


@router.get("/search")
async def search(
    q: str = Query(..., min_length=1),
    limit: int = Query(20, ge=1, le=50),
):
    """Search resources by text query."""
    docs = await search_resources(q, limit=limit)
    return {"results": [format_resource(doc) for doc in docs], "query": q}


@router.get("/{resource_id}", response_model=ResourceResponse)
async def get_resource(resource_id: str):
    """Get a single resource by ID."""
    doc = await get_resource_by_id(resource_id)
    if not doc:
        raise HTTPException(status_code=404, detail="Resource not found")
    return format_resource(doc)


@router.delete("/{resource_id}")
async def delete_resource_route(resource_id: str, current_user: dict = Depends(require_admin)):
    """Delete a resource by ID (Admin only)."""
    doc = await get_resource_by_id(resource_id)
    if not doc:
        raise HTTPException(status_code=404, detail="Resource not found")
        
    # Optional: Delete the actual file from disk
    file_path = settings.upload_path / doc.get("file_path", "")
    if file_path.exists() and file_path.is_file():
        try:
            os.remove(file_path)
        except Exception:
            pass
            
    success = await delete_resource_by_id(resource_id)
    if not success:
        raise HTTPException(status_code=400, detail="Failed to delete resource")
    return {"status": "deleted"}

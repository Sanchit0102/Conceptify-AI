"""
Search routes — unified semantic + text search.
"""
from datetime import datetime, timezone
from fastapi import APIRouter, Query, Depends
from app.ai.vectorstore import search as vector_search
from app.services.resource_service import search_resources, format_resource, get_resource_by_id
from app.database import search_logs_collection
from app.utils.deps import get_current_user

router = APIRouter(tags=["Search"])


@router.get("/search")
async def unified_search(
    q: str = Query(..., min_length=1, description="Search query"),
    limit: int = Query(10, ge=1, le=50),
    current_user: dict = Depends(get_current_user),
):
    """Unified search combining semantic (vector) and text-based search."""

    # Log the search
    await search_logs_collection.insert_one({
        "query": q,
        "user_id": current_user["id"],
        "timestamp": datetime.now(timezone.utc).isoformat(),
    })

    # 1. Semantic search via vector store
    semantic_results = []
    try:
        vector_results = vector_search(q, n_results=limit)
        for item in vector_results:
            meta = item.get("metadata", {})
            res_id = meta.get("resource_id", "")
            # Look up the actual resource to get file_path
            file_path = ""
            description = ""
            if res_id:
                try:
                    res_doc = await get_resource_by_id(res_id)
                    if res_doc:
                        file_path = res_doc.get("file_path", "")
                        description = res_doc.get("description", "")
                except Exception:
                    pass
            semantic_results.append({
                "title": meta.get("title", "Untitled"),
                "subject": meta.get("subject", ""),
                "topic": meta.get("topic", ""),
                "resource_id": res_id,
                "file_type": meta.get("file_type", ""),
                "file_path": file_path,
                "description": description,
                "snippet": item["text"][:300],
                "score": item.get("score", 0),
                "search_type": "semantic",
            })
    except Exception:
        pass

    # 2. Text-based search via MongoDB
    text_results = []
    try:
        docs = await search_resources(q, limit=limit)
        for doc in docs:
            formatted = format_resource(doc)
            text_results.append({
                "title": formatted["title"],
                "subject": formatted["subject"],
                "topic": formatted["topic"],
                "resource_id": formatted["id"],
                "file_type": formatted["file_type"],
                "file_path": formatted.get("file_path", ""),
                "description": formatted.get("description", ""),
                "snippet": formatted.get("description", "")[:300],
                "score": 0.5,
                "search_type": "text",
            })
    except Exception:
        pass

    # Merge and deduplicate by resource_id
    seen = set()
    combined = []
    for item in semantic_results + text_results:
        rid = item.get("resource_id", "")
        if rid and rid in seen:
            continue
        if rid:
            seen.add(rid)
        combined.append(item)

    # Sort by score descending
    combined.sort(key=lambda x: x.get("score", 0), reverse=True)

    return {
        "query": q,
        "results": combined[:limit],
        "total": len(combined),
    }

"""
Resource service — business logic for resource management.
"""
from datetime import datetime, timezone
from bson import ObjectId
from app.database import resources_collection, users_collection


async def create_resource(
    title: str,
    subject: str,
    topic: str,
    description: str,
    file_type: str,
    uploaded_by: str,
    ai_summary: str = "",
    **kwargs
) -> dict:
    """Insert a new resource document."""
    doc = {
        "title": title,
        "subject": subject,
        "topic": topic,
        "description": description,
        "file_path": file_path,
        "file_type": file_type,
        "uploaded_by": uploaded_by,
        "ai_summary": ai_summary,
        "target_class": kwargs.get("target_class", "All"),
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    result = await resources_collection.insert_one(doc)
    doc["_id"] = result.inserted_id
    return doc


async def get_resources(skip: int = 0, limit: int = 50, subject: str = None, file_type: str = None, target_class: str = None) -> tuple:
    """List resources with optional filters."""
    query = {}
    if subject:
        query["subject"] = {"$regex": subject, "$options": "i"}
    if file_type:
        query["file_type"] = file_type
    if target_class:
        query["target_class"] = {"$in": ["All", target_class]}

    total = await resources_collection.count_documents(query)
    cursor = resources_collection.find(query).skip(skip).limit(limit).sort("created_at", -1)
    docs = await cursor.to_list(length=limit)
    return docs, total


async def get_resource_by_id(resource_id: str) -> dict | None:
    """Get a single resource by its ID."""
    try:
        doc = await resources_collection.find_one({"_id": ObjectId(resource_id)})
        return doc
    except Exception:
        return None


async def delete_resource_by_id(resource_id: str) -> bool:
    """Delete a resource by its ID."""
    try:
        result = await resources_collection.delete_one({"_id": ObjectId(resource_id)})
        return result.deleted_count > 0
    except Exception:
        return False


async def search_resources(query: str, limit: int = 20) -> list:
    """Text search across title, subject, topic, description."""
    search_query = {
        "$or": [
            {"title": {"$regex": query, "$options": "i"}},
            {"subject": {"$regex": query, "$options": "i"}},
            {"topic": {"$regex": query, "$options": "i"}},
            {"description": {"$regex": query, "$options": "i"}},
        ]
    }
    cursor = resources_collection.find(search_query).limit(limit)
    return await cursor.to_list(length=limit)


def format_resource(doc: dict) -> dict:
    """Convert a MongoDB resource doc to a JSON-safe dict."""
    return {
        "id": str(doc["_id"]),
        "title": doc.get("title", ""),
        "subject": doc.get("subject", ""),
        "topic": doc.get("topic", ""),
        "description": doc.get("description", ""),
        "file_path": doc.get("file_path", ""),
        "file_type": doc.get("file_type", "other"),
        "uploaded_by": str(doc.get("uploaded_by", "")),
        "uploaded_by_name": doc.get("uploaded_by_name", ""),
        "created_at": doc.get("created_at", ""),
        "ai_summary": doc.get("ai_summary", ""),
        "target_class": doc.get("target_class", "All"),
    }

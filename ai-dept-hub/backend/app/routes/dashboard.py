"""
Dashboard routes — faculty analytics and topic management.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from app.models.topic import TopicCreate, TopicResponse
from app.services.analytics_service import get_dashboard_analytics
from app.utils.deps import require_faculty, require_admin
from app.database import topics_collection, users_collection
from app.models.user import UserResponse
from bson import ObjectId

router = APIRouter(tags=["Faculty Dashboard"])


@router.get("/dashboard/analytics")
async def analytics(current_user: dict = Depends(require_faculty)):
    """Get dashboard analytics data (faculty/admin only)."""
    data = await get_dashboard_analytics()
    return data


@router.post("/topics/create", response_model=TopicResponse, status_code=status.HTTP_201_CREATED)
async def create_topic(topic: TopicCreate, current_user: dict = Depends(require_faculty)):
    """Create a new topic (faculty/admin only)."""
    # Check for duplicates
    existing = await topics_collection.find_one({
        "subject": topic.subject,
        "topic_name": topic.topic_name,
    })
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This topic already exists for the given subject",
        )

    doc = {
        "subject": topic.subject,
        "topic_name": topic.topic_name,
        "keywords": topic.keywords,
    }
    result = await topics_collection.insert_one(doc)

    return TopicResponse(
        id=str(result.inserted_id),
        subject=topic.subject,
        topic_name=topic.topic_name,
        keywords=topic.keywords,
    )


@router.get("/topics")
async def list_topics(subject: str = None):
    """List all topics, optionally filtered by subject."""
    query = {}
    if subject:
        query["subject"] = {"$regex": subject, "$options": "i"}
    cursor = topics_collection.find(query)
    docs = await cursor.to_list(length=100)
    return [
        TopicResponse(
            id=str(doc["_id"]),
            subject=doc["subject"],
            topic_name=doc["topic_name"],
            keywords=doc.get("keywords", []),
        )
        for doc in docs
    ]


@router.get("/dashboard/users")
async def list_users(current_user: dict = Depends(require_admin)):
    """List all users (Admin only)."""
    cursor = users_collection.find()
    docs = await cursor.to_list(length=1000)
    return [
        UserResponse(
            id=str(doc["_id"]),
            name=doc["name"],
            email=doc["email"],
            role=doc["role"],
            department=doc.get("department", ""),
            class_name=doc.get("class_name"),
            roll_number=doc.get("roll_number")
        )
        for doc in docs
    ]


@router.post("/dashboard/users/{user_id}/promote")
async def promote_user(user_id: str, current_user: dict = Depends(require_admin)):
    """Promote a student to faculty (Admin only)."""
    result = await users_collection.update_one(
        {"_id": ObjectId(user_id)},
        {"$set": {"role": "faculty"}}
    )
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="User not found or already faculty")
    return {"status": "success"}

@router.delete("/dashboard/users/{user_id}")
async def delete_user(user_id: str, current_user: dict = Depends(require_admin)):
    """Delete a user account (Admin only)."""
    if str(current_user["id"]) == user_id:
        raise HTTPException(status_code=400, detail="Cannot delete your own admin account")
    
    result = await users_collection.delete_one({"_id": ObjectId(user_id)})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    return {"status": "success"}

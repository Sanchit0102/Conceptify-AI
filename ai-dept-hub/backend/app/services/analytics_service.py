"""
Analytics service — aggregation queries for the faculty dashboard.
"""
from app.database import (
    resources_collection,
    search_logs_collection,
    ai_queries_collection,
    debug_logs_collection,
    users_collection,
)


async def get_dashboard_analytics() -> dict:
    """Aggregate analytics data for the faculty dashboard."""
    total_resources = await resources_collection.count_documents({})
    total_users = await users_collection.count_documents({})
    total_searches = await search_logs_collection.count_documents({})
    total_ai_queries = await ai_queries_collection.count_documents({})

    # Most searched topics (top 10)
    search_pipeline = [
        {"$group": {"_id": "$query", "count": {"$sum": 1}}},
        {"$sort": {"count": -1}},
        {"$limit": 10},
    ]
    top_searches_cursor = search_logs_collection.aggregate(search_pipeline)
    top_searches = []
    async for doc in top_searches_cursor:
        top_searches.append({"query": doc["_id"], "count": doc["count"]})

    # Resources by subject
    subject_pipeline = [
        {"$group": {"_id": "$subject", "count": {"$sum": 1}}},
        {"$sort": {"count": -1}},
    ]
    subject_cursor = resources_collection.aggregate(subject_pipeline)
    resources_by_subject = []
    async for doc in subject_cursor:
        resources_by_subject.append({"subject": doc["_id"], "count": doc["count"]})

    # Resources by file type
    type_pipeline = [
        {"$group": {"_id": "$file_type", "count": {"$sum": 1}}},
        {"$sort": {"count": -1}},
    ]
    type_cursor = resources_collection.aggregate(type_pipeline)
    resources_by_type = []
    async for doc in type_cursor:
        resources_by_type.append({"file_type": doc["_id"], "count": doc["count"]})

    # Recent AI questions
    recent_questions_cursor = (
        ai_queries_collection.find({}, {"question": 1, "timestamp": 1, "user_name": 1})
        .sort("timestamp", -1)
        .limit(10)
    )
    recent_questions = []
    async for doc in recent_questions_cursor:
        recent_questions.append(
            {"question": doc.get("question", ""), "timestamp": doc.get("timestamp", ""), "user_name": doc.get("user_name", "Student")}
        )

    return {
        "total_resources": total_resources,
        "total_users": total_users,
        "total_searches": total_searches,
        "total_ai_queries": total_ai_queries,
        "top_searches": top_searches,
        "resources_by_subject": resources_by_subject,
        "resources_by_type": resources_by_type,
        "recent_questions": recent_questions,
    }

"""
Async MongoDB connection using Motor.
"""
from motor.motor_asyncio import AsyncIOMotorClient
from app.config import settings

client = AsyncIOMotorClient(settings.MONGO_URL)
database = client[settings.DB_NAME]


def get_database():
    """Return the database instance."""
    return database


# Collection references
users_collection = database["users"]
resources_collection = database["resources"]
topics_collection = database["topics"]
search_logs_collection = database["search_logs"]
ai_queries_collection = database["ai_queries"]
debug_logs_collection = database["debug_logs"]

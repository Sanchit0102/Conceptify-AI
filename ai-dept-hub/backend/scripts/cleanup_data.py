"""
Cleanup Script: Deletes all data except the Admin account.
Usage: python scripts/cleanup_data.py
"""
import asyncio
import os
import shutil
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

MONGO_URL = os.getenv("MONGO_URL", "mongodb://localhost:27017")
DB_NAME = os.getenv("DB_NAME", "ai_dept_hub")
UPLOAD_DIR = "uploads"

async def cleanup():
    print(f"Connecting to {DB_NAME}...")
    client = AsyncIOMotorClient(MONGO_URL)
    db = client[DB_NAME]

    # 1. Cleanup Collections
    collections_to_clear = ["resources", "topics", "search_logs", "ai_queries", "debug_logs"]
    
    for coll in collections_to_clear:
        result = await db[coll].delete_many({})
        print(f" - Cleared {coll}: {result.deleted_count} documents deleted.")

    # 2. Cleanup Users (Keep Admin)
    # Note: Using role="admin" as the filter to keep
    user_result = await db["users"].delete_many({"role": {"$ne": "admin"}})
    print(f" - Cleared non-admin users: {user_result.deleted_count} documents deleted.")

    # 3. Cleanup Uploads folder
    if os.path.exists(UPLOAD_DIR):
        print(f"Cleaning {UPLOAD_DIR} folder...")
        for filename in os.listdir(UPLOAD_DIR):
            file_path = os.path.join(UPLOAD_DIR, filename)
            try:
                if os.path.isfile(file_path) or os.path.islink(file_path):
                    os.unlink(file_path)
                elif os.path.isdir(file_path):
                    shutil.rmtree(file_path)
            except Exception as e:
                print(f'Failed to delete {file_path}. Reason: {e}')
        print(" - Uploads folder cleared.")

    print("\nCleanup Complete! Only Admin accounts remain.")
    client.close()

if __name__ == "__main__":
    asyncio.run(cleanup())

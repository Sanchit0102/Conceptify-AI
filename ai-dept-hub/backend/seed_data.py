"""
Sample Data Seeder — populates the database with demo users, resources, and topics.
Run: python seed_data.py
"""
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from passlib.context import CryptContext
from datetime import datetime, timezone

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

MONGO_URL = "mongodb+srv://database2:database2@cluster0.p4ztr4z.mongodb.net/?appName=Cluster0"
DB_NAME = "ai_dept_hub"


async def seed():
    client = AsyncIOMotorClient(MONGO_URL)
    db = client[DB_NAME]

    # Clear existing data
    for col in ["users", "resources", "topics", "search_logs", "ai_queries", "debug_logs"]:
        await db[col].delete_many({})

    print("🗑️  Cleared existing data")

    # ── USERS ──
    users = [
        {"name": "Prof. S. Pande", "email": "pande@avcoe.org", "password": pwd_context.hash("faculty123"), "role": "faculty", "department": "AI & DS"},
        {"name": "Sumit Baviskar", "email": "sumit@gmail.com", "password": pwd_context.hash("student123"), "role": "student", "department": "AI & DS"},
        {"name": "Admin", "email": "admin@avcoe.org", "password": pwd_context.hash("admin123"), "role": "admin", "department": "AI & DS"},
    ]
    result = await db["users"].insert_many(users)
    faculty_id = str(result.inserted_ids[0])
    print(f"👥 Created {len(users)} users")

    # ── TOPICS ──
    topics = [
        {"subject": "Operating Systems", "topic_name": "Memory Management", "keywords": ["paging", "segmentation", "virtual memory", "page replacement"]},
        {"subject": "Data Structures", "topic_name": "Sorting Algorithms", "keywords": ["bubble sort", "merge sort", "quick sort", "heap sort"]},
        {"subject": "DBMS", "topic_name": "Normalization", "keywords": ["1NF", "2NF", "3NF", "BCNF", "normal form"]},
    ]
    await db["topics"].insert_many(topics)
    print(f"📌 Created {len(topics)} topics")

    # ── RESOURCES ──
    now = datetime.now(timezone.utc).isoformat()
    resources = [
        {
            "title": "OS Scheduling Algorithms — Complete Notes",
            "subject": "Operating Systems",
            "topic": "Process Scheduling",
            "description": "Comprehensive notes covering FCFS, SJF, Round Robin, and Priority scheduling with examples and Gantt charts.",
            "file_path": "sample_os_scheduling.pdf",
            "file_type": "pdf",
            "uploaded_by": faculty_id,
            "created_at": now,
            "ai_summary": "These notes cover CPU scheduling algorithms including First-Come-First-Served (FCFS), Shortest Job First (SJF), Round Robin, and Priority Scheduling. Each algorithm is explained with examples, Gantt charts, and calculations for average waiting time and turnaround time.",
        },
               {
            "title": "DBMS Normalization — Lecture Slides",
            "subject": "DBMS",
            "topic": "Normalization",
            "description": "Lecture slides covering 1NF, 2NF, 3NF, and BCNF with examples and practice problems.",
            "file_path": "normalization_slides.pdf",
            "file_type": "slides",
            "uploaded_by": faculty_id,
            "created_at": now,
            "ai_summary": "Lecture slides on database normalization from 1NF through BCNF. Covers functional dependencies, decomposition techniques, and includes worked examples showing step-by-step normalization of sample tables.",
        },
        {
            "title": "Sorting Algorithms — Python Lab Manual",
            "subject": "Data Structures",
            "topic": "Sorting Algorithms",
            "description": "Lab manual with Python implementations of Bubble Sort, Selection Sort, Merge Sort, Quick Sort, and Heap Sort.",
            "file_path": "sorting_lab.py",
            "file_type": "lab_manual",
            "uploaded_by": faculty_id,
            "created_at": now,
            "ai_summary": "Python lab manual implementing five sorting algorithms. Each algorithm includes the implementation, time complexity analysis (best, average, worst case), space complexity, and example outputs.",
        },
    ]
    await db["resources"].insert_many(resources)
    print(f"📚 Created {len(resources)} sample resources")

    # ── SEARCH LOGS ──
    searches = [
        {"query": "scheduling algorithms", "user_id": "", "timestamp": now},
        {"query": "linked list implementation", "user_id": "", "timestamp": now},
        {"query": "normalization", "user_id": "", "timestamp": now},
        {"query": "binary search tree", "user_id": "", "timestamp": now},
        {"query": "virtual memory", "user_id": "", "timestamp": now},
    ]
    await db["search_logs"].insert_many(searches)
    print(f"🔍 Created {len(searches)} sample search logs")

    print("\n✅ Database seeded successfully!")
    print("\n📋 Sample login credentials:")
    print("   Faculty:  pande@avcoe.org / faculty123")
    print("   Student:  sumit@gmail.com / student123")
    print("   Admin:    admin@avcoe.org / admin123")

    client.close()


if __name__ == "__main__":
    asyncio.run(seed())

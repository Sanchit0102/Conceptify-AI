"""
Authentication routes — register and login.
"""
from fastapi import APIRouter, HTTPException, status
from app.models.user import UserCreate, UserLogin, UserResponse, TokenResponse
from app.services.auth_service import hash_password, verify_password, create_access_token
from app.database import users_collection
from bson import ObjectId
from datetime import datetime

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
async def register(user_data: UserCreate):
    """Register a new user account."""
    # Check if email already exists
    existing = await users_collection.find_one({"email": user_data.email})
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email already exists",
        )

    # Create user document
    user_dict = {
        "name": user_data.name,
        "email": user_data.email,
        "password": hash_password(user_data.password),
        "role": user_data.role.value,
        "department": user_data.department,
        "class_name": user_data.class_name,
        "roll_number": user_data.roll_number,
        "created_at": datetime.utcnow()
    }
    result = await users_collection.insert_one(user_dict)
    user_id = str(result.inserted_id)

    # Generate JWT
    token = create_access_token(data={"sub": user_id, "role": user_data.role.value, "class_name": user_data.class_name, "roll_number": user_data.roll_number})

    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": user_id,
            "name": user_data.name,
            "email": user_data.email,
            "role": user_data.role,
            "department": user_data.department,
            "class_name": user_data.class_name,
            "roll_number": user_data.roll_number
        }
    }


@router.post("/login", response_model=TokenResponse)
async def login(credentials: UserLogin):
    """Log in with email and password."""
    user = await users_collection.find_one({"email": credentials.email})
    if not user or not verify_password(credentials.password, user["password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    user_id = str(user["_id"])
    token = create_access_token(data={"sub": user_id, "role": user["role"], "class_name": user.get("class_name"), "roll_number": user.get("roll_number")})

    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": str(user["_id"]),
            "name": user["name"],
            "email": user["email"],
            "role": user["role"],
            "department": user.get("department", "AI & DS"),
            "class_name": user.get("class_name"),
            "roll_number": user.get("roll_number")
        }
    }

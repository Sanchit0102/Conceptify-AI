"""
AI Department Knowledge & Lab Resource Hub — FastAPI Application.
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from app.config import settings
from app.routes import auth, resources, ai, search, dashboard

app = FastAPI(
    title="AI Department Knowledge & Lab Resource Hub",
    description="Intelligent academic assistant for students and faculty — "
                "access department notes, lab experiments, AI-powered search & summaries.",
    version="1.0.0",
)

# CORS — allow frontend dev server
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:3000",
        "https://dorotha-cylindraceous-unorthographically.ngrok-free.dev"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount uploads directory for serving files
settings.upload_path.mkdir(parents=True, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=str(settings.upload_path)), name="uploads")

# Register routers
app.include_router(auth.router)
app.include_router(resources.router)
app.include_router(ai.router)
app.include_router(search.router)
app.include_router(dashboard.router)


@app.get("/", tags=["Health"])
async def root():
    return {
        "name": "AI Department Knowledge & Lab Resource Hub",
        "version": "1.0.0",
        "status": "running",
        "docs": "/docs",
    }


@app.get("/health", tags=["Health"])
async def health_check():
    return {"status": "healthy"}

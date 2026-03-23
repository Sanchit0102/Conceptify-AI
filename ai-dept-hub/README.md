# AI Department Knowledge & Lab Resource Hub

An intelligent full-stack academic assistant where students access department notes, PDFs, lab experiments, code examples, and AI-powered search & summaries. Faculty upload and manage resources through a dedicated dashboard.

## Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 18 + Vite |
| **Backend** | Python FastAPI (async) |
| **Database** | MongoDB (via Motor async driver) |
| **Vector DB** | ChromaDB |
| **AI** | LangChain + Google Gemini |
| **Auth** | JWT (python-jose + bcrypt) |

---

## Features

- **Knowledge Hub** — Browse/search PDFs, slides, lab manuals, code files, question papers
- **Smart Lab Resource Hub** — Lab experiments with syntax-highlighted code viewer
- **AI Doubt Assistant** — RAG-powered Q&A from department knowledge base
- **Smart Search** — Semantic (ChromaDB embeddings) + text search combined
- **Error & Debug Helper** — Paste code, get AI analysis, corrected code, and explanations
- **Faculty Dashboard** — Upload resources, manage topics, view analytics

---

## Quick Start

### Prerequisites

- **Python 3.10+**
- **Node.js 18+**
- **MongoDB** running on `localhost:27017`

### 1. Backend Setup

```bash
cd ai-dept-hub/backend

# Create virtual environment
python -m venv venv
venv\Scripts\activate        # Windows
# source venv/bin/activate   # macOS/Linux

# Install dependencies
pip install -r requirements.txt

# Configure environment
# Edit .env and set your GEMINI_API_KEY
```

### 2. Seed Sample Data

```bash
cd ai-dept-hub/backend
python seed_data.py
```

### 3. Start Backend

```bash
cd ai-dept-hub/backend
uvicorn app.main:app --reload --port 8000
```

API docs available at `http://localhost:8000/docs`

### 4. Frontend Setup

```bash
cd ai-dept-hub/frontend

npm install
npm run dev
```

Open `http://localhost:5173`

---

## Sample Credentials

| Role | Email | Password |
|---|---|---|
| Faculty | sarah@university.edu | faculty123 |
| Student | alice@student.edu | student123 |
| Admin | admin@university.edu | admin123 |

---

## API Endpoints

### Authentication
- `POST /auth/register` — Create account
- `POST /auth/login` — Get JWT token

### Resources
- `POST /resources/upload` — Upload file (faculty only)
- `GET /resources` — List all resources
- `GET /resources/search?q=` — Text search
- `GET /resources/{id}` — Get by ID

### AI Services
- `POST /ai/ask` — RAG-powered Q&A
- `POST /ai/summarize` — Summarize resource or text
- `POST /ai/debug` — Analyze & debug code

### Search
- `GET /search?q=` — Unified semantic + text search

### Faculty Dashboard
- `GET /dashboard/analytics` — Get analytics
- `POST /topics/create` — Create topic
- `GET /topics` — List topics

---

## Project Structure

```
ai-dept-hub/
├── backend/
│   ├── app/
│   │   ├── main.py           # FastAPI app entry
│   │   ├── config.py         # Settings from .env
│   │   ├── database.py       # MongoDB async client
│   │   ├── models/           # Pydantic schemas
│   │   ├── routes/           # API endpoint handlers
│   │   ├── services/         # Business logic
│   │   ├── ai/               # AI modules (RAG, vector store, summarizer, debugger)
│   │   └── utils/            # JWT deps, PDF extractor
│   ├── uploads/              # Uploaded files
│   ├── vector_store/         # ChromaDB storage
│   ├── seed_data.py          # Sample data seeder
│   ├── requirements.txt
│   └── .env
│
└── frontend/
    ├── src/
    │   ├── App.jsx           # Router + layout
    │   ├── api.js            # Axios API service
    │   ├── context/          # Auth context
    │   ├── pages/            # 8 page components
    │   ├── components/       # Reusable UI components
    │   └── styles/           # Global CSS (dark theme)
    ├── index.html
    ├── vite.config.js
    └── package.json
```

---

## Environment Variables

Set in `backend/.env`:

```env
MONGO_URL=mongodb://localhost:27017
DB_NAME=ai_dept_hub
SECRET_KEY=your-secret-key
GEMINI_API_KEY=your-gemini-api-key   # Required for AI features
```

---

## Deployment

### Production Build (Frontend)

```bash
cd frontend
npm run build
# Output in dist/ — serve with any static file server
```

### Production Run (Backend)

```bash
uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 4
```

For production, use a process manager like **Gunicorn** with Uvicorn workers, and serve the frontend via **Nginx** reverse proxy.

---

## 🚀 Deployment Guide
For a step-by-step guide on how to deploy this project on **Render**, see [RENDER_DEPLOYMENT.md](./RENDER_DEPLOYMENT.md).

# 🚀 How to Deploy on Render (Simple Guide)

Follow these steps to put your project online using Render.

---

## 1. Prepare your Database (MongoDB)
Render does not provide a free MongoDB. You should use **MongoDB Atlas** (Free Tier):
1.  Create an account at [mongodb.com](https://www.mongodb.com/).
2.  Create a "Shared Cluster" (FREE).
3.  Go to **Database Access** and create a user (remember the username and password).
4.  Go to **Network Access** and "Allow Access from Anywhere" (IP: `0.0.0.0/0`).
5.  Click **Connect** -> **Drivers** -> Copy the **Connection String**.
    *   Example: `mongodb+srv://<username>:<password>@cluster0.abcde.mongodb.net/?retryWrites=true&w=majority`

---

## 2. Deploy the Backend (Python FastAPI)

1.  Push your code to **GitHub**.
2.  Login to [Render.com](https://render.com/).
3.  Click **New +** -> **Web Service**.
4.  Connect your GitHub repository.
5.  **Settings**:
    *   **Name**: `ai-dept-backend`
    *   **Root Directory**: `backend` (Important!)
    *   **Runtime**: `Python 3`
    *   **Build Command**: `pip install -r requirements.txt`
    *   **Start Command**: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
6.  **Environment Variables**:
    Click "Advanced" and add these:
    *   `MONGO_URL`: (Paste your MongoDB Atlas string from Step 1)
    *   `DB_NAME`: `ai_dept_hub`
    *   `SECRET_KEY`: (Any random string like `mysecret123`)
    *   `GEMINI_API_KEY`: (Your Google AI key)
7.  Click **Create Web Service**.
8.  **Wait for it to finish.** Once it says "Live", copy the URL (e.g., `https://ai-dept-backend.onrender.com`).

---

## 3. Update Frontend to point to Backend
Before deploying the frontend, you **MUST** change where it looks for the backend.

1.  Open `frontend/src/api.js`.
2.  Change line 6:
    *   **Old**: `const API_BASE = 'http://localhost:8000';`
    *   **New**: `const API_BASE = 'https://your-backend-url.onrender.com';` (The URL you copied in Step 2)
3.  Save and push this change to GitHub.

---

## 4. Deploy the Frontend (React Vite)

1.  On [Render.com](https://render.com/), click **New +** -> **Static Site**.
2.  Connect the same GitHub repository.
3.  **Settings**:
    *   **Name**: `ai-dept-frontend`
    *   **Root Directory**: `frontend` (Important!)
    *   **Build Command**: `npm run build`
    *   **Publish Directory**: `dist`
4.  Click **Create Static Site**.
5.  Copy your frontend URL once it's live (e.g., `https://ai-dept-frontend.onrender.com`).

---

## 5. Final Step: Fix CORS (Security)
The backend needs to know it's allowed to talk to your new frontend.

1.  Go back to your code and open `backend/app/main.py`.
2.  Find the `allow_origins=` section.
3.  Add your new frontend URL to the list:
    ```python
    allow_origins=[
        "http://localhost:5173",
        "https://your-frontend-url.onrender.com"  # Add this!
    ],
    ```
4.  Push this change to GitHub. Render will automatically update your backend.

---

### ✅ You're Done!
Your site will now be live at your frontend URL. 🚀

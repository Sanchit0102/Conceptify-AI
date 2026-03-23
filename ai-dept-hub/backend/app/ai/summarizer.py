"""
AI Summarization service using Google Gemini via LangChain.
"""
from app.config import settings

_llm = None


def get_llm():
    global _llm
    if _llm is None:
        if not settings.GEMINI_API_KEY:
            return None
        from langchain_google_genai import ChatGoogleGenerativeAI
        _llm = ChatGoogleGenerativeAI(
            model="gemini-2.5-flash",
            google_api_key=settings.GEMINI_API_KEY,
            temperature=0.3,
        )
    return _llm


async def summarize_text(text: str, max_length: int = 500) -> str:
    """Generate an AI summary of the given text."""
    llm = get_llm()
    if llm is None:
        return "AI summarization unavailable — GEMINI_API_KEY not set."

    # Truncate input if very long
    truncated = text[:8000] if len(text) > 8000 else text

    prompt = f"""You are an academic assistant. Summarize the following educational content 
in a clear, concise manner suitable for university students. 
Keep the summary under {max_length} words. Focus on key concepts, definitions, and important points.

CONTENT:
{truncated}

SUMMARY:"""

    try:
        response = await llm.ainvoke(prompt)
        return response.content.strip()
    except Exception as e:
        return f"Summarization error: {str(e)}"

"""
RAG (Retrieval-Augmented Generation) pipeline.
Retrieves relevant chunks from ChromaDB, augments the prompt, and generates an answer via Gemini.
"""
from app.ai.vectorstore import search as vector_search
from app.ai.summarizer import get_llm


async def answer_question(question: str) -> dict:
    """Answer a question using RAG — retrieve relevant docs then generate an answer."""
    # Step 1: Retrieve relevant document chunks
    retrieved = vector_search(question, n_results=5)

    context_parts = []
    sources = []
    seen_ids = set()
    for item in retrieved:
        context_parts.append(item["text"])
        meta = item.get("metadata", {})
        res_id = meta.get("resource_id", "")
        title = meta.get("title", "")
        if title and res_id not in seen_ids:
            sources.append({
                "title": title,
                "subject": meta.get("subject", ""),
                "resource_id": res_id,
            })
            if res_id:
                seen_ids.add(res_id)

    context = "\n\n---\n\n".join(context_parts) if context_parts else ""

    # Step 2: Generate answer with LLM
    llm = get_llm()
    if llm is None:
        return {
            "answer": "AI assistant unavailable — GEMINI_API_KEY not set.",
            "sources": sources,
            "context_used": bool(context),
        }

    if context:
        prompt = f"""You are an AI academic assistant for a university department. 
Answer the student's question using ONLY the provided context from department resources.
If the context doesn't contain enough information, say so and provide general guidance.
Be detailed, clear, and educational in your response.

DEPARTMENT RESOURCES CONTEXT:
{context}

STUDENT'S QUESTION:
{question}

ANSWER:"""
    else:
        prompt = f"""You are an AI academic assistant for a university department.
The student asked a question but no matching department resources were found.
Provide a helpful, educational answer based on your general knowledge.
Mention that dedicated department resources were not found for this topic.

STUDENT'S QUESTION:
{question}

ANSWER:"""

    try:
        response = await llm.ainvoke(prompt)
        return {
            "answer": response.content.strip(),
            "sources": sources,
            "context_used": bool(context),
        }
    except Exception as e:
        return {
            "answer": f"Error generating answer: {str(e)}",
            "sources": sources,
            "context_used": bool(context),
        }

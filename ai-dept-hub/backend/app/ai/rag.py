"""
RAG (Retrieval-Augmented Generation) pipeline.
Retrieves relevant chunks from ChromaDB, augments the prompt, and generates an answer via Gemini.
"""
from app.ai.vectorstore import search as vector_search
from app.ai.summarizer import get_llm


async def answer_question(question: str, resource_only: bool = False) -> dict:
    """Answer a question using RAG — retrieve relevant docs then generate an answer.
    
    Args:
        question: The student's question.
        resource_only: If True, answer ONLY from faculty resources (for Conceptify Assist).
                       If False, fall back to general knowledge (for AI Chat).
    """
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
        if resource_only:
            # Conceptify Assist mode: answer STRICTLY from department resources
            prompt = f"""You are an AI academic assistant for a university department.
Answer the student's question using ONLY the provided department resources below.
Do NOT use any external or general knowledge. Your answer must be based entirely on the context provided.

### STRICT FORMATTING RULES:
1. **COMPARISON RULE**: For "compare/differentiate" questions, you MUST use a 3-column table:
   | Factor / Basis | Item A | Item B |
   | -------------- | ------ | ------ |
   | ...            | ...    | ...    |
2. **DIAGRAM RULE**: For complex concepts, include a Mermaid diagram (```mermaid ... ```).
   - **CRITICAL**: Always use double quotes for node labels: `A["Label Text"]` to avoid syntax errors.
3. Be professional, concise, and educational.

### DEPARTMENT RESOURCES CONTEXT:
{context}

### STUDENT'S QUESTION:
{question}

ANSWER (Markdown, based ONLY on the above resources):"""
        else:
            # AI Chat mode: use resources + fill gaps with general knowledge
            prompt = f"""You are an AI academic assistant for a university department. 
Answer the student's question clearly. Use the provided department resources as primary sources.
If resources are missing or incomplete, use your general knowledge to fill gaps **seamlessly** (no disclaimers).

### STRICT FORMATTING RULES:
1. **COMPARISON RULE**: For "compare/differentiate" questions, you MUST use a 3-column table:
   | Factor / Basis | Item A | Item B |
   | -------------- | ------ | ------ |
   | ...            | ...    | ...    |
2. **DIAGRAM RULE**: For complex concepts, include a Mermaid diagram (```mermaid ... ```). 
   - **CRITICAL**: Always use double quotes for node labels: `A["Label Text"]` to avoid syntax errors.
   - Use simple flowcharts or class diagrams.
3. Be professional, concise, and educational.

### DEPARTMENT RESOURCES CONTEXT:
{context}

### STUDENT'S QUESTION:
{question}

ANSWER (Markdown):"""
    else:
        if resource_only:
            # Conceptify Assist with no matching resources
            return {
                "answer": "⚠️ No matching resources found in the department Knowledge Hub for this question. Please ask your faculty to upload relevant materials.",
                "sources": [],
                "context_used": False,
            }
        else:
            # AI Chat fallback to general knowledge
            prompt = f"""You are an AI academic assistant for a university department.
Provide a high-quality, educational answer based on your general academic knowledge. 
Do NOT mention that resources were not found.

### STRICT FORMATTING RULES:
1. **COMPARISON RULE**: For "compare/differentiate" questions, you MUST use a 3-column table:
   | Factor / Basis | Item A | Item B |
   | -------------- | ------ | ------ |
   | ...            | ...    | ...    |
2. **DIAGRAM RULE**: Always include a Mermaid diagram (```mermaid ... ```) for visual learning.
   - **CRITICAL**: Always use double quotes for node labels: `A["Label Text"]` to avoid syntax errors.
3. Be professional and concise.

### STUDENT'S QUESTION:
{question}

ANSWER (Markdown):"""

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

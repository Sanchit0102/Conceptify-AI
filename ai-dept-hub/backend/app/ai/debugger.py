"""
AI Code Debugger — analyzes code, detects errors, suggests fixes.
"""
from app.ai.summarizer import get_llm


async def debug_code(code: str, language: str = "python") -> dict:
    """Analyze code for errors and provide fixes using Gemini."""
    llm = get_llm()
    if llm is None:
        return {
            "errors": ["AI debugging unavailable — GEMINI_API_KEY not set."],
            "corrected_code": code,
            "explanation": "AI service not configured.",
        }

    prompt = f"""You are an expert programming instructor and debugger.
Analyze the following {language} code thoroughly and provide a fixed version.

FORMATTING RULES FOR CORRECTED CODE:
1. Include **simple and basic comments** directly in the code to explain the logic.
2. IMPORTANT: Append `// @FIX` (or `# @FIX` for Python) strictly to the end of any line that was corrected, changed, or added.
3. Keep the code clean and well-indented.

FORMATTING RULES FOR EXPLANATION:
1. Provide **simple reasoning** for the fixes.
2. Avoid deep details or long descriptions.
3. Use a clear, bulleted list.

Respond in EXACTLY this format (use these exact headers):

## ERRORS FOUND
- List each error or issue found (syntax, logic, runtime).
- If no errors, say "No errors found".

## CORRECTED CODE
```{language}
// Put the corrected version of the code here
```

## EXPLANATION
- Simple, concise reasoning for each fix.

CODE TO ANALYZE:
```{language}
{code}
```"""

    try:
        response = await llm.ainvoke(prompt)
        result = parse_debug_response(response.content, code, language)
        return result
    except Exception as e:
        return {
            "errors": [f"Debug analysis error: {str(e)}"],
            "corrected_code": code,
            "explanation": "An error occurred during analysis.",
        }


def parse_debug_response(response_text: str, original_code: str, language: str) -> dict:
    """Parse the structured debug response from the LLM."""
    errors = []
    corrected_code = original_code
    explanation = ""

    sections = response_text.split("## ")

    for section in sections:
        section = section.strip()
        if section.upper().startswith("ERRORS FOUND"):
            lines = section.split("\n")[1:]
            for line in lines:
                line = line.strip().lstrip("- ").strip()
                if line and line.lower() != "no errors found":
                    errors.append(line)

        elif section.upper().startswith("CORRECTED CODE"):
            # Extract code block
            content = section.split("\n", 1)[1] if "\n" in section else ""
            if f"```{language}" in content:
                start = content.index(f"```{language}") + len(f"```{language}")
                end = content.index("```", start) if "```" in content[start:] else len(content)
                corrected_code = content[start:end].strip()
            elif "```" in content:
                start = content.index("```") + 3
                # Skip language identifier on same line
                if "\n" in content[start:]:
                    start = content.index("\n", start) + 1
                end_pos = content.find("```", start)
                if end_pos > start:
                    corrected_code = content[start:end_pos].strip()

        elif section.upper().startswith("EXPLANATION"):
            explanation = section.split("\n", 1)[1].strip() if "\n" in section else ""

    if not errors:
        errors = ["No errors found"]

    return {
        "errors": errors,
        "corrected_code": corrected_code,
        "explanation": explanation or "Analysis complete.",
    }

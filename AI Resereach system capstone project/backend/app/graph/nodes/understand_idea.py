import json
from backend.app.services.llm import groq_complete
from backend.app.graph.state import ResearchState

UNDERSTAND_PROMPT = {
    "research": """You are analyzing an existing company for research purposes.
Input: {input_text}

Return ONLY a JSON object, no preamble:
{{
  "subject_name": "official company name",
  "industry": "primary industry/sector",
  "context_summary": "2-3 sentence neutral summary of what this company does and why it's being researched"
}}""",
    "idea_validation": """You are analyzing a startup idea for validation purposes.
Input: {input_text}

Return ONLY a JSON object, no preamble:
{{
  "subject_name": "short label for the idea (3-6 words)",
  "industry": "the industry/sector this idea would compete in",
  "context_summary": "2-3 sentence neutral restatement of the idea, its target user, and the core value proposition"
}}"""
}

def understand_idea(state: ResearchState) -> dict:
    mode = state["mode"]
    prompt = UNDERSTAND_PROMPT[mode].format(input_text=state["input_text"])

    raw = groq_complete(prompt, temperature=0)
    parsed = json.loads(raw)

    return {
        "subject_name": parsed["subject_name"],
        "industry": parsed["industry"],
        "context_summary": parsed["context_summary"],
    }
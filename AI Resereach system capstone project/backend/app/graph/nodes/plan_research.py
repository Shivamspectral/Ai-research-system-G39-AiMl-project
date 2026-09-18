import json
from backend.app.services.llm import groq_complete
from backend.app.graph.state import ResearchState

FOCUS_AREAS = {
    "research": ["company_overview", "market_position", "competitors", "financial_health", "funding_history", "risks"],
    "idea_validation": ["market_size", "target_audience", "competitors", "differentiation", "feasibility", "risks"],
}

PLAN_PROMPT = """You are planning research for a {mode} task.

Subject: {subject_name}
Industry: {industry}
Context: {context_summary}

Generate 6-10 specific, searchable research subquestions covering these focus areas: {focus_areas}

Return ONLY a JSON object, no preamble:
{{
  "subquestions": ["...", "..."]
}}"""

def plan_research(state: ResearchState) -> dict:
    mode = state["mode"]
    focus_areas = FOCUS_AREAS[mode]

    prompt = PLAN_PROMPT.format(
        mode=mode,
        subject_name=state["subject_name"],
        industry=state["industry"],
        context_summary=state["context_summary"],
        focus_areas=", ".join(focus_areas),
    )

    raw = groq_complete(prompt, temperature=0.3)
    parsed = json.loads(raw)

    return {
        "plan": {
            "subquestions": parsed["subquestions"],
            "focus_areas": focus_areas,
        }
    }
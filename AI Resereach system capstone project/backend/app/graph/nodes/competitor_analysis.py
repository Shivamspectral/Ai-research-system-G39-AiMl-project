import json
from backend.app.services.llm import groq_complete
from backend.app.graph.state import ResearchState

PROMPT = """Analyze competitors based on verified claims for this {mode} research.

Subject: {subject_name}
Industry: {industry}

Relevant claims:
{claims_block}

Return ONLY a JSON object, no preamble:
{{
  "key_competitors": ["name1", "name2"],
  "competitive_positioning": "2-3 sentences on how the subject compares",
  "competitive_risks": ["..."]
}}"""

def competitor_analysis(state: ResearchState) -> dict:
    claims = [c for c in state["verified_claims"] if c["category"] == "competitor"]
    claims_block = "\n".join(f"- {c['claim_text']} (confidence: {c['confidence_score']:.2f})" for c in claims)

    if not claims_block:
        return {"competitor_analysis": {"key_competitors": [], "competitive_positioning": "Insufficient data", "competitive_risks": []}}

    prompt = PROMPT.format(
        mode=state["mode"],
        subject_name=state["subject_name"],
        industry=state["industry"],
        claims_block=claims_block,
    )
    raw = groq_complete(prompt, temperature=0.2)
    return {"competitor_analysis": json.loads(raw)}
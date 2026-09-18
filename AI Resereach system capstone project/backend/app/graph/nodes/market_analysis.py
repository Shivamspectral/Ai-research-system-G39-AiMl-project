import json
from backend.app.services.llm import groq_complete
from backend.app.graph.state import ResearchState

PROMPT = """Analyze market conditions based on verified claims for this {mode} research.

Subject: {subject_name}
Industry: {industry}

Relevant claims:
{claims_block}

Return ONLY a JSON object, no preamble:
{{
  "market_size_summary": "2-3 sentences",
  "growth_trends": "2-3 sentences",
  "target_audience": "1-2 sentences"
}}"""

def market_analysis(state: ResearchState) -> dict:
    claims = [c for c in state["verified_claims"] if c["category"] in ("market", "financial", "funding")]
    claims_block = "\n".join(f"- {c['claim_text']} (confidence: {c['confidence_score']:.2f})" for c in claims)

    if not claims_block:
        return {"market_analysis": {"market_size_summary": "Insufficient data", "growth_trends": "Insufficient data", "target_audience": "Insufficient data"}}

    prompt = PROMPT.format(
        mode=state["mode"],
        subject_name=state["subject_name"],
        industry=state["industry"],
        claims_block=claims_block,
    )
    raw = groq_complete(prompt, temperature=0.2)
    return {"market_analysis": json.loads(raw)}
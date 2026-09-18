import json
from backend.app.services.llm import groq_complete
from backend.app.graph.state import ResearchState

PROMPT = """Identify gaps and opportunities for this {mode} research.

Subject: {subject_name}
Context: {context_summary}

Competitor analysis:
{competitor_analysis}

Market analysis:
{market_analysis}

Return ONLY a JSON object, no preamble:
{{
  "opportunities": ["..."],
  "unmet_needs": ["..."],
  "key_risks": ["..."]
}}"""

def gap_analysis(state: ResearchState) -> dict:
    prompt = PROMPT.format(
        mode=state["mode"],
        subject_name=state["subject_name"],
        context_summary=state["context_summary"],
        competitor_analysis=json.dumps(state["competitor_analysis"]),
        market_analysis=json.dumps(state["market_analysis"]),
    )
    raw = groq_complete(prompt, temperature=0.3)
    return {"gap_analysis": json.loads(raw)}
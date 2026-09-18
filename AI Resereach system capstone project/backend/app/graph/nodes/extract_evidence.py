import json
from backend.app.services.llm import groq_complete
from backend.app.graph.state import ResearchState

EXTRACT_PROMPT = """You are extracting factual claims from a single search result for {mode} research on: {subject_name} ({industry}).

Source title: {title}
Source URL: {url}
Source content:
{content}

Extract 1-4 specific, verifiable claims from this content that are relevant to the research.
For each claim assign a category (e.g. "market", "competitor", "financial", "funding", "risk")
and a confidence_score from 0.0-1.0 reflecting how well-supported/specific the claim is in this text.

Return ONLY a JSON object, no preamble:
{{
  "claims": [
    {{"claim_text": "...", "category": "...", "confidence_score": 0.0}}
  ]
}}
If nothing relevant is found, return {{"claims": []}}."""


def extract_evidence(state: ResearchState) -> dict:
    search_results = state["search_results"]
    all_claims = []

    for result in search_results:
        prompt = EXTRACT_PROMPT.format(
            mode=state["mode"],
            subject_name=state["subject_name"],
            industry=state["industry"],
            title=result.get("title", ""),
            url=result.get("url", ""),
            content=result.get("content", "")[:1500],
        )

        try:
            raw = groq_complete(prompt, temperature=0.1)
            parsed = json.loads(raw)
            extracted = parsed.get("claims", [])
        except (json.JSONDecodeError, KeyError, TypeError):
            # skip malformed LLM output for this single result rather than
            # failing the whole extraction step
            continue

        for claim in extracted:
            try:
                all_claims.append({
                    "claim_text": claim["claim_text"],
                    "category": claim["category"],
                    "confidence_score": float(claim["confidence_score"]),
                    "source_url": result.get("url", ""),
                    "query": result.get("query", ""),
                })
            except (KeyError, ValueError, TypeError):
                # skip individual malformed claims, keep the rest
                continue

    return {"claims": all_claims}

from backend.app.graph.state import ResearchState

def generate_report(state: ResearchState) -> dict:
    claims = state["verified_claims"] or []
    overall_confidence = (
        sum(c["confidence_score"] for c in claims) / len(claims) if claims else 0.0
    )

    report = {
        "subject_name": state["subject_name"],
        "mode": state["mode"],
        "industry": state["industry"],
        "context_summary": state["context_summary"],
        "competitor_analysis": state["competitor_analysis"],
        "market_analysis": state["market_analysis"],
        "gap_analysis": state["gap_analysis"],
        "evidence": [
            {
                "claim": c["claim_text"],
                "category": c["category"],
                "source": c["source_url"],
                "confidence": c["confidence_score"],
            }
            for c in claims
        ],
        "iterations_run": state["iteration"] + 1,
    }

    return {"report": report, "overall_confidence": round(overall_confidence, 3)}
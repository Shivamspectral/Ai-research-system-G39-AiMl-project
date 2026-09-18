from backend.app.services.tavily_client import tavily_search
from backend.app.graph.state import ResearchState

def search(state: ResearchState) -> dict:
    subquestions = state["plan"]["subquestions"]

    # on re-research loops, only re-search flagged gaps, not everything
    if state["iteration"] > 0 and state.get("low_confidence_flags"):
        queries = state["low_confidence_flags"]
    else:
        queries = subquestions

    all_results = []
    for query in queries:
        results = tavily_search(query, max_results=5)
        for r in results:
            r["query"] = query  # tag which subquestion this came from
        all_results.extend(results)

    return {"search_results": all_results}
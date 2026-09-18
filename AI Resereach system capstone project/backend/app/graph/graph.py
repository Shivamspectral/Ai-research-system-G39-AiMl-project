from langgraph.graph import StateGraph, END
from backend.app.graph.state import ResearchState

from backend.app.graph.nodes.understand_idea import understand_idea
from backend.app.graph.nodes.plan_research import plan_research
from backend.app.graph.nodes.search import search
from backend.app.graph.nodes.extract_evidence import extract_evidence
from backend.app.graph.nodes.verify_evidence import verify_evidence
from backend.app.graph.nodes.competitor_analysis import competitor_analysis
from backend.app.graph.nodes.market_analysis import market_analysis
from backend.app.graph.nodes.gap_analysis import gap_analysis
from backend.app.graph.nodes.generate_report import generate_report

# --- conditional edge: loop back to search if verification flags gaps ---

def should_reresearch(state: ResearchState) -> str:
    if state["low_confidence_flags"] and state["iteration"] < state["max_iterations"]:
        return "search"
    return "competitor_analysis"

def bump_iteration(state: ResearchState) -> dict:
    return {"iteration": state["iteration"] + 1}

# --- build graph ---

def build_graph():
    workflow = StateGraph(ResearchState)

    workflow.add_node("understand_idea", understand_idea)
    workflow.add_node("plan_research", plan_research)
    workflow.add_node("search", search)
    workflow.add_node("extract_evidence", extract_evidence)
    workflow.add_node("verify_evidence", verify_evidence)
    workflow.add_node("bump_iteration", bump_iteration)
    workflow.add_node("competitor_analysis", competitor_analysis)
    workflow.add_node("market_analysis", market_analysis)
    workflow.add_node("gap_analysis", gap_analysis)
    workflow.add_node("generate_report", generate_report)

    workflow.set_entry_point("understand_idea")
    workflow.add_edge("understand_idea", "plan_research")
    workflow.add_edge("plan_research", "search")
    workflow.add_edge("search", "extract_evidence")
    workflow.add_edge("extract_evidence", "verify_evidence")

    workflow.add_conditional_edges(
        "verify_evidence",
        should_reresearch,
        {"search": "bump_iteration", "competitor_analysis": "competitor_analysis"},
    )
    workflow.add_edge("bump_iteration", "search")

    workflow.add_edge("competitor_analysis", "market_analysis")
    workflow.add_edge("market_analysis", "gap_analysis")
    workflow.add_edge("gap_analysis", "generate_report")
    workflow.add_edge("generate_report", END)

    return workflow.compile()
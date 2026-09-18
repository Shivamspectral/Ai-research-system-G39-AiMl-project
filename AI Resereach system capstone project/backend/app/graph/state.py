from typing import TypedDict, Literal, Optional
from typing_extensions import Annotated
import operator

Mode = Literal["research", "idea_validation"]

class ResearchPlan(TypedDict):
    subquestions: list[str]
    focus_areas: list[str]  # e.g. ["market_size", "competitors", "funding", "risks"]

class ExtractedClaim(TypedDict):
    claim_text: str
    category: str          # e.g. "market", "competitor", "financial", "risk"
    source_url: str
    confidence_score: float
    query: str              # the subquestion this claim's source result was tagged with

class ResearchState(TypedDict):
    # input
    research_job_id: str
    mode: Mode
    input_text: str                    # raw user input: company name OR idea description

    # understand_idea output
    subject_name: Optional[str]        # company name, or a short idea label
    industry: Optional[str]
    context_summary: Optional[str]     # normalized description of what we're researching

    # plan_research output
    plan: Optional[ResearchPlan]

    # search + extraction (accumulate across loop iterations)
    search_results: Annotated[list[dict], operator.add]
    claims: Annotated[list[ExtractedClaim], operator.add]

    # verification
    verified_claims: Optional[list[ExtractedClaim]]
    low_confidence_flags: Optional[list[str]]   # subquestions that need re-research

    # analysis stage outputs
    competitor_analysis: Optional[dict]
    market_analysis: Optional[dict]
    gap_analysis: Optional[dict]

    # control flow
    iteration: int
    max_iterations: int

    # final
    report: Optional[dict]
    overall_confidence: Optional[float]
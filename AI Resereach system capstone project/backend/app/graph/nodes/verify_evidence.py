import json
from backend.app.services.llm import gemini_complete
from backend.app.graph.state import ResearchState

CONFIDENCE_THRESHOLD = 0.55

# Claims are batched into a single Gemini call instead of one call per claim.
# Each claim is tagged with its list index so the model's response can be
# matched back to the right claim even if it drops or reorders entries.
VERIFY_PROMPT = """You are independently verifying a batch of research claims.

For EACH claim below, judge whether it seems plausible, specific, and
well-supported for its category, and assign it a verified_confidence score
from 0.0 to 1.0.

Claims:
{claims_block}

Return ONLY a JSON array, no preamble, with exactly one object per claim,
using its index:
[{{"index": 0, "verified_confidence": 0.0, "reasoning": "one short sentence"}}, ...]"""


def _build_claims_block(claims: list[dict]) -> str:
    lines = []
    for i, claim in enumerate(claims):
        lines.append(
            f"[{i}] Claim: {claim['claim_text']}\n"
            f"    Category: {claim['category']}\n"
            f"    Source: {claim['source_url']}"
        )
    return "\n".join(lines)


def _verify_batch(claims: list[dict]) -> dict[int, float]:
    """Returns {claim_index: verified_confidence} for whatever the model
    actually returned. Missing indices are the caller's responsibility to
    fall back on - this never raises."""
    if not claims:
        return {}

    prompt = VERIFY_PROMPT.format(claims_block=_build_claims_block(claims))
    try:
        raw = gemini_complete(prompt, temperature=0)
        parsed = json.loads(raw)
        results = {}
        for entry in parsed:
            idx = int(entry["index"])
            results[idx] = float(entry["verified_confidence"])
        return results
    except Exception:
        # covers malformed JSON AND actual Gemini failures (rate limit,
        # quota exhausted, network error, etc.) - degrade to extraction
        # confidence for the whole batch rather than killing the run
        return {}


def verify_evidence(state: ResearchState) -> dict:
    claims = state["claims"]
    plan = state["plan"]

    verified_scores = _verify_batch(claims)

    verified_claims = []
    for i, claim in enumerate(claims):
        # fall back to this claim's own extraction confidence if the batch
        # call failed entirely, or the model omitted/mangled this index
        verified_confidence = verified_scores.get(i, claim["confidence_score"])

        # blend extraction confidence with independent verification
        final_confidence = (claim["confidence_score"] + verified_confidence) / 2
        verified_claims.append({**claim, "confidence_score": final_confidence})

    # figure out which subquestions are under-covered, matching claims back
    # to the subquestion whose search produced their source (via the `query`
    # tag threaded through from search -> extract_evidence), instead of a
    # crude/unreliable substring match against the claim text itself
    low_confidence_flags = []
    for subq in plan["subquestions"]:
        related = [c for c in verified_claims if c.get("query") == subq]
        if not related or max(c["confidence_score"] for c in related) < CONFIDENCE_THRESHOLD:
            low_confidence_flags.append(subq)

    return {
        "verified_claims": verified_claims,
        "low_confidence_flags": low_confidence_flags,
    }

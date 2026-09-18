"""
Real end-to-end test — hits actual Groq, Tavily, and Gemini APIs, and writes
to your live Supabase DB. Costs real API calls every time you run it.

Run with:
    pytest backend/tests/test_e2e_pipeline.py -v -s
"""
import time
import requests
import pytest

BASE_URL = "http://localhost:8000/api"
POLL_INTERVAL_SECONDS = 3
MAX_WAIT_SECONDS = 900  # 5 min ceiling for the whole run


def test_full_research_pipeline():
    # 1. Kick off a research job
    resp = requests.post(
        f"{BASE_URL}/research",
        json={"mode": "research", "input_text": "Notion"},
    )
    assert resp.status_code == 200, f"job creation failed: {resp.text}"
    body = resp.json()
    job_id = body["research_job_id"]
    assert body["status"] == "pending"
    print(f"\n[job created] {job_id}")

    # 2. Stream the run, collect node events, grab the final report_id
    report_id = None
    seen_nodes = []
    start = time.monotonic()

    with requests.get(f"{BASE_URL}/research/{job_id}/stream", stream=True, timeout=MAX_WAIT_SECONDS) as stream_resp:
        assert stream_resp.status_code == 200
        for line in stream_resp.iter_lines(decode_unicode=True):
            if not line or not line.startswith("data: "):
                continue
            if time.monotonic() - start > MAX_WAIT_SECONDS:
                pytest.fail("pipeline did not finish within MAX_WAIT_SECONDS")

            payload = line[len("data: "):]
            print(f"[stream] {payload}")

            if '"node": "error"' in payload:
                pytest.fail(f"pipeline reported an error: {payload}")

            if '"report_id"' in payload:
                import json
                event = json.loads(payload)
                report_id = event["report_id"]
                break

            import json
            event = json.loads(payload)
            seen_nodes.append(event.get("node"))

    assert report_id is not None, "stream ended without a report_id"

    # 3. Confirm all 9 graph nodes actually ran at least once
    expected_nodes = {
        "understand_idea", "plan_research", "search", "extract_evidence",
        "verify_evidence", "competitor_analysis", "market_analysis",
        "gap_analysis", "generate_report",
    }
    missing = expected_nodes - set(seen_nodes)
    assert not missing, f"these nodes never ran: {missing}"

    # 4. Fetch the finished report and sanity-check its shape
    report_resp = requests.get(f"{BASE_URL}/reports/{report_id}")
    assert report_resp.status_code == 200, f"report fetch failed: {report_resp.text}"
    report = report_resp.json()

    assert report["research_job_id"] == job_id
    assert 0.0 <= report["overall_confidence"] <= 1.0

    content = report["content"]
    for key in ("subject_name", "mode", "industry", "context_summary",
                "competitor_analysis", "market_analysis", "gap_analysis",
                "evidence", "iterations_run"):
        assert key in content, f"report missing expected key: {key}"

    assert len(content["evidence"]) > 0, "report has zero evidence claims — extraction/verification likely failed silently"

    print(f"\n[PASS] report_id={report_id} confidence={report['overall_confidence']} claims={len(content['evidence'])}")
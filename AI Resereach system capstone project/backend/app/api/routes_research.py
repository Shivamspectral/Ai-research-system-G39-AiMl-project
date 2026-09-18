import json
from backend.app.models.source import Source
from backend.app.models.claim import Claim
from backend.app.services.embeddings import embed_text
from backend.app.core.logging import get_logger
import uuid
from fastapi import APIRouter, HTTPException, Depends
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from backend.app.db.session import get_db, SessionLocal
from backend.app.models.research_job import ResearchJob
from backend.app.models.report import Report
from backend.app.graph.graph import build_graph
from backend.app.graph.state import ResearchState
from backend.app.schemas.research import ResearchRequest, ResearchResponse, ResearchStatusResponse
from backend.app.schemas.report import ReportResponse

router = APIRouter()
graph = build_graph()  # compile once at module load, reuse across requests
logger = get_logger(__name__)


def make_initial_state(job_id: str, mode: str, input_text: str) -> ResearchState:
    return {
        "research_job_id": job_id,
        "mode": mode,
        "input_text": input_text,
        "subject_name": None,
        "industry": None,
        "context_summary": None,
        "plan": None,
        "search_results": [],
        "claims": [],
        "verified_claims": None,
        "low_confidence_flags": None,
        "competitor_analysis": None,
        "market_analysis": None,
        "gap_analysis": None,
        "iteration": 0,
        "max_iterations": 2,
        "report": None,
        "overall_confidence": None,
    }


@router.post("/research", response_model=ResearchResponse)
def start_research(payload: ResearchRequest, db: Session = Depends(get_db)):
    job_id = str(uuid.uuid4())
    job = ResearchJob(id=job_id, mode=payload.mode, input_text=payload.input_text, status="pending")
    db.add(job)
    db.commit()

    logger.info(f"research job created | job_id={job_id} mode={payload.mode}")
    return ResearchResponse(research_job_id=job_id, status="pending")


@router.get("/research/{job_id}/status", response_model=ResearchStatusResponse)
def get_research_status(job_id: str, db: Session = Depends(get_db)):
    job = db.query(ResearchJob).filter_by(id=job_id).first()
    if not job:
        raise HTTPException(404, "research job not found")

    report_id = None
    if job.status == "completed":
        report = db.query(Report).filter_by(research_job_id=job_id).first()
        if report:
            report_id = str(report.id)

    return ResearchStatusResponse(status=job.status, report_id=report_id)


@router.get("/research/{job_id}/stream")
def stream_research(job_id: str, db: Session = Depends(get_db)):
    job = db.query(ResearchJob).filter_by(id=job_id).first()
    if not job:
        raise HTTPException(404, "research job not found")

    def event_generator():
        # The request-scoped `db` session (from Depends(get_db)) gets closed as
        # soon as this endpoint function returns the StreamingResponse, which
        # happens well before this generator finishes running (the graph run
        # takes 1-3 min). Open a dedicated session that lives for the whole
        # stream instead of reusing the closed request-scoped one.
        stream_db = SessionLocal()
        try:
            stream_job = stream_db.query(ResearchJob).filter_by(id=job_id).first()

            # Guard against re-running the whole pipeline on stream reconnect.
            # The browser's EventSource auto-reconnects to this same URL after
            # any dropped connection (network blip, server error, page
            # refresh) - without this check, a reconnect would silently
            # restart the entire graph from understand_idea, burning LLM/
            # search calls a second time for a job that's already done or
            # already running server-side.
            if stream_job.status == "completed":
                report = stream_db.query(Report).filter_by(research_job_id=job_id).first()
                if report:
                    yield f"data: {json.dumps({'node': 'done', 'report_id': str(report.id)})}\n\n"
                else:
                    yield f"data: {json.dumps({'node': 'error', 'message': 'Job is marked completed but no report was found.'})}\n\n"
                return

            if stream_job.status == "running":
                yield f"data: {json.dumps({'node': 'error', 'message': 'This research job is already running - please wait for it to finish rather than reconnecting.'})}\n\n"
                return

            stream_job.status = "running"
            stream_db.commit()
            logger.info(f"research job started | job_id={job_id}")

            state = make_initial_state(job_id, stream_job.mode, stream_job.input_text)
            # graph.stream() only yields each node's own returned delta, not
            # the full accumulated state - so we merge deltas ourselves to
            # have the complete state available once generate_report runs.
            full_state = dict(state)

            try:
                for step in graph.stream(state):
                    node_name = list(step.keys())[0]
                    full_state.update(step[node_name])
                    logger.info(f"node complete | job_id={job_id} node={node_name}")
                    yield f"data: {json.dumps({'node': node_name, 'status': 'complete'})}\n\n"

                    if node_name == "generate_report":
                        final_state = full_state
                        report = Report(
                            id=str(uuid.uuid4()),
                            research_job_id=job_id,
                            full_content=final_state["report"],
                            overall_confidence=final_state["overall_confidence"],
                        )
                        stream_db.add(report)
                        # Flush immediately: Report/Claim have no declared
                        # relationship(), so SQLAlchemy's unit-of-work has no
                        # way to know Claim depends on Report and can batch
                        # all Claim inserts ahead of the Report insert,
                        # violating the claims_report_id_fkey constraint.
                        # Flushing forces the Report row to exist in the DB
                        # before any Claim references it.
                        stream_db.flush()

                        source_ids_by_url = {}
                        for claim in final_state["verified_claims"]:
                            url = claim["source_url"]
                            if url not in source_ids_by_url:
                                source = Source(
                                    id=str(uuid.uuid4()),
                                    url=url,
                                    source_tier="unverified",
                                )
                                stream_db.add(source)
                                stream_db.flush()  # same reason as above, for claims_source_id_fkey
                                source_ids_by_url[url] = source.id

                            # Embeddings disabled - Gemini project access is
                            # denied at the project level (not fixable by
                            # rotating the API key), and retrying it here was
                            # burning 4+ minutes per run on calls guaranteed
                            # to fail. Claim.embedding is nullable, so this
                            # just means claims are saved without a vector
                            # until Gemini access is sorted out separately.
                            claim_embedding = None

                            claim_row = Claim(
                                id=str(uuid.uuid4()),
                                report_id=report.id,
                                source_id=source_ids_by_url[url],
                                claim_text=claim["claim_text"],
                                category=claim["category"],
                                confidence_score=claim["confidence_score"],
                                embedding=claim_embedding,
                            )
                            stream_db.add(claim_row)

                        stream_job.status = "completed"
                        stream_db.commit()
                        logger.info(f"research job completed | job_id={job_id} report_id={report.id} claims={len(final_state['verified_claims'])}")
                        yield f"data: {json.dumps({'node': 'done', 'report_id': str(report.id)})}\n\n"

            except Exception as e:
                # A failed flush/commit leaves the session unusable until it's
                # rolled back - committing again without this first raises a
                # *new*, unhandled PendingRollbackError that kills the whole
                # stream before the error event below ever gets sent.
                stream_db.rollback()
                stream_job.status = "failed"
                stream_db.commit()
                logger.error(f"research job failed | job_id={job_id} error={e}")
                yield f"data: {json.dumps({'node': 'error', 'message': str(e)})}\n\n"
        finally:
            stream_db.close()

    return StreamingResponse(event_generator(), media_type="text/event-stream")


@router.get("/reports/{report_id}", response_model=ReportResponse)
def get_report(report_id: str, db: Session = Depends(get_db)):
    report = db.query(Report).filter_by(id=report_id).first()
    if not report:
        raise HTTPException(404, "report not found")

    return ReportResponse(
        id=str(report.id),
        research_job_id=str(report.research_job_id),
        content=report.full_content,
        overall_confidence=report.overall_confidence,
    )

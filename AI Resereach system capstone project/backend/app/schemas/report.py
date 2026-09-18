from pydantic import BaseModel

class ReportResponse(BaseModel):
    id: str
    research_job_id: str
    content: dict
    overall_confidence: float
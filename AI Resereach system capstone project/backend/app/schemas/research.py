from typing import Literal
from pydantic import BaseModel, Field

class ResearchRequest(BaseModel):
    mode: Literal["research", "idea_validation"]
    input_text: str = Field(min_length=1, max_length=2000)

class ResearchResponse(BaseModel):
    research_job_id: str
    status: str

class ResearchStatusResponse(BaseModel):
    status: str
    report_id: str | None = None

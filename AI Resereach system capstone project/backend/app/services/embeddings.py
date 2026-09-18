import google.generativeai as genai
from backend.app.core.config import settings
from backend.app.services.rate_limiter import gemini_bucket

genai.configure(api_key=settings.GEMINI_API_KEY)

def embed_text(text: str) -> list[float]:
    gemini_bucket.take()
    result = genai.embed_content(
        model="models/gemini-embedding-001",
        content=text,
        task_type="retrieval_document",
        output_dimensionality=768,  # matches Vector(768) column in Claim model
    )
    return result["embedding"]

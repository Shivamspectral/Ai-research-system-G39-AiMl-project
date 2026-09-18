from groq import Groq
import google.generativeai as genai
from backend.app.core.config import settings
from backend.app.services.rate_limiter import groq_bucket, gemini_bucket

_client = Groq(api_key=settings.GROQ_API_KEY)

def groq_complete(prompt: str, temperature: float = 0.0, model: str = "openai/gpt-oss-120b") -> str:
    groq_bucket.take()
    response = _client.chat.completions.create(
        model=model,
        messages=[{"role": "user", "content": prompt}],
        temperature=temperature,
    )
    return response.choices[0].message.content.strip()

genai.configure(api_key=settings.GEMINI_API_KEY)

def gemini_complete(prompt: str, temperature: float = 0.0) -> str:
    gemini_bucket.take()
    model = genai.GenerativeModel("gemini-2.0-flash")
    response = model.generate_content(
        prompt,
        generation_config={"temperature": temperature},
    )
    return response.text.strip()
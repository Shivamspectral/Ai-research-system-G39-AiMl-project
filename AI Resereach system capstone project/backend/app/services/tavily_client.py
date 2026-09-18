from tavily import TavilyClient
from backend.app.core.config import settings
from backend.app.services.rate_limiter import tavily_bucket
from backend.app.services.cache import get_cached, set_cached

_client = TavilyClient(api_key=settings.TAVILY_API_KEY)

def tavily_search(query: str, max_results: int = 5) -> list[dict]:
    """Returns list of {url, title, content, score, published_date}"""
    cached = get_cached(query)
    if cached is not None:
        return cached

    tavily_bucket.take()
    response = _client.search(
        query=query,
        search_depth="advanced",
        max_results=max_results,
        include_answer=False,
    )
    results = [
        {
            "url": r["url"],
            "title": r["title"],
            "content": r["content"],
            "score": r.get("score", 0.0),
        }
        for r in response.get("results", [])
    ]
    set_cached(query, results)
    return results
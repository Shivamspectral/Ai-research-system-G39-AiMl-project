import time
import threading

_cache: dict[str, tuple[float, list[dict]]] = {}
_lock = threading.Lock()
TTL_SECONDS = 3600  # 1 hour


def get_cached(query: str) -> list[dict] | None:
    with _lock:
        entry = _cache.get(query)
        if entry is None:
            return None
        timestamp, results = entry
        if time.monotonic() - timestamp > TTL_SECONDS:
            del _cache[query]
            return None
        return results


def set_cached(query: str, results: list[dict]) -> None:
    with _lock:
        _cache[query] = (time.monotonic(), results)
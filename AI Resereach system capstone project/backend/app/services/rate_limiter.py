import time
import threading

class TokenBucket:
    def __init__(self, rate_per_minute: float):
        self.capacity = rate_per_minute
        self.tokens = rate_per_minute
        self.refill_rate = rate_per_minute / 60.0  # tokens per second
        self.last_refill = time.monotonic()
        self.lock = threading.Lock()

    def take(self):
        with self.lock:
            now = time.monotonic()
            elapsed = now - self.last_refill
            self.tokens = min(self.capacity, self.tokens + elapsed * self.refill_rate)
            self.last_refill = now

            if self.tokens < 1:
                wait_time = (1 - self.tokens) / self.refill_rate
                time.sleep(wait_time)
                self.tokens = 0
                self.last_refill = time.monotonic()
            else:
                self.tokens -= 1


# Adjust these to match your actual free-tier limits per provider.
groq_bucket = TokenBucket(rate_per_minute=30)
gemini_bucket = TokenBucket(rate_per_minute=15)
tavily_bucket = TokenBucket(rate_per_minute=20)
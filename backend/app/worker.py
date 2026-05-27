import os
from celery import Celery

redis_url = os.getenv("REDIS_URL", "redis://redis:6379/0")
celery = Celery(
    "worker",
    broker=redis_url,
    backend=redis_url
)

@celery.task(name="test_task")
def test_task():
    return "Celery is working"

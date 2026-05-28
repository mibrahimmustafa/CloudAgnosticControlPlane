import pytest
from app import worker

def test_celery_worker_task():
    # Calling the task function directly through the module to avoid pytest auto-collection
    result = worker.test_task()
    assert result == "Celery is working"

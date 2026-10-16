from datetime import datetime, timezone
import pytest
from fastapi.testclient import TestClient

from app.config import settings
from app.database import Base, SessionLocal, engine
from app.main import app
from app.models import Subtask, Task
from app.schemas import (
    SubtaskCreate,
    SubtaskResponse,
    SubtaskUpdate,
    TaskCreate,
    TaskResponse,
    TaskUpdate,
)


@pytest.fixture(scope="module", autouse=True)
def setup_database():
    """Ensure database schema is created before tests run, and clean up after."""
    Base.metadata.create_all(bind=engine)
    yield
    # Clean up test rows
    db = SessionLocal()
    try:
        db.query(Subtask).delete()
        db.query(Task).delete()
        db.commit()
    finally:
        db.close()


def test_config_defaults():
    assert "postgresql://" in settings.DATABASE_URL
    assert settings.FRONTEND_URL == "http://localhost:5173"


def test_schemas_validation():
    # Subtask schemas
    sub_in = SubtaskCreate(title="Complete unit tests")
    assert sub_in.title == "Complete unit tests"
    assert sub_in.completed is False

    sub_up = SubtaskUpdate(completed=True)
    assert sub_up.completed is True
    assert sub_up.title is None

    # Task schemas
    task_in = TaskCreate(
        title="Launch backend",
        description="Set up FastAPI and PostgreSQL",
        status="todo",
        priority="high",
        tags=["backend", "fastapi"],
        estimated_minutes=60,
        subtasks=[sub_in],
    )
    assert task_in.title == "Launch backend"
    assert task_in.tags == ["backend", "fastapi"]
    assert len(task_in.subtasks) == 1
    assert task_in.subtasks[0].title == "Complete unit tests"

    # Task update schema
    task_up = TaskUpdate(status="in_progress", actual_minutes=30)
    assert task_up.status == "in_progress"
    assert task_up.actual_minutes == 30
    assert task_up.title is None


def test_postgresql_models_crud_and_cascade():
    db = SessionLocal()
    try:
        # Create Task
        new_task = Task(
            title="Deploy Do-It API",
            description="Production deployment with PostgreSQL",
            status="todo",
            priority="urgent",
            tags=["devops", "postgres"],
            estimated_minutes=120,
            actual_minutes=15,
            due_date=datetime.now(timezone.utc),
        )
        db.add(new_task)
        db.commit()
        db.refresh(new_task)

        assert new_task.id is not None
        assert new_task.tags == ["devops", "postgres"]
        assert new_task.created_at is not None
        assert new_task.updated_at is not None

        # Add Subtasks
        subtask1 = Subtask(task_id=new_task.id, title="Configure env variables", completed=True)
        subtask2 = Subtask(task_id=new_task.id, title="Run migrations", completed=False)
        db.add_all([subtask1, subtask2])
        db.commit()
        db.refresh(new_task)

        assert len(new_task.subtasks) == 2
        assert new_task.subtasks[0].title == "Configure env variables"
        assert new_task.subtasks[0].completed is True

        # Test Pydantic serialization from ORM attributes
        response_model = TaskResponse.model_validate(new_task)
        assert response_model.id == new_task.id
        assert response_model.title == "Deploy Do-It API"
        assert len(response_model.subtasks) == 2
        assert response_model.tags == ["devops", "postgres"]

        # Test cascading delete
        task_id = new_task.id
        db.delete(new_task)
        db.commit()

        # Task and subtasks should be deleted
        assert db.query(Task).filter(Task.id == task_id).first() is None
        orphaned_subtasks = db.query(Subtask).filter(Subtask.task_id == task_id).all()
        assert len(orphaned_subtasks) == 0

    finally:
        db.close()


def test_health_endpoint():
    with TestClient(app) as client:
        response = client.get("/health")
        assert response.status_code == 200
        assert response.json() == {"status": "ok", "app": "Do-It"}


def test_cors_headers():
    with TestClient(app) as client:
        headers = {
            "Origin": "http://localhost:5173",
            "Access-Control-Request-Method": "GET",
        }
        response = client.options("/health", headers=headers)
        assert response.headers.get("access-control-allow-origin") == "http://localhost:5173"
        assert response.headers.get("access-control-allow-credentials") == "true"

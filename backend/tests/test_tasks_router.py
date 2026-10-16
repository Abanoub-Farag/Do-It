import pytest
from fastapi.testclient import TestClient

from app.database import Base, SessionLocal, engine
from app.main import app
from app.models import Subtask, Task


@pytest.fixture(autouse=True)
def clean_database():
    """Ensure database schema is fresh and clean between tests."""
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        db.query(Subtask).delete()
        db.query(Task).delete()
        db.commit()
    finally:
        db.close()
    yield
    db = SessionLocal()
    try:
        db.query(Subtask).delete()
        db.query(Task).delete()
        db.commit()
    finally:
        db.close()


def test_create_and_get_task():
    client = TestClient(app)
    payload = {
        "title": "Build CRUD API",
        "description": "Implement task routes in FastAPI",
        "status": "todo",
        "priority": "high",
        "tags": ["backend", "fastapi", "mvp"],
        "estimated_minutes": 90,
        "actual_minutes": 0,
        "subtasks": [
            {"title": "Write crud.py", "completed": True},
            {"title": "Write routers/tasks.py", "completed": False},
        ],
    }

    # Create task
    response = client.post("/api/tasks", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert data["title"] == "Build CRUD API"
    assert data["status"] == "todo"
    assert data["priority"] == "high"
    assert data["tags"] == ["backend", "fastapi", "mvp"]
    assert len(data["subtasks"]) == 2
    assert data["subtasks"][0]["title"] == "Write crud.py"
    assert data["subtasks"][0]["completed"] is True
    task_id = data["id"]

    # Get single task
    get_res = client.get(f"/api/tasks/{task_id}")
    assert get_res.status_code == 200
    get_data = get_res.json()
    assert get_data["id"] == task_id
    assert get_data["title"] == "Build CRUD API"
    assert len(get_data["subtasks"]) == 2


def test_list_tasks_and_filters():
    client = TestClient(app)

    # Seed 3 tasks
    client.post("/api/tasks", json={
        "title": "Frontend Setup",
        "description": "Initialize Vite React",
        "status": "in_progress",
        "priority": "medium",
        "tags": ["frontend", "react"],
    })
    client.post("/api/tasks", json={
        "title": "Backend Setup",
        "description": "Set up FastAPI and Postgres",
        "status": "done",
        "priority": "urgent",
        "tags": ["backend", "database"],
    })
    client.post("/api/tasks", json={
        "title": "Write Documentation",
        "description": "Document API endpoints and architecture",
        "status": "todo",
        "priority": "low",
        "tags": ["docs"],
    })

    # List all
    all_res = client.get("/api/tasks")
    assert all_res.status_code == 200
    assert len(all_res.json()) == 3

    # Filter by status
    status_res = client.get("/api/tasks?status=done")
    assert status_res.status_code == 200
    assert len(status_res.json()) == 1
    assert status_res.json()[0]["title"] == "Backend Setup"

    # Filter by priority
    priority_res = client.get("/api/tasks?priority=medium")
    assert priority_res.status_code == 200
    assert len(priority_res.json()) == 1
    assert priority_res.json()[0]["title"] == "Frontend Setup"

    # Filter by tag
    tag_res = client.get("/api/tasks?tag=database")
    assert tag_res.status_code == 200
    assert len(tag_res.json()) == 1
    assert tag_res.json()[0]["title"] == "Backend Setup"

    # Search filter (case-insensitive substring in title or description)
    search_res = client.get("/api/tasks?search=documentation")
    assert search_res.status_code == 200
    assert len(search_res.json()) == 1
    assert search_res.json()[0]["title"] == "Write Documentation"

    # Search in description
    search_desc_res = client.get("/api/tasks?search=fastapi")
    assert search_desc_res.status_code == 200
    assert len(search_desc_res.json()) == 1
    assert search_desc_res.json()[0]["title"] == "Backend Setup"

    # Pagination
    page_res = client.get("/api/tasks?skip=1&limit=1")
    assert page_res.status_code == 200
    assert len(page_res.json()) == 1


def test_update_and_delete_task():
    client = TestClient(app)

    # Create task
    create_res = client.post("/api/tasks", json={"title": "Refactor router"})
    task_id = create_res.json()["id"]

    # Partial update
    patch_res = client.patch(f"/api/tasks/{task_id}", json={
        "status": "in_progress",
        "priority": "urgent",
        "actual_minutes": 45,
    })
    assert patch_res.status_code == 200
    updated = patch_res.json()
    assert updated["status"] == "in_progress"
    assert updated["priority"] == "urgent"
    assert updated["actual_minutes"] == 45
    assert updated["title"] == "Refactor router"

    # Delete task
    del_res = client.delete(f"/api/tasks/{task_id}")
    assert del_res.status_code == 204

    # Verify 404 after deletion
    get_res = client.get(f"/api/tasks/{task_id}")
    assert get_res.status_code == 404


def test_subtask_endpoints():
    client = TestClient(app)

    # Create parent task
    create_res = client.post("/api/tasks", json={"title": "Parent Task"})
    task_id = create_res.json()["id"]

    # Add subtask
    sub_res = client.post(f"/api/tasks/{task_id}/subtasks", json={
        "title": "Subtask 1",
        "completed": False,
    })
    assert sub_res.status_code == 201
    sub_data = sub_res.json()
    assert sub_data["title"] == "Subtask 1"
    assert sub_data["completed"] is False
    assert sub_data["task_id"] == task_id
    subtask_id = sub_data["id"]

    # Update subtask
    patch_res = client.patch(
        f"/api/tasks/{task_id}/subtasks/{subtask_id}",
        json={"completed": True, "title": "Subtask 1 (completed)"},
    )
    assert patch_res.status_code == 200
    assert patch_res.json()["completed"] is True
    assert patch_res.json()["title"] == "Subtask 1 (completed)"

    # Verify task includes updated subtask
    task_res = client.get(f"/api/tasks/{task_id}")
    assert len(task_res.json()["subtasks"]) == 1
    assert task_res.json()["subtasks"][0]["completed"] is True

    # Delete subtask
    del_res = client.delete(f"/api/tasks/{task_id}/subtasks/{subtask_id}")
    assert del_res.status_code == 204

    # Verify subtask is removed from task
    task_after_del = client.get(f"/api/tasks/{task_id}")
    assert len(task_after_del.json()["subtasks"]) == 0


def test_error_handling_404():
    client = TestClient(app)

    # Non-existent task operations
    assert client.get("/api/tasks/999999").status_code == 404
    assert client.patch("/api/tasks/999999", json={"title": "X"}).status_code == 404
    assert client.delete("/api/tasks/999999").status_code == 404
    assert client.post("/api/tasks/999999/subtasks", json={"title": "Sub"}).status_code == 404

    # Create valid task
    t_res = client.post("/api/tasks", json={"title": "Valid Task"})
    valid_task_id = t_res.json()["id"]

    # Non-existent subtask operations
    assert client.patch(f"/api/tasks/{valid_task_id}/subtasks/999999", json={"completed": True}).status_code == 404
    assert client.delete(f"/api/tasks/{valid_task_id}/subtasks/999999").status_code == 404

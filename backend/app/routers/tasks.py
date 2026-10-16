from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from sqlalchemy.orm import Session

from app import crud, schemas
from app.database import get_db

router = APIRouter(prefix="/api/tasks", tags=["Tasks"])


# ---------------------------------------------------------
# Task Endpoints
# ---------------------------------------------------------

@router.get("", response_model=List[schemas.TaskResponse])
@router.get("/", response_model=List[schemas.TaskResponse], include_in_schema=False)
def list_tasks(
    status_filter: Optional[str] = Query(None, alias="status", description="Filter by status (todo, in_progress, done)"),
    priority_filter: Optional[str] = Query(None, alias="priority", description="Filter by priority (urgent, high, medium, low)"),
    tag: Optional[str] = Query(None, description="Filter tasks containing this tag"),
    search: Optional[str] = Query(None, description="Search term in title or description"),
    skip: int = Query(0, ge=0, description="Number of tasks to skip"),
    limit: int = Query(100, ge=1, le=100, description="Max number of tasks to return"),
    db: Session = Depends(get_db),
):
    """Retrieve tasks with optional status, priority, tag, search filters, and pagination."""
    return crud.get_tasks(
        db,
        status=status_filter,
        priority=priority_filter,
        tag=tag,
        search=search,
        skip=skip,
        limit=limit,
    )


@router.post("", response_model=schemas.TaskResponse, status_code=status.HTTP_201_CREATED)
@router.post("/", response_model=schemas.TaskResponse, status_code=status.HTTP_201_CREATED, include_in_schema=False)
def create_task(
    task_in: schemas.TaskCreate,
    db: Session = Depends(get_db),
):
    """Create a new task with optional initial subtasks."""
    return crud.create_task(db, task_in)


@router.get("/{task_id}", response_model=schemas.TaskResponse)
def get_task(
    task_id: int,
    db: Session = Depends(get_db),
):
    """Retrieve a single task and its subtasks by ID."""
    task = crud.get_task_by_id(db, task_id)
    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found",
        )
    return task


@router.patch("/{task_id}", response_model=schemas.TaskResponse)
def update_task(
    task_id: int,
    task_in: schemas.TaskUpdate,
    db: Session = Depends(get_db),
):
    """Partially update an existing task."""
    task = crud.get_task_by_id(db, task_id)
    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found",
        )
    return crud.update_task(db, task, task_in)


@router.delete("/{task_id}", status_code=status.HTTP_204_NO_CONTENT, response_class=Response)
def delete_task(
    task_id: int,
    db: Session = Depends(get_db),
):
    """Delete a task and its associated subtasks."""
    deleted = crud.delete_task(db, task_id)
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found",
        )
    return Response(status_code=status.HTTP_204_NO_CONTENT)


# ---------------------------------------------------------
# Subtask Endpoints
# ---------------------------------------------------------

@router.post(
    "/{task_id}/subtasks",
    response_model=schemas.SubtaskResponse,
    status_code=status.HTTP_201_CREATED,
)
def add_subtask(
    task_id: int,
    subtask_in: schemas.SubtaskCreate,
    db: Session = Depends(get_db),
):
    """Add a subtask to an existing task."""
    task = crud.get_task_by_id(db, task_id)
    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found",
        )
    return crud.create_subtask(db, task_id, subtask_in)


@router.patch(
    "/{task_id}/subtasks/{subtask_id}",
    response_model=schemas.SubtaskResponse,
)
def update_subtask(
    task_id: int,
    subtask_id: int,
    subtask_in: schemas.SubtaskUpdate,
    db: Session = Depends(get_db),
):
    """Update title or completion status of a subtask."""
    task = crud.get_task_by_id(db, task_id)
    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found",
        )
    subtask = crud.update_subtask(
        db,
        subtask_id=subtask_id,
        subtask_in=subtask_in,
        task_id=task_id,
    )
    if not subtask:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Subtask not found",
        )
    return subtask


@router.delete(
    "/{task_id}/subtasks/{subtask_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    response_class=Response,
)
def delete_subtask(
    task_id: int,
    subtask_id: int,
    db: Session = Depends(get_db),
):
    """Remove a subtask from a task."""
    task = crud.get_task_by_id(db, task_id)
    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found",
        )
    deleted = crud.delete_subtask(db, subtask_id=subtask_id, task_id=task_id)
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Subtask not found",
        )
    return Response(status_code=status.HTTP_204_NO_CONTENT)

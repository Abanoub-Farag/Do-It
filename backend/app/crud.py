from typing import List, Optional
from sqlalchemy import or_
from sqlalchemy.orm import Session, selectinload

from app import models, schemas


# ---------------------------------------------------------
# Task CRUD Operations
# ---------------------------------------------------------

def get_tasks(
    db: Session,
    status: Optional[str] = None,
    priority: Optional[str] = None,
    tag: Optional[str] = None,
    search: Optional[str] = None,
    skip: int = 0,
    limit: int = 100,
) -> List[models.Task]:
    """Retrieve tasks with optional filters, search, and pagination."""
    query = db.query(models.Task).options(selectinload(models.Task.subtasks))

    if status:
        query = query.filter(models.Task.status == status)
    if priority:
        query = query.filter(models.Task.priority == priority)
    if tag:
        query = query.filter(models.Task.tags.contains([tag]))
    if search:
        search_filter = f"%{search}%"
        query = query.filter(
            or_(
                models.Task.title.ilike(search_filter),
                models.Task.description.ilike(search_filter),
            )
        )

    return query.order_by(models.Task.created_at.desc()).offset(skip).limit(limit).all()


def get_task_by_id(db: Session, task_id: int) -> Optional[models.Task]:
    """Fetch a single task by ID, including its subtasks."""
    return (
        db.query(models.Task)
        .options(selectinload(models.Task.subtasks))
        .filter(models.Task.id == task_id)
        .first()
    )


def create_task(db: Session, task_in: schemas.TaskCreate) -> models.Task:
    """Create a new task with optional nested subtasks."""
    task_data = task_in.model_dump(exclude={"subtasks"})
    db_task = models.Task(**task_data)

    if task_in.subtasks:
        for subtask_in in task_in.subtasks:
            db_subtask = models.Subtask(**subtask_in.model_dump())
            db_task.subtasks.append(db_subtask)

    db.add(db_task)
    db.commit()
    db.refresh(db_task)
    return db_task


def update_task(
    db: Session,
    task: models.Task,
    task_in: schemas.TaskUpdate,
) -> models.Task:
    """Update only fields explicitly set in the request."""
    update_data = task_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(task, field, value)

    task.updated_at = models.utc_now()
    db.add(task)
    db.commit()
    db.refresh(task)
    return task


def delete_task(db: Session, task_id: int) -> bool:
    """Delete a task by ID. Cascades delete to subtasks."""
    task = get_task_by_id(db, task_id)
    if not task:
        return False
    db.delete(task)
    db.commit()
    return True


# ---------------------------------------------------------
# Subtask CRUD Operations
# ---------------------------------------------------------

def get_subtask_by_id(
    db: Session,
    subtask_id: int,
    task_id: Optional[int] = None,
) -> Optional[models.Subtask]:
    """Fetch a single subtask, optionally verifying its parent task ID."""
    query = db.query(models.Subtask).filter(models.Subtask.id == subtask_id)
    if task_id is not None:
        query = query.filter(models.Subtask.task_id == task_id)
    return query.first()


def create_subtask(
    db: Session,
    task_id: int,
    subtask_in: schemas.SubtaskCreate,
) -> Optional[models.Subtask]:
    """Add a subtask to an existing task."""
    task = get_task_by_id(db, task_id)
    if not task:
        return None

    db_subtask = models.Subtask(task_id=task_id, **subtask_in.model_dump())
    db.add(db_subtask)
    db.commit()
    db.refresh(db_subtask)
    return db_subtask


def update_subtask(
    db: Session,
    subtask_id: int,
    subtask_in: schemas.SubtaskUpdate,
    task_id: Optional[int] = None,
) -> Optional[models.Subtask]:
    """Update a subtask's status or title."""
    subtask = get_subtask_by_id(db, subtask_id=subtask_id, task_id=task_id)
    if not subtask:
        return None

    update_data = subtask_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(subtask, field, value)

    db.add(subtask)
    db.commit()
    db.refresh(subtask)
    return subtask


def delete_subtask(
    db: Session,
    subtask_id: int,
    task_id: Optional[int] = None,
) -> bool:
    """Delete a subtask, optionally verifying its parent task ID."""
    subtask = get_subtask_by_id(db, subtask_id=subtask_id, task_id=task_id)
    if not subtask:
        return False

    db.delete(subtask)
    db.commit()
    return True

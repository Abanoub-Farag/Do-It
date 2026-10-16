from datetime import datetime, timedelta, timezone
from typing import List, Optional
from sqlalchemy import func, or_
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


# ---------------------------------------------------------
# Analytics CRUD Operations
# ---------------------------------------------------------

def get_analytics_summary(db: Session) -> schemas.AnalyticsSummary:
    """Calculate daily productivity metrics, weekly breakdown, and streaks."""
    now = datetime.now(timezone.utc)
    today_start = datetime(now.year, now.month, now.day, 0, 0, 0, tzinfo=timezone.utc)
    today_end = today_start + timedelta(days=1)

    total_tasks = db.query(func.count(models.Task.id)).scalar() or 0
    completed_total = (
        db.query(func.count(models.Task.id))
        .filter(models.Task.status == "done")
        .scalar()
        or 0
    )

    completion_rate = (
        round((completed_total / total_tasks) * 100.0, 1) if total_tasks > 0 else 0.0
    )

    completed_today = (
        db.query(func.count(models.Task.id))
        .filter(
            models.Task.status == "done",
            models.Task.updated_at >= today_start,
            models.Task.updated_at < today_end,
        )
        .scalar()
        or 0
    )

    total_focus_minutes_today = (
        db.query(func.coalesce(func.sum(models.Task.actual_minutes), 0))
        .filter(
            models.Task.updated_at >= today_start,
            models.Task.updated_at < today_end,
        )
        .scalar()
        or 0
    )

    # Fetch tasks updated within the last 60 days to compute 7-day breakdown and streaks
    sixty_days_ago = today_start - timedelta(days=60)
    recent_tasks = (
        db.query(models.Task)
        .filter(models.Task.updated_at >= sixty_days_ago)
        .all()
    )

    date_completed: dict[str, int] = {}
    date_focus: dict[str, int] = {}
    for task in recent_tasks:
        if task.updated_at:
            dt = task.updated_at
            if dt.tzinfo is None:
                dt = dt.replace(tzinfo=timezone.utc)
            d_str = dt.astimezone(timezone.utc).strftime("%Y-%m-%d")
            if task.status == "done":
                date_completed[d_str] = date_completed.get(d_str, 0) + 1
            if task.actual_minutes > 0:
                date_focus[d_str] = date_focus.get(d_str, 0) + task.actual_minutes

    # Build weekly_activity for the last 7 days (ending today)
    weekly_activity: List[schemas.DailyActivity] = []
    for i in range(7):
        day_date = today_start - timedelta(days=6 - i)
        d_str = day_date.strftime("%Y-%m-%d")
        day_name = day_date.strftime("%a")
        weekly_activity.append(
            schemas.DailyActivity(
                date=d_str,
                day_name=day_name,
                completed_count=date_completed.get(d_str, 0),
                focus_minutes=date_focus.get(d_str, 0),
            )
        )

    # Calculate streak: consecutive days where at least 1 task was marked as completed
    streak = 0
    today_str = today_start.strftime("%Y-%m-%d")
    yesterday_str = (today_start - timedelta(days=1)).strftime("%Y-%m-%d")

    if date_completed.get(today_str, 0) > 0:
        start_offset = 0
    elif date_completed.get(yesterday_str, 0) > 0:
        start_offset = 1
    else:
        start_offset = -1

    if start_offset >= 0:
        curr_offset = start_offset
        while True:
            check_date = (today_start - timedelta(days=curr_offset)).strftime("%Y-%m-%d")
            if date_completed.get(check_date, 0) > 0:
                streak += 1
                curr_offset += 1
            else:
                break

    return schemas.AnalyticsSummary(
        total_tasks=total_tasks,
        completed_today=completed_today,
        total_focus_minutes_today=total_focus_minutes_today,
        completion_rate=completion_rate,
        current_streak_days=streak,
        weekly_activity=weekly_activity,
    )


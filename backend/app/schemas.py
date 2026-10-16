from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, ConfigDict, Field


# ---------------------------------------------------------
# Subtask Schemas
# ---------------------------------------------------------

class SubtaskBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=255)
    completed: bool = False


class SubtaskCreate(SubtaskBase):
    pass


class SubtaskUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=255)
    completed: Optional[bool] = None


class SubtaskResponse(SubtaskBase):
    id: int
    task_id: int

    model_config = ConfigDict(from_attributes=True)


# ---------------------------------------------------------
# Task Schemas
# ---------------------------------------------------------

class TaskBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    status: str = Field(default="todo", max_length=20)
    priority: str = Field(default="medium", max_length=20)
    due_date: Optional[datetime] = None
    tags: List[str] = Field(default_factory=list)
    estimated_minutes: Optional[int] = Field(default=None, ge=0)
    actual_minutes: int = Field(default=0, ge=0)

    model_config = ConfigDict(from_attributes=True)


class TaskCreate(TaskBase):
    subtasks: Optional[List[SubtaskCreate]] = Field(default_factory=list)


class TaskUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None
    status: Optional[str] = Field(None, max_length=20)
    priority: Optional[str] = Field(None, max_length=20)
    due_date: Optional[datetime] = None
    tags: Optional[List[str]] = None
    estimated_minutes: Optional[int] = Field(None, ge=0)
    actual_minutes: Optional[int] = Field(None, ge=0)


class TaskResponse(TaskBase):
    id: int
    created_at: datetime
    updated_at: datetime
    subtasks: List[SubtaskResponse] = Field(default_factory=list)

    model_config = ConfigDict(from_attributes=True)

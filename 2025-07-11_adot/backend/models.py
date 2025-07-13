from pydantic import BaseModel, Field, ConfigDict
from typing import Optional
from datetime import datetime
from enum import Enum


class TodoStatus(str, Enum):
    """Todo status enumeration"""
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"


class TodoBase(BaseModel):
    """Base todo model with common fields"""
    title: str = Field(..., min_length=1, max_length=100, description="Todo title")
    description: Optional[str] = Field(None, max_length=500, description="Todo description")
    status: TodoStatus = Field(default=TodoStatus.PENDING, description="Todo status")


class TodoCreate(TodoBase):
    """Model for creating a new todo"""
    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "title": "Complete project documentation",
                "description": "Write comprehensive documentation for the project",
                "status": "pending"
            }
        }
    )


class TodoUpdate(BaseModel):
    """Model for updating an existing todo"""
    title: Optional[str] = Field(None, min_length=1, max_length=100, description="Todo title")
    description: Optional[str] = Field(None, max_length=500, description="Todo description")
    status: Optional[TodoStatus] = Field(None, description="Todo status")
    
    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "title": "Updated project documentation",
                "description": "Updated comprehensive documentation for the project",
                "status": "in_progress"
            }
        }
    )


class Todo(TodoBase):
    """Complete todo model with all fields"""
    id: int = Field(..., description="Todo ID")
    created_at: datetime = Field(..., description="Creation timestamp")
    updated_at: datetime = Field(..., description="Last update timestamp")

    model_config = ConfigDict(
        from_attributes=True,
        json_schema_extra={
            "example": {
                "id": 1,
                "title": "Complete project documentation",
                "description": "Write comprehensive documentation for the project",
                "status": "pending",
                "created_at": "2025-07-11T12:00:00Z",
                "updated_at": "2025-07-11T12:00:00Z"
            }
        }
    )
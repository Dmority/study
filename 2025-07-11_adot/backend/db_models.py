from sqlalchemy import String, DateTime, Enum as SQLEnum
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column
from sqlalchemy.sql import func
from datetime import datetime
from models import TodoStatus


class Base(DeclarativeBase):
    """Base class for all database models"""
    pass


class TodoDB(Base):
    __tablename__ = "todos"
    
    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    title: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    description: Mapped[str | None] = mapped_column(String(500), nullable=True)
    status: Mapped[TodoStatus] = mapped_column(
        SQLEnum(TodoStatus), 
        nullable=False, 
        default=TodoStatus.PENDING
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), 
        server_default=func.now(), 
        nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), 
        server_default=func.now(), 
        onupdate=func.now(), 
        nullable=False
    )
    
    def __repr__(self) -> str:
        return f"<TodoDB(id={self.id}, title='{self.title}', status='{self.status}')>"
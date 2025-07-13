from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy import select, update, delete
from typing import List, Optional, AsyncGenerator
from contextlib import asynccontextmanager
from db_models import Base, TodoDB
from models import Todo, TodoCreate, TodoUpdate
from config import settings
import logging

logger = logging.getLogger(__name__)


class DatabaseManager:
    def __init__(self):
        self.engine = None
        self.async_session = None
        
    async def init_db(self):
        """Initialize database connection and create tables"""
        database_url = settings.get_database_url()
        logger.info(f"Connecting to database: {database_url.split('@')[0]}@***")
        
        self.engine = create_async_engine(
            database_url,
            echo=settings.debug,
            pool_pre_ping=True,
            pool_recycle=300,
            pool_size=5,
            max_overflow=10
        )
        
        self.async_session = async_sessionmaker(
            self.engine, 
            class_=AsyncSession, 
            expire_on_commit=False
        )
        
        # Create tables
        async with self.engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
    
    async def close(self):
        """Close database connection"""
        if self.engine:
            await self.engine.dispose()
    
    @asynccontextmanager
    async def get_session(self) -> AsyncGenerator[AsyncSession, None]:
        """Get database session"""
        if not self.async_session:
            await self.init_db()
        
        async with self.async_session() as session:
            try:
                yield session
            except Exception:
                await session.rollback()
                raise
            finally:
                await session.close()


class TodoDatabase:
    def __init__(self, db_manager: DatabaseManager):
        self.db_manager = db_manager
    
    async def create_todo(self, todo_data: TodoCreate) -> Todo:
        """Create a new todo"""
        async with self.db_manager.get_session() as session:
            db_todo = TodoDB(
                title=todo_data.title,
                description=todo_data.description,
                status=todo_data.status
            )
            session.add(db_todo)
            await session.commit()
            await session.refresh(db_todo)
            
            return Todo(
                id=db_todo.id,
                title=db_todo.title,
                description=db_todo.description,
                status=db_todo.status,
                created_at=db_todo.created_at,
                updated_at=db_todo.updated_at
            )
    
    async def get_todo(self, todo_id: int) -> Optional[Todo]:
        """Get a todo by ID"""
        async with self.db_manager.get_session() as session:
            result = await session.execute(select(TodoDB).where(TodoDB.id == todo_id))
            db_todo = result.scalar_one_or_none()
            
            if not db_todo:
                return None
            
            return Todo(
                id=db_todo.id,
                title=db_todo.title,
                description=db_todo.description,
                status=db_todo.status,
                created_at=db_todo.created_at,
                updated_at=db_todo.updated_at
            )
    
    async def get_todos(self) -> List[Todo]:
        """Get all todos"""
        async with self.db_manager.get_session() as session:
            result = await session.execute(select(TodoDB).order_by(TodoDB.created_at.desc()))
            db_todos = result.scalars().all()
            
            return [
                Todo(
                    id=db_todo.id,
                    title=db_todo.title,
                    description=db_todo.description,
                    status=db_todo.status,
                    created_at=db_todo.created_at,
                    updated_at=db_todo.updated_at
                )
                for db_todo in db_todos
            ]
    
    async def update_todo(self, todo_id: int, todo_data: TodoUpdate) -> Optional[Todo]:
        """Update a todo"""
        async with self.db_manager.get_session() as session:
            # Get current todo
            result = await session.execute(select(TodoDB).where(TodoDB.id == todo_id))
            db_todo = result.scalar_one_or_none()
            
            if not db_todo:
                return None
            
            # Update fields
            update_data = todo_data.model_dump(exclude_unset=True)
            if update_data:
                await session.execute(
                    update(TodoDB)
                    .where(TodoDB.id == todo_id)
                    .values(**update_data)
                )
                await session.commit()
                await session.refresh(db_todo)
            
            return Todo(
                id=db_todo.id,
                title=db_todo.title,
                description=db_todo.description,
                status=db_todo.status,
                created_at=db_todo.created_at,
                updated_at=db_todo.updated_at
            )
    
    async def delete_todo(self, todo_id: int) -> bool:
        """Delete a todo"""
        async with self.db_manager.get_session() as session:
            result = await session.execute(
                delete(TodoDB).where(TodoDB.id == todo_id)
            )
            await session.commit()
            return result.rowcount > 0


# Global database manager and todo database
db_manager = DatabaseManager()
todo_db = TodoDatabase(db_manager)
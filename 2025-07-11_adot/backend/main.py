from fastapi import FastAPI, HTTPException, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from typing import List
from models import Todo, TodoCreate, TodoUpdate
from database import todo_db, db_manager
from config import settings
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Manage application lifespan"""
    # Startup
    logger.info("Starting application...")
    await db_manager.init_db()
    logger.info("Database initialized successfully")
    yield
    # Shutdown
    logger.info("Shutting down application...")
    await db_manager.close()
    logger.info("Database connection closed")


app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    description="Todo application backend for ADOT study",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/", tags=["root"])
async def root():
    """Root endpoint"""
    return {"message": "Todo API is running", "database": "connected"}


@app.get("/health", tags=["health"])
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "database": "connected"}


@app.post("/todos", response_model=Todo, status_code=status.HTTP_201_CREATED, tags=["todos"])
async def create_todo(todo: TodoCreate):
    """Create a new todo item"""
    logger.info(f"Creating todo: {todo.title}")
    return await todo_db.create_todo(todo)


@app.get("/todos", response_model=List[Todo], tags=["todos"])
async def get_todos():
    """Get all todo items"""
    logger.info("Fetching all todos")
    return await todo_db.get_todos()


@app.get("/todos/{todo_id}", response_model=Todo, tags=["todos"])
async def get_todo(todo_id: int):
    """Get a specific todo item by ID"""
    logger.info(f"Fetching todo: {todo_id}")
    todo = await todo_db.get_todo(todo_id)
    if not todo:
        logger.warning(f"Todo not found: {todo_id}")
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, 
            detail=f"Todo with id {todo_id} not found"
        )
    return todo


@app.put("/todos/{todo_id}", response_model=Todo, tags=["todos"])
async def update_todo(todo_id: int, todo: TodoUpdate):
    """Update an existing todo item"""
    logger.info(f"Updating todo: {todo_id}")
    updated_todo = await todo_db.update_todo(todo_id, todo)
    if not updated_todo:
        logger.warning(f"Todo not found for update: {todo_id}")
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, 
            detail=f"Todo with id {todo_id} not found"
        )
    return updated_todo


@app.delete("/todos/{todo_id}", status_code=status.HTTP_204_NO_CONTENT, tags=["todos"])
async def delete_todo(todo_id: int):
    """Delete a todo item"""
    logger.info(f"Deleting todo: {todo_id}")
    if not await todo_db.delete_todo(todo_id):
        logger.warning(f"Todo not found for deletion: {todo_id}")
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, 
            detail=f"Todo with id {todo_id} not found"
        )
    return None


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
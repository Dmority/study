-- Initialize database for local development
-- This script runs when the PostgreSQL container starts

-- Create extensions if needed
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create todo status enum
CREATE TYPE todo_status AS ENUM ('pending', 'in_progress', 'completed');

-- The tables will be created automatically by SQLAlchemy
-- This file is just for any additional setup needed
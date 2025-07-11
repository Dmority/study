# ADOT Study Environment

AWS Distro for OpenTelemetry (ADOT) study environment with microservices architecture.

## Project Context
- Created: 2025-07-11
- Type: Study project - ADOT observability implementation
- Status: In development
- Architecture: ALB + ECS (Next.js + FastAPI) + Aurora Serverless

## Structure
```
docs/
├── ARCHITECTURE.md           # System architecture and components
├── IMPLEMENTATION_PLAN.md    # Phase-by-phase implementation guide
├── INFRASTRUCTURE_REQUIREMENTS.md  # AWS services and resource specs
└── ADOT_CONFIGURATION.md     # ADOT collector and instrumentation config

backend/
├── main.py                   # FastAPI application entry point
├── models.py                 # Pydantic data models
├── db_models.py              # SQLAlchemy database models
├── database.py               # Database connection and operations
├── config.py                 # Application configuration and settings
├── pyproject.toml            # Project dependencies and build config
├── Dockerfile                # Secure container build
├── docker-compose.yaml       # Local development stack
├── .env.example              # Environment variables template
└── openapi.json              # Generated API specification

frontend/
├── openapi.json              # Backend API specification
├── package.json              # Dependencies and scripts
├── next.config.ts            # Next.js configuration
├── tsconfig.json             # TypeScript configuration
├── eslint.config.mjs         # ESLint configuration
├── postcss.config.mjs        # PostCSS configuration
├── Dockerfile                # Container build configuration
├── README.md                 # Frontend documentation
├── src/
│   ├── app/
│   │   ├── actions/
│   │   │   └── todo-actions.ts   # Server actions for todo operations
│   │   ├── layout.tsx            # Root layout component
│   │   ├── page.tsx              # Home page component
│   │   ├── globals.css           # Global styles
│   │   └── favicon.ico           # Application icon
│   ├── components/
│   │   ├── todo-form.tsx         # Todo creation form
│   │   └── todo-item.tsx         # Todo item display
│   ├── lib/
│   │   └── todos.ts              # API client functions
│   └── types/
│       └── todo.ts               # TypeScript type definitions
└── public/                       # Static assets
```

## Development Notes
- **Frontend**: Next.js with OpenTelemetry browser instrumentation
- **Backend**: FastAPI Todo application with automatic Python instrumentation
  - Package management: uv (pyproject.toml)
  - Database: PostgreSQL with SQLAlchemy async operations
  - Multi-database support: PostgreSQL (production), SQLite (development fallback)
  - AWS Secrets Manager integration for credential management
  - CRUD operations with validation and proper error handling
  - Pydantic models with enum status (pending, in_progress, completed)
  - Secure Docker container with non-root user
  - Auto-generated OpenAPI specification
- **Database**: 
  - Production: Aurora Serverless v2 (PostgreSQL)
  - Local Development: PostgreSQL 17 in Docker container
  - Features: Connection pooling, automatic table creation, health checks
- **Local Development Stack**:
  - PostgreSQL container with pgAdmin web UI
  - Docker Compose orchestration
  - Environment-based configuration
  - Hot-reload development server
- **Observability**: ADOT collector, X-Ray tracing, CloudWatch metrics/logs
- **Deployment**: ECS Fargate with sidecar ADOT collectors

## Study Goals
1. Understand ADOT automatic vs manual instrumentation
2. Implement end-to-end distributed tracing
3. Configure custom metrics and business KPIs
4. Test performance impact of observability
5. Learn ADOT collector configuration patterns

## Commands
- Infrastructure setup: TBD (Terraform or AWS CLI)
- **Backend application**:
  - Development: `uv sync && uv run uvicorn main:app --reload`
  - Container build: `container build -t todo-backend .`
  - Container run: `container run --detach --name todo-backend-app todo-backend`
  - OpenAPI: Available at `/openapi.json` endpoint
- **Database (Local Development)**:
  - Setup: `cp .env.example .env`
  - Start PostgreSQL: `docker-compose up -d postgres`
  - Start full stack: `docker-compose up -d`
  - Access pgAdmin: http://localhost:5050 (admin@example.com / admin)
  - Database: postgresql://adotuser:adotpass@localhost:5432/adotdb
  - Test connection: `uv run python -c "from database import db_manager; import asyncio; asyncio.run(db_manager.init_db())"`
- **API Endpoints**:
  - `GET /` - Root endpoint
  - `GET /health` - Health check
  - `GET /todos` - Get all todos
  - `POST /todos` - Create todo
  - `GET /todos/{id}` - Get specific todo
  - `PUT /todos/{id}` - Update todo
  - `DELETE /todos/{id}` - Delete todo
- Deployment: TBD (ECS deployments)
- Monitoring: CloudWatch/X-Ray dashboards

## Memories
- Added initial project documentation and project structure
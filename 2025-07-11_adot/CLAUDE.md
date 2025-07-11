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
```

## Development Notes
- **Frontend**: Next.js with OpenTelemetry browser instrumentation
- **Backend**: FastAPI with automatic Python instrumentation
- **Database**: Aurora Serverless v2 (PostgreSQL)
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
- Application build: TBD (Docker builds)
- Deployment: TBD (ECS deployments)
- Monitoring: CloudWatch/X-Ray dashboards
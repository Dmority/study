# Infrastructure Requirements

## AWS Services Required

### Core Compute and Networking
- **VPC**: Virtual Private Cloud with public and private subnets
- **ECS**: Elastic Container Service with Fargate launch type
- **ALB**: Application Load Balancer for traffic distribution
- **ECR**: Elastic Container Registry for container images
- **Aurora Serverless v2**: PostgreSQL-compatible database

### Observability and Monitoring
- **CloudWatch**: Logs, metrics, and alarms
- **X-Ray**: Distributed tracing service
- **ADOT**: AWS Distro for OpenTelemetry collector
- **CloudWatch Container Insights**: Container-level metrics

### Security and Access
- **IAM**: Roles and policies for services
- **Security Groups**: Network-level security
- **ACM**: SSL/TLS certificates for HTTPS
- **Secrets Manager**: Database credentials and API keys

## Resource Specifications

### VPC Configuration
```
CIDR: 10.0.0.0/16
Public Subnets: 10.0.1.0/24, 10.0.2.0/24 (2 AZs required for ALB)
Private Subnets: 10.0.3.0/24, 10.0.4.0/24 (2 AZs for ECS/Aurora)
Availability Zones: 2 (ALB requirement)
NAT Gateway: Single NAT Gateway in AZ-1 (cost optimization)
```

### ECS Cluster Specifications
```
Cluster Type: Fargate
Task CPU: 256 vCPU (0.25 vCPU)
Task Memory: 512 MB
Service Count: 
  - Frontend: 1 task
  - Backend: 1 task
```

### ALB Configuration
```
Type: Application Load Balancer
Scheme: Internet-facing
IP Address Type: IPv4
Target Groups:
  - Frontend: Port 3000
  - Backend: Port 8000
Health Check: /health endpoint
```

### Aurora Serverless v2
```
Engine: PostgreSQL 17.5 (latest version as of 2025)
ACU Range: 0.5 - 1 ACU (for study purposes)
Storage: Encrypted, up to 256 TiB capacity
Backup Retention: 1 day
Multi-AZ: Yes (required for Aurora, but single instance)
```

## Network Security

### Security Groups

#### ALB Security Group
```
Inbound:
  - HTTP (80) from 0.0.0.0/0
  - HTTPS (443) from 0.0.0.0/0
Outbound:
  - All traffic to ECS security group
```

#### ECS Security Group
```
Inbound:
  - Port 3000 from ALB security group (Frontend)
  - Port 8000 from ALB security group (Backend)
Outbound:
  - HTTPS (443) to 0.0.0.0/0
  - Port 5432 to Aurora security group
```

#### Aurora Security Group
```
Inbound:
  - Port 5432 from ECS security group
Outbound:
  - None
```

## IAM Roles and Policies

### ECS Task Execution Role
```
Policies:
  - AmazonECSTaskExecutionRolePolicy
  - CloudWatchLogsFullAccess
  - AmazonEC2ContainerRegistryReadOnly
```

### ECS Task Role
```
Policies:
  - AWSXRayDaemonWriteAccess
  - CloudWatchAgentServerPolicy
  - Custom policy for Aurora access
  - Custom policy for Secrets Manager access
```

### ADOT Collector Role
```
Policies:
  - AWSXRayDaemonWriteAccess
  - CloudWatchAgentServerPolicy
  - AmazonPrometheusRemoteWriteAccess (if using AMP)
```

## Cost Estimation (Monthly)

### Study Environment
```
ALB: ~$16/month
ECS Fargate: ~$8/month (1 task x 2 services)
Aurora Serverless v2: ~$30/month (0.5 ACU average)
CloudWatch: ~$3/month
X-Ray: ~$3/month
ECR: ~$1/month
NAT Gateway: ~$16/month (single NAT Gateway)
Total: ~$75/month
```

### Production Environment (for reference)
```
ALB: ~$16/month
ECS Fargate: ~$60/month (4 tasks x 2 services)
Aurora Serverless v2: ~$90/month (1 ACU average)
CloudWatch: ~$15/month
X-Ray: ~$15/month
ECR: ~$2/month
NAT Gateway: ~$64/month (2 AZs)
Total: ~$260/month
```

## Deployment Prerequisites

### Local Development Tools
- AWS CLI v2
- Docker Desktop
- Terraform (optional, for IaC)
- Node.js 18+ (for frontend development)
- Python 3.9+ (for backend development)

### AWS Account Setup
- AWS Account with appropriate permissions
- IAM user with programmatic access
- AWS CLI configured with credentials
- Default region configured (e.g., us-east-1)

### Domain and SSL (Optional)
- Route 53 hosted zone
- ACM certificate for HTTPS
- Custom domain configuration

## Monitoring and Alerting

### CloudWatch Alarms
- ECS service CPU/Memory utilization
- ALB target health and response time
- Aurora database connections and CPU
- Application error rates

### X-Ray Sampling Rules
- Default: 1 request per second + 10% of additional requests
- High-value endpoints: Higher sampling rate
- Health checks: Lower sampling rate

### Log Retention
- Application logs: 7 days (development), 30 days (production)
- Access logs: 30 days
- Database logs: 7 days

## Backup and Disaster Recovery

### Database Backups
- Automated backups: 1 day retention (minimum)
- Manual snapshots before major changes
- Point-in-time recovery enabled

### Container Images
- ECR lifecycle policies to manage image retention
- Single region deployment for study

### Configuration Backup
- Infrastructure as Code (Terraform state)
- Application configuration in version control
- Secrets backup strategy

## Scaling Considerations

### Auto Scaling Policies
- ECS services: Target tracking on CPU/Memory
- Aurora: Auto-scaling based on CPU utilization
- ALB: Automatic scaling built-in

### Performance Targets
- API response time: < 200ms (95th percentile)
- Database query time: < 50ms (average)
- Frontend page load: < 2 seconds
- Error rate: < 0.1%

## Compliance and Security

### Data Protection
- Encryption at rest: Aurora, ECS volumes
- Encryption in transit: HTTPS/TLS
- Network isolation: Private subnets

### Access Control
- Principle of least privilege
- Service-to-service IAM roles
- No hardcoded credentials

### Audit and Compliance
- CloudTrail for API logging
- VPC Flow Logs for network monitoring
- Regular security assessments
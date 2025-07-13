# ADOT Study Environment - Terraform Infrastructure

This directory contains Terraform configuration for deploying the ADOT (AWS Distro for OpenTelemetry) study environment.

## Architecture

The infrastructure includes:
- VPC with public and private subnets across 2 AZs
- Application Load Balancer (ALB)
- ECS Fargate cluster for containerized applications
- Aurora Serverless v2 PostgreSQL database
- Security groups and IAM roles
- CloudWatch log groups and ECR repositories

## Prerequisites

1. **AWS CLI configured** with appropriate credentials
2. **Terraform** >= 1.0 installed
3. **AWS Account** with necessary permissions

## Quick Start

1. **Copy and customize variables:**
   ```bash
   cp terraform.tfvars.example terraform.tfvars
   # Edit terraform.tfvars with your values
   ```

2. **Initialize Terraform:**
   ```bash
   terraform init
   ```

3. **Plan the deployment:**
   ```bash
   terraform plan
   ```

4. **Apply the infrastructure:**
   ```bash
   terraform apply
   ```

5. **View outputs:**
   ```bash
   terraform output
   ```

## Key Resources

### Networking
- **VPC**: 10.0.0.0/16 CIDR block
- **Public Subnets**: 10.0.1.0/24, 10.0.2.0/24
- **Private Subnets**: 10.0.3.0/24, 10.0.4.0/24
- **Single NAT Gateway**: Cost-optimized for study environment

### Compute
- **ECS Cluster**: Fargate capacity providers
- **Task Definitions**: Frontend (Next.js) and Backend (FastAPI)
- **ADOT Sidecars**: Telemetry collection

### Database
- **Aurora Serverless v2**: PostgreSQL 17.5
- **ACU Range**: 0.5 - 1.0 (configurable)
- **Encryption**: Enabled at rest

### Load Balancing
- **ALB**: Internet-facing with HTTP to HTTPS redirect
- **Target Groups**: Frontend (port 3000) and Backend (port 8000)
- **Health Checks**: /health endpoints

## Registry Modules Used

- **VPC**: `terraform-aws-modules/vpc/aws`
- **ALB**: `terraform-aws-modules/alb/aws`
- **ECS**: `terraform-aws-modules/ecs/aws`
- **Aurora**: `terraform-aws-modules/rds-aurora/aws`

## Security

- **Security Groups**: Principle of least privilege
- **IAM Roles**: ECS task execution and task roles
- **Encryption**: Aurora storage encryption enabled
- **VPC**: Private subnets for compute and database

## Monitoring

- **CloudWatch**: Log groups for applications and ADOT
- **X-Ray**: Distributed tracing (when enabled)
- **Container Insights**: ECS monitoring (when enabled)

## Cost Optimization

- **Single NAT Gateway**: ~$16/month vs $32/month for multi-AZ
- **Aurora Serverless v2**: Scales to zero when not in use
- **Fargate Spot**: 50% capacity provider weight for cost savings

## Customization

Key variables in `terraform.tfvars`:

```hcl
# AWS Region
aws_region = "us-east-1"

# Project naming
project_name = "adot-study"
environment  = "dev"

# Resource sizing
frontend_cpu    = 256
frontend_memory = 512
backend_cpu     = 256
backend_memory  = 512

# Aurora capacity
aurora_min_capacity = 0.5
aurora_max_capacity = 1.0
```

## Outputs

Important outputs for application deployment:

- `alb_dns_name`: Load balancer endpoint
- `ecs_cluster_name`: ECS cluster for service deployment
- `aurora_cluster_endpoint`: Database connection endpoint
- `frontend_ecr_repository_url`: Frontend container registry
- `backend_ecr_repository_url`: Backend container registry

## Next Steps

After infrastructure deployment:

1. **Build and push container images** to ECR repositories
2. **Create ECS service definitions** with ADOT sidecars
3. **Configure ADOT collectors** for telemetry collection
4. **Set up monitoring dashboards** in CloudWatch

## Cleanup

To destroy the infrastructure:

```bash
terraform destroy
```

**Note**: This will delete all resources including the database. Ensure you have backups if needed.

## Troubleshooting

### Common Issues

1. **Insufficient IAM permissions**: Ensure your AWS credentials have necessary permissions
2. **Region availability**: Some services may not be available in all regions
3. **Resource limits**: Check AWS service quotas if deployment fails

### Validation

```bash
# Validate configuration
terraform validate

# Check formatting
terraform fmt -check

# Security scan (if using tfsec)
tfsec .
```

## Contributing

When modifying the infrastructure:

1. Follow Terraform best practices
2. Use registry modules where possible
3. Document any changes in this README
4. Test changes in a development environment first
# Terraform Structure and Naming Conventions

## Directory Structure

### Root Level Structure
```
├── terraform/
│   ├── main.tf                 # Main Terraform configuration
│   ├── variables.tf           # Input variables declaration
│   ├── outputs.tf            # Output values
│   ├── versions.tf           # Provider version constraints
│   ├── terraform.tfvars      # Default variable values (not committed)
│   ├── modules/              # Reusable Terraform modules
│   ├── environments/         # Environment-specific configurations
│   └── scripts/             # Supporting scripts and files
├── docs/                    # Documentation
└── README.md               # Project documentation
```

### Module Structure
```
terraform/
├── modules/
│   ├── vpc/
│   │   ├── main.tf          # VPC resources
│   │   ├── variables.tf     # Module input variables
│   │   ├── outputs.tf       # Module outputs
│   │   └── README.md        # Module documentation
│   ├── security/
│   │   ├── main.tf          # Security groups and IAM
│   │   ├── variables.tf
│   │   ├── outputs.tf
│   │   └── README.md
│   ├── alb/
│   ├── ec2/
│   └── rds/
```

### Environment Structure
```
terraform/
├── environments/
│   ├── dev/
│   │   ├── main.tf          # Environment-specific config
│   │   ├── variables.tf     # Environment variables
│   │   ├── terraform.tfvars # Environment values
│   │   └── backend.tf       # State backend config
│   ├── staging/
│   └── prod/
```

## Naming Conventions

### Resource Naming Pattern
**Format**: `[environment]-[project]-[resource-type]-[identifier]`

**Examples**:
- VPC: `dev-aws-study-vpc`
- Subnets: `dev-aws-study-subnet-public-1a`
- Security Groups: `dev-aws-study-sg-alb`
- Load Balancer: `dev-aws-study-alb`
- Auto Scaling Group: `dev-aws-study-asg`
- RDS Instance: `dev-aws-study-rds-main`

### Variable Naming
- Use snake_case for all variable names
- Be descriptive and avoid abbreviations
- Group related variables with prefixes

**Examples**:
```hcl
variable "vpc_cidr_block" {}
variable "public_subnet_cidrs" {}
variable "private_subnet_cidrs" {}
variable "database_subnet_cidrs" {}
variable "ec2_instance_type" {}
variable "rds_instance_class" {}
```

### Tag Naming Standards
**Required Tags for All Resources**:
```hcl
tags = {
  Name        = "[resource-name]"
  Environment = var.environment
  Project     = var.project_name
  ManagedBy   = "terraform"
  Owner       = var.owner
  CostCenter  = var.cost_center
}
```

### Local Values Naming
```hcl
locals {
  common_tags = {
    Environment = var.environment
    Project     = var.project_name
    ManagedBy   = "terraform"
  }
  
  vpc_name = "${var.environment}-${var.project_name}-vpc"
  alb_name = "${var.environment}-${var.project_name}-alb"
}
```

## File Organization Standards

### terraform/main.tf Structure
```hcl
# Provider configuration
terraform {
  required_version = ">= 1.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

# Data sources
data "aws_availability_zones" "available" {
  state = "available"
}

# Local values
locals {
  # Common configurations
}

# Module calls
module "vpc" {
  source = "./modules/vpc"
  # variables
}

# Direct resources (if any)
resource "aws_s3_bucket" "example" {
  # configuration
}
```

### terraform/variables.tf Structure
```hcl
# Environment configuration
variable "environment" {
  description = "Environment name (dev, staging, prod)"
  type        = string
  validation {
    condition = contains(["dev", "staging", "prod"], var.environment)
    error_message = "Environment must be dev, staging, or prod."
  }
}

# Network configuration
variable "vpc_cidr_block" {
  description = "CIDR block for VPC"
  type        = string
  default     = "10.0.0.0/16"
}

# Instance configuration
variable "ec2_instance_type" {
  description = "EC2 instance type"
  type        = string
  default     = "t3.micro"
}
```

### terraform/outputs.tf Structure
```hcl
# Network outputs
output "vpc_id" {
  description = "ID of the VPC"
  value       = module.vpc.vpc_id
}

# Load balancer outputs
output "alb_dns_name" {
  description = "DNS name of the load balancer"
  value       = module.alb.dns_name
}

# Database outputs
output "rds_endpoint" {
  description = "RDS instance endpoint"
  value       = module.rds.endpoint
  sensitive   = true
}
```

## Code Style Standards

### Formatting Rules
- Use 2 spaces for indentation
- Always run `terraform fmt` before committing
- Keep line length under 120 characters
- Use blank lines to separate logical groups

### Resource Ordering
1. Data sources
2. Local values
3. Resources (alphabetical by type, then by name)
4. Module calls

### Comments
```hcl
# Main VPC for the application
resource "aws_vpc" "main" {
  cidr_block           = var.vpc_cidr_block
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = merge(local.common_tags, {
    Name = local.vpc_name
  })
}
```

### Variable Validation
```hcl
variable "environment" {
  description = "Environment name"
  type        = string
  validation {
    condition = contains(["dev", "staging", "prod"], var.environment)
    error_message = "Environment must be dev, staging, or prod."
  }
}
```

## Module Standards

### Module Inputs
- Always include description for variables
- Use appropriate types (string, number, list, map)
- Provide sensible defaults where applicable
- Use validation blocks for critical variables

### Module Outputs
- Output all important resource attributes
- Include descriptions for all outputs
- Mark sensitive outputs appropriately

### Module Documentation
Each module should include a README.md with:
- Purpose and description
- Input variables table
- Output values table
- Usage examples
- Requirements and dependencies

## Development Commands
```bash
# Navigate to terraform directory
cd terraform/

# Initialize terraform
terraform init

# Format code
terraform fmt -recursive

# Validate syntax
terraform validate

# Plan changes
terraform plan

# Apply changes
terraform apply
```
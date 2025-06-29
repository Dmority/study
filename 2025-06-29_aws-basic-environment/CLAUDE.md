# AWS Basic Environment Study

This project studies the basic AWS environment setup with Application Load Balancer (ALB), EC2 instances, and RDS database.

## Architecture Components
- **Application Load Balancer (ALB)**: Distributes incoming traffic across multiple EC2 instances
- **EC2 Instances**: Compute instances hosting the application
- **RDS**: Managed relational database service

## Study Goals
- Understand basic AWS networking and security
- Learn ALB configuration and target groups
- Practice EC2 instance management
- Explore RDS setup and connectivity
- Implement basic 3-tier architecture

## Files Structure
- Infrastructure as Code (Terraform) in `terraform/` directory
- Application code for EC2 instances
- Database schema and configuration
- Security group configurations
- Networking setup (VPC, subnets, etc.)
- Project documentation in `docs/` directory

## Documentation
- `docs/IMPLEMENTATION_PLAN.md` - Detailed 3-tier architecture implementation plan
- `docs/SECURITY_BEST_PRACTICES.md` - Security guidelines with Trivy integration and alerting
- `docs/TERRAFORM_STANDARDS.md` - Terraform structure and naming conventions

## Development Workflow

### 1. Documentation First Approach
- **ALWAYS** create implementation documents before writing any code
- Document architecture decisions and rationale
- Create detailed implementation plans with step-by-step approach
- Update documentation when making changes

### 2. Implementation Planning Process
1. Create implementation plan document
2. Define Terraform module structure
3. Document security requirements
4. Plan testing and validation approach
5. Only then proceed with coding

### 3. Terraform Development Rules

#### Code Organization
- Use consistent module structure in `terraform/` directory
- Separate environments (dev, staging, prod)
- Group related resources logically
- Follow naming conventions consistently

#### Version Control
- Always use version constraints for providers
- Pin module versions in production
- Use semantic versioning for custom modules
- Document breaking changes

#### State Management
- Use remote state storage (S3 + DynamoDB)
- Enable state locking
- Never commit state files
- Use separate state files per environment

### 4. Security Requirements
- Enable AWS CloudTrail for all environments
- Use least privilege principle for IAM
- Encrypt all data at rest and in transit
- Regular security group audits
- No hardcoded secrets in code
- Run Trivy security scanning for HIGH/CRITICAL vulnerabilities
- Configure SNS alerts for security findings

### 5. Testing and Validation
- Validate Terraform syntax before commits
- Test in development environment first
- Use `terraform plan` before every apply
- Implement automated testing where possible
- Run security gate checks with Trivy

### 6. Deployment Process
1. Run `terraform fmt` to format code
2. Run `terraform validate` to check syntax
3. Run Trivy security scan with HIGH/CRITICAL severity check
4. Run `terraform plan` to review changes
5. Get approval for production changes
6. Run `terraform apply` with careful monitoring
7. Document any manual steps required

### 7. Maintenance Rules
- Regular updates of provider versions
- Monitor AWS costs and resource usage
- Clean up unused resources
- Keep documentation current with infrastructure changes

## Prohibited Actions
- No direct AWS console changes in production
- No hardcoded values (use variables/locals)
- No shared credentials in code
- No bypassing the planning phase
- No coding without implementation documents

## Development Commands
```bash
# Navigate to terraform directory
cd terraform/

# Terraform commands
terraform init
terraform fmt -recursive
terraform validate
terraform plan
terraform apply
terraform destroy

# Security scanning
trivy config terraform/ --severity HIGH,CRITICAL --exit-code 1

# AWS CLI commands
aws ec2 describe-instances
aws rds describe-db-instances
aws elbv2 describe-load-balancers
```
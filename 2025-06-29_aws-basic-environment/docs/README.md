# Documentation

This directory contains comprehensive documentation for the AWS 3-Tier Architecture project.

## Files Overview

| Document | Description | Purpose |
|----------|-------------|---------|
| `IMPLEMENTATION_PLAN.md` | Detailed 3-tier architecture implementation plan with ASCII diagram | Step-by-step guide for deploying the infrastructure |
| `SECURITY_BEST_PRACTICES.md` | Security guidelines with Trivy integration and alerting | Security standards and monitoring setup |
| `TERRAFORM_STANDARDS.md` | Terraform structure and naming conventions | Code organization and development standards |

## Architecture Diagram

### ASCII Version
A detailed ASCII diagram is available in `IMPLEMENTATION_PLAN.md` showing the complete 3-tier architecture.

### PNG Version (Optional)
To generate a professional PNG diagram, run the provided Python script:

```bash
# Install dependencies (requires elevated permissions)
sudo apt update
sudo apt install -y python3-pip graphviz

# Install Python packages
pip3 install diagrams

# Generate diagram
python3 ../generate_diagram.py
```

This will create `aws_architecture.png` in the docs directory.

## Quick Reference

### Architecture Overview
- **Tier 1**: Application Load Balancer (Public Subnets)
- **Tier 2**: EC2 Instances with Auto Scaling (Private Subnets)  
- **Tier 3**: RDS Database (Database Subnets)

### Security Layers
- Internet Gateway → ALB (Ports 80,443)
- ALB → EC2 (Port 80 only)
- EC2 → RDS (Port 3306 only)
- Outbound: EC2 → NAT Gateway → Internet

### Monitoring
- CloudWatch for metrics and logs
- SNS for security alerts
- GuardDuty for threat detection
- Trivy for vulnerability scanning
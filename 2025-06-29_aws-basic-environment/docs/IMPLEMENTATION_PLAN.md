# AWS 3-Tier Architecture Implementation Plan

## Project Overview
Implementation of a basic AWS 3-tier architecture using Terraform for infrastructure as code.

## Architecture Diagram

```
                                    ┌─────────────────┐
                                    │      Users      │
                                    └─────────┬───────┘
                                              │ HTTPS/HTTP
                                              ▼
                            ┌─────────────────────────────────────┐
                            │              AWS Cloud              │
                            │  ┌─────────────────────────────────┐│
                            │  │      VPC (10.0.0.0/16)         ││
                            │  │                                 ││
                            │  │  ┌─────────────────────────────┐││
                            │  │  │      Internet Gateway      │││
                            │  │  └─────────────┬───────────────┘││
                            │  │                │                ││
                            │  │ ┌──────────────▼──────────────┐ ││
                            │  │ │  Application Load Balancer  │ ││
                            │  │ │    (Public Subnets)         │ ││
                            │  │ │  AZ-A: 10.0.1.0/24          │ ││
                            │  │ │  AZ-B: 10.0.2.0/24          │ ││
                            │  │ └──────────────┬──────────────┘ ││
                            │  │                │                ││
                            │  │       ┌────────┴────────┐       ││
                            │  │       │                 │       ││
                            │  │ ┌─────▼──────┐   ┌─────▼──────┐││
                            │  │ │EC2 Instance│   │EC2 Instance│││
                            │  │ │     A      │   │     B      │││
                            │  │ │Private     │   │Private     │││
                            │  │ │Subnet A    │   │Subnet B    │││
                            │  │ │10.0.10.0/24│   │10.0.11.0/24│││
                            │  │ └─────┬──────┘   └─────┬──────┘││
                            │  │       │                 │       ││
                            │  │       └────────┬────────┘       ││
                            │  │                │                ││
                            │  │ ┌──────────────▼──────────────┐ ││
                            │  │ │        RDS Database         │ ││
                            │  │ │       (Multi-AZ)            │ ││
                            │  │ │  DB Subnet A: 10.0.20.0/24  │ ││
                            │  │ │  DB Subnet B: 10.0.21.0/24  │ ││
                            │  │ └─────────────────────────────┘ ││
                            │  │                                 ││
                            │  │ ┌─────────────────────────────┐ ││
                            │  │ │      NAT Gateways           │ ││
                            │  │ │   (For outbound traffic)    │ ││
                            │  │ └─────────────────────────────┘ ││
                            │  └─────────────────────────────────┘│
                            └─────────────────────────────────────┘

                            ┌─────────────────────────────────────┐
                            │         Security Groups             │
                            │                                     │
                            │  ALB SG: Port 80,443 from 0.0.0.0/0│
                            │  EC2 SG: Port 80 from ALB SG only   │
                            │  RDS SG: Port 3306 from EC2 SG only │
                            └─────────────────────────────────────┘

                            ┌─────────────────────────────────────┐
                            │          Monitoring                 │
                            │                                     │
                            │  CloudWatch: Metrics + Alarms      │
                            │  SNS: Security Alert Notifications  │
                            │  GuardDuty: Threat Detection        │
                            └─────────────────────────────────────┘
```

### Network Flow
1. **Inbound Traffic**: Users → Internet Gateway → ALB → EC2 Instances
2. **Database Access**: EC2 Instances → RDS (Private Communication)
3. **Outbound Traffic**: EC2 Instances → NAT Gateway → Internet Gateway
4. **Security**: Each layer protected by dedicated Security Groups

## Architecture Components

### Tier 1: Presentation Layer (Load Balancer)
- **Application Load Balancer (ALB)**
  - Internet-facing load balancer
  - HTTP/HTTPS listeners
  - Target groups for EC2 instances
  - Health checks configuration

### Tier 2: Application Layer (EC2 Instances)
- **EC2 Instances**
  - Auto Scaling Group for high availability
  - Launch Template with user data
  - Security groups for application access
  - Multiple availability zones

### Tier 3: Data Layer (RDS)
- **RDS Database**
  - Multi-AZ deployment for high availability
  - Automated backups
  - Security groups for database access
  - Subnet groups for network isolation

## Implementation Phases

### Phase 1: Network Foundation
1. **VPC and Networking**
   - Create VPC with appropriate CIDR
   - Public subnets for ALB (2 AZs minimum)
   - Private subnets for EC2 instances (2 AZs minimum)
   - Database subnets for RDS (2 AZs minimum)
   - Internet Gateway for public access
   - NAT Gateways for private subnet internet access
   - Route tables configuration

### Phase 2: Security Configuration
2. **Security Groups**
   - ALB security group (HTTP/HTTPS from internet)
   - EC2 security group (HTTP from ALB only)
   - RDS security group (MySQL/PostgreSQL from EC2 only)
   - Bastion host security group (SSH access)

3. **IAM Roles and Policies**
   - EC2 instance role for AWS service access
   - Service-linked roles for Auto Scaling
   - Policies following least privilege principle

### Phase 3: Core Infrastructure
4. **Database Layer**
   - RDS subnet group
   - RDS parameter group (if custom parameters needed)
   - RDS instance with encryption
   - Database security group

5. **Application Layer**
   - Launch Template for EC2 instances
   - Auto Scaling Group configuration
   - Target Group for ALB
   - Security group for EC2 instances

6. **Load Balancer Layer**
   - Application Load Balancer
   - ALB listeners and rules
   - Target group attachment
   - Security group for ALB

### Phase 4: Monitoring and Maintenance
7. **Monitoring Setup**
   - CloudWatch alarms for key metrics
   - SNS topics for notifications
   - Log groups for application logs

8. **Backup and Recovery**
   - RDS automated backups
   - EC2 AMI creation schedule
   - Disaster recovery procedures

## File Structure Plan
```
├── main.tf                 # Main configuration
├── variables.tf           # Input variables
├── outputs.tf            # Output values
├── versions.tf           # Provider versions
├── modules/
│   ├── vpc/              # VPC and networking
│   ├── security/         # Security groups and IAM
│   ├── alb/              # Application Load Balancer
│   ├── ec2/              # Auto Scaling Group and Launch Template
│   └── rds/              # RDS database
├── environments/
│   ├── dev/              # Development environment
│   ├── staging/          # Staging environment
│   └── prod/             # Production environment
└── scripts/
    ├── user-data.sh      # EC2 user data script
    └── db-init.sql       # Database initialization
```

## Resource Naming Convention
- Environment prefix: `[env]-[project]-[resource]`
- Example: `dev-aws-study-vpc`, `prod-aws-study-alb`

## Testing Strategy
1. **Syntax Validation**: `terraform validate`
2. **Plan Review**: `terraform plan` for each environment
3. **Development Testing**: Deploy to dev environment first
4. **Connectivity Testing**: Verify ALB → EC2 → RDS connectivity
5. **Load Testing**: Basic load testing on ALB
6. **Security Testing**: Verify security group rules

## Success Criteria
- [ ] All resources deployed successfully
- [ ] Web application accessible via ALB
- [ ] Database connectivity from application
- [ ] Auto Scaling Group responds to load
- [ ] Monitoring and alarms functional
- [ ] Security groups properly configured
- [ ] All environments (dev/staging/prod) deployable

## Next Steps After Implementation
1. Set up CI/CD pipeline
2. Implement application monitoring
3. Add SSL/TLS certificates
4. Configure log aggregation
5. Implement backup and disaster recovery testing
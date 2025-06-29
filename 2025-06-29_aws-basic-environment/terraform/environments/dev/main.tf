terraform {
  required_version = ">= 1.0"
  
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = "ap-northeast-1"
  
  default_tags {
    tags = {
      Environment = "dev"
      Project     = "aws-study"
      ManagedBy   = "terraform"
    }
  }
}

# Data sources
data "aws_availability_zones" "available" {
  state = "available"
}

# VPC using terraform registry module
module "vpc" {
  source  = "terraform-aws-modules/vpc/aws"
  version = "~> 5.0"

  name = "dev-aws-study-vpc"
  cidr = "10.0.0.0/16"

  azs             = slice(data.aws_availability_zones.available.names, 0, 2)
  public_subnets  = ["10.0.1.0/24", "10.0.2.0/24"]
  private_subnets = ["10.0.10.0/24", "10.0.11.0/24"]
  database_subnets = ["10.0.20.0/24", "10.0.21.0/24"]

  enable_nat_gateway = true
  enable_vpn_gateway = false
  enable_dns_hostnames = true
  enable_dns_support = true
  one_nat_gateway_per_az = true

  # Enable VPC flow logs
  enable_flow_log                      = true
  create_flow_log_cloudwatch_iam_role  = true
  create_flow_log_cloudwatch_log_group = true

  tags = {
    Name = "dev-aws-study-vpc"
  }

  public_subnet_tags = {
    Name = "dev-aws-study-public"
    Type = "public"
  }

  private_subnet_tags = {
    Name = "dev-aws-study-private"
    Type = "private"
  }

  database_subnet_tags = {
    Name = "dev-aws-study-database"
    Type = "database"
  }
}

# Security Groups
module "alb_sg" {
  source  = "terraform-aws-modules/security-group/aws"
  version = "~> 5.0"

  name        = "dev-aws-study-alb-sg"
  description = "Security group for ALB"
  vpc_id      = module.vpc.vpc_id

  ingress_rules = ["http-80-tcp", "https-443-tcp"]
  ingress_cidr_blocks = ["0.0.0.0/0"]

  egress_rules = ["all-all"]
  egress_cidr_blocks = ["0.0.0.0/0"]

  tags = {
    Name = "dev-aws-study-alb-sg"
  }
}

module "ec2_sg" {
  source  = "terraform-aws-modules/security-group/aws"
  version = "~> 5.0"

  name        = "dev-aws-study-ec2-sg"
  description = "Security group for EC2 instances"
  vpc_id      = module.vpc.vpc_id

  ingress_with_source_security_group_id = [
    {
      rule                     = "http-80-tcp"
      source_security_group_id = module.alb_sg.security_group_id
    }
  ]

  egress_rules = ["all-all"]
  egress_cidr_blocks = ["0.0.0.0/0"]

  tags = {
    Name = "dev-aws-study-ec2-sg"
  }
}

module "rds_sg" {
  source  = "terraform-aws-modules/security-group/aws"
  version = "~> 5.0"

  name        = "dev-aws-study-rds-sg"
  description = "Security group for RDS"
  vpc_id      = module.vpc.vpc_id

  ingress_with_source_security_group_id = [
    {
      rule                     = "mysql-tcp"
      source_security_group_id = module.ec2_sg.security_group_id
    }
  ]

  tags = {
    Name = "dev-aws-study-rds-sg"
  }
}

# Application Load Balancer
module "alb" {
  source  = "terraform-aws-modules/alb/aws"
  version = "~> 9.0"

  name               = "dev-aws-study-alb"
  load_balancer_type = "application"

  vpc_id  = module.vpc.vpc_id
  subnets = module.vpc.public_subnets

  # Security groups
  security_groups = [module.alb_sg.security_group_id]

  # Access logs
  access_logs = {
    bucket  = aws_s3_bucket.alb_logs.id
    enabled = true
    prefix  = "alb-logs"
  }

  # Listeners
  listeners = {
    ex-http = {
      port     = 80
      protocol = "HTTP"

      forward = {
        target_group_key = "ex-instance"
      }
    }
  }

  # Target groups
  target_groups = {
    ex-instance = {
      name_prefix      = "h1"
      protocol         = "HTTP"
      port             = 80
      target_type      = "instance"
      
      health_check = {
        enabled             = true
        healthy_threshold   = 2
        interval            = 30
        matcher             = "200"
        path                = "/"
        port                = "traffic-port"
        protocol            = "HTTP"
        timeout             = 5
        unhealthy_threshold = 2
      }
    }
  }

  tags = {
    Name = "dev-aws-study-alb"
  }
}

# S3 bucket for ALB access logs
resource "aws_s3_bucket" "alb_logs" {
  bucket = "dev-aws-study-alb-logs-${random_string.bucket_suffix.result}"

  tags = {
    Name = "dev-aws-study-alb-logs"
  }
}

resource "random_string" "bucket_suffix" {
  length  = 8
  special = false
  upper   = false
}

resource "aws_s3_bucket_public_access_block" "alb_logs" {
  bucket = aws_s3_bucket.alb_logs.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# Auto Scaling Group
module "asg" {
  source  = "terraform-aws-modules/autoscaling/aws"
  version = "~> 7.0"

  name                = "dev-aws-study-asg"
  min_size            = 1
  max_size            = 3
  desired_capacity    = 2
  health_check_type   = "ELB"
  health_check_grace_period = 300
  vpc_zone_identifier = module.vpc.private_subnets

  # Launch template
  launch_template_name        = "dev-aws-study-lt"
  launch_template_description = "Launch template for dev environment"
  update_default_version      = true

  image_id      = data.aws_ami.amazon_linux.id
  instance_type = "t3.micro"
  security_groups = [module.ec2_sg.security_group_id]

  user_data = base64encode(file("${path.module}/../../scripts/user-data.sh"))

  # Target group attachments
  target_group_arns = [module.alb.target_groups["ex-instance"].arn]

  tags = {
    Name = "dev-aws-study-asg"
  }
}

# Get latest Amazon Linux 2 AMI
data "aws_ami" "amazon_linux" {
  most_recent = true
  owners      = ["amazon"]

  filter {
    name   = "name"
    values = ["amzn2-ami-hvm-*-x86_64-gp2"]
  }

  filter {
    name   = "virtualization-type"
    values = ["hvm"]
  }
}

# RDS Instance
module "rds" {
  source  = "terraform-aws-modules/rds/aws"
  version = "~> 6.0"

  identifier = "dev-aws-study-rds"

  engine            = "mysql"
  engine_version    = "8.0"
  instance_class    = "db.t3.micro"
  allocated_storage = 20

  db_name  = "appdb"
  username = "admin"
  password = var.db_password

  vpc_security_group_ids = [module.rds_sg.security_group_id]
  db_subnet_group_name   = module.vpc.database_subnet_group

  backup_retention_period = 7
  backup_window          = "03:00-04:00"
  maintenance_window     = "sun:04:00-sun:05:00"

  # Enhanced monitoring
  monitoring_interval = 60
  monitoring_role_name = "dev-aws-study-rds-monitoring-role"
  create_monitoring_role = true

  # DB parameter group
  family = "mysql8.0"

  # Encryption
  storage_encrypted = true

  # Multi-AZ
  multi_az = true

  # Snapshot identifier
  final_snapshot_identifier = "dev-aws-study-rds-final-snapshot"
  skip_final_snapshot       = false

  tags = {
    Name = "dev-aws-study-rds"
  }
}
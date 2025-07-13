# =============================================================================
# NETWORK RESOURCES
# VPC, Subnets, Security Groups, Load Balancer
# =============================================================================

# VPC Module
module "vpc" {
  source = "terraform-aws-modules/vpc/aws"
  version = "~> 6.0"

  name = local.vpc_name
  cidr = var.vpc_cidr

  azs              = local.azs
  public_subnets   = local.public_subnet_cidrs
  private_subnets  = local.private_subnet_cidrs
  database_subnets = local.database_subnet_cidrs

  enable_nat_gateway     = true
  single_nat_gateway     = true  # Cost optimization - single NAT gateway
  enable_vpn_gateway     = false
  enable_dns_hostnames   = true
  enable_dns_support     = true
  
  create_database_subnet_group = true

}

# Security Groups
resource "aws_security_group" "alb" {
  name        = local.alb_sg_name
  description = "Security group for ALB"
  vpc_id      = module.vpc.vpc_id

  ingress {
    description = "HTTP"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    description = "HTTPS"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }


  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = local.alb_sg_name
  }
}

resource "aws_security_group" "ecs" {
  name        = local.ecs_sg_name
  description = "Security group for ECS services"
  vpc_id      = module.vpc.vpc_id

  ingress {
    description     = "HTTP from ALB - Frontend"
    from_port       = 3000
    to_port         = 3000
    protocol        = "tcp"
    security_groups = [aws_security_group.alb.id]
  }

  ingress {
    description     = "HTTP from ALB - Backend"
    from_port       = 8000
    to_port         = 8000
    protocol        = "tcp"
    security_groups = [aws_security_group.alb.id]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = local.ecs_sg_name
  }
}

resource "aws_security_group" "aurora" {
  name        = local.aurora_sg_name
  description = "Security group for Aurora database"
  vpc_id      = module.vpc.vpc_id

  ingress {
    description     = "PostgreSQL from ECS"
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [aws_security_group.ecs.id]
  }

  tags = {
    Name = local.aurora_sg_name
  }
}

# Application Load Balancer
module "alb" {
  source = "terraform-aws-modules/alb/aws"
  version = "~> 9.0"

  name               = local.alb_name
  load_balancer_type = "application"
  vpc_id             = module.vpc.vpc_id
  subnets            = module.vpc.public_subnets
  security_groups    = [aws_security_group.alb.id]

  # No listeners in module - create separately
  listeners = {}
  target_groups = {}

}

# Target Groups (separate resources for ECS services)
resource "aws_lb_target_group" "frontend" {
  name     = local.frontend_tg_name
  port     = 3000
  protocol = "HTTP"
  vpc_id   = module.vpc.vpc_id
  target_type = "ip"
  
  health_check {
    enabled             = true
    healthy_threshold   = 2
    unhealthy_threshold = 2
    timeout             = 5
    interval            = 30
    path                = "/"
    matcher             = "200"
    port                = "traffic-port"
    protocol            = "HTTP"
  }

  tags = {
    Name = local.frontend_tg_name
  }
}


# Create HTTP listener for frontend
resource "aws_lb_listener" "frontend" {
  load_balancer_arn = module.alb.arn
  port              = "80"
  protocol          = "HTTP"

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.frontend.arn
  }
}


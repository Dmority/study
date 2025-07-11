# Local values
locals {
  # Availability zones
  azs = slice(data.aws_availability_zones.available.names, 0, 2)
  
  # Subnet CIDR blocks
  public_subnet_cidrs   = [cidrsubnet(var.vpc_cidr, 8, 1), cidrsubnet(var.vpc_cidr, 8, 2)]
  private_subnet_cidrs  = [cidrsubnet(var.vpc_cidr, 8, 3), cidrsubnet(var.vpc_cidr, 8, 4)]
  database_subnet_cidrs = [cidrsubnet(var.vpc_cidr, 8, 5), cidrsubnet(var.vpc_cidr, 8, 6)]
  
  # Resource naming
  vpc_name           = "${var.project_name}-vpc"
  alb_name           = "${var.project_name}-alb"
  ecs_cluster_name   = "${var.project_name}-cluster"
  aurora_cluster_name = "${var.project_name}-aurora"
  
  # Target group names
  frontend_tg_name = "${var.project_name}-frontend-tg"
  backend_tg_name  = "${var.project_name}-backend-tg"
  
  # Security group names
  alb_sg_name    = "${var.project_name}-alb-sg"
  ecs_sg_name    = "${var.project_name}-ecs-sg"
  aurora_sg_name = "${var.project_name}-aurora-sg"
  
  # IAM role names
  ecs_task_execution_role_name = "${var.project_name}-ecs-task-execution-role"
  ecs_task_role_name          = "${var.project_name}-ecs-task-role"
  adot_policy_name            = "${var.project_name}-adot-policy"
  
  # Log group names
  frontend_log_group = "/aws/ecs/${var.project_name}/frontend"
  backend_log_group  = "/aws/ecs/${var.project_name}/backend"
  adot_log_group     = "/aws/ecs/${var.project_name}/adot"
  
  # ECR repository names
  frontend_ecr_name = "${var.project_name}/frontend"
  backend_ecr_name  = "${var.project_name}/backend"
}
output "vpc_id" {
  description = "VPC ID"
  value       = module.vpc.vpc_id
}

output "vpc_cidr_block" {
  description = "VPC CIDR block"
  value       = module.vpc.vpc_cidr_block
}

output "public_subnet_ids" {
  description = "Public subnet IDs"
  value       = module.vpc.public_subnets
}

output "private_subnet_ids" {
  description = "Private subnet IDs"
  value       = module.vpc.private_subnets
}

output "database_subnet_group_name" {
  description = "Database subnet group name"
  value       = module.vpc.database_subnet_group_name
}

output "alb_dns_name" {
  description = "ALB DNS name"
  value       = module.alb.dns_name
}

output "alb_zone_id" {
  description = "ALB zone ID"
  value       = module.alb.zone_id
}

output "alb_arn" {
  description = "ALB ARN"
  value       = module.alb.arn
}

output "frontend_target_group_arn" {
  description = "Frontend target group ARN"
  value       = aws_lb_target_group.frontend.arn
}

output "backend_service_discovery_arn" {
  description = "Backend service discovery ARN"
  value       = aws_service_discovery_service.backend.arn
}

output "ecs_cluster_id" {
  description = "ECS cluster ID"
  value       = module.ecs.cluster_id
}

output "ecs_cluster_arn" {
  description = "ECS cluster ARN"
  value       = module.ecs.cluster_arn
}

output "ecs_cluster_name" {
  description = "ECS cluster name"
  value       = module.ecs.cluster_name
}

output "aurora_cluster_id" {
  description = "Aurora cluster ID"
  value       = module.aurora.cluster_id
}

output "aurora_cluster_arn" {
  description = "Aurora cluster ARN"
  value       = module.aurora.cluster_arn
}

output "aurora_cluster_endpoint" {
  description = "Aurora cluster endpoint"
  value       = module.aurora.cluster_endpoint
}

output "aurora_cluster_reader_endpoint" {
  description = "Aurora cluster reader endpoint"
  value       = module.aurora.cluster_reader_endpoint
}

output "aurora_cluster_port" {
  description = "Aurora cluster port"
  value       = module.aurora.cluster_port
}

output "aurora_cluster_database_name" {
  description = "Aurora cluster database name"
  value       = module.aurora.cluster_database_name
}

output "aurora_cluster_master_username" {
  description = "Aurora cluster master username"
  value       = module.aurora.cluster_master_username
  sensitive   = true
}

output "aurora_cluster_master_user_secret_arn" {
  description = "Aurora cluster master user secret ARN"
  value       = module.aurora.cluster_master_user_secret != null ? module.aurora.cluster_master_user_secret[0].secret_arn : null
}

output "ecs_task_execution_role_arn" {
  description = "ECS task execution role ARN"
  value       = aws_iam_role.ecs_task_execution_role.arn
}

output "ecs_task_role_arn" {
  description = "ECS task role ARN"
  value       = aws_iam_role.ecs_task_role.arn
}

output "security_group_alb_id" {
  description = "ALB security group ID"
  value       = aws_security_group.alb.id
}

output "security_group_ecs_id" {
  description = "ECS security group ID"
  value       = aws_security_group.ecs.id
}

output "security_group_aurora_id" {
  description = "Aurora security group ID"
  value       = aws_security_group.aurora.id
}

output "frontend_ecr_repository_url" {
  description = "Frontend ECR repository URL"
  value       = aws_ecr_repository.frontend.repository_url
}

output "backend_ecr_repository_url" {
  description = "Backend ECR repository URL"
  value       = aws_ecr_repository.backend.repository_url
}

output "cloudwatch_log_group_frontend" {
  description = "Frontend CloudWatch log group name"
  value       = aws_cloudwatch_log_group.frontend.name
}

output "cloudwatch_log_group_backend" {
  description = "Backend CloudWatch log group name"
  value       = aws_cloudwatch_log_group.backend.name
}

output "cloudwatch_log_group_adot" {
  description = "ADOT CloudWatch log group name"
  value       = aws_cloudwatch_log_group.adot.name
}

output "aws_region" {
  description = "AWS region"
  value       = var.aws_region
}

output "project_name" {
  description = "Project name"
  value       = var.project_name
}

output "environment" {
  description = "Environment"
  value       = var.environment
}
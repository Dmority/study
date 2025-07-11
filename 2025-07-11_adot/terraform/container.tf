# =============================================================================
# CONTAINER RESOURCES
# ECS Cluster, ECR Repositories, and Container Configuration
# =============================================================================

# ECS Cluster
module "ecs" {
  source = "terraform-aws-modules/ecs/aws"
  version = "~> 6.0"

  cluster_name = local.ecs_cluster_name

  # Fargate capacity providers
  default_capacity_provider_strategy = {
    FARGATE_SPOT = {
      weight = 100
    }
  }

  # Enable Container Insights
  cluster_configuration = var.enable_container_insights ? {
    execute_command_configuration = {
      logging = "OVERRIDE"
      log_configuration = {
        cloud_watch_log_group_name = aws_cloudwatch_log_group.ecs_exec.name
      }
    }
  } : {}

  cluster_setting = var.enable_container_insights ? [
    {
      name  = "containerInsights"
      value = "enabled"
    }
  ] : []

}

# CloudWatch Log Group for ECS Exec
resource "aws_cloudwatch_log_group" "ecs_exec" {
  name              = "/aws/ecs/${var.project_name}/exec"
  retention_in_days = 7

}

# ECR Repositories
resource "aws_ecr_repository" "frontend" {
  name                 = local.frontend_ecr_name
  image_tag_mutability = "MUTABLE"

  image_scanning_configuration {
    scan_on_push = true
  }


}

resource "aws_ecr_repository" "backend" {
  name                 = local.backend_ecr_name
  image_tag_mutability = "MUTABLE"

  image_scanning_configuration {
    scan_on_push = true
  }


}

# ECR Repository Policy (Optional - for cross-account access)
resource "aws_ecr_repository_policy" "frontend" {
  repository = aws_ecr_repository.frontend.name

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "AllowPushPull"
        Effect = "Allow"
        Principal = {
          AWS = "arn:aws:iam::${data.aws_caller_identity.current.account_id}:root"
        }
        Action = [
          "ecr:GetDownloadUrlForLayer",
          "ecr:BatchGetImage",
          "ecr:BatchCheckLayerAvailability",
          "ecr:PutImage",
          "ecr:InitiateLayerUpload",
          "ecr:UploadLayerPart",
          "ecr:CompleteLayerUpload"
        ]
      }
    ]
  })
}

resource "aws_ecr_repository_policy" "backend" {
  repository = aws_ecr_repository.backend.name

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "AllowPushPull"
        Effect = "Allow"
        Principal = {
          AWS = "arn:aws:iam::${data.aws_caller_identity.current.account_id}:root"
        }
        Action = [
          "ecr:GetDownloadUrlForLayer",
          "ecr:BatchGetImage",
          "ecr:BatchCheckLayerAvailability",
          "ecr:PutImage",
          "ecr:InitiateLayerUpload",
          "ecr:UploadLayerPart",
          "ecr:CompleteLayerUpload"
        ]
      }
    ]
  })
}
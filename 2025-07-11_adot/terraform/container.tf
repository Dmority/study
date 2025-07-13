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

# =============================================================================
# ECS TASK DEFINITIONS
# =============================================================================

# Frontend Task Definition
resource "aws_ecs_task_definition" "frontend" {
  family                   = "${var.project_name}-frontend"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = var.frontend_cpu
  memory                   = var.frontend_memory
  execution_role_arn       = aws_iam_role.ecs_task_execution_role.arn
  task_role_arn           = aws_iam_role.ecs_task_role.arn

  container_definitions = jsonencode([
    {
      name  = "frontend"
      image = "${aws_ecr_repository.frontend.repository_url}:${var.frontend_image_tag}"
      
      portMappings = [
        {
          containerPort = 3000
          protocol      = "tcp"
        }
      ]

      environment = [
        {
          name  = "NODE_ENV"
          value = "production"
        },
        {
          name  = "NEXT_PUBLIC_API_URL"
          value = "http://backend.adot.local:8000"
        },
        {
          name = "NODE_OPTIONS"
          value = "--require @aws/aws-distro-opentelemetry-node-autoinstrumentation/register"
        }
      ]

      logConfiguration = {
        logDriver = "awslogs"
        options = {
          awslogs-group         = aws_cloudwatch_log_group.frontend.name
          awslogs-region        = var.aws_region
          awslogs-stream-prefix = "frontend"
        }
      }


      essential = true
    },
    {
      name  = "aws-otel-collector"
      image = "amazon/aws-otel-collector:latest"
      cpu   = var.adot_cpu
      memory = var.adot_memory

      logConfiguration = {
        logDriver = "awslogs"
        options = {
          awslogs-group         = aws_cloudwatch_log_group.adot.name
          awslogs-region        = var.aws_region
          awslogs-stream-prefix = "frontend-adot"
        }
      }

      healthCheck = {
        command     = ["CMD", "/healthcheck"]
        interval    = 5
        timeout     = 6
        retries     = 5
        startPeriod = 1
      }

      essential = false
    }
  ])
}

# Backend Task Definition
resource "aws_ecs_task_definition" "backend" {
  family                   = "${var.project_name}-backend"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = var.backend_cpu
  memory                   = var.backend_memory
  execution_role_arn       = aws_iam_role.ecs_task_execution_role.arn
  task_role_arn           = aws_iam_role.ecs_task_role.arn

  container_definitions = jsonencode([
    {
      name  = "backend"
      image = "${aws_ecr_repository.backend.repository_url}:${var.backend_image_tag}"
      
      portMappings = [
        {
          containerPort = 8000
          protocol      = "tcp"
        }
      ]

      environment = [
        {
          name  = "DATABASE_HOST"
          value = module.aurora.cluster_endpoint
        },
        {
          name  = "DATABASE_PORT"
          value = tostring(module.aurora.cluster_port)
        },
        {
          name  = "DATABASE_NAME"
          value = var.db_name
        },
        {
          name  = "DATABASE_USERNAME"
          value = var.db_username
        },
        {
          name = "OTEL_PYTHON_DISTRO"
          value = "aws_distro"
        },
        {
          name = "OTEL_PYTHON_CONFIGURATOR"
          value = "aws_configurator"
        }
      ]

      secrets = [
        {
          name      = "DATABASE_PASSWORD"
          valueFrom = module.aurora.cluster_master_user_secret[0].secret_arn
        }
      ]

      logConfiguration = {
        logDriver = "awslogs"
        options = {
          awslogs-group         = aws_cloudwatch_log_group.backend.name
          awslogs-region        = var.aws_region
          awslogs-stream-prefix = "backend"
        }
      }


      essential = true
    },
    {
      name  = "aws-otel-collector"
      image = "amazon/aws-otel-collector:latest"
      cpu   = var.adot_cpu
      memory = var.adot_memory

      logConfiguration = {
        logDriver = "awslogs"
        options = {
          awslogs-group         = aws_cloudwatch_log_group.adot.name
          awslogs-region        = var.aws_region
          awslogs-stream-prefix = "backend-adot"
        }
      }

      healthCheck = {
        command     = ["CMD", "/healthcheck"]
        interval    = 5
        timeout     = 6
        retries     = 5
        startPeriod = 1
      }

      essential = false
    }
  ])
}

# =============================================================================
# ECS SERVICE DISCOVERY
# =============================================================================

# Private DNS namespace for service discovery
resource "aws_service_discovery_private_dns_namespace" "adot" {
  name        = "adot.local"
  description = "Private DNS namespace for ADOT services"
  vpc         = module.vpc.vpc_id
}

# Service discovery service for backend
resource "aws_service_discovery_service" "backend" {
  name = "backend"

  dns_config {
    namespace_id = aws_service_discovery_private_dns_namespace.adot.id
    
    dns_records {
      ttl  = 10
      type = "A"
    }
    
    routing_policy = "MULTIVALUE"
  }

  health_check_custom_config {}
}

# =============================================================================
# ECS SERVICES
# =============================================================================

# Frontend Service
resource "aws_ecs_service" "frontend" {
  name            = "${var.project_name}-frontend"
  cluster         = module.ecs.cluster_id
  task_definition = aws_ecs_task_definition.frontend.arn
  desired_count   = 1
  launch_type     = "FARGATE"

  network_configuration {
    subnets          = module.vpc.private_subnets
    security_groups  = [aws_security_group.ecs.id]
    assign_public_ip = false
  }

  load_balancer {
    target_group_arn = aws_lb_target_group.frontend.arn
    container_name   = "frontend"
    container_port   = 3000
  }

  depends_on = [
    module.alb,
    aws_lb_target_group.frontend
  ]
}

# Backend Service
resource "aws_ecs_service" "backend" {
  name            = "${var.project_name}-backend"
  cluster         = module.ecs.cluster_id
  task_definition = aws_ecs_task_definition.backend.arn
  desired_count   = 1
  launch_type     = "FARGATE"

  network_configuration {
    subnets          = module.vpc.private_subnets
    security_groups  = [aws_security_group.ecs.id]
    assign_public_ip = false
  }

  service_registries {
    registry_arn = aws_service_discovery_service.backend.arn
  }

  depends_on = [
    module.aurora,
    aws_service_discovery_service.backend
  ]
}
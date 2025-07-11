# =============================================================================
# IDENTITY AND ACCESS MANAGEMENT
# IAM Roles, Policies, and Permissions
# =============================================================================

# ECS Task Execution Role
resource "aws_iam_role" "ecs_task_execution_role" {
  name = local.ecs_task_execution_role_name

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "ecs-tasks.amazonaws.com"
        }
      }
    ]
  })

}

resource "aws_iam_role_policy_attachment" "ecs_task_execution_role_policy" {
  role       = aws_iam_role.ecs_task_execution_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
}

# ECS Task Role
resource "aws_iam_role" "ecs_task_role" {
  name = local.ecs_task_role_name

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "ecs-tasks.amazonaws.com"
        }
      }
    ]
  })

}

# IAM Policy for ADOT Collector
resource "aws_iam_policy" "adot_policy" {
  name        = local.adot_policy_name
  description = "IAM policy for ADOT collector to send telemetry data"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "xray:PutTraceSegments",
          "xray:PutTelemetryRecords"
        ]
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = [
          "cloudwatch:PutMetricData",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = [
          "ecs:DescribeContainerInstances",
          "ecs:DescribeServices",
          "ecs:DescribeTasks",
          "ecs:ListTasks",
          "ec2:DescribeInstances"
        ]
        Resource = "*"
      }
    ]
  })

}

# Attach ADOT policy to ECS task role
resource "aws_iam_role_policy_attachment" "ecs_task_role_adot_policy" {
  role       = aws_iam_role.ecs_task_role.name
  policy_arn = aws_iam_policy.adot_policy.arn
}

# Additional policy for Aurora access (if needed for applications)
resource "aws_iam_policy" "aurora_access_policy" {
  name        = "${var.project_name}-aurora-access-policy"
  description = "IAM policy for Aurora database access"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "secretsmanager:GetSecretValue",
          "secretsmanager:DescribeSecret"
        ]
        Resource = module.aurora.cluster_master_user_secret != null ? module.aurora.cluster_master_user_secret[0].secret_arn : null
      },
      {
        Effect = "Allow"
        Action = [
          "rds:DescribeDBClusters",
          "rds:DescribeDBInstances"
        ]
        Resource = "*"
      }
    ]
  })

}

# Attach Aurora access policy to ECS task role
resource "aws_iam_role_policy_attachment" "ecs_task_role_aurora_policy" {
  role       = aws_iam_role.ecs_task_role.name
  policy_arn = aws_iam_policy.aurora_access_policy.arn
}
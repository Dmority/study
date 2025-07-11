# =============================================================================
# OBSERVABILITY RESOURCES
# CloudWatch Logs, X-Ray, and Monitoring Configuration
# =============================================================================

# CloudWatch Log Groups
resource "aws_cloudwatch_log_group" "frontend" {
  name              = local.frontend_log_group
  retention_in_days = 7

}

resource "aws_cloudwatch_log_group" "backend" {
  name              = local.backend_log_group
  retention_in_days = 7

}

resource "aws_cloudwatch_log_group" "adot" {
  name              = local.adot_log_group
  retention_in_days = 7

}

# X-Ray Sampling Rule (Optional - for custom sampling)
resource "aws_xray_sampling_rule" "adot_study" {
  count = var.enable_xray ? 1 : 0

  rule_name      = "${var.project_name}-sampling-rule"
  priority       = 9000
  version        = 1
  reservoir_size = 1
  fixed_rate     = 0.1
  url_path       = "*"
  host           = "*"
  http_method    = "*"
  service_type   = "*"
  service_name   = "*"
  resource_arn   = "*"

}

# CloudWatch Dashboard for ADOT Study
resource "aws_cloudwatch_dashboard" "adot_study" {
  dashboard_name = "${var.project_name}-dashboard"

  dashboard_body = jsonencode({
    widgets = [
      {
        type   = "metric"
        x      = 0
        y      = 0
        width  = 12
        height = 6

        properties = {
          metrics = [
            ["AWS/ECS", "CPUUtilization", "ServiceName", "${var.project_name}-frontend"],
            [".", "MemoryUtilization", ".", "."],
            [".", "CPUUtilization", "ServiceName", "${var.project_name}-backend"],
            [".", "MemoryUtilization", ".", "."]
          ]
          period = 300
          stat   = "Average"
          region = var.aws_region
          title  = "ECS Service Metrics"
        }
      },
      {
        type   = "metric"
        x      = 0
        y      = 6
        width  = 12
        height = 6

        properties = {
          metrics = [
            ["AWS/ApplicationELB", "RequestCount", "LoadBalancer", module.alb.arn_suffix],
            [".", "TargetResponseTime", ".", "."],
            [".", "HTTPCode_Target_2XX_Count", ".", "."],
            [".", "HTTPCode_Target_4XX_Count", ".", "."],
            [".", "HTTPCode_Target_5XX_Count", ".", "."]
          ]
          period = 300
          stat   = "Sum"
          region = var.aws_region
          title  = "ALB Metrics"
        }
      },
      {
        type   = "metric"
        x      = 0
        y      = 12
        width  = 12
        height = 6

        properties = {
          metrics = [
            ["AWS/RDS", "CPUUtilization", "DBClusterIdentifier", module.aurora.cluster_id],
            [".", "DatabaseConnections", ".", "."],
            [".", "ServerlessDatabaseCapacity", ".", "."]
          ]
          period = 300
          stat   = "Average"
          region = var.aws_region
          title  = "Aurora Serverless v2 Metrics"
        }
      }
    ]
  })

}

# CloudWatch Alarms for critical metrics
resource "aws_cloudwatch_metric_alarm" "high_cpu_frontend" {
  alarm_name          = "${var.project_name}-frontend-high-cpu"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "CPUUtilization"
  namespace           = "AWS/ECS"
  period              = "300"
  statistic           = "Average"
  threshold           = "80"
  alarm_description   = "This metric monitors frontend CPU utilization"
  alarm_actions       = []

  dimensions = {
    ServiceName = "${var.project_name}-frontend"
  }

}

resource "aws_cloudwatch_metric_alarm" "high_cpu_backend" {
  alarm_name          = "${var.project_name}-backend-high-cpu"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "CPUUtilization"
  namespace           = "AWS/ECS"
  period              = "300"
  statistic           = "Average"
  threshold           = "80"
  alarm_description   = "This metric monitors backend CPU utilization"
  alarm_actions       = []

  dimensions = {
    ServiceName = "${var.project_name}-backend"
  }

}

resource "aws_cloudwatch_metric_alarm" "alb_response_time" {
  alarm_name          = "${var.project_name}-alb-high-response-time"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "TargetResponseTime"
  namespace           = "AWS/ApplicationELB"
  period              = "300"
  statistic           = "Average"
  threshold           = "1"
  alarm_description   = "This metric monitors ALB response time"
  alarm_actions       = []

  dimensions = {
    LoadBalancer = module.alb.arn_suffix
  }

}
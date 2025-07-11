# =============================================================================
# DATABASE RESOURCES
# Aurora Serverless v2 and Database Configuration
# =============================================================================

# Aurora Serverless v2 Cluster
module "aurora" {
  source = "terraform-aws-modules/rds-aurora/aws"
  version = "~> 9.0"

  name           = local.aurora_cluster_name
  engine         = "aurora-postgresql"
  engine_version = "17.5"
  engine_mode    = "provisioned"

  serverlessv2_scaling_configuration = {
    max_capacity = var.aurora_max_capacity
    min_capacity = var.aurora_min_capacity
  }

  instance_class = "db.serverless"
  instances = {
    one = {}
  }

  vpc_id               = module.vpc.vpc_id
  db_subnet_group_name = module.vpc.database_subnet_group_name
  vpc_security_group_ids = [aws_security_group.aurora.id]

  storage_encrypted   = true
  apply_immediately   = true
  monitoring_interval = 60

  enabled_cloudwatch_logs_exports = ["postgresql"]

  database_name   = var.db_name
  master_username = var.db_username
  manage_master_user_password = true

  backup_retention_period = 1
  preferred_backup_window = "07:00-09:00"
  preferred_maintenance_window = "sun:09:00-sun:10:00"

  # Enhanced monitoring
  create_monitoring_role = true

  # Performance Insights
  performance_insights_enabled = true
  performance_insights_retention_period = 7

  # Deletion protection for production
  deletion_protection = false  # Set to true for production

}

# Aurora Parameter Group (Optional - for custom parameters)
resource "aws_rds_cluster_parameter_group" "aurora" {
  family      = "aurora-postgresql17"
  name        = "${var.project_name}-aurora-cluster-pg"
  description = "Aurora cluster parameter group for ${var.project_name}"

  parameter {
    name  = "shared_preload_libraries"
    value = "pg_stat_statements"
  }

  parameter {
    name  = "log_statement"
    value = "all"
  }

  parameter {
    name  = "log_min_duration_statement"
    value = "1000"  # Log statements taking more than 1 second
  }

}

# Aurora DB Parameter Group (Optional - for instance-level parameters)
resource "aws_db_parameter_group" "aurora" {
  family = "aurora-postgresql17"
  name   = "${var.project_name}-aurora-db-pg"

  parameter {
    name  = "log_rotation_age"
    value = "1440"  # 24 hours
  }

  parameter {
    name  = "log_rotation_size"
    value = "102400"  # 100MB
  }

}
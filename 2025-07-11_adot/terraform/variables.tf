variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "us-east-1"
}

variable "project_name" {
  description = "Project name used for resource naming"
  type        = string
  default     = "adot-study"
}

variable "environment" {
  description = "Environment name"
  type        = string
  default     = "dev"
}

variable "vpc_cidr" {
  description = "CIDR block for VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "db_name" {
  description = "Database name"
  type        = string
  default     = "adotdb"
}

variable "db_username" {
  description = "Database master username"
  type        = string
  default     = "adotuser"
}

variable "frontend_image_tag" {
  description = "Frontend container image tag"
  type        = string
  default     = "latest"
}

variable "backend_image_tag" {
  description = "Backend container image tag"
  type        = string
  default     = "latest"
}

variable "adot_image" {
  description = "ADOT collector image"
  type        = string
  default     = "public.ecr.aws/aws-observability/aws-otel-collector:latest"
}

variable "frontend_cpu" {
  description = "CPU units for frontend task"
  type        = number
  default     = 256
}

variable "frontend_memory" {
  description = "Memory (MB) for frontend task"
  type        = number
  default     = 512
}

variable "backend_cpu" {
  description = "CPU units for backend task"
  type        = number
  default     = 256
}

variable "backend_memory" {
  description = "Memory (MB) for backend task"
  type        = number
  default     = 512
}

variable "adot_cpu" {
  description = "CPU units for ADOT collector sidecar"
  type        = number
  default     = 256
}

variable "adot_memory" {
  description = "Memory (MB) for ADOT collector sidecar"
  type        = number
  default     = 256
}

variable "enable_container_insights" {
  description = "Enable CloudWatch Container Insights"
  type        = bool
  default     = true
}

variable "enable_xray" {
  description = "Enable AWS X-Ray tracing"
  type        = bool
  default     = true
}

variable "aurora_min_capacity" {
  description = "Minimum Aurora Serverless v2 capacity"
  type        = number
  default     = 0.5
}

variable "aurora_max_capacity" {
  description = "Maximum Aurora Serverless v2 capacity"
  type        = number
  default     = 1.0
}


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
      Project   = "aws-study"
      ManagedBy = "terraform"
    }
  }
}
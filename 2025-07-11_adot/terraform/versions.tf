terraform {
  required_version = ">= 1.0"
}

# Optional: Configure remote state backend
# Uncomment and configure for production use
# terraform {
#   backend "s3" {
#     bucket = "your-terraform-state-bucket"
#     key    = "adot-study/terraform.tfstate"
#     region = "us-east-1"
#     
#     # Optional: DynamoDB table for state locking
#     dynamodb_table = "terraform-state-lock"
#   }
# }
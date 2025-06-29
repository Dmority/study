#!/workspace/myenv/bin/python
"""
Generate AWS 3-Tier Architecture Diagram

Prerequisites:
pip install diagrams
apt-get install graphviz (or brew install graphviz on macOS)

Usage:
python3 generate_diagram.py
"""

try:
    from diagrams import Diagram, Cluster, Edge
    from diagrams.aws.compute import EC2, AutoScaling
    from diagrams.aws.database import RDS
    from diagrams.aws.network import ELB, InternetGateway, NATGateway
    from diagrams.aws.management import Cloudwatch
    from diagrams.aws.integration import SNS
    from diagrams.aws.storage import S3
    from diagrams.onprem.client import Users
    
    DIAGRAMS_AVAILABLE = True
except ImportError as e:
    DIAGRAMS_AVAILABLE = False
    print(f"Warning: Import error: {e}")
    print("Warning: 'diagrams' library not available. Install with: pip install diagrams")

def generate_aws_architecture():
    """Generate the AWS 3-tier architecture diagram"""
    
    if not DIAGRAMS_AVAILABLE:
        print("Cannot generate diagram - 'diagrams' library not installed")
        print("Install with: pip install diagrams")
        print("Also install graphviz: apt-get install graphviz (or brew install graphviz)")
        return
    
    with Diagram("AWS 3-Tier Architecture", filename="docs/aws_architecture", show=False, direction="TB"):
        users = Users("Internet Users")
        
        with Cluster("AWS Cloud"):
            igw = InternetGateway("Internet Gateway")
            
            with Cluster("VPC (10.0.0.0/16)"):
                with Cluster("Public Subnets"):
                    with Cluster("AZ-A: 10.0.1.0/24"):
                        alb = ELB("Application\nLoad Balancer")
                        nat_a = NATGateway("NAT GW A")
                    
                    with Cluster("AZ-B: 10.0.2.0/24"):
                        nat_b = NATGateway("NAT GW B")
                
                with Cluster("Private Subnets (Application Tier)"):
                    with Cluster("AZ-A: 10.0.10.0/24"):
                        ec2_a = EC2("EC2\nInstance A")
                    
                    with Cluster("AZ-B: 10.0.11.0/24"):
                        ec2_b = EC2("EC2\nInstance B")
                    
                    asg = AutoScaling("Auto Scaling\nGroup")
                
                with Cluster("Database Subnets (Data Tier)"):
                    with Cluster("AZ-A: 10.0.20.0/24 | AZ-B: 10.0.21.0/24"):
                        rds = RDS("RDS MySQL\n(Multi-AZ)")
                
                
                with Cluster("Monitoring & Alerts"):
                    cloudwatch = Cloudwatch("CloudWatch\nMetrics & Logs")
                    sns = SNS("SNS\nSecurity Alerts")
                
                with Cluster("Terraform State"):
                    s3 = S3("S3 Backend\n+ DynamoDB Lock")
        
        # Main traffic flow
        users >> Edge(label="HTTPS/HTTP", style="bold") >> igw
        igw >> Edge(label="Traffic", style="bold") >> alb
        alb >> Edge(label="HTTP", style="bold") >> [ec2_a, ec2_b]
        [ec2_a, ec2_b] >> Edge(label="MySQL", style="bold") >> rds
        
        # Outbound internet access
        ec2_a >> Edge(label="Updates", style="dashed") >> nat_a >> igw
        ec2_b >> Edge(label="Updates", style="dashed") >> nat_b >> igw
        
        # Auto Scaling management
        asg >> Edge(label="Manages", style="dotted") >> [ec2_a, ec2_b]
        
        
        # Monitoring
        [alb, ec2_a, ec2_b, rds] >> Edge(label="Metrics", style="dotted") >> cloudwatch
        cloudwatch >> Edge(label="Alerts", style="dotted") >> sns

def main():
    """Main function"""
    print("Generating AWS 3-Tier Architecture Diagram...")
    
    if DIAGRAMS_AVAILABLE:
        generate_aws_architecture()
        print("✅ AWS Architecture diagram generated: docs/aws_architecture.png")
        print("📋 ASCII diagram is also available in docs/IMPLEMENTATION_PLAN.md")
    else:
        print("❌ Cannot generate PNG diagram - missing dependencies")
        print("📋 ASCII diagram is available in docs/IMPLEMENTATION_PLAN.md")
        print("\nTo generate PNG diagram, install dependencies:")
        print("1. pip install diagrams")
        print("2. apt-get install graphviz (Ubuntu/Debian) or brew install graphviz (macOS)")

if __name__ == "__main__":
    main()
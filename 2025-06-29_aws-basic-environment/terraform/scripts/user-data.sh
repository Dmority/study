#!/bin/bash
yum update -y
yum install -y httpd
systemctl start httpd
systemctl enable httpd

# Create a simple web page
cat <<EOF > /var/www/html/index.html
<!DOCTYPE html>
<html>
<head>
    <title>AWS 3-Tier Architecture Demo</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; }
        .container { max-width: 800px; margin: 0 auto; }
        .header { background: #232f3e; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background: #f5f5f5; }
        .info { background: white; padding: 15px; margin: 10px 0; border-left: 4px solid #232f3e; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🚀 AWS 3-Tier Architecture</h1>
            <p>Successfully deployed with Terraform!</p>
        </div>
        <div class="content">
            <div class="info">
                <h3>📊 System Information</h3>
                <p><strong>Instance ID:</strong> $(curl -s http://169.254.169.254/latest/meta-data/instance-id)</p>
                <p><strong>Availability Zone:</strong> $(curl -s http://169.254.169.254/latest/meta-data/placement/availability-zone)</p>
                <p><strong>Instance Type:</strong> $(curl -s http://169.254.169.254/latest/meta-data/instance-type)</p>
                <p><strong>Local IP:</strong> $(curl -s http://169.254.169.254/latest/meta-data/local-ipv4)</p>
            </div>
            <div class="info">
                <h3>🏗️ Architecture Components</h3>
                <ul>
                    <li>✅ Application Load Balancer (ALB)</li>
                    <li>✅ Auto Scaling Group</li>
                    <li>✅ EC2 Instances (Multi-AZ)</li>
                    <li>✅ RDS MySQL Database</li>
                    <li>✅ VPC with Public/Private Subnets</li>
                    <li>✅ Security Groups</li>
                </ul>
            </div>
            <div class="info">
                <h3>🔒 Security Features</h3>
                <ul>
                    <li>✅ VPC Flow Logs Enabled</li>
                    <li>✅ Encrypted RDS Storage</li>
                    <li>✅ Security Groups with Least Privilege</li>
                    <li>✅ Private Subnets for Application Layer</li>
                </ul>
            </div>
        </div>
    </div>
</body>
</html>
EOF

# Install CloudWatch agent
yum install -y amazon-cloudwatch-agent
systemctl enable amazon-cloudwatch-agent
systemctl start amazon-cloudwatch-agent
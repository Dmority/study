# AWS Security and Best Practices

## Core Security Principles

### 1. Least Privilege Access
- Grant minimum permissions required for functionality
- Use specific resource ARNs instead of wildcards
- Regularly review and audit permissions
- Implement role-based access control

### 2. Defense in Depth
- Multiple layers of security controls
- Network segmentation with security groups
- Encryption at rest and in transit
- Regular security assessments

### 3. Zero Trust Architecture
- Verify every connection and device
- Never trust, always verify
- Implement strong authentication
- Monitor all network traffic

## Security Scanning with Trivy

### Trivy Integration
Trivy is used for comprehensive security scanning of:
- Container images
- Infrastructure as Code (Terraform)
- File systems
- Git repositories

### Trivy Configuration
```yaml
# .trivyignore - Define exceptions if needed
# CVE-2021-12345  # Reason for ignoring

# trivy.yaml - Trivy configuration
format: json
severity: HIGH,CRITICAL
ignore-unfixed: true
timeout: 10m
```

### Pre-commit Hooks with Trivy
```yaml
# .pre-commit-config.yaml
repos:
  - repo: https://github.com/aquasecurity/trivy
    rev: v0.45.0
    hooks:
      - id: trivy-config
        args: ['--severity', 'HIGH,CRITICAL', '--exit-code', '1']
      - id: trivy-fs
        args: ['--severity', 'HIGH,CRITICAL', '--exit-code', '1']
```

### Terraform Security Scanning
```bash
# Scan Terraform configurations
trivy config terraform/ --severity HIGH,CRITICAL --exit-code 1

# Scan with custom format
trivy config terraform/ --format sarif --output trivy-results.sarif --severity HIGH,CRITICAL

# Continuous scanning in CI/CD
trivy config --quiet terraform/ --severity HIGH,CRITICAL --exit-code 1
```

## Alerting for HIGH and CRITICAL Vulnerabilities

### SNS Topic for Security Alerts
```hcl
resource "aws_sns_topic" "security_alerts" {
  name = "${var.environment}-${var.project_name}-security-alerts"

  tags = merge(local.common_tags, {
    Name = "${var.environment}-${var.project_name}-security-alerts"
    Type = "security"
  })
}

resource "aws_sns_topic_subscription" "security_email" {
  topic_arn = aws_sns_topic.security_alerts.arn
  protocol  = "email"
  endpoint  = var.security_team_email
}

resource "aws_sns_topic_subscription" "security_slack" {
  count     = var.slack_webhook_url != "" ? 1 : 0
  topic_arn = aws_sns_topic.security_alerts.arn
  protocol  = "https"
  endpoint  = var.slack_webhook_url
}
```

### CloudWatch Alarms for Security Events
```hcl
# GuardDuty High/Critical findings alarm
resource "aws_cloudwatch_metric_alarm" "guardduty_high_severity" {
  alarm_name          = "${var.environment}-${var.project_name}-guardduty-high-severity"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "1"
  metric_name         = "FindingCount"
  namespace           = "AWS/GuardDuty"
  period              = "300"
  statistic           = "Sum"
  threshold           = "0"
  alarm_description   = "GuardDuty HIGH or CRITICAL severity findings detected"
  alarm_actions       = [aws_sns_topic.security_alerts.arn]

  dimensions = {
    DetectorId = aws_guardduty_detector.main.id
    Severity   = "High"
  }
}

resource "aws_cloudwatch_metric_alarm" "guardduty_critical_severity" {
  alarm_name          = "${var.environment}-${var.project_name}-guardduty-critical-severity"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "1"
  metric_name         = "FindingCount"
  namespace           = "AWS/GuardDuty"
  period              = "300"
  statistic           = "Sum"
  threshold           = "0"
  alarm_description   = "GuardDuty CRITICAL severity findings detected"
  alarm_actions       = [aws_sns_topic.security_alerts.arn]
  treat_missing_data  = "notBreaching"

  dimensions = {
    DetectorId = aws_guardduty_detector.main.id
    Severity   = "Critical"
  }
}

# CloudTrail suspicious activity alarm
resource "aws_cloudwatch_metric_alarm" "unauthorized_api_calls" {
  alarm_name          = "${var.environment}-${var.project_name}-unauthorized-api-calls"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "1"
  metric_name         = aws_cloudwatch_log_metric_filter.unauthorized_api_calls.name
  namespace           = "AWS/CloudTrail"
  period              = "300"
  statistic           = "Sum"
  threshold           = "0"
  alarm_description   = "Unauthorized API calls detected"
  alarm_actions       = [aws_sns_topic.security_alerts.arn]
}
```

### CloudWatch Log Metric Filters
```hcl
# Metric filter for unauthorized API calls
resource "aws_cloudwatch_log_metric_filter" "unauthorized_api_calls" {
  name           = "${var.environment}-${var.project_name}-unauthorized-api-calls"
  log_group_name = aws_cloudwatch_log_group.cloudtrail.name
  pattern        = "{ ($.errorCode = \"*UnauthorizedOperation\") || ($.errorCode = \"AccessDenied*\") }"

  metric_transformation {
    name      = "UnauthorizedAPICalls"
    namespace = "AWS/CloudTrail"
    value     = "1"
  }
}

# Metric filter for root account usage
resource "aws_cloudwatch_log_metric_filter" "root_usage" {
  name           = "${var.environment}-${var.project_name}-root-usage"
  log_group_name = aws_cloudwatch_log_group.cloudtrail.name
  pattern        = "{ $.userIdentity.type = \"Root\" && $.userIdentity.invokedBy NOT EXISTS && $.eventType != \"AwsServiceEvent\" }"

  metric_transformation {
    name      = "RootUsage"
    namespace = "AWS/CloudTrail"
    value     = "1"
  }
}

# Metric filter for security group changes
resource "aws_cloudwatch_log_metric_filter" "security_group_changes" {
  name           = "${var.environment}-${var.project_name}-sg-changes"
  log_group_name = aws_cloudwatch_log_group.cloudtrail.name
  pattern        = "{ ($.eventName = AuthorizeSecurityGroupIngress) || ($.eventName = AuthorizeSecurityGroupEgress) || ($.eventName = RevokeSecurityGroupIngress) || ($.eventName = RevokeSecurityGroupEgress) || ($.eventName = CreateSecurityGroup) || ($.eventName = DeleteSecurityGroup) }"

  metric_transformation {
    name      = "SecurityGroupChanges"
    namespace = "AWS/CloudTrail"
    value     = "1"
  }
}
```

### Lambda Function for Trivy Scanning Alerts
```hcl
# Lambda function for processing Trivy scan results
resource "aws_lambda_function" "trivy_alert_processor" {
  filename         = "trivy-alert-processor.zip"
  function_name    = "${var.environment}-${var.project_name}-trivy-alert-processor"
  role            = aws_iam_role.trivy_lambda_role.arn
  handler         = "index.handler"
  source_code_hash = data.archive_file.trivy_lambda_zip.output_base64sha256
  runtime         = "python3.9"
  timeout         = 60

  environment {
    variables = {
      SNS_TOPIC_ARN = aws_sns_topic.security_alerts.arn
    }
  }
}

# Lambda IAM role
resource "aws_iam_role" "trivy_lambda_role" {
  name = "${var.environment}-${var.project_name}-trivy-lambda-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "lambda.amazonaws.com"
        }
      }
    ]
  })
}

resource "aws_iam_role_policy" "trivy_lambda_policy" {
  name = "${var.environment}-${var.project_name}-trivy-lambda-policy"
  role = aws_iam_role.trivy_lambda_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = "arn:aws:logs:*:*:*"
      },
      {
        Effect = "Allow"
        Action = [
          "sns:Publish"
        ]
        Resource = aws_sns_topic.security_alerts.arn
      }
    ]
  })
}
```

### EventBridge Rules for Security Events
```hcl
# EventBridge rule for GuardDuty findings
resource "aws_cloudwatch_event_rule" "guardduty_findings" {
  name        = "${var.environment}-${var.project_name}-guardduty-findings"
  description = "Capture GuardDuty HIGH and CRITICAL findings"

  event_pattern = jsonencode({
    source      = ["aws.guardduty"]
    detail-type = ["GuardDuty Finding"]
    detail = {
      severity = ["HIGH", "CRITICAL", "8.0", "8.1", "8.2", "8.3", "8.4", "8.5", "8.6", "8.7", "8.8", "8.9", "9.0", "9.1", "9.2", "9.3", "9.4", "9.5", "9.6", "9.7", "9.8", "9.9", "10.0"]
    }
  })
}

resource "aws_cloudwatch_event_target" "guardduty_sns" {
  rule      = aws_cloudwatch_event_rule.guardduty_findings.name
  target_id = "SendToSNS"
  arn       = aws_sns_topic.security_alerts.arn
}

# EventBridge rule for Security Hub findings
resource "aws_cloudwatch_event_rule" "security_hub_findings" {
  name        = "${var.environment}-${var.project_name}-security-hub-findings"
  description = "Capture Security Hub HIGH and CRITICAL findings"

  event_pattern = jsonencode({
    source      = ["aws.securityhub"]
    detail-type = ["Security Hub Findings - Imported"]
    detail = {
      findings = {
        Severity = {
          Label = ["HIGH", "CRITICAL"]
        }
      }
    }
  })
}

resource "aws_cloudwatch_event_target" "security_hub_sns" {
  rule      = aws_cloudwatch_event_rule.security_hub_findings.name
  target_id = "SendToSNS"
  arn       = aws_sns_topic.security_alerts.arn
}
```

## CI/CD Pipeline Security Integration

### GitHub Actions with Trivy
```yaml
# .github/workflows/security-scan.yml
name: Security Scan

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  trivy-scan:
    name: Trivy Security Scan
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v3

      - name: Run Trivy vulnerability scanner in IaC mode
        uses: aquasecurity/trivy-action@master
        with:
          scan-type: 'config'
          scan-ref: 'terraform/'
          format: 'sarif'
          output: 'trivy-results.sarif'
          severity: 'HIGH,CRITICAL'
          exit-code: '1'

      - name: Upload Trivy scan results to GitHub Security tab
        uses: github/codeql-action/upload-sarif@v2
        if: always()
        with:
          sarif_file: 'trivy-results.sarif'

      - name: Send alert on HIGH/CRITICAL findings
        if: failure()
        uses: 8398a7/action-slack@v3
        with:
          status: failure
          channel: '#security-alerts'
          webhook_url: ${{ secrets.SLACK_WEBHOOK }}
          message: |
            🚨 HIGH/CRITICAL security vulnerabilities found in ${{ github.repository }}
            Branch: ${{ github.ref }}
            Commit: ${{ github.sha }}
            View details: ${{ github.server_url }}/${{ github.repository }}/actions/runs/${{ github.run_id }}
```

### Pre-deployment Security Gate
```bash
#!/bin/bash
# scripts/security-gate.sh

echo "🔍 Running security gate checks..."

# Run Trivy config scan
echo "Scanning Terraform configurations..."
trivy config terraform/ --severity HIGH,CRITICAL --exit-code 1 --format json --output trivy-config.json

# Check for HIGH/CRITICAL findings
HIGH_CRITICAL_COUNT=$(jq '[.Results[]?.Misconfigurations[]? | select(.Severity == "HIGH" or .Severity == "CRITICAL")] | length' trivy-config.json)

if [ "$HIGH_CRITICAL_COUNT" -gt 0 ]; then
    echo "❌ Security Gate FAILED: Found $HIGH_CRITICAL_COUNT HIGH/CRITICAL security issues"
    echo "📋 Summary of findings:"
    jq -r '.Results[]?.Misconfigurations[]? | select(.Severity == "HIGH" or .Severity == "CRITICAL") | "- \(.ID): \(.Title) [\(.Severity)]"' trivy-config.json
    
    # Send alert
    aws sns publish \
        --topic-arn "${SNS_TOPIC_ARN}" \
        --message "Security Gate Failed: $HIGH_CRITICAL_COUNT HIGH/CRITICAL vulnerabilities found in ${ENVIRONMENT} deployment" \
        --subject "🚨 Security Alert: Deployment Blocked"
    
    exit 1
else
    echo "✅ Security Gate PASSED: No HIGH/CRITICAL security issues found"
fi
```

## Security Validation Checklist

### Pre-deployment Security Review
- [ ] Trivy scan passes with no HIGH/CRITICAL findings
- [ ] All security groups follow least privilege
- [ ] No hardcoded secrets in code
- [ ] All data encrypted at rest and in transit
- [ ] CloudTrail enabled for audit logging
- [ ] VPC Flow Logs enabled
- [ ] GuardDuty enabled for threat detection
- [ ] Security Hub enabled and configured
- [ ] SNS alerts configured for HIGH/CRITICAL findings
- [ ] EventBridge rules active for security events

### Continuous Security Monitoring
- [ ] Trivy scanning integrated in CI/CD pipeline
- [ ] Real-time alerts for HIGH/CRITICAL vulnerabilities
- [ ] GuardDuty findings monitored and acted upon
- [ ] CloudTrail logs analyzed for suspicious activity
- [ ] Security group changes monitored and alerted
- [ ] Root account usage alerts configured
- [ ] Failed authentication attempts monitored

### Security Response Procedures
- [ ] Incident response plan documented
- [ ] Security team contact information updated
- [ ] Escalation procedures for CRITICAL findings
- [ ] Automated response actions configured
- [ ] Regular security drill exercises conducted
- [ ] Vulnerability remediation SLAs defined
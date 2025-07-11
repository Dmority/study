# ADOT Configuration Planning

## Overview
This document outlines the configuration strategy for AWS Distro for OpenTelemetry (ADOT) in our study environment.

## ADOT Collector Deployment Strategy

### Deployment Pattern: Sidecar
- **Rationale**: Each ECS service runs ADOT collector as a sidecar container
- **Benefits**: Isolated configuration, service-specific sampling, simplified networking
- **Configuration**: Shared volume for configuration files

### Alternative: Centralized Collector
- **When to use**: High-volume production environments
- **Benefits**: Centralized configuration, resource optimization
- **Drawbacks**: Single point of failure, complex networking

## Configuration Structure

### Base Configuration
```yaml
# /otel/otel-collector-config.yaml
receivers:
  otlp:
    protocols:
      grpc:
        endpoint: 0.0.0.0:4317
      http:
        endpoint: 0.0.0.0:4318
  
processors:
  batch:
    timeout: 1s
    send_batch_size: 1024
  
  memory_limiter:
    limit_mib: 256
  
exporters:
  awsxray:
    no_verify_ssl: false
    local_mode: false
  
  awscloudwatch:
    namespace: ADOT/Study
    region: us-east-1
  
service:
  pipelines:
    traces:
      receivers: [otlp]
      processors: [memory_limiter, batch]
      exporters: [awsxray]
    
    metrics:
      receivers: [otlp]
      processors: [memory_limiter, batch]
      exporters: [awscloudwatch]
```

## Service-Specific Configurations

### Frontend Service (Next.js)
```yaml
# Frontend-specific ADOT configuration
receivers:
  otlp:
    protocols:
      grpc:
        endpoint: 0.0.0.0:4317
      http:
        endpoint: 0.0.0.0:4318

processors:
  batch:
    timeout: 2s
    send_batch_size: 512
  
  # Filter out health check traces
  filter:
    traces:
      span:
        - 'attributes["http.route"] == "/health"'

exporters:
  awsxray:
    no_verify_ssl: false
    local_mode: false
  
  awscloudwatch:
    namespace: ADOT/Frontend
    region: us-east-1
    dimension_rollup_option: NoDimensionRollup
    metric_declarations:
      - dimensions: [[service.name]]
        metric_name_selectors:
          - "^http_.*"
          - "^react_.*"

service:
  pipelines:
    traces:
      receivers: [otlp]
      processors: [batch, filter]
      exporters: [awsxray]
    
    metrics:
      receivers: [otlp]
      processors: [batch]
      exporters: [awscloudwatch]
```

### Backend Service (FastAPI)
```yaml
# Backend-specific ADOT configuration
receivers:
  otlp:
    protocols:
      grpc:
        endpoint: 0.0.0.0:4317
      http:
        endpoint: 0.0.0.0:4318

processors:
  batch:
    timeout: 1s
    send_batch_size: 1024
  
  # Add service attributes
  resource:
    attributes:
      - key: service.name
        value: "fastapi-backend"
        action: upsert
      - key: service.version
        value: "1.0.0"
        action: upsert

exporters:
  awsxray:
    no_verify_ssl: false
    local_mode: false
  
  awscloudwatch:
    namespace: ADOT/Backend
    region: us-east-1
    metric_declarations:
      - dimensions: [[service.name], [service.name, http.method]]
        metric_name_selectors:
          - "^http_.*"
          - "^database_.*"
          - "^custom_.*"

service:
  pipelines:
    traces:
      receivers: [otlp]
      processors: [batch, resource]
      exporters: [awsxray]
    
    metrics:
      receivers: [otlp]
      processors: [batch, resource]
      exporters: [awscloudwatch]
```

## Instrumentation Strategy

### Automatic Instrumentation

#### FastAPI Backend
```python
# Requirements for auto-instrumentation
opentelemetry-distro==0.38b0
opentelemetry-instrumentation==0.38b0
opentelemetry-exporter-otlp==1.17.0

# Environment variables
OTEL_PYTHON_DISTRO=opentelemetry_distro
OTEL_PYTHON_CONFIGURATOR=opentelemetry_configurator
OTEL_SERVICE_NAME=fastapi-backend
OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4318
OTEL_RESOURCE_ATTRIBUTES=service.name=fastapi-backend,service.version=1.0.0
```

#### Next.js Frontend
```javascript
// Auto-instrumentation with OpenTelemetry
import { NodeSDK } from '@opentelemetry/sdk-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-otlp-http';
import { Resource } from '@opentelemetry/resources';
import { SemanticResourceAttributes } from '@opentelemetry/semantic-conventions';

const sdk = new NodeSDK({
  resource: new Resource({
    [SemanticResourceAttributes.SERVICE_NAME]: 'nextjs-frontend',
    [SemanticResourceAttributes.SERVICE_VERSION]: '1.0.0',
  }),
  traceExporter: new OTLPTraceExporter({
    url: 'http://localhost:4318/v1/traces',
  }),
});

sdk.start();
```

### Custom Instrumentation Examples

#### Business Metrics
```python
from opentelemetry import metrics
from opentelemetry.exporter.otlp.proto.grpc.metric_exporter import OTLPMetricExporter
from opentelemetry.sdk.metrics import MeterProvider
from opentelemetry.sdk.metrics.export import PeriodicExportingMetricReader

# Custom metrics for business logic
meter = metrics.get_meter(__name__)

# Counter for API calls
api_request_counter = meter.create_counter(
    "api_requests_total",
    description="Total number of API requests",
    unit="1"
)

# Histogram for response times
response_time_histogram = meter.create_histogram(
    "api_response_time_seconds",
    description="API response time in seconds",
    unit="s"
)

# Gauge for active connections
active_connections = meter.create_up_down_counter(
    "active_connections",
    description="Number of active database connections",
    unit="1"
)
```

#### Custom Spans
```python
from opentelemetry import trace
from opentelemetry.trace import Status, StatusCode

tracer = trace.get_tracer(__name__)

async def process_user_request(user_id: str):
    with tracer.start_as_current_span("process_user_request") as span:
        span.set_attribute("user.id", user_id)
        
        try:
            # Database operation
            with tracer.start_as_current_span("database.query") as db_span:
                db_span.set_attribute("db.operation", "SELECT")
                db_span.set_attribute("db.table", "users")
                user = await get_user_from_db(user_id)
            
            # Business logic
            with tracer.start_as_current_span("business.validation") as biz_span:
                biz_span.set_attribute("validation.type", "user_permissions")
                result = validate_user_permissions(user)
            
            span.set_attribute("operation.success", True)
            return result
            
        except Exception as e:
            span.set_status(Status(StatusCode.ERROR, str(e)))
            span.record_exception(e)
            raise
```

## Sampling Configuration

### Production Sampling Rules
```yaml
# X-Ray sampling rules
sampling_rules:
  version: 2
  default:
    fixed_target: 1
    rate: 0.1
  
  rules:
    - description: "High-value API endpoints"
      service_name: "fastapi-backend"
      http_method: "POST"
      url_path: "/api/critical/*"
      fixed_target: 2
      rate: 0.5
    
    - description: "Health check endpoints"
      service_name: "*"
      http_method: "*"
      url_path: "/health"
      fixed_target: 0
      rate: 0.01
    
    - description: "Static assets"
      service_name: "nextjs-frontend"
      http_method: "GET"
      url_path: "/_next/static/*"
      fixed_target: 0
      rate: 0.001
```

### Development Sampling
```yaml
# Development environment - higher sampling
sampling_rules:
  version: 2
  default:
    fixed_target: 2
    rate: 0.5
```

## Resource Attributes

### Standard Attributes
```yaml
# Common resource attributes for all services
resource_attributes:
  service.name: "${SERVICE_NAME}"
  service.version: "${SERVICE_VERSION}"
  service.namespace: "adot-study"
  deployment.environment: "${ENVIRONMENT}"
  cloud.provider: "aws"
  cloud.platform: "aws_ecs"
  cloud.region: "${AWS_REGION}"
```

### Service-Specific Attributes
```yaml
# Frontend service attributes
frontend_attributes:
  service.name: "nextjs-frontend"
  service.instance.id: "${ECS_TASK_ARN}"
  container.name: "frontend"
  container.image.name: "${ECR_REGISTRY}/frontend"

# Backend service attributes
backend_attributes:
  service.name: "fastapi-backend"
  service.instance.id: "${ECS_TASK_ARN}"
  container.name: "backend"
  container.image.name: "${ECR_REGISTRY}/backend"
```

## Performance Considerations

### Memory Configuration
```yaml
# Memory limiter configuration
processors:
  memory_limiter:
    limit_mib: 256
    spike_limit_mib: 64
    check_interval: 5s
```

### Batch Processing
```yaml
# Optimized batch processing
processors:
  batch:
    timeout: 1s
    send_batch_size: 1024
    send_batch_max_size: 2048
```

### Queue Configuration
```yaml
# Queue management
exporters:
  awsxray:
    sending_queue:
      queue_size: 1000
    retry_on_failure:
      enabled: true
      initial_interval: 1s
      max_interval: 30s
      max_elapsed_time: 300s
```

## Troubleshooting Configuration

### Debug Mode
```yaml
# Enable debug logging
service:
  telemetry:
    logs:
      level: DEBUG
      development: true
```

### Health Check Endpoint
```yaml
# Health check configuration
extensions:
  health_check:
    endpoint: "0.0.0.0:13133"
    path: "/health"
```

### Metrics Endpoint
```yaml
# Collector metrics
service:
  telemetry:
    metrics:
      address: "0.0.0.0:8888"
      level: detailed
```

## Configuration Management

### Environment Variables
```bash
# Common environment variables
OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4318
OTEL_RESOURCE_ATTRIBUTES=service.name=my-service
OTEL_SERVICE_NAME=my-service
OTEL_PROPAGATORS=tracecontext,baggage,xray
```

### Configuration Files
```
/otel/
├── base-config.yaml
├── frontend-config.yaml
├── backend-config.yaml
└── sampling-rules.yaml
```

### Configuration Validation
```bash
# Validate configuration
otelcol --config-validate --config=/otel/config.yaml
```

## Monitoring ADOT Collector

### Key Metrics to Monitor
- `otelcol_processor_batch_batch_send_size_sum`
- `otelcol_exporter_sent_spans_total`
- `otelcol_exporter_send_failed_spans_total`
- `otelcol_processor_memory_limiter_dropped_spans_total`

### Alerts Configuration
```yaml
# CloudWatch alarms for ADOT health
collector_alerts:
  - name: "ADOT Collector High Memory Usage"
    metric: "otelcol_process_memory_rss"
    threshold: 200MB
    comparison: "GreaterThanThreshold"
  
  - name: "ADOT Collector Export Failures"
    metric: "otelcol_exporter_send_failed_spans_total"
    threshold: 10
    comparison: "GreaterThanThreshold"
```
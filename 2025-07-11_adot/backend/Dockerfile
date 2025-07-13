# Production stage
FROM python:3.12-slim

# Install uv
COPY --from=ghcr.io/astral-sh/uv:latest /uv /bin/uv

# Install security updates and clean cache
RUN apt-get update && \
    apt-get upgrade -y && \
    apt-get install -y --no-install-recommends \
        tini && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/*

# Create non-root user
RUN groupadd -r appuser && \
    useradd -r -g appuser -d /app -s /bin/bash appuser

# Set working directory
WORKDIR /app

# Copy dependency files and application code
COPY --chown=appuser:appuser pyproject.toml uv.lock ./
COPY --chown=appuser:appuser . .

# Install dependencies in container (creates proper paths)
RUN uv sync --frozen --no-install-project --no-dev

# Switch to non-root user
USER appuser

# Set environment variables
ENV PATH="/app/.venv/bin:$PATH"
ENV PYTHONPATH="/app"
ENV PYTHONUNBUFFERED=1
ENV PYTHONDONTWRITEBYTECODE=1

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:8000/health')" || exit 1

# Expose port
EXPOSE 8000

# Use tini as init system for proper signal handling
ENTRYPOINT ["tini", "--"]

# Run the application with OpenTelemetry auto-instrumentation
CMD ["/app/.venv/bin/python", "-c", "from opentelemetry.instrumentation.auto_instrumentation import run; import sys; sys.argv = ['opentelemetry-instrument', 'uvicorn', 'main:app', '--host', '0.0.0.0', '--port', '8000']; run()"]
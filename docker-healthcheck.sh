#!/bin/sh
# Docker health check script for ServiceFormAI OS
# Returns 0 if healthy, 1 if unhealthy

# Check if nginx is running
if ! pgrep nginx > /dev/null; then
    echo "ERROR: nginx is not running"
    exit 1
fi

# Check if health endpoint responds
if ! curl -f http://localhost:8080/health > /dev/null 2>&1; then
    echo "ERROR: health endpoint not responding"
    exit 1
fi

echo "OK: Service is healthy"
exit 0

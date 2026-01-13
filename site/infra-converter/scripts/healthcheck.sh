#!/bin/bash

# Health check script for converter service
# Returns 0 if healthy, 1 if unhealthy

CONVERTER_URL="${CONVERTER_URL:-http://localhost:8787}"

# Check if service is responding
response=$(curl -s -o /dev/null -w "%{http_code}" "$CONVERTER_URL/health" 2>/dev/null)

if [ "$response" = "200" ]; then
  echo "✓ Converter service is healthy"
  exit 0
else
  echo "✗ Converter service is unhealthy (HTTP $response)"
  exit 1
fi

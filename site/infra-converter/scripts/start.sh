#!/bin/bash
set -e

echo "=========================================="
echo "Starting Presentation Converter Service"
echo "=========================================="
echo ""

# Navigate to server directory
cd "$(dirname "$0")/../server"

# Check if .env exists
if [ ! -f .env ]; then
  echo "ERROR: .env file not found!"
  echo "Please copy .env.example to .env and configure it."
  exit 1
fi

# Check if node_modules exists
if [ ! -d node_modules ]; then
  echo "Installing dependencies..."
  npm install
fi

# Start the server
echo "Starting server on port ${PORT:-8787}..."
npm start

#!/usr/bin/env bash
set -euo pipefail

echo "========================================"
echo "  OpenAI Reverse Proxy — Quick Start"
echo "========================================"

# Check Node.js
if ! command -v node &>/dev/null; then
  echo "❌  Node.js is not installed. Please install Node.js 18+ from https://nodejs.org"
  exit 1
fi

NODE_MAJOR=$(node -e "console.log(process.versions.node.split('.')[0])")
if [ "$NODE_MAJOR" -lt 18 ]; then
  echo "❌  Node.js 18 or higher is required (found $(node -v))."
  exit 1
fi

# Copy .env if it doesn't exist
if [ ! -f .env ]; then
  if [ -f .env.example ]; then
    cp .env.example .env
    echo "📄  Created .env from .env.example — edit it to configure your providers."
  fi
fi

# Install dependencies if needed
if [ ! -d node_modules ]; then
  echo "📦  Installing dependencies..."
  npm install
fi

# Build TypeScript
echo "🔨  Building TypeScript..."
npm run build

echo ""
echo "🚀  Starting proxy..."
echo "   Base URL for clients: http://localhost:${PORT:-3000}/v1"
echo "   Press Ctrl+C to stop."
echo ""

npm start

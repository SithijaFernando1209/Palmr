#!/usr/bin/env bash
set -euo pipefail

REPO="kyantech/palmr"

echo "🚀 Building ${REPO} image for ARM64 (local load)"

# Ensure the buildx builder exists and is selected
if ! docker buildx inspect palmr-builder >/dev/null 2>&1; then
  docker buildx create --name palmr-builder --use
else
  docker buildx use palmr-builder
fi

# Build ONE platform when using --load (Apple Silicon => arm64)
if docker buildx build \
  --platform linux/arm64 \
  --no-cache \
  -t "${REPO}:latest" \
  --load \
  . ; then
  echo "✅ Build loaded into local Docker."
  echo ""
  echo "Built for platform: linux/arm64"
  echo ""
  echo "Access points (once you run the container):"
  echo "- API: http://localhost:3333"
  echo "- Web App: http://localhost:5487"
  echo ""
  echo "Read the docs for more information"
else
  echo "❌ Build failed!"
  exit 1
fi
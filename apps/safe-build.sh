#!/usr/bin/env bash
# safe-build.sh — Safe Next.js build for WSL2/Windows environments
# Fixes the .next/trace phantom entry issue by cleaning before build

set -e

PLAYGROUND_DIR="$(cd "$(dirname "$0")/.." && pwd)"
NEXT_DIR="$PLAYGROUND_DIR/.next"

echo "==> India-MCP Safe Build"
echo "    Playground: $PLAYGROUND_DIR"

# Clean any corrupted .next from previous Windows runs
if [ -d "$NEXT_DIR" ]; then
    echo "==> Cleaning corrupted .next/ directory..."
    # Remove via Windows cmd to avoid WSL/Windows FS interop issues
    cmd //c "rd /s /q $(wslpath -w "$NEXT_DIR")" 2>/dev/null || true
    rm -rf "$NEXT_DIR" 2>/dev/null || true
    echo "    .next/ cleaned."
fi

# Run the build
echo "==> Running Next.js build..."
cd "$PLAYGROUND_DIR"
npm run build

echo "==> Build complete."

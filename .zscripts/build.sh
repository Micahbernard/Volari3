#!/bin/bash
set -e

PROJECT_ROOT="/mnt/agents/output/app"
BUILD_DIR="/tmp/nextjs-build-$$"

echo "==> Syncing project to $BUILD_DIR..."
rm -rf "$BUILD_DIR"
mkdir -p "$BUILD_DIR"

# Sync source files (excluding node_modules, .next, etc.)
cp -r "$PROJECT_ROOT"/*.json "$BUILD_DIR/" 2>/dev/null || true
cp -r "$PROJECT_ROOT"/*.ts "$BUILD_DIR/" 2>/dev/null || true
cp -r "$PROJECT_ROOT"/*.mjs "$BUILD_DIR/" 2>/dev/null || true
cp -r "$PROJECT_ROOT"/.env "$BUILD_DIR/" 2>/dev/null || true
cp -r "$PROJECT_ROOT"/Caddyfile "$BUILD_DIR/" 2>/dev/null || true
cp -r "$PROJECT_ROOT"/src "$BUILD_DIR/"
cp -r "$PROJECT_ROOT"/public "$BUILD_DIR/"
cp -r "$PROJECT_ROOT"/prisma "$BUILD_DIR/"
cp -r "$PROJECT_ROOT"/db "$BUILD_DIR/"
cp -r "$PROJECT_ROOT"/node_modules "$BUILD_DIR/"

# Add a next.config override with relative distDir for the build dir
# (Next.js will use .next inside BUILD_DIR, which is on /tmp and writable)

cd "$BUILD_DIR"

echo "==> Running Next.js build..."
./node_modules/.bin/next build

echo "==> Copying build output back to project..."
rm -rf "$PROJECT_ROOT/.next"
mkdir -p "$PROJECT_ROOT/.next"
cp -r "$BUILD_DIR/.next"/* "$PROJECT_ROOT/.next/"

# Post-build: copy static files to standalone
cp -r "$PROJECT_ROOT/.next/static" "$PROJECT_ROOT/.next/standalone/.next/"
cp -r "$PROJECT_ROOT/public" "$PROJECT_ROOT/.next/standalone/"

echo "==> Build complete."

#!/bin/bash

# Build script for cross-compiling to ARM64 Linux (Orange Pi 4 LTS)

echo "Building Tauri app for ARM64 Linux (Orange Pi 4 LTS)..."

# Build using Docker
docker build -f Dockerfile.arm64 -t batak-tauri-arm64 .

# Extract the built files
docker create --name batak-tauri-arm64-container batak-tauri-arm64
docker cp batak-tauri-arm64-container:/output ./dist-arm64
docker rm batak-tauri-arm64-container

echo "Build complete! Check ./dist-arm64 for the ARM64 binaries."
echo "Transfer the files to your Orange Pi 4 LTS and run them."
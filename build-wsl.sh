#!/bin/bash

# Build script for cross-compiling to ARM64 Linux using WSL

echo "Building Tauri app for ARM64 Linux (Orange Pi 4 LTS) using WSL..."

# Ensure we're using the rustup-installed Rust (newer version)
source ~/.cargo/env

# Install Tauri CLI if not present (using the newer Rust)
if ! command -v cargo-tauri &> /dev/null; then
    echo "Installing Tauri CLI..."
    cargo install tauri-cli
fi

# Set cross-compilation environment variables
export PKG_CONFIG_ALLOW_CROSS=1
export PKG_CONFIG_PATH="/usr/lib/aarch64-linux-gnu/pkgconfig:/usr/share/pkgconfig"
export CARGO_TARGET_AARCH64_UNKNOWN_LINUX_GNU_LINKER=aarch64-linux-gnu-gcc
export CC_aarch64_unknown_linux_gnu=aarch64-linux-gnu-gcc
export CXX_aarch64_unknown_linux_gnu=aarch64-linux-gnu-g++

# Install npm dependencies
echo "Installing npm dependencies..."
npm install

# Build frontend
echo "Building frontend..."
npm run build

# Build Tauri app for ARM64 using cargo directly
echo "Cross-compiling for ARM64..."
cargo tauri build --target aarch64-unknown-linux-gnu

# Create output directory
mkdir -p dist-arm64

# Copy built files
echo "Copying built files..."
if [ -f "src-tauri/target/aarch64-unknown-linux-gnu/release/batak-tauri" ]; then
    cp "src-tauri/target/aarch64-unknown-linux-gnu/release/batak-tauri" dist-arm64/
    echo "✅ Binary copied to dist-arm64/"
fi

if [ -d "src-tauri/target/aarch64-unknown-linux-gnu/release/bundle" ]; then
    cp -r "src-tauri/target/aarch64-unknown-linux-gnu/release/bundle"/* dist-arm64/ 2>/dev/null || true
    echo "✅ Bundle files copied to dist-arm64/"
fi

echo ""
echo "Build complete!"
echo "Files are available in: dist-arm64/"
echo ""
echo "To transfer to Orange Pi:"
echo "1. Copy dist-arm64/ to your Orange Pi 4 LTS"
echo "2. Install: sudo dpkg -i *.deb  (if .deb exists)"
echo "3. Or run: chmod +x batak-tauri && ./batak-tauri"
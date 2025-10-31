#!/bin/bash

# Alternative build approach - try static linking to avoid system library issues

echo "Attempting static build to avoid ARM64 system library dependencies..."

# Clean previous build
cargo clean

# Set environment for static linking
export PKG_CONFIG_ALLOW_CROSS=1
export CARGO_TARGET_AARCH64_UNKNOWN_LINUX_GNU_LINKER=aarch64-linux-gnu-gcc

# Try building with static linking
export RUSTFLAGS="-C target-feature=+crt-static"

# Alternative: Try building without tauri plugins that might cause issues
echo "Building core binary first..."
cd src-tauri

# Build just the core binary
cargo build --release --target aarch64-unknown-linux-gnu --bin batak-tauri

if [ $? -eq 0 ]; then
    echo "✅ Core binary built successfully!"
    ls -la target/aarch64-unknown-linux-gnu/release/batak-tauri
    
    # Copy to dist
    cd ..
    mkdir -p dist-arm64
    cp src-tauri/target/aarch64-unknown-linux-gnu/release/batak-tauri dist-arm64/
    echo "Binary copied to dist-arm64/"
else
    echo "❌ Core binary build failed"
fi

echo "You can transfer the binary to Orange Pi and run it directly"
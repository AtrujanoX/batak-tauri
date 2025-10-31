#!/bin/bash

# WSL Cross-compilation setup for Orange Pi 4 LTS (ARM64)

echo "Setting up cross-compilation environment in WSL..."

# Update package lists
sudo apt-get update

# Install cross-compilation toolchain
echo "Installing ARM64 cross-compilation toolchain..."
sudo apt-get install -y \
    gcc-aarch64-linux-gnu \
    g++-aarch64-linux-gnu \
    libc6-dev-arm64-cross \
    pkg-config \
    libssl-dev \
    libssl-dev:arm64

# Install development libraries for ARM64
echo "Installing ARM64 development libraries..."
sudo dpkg --add-architecture arm64
sudo apt-get update
sudo apt-get install -y \
    libgtk-3-dev:arm64 \
    libwebkit2gtk-4.0-dev:arm64 \
    libappindicator3-dev:arm64 \
    librsvg2-dev:arm64 \
    libayatana-appindicator3-dev:arm64

# Install Rust if not already installed
if ! command -v rustc &> /dev/null; then
    echo "Installing Rust..."
    curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y
    source ~/.cargo/env
fi

# Install Tauri CLI
echo "Installing Tauri CLI..."
cargo install tauri-cli

# Add ARM64 target
echo "Adding ARM64 target to Rust..."
rustup target add aarch64-unknown-linux-gnu

# Install Node.js (using NodeSource repository)
if ! command -v node &> /dev/null; then
    echo "Installing Node.js..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt-get install -y nodejs
fi

echo "Setup complete!"
echo ""
echo "Next steps:"
echo "1. Copy your project to WSL: cp -r /mnt/d/repos/Daniel/batak-tauri ~/batak-tauri"
echo "2. cd ~/batak-tauri"
echo "3. npm install"
echo "4. Run: ./build-wsl.sh"
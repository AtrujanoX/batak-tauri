#!/bin/bash

echo "=== Orange Pi Setup Script for Tauri Development ==="

# Fix package sources for ARM64
echo "Fixing package sources..."
sudo cp /etc/apt/sources.list /etc/apt/sources.list.backup
sudo tee /etc/apt/sources.list > /dev/null <<EOF
deb http://ports.ubuntu.com/ubuntu-ports/ jammy main restricted universe multiverse
deb http://ports.ubuntu.com/ubuntu-ports/ jammy-updates main restricted universe multiverse
deb http://ports.ubuntu.com/ubuntu-ports/ jammy-security main restricted universe multiverse
deb http://ports.ubuntu.com/ubuntu-ports/ jammy-backports main restricted universe multiverse
EOF

# Update package list
echo "Updating package list..."
sudo apt update

# Install basic development tools
echo "Installing basic development tools..."
sudo apt install -y curl build-essential git pkg-config

# Install Rust via rustup
echo "Installing Rust..."
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y
source $HOME/.cargo/env

# Install Node.js (LTS version)
echo "Installing Node.js..."
curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
sudo apt install -y nodejs

# Install Tauri system dependencies
echo "Installing Tauri system dependencies..."
sudo apt install -y libwebkit2gtk-4.1-dev libgtk-3-dev libayatana-appindicator3-dev librsvg2-dev

# Install Tauri CLI
echo "Installing Tauri CLI..."
cargo install tauri-cli@^2.0.0

echo "=== Setup complete! ==="
echo "Please run 'source ~/.cargo/env' to use Rust in your current session"
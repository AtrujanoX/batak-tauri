#!/bin/bash

# Fix WSL cross-compilation environment for ARM64 GTK libraries

echo "Setting up ARM64 GTK cross-compilation environment..."

# Install pkg-config if missing
sudo apt install -y pkg-config

# Add ARM64 architecture if not already added
sudo dpkg --add-architecture arm64

# Update package lists for ARM64
sudo apt update

# Install ARM64 GTK and WebKit libraries
echo "Installing ARM64 development libraries..."
sudo apt install -y \
    libgtk-3-dev:arm64 \
    libgdk-pixbuf-2.0-dev:arm64 \
    libpango1.0-dev:arm64 \
    libatk1.0-dev:arm64 \
    libcairo-gobject2:arm64 \
    libcairo2-dev:arm64 \
    libglib2.0-dev:arm64 \
    libwebkit2gtk-4.0-dev:arm64 \
    libappindicator3-dev:arm64 \
    librsvg2-dev:arm64 \
    libudev-dev:arm64 \
    libssl-dev:arm64 \
    libdbus-1-dev:arm64

echo "ARM64 libraries installation complete!"

# Set up pkg-config environment for cross-compilation
export PKG_CONFIG_ALLOW_CROSS=1
export PKG_CONFIG_PATH="/usr/lib/aarch64-linux-gnu/pkgconfig:/usr/share/pkgconfig"
export PKG_CONFIG_LIBDIR="/usr/lib/aarch64-linux-gnu/pkgconfig"
export PKG_CONFIG_SYSROOT_DIR="/"

echo "Environment variables set for cross-compilation"
echo "Now you can run: cargo tauri build --target aarch64-unknown-linux-gnu"
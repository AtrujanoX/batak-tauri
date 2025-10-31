# Manual WSL Cross-compilation Commands

Since I can't directly control WSL, here are the exact commands you need to run:

## Step 1: Open WSL and navigate to project
```bash
wsl
cd ~/batak-tauri/batak-tauri
```

## Step 2: Setup environment (one-time)
```bash
# Use the modern Rust from rustup
source ~/.cargo/env

# Install cross-compilation tools
sudo apt install gcc-aarch64-linux-gnu g++-aarch64-linux-gnu libc6-dev-arm64-cross

# Add ARM64 target
rustup target add aarch64-unknown-linux-gnu

# Install Tauri CLI with modern Rust
cargo install tauri-cli
```

## Step 3: Build the project
```bash
# Set environment variables
export PKG_CONFIG_ALLOW_CROSS=1
export PKG_CONFIG_PATH="/usr/lib/aarch64-linux-gnu/pkgconfig:/usr/share/pkgconfig"
export CARGO_TARGET_AARCH64_UNKNOWN_LINUX_GNU_LINKER=aarch64-linux-gnu-gcc

# Install dependencies and build
npm install
npm run build

# Cross-compile for ARM64
cargo tauri build --target aarch64-unknown-linux-gnu
```

## Step 4: Check output
```bash
# Check if build succeeded
ls -la src-tauri/target/aarch64-unknown-linux-gnu/release/

# Copy to dist folder
mkdir -p dist-arm64
cp src-tauri/target/aarch64-unknown-linux-gnu/release/batak-tauri dist-arm64/
cp -r src-tauri/target/aarch64-unknown-linux-gnu/release/bundle/* dist-arm64/ 2>/dev/null || true

# List final files
ls -la dist-arm64/
```

## Simplified one-liner (after setup)
```bash
source ~/.cargo/env && export PKG_CONFIG_ALLOW_CROSS=1 && export CARGO_TARGET_AARCH64_UNKNOWN_LINUX_GNU_LINKER=aarch64-linux-gnu-gcc && cargo tauri build --target aarch64-unknown-linux-gnu
```

The issue was that the system Rust (1.75) is too old for modern Tauri CLI. The rustup-installed Rust (1.91) should work fine.
# Cross-compilation using WSL for Orange Pi 4 LTS

## Quick Setup Guide

### 1. Setup WSL Environment
```bash
# Copy project to WSL
cp -r /mnt/d/repos/Daniel/batak-tauri ~/batak-tauri
cd ~/batak-tauri

# Make scripts executable
chmod +x setup-wsl.sh build-wsl.sh

# Run setup (only needed once)
./setup-wsl.sh
```

### 2. Build for ARM64
```bash
# Run the build
./build-wsl.sh
```

### 3. Transfer to Orange Pi
```bash
# Files will be in dist-arm64/
ls dist-arm64/

# Transfer via SCP (replace YOUR_ORANGE_PI_IP)
scp -r dist-arm64/* user@YOUR_ORANGE_PI_IP:~/
```

### 4. Install on Orange Pi
```bash
# On Orange Pi
sudo dpkg -i *.deb  # If .deb package exists
# OR
chmod +x batak-tauri && ./batak-tauri
```

## Manual WSL Commands

If you prefer to run commands manually:

```bash
# In WSL terminal:

# 1. Install dependencies
sudo apt-get update
sudo apt-get install -y gcc-aarch64-linux-gnu g++-aarch64-linux-gnu libc6-dev-arm64-cross pkg-config

# 2. Add ARM64 architecture and install libraries
sudo dpkg --add-architecture arm64
sudo apt-get update
sudo apt-get install -y libgtk-3-dev:arm64 libwebkit2gtk-4.0-dev:arm64 libappindicator3-dev:arm64

# 3. Add Rust ARM64 target
rustup target add aarch64-unknown-linux-gnu

# 4. Set environment variables and build
export PKG_CONFIG_ALLOW_CROSS=1
export PKG_CONFIG_PATH="/usr/lib/aarch64-linux-gnu/pkgconfig:/usr/share/pkgconfig"
export CARGO_TARGET_AARCH64_UNKNOWN_LINUX_GNU_LINKER=aarch64-linux-gnu-gcc

# 5. Build
npm install
npm run tauri build -- --target aarch64-unknown-linux-gnu
```

## Advantages of WSL Approach

- ✅ No Docker overhead
- ✅ Direct access to Linux cross-compilation tools
- ✅ Better integration with Windows filesystem
- ✅ Faster builds than Docker
- ✅ Easier debugging if issues arise

## Orange Pi Serial Port Notes

When running on Orange Pi 4 LTS, update the serial port in your app to:
- `/dev/ttyS0` (UART0 - pins 8,10)
- `/dev/ttyS1` (UART1 - pins 11,13) 
- `/dev/ttyUSB0` (USB serial adapter)

The default COM6 won't exist on Linux.
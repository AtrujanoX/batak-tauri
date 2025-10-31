# Cross-compilation for ARM64 Linux (Orange Pi 4 LTS)

## Overview
This project can be cross-compiled for ARM64 Linux to run on Orange Pi 4 LTS.

## Method 1: Docker Cross-compilation (Recommended)

### Prerequisites
- Docker Desktop installed and running
- At least 4GB free disk space

### Build Steps

1. **Build using Docker**:
   ```bash
   # On Windows (PowerShell)
   docker build -f Dockerfile.arm64 -t batak-tauri-arm64 .
   
   # Extract built files
   docker create --name batak-tauri-arm64-container batak-tauri-arm64
   docker cp batak-tauri-arm64-container:/output ./dist-arm64
   docker rm batak-tauri-arm64-container
   ```

2. **Transfer to Orange Pi**:
   - Copy files from `./dist-arm64/` to your Orange Pi 4 LTS
   - Use SCP, SFTP, or USB drive

3. **Install on Orange Pi**:
   ```bash
   # For .deb package
   sudo dpkg -i batak-tauri_*.deb
   sudo apt-get install -f  # Fix dependencies if needed
   
   # For AppImage
   chmod +x *.AppImage
   ./batak-tauri_*.AppImage
   
   # For raw binary
   chmod +x batak-tauri
   ./batak-tauri
   ```

## Method 2: Native Cross-compilation

### Prerequisites
- Linux environment with cross-compilation toolchain
- ARM64 development libraries

### Build Steps
```bash
# Install dependencies (Ubuntu/Debian)
sudo apt-get install gcc-aarch64-linux-gnu
rustup target add aarch64-unknown-linux-gnu

# Set environment variables
export PKG_CONFIG_ALLOW_CROSS=1
export CARGO_TARGET_AARCH64_UNKNOWN_LINUX_GNU_LINKER=aarch64-linux-gnu-gcc

# Build
npm run tauri build -- --target aarch64-unknown-linux-gnu
```

## Orange Pi 4 LTS Requirements

### Hardware
- Orange Pi 4 LTS with minimum 2GB RAM
- MicroSD card (16GB+) or eMMC storage
- HDMI display connection

### Software
- Ubuntu 20.04+ or Debian 11+ ARM64
- Desktop environment (GNOME, XFCE, etc.)

### Dependencies on Orange Pi
```bash
# Install required libraries
sudo apt-get update
sudo apt-get install -y \
    libgtk-3-0 \
    libwebkit2gtk-4.0-37 \
    libappindicator3-1 \
    librsvg2-2

# For serial port access
sudo usermod -a -G dialout $USER
# Logout and login again
```

## Serial Port Configuration

The Orange Pi 4 LTS typically has serial ports at:
- `/dev/ttyS0` - UART0 (default)
- `/dev/ttyS1` - UART1
- `/dev/ttyUSB0` - USB serial adapter

Update the port name in the app settings accordingly.

## Performance Notes

- The Orange Pi 4 LTS has a Rockchip RK3399 SoC (ARM Cortex-A72 + A53)
- Expected performance is good for this type of application
- Consider reducing timer intervals if performance is limited
- The app uses hardware acceleration where available

## Troubleshooting

### Display Issues
```bash
# Set display environment if running via SSH
export DISPLAY=:0.0
```

### Serial Permission Issues
```bash
# Add user to dialout group
sudo usermod -a -G dialout $USER
# Or run with sudo (not recommended)
sudo ./batak-tauri
```

### Missing Libraries
```bash
# Check missing dependencies
ldd ./batak-tauri
# Install missing packages with apt-get
```
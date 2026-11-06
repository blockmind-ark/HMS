# NITGEN HFDU06M Fingerprint Scanner — Ubuntu Linux Integration Guide

This guide details the technical setup, official vendor SDK requirements, udev permissions, service configuration, and troubleshooting steps for operating the **NITGEN HFDU06M / FDU06M/S** optical USB fingerprint scanner on Ubuntu Linux with the Ruqayya Clinic & Pharmacy Hospital Management System.

---

## 1. Verified Hardware & OS Compatibility

### Physical Device Identification
* **Manufacturer:** NITGen Co., Ltd (UnionCommunity)
* **Model Name:** NITGEN HFDU06M / FDU06M/S (Fingkey Hamster DX series)
* **USB Vendor ID (VID):** `0x0a86`
* **USB Product ID (PID):** `0x0603`
* **USB Device Class:** `255 (Vendor Specific Class)`
* **Sensor Type:** Optical (500 DPI, scratching-resistant optical prism surface)

### Supported Host Environment
* **Distribution:** Ubuntu 24.04 LTS (Noble Numbat) / Ubuntu 22.04 LTS
* **Architecture:** `x86_64` (64-bit Intel/AMD)
* **Linux Kernel:** 5.x / 6.x / 7.x
* **Core Dependencies:** `libusb-1.0-0` (`>= 2:1.0.25`), `build-essential`, `udev`

---

## 2. USB Enumeration Verification

To confirm that the physical scanner is connected and recognized by the Linux USB subsystem:

```bash
lsusb -d 0a86:0603
```

Expected output:
```text
Bus 001 Device 022: ID 0a86:0603 NITGen Co., Ltd NITGEN FDU06M/S
```

To view full USB descriptors:
```bash
lsusb -v -d 0a86:0603 | grep -E "(idVendor|idProduct|iManufacturer|iProduct)"
```

---

## 3. Udev Configuration (Non-Root User Permissions)

By default, Linux USB nodes (`/dev/bus/usb/BBB/DDD`) are created with root-only write access (`0664 nobody:nogroup`). To allow the biometric daemon running under your application user to open and communicate with the scanner without `sudo`, install a udev rule:

### Step 1: Create the Udev Rule File
Create `/etc/udev/rules.d/99-nitgen.rules`:

```bash
sudo bash -c 'cat << "EOF" > /etc/udev/rules.d/99-nitgen.rules
# NITGEN HFDU06M / FDU06M/S Optical USB Fingerprint Scanner
SUBSYSTEM=="usb", ATTRS{idVendor}=="0a86", ATTRS{idProduct}=="0603", MODE="0666", GROUP="plugdev", TAG+="uaccess"
EOF'
```

### Step 2: Ensure User is in `plugdev` Group
```bash
sudo usermod -a -G plugdev $USER
```

### Step 3: Reload Udev Rules
```bash
sudo udevadm control --reload-rules
sudo udevadm trigger
```

### Step 4: Verify Device Node Permissions
```bash
ls -l $(udevadm info -q path -n /dev/bus/usb/$(lsusb -d 0a86:0603 | awk '{print $2"/"$4}' | tr -d ':'))
```
The device node should now display permissions `crw-rw-rw-` or `crw-rw-r--` with group `plugdev`.

---

## 4. Official Vendor SDK Requirements

### NITGEN eNBSP Linux SDK Overview
The official software development kit for the NITGEN HFDU06M scanner is the **NITGEN eNBSP (Biometric Solution Provider) SDK for Linux**.

> [!IMPORTANT]
> **Commercial Licensing Constraint:**
> The eNBSP Linux SDK is proprietary commercial software licensed directly by **NITGen Co., Ltd / UnionCommunity** and their authorized biometric distributors. It is **not** distributed in public Debian/Ubuntu apt repositories.

### Required Shared Libraries
When you receive your official eNBSP Linux SDK release package, install the following 64-bit shared objects into `/usr/local/lib/`:
1. `libNBioBSP.so` (Core Biometric Solution Provider engine: capture, minutiae extraction, 1:1 and 1:N matching)
2. `libVenusLib.so` (Hardware communication layer for HFDU06 / FDU06 series optical sensors)

### Header Files
Place `NBioBSP.h` into `/usr/local/include/NBioBSP.h`.

### Installation Steps
```bash
# 1. Extract vendor package
tar -zxvf eNBSP_Linux_64bit_*.tar.gz
cd eNBSP_Linux_64bit_*

# 2. Run vendor installer (or copy libraries manually)
sudo cp lib/libNBioBSP.so /usr/local/lib/
sudo cp lib/libVenusLib.so /usr/local/lib/
sudo cp include/NBioBSP.h /usr/local/include/

# 3. Register library path in dynamic linker
echo "/usr/local/lib" | sudo tee /etc/ld.so.conf.d/nitgen-enbsp.conf
sudo ldconfig

# 4. Verify shared library registration
ldconfig -p | grep -i NBioBSP
```

---

## 5. Starting and Configuring the Local Biometric Daemon

The Ruqayya Clinic Management System uses a hardened local loopback daemon (`services/biometric-daemon/scanner-daemon.js`) listening on `127.0.0.1:9099`.

### Environment Configuration (`.env`)
Ensure `.env` contains:
```env
# Enable production local hardware service
BIOMETRIC_ADAPTER_TYPE="local_service"
BIOMETRIC_AGENT_URL="http://127.0.0.1:9099"
BIOMETRIC_AGENT_TOKEN="Ruqayya-scanner-agent-pairing-token-2026"
ALLOWED_ORIGIN="http://localhost:3000"
```

### Launching the Daemon
```bash
# Start daemon via package script
npm run biometric-daemon

# Or start directly using launcher script
bash services/biometric-daemon/start-daemon.sh
```

### Testing Daemon Health & Hardware Detection
```bash
curl -s http://127.0.0.1:9099/api/v1/device
```
Response will reflect the NITGEN HFDU06M scanner status:
```json
{
  "model": "NITGEN HFDU06M (FDU06M/S Optical USB Scanner)",
  "vendor": "NITGen Co., Ltd",
  "serialNumber": "NITGEN-0A86-0603",
  "connected": true,
  "supports1toN": true,
  "nitgen": {
    "usbConnected": true,
    "hasPermissions": true,
    "sdkInstalled": true,
    "status": "READY"
  }
}
```

---

## 6. Optional: Systemd Background Service

For unattended front-desk clinic deployment, install the daemon as a systemd service:

```bash
sudo bash -c 'cat << "EOF" > /etc/systemd/system/Ruqayya-biometrics.service
[Unit]
Description=Ruqayya Clinic NITGEN Biometric Hardware Daemon
After=network.target

[Service]
Type=simple
User=taimoor-malik
WorkingDirectory=/home/taimoor-malik/Documents/HMS
ExecStart=/usr/bin/node /home/taimoor-malik/Documents/HMS/services/biometric-daemon/scanner-daemon.js
Restart=always
RestartSec=3
Environment=NODE_ENV=production
Environment=BIOMETRIC_AGENT_PORT=9099
Environment=BIOMETRIC_AGENT_HOST=127.0.0.1
Environment=ALLOWED_ORIGIN=http://localhost:3000

[Install]
WantedBy=multi-user.target
EOF'

sudo systemctl daemon-reload
sudo systemctl enable Ruqayya-biometrics.service
sudo systemctl start Ruqayya-biometrics.service
```

---

## 7. Troubleshooting Matrix

| Error Code | Root Cause | Solution |
| :--- | :--- | :--- |
| `DEVICE_NOT_FOUND` | USB cable disconnected or loose | Run `lsusb` to check if `0a86:0603` appears. Try a different USB port. |
| `PERMISSION_DENIED` | Current user lacks read/write access to `/dev/bus/usb/...` | Install `/etc/udev/rules.d/99-nitgen.rules`, run `sudo udevadm control --reload-rules && sudo udevadm trigger`, and re-plug scanner. |
| `SDK_NOT_INSTALLED` | `libNBioBSP.so` is missing from library search path | Follow Section 4 to install vendor eNBSP binaries into `/usr/local/lib/` and run `sudo ldconfig`. |
| `DISCONNECTED` | Local daemon not running on port 9099 | Run `npm run biometric-daemon` or `systemctl status Ruqayya-biometrics`. |
| `TIMEOUT` | Patient did not place finger on optical prism within 30s | Ask patient to place thumb flat in the center of the illuminated glass prism and retry. |
| `SENSOR_DIRTY` / `LOW_QUALITY` | Dust or grease on optical glass | Clean the prism surface using a lint-free microfiber cloth moistened with isopropyl alcohol. |

---

## 8. Rollback & Uninstall

To remove the NITGEN integration:
```bash
# 1. Stop and disable systemd service
sudo systemctl stop Ruqayya-biometrics 2>/dev/null
sudo systemctl disable Ruqayya-biometrics 2>/dev/null
sudo rm -f /etc/systemd/system/Ruqayya-biometrics.service

# 2. Remove udev rules
sudo rm -f /etc/udev/rules.d/99-nitgen.rules
sudo udevadm control --reload-rules

# 3. Remove eNBSP shared libraries
sudo rm -f /etc/ld.so.conf.d/nitgen-enbsp.conf
sudo rm -f /usr/local/lib/libNBioBSP.so /usr/local/lib/libVenusLib.so
sudo ldconfig

# 4. Switch app back to simulated development mode in .env
# Set BIOMETRIC_ADAPTER_TYPE="mock"
```

---

## 9. Hardware Verification Status

* [x] **USB Enumeration:** Confirmed. Scanner detected as `0a86:0603` on USB bus.
* [x] **Local Daemon Bridge:** Implemented with HMAC-SHA256 authenticated loopback, origin validation, and structured error responses.
* [x] **Clinic Workflows:** Integrated through existing receptionist "Scan Thumb" and New Patient enrollment modals.
* [ ] **Physical eNBSP Optical Minutiae Capture:** Blocked pending receipt of official proprietary `libNBioBSP.so` commercial license library from NITGEN / UnionCommunity. Test double and simulated fallback fully operational.


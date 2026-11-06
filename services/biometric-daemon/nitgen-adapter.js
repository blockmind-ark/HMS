/**
 * Ruqayya Clinic & Pharmacy - NITGEN HFDU06M Linux Hardware Adapter
 * 
 * Target Hardware:
 *   - Manufacturer: NITGen Co., Ltd (UnionCommunity)
 *   - Model: NITGEN HFDU06M / FDU06M/S (Fingkey Hamster DX)
 *   - USB Vendor ID: 0x0a86
 *   - USB Product ID: 0x0603
 *   - Target Platform: Ubuntu Linux (x86_64)
 * 
 * Official Vendor SDK:
 *   - Name: NITGEN eNBSP (Biometric Solution Provider SDK for Linux)
 *   - Native Libraries: libNBioBSP.so, libVenusLib.so
 *   - C Header: NBioBSP.h
 */

const fs = require("fs");
const path = require("path");
const { execSync, spawn } = require("child_process");
const crypto = require("crypto");

const NITGEN_VENDOR_ID = "0a86";
const NITGEN_PRODUCT_ID = "0603";

// Standard library search locations for eNBSP on Ubuntu
const KNOWN_SDK_LIB_PATHS = [
  "/usr/local/lib/libNBioBSP.so",
  "/usr/lib/libNBioBSP.so",
  "/usr/lib/x86_64-linux-gnu/libNBioBSP.so",
  "/opt/NITGEN/eNBSP/lib/libNBioBSP.so",
  "/opt/NITGEN/lib/libNBioBSP.so",
  "/usr/local/lib/libVenusLib.so",
  "/usr/lib/libVenusLib.so",
];

const KNOWN_SDK_HEADER_PATHS = [
  "/usr/local/include/NBioBSP.h",
  "/usr/include/NBioBSP.h",
  "/opt/NITGEN/eNBSP/include/NBioBSP.h",
];

/**
 * Probe USB subsystem for NITGEN HFDU06M enumeration
 */
function probeNitgenUsb() {
  let isPluggedIn = false;
  let deviceBus = "";
  let deviceNum = "";
  let deviceNode = "";
  let hasPermissions = false;
  let rawLsUsbLine = "";

  try {
    const lsusbOut = execSync("lsusb", { encoding: "utf-8", timeout: 2500 });
    const lines = lsusbOut.split("\n");
    for (const line of lines) {
      if (line.includes(`${NITGEN_VENDOR_ID}:${NITGEN_PRODUCT_ID}`) || 
         (line.toLowerCase().includes("nitgen") && line.toLowerCase().includes("fdu06"))) {
        isPluggedIn = true;
        rawLsUsbLine = line.trim();

        // Parse bus and device number: Bus 001 Device 022: ID 0a86:0603 ...
        const match = line.match(/Bus\s+(\d+)\s+Device\s+(\d+)/);
        if (match) {
          deviceBus = match[1];
          deviceNum = match[2];
          deviceNode = `/dev/bus/usb/${deviceBus}/${deviceNum}`;
        }
        break;
      }
    }
  } catch (err) {
    // lsusb execution failed or timed out
  }

  // Check read/write permissions on USB device node
  if (deviceNode && fs.existsSync(deviceNode)) {
    try {
      fs.accessSync(deviceNode, fs.constants.R_OK | fs.constants.W_OK);
      hasPermissions = true;
    } catch (e) {
      hasPermissions = false;
    }
  }

  return {
    isPluggedIn,
    vendorId: NITGEN_VENDOR_ID,
    productId: NITGEN_PRODUCT_ID,
    modelName: "NITGEN HFDU06M (FDU06M/S Optical USB Scanner)",
    vendorName: "NITGen Co., Ltd (UnionCommunity)",
    deviceNode,
    hasPermissions,
    rawLsUsbLine,
  };
}

/**
 * Check if the official NITGEN eNBSP Linux SDK is installed on the system
 */
function probeEnbspSdk() {
  let sdkInstalled = false;
  let foundLibraries = [];
  let foundHeaders = [];

  for (const libPath of KNOWN_SDK_LIB_PATHS) {
    if (fs.existsSync(libPath)) {
      foundLibraries.push(libPath);
      sdkInstalled = true;
    }
  }

  for (const headerPath of KNOWN_SDK_HEADER_PATHS) {
    if (fs.existsSync(headerPath)) {
      foundHeaders.push(headerPath);
    }
  }

  // Also query ldconfig for registered shared libraries
  try {
    const ldOut = execSync("ldconfig -p 2>/dev/null | grep -iE 'nbiobsp|venuslib' || true", {
      encoding: "utf-8",
      timeout: 2000,
    });
    if (ldOut.trim()) {
      sdkInstalled = true;
      const lines = ldOut.trim().split("\n");
      for (const l of lines) {
        const parts = l.split("=>");
        if (parts[1]) foundLibraries.push(parts[1].trim());
      }
    }
  } catch (e) {}

  return {
    sdkInstalled,
    foundLibraries: Array.from(new Set(foundLibraries)),
    foundHeaders: Array.from(new Set(foundHeaders)),
    sdkName: "NITGEN eNBSP Linux SDK",
    documentationGuide: "docs/NITGEN_HFDU06M_UBUNTU_SETUP_GUIDE.md",
  };
}

/**
 * Query complete hardware & SDK status
 */
function getDeviceStatus() {
  const usb = probeNitgenUsb();
  const sdk = probeEnbspSdk();

  let status = "DISCONNECTED";
  let statusMessage = "NITGEN HFDU06M USB scanner not detected.";

  if (usb.isPluggedIn) {
    if (!usb.hasPermissions) {
      status = "PERMISSION_DENIED";
      statusMessage = "NITGEN HFDU06M scanner detected, but current user lacks r/w permissions on " + usb.deviceNode + ". Udev rule required.";
    } else if (!sdk.sdkInstalled) {
      status = "SDK_NOT_INSTALLED";
      statusMessage = "NITGEN HFDU06M scanner detected on USB, but official eNBSP Linux SDK (libNBioBSP.so) is not installed.";
    } else {
      status = "READY";
      statusMessage = "NITGEN HFDU06M optical scanner and eNBSP SDK ready for live biometric capture.";
    }
  }

  return {
    model: usb.modelName,
    vendor: usb.vendorName,
    vendorId: usb.vendorId,
    productId: usb.productId,
    serialNumber: usb.isPluggedIn ? "NITGEN-0A86-0603" : undefined,
    usbConnected: usb.isPluggedIn,
    deviceNode: usb.deviceNode,
    hasPermissions: usb.hasPermissions,
    sdkInstalled: sdk.sdkInstalled,
    sdkLibraries: sdk.foundLibraries,
    status,
    statusMessage,
    supports1toN: true,
    maxTemplateCapacity: 10000,
    capabilities: {
      canCapture: true,
      canExtractMinutiae: true,
      supports1toN: true,
    },
  };
}

/**
 * Capture fingerprint from NITGEN HFDU06M device
 * 
 * Strict non-negotiable contract:
 * If the official SDK is absent, clearly reports the SDK_NOT_INSTALLED error
 * with documentation instructions.
 * If mock mode is explicitly requested, generates an explicit test double.
 */
function captureFingerprint({ purpose = "VERIFICATION", timeoutMs = 30000, isMock = false } = {}) {
  return new Promise((resolve) => {
    const status = getDeviceStatus();

    // 1. If mock mode is explicitly active (for CI / automated testing / stubbing)
    if (isMock) {
      console.log(`[NITGEN HFDU06M] Simulating test capture for purpose: ${purpose}...`);
      const hashSeed = `MOCK-NITGEN-HFDU06M-${Date.now()}`;
      const templateHash = "FP-" + crypto.createHash("sha256").update(hashSeed).digest("hex").slice(0, 16).toUpperCase() + "-RIGHTTHUMB";

      // ISO/IEC 19794-2 compliant minutiae test double
      const mockTemplate = {
        format: "ISO_19794_2_NITGEN_TEST_DOUBLE",
        device: status.model,
        vendor: status.vendor,
        serialNumber: "NITGEN-0A86-0603",
        fingerPosition: "RIGHT_THUMB",
        isMock: true,
        quality: 96,
        timestamp: new Date().toISOString(),
        minutiaeHash: templateHash,
        minutiae: [
          { x: 120, y: 180, theta: 45, type: "ENDING" },
          { x: 210, y: 220, theta: 90, type: "BIFURCATION" },
          { x: 300, y: 310, theta: 135, type: "ENDING" },
          { x: 170, y: 290, theta: 180, type: "BIFURCATION" },
        ],
      };

      return resolve({
        success: true,
        isMock: true,
        template: JSON.stringify(mockTemplate),
        biometricHash: templateHash,
        qualityScore: 96,
        device: status.model,
        finger: "RIGHT_THUMB",
        message: "Simulated NITGEN HFDU06M test template generated.",
      });
    }

    // 2. Check if device is physically connected
    if (!status.usbConnected) {
      return resolve({
        success: false,
        error: "NITGEN HFDU06M scanner is not plugged into USB port.",
        errorCode: "DEVICE_NOT_FOUND",
        device: status.model,
      });
    }

    // 3. Check USB device permissions
    if (!status.hasPermissions) {
      return resolve({
        success: false,
        error: "Permission denied accessing NITGEN device node (" + status.deviceNode + "). Please configure /etc/udev/rules.d/99-nitgen.rules.",
        errorCode: "PERMISSION_DENIED",
        device: status.model,
      });
    }

    // 4. Check for official vendor SDK
    if (!status.sdkInstalled) {
      return resolve({
        success: false,
        error: "Official NITGEN eNBSP Linux SDK (libNBioBSP.so) is not installed on Ubuntu. Please install the vendor SDK to enable live optical capture.",
        errorCode: "SDK_NOT_INSTALLED",
        device: status.model,
        documentationGuide: "docs/NITGEN_HFDU06M_UBUNTU_SETUP_GUIDE.md",
      });
    }

    // 5. Official SDK Native Capture execution
    // When official eNBSP binaries are installed, invoke the native capture workflow
    try {
      console.log(`[NITGEN HFDU06M] Triggering live optical capture via eNBSP SDK...`);
      // Invocation placeholder for compiled eNBSP native bridge binary
      const nativeBridgePath = "/usr/local/bin/nitgen-enbsp-capture";
      if (!fs.existsSync(nativeBridgePath)) {
        return resolve({
          success: false,
          error: "eNBSP native bridge helper (/usr/local/bin/nitgen-enbsp-capture) not found. Compile using gcc with -lNBioBSP.",
          errorCode: "SDK_NOT_INSTALLED",
        });
      }

      const child = spawn(nativeBridgePath, ["--timeout", String(timeoutMs)]);
      let stdoutData = "";
      let stderrData = "";
      let isDone = false;

      const timer = setTimeout(() => {
        if (!isDone) {
          isDone = true;
          try { child.kill("SIGKILL"); } catch (e) {}
          resolve({
            success: false,
            error: "NITGEN HFDU06M capture timed out waiting for finger touch.",
            errorCode: "TIMEOUT",
          });
        }
      }, timeoutMs);

      child.stdout.on("data", (data) => { stdoutData += data.toString(); });
      child.stderr.on("data", (data) => { stderrData += data.toString(); });

      child.on("close", (code) => {
        clearTimeout(timer);
        if (isDone) return;
        isDone = true;

        if (code === 0 && stdoutData) {
          try {
            const parsed = JSON.parse(stdoutData);
            resolve({
              success: true,
              template: parsed.template,
              biometricHash: parsed.biometricHash,
              qualityScore: parsed.qualityScore || 95,
              device: status.model,
              finger: "RIGHT_THUMB",
              message: "Live physical fingerprint captured on NITGEN HFDU06M.",
            });
          } catch (e) {
            resolve({
              success: false,
              error: "Failed to parse native eNBSP capture response.",
              errorCode: "HARDWARE_ERROR",
            });
          }
        } else {
          resolve({
            success: false,
            error: stderrData || "NITGEN scan failed or was cancelled.",
            errorCode: "HARDWARE_ERROR",
          });
        }
      });
    } catch (err) {
      resolve({
        success: false,
        error: "Failed to invoke native NITGEN capture: " + err.message,
        errorCode: "HARDWARE_ERROR",
      });
    }
  });
}

module.exports = {
  probeNitgenUsb,
  probeEnbspSdk,
  getDeviceStatus,
  captureFingerprint,
  NITGEN_VENDOR_ID,
  NITGEN_PRODUCT_ID,
};

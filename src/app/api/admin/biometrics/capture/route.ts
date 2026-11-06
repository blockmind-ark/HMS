import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getBiometricScannerAdapter } from "@/lib/biometrics/adapter";
import crypto from "crypto";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized. Admin role required." }, { status: 403 });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const { device, isMock, fingerPosition = "RIGHT_THUMB" } = body;

    const adapter = getBiometricScannerAdapter();
    const deviceInfo = await adapter.getDeviceInfo();

    if (deviceInfo.status === "DISCONNECTED") {
      return NextResponse.json(
        {
          error: "Biometric optical scanner is disconnected. Please connect the scanner or start the daemon on port 9099.",
          errorCode: "DISCONNECTED",
          isMock: adapter.isMock,
        },
        { status: 503 }
      );
    }

    // Capture thumb impression from hardware scanner
    const captureResult = await adapter.captureFingerprint("ENROLLMENT", {
      device,
      isMock,
    });

    if (!captureResult.success || !captureResult.template) {
      return NextResponse.json(
        {
          error: captureResult.error || "Failed to capture thumb impression from scanner.",
          errorCode: captureResult.errorCode || "HARDWARE_ERROR",
          qualityScore: captureResult.qualityScore,
          isMock: adapter.isMock,
        },
        { status: 422 }
      );
    }

    if (captureResult.qualityScore && captureResult.qualityScore < 50) {
      return NextResponse.json(
        {
          error: `Thumb impression quality too low (${captureResult.qualityScore}%). Place thumb firmly and flat on scanner glass.`,
          errorCode: "LOW_QUALITY",
          qualityScore: captureResult.qualityScore,
          isMock: adapter.isMock,
        },
        { status: 422 }
      );
    }

    // Derive deterministic thumb hash
    let biometricHash = captureResult.biometricHash;
    if (!biometricHash) {
      const hashSeed = crypto
        .createHash("sha256")
        .update(captureResult.template)
        .digest("hex")
        .slice(0, 16)
        .toUpperCase();
      biometricHash = `FP-STAFF-${hashSeed}-${fingerPosition.replace(/\s+/g, "").toUpperCase()}`;
    }

    // 1:1 Invariant Check: Verify thumb expression is not already in use by another user
    const duplicateUser = await prisma.user.findFirst({
      where: { biometricHash: biometricHash.trim() },
      select: { id: true, name: true, email: true, role: true },
    });

    if (duplicateUser) {
      return NextResponse.json(
        {
          error: `This thumb impression is already registered to user "${duplicateUser.name}" (${duplicateUser.email}). Each user must have their own unique thumb impression.`,
          errorCode: "DUPLICATE_THUMB_IMPRESSION",
          existingUser: duplicateUser,
        },
        { status: 409 }
      );
    }

    return NextResponse.json({
      success: true,
      biometricHash,
      biometricTemplate: captureResult.template,
      fingerPosition,
      qualityScore: captureResult.qualityScore || 96,
      scannerModel: deviceInfo.model,
      isMock: adapter.isMock,
      message: "Thumb impression successfully scanned and verified unique.",
    });
  } catch (error: any) {
    console.error("Biometric staff capture error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to capture thumb impression" },
      { status: 500 }
    );
  }
}


import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { recordAuditLog } from "@/lib/audit";
import { getBiometricScannerAdapter } from "@/lib/biometrics/adapter";
import { encryptBiometricTemplate } from "@/lib/biometrics/encryption";
import { FingerPosition } from "@/lib/biometrics/types";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized. Admin role required." }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { userId, fingerPosition = "RIGHT_INDEX" } = body;

    if (!userId) {
      return NextResponse.json({ error: "userId is required for enrollment." }, { status: 400 });
    }

    // Verify target user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, email: true },
    });

    if (!user) {
      return NextResponse.json({ error: "Target user not found." }, { status: 404 });
    }

    const adapter = getBiometricScannerAdapter();
    const deviceInfo = await adapter.getDeviceInfo();

    if (deviceInfo.status === "DISCONNECTED") {
      return NextResponse.json(
        {
          error: "Biometric scanner is disconnected. Please connect the USB scanner or start the scanner service.",
          errorCode: "DISCONNECTED",
          isMock: adapter.isMock,
        },
        { status: 503 }
      );
    }

    // Capture from scanner adapter
    const captureResult = await adapter.captureFingerprint("ENROLLMENT");

    if (!captureResult.success || !captureResult.template) {
      return NextResponse.json(
        {
          error: captureResult.error || "Fingerprint capture failed.",
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
          error: `Fingerprint quality too low (${captureResult.qualityScore}%). Minimum required is 50%. Please clean scanner surface and place finger firmly.`,
          errorCode: "LOW_QUALITY",
          qualityScore: captureResult.qualityScore,
          isMock: adapter.isMock,
        },
        { status: 422 }
      );
    }

    // 1:1 Invariant Check: Verify thumb expression is not already registered to another user
    const userBiometricHash =
      captureResult.biometricHash ||
      `USER-FP-${user.id.slice(0, 8)}-${fingerPosition}`;

    const duplicateUser = await prisma.user.findFirst({
      where: {
        biometricHash: userBiometricHash,
        id: { not: user.id },
      },
      select: { id: true, name: true, email: true },
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

    // Encrypt minutiae template using AES-256-GCM
    const encryptedTemplate = encryptBiometricTemplate(captureResult.template);

    // Update User model biometricHash for instant 1:1 lookup
    await prisma.user.update({
      where: { id: user.id },
      data: { biometricHash: userBiometricHash },
    });

    // Save enrollment in PostgreSQL
    const enrollment = await prisma.userBiometricEnrollment.upsert({
      where: {
        userId_fingerPosition: {
          userId: user.id,
          fingerPosition: fingerPosition as FingerPosition,
        },
      },
      update: {
        encryptedTemplate,
        qualityScore: captureResult.qualityScore || 90,
        scannerModel: deviceInfo.model,
        adapterType: adapter.isMock ? "MOCK" : "VENDOR_LOCAL_AGENT",
        enrolledById: session.user.id,
      },
      create: {
        userId: user.id,
        fingerPosition: fingerPosition as FingerPosition,
        encryptedTemplate,
        qualityScore: captureResult.qualityScore || 90,
        scannerModel: deviceInfo.model,
        adapterType: adapter.isMock ? "MOCK" : "VENDOR_LOCAL_AGENT",
        enrolledById: session.user.id,
      },
      select: {
        id: true,
        userId: true,
        fingerPosition: true,
        qualityScore: true,
        scannerModel: true,
        adapterType: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    // Audit log without recording any biometric template or minutiae data
    await recordAuditLog({
      userId: session.user.id,
      action: "BIOMETRIC_ENROLLED",
      details: `Admin ${session.user.name} enrolled biometric fingerprint (${fingerPosition}) for user ${user.name} (${user.email}) via ${deviceInfo.model} [${adapter.isMock ? "MOCK_DEV_ADAPTER" : "VENDOR_HARDWARE"}].`,
    });

    return NextResponse.json({
      success: true,
      enrollment,
      isMock: adapter.isMock,
      message: `Fingerprint (${fingerPosition}) enrolled successfully for ${user.name}.`,
    });
  } catch (error: any) {
    console.error("Biometric enrollment error:", error);
    return NextResponse.json({ error: error?.message || "Failed to enroll fingerprint" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized. Admin role required." }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");
    const fingerPosition = searchParams.get("fingerPosition");

    if (!userId) {
      return NextResponse.json({ error: "userId parameter is required." }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, email: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }

    if (fingerPosition) {
      await prisma.userBiometricEnrollment.deleteMany({
        where: {
          userId: user.id,
          fingerPosition,
        },
      });
      const remainingCount = await prisma.userBiometricEnrollment.count({
        where: { userId: user.id },
      });
      if (remainingCount === 0) {
        await prisma.user.update({
          where: { id: user.id },
          data: { biometricHash: null },
        });
      }
    } else {
      // Remove all enrolled fingers for user
      await prisma.userBiometricEnrollment.deleteMany({
        where: { userId: user.id },
      });
      await prisma.user.update({
        where: { id: user.id },
        data: { biometricHash: null },
      });
    }

    await recordAuditLog({
      userId: session.user.id,
      action: "BIOMETRIC_DELETED",
      details: `Admin ${session.user.name} removed biometric enrollment for user ${user.name} (${user.email})${
        fingerPosition ? ` [Finger: ${fingerPosition}]` : " [All Fingers]"
      }.`,
    });

    return NextResponse.json({
      success: true,
      message: `Biometric enrollment successfully deleted for ${user.name}.`,
    });
  } catch (error: any) {
    console.error("Biometric deletion error:", error);
    return NextResponse.json({ error: error?.message || "Failed to delete biometric enrollment" }, { status: 500 });
  }
}

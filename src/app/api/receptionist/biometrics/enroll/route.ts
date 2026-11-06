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
  if (!session || (session.user.role !== "RECEPTIONIST" && session.user.role !== "ADMIN")) {
    return NextResponse.json({ error: "Unauthorized. Receptionist or Admin role required." }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { patientId, fingerPosition = "RIGHT_THUMB" } = body;

    const adapter = getBiometricScannerAdapter();
    const deviceInfo = await adapter.getDeviceInfo();

    if (deviceInfo.status === "DISCONNECTED") {
      return NextResponse.json(
        {
          error: "Biometric optical scanner is disconnected. Please connect the scanner.",
          errorCode: "DISCONNECTED",
          isMock: adapter.isMock,
        },
        { status: 503 }
      );
    }

    // Capture from scanner adapter
    const captureResult = await adapter.captureFingerprint("ENROLLMENT", {
      device: body.device,
      isMock: body.isMock,
    });

    if (!captureResult.success || !captureResult.template) {
      return NextResponse.json(
        {
          error: captureResult.error || "Patient thumb scan capture failed.",
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
          error: `Thumb scan quality too low (${captureResult.qualityScore}%). Please place thumb flat on the scanner and scan again.`,
          errorCode: "LOW_QUALITY",
          qualityScore: captureResult.qualityScore,
          isMock: adapter.isMock,
        },
        { status: 422 }
      );
    }

    // Encrypt minutiae template using AES-256-GCM
    const encryptedTemplate = encryptBiometricTemplate(captureResult.template);
    const friendlyHash = `THUMB-ISO-${fingerPosition}`;

    let enrollment = null;
    let patient = null;

    // If patientId provided (enrolling for existing patient), save directly
    if (patientId) {
      patient = await prisma.patient.findUnique({
        where: { id: patientId },
      });

      if (!patient) {
        return NextResponse.json({ error: "Patient not found." }, { status: 404 });
      }

      enrollment = await prisma.patientBiometricEnrollment.upsert({
        where: {
          patientId_fingerPosition: {
            patientId: patient.id,
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
          patientId: patient.id,
          fingerPosition: fingerPosition as FingerPosition,
          encryptedTemplate,
          qualityScore: captureResult.qualityScore || 90,
          scannerModel: deviceInfo.model,
          adapterType: adapter.isMock ? "MOCK" : "VENDOR_LOCAL_AGENT",
          enrolledById: session.user.id,
        },
        select: {
          id: true,
          patientId: true,
          fingerPosition: true,
          qualityScore: true,
          scannerModel: true,
          adapterType: true,
          createdAt: true,
        },
      });

      // Update patient's biometricHash badge
      await prisma.patient.update({
        where: { id: patient.id },
        data: { biometricHash: friendlyHash },
      });

      // Record audit log
      await recordAuditLog({
        userId: session.user.id,
        action: "PATIENT_BIOMETRIC_ENROLLED",
        details: `${session.user.name} enrolled biometric thumbprint (${fingerPosition}) for patient ${patient.name} (${patient.patientUid}) via ${deviceInfo.model} [${adapter.isMock ? "MOCK_DEV_ADAPTER" : "VENDOR_HARDWARE"}].`,
      });
    }

    return NextResponse.json({
      success: true,
      enrollment,
      biometricHash: friendlyHash,
      encryptedTemplate, // Returned if enrolling during intake before patient ID exists
      fingerPosition,
      qualityScore: captureResult.qualityScore || 90,
      isMock: adapter.isMock,
      message: patient
        ? `Thumbprint (${fingerPosition}) enrolled successfully for patient ${patient.name}.`
        : `Thumbprint minutiae captured with ${captureResult.qualityScore || 90}% quality. Ready to attach to new patient.`,
    });
  } catch (error: any) {
    console.error("Patient biometric enrollment error:", error);
    return NextResponse.json({ error: error?.message || "Failed to enroll patient thumb" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user.role !== "RECEPTIONIST" && session.user.role !== "ADMIN")) {
    return NextResponse.json({ error: "Unauthorized. Receptionist or Admin role required." }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const patientId = searchParams.get("patientId");

    if (!patientId) {
      return NextResponse.json({ error: "patientId is required." }, { status: 400 });
    }

    const patient = await prisma.patient.findUnique({
      where: { id: patientId },
      select: { id: true, name: true, patientUid: true },
    });

    if (!patient) {
      return NextResponse.json({ error: "Patient not found." }, { status: 404 });
    }

    await prisma.patientBiometricEnrollment.deleteMany({
      where: { patientId: patient.id },
    });

    await prisma.patient.update({
      where: { id: patient.id },
      data: { biometricHash: null },
    });

    await recordAuditLog({
      userId: session.user.id,
      action: "PATIENT_BIOMETRIC_DELETED",
      details: `${session.user.name} removed biometric fingerprint enrollment for patient ${patient.name} (${patient.patientUid}).`,
    });

    return NextResponse.json({
      success: true,
      message: `Biometric enrollment successfully deleted for ${patient.name}.`,
    });
  } catch (error: any) {
    console.error("Patient biometric deletion error:", error);
    return NextResponse.json({ error: error?.message || "Failed to delete biometric enrollment" }, { status: 500 });
  }
}


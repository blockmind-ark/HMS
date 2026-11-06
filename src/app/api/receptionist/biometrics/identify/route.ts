import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { recordAuditLog } from "@/lib/audit";
import { getBiometricScannerAdapter } from "@/lib/biometrics/adapter";
import { decryptBiometricTemplate } from "@/lib/biometrics/encryption";
import { checkBiometricRateLimit } from "@/lib/biometrics/rate-limiter";
import { CandidateTemplate, FingerPosition } from "@/lib/biometrics/types";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Rate Limiting (max 30 identification attempts per minute per operator)
  const rateLimitKey = `patient-biometric-identify-${session.user.id}`;
  const rateCheck = checkBiometricRateLimit(rateLimitKey, 30, 60000);
  if (!rateCheck.allowed) {
    return NextResponse.json(
      {
        error: `Rate limit reached. Please wait ${Math.ceil(
          rateCheck.resetInMs / 1000
        )} seconds before retrying thumb identification.`,
        errorCode: "RATE_LIMITED",
      },
      { status: 429 }
    );
  }

  try {
    const body = await req.json().catch(() => ({}));
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

    // Capture probe thumb from physical/mock scanner
    const captureResult = await adapter.captureFingerprint("VERIFICATION", {
      device: body.device,
      isMock: body.isMock,
    });

    if (!captureResult.success || !captureResult.template) {
      return NextResponse.json(
        {
          error: captureResult.error || "Failed to acquire thumbprint from scanner.",
          errorCode: captureResult.errorCode || "HARDWARE_ERROR",
          qualityScore: captureResult.qualityScore,
          isMock: adapter.isMock,
        },
        { status: 422 }
      );
    }

    // Retrieve all enrolled patient biometric templates
    const allEnrollments = await prisma.patientBiometricEnrollment.findMany({
      include: {
        patient: {
          select: {
            id: true,
            name: true,
            patientUid: true,
          },
        },
      },
    });

    // If no templates enrolled yet in PatientBiometricEnrollment, check if any enrolled in patient table
    if (allEnrollments.length === 0) {
      // In dev mock mode, check if we have any patients with biometricHash
      const legacyPatient = await prisma.patient.findFirst({
        where: { biometricHash: { not: null } },
        include: {
          visits: { orderBy: { createdAt: "desc" }, take: 10, include: { invoice: true } },
          invoices: { orderBy: { createdAt: "desc" }, take: 10, include: { items: true } },
          pharmacySales: {
            orderBy: { createdAt: "desc" },
            take: 10,
            include: { items: { include: { medicine: true } } },
          },
          biometricEnrollments: true,
        },
      });

      if (legacyPatient && adapter.isMock) {
        // Return legacy patient for mock demo convenience
        return NextResponse.json({
          success: true,
          matchFound: true,
          status: "MATCH_FOUND",
          confidenceScore: 94.2,
          fingerPosition: "RIGHT_THUMB",
          patient: legacyPatient,
          isMock: true,
          message: `Identified returning patient: ${legacyPatient.name} (${legacyPatient.patientUid}).`,
        });
      }

      return NextResponse.json({
        success: true,
        matchFound: false,
        status: "NO_MATCH",
        message: "No patients have enrolled biometric thumbprints in the clinic registry yet.",
        isMock: adapter.isMock,
      });
    }

    // Decrypt enrolled templates in memory for 1:N minutiae matching engine
    const candidates: CandidateTemplate[] = [];
    for (const enrollment of allEnrollments) {
      try {
        const decrypted = decryptBiometricTemplate(enrollment.encryptedTemplate);
        candidates.push({
          id: enrollment.id,
          userId: enrollment.patientId, // mapped to patientId
          fingerPosition: enrollment.fingerPosition as FingerPosition,
          template: decrypted,
        });
      } catch (decryptionErr) {
        console.error(`Failed to decrypt template for patient enrollment ${enrollment.id}:`, decryptionErr);
      }
    }

    // Execute real 1:N minutiae matching
    const matchResult = await adapter.match1toN(captureResult.template, candidates);

    if (matchResult.status === "UNCERTAIN_MULTIPLE_MATCHES") {
      await recordAuditLog({
        userId: session.user.id,
        action: "PATIENT_BIOMETRIC_AMBIGUOUS",
        details: `1:N patient thumb search yielded ambiguous matches (${matchResult.candidateMatchesCount} candidates). Automatic file load blocked for patient safety.`,
      });

      return NextResponse.json({
        success: true,
        matchFound: false,
        status: "UNCERTAIN_MULTIPLE_MATCHES",
        confidenceScore: matchResult.confidenceScore,
        error: "Biometric ambiguity: Multiple patients matched this thumb closely. Please look up by Patient Name or Phone for safety.",
        isMock: adapter.isMock,
      });
    }

    if (!matchResult.matchFound || !matchResult.matchedUserId) {
      await recordAuditLog({
        userId: session.user.id,
        action: "PATIENT_BIOMETRIC_SEARCH_FAILED",
        details: `1:N patient thumb search completed across ${candidates.length} enrolled templates: No match found.`,
      });

      return NextResponse.json({
        success: true,
        matchFound: false,
        status: "NO_MATCH",
        confidenceScore: matchResult.confidenceScore,
        message: "Thumbprint did not match any enrolled patient in the clinic registry.",
        isMock: adapter.isMock,
      });
    }

    // Match found! Fetch complete patient clinical dossier
    const patientDossier = await prisma.patient.findUnique({
      where: { id: matchResult.matchedUserId },
      include: {
        visits: {
          orderBy: { createdAt: "desc" },
          take: 15,
          include: { invoice: true },
        },
        invoices: {
          orderBy: { createdAt: "desc" },
          take: 15,
          include: { items: true },
        },
        pharmacySales: {
          orderBy: { createdAt: "desc" },
          take: 15,
          include: { items: { include: { medicine: true } } },
        },
        biometricEnrollments: true,
      },
    });

    if (!patientDossier) {
      return NextResponse.json({
        success: true,
        matchFound: false,
        status: "NO_MATCH",
        isMock: adapter.isMock,
      });
    }

    await recordAuditLog({
      userId: session.user.id,
      action: "PATIENT_BIOMETRIC_IDENTIFIED",
      details: `${session.user.name} identified returning patient ${patientDossier.name} (${patientDossier.patientUid}) via thumbprint scan (${matchResult.confidenceScore}% confidence).`,
    });

    return NextResponse.json({
      success: true,
      matchFound: true,
      status: "MATCH_FOUND",
      confidenceScore: matchResult.confidenceScore,
      fingerPosition: matchResult.fingerPosition,
      patient: patientDossier,
      isMock: adapter.isMock,
      message: `Identified patient: ${patientDossier.name} (${patientDossier.patientUid}) with ${matchResult.confidenceScore}% match assurance.`,
    });
  } catch (error: any) {
    console.error("1:N patient biometric identification error:", error);
    return NextResponse.json(
      { error: error?.message || "Patient thumbprint identification failed" },
      { status: 500 }
    );
  }
}


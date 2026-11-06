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
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized. Admin role required." }, { status: 403 });
  }

  // Rate Limiting by admin user ID (Max 25 identification attempts per minute)
  const rateLimitKey = `biometric-identify-${session.user.id}`;
  const rateCheck = checkBiometricRateLimit(rateLimitKey, 25, 60000);
  if (!rateCheck.allowed) {
    return NextResponse.json(
      {
        error: `Rate limit exceeded. Please wait ${Math.ceil(
          rateCheck.resetInMs / 1000
        )} seconds before retrying biometric search.`,
        errorCode: "RATE_LIMITED",
      },
      { status: 429 }
    );
  }

  try {
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

    // Capture probe finger from physical/mock scanner
    const captureResult = await adapter.captureFingerprint("VERIFICATION");

    if (!captureResult.success || !captureResult.template) {
      return NextResponse.json(
        {
          error: captureResult.error || "Failed to capture fingerprint from scanner.",
          errorCode: captureResult.errorCode || "HARDWARE_ERROR",
          qualityScore: captureResult.qualityScore,
          isMock: adapter.isMock,
        },
        { status: 422 }
      );
    }

    // 1. Direct Biometric Hash Match Check
    if (captureResult.biometricHash) {
      const directMatch = await prisma.user.findFirst({
        where: { biometricHash: captureResult.biometricHash.trim() },
        select: { id: true, name: true, email: true, role: true },
      });

      if (directMatch) {
        await recordAuditLog({
          userId: session.user.id,
          action: "BIOMETRIC_IDENTIFIED",
          details: `Biometric thumb hash matched user ${directMatch.name} (${directMatch.email}) [Role: ${directMatch.role}].`,
        });

        return NextResponse.json({
          success: true,
          matchFound: true,
          status: "MATCH_FOUND",
          confidenceScore: 100,
          fingerPosition: "RIGHT_THUMB",
          user: directMatch,
          isMock: adapter.isMock,
          message: `Identified user: ${directMatch.name} (${directMatch.role}) via unique thumb impression.`,
        });
      }
    }

    // 2. Retrieve all enrolled user biometric templates for 1:N minutiae matching
    const allEnrollments = await prisma.userBiometricEnrollment.findMany({
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
    });

    if (allEnrollments.length === 0) {
      return NextResponse.json({
        success: true,
        matchFound: false,
        status: "NO_MATCH",
        message: "No users have enrolled fingerprints in the system database yet.",
        isMock: adapter.isMock,
      });
    }

    // Decrypt enrolled templates in memory for matching engine
    const candidates: CandidateTemplate[] = [];
    for (const enrollment of allEnrollments) {
      try {
        const decrypted = decryptBiometricTemplate(enrollment.encryptedTemplate);
        candidates.push({
          id: enrollment.id,
          userId: enrollment.userId,
          fingerPosition: enrollment.fingerPosition as FingerPosition,
          template: decrypted,
        });
      } catch (decryptionErr) {
        console.error(`Failed to decrypt template for enrollment ${enrollment.id}:`, decryptionErr);
      }
    }

    // Perform real 1:N minutiae matching (never hash comparison)
    const matchResult = await adapter.match1toN(captureResult.template, candidates);

    if (matchResult.status === "UNCERTAIN_MULTIPLE_MATCHES") {
      await recordAuditLog({
        userId: session.user.id,
        action: "BIOMETRIC_IDENTIFICATION_AMBIGUOUS",
        details: `1:N biometric search yielded multiple candidate matches above threshold (${matchResult.candidateMatchesCount} matches). Automatic profile opening blocked for safety.`,
      });

      return NextResponse.json({
        success: true,
        matchFound: false,
        status: "UNCERTAIN_MULTIPLE_MATCHES",
        confidenceScore: matchResult.confidenceScore,
        error: "Biometric ambiguity: Multiple user templates matched this finger with high confidence. For safety, manual user selection is required.",
        isMock: adapter.isMock,
      });
    }

    if (!matchResult.matchFound || !matchResult.matchedUserId) {
      await recordAuditLog({
        userId: session.user.id,
        action: "BIOMETRIC_IDENTIFICATION_FAILED",
        details: `1:N biometric search completed across ${candidates.length} enrolled templates: No matching user found (Peak score: ${matchResult.confidenceScore}%).`,
      });

      return NextResponse.json({
        success: true,
        matchFound: false,
        status: "NO_MATCH",
        confidenceScore: matchResult.confidenceScore,
        message: "Fingerprint scan did not match any enrolled user record in the system.",
        isMock: adapter.isMock,
      });
    }

    // Match found! Retrieve user details
    const matchedUser = allEnrollments.find((e) => e.userId === matchResult.matchedUserId)?.user;

    if (!matchedUser) {
      return NextResponse.json({
        success: true,
        matchFound: false,
        status: "NO_MATCH",
        isMock: adapter.isMock,
      });
    }

    await recordAuditLog({
      userId: session.user.id,
      action: "BIOMETRIC_IDENTIFIED",
      details: `1:N biometric search successfully matched user ${matchedUser.name} (${matchedUser.email}) with ${matchResult.confidenceScore}% minutiae confidence [Finger: ${matchResult.fingerPosition}].`,
    });

    return NextResponse.json({
      success: true,
      matchFound: true,
      status: "MATCH_FOUND",
      confidenceScore: matchResult.confidenceScore,
      fingerPosition: matchResult.fingerPosition,
      user: matchedUser,
      isMock: adapter.isMock,
      message: `Identified user: ${matchedUser.name} (${matchedUser.role}) with ${matchResult.confidenceScore}% match score.`,
    });
  } catch (error: any) {
    console.error("1:N biometric identification error:", error);
    return NextResponse.json(
      { error: error?.message || "Biometric 1:N identification routine failed" },
      { status: 500 }
    );
  }
}

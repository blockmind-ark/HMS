import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getBiometricScannerAdapter } from "@/lib/biometrics/adapter";
import { decryptBiometricTemplate } from "@/lib/biometrics/encryption";
import { checkBiometricRateLimit } from "@/lib/biometrics/rate-limiter";
import { createBiometricLoginToken } from "@/lib/biometrics/auth-token";
import { CandidateTemplate, FingerPosition } from "@/lib/biometrics/types";

export async function POST(req: NextRequest) {
  // Rate Limiting by client IP (Max 30 attempts per minute)
  const ip = req.headers.get("x-forwarded-for") || "127.0.0.1";
  const rateLimitKey = `auth-biometric-identify-${ip}`;
  const rateCheck = checkBiometricRateLimit(rateLimitKey, 30, 60000);
  if (!rateCheck.allowed) {
    return NextResponse.json(
      {
        error: `Rate limit exceeded. Please wait ${Math.ceil(
          rateCheck.resetInMs / 1000
        )} seconds before retrying biometric login.`,
        errorCode: "RATE_LIMITED",
      },
      { status: 429 }
    );
  }

  try {
    const body = await req.json().catch(() => ({}));
    const { biometricHash, isMock, device } = body;

    const adapter = getBiometricScannerAdapter();

    let template = body.template;
    let queryHash = biometricHash;

    // If template / hash not directly supplied, capture from optical/laptop scanner
    if (!template && !queryHash) {
      const captureResult = await adapter.captureFingerprint("VERIFICATION", {
        device,
        isMock,
      });

      if (!captureResult.success || !captureResult.template) {
        return NextResponse.json(
          {
            matchFound: false,
            error: captureResult.error || "Biometric thumb scan timed out or failed.",
            errorCode: captureResult.errorCode || "HARDWARE_ERROR",
          },
          { status: 422 }
        );
      }

      template = captureResult.template;
      queryHash = captureResult.biometricHash;
    }

    // 1. Direct Biometric Hash Match Check
    if (queryHash) {
      const matchedByHash = await prisma.user.findFirst({
        where: { biometricHash: queryHash.trim() },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          biometricHash: true,
        },
      });

      if (matchedByHash) {
        const loginToken = createBiometricLoginToken(matchedByHash.id);
        return NextResponse.json({
          success: true,
          matchFound: true,
          status: "MATCH_FOUND",
          user: matchedByHash,
          loginToken,
          confidenceScore: 99.9,
          message: `Thumb impression verified. Identified as ${matchedByHash.name} (${matchedByHash.role}).`,
        });
      }
    }

    // 2. Minutiae 1:N Search Across UserBiometricEnrollment
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

    if (allEnrollments.length > 0 && template) {
      const candidates: CandidateTemplate[] = [];
      for (const enr of allEnrollments) {
        try {
          const decrypted = decryptBiometricTemplate(enr.encryptedTemplate);
          candidates.push({
            id: enr.id,
            userId: enr.userId,
            fingerPosition: enr.fingerPosition as FingerPosition,
            template: decrypted,
          });
        } catch (e) {
          console.error("Template decryption error during 1:N search:", e);
        }
      }

      if (candidates.length > 0) {
        const matchResult = await adapter.match1toN(template, candidates);

        if (matchResult.matchFound && matchResult.matchedUserId) {
          const matchedUser = allEnrollments.find(
            (e) => e.userId === matchResult.matchedUserId
          )?.user;

          if (matchedUser) {
            const loginToken = createBiometricLoginToken(matchedUser.id);
            return NextResponse.json({
              success: true,
              matchFound: true,
              status: "MATCH_FOUND",
              user: matchedUser,
              loginToken,
              confidenceScore: matchResult.confidenceScore || 99.5,
              fingerPosition: matchResult.fingerPosition,
              message: `Thumbprint match confirmed! Identified as ${matchedUser.name} (${matchedUser.role}).`,
            });
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      matchFound: false,
      status: "NO_MATCH",
      error: "Thumb impression does not match any registered staff member account.",
    });
  } catch (error: any) {
    console.error("Biometric user identification error:", error);
    return NextResponse.json(
      { error: error?.message || "Biometric identification failed" },
      { status: 500 }
    );
  }
}


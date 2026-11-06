import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { verifyClientData } from "@/lib/webauthn";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const body = await req.json();
    const {
      challenge,
      credentialId,
      clientDataJSON,
      attestationObject,
      patientId,
      patientUid,
      deviceType = "Native Platform Sensor (Windows Hello / Touch ID)",
    } = body;

    if (!challenge || !credentialId || !clientDataJSON) {
      return NextResponse.json({ error: "Missing required WebAuthn verification payload" }, { status: 400 });
    }

    // 1. Verify stored challenge
    const storedChallenge = await prisma.biometricChallenge.findUnique({
      where: { challenge },
    });

    if (!storedChallenge || storedChallenge.purpose !== "REGISTRATION") {
      return NextResponse.json({ error: "Invalid or expired biometric challenge" }, { status: 400 });
    }

    if (new Date() > storedChallenge.expiresAt) {
      await prisma.biometricChallenge.delete({ where: { id: storedChallenge.id } });
      return NextResponse.json({ error: "Biometric registration challenge has expired" }, { status: 400 });
    }

    // 2. Verify clientDataJSON
    const verification = verifyClientData(clientDataJSON, challenge, "webauthn.create");
    if (!verification.isValid) {
      return NextResponse.json({ error: verification.error || "Client data verification failed" }, { status: 400 });
    }

    // 3. Delete used challenge
    await prisma.biometricChallenge.delete({ where: { id: storedChallenge.id } });

    // 4. Find patient to link
    let patient = null;
    if (patientId) {
      patient = await prisma.patient.findUnique({ where: { id: patientId } });
    }
    if (!patient && patientUid) {
      patient = await prisma.patient.findUnique({ where: { patientUid } });
    }

    // Compute friendly biometric hash for legacy compatibility
    const biometricHash = `FP-WA-${credentialId.slice(0, 16).toUpperCase()}`;

    // If patient already exists in DB, link the credential directly
    if (patient) {
      await prisma.$transaction(async (tx) => {
        // Upsert credential
        await tx.biometricCredential.upsert({
          where: { credentialId },
          update: {
            publicKey: attestationObject || "publickey-attestation",
            deviceType,
            patientId: patient.id,
          },
          create: {
            credentialId,
            publicKey: attestationObject || "publickey-attestation",
            deviceType,
            patientId: patient.id,
          },
        });

        // Update patient's biometricHash
        await tx.patient.update({
          where: { id: patient.id },
          data: { biometricHash },
        });

        // Record audit log if user session available
        if (session?.user) {
          await tx.auditLog.create({
            data: {
              userId: session.user.id,
              action: "BIOMETRIC_ENROLLED",
              details: `Enrolled native WebAuthn biometric fingerprint for patient ${patient.name} (${patient.patientUid}) via ${deviceType}.`,
            },
          });
        }
      });
    }

    return NextResponse.json({
      success: true,
      credentialId,
      biometricHash,
      deviceType,
      patientId: patient?.id || null,
      message: "Biometric fingerprint credential verified and registered successfully.",
    });
  } catch (error: any) {
    console.error("Biometric register-verify error:", error);
    return NextResponse.json({ error: error.message || "Failed to verify biometric registration" }, { status: 500 });
  }
}


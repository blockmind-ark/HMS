import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { verifyClientData } from "@/lib/webauthn";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const body = await req.json();
    const { challenge, credentialId, clientDataJSON } = body;

    if (!challenge || !credentialId || !clientDataJSON) {
      return NextResponse.json({ error: "Missing required WebAuthn authentication payload" }, { status: 400 });
    }

    // 1. Verify stored challenge
    const storedChallenge = await prisma.biometricChallenge.findUnique({
      where: { challenge },
    });

    if (!storedChallenge || storedChallenge.purpose !== "AUTHENTICATION") {
      return NextResponse.json({ error: "Invalid or expired authentication challenge" }, { status: 400 });
    }

    if (new Date() > storedChallenge.expiresAt) {
      await prisma.biometricChallenge.delete({ where: { id: storedChallenge.id } });
      return NextResponse.json({ error: "Authentication challenge has expired" }, { status: 400 });
    }

    // 2. Verify clientDataJSON
    const verification = verifyClientData(clientDataJSON, challenge, "webauthn.get");
    if (!verification.isValid) {
      return NextResponse.json({ error: verification.error || "Client data verification failed" }, { status: 400 });
    }

    // 3. Delete used challenge
    await prisma.biometricChallenge.delete({ where: { id: storedChallenge.id } });

    // 4. Look up matched credential & patient
    const credential = await prisma.biometricCredential.findUnique({
      where: { credentialId },
      include: {
        patient: {
          include: {
            visits: {
              orderBy: { createdAt: "desc" },
              include: { invoice: true },
            },
            invoices: {
              orderBy: { createdAt: "desc" },
              include: { items: true, user: true },
            },
            pharmacySales: {
              orderBy: { createdAt: "desc" },
              include: {
                items: { include: { medicine: true } },
                user: true,
              },
            },
          },
        },
      },
    });

    if (!credential || !credential.patient) {
      return NextResponse.json({
        matchFound: false,
        error: "Biometric fingerprint is not associated with any registered patient in the clinic registry.",
      }, { status: 404 });
    }

    // 5. Increment counter
    await prisma.biometricCredential.update({
      where: { id: credential.id },
      data: { counter: { increment: 1 } },
    });

    // 6. Record security audit log
    if (session?.user) {
      await prisma.auditLog.create({
        data: {
          userId: session.user.id,
          action: "BIOMETRIC_VERIFIED",
          details: `Verified returning patient ${credential.patient.name} (${credential.patient.patientUid}) via native WebAuthn biometric sensor.`,
        },
      });
    }

    return NextResponse.json({
      success: true,
      matchFound: true,
      patient: credential.patient,
      message: `Biometric verification successful. Identified patient ${credential.patient.name} (${credential.patient.patientUid}).`,
    });
  } catch (error: any) {
    console.error("Biometric auth-verify error:", error);
    return NextResponse.json({ error: error.message || "Failed to verify biometric assertion" }, { status: 500 });
  }
}


import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateChallenge, createRegistrationOptions } from "@/lib/webauthn";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { patientId, patientUid = "PAT-TEMP", patientName = "New Patient" } = body;

    // Check if patient exists if patientId provided
    let patient = null;
    if (patientId) {
      patient = await prisma.patient.findUnique({
        where: { id: patientId },
      });
    }

    const challenge = generateChallenge();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    // Clean up expired challenges
    await prisma.biometricChallenge.deleteMany({
      where: { expiresAt: { lt: new Date() } },
    });

    // Store registration challenge
    await prisma.biometricChallenge.create({
      data: {
        challenge,
        patientId: patient?.id || patientId || null,
        purpose: "REGISTRATION",
        expiresAt,
      },
    });

    const host = req.headers.get("host")?.split(":")[0];
    const rpId = host && host !== "localhost" && !host.includes("127.0.0.1") ? host : undefined;

    const options = createRegistrationOptions({
      challenge,
      patientId: patient?.id || "temp-patient-" + Date.now(),
      patientUid: patient?.patientUid || patientUid,
      patientName: patient?.name || patientName,
      rpName: "Ruqayya Clinic & Pharmacy",
      rpId,
    });

    return NextResponse.json({
      success: true,
      challenge,
      options,
    });
  } catch (error: any) {
    console.error("Biometric register-challenge error:", error);
    return NextResponse.json({ error: error.message || "Failed to generate registration challenge" }, { status: 500 });
  }
}


import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateChallenge, createAuthenticationOptions } from "@/lib/webauthn";

export async function POST(req: NextRequest) {
  try {
    const challenge = generateChallenge();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    // Clean up expired challenges
    await prisma.biometricChallenge.deleteMany({
      where: { expiresAt: { lt: new Date() } },
    });

    // Store auth challenge
    await prisma.biometricChallenge.create({
      data: {
        challenge,
        purpose: "AUTHENTICATION",
        expiresAt,
      },
    });

    // Retrieve all registered credential IDs in system
    const credentials = await prisma.biometricCredential.findMany({
      select: { credentialId: true },
    });

    const host = req.headers.get("host")?.split(":")[0];
    const rpId = host && host !== "localhost" && !host.includes("127.0.0.1") ? host : undefined;

    const options = createAuthenticationOptions({
      challenge,
      credentialIds: credentials.map((c) => c.credentialId),
      rpId,
    });

    return NextResponse.json({
      success: true,
      challenge,
      enrolledCount: credentials.length,
      options,
    });
  } catch (error: any) {
    console.error("Biometric auth-challenge error:", error);
    return NextResponse.json({ error: error.message || "Failed to generate authentication challenge" }, { status: 500 });
  }
}


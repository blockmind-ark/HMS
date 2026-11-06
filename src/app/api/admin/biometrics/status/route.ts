import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getBiometricScannerAdapter } from "@/lib/biometrics/adapter";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized. Admin role required." }, { status: 403 });
  }

  try {
    const adapter = getBiometricScannerAdapter();
    const deviceInfo = await adapter.getDeviceInfo();

    const enrolledUsersCount = await prisma.userBiometricEnrollment.count();

    return NextResponse.json({
      success: true,
      device: deviceInfo,
      enrolledUsersCount,
      environment: {
        nodeEnv: process.env.NODE_ENV,
        adapterConfigured: process.env.BIOMETRIC_ADAPTER_TYPE || "mock",
        encryptionConfigured: !!process.env.BIOMETRIC_ENCRYPTION_KEY,
      },
    });
  } catch (error: any) {
    console.error("Failed to query biometric device status:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to query biometric device status" },
      { status: 500 }
    );
  }
}

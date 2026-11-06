"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
  generateOpdToken as generateOpdTokenService,
  getTodayTokenStatus as getTodayTokenStatusService,
  GeneratedTokenResult,
} from "@/lib/tokens";

export async function generateOpdToken(
  type: "AUTO" | "MANUAL",
  manualNum?: number,
  patientId?: string
): Promise<{ success: boolean; token?: GeneratedTokenResult; error?: string }> {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized. Please sign in." };
    }

    const token = await generateOpdTokenService(session.user.id, type, manualNum, patientId);
    return { success: true, token };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to generate token" };
  }
}

export async function getTodayTokenStatus() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      throw new Error("Unauthorized");
    }
    return await getTodayTokenStatusService();
  } catch (error: any) {
    throw new Error(error.message || "Failed to load token status");
  }
}


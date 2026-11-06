import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { generateOpdToken, getTodayTokenStatus } from "@/lib/tokens";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const data = await getTodayTokenStatus();
    return NextResponse.json(data);
  } catch (error: any) {
    console.error("Failed to fetch token status:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to load tokens status" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { type, manualNum, patientId, services, fee } = body;

    if (type !== "AUTO" && type !== "MANUAL") {
      return NextResponse.json(
        { error: "Invalid token type. Must be 'AUTO' or 'MANUAL'." },
        { status: 400 }
      );
    }

    const token = await generateOpdToken(
      session.user.id,
      type,
      type === "MANUAL" ? Number(manualNum) : undefined,
      patientId,
      services,
      fee
    );

    const updatedStatus = await getTodayTokenStatus();

    return NextResponse.json({
      success: true,
      token,
      status: updatedStatus,
    });
  } catch (error: any) {
    console.error("Token generation failed:", error);
    const status = error.message === "Token already issued today" ? 400 : 500;
    return NextResponse.json(
      { error: error?.message || "Failed to generate OPD token" },
      { status }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { tokenId, services, fee } = body;

    if (!tokenId) {
      return NextResponse.json({ error: "Missing tokenId" }, { status: 400 });
    }

    const updated = await prisma.dailyTokenLog.update({
      where: { id: tokenId },
      data: {
        services: services !== undefined ? services : undefined,
        fee: fee !== undefined ? Number(fee) : undefined,
      },
      include: {
        patient: {
          select: {
            id: true,
            patientUid: true,
            name: true,
            phone: true,
            age: true,
            gender: true,
            cnic: true,
          },
        },
        issuedBy: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    const updatedStatus = await getTodayTokenStatus();

    return NextResponse.json({
      success: true,
      token: updated,
      status: updatedStatus,
    });
  } catch (error: any) {
    console.error("Token update failed:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to update OPD token" },
      { status: 500 }
    );
  }
}


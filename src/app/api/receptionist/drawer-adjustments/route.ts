import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { recordAuditLog } from "@/lib/audit";
import { DrawerAdjustmentType, ApprovalStatus } from "@prisma/client";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (
    !session ||
    (session.user.role !== "RECEPTIONIST" &&
      session.user.role !== "PHARMACIST" &&
      session.user.role !== "ADMIN")
  ) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const dateStr = searchParams.get("date");
  const targetDate = dateStr ? new Date(dateStr) : new Date();

  const startOfDay = new Date(targetDate);
  startOfDay.setHours(0, 0, 0, 0);

  const endOfDay = new Date(targetDate);
  endOfDay.setHours(23, 59, 59, 999);

  const isSuperAdmin = session.user.role === "ADMIN" && searchParams.get("all") === "true";
  const userFilter = isSuperAdmin ? {} : { userId: session.user.id };

  const adjustments = await prisma.drawerAdjustment.findMany({
    where: {
      ...userFilter,
      createdAt: {
        gte: startOfDay,
        lte: endOfDay,
      },
    },
    include: {
      user: { select: { id: true, name: true, email: true } },
      approvedBy: { select: { id: true, name: true, email: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  let approvedCashIn = 0;
  let approvedCashOut = 0;
  let pendingCount = 0;

  for (const adj of adjustments) {
    if (adj.status === ApprovalStatus.APPROVED) {
      if (adj.type === DrawerAdjustmentType.CASH_IN) {
        approvedCashIn += adj.amount;
      } else if (adj.type === DrawerAdjustmentType.CASH_OUT) {
        approvedCashOut += adj.amount;
      }
    } else if (adj.status === ApprovalStatus.PENDING) {
      pendingCount += 1;
    }
  }

  const netAdjustment = approvedCashIn - approvedCashOut;

  return NextResponse.json({
    adjustments,
    summary: {
      approvedCashIn,
      approvedCashOut,
      netAdjustment,
      pendingCount,
    },
  });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (
    !session ||
    (session.user.role !== "RECEPTIONIST" &&
      session.user.role !== "PHARMACIST" &&
      session.user.role !== "ADMIN")
  ) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { type, amount, remarks } = body;

    if (!type || (type !== "CASH_IN" && type !== "CASH_OUT")) {
      return NextResponse.json(
        { error: "Invalid adjustment type. Must be CASH_IN or CASH_OUT." },
        { status: 400 }
      );
    }

    const numericAmount = parseFloat(amount);
    if (isNaN(numericAmount) || numericAmount <= 0) {
      return NextResponse.json(
        { error: "Adjustment amount must be a positive number." },
        { status: 400 }
      );
    }

    if (!remarks || !remarks.trim()) {
      return NextResponse.json(
        { error: "Reason/remarks are required for drawer adjustments." },
        { status: 400 }
      );
    }

    const adjustment = await prisma.drawerAdjustment.create({
      data: {
        userId: session.user.id,
        type: type as DrawerAdjustmentType,
        amount: numericAmount,
        remarks: remarks.trim(),
        status: ApprovalStatus.APPROVED, // Direct approval - no admin approval needed
      },
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
    });

    await recordAuditLog({
      userId: session.user.id,
      action: "DRAWER_ADJUSTMENT_LOGGED",
      details: `${session.user.name} recorded cash drawer ${type} adjustment of Rs. ${numericAmount.toLocaleString()} (Immediate Active). Remarks: "${remarks.trim()}".`,
    });

    return NextResponse.json({
      success: true,
      adjustment,
      message: `Drawer ${type === "CASH_IN" ? "Cash In" : "Cash Out"} of Rs. ${numericAmount.toLocaleString()} recorded directly into drawer.`,
    });
  } catch (error: any) {
    console.error("Failed to submit drawer adjustment:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to process drawer adjustment." },
      { status: 500 }
    );
  }
}


import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { recordAuditLog } from "@/lib/audit";
import { PortalType } from "@prisma/client";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const portalParam = searchParams.get("portal");
  const dateStr = searchParams.get("date");
  const targetDate = dateStr ? new Date(dateStr) : new Date();

  const startOfDay = new Date(targetDate);
  startOfDay.setHours(0, 0, 0, 0);

  const endOfDay = new Date(targetDate);
  endOfDay.setHours(23, 59, 59, 999);

  const whereClause: any = {
    createdAt: {
      gte: startOfDay,
      lte: endOfDay,
    },
  };

  if (portalParam && (portalParam === "RECEPTION" || portalParam === "PHARMACY")) {
    whereClause.portal = portalParam as PortalType;
  }

  // If receptionist or pharmacist, optionally filter by their portal
  if (session.user.role === "RECEPTIONIST") {
    whereClause.portal = PortalType.RECEPTION;
  } else if (session.user.role === "PHARMACIST") {
    whereClause.portal = PortalType.PHARMACY;
  }

  const expenditures = await prisma.expenditure.findMany({
    where: whereClause,
    include: {
      user: { select: { id: true, name: true, email: true, role: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const totalAmount = expenditures.reduce((acc, exp) => acc + exp.amount, 0);

  // Group by category
  const categoryBreakdown: Record<string, { count: number; total: number }> = {};
  for (const exp of expenditures) {
    if (!categoryBreakdown[exp.category]) {
      categoryBreakdown[exp.category] = { count: 0, total: 0 };
    }
    categoryBreakdown[exp.category].count += 1;
    categoryBreakdown[exp.category].total += exp.amount;
  }

  return NextResponse.json({
    expenditures,
    totalAmount,
    categoryBreakdown: Object.entries(categoryBreakdown).map(([category, d]) => ({
      category,
      count: d.count,
      total: d.total,
    })),
  });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { portal, amount, category, remarks } = body;

    let targetPortal = portal;
    if (session.user.role === "RECEPTIONIST") {
      targetPortal = PortalType.RECEPTION;
    } else if (session.user.role === "PHARMACIST") {
      targetPortal = PortalType.PHARMACY;
    } else if (targetPortal !== "RECEPTION" && targetPortal !== "PHARMACY") {
      return NextResponse.json(
        { error: "Invalid portal type. Must be RECEPTION or PHARMACY." },
        { status: 400 }
      );
    }

    const numericAmount = parseFloat(amount);
    if (isNaN(numericAmount) || numericAmount <= 0) {
      return NextResponse.json(
        { error: "Expenditure amount must be a positive number." },
        { status: 400 }
      );
    }

    if (!category || !category.trim()) {
      return NextResponse.json(
        { error: "Expenditure category is required." },
        { status: 400 }
      );
    }

    const expenditure = await prisma.expenditure.create({
      data: {
        userId: session.user.id,
        portal: targetPortal as PortalType,
        amount: numericAmount,
        category: category.trim(),
        remarks: remarks ? remarks.trim() : null,
      },
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
    });

    await recordAuditLog({
      userId: session.user.id,
      action: "EXPENDITURE_LOGGED",
      details: `${session.user.name} logged ${targetPortal} petty cash expenditure of Rs. ${numericAmount.toLocaleString()} [${category.trim()}]. Remarks: "${remarks || "N/A"}".`,
    });

    return NextResponse.json({
      success: true,
      expenditure,
      message: `Expenditure of Rs. ${numericAmount.toLocaleString()} recorded successfully.`,
    });
  } catch (error: any) {
    console.error("Failed to log expenditure:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to log expenditure." },
      { status: 500 }
    );
  }
}


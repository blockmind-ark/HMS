import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { recordAuditLog } from "@/lib/audit";
import { PortalType, ShiftStatus } from "@prisma/client";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user.role !== "PHARMACIST" && session.user.role !== "ADMIN")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { countedCash, notes, shiftDate } = body;

    if (countedCash === undefined || countedCash === null || isNaN(Number(countedCash))) {
      return NextResponse.json(
        { error: "Valid physical cash counted amount is required." },
        { status: 400 }
      );
    }

    const numericCounted = parseFloat(countedCash);
    if (numericCounted < 0) {
      return NextResponse.json(
        { error: "Counted physical cash cannot be a negative amount." },
        { status: 400 }
      );
    }

    // Determine target day range
    const targetDate = shiftDate ? new Date(shiftDate) : new Date();
    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);

    const openingFloat = 5000.0;

    // 1. Fetch pharmacy sales and clinical invoices for the target date
    const [sales, invoices] = await Promise.all([
      prisma.pharmacySale.findMany({
        where: {
          userId: session.user.id,
          createdAt: {
            gte: startOfDay,
            lte: endOfDay,
          },
        },
        select: {
          totalAmount: true,
        },
      }),
      prisma.invoice.findMany({
        where: {
          userId: session.user.id,
          createdAt: {
            gte: startOfDay,
            lte: endOfDay,
          },
          status: "PAID",
        },
        include: {
          items: true,
        },
      }),
    ]);

    let totalRevenue = sales.reduce((sum, s) => sum + s.totalAmount, 0);

    for (const inv of invoices) {
      if (inv.items && inv.items.length > 0) {
        for (const it of inv.items) {
          if (/already paid/i.test(it.description)) continue;
          totalRevenue += it.price * (it.quantity || 1);
        }
      } else {
        totalRevenue += inv.totalAmount;
      }
    }

    // 2. Fetch expenditures for the target date
    const expenditures = await prisma.expenditure.findMany({
      where: {
        portal: PortalType.PHARMACY,
        createdAt: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
      select: {
        amount: true,
      },
    });

    const totalExpenditures = expenditures.reduce((sum, e) => sum + e.amount, 0);

    // 3. Fetch drawer adjustments for the target date
    const drawerAdjustments = await prisma.drawerAdjustment.findMany({
      where: {
        userId: session.user.id,
        createdAt: { gte: startOfDay, lte: endOfDay },
      },
    });

    let approvedCashIn = 0;
    let approvedCashOut = 0;
    for (const adj of drawerAdjustments) {
      if (adj.status === "APPROVED") {
        if (adj.type === "CASH_IN") approvedCashIn += adj.amount;
        else if (adj.type === "CASH_OUT") approvedCashOut += adj.amount;
      }
    }

    // Expected cash in drawer
    const expectedCashInDrawer = Math.max(
      0,
      totalRevenue + approvedCashIn - approvedCashOut - totalExpenditures
    );
    const variance = numericCounted - expectedCashInDrawer;

    // Check if a shift closing already exists for this day and user
    const existingClosing = await prisma.shiftClosing.findFirst({
      where: {
        userId: session.user.id,
        portal: PortalType.PHARMACY,
        shiftDate: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
    });

    let closing;
    if (existingClosing) {
      closing = await prisma.shiftClosing.update({
        where: { id: existingClosing.id },
        data: {
          portal: PortalType.PHARMACY,
          totalSystemCash: expectedCashInDrawer,
          countedCash: numericCounted,
          variance,
          notes: notes ? String(notes).trim() : existingClosing.notes,
          status: ShiftStatus.PENDING_APPROVAL,
          approvedById: null,
          adminComment: null,
        },
        include: {
          user: { select: { id: true, name: true, email: true } },
          approvedBy: { select: { id: true, name: true, email: true } },
        },
      });
    } else {
      closing = await prisma.shiftClosing.create({
        data: {
          userId: session.user.id,
          portal: PortalType.PHARMACY,
          shiftDate: startOfDay,
          totalSystemCash: expectedCashInDrawer,
          countedCash: numericCounted,
          variance,
          notes: notes ? String(notes).trim() : null,
          status: ShiftStatus.PENDING_APPROVAL,
        },
        include: {
          user: { select: { id: true, name: true, email: true } },
          approvedBy: { select: { id: true, name: true, email: true } },
        },
      });
    }

    const varianceText =
      variance === 0
        ? "Exact Match (Rs. 0)"
        : variance > 0
        ? `Overage (+Rs. ${variance.toLocaleString()})`
        : `Shortage (-Rs. ${Math.abs(variance).toLocaleString()})`;

    await recordAuditLog({
      userId: session.user.id,
      action: "PHARMACY_SHIFT_SUBMITTED",
      details: `Pharmacist ${session.user.name} submitted daily shift close for ${
        startOfDay.toISOString().split("T")[0]
      } (Pending Admin Approval & Commit). Expected: Rs. ${expectedCashInDrawer.toLocaleString()} | Counted: Rs. ${numericCounted.toLocaleString()} | Variance: ${varianceText}.`,
    });

    return NextResponse.json({
      success: true,
      closing,
      message: "Pharmacy shift close sheet submitted for Admin Approval & Final Commit.",
    });
  } catch (error: any) {
    console.error("Failed to submit pharmacy shift close:", error);
    return NextResponse.json(
      { error: error?.message || "Internal server error while closing shift." },
      { status: 500 }
    );
  }
}

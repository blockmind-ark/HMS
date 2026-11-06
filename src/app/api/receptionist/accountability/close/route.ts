import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { recordAuditLog } from "@/lib/audit";
import { ApprovalStatus, DrawerAdjustmentType, PortalType, ShiftStatus } from "@prisma/client";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user.role !== "RECEPTIONIST" && session.user.role !== "ADMIN")) {
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

    // Compute live server-side system cash incorporating invoices, standalone tokens, approved adjustments, and expenditures
    const targetDateStr = startOfDay.toISOString().split("T")[0];
    const [invoices, drawerAdjustments, expenditures, tokens] = await Promise.all([
      prisma.invoice.findMany({
        where: {
          userId: session.user.id,
          createdAt: {
            gte: startOfDay,
            lte: endOfDay,
          },
          status: "PAID",
        },
        select: {
          totalAmount: true,
          paymentMethod: true,
          tokenId: true,
        },
      }),

      prisma.drawerAdjustment.findMany({
        where: {
          userId: session.user.id,
          createdAt: {
            gte: startOfDay,
            lte: endOfDay,
          },
          status: ApprovalStatus.APPROVED,
        },
        select: {
          type: true,
          amount: true,
        },
      }),

      prisma.expenditure.findMany({
        where: {
          portal: PortalType.RECEPTION,
          createdAt: {
            gte: startOfDay,
            lte: endOfDay,
          },
        },
        select: {
          amount: true,
        },
      }),

      prisma.dailyTokenLog.findMany({
        where: {
          dateStr: targetDateStr,
          status: "ISSUED",
          issuedById: session.user.id,
        },
        select: {
          id: true,
          fee: true,
        },
      }),
    ]);

    // Cash invoices total (or invoices defaulting to CASH)
    const cashInvoices = invoices.reduce((sum, inv) => {
      const method = (inv.paymentMethod || "CASH").toUpperCase();
      return method === "CASH" ? sum + inv.totalAmount : sum;
    }, 0);

    // Standalone OPD Token cash collected at counter that has not yet been converted into Tab 2 invoices
    const invoicedTokenIds = new Set(
      invoices.map((inv) => inv.tokenId).filter(Boolean)
    );
    const standaloneTokenCash = tokens
      .filter((t) => !invoicedTokenIds.has(t.id))
      .reduce((sum, t) => sum + (t.fee || 300), 0);

    let approvedCashIn = 0;
    let approvedCashOut = 0;
    for (const adj of drawerAdjustments) {
      if (adj.type === DrawerAdjustmentType.CASH_IN) {
        approvedCashIn += adj.amount;
      } else if (adj.type === DrawerAdjustmentType.CASH_OUT) {
        approvedCashOut += adj.amount;
      }
    }

    const totalExpenditures = expenditures.reduce((sum, exp) => sum + exp.amount, 0);

    // Net expected drawer cash = Cash collections (Invoices + Standalone OPD Tokens) + Float In - Cash Out - Expenditures
    const totalCashCollected = cashInvoices + standaloneTokenCash;
    const netDrawerCash = totalCashCollected + approvedCashIn - approvedCashOut - totalExpenditures;
    const totalSystemCash = Math.max(0, netDrawerCash);
    const variance = numericCounted - totalSystemCash;

    // Check if a shift closing already exists for this day and user
    const existingClosing = await prisma.shiftClosing.findFirst({
      where: {
        userId: session.user.id,
        portal: PortalType.RECEPTION,
        shiftDate: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
    });

    let closing;
    if (existingClosing) {
      // Update existing record and set status to PENDING_APPROVAL
      closing = await prisma.shiftClosing.update({
        where: { id: existingClosing.id },
        data: {
          portal: PortalType.RECEPTION,
          totalSystemCash,
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
      // Create new ShiftClosing with status PENDING_APPROVAL
      closing = await prisma.shiftClosing.create({
        data: {
          userId: session.user.id,
          portal: PortalType.RECEPTION,
          shiftDate: startOfDay,
          totalSystemCash,
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

    // Record Immutable Audit Log
    const varianceText =
      variance === 0
        ? "Exact Match (Rs. 0)"
        : variance > 0
        ? `Overage (+Rs. ${variance.toLocaleString()})`
        : `Shortage (-Rs. ${Math.abs(variance).toLocaleString()})`;

    await recordAuditLog({
      userId: session.user.id,
      action: "SHIFT_CLOSE_SUBMITTED",
      details: `Receptionist ${session.user.name} submitted daily shift close for ${
        startOfDay.toISOString().split("T")[0]
      } (Pending Admin Approval & Commit). System Cash: Rs. ${totalSystemCash.toLocaleString()} | Physical Cash: Rs. ${numericCounted.toLocaleString()} | Variance: ${varianceText}.`,
    });

    return NextResponse.json({
      success: true,
      closing,
      message: "Shift sheet submitted successfully. Status is now PENDING_APPROVAL awaiting Admin review & final commit.",
    });
  } catch (error: any) {
    console.error("Failed to submit shift close:", error);
    return NextResponse.json(
      { error: error?.message || "Internal server error while closing shift." },
      { status: 500 }
    );
  }
}

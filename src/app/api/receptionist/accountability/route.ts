import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ApprovalStatus, DrawerAdjustmentType, PortalType } from "@prisma/client";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user.role !== "RECEPTIONIST" && session.user.role !== "ADMIN")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const dateStr = searchParams.get("date");

  // Determine target day range
  const targetDate = dateStr ? new Date(dateStr) : new Date();
  const startOfDay = new Date(targetDate);
  startOfDay.setHours(0, 0, 0, 0);

  const endOfDay = new Date(targetDate);
  endOfDay.setHours(23, 59, 59, 999);
  const targetDateStr = startOfDay.toISOString().split("T")[0];

  // Fetch invoices issued by current receptionist today (or all for admin view)
  const isSuperAdmin = session.user.role === "ADMIN" && searchParams.get("all") === "true";
  const userFilter = isSuperAdmin ? {} : { userId: session.user.id };

  const [invoices, drawerAdjustments, expenditures, tokens] = await Promise.all([
    prisma.invoice.findMany({
      where: {
        ...userFilter,
        createdAt: {
          gte: startOfDay,
          lte: endOfDay,
        },
        status: "PAID",
      },
      include: {
        items: true,
        visit: true,
        patient: true,
        user: {
          select: { id: true, name: true, email: true },
        },
      },
      orderBy: { createdAt: "desc" },
    }),

    prisma.drawerAdjustment.findMany({
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
    }),

    prisma.expenditure.findMany({
      where: {
        portal: PortalType.RECEPTION,
        createdAt: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: "desc" },
    }),

    prisma.dailyTokenLog.findMany({
      where: {
        dateStr: targetDateStr,
        status: "ISSUED",
        ...(isSuperAdmin ? {} : { issuedById: session.user.id }),
      },
      include: {
        patient: { select: { id: true, name: true, patientUid: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  // Standard Clinic Service Tariff (both OPD and Other/Diagnostic services)
  const STANDARD_CLINICAL_SERVICES = [
    "Ultrasound TVS",
    "Ultrasound Liver, Kidney & Stomach",
    "Ultrasound Abdomen",
    "OPD Fees",
    "Sugar Test",
    "U P D",
    "BP",
  ];

  const serviceBreakdown: Record<string, { count: number; total: number }> = {};
  for (const s of STANDARD_CLINICAL_SERVICES) {
    serviceBreakdown[s] = { count: 0, total: 0 };
  }

  // 1. Accumulate OPD Services from Tokens
  for (const t of tokens) {
    const services = t.services as any;
    if (Array.isArray(services) && services.length > 0) {
      for (const s of services) {
        let name = s.name || s.id;
        if (/opd/i.test(s.id || s.name)) name = "OPD Fees";
        else if (/sugar/i.test(s.id || s.name)) name = "Sugar Test";
        else if (/upd/i.test(s.id || s.name)) name = "U P D";
        else if (/bp/i.test(s.id || s.name)) name = "BP";

        if (!serviceBreakdown[name]) serviceBreakdown[name] = { count: 0, total: 0 };
        serviceBreakdown[name].count += 1;
        serviceBreakdown[name].total += (s.fee || 0);
      }
    } else {
      serviceBreakdown["OPD Fees"].count += 1;
      serviceBreakdown["OPD Fees"].total += (t.fee || 300);
    }
  }

  // 2. Accumulate Diagnostic and Other Services from Invoices
  let totalGross = 0;
  let totalDiscount = 0;
  let totalInvoicesAmount = 0;
  let cashInvoicesTotal = 0;
  const paymentMethodBreakdown: Record<string, { count: number; total: number }> = {};

  for (const inv of invoices) {
    const gross = (inv.items && inv.items.length > 0)
      ? inv.items.reduce((acc, it) => acc + it.price * it.quantity, 0)
      : inv.totalAmount + inv.discount;

    totalGross += gross;
    totalDiscount += inv.discount;
    totalInvoicesAmount += inv.totalAmount;

    if (inv.items && inv.items.length > 0) {
      for (const it of inv.items) {
        // Skip reprint of already paid OPD token item to avoid duplicate counting
        if (/already paid/i.test(it.description)) continue;

        let name = it.description;
        if (/tvs/i.test(it.description)) name = "Ultrasound TVS";
        else if (/liver|kidney|stomach/i.test(it.description)) name = "Ultrasound Liver, Kidney & Stomach";
        else if (/abdomen/i.test(it.description)) name = "Ultrasound Abdomen";
        else if (/sugar/i.test(it.description)) name = "Sugar Test";
        else if (/upd/i.test(it.description)) name = "U P D";
        else if (/bp/i.test(it.description)) name = "BP";
        else if (/opd/i.test(it.description)) name = "OPD Fees";
        else name = it.description.replace(/\(.*\)/g, "").trim();

        if (!serviceBreakdown[name]) serviceBreakdown[name] = { count: 0, total: 0 };
        serviceBreakdown[name].count += (it.quantity || 1);
        serviceBreakdown[name].total += it.price * (it.quantity || 1);
      }
    } else {
      let name = inv.visit?.serviceType || "General Consultation";
      if (/tvs/i.test(name)) name = "Ultrasound TVS";
      else if (/liver|kidney|stomach/i.test(name)) name = "Ultrasound Liver, Kidney & Stomach";
      else if (/abdomen/i.test(name)) name = "Ultrasound Abdomen";
      else if (/sugar/i.test(name)) name = "Sugar Test";
      else if (/upd/i.test(name)) name = "U P D";
      else if (/bp/i.test(name)) name = "BP";
      else if (/opd/i.test(name)) name = "OPD Fees";
      else name = name.replace(/\(.*\)/g, "").trim();

      if (!serviceBreakdown[name]) serviceBreakdown[name] = { count: 0, total: 0 };
      serviceBreakdown[name].count += 1;
      serviceBreakdown[name].total += inv.totalAmount;
    }

    // Payment Method Breakdown
    const method = ((inv as any).paymentMethod || "CASH").toUpperCase();
    if (!paymentMethodBreakdown[method]) {
      paymentMethodBreakdown[method] = { count: 0, total: 0 };
    }
    paymentMethodBreakdown[method].count += 1;
    paymentMethodBreakdown[method].total += inv.totalAmount;

    if (method === "CASH") {
      cashInvoicesTotal += inv.totalAmount;
    }
  }

  // Calculate Drawer Adjustments
  let approvedCashIn = 0;
  let approvedCashOut = 0;
  let pendingAdjustmentsCount = 0;

  for (const adj of drawerAdjustments) {
    if (adj.status === ApprovalStatus.APPROVED) {
      if (adj.type === DrawerAdjustmentType.CASH_IN) {
        approvedCashIn += adj.amount;
      } else if (adj.type === DrawerAdjustmentType.CASH_OUT) {
        approvedCashOut += adj.amount;
      }
    } else if (adj.status === ApprovalStatus.PENDING) {
      pendingAdjustmentsCount += 1;
    }
  }

  // Calculate Expenditures
  const totalExpenditures = expenditures.reduce((sum, e) => sum + e.amount, 0);

  // Standalone OPD Token cash collected at counter that has not yet been converted into Tab 2 invoices
  const invoicedTokenIds = new Set(
    invoices.map((inv) => inv.tokenId).filter(Boolean)
  );
  const standaloneTokenCash = tokens
    .filter((t) => !invoicedTokenIds.has(t.id))
    .reduce((sum, t) => sum + (t.fee || 300), 0);

  // Net Expected System Cash in Drawer:
  // Expected Cash = Cash Collections (Invoices + Standalone OPD Tokens) + Approved Cash In - Approved Cash Out - Expenditures
  const totalCashCollected = cashInvoicesTotal + standaloneTokenCash;
  const netDrawerCash = totalCashCollected + approvedCashIn - approvedCashOut - totalExpenditures;
  const totalSystemCash = Math.max(0, netDrawerCash);

  // Check active shift closing record for today
  const activeClosing = await prisma.shiftClosing.findFirst({
    where: {
      userId: session.user.id,
      portal: PortalType.RECEPTION,
      shiftDate: {
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

  // Fetch recent historical shift closings
  const pastClosings = await prisma.shiftClosing.findMany({
    where: {
      portal: PortalType.RECEPTION,
      ...(isSuperAdmin ? {} : { userId: session.user.id }),
    },
    include: {
      user: { select: { id: true, name: true, email: true } },
      approvedBy: { select: { id: true, name: true, email: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 15,
  });

  return NextResponse.json({
    shiftDate: startOfDay.toISOString().split("T")[0],
    receptionist: {
      id: session.user.id,
      name: session.user.name,
      email: session.user.email,
    },
    summary: {
      invoiceCount: invoices.length,
      tokenCount: tokens.length,
      totalGross,
      totalDiscount,
      totalInvoicesAmount,
      cashInvoicesTotal,
      standaloneTokenCash,
      totalCashCollected,
      approvedCashIn,
      approvedCashOut,
      totalExpenditures,
      netDrawerCash,
      totalSystemCash,
      pendingAdjustmentsCount,
    },
    serviceBreakdown: Object.entries(serviceBreakdown)
      .map(([service, data]) => ({
        service,
        count: data.count,
        total: data.total,
      }))
      .sort((a, b) => b.total - a.total || b.count - a.count),
    paymentMethodBreakdown: Object.entries(paymentMethodBreakdown).map(([method, data]) => ({
      method,
      count: data.count,
      total: data.total,
    })),
    invoices: invoices.slice(0, 30).map((inv) => ({
      id: inv.id,
      invoiceNumber: inv.invoiceNumber,
      patientName: inv.patient.name,
      patientUid: inv.patient.patientUid,
      serviceType: inv.visit?.serviceType || "Clinical Service",
      amount: inv.totalAmount,
      discount: inv.discount,
      paymentMethod: (inv as any).paymentMethod || "CASH",
      time: inv.createdAt,
    })),
    drawerAdjustments,
    expenditures,
    activeClosing,
    pastClosings,
  });
}

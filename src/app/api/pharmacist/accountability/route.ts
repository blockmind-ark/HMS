import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PortalType, ApprovalStatus, DrawerAdjustmentType } from "@prisma/client";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user.role !== "PHARMACIST" && session.user.role !== "ADMIN")) {
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

  const isSuperAdmin = session.user.role === "ADMIN" && searchParams.get("all") === "true";
  const userFilter = isSuperAdmin ? {} : { userId: session.user.id };

  const [sales, invoices, drawerAdjustments, expenditures] = await Promise.all([
    prisma.pharmacySale.findMany({
      where: {
        ...userFilter,
        createdAt: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
      include: {
        items: {
          include: {
            medicine: {
              select: {
                id: true,
                name: true,
                genericName: true,
                category: true,
                itemType: true,
              },
            },
          },
        },
        patient: {
          select: { id: true, name: true, patientUid: true, phone: true },
        },
        user: {
          select: { id: true, name: true, email: true },
        },
      },
      orderBy: { createdAt: "desc" },
    }),

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
        patient: {
          select: { id: true, name: true, patientUid: true, phone: true },
        },
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
        portal: PortalType.PHARMACY,
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
  ]);

  // Aggregate itemized sales segregated by:
  // 1. Medicines & Surgical Consumables
  // 2. Clinical & Diagnostic Services
  const medicineMap = new Map<
    string,
    {
      medicineId: string;
      name: string;
      genericName: string;
      category: string;
      itemType?: string;
      count: number;
      unitPrice: number;
      total: number;
    }
  >();

  const serviceMap = new Map<
    string,
    {
      medicineId: string;
      name: string;
      genericName: string;
      category: string;
      itemType?: string;
      count: number;
      unitPrice: number;
      total: number;
    }
  >();

  let totalRevenue = 0;
  let totalDiscount = 0;
  let totalGrossBilled = 0;
  let totalUnitsSold = 0;

  let medicineRevenue = 0;
  let medicineGross = 0;
  let medicineDiscount = 0;
  let medicineUnitsSold = 0;

  let serviceRevenue = 0;
  let serviceGross = 0;
  let serviceDiscount = 0;
  let serviceUnitsSold = 0;

  // 1. Process Pharmacy Sales
  for (const sale of sales) {
    totalRevenue += sale.totalAmount;
    totalDiscount += sale.discount || 0;
    medicineRevenue += sale.totalAmount;
    medicineDiscount += sale.discount || 0;

    for (const it of sale.items) {
      totalUnitsSold += it.quantity;
      totalGrossBilled += it.totalPrice;
      medicineUnitsSold += it.quantity;
      medicineGross += it.totalPrice;

      const medId = it.medicineId;
      const medName = it.medicine.name;

      if (medicineMap.has(medId)) {
        const existing = medicineMap.get(medId)!;
        existing.count += it.quantity;
        existing.total += it.totalPrice;
      } else {
        medicineMap.set(medId, {
          medicineId: medId,
          name: medName,
          genericName: it.medicine.genericName,
          category: it.medicine.category,
          itemType: it.medicine.itemType,
          count: it.quantity,
          unitPrice: it.unitPrice,
          total: it.totalPrice,
        });
      }
    }
  }

  // 2. Process Clinical / Diagnostic Service Invoices (from "Other Services & Invoicing" tab)
  for (const inv of invoices) {
    totalDiscount += inv.discount || 0;
    serviceDiscount += inv.discount || 0;

    if (inv.items && inv.items.length > 0) {
      for (const it of inv.items) {
        // Skip already-paid OPD token consultation fee item to avoid counting token desk cash
        if (/already paid/i.test(it.description)) continue;

        const itemQty = it.quantity || 1;
        const itemTotal = it.price * itemQty;
        totalRevenue += itemTotal;
        totalGrossBilled += itemTotal;
        totalUnitsSold += itemQty;

        serviceRevenue += itemTotal;
        serviceGross += itemTotal;
        serviceUnitsSold += itemQty;

        const cleanName = it.description.replace(/\(Current Prescribed Service\)/i, "").trim();
        const serviceKey = `svc-${cleanName.toLowerCase()}`;
        let category = "Clinical Service";
        if (/ultrasound|usg|tvs|abdomen|liver|kidney|stomach/i.test(cleanName)) {
          category = "Ultrasound";
        }

        if (serviceMap.has(serviceKey)) {
          const existing = serviceMap.get(serviceKey)!;
          existing.count += itemQty;
          existing.total += itemTotal;
        } else {
          serviceMap.set(serviceKey, {
            medicineId: serviceKey,
            name: cleanName,
            genericName: "Diagnostic / Clinical Procedure",
            category: category,
            itemType: "CLINICAL_SERVICE",
            count: itemQty,
            unitPrice: it.price,
            total: itemTotal,
          });
        }
      }
    } else {
      const serviceName = inv.visit?.serviceType || "Clinical Diagnostic Service";
      const cleanName = serviceName.replace(/\(.*\)/g, "").trim();
      const serviceKey = `svc-${cleanName.toLowerCase()}`;
      let category = "Clinical Service";
      if (/ultrasound|usg|tvs|abdomen|liver|kidney|stomach/i.test(cleanName)) {
        category = "Ultrasound";
      }

      totalRevenue += inv.totalAmount;
      totalGrossBilled += (inv.totalAmount + (inv.discount || 0));
      totalUnitsSold += 1;

      serviceRevenue += inv.totalAmount;
      serviceGross += (inv.totalAmount + (inv.discount || 0));
      serviceUnitsSold += 1;

      if (serviceMap.has(serviceKey)) {
        const existing = serviceMap.get(serviceKey)!;
        existing.count += 1;
        existing.total += inv.totalAmount;
      } else {
        serviceMap.set(serviceKey, {
          medicineId: serviceKey,
          name: cleanName,
          genericName: "Diagnostic / Clinical Procedure",
          category: category,
          itemType: "CLINICAL_SERVICE",
          count: 1,
          unitPrice: inv.totalAmount,
          total: inv.totalAmount,
        });
      }
    }
  }

  // Sorted from highest to lowest revenue
  const medicineSales = Array.from(medicineMap.values()).sort(
    (a, b) => b.total - a.total || b.count - a.count
  );

  const serviceSales = Array.from(serviceMap.values()).sort(
    (a, b) => b.total - a.total || b.count - a.count
  );

  const itemizedSales = [...medicineSales, ...serviceSales].sort(
    (a, b) => b.total - a.total || b.count - a.count
  );

  // Compatible serviceBreakdown
  const serviceBreakdown = itemizedSales.map((item) => ({
    service: item.name,
    count: item.count,
    total: item.total,
    category: item.category,
  }));

  // Drawer Adjustments Calculations
  let approvedCashIn = 0;
  let approvedCashOut = 0;

  for (const adj of drawerAdjustments) {
    if (adj.status === ApprovalStatus.APPROVED) {
      if (adj.type === DrawerAdjustmentType.CASH_IN) {
        approvedCashIn += adj.amount;
      } else if (adj.type === DrawerAdjustmentType.CASH_OUT) {
        approvedCashOut += adj.amount;
      }
    }
  }

  // Expenditures total
  const totalExpenditures = expenditures.reduce((acc, exp) => acc + exp.amount, 0);

  // Net Expected System Cash
  const netDrawerCash = totalRevenue + approvedCashIn - approvedCashOut - totalExpenditures;
  const totalSystemCash = Math.max(0, netDrawerCash);

  // Check active shift closing record for today
  const activeClosing = await prisma.shiftClosing.findFirst({
    where: {
      userId: session.user.id,
      portal: PortalType.PHARMACY,
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

  // Fetch historical shift closings
  const pastClosings = await prisma.shiftClosing.findMany({
    where: {
      portal: PortalType.PHARMACY,
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
    shiftDate: targetDateStr,
    pharmacist: {
      id: session.user.id,
      name: session.user.name,
      email: session.user.email,
    },
    summary: {
      totalSystemCash,
      totalRevenue,
      cashInvoicesTotal: totalRevenue,
      totalGross: totalGrossBilled,
      totalDiscount,
      invoiceCount: sales.length + invoices.length,
      salesCount: sales.length + invoices.length,
      totalUnitsSold,
      uniqueMedicinesCount: medicineSales.length,
      uniqueServicesCount: serviceSales.length,
      medicineRevenue,
      medicineSalesCount: sales.length,
      medicineUnitsSold,
      serviceRevenue,
      serviceInvoicesCount: invoices.length,
      serviceUnitsSold,
      openingFloat: 5000,
      totalExpenditures,
      approvedCashIn,
      approvedCashOut,
    },
    activeClosing,
    pastClosings,
    invoices,
    expenditures,
    drawerAdjustments,
    medicineSales,
    serviceSales,
    itemizedSales,
    serviceBreakdown,
  });
}


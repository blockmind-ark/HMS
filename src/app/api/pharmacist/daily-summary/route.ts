import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user.role !== "PHARMACIST" && session.user.role !== "ADMIN")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const targetDateStr = searchParams.get("date"); // YYYY-MM-DD

  let dayStart: Date;
  let dayEnd: Date;

  if (targetDateStr && /^\d{4}-\d{2}-\d{2}$/.test(targetDateStr)) {
    const [y, m, d] = targetDateStr.split("-").map(Number);
    dayStart = new Date(y, m - 1, d, 0, 0, 0, 0);
    dayEnd = new Date(y, m - 1, d, 23, 59, 59, 999);
  } else {
    dayStart = new Date();
    dayStart.setHours(0, 0, 0, 0);
    dayEnd = new Date();
    dayEnd.setHours(23, 59, 59, 999);
  }

  const [sales, invoices] = await Promise.all([
    prisma.pharmacySale.findMany({
      where: {
        createdAt: { gte: dayStart, lte: dayEnd },
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
        createdAt: { gte: dayStart, lte: dayEnd },
        status: "PAID",
        user: {
          role: "PHARMACIST",
        },
      },
      include: {
        items: true,
        patient: {
          select: { id: true, name: true, patientUid: true, phone: true },
        },
        user: {
          select: { id: true, name: true, email: true },
        },
        visit: true,
      },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  // Aggregate itemized sales by medicine and clinical services
  const medMap = new Map<
    string,
    {
      medicineId: string;
      medicineName: string;
      genericName: string;
      category: string;
      unitsSold: number;
      unitPrice: number;
      totalRevenue: number;
    }
  >();

  let totalRevenue = 0;
  let totalDiscount = 0;
  let totalGrossBilled = 0;
  let totalUnitsSold = 0;

  for (const sale of sales) {
    totalRevenue += sale.totalAmount;
    totalDiscount += sale.discount || 0;

    for (const it of sale.items) {
      totalUnitsSold += it.quantity;
      totalGrossBilled += it.totalPrice;

      const medId = it.medicineId;
      const medName = it.medicine.name;

      if (medMap.has(medId)) {
        const existing = medMap.get(medId)!;
        existing.unitsSold += it.quantity;
        existing.totalRevenue += it.totalPrice;
      } else {
        medMap.set(medId, {
          medicineId: medId,
          medicineName: medName,
          genericName: it.medicine.genericName,
          category: it.medicine.category,
          unitsSold: it.quantity,
          unitPrice: it.unitPrice,
          totalRevenue: it.totalPrice,
        });
      }
    }
  }

  for (const inv of invoices) {
    totalDiscount += inv.discount || 0;

    if (inv.items && inv.items.length > 0) {
      for (const it of inv.items) {
        if (/already paid/i.test(it.description)) continue;
        const itemQty = it.quantity || 1;
        const itemTotal = it.price * itemQty;
        totalRevenue += itemTotal;
        totalGrossBilled += itemTotal;
        totalUnitsSold += itemQty;

        const cleanName = it.description.replace(/\(Current Prescribed Service\)/i, "").trim();
        const serviceKey = `svc-${cleanName.toLowerCase()}`;
        let category = "Clinical Service";
        if (/ultrasound|usg|tvs|abdomen|liver|kidney|stomach/i.test(cleanName)) {
          category = "Ultrasound";
        }

        if (medMap.has(serviceKey)) {
          const existing = medMap.get(serviceKey)!;
          existing.unitsSold += itemQty;
          existing.totalRevenue += itemTotal;
        } else {
          medMap.set(serviceKey, {
            medicineId: serviceKey,
            medicineName: cleanName,
            genericName: "Diagnostic / Clinical Procedure",
            category: category,
            unitsSold: itemQty,
            unitPrice: it.price,
            totalRevenue: itemTotal,
          });
        }
      }
    } else {
      const cleanName = (inv.visit?.serviceType || "Clinical Service").replace(/\(.*\)/g, "").trim();
      const serviceKey = `svc-${cleanName.toLowerCase()}`;
      totalRevenue += inv.totalAmount;
      totalGrossBilled += (inv.totalAmount + (inv.discount || 0));
      totalUnitsSold += 1;

      if (medMap.has(serviceKey)) {
        const existing = medMap.get(serviceKey)!;
        existing.unitsSold += 1;
        existing.totalRevenue += inv.totalAmount;
      } else {
        medMap.set(serviceKey, {
          medicineId: serviceKey,
          medicineName: cleanName,
          genericName: "Diagnostic / Clinical Procedure",
          category: "Ultrasound",
          unitsSold: 1,
          unitPrice: inv.totalAmount,
          totalRevenue: inv.totalAmount,
        });
      }
    }
  }

  const itemizedSales = Array.from(medMap.values()).sort(
    (a, b) => b.totalRevenue - a.totalRevenue
  );

  const transactions = sales.map((s) => ({
    id: s.id,
    saleNumber: s.saleNumber,
    time: s.createdAt,
    patientName: s.patient?.name || "Over-the-Counter / Walk-in",
    patientUid: s.patient?.patientUid || "OTC",
    itemsCount: s.items.reduce((sum, item) => sum + item.quantity, 0),
    items: s.items.map((it) => ({
      name: it.medicine.name,
      quantity: it.quantity,
      unitPrice: it.unitPrice,
      totalPrice: it.totalPrice,
    })),
    totalAmount: s.totalAmount,
    discount: s.discount || 0,
    pharmacistName: s.user?.name || "Muhammad Tariq",
  }));

  // Opening float for register accountability
  const openingFloat = 5000.0;

  // Query Pharmacy expenditures for this day
  const expenditures = await prisma.expenditure.findMany({
    where: {
      portal: "PHARMACY",
      createdAt: { gte: dayStart, lte: dayEnd },
    },
    include: {
      user: { select: { id: true, name: true, email: true } },
    },
    orderBy: { createdAt: "desc" },
  });
  const totalExpenditures = expenditures.reduce((sum, e) => sum + e.amount, 0);
  const expectedCashInDrawer = Math.max(0, openingFloat + totalRevenue - totalExpenditures);

  // Query Shift Closing status for this day
  const activeClosing = await prisma.shiftClosing.findFirst({
    where: {
      userId: session.user.id,
      portal: "PHARMACY",
      shiftDate: { gte: dayStart, lte: dayEnd },
    },
    include: {
      user: { select: { id: true, name: true, email: true } },
      approvedBy: { select: { id: true, name: true, email: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const pastClosings = await prisma.shiftClosing.findMany({
    where: {
      portal: "PHARMACY",
      ...(session.user.role === "ADMIN" ? {} : { userId: session.user.id }),
    },
    include: {
      user: { select: { id: true, name: true, email: true } },
      approvedBy: { select: { id: true, name: true, email: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 10,
  });

  // Query low-stock medicines (approved live stock <= threshold)
  const allCatalogMedicines = await prisma.medicine.findMany({
    include: {
      batches: {
        where: {
          approvalStatus: "APPROVED",
          quantity: { gt: 0 },
        },
      },
    },
    orderBy: { name: "asc" },
  });

  const lowStockItems = allCatalogMedicines
    .map((med) => {
      const totalStock = med.batches.reduce((sum, b) => sum + b.quantity, 0);
      return {
        id: med.id,
        name: med.name,
        genericName: med.genericName,
        category: med.category,
        itemType: med.itemType || "MEDICINE",
        threshold: med.threshold,
        totalStock,
        isLowStock: totalStock <= med.threshold,
      };
    })
    .filter((med) => med.isLowStock)
    .sort((a, b) => a.totalStock - b.totalStock);

  return NextResponse.json({
    success: true,
    targetDate: dayStart.toISOString().split("T")[0],
    staffName: session.user.name || "Muhammad Tariq (Pharmacist)",
    staffRole: "Pharmacy POS & Dispensary Lead",
    summary: {
      totalRevenue,
      totalGrossBilled,
      totalDiscount,
      totalSalesCount: sales.length + invoices.length,
      totalUnitsSold,
      uniqueMedicinesCount: itemizedSales.length,
      openingFloat,
      totalExpenditures,
      expectedCashInDrawer,
      lowStockCount: lowStockItems.length,
    },
    activeClosing,
    pastClosings,
    expenditures,
    itemizedSales,
    transactions,
    lowStockItems,
    lowStockCount: lowStockItems.length,
  });
}


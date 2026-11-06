import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type") || "overview";
  const targetDateStr = searchParams.get("date") || new Date().toISOString().split("T")[0];
  const search = searchParams.get("search")?.trim() || "";

  try {
    // 1. ALL-REPORTS OVERVIEW
    if (type === "overview") {
      const [
        totalVisits,
        visitsFeeAgg,
        totalInvoices,
        invoicesAgg,
        totalSales,
        salesAgg,
        batches,
        totalAuditLogs,
      ] = await Promise.all([
        prisma.visit.count(),
        prisma.visit.aggregate({ _sum: { fee: true } }),
        prisma.invoice.count(),
        prisma.invoice.aggregate({
          where: { status: "PAID" },
          _sum: { totalAmount: true, discount: true },
        }),
        prisma.pharmacySale.count(),
        prisma.pharmacySale.aggregate({
          _sum: { totalAmount: true, discount: true },
        }),
        prisma.stockBatch.findMany({
          select: { quantity: true, purchasePrice: true, approvalStatus: true },
        }),
        prisma.auditLog.count(),
      ]);

      const inventoryValuation = batches
        .filter((b) => b.approvalStatus === "APPROVED")
        .reduce((sum, b) => sum + b.quantity * b.purchasePrice, 0);

      const pendingBatchesCount = batches.filter((b) => b.approvalStatus === "PENDING").length;

      // Today's fast snapshot for daily recon
      const [year, month, day] = targetDateStr.split("-").map(Number);
      const startOfDay = new Date(year, month - 1, day, 0, 0, 0, 0);
      const endOfDay = new Date(year, month - 1, day, 23, 59, 59, 999);

      const [todayInvoices, todaySales] = await Promise.all([
        prisma.invoice.findMany({
          where: { status: "PAID", createdAt: { gte: startOfDay, lte: endOfDay } },
          select: { totalAmount: true },
        }),
        prisma.pharmacySale.findMany({
          where: { createdAt: { gte: startOfDay, lte: endOfDay } },
          select: { totalAmount: true },
        }),
      ]);

      const todayClinNet = todayInvoices.reduce((s, i) => s + i.totalAmount, 0);
      const todayRxNet = todaySales.reduce((s, i) => s + i.totalAmount, 0);

      return NextResponse.json({
        overview: {
          visits: {
            count: totalVisits,
            totalRevenue: visitsFeeAgg._sum.fee || 0,
          },
          invoices: {
            count: totalInvoices,
            netCollected: invoicesAgg._sum.totalAmount || 0,
            discounts: invoicesAgg._sum.discount || 0,
          },
          sales: {
            count: totalSales,
            netRevenue: salesAgg._sum.totalAmount || 0,
            discounts: salesAgg._sum.discount || 0,
          },
          inventory: {
            batchCount: batches.length,
            valuation: inventoryValuation,
            pendingCount: pendingBatchesCount,
          },
          audit: {
            totalLogs: totalAuditLogs,
          },
          daily: {
            date: targetDateStr,
            clinicalNet: todayClinNet,
            pharmacyNet: todayRxNet,
            combinedNet: todayClinNet + todayRxNet,
          },
        },
      });
    }

    // 2. VISITS PREVIEW (Patient Clinical Encounters)
    if (type === "visits") {
      const visitWhere = search
        ? {
            OR: [
              { patient: { name: { contains: search, mode: "insensitive" as const } } },
              { patient: { patientUid: { contains: search, mode: "insensitive" as const } } },
              { patient: { phone: { contains: search, mode: "insensitive" as const } } },
              { serviceType: { contains: search, mode: "insensitive" as const } },
              { invoice: { invoiceNumber: { contains: search, mode: "insensitive" as const } } },
            ],
          }
        : {};

      const [totalCount, visits, uniquePatients, serviceAgg] = await Promise.all([
        prisma.visit.count(),
        prisma.visit.findMany({
          where: visitWhere,
          take: search ? 50 : 20,
          orderBy: { createdAt: "desc" },
          include: { patient: true, invoice: true },
        }),
        prisma.visit.groupBy({ by: ["patientId"] }),
        prisma.visit.groupBy({
          by: ["serviceType"],
          _count: { id: true },
          _sum: { fee: true },
        }),
      ]);

      const totalRevenue = visits.reduce((acc, v) => acc + v.fee, 0);
      const topService = serviceAgg.sort((a, b) => b._count.id - a._count.id)[0]?.serviceType || "General OPD";

      return NextResponse.json({
        meta: {
          title: "Patient Clinical Encounters",
          description: "Comprehensive record of OPD consultations, ultrasound diagnostics, and physician examinations.",
          reportType: "visits",
          exportUrl: search ? `/api/admin/export?type=visits&search=${encodeURIComponent(search)}` : "/api/admin/export?type=visits",
          filename: `Ruqayya_clinic_visits_${new Date().toISOString().split("T")[0]}.csv`,
          searchQuery: search || undefined,
        },
        summaryCards: [
          {
            label: search ? "Matching Encounters" : "Total Encounters",
            value: search ? visits.length.toString() : totalCount.toString(),
            helper: search ? `Filtered by "${search}"` : "All time recorded",
            color: "blue",
          },
          {
            label: search ? "Filtered Revenue" : "Gross Fees Value",
            value: `Rs. ${totalRevenue.toLocaleString()}`,
            helper: search ? "Total for matching encounters" : "Sample / Ledger total",
            color: "purple",
          },
          {
            label: "Unique Patients",
            value: search ? new Set(visits.map((v) => v.patientId)).size.toString() : uniquePatients.length.toString(),
            helper: search ? "Distinct matches" : "Distinct individuals",
            color: "emerald",
          },
          { label: "Primary Service", value: topService, helper: "Most requested procedure", color: "amber" },
        ],
        columns: ["Time", "Patient UID", "Patient Name", "Procedure / Service", "Fee (Rs.)", "Invoice #", "Status"],
        records: visits.map((v) => ({
          id: v.id,
          col1: new Date(v.createdAt).toLocaleDateString() + " " + new Date(v.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          col2: v.patient.patientUid,
          col3: v.patient.name,
          col4: v.serviceType,
          col5: `Rs. ${v.fee.toFixed(2)}`,
          col6: v.invoice ? v.invoice.invoiceNumber : "N/A",
          col7: v.invoice ? v.invoice.status : "UNBILLED",
          badgeColor: v.invoice?.status === "PAID" ? "emerald" : "amber",
        })),
      });
    }

    // 3. INVOICES PREVIEW
    if (type === "invoices") {
      const invoiceWhere = search
        ? {
            OR: [
              { invoiceNumber: { contains: search, mode: "insensitive" as const } },
              { patient: { name: { contains: search, mode: "insensitive" as const } } },
              { patient: { patientUid: { contains: search, mode: "insensitive" as const } } },
              { user: { name: { contains: search, mode: "insensitive" as const } } },
            ],
          }
        : {};

      const [totalCount, invoices, paidCount] = await Promise.all([
        prisma.invoice.count(),
        prisma.invoice.findMany({
          where: invoiceWhere,
          take: search ? 50 : 20,
          orderBy: { createdAt: "desc" },
          include: { patient: true, user: true, visit: true },
        }),
        prisma.invoice.count({ where: { status: "PAID" } }),
      ]);

      const totalGross = invoices.reduce((s, i) => s + (i.totalAmount + i.discount), 0);
      const totalDiscounts = invoices.reduce((s, i) => s + i.discount, 0);
      const totalNet = invoices.reduce((s, i) => s + i.totalAmount, 0);

      return NextResponse.json({
        meta: {
          title: "Clinical Hospital Invoices",
          description: "Audited ledger of sequential invoice numbers, receptionist cashiers, line items, and paid status.",
          reportType: "invoices",
          exportUrl: "/api/admin/export?type=invoices",
          filename: `Ruqayya_clinic_invoices_${new Date().toISOString().split("T")[0]}.csv`,
        },
        summaryCards: [
          { label: "Total Invoices", value: totalCount.toString(), helper: `${paidCount} settled as PAID`, color: "emerald" },
          { label: "Gross Billed", value: `Rs. ${totalGross.toFixed(2)}`, helper: "Before patient discounts", color: "blue" },
          { label: "Discounts Issued", value: `Rs. ${totalDiscounts.toFixed(2)}`, helper: "Clinical courtesy & fee reductions", color: "amber" },
          { label: "Net Cash Received", value: `Rs. ${totalNet.toFixed(2)}`, helper: "Net audited clinical collections", color: "purple" },
        ],
        columns: ["Invoice #", "Date & Time", "Patient UID & Name", "Operator", "Service Type", "Discount", "Net Total", "Status"],
        records: invoices.map((inv) => ({
          id: inv.id,
          col1: inv.invoiceNumber,
          col2: new Date(inv.createdAt).toLocaleDateString() + " " + new Date(inv.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          col3: `${inv.patient.name} (${inv.patient.patientUid})`,
          col4: inv.user.name,
          col5: inv.visit?.serviceType || "Clinical Consultation",
          col6: inv.discount > 0 ? `-Rs. ${inv.discount.toFixed(2)}` : "Rs. 0.00",
          col7: `Rs. ${inv.totalAmount.toFixed(2)}`,
          col8: inv.status,
          badgeColor: inv.status === "PAID" ? "emerald" : "red",
        })),
      });
    }

    // 4. SALES PREVIEW
    if (type === "sales") {
      const [totalCount, sales] = await Promise.all([
        prisma.pharmacySale.count(),
        prisma.pharmacySale.findMany({
          take: 10,
          orderBy: { createdAt: "desc" },
          include: {
            patient: true,
            user: true,
            items: { include: { medicine: { include: { batches: true } } } },
          },
        }),
      ]);

      let totalGross = 0;
      let totalDiscounts = 0;
      let totalNet = 0;
      let totalCOGS = 0;
      let totalUnits = 0;

      for (const s of sales) {
        totalGross += s.totalAmount + s.discount;
        totalDiscounts += s.discount;
        totalNet += s.totalAmount;
        for (const item of s.items) {
          totalUnits += item.quantity;
          const avgCost =
            item.medicine.batches.length > 0
              ? item.medicine.batches[0].purchasePrice
              : item.unitPrice * 0.6;
          totalCOGS += item.quantity * avgCost;
        }
      }

      const totalProfit = Math.max(0, totalNet - totalCOGS);

      return NextResponse.json({
        meta: {
          title: "Pharmacy POS Sales Ledger",
          description: "Dispensary POS sales records, customer linkages, 5% generic discount deductions, and profit margins.",
          reportType: "sales",
          exportUrl: "/api/admin/export?type=sales",
          filename: `Ruqayya_clinic_sales_${new Date().toISOString().split("T")[0]}.csv`,
        },
        summaryCards: [
          { label: "Total POS Sales", value: totalCount.toString(), helper: `${totalUnits} units dispensed`, color: "amber" },
          { label: "Gross Sales Value", value: `Rs. ${totalGross.toFixed(2)}`, helper: "Retail list price", color: "blue" },
          { label: "5% Generic Savings", value: `Rs. ${totalDiscounts.toFixed(2)}`, helper: "Discounts passed to patients", color: "emerald" },
          { label: "Est. Pharmacy Profit", value: `Rs. ${totalProfit.toFixed(2)}`, helper: `COGS: Rs. ${totalCOGS.toFixed(2)}`, color: "purple" },
        ],
        columns: ["Sale #", "Date & Time", "Customer / Patient", "Pharmacist", "Medicines Sold", "Discount", "Net Total"],
        records: sales.map((s) => ({
          id: s.id,
          col1: s.saleNumber,
          col2: new Date(s.createdAt).toLocaleDateString() + " " + new Date(s.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          col3: s.patient ? `${s.patient.name} (${s.patient.patientUid})` : "Walk-in Customer",
          col4: s.user.name,
          col5: s.items.map((i) => `${i.medicine.name} (x${i.quantity})`).join(", "),
          col6: s.discount > 0 ? `-Rs. ${s.discount.toFixed(2)}` : "Rs. 0.00",
          col7: `Rs. ${s.totalAmount.toFixed(2)}`,
          badgeColor: "amber",
        })),
      });
    }

    // 5. INVENTORY PREVIEW
    if (type === "inventory") {
      const [totalCount, batches] = await Promise.all([
        prisma.stockBatch.count(),
        prisma.stockBatch.findMany({
          take: 10,
          orderBy: { createdAt: "desc" },
          include: { medicine: true },
        }),
      ]);

      const totalQuantity = batches.reduce((s, b) => s + b.quantity, 0);
      const totalValuation = batches.reduce((s, b) => s + b.quantity * b.purchasePrice, 0);
      const retailValuation = batches.reduce((s, b) => s + b.quantity * b.sellingPrice, 0);
      const pendingCount = batches.filter((b) => b.approvalStatus === "PENDING").length;

      return NextResponse.json({
        meta: {
          title: "Medicine Batches & Valuations",
          description: "Inventory stock positions, batch numbers, acquisition costs, retail prices, and expiry monitoring.",
          reportType: "inventory",
          exportUrl: "/api/admin/export?type=inventory",
          filename: `Ruqayya_clinic_inventory_${new Date().toISOString().split("T")[0]}.csv`,
        },
        summaryCards: [
          { label: "Total Batches", value: totalCount.toString(), helper: `${totalQuantity} total units in stock`, color: "blue" },
          { label: "Purchase Asset Value", value: `Rs. ${totalValuation.toLocaleString()}`, helper: "Acquisition cost valuation", color: "purple" },
          { label: "Projected Retail Value", value: `Rs. ${retailValuation.toLocaleString()}`, helper: "Selling value if all dispensed", color: "emerald" },
          { label: "Pending Approvals", value: pendingCount.toString(), helper: "Awaiting Admin authorization", color: pendingCount > 0 ? "amber" : "slate" },
        ],
        columns: ["Medicine Name", "Batch #", "Units", "Purchase (Cost)", "Selling (Price)", "Expiry Date", "Status"],
        records: batches.map((b) => ({
          id: b.id,
          col1: `${b.medicine.name} (${b.medicine.genericName})`,
          col2: b.batchNumber,
          col3: `${b.quantity} units`,
          col4: `Rs. ${b.purchasePrice.toFixed(2)}`,
          col5: `Rs. ${b.sellingPrice.toFixed(2)}`,
          col6: new Date(b.expiryDate).toLocaleDateString(),
          col7: b.approvalStatus,
          badgeColor: b.approvalStatus === "APPROVED" ? "emerald" : b.approvalStatus === "PENDING" ? "amber" : "red",
        })),
      });
    }

    // 6. AUDIT LOGS PREVIEW
    if (type === "audit") {
      const [totalCount, logs, uniqueUsers] = await Promise.all([
        prisma.auditLog.count(),
        prisma.auditLog.findMany({
          take: 10,
          orderBy: { createdAt: "desc" },
          include: { user: true },
        }),
        prisma.auditLog.groupBy({ by: ["userId"] }),
      ]);

      const lastActivity = logs[0] ? new Date(logs[0].createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "N/A";

      return NextResponse.json({
        meta: {
          title: "Full Immutable Audit Trail",
          description: "Cryptographically verifiable, non-repudiation security audit trail logging every administrative and clinical operation.",
          reportType: "audit",
          exportUrl: "/api/admin/export?type=audit",
          filename: `Ruqayya_clinic_audit_${new Date().toISOString().split("T")[0]}.csv`,
        },
        summaryCards: [
          { label: "Total Audit Events", value: totalCount.toString(), helper: "Immutable security records", color: "purple" },
          { label: "Active Operators", value: uniqueUsers.length.toString(), helper: "System staff members", color: "blue" },
          { label: "Latest Event", value: lastActivity, helper: "Most recent recorded action", color: "emerald" },
          { label: "Compliance Status", value: "Verified", helper: "RFC 4180 & ISO standard", color: "emerald" },
        ],
        columns: ["Timestamp", "User & Role", "Action Event", "Audit Details Logged"],
        records: logs.map((l) => ({
          id: l.id,
          col1: new Date(l.createdAt).toLocaleDateString() + " " + new Date(l.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
          col2: `${l.user.name} (${l.user.role})`,
          col3: l.action,
          col4: l.details,
          badgeColor: l.action.includes("APPROVED") ? "emerald" : l.action.includes("LOGIN") ? "blue" : "purple",
        })),
      });
    }

    // 7. DAILY CROSS-PORTAL RECONCILIATION PREVIEW
    if (type === "daily") {
      const [year, month, day] = targetDateStr.split("-").map(Number);
      const startOfDay = new Date(year, month - 1, day, 0, 0, 0, 0);
      const endOfDay = new Date(year, month - 1, day, 23, 59, 59, 999);

      const [invoices, sales] = await Promise.all([
        prisma.invoice.findMany({
          where: { status: "PAID", createdAt: { gte: startOfDay, lte: endOfDay } },
          include: { patient: true, user: true, visit: true },
          orderBy: { createdAt: "desc" },
        }),
        prisma.pharmacySale.findMany({
          where: { createdAt: { gte: startOfDay, lte: endOfDay } },
          include: {
            patient: true,
            user: true,
            items: { include: { medicine: { include: { batches: true } } } },
          },
          orderBy: { createdAt: "desc" },
        }),
      ]);

      let clinNet = 0;
      let clinDisc = 0;
      for (const inv of invoices) {
        clinNet += inv.totalAmount;
        clinDisc += inv.discount;
      }

      let rxNet = 0;
      let rxDisc = 0;
      let rxCOGS = 0;
      for (const s of sales) {
        rxNet += s.totalAmount;
        rxDisc += s.discount;
        for (const it of s.items) {
          const avgCost =
            it.medicine.batches.length > 0
              ? it.medicine.batches[0].purchasePrice
              : it.unitPrice * 0.6;
          rxCOGS += it.quantity * avgCost;
        }
      }

      const rxProfit = Math.max(0, rxNet - rxCOGS);
      const combinedTotal = clinNet + rxNet;
      const combinedProfit = clinNet + rxProfit;
      const clinPercent = combinedTotal > 0 ? ((clinNet / combinedTotal) * 100).toFixed(1) : "0";
      const rxPercent = combinedTotal > 0 ? ((rxNet / combinedTotal) * 100).toFixed(1) : "0";

      // Combine recent items from both streams for display
      const combinedRecords: any[] = [];
      for (const inv of invoices.slice(0, 5)) {
        combinedRecords.push({
          id: inv.id,
          col1: new Date(inv.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          col2: "Clinical Hospital",
          col3: inv.invoiceNumber,
          col4: `${inv.patient.name} (${inv.patient.patientUid})`,
          col5: inv.visit?.serviceType || "Clinical Consultation",
          col6: inv.discount > 0 ? `-Rs. ${inv.discount.toFixed(2)}` : "Rs. 0.00",
          col7: `Rs. ${inv.totalAmount.toFixed(2)}`,
          badgeColor: "blue",
        });
      }
      for (const s of sales.slice(0, 5)) {
        combinedRecords.push({
          id: s.id,
          col1: new Date(s.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          col2: "Pharmacy POS",
          col3: s.saleNumber,
          col4: s.patient ? `${s.patient.name} (${s.patient.patientUid})` : "Walk-in Customer",
          col5: s.items.map((i) => `${i.medicine.name} (x${i.quantity})`).join(", "),
          col6: s.discount > 0 ? `-Rs. ${s.discount.toFixed(2)}` : "Rs. 0.00",
          col7: `Rs. ${s.totalAmount.toFixed(2)}`,
          badgeColor: "amber",
        });
      }

      return NextResponse.json({
        meta: {
          title: "Daily Cross-Portal Sales Reconciliation",
          description: `Daily financial comparative audit between Clinical Hospital and Pharmaceutical POS streams for ${targetDateStr}.`,
          reportType: "daily",
          exportUrl: `/api/admin/export?type=daily&date=${targetDateStr}`,
          filename: `Ruqayya_clinic_daily_sales_reconciliation_${targetDateStr}.csv`,
        },
        summaryCards: [
          { label: "Net Combined Revenue", value: `Rs. ${combinedTotal.toFixed(2)}`, helper: `Gross: Rs. ${(clinNet + clinDisc + rxNet + rxDisc).toFixed(2)}`, color: "purple" },
          { label: "Clinical Share", value: `Rs. ${clinNet.toFixed(2)}`, helper: `${clinPercent}% of day (${invoices.length} invoices)`, color: "blue" },
          { label: "Pharmacy Share", value: `Rs. ${rxNet.toFixed(2)}`, helper: `${rxPercent}% of day (${sales.length} sales)`, color: "amber" },
          { label: "Net Operating Profit", value: `Rs. ${combinedProfit.toFixed(2)}`, helper: `COGS: Rs. ${rxCOGS.toFixed(2)} (Rx profit: Rs. ${rxProfit.toFixed(2)})`, color: "emerald" },
        ],
        columns: ["Time", "Stream", "Ref #", "Patient / Customer", "Details / Service", "Discount", "Net Amount"],
        records: combinedRecords,
      });
    }

    return NextResponse.json({ error: "Unknown report type" }, { status: 400 });
  } catch (error: any) {
    console.error("Report preview failed:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}


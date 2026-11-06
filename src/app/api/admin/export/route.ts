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
  const type = searchParams.get("type") || "invoices";
  const search = searchParams.get("search")?.trim() || "";
  const dateStr = new Date().toISOString().split("T")[0];

  let csvContent = "";
  let filename = `Ruqayya_clinic_${type}_${dateStr}.csv`;

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

    const visits = await prisma.visit.findMany({
      where: visitWhere,
      include: { patient: true, invoice: true },
      orderBy: { createdAt: "desc" },
    });

    csvContent = "Visit ID,Date,Patient UID,Patient Name,Service Type,Fee (Rs.),Invoice #,Status\n";
    for (const v of visits) {
      csvContent += `"${v.id}","${v.createdAt.toISOString()}","${v.patient.patientUid}","${
        v.patient.name
      }","${v.serviceType}","${v.fee.toFixed(2)}","${
        v.invoice ? v.invoice.invoiceNumber : "N/A"
      }","${v.invoice ? v.invoice.status : "PENDING"}"\n`;
    }
  } else if (type === "invoices") {
    const invoices = await prisma.invoice.findMany({
      include: { patient: true, user: true, visit: true },
      orderBy: { createdAt: "desc" },
    });

    csvContent =
      "Invoice Number,Date,Patient UID,Patient Name,Operator,Service,Total (Rs.),Discount (Rs.),Status\n";
    for (const inv of invoices) {
      csvContent += `"${inv.invoiceNumber}","${inv.createdAt.toISOString()}","${
        inv.patient.patientUid
      }","${inv.patient.name}","${inv.user.name}","${
        inv.visit?.serviceType || "Clinical Service"
      }","${inv.totalAmount.toFixed(2)}","${inv.discount.toFixed(2)}","${inv.status}"\n`;
    }
  } else if (type === "sales") {
    const sales = await prisma.pharmacySale.findMany({
      include: {
        patient: true,
        user: true,
        items: { include: { medicine: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    csvContent =
      "Sale Number,Date,Patient UID,Customer Name,Pharmacist,Items Count,Discount (Rs.),Total Amount (Rs.)\n";
    for (const s of sales) {
      csvContent += `"${s.saleNumber}","${s.createdAt.toISOString()}","${
        s.patient?.patientUid || "WALK-IN"
      }","${s.patient?.name || "Walk-in Customer"}","${s.user.name}","${
        s.items.length
      }","${s.discount.toFixed(2)}","${s.totalAmount.toFixed(2)}"\n`;
    }
  } else if (type === "inventory") {
    const batches = await prisma.stockBatch.findMany({
      include: { medicine: true },
      orderBy: { createdAt: "desc" },
    });

    csvContent =
      "Medicine Name,Generic Name,Category,Batch Number,Quantity,Purchase Price (Rs.),Selling Price (Rs.),Expiry Date,Status\n";
    for (const b of batches) {
      csvContent += `"${b.medicine.name}","${b.medicine.genericName}","${
        b.medicine.category
      }","${b.batchNumber}","${b.quantity}","${b.purchasePrice.toFixed(
        2
      )}","${b.sellingPrice.toFixed(2)}","${
        b.expiryDate.toISOString().split("T")[0]
      }","${b.approvalStatus}"\n`;
    }
  } else if (type === "audit") {
    const logs = await prisma.auditLog.findMany({
      include: { user: true },
      orderBy: { createdAt: "desc" },
    });

    csvContent = "Timestamp,User,User Email,Role,Action,Details\n";
    for (const l of logs) {
      csvContent += `"${l.createdAt.toISOString()}","${l.user.name}","${
        l.user.email
      }","${l.user.role}","${l.action}","${l.details.replace(/"/g, '""')}"\n`;
    }
  } else if (type === "daily") {
    const targetDateStr = searchParams.get("date") || dateStr;
    filename = `Ruqayya_clinic_daily_sales_reconciliation_${targetDateStr}.csv`;

    const [year, month, day] = targetDateStr.split("-").map(Number);
    const startOfDay = new Date(year, month - 1, day, 0, 0, 0, 0);
    const endOfDay = new Date(year, month - 1, day, 23, 59, 59, 999);

    const [invoices, sales] = await Promise.all([
      prisma.invoice.findMany({
        where: {
          status: "PAID",
          createdAt: { gte: startOfDay, lte: endOfDay },
        },
        include: { patient: true, user: true, visit: true },
        orderBy: { createdAt: "desc" },
      }),
      prisma.pharmacySale.findMany({
        where: {
          createdAt: { gte: startOfDay, lte: endOfDay },
        },
        include: {
          patient: true,
          user: true,
          items: {
            include: { medicine: { include: { batches: true } } },
          },
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

    // Header & Summary Block
    csvContent = `Ruqayya CLINIC & PHARMACY - DAILY SALES & RECONCILIATION AUDIT REPORT\n`;
    csvContent += `Report Date,"${targetDateStr}"\n`;
    csvContent += `Generated At,"${new Date().toISOString()}"\n`;
    csvContent += `Generated By,"${session.user.name} (${session.user.role})"\n\n`;

    csvContent += `FINANCIAL SUMMARY\n`;
    csvContent += `Stream,Count,Gross Total (Rs.),Discounts Given (Rs.),Net Cash Collected (Rs.),COGS (Rs.),Net Profit (Rs.)\n`;
    csvContent += `"Clinical Hospital Portal",${invoices.length},"${(clinNet + clinDisc).toFixed(2)}","${clinDisc.toFixed(2)}","${clinNet.toFixed(2)}","0.00","${clinNet.toFixed(2)}"\n`;
    csvContent += `"Pharmacy Dispensary Portal",${sales.length},"${(rxNet + rxDisc).toFixed(2)}","${rxDisc.toFixed(2)}","${rxNet.toFixed(2)}","${rxCOGS.toFixed(2)}","${rxProfit.toFixed(2)}"\n`;
    csvContent += `"COMBINED DAILY REVENUE",${invoices.length + sales.length},"${(clinNet + clinDisc + rxNet + rxDisc).toFixed(2)}","${(clinDisc + rxDisc).toFixed(2)}","${combinedTotal.toFixed(2)}","${rxCOGS.toFixed(2)}","${(clinNet + rxProfit).toFixed(2)}"\n\n`;

    // Clinical Table
    csvContent += `1. CLINICAL RECEPTION INVOICES DETAIL\n`;
    csvContent += `Time,Invoice Number,Patient UID,Patient Name,Service Type,Operator,Gross (Rs.),Discount (Rs.),Net Paid (Rs.)\n`;
    for (const inv of invoices) {
      csvContent += `"${inv.createdAt.toLocaleTimeString()}","${inv.invoiceNumber}","${inv.patient.patientUid}","${inv.patient.name}","${inv.visit?.serviceType || "Clinical Consultation"}","${inv.user.name}","${(inv.totalAmount + inv.discount).toFixed(2)}","${inv.discount.toFixed(2)}","${inv.totalAmount.toFixed(2)}"\n`;
    }
    if (invoices.length === 0) {
      csvContent += `"No clinical invoices issued on this date"\n`;
    }
    csvContent += `\n`;

    // Pharmacy Table
    csvContent += `2. PHARMACEUTICAL POS DISPENSARY SALES DETAIL\n`;
    csvContent += `Time,Sale Number,Patient UID,Customer Name,Pharmacist,Items Sold,Subtotal (Rs.),5% Generic Discount (Rs.),Net Collected (Rs.),COGS (Rs.),Profit (Rs.)\n`;
    for (const s of sales) {
      let sCOGS = 0;
      const itDescs = s.items.map((it) => {
        const avgCost =
          it.medicine.batches.length > 0
            ? it.medicine.batches[0].purchasePrice
            : it.unitPrice * 0.6;
        sCOGS += it.quantity * avgCost;
        return `${it.medicine.name} (x${it.quantity})`;
      }).join("; ");

      csvContent += `"${s.createdAt.toLocaleTimeString()}","${s.saleNumber}","${s.patient?.patientUid || "WALK-IN"}","${s.patient?.name || "Walk-in Customer"}","${s.user.name}","${itDescs}","${(s.totalAmount + s.discount).toFixed(2)}","${s.discount.toFixed(2)}","${s.totalAmount.toFixed(2)}","${sCOGS.toFixed(2)}","${(s.totalAmount - sCOGS).toFixed(2)}"\n`;
    }
    if (sales.length === 0) {
      csvContent += `"No pharmacy POS sales recorded on this date"\n`;
    }
  }

  return new NextResponse(csvContent, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}


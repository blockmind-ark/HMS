import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { recordAuditLog } from "@/lib/audit";
import { ApprovalStatus, ShiftStatus } from "@prisma/client";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [requests, drawerAdjustments, shiftClosings] = await Promise.all([
    // 1. Pharmacy Stock Requests
    prisma.approvalRequest.findMany({
      include: {
        requestedBy: {
          select: { id: true, name: true, email: true, role: true },
        },
      },
      orderBy: { createdAt: "desc" },
    }),

    // 2. Receptionist Cash Drawer Adjustments
    prisma.drawerAdjustment.findMany({
      include: {
        user: { select: { id: true, name: true, email: true, role: true } },
        approvedBy: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: "desc" },
    }),

    // 3. Shift Closings Awaiting Approval & Final Commit
    prisma.shiftClosing.findMany({
      include: {
        user: { select: { id: true, name: true, email: true, role: true } },
        approvedBy: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const pendingStock = requests.filter((r) => r.status === "PENDING").length;
  const pendingAdjustments = drawerAdjustments.filter((a) => a.status === "PENDING").length;
  const pendingShifts = shiftClosings.filter((s) => s.status === ShiftStatus.PENDING_APPROVAL).length;

  // Enrich shift closings with clinical services breakdown (High to Low)
  const shiftClosingsWithDetails = await Promise.all(
    shiftClosings.map(async (shift) => {
      try {
        const sDate = new Date(shift.shiftDate);
        const startOfDay = new Date(sDate);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(sDate);
        endOfDay.setHours(23, 59, 59, 999);
        const targetDateStr = startOfDay.toISOString().split("T")[0];

        const [invoices, tokens, drawerAdjustments, expenditures] = await Promise.all([
          prisma.invoice.findMany({
            where: {
              userId: shift.userId,
              createdAt: { gte: startOfDay, lte: endOfDay },
              status: "PAID",
            },
            include: { items: true, visit: true },
          }),
          prisma.dailyTokenLog.findMany({
            where: {
              dateStr: targetDateStr,
              status: "ISSUED",
              issuedById: shift.userId,
            },
          }),
          prisma.drawerAdjustment.findMany({
            where: {
              userId: shift.userId,
              createdAt: { gte: startOfDay, lte: endOfDay },
            },
            include: {
              user: { select: { id: true, name: true, email: true } },
            },
            orderBy: { createdAt: "desc" },
          }),
          prisma.expenditure.findMany({
            where: {
              createdAt: { gte: startOfDay, lte: endOfDay },
              portal: (shift.portal as any) || "RECEPTION",
            },
            include: {
              user: { select: { id: true, name: true, email: true } },
            },
            orderBy: { createdAt: "desc" },
          }),
        ]);

        const cashInList: Array<{
          id: string;
          type: string;
          amount: number;
          reason: string;
          createdAt: string;
          userName: string;
        }> = [];

        const cashOutList: Array<{
          id: string;
          type: string;
          category: string;
          amount: number;
          reason: string;
          createdAt: string;
          userName: string;
        }> = [];

        for (const adj of drawerAdjustments) {
          if (adj.type === "CASH_IN") {
            cashInList.push({
              id: adj.id,
              type: "CASH_IN",
              amount: adj.amount,
              reason: adj.remarks || "Counter Float / Drawer Cash In",
              createdAt: adj.createdAt.toISOString(),
              userName: adj.user?.name || "Staff",
            });
          } else if (adj.type === "CASH_OUT") {
            cashOutList.push({
              id: adj.id,
              type: "CASH_OUT",
              category: "Drawer Cash Out",
              amount: adj.amount,
              reason: adj.remarks || "Counter Cash Out",
              createdAt: adj.createdAt.toISOString(),
              userName: adj.user?.name || "Staff",
            });
          }
        }

        for (const exp of expenditures) {
          cashOutList.push({
            id: exp.id,
            type: "EXPENDITURE",
            category: exp.category || "Petty Cash",
            amount: exp.amount,
            reason: exp.remarks || exp.category,
            createdAt: exp.createdAt.toISOString(),
            userName: exp.user?.name || "Staff",
          });
        }

        const totalCashIn = cashInList.reduce((sum, item) => sum + item.amount, 0);
        const totalCashOut = cashOutList.reduce((sum, item) => sum + item.amount, 0);

        if (shift.portal === "PHARMACY") {
          const sales = await prisma.pharmacySale.findMany({
            where: {
              userId: shift.userId,
              createdAt: { gte: startOfDay, lte: endOfDay },
            },
            include: {
              items: {
                include: { medicine: true },
              },
            },
          });

          const medBreakdown: Record<string, { count: number; total: number }> = {};
          for (const s of sales) {
            for (const it of s.items) {
              const medName = it.medicine.name;
              if (!medBreakdown[medName]) medBreakdown[medName] = { count: 0, total: 0 };
              medBreakdown[medName].count += it.quantity;
              medBreakdown[medName].total += it.totalPrice;
            }
          }

          const sortedMedBreakdown = Object.entries(medBreakdown)
            .map(([service, d]) => ({ service, count: d.count, total: d.total }))
            .sort((a, b) => b.total - a.total || b.count - a.count);

          return {
            ...shift,
            invoiceCount: sales.length,
            tokenCount: 0,
            serviceBreakdown: sortedMedBreakdown,
            cashInList,
            cashOutList,
            totalCashIn,
            totalCashOut,
          };
        }

        const STANDARD_SERVICES = [
          "Ultrasound TVS",
          "Ultrasound Liver, Kidney & Stomach",
          "Ultrasound Abdomen",
          "OPD Fees",
          "Sugar Test",
          "U P D",
          "BP",
        ];

        const breakdown: Record<string, { count: number; total: number }> = {};
        for (const s of STANDARD_SERVICES) {
          breakdown[s] = { count: 0, total: 0 };
        }

        // 1. Tokens
        for (const t of tokens) {
          const services = t.services as any;
          if (Array.isArray(services) && services.length > 0) {
            for (const s of services) {
              let name = s.name || s.id;
              if (/opd/i.test(s.id || s.name)) name = "OPD Fees";
              else if (/sugar/i.test(s.id || s.name)) name = "Sugar Test";
              else if (/upd/i.test(s.id || s.name)) name = "U P D";
              else if (/bp/i.test(s.id || s.name)) name = "BP";

              if (!breakdown[name]) breakdown[name] = { count: 0, total: 0 };
              breakdown[name].count += 1;
              breakdown[name].total += (s.fee || 0);
            }
          } else {
            breakdown["OPD Fees"].count += 1;
            breakdown["OPD Fees"].total += (t.fee || 300);
          }
        }

        // 2. Invoices
        for (const inv of invoices) {
          if (inv.items && inv.items.length > 0) {
            for (const it of inv.items) {
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

              if (!breakdown[name]) breakdown[name] = { count: 0, total: 0 };
              breakdown[name].count += (it.quantity || 1);
              breakdown[name].total += it.price * (it.quantity || 1);
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

            if (!breakdown[name]) breakdown[name] = { count: 0, total: 0 };
            breakdown[name].count += 1;
            breakdown[name].total += inv.totalAmount;
          }
        }

        const sortedBreakdown = Object.entries(breakdown)
          .map(([service, d]) => ({ service, count: d.count, total: d.total }))
          .sort((a, b) => b.total - a.total || b.count - a.count);

        return {
          ...shift,
          invoiceCount: invoices.length,
          tokenCount: tokens.length,
          serviceBreakdown: sortedBreakdown,
          cashInList,
          cashOutList,
          totalCashIn,
          totalCashOut,
        };
      } catch (err) {
        console.error("Error computing shift breakdown details:", err);
        return shift;
      }
    })
  );

  // Enrich stock requests with current medicine live stock and pricing for admin comparison
  const enrichedRequests = await Promise.all(
    requests.map(async (req) => {
      let details: any = {};
      try {
        details = JSON.parse(req.details);
      } catch (e) {}

      let currentMedicine: any = null;
      let linkedBatch: any = null;

      if (details.batchId) {
        linkedBatch = await prisma.stockBatch.findUnique({
          where: { id: details.batchId },
          include: {
            medicine: {
              include: {
                batches: {
                  where: { approvalStatus: "APPROVED", quantity: { gt: 0 } },
                },
              },
            },
          },
        });
        currentMedicine = linkedBatch?.medicine;
      } else if (details.medicineId) {
        currentMedicine = await prisma.medicine.findUnique({
          where: { id: details.medicineId },
          include: {
            batches: {
              where: { approvalStatus: "APPROVED", quantity: { gt: 0 } },
            },
          },
        });
      }

      if (currentMedicine) {
        const currentStock = currentMedicine.batches.reduce(
          (sum: number, b: any) => sum + b.quantity,
          0
        );
        const activeBatch = currentMedicine.batches[0] || null;

        return {
          ...req,
          parsedDetails: details,
          currentMedicineInfo: {
            id: currentMedicine.id,
            name: currentMedicine.name,
            genericName: currentMedicine.genericName,
            category: currentMedicine.category,
            currentStock,
            threshold: currentMedicine.threshold,
            perOff: currentMedicine.perOff,
            sellingPrice: activeBatch ? activeBatch.sellingPrice : 0,
            purchasePrice: activeBatch ? activeBatch.purchasePrice : 0,
          },
        };
      }

      return {
        ...req,
        parsedDetails: details,
        currentMedicineInfo: null,
      };
    })
  );

  return NextResponse.json({
    requests: enrichedRequests,
    drawerAdjustments,
    shiftClosings: shiftClosingsWithDetails,
    counts: {
      pendingStock,
      pendingAdjustments,
      pendingShifts,
      totalPending: pendingStock + pendingAdjustments + pendingShifts,
    },
  });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { type = "STOCK", id, status, comment, modifiedData } = await req.json();

    if (!id || (status !== "APPROVED" && status !== "REJECTED" && status !== "CANCELLED")) {
      return NextResponse.json({ error: "Valid id and status ('APPROVED' | 'REJECTED' | 'CANCELLED') required." }, { status: 400 });
    }

    // -------------------------------------------------------------
    // 1. DRAWER ADJUSTMENT APPROVAL / REJECTION
    // -------------------------------------------------------------
    if (type === "DRAWER_ADJUSTMENT") {
      const adjustment = await prisma.drawerAdjustment.findUnique({
        where: { id },
        include: { user: true },
      });

      if (!adjustment) {
        return NextResponse.json({ error: "Drawer adjustment request not found." }, { status: 404 });
      }

      const updatedAdjustment = await prisma.drawerAdjustment.update({
        where: { id },
        data: {
          status: status as ApprovalStatus,
          approvedById: session.user.id,
          adminComment: comment || null,
        },
        include: {
          user: { select: { id: true, name: true, email: true } },
          approvedBy: { select: { id: true, name: true, email: true } },
        },
      });

      await recordAuditLog({
        userId: session.user.id,
        action: status === "APPROVED" ? "DRAWER_ADJUSTMENT_APPROVED" : "DRAWER_ADJUSTMENT_REJECTED",
        details: `Admin ${session.user.name} ${status.toLowerCase()} cash drawer ${adjustment.type} adjustment of Rs. ${adjustment.amount.toLocaleString()} requested by ${adjustment.user.name}. Remarks: "${comment || adjustment.remarks}".`,
      });

      return NextResponse.json({
        success: true,
        type: "DRAWER_ADJUSTMENT",
        adjustment: updatedAdjustment,
        message: `Drawer adjustment ${status === "APPROVED" ? "approved & active" : "rejected"}.`,
      });
    }

    // -------------------------------------------------------------
    // 2. SHIFT CLOSING APPROVAL & FINAL COMMIT
    // -------------------------------------------------------------
    if (type === "SHIFT_CLOSING") {
      const shiftClosing = await prisma.shiftClosing.findUnique({
        where: { id },
        include: { user: true },
      });

      if (!shiftClosing) {
        return NextResponse.json({ error: "Shift closing record not found." }, { status: 404 });
      }

      const targetStatus = status === "APPROVED" ? ShiftStatus.APPROVED : ShiftStatus.REJECTED;

      const updatedShift = await prisma.shiftClosing.update({
        where: { id },
        data: {
          status: targetStatus,
          approvedById: session.user.id,
          adminComment: comment || null,
        },
        include: {
          user: { select: { id: true, name: true, email: true } },
          approvedBy: { select: { id: true, name: true, email: true } },
        },
      });

      await recordAuditLog({
        userId: session.user.id,
        action: status === "APPROVED" ? "SHIFT_CLOSE_APPROVED" : "SHIFT_CLOSE_REJECTED",
        details: `Admin ${session.user.name} ${status.toLowerCase()} and ${
          status === "APPROVED" ? "permanently committed" : "returned"
        } Shift Closing for ${shiftClosing.user.name} (${new Date(shiftClosing.shiftDate).toISOString().split("T")[0]}). System Cash: Rs. ${shiftClosing.totalSystemCash.toLocaleString()} | Physical Cash: Rs. ${shiftClosing.countedCash.toLocaleString()} | Variance: Rs. ${shiftClosing.variance.toLocaleString()}. Note: "${comment || "N/A"}".`,
      });

      return NextResponse.json({
        success: true,
        type: "SHIFT_CLOSING",
        shiftClosing: updatedShift,
        message:
          status === "APPROVED"
            ? "Shift closing sheet accepted & officially committed."
            : "Shift submission rejected and returned for re-entry.",
      });
    }

    // -------------------------------------------------------------
    // 3. STOCK & BATCH INTAKE APPROVAL (DEFAULT)
    // -------------------------------------------------------------
    const approvalReq = await prisma.approvalRequest.findUnique({
      where: { id },
    });

    if (!approvalReq) {
      return NextResponse.json({ error: "Approval request not found" }, { status: 404 });
    }

    let parsedDetails: any = {};
    try {
      parsedDetails = JSON.parse(approvalReq.details);
    } catch (e) {
      // details might not be JSON
    }

    const updated = await prisma.$transaction(async (tx) => {
      // 1. If admin modified values, merge into details
      const mergedDetails = {
        ...parsedDetails,
        ...(modifiedData || {}),
      };

      // Update the approval request
      const updatedReq = await tx.approvalRequest.update({
        where: { id },
        data: {
          status: status as ApprovalStatus,
          comment: comment || null,
          details: JSON.stringify(mergedDetails),
        },
        include: { requestedBy: true },
      });

      // 2. If it is linked to a batchId, update that batch
      if (parsedDetails.batchId) {
        const batchUpdateData: any = {
          approvalStatus: status === "CANCELLED" ? ApprovalStatus.CANCELLED : (status as ApprovalStatus),
        };

        if (modifiedData) {
          if (modifiedData.quantity !== undefined && modifiedData.quantity !== "") {
            batchUpdateData.quantity = parseInt(String(modifiedData.quantity), 10);
          }
          if (modifiedData.purchasePrice !== undefined && modifiedData.purchasePrice !== "") {
            batchUpdateData.purchasePrice = parseFloat(String(modifiedData.purchasePrice));
          }
          if (modifiedData.sellingPrice !== undefined && modifiedData.sellingPrice !== "") {
            batchUpdateData.sellingPrice = parseFloat(String(modifiedData.sellingPrice));
          }
          if (modifiedData.perOff !== undefined && modifiedData.perOff !== "") {
            batchUpdateData.perOff = parseFloat(String(modifiedData.perOff));
          }
          if (modifiedData.batchNumber) {
            batchUpdateData.batchNumber = String(modifiedData.batchNumber).trim().toUpperCase();
          }
          if (modifiedData.expiryDate) {
            batchUpdateData.expiryDate = new Date(modifiedData.expiryDate);
          }
        }

        const updatedBatch = await tx.stockBatch.update({
          where: { id: parsedDetails.batchId },
          data: batchUpdateData,
        });

        // 3. If approved, update medicine's threshold and perOff
        if (status === "APPROVED") {
          const medId = updatedBatch.medicineId || parsedDetails.medicineId;
          if (medId) {
            const medUpdate: any = {};
            const rawThresh = modifiedData?.threshold ?? parsedDetails.threshold ?? parsedDetails.newThreshold;
            if (rawThresh !== undefined && rawThresh !== null && rawThresh !== "") {
              const threshVal = parseInt(String(rawThresh), 10);
              if (!isNaN(threshVal) && threshVal >= 0) {
                medUpdate.threshold = threshVal;
              }
            }

            const rawPerOff = modifiedData?.perOff ?? parsedDetails.perOff;
            if (rawPerOff !== undefined && rawPerOff !== null && rawPerOff !== "") {
              const perOffVal = parseFloat(String(rawPerOff));
              if (!isNaN(perOffVal) && perOffVal >= 0) {
                medUpdate.perOff = perOffVal;
              }
            }

            if (Object.keys(medUpdate).length > 0) {
              await tx.medicine.update({
                where: { id: medId },
                data: medUpdate,
              });
            }
          }
        }
      }

      return updatedReq;
    });

    await recordAuditLog({
      userId: session.user.id,
      action: status === "APPROVED" ? "STOCK_APPROVED" : (status === "CANCELLED" ? "STOCK_CANCELLED" : "STOCK_REJECTED"),
      details: `Admin ${session.user.name} ${status.toLowerCase()} stock request #${id.slice(-6)} for ${
        parsedDetails.medicineName || "Batch Restock"
      } (${parsedDetails.batchNumber || "N/A"})${
        modifiedData ? " with admin modifications" : ""
      }. Note: ${comment || "None"}.`,
    });

    return NextResponse.json({ success: true, type: "STOCK", request: updated });
  } catch (error: any) {
    console.error("Admin approval error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to process approval" },
      { status: 500 }
    );
  }
}

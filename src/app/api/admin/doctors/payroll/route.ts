import { Prisma } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { DoctorPayrollAdjustSchema } from "@/lib/validation/doctor";
import { calculatePenalty, parsePenaltyPolicy, type PenaltyBreakdown } from "@/lib/doctor-penalties";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized. Admin privileges required." }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const now = new Date();
    const year = Number(searchParams.get("year")) || now.getFullYear();
    const month = Number(searchParams.get("month")) || (now.getMonth() + 1);

    // Include inactive doctors to preserve payroll history and visibility
    const doctors = await prisma.doctor.findMany({
      orderBy: { name: "asc" },
      include: {
        payrolls: {
          where: { year, month },
        },
      },
    });

    // Compute live calculations for this month if no payroll record exists yet
    const monthPrefix = `${year}-${String(month).padStart(2, "0")}`;

    const payrollList = await Promise.all(
      doctors.map(async (doc) => {
        let payroll = doc.payrolls[0] || null;

        // Working days count from attendance:
        const presentCount = await prisma.doctorAttendance.count({
          where: {
            doctorId: doc.id,
            dateStr: { startsWith: monthPrefix },
            status: { in: ["PRESENT", "HALF_DAY"] },
          },
        });

        // Total patient visits assigned to this doctor in this month:
        const visitsCount = await prisma.visit.count({
          where: {
            doctorId: doc.id,
            createdAt: {
              gte: new Date(year, month - 1, 1),
              lt: new Date(year, month, 1),
            },
          },
        });

        const perPatientBonus = visitsCount * doc.perPatientShare;
        const attendanceRows = await prisma.doctorAttendance.findMany({
          where: { doctorId: doc.id, dateStr: { startsWith: monthPrefix } },
          select: { status: true },
        });
        const penalty = calculatePenalty(
          parsePenaltyPolicy(doc.penaltyPolicy),
          attendanceRows.map(row => row.status),
          payroll?.basePay ?? doc.baseSalary
        );

        if (!payroll) {
          // Computed preview
          const basePay = doc.baseSalary;
          const workingDays = presentCount > 0 ? presentCount : 22; // default standard working days if no attendance marked
          const bonuses = perPatientBonus;
          const deductions = penalty.total;
          const netPay = basePay + bonuses - deductions;

          return {
            id: `temp-${doc.id}`,
            doctorId: doc.id,
            doctor: {
              id: doc.id,
              name: doc.name,
              specialization: doc.specialization,
              isActive: doc.isActive,
              baseSalary: doc.baseSalary,
              perPatientShare: doc.perPatientShare,
              payType: doc.payType,
            },
            year,
            month,
            basePay,
            workingDays,
            totalVisits: visitsCount,
            perPatientBonus,
            bonuses,
            deductions,
            penaltyBreakdown: penalty,
            netPay,
            status: "DRAFT",
            notes: `Computed live tariff: Base Rs. ${basePay} + (${visitsCount} visits × Rs. ${doc.perPatientShare})`,
            isSaved: false,
          };
        } else {
          const savedPenalty = payroll.penaltyBreakdown as unknown as PenaltyBreakdown | null;
          const previousAuto = Number(savedPenalty?.total || 0);
          const manualDeductions = Math.max(0, payroll.deductions - previousAuto);
          const effectivePenalty = payroll.status === "PAID" ? savedPenalty : penalty;
          const effectiveDeductions = payroll.status === "PAID" ? payroll.deductions : manualDeductions + penalty.total;
          const effectiveNet = payroll.status === "PAID" ? payroll.netPay : payroll.basePay + payroll.bonuses - effectiveDeductions;
          return {
            id: payroll.id,
            doctorId: doc.id,
            doctor: {
              id: doc.id,
              name: doc.name,
              specialization: doc.specialization,
              isActive: doc.isActive,
              baseSalary: doc.baseSalary,
              perPatientShare: doc.perPatientShare,
              payType: doc.payType,
            },
            year: payroll.year,
            month: payroll.month,
            basePay: payroll.basePay,
            workingDays: payroll.workingDays,
            totalVisits: payroll.status === "PAID" ? payroll.totalVisits : visitsCount,
            perPatientBonus,
            bonuses: payroll.bonuses,
            deductions: effectiveDeductions,
            penaltyBreakdown: effectivePenalty,
            netPay: effectiveNet,
            status: payroll.status,
            notes: payroll.notes,
            isSaved: true,
          };
        }
      })
    );

    return NextResponse.json({
      year,
      month,
      payrolls: payrollList,
    });
  } catch (error: any) {
    console.error("Failed to load doctor payroll:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to load payroll" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized. Admin privileges required." }, { status: 401 });
    }

    const body = await req.json();
    const parseResult = DoctorPayrollAdjustSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parseResult.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { doctorId, year, month, basePay, workingDays, bonuses, deductions, manualDeductions, status, notes } = parseResult.data;

    return await prisma.$transaction(async (tx) => {
      const doctor = await tx.doctor.findUnique({
        where: { id: doctorId },
      });
      if (!doctor) {
        return NextResponse.json({ error: "Doctor not found" }, { status: 404 });
      }

      const effectiveBase = basePay !== undefined ? basePay : doctor.baseSalary;
      const effectiveBonuses = bonuses !== undefined ? bonuses : 0;
      const existingPayroll = await tx.doctorPayroll.findUnique({
        where: { doctorId_year_month: { doctorId, year, month } },
      });
      if (existingPayroll?.status === "PAID") {
        return NextResponse.json({ error: "Paid payroll is finalized and cannot be changed." }, { status: 409 });
      }
      const monthPrefix = `${year}-${String(month).padStart(2, "0")}`;
      const attendanceRows = await tx.doctorAttendance.findMany({
        where: { doctorId, dateStr: { startsWith: monthPrefix } },
        select: { status: true },
      });
      const penalty = calculatePenalty(
        parsePenaltyPolicy(doctor.penaltyPolicy),
        attendanceRows.map(row => row.status),
        effectiveBase
      );
      const previousPenalty = existingPayroll?.penaltyBreakdown as unknown as PenaltyBreakdown | null;
      const previousAuto = previousPenalty?.total ?? 0;
      const legacyManualDeductions = deductions !== undefined
        ? Math.max(0, deductions - (existingPayroll ? previousAuto : penalty.total))
        : Math.max(0, (existingPayroll?.deductions ?? 0) - previousAuto);
      const effectiveDeductions = Math.round(((manualDeductions ?? legacyManualDeductions) + penalty.total) * 100) / 100;
      const netPay = effectiveBase + effectiveBonuses - effectiveDeductions;

      const totalVisits = await tx.visit.count({
        where: {
          doctorId,
          createdAt: { gte: new Date(year, month - 1, 1), lt: new Date(year, month, 1) },
        },
      });
      const payroll = await tx.doctorPayroll.upsert({
        where: {
          doctorId_year_month: {
            doctorId,
            year,
            month,
          },
        },
        update: {
          basePay: effectiveBase,
          workingDays: workingDays !== undefined ? workingDays : undefined,
          totalVisits,
          bonuses: effectiveBonuses,
          deductions: effectiveDeductions,
          penaltyBreakdown: penalty,
          netPay,
          status: status || undefined,
          notes: notes !== undefined ? notes : undefined,
        },
        create: {
          doctorId,
          year,
          month,
          basePay: effectiveBase,
          workingDays: workingDays !== undefined ? workingDays : 22,
          totalVisits,
          bonuses: effectiveBonuses,
          deductions: effectiveDeductions,
          penaltyBreakdown: penalty,
          netPay,
          status: status || "DRAFT",
          notes: notes || null,
        },
        include: {
          doctor: { select: { name: true } },
        },
      });

      await tx.auditLog.create({
        data: {
          userId: session.user.id,
          action: "DOCTOR_PAYROLL_UPDATED",
          details: `Updated payroll for ${payroll.doctor.name} (${month}/${year}): Net Pay = Rs. ${netPay} (${payroll.status})`,
        },
      });

      return NextResponse.json({
        success: true,
        payroll,
        message: `Payroll for ${payroll.doctor.name} saved successfully.`,
      });
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
  } catch (error: any) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && (error.code === "P2034" || error.code === "P2002")) {
      return NextResponse.json({ error: "Payroll changed in another request. Reload the record and try again." }, { status: 409 });
    }
    console.error("Failed to update payroll:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to save payroll" },
      { status: 500 }
    );
  }
}

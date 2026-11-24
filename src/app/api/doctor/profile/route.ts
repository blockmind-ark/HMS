import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user.role !== "DOCTOR" && session.user.role !== "ADMIN")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Resolve doctor record linked to this logged-in user
    let doctor = await prisma.doctor.findFirst({
      where: {
        OR: [
          { userId: session.user.id },
          { email: session.user.email },
        ],
      },
      include: {
        attendances: {
          orderBy: { dateStr: "desc" },
          take: 30,
        },
        leaves: {
          orderBy: { startDate: "desc" },
          take: 15,
        },
        payrolls: {
          orderBy: [{ year: "desc" }, { month: "desc" }],
          take: 12,
        },
      },
    });

    // If admin is inspecting without a linked doctor, fall back to first active doctor
    if (!doctor && session.user.role === "ADMIN") {
      doctor = await prisma.doctor.findFirst({
        where: { isActive: true },
        include: {
          attendances: { orderBy: { dateStr: "desc" }, take: 30 },
          leaves: { orderBy: { startDate: "desc" }, take: 15 },
          payrolls: { orderBy: [{ year: "desc" }, { month: "desc" }], take: 12 },
        },
      });
    }

    if (!doctor) {
      return NextResponse.json(
        { error: "No doctor profile associated with this account." },
        { status: 404 }
      );
    }

    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();

    // Patient visits assigned to this doctor
    const totalPatientVisits = await prisma.visit.count({
      where: { doctorId: doctor.id },
    });

    const thisMonthVisits = await prisma.visit.count({
      where: {
        doctorId: doctor.id,
        createdAt: {
          gte: new Date(currentYear, currentMonth - 1, 1),
          lt: new Date(currentYear, currentMonth, 1),
        },
      },
    });

    // Working days for this month
    const monthPrefix = `${currentYear}-${String(currentMonth).padStart(2, "0")}`;
    const workingDaysCount = await prisma.doctorAttendance.count({
      where: {
        doctorId: doctor.id,
        dateStr: { startsWith: monthPrefix },
        status: { in: ["PRESENT", "HALF_DAY"] },
      },
    });

    // Current payroll record
    const currentPayroll = doctor.payrolls.find(
      (p) => p.year === currentYear && p.month === currentMonth
    ) || null;

    return NextResponse.json({
      success: true,
      doctor: {
        id: doctor.id,
        name: doctor.name,
        specialization: doctor.specialization,
        phone: doctor.phone,
        email: doctor.email,
        baseSalary: doctor.baseSalary,
        perPatientShare: doctor.perPatientShare,
        payType: doctor.payType,
        workingDaysCount: workingDaysCount || 22,
        totalPatientVisits,
        thisMonthVisits,
        currentPayroll,
        recentAttendance: doctor.attendances,
        recentLeaves: doctor.leaves,
        payrollHistory: doctor.payrolls,
      },
    });
  } catch (error: any) {
    console.error("Failed to load doctor profile:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to load doctor profile" },
      { status: 500 }
    );
  }
}

import { Prisma } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { DoctorAttendanceInputSchema } from "@/lib/validation/doctor";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized. Admin privileges required." }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const dateStr = searchParams.get("dateStr") || new Date().toISOString().split("T")[0];
    const doctorId = searchParams.get("doctorId");

    const where: any = {};
    if (dateStr) where.dateStr = dateStr;
    if (doctorId) where.doctorId = doctorId;

    const attendances = await prisma.doctorAttendance.findMany({
      where,
      include: {
        doctor: {
          select: { id: true, name: true, specialization: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ attendances, dateStr });
  } catch (error: any) {
    console.error("Failed to fetch doctor attendance:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to load attendance" },
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
    const parseResult = DoctorAttendanceInputSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parseResult.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { doctorId, dateStr, status, checkInTime, checkOutTime, notes } = parseResult.data;

    return await prisma.$transaction(async (tx) => {
      // Keep historical attendance readable, but reject new entries for inactive doctors.
      const doctor = await tx.doctor.findUnique({
        where: { id: doctorId },
        select: { isActive: true },
      });
      if (!doctor) return NextResponse.json({ error: "Doctor not found" }, { status: 404 });
      if (!doctor.isActive) {
        return NextResponse.json({ error: "Attendance is disabled for inactive doctors." }, { status: 409 });
      }

      const year = Number(dateStr.slice(0,4));
      const month = Number(dateStr.slice(5,7));
      const finalized = await tx.doctorPayroll.findUnique({
        where: { doctorId_year_month: {doctorId,year,month} },
        select: {status:true},
      });
      if (finalized?.status === "PAID") {
        return NextResponse.json({error:"Payroll for this month is finalized; attendance cannot be changed."},{status:409});
      }

      // Check if attendance already exists for this doctor on this date
      // Under strict hospital audit policy, once attendance is saved, it cannot be changed or overwritten.
      const existing = await tx.doctorAttendance.findUnique({
        where: {
          doctorId_dateStr: {
            doctorId,
            dateStr,
          },
        },
        include: {
          doctor: { select: { name: true } },
        },
      });

      if (existing) {
        return NextResponse.json(
          {
            error: `Attendance for Dr. ${existing.doctor.name} on ${dateStr} has already been saved as "${existing.status}" and is permanently locked. Under hospital audit policy, saved doctor attendance cannot be modified or changed.`,
            attendance: existing,
            isLocked: true,
          },
          { status: 409 }
        );
      }

      const record = await tx.doctorAttendance.create({
        data: {
          doctorId,
          dateStr,
          status,
          isLocked: true,
          checkInTime: checkInTime || null,
          checkOutTime: checkOutTime || null,
          notes: notes || null,
        },
        include: {
          doctor: { select: { name: true } },
        },
      });

      await tx.auditLog.create({
        data: {
          userId: session.user.id,
          action: "DOCTOR_ATTENDANCE_LOCKED",
          details: `Recorded immutable attendance for ${record.doctor.name} on ${dateStr}: Status = ${status}`,
        },
      });

      return NextResponse.json({
        success: true,
        attendance: record,
        message: `Attendance saved and permanently locked for Dr. ${record.doctor.name} (${status}).`,
      });
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
  } catch (error: any) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && (error.code === "P2034" || error.code === "P2002")) {
      return NextResponse.json({ error: "Attendance or payroll changed in another request. Reload the record and try again." }, { status: 409 });
    }
    console.error("Failed to mark doctor attendance:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to record attendance" },
      { status: 500 }
    );
  }
}

export async function PATCH() {
  return NextResponse.json(
    { error: "Doctor attendance records are immutable and cannot be modified once saved." },
    { status: 403 }
  );
}

export async function PUT() {
  return NextResponse.json(
    { error: "Doctor attendance records are immutable and cannot be overwritten once saved." },
    { status: 403 }
  );
}

export async function DELETE() {
  return NextResponse.json(
    { error: "Doctor attendance records are immutable and cannot be deleted once saved." },
    { status: 403 }
  );
}

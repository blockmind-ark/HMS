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

    // Check if attendance already exists for this doctor on this date
    // Under strict hospital audit policy, once attendance is saved, it cannot be changed or overwritten.
    const existing = await prisma.doctorAttendance.findUnique({
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

    const record = await prisma.doctorAttendance.create({
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

    await prisma.auditLog.create({
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
  } catch (error: any) {
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

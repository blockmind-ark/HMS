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

    const record = await prisma.doctorAttendance.upsert({
      where: {
        doctorId_dateStr: {
          doctorId,
          dateStr,
        },
      },
      update: {
        status,
        checkInTime: checkInTime || null,
        checkOutTime: checkOutTime || null,
        notes: notes || null,
      },
      create: {
        doctorId,
        dateStr,
        status,
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
        action: "DOCTOR_ATTENDANCE_MARKED",
        details: `Marked attendance for ${record.doctor.name} on ${dateStr}: Status = ${status}`,
      },
    });

    return NextResponse.json({
      success: true,
      attendance: record,
      message: `Attendance marked for ${record.doctor.name} (${status}).`,
    });
  } catch (error: any) {
    console.error("Failed to mark doctor attendance:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to record attendance" },
      { status: 500 }
    );
  }
}

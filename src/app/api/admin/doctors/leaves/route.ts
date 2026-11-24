import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { DoctorLeaveInputSchema } from "@/lib/validation/doctor";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized. Admin privileges required." }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const doctorId = searchParams.get("doctorId");

    const where: any = {};
    if (doctorId) where.doctorId = doctorId;

    const leaves = await prisma.doctorLeave.findMany({
      where,
      include: {
        doctor: { select: { id: true, name: true, specialization: true } },
      },
      orderBy: { startDate: "desc" },
    });

    return NextResponse.json({ leaves });
  } catch (error: any) {
    console.error("Failed to fetch doctor leaves:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to load leave records" },
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
    const parseResult = DoctorLeaveInputSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parseResult.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { doctorId, startDate, endDate, reason, status, notes } = parseResult.data;

    const leave = await prisma.doctorLeave.create({
      data: {
        doctorId,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        reason,
        status,
        notes: notes || null,
      },
      include: {
        doctor: { select: { name: true } },
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: "DOCTOR_LEAVE_RECORDED",
        details: `Recorded leave for ${leave.doctor.name} from ${startDate} to ${endDate} (${status})`,
      },
    });

    return NextResponse.json({
      success: true,
      leave,
      message: `Leave recorded for ${leave.doctor.name}.`,
    });
  } catch (error: any) {
    console.error("Failed to record doctor leave:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to record leave" },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized. Admin privileges required." }, { status: 401 });
    }

    const body = await req.json();
    const { id, status, notes } = body;

    if (!id || !["PENDING", "APPROVED", "REJECTED"].includes(status)) {
      return NextResponse.json({ error: "Invalid leave ID or status" }, { status: 400 });
    }

    const updated = await prisma.doctorLeave.update({
      where: { id },
      data: {
        status,
        notes: notes !== undefined ? notes : undefined,
      },
      include: {
        doctor: { select: { name: true } },
      },
    });

    return NextResponse.json({
      success: true,
      leave: updated,
      message: `Leave status updated to ${status}.`,
    });
  } catch (error: any) {
    console.error("Failed to update leave status:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to update leave" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized. Admin privileges required." }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "Leave ID is required" }, { status: 400 });
    }

    await prisma.doctorLeave.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: "Leave record deleted successfully.",
    });
  } catch (error: any) {
    console.error("Failed to delete leave:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to delete leave" },
      { status: 500 }
    );
  }
}

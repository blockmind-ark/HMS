import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { DoctorUpdateSchema } from "@/lib/validation/doctor";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized. Admin privileges required." }, { status: 401 });
    }

    const doctor = await prisma.doctor.findUnique({
      where: { id: params.id },
      include: {
        user: { select: { id: true, name: true, email: true } },
        attendances: { orderBy: { dateStr: "desc" }, take: 30 },
        leaves: { orderBy: { startDate: "desc" }, take: 10 },
        payrolls: { orderBy: [{ year: "desc" }, { month: "desc" }], take: 12 },
      },
    });

    if (!doctor) {
      return NextResponse.json({ error: "Doctor not found" }, { status: 404 });
    }

    return NextResponse.json({ doctor });
  } catch (error: any) {
    console.error("Failed to load doctor profile:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to load doctor" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized. Admin privileges required." }, { status: 401 });
    }

    const doctorId = params.id;
    const body = await req.json();

    const parseResult = DoctorUpdateSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parseResult.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const existing = await prisma.doctor.findUnique({
      where: { id: doctorId },
    });
    if (!existing) {
      return NextResponse.json({ error: "Doctor not found" }, { status: 404 });
    }

    const d = parseResult.data;

    const updated = await prisma.doctor.update({
      where: { id: doctorId },
      data: {
        name: d.name ?? undefined,
        specialization: d.specialization ?? undefined,
        phone: d.phone !== undefined ? (d.phone || null) : undefined,
        email: d.email !== undefined ? (d.email || null) : undefined,
        baseSalary: d.baseSalary !== undefined ? d.baseSalary : undefined,
        payType: d.payType ?? undefined,
        perPatientShare: d.perPatientShare !== undefined ? d.perPatientShare : undefined,
        userId: d.userId !== undefined ? (d.userId || null) : undefined,
        isActive: d.isActive !== undefined ? d.isActive : undefined,
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: "DOCTOR_UPDATED",
        details: `Updated doctor profile "${updated.name}" (ID: ${doctorId})`,
      },
    });

    return NextResponse.json({
      success: true,
      doctor: updated,
      message: `Doctor "${updated.name}" updated successfully.`,
    });
  } catch (error: any) {
    console.error("Failed to update doctor:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to update doctor" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized. Admin privileges required." }, { status: 401 });
    }

    const doctorId = params.id;
    const existing = await prisma.doctor.findUnique({
      where: { id: doctorId },
    });
    if (!existing) {
      return NextResponse.json({ error: "Doctor not found" }, { status: 404 });
    }

    await prisma.doctor.delete({
      where: { id: doctorId },
    });

    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: "DOCTOR_DELETED",
        details: `Deleted doctor "${existing.name}" (ID: ${doctorId})`,
      },
    });

    return NextResponse.json({
      success: true,
      message: `Doctor "${existing.name}" removed successfully.`,
    });
  } catch (error: any) {
    console.error("Failed to delete doctor:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to delete doctor" },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { UltrasoundServiceUpdateSchema } from "@/lib/validation/services";

export const dynamic = "force-dynamic";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized. Admin privileges required." }, { status: 401 });
    }

    const serviceId = params.id;
    const body = await req.json();

    const parseResult = UltrasoundServiceUpdateSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parseResult.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const existing = await prisma.ultrasoundService.findUnique({
      where: { id: serviceId },
    });
    if (!existing) {
      return NextResponse.json({ error: "Ultrasound service not found." }, { status: 404 });
    }

    const { name, price, isActive } = parseResult.data;

    // Check duplicate name if name is changing
    if (name && name !== existing.name) {
      const duplicate = await prisma.ultrasoundService.findUnique({
        where: { name },
      });
      if (duplicate && duplicate.id !== serviceId) {
        return NextResponse.json(
          { error: `Another ultrasound service named "${name}" already exists.` },
          { status: 409 }
        );
      }
    }

    const updated = await prisma.ultrasoundService.update({
      where: { id: serviceId },
      data: {
        name: name ?? undefined,
        price: price !== undefined ? price : undefined,
        isActive: isActive !== undefined ? isActive : undefined,
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: "ULTRASOUND_SERVICE_UPDATED",
        details: `Updated ultrasound service "${existing.name}" (ID: ${serviceId}). Name: ${updated.name}, Price: Rs. ${updated.price}, Active: ${updated.isActive}`,
      },
    });

    return NextResponse.json({
      success: true,
      service: updated,
      message: `Ultrasound service "${updated.name}" updated successfully.`,
    });
  } catch (error: any) {
    console.error("Failed to update ultrasound service:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to update ultrasound service" },
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

    const serviceId = params.id;
    const existing = await prisma.ultrasoundService.findUnique({
      where: { id: serviceId },
    });
    if (!existing) {
      return NextResponse.json({ error: "Ultrasound service not found." }, { status: 404 });
    }

    await prisma.ultrasoundService.delete({
      where: { id: serviceId },
    });

    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: "ULTRASOUND_SERVICE_DELETED",
        details: `Deleted ultrasound service "${existing.name}" (ID: ${serviceId}, Price: Rs. ${existing.price})`,
      },
    });

    return NextResponse.json({
      success: true,
      message: `Ultrasound service "${existing.name}" successfully removed.`,
    });
  } catch (error: any) {
    console.error("Failed to delete ultrasound service:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to delete ultrasound service" },
      { status: 500 }
    );
  }
}

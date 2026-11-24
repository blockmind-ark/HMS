import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { TokenServiceUpdateSchema } from "@/lib/validation/services";

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

    const parseResult = TokenServiceUpdateSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parseResult.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const existing = await prisma.tokenService.findUnique({
      where: { id: serviceId },
    });
    if (!existing) {
      return NextResponse.json({ error: "Token service not found." }, { status: 404 });
    }

    const { name, fee, isActive } = parseResult.data;

    if (name && name !== existing.name) {
      const duplicate = await prisma.tokenService.findUnique({
        where: { name },
      });
      if (duplicate && duplicate.id !== serviceId) {
        return NextResponse.json(
          { error: `Another token service named "${name}" already exists.` },
          { status: 409 }
        );
      }
    }

    const updated = await prisma.tokenService.update({
      where: { id: serviceId },
      data: {
        name: name ?? undefined,
        fee: fee !== undefined ? fee : undefined,
        isActive: isActive !== undefined ? isActive : undefined,
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: "TOKEN_SERVICE_UPDATED",
        details: `Updated token service "${existing.name}" (ID: ${serviceId}). Name: ${updated.name}, Fee: Rs. ${updated.fee}, Active: ${updated.isActive}`,
      },
    });

    return NextResponse.json({
      success: true,
      service: updated,
      message: `Token service "${updated.name}" updated successfully.`,
    });
  } catch (error: any) {
    console.error("Failed to update token service:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to update token service" },
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
    const existing = await prisma.tokenService.findUnique({
      where: { id: serviceId },
    });
    if (!existing) {
      return NextResponse.json({ error: "Token service not found." }, { status: 404 });
    }

    await prisma.tokenService.delete({
      where: { id: serviceId },
    });

    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: "TOKEN_SERVICE_DELETED",
        details: `Deleted token service "${existing.name}" (ID: ${serviceId}, Fee: Rs. ${existing.fee})`,
      },
    });

    return NextResponse.json({
      success: true,
      message: `Token service "${existing.name}" successfully removed.`,
    });
  } catch (error: any) {
    console.error("Failed to delete token service:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to delete token service" },
      { status: 500 }
    );
  }
}

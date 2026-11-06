import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import * as bcrypt from "bcryptjs";
import { recordAuditLog } from "@/lib/audit";
import { encryptBiometricTemplate } from "@/lib/biometrics/encryption";
import { FingerPosition } from "@/lib/biometrics/types";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized. Admin role required." }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const query = searchParams.get("query")?.trim() || "";
  const roleFilter = searchParams.get("role") || "";

  try {
    const users = await prisma.user.findMany({
      where: {
        AND: [
          query
            ? {
                OR: [
                  { name: { contains: query, mode: "insensitive" } },
                  { email: { contains: query, mode: "insensitive" } },
                ],
              }
            : {},
          roleFilter && roleFilter !== "ALL" ? { role: roleFilter as any } : {},
        ],
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        displayPassword: true,
        biometricHash: true,
        createdAt: true,
        updatedAt: true,
        biometricEnrollments: {
          select: {
            id: true,
            fingerPosition: true,
            qualityScore: true,
            scannerModel: true,
            adapterType: true,
            createdAt: true,
            updatedAt: true,
            // encryptedTemplate is strictly omitted from API output
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ users });
  } catch (error: any) {
    console.error("Failed to fetch users:", error);
    return NextResponse.json({ error: "Failed to fetch user list" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized. Admin role required." }, { status: 403 });
  }

  try {
    const body = await req.json();
    const {
      name,
      email,
      password,
      role,
      biometricHash,
      biometricTemplate,
      fingerPosition = "RIGHT_THUMB",
    } = body;

    if (!name || !email || !password || !role) {
      return NextResponse.json({ error: "Name, email, password, and role are required." }, { status: 400 });
    }

    const trimmedEmail = email.trim().toLowerCase();

    // Check if user already exists with this email
    const existing = await prisma.user.findUnique({
      where: { email: trimmedEmail },
    });

    if (existing) {
      return NextResponse.json({ error: "A user with this email address already exists." }, { status: 409 });
    }

    // 1:1 Invariant Check: Verify thumb expression is not already registered to another user
    if (biometricHash) {
      const cleanHash = biometricHash.trim();
      const duplicateUserWithThumb = await prisma.user.findFirst({
        where: { biometricHash: cleanHash },
        select: { id: true, name: true, email: true, role: true },
      });

      if (duplicateUserWithThumb) {
        return NextResponse.json(
          {
            error: `This thumb impression is already registered to user "${duplicateUserWithThumb.name}" (${duplicateUserWithThumb.email}). Each user must have their own unique thumb impression.`,
            errorCode: "DUPLICATE_THUMB_IMPRESSION",
            existingUser: duplicateUserWithThumb,
          },
          { status: 409 }
        );
      }
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        name: name.trim(),
        email: trimmedEmail,
        password: hashedPassword,
        displayPassword: password.trim(),
        role: role as any,
        biometricHash: biometricHash ? biometricHash.trim() : null,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        displayPassword: true,
        biometricHash: true,
        createdAt: true,
      },
    });

    // If biometric template minutiae is provided, encrypt and store in UserBiometricEnrollment
    if (biometricTemplate) {
      try {
        const encryptedTemplate = encryptBiometricTemplate(biometricTemplate);
        await prisma.userBiometricEnrollment.create({
          data: {
            userId: user.id,
            fingerPosition: (fingerPosition as FingerPosition) || "RIGHT_THUMB",
            encryptedTemplate,
            qualityScore: body.qualityScore || 95,
            scannerModel: body.scannerModel || "NITGEN HFDU06M / Elan MOC Sensor",
            adapterType: "VENDOR_LOCAL_AGENT",
            enrolledById: session.user.id,
          },
        });
      } catch (encErr) {
        console.error("Failed to persist user biometric enrollment template:", encErr);
      }
    }

    await recordAuditLog({
      userId: session.user.id,
      action: "USER_CREATED",
      details: `Admin ${session.user.name} created user account for ${user.name} (${user.email}) with role ${user.role}${user.biometricHash ? " with enrolled thumb impression." : "."}`,
    });

    return NextResponse.json({ user }, { status: 201 });
  } catch (error: any) {
    console.error("Failed to create user:", error);
    return NextResponse.json({ error: error?.message || "Failed to create user account" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized. Admin role required." }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { id, newPassword, name, role } = body;

    if (!id) {
      return NextResponse.json({ error: "User ID is required." }, { status: 400 });
    }

    const existingUser = await prisma.user.findUnique({
      where: { id },
    });

    if (!existingUser) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }

    const updateData: any = {};

    if (name && name.trim()) {
      updateData.name = name.trim();
    }

    if (role) {
      // Prevent demoting the root administrator if this is admin@hms.com
      if (existingUser.email === "admin@hms.com" && role !== "ADMIN") {
        return NextResponse.json(
          { error: "Cannot change the role of the primary Administrator account." },
          { status: 400 }
        );
      }
      updateData.role = role;
    }

    if (newPassword && newPassword.trim()) {
      if (newPassword.trim().length < 6) {
        return NextResponse.json(
          { error: "Password must be at least 6 characters long." },
          { status: 400 }
        );
      }
      const hashedPassword = await bcrypt.hash(newPassword.trim(), 10);
      updateData.password = hashedPassword;
      updateData.displayPassword = newPassword.trim();
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        displayPassword: true,
        biometricHash: true,
        updatedAt: true,
      },
    });

    const changeDetails: string[] = [];
    if (newPassword) changeDetails.push("Password updated");
    if (name) changeDetails.push(`Name changed to ${name}`);
    if (role) changeDetails.push(`Role changed to ${role}`);

    await recordAuditLog({
      userId: session.user.id,
      action: "USER_MODIFIED",
      details: `Admin ${session.user.name} modified user account for ${updatedUser.name} (${updatedUser.email}): ${changeDetails.join(", ")}.`,
    });

    return NextResponse.json({
      success: true,
      message: `User account for ${updatedUser.name} updated successfully.`,
      user: updatedUser,
    });
  } catch (error: any) {
    console.error("Failed to update user:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to update user account" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized. Admin role required." }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(req.url);
    let id = searchParams.get("id");

    if (!id) {
      try {
        const body = await req.json();
        id = body.id;
      } catch {
        // body not json or empty
      }
    }

    if (!id) {
      return NextResponse.json({ error: "User ID is required for deletion." }, { status: 400 });
    }

    const targetUser = await prisma.user.findUnique({
      where: { id },
    });

    if (!targetUser) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }

    // STRICT INVARIANT: Admin accounts can NEVER be deleted
    if (targetUser.role === "ADMIN" || targetUser.email.toLowerCase().includes("admin")) {
      return NextResponse.json(
        {
          error: "Administrator accounts are strictly protected and cannot be deleted. You can only delete staff accounts (Receptionist, Pharmacist, Doctor).",
          errorCode: "ADMIN_DELETION_FORBIDDEN",
        },
        { status: 403 }
      );
    }

    // Prevent deleting oneself
    if (targetUser.id === session.user.id) {
      return NextResponse.json(
        { error: "You cannot delete your own active administrator account." },
        { status: 400 }
      );
    }

    // Reassign any historical references to current administrator before deletion to preserve referential integrity
    await prisma.$transaction([
      prisma.auditLog.updateMany({ where: { userId: id }, data: { userId: session.user.id } }),
      prisma.invoice.updateMany({ where: { userId: id }, data: { userId: session.user.id } }),
      prisma.pharmacySale.updateMany({ where: { userId: id }, data: { userId: session.user.id } }),
      prisma.approvalRequest.updateMany({ where: { requestedById: id }, data: { requestedById: session.user.id } }),
      prisma.dailyTokenLog.updateMany({ where: { issuedById: id }, data: { issuedById: session.user.id } }),
      prisma.expenditure.updateMany({ where: { userId: id }, data: { userId: session.user.id } }),
      prisma.vendorPayment.updateMany({ where: { paidById: id }, data: { paidById: session.user.id } }),
      prisma.shiftClosing.updateMany({ where: { userId: id }, data: { userId: session.user.id } }),
      prisma.drawerAdjustment.updateMany({ where: { userId: id }, data: { userId: session.user.id } }),
      prisma.userBiometricEnrollment.deleteMany({ where: { userId: id } }),
      prisma.user.delete({ where: { id } }),
    ]);

    await recordAuditLog({
      userId: session.user.id,
      action: "USER_DELETED",
      details: `Admin ${session.user.name} deleted staff user account ${targetUser.name} (${targetUser.email}, Role: ${targetUser.role}).`,
    });

    return NextResponse.json({
      success: true,
      message: `Staff user "${targetUser.name}" (${targetUser.email}) was permanently deleted.`,
    });
  } catch (error: any) {
    console.error("Failed to delete user:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to delete user account" },
      { status: 500 }
    );
  }
}

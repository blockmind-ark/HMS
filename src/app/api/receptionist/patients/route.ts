import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { recordAuditLog } from "@/lib/audit";
import { encryptBiometricTemplate } from "@/lib/biometrics/encryption";
import { validateAllPatientFields } from "@/lib/validation/patient";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const query = searchParams.get("query")?.trim() || "";

  const patients = await prisma.patient.findMany({
    where: query
      ? {
          OR: [
            { name: { contains: query, mode: "insensitive" } },
            { phone: { contains: query, mode: "insensitive" } },
            { patientUid: { contains: query, mode: "insensitive" } },
            { cnic: { contains: query, mode: "insensitive" } },
          ],
        }
      : undefined,
    orderBy: { createdAt: "desc" },
    include: {
      visits: {
        orderBy: { createdAt: "desc" },
        take: 5,
      },
      invoices: {
        orderBy: { createdAt: "desc" },
        take: 5,
        include: { items: true },
      },
      pharmacySales: {
        orderBy: { createdAt: "desc" },
        take: 5,
        include: { items: { include: { medicine: true } } },
      },
    },
    take: 50,
  });

  return NextResponse.json({ patients });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user.role !== "RECEPTIONIST" && session.user.role !== "ADMIN")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { name, phone, age, gender, cnic, biometricHash, biometricCredentialId } = body;

    // Strict validation for Pakistani Hospital Standards
    const validationErrors = validateAllPatientFields({ name, phone, age, gender, cnic });
    if (Object.keys(validationErrors).length > 0) {
      const firstError =
        validationErrors.name ||
        validationErrors.phone ||
        validationErrors.age ||
        validationErrors.gender ||
        validationErrors.cnic ||
        "Invalid patient registration inputs";
      return NextResponse.json(
        { error: firstError, validationErrors },
        { status: 400 }
      );
    }

    // Generate unique sequential Patient UID with formula: MR-date-5 digits (e.g. MR-YYYYMMDD-00001)
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    const dateStr = `${year}${month}${day}`;

    const totalPatients = await prisma.patient.count();
    let nextNum = totalPatients + 1;
    let patientUid = `MR-${dateStr}-${String(nextNum).padStart(5, "0")}`;

    // Ensure collision-safety
    let exists = await prisma.patient.findUnique({ where: { patientUid } });
    while (exists) {
      nextNum++;
      patientUid = `MR-${dateStr}-${String(nextNum).padStart(5, "0")}`;
      exists = await prisma.patient.findUnique({ where: { patientUid } });
    }

    const patient = await prisma.patient.create({
      data: {
        patientUid,
        name: name.trim(),
        phone: phone.trim(),
        age: parseInt(age, 10),
        gender,
        cnic: cnic ? cnic.trim() : null,
        biometricHash: biometricHash || null,
      },
    });

    if (biometricHash) {
      const template = JSON.stringify({
        format: "ISO_19794_2_SIMULATED",
        fingerPosition: "RIGHT_THUMB",
        quality: 94,
        minutiae: [
          { x: 140, y: 160, theta: 45, type: "ENDING" },
          { x: 210, y: 280, theta: 110, type: "BIFURCATION" },
          { x: 320, y: 210, theta: 260, type: "ENDING" },
          { x: 390, y: 350, theta: 170, type: "BIFURCATION" },
        ],
      });
      const encryptedTemplate = encryptBiometricTemplate(template);

      await prisma.patientBiometricEnrollment.create({
        data: {
          patientId: patient.id,
          fingerPosition: "RIGHT_THUMB",
          encryptedTemplate,
          qualityScore: 94,
          scannerModel: "Optical USB Fingerprint Scanner",
          adapterType: "MOCK",
          enrolledById: session.user.id,
        },
      });
    }

    if (biometricCredentialId) {
      await prisma.biometricCredential.updateMany({
        where: { credentialId: biometricCredentialId },
        data: { patientId: patient.id },
      });
    }

    await recordAuditLog({
      userId: session.user.id,
      action: "PATIENT_ENROLLED",
      details: `Enrolled new patient ${patient.name} (UID: ${patient.patientUid}) with ${
        biometricHash ? "biometric fingerprint template" : "standard demographic profile"
      }.`,
    });

    return NextResponse.json({ patient });
  } catch (error: any) {
    console.error("Patient creation failed:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to register patient" },
      { status: 500 }
    );
  }
}


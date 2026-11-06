import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user.role !== "DOCTOR" && session.user.role !== "ADMIN")) {
    return NextResponse.json({ error: "Unauthorized access to Doctor Portal" }, { status: 401 });
  }

  const { id } = params;

  try {
    const patient = await prisma.patient.findFirst({
      where: {
        OR: [{ id }, { patientUid: id }],
      },
      include: {
        visits: {
          orderBy: { createdAt: "desc" },
          include: {
            invoice: {
              include: {
                user: { select: { name: true, role: true } },
                items: true,
              },
            },
          },
        },
        pharmacySales: {
          orderBy: { createdAt: "desc" },
          include: {
            user: { select: { name: true, role: true } },
            items: {
              include: {
                medicine: {
                  select: { name: true, genericName: true, category: true },
                },
              },
            },
          },
        },
        invoices: {
          orderBy: { createdAt: "desc" },
          include: {
            user: { select: { name: true, role: true } },
            items: true,
          },
        },
      },
    });

    if (!patient) {
      return NextResponse.json({ error: "Patient not found" }, { status: 404 });
    }

    // Compute Clinical Summary
    let totalConsultationFees = 0;
    for (const v of patient.visits) {
      totalConsultationFees += v.fee;
    }

    let totalPharmacyExpenditure = 0;
    let totalMedicinesDispensed = 0;
    for (const s of patient.pharmacySales) {
      totalPharmacyExpenditure += s.totalAmount;
      for (const item of s.items) {
        totalMedicinesDispensed += item.quantity;
      }
    }

    const clinicalDossier = {
      patient: {
        id: patient.id,
        patientUid: patient.patientUid,
        name: patient.name,
        phone: patient.phone,
        age: patient.age,
        gender: patient.gender,
        biometricHash: patient.biometricHash,
        createdAt: patient.createdAt,
      },
      summary: {
        totalVisits: patient.visits.length,
        totalPharmacySales: patient.pharmacySales.length,
        totalMedicinesDispensed,
        totalConsultationFees,
        totalPharmacyExpenditure,
        totalCombinedSpend: totalConsultationFees + totalPharmacyExpenditure,
        firstVisitDate: patient.visits[patient.visits.length - 1]?.createdAt || patient.createdAt,
        latestVisitDate: patient.visits[0]?.createdAt || null,
      },
      visits: patient.visits.map((v) => ({
        id: v.id,
        serviceType: v.serviceType,
        fee: v.fee,
        diagnosis: v.diagnosis,
        notes: v.notes,
        createdAt: v.createdAt,
        invoice: v.invoice
          ? {
              invoiceNumber: v.invoice.invoiceNumber,
              totalAmount: v.invoice.totalAmount,
              discount: v.invoice.discount,
              status: v.invoice.status,
              operatorName: v.invoice.user.name,
              items: v.invoice.items,
            }
          : null,
      })),
      prescriptions: patient.pharmacySales.map((s) => ({
        id: s.id,
        saleNumber: s.saleNumber,
        createdAt: s.createdAt,
        pharmacistName: s.user.name,
        totalAmount: s.totalAmount,
        discount: s.discount,
        items: s.items.map((i) => ({
          medicineName: i.medicine.name,
          genericName: i.medicine.genericName,
          category: i.medicine.category,
          quantity: i.quantity,
          unitPrice: i.unitPrice,
          totalPrice: i.totalPrice,
        })),
      })),
      invoices: patient.invoices.map((inv) => ({
        id: inv.id,
        invoiceNumber: inv.invoiceNumber,
        createdAt: inv.createdAt,
        operatorName: inv.user.name,
        totalAmount: inv.totalAmount,
        discount: inv.discount,
        status: inv.status,
        items: inv.items,
      })),
    };

    return NextResponse.json({
      success: true,
      dossier: clinicalDossier,
    });
  } catch (error: any) {
    console.error("Failed to load patient dossier:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// Doctor updates / adds diagnosis and clinical notes to a visit
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user.role !== "DOCTOR" && session.user.role !== "ADMIN")) {
    return NextResponse.json({ error: "Unauthorized access to Doctor Portal" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { visitId, diagnosis, notes } = body;

    if (!visitId) {
      return NextResponse.json({ error: "visitId is required" }, { status: 400 });
    }

    const updatedVisit = await prisma.visit.update({
      where: { id: visitId },
      data: {
        diagnosis: diagnosis || null,
        notes: notes || null,
      },
    });

    // Record audit log for doctor update
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: "CLINICAL_NOTE_RECORDED",
        details: `Dr. ${session.user.name} recorded clinical findings and diagnosis for visit #${visitId.slice(-6)} (Diagnosis: ${diagnosis || "None specified"}).`,
      },
    });

    return NextResponse.json({
      success: true,
      visit: updatedVisit,
    });
  } catch (error: any) {
    console.error("Failed to save clinical note:", error);
    return NextResponse.json({ error: "Failed to save clinical findings" }, { status: 500 });
  }
}


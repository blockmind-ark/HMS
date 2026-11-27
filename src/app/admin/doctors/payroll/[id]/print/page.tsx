import { getServerSession } from "next-auth";
import { notFound, redirect } from "next/navigation";
import { DoctorPayrollDeductionDetails, formatPayrollAmount } from "@/components/admin/DoctorPayrollDeductionDetails";
import { authOptions } from "@/lib/auth";
import type { PenaltyBreakdown } from "@/lib/doctor-penalties";
import { prisma } from "@/lib/prisma";
import { PrintPayslipButton } from "./print-button";

export const metadata = { title: "Doctor Payslip | Ruqayya Medical Center" };

export default async function DoctorPayslipPage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (session?.user.role !== "ADMIN") redirect("/login");

  const payroll = await prisma.doctorPayroll.findUnique({
    where: { id: params.id },
    include: { doctor: { select: { name: true, specialization: true } } },
  });
  if (!payroll || payroll.status !== "PAID") notFound();

  const breakdown = payroll.penaltyBreakdown as unknown as PenaltyBreakdown | null;
  const period = new Intl.DateTimeFormat("en-PK", { month: "long", year: "numeric", timeZone: "UTC" })
    .format(new Date(Date.UTC(payroll.year, payroll.month - 1)));
  const finalizedOn = payroll.updatedAt.toLocaleDateString("en-PK", {
    day: "numeric", month: "long", year: "numeric", timeZone: "Asia/Karachi",
  });
  const amounts = [
    ["Base pay", payroll.basePay],
    ["Bonuses and incentives", payroll.bonuses],
    ...(breakdown ? [
      ["Attendance deductions", breakdown.total] as const,
      ["Manual deductions", Math.max(0, payroll.deductions - breakdown.total)] as const,
    ] : []),
    ["Total deductions", payroll.deductions],
    ["Net pay", payroll.netPay],
  ] as const;

  return (
    <main className="mx-auto max-w-3xl space-y-5 bg-white px-5 py-8 text-sm text-slate-900 sm:px-8 print:max-w-none print:p-0">
      <style>{ "@page { size: A4; margin: 14mm; }" }</style>
      <header className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-300 pb-4">
        <div>
          <p className="font-semibold">Ruqayya Medical Center</p>
          <h1 className="text-2xl font-bold">Doctor Payslip</h1>
          <p>{period} · Paid</p>
        </div>
        <PrintPayslipButton />
      </header>
      <dl className="grid grid-cols-2 gap-3">
        <div><dt className="font-semibold">Doctor</dt><dd>{payroll.doctor.name}</dd></div>
        <div><dt className="font-semibold">Specialization</dt><dd>{payroll.doctor.specialization}</dd></div>
        <div><dt className="font-semibold">Working Days</dt><dd>{payroll.workingDays}</dd></div>
        <div><dt className="font-semibold">Consultations</dt><dd>{payroll.totalVisits}</dd></div>
        <div><dt className="font-semibold">Finalized On</dt><dd>{finalizedOn}</dd></div>
        <div><dt className="font-semibold">Payroll Reference</dt><dd className="break-all">{payroll.id}</dd></div>
      </dl>
      <dl className="divide-y divide-slate-200 rounded-xl border border-slate-200 px-3 break-inside-avoid">
        {amounts.map(([label, amount]) => (
          <div key={label} className="flex justify-between gap-4 py-2 last:font-bold">
            <dt>{label}</dt><dd>{formatPayrollAmount(amount)}</dd>
          </div>
        ))}
      </dl>
      <DoctorPayrollDeductionDetails breakdown={breakdown} />
      {payroll.notes && (
        <section className="break-inside-avoid">
          <h2 className="font-semibold">Notes</h2>
          <p className="whitespace-pre-wrap break-words">{payroll.notes}</p>
        </section>
      )}
    </main>
  );
}

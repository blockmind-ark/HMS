import type { PenaltyBreakdown } from "@/lib/doctor-penalties";

const currency = new Intl.NumberFormat("en-PK", { style: "currency", currency: "PKR" });

export function formatPayrollAmount(amount: number) {
  return currency.format(amount);
}

const attendanceLabels = {
  OFF: "Off",
  HALF_DAY: "Half day",
  LEAVE: "Leave",
  ABSENT: "Absent",
} satisfies Record<PenaltyBreakdown["details"][number]["status"], string>;

export function DoctorPayrollDeductionDetails({
  breakdown,
  total,
}: {
  breakdown?: PenaltyBreakdown | null;
  total?: number;
}) {
  return (
    <section className="rounded-xl border border-slate-200 p-3">
      <div className="flex flex-wrap justify-between gap-2 font-bold text-slate-900">
        <h2>Attendance Deductions</h2>
        {breakdown && <span>{formatPayrollAmount(total ?? breakdown.total)}</span>}
      </div>
      {!breakdown ? (
        <p className="mt-2 text-slate-600">Attendance rule breakdown unavailable for this record.</p>
      ) : (
        <>
          {breakdown.enabled === false && (
            <p className="mt-2 text-slate-600">Automatic attendance deductions are disabled for this payroll.</p>
          )}
          <dl className="mt-2 divide-y divide-slate-200">
            {breakdown.details.map((rule) => (
              <div key={rule.status} className="grid grid-cols-[1fr_auto] items-start gap-x-3 py-2 break-inside-avoid">
                <dt className="font-semibold">{attendanceLabels[rule.status]}</dt>
                <dd className="col-start-2 row-start-1 font-semibold">{formatPayrollAmount(rule.deduction)}</dd>
                <dd className="col-span-2 text-slate-600">
                  {rule.count} recorded · {rule.allowance} allowed · {rule.excess} above allowance
                  {" · "}
                  {rule.mode === "PERCENT" ? rule.amount + "% of base pay" : formatPayrollAmount(rule.amount)} per day above allowance
                </dd>
              </div>
            ))}
          </dl>
        </>
      )}
    </section>
  );
}

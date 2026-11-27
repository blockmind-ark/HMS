"use client";

export function PrintPayslipButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="rounded-lg border border-slate-300 px-3 py-2 font-semibold print:hidden"
    >
      Print or Save PDF
    </button>
  );
}

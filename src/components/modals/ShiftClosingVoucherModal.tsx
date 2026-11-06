"use client";

import React from "react";
import { Printer, X, ShieldCheck, AlertCircle, Building2 } from "lucide-react";
import { printReceiptElement } from "../receipts/ThermalReceiptModal";

export interface ShiftClosingData {
  id: string;
  shiftDate: string | Date;
  receptionistName: string;
  receptionistEmail?: string;
  totalSystemCash: number;
  countedCash: number;
  variance: number;
  notes?: string | null;
  status: string;
  closedAt: string | Date;
  portal?: "RECEPTION" | "PHARMACY";
  staffRole?: string;
  summary?: {
    invoiceCount?: number;
    totalGross?: number;
    totalDiscount?: number;
    openingFloat?: number;
    totalRevenue?: number;
  };
  serviceBreakdown?: Array<{
    service: string;
    count: number;
    total: number;
  }>;
  cashInList?: Array<{
    id: string;
    type: string;
    amount: number;
    reason: string;
    createdAt: string;
    userName: string;
  }>;
  cashOutList?: Array<{
    id: string;
    type: string;
    category?: string;
    amount: number;
    reason: string;
    createdAt: string;
    userName: string;
  }>;
  totalCashIn?: number;
  totalCashOut?: number;
}

export function ShiftClosingVoucherModal({
  closing,
  isOpen,
  onClose,
}: {
  closing: ShiftClosingData | null;
  isOpen: boolean;
  onClose: () => void;
}) {
  if (!isOpen || !closing) return null;

  const handlePrint = () => {
    printReceiptElement("shift-closing-voucher-receipt");
  };

  const formattedDate = new Date(closing.shiftDate).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  const formattedClosedAt = new Date(closing.closedAt).toLocaleString("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  });

  const isBalanced = closing.variance === 0;
  const isShort = closing.variance < 0;
  const isOver = closing.variance > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm print:p-0 print:bg-white print:fixed-none">
      <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden border border-slate-200 print:shadow-none print:border-none print:max-w-none print:w-full">
        {/* Modal Controls - Hidden during Print */}
        <div className="p-3 bg-slate-900 text-white flex items-center justify-between print:hidden">
          <div className="flex items-center gap-2">
            <Printer className="w-4 h-4 text-purple-400" />
            <span className="font-bold text-xs">Counter Daily Close Voucher</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors shadow-sm"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Voucher</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Printable Thermal Receipt Content */}
        <div
          id="shift-closing-voucher-receipt"
          className="p-5 text-black font-mono text-[12px] leading-normal space-y-3.5 bg-white w-full max-w-[80mm] mx-auto select-none"
        >
          {/* Header */}
          <div className="text-center pb-2.5 border-b border-dashed border-black">
            <h2 className="text-[15px] font-black tracking-wider uppercase">
              RUQAYYA HOSPITAL &amp; PHARMACY
            </h2>
            <p className="text-[10px] uppercase tracking-tight text-black mt-1">
              {closing.portal === "PHARMACY"
                ? "Pharmacy POS Cash Drawer Voucher"
                : "Counter Sales & Cash Accountability Voucher"}
            </p>
            <div className="mt-2 inline-block px-2.5 py-1 border border-black text-[10px] font-bold uppercase tracking-wider">
              SHIFT AUDIT: {closing.status}
            </div>
          </div>

          {/* Metadata Grid */}
          <div className="space-y-1 pb-2.5 border-b border-dashed border-black text-[11px]">
            <div className="flex justify-between">
              <span className="uppercase font-bold">
                {closing.portal === "PHARMACY" ? "Pharmacist:" : "Receptionist:"}
              </span>
              <span className="font-bold">{closing.receptionistName}</span>
            </div>
            <div className="flex justify-between">
              <span className="uppercase font-bold">Shift Date:</span>
              <span className="font-bold">{formattedDate}</span>
            </div>
            <div className="flex justify-between">
              <span className="uppercase font-bold">Voucher ID:</span>
              <span>{closing.id.slice(-8).toUpperCase()}</span>
            </div>
            <div className="flex justify-between">
              <span className="uppercase font-bold">Closed At:</span>
              <span>{formattedClosedAt}</span>
            </div>
          </div>

          {/* Financial Reconciliation Summary */}
          <div className="space-y-1.5 pb-2.5 border-b border-dashed border-black text-[12px]">
            <div className="text-[11px] font-bold uppercase tracking-wider pb-1">
              Cash Drawer Reconciliation
            </div>

            <div className="flex justify-between items-center py-1">
              <span>System Calculated Cash:</span>
              <span className="font-bold">
                Rs. {closing.totalSystemCash.toLocaleString()}
              </span>
            </div>

            {((closing.totalCashIn ?? 0) > 0 || (closing.totalCashOut ?? 0) > 0) && (
              <div className="flex justify-between items-center py-1 text-[11px]">
                <span>Cash In: +Rs. {(closing.totalCashIn || 0).toLocaleString()}</span>
                <span>Cash Out: -Rs. {(closing.totalCashOut || 0).toLocaleString()}</span>
              </div>
            )}

            <div className="flex justify-between items-center py-1.5 border-t border-b border-dashed border-black font-bold">
              <span>Physical Cash Counted:</span>
              <span className="text-sm font-black">
                Rs. {closing.countedCash.toLocaleString()}
              </span>
            </div>

            <div className="flex justify-between items-center py-1 font-bold">
              <span>Reconciliation Variance:</span>
              <div className="text-right">
                {isBalanced && <span>Rs. 0 (Balanced)</span>}
                {isShort && (
                  <span>
                    -Rs. {Math.abs(closing.variance).toLocaleString()} (Shortage)
                  </span>
                )}
                {isOver && (
                  <span>
                    +Rs. {closing.variance.toLocaleString()} (Overage)
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Service Breakdown (if available) */}
          {closing.serviceBreakdown && closing.serviceBreakdown.length > 0 && (
            <div className="space-y-1.5 pb-2.5 border-b border-dashed border-black text-[11px]">
              <div className="font-bold uppercase tracking-wider mb-1">
                Departmental Sales Breakdown
              </div>
              <div className="space-y-1">
                {closing.serviceBreakdown.map((s) => (
                  <div key={s.service} className="flex justify-between">
                    <span>
                      {s.service} ({s.count})
                    </span>
                    <span className="font-bold">
                      Rs. {s.total.toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Discrepancy Notes */}
          {closing.notes && (
            <div className="p-2 border border-dashed border-black text-[11px] space-y-1">
              <span className="font-bold uppercase block text-[10px]">
                Discrepancy / Handover Remarks:
              </span>
              <p className="italic">&ldquo;{closing.notes}&rdquo;</p>
            </div>
          )}

          {/* Signatures for Compliance */}
          <div className="pt-5 grid grid-cols-2 gap-4 text-center text-[10px]">
            <div className="border-t border-dashed border-black pt-1.5">
              <p className="font-bold">{closing.receptionistName}</p>
              <p className="text-[9px]">
                {closing.portal === "PHARMACY" ? "Pharmacist / Lead" : "Receptionist / Cashier"}
              </p>
            </div>
            <div className="border-t border-dashed border-black pt-1.5">
              <p className="font-bold">Hospital Supervisor</p>
              <p className="text-[9px]">Finance &amp; Audit Verified</p>
            </div>
          </div>

          {/* Barcode & Footer Note */}
          <div className="text-center pt-2 space-y-1.5">
            <div className="tracking-widest text-[10px] font-mono select-none">
              ||| | ||||| || |||| ||||| ||| |||| | ||| ||||
            </div>
            <p className="text-[9px] text-center">
              HMS Shift Accountability • System Generated Document
            </p>
            <div className="pt-2 border-t border-dashed border-black mt-1.5 text-center">
              <p className="text-[10px] font-bold uppercase tracking-wider text-black">
                Powered by BlockMindArk
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


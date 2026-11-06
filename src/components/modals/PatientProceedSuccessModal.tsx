"use client";

import React, { useEffect } from "react";
import {
  CheckCircle2,
  Printer,
  ArrowRight,
  User,
  Receipt,
  Clock,
  Sparkles,
  ShieldCheck,
  Check,
  RotateCcw,
} from "lucide-react";

export interface ProcessedPatientDetails {
  tokenNumber?: number | string;
  patientName: string;
  patientUid?: string;
  invoiceNumber: string;
  serviceOrItems: string;
  totalAmount: number;
  previouslyPaidAmount?: number;
  netAmountPaidNow?: number;
  discount?: number;
  cashTendered?: number;
  change?: number;
  staffName: string;
  portalType: "RECEPTIONIST" | "PHARMACIST";
}

interface PatientProceedSuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  onReprint?: () => void;
  details: ProcessedPatientDetails | null;
}

export function PatientProceedSuccessModal({
  isOpen,
  onClose,
  onReprint,
  details,
}: PatientProceedSuccessModalProps) {
  // Auto-dismiss modal after 2 seconds (2000ms)
  useEffect(() => {
    if (!isOpen) return;
    const timer = setTimeout(() => {
      onClose();
    }, 2000);
    return () => clearTimeout(timer);
  }, [isOpen, onClose]);

  if (!isOpen || !details) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-100 flex flex-col animate-in zoom-in-95 duration-150">
        {/* Top Header Banner */}
        <div className="p-6 bg-gradient-to-br from-emerald-600 via-teal-700 to-slate-900 text-white text-center relative overflow-hidden">
          <div className="absolute -right-6 -top-6 w-28 h-28 bg-white/10 rounded-full blur-xl pointer-events-none" />
          <div className="absolute -left-6 -bottom-6 w-28 h-28 bg-emerald-400/20 rounded-full blur-xl pointer-events-none" />

          {/* Animated Success Icon */}
          <div className="w-16 h-16 mx-auto rounded-full bg-white text-emerald-600 flex items-center justify-center shadow-lg border-4 border-emerald-100/40 mb-3 animate-in zoom-in-50 duration-300">
            <Check className="w-9 h-9 stroke-[3]" />
          </div>

          <span className="inline-block px-3 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-white/20 text-emerald-100 border border-white/20 mb-1">
            Transaction Complete &amp; Locked
          </span>
          <h2 className="text-xl font-black tracking-tight text-white">
            Patient Proceed Successfully!
          </h2>
          <p className="text-xs text-emerald-100/90 mt-1">
            {details.portalType === "RECEPTIONIST"
              ? "Visit registered, invoice generated, and patient queued for consultation."
              : details.serviceOrItems?.toLowerCase().includes("ultrasound") || details.invoiceNumber?.startsWith("INV-")
              ? "Clinical service invoice generated, payment collected, and patient proceed successfully."
              : "Dispensary POS sale settled and stock batches updated."}
          </p>
          <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-black/25 text-[10px] font-mono font-bold text-emerald-200">
            <Clock className="w-3 h-3 text-emerald-300 animate-spin" />
            <span>Auto-clearing terminal in 2 seconds...</span>
          </div>
        </div>

        {/* 2-Second Countdown Progress Bar */}
        <div className="w-full bg-slate-100 h-1.5 overflow-hidden">
          <div
            className="bg-emerald-500 h-full w-full transition-all duration-[2000ms] ease-linear"
            style={{ animation: "shrinkWidth 2s linear forwards" }}
          />
        </div>

        {/* Details Content Body */}
        <div className="p-6 space-y-4">
          {/* OPD Token Callout */}
          {details.tokenNumber && (
            <div className="p-3 bg-gradient-to-r from-indigo-50 to-blue-50 border-2 border-indigo-200 rounded-2xl flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs font-black uppercase text-indigo-900 tracking-wider">
                  OPD Token #{String(details.tokenNumber).padStart(2, "0")}
                </span>
                <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full border border-amber-300">
                  Old Slip Surrendered &amp; Disposed
                </span>
              </div>
              <span className="font-mono font-black text-sm text-indigo-800 bg-white px-2 py-0.5 rounded-lg border border-indigo-300 shadow-2xs">
                #{String(details.tokenNumber).padStart(2, "0")}
              </span>
            </div>
          )}

          {/* Patient Card */}
          <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-2xl space-y-3">
            <div className="flex items-center justify-between border-b border-slate-200/60 pb-2.5">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
                  <User className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-black text-slate-900">
                    {details.patientName}
                  </h4>
                  {details.patientUid && (
                    <span className="font-mono text-[10px] font-bold text-blue-700">
                      {details.patientUid}
                    </span>
                  )}
                </div>
              </div>

              <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-200">
                Paid in Full
              </span>
            </div>

            {/* Transaction metadata grid */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400">
                  {details.invoiceNumber?.startsWith("INV-") || details.portalType === "RECEPTIONIST" ? "Invoice Number" : "Receipt Number"}
                </span>
                <p className="font-mono font-bold text-slate-800">
                  {details.invoiceNumber}
                </p>
              </div>

              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400">
                  {details.previouslyPaidAmount ? "Cash Collected Now" : "Total Paid"}
                </span>
                <p className="font-mono font-black text-emerald-700 text-sm">
                  Rs. {(details.netAmountPaidNow ?? details.totalAmount).toLocaleString()}
                </p>
                {details.previouslyPaidAmount && (
                  <p className="text-[9px] text-slate-500 font-mono">
                    Token Paid: Rs. {details.previouslyPaidAmount} · Total: Rs. {details.totalAmount}
                  </p>
                )}
              </div>

              <div className="col-span-2 pt-1 border-t border-slate-100">
                <span className="text-[10px] uppercase font-bold text-slate-400">
                  {details.invoiceNumber?.startsWith("INV-") || details.portalType === "RECEPTIONIST" ? "Clinical Service" : "Items Dispensed"}
                </span>
                <p className="font-semibold text-slate-800 text-[11px] truncate">
                  {details.serviceOrItems}
                </p>
              </div>
            </div>
          </div>

          {/* Reset Confirmation Tag */}
          <div className="p-3 bg-emerald-50/70 border border-emerald-200/80 rounded-2xl flex items-center gap-2.5 text-xs text-emerald-900">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="text-[11px] font-medium leading-tight">
              All form data &amp; patient fields have been <strong>reset to default position</strong>, ready for the next patient.
            </span>
          </div>

          {/* Next Steps Guidance */}
          <div className="p-3 bg-blue-50/60 border border-blue-100 rounded-2xl flex items-center gap-2.5 text-xs text-blue-900">
            <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0" />
            <span className="text-[11px] leading-tight">
              {details.portalType === "RECEPTIONIST"
                ? "Patient dossier dispatched to Dr. Tariq Khan's consultation queue."
                : details.serviceOrItems?.toLowerCase().includes("ultrasound") || details.invoiceNumber?.startsWith("INV-")
                ? "Service receipt printed. Patient proceed to clinical diagnostic room."
                : "Medicines handed to patient. Daily shift sales ledger updated."}
            </span>
          </div>
        </div>

        {/* Modal Action Buttons */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center gap-2.5">
          {onReprint && (
            <button
              type="button"
              onClick={onReprint}
              className="w-full sm:w-auto px-4 py-2.5 bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
            >
              <Printer className="w-3.5 h-3.5 text-slate-500" />
              <span>Reprint Receipt</span>
            </button>
          )}

          <button
            type="button"
            onClick={onClose}
            className="w-full sm:flex-1 px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 text-white rounded-xl text-xs font-black flex items-center justify-center gap-2 shadow-md shadow-emerald-600/20 transition-all"
          >
            <span>Proceed to Next Patient (Auto in 2s)</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}


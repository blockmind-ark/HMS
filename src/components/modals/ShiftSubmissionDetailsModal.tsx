"use client";

import React, { useState } from "react";
import {
  X,
  Printer,
  CheckCircle2,
  XCircle,
  AlertCircle,
  FileText,
  Clock,
  User,
  TrendingUp,
  AlertTriangle,
  Building2,
  Lock,
  ArrowDownRight,
  ArrowUpRight,
  Tag,
  Banknote,
  ChevronDown,
  ChevronUp,
  Package,
} from "lucide-react";

interface ShiftSubmissionDetailsModalProps {
  shift: any | null;
  isOpen: boolean;
  onClose: () => void;
  onApprove?: (shift: any) => void;
  onReject?: (shift: any) => void;
  onPrint?: (shift: any) => void;
}

export function ShiftSubmissionDetailsModal({
  shift,
  isOpen,
  onClose,
  onApprove,
  onReject,
  onPrint,
}: ShiftSubmissionDetailsModalProps) {
  const [showAllServices, setShowAllServices] = useState(false);
  if (!isOpen || !shift) return null;

  const isBalanced = shift.variance === 0;
  const isShortage = shift.variance < 0;
  const isSurplus = shift.variance > 0;

  const formattedDate = new Date(shift.shiftDate).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  const formattedClosedAt = new Date(shift.updatedAt || shift.createdAt).toLocaleString("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  });

  const serviceBreakdown: Array<{ service: string; count: number; total: number }> =
    shift.serviceBreakdown || [];

  const maxTotal = Math.max(...serviceBreakdown.map((s) => s.total), 1);
  const totalServiceRevenue = serviceBreakdown.reduce((sum, s) => sum + s.total, 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full overflow-hidden border border-slate-100 animate-in zoom-in-95 duration-150 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 text-indigo-300 flex items-center justify-center border border-indigo-400/30">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-extrabold">Shift Submission Details</h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-400 text-slate-950">
                  {shift.status === "PENDING_APPROVAL" ? "Awaiting Review" : shift.status}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                {shift.portal === "PHARMACY" ? "Pharmacy POS" : "Reception Counter"} • {formattedDate}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {/* Metadata Dossier */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Submitted By</span>
              <span className="font-bold text-slate-900 text-sm flex items-center gap-1.5 mt-0.5">
                <User className="w-3.5 h-3.5 text-indigo-600" />
                {shift.user?.name || "Staff"}
              </span>
              <span className="text-[11px] text-slate-500">{shift.user?.email}</span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Submission Timestamp</span>
              <span className="font-bold text-slate-900 mt-0.5 block font-mono">{formattedClosedAt}</span>
              <span className="text-[11px] text-slate-500">ID: {shift.id.slice(-8).toUpperCase()}</span>
            </div>
          </div>

          {/* Financial Reconciliation Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Physical Cash Submitted */}
            <div className="p-4 bg-blue-50/70 border border-blue-200 rounded-2xl">
              <span className="text-[10px] uppercase font-black tracking-wider text-blue-700 block">
                Cash Submitted
              </span>
              <span className="text-xl font-black text-blue-950 font-mono mt-1 block">
                Rs. {shift.countedCash.toLocaleString()}
              </span>
              <span className="text-[10px] text-blue-600 font-medium">Physical cash in hand</span>
            </div>

            {/* System Calculated */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl">
              <span className="text-[10px] uppercase font-black tracking-wider text-slate-500 block">
                System Expected
              </span>
              <span className="text-xl font-black text-slate-900 font-mono mt-1 block">
                Rs. {shift.totalSystemCash.toLocaleString()}
              </span>
              <span className="text-[10px] text-slate-500 font-medium">Computer sales audit</span>
            </div>

            {/* Variance */}
            <div
              className={`p-4 rounded-2xl border ${
                isBalanced
                  ? "bg-emerald-50 border-emerald-200"
                  : isShortage
                  ? "bg-rose-50 border-rose-200"
                  : "bg-blue-50 border-blue-200"
              }`}
            >
              <span
                className={`text-[10px] uppercase font-black tracking-wider block ${
                  isBalanced ? "text-emerald-700" : isShortage ? "text-rose-700" : "text-blue-700"
                }`}
              >
                Variance
              </span>
              <span
                className={`text-xl font-black font-mono mt-1 block ${
                  isBalanced ? "text-emerald-900" : isShortage ? "text-rose-900" : "text-blue-900"
                }`}
              >
                {isBalanced
                  ? "Rs. 0"
                  : `${isShortage ? "-" : "+"}Rs. ${Math.abs(shift.variance).toLocaleString()}`}
              </span>
              <span
                className={`text-[10px] font-bold ${
                  isBalanced ? "text-emerald-700" : isShortage ? "text-rose-700" : "text-blue-700"
                }`}
              >
                {isBalanced ? "Balanced" : isShortage ? "Shortage" : "Surplus"}
              </span>
            </div>
          </div>

          {/* Cash In & Cash Out Quick Overview */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Cash In Card */}
            <div className="p-3.5 bg-emerald-50/70 border border-emerald-200 rounded-2xl flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                  <ArrowDownRight className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-emerald-700 block">Total Cash In</span>
                  <span className="text-base font-black text-emerald-950 font-mono">
                    Rs. {(shift.totalCashIn || 0).toLocaleString()}
                  </span>
                </div>
              </div>
              <span className="text-[11px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-200">
                {(shift.cashInList || []).length} {(shift.cashInList || []).length === 1 ? "entry" : "entries"}
              </span>
            </div>

            {/* Cash Out Card */}
            <div className="p-3.5 bg-rose-50/70 border border-rose-200 rounded-2xl flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center font-bold">
                  <ArrowUpRight className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-rose-700 block">Total Cash Out</span>
                  <span className="text-base font-black text-rose-950 font-mono">
                    Rs. {(shift.totalCashOut || 0).toLocaleString()}
                  </span>
                </div>
              </div>
              <span className="text-[11px] font-bold text-rose-800 bg-rose-100 px-2 py-0.5 rounded-full border border-rose-200">
                {(shift.cashOutList || []).length} {(shift.cashOutList || []).length === 1 ? "entry" : "entries"}
              </span>
            </div>
          </div>

          {/* Cash In Details Breakdown */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <ArrowDownRight className="w-4 h-4 text-emerald-600" />
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-800">
                  Cash In Details
                </h4>
              </div>
              <span className="text-[11px] font-mono font-extrabold text-emerald-700">
                +Rs. {(shift.totalCashIn || 0).toLocaleString()}
              </span>
            </div>

            {shift.cashInList && shift.cashInList.length > 0 ? (
              <div className="divide-y divide-slate-100 max-h-48 overflow-y-auto">
                {shift.cashInList.map((item: any, idx: number) => (
                  <div key={item.id || idx} className="py-2.5 flex items-center justify-between text-xs hover:bg-slate-50 px-2 rounded-lg">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900">{item.reason || "Drawer Float In"}</span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500">
                        Added by: <strong className="text-slate-700">{item.userName}</strong>
                      </p>
                    </div>
                    <span className="font-mono font-black text-emerald-700 text-sm">
                      +Rs. {item.amount.toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400 text-center py-2.5">
                No Cash In adjustments recorded for this shift.
              </p>
            )}
          </div>

          {/* Cash Out Details Breakdown */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <ArrowUpRight className="w-4 h-4 text-rose-600" />
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-800">
                  Cash Out Details
                </h4>
              </div>
              <span className="text-[11px] font-mono font-extrabold text-rose-700">
                -Rs. {(shift.totalCashOut || 0).toLocaleString()}
              </span>
            </div>

            {shift.cashOutList && shift.cashOutList.length > 0 ? (
              <div className="divide-y divide-slate-100 max-h-48 overflow-y-auto">
                {shift.cashOutList.map((item: any, idx: number) => (
                  <div key={item.id || idx} className="py-2.5 flex items-center justify-between text-xs hover:bg-slate-50 px-2 rounded-lg">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-rose-50 text-rose-700 border border-rose-200">
                          {item.category || "Expenditure"}
                        </span>
                        <span className="font-bold text-slate-900">{item.reason}</span>
                      </div>
                      <div className="flex items-center gap-2 text-[11px] text-slate-500">
                        <span>Staff: <strong className="text-slate-700">{item.userName}</strong></span>
                        <span>•</span>
                        <span className="font-mono text-slate-400">
                          {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>
                    <span className="font-mono font-black text-rose-700 text-sm">
                      -Rs. {item.amount.toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400 text-center py-2.5">
                No Cash Out expenditures recorded for this shift.
              </p>
            )}
          </div>

          {/* Services / Medicines Breakdown Table (High to Low) */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                {shift.portal === "PHARMACY" ? (
                  <Package className="w-4 h-4 text-emerald-600" />
                ) : (
                  <FileText className="w-4 h-4 text-purple-600" />
                )}
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-800">
                  {shift.portal === "PHARMACY"
                    ? "Itemized Sales & Revenue Breakdown"
                    : "Sales by Clinical Service Type"}
                </h4>
              </div>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                shift.portal === "PHARMACY"
                  ? "text-emerald-700 bg-emerald-50 border-emerald-200"
                  : "text-purple-700 bg-purple-50 border-purple-200"
              }`}>
                High to Low
              </span>
            </div>

            <div className="space-y-2.5">
              {(showAllServices
                ? serviceBreakdown
                : serviceBreakdown.slice(0, shift.portal === "PHARMACY" ? 3 : 4)
              ).map((s, idx) => {
                const percentage = maxTotal > 0 ? (s.total / maxTotal) * 100 : 0;
                const hasSales = s.total > 0;

                return (
                  <div key={s.service} className="space-y-1">
                    <div className="flex justify-between items-center text-xs">
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`w-4 h-4 rounded text-[10px] font-black flex items-center justify-center shrink-0 ${
                            idx === 0 && hasSales
                              ? "bg-amber-100 text-amber-900 border border-amber-300"
                              : idx === 1 && hasSales
                              ? "bg-slate-200 text-slate-800"
                              : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {idx + 1}
                        </span>
                        <span className={`font-bold ${hasSales ? "text-slate-900" : "text-slate-500"}`}>
                          {s.service}
                        </span>
                        <span className="text-[10px] text-slate-400 font-medium">
                          ({s.count} {s.count === 1 ? "visit" : "visits"})
                        </span>
                      </div>
                      <span className={`font-mono font-bold ${hasSales ? "text-slate-900" : "text-slate-400"}`}>
                        Rs. {s.total.toLocaleString()}
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          hasSales
                            ? "bg-gradient-to-r from-purple-500 to-indigo-600"
                            : "bg-slate-200"
                        }`}
                        style={{ width: `${Math.max(hasSales ? 4 : 0, Math.min(100, percentage))}%` }}
                      />
                    </div>
                  </div>
                );
              })}

              {serviceBreakdown.length > (shift.portal === "PHARMACY" ? 3 : 4) && (
                <button
                  type="button"
                  onClick={() => setShowAllServices(!showAllServices)}
                  className={`w-full py-2 px-3 text-xs font-bold rounded-xl border transition-all flex items-center justify-center gap-1.5 shadow-2xs mt-1 ${
                    shift.portal === "PHARMACY"
                      ? "text-emerald-700 hover:text-emerald-900 bg-emerald-50/70 hover:bg-emerald-100 border-emerald-200/80"
                      : "text-purple-700 hover:text-purple-900 bg-purple-50/70 hover:bg-purple-100 border-purple-200/80"
                  }`}
                >
                  {showAllServices ? (
                    <>
                      <ChevronUp className="w-3.5 h-3.5" />
                      <span>Hide</span>
                    </>
                  ) : (
                    <>
                      <ChevronDown className="w-3.5 h-3.5" />
                      <span>See More ({serviceBreakdown.length - (shift.portal === "PHARMACY" ? 3 : 4)} more items)</span>
                    </>
                  )}
                </button>
              )}

              {serviceBreakdown.length === 0 && (
                <p className="text-xs text-slate-400 text-center py-3">
                  No service breakdown data recorded for this shift.
                </p>
              )}
            </div>

            {totalServiceRevenue > 0 && (
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs font-black">
                <span className="text-slate-700">
                  {shift.portal === "PHARMACY" ? "Total Pharmacy Sales:" : "Total Clinical Sales:"}
                </span>
                <span
                  className={`font-mono text-sm ${
                    shift.portal === "PHARMACY" ? "text-emerald-950" : "text-purple-950"
                  }`}
                >
                  Rs. {totalServiceRevenue.toLocaleString()}
                </span>
              </div>
            )}
          </div>

          {/* Handover Note */}
          {shift.notes && (
            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 text-xs space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                Receptionist Handover Note
              </span>
              <p className="text-slate-800 font-medium italic">&ldquo;{shift.notes}&rdquo;</p>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-2">
            {onPrint && (
              <button
                type="button"
                onClick={() => onPrint(shift)}
                className="px-3.5 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 shadow-xs"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Official Voucher</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-200 rounded-xl transition-colors"
            >
              Close
            </button>

            {shift.status === "PENDING_APPROVAL" && onReject && (
              <button
                type="button"
                onClick={() => onReject(shift)}
                className="px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5"
              >
                <XCircle className="w-3.5 h-3.5" />
                <span>Rejected &amp; Reentered</span>
              </button>
            )}

            {shift.status === "PENDING_APPROVAL" && onApprove && (
              <button
                type="button"
                onClick={() => onApprove(shift)}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-600/20 transition-all flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Accepted</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}


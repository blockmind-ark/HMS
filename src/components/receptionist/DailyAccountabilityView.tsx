"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Banknote,
  Receipt,
  Users,
  CheckCircle2,
  AlertTriangle,
  Lock,
  Printer,
  RefreshCw,
  Calendar,
  History,
  FileText,
  Clock,
  ArrowRight,
  TrendingDown,
  TrendingUp,
  PlusCircle,
  ArrowDownRight,
  ArrowUpRight,
  ShieldAlert,
  Tag,
  AlertCircle,
  Send,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import {
  ShiftClosingVoucherModal,
  ShiftClosingData,
} from "@/components/modals/ShiftClosingVoucherModal";
import { DrawerAdjustmentModal } from "@/components/modals/DrawerAdjustmentModal";
import { AddExpenditureModal } from "@/components/modals/AddExpenditureModal";
import { SubmitShiftCashModal } from "@/components/modals/SubmitShiftCashModal";

export function DailyAccountabilityView() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0]
  );

  // Notification State
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Voucher Modal State
  const [voucherModalOpen, setVoucherModalOpen] = useState(false);
  const [selectedVoucherData, setSelectedVoucherData] =
    useState<ShiftClosingData | null>(null);

  // Modals State
  const [drawerModalOpen, setDrawerModalOpen] = useState(false);
  const [expenditureModalOpen, setExpenditureModalOpen] = useState(false);
  const [submitModalOpen, setSubmitModalOpen] = useState(false);
  const [showAllServices, setShowAllServices] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  const fetchShiftData = async (date: string) => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const res = await fetch(`/api/receptionist/accountability?date=${date}`);
      if (res.ok) {
        const json = await res.json();
        setData(json);
      } else {
        const err = await res.json();
        setErrorMessage(err.error || "Failed to load shift accountability data.");
      }
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || "Network error loading shift data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchShiftData(selectedDate);
  }, [selectedDate]);

  const systemCash = data?.summary?.totalSystemCash || 0;

  const activeClosingStatus = data?.activeClosing?.status || "OPEN";
  const isShiftApproved = activeClosingStatus === "APPROVED" || activeClosingStatus === "CLOSED";
  const isShiftPending = activeClosingStatus === "PENDING_APPROVAL";
  const isShiftRejected = activeClosingStatus === "REJECTED";

  return (
    <div className="space-y-6 animate-in fade-in pb-12">
      {/* Top Bar with Date, Refresh & Quick Actions */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-base font-extrabold text-slate-900">
              Counter Daily Sales &amp; Cash Accountability
            </h3>

            {isShiftApproved && (
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                <span>Shift Approved &amp; Committed</span>
              </span>
            )}

            {isShiftPending && (
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-amber-100 text-amber-800 border border-amber-200 flex items-center gap-1">
                <Clock className="w-3 h-3 text-amber-600 animate-spin" />
                <span>Pending Admin Approval</span>
              </span>
            )}

            {isShiftRejected && (
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-rose-100 text-rose-800 border border-rose-200 flex items-center gap-1">
                <AlertCircle className="w-3 h-3 text-rose-600" />
                <span>Shift Returned / Rejected</span>
              </span>
            )}

            {!data?.activeClosing && (
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-blue-100 text-blue-800 border border-blue-200 flex items-center gap-1">
                <Clock className="w-3 h-3 text-blue-600" />
                <span>Shift In Progress (Open)</span>
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Logged-in Receptionist:{" "}
            <span className="font-bold text-slate-800">
              {data?.receptionist?.name || "Loading..."}
            </span>{" "}
            ({data?.receptionist?.email})
          </p>
        </div>

        {/* Action Buttons: Cash In + Cash Out */}
        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          <button
            onClick={() => setDrawerModalOpen(true)}
            className="px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors border border-emerald-200 shadow-sm"
          >
            <ArrowDownRight className="w-4 h-4 text-emerald-600" />
            <span>Cash In</span>
          </button>

          <button
            onClick={() => setExpenditureModalOpen(true)}
            className="px-3.5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors border border-rose-200 shadow-sm"
          >
            <ArrowUpRight className="w-4 h-4 text-rose-600" />
            <span>Cash Out</span>
          </button>

          <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
            <Calendar className="w-4 h-4 text-slate-500" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-transparent text-xs font-bold text-slate-800 focus:outline-none"
            />
          </div>

          <button
            onClick={() => fetchShiftData(selectedDate)}
            disabled={loading}
            className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-colors"
            title="Refresh Ledger"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* Prominent Status Banners */}
      {isShiftPending && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl text-xs text-amber-900 flex items-start justify-between shadow-sm">
          <div className="flex items-start gap-2.5">
            <Clock className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <h5 className="font-extrabold text-sm">
                Shift Close Awaiting Admin Review &amp; Final Commit
              </h5>
              <p className="mt-0.5 text-amber-800">
                Your shift sheet of <strong>Rs. {data.activeClosing.countedCash.toLocaleString()}</strong> has been submitted to the Admin Approvals Center. The shift will be officially locked and committed once reviewed by an Administrator.
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              setSelectedVoucherData({
                id: data.activeClosing.id,
                shiftDate: data.activeClosing.shiftDate,
                receptionistName: data?.receptionist?.name || "Receptionist",
                receptionistEmail: data?.receptionist?.email,
                totalSystemCash: data.activeClosing.totalSystemCash,
                countedCash: data.activeClosing.countedCash,
                variance: data.activeClosing.variance,
                notes: data.activeClosing.notes,
                status: data.activeClosing.status,
                closedAt: data.activeClosing.updatedAt || data.activeClosing.createdAt,
                summary: data?.summary,
                serviceBreakdown: data?.serviceBreakdown,
              });
              setVoucherModalOpen(true);
            }}
            className="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold text-xs flex-shrink-0"
          >
            Preview Sheet
          </button>
        </div>
      )}

      {isShiftRejected && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-900 flex items-start gap-3 shadow-sm">
          <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h5 className="font-extrabold text-sm">
              Shift Sheet Returned / Rejected by Admin
            </h5>
            <p className="mt-0.5 text-rose-800">
              <strong>Admin Remarks:</strong> &ldquo;
              {data.activeClosing.adminComment || "Please recount cash drawer and rectify variance before resubmitting."}
              &rdquo;
            </p>
            <p className="text-[11px] text-rose-600 mt-1 font-semibold">
              Please re-verify drawer contents below and submit an updated shift close sheet.
            </p>
          </div>
        </div>
      )}

      {/* Messages */}
      {successMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs font-bold text-emerald-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{successMessage}</span>
          </div>
          <button
            onClick={() => setSuccessMessage(null)}
            className="text-emerald-700 hover:underline text-[11px]"
          >
            Dismiss
          </button>
        </div>
      )}

      {errorMessage && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-xs font-bold text-rose-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-600" />
            <span>{errorMessage}</span>
          </div>
          <button
            onClick={() => setErrorMessage(null)}
            className="text-rose-700 hover:underline text-[11px]"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* KPI Cards: Net Cash Drawer & Breakdown */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Net Expected System Cash */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
            <Banknote className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Cash Collection 
            </span>
            <p className="text-xl font-black text-slate-900">
              Rs. {systemCash.toLocaleString()}
            </p>
            <p className="text-[10px] text-slate-400 mt-0.5">OPD + Other Services - Expenses</p>
          </div>
        </div>

        {/* Card 2: Cash In (Float) */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <ArrowDownRight className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Add Cash (Change)
            </span>
            <p className="text-xl font-black text-emerald-900">
              +Rs. {(data?.summary?.approvedCashIn || 0).toLocaleString()}
            </p>
            <p className="text-[10px] text-slate-400 mt-0.5">Additional cash Added</p>
          </div>
        </div>

        {/* Card 3: Cash Out & Expenses */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
            <ArrowUpRight className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Cash Out &amp; Expenses
            </span>
            <p className="text-xl font-black text-rose-900">
              -Rs. {((data?.summary?.totalExpenditures || 0) + (data?.summary?.approvedCashOut || 0)).toLocaleString()}
            </p>
            <p className="text-[10px] text-slate-400 mt-0.5">Deducted from Counter</p>
          </div>
        </div>

        {/* Card 4: Patients / Invoices */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Invoiced Checkouts
            </span>
            <p className="text-xl font-black text-slate-900">
              {data?.summary?.invoiceCount || 0}
            </p>
            <p className="text-[10px] text-slate-400 mt-0.5">
              Cash: Rs. {(data?.summary?.cashInvoicesTotal || 0).toLocaleString()}
            </p>
          </div>
        </div>
      </div>

      {/* Sales by Clinical Service Type & Cash Submission */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-2">
          <div>
            <h4 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
              <FileText className="w-4 h-4 text-purple-600" />
              <span>Sales by Clinical Service Type</span>
            </h4>
            <p className="text-xs text-slate-500 mt-0.5">
              Live department sales breakdown ordered from highest to lowest revenue.
            </p>
          </div>
          <span className="text-[10px] font-bold text-purple-700 bg-purple-50 border border-purple-200 px-2.5 py-1 rounded-full uppercase tracking-wider self-start sm:self-auto">
            High to Low Order
          </span>
        </div>

        {/* Clinical Services List (High to Low) */}
        <div className="space-y-3.5">
          {(() => {
            const list = [...(data?.serviceBreakdown || [])].sort(
              (a: any, b: any) => b.total - a.total || b.count - a.count
            );
            const maxTotal = Math.max(...list.map((s: any) => s.total), 1);
            const displayedList = showAllServices ? list : list.slice(0, 4);

            return (
              <>
                {displayedList.map((s: any, idx: number) => {
                  const percentage = maxTotal > 0 ? (s.total / maxTotal) * 100 : 0;
                  const hasSales = s.total > 0;

                  return (
                    <div key={s.service} className="space-y-1.5 p-3 rounded-xl bg-slate-50/70 border border-slate-100 hover:border-purple-200 transition-colors">
                      <div className="flex justify-between items-center text-xs">
                        <div className="flex items-center gap-2">
                          <span
                            className={`w-5 h-5 rounded-md text-[10px] font-black flex items-center justify-center shrink-0 ${
                              idx === 0 && hasSales
                                ? "bg-amber-400 text-slate-950 shadow-xs"
                                : idx === 1 && hasSales
                                ? "bg-slate-300 text-slate-900"
                                : "bg-slate-200 text-slate-700"
                            }`}
                          >
                            #{idx + 1}
                          </span>
                          <span className={`font-bold text-sm ${hasSales ? "text-slate-900" : "text-slate-500"}`}>
                            {s.service}
                          </span>
                          <span className="text-[11px] text-slate-400 font-medium">
                            ({s.count} {s.count === 1 ? "visit" : "visits"})
                          </span>
                        </div>
                        <span
                          className={`font-mono font-black text-sm ${
                            hasSales ? "text-slate-900" : "text-slate-400"
                          }`}
                        >
                          Rs. {s.total.toLocaleString()}
                        </span>
                      </div>
                      <div className="w-full bg-slate-200/70 h-2 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            hasSales
                              ? "bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600"
                              : "bg-slate-300"
                          }`}
                          style={{ width: `${Math.max(hasSales ? 3 : 0, Math.min(100, percentage))}%` }}
                        />
                      </div>
                    </div>
                  );
                })}

                {list.length > 4 && (
                  <button
                    type="button"
                    onClick={() => setShowAllServices(!showAllServices)}
                    className="w-full py-2.5 px-4 text-xs font-bold text-purple-700 hover:text-purple-900 bg-purple-50/60 hover:bg-purple-100/70 rounded-xl border border-purple-200/70 transition-all flex items-center justify-center gap-1.5 shadow-2xs mt-1"
                  >
                    {showAllServices ? (
                      <>
                        <ChevronUp className="w-4 h-4" />
                        <span>Hide Services</span>
                      </>
                    ) : (
                      <>
                        <ChevronDown className="w-4 h-4" />
                        <span>See More ({list.length - 4} more services)</span>
                      </>
                    )}
                  </button>
                )}
              </>
            );
          })()}

          {(!data?.serviceBreakdown || data.serviceBreakdown.length === 0) && (
            <p className="text-xs text-slate-400 text-center py-6">
              No service records found for this date.
            </p>
          )}
        </div>

        {/* Total Summary Footer */}
        <div className="pt-4 border-t border-slate-200 flex flex-wrap items-center justify-between text-xs font-bold text-slate-600">
          <span className="uppercase tracking-wider text-[11px]">Total Expected System Cash:</span>
          <span className="text-lg font-black text-slate-900 font-mono">
            Rs. {systemCash.toLocaleString()}
          </span>
        </div>

        {/* Below Their One Button for Submission */}
        <div className="pt-2 space-y-3">
          {isShiftPending && (
            <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-between text-xs text-amber-900 shadow-xs">
              <div className="flex items-center gap-2 font-semibold">
                <Clock className="w-4 h-4 text-amber-600 animate-spin flex-shrink-0" />
                <span>
                  Submitted to Admin: <strong>Rs. {(data.activeClosing?.countedCash || 0).toLocaleString()}</strong> (Awaiting Approval)
                </span>
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider bg-amber-200/80 text-amber-900 px-2 py-0.5 rounded">
                Pending
              </span>
            </div>
          )}

          {isShiftRejected && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex items-center justify-between text-xs text-rose-900 shadow-xs">
              <div className="flex items-center gap-2 font-semibold">
                <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                <div>
                  <span className="block font-bold">Shift Returned for Re-entry</span>
                  <span className="text-[11px] text-rose-700">
                    {data.activeClosing?.adminComment
                      ? `Admin note: "${data.activeClosing.adminComment}"`
                      : "Please recount physical cash in counter and re-submit."}
                  </span>
                </div>
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider bg-rose-200/80 text-rose-900 px-2 py-0.5 rounded">
                Re-enter
              </span>
            </div>
          )}

          <button
            type="button"
            onClick={() => setSubmitModalOpen(true)}
            className="w-full py-4 px-6 rounded-2xl font-black text-sm flex items-center justify-center gap-2 shadow-xl transition-all bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-700 hover:to-indigo-800 text-white shadow-blue-500/25 active:scale-[0.99]"
          >
            <Send className="w-4 h-4" />
            <span>Submit</span>
          </button>
        </div>
      </div>

      {/* Historical Shift Closings Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-slate-500" />
            <h4 className="text-sm font-bold text-slate-900">
              Counter Shift Accountability History &amp; Audits
            </h4>
            <span className="text-[11px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200">
              {(data?.pastClosings || []).length} {(data?.pastClosings || []).length === 1 ? "record" : "records"}
            </span>
          </div>

          <button
            type="button"
            onClick={() => setShowHistory(!showHistory)}
            className="px-3.5 py-1.5 text-xs font-bold text-purple-700 hover:text-purple-900 bg-purple-50 hover:bg-purple-100 rounded-xl border border-purple-200 transition-all flex items-center gap-1.5 shadow-2xs"
          >
            {showHistory ? (
              <>
                <ChevronUp className="w-3.5 h-3.5" />
                <span>Hide</span>
              </>
            ) : (
              <>
                <ChevronDown className="w-3.5 h-3.5" />
                <span>See More</span>
              </>
            )}
          </button>
        </div>

        {showHistory ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="px-5 py-3.5">Shift Date</th>
                  <th className="px-5 py-3.5">Receptionist</th>
                  <th className="px-5 py-3.5 text-right">System Cash</th>
                  <th className="px-5 py-3.5 text-right">Physical Counted</th>
                  <th className="px-5 py-3.5 text-right">Variance</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5">Supervisor</th>
                  <th className="px-5 py-3.5">Notes</th>
                  <th className="px-5 py-3.5 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {(data?.pastClosings || []).map((c: any) => {
                  const isBal = c.variance === 0;
                  const isSh = c.variance < 0;
                  return (
                    <tr key={c.id} className="hover:bg-slate-50/80">
                      <td className="px-5 py-3.5 font-mono font-bold text-slate-900 whitespace-nowrap">
                        {new Date(c.shiftDate).toLocaleDateString("en-GB", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </td>
                      <td className="px-5 py-3.5 font-bold text-slate-900">
                        {c.user?.name || "Receptionist"}
                      </td>
                      <td className="px-5 py-3.5 text-right font-mono font-bold text-slate-800">
                        Rs. {c.totalSystemCash.toLocaleString()}
                      </td>
                      <td className="px-5 py-3.5 text-right font-mono font-bold text-blue-700">
                        Rs. {c.countedCash.toLocaleString()}
                      </td>
                      <td className="px-5 py-3.5 text-right font-mono font-extrabold">
                        {isBal ? (
                          <span className="text-emerald-600">Rs. 0</span>
                        ) : isSh ? (
                          <span className="text-rose-600">
                            -Rs. {Math.abs(c.variance).toLocaleString()}
                          </span>
                        ) : (
                          <span className="text-blue-600">
                            +Rs. {c.variance.toLocaleString()}
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-3.5">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            c.status === "APPROVED" || c.status === "CLOSED"
                              ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                              : c.status === "REJECTED"
                              ? "bg-rose-100 text-rose-800 border border-rose-200"
                              : "bg-amber-100 text-amber-800 border border-amber-200"
                          }`}
                        >
                          {c.status}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-slate-600 font-medium">
                        {c.approvedBy?.name || (c.status === "CLOSED" ? "Supervisor" : "—")}
                      </td>
                      <td className="px-5 py-3.5 text-slate-500 max-w-xs truncate">
                        {c.adminComment ? (
                          <span className="text-rose-700 font-medium">
                            Note: {c.adminComment}
                          </span>
                        ) : (
                          c.notes || "—"
                        )}
                      </td>
                      <td className="px-5 py-3.5 text-center">
                        <button
                          onClick={() => {
                            setSelectedVoucherData({
                              id: c.id,
                              shiftDate: c.shiftDate,
                              receptionistName: c.user?.name || "Receptionist",
                              receptionistEmail: c.user?.email,
                              totalSystemCash: c.totalSystemCash,
                              countedCash: c.countedCash,
                              variance: c.variance,
                              notes: c.notes,
                              status: c.status,
                              closedAt: c.updatedAt || c.createdAt,
                            });
                            setVoucherModalOpen(true);
                          }}
                          className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[11px] rounded-lg transition-colors flex items-center gap-1 mx-auto"
                        >
                          <Printer className="w-3 h-3" />
                          <span>Voucher</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
                {(!data?.pastClosings || data.pastClosings.length === 0) && (
                  <tr>
                    <td colSpan={9} className="px-5 py-8 text-center text-slate-400 text-xs">
                      No historical shift closings found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>

            <div className="p-3 bg-slate-50 border-t border-slate-100 text-center">
              <button
                type="button"
                onClick={() => setShowHistory(false)}
                className="px-4 py-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl transition-all inline-flex items-center gap-1.5 shadow-2xs"
              >
                <ChevronUp className="w-3.5 h-3.5" />
                <span>Hide</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="p-4 text-center bg-slate-50/50">
            <button
              type="button"
              onClick={() => setShowHistory(true)}
              className="text-xs font-bold text-purple-700 hover:text-purple-900 inline-flex items-center justify-center gap-1.5 py-1 px-3 rounded-lg hover:bg-purple-50 transition-colors"
            >
              <ChevronDown className="w-4 h-4" />
              <span>See More ({(data?.pastClosings || []).length} past records)</span>
            </button>
          </div>
        )}
      </div>

      {/* Printable Shift Closing Voucher Modal */}
      <ShiftClosingVoucherModal
        closing={selectedVoucherData}
        isOpen={voucherModalOpen}
        onClose={() => setVoucherModalOpen(false)}
      />

      {/* Drawer Adjustment Modal (Cash In Only) */}
      <DrawerAdjustmentModal
        isOpen={drawerModalOpen}
        onClose={() => setDrawerModalOpen(false)}
        onSuccess={() => fetchShiftData(selectedDate)}
        mode="CASH_IN"
      />

      {/* Add Expenditure Modal */}
      <AddExpenditureModal
        isOpen={expenditureModalOpen}
        onClose={() => setExpenditureModalOpen(false)}
        onSuccess={() => fetchShiftData(selectedDate)}
        portal="RECEPTION"
      />

      {/* Submit Shift Cash Modal */}
      <SubmitShiftCashModal
        isOpen={submitModalOpen}
        onClose={() => setSubmitModalOpen(false)}
        onSuccess={() => {
          fetchShiftData(selectedDate);
          setSuccessMessage(
            "Shift cash submitted successfully! Awaiting Administrator review and approval."
          );
        }}
        shiftDate={selectedDate}
        systemCash={systemCash}
        initialCash={data?.activeClosing?.countedCash}
        initialNotes={data?.activeClosing?.notes}
        isExistingSubmission={Boolean(data?.activeClosing)}
      />
    </div>
  );
}

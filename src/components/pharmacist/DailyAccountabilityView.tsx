"use client";

import React, { useState, useEffect } from "react";
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
  Package,
  Pill,
  Sparkles,
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
  const [showAllMedicines, setShowAllMedicines] = useState(false);
  const [showAllServices, setShowAllServices] = useState(false);
  const [breakdownViewFilter, setBreakdownViewFilter] = useState<"ALL" | "MEDICINES" | "SERVICES">("ALL");
  const [showHistory, setShowHistory] = useState(false);

  const fetchShiftData = async (date: string) => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const res = await fetch(`/api/pharmacist/accountability?date=${date}`);
      if (res.ok) {
        const json = await res.json();
        setData(json);
      } else {
        const err = await res.json();
        setErrorMessage(err.error || "Failed to load pharmacy shift accountability data.");
      }
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || "Network error loading pharmacy shift data.");
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
            Logged-in Pharmacist:{" "}
            <span className="font-bold text-slate-800">
              {data?.pharmacist?.name || "Loading..."}
            </span>{" "}
            ({data?.pharmacist?.email})
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
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl text-xs text-amber-900 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-2.5">
            <Clock className="w-5 h-5 text-amber-600 flex-shrink-0 animate-spin" />
            <div>
              <span className="font-extrabold text-sm block">
                Shift Close Submitted to Admin
              </span>
              <span className="text-amber-800">
                Awaiting administrator verification. Submitted Physical Cash:{" "}
                <strong>Rs. {(data.activeClosing?.countedCash || 0).toLocaleString()}</strong>
              </span>
            </div>
          </div>
          <button
            onClick={() => {
              setSelectedVoucherData({
                id: data.activeClosing.id,
                shiftDate: data.activeClosing.shiftDate,
                receptionistName: data.activeClosing.user?.name || data?.pharmacist?.name || "Pharmacist",
                receptionistEmail: data.activeClosing.user?.email || data?.pharmacist?.email,
                totalSystemCash: data.activeClosing.totalSystemCash,
                countedCash: data.activeClosing.countedCash,
                variance: data.activeClosing.variance,
                notes: data.activeClosing.notes,
                status: data.activeClosing.status,
                closedAt: data.activeClosing.updatedAt || data.activeClosing.createdAt,
                portal: "PHARMACY",
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
            <p className="text-[10px] text-slate-400 mt-0.5">Medicine &amp; Service Sales - Expenses</p>
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
            <p className="text-[10px] text-slate-400 mt-0.5">Deducted from Register</p>
          </div>
        </div>

        {/* Card 4: Invoiced Checkouts / Sales */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
            <Package className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Invoiced Checkouts
            </span>
            <p className="text-xl font-black text-slate-900">
              {data?.summary?.invoiceCount || data?.summary?.salesCount || 0}
            </p>
            <p className="text-[10px] text-slate-400 mt-0.5">
              Cash: Rs. {(data?.summary?.totalRevenue || 0).toLocaleString()}
            </p>
          </div>
        </div>
      </div>

      {/* Itemized Sales & Revenue Breakdown & Cash Submission */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-3">
          <div>
            <h4 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
              <Package className="w-4 h-4 text-emerald-600" />
              <span>Itemized Sales &amp; Revenue Breakdown</span>
            </h4>
            <p className="text-xs text-slate-500 mt-0.5">
              Segregated breakdown of live dispensary medicines versus other clinical &amp; ultrasound services.
            </p>
          </div>

          {/* Segregation Filter Controls */}
          <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl self-start sm:self-auto">
            <button
              type="button"
              onClick={() => setBreakdownViewFilter("ALL")}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                breakdownViewFilter === "ALL"
                  ? "bg-white text-slate-900 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              All Segregated
            </button>
            <button
              type="button"
              onClick={() => setBreakdownViewFilter("MEDICINES")}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                breakdownViewFilter === "MEDICINES"
                  ? "bg-white text-emerald-700 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Pill className="w-3.5 h-3.5 text-emerald-600" />
              <span>Medicines ({data?.medicineSales?.length ?? (data?.itemizedSales || []).filter((it: any) => it.itemType !== "CLINICAL_SERVICE" && !/^svc-/i.test(it.medicineId)).length})</span>
            </button>
            <button
              type="button"
              onClick={() => setBreakdownViewFilter("SERVICES")}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                breakdownViewFilter === "SERVICES"
                  ? "bg-white text-purple-700 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-purple-600" />
              <span>Other Services ({data?.serviceSales?.length ?? (data?.itemizedSales || []).filter((it: any) => it.itemType === "CLINICAL_SERVICE" || /^svc-/i.test(it.medicineId)).length})</span>
            </button>
          </div>
        </div>

        {/* Segregated Content: Two Panels (Medicines vs Other Services) */}
        {(() => {
          const medicineList = (
            data?.medicineSales ||
            (data?.itemizedSales || []).filter(
              (it: any) => it.itemType !== "CLINICAL_SERVICE" && !/^svc-/i.test(it.medicineId)
            )
          ).sort((a: any, b: any) => b.total - a.total || b.count - a.count);

          const serviceList = (
            data?.serviceSales ||
            (data?.itemizedSales || []).filter(
              (it: any) => it.itemType === "CLINICAL_SERVICE" || /^svc-/i.test(it.medicineId)
            )
          ).sort((a: any, b: any) => b.total - a.total || b.count - a.count);

          const maxMedTotal = Math.max(...medicineList.map((s: any) => s.total), 1);
          const maxSvcTotal = Math.max(...serviceList.map((s: any) => s.total), 1);

          const displayedMedicines = showAllMedicines ? medicineList : medicineList.slice(0, 3);
          const displayedServices = showAllServices ? serviceList : serviceList.slice(0, 3);

          const medSubtotal = data?.summary?.medicineRevenue ?? medicineList.reduce((sum: number, it: any) => sum + it.total, 0);
          const svcSubtotal = data?.summary?.serviceRevenue ?? serviceList.reduce((sum: number, it: any) => sum + it.total, 0);

          return (
            <div className={`grid gap-6 items-start ${
              breakdownViewFilter === "ALL"
                ? "grid-cols-1 lg:grid-cols-2"
                : "grid-cols-1"
            }`}>
              {/* SECTION 1: MEDICINES & SURGICAL DISPENSARY ITEMS */}
              {(breakdownViewFilter === "ALL" || breakdownViewFilter === "MEDICINES") && (
                <div className="bg-slate-50/70 border-2 border-emerald-100 rounded-2xl p-4 sm:p-5 space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-emerald-100">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold shrink-0">
                        <Pill className="w-5 h-5 text-emerald-600" />
                      </div>
                      <div>
                        <h5 className="text-xs font-black uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
                          <span>Dispensary Medicines</span>
                          <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-emerald-200 text-emerald-900">
                            {medicineList.length} items
                          </span>
                        </h5>
                        <p className="text-[11px] text-slate-500">
                          {data?.summary?.medicineSalesCount || 0} POS checkout(s) · {data?.summary?.medicineUnitsSold || 0} units dispensed
                        </p>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] font-bold uppercase text-slate-400 block">Medicine Revenue</span>
                      <span className="text-sm font-black font-mono text-emerald-700">
                        Rs. {medSubtotal.toLocaleString()}
                      </span>
                    </div>
                  </div>

                  {/* Medicines List */}
                  <div className="space-y-3">
                    {displayedMedicines.map((item: any, idx: number) => {
                      const percentage = maxMedTotal > 0 ? (item.total / maxMedTotal) * 100 : 0;
                      const hasSales = item.total > 0;

                      return (
                        <div
                          key={item.medicineId || idx}
                          className="space-y-1.5 p-3 rounded-xl bg-white border border-slate-200/80 hover:border-emerald-300 transition-colors shadow-2xs"
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs">
                            <div className="flex items-center gap-2">
                              <span
                                className={`w-5 h-5 rounded-md text-[10px] font-black flex items-center justify-center shrink-0 ${
                                  idx === 0 && hasSales
                                    ? "bg-amber-400 text-slate-950 shadow-xs"
                                    : idx === 1 && hasSales
                                    ? "bg-slate-300 text-slate-900"
                                    : idx === 2 && hasSales
                                    ? "bg-amber-100 text-amber-900"
                                    : "bg-slate-200 text-slate-700"
                                }`}
                              >
                                #{idx + 1}
                              </span>
                              <span className={`font-bold text-xs sm:text-sm ${hasSales ? "text-slate-900" : "text-slate-500"}`}>
                                {item.name}
                              </span>
                              {item.category && (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                                  {item.category}
                                </span>
                              )}
                              <span className="text-[10px] text-slate-400 font-medium">
                                ({item.count} {item.count === 1 ? "unit" : "units"})
                              </span>
                            </div>
                            <div className="flex items-center gap-3 sm:justify-end">
                              {item.unitPrice ? (
                                <span className="text-[10px] text-slate-400">
                                  @ Rs. {item.unitPrice.toLocaleString()}/ea
                                </span>
                              ) : null}
                              <span
                                className={`font-mono font-black text-xs sm:text-sm ${
                                  hasSales ? "text-slate-900" : "text-slate-400"
                                }`}
                              >
                                Rs. {item.total.toLocaleString()}
                              </span>
                            </div>
                          </div>
                          <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-500 ${
                                hasSales
                                  ? "bg-gradient-to-r from-emerald-600 to-teal-500"
                                  : "bg-slate-300"
                              }`}
                              style={{
                                width: `${Math.max(hasSales ? 3 : 0, Math.min(100, percentage))}%`,
                              }}
                            />
                          </div>
                        </div>
                      );
                    })}

                    {medicineList.length === 0 && (
                      <p className="text-xs text-slate-400 text-center py-6 bg-white rounded-xl border border-dashed border-slate-200">
                        No dispensary medicines sold for this date.
                      </p>
                    )}

                    {medicineList.length > 3 && (
                      <button
                        type="button"
                        onClick={() => setShowAllMedicines(!showAllMedicines)}
                        className="w-full py-2 px-3 text-xs font-bold text-emerald-700 hover:text-emerald-900 bg-white hover:bg-emerald-50 rounded-xl border border-emerald-200 transition-all flex items-center justify-center gap-1.5 shadow-2xs"
                      >
                        {showAllMedicines ? (
                          <>
                            <ChevronUp className="w-3.5 h-3.5" />
                            <span>Hide Medicines</span>
                          </>
                        ) : (
                          <>
                            <ChevronDown className="w-3.5 h-3.5" />
                            <span>See More ({medicineList.length - 3} more medicines)</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* SECTION 2: OTHER DIAGNOSTIC & CLINICAL SERVICES */}
              {(breakdownViewFilter === "ALL" || breakdownViewFilter === "SERVICES") && (
                <div className="bg-slate-50/70 border-2 border-purple-100 rounded-2xl p-4 sm:p-5 space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-purple-100">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold shrink-0">
                        <Sparkles className="w-5 h-5 text-purple-600" />
                      </div>
                      <div>
                        <h5 className="text-xs font-black uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
                          <span>Other Services &amp; Invoicing</span>
                          <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-purple-200 text-purple-900">
                            {serviceList.length} procedures
                          </span>
                        </h5>
                        <p className="text-[11px] text-slate-500">
                          {data?.summary?.serviceInvoicesCount || 0} invoice(s) · {data?.summary?.serviceUnitsSold || 0} diagnostic procedure(s) billed
                        </p>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] font-bold uppercase text-slate-400 block">Services Revenue</span>
                      <span className="text-sm font-black font-mono text-purple-700">
                        Rs. {svcSubtotal.toLocaleString()}
                      </span>
                    </div>
                  </div>

                  {/* Services List */}
                  <div className="space-y-3">
                    {displayedServices.map((item: any, idx: number) => {
                      const percentage = maxSvcTotal > 0 ? (item.total / maxSvcTotal) * 100 : 0;
                      const hasSales = item.total > 0;

                      return (
                        <div
                          key={item.medicineId || idx}
                          className="space-y-1.5 p-3 rounded-xl bg-white border border-slate-200/80 hover:border-purple-300 transition-colors shadow-2xs"
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs">
                            <div className="flex items-center gap-2">
                              <span
                                className={`w-5 h-5 rounded-md text-[10px] font-black flex items-center justify-center shrink-0 ${
                                  idx === 0 && hasSales
                                    ? "bg-amber-400 text-slate-950 shadow-xs"
                                    : idx === 1 && hasSales
                                    ? "bg-slate-300 text-slate-900"
                                    : idx === 2 && hasSales
                                    ? "bg-amber-100 text-amber-900"
                                    : "bg-slate-200 text-slate-700"
                                }`}
                              >
                                #{idx + 1}
                              </span>
                              <span className={`font-bold text-xs sm:text-sm ${hasSales ? "text-slate-900" : "text-slate-500"}`}>
                                {item.name}
                              </span>
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-purple-50 text-purple-800 border border-purple-200">
                                {item.category || "Ultrasound"}
                              </span>
                              <span className="text-[10px] text-slate-400 font-medium">
                                ({item.count} {item.count === 1 ? "billed" : "billed"})
                              </span>
                            </div>
                            <div className="flex items-center gap-3 sm:justify-end">
                              {item.unitPrice ? (
                                <span className="text-[10px] text-slate-400">
                                  @ Rs. {item.unitPrice.toLocaleString()}/ea
                                </span>
                              ) : null}
                              <span
                                className={`font-mono font-black text-xs sm:text-sm ${
                                  hasSales ? "text-slate-900" : "text-slate-400"
                                }`}
                              >
                                Rs. {item.total.toLocaleString()}
                              </span>
                            </div>
                          </div>
                          <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-500 ${
                                hasSales
                                  ? "bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-500"
                                  : "bg-slate-300"
                              }`}
                              style={{
                                width: `${Math.max(hasSales ? 3 : 0, Math.min(100, percentage))}%`,
                              }}
                            />
                          </div>
                        </div>
                      );
                    })}

                    {serviceList.length === 0 && (
                      <p className="text-xs text-slate-400 text-center py-6 bg-white rounded-xl border border-dashed border-slate-200">
                        No ultrasound or other services billed for this date.
                      </p>
                    )}

                    {serviceList.length > 3 && (
                      <button
                        type="button"
                        onClick={() => setShowAllServices(!showAllServices)}
                        className="w-full py-2 px-3 text-xs font-bold text-purple-700 hover:text-purple-900 bg-white hover:bg-purple-50 rounded-xl border border-purple-200 transition-all flex items-center justify-center gap-1.5 shadow-2xs"
                      >
                        {showAllServices ? (
                          <>
                            <ChevronUp className="w-3.5 h-3.5" />
                            <span>Hide Services</span>
                          </>
                        ) : (
                          <>
                            <ChevronDown className="w-3.5 h-3.5" />
                            <span>See More ({serviceList.length - 3} more services)</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })()}

        {/* Total Summary Footer */}
        <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-bold text-slate-600">
          <div className="flex flex-wrap items-center gap-2 text-[11px]">
            <span className="uppercase tracking-wider text-slate-400">Segregated Subtotals:</span>
            <span className="px-2.5 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-lg font-mono">
              Medicines: Rs. {(data?.summary?.medicineRevenue || 0).toLocaleString()}
            </span>
            <span className="px-2.5 py-1 bg-purple-50 text-purple-800 border border-purple-200 rounded-lg font-mono">
              Other Services: Rs. {(data?.summary?.serviceRevenue || 0).toLocaleString()}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="uppercase tracking-wider text-[11px] text-slate-500">
              Total Expected System Cash:
            </span>
            <span className="text-lg font-black text-slate-900 font-mono">
              Rs. {systemCash.toLocaleString()}
            </span>
          </div>
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
            className="w-full py-4 px-6 rounded-2xl font-black text-sm flex items-center justify-center gap-2 shadow-xl transition-all bg-gradient-to-r from-emerald-600 via-teal-600 to-blue-600 hover:from-emerald-700 hover:to-teal-850 text-white shadow-emerald-500/25 active:scale-[0.99]"
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
            className="px-3.5 py-1.5 text-xs font-bold text-emerald-700 hover:text-emerald-900 bg-emerald-50 hover:bg-emerald-100 rounded-xl border border-emerald-200 transition-all flex items-center gap-1.5 shadow-2xs"
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
                  <th className="px-5 py-3.5">Pharmacist</th>
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
                        {c.user?.name || "Pharmacist"}
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
                              receptionistName: c.user?.name || "Pharmacist",
                              receptionistEmail: c.user?.email,
                              totalSystemCash: c.totalSystemCash,
                              countedCash: c.countedCash,
                              variance: c.variance,
                              notes: c.notes,
                              status: c.status,
                              closedAt: c.updatedAt || c.createdAt,
                              portal: "PHARMACY",
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
              className="text-xs font-bold text-emerald-700 hover:text-emerald-900 inline-flex items-center justify-center gap-1.5 py-1 px-3 rounded-lg hover:bg-emerald-50 transition-colors"
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
        portal="PHARMACY"
      />

      {/* Submit Shift Cash Modal */}
      <SubmitShiftCashModal
        isOpen={submitModalOpen}
        onClose={() => setSubmitModalOpen(false)}
        onSuccess={() => {
          fetchShiftData(selectedDate);
          setSuccessMessage(
            "Pharmacy shift cash submitted successfully! Awaiting Administrator review and approval."
          );
        }}
        shiftDate={selectedDate}
        systemCash={systemCash}
        initialCash={data?.activeClosing?.countedCash}
        initialNotes={data?.activeClosing?.notes}
        isExistingSubmission={Boolean(data?.activeClosing)}
        portal="PHARMACY"
      />
    </div>
  );
}


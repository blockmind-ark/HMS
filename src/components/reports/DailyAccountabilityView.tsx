"use client";

import React, { useState, useEffect } from "react";
import {
  Calendar,
  CreditCard,
  Package,
  TrendingUp,
  RefreshCw,
  Printer,
  Receipt,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  Search,
  ArrowRight,
  Clock,
  User,
  Banknote,
  Download,
} from "lucide-react";
import {
  DailyClosingReportModal,
  DailySummaryData,
} from "./DailyClosingReportModal";
import { AddExpenditureModal } from "@/components/modals/AddExpenditureModal";
import {
  ShiftClosingVoucherModal,
  ShiftClosingData,
} from "@/components/modals/ShiftClosingVoucherModal";

interface DailyAccountabilityViewProps {
  portalType: "RECEPTIONIST" | "PHARMACIST";
}

export function DailyAccountabilityView({
  portalType,
}: DailyAccountabilityViewProps) {
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [loading, setLoading] = useState(false);
  const [summaryData, setSummaryData] = useState<any | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [showExpenditureModal, setShowExpenditureModal] = useState(false);
  const [actualCash, setActualCash] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [submittingClosing, setSubmittingClosing] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [voucherModalOpen, setVoucherModalOpen] = useState(false);
  const [selectedVoucherData, setSelectedVoucherData] =
    useState<ShiftClosingData | null>(null);

  const fetchDailySummary = async (dateStr: string) => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const endpoint =
        portalType === "RECEPTIONIST"
          ? `/api/receptionist/daily-summary?date=${dateStr}`
          : `/api/pharmacist/daily-summary?date=${dateStr}`;

      const res = await fetch(endpoint);
      if (res.ok) {
        const data = await res.json();
        setSummaryData(data);
        if (data.activeClosing) {
          setActualCash(String(data.activeClosing.countedCash));
          setNotes(data.activeClosing.notes || "");
        } else {
          setNotes("");
        }
      }
    } catch (err: any) {
      console.error("Failed to load daily summary:", err);
      setErrorMessage(err?.message || "Failed to load daily summary.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDailySummary(selectedDate);
  }, [selectedDate, portalType]);

  const handleSelectQuickDate = (mode: "today" | "yesterday") => {
    const d = new Date();
    if (mode === "yesterday") {
      d.setDate(d.getDate() - 1);
    }
    const iso = d.toISOString().split("T")[0];
    setSelectedDate(iso);
  };

  const itemizedSales = summaryData?.itemizedSales || [];
  const filteredItems = itemizedSales.filter((item: any) =>
    (item.description || item.medicineName || "")
      .toLowerCase()
      .includes(searchTerm.toLowerCase())
  );

  const totalRevenue = summaryData?.summary?.totalRevenue || 0;
  const totalItemsSold =
    summaryData?.summary?.totalItemsSold ||
    summaryData?.summary?.totalUnitsSold ||
    0;
  const totalTransactions =
    summaryData?.summary?.totalInvoicesCount ||
    summaryData?.summary?.totalSalesCount ||
    0;
  const totalDiscount = summaryData?.summary?.totalDiscount || 0;
  const openingFloat = summaryData?.summary?.openingFloat || 5000;
  const totalExpenditures = summaryData?.summary?.totalExpenditures || 0;
  const expectedCash = Math.max(0, openingFloat + totalRevenue - totalExpenditures);

  const actualCashNum = parseFloat(actualCash) || expectedCash;
  const variance = actualCashNum - expectedCash;

  const activeClosing = summaryData?.activeClosing;
  const activeClosingStatus = activeClosing?.status || "OPEN";
  const isShiftApproved = activeClosingStatus === "APPROVED" || activeClosingStatus === "CLOSED";
  const isShiftPending = activeClosingStatus === "PENDING_APPROVAL";
  const isShiftRejected = activeClosingStatus === "REJECTED";

  const handleCloseShift = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!actualCash || isNaN(Number(actualCash))) {
      setErrorMessage("Please enter a valid counted physical cash amount.");
      return;
    }

    setSubmittingClosing(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const endpoint =
        portalType === "RECEPTIONIST"
          ? "/api/receptionist/accountability/close"
          : "/api/pharmacist/accountability/close";

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          shiftDate: selectedDate,
          countedCash: parseFloat(actualCash),
          notes,
        }),
      });

      const result = await res.json();
      if (res.ok) {
        setSuccessMessage(
          "Shift close sheet submitted successfully! Status is PENDING_APPROVAL awaiting Admin review & commit."
        );
        fetchDailySummary(selectedDate);

        // Prepopulate voucher data without auto-opening print modal
        setSelectedVoucherData({
          id: result.closing.id,
          shiftDate: result.closing.shiftDate,
          receptionistName: summaryData?.staffName || "Staff",
          receptionistEmail: summaryData?.staffEmail,
          totalSystemCash: result.closing.totalSystemCash,
          countedCash: result.closing.countedCash,
          variance: result.closing.variance,
          notes: result.closing.notes,
          status: result.closing.status,
          portal: result.closing.portal || (portalType === "RECEPTIONIST" ? "RECEPTION" : "PHARMACY"),
          closedAt: result.closing.updatedAt || result.closing.createdAt,
          summary: {
            totalRevenue,
            totalDiscount,
            openingFloat,
          },
        });
      } else {
        setErrorMessage(result.error || "Failed to submit shift close sheet.");
      }
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || "Failed to submit shift accountability.");
    } finally {
      setSubmittingClosing(false);
    }
  };

  const openPreview = (closingObj?: any) => {
    const c = closingObj || activeClosing;
    if (c) {
      setSelectedVoucherData({
        id: c.id,
        shiftDate: c.shiftDate,
        receptionistName: c.user?.name || summaryData?.staffName || "Staff",
        receptionistEmail: c.user?.email || summaryData?.staffEmail,
        totalSystemCash: c.totalSystemCash,
        countedCash: c.countedCash,
        variance: c.variance,
        notes: c.notes,
        status: c.status,
        portal: c.portal || (portalType === "RECEPTIONIST" ? "RECEPTION" : "PHARMACY"),
        closedAt: c.updatedAt || c.createdAt,
        summary: {
          totalRevenue,
          totalDiscount,
          openingFloat,
        },
      });
      setVoucherModalOpen(true);
    } else {
      setSelectedVoucherData({
        id: "DRAFT-" + Date.now().toString().slice(-6),
        shiftDate: selectedDate,
        receptionistName: summaryData?.staffName || "Staff",
        totalSystemCash: expectedCash,
        countedCash: actualCashNum,
        variance: variance,
        notes: notes,
        status: "DRAFT_PREVIEW",
        portal: portalType === "RECEPTIONIST" ? "RECEPTION" : "PHARMACY",
        closedAt: new Date(),
        summary: {
          totalRevenue,
          totalDiscount,
          openingFloat,
        },
      });
      setVoucherModalOpen(true);
    }
  };

  // Format modal data
  const modalData: DailySummaryData | null = summaryData
    ? {
        portalType,
        date: selectedDate,
        staffName: summaryData.staffName,
        staffRole: summaryData.staffRole,
        totalRevenue,
        totalGrossBilled: summaryData.summary?.totalGrossBilled || totalRevenue,
        totalDiscount,
        totalTransactions,
        totalItemsCount: totalItemsSold,
        openingFloat,
        expectedCashInDrawer: expectedCash,
        itemizedSales: itemizedSales.map((it: any) => ({
          name: it.description || it.medicineName,
          category: it.category || "General",
          quantity: it.quantity || it.unitsSold,
          unitPrice: it.unitPrice,
          totalRevenue: it.totalRevenue,
        })),
        transactions: (summaryData.transactions || []).map((t: any) => ({
          id: t.id,
          number: t.invoiceNumber || t.saleNumber,
          time: t.time,
          patientName: t.patientName,
          patientUid: t.patientUid,
          itemsSummary: t.items
            ? t.items.map((i: any) => `${i.description || i.name} (${i.quantity})`).join(", ")
            : "Sale Items",
          totalAmount: t.totalAmount,
          discount: t.discount,
        })),
      }
    : null;

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* Top Action & Date Bar */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-blue-100 text-blue-800 border border-blue-200">
              Accountability Ledger
            </span>
            <span className="text-xs text-slate-500 font-medium">
              Ruqayya Clinic · {portalType === "RECEPTIONIST" ? "Reception Desk" : "Pharmacy POS"}
            </span>
          </div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight">
            Daily Sales Summary &amp; Shift Reconciliation
          </h2>
          <p className="text-xs text-slate-500">
            Real-time sales audit showing every item/service sold today and exact cash drawer reconciliation.
          </p>
        </div>

        {/* Date Selector & Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs font-semibold">
            <button
              type="button"
              onClick={() => handleSelectQuickDate("today")}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                selectedDate === new Date().toISOString().split("T")[0]
                  ? "bg-white text-blue-700 shadow-sm font-bold"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Today
            </button>
            <button
              type="button"
              onClick={() => handleSelectQuickDate("yesterday")}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                selectedDate !== new Date().toISOString().split("T")[0]
                  ? "bg-white text-blue-700 shadow-sm font-bold"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Yesterday / Past
            </button>
          </div>

          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl">
            <Calendar className="w-4 h-4 text-slate-400" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-transparent text-xs font-bold text-slate-800 focus:outline-none"
            />
          </div>

          <button
            onClick={() => fetchDailySummary(selectedDate)}
            className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors border border-slate-200"
            title="Refresh Ledger"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-blue-600" : ""}`} />
          </button>

          <button
            onClick={() => setShowExpenditureModal(true)}
            className="px-3.5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors border border-rose-200"
          >
            <Receipt className="w-4 h-4 text-rose-600" />
            <span>Cash Out</span>
          </button>

          <button
            onClick={() => openPreview()}
            className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-md transition-all"
          >
            <Printer className="w-4 h-4" />
            <span>Preview Sheet</span>
          </button>
        </div>
      </div>

      {/* Prominent Status Banners */}
      {isShiftPending && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl text-xs text-amber-900 flex items-start justify-between shadow-sm animate-in fade-in">
          <div className="flex items-start gap-2.5">
            <Clock className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5 animate-spin" />
            <div>
              <h5 className="font-extrabold text-sm">
                Shift Close Awaiting Admin Review &amp; Final Commit
              </h5>
              <p className="mt-0.5 text-amber-800">
                Your shift sheet of <strong>Rs. {activeClosing?.countedCash?.toLocaleString()}</strong> has been submitted to the Admin Approvals Center. The shift will be officially locked and committed once reviewed by an Administrator.
              </p>
            </div>
          </div>
          <button
            onClick={() => openPreview(activeClosing)}
            className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold text-xs flex-shrink-0 shadow-sm"
          >
            Preview Sheet
          </button>
        </div>
      )}


      {isShiftRejected && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-900 flex items-start gap-3 shadow-sm animate-in fade-in">
          <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h5 className="font-extrabold text-sm">
              Shift Sheet Returned / Rejected by Admin
            </h5>
            <p className="mt-0.5 text-rose-800">
              <strong>Admin Remarks:</strong> &ldquo;
              {activeClosing?.adminComment || "Please recount cash drawer and rectify variance before resubmitting."}
              &rdquo;
            </p>
            <p className="text-[11px] text-rose-600 mt-1 font-semibold">
              Please re-verify drawer contents below and submit an updated shift close sheet.
            </p>
          </div>
        </div>
      )}

      {/* Action Messages */}
      {successMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs font-bold text-emerald-800 flex items-center justify-between animate-in fade-in">
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
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-xs font-bold text-rose-800 flex items-center justify-between animate-in fade-in">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600" />
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

      {/* 4 Core Summary Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Net Sales */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Total Net Revenue
            </span>
            <h3 className="text-2xl font-black text-slate-900">
              Rs. {totalRevenue.toLocaleString()}
            </h3>
            <p className="text-[11px] text-emerald-600 font-semibold">
              Discounts: Rs. {totalDiscount.toLocaleString()}
            </p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <Banknote className="w-6 h-6" />
          </div>
        </div>

        {/* Total Items Sold */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              {portalType === "RECEPTIONIST" ? "Services Billed" : "Units Dispensed"}
            </span>
            <h3 className="text-2xl font-black text-blue-900">
              {totalItemsSold} <span className="text-xs font-normal text-slate-500">units</span>
            </h3>
            <p className="text-[11px] text-blue-600 font-semibold">
              Across {itemizedSales.length} unique items
            </p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
            <Package className="w-6 h-6" />
          </div>
        </div>

        {/* Transactions / Invoices Count */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Transactions
            </span>
            <h3 className="text-2xl font-black text-slate-900">
              {totalTransactions}
            </h3>
            <p className="text-[11px] text-slate-500 font-medium">
              {portalType === "RECEPTIONIST" ? "Patient Invoices" : "POS Receipts"}
            </p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
            <CreditCard className="w-6 h-6" />
          </div>
        </div>

        {/* Expected Cash Drawer */}
        <div className="bg-white p-5 rounded-3xl border-2 border-indigo-200/80 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[11px] font-black uppercase tracking-wider text-indigo-700">
              Expected in Drawer
            </span>
            <h3 className="text-2xl font-black text-indigo-950">
              Rs. {expectedCash.toLocaleString()}
            </h3>
            <p className="text-[11px] text-indigo-600 font-semibold">
              Float: Rs. {openingFloat.toLocaleString()} + Sales
            </p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
            <ShieldCheck className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Main Grid: Itemized Sales Table (Left 8 Cols) & Shift Cash Accountability (Right 4 Cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: What Was Sold Today Table (8 Cols) */}
        <div className="lg:col-span-8 space-y-4">
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
            {/* Table Header & Search */}
            <div className="p-4 sm:p-5 bg-slate-50/70 border-b border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wide flex items-center gap-2">
                  <Package className="w-4 h-4 text-blue-600" />
                  <span>Itemized Sales &amp; Revenue Breakdown</span>
                </h3>
                <p className="text-xs text-slate-500">
                  Exact item quantities and revenue generated on {selectedDate}
                </p>
              </div>

              <div className="relative w-full sm:w-60">
                <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Filter item name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100/70 text-slate-600 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">#</th>
                    <th className="py-3 px-4">
                      {portalType === "RECEPTIONIST" ? "Service / Procedure" : "Medicine Item"}
                    </th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4 text-center">Units Sold</th>
                    <th className="py-3 px-4 text-right">Unit Price</th>
                    <th className="py-3 px-4 text-right">Total Revenue</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredItems.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-slate-400">
                        <Package className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                        <p className="font-semibold text-xs">No sales recorded for this date.</p>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          Click &ldquo;Yesterday / Past&rdquo; to view historical closing data or bill a new sale.
                        </p>
                      </td>
                    </tr>
                  ) : (
                    filteredItems.map((item: any, idx: number) => {
                      const name = item.description || item.medicineName;
                      const qty = item.quantity || item.unitsSold;
                      const sharePct = totalRevenue > 0 ? Math.round((item.totalRevenue / totalRevenue) * 100) : 0;

                      return (
                        <tr key={idx} className="hover:bg-blue-50/40 transition-colors group">
                          <td className="py-3 px-4 font-mono text-slate-400 text-[11px]">
                            {idx + 1}
                          </td>
                          <td className="py-3 px-4">
                            <span className="font-bold text-slate-900 group-hover:text-blue-700 transition-colors">
                              {name}
                            </span>
                            {item.genericName && (
                              <p className="text-[10px] text-slate-500 font-normal">
                                {item.genericName}
                              </p>
                            )}
                          </td>
                          <td className="py-3 px-4">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                              {item.category || "General"}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-center font-black text-slate-900">
                            {qty}
                          </td>
                          <td className="py-3 px-4 text-right font-mono text-slate-600">
                            Rs. {item.unitPrice.toLocaleString()}
                          </td>
                          <td className="py-3 px-4 text-right">
                            <span className="font-black text-slate-950 font-mono">
                              Rs. {item.totalRevenue.toLocaleString()}
                            </span>
                            <div className="w-16 h-1 bg-slate-100 rounded-full ml-auto mt-1 overflow-hidden">
                              <div
                                className="h-full bg-blue-500 rounded-full"
                                style={{ width: `${Math.min(100, sharePct)}%` }}
                              />
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
                {filteredItems.length > 0 && (
                  <tfoot className="bg-slate-50/90 border-t-2 border-slate-200 font-black text-xs text-slate-900">
                    <tr>
                      <td colSpan={3} className="py-3.5 px-4 uppercase tracking-wider">
                        Total {portalType === "RECEPTIONIST" ? "Services Billed" : "Medicines Dispensed"}
                      </td>
                      <td className="py-3.5 px-4 text-center text-blue-700 font-extrabold text-sm">
                        {totalItemsSold} units
                      </td>
                      <td className="py-3.5 px-4 text-right text-slate-500 font-normal">
                        Total Net Revenue:
                      </td>
                      <td className="py-3.5 px-4 text-right text-emerald-700 font-mono text-sm">
                        Rs. {totalRevenue.toLocaleString()}
                      </td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </div>
        </div>

        {/* Right: Cash Drawer Accountability & Closing Sign-off (4 Cols) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-5 sm:p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-600" />
                <h3 className="text-sm font-extrabold text-slate-900">
                  Register Accountability
                </h3>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-full">
                Active Shift
              </span>
            </div>

            {/* Calculations Breakdown */}
            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Opening Cash Float:</span>
                <span className="font-mono font-bold text-slate-800">
                  Rs. {openingFloat.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Net Sales Collected:</span>
                <span className="font-mono font-bold text-emerald-700">
                  + Rs. {totalRevenue.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Discounts Conceded:</span>
                <span className="font-mono font-bold text-purple-700">
                  - Rs. {totalDiscount.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between py-2 border-b-2 border-slate-200 font-bold">
                <span className="text-indigo-900">Expected Total in Drawer:</span>
                <span className="font-mono text-sm font-black text-indigo-950">
                  Rs. {expectedCash.toLocaleString()}
                </span>
              </div>
            </div>

            {/* Physical Cash Input */}
            <div className="space-y-2 pt-1">
              <label className="block text-xs font-bold text-slate-800">
                Counted Physical Drawer Cash (Rs.):
              </label>
              <input
                type="number"
                placeholder={`e.g. ${expectedCash}`}
                value={actualCash}
                onChange={(e) => setActualCash(e.target.value)}
                className="w-full px-3.5 py-2 text-xs font-mono font-bold bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none text-slate-900"
              />

              {variance === 0 ? (
                <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-bold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Drawer Exactly Balanced (Rs. 0.00 Variance)</span>
                </div>
              ) : variance > 0 ? (
                <div className="p-3 bg-blue-50 border border-blue-200 text-blue-800 rounded-xl text-xs font-bold flex items-center gap-2">
                  <span>Cash Surplus: +Rs. {variance.toLocaleString()}</span>
                </div>
              ) : (
                <div className="p-3 bg-red-50 border border-red-200 text-red-800 rounded-xl text-xs font-bold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                  <span>Cash Shortage: -Rs. {Math.abs(variance).toLocaleString()}</span>
                </div>
              )}
            </div>

            {/* Duty Staff Info */}
            <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 text-xs space-y-1">
              <div className="flex items-center gap-2 text-slate-700">
                <User className="w-4 h-4 text-slate-500" />
                <span className="font-bold text-slate-900">
                  {summaryData?.staffName || (portalType === "RECEPTIONIST" ? "Adnan Ahmed" : "Muhammad Tariq")}
                </span>
              </div>
              <p className="text-[11px] text-slate-500">
                {summaryData?.staffRole || (portalType === "RECEPTIONIST" ? "Reception Desk Officer" : "Pharmacy Dispensary Lead")}
              </p>
            </div>


            {/* Shift Discrepancy / Handover Remarks */}
            <div className="space-y-1.5 pt-1">
              <label className="block text-xs font-bold text-slate-800">
                Discrepancy / Handover Remarks:
              </label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Explain any cash overage/shortage or register handover notes..."
                disabled={isShiftApproved}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none text-slate-800 disabled:opacity-60"
              />
            </div>

            {/* Action Buttons: Submit & Preview */}
            <div className="space-y-2 pt-2">
              <button
                type="button"
                onClick={() => handleCloseShift()}
                disabled={submittingClosing || isShiftApproved}
                className={`w-full py-3 text-white font-bold rounded-xl text-xs shadow-md transition-all flex items-center justify-center gap-2 ${
                  isShiftApproved
                    ? "bg-slate-400 cursor-not-allowed"
                    : "bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99]"
                }`}
              >
                {submittingClosing ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Submitting Shift Close...</span>
                  </>
                ) : isShiftApproved ? (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Shift Approved &amp; Locked</span>
                  </>
                ) : isShiftPending ? (
                  <>
                    <Clock className="w-4 h-4 text-amber-200" />
                    <span>Update &amp; Resubmit Shift Close</span>
                  </>
                ) : isShiftRejected ? (
                  <>
                    <AlertCircle className="w-4 h-4 text-rose-200" />
                    <span>Resubmit Corrected Shift Close</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    <span>Submit Shift Close for Admin Approval</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => openPreview()}
                className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs border border-slate-200 transition-all flex items-center justify-center gap-2"
              >
                <Printer className="w-4 h-4 text-slate-500" />
                <span>Preview Shift Sheet</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Historical Shift Closings Table */}
      {summaryData?.pastClosings && summaryData.pastClosings.length > 0 && (
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wide flex items-center gap-2">
              <Clock className="w-4 h-4 text-indigo-600" />
              <span>Shift Closings Audit History</span>
            </h3>
            <span className="text-xs text-slate-500">
              Recent register submissions &amp; commitments
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-4">Shift Date</th>
                  <th className="py-2.5 px-4">Staff</th>
                  <th className="py-2.5 px-4 text-right">System Expected</th>
                  <th className="py-2.5 px-4 text-right">Counted Cash</th>
                  <th className="py-2.5 px-4 text-right">Variance</th>
                  <th className="py-2.5 px-4 text-center">Status</th>
                  <th className="py-2.5 px-4">Approved By</th>
                  <th className="py-2.5 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {summaryData.pastClosings.map((c: any) => (
                  <tr key={c.id} className="hover:bg-slate-50/50">
                    <td className="py-2.5 px-4 font-mono font-bold text-slate-900">
                      {new Date(c.shiftDate).toLocaleDateString("en-GB", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>
                    <td className="py-2.5 px-4 font-medium text-slate-700">
                      {c.user?.name || "Staff"}
                    </td>
                    <td className="py-2.5 px-4 text-right font-mono text-slate-700">
                      Rs. {c.totalSystemCash.toLocaleString()}
                    </td>
                    <td className="py-2.5 px-4 text-right font-mono font-bold text-blue-700">
                      Rs. {c.countedCash.toLocaleString()}
                    </td>
                    <td className="py-2.5 px-4 text-right font-mono">
                      {c.variance === 0 ? (
                        <span className="text-emerald-600 font-bold">Rs. 0</span>
                      ) : c.variance < 0 ? (
                        <span className="text-rose-600 font-bold">
                          -Rs. {Math.abs(c.variance).toLocaleString()}
                        </span>
                      ) : (
                        <span className="text-amber-600 font-bold">
                          +Rs. {c.variance.toLocaleString()}
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 px-4 text-center">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                          c.status === "APPROVED" || c.status === "CLOSED"
                            ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                            : c.status === "PENDING_APPROVAL"
                            ? "bg-amber-100 text-amber-800 border border-amber-200"
                            : "bg-rose-100 text-rose-800 border border-rose-200"
                        }`}
                      >
                        {c.status}
                      </span>
                    </td>
                    <td className="py-2.5 px-4 text-slate-600 text-[11px]">
                      {c.approvedBy?.name || "—"}
                    </td>
                    <td className="py-2.5 px-4 text-right">
                      <button
                        onClick={() => openPreview(c)}
                        className="px-2.5 py-1 text-xs font-bold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors border border-slate-200"
                      >
                        Preview
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Daily Shift Closing Modal */}
      <DailyClosingReportModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        data={modalData}
      />

      {/* Official Shift Closing Voucher Modal */}
      <ShiftClosingVoucherModal
        isOpen={voucherModalOpen}
        onClose={() => setVoucherModalOpen(false)}
        closing={selectedVoucherData}
      />

      {/* Add Expenditure Modal for Pharmacy */}
      <AddExpenditureModal
        isOpen={showExpenditureModal}
        onClose={() => setShowExpenditureModal(false)}
        onSuccess={() => fetchDailySummary(selectedDate)}
        portal="PHARMACY"
      />
    </div>
  );
}


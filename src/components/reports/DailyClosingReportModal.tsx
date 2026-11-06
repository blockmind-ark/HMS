"use client";

import React, { useState } from "react";
import {
  Printer,
  X,
  FileSpreadsheet,
  CheckCircle2,
  Calendar,
  Banknote,
  Package,
  Layers,
  User,
  Clock,
  ShieldCheck,
  TrendingUp,
  Receipt,
  Download,
} from "lucide-react";

export interface ItemizedSaleRow {
  name: string;
  category?: string;
  quantity: number;
  unitPrice: number;
  totalRevenue: number;
}

export interface DailySummaryData {
  portalType: "RECEPTIONIST" | "PHARMACIST";
  date: string;
  staffName: string;
  staffRole: string;
  totalRevenue: number;
  totalGrossBilled: number;
  totalDiscount: number;
  totalTransactions: number;
  totalItemsCount: number;
  openingFloat: number;
  expectedCashInDrawer: number;
  itemizedSales: ItemizedSaleRow[];
  transactions: Array<{
    id: string;
    number: string;
    time: string | Date;
    patientName: string;
    patientUid: string;
    itemsSummary: string;
    totalAmount: number;
    discount?: number;
  }>;
}

export function DailyClosingReportModal({
  isOpen,
  onClose,
  data,
}: {
  isOpen: boolean;
  onClose: () => void;
  data: DailySummaryData | null;
}) {
  const [actualCashInput, setActualCashInput] = useState<string>("");
  const [closingNotes, setClosingNotes] = useState<string>("");

  if (!isOpen || !data) return null;

  const actualCash = parseFloat(actualCashInput) || data.expectedCashInDrawer;
  const variance = actualCash - data.expectedCashInDrawer;

  const handlePrint = () => {
    window.print();
  };

  const handleExportCSV = () => {
    const headers = ["Item Name", "Category", "Quantity Sold", "Unit Price (Rs)", "Total Revenue (Rs)"];
    const rows = data.itemizedSales.map((item) => [
      `"${item.name.replace(/"/g, '""')}"`,
      `"${item.category || "General"}"`,
      item.quantity,
      item.unitPrice,
      item.totalRevenue,
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [`Ruqayya CLINIC & PHARMACY - DAILY CLOSING REPORT (${data.date})`,
       `Staff: ${data.staffName} (${data.staffRole})`,
       `Total Sales Revenue: Rs. ${data.totalRevenue}`,
       `Total Items Sold: ${data.totalItemsCount}`,
       `Total Transactions: ${data.totalTransactions}`,
       "",
       headers.join(","),
       ...rows.map((r) => r.join(",")),
      ].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `daily-closing-summary-${data.portalType.toLowerCase()}-${data.date}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formattedDate = new Date(data.date).toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/60 backdrop-blur-sm print:p-0 print:bg-white print:static">
      <div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full max-h-[92vh] flex flex-col overflow-hidden border border-slate-200 print:shadow-none print:border-none print:max-w-none print:w-full print:max-h-none">
        {/* Modal Controls - Hidden during print */}
        <div className="p-4 bg-slate-900 text-white flex items-center justify-between shrink-0 print:hidden">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center border border-blue-400/30">
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold tracking-tight">
                Daily Sales &amp; Cash Accountability Preview
              </h3>
              <p className="text-[11px] text-slate-400">
                Ruqayya Clinic &amp; Pharmacy · {data.portalType === "RECEPTIONIST" ? "Reception Billing Desk" : "Dispensary POS"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportCSV}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors border border-slate-700 text-slate-200"
              title="Export as CSV spreadsheet"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Export CSV</span>
            </button>
            <button
              onClick={handlePrint}
              className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors shadow-md text-white"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Official Sheet</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-slate-800 rounded-xl text-slate-400 hover:text-white transition-colors ml-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Scrollable Document Area (Printable) */}
        <div className="p-6 sm:p-8 overflow-y-auto space-y-6 print:p-4 print:overflow-visible text-slate-800">
          {/* Official Clinic Document Header */}
          <div className="border-b-2 border-slate-900 pb-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <span className="text-[10px] font-black uppercase tracking-widest text-blue-700 bg-blue-50 px-2.5 py-1 rounded-md border border-blue-200">
                Official Shift Closing Ledger
              </span>
              <h1 className="text-xl sm:text-2xl font-black text-slate-950 mt-1.5">
                Ruqayya CLINIC &amp; PHARMACY
              </h1>
              <p className="text-xs text-slate-500">
                Main Boulevard, G.T. Road, Lahore · Tel: +92 (42) 3589-1122
              </p>
            </div>

            <div className="sm:text-right space-y-0.5 text-xs text-slate-600">
              <div className="flex sm:justify-end items-center gap-1.5 font-bold text-slate-900">
                <Calendar className="w-3.5 h-3.5 text-blue-600" />
                <span>{formattedDate}</span>
              </div>
              <p>Duty Officer: <strong className="text-slate-900">{data.staffName}</strong></p>
              <p className="text-[11px] text-slate-500">Department: {data.staffRole}</p>
            </div>
          </div>

          {/* 4 Core Accountability KPI Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 print:grid-cols-4">
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                Total Net Sales
              </span>
              <p className="text-xl font-black text-slate-900">
                Rs. {data.totalRevenue.toLocaleString()}
              </p>
              <p className="text-[10px] text-emerald-600 font-semibold">
                Gross: Rs. {data.totalGrossBilled.toLocaleString()}
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-blue-50/70 border border-blue-200/80 space-y-1">
              <span className="text-[10px] uppercase font-bold text-blue-700 tracking-wider">
                Total Items Sold
              </span>
              <p className="text-xl font-black text-blue-950">
                {data.totalItemsCount} <span className="text-xs font-normal text-blue-700">units</span>
              </p>
              <p className="text-[10px] text-blue-600 font-medium">
                {data.itemizedSales.length} unique items
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                Total Transactions
              </span>
              <p className="text-xl font-black text-slate-900">
                {data.totalTransactions}
              </p>
              <p className="text-[10px] text-slate-500 font-medium">
                {data.portalType === "RECEPTIONIST" ? "Patient Invoices" : "POS Receipts"}
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-purple-50/70 border border-purple-200/80 space-y-1">
              <span className="text-[10px] uppercase font-bold text-purple-700 tracking-wider">
                Total Discounts
              </span>
              <p className="text-xl font-black text-purple-950">
                Rs. {data.totalDiscount.toLocaleString()}
              </p>
              <p className="text-[10px] text-purple-600 font-medium">
                Authorized concessions
              </p>
            </div>
          </div>

          {/* Core Table: Itemized Breakdown of What Was Sold Today */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Package className="w-4 h-4 text-blue-600" />
                <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wide">
                  Itemized Sales &amp; Dispensation Breakdown
                </h3>
              </div>
              <span className="text-xs font-semibold text-slate-500">
                {data.itemizedSales.length} item lines recorded
              </span>
            </div>

            <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-100/80 text-slate-700 border-b border-slate-200 font-bold uppercase text-[11px] tracking-wider">
                  <tr>
                    <th className="py-3 px-3.5 sm:px-4">#</th>
                    <th className="py-3 px-3.5 sm:px-4">
                      {data.portalType === "RECEPTIONIST" ? "Service / Procedure Description" : "Medicine & Formulation"}
                    </th>
                    <th className="py-3 px-3.5 sm:px-4">Category</th>
                    <th className="py-3 px-3.5 sm:px-4 text-center">Qty / Units Sold</th>
                    <th className="py-3 px-3.5 sm:px-4 text-right">Unit Price</th>
                    <th className="py-3 px-3.5 sm:px-4 text-right">Total Revenue</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {data.itemizedSales.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-10 text-center text-slate-400 font-medium">
                        No items or services sold on this date.
                      </td>
                    </tr>
                  ) : (
                    data.itemizedSales.map((item, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-3.5 sm:px-4 text-slate-400 font-mono text-xs">
                          {idx + 1}
                        </td>
                        <td className="py-3 px-3.5 sm:px-4 font-bold text-slate-900">
                          {item.name}
                        </td>
                        <td className="py-3 px-3.5 sm:px-4">
                          <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                            {item.category || "General"}
                          </span>
                        </td>
                        <td className="py-3 px-3.5 sm:px-4 text-center font-bold text-slate-900">
                          {item.quantity}
                        </td>
                        <td className="py-3 px-3.5 sm:px-4 text-right font-mono text-slate-600">
                          Rs. {item.unitPrice.toLocaleString()}
                        </td>
                        <td className="py-3 px-3.5 sm:px-4 text-right font-black text-slate-900 font-mono">
                          Rs. {item.totalRevenue.toLocaleString()}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
                <tfoot className="bg-slate-50 border-t-2 border-slate-300 font-black text-sm text-slate-900">
                  <tr>
                    <td colSpan={3} className="py-3.5 px-3.5 sm:px-4 uppercase tracking-wider">
                      Total Summary
                    </td>
                    <td className="py-3.5 px-3.5 sm:px-4 text-center text-blue-700">
                      {data.totalItemsCount} units
                    </td>
                    <td className="py-3.5 px-3.5 sm:px-4 text-right text-slate-500 font-normal">
                      Net Total:
                    </td>
                    <td className="py-3.5 px-3.5 sm:px-4 text-right text-emerald-700 font-mono text-base">
                      Rs. {data.totalRevenue.toLocaleString()}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Cash Drawer Reconciliation & Accountability Box */}
          <div className="bg-gradient-to-br from-slate-50 to-indigo-50/30 border border-slate-200 rounded-3xl p-5 sm:p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200/80 pb-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-600" />
                <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wide">
                  Cash Register Drawer Reconciliation
                </h3>
              </div>
              <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                Shift End Audit
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs space-y-1">
                <span className="text-[10px] text-slate-500 uppercase font-bold">
                  Opening Cash Float
                </span>
                <p className="text-base font-bold text-slate-800 font-mono">
                  Rs. {data.openingFloat.toLocaleString()}
                </p>
                <p className="text-[10px] text-slate-400">Fixed shift start balance</p>
              </div>

              <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs space-y-1">
                <span className="text-[10px] text-slate-500 uppercase font-bold">
                  Total Cash Collected Today
                </span>
                <p className="text-base font-bold text-emerald-700 font-mono">
                  + Rs. {data.totalRevenue.toLocaleString()}
                </p>
                <p className="text-[10px] text-slate-400">Net after Rs. {data.totalDiscount} discount</p>
              </div>

              <div className="p-3 bg-white rounded-xl border-2 border-indigo-200 shadow-2xs space-y-1">
                <span className="text-[10px] text-indigo-700 uppercase font-black">
                  Expected Cash In Drawer
                </span>
                <p className="text-lg font-black text-indigo-950 font-mono">
                  Rs. {data.expectedCashInDrawer.toLocaleString()}
                </p>
                <p className="text-[10px] text-indigo-600 font-semibold">Float + Cash Sales</p>
              </div>
            </div>

            {/* Interactive Physical Cash Input (Disabled in print) */}
            <div className="pt-2 grid grid-cols-1 sm:grid-cols-2 gap-4 print:hidden">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700">
                  Actual Physical Cash Counted in Drawer (Rs.):
                </label>
                <input
                  type="number"
                  placeholder={`e.g. ${data.expectedCashInDrawer}`}
                  value={actualCashInput}
                  onChange={(e) => setActualCashInput(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs font-mono font-bold bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div className="flex flex-col justify-end">
                {variance === 0 ? (
                  <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Drawer Exactly Balanced (Rs. 0.00 Variance)</span>
                  </div>
                ) : variance > 0 ? (
                  <div className="p-2.5 rounded-xl bg-blue-50 border border-blue-200 text-blue-800 text-xs font-bold flex items-center gap-2">
                    <span>Cash Surplus: +Rs. {variance.toLocaleString()}</span>
                  </div>
                ) : (
                  <div className="p-2.5 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs font-bold flex items-center gap-2">
                    <span>Cash Shortage: -Rs. {Math.abs(variance).toLocaleString()}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Shift Sign-off Section */}
            <div className="pt-6 border-t border-slate-200 grid grid-cols-2 gap-8 text-xs text-slate-600">
              <div className="space-y-6">
                <p>Prepared &amp; Reconciled By:</p>
                <div className="border-b border-slate-400 w-48"></div>
                <p className="font-bold text-slate-900">{data.staffName}</p>
              </div>

              <div className="space-y-6 sm:text-right">
                <p className="sm:text-right">Clinic Manager Verification:</p>
                <div className="border-b border-slate-400 w-48 sm:ml-auto"></div>
                <p className="font-bold text-slate-900">Abu Bakar (Administrator)</p>
              </div>
            </div>

            {/* Powered by BlockMindArk */}
            <div className="pt-4 text-center border-t border-dashed border-slate-300 mt-4">
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-800">
                Powered by BlockMindArk
              </p>
            </div>
          </div>
        </div>

        {/* Modal Footer Controls */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0 print:hidden">
          <p className="text-[11px] text-slate-500">
            Audit timestamp: {new Date().toLocaleTimeString()} · Ruqayya Clinic POS v1.0
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-sm transition-all"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Official Sheet</span>
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold rounded-xl text-xs transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}


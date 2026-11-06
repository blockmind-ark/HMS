"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  X,
  Download,
  Eye,
  RefreshCw,
  Calendar,
  Stethoscope,
  Receipt,
  Pill,
  Package,
  History,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  FileText,
  Search,
} from "lucide-react";

export type ReportType = "visits" | "invoices" | "sales" | "inventory" | "audit" | "daily";

interface ReportPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialType: ReportType;
  initialDate?: string;
  initialSearch?: string;
}

const REPORT_TABS: { id: ReportType; label: string; icon: any; color: string }[] = [
  { id: "visits", label: "Clinical Visits", icon: Stethoscope, color: "text-blue-600 bg-blue-50 border-blue-200" },
  { id: "invoices", label: "Hospital Invoices", icon: Receipt, color: "text-emerald-600 bg-emerald-50 border-emerald-200" },
  { id: "sales", label: "Pharmacy Sales", icon: Pill, color: "text-amber-600 bg-amber-50 border-amber-200" },
  { id: "inventory", label: "Stock Inventory", icon: Package, color: "text-slate-800 bg-slate-100 border-slate-300" },
  { id: "audit", label: "Security Audit", icon: History, color: "text-purple-600 bg-purple-50 border-purple-200" },
  { id: "daily", label: "Daily Reconciliation", icon: Calendar, color: "text-rose-600 bg-rose-50 border-rose-200" },
];

export function ReportPreviewModal({
  isOpen,
  onClose,
  initialType,
  initialDate = new Date().toISOString().split("T")[0],
  initialSearch = "",
}: ReportPreviewModalProps) {
  const [selectedType, setSelectedType] = useState<ReportType>(initialType);
  const [targetDate, setTargetDate] = useState<string>(initialDate);
  const [searchQuery, setSearchQuery] = useState<string>(initialSearch);
  const [debouncedSearch, setDebouncedSearch] = useState<string>(initialSearch);
  const [loading, setLoading] = useState<boolean>(true);
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setSelectedType(initialType);
      setTargetDate(initialDate);
      setSearchQuery(initialSearch || "");
      setDebouncedSearch(initialSearch || "");
    }
  }, [isOpen, initialType, initialDate, initialSearch]);

  // Debounce search input to avoid spamming the preview endpoint
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 280);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const fetchPreview = async (type: ReportType, date: string, search: string = "") => {
    setLoading(true);
    setError(null);
    try {
      const searchParam = search.trim() ? `&search=${encodeURIComponent(search.trim())}` : "";
      const dateParam = type === "daily" ? `&date=${date}` : "";
      const url = `/api/admin/reports/preview?type=${type}${dateParam}${searchParam}`;
      const res = await fetch(url);
      if (!res.ok) {
        throw new Error(`Failed to load preview for ${type}`);
      }
      const json = await res.json();
      setData(json);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to generate report preview.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchPreview(selectedType, targetDate, debouncedSearch);
    }
  }, [isOpen, selectedType, targetDate, debouncedSearch]);

  // Client-side instant filter on currently loaded rows as user types
  const filteredRecords = useMemo(() => {
    if (!data?.records) return [];
    if (!searchQuery.trim()) return data.records;
    const q = searchQuery.toLowerCase().trim();
    return data.records.filter((row: any) => {
      return (
        (row.col1 && String(row.col1).toLowerCase().includes(q)) ||
        (row.col2 && String(row.col2).toLowerCase().includes(q)) ||
        (row.col3 && String(row.col3).toLowerCase().includes(q)) ||
        (row.col4 && String(row.col4).toLowerCase().includes(q)) ||
        (row.col5 && String(row.col5).toLowerCase().includes(q)) ||
        (row.col6 && String(row.col6).toLowerCase().includes(q)) ||
        (row.col7 && String(row.col7).toLowerCase().includes(q)) ||
        (row.col8 && String(row.col8).toLowerCase().includes(q))
      );
    });
  }, [data?.records, searchQuery]);

  if (!isOpen) return null;

  const currentTabConfig = REPORT_TABS.find((t) => t.id === selectedType) || REPORT_TABS[0];
  const TabIcon = currentTabConfig.icon;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/70 backdrop-blur-sm animate-in fade-in duration-200 overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl max-w-5xl w-full max-h-[92vh] flex flex-col overflow-hidden border border-slate-200 animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-5 sm:p-6 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-purple-600/30 border border-purple-500/40 text-purple-400 flex items-center justify-center font-bold">
              <TabIcon className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black tracking-tight text-white">
                  {data?.meta?.title || currentTabConfig.label}
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black tracking-wider uppercase bg-purple-500/20 text-purple-300 border border-purple-500/30">
                  Preview Summary
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">
                {data?.meta?.description || "Audited immutable records generated by Ruqayya Clinic Enterprise System."}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => fetchPreview(selectedType, targetDate)}
              title="Refresh Data"
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-purple-400" : ""}`} />
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Switcher Pills */}
        <div className="bg-slate-50 border-b border-slate-200 px-4 py-2.5 overflow-x-auto scrollbar-none flex items-center gap-2">
          {REPORT_TABS.map((tab) => {
            const Icon = tab.icon;
            const isSelected = selectedType === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setSelectedType(tab.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all whitespace-nowrap ${
                  isSelected
                    ? "bg-purple-600 text-white shadow-sm shadow-purple-600/20"
                    : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-100"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6 flex-1">
          {/* Target Date Picker (Only for Daily Reconciliation) */}
          {selectedType === "daily" && (
            <div className="p-4 bg-rose-50/70 border border-rose-200 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-rose-600" />
                <div>
                  <h4 className="text-xs font-bold text-rose-950">
                    Reconciliation Target Date
                  </h4>
                  <p className="text-[11px] text-rose-700">
                    Showing comparative audit between Clinical and Pharmacy portals for this date.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="date"
                  value={targetDate}
                  onChange={(e) => setTargetDate(e.target.value)}
                  className="bg-white border border-rose-200 rounded-xl px-3 py-1.5 text-xs font-bold text-rose-950 focus:outline-none shadow-sm"
                />
                <button
                  onClick={() => setTargetDate(new Date().toISOString().split("T")[0])}
                  className="px-2.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-colors"
                >
                  Today
                </button>
              </div>
            </div>
          )}

          {loading ? (
            <div className="py-20 text-center space-y-3">
              <RefreshCw className="w-8 h-8 text-purple-600 animate-spin mx-auto" />
              <p className="text-xs text-slate-500 font-medium">
                Generating live preview summary for {currentTabConfig.label}...
              </p>
            </div>
          ) : error ? (
            <div className="p-6 bg-red-50 border border-red-200 rounded-2xl text-center space-y-2">
              <AlertCircle className="w-8 h-8 text-red-600 mx-auto" />
              <p className="text-xs font-bold text-red-900">{error}</p>
              <button
                onClick={() => fetchPreview(selectedType, targetDate)}
                className="px-3 py-1 bg-red-600 text-white rounded-lg text-xs font-semibold"
              >
                Retry
              </button>
            </div>
          ) : data ? (
            <>
              {/* 4 Summary KPI Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                {data.summaryCards?.map((card: any, idx: number) => {
                  const colorMap: Record<string, { bg: string; text: string; border: string }> = {
                    purple: { bg: "bg-purple-50", text: "text-purple-700", border: "border-purple-200" },
                    blue: { bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200" },
                    emerald: { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200" },
                    amber: { bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200" },
                    rose: { bg: "bg-rose-50", text: "text-rose-700", border: "border-rose-200" },
                    slate: { bg: "bg-slate-100", text: "text-slate-700", border: "border-slate-200" },
                  };
                  const colors = colorMap[card.color] || colorMap.purple;

                  return (
                    <div
                      key={idx}
                      className={`p-4 rounded-2xl border ${colors.border} ${colors.bg} space-y-1`}
                    >
                      <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                        {card.label}
                      </p>
                      <h4 className={`text-xl sm:text-2xl font-black ${colors.text}`}>
                        {card.value}
                      </h4>
                      <p className="text-[10px] text-slate-500 font-medium">
                        {card.helper}
                      </p>
                    </div>
                  );
                })}
              </div>

              {/* Records Preview Table */}
              <div className="space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                      <Eye className="w-4 h-4 text-purple-600" />
                      <span>
                        Audited Records Preview ({filteredRecords.length}
                        {searchQuery ? ` matching of ${data.records?.length || 0}` : " recent entries"})
                      </span>
                    </h4>
                    {searchQuery && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800 border border-purple-200">
                        Search Active
                      </span>
                    )}
                  </div>

                  {/* Direct Search Field (Patient Search for Visits / General Search) */}
                  <div className="relative w-full sm:w-80">
                    <Search className="w-3.5 h-3.5 absolute inset-y-0 left-2.5 my-auto text-slate-400" />
                    <input
                      type="text"
                      placeholder={
                        selectedType === "visits"
                          ? "Direct search patient (Name, UID, Phone)..."
                          : "Direct search records in preview..."
                      }
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-8 pr-7 py-1.5 text-xs bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all shadow-xs"
                    />
                    {searchQuery && (
                      <button
                        type="button"
                        onClick={() => setSearchQuery("")}
                        className="absolute inset-y-0 right-2 my-auto text-slate-400 hover:text-slate-600 p-0.5"
                        title="Clear Search"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                  <div className="overflow-x-auto max-h-80 scrollbar-thin">
                    <table className="w-full text-left text-xs text-slate-700">
                      <thead className="bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-200 sticky top-0 z-10 shadow-sm">
                        <tr>
                          {data.columns?.map((col: string, i: number) => (
                            <th key={i} className="px-4 py-3 whitespace-nowrap">
                              {col}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-normal">
                        {filteredRecords.map((row: any, rIdx: number) => (
                          <tr key={row.id || rIdx} className="hover:bg-slate-50/80 transition-colors">
                            <td className="px-4 py-3 font-mono text-slate-500 whitespace-nowrap">
                              {row.col1}
                            </td>
                            {row.col2 !== undefined && (
                              <td className="px-4 py-3 font-medium whitespace-nowrap">
                                {row.col2}
                              </td>
                            )}
                            {row.col3 !== undefined && (
                              <td className="px-4 py-3 font-bold text-slate-900 whitespace-nowrap">
                                {row.col3}
                              </td>
                            )}
                            {row.col4 !== undefined && (
                              <td className="px-4 py-3 text-slate-700 whitespace-nowrap">
                                {row.col4}
                              </td>
                            )}
                            {row.col5 !== undefined && (
                              <td className="px-4 py-3 text-slate-800 max-w-xs truncate" title={row.col5}>
                                {row.col5}
                              </td>
                            )}
                            {row.col6 !== undefined && (
                              <td className="px-4 py-3 font-medium text-emerald-600 whitespace-nowrap">
                                {row.col6}
                              </td>
                            )}
                            {row.col7 !== undefined && (
                              <td className="px-4 py-3 whitespace-nowrap">
                                {row.badgeColor ? (
                                  <span
                                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                                      row.badgeColor === "emerald"
                                        ? "bg-emerald-100 text-emerald-700"
                                        : row.badgeColor === "amber"
                                        ? "bg-amber-100 text-amber-700"
                                        : row.badgeColor === "blue"
                                        ? "bg-blue-100 text-blue-700"
                                        : "bg-slate-100 text-slate-700"
                                    }`}
                                  >
                                    {row.col7}
                                  </span>
                                ) : (
                                  <span className="font-extrabold text-slate-900">
                                    {row.col7}
                                  </span>
                                )}
                              </td>
                            )}
                            {row.col8 !== undefined && (
                              <td className="px-4 py-3 whitespace-nowrap">
                                <span
                                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                                    row.badgeColor === "emerald"
                                      ? "bg-emerald-100 text-emerald-700"
                                      : "bg-red-100 text-red-700"
                                  }`}
                                >
                                  {row.col8}
                                </span>
                              </td>
                            )}
                          </tr>
                        ))}
                        {filteredRecords.length === 0 && (
                          <tr>
                            <td
                              colSpan={data.columns?.length || 5}
                              className="px-4 py-10 text-center text-slate-400 text-xs"
                            >
                              {searchQuery ? (
                                <div className="space-y-1.5">
                                  <p className="font-semibold text-slate-700">
                                    No records found matching &ldquo;{searchQuery}&rdquo;.
                                  </p>
                                  <p className="text-[11px] text-slate-400">
                                    Try searching by a different patient name, Patient UID, or phone number.
                                  </p>
                                  <button
                                    type="button"
                                    onClick={() => setSearchQuery("")}
                                    className="inline-block mt-1 text-xs text-purple-600 hover:underline font-bold"
                                  >
                                    Clear search query
                                  </button>
                                </div>
                              ) : (
                                "No records found for this report in the system."
                              )}
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>

                  <div className="p-3 bg-slate-50 border-t border-slate-200 text-center text-[11px] text-slate-500">
                    Showing latest audited rows. Download the complete spreadsheet below for historical archives.
                  </div>
                </div>
              </div>
            </>
          ) : null}
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-5 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <FileSpreadsheet className="w-4 h-4 text-purple-600" />
            <span className="font-mono text-[11px] text-slate-600 font-semibold truncate max-w-xs">
              {data?.meta?.filename || `${selectedType}.csv`}
            </span>
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            <button
              onClick={onClose}
              className="flex-1 sm:flex-none px-4 py-2 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-bold transition-colors"
            >
              Close Preview
            </button>
            <a
              href={
                searchQuery
                  ? `/api/admin/export?type=${selectedType}&search=${encodeURIComponent(searchQuery)}`
                  : (data?.meta?.exportUrl || `/api/admin/export?type=${selectedType}`)
              }
              download
              className="flex-1 sm:flex-none px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors shadow-sm shadow-purple-600/20"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{searchQuery ? "Download Filtered CSV" : "Download Full CSV"}</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}


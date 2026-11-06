"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Pill,
  Plus,
  Download,
  Search,
  Banknote,
  TrendingUp,
  CreditCard,
  AlertCircle,
  CheckCircle2,
  Edit2,
  Trash2,
  X,
  RefreshCw,
  Layers,
  ArrowUpDown,
  Building2,
  Package,
} from "lucide-react";

export interface MedicineInventoryItem {
  id: string;
  sNo: number;
  itemName: string;
  formPotencySpec: string;
  pkgPacks: number;
  nosPerPack: number;
  totalCost: number;
  perUnitCost: number;
  perPackCost: number;
  totalValue: number;
  perUnitSelling: number;
  qtyPurchased: number;
  batchNo: string;
  expiryDate: string | Date;
  isCredit: boolean;
  createdAt: string | Date;
}

interface SummaryData {
  totalCost: number;
  totalValue: number;
  totalUnits: number;
  totalItemsCount: number;
  creditCount: number;
  cashCount: number;
  creditTotalCost: number;
  cashTotalCost: number;
  potentialMargin: number;
}

export function MedicinePurchaseSheetView({
  portalRole = "PHARMACIST",
}: {
  portalRole?: "ADMIN" | "PHARMACIST";
}) {
  const [medicines, setMedicines] = useState<MedicineInventoryItem[]>([]);
  const [summary, setSummary] = useState<SummaryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters & Search
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCredit, setFilterCredit] = useState<"ALL" | "CREDIT" | "CASH">("ALL");
  const [sortBy, setSortBy] = useState<string>("sNo");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [pageSize, setPageSize] = useState<number>(portalRole === "PHARMACIST" ? 6 : 50); // 6, 25, 50, 100, 300 (all)
  const [currentPage, setCurrentPage] = useState<number>(1);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MedicineInventoryItem | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Form State
  const [formSNo, setFormSNo] = useState("");
  const [formItemName, setFormItemName] = useState("");
  const [formSpec, setFormSpec] = useState("");
  const [formPkgPacks, setFormPkgPacks] = useState("10");
  const [formNosPerPack, setFormNosPerPack] = useState("30");
  const [formPerPackCost, setFormPerPackCost] = useState("450");
  const [formSellingPrice, setFormSellingPrice] = useState("20");
  const [formBatchNo, setFormBatchNo] = useState("");
  const [formExpiryDate, setFormExpiryDate] = useState("");
  const [formIsCredit, setFormIsCredit] = useState(false);
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Auto-calculated Form Previews
  const calcQtyPurchased = useMemo(() => {
    const p = Math.max(1, parseInt(formPkgPacks) || 1);
    const n = Math.max(1, parseInt(formNosPerPack) || 1);
    return p * n;
  }, [formPkgPacks, formNosPerPack]);

  const calcTotalCost = useMemo(() => {
    const p = Math.max(1, parseInt(formPkgPacks) || 1);
    const c = Math.max(0, parseFloat(formPerPackCost) || 0);
    return Number((p * c).toFixed(2));
  }, [formPkgPacks, formPerPackCost]);

  const calcPerUnitCost = useMemo(() => {
    const n = Math.max(1, parseInt(formNosPerPack) || 1);
    const c = Math.max(0, parseFloat(formPerPackCost) || 0);
    return Number((c / n).toFixed(2));
  }, [formNosPerPack, formPerPackCost]);

  const calcTotalValue = useMemo(() => {
    const sp = Math.max(0, parseFloat(formSellingPrice) || 0);
    return Number((calcQtyPurchased * sp).toFixed(2));
  }, [calcQtyPurchased, formSellingPrice]);

  const calcMargin = useMemo(() => {
    return calcTotalValue - calcTotalCost;
  }, [calcTotalValue, calcTotalCost]);

  const fetchMedicines = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        search: searchTerm,
        filterCredit,
        sortBy,
        sortOrder,
      });
      const res = await fetch(`/api/inventory/medicines?${params.toString()}`);
      const data = await res.json();
      if (res.ok) {
        setMedicines(data.medicines || []);
        setSummary(data.summary || null);
      } else {
        setError(data.error || "Failed to load medicine inventory sheet.");
      }
    } catch (err: any) {
      setError(err?.message || "Network error loading inventory records.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMedicines();
    setCurrentPage(1);
  }, [filterCredit, sortBy, sortOrder]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchMedicines();
    setCurrentPage(1);
  };

  const handleOpenAddModal = () => {
    setEditingItem(null);
    setFormSNo(String((medicines.length ? Math.max(...medicines.map((m) => m.sNo)) : 0) + 1));
    setFormItemName("");
    setFormSpec("Tab");
    setFormPkgPacks("10");
    setFormNosPerPack("30");
    setFormPerPackCost("450");
    setFormSellingPrice("20");
    setFormBatchNo("");
    const futureDate = new Date();
    futureDate.setFullYear(futureDate.getFullYear() + 2);
    setFormExpiryDate(futureDate.toISOString().split("T")[0]);
    setFormIsCredit(false);
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (item: MedicineInventoryItem) => {
    setEditingItem(item);
    setFormSNo(String(item.sNo));
    setFormItemName(item.itemName);
    setFormSpec(item.formPotencySpec);
    setFormPkgPacks(String(item.pkgPacks));
    setFormNosPerPack(String(item.nosPerPack));
    setFormPerPackCost(String(item.perPackCost));
    setFormSellingPrice(String(item.perUnitSelling));
    setFormBatchNo(item.batchNo);
    const exp = new Date(item.expiryDate).toISOString().split("T")[0];
    setFormExpiryDate(exp);
    setFormIsCredit(item.isCredit);
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleSaveMedicine = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formItemName.trim()) {
      setFormError("Product / Item Name is required.");
      return;
    }
    if (!formSpec.trim()) {
      setFormError("Form / Potency / Specification is required.");
      return;
    }
    if (!formBatchNo.trim()) {
      setFormError("Batch number is required.");
      return;
    }
    if (!formExpiryDate) {
      setFormError("Expiry date is required.");
      return;
    }

    setFormSubmitting(true);
    setFormError(null);

    const payload = {
      sNo: formSNo ? parseInt(formSNo) : undefined,
      itemName: formItemName,
      formPotencySpec: formSpec,
      pkgPacks: formPkgPacks,
      nosPerPack: formNosPerPack,
      perPackCost: formPerPackCost,
      perUnitSelling: formSellingPrice,
      batchNo: formBatchNo,
      expiryDate: formExpiryDate,
      isCredit: formIsCredit,
    };

    try {
      const url = editingItem
        ? `/api/inventory/medicines/${editingItem.id}`
        : `/api/inventory/medicines`;
      const method = editingItem ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (res.ok) {
        setIsModalOpen(false);
        fetchMedicines();
      } else {
        setFormError(data.error || "Failed to save medicine inventory entry.");
      }
    } catch (err: any) {
      setFormError(err?.message || "Network error saving medicine entry.");
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/inventory/medicines/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setDeleteConfirmId(null);
        fetchMedicines();
      } else {
        const data = await res.json();
        alert(data.error || "Failed to delete medicine entry.");
      }
    } catch (err: any) {
      alert(err?.message || "Failed to delete medicine entry.");
    }
  };

  const handleExportCSV = () => {
    const params = new URLSearchParams({ filterCredit });
    window.location.href = `/api/inventory/medicines/export?${params.toString()}`;
  };

  const toggleSort = (col: string) => {
    if (sortBy === col) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(col);
      setSortOrder("asc");
    }
  };

  // Pagination Slice
  const totalPages = Math.ceil(medicines.length / pageSize) || 1;
  const paginatedMedicines = useMemo(() => {
    if (pageSize >= 300) return medicines;
    const start = (currentPage - 1) * pageSize;
    return medicines.slice(start, start + pageSize);
  }, [medicines, currentPage, pageSize]);

  return (
    <div className="space-y-6 animate-in fade-in pb-12">
      {/* Top Banner & Header */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-200">
              Complete Formulary · 289 Items
            </span>
            <span className="text-xs text-slate-500 font-medium">
              Ruqayya Clinic Pharmacy &amp; Hospital Stock Sheet
            </span>
          </div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Pill className="w-6 h-6 text-emerald-600" />
            <span>Medicine Inventory &amp; Purchase Sheet</span>
          </h2>
          <p className="text-xs text-slate-500">
            Official 289-item pharmaceutical inventory matching hospital purchase sheet headers: PKGPacks, Nos Per pack, Total cost, Per Tab, Per pack, T.Value, Per Tab (Selling), Qty Pur, Batch no, Expiry, and Credit status.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={handleExportCSV}
            className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl flex items-center gap-2 border border-slate-200 transition-colors shadow-sm"
            title="Download Full 289-Medicine Sheet as CSV"
          >
            <Download className="w-4 h-4 text-slate-600" />
            <span>Export CSV Sheet</span>
          </button>

          <button
            onClick={fetchMedicines}
            className="p-2.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors border border-slate-200"
            title="Refresh List"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-emerald-600" : ""}`} />
          </button>

          <button
            onClick={handleOpenAddModal}
            className="px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-md transition-all active:scale-[0.98]"
          >
            <Plus className="w-4 h-4" />
            <span>Add Medicine Entry</span>
          </button>
        </div>
      </div>

      {/* 4 Summary Metric Cards (Visible in Admin Portal, hidden in Pharmacy Portal as requested) */}
      {summary && portalRole === "ADMIN" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Total Cost */}
          <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Total Purchase Cost
              </span>
              <h3 className="text-2xl font-black text-slate-900 font-mono">
                Rs. {summary.totalCost.toLocaleString()}
              </h3>
              <p className="text-[11px] text-slate-500">
                Across {summary.totalItemsCount} catalog medicines
              </p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              <Banknote className="w-6 h-6" />
            </div>
          </div>

          {/* Total Retail Value (T.Value) */}
          <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Total Retail Valuation (T.Value)
              </span>
              <h3 className="text-2xl font-black text-emerald-950 font-mono">
                Rs. {summary.totalValue.toLocaleString()}
              </h3>
              <p className="text-[11px] text-emerald-600 font-semibold font-mono">
                Margin: +Rs. {summary.potentialMargin.toLocaleString()}
              </p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              <TrendingUp className="w-6 h-6" />
            </div>
          </div>

          {/* Total Units */}
          <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Total Dosage Units (Qty Pur)
              </span>
              <h3 className="text-2xl font-black text-slate-900 font-mono">
                {summary.totalUnits.toLocaleString()}{" "}
                <span className="text-xs font-normal text-slate-400">tabs/units</span>
              </h3>
              <p className="text-[11px] text-slate-500">
                Tabs, amps, vials, bottles &amp; sachets
              </p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
              <Package className="w-6 h-6" />
            </div>
          </div>

          {/* Credit vs Cash */}
          <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Credit vs. Cash Medicines
              </span>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                  Credit: {summary.creditCount}
                </span>
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                  Cash: {summary.cashCount}
                </span>
              </div>
              <p className="text-[11px] text-amber-700 font-medium font-mono">
                Credit Balance: Rs. {summary.creditTotalCost.toLocaleString()}
              </p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
              <CreditCard className="w-6 h-6" />
            </div>
          </div>
        </div>
      )}

      {/* Search & Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row items-center justify-between gap-3">
        <form onSubmit={handleSearchSubmit} className="relative w-full md:w-96">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search 289 medicines, forms, batch numbers..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none text-slate-900"
          />
        </form>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {/* Credit Filter */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs font-semibold">
            <button
              type="button"
              onClick={() => setFilterCredit("ALL")}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                filterCredit === "ALL"
                  ? "bg-white text-emerald-700 shadow-sm font-bold"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              All 289 Items
            </button>
            <button
              type="button"
              onClick={() => setFilterCredit("CASH")}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                filterCredit === "CASH"
                  ? "bg-white text-emerald-700 shadow-sm font-bold"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Cash ({summary?.cashCount || 0})
            </button>
            <button
              type="button"
              onClick={() => setFilterCredit("CREDIT")}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                filterCredit === "CREDIT"
                  ? "bg-white text-amber-700 shadow-sm font-bold"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Credit ({summary?.creditCount || 0})
            </button>
          </div>

          {/* Page Size Selector */}
          <div className="flex items-center gap-1.5 text-xs text-slate-600 font-semibold bg-slate-50 px-2.5 py-1.5 rounded-xl border border-slate-200">
            <span>Show:</span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="bg-transparent font-bold text-slate-800 focus:outline-none cursor-pointer"
            >
              <option value={6}>6 / page</option>
              <option value={25}>25 / page</option>
              <option value={50}>50 / page</option>
              <option value={100}>100 / page</option>
              <option value={300}>All 289</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Tabular Data Grid - Matching Exact Hospital Sheet Columns */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="p-4 sm:p-5 bg-slate-50/70 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-emerald-600" />
            <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wide">
              Hospital Purchase Sheet Master Grid
            </h3>
          </div>
          <span className="text-xs text-slate-500 font-medium">
            Page {currentPage} of {totalPages} · {medicines.length} items loaded
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            {portalRole === "PHARMACIST" ? (
              // Pharmacist Compact View: 8 Columns capturing all data in one go without horizontal scrolling
              <>
                <thead className="bg-slate-100/90 text-slate-700 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200 select-none">
                  <tr>
                    <th
                      onClick={() => toggleSort("sNo")}
                      className="py-3 px-2 text-center border-r border-slate-200 w-12 cursor-pointer hover:bg-slate-200/60"
                    >
                      <div className="flex items-center justify-center gap-0.5">
                        <span>S.No</span>
                        <ArrowUpDown className="w-2.5 h-2.5 text-slate-400" />
                      </div>
                    </th>
                    <th
                      onClick={() => toggleSort("itemName")}
                      className="py-3 px-3 border-r border-slate-200 cursor-pointer hover:bg-slate-200/60"
                    >
                      <div className="flex items-center gap-1">
                        <span>Medicine &amp; Specification</span>
                        <ArrowUpDown className="w-2.5 h-2.5 text-slate-400" />
                      </div>
                    </th>
                    <th
                      onClick={() => toggleSort("qtyPurchased")}
                      className="py-3 px-2.5 text-center border-r border-slate-200 cursor-pointer hover:bg-slate-200/60"
                    >
                      Packs &amp; Units
                    </th>
                    <th
                      onClick={() => toggleSort("totalCost")}
                      className="py-3 px-3 text-right border-r border-slate-200 cursor-pointer hover:bg-slate-200/60"
                    >
                      Cost &amp; T.Value
                    </th>
                    <th
                      onClick={() => toggleSort("perUnitCost")}
                      className="py-3 px-2.5 text-right border-r border-slate-200 cursor-pointer hover:bg-slate-200/60"
                    >
                      Per Unit (Cost/Sell)
                    </th>
                    <th
                      onClick={() => toggleSort("expiryDate")}
                      className="py-3 px-2.5 border-r border-slate-200 cursor-pointer hover:bg-slate-200/60"
                    >
                      Batch &amp; Expiry
                    </th>
                    <th className="py-3 px-2 text-center border-r border-slate-200">
                      Payment
                    </th>
                    <th className="py-3 px-2.5 text-center">
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100 font-sans">
                  {loading ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-slate-400">
                        <RefreshCw className="w-6 h-6 mx-auto animate-spin text-emerald-600 mb-2" />
                        <p className="font-semibold text-xs">Loading hospital purchase sheet medicines...</p>
                      </td>
                    </tr>
                  ) : paginatedMedicines.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-slate-400">
                        <Pill className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                        <p className="font-semibold text-xs">No medicines found matching filter.</p>
                      </td>
                    </tr>
                  ) : (
                    paginatedMedicines.map((m) => {
                      const expiryDateObj = new Date(m.expiryDate);
                      const isExpired = expiryDateObj < new Date();
                      const isExpiringSoon =
                        expiryDateObj.getTime() - Date.now() < 180 * 24 * 60 * 60 * 1000 && !isExpired;

                      return (
                        <tr
                          key={m.id}
                          className="hover:bg-emerald-50/30 transition-colors group text-[11px]"
                        >
                          <td className="py-2.5 px-2 text-center font-mono font-bold text-slate-500 border-r border-slate-100 bg-slate-50/50">
                            {m.sNo}
                          </td>

                          <td className="py-2.5 px-3 border-r border-slate-100">
                            <div className="font-extrabold text-slate-900 group-hover:text-emerald-700 transition-colors">
                              {m.itemName}
                            </div>
                            <div className="text-[10px] text-slate-500 font-medium">
                              {m.formPotencySpec}
                            </div>
                          </td>

                          <td className="py-2.5 px-2.5 text-center border-r border-slate-100">
                            <div className="font-mono text-slate-700 font-bold">
                              {m.pkgPacks} pkgs &times; {m.nosPerPack}
                            </div>
                            <div className="text-[10px] font-mono font-black text-blue-700">
                              {m.qtyPurchased.toLocaleString()} units
                            </div>
                          </td>

                          <td className="py-2.5 px-3 text-right border-r border-slate-100">
                            <div className="font-mono font-bold text-amber-950">
                              Rs. {m.totalCost.toLocaleString()}
                            </div>
                            <div className="text-[10px] font-mono font-black text-emerald-800">
                              T.Val: Rs. {m.totalValue.toLocaleString()}
                            </div>
                          </td>

                          <td className="py-2.5 px-2.5 text-right border-r border-slate-100">
                            <div className="font-mono text-slate-600">
                              Cost: Rs. {m.perUnitCost.toFixed(2)}
                            </div>
                            <div className="font-mono font-bold text-emerald-700">
                              Sell: Rs. {m.perUnitSelling.toFixed(2)}
                            </div>
                          </td>

                          <td className="py-2.5 px-2.5 border-r border-slate-100">
                            <div className="font-mono font-bold text-[10px] bg-slate-100 text-slate-800 px-1.5 py-0.5 rounded border border-slate-200 inline-block mb-1">
                              {m.batchNo}
                            </div>
                            <div>
                              <span
                                className={`font-mono text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                                  isExpired
                                    ? "bg-rose-100 text-rose-800 border border-rose-200"
                                    : isExpiringSoon
                                    ? "bg-amber-100 text-amber-800 border border-amber-200"
                                    : "bg-emerald-50 text-emerald-800 border border-emerald-200"
                                }`}
                              >
                                {expiryDateObj.toLocaleDateString("en-GB", {
                                  month: "short",
                                  year: "numeric",
                                })}
                              </span>
                            </div>
                          </td>

                          <td className="py-2.5 px-2 text-center border-r border-slate-100">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                                m.isCredit
                                  ? "bg-amber-100 text-amber-900 border border-amber-300"
                                  : "bg-emerald-100 text-emerald-900 border border-emerald-300"
                              }`}
                            >
                              {m.isCredit ? "Credit" : "Cash"}
                            </span>
                          </td>

                          <td className="py-2.5 px-2.5 text-center whitespace-nowrap">
                            <div className="flex items-center justify-center gap-1">
                              <button
                                onClick={() => handleOpenEditModal(m)}
                                className="p-1.5 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                                title="Edit Medicine Entry"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => setDeleteConfirmId(m.id)}
                                className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                                title="Delete Medicine Entry"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>

                {medicines.length > 0 && summary && (
                  <tfoot className="bg-slate-100 font-mono font-black text-xs text-slate-900 border-t-2 border-slate-300">
                    <tr>
                      <td colSpan={3} className="py-3 px-3 uppercase tracking-wider font-sans text-[11px]">
                        Total Sheet Values ({medicines.length} Medicines)
                      </td>
                      <td className="py-3 px-3 text-right text-amber-950 bg-amber-100/50">
                        Cost: Rs. {summary.totalCost.toLocaleString()}
                        <div className="text-[10px] text-emerald-900">Val: Rs. {summary.totalValue.toLocaleString()}</div>
                      </td>
                      <td className="py-3 px-2.5 text-right text-emerald-700 font-sans text-[11px]">
                        Margin: +Rs. {summary.potentialMargin.toLocaleString()}
                      </td>
                      <td colSpan={3} className="py-3 px-3 text-center text-slate-600 font-sans text-[11px] font-normal">
                        Credit Dues: Rs. {summary.creditTotalCost.toLocaleString()} &middot; Units: {summary.totalUnits.toLocaleString()}
                      </td>
                    </tr>
                  </tfoot>
                )}
              </>
            ) : (
              // Admin Master Grid (15 Columns)
              <>
            <thead className="bg-slate-100/90 text-slate-700 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200 select-none">
              <tr>
                <th
                  onClick={() => toggleSort("sNo")}
                  className="py-3 px-2.5 text-center border-r border-slate-200 w-12 cursor-pointer hover:bg-slate-200/60"
                >
                  <div className="flex items-center justify-center gap-0.5">
                    <span>S.No</span>
                    <ArrowUpDown className="w-2.5 h-2.5 text-slate-400" />
                  </div>
                </th>
                <th
                  onClick={() => toggleSort("itemName")}
                  className="py-3 px-3 border-r border-slate-200 cursor-pointer hover:bg-slate-200/60 min-w-[150px]"
                >
                  <div className="flex items-center gap-1">
                    <span>Item / Product Name</span>
                    <ArrowUpDown className="w-2.5 h-2.5 text-slate-400" />
                  </div>
                </th>
                <th
                  onClick={() => toggleSort("formPotencySpec")}
                  className="py-3 px-3 border-r border-slate-200 cursor-pointer hover:bg-slate-200/60 min-w-[140px]"
                >
                  <div className="flex items-center gap-1">
                    <span>Form / Potency / Specification</span>
                    <ArrowUpDown className="w-2.5 h-2.5 text-slate-400" />
                  </div>
                </th>
                <th
                  onClick={() => toggleSort("pkgPacks")}
                  className="py-3 px-2 text-center border-r border-slate-200 cursor-pointer hover:bg-slate-200/60"
                >
                  PKGPacks
                </th>
                <th
                  onClick={() => toggleSort("nosPerPack")}
                  className="py-3 px-2 text-center border-r border-slate-200 cursor-pointer hover:bg-slate-200/60"
                >
                  Nos Per pack
                </th>
                <th
                  onClick={() => toggleSort("totalCost")}
                  className="py-3 px-3 text-right border-r border-slate-200 cursor-pointer hover:bg-slate-200/60 bg-amber-50/50 text-amber-950"
                >
                  <div className="flex items-center justify-end gap-1">
                    <span>Total cost</span>
                    <ArrowUpDown className="w-2.5 h-2.5 text-amber-500" />
                  </div>
                </th>
                <th
                  onClick={() => toggleSort("perUnitCost")}
                  className="py-3 px-2.5 text-right border-r border-slate-200 cursor-pointer hover:bg-slate-200/60"
                >
                  Per Tab
                </th>
                <th
                  onClick={() => toggleSort("perPackCost")}
                  className="py-3 px-2.5 text-right border-r border-slate-200 cursor-pointer hover:bg-slate-200/60"
                >
                  Per pack
                </th>
                <th
                  onClick={() => toggleSort("totalValue")}
                  className="py-3 px-3 text-right border-r border-slate-200 cursor-pointer hover:bg-slate-200/60 bg-emerald-50/50 text-emerald-950"
                >
                  <div className="flex items-center justify-end gap-1">
                    <span>T.Value</span>
                    <ArrowUpDown className="w-2.5 h-2.5 text-emerald-500" />
                  </div>
                </th>
                <th
                  onClick={() => toggleSort("perUnitSelling")}
                  className="py-3 px-2.5 text-right border-r border-slate-200 cursor-pointer hover:bg-slate-200/60 text-emerald-800"
                >
                  Per Tab (Selling)
                </th>
                <th
                  onClick={() => toggleSort("qtyPurchased")}
                  className="py-3 px-2.5 text-center border-r border-slate-200 cursor-pointer hover:bg-slate-200/60 bg-blue-50/50 text-blue-950"
                >
                  Qty Pur
                </th>
                <th className="py-3 px-3 border-r border-slate-200">Batch no</th>
                <th
                  onClick={() => toggleSort("expiryDate")}
                  className="py-3 px-2.5 border-r border-slate-200 cursor-pointer hover:bg-slate-200/60"
                >
                  Expiry
                </th>
                <th className="py-3 px-2.5 text-center border-r border-slate-200">Credit</th>
                <th className="py-3 px-2.5 text-center">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 font-sans">
              {loading ? (
                <tr>
                  <td colSpan={15} className="py-12 text-center text-slate-400">
                    <RefreshCw className="w-6 h-6 mx-auto animate-spin text-emerald-600 mb-2" />
                    <p className="font-semibold text-xs">Loading 289 hospital purchase sheet medicines...</p>
                  </td>
                </tr>
              ) : paginatedMedicines.length === 0 ? (
                <tr>
                  <td colSpan={15} className="py-12 text-center text-slate-400">
                    <Pill className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                    <p className="font-semibold text-xs">No medicines found matching filter.</p>
                  </td>
                </tr>
              ) : (
                paginatedMedicines.map((m) => {
                  const expiryDateObj = new Date(m.expiryDate);
                  const isExpired = expiryDateObj < new Date();
                  const isExpiringSoon =
                    expiryDateObj.getTime() - Date.now() < 180 * 24 * 60 * 60 * 1000 && !isExpired;

                  return (
                    <tr
                      key={m.id}
                      className="hover:bg-emerald-50/30 transition-colors group text-[11px]"
                    >
                      {/* S.No */}
                      <td className="py-2.5 px-2.5 text-center font-mono font-bold text-slate-500 border-r border-slate-100 bg-slate-50/50">
                        {m.sNo}
                      </td>

                      {/* Item / Product Name */}
                      <td className="py-2.5 px-3 border-r border-slate-100">
                        <span className="font-extrabold text-slate-900 group-hover:text-emerald-700 transition-colors">
                          {m.itemName}
                        </span>
                      </td>

                      {/* Form / Potency / Specification */}
                      <td className="py-2.5 px-3 border-r border-slate-100 font-medium text-slate-600">
                        {m.formPotencySpec}
                      </td>

                      {/* PKGPacks */}
                      <td className="py-2.5 px-2 text-center border-r border-slate-100 font-mono font-bold text-slate-700">
                        {m.pkgPacks}
                      </td>

                      {/* Nos Per pack */}
                      <td className="py-2.5 px-2 text-center border-r border-slate-100 font-mono text-slate-600">
                        {m.nosPerPack}
                      </td>

                      {/* Total cost */}
                      <td className="py-2.5 px-3 text-right border-r border-slate-100 font-mono font-bold text-amber-950 bg-amber-50/20">
                        Rs. {m.totalCost.toLocaleString()}
                      </td>

                      {/* Per Tab Cost */}
                      <td className="py-2.5 px-2.5 text-right border-r border-slate-100 font-mono text-slate-600">
                        Rs. {m.perUnitCost.toFixed(2)}
                      </td>

                      {/* Per pack Cost */}
                      <td className="py-2.5 px-2.5 text-right border-r border-slate-100 font-mono text-slate-700">
                        Rs. {m.perPackCost.toLocaleString()}
                      </td>

                      {/* T.Value */}
                      <td className="py-2.5 px-3 text-right border-r border-slate-100 font-mono font-black text-emerald-950 bg-emerald-50/20">
                        Rs. {m.totalValue.toLocaleString()}
                      </td>

                      {/* Per Tab (Selling) */}
                      <td className="py-2.5 px-2.5 text-right border-r border-slate-100 font-mono font-bold text-emerald-700">
                        Rs. {m.perUnitSelling.toFixed(2)}
                      </td>

                      {/* Qty Pur */}
                      <td className="py-2.5 px-2.5 text-center border-r border-slate-100 font-mono font-black text-blue-700 bg-blue-50/30">
                        {m.qtyPurchased.toLocaleString()}
                      </td>

                      {/* Batch no */}
                      <td className="py-2.5 px-3 border-r border-slate-100 whitespace-nowrap">
                        <span className="font-mono font-bold text-[10px] bg-slate-100 text-slate-800 px-2 py-0.5 rounded border border-slate-200">
                          {m.batchNo}
                        </span>
                      </td>

                      {/* Expiry */}
                      <td className="py-2.5 px-2.5 border-r border-slate-100 whitespace-nowrap">
                        <span
                          className={`font-mono text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            isExpired
                              ? "bg-rose-100 text-rose-800 border border-rose-200"
                              : isExpiringSoon
                              ? "bg-amber-100 text-amber-800 border border-amber-200"
                              : "bg-emerald-50 text-emerald-800 border border-emerald-200"
                          }`}
                        >
                          {expiryDateObj.toLocaleDateString("en-GB", {
                            month: "short",
                            year: "numeric",
                          })}
                        </span>
                      </td>

                      {/* Credit */}
                      <td className="py-2.5 px-2.5 text-center border-r border-slate-100">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                            m.isCredit
                              ? "bg-amber-100 text-amber-900 border border-amber-300"
                              : "bg-emerald-100 text-emerald-900 border border-emerald-300"
                          }`}
                        >
                          {m.isCredit ? "Credit" : "Cash"}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-2.5 px-2.5 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => handleOpenEditModal(m)}
                            className="p-1.5 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                            title="Edit Medicine Entry"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setDeleteConfirmId(m.id)}
                            className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                            title="Delete Medicine Entry"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>

            {/* Table Footer Totals */}
            {medicines.length > 0 && summary && (
              <tfoot className="bg-slate-100 font-mono font-black text-xs text-slate-900 border-t-2 border-slate-300">
                <tr>
                  <td colSpan={3} className="py-3 px-3 uppercase tracking-wider font-sans text-[11px]">
                    Total Sheet Values ({medicines.length} Medicines)
                  </td>
                  <td className="py-3 px-2 text-center text-slate-500 font-normal">&mdash;</td>
                  <td className="py-3 px-2 text-center text-slate-500 font-normal">&mdash;</td>
                  <td className="py-3 px-3 text-right text-amber-950 bg-amber-100/50">
                    Rs. {summary.totalCost.toLocaleString()}
                  </td>
                  <td colSpan={2} className="py-3 px-2 text-right text-slate-500 font-sans text-[11px] font-normal">
                    Aggregate Margin:
                  </td>
                  <td className="py-3 px-3 text-right text-emerald-950 bg-emerald-100/50">
                    Rs. {summary.totalValue.toLocaleString()}
                  </td>
                  <td className="py-3 px-2 text-right text-emerald-700 font-sans text-[11px]">
                    +Rs. {summary.potentialMargin.toLocaleString()}
                  </td>
                  <td className="py-3 px-2.5 text-center text-blue-800 bg-blue-100/50">
                    {summary.totalUnits.toLocaleString()} units
                  </td>
                  <td colSpan={4} className="py-3 px-3 text-center text-slate-500 font-sans text-[11px] font-normal">
                    Credit Dues: Rs. {summary.creditTotalCost.toLocaleString()}
                  </td>
                </tr>
              </tfoot>
            )}
              </>
            )}
          </table>
        </div>

        {/* Pagination Bar */}
        {pageSize < 300 && totalPages > 1 && (
          <div className="p-4 bg-slate-50/70 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <span className="text-slate-500">
              Showing {(currentPage - 1) * pageSize + 1} to{" "}
              {Math.min(currentPage * pageSize, medicines.length)} of {medicines.length} medicines
            </span>

            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white font-bold text-slate-700 hover:bg-slate-100 disabled:opacity-40 transition-colors"
              >
                Previous
              </button>
              {Array.from({ length: totalPages }).map((_, i) => {
                const pageNum = i + 1;
                // Show first, last, and around current
                if (
                  pageNum === 1 ||
                  pageNum === totalPages ||
                  (pageNum >= currentPage - 2 && pageNum <= currentPage + 2)
                ) {
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`w-8 h-8 rounded-lg font-bold transition-all ${
                        currentPage === pageNum
                          ? "bg-emerald-600 text-white shadow-sm"
                          : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-100"
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                }
                if (pageNum === currentPage - 3 || pageNum === currentPage + 3) {
                  return <span key={pageNum} className="text-slate-400">...</span>;
                }
                return null;
              })}
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white font-bold text-slate-700 hover:bg-slate-100 disabled:opacity-40 transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ------------------------------------------------------------- */}
      {/* MODAL: Record or Edit Medicine Purchase */}
      {/* ------------------------------------------------------------- */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full overflow-hidden border border-slate-200">
            {/* Modal Header */}
            <div className="p-5 bg-gradient-to-r from-slate-900 to-emerald-950 text-white flex items-center justify-between">
              <div>
                <h3 className="text-base font-extrabold flex items-center gap-2">
                  <Pill className="w-5 h-5 text-emerald-400" />
                  <span>
                    {editingItem ? "Edit Medicine Purchase Sheet Entry" : "Record New Medicine Stock Entry"}
                  </span>
                </h3>
                <p className="text-xs text-slate-400">
                  Matches exact hospital purchase sheet columns with real-time auto-calculations
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveMedicine} className="p-6 space-y-4 text-xs">
              {formError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl flex items-center gap-2 font-semibold">
                  <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* S.No */}
                <div className="space-y-1">
                  <label className="block font-bold text-slate-700">
                    S.No (Catalog Index)
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formSNo}
                    onChange={(e) => setFormSNo(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none font-mono font-bold text-slate-900"
                  />
                </div>

                {/* Item / Product Name */}
                <div className="space-y-1 md:col-span-2">
                  <label className="block font-bold text-slate-700">
                    Item / Product Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Augmentin, Panadol, Brufen"
                    value={formItemName}
                    onChange={(e) => setFormItemName(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none font-bold text-slate-900"
                  />
                </div>

                {/* Form / Potency / Specification */}
                <div className="space-y-1 md:col-span-3">
                  <label className="block font-bold text-slate-700">
                    Form / Potency / Specification *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 625mg Tab, 120ml Susp, 1g Inj, 400mcg Cap"
                    value={formSpec}
                    onChange={(e) => setFormSpec(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none font-medium text-slate-900"
                  />
                </div>

                {/* PKGPacks */}
                <div className="space-y-1">
                  <label className="block font-bold text-slate-700">
                    PKGPacks (Boxes) *
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={formPkgPacks}
                    onChange={(e) => setFormPkgPacks(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none font-mono font-bold text-slate-900"
                  />
                </div>

                {/* Nos Per pack */}
                <div className="space-y-1">
                  <label className="block font-bold text-slate-700">
                    Nos Per pack (Units/Box) *
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={formNosPerPack}
                    onChange={(e) => setFormNosPerPack(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none font-mono font-bold text-slate-900"
                  />
                </div>

                {/* Per pack Cost */}
                <div className="space-y-1">
                  <label className="block font-bold text-slate-700">
                    Per pack Cost (Rs.) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={formPerPackCost}
                    onChange={(e) => setFormPerPackCost(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none font-mono font-bold text-slate-900"
                  />
                </div>

                {/* Per Tab (Selling) */}
                <div className="space-y-1">
                  <label className="block font-bold text-slate-700">
                    Per Tab / Unit Selling (Rs.) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={formSellingPrice}
                    onChange={(e) => setFormSellingPrice(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none font-mono font-bold text-emerald-700"
                  />
                </div>

                {/* Batch no */}
                <div className="space-y-1">
                  <label className="block font-bold text-slate-700">
                    Batch no *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. AUG-26020"
                    value={formBatchNo}
                    onChange={(e) => setFormBatchNo(e.target.value.toUpperCase())}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none font-mono font-bold text-slate-900"
                  />
                </div>

                {/* Expiry */}
                <div className="space-y-1">
                  <label className="block font-bold text-slate-700">
                    Expiry Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={formExpiryDate}
                    onChange={(e) => setFormExpiryDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none font-bold text-slate-900"
                  />
                </div>
              </div>

              {/* Credit Status Toggle */}
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between">
                <div>
                  <span className="font-bold text-slate-900 block">Purchase Credit Status</span>
                  <span className="text-[11px] text-slate-500">
                    Is this medicine supplied on vendor credit terms or paid in cash?
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setFormIsCredit(false)}
                    className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-all ${
                      !formIsCredit
                        ? "bg-emerald-600 text-white shadow-sm"
                        : "bg-slate-200 text-slate-700 hover:bg-slate-300"
                    }`}
                  >
                    Cash Paid
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormIsCredit(true)}
                    className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-all ${
                      formIsCredit
                        ? "bg-amber-600 text-white shadow-sm"
                        : "bg-slate-200 text-slate-700 hover:bg-slate-300"
                    }`}
                  >
                    Credit
                  </button>
                </div>
              </div>

              {/* Live Formula Calculations Preview */}
              <div className="p-4 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-2xl border border-emerald-200 space-y-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-emerald-900 block">
                  Real-Time Auto-Calculations
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-slate-700 font-mono text-[11px]">
                  <div>
                    <span className="text-slate-500 block text-[9px] uppercase font-bold">Qty Pur:</span>
                    <strong className="text-blue-900 text-xs">{calcQtyPurchased} units</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[9px] uppercase font-bold">Per Tab Cost:</span>
                    <strong className="text-slate-900 text-xs">Rs. {calcPerUnitCost.toFixed(2)}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[9px] uppercase font-bold">Total cost:</span>
                    <strong className="text-amber-900 text-xs">Rs. {calcTotalCost.toLocaleString()}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[9px] uppercase font-bold">T.Value:</span>
                    <strong className="text-emerald-950 text-xs">Rs. {calcTotalValue.toLocaleString()}</strong>
                  </div>
                </div>
              </div>

              {/* Submit / Cancel Buttons */}
              <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl font-bold text-xs transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formSubmitting}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-md transition-all active:scale-[0.98] disabled:opacity-50"
                >
                  {formSubmitting ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>{editingItem ? "Update Medicine Record" : "Save Medicine Entry"}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* MODAL: Delete Confirmation */}
      {/* ------------------------------------------------------------- */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl shadow-2xl max-w-sm w-full p-6 text-center space-y-4 border border-slate-200">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-base font-extrabold text-slate-900">
                Delete Medicine Entry?
              </h4>
              <p className="text-xs text-slate-500 mt-1">
                This will remove the medicine from the 289-item hospital inventory sheet.
              </p>
            </div>
            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteConfirmId)}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs shadow-md"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


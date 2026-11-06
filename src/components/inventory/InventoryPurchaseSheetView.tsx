"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Package,
  Plus,
  Download,
  Search,
  Filter,
  Banknote,
  TrendingUp,
  CreditCard,
  Calendar,
  AlertCircle,
  CheckCircle2,
  Edit2,
  Trash2,
  X,
  RefreshCw,
  Layers,
  ArrowUpDown,
  Building2,
  ShieldCheck,
} from "lucide-react";

export interface InventoryPurchase {
  id: string;
  itemName: string;
  specification: string;
  pkgPacks: number;
  nosPerPack: number;
  totalCost: number;
  perUnitCost: number;
  perPackCost: number;
  totalValue: number;
  perUnitSellingPrice: number;
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

export function InventoryPurchaseSheetView({
  portalRole = "ADMIN",
}: {
  portalRole?: "ADMIN" | "PHARMACIST";
}) {
  const [purchases, setPurchases] = useState<InventoryPurchase[]>([]);
  const [summary, setSummary] = useState<SummaryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters & Search
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCredit, setFilterCredit] = useState<"ALL" | "CREDIT" | "CASH">("ALL");
  const [sortBy, setSortBy] = useState<string>("itemName");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryPurchase | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Form State
  const [formItemName, setFormItemName] = useState("");
  const [formSpec, setFormSpec] = useState("");
  const [formPkgPacks, setFormPkgPacks] = useState("10");
  const [formNosPerPack, setFormNosPerPack] = useState("50");
  const [formPerPackCost, setFormPerPackCost] = useState("2000");
  const [formSellingPrice, setFormSellingPrice] = useState("55");
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
    return p * c;
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

  const fetchPurchases = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        search: searchTerm,
        filterCredit,
        sortBy,
        sortOrder,
      });
      const res = await fetch(`/api/inventory/purchases?${params.toString()}`);
      const data = await res.json();
      if (res.ok) {
        setPurchases(data.purchases || []);
        setSummary(data.summary || null);
      } else {
        setError(data.error || "Failed to load inventory purchase sheet.");
      }
    } catch (err: any) {
      setError(err?.message || "Network error loading inventory records.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPurchases();
  }, [filterCredit, sortBy, sortOrder]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchPurchases();
  };

  const handleOpenAddModal = () => {
    setEditingItem(null);
    setFormItemName("");
    setFormSpec("");
    setFormPkgPacks("10");
    setFormNosPerPack("50");
    setFormPerPackCost("2000");
    setFormSellingPrice("55");
    setFormBatchNo("");
    const futureDate = new Date();
    futureDate.setFullYear(futureDate.getFullYear() + 2);
    setFormExpiryDate(futureDate.toISOString().split("T")[0]);
    setFormIsCredit(false);
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (item: InventoryPurchase) => {
    setEditingItem(item);
    setFormItemName(item.itemName);
    setFormSpec(item.specification);
    setFormPkgPacks(String(item.pkgPacks));
    setFormNosPerPack(String(item.nosPerPack));
    setFormPerPackCost(String(item.perPackCost));
    setFormSellingPrice(String(item.perUnitSellingPrice));
    setFormBatchNo(item.batchNo);
    const exp = new Date(item.expiryDate).toISOString().split("T")[0];
    setFormExpiryDate(exp);
    setFormIsCredit(item.isCredit);
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleSavePurchase = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formItemName.trim()) {
      setFormError("Item / Product Name is required.");
      return;
    }
    if (!formSpec.trim()) {
      setFormError("Size / Specification / Gauge is required.");
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
      itemName: formItemName,
      specification: formSpec,
      pkgPacks: formPkgPacks,
      nosPerPack: formNosPerPack,
      perPackCost: formPerPackCost,
      perUnitSellingPrice: formSellingPrice,
      batchNo: formBatchNo,
      expiryDate: formExpiryDate,
      isCredit: formIsCredit,
    };

    try {
      const url = editingItem
        ? `/api/inventory/purchases/${editingItem.id}`
        : `/api/inventory/purchases`;
      const method = editingItem ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (res.ok) {
        setIsModalOpen(false);
        fetchPurchases();
      } else {
        setFormError(data.error || "Failed to save stock purchase entry.");
      }
    } catch (err: any) {
      setFormError(err?.message || "Network error saving purchase.");
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/inventory/purchases/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setDeleteConfirmId(null);
        fetchPurchases();
      } else {
        const data = await res.json();
        alert(data.error || "Failed to delete purchase record.");
      }
    } catch (err: any) {
      alert(err?.message || "Failed to delete purchase record.");
    }
  };

  const handleExportCSV = () => {
    const params = new URLSearchParams({ filterCredit });
    window.location.href = `/api/inventory/purchases/export?${params.toString()}`;
  };

  const toggleSort = (col: string) => {
    if (sortBy === col) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(col);
      setSortOrder("asc");
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in pb-12">
      {/* Top Banner & Title Bar */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-blue-100 text-blue-800 border border-blue-200">
              Procurement &amp; Stock Ledger
            </span>
            <span className="text-xs text-slate-500 font-medium">
              Ruqayya Hospital · Medical Inventory &amp; Pharmacy Supplies
            </span>
          </div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Building2 className="w-6 h-6 text-blue-600" />
            <span>Hospital Purchase Sheet &amp; Inventory</span>
          </h2>
          <p className="text-xs text-slate-500">
            Full procurement register matching hospital purchase sheet format: specifications, package counts, cost breakdown, retail valuation, batch tracking, and credit ledger.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={handleExportCSV}
            className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl flex items-center gap-2 border border-slate-200 transition-colors shadow-sm"
            title="Download RFC 4180-compliant CSV"
          >
            <Download className="w-4 h-4 text-slate-600" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={fetchPurchases}
            className="p-2.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors border border-slate-200"
            title="Refresh List"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-blue-600" : ""}`} />
          </button>

          <button
            onClick={handleOpenAddModal}
            className="px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-md transition-all active:scale-[0.98]"
          >
            <Plus className="w-4 h-4" />
            <span>Record Stock Purchase</span>
          </button>
        </div>
      </div>

      {/* 4 Summary Cards */}
      {summary && (
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
                Across {summary.totalItemsCount} catalog lines
              </p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              <Banknote className="w-6 h-6" />
            </div>
          </div>

          {/* Total Retail Value */}
          <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Total Retail Value (T.Value)
              </span>
              <h3 className="text-2xl font-black text-indigo-950 font-mono">
                Rs. {summary.totalValue.toLocaleString()}
              </h3>
              <p className="text-[11px] text-emerald-600 font-semibold font-mono">
                Margin: +Rs. {summary.potentialMargin.toLocaleString()}
              </p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
              <TrendingUp className="w-6 h-6" />
            </div>
          </div>

          {/* Total Units in Stock */}
          <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Total Physical Units
              </span>
              <h3 className="text-2xl font-black text-slate-900 font-mono">
                {summary.totalUnits.toLocaleString()}{" "}
                <span className="text-xs font-normal text-slate-400">units</span>
              </h3>
              <p className="text-[11px] text-slate-500">
                Counted across all master packs
              </p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
              <Package className="w-6 h-6" />
            </div>
          </div>

          {/* Credit vs Cash Breakdown */}
          <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Credit vs. Cash Purchases
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
                Credit Dues: Rs. {summary.creditTotalCost.toLocaleString()}
              </p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
              <CreditCard className="w-6 h-6" />
            </div>
          </div>
        </div>
      )}

      {/* Filter & Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row items-center justify-between gap-3">
        <form onSubmit={handleSearchSubmit} className="relative w-full md:w-96">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search by product name, specification, batch #..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none text-slate-900"
          />
        </form>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Credit Status Tabs */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs font-semibold">
            <button
              type="button"
              onClick={() => setFilterCredit("ALL")}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                filterCredit === "ALL"
                  ? "bg-white text-blue-700 shadow-sm font-bold"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              All Items ({summary?.totalItemsCount || purchases.length})
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
              Cash Paid
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
              Credit Purchase
            </button>
          </div>
        </div>
      </div>

      {/* Main Tabular Data Grid - Mimicking Hospital Purchase Sheet */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="p-4 sm:p-5 bg-slate-50/70 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-blue-600" />
            <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wide">
              Hospital Purchase Stock Sheet
            </h3>
          </div>
          <span className="text-xs text-slate-500 font-medium">
            Showing {purchases.length} items
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-100/90 text-slate-700 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200 select-none">
              <tr>
                <th className="py-3 px-3 text-center border-r border-slate-200 w-12">S.No</th>
                <th
                  onClick={() => toggleSort("itemName")}
                  className="py-3 px-3 border-r border-slate-200 cursor-pointer hover:bg-slate-200/60"
                >
                  <div className="flex items-center gap-1">
                    <span>Product Name</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th className="py-3 px-3 border-r border-slate-200">Size / Specification</th>
                <th className="py-3 px-2.5 text-center border-r border-slate-200">PKG Packs</th>
                <th className="py-3 px-2.5 text-center border-r border-slate-200">Nos/Pack</th>
                <th
                  onClick={() => toggleSort("qtyPurchased")}
                  className="py-3 px-2.5 text-center border-r border-slate-200 cursor-pointer hover:bg-slate-200/60 bg-blue-50/60 text-blue-950"
                >
                  <div className="flex items-center justify-center gap-1">
                    <span>Qty Pur</span>
                    <ArrowUpDown className="w-3 h-3 text-blue-400" />
                  </div>
                </th>
                <th className="py-3 px-3 text-right border-r border-slate-200">Per Pack Cost</th>
                <th className="py-3 px-3 text-right border-r border-slate-200">Cost/Tab</th>
                <th
                  onClick={() => toggleSort("totalCost")}
                  className="py-3 px-3 text-right border-r border-slate-200 cursor-pointer hover:bg-slate-200/60 bg-amber-50/50 text-amber-950"
                >
                  <div className="flex items-center justify-end gap-1">
                    <span>Total Cost</span>
                    <ArrowUpDown className="w-3 h-3 text-amber-400" />
                  </div>
                </th>
                <th className="py-3 px-3 text-right border-r border-slate-200 text-emerald-900">
                  Selling/Tab
                </th>
                <th
                  onClick={() => toggleSort("totalValue")}
                  className="py-3 px-3 text-right border-r border-slate-200 cursor-pointer hover:bg-slate-200/60 bg-indigo-50/50 text-indigo-950"
                >
                  <div className="flex items-center justify-end gap-1">
                    <span>T.Value</span>
                    <ArrowUpDown className="w-3 h-3 text-indigo-400" />
                  </div>
                </th>
                <th className="py-3 px-3 border-r border-slate-200">Batch No</th>
                <th
                  onClick={() => toggleSort("expiryDate")}
                  className="py-3 px-3 border-r border-slate-200 cursor-pointer hover:bg-slate-200/60"
                >
                  <div className="flex items-center gap-1">
                    <span>Expiry</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th className="py-3 px-3 text-center border-r border-slate-200">Credit</th>
                <th className="py-3 px-3 text-center">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 font-sans">
              {loading ? (
                <tr>
                  <td colSpan={15} className="py-12 text-center text-slate-400">
                    <RefreshCw className="w-6 h-6 mx-auto animate-spin text-blue-600 mb-2" />
                    <p className="font-semibold text-xs">Loading hospital inventory sheet...</p>
                  </td>
                </tr>
              ) : purchases.length === 0 ? (
                <tr>
                  <td colSpan={15} className="py-12 text-center text-slate-400">
                    <Package className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                    <p className="font-semibold text-xs">No inventory purchases found matching filter.</p>
                  </td>
                </tr>
              ) : (
                purchases.map((p, idx) => {
                  const expiryDateObj = new Date(p.expiryDate);
                  const isExpired = expiryDateObj < new Date();
                  const isExpiringSoon =
                    expiryDateObj.getTime() - Date.now() < 180 * 24 * 60 * 60 * 1000 && !isExpired;

                  return (
                    <tr
                      key={p.id}
                      className="hover:bg-blue-50/40 transition-colors group text-[11px]"
                    >
                      {/* S.No */}
                      <td className="py-2.5 px-3 text-center font-mono text-slate-400 border-r border-slate-100">
                        {idx + 1}
                      </td>

                      {/* Product Name */}
                      <td className="py-2.5 px-3 border-r border-slate-100">
                        <span className="font-extrabold text-slate-900 group-hover:text-blue-700 transition-colors">
                          {p.itemName}
                        </span>
                      </td>

                      {/* Size / Specification */}
                      <td className="py-2.5 px-3 border-r border-slate-100 font-medium text-slate-600">
                        {p.specification}
                      </td>

                      {/* PKG Packs */}
                      <td className="py-2.5 px-2.5 text-center border-r border-slate-100 font-mono font-bold text-slate-700">
                        {p.pkgPacks}
                      </td>

                      {/* Nos Per Pack */}
                      <td className="py-2.5 px-2.5 text-center border-r border-slate-100 font-mono text-slate-600">
                        {p.nosPerPack}
                      </td>

                      {/* Qty Pur */}
                      <td className="py-2.5 px-2.5 text-center border-r border-slate-100 font-mono font-black text-blue-700 bg-blue-50/30">
                        {p.qtyPurchased.toLocaleString()}
                      </td>

                      {/* Per Pack Cost */}
                      <td className="py-2.5 px-3 text-right border-r border-slate-100 font-mono text-slate-700">
                        Rs. {p.perPackCost.toLocaleString()}
                      </td>

                      {/* Cost Per Tab */}
                      <td className="py-2.5 px-3 text-right border-r border-slate-100 font-mono text-slate-600">
                        Rs. {p.perUnitCost.toFixed(2)}
                      </td>

                      {/* Total Cost */}
                      <td className="py-2.5 px-3 text-right border-r border-slate-100 font-mono font-bold text-amber-900 bg-amber-50/20">
                        Rs. {p.totalCost.toLocaleString()}
                      </td>

                      {/* Selling Price Per Tab */}
                      <td className="py-2.5 px-3 text-right border-r border-slate-100 font-mono font-bold text-emerald-700">
                        Rs. {p.perUnitSellingPrice.toFixed(2)}
                      </td>

                      {/* Total Value */}
                      <td className="py-2.5 px-3 text-right border-r border-slate-100 font-mono font-black text-indigo-950 bg-indigo-50/20">
                        Rs. {p.totalValue.toLocaleString()}
                      </td>

                      {/* Batch No */}
                      <td className="py-2.5 px-3 border-r border-slate-100">
                        <span className="font-mono font-bold text-[10px] bg-slate-100 text-slate-800 px-2 py-0.5 rounded border border-slate-200">
                          {p.batchNo}
                        </span>
                      </td>

                      {/* Expiry Date */}
                      <td className="py-2.5 px-3 border-r border-slate-100 whitespace-nowrap">
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

                      {/* Credit Status */}
                      <td className="py-2.5 px-3 text-center border-r border-slate-100">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                            p.isCredit
                              ? "bg-amber-100 text-amber-900 border border-amber-300"
                              : "bg-emerald-100 text-emerald-900 border border-emerald-300"
                          }`}
                        >
                          {p.isCredit ? "Credit" : "Cash"}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-2.5 px-3 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => handleOpenEditModal(p)}
                            className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Edit Stock Entry"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setDeleteConfirmId(p.id)}
                            className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                            title="Delete Stock Entry"
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
            {purchases.length > 0 && summary && (
              <tfoot className="bg-slate-100 font-mono font-black text-xs text-slate-900 border-t-2 border-slate-300">
                <tr>
                  <td colSpan={3} className="py-3 px-3 uppercase tracking-wider font-sans text-[11px]">
                    Total Sheet Values ({purchases.length} Items)
                  </td>
                  <td className="py-3 px-2.5 text-center text-slate-600 font-normal">
                    —
                  </td>
                  <td className="py-3 px-2.5 text-center text-slate-600 font-normal">
                    —
                  </td>
                  <td className="py-3 px-2.5 text-center text-blue-800 bg-blue-100/50">
                    {summary.totalUnits.toLocaleString()} units
                  </td>
                  <td colSpan={2} className="py-3 px-3 text-right text-slate-500 font-sans text-[11px] font-normal">
                    Aggregate Cost:
                  </td>
                  <td className="py-3 px-3 text-right text-amber-950 bg-amber-100/50">
                    Rs. {summary.totalCost.toLocaleString()}
                  </td>
                  <td className="py-3 px-3 text-right text-slate-500 font-sans text-[11px] font-normal">
                    Total Valuation:
                  </td>
                  <td className="py-3 px-3 text-right text-indigo-950 bg-indigo-100/50">
                    Rs. {summary.totalValue.toLocaleString()}
                  </td>
                  <td colSpan={4} className="py-3 px-3 text-center text-emerald-700 font-sans text-[11px]">
                    Gross Margin: Rs. {summary.potentialMargin.toLocaleString()}
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* MODAL: Record or Edit Stock Purchase */}
      {/* ------------------------------------------------------------- */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full overflow-hidden border border-slate-200">
            {/* Modal Header */}
            <div className="p-5 bg-gradient-to-r from-slate-900 to-blue-950 text-white flex items-center justify-between">
              <div>
                <h3 className="text-base font-extrabold flex items-center gap-2">
                  <Package className="w-5 h-5 text-blue-400" />
                  <span>
                    {editingItem ? "Edit Stock Purchase Entry" : "Record Stock Purchase Entry"}
                  </span>
                </h3>
                <p className="text-xs text-slate-400">
                  Medical inventory purchase sheet fields with real-time cost calculation
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
            <form onSubmit={handleSavePurchase} className="p-6 space-y-4 text-xs">
              {formError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl flex items-center gap-2 font-semibold">
                  <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Item Name */}
                <div className="space-y-1">
                  <label className="block font-bold text-slate-700">
                    Product / Item Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. IV Cannula, Syringe, Normal Saline"
                    value={formItemName}
                    onChange={(e) => setFormItemName(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none font-medium text-slate-900"
                  />
                </div>

                {/* Size / Specification */}
                <div className="space-y-1">
                  <label className="block font-bold text-slate-700">
                    Size / Gauge / Specification *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 20 Gauge (Pink), 5 CC, 500ml Bottle"
                    value={formSpec}
                    onChange={(e) => setFormSpec(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none font-medium text-slate-900"
                  />
                </div>

                {/* PKG Packs */}
                <div className="space-y-1">
                  <label className="block font-bold text-slate-700">
                    PKG Packs (Boxes Purchased) *
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={formPkgPacks}
                    onChange={(e) => setFormPkgPacks(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none font-mono font-bold text-slate-900"
                  />
                </div>

                {/* Nos Per Pack */}
                <div className="space-y-1">
                  <label className="block font-bold text-slate-700">
                    Nos Per Pack (Units in each box) *
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={formNosPerPack}
                    onChange={(e) => setFormNosPerPack(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none font-mono font-bold text-slate-900"
                  />
                </div>

                {/* Cost Per Pack */}
                <div className="space-y-1">
                  <label className="block font-bold text-slate-700">
                    Cost Per Pack / Box (Rs.) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={formPerPackCost}
                    onChange={(e) => setFormPerPackCost(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none font-mono font-bold text-slate-900"
                  />
                </div>

                {/* Selling Price Per Tab / Unit */}
                <div className="space-y-1">
                  <label className="block font-bold text-slate-700">
                    Selling Price Per Tab/Unit (Rs.) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={formSellingPrice}
                    onChange={(e) => setFormSellingPrice(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none font-mono font-bold text-emerald-700"
                  />
                </div>

                {/* Batch No */}
                <div className="space-y-1">
                  <label className="block font-bold text-slate-700">
                    Batch Number *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. CAN-20G-2606"
                    value={formBatchNo}
                    onChange={(e) => setFormBatchNo(e.target.value.toUpperCase())}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none font-mono font-bold text-slate-900"
                  />
                </div>

                {/* Expiry Date */}
                <div className="space-y-1">
                  <label className="block font-bold text-slate-700">
                    Expiry Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={formExpiryDate}
                    onChange={(e) => setFormExpiryDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none font-bold text-slate-900"
                  />
                </div>
              </div>

              {/* Credit Status Toggle */}
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between">
                <div>
                  <span className="font-bold text-slate-900 block">Purchase Payment Status</span>
                  <span className="text-[11px] text-slate-500">
                    Mark whether this purchase was made on credit or paid in full via cash
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

              {/* Live Calculation Preview Strip */}
              <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl border border-blue-200 space-y-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-blue-900 block">
                  Real-Time Auto-Calculations
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-slate-700 font-mono text-[11px]">
                  <div>
                    <span className="text-slate-500 block text-[9px] uppercase font-bold">Qty Pur:</span>
                    <strong className="text-blue-900 text-xs">{calcQtyPurchased} units</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[9px] uppercase font-bold">Cost/Tab:</span>
                    <strong className="text-slate-900 text-xs">Rs. {calcPerUnitCost.toFixed(2)}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[9px] uppercase font-bold">Total Cost:</span>
                    <strong className="text-amber-900 text-xs">Rs. {calcTotalCost.toLocaleString()}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[9px] uppercase font-bold">T.Value:</span>
                    <strong className="text-indigo-950 text-xs">Rs. {calcTotalValue.toLocaleString()}</strong>
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
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-md transition-all active:scale-[0.98] disabled:opacity-50"
                >
                  {formSubmitting ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>{editingItem ? "Update Stock Record" : "Save Stock Purchase"}</span>
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
                Delete Stock Purchase Entry?
              </h4>
              <p className="text-xs text-slate-500 mt-1">
                This will remove the item from the hospital procurement sheet. This action is irreversible.
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


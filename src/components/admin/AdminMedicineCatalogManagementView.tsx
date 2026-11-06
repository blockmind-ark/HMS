"use client";

import React, { useState, useEffect } from "react";
import {
  Pill,
  Search,
  Percent,
  Sliders,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Edit2,
  Package,
  Layers,
  Banknote,
  X,
  Save,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

interface AdminMedicineItem {
  id: string;
  name: string;
  genericName: string;
  category: string;
  itemType: string;
  threshold: number;
  perOff: number;
  totalStock: number;
  isLowStock: boolean;
  sellingPrice: number;
  discountedPrice?: number;
  purchasePrice: number;
  activeBatchNumber: string;
  batchCount: number;
}

export function AdminMedicineCatalogManagementView() {
  const [medicines, setMedicines] = useState<AdminMedicineItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const pageSize = 6;
  const [editingMed, setEditingMed] = useState<AdminMedicineItem | null>(null);
  const [saving, setSaving] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);

  // Form State for Editing
  const [editForm, setEditForm] = useState({
    perOff: "0",
    sellingPrice: "0",
    purchasePrice: "0",
    threshold: "10",
  });

  const fetchMedicines = async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/admin/medicines?query=${encodeURIComponent(
          searchQuery
        )}&category=${encodeURIComponent(selectedCategory)}`
      );
      if (res.ok) {
        const data = await res.json();
        setMedicines(data.medicines || []);
      }
    } catch (e) {
      console.error("Failed to load admin medicines catalog", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setCurrentPage(1);
    fetchMedicines();
  }, [searchQuery, selectedCategory]);

  const totalPages = Math.max(1, Math.ceil(medicines.length / pageSize));
  const paginatedMedicines = medicines.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const handleOpenEdit = (med: AdminMedicineItem) => {
    setEditingMed(med);
    setEditForm({
      perOff: String(med.perOff ?? 0),
      sellingPrice: String(med.sellingPrice ?? 0),
      purchasePrice: String(med.purchasePrice ?? 0),
      threshold: String(med.threshold ?? 10),
    });
  };

  const handleSaveDynamicPerOff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMed) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/medicines/${editingMed.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          perOff: editForm.perOff,
          sellingPrice: editForm.sellingPrice,
          purchasePrice: editForm.purchasePrice,
          threshold: editForm.threshold,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setNotification(`Successfully updated ${editingMed.name} with ${editForm.perOff}% Per-Off discount!`);
        setEditingMed(null);
        fetchMedicines();
        setTimeout(() => setNotification(null), 4000);
      } else {
        alert(data.error || "Failed to update medicine per-off");
      }
    } catch (err: any) {
      alert(err.message || "Network error");
    } finally {
      setSaving(false);
    }
  };

  const categories = ["All", ...Array.from(new Set(medicines.map((m) => m.category))).filter(Boolean)];

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* Toast Notification */}
      {notification && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl flex items-center justify-between shadow-sm animate-in slide-in-from-top duration-200">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            <span className="text-xs font-bold">{notification}</span>
          </div>
          <button
            onClick={() => setNotification(null)}
            className="text-emerald-600 hover:text-emerald-900 font-bold text-xs"
          >
            ✕
          </button>
        </div>
      )}

      {/* Header & Controls */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <div className="p-2 bg-purple-50 text-purple-700 rounded-xl">
                <Sliders className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                  <span>Dispensary POS Catalog &amp; Dynamic &ldquo;Per Off&rdquo; Control</span>
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-800">
                    Direct Admin Control
                  </span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Directly modify percentage-off (Per Off), selling prices, and alert thresholds for any medicine without workflow gates.
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchMedicines}
              disabled={loading}
              className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors"
            >
              <RotateCcw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
              <span>Refresh Catalog</span>
            </button>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
          <div className="sm:col-span-8 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search medicine brand, generic name, or active batch..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          <div className="sm:col-span-4">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              {categories.map((c) => (
                <option key={c} value={c}>
                  Category: {c}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Catalog Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-purple-600" />
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Active POS Medicines Catalog ({medicines.length} Items)
            </h4>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 font-medium">
              Page {currentPage} of {totalPages} &middot; Showing 6 items per page
            </span>
          </div>
        </div>

        <div className="w-full overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700 border-collapse">
            <thead className="bg-slate-100 text-[11px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-200">
              <tr>
                <th className="px-3.5 py-3">Medicine &amp; Generic</th>
                <th className="px-3 py-3">Category</th>
                <th className="px-3 py-3">Stock / Alert</th>
                <th className="px-3 py-3">Cost Price</th>
                <th className="px-3 py-3">Retail Price</th>
                <th className="px-3 py-3">Per Off (%)</th>
                <th className="px-3 py-3">Discounted Net Price</th>
                <th className="px-3 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedMedicines.map((m) => {
                const offPrice =
                  m.discountedPrice ??
                  (m.perOff > 0
                    ? Number((m.sellingPrice * (1 - m.perOff / 100)).toFixed(2))
                    : m.sellingPrice);

                return (
                  <tr key={m.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-3.5 py-3">
                      <div className="font-extrabold text-slate-900">{m.name}</div>
                      <div className="text-[11px] text-slate-500 italic">{m.genericName}</div>
                    </td>
                    <td className="px-3 py-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700 whitespace-nowrap">
                        {m.category}
                      </span>
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`font-black ${
                            m.isLowStock ? "text-red-600" : "text-slate-900"
                          }`}
                        >
                          {m.totalStock} units
                        </span>
                        {m.isLowStock && (
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-black bg-red-100 text-red-800">
                            Low
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-slate-400 font-medium mt-0.5">
                        Alert at &le; {m.threshold}
                      </div>
                    </td>
                    <td className="px-3 py-3 text-slate-500 font-mono whitespace-nowrap">
                      Rs. {m.purchasePrice}
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap">
                      {m.perOff > 0 ? (
                        <div>
                          <span className="text-slate-400 line-through font-mono text-[11px]">
                            Rs. {m.sellingPrice}
                          </span>
                        </div>
                      ) : (
                        <div className="font-bold text-slate-900 font-mono">
                          Rs. {m.sellingPrice}
                        </div>
                      )}
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-black ${
                          m.perOff > 0
                            ? "bg-purple-100 text-purple-800 border border-purple-200"
                            : "bg-slate-100 text-slate-500"
                        }`}
                      >
                        <Percent className="w-3 h-3" />
                        <span>{m.perOff || 0}% Off</span>
                      </span>
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap">
                      {m.perOff > 0 ? (
                        <div className="font-black text-emerald-700 font-mono text-xs sm:text-sm">
                          Rs. {offPrice.toLocaleString()}
                        </div>
                      ) : (
                        <div className="font-bold text-slate-800 font-mono text-xs">
                          Rs. {m.sellingPrice.toLocaleString()}
                        </div>
                      )}
                    </td>
                    <td className="px-3 py-3 text-right whitespace-nowrap">
                      <button
                        onClick={() => handleOpenEdit(m)}
                        className="px-3 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-xl text-xs font-bold border border-purple-200 transition-colors inline-flex items-center gap-1.5"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                        <span>Edit Per Off</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
              {medicines.length === 0 && !loading && (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-400 text-xs">
                    No medicines matching your search query.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar - Showing only 6 items per page with easy navigation */}
        {medicines.length > 0 && (
          <div className="p-3.5 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <span className="text-slate-500 font-medium">
              Showing {(currentPage - 1) * pageSize + 1} to{" "}
              {Math.min(currentPage * pageSize, medicines.length)} of {medicines.length} medicines
            </span>

            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white font-bold text-slate-700 hover:bg-slate-100 disabled:opacity-40 transition-colors flex items-center gap-1"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>Prev</span>
              </button>
              <span className="px-3 py-1.5 font-bold text-purple-700 bg-purple-50 rounded-xl border border-purple-200">
                {currentPage} / {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white font-bold text-slate-700 hover:bg-slate-100 disabled:opacity-40 transition-colors flex items-center gap-1"
              >
                <span>Next</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Dynamic Edit Modal */}
      {editingMed && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-100">
            <div className="p-5 bg-gradient-to-r from-purple-900 to-indigo-950 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Sliders className="w-5 h-5 text-purple-400" />
                <div>
                  <h3 className="text-sm font-bold">Dynamic Per Off &amp; Pricing Control</h3>
                  <p className="text-[11px] text-purple-200">
                    {editingMed.name} ({editingMed.genericName})
                  </p>
                </div>
              </div>
              <button
                onClick={() => setEditingMed(null)}
                className="text-purple-300 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveDynamicPerOff} className="p-6 space-y-4">
              <div className="p-3 bg-purple-50 border border-purple-200 rounded-xl text-purple-900 text-xs">
                <strong>Immediate Direct Update:</strong> Changes will be committed directly to the medicine master and its active batches with immediate effect in Pharmacy POS.
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                  Per Off (%) / Discount Rate *
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    max="100"
                    required
                    value={editForm.perOff}
                    onChange={(e) => setEditForm({ ...editForm, perOff: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                  <span className="absolute right-3 top-2 text-[11px] text-slate-400 font-bold">%</span>
                </div>
                <p className="text-[10px] text-slate-500 mt-1">
                  Defines the default retail discount percentage applied to this medicine at checkout.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                    Selling Price (Rs.) *
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    required
                    value={editForm.sellingPrice}
                    onChange={(e) => setEditForm({ ...editForm, sellingPrice: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                    Purchase Cost (Rs.) *
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    required
                    value={editForm.purchasePrice}
                    onChange={(e) => setEditForm({ ...editForm, purchasePrice: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                  Low-Stock Warning Threshold (Units) *
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  value={editForm.threshold}
                  onChange={(e) => setEditForm({ ...editForm, threshold: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingMed(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold shadow-md shadow-purple-600/20 disabled:opacity-50 flex items-center gap-1.5"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{saving ? "Saving..." : "Save & Apply Directly"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}


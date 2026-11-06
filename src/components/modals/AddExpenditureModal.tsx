"use client";

import React, { useState } from "react";
import {
  X,
  Receipt,
  AlertCircle,
  FileText,
  Banknote,
  Tag,
  CheckCircle2,
} from "lucide-react";

interface AddExpenditureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  portal: "RECEPTION" | "PHARMACY";
}

const EXPENDITURE_CATEGORIES = [
  "Vendor Payment",
  "Other",
  "Utility Bills (Electricity, Gas, Internet)",
  "Office Supplies & Stationery",
  "Maintenance & Clinic Repairs",
  "Medical Consumables & Sanitizers",
  "Tea, Drinking Water & Refreshments",
  "Staff Travel & Petty Cash",
  "Courier & Delivery Charges",
  "Miscellaneous Petty Expense",
];

export function AddExpenditureModal({
  isOpen,
  onClose,
  onSuccess,
  portal,
}: AddExpenditureModalProps) {
  const [amount, setAmount] = useState<string>("");
  const [category, setCategory] = useState<string>(EXPENDITURE_CATEGORIES[0]);
  const [remarks, setRemarks] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setError("Please enter a valid positive expenditure amount (Rs.).");
      return;
    }

    if (!category.trim()) {
      setError("Please select a category.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/expenditures", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          portal,
          amount: numAmount,
          category: category.trim(),
          remarks: remarks.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to log expenditure.");
      }

      onSuccess();
      onClose();
      // Reset form
      setAmount("");
      setRemarks("");
      setCategory(EXPENDITURE_CATEGORIES[0]);
    } catch (err: any) {
      setError(err?.message || "Failed to record expense.");
    } finally {
      setLoading(false);
    }
  };

  const portalLabel = portal === "RECEPTION" ? "Reception Counter" : "Dispensary POS";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-100 animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-slate-900 to-rose-950 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-rose-500/20 text-rose-300 flex items-center justify-center">
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold">Cash Out (Expense / Payment)</h3>
              <p className="text-xs text-slate-400">{portalLabel} • No admin approval required</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Amount Field */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Expense Amount (Rs. PKR) *
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                Rs.
              </span>
              <input
                type="number"
                step="any"
                min="1"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="e.g. 850"
                className="w-full pl-10 pr-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500 font-bold text-slate-900"
              />
            </div>
          </div>

          {/* Preset Buttons */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[10px] text-slate-400 font-bold uppercase">
              Quick:
            </span>
            {[200, 500, 1000, 1500, 2500].map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => setAmount(String(preset))}
                className="px-2 py-0.5 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[11px] border border-slate-200 transition-colors"
              >
                Rs. {preset.toLocaleString()}
              </button>
            ))}
          </div>

          {/* Category Dropdown */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Expense Category *
            </label>
            <select
              required
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500 font-semibold text-slate-800"
            >
              {EXPENDITURE_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Remarks Field */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Remarks &amp; Receipt Note
            </label>
            <textarea
              rows={2}
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="e.g. Purchased 2 printer ribbon cartridges and printing paper"
              className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500 text-slate-800"
            />
          </div>

          <div className="p-3 bg-rose-50 border border-rose-100 rounded-xl text-[11px] text-rose-800">
            <strong>Drawer Impact:</strong> This cash out expense will be deducted
            directly from today&apos;s cash drawer balance. No admin approval required.
          </div>

          {/* Footer Actions */}
          <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-md shadow-rose-600/20 transition-all flex items-center gap-1.5 disabled:opacity-50"
            >
              {loading ? (
                <span>Recording Cash Out...</span>
              ) : (
                <>
                  <Receipt className="w-4 h-4" />
                  <span>Confirm &amp; Record Cash Out</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}


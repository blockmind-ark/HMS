"use client";

import React, { useState } from "react";
import {
  X,
  PlusCircle,
  MinusCircle,
  Banknote,
  AlertCircle,
  FileText,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";

interface DrawerAdjustmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  mode?: "CASH_IN" | "CASH_OUT" | "BOTH";
}

export function DrawerAdjustmentModal({
  isOpen,
  onClose,
  onSuccess,
  mode = "CASH_IN",
}: DrawerAdjustmentModalProps) {
  const [type, setType] = useState<"CASH_IN" | "CASH_OUT">(
    mode === "CASH_OUT" ? "CASH_OUT" : "CASH_IN"
  );
  const [amount, setAmount] = useState<string>("");
  const [remarks, setRemarks] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const activeType = mode === "CASH_IN" ? "CASH_IN" : mode === "CASH_OUT" ? "CASH_OUT" : type;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setError("Please enter a valid positive adjustment amount (Rs.).");
      return;
    }

    if (!remarks.trim()) {
      setError("Please provide a reason/remark for this drawer adjustment.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/receptionist/drawer-adjustments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: activeType,
          amount: numAmount,
          remarks: remarks.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to submit drawer adjustment.");
      }

      onSuccess();
      onClose();
      // Reset form
      setAmount("");
      setRemarks("");
      setType(mode === "CASH_OUT" ? "CASH_OUT" : "CASH_IN");
    } catch (err: any) {
      setError(err?.message || "Failed to submit request.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-100 animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-slate-900 to-emerald-950 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-300 flex items-center justify-center">
              <Banknote className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold">
                {activeType === "CASH_IN" ? "Cash In (Add Cash to Drawer)" : "Cash Out (Withdraw Cash)"}
              </h3>
              <p className="text-xs text-slate-400">
                Directly added to drawer • No admin approval required
              </p>
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

          {/* Type Selector Tabs (Only shown if mode === 'BOTH') */}
          {mode === "BOTH" ? (
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-2">
                Adjustment Type
              </label>
              <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-xl border border-slate-200">
                <button
                  type="button"
                  onClick={() => setType("CASH_IN")}
                  className={`py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                    type === "CASH_IN"
                      ? "bg-emerald-600 text-white shadow-sm"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <ArrowDownRight className="w-4 h-4" />
                  <span>Cash In (Float Addition)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setType("CASH_OUT")}
                  className={`py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                    type === "CASH_OUT"
                      ? "bg-amber-600 text-white shadow-sm"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <ArrowUpRight className="w-4 h-4" />
                  <span>Cash Out (Withdrawal)</span>
                </button>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                {type === "CASH_IN"
                  ? "Adds cash float to your drawer (e.g. morning change float or cash infusion)."
                  : "Removes cash from the drawer (e.g. petty cash drop, vendor cash payment)."}
              </p>
            </div>
          ) : (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 text-emerald-900 text-xs font-semibold">
              <ArrowDownRight className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span>Mode: <strong>Cash In</strong> (Directly adds float/cash to active drawer)</span>
            </div>
          )}

          {/* Amount Field */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Amount (Rs. PKR) *
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
                placeholder="e.g. 5000"
                className="w-full pl-10 pr-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-bold text-slate-900"
              />
            </div>
          </div>

          {/* Common Preset Buttons */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[10px] text-slate-400 font-bold uppercase">
              Quick:
            </span>
            {[500, 1000, 2000, 5000, 10000].map((preset) => (
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

          {/* Remarks Field */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Reason &amp; Remarks *
            </label>
            <textarea
              required
              rows={3}
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="e.g. Added Rs. 5,000 morning change float / Handed Rs. 1,000 for emergency clinic supplies"
              className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800"
            />
          </div>

          {/* Direct approval notice */}
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-[11px] text-emerald-800 flex items-start gap-2">
            <ArrowDownRight className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">Instant Record:</span> This cash float is
              directly added and recorded to your counter drawer balance. No administrator approval required.
            </div>
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
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-600/20 transition-all flex items-center gap-1.5 disabled:opacity-50"
            >
              {loading ? (
                <span>Recording Cash In...</span>
              ) : (
                <>
                  <PlusCircle className="w-4 h-4" />
                  <span>Confirm &amp; Add Cash In</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}


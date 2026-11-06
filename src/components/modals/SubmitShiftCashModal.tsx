"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  Banknote,
  AlertCircle,
  CheckCircle2,
  Lock,
  ArrowRight,
  Send,
  Sparkles,
} from "lucide-react";

interface SubmitShiftCashModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  shiftDate: string;
  systemCash: number;
  initialCash?: number;
  initialNotes?: string;
  isExistingSubmission?: boolean;
  portal?: "RECEPTION" | "PHARMACY";
}

export function SubmitShiftCashModal({
  isOpen,
  onClose,
  onSuccess,
  shiftDate,
  systemCash,
  initialCash,
  initialNotes = "",
  isExistingSubmission = false,
  portal = "RECEPTION",
}: SubmitShiftCashModalProps) {
  const [countedCash, setCountedCash] = useState<string>(
    initialCash !== undefined && initialCash > 0 ? String(initialCash) : ""
  );
  const [notes, setNotes] = useState<string>(initialNotes);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialCash !== undefined && initialCash > 0) {
      setCountedCash(String(initialCash));
    } else {
      setCountedCash("");
    }
    setNotes(initialNotes || "");
    setError(null);
  }, [isOpen, initialCash, initialNotes]);

  if (!isOpen) return null;

  const numericCounted = parseFloat(countedCash) || 0;
  const variance = numericCounted - systemCash;
  const isBalanced = numericCounted > 0 && variance === 0;
  const isShortage = numericCounted > 0 && variance < 0;
  const isSurplus = numericCounted > 0 && variance > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (isNaN(numericCounted) || numericCounted < 0) {
      setError("Please enter a valid cash amount counted in the drawer.");
      return;
    }

    setLoading(true);
    try {
      const endpoint =
        portal === "PHARMACY"
          ? "/api/pharmacist/accountability/close"
          : "/api/receptionist/accountability/close";

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          countedCash: numericCounted,
          notes: notes.trim() || undefined,
          shiftDate,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to submit shift cash.");
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err?.message || "Failed to submit cash to administrator.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-100 animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-500/20 text-blue-300 flex items-center justify-center">
              <Banknote className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold">
                Submit Counter Cash to Admin
              </h3>
              <p className="text-xs text-slate-400">
                Reception Counter Shift • {shiftDate}
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

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* System Expected Banner */}
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                System Calculated Total Cash
              </span>
              <span className="text-base font-black text-slate-900 font-mono">
                Rs. {systemCash.toLocaleString()}
              </span>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-800 border border-blue-200 flex items-center gap-1">
              <Lock className="w-3 h-3 text-blue-600" />
              <span>Audit Target</span>
            </span>
          </div>

          {/* Counted Cash Input */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Physical Cash Amount in Counter (Rs. PKR) *
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                Rs.
              </span>
              <input
                type="number"
                min="0"
                step="1"
                required
                autoFocus
                placeholder="e.g. 5000"
                value={countedCash}
                onChange={(e) => setCountedCash(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-white border-2 border-indigo-500 rounded-xl text-base font-black text-slate-900 focus:outline-none focus:ring-4 focus:ring-indigo-500/20 shadow-sm"
              />
            </div>
          </div>

          {/* Quick Shortcuts */}
          <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
            <span className="text-[10px] font-bold text-slate-400 uppercase">Quick:</span>
            <button
              type="button"
              onClick={() => setCountedCash(String(systemCash))}
              className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-100 transition-colors"
            >
              Exact Match (Rs. {systemCash.toLocaleString()})
            </button>
            {[500, 1000, 2000, 5000].map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() =>
                  setCountedCash(String((parseFloat(countedCash) || 0) + preset))
                }
                className="px-2 py-0.5 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[10px] border border-slate-200 transition-colors"
              >
                +{preset.toLocaleString()}
              </button>
            ))}
          </div>

          {/* Variance Status Strip */}
          {countedCash && (
            <div className="pt-1">
              {isBalanced ? (
                <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-bold flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                    <span>Drawer Exactly Balanced (Rs. 0 Variance)</span>
                  </div>
                  <span className="font-mono text-emerald-900 font-black">Matched</span>
                </div>
              ) : isShortage ? (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs font-bold flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                    <span>Cash Shortage:</span>
                  </div>
                  <span className="font-mono text-rose-900 font-black">
                    -Rs. {Math.abs(variance).toLocaleString()}
                  </span>
                </div>
              ) : isSurplus ? (
                <div className="p-3 bg-blue-50 border border-blue-200 text-blue-800 rounded-xl text-xs font-bold flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-blue-600 flex-shrink-0" />
                    <span>Cash Surplus (Overage):</span>
                  </div>
                  <span className="font-mono text-blue-900 font-black">
                    +Rs. {variance.toLocaleString()}
                  </span>
                </div>
              ) : null}
            </div>
          )}

          {/* Notes / Handover Remarks */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Handover Remarks / Notes
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Physical cash counted and handed over to supervisor."
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 font-medium"
            />
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
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-600/20 transition-all flex items-center gap-1.5 disabled:opacity-50"
            >
              {loading ? (
                <span>Submitting to Admin...</span>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  <span>Submit to Admin</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}


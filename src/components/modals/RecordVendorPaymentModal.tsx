"use client";

import React, { useState, useEffect } from "react";
import {
  Banknote,
  X,
  CreditCard,
  Building2,
  Calendar,
  FileText,
  AlertCircle,
  RefreshCw,
  CheckCircle2,
} from "lucide-react";

export function RecordVendorPaymentModal({
  vendors,
  selectedVendorId,
  selectedPoId,
  isOpen,
  onClose,
  onSuccess,
}: {
  vendors: any[];
  selectedVendorId?: string;
  selectedPoId?: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (payment: any) => void;
}) {
  const [vendorId, setVendorId] = useState(selectedVendorId || "");
  const [purchaseOrderId, setPurchaseOrderId] = useState(selectedPoId || "");
  const [amount, setAmount] = useState<string>("");
  const [paymentMethod, setPaymentMethod] = useState<string>("Cash");
  const [referenceNumber, setReferenceNumber] = useState<string>("");
  const [paymentDate, setPaymentDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [notes, setNotes] = useState<string>("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (selectedVendorId) setVendorId(selectedVendorId);
    if (selectedPoId) setPurchaseOrderId(selectedPoId);
  }, [selectedVendorId, selectedPoId, isOpen]);

  if (!isOpen) return null;

  const currentVendor = vendors.find((v) => v.id === vendorId);
  const availablePos = (currentVendor?.purchaseOrders || []).filter(
    (po: any) => po.paymentStatus !== "PAID"
  );
  const currentPo = availablePos.find((po: any) => po.id === purchaseOrderId);

  // Auto-fill amount helper
  const handleSelectPo = (poId: string) => {
    setPurchaseOrderId(poId);
    if (poId) {
      const found = availablePos.find((p: any) => p.id === poId);
      if (found) {
        const remainingOnPo = Math.max(0, found.totalAmount - (found.paidAmount || 0));
        setAmount(String(remainingOnPo));
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vendorId) {
      setError("Please select a vendor.");
      return;
    }
    const num = parseFloat(amount);
    if (isNaN(num) || num <= 0) {
      setError("Please enter a valid positive payment amount.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/vendors/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vendorId,
          purchaseOrderId: purchaseOrderId || null,
          amount: num,
          paymentMethod,
          referenceNumber: referenceNumber || null,
          paymentDate,
          notes: notes || null,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        onSuccess(data.payment);
        onClose();
      } else {
        setError(data.error || "Failed to record vendor payment.");
      }
    } catch (err: any) {
      setError(err.message || "Network error submitting payment.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-100 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-400/30">
              <Banknote className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold">Record Vendor Payment</h3>
              <p className="text-[11px] text-slate-400">
                Disburse payment against purchase order or general dues
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* 1. Select Vendor */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              Select Supplier / Vendor *
            </label>
            <select
              value={vendorId}
              onChange={(e) => {
                setVendorId(e.target.value);
                setPurchaseOrderId("");
              }}
              required
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="">-- Choose Vendor --</option>
              {vendors.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.name} (Outstanding: Rs. {v.balance.toLocaleString()})
                </option>
              ))}
            </select>
          </div>

          {/* Vendor Balance Badge (if selected) */}
          {currentVendor && (
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between text-xs">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">
                  Current Vendor Balance Due:
                </span>
                <span className="font-extrabold text-slate-900 font-mono text-sm">
                  Rs. {currentVendor.balance.toLocaleString()}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setAmount(String(Math.max(0, currentVendor.balance)))}
                className="px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 rounded-lg text-[10px] font-bold"
              >
                Pay Total Balance
              </button>
            </div>
          )}

          {/* 2. Optional: Select Purchase Order */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Purchase Order (Optional)
              </label>
              <span className="text-[10px] text-slate-400">Leave blank for general dues</span>
            </div>
            <select
              value={purchaseOrderId}
              onChange={(e) => handleSelectPo(e.target.value)}
              disabled={!vendorId}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-50"
            >
              <option value="">-- General Account Balance (No PO) --</option>
              {availablePos.map((po: any) => {
                const due = po.totalAmount - (po.paidAmount || 0);
                return (
                  <option key={po.id} value={po.id}>
                    {po.poNumber} — Due: Rs. {due.toLocaleString()} (Status: {po.paymentStatus})
                  </option>
                );
              })}
            </select>
          </div>

          {/* 3. Payment Amount (Rs.) */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Payment Amount (Rs.) *
              </label>
              <span className="text-[10px] font-mono text-emerald-700 font-bold">PKR Currency</span>
            </div>
            <input
              type="number"
              min="1"
              step="1"
              required
              placeholder="e.g. 25000"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full bg-white border-2 border-emerald-400 focus:border-emerald-600 rounded-xl px-3.5 py-2.5 text-base font-black text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-400/50 shadow-inner"
            />
          </div>

          {/* 4. Payment Method & Date Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Payment Method *
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="Cash">Cash (Physical Currency)</option>
                <option value="Raast">Raast Instant P2P / Merchant</option>
                <option value="Bank Transfer">Bank Transfer (IBFT)</option>
                <option value="Cheque">Bank Cheque / Draft</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Disbursement Date *
              </label>
              <input
                type="date"
                required
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* 5. Reference / Transaction Number */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              Reference / Transaction ID / Cheque #
            </label>
            <input
              type="text"
              placeholder="e.g. HBL-FT-948294 or Cheque # 0492812"
              value={referenceNumber}
              onChange={(e) => setReferenceNumber(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* 6. Receipt / Payment Notes */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              Payment Remarks / Notes
            </label>
            <textarea
              rows={2}
              placeholder="e.g. Cleared full invoice for Batch AMX-2026, receipt handed to representative"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Actions */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs shadow-md shadow-emerald-600/20 disabled:opacity-50 flex items-center gap-1.5"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Recording...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Confirm &amp; Disburse Payment</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}


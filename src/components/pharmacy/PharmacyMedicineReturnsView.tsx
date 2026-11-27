"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  RotateCcw,
  Search,
  Receipt,
  AlertTriangle,
  CheckCircle2,
  X,
  Plus,
  Trash2,
  Printer,
  History,
  FileText,
  User,
  Phone,
  Calendar,
  Layers,
  ArrowRight,
  ShieldCheck,
  Building2,
  Minus,
} from "lucide-react";
import {
  ThermalReturnReceiptModal,
  ReturnReceiptData,
} from "@/components/receipts/ThermalReturnReceiptModal";

interface ReturnItemPayload {
  medicineId: string;
  medicineName: string;
  batchId?: string | null;
  batchNumber?: string;
  quantityReturned: number;
  unitPrice: number;
  maxReturnable?: number;
}

export function PharmacyMedicineReturnsView({ onStockUpdated }: { onStockUpdated?: () => void }) {
  const [returnMode, setReturnMode] = useState<"INVOICE" | "DIRECT">("INVOICE");

  // Flow A: Invoice Lookup
  const [invoiceQuery, setInvoiceQuery] = useState("");
  const [lookupLoading, setLookupLoading] = useState(false);
  const [lookupError, setLookupError] = useState<string | null>(null);
  const [lookedUpSale, setLookedUpSale] = useState<any | null>(null);

  // Return Form State
  const [returnItems, setReturnItems] = useState<ReturnItemPayload[]>([]);
  const [typedQuantities, setTypedQuantities] = useState<Record<string, string>>({});
  const [returnReason, setReturnReason] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Thermal Receipt Modal State
  const [thermalReceiptModalOpen, setThermalReceiptModalOpen] = useState(false);
  const [activeReceiptData, setActiveReceiptData] = useState<ReturnReceiptData | null>(null);

  // Flow B: Direct Catalog Search State
  const [directSearchQuery, setDirectSearchQuery] = useState("");
  const [directSearchResults, setDirectSearchResults] = useState<any[]>([]);
  const [searchingDirect, setSearchingDirect] = useState(false);

  // Returns History State
  const [returnsHistory, setReturnsHistory] = useState<any[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historySearch, setHistorySearch] = useState("");
  const [selectedReturnReceipt, setSelectedReturnReceipt] = useState<any | null>(null);

  // Load returns history on mount
  useEffect(() => {
    fetchReturnsHistory();
  }, []);

  const fetchReturnsHistory = async (search = "") => {
    setHistoryLoading(true);
    try {
      const res = await fetch(`/api/pharmacy/returns?search=${encodeURIComponent(search)}`);
      const data = await res.json();
      if (res.ok) {
        setReturnsHistory(data.returns || []);
      }
    } catch (err) {
      console.error("Failed to load returns history:", err);
    } finally {
      setHistoryLoading(false);
    }
  };

  // Flow A: Lookup Sale
  const handleLookupSale = async () => {
    if (!invoiceQuery.trim()) return;
    setLookupLoading(true);
    setLookupError(null);
    setLookedUpSale(null);
    setReturnItems([]);

    try {
      const res = await fetch(
        `/api/pharmacy/returns/lookup-sale?query=${encodeURIComponent(invoiceQuery.trim())}`
      );
      const data = await res.json();

      if (!res.ok) {
        setLookupError(data.error || "Sale invoice not found");
      } else {
        setLookedUpSale(data.sale);
        setCustomerName(data.sale.patient?.name || "");
        setCustomerPhone(data.sale.patient?.phone || "");
      }
    } catch (err: any) {
      setLookupError(err.message || "Network error while searching invoice");
    } finally {
      setLookupLoading(false);
    }
  };

  // Toggle item in invoice return cart
  const toggleInvoiceItem = (item: any) => {
    const existingIndex = returnItems.findIndex((it) => it.medicineId === item.medicineId);
    if (existingIndex >= 0) {
      setReturnItems(returnItems.filter((_, idx) => idx !== existingIndex));
    } else {
      if (item.returnableQuantity <= 0) return;
      setReturnItems([
        ...returnItems,
        {
          medicineId: item.medicineId,
          medicineName: item.medicineName,
          batchId: item.batchId,
          batchNumber: item.batchNumber,
          quantityReturned: 1,
          unitPrice: item.unitPrice,
          maxReturnable: item.returnableQuantity,
        },
      ]);
    }
  };

  // Flow B: Direct Search
  const handleDirectSearch = async () => {
    if (!directSearchQuery.trim()) return;
    setSearchingDirect(true);
    try {
      const res = await fetch(`/api/pharmacist/medicines?search=${encodeURIComponent(directSearchQuery.trim())}`);
      const data = await res.json();
      if (res.ok) {
        setDirectSearchResults(data.medicines || []);
      }
    } catch (err) {
      console.error("Direct medicine search error:", err);
    } finally {
      setSearchingDirect(false);
    }
  };

  const addDirectItem = (med: any) => {
    const existing = returnItems.find((it) => it.medicineId === med.id);
    if (existing) return;

    setReturnItems([
      ...returnItems,
      {
        medicineId: med.id,
        medicineName: med.name,
        batchId: med.batchId || null,
        batchNumber: med.batchNumber || "RET-STOCK",
        quantityReturned: 1,
        unitPrice: med.sellingPrice || 0,
      },
    ]);
  };

  // Quantity changes (+/- buttons and direct numeric typing)
  const updateReturnQuantity = (medicineId: string, delta: number) => {
    setTypedQuantities((prev) => {
      const copy = { ...prev };
      delete copy[medicineId];
      return copy;
    });

    setReturnItems((prev) =>
      prev.map((it) => {
        if (it.medicineId !== medicineId) return it;
        let nextQty = it.quantityReturned + delta;
        if (nextQty <= 0) return it;
        if (it.maxReturnable !== undefined && nextQty > it.maxReturnable) {
          nextQty = it.maxReturnable;
        }
        return { ...it, quantityReturned: nextQty };
      })
    );
  };

  const handleTypedReturnQuantityChange = (medicineId: string, rawVal: string, maxReturnable?: number) => {
    setTypedQuantities((prev) => ({ ...prev, [medicineId]: rawVal }));

    const num = parseInt(rawVal, 10);
    if (!isNaN(num) && num >= 1) {
      let clamped = num;
      if (maxReturnable !== undefined && clamped > maxReturnable) {
        clamped = maxReturnable;
      }
      setReturnItems((prev) =>
        prev.map((it) => (it.medicineId === medicineId ? { ...it, quantityReturned: clamped } : it))
      );
    }
  };

  const handleTypedReturnQuantityBlur = (medicineId: string, maxReturnable?: number) => {
    const rawVal = typedQuantities[medicineId];
    let num = parseInt(rawVal || "1", 10);
    if (isNaN(num) || num < 1) num = 1;
    if (maxReturnable !== undefined && num > maxReturnable) num = maxReturnable;

    setTypedQuantities((prev) => {
      const copy = { ...prev };
      delete copy[medicineId];
      return copy;
    });

    setReturnItems((prev) =>
      prev.map((it) => (it.medicineId === medicineId ? { ...it, quantityReturned: num } : it))
    );
  };

  const updateReturnUnitPrice = (medicineId: string, price: number) => {
    setReturnItems((prev) =>
      prev.map((it) => {
        if (it.medicineId !== medicineId) return it;
        return { ...it, unitPrice: Math.max(0, price) };
      })
    );
  };

  const removeReturnItem = (medicineId: string) => {
    setReturnItems((prev) => prev.filter((it) => it.medicineId !== medicineId));
  };

  // Total refund
  const totalRefund = returnItems.reduce(
    (acc, it) => acc + it.quantityReturned * it.unitPrice,
    0
  );

  // Submit Return
  const returnLock = useRef(false);
  const handleSubmitReturn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (returnLock.current) return;
    if (returnItems.length === 0) {
      setSubmitError("Please add at least one item to return.");
      return;
    }
    if (!returnReason.trim()) {
      setSubmitError("Please specify a reason for the return.");
      return;
    }

    returnLock.current = true;
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const payload = {
        saleId: returnMode === "INVOICE" ? lookedUpSale?.id : null,
        invoiceNumber: returnMode === "INVOICE" ? lookedUpSale?.saleNumber : null,
        patientName: customerName.trim() || undefined,
        customerPhone: customerPhone.trim() || undefined,
        reason: returnReason.trim(),
        items: returnItems.map((it) => ({
          medicineId: it.medicineId,
          batchId: it.batchId,
          quantityReturned: it.quantityReturned,
          unitPrice: it.unitPrice,
        })),
      };

      const res = await fetch("/api/pharmacy/returns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to process medicine return");
      }

      const newReturn = data.return;
      setActiveReceiptData({
        returnNumber: newReturn.returnNumber,
        invoiceNumber: newReturn.invoiceNumber,
        createdAt: newReturn.createdAt,
        pharmacistName: newReturn.processedBy?.name || "Pharmacist",
        patientName: newReturn.patientName,
        customerPhone: newReturn.customerPhone,
        reason: newReturn.reason,
        status: newReturn.status,
        items: newReturn.items.map((it: any) => ({
          name: it.medicine?.name || "Medicine",
          quantityReturned: it.quantityReturned,
          unitPrice: it.unitPrice,
          refundSubtotal: it.refundSubtotal,
        })),
        totalRefundAmount: newReturn.totalRefundAmount,
      });
      setThermalReceiptModalOpen(true);
      setReturnItems([]);
      setReturnReason("");
      setLookedUpSale(null);
      setInvoiceQuery("");
      fetchReturnsHistory();
      if (onStockUpdated) onStockUpdated();
    } catch (err: any) {
      setSubmitError(err.message || "Error submitting medicine return");
    } finally {
      returnLock.current = false;
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner / Mode Switcher */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-rose-100 text-rose-700 rounded-xl">
            <RotateCcw className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-black text-slate-900 flex items-center gap-2">
              <span>Dispensary Medicine Returns & Restocking</span>
              <span className="text-[10px] uppercase font-black px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 border border-rose-200">
                Atomic Restock
              </span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Safely process patient returns, restore live stock batches, and issue refund receipts.
            </p>
          </div>
        </div>

        {/* Return Workflow Mode Toggle */}
        <div className="grid grid-cols-2 p-1 bg-slate-100 rounded-xl border border-slate-200 max-w-xs w-full">
          <button
            type="button"
            onClick={() => {
              setReturnMode("INVOICE");
              setReturnItems([]);
              setSubmitError(null);
            }}
            className={`py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              returnMode === "INVOICE"
                ? "bg-white text-slate-900 shadow-xs border border-slate-200"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Receipt className="w-3.5 h-3.5 text-rose-600" />
            <span>By Invoice Lookup</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setReturnMode("DIRECT");
              setReturnItems([]);
              setSubmitError(null);
            }}
            className={`py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              returnMode === "DIRECT"
                ? "bg-white text-slate-900 shadow-xs border border-slate-200"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Layers className="w-3.5 h-3.5 text-amber-600" />
            <span>Direct / Walk-In</span>
          </button>
        </div>
      </div>

      {/* Main Two Column Return Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Lookup / Item Selection (7 Cols) */}
        <div className="lg:col-span-7 space-y-5">
          {returnMode === "INVOICE" ? (
            /* FLOW A: INVOICE LOOKUP */
            <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-4">
              <div className="space-y-1">
                <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                  <Receipt className="w-4 h-4 text-rose-600" />
                  <span>Step 1: Search Original Sales Receipt</span>
                </h3>
                <p className="text-xs text-slate-500">
                  Enter the POS receipt number (e.g., <code>POS-2026-0001</code>) or patient UID.
                </p>
              </div>

              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Enter POS Sale # (POS-2026-XXXX) or Patient UID..."
                    value={invoiceQuery}
                    onChange={(e) => setInvoiceQuery(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleLookupSale();
                      }
                    }}
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono focus:outline-none focus:ring-1 focus:ring-rose-500 text-slate-900"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleLookupSale}
                  disabled={lookupLoading || !invoiceQuery.trim()}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-all disabled:opacity-40 flex items-center gap-1.5 shrink-0"
                >
                  <Search className="w-3.5 h-3.5" />
                  <span>{lookupLoading ? "Searching..." : "Lookup Invoice"}</span>
                </button>
              </div>

              {lookupError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-red-600" />
                  <span>{lookupError}</span>
                </div>
              )}

              {lookedUpSale && (
                <div className="space-y-4 pt-2 border-t border-slate-100">
                  {/* Invoice Header Details */}
                  <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 flex flex-wrap items-center justify-between gap-3 text-xs">
                    <div>
                      <div className="font-extrabold text-slate-900 flex items-center gap-2">
                        <span className="font-mono text-sm text-rose-700">
                          {lookedUpSale.saleNumber}
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold">
                          Paid
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        Date: {new Date(lookedUpSale.createdAt).toLocaleString()} · Billed by:{" "}
                        <strong className="text-slate-700">{lookedUpSale.cashier}</strong>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 block uppercase font-bold">
                        Sale Total
                      </span>
                      <span className="font-mono font-extrabold text-sm text-slate-900">
                        Rs. {lookedUpSale.totalAmount.toLocaleString()}
                      </span>
                    </div>
                  </div>

                  {/* Customer Info */}
                  {lookedUpSale.patient && (
                    <div className="p-2.5 bg-blue-50/80 border border-blue-200 rounded-xl flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-blue-600" />
                        <div>
                          <strong className="text-slate-900">{lookedUpSale.patient.name}</strong>
                          <span className="text-slate-500 ml-1.5 font-mono text-[11px]">
                            ({lookedUpSale.patient.patientUid})
                          </span>
                        </div>
                      </div>
                      {lookedUpSale.patient.phone && (
                        <span className="font-mono text-blue-700 text-[11px]">
                          {lookedUpSale.patient.phone}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Purchased Items Table with Selectable Return Checkbox */}
                  <div className="border border-slate-200 rounded-xl overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead className="bg-slate-100 text-[10px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200 whitespace-nowrap">
                          <tr>
                            <th className="py-2.5 px-3">Item / Batch</th>
                            <th className="py-2.5 px-2 text-right">Unit Price</th>
                            <th className="py-2.5 px-2 text-center">Sold Qty</th>
                            <th className="py-2.5 px-2 text-center">Already Ret.</th>
                            <th className="py-2.5 px-2 text-center">Available</th>
                            <th className="py-2.5 px-3 text-center">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                        {lookedUpSale.items.map((item: any) => {
                          const isSelected = returnItems.some((it) => it.medicineId === item.medicineId);
                          const isFullyReturned = item.returnableQuantity <= 0;

                          return (
                            <tr
                              key={item.id}
                              className={`transition-colors ${
                                isFullyReturned
                                  ? "bg-slate-50/60 opacity-60"
                                  : isSelected
                                  ? "bg-rose-50/60"
                                  : "hover:bg-slate-50/50"
                              }`}
                            >
                              <td className="py-2 px-3">
                                <div className="font-bold text-slate-900">{item.medicineName}</div>
                                <div className="text-[10px] text-slate-400 font-mono">
                                  {item.genericName} · Batch: {item.batchNumber}
                                </div>
                              </td>
                              <td className="py-2 px-2 text-right font-mono font-bold text-slate-800">
                                Rs. {item.unitPrice.toLocaleString()}
                              </td>
                              <td className="py-2 px-2 text-center font-mono font-bold text-slate-700">
                                {item.soldQuantity}
                              </td>
                              <td className="py-2 px-2 text-center font-mono text-rose-600 font-bold">
                                {item.alreadyReturned}
                              </td>
                              <td className="py-2 px-2 text-center font-mono font-extrabold text-emerald-700">
                                {item.returnableQuantity}
                              </td>
                              <td className="py-2 px-3 text-center">
                                {isFullyReturned ? (
                                  <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded">
                                    Fully Returned
                                  </span>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => toggleInvoiceItem(item)}
                                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                                      isSelected
                                        ? "bg-rose-600 text-white shadow-xs"
                                        : "bg-slate-100 hover:bg-rose-100 text-slate-700 hover:text-rose-800"
                                    }`}
                                  >
                                    {isSelected ? "Selected ✓" : "+ Select"}
                                  </button>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
            </div>
          ) : (
            /* FLOW B: DIRECT CATALOG RETURN */
            <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-4">
              <div className="space-y-1">
                <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                  <Layers className="w-4 h-4 text-amber-600" />
                  <span>Step 1: Search Inventory Item to Return</span>
                </h3>
                <p className="text-xs text-slate-500">
                  Search any medicine or surgical item from dispensary stock for walk-in returns.
                </p>
              </div>

              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search medicine by name, generic, or formula..."
                    value={directSearchQuery}
                    onChange={(e) => setDirectSearchQuery(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleDirectSearch();
                      }
                    }}
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-amber-500 text-slate-900"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleDirectSearch}
                  disabled={searchingDirect || !directSearchQuery.trim()}
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold transition-all disabled:opacity-40 flex items-center gap-1.5 shrink-0"
                >
                  <Search className="w-3.5 h-3.5" />
                  <span>{searchingDirect ? "..." : "Search"}</span>
                </button>
              </div>

              {directSearchResults.length > 0 && (
                <div className="border border-slate-200 rounded-xl overflow-hidden max-h-72 overflow-y-auto">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead className="bg-slate-100 text-[10px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200 sticky top-0 whitespace-nowrap">
                        <tr>
                          <th className="py-2.5 px-3">Item Name</th>
                          <th className="py-2.5 px-2">Category</th>
                          <th className="py-2.5 px-2">Batch / Exp</th>
                          <th className="py-2.5 px-2 text-right">Unit Price</th>
                          <th className="py-2.5 px-2 text-center">Stock</th>
                          <th className="py-2.5 px-3 text-center">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {directSearchResults.map((med) => {
                          const isAdded = returnItems.some((it) => it.medicineId === med.id);
                          return (
                            <tr key={med.id} className="hover:bg-slate-50/50">
                              <td className="py-2.5 px-3">
                                <div className="font-bold text-slate-900">{med.name}</div>
                                <div className="text-[10px] text-slate-400 font-mono">
                                  {med.genericName}
                                </div>
                              </td>
                              <td className="py-2.5 px-2 text-slate-600 text-[11px] whitespace-nowrap">{med.category}</td>
                              <td className="py-2.5 px-2 text-[10px] font-mono text-slate-600 whitespace-nowrap">
                                {med.batchNumber || "—"}
                              </td>
                              <td className="py-2.5 px-2 text-right font-mono font-bold text-slate-900 whitespace-nowrap">
                                Rs. {med.sellingPrice.toLocaleString()}
                              </td>
                              <td className="py-2.5 px-2 text-center font-mono font-bold text-slate-700 whitespace-nowrap">
                                {med.totalStock}
                              </td>
                              <td className="py-2.5 px-3 text-center whitespace-nowrap">
                                <button
                                  type="button"
                                  onClick={() => addDirectItem(med)}
                                  disabled={isAdded}
                                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                                    isAdded
                                      ? "bg-slate-100 text-slate-400"
                                      : "bg-amber-500 hover:bg-amber-600 text-white shadow-xs"
                                  }`}
                                >
                                  {isAdded ? "Added ✓" : "+ Add"}
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Customer Metadata (Optional for Direct, Pre-filled for Invoice) */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-3">
            <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
              <User className="w-4 h-4 text-slate-600" />
              <span>Step 2: Customer / Patient Details</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-medium text-slate-500 mb-1 block">
                  Customer / Patient Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Muhammad Usman"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-rose-500 text-slate-900"
                />
              </div>
              <div>
                <label className="text-[11px] font-medium text-slate-500 mb-1 block">
                  Phone Number
                </label>
                <input
                  type="text"
                  placeholder="0300xxxxxxx"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-rose-500 text-slate-900 font-mono"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Return Items Review, Reason & Submit (5 Cols, Sticky) */}
        <div className="lg:col-span-5 space-y-5 lg:sticky lg:top-4">
          <form
            onSubmit={handleSubmitReturn}
            className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-4"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-rose-100 text-rose-700 rounded-lg">
                  <RotateCcw className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900">
                    Return Manifest ({returnItems.length})
                  </h3>
                  <span className="text-[10px] text-slate-500">
                    Items to restock into dispensary
                  </span>
                </div>
              </div>
              {returnItems.length > 0 && (
                <button
                  type="button"
                  onClick={() => setReturnItems([])}
                  className="text-xs text-rose-600 hover:underline font-semibold"
                >
                  Clear All
                </button>
              )}
            </div>

            {/* Selected Return Items Table */}
            <div className="border border-slate-200 rounded-xl overflow-hidden max-h-64 overflow-y-auto">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead className="bg-slate-50 text-[9px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200 sticky top-0 whitespace-nowrap">
                    <tr>
                      <th className="py-2 px-2.5">Item</th>
                      <th className="py-2 px-2 text-center">Ret. Qty</th>
                      <th className="py-2 px-2 text-right">Price</th>
                      <th className="py-2 px-2 text-right">Refund</th>
                      <th className="py-2 px-1 text-center"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                  {returnItems.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-slate-400 text-xs">
                        No return items selected yet. Choose items from the left.
                      </td>
                    </tr>
                  ) : (
                    returnItems.map((item) => (
                      <tr key={item.medicineId} className="hover:bg-slate-50/50">
                        <td className="py-2 px-2.5">
                          <div className="font-bold text-slate-900 truncate max-w-[120px]">
                            {item.medicineName}
                          </div>
                          {item.maxReturnable !== undefined && (
                            <div className="text-[9px] text-emerald-700 font-bold">
                              Max allowed: {item.maxReturnable}
                            </div>
                          )}
                        </td>
                        <td className="py-2 px-2 text-center">
                          <div className="inline-flex items-center gap-0.5 bg-white border border-slate-200 rounded p-0.5 shadow-2xs">
                            <button
                              type="button"
                              onClick={() => updateReturnQuantity(item.medicineId, -1)}
                              disabled={item.quantityReturned <= 1}
                              className="p-1 hover:bg-slate-100 disabled:opacity-30 rounded text-slate-600"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <input
                              type="number"
                              min={1}
                              max={item.maxReturnable}
                              value={typedQuantities[item.medicineId] ?? item.quantityReturned}
                              onChange={(e) =>
                                handleTypedReturnQuantityChange(
                                  item.medicineId,
                                  e.target.value,
                                  item.maxReturnable
                                )
                              }
                              onBlur={() =>
                                handleTypedReturnQuantityBlur(
                                  item.medicineId,
                                  item.maxReturnable
                                )
                              }
                              className="w-10 text-center text-xs font-mono font-black text-slate-900 bg-slate-50 border border-slate-200 rounded py-0.5 px-0.5 focus:ring-1 focus:ring-rose-500 focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                            />
                            <button
                              type="button"
                              onClick={() => updateReturnQuantity(item.medicineId, 1)}
                              disabled={item.maxReturnable !== undefined && item.quantityReturned >= item.maxReturnable}
                              className="p-1 hover:bg-slate-100 disabled:opacity-30 rounded text-slate-600"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>
                        </td>
                        <td className="py-2 px-2 text-right">
                          {returnMode === "DIRECT" ? (
                            <input
                              type="number"
                              min={0}
                              step="any"
                              value={item.unitPrice}
                              onChange={(e) =>
                                updateReturnUnitPrice(
                                  item.medicineId,
                                  parseFloat(e.target.value) || 0
                                )
                              }
                              className="w-14 text-right text-xs font-mono bg-slate-50 border border-slate-200 rounded py-1 px-1 focus:ring-1 focus:ring-rose-500 focus:outline-none"
                            />
                          ) : (
                            <span className="font-mono text-slate-700">
                              Rs. {item.unitPrice.toLocaleString()}
                            </span>
                          )}
                        </td>
                        <td className="py-2 px-2 text-right font-mono font-black text-rose-700">
                          Rs. {(item.quantityReturned * item.unitPrice).toLocaleString()}
                        </td>
                        <td className="py-2 px-1 text-center">
                          <button
                            type="button"
                            onClick={() => removeReturnItem(item.medicineId)}
                            className="p-1 text-slate-400 hover:text-red-600"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

            {/* Return Reason Field */}
            <div>
              <label className="text-[11px] font-bold text-slate-700 mb-1 flex items-center justify-between">
                <span>Reason for Return *</span>
                <span className="text-[10px] text-slate-400 font-normal">Audit requirement</span>
              </label>
              <select
                value={returnReason}
                onChange={(e) => setReturnReason(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-rose-500 text-slate-900 font-medium mb-1.5"
              >
                <option value="">-- Select Common Return Reason --</option>
                <option value="Doctor Changed Prescription">Doctor Changed Prescription</option>
                <option value="Incorrect Medicine / Dosage Dispensed">Incorrect Medicine / Dosage Dispensed</option>
                <option value="Patient Recovered / Excess Medicines">Patient Recovered / Excess Medicines</option>
                <option value="Adverse Reaction / Medicine Discontinued">Adverse Reaction / Medicine Discontinued</option>
                <option value="Damaged Packaging / Quality Check">Damaged Packaging / Quality Check</option>
                <option value="Walk-in Customer Return">Walk-in Customer Return</option>
                <option value="Other">Other (Custom Explanation)</option>
              </select>

              {returnReason === "Other" && (
                <textarea
                  rows={2}
                  placeholder="Specify custom reason..."
                  value={returnReason === "Other" ? "" : returnReason}
                  onChange={(e) => setReturnReason(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-rose-500 text-slate-900"
                />
              )}
            </div>

            {/* Total Refund Banner */}
            <div className="p-3.5 bg-slate-900 text-white rounded-xl flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Total Refund Amount
                </span>
                <span className="text-xl font-mono font-black text-rose-400">
                  Rs. {totalRefund.toLocaleString()}
                </span>
              </div>
              <div className="text-right text-[10px] text-slate-400">
                <span>Atomic Restock</span>
                <br />
                <span className="text-emerald-400 font-bold">Live Inventory Sync</span>
              </div>
            </div>

            {submitError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 text-red-600" />
                <span>{submitError}</span>
              </div>
            )}

            {/* Submit Action Button */}
            <button
              type="submit"
              disabled={isSubmitting || returnItems.length === 0 || !returnReason.trim()}
              className="w-full py-3 px-4 bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-700 hover:to-rose-800 text-white rounded-xl font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-rose-600/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <RotateCcw className="w-4 h-4" />
              <span>
                {isSubmitting
                  ? "Processing Return..."
                  : `Confirm Return & Refund (Rs. ${totalRefund.toLocaleString()})`}
              </span>
            </button>
          </form>
        </div>
      </div>

      {/* Dedicated Thermal / 80mm ESC/POS Return Receipt Modal */}
      <ThermalReturnReceiptModal
        isOpen={thermalReceiptModalOpen}
        onClose={() => setThermalReceiptModalOpen(false)}
        data={activeReceiptData}
      />

      {/* Bottom Section: Recent Returns History Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-slate-600" />
            <h3 className="text-sm font-extrabold text-slate-900">
              Recent Returns Audit History ({returnsHistory.length})
            </h3>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="text"
              placeholder="Search return #, patient, invoice..."
              value={historySearch}
              onChange={(e) => setHistorySearch(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  fetchReturnsHistory(historySearch);
                }
              }}
              className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-slate-900 focus:outline-none focus:ring-1 focus:ring-rose-500 w-60"
            />
            <button
              type="button"
              onClick={() => fetchReturnsHistory(historySearch)}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold"
            >
              Search
            </button>
          </div>
        </div>

        <div className="border border-slate-200 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-slate-100 text-[10px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200 whitespace-nowrap">
                <tr>
                  <th className="py-2.5 px-3">Return Voucher</th>
                  <th className="py-2.5 px-2">Original Invoice</th>
                  <th className="py-2.5 px-2">Customer / Patient</th>
                  <th className="py-2.5 px-3">Returned Items</th>
                  <th className="py-2.5 px-2">Reason</th>
                  <th className="py-2.5 px-3 text-right">Refund (Rs.)</th>
                  <th className="py-2.5 px-3 text-center">Receipt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
              {historyLoading ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    Loading returns history...
                  </td>
                </tr>
              ) : returnsHistory.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    No medicine return records found.
                  </td>
                </tr>
              ) : (
                returnsHistory.map((ret) => (
                  <tr key={ret.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-2 px-3">
                      <div className="font-mono font-bold text-rose-700">{ret.returnNumber}</div>
                      <div className="text-[10px] text-slate-400">
                        {new Date(ret.createdAt).toLocaleDateString("en-GB", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}
                      </div>
                    </td>
                    <td className="py-2 px-2 font-mono text-[11px] text-slate-600">
                      {ret.invoiceNumber || "Direct Return"}
                    </td>
                    <td className="py-2 px-2">
                      <div className="font-bold text-slate-900">
                        {ret.patientName || ret.sale?.patient?.name || "Walk-in Customer"}
                      </div>
                      {ret.customerPhone && (
                        <div className="text-[10px] font-mono text-slate-400">
                          {ret.customerPhone}
                        </div>
                      )}
                    </td>
                    <td className="py-2 px-3">
                      <div className="text-[11px] text-slate-700 font-medium">
                        {ret.items?.map((it: any) => `${it.medicine?.name} (${it.quantityReturned})`).join(", ")}
                      </div>
                    </td>
                    <td className="py-2 px-2 text-[11px] text-slate-600 max-w-[150px] truncate">
                      {ret.reason}
                    </td>
                    <td className="py-2 px-3 text-right font-mono font-extrabold text-rose-700">
                      Rs. {ret.totalRefundAmount.toLocaleString()}
                    </td>
                    <td className="py-2 px-3 text-center">
                      <button
                        type="button"
                        onClick={() => {
                          setActiveReceiptData({
                            returnNumber: ret.returnNumber,
                            invoiceNumber: ret.invoiceNumber,
                            createdAt: ret.createdAt,
                            pharmacistName: ret.processedBy?.name || "Pharmacist",
                            patientName: ret.patientName || ret.sale?.patient?.name,
                            customerPhone: ret.customerPhone,
                            reason: ret.reason,
                            status: ret.status,
                            items: ret.items.map((it: any) => ({
                              name: it.medicine?.name || "Medicine",
                              quantityReturned: it.quantityReturned,
                              unitPrice: it.unitPrice,
                              refundSubtotal: it.refundSubtotal,
                            })),
                            totalRefundAmount: ret.totalRefundAmount,
                          });
                          setThermalReceiptModalOpen(true);
                        }}
                        className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-[11px] font-bold transition-colors flex items-center gap-1 mx-auto"
                      >
                        <Printer className="w-3 h-3" />
                        <span>Print Slip</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
);
}

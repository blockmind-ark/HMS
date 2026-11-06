"use client";

import React, { useState, useEffect } from "react";
import {
  Truck,
  Banknote,
  Receipt,
  CreditCard,
  Plus,
  Search,
  Filter,
  Calendar,
  Printer,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ArrowRight,
  ExternalLink,
  Building2,
  Phone,
  Mail,
  User,
  Eye,
} from "lucide-react";
import { RecordVendorPaymentModal } from "@/components/modals/RecordVendorPaymentModal";
import { AddVendorModal } from "@/components/modals/AddVendorModal";
import { VendorPaymentReceiptModal, VendorPaymentReceiptData } from "@/components/modals/VendorPaymentReceiptModal";

export function VendorManagementView() {
  const [subTab, setSubTab] = useState<"directory" | "ledger" | "pos">("directory");

  // Vendors state
  const [vendors, setVendors] = useState<any[]>([]);
  const [loadingVendors, setLoadingVendors] = useState(true);
  const [vendorSearch, setVendorSearch] = useState("");

  // Payments Ledger state
  const [payments, setPayments] = useState<any[]>([]);
  const [loadingPayments, setLoadingPayments] = useState(false);
  const [paymentSearch, setPaymentSearch] = useState("");
  const [selectedVendorFilter, setSelectedVendorFilter] = useState("ALL");
  const [selectedMethodFilter, setSelectedMethodFilter] = useState("ALL");

  // Purchase Orders state
  const [purchaseOrders, setPurchaseOrders] = useState<any[]>([]);
  const [loadingPos, setLoadingPos] = useState(false);
  const [poStatusFilter, setPoStatusFilter] = useState("ALL");

  // Modal controls
  const [showPayModal, setShowPayModal] = useState(false);
  const [selectedVendorForPayment, setSelectedVendorForPayment] = useState<string | undefined>(undefined);
  const [selectedPoForPayment, setSelectedPoForPayment] = useState<string | undefined>(undefined);

  const [showAddVendorModal, setShowAddVendorModal] = useState(false);

  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState<VendorPaymentReceiptData | null>(null);

  // Notifications
  const [notification, setNotification] = useState<string | null>(null);

  const fetchVendors = async () => {
    setLoadingVendors(true);
    try {
      const res = await fetch(`/api/vendors?query=${encodeURIComponent(vendorSearch)}`);
      if (res.ok) {
        const data = await res.json();
        setVendors(data.vendors || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingVendors(false);
    }
  };

  const fetchPayments = async () => {
    setLoadingPayments(true);
    try {
      const params = new URLSearchParams();
      if (vendorSearch || paymentSearch) params.set("query", paymentSearch);
      if (selectedVendorFilter !== "ALL") params.set("vendorId", selectedVendorFilter);
      if (selectedMethodFilter !== "ALL") params.set("paymentMethod", selectedMethodFilter);

      const res = await fetch(`/api/vendors/payments?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setPayments(data.payments || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingPayments(false);
    }
  };

  const fetchPurchaseOrders = async () => {
    setLoadingPos(true);
    try {
      const params = new URLSearchParams();
      if (poStatusFilter !== "ALL") params.set("paymentStatus", poStatusFilter);

      const res = await fetch(`/api/vendors/purchase-orders?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setPurchaseOrders(data.purchaseOrders || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingPos(false);
    }
  };

  useEffect(() => {
    fetchVendors();
  }, [vendorSearch]);

  useEffect(() => {
    if (subTab === "ledger") {
      fetchPayments();
    } else if (subTab === "pos") {
      fetchPurchaseOrders();
    }
  }, [subTab, selectedVendorFilter, selectedMethodFilter, poStatusFilter]);

  // Overall Stats
  const totalBalanceDue = vendors.reduce((acc, v) => acc + (v.balance > 0 ? v.balance : 0), 0);
  const totalPaymentsDisbursed = payments.reduce((acc, p) => acc + p.amount, 0);
  const totalVendorsCount = vendors.length;
  const pendingOrdersCount = vendors.reduce((acc, v) => acc + (v.pendingPoCount || 0), 0);

  return (
    <div className="space-y-6 animate-in fade-in pb-12">
      {/* Top Action Bar */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-extrabold text-slate-900">
              Vendor Directory & Accounts Payable Management
            </h3>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-purple-100 text-purple-800 border border-purple-200">
              Suppliers &amp; Invoices
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Track pharmaceutical distributors, purchase orders, credit balances, and disburse cash/bank payments.
          </p>
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          <button
            onClick={() => {
              setSelectedVendorForPayment(undefined);
              setSelectedPoForPayment(undefined);
              setShowPayModal(true);
            }}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 transition-colors shadow-sm shadow-emerald-600/20"
          >
            <Banknote className="w-4 h-4" />
            <span>Record Payment</span>
          </button>

          <button
            onClick={() => setShowAddVendorModal(true)}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 transition-colors shadow-sm shadow-purple-600/20"
          >
            <Plus className="w-4 h-4" />
            <span>Add Supplier</span>
          </button>

          <button
            onClick={() => {
              fetchVendors();
              if (subTab === "ledger") fetchPayments();
              if (subTab === "pos") fetchPurchaseOrders();
            }}
            className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-colors"
            title="Refresh Ledger"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Notification */}
      {notification && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs font-bold text-emerald-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{notification}</span>
          </div>
          <button
            onClick={() => setNotification(null)}
            className="text-emerald-700 hover:underline text-[11px]"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* KPI Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Outstanding Due */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
            <Banknote className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Total Payables Due
            </span>
            <p className="text-xl font-black text-rose-600 font-mono">
              Rs. {totalBalanceDue.toLocaleString()}
            </p>
            <p className="text-[10px] text-slate-400 mt-0.5">Owed across all vendors</p>
          </div>
        </div>

        {/* Card 2: Active Vendors */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
            <Truck className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Active Suppliers
            </span>
            <p className="text-xl font-black text-slate-900">
              {totalVendorsCount}
            </p>
            <p className="text-[10px] text-slate-400 mt-0.5">Distributor profiles</p>
          </div>
        </div>

        {/* Card 3: Pending POs */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
            <Receipt className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Unpaid Purchase Orders
            </span>
            <p className="text-xl font-black text-amber-600">
              {pendingOrdersCount}
            </p>
            <p className="text-[10px] text-slate-400 mt-0.5">Awaiting complete payment</p>
          </div>
        </div>

        {/* Card 4: Payments Disbursed */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <CreditCard className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Total Disbursed
            </span>
            <p className="text-xl font-black text-emerald-700 font-mono">
              Rs. {totalPaymentsDisbursed.toLocaleString()}
            </p>
            <p className="text-[10px] text-slate-400 mt-0.5">Cleared via Cash / Raast</p>
          </div>
        </div>
      </div>

      {/* Sub-Tabs Control */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setSubTab("directory")}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all ${
            subTab === "directory"
              ? "bg-purple-600 text-white shadow-md shadow-purple-500/20"
              : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          <Truck className="w-4 h-4" />
          <span>Vendor Directory &amp; Balances</span>
        </button>

        <button
          onClick={() => setSubTab("ledger")}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all ${
            subTab === "ledger"
              ? "bg-purple-600 text-white shadow-md shadow-purple-500/20"
              : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          <Receipt className="w-4 h-4" />
          <span>Payment History Ledger</span>
        </button>

        <button
          onClick={() => setSubTab("pos")}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all ${
            subTab === "pos"
              ? "bg-purple-600 text-white shadow-md shadow-purple-500/20"
              : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          <CreditCard className="w-4 h-4" />
          <span>Purchase Orders &amp; Invoices</span>
        </button>
      </div>

      {/* TAB 1: VENDOR DIRECTORY */}
      {subTab === "directory" && (
        <div className="space-y-4">
          {/* Search Filter */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
            <div className="relative w-full sm:w-96">
              <Search className="w-4 h-4 absolute inset-y-0 left-3 my-auto text-slate-400" />
              <input
                type="text"
                placeholder="Search vendor name, contact person, or phone..."
                value={vendorSearch}
                onChange={(e) => setVendorSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 text-slate-900"
              />
            </div>
            <span className="text-xs text-slate-400 font-semibold hidden sm:inline">
              Showing {vendors.length} supplier{vendors.length !== 1 ? "s" : ""}
            </span>
          </div>

          {/* Vendors Table */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-200">
                  <tr>
                    <th className="px-5 py-3.5">Vendor / Company</th>
                    <th className="px-5 py-3.5">Contact Person</th>
                    <th className="px-5 py-3.5">Contact Phone</th>
                    <th className="px-5 py-3.5 text-right">Total Orders</th>
                    <th className="px-5 py-3.5 text-right">Total Disbursed</th>
                    <th className="px-5 py-3.5 text-right">Balance Due</th>
                    <th className="px-5 py-3.5 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {vendors.map((v) => (
                    <tr key={v.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-5 py-3.5">
                        <div className="font-extrabold text-slate-900 text-xs sm:text-sm">
                          {v.name}
                        </div>
                        {v.address !== "—" && (
                          <span className="text-[11px] text-slate-400 block truncate max-w-xs">
                            {v.address}
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-3.5 font-medium text-slate-700">
                        {v.contactPerson}
                      </td>
                      <td className="px-5 py-3.5 font-mono text-slate-600">
                        {v.phone}
                      </td>
                      <td className="px-5 py-3.5 text-right font-mono font-bold text-slate-800">
                        Rs. {v.totalPurchased.toLocaleString()}
                      </td>
                      <td className="px-5 py-3.5 text-right font-mono font-bold text-emerald-700">
                        Rs. {v.totalPaid.toLocaleString()}
                      </td>
                      <td className="px-5 py-3.5 text-right font-mono font-black text-sm">
                        {v.balance > 0 ? (
                          <span className="text-rose-600">Rs. {v.balance.toLocaleString()}</span>
                        ) : v.balance === 0 ? (
                          <span className="text-emerald-600">Rs. 0 (Settled)</span>
                        ) : (
                          <span className="text-blue-600">Credit: Rs. {Math.abs(v.balance).toLocaleString()}</span>
                        )}
                      </td>
                      <td className="px-5 py-3.5 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => {
                              setSelectedVendorForPayment(v.id);
                              setSelectedPoForPayment(undefined);
                              setShowPayModal(true);
                            }}
                            className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold text-xs rounded-xl border border-emerald-200 transition-colors flex items-center gap-1"
                          >
                            <Banknote className="w-3.5 h-3.5" />
                            <span>Pay Vendor</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {vendors.length === 0 && (
                    <tr>
                      <td colSpan={7} className="px-5 py-8 text-center text-slate-400 text-xs">
                        No suppliers match search criteria.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: PAYMENT HISTORY LEDGER */}
      {subTab === "ledger" && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 absolute inset-y-0 left-3 my-auto text-slate-400" />
              <input
                type="text"
                placeholder="Search VP #, vendor, or ref..."
                value={paymentSearch}
                onChange={(e) => setPaymentSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 text-slate-900"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <select
                value={selectedVendorFilter}
                onChange={(e) => setSelectedVendorFilter(e.target.value)}
                className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-700 font-semibold focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="ALL">All Suppliers</option>
                {vendors.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.name}
                  </option>
                ))}
              </select>

              <select
                value={selectedMethodFilter}
                onChange={(e) => setSelectedMethodFilter(e.target.value)}
                className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-700 font-semibold focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="ALL">All Payment Methods</option>
                <option value="Cash">Cash</option>
                <option value="Raast">Raast</option>
                <option value="Bank Transfer">Bank Transfer</option>
                <option value="Cheque">Cheque</option>
              </select>
            </div>
          </div>

          {/* Payments Table */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-200">
                  <tr>
                    <th className="px-5 py-3.5">Voucher #</th>
                    <th className="px-5 py-3.5">Disbursement Date</th>
                    <th className="px-5 py-3.5">Vendor / Supplier</th>
                    <th className="px-5 py-3.5">Against Account / PO</th>
                    <th className="px-5 py-3.5 text-right">Amount Paid</th>
                    <th className="px-5 py-3.5">Method</th>
                    <th className="px-5 py-3.5">Reference / Tx ID</th>
                    <th className="px-5 py-3.5">Disbursed By</th>
                    <th className="px-5 py-3.5 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {payments.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-5 py-3.5 font-mono font-bold text-slate-900 whitespace-nowrap">
                        {p.paymentNumber}
                      </td>
                      <td className="px-5 py-3.5 font-mono text-slate-500 whitespace-nowrap">
                        {new Date(p.paymentDate).toLocaleDateString("en-GB", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </td>
                      <td className="px-5 py-3.5 font-bold text-slate-900">
                        {p.vendor?.name}
                      </td>
                      <td className="px-5 py-3.5 font-mono text-slate-600">
                        {p.purchaseOrder ? p.purchaseOrder.poNumber : "General Account"}
                      </td>
                      <td className="px-5 py-3.5 text-right font-mono font-black text-emerald-700 text-sm">
                        Rs. {p.amount.toLocaleString()}
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-100 text-slate-800 border border-slate-200">
                          {p.paymentMethod}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 font-mono text-slate-600">
                        {p.referenceNumber || "—"}
                      </td>
                      <td className="px-5 py-3.5 text-slate-600">
                        {p.paidBy?.name || "Finance Admin"}
                      </td>
                      <td className="px-5 py-3.5 text-center">
                        <button
                          onClick={() => {
                            setSelectedReceipt({
                              id: p.id,
                              paymentNumber: p.paymentNumber,
                              vendorName: p.vendor?.name || "Vendor",
                              vendorPhone: p.vendor?.phone,
                              vendorAddress: p.vendor?.address,
                              amount: p.amount,
                              paymentMethod: p.paymentMethod,
                              referenceNumber: p.referenceNumber,
                              paymentDate: p.paymentDate,
                              notes: p.notes,
                              paidByName: p.paidBy?.name || "Finance Staff",
                              poNumber: p.purchaseOrder?.poNumber,
                              poAmount: p.purchaseOrder?.totalAmount,
                              vendorBalanceRemaining: p.vendor?.balance,
                            });
                            setShowReceiptModal(true);
                          }}
                          className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[11px] rounded-lg transition-colors flex items-center gap-1 mx-auto"
                        >
                          <Printer className="w-3 h-3" />
                          <span>Voucher</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                  {payments.length === 0 && (
                    <tr>
                      <td colSpan={9} className="px-5 py-8 text-center text-slate-400 text-xs">
                        No payment disbursement records match current filters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: PURCHASE ORDERS & INVOICES */}
      {subTab === "pos" && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-700">Filter Status:</span>
              <select
                value={poStatusFilter}
                onChange={(e) => setPoStatusFilter(e.target.value)}
                className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-slate-700 font-semibold focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="ALL">All Statuses</option>
                <option value="UNPAID">UNPAID (Pending Full Settlement)</option>
                <option value="PARTIAL">PARTIAL (Partially Paid)</option>
                <option value="PAID">PAID (Fully Cleared)</option>
              </select>
            </div>
          </div>

          {/* POs Table */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-200">
                  <tr>
                    <th className="px-5 py-3.5">PO Number</th>
                    <th className="px-5 py-3.5">Order Date</th>
                    <th className="px-5 py-3.5">Supplier / Vendor</th>
                    <th className="px-5 py-3.5 text-right">Total Invoice</th>
                    <th className="px-5 py-3.5 text-right">Amount Paid</th>
                    <th className="px-5 py-3.5 text-right">Balance Remaining</th>
                    <th className="px-5 py-3.5 text-center">Payment Status</th>
                    <th className="px-5 py-3.5 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {purchaseOrders.map((po) => {
                    const balance = Math.max(0, po.totalAmount - (po.paidAmount || 0));
                    return (
                      <tr key={po.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="px-5 py-3.5 font-mono font-bold text-slate-900">
                          {po.poNumber}
                        </td>
                        <td className="px-5 py-3.5 font-mono text-slate-500">
                          {new Date(po.createdAt).toLocaleDateString("en-GB", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </td>
                        <td className="px-5 py-3.5 font-bold text-slate-900">
                          {po.vendor?.name}
                        </td>
                        <td className="px-5 py-3.5 text-right font-mono font-bold text-slate-900">
                          Rs. {po.totalAmount.toLocaleString()}
                        </td>
                        <td className="px-5 py-3.5 text-right font-mono font-bold text-emerald-700">
                          Rs. {(po.paidAmount || 0).toLocaleString()}
                        </td>
                        <td className="px-5 py-3.5 text-right font-mono font-black text-rose-600">
                          Rs. {balance.toLocaleString()}
                        </td>
                        <td className="px-5 py-3.5 text-center">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                              po.paymentStatus === "PAID"
                                ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                                : po.paymentStatus === "PARTIAL"
                                ? "bg-amber-100 text-amber-800 border border-amber-200"
                                : "bg-rose-100 text-rose-800 border border-rose-200"
                            }`}
                          >
                            {po.paymentStatus}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-center">
                          {po.paymentStatus !== "PAID" ? (
                            <button
                              onClick={() => {
                                setSelectedVendorForPayment(po.vendorId);
                                setSelectedPoForPayment(po.id);
                                setShowPayModal(true);
                              }}
                              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] rounded-lg transition-colors flex items-center gap-1 mx-auto"
                            >
                              <Banknote className="w-3 h-3" />
                              <span>Pay PO</span>
                            </button>
                          ) : (
                            <span className="text-[11px] font-bold text-emerald-600">Cleared</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                  {purchaseOrders.length === 0 && (
                    <tr>
                      <td colSpan={8} className="px-5 py-8 text-center text-slate-400 text-xs">
                        No purchase orders found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Record Payment Modal */}
      <RecordVendorPaymentModal
        vendors={vendors}
        selectedVendorId={selectedVendorForPayment}
        selectedPoId={selectedPoForPayment}
        isOpen={showPayModal}
        onClose={() => setShowPayModal(false)}
        onSuccess={(p) => {
          setNotification(`Successfully recorded payment of Rs. ${p.amount.toLocaleString()} to ${p.vendor?.name}.`);
          fetchVendors();
          if (subTab === "ledger") fetchPayments();
          if (subTab === "pos") fetchPurchaseOrders();
          setSelectedReceipt({
            id: p.id,
            paymentNumber: p.paymentNumber,
            vendorName: p.vendor?.name,
            vendorPhone: p.vendor?.phone,
            amount: p.amount,
            paymentMethod: p.paymentMethod,
            referenceNumber: p.referenceNumber,
            paymentDate: p.paymentDate,
            notes: p.notes,
            paidByName: p.paidBy?.name || "Finance Staff",
            poNumber: p.purchaseOrder?.poNumber,
            vendorBalanceRemaining: p.vendor?.balance,
          });
          setShowReceiptModal(true);
        }}
      />

      {/* Add Vendor Modal */}
      <AddVendorModal
        isOpen={showAddVendorModal}
        onClose={() => setShowAddVendorModal(false)}
        onSuccess={(v) => {
          setNotification(`Supplier '${v.name}' registered successfully.`);
          fetchVendors();
        }}
      />

      {/* Payment Receipt / Voucher Modal */}
      <VendorPaymentReceiptModal
        payment={selectedReceipt}
        isOpen={showReceiptModal}
        onClose={() => setShowReceiptModal(false)}
      />
    </div>
  );
}


"use client";

import React, { useState, useEffect } from "react";
import {
  ShieldAlert,
  CheckCircle2,
  XCircle,
  Clock,
  Banknote,
  Package,
  FileText,
  Printer,
  RefreshCw,
  ArrowDownRight,
  ArrowUpRight,
  AlertTriangle,
  History,
  TrendingDown,
  TrendingUp,
  User,
  Calendar,
  Eye,
  Edit3,
  Sliders,
  Percent,
  Ban,
} from "lucide-react";
import {
  ShiftClosingVoucherModal,
  ShiftClosingData,
} from "@/components/modals/ShiftClosingVoucherModal";
import { ShiftSubmissionDetailsModal } from "@/components/modals/ShiftSubmissionDetailsModal";

interface ApprovalsManagementViewProps {
  onActionComplete?: () => void;
}

export function ApprovalsManagementView({
  onActionComplete,
}: ApprovalsManagementViewProps) {
  const [activeSubTab, setActiveSubTab] = useState<
    "adjustments" | "shifts" | "stock" | "history"
  >("adjustments");

  const [loading, setLoading] = useState(true);
  const [requests, setRequests] = useState<any[]>([]);
  const [drawerAdjustments, setDrawerAdjustments] = useState<any[]>([]);
  const [shiftClosings, setShiftClosings] = useState<any[]>([]);
  const [counts, setCounts] = useState({
    pendingStock: 0,
    pendingAdjustments: 0,
    pendingShifts: 0,
    totalPending: 0,
  });

  // Action Modal State
  const [selectedItem, setSelectedItem] = useState<{
    type: "DRAWER_ADJUSTMENT" | "SHIFT_CLOSING" | "STOCK";
    item: any;
    action: "APPROVED" | "REJECTED";
  } | null>(null);

  // Advanced Stock Review & Action Modal State
  const [selectedStockForReview, setSelectedStockForReview] = useState<any | null>(null);
  const [stockReviewTab, setStockReviewTab] = useState<"preview" | "edit">("preview");
  const [modifiedStockForm, setModifiedStockForm] = useState({
    quantity: "",
    purchasePrice: "",
    sellingPrice: "",
    perOff: "0",
    threshold: "10",
    batchNumber: "",
    expiryDate: "",
    adminComment: "",
  });

  const handleOpenStockReview = (req: any) => {
    let details = req.parsedDetails || {};
    if (!details.medicineName && typeof req.details === "string") {
      try {
        details = JSON.parse(req.details);
      } catch (e) {}
    }

    setModifiedStockForm({
      quantity: String(details.quantity || 100),
      purchasePrice: String(details.purchasePrice || 0),
      sellingPrice: String(details.sellingPrice || 0),
      perOff: String(details.perOff ?? req.currentMedicineInfo?.perOff ?? 0),
      threshold: String(details.threshold ?? req.currentMedicineInfo?.threshold ?? 10),
      batchNumber: details.batchNumber || "",
      expiryDate: details.expiryDate ? new Date(details.expiryDate).toISOString().split("T")[0] : "",
      adminComment: "",
    });
    setSelectedStockForReview(req);
    setStockReviewTab("preview");
  };

  const handleProcessStockAction = async (actionStatus: "APPROVED" | "REJECTED" | "CANCELLED") => {
    if (!selectedStockForReview) return;
    setProcessing(true);
    try {
      const res = await fetch("/api/admin/approvals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "STOCK",
          id: selectedStockForReview.id,
          status: actionStatus,
          comment: modifiedStockForm.adminComment.trim() || undefined,
          modifiedData: actionStatus === "APPROVED" ? {
            quantity: modifiedStockForm.quantity,
            purchasePrice: modifiedStockForm.purchasePrice,
            sellingPrice: modifiedStockForm.sellingPrice,
            perOff: modifiedStockForm.perOff,
            threshold: modifiedStockForm.threshold,
            batchNumber: modifiedStockForm.batchNumber,
            expiryDate: modifiedStockForm.expiryDate,
          } : undefined,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        const actionLabel = actionStatus === "APPROVED" ? "approved & committed to live inventory" : (actionStatus === "CANCELLED" ? "cancelled / archived" : "rejected");
        setNotification(`Stock request successfully ${actionLabel}!`);
        setSelectedStockForReview(null);
        fetchApprovals();
        if (onActionComplete) onActionComplete();
        setTimeout(() => setNotification(null), 4000);
      } else {
        alert(data.error || "Failed to process stock action.");
      }
    } catch (e: any) {
      alert(e.message || "Network error");
    } finally {
      setProcessing(false);
    }
  };

  const [adminComment, setAdminComment] = useState("");
  const [processing, setProcessing] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);

  // Voucher preview modal
  const [voucherModalOpen, setVoucherModalOpen] = useState(false);
  const [selectedVoucherData, setSelectedVoucherData] =
    useState<ShiftClosingData | null>(null);
  const [previewShiftDetails, setPreviewShiftDetails] = useState<any | null>(null);

  const fetchApprovals = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/approvals");
      if (res.ok) {
        const data = await res.json();
        setRequests(data.requests || []);
        setDrawerAdjustments(data.drawerAdjustments || []);
        setShiftClosings(data.shiftClosings || []);
        if (data.counts) {
          setCounts(data.counts);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApprovals();
  }, []);

  const handleProcessAction = async () => {
    if (!selectedItem) return;
    setProcessing(true);
    try {
      const res = await fetch("/api/admin/approvals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: selectedItem.type,
          id: selectedItem.item.id,
          status: selectedItem.action,
          comment: adminComment.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        let msg = "";
        if (selectedItem.type === "SHIFT_CLOSING") {
          msg =
            selectedItem.action === "APPROVED"
              ? "Shift submission accepted & officially committed!"
              : "Shift submission rejected & returned for re-entry!";
        } else if (selectedItem.type === "DRAWER_ADJUSTMENT") {
          msg = `Drawer Adjustment successfully ${selectedItem.action === "APPROVED" ? "approved & committed" : "rejected"}!`;
        } else {
          msg = `Stock Request successfully ${selectedItem.action === "APPROVED" ? "approved" : "rejected"}!`;
        }

        setNotification(msg);
        setSelectedItem(null);
        setAdminComment("");
        fetchApprovals();
        if (onActionComplete) onActionComplete();
        setTimeout(() => setNotification(null), 4000);
      } else {
        alert(data.error || "Failed to process approval action.");
      }
    } catch (e: any) {
      alert(e.message || "Network error");
    } finally {
      setProcessing(false);
    }
  };

  const pendingAdjustments = drawerAdjustments.filter(
    (a) => a.status === "PENDING"
  );
  const pendingShifts = shiftClosings.filter(
    (s) => s.status === "PENDING_APPROVAL"
  );
  const pendingStock = requests.filter((r) => r.status === "PENDING");

  // Historical items combined
  const historicalAdjustments = drawerAdjustments.filter(
    (a) => a.status !== "PENDING"
  );
  const historicalShifts = shiftClosings.filter(
    (s) => s.status !== "PENDING_APPROVAL"
  );
  const historicalStock = requests.filter((r) => r.status !== "PENDING");

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* Banner notification */}
      {notification && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl flex items-center justify-between shadow-sm animate-in slide-in-from-top duration-200">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            <span className="text-xs sm:text-sm font-semibold">
              {notification}
            </span>
          </div>
          <button
            onClick={() => setNotification(null)}
            className="text-xs font-bold text-emerald-700 hover:text-emerald-900"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Top Approvals Header with Sub-Tabs */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-purple-600" />
            <span>Admin Approvals &amp; Financial Governance Center</span>
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Review cashier drawer adjustments, authorize shift sheet closures,
            and approve pharmacy restock consignments.
          </p>
        </div>

        <button
          onClick={fetchApprovals}
          disabled={loading}
          className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-colors self-end sm:self-auto"
          title="Refresh Approvals"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {/* Approvals Navigation Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveSubTab("adjustments")}
          className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all ${
            activeSubTab === "adjustments"
              ? "bg-purple-600 text-white shadow-md shadow-purple-600/20"
              : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          <Banknote className="w-4 h-4" />
          <span>Drawer Adjustments</span>
          {pendingAdjustments.length > 0 && (
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                activeSubTab === "adjustments"
                  ? "bg-white text-purple-900"
                  : "bg-amber-500 text-white"
              }`}
            >
              {pendingAdjustments.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveSubTab("shifts")}
          className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all ${
            activeSubTab === "shifts"
              ? "bg-purple-600 text-white shadow-md shadow-purple-600/20"
              : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>Shift Closing Sheets</span>
          {pendingShifts.length > 0 && (
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                activeSubTab === "shifts"
                  ? "bg-white text-purple-900"
                  : "bg-amber-500 text-white"
              }`}
            >
              {pendingShifts.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveSubTab("stock")}
          className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all ${
            activeSubTab === "stock"
              ? "bg-purple-600 text-white shadow-md shadow-purple-600/20"
              : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          <Package className="w-4 h-4" />
          <span>Pharmacy Stock Intake</span>
          {pendingStock.length > 0 && (
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                activeSubTab === "stock"
                  ? "bg-white text-purple-900"
                  : "bg-amber-500 text-white"
              }`}
            >
              {pendingStock.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveSubTab("history")}
          className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all ${
            activeSubTab === "history"
              ? "bg-purple-600 text-white shadow-md shadow-purple-600/20"
              : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          <History className="w-4 h-4" />
          <span>Decision History</span>
        </button>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* SUBTAB 1: CASH DRAWER ADJUSTMENTS */}
      {/* ------------------------------------------------------------- */}
      {activeSubTab === "adjustments" && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="p-5 bg-gradient-to-r from-slate-900 to-indigo-950 text-white flex items-center justify-between">
            <div>
              <h4 className="text-sm font-bold flex items-center gap-2">
                <Banknote className="w-4 h-4 text-indigo-400" />
                <span>Pending Receptionist Cash Drawer Adjustments</span>
              </h4>
              <p className="text-xs text-slate-400">
                Approving updates the official cash drawer balance for shift
                reconciliation.
              </p>
            </div>
            <span className="px-3 py-1 bg-amber-500 text-slate-950 rounded-full text-xs font-black">
              {pendingAdjustments.length} Pending
            </span>
          </div>

          <div className="divide-y divide-slate-100">
            {pendingAdjustments.map((adj) => (
              <div
                key={adj.id}
                className="p-5 hover:bg-slate-50 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2.5 py-0.5 rounded-md text-xs font-extrabold uppercase flex items-center gap-1 border ${
                        adj.type === "CASH_IN"
                          ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                          : "bg-amber-50 text-amber-800 border-amber-200"
                      }`}
                    >
                      {adj.type === "CASH_IN" ? (
                        <>
                          <ArrowDownRight className="w-3.5 h-3.5" />
                          <span>Cash In (+ Float)</span>
                        </>
                      ) : (
                        <>
                          <ArrowUpRight className="w-3.5 h-3.5" />
                          <span>Cash Out (- Withdrawal)</span>
                        </>
                      )}
                    </span>
                    <h5 className="text-base font-black text-slate-900">
                      Rs. {adj.amount.toLocaleString()}
                    </h5>
                  </div>

                  <p className="text-xs text-slate-700 italic bg-slate-50 p-2 rounded-lg border border-slate-100">
                    &ldquo;{adj.remarks}&rdquo;
                  </p>

                  <div className="text-[11px] text-slate-500 flex items-center gap-2">
                    <span>
                      Requested by <strong>{adj.user?.name}</strong> (
                      {adj.user?.email})
                    </span>
                    <span>·</span>
                    <span>
                      {new Date(adj.createdAt).toLocaleString("en-GB", {
                        day: "numeric",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={() =>
                      setSelectedItem({
                        type: "DRAWER_ADJUSTMENT",
                        item: adj,
                        action: "REJECTED",
                      })
                    }
                    className="px-3.5 py-2 bg-red-50 hover:bg-red-100 text-red-700 rounded-xl text-xs font-bold border border-red-200 transition-colors"
                  >
                    Reject
                  </button>
                  <button
                    onClick={() =>
                      setSelectedItem({
                        type: "DRAWER_ADJUSTMENT",
                        item: adj,
                        action: "APPROVED",
                      })
                    }
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm transition-colors flex items-center gap-1.5"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Approve &amp; Update Drawer</span>
                  </button>
                </div>
              </div>
            ))}

            {pendingAdjustments.length === 0 && (
              <div className="p-8 text-center text-slate-400 text-xs">
                All caught up! No pending cash drawer adjustments.
              </div>
            )}
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* SUBTAB 2: SHIFT CLOSING SHEETS */}
      {/* ------------------------------------------------------------- */}
      {activeSubTab === "shifts" && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="p-5 bg-gradient-to-r from-slate-900 to-blue-950 text-white flex items-center justify-between">
            <div>
              <h4 className="text-sm font-bold flex items-center gap-2">
                <Clock className="w-4 h-4 text-blue-400" />
                <span>Pending Shift Closing Sheets (Review &amp; Final Commit)</span>
              </h4>
              <p className="text-xs text-slate-400">
                Approving officially locks shift financial sheets and commits
                totals into permanent financial reports.
              </p>
            </div>
            <span className="px-3 py-1 bg-amber-500 text-slate-950 rounded-full text-xs font-black">
              {pendingShifts.length} Awaiting Approval
            </span>
          </div>

          <div className="divide-y divide-slate-100">
            {pendingShifts.map((shift) => {
              const isBalanced = shift.variance === 0;
              const isShortage = shift.variance < 0;

              return (
                <div
                  key={shift.id}
                  className="p-5 hover:bg-slate-50 transition-colors flex flex-col lg:flex-row lg:items-center justify-between gap-4"
                >
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                        {new Date(shift.shiftDate).toLocaleDateString("en-GB", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </span>
                      <h5 className="text-sm font-extrabold text-slate-900">
                        Shift Sheet: {shift.user?.name}
                      </h5>
                      <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-indigo-100 text-indigo-800 border border-indigo-200">
                        {shift.portal === "PHARMACY" ? "Pharmacy POS" : "Reception Desk"}
                      </span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-amber-100 text-amber-800 border border-amber-200">
                        Awaiting Commit
                      </span>
                    </div>

                    {/* Breakdown Strip */}
                    <div className="text-xs text-slate-600 flex flex-wrap items-center gap-3 font-mono">
                      <span>
                        System Expected:{" "}
                        <strong>Rs. {shift.totalSystemCash.toLocaleString()}</strong>
                      </span>
                      <span>·</span>
                      <span>
                        Physical Counted:{" "}
                        <strong className="text-blue-700">
                          Rs. {shift.countedCash.toLocaleString()}
                        </strong>
                      </span>
                      <span>·</span>
                      <span>
                        Variance:{" "}
                        {isBalanced ? (
                          <span className="text-emerald-600 font-bold">
                            Exact Match (Rs. 0)
                          </span>
                        ) : isShortage ? (
                          <span className="text-rose-600 font-bold">
                            Shortage: -Rs.{" "}
                            {Math.abs(shift.variance).toLocaleString()}
                          </span>
                        ) : (
                          <span className="text-blue-600 font-bold">
                            Overage: +Rs. {shift.variance.toLocaleString()}
                          </span>
                        )}
                      </span>
                    </div>

                    {shift.notes && (
                      <p className="text-xs text-slate-600 italic bg-slate-50 p-2 rounded-lg border border-slate-100">
                        Handover Note: &ldquo;{shift.notes}&rdquo;
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    {/* Option 1: Preview */}
                    <button
                      onClick={() => setPreviewShiftDetails(shift)}
                      className="px-3.5 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 border border-indigo-200 shadow-xs"
                      title="Preview full submission breakdown"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Preview</span>
                    </button>

                    {/* Option 2: Rejected & Reentered */}
                    <button
                      onClick={() =>
                        setSelectedItem({
                          type: "SHIFT_CLOSING",
                          item: shift,
                          action: "REJECTED",
                        })
                      }
                      className="px-3.5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl text-xs font-bold border border-rose-200 transition-colors flex items-center gap-1.5 shadow-xs"
                      title="Reject submission and require receptionist to re-enter counter cash"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      <span>Rejected &amp; Reentered</span>
                    </button>

                    {/* Option 3: Accepted */}
                    <button
                      onClick={() =>
                        setSelectedItem({
                          type: "SHIFT_CLOSING",
                          item: shift,
                          action: "APPROVED",
                        })
                      }
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm transition-colors flex items-center gap-1.5"
                      title="Accept shift submission"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Accepted</span>
                    </button>
                  </div>
                </div>
              );
            })}

            {pendingShifts.length === 0 && (
              <div className="p-8 text-center text-slate-400 text-xs">
                All caught up! No pending shift closes awaiting approval.
              </div>
            )}
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* SUBTAB 3: PHARMACY STOCK REQUESTS */}
      {/* ------------------------------------------------------------- */}
      {activeSubTab === "stock" && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="p-5 bg-gradient-to-r from-slate-900 to-purple-950 text-white flex items-center justify-between">
            <div>
              <h4 className="text-sm font-bold flex items-center gap-2">
                <Package className="w-4 h-4 text-purple-400" />
                <span>Pending Pharmacist Intake &amp; Restock Requests</span>
              </h4>
              <p className="text-xs text-slate-400">
                Admin approval gates ensure zero unauthorized stock addition.
              </p>
            </div>
            <span className="px-3 py-1 bg-amber-500 text-slate-950 rounded-full text-xs font-black">
              {pendingStock.length} Pending
            </span>
          </div>

          <div className="divide-y divide-slate-100">
            {pendingStock.map((req) => {
              let details: any = {};
              try {
                details = JSON.parse(req.details);
              } catch (e) {}

              const margin =
                details.sellingPrice && details.purchasePrice
                  ? (
                      ((details.sellingPrice - details.purchasePrice) /
                        details.sellingPrice) *
                      100
                    ).toFixed(1)
                  : "0";

              return (
                <div
                  key={req.id}
                  className="p-5 hover:bg-slate-50 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                        Batch: {details.batchNumber || "BATCH"}
                      </span>
                      <h5 className="text-sm font-extrabold text-slate-900">
                        {details.medicineName || "Medicine Intake"}
                      </h5>
                      {details.genericName && (
                        <span className="text-xs text-slate-500 italic">
                          ({details.genericName})
                        </span>
                      )}
                      <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-900 border border-amber-200">
                        Intake: {details.quantity || 0} units
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                        Alert Threshold: {details.threshold ?? details.newThreshold ?? 10} units
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
                        Per Off: {details.perOff ?? req.currentMedicineInfo?.perOff ?? 0}%
                      </span>
                    </div>

                    <div className="text-xs text-slate-600 flex flex-wrap items-center gap-3 pt-0.5">
                      <span>
                        Purchase Cost: <strong className="text-slate-900 font-bold">Rs. {details.purchasePrice}</strong>
                      </span>
                      <span>·</span>
                      <span>
                        Selling Price: <strong className="text-slate-900 font-bold">Rs. {details.sellingPrice}</strong>
                      </span>
                      <span>·</span>
                      <span className="text-emerald-700 font-bold">
                        Est. Margin: {margin}%
                      </span>
                      <span>·</span>
                      <span>
                        Expiry: <strong className="text-slate-800">{details.expiryDate ? new Date(details.expiryDate).toLocaleDateString() : "N/A"}</strong>
                      </span>
                      <span>·</span>
                      <span className="text-slate-400">
                        Requested by {req.requestedBy?.name} ({new Date(req.createdAt).toLocaleDateString()})
                      </span>
                    </div>

                    {details.reason && (
                      <p className="text-xs text-slate-600 italic bg-slate-50 p-2 rounded-lg border border-slate-100">
                        &ldquo;{details.reason}&rdquo;
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0 flex-wrap sm:flex-nowrap">
                    <button
                      onClick={() => handleOpenStockReview(req)}
                      className="px-3.5 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold shadow-sm transition-colors flex items-center gap-1.5"
                      title="Review details, preview live state comparison, or modify parameters before approving"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Preview / Edit &amp; Action</span>
                    </button>
                    <button
                      onClick={() => {
                        handleOpenStockReview(req);
                      }}
                      className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm transition-colors flex items-center gap-1.5"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Approve</span>
                    </button>
                  </div>
                </div>
              );
            })}

            {pendingStock.length === 0 && (
              <div className="p-8 text-center text-slate-400 text-xs">
                All caught up! No pending stock requests awaiting approval.
              </div>
            )}
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* SUBTAB 4: HISTORICAL DECISION LOGS */}
      {/* ------------------------------------------------------------- */}
      {activeSubTab === "history" && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="p-4 bg-slate-50 border-b border-slate-200">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Historical Approval &amp; Rejection Decisions
            </h4>
          </div>

          <div className="divide-y divide-slate-100 text-xs">
            {/* Shifts History */}
            {historicalShifts.map((s) => (
              <div
                key={s.id}
                className="p-4 flex items-center justify-between text-slate-700 hover:bg-slate-50/50"
              >
                <div>
                  <div className="font-bold text-slate-900 flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                      {s.portal === "PHARMACY" ? "Pharmacy Shift" : "Reception Shift"}
                    </span>
                    <span>
                      {s.user?.name} ·{" "}
                      {new Date(s.shiftDate).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    Counted: Rs. {s.countedCash.toLocaleString()} | System: Rs.{" "}
                    {s.totalSystemCash.toLocaleString()} | Variance: Rs.{" "}
                    {s.variance.toLocaleString()}
                  </div>
                  {s.adminComment && (
                    <div className="text-[11px] text-slate-600 italic mt-0.5">
                      Admin Note: {s.adminComment}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => {
                      setSelectedVoucherData({
                        id: s.id,
                        shiftDate: s.shiftDate,
                        receptionistName: s.user?.name || (s.portal === "PHARMACY" ? "Pharmacist" : "Receptionist"),
                        receptionistEmail: s.user?.email,
                        totalSystemCash: s.totalSystemCash,
                        countedCash: s.countedCash,
                        variance: s.variance,
                        notes: s.notes,
                        status: s.status,
                        portal: s.portal,
                        closedAt: s.updatedAt || s.createdAt,
                        serviceBreakdown: s.serviceBreakdown,
                        cashInList: s.cashInList,
                        cashOutList: s.cashOutList,
                        totalCashIn: s.totalCashIn,
                        totalCashOut: s.totalCashOut,
                      });
                      setVoucherModalOpen(true);
                    }}
                    className="px-2.5 py-1 text-xs font-bold text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg flex items-center gap-1 shadow-sm"
                  >
                    <Printer className="w-3 h-3 text-slate-500" />
                    <span>Preview</span>
                  </button>
                  <div className="text-right">
                    <span
                      className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        s.status === "APPROVED" || s.status === "CLOSED"
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {s.status}
                    </span>
                    <div className="text-[10px] text-slate-400 mt-0.5">
                      {new Date(s.updatedAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {/* Drawer Adjustments History */}
            {historicalAdjustments.map((adj) => (
              <div
                key={adj.id}
                className="p-4 flex items-center justify-between text-slate-700 hover:bg-slate-50/50"
              >
                <div>
                  <div className="font-bold text-slate-900 flex items-center gap-2">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                        adj.type === "CASH_IN"
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                          : "bg-amber-50 text-amber-700 border-amber-200"
                      }`}
                    >
                      {adj.type === "CASH_IN" ? "Cash In" : "Cash Out"}
                    </span>
                    <span>
                      Rs. {adj.amount.toLocaleString()} · {adj.user?.name}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    Remarks: &ldquo;{adj.remarks}&rdquo;
                  </div>
                  {adj.adminComment && (
                    <div className="text-[11px] text-slate-600 italic mt-0.5">
                      Admin Note: {adj.adminComment}
                    </div>
                  )}
                </div>

                <div className="text-right">
                  <span
                    className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                      adj.status === "APPROVED"
                        ? "bg-emerald-100 text-emerald-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {adj.status}
                  </span>
                  <div className="text-[10px] text-slate-400 mt-0.5">
                    {new Date(adj.updatedAt).toLocaleDateString()}
                  </div>
                </div>
              </div>
            ))}

            {/* Stock Decisions History */}
            {historicalStock.map((req) => {
              let details: any = {};
              try {
                details = JSON.parse(req.details);
              } catch (e) {}

              return (
                <div
                  key={req.id}
                  className="p-4 flex items-center justify-between text-slate-700 hover:bg-slate-50/50"
                >
                  <div>
                    <div className="font-bold text-slate-900 flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
                        Stock Batch
                      </span>
                      <span>
                        {details.medicineName} ({details.batchNumber})
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      {details.quantity} units · Requested by{" "}
                      {req.requestedBy?.name}
                    </div>
                    {req.comment && (
                      <div className="text-[11px] text-slate-600 italic mt-0.5">
                        Admin Note: {req.comment}
                      </div>
                    )}
                  </div>

                  <div className="text-right">
                    <span
                      className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        req.status === "APPROVED"
                          ? "bg-emerald-100 text-emerald-800"
                          : req.status === "CANCELLED"
                          ? "bg-slate-100 text-slate-700 border border-slate-300"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {req.status}
                    </span>
                    <div className="text-[10px] text-slate-400 mt-0.5">
                      {new Date(req.updatedAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              );
            })}

            {historicalShifts.length === 0 &&
              historicalAdjustments.length === 0 &&
              historicalStock.length === 0 && (
                <div className="p-8 text-center text-slate-400 text-xs">
                  No historical approval decisions found.
                </div>
              )}
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* UNIFIED APPROVAL / REJECTION CONFIRMATION MODAL */}
      {/* ------------------------------------------------------------- */}
      {selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-100">
            <div
              className={`p-5 text-white flex items-center justify-between ${
                selectedItem.action === "APPROVED"
                  ? "bg-emerald-700"
                  : "bg-red-700"
              }`}
            >
              <h3 className="text-sm font-bold flex items-center gap-2">
                {selectedItem.action === "APPROVED" ? (
                  <CheckCircle2 className="w-4 h-4" />
                ) : (
                  <XCircle className="w-4 h-4" />
                )}
                <span>
                  {selectedItem.type === "SHIFT_CLOSING"
                    ? selectedItem.action === "APPROVED"
                      ? "Accept Shift Submission"
                      : "Reject & Require Re-entry"
                    : `Confirm ${
                        selectedItem.type === "DRAWER_ADJUSTMENT"
                          ? "Drawer Adjustment"
                          : "Stock Intake"
                      } ${selectedItem.action === "APPROVED" ? "Approval" : "Rejection"}`}
                </span>
              </h3>
              <button
                onClick={() => setSelectedItem(null)}
                className="text-white/80 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-4">
              <p className="text-xs text-slate-600 leading-relaxed">
                {selectedItem.type === "SHIFT_CLOSING"
                  ? selectedItem.action === "APPROVED"
                    ? "Accepting this shift submission will officially confirm and commit its financial revenue totals into hospital records and audit logs."
                    : "Rejecting this shift submission will return it to the receptionist so they can re-enter their physical counter cash."
                  : selectedItem.action === "APPROVED"
                  ? selectedItem.type === "DRAWER_ADJUSTMENT"
                    ? "Approving this adjustment will update the official cash drawer balance for shift reconciliation."
                    : "Approving this request will immediately mark the stock batch as APPROVED and make it sellable at the pharmacy POS."
                  : "Rejecting this item will return it with your notes so the operator can adjust or review."}
              </p>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                  Admin Comment / Audit Justification
                </label>
                <textarea
                  rows={3}
                  placeholder={
                    selectedItem.type === "SHIFT_CLOSING" && selectedItem.action === "REJECTED"
                      ? "Reason for rejection (e.g. Physical cash does not match, please recount drawer and re-enter)..."
                      : "e.g. Verified against drawer physical cash count..."
                  }
                  value={adminComment}
                  onChange={(e) => setAdminComment(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedItem(null)}
                  disabled={processing}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleProcessAction}
                  disabled={processing}
                  className={`px-5 py-2 rounded-xl text-xs font-bold text-white shadow-md transition-all flex items-center gap-1.5 ${
                    selectedItem.action === "APPROVED"
                      ? "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20"
                      : "bg-red-600 hover:bg-red-700 shadow-red-600/20"
                  }`}
                >
                  {processing ? (
                    <span>Processing...</span>
                  ) : (
                    <span>
                      {selectedItem.type === "SHIFT_CLOSING"
                        ? selectedItem.action === "APPROVED"
                          ? "Confirm Accepted"
                          : "Confirm Rejected & Reenter"
                        : `Confirm ${selectedItem.action === "APPROVED" ? "Approval" : "Rejection"}`}
                    </span>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Shift Submission Details Preview Modal */}
      <ShiftSubmissionDetailsModal
        shift={previewShiftDetails}
        isOpen={Boolean(previewShiftDetails)}
        onClose={() => setPreviewShiftDetails(null)}
        onApprove={(shift) => {
          setPreviewShiftDetails(null);
          setSelectedItem({
            type: "SHIFT_CLOSING",
            item: shift,
            action: "APPROVED",
          });
        }}
        onReject={(shift) => {
          setPreviewShiftDetails(null);
          setSelectedItem({
            type: "SHIFT_CLOSING",
            item: shift,
            action: "REJECTED",
          });
        }}
        onPrint={(shift) => {
          setSelectedVoucherData({
            id: shift.id,
            shiftDate: shift.shiftDate,
            receptionistName:
              shift.user?.name ||
              (shift.portal === "PHARMACY" ? "Pharmacist" : "Receptionist"),
            receptionistEmail: shift.user?.email,
            totalSystemCash: shift.totalSystemCash,
            countedCash: shift.countedCash,
            variance: shift.variance,
            notes: shift.notes,
            status: shift.status,
            portal: shift.portal,
            closedAt: shift.updatedAt || shift.createdAt,
            serviceBreakdown: shift.serviceBreakdown,
            cashInList: shift.cashInList,
            cashOutList: shift.cashOutList,
            totalCashIn: shift.totalCashIn,
            totalCashOut: shift.totalCashOut,
          });
          setVoucherModalOpen(true);
        }}
      />

      {/* Advanced Stock Intake Review & Management Modal */}
      {selectedStockForReview && (() => {
        let details = selectedStockForReview.parsedDetails || {};
        if (!details.medicineName && typeof selectedStockForReview.details === "string") {
          try {
            details = JSON.parse(selectedStockForReview.details);
          } catch (e) {}
        }
        const medInfo = selectedStockForReview.currentMedicineInfo || null;
        const currentStock = medInfo?.currentStock ?? 0;
        const requestedQty = parseInt(modifiedStockForm.quantity || "0", 10) || 0;
        const resultingStock = currentStock + requestedQty;

        const sp = parseFloat(modifiedStockForm.sellingPrice || "0") || 0;
        const pp = parseFloat(modifiedStockForm.purchasePrice || "0") || 0;
        const calcMargin = sp > 0 ? (((sp - pp) / sp) * 100).toFixed(1) : "0";
        const totalBatchVal = requestedQty * sp;

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
            <div className="bg-white rounded-3xl shadow-2xl max-w-3xl w-full overflow-hidden border border-slate-100 flex flex-col max-h-[92vh]">
              {/* Modal Header */}
              <div className="p-5 bg-gradient-to-r from-slate-900 via-purple-950 to-indigo-950 text-white flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-purple-500/20 text-purple-400 font-extrabold flex items-center justify-center border border-purple-400/30">
                    <Package className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-extrabold">
                        {details.medicineName || "Stock Intake Request"}
                      </h3>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-amber-400 text-slate-950">
                        Pending Admin Decision
                      </span>
                    </div>
                    <p className="text-xs text-purple-200 mt-0.5">
                      Batch #{details.batchNumber} · Requested by {selectedStockForReview.requestedBy?.name || "Staff"} on {new Date(selectedStockForReview.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setSelectedStockForReview(null)}
                  className="p-1.5 text-purple-300 hover:text-white rounded-xl hover:bg-white/10 transition-colors"
                >
                  ✕
                </button>
              </div>

              {/* Subtab Switcher */}
              <div className="px-6 pt-4 pb-2 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setStockReviewTab("preview")}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                      stockReviewTab === "preview"
                        ? "bg-purple-600 text-white shadow-sm"
                        : "text-slate-600 hover:bg-slate-200/60"
                    }`}
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>1. Preview &amp; State Comparison</span>
                  </button>
                  <button
                    onClick={() => setStockReviewTab("edit")}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                      stockReviewTab === "edit"
                        ? "bg-purple-600 text-white shadow-sm"
                        : "text-slate-600 hover:bg-slate-200/60"
                    }`}
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>2. Modify / Re-enter Values</span>
                  </button>
                </div>

                <span className="text-[11px] font-medium text-slate-400">
                  {stockReviewTab === "preview" ? "Live vs Proposed Audit View" : "Override values before final approval"}
                </span>
              </div>

              {/* Modal Body */}
              <div className="p-6 overflow-y-auto space-y-5 flex-1">
                {stockReviewTab === "preview" ? (
                  <div className="space-y-4">
                    {/* Comparison Cards Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Left: Current State */}
                      <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                        <div className="flex items-center justify-between border-b border-slate-200/70 pb-2">
                          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                            Current Active Inventory State
                          </span>
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-200 text-slate-700">
                            Pre-Approval
                          </span>
                        </div>

                        <div className="space-y-2 text-xs">
                          <div className="flex justify-between py-1 border-b border-slate-100">
                            <span className="text-slate-500">Live Available Stock:</span>
                            <span className="font-bold text-slate-900">{currentStock} units</span>
                          </div>
                          <div className="flex justify-between py-1 border-b border-slate-100">
                            <span className="text-slate-500">Safety Alert Threshold:</span>
                            <span className="font-bold text-slate-900">&le; {medInfo?.threshold ?? 10} units</span>
                          </div>
                          <div className="flex justify-between py-1 border-b border-slate-100">
                            <span className="text-slate-500">Current Per Off:</span>
                            <span className="font-bold text-purple-700">{medInfo?.perOff ?? 0}%</span>
                          </div>
                          <div className="flex justify-between py-1 border-b border-slate-100">
                            <span className="text-slate-500">Active Selling Price:</span>
                            <span className="font-bold text-slate-900">Rs. {medInfo?.sellingPrice ?? 0}</span>
                          </div>
                          <div className="flex justify-between py-1">
                            <span className="text-slate-500">Active Cost Price:</span>
                            <span className="font-bold text-slate-700">Rs. {medInfo?.purchasePrice ?? 0}</span>
                          </div>
                        </div>
                      </div>

                      {/* Right: Proposed / Modified State */}
                      <div className="p-4 bg-purple-50/60 border border-purple-200 rounded-2xl space-y-3">
                        <div className="flex items-center justify-between border-b border-purple-200/70 pb-2">
                          <span className="text-xs font-bold uppercase tracking-wider text-purple-900">
                            Proposed Pharmacist Request
                          </span>
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-200 text-purple-900">
                            Pending Commit
                          </span>
                        </div>

                        <div className="space-y-2 text-xs">
                          <div className="flex justify-between py-1 border-b border-purple-100">
                            <span className="text-purple-800">Intake Batch Quantity:</span>
                            <span className="font-black text-purple-950">+{requestedQty} units</span>
                          </div>
                          <div className="flex justify-between py-1 border-b border-purple-100">
                            <span className="text-purple-800">Proposed Alert Threshold:</span>
                            <span className="font-bold text-purple-950">&le; {modifiedStockForm.threshold} units</span>
                          </div>
                          <div className="flex justify-between py-1 border-b border-purple-100">
                            <span className="text-purple-800">Requested Per Off (%):</span>
                            <span className="font-black text-purple-700">{modifiedStockForm.perOff}% Off</span>
                          </div>
                          <div className="flex justify-between py-1 border-b border-purple-100">
                            <span className="text-purple-800">Selling Price:</span>
                            <span className="font-bold text-purple-950">Rs. {modifiedStockForm.sellingPrice}</span>
                          </div>
                          <div className="flex justify-between py-1">
                            <span className="text-purple-800">Purchase Cost:</span>
                            <span className="font-bold text-purple-950">Rs. {modifiedStockForm.purchasePrice}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Impact Banner */}
                    <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-2xl grid grid-cols-1 sm:grid-cols-3 gap-3 text-center">
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">
                          Resulting Total Stock
                        </span>
                        <div className="text-lg font-black text-emerald-950">
                          {resultingStock} units
                        </div>
                        <span className="text-[10px] text-emerald-600">
                          ({currentStock} current + {requestedQty} new)
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">
                          Estimated Profit Margin
                        </span>
                        <div className="text-lg font-black text-emerald-950">
                          {calcMargin}%
                        </div>
                        <span className="text-[10px] text-emerald-600">
                          Rs. {sp - pp} profit / unit
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">
                          Total Batch Value
                        </span>
                        <div className="text-lg font-black text-emerald-950">
                          Rs. {totalBatchVal.toLocaleString()}
                        </div>
                        <span className="text-[10px] text-emerald-600">
                          at proposed retail price
                        </span>
                      </div>
                    </div>

                    {details.reason && (
                      <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700">
                        <span className="font-bold text-slate-900">Pharmacist Submission Note:</span> &ldquo;{details.reason}&rdquo;
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="p-3 bg-purple-50 border border-purple-200 rounded-xl text-purple-900 text-xs">
                      <strong>Admin Parameter Override:</strong> You can modify any requested values below. Approving will commit these modified values into live POS inventory.
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                          Batch Number *
                        </label>
                        <input
                          type="text"
                          required
                          value={modifiedStockForm.batchNumber}
                          onChange={(e) =>
                            setModifiedStockForm({ ...modifiedStockForm, batchNumber: e.target.value })
                          }
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500 font-mono"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                          Intake Quantity (Units) *
                        </label>
                        <input
                          type="number"
                          required
                          min="1"
                          value={modifiedStockForm.quantity}
                          onChange={(e) =>
                            setModifiedStockForm({ ...modifiedStockForm, quantity: e.target.value })
                          }
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
                          value={modifiedStockForm.purchasePrice}
                          onChange={(e) =>
                            setModifiedStockForm({ ...modifiedStockForm, purchasePrice: e.target.value })
                          }
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                          Selling Price (Rs.) *
                        </label>
                        <input
                          type="number"
                          step="0.5"
                          min="0"
                          required
                          value={modifiedStockForm.sellingPrice}
                          onChange={(e) =>
                            setModifiedStockForm({ ...modifiedStockForm, sellingPrice: e.target.value })
                          }
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
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
                            value={modifiedStockForm.perOff}
                            onChange={(e) =>
                              setModifiedStockForm({ ...modifiedStockForm, perOff: e.target.value })
                            }
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500"
                          />
                          <span className="absolute right-3 top-2 text-[11px] text-slate-400 font-bold">%</span>
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                          Warning Alert Threshold (Units) *
                        </label>
                        <input
                          type="number"
                          min="1"
                          required
                          value={modifiedStockForm.threshold}
                          onChange={(e) =>
                            setModifiedStockForm({ ...modifiedStockForm, threshold: e.target.value })
                          }
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                          Batch Expiry Date *
                        </label>
                        <input
                          type="date"
                          required
                          value={modifiedStockForm.expiryDate}
                          onChange={(e) =>
                            setModifiedStockForm({ ...modifiedStockForm, expiryDate: e.target.value })
                          }
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                      </div>

                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                        <div>
                          <div className="text-[11px] font-bold text-slate-500">Live Margin Outcome:</div>
                          <div className="text-base font-black text-emerald-700">{calcMargin}%</div>
                        </div>
                        <div>
                          <div className="text-[11px] font-bold text-slate-500">Live Total Stock:</div>
                          <div className="text-base font-black text-slate-900">{resultingStock} units</div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Optional Admin Note */}
                <div className="pt-2">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                    Admin Audit Note / Decision Remarks (Optional)
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Enter any audit observations, reasons for modification, rejection, or cancellation..."
                    value={modifiedStockForm.adminComment}
                    onChange={(e) =>
                      setModifiedStockForm({ ...modifiedStockForm, adminComment: e.target.value })
                    }
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>

              {/* Modal Footer with Actions */}
              <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
                <button
                  type="button"
                  disabled={processing}
                  onClick={() => handleProcessStockAction("CANCELLED")}
                  className="px-3.5 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5"
                  title="Cancel and archive this request entirely"
                >
                  <Ban className="w-3.5 h-3.5" />
                  <span>Cancel / Archive Request</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={processing}
                    onClick={() => handleProcessStockAction("REJECTED")}
                    className="px-3.5 py-2 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5"
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    <span>Reject</span>
                  </button>

                  <button
                    type="button"
                    disabled={processing}
                    onClick={() => handleProcessStockAction("APPROVED")}
                    className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-600/20 transition-all flex items-center gap-1.5"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{processing ? "Processing..." : "Approve & Commit Stock"}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Shift Voucher Preview Modal */}
      <ShiftClosingVoucherModal
        closing={selectedVoucherData}
        isOpen={voucherModalOpen}
        onClose={() => setVoucherModalOpen(false)}
      />
    </div>
  );
}


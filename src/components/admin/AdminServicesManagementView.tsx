"use client";

import React, { useState, useEffect } from "react";
import {
  Activity,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Search,
  Check,
  X,
  Stethoscope,
  Receipt,
  ToggleLeft,
  ToggleRight,
  ShieldCheck,
} from "lucide-react";
import {
  UltrasoundServiceInputSchema,
  TokenServiceInputSchema,
} from "@/lib/validation/services";

export interface UltrasoundServiceItem {
  id: string;
  name: string;
  price: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface TokenServiceItem {
  id: string;
  name: string;
  fee: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export function AdminServicesManagementView() {
  // Data state
  const [ultrasoundServices, setUltrasoundServices] = useState<UltrasoundServiceItem[]>([]);
  const [tokenServices, setTokenServices] = useState<TokenServiceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Search & filter
  const [searchQuery, setSearchQuery] = useState("");

  // Feedback notifications
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Modal states - Ultrasound
  const [showAddUltrasoundModal, setShowAddUltrasoundModal] = useState(false);
  const [editingUltrasound, setEditingUltrasound] = useState<UltrasoundServiceItem | null>(null);
  const [ultrasoundForm, setUltrasoundForm] = useState({ name: "", price: "", isActive: true });
  const [ultrasoundErrors, setUltrasoundErrors] = useState<{ name?: string; price?: string }>({});
  const [savingUltrasound, setSavingUltrasound] = useState(false);

  // Modal states - Token Service
  const [showAddTokenModal, setShowAddTokenModal] = useState(false);
  const [editingToken, setEditingToken] = useState<TokenServiceItem | null>(null);
  const [tokenForm, setTokenForm] = useState({ name: "", fee: "", isActive: true });
  const [tokenErrors, setTokenErrors] = useState<{ name?: string; fee?: string }>({});
  const [savingToken, setSavingToken] = useState(false);

  // Delete confirmations
  const [deleteTarget, setDeleteTarget] = useState<{ type: "ultrasound" | "token"; id: string; name: string } | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Fetch all services
  const fetchServices = async () => {
    try {
      const [usRes, tsRes] = await Promise.all([
        fetch("/api/admin/services/ultrasound"),
        fetch("/api/admin/services/tokens"),
      ]);

      if (usRes.ok) {
        const usData = await usRes.json();
        setUltrasoundServices(usData.services || []);
      }
      if (tsRes.ok) {
        const tsData = await tsRes.json();
        setTokenServices(tsData.services || []);
      }
    } catch (err) {
      console.error("Failed to load services:", err);
      setFeedback({ type: "error", message: "Failed to connect to database for services." });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchServices();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchServices();
  };

  // -------------------------------------------------------------
  // Ultrasound Handlers
  // -------------------------------------------------------------
  const openAddUltrasound = () => {
    setUltrasoundForm({ name: "", price: "", isActive: true });
    setUltrasoundErrors({});
    setShowAddUltrasoundModal(true);
  };

  const openEditUltrasound = (item: UltrasoundServiceItem) => {
    setEditingUltrasound(item);
    setUltrasoundForm({ name: item.name, price: String(item.price), isActive: item.isActive });
    setUltrasoundErrors({});
  };

  const handleSaveUltrasound = async (e: React.FormEvent) => {
    e.preventDefault();
    setUltrasoundErrors({});

    const parseResult = UltrasoundServiceInputSchema.safeParse({
      name: ultrasoundForm.name,
      price: ultrasoundForm.price,
      isActive: ultrasoundForm.isActive,
    });

    if (!parseResult.success) {
      const fieldErrors = parseResult.error.flatten().fieldErrors;
      setUltrasoundErrors({
        name: fieldErrors.name?.[0],
        price: fieldErrors.price?.[0],
      });
      return;
    }

    setSavingUltrasound(true);
    try {
      const url = editingUltrasound
        ? `/api/admin/services/ultrasound/${editingUltrasound.id}`
        : "/api/admin/services/ultrasound";
      const method = editingUltrasound ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parseResult.data),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to save ultrasound service");
      }

      setFeedback({ type: "success", message: data.message || "Ultrasound service saved successfully." });
      setShowAddUltrasoundModal(false);
      setEditingUltrasound(null);
      fetchServices();
    } catch (err: any) {
      setFeedback({ type: "error", message: err.message || "Failed to save ultrasound service." });
    } finally {
      setSavingUltrasound(false);
    }
  };

  const handleToggleUltrasoundActive = async (item: UltrasoundServiceItem) => {
    try {
      const res = await fetch(`/api/admin/services/ultrasound/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !item.isActive }),
      });
      if (res.ok) {
        setFeedback({
          type: "success",
          message: `Ultrasound "${item.name}" is now ${!item.isActive ? "ACTIVE" : "INACTIVE"}.`,
        });
        fetchServices();
      } else {
        const data = await res.json();
        throw new Error(data.error || "Failed to update status");
      }
    } catch (err: any) {
      setFeedback({ type: "error", message: err.message });
    }
  };

  // -------------------------------------------------------------
  // Token Service Handlers
  // -------------------------------------------------------------
  const openAddToken = () => {
    setTokenForm({ name: "", fee: "", isActive: true });
    setTokenErrors({});
    setShowAddTokenModal(true);
  };

  const openEditToken = (item: TokenServiceItem) => {
    setEditingToken(item);
    setTokenForm({ name: item.name, fee: String(item.fee), isActive: item.isActive });
    setTokenErrors({});
  };

  const handleSaveToken = async (e: React.FormEvent) => {
    e.preventDefault();
    setTokenErrors({});

    const parseResult = TokenServiceInputSchema.safeParse({
      name: tokenForm.name,
      fee: tokenForm.fee,
      isActive: tokenForm.isActive,
    });

    if (!parseResult.success) {
      const fieldErrors = parseResult.error.flatten().fieldErrors;
      setTokenErrors({
        name: fieldErrors.name?.[0],
        fee: fieldErrors.fee?.[0],
      });
      return;
    }

    setSavingToken(true);
    try {
      const url = editingToken
        ? `/api/admin/services/tokens/${editingToken.id}`
        : "/api/admin/services/tokens";
      const method = editingToken ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parseResult.data),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to save token service");
      }

      setFeedback({ type: "success", message: data.message || "Token service saved successfully." });
      setShowAddTokenModal(false);
      setEditingToken(null);
      fetchServices();
    } catch (err: any) {
      setFeedback({ type: "error", message: err.message || "Failed to save token service." });
    } finally {
      setSavingToken(false);
    }
  };

  const handleToggleTokenActive = async (item: TokenServiceItem) => {
    try {
      const res = await fetch(`/api/admin/services/tokens/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !item.isActive }),
      });
      if (res.ok) {
        setFeedback({
          type: "success",
          message: `Token service "${item.name}" is now ${!item.isActive ? "ACTIVE" : "INACTIVE"}.`,
        });
        fetchServices();
      } else {
        const data = await res.json();
        throw new Error(data.error || "Failed to update status");
      }
    } catch (err: any) {
      setFeedback({ type: "error", message: err.message });
    }
  };

  // -------------------------------------------------------------
  // Delete Execution
  // -------------------------------------------------------------
  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const url =
        deleteTarget.type === "ultrasound"
          ? `/api/admin/services/ultrasound/${deleteTarget.id}`
          : `/api/admin/services/tokens/${deleteTarget.id}`;

      const res = await fetch(url, { method: "DELETE" });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to delete item");
      }

      setFeedback({ type: "success", message: data.message || "Item deleted successfully." });
      setDeleteTarget(null);
      fetchServices();
    } catch (err: any) {
      setFeedback({ type: "error", message: err.message || "Failed to delete item." });
    } finally {
      setDeleting(false);
    }
  };

  // Filtered lists
  const filteredUltrasound = ultrasoundServices.filter((s) =>
    s.name.toLowerCase().includes(searchQuery.toLowerCase().trim())
  );
  const filteredTokens = tokenServices.filter((s) =>
    s.name.toLowerCase().includes(searchQuery.toLowerCase().trim())
  );

  return (
    <div className="space-y-6">
      {/* Top Banner / Header */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
              <Stethoscope className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900 tracking-tight">
                Hospital Services &amp; Tariff Management
              </h2>
              <p className="text-xs text-slate-500">
                Manage prescribed ultrasound diagnostic scans, token services, and counter billing fees in real-time.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search services or scans..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 font-medium w-48 sm:w-60"
            />
          </div>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="p-2 text-slate-600 hover:text-indigo-600 bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-200 transition-colors"
            title="Refresh database records"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin text-indigo-600" : ""}`} />
          </button>
        </div>
      </div>

      {/* Live Feedback Toast/Banner */}
      {feedback && (
        <div
          className={`p-4 rounded-xl border flex items-center justify-between text-xs font-semibold animate-in fade-in duration-200 ${
            feedback.type === "success"
              ? "bg-emerald-50 text-emerald-900 border-emerald-200"
              : "bg-rose-50 text-rose-900 border-rose-200"
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span>{feedback.message}</span>
          </div>
          <button
            onClick={() => setFeedback(null)}
            className="text-slate-400 hover:text-slate-600 p-1"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Main Grid: 2 Side-by-Side Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ========================================================= */}
        {/* SECTION 1: Prescribed Ultrasound Services */}
        {/* ========================================================= */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden flex flex-col justify-between">
          <div className="p-5 border-b border-slate-100">
            <div className="flex items-center justify-between gap-2 mb-1">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-amber-50 text-amber-600 rounded-lg">
                  <Activity className="w-4 h-4 text-amber-600" />
                </div>
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">
                  Prescribed Ultrasound Services
                </h3>
              </div>
              <button
                onClick={openAddUltrasound}
                className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-black flex items-center gap-1.5 transition-colors shadow-sm"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Scan</span>
              </button>
            </div>
            <p className="text-xs text-slate-500">
              Diagnostic procedures featured in Receptionist &amp; Pharmacy Fast Selection grids.
            </p>
          </div>

          <div className="p-4 flex-1">
            {loading ? (
              <div className="py-12 text-center text-xs text-slate-400">Loading ultrasound services...</div>
            ) : filteredUltrasound.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-400">
                {searchQuery ? "No matching ultrasound services found." : "No ultrasound services added yet."}
              </div>
            ) : (
              <div className="space-y-2.5">
                {filteredUltrasound.map((svc) => (
                  <div
                    key={svc.id}
                    className={`p-3.5 rounded-xl border transition-all flex items-center justify-between gap-3 ${
                      svc.isActive
                        ? "bg-slate-50 hover:bg-amber-50/40 border-slate-200"
                        : "bg-slate-100/60 border-slate-200 opacity-60"
                    }`}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-xs text-slate-900">{svc.name}</span>
                        <span
                          className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${
                            svc.isActive
                              ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                              : "bg-slate-200 text-slate-600 border border-slate-300"
                          }`}
                        >
                          {svc.isActive ? "Active" : "Inactive"}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5 font-mono">
                        Price: <span className="font-bold text-amber-700">Rs. {Number(svc.price).toLocaleString()}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={() => handleToggleUltrasoundActive(svc)}
                        className={`p-1.5 rounded-lg border text-xs font-medium transition-colors ${
                          svc.isActive
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
                            : "bg-slate-200 text-slate-600 border-slate-300 hover:bg-slate-300"
                        }`}
                        title={svc.isActive ? "Click to Deactivate" : "Click to Activate"}
                      >
                        {svc.isActive ? <ToggleRight className="w-4 h-4 text-emerald-600" /> : <ToggleLeft className="w-4 h-4 text-slate-500" />}
                      </button>
                      <button
                        onClick={() => openEditUltrasound(svc)}
                        className="p-1.5 text-slate-600 hover:text-indigo-600 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors"
                        title="Edit Service"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setDeleteTarget({ type: "ultrasound", id: svc.id, name: svc.name })}
                        className="p-1.5 text-slate-400 hover:text-rose-600 bg-white hover:bg-rose-50 border border-slate-200 rounded-lg transition-colors"
                        title="Delete Service"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="px-5 py-3 bg-slate-50 border-t border-slate-100 text-[11px] text-slate-500 flex justify-between">
            <span>Total Scans: {ultrasoundServices.length}</span>
            <span>Active in Portals: {ultrasoundServices.filter((s) => s.isActive).length}</span>
          </div>
        </div>

        {/* ========================================================= */}
        {/* SECTION 2: Token Services & Token Fees */}
        {/* ========================================================= */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden flex flex-col justify-between">
          <div className="p-5 border-b border-slate-100">
            <div className="flex items-center justify-between gap-2 mb-1">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg">
                  <Receipt className="w-4 h-4 text-indigo-600" />
                </div>
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">
                  Token Services &amp; Token Fees
                </h3>
              </div>
              <button
                onClick={openAddToken}
                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black flex items-center gap-1.5 transition-colors shadow-sm"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Token Service</span>
              </button>
            </div>
            <p className="text-xs text-slate-500">
              Services and charges selected during token issuance at the Receptionist desk.
            </p>
          </div>

          <div className="p-4 flex-1">
            {loading ? (
              <div className="py-12 text-center text-xs text-slate-400">Loading token services...</div>
            ) : filteredTokens.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-400">
                {searchQuery ? "No matching token services found." : "No token services configured yet."}
              </div>
            ) : (
              <div className="space-y-2.5">
                {filteredTokens.map((svc) => (
                  <div
                    key={svc.id}
                    className={`p-3.5 rounded-xl border transition-all flex items-center justify-between gap-3 ${
                      svc.isActive
                        ? "bg-slate-50 hover:bg-indigo-50/40 border-slate-200"
                        : "bg-slate-100/60 border-slate-200 opacity-60"
                    }`}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-xs text-slate-900">{svc.name}</span>
                        <span
                          className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${
                            svc.isActive
                              ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                              : "bg-slate-200 text-slate-600 border border-slate-300"
                          }`}
                        >
                          {svc.isActive ? "Active" : "Inactive"}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5 font-mono">
                        Fee: <span className="font-bold text-indigo-700">Rs. {Number(svc.fee).toLocaleString()}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={() => handleToggleTokenActive(svc)}
                        className={`p-1.5 rounded-lg border text-xs font-medium transition-colors ${
                          svc.isActive
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
                            : "bg-slate-200 text-slate-600 border-slate-300 hover:bg-slate-300"
                        }`}
                        title={svc.isActive ? "Click to Deactivate" : "Click to Activate"}
                      >
                        {svc.isActive ? <ToggleRight className="w-4 h-4 text-emerald-600" /> : <ToggleLeft className="w-4 h-4 text-slate-500" />}
                      </button>
                      <button
                        onClick={() => openEditToken(svc)}
                        className="p-1.5 text-slate-600 hover:text-indigo-600 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors"
                        title="Edit Token Service"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setDeleteTarget({ type: "token", id: svc.id, name: svc.name })}
                        className="p-1.5 text-slate-400 hover:text-rose-600 bg-white hover:bg-rose-50 border border-slate-200 rounded-lg transition-colors"
                        title="Delete Service"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="px-5 py-3 bg-slate-50 border-t border-slate-100 text-[11px] text-slate-500 flex justify-between">
            <span>Total Token Services: {tokenServices.length}</span>
            <span>Active for Tokens: {tokenServices.filter((s) => s.isActive).length}</span>
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* MODAL: Add / Edit Ultrasound Service */}
      {/* ========================================================= */}
      {(showAddUltrasoundModal || editingUltrasound) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-amber-50 text-amber-600 rounded-lg">
                  <Activity className="w-4 h-4 text-amber-600" />
                </div>
                <h3 className="text-sm font-black text-slate-900">
                  {editingUltrasound ? "Edit Ultrasound Service" : "Add New Ultrasound Service"}
                </h3>
              </div>
              <button
                onClick={() => {
                  setShowAddUltrasoundModal(false);
                  setEditingUltrasound(null);
                }}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveUltrasound} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Ultrasound Procedure Name *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Ultrasound Abdomen, Ultrasound TVS"
                  value={ultrasoundForm.name}
                  onChange={(e) => setUltrasoundForm({ ...ultrasoundForm, name: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600 font-medium"
                />
                {ultrasoundErrors.name && (
                  <p className="text-[11px] text-rose-600 mt-1">{ultrasoundErrors.name}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Procedure Price (PKR / Rs.) *
                </label>
                <input
                  type="number"
                  step="any"
                  placeholder="e.g. 700 or 1200"
                  value={ultrasoundForm.price}
                  onChange={(e) => setUltrasoundForm({ ...ultrasoundForm, price: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600 font-medium"
                />
                {ultrasoundErrors.price && (
                  <p className="text-[11px] text-rose-600 mt-1">{ultrasoundErrors.price}</p>
                )}
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="usActiveCheckbox"
                  checked={ultrasoundForm.isActive}
                  onChange={(e) => setUltrasoundForm({ ...ultrasoundForm, isActive: e.target.checked })}
                  className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500 border-slate-300"
                />
                <label htmlFor="usActiveCheckbox" className="text-xs text-slate-700 font-semibold cursor-pointer">
                  Active (Immediately available in Receptionist &amp; Pharmacy Fast Selection)
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddUltrasoundModal(false);
                    setEditingUltrasound(null);
                  }}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingUltrasound}
                  className="px-4 py-2 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-xl transition-colors shadow-sm disabled:opacity-50"
                >
                  {savingUltrasound ? "Saving..." : editingUltrasound ? "Update Scan" : "Add Scan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: Add / Edit Token Service */}
      {/* ========================================================= */}
      {(showAddTokenModal || editingToken) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg">
                  <Receipt className="w-4 h-4 text-indigo-600" />
                </div>
                <h3 className="text-sm font-black text-slate-900">
                  {editingToken ? "Edit Token Service & Fee" : "Add New Token Service"}
                </h3>
              </div>
              <button
                onClick={() => {
                  setShowAddTokenModal(false);
                  setEditingToken(null);
                }}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveToken} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Token Service Name *
                </label>
                <input
                  type="text"
                  placeholder="e.g. OPD Fees, Sugar Test, BP, Dressing"
                  value={tokenForm.name}
                  onChange={(e) => setTokenForm({ ...tokenForm, name: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 font-medium"
                />
                {tokenErrors.name && (
                  <p className="text-[11px] text-rose-600 mt-1">{tokenErrors.name}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Token Fee (PKR / Rs.) *
                </label>
                <input
                  type="number"
                  step="any"
                  placeholder="e.g. 300, 100, 50"
                  value={tokenForm.fee}
                  onChange={(e) => setTokenForm({ ...tokenForm, fee: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 font-medium"
                />
                {tokenErrors.fee && (
                  <p className="text-[11px] text-rose-600 mt-1">{tokenErrors.fee}</p>
                )}
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="tsActiveCheckbox"
                  checked={tokenForm.isActive}
                  onChange={(e) => setTokenForm({ ...tokenForm, isActive: e.target.checked })}
                  className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300"
                />
                <label htmlFor="tsActiveCheckbox" className="text-xs text-slate-700 font-semibold cursor-pointer">
                  Active (Immediately selectable in Token Generator at Reception desk)
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddTokenModal(false);
                    setEditingToken(null);
                  }}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingToken}
                  className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-colors shadow-sm disabled:opacity-50"
                >
                  {savingToken ? "Saving..." : editingToken ? "Update Service" : "Add Service"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: Delete Confirmation */}
      {/* ========================================================= */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 text-center">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-black text-slate-900 mb-1">
              Confirm Delete Service
            </h3>
            <p className="text-xs text-slate-500 mb-5">
              Are you sure you want to permanently remove <span className="font-bold text-slate-800">"{deleteTarget.name}"</span>?
              Existing completed invoices and tokens will retain historical records.
            </p>
            <div className="flex items-center justify-center gap-2">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deleting}
                onClick={handleConfirmDelete}
                className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition-colors shadow-sm disabled:opacity-50"
              >
                {deleting ? "Deleting..." : "Yes, Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

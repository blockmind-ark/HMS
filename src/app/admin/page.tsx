"use client";

import React, { useState, useEffect } from "react";
import { Navbar } from "@/components/layout/Navbar";
import {
  ShieldAlert,
  TrendingUp,
  Banknote,
  Users,
  CalendarCheck,
  Package,
  FileSpreadsheet,
  History,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  ArrowUpRight,
  Filter,
  Search,
  Download,
  Building2,
  Pill,
  Sparkles,
  BarChart3,
  Stethoscope,
  ChevronRight,
  MessageSquare,
  Calendar,
  Printer,
  FileText,
  Percent,
  Receipt,
  Eye,
  EyeOff,
  Key,
  Copy,
  Check,
  RefreshCw,
  UserPlus,
  Trash2,
  UserCheck,
  Radio,
  Layers,
  Lock,
  Loader2,
  X,
  Network,
  Sliders,
} from "lucide-react";
import { ReportPreviewModal, ReportType } from "@/components/reports/ReportPreviewModal";
import { NetworkSecurityView } from "@/components/admin/NetworkSecurityView";
import { ApprovalsManagementView } from "@/components/admin/ApprovalsManagementView";
import { MedicinePurchaseSheetView } from "@/components/inventory/MedicinePurchaseSheetView";
import { AdminMedicineCatalogManagementView } from "@/components/admin/AdminMedicineCatalogManagementView";

export default function AdminPortal() {
  const [activeTab, setActiveTab] = useState<
    "dashboard" | "users" | "daily" | "approvals" | "inventory" | "reports" | "audit" | "network"
  >("dashboard");

  const [adminInventorySubTab, setAdminInventorySubTab] = useState<"catalog" | "purchases">("catalog");

  // Stats state
  const [stats, setStats] = useState<any>(null);
  const [loadingStats, setLoadingStats] = useState(true);

  // Daily Report state
  const [dailyDate, setDailyDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [dailyReport, setDailyReport] = useState<any | null>(null);
  const [loadingDailyReport, setLoadingDailyReport] = useState(false);
  const [dailyStreamFilter, setDailyStreamFilter] = useState<
    "ALL" | "CLINICAL" | "PHARMACY"
  >("ALL");

  // Approvals state
  const [requests, setRequests] = useState<any[]>([]);
  const [totalPendingApprovals, setTotalPendingApprovals] = useState(0);
  const [loadingRequests, setLoadingRequests] = useState(false);
  const [selectedReqForAction, setSelectedReqForAction] = useState<any | null>(null);
  const [actionStatus, setActionStatus] = useState<"APPROVED" | "REJECTED">("APPROVED");
  const [adminComment, setAdminComment] = useState("");
  const [processingAction, setProcessingAction] = useState(false);

  // Audit logs state
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [auditSearch, setAuditSearch] = useState("");
  const [auditActionFilter, setAuditActionFilter] = useState("ALL");
  const [loadingLogs, setLoadingLogs] = useState(false);

  // Reports Preview & Summary state
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [previewReportType, setPreviewReportType] = useState<ReportType>("visits");
  const [previewInitialSearch, setPreviewInitialSearch] = useState<string>("");
  const [patientEncounterSearch, setPatientEncounterSearch] = useState<string>("");
  const [reportsOverview, setReportsOverview] = useState<any>(null);
  const [loadingReportsOverview, setLoadingReportsOverview] = useState(false);

  // User Management states
  const [users, setUsers] = useState<any[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [userSearch, setUserSearch] = useState("");
  const [userRoleFilter, setUserRoleFilter] = useState("ALL");
  const [selectedUserForDetails, setSelectedUserForDetails] = useState<any | null>(null);

  // Add User Modal State
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [newUserName, setNewUserName] = useState("");
  const [newUserEmail, setNewUserEmail] = useState("");
  const [newUserRole, setNewUserRole] = useState("RECEPTIONIST");
  const [newUserPassword, setNewUserPassword] = useState("");
  const [creatingUser, setCreatingUser] = useState(false);

  // User Password & Management States
  const [revealedPasswords, setRevealedPasswords] = useState<Record<string, boolean>>({});
  const [copiedUserId, setCopiedUserId] = useState<string | null>(null);

  // Change Password Modal State
  const [userForPasswordChange, setUserForPasswordChange] = useState<any | null>(null);
  const [newPasswordInput, setNewPasswordInput] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [updatingPassword, setUpdatingPassword] = useState(false);

  // Delete User Modal State
  const [userForDeletion, setUserForDeletion] = useState<any | null>(null);
  const [deletingUser, setDeletingUser] = useState(false);

  const [notification, setNotification] = useState<string | null>(null);

  // Fetch Reports Overview Summary
  const fetchReportsOverview = async () => {
    setLoadingReportsOverview(true);
    try {
      const res = await fetch("/api/admin/reports/preview?type=overview");
      if (res.ok) {
        const data = await res.json();
        setReportsOverview(data.overview);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingReportsOverview(false);
    }
  };

  // Fetch Admin Stats
  const fetchStats = async () => {
    setLoadingStats(true);
    try {
      const res = await fetch("/api/admin/stats");
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingStats(false);
    }
  };

  // Fetch Daily Report
  const fetchDailyReport = async (dateStr: string) => {
    setLoadingDailyReport(true);
    try {
      const res = await fetch(`/api/admin/daily-report?date=${dateStr}`);
      if (res.ok) {
        const data = await res.json();
        setDailyReport(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingDailyReport(false);
    }
  };

  const setQuickDate = (offsetDays: number) => {
    const d = new Date();
    d.setDate(d.getDate() - offsetDays);
    const dateStr = d.toISOString().split("T")[0];
    setDailyDate(dateStr);
  };

  // Fetch Approvals
  const fetchApprovals = async () => {
    setLoadingRequests(true);
    try {
      const res = await fetch("/api/admin/approvals");
      if (res.ok) {
        const data = await res.json();
        setRequests(data.requests || []);
        if (data.counts?.totalPending !== undefined) {
          setTotalPendingApprovals(data.counts.totalPending);
        } else {
          setTotalPendingApprovals(
            (data.requests || []).filter((r: any) => r.status === "PENDING").length
          );
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingRequests(false);
    }
  };

  // Fetch Audit Logs
  const fetchAuditLogs = async () => {
    setLoadingLogs(true);
    try {
      const res = await fetch(
        `/api/admin/audit-logs?query=${encodeURIComponent(
          auditSearch
        )}&action=${encodeURIComponent(auditActionFilter)}`
      );
      if (res.ok) {
        const data = await res.json();
        setAuditLogs(data.logs);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingLogs(false);
    }
  };

  // Fetch Users
  const fetchUsers = async () => {
    setLoadingUsers(true);
    try {
      const res = await fetch(
        `/api/admin/users?query=${encodeURIComponent(userSearch)}&role=${userRoleFilter}`
      );
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingUsers(false);
    }
  };

  // Reset Add User Form
  const resetAddUserForm = () => {
    setShowAddUserModal(false);
    setNewUserName("");
    setNewUserEmail("");
    setNewUserPassword("");
    setNewUserRole("RECEPTIONIST");
  };

  // Create User
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreatingUser(true);
    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newUserName,
          email: newUserEmail,
          role: newUserRole,
          password: newUserPassword,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        resetAddUserForm();
        setNotification(`User account created successfully for ${data.user.name}.`);
        fetchUsers();
        setTimeout(() => setNotification(null), 4000);
      } else {
        alert(data.error || "Failed to create user account.");
      }
    } catch (err: any) {
      alert(err.message || "Network error.");
    } finally {
      setCreatingUser(false);
    }
  };

  // Toggle password visibility
  const togglePasswordVisibility = (userId: string) => {
    setRevealedPasswords((prev) => ({ ...prev, [userId]: !prev[userId] }));
  };

  // Copy password to clipboard
  const handleCopyPassword = (userId: string, pwd?: string) => {
    if (!pwd) return;
    navigator.clipboard.writeText(pwd);
    setCopiedUserId(userId);
    setTimeout(() => setCopiedUserId(null), 2000);
  };

  // Submit Password Change
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userForPasswordChange) return;
    if (!newPasswordInput || newPasswordInput.trim().length < 6) {
      alert("Password must be at least 6 characters long.");
      return;
    }
    setUpdatingPassword(true);
    try {
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: userForPasswordChange.id,
          newPassword: newPasswordInput.trim(),
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setNotification(`Password successfully changed for ${userForPasswordChange.name}.`);
        setUserForPasswordChange(null);
        setNewPasswordInput("");
        setShowNewPassword(false);
        fetchUsers();
        setTimeout(() => setNotification(null), 4000);
      } else {
        alert(data.error || "Failed to update password.");
      }
    } catch (err: any) {
      alert("Network error updating password: " + err.message);
    } finally {
      setUpdatingPassword(false);
    }
  };

  // Submit User Deletion
  const handleDeleteUser = async () => {
    if (!userForDeletion) return;
    if (userForDeletion.role === "ADMIN") {
      alert("Administrator accounts cannot be deleted.");
      return;
    }
    setDeletingUser(true);
    try {
      const res = await fetch(`/api/admin/users?id=${userForDeletion.id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (res.ok) {
        setNotification(`User "${userForDeletion.name}" was successfully deleted.`);
        setUserForDeletion(null);
        if (selectedUserForDetails?.id === userForDeletion.id) {
          setSelectedUserForDetails(null);
        }
        fetchUsers();
        setTimeout(() => setNotification(null), 4000);
      } else {
        alert(data.error || "Failed to delete user account.");
      }
    } catch (err: any) {
      alert("Network error deleting user: " + err.message);
    } finally {
      setDeletingUser(false);
    }
  };

  useEffect(() => {
    fetchStats();
    fetchApprovals();
    fetchDailyReport(dailyDate);
    fetchReportsOverview();
  }, []);

  useEffect(() => {
    if (activeTab === "users") {
      fetchUsers();
    }
    if (activeTab === "daily") fetchDailyReport(dailyDate);
    if (activeTab === "approvals") fetchApprovals();
    if (activeTab === "audit") fetchAuditLogs();
    if (activeTab === "reports") fetchReportsOverview();
  }, [activeTab, dailyDate, auditSearch, auditActionFilter, userSearch, userRoleFilter]);

  // Handle Approve / Reject
  const handleProcessApproval = async () => {
    if (!selectedReqForAction) return;
    setProcessingAction(true);
    try {
      const res = await fetch("/api/admin/approvals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: selectedReqForAction.id,
          status: actionStatus,
          comment: adminComment,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setSelectedReqForAction(null);
        setAdminComment("");
        setNotification(
          `Request successfully ${actionStatus.toLowerCase()}! Inventory updated.`
        );
        fetchApprovals();
        fetchStats();
        setTimeout(() => setNotification(null), 4000);
      } else {
        alert(data.error || "Action failed");
      }
    } catch (e: any) {
      alert(e.message || "Network error");
    } finally {
      setProcessingAction(false);
    }
  };

  const pendingRequests = requests.filter((r) => r.status === "PENDING");
  const processedRequests = requests.filter((r) => r.status !== "PENDING");

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Banner notification */}
        {notification && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl flex items-center justify-between shadow-sm animate-in slide-in-from-top duration-200">
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
              <span className="text-xs sm:text-sm font-semibold">{notification}</span>
            </div>
            <button
              onClick={() => setNotification(null)}
              className="text-xs font-bold text-emerald-700 hover:text-emerald-900"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Tab Controls */}
        <div className="flex items-center justify-between border-b border-slate-200 pb-2">
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            <button
              onClick={() => setActiveTab("dashboard")}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all whitespace-nowrap ${
                activeTab === "dashboard"
                  ? "bg-purple-600 text-white shadow-md shadow-purple-500/20"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              <span>Executive Dashboard & P&L</span>
            </button>

            <button
              onClick={() => {
                setActiveTab("users");
                fetchUsers();
              }}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all whitespace-nowrap ${
                activeTab === "users"
                  ? "bg-purple-600 text-white shadow-md shadow-purple-500/20"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Users & Staff Accounts</span>
            </button>

            <button
              onClick={() => {
                setActiveTab("daily");
                fetchDailyReport(dailyDate);
              }}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all whitespace-nowrap ${
                activeTab === "daily"
                  ? "bg-purple-600 text-white shadow-md shadow-purple-500/20"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              <Calendar className="w-4 h-4" />
              <span>Daily Sales Reconciliation</span>
            </button>

            <button
              onClick={() => setActiveTab("approvals")}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all whitespace-nowrap relative ${
                activeTab === "approvals"
                  ? "bg-purple-600 text-white shadow-md shadow-purple-500/20"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              <ShieldAlert className="w-4 h-4" />
              <span>Approvals Center</span>
              {totalPendingApprovals > 0 && (
                <span className="ml-1 px-1.5 py-0.2 bg-amber-500 text-white text-[10px] font-black rounded-full animate-pulse">
                  {totalPendingApprovals}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab("inventory")}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all whitespace-nowrap ${
                activeTab === "inventory"
                  ? "bg-purple-600 text-white shadow-md shadow-purple-500/20"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              <Package className="w-4 h-4" />
              <span>Medical Inventory &amp; Purchases</span>
            </button>

            <button
              onClick={() => {
                setActiveTab("reports");
                fetchReportsOverview();
              }}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all whitespace-nowrap ${
                activeTab === "reports"
                  ? "bg-purple-600 text-white shadow-md shadow-purple-500/20"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Official Reports & Exports</span>
            </button>

            <button
              onClick={() => setActiveTab("audit")}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all whitespace-nowrap ${
                activeTab === "audit"
                  ? "bg-purple-600 text-white shadow-md shadow-purple-500/20"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              <History className="w-4 h-4" />
              <span>Immutable Audit Trail</span>
            </button>

            {/* Workstations & Network IPs tab hidden as requested */}
            {false && (
              <button
                onClick={() => setActiveTab("network")}
                className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all whitespace-nowrap ${
                  activeTab === "network"
                    ? "bg-purple-600 text-white shadow-md shadow-purple-500/20"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                <Network className="w-4 h-4" />
                <span>Workstations & Network IPs</span>
              </button>
            )}

          </div>
        </div>

        {/* TAB 1: EXECUTIVE DASHBOARD & P&L */}
        {activeTab === "dashboard" && stats && (
          <div className="space-y-6">
            {/* Prominent Executive Real-Time Low-Stock Alarm Banner */}
            {stats.lowStockCount > 0 && (
              <div className="bg-gradient-to-r from-red-500/10 via-amber-500/10 to-rose-500/10 border-2 border-red-500/40 rounded-2xl p-4 sm:p-5 shadow-sm space-y-3 animate-in fade-in">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-red-600 text-white flex items-center justify-center font-bold shadow-md shadow-red-500/30 animate-pulse flex-shrink-0">
                      <AlertTriangle className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-black bg-red-600 text-white uppercase tracking-wider">
                          🔴 Executive Low-Stock Alarm
                        </span>
                        <span className="text-xs sm:text-sm font-extrabold text-red-950">
                          {stats.lowStockCount} {stats.lowStockCount === 1 ? "Medicine" : "Medicines"} Running Below Threshold
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 mt-0.5">
                        Live dispensary stock is at or below defined safety alarm limits (<code>quantity &le; threshold</code>). Reorders or batch approvals required immediately.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                    <button
                      type="button"
                      onClick={() => setActiveTab("approvals")}
                      className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors shadow-sm flex-shrink-0"
                    >
                      <Clock className="w-3.5 h-3.5 text-amber-400" />
                      <span>Approvals Center ({stats.metrics?.pendingApprovalsCount || 0})</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setActiveTab("inventory")}
                      className="px-3.5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors shadow-sm shadow-red-600/20 flex-shrink-0"
                    >
                      <Package className="w-3.5 h-3.5" />
                      <span>Hospital Purchase Sheet</span>
                    </button>
                  </div>
                </div>

                {/* Low-Stock Item Badges */}
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  {(stats.lowStockItems || []).slice(0, 10).map((item: any) => (
                    <div
                      key={item.id}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-red-200 rounded-xl text-xs shadow-sm hover:border-red-400 transition-colors"
                    >
                      <span className="font-extrabold text-slate-900">{item.name}</span>
                      <span className="text-[10px] text-slate-400">({item.category})</span>
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-black bg-red-100 text-red-800">
                        Live Stock: {item.totalStock}
                      </span>
                      <span className="text-[10px] text-slate-500 font-medium">
                        Limit: {item.threshold}
                      </span>
                    </div>
                  ))}
                  {stats.lowStockItems && stats.lowStockItems.length > 10 && (
                    <span className="text-xs font-bold text-red-700 self-center pl-1">
                      +{stats.lowStockItems.length - 10} more low-stock items
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* KPI Cards Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
                  <Banknote className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Total Gross Revenue
                  </p>
                  <h3 className="text-2xl font-black text-slate-900">
                    Rs. {stats.metrics.totalCombinedRevenue.toFixed(2)}
                  </h3>
                  <p className="text-[11px] text-purple-600 font-medium">
                    Clinical + Pharmacy Combined
                  </p>
                </div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                  <TrendingUp className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Pharmacy Net Profit
                  </p>
                  <h3 className="text-2xl font-black text-emerald-700">
                    Rs. {stats.metrics.pharmacyNetProfit.toFixed(2)}
                  </h3>
                  <p className="text-[11px] text-emerald-600 font-semibold">
                    {stats.metrics.profitMarginPercent}% Margin on Sales
                  </p>
                </div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                  <Users className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Patient Encounters
                  </p>
                  <h3 className="text-2xl font-black text-slate-900">
                    {stats.metrics.totalVisits}
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    {stats.metrics.totalPatients} registered in system
                  </p>
                </div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
                  <Package className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Inventory Asset Value
                  </p>
                  <h3 className="text-2xl font-black text-slate-900">
                    Rs. {stats.metrics.inventoryValuation.toFixed(2)}
                  </h3>
                  <p className="text-[11px] text-amber-600 font-medium">
                    {stats.metrics.pendingApprovalsCount} pending approvals
                  </p>
                </div>
              </div>
            </div>

            {/* Financial Breakdown & Top Medicines */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Revenue Stream Breakdown (6 Cols) */}
              <div className="lg:col-span-6 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-5">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <Banknote className="w-4 h-4 text-purple-600" />
                    <span>Revenue Streams & Profit / Loss Statement</span>
                  </h3>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Audited Records
                  </span>
                </div>

                <div className="space-y-4">
                  {/* Clinical Stream */}
                  <div className="p-4 bg-blue-50/70 border border-blue-100 rounded-xl space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-blue-900 flex items-center gap-1.5">
                        <Stethoscope className="w-3.5 h-3.5 text-blue-600" />
                        Clinical Hospital Invoices (OPD & USG)
                      </span>
                      <span className="text-sm font-extrabold text-blue-900">
                        Rs. {stats.metrics.totalClinicalRevenue.toFixed(2)}
                      </span>
                    </div>
                    <div className="w-full bg-blue-200/60 h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-blue-600 h-full"
                        style={{
                          width: `${
                            stats.metrics.totalCombinedRevenue > 0
                              ? (stats.metrics.totalClinicalRevenue /
                                  stats.metrics.totalCombinedRevenue) *
                                100
                              : 0
                          }%`,
                        }}
                      />
                    </div>
                  </div>

                  {/* Pharmacy Stream */}
                  <div className="p-4 bg-amber-50/70 border border-amber-100 rounded-xl space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                        <Pill className="w-3.5 h-3.5 text-amber-600" />
                        Pharmacy POS Gross Sales
                      </span>
                      <span className="text-sm font-extrabold text-amber-900">
                        Rs. {stats.metrics.totalPharmacyRevenue.toFixed(2)}
                      </span>
                    </div>
                    <div className="w-full bg-amber-200/60 h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-amber-600 h-full"
                        style={{
                          width: `${
                            stats.metrics.totalCombinedRevenue > 0
                              ? (stats.metrics.totalPharmacyRevenue /
                                  stats.metrics.totalCombinedRevenue) *
                                100
                              : 0
                          }%`,
                        }}
                      />
                    </div>
                  </div>

                  {/* Profit Calculation Box */}
                  <div className="p-4 bg-slate-900 text-white rounded-xl space-y-2 text-xs">
                    <div className="flex justify-between text-slate-400">
                      <span>Pharmacy Gross Sales:</span>
                      <span>Rs. {stats.metrics.totalPharmacyRevenue.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>Cost of Goods Sold (COGS):</span>
                      <span>-Rs. {stats.metrics.pharmacyCOGS.toFixed(2)}</span>
                    </div>
                    <div className="pt-2 border-t border-slate-800 flex justify-between font-black text-sm">
                      <span className="text-slate-300">Net Pharmacy Profit:</span>
                      <span className="text-emerald-400">
                        Rs. {stats.metrics.pharmacyNetProfit.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Top Selling Medicines (6 Cols) */}
              <div className="lg:col-span-6 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-5">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-emerald-600" />
                    <span>Top Dispensed Medicines & Turnover</span>
                  </h3>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    POS Sales
                  </span>
                </div>

                <div className="space-y-3">
                  {stats.topSellingMedicines.map((med: any, idx: number) => (
                    <div
                      key={idx}
                      className="p-3 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-7 h-7 rounded-lg bg-purple-100 text-purple-700 font-extrabold text-xs flex items-center justify-center">
                          #{idx + 1}
                        </div>
                        <div>
                          <div className="text-xs font-bold text-slate-900">
                            {med.name}
                          </div>
                          <div className="text-[10px] text-slate-500">
                            {med.quantity} units dispensed
                          </div>
                        </div>
                      </div>
                      <span className="text-xs font-mono font-extrabold text-slate-900">
                        Rs. {med.revenue.toFixed(2)}
                      </span>
                    </div>
                  ))}
                  {stats.topSellingMedicines.length === 0 && (
                    <div className="py-8 text-center text-xs text-slate-400">
                      No dispensary sales recorded yet.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB: USERS & STAFF ACCOUNTS MANAGEMENT */}
        {activeTab === "users" && (
          <div className="space-y-6">
            {/* Header Control Panel */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                <div>
                  <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                    <Users className="w-5 h-5 text-purple-600" />
                    <span>Staff Accounts & User Management</span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Manage clinic personnel accounts, credentials, and role permissions.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2.5">
                  {/* Add User Button */}
                  <button
                    type="button"
                    onClick={() => setShowAddUserModal(true)}
                    className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all flex items-center gap-1.5"
                  >
                    <UserPlus className="w-4 h-4" />
                    <span>Add New User</span>
                  </button>
                </div>
              </div>

              {/* Search & Filter Toolbar */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-3 pt-1">
                <div className="md:col-span-6 relative">
                  <Search className="w-4 h-4 absolute inset-y-0 left-3 my-auto text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search users by name or email..."
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 text-slate-800"
                  />
                </div>

                <div className="md:col-span-3">
                  <select
                    value={userRoleFilter}
                    onChange={(e) => setUserRoleFilter(e.target.value)}
                    className="w-full py-2 px-3 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 text-slate-800"
                  >
                    <option value="ALL">All Roles</option>
                    <option value="ADMIN">ADMIN</option>
                    <option value="RECEPTIONIST">RECEPTIONIST</option>
                    <option value="PHARMACIST">PHARMACIST</option>
                    <option value="DOCTOR">DOCTOR</option>
                  </select>
                </div>

                <div className="md:col-span-3 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={fetchUsers}
                    className="w-full py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${loadingUsers ? "animate-spin text-purple-600" : ""}`} />
                    <span>Refresh Roster</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Users Roster Table */}
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
              <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                    System User Directory
                  </h4>
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                    {users.length} Total Users
                  </span>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50/80 border-b border-slate-200/70 text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
                      <th className="px-5 py-3">User & Contact</th>
                      <th className="px-5 py-3">Role</th>
                      <th className="px-5 py-3">Password / Credentials</th>
                      <th className="px-5 py-3">Account Created</th>
                      <th className="px-5 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {users.map((u) => {
                      return (
                        <tr key={u.id} className="hover:bg-slate-50/70 transition-colors">
                          <td className="px-5 py-3.5">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-xl bg-purple-100 text-purple-700 font-extrabold flex items-center justify-center text-xs shadow-inner">
                                {u.name
                                  .split(" ")
                                  .map((n: string) => n[0])
                                  .slice(0, 2)
                                  .join("")}
                              </div>
                              <div>
                                <p className="font-extrabold text-slate-900">{u.name}</p>
                                <p className="text-[11px] text-slate-500">{u.email}</p>
                              </div>
                            </div>
                          </td>

                          <td className="px-5 py-3.5">
                            <span
                              className={`inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] font-extrabold uppercase tracking-wider border ${
                                u.role === "ADMIN"
                                  ? "bg-purple-100 text-purple-800 border-purple-200"
                                  : u.role === "RECEPTIONIST"
                                  ? "bg-emerald-100 text-emerald-800 border-emerald-200"
                                  : u.role === "PHARMACIST"
                                  ? "bg-amber-100 text-amber-800 border-amber-200"
                                  : "bg-teal-100 text-teal-800 border-teal-200"
                              }`}
                            >
                              {u.role}
                            </span>
                          </td>

                          <td className="px-5 py-3.5">
                            <div className="flex items-center gap-2">
                              <div className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 rounded-lg border border-slate-200 text-xs font-mono font-medium text-slate-800">
                                {revealedPasswords[u.id] ? (
                                  <span className="font-bold text-slate-900 select-all">
                                    {u.displayPassword || "(Bcrypt Hash)"}
                                  </span>
                                ) : (
                                  <span className="tracking-widest text-slate-500 font-bold">••••••••</span>
                                )}
                                <button
                                  type="button"
                                  onClick={() => togglePasswordVisibility(u.id)}
                                  className="p-1 text-slate-400 hover:text-purple-700 rounded transition-colors"
                                  title={revealedPasswords[u.id] ? "Hide password" : "Check / View Password"}
                                >
                                  {revealedPasswords[u.id] ? (
                                    <EyeOff className="w-3.5 h-3.5 text-purple-600" />
                                  ) : (
                                    <Eye className="w-3.5 h-3.5" />
                                  )}
                                </button>
                                {u.displayPassword && (
                                  <button
                                    type="button"
                                    onClick={() => handleCopyPassword(u.id, u.displayPassword)}
                                    className="p-1 text-slate-400 hover:text-slate-700 rounded transition-colors"
                                    title="Copy password to clipboard"
                                  >
                                    {copiedUserId === u.id ? (
                                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                                    ) : (
                                      <Copy className="w-3.5 h-3.5" />
                                    )}
                                  </button>
                                )}
                              </div>
                            </div>
                          </td>

                          <td className="px-5 py-3.5 text-slate-500 font-mono text-[11px]">
                            {new Date(u.createdAt).toLocaleDateString()}
                          </td>

                          <td className="px-5 py-3.5 text-right">
                            <div className="inline-flex items-center gap-1.5">
                              {/* Change Password */}
                              <button
                                type="button"
                                onClick={() => {
                                  setUserForPasswordChange(u);
                                  setNewPasswordInput("");
                                  setShowNewPassword(false);
                                }}
                                className="px-2.5 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-lg text-xs font-bold transition-colors flex items-center gap-1"
                                title="Change User Password"
                              >
                                <Key className="w-3.5 h-3.5 text-amber-600" />
                                <span>Change Password</span>
                              </button>

                              {/* Delete User - Admin protected */}
                              {u.role === "ADMIN" ? (
                                <span
                                  className="px-2.5 py-1.5 bg-slate-100 text-slate-400 border border-slate-200 rounded-lg text-xs font-bold flex items-center gap-1 cursor-not-allowed select-none"
                                  title="Administrator account is protected and cannot be deleted"
                                >
                                  <Lock className="w-3.5 h-3.5 text-slate-400" />
                                  <span>Protected</span>
                                </span>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => setUserForDeletion(u)}
                                  className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-600 text-rose-700 hover:text-white border border-rose-200 hover:border-rose-600 rounded-lg text-xs font-bold transition-colors flex items-center gap-1 shadow-sm"
                                  title={`Delete staff account ${u.name}`}
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                  <span>Delete</span>
                                </button>
                              )}

                              {/* Open Profile */}
                              <button
                                type="button"
                                onClick={() => setSelectedUserForDetails(u)}
                                className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-bold transition-colors"
                              >
                                Profile
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}

                    {users.length === 0 && (
                      <tr>
                        <td colSpan={5} className="px-5 py-8 text-center text-slate-400 text-xs">
                          {loadingUsers ? "Loading user accounts..." : "No users match current filters."}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB: DAILY SALES RECONCILIATION REPORT (AGAINST CLINICAL & PHARMACY PORTALS) */}
        {activeTab === "daily" && (
          <div className="printable-daily-report space-y-6">
            {/* Header Control Panel (Hidden on print) */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-4 print:hidden">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                <div>
                  <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-purple-600" />
                    <span>Daily Sales & Reconciliation Audit</span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Comparative audit cross-examining both Clinical Hospital Portal invoices and Pharmaceutical Dispensary sales.
                  </p>
                </div>

                {/* Print and Export Buttons */}
                <div className="flex items-center gap-2.5">
                  <button
                    type="button"
                    onClick={() => {
                      setPreviewInitialSearch("");
                      setPreviewReportType("daily");
                      setPreviewModalOpen(true);
                    }}
                    className="px-3.5 py-2 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Preview Summary</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Print Daily Audit</span>
                  </button>
                  <a
                    href={`/api/admin/export?type=daily&date=${dailyDate}`}
                    download
                    className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Export Daily CSV</span>
                  </a>
                </div>
              </div>

              {/* Date Selection Controls */}
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                    Audit Date:
                  </label>
                  <input
                    type="date"
                    value={dailyDate}
                    onChange={(e) => {
                      setDailyDate(e.target.value);
                      fetchDailyReport(e.target.value);
                    }}
                    className="bg-slate-50 border border-slate-300 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                {/* Quick Presets */}
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] font-semibold text-slate-400 mr-1">
                    Quick Dates:
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setQuickDate(0);
                      fetchDailyReport(new Date().toISOString().split("T")[0]);
                    }}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors ${
                      dailyDate === new Date().toISOString().split("T")[0]
                        ? "bg-purple-100 text-purple-700 border border-purple-300"
                        : "bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200"
                    }`}
                  >
                    Today
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const d = new Date();
                      d.setDate(d.getDate() - 1);
                      const s = d.toISOString().split("T")[0];
                      setDailyDate(s);
                      fetchDailyReport(s);
                    }}
                    className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200 transition-colors"
                  >
                    Yesterday
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const d = new Date();
                      d.setDate(d.getDate() - 2);
                      const s = d.toISOString().split("T")[0];
                      setDailyDate(s);
                      fetchDailyReport(s);
                    }}
                    className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200 transition-colors"
                  >
                    2 Days Ago
                  </button>
                </div>
              </div>
            </div>

            {/* Official Print Header (Only visible on print) */}
            <div className="hidden print:block text-center pb-5 mb-5 border-b-2 border-slate-900 space-y-1.5">
              <h1 className="text-2xl font-black uppercase tracking-wider">
                Ruqayya CLINIC &amp; PHARMACY MANAGEMENT SYSTEM
              </h1>
              <p className="text-sm text-slate-700 font-bold uppercase tracking-wide">
                DAILY FINANCIAL RECONCILIATION &amp; CROSS-PORTAL SALES AUDIT
              </p>
              <div className="text-xs font-mono text-slate-600">
                Report Date: <strong className="text-black">{dailyDate}</strong> · Printed On:{" "}
                {new Date().toLocaleString()}
              </div>
            </div>

            {loadingDailyReport ? (
              <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 text-slate-500 text-sm">
                Generating daily reconciliation audit for {dailyDate}...
              </div>
            ) : dailyReport ? (
              <>
                {/* 4 Summary Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Card 1: Combined Net Collections */}
                  <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
                      <Banknote className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                        Net Combined Sales
                      </p>
                      <h3 className="text-2xl font-black text-slate-900">
                        Rs. {dailyReport.summary.combinedNet.toFixed(2)}
                      </h3>
                      <p className="text-[11px] text-purple-600 font-medium">
                        Gross: Rs. {dailyReport.summary.combinedGross.toFixed(2)} (Discounts: -Rs. {dailyReport.summary.combinedDiscounts.toFixed(2)})
                      </p>
                    </div>
                  </div>

                  {/* Card 2: Clinical Reception Stream */}
                  <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                      <Stethoscope className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                        Clinical Portal Sales
                      </p>
                      <h3 className="text-2xl font-black text-blue-700">
                        Rs. {dailyReport.summary.clinicalNet.toFixed(2)}
                      </h3>
                      <p className="text-[11px] text-slate-500 font-medium">
                        {dailyReport.summary.clinicalCount} Invoices ({dailyReport.summary.clinicalPercentage}% of Day)
                      </p>
                    </div>
                  </div>

                  {/* Card 3: Pharmaceutical Dispensary Stream */}
                  <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
                      <Pill className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                        Pharmacy Portal Sales
                      </p>
                      <h3 className="text-2xl font-black text-amber-700">
                        Rs. {dailyReport.summary.pharmacyNet.toFixed(2)}
                      </h3>
                      <p className="text-[11px] text-slate-500 font-medium">
                        {dailyReport.summary.pharmacyCount} Sales ({dailyReport.summary.pharmacyPercentage}% of Day)
                      </p>
                    </div>
                  </div>

                  {/* Card 4: Daily Net Operational Profit */}
                  <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                      <TrendingUp className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                        Net Daily Operating Profit
                      </p>
                      <h3 className="text-2xl font-black text-emerald-700">
                        Rs. {dailyReport.summary.combinedNetProfit.toFixed(2)}
                      </h3>
                      <p className="text-[11px] text-emerald-600 font-semibold">
                        Rx Margin: {dailyReport.summary.pharmacyProfitMargin}% (COGS: Rs. {dailyReport.summary.pharmacyCOGS.toFixed(2)})
                      </p>
                    </div>
                  </div>
                </div>

                {/* Comparative Stream Distribution & Service Breakdown */}
                <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                      <BarChart3 className="w-4 h-4 text-purple-600" />
                      Comparative Revenue Split: Clinical Portal vs Pharmaceutical Portal
                    </h4>
                    <span className="text-xs font-mono font-bold text-slate-500">
                      Target Date: {dailyDate}
                    </span>
                  </div>

                  {/* Proportional Dual-Color Bar */}
                  <div className="space-y-1.5">
                    <div className="w-full h-4 bg-slate-100 rounded-full overflow-hidden flex">
                      <div
                        className="bg-blue-600 h-full transition-all duration-300"
                        style={{ width: `${dailyReport.summary.clinicalPercentage}%` }}
                        title={`Clinical Hospital: ${dailyReport.summary.clinicalPercentage}%`}
                      />
                      <div
                        className="bg-amber-500 h-full transition-all duration-300"
                        style={{ width: `${dailyReport.summary.pharmacyPercentage}%` }}
                        title={`Pharmacy Dispensary: ${dailyReport.summary.pharmacyPercentage}%`}
                      />
                    </div>
                    <div className="flex justify-between text-[11px] font-bold">
                      <span className="text-blue-700 flex items-center gap-1">
                        <span className="w-2.5 h-2.5 rounded-full bg-blue-600 inline-block" />
                        Clinical Hospital: Rs. {dailyReport.summary.clinicalNet.toFixed(2)} ({dailyReport.summary.clinicalPercentage}%)
                      </span>
                      <span className="text-amber-700 flex items-center gap-1">
                        <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" />
                        Pharmaceutical Dispensary: Rs. {dailyReport.summary.pharmacyNet.toFixed(2)} ({dailyReport.summary.pharmacyPercentage}%)
                      </span>
                    </div>
                  </div>

                  {/* Service Pills Breakdown */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-2">
                    <div className="p-3 bg-blue-50/60 border border-blue-200 rounded-xl">
                      <span className="text-[10px] font-bold text-blue-900 uppercase">
                        OPD Consultations
                      </span>
                      <div className="text-base font-black text-blue-900">
                        Rs. {dailyReport.serviceBreakdown.OPD.revenue.toFixed(2)}
                      </div>
                      <span className="text-[11px] text-blue-700">
                        {dailyReport.serviceBreakdown.OPD.count} patients
                      </span>
                    </div>

                    <div className="p-3 bg-amber-50/60 border border-amber-200 rounded-xl">
                      <span className="text-[10px] font-bold text-amber-900 uppercase">
                        Ultrasound Scans
                      </span>
                      <div className="text-base font-black text-amber-900">
                        Rs. {dailyReport.serviceBreakdown.Ultrasound.revenue.toFixed(2)}
                      </div>
                      <span className="text-[11px] text-amber-700">
                        {dailyReport.serviceBreakdown.Ultrasound.count} procedures
                      </span>
                    </div>

                    <div className="p-3 bg-purple-50/60 border border-purple-200 rounded-xl">
                      <span className="text-[10px] font-bold text-purple-900 uppercase">
                        Specialist Visits
                      </span>
                      <div className="text-base font-black text-purple-900">
                        Rs. {dailyReport.serviceBreakdown.Consultation.revenue.toFixed(2)}
                      </div>
                      <span className="text-[11px] text-purple-700">
                        {dailyReport.serviceBreakdown.Consultation.count} encounters
                      </span>
                    </div>

                    <div className="p-3 bg-emerald-50/60 border border-emerald-200 rounded-xl">
                      <span className="text-[10px] font-bold text-emerald-900 uppercase">
                        5% Generic Savings
                      </span>
                      <div className="text-base font-black text-emerald-900">
                        Rs. {dailyReport.summary.pharmacyDiscounts.toFixed(2)}
                      </div>
                      <span className="text-[11px] text-emerald-700">
                        Discounts passed to patients
                      </span>
                    </div>
                  </div>
                </div>

                {/* Stream Switcher Filter (Hidden on print) */}
                <div className="flex items-center gap-2 print:hidden">
                  <button
                    onClick={() => setDailyStreamFilter("ALL")}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                      dailyStreamFilter === "ALL"
                        ? "bg-slate-900 text-white shadow-sm"
                        : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    All Audited Transactions ({dailyReport.clinicalInvoices.length + dailyReport.pharmacySales.length})
                  </button>
                  <button
                    onClick={() => setDailyStreamFilter("CLINICAL")}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                      dailyStreamFilter === "CLINICAL"
                        ? "bg-blue-600 text-white shadow-sm"
                        : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    Clinical Invoices ({dailyReport.clinicalInvoices.length})
                  </button>
                  <button
                    onClick={() => setDailyStreamFilter("PHARMACY")}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                      dailyStreamFilter === "PHARMACY"
                        ? "bg-amber-600 text-white shadow-sm"
                        : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    Pharmacy POS Sales ({dailyReport.pharmacySales.length})
                  </button>
                </div>

                {/* Section 1: Clinical Hospital Invoices Table */}
                {(dailyStreamFilter === "ALL" || dailyStreamFilter === "CLINICAL") && (
                  <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
                    <div className="p-4 bg-blue-50/70 border-b border-blue-200 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Stethoscope className="w-4 h-4 text-blue-700" />
                        <h4 className="text-xs font-bold text-blue-950 uppercase tracking-wider">
                          1. Clinical Hospital Reception Invoices ({dailyReport.clinicalInvoices.length})
                        </h4>
                      </div>
                      <span className="text-xs font-black text-blue-900">
                        Total Collected: Rs. {dailyReport.summary.clinicalNet.toFixed(2)}
                      </span>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs text-slate-700">
                        <thead className="bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-200">
                          <tr>
                            <th className="px-4 py-3">Time</th>
                            <th className="px-4 py-3">Invoice #</th>
                            <th className="px-4 py-3">Patient UID & Name</th>
                            <th className="px-4 py-3">Service Type</th>
                            <th className="px-4 py-3">Receptionist</th>
                            <th className="px-4 py-3 text-right">Subtotal</th>
                            <th className="px-4 py-3 text-right">Discount</th>
                            <th className="px-4 py-3 text-right">Net Paid</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {dailyReport.clinicalInvoices.map((inv: any) => (
                            <tr key={inv.id} className="hover:bg-slate-50/80">
                              <td className="px-4 py-3 font-mono text-slate-500">
                                {new Date(inv.createdAt).toLocaleTimeString([], {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </td>
                              <td className="px-4 py-3 font-mono font-bold text-blue-700">
                                {inv.invoiceNumber}
                              </td>
                              <td className="px-4 py-3">
                                <div className="font-bold text-slate-900">
                                  {inv.patientName}
                                </div>
                                <div className="font-mono text-[10px] text-slate-400">
                                  {inv.patientUid}
                                </div>
                              </td>
                              <td className="px-4 py-3 font-medium text-slate-800">
                                {inv.serviceType}
                              </td>
                              <td className="px-4 py-3 text-slate-600">
                                {inv.operatorName}
                              </td>
                              <td className="px-4 py-3 text-right text-slate-500">
                                Rs. {inv.subtotal.toFixed(2)}
                              </td>
                              <td className="px-4 py-3 text-right text-emerald-600 font-medium">
                                {inv.discount > 0 ? `-Rs. ${inv.discount.toFixed(2)}` : "Rs. 0.00"}
                              </td>
                              <td className="px-4 py-3 text-right font-black text-slate-900">
                                Rs. {inv.totalAmount.toFixed(2)}
                              </td>
                            </tr>
                          ))}
                          {dailyReport.clinicalInvoices.length === 0 && (
                            <tr>
                              <td
                                colSpan={8}
                                className="px-4 py-6 text-center text-slate-400 text-xs"
                              >
                                No clinical hospital invoices issued on {dailyDate}.
                              </td>
                            </tr>
                          )}
                        </tbody>
                        {dailyReport.clinicalInvoices.length > 0 && (
                          <tfoot className="bg-slate-50 font-bold border-t border-slate-200">
                            <tr>
                              <td colSpan={5} className="px-4 py-2.5 text-right text-slate-700">
                                Clinical Total ({dailyReport.clinicalInvoices.length} invoices):
                              </td>
                              <td className="px-4 py-2.5 text-right text-slate-600">
                                Rs. {dailyReport.summary.clinicalGross.toFixed(2)}
                              </td>
                              <td className="px-4 py-2.5 text-right text-emerald-600">
                                -Rs. {dailyReport.summary.clinicalDiscounts.toFixed(2)}
                              </td>
                              <td className="px-4 py-2.5 text-right text-blue-900 font-black">
                                Rs. {dailyReport.summary.clinicalNet.toFixed(2)}
                              </td>
                            </tr>
                          </tfoot>
                        )}
                      </table>
                    </div>
                  </div>
                )}

                {/* Section 2: Pharmaceutical POS Dispensary Sales Table */}
                {(dailyStreamFilter === "ALL" || dailyStreamFilter === "PHARMACY") && (
                  <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
                    <div className="p-4 bg-amber-50/70 border-b border-amber-200 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Pill className="w-4 h-4 text-amber-700" />
                        <h4 className="text-xs font-bold text-amber-950 uppercase tracking-wider">
                          2. Pharmaceutical POS Dispensary Sales ({dailyReport.pharmacySales.length})
                        </h4>
                      </div>
                      <span className="text-xs font-black text-amber-900">
                        Total Collected: Rs. {dailyReport.summary.pharmacyNet.toFixed(2)} · Profit: Rs. {dailyReport.summary.pharmacyNetProfit.toFixed(2)}
                      </span>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs text-slate-700">
                        <thead className="bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-200">
                          <tr>
                            <th className="px-4 py-3">Time</th>
                            <th className="px-4 py-3">Sale #</th>
                            <th className="px-4 py-3">Customer / Patient</th>
                            <th className="px-4 py-3">Pharmacist</th>
                            <th className="px-4 py-3">Medicines Dispensed</th>
                            <th className="px-4 py-3 text-right">Subtotal</th>
                            <th className="px-4 py-3 text-right">5% Generic Off</th>
                            <th className="px-4 py-3 text-right">Net Paid</th>
                            <th className="px-4 py-3 text-right">COGS</th>
                            <th className="px-4 py-3 text-right">Profit</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {dailyReport.pharmacySales.map((sale: any) => (
                            <tr key={sale.id} className="hover:bg-slate-50/80">
                              <td className="px-4 py-3 font-mono text-slate-500">
                                {new Date(sale.createdAt).toLocaleTimeString([], {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </td>
                              <td className="px-4 py-3 font-mono font-bold text-amber-700">
                                {sale.saleNumber}
                              </td>
                              <td className="px-4 py-3">
                                <div className="font-bold text-slate-900">
                                  {sale.customerName}
                                </div>
                                <div className="font-mono text-[10px] text-slate-400">
                                  {sale.patientUid}
                                </div>
                              </td>
                              <td className="px-4 py-3 text-slate-600">
                                {sale.pharmacistName}
                              </td>
                              <td className="px-4 py-3 font-medium text-slate-800 max-w-xs truncate" title={sale.itemsSummary}>
                                {sale.itemsSummary}
                              </td>
                              <td className="px-4 py-3 text-right text-slate-500">
                                Rs. {sale.subtotal.toFixed(2)}
                              </td>
                              <td className="px-4 py-3 text-right text-emerald-600 font-medium">
                                {sale.discount > 0 ? `-Rs. ${sale.discount.toFixed(2)}` : "Rs. 0.00"}
                              </td>
                              <td className="px-4 py-3 text-right font-black text-slate-900">
                                Rs. {sale.totalAmount.toFixed(2)}
                              </td>
                              <td className="px-4 py-3 text-right text-slate-500">
                                Rs. {sale.cogs.toFixed(2)}
                              </td>
                              <td className="px-4 py-3 text-right font-bold text-emerald-700">
                                Rs. {sale.profit.toFixed(2)}
                              </td>
                            </tr>
                          ))}
                          {dailyReport.pharmacySales.length === 0 && (
                            <tr>
                              <td
                                colSpan={10}
                                className="px-4 py-6 text-center text-slate-400 text-xs"
                              >
                                No pharmaceutical POS sales recorded on {dailyDate}.
                              </td>
                            </tr>
                          )}
                        </tbody>
                        {dailyReport.pharmacySales.length > 0 && (
                          <tfoot className="bg-slate-50 font-bold border-t border-slate-200">
                            <tr>
                              <td colSpan={5} className="px-4 py-2.5 text-right text-slate-700">
                                Pharmacy Total ({dailyReport.pharmacySales.length} sales):
                              </td>
                              <td className="px-4 py-2.5 text-right text-slate-600">
                                Rs. {dailyReport.summary.pharmacyGross.toFixed(2)}
                              </td>
                              <td className="px-4 py-2.5 text-right text-emerald-600">
                                -Rs. {dailyReport.summary.pharmacyDiscounts.toFixed(2)}
                              </td>
                              <td className="px-4 py-2.5 text-right text-amber-900 font-black">
                                Rs. {dailyReport.summary.pharmacyNet.toFixed(2)}
                              </td>
                              <td className="px-4 py-2.5 text-right text-slate-600">
                                Rs. {dailyReport.summary.pharmacyCOGS.toFixed(2)}
                              </td>
                              <td className="px-4 py-2.5 text-right text-emerald-700 font-black">
                                Rs. {dailyReport.summary.pharmacyNetProfit.toFixed(2)}
                              </td>
                            </tr>
                          </tfoot>
                        )}
                      </table>
                    </div>
                  </div>
                )}

                {/* Print Sign-off block (Only visible on print) */}
                <div className="hidden print:block pt-14 space-y-10">
                  <div className="grid grid-cols-2 gap-12 text-sm">
                    <div className="border-t-2 border-slate-900 pt-3">
                      <p className="font-black text-slate-900">Medical Administrator / Incharge</p>
                      <p className="text-xs text-slate-600 mt-0.5">Signature &amp; Verification Stamp</p>
                    </div>
                    <div className="border-t-2 border-slate-900 pt-3 text-right">
                      <p className="font-black text-slate-900">Chief Pharmacist / Cashier</p>
                      <p className="text-xs text-slate-600 mt-0.5">Physical Cash Reconciliation &amp; Handover</p>
                    </div>
                  </div>
                  <p className="text-xs text-center text-slate-500 italic">
                    Certified immutable audit record generated by Ruqayya Clinic Enterprise Management System.
                  </p>
                  <div className="pt-4 text-center border-t border-dashed border-slate-900 mt-4">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-slate-800">
                      Powered by BlockMindArk
                    </p>
                  </div>
                </div>
              </>
            ) : null}
          </div>
        )}

        {/* TAB 2: APPROVALS & FINANCIAL GOVERNANCE CENTER */}
        {activeTab === "approvals" && (
          <ApprovalsManagementView onActionComplete={fetchStats} />
        )}

        {/* TAB 3: REPORTS & CSV DATA EXPORT */}
        {activeTab === "reports" && (
          <div className="space-y-6">
            {/* Header with Live Summary Ribbon */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
                <div>
                  <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                    <FileSpreadsheet className="w-5 h-5 text-purple-600" />
                    <span>Official Reports, Live Previews & CSV Data Exports</span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Preview live financial and clinical summaries of each respective report, inspect recent records, and download immutable RFC 4180-compliant spreadsheets.
                  </p>
                </div>

                <button
                  onClick={fetchReportsOverview}
                  disabled={loadingReportsOverview}
                  className="px-3.5 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors self-start sm:self-auto"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loadingReportsOverview ? "animate-spin text-purple-600" : ""}`} />
                  <span>Refresh Overview</span>
                </button>
              </div>

              {/* Quick Summary Metrics Ribbon */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <div className="p-3.5 bg-blue-50/70 border border-blue-200 rounded-xl">
                  <span className="text-[10px] font-bold text-blue-900 uppercase">
                    Clinical Encounters
                  </span>
                  <div className="text-lg font-black text-blue-900 mt-0.5">
                    {reportsOverview?.visits.count ?? stats?.metrics?.totalVisits ?? 0} Visits
                  </div>
                  <span className="text-[10px] text-blue-700 font-medium">
                    Rs. {(reportsOverview?.visits.totalRevenue ?? 0).toLocaleString()} Fees Generated
                  </span>
                </div>

                <div className="p-3.5 bg-emerald-50/70 border border-emerald-200 rounded-xl">
                  <span className="text-[10px] font-bold text-emerald-900 uppercase">
                    Hospital Invoices
                  </span>
                  <div className="text-lg font-black text-emerald-900 mt-0.5">
                    Rs. {(reportsOverview?.invoices.netCollected ?? stats?.metrics?.totalClinicalRevenue ?? 0).toFixed(2)}
                  </div>
                  <span className="text-[10px] text-emerald-700 font-medium">
                    {reportsOverview?.invoices.count ?? 0} Invoices Settled
                  </span>
                </div>

                <div className="p-3.5 bg-amber-50/70 border border-amber-200 rounded-xl">
                  <span className="text-[10px] font-bold text-amber-900 uppercase">
                    Dispensary Sales
                  </span>
                  <div className="text-lg font-black text-amber-900 mt-0.5">
                    Rs. {(reportsOverview?.sales.netRevenue ?? stats?.metrics?.totalPharmacyRevenue ?? 0).toFixed(2)}
                  </div>
                  <span className="text-[10px] text-amber-700 font-medium">
                    {reportsOverview?.sales.count ?? 0} POS Checkouts
                  </span>
                </div>

                <div className="p-3.5 bg-purple-50/70 border border-purple-200 rounded-xl">
                  <span className="text-[10px] font-bold text-purple-900 uppercase">
                    Inventory Valuation
                  </span>
                  <div className="text-lg font-black text-purple-900 mt-0.5">
                    Rs. {(reportsOverview?.inventory.valuation ?? stats?.metrics?.inventoryValuation ?? 0).toLocaleString()}
                  </div>
                  <span className="text-[10px] text-purple-700 font-medium">
                    {reportsOverview?.inventory.batchCount ?? 0} Batches in Stock
                  </span>
                </div>
              </div>

              {/* 6 Report Cards Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
                {/* 1. Clinical Visits Report */}
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col justify-between space-y-3 hover:border-blue-300 transition-colors">
                  <div>
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                        <Stethoscope className="w-4 h-4 text-blue-600" />
                        <span>Patient Clinical Encounters</span>
                      </h4>
                      <span className="px-1.5 py-0.5 bg-blue-100 text-blue-800 text-[9px] font-bold rounded">
                        OPD & USG
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1">
                      Includes patient UID, consultation type (OPD/USG), physician fee, and invoice correlation.
                    </p>
                    <div className="mt-2.5 inline-flex items-center gap-1.5 px-2.5 py-1 bg-blue-50 border border-blue-200 rounded-lg text-[10px] font-bold text-blue-800">
                      <span>Live: {reportsOverview?.visits.count ?? 0} Encounters</span>
                      <span>·</span>
                      <span>Rs. {(reportsOverview?.visits.totalRevenue ?? 0).toLocaleString()}</span>
                    </div>

                    {/* Small Direct Patient Search Field on Card */}
                    <div className="mt-3 pt-2.5 border-t border-slate-200 space-y-1">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 flex items-center justify-between">
                        <span>Direct Patient Search</span>
                        {patientEncounterSearch && (
                          <button
                            type="button"
                            onClick={() => setPatientEncounterSearch("")}
                            className="text-[10px] text-red-500 hover:underline normal-case font-medium"
                          >
                            clear
                          </button>
                        )}
                      </label>
                      <div className="relative">
                        <Search className="w-3.5 h-3.5 absolute inset-y-0 left-2.5 my-auto text-slate-400" />
                        <input
                          type="text"
                          placeholder="Search patient name, UID, phone..."
                          value={patientEncounterSearch}
                          onChange={(e) => setPatientEncounterSearch(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              setPreviewInitialSearch(patientEncounterSearch);
                              setPreviewReportType("visits");
                              setPreviewModalOpen(true);
                            }
                          }}
                          className="w-full pl-8 pr-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-xs"
                        />
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        setPreviewInitialSearch(patientEncounterSearch);
                        setPreviewReportType("visits");
                        setPreviewModalOpen(true);
                      }}
                      className="flex-1 py-2 bg-white hover:bg-blue-50 text-blue-700 border border-blue-300 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors shadow-sm"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>{patientEncounterSearch ? "Search & Preview" : "Preview Summary"}</span>
                    </button>
                    <a
                      href={
                        patientEncounterSearch
                          ? `/api/admin/export?type=visits&search=${encodeURIComponent(patientEncounterSearch)}`
                          : "/api/admin/export?type=visits"
                      }
                      download
                      className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors shadow-sm"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download CSV</span>
                    </a>
                  </div>
                </div>

                {/* 2. Hospital Invoices Report */}
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col justify-between space-y-3 hover:border-emerald-300 transition-colors">
                  <div>
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                        <Receipt className="w-4 h-4 text-emerald-600" />
                        <span>Clinical Hospital Invoices</span>
                      </h4>
                      <span className="px-1.5 py-0.5 bg-emerald-100 text-emerald-800 text-[9px] font-bold rounded">
                        Audited
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1">
                      Sequential invoice numbers (INV-YYYY-XXXX), operator credentials, line item totals, and paid status.
                    </p>
                    <div className="mt-2.5 inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 border border-emerald-200 rounded-lg text-[10px] font-bold text-emerald-800">
                      <span>Live: {reportsOverview?.invoices.count ?? 0} Invoices</span>
                      <span>·</span>
                      <span>Rs. {(reportsOverview?.invoices.netCollected ?? 0).toFixed(2)}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        setPreviewInitialSearch("");
                        setPreviewReportType("invoices");
                        setPreviewModalOpen(true);
                      }}
                      className="flex-1 py-2 bg-white hover:bg-emerald-50 text-emerald-700 border border-emerald-300 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors shadow-sm"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Preview Summary</span>
                    </button>
                    <a
                      href="/api/admin/export?type=invoices"
                      download
                      className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors shadow-sm"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download CSV</span>
                    </a>
                  </div>
                </div>

                {/* 3. Pharmacy Sales Report */}
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col justify-between space-y-3 hover:border-amber-300 transition-colors">
                  <div>
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                        <Pill className="w-4 h-4 text-amber-600" />
                        <span>Pharmacy POS Sales Ledger</span>
                      </h4>
                      <span className="px-1.5 py-0.5 bg-amber-100 text-amber-800 text-[9px] font-bold rounded">
                        Dispensary
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1">
                      Sale numbers (POS-YYYY-XXXX), linked patient records, 5% generic discount breakdowns, and cash totals.
                    </p>
                    <div className="mt-2.5 inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-50 border border-amber-200 rounded-lg text-[10px] font-bold text-amber-800">
                      <span>Live: {reportsOverview?.sales.count ?? 0} Sales</span>
                      <span>·</span>
                      <span>Rs. {(reportsOverview?.sales.netRevenue ?? 0).toFixed(2)}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        setPreviewInitialSearch("");
                        setPreviewReportType("sales");
                        setPreviewModalOpen(true);
                      }}
                      className="flex-1 py-2 bg-white hover:bg-amber-50 text-amber-700 border border-amber-300 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors shadow-sm"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Preview Summary</span>
                    </button>
                    <a
                      href="/api/admin/export?type=sales"
                      download
                      className="flex-1 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors shadow-sm"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download CSV</span>
                    </a>
                  </div>
                </div>

                {/* 4. Inventory Batches Report */}
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col justify-between space-y-3 hover:border-slate-400 transition-colors">
                  <div>
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                        <Package className="w-4 h-4 text-slate-800" />
                        <span>Medicine Batches & Valuations</span>
                      </h4>
                      <span className="px-1.5 py-0.5 bg-slate-200 text-slate-800 text-[9px] font-bold rounded">
                        Formulary
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1">
                      Batch numbers, remaining stock, purchase price, selling price, expiry dates, and approval statuses.
                    </p>
                    <div className="mt-2.5 inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-200/70 border border-slate-300 rounded-lg text-[10px] font-bold text-slate-800">
                      <span>Live: {reportsOverview?.inventory.batchCount ?? 0} Batches</span>
                      <span>·</span>
                      <span>Rs. {(reportsOverview?.inventory.valuation ?? 0).toLocaleString()}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        setPreviewInitialSearch("");
                        setPreviewReportType("inventory");
                        setPreviewModalOpen(true);
                      }}
                      className="flex-1 py-2 bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors shadow-sm"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Preview Summary</span>
                    </button>
                    <a
                      href="/api/admin/export?type=inventory"
                      download
                      className="flex-1 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors shadow-sm"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download CSV</span>
                    </a>
                  </div>
                </div>

                {/* 5. Audit Trail Report */}
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col justify-between space-y-3 hover:border-purple-300 transition-colors">
                  <div>
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                        <History className="w-4 h-4 text-purple-600" />
                        <span>Full Immutable Audit Trail</span>
                      </h4>
                      <span className="px-1.5 py-0.5 bg-purple-100 text-purple-800 text-[9px] font-bold rounded">
                        Security
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1">
                      Timestamped immutable activity logs covering staff logins, registrations, invoices, POS sales, and approvals.
                    </p>
                    <div className="mt-2.5 inline-flex items-center gap-1.5 px-2.5 py-1 bg-purple-50 border border-purple-200 rounded-lg text-[10px] font-bold text-purple-800">
                      <span>Live: {reportsOverview?.audit.totalLogs ?? auditLogs.length} Events</span>
                      <span>·</span>
                      <span>RFC 4180 Format</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        setPreviewInitialSearch("");
                        setPreviewReportType("audit");
                        setPreviewModalOpen(true);
                      }}
                      className="flex-1 py-2 bg-white hover:bg-purple-50 text-purple-700 border border-purple-300 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors shadow-sm"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Preview Summary</span>
                    </button>
                    <a
                      href="/api/admin/export?type=audit"
                      download
                      className="flex-1 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors shadow-sm"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download CSV</span>
                    </a>
                  </div>
                </div>

                {/* 6. Daily Cross-Portal Sales Reconciliation Report */}
                <div className="p-4 bg-rose-50/70 border border-rose-200 rounded-2xl flex flex-col justify-between space-y-3 sm:col-span-2 lg:col-span-1 hover:border-rose-300 transition-colors">
                  <div>
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-rose-950 flex items-center gap-1.5">
                        <Calendar className="w-4 h-4 text-rose-600" />
                        <span>Daily Sales Reconciliation</span>
                      </h4>
                      <span className="px-1.5 py-0.5 bg-rose-200 text-rose-800 text-[9px] font-black rounded uppercase">
                        Dual-Stream
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600 mt-1">
                      Single-day comparative audit comparing Clinical Portal Invoices and Pharmaceutical Dispensary POS sales with profit margins.
                    </p>
                    <div className="mt-2.5 inline-flex items-center gap-1.5 px-2.5 py-1 bg-white border border-rose-200 rounded-lg text-[10px] font-bold text-rose-800">
                      <span>Today: Rs. {(reportsOverview?.daily.combinedNet ?? 0).toFixed(2)}</span>
                    </div>
                  </div>
                  <div className="space-y-2 pt-1">
                    <input
                      type="date"
                      value={dailyDate}
                      onChange={(e) => setDailyDate(e.target.value)}
                      className="w-full bg-white border border-rose-200 rounded-xl px-2.5 py-1.5 text-xs font-bold text-rose-950 focus:outline-none shadow-sm"
                    />
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setPreviewInitialSearch("");
                          setPreviewReportType("daily");
                          setPreviewModalOpen(true);
                        }}
                        className="flex-1 py-2 bg-white hover:bg-rose-50 text-rose-700 border border-rose-300 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors shadow-sm"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Preview Summary</span>
                      </button>
                      <a
                        href={`/api/admin/export?type=daily&date=${dailyDate}`}
                        download
                        className="flex-1 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1 transition-colors shadow-sm"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Export CSV</span>
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: IMMUTABLE AUDIT LOG VIEWER */}
        {activeTab === "audit" && (
          <div className="space-y-4">
            {/* Filter Bar */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="relative w-full sm:w-80">
                <Search className="w-4 h-4 absolute inset-y-0 left-3 my-auto text-slate-400" />
                <input
                  type="text"
                  placeholder="Search user, action, details..."
                  value={auditSearch}
                  onChange={(e) => setAuditSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 text-slate-900"
                />
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <select
                  value={auditActionFilter}
                  onChange={(e) => setAuditActionFilter(e.target.value)}
                  className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-700 font-semibold focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="ALL">All System Actions</option>
                  <option value="PATIENT_ENROLLED">Patient Enrolled</option>
                  <option value="INVOICE_ISSUED">Invoice Issued</option>
                  <option value="PHARMACY_SALE">Pharmacy Sale</option>
                  <option value="STOCK_REQUEST_SUBMITTED">Stock Requested</option>
                  <option value="STOCK_APPROVED">Stock Approved</option>
                  <option value="STOCK_REJECTED">Stock Rejected</option>
                </select>

                <a
                  href="/api/admin/export?type=audit"
                  download
                  className="px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1 shadow-sm transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Export</span>
                </a>
              </div>
            </div>

            {/* Audit Logs Table */}
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-700">
                  <thead className="bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-200">
                    <tr>
                      <th className="px-5 py-3.5">Timestamp</th>
                      <th className="px-5 py-3.5">User</th>
                      <th className="px-5 py-3.5">Role</th>
                      <th className="px-5 py-3.5">Action</th>
                      <th className="px-5 py-3.5">Activity Details</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {auditLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-slate-50/80">
                        <td className="px-5 py-3.5 font-mono text-slate-500 whitespace-nowrap">
                          {new Date(log.createdAt).toLocaleString()}
                        </td>
                        <td className="px-5 py-3.5 font-bold text-slate-900">
                          {log.user?.name || "System"}
                        </td>
                        <td className="px-5 py-3.5">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                              log.user?.role === "ADMIN"
                                ? "bg-purple-100 text-purple-700"
                                : log.user?.role === "RECEPTIONIST"
                                ? "bg-emerald-100 text-emerald-700"
                                : "bg-amber-100 text-amber-700"
                            }`}
                          >
                            {log.user?.role}
                          </span>
                        </td>
                        <td className="px-5 py-3.5">
                          <span className="font-mono text-xs font-semibold text-slate-800">
                            {log.action}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-slate-600">{log.details}</td>
                      </tr>
                    ))}
                    {auditLogs.length === 0 && (
                      <tr>
                        <td
                          colSpan={5}
                          className="px-5 py-8 text-center text-slate-400 text-xs"
                        >
                          No audit logs match current filters.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: WORKSTATION TERMINAL & NETWORK SECURITY */}
        {activeTab === "network" && <NetworkSecurityView />}

        {/* TAB 6: MEDICAL INVENTORY & PURCHASE SHEET */}
        {activeTab === "inventory" && (
          <div className="space-y-4">
            {/* Inventory Sub-Tabs Switcher */}
            <div className="flex items-center gap-2 bg-white p-1.5 rounded-2xl border border-slate-200/80 shadow-sm w-fit">
              <button
                type="button"
                onClick={() => setAdminInventorySubTab("catalog")}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                  adminInventorySubTab === "catalog"
                    ? "bg-purple-600 text-white shadow-md shadow-purple-500/20"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                <Sliders className="w-4 h-4" />
                <span>POS Catalog &amp; Dynamic Per-Off Control</span>
              </button>
              <button
                type="button"
                onClick={() => setAdminInventorySubTab("purchases")}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                  adminInventorySubTab === "purchases"
                    ? "bg-purple-600 text-white shadow-md shadow-purple-500/20"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                <Package className="w-4 h-4" />
                <span>Hospital Purchase Stock Sheet</span>
              </button>
            </div>

            {adminInventorySubTab === "catalog" ? (
              <AdminMedicineCatalogManagementView />
            ) : (
              <MedicinePurchaseSheetView portalRole="ADMIN" />
            )}
          </div>
        )}
      </main>

      {/* Global Report Preview Summary Modal */}
      <ReportPreviewModal
        isOpen={previewModalOpen}
        onClose={() => setPreviewModalOpen(false)}
        initialType={previewReportType}
        initialDate={dailyDate}
        initialSearch={previewInitialSearch}
      />

      {/* User Profile Modal */}
      {selectedUserForDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-100 flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="p-5 bg-gradient-to-r from-slate-900 to-indigo-950 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-purple-500/20 text-purple-400 font-extrabold flex items-center justify-center border border-purple-400/30">
                  {selectedUserForDetails.name.split(" ").map((n: string) => n[0]).slice(0, 2).join("")}
                </div>
                <div>
                  <h3 className="text-sm font-bold">{selectedUserForDetails.name}</h3>
                  <p className="text-[11px] text-slate-400">{selectedUserForDetails.email}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedUserForDetails(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 space-y-5 overflow-y-auto">
              {/* Account Meta */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                  <span className="text-[10px] font-bold uppercase text-slate-400">Assigned Role</span>
                  <p className="font-extrabold text-slate-900 uppercase">{selectedUserForDetails.role}</p>
                </div>
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                  <span className="text-[10px] font-bold uppercase text-slate-400">Created Date</span>
                  <p className="font-mono text-slate-900 font-bold">
                    {new Date(selectedUserForDetails.createdAt).toLocaleDateString()}
                  </p>
                </div>

                {/* Password / Credentials Inspection */}
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1 col-span-2">
                  <span className="text-[10px] font-bold uppercase text-slate-400">Staff Password</span>
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-slate-900">
                      {revealedPasswords[selectedUserForDetails.id]
                        ? selectedUserForDetails.displayPassword || "(Encrypted Bcrypt Hash)"
                        : "••••••••••••"}
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => togglePasswordVisibility(selectedUserForDetails.id)}
                        className="px-2 py-1 text-xs font-semibold bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg flex items-center gap-1 transition-colors"
                        title={revealedPasswords[selectedUserForDetails.id] ? "Hide password" : "Check password"}
                      >
                        {revealedPasswords[selectedUserForDetails.id] ? (
                          <EyeOff className="w-3.5 h-3.5 text-purple-600" />
                        ) : (
                          <Eye className="w-3.5 h-3.5" />
                        )}
                        <span>{revealedPasswords[selectedUserForDetails.id] ? "Hide" : "Show"}</span>
                      </button>
                      {selectedUserForDetails.displayPassword && (
                        <button
                          type="button"
                          onClick={() => handleCopyPassword(selectedUserForDetails.id, selectedUserForDetails.displayPassword)}
                          className="px-2 py-1 text-xs font-semibold bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg flex items-center gap-1 transition-colors"
                          title="Copy password"
                        >
                          {copiedUserId === selectedUserForDetails.id ? (
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                          <span>{copiedUserId === selectedUserForDetails.id ? "Copied" : "Copy"}</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
              <div>
                {selectedUserForDetails.role !== "ADMIN" && (
                  <button
                    type="button"
                    onClick={() => {
                      const target = selectedUserForDetails;
                      setSelectedUserForDetails(null);
                      setUserForDeletion(target);
                    }}
                    className="px-3 py-1.5 text-xs font-bold text-rose-600 hover:text-white bg-rose-50 hover:bg-rose-600 border border-rose-200 rounded-xl transition-colors flex items-center gap-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete User</span>
                  </button>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const target = selectedUserForDetails;
                    setSelectedUserForDetails(null);
                    setUserForPasswordChange(target);
                    setNewPasswordInput("");
                    setShowNewPassword(false);
                  }}
                  className="px-3 py-1.5 text-xs font-bold text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-xl transition-colors flex items-center gap-1"
                >
                  <Key className="w-3.5 h-3.5 text-amber-600" />
                  <span>Change Password</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedUserForDetails(null)}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-colors"
                >
                  Close Profile
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Change Password Modal */}
      {userForPasswordChange && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-100 flex flex-col">
            <div className="p-5 bg-gradient-to-r from-amber-600 to-amber-700 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-white/20 text-white flex items-center justify-center border border-white/30">
                  <Key className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold">Change User Password</h3>
                  <p className="text-[11px] text-amber-100">
                    Updating credentials for {userForPasswordChange.name} ({userForPasswordChange.role})
                  </p>
                </div>
              </div>
              <button
                onClick={() => setUserForPasswordChange(null)}
                className="p-1 rounded-lg text-white/70 hover:text-white hover:bg-white/10"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleChangePassword} className="p-6 space-y-4">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                <p className="text-[11px] text-slate-500 font-semibold">User Email Account:</p>
                <p className="text-xs font-mono font-bold text-slate-800">{userForPasswordChange.email}</p>
                {userForPasswordChange.displayPassword && (
                  <p className="text-[11px] text-slate-500 font-semibold mt-1">
                    Current Password: <span className="font-mono font-bold text-purple-700">{userForPasswordChange.displayPassword}</span>
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                  New Password
                </label>
                <div className="relative">
                  <input
                    type={showNewPassword ? "text" : "password"}
                    required
                    placeholder="Enter at least 6 characters..."
                    value={newPasswordInput}
                    onChange={(e) => setNewPasswordInput(e.target.value)}
                    className="w-full text-xs font-semibold px-3 py-2 pr-10 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                  >
                    {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-[10px] text-slate-500 mt-1">
                  Minimum 6 characters. The user can immediately log in with this new password.
                </p>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setUserForPasswordChange(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updatingPassword}
                  className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl text-xs shadow-md disabled:opacity-50 flex items-center gap-1.5"
                >
                  {updatingPassword ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <Key className="w-3.5 h-3.5" />
                      <span>Save Password</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete User Confirmation Modal */}
      {userForDeletion && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-100 flex flex-col">
            <div className="p-5 bg-gradient-to-r from-rose-600 to-rose-700 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-white/20 text-white flex items-center justify-center border border-white/30">
                  <Trash2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold">Delete Staff Account</h3>
                  <p className="text-[11px] text-rose-100">Permanent removal of staff member</p>
                </div>
              </div>
              <button
                onClick={() => setUserForDeletion(null)}
                className="p-1 rounded-lg text-white/70 hover:text-white hover:bg-white/10"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                <div className="text-xs text-rose-800 space-y-1">
                  <p className="font-bold">Are you sure you want to delete this staff account?</p>
                  <p className="text-[11px] text-rose-700">
                    This will permanently revoke login access for{" "}
                    <span className="font-bold font-mono text-rose-900">{userForDeletion.name}</span> (
                    <span className="font-bold uppercase">{userForDeletion.role}</span>). Historical clinical and financial ledger
                    records will be safely preserved under the administrator archive.
                  </p>
                </div>
              </div>

              <div className="space-y-1.5 p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">Name:</span>
                  <span className="font-bold text-slate-900">{userForDeletion.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Email:</span>
                  <span className="font-mono text-slate-900">{userForDeletion.email}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Role:</span>
                  <span className="font-bold uppercase text-purple-700">{userForDeletion.role}</span>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setUserForDeletion(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDeleteUser}
                  disabled={deletingUser}
                  className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs shadow-md disabled:opacity-50 flex items-center gap-1.5"
                >
                  {deletingUser ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Deleting...</span>
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Yes, Delete User</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add New User Modal */}
      {showAddUserModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-100 flex flex-col">
            <div className="p-5 bg-gradient-to-r from-slate-900 to-indigo-950 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-purple-500/20 text-purple-400 flex items-center justify-center border border-purple-400/30">
                  <UserPlus className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold">Add Staff Member Account</h3>
                  <p className="text-[11px] text-slate-400">Create new user with role and initial password</p>
                </div>
              </div>
              <button
                onClick={resetAddUserForm}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Tariq Mehmood"
                  value={newUserName}
                  onChange={(e) => setNewUserName(e.target.value)}
                  className="w-full text-xs font-semibold px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                  Work Email Address
                </label>
                <input
                  type="email"
                  required
                  placeholder="e.g. tmehmood@hms.local"
                  value={newUserEmail}
                  onChange={(e) => setNewUserEmail(e.target.value)}
                  className="w-full text-xs font-semibold px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                  Assigned Staff Role
                </label>
                <select
                  value={newUserRole}
                  onChange={(e) => setNewUserRole(e.target.value)}
                  className="w-full text-xs font-semibold px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="RECEPTIONIST">RECEPTIONIST (Intake, Invoicing, Receipts)</option>
                  <option value="DOCTOR">DOCTOR (Consultation, Diagnosis, Notes)</option>
                  <option value="PHARMACIST">PHARMACIST (Dispensary POS, 5% Generic, Stock)</option>
                  <option value="ADMIN">ADMIN (Full Governance, Ledger, Audit)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                  Initial Password
                </label>
                <input
                  type="password"
                  required
                  placeholder="Minimum 6 characters"
                  value={newUserPassword}
                  onChange={(e) => setNewUserPassword(e.target.value)}
                  className="w-full text-xs font-semibold px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={resetAddUserForm}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creatingUser}
                  className="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl text-xs shadow-md disabled:opacity-50"
                >
                  {creatingUser ? "Creating Account..." : "Create User"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}


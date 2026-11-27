"use client";
import { calculateRuleDeduction, defaultPenaltyPolicy, penaltyKeys, type PenaltyBreakdown, type PenaltyPolicy } from "@/lib/doctor-penalties";
import { DoctorPayrollDeductionDetails, formatPayrollAmount } from "@/components/admin/DoctorPayrollDeductionDetails";

import React, { useState, useEffect } from "react";
import {
  UserCheck,
  UserPlus,
  Edit2,
  Trash2,
  Calendar,
  DollarSign,
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Search,
  X,
  Stethoscope,
  Briefcase,
  ToggleLeft,
  ToggleRight,
  Printer,
  ChevronDown,
  Layers,
  Award,
  Lock,
  ShieldAlert,
  Check,
} from "lucide-react";
import {
  DoctorInputSchema,
  DoctorAttendanceInputSchema,
  DoctorLeaveInputSchema,
  DoctorPayrollAdjustSchema,
} from "@/lib/validation/doctor";

export function AdminDoctorManagementView() {
  const [subTab, setSubTab] = useState<"directory" | "attendance" | "analytics" | "payroll">("directory");

  // Shared state
  const [doctors, setDoctors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Search filter
  const [searchQuery, setSearchQuery] = useState("");

  // Modals - Doctor Add/Edit
  const [showDoctorModal, setShowDoctorModal] = useState(false);
  const [editingDoctor, setEditingDoctor] = useState<any | null>(null);
  const [doctorForm, setDoctorForm] = useState({
    name: "",
    specialization: "",
    phone: "",
    email: "",
    baseSalary: "",
    payType: "MONTHLY",
    perPatientShare: "0",
    userId: "",
    isActive: true,
  });
  const [penaltyPolicy, setPenaltyPolicy] = useState<PenaltyPolicy>(defaultPenaltyPolicy);
  const [doctorErrors, setDoctorErrors] = useState<any>({});
  const [savingDoctor, setSavingDoctor] = useState(false);

  // Modals - Attendance
  const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().split("T")[0]);
  const [attendanceList, setAttendanceList] = useState<any[]>([]);
  const [loadingAttendance, setLoadingAttendance] = useState(false);
  const [markingAttendance, setMarkingAttendance] = useState(false);
  const [stagedAttendance, setStagedAttendance] = useState<Record<string, string>>({});
  const [showAttendanceConfirmModal, setShowAttendanceConfirmModal] = useState(false);
  const [attendanceTargetDoctor, setAttendanceTargetDoctor] = useState<{ id: string; name: string; status: string } | null>(null);

  // Modals - Leave
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [leaveForm, setLeaveForm] = useState({
    doctorId: "",
    startDate: new Date().toISOString().split("T")[0],
    endDate: new Date().toISOString().split("T")[0],
    reason: "",
    status: "APPROVED",
    notes: "",
  });
  const [leavesList, setLeavesList] = useState<any[]>([]);
  const [loadingLeaves, setLoadingLeaves] = useState(false);

  // Analytics State
  const [analyticsData, setAnalyticsData] = useState<any | null>(null);
  const [loadingAnalytics, setLoadingAnalytics] = useState(false);

  // Payroll State
  const now = new Date();
  const [payrollYear, setPayrollYear] = useState(now.getFullYear());
  const [payrollMonth, setPayrollMonth] = useState(now.getMonth() + 1);
  const [payrolls, setPayrolls] = useState<any[]>([]);
  const [loadingPayroll, setLoadingPayroll] = useState(false);

  // Payroll Adjustment Modal
  const [editingPayroll, setEditingPayroll] = useState<any | null>(null);
  const [payrollForm, setPayrollForm] = useState({
    basePay: "",
    workingDays: "",
    bonuses: "",
    deductions: "",
    status: "DRAFT",
    notes: "",
  });
  const [savingPayroll, setSavingPayroll] = useState(false);

  // Fetch Doctors Directory
  const fetchDoctors = async () => {
    try {
      const res = await fetch("/api/admin/doctors");
      if (res.ok) {
        const data = await res.json();
        setDoctors(data.doctors || []);
      }
    } catch (e) {
      console.error(e);
      setFeedback({ type: "error", message: "Failed to load doctor directory" });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Fetch Attendance
  const fetchAttendance = async (dateStr: string) => {
    setLoadingAttendance(true);
    try {
      const res = await fetch(`/api/admin/doctors/attendance?dateStr=${dateStr}`);
      if (res.ok) {
        const data = await res.json();
        setAttendanceList(data.attendances || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingAttendance(false);
    }
  };

  // Fetch Leaves
  const fetchLeaves = async () => {
    setLoadingLeaves(true);
    try {
      const res = await fetch("/api/admin/doctors/leaves");
      if (res.ok) {
        const data = await res.json();
        setLeavesList(data.leaves || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingLeaves(false);
    }
  };

  // Fetch Analytics
  const fetchAnalytics = async () => {
    setLoadingAnalytics(true);
    try {
      const res = await fetch("/api/admin/doctors/analytics");
      if (res.ok) {
        const data = await res.json();
        setAnalyticsData(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingAnalytics(false);
    }
  };

  // Fetch Payroll
  const fetchPayroll = async (year: number, month: number) => {
    setLoadingPayroll(true);
    try {
      const res = await fetch(`/api/admin/doctors/payroll?year=${year}&month=${month}`);
      if (res.ok) {
        const data = await res.json();
        setPayrolls(data.payrolls || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingPayroll(false);
    }
  };

  useEffect(() => {
    fetchDoctors();
  }, []);

  useEffect(() => {
    if (subTab === "attendance") {
      fetchAttendance(attendanceDate);
      fetchLeaves();
    } else if (subTab === "analytics") {
      fetchAnalytics();
    } else if (subTab === "payroll") {
      fetchPayroll(payrollYear, payrollMonth);
    }
  }, [subTab, attendanceDate, payrollYear, payrollMonth]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchDoctors();
    if (subTab === "attendance") {
      fetchAttendance(attendanceDate);
      fetchLeaves();
    } else if (subTab === "analytics") {
      fetchAnalytics();
    } else if (subTab === "payroll") {
      fetchPayroll(payrollYear, payrollMonth);
    }
  };

  // -------------------------------------------------------------
  // Doctor CRUD Handlers
  // -------------------------------------------------------------
  const openAddDoctor = () => {
    setEditingDoctor(null);
    setDoctorForm({
      name: "",
      specialization: "",
      phone: "",
      email: "",
      baseSalary: "150000",
      payType: "MONTHLY",
      perPatientShare: "150",
      userId: "",
      isActive: true,
    });
    setPenaltyPolicy(defaultPenaltyPolicy);
    setDoctorErrors({});
    setShowDoctorModal(true);
  };

  const openEditDoctor = (doc: any) => {
    setPenaltyPolicy(doc.penaltyPolicy && typeof doc.penaltyPolicy === "object" ? { ...defaultPenaltyPolicy, ...doc.penaltyPolicy } : defaultPenaltyPolicy);
    setEditingDoctor(doc);
    setDoctorForm({
      name: doc.name,
      specialization: doc.specialization,
      phone: doc.phone || "",
      email: doc.email || "",
      baseSalary: String(doc.baseSalary),
      payType: doc.payType || "MONTHLY",
      perPatientShare: String(doc.perPatientShare || "0"),
      userId: doc.userId || "",
      isActive: doc.isActive,
    });
    setDoctorErrors({});
    setShowDoctorModal(true);
  };

  const handleSaveDoctor = async (e: React.FormEvent) => {
    e.preventDefault();
    setDoctorErrors({});

    const parseResult = DoctorInputSchema.safeParse({
      name: doctorForm.name,
      specialization: doctorForm.specialization,
      phone: doctorForm.phone,
      email: doctorForm.email,
      baseSalary: doctorForm.baseSalary,
      payType: doctorForm.payType,
      perPatientShare: doctorForm.perPatientShare,
      userId: doctorForm.userId,
      isActive: doctorForm.isActive,
      penaltyPolicy,
    });

    if (!parseResult.success) {
      setDoctorErrors(parseResult.error.flatten().fieldErrors);
      return;
    }

    setSavingDoctor(true);
    try {
      const url = editingDoctor
        ? `/api/admin/doctors/${editingDoctor.id}`
        : "/api/admin/doctors";
      const method = editingDoctor ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parseResult.data),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save doctor");

      setFeedback({ type: "success", message: data.message || "Doctor profile saved successfully." });
      setShowDoctorModal(false);
      await fetchDoctors();
      if (subTab === "attendance") { fetchAttendance(attendanceDate); fetchLeaves(); }
      if (subTab === "analytics") fetchAnalytics();
      if (subTab === "payroll") fetchPayroll(payrollYear, payrollMonth);
    } catch (err: any) {
      setFeedback({ type: "error", message: err.message });
    } finally {
      setSavingDoctor(false);
    }
  };

  const handleToggleDoctorActive = async (doc: any) => {
    try {
      const res = await fetch(`/api/admin/doctors/${doc.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !doc.isActive }),
      });
      if (res.ok) {
        setFeedback({
          type: "success",
          message: `Doctor "${doc.name}" is now ${!doc.isActive ? "ACTIVE" : "INACTIVE"}.`,
        });
        setDoctors((prev) => prev.map((item) => item.id === doc.id ? { ...item, isActive: !doc.isActive } : item));
        setStagedAttendance((prev) => { const next = { ...prev }; delete next[doc.id]; return next; });
        await fetchDoctors();
        fetchAttendance(attendanceDate);
        fetchLeaves();
        fetchAnalytics();
        fetchPayroll(payrollYear, payrollMonth);
      } else {
        const data = await res.json();
        throw new Error(data.error || "Failed to update doctor status");
      }
    } catch (e: any) {
      setFeedback({ type: "error", message: e.message });
    }
  };

  // -------------------------------------------------------------
  // Attendance Handler (Confirmation Modal - No native alerts)
  // -------------------------------------------------------------
  const handleStageAttendance = (doctorId: string, status: string) => {
    if (!doctors.find((d) => d.id === doctorId)?.isActive) return;
    setStagedAttendance((prev) => ({
      ...prev,
      [doctorId]: status,
    }));
  };

  const promptConfirmSingleDoctor = (doctorId: string, doctorName: string, status: string) => {
    if (!doctors.find((d) => d.id === doctorId)?.isActive) return;
    setAttendanceTargetDoctor({ id: doctorId, name: doctorName, status });
    setShowAttendanceConfirmModal(true);
  };

  const promptConfirmBatch = () => {
    setAttendanceTargetDoctor(null);
    setShowAttendanceConfirmModal(true);
  };

  const executeConfirmSaveAttendance = async () => {
    setMarkingAttendance(true);
    try {
      if (attendanceTargetDoctor) {
        // Save single target doctor
        const res = await fetch("/api/admin/doctors/attendance", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            doctorId: attendanceTargetDoctor.id,
            dateStr: attendanceDate,
            status: attendanceTargetDoctor.status,
            checkInTime: attendanceTargetDoctor.status === "PRESENT" ? "09:00 AM" : undefined,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to mark attendance");

        setFeedback({
          type: "success",
          message: data.message || `Attendance finalized and permanently locked for Dr. ${attendanceTargetDoctor.name}.`,
        });

        setStagedAttendance((prev) => {
          const next = { ...prev };
          delete next[attendanceTargetDoctor.id];
          return next;
        });
      } else {
        // Batch save all staged doctors who are not already recorded
        const doctorIdsToSave = Object.keys(stagedAttendance).filter((id) => {
          const rec = attendanceList.find((a) => a.doctorId === id);
          return !rec && doctors.some((d) => d.id === id && d.isActive);
        });

        if (doctorIdsToSave.length === 0) {
          throw new Error("No pending doctor attendances selected to save.");
        }

        let successCount = 0;
        let lastError = "";

        for (const doctorId of doctorIdsToSave) {
          const status = stagedAttendance[doctorId] || "PRESENT";
          const res = await fetch("/api/admin/doctors/attendance", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              doctorId,
              dateStr: attendanceDate,
              status,
              checkInTime: status === "PRESENT" ? "09:00 AM" : undefined,
            }),
          });
          if (res.ok) {
            successCount++;
          } else {
            const errData = await res.json();
            lastError = errData.error || "Failed to save attendance";
          }
        }

        if (successCount > 0) {
          setFeedback({
            type: "success",
            message: `Successfully finalized and locked attendance for ${successCount} doctor(s) on ${attendanceDate}.`,
          });
          setStagedAttendance({});
        } else {
          throw new Error(lastError || "Failed to save attendance batch.");
        }
      }

      setShowAttendanceConfirmModal(false);
      setAttendanceTargetDoctor(null);
      fetchAttendance(attendanceDate);
    } catch (e: any) {
      setFeedback({ type: "error", message: e.message });
    } finally {
      setMarkingAttendance(false);
    }
  };

  // -------------------------------------------------------------
  // Leave Handler (No native alert)
  // -------------------------------------------------------------
  const handleSaveLeave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!leaveForm.doctorId) {
      setFeedback({ type: "error", message: "Please choose a doctor before recording leave." });
      return;
    }

    try {
      const res = await fetch("/api/admin/doctors/leaves", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(leaveForm),
      });
      const data = await res.json();
      if (res.ok) {
        setFeedback({ type: "success", message: data.message || "Leave recorded." });
        setShowLeaveModal(false);
        fetchLeaves();
      } else {
        throw new Error(data.error || "Failed to record leave");
      }
    } catch (e: any) {
      setFeedback({ type: "error", message: e.message });
    }
  };

  // -------------------------------------------------------------
  // Payroll Handler
  // -------------------------------------------------------------
  const payrollIsPaid = editingPayroll?.status === "PAID";
  const savedBreakdown = editingPayroll?.penaltyBreakdown as PenaltyBreakdown | null | undefined;
  const payrollBreakdown = savedBreakdown && savedBreakdown.enabled && !payrollIsPaid
    ? {
        ...savedBreakdown,
        details: savedBreakdown.details.map((rule) => ({
          ...rule,
          deduction: calculateRuleDeduction(rule.excess, rule.mode, rule.amount, Number(payrollForm.basePay)),
        })),
      }
    : savedBreakdown;
  const automaticDeductions = (payrollBreakdown?.details ?? []).reduce((total, rule) => total + rule.deduction, 0);
  const previewNetPay = Number(payrollForm.basePay) + Number(payrollForm.bonuses) - Number(payrollForm.deductions) - automaticDeductions;

  const openAdjustPayroll = (p: any) => {
    setEditingPayroll(p);
    setPayrollForm({
      basePay: String(p.basePay),
      workingDays: String(p.workingDays),
      bonuses: String(p.bonuses),
      deductions: String(Math.max(0, Math.round((p.deductions - (p.penaltyBreakdown?.total ?? 0)) * 100) / 100)),
      status: p.status || "DRAFT",
      notes: p.notes || "",
    });
  };

  const handleSavePayrollAdjust = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPayroll || editingPayroll.status === "PAID") return;

    setSavingPayroll(true);
    try {
      const res = await fetch("/api/admin/doctors/payroll", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          doctorId: editingPayroll.doctorId,
          year: payrollYear,
          month: payrollMonth,
          basePay: Number(payrollForm.basePay),
          workingDays: Number(payrollForm.workingDays),
          bonuses: Number(payrollForm.bonuses),
          manualDeductions: Number(payrollForm.deductions),
          status: payrollForm.status,
          notes: payrollForm.notes,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setFeedback({ type: "success", message: data.message || "Payroll record updated." });
        if (data.payroll?.status === "PAID") {
          openAdjustPayroll(data.payroll);
        } else {
          setEditingPayroll(null);
        }
        fetchPayroll(payrollYear, payrollMonth);
      } else {
        throw new Error(data.error || "Failed to save payroll");
      }
    } catch (e: any) {
      setFeedback({ type: "error", message: e.message });
    } finally {
      setSavingPayroll(false);
    }
  };

  // Filtered doctors
  const filteredDoctors = doctors.filter(
    (d) =>
      d.name.toLowerCase().includes(searchQuery.toLowerCase().trim()) ||
      d.specialization.toLowerCase().includes(searchQuery.toLowerCase().trim())
  );

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
              <Stethoscope className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900 tracking-tight">
                Doctor Management &amp; Dynamic Payroll
              </h2>
              <p className="text-xs text-slate-500">
                Configure doctor profiles, daily attendance, working days, patient visit analytics, and pay terms.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
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

      {/* Mobile navigation: all four destinations visible without horizontal scrolling. */}
      <div className="grid grid-cols-2 gap-2 sm:hidden" role="group" aria-label="Doctor management sections">
        {([
          { id: "directory", label: "Doctor Directory", icon: Briefcase },
          { id: "attendance", label: "Attendance & Leaves", icon: Calendar },
          { id: "analytics", label: "Patient Visits", icon: TrendingUp },
          { id: "payroll", label: "Payroll & Bonuses", icon: DollarSign },
        ] as const).map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => setSubTab(id)}
            aria-pressed={subTab === id}
            className={`flex min-h-[64px] min-w-0 flex-col items-center justify-center gap-1.5 rounded-xl border px-2 py-3 text-center text-xs font-bold leading-tight transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 ${
              subTab === id
                ? "border-indigo-600 bg-indigo-600 text-white shadow-sm"
                : "border-slate-200 bg-white text-slate-700 hover:bg-indigo-50"
            }`}
          >
            <Icon className="h-5 w-5 shrink-0" aria-hidden="true" />
            <span className="break-words">{label}</span>
          </button>
        ))}
      </div>

      {/* Sub-Tab Navigation Bar */}
      <div className="hidden sm:block bg-white p-1.5 rounded-2xl border border-slate-200/80 shadow-sm overflow-x-auto scrollbar-none">
        <div className="flex items-center gap-2 min-w-max pb-0.5">
          <button
            onClick={() => setSubTab("directory")}
            className={`px-3.5 sm:px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap min-h-[38px] ${
              subTab === "directory"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-500/20"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            <Briefcase className="w-4 h-4 shrink-0" />
            <span>Doctor Directory ({doctors.length})</span>
          </button>

          <button
            onClick={() => setSubTab("attendance")}
            className={`px-3.5 sm:px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap min-h-[38px] ${
              subTab === "attendance"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-500/20"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            <Calendar className="w-4 h-4 shrink-0" />
            <span>Attendance &amp; Leaves</span>
          </button>

          <button
            onClick={() => setSubTab("analytics")}
            className={`px-3.5 sm:px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap min-h-[38px] ${
              subTab === "analytics"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-500/20"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            <TrendingUp className="w-4 h-4 shrink-0" />
            <span>Patient Visit Metrics (D/W/Y)</span>
          </button>

          <button
            onClick={() => setSubTab("payroll")}
            className={`px-3.5 sm:px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap min-h-[38px] ${
              subTab === "payroll"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-500/20"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            <DollarSign className="w-4 h-4 shrink-0" />
            <span>Dynamic Payroll &amp; Bonuses</span>
          </button>
        </div>
      </div>

      {/* Feedback Alert */}
      {feedback && (
        <div
          className={`p-4 rounded-xl border flex items-center justify-between text-xs font-semibold animate-in fade-in ${
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
          <button onClick={() => setFeedback(null)} className="p-1 text-slate-400 hover:text-slate-600">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* ========================================================= */}
      {/* SUB-TAB 1: DOCTOR DIRECTORY */}
      {/* ========================================================= */}
      {subTab === "directory" && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm">
            <div className="relative flex-1 max-w-sm">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search by doctor name, specialty, phone..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 font-medium"
              />
            </div>
            <button
              onClick={openAddDoctor}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black flex items-center gap-1.5 transition-colors shadow-sm self-start sm:self-auto"
            >
              <UserPlus className="w-4 h-4" />
              <span>Add New Doctor</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredDoctors.map((doc) => (
              <div
                key={doc.id}
                className={`bg-white rounded-2xl p-5 border transition-all flex flex-col justify-between ${
                  doc.isActive ? "border-slate-200 hover:border-indigo-300 shadow-sm" : "border-slate-200 opacity-60 bg-slate-50/50"
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <h4 className="text-sm font-black text-slate-900">{doc.name} {!doc.isActive && <span className="text-rose-600 text-[10px]">Inactive</span>}</h4>
                      <p className="text-xs text-indigo-700 font-bold">{doc.specialization}</p>
                    </div>
                    <span
                      className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${
                        doc.isActive
                          ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                          : "bg-slate-200 text-slate-600"
                      }`}
                    >
                      {doc.isActive ? "Active" : "Inactive"}
                    </span>
                  </div>

                  <div className="text-[11px] text-slate-500 space-y-1 mt-3 pt-3 border-t border-slate-100 font-medium">
                    {doc.phone && (
                      <div className="flex justify-between">
                        <span className="text-slate-400">Phone:</span>
                        <span className="text-slate-700 font-mono">{doc.phone}</span>
                      </div>
                    )}
                    {doc.email && (
                      <div className="flex justify-between">
                        <span className="text-slate-400">Email:</span>
                        <span className="text-slate-700 truncate max-w-[170px]">{doc.email}</span>
                      </div>
                    )}
                    <div className="flex justify-between pt-1">
                      <span className="text-slate-400">Base Salary:</span>
                      <span className="font-mono font-bold text-slate-900">
                        Rs. {Number(doc.baseSalary).toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Patient Incentive:</span>
                      <span className="font-mono font-bold text-emerald-700">
                        + Rs. {Number(doc.perPatientShare).toLocaleString()} / visit
                      </span>
                    </div>
                  </div>

                  <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400">
                    <span>Visits: {doc._count?.visits || 0}</span>
                    <span>Tokens: {doc._count?.tokenLogs || 0}</span>
                    <span>Attendance: {doc._count?.attendances || 0}d</span>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-1.5 pt-3 mt-3 border-t border-slate-100">
                  <button
                    onClick={() => handleToggleDoctorActive(doc)}
                    className="p-1.5 text-slate-500 hover:text-indigo-600 rounded-lg hover:bg-slate-100"
                    title={doc.isActive ? "Deactivate Doctor" : "Activate Doctor"}
                  >
                    {doc.isActive ? <ToggleRight className="w-5 h-5 text-emerald-600" /> : <ToggleLeft className="w-5 h-5 text-slate-400" />}
                  </button>
                  <button
                    onClick={() => openEditDoctor(doc)}
                    className="px-2.5 py-1 text-xs font-bold text-slate-700 hover:text-indigo-600 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg flex items-center gap-1"
                  >
                    <Edit2 className="w-3 h-3" />
                    <span>Edit</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* SUB-TAB 2: ATTENDANCE & LEAVES */}
      {/* ========================================================= */}
      {subTab === "attendance" && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Calendar className="w-5 h-5 text-indigo-600" />
              <div>
                <h3 className="text-sm font-black text-slate-900">Daily Doctor Attendance</h3>
                <p className="text-xs text-slate-500">Record check-ins and absences for working days calculation</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <label className="text-xs font-bold text-slate-600">Select Date:</label>
              <input
                type="date"
                value={attendanceDate}
                onChange={(e) => setAttendanceDate(e.target.value)}
                className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800"
              />
              <button
                onClick={() => setShowLeaveModal(true)}
                className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl text-xs font-black border border-indigo-200"
              >
                + Record Leave
              </button>
            </div>
          </div>

          {/* Audit Immutability Policy Banner */}
          <div className="bg-amber-50 border border-amber-200/90 rounded-2xl p-4 flex items-start gap-3 text-amber-950">
            <Lock className="w-5 h-5 text-amber-700 flex-shrink-0 mt-0.5" />
            <div className="space-y-0.5 text-xs">
              <p className="font-extrabold uppercase tracking-wide text-amber-900">
                🔒 Permanent Attendance Lock Policy (Audit Constraint)
              </p>
              <p className="text-amber-800">
                When an administrator marks and saves attendance for a doctor for any given date, that record becomes <strong>permanently locked in PostgreSQL</strong> and cannot be altered, edited, or re-saved. Please verify before marking.
              </p>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
            {/* Desktop & Tablet View: Structured Horizontal Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200 whitespace-nowrap">
                    <th className="px-5 py-3.5">Doctor</th>
                    <th className="px-5 py-3.5">Specialization</th>
                    <th className="px-5 py-3.5">Status on {attendanceDate}</th>
                    <th className="px-5 py-3.5">Mark Attendance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {doctors.map((doc) => {
                    const rec = attendanceList.find((a) => a.doctorId === doc.id);
                    const isRecorded = Boolean(rec);
                    const status = rec?.status || "NOT_MARKED";
                    return (
                      <tr key={doc.id} className={doc.isActive ? "hover:bg-slate-50/60" : "bg-slate-50 opacity-65"}>
                        <td className="px-5 py-3.5 font-bold text-slate-900 whitespace-nowrap">{doc.name} {!doc.isActive && <span className="ml-2 text-rose-600 text-[10px]">Inactive</span>}</td>
                        <td className="px-5 py-3.5 text-slate-500 whitespace-nowrap">{doc.specialization}</td>
                        <td className="px-5 py-3.5 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <span
                              className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                                status === "PRESENT"
                                  ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                                  : status === "ABSENT"
                                  ? "bg-rose-100 text-rose-800 border border-rose-300"
                                  : status === "LEAVE"
                                  ? "bg-amber-100 text-amber-800 border border-amber-300"
                                  : status === "HALF_DAY"
                                  ? "bg-indigo-100 text-indigo-800 border border-indigo-300"
                                  : "bg-slate-100 text-slate-500"
                              }`}
                            >
                              {status}
                            </span>
                            {isRecorded && (
                              <span className="flex items-center gap-1 text-[10px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
                                <Lock className="w-2.5 h-2.5 text-slate-500" />
                                <span>Locked</span>
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-5 py-3.5">
                          {isRecorded ? (
                            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 border border-slate-200 rounded-xl text-[11px] font-bold text-slate-600 w-fit">
                              <Lock className="w-3.5 h-3.5 text-slate-500" />
                              <span>Saved &bull; Cannot be changed</span>
                            </div>
                          ) : !doc.isActive ? (
                            <span className="text-xs font-bold text-slate-500" aria-disabled="true">Attendance disabled — doctor inactive</span>
                          ) : (
                            <div className="flex items-center gap-2 flex-wrap">
                              {(() => {
                                const currentStaged = stagedAttendance[doc.id] || "PRESENT";
                                return (
                                  <>
                                    <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-xl border border-slate-200">
                                      <button
                                        type="button"
                                        onClick={() => handleStageAttendance(doc.id, "PRESENT")}
                                        className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                                          currentStaged === "PRESENT"
                                            ? "bg-emerald-600 text-white shadow-xs"
                                            : "text-slate-600 hover:bg-white"
                                        }`}
                                      >
                                        Present
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => handleStageAttendance(doc.id, "HALF_DAY")}
                                        className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                                          currentStaged === "HALF_DAY"
                                            ? "bg-indigo-600 text-white shadow-xs"
                                            : "text-slate-600 hover:bg-white"
                                        }`}
                                      >
                                        Half-Day
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => handleStageAttendance(doc.id, "LEAVE")}
                                        className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                                          currentStaged === "LEAVE"
                                            ? "bg-amber-600 text-white shadow-xs"
                                            : "text-slate-600 hover:bg-white"
                                        }`}
                                      >
                                        Leave
                                      </button>
                                      <button type="button" onClick={() => handleStageAttendance(doc.id, "OFF")}
                                        className={`px-2.5 py-1 rounded-lg text-[11px] font-bold ${currentStaged === "OFF" ? "bg-sky-600 text-white" : "text-slate-600 hover:bg-white"}`}>Off</button>
                                      <button
                                        type="button"
                                        onClick={() => handleStageAttendance(doc.id, "ABSENT")}
                                        className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                                          currentStaged === "ABSENT"
                                            ? "bg-rose-600 text-white shadow-xs"
                                            : "text-slate-600 hover:bg-white"
                                        }`}
                                      >
                                        Absent
                                      </button>
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() => promptConfirmSingleDoctor(doc.id, doc.name, currentStaged)}
                                      disabled={markingAttendance}
                                      className="px-3 py-1 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-[11px] font-extrabold transition-colors shadow-2xs"
                                    >
                                      Save
                                    </button>
                                  </>
                                );
                              })()}
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile View: Vertical Stacked Key-Value Cards */}
            <div className="block md:hidden p-3.5 space-y-3 bg-slate-50/50">
              {doctors.map((doc) => {
                const rec = attendanceList.find((a) => a.doctorId === doc.id);
                const isRecorded = Boolean(rec);
                const status = rec?.status || "NOT_MARKED";
                const currentStaged = stagedAttendance[doc.id] || "PRESENT";

                return (
                  <div
                    key={doc.id}
                    className={`bg-white rounded-xl p-4 border border-slate-200/90 shadow-2xs space-y-3 ${!doc.isActive ? "opacity-65" : ""}`}
                  >
                    {/* Card Header */}
                    <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-2.5">
                      <div>
                        <h4 className="text-sm font-black text-slate-900">{doc.name} {!doc.isActive && <span className="text-rose-600 text-[10px]">Inactive</span>}</h4>
                        <p className="text-xs text-indigo-700 font-bold">{doc.specialization}</p>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                            status === "PRESENT"
                              ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                              : status === "ABSENT"
                              ? "bg-rose-100 text-rose-800 border border-rose-300"
                              : status === "LEAVE"
                              ? "bg-amber-100 text-amber-800 border border-amber-300"
                              : status === "HALF_DAY"
                              ? "bg-indigo-100 text-indigo-800 border border-indigo-300"
                              : "bg-slate-100 text-slate-500"
                          }`}
                        >
                          {status}
                        </span>
                        {isRecorded && (
                          <span className="p-1 bg-slate-100 rounded text-slate-500" title="Locked">
                            <Lock className="w-3 h-3" />
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Card Body: 2-Column Key-Value Grid */}
                    <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                          Attendance Date
                        </span>
                        <span className="font-mono font-bold text-slate-800 text-[11px]">
                          {attendanceDate}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                          Record State
                        </span>
                        <span className="font-bold text-[11px] text-slate-700">
                          {isRecorded ? "Permanently Saved" : "Pending Submission"}
                        </span>
                      </div>
                    </div>

                    {/* Interactive Controls & Card Footer */}
                    <div className="pt-2 border-t border-slate-100">
                      {isRecorded ? (
                        <div className="flex items-center gap-1.5 py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-500 justify-center">
                          <Lock className="w-3.5 h-3.5" />
                          <span>Attendance record finalized</span>
                        </div>
                      ) : !doc.isActive ? (
                        <div className="text-xs font-bold text-slate-500 py-2" aria-disabled="true">Attendance disabled — doctor inactive</div>
                      ) : (
                        <div className="space-y-2.5">
                          <div className="grid grid-cols-5 gap-1 p-1 bg-slate-100 rounded-xl border border-slate-200">
                            <button
                              type="button"
                              onClick={() => handleStageAttendance(doc.id, "PRESENT")}
                              className={`py-1.5 rounded-lg text-[11px] font-bold transition-all min-h-[36px] flex items-center justify-center ${
                                currentStaged === "PRESENT"
                                  ? "bg-emerald-600 text-white shadow-xs"
                                  : "text-slate-600 hover:bg-white"
                              }`}
                            >
                              Present
                            </button>
                            <button
                              type="button"
                              onClick={() => handleStageAttendance(doc.id, "HALF_DAY")}
                              className={`py-1.5 rounded-lg text-[11px] font-bold transition-all min-h-[36px] flex items-center justify-center ${
                                currentStaged === "HALF_DAY"
                                  ? "bg-indigo-600 text-white shadow-xs"
                                  : "text-slate-600 hover:bg-white"
                              }`}
                            >
                              Half
                            </button>
                            <button
                              type="button"
                              onClick={() => handleStageAttendance(doc.id, "LEAVE")}
                              className={`py-1.5 rounded-lg text-[11px] font-bold transition-all min-h-[36px] flex items-center justify-center ${
                                currentStaged === "LEAVE"
                                  ? "bg-amber-600 text-white shadow-xs"
                                  : "text-slate-600 hover:bg-white"
                              }`}
                            >
                              Leave
                            </button>
                            <button type="button" onClick={() => handleStageAttendance(doc.id, "OFF")}
                              className={`py-1.5 rounded-lg text-[11px] font-bold min-h-[36px] ${currentStaged === "OFF" ? "bg-sky-600 text-white" : "text-slate-600 hover:bg-white"}`}>Off</button>
                            <button
                              type="button"
                              onClick={() => handleStageAttendance(doc.id, "ABSENT")}
                              className={`py-1.5 rounded-lg text-[11px] font-bold transition-all min-h-[36px] flex items-center justify-center ${
                                currentStaged === "ABSENT"
                                  ? "bg-rose-600 text-white shadow-xs"
                                  : "text-slate-600 hover:bg-white"
                              }`}
                            >
                              Absent
                            </button>
                          </div>
                          <button
                            type="button"
                            onClick={() => promptConfirmSingleDoctor(doc.id, doc.name, currentStaged)}
                            disabled={markingAttendance}
                            className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-black transition-colors shadow-xs flex items-center justify-center gap-1.5 min-h-[40px]"
                          >
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                            <span>Save {doc.name}&apos;s Attendance</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* End of Attendance List: Save & Finalize Attendance Action Bar */}
            {(() => {
              const unrecordedDoctors = doctors.filter(
                (d) => d.isActive && !attendanceList.find((a) => a.doctorId === d.id)
              );
              if (unrecordedDoctors.length === 0) return null;

              return (
                <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="text-xs text-slate-600 font-medium">
                    <span className="font-extrabold text-slate-900">{unrecordedDoctors.length}</span> doctor(s) pending attendance for <span className="font-mono font-bold text-slate-800">{attendanceDate}</span>. Select statuses above and click Save.
                  </div>
                  <button
                    type="button"
                    onClick={promptConfirmBatch}
                    disabled={markingAttendance}
                    className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-black flex items-center gap-2 shadow-sm transition-all self-end sm:self-auto"
                  >
                    <Check className="w-4 h-4 text-emerald-400" />
                    <span>Save &amp; Finalize Attendance ({unrecordedDoctors.length} Doctors)</span>
                  </button>
                </div>
              );
            })()}
          </div>

          {/* Leave Records Table */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm space-y-3">
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-800">
              Doctor Leave Records &amp; Requests
            </h4>
            {leavesList.length === 0 ? (
              <p className="text-xs text-slate-400 py-3">No leaves recorded yet.</p>
            ) : (
              <div className="divide-y divide-slate-100">
                {leavesList.map((lv) => (
                  <div key={lv.id} className="py-2.5 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-bold text-slate-900">{lv.doctor?.name}: </span>
                      <span className="text-slate-600">{lv.reason} </span>
                      <span className="text-slate-400 font-mono text-[11px]">
                        ({new Date(lv.startDate).toLocaleDateString()} – {new Date(lv.endDate).toLocaleDateString()})
                      </span>
                    </div>
                    <span
                      className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${
                        lv.status === "APPROVED"
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-amber-100 text-amber-800"
                      }`}
                    >
                      {lv.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* SUB-TAB 3: PATIENT VISIT METRICS */}
      {/* ========================================================= */}
      {subTab === "analytics" && (
        <div className="space-y-6">
          {analyticsData && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Today Visits</span>
                <p className="text-2xl font-black text-slate-900 mt-1">{analyticsData.summary.totalDaily}</p>
              </div>
              <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Past 7 Days Visits</span>
                <p className="text-2xl font-black text-indigo-600 mt-1">{analyticsData.summary.totalWeekly}</p>
              </div>
              <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Current Year Total</span>
                <p className="text-2xl font-black text-emerald-600 mt-1">{analyticsData.summary.totalYearly}</p>
              </div>
              <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Today Tokens Assigned</span>
                <p className="text-2xl font-black text-amber-600 mt-1">{analyticsData.summary.totalTodayTokens}</p>
              </div>
            </div>
          )}

          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-100">
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">
                Doctor Patient Visit Counts (PostgreSQL Live)
              </h3>
              <p className="text-xs text-slate-500">Live patient consultations tallied by assigned doctor</p>
            </div>

            {/* Desktop & Tablet View: Structured Horizontal Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200 whitespace-nowrap">
                    <th className="px-5 py-3.5">Doctor Name</th>
                    <th className="px-5 py-3.5">Specialty</th>
                    <th className="px-5 py-3.5 text-center">Daily (Today)</th>
                    <th className="px-5 py-3.5 text-center">Weekly (7 Days)</th>
                    <th className="px-5 py-3.5 text-center">Yearly ({new Date().getFullYear()})</th>
                    <th className="px-5 py-3.5 text-center">Today Queue Tokens</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {analyticsData?.doctors?.map((doc: any) => (
                    <tr key={doc.doctorId} className="hover:bg-slate-50/60 font-medium">
                      <td className="px-5 py-3.5 font-bold text-slate-900 whitespace-nowrap">{doc.name}</td>
                      <td className="px-5 py-3.5 text-slate-500 whitespace-nowrap">{doc.specialization}</td>
                      <td className="px-5 py-3.5 text-center font-mono font-bold text-slate-900">
                        {doc.metrics.daily}
                      </td>
                      <td className="px-5 py-3.5 text-center font-mono font-bold text-indigo-700">
                        {doc.metrics.weekly}
                      </td>
                      <td className="px-5 py-3.5 text-center font-mono font-bold text-emerald-700">
                        {doc.metrics.yearly}
                      </td>
                      <td className="px-5 py-3.5 text-center font-mono font-bold text-amber-700">
                        {doc.metrics.todayTokens}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile View: Vertical Stacked Key-Value Cards */}
            <div className="block md:hidden p-3.5 space-y-3 bg-slate-50/50">
              {analyticsData?.doctors?.map((doc: any) => (
                <div
                  key={doc.doctorId}
                  className="bg-white rounded-xl p-4 border border-slate-200/90 shadow-2xs space-y-3"
                >
                  {/* Card Header */}
                  <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-2.5">
                    <div>
                      <h4 className="text-sm font-black text-slate-900">{doc.name} {!doc.isActive && <span className="text-rose-600 text-[10px]">Inactive</span>}</h4>
                      <p className="text-xs text-indigo-700 font-bold">{doc.specialization}</p>
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-indigo-50 text-indigo-800 border border-indigo-200">
                      Live Tallies
                    </span>
                  </div>

                  {/* Card Body: 2-Column Key-Value Grid */}
                  <div className="grid grid-cols-2 gap-x-4 gap-y-2.5 text-xs">
                    <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                        Today Consultations
                      </span>
                      <span className="text-base font-black text-slate-900 font-mono mt-0.5 block">
                        {doc.metrics.daily}
                      </span>
                    </div>

                    <div className="p-2.5 bg-indigo-50/60 rounded-xl border border-indigo-100">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-700 block">
                        Past 7 Days
                      </span>
                      <span className="text-base font-black text-indigo-900 font-mono mt-0.5 block">
                        {doc.metrics.weekly}
                      </span>
                    </div>

                    <div className="p-2.5 bg-emerald-50/60 rounded-xl border border-emerald-100">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 block">
                        Yearly ({new Date().getFullYear()})
                      </span>
                      <span className="text-base font-black text-emerald-900 font-mono mt-0.5 block">
                        {doc.metrics.yearly}
                      </span>
                    </div>

                    <div className="p-2.5 bg-amber-50/60 rounded-xl border border-amber-100">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 block">
                        Today Tokens
                      </span>
                      <span className="text-base font-black text-amber-900 font-mono mt-0.5 block">
                        {doc.metrics.todayTokens}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* SUB-TAB 4: DYNAMIC PAYROLL */}
      {/* ========================================================= */}
      {subTab === "payroll" && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-black text-slate-900">Doctor Compensation &amp; Dynamic Payroll</h3>
              <p className="text-xs text-slate-500">
                Automated compensation based on base pay, working days, and per-patient incentive bonuses
              </p>
            </div>

            <div className="flex items-center gap-2">
              <label className="text-xs font-bold text-slate-600">Month:</label>
              <select
                value={payrollMonth}
                onChange={(e) => setPayrollMonth(Number(e.target.value))}
                className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800"
              >
                {[
                  "January", "February", "March", "April", "May", "June",
                  "July", "August", "September", "October", "November", "December"
                ].map((mName, idx) => (
                  <option key={idx + 1} value={idx + 1}>
                    {mName}
                  </option>
                ))}
              </select>

              <select
                value={payrollYear}
                onChange={(e) => setPayrollYear(Number(e.target.value))}
                className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800"
              >
                {[2024, 2025, 2026, 2027].map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
            {/* Desktop & Tablet View: Structured Horizontal Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200 whitespace-nowrap">
                    <th className="px-5 py-3.5">Doctor</th>
                    <th className="px-5 py-3.5">Working Days</th>
                    <th className="px-5 py-3.5">Base Salary</th>
                    <th className="px-5 py-3.5">Consultation Bonus</th>
                    <th className="px-5 py-3.5">Adjustments</th>
                    <th className="px-5 py-3.5">Net Pay (PKR)</th>
                    <th className="px-5 py-3.5">Status</th>
                    <th className="px-5 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {payrolls.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50/60 font-medium">
                      <td className="px-5 py-3.5 whitespace-nowrap">
                        <span className="font-bold text-slate-900 block">{p.doctor?.name} {p.doctor?.isActive === false && <span className="text-rose-600 text-[10px]">Inactive</span>}</span>
                        <span className="text-[10px] text-slate-400">{p.doctor?.specialization}</span>
                      </td>
                      <td className="px-5 py-3.5 font-mono text-slate-700 whitespace-nowrap">
                        {p.workingDays} days
                      </td>
                      <td className="px-5 py-3.5 font-mono text-slate-900 font-bold whitespace-nowrap">
                        Rs. {Number(p.basePay).toLocaleString()}
                      </td>
                      <td className="px-5 py-3.5 font-mono text-emerald-700 whitespace-nowrap">
                        + Rs. {Number(p.bonuses).toLocaleString()}
                        <span className="block text-[10px] text-slate-400">({p.totalVisits} visits)</span>
                      </td>
                      <td className="px-5 py-3.5 font-mono text-rose-700 whitespace-nowrap">
                        - Rs. {Number(p.deductions).toLocaleString()}
                      </td>
                      <td className="px-5 py-3.5 font-mono font-black text-sm text-slate-900 whitespace-nowrap">
                        Rs. {Number(p.netPay).toLocaleString()}
                      </td>
                      <td className="px-5 py-3.5 whitespace-nowrap">
                        <span
                          className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${
                            p.status === "PAID"
                              ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                              : "bg-amber-100 text-amber-800 border border-amber-300"
                          }`}
                        >
                          {p.status}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-right whitespace-nowrap">
                        <button
                          onClick={() => openAdjustPayroll(p)}
                          className="px-3 py-1 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 text-slate-700 rounded-lg text-xs font-bold transition-colors"
                        >
                          {p.status === "PAID" ? "View Payslip" : "Adjust Pay"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile View: Vertical Stacked Key-Value Cards */}
            <div className="block md:hidden p-3.5 space-y-3 bg-slate-50/50">
              {payrolls.map((p) => (
                <div
                  key={p.id}
                  className="bg-white rounded-xl p-4 border border-slate-200/90 shadow-2xs space-y-3"
                >
                  {/* Card Header */}
                  <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-2.5">
                    <div>
                      <h4 className="text-sm font-black text-slate-900">{p.doctor?.name} {p.doctor?.isActive === false && <span className="text-rose-600 text-[10px]">Inactive</span>}</h4>
                      <p className="text-xs text-indigo-700 font-bold">{p.doctor?.specialization}</p>
                    </div>
                    <span
                      className={`text-[9px] font-black uppercase px-2.5 py-0.5 rounded-full ${
                        p.status === "PAID"
                          ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                          : "bg-amber-100 text-amber-800 border border-amber-300"
                      }`}
                    >
                      {p.status}
                    </span>
                  </div>

                  {/* Card Body: 2-Column Key-Value Grid */}
                  <div className="grid grid-cols-2 gap-x-4 gap-y-2.5 text-xs">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                        Working Days
                      </span>
                      <span className="font-mono font-bold text-slate-800 text-[11px]">
                        {p.workingDays} days
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                        Base Salary
                      </span>
                      <span className="font-mono font-bold text-slate-900 text-[11px]">
                        Rs. {Number(p.basePay).toLocaleString()}
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 block">
                        Patient Bonus
                      </span>
                      <span className="font-mono font-bold text-emerald-700 text-[11px]">
                        + Rs. {Number(p.bonuses).toLocaleString()}
                        <span className="text-[10px] text-slate-400 block">({p.totalVisits} visits)</span>
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-rose-700 block">
                        Adjustments / Deductions
                      </span>
                      <span className="font-mono font-bold text-rose-700 text-[11px]">
                        - Rs. {Number(p.deductions).toLocaleString()}
                      </span>
                    </div>

                    <div className="col-span-2 p-2.5 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between">
                      <span className="text-xs font-black uppercase tracking-wider text-slate-600">
                        Net Calculated Pay
                      </span>
                      <span className="text-base font-black text-slate-950 font-mono">
                        Rs. {Number(p.netPay).toLocaleString()}
                      </span>
                    </div>
                  </div>

                  {/* Card Footer: Interactive Actions */}
                  <div className="pt-2 border-t border-slate-100">
                    <button
                      onClick={() => openAdjustPayroll(p)}
                      className="w-full py-2 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 text-slate-800 border border-slate-200 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 min-h-[40px]"
                    >
                      <DollarSign className="w-3.5 h-3.5 text-indigo-600" />
                      <span>{p.status === "PAID" ? "View Payslip" : "Adjust Pay & Bonuses"}</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: ADD / EDIT DOCTOR */}
      {/* ========================================================= */}
      {showDoctorModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-sm font-black text-slate-900">
                {editingDoctor ? "Edit Doctor Profile" : "Add New Doctor"}
              </h3>
              <button onClick={() => setShowDoctorModal(false)} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveDoctor} className="p-5 space-y-3.5 text-xs overflow-y-auto">
              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Doctor Full Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Dr. Ayesha Khan"
                  value={doctorForm.name}
                  onChange={(e) => setDoctorForm({ ...doctorForm, name: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 font-bold"
                />
                {doctorErrors.name && <p className="text-[10px] text-rose-600 mt-1">{doctorErrors.name[0]}</p>}
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Specialization / Department *</label>
                <input
                  type="text"
                  placeholder="e.g. Consultant Sonologist, General Physician, Gynecologist"
                  value={doctorForm.specialization}
                  onChange={(e) => setDoctorForm({ ...doctorForm, specialization: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 font-bold"
                />
                {doctorErrors.specialization && (
                  <p className="text-[10px] text-rose-600 mt-1">{doctorErrors.specialization[0]}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Phone Number</label>
                  <input
                    type="text"
                    placeholder="0300-1234567"
                    value={doctorForm.phone}
                    onChange={(e) => setDoctorForm({ ...doctorForm, phone: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Email</label>
                  <input
                    type="email"
                    placeholder="doctor@ruqayya.com"
                    value={doctorForm.email}
                    onChange={(e) => setDoctorForm({ ...doctorForm, email: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Base Salary (PKR) *</label>
                  <input
                    type="number"
                    value={doctorForm.baseSalary}
                    onChange={(e) => setDoctorForm({ ...doctorForm, baseSalary: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Incentive / Patient (PKR)</label>
                  <input
                    type="number"
                    value={doctorForm.perPatientShare}
                    onChange={(e) => setDoctorForm({ ...doctorForm, perPatientShare: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold"
                  />
                </div>
              </div>

              <div className="rounded-xl border border-indigo-200 bg-indigo-50/40 p-3 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <div className="font-extrabold text-slate-800">Monthly Attendance Penalty Policy</div>
                    <p className="text-[10px] text-slate-500">Each month's allowances start fresh. Paid payrolls remain finalized.</p>
                  </div>
                  <label className="flex items-center gap-2 font-semibold">
                    <input type="checkbox" checked={penaltyPolicy.enabled} onChange={e => setPenaltyPolicy({...penaltyPolicy,enabled:e.target.checked})}/>
                    Enable
                  </label>
                </div>
                <div className="grid gap-2">
                  {penaltyKeys.map(key => (
                    <div key={key} className="grid grid-cols-[1fr_1fr_1fr] sm:grid-cols-[1fr_1fr_1fr_1fr] gap-2 rounded-lg bg-white border border-slate-200 p-2 items-end">
                      <div className="font-extrabold self-center">{key.replace("_"," ")}</div>
                      <label className="text-[10px] font-semibold text-slate-600">Free days
                        <input aria-label={key+" free days"} type="number" min="0" max="31" value={penaltyPolicy[key].allowance} onChange={e=>setPenaltyPolicy({...penaltyPolicy,[key]:{...penaltyPolicy[key],allowance:Number(e.target.value)}})} className="block w-full border rounded-md p-1.5"/>
                      </label>
                      <label className="text-[10px] font-semibold text-slate-600">Deduction type
                        <select aria-label={key+" deduction type"} value={penaltyPolicy[key].mode} onChange={e=>setPenaltyPolicy({...penaltyPolicy,[key]:{...penaltyPolicy[key],mode:e.target.value as "FIXED"|"PERCENT"}})} className="block w-full border rounded-md p-1.5">
                          <option value="FIXED">PKR</option><option value="PERCENT">% Base Pay</option>
                        </select>
                      </label>
                      <label className="text-[10px] font-semibold text-slate-600">Per extra day
                        <input aria-label={key+" deduction amount"} type="number" min="0" step="0.01" value={penaltyPolicy[key].amount} onChange={e=>setPenaltyPolicy({...penaltyPolicy,[key]:{...penaltyPolicy[key],amount:Number(e.target.value)}})} className="block w-full border rounded-md p-1.5"/>
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="doctorActiveCheck"
                  checked={doctorForm.isActive}
                  onChange={(e) => setDoctorForm({ ...doctorForm, isActive: e.target.checked })}
                  className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300"
                />
                <label htmlFor="doctorActiveCheck" className="text-xs text-slate-700 font-semibold cursor-pointer">
                  Active (Selectable in Receptionist Token Generation Dropdown)
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowDoctorModal(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-600 font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingDoctor}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl"
                >
                  {savingDoctor ? "Saving..." : editingDoctor ? "Update Doctor" : "Create Doctor"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: RECORD LEAVE */}
      {/* ========================================================= */}
      {showLeaveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-sm font-black text-slate-900">Record Doctor Leave</h3>
              <button onClick={() => setShowLeaveModal(false)} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveLeave} className="p-5 space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Doctor *</label>
                <select
                  value={leaveForm.doctorId}
                  onChange={(e) => setLeaveForm({ ...leaveForm, doctorId: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                >
                  <option value="">-- Choose Doctor --</option>
                  {doctors.filter((d) => d.isActive).map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name} · {d.specialization}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Start Date</label>
                  <input
                    type="date"
                    value={leaveForm.startDate}
                    onChange={(e) => setLeaveForm({ ...leaveForm, startDate: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">End Date</label>
                  <input
                    type="date"
                    value={leaveForm.endDate}
                    onChange={(e) => setLeaveForm({ ...leaveForm, endDate: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Reason *</label>
                <input
                  type="text"
                  placeholder="e.g. Annual leave, Medical conference, Personal"
                  value={leaveForm.reason}
                  onChange={(e) => setLeaveForm({ ...leaveForm, reason: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowLeaveModal(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-600 font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl"
                >
                  Save Leave
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: ADJUST PAYROLL */}
      {/* ========================================================= */}
      {editingPayroll && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-black text-slate-900">
                  {payrollIsPaid ? "Finalized Payroll" : "Adjust Payroll"} for {editingPayroll.doctor?.name}
                </h3>
                <p className="text-xs text-slate-500">
                  Period: {payrollMonth}/{payrollYear} · Consultations: {editingPayroll.totalVisits}
                </p>
              </div>
              <button onClick={() => setEditingPayroll(null)} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSavePayrollAdjust} className="p-5 space-y-3.5 text-xs overflow-y-auto">
              <fieldset disabled={payrollIsPaid} className="space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Base Pay (PKR)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={payrollForm.basePay}
                    onChange={(e) => setPayrollForm({ ...payrollForm, basePay: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Working Days</label>
                  <input
                    type="number"
                    value={payrollForm.workingDays}
                    onChange={(e) => setPayrollForm({ ...payrollForm, workingDays: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Bonuses / Incentives (PKR)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={payrollForm.bonuses}
                    onChange={(e) => setPayrollForm({ ...payrollForm, bonuses: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold text-emerald-700"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">{payrollIsPaid && !savedBreakdown ? "Recorded Deductions (PKR)" : "Manual Deductions (PKR)"}</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={payrollForm.deductions}
                    onChange={(e) => setPayrollForm({ ...payrollForm, deductions: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold text-rose-700"
                  />
                </div>
              </div>

              <DoctorPayrollDeductionDetails breakdown={payrollBreakdown} total={automaticDeductions} />
              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Payment Status</label>
                <select
                  value={payrollForm.status}
                  onChange={(e) => setPayrollForm({ ...payrollForm, status: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                >
                  <option value="DRAFT">DRAFT (Pending Disbursal)</option>
                  <option value="PAID">PAID (Disbursed &amp; Finalized)</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Notes / Remarks</label>
                <input
                  type="text"
                  placeholder="e.g. Disbursed via Bank Transfer / Raast"
                  value={payrollForm.notes}
                  onChange={(e) => setPayrollForm({ ...payrollForm, notes: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs font-mono font-black">
                <span>Net Pay</span>
                <span className="text-sm text-indigo-700">
                  {formatPayrollAmount(payrollIsPaid ? editingPayroll.netPay : previewNetPay)}
                </span>
              </div>
              </fieldset>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingPayroll(null)}
                  className="px-4 py-2 bg-slate-100 text-slate-600 font-bold rounded-xl"
                >
                  {payrollIsPaid ? "Close" : "Cancel"}
                </button>
                {payrollIsPaid ? (
                  <a
                    href={"/admin/doctors/payroll/" + encodeURIComponent(editingPayroll.id) + "/print"}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl"
                  >
                    <Printer className="w-4 h-4" />
                    Print Payslip
                  </a>
                ) : (
                  <button
                    type="submit"
                    disabled={savingPayroll}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl"
                  >
                    {savingPayroll ? "Saving..." : payrollForm.status === "PAID" ? "Finalize Payroll" : "Save Adjustments"}
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: CONFIRM ATTENDANCE RECORDING (SHADCN / TAILWIND) */}
      {/* ========================================================= */}
      {showAttendanceConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200/80 space-y-5 animate-in zoom-in-95">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
                <ShieldAlert className="w-6 h-6 text-amber-700" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-slate-900">
                  Confirm &amp; Finalize Attendance
                </h3>
                <p className="text-xs text-slate-500">
                  Ruqayya Medical Center &bull; Duty Log for {attendanceDate}
                </p>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
              <p className="text-xs font-semibold text-slate-800">
                Are you sure you want to save and finalize this attendance record?
              </p>

              {/* Doctors Summary List */}
              <div className="max-h-48 overflow-y-auto divide-y divide-slate-200/70 border-t border-b border-slate-200 py-1">
                {(() => {
                  const toConfirm = attendanceTargetDoctor
                    ? [attendanceTargetDoctor]
                    : doctors
                        .filter((d) => !attendanceList.find((a) => a.doctorId === d.id))
                        .map((d) => ({
                          id: d.id,
                          name: d.name,
                          status: stagedAttendance[d.id] || "PRESENT",
                        }));

                  if (toConfirm.length === 0) {
                    return (
                      <div className="py-3 text-center text-xs text-slate-400">
                        No doctors pending attendance.
                      </div>
                    );
                  }

                  return toConfirm.map((doc) => (
                    <div key={doc.id} className="py-2 flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-900">{doc.name}</span>
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase border ${
                          doc.status === "PRESENT"
                            ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                            : doc.status === "HALF_DAY"
                            ? "bg-indigo-100 text-indigo-800 border-indigo-300"
                            : doc.status === "LEAVE"
                            ? "bg-amber-100 text-amber-800 border-amber-300"
                            : "bg-rose-100 text-rose-800 border-rose-300"
                        }`}
                      >
                        {doc.status.replace("_", " ")}
                      </span>
                    </div>
                  ));
                })()}
              </div>

              {/* Audit Warning */}
              <div className="p-2.5 bg-amber-100/70 border border-amber-300/80 rounded-xl text-[11px] text-amber-950 font-medium flex items-start gap-2">
                <Lock className="w-3.5 h-3.5 text-amber-800 shrink-0 mt-0.5" />
                <span>
                  <strong>Audit Policy:</strong> Once saved, this attendance record becomes <strong>permanently locked</strong> in PostgreSQL and cannot be altered or overwritten.
                </span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setShowAttendanceConfirmModal(false);
                  setAttendanceTargetDoctor(null);
                }}
                disabled={markingAttendance}
                className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 text-xs font-bold transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={executeConfirmSaveAttendance}
                disabled={markingAttendance}
                className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-extrabold flex items-center gap-2 shadow-sm disabled:opacity-50 transition-colors"
              >
                {markingAttendance ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Saving to Database...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4 text-emerald-400" />
                    <span>Yes, Save &amp; Finalize</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

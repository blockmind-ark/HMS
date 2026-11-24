"use client";

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
  const [doctorErrors, setDoctorErrors] = useState<any>({});
  const [savingDoctor, setSavingDoctor] = useState(false);

  // Modals - Attendance
  const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().split("T")[0]);
  const [attendanceList, setAttendanceList] = useState<any[]>([]);
  const [loadingAttendance, setLoadingAttendance] = useState(false);
  const [markingAttendance, setMarkingAttendance] = useState(false);

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
    setDoctorErrors({});
    setShowDoctorModal(true);
  };

  const openEditDoctor = (doc: any) => {
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
      fetchDoctors();
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
        fetchDoctors();
      }
    } catch (e: any) {
      setFeedback({ type: "error", message: e.message });
    }
  };

  // -------------------------------------------------------------
  // Attendance Handler
  // -------------------------------------------------------------
  const handleMarkAttendance = async (doctorId: string, status: string) => {
    setMarkingAttendance(true);
    try {
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
      const data = await res.json();
      if (res.ok) {
        setFeedback({ type: "success", message: data.message || "Attendance updated." });
        fetchAttendance(attendanceDate);
      } else {
        throw new Error(data.error || "Failed to mark attendance");
      }
    } catch (e: any) {
      setFeedback({ type: "error", message: e.message });
    } finally {
      setMarkingAttendance(false);
    }
  };

  // -------------------------------------------------------------
  // Leave Handler
  // -------------------------------------------------------------
  const handleSaveLeave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!leaveForm.doctorId) {
      alert("Please choose a doctor.");
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
  const openAdjustPayroll = (p: any) => {
    setEditingPayroll(p);
    setPayrollForm({
      basePay: String(p.basePay),
      workingDays: String(p.workingDays),
      bonuses: String(p.bonuses),
      deductions: String(p.deductions),
      status: p.status || "DRAFT",
      notes: p.notes || "",
    });
  };

  const handleSavePayrollAdjust = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPayroll) return;

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
          deductions: Number(payrollForm.deductions),
          status: payrollForm.status,
          notes: payrollForm.notes,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setFeedback({ type: "success", message: data.message || "Payroll record updated." });
        setEditingPayroll(null);
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

      {/* Sub-Tab Navigation Bar */}
      <div className="flex items-center gap-2 bg-white p-1.5 rounded-2xl border border-slate-200/80 shadow-sm overflow-x-auto">
        <button
          onClick={() => setSubTab("directory")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
            subTab === "directory"
              ? "bg-indigo-600 text-white shadow-md shadow-indigo-500/20"
              : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          <Briefcase className="w-4 h-4" />
          <span>Doctor Directory &amp; Terms ({doctors.length})</span>
        </button>

        <button
          onClick={() => setSubTab("attendance")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
            subTab === "attendance"
              ? "bg-indigo-600 text-white shadow-md shadow-indigo-500/20"
              : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>Attendance &amp; Leaves</span>
        </button>

        <button
          onClick={() => setSubTab("analytics")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
            subTab === "analytics"
              ? "bg-indigo-600 text-white shadow-md shadow-indigo-500/20"
              : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          <span>Patient Visit Metrics (D / W / Y)</span>
        </button>

        <button
          onClick={() => setSubTab("payroll")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
            subTab === "payroll"
              ? "bg-indigo-600 text-white shadow-md shadow-indigo-500/20"
              : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          <DollarSign className="w-4 h-4" />
          <span>Dynamic Payroll &amp; Bonuses</span>
        </button>
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
                      <h4 className="text-sm font-black text-slate-900">{doc.name}</h4>
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

          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200">
                    <th className="px-5 py-3.5">Doctor</th>
                    <th className="px-5 py-3.5">Specialization</th>
                    <th className="px-5 py-3.5">Status on {attendanceDate}</th>
                    <th className="px-5 py-3.5">Mark Attendance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {doctors.map((doc) => {
                    const rec = attendanceList.find((a) => a.doctorId === doc.id);
                    const status = rec?.status || "NOT_MARKED";
                    return (
                      <tr key={doc.id} className="hover:bg-slate-50/60">
                        <td className="px-5 py-3.5 font-bold text-slate-900">{doc.name}</td>
                        <td className="px-5 py-3.5 text-slate-500">{doc.specialization}</td>
                        <td className="px-5 py-3.5">
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
                        </td>
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <button
                              onClick={() => handleMarkAttendance(doc.id, "PRESENT")}
                              disabled={markingAttendance}
                              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-colors ${
                                status === "PRESENT"
                                  ? "bg-emerald-600 text-white border-emerald-700"
                                  : "bg-white text-emerald-700 border-emerald-200 hover:bg-emerald-50"
                              }`}
                            >
                              Present
                            </button>
                            <button
                              onClick={() => handleMarkAttendance(doc.id, "HALF_DAY")}
                              disabled={markingAttendance}
                              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-colors ${
                                status === "HALF_DAY"
                                  ? "bg-indigo-600 text-white border-indigo-700"
                                  : "bg-white text-indigo-700 border-indigo-200 hover:bg-indigo-50"
                              }`}
                            >
                              Half-Day
                            </button>
                            <button
                              onClick={() => handleMarkAttendance(doc.id, "LEAVE")}
                              disabled={markingAttendance}
                              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-colors ${
                                status === "LEAVE"
                                  ? "bg-amber-600 text-white border-amber-700"
                                  : "bg-white text-amber-700 border-amber-200 hover:bg-amber-50"
                              }`}
                            >
                              Leave
                            </button>
                            <button
                              onClick={() => handleMarkAttendance(doc.id, "ABSENT")}
                              disabled={markingAttendance}
                              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-colors ${
                                status === "ABSENT"
                                  ? "bg-rose-600 text-white border-rose-700"
                                  : "bg-white text-rose-700 border-rose-200 hover:bg-rose-50"
                              }`}
                            >
                              Absent
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
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

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200">
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
                      <td className="px-5 py-3.5 font-bold text-slate-900">{doc.name}</td>
                      <td className="px-5 py-3.5 text-slate-500">{doc.specialization}</td>
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
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200">
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
                      <td className="px-5 py-3.5">
                        <span className="font-bold text-slate-900 block">{p.doctor?.name}</span>
                        <span className="text-[10px] text-slate-400">{p.doctor?.specialization}</span>
                      </td>
                      <td className="px-5 py-3.5 font-mono text-slate-700">
                        {p.workingDays} days
                      </td>
                      <td className="px-5 py-3.5 font-mono text-slate-900 font-bold">
                        Rs. {Number(p.basePay).toLocaleString()}
                      </td>
                      <td className="px-5 py-3.5 font-mono text-emerald-700">
                        + Rs. {Number(p.bonuses).toLocaleString()}
                        <span className="block text-[10px] text-slate-400">({p.totalVisits} visits)</span>
                      </td>
                      <td className="px-5 py-3.5 font-mono text-rose-700">
                        - Rs. {Number(p.deductions).toLocaleString()}
                      </td>
                      <td className="px-5 py-3.5 font-mono font-black text-sm text-slate-900">
                        Rs. {Number(p.netPay).toLocaleString()}
                      </td>
                      <td className="px-5 py-3.5">
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
                      <td className="px-5 py-3.5 text-right">
                        <button
                          onClick={() => openAdjustPayroll(p)}
                          className="px-3 py-1 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 text-slate-700 rounded-lg text-xs font-bold transition-colors"
                        >
                          Adjust Pay
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: ADD / EDIT DOCTOR */}
      {/* ========================================================= */}
      {showDoctorModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-sm font-black text-slate-900">
                {editingDoctor ? "Edit Doctor Profile" : "Add New Doctor"}
              </h3>
              <button onClick={() => setShowDoctorModal(false)} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveDoctor} className="p-5 space-y-3.5 text-xs">
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
                  {doctors.map((d) => (
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
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-black text-slate-900">
                  Adjust Payroll: {editingPayroll.doctor?.name}
                </h3>
                <p className="text-xs text-slate-500">
                  Period: {payrollMonth}/{payrollYear} · Consultations: {editingPayroll.totalVisits}
                </p>
              </div>
              <button onClick={() => setEditingPayroll(null)} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSavePayrollAdjust} className="p-5 space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Base Pay (PKR)</label>
                  <input
                    type="number"
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
                    value={payrollForm.bonuses}
                    onChange={(e) => setPayrollForm({ ...payrollForm, bonuses: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold text-emerald-700"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Deductions (PKR)</label>
                  <input
                    type="number"
                    value={payrollForm.deductions}
                    onChange={(e) => setPayrollForm({ ...payrollForm, deductions: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold text-rose-700"
                  />
                </div>
              </div>

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
                <span>Calculated Net Pay:</span>
                <span className="text-sm text-indigo-700">
                  Rs. {(Number(payrollForm.basePay) + Number(payrollForm.bonuses) - Number(payrollForm.deductions)).toLocaleString()}
                </span>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingPayroll(null)}
                  className="px-4 py-2 bg-slate-100 text-slate-600 font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingPayroll}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl"
                >
                  {savingPayroll ? "Saving..." : "Save Adjustments"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

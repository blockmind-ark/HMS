"use client";

import React, { useState, useEffect } from "react";
import {
  Banknote,
  CalendarCheck,
  Calendar,
  Clock,
  TrendingUp,
  UserCheck,
  CheckCircle2,
  AlertCircle,
  XCircle,
  FileText,
  RefreshCw,
  Award,
  Activity,
  Stethoscope,
  Briefcase,
  Users,
  Lock,
} from "lucide-react";

export function DoctorSelfServicePayrollView() {
  const [profile, setProfile] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProfile = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/doctor/profile");
      if (res.ok) {
        const data = await res.json();
        setProfile(data.doctor);
      } else {
        const err = await res.json();
        setError(err.error || "Failed to load doctor profile.");
      }
    } catch (e: any) {
      setError(e?.message || "Network error loading doctor profile.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  if (loading) {
    return (
      <div className="bg-white p-12 rounded-2xl border border-slate-200/80 shadow-sm text-center space-y-3">
        <RefreshCw className="w-8 h-8 text-teal-600 animate-spin mx-auto" />
        <h4 className="text-sm font-bold text-slate-800">Loading Doctor Profile &amp; Compensation...</h4>
        <p className="text-xs text-slate-500">Fetching attendance logs, consultation metrics, and dynamic payroll.</p>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="bg-white p-8 rounded-2xl border border-rose-200 shadow-sm text-center space-y-4">
        <AlertCircle className="w-10 h-10 text-rose-500 mx-auto" />
        <div>
          <h4 className="text-sm font-bold text-slate-900">Doctor Profile Not Linked</h4>
          <p className="text-xs text-slate-600 mt-1 max-w-md mx-auto">
            {error || "Your user account is not associated with an active Doctor Profile in the system. Please contact the clinic administrator."}
          </p>
        </div>
        <button
          onClick={fetchProfile}
          className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  const currentPay = profile.currentPayroll || {
    basePay: profile.baseSalary || 0,
    bonuses: (profile.thisMonthVisits || 0) * (profile.perPatientShare || 0),
    deductions: 0,
    netPay: (profile.baseSalary || 0) + (profile.thisMonthVisits || 0) * (profile.perPatientShare || 0),
    workingDays: profile.workingDaysCount || 0,
    status: "ESTIMATED",
  };

  return (
    <div className="space-y-6">
      {/* Top Banner: Doctor Info & Quick Refresh */}
      <div className="bg-gradient-to-r from-teal-900 via-slate-900 to-indigo-950 p-6 rounded-3xl text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-teal-500/20 border border-teal-400/30 flex items-center justify-center text-teal-300 font-black text-xl shadow-inner">
            <Stethoscope className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-black tracking-tight">{profile.name}</h2>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-teal-500/30 text-teal-200 border border-teal-400/40">
                {profile.specialization}
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-0.5">
              Ruqayya Medical Center &bull; Pay Structure:{" "}
              <span className="text-teal-300 font-bold uppercase">{profile.payType}</span>
              {profile.phone && ` \u2022 ${profile.phone}`}
            </p>
          </div>
        </div>

        <button
          onClick={fetchProfile}
          className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-2xl text-xs font-bold flex items-center gap-2 border border-white/10 backdrop-blur-sm transition-all"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh Records</span>
        </button>
      </div>

      {/* KPI Cards: Dynamic Pay & Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Estimated / Current Net Pay */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              This Month Net Pay
            </span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
              <Banknote className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-slate-900 tracking-tight">
              Rs. {Number(currentPay.netPay).toLocaleString("en-PK")}
            </div>
            <div className="flex items-center gap-1.5 mt-1 text-[11px] font-bold text-slate-500">
              <span className="text-emerald-700 font-extrabold">
                Rs. {Number(currentPay.basePay).toLocaleString("en-PK")} Base
              </span>
              <span>+</span>
              <span className="text-teal-700 font-extrabold">
                Rs. {Number(currentPay.bonuses).toLocaleString("en-PK")} Bonuses
              </span>
            </div>
          </div>
        </div>

        {/* Working Days */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Working Days Logged
            </span>
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center font-bold">
              <CalendarCheck className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-slate-900 tracking-tight">
              {profile.workingDaysCount}{" "}
              <span className="text-sm font-semibold text-slate-400">days</span>
            </div>
            <p className="text-[11px] text-slate-500 font-medium mt-1">
              Active duty &amp; half-day attendances this month
            </p>
          </div>
        </div>

        {/* Patient Visits Conducted */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Patient Consultations
            </span>
            <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center font-bold">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-slate-900 tracking-tight">
              {profile.thisMonthVisits}{" "}
              <span className="text-sm font-semibold text-slate-400">this month</span>
            </div>
            <p className="text-[11px] text-slate-500 font-medium mt-1">
              Total career visits:{" "}
              <span className="font-bold text-slate-700">{profile.totalPatientVisits}</span>
            </p>
          </div>
        </div>

        {/* Consultation Share Rate */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Per-Patient Share
            </span>
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center font-bold">
              <Award className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-slate-900 tracking-tight">
              Rs. {Number(profile.perPatientShare || 0).toLocaleString("en-PK")}
            </div>
            <p className="text-[11px] text-slate-500 font-medium mt-1">
              Automatic dynamic consultation incentive
            </p>
          </div>
        </div>
      </div>

      {/* Main Two-Column View: Left Attendance & Leaves | Right Payroll Records */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Attendance History (7 Cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Attendance Log Card */}
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-teal-600" />
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">
                  Recent Attendance Logs (Last 30 Days)
                </h3>
              </div>
              <span className="text-[11px] font-bold text-slate-400">
                {profile.recentAttendance?.length || 0} Records
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/70 border-b border-slate-100 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="px-5 py-3">Date</th>
                    <th className="px-4 py-3">Duty Status</th>
                    <th className="px-4 py-3">Notes &amp; Duty Shift</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {profile.recentAttendance && profile.recentAttendance.length > 0 ? (
                    profile.recentAttendance.map((att: any) => {
                      const badgeClasses =
                        att.status === "PRESENT"
                          ? "bg-emerald-100 text-emerald-800 border-emerald-200"
                          : att.status === "HALF_DAY"
                          ? "bg-amber-100 text-amber-800 border-amber-200"
                          : att.status === "LEAVE"
                          ? "bg-indigo-100 text-indigo-800 border-indigo-200"
                          : "bg-rose-100 text-rose-800 border-rose-200";

                      return (
                        <tr key={att.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-5 py-3.5 font-mono font-bold text-slate-800 whitespace-nowrap">
                            {att.dateStr}
                          </td>
                          <td className="px-4 py-3.5">
                            <div className="flex items-center gap-1.5">
                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase border ${badgeClasses}`}
                              >
                                {att.status.replace("_", " ")}
                              </span>
                              <span className="flex items-center gap-0.5 text-[9px] font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                                <Lock className="w-2.5 h-2.5 text-slate-400" />
                                <span>Locked</span>
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-3.5 text-slate-600">
                            {att.notes || <span className="text-slate-400 italic">Regular shift</span>}
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={3} className="px-5 py-8 text-center text-slate-400 text-xs">
                        No recent attendance records logged yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Leave Records Card */}
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-indigo-600" />
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">
                  Leave &amp; Time-Off History
                </h3>
              </div>
              <span className="text-[11px] font-bold text-slate-400">
                {profile.recentLeaves?.length || 0} Registered
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/70 border-b border-slate-100 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="px-5 py-3">Duration</th>
                    <th className="px-4 py-3">Reason</th>
                    <th className="px-4 py-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {profile.recentLeaves && profile.recentLeaves.length > 0 ? (
                    profile.recentLeaves.map((lv: any) => {
                      const start = new Date(lv.startDate).toLocaleDateString("en-PK", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      });
                      const end = new Date(lv.endDate).toLocaleDateString("en-PK", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      });
                      const statusBadge =
                        lv.status === "APPROVED"
                          ? "bg-emerald-100 text-emerald-800 border-emerald-200"
                          : lv.status === "PENDING"
                          ? "bg-amber-100 text-amber-800 border-amber-200"
                          : "bg-rose-100 text-rose-800 border-rose-200";

                      return (
                        <tr key={lv.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-5 py-3 font-semibold text-slate-800 whitespace-nowrap">
                            {start} &rarr; {end}
                          </td>
                          <td className="px-4 py-3 text-slate-600 font-medium">{lv.reason}</td>
                          <td className="px-4 py-3">
                            <span
                              className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase border ${statusBadge}`}
                            >
                              {lv.status}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={3} className="px-5 py-8 text-center text-slate-400 text-xs">
                        No leave records registered.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Column: Historical Payroll Slips (5 Cols) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-purple-600" />
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">
                  Dynamic Payroll Statements
                </h3>
              </div>
              <span className="text-[11px] font-bold text-slate-400">Monthly</span>
            </div>

            <div className="p-5 space-y-4">
              {profile.payrollHistory && profile.payrollHistory.length > 0 ? (
                profile.payrollHistory.map((pay: any) => {
                  const monthNames = [
                    "January", "February", "March", "April", "May", "June",
                    "July", "August", "September", "October", "November", "December",
                  ];
                  const monthLabel = `${monthNames[pay.month - 1]} ${pay.year}`;

                  return (
                    <div
                      key={pay.id}
                      className="p-4 rounded-2xl border border-slate-200/80 bg-slate-50/60 hover:bg-slate-50 hover:border-slate-300 transition-all space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-black text-slate-900 text-xs">{monthLabel}</span>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                            pay.status === "PAID"
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-amber-100 text-amber-800"
                          }`}
                        >
                          {pay.status}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-[11px] pt-1">
                        <div>
                          <span className="text-slate-400">Working Days:</span>{" "}
                          <span className="font-bold text-slate-700">{pay.workingDays}</span>
                        </div>
                        <div>
                          <span className="text-slate-400">Base Salary:</span>{" "}
                          <span className="font-bold text-slate-700">
                            Rs. {Number(pay.basePay).toLocaleString("en-PK")}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-400">Bonuses/Share:</span>{" "}
                          <span className="font-bold text-emerald-700">
                            +Rs. {Number(pay.bonuses).toLocaleString("en-PK")}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-400">Deductions:</span>{" "}
                          <span className="font-bold text-rose-600">
                            -Rs. {Number(pay.deductions).toLocaleString("en-PK")}
                          </span>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-slate-200/70 flex items-center justify-between">
                        <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                          Net Disbursed Pay
                        </span>
                        <span className="text-sm font-black text-slate-900">
                          Rs. {Number(pay.netPay).toLocaleString("en-PK")}
                        </span>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="py-8 text-center text-slate-400 text-xs space-y-1">
                  <p className="font-bold text-slate-600">No past payroll records closed.</p>
                  <p className="text-[11px]">
                    Monthly statements are calculated and finalized by the Admin office.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

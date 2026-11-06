"use client";

import React, { useState, useEffect } from "react";
import { Navbar } from "@/components/layout/Navbar";
import {
  Search,
  User,
  Stethoscope,
  Pill,
  Receipt,
  Clock,
  Calendar,
  Printer,
  FileText,
  Activity,
  AlertCircle,
  CheckCircle2,
  Phone,
  ChevronRight,
  RefreshCw,
  Sparkles,
  ClipboardList,
  Edit3,
  Save,
  X,
  Filter,
} from "lucide-react";

export default function DoctorPortal() {
  const [patients, setPatients] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loadingPatients, setLoadingPatients] = useState(false);
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);

  // Selected Patient Dossier
  const [dossier, setDossier] = useState<any | null>(null);
  const [loadingDossier, setLoadingDossier] = useState(false);
  const [activeTab, setActiveTab] = useState<"timeline" | "visits" | "medications" | "invoices">("timeline");

  // Clinical Notes & Diagnosis Editing
  const [editingVisitId, setEditingVisitId] = useState<string | null>(null);
  const [editDiagnosis, setEditDiagnosis] = useState("");
  const [editNotes, setEditNotes] = useState("");
  const [savingNote, setSavingNote] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);

  // Fetch Patients List
  const fetchPatients = async (query = "") => {
    setLoadingPatients(true);
    try {
      const res = await fetch(`/api/doctor/patients?query=${encodeURIComponent(query)}`);
      if (res.ok) {
        const data = await res.json();
        setPatients(data.patients || []);
        // Automatically select the first patient if none is selected
        if (!selectedPatientId && data.patients?.length > 0) {
          setSelectedPatientId(data.patients[0].id);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingPatients(false);
    }
  };

  // Fetch Full Patient Dossier
  const fetchDossier = async (patientId: string) => {
    setLoadingDossier(true);
    try {
      const res = await fetch(`/api/doctor/patients/${patientId}`);
      if (res.ok) {
        const data = await res.json();
        setDossier(data.dossier);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingDossier(false);
    }
  };

  useEffect(() => {
    fetchPatients(searchQuery);
  }, [searchQuery]);

  useEffect(() => {
    if (selectedPatientId) {
      fetchDossier(selectedPatientId);
    }
  }, [selectedPatientId]);

  // Handle Save Clinical Findings
  const handleSaveVisitNotes = async (visitId: string) => {
    if (!selectedPatientId) return;
    setSavingNote(true);
    try {
      const res = await fetch(`/api/doctor/patients/${selectedPatientId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          visitId,
          diagnosis: editDiagnosis,
          notes: editNotes,
        }),
      });

      if (res.ok) {
        setNotification("Clinical diagnosis and notes saved to patient history!");
        setEditingVisitId(null);
        fetchDossier(selectedPatientId);
        setTimeout(() => setNotification(null), 4000);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSavingNote(false);
    }
  };

  const selectedPatient = dossier?.patient;

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        {/* Toast Notification */}
        {notification && (
          <div className="p-4 bg-teal-50 border border-teal-200 text-teal-900 rounded-2xl flex items-center justify-between shadow-sm animate-in fade-in duration-200">
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-5 h-5 text-teal-600 flex-shrink-0" />
              <span className="text-xs font-bold">{notification}</span>
            </div>
            <button
              onClick={() => setNotification(null)}
              className="text-teal-700 hover:text-teal-900 text-xs font-bold"
            >
              ✕
            </button>
          </div>
        )}

        {/* Portal Header (Hidden on print) */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 print:hidden">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-teal-50 text-teal-700 flex items-center justify-center font-bold shadow-sm">
                <Stethoscope className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                  <span>Doctor Consultation Portal</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-teal-100 text-teal-800 border border-teal-200">
                    Medical Dossier
                  </span>
                </h2>
                <p className="text-xs text-slate-500">
                  Search patient records, examine clinical visit history, and review medication dispensation records.
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => fetchPatients(searchQuery)}
              disabled={loadingPatients}
              className="px-3 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loadingPatients ? "animate-spin text-teal-600" : ""}`} />
              <span>Refresh Registry</span>
            </button>
            <button
              onClick={() => window.print()}
              disabled={!dossier}
              className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Medical Summary</span>
            </button>
          </div>
        </div>

        {/* Main Grid: Left Search & Patient List (4 Cols) | Right Medical History Dossier (8 Cols) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* LEFT: Search & Patient Roster (Hidden on print) */}
          <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-200/80 shadow-sm p-4 space-y-4 print:hidden">
            <div>
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 mb-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                  <Search className="w-4 h-4 text-teal-600" />
                  <span>Patient Medical Search</span>
                </h3>
                <span className="text-[10px] font-mono text-slate-400 font-bold">
                  {patients.length} found
                </span>
              </div>

              {/* Search Input */}
              <div className="relative">
                <Search className="w-4 h-4 absolute inset-y-0 left-3 my-auto text-slate-400" />
                <input
                  type="text"
                  placeholder="Search by Name, UID, Phone..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500 transition-all placeholder:text-slate-400"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute inset-y-0 right-2.5 my-auto text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Patients Scrollable Roster */}
            <div className="space-y-2 max-h-[600px] overflow-y-auto scrollbar-thin pr-1">
              {loadingPatients && patients.length === 0 ? (
                <div className="py-12 text-center text-xs text-slate-400 space-y-2">
                  <RefreshCw className="w-5 h-5 text-teal-600 animate-spin mx-auto" />
                  <p>Searching clinic database...</p>
                </div>
              ) : patients.length === 0 ? (
                <div className="py-12 text-center text-xs text-slate-400 space-y-1">
                  <p className="font-bold text-slate-600">No matching patients found</p>
                  <p className="text-[11px]">Check spelling or try patient UID (e.g. PAT-2026-0001)</p>
                </div>
              ) : (
                patients.map((patient) => {
                  const isSelected = selectedPatientId === patient.id;
                  return (
                    <button
                      key={patient.id}
                      onClick={() => setSelectedPatientId(patient.id)}
                      className={`w-full p-3 rounded-xl border text-left transition-all flex items-center justify-between gap-3 ${
                        isSelected
                          ? "bg-teal-50/80 border-teal-300 shadow-sm ring-1 ring-teal-400/30"
                          : "bg-slate-50/70 border-slate-200/80 hover:bg-slate-100 hover:border-slate-300"
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs flex-shrink-0 ${
                            isSelected
                              ? "bg-teal-600 text-white"
                              : "bg-slate-200 text-slate-700"
                          }`}
                        >
                          {patient.name
                            .split(" ")
                            .map((n: string) => n[0])
                            .slice(0, 2)
                            .join("")}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-extrabold text-slate-900 truncate">
                              {patient.name}
                            </span>
                            <span className="text-[10px] font-mono text-teal-700 font-bold">
                              {patient.gender[0]}
                            </span>
                          </div>
                          <div className="text-[10px] font-mono text-slate-500 font-semibold truncate">
                            {patient.patientUid} · {patient.age} yrs
                          </div>
                          <div className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                            <Phone className="w-2.5 h-2.5" />
                            <span>{patient.phone}</span>
                          </div>
                        </div>
                      </div>

                      <div className="text-right flex-shrink-0 space-y-1">
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase bg-slate-200 text-slate-700">
                          {patient.totalVisits} visits
                        </span>
                        <ChevronRight
                          className={`w-4 h-4 ml-auto transition-transform ${
                            isSelected ? "text-teal-600 translate-x-0.5" : "text-slate-300"
                          }`}
                        />
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* RIGHT: Selected Patient Medical History Dossier (8 Cols) */}
          <div className="lg:col-span-8 space-y-6">
            {/* Official Print Header (Visible only on window.print()) */}
            <div className="hidden print:block text-center pb-5 mb-5 border-b-2 border-slate-900 space-y-1.5">
              <h1 className="text-2xl font-black uppercase tracking-wider">
                Ruqayya CLINIC &amp; PHARMACY
              </h1>
              <p className="text-sm text-slate-700 font-bold uppercase tracking-wide">
                OFFICIAL PATIENT MEDICAL HISTORY &amp; CLINICAL DOSSIER
              </p>
              <div className="text-xs font-mono text-slate-600">
                Printed by: <strong className="text-black">Medical Doctor</strong> · Date: {new Date().toLocaleString()}
              </div>
            </div>

            {loadingDossier ? (
              <div className="bg-white p-16 rounded-2xl border border-slate-200/80 shadow-sm text-center space-y-3">
                <RefreshCw className="w-8 h-8 text-teal-600 animate-spin mx-auto" />
                <p className="text-xs text-slate-500 font-medium">
                  Loading comprehensive medical history dossier...
                </p>
              </div>
            ) : dossier && selectedPatient ? (
              <>
                {/* 1. Patient Demographics Card */}
                <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                    <div className="flex items-center gap-3.5">
                      <div className="w-14 h-14 rounded-2xl bg-teal-600 text-white flex items-center justify-center font-black text-lg shadow-md shadow-teal-500/20">
                        {selectedPatient.name
                          .split(" ")
                          .map((n: string) => n[0])
                          .slice(0, 2)
                          .join("")}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-lg font-black text-slate-900">
                            {selectedPatient.name}
                          </h3>
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-teal-50 text-teal-700 border border-teal-200">
                            {selectedPatient.patientUid}
                          </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-slate-600 font-medium">
                          <span>Age: <strong>{selectedPatient.age}</strong> yrs</span>
                          <span>·</span>
                          <span>Gender: <strong>{selectedPatient.gender}</strong></span>
                          <span>·</span>
                          <span className="flex items-center gap-1">
                            <Phone className="w-3 h-3 text-slate-400" />
                            <strong>{selectedPatient.phone}</strong>
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 4 Financial & Encounter Summary Pills */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="p-3 bg-teal-50/60 border border-teal-200 rounded-xl">
                      <span className="text-[10px] font-bold text-teal-900 uppercase">
                        Consultations
                      </span>
                      <div className="text-lg font-black text-teal-950 mt-0.5">
                        {dossier.summary.totalVisits} Encounters
                      </div>
                      <span className="text-[10px] text-teal-700 font-medium">
                        Rs. {dossier.summary.totalConsultationFees.toFixed(2)}
                      </span>
                    </div>

                    <div className="p-3 bg-amber-50/60 border border-amber-200 rounded-xl">
                      <span className="text-[10px] font-bold text-amber-900 uppercase">
                        Rx Prescriptions
                      </span>
                      <div className="text-lg font-black text-amber-950 mt-0.5">
                        {dossier.summary.totalMedicinesDispensed} Units
                      </div>
                      <span className="text-[10px] text-amber-700 font-medium">
                        {dossier.summary.totalPharmacySales} POS Orders
                      </span>
                    </div>

                    <div className="p-3 bg-purple-50/60 border border-purple-200 rounded-xl">
                      <span className="text-[10px] font-bold text-purple-900 uppercase">
                        Pharmacy Spend
                      </span>
                      <div className="text-lg font-black text-purple-950 mt-0.5">
                        Rs. {dossier.summary.totalPharmacyExpenditure.toFixed(2)}
                      </div>
                      <span className="text-[10px] text-purple-700 font-medium">
                        Total Dispensary Billed
                      </span>
                    </div>

                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                      <span className="text-[10px] font-bold text-slate-600 uppercase">
                        Total Healthcare
                      </span>
                      <div className="text-lg font-black text-slate-900 mt-0.5">
                        Rs. {dossier.summary.totalCombinedSpend.toFixed(2)}
                      </div>
                      <span className="text-[10px] text-slate-500 font-medium">
                        Clinical + Pharmacy
                      </span>
                    </div>
                  </div>
                </div>

                {/* 2. Medical Dossier Tabs (Hidden on print) */}
                <div className="flex items-center gap-2 border-b border-slate-200 pb-2 print:hidden overflow-x-auto scrollbar-none">
                  <button
                    onClick={() => setActiveTab("timeline")}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all whitespace-nowrap ${
                      activeTab === "timeline"
                        ? "bg-teal-600 text-white shadow-sm"
                        : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    <Activity className="w-3.5 h-3.5" />
                    <span>Unified Medical Timeline</span>
                  </button>

                  <button
                    onClick={() => setActiveTab("visits")}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all whitespace-nowrap ${
                      activeTab === "visits"
                        ? "bg-teal-600 text-white shadow-sm"
                        : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    <Stethoscope className="w-3.5 h-3.5" />
                    <span>Clinical Visits & Notes ({dossier.visits.length})</span>
                  </button>

                  <button
                    onClick={() => setActiveTab("medications")}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all whitespace-nowrap ${
                      activeTab === "medications"
                        ? "bg-teal-600 text-white shadow-sm"
                        : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    <Pill className="w-3.5 h-3.5" />
                    <span>Dispensed Medicines & Rx ({dossier.prescriptions.length})</span>
                  </button>

                  <button
                    onClick={() => setActiveTab("invoices")}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all whitespace-nowrap ${
                      activeTab === "invoices"
                        ? "bg-teal-600 text-white shadow-sm"
                        : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    <Receipt className="w-3.5 h-3.5" />
                    <span>Invoices & Billing ({dossier.invoices.length})</span>
                  </button>
                </div>

                {/* TAB 1: UNIFIED MEDICAL TIMELINE */}
                {(activeTab === "timeline" || typeof window !== "undefined") && (
                  <div className={activeTab !== "timeline" ? "hidden print:block space-y-4" : "space-y-4"}>
                    <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-6">
                      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 flex items-center gap-2">
                          <Activity className="w-4 h-4 text-teal-600" />
                          <span>Chronological Clinical & Prescription Timeline</span>
                        </h4>
                        <span className="text-xs text-slate-400 font-mono">
                          Patient UID: {selectedPatient.patientUid}
                        </span>
                      </div>

                      {dossier.visits.length === 0 && dossier.prescriptions.length === 0 ? (
                        <div className="py-12 text-center text-xs text-slate-400">
                          No previous medical records or visits on file for this patient.
                        </div>
                      ) : (
                        <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-200">
                          {/* Render combined visits & prescriptions sorted by date */}
                          {[
                            ...dossier.visits.map((v: any) => ({ ...v, itemType: "VISIT" })),
                            ...dossier.prescriptions.map((p: any) => ({ ...p, itemType: "PRESCRIPTION" })),
                          ]
                            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                            .map((item, idx) => {
                              const isVisit = item.itemType === "VISIT";
                              return (
                                <div key={idx} className="relative group">
                                  {/* Timeline Dot */}
                                  <div
                                    className={`absolute -left-6 top-1.5 w-5 h-5 rounded-full border-2 border-white flex items-center justify-center shadow-sm ${
                                      isVisit ? "bg-teal-600 text-white" : "bg-amber-500 text-white"
                                    }`}
                                  >
                                    {isVisit ? (
                                      <Stethoscope className="w-2.5 h-2.5" />
                                    ) : (
                                      <Pill className="w-2.5 h-2.5" />
                                    )}
                                  </div>

                                  {/* Event Card */}
                                  <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-xl space-y-2 hover:border-slate-300 transition-colors">
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                                      <div className="flex items-center gap-2">
                                        <span
                                          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                            isVisit
                                              ? "bg-teal-100 text-teal-800"
                                              : "bg-amber-100 text-amber-800"
                                          }`}
                                        >
                                          {isVisit ? "Clinical Consultation" : "Pharmacy Dispensation"}
                                        </span>
                                        <h5 className="text-xs font-extrabold text-slate-900">
                                          {isVisit ? item.serviceType : `POS Sale #${item.saleNumber}`}
                                        </h5>
                                      </div>
                                      <div className="text-[11px] font-mono text-slate-400">
                                        {new Date(item.createdAt).toLocaleDateString()} at{" "}
                                        {new Date(item.createdAt).toLocaleTimeString([], {
                                          hour: "2-digit",
                                          minute: "2-digit",
                                        })}
                                      </div>
                                    </div>

                                    {/* Event Details */}
                                    {isVisit ? (
                                      <div className="space-y-1.5 text-xs text-slate-700">
                                        {item.diagnosis && (
                                          <div className="p-2.5 bg-teal-50/70 border border-teal-200 rounded-lg">
                                            <span className="font-bold text-teal-900 block text-[11px]">
                                              Clinical Diagnosis:
                                            </span>
                                            <p className="text-teal-950 font-medium mt-0.5">
                                              {item.diagnosis}
                                            </p>
                                          </div>
                                        )}
                                        {item.notes && (
                                          <div className="text-[11px] text-slate-600 bg-white p-2 rounded border border-slate-200">
                                            <strong>Doctor Findings:</strong> {item.notes}
                                          </div>
                                        )}
                                        <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                                          <span>Consultation Fee: Rs. {item.fee.toFixed(2)}</span>
                                          {item.invoice && (
                                            <span className="text-emerald-700 font-semibold">
                                              Invoice: {item.invoice.invoiceNumber} ({item.invoice.status})
                                            </span>
                                          )}
                                        </div>
                                      </div>
                                    ) : (
                                      <div className="space-y-1.5 text-xs">
                                        <div className="p-2.5 bg-amber-50/70 border border-amber-200 rounded-lg space-y-1">
                                          <span className="font-bold text-amber-900 block text-[11px]">
                                            Medicines Dispensed ({item.items.length} items):
                                          </span>
                                          <ul className="list-disc list-inside text-amber-950 text-[11px] space-y-0.5">
                                            {item.items.map((it: any, iIdx: number) => (
                                              <li key={iIdx}>
                                                <strong>{it.medicineName}</strong> ({it.genericName}) —{" "}
                                                {it.quantity} units dispensed
                                              </li>
                                            ))}
                                          </ul>
                                        </div>
                                        <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                                          <span>Dispensed by Pharmacist: {item.pharmacistName}</span>
                                          <span className="font-bold text-slate-800">
                                            Total: Rs. {item.totalAmount.toFixed(2)}
                                          </span>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* TAB 2: CLINICAL VISITS & DOCTOR NOTES */}
                {activeTab === "visits" && (
                  <div className="space-y-4">
                    <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-5">
                      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 flex items-center gap-2">
                          <Stethoscope className="w-4 h-4 text-teal-600" />
                          <span>Clinical Consultations, Procedures & Diagnoses</span>
                        </h4>
                        <span className="text-xs font-mono text-slate-400">
                          {dossier.visits.length} encounters
                        </span>
                      </div>

                      <div className="space-y-4">
                        {dossier.visits.map((v: any) => {
                          const isEditing = editingVisitId === v.id;
                          return (
                            <div
                              key={v.id}
                              className="p-5 bg-slate-50 border border-slate-200 rounded-2xl space-y-3"
                            >
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-200">
                                <div>
                                  <div className="flex items-center gap-2">
                                    <span className="text-sm font-black text-slate-900">
                                      {v.serviceType}
                                    </span>
                                    <span className="px-2 py-0.5 bg-teal-100 text-teal-800 text-[10px] font-bold rounded">
                                      Rs. {v.fee.toFixed(2)}
                                    </span>
                                  </div>
                                  <span className="text-[11px] font-mono text-slate-400">
                                    Encounter Date: {new Date(v.createdAt).toLocaleString()}
                                  </span>
                                </div>

                                <div className="flex items-center gap-2">
                                  {v.invoice && (
                                    <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 text-xs font-bold rounded-lg">
                                      Paid: {v.invoice.invoiceNumber}
                                    </span>
                                  )}
                                  {!isEditing && (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setEditingVisitId(v.id);
                                        setEditDiagnosis(v.diagnosis || "");
                                        setEditNotes(v.notes || "");
                                      }}
                                      className="px-3 py-1 bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors"
                                    >
                                      <Edit3 className="w-3.5 h-3.5 text-teal-600" />
                                      <span>{v.diagnosis ? "Update Findings" : "Add Diagnosis"}</span>
                                    </button>
                                  )}
                                </div>
                              </div>

                              {/* Active Edit Form */}
                              {isEditing ? (
                                <div className="p-4 bg-teal-50/70 border border-teal-200 rounded-xl space-y-3">
                                  <div>
                                    <label className="block text-[11px] font-bold uppercase text-teal-900 mb-1">
                                      Clinical Diagnosis / Impression
                                    </label>
                                    <input
                                      type="text"
                                      value={editDiagnosis}
                                      onChange={(e) => setEditDiagnosis(e.target.value)}
                                      placeholder="e.g. Acute Gastritis, Essential Hypertension, Viral URTI..."
                                      className="w-full bg-white border border-teal-300 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
                                    />
                                  </div>

                                  <div>
                                    <label className="block text-[11px] font-bold uppercase text-teal-900 mb-1">
                                      Doctor's Clinical Notes, Symptoms & Instructions
                                    </label>
                                    <textarea
                                      rows={3}
                                      value={editNotes}
                                      onChange={(e) => setEditNotes(e.target.value)}
                                      placeholder="Record patient complaints, examination findings, dietary advice, or prescription notes..."
                                      className="w-full bg-white border border-teal-300 rounded-xl p-3 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
                                    />
                                  </div>

                                  <div className="flex justify-end gap-2 pt-1">
                                    <button
                                      type="button"
                                      onClick={() => setEditingVisitId(null)}
                                      className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-800"
                                    >
                                      Cancel
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleSaveVisitNotes(v.id)}
                                      disabled={savingNote}
                                      className="px-4 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-colors"
                                    >
                                      <Save className="w-3.5 h-3.5" />
                                      <span>{savingNote ? "Saving..." : "Save Clinical Record"}</span>
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <div className="space-y-2">
                                  {v.diagnosis ? (
                                    <div className="p-3 bg-white border border-slate-200 rounded-xl">
                                      <span className="text-[10px] font-bold uppercase text-teal-800 tracking-wider">
                                        Diagnosis
                                      </span>
                                      <p className="text-xs font-extrabold text-slate-900 mt-0.5">
                                        {v.diagnosis}
                                      </p>
                                    </div>
                                  ) : (
                                    <div className="text-xs text-slate-400 italic">
                                      No clinical diagnosis recorded for this visit yet.
                                    </div>
                                  )}

                                  {v.notes && (
                                    <div className="p-3 bg-white border border-slate-200 rounded-xl">
                                      <span className="text-[10px] font-bold uppercase text-slate-500 tracking-wider">
                                        Doctor's Examination Findings & Instructions
                                      </span>
                                      <p className="text-xs text-slate-700 mt-0.5 leading-relaxed">
                                        {v.notes}
                                      </p>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        })}

                        {dossier.visits.length === 0 && (
                          <div className="py-8 text-center text-xs text-slate-400">
                            No clinical consultations recorded.
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB 3: DISPENSED MEDICATIONS & PRESCRIPTIONS */}
                {activeTab === "medications" && (
                  <div className="space-y-4">
                    <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-5">
                      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 flex items-center gap-2">
                          <Pill className="w-4 h-4 text-amber-600" />
                          <span>Pharmaceutical Dispensary & POS Medication History</span>
                        </h4>
                        <span className="text-xs font-mono text-slate-400">
                          {dossier.prescriptions.length} dispensary checkouts
                        </span>
                      </div>

                      <div className="space-y-4">
                        {dossier.prescriptions.map((sale: any) => (
                          <div
                            key={sale.id}
                            className="p-5 bg-slate-50 border border-slate-200 rounded-2xl space-y-3"
                          >
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-200">
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="font-mono text-xs font-extrabold text-amber-700">
                                    {sale.saleNumber}
                                  </span>
                                  <span className="text-xs text-slate-500">
                                    Dispensed by Pharmacist <strong>{sale.pharmacistName}</strong>
                                  </span>
                                </div>
                                <span className="text-[11px] font-mono text-slate-400">
                                  Date: {new Date(sale.createdAt).toLocaleString()}
                                </span>
                              </div>

                              <div className="text-right">
                                <div className="text-xs font-black text-slate-900">
                                  Net Paid: Rs. {sale.totalAmount.toFixed(2)}
                                </div>
                                {sale.discount > 0 && (
                                  <span className="text-[10px] text-emerald-600 font-semibold">
                                    Saved: Rs. {sale.discount.toFixed(2)} (5% Generic)
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Itemized Medicines Table */}
                            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                              <table className="w-full text-left text-xs text-slate-700">
                                <thead className="bg-slate-50 text-[10px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-200">
                                  <tr>
                                    <th className="px-3.5 py-2">Medicine (Brand)</th>
                                    <th className="px-3.5 py-2">Generic Name</th>
                                    <th className="px-3.5 py-2">Category</th>
                                    <th className="px-3.5 py-2 text-right">Qty</th>
                                    <th className="px-3.5 py-2 text-right">Price</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                  {sale.items.map((item: any, i: number) => (
                                    <tr key={i} className="hover:bg-slate-50/60">
                                      <td className="px-3.5 py-2 font-bold text-slate-900">
                                        {item.medicineName}
                                      </td>
                                      <td className="px-3.5 py-2 text-slate-600">
                                        {item.genericName}
                                      </td>
                                      <td className="px-3.5 py-2">
                                        <span className="px-1.5 py-0.5 rounded text-[9px] font-semibold bg-slate-100 text-slate-700">
                                          {item.category}
                                        </span>
                                      </td>
                                      <td className="px-3.5 py-2 text-right font-mono font-bold text-slate-800">
                                        {item.quantity}
                                      </td>
                                      <td className="px-3.5 py-2 text-right font-mono text-slate-900">
                                        Rs. {item.totalPrice.toFixed(2)}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        ))}

                        {dossier.prescriptions.length === 0 && (
                          <div className="py-8 text-center text-xs text-slate-400">
                            No dispensary medicine sales linked to this patient.
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB 4: INVOICES & BILLING HISTORY */}
                {activeTab === "invoices" && (
                  <div className="space-y-4">
                    <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
                      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 flex items-center gap-2">
                          <Receipt className="w-4 h-4 text-purple-600" />
                          <span>Clinical Invoices & Cash Receipts</span>
                        </h4>
                        <span className="text-xs font-mono text-slate-400">
                          {dossier.invoices.length} invoices
                        </span>
                      </div>

                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs text-slate-700">
                          <thead className="bg-slate-50 text-[10px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-200">
                            <tr>
                              <th className="px-4 py-2.5">Invoice #</th>
                              <th className="px-4 py-2.5">Date</th>
                              <th className="px-4 py-2.5">Receptionist</th>
                              <th className="px-4 py-2.5">Procedures Billed</th>
                              <th className="px-4 py-2.5 text-right">Discount</th>
                              <th className="px-4 py-2.5 text-right">Total Paid</th>
                              <th className="px-4 py-2.5 text-center">Status</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {dossier.invoices.map((inv: any) => (
                              <tr key={inv.id} className="hover:bg-slate-50/70">
                                <td className="px-4 py-3 font-mono font-bold text-purple-700">
                                  {inv.invoiceNumber}
                                </td>
                                <td className="px-4 py-3 text-slate-500 font-mono text-[11px]">
                                  {new Date(inv.createdAt).toLocaleDateString()}
                                </td>
                                <td className="px-4 py-3 text-slate-700">
                                  {inv.operatorName}
                                </td>
                                <td className="px-4 py-3 text-slate-800">
                                  {inv.items.map((i: any) => i.description).join(", ")}
                                </td>
                                <td className="px-4 py-3 text-right text-emerald-600">
                                  {inv.discount > 0 ? `-Rs. ${inv.discount.toFixed(2)}` : "Rs. 0.00"}
                                </td>
                                <td className="px-4 py-3 text-right font-black text-slate-900">
                                  Rs. {inv.totalAmount.toFixed(2)}
                                </td>
                                <td className="px-4 py-3 text-center">
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-100 text-emerald-800">
                                    {inv.status}
                                  </span>
                                </td>
                              </tr>
                            ))}
                            {dossier.invoices.length === 0 && (
                              <tr>
                                <td colSpan={7} className="px-4 py-8 text-center text-slate-400 text-xs">
                                  No clinical invoices issued for this patient.
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )}

                {/* Print Sign-off block (Visible only on print) */}
                <div className="hidden print:block pt-16 space-y-12">
                  <div className="grid grid-cols-2 gap-12 text-sm">
                    <div className="border-t-2 border-slate-900 pt-3">
                      <p className="font-black text-slate-900">Attending Medical Officer / Doctor</p>
                      <p className="text-xs text-slate-600 mt-0.5">Signature, PMDC Reg &amp; Clinical Stamp</p>
                    </div>
                    <div className="border-t-2 border-slate-900 pt-3 text-right">
                      <p className="font-black text-slate-900">Ruqayya Clinic Medical Records</p>
                      <p className="text-xs text-slate-600 mt-0.5">Verified Confidential Patient Dossier</p>
                    </div>
                  </div>
                  <div className="pt-4 text-center border-t border-dashed border-slate-900 mt-4">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-slate-800">
                      Powered by BlockMindArk
                    </p>
                  </div>
                </div>
              </>
            ) : (
              <div className="bg-white p-12 rounded-2xl border border-slate-200/80 shadow-sm text-center space-y-2">
                <User className="w-10 h-10 text-slate-300 mx-auto" />
                <h4 className="text-sm font-bold text-slate-700">No Patient Selected</h4>
                <p className="text-xs text-slate-400">
                  Search and click any patient from the left roster to inspect their comprehensive medical history.
                </p>
              </div>
            )}
          </div>
        </div>

      </main>
    </div>
  );
}


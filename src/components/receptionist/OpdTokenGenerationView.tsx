"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Ticket,
  Printer,
  Sparkles,
  Clock,
  ShieldCheck,
  User,
  Calendar,
  AlertCircle,
  RefreshCw,
  Hash,
  CheckCircle2,
  X,
  Search,
  UserPlus,
  ArrowRight,
  Layers,
  Phone,
  Activity,
  Maximize2,
  Minimize2,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import {
  validateAllPatientFields,
  validatePatientName,
  validatePakistaniPhone,
  validatePatientAge,
  validatePakistaniCnic,
  PatientValidationErrors,
} from "@/lib/validation/patient";

export interface OpdServiceOption {
  id: string;
  name: string;
  fee: number;
}

export const OPD_SERVICE_OPTIONS: OpdServiceOption[] = [
  { id: "opd", name: "OPD Fees", fee: 300 },
  { id: "sugar", name: "Sugar Test", fee: 100 },
  { id: "upd", name: "U P D", fee: 100 },
  { id: "bp", name: "BP", fee: 50 },
];

export interface TokenItem {
  id: string;
  tokenNumber: number;
  tokenType: "MANUAL_RESERVED" | "AUTO_SEQUENCE";
  status: "ISSUED" | "CANCELLED";
  dateStr: string;
  fee?: number;
  services?: OpdServiceOption[];
  createdAt: string | Date;
  issuedBy: {
    id: string;
    name: string;
    role: string;
  };
  patient?: {
    id: string;
    name: string;
    patientUid: string;
    phone: string;
    age?: number;
    gender?: string;
    cnic?: string | null;
  } | null;
}

export interface TokenStatusResponse {
  dateStr: string;
  counter: {
    lastAutoNumber: number;
    nextAutoToken: number;
    issuedManualTokens: number[];
  };
  stats: {
    totalToday: number;
    autoCount: number;
    manualCount: number;
  };
  recentTokens: TokenItem[];
}

// 80mm ESC/POS Single-Page Thermal Print Routine for OPD Token Slip (with Patient Details & Services)
export function printTokenSlip(token: {
  tokenNumber: number;
  tokenType: "MANUAL_RESERVED" | "AUTO_SEQUENCE";
  createdAt: string | Date;
  staffName?: string;
  patientName?: string;
  patientUid?: string;
  patientPhone?: string;
  patientCnic?: string | null;
  services?: OpdServiceOption[];
  totalFee?: number;
}) {
  if (typeof window === "undefined") return;

  const existing = document.getElementById("token-print-iframe");
  if (existing) {
    existing.remove();
  }

  const iframe = document.createElement("iframe");
  iframe.id = "token-print-iframe";
  iframe.style.position = "fixed";
  iframe.style.right = "0";
  iframe.style.bottom = "0";
  iframe.style.width = "0";
  iframe.style.height = "0";
  iframe.style.border = "none";
  iframe.style.visibility = "hidden";

  document.body.appendChild(iframe);

  const doc = iframe.contentWindow?.document || iframe.contentDocument;
  if (!doc) return;

  const formattedDate = new Date(token.createdAt).toLocaleString("en-PK", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });

  const isReserved = token.tokenType === "MANUAL_RESERVED";
  const typeLabel = isReserved ? "RESERVED PRIORITY" : "AUTO SEQUENCE";
  const formattedTokenNum = String(token.tokenNumber).padStart(2, "0");

  doc.open();
  doc.write(`
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="utf-8" />
        <title>OPD Token #${formattedTokenNum}</title>
        <style>
          @page {
            size: 80mm auto;
            margin: 0mm;
          }
          *, *::before, *::after {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          html, body {
            width: 80mm;
            max-width: 80mm;
            margin: 0 !important;
            padding: 0 !important;
            background: #ffffff !important;
            color: #000000 !important;
            font-family: 'Courier New', Courier, monospace, system-ui;
            font-size: 12px;
            line-height: 1.35;
            visibility: visible !important;
          }
          body * {
            visibility: visible !important;
            color: #000000 !important;
          }
          .token-slip {
            width: 80mm;
            max-width: 80mm;
            padding: 5mm;
            margin: 0 auto;
            background: #ffffff;
            color: #000000;
            text-align: center;
            page-break-inside: avoid;
            break-inside: avoid;
          }
          .hospital-name {
            font-size: 15px;
            font-weight: 900;
            text-transform: uppercase;
            letter-spacing: 1px;
          }
          .hospital-sub {
            font-size: 10px;
            margin-top: 3px;
          }
          .divider {
            border-bottom: 1px dashed #000000;
            margin: 8px 0;
          }
          .slip-title {
            font-size: 12px;
            font-weight: 900;
            letter-spacing: 2px;
            text-transform: uppercase;
            padding: 3px 6px;
            border: 1px solid #000000;
            display: inline-block;
            margin: 6px 0;
          }
          .token-box {
            margin: 8px 0;
            padding: 6px 0;
            border-top: 2px solid #000000;
            border-bottom: 2px solid #000000;
          }
          .token-label {
            font-size: 11px;
            font-weight: bold;
            letter-spacing: 2px;
            text-transform: uppercase;
          }
          .token-huge {
            font-size: 44px;
            font-weight: 900;
            line-height: 1;
            margin: 5px 0;
            letter-spacing: 2px;
          }
          .type-badge {
            display: inline-block;
            font-size: 10px;
            font-weight: 900;
            padding: 3px 7px;
            background: #000000;
            color: #ffffff !important;
            border-radius: 2px;
            margin-top: 3px;
          }
          .patient-box {
            text-align: left;
            margin: 8px 0;
            padding: 6px 8px;
            background: #f8f8f8;
            border: 1px dashed #000000;
          }
          .patient-box-title {
            font-size: 10px;
            font-weight: bold;
            text-transform: uppercase;
            letter-spacing: 1px;
            border-bottom: 1px dashed #cccccc;
            padding-bottom: 3px;
            margin-bottom: 4px;
          }
          .meta-row {
            display: flex;
            justify-content: space-between;
            font-size: 11.5px;
            margin: 3.5px 0;
          }
          .meta-label {
            font-weight: bold;
          }
          .instructions {
            margin-top: 8px;
            font-size: 11px;
            font-weight: bold;
            text-transform: uppercase;
            line-height: 1.35;
          }
          .footer-note {
            margin-top: 8px;
            font-size: 9.5px;
            line-height: 1.35;
          }
          .barcode {
            margin-top: 6px;
            font-size: 10px;
            letter-spacing: 3px;
          }
        </style>
      </head>
      <body>
        <div class="token-slip">
          <div class="hospital-name">RUQAYYA CLINIC &amp; OPD</div>
          <div class="hospital-sub">Main Boulevard, G.T. Road, Lahore · Tel: 042-35891122</div>
          <div class="divider"></div>
          
          <div>
            <span class="slip-title">OPD PATIENT TOKEN SLIP</span>
          </div>

          <div class="token-box">
            <div class="token-label">OPD TOKEN NUMBER</div>
            <div class="token-huge">#${formattedTokenNum}</div>
            <div>
              <span class="type-badge">${typeLabel}</span>
            </div>
          </div>

          <!-- Patient Information Section -->
          <div class="patient-box">
            <div class="patient-box-title">Patient Identification</div>
            <div class="meta-row">
              <span class="meta-label">Patient:</span>
              <span style="font-weight:bold;">${token.patientName || "Walk-in Patient"}</span>
            </div>
            ${token.patientUid ? `
            <div class="meta-row">
              <span class="meta-label">UID:</span>
              <span style="font-family:monospace; font-weight:bold;">${token.patientUid}</span>
            </div>` : ""}
            ${token.patientPhone ? `
            <div class="meta-row">
              <span class="meta-label">Phone:</span>
              <span>${token.patientPhone}</span>
            </div>` : ""}
            ${token.patientCnic ? `
            <div class="meta-row">
              <span class="meta-label">CNIC:</span>
              <span style="font-family:monospace;">${token.patientCnic}</span>
            </div>` : ""}
          </div>

          <!-- Services & Fees Breakdown -->
          <div style="margin: 6px 0; padding: 6px 0; border-top: 1px dashed #000; border-bottom: 1px dashed #000;">
            <div style="font-size: 10px; font-weight: bold; text-transform: uppercase; margin-bottom: 4px;">
              Selected OPD Services &amp; Fees
            </div>
            ${
              token.services && token.services.length > 0
                ? token.services
                    .map(
                      (s) => `
              <div class="meta-row">
                <span>${s.name}</span>
                <span style="font-family:monospace; font-weight:bold;">Rs. ${s.fee}</span>
              </div>`
                    )
                    .join("")
                : `
              <div class="meta-row">
                <span>OPD Fees</span>
                <span style="font-family:monospace; font-weight:bold;">Rs. 300</span>
              </div>`
            }
            <div class="meta-row" style="font-size: 12.5px; font-weight: 900; margin-top: 5px; border-top: 1px solid #000; padding-top: 4px;">
              <span>TOTAL FEE PAID:</span>
              <span style="font-family:monospace; font-weight: 900;">
                Rs. ${
                  token.totalFee !== undefined
                    ? token.totalFee
                    : token.services && token.services.length > 0
                    ? token.services.reduce((acc, s) => acc + s.fee, 0)
                    : 300
                }
              </span>
            </div>
          </div>

          <div class="divider"></div>

          <div class="meta-row">
            <span class="meta-label">Date &amp; Time:</span>
            <span>${formattedDate}</span>
          </div>
          <div class="meta-row">
            <span class="meta-label">Issued By:</span>
            <span>${token.staffName || "Reception Desk"}</span>
          </div>
          <div class="meta-row">
            <span class="meta-label">Validity:</span>
            <span>Today Only</span>
          </div>

          <div class="divider"></div>

          <div class="instructions">
            Please wait for your token number to appear on the clinic calling screen.
          </div>

          <div class="barcode">
            |||| || ||||| |||| || ||||| ||||
          </div>

          <div class="footer-note">
            Ruqayya Clinic HMS · Auto Token Queue System
            <br />
            Keep this slip until consultation is complete.
          </div>
          <div class="divider"></div>
          <div style="font-size: 9.5px; font-weight: bold; letter-spacing: 0.5px; text-transform: uppercase; margin-top: 5px; text-align: center;">
            Powered by BlockMindArk
          </div>
        </div>
      </body>
    </html>
  `);
  doc.close();

  setTimeout(() => {
    try {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
    } catch (e) {
      console.error("Print token slip error:", e);
    } finally {
      setTimeout(() => {
        iframe.remove();
      }, 2500);
    }
  }, 250);
}

interface OpdTokenGenerationViewProps {
  onSelectTokenForServices?: (token: TokenItem) => void;
}

export function OpdTokenGenerationView({ onSelectTokenForServices }: OpdTokenGenerationViewProps) {
  const [data, setData] = useState<TokenStatusResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Patient Identification State
  const [patientQuery, setPatientQuery] = useState("");
  const [patientResults, setPatientResults] = useState<any[]>([]);
  const [recentPatients, setRecentPatients] = useState<any[]>([]);
  const [searchingPatient, setSearchingPatient] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<any | null>(null);

  // Quick Register Patient Modal State
  const [showRegModal, setShowRegModal] = useState(false);
  const [regForm, setRegForm] = useState({
    name: "",
    phone: "",
    age: "",
    gender: "Male",
    cnic: "",
  });
  const [regErrors, setRegErrors] = useState<PatientValidationErrors>({});
  const [regLoading, setRegLoading] = useState(false);

  // Success Pop-up Modal State
  const [lastIssuedToken, setLastIssuedToken] = useState<TokenItem | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  // Collapsible History State (Minimized by default as requested)
  const [historyExpanded, setHistoryExpanded] = useState(false);

  // OPD Services & Fees Selection inside "OPD Token Issued" modal (Default: OPD Fees Rs. 300)
  const [modalServiceIds, setModalServiceIds] = useState<string[]>(["opd"]);

  const toggleModalService = async (id: string) => {
    const updatedIds = modalServiceIds.includes(id)
      ? modalServiceIds.length > 1
        ? modalServiceIds.filter((s) => s !== id)
        : modalServiceIds
      : [...modalServiceIds, id];

    setModalServiceIds(updatedIds);

    const updatedServices = OPD_SERVICE_OPTIONS.filter((o) => updatedIds.includes(o.id));
    const updatedTotal = updatedServices.reduce((sum, s) => sum + s.fee, 0);

    if (lastIssuedToken?.id) {
      setLastIssuedToken((prev) =>
        prev
          ? {
              ...prev,
              services: updatedServices,
              fee: updatedTotal,
            }
          : null
      );

      try {
        await fetch("/api/receptionist/tokens", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            tokenId: lastIssuedToken.id,
            services: updatedServices,
            fee: updatedTotal,
          }),
        });
        fetchStatus();
      } catch (e) {
        console.error("Failed to sync updated token services:", e);
      }
    }
  };

  const getSelectedServicesList = (ids: string[] = modalServiceIds): OpdServiceOption[] => {
    return OPD_SERVICE_OPTIONS.filter((o) => ids.includes(o.id));
  };

  const getTotalFee = (ids: string[] = modalServiceIds): number => {
    return getSelectedServicesList(ids).reduce((sum, s) => sum + s.fee, 0);
  };

  const modalTotalFee = getTotalFee(modalServiceIds);

  const fetchRecentPatients = useCallback(async () => {
    try {
      const res = await fetch("/api/receptionist/patients");
      if (res.ok) {
        const json = await res.json();
        setRecentPatients(json.patients || []);
      }
    } catch (e) {
      console.error("Failed to load recent patients:", e);
    }
  }, []);

  const fetchStatus = useCallback(async () => {
    try {
      setError(null);
      const res = await fetch("/api/receptionist/tokens");
      if (res.ok) {
        const json = await res.json();
        setData(json);
      } else {
        const errJson = await res.json().catch(() => ({}));
        setError(errJson.error || "Failed to load token queue status");
      }
    } catch (err: any) {
      setError(err?.message || "Network error loading token status");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStatus();
    fetchRecentPatients();
    const interval = setInterval(fetchStatus, 15000);
    return () => clearInterval(interval);
  }, [fetchStatus, fetchRecentPatients]);

  // Patient Lookup Function
  const handleSearchPatient = async (q: string) => {
    setPatientQuery(q);
    if (!q.trim()) {
      setPatientResults([]);
      return;
    }
    setSearchingPatient(true);
    try {
      const res = await fetch(`/api/receptionist/patients?query=${encodeURIComponent(q)}`);
      if (res.ok) {
        const data = await res.json();
        setPatientResults(data.patients || []);
      }
    } catch (err) {
      console.error("Patient search error:", err);
    } finally {
      setSearchingPatient(false);
    }
  };

  // Quick Patient Registration
  const handleQuickRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    const valErrors = validateAllPatientFields(regForm);
    if (Object.keys(valErrors).length > 0) {
      setRegErrors(valErrors);
      return;
    }

    setRegErrors({});
    setRegLoading(true);
    try {
      const res = await fetch("/api/receptionist/patients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(regForm),
      });
      const resJson = await res.json();
      if (res.ok && resJson.patient) {
        setSelectedPatient(resJson.patient);
        setRecentPatients((prev) => [resJson.patient, ...prev.filter((p) => p.id !== resJson.patient.id)]);
        setShowRegModal(false);
        setRegForm({ name: "", phone: "", age: "", gender: "Male", cnic: "" });
      } else {
        setRegErrors(resJson.validationErrors || { general: resJson.error || "Failed to register patient" });
      }
    } catch (err: any) {
      setRegErrors({ general: err.message || "Network error registering patient" });
    } finally {
      setRegLoading(false);
    }
  };

  const handleGenerateToken = async (type: "AUTO" | "MANUAL", manualNum?: number) => {
    if (!selectedPatient) {
      setError("Please select an existing patient or register a new patient before generating an OPD token.");
      return;
    }

    setGenerating(true);
    setError(null);

    // Default to OPD Consultation Fee Rs. 300
    const defaultServices = OPD_SERVICE_OPTIONS.filter((o) => o.id === "opd");
    const defaultFee = 300;
    setModalServiceIds(["opd"]);

    try {
      const res = await fetch("/api/receptionist/tokens", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type,
          manualNum,
          patientId: selectedPatient?.id || undefined,
          services: defaultServices,
          fee: defaultFee,
        }),
      });

      const resData = await res.json();

      if (!res.ok) {
        setError(resData.error || "Token generation failed");
        return;
      }

      if (resData.success && resData.token) {
        const tokenItem: TokenItem = resData.token;
        setLastIssuedToken(tokenItem);
        setShowSuccessModal(true);

        if (resData.status) {
          setData(resData.status);
        } else {
          fetchStatus();
        }

        // Direct printing removed as requested: shows "OPD Token Issued" modal for service selection and on-demand printing

        // Clear selected patient for next token
        setSelectedPatient(null);
        setPatientQuery("");
        setPatientResults([]);
      }
    } catch (err: any) {
      setError(err?.message || "Network error during token generation");
    } finally {
      setGenerating(false);
    }
  };

  const issuedManuals = data?.counter?.issuedManualTokens || [];
  const nextAutoToken = data?.counter?.nextAutoToken ?? 5;

  return (
    <div className="space-y-6">
      {/* Top Banner / Date & Queue Health */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl p-6 shadow-xl border border-slate-800">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="p-3 bg-indigo-500/20 rounded-2xl border border-indigo-400/30 text-indigo-400">
              <Ticket className="w-8 h-8" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-black tracking-tight">
                  OPD Token Generation &amp; Sequence Engine
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  Daily Auto-Reset
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Multi-counter synchronized sequence with Patient Identification. Auto tokens increment from #5 onwards; slots #1–4 reserved for emergency/priority arrivals.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right px-3 py-1.5 bg-slate-800/60 rounded-xl border border-slate-700/60">
              <div className="text-[10px] text-slate-400 uppercase font-semibold">Active Date Queue</div>
              <div className="text-xs font-mono font-bold text-amber-300">
                {data?.dateStr || new Date().toISOString().split("T")[0]}
              </div>
            </div>
            <button
              onClick={() => fetchStatus()}
              disabled={loading}
              className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl transition-all border border-slate-700 shadow-sm"
              title="Refresh queue"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-indigo-400" : ""}`} />
            </button>
          </div>
        </div>

        {/* 3 KPI Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 mt-5 pt-5 border-t border-slate-800/80">
          <div className="bg-slate-800/40 rounded-xl p-3 border border-slate-700/40 flex items-center justify-between">
            <div>
              <div className="text-[11px] text-slate-400 font-medium">Total Tokens Today</div>
              <div className="text-2xl font-black text-white mt-0.5 font-mono">
                {data?.stats?.totalToday ?? 0}
              </div>
            </div>
            <div className="p-2 bg-indigo-500/10 rounded-lg text-indigo-400 font-bold text-xs">
              Today
            </div>
          </div>

          <div className="bg-slate-800/40 rounded-xl p-3 border border-slate-700/40 flex items-center justify-between">
            <div>
              <div className="text-[11px] text-slate-400 font-medium">Next Sequential Token</div>
              <div className="text-2xl font-black text-emerald-400 mt-0.5 font-mono">
                #{String(nextAutoToken).padStart(2, "0")}
              </div>
            </div>
            <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-400 font-bold text-xs">
              Auto
            </div>
          </div>

          <div className="bg-slate-800/40 rounded-xl p-3 border border-slate-700/40 flex items-center justify-between">
            <div>
              <div className="text-[11px] text-slate-400 font-medium">Manual Reserved Used</div>
              <div className="text-2xl font-black text-purple-400 mt-0.5 font-mono">
                {issuedManuals.length} / 4
              </div>
            </div>
            <div className="p-2 bg-purple-500/10 rounded-lg text-purple-400 font-bold text-xs">
              Priority
            </div>
          </div>
        </div>
      </div>

      {/* Error Alert Display */}
      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-center gap-3 text-rose-800 text-xs font-semibold animate-in fade-in duration-200">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          <div className="flex-1">{error}</div>
          <button
            onClick={() => setError(null)}
            className="p-1 hover:bg-rose-100 rounded text-rose-500 hover:text-rose-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* PATIENT IDENTIFICATION SECTION (STEP 1 - MANDATORY) */}
      <div className={`bg-white rounded-2xl p-5 shadow-sm border transition-all ${
        selectedPatient ? "border-emerald-300 ring-2 ring-emerald-500/10" : "border-indigo-300 ring-2 ring-indigo-500/10"
      }`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-2">
            <User className="w-4 h-4 text-indigo-600" />
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-2">
              <span>Step 1: Patient Selection &amp; Registration</span>
              <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                selectedPatient
                  ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                  : "bg-amber-100 text-amber-800 border border-amber-300 animate-pulse"
              }`}>
                {selectedPatient ? "✓ Patient Selected" : "Required First"}
              </span>
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowRegModal(true)}
              type="button"
              className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black flex items-center gap-1.5 transition-colors shadow-sm hover:shadow"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>+ Add New Patient</span>
            </button>
          </div>
        </div>

        {/* Selected Patient Banner */}
        {selectedPatient ? (
          <div className="p-4 bg-emerald-50/90 border border-emerald-300 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in duration-200">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-black text-sm shadow-sm">
                {selectedPatient.name[0]?.toUpperCase() || "P"}
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h4 className="text-sm font-black text-emerald-950">{selectedPatient.name}</h4>
                  <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-emerald-200 text-emerald-900 border border-emerald-300">
                    {selectedPatient.patientUid}
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-white text-emerald-700 border border-emerald-300 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    <span>Active for Token</span>
                  </span>
                </div>
                <div className="flex items-center gap-3 text-xs text-emerald-800 mt-1 flex-wrap">
                  <span className="flex items-center gap-1 font-medium">
                    <Phone className="w-3 h-3 text-emerald-600" />
                    <span>{selectedPatient.phone}</span>
                  </span>
                  <span>·</span>
                  <span>{selectedPatient.gender}, {selectedPatient.age} yrs</span>
                  {selectedPatient.cnic && (
                    <>
                      <span>·</span>
                      <span className="font-mono text-emerald-900 bg-emerald-100/90 px-1.5 py-0.5 rounded border border-emerald-300">
                        CNIC: {selectedPatient.cnic}
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setSelectedPatient(null);
                  setPatientQuery("");
                  setPatientResults([]);
                }}
                className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-xl text-xs font-bold transition-colors shadow-sm"
              >
                Change Patient
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="relative">
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search patient by Phone, MR Number (e.g. MR-20261103-00001), CNIC, or Name..."
                  value={patientQuery}
                  onChange={(e) => handleSearchPatient(e.target.value)}
                  className="w-full pl-10 pr-24 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all font-medium"
                />
                {searchingPatient && (
                  <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400">
                    Searching...
                  </div>
                )}
              </div>

              {/* Instant Search Results Dropdown */}
              {patientResults.length > 0 && !selectedPatient && (
                <div className="absolute z-20 top-full left-0 right-0 mt-1.5 bg-white border border-slate-200 rounded-xl shadow-xl max-h-56 overflow-y-auto divide-y divide-slate-100">
                  {patientResults.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => {
                        setSelectedPatient(p);
                        setPatientQuery("");
                        setPatientResults([]);
                      }}
                      className="w-full p-2.5 text-left hover:bg-indigo-50/70 transition-colors flex items-center justify-between"
                    >
                      <div>
                        <div className="text-xs font-bold text-slate-900">{p.name}</div>
                        <div className="text-[11px] text-slate-500 flex items-center gap-2 flex-wrap">
                          <span className="font-mono text-indigo-700 font-semibold">{p.patientUid}</span>
                          <span>·</span>
                          <span>{p.phone}</span>
                          {p.cnic && (
                            <>
                              <span>·</span>
                              <span className="font-mono text-slate-600 bg-slate-100 px-1 py-0.2 rounded">CNIC: {p.cnic}</span>
                            </>
                          )}
                          <span>·</span>
                          <span>{p.gender}, {p.age}y</span>
                        </div>
                      </div>
                      <span className="text-[10px] font-bold text-indigo-600 px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 rounded-lg border border-indigo-200">
                        Select Patient
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Main Token Generator Control Panel (STEP 2) */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span>Step 2: Token Issuance Control Panel</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              {selectedPatient
                ? `Patient linked: ${selectedPatient.name} (${selectedPatient.patientUid}). Choose Auto Sequence or Reserved Slot to issue.`
                : "Locked until a patient is selected or registered in Step 1 above."}
            </p>
          </div>

          <div>
            {selectedPatient ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-300">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Unlocked: {selectedPatient.name}</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-300 animate-pulse">
                <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                <span>Waiting for Patient Selection</span>
              </span>
            )}
          </div>
        </div>

        {/* Lock Warning Banner when no patient is selected */}
        {!selectedPatient && (
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-center gap-2 text-amber-900 mb-4 animate-in fade-in">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
            <span className="text-xs font-bold">
              Token generation is locked. Please select or register a patient in Step 1 above to issue an OPD token.
            </span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* Section A: 4 Manual Reserved Token Buttons (Slots 1-4) */}
          <div className={`lg:col-span-5 rounded-2xl p-4 border flex flex-col justify-between transition-all ${
            selectedPatient ? "bg-slate-50/80 border-slate-200" : "bg-slate-100/60 border-slate-200 opacity-60"
          }`}>
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-purple-600" />
                  Reserved Priority Tokens (1 – 4)
                </span>
                <span className="text-[10px] text-slate-500 font-medium">
                  {4 - issuedManuals.length} remaining
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mb-3">
                Pre-reserved numbers for emergency patients, VIPs, or elderly requiring direct priority consultation.
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-2 gap-2.5">
              {[1, 2, 3, 4].map((num) => {
                const isIssued = issuedManuals.includes(num);
                const isDisabled = !selectedPatient || isIssued || generating;
                return (
                  <button
                    key={num}
                    onClick={() => handleGenerateToken("MANUAL", num)}
                    disabled={isDisabled}
                    className={`relative p-3.5 rounded-xl border flex flex-col items-center justify-center transition-all ${
                      isDisabled
                        ? "bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed opacity-60 shadow-none"
                        : "bg-white hover:bg-purple-50/60 border-purple-200 hover:border-purple-400 text-purple-950 hover:shadow-md hover:scale-[1.02] active:scale-95"
                    }`}
                  >
                    {isIssued ? (
                      <span className="absolute top-1.5 right-1.5 px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-wider bg-slate-200 text-slate-600">
                        Issued
                      </span>
                    ) : (
                      <span className="absolute top-1.5 right-1.5 px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-wider bg-purple-100 text-purple-700">
                        Open
                      </span>
                    )}
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Slot</span>
                    <span
                      className={`text-2xl font-black font-mono my-0.5 ${
                        isIssued || !selectedPatient ? "text-slate-400" : "text-purple-700"
                      }`}
                    >
                      #{String(num).padStart(2, "0")}
                    </span>
                    <span className="text-[10px] font-medium text-slate-500">
                      {isIssued ? "Used Today" : !selectedPatient ? "Locked" : "Click to Issue"}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section B: Prominent Big Highlighted Auto Sequence Button */}
          <div className={`lg:col-span-7 rounded-2xl p-5 border-2 shadow-md flex flex-col justify-between transition-all ${
            selectedPatient
              ? "bg-gradient-to-br from-emerald-50 via-teal-50/50 to-white border-emerald-500/40"
              : "bg-slate-50 border-slate-300 opacity-70"
          }`}>
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-black uppercase tracking-wider text-emerald-800 flex items-center gap-2">
                  <span className="relative flex h-2.5 w-2.5">
                    <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                      selectedPatient ? "bg-emerald-400" : "bg-slate-300"
                    }`}></span>
                    <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
                      selectedPatient ? "bg-emerald-600" : "bg-slate-400"
                    }`}></span>
                  </span>
                  Standard OPD Sequence (Starts at #05)
                </span>
                <span className="text-[11px] font-bold text-emerald-700 px-2 py-0.5 bg-emerald-100 rounded-md">
                  Active Next: #{String(nextAutoToken).padStart(2, "0")}
                </span>
              </div>
              <p className="text-xs text-slate-600">
                Primary token issuance for registered clinic patients. Automatically increments and locks sequence without gaps.
              </p>
            </div>

            <div className="my-auto py-3">
              <button
                onClick={() => {
                  if (!selectedPatient) {
                    setError("Please search and select a patient in Step 1 above (or click '+ Add New Patient') before issuing an OPD token.");
                    return;
                  }
                  handleGenerateToken("AUTO");
                }}
                disabled={generating}
                className={`w-full group relative overflow-hidden py-4 px-6 rounded-2xl text-white font-black text-lg sm:text-xl tracking-wide transition-all flex items-center justify-center gap-4 border ${
                  selectedPatient && !generating
                    ? "bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-600 hover:from-emerald-700 hover:to-teal-700 shadow-lg shadow-emerald-500/30 hover:shadow-emerald-500/50 active:scale-[0.98] border-emerald-400/40 cursor-pointer"
                    : "bg-slate-400 hover:bg-slate-500 border-slate-300 opacity-80 cursor-pointer shadow-none"
                }`}
              >
                <div className="p-2.5 bg-white/20 rounded-xl group-hover:scale-110 transition-transform">
                  <Ticket className="w-7 h-7 text-white" />
                </div>
                <div className="text-left">
                  <div className="text-xs font-semibold uppercase tracking-wider text-emerald-100">
                    {selectedPatient ? `Linked: ${selectedPatient.name}` : "Step 1: Select Patient First"}
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span>{selectedPatient ? "ISSUE AUTO TOKEN" : "PATIENT REQUIRED TO ISSUE"}</span>
                    <span className="font-mono text-2xl font-black text-amber-200">
                      #{String(nextAutoToken).padStart(2, "0")}
                    </span>
                  </div>
                </div>
              </button>
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-emerald-100">
              <span>Single-click generation with instant 80mm thermal slip print</span>
              <span className="font-mono font-semibold text-emerald-800">
                Total Sequential Issued: {data?.stats?.autoCount ?? 0}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Live Today's Token History Table (Collapsible / Minimized by default) */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 sm:p-5 bg-slate-50/70 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-slate-600" />
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800">
              Today&apos;s Issued Tokens History
            </h4>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-200 text-slate-700">
              {data?.recentTokens?.length || 0} Total
            </span>
          </div>
          <div className="flex items-center gap-2.5">
            <span className="text-[11px] text-slate-500 font-medium hidden sm:inline">
              {historyExpanded ? "Live auto-updating queue list · Sorted newest first" : "Tabular details minimized · Click to expand"}
            </span>
            <button
              type="button"
              onClick={() => setHistoryExpanded(!historyExpanded)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-300 hover:border-slate-400 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs transition-colors shadow-2xs cursor-pointer"
              title={historyExpanded ? "Minimize token history" : "Maximize / Show token history"}
            >
              {historyExpanded ? (
                <>
                  <Minimize2 className="w-3.5 h-3.5 text-slate-500" />
                  <span>Minimize Table</span>
                </>
              ) : (
                <>
                  <Maximize2 className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Maximize / Show ({data?.recentTokens?.length || 0})</span>
                </>
              )}
            </button>
          </div>
        </div>

        {historyExpanded && (
          <div className="overflow-x-auto max-h-[380px] animate-in fade-in duration-200">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-100/75 text-slate-600 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200 sticky top-0 backdrop-blur-sm z-10">
                <tr>
                  <th className="py-2.5 px-4">Token #</th>
                  <th className="py-2.5 px-4">Type</th>
                  <th className="py-2.5 px-4">Linked Patient</th>
                  <th className="py-2.5 px-4">Time Issued</th>
                  <th className="py-2.5 px-4">Issued By</th>
                  <th className="py-2.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {!data?.recentTokens || data.recentTokens.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400">
                      <Ticket className="w-8 h-8 mx-auto text-slate-300 mb-1" />
                      No tokens have been issued yet today. Click any button above to generate.
                    </td>
                  </tr>
                ) : (
                  data.recentTokens.map((item) => {
                    const isReserved = item.tokenType === "MANUAL_RESERVED";
                    const timeStr = new Date(item.createdAt).toLocaleTimeString("en-PK", {
                      hour: "2-digit",
                      minute: "2-digit",
                      hour12: true,
                    });

                    return (
                      <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-2.5 px-4 font-mono font-black text-sm text-slate-900">
                          #{String(item.tokenNumber).padStart(2, "0")}
                        </td>
                        <td className="py-2.5 px-4">
                          {isReserved ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-800 border border-purple-200">
                              <ShieldCheck className="w-3 h-3 text-purple-600" />
                              Reserved Priority
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                              <Ticket className="w-3 h-3 text-emerald-600" />
                              Auto Sequence
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-4">
                          {item.patient ? (
                            <div>
                              <div className="font-bold text-slate-900">{item.patient.name}</div>
                              <div className="text-[10px] text-indigo-700 font-mono">
                                {item.patient.patientUid} · {item.patient.phone}
                                {item.patient.cnic && ` · CNIC: ${item.patient.cnic}`}
                              </div>
                            </div>
                          ) : (
                            <span className="text-slate-400 italic text-[11px]">Walk-in Patient</span>
                          )}
                        </td>
                        <td className="py-2.5 px-4 text-slate-600 font-mono text-[11px]">
                          {timeStr}
                        </td>
                        <td className="py-2.5 px-4 text-slate-800">
                          <div className="flex items-center gap-1.5">
                            <User className="w-3.5 h-3.5 text-slate-400" />
                            <span>{item.issuedBy?.name || "Reception Desk"}</span>
                          </div>
                        </td>
                        <td className="py-2.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {onSelectTokenForServices && (
                              <button
                                onClick={() => onSelectTokenForServices(item)}
                                className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-[11px] font-bold inline-flex items-center gap-1 transition-colors border border-indigo-200"
                                title="Select for Other Services / Diagnostic Invoicing"
                              >
                                <Layers className="w-3 h-3 text-indigo-600" />
                                <span>Services &rarr;</span>
                              </button>
                            )}
                            <button
                              onClick={() =>
                                printTokenSlip({
                                  tokenNumber: item.tokenNumber,
                                  tokenType: item.tokenType,
                                  createdAt: item.createdAt,
                                  staffName: item.issuedBy?.name,
                                  patientName: item.patient?.name,
                                  patientUid: item.patient?.patientUid,
                                  patientPhone: item.patient?.phone,
                                  patientCnic: item.patient?.cnic,
                                  services: item.services,
                                  totalFee: item.fee,
                                })
                              }
                              className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[11px] font-bold inline-flex items-center gap-1 transition-colors border border-slate-300"
                            >
                              <Printer className="w-3 h-3 text-slate-600" />
                              <span>Re-Print</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Success Modal upon Token Generation ("OPD Token Issued") */}
      {showSuccessModal && lastIssuedToken && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200 text-center animate-in zoom-in-95 duration-150">
            <div className="p-6 bg-gradient-to-b from-slate-900 to-indigo-950 text-white relative">
              <button
                onClick={() => setShowSuccessModal(false)}
                className="absolute top-4 right-4 p-1 rounded-full text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="inline-flex p-3 bg-white/10 rounded-2xl mb-2 text-amber-400">
                <Ticket className="w-8 h-8" />
              </div>
              <h3 className="text-base font-black uppercase tracking-wider text-slate-100">
                OPD Token Issued
              </h3>
              <p className="text-[11px] text-slate-300">
                Token issued successfully. Review OPD services &amp; fees, or print slip.
              </p>

              {/* Big Badge */}
              <div className="my-3 py-3 bg-white/10 rounded-2xl border border-white/20 backdrop-blur-sm">
                <div className="text-[10px] font-bold uppercase tracking-widest text-slate-300">
                  Token Number
                </div>
                <div className="text-4xl sm:text-5xl font-black font-mono text-amber-300 my-1 tracking-tight">
                  #{String(lastIssuedToken.tokenNumber).padStart(2, "0")}
                </div>
                <div>
                  <span className="inline-block px-3 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-black/40 text-emerald-300 border border-emerald-400/30">
                    {lastIssuedToken.tokenType === "MANUAL_RESERVED"
                      ? "Reserved Priority Token"
                      : "Auto Sequential Token"}
                  </span>
                </div>
              </div>

              {lastIssuedToken.patient && (
                <div className="p-2.5 bg-white/10 rounded-xl mb-3 text-left border border-white/10 text-xs">
                  <div className="text-[10px] text-slate-400 font-semibold uppercase">Linked Patient</div>
                  <div className="font-bold text-white">{lastIssuedToken.patient.name}</div>
                  <div className="text-[11px] text-emerald-300 font-mono">
                    {lastIssuedToken.patient.patientUid} · {lastIssuedToken.patient.phone}
                    {lastIssuedToken.patient.cnic && ` · CNIC: ${lastIssuedToken.patient.cnic}`}
                  </div>
                </div>
              )}

              {/* OPD Services & Fees Selection inside "OPD Token Issued" */}
              <div className="my-3 p-3 bg-white/10 rounded-2xl border border-white/15 text-left">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-200 flex items-center gap-1.5">
                    <Activity className="w-3.5 h-3.5 text-amber-400" />
                    <span>Select OPD Services &amp; Fees</span>
                  </span>
                  <span className="text-xs font-mono font-black text-amber-300 bg-black/40 px-2 py-0.5 rounded border border-amber-400/30">
                    Total: Rs. {modalTotalFee}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {OPD_SERVICE_OPTIONS.map((opt) => {
                    const isChecked = modalServiceIds.includes(opt.id);
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => toggleModalService(opt.id)}
                        className={`p-2 rounded-xl border text-left transition-all flex items-center justify-between ${
                          isChecked
                            ? "bg-emerald-600/90 text-white border-emerald-400 shadow-sm ring-1 ring-emerald-300/50"
                            : "bg-white/5 hover:bg-white/10 text-slate-300 border-white/10"
                        }`}
                      >
                        <span className="text-xs font-bold">{opt.name}</span>
                        <span
                          className={`text-[10px] font-mono font-bold ${
                            isChecked ? "text-amber-200" : "text-slate-400"
                          }`}
                        >
                          Rs. {opt.fee}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* Itemized Fees Summary */}
                <div className="mt-3 pt-2.5 border-t border-white/10 text-[11px] space-y-1">
                  {OPD_SERVICE_OPTIONS.filter((o) => modalServiceIds.includes(o.id)).map((s) => (
                    <div key={s.id} className="flex justify-between text-slate-300">
                      <span>• {s.name}</span>
                      <span className="font-mono font-bold text-white">Rs. {s.fee}</span>
                    </div>
                  ))}
                  <div className="flex justify-between text-xs font-black text-amber-300 pt-1.5 border-t border-white/10">
                    <span>TOTAL OPD FEE PAID</span>
                    <span className="font-mono text-sm">Rs. {modalTotalFee}</span>
                  </div>
                </div>
              </div>

              <div className="text-[11px] text-slate-300 space-y-1 pt-1">
                <div>
                  <span className="text-slate-400">Issued By: </span>
                  <span className="font-semibold text-white">
                    {lastIssuedToken.issuedBy?.name || "Reception Desk"}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400">Timestamp: </span>
                  <span className="font-mono text-slate-200">
                    {new Date(lastIssuedToken.createdAt).toLocaleTimeString("en-PK", {
                      hour: "2-digit",
                      minute: "2-digit",
                      hour12: true,
                    })}
                  </span>
                </div>
              </div>
            </div>

            <div className="p-4 bg-slate-50 flex items-center justify-between gap-2 border-t border-slate-200 flex-wrap">
              {onSelectTokenForServices && (
                <button
                  onClick={() => {
                    setShowSuccessModal(false);
                    onSelectTokenForServices(lastIssuedToken);
                  }}
                  className="px-3.5 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors border border-indigo-200"
                >
                  <Layers className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Other Services</span>
                </button>
              )}
              <div className="flex items-center gap-2 ml-auto">
                <button
                  onClick={() =>
                    printTokenSlip({
                      tokenNumber: lastIssuedToken.tokenNumber,
                      tokenType: lastIssuedToken.tokenType,
                      createdAt: lastIssuedToken.createdAt,
                      staffName: lastIssuedToken.issuedBy?.name,
                      patientName: lastIssuedToken.patient?.name,
                      patientUid: lastIssuedToken.patient?.patientUid,
                      patientPhone: lastIssuedToken.patient?.phone,
                      patientCnic: lastIssuedToken.patient?.cnic,
                      services: OPD_SERVICE_OPTIONS.filter((o) => modalServiceIds.includes(o.id)),
                      totalFee: modalTotalFee,
                    })
                  }
                  className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors shadow-sm"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Slip (Rs. {modalTotalFee})</span>
                </button>
                <button
                  onClick={() => setShowSuccessModal(false)}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-colors shadow-sm"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Inline Quick Register Patient Modal */}
      {showRegModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200 animate-in zoom-in-95 duration-150">
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-emerald-400" />
                <h3 className="text-sm font-bold">Quick Patient Registration</h3>
              </div>
              <button
                onClick={() => setShowRegModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleQuickRegister} className="p-5 space-y-4 text-xs">
              {regErrors.general && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl font-medium">
                  {regErrors.general}
                </div>
              )}

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Full Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Muhammad Usman"
                  value={regForm.name}
                  onChange={(e) => {
                    setRegForm((p) => ({ ...p, name: e.target.value }));
                    const err = validatePatientName(e.target.value);
                    setRegErrors((p) => ({ ...p, name: err || undefined, general: undefined }));
                  }}
                  className="w-full px-3 py-2 border rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 outline-none"
                />
                {regErrors.name && <p className="text-rose-600 text-[10px] mt-1">{regErrors.name}</p>}
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Phone Number (Pakistani Format) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="tel"
                  required
                  placeholder="0300-1234567"
                  value={regForm.phone}
                  onChange={(e) => {
                    setRegForm((p) => ({ ...p, phone: e.target.value }));
                    const err = validatePakistaniPhone(e.target.value);
                    setRegErrors((p) => ({ ...p, phone: err || undefined, general: undefined }));
                  }}
                  className="w-full px-3 py-2 border rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 outline-none"
                />
                {regErrors.phone && <p className="text-rose-600 text-[10px] mt-1">{regErrors.phone}</p>}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Age <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    min={0}
                    max={130}
                    placeholder="e.g. 35"
                    value={regForm.age}
                    onChange={(e) => {
                      setRegForm((p) => ({ ...p, age: e.target.value }));
                      const err = validatePatientAge(e.target.value);
                      setRegErrors((p) => ({ ...p, age: err || undefined, general: undefined }));
                    }}
                    className="w-full px-3 py-2 border rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 outline-none"
                  />
                  {regErrors.age && <p className="text-rose-600 text-[10px] mt-1">{regErrors.age}</p>}
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Gender</label>
                  <select
                    value={regForm.gender}
                    onChange={(e) => setRegForm((p) => ({ ...p, gender: e.target.value }))}
                    className="w-full px-3 py-2 border rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 outline-none"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block font-bold text-slate-700">
                    CNIC Number <span className="text-slate-400 font-normal">(Optional)</span>
                  </label>
                  <span className="text-[10px] font-mono text-slate-400">13 digits (35201-1234567-1)</span>
                </div>
                <input
                  type="text"
                  placeholder="e.g. 35201-1234567-1 or 3520112345671"
                  value={regForm.cnic}
                  onChange={(e) => {
                    const val = e.target.value;
                    setRegForm((p) => ({ ...p, cnic: val }));
                    if (val.trim()) {
                      const err = validatePakistaniCnic(val);
                      setRegErrors((p) => ({ ...p, cnic: err || undefined, general: undefined }));
                    } else {
                      setRegErrors((p) => ({ ...p, cnic: undefined }));
                    }
                  }}
                  className="w-full px-3 py-2 border rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 outline-none"
                />
                {regErrors.cnic && <p className="text-rose-600 text-[10px] mt-1">{regErrors.cnic}</p>}
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowRegModal(false)}
                  className="px-3.5 py-1.5 border border-slate-300 hover:bg-slate-100 rounded-xl text-xs font-semibold text-slate-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={regLoading}
                  className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors disabled:opacity-50"
                >
                  {regLoading ? "Registering..." : "Save & Attach"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

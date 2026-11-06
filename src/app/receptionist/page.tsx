"use client";

import React, { useState, useEffect } from "react";
import { Navbar } from "@/components/layout/Navbar";
import {
  Users,
  CalendarCheck,
  CreditCard,
  Activity,
  UserPlus,
  Search,
  CheckCircle2,
  Printer,
  FileText,
  AlertCircle,
  Plus,
  ArrowRight,
  Clock,
  Sparkles,
  ChevronRight,
  Phone,
  User,
  Receipt,
  Lock,
  Check,
  RotateCcw,
  BadgeAlert,
  HelpCircle,
  Ticket,
  Layers,
  X,
} from "lucide-react";
import { OpdTokenGenerationView } from "@/components/receptionist/OpdTokenGenerationView";
import {
  ThermalReceiptModal,
  ReceiptData,
} from "@/components/receipts/ThermalReceiptModal";
import { DailyAccountabilityView } from "@/components/receptionist/DailyAccountabilityView";
import {
  PatientProceedSuccessModal,
  ProcessedPatientDetails,
} from "@/components/modals/PatientProceedSuccessModal";
import {
  validatePatientName,
  validatePakistaniPhone,
  validatePatientAge,
  validatePakistaniCnic,
  validateAllPatientFields,
  PatientValidationErrors,
} from "@/lib/validation/patient";

const SERVICE_PRESETS = [
  { name: "Ultrasound Abdomen", fee: 700.0, type: "Ultrasound" },
  { name: "Ultrasound TVS", fee: 1200.0, type: "Ultrasound" },
  { name: "Ultrasound Liver, Kidney & Stomach", fee: 1200.0, type: "Ultrasound" },
];

export default function ReceptionistPortal() {
  const [activeTab, setActiveTab] = useState<"tokens" | "checkout" | "directory" | "accountability">("tokens");

  // Stats state
  const [stats, setStats] = useState({
    totalPatients: 0,
    todayVisitsCount: 0,
    todayRevenue: 0,
    breakdown: { opd: 0, ultrasound: 0, other: 0 },
  });

  // Search & Selected Patient
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [recentPatients, setRecentPatients] = useState<any[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<any | null>(null);
  const [searching, setSearching] = useState(false);

  // Active OPD Token Queue State for Other Services
  const [selectedToken, setSelectedToken] = useState<any | null>(null);
  const [todayTokens, setTodayTokens] = useState<any[]>([]);
  const [loadingTodayTokens, setLoadingTodayTokens] = useState(false);
  const [tokenSearchQuery, setTokenSearchQuery] = useState("");

  const handleSelectToken = (t: any) => {
    setSelectedToken(t);
    if (t.patient) {
      setSelectedPatient(t.patient);
      searchPatients(t.patient.patientUid);
    }
  };

  const fetchTodayTokens = async () => {
    setLoadingTodayTokens(true);
    try {
      const res = await fetch("/api/receptionist/tokens");
      if (res.ok) {
        const json = await res.json();
        setTodayTokens(json.recentTokens || []);
      }
    } catch (e) {
      console.error("Failed to load today tokens:", e);
    } finally {
      setLoadingTodayTokens(false);
    }
  };

  // New Patient Registration State
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

  // Real-time Field Constraint Handlers
  const handleNameChange = (val: string) => {
    setRegForm((prev) => ({ ...prev, name: val }));
    const err = validatePatientName(val);
    setRegErrors((prev) => ({ ...prev, name: err || undefined, general: undefined }));
  };

  const handlePhoneChange = (val: string) => {
    setRegForm((prev) => ({ ...prev, phone: val }));
    const err = validatePakistaniPhone(val);
    setRegErrors((prev) => ({ ...prev, phone: err || undefined, general: undefined }));
  };

  const handleAgeChange = (val: string) => {
    setRegForm((prev) => ({ ...prev, age: val }));
    const err = validatePatientAge(val);
    setRegErrors((prev) => ({ ...prev, age: err || undefined, general: undefined }));
  };

  const closeRegModal = () => {
    setShowRegModal(false);
    setRegErrors({});
    setRegForm({
      name: "",
      phone: "",
      age: "",
      gender: "Male",
      cnic: "",
    });
  };

  // Visit & Checkout Calculator State
  const [selectedService, setSelectedService] = useState(SERVICE_PRESETS[0]);
  const [customFee, setCustomFee] = useState<number>(SERVICE_PRESETS[0].fee);
  const [discount, setDiscount] = useState<number>(0);
  const [cashTendered, setCashTendered] = useState<number>(SERVICE_PRESETS[0].fee);
  const [issuingInvoice, setIssuingInvoice] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);

  // Thermal Receipt State
  const [activeReceipt, setActiveReceipt] = useState<ReceiptData | null>(null);
  const [receiptOpen, setReceiptOpen] = useState(false);

  // Patient Successfully Processed Modal State
  const [successModalOpen, setSuccessModalOpen] = useState(false);
  const [lastProcessedDetails, setLastProcessedDetails] = useState<ProcessedPatientDetails | null>(null);

  // Form Reset Function: Restores all patient and billing fields to default position
  const resetFormToDefault = () => {
    setSelectedPatient(null);
    setSelectedToken(null);
    setSearchQuery("");
    setSearchResults([]);
    setSelectedService(SERVICE_PRESETS[0]);
    setCustomFee(SERVICE_PRESETS[0].fee);
    setDiscount(0);
    setCashTendered(SERVICE_PRESETS[0].fee);
    setRegForm({
      name: "",
      phone: "",
      age: "",
      gender: "Male",
      cnic: "",
    });
    searchPatients("");
  };

  // Patient Directory State
  const [directoryPatients, setDirectoryPatients] = useState<any[]>([]);
  const [directoryQuery, setDirectoryQuery] = useState("");
  const [viewingPatientDetail, setViewingPatientDetail] = useState<any | null>(null);

  // Load stats
  const fetchStats = async () => {
    try {
      const res = await fetch("/api/receptionist/stats");
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Search patients
  const searchPatients = async (q: string) => {
    setSearching(true);
    try {
      const res = await fetch(`/api/receptionist/patients?query=${encodeURIComponent(q)}`);
      if (res.ok) {
        const data = await res.json();
        const pts = data.patients || [];
        setSearchResults(pts);
        if (!q.trim()) {
          setRecentPatients(pts.slice(0, 6));
        } else if (recentPatients.length === 0 && pts.length > 0) {
          setRecentPatients(pts.slice(0, 6));
        }
        if (activeTab === "directory") {
          setDirectoryPatients(pts);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSearching(false);
    }
  };

  useEffect(() => {
    fetchStats();
    searchPatients("");
    fetchTodayTokens();
  }, []);

  // Find active token for selected patient or selected token
  const activeToken =
    selectedToken ||
    todayTokens.find(
      (t) =>
        (selectedPatient && t.patientId && t.patientId === selectedPatient.id) ||
        (selectedPatient && t.patient?.id && t.patient.id === selectedPatient.id) ||
        (selectedPatient && t.patient?.patientUid && t.patient.patientUid === selectedPatient.patientUid)
    );

  const opdTokenFee = activeToken ? (activeToken.fee ?? 300) : 0;
  const serviceFee = selectedService.fee;
  const grossTotal = serviceFee + opdTokenFee;
  // Patient already paid opdTokenFee at token creation! Net cash due now at counter is ONLY the service fee!
  const netCashDueNow = serviceFee;
  const changeToReturn = Math.max(0, cashTendered - netCashDueNow);

  useEffect(() => {
    setCashTendered(selectedService.fee);
  }, [selectedService]);

  const handleServiceSelect = (preset: typeof SERVICE_PRESETS[0]) => {
    setSelectedService(preset);
    setCustomFee(preset.fee);
    setDiscount(0);
    setCashTendered(preset.fee);
  };

  const filteredTodayTokens = todayTokens.filter((t) => {
    if (!tokenSearchQuery.trim()) return true;
    const q = tokenSearchQuery.toLowerCase().trim();
    const rawNum = String(t.tokenNumber);
    const padNum = rawNum.padStart(2, "0");
    const pName = (t.patient?.name || "").toLowerCase();
    const pUid = (t.patient?.patientUid || "").toLowerCase();
    const pPhone = (t.patient?.phone || "").toLowerCase();
    const pCnic = (t.patient?.cnic || "").toLowerCase();
    return (
      rawNum === q ||
      padNum === q ||
      `#${rawNum}` === q ||
      `#${padNum}` === q ||
      `token ${rawNum}` === q ||
      `token #${rawNum}` === q ||
      pName.includes(q) ||
      pUid.includes(q) ||
      pPhone.includes(q) ||
      pCnic.includes(q)
    );
  });

  // Patient Registration Submit
  const handleRegisterPatient = async (e: React.FormEvent) => {
    e.preventDefault();

    // Enforce strict Pakistani clinical constraints
    const validationErrors = validateAllPatientFields(regForm);
    if (Object.keys(validationErrors).length > 0) {
      setRegErrors(validationErrors);
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
      const data = await res.json();
      if (res.ok) {
        setSelectedPatient(data.patient);
        setShowRegModal(false);
        setRegForm({
          name: "",
          phone: "",
          age: "",
          gender: "Male",
          cnic: "",
        });
        setRegErrors({});
        setNotification(`Patient registered successfully: ${data.patient.patientUid}`);
        fetchStats();
        searchPatients("");
        setTimeout(() => setNotification(null), 4000);
      } else {
        if (data.validationErrors) {
          setRegErrors(data.validationErrors);
        } else {
          setRegErrors({ general: data.error || "Failed to register patient" });
        }
      }
    } catch (err: any) {
      setRegErrors({ general: err.message || "Network error. Please try again." });
    } finally {
      setRegLoading(false);
    }
  };

  // Create Visit & Issue Invoice
  const handleCreateVisitAndInvoice = async () => {
    if (!selectedPatient) {
      alert("Please select or register a patient first");
      return;
    }

    setIssuingInvoice(true);
    try {
      const activeTokenForInvoice =
        selectedToken ||
        todayTokens.find(
          (t) =>
            (selectedPatient && t.patientId && t.patientId === selectedPatient.id) ||
            (selectedPatient && t.patient?.id && t.patient.id === selectedPatient.id) ||
            (selectedPatient && t.patient?.patientUid && t.patient.patientUid === selectedPatient.patientUid)
        );

      const opdFee = activeTokenForInvoice ? (activeTokenForInvoice.fee ?? 300) : 0;
      const sFee = selectedService.fee;
      const grossTotal = sFee + opdFee;
      const netCashDueNow = sFee; // Patient already paid opdFee when token was generated

      const invoiceItems: any[] = [];
      invoiceItems.push({
        description: activeTokenForInvoice
          ? `${selectedService.name} (Current Prescribed Service)`
          : selectedService.name,
        quantity: 1,
        price: sFee,
        total: sFee,
      });

      if (activeTokenForInvoice) {
        invoiceItems.push({
          description: `OPD Consultation Fee [Already Paid at Token Issue]`,
          quantity: 1,
          price: opdFee,
          total: opdFee,
        });
      }

      const res = await fetch("/api/receptionist/visits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patientId: selectedPatient.id,
          tokenId: activeTokenForInvoice?.id || undefined,
          serviceType: activeTokenForInvoice
            ? `${selectedService.name} (Consolidated with Token #${String(activeTokenForInvoice.tokenNumber).padStart(2, "0")})`
            : selectedService.name,
          fee: grossTotal,
          discount: 0,
          items: invoiceItems,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        const inv = data.invoice;
        // Construct receipt data for thermal printer
        const receipt: ReceiptData = {
          receiptNumber: inv.invoiceNumber,
          type: "CLINICAL_INVOICE",
          tokenNumber: activeTokenForInvoice?.tokenNumber,
          date: inv.createdAt,
          staffName: inv.user?.name || "Reception Desk",
          patientName: inv.patient?.name || selectedPatient.name,
          patientUid: inv.patient?.patientUid || selectedPatient.patientUid,
          items: invoiceItems,
          subtotal: grossTotal,
          discount: 0,
          totalAmount: grossTotal,
          previouslyPaidAmount: activeTokenForInvoice ? opdFee : undefined,
          netAmountPaidNow: netCashDueNow,
          cashTendered: cashTendered,
          change: Math.max(0, cashTendered - netCashDueNow),
          note: activeTokenForInvoice
            ? `Old token slip surrendered & disposed. Consolidated receipt replaces prior token receipt. OPD fee of Rs. ${opdFee} was paid at token creation.`
            : undefined,
        };

        setActiveReceipt(receipt);
        setLastProcessedDetails({
          tokenNumber: activeTokenForInvoice?.tokenNumber,
          patientName: inv.patient?.name || selectedPatient.name,
          patientUid: inv.patient?.patientUid || selectedPatient.patientUid,
          invoiceNumber: inv.invoiceNumber,
          serviceOrItems: activeTokenForInvoice
            ? `${selectedService.name} (Rs. ${sFee}) + Token #${String(activeTokenForInvoice.tokenNumber).padStart(2, "0")} OPD Fee (Rs. ${opdFee} Already Paid)`
            : selectedService.name,
          totalAmount: grossTotal,
          previouslyPaidAmount: activeTokenForInvoice ? opdFee : undefined,
          netAmountPaidNow: netCashDueNow,
          discount: 0,
          cashTendered: cashTendered,
          change: Math.max(0, cashTendered - netCashDueNow),
          staffName: inv.user?.name || "Adnan Ahmed (Receptionist)",
          portalType: "RECEPTIONIST",
        });
        setReceiptOpen(true);
        fetchStats();
        searchPatients("");
        setNotification(`Consolidated invoice ${inv.invoiceNumber} generated!`);
        setTimeout(() => setNotification(null), 4000);
      } else {
        alert(data.error || "Failed to generate invoice");
      }
    } catch (e: any) {
      alert(e.message || "Failed to process visit");
    } finally {
      setIssuingInvoice(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Banner & Notifications */}
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

        {/* Operational KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                Total Registered
              </p>
              <h3 className="text-2xl font-black text-slate-900">
                {stats.totalPatients}
              </h3>
              <p className="text-[11px] text-slate-400">Enrolled Patients</p>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              <CalendarCheck className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                Today&apos;s Clinical Visits
              </p>
              <h3 className="text-2xl font-black text-slate-900">
                {stats.todayVisitsCount}
              </h3>
              <p className="text-[11px] text-emerald-600 font-medium">
                {stats.breakdown.opd} OPD · {stats.breakdown.ultrasound} USG
              </p>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
              <Activity className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                Ultrasound Scans
              </p>
              <h3 className="text-2xl font-black text-slate-900">
                {stats.breakdown.ultrasound}
              </h3>
              <p className="text-[11px] text-slate-400">Imaging procedures today</p>
            </div>
          </div>

          <div
            onClick={() => setActiveTab("accountability")}
            className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-4 cursor-pointer hover:border-purple-300 hover:shadow-md transition-all group"
          >
            <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold group-hover:scale-105 transition-transform">
              <CreditCard className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                Today&apos;s Invoiced Fee
              </p>
              <h3 className="text-2xl font-black text-slate-900">
                Rs. {stats.todayRevenue.toLocaleString()}
              </h3>
              <p className="text-[11px] text-purple-600 font-semibold flex items-center gap-1">
                <span>View Daily Closing Summary</span>
                <span>&rarr;</span>
              </p>
            </div>
          </div>
        </div>

        {/* Tab Controls */}
        <div className="flex flex-wrap items-center justify-between border-b border-slate-200 pb-2 gap-2">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab("tokens")}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all ${
                activeTab === "tokens"
                  ? "bg-blue-600 text-white shadow-md shadow-blue-500/20"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              <Ticket className="w-4 h-4" />
              <span>OPD Token Generation</span>
            </button>
            <button
              onClick={() => {
                setActiveTab("checkout");
                fetchTodayTokens();
              }}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all ${
                activeTab === "checkout"
                  ? "bg-blue-600 text-white shadow-md shadow-blue-500/20"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>Other Services &amp; Invoicing</span>
            </button>
            <button
              onClick={() => {
                setActiveTab("directory");
                searchPatients("");
              }}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all ${
                activeTab === "directory"
                  ? "bg-blue-600 text-white shadow-md shadow-blue-500/20"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Patient Directory & Medical History</span>
            </button>
            <button
              onClick={() => setActiveTab("accountability")}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all ${
                activeTab === "accountability"
                  ? "bg-blue-600 text-white shadow-md shadow-blue-500/20"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              <Receipt className="w-4 h-4" />
              <span>Daily Sales &amp; Accountability</span>
            </button>
          </div>
        </div>

        {/* TAB 1: HYBRID OPD TOKEN GENERATION (DEFAULT) */}
        {activeTab === "tokens" && (
          <OpdTokenGenerationView
            onSelectTokenForServices={(token) => {
              setSelectedToken(token);
              if (token.patient) {
                setSelectedPatient(token.patient);
                searchPatients(token.patient.patientUid);
              }
              setActiveTab("checkout");
              fetchTodayTokens();
            }}
          />
        )}

        {/* TAB 2: OTHER SERVICES & DIAGNOSTIC INVOICING */}
        {activeTab === "checkout" && (
          <div className="space-y-6">
            {/* Active OPD Token Queue Selector */}
            <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-indigo-50 text-indigo-700 rounded-xl">
                    <Ticket className="w-5 h-5 text-indigo-600" />
                  </div>
                  <div>
                    <h3 className="text-xs sm:text-sm font-extrabold text-slate-900 flex items-center gap-2">
                      <span>Today&apos;s Active OPD Token Queue</span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800">
                        {todayTokens.length} Issued Today
                      </span>
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      Search token number, patient name, UID, or phone below to automatically identify and load the patient.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {selectedToken && (
                    <div className="flex items-center gap-2 px-3 py-1 bg-emerald-50 border border-emerald-300 rounded-xl text-xs font-bold text-emerald-800">
                      <span>Token #{String(selectedToken.tokenNumber).padStart(2, "0")} Active</span>
                      <button
                        onClick={() => setSelectedToken(null)}
                        className="text-emerald-700 hover:text-emerald-950 p-0.5"
                        title="Deselect Token"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                  <button
                    onClick={fetchTodayTokens}
                    disabled={loadingTodayTokens}
                    className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-slate-800 transition-colors"
                    title="Refresh Tokens"
                  >
                    <RotateCcw className={`w-3.5 h-3.5 ${loadingTodayTokens ? "animate-spin text-indigo-600" : ""}`} />
                  </button>
                </div>
              </div>

              {/* Centered Mounted Token Search Bar with Dropdown Menu */}
              <div className="max-w-xl mx-auto w-full relative pt-1">
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    placeholder="Search token # (e.g. 5, #05), patient name, UID, or phone number..."
                    value={tokenSearchQuery}
                    onChange={(e) => setTokenSearchQuery(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && filteredTodayTokens.length > 0) {
                        handleSelectToken(filteredTodayTokens[0]);
                        setTokenSearchQuery("");
                      }
                    }}
                    className="w-full pl-11 pr-10 py-2.5 bg-slate-50 hover:bg-white focus:bg-white border-2 border-slate-200 focus:border-indigo-500 rounded-2xl text-xs font-semibold focus:outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all text-slate-900 placeholder:text-slate-400 shadow-xs text-center"
                  />
                  {tokenSearchQuery && (
                    <button
                      type="button"
                      onClick={() => setTokenSearchQuery("")}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {/* Dropdown Menu with Sorted Values of Patient Details */}
                {tokenSearchQuery.trim() && (
                  <div className="absolute z-30 left-0 right-0 mt-1.5 bg-white border border-slate-200 rounded-2xl shadow-xl max-h-72 overflow-y-auto divide-y divide-slate-100 animate-in fade-in duration-100">
                    <div className="p-2.5 bg-slate-50 border-b border-slate-100 flex items-center justify-between text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                      <span>Matching Tokens ({filteredTodayTokens.length})</span>
                      <span>Click to Select Patient</span>
                    </div>
                    {filteredTodayTokens.length === 0 ? (
                      <div className="p-4 text-center text-xs text-slate-500">
                        No matching token or patient record found for &quot;{tokenSearchQuery}&quot;
                      </div>
                    ) : (
                      filteredTodayTokens.map((t) => (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => {
                            handleSelectToken(t);
                            setTokenSearchQuery("");
                          }}
                          className="w-full p-3 text-left hover:bg-indigo-50/80 transition-colors flex items-center justify-between group"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white font-mono font-black text-xs flex items-center justify-center shrink-0 shadow-xs">
                              #{String(t.tokenNumber).padStart(2, "0")}
                            </div>
                            <div>
                              <div className="text-xs font-extrabold text-slate-900 flex items-center gap-2">
                                <span>{t.patient?.name || "Walk-in Patient"}</span>
                                {t.patient?.patientUid && (
                                  <span className="font-mono text-[10px] font-bold text-indigo-700 bg-indigo-50 px-1.5 py-0.2 rounded border border-indigo-200">
                                    {t.patient.patientUid}
                                  </span>
                                )}
                              </div>
                              <div className="text-[11px] text-slate-500 flex items-center gap-2 mt-0.5">
                                {t.patient?.phone && <span>{t.patient.phone}</span>}
                                {t.patient?.gender && <span>· {t.patient.gender}, {t.patient.age}y</span>}
                                <span className="font-medium text-indigo-600">
                                  · {t.tokenType === "MANUAL_RESERVED" ? "Reserved Slot" : "Auto Sequence"}
                                </span>
                              </div>
                            </div>
                          </div>
                          <span className="text-[11px] font-bold text-indigo-600 group-hover:translate-x-0.5 transition-transform shrink-0">
                            Select &rarr;
                          </span>
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>

              {/* Active Token & Patient Auto-Selected Dossier Banner */}
              {selectedToken && (
                <div className="p-3 bg-gradient-to-r from-indigo-50/90 via-blue-50/70 to-emerald-50/90 border-2 border-indigo-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 animate-in fade-in">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white font-mono font-black text-sm flex items-center justify-center shadow-sm shrink-0">
                      #{String(selectedToken.tokenNumber).padStart(2, "0")}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[11px] font-black uppercase text-indigo-900 tracking-wide">
                          Token #{String(selectedToken.tokenNumber).padStart(2, "0")} Selected &rarr;
                        </span>
                        {selectedPatient ? (
                          <>
                            <span className="text-xs font-black text-slate-900">{selectedPatient.name}</span>
                            <span className="text-[10px] font-mono font-bold bg-white px-2 py-0.5 rounded border border-indigo-200 text-indigo-700">
                              {selectedPatient.patientUid}
                            </span>
                            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full flex items-center gap-1">
                              <Check className="w-3 h-3 text-emerald-600" />
                              <span>Patient Auto-Loaded</span>
                            </span>
                          </>
                        ) : (
                          <span className="text-xs text-slate-500 italic">No patient attached to this token</span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-600 mt-0.5">
                        Patient profile is active in Step 1 &amp; Step 2 below. Select the prescribed Ultrasound or clinical service to issue receipt.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => setSelectedToken(null)}
                      className="text-xs font-bold px-2.5 py-1 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg text-slate-700 transition-colors shadow-2xs"
                    >
                      Deselect Token
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Top Row: 2 Parallel Cards (Grid 2 Cols) */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
              {/* Card 1 (Left): Active Patient Identified OR Patient Selector */}
              <div className="h-full">
                {selectedPatient ? (
                  /* Active Patient Identified Card View */
                  <div className="bg-white p-5 rounded-2xl border-2 border-indigo-200 shadow-sm space-y-4 h-full flex flex-col justify-between animate-in fade-in">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                      <div className="flex items-center gap-2">
                        <div className="p-2 bg-emerald-50 text-emerald-700 rounded-xl">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        </div>
                        <div>
                          <h3 className="text-xs font-black uppercase tracking-wider text-slate-800">
                            Active Patient Identified
                          </h3>
                          <p className="text-[11px] text-slate-500">
                            Patient dossier loaded for diagnostic services
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          setSelectedPatient(null);
                          setSelectedToken(null);
                        }}
                        className="text-xs font-bold text-slate-600 hover:text-slate-900 px-2.5 py-1 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors border border-slate-200"
                      >
                        Change Patient
                      </button>
                    </div>

                    {/* Patient Information Content */}
                    <div className="p-4 bg-gradient-to-br from-indigo-50/80 via-blue-50/50 to-white border border-indigo-200/80 rounded-2xl space-y-3.5 flex-1 flex flex-col justify-between">
                      <div>
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-xl bg-indigo-600 text-white font-black text-base flex items-center justify-center shadow-sm shrink-0">
                              {selectedPatient.name[0]?.toUpperCase() || "P"}
                            </div>
                            <div>
                              <h4 className="text-base font-black text-slate-900 leading-tight">
                                {selectedPatient.name}
                              </h4>
                              <div className="flex items-center gap-2 mt-1 flex-wrap">
                                <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-indigo-100 text-indigo-800 border border-indigo-200">
                                  {selectedPatient.patientUid}
                                </span>
                                {selectedToken && (
                                  <span className="font-mono text-xs font-black px-2 py-0.5 rounded bg-amber-100 text-amber-900 border border-amber-300">
                                    Token #{String(selectedToken.tokenNumber).padStart(2, "0")}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          <span className="text-[11px] font-bold text-indigo-900 bg-white px-2.5 py-1 rounded-lg border border-indigo-200 shrink-0">
                            {selectedPatient.visits?.length || 0} Total Visits
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-3 pt-3 mt-3 border-t border-indigo-100/80 text-xs">
                          <div>
                            <span className="text-[10px] uppercase font-bold text-slate-400 block">Phone Number</span>
                            <span className="font-semibold text-slate-800 flex items-center gap-1.5 mt-0.5">
                              <Phone className="w-3.5 h-3.5 text-indigo-600" />
                              {selectedPatient.phone}
                            </span>
                          </div>
                          <div>
                            <span className="text-[10px] uppercase font-bold text-slate-400 block">Demographics</span>
                            <span className="font-semibold text-slate-800 mt-0.5 block">
                              {selectedPatient.age} yrs · {selectedPatient.gender}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Prior Service History */}
                      {selectedPatient.visits && selectedPatient.visits.length > 0 && (
                        <div className="pt-2 border-t border-indigo-100/80">
                          <span className="text-[10px] font-bold text-indigo-950 uppercase block mb-1">
                            Prior Service History:
                          </span>
                          <div className="flex flex-wrap gap-1">
                            {selectedPatient.visits.slice(0, 3).map((v: any, idx: number) => (
                              <span
                                key={v.id || idx}
                                className="px-2 py-0.5 bg-white rounded-md border border-indigo-200 text-[10px] font-semibold text-slate-700"
                              >
                                {v.serviceType} (Rs. {v.fee})
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  /* Waiting for Patient Selection State with direct search */
                  <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-4 h-full flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-slate-500" />
                          <h3 className="text-xs font-black uppercase tracking-wider text-slate-700">
                            Patient Identification
                          </h3>
                        </div>
                      </div>

                      <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-center space-y-2 mt-3">
                        <div className="w-10 h-10 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto">
                          <Ticket className="w-5 h-5" />
                        </div>
                        <p className="text-xs font-bold text-slate-800">
                          Select a Token to Identify Patient
                        </p>
                        <p className="text-[11px] text-slate-500 max-w-xs mx-auto">
                          Search or click any token in <strong>Today&apos;s Active OPD Token Queue</strong> above. The patient dossier will load automatically here.
                        </p>
                      </div>
                    </div>

                    {/* Direct Search fallback */}
                    <div className="relative pt-1">
                      <div className="relative">
                        <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                        <input
                          type="text"
                          value={searchQuery}
                          onChange={(e) => {
                            setSearchQuery(e.target.value);
                            searchPatients(e.target.value);
                          }}
                          placeholder="Or search patient by name, phone, or UID..."
                          className="w-full pl-9 pr-8 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-slate-900 font-medium"
                        />
                        {searchQuery && (
                          <button
                            onClick={() => {
                              setSearchQuery("");
                              searchPatients("");
                            }}
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>

                      {searchQuery.trim().length > 0 && searchResults.length > 0 && (
                        <div className="mt-2 space-y-1 max-h-40 overflow-y-auto divide-y divide-slate-100 bg-white border border-slate-200 rounded-xl p-1 shadow-sm">
                          {searchResults.map((p) => (
                            <button
                              key={p.id}
                              type="button"
                              onClick={() => {
                                setSelectedPatient(p);
                                setSearchQuery("");
                                setSearchResults([]);
                              }}
                              className="w-full text-left p-2 rounded-lg hover:bg-indigo-50/80 transition-colors flex items-center justify-between"
                            >
                              <div>
                                <div className="text-xs font-bold text-slate-900">{p.name}</div>
                                <div className="text-[11px] text-slate-500 font-mono">
                                  {p.patientUid} · {p.phone}
                                </div>
                              </div>
                              <span className="text-[10px] font-bold text-indigo-600 px-2 py-0.5 bg-indigo-50 rounded">
                                Select
                              </span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Card 2 (Right): Prescribed Ultrasound Services (Fast Selection) */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-4 h-full flex flex-col justify-between">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-amber-50 text-amber-600 rounded-xl">
                      <Sparkles className="w-4 h-4 text-amber-600" />
                    </div>
                    <div>
                      <h4 className="text-xs font-black uppercase tracking-wider text-slate-800">
                        Prescribed Ultrasound Services (Fast Selection)
                      </h4>
                      <p className="text-[11px] text-slate-500">
                        Click to select diagnostic procedure with fixed fee
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full border border-amber-200 self-start sm:self-auto">
                    Fixed Hospital Tariff
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 flex-1">
                  {[
                    {
                      name: "Ultrasound Abdomen",
                      fee: 700,
                      tag: "Abdomen",
                    },
                    {
                      name: "Ultrasound TVS",
                      fee: 1200,
                      tag: "TVS",
                    },
                    {
                      name: "Ultrasound Liver, Kidney & Stomach",
                      fee: 1200,
                      tag: "L / K / S",
                    },
                  ].map((us) => {
                    const isSelected = selectedService.name === us.name;
                    return (
                      <button
                        key={us.name}
                        type="button"
                        onClick={() => {
                          const match = SERVICE_PRESETS.find((s) => s.name === us.name) || {
                            name: us.name,
                            fee: us.fee,
                            type: "Ultrasound",
                          };
                          handleServiceSelect(match);
                        }}
                        className={`p-3.5 rounded-xl border text-left transition-all flex flex-col justify-between ${
                          isSelected
                            ? "bg-amber-500 text-white border-amber-600 shadow-md ring-2 ring-amber-400/40 scale-[1.02]"
                            : "bg-slate-50 hover:bg-amber-50/60 border-slate-200 text-slate-900 hover:border-amber-300"
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between gap-1 mb-1">
                            <span className={`text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded ${
                              isSelected ? "bg-white/20 text-white" : "bg-amber-100 text-amber-900 border border-amber-200"
                            }`}>
                              {us.tag}
                            </span>
                            {isSelected && (
                              <span className="text-[10px] font-black bg-white text-amber-700 px-1.5 py-0.2 rounded">
                                ✓ Active
                              </span>
                            )}
                          </div>
                          <h5 className="text-xs font-black leading-snug">{us.name}</h5>
                        </div>

                        <div className="mt-3 pt-2 border-t border-slate-200/50 flex items-baseline justify-between">
                          <span className={`text-[10px] font-semibold ${isSelected ? "text-amber-100" : "text-slate-500"}`}>
                            Fee:
                          </span>
                          <span className={`text-sm font-black font-mono ${isSelected ? "text-white" : "text-slate-900"}`}>
                            Rs. {us.fee.toLocaleString()}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>

                <div className="p-2.5 bg-amber-50/70 border border-amber-200/70 rounded-xl text-[11px] text-amber-900 flex items-center justify-between">
                  <span className="font-semibold">Selected Service:</span>
                  <span className="font-bold text-amber-950">
                    {selectedService.name} (Rs. {selectedService.fee.toLocaleString()})
                  </span>
                </div>
              </div>
            </div>

            {/* Below Both Cards: Cashier Calculator Card (TOTAL WIDTH of Both Cards) */}
            <div className="bg-slate-900 text-white p-6 rounded-2xl space-y-4 shadow-md w-full">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
                    Cashier Calculator
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                    Cash Tender Only Editable
                  </span>
                </div>
                <span className="text-xs font-mono text-cyan-400">
                  Official Sequential Invoice
                </span>
              </div>

              {/* Prominent OPD Token Fee Breakdown Banner */}
              {activeToken ? (
                <div className="p-3.5 bg-gradient-to-r from-indigo-950 via-slate-900 to-indigo-950 border border-indigo-500/40 rounded-xl space-y-2.5 shadow-inner">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white font-mono font-black text-sm flex items-center justify-center shrink-0 shadow-md shadow-indigo-600/40 border border-indigo-400/40">
                        #{String(activeToken.tokenNumber).padStart(2, "0")}
                      </div>
                      <div>
                        <div className="text-xs font-black text-white flex items-center gap-2">
                          <span>OPD TOKEN #{String(activeToken.tokenNumber).padStart(2, "0")} LINKED</span>
                          <span className="text-[10px] font-mono font-bold text-emerald-300 bg-emerald-950/80 px-2 py-0.5 rounded-full border border-emerald-700/60">
                            Rs. {opdTokenFee} Already Paid
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-300 mt-0.5">
                          Patient paid <strong className="text-emerald-300">Rs. {opdTokenFee}</strong> when token was created. <strong className="text-amber-300">Take old token slip &amp; dispose it</strong>. Net cash due now: <strong className="text-emerald-400">Rs. {netCashDueNow}</strong>.
                        </p>
                      </div>
                    </div>
                    <div className="text-right shrink-0 bg-slate-800/90 px-3 py-1.5 rounded-lg border border-slate-700">
                      <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 block">Cash To Collect Now</span>
                      <span className="text-base font-mono font-black text-emerald-400">
                        Rs. {netCashDueNow.toLocaleString()}
                      </span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-800/80 grid grid-cols-3 text-center text-[10px] font-mono">
                    <div className="text-slate-400">
                      <span className="block uppercase text-[9px] font-bold text-slate-400">Current Service</span>
                      <span className="text-white font-bold">Rs. {serviceFee}</span>
                    </div>
                    <div className="text-slate-400 border-x border-slate-800">
                      <span className="block uppercase text-[9px] font-bold text-emerald-400">Paid at Token</span>
                      <span className="text-emerald-400 font-bold">- Rs. {opdTokenFee}</span>
                    </div>
                    <div className="text-slate-400">
                      <span className="block uppercase text-[9px] font-bold text-amber-400">Consolidated Total</span>
                      <span className="text-amber-300 font-bold">Rs. {grossTotal}</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-2.5 bg-slate-800/60 border border-slate-700/50 rounded-xl text-xs text-slate-400 flex items-center justify-between">
                  <span>No OPD token linked yet for this patient session.</span>
                  <span className="font-bold text-slate-300">Service Fee: Rs. {serviceFee}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* 1. Current Service Fee (NON-EDITABLE) */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[11px] font-medium text-slate-400">
                      Current Service Fee (Rs.)
                    </label>
                    <span className="text-[9px] font-bold text-slate-400 uppercase flex items-center gap-0.5">
                      <Lock className="w-2.5 h-2.5" />
                      <span>Locked</span>
                    </span>
                  </div>
                  <div className="relative">
                    <input
                      type="text"
                      readOnly
                      disabled
                      value={`Rs. ${serviceFee.toLocaleString()}`}
                      className="w-full bg-slate-800/80 border border-slate-700/80 rounded-xl px-3 py-2 text-xs font-extrabold text-slate-200 cursor-not-allowed select-none pl-8"
                    />
                    <Lock className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2.5" />
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1">
                    {selectedService.name} (Preset Standard)
                  </p>
                </div>

                {/* 2. Paid at Token Creation (NON-EDITABLE) */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[11px] font-medium text-slate-400">
                      Paid at Token Creation (Rs.)
                    </label>
                    <span className="text-[9px] font-bold text-emerald-400 uppercase flex items-center gap-0.5">
                      <Check className="w-2.5 h-2.5" />
                      <span>Settled</span>
                    </span>
                  </div>
                  <div className="relative">
                    <input
                      type="text"
                      readOnly
                      disabled
                      value={
                        activeToken
                          ? `Rs. ${opdTokenFee} (Already Paid)`
                          : "Rs. 0"
                      }
                      className="w-full bg-slate-800/80 border border-slate-700/80 rounded-xl px-3 py-2 text-xs font-extrabold text-emerald-400 cursor-not-allowed select-none pl-8"
                    />
                    <Lock className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2.5" />
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1">
                    {activeToken ? `Token #${String(activeToken.tokenNumber).padStart(2, "0")} OPD fee collected earlier` : "No prior token"}
                  </p>
                </div>

                {/* 3. Cash Tendered (ONLY EDITABLE FIELD) */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[11px] font-bold text-cyan-300">
                      Cash Tendered Now (Rs.) *
                    </label>
                    <span className="text-[9px] font-black uppercase text-cyan-400 bg-cyan-950 px-1.5 py-0.2 rounded border border-cyan-800">
                      Editable
                    </span>
                  </div>
                  <input
                    type="number"
                    min="0"
                    step="50"
                    value={cashTendered || ""}
                    onChange={(e) => setCashTendered(parseFloat(e.target.value) || 0)}
                    placeholder="Amount received"
                    className="w-full bg-slate-800 border-2 border-cyan-400/90 focus:border-cyan-300 rounded-xl px-3 py-2 text-sm font-black text-cyan-300 focus:outline-none focus:ring-2 focus:ring-cyan-400/50 shadow-inner"
                  />
                  <p className="text-[10px] text-cyan-400/80 mt-1">
                    Cash received now for {selectedService.name}
                  </p>
                </div>
              </div>

              {/* Quick Cash Tender Shortcut Buttons */}
              <div className="pt-2 border-t border-slate-800 flex flex-wrap items-center gap-1.5">
                <span className="text-[10px] font-bold text-slate-400 mr-1">
                  Quick Tender:
                </span>
                <button
                  type="button"
                  onClick={() => setCashTendered(netCashDueNow)}
                  className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-cyan-950 text-cyan-300 border border-cyan-700 hover:bg-cyan-900 transition-colors"
                >
                  Exact (Rs. {netCashDueNow.toLocaleString()})
                </button>
                {[500, 700, 1000, 1200, 1500, 2000, 5000].map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setCashTendered(amt)}
                    className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-slate-800 text-slate-300 border border-slate-700 hover:bg-slate-700 hover:text-white transition-colors"
                  >
                    Rs. {amt.toLocaleString()}
                  </button>
                ))}
              </div>

              {/* Summary Bar */}
              <div className="pt-3 border-t border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs sm:text-sm">
                <div>
                  <span className="text-slate-400">Net Due Now:</span>
                  <span className="ml-2 text-lg sm:text-xl font-black text-white">
                    Rs. {netCashDueNow.toLocaleString()}
                  </span>
                  <span className="ml-2 text-xs text-slate-400 font-mono">
                    ({selectedService.name} · Consolidated Total: Rs. {grossTotal})
                  </span>
                </div>

                <div>
                  {cashTendered >= netCashDueNow ? (
                    <div className="flex items-center gap-1">
                      <span className="text-slate-400">Change Due:</span>
                      <span className="ml-1 text-base sm:text-lg font-black text-emerald-400">
                        Rs. {changeToReturn.toLocaleString()}
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1 text-rose-400">
                      <span className="text-xs font-semibold">Short by:</span>
                      <span className="font-bold text-sm">
                        Rs. {(netCashDueNow - cashTendered).toLocaleString()}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Below that: Action Button CENTER ALIGNED */}
            <div className="flex items-center justify-center pt-2 pb-6">
              <button
                type="button"
                onClick={handleCreateVisitAndInvoice}
                disabled={!selectedPatient || issuingInvoice}
                className="w-full sm:w-auto min-w-[340px] max-w-xl py-4 px-8 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-700 hover:to-indigo-800 text-white rounded-2xl font-black text-sm sm:text-base flex items-center justify-center gap-3 shadow-xl shadow-blue-500/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:scale-[1.01] active:scale-[0.99]"
              >
                <Printer className="w-5 h-5" />
                <span>
                  {issuingInvoice
                    ? "Recording & Generating Invoice..."
                    : selectedPatient
                    ? `Issue Invoice for ${selectedPatient.name} (Collect: Rs. ${netCashDueNow.toLocaleString()} · Token #${activeToken ? String(activeToken.tokenNumber).padStart(2, "0") : "N/A"} Paid: Rs. ${opdTokenFee})`
                    : "⚠️ Please Select a Patient Above First"}
                </span>
              </button>
            </div>
          </div>
        )}

        {/* TAB 2: PATIENT DIRECTORY & MEDICAL ARCHIVE */}
        {activeTab === "directory" && (
          <div className="space-y-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="relative w-full sm:w-96">
                <Search className="w-4 h-4 absolute inset-y-0 left-3 my-auto text-slate-400" />
                <input
                  type="text"
                  placeholder="Filter by name, phone, or PAT-UID..."
                  value={directoryQuery}
                  onChange={(e) => {
                    setDirectoryQuery(e.target.value);
                    searchPatients(e.target.value);
                  }}
                  className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900"
                />
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  onClick={() => setShowRegModal(true)}
                  className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Enroll Patient</span>
                </button>
              </div>
            </div>

            {/* Patients Table */}
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-700">
                  <thead className="bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-200">
                    <tr>
                      <th className="px-5 py-3.5">Patient UID</th>
                      <th className="px-5 py-3.5">Full Name</th>
                      <th className="px-5 py-3.5">Contact</th>
                      <th className="px-5 py-3.5">Age / Gender</th>
                      <th className="px-5 py-3.5">Visits</th>
                      <th className="px-5 py-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {searchResults.map((patient) => (
                      <tr
                        key={patient.id}
                        className="hover:bg-slate-50/80 transition-colors"
                      >
                        <td className="px-5 py-3.5 font-mono font-bold text-blue-700">
                          {patient.patientUid}
                        </td>
                        <td className="px-5 py-3.5 font-semibold text-slate-900">
                          {patient.name}
                        </td>
                        <td className="px-5 py-3.5 text-slate-500">{patient.phone}</td>
                        <td className="px-5 py-3.5">
                          {patient.age} yrs · {patient.gender}
                        </td>
                        <td className="px-5 py-3.5 font-semibold text-slate-800">
                          {patient.visits?.length || 0} visits
                        </td>
                        <td className="px-5 py-3.5 text-right space-x-2">
                          <button
                            onClick={() => {
                              setSelectedPatient(patient);
                              setActiveTab("checkout");
                            }}
                            className="px-2.5 py-1 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg text-xs font-semibold"
                          >
                            New Visit
                          </button>
                          <button
                            onClick={() => setViewingPatientDetail(patient)}
                            className="px-2.5 py-1 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-lg text-xs font-semibold"
                          >
                            History
                          </button>
                        </td>
                      </tr>
                    ))}
                    {searchResults.length === 0 && (
                      <tr>
                        <td
                          colSpan={7}
                          className="px-5 py-8 text-center text-slate-400 text-xs"
                        >
                          No patients found matching the query.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: DAILY SALES & ACCOUNTABILITY */}
        {activeTab === "accountability" && (
          <DailyAccountabilityView />
        )}

        {/* Patient Registration Modal */}
        {showRegModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
            <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-100">
              <div className="p-5 bg-gradient-to-r from-slate-900 to-indigo-950 text-white flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center border border-blue-400/30">
                    <UserPlus className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold">New Patient Registration</h3>
                    <p className="text-[11px] text-slate-400">
                      Pakistani hospital clinical standards &amp; sequential PAT-UID generation
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={closeRegModal}
                  className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleRegisterPatient} className="p-6 space-y-4">
                {/* General Error Banner */}
                {regErrors.general && (
                  <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-start gap-2 animate-in fade-in">
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                    <span className="font-medium">{regErrors.general}</span>
                  </div>
                )}

                {/* 1. Full Legal Name with Pakistani Clinical Constraints */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                      Patient Full Legal Name *
                    </label>
                    <span className="text-[10px] font-mono text-slate-400">
                      Letters A-Z only
                    </span>
                  </div>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Muhammad Usman Khan"
                    value={regForm.name}
                    onChange={(e) => handleNameChange(e.target.value)}
                    className={`w-full bg-slate-50 border rounded-xl px-3 py-2.5 text-xs font-semibold text-slate-900 focus:outline-none transition-all ${
                      regErrors.name
                        ? "border-rose-400 focus:ring-2 focus:ring-rose-400/50 bg-rose-50/30"
                        : regForm.name.length >= 2 && !validatePatientName(regForm.name)
                        ? "border-emerald-400 focus:ring-2 focus:ring-emerald-400/40 bg-emerald-50/20"
                        : "border-slate-200 focus:ring-2 focus:ring-blue-500"
                    }`}
                  />
                  {regErrors.name ? (
                    <p className="text-[11px] text-rose-600 font-semibold mt-1 flex items-center gap-1.5 animate-in fade-in">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      <span>{regErrors.name}</span>
                    </p>
                  ) : regForm.name.length >= 2 && !validatePatientName(regForm.name) ? (
                    <p className="text-[11px] text-emerald-600 font-semibold mt-1 flex items-center gap-1.5">
                      <Check className="w-3.5 h-3.5 shrink-0" />
                      <span>Valid legal name format</span>
                    </p>
                  ) : (
                    <p className="text-[10px] text-slate-400 mt-1">
                      Constraint: Must start with a letter (A-Z). Cannot start with spaces, numbers, or symbols.
                    </p>
                  )}
                </div>

                {/* 2. Pakistani Mobile & Age Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Pakistani Phone Number Field */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                        Pakistani Mobile *
                      </label>
                      <span className="text-[10px] font-mono text-slate-400">
                        03XX-XXXXXXX
                      </span>
                    </div>
                    <input
                      type="text"
                      required
                      placeholder="0300-1234567"
                      value={regForm.phone}
                      onChange={(e) => handlePhoneChange(e.target.value)}
                      className={`w-full bg-slate-50 border rounded-xl px-3 py-2.5 text-xs font-semibold text-slate-900 focus:outline-none transition-all ${
                        regErrors.phone
                          ? "border-rose-400 focus:ring-2 focus:ring-rose-400/50 bg-rose-50/30"
                          : regForm.phone.length >= 10 && !validatePakistaniPhone(regForm.phone)
                          ? "border-emerald-400 focus:ring-2 focus:ring-emerald-400/40 bg-emerald-50/20"
                          : "border-slate-200 focus:ring-2 focus:ring-blue-500"
                      }`}
                    />
                    {regErrors.phone ? (
                      <p className="text-[11px] text-rose-600 font-semibold mt-1 flex items-center gap-1.5 animate-in fade-in">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                        <span>{regErrors.phone}</span>
                      </p>
                    ) : regForm.phone.length >= 10 && !validatePakistaniPhone(regForm.phone) ? (
                      <p className="text-[11px] text-emerald-600 font-semibold mt-1 flex items-center gap-1.5">
                        <Check className="w-3.5 h-3.5 shrink-0" />
                        <span>Valid Pakistani mobile (PTA verified)</span>
                      </p>
                    ) : (
                      <p className="text-[10px] text-slate-400 mt-1">
                        Constraint: Standard 11-digit mobile starting with 03 (e.g. 0300-1234567).
                      </p>
                    )}
                  </div>

                  {/* Age Section with Constraints */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                        Age (Years) *
                      </label>
                      <span className="text-[10px] font-mono text-slate-400">
                        0–125 yrs
                      </span>
                    </div>
                    <input
                      type="text"
                      required
                      placeholder="e.g. 34"
                      value={regForm.age}
                      onChange={(e) => handleAgeChange(e.target.value)}
                      onKeyDown={(e) => {
                        // Disallow negative, plus, decimals, and exponential keys
                        if (["e", "E", "+", "-", "."].includes(e.key)) {
                          e.preventDefault();
                        }
                      }}
                      className={`w-full bg-slate-50 border rounded-xl px-3 py-2.5 text-xs font-semibold text-slate-900 focus:outline-none transition-all ${
                        regErrors.age
                          ? "border-rose-400 focus:ring-2 focus:ring-rose-400/50 bg-rose-50/30"
                          : regForm.age && !validatePatientAge(regForm.age)
                          ? "border-emerald-400 focus:ring-2 focus:ring-emerald-400/40 bg-emerald-50/20"
                          : "border-slate-200 focus:ring-2 focus:ring-blue-500"
                      }`}
                    />
                    {regErrors.age ? (
                      <p className="text-[11px] text-rose-600 font-semibold mt-1 flex items-center gap-1.5 animate-in fade-in">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                        <span>{regErrors.age}</span>
                      </p>
                    ) : regForm.age && !validatePatientAge(regForm.age) ? (
                      <p className="text-[11px] text-emerald-600 font-semibold mt-1 flex items-center gap-1.5">
                        <Check className="w-3.5 h-3.5 shrink-0" />
                        <span>Valid age ({regForm.age} yrs)</span>
                      </p>
                    ) : (
                      <p className="text-[10px] text-slate-400 mt-1">
                        Constraint: Positive whole number (0 for newborn infant to 125).
                      </p>
                    )}
                  </div>
                </div>

                {/* 3. Gender Selection */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                    Gender *
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {["Male", "Female", "Other"].map((g) => (
                      <button
                        type="button"
                        key={g}
                        onClick={() => {
                          setRegForm({ ...regForm, gender: g });
                          setRegErrors((prev) => ({ ...prev, gender: undefined }));
                        }}
                        className={`py-2 text-xs font-bold rounded-xl border transition-all ${
                          regForm.gender === g
                            ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                            : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                        }`}
                      >
                        {g}
                      </button>
                    ))}
                  </div>
                  {regErrors.gender && (
                    <p className="text-[11px] text-rose-600 font-semibold mt-1 flex items-center gap-1.5">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      <span>{regErrors.gender}</span>
                    </p>
                  )}
                </div>

                {/* 4. Optional Pakistani CNIC */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                      Pakistani CNIC <span className="text-slate-400 font-normal normal-case">(Optional)</span>
                    </label>
                    <span className="text-[10px] font-mono text-slate-400">
                      13 digits (35201-1234567-1)
                    </span>
                  </div>
                  <input
                    type="text"
                    placeholder="e.g. 35201-1234567-1 or 3520112345671"
                    value={regForm.cnic || ""}
                    onChange={(e) => {
                      const val = e.target.value;
                      setRegForm((prev) => ({ ...prev, cnic: val }));
                      if (val.trim()) {
                        const err = validatePakistaniCnic(val);
                        setRegErrors((prev) => ({ ...prev, cnic: err || undefined, general: undefined }));
                      } else {
                        setRegErrors((prev) => ({ ...prev, cnic: undefined }));
                      }
                    }}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                  />
                  {regErrors.cnic && (
                    <p className="text-[11px] text-rose-600 font-semibold mt-1 flex items-center gap-1.5 animate-in fade-in">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      <span>{regErrors.cnic}</span>
                    </p>
                  )}
                </div>

                {/* Form Footer Buttons */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={closeRegModal}
                    className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-900 rounded-xl hover:bg-slate-100 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={
                      regLoading ||
                      !!regErrors.name ||
                      !!regErrors.phone ||
                      !!regErrors.age
                    }
                    className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black shadow-md shadow-blue-600/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>{regLoading ? "Validating & Enrolling..." : "Complete Registration"}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Patient Medical History Drawer / Modal */}
        {viewingPatientDetail && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
            <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[85vh] flex flex-col overflow-hidden border border-slate-100">
              <div className="p-5 bg-gradient-to-r from-slate-900 to-indigo-950 text-white flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold">{viewingPatientDetail.name}</h3>
                    <span className="font-mono text-xs px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 font-semibold border border-blue-400/30">
                      {viewingPatientDetail.patientUid}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {viewingPatientDetail.age} yrs · {viewingPatientDetail.gender} ·{" "}
                    {viewingPatientDetail.phone}
                  </p>
                </div>
                <button
                  onClick={() => setViewingPatientDetail(null)}
                  className="text-slate-400 hover:text-white"
                >
                  ✕
                </button>
              </div>

              <div className="p-6 overflow-y-auto space-y-6">
                {/* Clinical Visits */}
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2 flex items-center gap-1.5">
                    <CalendarCheck className="w-4 h-4 text-blue-600" />
                    Clinical Visits & Service History
                  </h4>
                  {viewingPatientDetail.visits?.length > 0 ? (
                    <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
                      {viewingPatientDetail.visits.map((v: any) => (
                        <div
                          key={v.id}
                          className="p-3 bg-slate-50/50 flex items-center justify-between text-xs"
                        >
                          <div>
                            <div className="font-bold text-slate-800">
                              {v.serviceType}
                            </div>
                            <div className="text-[11px] text-slate-500">
                              {new Date(v.createdAt).toLocaleDateString()}
                            </div>
                          </div>
                          <span className="font-mono font-bold text-slate-900">
                            Rs. {v.fee.toLocaleString()}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 italic">No recorded visits.</p>
                  )}
                </div>

                {/* Invoices */}
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2 flex items-center gap-1.5">
                    <FileText className="w-4 h-4 text-emerald-600" />
                    Hospital Invoices Issued
                  </h4>
                  {viewingPatientDetail.invoices?.length > 0 ? (
                    <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
                      {viewingPatientDetail.invoices.map((inv: any) => (
                        <div
                          key={inv.id}
                          className="p-3 bg-slate-50/50 flex items-center justify-between text-xs"
                        >
                          <div>
                            <span className="font-mono font-bold text-blue-600">
                              {inv.invoiceNumber}
                            </span>
                            <span className="ml-2 text-slate-500">
                              {new Date(inv.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                              {inv.status}
                            </span>
                            <span className="font-bold text-slate-900">
                              Rs. {inv.totalAmount.toLocaleString()}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 italic">No invoices found.</p>
                  )}
                </div>

                {/* Pharmacy Purchases */}
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2 flex items-center gap-1.5">
                    <Activity className="w-4 h-4 text-purple-600" />
                    Pharmacy Dispensary Purchases
                  </h4>
                  {viewingPatientDetail.pharmacySales?.length > 0 ? (
                    <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
                      {viewingPatientDetail.pharmacySales.map((sale: any) => (
                        <div
                          key={sale.id}
                          className="p-3 bg-slate-50/50 flex items-center justify-between text-xs"
                        >
                          <div>
                            <span className="font-mono font-bold text-purple-600">
                              {sale.saleNumber}
                            </span>
                            <span className="ml-2 text-slate-500">
                              {new Date(sale.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                          <div className="flex items-center gap-3">
                            {sale.discount > 0 && (
                              <span className="text-[10px] text-emerald-600 font-semibold">
                                -Rs. {sale.discount.toLocaleString()} discount
                              </span>
                            )}
                            <span className="font-bold text-slate-900">
                              Rs. {sale.totalAmount.toLocaleString()}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 italic">
                      No pharmacy purchases linked to this Patient UID yet.
                    </p>
                  )}
                </div>
              </div>

              <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
                <button
                  onClick={() => setViewingPatientDetail(null)}
                  className="px-4 py-2 bg-slate-200 hover:bg-slate-300 rounded-xl text-xs font-bold text-slate-800"
                >
                  Close Archive
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Thermal Receipt Modal */}
        <ThermalReceiptModal
          receipt={activeReceipt}
          isOpen={receiptOpen}
          onClose={() => {
            // User closed or cancelled printing: return sequentially to dashboard without resetting
            setReceiptOpen(false);
          }}
          onPrint={() => {
            // User completed printing: close receipt, reset form to default, and show 2-second success modal
            setReceiptOpen(false);
            resetFormToDefault();
            setSuccessModalOpen(true);
          }}
        />

        {/* Patient Successfully Processed Modal Dialog */}
        <PatientProceedSuccessModal
          isOpen={successModalOpen}
          onClose={() => setSuccessModalOpen(false)}
          onReprint={() => {
            setSuccessModalOpen(false);
            setReceiptOpen(true);
          }}
          details={lastProcessedDetails}
        />
      </main>
    </div>
  );
}


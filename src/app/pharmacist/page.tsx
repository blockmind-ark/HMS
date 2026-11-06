"use client";

import React, { useState, useEffect } from "react";
import { Navbar } from "@/components/layout/Navbar";
import {
  Pill,
  Search,
  ShoppingCart,
  Trash2,
  Plus,
  Minus,
  CheckCircle2,
  AlertTriangle,
  Printer,
  Sparkles,
  Layers,
  ArrowRight,
  User,
  ShieldCheck,
  Calendar,
  Banknote,
  Tag,
  Clock,
  Send,
  AlertCircle,
  Package,
  Receipt,
  Truck,
  Scissors,
  Stethoscope,
  Ticket,
  RotateCcw,
  Check,
  X,
  Lock,
  Phone,
  Filter,
} from "lucide-react";
import {
  ThermalReceiptModal,
  ReceiptData,
} from "@/components/receipts/ThermalReceiptModal";
import { DailyAccountabilityView } from "@/components/pharmacist/DailyAccountabilityView";
import { VendorManagementView } from "@/components/admin/VendorManagementView";
import { MedicinePurchaseSheetView } from "@/components/inventory/MedicinePurchaseSheetView";
import {
  PatientProceedSuccessModal,
  ProcessedPatientDetails,
} from "@/components/modals/PatientProceedSuccessModal";

interface CartItem {
  medicineId: string;
  medicineName: string;
  genericName: string;
  itemType?: "MEDICINE" | "SURGICAL";
  batchId: string;
  batchNumber: string;
  quantity: number;
  maxStock: number;
  unitPrice: number;
  originalPrice?: number;
  perOff?: number;
  isGeneric: boolean;
}

const DEFAULT_CATEGORIES = [
  "All",
  "Tablets & Capsules",
  "Syrups & Suspensions",
  "Injections & Ampoules",
  "IV Cannulas",
  "Syringes & Needles",
  "IV Infusions & Fluids",
  "Sutures & Blades",
  "Catheters & Drainage",
  "Gloves & Protection",
  "Bandages & Dressings",
  "Creams & Ointments",
  "Inhalers & Respiratory",
  "Sachets & Nutritional",
  "Eye & Ear Drops",
];

// Feature toggle: Set to true when ready to re-enable the Vendors & Supply Orders tab
const SHOW_VENDORS_TAB = false;

const SERVICE_PRESETS = [
  { name: "Ultrasound Abdomen", fee: 700.0, type: "Ultrasound" },
  { name: "Ultrasound TVS", fee: 1200.0, type: "Ultrasound" },
  { name: "Ultrasound Liver, Kidney & Stomach", fee: 1200.0, type: "Ultrasound" },
];

export default function PharmacistPortal() {
  const [activeTab, setActiveTab] = useState<"pos" | "services" | "inventory" | "accountability" | "vendors">("pos");
  const [inventorySubTab, setInventorySubTab] = useState<"purchaseSheet" | "batches">("purchaseSheet");

  // Daily Summary Stats for KPI cards
  const [dailyStats, setDailyStats] = useState({
    todayRevenue: 0,
    totalUnitsSold: 0,
    totalSalesCount: 0,
    uniqueMedicinesCount: 0,
  });

  // Low Stock State
  const [lowStockItems, setLowStockItems] = useState<any[]>([]);
  const [lowStockCount, setLowStockCount] = useState<number>(0);
  const [filterLowStockOnly, setFilterLowStockOnly] = useState<boolean>(false);

  const fetchDailyStats = async () => {
    try {
      const res = await fetch("/api/pharmacist/daily-summary");
      if (res.ok) {
        const data = await res.json();
        setDailyStats({
          todayRevenue: data.summary?.totalRevenue || 0,
          totalUnitsSold: data.summary?.totalUnitsSold || 0,
          totalSalesCount: data.summary?.totalSalesCount || 0,
          uniqueMedicinesCount: data.summary?.uniqueMedicinesCount || 0,
        });
        if (data.lowStockItems) {
          setLowStockItems(data.lowStockItems);
          setLowStockCount(data.lowStockCount ?? data.lowStockItems.length);
        }
      }
    } catch (e) {
      console.error("Failed to load daily stats:", e);
    }
  };

  // Catalog State
  const [medicines, setMedicines] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [activeItemType, setActiveItemType] = useState<"ALL" | "MEDICINE" | "SURGICAL">("ALL");
  const [catalogSummary, setCatalogSummary] = useState<{
    totalMedicines: number;
    totalSurgical: number;
    totalCombined: number;
    categories: string[];
  }>({
    totalMedicines: 289,
    totalSurgical: 45,
    totalCombined: 334,
    categories: DEFAULT_CATEGORIES,
  });
  const [loadingCatalog, setLoadingCatalog] = useState(false);

  // Cart & POS State
  const [cart, setCart] = useState<CartItem[]>([]);
  const [patientUidInput, setPatientUidInput] = useState("");
  const [linkedPatient, setLinkedPatient] = useState<any | null>(null);
  const [patientLookupLoading, setPatientLookupLoading] = useState(false);
  const [cashTendered, setCashTendered] = useState<number>(0);
  const [checkingOut, setCheckingOut] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);

  // Thermal Receipt State
  const [activeReceipt, setActiveReceipt] = useState<ReceiptData | null>(null);
  const [receiptOpen, setReceiptOpen] = useState(false);

  // Patient / Order Successfully Processed Modal State
  const [successModalOpen, setSuccessModalOpen] = useState(false);
  const [lastProcessedDetails, setLastProcessedDetails] = useState<ProcessedPatientDetails | null>(null);

  // Active OPD Token Queue State for Pharmacy POS
  const [selectedToken, setSelectedToken] = useState<any | null>(null);
  const [todayTokens, setTodayTokens] = useState<any[]>([]);
  const [loadingTodayTokens, setLoadingTodayTokens] = useState(false);
  const [tokenSearchQuery, setTokenSearchQuery] = useState("");

  const handleSelectToken = (t: any) => {
    setSelectedToken(t);
    if (t.patient) {
      setLinkedPatient(t.patient);
      setPatientUidInput(t.patient.patientUid);
      setNotification(`Linked to Token #${String(t.tokenNumber).padStart(2, "0")} · ${t.patient.name} (${t.patient.patientUid})`);
      setTimeout(() => setNotification(null), 4000);
    } else {
      setNotification(`Selected Token #${String(t.tokenNumber).padStart(2, "0")}`);
      setTimeout(() => setNotification(null), 3000);
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

  const handleSelectPatient = (patient: any) => {
    setLinkedPatient(patient);
    setPatientUidInput(patient.patientUid);
    setNotification(`Linked to Patient: ${patient.name} (${patient.patientUid})`);
    setTimeout(() => setNotification(null), 4000);
  };

  // Other Services & Invoicing Tab State
  const [selectedService, setSelectedService] = useState<{
    name: string;
    fee: number;
    type: string;
  }>(SERVICE_PRESETS[0]);
  const [servicesSelectedPatient, setServicesSelectedPatient] = useState<any | null>(null);
  const [servicesSelectedToken, setServicesSelectedToken] = useState<any | null>(null);
  const [servicesSearchQuery, setServicesSearchQuery] = useState("");
  const [servicesSearchResults, setServicesSearchResults] = useState<any[]>([]);
  const [servicesSearching, setServicesSearching] = useState(false);
  const [servicesCashTendered, setServicesCashTendered] = useState<number>(700);
  const [issuingServiceInvoice, setIssuingServiceInvoice] = useState(false);
  const [servicesTokenSearchQuery, setServicesTokenSearchQuery] = useState("");

  // Form Reset Function: Restores all POS and Other Services fields to default position
  const resetFormToDefault = () => {
    setCart([]);
    setLinkedPatient(null);
    setSelectedToken(null);
    setPatientUidInput("");
    setCashTendered(0);
    setSearchQuery("");
    setTokenSearchQuery("");
    setActiveItemType("ALL");
    setSelectedCategory("All");
    fetchTodayTokens();
    // Also reset Other Services & Invoicing tab state
    setServicesSelectedPatient(null);
    setServicesSelectedToken(null);
    setServicesSearchQuery("");
    setServicesSearchResults([]);
    setServicesTokenSearchQuery("");
    setSelectedService(SERVICE_PRESETS[0]);
    setServicesCashTendered(SERVICE_PRESETS[0].fee);
  };

  const handleSelectServicesToken = (t: any) => {
    setServicesSelectedToken(t);
    if (t.patient) {
      setServicesSelectedPatient(t.patient);
      searchServicesPatients(t.patient.patientUid);
    }
  };

  const searchServicesPatients = async (query: string) => {
    if (!query.trim()) {
      setServicesSearchResults([]);
      return;
    }
    setServicesSearching(true);
    try {
      const res = await fetch(`/api/receptionist/patients?search=${encodeURIComponent(query)}`);
      if (res.ok) {
        const data = await res.json();
        setServicesSearchResults(data.patients || []);
      }
    } catch (e) {
      console.error("Patient search failed:", e);
    } finally {
      setServicesSearching(false);
    }
  };

  const handleServiceSelect = (preset: { name: string; fee: number; type: string }) => {
    setSelectedService(preset);
    setServicesCashTendered(preset.fee);
  };

  const handleCreateVisitAndInvoice = async () => {
    if (!servicesSelectedPatient) {
      alert("Please select a patient first.");
      return;
    }

    setIssuingServiceInvoice(true);
    try {
      const activeTokenForInvoice =
        servicesSelectedToken ||
        todayTokens.find(
          (t) =>
            (servicesSelectedPatient && t.patientId && t.patientId === servicesSelectedPatient.id) ||
            (servicesSelectedPatient && t.patient?.id && t.patient.id === servicesSelectedPatient.id) ||
            (servicesSelectedPatient && t.patient?.patientUid && t.patient.patientUid === servicesSelectedPatient.patientUid)
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
          patientId: servicesSelectedPatient.id,
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
        const receipt: ReceiptData = {
          receiptNumber: inv.invoiceNumber,
          type: "CLINICAL_INVOICE",
          tokenNumber: activeTokenForInvoice?.tokenNumber,
          date: inv.createdAt,
          staffName: inv.user?.name || "Pharmacist Desk",
          patientName: inv.patient?.name || servicesSelectedPatient.name,
          patientUid: inv.patient?.patientUid || servicesSelectedPatient.patientUid,
          items: invoiceItems,
          subtotal: grossTotal,
          discount: 0,
          totalAmount: grossTotal,
          previouslyPaidAmount: activeTokenForInvoice ? opdFee : undefined,
          netAmountPaidNow: netCashDueNow,
          cashTendered: servicesCashTendered,
          change: Math.max(0, servicesCashTendered - netCashDueNow),
          note: activeTokenForInvoice
            ? `Old token slip surrendered & disposed. Consolidated receipt replaces prior token receipt. OPD fee of Rs. ${opdFee} was paid at token creation.`
            : undefined,
        };

        setActiveReceipt(receipt);
        setLastProcessedDetails({
          tokenNumber: activeTokenForInvoice?.tokenNumber,
          patientName: inv.patient?.name || servicesSelectedPatient.name,
          patientUid: inv.patient?.patientUid || servicesSelectedPatient.patientUid,
          invoiceNumber: inv.invoiceNumber,
          serviceOrItems: activeTokenForInvoice
            ? `${selectedService.name} (Rs. ${sFee}) + Token #${String(activeTokenForInvoice.tokenNumber).padStart(2, "0")} OPD Fee (Rs. ${opdFee} Already Paid)`
            : selectedService.name,
          totalAmount: grossTotal,
          previouslyPaidAmount: activeTokenForInvoice ? opdFee : undefined,
          netAmountPaidNow: netCashDueNow,
          discount: 0,
          cashTendered: servicesCashTendered,
          change: Math.max(0, servicesCashTendered - netCashDueNow),
          staffName: inv.user?.name || "Pharmacist Desk",
          portalType: "PHARMACIST",
        });
        // Open printing option first; when user prints or finishes, onPrint/onClose shows the "Patient Proceed Successfully" modal
        setReceiptOpen(true);
        fetchDailyStats();
        fetchTodayTokens();
        searchServicesPatients("");
        setNotification(`Consolidated invoice ${inv.invoiceNumber} generated!`);
        setTimeout(() => setNotification(null), 4000);
      } else {
        alert(data.error || "Failed to generate invoice");
      }
    } catch (e: any) {
      alert(e.message || "Failed to process visit");
    } finally {
      setIssuingServiceInvoice(false);
    }
  };

  // Inventory & Batch Request State
  const [batches, setBatches] = useState<any[]>([]);
  const [showBatchModal, setShowBatchModal] = useState(false);
  const [batchForm, setBatchForm] = useState({
    medicineId: "",
    newMedicineName: "",
    newGenericName: "",
    newCategory: "General",
    threshold: "10",
    newThreshold: "10",
    perOff: "0",
    batchNumber: "",
    quantity: "100",
    purchasePrice: "50.00",
    sellingPrice: "80.00",
    mfgDate: new Date().toISOString().split("T")[0],
    expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000 * 2)
      .toISOString()
      .split("T")[0],
    reason: "Restock order for dispensary.",
  });
  const [submittingBatch, setSubmittingBatch] = useState(false);

  const openRestockForMedicine = (med: any) => {
    setBatchForm({
      medicineId: med.id,
      newMedicineName: "",
      newGenericName: "",
      newCategory: med.category || "General",
      threshold: String(med.threshold ?? 10),
      newThreshold: String(med.threshold ?? 10),
      perOff: String(med.perOff ?? 0),
      batchNumber: `BATCH-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
      quantity: "100",
      purchasePrice: String(med.purchasePrice || 50),
      sellingPrice: String(med.sellingPrice || 80),
      mfgDate: new Date().toISOString().split("T")[0],
      expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000 * 2)
        .toISOString()
        .split("T")[0],
      reason: `Low stock replenishment batch for ${med.name} (live stock: ${med.totalStock ?? 0}, safety threshold: ${med.threshold ?? 10}, per-off: ${med.perOff ?? 0}%).`,
    });
    setShowBatchModal(true);
  };

  // Fetch medicines & surgical supplies
  const fetchMedicines = async () => {
    setLoadingCatalog(true);
    try {
      const res = await fetch(
        `/api/pharmacist/medicines?query=${encodeURIComponent(
          searchQuery
        )}&category=${encodeURIComponent(selectedCategory)}&itemType=${encodeURIComponent(activeItemType)}&lowStockOnly=${filterLowStockOnly ? "true" : "false"}`
      );
      if (res.ok) {
        const data = await res.json();
        setMedicines(data.medicines || []);
        if (data.summary) {
          setCatalogSummary({
            totalMedicines: data.summary.totalMedicines || 0,
            totalSurgical: data.summary.totalSurgical || 0,
            totalCombined: data.summary.totalCombined || 0,
            categories: data.summary.categories || DEFAULT_CATEGORIES,
          });
          if (data.summary.lowStockCount !== undefined) {
            setLowStockCount(data.summary.lowStockCount);
          }
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingCatalog(false);
    }
  };

  // Fetch all batches for inventory tab
  const fetchBatches = async () => {
    try {
      const res = await fetch("/api/pharmacist/batches");
      if (res.ok) {
        const data = await res.json();
        setBatches(data.batches);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchMedicines();
    fetchDailyStats();
    fetchTodayTokens();
  }, [searchQuery, selectedCategory, activeItemType, filterLowStockOnly]);

  useEffect(() => {
    if (activeTab === "inventory") {
      fetchBatches();
    } else if (activeTab === "pos") {
      fetchTodayTokens();
    }
  }, [activeTab]);

  // Add medicine or surgical item to cart
  const addToCart = (med: any) => {
    if (!med.activeBatch || med.totalStock <= 0) return;

    setCart((prevCart) => {
      const existing = prevCart.find((it) => it.medicineId === med.id);
      if (existing) {
        if (existing.quantity >= med.activeBatch.quantity) {
          alert(`Cannot exceed available batch stock (${med.activeBatch.quantity})`);
          return prevCart;
        }
        return prevCart.map((it) =>
          it.medicineId === med.id ? { ...it, quantity: it.quantity + 1 } : it
        );
      } else {
        return [
          ...prevCart,
          {
            medicineId: med.id,
            medicineName: med.name,
            genericName: med.genericName,
            itemType: med.itemType || "MEDICINE",
            batchId: med.activeBatch.id,
            batchNumber: med.activeBatch.batchNumber,
            quantity: 1,
            maxStock: med.activeBatch.quantity,
            unitPrice: med.sellingPrice,
            originalPrice: med.originalPrice || med.sellingPrice,
            perOff: med.perOff || 0,
            isGeneric: Boolean(med.isGeneric),
          },
        ];
      }
    });
  };

  // Cart quantity controls
  const updateQuantity = (medicineId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((it) => {
          if (it.medicineId === medicineId) {
            const nextQty = it.quantity + delta;
            if (nextQty <= 0) return null;
            if (nextQty > it.maxStock) {
              alert(`Only ${it.maxStock} units available in active batch`);
              return it;
            }
            return { ...it, quantity: nextQty };
          }
          return it;
        })
        .filter(Boolean) as CartItem[]
    );
  };

  const removeFromCart = (medicineId: string) => {
    setCart((prev) => prev.filter((it) => it.medicineId !== medicineId));
  };

  // Patient UID Lookup
  const handleLookupPatient = async () => {
    if (!patientUidInput.trim()) return;
    setPatientLookupLoading(true);
    try {
      const res = await fetch(
        `/api/receptionist/patients?query=${encodeURIComponent(patientUidInput.trim())}`
      );
      if (res.ok) {
        const data = await res.json();
        const matched = data.patients?.[0];
        if (matched) {
          setLinkedPatient(matched);
          setNotification(`Linked to Patient: ${matched.name} (${matched.patientUid})`);
          setTimeout(() => setNotification(null), 4000);
        } else {
          alert("No patient found with this Patient UID or phone number");
          setLinkedPatient(null);
        }
      }
    } catch (e: any) {
      alert("Failed to lookup patient");
    } finally {
      setPatientLookupLoading(false);
    }
  };

  // Cart Calculations:
  // Auto-applied 5% Generic discount
  const rawSubtotal = cart.reduce((sum, it) => sum + it.quantity * it.unitPrice, 0);

  const genericDiscountTotal = cart.reduce((sum, it) => {
    if (it.isGeneric) {
      // 5% discount on generic medicine
      return sum + it.quantity * it.unitPrice * 0.05;
    }
    return sum;
  }, 0);

  const netPayable = Math.max(0, rawSubtotal - genericDiscountTotal);
  const changeToReturn = Math.max(0, (cashTendered || 0) - netPayable);

  // Auto-sync cash tendered on cart update
  useEffect(() => {
    setCashTendered(netPayable);
  }, [netPayable]);

  // Complete POS Checkout
  const handleCheckout = async () => {
    if (cart.length === 0) {
      alert("Cart is empty");
      return;
    }

    setCheckingOut(true);
    try {
      const res = await fetch("/api/pharmacist/pos/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patientId: linkedPatient ? linkedPatient.id : null,
          items: cart,
          discount: genericDiscountTotal,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        const sale = data.sale;

        // Construct receipt data for ESC/POS printer
        const receipt: ReceiptData = {
          receiptNumber: sale.saleNumber,
          type: "PHARMACY_SALE",
          tokenNumber: selectedToken ? selectedToken.tokenNumber : undefined,
          date: sale.createdAt,
          staffName: sale.user?.name || "Dispensary Pharmacist",
          patientName: sale.patient ? sale.patient.name : "Walk-in Customer",
          patientUid: sale.patient ? sale.patient.patientUid : undefined,
          items: cart.map((it) => ({
            description: `${it.itemType === "SURGICAL" ? "[SURG] " : ""}${it.medicineName} (${it.batchNumber})`,
            quantity: it.quantity,
            price: it.unitPrice,
            total: it.quantity * it.unitPrice,
          })),
          subtotal: rawSubtotal,
          discount: genericDiscountTotal,
          totalAmount: sale.totalAmount,
          cashTendered: cashTendered,
          change: changeToReturn,
        };

        setActiveReceipt(receipt);
        setLastProcessedDetails({
          patientName: sale.patient ? sale.patient.name : "Walk-in Customer",
          patientUid: sale.patient ? sale.patient.patientUid : "OTC",
          invoiceNumber: sale.saleNumber,
          serviceOrItems: cart.map((it) => `${it.medicineName} (${it.quantity})`).join(", "),
          totalAmount: sale.totalAmount,
          discount: genericDiscountTotal,
          cashTendered: cashTendered,
          change: changeToReturn,
          staffName: sale.user?.name || "Muhammad Tariq (Pharmacist)",
          portalType: "PHARMACIST",
        });
        setReceiptOpen(true);
        fetchMedicines();
        fetchDailyStats();
        setNotification(`Dispensary Sale ${sale.saleNumber} completed!`);
        setTimeout(() => setNotification(null), 4000);
      } else {
        alert(data.error || "POS checkout failed");
      }
    } catch (e: any) {
      alert(e.message || "Failed to process sale");
    } finally {
      setCheckingOut(false);
    }
  };

  // Submit Restock Batch Request
  const handleSubmitBatchRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingBatch(true);
    try {
      const res = await fetch("/api/pharmacist/batches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(batchForm),
      });
      const data = await res.json();
      if (res.ok) {
        setShowBatchModal(false);
        setNotification(
          `Batch request for ${data.batch.batchNumber} submitted! Routed to Admin Approvals Center.`
        );
        fetchBatches();
        fetchMedicines();
        setTimeout(() => setNotification(null), 5000);
      } else {
        alert(data.error || "Failed to submit batch request");
      }
    } catch (e: any) {
      alert(e.message || "Network error");
    } finally {
      setSubmittingBatch(false);
    }
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

  const filteredServicesTodayTokens = todayTokens.filter((t) => {
    if (!servicesTokenSearchQuery.trim()) return true;
    const q = servicesTokenSearchQuery.toLowerCase().trim();
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

        {/* Operational KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div
            onClick={() => setActiveTab("accountability")}
            className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-4 cursor-pointer hover:border-amber-300 hover:shadow-md transition-all group"
          >
            <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold group-hover:scale-105 transition-transform">
              <Banknote className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                Today&apos;s POS Sales
              </p>
              <h3 className="text-2xl font-black text-slate-900">
                Rs. {dailyStats.todayRevenue.toLocaleString()}
              </h3>
              <p className="text-[11px] text-amber-600 font-semibold flex items-center gap-1">
                <span>View Daily Closing Summary</span>
                <span>&rarr;</span>
              </p>
            </div>
          </div>

          <div
            onClick={() => setActiveTab("accountability")}
            className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-4 cursor-pointer hover:border-blue-300 hover:shadow-md transition-all group"
          >
            <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold group-hover:scale-105 transition-transform">
              <Package className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                Units Dispensed Today
              </p>
              <h3 className="text-2xl font-black text-blue-900">
                {dailyStats.totalUnitsSold} <span className="text-xs font-normal text-slate-500">units</span>
              </h3>
              <p className="text-[11px] text-blue-600 font-medium">Tablets, bottles &amp; packs</p>
            </div>
          </div>

          <div
            onClick={() => setActiveTab("accountability")}
            className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-4 cursor-pointer hover:border-purple-300 hover:shadow-md transition-all group"
          >
            <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold group-hover:scale-105 transition-transform">
              <Receipt className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                Prescriptions Completed
              </p>
              <h3 className="text-2xl font-black text-slate-900">
                {dailyStats.totalSalesCount}
              </h3>
              <p className="text-[11px] text-purple-600 font-medium">POS receipts issued</p>
            </div>
          </div>

          <div
            onClick={() => setActiveTab("accountability")}
            className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-4 cursor-pointer hover:border-emerald-300 hover:shadow-md transition-all group"
          >
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold group-hover:scale-105 transition-transform">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                Cash Reconciled
              </p>
              <h3 className="text-2xl font-black text-emerald-700">
                Rs. {(5000 + dailyStats.todayRevenue).toLocaleString()}
              </h3>
              <p className="text-[11px] text-slate-400 font-medium">Float + Sales in drawer</p>
            </div>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex flex-wrap items-center justify-between border-b border-slate-200 pb-2 gap-2">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab("pos")}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all ${
                activeTab === "pos"
                  ? "bg-amber-600 text-white shadow-md shadow-amber-500/20"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              <ShoppingCart className="w-4 h-4" />
              <span>POS Billing &amp; Dispensary</span>
            </button>
            <button
              onClick={() => {
                setActiveTab("services");
                fetchTodayTokens();
              }}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all ${
                activeTab === "services"
                  ? "bg-amber-600 text-white shadow-md shadow-amber-500/20"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>Other Services &amp; Invoicing</span>
            </button>
            <button
              onClick={() => setActiveTab("inventory")}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all ${
                activeTab === "inventory"
                  ? "bg-amber-600 text-white shadow-md shadow-amber-500/20"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>Stock Batches &amp; Restock Requests</span>
            </button>
            <button
              onClick={() => setActiveTab("accountability")}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all ${
                activeTab === "accountability"
                  ? "bg-amber-600 text-white shadow-md shadow-amber-500/20"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              <Receipt className="w-4 h-4" />
              <span>Daily Sales &amp; Accountability</span>
            </button>
            {SHOW_VENDORS_TAB && (
              <button
                onClick={() => setActiveTab("vendors")}
                className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all ${
                  activeTab === "vendors"
                    ? "bg-amber-600 text-white shadow-md shadow-amber-500/20"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                <Truck className="w-4 h-4" />
                <span>Vendors &amp; Supply Orders</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab("accountability")}
              className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors border border-slate-200"
            >
              <Printer className="w-3.5 h-3.5 text-amber-600" />
              <span>Shift Summary Preview</span>
            </button>

            {activeTab === "inventory" && (
              <button
                onClick={() => setShowBatchModal(true)}
                className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors shadow-sm"
              >
                <Plus className="w-3.5 h-3.5 text-amber-400" />
                <span>Submit Batch Request</span>
              </button>
            )}
          </div>
        </div>

        {/* Prominent Real-Time Low-Stock Alert Alarm Banner */}
        {lowStockCount > 0 && (
          <div className="bg-gradient-to-r from-red-500/10 via-amber-500/10 to-rose-500/10 border-2 border-red-500/40 rounded-2xl p-4 sm:p-5 shadow-sm space-y-3 animate-in fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-red-600 text-white flex items-center justify-center font-bold shadow-md shadow-red-500/30 animate-pulse flex-shrink-0">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-black bg-red-600 text-white uppercase tracking-wider">
                      🔴 Low Stock Alert Alarm
                    </span>
                    <span className="text-xs sm:text-sm font-extrabold text-red-950">
                      {lowStockCount} {lowStockCount === 1 ? "Item" : "Items"} at or below Warning Threshold
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 mt-0.5">
                    Live dispensary stock is at or below defined safety limits (<code>quantity &le; threshold</code>). Click any item below to immediately submit a restock batch request.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                <button
                  type="button"
                  onClick={() => {
                    setFilterLowStockOnly(!filterLowStockOnly);
                    if (activeTab !== "pos") setActiveTab("pos");
                  }}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm ${
                    filterLowStockOnly
                      ? "bg-red-700 text-white shadow-red-700/20"
                      : "bg-white border border-red-300 text-red-800 hover:bg-red-50"
                  }`}
                >
                  <Filter className="w-3.5 h-3.5" />
                  <span>{filterLowStockOnly ? "Showing Low-Stock (Filtered)" : "Filter Low-Stock in POS"}</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    if (lowStockItems.length > 0) {
                      openRestockForMedicine(lowStockItems[0]);
                    } else {
                      setShowBatchModal(true);
                    }
                  }}
                  className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors shadow-sm flex-shrink-0"
                >
                  <Plus className="w-3.5 h-3.5 text-amber-400" />
                  <span>Restock Intake</span>
                </button>
              </div>
            </div>

            {/* Low-Stock Item Badges */}
            <div className="flex flex-wrap items-center gap-2 pt-1">
              {lowStockItems.slice(0, 10).map((item: any) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => openRestockForMedicine(item)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-red-200 hover:border-red-400 hover:bg-red-50/60 rounded-xl text-xs shadow-sm transition-all text-left group"
                  title={`Click to initiate restock batch for ${item.name}`}
                >
                  <span className="font-extrabold text-slate-900 group-hover:text-red-700 transition-colors">
                    {item.name}
                  </span>
                  <span className="text-[10px] text-slate-400">({item.category})</span>
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-black bg-red-100 text-red-800">
                    Remaining: {item.totalStock}
                  </span>
                  <span className="text-[10px] text-slate-500 font-medium">
                    Limit: {item.threshold}
                  </span>
                  <span className="text-[10px] font-bold text-amber-700 underline ml-0.5">
                    + Restock
                  </span>
                </button>
              ))}
              {lowStockItems.length > 10 && (
                <span className="text-xs font-bold text-red-700 self-center pl-1">
                  +{lowStockItems.length - 10} more low-stock items
                </span>
              )}
            </div>
          </div>
        )}

        {/* TAB 1: POS BILLING & DISPENSARY */}
        {activeTab === "pos" && (
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
                        onClick={() => {
                          setSelectedToken(null);
                          setLinkedPatient(null);
                          setPatientUidInput("");
                        }}
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
                        {linkedPatient ? (
                          <>
                            <span className="text-xs font-black text-slate-900">{linkedPatient.name}</span>
                            <span className="text-[10px] font-mono font-bold bg-white px-2 py-0.5 rounded border border-indigo-200 text-indigo-700">
                              {linkedPatient.patientUid}
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
                        Patient profile is active in POS checkout below. Add prescribed medicines or surgical supplies to bill.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedToken(null);
                        setLinkedPatient(null);
                        setPatientUidInput("");
                      }}
                      className="text-xs font-bold px-2.5 py-1 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg text-slate-700 transition-colors shadow-2xs"
                    >
                      Deselect Token
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* 2. CENTER SECTION: Search Controls & Complete Stock Directory (Placed between Token Queue and Bottom Cart) */}
            <div className="space-y-4">
              {/* Item Type Selector & Search Controls */}
              <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm space-y-3">
                {/* Item Type Switcher (All vs Medicines vs Surgical) */}
                <div className="grid grid-cols-3 gap-2 p-1.5 bg-slate-100/90 rounded-2xl border border-slate-200">
                  <button
                    type="button"
                    onClick={() => {
                      setActiveItemType("ALL");
                      setSelectedCategory("All");
                    }}
                    className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                      activeItemType === "ALL"
                        ? "bg-white text-slate-900 shadow-sm border border-slate-200"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    <Layers className="w-3.5 h-3.5 text-amber-600" />
                    <span>All Inventory</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full font-mono bg-slate-200/80 text-slate-700">
                      {catalogSummary.totalCombined}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setActiveItemType("MEDICINE");
                      setSelectedCategory("All");
                    }}
                    className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                      activeItemType === "MEDICINE"
                        ? "bg-emerald-600 text-white shadow-sm shadow-emerald-600/30"
                        : "text-slate-600 hover:text-emerald-700 hover:bg-emerald-50/60"
                    }`}
                  >
                    <Pill className="w-3.5 h-3.5" />
                    <span>Medicines</span>
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono ${
                        activeItemType === "MEDICINE"
                          ? "bg-emerald-700 text-white"
                          : "bg-emerald-100 text-emerald-800"
                      }`}
                    >
                      {catalogSummary.totalMedicines}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setActiveItemType("SURGICAL");
                      setSelectedCategory("All");
                    }}
                    className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                      activeItemType === "SURGICAL"
                        ? "bg-sky-600 text-white shadow-sm shadow-sky-600/30"
                        : "text-slate-600 hover:text-sky-700 hover:bg-sky-50/60"
                    }`}
                  >
                    <Scissors className="w-3.5 h-3.5" />
                    <span>Surgical &amp; Supplies</span>
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono ${
                        activeItemType === "SURGICAL"
                          ? "bg-sky-700 text-white"
                          : "bg-sky-100 text-sky-800"
                      }`}
                    >
                      {catalogSummary.totalSurgical}
                    </span>
                  </button>
                </div>

                {/* Instant Search Bar with Search Button */}
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Search className="w-4 h-4 absolute inset-y-0 left-3 my-auto text-slate-400" />
                    <input
                      type="text"
                      placeholder={
                        activeItemType === "SURGICAL"
                          ? "Search by Surgical Name (Cannula, Syringe, Saline, Suture, Catheter), Gauge, or Batch No..."
                          : activeItemType === "MEDICINE"
                          ? "Search by Medicine Name (Augmentin, Panadol, Acefyl, Abocal), Form, or Batch No..."
                          : "Search all 334 medicines & surgical items by name, specification, or batch..."
                      }
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          fetchMedicines();
                        }
                      }}
                      className="w-full pl-9 pr-9 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 text-slate-900 placeholder:text-slate-400"
                    />
                    {searchQuery && (
                      <button
                        type="button"
                        onClick={() => {
                          setSearchQuery("");
                        }}
                        className="absolute right-3 inset-y-0 my-auto text-slate-400 hover:text-slate-600 p-0.5"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => fetchMedicines()}
                    className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors shadow-sm"
                  >
                    <Search className="w-3.5 h-3.5" />
                    <span>Search</span>
                  </button>
                </div>

                {/* Categories Scrollable Pills */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                  {catalogSummary.categories.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                        selectedCategory === cat
                          ? "bg-amber-100 text-amber-900 border border-amber-300 shadow-xs"
                          : "bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200"
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Medicines & Surgical Catalog - Tabular View (Shows 3 items by default, full list when searched) */}
              <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden flex flex-col">
                <div className="p-3.5 bg-slate-50/80 border-b border-slate-200 flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-amber-600" />
                    <span>
                      {searchQuery.trim()
                        ? `Search Results (${medicines.length} matching items)`
                        : `Dispensary & POS Complete Stock Directory (Showing 3 of ${catalogSummary.totalCombined})`}
                    </span>
                  </span>
                  <span className="text-[11px] text-slate-400">
                    {searchQuery.trim()
                      ? "Search matches displayed below"
                      : "Type in search box above & hit search to filter all inventory"}
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead className="bg-slate-100 text-[10px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200 shadow-xs">
                      <tr>
                        <th className="py-2.5 px-3">Item Name &amp; Spec</th>
                        <th className="py-2.5 px-2">Type &amp; Category</th>
                        <th className="py-2.5 px-2">Batch / Expiry</th>
                        <th className="py-2.5 px-2">Stock Available</th>
                        <th className="py-2.5 px-3 text-right">Price (Rs.)</th>
                        <th className="py-2.5 px-3 text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {medicines.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="py-12 text-center text-slate-400">
                            {loadingCatalog
                              ? "Loading inventory catalog..."
                              : `No medicine or surgical items found matching "${searchQuery}".`}
                          </td>
                        </tr>
                      ) : (
                        (searchQuery.trim() ? medicines : medicines.slice(0, 3)).map((med) => {
                          const outOfStock = med.totalStock <= 0;
                          const isSurgical = med.itemType === "SURGICAL";

                          return (
                            <tr
                              key={med.id}
                              className={`transition-colors ${
                                outOfStock
                                  ? "bg-slate-50/70 opacity-60"
                                  : isSurgical
                                  ? "hover:bg-sky-50/40"
                                  : "hover:bg-amber-50/40"
                              }`}
                            >
                              <td className="py-2.5 px-3">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span className="font-extrabold text-slate-900 text-xs">
                                    {med.name}
                                  </span>
                                  {isSurgical ? (
                                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-sky-100 text-sky-800 border border-sky-300">
                                      <Scissors className="w-2.5 h-2.5" />
                                      Surgical
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-300">
                                      <Pill className="w-2.5 h-2.5" />
                                      Medicine
                                    </span>
                                  )}
                                  {med.isGeneric && (
                                    <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-amber-100 text-amber-800 border border-amber-200 whitespace-nowrap">
                                      <Sparkles className="w-2.5 h-2.5" />
                                      5% Generic
                                    </span>
                                  )}
                                </div>
                                <p className="text-[11px] text-slate-500 font-medium">
                                  {med.genericName}
                                </p>
                              </td>
                              <td className="py-2.5 px-2">
                                <span
                                  className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-semibold whitespace-nowrap ${
                                    isSurgical
                                      ? "bg-sky-50 text-sky-700 border border-sky-200"
                                      : "bg-slate-100 text-slate-600 border border-slate-200"
                                  }`}
                                >
                                  {med.category}
                                </span>
                              </td>
                              <td className="py-2.5 px-2">
                                <div className="font-mono text-[10px] font-bold text-slate-800">
                                  {med.batchNumber || "—"}
                                </div>
                                {med.expiryDate && (
                                  <div className="text-[10px] text-slate-400">
                                    Exp:{" "}
                                    {new Date(med.expiryDate).toLocaleDateString(
                                      "en-GB",
                                      { month: "short", year: "numeric" }
                                    )}
                                  </div>
                                )}
                              </td>
                              <td className="py-2.5 px-2">
                                {outOfStock ? (
                                  <span className="inline-block px-2 py-0.5 rounded-md text-[10px] font-bold bg-red-100 text-red-700">
                                    Out of stock
                                  </span>
                                ) : med.isLowStock ? (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-100 text-amber-800 whitespace-nowrap">
                                    <AlertTriangle className="w-3 h-3 text-amber-600" />
                                    {med.totalStock} left
                                  </span>
                                ) : (
                                  <span className="text-xs font-semibold text-slate-700 whitespace-nowrap">
                                    {med.totalStock.toLocaleString()} in stock
                                  </span>
                                )}
                              </td>
                              <td className="py-2.5 px-3 text-right">
                                {med.perOff && med.perOff > 0 ? (
                                  <div>
                                    <div className="flex items-center justify-end gap-1.5">
                                      <span className="text-[10px] text-slate-400 line-through">
                                        Rs. {med.originalPrice?.toLocaleString() ?? med.sellingPrice.toLocaleString()}
                                      </span>
                                      <span className="px-1.5 py-0.2 rounded text-[9px] font-black bg-purple-100 text-purple-700">
                                        {med.perOff}% Off
                                      </span>
                                    </div>
                                    <div className="font-black text-emerald-700 text-xs sm:text-sm whitespace-nowrap">
                                      Rs. {med.sellingPrice.toLocaleString()}
                                    </div>
                                  </div>
                                ) : (
                                  <div className="font-black text-slate-900 text-xs sm:text-sm whitespace-nowrap">
                                    Rs. {med.sellingPrice.toLocaleString()}
                                  </div>
                                )}
                              </td>
                              <td className="py-2.5 px-3 text-center">
                                <button
                                  type="button"
                                  onClick={() => addToCart(med)}
                                  disabled={outOfStock}
                                  className={`px-3 py-1 text-white rounded-lg text-xs font-bold transition-all shadow-sm disabled:opacity-40 ${
                                    isSurgical
                                      ? "bg-sky-600 hover:bg-sky-700 shadow-sky-600/20 disabled:hover:bg-sky-600"
                                      : "bg-amber-500 hover:bg-amber-600 shadow-amber-500/20 disabled:hover:bg-amber-500"
                                  }`}
                                >
                                  + Add
                                </button>
                              </td>
                            </tr>
                          );
                        })
                      )}

                      {/* When not searching, show 3 items and clean empty prompt */}
                      {!searchQuery.trim() && medicines.length > 0 && (
                        <tr>
                          <td colSpan={6} className="py-8 text-center bg-slate-50/60 border-t border-dashed border-slate-200">
                            <div className="max-w-md mx-auto space-y-1">
                              <p className="text-xs font-bold text-slate-700">
                                Showing 3 quick items by default
                              </p>
                              <p className="text-[11px] text-slate-400">
                                Type any medicine or surgical item in the search bar above and click &quot;Search&quot; to inspect any of the remaining {Math.max(0, catalogSummary.totalCombined - 3)} stock items.
                              </p>
                            </div>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* 3. BOTTOM SECTION: POS Terminal Cart (Horizontal Full-Width with Cashier Calculator) */}
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5 space-y-5 w-full">
              {/* Header: Title & Patient Identification */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-amber-100 text-amber-800 rounded-xl">
                    <ShoppingCart className="w-5 h-5 text-amber-600" />
                  </div>
                  <div>
                    <h3 className="text-sm sm:text-base font-extrabold text-slate-900 flex items-center gap-2">
                      <span>POS Terminal Cart ({cart.length})</span>
                      {cart.length > 0 && (
                        <button
                          onClick={() => setCart([])}
                          className="text-xs text-red-600 hover:text-red-700 font-semibold underline ml-2"
                        >
                          Clear All Items
                        </button>
                      )}
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      Dispensary items currently queued for sales checkout and receipt printing.
                    </p>
                  </div>
                </div>

                {/* Patient Identification Badge */}
                <div className="flex items-center gap-2">
                  {linkedPatient ? (
                    <div className="p-2.5 bg-blue-50 border border-blue-200 rounded-xl flex items-center gap-3">
                      <div>
                        <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                          {selectedToken && (
                            <span className="w-5 h-5 rounded-md bg-indigo-600 text-white font-mono font-bold text-[9px] flex items-center justify-center shrink-0">
                              #{String(selectedToken.tokenNumber).padStart(2, "0")}
                            </span>
                          )}
                          <span>{linkedPatient.name}</span>
                          <span className="text-[10px] font-normal text-slate-500">
                            ({linkedPatient.age ? `${linkedPatient.age}y` : ""} {linkedPatient.gender || ""})
                          </span>
                        </div>
                        <div className="text-[10px] font-mono text-blue-700 font-semibold mt-0.5">
                          UID: {linkedPatient.patientUid} {linkedPatient.phone ? `• ${linkedPatient.phone}` : ""}
                        </div>
                      </div>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                        Linked
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setLinkedPatient(null);
                          setSelectedToken(null);
                          setPatientUidInput("");
                        }}
                        className="text-[10px] text-red-600 font-bold hover:underline"
                      >
                        Unlink
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        placeholder="Or custom Patient UID..."
                        value={patientUidInput}
                        onChange={(e) => setPatientUidInput(e.target.value)}
                        className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-slate-900 focus:outline-none focus:ring-1 focus:ring-amber-500 w-44"
                      />
                      <button
                        type="button"
                        onClick={handleLookupPatient}
                        disabled={patientLookupLoading || !patientUidInput.trim()}
                        className="px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold disabled:opacity-40"
                      >
                        {patientLookupLoading ? "..." : "Link"}
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Cart Items List - Full Width Horizontal Layout */}
              <div className="border border-slate-200 rounded-2xl overflow-hidden">
                <table className="w-full text-left border-collapse text-xs">
                  <thead className="bg-slate-50 text-[10px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                    <tr>
                      <th className="py-2.5 px-3">Item Details</th>
                      <th className="py-2.5 px-2">Batch #</th>
                      <th className="py-2.5 px-2 text-right">Unit Price</th>
                      <th className="py-2.5 px-3 text-center">Quantity</th>
                      <th className="py-2.5 px-3 text-right">Subtotal</th>
                      <th className="py-2.5 px-2 text-center">Remove</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {cart.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-slate-400 text-xs">
                          Cart is empty (0 items). Click &quot;+ Add&quot; on medicines in the stock directory above to dispense.
                        </td>
                      </tr>
                    ) : (
                      cart.map((item) => (
                        <tr key={item.medicineId} className="hover:bg-slate-50/60 transition-colors">
                          <td className="py-2.5 px-3">
                            <div className="flex items-center gap-2">
                              <span className="font-extrabold text-slate-900 text-xs">
                                {item.medicineName}
                              </span>
                              {item.itemType === "SURGICAL" ? (
                                <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-sky-100 text-sky-800 border border-sky-200">
                                  SURGICAL
                                </span>
                              ) : (
                                <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                                  MEDICINE
                                </span>
                              )}
                              {item.isGeneric && (
                                <span className="inline-flex items-center gap-0.5 text-[9px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                                  <Sparkles className="w-2.5 h-2.5" />
                                  5% Off
                                </span>
                              )}
                            </div>
                            <div className="text-[10px] text-slate-500 font-medium">
                              {item.genericName}
                            </div>
                          </td>
                          <td className="py-2.5 px-2 font-mono text-[10px] text-slate-600">
                            {item.batchNumber}
                          </td>
                          <td className="py-2.5 px-2 text-right">
                            {item.perOff && item.perOff > 0 ? (
                              <div>
                                <span className="text-[10px] text-slate-400 line-through block font-mono">
                                  Rs. {item.originalPrice?.toLocaleString()}
                                </span>
                                <span className="font-mono font-bold text-emerald-700">
                                  Rs. {item.unitPrice.toLocaleString()}
                                </span>
                                <span className="ml-1 text-[9px] font-black text-purple-700 bg-purple-100 px-1 py-0.2 rounded">
                                  {item.perOff}%
                                </span>
                              </div>
                            ) : (
                              <span className="font-mono font-bold text-slate-800">
                                Rs. {item.unitPrice.toLocaleString()}
                              </span>
                            )}
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            <div className="inline-flex items-center gap-1 bg-white border border-slate-200 rounded-lg p-0.5 shadow-2xs">
                              <button
                                type="button"
                                onClick={() => updateQuantity(item.medicineId, -1)}
                                className="p-1 hover:bg-slate-100 rounded text-slate-600"
                              >
                                <Minus className="w-3 h-3" />
                              </button>
                              <span className="px-2 text-xs font-black text-slate-900 font-mono">
                                {item.quantity}
                              </span>
                              <button
                                type="button"
                                onClick={() => updateQuantity(item.medicineId, 1)}
                                className="p-1 hover:bg-slate-100 rounded text-slate-600"
                              >
                                <Plus className="w-3 h-3" />
                              </button>
                            </div>
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono font-black text-slate-900 text-xs">
                            Rs. {(item.quantity * item.unitPrice).toLocaleString()}
                          </td>
                          <td className="py-2.5 px-2 text-center">
                            <button
                              type="button"
                              onClick={() => removeFromCart(item.medicineId)}
                              className="p-1 text-slate-400 hover:text-red-600 transition-colors"
                              title="Remove item"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Cashier Calculator Section (Styled to match Receptionist Cashier Calculator) */}
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
                    Official Pharmacy POS Sequential Sale
                  </span>
                </div>

                {/* Prominent OPD Token Link Banner if Token is Attached */}
                {selectedToken && (
                  <div className="p-3.5 bg-gradient-to-r from-indigo-950 via-slate-900 to-indigo-950 border border-indigo-500/40 rounded-xl space-y-2 shadow-inner">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white font-mono font-black text-sm flex items-center justify-center shrink-0 shadow-md shadow-indigo-600/40 border border-indigo-400/40">
                          #{String(selectedToken.tokenNumber).padStart(2, "0")}
                        </div>
                        <div>
                          <div className="text-xs font-black text-white flex items-center gap-2">
                            <span>OPD TOKEN #{String(selectedToken.tokenNumber).padStart(2, "0")} LINKED</span>
                            <span className="text-[10px] font-mono font-bold text-emerald-300 bg-emerald-950/80 px-2 py-0.5 rounded-full border border-emerald-700/60">
                              Patient Active
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-300 mt-0.5">
                            Customer: <strong className="text-white">{linkedPatient?.name || "Walk-in Patient"}</strong> ({linkedPatient?.patientUid || "N/A"}). Net pharmacy cash due: <strong className="text-cyan-400">Rs. {netPayable.toLocaleString()}</strong>.
                          </p>
                        </div>
                      </div>
                      <div className="text-right shrink-0 bg-slate-800/90 px-3 py-1.5 rounded-lg border border-slate-700">
                        <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 block">Total Due</span>
                        <span className="text-base font-mono font-black text-cyan-400">
                          Rs. {netPayable.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* 3 Calculator Inputs: Subtotal (locked), Discount (locked), Cash Tendered (editable) */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {/* 1. Subtotal Billed (NON-EDITABLE) */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-[11px] font-medium text-slate-400">
                        Subtotal Gross Billed (Rs.)
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
                        value={`Rs. ${rawSubtotal.toLocaleString()}`}
                        className="w-full bg-slate-800/80 border border-slate-700/80 rounded-xl px-3 py-2 text-xs font-extrabold text-slate-200 cursor-not-allowed select-none pl-8"
                      />
                      <Lock className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2.5" />
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1">
                      {cart.length} item(s) in cart
                    </p>
                  </div>

                  {/* 2. Generic 5% Discount (NON-EDITABLE) */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-[11px] font-medium text-slate-400">
                        Generic 5% Discount (Rs.)
                      </label>
                      <span className="text-[9px] font-bold text-emerald-400 uppercase flex items-center gap-0.5">
                        <Check className="w-2.5 h-2.5" />
                        <span>Applied</span>
                      </span>
                    </div>
                    <div className="relative">
                      <input
                        type="text"
                        readOnly
                        disabled
                        value={
                          genericDiscountTotal > 0
                            ? `- Rs. ${genericDiscountTotal.toLocaleString()}`
                            : "Rs. 0 (No Generic Items)"
                        }
                        className="w-full bg-slate-800/80 border border-slate-700/80 rounded-xl px-3 py-2 text-xs font-extrabold text-emerald-400 cursor-not-allowed select-none pl-8"
                      />
                      <Lock className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2.5" />
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1">
                      Auto-calculated from generic medicines
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
                      Physical cash handed over by customer
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
                    onClick={() => setCashTendered(netPayable)}
                    className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-cyan-950 text-cyan-300 border border-cyan-700 hover:bg-cyan-900 transition-colors"
                  >
                    Exact (Rs. {netPayable.toLocaleString()})
                  </button>
                  {[50, 100, 200, 500, 1000, 2000, 5000].map((amt) => (
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
                      Rs. {netPayable.toLocaleString()}
                    </span>
                    <span className="ml-2 text-xs text-slate-400 font-mono">
                      (Gross: Rs. {rawSubtotal.toLocaleString()} · Disc: Rs. {genericDiscountTotal.toLocaleString()})
                    </span>
                  </div>

                  <div>
                    {cashTendered >= netPayable ? (
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
                          Rs. {(netPayable - cashTendered).toLocaleString()}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Action Button: Center Aligned */}
                <div className="flex items-center justify-center pt-2">
                  <button
                    type="button"
                    onClick={handleCheckout}
                    disabled={cart.length === 0 || checkingOut}
                    className="w-full sm:w-auto min-w-[340px] max-w-xl py-4 px-8 bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700 hover:from-amber-600 hover:to-amber-800 text-white rounded-2xl font-black text-sm sm:text-base flex items-center justify-center gap-3 shadow-xl shadow-amber-500/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:scale-[1.01] active:scale-[0.99]"
                  >
                    <Printer className="w-5 h-5" />
                    <span>
                      {checkingOut
                        ? "Processing Dispensary Sale..."
                        : cart.length > 0
                        ? `Dispense & Print POS Receipt (Collect: Rs. ${netPayable.toLocaleString()})`
                        : "⚠️ Cart is Empty (Select Medicines Above)"}
                    </span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB: OTHER SERVICES & DIAGNOSTIC INVOICING */}
        {activeTab === "services" && (() => {
          const activeToken =
            servicesSelectedToken ||
            todayTokens.find(
              (t) =>
                (servicesSelectedPatient && t.patientId && t.patientId === servicesSelectedPatient.id) ||
                (servicesSelectedPatient && t.patient?.id && t.patient.id === servicesSelectedPatient.id) ||
                (servicesSelectedPatient && t.patient?.patientUid && t.patient.patientUid === servicesSelectedPatient.patientUid)
            );
          const opdTokenFee = activeToken ? (activeToken.fee ?? 300) : 0;
          const serviceFee = selectedService.fee;
          const grossTotal = serviceFee + opdTokenFee;
          const netCashDueNow = serviceFee;
          const changeToReturn = Math.max(0, servicesCashTendered - netCashDueNow);

          return (
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
                    {servicesSelectedToken && (
                      <div className="flex items-center gap-2 px-3 py-1 bg-emerald-50 border border-emerald-300 rounded-xl text-xs font-bold text-emerald-800">
                        <span>Token #{String(servicesSelectedToken.tokenNumber).padStart(2, "0")} Active</span>
                        <button
                          onClick={() => setServicesSelectedToken(null)}
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
                      value={servicesTokenSearchQuery}
                      onChange={(e) => setServicesTokenSearchQuery(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && filteredServicesTodayTokens.length > 0) {
                          handleSelectServicesToken(filteredServicesTodayTokens[0]);
                          setServicesTokenSearchQuery("");
                        }
                      }}
                      className="w-full pl-11 pr-10 py-2.5 bg-slate-50 hover:bg-white focus:bg-white border-2 border-slate-200 focus:border-indigo-500 rounded-2xl text-xs font-semibold focus:outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all text-slate-900 placeholder:text-slate-400 shadow-xs text-center"
                    />
                    {servicesTokenSearchQuery && (
                      <button
                        type="button"
                        onClick={() => setServicesTokenSearchQuery("")}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  {/* Dropdown Menu with Sorted Values of Patient Details */}
                  {servicesTokenSearchQuery.trim() && (
                    <div className="absolute z-30 left-0 right-0 mt-1.5 bg-white border border-slate-200 rounded-2xl shadow-xl max-h-72 overflow-y-auto divide-y divide-slate-100 animate-in fade-in duration-100">
                      <div className="p-2.5 bg-slate-50 border-b border-slate-100 flex items-center justify-between text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                        <span>Matching Tokens ({filteredServicesTodayTokens.length})</span>
                        <span>Click to Select Patient</span>
                      </div>
                      {filteredServicesTodayTokens.length === 0 ? (
                        <div className="p-4 text-center text-xs text-slate-500">
                          No matching token or patient record found for &quot;{servicesTokenSearchQuery}&quot;
                        </div>
                      ) : (
                        filteredServicesTodayTokens.map((t) => (
                          <button
                            key={t.id}
                            type="button"
                            onClick={() => {
                              handleSelectServicesToken(t);
                              setServicesTokenSearchQuery("");
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
                {servicesSelectedToken && (
                  <div className="p-3 bg-gradient-to-r from-indigo-50/90 via-blue-50/70 to-emerald-50/90 border-2 border-indigo-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 animate-in fade-in">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white font-mono font-black text-sm flex items-center justify-center shadow-sm shrink-0">
                        #{String(servicesSelectedToken.tokenNumber).padStart(2, "0")}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[11px] font-black uppercase text-indigo-900 tracking-wide">
                            Token #{String(servicesSelectedToken.tokenNumber).padStart(2, "0")} Selected &rarr;
                          </span>
                          {servicesSelectedPatient ? (
                            <>
                              <span className="text-xs font-black text-slate-900">{servicesSelectedPatient.name}</span>
                              <span className="text-[10px] font-mono font-bold bg-white px-2 py-0.5 rounded border border-indigo-200 text-indigo-700">
                                {servicesSelectedPatient.patientUid}
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
                        onClick={() => setServicesSelectedToken(null)}
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
                  {servicesSelectedPatient ? (
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
                            setServicesSelectedPatient(null);
                            setServicesSelectedToken(null);
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
                                {servicesSelectedPatient.name[0]?.toUpperCase() || "P"}
                              </div>
                              <div>
                                <h4 className="text-base font-black text-slate-900 leading-tight">
                                  {servicesSelectedPatient.name}
                                </h4>
                                <div className="flex items-center gap-2 mt-1 flex-wrap">
                                  <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-indigo-100 text-indigo-800 border border-indigo-200">
                                    {servicesSelectedPatient.patientUid}
                                  </span>
                                  {servicesSelectedToken && (
                                    <span className="font-mono text-xs font-black px-2 py-0.5 rounded bg-amber-100 text-amber-900 border border-amber-300">
                                      Token #{String(servicesSelectedToken.tokenNumber).padStart(2, "0")}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>

                            <span className="text-[11px] font-bold text-indigo-900 bg-white px-2.5 py-1 rounded-lg border border-indigo-200 shrink-0">
                              {servicesSelectedPatient.visits?.length || 0} Total Visits
                            </span>
                          </div>

                          <div className="grid grid-cols-2 gap-3 pt-3 mt-3 border-t border-indigo-100/80 text-xs">
                            <div>
                              <span className="text-[10px] uppercase font-bold text-slate-400 block">Phone Number</span>
                              <span className="font-semibold text-slate-800 flex items-center gap-1.5 mt-0.5">
                                <Phone className="w-3.5 h-3.5 text-indigo-600" />
                                {servicesSelectedPatient.phone}
                              </span>
                            </div>
                            <div>
                              <span className="text-[10px] uppercase font-bold text-slate-400 block">Demographics</span>
                              <span className="font-semibold text-slate-800 mt-0.5 block">
                                {servicesSelectedPatient.age} yrs · {servicesSelectedPatient.gender}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Prior Service History */}
                        {servicesSelectedPatient.visits && servicesSelectedPatient.visits.length > 0 && (
                          <div className="pt-2 border-t border-indigo-100/80">
                            <span className="text-[10px] font-bold text-indigo-950 uppercase block mb-1">
                              Prior Service History:
                            </span>
                            <div className="flex flex-wrap gap-1">
                              {servicesSelectedPatient.visits.slice(0, 3).map((v: any, idx: number) => (
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
                            value={servicesSearchQuery}
                            onChange={(e) => {
                              setServicesSearchQuery(e.target.value);
                              searchServicesPatients(e.target.value);
                            }}
                            placeholder="Or search patient by name, phone, or UID..."
                            className="w-full pl-9 pr-8 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-slate-900 font-medium"
                          />
                          {servicesSearchQuery && (
                            <button
                              onClick={() => {
                                setServicesSearchQuery("");
                                searchServicesPatients("");
                              }}
                              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>

                        {servicesSearchQuery.trim().length > 0 && servicesSearchResults.length > 0 && (
                          <div className="mt-2 space-y-1 max-h-40 overflow-y-auto divide-y divide-slate-100 bg-white border border-slate-200 rounded-xl p-1 shadow-sm">
                            {servicesSearchResults.map((p) => (
                              <button
                                key={p.id}
                                type="button"
                                onClick={() => {
                                  setServicesSelectedPatient(p);
                                  setServicesSearchQuery("");
                                  setServicesSearchResults([]);
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
                              <span
                                className={`text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded ${
                                  isSelected
                                    ? "bg-white/20 text-white"
                                    : "bg-amber-100 text-amber-900 border border-amber-200"
                                }`}
                              >
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
                      value={servicesCashTendered || ""}
                      onChange={(e) => setServicesCashTendered(parseFloat(e.target.value) || 0)}
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
                    onClick={() => setServicesCashTendered(netCashDueNow)}
                    className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-cyan-950 text-cyan-300 border border-cyan-700 hover:bg-cyan-900 transition-colors"
                  >
                    Exact (Rs. {netCashDueNow.toLocaleString()})
                  </button>
                  {[500, 700, 1000, 1200, 1500, 2000, 5000].map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setServicesCashTendered(amt)}
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
                    {servicesCashTendered >= netCashDueNow ? (
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
                          Rs. {(netCashDueNow - servicesCashTendered).toLocaleString()}
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
                  disabled={!servicesSelectedPatient || issuingServiceInvoice}
                  className="w-full sm:w-auto min-w-[340px] max-w-xl py-4 px-8 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-700 hover:to-indigo-800 text-white rounded-2xl font-black text-sm sm:text-base flex items-center justify-center gap-3 shadow-xl shadow-blue-500/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:scale-[1.01] active:scale-[0.99]"
                >
                  <Printer className="w-5 h-5" />
                  <span>
                    {issuingServiceInvoice
                      ? "Recording & Generating Invoice..."
                      : servicesSelectedPatient
                      ? `Issue Invoice for ${servicesSelectedPatient.name} (Collect: Rs. ${netCashDueNow.toLocaleString()} · Token #${activeToken ? String(activeToken.tokenNumber).padStart(2, "0") : "N/A"} Paid: Rs. ${opdTokenFee})`
                      : "⚠️ Please Select a Patient Above First"}
                  </span>
                </button>
              </div>
            </div>
          );
        })()}

        {/* TAB 2: STOCK BATCHES & PURCHASE SHEET */}
        {activeTab === "inventory" && (
          <div className="space-y-4">
            {/* Inventory Subtabs */}
            <div className="flex items-center gap-2 bg-white p-1.5 rounded-2xl border border-slate-200/80 shadow-sm w-fit">
              <button
                type="button"
                onClick={() => setInventorySubTab("purchaseSheet")}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                  inventorySubTab === "purchaseSheet"
                    ? "bg-emerald-600 text-white shadow-md shadow-emerald-500/20"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                <Package className="w-4 h-4" />
                <span>Hospital Purchase Stock Sheet</span>
              </button>
              <button
                type="button"
                onClick={() => setInventorySubTab("batches")}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                  inventorySubTab === "batches"
                    ? "bg-emerald-600 text-white shadow-md shadow-emerald-500/20"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                <Layers className="w-4 h-4" />
                <span>POS Medicine Batches ({batches.length})</span>
              </button>
            </div>

            {inventorySubTab === "purchaseSheet" ? (
              <MedicinePurchaseSheetView portalRole="PHARMACIST" />
            ) : (
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
              <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Pharmaceutical Batch Inventory
                  </h3>
                  <p className="text-xs text-slate-500">
                    Batch tracking, expiry monitoring, and admin approval workflows
                  </p>
                </div>
                <span className="text-xs font-bold text-slate-600">
                  {batches.length} Total Batches
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-700">
                  <thead className="bg-slate-100 text-[11px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-200">
                    <tr>
                      <th className="px-5 py-3.5">Medicine Name</th>
                      <th className="px-5 py-3.5">Batch Number</th>
                      <th className="px-5 py-3.5">Remaining Qty</th>
                      <th className="px-5 py-3.5">Warning Threshold</th>
                      <th className="px-5 py-3.5">Per Off (%)</th>
                      <th className="px-5 py-3.5">Purchase / Selling</th>
                      <th className="px-5 py-3.5">Expiry Date</th>
                      <th className="px-5 py-3.5">Approval Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {batches.map((b) => {
                      const isExpired = new Date(b.expiryDate) < new Date();
                      const thresholdLimit = b.medicine?.threshold ?? 10;
                      const isLowStock = b.quantity <= thresholdLimit;

                      return (
                        <tr key={b.id} className="hover:bg-slate-50/80">
                          <td className="px-5 py-3.5">
                            <div className="font-bold text-slate-900">
                              {b.medicine?.name}
                            </div>
                            <div className="text-[11px] text-slate-500">
                              {b.medicine?.genericName}
                            </div>
                          </td>
                          <td className="px-5 py-3.5 font-mono font-bold text-slate-800">
                            {b.batchNumber}
                          </td>
                          <td className="px-5 py-3.5">
                            <span
                              className={`font-black ${
                                isLowStock ? "text-red-600" : "text-slate-900"
                              }`}
                            >
                              {b.quantity} units
                            </span>
                            {isLowStock && (
                              <span className="ml-2 px-1.5 py-0.5 rounded text-[10px] font-black bg-red-100 text-red-800">
                                🔴 Low
                              </span>
                            )}
                          </td>
                          <td className="px-5 py-3.5 font-bold text-slate-600">
                            &le; {thresholdLimit} units
                          </td>
                          <td className="px-5 py-3.5">
                            <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
                              {b.perOff ?? b.medicine?.perOff ?? 0}% Off
                            </span>
                          </td>
                          <td className="px-5 py-3.5">
                            <span className="text-slate-500">
                              Rs. {b.purchasePrice.toLocaleString()}
                            </span>
                            <span className="mx-1.5 text-slate-300">/</span>
                            <span className="font-bold text-slate-900">
                              Rs. {b.sellingPrice.toLocaleString()}
                            </span>
                          </td>
                          <td className="px-5 py-3.5">
                            <span
                              className={
                                isExpired ? "text-red-600 font-bold" : "text-slate-600"
                              }
                            >
                              {new Date(b.expiryDate).toLocaleDateString()}
                            </span>
                            {isExpired && (
                              <span className="ml-1.5 px-1.5 py-0.5 rounded text-[9px] font-bold bg-red-100 text-red-700">
                                Expired
                              </span>
                            )}
                          </td>
                          <td className="px-5 py-3.5">
                            {b.approvalStatus === "APPROVED" ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-100 text-emerald-800 border border-emerald-200">
                                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                <span>Active &amp; Approved</span>
                              </span>
                            ) : b.approvalStatus === "PENDING" ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-amber-100 text-amber-800 border border-amber-300 animate-pulse">
                                <Clock className="w-3 h-3 text-amber-600" />
                                <span>Pending Admin Approval</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-rose-100 text-rose-800 border border-rose-200">
                                <AlertTriangle className="w-3 h-3 text-rose-600" />
                                <span>Rejected</span>
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
            )}
          </div>
        )}

        {/* TAB 3: DAILY SALES & ACCOUNTABILITY */}
        {activeTab === "accountability" && (
          <DailyAccountabilityView />
        )}

        {/* TAB 4: VENDORS & SUPPLY ORDERS (Temporarily hidden - toggle SHOW_VENDORS_TAB) */}
        {SHOW_VENDORS_TAB && activeTab === "vendors" && (
          <VendorManagementView />
        )}

        {/* Submit Batch Request Modal */}
        {showBatchModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
            <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-100">
              <div className="p-5 bg-gradient-to-r from-slate-900 to-amber-950 text-white flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <Package className="w-5 h-5 text-amber-400" />
                  <div>
                    <h3 className="text-sm font-bold">New Batch Restock Request</h3>
                    <p className="text-[11px] text-slate-400">
                      Requires Admin approval before becoming sellable
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowBatchModal(false)}
                  className="text-slate-400 hover:text-white"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleSubmitBatchRequest} className="p-6 space-y-4">
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-xs flex items-start gap-2">
                  <Clock className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">Admin Approval Gate:</span> Restock submissions are sent to the Admin Approvals Center in <strong>PENDING</strong> status. Upon approval, items become sellable in POS and the alert threshold is updated.
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                    Select Medicine (from Catalog of {catalogSummary.totalMedicines} Items)
                  </label>
                  <select
                    value={batchForm.medicineId}
                    onChange={(e) => {
                      const mid = e.target.value;
                      const found = medicines.find((m) => m.id === mid);
                      setBatchForm({
                        ...batchForm,
                        medicineId: mid,
                        threshold: found ? String(found.threshold ?? 10) : batchForm.threshold,
                        perOff: found ? String(found.perOff ?? 0) : batchForm.perOff,
                        purchasePrice: found && found.purchasePrice ? String(found.purchasePrice) : batchForm.purchasePrice,
                        sellingPrice: found && found.sellingPrice ? String(found.sellingPrice) : batchForm.sellingPrice,
                      });
                    }}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  >
                    <option value="">-- Or enter a brand new medicine below --</option>
                    {medicines.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name} ({m.genericName}) · Current Stock: {m.totalStock} · Alert Min: {m.threshold} · Per-Off: {m.perOff || 0}%
                      </option>
                    ))}
                  </select>
                </div>

                {!batchForm.medicineId && (
                  <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl space-y-2">
                    <p className="text-[11px] font-bold text-amber-900">
                      New Medicine Registration
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        placeholder="Brand Name (e.g. Lipitor)"
                        value={batchForm.newMedicineName}
                        onChange={(e) =>
                          setBatchForm({ ...batchForm, newMedicineName: e.target.value })
                        }
                        className="text-xs bg-white border border-amber-200 rounded-lg p-2 text-slate-900"
                      />
                      <input
                        type="text"
                        placeholder="Generic Name (e.g. Atorvastatin)"
                        value={batchForm.newGenericName}
                        onChange={(e) =>
                          setBatchForm({ ...batchForm, newGenericName: e.target.value })
                        }
                        className="text-xs bg-white border border-amber-200 rounded-lg p-2 text-slate-900"
                      />
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                      Batch Number *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. BATCH-2026-X1"
                      value={batchForm.batchNumber}
                      onChange={(e) =>
                        setBatchForm({ ...batchForm, batchNumber: e.target.value })
                      }
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                      Quantity to Intake (Units) *
                    </label>
                    <input
                      type="number"
                      required
                      min="1"
                      value={batchForm.quantity}
                      onChange={(e) =>
                        setBatchForm({ ...batchForm, quantity: e.target.value })
                      }
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                      Purchase Cost (Rs.) *
                    </label>
                    <input
                      type="number"
                      step="1"
                      required
                      value={batchForm.purchasePrice}
                      onChange={(e) =>
                        setBatchForm({ ...batchForm, purchasePrice: e.target.value })
                      }
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                      Selling Price (Rs.) *
                    </label>
                    <input
                      type="number"
                      step="1"
                      required
                      value={batchForm.sellingPrice}
                      onChange={(e) =>
                        setBatchForm({ ...batchForm, sellingPrice: e.target.value })
                      }
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                      Low-Stock Warning Threshold *
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        min="1"
                        required
                        value={batchForm.threshold}
                        onChange={(e) =>
                          setBatchForm({ ...batchForm, threshold: e.target.value, newThreshold: e.target.value })
                        }
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                      />
                      <span className="absolute right-3 top-2 text-[11px] text-slate-400 font-medium">units</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                      Per Off (%) / Discount Rate
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        step="0.5"
                        min="0"
                        max="100"
                        value={batchForm.perOff}
                        onChange={(e) =>
                          setBatchForm({ ...batchForm, perOff: e.target.value })
                        }
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                      />
                      <span className="absolute right-3 top-2 text-[11px] text-slate-400 font-bold">%</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                      Batch Expiry Date *
                    </label>
                    <input
                      type="date"
                      required
                      value={batchForm.expiryDate}
                      onChange={(e) =>
                        setBatchForm({ ...batchForm, expiryDate: e.target.value })
                      }
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                      Mfg Date
                    </label>
                    <input
                      type="date"
                      value={batchForm.mfgDate}
                      onChange={(e) =>
                        setBatchForm({ ...batchForm, mfgDate: e.target.value })
                      }
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-900"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                    Justification / Vendor Notes
                  </label>
                  <textarea
                    rows={2}
                    value={batchForm.reason}
                    onChange={(e) =>
                      setBatchForm({ ...batchForm, reason: e.target.value })
                    }
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div className="pt-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowBatchModal(false)}
                    className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submittingBatch}
                    className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-semibold shadow-md shadow-amber-600/20 disabled:opacity-50"
                  >
                    {submittingBatch ? "Submitting..." : "Submit to Admin Approvals"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Thermal Receipt Modal */}
        <ThermalReceiptModal
          receipt={activeReceipt}
          isOpen={receiptOpen}
          onClose={() => {
            setReceiptOpen(false);
            resetFormToDefault();
            setSuccessModalOpen(true);
          }}
          onPrint={() => {
            setReceiptOpen(false);
            resetFormToDefault();
            setSuccessModalOpen(true);
          }}
        />

        {/* Patient / POS Order Successfully Processed Modal Dialog */}
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


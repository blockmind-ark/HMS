"use client";

import React, { useState, useEffect, useRef } from "react";
import dynamic from "next/dynamic";
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
  ChevronDown,
  ChevronUp,
} from "lucide-react";
const PharmacyMedicineReturnsView = dynamic(() => import("@/components/pharmacy/PharmacyMedicineReturnsView").then(m => m.PharmacyMedicineReturnsView), { loading: () => <div className="p-4 text-xs text-slate-500">Loading...</div> });
import {
  ThermalReceiptModal,
  ReceiptData,
} from "@/components/receipts/ThermalReceiptModal";
const DailyAccountabilityView = dynamic(() => import("@/components/pharmacist/DailyAccountabilityView").then(m => m.DailyAccountabilityView), { loading: () => <div className="p-4 text-xs text-slate-500">Loading...</div> });
const VendorManagementView = dynamic(() => import("@/components/admin/VendorManagementView").then(m => m.VendorManagementView), { loading: () => <div className="p-4 text-xs text-slate-500">Loading...</div> });
const MedicinePurchaseSheetView = dynamic(() => import("@/components/inventory/MedicinePurchaseSheetView").then(m => m.MedicinePurchaseSheetView), { loading: () => <div className="p-4 text-xs text-slate-500">Loading...</div> });
import {
  PatientProceedSuccessModal,
  ProcessedPatientDetails,
} from "@/components/modals/PatientProceedSuccessModal";

const CATALOG_PAGE_SIZE = 4;

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

// Feature toggle: Set to true when ready to re-enable the Vendors & Supply Orders tab
const SHOW_VENDORS_TAB = false;

const SERVICE_PRESETS = [
  { name: "Ultrasound Abdomen", fee: 700.0, type: "Ultrasound" },
  { name: "Ultrasound TVS", fee: 1200.0, type: "Ultrasound" },
  { name: "Ultrasound Liver, Kidney & Stomach", fee: 1200.0, type: "Ultrasound" },
];

export default function PharmacistPortal() {
  const [activeTab, setActiveTab] = useState<"pos" | "services" | "returns" | "inventory" | "accountability" | "vendors">("pos");
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
  const [isLowStockAlarmMinimized, setIsLowStockAlarmMinimized] = useState<boolean>(true);
  const [isTokenQueueMinimized, setIsTokenQueueMinimized] = useState<boolean>(true);
  const compactLowStockAlert = activeTab === "pos" && isLowStockAlarmMinimized;

  // Editable typed quantities state for POS Cart
  const [typedQuantities, setTypedQuantities] = useState<Record<string, string>>({});

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
  const [restockMedicines, setRestockMedicines] = useState<any[]>([]);
  const [restockLoading, setRestockLoading] = useState(false);
  const [restockError, setRestockError] = useState(false);
  const [catalogPage, setCatalogPage] = useState(1);
  const [catalogTotal, setCatalogTotal] = useState(0);
  const [catalogHasNext, setCatalogHasNext] = useState(false);
  const catalogTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeItemType, setActiveItemType] = useState<"ALL" | "MEDICINE" | "SURGICAL">("ALL");
  const [catalogSummary, setCatalogSummary] = useState<{
    totalMedicines: number;
    totalSurgical: number;
    totalCombined: number;
  }>({
    totalMedicines: 289,
    totalSurgical: 45,
    totalCombined: 334,
  });
  const [loadingCatalog, setLoadingCatalog] = useState(false);
  const [catalogError, setCatalogError] = useState(false);

  // Cart & POS State
  const [cart, setCart] = useState<CartItem[]>([]);
  const [lastCartAddition, setLastCartAddition] = useState<{ medicineId: string; previousQuantity: number } | null>(null);
  const cartListRef = useRef<HTMLDivElement>(null);
  const stockDirectoryRef = useRef<HTMLDivElement>(null);
  const cartPanelRef = useRef<HTMLDivElement>(null);
  const lastAddedCartItem = lastCartAddition
    ? cart.find((item) =>
        item.medicineId === lastCartAddition.medicineId && item.quantity > lastCartAddition.previousQuantity
      )
    : undefined;
  const displayedCartItems = lastAddedCartItem
    ? [lastAddedCartItem, ...cart.filter((item) => item.medicineId !== lastAddedCartItem.medicineId)]
    : cart;

  useEffect(() => {
    const stockDirectory = stockDirectoryRef.current;
    const cartPanel = cartPanelRef.current;
    if (activeTab !== "pos" || !stockDirectory || !cartPanel) return;

    const syncCartHeight = () => {
      cartPanel.style.setProperty("--stock-directory-height", stockDirectory.getBoundingClientRect().height + "px");
    };
    syncCartHeight();

    const observer = new ResizeObserver(syncCartHeight);
    observer.observe(stockDirectory);
    return () => observer.disconnect();
  }, [activeTab]);

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
  const [ultrasoundServices, setUltrasoundServices] = useState<{
    id?: string;
    name: string;
    fee: number;
    type: string;
  }[]>(SERVICE_PRESETS);
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
  const medicineRequest = useRef<AbortController | null>(null);
  const fetchMedicines = async (page = 1) => {
    if (catalogTimer.current) clearTimeout(catalogTimer.current);
    medicineRequest.current?.abort();
    const controller = new AbortController();
    medicineRequest.current = controller;
    setLoadingCatalog(true);
    setCatalogError(false);
    try {
      const res = await fetch(
        `/api/pharmacist/medicines?query=${encodeURIComponent(
          searchQuery.trim()
        )}&itemType=${encodeURIComponent(activeItemType)}&lowStockOnly=${filterLowStockOnly ? "true" : "false"}&page=${page}&pageSize=${CATALOG_PAGE_SIZE}`,
        { signal: controller.signal }
      );
      if (!res.ok) throw new Error("Stock directory unavailable");

      const data = await res.json();
      if (controller.signal.aborted) return;
      setMedicines(data.medicines || []);
      setCatalogPage(page);
      setCatalogTotal(data.summary?.totalFound ?? data.medicines?.length ?? 0);
      setCatalogHasNext(data.pagination?.hasNext ?? false);
      if (data.summary) {
        setCatalogSummary({
          totalMedicines: data.summary.totalMedicines || 0,
          totalSurgical: data.summary.totalSurgical || 0,
          totalCombined: data.summary.totalCombined || 0,
        });
        if (data.summary.lowStockCount !== undefined) {
          setLowStockCount(data.summary.lowStockCount);
        }
      }
    } catch (e) {
      if (!controller.signal.aborted) {
        setCatalogError(true);
        console.error("Failed to load stock directory:", e);
      }
    } finally {
      if (!controller.signal.aborted) setLoadingCatalog(false);
    }
  };

  useEffect(() => {
    if (!showBatchModal) return;
    const controller = new AbortController();
    setRestockLoading(true);
    setRestockError(false);
    setRestockMedicines([]);
    fetch("/api/pharmacist/medicines", { signal: controller.signal })
      .then(res => { if (!res.ok) throw new Error("Catalogue unavailable"); return res.json(); })
      .then(data => { if (!controller.signal.aborted) setRestockMedicines(data.medicines || []); })
      .catch(() => { if (!controller.signal.aborted) setRestockError(true); })
      .finally(() => { if (!controller.signal.aborted) setRestockLoading(false); });
    return () => controller.abort();
  }, [showBatchModal]);

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

  const fetchUltrasoundServices = async () => {
    try {
      const res = await fetch("/api/services/ultrasound");
      if (res.ok) {
        const data = await res.json();
        if (data.services && data.services.length > 0) {
          const mapped = data.services.map((s: any) => ({
            id: s.id,
            name: s.name,
            fee: Number(s.price),
            type: "Ultrasound",
          }));
          setUltrasoundServices(mapped);
          setSelectedService((prev) => {
            const match = mapped.find((m: any) => m.name === prev.name);
            return match || mapped[0] || prev;
          });
        }
      }
    } catch (e) {
      console.error("Failed to load ultrasound services in Pharmacist:", e);
    }
  };

  useEffect(() => {
    setLoadingCatalog(true);
    catalogTimer.current = setTimeout(() => { void fetchMedicines(); }, 350);
    return () => {
      if (catalogTimer.current) clearTimeout(catalogTimer.current);
      medicineRequest.current?.abort();
    };
  }, [searchQuery, activeItemType, filterLowStockOnly]);

  useEffect(() => {
    fetchDailyStats();
  }, []);

  useEffect(() => {
    if (activeTab === "inventory") {
      fetchBatches();
    } else if (activeTab === "pos") {
      fetchTodayTokens();
    } else if (activeTab === "services") {
      fetchTodayTokens();
      fetchUltrasoundServices();
    }
  }, [activeTab]);

  // Add medicine or surgical item to cart
  const addToCart = (med: any) => {
    if (!med.activeBatch || med.totalStock <= 0) return;

    if (cartListRef.current) cartListRef.current.scrollTop = 0;
    setLastCartAddition({
      medicineId: med.id,
      previousQuantity: cart.find((item) => item.medicineId === med.id)?.quantity ?? 0,
    });
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

  // Cart quantity controls (Typed numeric input + buttons)
  const updateQuantity = (medicineId: string, delta: number) => {
    setTypedQuantities((prev) => {
      const copy = { ...prev };
      delete copy[medicineId];
      return copy;
    });

    setCart((prev) =>
      prev
        .map((it) => {
          if (it.medicineId === medicineId) {
            const nextQty = it.quantity + delta;
            if (nextQty <= 0) return null;
            if (nextQty > it.maxStock) {
              return it;
            }
            return { ...it, quantity: nextQty };
          }
          return it;
        })
        .filter(Boolean) as CartItem[]
    );
  };

  const handleTypedQuantityChange = (medicineId: string, rawVal: string) => {
    // Retain typed string so user can clear/backspace comfortably
    setTypedQuantities((prev) => ({ ...prev, [medicineId]: rawVal }));

    const num = parseInt(rawVal, 10);
    if (!isNaN(num) && num >= 1) {
      const item = cart.find((i) => i.medicineId === medicineId);
      if (!item) return;
      const clamped = Math.min(item.maxStock, num);
      setCart((prev) =>
        prev.map((it) => (it.medicineId === medicineId ? { ...it, quantity: clamped } : it))
      );
    }
  };

  const handleTypedQuantityBlur = (medicineId: string, maxStock: number) => {
    const rawVal = typedQuantities[medicineId];
    let num = parseInt(rawVal || "1", 10);
    if (isNaN(num) || num < 1) num = 1;
    if (num > maxStock) num = maxStock;

    setTypedQuantities((prev) => {
      const copy = { ...prev };
      delete copy[medicineId];
      return copy;
    });

    setCart((prev) =>
      prev.map((it) => (it.medicineId === medicineId ? { ...it, quantity: num } : it))
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
  const checkoutLock = useRef(false);
  const restockLock = useRef(false);
  const handleCheckout = async () => {
    if (checkoutLock.current || receiptOpen) return;
    if (cart.length === 0) {
      alert("Cart is empty");
      return;
    }

    checkoutLock.current = true;
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
      checkoutLock.current = false;
      setCheckingOut(false);
    }
  };

  // Submit Restock Batch Request
  const handleSubmitBatchRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (restockLock.current || restockLoading || restockError) return;
    restockLock.current = true;
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
      restockLock.current = false;
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

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-4 space-y-3">
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

        <section aria-label="Pharmacy summary" className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {[
            {
              label: "Today's POS Sales", value: "Rs. " + dailyStats.todayRevenue.toLocaleString(),
              icon: Banknote, color: "bg-amber-50 text-amber-700", description: "View daily closing summary",
            },
            {
              label: "Units Dispensed Today", value: dailyStats.totalUnitsSold.toLocaleString() + " units",
              icon: Package, color: "bg-blue-50 text-blue-700", description: "Tablets, bottles and packs",
            },
            {
              label: "Prescriptions Completed", value: dailyStats.totalSalesCount.toLocaleString(),
              icon: Receipt, color: "bg-purple-50 text-purple-700", description: "POS receipts issued",
            },
            {
              label: "Cash Reconciled", value: "Rs. " + (5000 + dailyStats.todayRevenue).toLocaleString(),
              icon: ShieldCheck, color: "bg-emerald-50 text-emerald-700", description: "Float and sales in drawer",
            },
          ].map(({ label, value, icon: Icon, color, description }) => (
            <button
              key={label}
              type="button"
              onClick={() => setActiveTab("accountability")}
              title={description}
              className="flex min-h-24 items-center gap-3 min-w-0 rounded-2xl border border-slate-200 bg-white p-3 text-left shadow-sm transition-colors hover:border-amber-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-600 sm:p-4"
            >
              <span className={"grid size-9 shrink-0 place-items-center rounded-xl sm:size-11 " + color}>
                <Icon aria-hidden="true" className="size-5" />
              </span>
              <span className="min-w-0">
                <span className="block text-xs font-semibold leading-tight text-slate-600">{label}</span>
                <span className="mt-0.5 block break-words text-lg font-extrabold leading-tight tabular-nums text-slate-900 sm:text-xl">{value}</span>
              </span>
            </button>
          ))}
        </section>

        <nav aria-label="Pharmacy sections" className="flex flex-wrap items-center justify-between gap-1.5 border-b border-slate-200 pb-1.5">
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              onClick={() => setActiveTab("pos")}
              type="button"
              aria-current={activeTab === "pos" ? "page" : undefined}
              className={`inline-flex min-h-9 items-center gap-2 whitespace-nowrap rounded-xl px-4 py-2 text-xs font-bold transition-colors sm:text-sm ${
                activeTab === "pos"
                  ? "bg-amber-600 text-white shadow-md shadow-amber-500/20"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              <ShoppingCart className="size-4 shrink-0" />
              <span>Pharmacy POS</span>
            </button>
            <button
              onClick={() => {
                setActiveTab("services");
                fetchTodayTokens();
              }}
              type="button"
              aria-current={activeTab === "services" ? "page" : undefined}
              className={`inline-flex min-h-9 items-center gap-2 whitespace-nowrap rounded-xl px-4 py-2 text-xs font-bold transition-colors sm:text-sm ${
                activeTab === "services"
                  ? "bg-amber-600 text-white shadow-md shadow-amber-500/20"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              <Layers className="size-4 shrink-0" />
              <span>Services &amp; Invoicing</span>
            </button>
            <button
              onClick={() => setActiveTab("returns")}
              type="button"
              aria-current={activeTab === "returns" ? "page" : undefined}
              className={`inline-flex min-h-9 items-center gap-2 whitespace-nowrap rounded-xl px-4 py-2 text-xs font-bold transition-colors sm:text-sm ${
                activeTab === "returns"
                  ? "bg-rose-600 text-white shadow-md shadow-rose-500/20"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              <RotateCcw className="size-4 shrink-0" />
              <span>Returns</span>
            </button>
            <button
              onClick={() => setActiveTab("inventory")}
              type="button"
              aria-current={activeTab === "inventory" ? "page" : undefined}
              className={`inline-flex min-h-9 items-center gap-2 whitespace-nowrap rounded-xl px-4 py-2 text-xs font-bold transition-colors sm:text-sm ${
                activeTab === "inventory"
                  ? "bg-amber-600 text-white shadow-md shadow-amber-500/20"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              <Layers className="size-4 shrink-0" />
              <span>Stock &amp; Requests</span>
            </button>
            <button
              onClick={() => setActiveTab("accountability")}
              type="button"
              aria-current={activeTab === "accountability" ? "page" : undefined}
              className={`inline-flex min-h-9 items-center gap-2 whitespace-nowrap rounded-xl px-4 py-2 text-xs font-bold transition-colors sm:text-sm ${
                activeTab === "accountability"
                  ? "bg-amber-600 text-white shadow-md shadow-amber-500/20"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              <Receipt className="size-4 shrink-0" />
              <span>Sales &amp; Accountability</span>
            </button>
            {SHOW_VENDORS_TAB && (
              <button
                onClick={() => setActiveTab("vendors")}
                type="button"
                aria-current={activeTab === "vendors" ? "page" : undefined}
                className={`inline-flex min-h-9 items-center gap-2 whitespace-nowrap rounded-xl px-4 py-2 text-xs font-bold transition-colors sm:text-sm ${
                  activeTab === "vendors"
                    ? "bg-amber-600 text-white shadow-md shadow-amber-500/20"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                <Truck className="size-4 shrink-0" />
                <span>Vendors</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab("accountability")}
              className="min-h-9 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors border border-slate-200"
            >
              <Printer className="w-3.5 h-3.5 text-amber-600" />
              <span>Shift Summary</span>
            </button>

            {activeTab === "inventory" && (
              <button
                onClick={() => setShowBatchModal(true)}
                className="min-h-9 px-3 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors shadow-sm"
              >
                <Plus className="w-3.5 h-3.5 text-amber-400" />
                <span>Submit Batch Request</span>
              </button>
            )}
          </div>
        </nav>

        {/* Prominent Real-Time Low-Stock Alert Alarm Banner */}
        {lowStockCount > 0 && (
          <div
            className={compactLowStockAlert
              ? "rounded-xl border border-red-200 bg-red-50 px-3 py-2 shadow-sm"
              : "bg-gradient-to-r from-red-500/10 via-amber-500/10 to-rose-500/10 border-2 border-red-500/40 rounded-2xl p-4 sm:p-5 shadow-sm space-y-3 animate-in fade-in"}
          >
            <div className={compactLowStockAlert
              ? "flex flex-wrap items-center justify-between gap-1.5"
              : "flex flex-col sm:flex-row sm:items-center justify-between gap-3"}
            >
              {compactLowStockAlert ? (
                <div className="flex min-w-0 flex-wrap items-center gap-1.5">
                  <div className="shrink-0 rounded-lg bg-red-100 p-1 text-red-700">
                    <AlertTriangle aria-hidden="true" className="h-4 w-4" />
                  </div>
                  <h3 className="text-xs font-extrabold text-red-950">Low Stock Alert</h3>
                  <span className="rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-bold text-red-800">
                    {lowStockCount} {lowStockCount === 1 ? "item" : "items"}
                  </span>
                </div>
              ) : (
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
                    {!isLowStockAlarmMinimized && (
                      <p className="text-xs text-slate-600 mt-0.5">
                        Live dispensary stock is at or below defined safety limits (<code>quantity &le; threshold</code>). Click any item below to immediately submit a restock batch request.
                      </p>
                    )}
                  </div>
                </div>
              )}

              <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                <div className={compactLowStockAlert ? "hidden" : "contents"}>
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

                {/* Minimize / Maximize Toggle Button */}
                <button
                  type="button"
                  onClick={() => setIsLowStockAlarmMinimized((minimized) => !minimized)}
                  aria-expanded={!isLowStockAlarmMinimized}
                  aria-controls="pharmacy-low-stock-details"
                  className={compactLowStockAlert
                    ? "flex shrink-0 items-center gap-1 rounded-lg border border-red-200 bg-white px-2.5 py-1 text-xs font-bold text-red-800 transition-colors hover:bg-red-100"
                    : "px-2.5 py-2 bg-white/90 hover:bg-white border border-red-300 rounded-xl text-red-900 transition-colors shadow-xs flex items-center gap-1 text-xs font-bold"}
                  title={isLowStockAlarmMinimized ? "Expand Low Stock Alert Card" : "Minimize Low Stock Alert Card"}
                  aria-label={isLowStockAlarmMinimized ? "Expand Low Stock Alert" : "Minimize Low Stock Alert"}
                >
                  {isLowStockAlarmMinimized ? (
                    <>
                      <ChevronDown aria-hidden="true" className={compactLowStockAlert ? "h-3.5 w-3.5" : "w-4 h-4 text-red-700"} />
                      <span className="hidden sm:inline">Expand</span>
                    </>
                  ) : (
                    <>
                      <ChevronUp className="w-4 h-4 text-red-700" />
                      <span className="hidden sm:inline">Minimize</span>
                    </>
                  )}
                  </button>
                </div>
              </div>

            <div id="pharmacy-low-stock-details" hidden={isLowStockAlarmMinimized}>
              {!isLowStockAlarmMinimized && (
                <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-red-200/60">
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
              )}
            </div>
          </div>
        )}

        {/* TAB 1: POS BILLING & DISPENSARY */}
        {activeTab === "pos" && (
          <div className="space-y-3">
            {/* Active OPD Token Queue Selector */}
            <div className="bg-white px-3 py-2 rounded-xl border border-slate-200/80 shadow-sm space-y-1.5">
              <div className="flex flex-wrap items-center justify-between gap-1.5">
                <div className="flex items-center gap-1.5">
                  <div className="p-1 bg-indigo-50 text-indigo-700 rounded-lg">
                    <Ticket className="w-4 h-4 text-indigo-600" />
                  </div>
                  <div>
                    <h3 className="text-xs font-extrabold text-slate-900 flex items-center gap-2">
                      <span>Today&apos;s Active OPD Token Queue</span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800">
                        {todayTokens.length} Issued Today
                      </span>
                    </h3>
                    <p className="text-[11px] text-slate-500 hidden">
                      Search token number, patient name, UID, or phone below to automatically identify and load the patient.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {selectedToken && (
                    <div className="flex items-center gap-1 px-2 py-0.5 bg-emerald-50 border border-emerald-300 rounded-xl text-xs font-bold text-emerald-800">
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

                  {/* Minimize / Maximize Toggle Button for Active Token Queue */}
                  <button
                    type="button"
                    onClick={() => setIsTokenQueueMinimized(!isTokenQueueMinimized)}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold text-slate-600 hover:text-indigo-700 bg-slate-100 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-200 transition-all shrink-0"
                    title={isTokenQueueMinimized ? "Expand Token Queue" : "Minimize Token Queue"}
                    aria-label={isTokenQueueMinimized ? "Expand Token Queue" : "Minimize Token Queue"}
                  >
                    {isTokenQueueMinimized ? (
                      <>
                        <ChevronDown className="w-3.5 h-3.5 text-indigo-600" />
                        <span className="hidden sm:inline">Expand</span>
                      </>
                    ) : (
                      <>
                        <ChevronUp className="w-3.5 h-3.5 text-indigo-600" />
                        <span className="hidden sm:inline">Minimize</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Collapsible Token Queue Body */}
              {!isTokenQueueMinimized && (
                <>
              {/* Centered Mounted Token Search Bar with Dropdown Menu */}
              <div className="max-w-xl mx-auto w-full relative">
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
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
                    className="w-full pl-9 pr-9 py-1.5 bg-slate-50 hover:bg-white focus:bg-white border-2 border-slate-200 focus:border-indigo-500 rounded-lg text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/10 transition-all text-slate-900 placeholder:text-slate-400 shadow-xs text-center"
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
                  <div className="absolute z-30 left-0 right-0 mt-1.5 bg-white border border-slate-200 rounded-2xl shadow-xl max-h-44 overflow-y-auto divide-y divide-slate-100 animate-in fade-in duration-100">
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
                          <div className="flex items-center gap-2">
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
                <div className="p-2 bg-gradient-to-r from-indigo-50/90 via-blue-50/70 to-emerald-50/90 border-2 border-indigo-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 animate-in fade-in">
                  <div className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white font-mono font-black text-sm flex items-center justify-center shadow-sm shrink-0">
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
                      <p className="text-[11px] text-slate-600 mt-0.5 hidden">
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
                </>
              )}
            </div>

            <div className="grid grid-cols-1 gap-3 lg:grid-cols-12 lg:items-stretch">
              {/* Stock directory and search */}
              <div ref={stockDirectoryRef} className="min-w-0 space-y-2 lg:col-start-1 lg:col-end-6 lg:row-start-1">
                {/* Item Type Selector & Search Controls */}
                <div className="bg-white p-2.5 rounded-2xl border border-slate-200/80 shadow-xs space-y-2">
                  {/* Item Type Switcher (All vs Medicines vs Surgical) */}
                  <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-100/90 rounded-xl border border-slate-200">
                    <button
                      type="button"
                      onClick={() => setActiveItemType("ALL")}
                      aria-pressed={activeItemType === "ALL"}
                      className={`min-w-0 py-1.5 px-1 rounded-lg text-[11px] sm:text-xs font-bold flex items-center justify-center gap-1 sm:gap-1.5 transition-all ${
                        activeItemType === "ALL"
                          ? "bg-white text-slate-900 shadow-xs border border-slate-200"
                          : "text-slate-600 hover:text-slate-900"
                      }`}
                    >
                      <Layers className="hidden size-3.5 shrink-0 min-[375px]:inline-block text-amber-600" />
                      <span>All Inventory</span>
                      <span className="text-[10px] px-1.5 py-0.2 rounded-full font-mono bg-slate-200/80 text-slate-700">
                        {catalogSummary.totalCombined}
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setActiveItemType("MEDICINE")}
                      aria-pressed={activeItemType === "MEDICINE"}
                      className={`min-w-0 py-1.5 px-1 rounded-lg text-[11px] sm:text-xs font-bold flex items-center justify-center gap-1 sm:gap-1.5 transition-all ${
                        activeItemType === "MEDICINE"
                          ? "bg-emerald-600 text-white shadow-xs shadow-emerald-600/30"
                          : "text-slate-600 hover:text-emerald-700 hover:bg-emerald-50/60"
                      }`}
                    >
                      <Pill className="hidden size-3.5 shrink-0 min-[375px]:inline-block" />
                      <span>Medicines</span>
                      <span
                        className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
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
                      onClick={() => setActiveItemType("SURGICAL")}
                      aria-pressed={activeItemType === "SURGICAL"}
                      className={`min-w-0 py-1.5 px-1 rounded-lg text-[11px] sm:text-xs font-bold flex items-center justify-center gap-1 sm:gap-1.5 transition-all ${
                        activeItemType === "SURGICAL"
                          ? "bg-sky-600 text-white shadow-xs shadow-sky-600/30"
                          : "text-slate-600 hover:text-sky-700 hover:bg-sky-50/60"
                      }`}
                    >
                      <Scissors className="hidden size-3.5 shrink-0 min-[375px]:inline-block" />
                      <span>Surgical</span>
                      <span
                        className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                          activeItemType === "SURGICAL"
                            ? "bg-sky-700 text-white"
                            : "bg-sky-100 text-sky-800"
                        }`}
                      >
                        {catalogSummary.totalSurgical}
                      </span>
                    </button>
                  </div>

                  {/* Search Input Bar with Filter Tag */}
                  <div className="flex gap-2">
                    <div className="relative min-w-0 flex-1">
                      <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        aria-label="Search stock directory"
                        placeholder={
                          activeItemType === "MEDICINE"
                            ? "Search medicine name, generic name, formula, or batch..."
                            : activeItemType === "SURGICAL"
                            ? "Search surgical item, category, or batch number..."
                            : "Search medicine or surgical item by name, generic, or batch..."
                        }
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            fetchMedicines();
                          }
                        }}
                        className="w-full pl-9 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-amber-500 text-slate-900 placeholder:text-slate-400 transition-all"
                      />
                      {searchQuery && (
                        <button
                          type="button"
                          onClick={() => {
                            setSearchQuery("");
                          }}
                          aria-label="Clear stock search"
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
                        >
                          <X className="size-3.5" />
                        </button>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => fetchMedicines()}
                      disabled={loadingCatalog}
                      className="px-3.5 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 shrink-0 disabled:opacity-50"
                    >
                      <Search className="hidden size-3.5 shrink-0 min-[375px]:inline-block" />
                      <span>{loadingCatalog ? "..." : "Search"}</span>
                    </button>
                  </div>

                </div>

                <section aria-label="Stock Directory" aria-busy={loadingCatalog} className="min-w-0 rounded-2xl border border-slate-200 bg-white shadow-sm">
                  <div className="flex h-10 items-center justify-between gap-2 border-b border-slate-100 px-3">
                    <h3 className="flex items-center gap-1.5 text-xs font-bold text-slate-900">
                      <Layers aria-hidden="true" className="size-3.5 text-amber-600" />
                      Stock Directory
                    </h3>
                    <span className="text-[11px] tabular-nums text-slate-500">
                      {loadingCatalog ? "Searching…" : catalogError ? "" : catalogTotal.toLocaleString() + " items"}
                    </span>
                  </div>

                  <div className="grid h-56 grid-cols-2 grid-rows-2 gap-2 p-2">
                    {loadingCatalog || catalogError || medicines.length === 0 ? (
                      <p className="col-span-2 row-span-2 grid place-items-center text-center text-xs text-slate-500">
                        {loadingCatalog
                          ? "Loading stock…"
                          : catalogError
                          ? "Stock directory unavailable. Select Search to retry."
                          : "No items match your search."}
                      </p>
                    ) : (
                      medicines.slice(0, CATALOG_PAGE_SIZE).map((med) => {
                        const canAdd = med.totalStock > 0 && Boolean(med.activeBatch);
                        const isSurgical = med.itemType === "SURGICAL";
                        const price = "Rs. " + med.sellingPrice.toLocaleString();

                        return (
                          <button
                            key={med.id}
                            type="button"
                            onClick={() => addToCart(med)}
                            disabled={!canAdd}
                            aria-label={canAdd ? "Add " + med.name + " to cart, " + price + " per unit" : med.name + ", unavailable"}
                            className="flex min-h-0 min-w-0 flex-col justify-between rounded-xl border border-slate-200 bg-slate-50/60 p-2 text-left transition-colors enabled:hover:border-amber-300 enabled:hover:bg-amber-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-600 disabled:cursor-not-allowed"
                          >
                            <span className="block min-w-0">
                              <span title={med.name} className="line-clamp-2 break-words text-xs font-bold leading-tight text-slate-900">
                                {med.name}
                              </span>
                              {med.genericName && (
                                <span title={med.genericName} className="block truncate text-[10px] leading-tight text-slate-600">
                                  {med.genericName}
                                </span>
                              )}
                            </span>
                            <span className="flex w-full min-w-0 items-end justify-between gap-1">
                              <span className="min-w-0">
                                <span className="block break-words text-xs font-extrabold leading-tight tabular-nums text-slate-900">
                                  {price}
                                </span>
                                <span className={med.isLowStock ? "block text-[10px] leading-tight text-amber-700" : "block text-[10px] leading-tight text-slate-500"}>
                                  {canAdd ? med.totalStock.toLocaleString() + " in stock" : "Unavailable"}
                                </span>
                              </span>
                              <span
                                aria-hidden="true"
                                className={`inline-flex min-h-7 shrink-0 items-center rounded-lg px-2 py-1 text-[11px] font-bold ${
                                  canAdd
                                    ? isSurgical ? "bg-sky-700 text-white" : "bg-amber-600 text-white"
                                    : "bg-slate-200 text-slate-500"
                                }`}
                              >
                                Add
                              </span>
                            </span>
                          </button>
                        );
                      })
                    )}
                  </div>

                  <nav aria-label="Stock directory pages" className="flex h-10 items-center justify-between gap-2 border-t border-slate-100 px-2 text-[11px]">
                    <button
                      type="button"
                      onClick={() => fetchMedicines(catalogPage - 1)}
                      disabled={loadingCatalog || catalogError || catalogPage <= 1}
                      className="rounded-lg border border-slate-200 px-2 py-1 font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40"
                    >
                      Previous
                    </button>
                    <span className="tabular-nums text-slate-500">
                      Page {catalogPage} of {Math.max(1, Math.ceil(catalogTotal / CATALOG_PAGE_SIZE))}
                    </span>
                    <button
                      type="button"
                      onClick={() => fetchMedicines(catalogPage + 1)}
                      disabled={loadingCatalog || catalogError || !catalogHasNext}
                      className="rounded-lg border border-slate-200 px-2 py-1 font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40"
                    >
                      Next
                    </button>
                  </nav>
                </section>
              </div>

              {/* Cart spans the stock directory and calculator rows on desktop. */}
              <section aria-label="POS terminal cart" className="relative min-w-0 lg:col-start-6 lg:col-end-13 lg:row-start-1 lg:row-end-3">
                <div
                  ref={cartPanelRef}
                  className="flex flex-col gap-3 rounded-2xl border border-slate-200/80 bg-white p-3 shadow-xs lg:absolute lg:inset-x-0 lg:top-0 lg:max-h-full lg:min-h-[var(--stock-directory-height,0px)]"
                >
                  {/* Header: Title & Patient Identification */}
                  <div className="flex shrink-0 flex-col gap-2 border-b border-slate-100 pb-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="rounded-lg bg-amber-100 p-1.5 text-amber-800">
                          <ShoppingCart className="w-4 h-4 text-amber-600" />
                        </div>
                        <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                          <span>POS Terminal Cart</span>
                          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] text-slate-700">
                            {cart.length} {cart.length === 1 ? "item" : "items"}
                          </span>
                          {cart.length > 0 && (
                            <button
                              type="button"
                              onClick={() => setCart([])}
                              className="text-xs text-red-600 hover:text-red-700 font-semibold underline"
                            >
                              Clear
                            </button>
                          )}
                        </h3>
                      </div>
                    </div>

                    {/* Patient Identification Badge */}
                    <div>
                      {linkedPatient ? (
                        <div className="p-2 bg-blue-50 border border-blue-200 rounded-xl flex items-center justify-between gap-2">
                          <div>
                            <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                              {selectedToken && (
                                <span className="w-4 h-4 rounded bg-indigo-600 text-white font-mono font-bold text-[8px] flex items-center justify-center shrink-0">
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
                          <div className="flex items-center gap-1.5 shrink-0">
                            <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-emerald-100 text-emerald-800">
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
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5">
                          <input
                            type="text"
                            placeholder="Patient UID or search..."
                            value={patientUidInput}
                            onChange={(e) => setPatientUidInput(e.target.value)}
                            className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-slate-900 focus:outline-none focus:ring-1 focus:ring-amber-500 flex-1 min-w-0"
                          />
                          <button
                            type="button"
                            onClick={handleLookupPatient}
                            disabled={patientLookupLoading || !patientUidInput.trim()}
                            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold disabled:opacity-40 shrink-0"
                          >
                            {patientLookupLoading ? "..." : "Link"}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  <p role="status" className="sr-only">
                    {lastAddedCartItem && `${lastAddedCartItem.medicineName}, quantity ${lastAddedCartItem.quantity} in cart`}
                  </p>
                  <div
                    ref={cartListRef}
                    role="region"
                    aria-label="Cart items"
                    tabIndex={0}
                    className="max-h-[36rem] min-h-0 min-w-0 overflow-y-auto overflow-x-hidden overscroll-contain rounded-xl border border-slate-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-600 [overflow-anchor:none] [scrollbar-gutter:stable] lg:max-h-none lg:flex-auto"
                  >
                    {cart.length === 0 ? (
                      <p className="px-3 py-6 text-center text-xs text-slate-500">
                        Use + Add in the stock directory to put items in the cart.
                      </p>
                    ) : (
                      <ul className="divide-y divide-slate-100">
                        {displayedCartItems.map((item) => (
                          <li
                            key={item.medicineId}
                            className={`grid h-24 min-w-0 grid-cols-[auto_minmax(0,1fr)_auto] grid-rows-[minmax(0,1fr)_auto] items-center gap-x-2 gap-y-1 px-2.5 py-2 sm:h-[3.25rem] sm:py-1 sm:grid-cols-[minmax(0,1fr)_auto_minmax(0,7rem)_auto] sm:grid-rows-1 sm:gap-x-3 ${item === lastAddedCartItem ? "bg-amber-50" : "hover:bg-slate-50/60"}`}
                          >
                            <div className="col-span-3 min-w-0 sm:col-span-1">
                              <p className="line-clamp-2 break-words text-xs font-bold leading-tight text-slate-900" title={item.medicineName}>
                                {item.medicineName}
                              </p>
                              {item.genericName && (
                                <p className="line-clamp-2 break-words text-[10px] leading-tight text-slate-600 sm:line-clamp-1" title={item.genericName}>
                                  {item.genericName}
                                </p>
                              )}
                            </div>

                            <div className="inline-flex items-center overflow-hidden rounded-lg border border-slate-200 bg-white">
                              <button
                                type="button"
                                aria-label={"Decrease quantity of " + item.medicineName}
                                onClick={() => updateQuantity(item.medicineId, -1)}
                                className="grid size-7 place-items-center text-slate-600 hover:bg-slate-100"
                              >
                                <Minus aria-hidden="true" className="size-3.5" />
                              </button>
                              <input
                                type="number"
                                aria-label={"Quantity of " + item.medicineName}
                                min={1}
                                max={item.maxStock}
                                value={typedQuantities[item.medicineId] ?? item.quantity}
                                onChange={(e) => handleTypedQuantityChange(item.medicineId, e.target.value)}
                                onBlur={() => handleTypedQuantityBlur(item.medicineId, item.maxStock)}
                                className="h-7 w-10 border-x border-slate-200 bg-slate-50 text-center text-xs font-bold tabular-nums text-slate-900 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-amber-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                              />
                              <button
                                type="button"
                                aria-label={"Increase quantity of " + item.medicineName}
                                onClick={() => updateQuantity(item.medicineId, 1)}
                                className="grid size-7 place-items-center text-slate-600 hover:bg-slate-100"
                              >
                                <Plus aria-hidden="true" className="size-3.5" />
                              </button>
                            </div>

                            <div className="min-w-0 break-words text-right tabular-nums">
                              <p className="text-xs font-bold leading-tight text-slate-900">
                                <span className="sr-only">Line total </span>
                                Rs. {(item.quantity * item.unitPrice).toLocaleString()}
                              </p>
                              <p className="text-[10px] leading-tight text-slate-600">
                                Rs. {item.unitPrice.toLocaleString()} each
                              </p>
                            </div>

                            <button
                              type="button"
                              onClick={() => removeFromCart(item.medicineId)}
                              className="grid size-7 place-items-center rounded-lg text-slate-500 hover:bg-red-50 hover:text-red-700"
                              aria-label={"Remove " + item.medicineName}
                              title="Remove item"
                            >
                              <Trash2 aria-hidden="true" className="size-3.5" />
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              </section>

              {/* Cashier Calculator Section */}
              <section aria-label="Cashier calculator" className="min-w-0 space-y-3 rounded-xl bg-slate-900 p-4 text-white shadow-md lg:col-start-1 lg:col-end-6 lg:row-start-2">
                <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-300">
                      Cashier Calculator
                    </span>
                    <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 border border-slate-700">
                      Cash Tender
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-cyan-400">
                    Dispensary Sale
                  </span>
                </div>

                {/* Prominent OPD Token Link Banner if Token is Attached */}
                {selectedToken && (
                  <div className="p-2.5 bg-gradient-to-r from-indigo-950 via-slate-900 to-indigo-950 border border-indigo-500/40 rounded-lg space-y-1 shadow-inner">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white font-mono font-black text-xs flex items-center justify-center shrink-0">
                          #{String(selectedToken.tokenNumber).padStart(2, "0")}
                        </div>
                        <div>
                          <div className="text-[11px] font-black text-white flex items-center gap-1.5">
                            <span>TOKEN #{String(selectedToken.tokenNumber).padStart(2, "0")} LINKED</span>
                          </div>
                          <p className="text-[10px] text-slate-300 truncate max-w-[170px]">
                            {linkedPatient?.name || "Walk-in Patient"}
                          </p>
                        </div>
                      </div>
                      <div className="text-right shrink-0 bg-slate-800/90 px-2 py-1 rounded border border-slate-700">
                        <span className="text-[8px] font-bold uppercase tracking-wider text-slate-400 block">Due</span>
                        <span className="text-xs font-mono font-black text-cyan-400">
                          Rs. {netPayable.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* 3 Calculator Inputs: Subtotal (locked), Discount (locked), Cash Tendered (editable) */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {/* 1. Subtotal Billed (NON-EDITABLE) */}
                  <div>
                    <div className="flex items-center justify-between mb-0.5">
                      <label className="text-[10px] font-medium text-slate-400">
                        Subtotal Gross
                      </label>
                      <span className="text-[8px] font-bold text-slate-400 uppercase flex items-center gap-0.5">
                        <Lock className="w-2 h-2" />
                        <span>Lock</span>
                      </span>
                    </div>
                    <div className="relative">
                      <input
                        type="text"
                        readOnly
                        disabled
                        value={`Rs. ${rawSubtotal.toLocaleString()}`}
                        className="w-full bg-slate-800/80 border border-slate-700/80 rounded-lg px-2 py-1.5 text-xs font-extrabold text-slate-200 cursor-not-allowed select-none pl-6"
                      />
                      <Lock className="w-3 h-3 text-slate-500 absolute left-2 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                  </div>

                  {/* 2. Total Generic / Promotional Discount (NON-EDITABLE) */}
                  <div>
                    <div className="flex items-center justify-between mb-0.5">
                      <label className="text-[10px] font-medium text-slate-400">
                        Discount
                      </label>
                      <span className="text-[8px] font-bold text-slate-400 uppercase flex items-center gap-0.5">
                        <Lock className="w-2 h-2" />
                        <span>Auto</span>
                      </span>
                    </div>
                    <div className="relative">
                      <input
                        type="text"
                        readOnly
                        disabled
                        value={`- Rs. ${genericDiscountTotal.toLocaleString()}`}
                        className="w-full bg-slate-800/80 border border-slate-700/80 rounded-lg px-2 py-1.5 text-xs font-extrabold text-purple-400 cursor-not-allowed select-none pl-6"
                      />
                      <Tag className="w-3 h-3 text-purple-500 absolute left-2 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                  </div>

                  {/* 3. Cash Tendered (ONLY EDITABLE CASHIER INPUT) */}
                  <div>
                    <div className="flex items-center justify-between mb-0.5">
                      <label className="text-[10px] font-bold text-amber-400">
                        Cash Received *
                      </label>
                      <span className="text-[8px] font-bold text-emerald-400 uppercase">
                        Editable
                      </span>
                    </div>
                    <div className="relative">
                      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-amber-400 pointer-events-none">
                        Rs.
                      </span>
                      <input
                        type="number"
                        min="0"
                        step="any"
                        placeholder="0"
                        value={cashTendered === 0 ? "" : cashTendered}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value);
                          setCashTendered(isNaN(val) ? 0 : Math.max(0, val));
                        }}
                        className="w-full bg-slate-800 border-2 border-amber-500/80 focus:border-amber-400 focus:ring-1 focus:ring-amber-400 rounded-lg pl-8 pr-2 py-1.5 text-xs font-black text-white focus:outline-none transition-all placeholder:text-slate-600"
                      />
                    </div>
                  </div>
                </div>

                {/* Quick Tender Suggestions */}
                <div className="flex min-h-6 flex-wrap items-center gap-1">
                  {netPayable > 0 && (
                    <>
                      <span className="text-[9px] text-slate-400 font-medium">Quick Cash:</span>
                      {[
                        netPayable,
                        Math.ceil(netPayable / 50) * 50,
                        Math.ceil(netPayable / 100) * 100,
                        Math.ceil(netPayable / 500) * 500,
                        Math.ceil(netPayable / 1000) * 1000,
                      ]
                        .filter((v, i, a) => v >= netPayable && a.indexOf(v) === i)
                        .slice(0, 4)
                        .map((val) => (
                          <button
                            key={val}
                            type="button"
                            onClick={() => setCashTendered(val)}
                            className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded border transition-all ${
                              cashTendered === val
                                ? "bg-amber-500 text-white border-amber-400"
                                : "bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700"
                            }`}
                          >
                            Rs. {val.toLocaleString()}
                          </button>
                        ))}
                    </>
                  )}
                </div>

                {/* Live Balance / Change Return Banner */}
                <div className="p-2.5 bg-slate-800/90 rounded-lg flex items-center justify-between text-xs font-bold border border-slate-700">
                  <div>
                    <span className="text-slate-400 text-[10px]">Net Payable:</span>
                    <span className="ml-1 text-sm font-black text-white font-mono">
                      Rs. {netPayable.toLocaleString()}
                    </span>
                  </div>
                  <div>
                    {cashTendered >= netPayable ? (
                      <div className="flex items-center gap-1">
                        <span className="text-slate-400 text-[10px]">Change:</span>
                        <span className="ml-1 text-sm font-black text-emerald-400 font-mono">
                          Rs. {changeToReturn.toLocaleString()}
                        </span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1 text-rose-400">
                        <span className="text-[10px] font-semibold">Short:</span>
                        <span className="font-bold text-xs font-mono">
                          Rs. {(netPayable - cashTendered).toLocaleString()}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Action Button */}
                <div className="pt-1">
                  <button
                    type="button"
                    onClick={handleCheckout}
                    disabled={cart.length === 0 || checkingOut}
                    className="w-full py-3 px-4 bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700 hover:from-amber-600 hover:to-amber-800 text-white rounded-xl font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-amber-500/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:scale-[1.01] active:scale-[0.99]"
                  >
                    <Printer className="w-4 h-4" />
                    <span>
                      {checkingOut
                        ? "Processing Sale..."
                        : cart.length > 0
                        ? `Dispense & Print (Rs. ${netPayable.toLocaleString()})`
                        : "⚠️ Cart is Empty"}
                    </span>
                  </button>
                </div>
              </section>
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
                    {ultrasoundServices.map((us) => {
                      const isSelected = selectedService.name === us.name;
                      const tag = us.name.replace(/^Ultrasound\s+/i, "") || "Scan";
                      return (
                        <button
                          key={us.name}
                          type="button"
                          onClick={() => {
                            const match = ultrasoundServices.find((s) => s.name === us.name) || {
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
                                {tag}
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

        {/* TAB: MEDICINE RETURNS */}
        {activeTab === "returns" && (
          <PharmacyMedicineReturnsView
            onStockUpdated={() => {
              fetchMedicines();
              fetchDailyStats();
            }}
          />
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
                  {restockLoading && <p className="text-xs text-slate-500">Loading catalogue...</p>}
                  {restockError && <p className="text-xs text-red-600">Catalogue unavailable. Close and reopen to retry.</p>}
                  <select
                    disabled={restockLoading || restockError}
                    value={batchForm.medicineId}
                    onChange={(e) => {
                      const mid = e.target.value;
                      const found = restockMedicines.find((m) => m.id === mid);
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
                    {restockMedicines.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name} ({m.genericName}) · Current Stock: {m.totalStock} · Alert Min: {m.threshold} · Per-Off: {m.perOff || 0}%
                      </option>
                    ))}
                  </select>
                </div>

                {!batchForm.medicineId && !restockLoading && !restockError && (
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
                    disabled={submittingBatch || restockLoading || restockError}
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


"use client";

import React, { useState, useEffect } from "react";
import {
  Menu,
  X,
  BarChart3,
  Users,
  Calendar,
  ShieldAlert,
  Package,
  FileSpreadsheet,
  History,
  Stethoscope,
  UserCheck,
  Download,
  Building2,
  ChevronRight,
  Sparkles,
} from "lucide-react";

export type AdminTab =
  | "dashboard"
  | "users"
  | "daily"
  | "approvals"
  | "inventory"
  | "reports"
  | "audit"
  | "services"
  | "doctors"
  | "network";

interface AdminMobileNavDrawerProps {
  activeTab: AdminTab;
  onSelectTab: (tab: AdminTab) => void;
  pendingApprovalsCount?: number;
}

export function AdminMobileNavDrawer({
  activeTab,
  onSelectTab,
  pendingApprovalsCount = 0,
}: AdminMobileNavDrawerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isAppInstalled, setIsAppInstalled] = useState(false);

  // Capture beforeinstallprompt for PWA install button
  useEffect(() => {
    const handleBeforeInstall = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    const handleAppInstalled = () => {
      setIsAppInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstall);
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setDeferredPrompt(null);
    }
  };

  const navItems: {
    id: AdminTab;
    label: string;
    sublabel: string;
    icon: React.ElementType;
    badge?: number;
  }[] = [
    {
      id: "dashboard",
      label: "Executive Dashboard",
      sublabel: "Overview & P&L Analysis",
      icon: BarChart3,
    },
    {
      id: "users",
      label: "Users & Staff Accounts",
      sublabel: "Roles & Access Control",
      icon: Users,
    },
    {
      id: "daily",
      label: "Daily Sales Reconciliation",
      sublabel: "Cashier Drawers & Summary",
      icon: Calendar,
    },
    {
      id: "approvals",
      label: "Approvals Center",
      sublabel: "Batches, Restocks & Audits",
      icon: ShieldAlert,
      badge: pendingApprovalsCount,
    },
    {
      id: "inventory",
      label: "Medical Inventory",
      sublabel: "Catalog, Stock & Purchases",
      icon: Package,
    },
    {
      id: "reports",
      label: "Official Reports & Exports",
      sublabel: "CSV, Print & Enquiries",
      icon: FileSpreadsheet,
    },
    {
      id: "audit",
      label: "Immutable Audit Trail",
      sublabel: "Security & System Logs",
      icon: History,
    },
    {
      id: "services",
      label: "Services & Tariff",
      sublabel: "Ultrasound & Token Pricing",
      icon: Stethoscope,
    },
    {
      id: "doctors",
      label: "Doctors & Dynamic Pay",
      sublabel: "Attendance, Leaves & Payroll",
      icon: UserCheck,
    },
  ];

  const currentItem = navItems.find((item) => item.id === activeTab) || navItems[0];
  const CurrentIcon = currentItem.icon;

  return (
    <>
      {/* Sticky Compact Mobile Bar (Visible only on < lg screens) */}
      <div className="lg:hidden sticky top-0 z-30 bg-slate-900 text-white px-3.5 py-2.5 rounded-2xl shadow-lg flex items-center justify-between border border-slate-800 mb-4">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="p-1.5 bg-purple-600/30 border border-purple-500/40 rounded-xl text-purple-300 shrink-0">
            <CurrentIcon className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <span className="text-[10px] text-purple-300 font-bold uppercase tracking-wider block">
              Admin Portal
            </span>
            <span className="text-xs font-black truncate block">{currentItem.label}</span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {deferredPrompt && !isAppInstalled && (
            <button
              type="button"
              onClick={handleInstallClick}
              className="px-2.5 py-1.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-xl text-[11px] font-extrabold flex items-center gap-1 shadow-sm transition-all"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Install App</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setIsOpen(true)}
            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-xl border border-slate-700 flex items-center gap-1.5 text-xs font-bold transition-all relative"
            aria-label="Open Admin Menu"
          >
            <Menu className="w-4 h-4" />
            <span className="hidden sm:inline">Sections</span>
            {pendingApprovalsCount > 0 && (
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse absolute -top-0.5 -right-0.5" />
            )}
          </button>
        </div>
      </div>

      {/* Slide-over Mobile Drawer Backdrop */}
      {isOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          {/* Backdrop overlay */}
          <div
            className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
            onClick={() => setIsOpen(false)}
          />

          {/* Drawer Sheet */}
          <div className="fixed inset-y-0 right-0 max-w-xs w-full bg-slate-900 text-white shadow-2xl flex flex-col z-10 border-l border-slate-800 animate-in slide-in-from-right duration-200">
            {/* Drawer Header */}
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-purple-600 flex items-center justify-center font-black text-sm text-white shadow-md shadow-purple-600/30">
                  RMC
                </div>
                <div>
                  <h3 className="text-xs font-black">Admin Management</h3>
                  <p className="text-[10px] text-slate-400">Ruqayya Medical Center</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors"
                aria-label="Close menu"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* PWA Install Banner inside Drawer */}
            {deferredPrompt && !isAppInstalled && (
              <div className="p-3 mx-3 my-2 bg-gradient-to-r from-purple-950/80 to-slate-800 border border-purple-500/30 rounded-xl">
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <span className="text-xs font-bold text-white flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                      <span>RMC Admin Mobile App</span>
                    </span>
                    <p className="text-[10px] text-slate-400 truncate">Install on home screen</p>
                  </div>
                  <button
                    type="button"
                    onClick={handleInstallClick}
                    className="px-2.5 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-bold shrink-0 transition-colors shadow-xs"
                  >
                    Install
                  </button>
                </div>
              </div>
            )}

            {/* Navigation List */}
            <div className="flex-1 overflow-y-auto p-3 space-y-1 scrollbar-thin">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isSelected = activeTab === item.id;

                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      onSelectTab(item.id);
                      setIsOpen(false);
                    }}
                    className={`w-full p-2.5 rounded-xl flex items-center justify-between text-left transition-all ${
                      isSelected
                        ? "bg-purple-600 text-white shadow-md shadow-purple-600/30"
                        : "hover:bg-slate-800/80 text-slate-300 hover:text-white"
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`p-2 rounded-lg shrink-0 ${
                          isSelected ? "bg-purple-700 text-white" : "bg-slate-800 text-slate-400"
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-bold truncate">{item.label}</div>
                        <div
                          className={`text-[10px] truncate ${
                            isSelected ? "text-purple-200" : "text-slate-400"
                          }`}
                        >
                          {item.sublabel}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0 ml-2">
                      {item.badge !== undefined && item.badge > 0 && (
                        <span className="px-1.5 py-0.5 rounded-full text-[9px] font-black bg-amber-500 text-white">
                          {item.badge}
                        </span>
                      )}
                      <ChevronRight
                        className={`w-4 h-4 ${isSelected ? "text-white" : "text-slate-500"}`}
                      />
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Drawer Footer */}
            <div className="p-3 border-t border-slate-800 text-center text-[10px] text-slate-500">
              Hospital Management System · v1.0 Production
            </div>
          </div>
        </div>
      )}
    </>
  );
}

import React from "react";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { MedicinePurchaseSheetView } from "@/components/inventory/MedicinePurchaseSheetView";
import Link from "next/link";
import { ArrowLeft, Building2 } from "lucide-react";

export const metadata = {
  title: "289 Medicines Purchase Sheet | Ruqayya Clinic Pharmacy",
  description: "Complete 289 hospital & pharmacy medicines purchase sheet with real-time cost calculation",
};

export default async function PharmacistInventoryPage() {
  const session = await getServerSession(authOptions);

  if (!session || (session.user.role !== "PHARMACIST" && session.user.role !== "ADMIN")) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      {/* Top Header */}
      <header className="bg-slate-900 border-b border-slate-800 px-6 py-4 sticky top-0 z-30 shadow-md">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/pharmacist"
              className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl transition-colors flex items-center gap-1.5 text-xs font-bold"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Pharmacy POS</span>
            </Link>
            <div className="h-5 w-[1px] bg-slate-700 hidden sm:block" />
            <div className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-emerald-400" />
              <span className="text-white font-black text-sm tracking-tight">
                Ruqayya Clinic Pharmacy · 289 Medicines Sheet
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-300">
            <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-400 font-bold border border-emerald-500/30">
              Pharmacist Portal
            </span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <MedicinePurchaseSheetView portalRole="PHARMACIST" />
      </main>
    </div>
  );
}

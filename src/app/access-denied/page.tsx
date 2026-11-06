"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  ShieldAlert,
  Building2,
  Lock,
  ArrowLeft,
  Server,
  RefreshCw,
  HelpCircle,
  AlertTriangle,
} from "lucide-react";

function AccessDeniedContent() {
  const searchParams = useSearchParams();
  const portal = searchParams.get("portal") || "Requested";
  const ip = searchParams.get("ip") || "Unknown IP";
  const reason = searchParams.get("reason") || "Your workstation IP is not whitelisted for this portal.";

  const portalNames: Record<string, string> = {
    admin: "Admin Control Center",
    receptionist: "Reception Desk Portal",
    doctor: "Doctor Consultation Portal",
    pharmacist: "Pharmacy POS Portal",
  };

  const portalDisplayName = portalNames[portal.toLowerCase()] || `${portal.toUpperCase()} Portal`;

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background glow decoration */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[350px] bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-xl relative z-10 px-4">
        {/* Header Branding */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center p-3.5 bg-rose-500/10 border border-rose-500/20 rounded-2xl mb-4 text-rose-400 shadow-lg shadow-rose-950/50">
            <ShieldAlert className="w-9 h-9" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Workstation Access Restricted
          </h1>
          <p className="mt-1.5 text-xs sm:text-sm text-slate-400">
            Ruqayya Hospital & Pharmacy Security Enforcement
          </p>
        </div>

        {/* Security Alert Card */}
        <div className="bg-slate-800/90 border border-slate-700/80 rounded-2xl p-6 sm:p-8 shadow-2xl backdrop-blur-sm space-y-6">
          {/* Status Badge */}
          <div className="p-3.5 bg-rose-950/60 border border-rose-800/80 rounded-xl flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
            <div>
              <h2 className="text-xs font-bold text-rose-300 uppercase tracking-wide">
                Terminal Authorization Failed (HTTP 403 Forbidden)
              </h2>
              <p className="text-xs text-rose-200/90 mt-0.5 leading-relaxed">
                {reason}
              </p>
            </div>
          </div>

          {/* Details Table */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl divide-y divide-slate-800 text-xs">
            <div className="p-3.5 flex items-center justify-between">
              <span className="text-slate-400 font-medium flex items-center gap-2">
                <Server className="w-4 h-4 text-slate-400" />
                Detected Workstation IP:
              </span>
              <span className="font-mono font-bold text-amber-300 bg-amber-950/60 px-2.5 py-1 rounded-md border border-amber-800/80">
                {ip}
              </span>
            </div>

            <div className="p-3.5 flex items-center justify-between">
              <span className="text-slate-400 font-medium flex items-center gap-2">
                <Lock className="w-4 h-4 text-slate-400" />
                Restricted Target Portal:
              </span>
              <span className="font-semibold text-white">
                {portalDisplayName}
              </span>
            </div>

            <div className="p-3.5 flex items-center justify-between">
              <span className="text-slate-400 font-medium flex items-center gap-2">
                <Building2 className="w-4 h-4 text-slate-400" />
                Hospital Policy:
              </span>
              <span className="text-slate-300 font-medium">
                Terminal Department Whitelisting Active
              </span>
            </div>
          </div>

          {/* Advisory Notice */}
          <div className="p-4 bg-slate-900/50 border border-slate-800 rounded-xl text-slate-300 text-xs leading-relaxed space-y-2">
            <div className="flex items-center gap-1.5 font-bold text-slate-200">
              <HelpCircle className="w-4 h-4 text-blue-400" />
              <span>How to Resolve This:</span>
            </div>
            <ul className="list-disc list-inside space-y-1 text-slate-400 pl-1 text-[11px]">
              <li>
                <strong>Designated Terminal:</strong> Ensure you are using the computer physically stationed in your department (e.g., Reception Desk or Pharmacy counter).
              </li>
              <li>
                <strong>Whitelist Registration:</strong> If this computer belongs to this department, request your System Administrator to add IP <code className="text-amber-300 font-bold bg-slate-800 px-1 py-0.5 rounded">{ip}</code> to <code className="text-cyan-300 font-bold bg-slate-800 px-1 py-0.5 rounded">ALLOWED_IPS_{portal.toUpperCase()}</code>.
              </li>
              <li>
                <strong>Contact Support:</strong> Contact Hospital IT Administration at <span className="text-blue-400 underline">admin@hms.local</span>.
              </li>
            </ul>
          </div>

          {/* Navigation Actions */}
          <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
            <Link
              href="/login"
              className="w-full sm:w-1/2 py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold text-center flex items-center justify-center gap-2 transition-colors shadow-sm"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Return to Login</span>
            </Link>

            <button
              onClick={() => window.location.reload()}
              className="w-full sm:w-1/2 py-2.5 px-4 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 hover:text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Retry Access</span>
            </button>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-[11px] text-slate-500 mt-6">
          Ruqayya Hospital & Pharmacy Management System • On-Premise Local Network
        </p>
      </div>
    </div>
  );
}

export default function AccessDeniedPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-900 flex items-center justify-center text-slate-400 text-xs">
          Loading access verification...
        </div>
      }
    >
      <AccessDeniedContent />
    </Suspense>
  );
}


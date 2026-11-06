"use client";

import { useState, Suspense } from "react";
import { signIn, getSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  UserCheck,
  Lock,
  Mail,
  ArrowRight,
  AlertCircle,
  Loader2,
  ArrowLeft,
  FileText,
  Activity,
} from "lucide-react";

function DoctorLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl");

  const [email, setEmail] = useState("doctor@hms.com");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const result = await signIn("credentials", {
        redirect: false,
        email: email.trim(),
        password,
      });

      if (result?.error) {
        setError(result.error);
        setLoading(false);
        return;
      }

      const session = await getSession();
      const role = session?.user?.role;

      if (role !== "DOCTOR" && role !== "ADMIN") {
        setError("Access Denied: This terminal is strictly for Hospital Physicians & Doctors.");
        setLoading(false);
        return;
      }

      if (callbackUrl) {
        router.push(callbackUrl);
      } else {
        router.push("/doctor");
      }
      router.refresh();
    } catch (err: any) {
      setError(err?.message || "Authentication failed. Please check credentials.");
      setLoading(false);
    }
  };

  return (
    <div className="bg-white/95 backdrop-blur-md py-8 px-6 shadow-2xl rounded-3xl sm:px-10 border border-slate-100">
      <div className="mb-6 pb-4 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-teal-600 animate-pulse" />
          <span className="text-[11px] font-black uppercase tracking-wider text-teal-700">
            Clinical Doctor Console
          </span>
        </div>
        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-teal-50 text-teal-700 font-bold border border-teal-200">
          ROLE: DOCTOR
        </span>
      </div>

      <form className="space-y-5" onSubmit={handleSubmit}>
        {error && (
          <div className="p-3.5 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs font-medium flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-600 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <div>
          <label
            htmlFor="email"
            className="block text-xs font-bold uppercase tracking-wider text-slate-700"
          >
            Physician Work Email
          </label>
          <div className="mt-1 relative rounded-xl shadow-xs">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <Mail className="h-4 w-4" />
            </div>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="doctor@hms.com"
              className="block w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-colors font-medium"
            />
          </div>
        </div>

        <div>
          <label
            htmlFor="password"
            className="block text-xs font-bold uppercase tracking-wider text-slate-700"
          >
            Password
          </label>
          <div className="mt-1 relative rounded-xl shadow-xs">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <Lock className="h-4 w-4" />
            </div>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="block w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-colors font-medium"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl shadow-lg shadow-teal-600/30 text-sm font-bold text-white bg-teal-600 hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 transition-all disabled:opacity-60"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Verifying Clinical Access...</span>
            </>
          ) : (
            <>
              <Activity className="w-4 h-4" />
              <span>Enter Clinical Consultation Console</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </form>

      <div className="mt-6 pt-5 border-t border-slate-100 flex items-center justify-between text-xs">
        <Link
          href="/login"
          className="text-slate-500 hover:text-slate-800 font-semibold flex items-center gap-1.5 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Department Portal Selector</span>
        </Link>
        <span className="text-[11px] text-slate-400 font-mono">OPD Consultation Room</span>
      </div>
    </div>
  );
}

export default function DoctorLoginPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-teal-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-teal-600 text-white shadow-xl shadow-teal-500/25 mb-4 ring-8 ring-teal-500/10">
          <UserCheck className="w-8 h-8" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
          Physician &amp; Clinical Workstation
        </h1>
        <p className="mt-2 text-xs sm:text-sm text-teal-200/80">
          Patient Consultation Queue, Medical Findings &amp; Electronic Prescriptions
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <Suspense
          fallback={
            <div className="p-8 bg-white/95 rounded-2xl text-center text-slate-500 text-sm">
              Loading physician console...
            </div>
          }
        >
          <DoctorLoginForm />
        </Suspense>

        <div className="mt-6 text-center text-xs text-teal-300/60">
          Clinical Examination Room · Ruqayya Clinic
        </div>
      </div>
    </div>
  );
}


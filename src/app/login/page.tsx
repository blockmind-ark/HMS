"use client";

import { useState, Suspense } from "react";
import { signIn, getSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  ShieldAlert,
  Building2,
  Stethoscope,
  Pill,
  Lock,
  Mail,
  ArrowRight,
  AlertCircle,
  Loader2,
  UserCheck,
} from "lucide-react";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl");

  const [email, setEmail] = useState("");
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

      // Fetch the updated session to get role-based destination
      const session = await getSession();
      const role = session?.user?.role;

      if (callbackUrl) {
        router.push(callbackUrl);
      } else if (role === "ADMIN") {
        router.push("/admin");
      } else if (role === "RECEPTIONIST") {
        router.push("/receptionist");
      } else if (role === "PHARMACIST") {
        router.push("/pharmacist");
      } else if (role === "DOCTOR") {
        router.push("/doctor");
      } else {
        router.push("/");
      }
      router.refresh();
    } catch (err: any) {
      setError(err?.message || "An unexpected error occurred. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="bg-white/95 backdrop-blur-md py-8 px-6 shadow-2xl rounded-2xl sm:px-10 border border-slate-100">
      <form className="space-y-5" onSubmit={handleSubmit}>
        {error && (
          <div className="p-3.5 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm flex items-start gap-2.5 animate-shake">
            <AlertCircle className="w-5 h-5 flex-shrink-0 text-red-600 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <div>
          <label
            htmlFor="email"
            className="block text-xs font-semibold uppercase tracking-wider text-slate-700"
          >
            Work Email Address
          </label>
          <div className="mt-1 relative rounded-xl shadow-sm">
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
              placeholder="name@hms.local"
              className="block w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            />
          </div>
        </div>

        <div>
          <label
            htmlFor="password"
            className="block text-xs font-semibold uppercase tracking-wider text-slate-700"
          >
            Password
          </label>
          <div className="mt-1 relative rounded-xl shadow-sm">
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
              className="block w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl shadow-lg shadow-blue-600/30 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all disabled:opacity-60"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Authenticating...</span>
            </>
          ) : (
            <>
              <span>Sign In to Terminal</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </form>

      {/* Dedicated Department Portal Workstation Switcher */}
      <div className="mt-8 pt-6 border-t border-slate-200">
        <p className="text-xs font-bold uppercase tracking-wider text-slate-500 text-center mb-3">
          Or Enter Dedicated Department Terminal
        </p>
        <div className="grid grid-cols-2 gap-2.5">
          <Link
            href="/login/admin"
            className="flex flex-col p-3 bg-purple-50/70 hover:bg-purple-100/80 border border-purple-200/80 rounded-2xl transition-all group"
          >
            <div className="w-8 h-8 rounded-xl bg-purple-600 text-white flex items-center justify-center shadow-xs mb-2 group-hover:scale-105 transition-transform">
              <ShieldAlert className="w-4 h-4" />
            </div>
            <div className="text-xs font-black text-slate-900">
              Admin Portal
            </div>
            <div className="text-[10px] text-purple-700 font-medium">
              Approvals &amp; P&amp;L
            </div>
          </Link>

          <Link
            href="/login/receptionist"
            className="flex flex-col p-3 bg-blue-50/70 hover:bg-blue-100/80 border border-blue-200/80 rounded-2xl transition-all group"
          >
            <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs mb-2 group-hover:scale-105 transition-transform">
              <Stethoscope className="w-4 h-4" />
            </div>
            <div className="text-xs font-black text-slate-900">
              Reception Desk
            </div>
            <div className="text-[10px] text-blue-700 font-medium">
              OPD Tokens &amp; Invoices
            </div>
          </Link>

          <Link
            href="/login/pharmacist"
            className="flex flex-col p-3 bg-amber-50/70 hover:bg-amber-100/80 border border-amber-200/80 rounded-2xl transition-all group"
          >
            <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-xs mb-2 group-hover:scale-105 transition-transform">
              <Pill className="w-4 h-4" />
            </div>
            <div className="text-xs font-black text-slate-900">
              Pharmacy POS
            </div>
            <div className="text-[10px] text-amber-800 font-medium">
              Dispensary &amp; Stock
            </div>
          </Link>

          <Link
            href="/login/doctor"
            className="flex flex-col p-3 bg-teal-50/70 hover:bg-teal-100/80 border border-teal-200/80 rounded-2xl transition-all group"
          >
            <div className="w-8 h-8 rounded-xl bg-teal-600 text-white flex items-center justify-center shadow-xs mb-2 group-hover:scale-105 transition-transform">
              <UserCheck className="w-4 h-4" />
            </div>
            <div className="text-xs font-black text-slate-900">
              Doctor Console
            </div>
            <div className="text-[10px] text-teal-700 font-medium">
              Consultation &amp; Rx
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-blue-600 text-white shadow-xl shadow-blue-500/20 mb-4 ring-8 ring-blue-500/10">
          <Building2 className="w-8 h-8" />
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
          Ruqayya Clinic
        </h1>
        <p className="mt-2 text-sm text-slate-400">
          Integrated Hospital & Pharmacy Operating System
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <Suspense
          fallback={
            <div className="p-8 bg-white/95 rounded-2xl text-center text-slate-500 text-sm">
              Loading authentication terminal...
            </div>
          }
        >
          <LoginForm />
        </Suspense>

        <div className="mt-6 text-center text-xs text-slate-400">
          Ruqayya Clinic & Pharmacy Operating System · HIPAA/Audit Compliant Session
        </div>
      </div>
    </div>
  );
}

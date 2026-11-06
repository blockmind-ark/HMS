"use client";

import { signOut, useSession } from "next-auth/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Building2,
  Stethoscope,
  Pill,
  ShieldAlert,
  LogOut,
  User,
  ChevronDown,
  UserCheck,
} from "lucide-react";
import { useState } from "react";

export function Navbar() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const [profileOpen, setProfileOpen] = useState(false);

  const role = session?.user?.role;
  const isAdmin = role === "ADMIN";

  const getPortalBadge = () => {
    if (pathname.startsWith("/admin")) {
      return {
        label: "Admin Terminal",
        color: "bg-purple-100 text-purple-700 border-purple-200",
        icon: ShieldAlert,
      };
    }
    if (pathname.startsWith("/receptionist")) {
      return {
        label: "Reception Desk",
        color: "bg-emerald-100 text-emerald-700 border-emerald-200",
        icon: Stethoscope,
      };
    }
    if (pathname.startsWith("/pharmacist")) {
      return {
        label: "Pharmacy POS & Stock",
        color: "bg-amber-100 text-amber-700 border-amber-200",
        icon: Pill,
      };
    }
    if (pathname.startsWith("/doctor")) {
      return {
        label: "Doctor Consultation",
        color: "bg-teal-100 text-teal-700 border-teal-200",
        icon: UserCheck,
      };
    }
    return {
      label: "HMS Portal",
      color: "bg-blue-100 text-blue-700 border-blue-200",
      icon: Building2,
    };
  };

  const portal = getPortalBadge();
  const PortalIcon = portal.icon;

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-40 print:hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Left: Brand and Portal Indicator */}
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="flex items-center gap-2.5 font-bold text-slate-900 group"
            >
              <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20 group-hover:bg-blue-700 transition-colors">
                <Building2 className="w-5 h-5" />
              </div>
              <div className="flex flex-col">
                <span className="text-base font-extrabold tracking-tight">Ruqayya Clinic</span>
                <span className="text-[10px] tracking-wider uppercase text-slate-500 font-semibold -mt-1">
                  & Pharmacy
                </span>
              </div>
            </Link>

            <div className="h-6 w-px bg-slate-200 hidden sm:block" />

            <div
              className={`hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${portal.color}`}
            >
              <PortalIcon className="w-3.5 h-3.5" />
              <span>{portal.label}</span>
            </div>
          </div>

          {/* Center: Admin Multi-Portal Navigation */}
          {isAdmin && (
            <nav className="hidden md:flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
              <Link
                href="/admin"
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                  pathname.startsWith("/admin")
                    ? "bg-white text-purple-700 shadow-sm"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <ShieldAlert className="w-3.5 h-3.5" />
                <span>Admin</span>
              </Link>
              <Link
                href="/receptionist"
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                  pathname.startsWith("/receptionist")
                    ? "bg-white text-emerald-700 shadow-sm"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <Stethoscope className="w-3.5 h-3.5" />
                <span>Reception</span>
              </Link>
              <Link
                href="/pharmacist"
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                  pathname.startsWith("/pharmacist")
                    ? "bg-white text-amber-700 shadow-sm"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <Pill className="w-3.5 h-3.5" />
                <span>Pharmacy</span>
              </Link>
              <Link
                href="/doctor"
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                  pathname.startsWith("/doctor")
                    ? "bg-white text-teal-700 shadow-sm"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <UserCheck className="w-3.5 h-3.5" />
                <span>Doctor</span>
              </Link>
            </nav>
          )}

          {/* Right: User Profile & Logout */}
          <div className="flex items-center gap-3">
            <div className="relative">
              <button
                type="button"
                onClick={() => setProfileOpen(!profileOpen)}
                className="flex items-center gap-2.5 p-1.5 rounded-xl hover:bg-slate-100 transition-colors text-left"
              >
                <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center font-bold text-xs ring-2 ring-white">
                  {session?.user?.name
                    ? session.user.name
                        .split(" ")
                        .map((n) => n[0])
                        .slice(0, 2)
                        .join("")
                    : "U"}
                </div>
                <div className="hidden lg:block">
                  <div className="text-xs font-bold text-slate-800 leading-tight">
                    {session?.user?.name || "Staff User"}
                  </div>
                  <div className="text-[10px] text-slate-500 font-medium">
                    {session?.user?.role || "Staff"}
                  </div>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {profileOpen && (
                <div
                  className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-slate-100 py-1.5 z-50 animate-in fade-in zoom-in-95 duration-100"
                  onMouseLeave={() => setProfileOpen(false)}
                >
                  <div className="px-4 py-2 border-b border-slate-100">
                    <p className="text-xs font-bold text-slate-900 truncate">
                      {session?.user?.name}
                    </p>
                    <p className="text-[11px] text-slate-500 truncate">
                      {session?.user?.email}
                    </p>
                    <span className="inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-semibold uppercase bg-slate-100 text-slate-700">
                      Role: {session?.user?.role}
                    </span>
                  </div>

                  {isAdmin && (
                    <div className="py-1 border-b border-slate-100 md:hidden">
                      <Link
                        href="/admin"
                        onClick={() => setProfileOpen(false)}
                        className="block px-4 py-1.5 text-xs text-slate-700 hover:bg-slate-50"
                      >
                        Admin Dashboard
                      </Link>
                      <Link
                        href="/receptionist"
                        onClick={() => setProfileOpen(false)}
                        className="block px-4 py-1.5 text-xs text-slate-700 hover:bg-slate-50"
                      >
                        Reception Desk
                      </Link>
                      <Link
                        href="/pharmacist"
                        onClick={() => setProfileOpen(false)}
                        className="block px-4 py-1.5 text-xs text-slate-700 hover:bg-slate-50"
                      >
                        Pharmacy Portal
                      </Link>
                      <Link
                        href="/doctor"
                        onClick={() => setProfileOpen(false)}
                        className="block px-4 py-1.5 text-xs text-slate-700 hover:bg-slate-50"
                      >
                        Doctor Consultation
                      </Link>
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={() => signOut({ callbackUrl: "/login" })}
                    className="w-full text-left px-4 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 flex items-center gap-2 transition-colors"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Sign Out</span>
                  </button>
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={() => signOut({ callbackUrl: "/login" })}
              title="Sign Out"
              className="p-2 rounded-xl text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}


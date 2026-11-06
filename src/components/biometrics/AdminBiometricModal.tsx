"use client";

import React, { useState, useEffect } from "react";
import {
  Fingerprint,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Loader2,
  X,
  Sparkles,
  Usb,
  Cpu,
  ShieldAlert,
  User,
  ArrowRight,
  RefreshCw,
  Trash2,
  Radio,
} from "lucide-react";
import { FingerPosition } from "@/lib/biometrics/types";

interface AdminBiometricModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: "enroll" | "identify";
  userId?: string;
  userName?: string;
  userRole?: string;
  onEnrollSuccess?: (enrollment: any) => void;
  onUserIdentified?: (user: any) => void;
}

export function AdminBiometricModal({
  isOpen,
  onClose,
  mode,
  userId,
  userName,
  userRole,
  onEnrollSuccess,
  onUserIdentified,
}: AdminBiometricModalProps) {
  const [selectedFinger, setSelectedFinger] = useState<FingerPosition>("RIGHT_INDEX");
  const [scanning, setScanning] = useState(false);
  const [status, setStatus] = useState<
    "idle" | "scanning" | "success" | "error" | "no_match" | "uncertain" | "disconnected"
  >("idle");
  const [statusMessage, setStatusMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [deviceInfo, setDeviceInfo] = useState<any>(null);
  const [matchedUser, setMatchedUser] = useState<any>(null);
  const [confidenceScore, setConfidenceScore] = useState<number | null>(null);

  // Query device status on open
  useEffect(() => {
    if (isOpen) {
      setStatus("idle");
      setScanning(false);
      setStatusMessage("");
      setErrorMessage("");
      setMatchedUser(null);
      setConfidenceScore(null);

      fetchDeviceInfo();
    }
  }, [isOpen]);

  const fetchDeviceInfo = async () => {
    try {
      const res = await fetch("/api/admin/biometrics/status");
      if (res.ok) {
        const data = await res.json();
        setDeviceInfo(data.device);
        if (data.device?.status === "DISCONNECTED") {
          setStatus("disconnected");
          setErrorMessage("Biometric scanner is disconnected or scanner daemon is not running.");
        }
      }
    } catch (err) {
      console.error("Could not fetch device status:", err);
    }
  };

  if (!isOpen) return null;

  // Handle Capture & Enrollment
  const handleEnroll = async () => {
    if (!userId) return;
    setScanning(true);
    setStatus("scanning");
    setStatusMessage("Waiting for finger placement on biometric optical platen...");
    setErrorMessage("");

    try {
      const res = await fetch("/api/admin/biometrics/enroll", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          fingerPosition: selectedFinger,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.errorCode === "DISCONNECTED") {
          setStatus("disconnected");
          setErrorMessage(data.error || "Scanner is disconnected.");
        } else {
          setStatus("error");
          setErrorMessage(data.error || "Enrollment failed.");
        }
        return;
      }

      setStatus("success");
      setStatusMessage(data.message || "Fingerprint enrolled and encrypted in database.");
      if (onEnrollSuccess) {
        onEnrollSuccess(data.enrollment);
      }
    } catch (err: any) {
      setStatus("error");
      setErrorMessage(err.message || "Failed to communicate with biometric backend.");
    } finally {
      setScanning(false);
    }
  };

  // Handle 1:N Biometric Identification ("Find User by Fingerprint")
  const handleIdentify = async () => {
    setScanning(true);
    setStatus("scanning");
    setStatusMessage("Please place any enrolled user's finger on the scanner...");
    setErrorMessage("");
    setMatchedUser(null);

    try {
      const res = await fetch("/api/admin/biometrics/identify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.errorCode === "DISCONNECTED") {
          setStatus("disconnected");
          setErrorMessage(data.error || "Scanner is disconnected.");
        } else if (res.status === 429) {
          setStatus("error");
          setErrorMessage(data.error || "Rate limit reached. Please wait a moment.");
        } else {
          setStatus("error");
          setErrorMessage(data.error || "Biometric scan failed.");
        }
        return;
      }

      if (data.status === "UNCERTAIN_MULTIPLE_MATCHES") {
        setStatus("uncertain");
        setErrorMessage(data.error || "Multiple users matched this fingerprint closely. Automatic profile access blocked.");
        return;
      }

      if (!data.matchFound || !data.user) {
        setStatus("no_match");
        setErrorMessage(data.message || "No matching fingerprint found in user database.");
        return;
      }

      // Confident single match!
      setMatchedUser(data.user);
      setConfidenceScore(data.confidenceScore);
      setStatus("success");
      setStatusMessage(`Match found with ${data.confidenceScore}% confidence.`);
    } catch (err: any) {
      setStatus("error");
      setErrorMessage(err.message || "Identification service error.");
    } finally {
      setScanning(false);
    }
  };

  const handleApplyMatch = () => {
    if (matchedUser && onUserIdentified) {
      onUserIdentified(matchedUser);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-100 flex flex-col">
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center border border-purple-400/30 shadow-inner">
              <Fingerprint className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold tracking-tight">
                  {mode === "enroll" ? "Enroll User Fingerprint" : "Find User by Fingerprint (1:N Search)"}
                </h3>
              </div>
              <p className="text-[11px] text-slate-400">
                Ruqayya Clinic Enterprise Biometric Management · ISO 19794-2
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Adapter Notice Banner (Transparently shows Mock vs Hardware) */}
        <div className="bg-slate-100 px-5 py-2 border-b border-slate-200 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <Usb className="w-3.5 h-3.5 text-slate-500" />
            <span className="font-semibold text-slate-700">
              {deviceInfo?.model || "Biometric Engine"}
            </span>
          </div>

          {deviceInfo?.isMock ? (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-100 text-amber-800 border border-amber-200">
              Mock Adapter (Dev Mode)
            </span>
          ) : (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-200">
              Hardware Scanner Online
            </span>
          )}
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5">
          {/* Target user banner for enrollment */}
          {mode === "enroll" && (
            <div className="p-3.5 bg-purple-50/70 border border-purple-100 rounded-2xl flex items-center justify-between text-xs">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
                  <User className="w-4 h-4" />
                </div>
                <div>
                  <p className="font-bold text-slate-900">{userName || "Target User"}</p>
                  <p className="text-[11px] text-purple-700 font-semibold uppercase">{userRole || "STAFF"}</p>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">
                  Finger Position
                </label>
                <select
                  value={selectedFinger}
                  onChange={(e) => setSelectedFinger(e.target.value as FingerPosition)}
                  disabled={scanning}
                  className="text-xs bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-purple-500 shadow-sm"
                >
                  <option value="RIGHT_INDEX">Right Hand - Index Finger</option>
                  <option value="RIGHT_THUMB">Right Hand - Thumb</option>
                  <option value="LEFT_INDEX">Left Hand - Index Finger</option>
                  <option value="LEFT_THUMB">Left Hand - Thumb</option>
                  <option value="RIGHT_MIDDLE">Right Hand - Middle Finger</option>
                  <option value="LEFT_MIDDLE">Left Hand - Middle Finger</option>
                </select>
              </div>
            </div>
          )}

          {/* Scanner Optical Graphic */}
          <div className="flex flex-col items-center justify-center py-2">
            <div className="relative w-36 h-36 rounded-3xl bg-slate-900 flex items-center justify-center border-4 border-slate-800 shadow-xl overflow-hidden group">
              {/* Scan Beam animation */}
              {scanning && (
                <div
                  className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-[0_0_15px_#22d3ee] animate-bounce"
                  style={{ animationDuration: "1.2s" }}
                />
              )}

              <Fingerprint
                className={`w-20 h-20 transition-all duration-300 ${
                  scanning
                    ? "text-cyan-400 scale-105 animate-pulse"
                    : status === "success"
                    ? "text-emerald-400 scale-105"
                    : status === "error" || status === "disconnected"
                    ? "text-red-400"
                    : status === "no_match" || status === "uncertain"
                    ? "text-amber-400"
                    : "text-slate-600 group-hover:text-slate-400"
                }`}
              />

              {/* Status Badge in Corner */}
              <div className="absolute top-2 right-2">
                {status === "success" && <CheckCircle2 className="w-5 h-5 text-emerald-400" />}
                {(status === "error" || status === "disconnected") && (
                  <AlertCircle className="w-5 h-5 text-red-400" />
                )}
                {(status === "no_match" || status === "uncertain") && (
                  <AlertTriangle className="w-5 h-5 text-amber-400" />
                )}
              </div>
            </div>

            {/* Status Messages */}
            {statusMessage && (
              <p className="mt-3 text-xs font-semibold text-center text-slate-700 max-w-sm">
                {statusMessage}
              </p>
            )}

            {/* Success Card - Enrollment */}
            {status === "success" && mode === "enroll" && (
              <div className="mt-4 w-full p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl text-center space-y-1 animate-in fade-in">
                <div className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-800">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Biometric Fingerprint Securely Enrolled</span>
                </div>
                <p className="text-[11px] text-emerald-700">
                  Minutiae extracted and encrypted with AES-256-GCM. Ready for 1:N biometric lookup.
                </p>
              </div>
            )}

            {/* Success Card - Identification Match Found */}
            {status === "success" && mode === "identify" && matchedUser && (
              <div className="mt-4 w-full p-4 bg-emerald-50/90 border border-emerald-200 rounded-2xl space-y-2 text-left animate-in fade-in">
                <div className="flex items-center justify-between">
                  <div className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-900">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>User Identified via 1:N Biometric Search</span>
                  </div>
                  {confidenceScore && (
                    <span className="font-mono text-xs font-extrabold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded">
                      {confidenceScore}% Match
                    </span>
                  )}
                </div>

                <div className="pt-2 border-t border-emerald-200/60">
                  <p className="text-base font-extrabold text-slate-900">{matchedUser.name}</p>
                  <p className="text-xs text-slate-600">
                    {matchedUser.email} · <span className="font-bold uppercase text-purple-700">{matchedUser.role}</span>
                  </p>
                </div>
              </div>
            )}

            {/* Error / No Match / Disconnected States */}
            {(status === "error" || status === "disconnected" || status === "no_match" || status === "uncertain") && (
              <div
                className={`mt-4 w-full p-3.5 rounded-2xl text-center space-y-1 text-xs font-semibold ${
                  status === "no_match" || status === "uncertain"
                    ? "bg-amber-50 border border-amber-200 text-amber-800"
                    : "bg-red-50 border border-red-200 text-red-800"
                }`}
              >
                <p>{errorMessage}</p>
                {status === "uncertain" && (
                  <p className="text-[11px] font-normal text-amber-700">
                    Safety rule active: The portal does not open user records when matching score is ambiguous.
                  </p>
                )}
                {status === "disconnected" && (
                  <button
                    type="button"
                    onClick={fetchDeviceInfo}
                    className="mt-1 inline-flex items-center gap-1 text-[11px] text-blue-700 underline font-bold"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>Retry Connection</span>
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 rounded-xl hover:bg-slate-200/50 transition-colors"
          >
            Cancel
          </button>

          <div className="flex items-center gap-2">
            {status !== "success" ? (
              <button
                type="button"
                onClick={mode === "enroll" ? handleEnroll : handleIdentify}
                disabled={scanning}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-xl text-xs font-bold shadow-md hover:shadow-lg transition-all disabled:opacity-50"
              >
                {scanning ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Scanning Minutiae...</span>
                  </>
                ) : (
                  <>
                    <Fingerprint className="w-4 h-4" />
                    <span>
                      {mode === "enroll" ? "Capture & Enroll Fingerprint" : "Scan to Find Matching User"}
                    </span>
                  </>
                )}
              </button>
            ) : mode === "identify" && matchedUser ? (
              <button
                type="button"
                onClick={handleApplyMatch}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md transition-all"
              >
                <ArrowRight className="w-4 h-4" />
                <span>Open User Profile</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={onClose}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md transition-all"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Done</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

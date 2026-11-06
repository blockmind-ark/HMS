"use client";

import React, { useState, useEffect } from "react";
import {
  Wifi,
  Server,
  Globe,
  Copy,
  Check,
  RefreshCw,
  ShieldAlert,
  Lock,
  ExternalLink,
} from "lucide-react";

export function NetworkSecurityView() {
  const [networkInfo, setNetworkInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const fetchInfo = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/network-security");
      if (res.ok) {
        const data = await res.json();
        setNetworkInfo(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInfo();
  }, []);

  const copyToClipboard = (text: string, key: string) => {
    if (navigator?.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 2500);
    }
  };

  const primaryIp = networkInfo?.primaryLanIp || "192.168.1.34";
  const port = networkInfo?.port || "3000";
  const clientIp = networkInfo?.clientIp || "127.0.0.1";

  const portals = [
    {
      key: "receptionist",
      name: "Reception Desk Portal",
      path: "/receptionist",
      lanUrl: `http://${primaryIp}:${port}/receptionist`,
      desc: "Patient intake, OPD token issuance, live cashier checkout, thermal receipts.",
      dotColor: "bg-blue-500",
      badgeColor: "bg-blue-50 text-blue-700 border-blue-200",
      btnColor: "bg-blue-600 hover:bg-blue-700",
      allowedIps: networkInfo?.portals?.receptionist?.allowedIps || ["*"],
      envKey: "ALLOWED_IPS_RECEPTIONIST",
    },
    {
      key: "doctor",
      name: "Doctor Consultation Desk",
      path: "/doctor",
      lanUrl: `http://${primaryIp}:${port}/doctor`,
      desc: "Clinical queue, patient medical archive, clinical notes, diagnosis recording.",
      dotColor: "bg-emerald-500",
      badgeColor: "bg-emerald-50 text-emerald-700 border-emerald-200",
      btnColor: "bg-emerald-600 hover:bg-emerald-700",
      allowedIps: networkInfo?.portals?.doctor?.allowedIps || ["*"],
      envKey: "ALLOWED_IPS_DOCTOR",
    },
    {
      key: "pharmacist",
      name: "Pharmacy POS & Dispensary",
      path: "/pharmacist",
      lanUrl: `http://${primaryIp}:${port}/pharmacist`,
      desc: "Barcode scanning checkout, 5% generic margin calculation, batch expiry tracking.",
      dotColor: "bg-amber-500",
      badgeColor: "bg-amber-50 text-amber-700 border-amber-200",
      btnColor: "bg-amber-600 hover:bg-amber-700",
      allowedIps: networkInfo?.portals?.pharmacist?.allowedIps || ["*"],
      envKey: "ALLOWED_IPS_PHARMACIST",
    },
    {
      key: "admin",
      name: "Admin Control Center",
      path: "/admin",
      lanUrl: `http://${primaryIp}:${port}/admin`,
      desc: "Executive governance, P&L analytics, inventory purchase approvals, staff accounts.",
      dotColor: "bg-purple-500",
      badgeColor: "bg-purple-50 text-purple-700 border-purple-200",
      btnColor: "bg-purple-600 hover:bg-purple-700",
      allowedIps: networkInfo?.portals?.admin?.allowedIps || ["127.0.0.1", "192.168.1.34"],
      envKey: "ALLOWED_IPS_ADMIN",
    },
  ];

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* Header / Overview Bar */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-extrabold text-slate-900">
              Hospital LAN Network & Terminal Restrictions
            </h3>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
              <span>Enforcement Active</span>
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Manage static IP addresses and domain authorizations for departmental hospital terminals.
          </p>
        </div>

        <button
          onClick={fetchInfo}
          disabled={loading}
          className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs flex items-center gap-1.5 transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          <span>Refresh Detection</span>
        </button>
      </div>

      {/* Quick Network Status Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Server LAN Base */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase text-slate-400">Hospital LAN Host</span>
            <Wifi className="w-4 h-4 text-blue-500" />
          </div>
          <p className="text-sm font-mono font-black text-slate-900 truncate">
            {primaryIp}
          </p>
          <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-[10px]">
            <span className="text-slate-400">Port: {port} (HTTP)</span>
            <button
              onClick={() => copyToClipboard(`http://${primaryIp}:${port}`, "lan-base")}
              className="text-blue-600 font-bold hover:underline flex items-center gap-0.5"
            >
              {copiedKey === "lan-base" ? (
                <>
                  <Check className="w-3 h-3 text-emerald-600" />
                  <span className="text-emerald-600">Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3" />
                  <span>Copy Base URL</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Card 2: Current Workstation IP */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase text-slate-400">Your Current Terminal IP</span>
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
          </div>
          <p className="text-sm font-mono font-black text-emerald-600 truncate">
            {clientIp}
          </p>
          <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-[10px]">
            <span className="text-slate-400">Connected Terminal</span>
            <span className="font-bold text-slate-600">Authorized</span>
          </div>
        </div>

        {/* Card 3: Localhost Server Access */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase text-slate-400">Server Loopback</span>
            <Server className="w-4 h-4 text-purple-500" />
          </div>
          <p className="text-sm font-mono font-black text-slate-900 truncate">
            http://localhost:{port}
          </p>
          <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-[10px]">
            <span className="text-slate-400">Physical Host Machine</span>
            <span className="font-bold text-purple-600">Local Only</span>
          </div>
        </div>

        {/* Card 4: Database Port */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase text-slate-400">Database Service</span>
            <Globe className="w-4 h-4 text-indigo-500" />
          </div>
          <p className="text-sm font-mono font-black text-slate-900 truncate">
            PostgreSQL :5432
          </p>
          <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-[10px]">
            <span className="text-slate-400">Database: hms</span>
            <span className="font-bold text-emerald-600">Container Healthy</span>
          </div>
        </div>
      </div>

      {/* Departmental Portals Table & Direct Links */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h4 className="text-sm font-bold text-slate-900">
              Department Portal Access Matrix & Workstation IPs
            </h4>
            <p className="text-xs text-slate-500 mt-0.5">
              Terminal links to provide each clinic desk, with active whitelist status
            </p>
          </div>
        </div>

        <div className="divide-y divide-slate-100">
          {portals.map((p) => (
            <div
              key={p.key}
              className="p-4 sm:p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4 hover:bg-slate-50/50 transition-colors"
            >
              <div className="space-y-1 sm:w-1/3">
                <div className="flex items-center gap-2">
                  <div className={`w-2.5 h-2.5 rounded-full ${p.dotColor}`} />
                  <h5 className="text-sm font-extrabold text-slate-900">{p.name}</h5>
                  <span className="text-[10px] font-mono text-slate-400 font-bold bg-slate-100 px-1.5 py-0.5 rounded">
                    {p.path}
                  </span>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed">{p.desc}</p>
              </div>

              <div className="space-y-1.5 sm:w-1/3">
                <span className="text-[10px] font-bold uppercase text-slate-400">
                  Allowed Terminal Workstations
                </span>
                <div className="flex flex-wrap items-center gap-1.5">
                  {p.allowedIps.map((ip: string) => (
                    <span
                      key={ip}
                      className={`px-2 py-0.5 rounded-md text-[11px] font-mono font-bold border ${p.badgeColor}`}
                    >
                      {ip === "*" ? "All LAN Terminals (*)" : ip}
                    </span>
                  ))}
                </div>
                <p className="text-[10px] text-slate-400 font-mono">Env: {p.envKey}</p>
              </div>

              <div className="flex items-center gap-2 sm:w-1/3 justify-start lg:justify-end">
                <button
                  onClick={() => copyToClipboard(p.lanUrl, `link-${p.key}`)}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors border border-slate-200"
                >
                  {copiedKey === `link-${p.key}` ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="text-emerald-700">Copied Link</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy Terminal Link</span>
                    </>
                  )}
                </button>
                <a
                  href={p.lanUrl}
                  target="_blank"
                  rel="noreferrer"
                  className={`px-3 py-1.5 ${p.btnColor} text-white font-bold text-xs rounded-xl transition-colors shadow-sm flex items-center gap-1`}
                >
                  <span>Open Portal</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Administrator Instruction Card */}
      <div className="bg-slate-900 text-white rounded-2xl p-6 shadow-md space-y-4">
        <div className="flex items-center gap-2">
          <ShieldAlert className="w-5 h-5 text-purple-400" />
          <h4 className="text-sm font-bold">How to Restrict Terminal IPs in Docker / Local Deployment</h4>
        </div>

        <div className="text-xs text-slate-300 space-y-2 leading-relaxed">
          <p>
            To bind specific physical workstations (e.g. Reception Desk PC{" "}
            <code className="text-amber-300 bg-slate-800 px-1 py-0.5 rounded">192.168.1.50</code>), simply update
            the <code className="text-purple-300 bg-slate-800 px-1 py-0.5 rounded">.env</code> configuration file or{" "}
            <code className="text-purple-300 bg-slate-800 px-1 py-0.5 rounded">docker-compose.yml</code>:
          </p>

          <div className="p-3 bg-slate-950 font-mono text-[11px] rounded-xl border border-slate-800 text-slate-300 space-y-1">
            <p className="text-slate-500"># Enable / Disable Master IP Enforcement</p>
            <p>
              <span className="text-cyan-400">PORTAL_IP_RESTRICTIONS_ENABLED</span>=
              <span className="text-emerald-400">true</span>
            </p>
            <p className="text-slate-500 mt-2"># Assign exact IP addresses or subnets (e.g. 192.168.1.0/24)</p>
            <p>
              <span className="text-cyan-400">ALLOWED_IPS_ADMIN</span>=
              <span className="text-amber-300">&quot;127.0.0.1, 192.168.1.34&quot;</span>
            </p>
            <p>
              <span className="text-cyan-400">ALLOWED_IPS_RECEPTIONIST</span>=
              <span className="text-amber-300">&quot;192.168.1.50, 192.168.1.51&quot;</span>
            </p>
            <p>
              <span className="text-cyan-400">ALLOWED_IPS_DOCTOR</span>=
              <span className="text-amber-300">&quot;192.168.1.60, 192.168.1.61&quot;</span>
            </p>
            <p>
              <span className="text-cyan-400">ALLOWED_IPS_PHARMACIST</span>=
              <span className="text-amber-300">&quot;192.168.1.70&quot;</span>
            </p>
            <p className="text-slate-500 mt-2"># Set &apos;*&apos; to allow any workstation on that portal</p>
          </div>

          <p className="text-[11px] text-slate-400 pt-1">
            Whenever an unlisted IP tries to navigate to a restricted portal, the system immediately blocks access
            and displays the <strong>Workstation Access Denied (HTTP 403)</strong> protection page.
          </p>
        </div>
      </div>
    </div>
  );
}


"use client";

import React from "react";
import { Printer, X, RotateCcw } from "lucide-react";

export interface ReturnReceiptItem {
  name: string;
  quantityReturned: number;
  unitPrice: number;
  refundSubtotal: number;
}

export interface ReturnReceiptData {
  returnNumber: string;
  invoiceNumber?: string | null;
  createdAt: string | Date;
  pharmacistName: string;
  patientName?: string | null;
  customerPhone?: string | null;
  reason: string;
  status: "PENDING_CLOSING" | "APPROVED" | "REJECTED" | string;
  items: ReturnReceiptItem[];
  totalRefundAmount: number;
}

// 80mm ESC/POS Thermal Receipt Print Engine for Medicine Return Receipts
export function printReturnReceiptElement(receiptElementId: string = "thermal-return-receipt") {
  if (typeof window === "undefined") return;

  const receiptEl = document.getElementById(receiptElementId);
  if (!receiptEl) {
    window.print();
    return;
  }

  // Remove existing print iframe
  const existingFrame = document.getElementById("thermal-return-print-iframe");
  if (existingFrame) {
    existingFrame.remove();
  }

  const iframe = document.createElement("iframe");
  iframe.id = "thermal-return-print-iframe";
  iframe.style.position = "fixed";
  iframe.style.right = "0";
  iframe.style.bottom = "0";
  iframe.style.width = "0";
  iframe.style.height = "0";
  iframe.style.border = "none";
  iframe.style.visibility = "hidden";

  document.body.appendChild(iframe);

  const iframeDoc = iframe.contentWindow?.document || iframe.contentDocument;
  if (!iframeDoc) {
    window.print();
    return;
  }

  iframeDoc.open();
  iframeDoc.write(`
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="utf-8" />
        <title>Medicine Return Voucher</title>
        <style>
          @page {
            size: 80mm auto;
            margin: 0mm;
          }
          *, *::before, *::after {
            box-sizing: border-box;
            color: #000000 !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          html, body {
            margin: 0;
            padding: 0;
            background: #ffffff !important;
            color: #000000 !important;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Courier New", monospace;
            font-size: 11px;
            line-height: 1.25;
            width: 80mm;
          }
          .receipt-container {
            width: 76mm;
            margin: 0 auto;
            padding: 4mm 1mm;
          }
          .header {
            text-align: center;
            border-bottom: 1px dashed #000;
            padding-bottom: 2.5mm;
            margin-bottom: 2.5mm;
          }
          .brand-title {
            font-size: 14px;
            font-weight: 900;
            letter-spacing: 0.5px;
            text-transform: uppercase;
            margin: 0;
          }
          .brand-subtitle {
            font-size: 10px;
            font-weight: 700;
            margin: 1mm 0 0 0;
          }
          .voucher-tag {
            display: inline-block;
            margin: 1.5mm 0;
            padding: 1px 6px;
            border: 1px solid #000;
            font-size: 10px;
            font-weight: 900;
            text-transform: uppercase;
          }
          .meta-row {
            display: flex;
            justify-content: space-between;
            font-size: 10px;
            margin-bottom: 1mm;
          }
          .meta-row strong {
            font-weight: 900;
          }
          .divider {
            border-top: 1px dashed #000;
            margin: 2mm 0;
          }
          .solid-divider {
            border-top: 1px solid #000;
            margin: 2mm 0;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            font-size: 10px;
          }
          th {
            text-align: left;
            border-bottom: 1px solid #000;
            padding: 1.5mm 0;
            font-size: 9px;
            text-transform: uppercase;
            font-weight: 900;
          }
          td {
            padding: 1.5mm 0;
            vertical-align: top;
          }
          .text-right {
            text-align: right;
          }
          .text-center {
            text-align: center;
          }
          .total-section {
            margin-top: 2mm;
            border-top: 1.5px solid #000;
            padding-top: 2mm;
          }
          .total-row {
            display: flex;
            justify-content: space-between;
            font-size: 12px;
            font-weight: 900;
          }
          .status-notice {
            margin-top: 2mm;
            padding: 1.5mm;
            border: 1px dashed #000;
            font-size: 9px;
            text-align: center;
            font-weight: bold;
          }
          .footer {
            margin-top: 3mm;
            text-align: center;
            font-size: 9px;
            border-top: 1px dashed #000;
            padding-top: 2mm;
          }
        </style>
      </head>
      <body>
        <div class="receipt-container">
          ${receiptEl.innerHTML}
        </div>
      </body>
    </html>
  `);
  iframeDoc.close();

  setTimeout(() => {
    iframe.contentWindow?.focus();
    iframe.contentWindow?.print();
  }, 250);
}

export function ThermalReturnReceiptModal({
  isOpen,
  onClose,
  data,
}: {
  isOpen: boolean;
  onClose: () => void;
  data: ReturnReceiptData | null;
}) {
  if (!isOpen || !data) return null;

  const formattedDate = new Date(data.createdAt).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl max-w-sm w-full overflow-hidden shadow-2xl border border-slate-200 flex flex-col max-h-[92vh]">
        {/* Header Bar */}
        <div className="p-3.5 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <RotateCcw className="w-4 h-4 text-rose-400" />
            <h3 className="text-xs font-bold uppercase tracking-wider">
              Medicine Return Voucher
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Printable Receipt Paper Container */}
        <div className="overflow-y-auto p-4 flex-1 bg-slate-100 flex justify-center">
          <div
            id="thermal-return-receipt"
            className="bg-white text-black p-4 rounded shadow-xs w-full max-w-[76mm] text-xs font-mono"
            style={{ fontFamily: "'Courier New', Courier, monospace" }}
          >
            {/* Pharmacy Branding Header */}
            <div className="text-center pb-2 border-b border-dashed border-black">
              <h2 className="text-sm font-black tracking-tight uppercase">
                Ruqayya Medical Center
              </h2>
              <p className="text-[10px] font-bold mt-0.5">Dispensary & Pharmacy</p>
              <div className="inline-block border border-black px-2 py-0.5 my-1 text-[9px] font-black uppercase tracking-wider">
                Medicine Return Voucher
              </div>
            </div>

            {/* Voucher Metadata */}
            <div className="py-2 space-y-1 text-[10px] border-b border-dashed border-black">
              <div className="flex justify-between">
                <span>Voucher #:</span>
                <span className="font-bold">{data.returnNumber}</span>
              </div>
              {data.invoiceNumber && (
                <div className="flex justify-between">
                  <span>Sale Invoice #:</span>
                  <span className="font-bold">{data.invoiceNumber}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>Date &amp; Time:</span>
                <span>{formattedDate}</span>
              </div>
              <div className="flex justify-between">
                <span>Pharmacist:</span>
                <span className="font-bold">{data.pharmacistName}</span>
              </div>
              {data.patientName && (
                <div className="flex justify-between">
                  <span>Customer:</span>
                  <span className="font-bold">{data.patientName}</span>
                </div>
              )}
              {data.customerPhone && (
                <div className="flex justify-between">
                  <span>Phone:</span>
                  <span>{data.customerPhone}</span>
                </div>
              )}
            </div>

            {/* Itemized Table */}
            <div className="py-2">
              <table className="w-full text-left text-[10px] border-collapse">
                <thead>
                  <tr className="border-b border-black">
                    <th className="py-1">Medicine Name</th>
                    <th className="py-1 text-center">Qty</th>
                    <th className="py-1 text-right">Price</th>
                    <th className="py-1 text-right">Refund</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-dotted divide-slate-300">
                  {data.items.map((item, idx) => (
                    <tr key={idx}>
                      <td className="py-1 font-bold">{item.name}</td>
                      <td className="py-1 text-center">{item.quantityReturned}</td>
                      <td className="py-1 text-right">Rs.{item.unitPrice.toFixed(0)}</td>
                      <td className="py-1 text-right font-bold">
                        Rs.{item.refundSubtotal.toFixed(0)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Total Refund Banner */}
            <div className="pt-2 border-t-2 border-black space-y-1 text-[11px]">
              <div className="flex justify-between items-center font-black">
                <span>TOTAL CASH REFUND:</span>
                <span className="text-sm">Rs. {data.totalRefundAmount.toLocaleString()}</span>
              </div>
            </div>

            {/* Reason */}
            <div className="my-2 p-1.5 border border-dashed border-black text-[9px]">
              <strong>Return Reason:</strong> {data.reason}
            </div>

            {/* Restock Approval Notice */}
            <div className="text-[8px] text-center p-1 bg-slate-50 border border-black my-1 font-bold">
              {data.status === "APPROVED"
                ? "STOCK RESTOCK STATUS: COMMITTED & APPROVED BY ADMIN"
                : "STOCK RESTOCK STATUS: PENDING DAILY CLOSING ADMIN APPROVAL"}
            </div>

            {/* Footer */}
            <div className="pt-2 text-center text-[9px] border-t border-dashed border-black space-y-0.5">
              <p>Official Dispensary Return Receipt</p>
              <p>Ruqayya Medical Center · Thank you</p>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-3 bg-white border-t border-slate-100 flex gap-2">
          <button
            type="button"
            onClick={() => printReturnReceiptElement("thermal-return-receipt")}
            className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-md shadow-rose-600/20"
          >
            <Printer className="w-4 h-4" />
            <span>Print Return Voucher (80mm)</span>
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

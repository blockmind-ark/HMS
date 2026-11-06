"use client";

import React from "react";
import { Printer, X } from "lucide-react";

export interface ReceiptItem {
  description: string;
  quantity: number;
  price: number;
  total: number;
}

export interface ReceiptData {
  receiptNumber: string;
  type: "CLINICAL_INVOICE" | "PHARMACY_SALE";
  tokenNumber?: number | string;
  date: string | Date;
  staffName: string;
  patientName?: string;
  patientUid?: string;
  items: ReceiptItem[];
  subtotal: number;
  discount: number;
  totalAmount: number;
  previouslyPaidAmount?: number; // OPD token fee already collected earlier
  netAmountPaidNow?: number;     // Cash collected now for current service
  paymentMethod?: string;
  cashTendered?: number;
  change?: number;
  note?: string;
}

// Dedicated thermal receipt print engine: produces sharp, non-repeating 1-page output on standard 80mm ESC/POS printers
export function printReceiptElement(receiptElementId: string = "thermal-receipt") {
  if (typeof window === "undefined") return;

  const receiptEl = document.getElementById(receiptElementId);
  if (!receiptEl) {
    window.print();
    return;
  }

  // Remove any previous print iframe to prevent duplicate elements
  const existingFrame = document.getElementById("thermal-print-iframe");
  if (existingFrame) {
    existingFrame.remove();
  }

  const iframe = document.createElement("iframe");
  iframe.id = "thermal-print-iframe";
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

  // Self-contained, dedicated 80mm thermal receipt CSS with 100% visible black text
  iframeDoc.open();
  iframeDoc.write(`
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="utf-8" />
        <title>Thermal Receipt</title>
        <style>
          @page {
            size: 80mm auto;
            margin: 0mm;
          }
          *, *::before, *::after {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          html, body {
            width: 80mm;
            max-width: 80mm;
            margin: 0 !important;
            padding: 0 !important;
            background: #ffffff !important;
            color: #000000 !important;
            font-family: 'Courier New', Courier, monospace, monospace;
            font-size: 12px;
            line-height: 1.35;
            visibility: visible !important;
          }
          body * {
            visibility: visible !important;
            color: #000000 !important;
          }
          .thermal-receipt-container {
            width: 80mm;
            max-width: 80mm;
            padding: 5mm;
            background: #ffffff;
            color: #000000;
            page-break-inside: avoid;
            break-inside: avoid;
          }
          .text-center { text-align: center; }
          .text-left { text-align: left; }
          .text-right { text-align: right; }
          .font-bold { font-weight: bold; }
          .font-semibold { font-weight: 600; }
          .font-medium { font-weight: 500; }
          .font-black { font-weight: 900; }
          .uppercase { text-transform: uppercase; }
          .tracking-wider { letter-spacing: 0.05em; }
          .tracking-widest { letter-spacing: 0.1em; }
          .italic { font-style: italic; }
          .text-xs { font-size: 12px; }
          .text-sm { font-size: 14.5px; }
          .text-\\[10px\\] { font-size: 11px; }
          .text-\\[9px\\] { font-size: 10px; }
          .text-\\[8px\\] { font-size: 9px; }
          .text-\\[11px\\] { font-size: 11px; }
          .text-\\[12px\\] { font-size: 12px; }
          .text-\\[15px\\] { font-size: 15px; }
          .border-b { border-bottom: 1px dashed #000000; }
          .border-t { border-top: 1px dashed #000000; }
          .border-dashed { border-style: dashed; }
          .border-black { border-color: #000000; }
          .border { border: 1px solid #000000; }
          .rounded { border-radius: 3px; }
          .py-0\\.5 { padding-top: 3px; padding-bottom: 3px; }
          .py-1 { padding-top: 4.5px; padding-bottom: 4.5px; }
          .py-1\\.5 { padding-top: 5px; padding-bottom: 5px; }
          .py-2 { padding-top: 7px; padding-bottom: 7px; }
          .py-2\\.5 { padding-top: 8px; padding-bottom: 8px; }
          .pt-0\\.5 { padding-top: 3px; }
          .pt-1 { padding-top: 5px; }
          .pt-1\\.5 { padding-top: 6px; }
          .pt-2 { padding-top: 9px; }
          .pt-2\\.5 { padding-top: 11px; }
          .pt-3 { padding-top: 12px; }
          .pb-1 { padding-bottom: 5px; }
          .pb-1\\.5 { padding-bottom: 6px; }
          .pb-2 { padding-bottom: 9px; }
          .pb-3 { padding-bottom: 11px; }
          .px-0\\.5 { padding-left: 3px; padding-right: 3px; }
          .px-2 { padding-left: 8px; padding-right: 8px; }
          .pr-1 { padding-right: 5px; }
          .pl-0\\.5 { padding-left: 3px; }
          .flex { display: flex; }
          .justify-between { justify-content: space-between; }
          .items-center { align-items: center; }
          .space-y-0\\.5 > * + * { margin-top: 3px; }
          .space-y-1 > * + * { margin-top: 5px; }
          .space-y-1\\.5 > * + * { margin-top: 7px; }
          .space-y-2 > * + * { margin-top: 8px; }
          .inline-block { display: inline-block; }
          .block { display: block; }
          .break-words { word-break: break-word; }
          .whitespace-nowrap { white-space: nowrap; }
          .leading-snug { line-height: 1.35; }
          .leading-tight { line-height: 1.2; }
          .w-full { width: 100%; }
          .w-\\[44\\%\\] { width: 44%; }
          .w-\\[12\\%\\] { width: 12%; }
          .w-\\[22\\%\\] { width: 22%; }
          .bg-black { background-color: #000000 !important; color: #ffffff !important; }
          .text-white { color: #ffffff !important; }
          table { width: 100%; border-collapse: collapse; }
          th, td { padding: 4.5px 0; }
          .align-top { vertical-align: top; }
          .divide-y > * + * { border-top: 1px dashed #000000; }
          .no-print { display: none !important; }
        </style>
      </head>
      <body>
        <div class="thermal-receipt-container">
          ${receiptEl.innerHTML}
        </div>
      </body>
    </html>
  `);
  iframeDoc.close();

  setTimeout(() => {
    try {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
    } catch (e) {
      console.error("Iframe printing encountered error, falling back to window.print():", e);
      window.print();
    } finally {
      setTimeout(() => {
        iframe.remove();
      }, 2500);
    }
  }, 250);
}

export function ThermalReceiptModal({
  receipt,
  isOpen,
  onClose,
  onPrint,
}: {
  receipt: ReceiptData | null;
  isOpen: boolean;
  onClose: () => void;
  onPrint?: () => void;
}) {
  if (!isOpen || !receipt) return null;

  const handlePrint = () => {
    printReceiptElement("thermal-receipt");
    if (onPrint) {
      onPrint();
    }
  };

  const formattedDate = new Date(receipt.date).toLocaleString("en-PK", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });

  const isClinical = receipt.type === "CLINICAL_INVOICE";
  const receiptTitle = isClinical ? "OPD PATIENT INVOICE" : "PHARMACY CASH RECEIPT";
  const receiptSubtitle = isClinical
    ? "Clinical Consultation & Diagnostics"
    : "Pharmaceutical & Surgical Dispensary";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm print:p-0 print:bg-white print:fixed-none">
      {/* Component-level Print Styling for Standard 80mm ESC/POS Printers */}
      <style dangerouslySetInnerHTML={{
        __html: `
          @page {
            size: 80mm auto;
            margin: 0mm;
          }
          @media print {
            html, body {
              height: auto !important;
              min-height: 0 !important;
              max-height: 100% !important;
              overflow: hidden !important;
              margin: 0 !important;
              padding: 0 !important;
              background: #ffffff !important;
            }
            body * {
              visibility: hidden !important;
            }
            #thermal-receipt,
            #thermal-receipt * {
              visibility: visible !important;
              color: #000000 !important;
            }
            #thermal-receipt {
              position: absolute !important;
              left: 0 !important;
              top: 0 !important;
              width: 80mm !important;
              max-width: 80mm !important;
              min-width: 80mm !important;
              margin: 0 !important;
              padding: 5mm !important;
              background: #ffffff !important;
              color: #000000 !important;
              font-family: 'Courier New', Courier, monospace, system-ui !important;
              font-size: 12px !important;
              line-height: 1.35 !important;
              box-shadow: none !important;
              border: none !important;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
              page-break-inside: avoid !important;
              break-inside: avoid !important;
              page-break-after: avoid !important;
              break-after: avoid !important;
            }
            #thermal-receipt * {
              page-break-inside: avoid !important;
              break-inside: avoid !important;
            }
            .no-print {
              display: none !important;
              visibility: hidden !important;
            }
          }
        `,
      }} />

      <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden border border-slate-200 print:shadow-none print:border-none print:max-w-none print:w-full print:bg-white">
        {/* Modal Controls - Hidden when printing */}
        <div className="p-3.5 bg-slate-900 text-white flex items-center justify-between no-print">
          <div className="flex items-center gap-2">
            <Printer className="w-4 h-4 text-amber-400" />
            <span className="font-bold text-xs uppercase tracking-wider">
              80mm Thermal Receipt Preview
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              type="button"
              className="px-3 py-1 bg-amber-500 hover:bg-amber-600 text-slate-900 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print (80mm)</span>
            </button>
            <button
              onClick={onClose}
              type="button"
              className="p-1 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Printable 80mm ESC/POS Paper Container */}
        <div className="p-4 sm:p-6 bg-slate-100/70 overflow-y-auto max-h-[80vh] print:p-0 print:max-h-none print:bg-white">
          <div
            id="thermal-receipt"
            className="thermal-receipt w-[320px] mx-auto bg-white p-4 sm:p-5 rounded-md border border-slate-200 shadow-md font-mono text-xs text-black print:p-0 print:border-none print:shadow-none print:w-full"
          >
            {/* Header */}
            <div className="text-center pb-2.5 border-b border-dashed border-black space-y-1">
              <h1 className="text-[15px] font-black uppercase tracking-wider text-black">
                RUQAYYA CLINIC &amp; PHARMACY
              </h1>
              <p className="text-[11px] text-black">
                Main Boulevard, G.T. Road, Lahore
              </p>
              <p className="text-[11px] text-black">
                Tel: +92 (42) 3589-1122 · NTN: 948102-1
              </p>
              <div className="pt-1">
                <span className="inline-block px-2.5 py-1 border border-black rounded text-[11px] font-black uppercase tracking-widest bg-black text-white print:border-black print:bg-black print:text-white">
                  {receipt.previouslyPaidAmount ? "CONSOLIDATED CLINICAL INVOICE" : receiptTitle}
                </span>
              </div>
              <p className="text-[10px] uppercase tracking-wider pt-0.5 text-black">
                {receipt.previouslyPaidAmount ? "Replaces Surrendered Token Slip" : receiptSubtitle}
              </p>
            </div>

            {/* Top Token Number Prominent Callout */}
            {receipt.tokenNumber && (
              <div className="my-2 p-1.5 border-2 border-black rounded text-center">
                <div className="text-[10px] font-black uppercase tracking-widest text-black">
                  OPD TOKEN NUMBER
                </div>
                <div className="text-2xl font-mono font-black text-black leading-none my-1">
                  #{String(receipt.tokenNumber).padStart(2, "0")}
                </div>
                {receipt.previouslyPaidAmount && (
                  <div className="text-[9px] font-bold uppercase tracking-wider text-black border-t border-dashed border-black pt-1 mt-1">
                    OLD TOKEN SLIP SURRENDERED &amp; DISPOSED
                  </div>
                )}
              </div>
            )}

            {/* Meta Info */}
            <div className="py-2.5 border-b border-dashed border-black space-y-1.5 text-[11px]">
              {receipt.tokenNumber && (
                <div className="flex justify-between items-center font-bold pb-1 border-b border-dashed border-black">
                  <span className="text-black uppercase">Token #:</span>
                  <span className="text-black font-mono font-black">
                    #{String(receipt.tokenNumber).padStart(2, "0")}
                  </span>
                </div>
              )}
              <div className="flex justify-between items-center">
                <span className="text-black font-semibold">Receipt #:</span>
                <span className="font-bold text-black">{receipt.receiptNumber}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-black font-semibold">Date / Time:</span>
                <span className="text-black">{formattedDate}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-black font-semibold">Operator:</span>
                <span className="text-black font-medium">{receipt.staffName}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-black font-semibold">Patient:</span>
                <span className="font-bold text-black">
                  {receipt.patientName || "Walk-in Customer"}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-black font-semibold">Patient UID:</span>
                <span className="font-bold text-black">
                  {receipt.patientUid || "OTC / Walk-in"}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-black font-semibold">Payment Method:</span>
                <span className="text-black font-medium">
                  {receipt.paymentMethod || "Cash (PKR)"}
                </span>
              </div>
            </div>

            {/* Itemized Table */}
            <div className="py-2.5 border-b border-dashed border-black">
              <table className="w-full text-[11px] border-collapse">
                <thead>
                  <tr className="border-b border-dashed border-black text-[10px] font-black uppercase tracking-wider">
                    <th className="text-left pb-1.5 w-[44%]">ITEM</th>
                    <th className="text-center pb-1.5 w-[12%]">QTY</th>
                    <th className="text-right pb-1.5 w-[22%]">PRICE</th>
                    <th className="text-right pb-1.5 w-[22%]">TOTAL</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-dashed divide-slate-200 print:divide-slate-300">
                  {receipt.items.map((item, idx) => {
                    const unitPrice = item.price || (item.quantity > 0 ? item.total / item.quantity : 0);
                    return (
                      <tr key={idx} className="align-top">
                        <td className="py-1.5 text-left pr-1 leading-snug">
                          <span className="font-bold text-black block break-words">
                            {item.description}
                          </span>
                        </td>
                        <td className="py-1.5 text-center font-bold text-black px-0.5">
                          {item.quantity}
                        </td>
                        <td className="py-1.5 text-right text-black whitespace-nowrap pl-0.5">
                          Rs. {unitPrice.toLocaleString()}
                        </td>
                        <td className="py-1.5 text-right font-bold text-black whitespace-nowrap pl-0.5">
                          Rs. {item.total.toLocaleString()}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Calculations & Financial Totals */}
            <div className="py-2.5 border-b border-dashed border-black space-y-1.5 text-[11px]">
              <div className="flex justify-between text-black">
                <span>Gross Total Services:</span>
                <span>Rs. {receipt.subtotal.toLocaleString()}</span>
              </div>
              {receipt.previouslyPaidAmount && receipt.previouslyPaidAmount > 0 && (
                <div className="flex justify-between text-black font-bold">
                  <span>Less Paid at Token {receipt.tokenNumber ? `#${String(receipt.tokenNumber).padStart(2, "0")}` : ""}:</span>
                  <span>- Rs. {receipt.previouslyPaidAmount.toLocaleString()} (PAID)</span>
                </div>
              )}
              {receipt.discount > 0 && (
                <div className="flex justify-between text-black font-bold">
                  <span>Discount Applied:</span>
                  <span>-Rs. {receipt.discount.toLocaleString()}</span>
                </div>
              )}
              <div className="flex justify-between text-[13px] font-black pt-1.5 border-t border-dashed border-black">
                <span>
                  {receipt.previouslyPaidAmount ? "NET CASH PAID NOW:" : "NET PAYABLE:"}
                </span>
                <span>
                  Rs. {(receipt.netAmountPaidNow ?? receipt.totalAmount).toLocaleString()}
                </span>
              </div>
              {receipt.previouslyPaidAmount && (
                <div className="text-[10px] text-black italic pt-1 border-t border-dashed border-black mt-1">
                  * Old token slip surrendered &amp; disposed. Rs. {receipt.previouslyPaidAmount} was collected at token creation.
                </div>
              )}
              {receipt.cashTendered !== undefined && (
                <>
                  <div className="flex justify-between text-black text-[11px] pt-1">
                    <span>Cash Tendered:</span>
                    <span>Rs. {receipt.cashTendered.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-black text-[11px] font-bold">
                    <span>Change Returned:</span>
                    <span>Rs. {(receipt.change || 0).toLocaleString()}</span>
                  </div>
                </>
              )}
              <div className="flex justify-between text-[10px] pt-1">
                <span className="text-black font-bold">Settlement:</span>
                <span className="font-black text-black">PAID [Settled]</span>
              </div>
            </div>

            {/* Footer / Barcode & Thank You */}
            <div className="pt-3 text-center space-y-1.5 text-black">
              {/* Monospace Barcode Aesthetic */}
              <div className="py-1 tracking-widest text-[10px] font-mono text-black select-none">
                ||| | ||||| || |||| ||||| ||| |||| | ||| ||||
              </div>
              <p className="text-[10px] font-mono text-black">
                ID: {receipt.receiptNumber}
              </p>
              <div className="pt-1">
                <p className="text-[11px] font-bold uppercase tracking-wider text-black">
                  *** Thank you! Get well soon. ***
                </p>
                <p className="text-[10px] text-black italic">
                  Wishing you good health &amp; speedy recovery.
                </p>
              </div>
              <p className="text-[9px] text-black pt-1 leading-tight">
                Computer-generated receipt · Ruqayya Clinic HMS v2.0
                <br />
                No physical signature required.
              </p>
              <div className="pt-2 border-t border-dashed border-black mt-1.5 text-center">
                <p className="text-[10px] font-bold uppercase tracking-wider text-black">
                  Powered by BlockMindArk
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Bottom Actions - Hidden when printing */}
        <div className="p-3 bg-slate-100 border-t border-slate-200 flex items-center justify-end gap-2 no-print">
          <button
            onClick={onClose}
            type="button"
            className="px-3.5 py-1.5 bg-white hover:bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-700 transition-colors"
          >
            Close &amp; Finish
          </button>
          <button
            onClick={handlePrint}
            type="button"
            className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors shadow-sm shadow-blue-600/30"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Receipt</span>
          </button>
        </div>
      </div>
    </div>
  );
}

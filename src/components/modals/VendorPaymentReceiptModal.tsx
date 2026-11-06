"use client";

import React from "react";
import { Printer, X, Building2, CheckCircle2 } from "lucide-react";
import { printReceiptElement } from "../receipts/ThermalReceiptModal";

export interface VendorPaymentReceiptData {
  id: string;
  paymentNumber: string;
  vendorName: string;
  vendorPhone?: string | null;
  vendorAddress?: string | null;
  amount: number;
  paymentMethod: string;
  referenceNumber?: string | null;
  paymentDate: string | Date;
  notes?: string | null;
  paidByName: string;
  poNumber?: string | null;
  poAmount?: number | null;
  vendorBalanceRemaining?: number | null;
}

export function VendorPaymentReceiptModal({
  payment,
  isOpen,
  onClose,
}: {
  payment: VendorPaymentReceiptData | null;
  isOpen: boolean;
  onClose: () => void;
}) {
  if (!isOpen || !payment) return null;

  const handlePrint = () => {
    printReceiptElement("vendor-payment-voucher-receipt");
  };

  const formattedDate = new Date(payment.paymentDate).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm print:p-0 print:bg-white print:fixed-none">
      <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden border border-slate-200 print:shadow-none print:border-none print:max-w-none print:w-full">
        {/* Controls - Hidden in Print */}
        <div className="p-3 bg-slate-900 text-white flex items-center justify-between print:hidden">
          <div className="flex items-center gap-2">
            <Printer className="w-4 h-4 text-emerald-400" />
            <span className="font-bold text-xs">Vendor Payment Voucher</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors shadow-sm"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Voucher</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Thermal Voucher Content */}
        <div
          id="vendor-payment-voucher-receipt"
          className="p-5 text-black font-mono text-[12px] leading-normal space-y-3.5 bg-white w-full max-w-[80mm] mx-auto select-none"
        >
          {/* Header */}
          <div className="text-center pb-2.5 border-b border-dashed border-black">
            <h2 className="text-[15px] font-black tracking-wider uppercase">
              RUQAYYA HOSPITAL &amp; PHARMACY
            </h2>
            <p className="text-[10px] uppercase tracking-tight text-black mt-1">
              Official Vendor Payment Voucher
            </p>
            <div className="mt-2 inline-block px-2.5 py-1 border border-black text-[10px] font-bold uppercase tracking-wider">
              DISBURSEMENT: {payment.paymentNumber}
            </div>
          </div>

          {/* Metadata Grid */}
          <div className="space-y-1 pb-2.5 border-b border-dashed border-black text-[11px]">
            <div className="flex justify-between">
              <span className="uppercase font-bold">Supplier / Vendor:</span>
              <span className="font-bold">{payment.vendorName}</span>
            </div>
            {payment.vendorPhone && (
              <div className="flex justify-between">
                <span className="uppercase font-bold">Phone:</span>
                <span>{payment.vendorPhone}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="uppercase font-bold">Disbursement Date:</span>
              <span className="font-bold">{formattedDate}</span>
            </div>
            <div className="flex justify-between">
              <span className="uppercase font-bold">PO Ref:</span>
              <span>{payment.poNumber ? payment.poNumber : "General Balance"}</span>
            </div>
            <div className="flex justify-between">
              <span className="uppercase font-bold">Payment Method:</span>
              <span className="font-bold uppercase">{payment.paymentMethod}</span>
            </div>
          </div>

          {/* Amount Box */}
          <div className="p-2.5 border border-dashed border-black space-y-1.5">
            <div className="flex justify-between items-center">
              <span className="font-bold uppercase text-[11px]">
                Net Disbursed Amount:
              </span>
              <span className="text-sm font-black">
                Rs. {payment.amount.toLocaleString()}
              </span>
            </div>
            {payment.referenceNumber && (
              <div className="flex justify-between items-center text-[11px] pt-1.5 border-t border-dashed border-black">
                <span>Ref Number:</span>
                <span className="font-bold">{payment.referenceNumber}</span>
              </div>
            )}
            {payment.vendorBalanceRemaining !== undefined && payment.vendorBalanceRemaining !== null && (
              <div className="flex justify-between items-center text-[11px] pt-1.5 border-t border-dashed border-black">
                <span>Balance Remaining:</span>
                <span className="font-bold">
                  Rs. {payment.vendorBalanceRemaining.toLocaleString()}
                </span>
              </div>
            )}
          </div>

          {/* Notes */}
          {payment.notes && (
            <div className="p-2 border border-dashed border-black text-[11px] space-y-1">
              <span className="font-bold uppercase block text-[10px]">
                Payment Memo / Notes:
              </span>
              <p className="italic">&ldquo;{payment.notes}&rdquo;</p>
            </div>
          )}

          {/* Signatures */}
          <div className="pt-5 grid grid-cols-2 gap-4 text-center text-[10px]">
            <div className="border-t border-dashed border-black pt-1.5">
              <p className="font-bold">{payment.paidByName}</p>
              <p className="text-[9px]">Disbursed By (Finance)</p>
            </div>
            <div className="border-t border-dashed border-black pt-1.5">
              <p className="font-bold">{payment.vendorName}</p>
              <p className="text-[9px]">Vendor Received Signature</p>
            </div>
          </div>

          {/* Barcode & Footer Note */}
          <div className="text-center pt-2 space-y-1.5">
            <div className="tracking-widest text-[10px] font-mono select-none">
              ||| | ||||| || |||| ||||| ||| |||| | ||| ||||
            </div>
            <p className="text-[9px] text-center">
              HMS Vendor Accounts Payable System • Ruqayya Hospital
            </p>
            <div className="pt-2 border-t border-dashed border-black mt-1.5 text-center">
              <p className="text-[10px] font-bold uppercase tracking-wider text-black">
                Powered by BlockMindArk
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


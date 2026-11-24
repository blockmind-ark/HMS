"use client";

import React, { useState, useRef } from "react";
import {
  Upload,
  FileSpreadsheet,
  AlertCircle,
  CheckCircle2,
  X,
  RefreshCw,
  Download,
  AlertTriangle,
  Info,
  ChevronRight,
} from "lucide-react";

interface RowValidationError {
  rowNumber: number;
  itemName: string;
  errors: string[];
}

interface MedicineCsvImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function MedicineCsvImportModal({
  isOpen,
  onClose,
  onSuccess,
}: MedicineCsvImportModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [errorReport, setErrorReport] = useState<{
    message: string;
    missingHeaders?: string[];
    detectedHeaders?: string[];
    totalRows?: number;
    invalidRowsCount?: number;
    errors?: RowValidationError[];
  } | null>(null);
  const [successReport, setSuccessReport] = useState<{
    message: string;
    count: number;
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setErrorReport(null);
      setSuccessReport(null);
    }
  };

  const handleReset = () => {
    setFile(null);
    setErrorReport(null);
    setSuccessReport(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleUploadAndImport = async () => {
    if (!file) return;

    setUploading(true);
    setErrorReport(null);
    setSuccessReport(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/admin/medicines/import", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setSuccessReport({
          message: data.message || `Successfully imported ${data.count} medicines.`,
          count: data.count || 0,
        });
        onSuccess();
      } else {
        // Pre-validation failed (400 or 422)
        setErrorReport({
          message: data.message || data.error || "Pre-validation failed.",
          missingHeaders: data.missingHeaders,
          detectedHeaders: data.detectedHeaders,
          totalRows: data.totalRows,
          invalidRowsCount: data.invalidRowsCount,
          errors: data.errors,
        });
      }
    } catch (err: any) {
      setErrorReport({
        message: err.message || "Network error while uploading CSV.",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleDownloadTemplate = () => {
    const headers = [
      "Item / Product Name",
      "Form / Potency / Specification",
      "Per Tab / Unit Selling Price",
      "Qty Pur",
      "Per Tab / Unit Cost",
      "Low-Stock Threshold",
      "Per Off (%)",
      "Batch no",
      "Expiry date",
    ];

    const sampleRow = [
      '"Paracetamol 500mg"',
      '"Tablet"',
      "15.00",
      "250",
      "10.00",
      "20",
      "0",
      '"BATCH-A1"',
      "2026-12-31",
    ];

    const csvText = [headers.join(","), sampleRow.join(",")].join("\r\n");
    const blob = new Blob([csvText], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "medicine_import_template.csv";
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden border border-slate-100">
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-purple-500/20 text-purple-300 rounded-xl">
              <Upload className="w-5 h-5 text-purple-300" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <span>Admin CSV Medicine Import &amp; Pre-Validation</span>
                <span className="text-[10px] font-black bg-purple-500/30 text-purple-200 px-2 py-0.5 rounded-full border border-purple-400/30">
                  Strict Validation
                </span>
              </h3>
              <p className="text-xs text-purple-200/80">
                Safely upload and bulk import medicine records with automatic schema verification.
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              handleReset();
              onClose();
            }}
            className="text-purple-300 hover:text-white p-1 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {/* Success State Banner */}
          {successReport && (
            <div className="p-5 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-900 space-y-3 animate-in zoom-in-95">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-6 h-6 text-emerald-600 flex-shrink-0" />
                <div>
                  <h4 className="text-sm font-extrabold text-emerald-950">
                    Import Succeeded &amp; Database Updated!
                  </h4>
                  <p className="text-xs text-emerald-700 mt-0.5">
                    {successReport.message}
                  </p>
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    handleReset();
                    onClose();
                  }}
                  className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl transition-colors shadow-sm"
                >
                  Done &amp; Close
                </button>
              </div>
            </div>
          )}

          {/* Error Report View */}
          {errorReport && (
            <div className="p-5 bg-red-50 border border-red-200 rounded-2xl text-red-950 space-y-4 animate-in zoom-in-95">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h4 className="text-sm font-extrabold text-red-900">
                    Pre-Validation Failed — Import Aborted
                  </h4>
                  <p className="text-xs text-red-700 font-medium leading-relaxed">
                    {errorReport.message}
                  </p>
                </div>
              </div>

              {/* Missing Headers Details */}
              {errorReport.missingHeaders && errorReport.missingHeaders.length > 0 && (
                <div className="p-3.5 bg-white border border-red-200 rounded-xl space-y-2">
                  <div className="text-xs font-bold text-red-800 flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-red-600" />
                    <span>Missing Required Column Headers:</span>
                  </div>
                  <ul className="list-disc list-inside text-xs text-red-700 space-y-1 font-medium pl-1">
                    {errorReport.missingHeaders.map((h, i) => (
                      <li key={i}>{h}</li>
                    ))}
                  </ul>
                  {errorReport.detectedHeaders && (
                    <div className="text-[11px] text-slate-500 pt-1 border-t border-slate-100">
                      <strong>Detected in file:</strong> {errorReport.detectedHeaders.join(", ") || "(empty)"}
                    </div>
                  )}
                </div>
              )}

              {/* Row-by-Row Error Table */}
              {errorReport.errors && errorReport.errors.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold text-red-900">
                    <span>Validation Failure Breakdown ({errorReport.errors.length} rows affected):</span>
                    <span className="text-[11px] text-red-600">
                      {errorReport.invalidRowsCount} of {errorReport.totalRows} rows invalid
                    </span>
                  </div>

                  <div className="max-h-60 overflow-y-auto border border-red-200 rounded-xl bg-white divide-y divide-red-100">
                    {errorReport.errors.map((err, idx) => (
                      <div key={idx} className="p-3 text-xs space-y-1 hover:bg-red-50/50">
                        <div className="flex items-center justify-between font-bold text-slate-800">
                          <span className="flex items-center gap-1.5">
                            <span className="px-2 py-0.5 rounded bg-red-100 text-red-800 text-[10px] font-black">
                              Line #{err.rowNumber}
                            </span>
                            <span>{err.itemName}</span>
                          </span>
                        </div>
                        <ul className="space-y-0.5 pl-2 text-[11px] text-red-600 list-disc list-inside">
                          {err.errors.map((msg, mIdx) => (
                            <li key={mIdx}>{msg}</li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleReset}
                  className="px-3.5 py-2 bg-red-100 hover:bg-red-200 text-red-800 rounded-xl text-xs font-bold transition-colors"
                >
                  Choose Another File
                </button>
              </div>
            </div>
          )}

          {/* Upload Input Area */}
          {!successReport && (
            <div className="space-y-4">
              <div
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all ${
                  file
                    ? "border-purple-500 bg-purple-50/50"
                    : "border-slate-200 hover:border-purple-400 bg-slate-50/50 hover:bg-purple-50/20"
                }`}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  accept=".csv"
                  onChange={handleFileChange}
                  className="hidden"
                />

                <div className="flex flex-col items-center justify-center space-y-2">
                  <div
                    className={`p-3 rounded-2xl ${
                      file ? "bg-purple-100 text-purple-700" : "bg-slate-100 text-slate-500"
                    }`}
                  >
                    <FileSpreadsheet className="w-8 h-8" />
                  </div>

                  {file ? (
                    <div>
                      <div className="text-xs font-extrabold text-slate-900 flex items-center justify-center gap-1.5">
                        <span>{file.name}</span>
                        <span className="text-[10px] font-medium text-slate-500">
                          ({(file.size / 1024).toFixed(1)} KB)
                        </span>
                      </div>
                      <p className="text-[11px] text-purple-700 font-bold mt-1">
                        Click to change selected file
                      </p>
                    </div>
                  ) : (
                    <div>
                      <p className="text-xs font-bold text-slate-700">
                        Click to select CSV file, or drag and drop here
                      </p>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Supports standard CSV files (RFC 4180 format)
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Requirement Notes */}
              <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-2xl space-y-2 text-xs text-slate-600">
                <div className="flex items-center justify-between font-bold text-slate-800">
                  <span className="flex items-center gap-1.5">
                    <Info className="w-4 h-4 text-purple-600" />
                    <span>Required CSV Headers for Pre-Validation:</span>
                  </span>
                  <button
                    type="button"
                    onClick={handleDownloadTemplate}
                    className="text-[11px] text-purple-700 hover:text-purple-900 font-bold flex items-center gap-1"
                  >
                    <Download className="w-3 h-3" />
                    <span>Download Sample Template</span>
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div>
                    <span className="font-bold text-slate-700">1. Name:</span> Item / Product Name (No forbidden symbols)
                  </div>
                  <div>
                    <span className="font-bold text-slate-700">2. Category:</span> Specification / Category
                  </div>
                  <div>
                    <span className="font-bold text-slate-700">3. Selling Price:</span> Numeric data type &ge; 0
                  </div>
                  <div>
                    <span className="font-bold text-slate-700">4. Quantity (QTY):</span> Whole integer &ge; 0
                  </div>
                </div>
                <div className="text-[10px] text-slate-500 pt-1 space-y-0.5 border-t border-slate-200">
                  <p>
                    <strong>Policy:</strong> Special characters restricted to clinical punctuation (<code className="font-mono bg-slate-200 px-1 rounded">- . / % ( ) + &amp; &apos; ,</code>). <strong>Duplicates are permitted freely.</strong>
                  </p>
                  <p className="text-slate-400">
                    Optional fields: Purchase Cost, Low-Stock Threshold, Per Off (%), Batch No, Expiry Date.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
          <button
            type="button"
            onClick={() => {
              handleReset();
              onClose();
            }}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors"
          >
            {successReport ? "Close" : "Cancel"}
          </button>

          {!successReport && (
            <button
              type="button"
              onClick={handleUploadAndImport}
              disabled={!file || uploading}
              className="px-5 py-2.5 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-md shadow-purple-600/20 flex items-center gap-2 transition-all active:scale-[0.98]"
            >
              {uploading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Validating &amp; Importing...</span>
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  <span>Upload &amp; Import</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

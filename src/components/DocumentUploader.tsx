import React, { useState } from "react";
import { Upload, FileText, Loader2, CheckCircle2, AlertCircle, ChevronDown } from "lucide-react";
import type { AgentStepStatus, PassportData, StructuredDocument } from "../types";

interface DocumentUploaderProps {
  passportId: string;
  onPassportUpdated: (passport: PassportData) => void;
}

export default function DocumentUploader({ passportId, onPassportUpdated }: DocumentUploaderProps) {
  const [dragActive, setDragActive] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [structuring, setStructuring] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rawText, setRawText] = useState("");
  const [fileName, setFileName] = useState("");
  const [document, setDocument] = useState<StructuredDocument | null>(null);
  const [steps, setSteps] = useState<AgentStepStatus[]>([]);
  const [showRaw, setShowRaw] = useState(false);

  const reset = () => {
    setError(null);
    setRawText("");
    setFileName("");
    setDocument(null);
    setSteps([]);
    setShowRaw(false);
  };

  const runStructure = async (text: string, name: string) => {
    setStructuring(true);
    setError(null);
    try {
      const res = await fetch("/api/bindu/document", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rawText: text, fileName: name }),
      });
      const data = await res.json();
      setSteps(data.steps || []);
      if (!res.ok) {
        setError(
          data.message ||
            data.error ||
            "AI analysis is temporarily unavailable. Your medical record has not been modified."
        );
        setDocument(null);
        return;
      }
      setDocument(data.document);
    } catch (e: any) {
      setError(e?.message || "Document agent failed");
    } finally {
      setStructuring(false);
    }
  };

  const handlePdf = async (file: File) => {
    reset();
    if (!file.name.toLowerCase().endsWith(".pdf")) {
      setError("PDF documents supported in this MVP.");
      return;
    }
    setExtracting(true);
    setFileName(file.name);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/records/extract", { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Extraction failed");
        return;
      }
      setRawText(data.rawText);
      await runStructure(data.rawText, data.fileName || file.name);
    } catch (e: any) {
      setError(e?.message || "Upload failed");
    } finally {
      setExtracting(false);
    }
  };

  const handleSample = async () => {
    reset();
    setExtracting(true);
    setFileName("sample-blood-report.pdf");
    try {
      const fileRes = await fetch("/samples/sample-blood-report.pdf");
      if (!fileRes.ok) throw new Error("Sample PDF missing");
      const blob = await fileRes.blob();
      const file = new File([blob], "sample-blood-report.pdf", { type: "application/pdf" });
      await handlePdf(file);
    } catch (e: any) {
      setError(e?.message || "Could not load sample report");
      setExtracting(false);
    }
  };

  const handleConfirm = async () => {
    if (!document) return;
    setConfirming(true);
    setError(null);
    try {
      const res = await fetch("/api/bindu/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ passportId, document }),
      });
      const data = await res.json();
      setSteps(data.steps || []);
      if (!res.ok) {
        setError(data.error || "Confirm failed");
        return;
      }
      onPassportUpdated(data.passport);
      reset();
    } catch (e: any) {
      setError(e?.message || "Confirm failed");
    } finally {
      setConfirming(false);
    }
  };

  const busy = extracting || structuring || confirming;

  return (
    <div className="bg-card-bg rounded-[32px] border border-natural-sage p-6 shadow-sm space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-serif text-lg text-natural-dark">Upload Medical Record</h3>
          <p className="text-xs text-stone-500 mt-1">
            PDF documents supported in this MVP. Text is extracted without AI; Bindu Document Agent
            structures clinical values.
          </p>
        </div>
        <button
          type="button"
          onClick={handleSample}
          disabled={busy}
          className="text-[10px] font-bold uppercase tracking-wider px-3 py-2 rounded-xl border border-natural-olive/30 text-natural-olive hover:bg-natural-sage/40"
        >
          Try Sample Report
        </button>
      </div>

      <div
        onDragEnter={(e) => {
          e.preventDefault();
          setDragActive(true);
        }}
        onDragOver={(e) => {
          e.preventDefault();
          setDragActive(true);
        }}
        onDragLeave={(e) => {
          e.preventDefault();
          setDragActive(false);
        }}
        onDrop={(e) => {
          e.preventDefault();
          setDragActive(false);
          const f = e.dataTransfer.files?.[0];
          if (f) void handlePdf(f);
        }}
        className={`rounded-2xl border-2 border-dashed p-8 text-center transition-colors ${
          dragActive ? "border-natural-olive bg-natural-sage/30" : "border-natural-sage bg-natural-bg/40"
        }`}
      >
        <Upload className="w-8 h-8 mx-auto text-natural-olive/60 mb-3" />
        <p className="text-xs text-stone-600 mb-3">Drop a text-based PDF here</p>
        <label className="inline-flex items-center gap-2 cursor-pointer bg-natural-olive text-natural-bg text-xs font-bold px-4 py-2.5 rounded-xl">
          <FileText className="w-4 h-4" />
          Select PDF
          <input
            type="file"
            accept=".pdf,application/pdf"
            className="hidden"
            disabled={busy}
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void handlePdf(f);
            }}
          />
        </label>
      </div>

      {busy && (
        <div className="flex items-center gap-2 text-xs text-natural-olive">
          <Loader2 className="w-4 h-4 animate-spin" />
          {extracting ? "Extracting text…" : structuring ? "Document Agent running…" : "Confirming…"}
        </div>
      )}

      {error && (
        <div className="flex gap-2 p-3 rounded-xl bg-red-50 border border-red-100 text-xs text-red-800">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {steps.length > 0 && (
        <div className="space-y-2 rounded-2xl border border-natural-sage p-4 bg-natural-bg/30">
          <p className="text-[10px] font-mono font-bold uppercase tracking-wider text-natural-olive">
            AI Processing
          </p>
          {steps.map((s, i) => (
            <div key={i} className="flex items-start gap-2 text-xs">
              {s.status === "done" ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : s.status === "running" ? (
                <Loader2 className="w-4 h-4 animate-spin text-natural-olive shrink-0" />
              ) : s.status === "error" ? (
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
              ) : (
                <span className="w-4 h-4 rounded-full border border-stone-300 shrink-0 mt-0.5" />
              )}
              <div>
                <span className="font-semibold capitalize">{s.agent} Agent</span>
                <span className="text-stone-500"> — {s.message}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {document && (
        <div className="rounded-2xl border border-natural-sage p-4 space-y-4">
          <div>
            <h4 className="font-serif text-base text-natural-dark">
              {document.documentType} — {document.date}
            </h4>
            {document.facility && (
              <p className="text-xs text-stone-500 mt-1">Facility: {document.facility}</p>
            )}
          </div>

          {document.tests.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-left text-natural-olive/70 font-mono uppercase tracking-wider">
                    <th className="py-1">Test</th>
                    <th className="py-1">Value</th>
                    <th className="py-1">Unit</th>
                  </tr>
                </thead>
                <tbody>
                  {document.tests.map((t, i) => (
                    <tr key={i} className="border-t border-natural-sage/40">
                      <td className="py-2 font-medium">{t.name}</td>
                      <td className="py-2 font-mono">{t.value}</td>
                      <td className="py-2 text-stone-500">{t.unit}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {document.followUp && (
            <p className="text-xs bg-natural-sage/40 rounded-xl px-3 py-2">
              Follow-up recommended: <strong>{document.followUp.recommendedDate}</strong> —{" "}
              {document.followUp.note}
            </p>
          )}

          <button
            type="button"
            onClick={() => setShowRaw((v) => !v)}
            className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-natural-olive"
          >
            <ChevronDown className={`w-3.5 h-3.5 transition ${showRaw ? "rotate-180" : ""}`} />
            View extracted text
          </button>
          {showRaw && (
            <pre className="text-[10px] whitespace-pre-wrap bg-natural-bg/50 rounded-xl p-3 max-h-40 overflow-auto border border-natural-sage/50">
              {rawText}
            </pre>
          )}

          <div className="flex gap-2 justify-end">
            <button
              type="button"
              onClick={reset}
              className="px-4 py-2 rounded-xl text-xs border border-natural-sage"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={confirming}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-natural-olive text-natural-bg"
            >
              Confirm & Add
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

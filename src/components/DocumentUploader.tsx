/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { Upload, FileText, Sparkles, AlertCircle, RefreshCw } from "lucide-react";
import { TimelineEvent } from "../types";

interface DocumentUploaderProps {
  onEventParsed: (event: TimelineEvent) => void;
}

const SAMPLE_DOCS = [
  {
    name: "🩸 CBC Lab Report (Anemia Hint)",
    summary: "Complete Blood Count from Northern Path Lab",
    text: `PATIENT: Aarav Sharma
REPORT DATE: June 15, 2026
CLINICIAN: Dr. Rakesh Gupta, MD
LAB: Northern Pathology Labs

FINDINGS: Hemoglobin level is low at 11.2 g/dL (normal range 13.5-17.5). White Blood Cells (WBC) are moderately elevated at 11.5 x10^3/uL. Platelets normal at 250 x10^3/uL. Fasting blood sugar is stable at 94 mg/dL. Renal indices BUN 15 and Creatinine 0.8 are completely healthy.

CONCLUSION: Mild iron deficiency anemia is suggested, watch dietary intake.
RECOMMENDATIONS: Take Ferrous Sulfate 325mg daily, review blood values in 12 weeks.`,
  },
  {
    name: "🫀 Cardiology ECG Diagnostic",
    summary: "Holter Monitor rhythm review",
    text: `REPORT: Holter Electrocardiography Diagnostics
REFERRING CLINICIAN: Dr. Sarah Lin (FACC)
FACILITY: Metro Cardiovascular Diagnostics
DATE: April 10, 2026

ASSESSMENT: Patient experiences minor postural palpitations. 24-hour heart rhythm analysis shows normal sinus rhythm with occasional isolated premature atrial contractions (PACs), representing <0.5% of total beats. Average heart rate was 72 bpm. Systolic pressure averages 132 mmHg, Diastolic averages 82 mmHg, confirming mild Grade 1 Hypertension.

ADVICE: Continue Lisinopril 10mg daily. Reduce caffeine and sodium intake. Avoid stress triggers.`,
  },
  {
    name: "🦴 Orthopedic Knee MRI",
    summary: "Left knee twist assessment",
    text: `CITY ORTHOPAEDICS AND RADIOLOGY IMAGING
DATE: September 5, 2025
REFERRING: Dr. Rajesh Mehra (Orthopedic Surgeon)
IMAGING STUDY: LEFT KNEE MRI

FINDINGS: High signal intensity observed on T2-weighted scans along the femoral attachment of the anterior cruciate ligament (ACL) compatible with a mild Grade 1 partial sprain. Lateral and medial menisci are fully intact with normal morphology. Posterior cruciate ligament (PCL) is normal. No joint effusion.

CONCLUSION: Mild left knee partial ACL sprain.
MANAGEMENT: Standard clinical rehabilitation and physical therapy targeting quadricep conditioning for 6 weeks. Rest from contact pivot athletics.`,
  },
  {
    name: "💉 Immunization Booster Receipt",
    summary: "Tdap & Influenza logs",
    text: `IMMUNIZATION SERVICE CENTRE
DATE: October 12, 2024
CLINICIAN: Nurse Susan Wright
LOCATION: City Central Immunization Center

PATIENT: Aarav Sharma
IMMUNIZATIONS ADMINISTERED:
- Tdap booster vaccine (0.5 mL IM, Left Deltoid, Lot #TD99281)
- Influenza vaccine seasonal (0.5 mL IM, Right Deltoid, Lot #FL2211)

Tolerated vaccine well. No immediate side effects.
ADVICE: Normal soreness at vaccination site expected. Apply cold compress if needed.`,
  },
];

export default function DocumentUploader({ onEventParsed }: DocumentUploaderProps) {
  const [inputText, setInputText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);

  const handleTextParse = async (textToParse: string) => {
    if (!textToParse.trim()) {
      setError("Please write some notes or select a sample report first.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/records/parse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: textToParse }),
      });

      if (!response.ok) {
        throw new Error("Server failed to analyze the document. Please try again.");
      }

      const parsedEvent: TimelineEvent = await response.json();
      onEventParsed(parsedEvent);
      setInputText("");
      setUploadedFileName(null);
    } catch (err: any) {
      console.error(err);
      setError(err?.message || "Something went wrong while communicating with the AI. Please verify key settings.");
    } finally {
      setLoading(false);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const simulateFileUpload = (fileName: string) => {
    setUploadedFileName(fileName);
    // Simulate reading medical text based on file name
    if (fileName.toLowerCase().includes("blood")) {
      setInputText(SAMPLE_DOCS[0].text);
    } else if (fileName.toLowerCase().includes("heart") || fileName.toLowerCase().includes("cardio")) {
      setInputText(SAMPLE_DOCS[1].text);
    } else if (fileName.toLowerCase().includes("mri") || fileName.toLowerCase().includes("knee")) {
      setInputText(SAMPLE_DOCS[2].text);
    } else {
      setInputText(
        `[SCANNED MEDICAL UPLOAD: ${fileName}]\nDATE: ${
          new Date().toISOString().split("T")[0]
        }\nCLINICIAN: General Practitioner Dr. Roy\nFACILITY: Health Diagnostics Center\nFINDINGS: Routine annual health screening file uploaded for patient passport. Lungs clear, cardiovascular system exhibits normotension. Standard cholesterol borderline.\nADVICE: Annual regular follow-ups.`
      );
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      simulateFileUpload(file.name);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      simulateFileUpload(file.name);
    }
  };

  const selectSample = (sampleText: string, sampleName: string) => {
    setInputText(sampleText);
    setUploadedFileName(sampleName);
    setError(null);
  };

  return (
    <div className="bg-white rounded-[32px] border border-natural-sage p-6 md:p-8 shadow-sm">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-xl font-serif font-bold text-natural-dark flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-natural-olive animate-pulse" />
            Parse Medical Records with AI
          </h2>
          <p className="text-xs text-natural-text/75 mt-0.5">
            Upload hospital reports, prescriptions, or scrawls to organize your timeline.
          </p>
        </div>
      </div>

      {/* Grid: Left - Samples, Right - Active Area */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Sample selection pane */}
        <div className="lg:col-span-5 space-y-3">
          <label className="block text-[10px] uppercase font-mono font-bold text-natural-olive/60 tracking-wider mb-2">
            Click to Try Clinical Samples
          </label>
          <div className="grid grid-cols-1 gap-2.5">
            {SAMPLE_DOCS.map((doc, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => selectSample(doc.text, doc.name)}
                className={`text-left p-3.5 rounded-xl border text-xs transition-all duration-200 ${
                  uploadedFileName === doc.name
                    ? "bg-[#e8ede0]/60 border-natural-olive text-natural-dark font-semibold shadow-sm"
                    : "bg-natural-bg/40 hover:bg-[#e8ede0]/20 border-natural-sage/60 text-natural-text"
                }`}
              >
                <p className="font-semibold">{doc.name}</p>
                <p className="text-[10px] text-natural-text/60 mt-1 line-clamp-1">{doc.summary}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Uploader interaction */}
        <div className="lg:col-span-7 flex flex-col justify-between space-y-4">
          <div
            onDragEnter={handleDrag}
            onDragOver={handleDrag}
            onDragLeave={handleDrag}
            onDrop={handleDrop}
            className={`relative rounded-2xl border border-dashed p-5 text-center transition-all flex flex-col items-center justify-center min-h-[140px] ${
              dragActive
                ? "border-natural-olive bg-natural-sage/20"
                : "border-natural-sage hover:border-natural-olive/40 bg-natural-bg/50"
            }`}
          >
            <input
              type="file"
              id="file-upload"
              className="hidden"
              onChange={handleFileChange}
              accept=".pdf,.png,.jpg,.jpeg,.txt"
            />
            <label htmlFor="file-upload" className="cursor-pointer flex flex-col items-center">
              <Upload className={`w-9 h-9 ${dragActive ? "text-natural-olive animate-bounce" : "text-natural-olive/40"}`} />
              <p className="text-xs font-semibold text-natural-text mt-2.5">
                Drag prescription file here, or <span className="text-natural-olive font-bold hover:underline">browse</span>
              </p>
              <p className="text-[10px] text-natural-olive/60 mt-1">
                Supports PDF, images, raw text files
              </p>
            </label>

            {uploadedFileName && (
              <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-natural-sage text-natural-dark text-[10px] font-semibold border border-natural-olive/20 animate-fade-in">
                <FileText className="w-3.5 h-3.5 text-natural-olive" />
                <span>Active: {uploadedFileName}</span>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-[10px] uppercase font-mono font-bold text-natural-olive/70">
                Or Paste Unstructured Doctor Notes / Transcription
              </label>
              {inputText && (
                <button
                  type="button"
                  onClick={() => {
                    setInputText("");
                    setUploadedFileName(null);
                  }}
                  className="text-[10px] text-red-700 hover:underline font-bold"
                >
                  Clear Notes
                </button>
              )}
            </div>
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="e.g. Patient Aarav visited Clinic today 14th May. Blood pressure is 135/85 mmHg. Penicillin allergy confirmed. Prescribed Azithromycin 250mg. Complete physical recovery expected in 2 weeks..."
              rows={4}
              className="w-full text-xs p-3.5 rounded-xl border border-natural-sage focus:outline-none focus:border-natural-olive focus:ring-1 focus:ring-natural-olive bg-natural-bg/40 text-natural-dark placeholder-natural-text/40 font-sans resize-none"
            ></textarea>
          </div>

          {error && (
            <div className="flex items-start gap-2.5 p-3.5 bg-red-50 border border-red-100 rounded-xl text-xs text-red-800">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0 text-red-700" />
              <span>{error}</span>
            </div>
          )}

          <button
            type="button"
            disabled={loading || !inputText.trim()}
            onClick={() => handleTextParse(inputText)}
            className={`w-full py-3 rounded-2xl text-xs font-semibold flex items-center justify-center gap-2 transition-all duration-200 shadow-sm ${
              loading
                ? "bg-natural-sage text-natural-olive cursor-not-allowed"
                : !inputText.trim()
                ? "bg-natural-sage/20 text-[#5a5a40]/30 border border-natural-sage/10 cursor-not-allowed"
                : "bg-natural-olive hover:bg-natural-olive/95 text-white shadow-xs font-serif italic text-sm"
            }`}
          >
            {loading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>AI Generating Medicine Timeline...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Run Timeline Extraction Model</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

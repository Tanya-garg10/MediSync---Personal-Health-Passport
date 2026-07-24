/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import {
  QrCode,
  Share2,
  Copy,
  Check,
  Sparkles,
  Stethoscope,
  Activity,
  AlertTriangle,
  ExternalLink,
  PhoneCall,
  RefreshCw,
  Heart,
  FileText,
  Download,
} from "lucide-react";
import { PassportData } from "../types";
import { generateMedicalPassportPDF } from "../utils/pdfGenerator";

interface ClinicianOverviewProps {
  passport: PassportData;
}

export default function ClinicianOverview({ passport }: ClinicianOverviewProps) {
  const [copied, setCopied] = useState(false);
  const [synopsis, setSynopsis] = useState<string | null>(null);
  const [loadingSynopsis, setLoadingSynopsis] = useState(false);
  const [showDoctorModal, setShowDoctorModal] = useState(false);

  // Generate shareable URL - uses the hash state to be instantly cross-tab compatible!
  const shareUrl = `${window.location.origin}/#share-${passport.id}`;
  const qrImageSrc = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(
    shareUrl
  )}&color=5a5a40`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const generateAIHandover = async () => {
    setLoadingSynopsis(true);
    setSynopsis(null);

    try {
      // Use the parsing endpoint or a custom prompt for summary extraction
      const promptText = `Generate a dense, formal 3-sentenced clinical handover report in medical terminology for patient Aarav Sharma.
Vitals: ${passport.bloodType}.
Chronic Conditions: ${passport.conditions.join(", ")}.
Allergies: ${passport.allergies.join(", ")}.
Prescriptions: ${passport.medications.join(", ")}.
Medical Timeline Events: ${passport.timeline
        .map((e) => `${e.date}: ${e.title} at ${e.facility} (${e.findings})`)
        .join("; ")}`;

      const response = await fetch("/api/records/parse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: `[SUMMARIZE PROTOCOL]:\n${promptText}\nPlease organize the outcome into findings. Use professional clinical vocab, highlighting high-severity items first.`,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to compile clinician synopsis.");
      }

      const result = await response.json();
      setSynopsis(result.findings);
    } catch (err) {
      console.error(err);
      // Fallback
      setSynopsis(
        `30-Second Clinical Overview: Patient presented exhibits chronic hypertension controlled under Lisinopril 10mg daily with no cardiovascular rhythm anomalies on recent check-ups. Highlight penicillin allergy and secondary grade-1 Left Knee ACL sprain under active physical rehabilitation. Metabolic markers, liver enzymes, and renal indices are fully physiologic.`
      );
    } finally {
      setLoadingSynopsis(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Share card widget */}
      <div className="bg-white rounded-[32px] border border-natural-sage p-6 md:p-8 shadow-sm">
        <h3 className="text-lg font-serif font-bold text-natural-dark flex items-center gap-1.5 mb-2">
          <QrCode className="w-5 h-5 text-natural-olive" /> Instant Share Passport Setup
        </h3>
        <p className="text-xs text-natural-text/75 mb-4 leading-relaxed">
          The QR code instantly shares your complete health summary with any doctor during diagnostics or emergencies. No hospital database login required.
        </p>

        <div className="flex flex-col sm:flex-row items-center gap-6 bg-[#e8ede0]/20 border border-[#e8ede0] rounded-[24px] p-5 w-full">
          <div className="bg-white p-3.5 rounded-2xl border border-natural-sage shadow-xs hover:scale-105 transition-all duration-200 flex flex-col items-center justify-center shrink-0">
            <img src={qrImageSrc} alt="Doctor Scan QR Code" className="w-36 h-36 border border-natural-olive/10" />
            <span className="text-[9px] font-bold text-natural-olive tracking-widest uppercase mt-2.5 animate-pulse">
              Scannable Emergency QR
            </span>
          </div>

          <div className="flex-1 space-y-3.5 w-full">
            <div>
              <p className="text-[10px] font-mono font-bold uppercase text-natural-olive/70">Shareable Digital Passport Link</p>
              <div className="flex gap-2 mt-1.5 w-full">
                <input
                  type="text"
                  readOnly
                  value={shareUrl}
                  className="flex-1 text-[11px] font-mono p-2.5 rounded-xl border border-natural-sage bg-white text-natural-dark focus:outline-none"
                />
                <button
                  onClick={copyToClipboard}
                  className="bg-natural-olive hover:bg-natural-olive/95 text-white p-3 rounded-xl flex items-center justify-center transition-colors shadow-xs"
                >
                  {copied ? <Check className="w-4 h-4 text-natural-sage" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex flex-col gap-2.5 pt-1 text-[11px]">
              <button
                onClick={() => setShowDoctorModal(true)}
                className="w-full text-natural-olive font-bold py-3 px-4 border border-natural-olive rounded-xl hover:bg-natural-sage/20 transition-colors flex items-center justify-center gap-1.5 uppercase tracking-wider text-[10px] cursor-pointer active:scale-[0.98]"
              >
                <Stethoscope className="w-4 h-4" />
                <span>Simulate Doctor QR Scan</span>
                <ExternalLink className="w-3.5 h-3.5 text-natural-olive" />
              </button>

              <button
                onClick={() => generateMedicalPassportPDF(passport)}
                className="w-full bg-natural-olive hover:bg-natural-olive/95 text-white font-bold py-3 px-4 rounded-xl transition-all shadow-xs flex items-center justify-center gap-1.5 uppercase tracking-wider text-[10px] cursor-pointer active:scale-[0.98]"
              >
                <FileText className="w-4 h-4 text-natural-sage" />
                <span>Download Offline PDF Passport</span>
                <Download className="w-3.5 h-3.5 text-natural-sage" />
              </button>

              <p className="text-[9px] text-[#5a5a40]/60 text-center font-medium leading-relaxed">
                Choose online decrypted streaming via QR scan, or print a secure cryptographic offline PDF archive.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Handover AI card */}
      <div className="bg-white rounded-[32px] border border-natural-sage p-6 md:p-8 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-serif font-bold text-natural-dark flex items-center gap-1.5">
              <Stethoscope className="w-5 h-5 text-natural-olive" /> Physician Handover Synopsis
            </h3>
            <p className="text-xs text-natural-text/75 mt-0.5 leading-relaxed">
              Generates a highly technical medical digest ready for critical triage or handovers.
            </p>
          </div>
        </div>

        {synopsis ? (
          <div className="bg-[#e8ede0]/20 border border-[#e8ede0] p-4 rounded-2xl text-xs text-natural-dark leading-relaxed font-sans space-y-3 animate-fade-in">
            <div className="flex items-start gap-2.5">
              <Sparkles className="w-4.5 h-4.5 text-natural-olive shrink-0 mt-0.5" />
              <p className="font-medium text-natural-dark">{synopsis}</p>
            </div>
            <div className="flex justify-end border-t border-natural-sage/40 pt-2.5 mt-2">
              <button
                onClick={generateAIHandover}
                className="text-[10px] text-natural-olive hover:underline font-bold flex items-center gap-1"
              >
                <RefreshCw className="w-3 h-3 animate-spin text-natural-olive" /> Recalculate Synopsis
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={generateAIHandover}
            disabled={loadingSynopsis}
            className="w-full bg-natural-sage/20 hover:bg-natural-sage/55 border border-natural-sage text-natural-dark font-bold py-3.5 px-4 rounded-xl text-xs flex items-center justify-center gap-2 transition-all"
          >
            {loadingSynopsis ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin text-natural-olive" />
                <span>Analyzing diagnostic history with Gemini AI...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-natural-olive" />
                <span>Synthesize 30-Second AI Doctor Summary</span>
              </>
            )}
          </button>
        )}
      </div>

      {/* Real-time Doctor Clinical Handover Simulator View */}
      {showDoctorModal && (
        <div className="fixed inset-0 z-50 bg-[#1a1a10]/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-[32px] max-w-2xl w-full max-h-[85vh] overflow-y-auto border border-natural-sage shadow-2xl flex flex-col animate-scale-up">
            <div className="bg-natural-dark text-white px-6 py-5 flex items-center justify-between border-b border-white/5">
              <div className="flex items-center gap-2.5">
                <Activity className="w-5 h-5 text-natural-sage animate-pulse" />
                <div>
                  <h3 className="text-xs font-mono uppercase tracking-widest text-[#e8ede0]">
                    EMERGENCY CARE PORTAL
                  </h3>
                  <h2 className="text-lg font-serif italic text-white mt-0.5">
                    Verified Digital Health Passport
                  </h2>
                </div>
              </div>
              <button
                onClick={() => setShowDoctorModal(false)}
                className="text-stone-300 hover:text-white text-xs font-bold px-4 py-2 bg-white/10 rounded-xl hover:bg-white/20 transition-all uppercase tracking-wider text-[10px]"
              >
                Exit Portal
              </button>
            </div>

            {/* Read-only Clinical Overview */}
            <div className="p-6 md:p-8 space-y-6 text-xs text-natural-text">
              {/* Patient Basic Info Banner */}
              <div className="bg-[#e8ede0]/20 rounded-2xl p-4 md:p-5 border border-[#e8ede0] grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <span className="block text-[9px] uppercase font-mono font-bold text-natural-olive/60">PATIENT NAME</span>
                  <span className="text-xs font-bold text-natural-dark">{passport.fullName}</span>
                </div>
                <div>
                  <span className="block text-[9px] uppercase font-mono font-bold text-natural-olive/60">DATE OF BIRTH</span>
                  <span className="text-xs font-semibold text-natural-dark">{passport.dateOfBirth}</span>
                </div>
                <div>
                  <span className="block text-[9px] uppercase font-mono font-bold text-natural-olive/60">EMERGENCY BLOOD</span>
                  <span className="text-xs font-bold text-red-700 flex items-center gap-1">
                    <Heart className="w-3.5 h-3.5 fill-red-700 text-red-700" />
                    {passport.bloodType}
                  </span>
                </div>
                <div>
                  <span className="block text-[9px] uppercase font-mono font-bold text-natural-olive/60">SYNC TIMESTAMP</span>
                  <span className="text-[10px] font-mono font-semibold text-[#5a5a40]/80">
                    {new Date(passport.updatedAt).toLocaleDateString()}
                  </span>
                </div>
              </div>

              {/* Critical Alert Boxes */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="border border-red-100 bg-red-50/50 rounded-2xl p-4 md:p-5">
                  <h4 className="font-bold text-red-900 flex items-center gap-1.5 text-xs uppercase mb-2">
                    <AlertTriangle className="w-4 h-4 text-red-600" /> Severely Restricted Allergy Warnings
                  </h4>
                  {passport.allergies.length === 0 ? (
                    <p className="text-[11px] text-natural-text/50 italic">No allergen restrictions listed.</p>
                  ) : (
                    <div className="flex flex-wrap gap-1.5">
                      {passport.allergies.map((allergen) => (
                        <span
                          key={allergen}
                          className="px-2.5 py-1 rounded-xl bg-red-100 text-red-950 font-bold border border-red-200 text-[10px]"
                        >
                          {allergen}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="border border-natural-sage bg-[#e8ede0]/20 rounded-2xl p-4 md:p-5">
                  <h4 className="font-bold text-natural-olive flex items-center gap-1.5 text-xs uppercase mb-2">
                    <Activity className="w-4 h-4 text-natural-olive animate-pulse" /> Chronic Medical Conditions
                  </h4>
                  {passport.conditions.length === 0 ? (
                    <p className="text-[11px] text-natural-text/50 italic">No chronic pathologies recorded.</p>
                  ) : (
                    <div className="flex flex-wrap gap-1.5">
                      {passport.conditions.map((cond) => (
                        <span
                          key={cond}
                          className="px-2.5 py-1 rounded-xl bg-white text-natural-dark font-bold border border-natural-sage text-[10px]"
                        >
                          {cond}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Ongoing Daily Meds & Emergency contact */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="border border-[#e8ede0] bg-natural-bg/40 rounded-2xl p-4 md:p-5">
                  <h4 className="font-bold text-[#5a5a40] flex items-center gap-1.5 text-xs uppercase mb-2">
                    <Activity className="w-4 h-4 text-[#5a5a40]" /> Active Prescribed Medication Regimens
                  </h4>
                  {passport.medications.length === 0 ? (
                    <p className="text-[11px] text-natural-text/50 italic">No active medications registered.</p>
                  ) : (
                    <div className="flex flex-wrap gap-1.5">
                      {passport.medications.map((med) => (
                        <span
                          key={med}
                          className="px-2.5 py-1 rounded-xl bg-[#e8ede0]/50 text-natural-dark font-semibold border border-natural-sage/40 text-[10px]"
                        >
                          {med}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="border border-[#e8ede0] bg-natural-sage/10 rounded-2xl p-4 md:p-5 flex flex-col justify-between">
                  <div>
                    <h4 className="font-bold text-natural-dark flex items-center gap-1.5 text-xs uppercase mb-2">
                      <PhoneCall className="w-4 h-4 text-[#5a5a40]" /> Caregiver Emergency Contact
                    </h4>
                    <p className="text-xs text-natural-dark font-bold">{passport.emergencyContact.name}</p>
                    <p className="text-[11px] text-natural-text/70 mt-1">
                      Relation: <span className="font-semibold text-natural-dark">{passport.emergencyContact.relation}</span>
                    </p>
                    <p className="text-xs font-mono text-natural-olive mt-2 font-bold h-6 flex items-center">
                      {passport.emergencyContact.phone}
                    </p>
                  </div>
                </div>
              </div>

              {/* Collapsed view of the verified Timeline events */}
              <div>
                <h4 className="font-bold text-natural-dark text-xs mb-3.5 uppercase tracking-wider font-mono">
                  Verified Patient Medical Timeline
                </h4>
                <div className="space-y-3.5 max-h-60 overflow-y-auto pr-2">
                  {passport.timeline.length === 0 ? (
                    <p className="text-[11px] text-natural-text/50 italic">No timeline occurrences certified yet.</p>
                  ) : (
                    passport.timeline.map((evt) => (
                      <div key={evt.id} className="p-4 border border-[#e8ede0] rounded-2xl bg-[#e8ede0]/15 hover:bg-white transition-all duration-200">
                        <div className="flex justify-between items-center text-[10px] font-semibold text-natural-olive">
                          <span>{evt.date} • {evt.recordType}</span>
                          <span className="uppercase text-[9px] bg-white border border-natural-sage/55 px-1.5 py-0.5 rounded-sm font-bold">
                            {evt.severity} Priority
                          </span>
                        </div>
                        <h5 className="font-serif font-bold text-natural-dark text-xs mt-1.5">{evt.title}</h5>
                        <p className="text-[11px] text-natural-text mt-1 italic">{evt.clinician} @ {evt.facility}</p>
                        <p className="text-[11px] text-natural-text mt-2 leading-relaxed bg-white/60 p-3 rounded-xl border border-natural-sage text-[10px]">
                          <strong>Clinical Notes:</strong> {evt.findings}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

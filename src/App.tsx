/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import {
  Stethoscope,
  Heart,
  Share2,
  Lock,
  Compass,
  Sliders,
  Calendar,
  AlertTriangle,
  ChevronRight,
  Activity,
  FileText,
  UserCheck,
  Download,
  Copy,
  Check,
  QrCode,
  X,
  ExternalLink,
} from "lucide-react";
import { PassportData, TimelineEvent } from "./types";
import PassportForm from "./components/PassportForm";
import TimelineWidget from "./components/TimelineWidget";
import DocumentUploader from "./components/DocumentUploader";
import ClinicianOverview from "./components/ClinicianOverview";
import LandingLoginPage from "./components/LandingLoginPage";
import AIInsightWidget from "./components/AIInsightWidget";
import { generateMedicalPassportPDF } from "./utils/pdfGenerator";

export default function App() {
  const [passportId, setPassportId] = useState("demo");
  const [passport, setPassport] = useState<PassportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // QR Code & Link Sharing states
  const [showQRModal, setShowQRModal] = useState(false);
  const [qrCopied, setQrCopied] = useState(false);

  // Read-only share preview view
  const [isShareView, setIsShareView] = useState(false);

  // Authentication state
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Stellar Wallet & Node Balance details
  const [stellarWallet, setStellarWallet] = useState<{ publicKey: string; balance: string } | null>(null);
  const [loadingStellar, setLoadingStellar] = useState(false);

  // Patient Consent States
  const [activeShareTab, setActiveShareTab] = useState<"standard" | "stellar">("stellar");
  const [consentDoctorName, setConsentDoctorName] = useState("");
  const [consentReportId, setConsentReportId] = useState("");
  const [consentPermission, setConsentPermission] = useState<"Read Only" | "Full Access">("Read Only");
  const [consentExpiryHours, setConsentExpiryHours] = useState<number>(24);
  const [registeringConsent, setRegisteringConsent] = useState(false);
  const [generatedConsentQR, setGeneratedConsentQR] = useState<string | null>(null);
  const [generatedConsentId, setGeneratedConsentId] = useState<string | null>(null);

  // Doctor Gate verification states
  const [consentId, setConsentId] = useState<string | null>(null);
  const [verifyingConsent, setVerifyingConsent] = useState(false);
  const [consentVerifyData, setConsentVerifyData] = useState<any | null>(null);
  const [consentError, setConsentError] = useState<string | null>(null);

  const [recordShare, setRecordShare] = useState<any | null>(null);
  const [isEmergencyView, setIsEmergencyView] = useState(false);

  const fetchStellarWallet = async () => {
    setLoadingStellar(true);
    try {
      const response = await fetch("/api/stellar/wallet");
      if (response.ok) {
        const data = await response.json();
        setStellarWallet(data);
      }
    } catch {
      /* ignore */
    } finally {
      setLoadingStellar(false);
    }
  };

  useEffect(() => {
    fetchStellarWallet();
  }, []);

  const handleInitializeNewPassport = async (fullName: string) => {
    setLoading(true);
    try {
      const response = await fetch("/api/passport", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fullName }),
      });
      if (!response.ok) throw new Error("Could not initialize passport.");
      const newPassport: PassportData = await response.json();
      setPassport(newPassport);
      setPassportId(newPassport.id);
      setIsAuthenticated(true);
    } catch (err: any) {
      alert(err?.message || "Failed to create passport.");
    } finally {
      setLoading(false);
    }
  };

  const verifyConsentOnClient = async (cId: string) => {
    setVerifyingConsent(true);
    setConsentError(null);
    setConsentVerifyData(null);
    try {
      const res = await fetch(`/api/consent/verify/${cId}`);
      const data = await res.json();
      if (data.verification?.valid === false || data.valid === false) {
        setConsentError(data.verification?.reason || data.reason || "Consent invalid.");
      } else {
        setConsentVerifyData(data);
      }
    } catch {
      setConsentError("Could not verify consent.");
    } finally {
      setVerifyingConsent(false);
    }
  };

  const loadRecordShare = async (pId: string, eId: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/records/${pId}/share/${eId}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Share load failed");
      setRecordShare(data);
      setIsShareView(true);
    } catch (err: any) {
      setError(err?.message || "Share load failed");
      setRecordShare(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const handleHashRouter = () => {
      const hash = window.location.hash;
      setRecordShare(null);
      setIsEmergencyView(false);
      if (hash.startsWith("#verify-")) {
        const rest = hash.replace("#verify-", "");
        const idx = rest.indexOf("-");
        const pId = rest.slice(0, idx);
        const eId = rest.slice(idx + 1);
        if (pId && eId) {
          setPassportId(pId);
          setConsentId(null);
          void loadRecordShare(pId, eId);
        }
      } else if (hash.startsWith("#emergency-")) {
        const sharedId = hash.replace("#emergency-", "");
        setIsEmergencyView(true);
        setIsShareView(true);
        setPassportId(sharedId || "demo");
        setConsentId(null);
      } else if (hash.startsWith("#share-")) {
        const sharedId = hash.replace("#share-", "");
        setIsShareView(true);
        setPassportId(sharedId);
        setConsentId(null);
        setConsentVerifyData(null);
      } else if (hash.startsWith("#doctor-consent-")) {
        const cId = hash.replace("#doctor-consent-", "");
        setConsentId(cId);
        setIsShareView(true);
        verifyConsentOnClient(cId);
      } else {
        setIsShareView(false);
        setConsentId(null);
        setConsentVerifyData(null);
      }
    };

    handleHashRouter();
    window.addEventListener("hashchange", handleHashRouter);
    return () => window.removeEventListener("hashchange", handleHashRouter);
  }, []);

  // Sync / fetch passport from Express database service
  const fetchPassportData = async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/passport/${id}`);
      if (!response.ok) {
        throw new Error("Unable to fetch patient passport database data.");
      }
      const data: PassportData = await response.json();
      setPassport(data);
    } catch (err: any) {
      console.error(err);
      setError(err?.message || "Communication failure syncing database keys.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPassportData(passportId);
  }, [passportId]);

  // Synchronizes profile edits directly with Express persistent memory map
  const savePassportData = async (updated: PassportData) => {
    try {
      const response = await fetch(`/api/passport/${updated.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updated),
      });

      if (!response.ok) {
        throw new Error("Unable to synchronize medical dataset with cloud backend.");
      }

      const verifiedData = await response.json();
      setPassport(verifiedData);
    } catch (err) {
      console.error(err);
      alert("Failed to synchronize changes with Express health server.");
    }
  };

  const handleGenerateStellarConsent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passport) return;
    if (!consentDoctorName) {
      alert("Please enter a doctor's name.");
      return;
    }
    if (!consentReportId) {
      alert("Please select a medical report to share.");
      return;
    }

    setRegisteringConsent(true);
    try {
      const response = await fetch(`/api/records/${passport.id}/consent`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reportId: consentReportId,
          doctorName: consentDoctorName,
          permission: consentPermission,
          expiryHours: Number(consentExpiryHours),
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to register time-locked patient consent on Stellar.");
      }

      const data = await response.json();
      const consent = data.consent || data;
      if (consent?.id) {
        const consentUrl = `${window.location.origin}/#doctor-consent-${consent.id}`;
        setGeneratedConsentId(consent.id);
        setGeneratedConsentQR(consentUrl);
        fetchPassportData(passport.id);
      }
    } catch (err: any) {
      console.error(err);
      alert(err.message || "Consent registration failed.");
    } finally {
      setRegisteringConsent(false);
    }
  };

  const handleDeleteEvent = (id: string) => {
    if (!passport) return;

    const filteredTimeline = passport.timeline.filter((e) => e.id !== id);
    const updatedPassport: PassportData = {
      ...passport,
      timeline: filteredTimeline,
    };

    savePassportData(updatedPassport);
  };

  if (consentId) {
    return (
      <div className="min-h-screen bg-[#11110b] text-stone-100 font-sans p-4 md:p-8 flex flex-col items-center justify-center">
        <div className="max-w-3xl w-full bg-stone-900 border border-stone-800 rounded-[32px] overflow-hidden shadow-2xl flex flex-col animate-scale-up">
          {/* Portal Header */}
          <div className="bg-natural-dark text-white px-6 py-5 flex items-center justify-between border-b border-white/5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-950 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                <Lock className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <span className="block text-[10px] font-mono uppercase tracking-widest text-emerald-400 font-bold">STELLAR LEDGER CLINICAL PORTAL</span>
                <h1 className="text-xl font-serif text-white mt-0.5">MediSync Consent Decryption Gate</h1>
              </div>
            </div>
            <span className="text-[10px] font-mono bg-stone-800 px-3 py-1.5 rounded-lg border border-stone-700 font-bold text-stone-400">
              TESTNET V2
            </span>
          </div>

          {/* Inner View */}
          {verifyingConsent ? (
            <div className="p-12 text-center flex flex-col items-center justify-center space-y-4">
              <div className="w-10 h-10 rounded-full border-4 border-emerald-500 border-t-transparent animate-spin"></div>
              <p className="text-sm font-medium text-stone-300">Auditing Stellar Ledger & Decrypting Secured Package...</p>
              <p className="text-[11px] text-stone-500 font-mono">Querying Horizon Server endpoints</p>
            </div>
          ) : consentError ? (
            <div className="p-12 text-center flex flex-col items-center justify-center space-y-6">
              <div className="w-14 h-14 rounded-full bg-red-950/50 border border-red-500/30 flex items-center justify-center text-red-400">
                <AlertTriangle className="w-8 h-8" />
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-serif font-bold text-white">Access Decryption Denied</h3>
                <p className="text-xs text-stone-400 max-w-md mx-auto leading-relaxed">
                  {consentError}
                </p>
              </div>
              <button 
                onClick={() => { window.location.hash = ""; }}
                className="px-6 py-2.5 rounded-xl bg-stone-800 hover:bg-stone-700 border border-stone-700 text-stone-300 text-xs font-bold transition-all uppercase tracking-wider cursor-pointer"
              >
                Return to Gateway
              </button>
            </div>
          ) : consentVerifyData ? (
            <div className="p-6 md:p-8 space-y-6">
              {/* Consent Active Badge Panel */}
              <div className="bg-emerald-950/30 border border-emerald-500/20 rounded-2xl p-4 md:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <span className="flex items-center gap-1.5 text-xs text-emerald-400 font-bold">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                    Patient Consent Actively Verified
                  </span>
                  <p className="text-xs text-stone-300">
                    Authorized Practitioner: <strong className="text-white">{consentVerifyData.doctorName}</strong>
                  </p>
                  <p className="text-[11px] text-stone-400">
                    Decrypted Access Level: <strong className="text-white">{consentVerifyData.permission}</strong>
                  </p>
                </div>
                <div className="text-right">
                  <span className="block text-[9px] font-mono text-stone-500 uppercase font-bold">TIME-LOCK DURATION</span>
                  <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-950/50 border border-emerald-500/10 px-2.5 py-1 rounded-md inline-block mt-1">
                    Valid Until: {new Date(consentVerifyData.expiryTime * 1000).toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Patient Core Summary Box */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-stone-800/40 p-4 border border-stone-800 rounded-2xl text-xs">
                <div>
                  <span className="block text-[9px] text-stone-500 uppercase font-bold">Patient Name</span>
                  <span className="text-stone-200 font-bold">{consentVerifyData.patientName}</span>
                </div>
                <div>
                  <span className="block text-[9px] text-stone-500 uppercase font-bold">DOB</span>
                  <span className="text-stone-300 font-medium">{consentVerifyData.patientDob}</span>
                </div>
                <div>
                  <span className="block text-[9px] text-stone-500 uppercase font-bold">Blood Type</span>
                  <span className="text-red-400 font-bold">{consentVerifyData.patientBloodType}</span>
                </div>
                <div>
                  <span className="block text-[9px] text-stone-500 uppercase font-bold">Conditions</span>
                  <span className="text-stone-300 font-semibold">{consentVerifyData.conditions?.join(", ") || "None"}</span>
                </div>
              </div>

              {/* Shared Medical Report Details */}
              <div className="border border-stone-800 bg-stone-950 rounded-2xl p-5 md:p-6 space-y-4">
                <div className="flex justify-between items-start flex-wrap gap-3">
                  <div>
                    <span className="text-[10px] font-mono text-stone-400 uppercase font-bold tracking-wider animate-pulse">
                      {consentVerifyData.report.date} • {consentVerifyData.report.recordType}
                    </span>
                    <h3 className="text-base font-serif font-bold text-white mt-1">
                      {consentVerifyData.report.title}
                    </h3>
                    <p className="text-xs text-stone-400 mt-0.5">
                      {consentVerifyData.report.clinician} • <span className="italic">{consentVerifyData.report.facility}</span>
                    </p>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full bg-red-950/40 text-red-400 text-[10px] font-bold border border-red-500/20">
                    {consentVerifyData.report.severity} Priority
                  </span>
                </div>

                {/* Blockchain Integrity Verification Alert */}
                <div className={`p-4 rounded-xl border flex items-start gap-3 text-xs ${
                  consentVerifyData.report.isAuthentic
                    ? "bg-emerald-950/20 border-emerald-500/20 text-emerald-200"
                    : "bg-red-950/20 border-red-500/20 text-red-200"
                }`}>
                  <span className="text-base shrink-0 mt-0.5">{consentVerifyData.report.isAuthentic ? "✓" : "⚠"}</span>
                  <div className="flex-1">
                    <p className="font-bold">
                      {consentVerifyData.report.isAuthentic 
                        ? "Stellar Integrity Match: 100% Authentic" 
                        : "Security Alert: Tamper Check Failed!"}
                    </p>
                    <p className="text-[11px] opacity-85 mt-0.5 leading-relaxed">
                      {consentVerifyData.report.isAuthentic
                        ? `Cryptographic hash audit completed. This report's integrity is verified against the public Stellar ledger (Tx Hash: ${consentVerifyData.report.stellarTxId?.substring(0, 16)}...).`
                        : "Warning: The diagnostic content of this medical record does not match its notarized SHA-256 on-chain hash! Tampering detected."}
                    </p>
                  </div>
                </div>

                <div className="space-y-3.5 text-xs">
                  <div>
                    <h4 className="font-bold uppercase text-[9px] text-stone-500">Shared Diagnostic Findings</h4>
                    <p className="text-stone-300 leading-relaxed bg-stone-900/60 p-3 rounded-xl border border-stone-800/80 mt-1 font-sans">
                      {consentVerifyData.report.findings}
                    </p>
                  </div>

                  <div>
                    <h4 className="font-bold uppercase text-[9px] text-stone-500 font-sans">Authorized Remedial Care Plan</h4>
                    <p className="text-stone-300 leading-relaxed bg-stone-900/40 p-3 rounded-xl border border-stone-800/40 mt-1 font-sans">
                      {consentVerifyData.report.nextSteps}
                    </p>
                  </div>
                </div>
              </div>

              {/* Interactive Verification Actions */}
              <div className="flex justify-between items-center pt-2 text-[10px] text-stone-500 border-t border-stone-800/50">
                <p className="font-mono">LEDGER METADATA AUDIT TRACE ACTIVE</p>
                <button 
                  onClick={() => { window.location.hash = ""; }}
                  className="px-4 py-2 bg-stone-800 hover:bg-stone-700 text-stone-300 font-bold rounded-lg transition-all text-xs cursor-pointer"
                >
                  Exit Gate
                </button>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-natural-bg flex flex-col items-center justify-center font-sans">
        <div className="flex flex-col items-center gap-3 animate-pulse">
          <div className="w-16 h-16 bg-natural-sage rounded-full flex items-center justify-center border border-natural-olive/20 shadow-xs mb-2">
            <Stethoscope className="w-8 h-8 text-natural-olive animate-spin" />
          </div>
          <h1 className="text-xl font-serif text-natural-dark italic">Synchronizing Vault...</h1>
          <p className="text-xs text-natural-olive font-mono">Patient-controlled MediSync database</p>
        </div>
      </div>
    );
  }

  if (error || !passport) {
    return (
      <div className="min-h-screen bg-natural-bg flex flex-col items-center justify-center font-sans p-6 text-center">
        <div className="bg-white p-8 rounded-[32px] border border-natural-sage shadow-md max-w-md">
          <AlertTriangle className="w-12 h-12 text-red-700 mx-auto mb-3" />
          <h1 className="text-2xl font-serif text-natural-dark mb-2">Database Connection Alert</h1>
          <p className="text-xs text-natural-text mb-6 leading-relaxed">
            {error || "The secure health passport credentials could not be decrypted."}
          </p>
          <button
            onClick={() => fetchPassportData("demo")}
            className="w-full bg-natural-olive hover:bg-natural-olive/90 text-white rounded-2xl py-3 text-xs font-bold uppercase tracking-widest transition-colors shadow-xs"
          >
            Deploy Backup Demo Passport
          </button>
        </div>
      </div>
    );
  }

  if (isShareView && recordShare) {
    const authentic = Boolean(recordShare.verification?.verified);
    return (
      <div className="min-h-screen bg-natural-bg text-natural-text font-sans p-6 md:p-10">
        <div className="max-w-lg mx-auto bg-white rounded-[32px] border border-natural-sage p-6 space-y-4 shadow-sm">
          <p className="text-[10px] font-mono font-bold uppercase tracking-wider text-natural-olive">
            MediSync · Verified Medical Record
          </p>
          <h1 className="font-serif text-2xl text-natural-dark">{recordShare.event?.title}</h1>
          <p className="text-xs text-stone-500">{recordShare.event?.date}</p>
          <ul className="text-xs space-y-1">
            {(recordShare.event?.observations || []).map((o: any, i: number) => (
              <li key={i}>
                {o.name} {o.value} {o.unit}
              </li>
            ))}
          </ul>
          {!recordShare.event?.observations?.length && (
            <p className="text-xs text-stone-600">{recordShare.event?.findings}</p>
          )}
          <div
            className={`rounded-2xl p-4 text-xs ${
              authentic
                ? "bg-emerald-50 border border-emerald-100 text-emerald-950"
                : "bg-red-50 border border-red-100 text-red-950"
            }`}
          >
            <p className="font-bold text-sm">
              {authentic ? "Authentic Record" : "Verification Failed"}
            </p>
            <p className="mt-1">
              {authentic
                ? "Verified using Stellar Testnet. Medical values are not stored on-chain — only cryptographic proof."
                : recordShare.verification?.reason ||
                  "The record does not match its registered cryptographic proof."}
            </p>
            <p className="mt-2 font-mono text-[10px] break-all">
              Hash: {recordShare.hash}
            </p>
            {recordShare.contractId && (
              <p className="font-mono text-[10px]">Contract: {recordShare.contractId}</p>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (isShareView && isEmergencyView && passport) {
    return (
      <div className="min-h-screen bg-[#1a1a10] text-white flex items-center justify-center p-6">
        <div className="max-w-md w-full rounded-[32px] border border-white/10 p-6 space-y-4">
          <p className="text-[10px] font-mono uppercase tracking-wider text-rose-300">
            Emergency Health Passport
          </p>
          <h1 className="font-serif text-3xl">{passport.fullName}</h1>
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <p className="text-rose-300/70 text-[10px] uppercase">Blood Group</p>
              <p className="font-bold">{passport.bloodType}</p>
            </div>
            <div>
              <p className="text-rose-300/70 text-[10px] uppercase">Allergies</p>
              <p className="font-bold">{passport.allergies.join(", ") || "—"}</p>
            </div>
            <div>
              <p className="text-rose-300/70 text-[10px] uppercase">Conditions</p>
              <p className="font-bold">{passport.conditions.join(", ") || "—"}</p>
            </div>
            <div>
              <p className="text-rose-300/70 text-[10px] uppercase">Medications</p>
              <p className="font-bold">{passport.medications.slice(0, 4).join(", ") || "—"}</p>
            </div>
          </div>
          <div className="pt-3 border-t border-white/10 text-xs">
            <p className="text-rose-300/70 text-[10px] uppercase">Emergency Contact</p>
            <p className="font-bold">{passport.emergencyContact.name}</p>
            <p className="font-mono">{passport.emergencyContact.phone}</p>
          </div>
          <img
            alt="Emergency QR"
            className="mx-auto bg-white p-2 rounded-xl"
            src={`https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(
              `${window.location.origin}/#emergency-${passport.id}`
            )}`}
          />
        </div>
      </div>
    );
  }

  if (isShareView) {
    return (
      <div className="min-h-screen bg-natural-bg text-natural-text font-sans pb-16 flex flex-col">
        <header className="bg-natural-dark text-white px-6 py-5 sticky top-0 z-10 shadow-sm border-b border-white/5">
          <div className="max-w-5xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-natural-sage flex items-center justify-center border border-white/10">
                <Activity className="w-5 h-5 text-natural-olive animate-pulse" />
              </div>
              <div>
                <span className="block text-[9px] uppercase tracking-wider font-mono text-natural-sage font-bold">
                  CLINICIAN SECURED GATEWAY
                </span>
                <span className="text-lg font-serif italic text-white flex items-center gap-1.5">
                  MediSync <span className="font-sans text-xs font-semibold not-italic text-stone-400">Passport</span>
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs bg-white/5 px-3 py-1.5 rounded-full border border-white/10">
              <Lock className="w-3.5 h-3.5 text-natural-sage" />
              <span className="font-semibold text-[9px] uppercase tracking-widest text-stone-300 font-mono">
                Decrypted
              </span>
            </div>
          </div>
        </header>

        <main className="max-w-5xl mx-auto p-4 md:p-8 space-y-8 flex-1 w-full">
          {/* Top welcome warning */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between bg-natural-sage rounded-[24px] px-6 py-4 text-xs text-natural-olive border border-[#5a5a40]/10 gap-3">
            <div className="flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-natural-olive shrink-0" />
              <span>You are viewing authentic diagnostics and clinical logs authorized by <strong>{passport.fullName}</strong>.</span>
            </div>
            <button
              onClick={() => {
                window.location.hash = "";
              }}
              className="text-[10px] uppercase tracking-wider text-natural-dark font-bold hover:underline shrink-0"
            >
              ← Creator Hub
            </button>
          </div>

          {/* Quick Info Deck matching Tanya/Aarav structure */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white rounded-[24px] p-5 shadow-xs border border-natural-sage flex flex-col justify-between">
              <p className="text-[10px] uppercase font-bold text-natural-olive/60 tracking-wider">Blood Group Type</p>
              <p className="text-xl font-serif text-red-700 italic flex items-center gap-1.5 mt-2">
                <Heart className="w-5 h-5 fill-red-700 text-red-700" /> {passport.bloodType}
              </p>
            </div>
            <div className="bg-white rounded-[24px] p-5 shadow-xs border border-natural-sage col-span-1 md:col-span-2">
              <p className="text-[10px] uppercase font-bold text-natural-olive/60 tracking-wider">Major Pathologies & Allergies</p>
              <div className="flex flex-wrap gap-1.5 mt-2">
                {passport.allergies.map((a) => (
                  <span key={a} className="bg-red-50 text-red-900 text-[10px] font-bold px-2.5 py-0.5 rounded-lg border border-red-100">
                    {a}
                  </span>
                ))}
                {passport.conditions.map((c) => (
                  <span key={c} className="bg-natural-sage text-natural-text text-[10px] font-bold px-2.5 py-0.5 rounded-lg border border-natural-olive/10">
                    {c}
                  </span>
                ))}
                {passport.allergies.length === 0 && passport.conditions.length === 0 && (
                  <span className="text-[11px] text-natural-olive/50 italic">None listed.</span>
                )}
              </div>
            </div>
            <div className="bg-white rounded-[24px] p-5 shadow-xs border border-natural-sage flex flex-col justify-between">
              <p className="text-[10px] uppercase font-bold text-natural-olive/60 tracking-wider">Date of Birth</p>
              <p className="text-sm font-bold text-natural-dark mt-2">{passport.dateOfBirth}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-8 space-y-8">
              <AIInsightWidget passport={passport} />
              <TimelineWidget 
                events={passport.timeline}
                passportId={passport.id}
                onDeleteEvent={() => {}}
                onRefreshPassport={() => fetchPassportData(passport.id)}
              />
            </div>
            <div className="lg:col-span-4 space-y-6">
              <ClinicianOverview passport={passport} />
            </div>
          </div>
        </main>

        <footer className="max-w-5xl mx-auto w-full px-6 py-6 border-t border-natural-sage/30 flex justify-between items-center text-[10px] font-bold uppercase tracking-widest text-[#5a5a40]/50">
          <p>© 2026 MEDISYNC • SECURE ENCRYPTED HEALTH PASSPORT</p>
        </footer>
      </div>
    );
  }

  // Check if patient registry needs decryption authentication
  if (!isAuthenticated) {
    return (
      <LandingLoginPage
        onLoginSuccess={(id) => {
          setPassportId(id);
          setIsAuthenticated(true);
        }}
        onInitializeNewPassport={handleInitializeNewPassport}
        isLoggingIn={isLoggingIn}
      />
    );
  }

  // Patient Creator Dashboard View
  return (
    <div className="min-h-screen bg-natural-bg text-natural-text font-sans p-4 md:p-8 flex flex-col lg:flex-row min-h-0">
      
      {/* LEFT SIDEBAR NAVIGATION - Responsive */}
      <nav className="hidden lg:flex w-20 flex-col items-center py-8 bg-natural-sage rounded-[40px] mr-8 space-y-12 shrink-0 border border-natural-olive/15 shadow-xs">
        <div className="w-12 h-12 bg-natural-olive rounded-full flex items-center justify-center text-white font-serif italic text-2xl shadow-sm">
          M
        </div>
        <div className="flex flex-col space-y-8 items-center text-natural-olive/60">
          <div className="p-2.5 bg-white/40 rounded-2xl border border-white/60 text-natural-olive" title="Dashboard">
            <Activity className="w-5 h-5" />
          </div>
          <div className="p-2.5 rounded-2xl hover:bg-white/40 transition-all cursor-pointer text-natural-olive/70" title="Clinical Passport">
            <UserCheck className="w-5 h-5" />
          </div>
          <div className="p-2.5 rounded-2xl hover:bg-white/40 transition-all cursor-pointer text-natural-olive/70" title="AI Analyst">
            <FileText className="w-5 h-5" />
          </div>
          <button 
            onClick={() => setShowQRModal(true)}
            className="p-2.5 rounded-2xl hover:bg-white/40 transition-all cursor-pointer text-natural-olive/70 border-0 bg-transparent flex items-center justify-center" 
            title="QR Vault"
          >
            <Share2 className="w-5 h-5" />
          </button>
        </div>
        <div className="mt-auto">
          <div className="w-10 h-10 rounded-full bg-white border border-[#5a5a40] opacity-30 flex items-center justify-center font-mono text-[9px] text-natural-olive">
            P2
          </div>
        </div>
      </nav>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 flex flex-col space-y-8">
        
        {/* HEADER SECTION */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-end pb-5 border-b border-natural-olive/10 gap-4">
          <div>
            <p className="text-[10px] uppercase tracking-widest text-[#5a5a40] font-bold mb-1.5 font-mono">
              MediSync Personal Passport
            </p>
            <h1 className="text-3xl md:text-4xl font-serif text-[#1a1a10] tracking-tight">
              Welcome back, <span className="italic font-light">{passport.fullName.split(" ")[0]}</span>.
            </h1>
          </div>
          <div className="flex space-x-3.5 items-center">
            <button
              onClick={() => setShowQRModal(true)}
              className="px-4 py-3 rounded-2xl bg-natural-olive hover:bg-[#525239] text-white font-bold text-xs flex items-center gap-1.5 transition-all duration-200 border border-natural-olive shadow-2xs cursor-pointer active:scale-95 uppercase tracking-wider text-[10px]"
              title="Generate scannable QR Code and share link"
            >
              <QrCode className="w-4 h-4" />
              <span>Share QR Code</span>
            </button>

            <button
              onClick={() => passport && generateMedicalPassportPDF(passport)}
              className="px-4 py-3 rounded-2xl bg-[#e8ede0] hover:bg-[#d0dbbe]/60 text-natural-olive font-bold text-xs flex items-center gap-1.5 transition-all duration-200 border border-[#5a5a40]/25 shadow-2xs cursor-pointer active:scale-95 uppercase tracking-wider text-[10px]"
              title="Download Secure Offline PDF Passport Chronicle"
            >
              <FileText className="w-4 h-4 text-natural-olive" />
              <span className="hidden sm:inline">Export PDF</span>
              <Download className="w-3.5 h-3.5 text-natural-olive/80" />
            </button>

            <div className="text-right hidden md:block">
              <p className="text-[9px] uppercase font-bold text-[#5a5a40]/60 font-mono">Sync Identifier</p>
              <p className="text-xs text-[#5a5a40] font-medium flex items-center gap-1 justify-end">
                <span className="w-2 h-2 rounded-full bg-emerald-600 animate-ping inline-block"></span>
                Active • 2026-06-22 UTC
              </p>
            </div>
            <button
              onClick={() => setIsAuthenticated(false)}
              className="w-12 h-12 rounded-full bg-[#e8ede0] hover:bg-[#d0dbbe]/60 flex items-center justify-center border border-[#5a5a40]/20 shadow-xs text-natural-olive transition-transform active:scale-95 group cursor-pointer"
              title="Lock Patient Vault & Log Out"
            >
              <Lock className="w-5 h-5 group-hover:scale-110 transition-transform" />
            </button>
          </div>
        </header>

        {/* Content Grid: Left Form and Share, Right Uploader and Timeline */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 flex-1 min-h-0">
          
          {/* LEFT: Passport Form & Sharing */}
          <div className="xl:col-span-5 space-y-8">
            <PassportForm passport={passport} onSave={savePassportData} />

            {/* Stellar Blockchain Node Status Widget */}
            <div className="bg-white rounded-[32px] border border-natural-sage p-6 md:p-8 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-natural-sage pb-3">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 bg-emerald-600 rounded-full animate-ping shrink-0"></span>
                  <h3 className="text-sm font-serif font-bold text-natural-dark">
                    Stellar Ledger Node Live
                  </h3>
                </div>
                <span className="text-[10px] font-mono bg-natural-sage/30 px-2 py-0.5 rounded-sm text-natural-olive font-bold">
                  TESTNET
                </span>
              </div>

              {stellarWallet ? (
                <div className="space-y-3 text-xs">
                  <div>
                    <span className="block text-[9px] uppercase font-mono font-bold text-natural-olive/60">Node Account Public Key</span>
                    <div className="flex items-center justify-between mt-1 bg-natural-bg/40 border border-natural-sage/50 p-2 rounded-xl">
                      <span className="font-mono text-[10px] truncate max-w-[200px]" title={stellarWallet.publicKey}>
                        {stellarWallet.publicKey}
                      </span>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(stellarWallet.publicKey);
                          alert("Stellar Public Key copied to clipboard!");
                        }}
                        className="text-[10px] hover:underline font-bold text-natural-olive shrink-0 cursor-pointer"
                      >
                        Copy
                      </button>
                    </div>
                  </div>

                  <div className="flex justify-between items-center bg-[#e8ede0]/20 border border-[#e8ede0] p-3 rounded-xl">
                    <div>
                      <span className="block text-[9px] uppercase font-mono font-bold text-[#5a5a40]/70">Account Ledger Balance</span>
                      <span className="text-sm font-mono font-bold text-natural-dark mt-0.5 inline-block">
                        {parseFloat(stellarWallet.balance).toFixed(4)} XLM
                      </span>
                    </div>
                    <span className="text-[9px] text-[#5a5a40] font-bold tracking-wider font-mono">
                      ACTIVE NODE
                    </span>
                  </div>
                </div>
              ) : (
                <div className="py-2 text-center text-xs text-natural-text/60 italic flex items-center justify-center gap-1.5">
                  <div className="w-3.5 h-3.5 border border-natural-olive border-t-transparent animate-spin rounded-full"></div>
                  <span>Syncing with Horizon...</span>
                </div>
              )}
            </div>

            <ClinicianOverview passport={passport} />
          </div>

          {/* RIGHT: Document Uploader, AI Insights & Personal Timeline */}
          <div className="xl:col-span-7 space-y-8">
            <DocumentUploader
              passportId={passport.id}
              onPassportUpdated={(p) => setPassport(p)}
            />
            <AIInsightWidget passport={passport} />
            <TimelineWidget 
              events={passport.timeline} 
              passportId={passport.id}
              onDeleteEvent={handleDeleteEvent} 
              onRefreshPassport={() => fetchPassportData(passport.id)}
            />
          </div>

        </div>

        {/* Footer Branding */}
        <footer className="flex flex-col sm:flex-row justify-between items-center text-[10px] font-bold uppercase tracking-[0.2em] text-[#5a5a40]/40 pt-6 border-t border-natural-olive/10 gap-3">
          <p>© 2026 MEDISYNC • SECURE ENCRYPTED HEALTH PASSPORT SYSTEM</p>
          <div className="flex space-x-6">
            <span className="cursor-pointer hover:text-natural-olive transition-colors">Credential Keys</span>
            <span className="cursor-pointer hover:text-natural-olive transition-colors font-mono">V2.1-SECURE</span>
          </div>
        </footer>
      </main>

      {/* GENERATE SHAREABLE QR CODE MODAL */}
      {showQRModal && (
        <div 
          className="fixed inset-0 z-50 bg-[#1a1a10]/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
          onClick={() => {
            setShowQRModal(false);
            setGeneratedConsentQR(null);
            setGeneratedConsentId(null);
          }}
        >
          <div 
            className="bg-white rounded-[32px] max-w-xl w-full border border-natural-sage shadow-2xl flex flex-col overflow-hidden animate-scale-up"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="bg-natural-dark text-white px-6 py-5 flex items-center justify-between border-b border-white/5">
              <div className="flex items-center gap-2.5">
                <QrCode className="w-5 h-5 text-natural-sage animate-pulse" />
                <div>
                  <h3 className="text-xs font-mono uppercase tracking-widest text-[#e8ede0]">
                    CLINICAL SECURE SHARING
                  </h3>
                  <h2 className="text-lg font-serif italic text-white mt-0.5">
                    Share Patient Credentials
                  </h2>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowQRModal(false);
                  setGeneratedConsentQR(null);
                  setGeneratedConsentId(null);
                }}
                className="p-2 rounded-full hover:bg-white/10 text-stone-300 hover:text-white transition-colors"
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* TAB SELECTOR */}
            <div className="grid grid-cols-2 border-b border-natural-sage bg-natural-bg/40 text-xs">
              <button
                onClick={() => setActiveShareTab("stellar")}
                className={`py-3 text-center font-bold uppercase tracking-wider transition-all border-b-2 ${
                  activeShareTab === "stellar"
                    ? "border-[#5a5a40] text-natural-dark bg-white"
                    : "border-transparent text-natural-olive/60 hover:text-natural-olive hover:bg-natural-sage/10"
                }`}
              >
                1. Verified Record / Consent
              </button>
              <button
                onClick={() => setActiveShareTab("standard")}
                className={`py-3 text-center font-bold uppercase tracking-wider transition-all border-b-2 ${
                  activeShareTab === "standard"
                    ? "border-natural-olive text-natural-dark bg-white"
                    : "border-transparent text-natural-olive/60 hover:text-natural-olive hover:bg-natural-sage/10"
                }`}
              >
                2. Full Passport Link (legacy)
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 md:p-8 flex flex-col space-y-6">
              {activeShareTab === "standard" ? (
                <div className="flex flex-col items-center text-center space-y-5">
                  <p className="text-xs text-natural-text leading-relaxed max-w-sm">
                    Legacy full-passport link (not ledger-verified). Prefer Verify on Stellar on a timeline record, then Share Verified Record.
                  </p>

                  {/* QR Code Canvas Frame */}
                  <div className="bg-[#e8ede0]/20 p-5 rounded-[24px] border border-[#e8ede0] flex flex-col items-center justify-center space-y-3 shadow-xs w-full max-w-xs">
                    <div className="bg-white p-4 rounded-2xl border border-natural-sage shadow-xs hover:scale-102 transition-transform duration-300">
                      <img 
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(
                          `${window.location.origin}/#share-${passport.id}`
                        )}&color=5a5a40`} 
                        alt="Sovereign QR Link" 
                        className="w-40 h-40"
                      />
                    </div>
                    <span className="text-[10px] font-bold text-natural-olive tracking-widest uppercase flex items-center gap-1 justify-center">
                      <span className="w-2.5 h-2.5 bg-emerald-600 rounded-full animate-ping inline-block" />
                      FULL PASSPORT PREVIEW
                    </span>
                  </div>

                  {/* Link Input & Copy */}
                  <div className="w-full space-y-2">
                    <label className="block text-[10px] font-bold text-natural-olive uppercase tracking-wide text-left">
                      Direct Shareable Passport URL
                    </label>
                    <div className="flex gap-2 w-full">
                      <input
                        type="text"
                        readOnly
                        value={`${window.location.origin}/#share-${passport.id}`}
                        className="flex-1 text-[11px] font-mono p-3 rounded-xl border border-natural-sage bg-natural-bg/50 text-natural-dark focus:outline-none"
                      />
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(`${window.location.origin}/#share-${passport.id}`);
                          setQrCopied(true);
                          setTimeout(() => setQrCopied(false), 2000);
                        }}
                        className="bg-natural-olive hover:bg-[#525239] text-white px-4 rounded-xl flex items-center justify-center gap-1.5 transition-colors shadow-xs text-xs font-semibold cursor-pointer"
                        title="Copy to clipboard"
                      >
                        {qrCopied ? (
                          <>
                            <Check className="w-4 h-4 text-natural-sage" />
                            <span>Copied!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-4 h-4" />
                            <span>Copy</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Quick Action Utilities */}
                  <div className="grid grid-cols-2 gap-3 w-full pt-2">
                    <a
                      href={`https://api.qrserver.com/v1/create-qr-code/?size=500x500&data=${encodeURIComponent(
                        `${window.location.origin}/#share-${passport.id}`
                      )}&color=5a5a40`}
                      target="_blank"
                      rel="noreferrer"
                      download="medisync_qr_code.png"
                      className="flex items-center justify-center gap-1.5 py-2.5 px-4 border border-natural-olive rounded-xl hover:bg-natural-sage/20 text-natural-olive text-[11px] font-bold uppercase tracking-wider transition-all active:scale-95"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download QR</span>
                    </a>

                    <a
                      href={`${window.location.origin}/#share-${passport.id}`}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center justify-center gap-1.5 py-2.5 px-4 bg-natural-sage/20 hover:bg-natural-sage/40 rounded-xl text-natural-olive text-[11px] font-bold uppercase tracking-wider transition-all active:scale-95 border border-natural-sage/30"
                    >
                      <span>Test Preview</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>
              ) : (
                <div className="space-y-5">
                  {!generatedConsentQR ? (
                    <form onSubmit={handleGenerateStellarConsent} className="space-y-4">
                      <p className="text-xs text-natural-text leading-relaxed">
                        Authorize time-locked, cryptographically verified access to a <strong>specific medical report</strong> on the Stellar Ledger.
                      </p>

                      <div className="space-y-1.5">
                        <label className="block text-[10px] font-mono uppercase font-bold text-natural-olive">
                          Doctor / Practitioner Name
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Dr. Jane Foster"
                          value={consentDoctorName}
                          onChange={(e) => setConsentDoctorName(e.target.value)}
                          className="w-full text-xs p-3 rounded-xl border border-natural-sage bg-natural-bg focus:outline-none focus:border-natural-olive text-natural-dark animate-none"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="block text-[10px] font-mono uppercase font-bold text-natural-olive">
                            Time-Lock Duration
                          </label>
                          <select
                            value={consentExpiryHours}
                            onChange={(e) => setConsentExpiryHours(Number(e.target.value))}
                            className="w-full text-xs p-3 rounded-xl border border-natural-sage bg-white focus:outline-none focus:border-natural-olive text-natural-dark"
                          >
                            <option value={1}>1 Hour Access</option>
                            <option value={6}>6 Hours Access</option>
                            <option value={12}>12 Hours Access</option>
                            <option value={24}>24 Hours Access</option>
                            <option value={72}>72 Hours Access</option>
                          </select>
                        </div>

                        <div className="space-y-1.5">
                          <label className="block text-[10px] font-mono uppercase font-bold text-natural-olive">
                            Permission Scope
                          </label>
                          <select
                            value={consentPermission}
                            onChange={(e) => setConsentPermission(e.target.value as any)}
                            className="w-full text-xs p-3 rounded-xl border border-natural-sage bg-white focus:outline-none focus:border-natural-olive text-natural-dark"
                          >
                            <option value="Read Only">Read Only Decrypt</option>
                            <option value="Full Access">Read & Verify Signatures</option>
                          </select>
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <label className="block text-[10px] font-mono uppercase font-bold text-natural-olive">
                          Select Diagnostic Report
                        </label>
                        <select
                          required
                          value={consentReportId}
                          onChange={(e) => setConsentReportId(e.target.value)}
                          className="w-full text-xs p-3 rounded-xl border border-natural-sage bg-white focus:outline-none focus:border-natural-olive text-natural-dark"
                        >
                          <option value="">-- Choose verified report --</option>
                          {passport.timeline
                            .filter((event) => event.stellarHash)
                            .map((event) => (
                              <option key={event.id} value={event.id}>
                                {event.date} - {event.title} (Verified)
                              </option>
                            ))}
                          {passport.timeline.filter((e) => e.stellarHash).length === 0 && (
                            <option disabled value="">
                              ⚠️ No reports have been notarized on Stellar yet!
                            </option>
                          )}
                        </select>
                        <p className="text-[10px] text-natural-olive/60">
                          Note: You must first notarize a clinical event hash to Stellar before creating custom time-locked sharing consents.
                        </p>
                      </div>

                      <button
                        type="submit"
                        disabled={registeringConsent}
                        className="w-full bg-natural-dark hover:bg-stone-900 text-white rounded-xl py-3.5 text-xs font-mono uppercase tracking-widest font-bold transition-all flex items-center justify-center gap-2 shadow-sm disabled:opacity-50 cursor-pointer"
                      >
                        {registeringConsent ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            <span>Signing Stellar Transaction...</span>
                          </>
                        ) : (
                          <>
                            <Lock className="w-4 h-4 text-natural-sage" />
                            <span>Authorize on Stellar blockchain</span>
                          </>
                        )}
                      </button>
                    </form>
                  ) : (
                    <div className="flex flex-col items-center text-center space-y-5 animate-scale-up">
                      {/* Success Badge */}
                      <div className="bg-emerald-50 text-emerald-900 text-[10px] font-bold px-3 py-1.5 rounded-xl border border-emerald-200 flex items-center gap-1.5">
                        <span className="w-2 h-2 bg-emerald-600 rounded-full animate-ping"></span>
                        Decryption Consent Actively Registered on Stellar!
                      </div>

                      <div className="bg-emerald-50/20 p-5 rounded-[24px] border border-emerald-200 flex flex-col items-center justify-center space-y-3 shadow-xs w-full max-w-xs">
                        <div className="bg-white p-4 rounded-2xl border border-emerald-100 shadow-sm hover:scale-102 transition-transform duration-300">
                          <img 
                            src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(
                              generatedConsentQR
                            )}&color=064e3b`} 
                            alt="Stellar Consent QR" 
                            className="w-40 h-40"
                          />
                        </div>
                        <span className="text-[9px] font-mono font-bold text-emerald-800 tracking-wider uppercase">
                          TIME-LOCKED CONSENT SCANNER
                        </span>
                      </div>

                      <div className="w-full space-y-1.5">
                        <label className="block text-[10px] font-bold text-emerald-800 uppercase tracking-wide text-left">
                          Stellar Doctor Consent Link
                        </label>
                        <div className="flex gap-2 w-full">
                          <input
                            type="text"
                            readOnly
                            value={generatedConsentQR}
                            className="flex-1 text-[11px] font-mono p-3 rounded-xl border border-emerald-200 bg-emerald-50/10 text-emerald-900 focus:outline-none"
                          />
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(generatedConsentQR);
                              setQrCopied(true);
                              setTimeout(() => setQrCopied(false), 2000);
                            }}
                            className="bg-emerald-800 hover:bg-emerald-950 text-white px-4 rounded-xl flex items-center justify-center gap-1.5 transition-colors shadow-xs text-xs font-semibold cursor-pointer"
                          >
                            {qrCopied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                            <span>{qrCopied ? "Copied!" : "Copy"}</span>
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3 w-full pt-1">
                        <a
                          href={generatedConsentQR}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center justify-center gap-1.5 py-2.5 px-4 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl text-[10px] font-mono font-bold uppercase tracking-wider transition-all active:scale-95 border border-emerald-900/10"
                        >
                          <span>Test Doctor Link</span>
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                        <button
                          onClick={() => {
                            setGeneratedConsentQR(null);
                            setGeneratedConsentId(null);
                          }}
                          className="flex items-center justify-center gap-1.5 py-2.5 px-4 border border-natural-olive rounded-xl hover:bg-natural-sage/20 text-natural-olive text-[10px] font-bold uppercase tracking-wider transition-all active:scale-95 cursor-pointer"
                        >
                          Create New
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Modal Footer / Disclaimer */}
            <div className="bg-natural-bg/50 px-6 py-4 border-t border-natural-sage/30 flex justify-center text-[9px] text-[#5a5a40]/60 text-center font-medium leading-relaxed">
              {activeShareTab === "standard" 
                ? "Security Notice: This link gives temporary decrypted client-side access to the clinical passport. You can revoke permission anytime by cycling your sync key."
                : "Ledger Notice: Consent metadata, doctor identity, SHA-256 report hash, and permission expiration timestamps are registered permanently on the Stellar consensus blockchain."
              }
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

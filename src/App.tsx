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
  Upload,
  MessageSquare,
  Sparkles,
  Shield,
  Clock,
  User,
  FileDigit,
  Brain,
  Link2,
  Server,
  Globe,
  Search,
  Sun,
  Moon,
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

  // Theme state
  const [theme, setTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [theme]);

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
        console.log("Share view requested for passport ID:", sharedId);
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
      console.log("Fetching passport data for ID:", id);
      const response = await fetch(`/api/passport/${id}`);
      if (!response.ok) {
        throw new Error("Unable to fetch patient passport database data.");
      }
      const data: PassportData = await response.json();
      console.log("Passport data fetched successfully:", data);
      setPassport(data);
    } catch (err: any) {
      console.error("Error fetching passport:", err);
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
      const response = await fetch("/api/consent/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          passportId: passport.id,
          doctorName: consentDoctorName,
          reportId: consentReportId,
          permission: consentPermission,
          expiryHours: consentExpiryHours,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to register consent");
      }

      const data = await response.json();
      setGeneratedConsentId(data.consentId);
      setGeneratedConsentQR(data.qrCode);
    } catch (error: any) {
      alert(error.message || "Failed to register consent on Stellar");
    } finally {
      setRegisteringConsent(false);
    }
  };

  const handleDeleteEvent = (eventId: string) => {
    if (!passport) return;
    const updated = {
      ...passport,
      timeline: passport.timeline.filter((e) => e.id !== eventId),
      updatedAt: new Date().toISOString(),
    };
    setPassport(updated);
    savePassportData(updated);
  };

  // Share view routes
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
      <div className="min-h-screen bg-gradient-to-br from-red-950 via-rose-900 to-red-800 text-white flex items-center justify-center p-6">
        <div className="max-w-md w-full rounded-[32px] border-2 border-red-400/30 bg-black/20 backdrop-blur-sm p-8 space-y-6 shadow-2xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-red-500 rounded-full animate-ping"></div>
              <p className="text-[10px] font-mono uppercase tracking-wider text-red-300 font-bold">
                Emergency Health Passport
              </p>
            </div>
            <button 
              onClick={() => { window.location.hash = ""; setIsEmergencyView(false); setIsShareView(false); }}
              className="text-red-300 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          
          <div className="text-center">
            <h1 className="font-serif text-4xl font-bold mb-2">{passport.fullName}</h1>
            <p className="text-red-300 text-xs">Critical Medical Information</p>
          </div>
          
          <div className="grid grid-cols-2 gap-4 text-xs">
            <div className="bg-red-500/20 border border-red-400/30 rounded-2xl p-4">
              <p className="text-red-300/70 text-[10px] uppercase font-bold mb-1">Blood Group</p>
              <p className="font-bold text-2xl">{passport.bloodType}</p>
            </div>
            <div className="bg-amber-500/20 border border-amber-400/30 rounded-2xl p-4">
              <p className="text-amber-300/70 text-[10px] uppercase font-bold mb-1">Allergies</p>
              <p className="font-bold text-sm">{passport.allergies.join(", ") || "None"}</p>
            </div>
            <div className="bg-orange-500/20 border border-orange-400/30 rounded-2xl p-4">
              <p className="text-orange-300/70 text-[10px] uppercase font-bold mb-1">Conditions</p>
              <p className="font-bold text-sm">{passport.conditions.join(", ") || "None"}</p>
            </div>
            <div className="bg-blue-500/20 border border-blue-400/30 rounded-2xl p-4">
              <p className="text-blue-300/70 text-[10px] uppercase font-bold mb-1">Medications</p>
              <p className="font-bold text-sm">{passport.medications.slice(0, 3).join(", ") || "None"}</p>
            </div>
          </div>
          
          <div className="bg-white/10 border border-white/20 rounded-2xl p-4 text-xs">
            <p className="text-red-300/70 text-[10px] uppercase font-bold mb-2">Emergency Contact</p>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-bold text-lg">{passport.emergencyContact.name}</p>
                <p className="font-mono text-red-200">{passport.emergencyContact.phone}</p>
              </div>
              <a 
                href={`tel:${passport.emergencyContact.phone}`}
                className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-xl font-bold transition-colors"
              >
                Call
              </a>
            </div>
          </div>
          
          <div className="flex flex-col items-center space-y-3">
            <div className="bg-white p-4 rounded-2xl">
              <img
                alt="Emergency QR"
                className="w-40 h-40"
                src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(
                  `${window.location.origin}/#emergency-${passportId}`
                )}`}
              />
            </div>
            <p className="text-[10px] text-red-300/60 text-center">
              Scan for instant access to critical medical information
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (isShareView) {
    if (loading) {
      return (
        <div className="min-h-screen bg-natural-bg flex items-center justify-center">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-natural-olive border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-natural-text text-sm">Loading medical passport...</p>
          </div>
        </div>
      );
    }

    if (!passport) {
      return (
        <div className="min-h-screen bg-natural-bg flex items-center justify-center">
          <div className="text-center max-w-md p-6">
            <AlertTriangle className="w-12 h-12 text-red-600 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-natural-dark mb-2">Passport Not Found</h2>
            <p className="text-natural-text/70 text-sm mb-4">
              The medical passport you're looking for doesn't exist or has been removed.
            </p>
            <button
              onClick={() => {
                window.location.hash = "";
                setIsShareView(false);
              }}
              className="bg-natural-olive text-white px-6 py-2 rounded-xl text-sm font-bold"
            >
              Return to Home
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-natural-bg text-natural-text font-sans pb-16 flex flex-col">
        <header className="bg-natural-dark text-white px-6 py-5 sticky top-0 z-10 shadow-sm border-b border-white/5">
          <div className="max-w-5xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-natural-sage flex items-center justify-center border border-white/10">
                <Stethoscope className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[10px] font-mono uppercase tracking-wider text-natural-sage">
                  MediSync • Read-Only Mode
                </p>
                <h1 className="font-serif text-lg">{passport.fullName}</h1>
              </div>
            </div>
            <button
              onClick={() => {
                window.location.hash = "";
                setIsShareView(false);
              }}
              className="text-xs bg-white/10 hover:bg-white/20 px-4 py-2 rounded-xl border border-white/10 transition-colors"
            >
              Close
            </button>
          </div>
        </header>

        <main className="flex-1 max-w-5xl mx-auto w-full px-6 py-8 space-y-8">
          <div className="bg-white rounded-[32px] border border-natural-sage p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <AlertTriangle className="w-5 h-5 text-amber-600" />
              <h2 className="text-sm font-bold text-natural-dark">Critical Information</h2>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
              <div className="bg-red-50 border border-red-100 rounded-xl p-3">
                <p className="text-[10px] uppercase font-bold text-red-900">Blood Type</p>
                <p className="font-bold text-red-950 mt-1">{passport.bloodType}</p>
              </div>
              <div className="bg-red-50 border border-red-100 rounded-xl p-3">
                <p className="text-[10px] uppercase font-bold text-red-900">Allergies</p>
                <p className="font-bold text-red-950 mt-1 truncate">{passport.allergies.join(", ") || "None"}</p>
              </div>
              <div className="bg-amber-50 border border-amber-100 rounded-xl p-3">
                <p className="text-[10px] uppercase font-bold text-amber-900">Conditions</p>
                <p className="font-bold text-amber-950 mt-1 truncate">{passport.conditions.join(", ") || "None"}</p>
              </div>
              <div className="bg-natural-sage/30 border border-natural-sage rounded-xl p-3">
                <p className="text-[10px] uppercase font-bold text-natural-olive">Medications</p>
                <p className="font-bold text-natural-dark mt-1 truncate">{passport.medications.slice(0, 2).join(", ") || "None"}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-[32px] border border-natural-sage p-6 shadow-sm">
            <h2 className="text-sm font-bold text-natural-dark mb-4">Medical Timeline</h2>
            <TimelineWidget
              events={passport.timeline || []}
              passportId={passportId}
              onDeleteEvent={() => {}}
              onRefreshPassport={() => fetchPassportData(passportId)}
            />
          </div>
        </main>
      </div>
    );
  }

  // Check if patient registry needs decryption authentication (only if not in share view)
  if (!isAuthenticated && !isShareView) {
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

  // Patient Creator Dashboard View - Restructured according to images
  return (
    <div className="min-h-screen bg-natural-bg font-sans flex text-natural-text">
      
      {/* LEFT SIDEBAR */}
      <aside className="w-[72px] bg-natural-sage border-r border-natural-sage flex flex-col items-center py-6 gap-6 fixed h-full z-20">
        <div className="w-10 h-10 bg-natural-olive rounded-full flex items-center justify-center text-white font-serif italic font-bold text-xl mb-4 shadow-sm">
          M
        </div>
        <button className="p-2.5 bg-card-bg rounded-xl shadow-sm text-natural-olive"><Activity className="w-5 h-5" /></button>
        <button className="p-2.5 text-natural-olive/60 hover:text-natural-olive hover:bg-natural-bg/50 rounded-xl transition-all"><User className="w-5 h-5" /></button>
        <button className="p-2.5 text-natural-olive/60 hover:text-natural-olive hover:bg-natural-bg/50 rounded-xl transition-all"><FileText className="w-5 h-5" /></button>
        <button className="p-2.5 text-natural-olive/60 hover:text-natural-olive hover:bg-natural-bg/50 rounded-xl transition-all"><Share2 className="w-5 h-5" /></button>
        
        <div className="mt-auto pb-4">
          <button 
            onClick={() => setTheme(t => t === 'light' ? 'dark' : 'light')} 
            className="p-2.5 text-natural-olive/60 hover:text-natural-olive hover:bg-natural-bg/50 rounded-xl transition-all"
          >
            {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <div className="flex-1 ml-[72px]">
        {/* HEADER */}
        <header className="px-8 pt-10 pb-6 flex justify-between items-end">
          <div>
            <p className="text-[10px] tracking-[0.2em] font-mono text-natural-olive uppercase mb-2 font-bold">Medisync • Personal Passport</p>
            <h1 className="text-4xl font-serif text-natural-dark tracking-tight">Welcome back, {passport?.fullName?.split(' ')[0] || 'Patient'}.</h1>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => setShowQRModal(true)} className="bg-natural-olive text-natural-bg px-5 py-2.5 rounded-full text-xs font-bold flex items-center gap-2 hover:bg-natural-text transition-colors shadow-sm">
              <QrCode className="w-4 h-4" /> SHARE QR CODE
            </button>
            <button onClick={() => passport && (window.location.hash = `emergency-${passport.id}`)} className="bg-red-600 text-white px-5 py-2.5 rounded-full text-xs font-bold flex items-center gap-2 hover:bg-red-700 transition-colors shadow-sm animate-pulse">
              <AlertTriangle className="w-4 h-4" /> EMERGENCY QR
            </button>
            <button onClick={() => passport && generateMedicalPassportPDF(passport)} className="bg-card-bg border border-natural-sage text-natural-text px-5 py-2.5 rounded-full text-xs font-bold flex items-center gap-2 transition-colors shadow-sm">
              <Download className="w-4 h-4" /> EXPORT PDF
            </button>
            <div className="text-right ml-4 mr-2 hidden lg:block">
              <p className="text-[9px] text-natural-olive/60 font-bold uppercase tracking-widest">Sync Identifier</p>
              <p className="text-xs font-mono text-natural-text font-medium">Active • {new Date().toISOString().split('T')[0]} UTC</p>
            </div>
            <button onClick={() => { setIsAuthenticated(false); setPassportId("demo"); }} className="p-2.5 bg-card-bg border border-natural-sage rounded-full text-natural-text shadow-sm transition-colors">
              <Lock className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* GRID LAYOUT */}
        <div className="px-8 pb-10">
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
             
             {/* Left Column (5 spans) */}
             <div className="xl:col-span-5 space-y-6">
                 {/* Verified Medical Identification */}
                 <div className="bg-card-bg rounded-3xl shadow-sm border border-natural-sage overflow-hidden">
                    {passport && <PassportForm passport={passport} onSave={(updated) => savePassportData(updated)} />}
                 </div>

                 {/* Stellar Ledger Node Live */}
                 <div className="bg-card-bg rounded-3xl shadow-sm border border-natural-sage p-6">
                    <div className="flex items-center justify-between mb-5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-natural-bg flex items-center justify-center border border-natural-sage">
                          <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse"></span>
                        </div>
                        <h3 className="text-base font-serif font-bold text-natural-dark">Stellar Ledger Node Live</h3>
                      </div>
                      <span className="text-[9px] font-mono tracking-widest text-[#aed1a0] uppercase font-bold">
                        TESTNET
                      </span>
                    </div>
                    {stellarWallet ? (
                      <div className="space-y-3">
                        <div className="bg-natural-bg border border-natural-sage p-4 rounded-2xl">
                          <p className="text-[9px] uppercase tracking-widest font-bold text-natural-olive/60 mb-2">Node Account Public Key</p>
                          <div className="flex items-center justify-between">
                            <p className="font-mono text-xs text-natural-dark truncate max-w-[200px]">{stellarWallet.publicKey}</p>
                            <button className="text-[10px] font-bold text-natural-dark">Copy</button>
                          </div>
                        </div>
                        <div className="bg-natural-bg border border-natural-sage p-4 rounded-2xl flex items-center justify-between">
                          <div>
                            <p className="text-[9px] uppercase tracking-widest font-bold text-natural-olive/60 mb-1">Account Ledger Balance</p>
                            <p className="font-mono text-lg text-natural-dark">{parseFloat(stellarWallet.balance).toFixed(4)} XLM</p>
                          </div>
                          <span className="text-[9px] font-bold text-natural-olive uppercase tracking-widest">Active Node</span>
                        </div>
                      </div>
                    ) : (
                      <div className="py-6 text-center text-xs text-natural-olive/60 italic font-serif">
                        Syncing with Horizon Network...
                      </div>
                    )}
                 </div>

                 {/* Instant Share Passport Setup */}
                 <div className="bg-card-bg rounded-3xl shadow-sm border border-natural-sage overflow-hidden">
                    {passport && <ClinicianOverview passport={passport} />}
                 </div>
             </div>

             {/* Right Column (7 spans) */}
             <div className="xl:col-span-7 space-y-6">
                 {/* Parse Medical Records with AI */}
                 <div className="bg-card-bg rounded-3xl shadow-sm border border-natural-sage p-6">
                    <div className="flex items-center gap-3 mb-1">
                      <Sparkles className="w-5 h-5 text-natural-olive" />
                      <h3 className="text-xl font-serif font-bold text-natural-dark">Parse Medical Records with AI</h3>
                    </div>
                    <p className="text-xs text-natural-olive/70 mb-6">Upload hospital reports, prescriptions, or scrawls to organize your timeline.</p>
                    
                    {passport && <DocumentUploader 
                      passportId={passport.id}
                      onPassportUpdated={(updatedPassport) => {
                        setPassport(updatedPassport);
                        savePassportData(updatedPassport);
                      }}
                    />}
                 </div>

                 {/* Multi-Agent Health Orchestrator */}
                 <div className="bg-natural-dark text-natural-bg rounded-3xl shadow-sm overflow-hidden border border-natural-sage">
                    {passport && <AIInsightWidget passport={passport} />}
                 </div>

                 {/* Your Clinical Timeline Passport */}
                 <div className="bg-card-bg rounded-3xl shadow-sm border border-natural-sage p-6">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <h3 className="text-xl font-serif font-bold text-natural-dark">Your Clinical Timeline Passport</h3>
                        <p className="text-xs text-natural-olive/70 mt-1">Chronological log of verified diagnostic consultations, prescriptions, and health events.</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <Search className="w-4 h-4 text-natural-olive absolute left-3 top-1/2 -translate-y-1/2" />
                          <input type="text" placeholder="Search symptoms, doctors, prescriptions..." className="pl-9 pr-4 py-2 bg-natural-bg border border-natural-sage rounded-xl text-xs w-64 focus:outline-none focus:border-natural-olive/50 text-natural-text" />
                        </div>
                        <button className="flex items-center gap-2 px-4 py-2 bg-card-bg border border-natural-sage rounded-xl text-xs font-bold text-natural-dark">
                          <Sliders className="w-3 h-3" /> Filters
                        </button>
                      </div>
                    </div>
                    
                    {/* Filter Pills */}
                    <div className="flex items-center gap-2 mb-6 mt-4">
                      {['All', 'Consultation', 'Laboratory', 'Scan/Imaging', 'Prescription', 'Surgery', 'Vaccination'].map((f, i) => (
                        <button key={f} className={`px-4 py-1.5 rounded-full text-[10px] font-bold ${i === 0 ? 'bg-natural-olive text-natural-bg' : 'bg-natural-bg border border-natural-sage text-natural-olive'}`}>
                          {f}
                        </button>
                      ))}
                    </div>

                    {passport && <TimelineWidget 
                      events={passport.timeline}
                      passportId={passport.id}
                      onDeleteEvent={() => {}}
                      onRefreshPassport={() => fetchPassportData(passport.id)}
                    />}
                 </div>
             </div>

          </div>
        </div>
      </div>

      {/* QR Modal */}
      {showQRModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-[32px] border border-[#dfebe0] p-6 max-w-md w-full shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-[#1a1a10]">Share Medical Passport</h3>
              <button onClick={() => setShowQRModal(false)} className="text-[#5a5a40] hover:text-[#1a1a10]">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="flex flex-col items-center space-y-4">
              {passport && <img
                alt="QR Code"
                className="border-4 border-[#5a5a40] rounded-xl p-2"
                src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(
                  `http://192.168.1.15:3000/#share-demo`
                )}`}
              />}
              <div className="w-full">
                <label className="text-[10px] font-bold text-[#5a5a40] uppercase">Share Link</label>
                <div className="flex gap-2 mt-1">
                  <input
                    type="text"
                    readOnly
                    value={passport ? `http://192.168.1.15:3000/#share-demo` : ''}
                    className="flex-1 border border-[#dfebe0] rounded-lg px-3 py-2 text-xs font-mono"
                  />
                  <button
                    onClick={() => {
                      if (passport) {
                        navigator.clipboard.writeText(`http://192.168.1.15:3000/#share-demo`);
                        setQrCopied(true);
                        setTimeout(() => setQrCopied(false), 2000);
                      }
                    }}
                    className="bg-[#5a5a40] text-white px-3 py-2 rounded-lg text-xs hover:bg-[#4a4a30] transition-colors"
                  >
                    {qrCopied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div className="flex gap-2 w-full">
                <button
                  onClick={() => {
                    const shareUrl = `http://192.168.1.15:3000/#share-demo`;
                    console.log("Opening share URL:", shareUrl);
                    window.open(shareUrl, '_blank');
                  }}
                  className="flex-1 bg-[#aed1a0] text-[#1a1a10] px-4 py-2 rounded-xl text-xs font-bold hover:bg-[#9fc090] transition-colors flex items-center justify-center gap-2"
                >
                  <ExternalLink className="w-4 h-4" />
                  Test Doctor Link
                </button>
                <button
                  onClick={() => {
                    const link = document.createElement('a');
                    link.href = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(
                      `http://192.168.1.15:3000/#share-demo`
                    )}`;
                    link.download = 'medisync-qr.png';
                    link.click();
                  }}
                  className="flex-1 bg-white border border-[#dfebe0] text-[#5a5a40] px-4 py-2 rounded-xl text-xs font-bold hover:bg-[#f0f0e8] transition-colors flex items-center justify-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Download QR
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
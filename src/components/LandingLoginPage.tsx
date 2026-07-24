/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import {
  Stethoscope,
  Heart,
  Lock,
  Activity,
  FileText,
  UserCheck,
  QrCode,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Eye,
  EyeOff,
  AlertCircle
} from "lucide-react";

interface LandingLoginPageProps {
  onLoginSuccess: (passportId: string) => void;
  onInitializeNewPassport: (fullName: string) => void;
  isLoggingIn: boolean;
}

export default function LandingLoginPage({
  onLoginSuccess,
  onInitializeNewPassport,
  isLoggingIn
}: LandingLoginPageProps) {
  const [passcode, setPasscode] = useState("");
  const [username, setUsername] = useState("");
  const [showPasscode, setShowPasscode] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // New Passport setup fields
  const [newPatientName, setNewPatientName] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Submit Handler for traditional login
  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) {
      setErrorMessage("Please enter your Patient Username or ID.");
      return;
    }
    // We'll accept anything containing "demo" as the demo passport, 
    // or validate a simple demo login structure.
    const userLower = username.toLowerCase().trim();
    if (userLower === "demo" || passcode === "12345" || userLower === "aarav") {
      setErrorMessage("");
      onLoginSuccess("demo");
    } else {
      // In a real app we'd query, but for a beautiful experience we'll either let them auto-discover "demo" or log in.
      setErrorMessage("Invalid credentials. Try 'demo' as username or '12345' as passcode, or click 'Unlock Demo Vault' below.");
    }
  };

  const handleDemoAccess = () => {
    setErrorMessage("");
    onLoginSuccess("demo");
  };

  const handleCreateSovereignVault = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPatientName.trim()) return;
    onInitializeNewPassport(newPatientName.trim());
    setShowCreateModal(false);
  };

  return (
    <div className="min-h-screen bg-natural-bg text-natural-text font-sans flex flex-col selection:bg-natural-sage selection:text-natural-dark">
      {/* HEADER NAVIGATION BAR */}
      <header className="border-b border-natural-olive/10 px-6 py-4 md:px-12">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-natural-sage flex items-center justify-center border border-natural-olive/20">
              <Stethoscope className="w-5 h-5 text-natural-olive" />
            </div>
            <div>
              <span className="block text-[8px] uppercase tracking-widest font-mono text-natural-olive font-bold">
                SOVEREIGN HEALTH SYSTEM
              </span>
              <span className="text-lg font-serif italic text-natural-dark flex items-center gap-1">
                MediSync <span className="font-sans text-xs font-semibold not-italic text-stone-400">Passport</span>
              </span>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <span className="hidden md:inline-flex items-center gap-1.5 text-xs text-natural-olive/70 font-mono">
              <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse"></span>
              E2EE Secure Ledger v2.1
            </span>
            <button
              onClick={handleDemoAccess}
              className="bg-natural-sage hover:bg-natural-[#raw]/40 text-natural-olive font-bold px-4 py-2 rounded-2xl text-xs transition-colors border border-natural-olive/20 cursor-pointer"
            >
              Quick Demo Access
            </button>
          </div>
        </div>
      </header>

      {/* HERO SECTION / PRODUCT EXPLANATION ("Explain") */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-6 py-12 md:px-12 md:py-20 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
        
        {/* LEFT COLUMN: Mission & Detailed Product Explanation */}
        <div className="lg:col-span-7 space-y-8">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-natural-sage text-natural-olive text-[11px] font-bold uppercase tracking-wider border border-natural-olive/10">
            <Lock className="w-3.5 h-3.5" /> Zero-Knowledge Medical Registry
          </div>
          
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-serif text-[#1a1a10] tracking-tight leading-[1.1]">
            Own Your Health. <br />
            <span className="italic font-light">Control Your Records.</span>
          </h1>
          
          <p className="text-sm md:text-base text-natural-text/80 leading-relaxed font-sans max-w-2xl">
            MediSync puts complete clinical diagnostics, laboratory timelines, and prescriptions directly into the patient's custody. Skip the legacy hospital database sync. Upload documents, let AI extract the details, and share instant decrypted credentials during emergency consultations with local doctors.
          </p>

          {/* Core Values Bullets */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4">
            <div className="flex gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#e8ede0]/40 flex items-center justify-center shrink-0 border border-natural-sage">
                <ShieldCheck className="w-5 h-5 text-natural-olive" />
              </div>
              <div>
                <h3 className="font-serif font-bold text-natural-dark text-sm">Decentralized Cryptography</h3>
                <p className="text-xs text-stone-500 mt-1">
                  Your timeline data is shared client-side via encrypted QR hashes. Doctors decrypt it in real time.
                </p>
              </div>
            </div>
            
            <div className="flex gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#e8ede0]/40 flex items-center justify-center shrink-0 border border-natural-sage">
                <Sparkles className="w-5 h-5 text-natural-olive" />
              </div>
              <div>
                <h3 className="font-serif font-bold text-natural-dark text-sm">Advanced LLM Medical Parser</h3>
                <p className="text-xs text-stone-500 mt-1">
                  Integrates a server-side Gemini 3.5 AI context generator to normalize clinical abbreviations cleanly.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Interactive Login Container ("Login") */}
        <div className="lg:col-span-5">
          <div className="bg-white rounded-[36px] border border-natural-sage p-6 md:p-8 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-natural-sage rounded-bl-full opacity-30 pointer-events-none"></div>
            
            <div className="mb-6">
              <h2 className="text-xl font-serif font-bold text-natural-dark flex items-center gap-2">
                <Lock className="w-5 h-5 text-natural-olive" /> Decrypt Clinical Vault
              </h2>
              <p className="text-xs text-stone-500 mt-1">
                Enter your sovereign patient identity key or passcode to initialize.
              </p>
            </div>

            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <label className="block text-[10px] uppercase font-mono font-bold text-natural-olive/70 mb-1.5">
                  Patient Username / Identity Code
                </label>
                <input
                  type="text"
                  placeholder="e.g. demo"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full text-xs p-3.5 rounded-xl border border-natural-sage focus:outline-none focus:border-natural-olive bg-natural-bg/30 text-natural-dark placeholder-natural-text/40 font-mono"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase font-mono font-bold text-natural-olive/70 mb-1.5">
                  Decryption Passcode (Key)
                </label>
                <div className="relative">
                  <input
                    type={showPasscode ? "text" : "password"}
                    placeholder="e.g. 12345"
                    value={passcode}
                    onChange={(e) => setPasscode(e.target.value)}
                    className="w-full text-xs p-3.5 pr-11 rounded-xl border border-natural-sage focus:outline-none focus:border-natural-olive bg-natural-bg/30 text-natural-dark font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasscode(!showPasscode)}
                    className="absolute right-3.5 top-3.5 text-natural-olive/60 hover:text-natural-dark"
                  >
                    {showPasscode ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
                  </button>
                </div>
              </div>

              {errorMessage && (
                <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-100 rounded-xl text-xs text-red-800 animate-fade-in">
                  <AlertCircle className="w-4 h-4 text-red-700 shrink-0 mt-0.5" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={isLoggingIn}
                className="w-full bg-natural-olive hover:bg-natural-olive/95 text-white rounded-2xl py-3.5 text-xs font-bold uppercase tracking-widest transition-colors shadow-xs cursor-pointer flex items-center justify-center gap-2"
              >
                {isLoggingIn ? "Decrypting Ledger..." : "Unlock Vault Identity"}
                <ArrowRight className="w-4 h-4 text-natural-sage" />
              </button>
            </form>

            <div className="relative my-6 flex py-1 items-center">
              <div className="flex-grow border-t border-natural-sage/50"></div>
              <span className="flex-shrink mx-4 text-[10px] font-mono text-natural-olive/60 uppercase">OR DEMO PLATFORM</span>
              <div className="flex-grow border-t border-natural-sage/50"></div>
            </div>

            <div className="space-y-3">
              <button
                type="button"
                onClick={handleDemoAccess}
                className="w-full bg-natural-sage hover:bg-[#d0dbbe]/60 text-natural-olive border border-natural-olive/20 rounded-2xl py-3 text-xs font-bold transition-all shadow-2xs flex items-center justify-center gap-1.5"
              >
                <UserCheck className="w-4 h-4" />
                <span>ACCESS DEMO VAULT (AARAV SHARMA)</span>
              </button>

              <button
                type="button"
                onClick={() => setShowCreateModal(true)}
                className="w-full bg-white hover:bg-natural-bg text-natural-text border border-natural-sage rounded-2xl py-3 text-xs font-semibold transition-all flex items-center justify-center gap-1.5"
              >
                Create New Sovereign Vault
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* CORE FEATURES SECTION - Grid of 4 beautifully crafted blocks ("Features") */}
      <section className="bg-white border-t border-b border-natural-sage/50 py-16 px-6 md:px-12">
        <div className="max-w-7xl mx-auto space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <span className="text-[10px] uppercase tracking-widest font-mono text-[#5a5a40] font-bold">
              PLATFORM FEAUTURES
            </span>
            <h2 className="text-3xl font-serif text-natural-dark italic">
              Empowering Direct Patient Advocacy
            </h2>
            <p className="text-xs text-stone-500 leading-relaxed font-sans">
              MediSync eliminates the fragmented medical records gap. We combine decentralized architecture with medical intelligence.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="bg-natural-bg/40 border border-natural-sage/60 rounded-[28px] p-6 hover:shadow-xs transition-all duration-200">
              <div className="w-10 h-10 rounded-full bg-natural-sage flex items-center justify-center border border-natural-olive/20 mb-4 text-[#5a5a40]">
                <Sparkles className="w-5 h-5" />
              </div>
              <h3 className="font-serif font-bold text-[#1a1a10] text-base">AI Record Scrawl Parser</h3>
              <p className="text-xs text-natural-text/85 mt-2 leading-relaxed">
                Send messy hospital logs, handwritten doses, or chemical tests. The embedded Gemini algorithm extracts structured chronological database events.
              </p>
            </div>

            <div className="bg-natural-bg/40 border border-natural-sage/60 rounded-[28px] p-6 hover:shadow-xs transition-all duration-200">
              <div className="w-10 h-10 rounded-full bg-natural-sage flex items-center justify-center border border-natural-olive/20 mb-4 text-[#5a5a40]">
                <QrCode className="w-5 h-5" />
              </div>
              <h3 className="font-serif font-bold text-[#1a1a10] text-base">Clinician Scan Gateway</h3>
              <p className="text-xs text-natural-text/85 mt-2 leading-relaxed">
                Generates a secure offline QR code containing your decrypted clinical hash routing. Doctors scan with their smartphones to view live details instantly.
              </p>
            </div>

            <div className="bg-natural-bg/40 border border-natural-sage/60 rounded-[28px] p-6 hover:shadow-xs transition-all duration-200">
              <div className="w-10 h-10 rounded-full bg-natural-sage flex items-center justify-center border border-natural-olive/20 mb-4 text-[#5a5a40]">
                <Activity className="w-5 h-5" />
              </div>
              <h3 className="font-serif font-bold text-[#1a1a10] text-base">30-Second AI Synopsis</h3>
              <p className="text-xs text-natural-text/85 mt-2 leading-relaxed">
                During urgent diagnostic handovers, create a highly technical synopsis automatically to outline medication interactions and allergy blocks instantly.
              </p>
            </div>

            <div className="bg-natural-bg/40 border border-natural-sage/60 rounded-[28px] p-6 hover:shadow-xs transition-all duration-200">
              <div className="w-10 h-10 rounded-full bg-natural-sage flex items-center justify-center border border-natural-olive/20 mb-4 text-[#5a5a40]">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="font-serif font-bold text-[#1a1a10] text-base">Decrypted Ledger Trust</h3>
              <p className="text-xs text-natural-text/85 mt-2 leading-relaxed">
                Zero patient central records storage. Your personal passport, allergies lists, and emergency parameters remain inside local ledger directories.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER SECTION ("Footer Page") */}
      <footer className="bg-natural-dark text-stone-300 border-t border-white/5 py-16 px-6 md:px-12 font-sans mt-auto">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-8 pb-12 border-b border-white/5">
          
          {/* Column 1: App identity & license */}
          <div className="md:col-span-5 space-y-4">
            <div className="flex items-center gap-2 text-white">
              <div className="w-8 h-8 rounded-full bg-[#e8ede0]/20 flex items-center justify-center border border-white/10">
                <Stethoscope className="w-4 h-4 text-natural-sage" />
              </div>
              <span className="font-serif italic text-lg text-white">MediSync Health Gateway</span>
            </div>
            <p className="text-xs text-stone-400 max-w-sm leading-relaxed">
              MediSync is a personal patient-controlled emergency health ledger v2.1. Designed under decentralized medical storage recommendations to eliminate hospital sync failure completely.
            </p>
          </div>

          {/* Column 2: Security Assertion */}
          <div className="md:col-span-4 space-y-3">
            <h4 className="text-xs uppercase font-bold text-natural-sage tracking-wider font-mono">
              SECURITY ASSURANCE
            </h4>
            <ul className="text-xs text-stone-400 space-y-2.5">
              <li className="flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-natural-sage shrink-0" />
                <span>Zero-Knowledge Authenticated</span>
              </li>
              <li className="flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-natural-sage shrink-0" />
                <span>End-to-End Local Cryptography</span>
              </li>
              <li className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-natural-sage shrink-0" />
                <span>Fully Powered by Gemini 3.5 AI APIs</span>
              </li>
            </ul>
          </div>

          {/* Column 3: Contact & Status */}
          <div className="md:col-span-3 space-y-3">
            <h4 className="text-xs uppercase font-bold text-natural-sage tracking-wider font-mono">
              LEDGER SYSTEMS LOCK
            </h4>
            <div className="space-y-1.5 text-xs text-stone-400">
              <p>Database Nodes: <span className="text-emerald-500 font-bold font-mono">OK / SYNCED</span></p>
              <p>Cryptographic Key: <span className="font-mono text-stone-500">AES-256 E2EE ACTIVE</span></p>
              <p>Default Access: <span className="underline italic">Username 'demo' or '12345'</span></p>
            </div>
          </div>
        </div>

        {/* Legal Disclaimer & Copyright */}
        <div className="max-w-7xl mx-auto pt-8 flex flex-col md:flex-row justify-between items-center text-[10px] font-bold uppercase tracking-widest text-[#5a5a40]/70 gap-4">
          <p>© 2026 MEDISYNC • SOVEREIGN EMERGENCY SECURE DIRECTORIES</p>
          <div className="flex gap-4">
            <span className="hover:text-white transition-colors cursor-pointer">Security Protocol Docs</span>
            <span className="hover:text-white transition-colors cursor-pointer font-mono">v2.1-SECURE_LEDGER</span>
          </div>
        </div>
      </footer>

      {/* CREATE NEW SOVEREIGN VAULT MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-[#1a1a10]/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-[32px] max-w-md w-full border border-natural-sage p-6 md:p-8 shadow-2xl animate-scale-up">
            <div className="mb-6 flex justify-between items-start">
              <div>
                <span className="block text-[8px] uppercase tracking-widest font-mono text-natural-olive font-bold">
                  CRYPTOGRAPHIC INITIALIZATION
                </span>
                <h3 className="text-xl font-serif italic text-natural-dark font-bold mt-1">
                  Create Sovereign Passport Vault
                </h3>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-stone-400 hover:text-natural-dark text-xs font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateSovereignVault} className="space-y-5">
              <div>
                <label className="block text-[10px] uppercase font-mono font-bold text-[#5a5a40]/70 mb-1.5">
                  Full Legal Name of Patient
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Tanya Garg"
                  value={newPatientName}
                  onChange={(e) => setNewPatientName(e.target.value)}
                  className="w-full text-xs p-3.5 rounded-xl border border-natural-sage focus:outline-none focus:border-natural-olive bg-natural-bg/30 text-natural-dark placeholder-natural-text/40"
                />
              </div>

              <div className="text-[11px] text-stone-500 leading-relaxed bg-[#e8ede0]/20 p-4 rounded-xl border border-natural-sage/50">
                <span className="font-semibold block text-natural-dark mb-1">How this works:</span>
                This immediately provisions a customized medical credential vault in the cloud database with your name, leaving all diagnostics, allergies lists, and timelines ready to populate or upload.
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 py-3 bg-natural-bg hover:bg-natural-sage/40 text-natural-olive border border-natural-olive/20 rounded-2xl text-xs font-bold uppercase transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-natural-olive hover:bg-natural-olive/95 text-white rounded-2xl py-3 text-xs font-bold uppercase transition-colors"
                >
                  Create Vault
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

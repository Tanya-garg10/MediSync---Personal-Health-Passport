/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import {
  Stethoscope,
  Lock,
  Activity,
  UserCheck,
  QrCode,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Eye,
  EyeOff,
  AlertCircle,
} from "lucide-react";

interface LandingLoginPageProps {
  onLoginSuccess: (passportId: string) => void;
  onInitializeNewPassport: (fullName: string) => void;
  isLoggingIn: boolean;
}

export default function LandingLoginPage({
  onLoginSuccess,
  onInitializeNewPassport,
  isLoggingIn,
}: LandingLoginPageProps) {
  const [passcode, setPasscode] = useState("");
  const [username, setUsername] = useState("");
  const [showPasscode, setShowPasscode] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [newPatientName, setNewPatientName] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) {
      setErrorMessage("Please enter your demo username.");
      return;
    }
    const userLower = username.toLowerCase().trim();
    if (userLower === "demo" || passcode === "12345" || userLower === "aarav") {
      setErrorMessage("");
      onLoginSuccess("demo");
    } else {
      setErrorMessage(
        "Demo only — try username 'demo' or passcode '12345', or use Enter Demo Health Passport below."
      );
    }
  };

  const handleDemoAccess = () => {
    setErrorMessage("");
    onLoginSuccess("demo");
  };

  const handleCreatePassport = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPatientName.trim()) return;
    onInitializeNewPassport(newPatientName.trim());
    setShowCreateModal(false);
  };

  return (
    <div className="min-h-screen bg-natural-bg text-natural-text font-sans flex flex-col selection:bg-natural-sage selection:text-natural-dark">
      <header className="border-b border-natural-olive/10 px-6 py-4 md:px-12">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-natural-sage flex items-center justify-center border border-natural-olive/20">
              <Stethoscope className="w-5 h-5 text-natural-olive" />
            </div>
            <div>
              <span className="block text-[8px] uppercase tracking-widest font-mono text-natural-olive font-bold">
                PERSONAL HEALTH PASSPORT
              </span>
              <span className="text-lg font-serif italic text-natural-dark flex items-center gap-1">
                MediSync{" "}
                <span className="font-sans text-xs font-semibold not-italic text-stone-400">
                  Passport
                </span>
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <span className="inline-flex items-center gap-1.5 text-[10px] font-mono font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-amber-100 text-amber-900 border border-amber-200">
              DEMO ENVIRONMENT
            </span>
            <button
              onClick={handleDemoAccess}
              className="bg-natural-sage hover:bg-[#d0dbbe] text-natural-olive font-bold px-4 py-2 rounded-2xl text-xs transition-colors border border-natural-olive/20 cursor-pointer"
            >
              Enter Demo Health Passport
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto w-full px-6 py-12 md:px-12 md:py-20 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
        <div className="lg:col-span-7 space-y-8">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-natural-sage text-natural-olive text-[11px] font-bold uppercase tracking-wider border border-natural-olive/10">
            <ShieldCheck className="w-3.5 h-3.5" /> Patient-Controlled Health Passport
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-serif text-[#1a1a10] tracking-tight leading-[1.1]">
            Own Your Health. <br />
            <span className="italic font-light">Control Your Records.</span>
          </h1>

          <p className="text-sm md:text-base text-natural-text/80 leading-relaxed font-sans max-w-2xl">
            MediSync turns fragmented medical PDFs into one intelligent Personal Health Passport.
            Bindu agents structure your history, Stellar proves shared records were not altered, and
            Corsair can turn follow-ups into calendar actions.
          </p>

          <p className="text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2 max-w-2xl">
            Hackathon MVP — do not upload real sensitive medical information. Use the sample report
            for demos.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4">
            <div className="flex gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#e8ede0]/40 flex items-center justify-center shrink-0 border border-natural-sage">
                <Sparkles className="w-5 h-5 text-natural-olive" />
              </div>
              <div>
                <h3 className="font-serif font-bold text-natural-dark text-sm">
                  Bindu Multi-Agent AI
                </h3>
                <p className="text-xs text-stone-500 mt-1">
                  Document, Timeline, and Insight agents collaborate on evidence-backed structuring.
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#e8ede0]/40 flex items-center justify-center shrink-0 border border-natural-sage">
                <ShieldCheck className="w-5 h-5 text-natural-olive" />
              </div>
              <div>
                <h3 className="font-serif font-bold text-natural-dark text-sm">
                  Stellar-Backed Verification
                </h3>
                <p className="text-xs text-stone-500 mt-1">
                  Cryptographic proof of records on Stellar Testnet — medical values stay off-chain.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-5">
          <div className="bg-white rounded-[36px] border border-natural-sage p-6 md:p-8 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-natural-sage rounded-bl-full opacity-30 pointer-events-none"></div>

            <div className="mb-6">
              <div className="inline-flex mb-3 items-center gap-1.5 text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-200">
                DEMO ENVIRONMENT
              </div>
              <h2 className="text-xl font-serif font-bold text-natural-dark flex items-center gap-2">
                <Lock className="w-5 h-5 text-natural-olive" /> Enter Demo Health Passport
              </h2>
              <p className="text-xs text-stone-500 mt-1">
                Demo access only — not production authentication.
              </p>
            </div>

            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <label className="block text-[10px] uppercase font-mono font-bold text-natural-olive/70 mb-1.5">
                  Demo Username
                </label>
                <input
                  type="text"
                  placeholder="demo"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full text-xs p-3.5 rounded-xl border border-natural-sage focus:outline-none focus:border-natural-olive bg-natural-bg/30 text-natural-dark placeholder-natural-text/40 font-mono"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase font-mono font-bold text-natural-olive/70 mb-1.5">
                  Demo Passcode
                </label>
                <div className="relative">
                  <input
                    type={showPasscode ? "text" : "password"}
                    placeholder="12345"
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
                <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-100 rounded-xl text-xs text-red-800">
                  <AlertCircle className="w-4 h-4 text-red-700 shrink-0 mt-0.5" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={isLoggingIn}
                className="w-full bg-natural-olive hover:bg-natural-olive/95 text-white rounded-2xl py-3.5 text-xs font-bold uppercase tracking-widest transition-colors cursor-pointer flex items-center justify-center gap-2"
              >
                {isLoggingIn ? "Opening Demo..." : "Enter Demo Health Passport"}
                <ArrowRight className="w-4 h-4 text-natural-sage" />
              </button>
            </form>

            <div className="relative my-6 flex py-1 items-center">
              <div className="flex-grow border-t border-natural-sage/50"></div>
              <span className="flex-shrink mx-4 text-[10px] font-mono text-natural-olive/60 uppercase">
                OR
              </span>
              <div className="flex-grow border-t border-natural-sage/50"></div>
            </div>

            <div className="space-y-3">
              <button
                type="button"
                onClick={handleDemoAccess}
                className="w-full bg-natural-sage hover:bg-[#d0dbbe]/60 text-natural-olive border border-natural-olive/20 rounded-2xl py-3 text-xs font-bold transition-all flex items-center justify-center gap-1.5"
              >
                <UserCheck className="w-4 h-4" />
                <span>Enter Demo Health Passport (Aarav Sharma)</span>
              </button>

              <button
                type="button"
                onClick={() => setShowCreateModal(true)}
                className="w-full bg-white hover:bg-natural-bg text-natural-text border border-natural-sage rounded-2xl py-3 text-xs font-semibold transition-all flex items-center justify-center gap-1.5"
              >
                Create New Health Passport
              </button>
            </div>
          </div>
        </div>
      </main>

      <section className="bg-white border-t border-b border-natural-sage/50 py-16 px-6 md:px-12">
        <div className="max-w-7xl mx-auto space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <span className="text-[10px] uppercase tracking-widest font-mono text-[#5a5a40] font-bold">
              PLATFORM FEATURES
            </span>
            <h2 className="text-3xl font-serif text-natural-dark italic">
              One usable health history
            </h2>
            <p className="text-xs text-stone-500 leading-relaxed font-sans">
              Patient-controlled health passport with AI-powered organization and Stellar-backed
              record verification.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="bg-natural-bg/40 border border-natural-sage/60 rounded-[28px] p-6">
              <div className="w-10 h-10 rounded-full bg-natural-sage flex items-center justify-center border border-natural-olive/20 mb-4 text-[#5a5a40]">
                <Sparkles className="w-5 h-5" />
              </div>
              <h3 className="font-serif font-bold text-[#1a1a10] text-base">Real PDF Ingestion</h3>
              <p className="text-xs text-natural-text/85 mt-2 leading-relaxed">
                Text-based PDFs are extracted, then structured by the Bindu Document Agent — not
                filename tricks.
              </p>
            </div>

            <div className="bg-natural-bg/40 border border-natural-sage/60 rounded-[28px] p-6">
              <div className="w-10 h-10 rounded-full bg-natural-sage flex items-center justify-center border border-natural-olive/20 mb-4 text-[#5a5a40]">
                <Activity className="w-5 h-5" />
              </div>
              <h3 className="font-serif font-bold text-[#1a1a10] text-base">Health Timeline</h3>
              <p className="text-xs text-natural-text/85 mt-2 leading-relaxed">
                Longitudinal events with provenance, evidence-backed insights, and Prepare Doctor
                Visit briefs.
              </p>
            </div>

            <div className="bg-natural-bg/40 border border-natural-sage/60 rounded-[28px] p-6">
              <div className="w-10 h-10 rounded-full bg-natural-sage flex items-center justify-center border border-natural-olive/20 mb-4 text-[#5a5a40]">
                <QrCode className="w-5 h-5" />
              </div>
              <h3 className="font-serif font-bold text-[#1a1a10] text-base">Verified Record QR</h3>
              <p className="text-xs text-natural-text/85 mt-2 leading-relaxed">
                Register a record hash on Stellar, then share a single-record QR doctors can verify.
              </p>
            </div>

            <div className="bg-natural-bg/40 border border-natural-sage/60 rounded-[28px] p-6">
              <div className="w-10 h-10 rounded-full bg-natural-sage flex items-center justify-center border border-natural-olive/20 mb-4 text-[#5a5a40]">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="font-serif font-bold text-[#1a1a10] text-base">Follow-ups to Calendar</h3>
              <p className="text-xs text-natural-text/85 mt-2 leading-relaxed">
                Detected follow-ups can be added to Google Calendar through Corsair when configured.
              </p>
            </div>
          </div>
        </div>
      </section>

      <footer className="bg-natural-dark text-stone-300 border-t border-white/5 py-16 px-6 md:px-12 font-sans mt-auto">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-8 pb-12 border-b border-white/5">
          <div className="md:col-span-5 space-y-4">
            <div className="flex items-center gap-2 text-white">
              <div className="w-8 h-8 rounded-full bg-[#e8ede0]/20 flex items-center justify-center border border-white/10">
                <Stethoscope className="w-4 h-4 text-natural-sage" />
              </div>
              <span className="font-serif italic text-lg text-white">MediSync</span>
            </div>
            <p className="text-xs text-stone-400 max-w-sm leading-relaxed">
              Patient-controlled health passport with AI-powered organization and Stellar-backed
              record verification. Hackathon MVP — not production healthcare infrastructure.
            </p>
          </div>

          <div className="md:col-span-4 space-y-3">
            <h4 className="text-xs uppercase font-bold text-natural-sage tracking-wider font-mono">
              INTEGRATIONS
            </h4>
            <ul className="text-xs text-stone-400 space-y-2.5">
              <li>Bindu multi-agent orchestration</li>
              <li>Stellar Testnet record authenticity</li>
              <li>Corsair → Google Calendar</li>
            </ul>
          </div>

          <div className="md:col-span-3 space-y-3">
            <h4 className="text-xs uppercase font-bold text-natural-sage tracking-wider font-mono">
              DEMO ACCESS
            </h4>
            <div className="space-y-1.5 text-xs text-stone-400">
              <p>
                Environment: <span className="text-amber-400 font-bold font-mono">DEMO</span>
              </p>
              <p>
                Username: <span className="font-mono">demo</span>
              </p>
              <p>
                Passcode: <span className="font-mono">12345</span>
              </p>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto pt-8 flex flex-col md:flex-row justify-between items-center text-[10px] font-bold uppercase tracking-widest text-[#5a5a40]/70 gap-4">
          <p>© 2026 MEDISYNC • HACKATHON MVP</p>
          <span className="font-mono">v3.0-DEMO</span>
        </div>
      </footer>

      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-[#1a1a10]/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-[32px] max-w-md w-full border border-natural-sage p-6 md:p-8 shadow-2xl">
            <div className="mb-6 flex justify-between items-start">
              <div>
                <span className="block text-[8px] uppercase tracking-widest font-mono text-natural-olive font-bold">
                  NEW PASSPORT
                </span>
                <h3 className="text-xl font-serif italic text-natural-dark font-bold mt-1">
                  Create Health Passport
                </h3>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-stone-400 hover:text-natural-dark text-xl leading-none"
              >
                ×
              </button>
            </div>
            <form onSubmit={handleCreatePassport} className="space-y-4">
              <input
                type="text"
                placeholder="Full name"
                value={newPatientName}
                onChange={(e) => setNewPatientName(e.target.value)}
                className="w-full text-xs p-3.5 rounded-xl border border-natural-sage focus:outline-none focus:border-natural-olive bg-natural-bg/30"
              />
              <button
                type="submit"
                className="w-full bg-natural-olive text-white rounded-2xl py-3 text-xs font-bold uppercase tracking-widest"
              >
                Create Passport
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

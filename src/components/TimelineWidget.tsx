/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import {
  Calendar,
  Search,
  Filter,
  Trash2,
  ChevronDown,
  ChevronUp,
  FileText,
  Activity,
  Award,
  Stethoscope,
  Scissors,
  HelpCircle,
  X,
  SlidersHorizontal,
} from "lucide-react";
import { TimelineEvent, RecordType } from "../types";

interface TimelineWidgetProps {
  events: TimelineEvent[];
  passportId: string;
  onDeleteEvent: (id: string) => void;
  onRefreshPassport: () => void;
}

export default function TimelineWidget({ events, passportId, onDeleteEvent, onRefreshPassport }: TimelineWidgetProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState<RecordType | "All">("All");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [expandedEventId, setExpandedEventId] = useState<string | null>(null);

  const [notarizingId, setNotarizingId] = useState<string | null>(null);
  const [verifyingId, setVerifyingId] = useState<string | null>(null);
  const [verifyPanel, setVerifyPanel] = useState<Record<string, any>>({});

  const handleVerifyOnStellar = async (eventId: string) => {
    setNotarizingId(eventId);
    try {
      const response = await fetch(`/api/records/${passportId}/notarize/${eventId}`, {
        method: "POST",
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Stellar registration failed");
      onRefreshPassport();
      setVerifyPanel((prev) => ({
        ...prev,
        [eventId]: {
          authentic: true,
          hash: data.event?.stellarHash,
          txId: data.event?.stellarTxId,
          registeredAt: data.event?.stellarTimestamp,
          contractId: data.event?.stellarContractId,
          network: "Stellar Testnet",
        },
      }));
    } catch (err: any) {
      alert(err.message || "Failed to register on Stellar Testnet.");
    } finally {
      setNotarizingId(null);
    }
  };

  const handleCheckVerification = async (eventId: string) => {
    setVerifyingId(eventId);
    try {
      const response = await fetch(`/api/records/${passportId}/verify/${eventId}`, {
        method: "POST",
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Verification failed");
      setVerifyPanel((prev) => ({
        ...prev,
        [eventId]: {
          authentic: Boolean(data.verification?.verified),
          reason: data.verification?.reason,
          hash: data.hash,
          network: data.network,
          contractId: data.contractId,
        },
      }));
    } catch (err: any) {
      setVerifyPanel((prev) => ({
        ...prev,
        [eventId]: { authentic: false, reason: err.message },
      }));
    } finally {
      setVerifyingId(null);
    }
  };

  const shareVerified = (eventId: string) => {
    window.location.hash = `verify-${passportId}-${eventId}`;
  };

  // Sorting timeline events from latest to oldest
  const sortedEvents = [...events].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  // Filter events based on search query, categorical type & date range
  const filteredEvents = sortedEvents.filter((evt) => {
    // 1. Keyword search (title, findings, clinician, facility, nextSteps)
    const matchesSearch =
      evt.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      evt.findings.toLowerCase().includes(searchQuery.toLowerCase()) ||
      evt.clinician.toLowerCase().includes(searchQuery.toLowerCase()) ||
      evt.facility.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (evt.nextSteps && evt.nextSteps.toLowerCase().includes(searchQuery.toLowerCase()));

    // 2. Category type filter
    const matchesType = selectedType === "All" || evt.recordType === selectedType;

    // 3. Date range filter
    let matchesDate = true;
    const eventTime = new Date(evt.date);
    
    if (startDate) {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      matchesDate = matchesDate && eventTime >= start;
    }
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      matchesDate = matchesDate && eventTime <= end;
    }

    return matchesSearch && matchesType && matchesDate;
  });

  const getRecordIcon = (type: RecordType) => {
    switch (type) {
      case "Consultation":
        return <Stethoscope className="w-4 h-4 text-emerald-600" />;
      case "Laboratory":
        return <Activity className="w-4 h-4 text-blue-600" />;
      case "Scan/Imaging":
        return <FileText className="w-4 h-4 text-purple-600" />;
      case "Prescription":
        return <Award className="w-4 h-4 text-amber-600" />;
      case "Surgery":
        return <Scissors className="w-4 h-4 text-red-600" />;
      case "Vaccination":
        return <Calendar className="w-4 h-4 text-teal-600" />;
      default:
        return <HelpCircle className="w-4 h-4 text-slate-600" />;
    }
  };

  const getSeverityBadge = (level: string) => {
    switch (level) {
      case "High":
        return (
          <span className="px-2.5 py-0.5 rounded-full bg-red-50 text-red-900 text-[10px] font-bold border border-red-100">
            High Severity
          </span>
        );
      case "Medium":
        return (
          <span className="px-2.5 py-0.5 rounded-full bg-[#fdfcf8] text-natural-olive text-[10px] font-bold border border-natural-sage">
            Moderate Priority
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-0.5 rounded-full bg-[#e8ede0]/40 text-natural-dark text-[10px] font-medium border border-[#e8ede0]">
            Routine Care
          </span>
        );
    }
  };

  const toggleExpand = (id: string) => {
    if (expandedEventId === id) {
      setExpandedEventId(null);
    } else {
      setExpandedEventId(id);
    }
  };

  const handleApplyPreset = (preset: "30days" | "6months" | "1year" | "all") => {
    const today = new Date();
    if (preset === "all") {
      setStartDate("");
      setEndDate("");
    } else if (preset === "30days") {
      const past = new Date();
      past.setDate(today.getDate() - 30);
      setStartDate(past.toISOString().split("T")[0]);
      setEndDate(today.toISOString().split("T")[0]);
    } else if (preset === "6months") {
      const past = new Date();
      past.setMonth(today.getMonth() - 6);
      setStartDate(past.toISOString().split("T")[0]);
      setEndDate(today.toISOString().split("T")[0]);
    } else if (preset === "1year") {
      const past = new Date();
      past.setFullYear(today.getFullYear() - 1);
      setStartDate(past.toISOString().split("T")[0]);
      setEndDate(today.toISOString().split("T")[0]);
    }
  };

  const handleClearFilters = () => {
    setSearchQuery("");
    setSelectedType("All");
    setStartDate("");
    setEndDate("");
  };

  const recordTypes: (RecordType | "All")[] = [
    "All",
    "Consultation",
    "Laboratory",
    "Scan/Imaging",
    "Prescription",
    "Surgery",
    "Vaccination",
  ];

  const hasActiveFilters = searchQuery !== "" || selectedType !== "All" || startDate !== "" || endDate !== "";

  return (
    <div className="bg-white rounded-[32px] border border-natural-sage p-6 md:p-8 shadow-sm flex flex-col space-y-6">
      
      {/* Header and Search Controls Grid */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
        <div className="space-y-1">
          <h3 className="text-xl font-serif font-bold text-natural-dark flex items-center gap-1.5">
            Your Clinical Timeline Passport
          </h3>
          <p className="text-xs text-natural-text/75">
            Chronological log of verified diagnostic consultations, prescriptions, and health events.
          </p>
        </div>

        {/* Input Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Main search bar */}
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search symptoms, doctors, prescriptions..."
              className="w-full md:w-64 text-xs pl-9 pr-8 py-2.5 rounded-xl border border-natural-sage focus:outline-none focus:border-natural-olive focus:ring-1 focus:ring-natural-olive bg-natural-bg/50 text-natural-dark placeholder-natural-text/40 transition-all"
            />
            <Search className="w-4 h-4 text-natural-olive/60 absolute left-3 top-3" />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery("")} 
                className="absolute right-2.5 top-2.5 p-0.5 rounded-full hover:bg-natural-sage text-natural-olive/60"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Toggle Advanced Filters Button */}
          <button
            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
            className={`flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold border transition-all ${
              showAdvancedFilters || startDate || endDate
                ? "bg-natural-olive text-white border-natural-olive shadow-2xs"
                : "bg-white hover:bg-natural-sage/20 border-natural-sage text-natural-olive"
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Filters</span>
            {(startDate || endDate) && (
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            )}
          </button>
        </div>
      </div>

      {/* Advanced Filters Panel (Date Range & Presets) */}
      {(showAdvancedFilters || startDate || endDate) && (
        <div className="bg-natural-bg/30 border border-natural-sage/75 p-5 rounded-2xl space-y-4 animate-fade-in">
          <div className="flex items-center justify-between border-b border-natural-sage/50 pb-2">
            <h4 className="text-[11px] font-bold uppercase tracking-wider text-[#5a5a40] flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-natural-olive" /> Date Range & History Filters
            </h4>
            {hasActiveFilters && (
              <button
                onClick={handleClearFilters}
                className="text-[10px] font-bold uppercase tracking-wider text-red-600 hover:text-red-700 transition-colors flex items-center gap-1"
              >
                Clear All Filters
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 items-end">
            {/* Start Date */}
            <div className="space-y-1.5">
              <label className="block text-[10px] font-bold text-natural-olive uppercase tracking-wide">
                Start Date (From)
              </label>
              <div className="relative">
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-natural-sage focus:outline-none focus:border-natural-olive focus:ring-1 focus:ring-natural-olive bg-white text-natural-dark"
                />
              </div>
            </div>

            {/* End Date */}
            <div className="space-y-1.5">
              <label className="block text-[10px] font-bold text-natural-olive uppercase tracking-wide">
                End Date (To)
              </label>
              <div className="relative">
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-natural-sage focus:outline-none focus:border-natural-olive focus:ring-1 focus:ring-natural-olive bg-white text-natural-dark"
                />
              </div>
            </div>

            {/* Presets */}
            <div className="space-y-1.5 md:col-span-2 lg:col-span-1">
              <label className="block text-[10px] font-bold text-natural-olive uppercase tracking-wide">
                Quick Shortcuts
              </label>
              <div className="grid grid-cols-4 gap-1">
                <button
                  type="button"
                  onClick={() => handleApplyPreset("30days")}
                  className="px-2 py-2.5 text-[10px] font-semibold rounded-lg bg-white border border-natural-sage hover:bg-natural-sage/20 text-natural-olive text-center"
                >
                  30 Days
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyPreset("6months")}
                  className="px-2 py-2.5 text-[10px] font-semibold rounded-lg bg-white border border-natural-sage hover:bg-natural-sage/20 text-natural-olive text-center"
                >
                  6 Months
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyPreset("1year")}
                  className="px-2 py-2.5 text-[10px] font-semibold rounded-lg bg-white border border-natural-sage hover:bg-natural-sage/20 text-natural-olive text-center"
                >
                  1 Year
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyPreset("all")}
                  className="px-2 py-2.5 text-[10px] font-semibold rounded-lg bg-[#e8ede0] border border-natural-sage hover:bg-natural-sage/20 text-natural-olive text-center font-bold"
                >
                  All
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Categories chips filter bar */}
      <div className="flex flex-wrap gap-1.5 border-b border-natural-sage pb-4 items-center justify-between">
        <div className="flex flex-wrap gap-1.5">
          {recordTypes.map((type) => (
            <button
              key={type}
              onClick={() => setSelectedType(type)}
              className={`px-3.5 py-2 rounded-xl text-[11px] font-medium transition-all duration-200 ${
                selectedType === type
                  ? "bg-natural-olive text-white shadow-xs font-bold"
                  : "bg-natural-sage/20 hover:bg-natural-sage/40 text-natural-olive border border-natural-sage/30"
              }`}
            >
              {type}
            </button>
          ))}
        </div>

        {/* Filter State Summary Indicator */}
        {hasActiveFilters && (
          <div className="flex items-center gap-2 text-[10px] font-medium text-natural-olive/80 bg-[#e8ede0]/40 px-3 py-1.5 rounded-xl border border-natural-sage/50 mt-2 sm:mt-0">
            <span>Showing <strong>{filteredEvents.length}</strong> of <strong>{events.length}</strong> events</span>
            <button
              onClick={handleClearFilters}
              className="p-0.5 rounded-full hover:bg-natural-sage text-natural-olive"
              title="Clear all"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        )}
      </div>

      {/* Main vertical timeline construct */}
      {filteredEvents.length === 0 ? (
        <div className="text-center py-12">
          <Calendar className="w-10 h-10 text-natural-olive/30 mx-auto mb-2" />
          <p className="text-xs font-semibold text-natural-dark font-serif">No matching timeline events found</p>
          <p className="text-[11px] text-natural-text/65 mt-1">
            Try adjusting filters or submit new notes to parse other reports.
          </p>
        </div>
      ) : (
        <div className="relative border-l border-natural-sage/60 ml-4 space-y-6">
          {filteredEvents.map((evt) => {
            const isExpanded = expandedEventId === evt.id;
            return (
              <div key={evt.id} className="relative pl-8 group select-none">
                {/* Timeline ball indicator */}
                <div className="absolute -left-[17px] top-1 bg-white border-2 border-natural-olive rounded-full p-1.5 shadow-sm group-hover:scale-110 transition-transform">
                  {getRecordIcon(evt.recordType)}
                </div>

                <div className="bg-natural-bg/20 hover:bg-[#e8ede0]/20 border border-[#e8ede0] rounded-2xl p-4 md:p-5 transition-all">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      {/* Date and Clinical label */}
                      <span className="text-[10px] font-mono text-natural-olive font-bold uppercase tracking-wider flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        {new Date(evt.date).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}
                      </span>

                      {/* Event Title */}
                      <h4
                        className="text-sm font-serif font-bold text-natural-dark mt-1 cursor-pointer hover:text-natural-olive transition-colors"
                        onClick={() => toggleExpand(evt.id)}
                      >
                        {evt.title}
                      </h4>

                      {/* Facility details */}
                      <p className="text-xs text-natural-text/75 mt-0.5 font-medium">
                        {evt.clinician} • <span className="italic">{evt.facility}</span>
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {getSeverityBadge(evt.severity)}
                      <button
                        onClick={() => toggleExpand(evt.id)}
                        className="p-1 rounded-lg text-slate-400 hover:text-[#33332d] hover:bg-[#e8ede0] transition-colors"
                      >
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                      <button
                        onClick={() => onDeleteEvent(evt.id)}
                        className="p-1 rounded-lg text-slate-400 hover:text-red-700 hover:bg-red-50 transition-colors"
                        title="Remove clinical record"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Summary of findings - preview/layman notes */}
                  <p className="text-xs text-natural-text mt-2 leading-relaxed">
                    <strong>Diagnosis & findings:</strong> {evt.findings}
                  </p>

                  <div className="mt-3.5 pt-3 border-t border-natural-sage/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-[11px] font-medium text-[#5a5a40]/80 font-mono">
                    <div className="flex items-center gap-1.5 overflow-hidden">
                      {evt.sourceDocument && (
                        <span className="truncate text-[10px] font-sans">
                          Source: {evt.sourceDocument}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 shrink-0 flex-wrap">
                      {evt.stellarStatus === "verified" ? (
                        <>
                          <span className="flex items-center gap-1 text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-200 text-[10px] font-bold font-sans">
                            Verified on Stellar
                          </span>
                          <button
                            onClick={() => handleCheckVerification(evt.id)}
                            disabled={verifyingId === evt.id}
                            className="px-2.5 py-1 rounded-lg bg-natural-sage/20 border border-natural-sage text-[10px] font-bold font-sans cursor-pointer text-natural-olive"
                          >
                            {verifyingId === evt.id ? "Checking…" : "Open Verification"}
                          </button>
                          <button
                            onClick={() => shareVerified(evt.id)}
                            className="px-2.5 py-1 rounded-lg bg-natural-olive text-white text-[10px] font-bold font-sans cursor-pointer"
                          >
                            Share Verified Record
                          </button>
                          {evt.stellarTxId && (
                            <a
                              href={`https://stellar.expert/explorer/testnet/tx/${evt.stellarTxId}`}
                              target="_blank"
                              rel="noreferrer"
                              className="px-2 py-1 text-natural-olive font-sans font-bold"
                            >
                              Explorer ↗
                            </a>
                          )}
                        </>
                      ) : (
                        <button
                          onClick={() => handleVerifyOnStellar(evt.id)}
                          disabled={notarizingId === evt.id}
                          className="px-3 py-1 rounded-lg bg-natural-olive hover:bg-natural-olive/90 text-white text-[10px] font-bold font-sans cursor-pointer flex items-center gap-1"
                        >
                          {notarizingId === evt.id ? "Registering on Stellar…" : "Verify on Stellar"}
                        </button>
                      )}
                    </div>
                  </div>

                  {verifyPanel[evt.id] && (
                    <div
                      className={`mt-2.5 p-3 rounded-xl border text-xs font-sans ${
                        verifyPanel[evt.id].authentic
                          ? "bg-emerald-50 border-emerald-100 text-emerald-950"
                          : "bg-red-50 border-red-100 text-red-950"
                      }`}
                    >
                      <p className="font-bold">
                        {verifyPanel[evt.id].authentic
                          ? "Record Verification — Authentic"
                          : "Verification Failed"}
                      </p>
                      <p className="text-[11px] mt-1 opacity-90">
                        {verifyPanel[evt.id].authentic
                          ? `Network: ${verifyPanel[evt.id].network || "Stellar Testnet"} · Hash: ${(verifyPanel[evt.id].hash || "").slice(0, 12)}…`
                          : verifyPanel[evt.id].reason ||
                            "The record does not match its registered cryptographic proof."}
                      </p>
                      {verifyPanel[evt.id].contractId && (
                        <p className="text-[10px] mt-1 font-mono">
                          Contract: {verifyPanel[evt.id].contractId}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Collapsible details for full patient understanding */}
                  {isExpanded && (
                    <div className="mt-4 pt-4 border-t border-natural-sage space-y-3 text-xs animate-fade-in">
                      <div>
                        <h5 className="font-semibold uppercase tracking-wide text-[9px] mb-1 text-[#5a5a40]">
                          Complete Clinical Findings
                        </h5>
                        <p className="text-natural-dark leading-relaxed bg-white p-3 rounded-xl border border-natural-sage">
                          {evt.findings}
                        </p>
                      </div>

                      <div>
                        <h5 className="font-semibold uppercase tracking-wide text-[9px] mb-1 text-[#5a5a40]">
                          Recommended Action & Remedial Next Steps
                        </h5>
                        <p className="text-natural-dark leading-relaxed bg-natural-sage/20 p-3 rounded-xl border border-natural-sage/50">
                          {evt.nextSteps}
                        </p>
                      </div>

                      {evt.rawTextSource && (
                        <div>
                          <details className="text-[11px]">
                            <summary className="cursor-pointer text-natural-olive font-medium hover:text-natural-dark transition-colors select-none">
                              See Raw Extracted Source Text Archive ({evt.rawTextSource.length} chars)
                            </summary>
                            <pre className="mt-2 text-[10px] p-3 rounded-lg bg-natural-dark text-natural-bg font-mono overflow-x-auto whitespace-pre-wrap leading-relaxed max-h-40">
                              {evt.rawTextSource}
                            </pre>
                          </details>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

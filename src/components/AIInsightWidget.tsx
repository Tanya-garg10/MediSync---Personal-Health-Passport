import React, { useState } from "react";
import { Loader2, CheckCircle2, AlertCircle, CalendarPlus, Sparkles } from "lucide-react";
import type {
  AgentStepStatus,
  DoctorBrief,
  InsightTrend,
  PassportData,
} from "../types";

interface AIInsightWidgetProps {
  passport: PassportData;
}

export default function AIInsightWidget({ passport }: AIInsightWidgetProps) {
  const [tab, setTab] = useState<"insights" | "brief" | "emergency">("insights");
  const [steps, setSteps] = useState<AgentStepStatus[]>([]);
  const [trends, setTrends] = useState<InsightTrend[]>([]);
  const [brief, setBrief] = useState<DoctorBrief | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [calendarMsg, setCalendarMsg] = useState<string | null>(null);

  const loadInsights = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/bindu/insights", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ passportId: passport.id }),
      });
      const data = await res.json();
      setSteps(data.steps || []);
      setTrends(data.trends || []);
      if (!res.ok) setError(data.error || "Insight agent failed");
    } catch (e: any) {
      setError(e?.message || "Insight agent failed");
    } finally {
      setLoading(false);
    }
  };

  const prepareDoctorVisit = async () => {
    setTab("brief");
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/bindu/doctor-brief", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ passportId: passport.id }),
      });
      const data = await res.json();
      setSteps(data.steps || []);
      setBrief(data.brief || null);
      setTrends(data.trends || []);
      if (!res.ok) setError(data.error || "Doctor brief failed");
    } catch (e: any) {
      setError(e?.message || "Doctor brief failed");
    } finally {
      setLoading(false);
    }
  };

  const addToCalendar = async (index: number) => {
    setCalendarMsg(null);
    const followUp = passport.pendingFollowUps?.[index];
    if (!followUp) return;

    // Generate Google Calendar link as fallback
    const startDate = new Date(followUp.recommendedDate + "T09:00:00");
    const endDate = new Date(startDate.getTime() + 30 * 60 * 1000);
    
    const formatDate = (date: Date) => date.toISOString().replace(/-|:|\.\d\d\d/g, "");
    
    const calendarUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=MediSync+Follow-up+${encodeURIComponent(passport.fullName)}&dates=${formatDate(startDate)}/${formatDate(endDate)}&details=${encodeURIComponent(followUp.note)}`;
    
    window.open(calendarUrl, '_blank');
    setCalendarMsg("Opening Google Calendar...");
  };

  return (
    <div className="bg-natural-dark text-natural-bg rounded-[32px] border border-natural-sage shadow-sm overflow-hidden" id="bindu-agent-hub">
      <div className="px-6 py-5 border-b border-natural-sage/50 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-[10px] font-mono font-bold uppercase tracking-wider text-natural-sage">
            Bindu Hub
          </p>
          <h3 className="font-serif text-lg text-natural-bg">Multi-Agent Health Intelligence</h3>
        </div>
        <button
          type="button"
          onClick={prepareDoctorVisit}
          disabled={loading}
          className="inline-flex items-center gap-2 bg-natural-olive text-white text-xs font-bold px-4 py-2.5 rounded-xl"
        >
          <Sparkles className="w-4 h-4" />
          Prepare Doctor Visit
        </button>
      </div>

      <div className="flex gap-1 px-4 pt-3 border-b border-natural-sage/40">
        {(
          [
            ["insights", "Insights"],
            ["brief", "Doctor Brief"],
            ["emergency", "Emergency"],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={`px-4 py-2 text-xs font-semibold rounded-t-xl ${
              tab === id
                ? "bg-natural-sage/20 text-natural-bg"
                : "text-natural-bg/50 hover:text-natural-bg"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="p-6 space-y-4">
        {error && (
          <div className="flex gap-2 p-3 rounded-xl bg-red-50 border border-red-100 text-xs text-red-800">
            <AlertCircle className="w-4 h-4 shrink-0" />
            {error}
          </div>
        )}

        {steps.length > 0 && (
          <div className="space-y-2 rounded-2xl border border-natural-sage/30 p-4 bg-natural-sage/10 text-natural-bg">
            {steps.map((s, i) => (
              <div key={i} className="flex items-start gap-2 text-xs">
                {s.status === "done" ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                ) : s.status === "running" ? (
                  <Loader2 className="w-4 h-4 animate-spin text-natural-olive" />
                ) : (
                  <span className="w-4 h-4 rounded-full border border-natural-sage/50" />
                )}
                <span>
                  <strong className="capitalize">{s.agent}</strong> — {s.message}
                </span>
              </div>
            ))}
          </div>
        )}

        {tab === "insights" && (
          <div className="space-y-4">
            <button
              type="button"
              onClick={loadInsights}
              disabled={loading}
              className="text-xs font-bold px-3 py-2 rounded-xl border border-natural-sage/30 text-natural-sage hover:bg-natural-sage/10"
            >
              {loading ? "Running Insight Agent…" : "Run Insight Agent"}
            </button>

            {(passport.pendingFollowUps || []).length > 0 && (
              <div className="space-y-2">
                {(passport.pendingFollowUps || []).map((f, i) => (
                  <div
                    key={i}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-natural-sage/40 px-3 py-2 text-xs"
                  >
                    <span>
                      Follow-up recommended: <strong>{f.recommendedDate}</strong> — {f.note}
                    </span>
                    <button
                      type="button"
                      onClick={() => addToCalendar(i)}
                      className="inline-flex items-center gap-1 font-bold text-natural-bg hover:text-white"
                    >
                      <CalendarPlus className="w-3.5 h-3.5" />
                      Add to Calendar
                    </button>
                  </div>
                ))}
                {calendarMsg && <p className="text-[11px] text-stone-600">{calendarMsg}</p>}
              </div>
            )}

            {trends.length === 0 ? (
              <p className="text-xs text-natural-bg/60">
                Evidence-backed trends appear here from recorded numeric observations only.
              </p>
            ) : (
              trends.map((t, i) => (
                <div key={i} className="rounded-2xl border border-natural-sage/30 p-4 bg-natural-sage/5">
                  <p className="font-serif text-sm text-natural-bg">
                    {t.name} {t.unit && <span className="text-natural-bg/50">({t.unit})</span>}
                  </p>
                  <p className="text-xs text-natural-bg/80 mt-1">{t.summary}</p>
                  {t.points.length > 0 && (
                    <p className="text-[11px] font-mono text-natural-sage mt-2">
                      {t.points.map((p) => `${p.date}: ${p.value}`).join(" · ")}
                    </p>
                  )}
                  <p className="text-[10px] text-natural-bg/40 mt-2">
                    Sources: {t.sources.join(", ") || "—"}
                  </p>
                </div>
              ))
            )}
          </div>
        )}

        {tab === "brief" && (
          <div className="space-y-4">
            {!brief && !loading && (
              <p className="text-xs text-natural-bg/60">
                Click Prepare Doctor Visit to generate an evidence-backed clinician brief.
              </p>
            )}
            {brief && (
              <div className="space-y-4 text-xs">
                <div>
                  <p className="text-[10px] font-mono uppercase tracking-wider text-natural-sage">
                    Doctor Visit Brief
                  </p>
                  <h4 className="font-serif text-xl text-natural-bg mt-1">{brief.patientName}</h4>
                </div>
                <section>
                  <h5 className="font-bold text-natural-bg mb-1">Known Conditions</h5>
                  <p>{brief.knownConditions.join(" · ") || "None recorded"}</p>
                </section>
                <section>
                  <h5 className="font-bold text-natural-bg mb-1">Current Medication</h5>
                  <ul className="list-disc pl-4">
                    {brief.currentMedications.map((m, i) => (
                      <li key={i}>{m}</li>
                    ))}
                  </ul>
                </section>
                <section>
                  <h5 className="font-bold text-natural-bg mb-1">Recent Clinical Events</h5>
                  <ul className="space-y-1">
                    {brief.recentEvents.map((e, i) => (
                      <li key={i}>
                        {e.date} — {e.title}
                      </li>
                    ))}
                  </ul>
                </section>
                <section>
                  <h5 className="font-bold text-natural-bg mb-1">Recorded Trends</h5>
                  {brief.trends
                    .filter((t) => t.direction !== "insufficient_data")
                    .map((t, i) => (
                      <p key={i} className="mb-1">
                        {t.name}: {t.points.map((p) => p.value).join(" → ")} {t.unit}
                      </p>
                    ))}
                </section>
                <section>
                  <h5 className="font-bold text-natural-bg mb-1">Latest Results</h5>
                  <ul className="space-y-1">
                    {brief.latestResults.map((r, i) => (
                      <li key={i}>
                        {r.name} {r.value} {r.unit}
                      </li>
                    ))}
                  </ul>
                </section>
                <section>
                  <h5 className="font-bold text-natural-bg mb-1">Allergies</h5>
                  <p>{brief.allergies.join(", ") || "None recorded"}</p>
                </section>
                <p className="text-[10px] text-natural-bg/40">
                  Sources: {brief.sources.length} medical records · Last updated{" "}
                  {new Date(brief.lastUpdated).toLocaleDateString()}
                </p>
              </div>
            )}
          </div>
        )}

        {tab === "emergency" && (
          <div className="rounded-2xl bg-natural-bg text-natural-dark p-5 space-y-3">
            <p className="text-[10px] font-mono uppercase tracking-wider text-rose-500">
              Emergency Health Passport
            </p>
            <h4 className="font-serif text-2xl">{passport.fullName}</h4>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <p className="text-rose-500/80 text-[10px] uppercase">Blood Group</p>
                <p className="font-bold">{passport.bloodType}</p>
              </div>
              <div>
                <p className="text-rose-500/80 text-[10px] uppercase">Allergies</p>
                <p className="font-bold">{passport.allergies.join(", ") || "—"}</p>
              </div>
              <div>
                <p className="text-rose-500/80 text-[10px] uppercase">Conditions</p>
                <p className="font-bold">{passport.conditions.join(", ") || "—"}</p>
              </div>
              <div>
                <p className="text-rose-500/80 text-[10px] uppercase">Medications</p>
                <p className="font-bold">{passport.medications.slice(0, 3).join(", ") || "—"}</p>
              </div>
            </div>
            <div className="pt-2 border-t border-natural-sage text-xs">
              <p className="text-rose-500/80 text-[10px] uppercase">Emergency Contact</p>
              <p className="font-bold">{passport.emergencyContact.name}</p>
              <p className="font-mono text-rose-700">{passport.emergencyContact.phone}</p>
            </div>
            <a
              href={`#emergency-${passport.id}`}
              className="inline-block text-[10px] font-bold uppercase tracking-wider text-rose-600 underline"
            >
              Open Emergency QR View
            </a>
          </div>
        )}
      </div>
    </div>
  );
}

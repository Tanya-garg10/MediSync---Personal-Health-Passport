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
    try {
      const res = await fetch("/api/corsair/calendar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ passportId: passport.id, followUpIndex: index }),
      });
      const data = await res.json();
      if (!res.ok) {
        setCalendarMsg(data.error || "Corsair calendar unavailable");
        return;
      }
      setCalendarMsg("Follow-up created in Google Calendar via Corsair.");
    } catch (e: any) {
      setCalendarMsg(e?.message || "Corsair request failed");
    }
  };

  return (
    <div className="bg-white rounded-[32px] border border-natural-sage shadow-sm overflow-hidden" id="bindu-agent-hub">
      <div className="px-6 py-5 border-b border-natural-sage/50 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-[10px] font-mono font-bold uppercase tracking-wider text-natural-olive">
            Bindu Hub
          </p>
          <h3 className="font-serif text-lg text-natural-dark">Multi-Agent Health Intelligence</h3>
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
                ? "bg-natural-sage/50 text-natural-dark"
                : "text-stone-500 hover:text-natural-dark"
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
          <div className="space-y-2 rounded-2xl border border-natural-sage p-4 bg-natural-bg/30">
            {steps.map((s, i) => (
              <div key={i} className="flex items-start gap-2 text-xs">
                {s.status === "done" ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                ) : s.status === "running" ? (
                  <Loader2 className="w-4 h-4 animate-spin text-natural-olive" />
                ) : (
                  <span className="w-4 h-4 rounded-full border border-stone-300" />
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
              className="text-xs font-bold px-3 py-2 rounded-xl border border-natural-olive/30 text-natural-olive"
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
                      className="inline-flex items-center gap-1 font-bold text-natural-olive"
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
              <p className="text-xs text-stone-500">
                Evidence-backed trends appear here from recorded numeric observations only.
              </p>
            ) : (
              trends.map((t, i) => (
                <div key={i} className="rounded-2xl border border-natural-sage p-4">
                  <p className="font-serif text-sm text-natural-dark">
                    {t.name} {t.unit && <span className="text-stone-400">({t.unit})</span>}
                  </p>
                  <p className="text-xs text-stone-600 mt-1">{t.summary}</p>
                  {t.points.length > 0 && (
                    <p className="text-[11px] font-mono text-natural-olive mt-2">
                      {t.points.map((p) => `${p.date}: ${p.value}`).join(" · ")}
                    </p>
                  )}
                  <p className="text-[10px] text-stone-400 mt-2">
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
              <p className="text-xs text-stone-500">
                Click Prepare Doctor Visit to generate an evidence-backed clinician brief.
              </p>
            )}
            {brief && (
              <div className="space-y-4 text-xs">
                <div>
                  <p className="text-[10px] font-mono uppercase tracking-wider text-natural-olive">
                    Doctor Visit Brief
                  </p>
                  <h4 className="font-serif text-xl text-natural-dark mt-1">{brief.patientName}</h4>
                </div>
                <section>
                  <h5 className="font-bold text-natural-dark mb-1">Known Conditions</h5>
                  <p>{brief.knownConditions.join(" · ") || "None recorded"}</p>
                </section>
                <section>
                  <h5 className="font-bold text-natural-dark mb-1">Current Medication</h5>
                  <ul className="list-disc pl-4">
                    {brief.currentMedications.map((m, i) => (
                      <li key={i}>{m}</li>
                    ))}
                  </ul>
                </section>
                <section>
                  <h5 className="font-bold text-natural-dark mb-1">Recent Clinical Events</h5>
                  <ul className="space-y-1">
                    {brief.recentEvents.map((e, i) => (
                      <li key={i}>
                        {e.date} — {e.title}
                      </li>
                    ))}
                  </ul>
                </section>
                <section>
                  <h5 className="font-bold text-natural-dark mb-1">Recorded Trends</h5>
                  {brief.trends
                    .filter((t) => t.direction !== "insufficient_data")
                    .map((t, i) => (
                      <p key={i} className="mb-1">
                        {t.name}: {t.points.map((p) => p.value).join(" → ")} {t.unit}
                      </p>
                    ))}
                </section>
                <section>
                  <h5 className="font-bold text-natural-dark mb-1">Latest Results</h5>
                  <ul className="space-y-1">
                    {brief.latestResults.map((r, i) => (
                      <li key={i}>
                        {r.name} {r.value} {r.unit}
                      </li>
                    ))}
                  </ul>
                </section>
                <section>
                  <h5 className="font-bold text-natural-dark mb-1">Allergies</h5>
                  <p>{brief.allergies.join(", ") || "None recorded"}</p>
                </section>
                <p className="text-[10px] text-stone-400">
                  Sources: {brief.sources.length} medical records · Last updated{" "}
                  {new Date(brief.lastUpdated).toLocaleDateString()}
                </p>
              </div>
            )}
          </div>
        )}

        {tab === "emergency" && (
          <div className="rounded-2xl bg-[#1a1a10] text-white p-5 space-y-3">
            <p className="text-[10px] font-mono uppercase tracking-wider text-rose-300">
              Emergency Health Passport
            </p>
            <h4 className="font-serif text-2xl">{passport.fullName}</h4>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <p className="text-rose-300/80 text-[10px] uppercase">Blood Group</p>
                <p className="font-bold">{passport.bloodType}</p>
              </div>
              <div>
                <p className="text-rose-300/80 text-[10px] uppercase">Allergies</p>
                <p className="font-bold">{passport.allergies.join(", ") || "—"}</p>
              </div>
              <div>
                <p className="text-rose-300/80 text-[10px] uppercase">Conditions</p>
                <p className="font-bold">{passport.conditions.join(", ") || "—"}</p>
              </div>
              <div>
                <p className="text-rose-300/80 text-[10px] uppercase">Medications</p>
                <p className="font-bold">{passport.medications.slice(0, 3).join(", ") || "—"}</p>
              </div>
            </div>
            <div className="pt-2 border-t border-white/10 text-xs">
              <p className="text-rose-300/80 text-[10px] uppercase">Emergency Contact</p>
              <p className="font-bold">{passport.emergencyContact.name}</p>
              <p className="font-mono text-rose-100">{passport.emergencyContact.phone}</p>
            </div>
            <a
              href={`#emergency-${passport.id}`}
              className="inline-block text-[10px] font-bold uppercase tracking-wider text-rose-200 underline"
            >
              Open Emergency QR View
            </a>
          </div>
        )}
      </div>
    </div>
  );
}

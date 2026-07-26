import type { ClinicalObservation, InsightTrend, PassportData, DoctorBrief } from "../../types.js";

function toNumber(v: number | string): number | null {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  const n = parseFloat(String(v).replace(/,/g, ""));
  return Number.isFinite(n) ? n : null;
}

export function collectObservations(passport: PassportData): ClinicalObservation[] {
  const out: ClinicalObservation[] = [];
  for (const evt of passport.timeline || []) {
    if (evt.observations?.length) {
      out.push(...evt.observations);
      continue;
    }
    if (!evt.findings) continue;
    const re =
      /([A-Za-z][A-Za-z0-9\s/%-]{1,40}?)\s*[:=]\s*([\d.]+)\s*([a-zA-Z/%µμ^0-9.]*)/g;
    let m: RegExpExecArray | null;
    while ((m = re.exec(evt.findings)) !== null) {
      out.push({
        name: m[1].trim(),
        value: m[2],
        unit: (m[3] || "").trim(),
        date: evt.date,
        source: evt.sourceDocument || evt.title || evt.id,
      });
    }
  }
  return out;
}

export function runInsightAgent(observations: ClinicalObservation[]): InsightTrend[] {
  const byName = new Map<string, ClinicalObservation[]>();
  for (const obs of observations) {
    const key = obs.name.trim().toLowerCase();
    if (!key) continue;
    const list = byName.get(key) || [];
    list.push(obs);
    byName.set(key, list);
  }

  const trends: InsightTrend[] = [];
  for (const [, list] of byName) {
    const points = list
      .map((o) => {
        const value = toNumber(o.value);
        if (value === null) return null;
        return { date: o.date, value, source: o.source };
      })
      .filter(Boolean) as Array<{ date: string; value: number; source: string }>;

    points.sort((a, b) => a.date.localeCompare(b.date));
    const unit = list[0]?.unit || "";
    const name = list[0]?.name || "";
    const sources = [...new Set(points.map((p) => p.source))];

    if (points.length < 2) {
      trends.push({
        name,
        unit,
        points,
        direction: "insufficient_data",
        summary:
          points.length === 1
            ? `Single recorded ${name} value: ${points[0].value} ${unit}`.trim()
            : `No numeric series for ${name}.`,
        sources,
      });
      continue;
    }

    const first = points[0].value;
    const last = points[points.length - 1].value;
    const delta = last - first;
    const rel = Math.abs(delta) / (Math.abs(first) || 1);
    let direction: InsightTrend["direction"] = "stable";
    if (rel > 0.03) direction = delta < 0 ? "decreasing" : "increasing";

    const series = points.map((p) => `${p.value}`).join(" → ");
    trends.push({
      name,
      unit,
      points,
      direction,
      summary: `Recorded ${name} values show a ${direction} trend (${series} ${unit}).`.trim(),
      sources,
    });
  }

  return trends;
}

export function buildDoctorBrief(passport: PassportData, trends: InsightTrend[]): DoctorBrief {
  const observations = collectObservations(passport);
  const latestByName = new Map<string, ClinicalObservation>();
  const sorted = [...observations].sort((a, b) => b.date.localeCompare(a.date));
  for (const o of sorted) {
    const key = o.name.toLowerCase();
    if (!latestByName.has(key)) latestByName.set(key, o);
  }

  const recentEvents = [...(passport.timeline || [])]
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 5)
    .map((e) => ({ date: e.date, title: e.title, recordType: e.recordType }));

  const sources = [
    ...new Set(
      (passport.timeline || []).map((e) => e.sourceDocument || e.title).filter(Boolean) as string[]
    ),
  ];

  return {
    patientName: passport.fullName,
    knownConditions: passport.conditions || [],
    currentMedications: passport.medications || [],
    allergies: passport.allergies || [],
    recentEvents,
    trends: trends.filter((t) => t.direction !== "insufficient_data" || t.points.length > 0),
    latestResults: [...latestByName.values()].slice(0, 12),
    sources,
    lastUpdated: passport.updatedAt || new Date().toISOString(),
  };
}

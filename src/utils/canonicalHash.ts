import crypto from "crypto";
import type { CanonicalRecord, ClinicalObservation } from "../types.js";

function normalizeStr(s: string): string {
  return String(s || "").trim().toLowerCase();
}

function sortTests(
  tests: Array<{ name: string; value: string; unit: string }>
): Array<{ name: string; value: string; unit: string }> {
  return [...tests]
    .map((t) => ({
      name: normalizeStr(t.name),
      value: String(t.value ?? "").trim(),
      unit: normalizeStr(t.unit),
    }))
    .sort((a, b) => a.name.localeCompare(b.name) || a.value.localeCompare(b.value));
}

export function serializeCanonicalRecord(record: CanonicalRecord): string {
  const payload = {
    recordId: String(record.recordId || "").trim(),
    date: String(record.date || "").trim(),
    type: normalizeStr(record.type),
    tests: sortTests(record.tests || []),
    medications: [...(record.medications || [])].map(normalizeStr).filter(Boolean).sort(),
    conditions: [...(record.conditions || [])].map(normalizeStr).filter(Boolean).sort(),
    sourceDocumentHash: String(record.sourceDocumentHash || "").trim().toLowerCase(),
  };
  return JSON.stringify(payload);
}

export function hashCanonicalRecord(record: CanonicalRecord): string {
  return crypto.createHash("sha256").update(serializeCanonicalRecord(record), "utf8").digest("hex");
}

export function hashSourceDocument(rawText: string): string {
  return crypto.createHash("sha256").update(rawText || "", "utf8").digest("hex");
}

export function buildCanonicalFromEvent(event: {
  id: string;
  date: string;
  recordType: string;
  findings?: string;
  medications?: string[];
  conditions?: string[];
  observations?: ClinicalObservation[];
  rawTextSource?: string;
  sourceDocumentHash?: string;
}): CanonicalRecord {
  const tests =
    event.observations?.map((o) => ({
      name: o.name,
      value: String(o.value),
      unit: o.unit,
    })) || [];

  if (tests.length === 0 && event.findings) {
    const re =
      /([A-Za-z][A-Za-z0-9\s/%-]{1,40}?)\s*[:=]\s*([\d.]+)\s*([a-zA-Z/%µμ^0-9.]*)/g;
    let m: RegExpExecArray | null;
    while ((m = re.exec(event.findings)) !== null) {
      tests.push({ name: m[1].trim(), value: m[2], unit: (m[3] || "").trim() });
    }
  }

  return {
    recordId: event.id,
    date: event.date,
    type: event.recordType,
    tests,
    medications: event.medications || [],
    conditions: event.conditions || [],
    sourceDocumentHash:
      event.sourceDocumentHash || hashSourceDocument(event.rawTextSource || ""),
  };
}

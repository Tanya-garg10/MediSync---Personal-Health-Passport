import type { GoogleGenAI } from "@google/genai";
import { Type } from "@google/genai";
import type { StructuredDocument, ClinicalObservation } from "../../types.js";

export class AiUnavailableError extends Error {
  reason: string;
  constructor(reason = "Gemini service unavailable") {
    super("AI analysis unavailable");
    this.name = "AiUnavailableError";
    this.reason = reason;
  }
}

function addMonths(isoDate: string, months: number): string {
  const d = new Date(isoDate + "T00:00:00Z");
  if (Number.isNaN(d.getTime())) {
    const now = new Date();
    now.setUTCMonth(now.getUTCMonth() + months);
    return now.toISOString().slice(0, 10);
  }
  d.setUTCMonth(d.getUTCMonth() + months);
  return d.toISOString().slice(0, 10);
}

function parseFollowUp(text: string, reportDate: string): StructuredDocument["followUp"] {
  const lower = text.toLowerCase();
  const m = lower.match(/follow[\s-]?up\s+(?:after|in)\s+(\d+)\s+(month|week|day)/);
  if (!m) return null;
  const n = parseInt(m[1], 10);
  const unit = m[2];
  let date = reportDate;
  if (unit.startsWith("month")) date = addMonths(reportDate, n);
  else if (unit.startsWith("week")) {
    const d = new Date(reportDate + "T00:00:00Z");
    d.setUTCDate(d.getUTCDate() + n * 7);
    date = d.toISOString().slice(0, 10);
  } else {
    const d = new Date(reportDate + "T00:00:00Z");
    d.setUTCDate(d.getUTCDate() + n);
    date = d.toISOString().slice(0, 10);
  }
  return {
    recommendedDate: date,
    note: `Follow-up in ${n} ${unit}${n > 1 ? "s" : ""}`,
    source: "document",
  };
}

function field(text: string, label: string): string {
  const re = new RegExp(label + "\\s*[:\\-]\\s*(.+)", "i");
  const m = text.match(re);
  return m ? m[1].split("\n")[0].trim() : "";
}

function structureFromTextOnly(rawText: string, sourceFileName: string): StructuredDocument {
  const dateMatch = rawText.match(
    /(?:Date|Report Date)\s*[:\-]?\s*(\d{4}-\d{2}-\d{2}|\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/i
  );
  let date = new Date().toISOString().slice(0, 10);
  if (dateMatch) {
    const raw = dateMatch[1];
    if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) date = raw;
  }

  const skipNames = /^(date|patient|facility|clinician|report type|advice|findings|report)$/i;
  const tests: ClinicalObservation[] = [];
  for (const line of rawText.split(/\r?\n/)) {
    const m = line.match(
      /^\s*([A-Za-z][A-Za-z0-9\s/%-]{0,40}?)\s*[:=]\s*([\d.]+)\s*([a-zA-Z/%µμ^0-9.]*)\s*$/
    );
    if (!m) continue;
    const name = m[1].trim();
    if (skipNames.test(name)) continue;
    tests.push({
      name,
      value: m[2],
      unit: (m[3] || "").trim(),
      date,
      source: sourceFileName,
    });
  }

  if (tests.length === 0) {
    throw new AiUnavailableError(
      "No structured lab values found in text and Gemini is unavailable"
    );
  }

  const findingsLine = field(rawText, "Findings");
  const reportType = field(rawText, "Report Type") || "Laboratory Report";

  return {
    documentType: reportType,
    date,
    facility: field(rawText, "Facility"),
    clinician: field(rawText, "Clinician"),
    tests,
    medications: [],
    conditions: [],
    findings: findingsLine ? [findingsLine] : tests.map((t) => `${t.name}: ${t.value} ${t.unit}`),
    followUp: parseFollowUp(rawText, date),
    source: sourceFileName,
    rawText,
  };
}

export async function runDocumentAgent(
  ai: GoogleGenAI | null,
  rawText: string,
  sourceFileName: string
): Promise<StructuredDocument> {
  if (!ai) {
    return structureFromTextOnly(rawText, sourceFileName);
  }

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Extract structured clinical data from this medical document text. Only use values present in the text. Do not invent labs, clinicians, or facilities.\n\nSOURCE FILE: ${sourceFileName}\n\nDOCUMENT:\n${rawText}`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            documentType: { type: Type.STRING },
            date: { type: Type.STRING },
            facility: { type: Type.STRING },
            clinician: { type: Type.STRING },
            tests: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  value: { type: Type.STRING },
                  unit: { type: Type.STRING },
                },
                required: ["name", "value", "unit"],
              },
            },
            medications: { type: Type.ARRAY, items: { type: Type.STRING } },
            conditions: { type: Type.ARRAY, items: { type: Type.STRING } },
            findings: { type: Type.ARRAY, items: { type: Type.STRING } },
            followUpNote: { type: Type.STRING },
          },
          required: ["documentType", "date", "tests", "findings"],
        },
      },
    });

    const parsed = JSON.parse(response.text || "{}");
    const date = parsed.date || new Date().toISOString().slice(0, 10);
    const tests: ClinicalObservation[] = (parsed.tests || []).map(
      (t: { name: string; value: string; unit: string }) => ({
        name: t.name,
        value: t.value,
        unit: t.unit || "",
        date,
        source: sourceFileName,
      })
    );

    const followUp =
      parseFollowUp(rawText + " " + (parsed.followUpNote || ""), date) ||
      (parsed.followUpNote
        ? {
            recommendedDate: addMonths(date, 3),
            note: String(parsed.followUpNote),
            source: sourceFileName,
          }
        : null);

    return {
      documentType: parsed.documentType || "Medical Report",
      date,
      facility: parsed.facility || "",
      clinician: parsed.clinician || "",
      tests,
      medications: parsed.medications || [],
      conditions: parsed.conditions || [],
      findings: parsed.findings || [],
      followUp,
      source: sourceFileName,
      rawText,
    };
  } catch (err: any) {
    if (err instanceof AiUnavailableError) throw err;
    try {
      return structureFromTextOnly(rawText, sourceFileName);
    } catch {
      throw new AiUnavailableError(err?.message || "Gemini service unavailable");
    }
  }
}

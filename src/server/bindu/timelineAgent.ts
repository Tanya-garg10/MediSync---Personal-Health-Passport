import type { PassportData, StructuredDocument, TimelineEvent, RecordType } from "../../types.js";
import { hashSourceDocument } from "../../utils/canonicalHash.js";

function mapRecordType(documentType: string): RecordType {
  const t = documentType.toLowerCase();
  if (t.includes("lab") || t.includes("blood") || t.includes("metabolic")) return "Laboratory";
  if (t.includes("scan") || t.includes("mri") || t.includes("x-ray") || t.includes("imaging"))
    return "Scan/Imaging";
  if (t.includes("prescri") || t.includes("medication")) return "Prescription";
  if (t.includes("surg")) return "Surgery";
  if (t.includes("vaccin")) return "Vaccination";
  if (t.includes("consult")) return "Consultation";
  return "Other";
}

export function runTimelineAgent(
  document: StructuredDocument,
  _passport: PassportData
): TimelineEvent {
  const findings =
    document.findings.length > 0
      ? document.findings.join(" ")
      : document.tests
          .map((t) => `${t.name}: ${t.value} ${t.unit}`.trim())
          .join(". ");

  const id = `evt-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;

  return {
    id,
    date: document.date,
    title: document.documentType || "Medical Record",
    recordType: mapRecordType(document.documentType),
    severity: "Low",
    clinician: document.clinician || "",
    facility: document.facility || "",
    findings,
    nextSteps: document.followUp?.note || "",
    rawTextSource: document.rawText,
    sourceDocument: document.source,
    sourceDocumentHash: hashSourceDocument(document.rawText || ""),
    observations: document.tests,
    medications: document.medications,
    conditions: document.conditions,
    stellarStatus: "not_verified",
  };
}

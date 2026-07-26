export type RecordType =
  | "Consultation"
  | "Laboratory"
  | "Scan/Imaging"
  | "Prescription"
  | "Surgery"
  | "Vaccination"
  | "Other";

export type SeverityLevel = "Low" | "Medium" | "High";

export interface ClinicalObservation {
  name: string;
  value: number | string;
  unit: string;
  date: string;
  source: string;
}

export interface TimelineEvent {
  id: string;
  date: string;
  title: string;
  recordType: RecordType;
  severity: SeverityLevel;
  clinician: string;
  facility: string;
  findings: string;
  nextSteps: string;
  rawTextSource?: string;
  sourceDocument?: string;
  sourceDocumentHash?: string;
  observations?: ClinicalObservation[];
  medications?: string[];
  conditions?: string[];
  stellarHash?: string;
  stellarTxId?: string;
  stellarTimestamp?: string;
  stellarStatus?: "verified" | "failed" | "not_verified";
  stellarContractId?: string;
}

export interface EmergencyContact {
  name: string;
  phone: string;
  relation: string;
}

export interface StellarConsent {
  id: string;
  reportId: string;
  doctorName: string;
  permission: "Read Only" | "Full Access";
  expiryHours: number;
  expiryTime: number;
  createdAt: string;
  stellarTxId?: string;
  isValid?: boolean;
}

export interface FollowUpSuggestion {
  recommendedDate: string;
  note: string;
  source: string;
}

export interface PassportData {
  id: string;
  fullName: string;
  dateOfBirth: string;
  bloodType: string;
  allergies: string[];
  conditions: string[];
  medications: string[];
  emergencyContact: EmergencyContact;
  timeline: TimelineEvent[];
  updatedAt: string;
  stellarConsents?: StellarConsent[];
  pendingFollowUps?: FollowUpSuggestion[];
}

export interface CanonicalRecord {
  recordId: string;
  date: string;
  type: string;
  tests: Array<{ name: string; value: string; unit: string }>;
  medications: string[];
  conditions: string[];
  sourceDocumentHash: string;
}

export interface StructuredDocument {
  documentType: string;
  date: string;
  facility: string;
  clinician: string;
  tests: ClinicalObservation[];
  medications: string[];
  conditions: string[];
  findings: string[];
  followUp?: FollowUpSuggestion | null;
  source: string;
  rawText?: string;
}

export interface AgentStepStatus {
  agent: "document" | "timeline" | "insight" | "orchestrator";
  status: "pending" | "running" | "done" | "error";
  message: string;
}

export interface InsightTrend {
  name: string;
  unit: string;
  points: Array<{ date: string; value: number; source: string }>;
  direction: "increasing" | "decreasing" | "stable" | "insufficient_data";
  summary: string;
  sources: string[];
}

export interface DoctorBrief {
  patientName: string;
  knownConditions: string[];
  currentMedications: string[];
  allergies: string[];
  recentEvents: Array<{ date: string; title: string; recordType: string }>;
  trends: InsightTrend[];
  latestResults: ClinicalObservation[];
  sources: string[];
  lastUpdated: string;
}

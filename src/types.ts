/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type RecordType =
  | "Consultation"
  | "Laboratory"
  | "Scan/Imaging"
  | "Prescription"
  | "Surgery"
  | "Vaccination"
  | "Other";

export type SeverityLevel = "Low" | "Medium" | "High";

export interface TimelineEvent {
  id: string;
  date: string; // YYYY-MM-DD
  title: string;
  recordType: RecordType;
  severity: SeverityLevel;
  clinician: string;
  facility: string;
  findings: string;
  nextSteps: string;
  rawTextSource?: string;
  // Stellar Blockchain Integration Fields
  stellarHash?: string;
  stellarTxId?: string;
  stellarTimestamp?: string;
  stellarStatus?: "verified" | "failed" | "not_verified";
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
  expiryHours: number; // 1, 24, 168 (7 days)
  expiryTime: number; // unix timestamp in seconds
  createdAt: string;
  stellarTxId?: string;
  isValid?: boolean;
}

export interface PassportData {
  id: string; // unique ID for public sharing
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
}

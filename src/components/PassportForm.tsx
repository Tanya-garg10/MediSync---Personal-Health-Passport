/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { Plus, X, Heart, ShieldAlert, Truck, UserCheck, Calendar, Download } from "lucide-react";
import { PassportData, EmergencyContact } from "../types";

interface PassportFormProps {
  passport: PassportData;
  onSave: (updated: PassportData) => void;
}

export default function PassportForm({ passport, onSave }: PassportFormProps) {
  const [fullName, setFullName] = useState(passport.fullName);
  const [dateOfBirth, setDateOfBirth] = useState(passport.dateOfBirth);
  const [bloodType, setBloodType] = useState(passport.bloodType || "O-Positive");
  const [emergencyContact, setEmergencyContact] = useState<EmergencyContact>(
    passport.emergencyContact || { name: "", phone: "", relation: "" }
  );

  // Lists with editable tag pools
  const [allergies, setAllergies] = useState<string[]>(passport.allergies || []);
  const [conditions, setConditions] = useState<string[]>(passport.conditions || []);
  const [medications, setMedications] = useState<string[]>(passport.medications || []);

  // Simple string trackers for adding next items
  const [newAllergy, setNewAllergy] = useState("");
  const [newCondition, setNewCondition] = useState("");
  const [newMedication, setNewMedication] = useState("");

  const [activeTab, setActiveTab] = useState<"vitals" | "allergies" | "conditions" | "meds">("vitals");

  const downloadBackupJSON = () => {
    const backupData = {
      fullName,
      dateOfBirth,
      bloodType,
      emergencyContact,
      allergies,
      conditions,
      medications,
      exportedAt: new Date().toISOString(),
      app: "MediSync Patient Passport",
    };

    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(backupData, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    
    const nameSlug = fullName.toLowerCase().trim().replace(/[^a-z0-9]+/g, "_") || "medical_passport";
    downloadAnchor.setAttribute("download", `${nameSlug}_profile_backup.json`);
    
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const saveChanges = () => {
    const updated: PassportData = {
      ...passport,
      fullName,
      dateOfBirth,
      bloodType,
      emergencyContact,
      allergies,
      conditions,
      medications,
    };
    onSave(updated);
  };

  const handleAddAllergy = (e: React.FormEvent) => {
    e.preventDefault();
    if (newAllergy.trim() && !allergies.includes(newAllergy.trim())) {
      setAllergies([...allergies, newAllergy.trim()]);
      setNewAllergy("");
    }
  };

  const handleRemoveAllergy = (val: string) => {
    setAllergies(allergies.filter((a) => a !== val));
  };

  const handleAddCondition = (e: React.FormEvent) => {
    e.preventDefault();
    if (newCondition.trim() && !conditions.includes(newCondition.trim())) {
      setConditions([...conditions, newCondition.trim()]);
      setNewCondition("");
    }
  };

  const handleRemoveCondition = (val: string) => {
    setConditions(conditions.filter((c) => c !== val));
  };

  const handleAddMedication = (e: React.FormEvent) => {
    e.preventDefault();
    if (newMedication.trim() && !medications.includes(newMedication.trim())) {
      setMedications([...medications, newMedication.trim()]);
      setNewMedication("");
    }
  };

  const handleRemoveMedication = (val: string) => {
    setMedications(medications.filter((m) => m !== val));
  };

  return (
    <div className="bg-card-bg rounded-[32px] border border-natural-sage shadow-sm overflow-hidden flex flex-col">
      {/* Clinician Alert Banner */}
      <div className="bg-natural-olive text-white px-6 py-5 flex items-center justify-between gap-4">
        <div>
          <h3 className="text-sm font-semibold flex items-center gap-1.5">
            <UserCheck className="w-4.5 h-4.5" />
            Verified Medical Identification
          </h3>
          <p className="text-[10px] text-natural-sage mt-0.5">
            Core clinician alert passport datasets which stay editable by the owner.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={downloadBackupJSON}
            title="Download JSON Backup"
            className="bg-natural-olive hover:bg-white/10 text-white font-bold border border-white/20 px-3 py-2 rounded-2xl text-xs transition-colors shadow-xs flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Backup JSON</span>
          </button>
          <button
            onClick={saveChanges}
            className="bg-natural-bg hover:bg-white text-natural-olive font-bold border border-natural-olive/20 px-4 py-2 rounded-2xl text-xs transition-colors shadow-xs"
          >
            Save Passport
          </button>
        </div>
      </div>

      {/* Tabs list */}
      <div className="flex border-b border-natural-sage/50 bg-natural-sage/20 p-2.5 gap-1.5 text-xs">
        <button
          onClick={() => setActiveTab("vitals")}
          className={`flex-1 py-2 rounded-xl font-medium transition-all ${
            activeTab === "vitals" ? "bg-card-bg text-natural-dark font-bold shadow-xs border border-natural-sage/40" : "text-natural-olive/70 hover:text-natural-dark hover:bg-card-bg/40"
          }`}
        >
          Vitals & Emergency
        </button>
        <button
          onClick={() => setActiveTab("allergies")}
          className={`flex-1 py-2 rounded-xl font-medium transition-all ${
            activeTab === "allergies" ? "bg-card-bg text-natural-dark font-bold shadow-xs border border-natural-sage/40" : "text-natural-olive/70 hover:text-natural-dark hover:bg-card-bg/40"
          }`}
        >
          Allergies ({allergies.length})
        </button>
        <button
          onClick={() => setActiveTab("conditions")}
          className={`flex-1 py-2 rounded-xl font-medium transition-all ${
            activeTab === "conditions" ? "bg-card-bg text-natural-dark font-bold shadow-xs border border-natural-sage/40" : "text-natural-olive/70 hover:text-natural-dark hover:bg-card-bg/40"
          }`}
        >
          Conditions ({conditions.length})
        </button>
        <button
          onClick={() => setActiveTab("meds")}
          className={`flex-1 py-2 rounded-xl font-medium transition-all ${
            activeTab === "meds" ? "bg-card-bg text-natural-dark font-bold shadow-xs border border-natural-sage/40" : "text-natural-olive/70 hover:text-natural-dark hover:bg-card-bg/40"
          }`}
        >
          Meds ({medications.length})
        </button>
      </div>

      {/* Content panes */}
      <div className="p-6 flex-1 text-xs text-slate-700">
        {activeTab === "vitals" && (
          <div className="space-y-5 animate-fade-in">
            <h4 className="font-serif text-natural-dark font-bold flex items-center gap-1.5 text-sm mb-3 border-b border-natural-sage pb-2">
              <ShieldAlert className="w-4 h-4 text-natural-olive" /> Vitals Identification
            </h4>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] uppercase font-mono font-bold text-[#5a5a40]/70 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full text-xs p-3 rounded-xl border border-natural-sage focus:outline-none focus:border-natural-olive focus:ring-1 focus:ring-natural-olive bg-natural-bg/50 text-natural-dark"
                  placeholder="e.g. Aarav Sharma"
                />
              </div>
              <div>
                <label className="block text-[10px] uppercase font-mono font-bold text-[#5a5a40]/70 mb-1">
                  Date of Birth
                </label>
                <div className="relative">
                  <input
                    type="date"
                    value={dateOfBirth}
                    onChange={(e) => setDateOfBirth(e.target.value)}
                    className="w-full text-xs p-3 rounded-xl border border-natural-sage focus:outline-none focus:border-natural-olive focus:ring-1 focus:ring-natural-olive bg-natural-bg/50 text-natural-dark"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-[10px] uppercase font-mono font-bold text-[#5a5a40]/70 mb-1">
                Blood Group Type
              </label>
              <select
                value={bloodType}
                onChange={(e) => setBloodType(e.target.value)}
                className="w-full text-xs p-3 rounded-xl border border-natural-sage focus:outline-none focus:border-natural-olive focus:ring-1 focus:ring-natural-olive bg-natural-bg/50 font-medium text-natural-dark"
              >
                <option value="A-Positive">A-Positive (A+)</option>
                <option value="A-Negative">A-Negative (A-)</option>
                <option value="B-Positive">B-Positive (B+)</option>
                <option value="B-Negative">B-Negative (B-)</option>
                <option value="AB-Positive">AB-Positive (AB+)</option>
                <option value="AB-Negative">AB-Negative (AB-)</option>
                <option value="O-Positive">O-Positive (O+)</option>
                <option value="O-Negative">O-Negative (O-)</option>
              </select>
            </div>

            <h4 className="font-serif text-natural-dark font-bold flex items-center gap-1.5 text-sm pt-2 border-b border-natural-sage pb-2">
              <Truck className="w-4 h-4 text-natural-olive" /> Emergency Response Contact
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-[10px] uppercase font-mono font-bold text-[#5a5a40]/70 mb-1">
                  Contact Person
                </label>
                <input
                  type="text"
                  value={emergencyContact.name}
                  onChange={(e) => setEmergencyContact({ ...emergencyContact, name: e.target.value })}
                  className="w-full text-xs p-3 rounded-xl border border-natural-sage focus:outline-none focus:border-natural-olive focus:ring-1 focus:ring-natural-olive bg-natural-bg/50 text-natural-dark"
                  placeholder="e.g. Priyah Sharma"
                />
              </div>
              <div>
                <label className="block text-[10px] uppercase font-mono font-bold text-[#5a5a40]/70 mb-1">
                  Phone Number
                </label>
                <input
                  type="text"
                  value={emergencyContact.phone}
                  onChange={(e) => setEmergencyContact({ ...emergencyContact, phone: e.target.value })}
                  className="w-full text-xs p-3 rounded-xl border border-natural-sage focus:outline-none focus:border-natural-olive focus:ring-1 focus:ring-natural-olive bg-natural-bg/50 font-mono text-natural-dark"
                  placeholder="e.g. +91 9453..."
                />
              </div>
              <div>
                <label className="block text-[10px] uppercase font-mono font-bold text-[#5a5a40]/70 mb-1">
                  Relationship
                </label>
                <input
                  type="text"
                  value={emergencyContact.relation}
                  onChange={(e) => setEmergencyContact({ ...emergencyContact, relation: e.target.value })}
                  className="w-full text-xs p-3 rounded-xl border border-natural-sage focus:outline-none focus:border-natural-olive focus:ring-1 focus:ring-natural-olive bg-natural-bg/50 text-natural-dark"
                  placeholder="e.g. Spouse"
                />
              </div>
            </div>
          </div>
        )}

        {activeTab === "allergies" && (
          <div className="space-y-4 animate-fade-in">
            <h4 className="font-serif text-natural-dark font-bold flex items-center gap-1.5 text-sm mb-1">
              <ShieldAlert className="w-4.5 h-4.5 text-red-700" /> Drug & Food Allergies
            </h4>
            <p className="text-[11px] text-natural-text/70 mt-0.5 leading-relaxed">
              Doctors will check this list immediately before prescribing therapy. Avoid Penicillin/Sulfonamides as relevant.
            </p>

            <form onSubmit={handleAddAllergy} className="flex gap-2">
              <input
                type="text"
                placeholder="Type and press add (e.g. Latex, Penicillin)"
                value={newAllergy}
                onChange={(e) => setNewAllergy(e.target.value)}
                className="flex-1 text-xs p-3 rounded-xl border border-natural-sage focus:outline-none focus:border-natural-olive focus:ring-1 focus:ring-natural-olive text-natural-dark bg-natural-bg/30"
              />
              <button
                type="submit"
                className="bg-natural-olive hover:bg-natural-olive/90 text-white px-4 py-2.5 rounded-xl flex items-center gap-1 font-bold shadow-sm"
              >
                <Plus className="w-3.5 h-3.5" /> Add
              </button>
            </form>

            <div className="flex flex-wrap gap-1.5 pt-2">
              {allergies.length === 0 ? (
                <span className="text-[11px] text-natural-[#raw]/50 italic">No listed allergen sensitivities.</span>
              ) : (
                allergies.map((a) => (
                  <span
                    key={a}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-red-50 border border-red-100 text-red-900 text-[10px] font-bold"
                  >
                    <span>{a}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveAllergy(a)}
                      className="text-red-400 hover:text-red-700"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))
              )}
            </div>
          </div>
        )}

        {activeTab === "conditions" && (
          <div className="space-y-4 animate-fade-in">
            <h4 className="font-serif text-natural-dark font-bold flex items-center gap-1.5 text-sm mb-1">
              <Heart className="w-4.5 h-4.5 text-natural-olive" /> Chronic Conditions & Disorders
            </h4>
            <p className="text-[11px] text-natural-text/70 mt-0.5 leading-relaxed">
              Active long-term ailments that dictate therapeutic choices.
            </p>

            <form onSubmit={handleAddCondition} className="flex gap-2">
              <input
                type="text"
                placeholder="Type and press add (e.g. Type-2 Diabetes)"
                value={newCondition}
                onChange={(e) => setNewCondition(e.target.value)}
                className="flex-1 text-xs p-3 rounded-xl border border-natural-sage focus:outline-none focus:border-natural-olive focus:ring-1 focus:ring-natural-olive text-natural-dark bg-natural-bg/30"
              />
              <button
                type="submit"
                className="bg-natural-olive hover:bg-natural-olive/90 text-white px-4 py-2.5 rounded-xl flex items-center gap-1 font-bold shadow-sm"
              >
                <Plus className="w-3.5 h-3.5" /> Add
              </button>
            </form>

            <div className="flex flex-wrap gap-1.5 pt-2">
              {conditions.length === 0 ? (
                <span className="text-[11px] text-natural-olive/50 italic">No chronic illnesses compiled.</span>
              ) : (
                conditions.map((c) => (
                  <span
                    key={c}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-natural-sage border border-natural-olive/20 text-natural-dark font-semibold text-[10px]"
                  >
                    <span>{c}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveCondition(c)}
                      className="text-natural-olive/40 hover:text-natural-dark"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))
              )}
            </div>
          </div>
        )}

        {activeTab === "meds" && (
          <div className="space-y-4 animate-fade-in">
            <h4 className="font-serif text-natural-dark font-bold flex items-center gap-1.5 text-sm mb-1">
              <ShieldAlert className="w-4.5 h-4.5 text-natural-olive" /> Active Prescriptions & Medications
            </h4>
            <p className="text-[11px] text-natural-text/70 mt-0.5 leading-relaxed">
              Medications current patient is consuming daily/regularly. Helpful to stop hazardous drug-drug interactions.
            </p>

            <form onSubmit={handleAddMedication} className="flex gap-2">
              <input
                type="text"
                placeholder="Type and press add (e.g. Metformin 500mg)"
                value={newMedication}
                onChange={(e) => setNewMedication(e.target.value)}
                className="flex-1 text-xs p-3 rounded-xl border border-natural-sage focus:outline-none focus:border-natural-olive focus:ring-1 focus:ring-natural-olive text-natural-dark bg-natural-bg/30"
              />
              <button
                type="submit"
                className="bg-natural-olive hover:bg-natural-olive/90 text-white px-4 py-2.5 rounded-xl flex items-center gap-1 font-bold shadow-sm"
              >
                <Plus className="w-3.5 h-3.5" /> Add
              </button>
            </form>

            <div className="flex flex-wrap gap-1.5 pt-2">
              {medications.length === 0 ? (
                <span className="text-[11px] text-natural-olive/50 italic">No active daily pharmaceuticals reported.</span>
              ) : (
                medications.map((m) => (
                  <span
                    key={m}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-natural-sage border border-natural-olive/25 text-natural-dark font-medium text-[10px]"
                  >
                    <span>{m}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveMedication(m)}
                      className="text-natural-olive/40 hover:text-natural-dark"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* Save status notification footer */}
      <div className="bg-natural-bg border-t border-natural-sage px-6 py-3.5 flex items-center justify-between text-[10px] uppercase font-mono font-semibold text-natural-olive/60">
        <div className="flex items-center gap-1.5">
          <Calendar className="w-3.5 h-3.5" />
          <span>Last synchronized: {new Date(passport.updatedAt).toLocaleTimeString()}</span>
        </div>
        <span className="font-bold text-natural-olive">Secured Patient Vault Sync</span>
      </div>
    </div>
  );
}

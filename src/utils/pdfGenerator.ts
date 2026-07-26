/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { jsPDF } from "jspdf";
import { PassportData, TimelineEvent } from "../types";

/**
 * Generates and downloads a beautiful, Swiss-style, highly polished PDF
 * containing the patient's sovereign health passport information and medical chronicle.
 */
export function generateMedicalPassportPDF(passport: PassportData) {
  // Create an A4 portrait PDF document (A4 size is 210mm x 297mm)
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageHeight = 297;
  const pageWidth = 210;
  const margin = 20;
  const printableWidth = pageWidth - margin * 2; // 170mm

  let currentY = 15;

  // Color Definitions (MediSync Polish Palette)
  const colors = {
    primaryOlive: [90, 90, 64],    // #5a5a40 Deep Olive
    primaryDark: [26, 26, 16],     // #1a1a10 Charcoal Black
    secondaryText: [100, 100, 85], // Muted slate text
    lightSage: [232, 237, 224],    // #e8ede0 Light Sage background
    warningBg: [254, 242, 242],    // Red-50 bg for allergies
    warningText: [153, 27, 27],    // Red-800 for allergy warnings
    borderSage: [200, 208, 185],   // Darker sage border
    white: [255, 255, 255],
    cardBg: [248, 249, 246]
  };

  // Helper routine to draw a horizontal rule (page divider)
  function drawHorizontalLine(y: number, color = colors.lightSage) {
    doc.setDrawColor(color[0], color[1], color[2]);
    doc.setLineWidth(0.3);
    doc.line(margin, y, margin + printableWidth, y);
  }

  // Page header footer renderer to maintain beautiful headers/footers
  let pageCount = 1;
  function drawPageDetails(pageNum: number) {
    // Draw background borders for high-quality Swiss poster-like structure
    doc.setDrawColor(colors.primaryOlive[0], colors.primaryOlive[1], colors.primaryOlive[2]);
    doc.setLineWidth(0.4);
    // Draw double thin borders around the entire page
    doc.rect(10, 10, pageWidth - 20, pageHeight - 20);
    
    // Draw thin elegant header margin rules
    doc.setDrawColor(colors.borderSage[0], colors.borderSage[1], colors.borderSage[2]);
    doc.setLineWidth(0.25);
    doc.line(10, 16, pageWidth - 10, 16);
    doc.line(10, pageHeight - 16, pageWidth - 10, pageHeight - 16);

    // Render tiny top security header - Aligned precisely to the document margins
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7);
    doc.setTextColor(colors.primaryOlive[0], colors.primaryOlive[1], colors.primaryOlive[2]);
    doc.text("MEDISYNC PERSONAL HEALTH PASSPORT", margin, 14);
    
    doc.setFont("helvetica", "normal");
    doc.setTextColor(colors.secondaryText[0], colors.secondaryText[1], colors.secondaryText[2]);
    doc.text(`STELLAR-BACKED VERIFICATION AVAILABLE`, pageWidth - margin, 14, { align: "right" });

    // Footer page indexes - Aligned precisely to the document margins
    doc.setFontSize(7);
    doc.text(`ISSUED RECORD INDEX: ${passport.id.toUpperCase()}`, margin, pageHeight - 12);
    doc.text(`PAGE ${pageNum}`, pageWidth - margin, pageHeight - 12, { align: "right" });
  }

  // Core page addition wrapper that increments status and redraws page graphics
  function assurePageSpace(neededHeight: number) {
    // Standard page boundary trigger is 265mm
    if (currentY + neededHeight > 265) {
      doc.addPage();
      pageCount++;
      currentY = 25; // Reset position to clear the top bar of the next page
      drawPageDetails(pageCount);
    }
  }

  // --- START PDF PAGE 1 RENDERING ---
  drawPageDetails(1);

  currentY = 22;

  // Title block of the medical document
  doc.setFont("times", "italic");
  doc.setFontSize(26);
  doc.setTextColor(colors.primaryDark[0], colors.primaryDark[1], colors.primaryDark[2]);
  doc.text("MediSync Sovereign Passport", margin, currentY);
  currentY += 8;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(colors.primaryOlive[0], colors.primaryOlive[1], colors.primaryOlive[2]);
  doc.text("PERSONAL PORTABLE CLINICAL CHRONICLE & DIAGNOSTICS ARCHIVE", margin, currentY);
  currentY += 6;

  drawHorizontalLine(currentY, colors.primaryOlive);
  currentY += 8;

  // --- SECTION: PATIENT DIRECTORY DETAILS (Elegant Card Grid) ---
  assurePageSpace(45);
  doc.setFont("times", "bolditalic");
  doc.setFontSize(14);
  doc.setTextColor(colors.primaryDark[0], colors.primaryDark[1], colors.primaryDark[2]);
  doc.text("Patient Directory Details & Identity Credentials", margin, currentY);
  currentY += 5;

  // Draw card background
  doc.setFillColor(colors.cardBg[0], colors.cardBg[1], colors.cardBg[2]);
  doc.setDrawColor(colors.borderSage[0], colors.borderSage[1], colors.borderSage[2]);
  doc.setLineWidth(0.3);
  doc.rect(margin, currentY, printableWidth, 32, "FD");

  // Grid Data inside the card
  const gridY = currentY + 6;
  
  // Col 1 starting point (left hand side inside card)
  const col1X = margin + 6;
  // Col 2 starting point (precisely aligned to the right half inside card)
  const col2X = margin + (printableWidth / 2) + 3;

  // Row 1 - Full Legal Name
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(colors.primaryOlive[0], colors.primaryOlive[1], colors.primaryOlive[2]);
  doc.text("FULL LEGAL NAME", col1X, gridY);

  doc.setFont("times", "bolditalic");
  doc.setFontSize(11);
  doc.setTextColor(colors.primaryDark[0], colors.primaryDark[1], colors.primaryDark[2]);
  doc.text(passport.fullName, col1X, gridY + 5);

  // Row 1 - Date of Birth
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(colors.primaryOlive[0], colors.primaryOlive[1], colors.primaryOlive[2]);
  doc.text("DATE OF BIRTH", col2X, gridY);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(colors.primaryDark[0], colors.primaryDark[1], colors.primaryDark[2]);
  doc.text(passport.dateOfBirth, col2X, gridY + 5);

  const row2Y = gridY + 14;

  // Row 2 - Emergency Blood Type
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(colors.primaryOlive[0], colors.primaryOlive[1], colors.primaryOlive[2]);
  doc.text("EMERGENCY BLOOD TYPE", col1X, row2Y);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10.5);
  doc.setTextColor(185, 28, 28); // Vibrant deep red for clinical blood visibility
  doc.text(passport.bloodType || "N/A", col1X, row2Y + 5);

  // Row 2 - Emergency Contact
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(colors.primaryOlive[0], colors.primaryOlive[1], colors.primaryOlive[2]);
  doc.text("EMERGENCY CAREGIVER CONTACT", col2X, row2Y);
  
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(colors.primaryDark[0], colors.primaryDark[1], colors.primaryDark[2]);
  const contactText = `${passport.emergencyContact.name} (${passport.emergencyContact.relation}) \u2022 ${passport.emergencyContact.phone}`;
  
  // Wrap emergency contact text just in case it is very long
  const contactLines = doc.splitTextToSize(contactText, (printableWidth / 2) - 10);
  contactLines.forEach((line: string, i: number) => {
    doc.text(line, col2X, row2Y + 5 + (i * 4));
  });

  currentY += 38;

  // --- SECTION: CRITICAL PATHOLOGICAL & ALLERGEN WARNS ---
  assurePageSpace(40);
  
  // Left half: Severe Allergies / Right half: Chronic Medical Conditions
  const splitWidth = (printableWidth - 6) / 2; // ~82mm each
  const boxesY = currentY;

  const allergyString = passport.allergies.length > 0 
    ? passport.allergies.join(", ") 
    : "No known high-severity allergen restrictions are registered.";
  const allergyLines = doc.splitTextToSize(allergyString, splitWidth - 10);

  const chronicString = passport.conditions.length > 0
    ? passport.conditions.join(", ")
    : "No chronic metabolic, cardiac, or immunity conditions noted.";
  const chronicLines = doc.splitTextToSize(chronicString, splitWidth - 10);

  // Dynamically compute optimal stretch height to prevent label/text overflow
  const maxLines = Math.max(allergyLines.length, chronicLines.length);
  const computedBoxHeight = Math.max(24, 12 + maxLines * 4.3);

  // Box 1: Allergies (Red Highlight)
  doc.setFillColor(colors.warningBg[0], colors.warningBg[1], colors.warningBg[2]);
  doc.setDrawColor(252, 165, 165); // soft red border
  doc.rect(margin, boxesY, splitWidth, computedBoxHeight, "FD");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(colors.warningText[0], colors.warningText[1], colors.warningText[2]);
  doc.text("SEVERE RESTRICTED ALLERGENS", margin + 5, boxesY + 5);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(colors.primaryDark[0], colors.primaryDark[1], colors.primaryDark[2]);
  allergyLines.forEach((line: string, idx: number) => {
    doc.text(line, margin + 5, boxesY + 11 + (idx * 4.2));
  });

  // Box 2: Chronic Conditions (Olive/Muted highlight)
  doc.setFillColor(colors.cardBg[0], colors.cardBg[1], colors.cardBg[2]);
  doc.setDrawColor(colors.borderSage[0], colors.borderSage[1], colors.borderSage[2]);
  doc.rect(margin + splitWidth + 6, boxesY, splitWidth, computedBoxHeight, "FD");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(colors.primaryOlive[0], colors.primaryOlive[1], colors.primaryOlive[2]);
  doc.text("CHRONIC CLINICAL CONDITIONS", margin + splitWidth + 11, boxesY + 5);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(colors.primaryDark[0], colors.primaryDark[1], colors.primaryDark[2]);
  chronicLines.forEach((line: string, idx: number) => {
    doc.text(line, margin + splitWidth + 11, boxesY + 11 + (idx * 4.2));
  });

  currentY += computedBoxHeight + 8;

  // --- SECTION: IN-USE MEDICAL REGIMENS ---
  assurePageSpace(30);
  doc.setFont("times", "bolditalic");
  doc.setFontSize(14);
  doc.setTextColor(colors.primaryDark[0], colors.primaryDark[1], colors.primaryDark[2]);
  doc.text("Active Prescribed Medical Regimens", margin, currentY);
  currentY += 5;

  const medsString = passport.medications.length > 0
    ? passport.medications.join("   \u2022   ")
    : "No persistent oral or intravenous medications registered currently.";
  doc.setFillColor(colors.cardBg[0], colors.cardBg[1], colors.cardBg[2]);
  doc.setDrawColor(colors.borderSage[0], colors.borderSage[1], colors.borderSage[2]);
  
  // Calculate meds wrap height
  const medsLines = doc.splitTextToSize(medsString, printableWidth - 10);
  const medsBoxHeight = Math.max(14, medsLines.length * 4.8 + 6);
  
  doc.rect(margin, currentY, printableWidth, medsBoxHeight, "FD");
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.5);
  doc.setTextColor(colors.primaryDark[0], colors.primaryDark[1], colors.primaryDark[2]);
  
  medsLines.forEach((line: string, i: number) => {
    doc.text(line, margin + 5, currentY + 6 + (i * 4.8));
  });

  currentY += medsBoxHeight + 10;

  // --- SECTION: CHRONOLOGICAL CLINICAL TIMELINE PASSPORT ---
  assurePageSpace(35);
  doc.setFont("times", "bolditalic");
  doc.setFontSize(14);
  doc.setTextColor(colors.primaryDark[0], colors.primaryDark[1], colors.primaryDark[2]);
  doc.text("Chronological Clinical History Logs & Passport Ledger", margin, currentY);
  currentY += 6;

  drawHorizontalLine(currentY, colors.primaryDark);
  currentY += 6;

  // Sort timeline chronologically descending (latest events first) to show latest health updates first
  const sortedEvents = [...passport.timeline].sort((a, b) => {
    return new Date(b.date).getTime() - new Date(a.date).getTime();
  });

  if (sortedEvents.length === 0) {
    assurePageSpace(20);
    doc.setFont("times", "italic");
    doc.setFontSize(10.5);
    doc.setTextColor(colors.secondaryText[0], colors.secondaryText[1], colors.secondaryText[2]);
    doc.text("No diagnostic timeline events have been logged inside this secure health ledger.", margin, currentY);
  } else {
    sortedEvents.forEach((evt: TimelineEvent) => {
      // First, calculate approximation of printed height to determine page-break
      // Symmetrical padding of exactly 5mm left/right: text width wrapping limit is printableWidth - 8 (162mm)
      const maxTextWrapWidth = printableWidth - 8;
      
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9.5);
      const findingsLines = doc.splitTextToSize(`Findings: ${evt.findings}`, maxTextWrapWidth);
      const findingsHeight = findingsLines.length * 4.2;

      // Recommended action body:
      const actionsLines = doc.splitTextToSize(`Remedial Recommendation: ${evt.nextSteps}`, maxTextWrapWidth);
      const actionsHeight = actionsLines.length * 4.2;

      const totalNeededHeight = 14 + findingsHeight + actionsHeight + 10; // ~40mm standard block

      assurePageSpace(totalNeededHeight);

      // Event Top Header Line: Date and Record Type
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8.5);
      doc.setTextColor(colors.primaryOlive[0], colors.primaryOlive[1], colors.primaryOlive[2]);
      const dateTypeStr = `${evt.date.toUpperCase()}  \u2022  ${evt.recordType.toUpperCase()} EVENT`;
      doc.text(dateTypeStr, margin, currentY);

      // Severity badge indicator - Perfectly aligned right-flush under the right-margin (190mm)
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      if (evt.severity === "High") {
        doc.setTextColor(185, 28, 28); // Deep Red
        doc.text("HIGH PRIORITY", margin + printableWidth, currentY, { align: "right" });
      } else if (evt.severity === "Medium") {
        doc.setTextColor(180, 83, 9); // Amber orange
        doc.text("MODERATE SEVERITY", margin + printableWidth, currentY, { align: "right" });
      } else {
        doc.setTextColor(colors.secondaryText[0], colors.secondaryText[1], colors.secondaryText[2]);
        doc.text("ROUTINE TREATMENT", margin + printableWidth, currentY, { align: "right" });
      }

      currentY += 4.5;

      // Event Title
      doc.setFont("times", "bolditalic");
      doc.setFontSize(12.5);
      doc.setTextColor(colors.primaryDark[0], colors.primaryDark[1], colors.primaryDark[2]);
      doc.text(evt.title, margin, currentY);
      currentY += 4.5;

      // Doctor, clinician, clinic logs
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8.5);
      doc.setTextColor(colors.secondaryText[0], colors.secondaryText[1], colors.secondaryText[2]);
      doc.text(`Consultant Practitioner: ${evt.clinician}  \u2022  Health Facility: ${evt.facility}`, margin, currentY);
      currentY += 5;

      // Findings & Clinical Diagnostic Summary block (White backed mini card)
      doc.setFillColor(252, 252, 250);
      doc.setDrawColor(230, 233, 225);
      // Give the rectangle card boundary full width spanning margin-1 to margin+printableWidth+1 with perfect balanced horizontal alignments
      doc.rect(margin - 1, currentY - 1, printableWidth + 2, findingsHeight + actionsHeight + 6, "FD");

      // Draw findings line by line cleanly with symmetrical padding
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(colors.primaryDark[0], colors.primaryDark[1], colors.primaryDark[2]);
      findingsLines.forEach((line: string, i: number) => {
        doc.text(line, margin + 3, currentY + 3 + (i * 4.2));
      });
      currentY += findingsHeight + 3;

      // Draw active treatment suggestions line by line cleanly with symmetrical padding
      doc.setFont("helvetica", "italic");
      doc.setFontSize(9);
      doc.setTextColor(colors.primaryOlive[0], colors.primaryOlive[1], colors.primaryOlive[2]);
      actionsLines.forEach((line: string, i: number) => {
        doc.text(line, margin + 3, currentY + 2 + (i * 4.2));
      });
      currentY += actionsHeight + 8;

      // Small elegant divider line
      drawHorizontalLine(currentY - 3, colors.lightSage);
    });
  }

  // --- LAST PAGE ASSURANCE CLOSING ---
  assurePageSpace(30);

  currentY += 6;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(colors.primaryOlive[0], colors.primaryOlive[1], colors.primaryOlive[2]);
  doc.text("LEDGER VALIDATION CERTIFICATION", margin, currentY);
  currentY += 4.2;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(colors.secondaryText[0], colors.secondaryText[1], colors.secondaryText[2]);
  doc.text(`This document serves as an offline export from the MediSync Encrypted Passport Registry. All embedded chronological timelines were uploaded and parsed under strict user authorization. Synchronization date: ${new Date(passport.updatedAt).toLocaleString("en-US", { timeZone: "UTC" })} UTC. Security verification hash: SHA-${passport.id.toUpperCase().substring(0, 8)}.`, margin, currentY, { maxWidth: printableWidth });

  // Draw final physical signature placeholder lines for doctors - Perfectly flush and symmeterized to left/right margins!
  currentY += 12;
  assurePageSpace(15);
  doc.setDrawColor(colors.borderSage[0], colors.borderSage[1], colors.borderSage[2]);
  doc.setLineWidth(0.3);
  doc.line(margin, currentY, margin + 50, currentY);
  doc.line(140, currentY, 190, currentY);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  doc.text("CREDENTIAL HOLDER SIGNATURE", margin, currentY + 4);
  doc.text("CHIEF ATTENDING CLINICIAN SIGNATURE", 140, currentY + 4);

  // Trigger browser download action for the beautiful generated PDF summary
  const fileName = `MEDISYNC_PASSPORT_${passport.fullName.toUpperCase().replace(/\s+/g, "_")}.pdf`;
  doc.save(fileName);
}

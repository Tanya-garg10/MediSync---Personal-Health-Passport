import { writeFileSync, mkdirSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import { jsPDF } from "jspdf";

const __dirname = dirname(fileURLToPath(import.meta.url));
const outDir = join(__dirname, "..", "public", "samples");
mkdirSync(outDir, { recursive: true });

const doc = new jsPDF();
doc.setFontSize(16);
doc.text("APOLLO CLINIC — Laboratory Report", 20, 20);
doc.setFontSize(11);
doc.text("Patient: Aarav Sharma", 20, 35);
doc.text("Date: 2026-07-18", 20, 42);
doc.text("Facility: Apollo Clinic", 20, 49);
doc.text("Clinician: Dr. Mehta", 20, 56);
doc.text("Report Type: Blood Test / Metabolic Panel", 20, 63);
doc.text("HbA1c: 7.1 %", 20, 80);
doc.text("Glucose: 118 mg/dL", 20, 87);
doc.text("Hemoglobin: 13.8 g/dL", 20, 94);
doc.text("Creatinine: 0.9 mg/dL", 20, 101);
doc.text("Findings: Stable glycemic control with improving HbA1c trajectory.", 20, 118);
doc.text("Advice: Follow-up after 3 months.", 20, 125);

const out = join(outDir, "sample-blood-report.pdf");
writeFileSync(out, Buffer.from(doc.output("arraybuffer")));
console.log("Wrote", out);

import express, { Request, Response } from "express";
import path from "path";
import dotenv from "dotenv";
import multer from "multer";
import { GoogleGenAI } from "@google/genai";
import { createServer as createViteServer } from "vite";
import { PassportData, TimelineEvent, StructuredDocument } from "./src/types.js";
import {
  initStellar,
  computeEventCanonicalHash,
  registerRecordHash,
  verifyRecordHash,
  registerConsentOnStellar,
  verifyConsentOnStellar,
  getStellarWalletDetails,
  getContractId,
} from "./src/utils/stellarService.js";
import {
  orchestrateDocumentPreview,
  orchestrateConfirm,
  orchestrateDoctorBrief,
  orchestrateInsights,
} from "./src/server/bindu/orchestrator.js";
import {
  addFollowUpToCalendar,
  getCorsairStatus,
  initCorsair,
} from "./src/server/corsair/calendar.js";

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 3000;
app.use(express.json({ limit: "15mb" }));

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 12 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype === "application/pdf" || file.originalname.toLowerCase().endsWith(".pdf")) {
      cb(null, true);
    } else {
      cb(new Error("PDF documents only in this MVP"));
    }
  },
});

const passportStore = new Map<string, PassportData>();

function generateUUID(): string {
  return Math.random().toString(36).substring(2, 11);
}

const hasApiKey =
  !!process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== "MY_GEMINI_API_KEY";

let ai: GoogleGenAI | null = null;
if (hasApiKey) {
  try {
    ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  } catch {
    ai = null;
  }
}

const DEMO_GUID = "demo";
const demoPassport: PassportData = {
  id: DEMO_GUID,
  fullName: "Aarav Sharma",
  dateOfBirth: "1988-06-12",
  bloodType: "O-Positive",
  allergies: ["Penicillin", "Sulfonamides", "Peanuts"],
  conditions: ["Primary Hypertension", "Mild Asthma", "Seasonal Allergic Rhinitis"],
  medications: [
    "Lisinopril 10mg (1x daily)",
    "Albuterol inhaler (as needed)",
    "Cetirizine 10mg (at bedtime)",
  ],
  emergencyContact: {
    name: "Dr. Priyah Sharma",
    phone: "+91-98765-43210",
    relation: "Spouse (Emergency Physician)",
  },
  timeline: [
    {
      id: "evt-01",
      date: "2026-04-10",
      title: "Annual Cardiology Evaluation",
      recordType: "Consultation",
      severity: "Low",
      clinician: "Dr. Sarah Lin (FACC)",
      facility: "Metro Cardiac & Vascular Institute",
      findings:
        "Under control. Resting BP: 124/78 mmHg. Heart rate: 68 bpm. Electrocardiogram (ECG) shows normal sinus rhythm.",
      nextSteps: "Next annual follow-up cardiodiagnostics scheduled for Spring 2027.",
      observations: [
        { name: "Systolic BP", value: 124, unit: "mmHg", date: "2026-04-10", source: "evt-01" },
        { name: "Diastolic BP", value: 78, unit: "mmHg", date: "2026-04-10", source: "evt-01" },
        { name: "Heart Rate", value: 68, unit: "bpm", date: "2026-04-10", source: "evt-01" },
      ],
      stellarStatus: "not_verified",
    },
    {
      id: "evt-02",
      date: "2026-02-18",
      title: "Comprehensive Metabolic Panel (CMP)",
      recordType: "Laboratory",
      severity: "Low",
      clinician: "Lead Pathologist",
      facility: "Apex Diagnostics Lab",
      findings:
        "Creatinine: 0.9 mg/dL. Blood glucose fasting: 92 mg/dL. Total cholesterol: 204 mg/dL.",
      nextSteps: "Repeat lipid panel testing in 6 months.",
      observations: [
        { name: "Creatinine", value: 0.9, unit: "mg/dL", date: "2026-02-18", source: "evt-02" },
        { name: "Glucose", value: 92, unit: "mg/dL", date: "2026-02-18", source: "evt-02" },
        { name: "Cholesterol", value: 204, unit: "mg/dL", date: "2026-02-18", source: "evt-02" },
      ],
      stellarStatus: "not_verified",
    },
    {
      id: "evt-hba1c-jan",
      date: "2026-01-10",
      title: "HbA1c Lab Panel",
      recordType: "Laboratory",
      severity: "Medium",
      clinician: "",
      facility: "Apex Diagnostics Lab",
      findings: "HbA1c: 8.2 %",
      nextSteps: "Follow-up after 3 months.",
      observations: [
        { name: "HbA1c", value: 8.2, unit: "%", date: "2026-01-10", source: "evt-hba1c-jan" },
      ],
      stellarStatus: "not_verified",
    },
    {
      id: "evt-hba1c-apr",
      date: "2026-04-18",
      title: "HbA1c Lab Panel",
      recordType: "Laboratory",
      severity: "Low",
      clinician: "",
      facility: "Apex Diagnostics Lab",
      findings: "HbA1c: 7.7 %",
      nextSteps: "",
      observations: [
        { name: "HbA1c", value: 7.7, unit: "%", date: "2026-04-18", source: "evt-hba1c-apr" },
      ],
      stellarStatus: "not_verified",
    },
  ],
  pendingFollowUps: [
    {
      recommendedDate: "2026-10-18",
      note: "Follow-up after 3 months",
      source: "evt-hba1c-jan",
    },
  ],
  updatedAt: new Date().toISOString(),
};

passportStore.set(DEMO_GUID, demoPassport);

app.get("/api/health", async (_req, res) => {
  const corsairStatus = await getCorsairStatus();
  res.json({
    status: "ok",
    ai: hasApiKey && ai ? "enabled" : "unavailable",
    stellarMode: getContractId() ? "soroban" : "manage_data",
    corsair: corsairStatus,
  });
});

app.get("/api/passport/:id", (req, res) => {
  const data = passportStore.get(req.params.id);
  if (!data) return res.status(404).json({ error: "Medical passport not found" });
  res.json(data);
});

app.post("/api/passport/:id", (req: Request, res: Response) => {
  const newData = req.body as PassportData;
  if (!newData.fullName) return res.status(400).json({ error: "Patient Full Name is required" });
  const passport: PassportData = {
    ...newData,
    id: req.params.id,
    updatedAt: new Date().toISOString(),
  };
  passportStore.set(passport.id, passport);
  res.json(passport);
});

app.post("/api/passport", (req: Request, res: Response) => {
  const customId = generateUUID();
  const emptyPassport: PassportData = {
    id: customId,
    fullName: req.body.fullName || "New Citizen Passport",
    dateOfBirth: req.body.dateOfBirth || "",
    bloodType: req.body.bloodType || "O-Positive",
    allergies: req.body.allergies || [],
    conditions: req.body.conditions || [],
    medications: req.body.medications || [],
    emergencyContact: req.body.emergencyContact || { name: "", phone: "", relation: "" },
    timeline: req.body.timeline || [],
    updatedAt: new Date().toISOString(),
  };
  passportStore.set(customId, emptyPassport);
  res.json(emptyPassport);
});

app.post("/api/records/extract", upload.single("file"), async (req: Request, res: Response) => {
  try {
    if (!req.file) return res.status(400).json({ error: "PDF file required" });
    const { PDFParse } = await import("pdf-parse");
    const parser = new PDFParse({ data: req.file.buffer });
    const textResult = await parser.getText();
    await parser.destroy();
    const rawText = (textResult.text || "").trim();
    if (!rawText) {
      return res.status(422).json({
        error: "No extractable text. This MVP supports text-based PDFs only.",
      });
    }
    res.json({
      rawText,
      fileName: req.file.originalname,
      pages: textResult.total || textResult.pages?.length || undefined,
    });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || "PDF extraction failed" });
  }
});

app.post("/api/bindu/document", async (req: Request, res: Response) => {
  const { rawText, fileName } = req.body || {};
  if (!rawText || typeof rawText !== "string") {
    return res.status(400).json({ error: "rawText required" });
  }
  const result = await orchestrateDocumentPreview(ai, rawText, fileName || "document.pdf");
  if (result.error) {
    return res.status(503).json({
      ...result.error,
      steps: result.steps,
      message: "AI analysis is temporarily unavailable. Your medical record has not been modified.",
    });
  }
  res.json(result);
});

app.post("/api/bindu/confirm", async (req: Request, res: Response) => {
  const { passportId, document } = req.body as {
    passportId: string;
    document: StructuredDocument;
  };
  const passport = passportStore.get(passportId);
  if (!passport) return res.status(404).json({ error: "Passport not found" });
  if (!document) return res.status(400).json({ error: "document required" });

  const result = orchestrateConfirm(document, passport);
  if (!result.event) return res.status(500).json({ error: "Timeline agent failed" });

  const followUps = [...(passport.pendingFollowUps || [])];
  if (document.followUp) followUps.push({ ...document.followUp, source: document.source });

  const updated: PassportData = {
    ...passport,
    timeline: [...passport.timeline, result.event],
    medications: [
      ...new Set([...passport.medications, ...(document.medications || [])]),
    ],
    conditions: [
      ...new Set([...passport.conditions, ...(document.conditions || [])]),
    ],
    pendingFollowUps: followUps,
    updatedAt: new Date().toISOString(),
  };
  passportStore.set(passportId, updated);
  res.json({ ...result, passport: updated });
});

app.post("/api/bindu/insights", (req: Request, res: Response) => {
  const passport = passportStore.get(req.body.passportId);
  if (!passport) return res.status(404).json({ error: "Passport not found" });
  res.json(orchestrateInsights(passport));
});

app.post("/api/bindu/doctor-brief", (req: Request, res: Response) => {
  const passport = passportStore.get(req.body.passportId);
  if (!passport) return res.status(404).json({ error: "Passport not found" });
  res.json(orchestrateDoctorBrief(passport));
});

app.post("/api/bindu/orchestrate", async (req: Request, res: Response) => {
  const { task, passportId, rawText, fileName, document } = req.body || {};
  if (task === "ingest") {
    const result = await orchestrateDocumentPreview(ai, rawText, fileName || "document.pdf");
    if (result.error) {
      return res.status(503).json({
        ...result.error,
        steps: result.steps,
        message: "AI analysis is temporarily unavailable. Your medical record has not been modified.",
      });
    }
    return res.json(result);
  }
  if (task === "confirm") {
    const passport = passportStore.get(passportId);
    if (!passport) return res.status(404).json({ error: "Passport not found" });
    if (!document) return res.status(400).json({ error: "document required" });
    const result = orchestrateConfirm(document, passport);
    if (!result.event) return res.status(500).json({ error: "Timeline agent failed" });
    const followUps = [...(passport.pendingFollowUps || [])];
    if (document.followUp) followUps.push({ ...document.followUp, source: document.source });
    const updated: PassportData = {
      ...passport,
      timeline: [...passport.timeline, result.event],
      medications: [...new Set([...passport.medications, ...(document.medications || [])])],
      conditions: [...new Set([...passport.conditions, ...(document.conditions || [])])],
      pendingFollowUps: followUps,
      updatedAt: new Date().toISOString(),
    };
    passportStore.set(passportId, updated);
    return res.json({ ...result, passport: updated });
  }
  if (task === "doctor_brief") {
    const passport = passportStore.get(passportId);
    if (!passport) return res.status(404).json({ error: "Passport not found" });
    return res.json(orchestrateDoctorBrief(passport));
  }
  return res.status(400).json({ error: "Unknown task" });
});

app.get("/api/stellar/wallet", async (_req, res) => {
  try {
    res.json(await getStellarWalletDetails());
  } catch (err: any) {
    res.status(500).json({ error: err?.message || "Wallet error" });
  }
});

app.post("/api/records/:passportId/notarize/:eventId", async (req, res) => {
  const passport = passportStore.get(req.params.passportId);
  if (!passport) return res.status(404).json({ error: "Passport not found" });
  const event = passport.timeline.find((e) => e.id === req.params.eventId);
  if (!event) return res.status(404).json({ error: "Event not found" });

  const hash = computeEventCanonicalHash(event);
  const result = await registerRecordHash(hash);
  if (!("success" in result) || !result.success) {
    return res.status(502).json({
      error: ("error" in result && result.error) || "Registration failed",
    });
  }

  const updatedEvent: TimelineEvent = {
    ...event,
    stellarHash: hash,
    stellarTxId: result.txHash,
    stellarTimestamp: new Date().toISOString(),
    stellarStatus: "verified",
    stellarContractId: result.contractId || getContractId(),
  };
  passport.timeline = passport.timeline.map((e) =>
    e.id === event.id ? updatedEvent : e
  );
  passport.updatedAt = new Date().toISOString();
  passportStore.set(passport.id, passport);

  res.json({
    event: updatedEvent,
    registration: result,
    network: "Stellar Testnet",
  });
});

app.post("/api/records/:passportId/verify/:eventId", async (req, res) => {
  const passport = passportStore.get(req.params.passportId);
  if (!passport) return res.status(404).json({ error: "Passport not found" });
  const event = passport.timeline.find((e) => e.id === req.params.eventId);
  if (!event) return res.status(404).json({ error: "Event not found" });

  const hash = computeEventCanonicalHash(event);
  const verification = await verifyRecordHash(hash);
  res.json({
    hash,
    verification,
    eventSummary: {
      id: event.id,
      title: event.title,
      date: event.date,
      findings: event.findings,
      observations: event.observations || [],
      sourceDocument: event.sourceDocument,
    },
    network: "Stellar Testnet",
    contractId: getContractId() || event.stellarContractId || null,
  });
});

app.get("/api/records/:passportId/share/:eventId", async (req, res) => {
  const passport = passportStore.get(req.params.passportId);
  if (!passport) return res.status(404).json({ error: "Passport not found" });
  const event = passport.timeline.find((e) => e.id === req.params.eventId);
  if (!event) return res.status(404).json({ error: "Event not found" });

  const hash = computeEventCanonicalHash(event);
  const verification = await verifyRecordHash(hash);
  res.json({
    patientName: passport.fullName,
    event: {
      id: event.id,
      title: event.title,
      date: event.date,
      recordType: event.recordType,
      findings: event.findings,
      observations: event.observations || [],
      facility: event.facility,
      sourceDocument: event.sourceDocument,
    },
    hash,
    verification,
    network: "Stellar Testnet",
    contractId: getContractId() || event.stellarContractId || null,
    registeredAt: event.stellarTimestamp || null,
    txId: event.stellarTxId || null,
  });
});

app.post("/api/corsair/calendar", async (req, res) => {
  const { passportId, followUpIndex } = req.body || {};
  const passport = passportStore.get(passportId);
  if (!passport) return res.status(404).json({ error: "Passport not found" });
  const followUps = passport.pendingFollowUps || [];
  const followUp = followUps[followUpIndex ?? 0];
  if (!followUp) return res.status(400).json({ error: "No follow-up suggestion available" });

  const result = await addFollowUpToCalendar(followUp, passport.fullName);
  if (!result.success) {
    return res.status(503).json(result);
  }
  res.json(result);
});

app.get("/api/corsair/status", async (_req, res) => {
  res.json(await getCorsairStatus());
});

// Corsair OAuth callback handler
app.get("/api/corsair/callback", async (req, res) => {
  try {
    const { createCorsair } = await import("corsair");
    const { googlecalendar } = await import("@corsair-dev/googlecalendar");
    
    const db = {
      query: async (sql: string, params?: any[]) => [],
      connect: async () => ({ 
        close: async () => {},
        query: async (sql: string, params?: any[]) => []
      }),
    };
    
    const corsairClient = createCorsair({
      multiTenancy: false,
      kek: process.env.CORSAIR_KEK!,
      database: db as any,
      plugins: [googlecalendar({
        clientId: process.env.GOOGLE_CLIENT_ID!,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
        redirectUri: process.env.GOOGLE_REDIRECT_URI || `${process.env.APP_URL || 'http://localhost:3000'}/api/corsair/callback`,
      })],
    });
    
    const { toExpressHandler } = await import("corsair");
    const handler = toExpressHandler(corsairClient, { basePath: "/api/corsair" });
    return handler(req, res, () => {});
  } catch (err) {
    console.error("Corsair callback error:", err);
    res.status(500).json({ error: "Corsair callback error" });
  }
});

app.post("/api/records/:passportId/consent", async (req, res) => {
  const passport = passportStore.get(req.params.passportId);
  if (!passport) return res.status(404).json({ error: "Passport not found" });
  const { reportId, doctorName, permission, expiryHours } = req.body || {};
  const hours = Number(expiryHours) || 24;
  const expiryTime = Math.floor(Date.now() / 1000) + hours * 3600;
  const consentId = generateUUID();
  const reg = await registerConsentOnStellar(
    consentId,
    doctorName || "Clinician",
    permission || "Read Only",
    expiryTime
  );
  if (!reg.success) return res.status(502).json(reg);
  const consent = {
    id: consentId,
    reportId,
    doctorName: doctorName || "Clinician",
    permission: permission || "Read Only",
    expiryHours: hours,
    expiryTime,
    createdAt: new Date().toISOString(),
    stellarTxId: reg.txHash,
  };
  passport.stellarConsents = [...(passport.stellarConsents || []), consent as any];
  passportStore.set(passport.id, passport);
  res.json(consent);
});

app.get("/api/consent/verify/:consentId", async (req, res) => {
  const verification = await verifyConsentOnStellar(req.params.consentId);
  let foundPassport: PassportData | undefined;
  let report: TimelineEvent | undefined;
  for (const p of passportStore.values()) {
    const c = p.stellarConsents?.find((x) => x.id === req.params.consentId);
    if (c) {
      foundPassport = p;
      report = p.timeline.find((e) => e.id === c.reportId);
      break;
    }
  }
  res.json({
    verification,
    report,
    patientSummary: foundPassport
      ? {
          fullName: foundPassport.fullName,
          bloodType: foundPassport.bloodType,
          allergies: foundPassport.allergies,
          conditions: foundPassport.conditions,
          medications: foundPassport.medications,
          emergencyContact: foundPassport.emergencyContact,
        }
      : null,
  });
});

async function start() {
  await initStellar().catch(() => undefined);
  await initCorsair().catch(() => undefined);

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "custom",
    });
    app.use(vite.middlewares);
    app.use("*", async (req, res, next) => {
      try {
        const url = req.originalUrl;
        const template = await vite.transformIndexHtml(
          url,
          await (await import("fs")).promises.readFile(
            path.resolve("index.html"),
            "utf-8"
          )
        );
        res.status(200).set({ "Content-Type": "text/html" }).end(template);
      } catch (e) {
        vite.ssrFixStacktrace(e as Error);
        next(e);
      }
    });
  } else {
    app.use(express.static(path.resolve("dist")));
    app.get("*", (_req, res) => {
      res.sendFile(path.resolve("dist", "index.html"));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`MediSync listening on http://localhost:${PORT}`);
    console.log(`MediSync also accessible on your network IP at port ${PORT}`);
  });
}

start();

import type { GoogleGenAI } from "@google/genai";
import type {
  AgentStepStatus,
  DoctorBrief,
  PassportData,
  StructuredDocument,
  TimelineEvent,
  InsightTrend,
} from "../../types.js";
import { runDocumentAgent, AiUnavailableError } from "./documentAgent.js";
import { runTimelineAgent } from "./timelineAgent.js";
import { runInsightAgent, collectObservations, buildDoctorBrief } from "./insightAgent.js";

export type BinduTaskKind = "ingest" | "confirm" | "doctor_brief" | "insights";

export interface BinduTaskResult {
  steps: AgentStepStatus[];
  document?: StructuredDocument;
  event?: TimelineEvent;
  trends?: InsightTrend[];
  brief?: DoctorBrief;
  error?: { error: string; reason: string };
}

function step(
  agent: AgentStepStatus["agent"],
  status: AgentStepStatus["status"],
  message: string
): AgentStepStatus {
  return { agent, status, message };
}

export async function orchestrateDocumentPreview(
  ai: GoogleGenAI | null,
  rawText: string,
  sourceFileName: string
): Promise<BinduTaskResult> {
  const steps: AgentStepStatus[] = [
    step("orchestrator", "running", "Task created"),
    step("document", "running", "Extracting clinical structure"),
    step("timeline", "pending", "Waiting for confirmation"),
    step("insight", "pending", "Waiting for timeline update"),
  ];

  try {
    const document = await runDocumentAgent(ai, rawText, sourceFileName);
    steps[0] = step("orchestrator", "done", "Document agent complete — awaiting confirm");
    steps[1] = step(
      "document",
      "done",
      `Extracted ${document.tests.length} clinical values`
    );
    return { steps, document };
  } catch (err: any) {
    const reason = err instanceof AiUnavailableError ? err.reason : err?.message || "unknown";
    steps[0] = step("orchestrator", "error", "AI analysis unavailable");
    steps[1] = step("document", "error", reason);
    return {
      steps,
      error: { error: "AI analysis unavailable", reason },
    };
  }
}

export function orchestrateConfirm(
  document: StructuredDocument,
  passport: PassportData
): BinduTaskResult {
  const steps: AgentStepStatus[] = [
    step("orchestrator", "running", "Confirming into timeline"),
    step("document", "done", `Using ${document.tests.length} clinical values`),
    step("timeline", "running", "Creating timeline event"),
    step("insight", "pending", "Comparing historical values"),
  ];

  const event = runTimelineAgent(document, passport);
  const nextPassport: PassportData = {
    ...passport,
    timeline: [...(passport.timeline || []), event],
  };
  const observations = collectObservations(nextPassport);
  const trends = runInsightAgent(observations);

  steps[0] = step("orchestrator", "done", "Task complete");
  steps[2] = step("timeline", "done", "Added 1 medical event");
  steps[3] = step(
    "insight",
    "done",
    `Generated ${trends.length} evidence-backed insight(s)`
  );

  return { steps, document, event, trends };
}

export function orchestrateDoctorBrief(passport: PassportData): BinduTaskResult {
  const steps: AgentStepStatus[] = [
    step("orchestrator", "running", "Prepare Doctor Visit"),
    step("timeline", "running", "Summarizing recent events"),
    step("insight", "running", "Compiling evidence-backed trends"),
    step("document", "pending", "Not required for brief"),
  ];

  const observations = collectObservations(passport);
  const trends = runInsightAgent(observations);
  const brief = buildDoctorBrief(passport, trends);

  steps[0] = step("orchestrator", "done", "Doctor brief ready");
  steps[1] = step("timeline", "done", `${brief.recentEvents.length} recent events`);
  steps[2] = step("insight", "done", `${trends.length} trends from recorded values`);
  steps[3] = step("document", "done", "Skipped");

  return { steps, trends, brief };
}

export function orchestrateInsights(passport: PassportData): BinduTaskResult {
  const observations = collectObservations(passport);
  const trends = runInsightAgent(observations);
  return {
    steps: [
      step("orchestrator", "done", "Insight pass complete"),
      step("insight", "done", `${trends.length} trends`),
    ],
    trends,
  };
}

export { AiUnavailableError };

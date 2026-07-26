import type { FollowUpSuggestion } from "../../types.js";

let corsairClient: any = null;
let corsairInitError: string | null = null;

export function isCorsairConfigured(): boolean {
  return Boolean(process.env.CORSAIR_KEK) && Boolean(process.env.CORSAIR_ENABLED !== "false");
}

export async function getCorsairStatus() {
  return {
    configured: isCorsairConfigured(),
    ready: Boolean(corsairClient),
    error: corsairInitError,
  };
}

export async function initCorsair(): Promise<boolean> {
  if (!isCorsairConfigured()) {
    corsairInitError = "CORSAIR_KEK not set — configure Corsair or drop this track";
    return false;
  }
  try {
    const { createCorsair } = await import("corsair");
    const { googlecalendar } = await import("@corsair-dev/googlecalendar");
    corsairClient = createCorsair({
      multiTenancy: false,
      kek: process.env.CORSAIR_KEK!,
      plugins: [googlecalendar()],
    });
    corsairInitError = null;
    return true;
  } catch (err: any) {
    corsairClient = null;
    corsairInitError = err?.message || "Failed to initialize Corsair SDK";
    return false;
  }
}

export async function addFollowUpToCalendar(followUp: FollowUpSuggestion, patientName: string) {
  if (!corsairClient) {
    const ok = await initCorsair();
    if (!ok || !corsairClient) {
      return {
        success: false as const,
        error:
          corsairInitError ||
          "Corsair is not configured. Set CORSAIR_KEK and complete `corsair setup --plugin=googlecalendar`.",
      };
    }
  }

  try {
    const start = new Date(followUp.recommendedDate + "T09:00:00");
    const end = new Date(start.getTime() + 30 * 60 * 1000);
    const created = await corsairClient.googlecalendar.api.events.create({
      summary: `MediSync follow-up — ${patientName}`,
      description: followUp.note,
      start: { dateTime: start.toISOString() },
      end: { dateTime: end.toISOString() },
    });
    return {
      success: true as const,
      event: created,
      via: "corsair",
    };
  } catch (err: any) {
    return {
      success: false as const,
      error: err?.message || "Corsair calendar create failed",
    };
  }
}

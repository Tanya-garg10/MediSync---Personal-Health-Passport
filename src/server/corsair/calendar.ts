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
  
  // Check if Google OAuth credentials are configured
  console.log("Checking Google OAuth credentials:", {
    clientId: process.env.GOOGLE_CLIENT_ID ? "set" : "not set",
    clientSecret: process.env.GOOGLE_CLIENT_SECRET ? "set" : "not set",
    redirectUri: process.env.GOOGLE_REDIRECT_URI ? "set" : "not set"
  });
  
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    corsairInitError = "Google OAuth credentials not set. Please set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in .env";
    return false;
  }
  
  try {
    const { createCorsair } = await import("corsair");
    const { googlecalendar } = await import("@corsair-dev/googlecalendar");
    
    // Create a simple database mock that meets the interface requirements
    const db = {
      query: async (sql: string, params?: any[]) => {
        return [];
      },
      connect: async () => {
        return { 
          close: async () => {},
          query: async (sql: string, params?: any[]) => []
        };
      }
    };
    
    // Configure Google Calendar plugin with OAuth credentials
    const googleCalendarPlugin = googlecalendar({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      redirectUri: process.env.GOOGLE_REDIRECT_URI || `${process.env.APP_URL || 'http://localhost:3000'}/api/corsair/callback`,
    });
    
    corsairClient = createCorsair({
      multiTenancy: false,
      kek: process.env.CORSAIR_KEK!,
      database: db as any,
      plugins: [googleCalendarPlugin],
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
  // Check if Google OAuth credentials are available
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    return {
      success: false as const,
      error: "Google OAuth credentials not configured. Please set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in .env",
    };
  }

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

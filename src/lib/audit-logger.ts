import { supabaseAdmin } from "@/lib/supabase-admin";
import { sendCriticalAlert } from "./alert";

export type SecuritySeverity = "INFO" | "WARN" | "CRITICAL" | "ERROR";

export type SecurityEventType =
  | "AUTH_LOGIN_SUCCESS"
  | "AUTH_LOGIN_FAILED"
  | "UNAUTHORIZED_ACCESS"
  | "RATE_LIMIT_EXCEEDED"
  | "SUSPICIOUS_PAYLOAD"
  | "DATA_MUTATION"
  | "CONTACT_SUBMISSION"
  | "SECURITY_ALERT";

export interface LogSecurityEventParams {
  eventType: SecurityEventType;
  severity: SecuritySeverity;
  ipAddress?: string;
  userAgent?: string;
  path?: string;
  method?: string;
  details?: Record<string, unknown>;
}

/**
 * Redacts sensitive fields (passwords, tokens, keys) from log payloads
 */
function sanitizeDetails(details?: Record<string, unknown>): Record<string, unknown> {
  if (!details) return {};
  const redacted = { ...details };
  const sensitiveKeys = ["password", "token", "secret", "authorization", "cookie", "key"];

  for (const key of Object.keys(redacted)) {
    const lowerKey = key.toLowerCase();
    if (sensitiveKeys.some((s) => lowerKey.includes(s))) {
      redacted[key] = "[REDACTED]";
    } else if (typeof redacted[key] === "object" && redacted[key] !== null) {
      redacted[key] = sanitizeDetails(redacted[key] as Record<string, unknown>);
    }
  }
  return redacted;
}

/**
 * Universal Security Audit Logger
 * Logs security-relevant events to stdout and Supabase audit_logs table (if available)
 */
export async function logSecurityEvent({
  eventType,
  severity,
  ipAddress = "unknown",
  userAgent = "unknown",
  path = "/",
  method = "GET",
  details,
}: LogSecurityEventParams): Promise<void> {
  const timestamp = new Date().toISOString();
  const safeDetails = sanitizeDetails(details);

  const logString = `[SECURITY_AUDIT] ${timestamp} | [${severity}] ${eventType} | IP: ${ipAddress} | Path: ${method} ${path} | ${JSON.stringify(
    safeDetails
  )}`;

  if (severity === "CRITICAL" || severity === "ERROR") {
    console.error(logString);
  } else if (severity === "WARN") {
    console.warn(logString);
  } else {
    console.log(logString);
  }

  // Send email alert for critical events
  if (severity === "CRITICAL") {
    await sendCriticalAlert({
      eventType,
      severity,
      ipAddress,
      path,
      method,
      details: safeDetails,
      timestamp,
    });
  }

  // 2. Persist to Supabase `audit_logs` table (Fail-open for logging errors so app never crashes)
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (supabaseUrl && serviceRoleKey) {
      await supabaseAdmin.from("audit_logs").insert([
        {
          event_type: eventType,
          severity,
          ip_address: ipAddress,
          user_agent: userAgent.slice(0, 300),
          path: path.slice(0, 500),
          method: method.slice(0, 10),
          details: safeDetails,
          created_at: timestamp,
        },
      ]);
    }
  } catch (err) {
    // Audit logging failure should not crash the core application flow
    console.error("[SECURITY_AUDIT_LOG_ERROR] Failed to save log to Supabase:", err);
  }
}

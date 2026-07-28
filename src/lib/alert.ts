import emailjs from "@emailjs/browser";

export interface AlertParams {
  eventType: string;
  severity: string;
  ipAddress?: string;
  path?: string;
  method?: string;
  details?: Record<string, unknown>;
  timestamp?: string;
}

/**
 * Send a critical security alert via EmailJS.
 */
export async function sendCriticalAlert(
  paramsOrSubject: AlertParams | string,
  messageOrEmail?: string,
  email: string = "ertyualexs04@gmail.com"
): Promise<void> {
  const SERVICE_ID = process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID || "service_em7z8t4";
  const TEMPLATE_ID = process.env.NEXT_PUBLIC_EMAILJS_ALERT_TEMPLATE_ID || "template_54z41kd";
  const PUBLIC_KEY = process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY || "eeZHKjTMxrFyznOzR";

  let templateParams: Record<string, string>;

  if (typeof paramsOrSubject === "object") {
    const {
      eventType,
      severity,
      ipAddress = "unknown",
      path = "/",
      method = "GET",
      details = {},
      timestamp = new Date().toISOString(),
    } = paramsOrSubject;

    const detailsJson = JSON.stringify(details, null, 2);

    templateParams = {
      event_type: eventType,
      severity,
      timestamp,
      method,
      path,
      ip_address: ipAddress,
      details: detailsJson,
      alert_subject: `Critical Security Event: ${eventType}`,
      alert_message: detailsJson,
      recipient_email: messageOrEmail || email,
    };
  } else {
    templateParams = {
      alert_subject: paramsOrSubject,
      alert_message: messageOrEmail || "",
      event_type: "CRITICAL_EVENT",
      severity: "CRITICAL",
      timestamp: new Date().toISOString(),
      method: "SYSTEM",
      path: "/",
      ip_address: "unknown",
      details: messageOrEmail || "",
      recipient_email: email,
    };
  }

  try {
    await emailjs.send(SERVICE_ID, TEMPLATE_ID, templateParams, PUBLIC_KEY);
    console.log(`[SECURITY_ALERT_EMAIL] Sent alert email successfully`);
  } catch (err) {
    console.error("[SECURITY_ALERT_EMAIL_ERROR] Failed to send alert email:", err);
  }
}

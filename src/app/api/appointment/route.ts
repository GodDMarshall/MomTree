import { createHmac, randomBytes } from "node:crypto";
import { normalisePhone, validateAppointment, type AppointmentInput } from "@/lib/appointment";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Appointment requests. Patient details are never logged, never put in URLs and never sent to
// analytics. Delivery is configured with environment variables (see .env.example):
//   APPOINTMENT_WEBHOOK_URL (+ optional APPOINTMENT_WEBHOOK_SECRET for an HMAC signature), or
//   RESEND_API_KEY + APPOINTMENT_EMAIL_TO + APPOINTMENT_EMAIL_FROM for email.
// With neither configured, the route answers 503 NOT_CONFIGURED and the form offers phone/WhatsApp.

const WINDOW_MS = 10 * 60 * 1000;
const MAX_PER_WINDOW = 5;
const hits = new Map<string, number[]>();

function rateLimited(key: string) {
  const now = Date.now();
  const recent = (hits.get(key) ?? []).filter((t) => now - t < WINDOW_MS);
  recent.push(now);
  hits.set(key, recent);
  if (hits.size > 5000) hits.clear();
  return recent.length > MAX_PER_WINDOW;
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json", "cache-control": "no-store" },
  });
}

export async function POST(req: Request) {
  if (!(req.headers.get("content-type") ?? "").includes("application/json")) return json({ code: "BAD_REQUEST" }, 400);
  const raw = await req.text();
  if (raw.length > 8000) return json({ code: "TOO_LARGE" }, 413);

  let input: Partial<AppointmentInput>;
  try {
    input = JSON.parse(raw);
  } catch {
    return json({ code: "BAD_REQUEST" }, 400);
  }

  const reference = `MT-${randomBytes(3).toString("hex").toUpperCase()}`;
  // Bots fill the hidden field. Answer as if accepted, but deliver nothing.
  if (input.company) return json({ ok: true, reference });

  const ip = (req.headers.get("x-forwarded-for") ?? "").split(",")[0].trim() || "local";
  if (rateLimited(ip)) return json({ code: "RATE_LIMITED" }, 429);

  const errors = validateAppointment(input);
  if (Object.keys(errors).length) return json({ code: "INVALID", errors }, 400);

  const record = {
    reference,
    name: String(input.name).trim(),
    phone: `+91${normalisePhone(String(input.phone))}`,
    preferredDate: input.date,
    message: (input.message ?? "").trim(),
    consentToContact: true,
    receivedAt: new Date().toISOString(),
    source: "momtreeivf.com",
  };

  const webhook = process.env.APPOINTMENT_WEBHOOK_URL;
  const resendKey = process.env.RESEND_API_KEY;
  const emailTo = process.env.APPOINTMENT_EMAIL_TO;
  const emailFrom = process.env.APPOINTMENT_EMAIL_FROM;

  try {
    if (webhook) {
      const body = JSON.stringify(record);
      const headers: Record<string, string> = { "content-type": "application/json" };
      const secret = process.env.APPOINTMENT_WEBHOOK_SECRET;
      if (secret) headers["x-momtree-signature"] = createHmac("sha256", secret).update(body).digest("hex");
      const res = await fetch(webhook, { method: "POST", headers, body });
      if (!res.ok) throw new Error(`webhook ${res.status}`);
      return json({ ok: true, reference });
    }
    if (resendKey && emailTo && emailFrom) {
      const text = [
        `New consultation request ${record.reference}`,
        ``,
        `Name: ${record.name}`,
        `Phone: ${record.phone}`,
        `Preferred date: ${record.preferredDate}`,
        `Message: ${record.message || "(none)"}`,
        `Consent to contact: yes`,
        `Received: ${record.receivedAt}`,
      ].join("\n");
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { authorization: `Bearer ${resendKey}`, "content-type": "application/json" },
        body: JSON.stringify({ from: emailFrom, to: emailTo.split(",").map((s) => s.trim()), subject: `Consultation request ${record.reference}`, text }),
      });
      if (!res.ok) throw new Error(`email ${res.status}`);
      return json({ ok: true, reference });
    }
  } catch (err) {
    // Log only the failure, never the patient's details.
    console.error("Appointment delivery failed:", err instanceof Error ? err.message : "unknown");
    return json({ code: "DELIVERY_FAILED" }, 502);
  }

  return json({ code: "NOT_CONFIGURED" }, 503);
}

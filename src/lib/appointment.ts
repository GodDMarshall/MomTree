// Shared validation for appointment requests (used by the form and the API route).

export type AppointmentInput = {
  name: string;
  phone: string;
  date: string; // yyyy-mm-dd
  message?: string;
  consent: boolean;
  /** Honeypot: real visitors never see or fill this field. */
  company?: string;
};

export type FieldErrors = Partial<Record<"name" | "phone" | "date" | "message" | "consent", string>>;

export const MAX_MESSAGE = 600;
export const MAX_DAYS_AHEAD = 180;

/** Normalise Indian phone numbers to 10 digits (mobile, or landline with STD code). */
export function normalisePhone(raw: string) {
  let d = raw.replace(/\D/g, "");
  if (d.length === 12 && d.startsWith("91")) d = d.slice(2);
  if (d.length === 11 && d.startsWith("0")) d = d.slice(1);
  return d;
}

function todayISO(now = new Date()) {
  // Use India time so "today" matches the clinic's calendar.
  const ist = new Date(now.getTime() + (330 + now.getTimezoneOffset()) * 60000);
  return ist.toISOString().slice(0, 10);
}

export function dateBounds(now = new Date()) {
  const min = todayISO(now);
  const max = new Date(new Date(min).getTime() + MAX_DAYS_AHEAD * 86400000).toISOString().slice(0, 10);
  return { min, max };
}

export function validateAppointment(input: Partial<AppointmentInput>, now = new Date()): FieldErrors {
  const e: FieldErrors = {};
  const name = (input.name ?? "").trim();
  if (name.length < 2) e.name = "Please tell us your name.";
  else if (name.length > 80 || !/^[\p{L}\p{M} .'-]+$/u.test(name)) e.name = "Please use letters only for your name.";

  const phone = normalisePhone(input.phone ?? "");
  if (!phone) e.phone = "Please add a phone number we can call.";
  else if (phone.length !== 10) e.phone = "Please enter a 10-digit Indian phone number.";

  const { min, max } = dateBounds(now);
  const date = input.date ?? "";
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) e.date = "Please choose a preferred date.";
  else if (date < min) e.date = "Please choose today or a later date.";
  else if (date > max) e.date = "Please choose a date within the next six months.";

  if ((input.message ?? "").length > MAX_MESSAGE) e.message = `Please keep your message under ${MAX_MESSAGE} characters.`;
  if (input.consent !== true) e.consent = "Please confirm we may contact you about this request.";
  return e;
}

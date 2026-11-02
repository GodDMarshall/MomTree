"use client";

import Link from "next/link";
import { useId, useMemo, useState } from "react";
import { dateBounds, MAX_MESSAGE, validateAppointment, type AppointmentInput, type FieldErrors } from "@/lib/appointment";
import { site, whatsappLink } from "@/lib/site";
import { ArrowRight, Phone, WhatsApp } from "@/components/ui/Icons";

type Status = "idle" | "sending" | "done" | "unavailable" | "error";

/**
 * The appointment request, written as one sentence. Short, warm and fully accessible: each
 * inline field has a real label, error text and aria wiring. Nothing is shown as "confirmed"
 * unless the server has accepted and delivered the request.
 */
export function AppointmentForm({ tone = "light" }: { tone?: "light" | "dark" }) {
  const id = useId();
  const { min, max } = useMemo(() => dateBounds(), []);
  const [v, setV] = useState<AppointmentInput>({ name: "", phone: "", date: "", message: "", consent: false, company: "" });
  const [errors, setErrors] = useState<FieldErrors>({});
  const [touched, setTouched] = useState(false);
  const [status, setStatus] = useState<Status>("idle");
  const [reference, setReference] = useState("");

  const set = <K extends keyof AppointmentInput>(k: K, val: AppointmentInput[K]) => {
    const next = { ...v, [k]: val };
    setV(next);
    if (touched) setErrors(validateAppointment(next));
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched(true);
    const errs = validateAppointment(v);
    setErrors(errs);
    if (Object.keys(errs).length) {
      const first = Object.keys(errs)[0];
      document.getElementById(`${id}-${first}`)?.focus();
      return;
    }
    setStatus("sending");
    try {
      const res = await fetch("/api/appointment", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(v),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.ok) {
        setReference(data.reference);
        setStatus("done");
      } else if (res.status === 503) setStatus("unavailable");
      else if (res.status === 400 && data.errors) {
        setErrors(data.errors);
        setStatus("idle");
      } else setStatus("error");
    } catch {
      setStatus("error");
    }
  };

  const dark = tone === "dark";
  const field = `field-line ${dark ? "text-paper" : "text-ink"}`;
  const err = (k: keyof FieldErrors) => (errors[k] ? { "aria-invalid": true as const, "aria-describedby": `${id}-${k}-err` } : {});

  if (status === "done") {
    return (
      <div role="status" className="max-w-[46ch]">
        <p className="t-label">Request received · {reference}</p>
        <p className="t-h2 mt-5">Thank you, {v.name.split(" ")[0]}.</p>
        <p className="t-lede mt-5">
          Our team will call you on the number you gave to arrange a time. This is a request, not yet a confirmed appointment. If anything is urgent, please call us.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <a href={site.phone.href} className="btn btn-solid">
            <Phone /> {site.phone.display}
          </a>
          <a href={whatsappLink()} target="_blank" rel="noopener noreferrer" className="btn">
            <WhatsApp className="h-4 w-4" /> WhatsApp
          </a>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={submit} noValidate aria-describedby={`${id}-privacy`} className="max-w-[760px]">
      <p className={`font-serif text-[clamp(1.6rem,2.9vw,2.6rem)] font-light leading-[1.75] ${dark ? "text-paper" : "text-ink"}`}>
        <label htmlFor={`${id}-name`}>My name is</label>{" "}
        <input
          id={`${id}-name`}
          name="name"
          autoComplete="name"
          placeholder="your name"
          value={v.name}
          onChange={(e) => set("name", e.target.value)}
          className={`${field} w-[min(12ch,100%)] min-w-[8ch]`}
          {...err("name")}
        />
        <span>, </span>
        <label htmlFor={`${id}-phone`}>you can reach me on</label>{" "}
        <input
          id={`${id}-phone`}
          name="phone"
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          placeholder="phone number"
          value={v.phone}
          onChange={(e) => set("phone", e.target.value)}
          className={`${field} w-[min(12.5ch,100%)] min-w-[11.5ch]`}
          {...err("phone")}
        />
        <span>, </span>
        <label htmlFor={`${id}-date`}>and I&apos;d like to visit around</label>{" "}
        <input
          id={`${id}-date`}
          name="date"
          type="date"
          min={min}
          max={max}
          value={v.date}
          onChange={(e) => set("date", e.target.value)}
          className={`${field} w-[min(13ch,100%)] min-w-[12.5ch] text-[0.8em] [&::-webkit-calendar-picker-indicator]:ml-1 [&::-webkit-calendar-picker-indicator]:opacity-50`}
          {...err("date")}
        />
        <span>.</span>
      </p>

      <div className="mt-8">
        <label htmlFor={`${id}-message`} className={`t-small block ${dark ? "text-on-night-soft" : "text-ink-soft"}`}>
          Anything you&apos;d like us to know? <span className="italic">(optional · please don&apos;t include detailed medical information)</span>
        </label>
        <textarea
          id={`${id}-message`}
          name="message"
          rows={3}
          maxLength={MAX_MESSAGE}
          value={v.message}
          onChange={(e) => set("message", e.target.value)}
          className={`mt-2 w-full resize-y rounded-2xl border bg-transparent p-4 text-[15px] leading-relaxed outline-none transition-colors focus:border-leaf ${
            dark ? "border-paper/20 text-paper" : "border-[var(--color-hair)] text-ink"
          }`}
          {...err("message")}
        />
      </div>

      {/* Honeypot (hidden from people and assistive technology) */}
      <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden">
        <label htmlFor={`${id}-company`}>Company</label>
        <input id={`${id}-company`} name="company" tabIndex={-1} autoComplete="off" value={v.company} onChange={(e) => set("company", e.target.value)} />
      </div>

      <label className={`mt-6 flex cursor-pointer items-start gap-3 text-[14.5px] leading-relaxed ${dark ? "text-on-night-soft" : "text-ink-soft"}`}>
        <input
          id={`${id}-consent`}
          type="checkbox"
          checked={v.consent}
          onChange={(e) => set("consent", e.target.checked)}
          className="mt-1 h-4 w-4 shrink-0 accent-[var(--color-violet)]"
          {...err("consent")}
        />
        <span>
          I agree that Momtree IVF may contact me by phone or WhatsApp about this request. My details are used only for this purpose.{" "}
          <Link href="/privacy" className="link-under">Privacy policy</Link>
        </span>
      </label>

      {touched && Object.keys(errors).length > 0 && (
        <ul className="mt-6 space-y-1 text-[14px] text-[#a1362b]" role="alert">
          {(Object.keys(errors) as (keyof FieldErrors)[]).map((k) => (
            <li key={k} id={`${id}-${k}-err`}>
              {errors[k]}
            </li>
          ))}
        </ul>
      )}

      {status === "unavailable" && (
        <div role="status" className={`mt-6 rounded-2xl border p-5 text-[15px] leading-relaxed ${dark ? "border-paper/20" : "border-[var(--color-hair)] bg-white/60"}`}>
          Online requests are not connected yet, so your details were not sent. Please call or WhatsApp us, and we will be glad to help.
          <div className="mt-4 flex flex-wrap gap-3">
            <a href={site.phone.href} className="btn btn-solid !min-h-[44px]">
              <Phone /> Call {site.phone.display}
            </a>
            <a href={whatsappLink()} target="_blank" rel="noopener noreferrer" className="btn !min-h-[44px]">
              <WhatsApp className="h-4 w-4" /> WhatsApp
            </a>
          </div>
        </div>
      )}
      {status === "error" && (
        <p role="alert" className="mt-6 text-[15px] text-[#a1362b]">
          Something went wrong and your request was not sent. Please try again, or call us on {site.phone.display}.
        </p>
      )}

      <div className="mt-8 flex flex-wrap items-center gap-4">
        <button type="submit" className={`btn ${dark ? "btn-leaf" : "btn-solid"}`} disabled={status === "sending"}>
          {status === "sending" ? "Sending…" : "Request a consultation"} <ArrowRight />
        </button>
        <p id={`${id}-privacy`} className={`text-[12.5px] ${dark ? "text-on-night-soft" : "text-ink-soft"}`}>
          We will call to confirm a time. Your information is confidential.
        </p>
      </div>
    </form>
  );
}

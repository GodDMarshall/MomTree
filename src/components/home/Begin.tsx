import { AppointmentForm } from "@/components/forms/AppointmentForm";
import { MapCard } from "@/components/site/MapCard";
import { Rings } from "@/components/ui/Rings";
import { Words } from "@/components/ui/Words";
import { Pending } from "@/components/ui/Pending";
import { site, whatsappLink } from "@/lib/site";
import { Mail, Phone, WhatsApp } from "@/components/ui/Icons";

export function Begin({ id = "begin", heading = "Your questions *matter.* Let's talk." }: { id?: string; heading?: string }) {
  return (
    <section data-rail="Begin" id={id} className="section relative overflow-hidden bg-lilac/60 scroll-mt-24" aria-labelledby={`${id}-title`}>
      <Rings className="pointer-events-none absolute -left-[20vw] -top-[18vw] w-[60vw] max-w-[860px] text-violet/15" count={9} />
      <div className="wrap relative grid gap-16 lg:grid-cols-12">
        <div className="lg:col-span-7">
          <p className="t-label" data-reveal="">
            Begin a conversation
          </p>
          <Words id={`${id}-title`} as="h2" className="t-display mt-6 max-w-[14ch]" text={heading} />
          <p className="t-lede mt-6 max-w-[48ch]" data-reveal="">
            Every journey deserves individual attention. Tell us a little, and our fertility care team will call you to find a time that suits you.
          </p>
          <div className="mt-12" id="appointment">
            <AppointmentForm />
          </div>
        </div>

        <aside className="lg:col-span-4 lg:col-start-9" aria-label="Visit and contact details">
          <MapCard className="aspect-[4/5] w-full" />
          <dl className="mt-8 space-y-5 text-[15px]">
            <div>
              <dt className="t-label">Visit</dt>
              <dd className="mt-2 leading-relaxed">
                {site.address.building}, {site.address.street}, {site.address.locality}, {site.address.city} {site.address.postalCode}
              </dd>
            </div>
            <div>
              <dt className="t-label">Call</dt>
              <dd className="mt-2 flex flex-col gap-1">
                <a href={site.phone.href} className="inline-flex items-center gap-2 link-line self-start">
                  <Phone /> {site.phone.display}
                </a>
                <a href={site.phoneAlt.href} className="inline-flex items-center gap-2 link-line self-start">
                  <Phone /> {site.phoneAlt.display}
                </a>
              </dd>
            </div>
            <div>
              <dt className="t-label">Write</dt>
              <dd className="mt-2 flex flex-col gap-1">
                <a href={`mailto:${site.email}`} className="inline-flex items-center gap-2 link-line self-start">
                  <Mail /> {site.email}
                </a>
                <a href={whatsappLink()} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 link-line self-start">
                  <WhatsApp className="h-4 w-4" /> WhatsApp
                </a>
              </dd>
            </div>
            <div>
              <dt className="t-label">Hours</dt>
              <dd className="mt-2">
                <Pending>Opening hours to be confirmed by the clinic</Pending>
              </dd>
            </div>
          </dl>
        </aside>
      </div>
    </section>
  );
}

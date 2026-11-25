"use client";

import { useState } from "react";
import { addressOneLine, mapsLinks, site } from "@/lib/site";
import { Rings } from "@/components/ui/Rings";
import { Pin } from "@/components/ui/Icons";

/**
 * Map with a privacy-friendly facade: Google Maps (and its cookies) loads only when asked for.
 * "Get directions" always works without loading the embed. Until the clinic's location is set
 * (site.mapQuery in src/lib/site.ts), the card shows the address and a short note, and nothing is
 * requested from Google.
 */
export function MapCard({ className = "" }: { className?: string }) {
  const [load, setLoad] = useState(false);
  return (
    <div className={`relative overflow-hidden rounded-[28px] bg-lilac ${className}`}>
      {load && mapsLinks ? (
        <iframe
          title={`Map showing ${site.name}`}
          src={mapsLinks.embed}
          className="absolute inset-0 h-full w-full border-0"
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
        />
      ) : (
        <div className="absolute inset-0 grid place-items-center">
          <Rings className="absolute h-[140%] w-[140%] text-violet/12" count={9} />
          <div className="relative flex flex-col items-center px-6 text-center">
            <span className="grid h-14 w-14 place-items-center rounded-full bg-paper text-violet shadow-[0_10px_30px_-12px_rgb(29_26_38/0.4)]">
              <Pin className="h-6 w-6" />
            </span>
            <p className="mt-4 max-w-[30ch] text-[14px] leading-relaxed text-ink-soft">{addressOneLine}</p>
            {mapsLinks ? (
              <>
                <div className="mt-5 flex flex-wrap justify-center gap-3">
                  <a href={mapsLinks.directions} target="_blank" rel="noopener noreferrer" className="btn btn-solid !min-h-[44px] !text-[11px]">
                    Get directions
                  </a>
                  <button type="button" onClick={() => setLoad(true)} className="btn !min-h-[44px] !text-[11px]">
                    Show map
                  </button>
                </div>
                <p className="mt-3 text-[11.5px] text-ink-soft">Showing the map loads Google Maps.</p>
              </>
            ) : (
              <p className="mt-3 max-w-[30ch] text-[11.5px] text-ink-soft">The map appears here once the clinic&apos;s location is set.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

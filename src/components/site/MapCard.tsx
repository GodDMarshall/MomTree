"use client";

import { useState } from "react";
import { addressOneLine, mapsLinks } from "@/lib/site";
import { Rings } from "@/components/ui/Rings";
import { Pin } from "@/components/ui/Icons";

/**
 * Map with a privacy-friendly facade: Google Maps (and its cookies) loads only when asked for.
 * "Get directions" always works without loading the embed.
 */
export function MapCard({ className = "" }: { className?: string }) {
  const [load, setLoad] = useState(false);
  return (
    <div className={`relative overflow-hidden rounded-[28px] bg-lilac ${className}`}>
      {load ? (
        <iframe
          title="Map showing Momtree IVF, Vijayanagar, Mysuru"
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
            <div className="mt-5 flex flex-wrap justify-center gap-3">
              <a href={mapsLinks.directions} target="_blank" rel="noopener noreferrer" className="btn btn-solid !min-h-[44px] !text-[11px]">
                Get directions
              </a>
              <button type="button" onClick={() => setLoad(true)} className="btn !min-h-[44px] !text-[11px]">
                Show map
              </button>
            </div>
            <p className="mt-3 text-[11.5px] text-ink-soft">Showing the map loads Google Maps.</p>
          </div>
        </div>
      )}
    </div>
  );
}

import Image from "next/image";
import { roman } from "@/lib/format";

type Props = {
  src: string;
  alt: string;
  width: number;
  height: number;
  /** Plate number shown in the caption as a roman numeral. */
  n?: number;
  caption?: React.ReactNode;
  shape?: "arch" | "capsule" | "soft" | "none";
  className?: string;
  imgClassName?: string;
  sizes?: string;
  priority?: boolean;
  /** Animate the aperture opening when scrolled into view. */
  open?: boolean;
  aspect?: string;
};

/** A photograph or illustration presented as a numbered plate with an italic caption. */
export function Plate({
  src,
  alt,
  width,
  height,
  n,
  caption,
  shape = "soft",
  className = "",
  imgClassName = "",
  sizes = "(max-width: 768px) 100vw, 50vw",
  priority,
  open = true,
  aspect,
}: Props) {
  const shapeClass = shape === "arch" ? "ap-arch" : shape === "capsule" ? "ap-capsule" : shape === "soft" ? "ap-soft" : "";
  const radius = shape === "arch" ? "999px 999px 18px 18px" : shape === "capsule" ? "999px" : shape === "soft" ? "18px" : "0";
  return (
    <figure className={`plate ${className}`}>
      <div
        className={`relative overflow-hidden bg-lilac ${shapeClass}`}
        style={{ aspectRatio: aspect ?? `${width} / ${height}`, ["--ap-r" as string]: radius }}
        {...(open ? { "data-aperture": "" } : {})}
      >
        <Image
          src={src}
          alt={alt}
          fill
          sizes={sizes}
          priority={priority}
          className={`object-cover ${imgClassName}`}
          quality={75}
        />
      </div>
      {(caption || n) && (
        <figcaption>
          {n ? <span className="pl">Pl. {roman(n)}</span> : null}
          {caption ? <span>{caption}</span> : null}
        </figcaption>
      )}
    </figure>
  );
}

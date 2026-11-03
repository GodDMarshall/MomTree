import Link from "next/link";
import { Rings } from "@/components/ui/Rings";

export default function NotFound() {
  return (
    <section className="relative grid min-h-[90svh] place-items-center overflow-hidden px-[var(--gutter)] pb-20 pt-28 text-center">
      <Rings className="pointer-events-none absolute left-1/2 top-1/2 w-[min(110vw,900px)] -translate-x-1/2 -translate-y-1/2 text-leaf/40" count={10} />
      <div className="relative">
        <p className="t-label">Page not found</p>
        <h1 className="t-display mt-6">
          This path <em>leads elsewhere.</em>
        </h1>
        <p className="t-lede mx-auto mt-6 max-w-[44ch]">The page you were looking for has moved or does not exist. These may help:</p>
        <div className="mt-10 flex flex-wrap justify-center gap-3">
          <Link href="/" className="btn btn-solid">
            Home
          </Link>
          <Link href="/treatments" className="btn">
            Treatments
          </Link>
          <Link href="/contact" className="btn">
            Contact
          </Link>
        </div>
      </div>
    </section>
  );
}

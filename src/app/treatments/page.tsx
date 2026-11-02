import type { Metadata } from "next";
import { PageHero } from "@/components/site/PageHero";
import { CtaBand, MedicalNote } from "@/components/site/CtaBand";
import { TreatmentIndex } from "@/components/home/TreatmentIndex";
import { Pending } from "@/components/ui/Pending";

export const metadata: Metadata = {
  title: "Treatments",
  description:
    "Fertility evaluation, ovulation induction, IUI, IVF, ICSI, blastocyst culture, laser-assisted hatching, laparoscopy, hysteroscopy, ultrasound, andrology, ART banking, donor and surrogacy services at Momtree IVF, Mysuru.",
  alternates: { canonical: "/treatments" },
};

export default function TreatmentsPage() {
  return (
    <>
      <PageHero
        crumbs={[
          { name: "Home", path: "/" },
          { name: "Treatments", path: "/treatments" },
        ]}
        label="Treatment & care"
        title="Every treatment, *explained plainly.*"
        lede="From a first evaluation to IVF and beyond. Each page explains what a treatment is, who may be evaluated for it, how it works, what to expect, and its risks and limits."
      >
        <div className="mt-8">
          <Pending>All treatment pages: awaiting medical review</Pending>
        </div>
      </PageHero>
      <div className="-mt-20">
        <TreatmentIndex />
      </div>
      <div className="wrap pb-16">
        <MedicalNote />
      </div>
      <CtaBand title="Not sure *where to begin?*" text="Most journeys start with a fertility evaluation of both partners. We will help you understand your options before suggesting any treatment." />
    </>
  );
}

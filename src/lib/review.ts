// Review mode marks every piece of content the clinic has not yet approved (medical copy,
// credentials, claims, testimonials, and the sample content of the demo build). It is ON by default
// so nothing unverified can quietly go live. Set NEXT_PUBLIC_REVIEW_MODE=false only once the clinic
// has signed off docs/LAUNCH-CHECKLIST.md (a live version is at /review while review mode is on).
export const REVIEW_MODE = process.env.NEXT_PUBLIC_REVIEW_MODE !== "false";

export type ReviewStatus = "approved" | "pending";

export type ReviewItem = {
  area: string;
  item: string;
  why: string;
  where: string;
};

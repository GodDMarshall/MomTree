// Review mode marks every piece of content the clinic has not yet approved (medical copy,
// credentials, claims, testimonials). It is ON by default so nothing unverified can quietly go live.
// Set NEXT_PUBLIC_REVIEW_MODE=false only after docs/APPROVAL-CHECKLIST.md is signed off.
export const REVIEW_MODE = process.env.NEXT_PUBLIC_REVIEW_MODE !== "false";

export type ReviewStatus = "approved" | "pending";

export type ReviewItem = {
  area: string;
  item: string;
  why: string;
  where: string;
};

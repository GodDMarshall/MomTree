import { REVIEW_MODE } from "@/lib/review";

/**
 * Visible marker on content awaiting the clinic's approval. Renders nothing once review mode is
 * switched off for launch (NEXT_PUBLIC_REVIEW_MODE=false).
 */
export function Pending({ children = "Pending clinical review", className = "" }: { children?: React.ReactNode; className?: string }) {
  if (!REVIEW_MODE) return null;
  return (
    <span className={`pending ${className}`} role="note">
      {children}
    </span>
  );
}

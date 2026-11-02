import { Fragment } from "react";

/** Render "*word*" segments in italic: the house style for emotional emphasis in headings. */
export function rich(text: string) {
  return text.split("*").map((seg, i) => (i % 2 ? <em key={i}>{seg}</em> : <Fragment key={i}>{seg}</Fragment>));
}

export function plain(text: string) {
  return text.replace(/\*/g, "");
}

const ROMAN: [number, string][] = [
  [10, "x"],
  [9, "ix"],
  [5, "v"],
  [4, "iv"],
  [1, "i"],
];

/** Lower-case roman numerals for plate numbers (1 → i, 14 → xiv). */
export function roman(n: number): string {
  let out = "";
  let rest = n;
  for (const [v, s] of ROMAN) {
    while (rest >= v) {
      out += s;
      rest -= v;
    }
  }
  return out;
}

export function pad2(n: number) {
  return String(n).padStart(2, "0");
}

export function slugify(s: string) {
  return s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/[\s_]+/g, "-");
}

import type { ElementType } from "react";

type Props = {
  /** Text to reveal word by word. Wrap words in *asterisks* to set them in italic. */
  text: string;
  as?: ElementType;
  className?: string;
  delay?: number;
  id?: string;
};

/**
 * Headline that rises into view word by word. The words stay real text in the DOM,
 * so search engines and screen readers read the sentence normally.
 */
export function Words({ text, as: Tag = "h2", className = "", delay = 0, id }: Props) {
  const segments = text.split("*");
  let index = 0;
  return (
    <Tag id={id} className={`words ${className}`} data-reveal-words style={{ ["--d" as string]: `${delay}s` }}>
      {segments.map((segment, si) => {
        const italic = si % 2 === 1;
        const words = segment.split(/(\s+)/);
        return words.map((w, wi) => {
          if (!w) return null;
          if (/^\s+$/.test(w)) return " ";
          const i = index++;
          const inner = <span style={{ ["--i" as string]: i }}>{w}</span>;
          return (
            <span className="w" key={`${si}-${wi}`}>
              {italic ? <em className="italic">{inner}</em> : inner}
            </span>
          );
        });
      })}
    </Tag>
  );
}

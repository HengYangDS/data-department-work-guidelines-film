/* Term rows: a key term and its qualifier read as one name, on one line or stacked. */

import { mutedLevel } from "../drawing/levels.js";
import { labelSize, measure } from "../drawing/strokes.js";
import { LABEL, P } from "../palette.js";
import { blockHeight, growLines, growName } from "./parts.js";

/* A key term and its qualifier, read as one name: the term at the label size, the qualifier smaller and muted after it
 * on the same centre line, or on the next line when the row would be wider than `width`. The term stands whole from its
 * words and the qualifier joins it whole on its own, so a long condition reads as a few key words rather than a
 * sentence; a qualifier that lists what is said over several seconds may `build`, each part on its own words. */
export const NOTE = 22,
  TERM_GAP = 16;
/* A qualifier set under its term stands this far below the term's line, so at least 12 px of ground stays clear
 * between their inks. */
export const TERM_STACK = 10;
/* Whether a term row keeps its qualifier on the term's line, and the row's height. A list sets every row's qualifier
 * the same way: `inline` true or false decides it for the row, and null lets the row's own width decide. */
export function termRowLayout(term, qual, width = Infinity, inline = null) {
  const one =
    !qual.length ||
    (inline ?? measure(term.join(""), LABEL) + TERM_GAP + measure(qual.join(""), NOTE) <= width);
  const head = blockHeight(growLines(term, width).length);
  return {
    one,
    height: one ? head : head + TERM_STACK + blockHeight(growLines(qual, width, NOTE).length, NOTE),
  };
}
/* A row centred or ended on x by `align` sets its qualifier under the term unless `inline` says otherwise, so the term
 * stands on x from its first word and does not move when the qualifier joins. When the two share a line they centre
 * or end on x together; when the qualifier stands under the term, each line centres or ends on x. */
export function termRow(
  t,
  term,
  termAts,
  qual,
  qualAts,
  x,
  y,
  {
    width = Infinity,
    alpha = 1,
    color = P.ink,
    set = null,
    build = false,
    inline = null,
    align = "left",
  } = {},
) {
  const whole = [...term, ...qual].join(" "),
    { one } = termRowLayout(term, qual, width, inline ?? (align === "left" ? null : false)),
    shared = one && qual.length;
  const span = measure(term.join(""), LABEL) + TERM_GAP + measure(qual.join(""), NOTE),
    left = shared ? (align === "center" ? x - span / 2 : align === "right" ? x - span : x) : x;
  const head = growName(t, term, termAts, left, y, {
    width,
    alpha,
    color,
    whole,
    set,
    align: shared ? "left" : align,
  });
  if (!qual.length) return head;
  const after = left + measure(term.join(""), LABEL) + TERM_GAP;
  const tail = growName(
    t,
    qual,
    qualAts,
    one ? after : x,
    one ? head.top + (labelSize(LABEL) - labelSize(NOTE)) / 2 : head.bottom + TERM_STACK,
    {
      size: NOTE,
      alpha: mutedLevel(alpha),
      color: P.muted,
      width: one ? Infinity : width,
      whole,
      set,
      build,
      align: one ? "left" : align,
    },
  );
  return { top: head.top, bottom: Math.max(head.bottom, tail.bottom) };
}

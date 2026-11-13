/* Rejected names: a phrase the guidelines refuse, set legibly with its cross beside it. */

import { labelSize, measure } from "../drawing/strokes.js";
import { cross } from "../drawing/symbols.js";
import { LABEL, P } from "../palette.js";
import { nameText } from "./names.js";

/* A phrase the guidelines reject, set as a name: muted plain text that keeps its full ink as it is refused, so it stays
 * legible, while the cross beside the words rather than over them carries the refusal. */
/* A centred refusal centres its words and their cross together on x. `markLeft` stands the cross's left edge at one
 * x instead, so the crosses of a list of refused names form one column after its longest name; by default the cross
 * follows its own name. */
/* A Chinese closing quotation mark keeps most of its advance blank after its ink, so a mark set after a quoted name is
 * placed from the ink, as after any other name: the blank is the mark's advance as the line measures it, less where
 * its ink ends, in em of Noto Sans CJK SC. */
const CLOSING_INK = { "”": 0.376, "」": 0.35, "』": 0.35, "’": 0.194 };
const closingBlank = (line, size = LABEL) => {
  const ink = /[一-鿿]/u.test(line) ? CLOSING_INK[line.at(-1)] : undefined;
  return ink === undefined
    ? 0
    : Math.max(0, measure(line, size) - measure(line.slice(0, -1), size) - ink * labelSize(size));
};
export function rejectedName(
  v,
  x,
  y,
  {
    alpha = 1,
    mark = 1,
    size = LABEL,
    align = "center",
    valign = "middle",
    width = Infinity,
    set = null,
    markLeft = null,
  } = {},
) {
  const s = Math.min(26, labelSize(size) * 0.9),
    cx = align === "center" && markLeft === null ? x - (16 + s) / 2 : x;
  const block = nameText(v, cx, y, { align, valign, width, size, color: P.muted, alpha, set });
  const w = Math.max(...block.lines.map((line) => measure(line, size))),
    left = align === "left" ? cx : align === "right" ? cx - w : cx - w / 2;
  // The cross follows the ink of the line that reaches furthest right, and its stroke stays 3 px clear of the lines'
  // boxes, as a mark keeps clear of a name.
  const reach = Math.max(
    ...block.lines.map((line) => {
      const lw = measure(line, size);
      return (
        (align === "left" ? left + lw : align === "right" ? cx : cx + lw / 2) -
        closingBlank(line, size)
      );
    }),
  );
  const at = markLeft ?? Math.max(reach + 16, left + w + 5);
  cross(at + s / 2, (block.top + block.bottom) / 2, s, { alpha: alpha * mark, width: 3 });
  return { ...block, left, right: at + s };
}

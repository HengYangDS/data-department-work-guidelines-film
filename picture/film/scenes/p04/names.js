/* 04's names of authored parts, set in groups as one block. */

import { labelSize, measure } from "../../drawing/strokes.js";
import { LEADING } from "../../naming/names.js";
import { blockHeight, growLines, growName, growTexts } from "../../naming/parts.js";
import { LABEL, P } from "../../palette.js";

/* The groups of a name of `parts`, as [the index of the group's first part, its parts]; `groups` holds the index of the
 * part that begins each group. */
export const s04Groups = (parts, groups = [0]) =>
  groups.map((k, g) => [k, parts.slice(k, groups[g + 1] ?? parts.length)]);
/* The height of a growing name of `parts` wrapped to `width`, its groups' lines stacked as one block. */
export const s04Height = (parts, width, size, groups) =>
  blockHeight(
    s04Groups(parts, groups).reduce((n, [, v]) => n + growLines(v, width, size).length, 0),
    size,
  );
/* A name of authored parts set whole as one block centred on y: its lines begin at x, or with `align` right every line
 * ends at x. A long name said in groups is set as one name for each group, `groups` holding the index of the part that
 * begins each: each group stands whole on the words that begin it and its lines follow the group before in one block,
 * so no group stands long before its words; with `build`, each part joins its group on its own words. A list set one
 * part to a line may stand as one name: `whole`, its whole text, names every group. Proposed as a
 * primitive: growName with right alignment and a middle anchor. */
export function s04Grow(
  t,
  parts,
  ats,
  x,
  y,
  {
    width,
    size = LABEL,
    align = "left",
    alpha = 1,
    color = P.ink,
    set = null,
    groups = [0],
    build = false,
    whole = null,
  } = {},
) {
  const blocks = s04Groups(parts, groups).map(([k, v]) => [k, v, growTexts(v, width, size)]),
    step = labelSize(size) * LEADING;
  const top =
    y -
    blockHeight(
      blocks.reduce((n, [, , lines]) => n + lines.length, 0),
      size,
    ) /
      2;
  let r = 0;
  blocks.forEach(([k, v, lines]) =>
    lines.forEach((line) => {
      // A right-aligned line hangs a final list or clause mark half an em past the edge, as names do, since the mark's ink
      // fills only the left of its em, so the line's ink keeps the block's edge.
      const w = line.reduce((sum, [, piece]) => sum + measure(piece, size), 0);
      const hang =
        align === "right" && /[、，。；：！？]$/u.test(line.at(-1)[1]) ? 0.5 * labelSize(size) : 0;
      growName(
        t,
        line.map(([, piece]) => piece),
        line.map(([j]) => (build ? (ats[k + j] ?? ats[k]) : ats[k])),
        align === "right" ? x - w + hang : x,
        top + r++ * step,
        { size, alpha, color, whole: whole ?? v.join(""), set, build },
      );
    }),
  );
}

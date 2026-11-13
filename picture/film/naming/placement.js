/* Placement: where names stand by the rule of their structure, in a stacked column, along a rail, around a ring or
 * under a heading. */

import { measure } from "../drawing/strokes.js";
import { LABEL, P } from "../palette.js";
import { NAME_GAP, nameText, wrapName } from "./names.js";

/* The tops of blocks stacked in one column at one gap, the column centred on `cy`. */
export function stackTops(heights, cy, gap) {
  const total = heights.reduce((a, b) => a + b, 0) + gap * (heights.length - 1);
  return heights.reduce(
    (tops, h, i) => [...tops, i ? tops[i - 1] + heights[i - 1] + gap : cy - total / 2],
    [],
  );
}
/* The centre line of the content area, between the chapter label and the caption band; a composed stage balances its
 * groups about it. */
export const CONTENT_CY = 500;
/* Names along a rail: all on one side, on one baseline, each centred on its station; a name wider than its share of
 * the rail wraps onto a second line instead of stepping off the baseline. A rail too dense to keep its names whole on
 * one baseline takes `gap` as a function of a name's place, so its names, authored as one line each, stand on two
 * baselines at the rail's one pitch. */
export function railNames(
  names,
  xs,
  y,
  {
    side = 1,
    gap = NAME_GAP + 18,
    size = LABEL,
    alpha = () => 1,
    color = () => P.ink,
    wrap = RAIL_WRAP,
    set = `rail:${names[0]}`,
  } = {},
) {
  // Each name may use the rail up to its neighbours' share, less a gap, and wraps no wider than the rail's wrap width.
  const room = (i) =>
    Math.min(i ? xs[i] - xs[i - 1] : Infinity, i + 1 < xs.length ? xs[i + 1] - xs[i] : Infinity) -
    30;
  const gapOf = typeof gap === "function" ? gap : () => gap;
  names.forEach((v, i) => {
    const width = Math.min(wrap, room(i));
    nameText(v, xs[i], y + side * gapOf(i), {
      width,
      size,
      valign: side > 0 ? "top" : "bottom",
      align: "center",
      alpha: alpha(i),
      color: color(i),
      set,
    });
  });
}
/* Stations along a rail: evenly pitched from the first to the last, as long as every pair of neighbours keeps half of
 * each name's width plus a gap between them; otherwise each pair stands that far apart and the room left over is
 * shared evenly, so a long name widens its own interval rather than leaving the baseline. A name wider than the wrap
 * width is measured as wrapped, as railNames sets it. */
export const RAIL_WRAP = 240;
/* The second baseline of a rail whose names stand on two: a name's own height and leading below the first, so the two
 * rows take the height two lines of a name would. */
export const RAIL_ROW = 44;
export function railStations(
  names,
  first,
  last,
  { size = LABEL, gap = 34, wrap = RAIL_WRAP } = {},
) {
  const widths = names.map((v) =>
    Math.max(...wrapName(v, wrap, size).map((line) => measure(line, size))),
  );
  const need = widths.slice(1).map((w, i) => (widths[i] + w) / 2 + gap),
    pitch = names.length > 1 ? (last - first) / (names.length - 1) : 0;
  if (need.every((d) => d <= pitch)) return names.map((_, i) => first + i * pitch);
  const slack =
    Math.max(0, last - first - need.reduce((a, b) => a + b, 0)) / Math.max(1, need.length);
  return need.reduce((xs, d) => [...xs, xs.at(-1) + d + slack], [first]);
}
/* A name around a ring, set `gap` outside it along its angle: names on the right begin at their mark, names on the
 * left end at it, and names at the top and bottom centre on it. */
export function radialName(v, cx, cy, r, a, { gap = NAME_GAP, ry = r, width = 260, ...o } = {}) {
  const c = Math.cos(a),
    sn = Math.sin(a),
    x = cx + c * (r + gap),
    y = cy + sn * (ry + gap);
  const align = c > 0.3 ? "left" : c < -0.3 ? "right" : "center",
    valign = align === "center" ? (sn > 0 ? "top" : "bottom") : "middle";
  return nameText(v, x, y, { align, valign, width, ...o });
}
/* A heading over a row of names or marks stands this far clear above them, so it heads the whole row instead of
 * reading as one more line of the nearest name. Scenes 01-10 use it. */
export const HEAD_CLEAR = 64;

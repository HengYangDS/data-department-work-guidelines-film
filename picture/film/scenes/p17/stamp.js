/* 17's completion stamp: a ring whose arcs light with the conditions, and its check. */

import { ctx } from "../../canvas.js";
import { stroke } from "../../drawing/strokes.js";
import { check, ring } from "../../drawing/symbols.js";
import { P } from "../../palette.js";

/* The completion stamp of 17.1: one quiet ring standing from the claim's first words, open by a hair at its top, with
 * its check waiting in it, quiet, and its name. Each condition lights one arc of the ring where its row meets it, the
 * arc spreading from that point to its ends, so completion reads as the sum of its conditions; the arcs tile the ring,
 * and the check is struck when all six have lit. The lit arcs of one colour are one stroke, so the lit ring reads, and
 * counts, as one part of the stamp rather than as arcs each waiting for a name. `arcs` are the arcs' extents in
 * degrees, clockwise from the right, and `meets` the angles where their rows meet the ring. */
export function s17Stamp(x, y, r, arcs, meets, lights, colors, { alpha = 1, struck = 0 } = {}) {
  ring(x, y, r, {
    color: P.line,
    alpha: alpha * 0.9,
    width: 4,
    start: -Math.PI / 2 + 0.04,
    upto: 1 - 0.08 / (2 * Math.PI),
  });
  [...new Set(colors)].forEach((color) => {
    if (!arcs.some((_, k) => colors[k] === color && lights[k] > 0)) return;
    stroke(
      () =>
        arcs.forEach(([a, b], k) => {
          if (colors[k] !== color || lights[k] <= 0) return;
          const m = meets[k],
            a0 = ((m - (m - a - 1.5) * lights[k]) * Math.PI) / 180,
            a1 = ((m + (b - 1.5 - m) * lights[k]) * Math.PI) / 180;
          ctx.moveTo(x + r * Math.cos(a0), y + r * Math.sin(a0));
          ctx.arc(x, y, r, a0, a1);
        }),
      { color, alpha, width: 8 },
    );
  });
  check(x, y - 22, r * 0.5, { color: P.line, alpha: alpha * 0.7 });
  check(x, y - 22, r * 0.5, { alpha, upto: struck });
}

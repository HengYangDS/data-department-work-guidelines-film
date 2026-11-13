/* 12's arcs: an arc of its ring drawn through its own points. */

import { ctx } from "../../canvas.js";

/* An arc of 12.1's ring drawn through its own points, so each condition's arc and each group's run is a mark of its own
 * extent: as a canvas arc it would report its whole circle, the place of every other arc of the ring, and one arc
 * lighting while the next arrives would read as one arc taking another's place. */
export function s12Arc(cx, cy, r, a0, a1) {
  const n = Math.max(2, Math.ceil(Math.abs(a1 - a0) / 0.04));
  for (let k = 0; k <= n; k++) {
    const a = a0 + ((a1 - a0) * k) / n;
    (k ? ctx.lineTo : ctx.moveTo).call(ctx, cx + r * Math.cos(a), cy + r * Math.sin(a));
  }
}

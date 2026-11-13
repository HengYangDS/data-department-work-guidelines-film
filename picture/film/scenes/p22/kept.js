/* 22's icons for what an interruption preserves. */

import { ctx } from "../../canvas.js";
import { box, dot, line, stroke } from "../../drawing/strokes.js";
import { check, cross } from "../../drawing/symbols.js";
import { P } from "../../palette.js";

/* Icons for what an interruption preserves: state, uncommitted work, attempts and failures, and where to resume (a
 * page marked at the row to pick up from). */
export const dlKept = [
  (x, y, a) => {
    stroke(() => ctx.arc(x, y + 10, 24, Math.PI, Math.PI * 2), {
      color: P.authority,
      alpha: a,
      width: 3,
    });
    line(x, y + 10, x + 14, y - 8, { color: P.ink, alpha: a, width: 3 });
    dot(x, y + 10, 4, { color: P.ink, alpha: a });
  },
  (x, y, a) => {
    box(x - 17, y - 24, 34, 48, { stroke: P.ink, alpha: a, radius: 4, width: 2, dash: [5, 4] });
    line(x - 9, y - 6, x + 9, y - 6, { color: P.muted, alpha: a, width: 2 });
    line(x - 9, y + 6, x + 5, y + 6, { color: P.muted, alpha: a, width: 2 });
  },
  (x, y, a) => {
    cross(x - 14, y - 12, 14, { alpha: a, width: 3 });
    cross(x - 14, y + 12, 14, { alpha: a, width: 3 });
    check(x + 14, y, 22, { alpha: a });
  },
  (x, y, a) => {
    box(x - 13, y - 24, 26, 48, { stroke: P.ink, alpha: a, radius: 3, width: 2 });
    line(x - 24, y + 4, x + 20, y + 4, { color: P.evidence, alpha: a, width: 3 });
    dot(x - 24, y + 4, 5, { color: P.evidence, alpha: a });
  },
];

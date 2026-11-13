/* 07's marks: the problem as a knot of interacting parts, and the eye that observes. */

import { ctx } from "../../canvas.js";
import { link } from "../../drawing/links.js";
import { dot, stroke, text } from "../../drawing/strokes.js";
import { ring } from "../../drawing/symbols.js";
import { P } from "../../palette.js";

/* The problem as a knot of interacting parts: an open question at its centre, joined to four parts around it. The first
 * two stages keep it in one place, so the relationships of the second are the knot's own. */
export function s07Knot(x, y, alpha) {
  if (alpha < 0.01) return;
  [
    [-170, -60],
    [170, -70],
    [-140, 80],
    [160, 70],
  ].forEach(([dx, dy]) => {
    link(x + Math.sign(dx) * 52, y, x + dx, y + dy - Math.sign(dy) * 16, {
      route: "hv",
      alpha,
      end: false,
    });
    dot(x + dx, y + dy, 12, { color: P.muted, alpha });
  });
  dot(x, y, 44, { color: P.row, alpha });
  ring(x, y, 44, { color: P.ink, alpha, width: 2.5 });
  text("?", x, y + 1, 26, { align: "center", color: P.muted, alpha, role: "mark" });
}
/* The eye that observes, drawn as an almond with its iris. */
export function s07Eye(x, y, alpha) {
  if (alpha < 0.01) return;
  stroke(
    () => {
      ctx.moveTo(x - 230, y);
      ctx.quadraticCurveTo(x, y - 128, x + 230, y);
      ctx.quadraticCurveTo(x, y + 128, x - 230, y);
    },
    { color: P.ink, alpha, width: 3 },
  );
  ring(x, y, 44, { color: P.evidence, alpha, width: 3 });
  dot(x, y, 16, { color: P.evidence, alpha });
}

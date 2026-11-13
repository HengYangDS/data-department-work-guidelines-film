/* Drawn relations: links that follow the grid in straight runs and quarter turns, draw on from their source and end
 * in a quiet point. */

import { ctx } from "../canvas.js";
import { P } from "../palette.js";
import { clamp } from "../timing/easing.js";
import { drawnShare, landedShare } from "../timing/pace.js";
import { flowDot, loopPhase } from "./flows.js";
import { along, dot, lengthOf, stroke } from "./strokes.js";

/* A drawn relation follows the grid: a straight run when its ends share a row or a column, otherwise an orthogonal
 * route whose corners are quarter turns of radius `r` (never a diagonal). It draws on from its source along its length
 * and ends in a quiet point rather than an arrowhead; `flowing`, the voice time since its flow began, runs dots along it
 * at the film's one flow pace to show the way the relation runs, so they rest in the quiet between thoughts, and `flow`,
 * a share of the way, carries one dot once along it. Routes: "vhv" leaves vertically, crosses at `mid` and arrives vertically; "hvh" the reverse;
 * "vh" and "hv" turn once. */
export function rounded(corners, r) {
  const out = [corners[0]];
  for (let i = 1; i < corners.length - 1; i++) {
    const [ax, ay] = corners[i - 1],
      [bx, by] = corners[i],
      [cx2, cy2] = corners[i + 1];
    const d1 = Math.hypot(bx - ax, by - ay),
      d2 = Math.hypot(cx2 - bx, cy2 - by);
    if (d1 < 1e-6 || d2 < 1e-6) continue;
    const k = Math.min(r, d1 / 2, d2 / 2),
      p = [bx - ((bx - ax) / d1) * k, by - ((by - ay) / d1) * k],
      q = [bx + ((cx2 - bx) / d2) * k, by + ((cy2 - by) / d2) * k];
    for (let n = 0; n <= 6; n++) {
      const u = n / 6;
      out.push([
        (1 - u) ** 2 * p[0] + 2 * (1 - u) * u * bx + u * u * q[0],
        (1 - u) ** 2 * p[1] + 2 * (1 - u) * u * by + u * u * q[1],
      ]);
    }
  }
  out.push(corners.at(-1));
  return out;
}
export function link(
  x1,
  y1,
  x2,
  y2,
  {
    route = null,
    mid = null,
    r = 14,
    color = P.line,
    alpha = 1,
    upto = 1,
    draw = null,
    width = 2,
    dash = null,
    flow = null,
    flowing = null,
    lag = 0,
    last = Infinity,
    span = null,
    fade = 1,
    end = true,
  } = {},
) {
  if (alpha < 0.01 || upto <= 0 || Math.hypot(x2 - x1, y2 - y1) < 1) return;
  const kind = route ?? (Math.abs(x1 - x2) < 0.5 || Math.abs(y1 - y2) < 0.5 ? "straight" : "vhv");
  const m = mid ?? (kind === "vhv" ? (y1 + y2) / 2 : (x1 + x2) / 2);
  const corners = {
    straight: [
      [x1, y1],
      [x2, y2],
    ],
    vhv: [
      [x1, y1],
      [x1, m],
      [x2, m],
      [x2, y2],
    ],
    hvh: [
      [x1, y1],
      [m, y1],
      [m, y2],
      [x2, y2],
    ],
    vh: [
      [x1, y1],
      [x1, y2],
      [x2, y2],
    ],
    hv: [
      [x1, y1],
      [x2, y1],
      [x2, y2],
    ],
  }[kind];
  const points = rounded(corners, r),
    length = lengthOf(points),
    extent = clamp(upto);
  // `draw` draws it on from its source over `upto` of its length at the tip pace (drawnShare).
  if (draw) upto = drawnShare(draw, length, extent);
  if (upto <= 0) return;
  const drawn = along(points, upto).kept;
  if (drawn.length > 1)
    stroke(() => drawn.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y))), {
      color,
      alpha,
      width,
      dash,
    });
  // The quiet point at the end grows by its size as it inks in while the line arrives, as a flow's dot enters, so it
  // never stands out at once: over the last tenth of the line, or, drawn at the tip pace, over its last LANDING seconds
  // (landedShare), so a short link's point does not appear whole within a frame.
  const arrived = draw && extent >= 1 ? landedShare(draw, length) : clamp((upto - 0.9) / 0.1);
  if (end) dot(x2, y2, (width + 2.5) * arrived, { color, alpha: alpha * arrived });
  // A looping flow (`flowing`, voice time since it began) runs its dots at the film's one flow pace (see loopPhase), timed
  // by the way's length, or by `span` for a way whose ends move, so its dot never skips as the way stretches;
  // `flow` instead stands one dot at that share of the way, for a dot carried once along it; `fade` fades the dot alone.
  if (flowing === null && flow === null) return;
  const way = span ?? length,
    q = flowing !== null ? loopPhase(flowing, way, lag, last) : flow;
  if (q !== null && q < upto && fade > 0.01) {
    const [px, py] = along(points, q).point;
    flowDot(px, py, width + 2, q, { color, alpha: alpha * fade }, way);
  }
}

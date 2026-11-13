/* Pages as several scenes draw them: a document with its text rows ruled in one stroke, in the two forms the scenes
 * share. */

import { ctx } from "../canvas.js";
import { P } from "../palette.js";
import { fill, stroke } from "./strokes.js";
import { documentIcon } from "./symbols.js";

/* A page of my scenes: the document icon with its text rows ruled as one stroke, set where the icon sets them, so a
 * page's lines read, and count, as one block of text rather than as separate marks. */
export function s17Page(
  x,
  y,
  w,
  h,
  { alpha = 1, stroke: edge = P.ink, rows = 4, fillColor = P.row, fold = true } = {},
) {
  if (alpha < 0.01) return;
  documentIcon(x, y, w, h, { alpha, stroke: edge, rows: 0, fillColor, fold });
  if (rows > 0)
    stroke(
      () => {
        for (let i = 0; i < rows; i++) {
          const ry = y + h * (0.3 + (i * 0.55) / Math.max(1, rows));
          ctx.moveTo(x + w * 0.14, ry);
          ctx.lineTo(x + w * (i % 2 ? 0.62 : 0.82), ry);
        }
      },
      { color: P.muted, alpha: alpha * 0.8, width: 2 },
    );
}

/* A page of scene 23 drawn in few strokes: its fill, its outline with the fold in one stroke, and its ruled rows in
 * one stroke, so a stage of pages and glyphs leaves the frame in one cut without a scatter of separate marks. */
export function s23Page(x, y, w, h, { alpha = 1, stroke: s = P.ink, rows = 0 } = {}) {
  if (alpha < 0.01) return;
  const c = Math.min(22, w * 0.2);
  fill(
    () => {
      ctx.moveTo(x, y);
      ctx.lineTo(x + w - c, y);
      ctx.lineTo(x + w, y + c);
      ctx.lineTo(x + w, y + h);
      ctx.lineTo(x, y + h);
      ctx.closePath();
    },
    { color: P.row, alpha },
  );
  stroke(
    () => {
      ctx.moveTo(x + w - c, y + c);
      ctx.lineTo(x + w - c, y);
      ctx.lineTo(x, y);
      ctx.lineTo(x, y + h);
      ctx.lineTo(x + w, y + h);
      ctx.lineTo(x + w, y + c);
      ctx.lineTo(x + w - c, y + c);
      ctx.lineTo(x + w - c, y);
    },
    { color: s, alpha, width: 2 },
  );
  if (rows)
    stroke(
      () => {
        for (let i = 0; i < rows; i++) {
          const ry = y + h * (0.3 + (i * 0.55) / Math.max(1, rows));
          ctx.moveTo(x + w * 0.14, ry);
          ctx.lineTo(x + w * (i % 2 ? 0.62 : 0.82), ry);
        }
      },
      { color: P.muted, alpha: alpha * 0.8, width: 2 },
    );
}

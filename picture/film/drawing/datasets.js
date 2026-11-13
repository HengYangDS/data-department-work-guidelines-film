/* Datasets as several scenes draw them: the price history the film opens and closes on, as a card, and tables with
 * their rules in one stroke. */

import { ctx } from "../canvas.js";
import { nameText } from "../naming/names.js";
import { P } from "../palette.js";
import { L } from "../timeline.js";
import { mix } from "../timing/easing.js";
import { blend } from "./colour.js";
import { box, line, stroke, text } from "./strokes.js";
import { check } from "./symbols.js";

/* The finished dataset of the opening: a short price history whose values the next user must be able to rely on. */
const PRICES = ["101.18", "100.94", "101.37", "101.06"];
/* The dataset as a card: its name through the name layout and its values as marks. The third value is the number in
 * question: a bar at its row lights as each number is asked about, and it turns unknown when nobody can explain it. The
 * card's content keeps one inset on each side: the title, the rule and the row marks start at one left edge, the rule,
 * the values and the check end at one right edge, and the content block stands at equal padding from the card's top
 * and bottom. The rows are ruled in one stroke, the card's one table, so they are part of the named card rather than
 * repeated marks each waiting for a name of its own. */
export const REPORT_ROW = (i, scale = 1) => (119 + i * 66) * scale;
export function reportCard(
  x,
  y,
  { alpha = 1, scale = 1, highlight = 0, unknown = 0, done = 0, rows = PRICES, named = alpha } = {},
) {
  if (alpha < 0.01) return;
  const w = 300 * scale,
    h = 360 * scale,
    inset = 28 * scale,
    head = y + 45 * scale,
    rule = y + 73 * scale;
  box(x, y, w, h, { fill: P.row, alpha, radius: 10 });
  box(x, y, w, h, { stroke: P.ink, alpha: alpha * 0.9, radius: 10 });
  line(x + inset, rule, x + w - inset, rule, { color: P.line, alpha, width: 2 });
  nameText(L("历史价格", "Price history"), x + inset, head, {
    align: "left",
    color: P.muted,
    alpha: named,
  });
  stroke(
    () =>
      rows.forEach((_, i) => {
        ctx.moveTo(x + inset, y + REPORT_ROW(i, scale));
        ctx.lineTo(x + 120 * scale, y + REPORT_ROW(i, scale));
      }),
    { color: P.line, alpha, width: 2 },
  );
  rows.forEach((value, i) => {
    const ry = y + REPORT_ROW(i, scale),
      hot = i === 2,
      tone = blend(P.evidence, P.unknown, unknown);
    if (hot && highlight > 0)
      line(x + 14 * scale, ry - 20 * scale, x + 14 * scale, ry + 20 * scale, {
        color: tone,
        alpha: alpha * highlight,
        width: 4,
      });
    // Once one value is in question, the others step back, to 0.51 of full ink, at which ink still reads at 4.6:1
    // against the ground. The values are marks at the name size, so the card adds no third text size to the frame.
    text(value, x + w - inset, ry + 1, 26, {
      role: "mark",
      align: "right",
      alpha: hot ? alpha : alpha * mix(1, 0.51, highlight),
      color: hot ? blend(blend(P.ink, P.evidence, highlight), P.unknown, unknown) : P.ink,
    });
  });
  // The check's stroke ends at the right edge: its long arm reaches 0.55 of its size right of its centre, plus the
  // stroke's round cap.
  const s = 26 * scale;
  if (done > 0)
    check(x + w - inset - s * 0.55 - 1.75, head, s, { color: P.evidence, alpha, upto: done });
}

/* A table: its panel, its outline and its ruled rows and columns. With `joined` the rules are drawn in one stroke, so
 * they read as the table's own lines rather than as separate members waiting for names, as 06's collection and 09's
 * price data are drawn. */
export function tableIcon(
  x,
  y,
  w,
  h,
  { alpha = 1, stroke: s = P.ink, rows = 4, cols = 3, joined = false } = {},
) {
  if (alpha < 0.01) return;
  box(x, y, w, h, { fill: P.row, stroke: s, alpha, radius: 8 });
  if (joined) {
    stroke(
      () => {
        for (let r = 1; r < rows; r++) {
          ctx.moveTo(x, y + (h * r) / rows);
          ctx.lineTo(x + w, y + (h * r) / rows);
        }
        for (let c = 1; c < cols; c++) {
          ctx.moveTo(x + (w * c) / cols, y);
          ctx.lineTo(x + (w * c) / cols, y + h);
        }
      },
      { alpha, width: 1.5 },
    );
    return;
  }
  for (let r = 1; r < rows; r++)
    line(x, y + (h * r) / rows, x + w, y + (h * r) / rows, { color: P.line, alpha, width: 1.5 });
  for (let c = 1; c < cols; c++)
    line(x + (w * c) / cols, y, x + (w * c) / cols, y + h, { color: P.line, alpha, width: 1.5 });
}

/* A table drawn as one mark: its panel, its outline and its ruled rows and columns in one stroke, so its rules read as
 * the table's own lines rather than as separate members waiting for names. A table that shows its data holds a value
 * in each cell, ruled as one stroke as its lines are, so the values read, and count, as the table's content. */
export function s13Table(
  x,
  y,
  w,
  h,
  { alpha = 1, stroke: s = P.ink, rows = 4, cols = 3, values = false } = {},
) {
  if (alpha < 0.01) return;
  box(x, y, w, h, { fill: P.row, stroke: s, alpha, radius: 8 });
  stroke(
    () => {
      for (let r = 1; r < rows; r++) {
        ctx.moveTo(x, y + (h * r) / rows);
        ctx.lineTo(x + w, y + (h * r) / rows);
      }
      for (let c = 1; c < cols; c++) {
        ctx.moveTo(x + (w * c) / cols, y);
        ctx.lineTo(x + (w * c) / cols, y + h);
      }
    },
    { alpha, width: 1.5 },
  );
  if (values)
    stroke(
      () => {
        for (let r = 0; r < rows; r++)
          for (let c = 0; c < cols; c++) {
            const vx = x + (w * (c + 0.2)) / cols,
              vy = y + (h * (r + 0.5)) / rows;
            ctx.moveTo(vx, vy);
            ctx.lineTo(vx + (w / cols) * ((r + c) % 2 ? 0.45 : 0.6), vy);
          }
      },
      { color: P.muted, alpha: alpha * 0.8, width: 2 },
    );
}

/* Drawing primitives: the film's type, text that registers its box, strokes, fills, the basic shapes every mark is
 * drawn from, and polylines measured and drawn on along their length. */

import { ctx, layout, resolution, sceneFade, wordFade } from "../canvas.js";
import { LABEL, P, TYPE } from "../palette.js";
import { clamp } from "../timing/easing.js";
import { drawnShare } from "../timing/pace.js";

/* Drawing primitives. Every painted text registers its box for the geometry check. */
export function font(size, bold, sample) {
  const latin = !/[一-鿿]/u.test(sample);
  return `${bold ? "700 " : ""}${size}px ${latin ? (bold ? "DDWGLatinBold" : "DDWGLatin") : bold ? "DDWGBold" : "DDWG"}`;
}
export const labelSize = (size) => size * TYPE;
/* Display copy: an apostrophe is set as a typographic right single quote, as in the captions. */
export const typeset = (v) => v.replaceAll("'", "\u2019");
export function measure(v, size = LABEL, bold = false, role = "label") {
  v = typeset(v);
  ctx.save();
  ctx.font = font(role === "label" ? labelSize(size) : size, bold, v);
  const w = ctx.measureText(v).width;
  ctx.restore();
  return w;
}
/* `group` names a structural set (the roles of a chain, the states of a rail): its labels stand together while the
 * structure stands, and they are read, and counted, as one object. */
export function text(
  v,
  x,
  y,
  size = LABEL,
  {
    color = P.ink,
    alpha = 1,
    align = "left",
    bold = false,
    baseline = "middle",
    role = "label",
    tracking = 0,
    group = null,
    whole = null,
    set = null,
  } = {},
) {
  if (alpha < 0.015 || !v) return null;
  v = typeset(v);
  whole = whole === null ? null : typeset(whole);
  ctx.save();
  ctx.globalAlpha = clamp(alpha) * wordFade;
  ctx.font = font(role === "label" ? labelSize(size) : size, bold, v);
  ctx.letterSpacing = `${tracking}px`;
  ctx.textAlign = align;
  ctx.textBaseline = baseline;
  ctx.fillStyle = color;
  ctx.fillText(v, x, y);
  const m = ctx.measureText(v),
    tr = ctx.getTransform();
  const box = [
    x - m.actualBoundingBoxLeft,
    y - m.actualBoundingBoxAscent,
    x + m.actualBoundingBoxRight,
    y + m.actualBoundingBoxDescent,
  ];
  const toScreen = (px, py) => [
    (tr.a * px + tr.c * py + tr.e) / resolution,
    (tr.b * px + tr.d * py + tr.f) / resolution,
  ];
  const [x0, y0] = toScreen(box[0], box[1]),
    [x1, y1] = toScreen(box[2], box[3]);
  ctx.restore();
  // A name placed by a layout primitive carries its whole text, so a wrapped or growing name is read as one; `set` names
  // the list it belongs to, which builds and leaves as a whole.
  const record = {
    text: v,
    bounds: [Math.min(x0, x1), Math.min(y0, y1), Math.max(x0, x1), Math.max(y0, y1)],
    alpha: clamp(alpha) * wordFade,
    role,
    scene: layout.scene,
    color,
    group,
    whole: whole ?? v,
    placed: whole !== null,
    size,
    set,
  };
  layout.texts.push(record);
  return record;
}
/* Structure strokes (the line and muted colours) are thin and often dashed, so at 1080p their antialiased pixels read
 * far fainter than their nominal ink. They are drawn at least 2 px wide, and their opacity is compensated on a concave
 * curve (1 - (1 - a)^2): a stroke at full ink is unchanged, a quiet placeholder at 0.45-0.8 stays at 0.7-0.96, at or
 * above 3:1 against the ground, and fades stay continuous. */
const STRUCTURE = new Set([P.line, P.muted]);
export function stroke(
  build,
  { color = P.line, width = 2, alpha = 1, dash = null, cap = "round" } = {},
) {
  if (alpha < 0.01) return;
  const structure = STRUCTURE.has(color),
    a = structure ? 1 - (1 - clamp(alpha)) ** 2 : clamp(alpha);
  ctx.save();
  ctx.globalAlpha = a * sceneFade;
  ctx.strokeStyle = color;
  ctx.lineWidth = structure ? Math.max(2, width) : width;
  ctx.lineCap = cap;
  ctx.lineJoin = "round";
  if (dash) ctx.setLineDash(dash);
  ctx.beginPath();
  build();
  ctx.stroke();
  ctx.restore();
}
export function fill(build, { color = P.row, alpha = 1 } = {}) {
  if (alpha < 0.01) return;
  ctx.save();
  ctx.globalAlpha = clamp(alpha) * sceneFade;
  ctx.fillStyle = color;
  ctx.beginPath();
  build();
  ctx.fill();
  ctx.restore();
}
export const line = (x1, y1, x2, y2, o = {}) =>
  stroke(() => {
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
  }, o);
export const dashed = (x1, y1, x2, y2, o = {}) => line(x1, y1, x2, y2, { dash: [8, 9], ...o });
export function box(
  x,
  y,
  w,
  h,
  { fill: f = null, stroke: s = null, width = 2, alpha = 1, radius = 8, dash = null } = {},
) {
  if (f) fill(() => ctx.roundRect(x, y, w, h, radius), { color: f, alpha });
  if (s) stroke(() => ctx.roundRect(x, y, w, h, radius), { color: s, width, alpha, dash });
}
export function dot(x, y, r, { color = P.evidence, alpha = 1, hollow = false, width = 2 } = {}) {
  if (hollow) stroke(() => ctx.arc(x, y, r, 0, Math.PI * 2), { color, alpha, width });
  else fill(() => ctx.arc(x, y, r, 0, Math.PI * 2), { color, alpha });
}
export function path(points, { upto = 1, draw = null, ...o } = {}) {
  if (points.length < 2) return;
  // A polyline draws on along its length, so a check or a trace grows from its first point instead of adding whole
  // segments at once; with `draw` it draws on over `upto` of its length at the tip pace (drawnShare).
  if (draw) upto = drawnShare(draw, lengthOf(points), clamp(upto));
  if (upto <= 0) return;
  const drawn = upto >= 1 ? points : along(points, upto).kept;
  if (drawn.length < 2) return;
  stroke(() => drawn.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y))), {
    width: 2.5,
    color: P.ink,
    ...o,
  });
}
export function diamond(
  x,
  y,
  r,
  { color = P.evidence, alpha = 1, solid = false, width = 2.5 } = {},
) {
  const build = () => {
    ctx.moveTo(x, y - r);
    ctx.lineTo(x + r, y);
    ctx.lineTo(x, y + r);
    ctx.lineTo(x - r, y);
    ctx.closePath();
  };
  if (solid) fill(build, { color, alpha });
  else stroke(build, { color, alpha, width });
}
/* The length of a polyline. */
export const lengthOf = (points) =>
  points
    .slice(1)
    .reduce((sum, pt, i) => sum + Math.hypot(pt[0] - points[i][0], pt[1] - points[i][1]), 0);
/* The point at share q of a polyline's length, and the polyline up to it. */
export function along(points, q) {
  const lengths = points
      .slice(1)
      .map((pt, i) => Math.hypot(pt[0] - points[i][0], pt[1] - points[i][1])),
    total = lengths.reduce((a, b) => a + b, 0);
  let left = clamp(q) * total;
  const kept = [points[0]];
  for (let i = 0; i < lengths.length; i++) {
    if (left >= lengths[i]) {
      kept.push(points[i + 1]);
      left -= lengths[i];
      continue;
    }
    const f = lengths[i] ? left / lengths[i] : 0,
      a = points[i],
      b = points[i + 1];
    kept.push([a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f]);
    break;
  }
  return { point: kept.at(-1), kept };
}

/* The camera: each scene's one slow move, and where a point of the previous scene stands in the next. */

import { ctx } from "../canvas.js";
import { scenes } from "../scenes/registry.js";
import { film } from "../timeline.js";
import { clamp, ease, mix } from "../timing/easing.js";
import { voiceTime } from "../timing/pauses.js";

/* Film-level framing: a flat ground with no radial darkening or glow. Each scene has one slow camera move chosen
 * for its content: a push toward the object it argues with, a pull back that reveals a structure as it is built,
 * a drift along a track or timeline, or stillness for a dense comparison. The move advances in voice time, so it
 * rests in the quiet between thoughts. */
const CAMERA = {
  push: ["01", "03", "05", "07", "13", "17", "21", "24", "27", "29"],
  reveal: ["02", "04", "09", "12", "14", "18", "22", "26", "28"],
  drift: ["10", "11", "15", "16", "19", "20", "23", "25", "30"],
};
/* A scene's camera at time t, as screen = origin + k × (point − anchor). Every stage is composed on the fixed canvas,
 * so the picture never zooms or pans between thoughts: only this slow move applies. */
export function cameraOf(s, t, amount = scenes[s.id]?.push ?? 0.02) {
  const cx = film.segments.indexOf(s) % 2 ? 840 : 1080,
    cy = 500;
  const from = voiceTime(s.start),
    q = ease(clamp((voiceTime(t) - from) / Math.max(1, voiceTime(s.end) - from)));
  if (CAMERA.drift.includes(s.id))
    return { k: 1 + amount * 0.5, ox: 960 + mix(-12, 12, q), oy: cy, ax: 960, ay: cy };
  const k = CAMERA.reveal.includes(s.id)
    ? 1 + amount * (1 - q)
    : CAMERA.push.includes(s.id)
      ? 1 + amount * q
      : 1;
  return { k, ox: cx, oy: cy, ax: cx, ay: cy };
}
export function push(s, t) {
  const c = cameraOf(s, t);
  ctx.translate(c.ox, c.oy);
  ctx.scale(c.k, c.k);
  ctx.translate(-c.ax, -c.ay);
}
/* Where a point drawn by the previous scene appears in this scene's coordinates, and the scale between them, so an
 * object that continues across a cut starts exactly where it was shown. */
export function across(s, t, x, y) {
  const a = cameraOf(film.segments[film.segments.indexOf(s) - 1], t),
    b = cameraOf(s, t);
  const sx = a.ox + a.k * (x - a.ax),
    sy = a.oy + a.k * (y - a.ay);
  return [b.ax + (sx - b.ox) / b.k, b.ay + (sy - b.oy) / b.k, a.k / b.k];
}

/* The pace of movement in voice time: structural glides, and strokes drawing on at their tip's pace so that they are
 * whole by the end of their thought. */

import { layout } from "../canvas.js";
import { clauseStart } from "./cues.js";
import { clamp, ease } from "./easing.js";
import { thoughtEnd, voiceTime } from "./pauses.js";
import { stageCuts } from "./stages.js";

/* A structural glide (a stage re-centring as it grows, a list closing up, a mark carried to its place) moves `d` px from
 * `start` on the smootherstep curve, 6x⁵ - 15x⁴ + 10x³, whose pace rises from rest and falls back to it with no jerk, so
 * even sampled at 30 frames a second it neither sets off nor stops at a visible pace; it peaks at 1.875 times its mean
 * pace, and the glide lasts at least `min` seconds and long enough that its pace peaks at GLIDE_PEAK px/s, well within
 * what the eye follows at 1080p and, with the camera's slow push of up to 4% and the frame-to-frame sampling of the
 * motion audit, under the 450 px/s the reviews hold a calm picture to (Z40-7, EN40-12). It advances in voice time, so a
 * glide still under way when a thought ends rests with the voice clock and finishes on the next words. Returns the
 * share of the move made at t. */
export const GLIDE_PEAK = 420,
  GLIDE_MIN = 0.6;
export const smoother = (q) => {
  q = clamp(q);
  return q * q * q * (q * (q * 6 - 15) + 10);
};
export const glideTime = (d, min = GLIDE_MIN) => Math.max(min, (1.875 * Math.abs(d)) / GLIDE_PEAK);
export const glide = (t, start, d, min = GLIDE_MIN) =>
  smoother((voiceTime(t) - voiceTime(start)) / glideTime(d, min));
/* A stroke drawing on, solid or dashed, as only its tip moves: the smoothstep curve in voice time, at least `least`
 * seconds and otherwise long enough that its tip peaks at DRAW_PACE px/s, under the 900 px/s at which a mark races: a
 * smoothstep's tip peaks at 1.5 times its mean pace. Returns the share of a stroke `length` px long drawn at t from `at`. */
export const DRAW_PACE = 820;
export const drawTime = (length, least = 0.4) =>
  Math.max(least, (1.5 * Math.abs(length)) / DRAW_PACE);
export const drawShare = (t, at, length, least = 0.4) =>
  ease((voiceTime(t) - voiceTime(at)) / drawTime(length, least));
/* The share of a change `d` px long, a frame's edge widening or deepening, made at the same tip pace and complete at
 * `end`, so a frame has taken its new size before the name it makes room for is legible. It advances in voice time. */
export const pacedTo = (t, end, d, least = 0.35) => {
  const T = drawTime(d, least);
  return ease((voiceTime(t) - voiceTime(end) + T) / T);
};
/* A link, path, ring or check drawn on by `draw` ({t, at, least}) draws over `extent` (the share of its full `length` it
 * reaches) at that tip pace, so a long stroke takes longer than a short one and no tip races, and it rests with the
 * voice in a quiet. It sets off at `at`, on its words, unless it would then still be drawing as its thought's voice
 * comes to rest: it then sets off as much earlier as it needs within its clause, never before the stage that holds it
 * cut in, so it is whole by its thought's last word and never rests part-drawn through the quiet after it (see
 * drawStart). Returns the share of the full length drawn at t. */
export const drawnShare = (draw, length, extent = 1) =>
  extent *
  ease(
    (voiceTime(draw.t) - drawStart(draw, length * extent)) /
      drawTime(length * extent, draw.least ?? 0.4),
  );
/* How far the quiet point a stroke drawn at that pace lands on has grown: from 0, LANDING seconds of voice time before
 * the stroke is drawn (or from its start when it draws in less), to 1 as it is drawn, so the point grows over the same
 * time however short the stroke and never appears whole within a frame. */
const LANDING = 0.15;
export const landedShare = (draw, length, extent = 1) => {
  const time = drawTime(length * extent, draw.least ?? 0.4),
    landing = Math.min(LANDING, time);
  return ease((voiceTime(draw.t) - drawStart(draw, length * extent) - (time - landing)) / landing);
};
/* The voice time at which a stroke `length` px long drawn at the tip pace from `draw.at` sets off: `at` itself, or, when
 * it would not be whole WHOLE_BY seconds before the last word of the thought speaking at `at` ends, as much earlier as
 * that needs, but not before the first word of its clause nor before the last stage cut of its scene at or before `at`. */
const WHOLE_BY = 0.3;
const drawStart = (draw, length) => {
  const v = voiceTime(draw.at),
    by = voiceTime(thoughtEnd(draw.at) - WHOLE_BY) - drawTime(length, draw.least ?? 0.4);
  if (by >= v) return v;
  const cuts = [...(stageCuts.get(layout.scene) ?? [])].filter((c) => c <= draw.at + 1e-6);
  return Math.min(v, Math.max(by, voiceTime(Math.max(clauseStart(draw.at), ...cuts))));
};

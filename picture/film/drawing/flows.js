/* Looping flows: the dots that run along a way at one calm pace, entering and leaving by their size, and the clock
 * they run on. */

import { clamp } from "../timing/easing.js";
import { voiceTime } from "../timing/pauses.js";
import { dot } from "./strokes.js";

/* A looping flow (dots along a path, a widening pulse): each pass enters at its start and leaves at its end, so a
 * wrap never pops a mark back to its beginning. `q` is the pass phase in [0, 1). */
export const pass = (q, edge = 0.12) => clamp(q / edge) * clamp((1 - q) / edge);
/* A flow's dot enters and leaves by its size at full ink, growing over the first FLOW_EDGE px of its way and shrinking
 * over the last (an eighth of a long way, at most half a short one), so at the flow pace it takes a few frames to
 * grow on any way; below 1.5 px it is not drawn, so the frames between two passes stand without a dot. A flow rests
 * with the voice in the quiet between thoughts, so a dot stopped near either end of its pass stays a small firm mark
 * rather than a half-faded one. `length` is the way's length in px. */
const FLOW_EDGE = 24;
export const flowDot = (x, y, r, q, o, length = Infinity) => {
  const size = r * pass(q, Math.min(0.5, Math.max(0.12, FLOW_EDGE / length)));
  if (size >= 1.5) dot(x, y, size, o);
};
/* A looping flow's dot travels at one calm pace, FLOW_PACE px for each second of voice time, whatever the length of its
 * way, so a short way and a long one run alike. Each pass enters at the way's start and leaves at its end by its size,
 * and the next enters one frame later, so a dot never leaps back along its way and the flow runs on without a pause.
 * `flowing` is the voice time since the flow began (see `since`), so the first dot enters at the start; `lag` holds a
 * way's first pass back by that share of a pass, so neighbouring ways do not run in step; a flow that stops begins no
 * pass after `last` (voice time since it began), and the pass under way runs to the way's end. Returns the pass phase,
 * or null between passes. */
const FLOW_PACE = 160,
  FLOW_GAP = 1 / 30;
export const loopPhase = (flowing, length, lag = 0, last = Infinity) => {
  if (flowing === null || !(length >= 1)) return null;
  const travel = length / FLOW_PACE,
    period = travel + FLOW_GAP,
    run = flowing - lag * period;
  if (run < 0 || last === null || run - (run % period) + lag * period > last) return null;
  const u = run % period;
  return u < travel ? u / travel : null;
};
/* Voice time since `from`, or null before it: the clock of a looping flow that begins at `from`. */
export const since = (t, from) => (t >= from ? voiceTime(t) - voiceTime(from) : null);

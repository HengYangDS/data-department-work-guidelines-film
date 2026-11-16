/* The quiet between thoughts, which no change of the picture may fall into, and the voice's own clock, which rests
 * in it. */

import { film } from "../timeline.js";
import { units } from "./cues.js";
import { ramp } from "./easing.js";

/* Visible from `a` to `b`. A fade that would run into the quiet between two thoughts waits for the next thought's
 * words (see pauseHold), so neither edge changes the picture in a pause. */
export const span = (t, a, b, fade = 0.45) =>
  ramp(t, pauseHold(a, fade), fade) * (1 - ramp(t, pauseHold(b - fade, fade), fade));
/* The quiet between consecutive thoughts, as [end of one thought, start of the next]. A change that would fall in
 * that quiet holds through it and happens on the next words, so the picture changes with the speech rather than in
 * a pause. */
const RECEDE = 0.6;
export const thoughtJoins = (() => {
  const joins = [];
  let previous = null;
  for (const s of film.segments) {
    let k = 0;
    for (const group of s.utterance_groups) {
      const need = units(group).length,
        first = k;
      let n = 0;
      while (k < s.words.length && n < need) n += units(s.words[k++].text).length;
      if (previous !== null) joins.push([previous, s.words[first].start]);
      previous = s.words[k - 1].end;
    }
  }
  return joins;
})();
export const pauseHold = (at, lasting = RECEDE) => {
  for (const [end, next] of thoughtJoins) if (at + lasting > end && at < next) return next;
  return at;
};
/* The first word's start of the thought speaking at `at` (a cue may lead its word by a little), or -Infinity in the
 * film's first thought. */
export const thoughtStart = (at) => {
  let start = -Infinity;
  for (const [, next] of thoughtJoins) {
    if (next > at + 0.2) break;
    start = next;
  }
  return start;
};
/* The last word's end of the thought speaking at `at`. */
export const thoughtEnd = (at) => {
  for (const [end] of thoughtJoins) if (end >= at) return end;
  return Infinity;
};
/* Voice time: the film's clock, slowed to rest in the quiet between thoughts. A scene's slow camera move, every looping
 * movement (a turn, an orbit, a sway, a flow's dots) and a movement still under way when a thought ends advance with it,
 * so they rest in the quiet between two thoughts and resume where they stopped. The clock never stops or sets off at
 * once, which a viewer sees as a stutter: over the last SETTLE seconds before HOLD after a thought's last word it eases
 * to rest, and over SETTLE seconds from HOLD before the next thought's first word it eases back to full pace, each by
 * the smoothstep curve, so a moving mark settles and sets off as a thing with weight does. The picture stands unchanged
 * from HOLD after one thought to HOLD before the next. A thought shorter than two easings shares its span between them.
 * A flow's dots enter and leave by size, so a flow at rest in the quiet leaves no half-faded dot. */
export const HOLD = 0.05,
  SETTLE = 0.45;
/* The share of an easing's time a smoothstep easing to rest has covered at x: the integral of 3x² - 2x³. */
const covered = (x) => x ** 3 - x ** 4 / 2;
const easings = (() => {
  const joins = thoughtJoins.map(([end, next]) => {
    const middle = (end + next) / 2;
    return { rest: Math.min(end + HOLD, middle), resume: Math.max(next - HOLD, middle) };
  });
  joins.forEach((j, k) => {
    j.down = Math.min(SETTLE, k ? (j.rest - joins[k - 1].resume) / 2 : j.rest);
    j.up = Math.min(SETTLE, k + 1 < joins.length ? (joins[k + 1].rest - j.resume) / 2 : SETTLE);
  });
  let taken = 0;
  for (const j of joins) {
    j.before = taken;
    taken += j.down / 2 + (j.resume - j.rest) + j.up / 2;
  }
  return joins;
})();
export const voiceTime = (t) => {
  let lo = 0,
    hi = easings.length;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (easings[mid].rest - easings[mid].down <= t) lo = mid + 1;
    else hi = mid;
  }
  if (!lo) return t;
  const { rest, resume, down, up, before } = easings[lo - 1];
  if (t < rest) return t - before - down * covered((t - rest + down) / down);
  if (t < resume) return t - before - down / 2 - (t - rest);
  if (t < resume + up) {
    const x = (t - resume) / up;
    return t - before - down / 2 - (resume - rest) - up * (x - covered(x));
  }
  return t - before - down / 2 - (resume - rest) - up / 2;
};

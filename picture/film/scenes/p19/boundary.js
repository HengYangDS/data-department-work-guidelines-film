/* 19's delegated boundary: the frame round an Agent as it grows with its members, and the balanced lines of a list
 * said member by member. */

import { measure } from "../../drawing/strokes.js";
import { growLines, growTexts } from "../../naming/parts.js";
import { mix, soon } from "../../timing/easing.js";
import { glide, glideTime } from "../../timing/pace.js";

/* A delegated boundary round an Agent: the frame opens about the Agent alone, too small to hold a group, and on the
 * words of the first member set inside it widens to its full width, its top rising to hold the first row; its bottom
 * then grows down with the rows below the Agent as they arrive. Each growth starts just before its member's words and
 * lasts 0.4 s. `ys` are the rows' centres from the top and `ats` their words; the small frame's edges and the full
 * frame's are given as [top, bottom], and `full` may be a width that grows with the rows. With `middle`, a width, the
 * small frame stands that wide round the Agent at the middle of where the full frame will stand, so the stage is
 * balanced while its members are still to come, and it widens about that middle over 0.7 s while the Agent returns to
 * its side; with `from`, a time, it first closes round the Agent at its side and moves to the middle from then, over
 * 0.7 s; `toward` stands the waiting frame that many px right of that middle, and it widens from there to its full
 * place. It returns the frame's box and the Agent's x. */
export function s19Frame(
  t,
  fx,
  small,
  full,
  ys,
  ats,
  [top0, bottom0],
  [top1, bottom1],
  { middle = null, from = null, toward = 0, opens = 0 } = {},
) {
  // A card waiting at the middle grows into the full frame as a glide timed by the farther of its edges' ways, finishing
  // as its first part's name comes in, so neither the frame nor the name over it travels faster than the eye follows.
  const reach =
    middle === null
      ? 0
      : Math.max(
          Math.abs(full / 2 + toward - middle / 2),
          Math.abs(full / 2 - toward - middle / 2),
        );
  const grow =
      middle === null
        ? soon(t, ats[0] - 0.3, 0.4)
        : glide(t, ats[0] - 0.15 - glideTime(reach), reach),
    top = mix(top0, Math.min(top1, ys[0] - 45), grow);
  let bottom = mix(bottom0, bottom1, grow);
  ys.forEach((y, k) => {
    if (y + 45 > bottom) bottom = mix(bottom, y + 45, soon(t, ats[k] - 0.3, 0.4));
  });
  const side = fx + small / 2,
    h = bottom - top;
  if (middle === null)
    return {
      x: fx,
      y: top,
      w: typeof full === "function" ? full(t) : mix(small, full, grow),
      h,
      ax: side,
    };
  // A card that opens from further away glides further; the frame's edges open on the widening's easing, while the
  // Agent steps back to its side as a glide, so it never travels faster than the eye follows.
  const go = from === null ? 1 : glide(t, from, Math.abs(fx + full / 2 + toward - side - opens)),
    at = mix(side + opens, fx + full / 2 + toward, go),
    w = mix(mix(small, middle, go), full, grow);
  return { x: mix(at, fx + full / 2, grow) - w / 2, y: top, w, h, ax: mix(at, side, grow) };
}
/* The lines of a list said member by member, set as growTexts sets them (a member's leading mark hangs at the end of
 * the line before), but balanced: of the splits into as few lines as fit `width`, the one whose widest line is
 * narrowest, so no member is stranded on a short line between two long ones. */
export function s19Lines(parts, width) {
  const n = growLines(parts, width).length,
    span = (a, b) => measure(parts.slice(a, b).join(""));
  let best = null;
  const search = (from, cuts) => {
    if (cuts.length === n - 1) {
      const starts = [0, ...cuts],
        ends = [...cuts, parts.length],
        worst = Math.max(...starts.map((a, i) => span(a, ends[i])));
      if (worst <= width + 0.5 && (!best || worst < best.worst - 0.5))
        best = { starts, ends, worst };
      return;
    }
    for (let c = from + 1; c <= parts.length - (n - 1 - cuts.length); c++) search(c, [...cuts, c]);
  };
  search(0, []);
  if (!best) return growTexts(parts, width);
  const lines = best.starts.map((a, i) =>
    Array.from({ length: best.ends[i] - a }, (_, j) => [a + j, parts[a + j]]),
  );
  lines.forEach((line, r) => {
    const [k, v] = line[0],
      lead = r ? (v.match(/^[、，,;；\s]+/u)?.[0] ?? "") : "";
    if (!lead) return;
    line[0] = [k, v.slice(lead.length)];
    const mark = lead.replace(/\s+/gu, "");
    if (mark) lines[r - 1].push([k, mark]);
  });
  return lines;
}

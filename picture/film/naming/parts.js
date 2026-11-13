/* Names of authored parts: their lines, set whole from the words that begin them or built part by part. */

import { ctx } from "../canvas.js";
import { labelSize, measure, text } from "../drawing/strokes.js";
import { LABEL } from "../palette.js";
import { ramp } from "../timing/easing.js";
import { LEADING, evenBlock, hangOf, phraseBreaks, runStarts } from "./names.js";

/* The lines of a name whose parts wrap as units onto lines no wider than `width`, as indices into its parts. Parts fill
 * each line in their authored phrases; when those lines break the rules of a wrapped name (see LEADS), the same number
 * of lines is set again from its parts, an English name at a phrase, lines that keep the block's shape before others
 * and then the widest line as narrow as possible, so the name reads as one block. Where no setting keeps the phrase
 * rule, a short tail (a last line under two fifths of the widest) is still rebalanced. A line wider than `width` holds
 * a single part. */
const lineCaches = new WeakMap();
export function growLines(parts, width = Infinity, size = LABEL) {
  // Widths depend on the context measuring them, so each context keeps its own layouts.
  const cache = lineCaches.get(ctx) ?? new Map(),
    key = `${width}\u0002${size}\u0002${parts.join("\u0001")}`;
  lineCaches.set(ctx, cache);
  if (cache.has(key)) return cache.get(key);
  const greedy = [[]];
  parts.forEach((part, k) => {
    const line = greedy.at(-1);
    if (line.length && measure([...line.map((j) => parts[j]), part].join(""), size) > width)
      greedy.push([k]);
    else line.push(k);
  });
  let lines = greedy;
  const n = greedy.length,
    span = (a, b) => measure(parts.slice(a, b).join(""), size),
    latin = !/[一-鿿]/u.test(parts.join(""));
  // The text each line paints, as growTexts sets it: a wrapped part's leading separator hangs its mark on the line before.
  const lead = (v) => v.match(/^[、，,;；\s]+/u)?.[0] ?? "";
  const texts = (starts, ends) =>
    starts.map(
      (a, i) =>
        (i ? parts[a].slice(lead(parts[a]).length) : parts[a]) +
        parts.slice(a + 1, ends[i]).join("") +
        (i + 1 < starts.length ? lead(parts[starts[i + 1]]).replace(/\s+/gu, "") : ""),
    );
  const widths = greedy.map((line) => span(line[0], line.at(-1) + 1)),
    painted = texts(
      greedy.map((line) => line[0]),
      greedy.map((line) => line.at(-1) + 1),
    );
  if (
    n > 1 &&
    parts.length <= 16 &&
    !((!latin || phraseBreaks(painted)) && evenBlock(painted, size))
  ) {
    const options = runStarts(parts.length, n)
      .map((starts) => {
        const ends = [...starts.slice(1), parts.length],
          ws = ends.map((end, i) => span(starts[i], end));
        return {
          starts,
          ends,
          ls: texts(starts, ends),
          fit: ws.every((w, i) => w <= width || ends[i] - starts[i] === 1),
          worst: Math.max(...ws),
          spread: ws.reduce((sum, v) => sum + v * v, 0),
        };
      })
      .filter((o) => o.fit);
    const phrased = options.filter((o) => !latin || phraseBreaks(o.ls)),
      even = phrased.filter((o) => evenBlock(o.ls, size));
    const pool = even.length
      ? even
      : phrased.length
        ? phrased
        : widths.at(-1) < 0.4 * Math.max(...widths)
          ? options
          : [];
    // Where no setting keeps the block's shape, the authored fill stands against an equally balanced one.
    const seed =
      pool === phrased
        ? (pool.find((o) => o.starts.join() === greedy.map((line) => line[0]).join()) ?? null)
        : null;
    const best = pool.reduce(
      (x, o) =>
        !x || o.worst < x.worst - 0.5 || (Math.abs(o.worst - x.worst) <= 0.5 && o.spread < x.spread)
          ? o
          : x,
      seed,
    );
    if (best)
      lines = best.ends.map((end, i) =>
        Array.from({ length: end - best.starts[i] }, (_, j) => best.starts[i] + j),
      );
  }
  cache.set(key, lines);
  return lines;
}
/* The height of a block of `lines` lines of one size. */
export const blockHeight = (lines, size = LABEL) => labelSize(size) * (1 + LEADING * (lines - 1));
/* A name of authored parts, set whole: it stands complete from the words that begin it, so its text never changes
 * after it appears and the eye never reads a phrase being typed on. It is laid out from its whole text: parts wrap as
 * units onto lines no wider than `width`, and the lines share one left edge. */
/* The texts of each line of a name of parts, as [part, text] pairs. A part that wraps to a new line starts that line
 * without its leading separator, and the separator's mark hangs at the end of the line before: no line starts with a
 * comma and no comma is lost. */
export function growTexts(parts, width = Infinity, size = LABEL) {
  const lines = growLines(parts, width, size).map((line) => line.map((k) => [k, parts[k]]));
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
/* A name stands whole on the words of its first part; a name that lists what is said over several seconds may `build`,
 * each part joining it in its place on its own words, so the picture keeps changing while the list is spoken. */
export function growName(
  t,
  parts,
  ats,
  x,
  y,
  {
    width = Infinity,
    size = LABEL,
    valign = "top",
    alpha = 1,
    build = false,
    align = "left",
    ...o
  } = {},
) {
  const em = labelSize(size),
    step = em * LEADING,
    lines = growTexts(parts, width, size);
  const top =
    valign === "top"
      ? y + em / 2
      : valign === "bottom"
        ? y - em / 2 - step * (lines.length - 1)
        : y - (step * (lines.length - 1)) / 2;
  lines.forEach((line, r) => {
    // A line starts at x, or centres or ends on it by `align`, its final mark hung as nameText hangs it.
    const span = line.reduce((w, [, v]) => w + measure(v, size), 0);
    let left =
      (align === "center" ? x - span / 2 : align === "right" ? x - span : x) +
      hangOf(line.map(([, v]) => v).join(""), align, size);
    line.forEach(([k, v]) => {
      const at = build ? (ats[k] ?? ats[0]) : ats[0];
      text(v, left, top + r * step, size, {
        align: "left",
        ...o,
        alpha: alpha * ramp(t, at - 0.15, 0.4),
        whole: o.whole ?? parts.join(""),
      });
      left += measure(v, size);
    });
  });
  return {
    lines: lines.length,
    top: top - em / 2,
    bottom: top + step * (lines.length - 1) + em / 2,
  };
}

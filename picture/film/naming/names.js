/* Names: the gap and leading every name keeps, how a name is broken into balanced lines, and a name set as one
 * block at its anchor. */

import { ctx } from "../canvas.js";
import { font, labelSize, measure, text, typeset } from "../drawing/strokes.js";
import { LABEL } from "../palette.js";

/* Visual system. A stage shows one structure, and its names stay with their marks while the stage stands, so a
 * structure is seen whole and never loses its words. Every name is placed by the rule of the structure it belongs to
 * (a rail, a ring, a column), at one gap from its mark and on one shared baseline or edge, so no scene sets words by
 * hand. Relations are carried by position, alignment and containment; where a relation must be drawn, it follows the
 * grid in straight runs and quarter turns, draws on from its source and ends in a quiet point, not an arrowhead. */
export const NAME_GAP = 22,
  LEADING = 1.3;
/* The break rules of a wrapped name. An English name breaks at a phrase: no line but the last ends on a word that
 * leads into the words after it (an article, determiner, preposition, conjunction, relative or question word, or an
 * auxiliary), and a name of three or more words leaves more than one word on its last line. A block of lines keeps
 * its shape, read on the ink as the lines are painted: no line stands under four fifths of the longest, and the last
 * not under three fifths. */
const LEADS = new Set(
  (
    "a an the of in on at by to for with from into onto over under about after before between through " +
    "without within against per via as than like and or but nor its their his her our your my this that these those each " +
    "every any no some which who whose whom what when where why how whether if because although though while unless " +
    "until since is are was were be been can will would should may must not"
  ).split(" "),
);
const lastWord = (v) =>
  (v.trim().split(/\s+/).at(-1) ?? "")
    .toLowerCase()
    .replaceAll("’", "'")
    .replace(/^[^\p{L}\p{N}']+|[^\p{L}\p{N}']+$/gu, "");
export const phraseBreaks = (lines) =>
  lines.slice(0, -1).every((v) => !LEADS.has(lastWord(v))) &&
  (lines.join(" ").trim().split(/\s+/).length < 3 || lines.at(-1).trim().split(/\s+/).length > 1);
function inkWidth(v, size = LABEL) {
  v = typeset(v);
  ctx.save();
  ctx.font = font(labelSize(size), false, v);
  const m = ctx.measureText(v);
  ctx.restore();
  return m.actualBoundingBoxLeft + m.actualBoundingBoxRight;
}
export function evenBlock(lines, size = LABEL) {
  const widths = lines.map((v) => inkWidth(v, size)),
    top = Math.max(...widths);
  return widths.slice(0, -1).every((w) => w >= 0.8 * top) && widths.at(-1) >= 0.6 * top;
}
/* Every way to cut `count` units into `n` runs, as the index where each run starts. */
export function runStarts(count, n, from = 0) {
  if (n === 1) return from < count ? [[from]] : [];
  const out = [];
  for (let k = from + 1; k <= count - n + 1; k++)
    for (const rest of runStarts(count, n - 1, k)) out.push([from, ...rest]);
  return out;
}
/* Breaks a name into balanced lines no wider than `width`: English between words, and a Chinese name only after a
 * list or clause mark, a clause mark before a list mark where its lines fit, so no line begins inside a word. A
 * Chinese name without such a mark breaks between characters, so a name whose break would split a word is authored as
 * its lines. A name that fits stays on one line. Authored lines are kept as written: an array, or a string whose lines
 * are separated by newlines. Of the breaks that fit, an English name keeps one at a phrase, and a break whose block
 * keeps its shape is preferred to a more balanced one; where no break fits the rules, the balanced break stands, and
 * such a name is authored as its lines or given room. */
const NAME_JOINT = /[、，。；：,]$/u,
  CLAUSE_JOINT = /[，。；：,]$/u;
export function wrapName(v, width, size = LABEL) {
  if (Array.isArray(v)) return v;
  if (typeof v === "string" && v.includes("\n")) return v.split("\n");
  if (!Number.isFinite(width) || measure(v, size) <= width) return [v];
  const latin = !/[一-鿿]/u.test(v),
    tokens = latin ? v.split(/(?<= )/) : [...v],
    splits = [];
  for (let k = 1; k < tokens.length; k++) {
    const a = tokens.slice(0, k).join("").trimEnd(),
      b = tokens.slice(k).join("").trimStart();
    if (!a || !b || /^[、，。；：）”]/u.test(b)) continue;
    splits.push({
      a,
      b,
      joint: !latin && NAME_JOINT.test(a),
      worst: Math.max(measure(a, size), measure(b, size)),
    });
  }
  // A Chinese name splits at a mark whose lines fit, a clause mark first, else at any mark, and between characters
  // only when it has no mark; of the marks, one whose lines fit and keep the block's shape is kept before the others,
  // and then the split whose wider line is narrowest.
  const joints = splits.filter((s) => s.joint),
    fitting = joints.filter((s) => s.worst <= width);
  const clauses = fitting.filter((s) => CLAUSE_JOINT.test(s.a));
  const pool = clauses.length
    ? clauses
    : fitting.length
      ? fitting
      : joints.length
        ? joints
        : splits;
  if (!pool.length) return [v];
  const narrowest = (list) => list.reduce((x, s) => (s.worst < x.worst ? s : x));
  const even =
    latin || pool === splits
      ? []
      : pool.filter((s) => s.worst <= width && evenBlock([s.a, s.b], size));
  const best = narrowest(even.length ? even : pool);
  let lines;
  if (best.worst <= width || tokens.length < 3) lines = [best.a, best.b];
  else {
    const [head, ...rest] = wrapName(best.a, width, size);
    lines = [head, ...wrapName([...rest, best.b].join(latin ? " " : ""), width, size)];
  }
  if (!latin || tokens.length > 16 || (phraseBreaks(lines) && evenBlock(lines, size))) return lines;
  // An English name takes, of the breaks into as many lines that fit, one at a phrase, an even block first.
  const options = runStarts(tokens.length, lines.length)
    .map((starts) =>
      starts.map((k, i) =>
        tokens
          .slice(k, starts[i + 1])
          .join("")
          .trim(),
      ),
    )
    .filter((ls) => phraseBreaks(ls) && ls.every((line) => measure(line, size) <= width))
    .map((ls) => ({
      ls,
      even: evenBlock(ls, size),
      worst: Math.max(...ls.map((line) => measure(line, size))),
    }));
  if (!options.length) return lines;
  const kept = options.filter((o) => o.even);
  return (kept.length ? kept : options).reduce((x, o) => (o.worst < x.worst ? o : x)).ls;
}
/* A name of one or more lines anchored at (x, y): `valign` top hangs it below the point, bottom stands it above, and
 * middle centres it. Its lines share one edge, so a wrapped name stays one block, and it counts as one name. */
/* The ink of a final 、，。；：！？ fills only the left of its em, so a right-aligned line hangs it half an em past the
 * edge and a centred line moves 0.3 em right, and its ink keeps the edge or centre of the other lines. Every name sets
 * its lines by this rule. */
export const hangOf = (line, align, size = LABEL) =>
  /[、，。；：！？]$/u.test(line)
    ? (align === "right" ? 0.5 : align === "center" ? 0.3 : 0) * labelSize(size)
    : 0;
export function nameText(
  v,
  x,
  y,
  { width = Infinity, size = LABEL, valign = "middle", align = "center", ...o } = {},
) {
  const lines = Array.isArray(v) ? v : wrapName(v, width, size),
    em = labelSize(size),
    step = em * LEADING;
  const top =
    valign === "top"
      ? y + em / 2
      : valign === "bottom"
        ? y - em / 2 - step * (lines.length - 1)
        : y - (step * (lines.length - 1)) / 2;
  lines.forEach((line, k) =>
    text(line, x + hangOf(line, align, size), top + k * step, size, {
      align,
      ...o,
      whole: lines.join(" "),
    }),
  );
  return { lines, top: top - em / 2, bottom: top + step * (lines.length - 1) + em / 2 };
}

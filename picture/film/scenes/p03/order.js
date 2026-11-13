/* 03's orders of authority: a frame that grows with its members as they are named, and the list a rank's term
 * names. Scene 05 grows a container by the same extent. */

import { box, labelSize, line, measure } from "../../drawing/strokes.js";
import { seal } from "../../drawing/symbols.js";
import { listLevel, named, speaking } from "../../naming/lists.js";
import { LEADING, NAME_GAP, nameText } from "../../naming/names.js";
import { blockHeight, growLines, growName, growTexts } from "../../naming/parts.js";
import { NOTE, TERM_GAP, TERM_STACK, termRow, termRowLayout } from "../../naming/terms.js";
import { LABEL, P } from "../../palette.js";
import { mix, ramp } from "../../timing/easing.js";
import { drawShare, glide, pacedTo } from "../../timing/pace.js";

/* The extent a container has grown to: `base` plus each step's size, each step growing over 0.35 s from 0.3 s before the
 * words of the member it makes room for, so the room is there when the member arrives. */
export const s03Extent = (t, base, steps) =>
  steps.reduce((v, [at, d]) => v + d * pacedTo(t, at - 0.1, d), base);
/* One order of authority as a frame that grows with its members: its seal and question head it, with any `note` under
 * the question, smaller, from `noteAt`, and each member's row joins below on its words, the frame widening to each part
 * of the row as the part is named and deepening to hold the row's lines. A head that `arrive`s ({x, y, r, at, rise})
 * inks in at `at` with its seal of radius r centred at x, y, and from `rise` glides to its place, growing to its size.
 * A rail runs down from the seal to each member's station as the member is named. `rows` are [term,
 * termAts, qual, qualAts, at, gap, color, set, list] with `gap` extra room above the row. A row with a `list` is a spoken
 * list named by its term: its qualifier's parts are the list's members, each its own name in the set `list`, built on
 * its own words where the qualifier stands. With `build`, each other row's qualifier joins it part by part on the
 * parts' own words. With `joined` (for every row, or row by row as an array), a qualifier that names the rest of a
 * rank's members continues its term's line at the term's size, muted, so one enumeration is set at one size with its
 * list marks' own spacing. The frame is laid out at its final width, centred, and opens at the width of what it holds
 * so far, from `frameAt` when its head stands before the words that announce the order, standing right of its place
 * while it opens so what it holds is balanced. It keeps one padding on every side, and returns to its head's own frame,
 * moving toward the centre, when the order leaves. */
export function s03Order(
  t,
  g,
  {
    FT,
    color,
    question,
    questionAt,
    rows,
    station,
    width = 560,
    leave = Infinity,
    frameAt = -Infinity,
    build = false,
    joined = false,
    leanMax = 120,
    note = "",
    noteAt = Infinity,
    arrive = null,
  },
) {
  const SR = 50,
    PAD = 60,
    qx = SR * 2 + NAME_GAP,
    nx = SR + 11 + NAME_GAP,
    joins = (r) => (Array.isArray(joined) ? joined[r] : joined);
  const qW = Math.max(measure(question, LABEL), note ? measure(note, NOTE) : 0),
    layouts = rows.map(([term, , qual], r) =>
      joins(r) && qual.length
        ? { one: true, height: blockHeight(growLines([...term, ...qual], width).length) }
        : termRowLayout(term, qual, width),
    );
  const termW = rows.map(([term]) => Math.min(width, measure(term.join(""), LABEL)));
  // A list's members, and with `build` each qualifier's parts, widen the frame one at a time as each is named.
  const members = rows.map(([term, , qual, , , , , , list], r) =>
    list || (build && qual.length) ? s03Members(term, qual, width, joins(r) && !list) : null,
  );
  const rowW = rows.map(([, , qual], r) =>
    members[r]
      ? Math.max(termW[r], ...members[r].map((v) => v.right))
      : layouts[r].one
        ? termW[r] + (qual.length ? TERM_GAP + measure(qual.join(""), NOTE) : 0)
        : Math.max(termW[r], Math.min(width, measure(qual.join(""), NOTE))),
  );
  const headW = PAD + qx + qW + PAD,
    FW = Math.max(headW, ...rowW.map((w) => PAD + nx + w + PAD));
  const FX0 = Math.round(960 - FW / 2),
    SY = FT + PAD + SR,
    H0 = 2 * (PAD + SR);
  const termH = labelSize(LABEL),
    heights = layouts.map((v) => v.height);
  const tops = rows.reduce(
    (acc, [, , , , , gap], r) => [
      ...acc,
      (r ? acc[r - 1] + heights[r - 1] + 40 : FT + H0 + 16) + gap,
    ],
    [],
  );
  // Growth steps: each row's term widens and deepens the frame on its words, and its qualifier on its own words; a
  // list's members do so each on its own words.
  const steps = [];
  let w = headW,
    b = FT + H0;
  rows.forEach(([, termAts, qual, qualAts], r) => {
    const parts = [[termAts[0], PAD + nx + termW[r] + PAD, tops[r] + termH + PAD]];
    if (members[r])
      members[r].forEach((v) =>
        parts.push([qualAts[v.k], PAD + nx + v.right + PAD, tops[r] + v.bottom + PAD]),
      );
    else if (qual.length)
      parts.push([qualAts[0], PAD + nx + rowW[r] + PAD, tops[r] + heights[r] + PAD]);
    parts
      .sort((p, q) => p[0] - q[0])
      .forEach(([at, pw, pb]) => {
        steps.push([at, Math.max(0, pw - w), Math.max(0, pb - b)]);
        w = Math.max(w, pw);
        b = Math.max(b, pb);
      });
  });
  // When the order leaves, its rows go as a whole, and once they have gone the frame closes snugly around its head, 30 px
  // clear of the seal and the question on every side, and the head glides to the centre as the frame closes round it:
  // the frame's edges close on their own easing, so the frame has closed before the next name stands under it, and the
  // head and the frame's place follow as a glide.
  const home = (FW - headW) / 2,
    gone = 1 - ramp(t, leave + 0.05, 0.3),
    CLOSE = 30;
  // The frame closes at the tip pace: its sides over their way, and its top and foot over theirs, so its foot has
  // risen past the place of the name that follows it before that name stands.
  const fullBottom = steps.reduce((v, [, , db]) => v + db, FT + H0),
    closing = FW - headW + PAD - CLOSE;
  const back = drawShare(t, leave + 0.35, closing, Math.max(0.65, home / 300)),
    centring = glide(t, leave + 0.35, home);
  const rise = drawShare(t, leave + 0.35, fullBottom - SY - SR - CLOSE, 0.65);
  // The order stands balanced as its frame opens and closes. While the frame is narrower than its full width the order
  // stands right of its place by half the width still to come, at most `leanMax` px, and follows each widening as a
  // glide, so the order itself never travels faster than the eye follows while its frame's edges open on the widening's
  // easing.
  const grown = s03Extent(
    t,
    headW,
    steps.map(([at, dw]) => [at, dw]),
  );
  const lean = (width) => Math.min(leanMax, (FW - width) / 2),
    widths = steps.reduce((v, [, dw]) => [...v, v.at(-1) + dw], [headW]);
  const shift = steps.reduce((v, [at], k) => {
    const d = lean(widths[k + 1]) - lean(widths[k]);
    return v + d * glide(t, at - 0.3, d);
  }, lean(headW));
  const FX = FX0 + mix(shift, home, centring),
    SX = FX + PAD + SR;
  const left = mix(FX, FX + PAD - CLOSE, back),
    top = mix(FT, FT + PAD - CLOSE, rise);
  const right = mix(FX + grown, FX + headW - PAD + CLOSE, back);
  const bottom = mix(
    s03Extent(
      t,
      FT + H0,
      steps.map(([at, , db]) => [at, db]),
    ),
    SY + SR + CLOSE,
    rise,
  );
  box(left, top, right - left, bottom - top, {
    stroke: color,
    alpha: g * 0.85 * ramp(t, frameAt - 0.15, 0.4),
    radius: 16,
    width: 3,
  });
  const up = arrive
    ? glide(t, arrive.rise, Math.hypot(SX - arrive.x, SY - arrive.y) + Math.abs(SR - arrive.r))
    : 1;
  const hx = arrive ? mix(arrive.x, SX, up) : SX,
    hy = arrive ? mix(arrive.y, SY, up) : SY,
    hr = arrive ? mix(arrive.r, SR, up) : SR;
  const nx0 = arrive ? hx + hr + NAME_GAP : FX + PAD + qx;
  seal(hx, hy, hr, { color, alpha: g * (arrive ? ramp(t, arrive.at - 0.15, 0.4) : 1) });
  nameText(question, nx0, hy, { align: "left", color, alpha: g * named(t, questionAt) });
  if (note)
    nameText(note, nx0, hy + labelSize(LABEL) / 2 + TERM_STACK, {
      align: "left",
      valign: "top",
      size: NOTE,
      color: P.muted,
      alpha: g * named(t, noteAt),
    });
  // The rail runs down from the seal to each station as its member is named. A station stands on its term's line; a list
  // whose members stand under its term and are said before it stands its station on the members' first line, so the
  // members never hang below their station while the name they are said before is still to come.
  const ats = rows.map(([, , , , at]) => at),
    ys = tops.map((top, r) => {
      const [, termAts, , qualAts, , , , , list] = rows[r],
        first = members[r]?.[0];
      return (
        top +
        (list && first && first.y > 0 && Math.min(...qualAts) < termAts[0]
          ? first.y + labelSize(NOTE) / 2
          : termH / 2)
      );
    });
  const reach = ats.reduce((sum, at, r) => {
    const d = ys[r] - (r ? ys[r - 1] : SY + SR + 6);
    return sum + drawShare(t, at - 0.15, d, 0.5) * d;
  }, 0);
  if (reach > 1)
    line(SX, SY + SR + 6, SX, SY + SR + 6 + reach, { color: P.line, alpha: g * gone, width: 2 });
  rows.forEach(([term, termAts, qual, qualAts, at, , rowColor, set, list], r) => {
    station(SX, ys[r], r, ramp(t, at - 0.15, 0.4) * g * gone, speaking(t, ats, r));
    const x = SX + 11 + NAME_GAP,
      o = { width, color: rowColor ?? color, alpha: g * listLevel(t, ats, r, leave), set, build };
    if (joins(r) && !list && qual.length) {
      // The rank's other members continue its line at the term's size and in its ink, each on its own words, so a rank
      // reads as one line of equals in its rank's colour. Its whole name joins the parts as a term row does, the opening
      // space of the qualifier taken as the join.
      const whole = [...term, qual[0].trimStart(), ...qual.slice(1)].join(" ");
      growName(t, term, termAts, x, tops[r], { ...o, whole });
      members[r].forEach((v) =>
        growName(t, [v.text], [build ? qualAts[v.k] : qualAts[0]], x + v.x, tops[r] + v.y, {
          color: o.color,
          alpha: o.alpha,
          whole,
          set,
        }),
      );
      return;
    }
    if (!list) {
      termRow(t, term, termAts, qual, qualAts, x, tops[r], o);
      return;
    }
    // A list's name stands as its own name, and each member as its own, on its words, at the list's levels.
    growName(t, term, termAts, x, tops[r], { ...o, whole: term.join("") });
    members[r].forEach((v) =>
      growName(t, [v.text], [qualAts[v.k]], x + v.x, tops[r] + v.y, {
        size: NOTE,
        color: P.muted,
        alpha: o.alpha * listLevel(t, qualAts, v.k),
        whole: qual[v.k].replace(/^[、，,\s]+/u, ""),
        set: list,
      }),
    );
  });
  return { SX, ys, tops, heights, head: FT + H0 };
}
/* A term row's qualifier laid out as termRow sets it, piece by piece: each piece's member `k`, its `text`, its place
 * (`x`, `y` of its line's top) and its extent (`right`, and `bottom` with the term's line), from the row's top left. A
 * member whose separator hangs at the end of the line before has a piece on each line. A `joined` qualifier continues
 * the term's line at the term's size, wrapping with it. */
function s03Members(term, qual, width, joined = false) {
  if (joined) {
    const em = labelSize(LABEL);
    return growTexts([...term, ...qual], width, LABEL)
      .flatMap((line, r) => {
        let left = 0;
        return line.map(([k, text]) => {
          const x = left,
            y = r * em * LEADING;
          left += measure(text, LABEL);
          return { k: k - term.length, text, x, y, right: left, bottom: y + em };
        });
      })
      .filter((v) => v.k >= 0);
  }
  const { one } = termRowLayout(term, qual, width),
    head = blockHeight(growLines(term, width).length),
    em = labelSize(NOTE);
  const x0 = one ? measure(term.join(""), LABEL) + TERM_GAP : 0,
    y0 = one ? (labelSize(LABEL) - em) / 2 : head + TERM_STACK;
  return growTexts(qual, one ? Infinity : width, NOTE).flatMap((line, r) => {
    let left = x0;
    return line.map(([k, text]) => {
      const x = left,
        y = y0 + r * em * LEADING;
      left += measure(text, NOTE);
      return { k, text, x, y, right: left, bottom: Math.max(head, y + em) };
    });
  });
}

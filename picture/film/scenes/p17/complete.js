/* 17's first stage: the completion stamp at the centre and the conditions that light it. */

import { mutedLevel, restMark } from "../../drawing/levels.js";
import { link } from "../../drawing/links.js";
import { box, labelSize, measure } from "../../drawing/strokes.js";
import { check } from "../../drawing/symbols.js";
import { opening } from "../../framing/chapters.js";
import { listLevel, named, speaking } from "../../naming/lists.js";
import { LEADING, NAME_GAP, nameText } from "../../naming/names.js";
import { growName, growTexts } from "../../naming/parts.js";
import { NOTE, TERM_GAP, termRow } from "../../naming/terms.js";
import { LABEL, P } from "../../palette.js";
import { L, en } from "../../timeline.js";
import { cue } from "../../timing/cues.js";
import { ramp } from "../../timing/easing.js";
import { glide } from "../../timing/pace.js";
import { thoughtEnd } from "../../timing/pauses.js";
import { s17Stamp } from "./stamp.js";

/* Stage 1: the claim as a stamp, struck complete only when every condition holds. */
export function s17Complete(s, t, complete, rows, starts, marks, holds, done, g1) {
  const SY = 525,
    R = 225,
    GY = 160,
    BXo = 320,
    width = 460,
    first = s.words[0].start;
  const colors = rows.map((_, r) => (r === 5 ? P.authority : P.evidence));
  const termW = (term) => measure(term.join(" "), LABEL),
    inline = rows.every(([term, , qual]) => termW(term) + TERM_GAP + measure(qual, NOTE) <= width);
  // A term of lines is set on them: no line holds two of them, whatever the font's widths.
  const wrapAt = (term) => (term.length > 1 ? 0 : width);
  // How far each row's block reaches from its box. While the first row stands alone the stage leans right by what
  // keeps the pair within 70 px of the centre; once the second has come it leans at most 15 px toward its shorter
  // column, so the finished columns stand nearer the centre.
  const blockW = ([term, , qual]) =>
    inline
      ? termW(term) + TERM_GAP + measure(qual, NOTE)
      : Math.max(
          ...growTexts(term, wrapAt(term)).map((line) =>
            line.reduce((w, [, v]) => w + measure(v), 0),
          ),
          measure(qual, NOTE),
        );
  const reach = (side) => Math.max(...rows.filter((_, r) => r % 2 === side).map(blockW));
  const lean = Math.max(0, (BXo + 14 + NAME_GAP + blockW(rows[0]) - R) / 2 - 70),
    finish = (reach(0) - reach(1)) / 2,
    settle = Math.max(-15, Math.min(15, finish));
  // The Chinese first thought ends with three rows, two in the left column, so the stage glides right as the third
  // arrives, to stand centred between the left column and the right one's single row, and back as the next thought
  // begins.
  const d3 = en ? 0 : (Math.max(blockW(rows[0]), blockW(rows[2])) - blockW(rows[1])) / 2 - settle;
  const third = en
    ? 0
    : d3 * (glide(t, starts[2] + 0.05, d3) - glide(t, cue(s, "另外", "") + 0.05, d3));
  const SX =
    960 +
    lean * glide(t, starts[0] + 0.05, lean) +
    (settle - lean) * glide(t, starts[1] + 0.05, settle - lean) +
    (finish - settle) * glide(t, starts[3] + 0.05, finish - settle) +
    third;
  // Each row meets the ring at the angle of its own height, and its arc reaches halfway to its neighbours' angles.
  const meet = (Math.asin(GY / R) * 180) / Math.PI,
    top = 180 + meet,
    low = 180 - meet;
  const arcs = [
    [(top + 180) / 2, 270],
    [270, (360 - meet + 360) / 2],
    [(low + 180) / 2, (top + 180) / 2],
    [-meet / 2, meet / 2],
    [90, (low + 180) / 2],
    [meet / 2, 90],
  ];
  const meets = [top, 360 - meet, 180, 0, low, meet];
  // When the last condition holds, the stamp is struck and the whole list returns to full ink with it. An arc lights
  // once its link has reached it, and has lit before its thought ends, so no arc changes in the quiet that follows.
  const struck = ramp(t, done + 0.05, 0.55),
    place = ramp(t, opening(s) + 0.2, 0.6) * g1;
  s17Stamp(
    SX,
    SY,
    R,
    arcs,
    meets,
    holds.map((at) => ramp(t, Math.min(at + 0.45, thoughtEnd(at) - 0.3), 0.3)),
    colors,
    { alpha: place, struck: struck * g1 },
  );
  nameText(L("完成", "Complete"), SX, SY + 70, { alpha: g1 * named(t, complete) });
  // The rule is named within 0.9 s of its words; the stamp stands from the scene's first words.
  const allAt = cue(s, "这些条件全都满足", "every condition holds");
  nameText(L("这些条件全都满足", "Every condition holds"), SX, SY - R - NAME_GAP, {
    valign: "bottom",
    alpha: g1 * ramp(t, Math.max(allAt - 0.9, first - 0.25), 0.3),
  });
  rows.forEach(([term, termAt, qual, qualAt], r) => {
    const side = r % 2 ? 1 : -1,
      dy = (Math.floor(r / 2) - 1) * GY,
      y = SY + dy,
      mx = SX + side * BXo,
      lit = speaking(t, marks, r);
    box(mx - 14, y - 14, 28, 28, {
      stroke: colors[r],
      alpha: named(t, marks[r]) * g1,
      radius: 5,
      width: 2.5,
    });
    if (lit > 0)
      box(mx - 21, y - 21, 42, 42, {
        stroke: colors[r],
        alpha: lit * restMark(colors[r], 0.6) * g1,
        radius: 8,
        width: 2,
      });
    check(mx, y, 20, { color: colors[r], alpha: g1, draw: { t, at: holds[r] + 0.05 } });
    // Once the condition holds, its box feeds its arc along one straight run to the ring.
    link(mx - side * 22, y, SX + side * Math.sqrt(R * R - dy * dy), y, {
      color: colors[r],
      alpha: g1 * 0.9,
      draw: { t, at: holds[r] + 0.1 },
    });
    // The six set their qualifiers one way, decided once for the list: after the term when every row fits its column,
    // else under it. Each block keeps its column's edge, the box's side: on the left both lines end there.
    const alpha = g1 * Math.max(listLevel(t, starts, r), struck),
      em = labelSize(LABEL),
      edge = mx + side * (14 + NAME_GAP);
    const block = termRow(
      t,
      term,
      [termAt],
      [qual],
      [qualAt],
      side > 0 || !inline ? edge : edge - (termW(term) + TERM_GAP + measure(qual, NOTE)),
      y - em / 2,
      {
        width: wrapAt(term),
        inline,
        align: side > 0 || inline ? "left" : "right",
        alpha,
        set: "conditions",
      },
    );
    // The Chinese verification is said to have passed, 也通过了, after it is said to match and to have run: the pass is
    // the ticked box's own qualifier, a line of its own under the row's on the words that tick the box, so the row
    // keeps the voice's words without one label repeating its caption line whole.
    if (!en && r === 2 && !inline)
      growName(t, ["也通过了"], [holds[r]], edge, block.bottom + labelSize(NOTE) * (LEADING - 1), {
        size: NOTE,
        alpha: mutedLevel(alpha),
        color: P.muted,
        align: side > 0 ? "left" : "right",
        set: "conditions",
        whole: "也通过了",
      });
  });
}

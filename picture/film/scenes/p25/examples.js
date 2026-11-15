/* 25's two examples, side by side under their aims' heads: fidelity and clarity. */

import { ctx } from "../../canvas.js";
import { link } from "../../drawing/links.js";
import { box, dot, line, measure, path, stroke, text } from "../../drawing/strokes.js";
import { check, ring } from "../../drawing/symbols.js";
import { listLevel, named, speaking } from "../../naming/lists.js";
import { NAME_GAP, nameText } from "../../naming/names.js";
import { rejectedName } from "../../naming/rejected.js";
import { LABEL, P } from "../../palette.js";
import { L, en } from "../../timeline.js";
import { clamp, mix, ramp } from "../../timing/easing.js";
import { drawShare, glide, glideTime } from "../../timing/pace.js";
import { pauseHold } from "../../timing/pauses.js";

/* Stage 3, fidelity: the collection two hours past its planned time, with the true statement and the refused one. */
export function s25FidelityExample(
  t,
  example,
  twoHours,
  write,
  roughly,
  fidelityIs,
  clarityIn,
  head,
  fadeAt,
  gF,
) {
  // The case's frame opens about the collection's row and grows to take the two hours and then the statements; in
  // Chinese it glides 390 px left to stand in the left half, clear of the clarity frame, and is all but there as that
  // frame inks in.
  ctx.save();
  ctx.translate(L(-390 * glide(t, clarityIn - 0.85 * glideTime(390), 390), 0), 0);
  const fy = 300,
    lw = L(760, 880),
    lx = 960 - lw / 2,
    rowY = fy + 200;
  // The frame is lit structure, 2.5 px, so the case covers its share of the band from its first words; it takes the
  // statements' room as they begin, in English as fidelity is named, just before them.
  const up = drawShare(t, pauseHold(twoHours - 0.45, 0.4), 72, 0.4),
    down = drawShare(t, pauseHold(Math.min(write, fidelityIs) - 0.45, 0.4), 160, 0.4);
  box(
    lx,
    mix(rowY - 40, rowY - 112, up),
    lw,
    mix(rowY + 40, rowY + 200, down) - mix(rowY - 40, rowY - 112, up),
    { stroke: P.line, alpha: en && t >= fadeAt ? 0 : gF, radius: 10, width: 2.5 },
  );
  head(lx, rowY - 152, L("信", "Fidelity"), P.evidence, fidelityIs, gF);
  // The collection's row: the planned time stays open, dashed, and the collection slips two hours past it.
  // The true statement and its check stand inside the frame; the plan stands the same two hours before it.
  const ay = fy + 200,
    rowName = L("采集", "Collection"),
    truth = L("晚了两个小时", "Two hours late"),
    x0 = lx + 40 + measure(rowName) + NAME_GAP;
  const qx = lx + lw - 60 - measure(truth) / 2 - 56,
    px = Math.max(x0 + 60, qx - 370);
  nameText(rowName, lx + 40, ay, { align: "left", alpha: gF * named(t, example) });
  line(x0, ay, lx + lw - 40, ay, { color: P.line, alpha: gF, width: 2 });
  ring(px, ay, 12, { color: P.line, alpha: gF, width: 2, dash: [4, 5] });
  // The collection stands at its actual time, two hours past the plan, as the span between them draws on.
  const slip = drawShare(t, twoHours - 0.1, qx - px),
    cx2 = mix(px, qx, slip),
    late = gF * ramp(t, twoHours - 0.15, 0.4);
  dot(qx, ay, 10, { color: P.evidence, alpha: late });
  const span2 = late * clamp((cx2 - px) / 80);
  stroke(
    () => {
      ctx.moveTo(px, ay - 52);
      ctx.lineTo(px, ay - 36);
      ctx.moveTo(px, ay - 44);
      ctx.lineTo(cx2, ay - 44);
      ctx.moveTo(cx2, ay - 52);
      ctx.lineTo(cx2, ay - 36);
    },
    { color: P.unknown, alpha: span2, width: 2 },
  );
  text(L("2 小时", "2 h"), (px + qx) / 2, ay - 78, LABEL, {
    role: "mark",
    align: "center",
    color: P.unknown,
    alpha: gF * ramp(t, twoHours + 0.4, 0.4),
  });
  // Each statement hangs from the time it claims: the true one from the actual time, the refused one from the plan.
  const sy = fy + 360;
  link(qx, ay + 16, qx, sy - 28, {
    alpha: gF * ramp(t, write - 0.15, 0.4),
    draw: { t, at: write - 0.1 },
    end: false,
  });
  nameText(truth, qx, sy, { color: P.evidence, alpha: gF * named(t, write) });
  check(qx + measure(truth) / 2 + 30, sy, 26, {
    alpha: gF * ramp(t, Math.max(fidelityIs, write) - 0.15, 0.4),
  });
  link(px, ay + 16, px, sy - 28, {
    alpha: gF * ramp(t, roughly - 0.15, 0.4),
    upto: drawShare(t, roughly - 0.1, Math.abs(sy - 28 - (ay + 16)), 0.5),
    end: false,
    dash: [6, 6],
  });
  rejectedName(L("“基本按时”", "“Roughly on time”"), px, sy, {
    alpha: gF * named(t, roughly),
    mark: ramp(t, roughly + 0.4, 0.4),
  });
  ctx.restore();
}

/* Stage 3, clarity: the message in its order, what leads at the top of the page and the detail below. */
export function s25ClarityExample(
  t,
  firstLead,
  decisionNeeded,
  detail,
  clarityIs,
  head,
  CW,
  CX,
  CY,
  reformAt,
  gC,
) {
  // The message in its order: what leads stands at the top of the page and the detail follows below it; the page's
  // spine stands with its frame, and the frame lengthens as each part comes.
  const lead = [firstLead, decisionNeeded, detail],
    leadNames = en
      ? ["The conclusion", "The decision needed", "Detail"]
      : ["结论", "需要谁来决定", "细节"];
  const rw = CW,
    rx = CX,
    fy = CY,
    rows = [fy + 70, fy + 180, fy + 290],
    sx = rx + 60;
  // The frame keeps the room above its first part's words below its last line too: 57 px.
  // In English the case's frame (top 388, foot 700, 2.5 px) re-forms into this one. The second part that leads is
  // named before a frame re-formed for the first alone would be at rest, and its foot, come up 207 px, would turn back
  // down for that part while its top still rose; so the frame re-forms once to the height of the two parts that lead,
  // its foot travelling 97 px, and lengthens for the detail alone. The spine still grows to each part on its words.
  const grown = lead.map((at, i) => (i ? drawShare(t, at - 0.45, [0, 110, 154][i], 0.4) : 1)),
    fh = 70 + 36 + 57 + 110 * (en ? 1 : grown[1]) + (110 + 44) * grown[2];
  const k = en ? glide(t, reformAt, 97) : 1,
    top = en ? mix(388, fy, k) : fy,
    foot = en ? mix(700, fy + fh, k) : fy + fh;
  box(rx, top, rw, en ? foot - top : fh, {
    stroke: P.line,
    alpha: gC,
    radius: 10,
    width: en ? mix(2.5, 3.5, k) : 3.5,
  });
  if (!en) head(rx, fy - 40, "达", P.ink, clarityIs, gC);
  path(
    [
      [sx, rows[0]],
      [sx, mix(rows[0], mix(rows[1], rows[2], grown[2]), grown[1])],
    ],
    { color: P.line, alpha: gC, width: 3 },
  );
  // Once the order is named clarity and its detail said, the message is whole: every part returns to full ink and none
  // stays lit.
  const whole = ramp(t, Math.max(clarityIs, detail) + 0.05, 0.4);
  lead.forEach((at, i) => {
    const y = rows[i],
      got = named(t, at),
      lit = speaking(t, lead, i) * (1 - whole),
      color = i < 2 ? P.ink : P.muted;
    dot(sx, y, 5 + 2 * lit, { color, alpha: got * gC });
    if (lit > 0) ring(sx, y, 15, { color: P.ink, alpha: lit * 0.5 * gC, width: 2 });
    nameText(leadNames[i], sx + 15 + NAME_GAP, y, {
      align: "left",
      color,
      alpha: gC * ramp(t, at - 0.15, 0.4) * Math.max(listLevel(t, lead, i), whole),
      set: "lead",
    });
    // Paragraph lines beneath each part: one for each part that leads, three for the detail.
    stroke(
      () => {
        for (let k = 0; k < (i < 2 ? 1 : 3); k++) {
          ctx.moveTo(sx + 37, y + 36 + k * 22);
          ctx.lineTo(rx + rw - 60 - (k === 2 ? 140 : 0), y + 36 + k * 22);
        }
      },
      { color: P.muted, alpha: got * gC * 0.8, width: 2.5 },
    );
  });
}

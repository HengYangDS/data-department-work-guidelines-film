/* 08's diagnosis: the failure on one timeline, and the three layers of response. */

import { ctx } from "../../canvas.js";
import { link } from "../../drawing/links.js";
import { box, dot, line, measure, text } from "../../drawing/strokes.js";
import { check, ring } from "../../drawing/symbols.js";
import { opening } from "../../framing/chapters.js";
import { building, listIn, named, speaking } from "../../naming/lists.js";
import { NAME_GAP, nameText } from "../../naming/names.js";
import { railNames } from "../../naming/placement.js";
import { rejectedName } from "../../naming/rejected.js";
import { P } from "../../palette.js";
import { L, en } from "../../timeline.js";
import { cue } from "../../timing/cues.js";
import { clamp, ramp } from "../../timing/easing.js";
import { glide } from "../../timing/pace.js";

/* Stage 1: the diagnosis on one timeline, the failure marked on its rail and the record's moments along it. */
export function s08Timeline(s, t, failed, kept, timeline, found, system, toPrevent, toDetect, one) {
  const Y = 550,
    xs = [480, 800, 1120, 1440],
    rail = ramp(t, opening(s) + 0.2, 0.6) * one;
  line(260, Y, 1660, Y, { color: P.line, alpha: rail, width: 4 });
  const sweep = clamp((t - timeline + 0.1) / 1.2);
  [340, 640, 960, 1280, 1580].forEach((x) =>
    line(x, Y - 12, x, Y + 12, {
      color: P.muted,
      alpha: rail * clamp((sweep * 1400 - (x - 260)) / 300),
      width: 2,
    }),
  );
  nameText(L("时间线", "Timeline"), 260, Y - NAME_GAP, {
    align: "left",
    valign: "bottom",
    alpha: one * named(t, timeline),
  });
  // The existing system holds both checks: a bracket from prevention to detection, drawn on as it is named.
  const sys = ramp(t, system - 0.15, 0.4) * one;
  link(xs[0], Y - 30, xs[2], Y - 30, {
    route: "vhv",
    mid: Y - 130,
    alpha: sys,
    draw: { t, at: system - 0.1 },
    end: false,
  });
  nameText(
    L("现有的工作体系", "The existing work system"),
    (xs[0] + xs[2]) / 2,
    Y - 130 - NAME_GAP,
    { valign: "bottom", alpha: one * named(t, system) },
  );
  const ats = [toPrevent, found, toDetect, kept];
  xs.forEach((x, i) => {
    const q = ramp(t, (i === 3 ? failed : ats[i]) - 0.1, 0.4) * one;
    // A station's mark masks the rail beneath it from the moment it begins to stand, so the rail never runs through
    // its mark or its question.
    dot(x, Y, 21, { color: P.ground, alpha: clamp(q * 8) });
    if (i === 0 || i === 2) {
      ring(x, Y, 20, { color: P.unknown, alpha: q, width: 2.5 });
      text("?", x, Y + 1, 26, { role: "mark", align: "center", color: P.unknown, alpha: q });
    } else {
      ring(x, Y, 20, { color: P.unknown, alpha: q, width: 3 });
      dot(x, Y, i === 3 ? 10 : 6, { color: P.unknown, alpha: q });
    }
    // The failure is flagged where it happened: a marker rises from its mark, and the failure is named above it.
    if (i === 3) line(x, Y - 26, x, Y - 64, { color: P.unknown, alpha: q, width: 3 });
  });
  railNames(
    en
      ? ["Prevent", "Direct cause", "Detect", "Original symptom"]
      : ["预防", "直接原因", "发现", "最初的症状"],
    xs,
    Y,
    { alpha: (i) => one * named(t, ats[i]) },
  );
  nameText(L("出了问题", "Something fails"), xs[3], Y - 64 - NAME_GAP, {
    valign: "bottom",
    alpha: one * named(t, failed),
  });
}

/* Stage 2: the three layers of response in one stack, with doing only the first two refused. */
export function s08Layers(s, t, two, layers, lay) {
  // The stage stands centred in each of its states: the stack with its names alone; with the refused first two, which
  // join it on its left, it eases right on their words; and with the fix at the root, which closes it on the right, it
  // eases back left from the words that refuse the first two, so the glide has settled before the voice rests: the
  // Chinese names the fix as its thought ends.
  const ys = [330, 500, 670],
    x0 = 680,
    x1 = 1180,
    h = 84,
    names = en ? ["Containment", "Repair", "Prevention"] : ["控制影响", "修复", "防止再发生"];
  const not = cue(s, "不算", "is not a"),
    whole = cue(s, "治本", "systemic fix"),
    done = ramp(t, two - 0.1, 0.4) * lay;
  const nameEnd = x1 + NAME_GAP + Math.max(...names.map((v) => measure(v))),
    refusedEnd = x0 - 40 - NAME_GAP - 42 - measure(L("只做前两层", "Only the first two"));
  const fixEnd = nameEnd + 40 + NAME_GAP + measure(L("治本", "A systemic fix")),
    centre = (l, r) => 960 - (l + r) / 2;
  const states = [centre(x0, nameEnd), centre(refusedEnd, nameEnd), centre(refusedEnd, fixEnd)];
  const ox =
    states[0] +
    (states[1] - states[0]) * glide(t, two - 0.1, states[1] - states[0]) +
    (states[2] - states[1]) * glide(t, not + 0.05, states[2] - states[1]);
  // The stack builds downward, so it stands half a row lower for each layer still to come and rises as each comes.
  ctx.save();
  ctx.translate(ox, building(t, layers, (ys[1] - ys[0]) / 2));
  ys.forEach((y, i) => {
    const q = ramp(t, layers[i] - 0.1, 0.4) * lay,
      lit = speaking(t, layers, i) * lay;
    box(x0, y - h / 2, x1 - x0, h, {
      fill: P.row,
      stroke: P.line,
      alpha: q,
      radius: 10,
      width: 2.5,
    });
    box(x0, y - h / 2, x1 - x0, h, { stroke: P.ink, alpha: q * lit, radius: 10, width: 3 });
    if (i < 2) check(x0 + 200, y, 30, { alpha: done, draw: { t, at: two - 0.05 + i * 0.2 } });
    else ring(x0 + 200, y, 17, { color: P.unknown, alpha: done, width: 2.5, dash: [4, 5] });
    nameText(names[i], x1 + NAME_GAP, y, {
      align: "left",
      alpha: lay * listIn(t, layers, i),
      set: "layers",
    });
  });
  // Only the first two: a bracket on the left encloses them, and the phrase is refused on "is not" ("不算").
  const lx = x0 - 40,
    top = ys[0] - h / 2;
  link(x0 - 18, top, x0 - 18, ys[1] + h / 2, {
    route: "hvh",
    mid: lx,
    end: false,
    alpha: done,
    draw: { t, at: two - 0.1 },
  });
  rejectedName(L("只做前两层", "Only the first two"), lx - NAME_GAP - 42, (ys[0] + ys[1]) / 2, {
    align: "right",
    alpha: lay * named(t, two),
    mark: ramp(t, not + 0.05, 0.4),
  });
  // The fix at the root encloses all three layers, on the right beyond their names.
  const bx = x1 + NAME_GAP + Math.max(...names.map((v) => measure(v))) + 40;
  link(bx - 18, top, bx - 18, ys[2] + h / 2, {
    route: "hvh",
    mid: bx,
    end: false,
    alpha: ramp(t, whole - 0.1, 0.4) * lay,
    draw: { t, at: whole - 0.1 },
  });
  nameText(L("治本", "A systemic fix"), bx + NAME_GAP, ys[1], {
    align: "left",
    alpha: lay * named(t, whole),
  });
  ctx.restore();
}

/* 14's handover: the three things an owner states before handing a result over. */

import { ctx } from "../../canvas.js";
import { link } from "../../drawing/links.js";
import { box, diamond, dot, line, measure, path, stroke, text } from "../../drawing/strokes.js";
import { check, cross, person, ring } from "../../drawing/symbols.js";
import { listLevel, named } from "../../naming/lists.js";
import { NAME_GAP, nameText } from "../../naming/names.js";
import { growName } from "../../naming/parts.js";
import { radialName } from "../../naming/placement.js";
import { P } from "../../palette.js";
import { L, en } from "../../timeline.js";
import { clamp, ramp, soon } from "../../timing/easing.js";

/* Stage 2: the result with the three things its owner states before handing it over, each a group of parts. */
export function s14Handover(
  t,
  handing,
  rows,
  groups,
  pB,
  resultAt,
  modelName,
  inputsName,
  failName,
  riskName,
  TW,
  RR,
  PAIR,
  OUT,
  MEET,
  widest,
  reportLeft,
  RCY,
  RCX,
) {
  // The heading starts where the diagram starts, at the left names, and stands well clear above the inputs' tiles.
  const modelLeft = RCX + reportLeft;
  nameText(L("交出结果之前，讲清三件事", "Before handing over"), modelLeft, 338 - 22 - 40, {
    align: "left",
    valign: "bottom",
    alpha: pB * named(t, handing),
  });
  const starts = rows.filter((_, i) => groups[i] !== groups[i - 1]).map((v) => v[0]),
    level = (i) => pB * listLevel(t, starts, groups[i]);
  const on = (at) => ramp(t, at - 0.15, 0.35) * pB,
    att = (at) => soon(t, at + 0.05, 0.5);
  // The results: the stretch the tests covered draws round the result, and the stretch at its foot they did not reach
  // stays a gap, named under it. The results are named over the ring in Chinese and, above its inputs' way, at its upper
  // left in English.
  const G0 = (Math.PI * 55) / 180,
    G1 = (Math.PI * 125) / 180;
  ring(RCX, RCY, RR, {
    color: P.evidence,
    alpha: on(rows[2][0]),
    width: 6,
    start: G1,
    upto: 290 / 360,
    draw: { t, at: rows[2][0] + 0.05 },
  });
  stroke(() => ctx.arc(RCX, RCY, RR, G0, G1), {
    color: P.unknown,
    alpha: on(rows[2][1]),
    width: 4,
    dash: [7, 7],
  });
  radialName(L("结果", "Result"), RCX, RCY, RR, en ? (-Math.PI * 3) / 4 : -Math.PI / 2, {
    gap: NAME_GAP + 4,
    alpha: pB * named(t, resultAt),
  });
  radialName(L("哪里没覆盖到", "What was not covered"), RCX, RCY, RR, Math.PI / 2, {
    gap: NAME_GAP + 14,
    width: 420,
    alpha: level(2) * named(t, rows[2][1]),
    set: "report",
  });
  // The criteria, from the left: a card of three linked parts, and a scale with the standard marked on it. Both editions
  // name the criteria alone, so the card and its scale arrive together.
  // The report's ways draw on over at least 0.9 s, since the diagram may still be gliding to its place as they set off.
  const my = en ? RCY : RCY - PAIR,
    mq = on(rows[0][0]),
    mx = RCX - OUT + 50 - 28 * (1 - att(rows[0][0])),
    cq = on(rows[0].at(-1));
  box(mx - 50, my - 36, 100, 72, { fill: P.row, stroke: P.evidence, alpha: mq, radius: 8 });
  const parts = [
    [mx - 32, my - 13],
    [mx - 8, my - 13],
    [mx - 20, my + 13],
  ];
  path([...parts, parts[0]], { color: P.ink, alpha: mq, width: 2 });
  parts.forEach(([x, y]) => dot(x, y, 5, { color: P.ink, alpha: mq }));
  // The scale, its rule and its four ticks, is one stroke, so it moves whole with the card; ticks drawn one by one, 11
  // px apart, would read at the card's pace as each tick taking its neighbour's place.
  stroke(
    () => {
      ctx.moveTo(mx + 6, my + 14);
      ctx.lineTo(mx + 40, my + 14);
      [0, 1, 2, 3].forEach((k) => {
        ctx.moveTo(mx + 6 + k * 11, my + 14);
        ctx.lineTo(mx + 6 + k * 11, my + 7);
      });
    },
    { color: P.ink, alpha: cq, width: 2 },
  );
  line(mx + 28, my - 18, mx + 28, my + 14, { color: P.authority, alpha: cq, width: 3 });
  link(mx + 58, my, RCX - RR - 8, RCY, {
    route: en ? null : "hvh",
    mid: RCX - MEET,
    color: P.evidence,
    alpha: mq,
    draw: { t, at: rows[0][0] + 0.05, least: 0.9 },
  });
  growName(t, modelName, rows[0], mx - 50 - NAME_GAP - measure(modelName.join("")), my, {
    valign: "middle",
    alpha: level(0),
    set: "report",
  });
  // The actual inputs, version and environment: a tile for each, docking down onto one bar on its word. The Chinese
  // tiles stand under the criteria, and the English three above the ring.
  const IX = en ? RCX : RCX - OUT + TW,
    IY = en ? 338 : RCY + PAIR;
  [-54, 0, 54].forEach((dx, k) => {
    const q = on(rows[1][k]),
      x = IX + dx,
      y = IY - 20 * (1 - att(rows[1][k]));
    box(x - 22, y - 22, 44, 44, { fill: P.row, stroke: P.evidence, alpha: q, radius: 6 });
    if (k === 0) {
      box(x - 12, y - 10, 24, 20, { stroke: P.ink, alpha: q, radius: 2 });
      line(x - 12, y, x + 12, y, { color: P.ink, alpha: q });
      line(x, y - 10, x, y + 10, { color: P.ink, alpha: q });
    }
    if (k === 1)
      text("v2", x, y + 1, 26, { role: "mark", align: "center", color: P.ink, alpha: q });
    if (k === 2) {
      box(x - 13, y - 11, 26, 22, { stroke: P.ink, alpha: q, radius: 4 });
      dot(x, y, 4, { color: P.ink, alpha: q });
    }
  });
  const iq = on(rows[1][0]);
  line(IX - TW, IY + 30, IX + TW, IY + 30, { color: P.evidence, alpha: iq, width: 2 });
  if (en)
    link(RCX, 368, RCX, RCY - RR - 8, {
      color: P.evidence,
      alpha: iq,
      draw: { t, at: rows[1][0] + 0.05, least: 0.9 },
    });
  else
    link(IX + TW + 8, IY, RCX - RR - 8, RCY, {
      route: "hvh",
      mid: RCX - MEET,
      color: P.evidence,
      alpha: iq,
      draw: { t, at: rows[1][0] + 0.05, least: 0.9 },
    });
  growName(
    t,
    inputsName,
    rows[1],
    en ? RCX + TW + NAME_GAP : RCX - OUT - NAME_GAP - widest(inputsName, 480),
    IY,
    { valign: "middle", width: 480, alpha: level(1), set: "report" },
  );
  // Each failure and how it was handled, from the right: two failures, each handled along its own way.
  const fy = RCY - PAIR,
    fq = on(rows[3][0]),
    fx = RCX + 220 + 28 * (1 - att(rows[3][0])),
    dq = on(rows[3][1]);
  box(fx - 50, fy - 36, 100, 72, { fill: P.row, stroke: P.evidence, alpha: fq, radius: 8 });
  [-16, 16].forEach((d, k) => {
    const go = soon(t, rows[3][1] + 0.05 + k * 0.15, 0.4);
    cross(fx - 28, fy + d, 14, { alpha: fq, width: 3 });
    link(fx - 16, fy + d, fx + 14, fy + d, { color: P.muted, alpha: dq, upto: go, end: false });
    check(fx + 28, fy + d, 15, { alpha: dq, upto: clamp((go - 0.6) / 0.4), width: 3 });
  });
  link(fx - 58, fy, RCX + RR + 8, RCY, {
    route: "hvh",
    mid: RCX + MEET,
    color: P.evidence,
    alpha: fq,
    draw: { t, at: rows[3][0] + 0.05, least: 0.9 },
  });
  growName(t, failName, rows[3], fx + 50 + NAME_GAP, fy, {
    valign: "middle",
    width: 480,
    alpha: level(3),
    set: "report",
  });
  // The remaining risk, under the failures: the risk docks from below, held by the one who owns it, and joins the
  // failures' way to the result. The English names the owner before the risk, the Chinese the risk before its owner.
  const [whoAt, riskAt] = en ? rows[4] : [rows[4][1], rows[4][0]];
  const DX = RCX + 198,
    wq = on(whoAt),
    rq = on(riskAt),
    ry = RCY + PAIR + 24 * (1 - att(riskAt));
  person(DX + 58, RCY + PAIR + 6, { color: P.authority, alpha: wq, size: 0.9 });
  diamond(DX, ry, 14, { color: P.unknown, alpha: rq, solid: true });
  link(DX + 16, ry, DX + 34, ry, {
    color: P.authority,
    alpha: rq,
    upto: att(riskAt),
    end: false,
  });
  link(DX - 22, ry, RCX + RR + 8, RCY, {
    route: "hvh",
    mid: RCX + MEET,
    color: P.evidence,
    alpha: rq,
    draw: { t, at: riskAt + 0.05, least: 0.9 },
  });
  // The risk and its owner are named on the failures' edge, beside the one who owns it.
  growName(t, riskName, rows[4], RCX + 220 + 50 + NAME_GAP, RCY + PAIR, {
    valign: "middle",
    alpha: level(4),
    set: "report",
  });
}

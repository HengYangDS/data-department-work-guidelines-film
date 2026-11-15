/* 22's second stage: the two records of handoff and interruption. */

import { ctx } from "../../canvas.js";
import { restMark } from "../../drawing/levels.js";
import { link } from "../../drawing/links.js";
import { box, dot, line, measure, stroke } from "../../drawing/strokes.js";
import { check, documentIcon, ring, seal } from "../../drawing/symbols.js";
import { listIn, named, speaking } from "../../naming/lists.js";
import { NAME_GAP, nameText } from "../../naming/names.js";
import { P } from "../../palette.js";
import { L, en } from "../../timeline.js";
import { mix, ramp, soon } from "../../timing/easing.js";
import { pauseHold } from "../../timing/pauses.js";
import { STAGE_CUT } from "../../timing/stages.js";
import { dlKept } from "./kept.js";

/* Stage 2: the two records that hang from the way, the report and what an interruption keeps. */
export function s22Records(t, handoff, told, interrupt, kept, HY, handway, g2) {
  // The handoff moves along the way until the work pauses.
  handway(g2, 1 - ramp(t, interrupt, 0.4), handoff + STAGE_CUT);
  const items = en
    ? [
        ["The work", "work"],
        ["Delivery state", "state"],
        ["Evidence", "evidence"],
        ["Limits", "limits"],
        ["Acceptance still needed", "acceptance"],
      ]
    : [
        ["做到了哪一步", "state"],
        ["做了什么", "work"],
        ["怎么核验的", "evidence"],
        ["还有哪些限度", "limits"],
        ["还要谁验收", "acceptance"],
      ];
  const names3 = en
    ? ["The state", "Uncommitted work", "Attempts and failures", "Where to resume"]
    : ["现场", "没提交的改动", "试过和失败的办法", "从哪里接着做"];
  // The report and the frame hang side by side with their tops on one line and their feet on one line: the report's
  // page is as tall as the finished frame, whose rows keep one and a half of the report's row. The report's first row
  // stands one row below its heading's band and its last keeps the heading's padding above the page's foot, its rows
  // at one pitch between them, so each stands level with a frame row or clearly between two.
  const HEAD = 64,
    ROW = 68,
    IX = 50,
    NX = 92,
    PT = HY + 64,
    ROW3 = ROW * 1.5,
    FT = PT,
    NX3 = 130,
    PR = 26,
    FPAD = 24;
  const PH = 2 * FPAD - (ROW3 - 80) + ROW3 * names3.length,
    FIRST = HEAD + ROW,
    PITCH = (PH - HEAD / 2 - FIRST) / (items.length - 1);
  const PW = NX + Math.max(...items.map(([v]) => measure(v))) + 34,
    widths = names3.map((v) => NX3 + measure(v) + 30),
    FWmax = Math.max(...widths);
  const px0 = 960 - (PW + 100 + FWmax) / 2 + 30,
    FX = px0 + PW + 100,
    SX = FX + FWmax / 2;
  // The report.
  link(px0 + PW / 2, HY + 6, px0 + PW / 2, PT - 4, {
    alpha: g2,
    draw: { t, at: handoff + STAGE_CUT },
    end: false,
  });
  // The page is its heading's band before the rows come, so its name stands centred in it, and it lengthens to take
  // each row as it comes, keeping the heading's padding below the last.
  const length = told.reduce(
    (h, at, k) => h + (k ? PITCH : FIRST - HEAD / 2) * soon(t, pauseHold(at - 0.45, 0.4), 0.4),
    HEAD,
  );
  documentIcon(px0, PT, PW, length, { alpha: g2, rows: 0 });
  nameText(L("汇报完成", "A completion report"), px0 + 28, PT + HEAD / 2, {
    align: "left",
    alpha: g2 * named(t, handoff),
  });
  items.forEach(([v, kind], k) => {
    const y = PT + FIRST + k * PITCH,
      x = px0 + IX,
      q = ramp(t, told[k] - 0.15, 0.4) * g2,
      lit = speaking(t, told, k);
    if (lit > 0)
      ring(x, y, 25, {
        color: P.evidence,
        alpha: lit * restMark(P.evidence, 0.6) * g2,
        width: 2,
      });
    if (kind === "work") documentIcon(x - 14, y - 19, 28, 38, { alpha: q, rows: 2 });
    if (kind === "state") {
      stroke(() => ctx.arc(x, y + 8, 17, Math.PI, Math.PI * 2), {
        color: P.authority,
        alpha: q,
        width: 3,
      });
      line(x, y + 8, x + 10, y - 5, { color: P.ink, alpha: q, width: 3 });
      dot(x, y + 8, 3.5, { color: P.ink, alpha: q });
    }
    if (kind === "evidence") check(x, y, 26, { alpha: q });
    if (kind === "limits") {
      line(x - 15, y, x + 5, y, { color: P.ink, alpha: q, width: 3 });
      line(x + 10, y - 14, x + 10, y + 14, { color: P.ink, alpha: q, width: 4 });
    }
    if (kind === "acceptance") seal(x, y, 15, { alpha: q, hollow: true });
    nameText(v, px0 + NX, y, { align: "left", alpha: g2 * listIn(t, told, k), set: "handoff" });
  });
  // The interruption.
  const pause = ramp(t, interrupt - 0.15, 0.4) * g2;
  if (pause > 0) {
    dot(SX, HY, PR, { color: P.ground, alpha: pause });
    ring(SX, HY, PR, { color: P.authority, alpha: pause, width: 3 });
    box(SX - 12, HY - 12, 8, 24, { fill: P.authority, alpha: pause, radius: 3 });
    box(SX + 4, HY - 12, 8, 24, { fill: P.authority, alpha: pause, radius: 3 });
    nameText(L("中途停下", "On interruption"), SX + PR + NAME_GAP, HY - PR, {
      align: "left",
      valign: "bottom",
      color: P.authority,
      alpha: g2 * named(t, interrupt),
    });
  }
  const grown = kept.map((at) => soon(t, pauseHold(at - 0.45, 0.4), 0.4));
  // The frame keeps one padding round its 80 px boxes, above and below alike, about the 22 px between them.
  const FW = grown.reduce((w, q, k) => mix(w, Math.max(w, widths[k]), q), widths[0]),
    FH = grown.reduce((h, q) => h + ROW3 * q, 2 * FPAD - (ROW3 - 80));
  // The frame inks in over the time it opens for its first row, by the curve every mark inks in by: the opening's own
  // curve rises steeply enough at its middle to take a stroke from faint to firm within one frame.
  const framed = ramp(t, pauseHold(kept[0] - 0.45, 0.4), 0.4);
  if (framed > 0)
    box(FX, FT, FW, FH, { stroke: P.authority, alpha: g2 * framed, radius: 14, width: 2 });
  kept.forEach((at, k) => {
    const q = ramp(t, at - 0.15, 0.4) * g2,
      y = FT + FPAD + 40 + k * ROW3;
    box(FX + 28, y - 40, 80, 80, {
      fill: P.row,
      stroke: P.authority,
      alpha: q,
      radius: 8,
      width: 2,
    });
    if (q > 0) dlKept[k](FX + 68, y, q);
    nameText(names3[k], FX + NX3, y, {
      align: "left",
      alpha: g2 * listIn(t, kept, k),
      set: "kept",
    });
  });
}

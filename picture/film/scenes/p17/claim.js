/* 17's claim: the questions every completion claim answers, and the claim narrowing to its evidence. */

import { ctx } from "../../canvas.js";
import { blend } from "../../drawing/colour.js";
import { s29Gear } from "../../drawing/gears.js";
import { link } from "../../drawing/links.js";
import { box, line, measure, path, stroke, text } from "../../drawing/strokes.js";
import { check, clock, person, ring } from "../../drawing/symbols.js";
import { listIn, named } from "../../naming/lists.js";
import { NAME_GAP, nameText } from "../../naming/names.js";
import { P } from "../../palette.js";
import { L } from "../../timeline.js";
import { cue, cueFrom, cues } from "../../timing/cues.js";
import { mix, ramp, soon } from "../../timing/easing.js";
import { glide } from "../../timing/pace.js";

/* Stage 2: the claim as a card that carries its answers to the questions every completion claim answers. */
export function s17Questions(s, t, questions, g2) {
  // The Chinese asks what is said about which subject at once, and 谁 is said once before the questions.
  const [claimed, about, versionAt, covered, unproved] = cues(s, [
    ["说的是哪个对象", "what is claimed"],
    ["哪个对象", "about which subject"],
    ["哪个版本", "version"],
    ["覆盖了什么", "covering what"],
    ["还有什么没证明", "leaving what unproved"],
  ]);
  const [who, when, how] = [
    ["谁", "by whom"],
    ["什么时候", "when"],
    ["什么方法", "how"],
  ].map(([a, b]) => cueFrom(s, a, b, questions));
  // The subject reaches 110 + 320 px past the card's right edge, the signatures 196 px and their widest name past its
  // left; the card eases left by half the subject's reach as the subject is pinned, so the pair stands centred, and
  // back as the signatures come, each move a glide at the film's pace. The move back takes at least 0.8 s: the first
  // signature draws on into the card while the claim carries it, and a stroke still lengthening on a gliding stage
  // moves faster than the stage, by half its tip's pace.
  const CW = 700,
    CH = 290,
    CT = 355,
    CY = CT + CH / 2,
    OW = 320,
    OH = 120,
    OT = CY - OH / 2;
  const signW = Math.max(
    ...[L("谁", "By whom"), L("什么时候", "When"), L("什么方法", "How")].map((v) => measure(v)),
  );
  const pairLean = (110 + OW) / 2,
    wholeLean = (OW + 110 - 196 - signW) / 2;
  const CL =
      960 -
      CW / 2 -
      pairLean * glide(t, about + 0.05, pairLean) +
      (pairLean - wholeLean) * glide(t, Math.min(who, when, how) + 0.05, pairLean - wholeLean, 0.8),
    OL = CL + CW + 110;
  const on = named(t, questions) * g2;
  box(CL, CT, CW, CH, { fill: P.row, stroke: P.ink, alpha: on, radius: 14, width: 2.5 });
  nameText(L("每次说完成", "Every completion claim"), CL + CW / 2, CT - NAME_GAP, {
    valign: "bottom",
    alpha: on,
  });
  ring(CL + 120, CY, 66, { color: P.evidence, alpha: on, width: 3.5 });
  check(CL + 120, CY + 3, 60, { alpha: on });
  // What is claimed: the claim's wording stands with it and lights, line by line, when what it claims is asked.
  [400, 320, 360].forEach((w, k) => {
    const y = CY - 80 + k * 80,
      lit = soon(t, claimed + 0.05 + k * 0.2, 0.4);
    line(CL + 230, y, CL + 230 + w, y, {
      color: blend(P.muted, P.ink, lit),
      alpha: on,
      width: 6,
    });
  });
  // The verification signs the claim from the left: who, when and by what method, each mark and name on its own words,
  // its signature drawn on into the card.
  const signs = [
    ["who", who, L("谁", "By whom")],
    ["when", when, L("什么时候", "When")],
    ["how", how, L("什么方法", "How")],
  ].sort((a, b) => a[1] - b[1]);
  const signAts = signs.map(([, at]) => at),
    IX = CL - 140;
  signs.forEach(([kind, at, v], i) => {
    const y = CY + (i - 1) * 80,
      q = named(t, at) * g2;
    if (kind === "who") person(IX, y + 4, { alpha: q, size: 0.85 });
    if (kind === "when") clock(IX, y, 22, { hand: 0.3, alpha: q });
    if (kind === "how") s29Gear(IX, y, 21, { alpha: q });
    link(IX + 34, y, CL - 12, y, { alpha: q, draw: { t, at: at + 0.05 } });
    nameText(v, IX - 34 - NAME_GAP, y, {
      align: "right",
      alpha: g2 * listIn(t, signAts, i),
      set: "signed",
    });
  });
  // The subject the claim is about: pinned to the claim on its words, its version tagged on its own word.
  const pin = named(t, about) * g2,
    PY = CY;
  link(CL + CW, PY, OL - 12, PY, { alpha: g2, draw: { t, at: about + 0.05 } });
  box(OL, OT, OW, OH, { fill: P.row, stroke: P.ink, alpha: pin, radius: 8, width: 2.5 });
  // The subject's parts, ruled as one comb so they read as one subject.
  stroke(
    () => {
      for (let c = 1; c < 5; c++) {
        ctx.moveTo(OL + (c * OW) / 5, OT);
        ctx.lineTo(OL + (c * OW) / 5, OT + OH);
      }
    },
    { color: P.line, alpha: pin, width: 1.5 },
  );
  nameText(L("哪个对象", "Subject"), OL + OW / 2, OT + OH + NAME_GAP, {
    valign: "top",
    alpha: pin,
  });
  const tag = named(t, versionAt) * g2;
  text("v2", OL + OW - 6, OT - 20, 26, {
    role: "mark",
    align: "right",
    color: P.evidence,
    alpha: tag,
  });
  // What the claim covers fills on its words; what is left unproved stays open, dashed, with its question marks.
  const cover = named(t, covered) * g2,
    open = named(t, unproved) * g2;
  for (let c = 0; c < 5; c++) {
    const x = OL + (c * OW) / 5 + 7,
      w = OW / 5 - 14;
    if (c < 3) {
      // The cover's tint stays a ground for the cell, under 1.8:1 against the frame's ground (1.70:1 over the row at
      // 0.16); the cell's outline carries the evidence colour.
      box(x, OT + 8, w, OH - 16, { fill: P.evidence, alpha: cover * 0.16, radius: 5 });
      box(x, OT + 8, w, OH - 16, { stroke: P.evidence, alpha: cover, radius: 5, width: 2.5 });
    } else {
      box(x, OT + 8, w, OH - 16, {
        stroke: P.unknown,
        alpha: open,
        radius: 5,
        width: 2,
        dash: [6, 6],
      });
      text("?", x + w / 2, PY + 1, 26, {
        role: "mark",
        align: "center",
        color: P.unknown,
        alpha: open,
      });
    }
  }
}

/* Stage 4: the row of evidence, checked or missing, and the claim narrowing to what exists. */
export function s17Narrowing(s, t, missing, narrow, g4) {
  const n = 6,
    have = 4,
    cw = 164,
    gap = 24,
    x0 = 960 - (n * cw + (n - 1) * gap) / 2,
    full = x0 + n * cw + (n - 1) * gap;
  const limit = x0 + have * cw + (have - 1) * gap,
    CT = 356,
    CHt = 96,
    ET = 500,
    EH = 140;
  const evidence = cue(s, "证据不够", "evidence");
  const right = mix(full, limit, glide(t, narrow + 0.05, full - limit)),
    claimOn = named(t, narrow);
  // The extent the claim gives up stays as an open trace beyond the limit.
  path(
    [
      [limit + 12, CT],
      [full - 12, CT],
      [full, CT + 12],
      [full, CT + CHt - 12],
      [full - 12, CT + CHt],
      [limit + 12, CT + CHt],
    ],
    { color: P.line, alpha: g4 * soon(t, narrow + 0.05, 0.9), width: 2, dash: [8, 8] },
  );
  // The claim stands on its words and narrows.
  box(x0, CT, right - x0, CHt, {
    fill: P.row,
    stroke: P.ink,
    alpha: g4 * claimOn,
    radius: 12,
    width: 3,
  });
  // The claim's wording: two lines of words that fill it and narrow with it.
  line(x0 + 34, CT + 26, right - 34, CT + 26, { color: P.muted, alpha: g4 * claimOn, width: 6 });
  line(x0 + 34, CT + 70, right - 130, CT + 70, { color: P.muted, alpha: g4 * claimOn, width: 6 });
  for (let i = 0; i < n; i++) {
    const x = x0 + i * (cw + gap),
      cx = x + cw / 2,
      cy = ET + EH / 2;
    if (i < have) {
      box(x, ET, cw, EH, { fill: P.row, stroke: P.evidence, alpha: g4, radius: 10, width: 2.5 });
      check(cx, cy + 2, 48, { alpha: g4 });
    } else {
      box(x, ET, cw, EH, { stroke: P.line, alpha: g4, radius: 10, width: 2, dash: [6, 6] });
      ring(cx, cy, 24, {
        color: P.unknown,
        alpha: g4 * ramp(t, missing + 0.05, 0.3),
        width: 2.5,
        dash: [4, 4],
      });
      text("?", cx, cy + 1, 26, {
        role: "mark",
        align: "center",
        color: P.unknown,
        alpha: g4 * ramp(t, missing + 0.05, 0.3),
      });
    }
  }
  nameText(L("证据", "Evidence"), x0, ET + EH + NAME_GAP, {
    align: "left",
    valign: "top",
    color: P.evidence,
    alpha: g4 * named(t, evidence),
  });
  nameText(L("收窄说法", "Claim"), x0, CT - NAME_GAP, {
    align: "left",
    valign: "bottom",
    alpha: g4 * claimOn,
  });
}

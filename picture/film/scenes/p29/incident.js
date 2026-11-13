/* 29's incident: contained by whoever finds it within their own authority, and the response the owner of the
 * affected work leads. */

import { blend } from "../../drawing/colour.js";
import { restMark } from "../../drawing/levels.js";
import { link } from "../../drawing/links.js";
import { s23Page } from "../../drawing/pages.js";
import { box, dot, labelSize, line, measure } from "../../drawing/strokes.js";
import { check, clock, person, ring } from "../../drawing/symbols.js";
import { listIn, named, speaking } from "../../naming/lists.js";
import { LEADING, NAME_GAP, nameText, wrapName } from "../../naming/names.js";
import { blockHeight, growName } from "../../naming/parts.js";
import { RAIL_ROW, railNames } from "../../naming/placement.js";
import { NOTE } from "../../naming/terms.js";
import { LABEL, P } from "../../palette.js";
import { L, en } from "../../timeline.js";
import { cue, cueFrom, cues } from "../../timing/cues.js";
import { clamp, mix, ramp, soon } from "../../timing/easing.js";
import { glide, glideTime } from "../../timing/pace.js";
import { voiceTime } from "../../timing/pauses.js";
import { STAGE_CUT } from "../../timing/stages.js";

/* Stage 5: the incident contained by whoever finds it, within their own authority. */
export function s29Containment(s, t, kinds, emergency, finder, contain, tell, six) {
  const KY = 470,
    M = 160,
    PAD = 30,
    py = KY + 26 - 29,
    NY6 = KY + 26 + NAME_GAP;
  const held6 = ramp(t, contain - 0.15, 0.4),
    place = ramp(t, kinds[0] - 0.1, 0.5) * six;
  // The English kinds alternate on two baselines, as the film's dense rails set their names: the first and the third,
  // whole on one line, stand a row lower on a short stem from their rings, so the kinds keep one pitch; the frame
  // reaches 44 px past the third's name, and the finder's side keeps that padding.
  const names = en
    ? ["Data error", "Production failure", ["Permission or compliance breach"]]
    : ["数据出错", "生产故障", "越权、违规"];
  const finderName = L("发现的人", "Whoever finds it"),
    FW6 = 280,
    half = (v, w) => Math.max(...wrapName(v, w).map((line) => measure(line))) / 2;
  // The frame's edges follow its members: each next kind widens it to the right just before it arrives, and the
  // finder widens it to the left. The stage keeps the frame on the centre as it widens, so what stands in it reflows by
  // half of each widening; as the owner is told it closes left, the owner coming in at their place beside it, until the
  // frame and the owner centre together. Its headings and the condition beneath it centre on it as it stands.
  const ownerName = L("数据或生产负责人", "Data or production owner"),
    M3 = L(M, half(names[2], 300) + 44),
    row6 = L(0, RAIL_ROW);
  // Each widening is a glide in voice time that has nearly arrived as its member comes in, so the frame's edges and what
  // the stage re-centres move at a pace the eye follows and the member never stands outside the frame.
  const widenFrom = (at, d) => at - 0.15 - 0.85 * glideTime(d);
  const FL0 = 2 * 710 - 980 - half(finderName, FW6) - (M3 - half(names[2], 300));
  const left0 = mix(710 - M, FL0, glide(t, widenFrom(finder, 710 - M - FL0), 710 - M - FL0));
  const right0 = mix(
    mix(710 + M, 980 + M, glide(t, widenFrom(kinds[1], 270), 270)),
    1250 + M3,
    glide(t, widenFrom(kinds[2], 1250 + M3 - 980 - M), 1250 + M3 - 980 - M),
  );
  // The English owner's name stands whole on one line, as no break keeps it a phrase, so the owner stands a gap past
  // the frame by its name's own width, the frame with the owner centres on their whole extent, and the frame closes
  // from the words before the owner's, so the owner arrives inside the safe area.
  const owner0 = L(1570, 1250 + M3 + 30 + half(ownerName, 340));
  const shift0 = 960 - (left0 + right0) / 2,
    shift1 = L(-30, 960 - (FL0 + owner0 + half(ownerName, 340)) / 2),
    shift = mix(shift0, shift1, glide(t, tell - L(0.1, 0.8), shift1 - shift0));
  const kxs = [710, 980, 1250].map((x) => x + shift),
    px = 2 * kxs[0] - kxs[1],
    ox = owner0 + shift;
  const lines6 = Math.max(
    ...names.map((v) => wrapName(v, 300).length),
    wrapName(finderName, FW6).length,
  );
  const fy = py - 15 * 1.2 * 2.15 - PAD,
    fh = NY6 + blockHeight(lines6) + row6 + PAD - fy;
  const left = left0 + shift,
    right = right0 + shift,
    FC = (left + right) / 2;
  {
    const emergencyName = L("紧急情况下", "Emergency"),
      ex = FC - measure(emergencyName) / 2,
      eq = named(t, emergency) * six;
    const ey = fy - NAME_GAP - labelSize(LABEL) / 2 - labelSize(LABEL) * LEADING;
    clock(ex - NAME_GAP - 18, ey, 18, {
      hand: (voiceTime(t) * 0.6) % 1,
      color: P.unknown,
      alpha: eq,
    });
    nameText(emergencyName, FC, ey, { alpha: eq });
  }
  box(left, fy, right - left, fh, { stroke: P.line, alpha: place, radius: 20, width: 3.5 });
  nameText(L("在自己权限内控制影响", "Contains it within their authority"), FC, fy - NAME_GAP, {
    valign: "bottom",
    color: P.authority,
    alpha: six * named(t, contain),
  });
  // The path applies when the incident threatens harm: the condition stands beneath the frame, centred on the frame
  // as its headings are, as two names on one line, each arriving on its own words (the threats to data and
  // production, then the rest), so its last words are never read seconds before they are said.
  const threat = cue(s, "威胁到", "threatens");
  const condition = en
    ? ["Threatens data, production,", "downstream use or compliance"]
    : ["威胁到数据、生产、", "下游或合规"];
  const conditionAts = [threat, cueFrom(s, "下游或合规", "downstream use", threat)],
    space = en ? measure(" ", NOTE) : 0;
  const headW = measure(condition[0], NOTE) + space,
    conditionX = FC - (headW + measure(condition[1], NOTE)) / 2;
  const conditionBottom = Math.max(
    ...condition.map(
      (v, k) =>
        nameText(v, conditionX + k * headW, fy + fh + NAME_GAP, {
          align: "left",
          valign: "top",
          size: NOTE,
          color: P.muted,
          alpha: six * named(t, conditionAts[k]),
        }).bottom,
    ),
  );
  kinds.forEach((at, i) => {
    const kx = kxs[i],
      q = ramp(t, at - 0.15, 0.4) * six,
      lit = speaking(t, kinds, i),
      tone = blend(P.unknown, P.evidence, held6);
    dot(kx, KY, 8 + 2 * lit, { color: P.unknown, alpha: q });
    ring(kx, KY, 26, { color: tone, alpha: q, width: 3 });
    // The incident spreads in pulses beyond its ring until it is contained; each pulse grows out of the ring at no
    // width, its ink rising with its width as a beat's does, and thins as it widens, so it never stands out at once at
    // the ring's edge.
    const wave = (voiceTime(Math.min(t, contain - 0.15)) * 0.8 + i / 3) % 1,
      swell = clamp(wave / 0.15);
    ring(kx, KY, 26 + 24 * wave, {
      color: P.unknown,
      alpha: q * swell * (1 - wave) * 0.7 * (1 - held6),
      width: 2 * swell,
    });
    const lower = en && i !== 1;
    if (lower) line(kx, KY + 32, kx, NY6 + row6 - 6, { alpha: q, width: 2 });
    nameText(names[i], kx, NY6 + (lower ? row6 : 0), {
      valign: "top",
      width: 300,
      alpha: six * listIn(t, kinds, i),
      set: "kinds",
    });
  });
  // The finder stands inside the frame at its left and the owner beyond the frame, each named under them, and the link
  // from the finder runs down from under the finder's name out of the frame, under it, and up to under the owner's.
  const fd = ramp(t, finder - 0.15, 0.4) * six;
  person(px, py, { alpha: fd, size: 1.2 });
  const finderBlock = nameText(finderName, px, NY6, {
    valign: "top",
    width: FW6,
    alpha: six * named(t, finder),
  });
  const ow = ramp(t, tell - 0.15, 0.4) * six;
  person(ox, py, { alpha: ow, color: P.authority, size: 1.2 });
  const ownerBlock = nameText(ownerName, ox, NY6, {
    valign: "top",
    width: 340,
    color: P.authority,
    alpha: six * named(t, tell),
  });
  // The link runs under the condition with clear room, so it never underlines it. It is one way, down, across and up
  // in quarter turns, one stroke. Drawn at the tip pace on the words that bring the owner it would still be drawing
  // when the thought ends, so it stands whole from the stage's cut and comes in with the owner, on those words.
  const lowY = conditionBottom + 18;
  link(px, finderBlock.bottom + 12, ox, ownerBlock.bottom + 12, {
    route: "vhv",
    mid: lowY,
    alpha: ow,
    width: 2.5,
  });
}

/* Stage 6: the owner of the affected work at the head of the response's tree. */
export function s29Response(s, t, ownerLeads, seven) {
  const [keep, impact] = cues(s, [
    ["保留查明影响", "preserves the inputs"],
    ["查明影响", "establish the impact"],
  ]);
  const [needAt, escAt] = cues(s, [
    ["需要更多权限时", "for any further permission"],
    ["上报决策负责人", "escalate"],
  ]);
  const kept = en ? keep : cue(s, "输入和版本", "");
  // The tree stands where it centres on its own until the decision owner is named, and then moves right, the decision
  // owner standing at their place on the left, until the whole stage centres.
  const OPEN = L(90, 100),
    wide = OPEN * soon(t, escAt - 0.1, 0.8);
  const lower = en ? 30 : 0,
    ox = 960 + wide,
    oy = 360 + lower,
    sy = 525 + lower,
    by = 610 + lower,
    xs = [640 + wide, 1280 + wide],
    ly = 730 + lower;
  person(ox, oy, { alpha: seven, color: P.authority, size: 1.3 });
  // The owner's role, each part on its own words. The Chinese role is its caption's whole line, so it names what the
  // owner does by its key word, 接手, on the words 接手应对.
  const [role, roleAts] = en
    ? [
        ["Owner of the affected work", " sees the response through"],
        [ownerLeads, cue(s, "", "sees the response through")],
      ]
    : [
        ["受影响工作的负责人", "接手"],
        [ownerLeads, cue(s, "接手应对", "")],
      ];
  growName(t, role, roleAts, ox + 60, oy - 6, {
    width: 520,
    valign: "middle",
    color: P.authority,
    alpha: seven,
  });
  // The affected work stands far enough left of the kept versions that its name keeps clear of them, and the versions'
  // name stands on the line of the work's name. Its page is drawn as 23's pages are, its ruled rows in one stroke, so
  // they read as the page's text rather than as rows each waiting for a name.
  const hit = seven * ramp(t, ownerLeads + STAGE_CUT, 0.3),
    WX = 700 + wide,
    WY = 440 + lower,
    workNameY = WY + 60 + NAME_GAP + labelSize(LABEL) / 2;
  s23Page(WX - 50, WY - 60, 100, 120, { alpha: hit, rows: 3 });
  // The owner takes the affected work in hand on the words that say they see the response through.
  link(ox - 32, oy + 44, WX + 58, WY, {
    route: "vh",
    color: P.authority,
    alpha: hit,
    draw: { t, at: roleAts[1] + 0.05 },
    width: 2.5,
  });
  nameText(L("受影响工作", "The affected work"), WX, WY + 60 + NAME_GAP, {
    valign: "top",
    alpha: hit,
  });
  ring(WX + 50, WY - 60, 14, { color: P.unknown, alpha: hit, width: 2.5 });
  dot(WX + 50, WY - 60, 5, { color: P.unknown, alpha: hit });
  // The kept inputs and versions: a stack of three versions, each a dated copy of the input, hung from the owner.
  // The Chinese stem runs on to the branches' foot, and quickly, since the first use follows its keeping words at once.
  const kp = ramp(t, kept - 0.15, 0.4) * seven;
  link(ox, oy + 62, ox, en ? sy - 60 : sy + 42, {
    alpha: seven * ramp(t, keep - 0.15, 0.2),
    draw: { t, at: keep - 0.15 },
    end: false,
  });
  [2, 1, 0].forEach((k) =>
    box(ox - 60 + k * 12, sy - 46 - k * 12, 104, 76, {
      fill: P.row,
      stroke: k ? P.line : P.ink,
      alpha: kp,
      radius: 6,
    }),
  );
  [0, 1, 2].forEach((k) =>
    line(ox - 44, sy - 22 + k * 16, ox + 22 - k * 14, sy - 22 + k * 16, {
      color: P.evidence,
      alpha: kp,
      width: 3,
    }),
  );
  nameText(L("输入和版本", "Inputs and versions kept"), ox + 68 + NAME_GAP + 12, workNameY, {
    align: "left",
    alpha: seven * named(t, kept),
  });
  const uses = [impact, cue(s, "核验修正", "verify a correction")],
    names = en ? ["Establish the impact", "Verify a correction"] : ["查明影响", "核验修正"];
  uses.forEach((at, i) => {
    const q = ramp(t, at - 0.15, 0.4) * seven,
      x = xs[i];
    link(ox, sy + 42, x, ly - 34, {
      route: "vhv",
      mid: by + 40,
      r: 18,
      alpha: seven * ramp(t, at - 0.15, 0.2),
      draw: { t, at: at - 0.15 },
      end: false,
    });
    if (i === 0)
      [0, 1, 2].forEach((k) =>
        ring(x, ly, 8 + k * 9, {
          color: P.unknown,
          alpha: q * mix(1, restMark(P.unknown), k / 2),
          width: 2,
        }),
      );
    else check(x, ly + 2, 26, { color: P.evidence, alpha: q, draw: { t, at: at - 0.05 } });
  });
  railNames(names, xs, ly + 8, {
    wrap: 400,
    alpha: (i) => seven * listIn(t, uses, i),
    set: "uses",
  });
  // The decision owner stands a size smaller than the owner, so the figure reads as one person, head and shoulders,
  // which its one name names.
  const DX = 420 + OPEN,
    up = ramp(t, escAt - 0.15, 0.4) * seven;
  person(DX, oy, { alpha: up, color: P.authority, size: 1.1 });
  nameText(L("决策负责人", "Decision owner"), DX, oy + 44 + NAME_GAP, {
    valign: "top",
    color: P.authority,
    alpha: seven * named(t, escAt),
  });
  link(ox - 52, oy - 10, DX + 60, oy - 10, {
    color: P.authority,
    alpha: up,
    draw: { t, at: escAt - 0.05 },
    width: 2.5,
  });
  // The further permission is named over the escalation's way as it stands once the tree has moved; Chinese names it
  // before the escalation.
  nameText(
    L("需要更多权限时", "For any further permission"),
    (960 + OPEN - 52 + DX + 60) / 2,
    oy - 10 - NAME_GAP,
    { valign: "bottom", width: 380, color: P.authority, alpha: seven * named(t, needAt) },
  );
}

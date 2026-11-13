/* 24's meeting: the table whose one output is a decision, and the two gates on the meeting's way. */

import { ctx } from "../../canvas.js";
import { loopPhase, pass, since } from "../../drawing/flows.js";
import { restMark } from "../../drawing/levels.js";
import { link } from "../../drawing/links.js";
import { box, dot, line, measure, stroke } from "../../drawing/strokes.js";
import { check, documentIcon, person, ring, token } from "../../drawing/symbols.js";
import { listIn, named, speaking } from "../../naming/lists.js";
import { NAME_GAP, nameText } from "../../naming/names.js";
import { railNames } from "../../naming/placement.js";
import { rejectedName } from "../../naming/rejected.js";
import { P } from "../../palette.js";
import { L, en } from "../../timeline.js";
import { cue } from "../../timing/cues.js";
import { ease, mix, ramp, soon } from "../../timing/easing.js";
import { glide } from "../../timing/pace.js";
import { voiceTime } from "../../timing/pauses.js";

/* Stage 1: the meeting as a table with its people, its decision linked out and the way on to a transcript closed. */
export function s24Meeting(t, meet, decisions, transcripts, one) {
  // The stage's extent: the table's seats reach 92 px left of its centre; the decision's and the transcript's names end
  // it at the right.
  const right =
    800 +
    340 +
    Math.max(
      160 + NAME_GAP + measure(L("决定", "Decisions")),
      125 + NAME_GAP + measure(L("流水账", "Transcripts")) + 16 + 26,
    );
  const sh = 960 - (800 - 92 + right) / 2;
  const mx = 800 + sh,
    my = 470,
    jx = mx + 240,
    cx = mx + 340;
  ring(mx, my, 56, { color: P.line, alpha: one, width: 2.5 });
  for (let k = 0; k < 6; k++) {
    const a = Math.PI / 6 + (k * Math.PI) / 3;
    person(mx + Math.cos(a) * 78, my + Math.sin(a) * 78, { alpha: one, size: 0.62 });
  }
  nameText(L("会议", "Meetings"), mx, my + 96 + NAME_GAP, {
    valign: "top",
    alpha: one * named(t, meet),
  });
  // The decision: a card with a check, reached by the meeting's link.
  const dq = ramp(t, decisions - 0.15, 0.4) * one,
    reach = { t, at: decisions - 0.1 };
  box(cx, 310, 160, 100, { fill: P.row, stroke: P.authority, alpha: dq, radius: 12, width: 2.5 });
  check(cx + 80, 362, 40, { color: P.authority, alpha: dq });
  link(mx + 100, my, cx - 10, 360, {
    route: "hvh",
    mid: jx,
    alpha: one,
    draw: reach,
    flowing: since(t, decisions + 0.5),
  });
  nameText(L("决定", "Decisions"), cx + 160 + NAME_GAP, 360, {
    align: "left",
    color: P.authority,
    alpha: one * named(t, decisions),
  });
  // The transcript: its branch drops from the same junction and stops at a bar.
  const tq = ramp(t, transcripts - 0.15, 0.4) * one,
    drop = soon(t, transcripts - 0.05, 0.5);
  documentIcon(cx + 35, 522, 90, 116, { alpha: tq * 0.7, rows: 5, stroke: P.muted });
  link(jx, my, cx + 25, 580, {
    route: "vh",
    color: P.unknown,
    alpha: tq,
    upto: 0.26 * drop,
    end: false,
    dash: [8, 8],
  });
  line(jx - 22, 532, jx + 22, 532, {
    color: P.unknown,
    alpha: ramp(t, transcripts + 0.35, 0.3) * one,
    width: 4,
  });
  rejectedName(L("流水账", "Transcripts"), cx + 125 + NAME_GAP, 580, {
    align: "left",
    alpha: one * named(t, transcripts),
    mark: ramp(t, transcripts + 0.35, 0.35),
  });
}

/* Stage 2: the meeting's way as a rail with two gates, each on the words that name it. */
export function s24Gates(s, t, align, alignAt, defs, compare, options, split, locate, layers, two) {
  const layerNames = en
    ? ["Facts", "Inference", "Values", "Resources", "Authority"]
    : ["事实", "推论", "价值取向", "资源", "权限"];
  // Until the layers come the way, from x 520 to 1270, and its name hanging at its left stand centred; the finished
  // stage is centred on its extent, from that name to the layers' longest name.
  const left = 520 - NAME_GAP - measure(L("开会", "Meetings"));
  const sh0 = 960 - (left + 1270) / 2,
    sh1 = 960 - (left + 1480 + 12 + NAME_GAP + Math.max(...layerNames.map((v) => measure(v)))) / 2;
  const sh = mix(sh0, sh1, glide(t, Math.max(locate, split) + 0.05, sh1 - sh0));
  // The way ends far enough from the probe's stem that the disagreement's name, set just above the split, keeps clear
  // of it, and its baseline stands well clear of the layers' names. The English gates stand 365 px apart, so the first
  // gate's name stands whole on one line, clear of the second's by the headless canvas's wider estimate too.
  const y = 500,
    x0 = 520 + sh,
    g1 = L(790, 755) + sh,
    g2 = L(1090, 1120) + sh,
    sx = 1270 + sh,
    CX = 1480 + sh,
    ys = [290, 395, 500, 605, 710];
  // The meeting's way, named at its start as the stage opens.
  line(x0, y, sx, y, { color: P.line, alpha: two, width: 2.5 });
  nameText(L("开会", "Meetings"), x0 - NAME_GAP, y, { align: "right", alpha: two });
  // A gate is one mark: its two leaves open apart on their words.
  const gateAt = (x, at, open, color) => {
    const o = ease(open) * 48,
      q = two * ramp(t, at - 0.15, 0.4);
    stroke(
      () => {
        ctx.moveTo(x, y - 64 - o);
        ctx.lineTo(x, y - 6 - o);
        ctx.moveTo(x, y + 6 + o);
        ctx.lineTo(x, y + 64 + o);
      },
      { color, alpha: q, width: 5 },
    );
  };
  gateAt(g1, alignAt, ramp(t, defs + 0.05, 0.45), P.evidence);
  gateAt(g2, compare, ramp(t, options + 0.05, 0.45), P.ink);
  railNames(
    en ? [["Align facts and definitions"], "Comparing options"] : ["核对事实、统一定义", "比方案"],
    [g1, g2],
    y,
    {
      gap: 130,
      wrap: 280,
      alpha: (i) => two * named(t, [alignAt, compare][i]),
      color: (i) => [P.evidence, P.ink][i],
    },
  );
  // The question runs along the way as far as the gates let it, one point at a time at the film's flow pace, passing
  // each gate once it opens: a point leaves by its size where the way ends; where the way ends a disagreement stands
  // split in two. The way's reach extends past each opened gate as a glide in voice time, so a point that has left at
  // the closed gate comes back beyond it by its size rather than at once.
  const reach = mix(
    mix(g1 - 30, g2 - 30, glide(t, defs + 0.25, g2 - g1)),
    sx - 26,
    glide(t, options + 0.25, sx - g2 + 4),
  );
  const full = sx - 26 - x0 - 10,
    way = reach - x0 - 10,
    run = loopPhase(since(t, align), full),
    sp = ramp(t, split + 0.05, 0.4);
  // The point fades out before the split, so it has left before the stage eases left and never reverses on screen.
  if (run !== null && run * full < way)
    dot(x0 + 10 + run * full, y, 9 * pass((run * full) / way), {
      color: P.evidence,
      alpha: two * (1 - ramp(t, split - 0.25, 0.3)),
    });
  if (sp > 0)
    [-1, 1].forEach((k) => token(sx, y + k * 13, { color: P.unknown, alpha: two * sp, r: 11 }));
  // The disagreement is named where the way ends as the words turn to it ("and locate any disagreement", in English).
  nameText(L("分歧", "Disagreement"), sx, y - 50, {
    valign: "bottom",
    alpha: two * named(t, en ? cue(s, "", "and locate") : split),
  });
  // Each of the five layers appears as it is named.
  ys.forEach((ly, i) => {
    const on = ramp(t, layers[i] - 0.15, 0.4) * two,
      lit = speaking(t, layers, i);
    dot(CX, ly, 7 + 2 * lit, { color: P.ink, alpha: on });
    if (lit > 0)
      ring(CX, ly, 20, {
        color: P.unknown,
        alpha: lit * restMark(P.unknown, 0.6) * two,
        width: 2,
      });
    nameText(layerNames[i], CX + 12 + NAME_GAP, ly, {
      align: "left",
      alpha: two * listIn(t, layers, i),
      set: "layers",
    });
  });
  // The probe searches the layers from the split: a branch reaches each layer as it is named, the branch being said
  // lit and the ones already searched receding. A branch grows in voice time, so the last one, named as the thought
  // ends, rests in the quiet and finishes on the next words.
  layers.forEach((at, i) => {
    const from = i ? at + 0.05 : Math.max(locate, split, at - 0.15) + 0.05,
      grown = voiceTime(t) - voiceTime(from);
    link(sx + 22, y, CX - 26, ys[i], {
      route: "hvh",
      mid: CX - 50,
      color: P.unknown,
      alpha: two * ease(grown / 0.3) * mix(restMark(P.unknown), 1, speaking(t, layers, i)),
      draw: { t, at: from },
    });
  });
}

/* 19's first stages: the kinds of work a member delegates to an Agent, what the Agent extends within the delegated
 * boundary, what it cannot grant, and a clear boundary against a pile of context. */

import { ctx } from "../../canvas.js";
import { since } from "../../drawing/flows.js";
import { link } from "../../drawing/links.js";
import { s17Page } from "../../drawing/pages.js";
import { box, dot, labelSize, line, measure } from "../../drawing/strokes.js";
import { agent, check, lock, person, ring, seal, stopSign } from "../../drawing/symbols.js";
import { listIn, listLevel, named, speaking } from "../../naming/lists.js";
import { LEADING, NAME_GAP, nameText, wrapName } from "../../naming/names.js";
import { blockHeight } from "../../naming/parts.js";
import { CONTENT_CY, stackTops } from "../../naming/placement.js";
import { rejectedName } from "../../naming/rejected.js";
import { LABEL, P } from "../../palette.js";
import { L, en } from "../../timeline.js";
import { cue, cues } from "../../timing/cues.js";
import { mix, ramp, soon } from "../../timing/easing.js";
import { glide, pacedTo } from "../../timing/pace.js";
import { STAGE_CUT } from "../../timing/stages.js";
import { s19Frame } from "./boundary.js";

/* Stage 1: the kinds of work in one column beside the member, joined to the Agent by one link. */
export function s19Delegation(
  s,
  t,
  MX,
  MY,
  memberLeft,
  em,
  ACTOR,
  snap,
  kinds,
  settleAt,
  toAgent,
  agentAt,
  g1,
) {
  const names = en ? ["Search", "Analysis", "Drafting"] : ["查资料", "分析", "起草"];
  const CX = 1080,
    wide = Math.max(...names.map((v) => measure(v, LABEL))),
    group = (memberLeft + CX + wide) / 2;
  const lead = (960 - group) * (1 - glide(t, toAgent + 0.05, 960 - group)),
    solo = (group - MX) * (1 - glide(t, settleAt + 0.05, group - MX));
  const ax = 1400,
    ay = 500,
    cx = CX + lead,
    mx = MX + lead;
  ctx.save();
  ctx.translate(solo, 0);
  person(mx, MY, { alpha: g1, color: P.authority, size: 1.7 });
  nameText(L("成员", "Member"), mx, MY + 38 + NAME_GAP, {
    valign: "top",
    color: P.authority,
    alpha: g1 * named(t, cue(s, "成员", "members")),
  });
  ctx.restore();
  const tops0 = stackTops(
      names.map(() => blockHeight(1)),
      CONTENT_CY,
      80,
    ),
    lift = snap(tops0.map((v) => v + em / 2));
  const tops = tops0.map((v) => v + lift),
    mid = (i) => tops[i] + labelSize(LABEL) / 2;
  names.forEach((v, i) => {
    const y = mid(i),
      on = ramp(t, kinds[i] - 0.15, 0.4),
      lit = speaking(t, kinds, i);
    box(cx - 80, y - 21, 56, 42, {
      fill: P.row,
      stroke: P.muted,
      alpha: g1 * on,
      radius: 7,
      width: 2,
    });
    if (lit > 0)
      box(cx - 80, y - 21, 56, 42, { stroke: P.ink, alpha: g1 * lit, radius: 7, width: 2.5 });
    nameText(v, cx, y, { align: "left", alpha: g1 * listIn(t, kinds, i), set: "work" });
  });
  // The handover: a bracket closes the column and one link runs from it to the Agent, a point travelling along it.
  const bx = cx + wide + 34,
    hand = ramp(t, toAgent - 0.1, 0.3) * g1,
    go = soon(t, toAgent - 0.05, 0.7);
  line(bx, mid(0), bx, mid(names.length - 1), { color: P.line, alpha: hand, width: 2 });
  link(bx, CONTENT_CY, ax - 48, ay, { alpha: hand, upto: go, flowing: since(t, toAgent + 0.65) });
  const here = ramp(t, agentAt - 0.15, 0.4);
  agent(ax, ay, { alpha: here * g1, size: 1.8 });
  nameText(L("智能体", "Agent"), ax, ACTOR, {
    valign: "top",
    color: P.evidence,
    alpha: g1 * named(t, agentAt),
  });
}

/* Stage 2: the delegated boundary opening round the Agent, and what the Agent extends within it. */
export function s19Extends(
  t,
  within,
  extend,
  MX,
  MY,
  FX,
  small,
  em,
  ACTOR,
  snap,
  abilities,
  kx,
  widthFor,
  g2,
) {
  const names = en ? ["Investigate", "Reason about", "Do"] : ["调查", "推理", "动手"];
  const ys0 = stackTops(
      names.map(() => blockHeight(1)),
      CONTENT_CY,
      34,
    ).map((top) => top + em / 2),
    ys = ys0.map((y) => y + snap(ys0));
  person(MX, MY, { alpha: g2, color: P.authority, size: 1.7 });
  nameText(L("成员", "Member"), MX, MY + 38 + NAME_GAP, {
    valign: "top",
    color: P.authority,
    alpha: g2,
  });
  // The waiting frame is a 240 px square, small enough to read as a card, and stands at its full height, so its name
  // keeps its line as the frame widens. It waits at the far end of where the boundary will stand, its right edge where
  // the frame's will be, so the member and the card balance the stage, and the frame opens toward the member.
  const full = widthFor(names.map((v) => measure(v, LABEL)));
  const f = s19Frame(t, FX, small, full, ys, abilities, [380, 620], [380, 620], {
      middle: 240,
      toward: (full - 240) / 2,
    }),
    on = ramp(t, Math.min(within, extend) - 0.15, 0.4) * g2;
  box(f.x, f.y, f.w, f.h, { stroke: P.evidence, alpha: on, radius: 22, width: 2.5 });
  nameText(L("委托范围", "A delegated boundary"), f.x, f.y - NAME_GAP, {
    align: "left",
    valign: "bottom",
    color: P.evidence,
    alpha: g2 * named(t, within),
  });
  // The member's link to the boundary carries one flow through stages 2 to 4, timed by its length once the frame
  // stands at its place.
  link(MX + 40, 500, f.x - 12, 500, {
    alpha: g2,
    flowing: since(t, Math.min(within, extend) + STAGE_CUT),
    span: FX - MX - 52,
  });
  agent(f.ax, 490, { alpha: g2, size: 1.6 });
  nameText(L("智能体", "Agent"), f.ax, ACTOR, { valign: "top", color: P.evidence, alpha: g2 });
  names.forEach((v, i) => {
    const y = ys[i],
      q = ramp(t, abilities[i] - 0.15, 0.4) * g2,
      lit = speaking(t, abilities, i);
    if (i === 0) {
      ring(kx - 4, y - 4, 9, { alpha: q, width: 2.5 });
      line(kx + 3, y + 3, kx + 11, y + 11, { color: P.evidence, alpha: q, width: 3 });
    }
    if (i === 1) {
      dot(kx - 9, y + 6, 4.5, { alpha: q });
      dot(kx + 9, y - 6, 4.5, { alpha: q });
      line(kx - 9, y + 6, kx + 9, y - 6, { color: P.evidence, alpha: q, width: 2 });
    }
    if (i === 2) check(kx, y, 18, { alpha: q });
    if (lit > 0) ring(kx, y, 20, { color: P.evidence, alpha: g2 * lit, width: 2.5 });
    nameText(v, kx + 20 + NAME_GAP, y, {
      align: "left",
      color: P.evidence,
      alpha: g2 * listIn(t, abilities, i),
      set: "abilities",
    });
  });
}

/* Stage 3: the Agent's own column inside the boundary, and the authorization and commitments it cannot grant. */
export function s19Cannot(
  s,
  t,
  within,
  extend,
  MX,
  MY,
  FX,
  small,
  em,
  ACTOR,
  snap,
  refused,
  RW,
  lean19,
  widthFor,
  g3,
) {
  person(MX, MY, { alpha: g3, color: P.authority, size: 1.7 });
  nameText(L("成员", "Member"), MX, MY + 38 + NAME_GAP, {
    valign: "top",
    color: P.authority,
    alpha: g3,
  });
  // The rows each edition says: executes, reasons, the refused authorization and the refused commitment in Chinese;
  // the two refusals in English. The frame opens about the Agent and widens to each row as it arrives.
  const said = en ? [2, 3] : [0, 1, 2, 3],
    promise = L("替人作出承诺", "Commitments for people");
  const does = en
    ? cues(s, [
        ["", "organizational authorization"],
        ["", "make commitments for people"],
      ])
    : cues(s, [
        ["智能体能执行", ""],
        ["能推理", ""],
        ["给不了组织的授权", ""],
        ["替人作出承诺", ""],
      ]);
  const ys0 = stackTops(
      said.map(() => blockHeight(1)),
      CONTENT_CY,
      34,
    ).map((top) => top + em / 2),
    ys = ys0.map((y) => y + snap(ys0));
  // The two refusals' crosses stand in one column after the longer of their names, so each refusal's row reaches it.
  const refusals = Math.max(
    ...wrapName(refused, RW).map((v) => measure(v, LABEL)),
    measure(promise, LABEL),
  );
  const widths = [
    ...(en ? [] : ["执行", "推理"].map((v) => measure(v, LABEL))),
    refusals + 16 + 26,
    refusals + 16 + 26,
  ];
  // Each widening is made at the tip pace and is whole 0.1 s into its row's words, as its name comes.
  const targets = widths.map((_, k) => Math.max(small, widthFor(widths.slice(0, k + 1))));
  const grown = (tt) =>
    targets.reduce((w, to, k) => {
      const d = to - (k ? targets[k - 1] : small);
      return w + d * pacedTo(tt, does[k] + 0.1, d, 0.4);
    }, small);
  // As the frame widens to take the refused names whole, it and the Agent ease left, 83 px in Chinese and 150 in
  // English, so the stage stays centred.
  const fx3 = FX - lean19 * glide(t, does[0] - 0.3, lean19),
    ax3 = fx3 + small / 2,
    kx3 = fx3 + 210;
  const f = s19Frame(t, fx3, small, grown, ys, does, [365, 635], [380, 620]);
  box(f.x, f.y, f.w, f.h, { stroke: P.evidence, alpha: g3, radius: 22, width: 2.5 });
  nameText(L("委托范围", "A delegated boundary"), fx3, f.y - NAME_GAP, {
    align: "left",
    valign: "bottom",
    color: P.evidence,
    alpha: g3,
  });
  link(MX + 40, 500, fx3 - 12, 500, {
    alpha: g3,
    flowing: since(t, Math.min(within, extend) + STAGE_CUT),
    span: FX - lean19 - MX - 52,
  });
  agent(ax3, 490, { alpha: g3, size: 1.6 });
  nameText(L("智能体", "Agent"), ax3, ACTOR, { valign: "top", color: P.evidence, alpha: g3 });
  said.forEach((i, k) => {
    const y = ys[k],
      q = ramp(t, does[k] - 0.15, 0.4) * g3;
    if (i === 0) check(kx3, y, 18, { alpha: q });
    if (i === 1) {
      dot(kx3 - 9, y + 6, 4.5, { alpha: q });
      dot(kx3 + 9, y - 6, 4.5, { alpha: q });
      line(kx3 - 9, y + 6, kx3 + 9, y - 6, { color: P.evidence, alpha: q, width: 2 });
    }
    if (i >= 2) seal(kx3, y, 16, { alpha: q * 0.8, hollow: true });
    const at = ramp(t, does[k] - 0.15, 0.4) * listLevel(t, does, k);
    if (i < 2)
      nameText(["执行", "推理"][i], kx3 + 20 + NAME_GAP, y, {
        align: "left",
        color: P.evidence,
        alpha: g3 * at,
        set: "agent",
      });
    else
      rejectedName(i === 2 ? refused : promise, kx3 + 20 + NAME_GAP, y, {
        align: "left",
        width: RW,
        alpha: g3 * ramp(t, does[k] - 0.15, 0.4),
        mark: ramp(t, does[k] + 0.4, 0.4),
        markLeft: kx3 + 20 + NAME_GAP + refusals + 16,
      });
  });
}

/* Stage 4: the pile of context under the member refused, and the clear boundary in its place. */
export function s19ClearBoundary(
  s,
  t,
  within,
  extend,
  MX,
  MY,
  FX,
  small,
  em,
  ACTOR,
  snap,
  lean19,
  boundary,
  pile,
  parts,
  g4,
) {
  // Each part is named by its spoken words; the last part's caption line begins with 以及, so its name does not
  // repeat that line whole.
  const names = en
    ? [
        "Purpose and scope",
        "The deliverable",
        "Limits and permissions",
        "How the result will be accepted",
        "When to stop and hand off",
      ]
    : ["目的和范围", "交什么", "限制和权限", "怎么验收", "什么时候必须停下交接"];
  // A part wider than the column wraps onto a second line, and each part stands centred on its own row.
  const PW = 360,
    blocks = names.map((v) => wrapName(v, PW)),
    heights = blocks.map((v) => blockHeight(v.length));
  const tops = stackTops(heights, CONTENT_CY, 40),
    lift = snap(tops.flatMap((top, i) => blocks[i].map((_, k) => top + em / 2 + k * em * LEADING)));
  const ys = tops.map((top, i) => top + lift + heights[i] / 2);
  const fw = 210 + 20 + NAME_GAP + Math.max(...blocks.flat().map((v) => measure(v, LABEL))) + 40;
  person(MX, MY, { alpha: g4, color: P.authority, size: 1.7 });
  nameText(L("成员", "Member"), MX, MY + 38 + NAME_GAP, {
    valign: "top",
    color: P.authority,
    alpha: g4,
  });
  // The pile of context stays with the member, refused. In Chinese it is set down on the verb that hands it over, just
  // before it is named.
  const heap = ramp(t, Math.min(pile, cue(s, "只给", "a pile of context")) - 0.15, 0.4) * g4;
  // The pile stands centred under the member, clear of its name, and is named centred under itself with its cross.
  for (let k = 0; k < 4; k++)
    box(MX - 64 + k * 8, 648 - k * 10, 104, 64, {
      fill: P.row,
      stroke: P.muted,
      alpha: heap,
      radius: 6,
    });
  rejectedName(L("一堆背景材料", "A pile of context"), MX, 712 + NAME_GAP, {
    valign: "top",
    alpha: g4 * named(t, pile),
    mark: ramp(t, pile + 0.45, 0.4),
  });
  // The waiting frame stands at its full top, so its name never moves up across the first part, and small enough to
  // read as a card: 200 px wide in Chinese, 160 px in English, whose longer name stands centred over it; the card
  // stands 50 px right of the full frame's middle, so the member, the pile and the card stay balanced.
  const top4 = Math.min(330, ys[0] - 45);
  // The full frame stands where the finished stage centres: from the stage's lit left edge, the pile's name in Chinese and
  // the member's in English, measured at 465 and 446 px, to the frame's right edge.
  const FX4 = 1920 - L(465, 446) - fw,
    kx4 = FX4 + 210,
    f = s19Frame(t, FX4, small, fw, ys, parts, [top4, 615], [330, 660], {
      middle: L(200, 160),
      from: boundary + STAGE_CUT,
      toward: 50 + FX - FX4,
      opens: FX - FX4 - lean19,
    });
  link(MX + 40, 500, f.x - 12, 500, {
    alpha: g4,
    flowing: since(t, Math.min(within, extend) + STAGE_CUT),
    span: FX - MX - 52,
  });
  box(f.x, f.y, f.w, f.h, {
    stroke: P.evidence,
    alpha: g4,
    radius: 22,
    width: mix(2.5, 4, ramp(t, boundary + 0.05, 0.3) * (1 - ramp(t, boundary + 1.4, 0.5))),
  });
  // The frame's name stands at its left edge; over a waiting frame narrower than the name (the English) it stands
  // centred, so it overhangs neither side alone, and it reaches the edge as the frame widens past it.
  const clear = L("划清边界", "A clear boundary");
  nameText(clear, f.x + Math.min(0, (f.w - measure(clear)) / 2), f.y - NAME_GAP, {
    align: "left",
    valign: "bottom",
    color: P.evidence,
    alpha: g4,
  });
  agent(f.ax, 490, { alpha: g4, size: 1.6 });
  nameText(L("智能体", "Agent"), f.ax, ACTOR, { valign: "top", color: P.evidence, alpha: g4 });
  names.forEach((v, i) => {
    const y = ys[i],
      q = ramp(t, parts[i] - 0.15, 0.4) * g4,
      lit = speaking(t, parts, i);
    if (i === 0) {
      ring(kx4, y, 10, { alpha: q, width: 2.5 });
      dot(kx4, y, 3.5, { alpha: q });
    }
    if (i === 1) s17Page(kx4 - 9, y - 12, 18, 24, { alpha: q, rows: 2, stroke: P.evidence });
    if (i === 2) lock(kx4, y + 2, { alpha: q, color: P.evidence, size: 0.5 });
    if (i === 3) check(kx4, y, 18, { alpha: q });
    if (i === 4) stopSign(kx4, y, 11, { alpha: q });
    if (lit > 0) ring(kx4, y, 20, { color: P.evidence, alpha: g4 * lit, width: 2.5 });
    nameText(v, kx4 + 20 + NAME_GAP, y, {
      align: "left",
      width: PW,
      alpha: g4 * listIn(t, parts, i),
      set: "parts",
    });
  });
}

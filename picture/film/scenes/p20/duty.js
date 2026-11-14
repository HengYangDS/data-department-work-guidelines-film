/* 20's later stages: what the person who calls an Agent owns, what submitting assisted work means, the duty
 * delegation does not transfer, and the acceptor's examination. */

import { link } from "../../drawing/links.js";
import { s17Page } from "../../drawing/pages.js";
import { box, dot, labelSize, line, measure } from "../../drawing/strokes.js";
import { agent, check, person, ring, seal } from "../../drawing/symbols.js";
import { listIn, named, speaking } from "../../naming/lists.js";
import { NAME_GAP, nameText } from "../../naming/names.js";
import { blockHeight, growName, growTexts } from "../../naming/parts.js";
import { CONTENT_CY, railNames, stackTops } from "../../naming/placement.js";
import { rejectedName } from "../../naming/rejected.js";
import { NOTE } from "../../naming/terms.js";
import { LABEL, P } from "../../palette.js";
import { L, en } from "../../timeline.js";
import { cue, cueFrom } from "../../timing/cues.js";
import { clamp, mix, ramp } from "../../timing/easing.js";
import { drawShare, glide } from "../../timing/pace.js";
import { STAGE_CUT } from "../../timing/stages.js";

/* Stage 4: the caller and the Agent on one line, and what the caller owns of the Agent's work. */
export function s20Caller(s, t, caller, owned, g4) {
  // The English caller stands 80 px further right, so its name, whole on one line, keeps the stage about the centre;
  // its marks stand 204 px apart, so the two long names in the middle keep a clear 48 px between them.
  const px = L(380, 460),
    ax = 1540,
    y = 500,
    rail = 500,
    xs = en ? [694, 898, 1102, 1306] : [700, 900, 1100, 1300];
  person(px, y, { alpha: g4, color: P.authority, size: 1.7 });
  nameText(L("调用智能体的人", "The person who calls an Agent"), px, y + 38 + NAME_GAP, {
    valign: "top",
    width: 400,
    color: P.authority,
    alpha: g4,
  });
  agent(ax, y - 5, { alpha: g4, size: 1.8 });
  nameText(L("智能体", "Agent"), ax, y + 38 + NAME_GAP, {
    valign: "top",
    color: P.evidence,
    alpha: g4,
  });
  link(px + 56, rail - 5, ax - 52, rail - 5, { alpha: g4, end: false });
  xs.forEach((x, i) => {
    const q = ramp(t, owned[i] - 0.15, 0.4) * g4,
      lit = speaking(t, owned, i);
    dot(x, rail - 5, 16, { color: P.ground, alpha: q });
    dot(x, rail - 5, 16, { color: P.authority, alpha: q * 0.7, hollow: true, width: 2 });
    dot(x, rail - 5, 10, { color: P.authority, alpha: q });
    if (lit > 0) ring(x, rail - 5, 25, { color: P.authority, alpha: g4 * lit, width: 2 });
  });
  railNames(
    en
      ? ["Context", "Permissions", "Verification", "Result"]
      : ["背景材料", "权限", "核验", "结果"],
    xs,
    rail - 5,
    {
      side: -1,
      gap: NAME_GAP + 24,
      alpha: (i) => g4 * listIn(t, owned, i),
      color: () => P.authority,
      set: "owned",
    },
  );
  // The note under the rail is centred on all four marks and stands on its own word: the English says "owns" before
  // the marks arrive, so they fill in under it.
  nameText(L("负责", "Owns"), 1000, rail + 30, {
    valign: "top",
    color: P.muted,
    size: NOTE,
    alpha: g4 * named(t, cueFrom(s, "负责", "owns", caller)),
  });
}

/* Stage 5: the person addressed as you, and the Agent-assisted work they submit. */
export function s20Submitting(s, t, submit, vouched, g5) {
  // The caller's name gives way just before the words that address it as you, so the two never stand together. The
  // person and the work stand on one ground line, the page's foot, and their names hang from it on one line, a row
  // clear below the vouchers' last item rather than just off its line. The English vouchers stand 30 px further
  // left, so their longest name keeps well clear of the work's name on the line below rather than stepping into it.
  // The English work stands 26 px nearer the person, so the thought rests within 30 px of the centre once the person
  // is named you; the wider name before it, which leans the stage the other way for the second before, stands where
  // the last stage showed it.
  const px = 560,
    y = 500,
    wx = L(1340, 1314),
    kx = L(800, 770),
    youAt = cueFrom(s, "你", "you", submit),
    you = named(t, youAt);
  const foot = y + 100,
    nameTop = foot + NAME_GAP;
  person(px, foot - 38, { alpha: g5, color: P.authority, size: 1.7 });
  nameText(L("调用智能体的人", "The person who calls an Agent"), px, nameTop, {
    valign: "top",
    width: 400,
    color: P.authority,
    alpha: g5 * (1 - ramp(t, youAt - 0.45, 0.3)),
  });
  nameText(L("你", "You"), px, nameTop, { valign: "top", color: P.authority, alpha: g5 * you });
  s17Page(wx - 90, y - 130, 180, 230, { alpha: g5, rows: 4 });
  agent(wx + 90, y - 130, { alpha: g5, size: 1 });
  nameText(L("它帮忙做的工作", "Agent-assisted work"), wx, nameTop, {
    valign: "top",
    width: 300,
    alpha: g5 * named(t, submit),
  });
  const tops = stackTops(
      vouched.map(() => blockHeight(1)),
      CONTENT_CY - 10,
      72,
    ),
    mid = (i) => tops[i] + labelSize(LABEL) / 2;
  vouched.forEach((at, i) => {
    const yy = mid(i),
      q = ramp(t, at - 0.15, 0.4) * g5;
    check(kx, yy, 26, { color: P.authority, alpha: q, upto: clamp((t - at + 0.15) / 0.35) });
    if (speaking(t, vouched, i) > 0)
      ring(kx, yy, 26, { color: P.authority, alpha: g5 * speaking(t, vouched, i), width: 2.5 });
    nameText(
      en
        ? ["Understood", "Checked it", "Accept responsibility"][i]
        : ["看懂了", "检查过", "为后果负责"][i],
      kx + 26 + NAME_GAP,
      yy,
      { align: "left", alpha: g5 * listIn(t, vouched, i), set: "vouched" },
    );
  });
}

/* Stage 6: the person and the Agent across the way of the delegation, which carries the work and not the duty. */
export function s20Duty(s, t, transfers, dutyAt, g6) {
  const lx = 300,
    rx = 1080,
    fw = 540,
    move = glide(t, cue(s, "转移", "transfers") + 0.05, rx + 170 - lx - 330);
  person(lx + 120, 506, { alpha: g6, color: P.authority, size: 1.2 });
  agent(rx + fw - 120, 500, { alpha: g6, size: 1.3 });
  // The work travels along the delegation from the person's side to the Agent's, covering the way as it passes. The
  // way rises from the person, runs over both sides and comes down to the Agent, where it ends in a point.
  const wx = mix(lx + 330, rx + 170, move);
  link(lx + 120, 458, rx + fw - 120, 464, {
    route: "vhv",
    mid: 402,
    alpha: g6,
    draw: { t, at: transfers + 0.05 },
  });
  nameText(L("委托", "Delegation"), (lx + fw + rx) / 2, 330, {
    valign: "bottom",
    alpha: g6 * named(t, transfers),
  });
  s17Page(wx - 50, 340, 100, 124, { alpha: g6, rows: 3 });
  nameText(L("工作", "The work"), wx, 340 + 124 + NAME_GAP, {
    valign: "top",
    alpha: g6 * named(t, transfers),
  });
  // The duty stays: a seal on the person's side whose way across stops at the gap between the two sides.
  seal(lx + 330, 600, 30, { alpha: g6 * ramp(t, dutyAt - 0.15, 0.4) });
  link(lx + 370, 600, 954, 600, {
    color: P.unknown,
    alpha: g6 * ramp(t, dutyAt + 0.05, 0.3),
    upto: drawShare(t, dutyAt + 0.05, Math.abs(954 - (lx + 370)), 0.5),
    end: false,
    dash: [8, 8],
  });
  line(960, 572, 960, 628, {
    color: P.unknown,
    alpha: ramp(t, cueFrom(s, "还在", "duty", dutyAt) + 0.05, 0.25) * g6,
    width: 4,
  });
  nameText(L("这份责任", "That duty"), lx + 330, 600 + 30 + NAME_GAP, {
    valign: "top",
    color: P.authority,
    alpha: g6 * named(t, dutyAt),
  });
}

/* Stage 7: the acceptor over the actual work and evidence, and the work sent back while conditions are unmet. */
export function s20Acceptor(s, t, examine, acceptor, unmet, met, noExpand, steps, g7) {
  // The two branches' conditions are named on one line: the met branch's rail stands so its label shares the unmet
  // reason's first line under the boundary, clear below the line of names. The English rail stops 100 px left, short
  // of the 135 px that would centre the stage exactly, so its start keeps clear of the work's page, and its steps stand
  // 184 px apart from the last back, so the last two names keep a clear 48 px between them.
  const lead = L(210, 170) * (1 - glide(t, met + 0.05, L(210, 170)));
  const ax = 470 + lead,
    ay = 500,
    mx = 630 + lead,
    bx = 395 + lead,
    by = 430,
    bw = 320,
    bh = 190,
    ex = 960 + lead,
    ey = 500;
  const xs = [1220 - L(0, 8), 1400 - L(0, 4), 1580].map((x) => x - L(84, 100)),
    ry = by + bh + NAME_GAP + labelSize(LABEL) + NAME_GAP + 22;
  const returns = cueFrom(s, "退回", "goes back", unmet),
    memberAt = cueFrom(s, "成员", "the member", unmet);
  const nameY = ay + 30 + NAME_GAP;
  // The boundary stands on the words that name it, the boundary within which the work goes back.
  const bound = named(t, cueFrom(s, "委托范围", "the delegation boundary", unmet)) * g7;
  box(bx, by, bw, bh, {
    stroke: P.evidence,
    alpha: bound,
    radius: 22,
    width: mix(2.5, 4, ramp(t, noExpand + 0.05, 0.3)),
  });
  nameText(L("委托范围", "The delegation boundary"), bx, by - NAME_GAP, {
    align: "left",
    valign: "bottom",
    color: P.evidence,
    alpha: bound,
  });
  // The Agent comes in just after the cut, so it never reads as the last stage's person stepping across.
  const agentIn = g7 * ramp(t, acceptor + STAGE_CUT, 0.3);
  agent(ax, ay, { alpha: agentIn, size: 1.3 });
  nameText(L("智能体", "Agent"), ax, nameY, { valign: "top", color: P.evidence, alpha: agentIn });
  // The member the unmet work goes back to, beside the Agent within the boundary. It stands at the acceptor's size, an
  // icon's height, so its head and shoulders read as one figure under its name.
  person(mx, ay, { color: P.authority, size: 1.1, alpha: g7 * ramp(t, memberAt - 0.15, 0.4) });
  nameText(L("成员", "Member"), mx, nameY, {
    valign: "top",
    color: P.authority,
    alpha: g7 * named(t, memberAt),
  });
  // The work stands on the words that name it, under the acceptor's look, its foot on the line where the Agent and the
  // member stand, so the three are named on one line.
  const actual = cueFrom(s, "实际的工作", "actual work", examine),
    WT = nameY - NAME_GAP - 124;
  s17Page(ex - 50, WT, 100, 124, { alpha: g7 * ramp(t, actual - 0.15, 0.4), rows: 3 });
  // The acceptor examines from above the work.
  person(ex, 290, { alpha: g7, color: P.authority, size: 1.1 });
  nameText(L("验收人", "The acceptor"), ex + 17 + NAME_GAP, 290 - 8, {
    align: "left",
    color: P.authority,
    alpha: g7,
  });
  link(ex, 330, ex, WT - 10, {
    color: P.authority,
    alpha: g7 * ramp(t, examine + 0.05, 0.3),
    draw: { t, at: examine + 0.05 },
  });
  // The work's name stands on one line in each edition, clear above the met branch's name.
  nameText(L("实际的工作和证据", "The actual work and evidence"), ex, nameY, {
    valign: "top",
    width: L(300, 460),
    alpha: g7 * named(t, actual),
  });
  // Unmet conditions: a way back from the work to the member, drawn on the words that send it back, and the reason
  // beneath the boundary. It is a firm way, as the met branch's rail is, since both are conditions the acceptor applies.
  link(ex - 62, ey, mx + 40, ey, {
    color: P.unknown,
    alpha: g7 * ramp(t, returns - 0.1, 0.3),
    draw: { t, at: returns - 0.05 },
  });
  // The reason keeps its spoken words, wrapping as its parts under the boundary. The Chinese reason ends on the member
  // it returns the work to, so it stands under the member and comes in with the member's name; the English keeps to
  // the condition, since with "the work goes back" it would repeat its caption: it stands centred under the Agent,
  // alone there, and moves to the middle of the boundary's place as the member arrives beside the Agent.
  const unmetParts = en ? ["Conditions are unmet"] : ["条件不满足", "，就退回给成员"];
  const unmetW = Math.max(
    ...growTexts(unmetParts, 340).map((line) => measure(line.map(([, v]) => v).join(""))),
  );
  growName(
    t,
    unmetParts,
    en ? [unmet, returns] : [memberAt, memberAt],
    L(mx, mix(ax, bx + bw / 2, glide(t, memberAt + 0.05, bx + bw / 2 - ax))) - unmetW / 2,
    by + bh + NAME_GAP,
    { width: 340, color: P.muted, alpha: g7 },
  );
  // The met branch's rail is drawn 3 px wide, firm enough to read as part of the picture while its steps arrive.
  link(xs[0] - 70, ry, xs[2], ry, {
    alpha: g7 * ramp(t, met - 0.1, 0.3),
    draw: { t, at: met },
    end: false,
    width: 3,
  });
  xs.forEach((x, i) => {
    const q = ramp(t, steps[i] - 0.15, 0.4) * g7;
    dot(x, ry, 22, { color: P.ground, alpha: q });
    if (i === 0) check(x, ry, 22, { alpha: q });
    if (i === 1) s17Page(x - 12, ry - 15, 24, 30, { alpha: q, rows: 2 });
    if (i === 2) link(x - 14, ry, x + 14, ry, { color: P.ink, alpha: q });
    if (speaking(t, steps, i) > 0)
      ring(x, ry, 22, { color: P.evidence, alpha: g7 * speaking(t, steps, i), width: 2.5 });
  });
  railNames(en ? ["Accepted", "Recorded", "Handed off"] : ["验收", "记录", "交接"], xs, ry + 22, {
    gap: NAME_GAP,
    alpha: (i) => g7 * listIn(t, steps, i),
    set: "steps",
  });
  // The met branch's condition is named over its first step, centred on the check's axis as the step's name is below.
  nameText(L("满足了", "If they are met"), xs[0], ry - 22 - NAME_GAP, {
    valign: "bottom",
    color: P.evidence,
    alpha: g7 * named(t, met),
  });
  // Acceptance never expands permission: over the boundary, the expansion is refused and the boundary keeps its size.
  // It starts at the boundary's edge, as the boundary's name does, a wide gap above that name.
  rejectedName(L("扩大权限", "Expands permission"), bx, by - NAME_GAP - labelSize(LABEL) - 40, {
    align: "left",
    valign: "bottom",
    alpha: g7 * named(t, noExpand),
    mark: ramp(t, noExpand + 0.5, 0.4),
  });
}

/* 03's opening stages: the one frame that holds members and the Agents they delegate to, and the two kinds of
 * authority counted in the frame that follows it. */

import { ctx } from "../../canvas.js";
import { since } from "../../drawing/flows.js";
import { restMark } from "../../drawing/levels.js";
import { link } from "../../drawing/links.js";
import { box, dot, labelSize, line, measure, text } from "../../drawing/strokes.js";
import { agent, person, ring, seal } from "../../drawing/symbols.js";
import { listIn, named, speaking } from "../../naming/lists.js";
import { NAME_GAP, nameText } from "../../naming/names.js";
import { CONTENT_CY } from "../../naming/placement.js";
import { NOTE, TERM_STACK } from "../../naming/terms.js";
import { LABEL, P } from "../../palette.js";
import { L, en } from "../../timeline.js";
import { cue } from "../../timing/cues.js";
import { ease, mix, ramp } from "../../timing/easing.js";
import { glide } from "../../timing/pace.js";
import { s03Extent } from "./order.js";

/* Stage 1: the guidelines' one frame round the members and the Agents they delegate to. */
export function s03Guidelines(
  s,
  t,
  bind,
  agentAt,
  search,
  reason,
  act,
  people,
  duties,
  membersAt,
  delegate,
  reachOf,
  g1,
) {
  // The frame keeps one padding, 32 px, round what it holds: left of the members' name, right of the Agents' name, above
  // the delegation's name and below each row it deepens to.
  const MX = 640,
    AX = 1240,
    FY = 440,
    rows = [550, 624, 698, 772],
    PADG = 32,
    FT = FY - 90;
  const abilities = [search, reason, act],
    agentName = L("智能体", "Agents"),
    membersName = L("部门成员", "Members");
  const FL = MX - 36 - NAME_GAP - measure(membersName) - PADG,
    below = labelSize(LABEL) / 2 + PADG;
  const rowAt = rows.map((_, r) => Math.min(duties[r], abilities[r] ?? Infinity));
  // The frame takes its wide form with the words that bring the Agent or the delegation, whichever is first (in
  // Chinese the delegation's words begin with 及其, the members who delegate), so the members' small frame does not stand
  // alone through the words before it.
  const widen = Math.min(agentAt, delegate, en ? Infinity : cue(s, "及其委托", ""));
  // The Chinese members' small frame stands centred until it widens, and the stage glides to its place as the frame
  // widens over 1.1 s on the smoothstep curve, both setting off just after the members are named, before the
  // delegation's words: the right edge, moving against the glide, stays near the drawing pace, the frame covers its
  // share of the band within two seconds of the first words, and the stage stays balanced as it widens. The English frame, which does not glide, opens to the Agent's side as the members' small
  // frame gives way to the wide one over 0.4 s on the Agent's words, so no edge sweeps through the Agent or its name.
  // The frame reaches past the wider of the Agent's name and the names of what it may do, so no name meets its edge.
  const abilityNames = en ? ["Investigate", "Reason", "Act"] : ["调查", "推理", "动手"];
  const reachRight =
      Math.max(
        AX + 34 + NAME_GAP + measure(agentName),
        AX + 9 + NAME_GAP + Math.max(...abilityNames.map((v) => measure(v))),
      ) + PADG,
    centred = 960 - (FL + MX + 120) / 2;
  ctx.save();
  ctx.translate(en ? 0 : centred * (1 - glide(t, widen - 0.45, centred)), 0);
  const bottom = s03Extent(
    t,
    FY + 80,
    rowAt.map((at, r) => [
      at,
      Math.max(0, rows[r] + below - (r ? Math.max(FY + 80, rows[r - 1] + below) : FY + 80)),
    ]),
  );
  if (en) {
    const wideQ = ramp(t, widen - 0.15, 0.4);
    box(FL, FT, MX + 120 - FL, bottom - FT, {
      stroke: P.muted,
      alpha: g1 * (1 - wideQ),
      radius: 16,
      width: 2.5,
    });
    box(FL, FT, reachRight - FL, bottom - FT, {
      stroke: P.muted,
      alpha: g1 * wideQ,
      radius: 16,
      width: 2.5,
    });
  } else
    box(FL, FT, mix(MX + 120, reachRight, ease((t - widen + 0.45) / 1.1)) - FL, bottom - FT, {
      stroke: P.muted,
      alpha: g1,
      radius: 16,
      width: 2.5,
    });
  nameText(L("这份指南", "Guidelines"), FL, FT - NAME_GAP, {
    align: "left",
    valign: "bottom",
    color: P.muted,
    alpha: g1 * named(t, bind),
  });
  person(MX, FY, { alpha: g1, color: P.authority, size: 1.2 });
  nameText(membersName, MX - 36 - NAME_GAP, FY - 6, {
    align: "right",
    color: P.authority,
    alpha: g1 * named(t, membersAt),
  });
  // The Agent stands beside the members on its own words.
  agent(AX, FY - 6, { alpha: ramp(t, agentAt - 0.15, 0.4) * g1, size: 1.3 });
  nameText(agentName, AX + 34 + NAME_GAP, FY - 6, {
    align: "left",
    color: P.evidence,
    alpha: g1 * named(t, agentAt),
  });
  // The delegation runs from the members to the Agent, one point travelling along it.
  link(MX + 44, FY - 6, AX - 40, FY - 6, {
    alpha: g1 * ramp(t, delegate - 0.1, 0.3),
    draw: { t, at: delegate - 0.1 },
    flowing: since(t, delegate + 0.6),
  });
  nameText(L("委托", "Delegate"), (MX + AX) / 2, FY - 6 - NAME_GAP, {
    valign: "bottom",
    color: P.muted,
    alpha: g1 * named(t, delegate),
  });
  // Two columns hang from the figures. Each column's rail draws down to an item as it is named and the item's mark stands
  // at its end; the item being said lights its mark.
  const columns = [
    [
      MX,
      duties,
      en
        ? ["Direction", "Authorization", "Decisions", "Responsibility for consequences"]
        : ["方向", "授权", "决定", "后果"],
      P.authority,
      "duties",
    ],
    [AX, abilities, abilityNames, P.ink, "abilities"],
  ];
  columns.forEach(([x, ats, names, color, set], c) => {
    const last = rows[ats.length - 1],
      own = c ? 0 : ramp(t, people + 0.05, 0.3),
      reach = reachOf(ats, rows, FY + 40);
    link(x, FY + 40, x, last, { alpha: g1, upto: reach, end: false });
    if (own > 0)
      link(x, FY + 40, x, last, {
        color: P.authority,
        alpha: g1 * own,
        upto: reach,
        end: false,
        width: 2.5,
      });
    ats.forEach((at, i) => {
      const y = rows[i],
        q = ramp(t, at - 0.15, 0.4) * g1,
        lit = speaking(t, ats, i);
      dot(x, y, 10.5, { color, alpha: q });
      if (lit > 0) ring(x, y, 17, { color, alpha: lit * restMark(color, 0.5) * g1, width: 2 });
      nameText(names[i], x + 9 + NAME_GAP, y, {
        align: "left",
        color,
        alpha: g1 * listIn(t, ats, i),
        set,
      });
    });
  });
  ctx.restore();
}

/* Stage 2: the two kinds of authority, one frame under their name with an open question in each half. */
export function s03Kinds(t, two, apart, decideQ, factQ, order, actQ, asks, kinds) {
  // The pair stands where the guidelines' frame stood, so the frame reads as re-formed in place rather than moved.
  // The frame stands symmetric about its divider, and each kind stands at the centre of its half with its name under
  // it: 220 px from the divider in a half of 440 px, or a half as wide as the widest name and its padding on both
  // sides, so each kind keeps equal room toward the divider and the border. The frame opens snug round the two
  // question marks (half as wide as a 100 px mark, plus 30 px), so what it holds fills it; on the first kind's words it
  // widens on both sides at once to hold that kind, its seal and its name, with the padding beyond them, and on the
  // second kind's words to its halves, so it stays at least half filled while the second kind still waits for its
  // seal. From the first kind's words each kind stands at the centre of its half of the frame as it stands, moving out
  // with the frame. It deepens, by the padding above the seals, to hold each kind's name and the question it answers,
  // and the divider runs its full height.
  const SY = CONTENT_CY + 60,
    R = 60,
    P0 = 38,
    on = kinds * named(t, two);
  const questions = [L("行动依据", "Authority to act"), L("事实依据", "Authority about facts")];
  const ask = L("", "Who may decide what to do");
  const widest = Math.max(
    2 * R,
    ...questions.map((v) => measure(v, LABEL)),
    en ? measure(ask, NOTE) : 0,
  );
  const halfW = Math.max(440, widest + 2 * P0),
    sx = halfW / 2,
    open = sx + 27 + 30,
    qTop = SY + R + NAME_GAP;
  const first = Math.min(
    halfW,
    Math.max(open, sx + Math.max(R, measure(questions[0], LABEL) / 2) + P0),
  );
  const half = s03Extent(t, open, [
      [decideQ, first - open],
      [factQ, halfW - first],
    ]),
    left = 960 - half,
    right = 960 + half;
  const kx = mix(sx, half / 2, glide(t, decideQ - 0.3, sx - open / 2));
  const low = s03Extent(t, SY + R + P0, [
    [decideQ, NAME_GAP + labelSize(LABEL)],
    [asks[0], TERM_STACK + labelSize(NOTE)],
    [en ? order : Infinity, TERM_STACK + labelSize(NOTE)],
  ]);
  box(left, SY - R - P0, right - left, low - SY + R + P0, {
    stroke: P.line,
    alpha: on,
    radius: 16,
    width: 3,
  });
  // The count's name gives way as the first kind is named, in English as it is named again to say what it answers.
  nameText(L("两种依据", "Two kinds of authority"), 960, SY - R - P0 - NAME_GAP, {
    valign: "bottom",
    alpha: on * (1 - ramp(t, L(decideQ, actQ) + 0.05, 0.3)),
  });
  if (en)
    nameText(ask, 960 - kx, qTop + labelSize(LABEL) + TERM_STACK, {
      valign: "top",
      size: NOTE,
      color: P.muted,
      alpha: kinds * named(t, asks[0]),
    });
  if (en)
    nameText(
      "Order of precedence",
      960 - kx,
      qTop + labelSize(LABEL) + 2 * TERM_STACK + labelSize(NOTE),
      { valign: "top", size: NOTE, color: P.muted, alpha: kinds * named(t, order) },
    );
  [
    [960 - kx, decideQ, P.authority],
    [960 + kx, factQ, P.evidence],
  ].forEach(([x, at, color]) => {
    text("?", x, SY, 100, {
      role: "mark",
      align: "center",
      color,
      alpha: on * (1 - ramp(t, at + 0.1, 0.3)),
    });
    seal(x, SY, R, {
      color,
      alpha: kinds * named(t, at),
      stamp: kinds * ramp(t, at + 0.35, 0.3),
    });
  });
  line(960, SY - R - P0, 960, low, {
    color: P.line,
    alpha: kinds * ramp(t, apart - 0.1, 0.4),
    width: 4,
  });
  nameText(questions[0], 960 - kx, qTop, {
    valign: "top",
    color: P.authority,
    alpha: kinds * named(t, decideQ),
  });
  nameText(questions[1], 960 + kx, qTop, {
    valign: "top",
    color: P.evidence,
    alpha: kinds * named(t, factQ),
  });
}

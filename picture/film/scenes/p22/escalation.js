/* 22's first stage: the five kinds of situation that stop the course of action and escalate. */

import { flowDot, loopPhase, since } from "../../drawing/flows.js";
import { restMark } from "../../drawing/levels.js";
import { link } from "../../drawing/links.js";
import { line } from "../../drawing/strokes.js";
import { agent, person, ring, stopSign } from "../../drawing/symbols.js";
import { listIn, named } from "../../naming/lists.js";
import { NAME_GAP, nameText } from "../../naming/names.js";
import { RAIL_ROW, railNames, railStations } from "../../naming/placement.js";
import { P } from "../../palette.js";
import { L, en } from "../../timeline.js";
import { cue } from "../../timing/cues.js";
import { mix, ramp } from "../../timing/easing.js";

/* Stage 1: the five kinds of situation on one way, each with the conditions it holds beneath its station. */
export function s22Escalation(
  s,
  t,
  stopAt,
  escalate,
  independent,
  names,
  nameAts,
  WY,
  SY,
  SR,
  BUS,
  GY,
  PAIR,
  ONE,
  NY,
  PX,
  OY,
  AX,
  LANE,
  glyphs,
  kinds,
  g1,
) {
  line(150, WY, 1770, WY, { color: P.line, alpha: g1, width: 3.5 });
  // The member stands on the way beside the Agent, the two named once under both; the member is drawn smaller than the
  // person the escalation reaches, so the two are not read as members of one list.
  person(AX - 30, WY - 19, { alpha: g1, color: P.authority, size: 0.85 });
  agent(AX + 32, WY, { alpha: g1, size: 1.2 });
  nameText(L("成员和智能体", "Members and Agents"), AX, WY + 22 * 1.2 + NAME_GAP, {
    valign: "top",
    width: 260,
    alpha: g1,
  });
  // The person the escalation reaches, named by it.
  const owner = named(t, escalate) * g1;
  person(PX, OY, { alpha: owner, color: P.authority, size: 1.1 });
  nameText(L("上报", "Escalate"), PX + 15 * 1.1 + NAME_GAP, OY - 15 * 1.1 * 1.15, {
    align: "left",
    color: P.authority,
    alpha: owner,
  });
  // The stations stand at one pitch from the first to the last: the Chinese as railStations pitches them when every
  // pair of names fits, the names measured as railNames wraps them within that pitch; the English, whose names stand
  // on two baselines, from a first station far enough right that its name stands a word space and more clear of the
  // group's name, to a last whose name ends with the way.
  const xs = en
    ? names.map((_, i) => 540 + i * 270)
    : railStations(names, 500, 1660, { wrap: 260 });
  // The first sign stands on the words that stop the Agent and its escalation rises on "escalate"; every later sign
  // stands with its kind's name, and its escalation rises as it stands.
  const signAt = (i) => (i ? nameAts[i] : stopAt) - 0.15,
    rise = (i) => (i ? nameAts[i] + 0.05 : escalate);
  const current = (i) =>
    ramp(t, signAt(i) + 0.2, 0.3) * (i + 1 < xs.length ? 1 - ramp(t, signAt(i + 1) + 0.2, 0.3) : 1);
  // The person lights as each escalation arrives.
  const arrived = Math.max(
    ...xs.map((_, i) => ramp(t, rise(i) + 0.7, 0.3) * (1 - ramp(t, rise(i) + 1.1, 0.45))),
  );
  if (arrived > 0)
    ring(PX, OY - 19, 30, {
      color: P.authority,
      alpha: arrived * restMark(P.authority, 0.6) * g1,
      width: 2,
    });
  nameText(L("停下", "Stop"), xs[0] - SR - NAME_GAP, SY, {
    align: "right",
    alpha: named(t, stopAt - 0.1) * g1,
  });
  // The group's name stands muted in the Agent's column on the names' baseline, its lines centred on the Agent's axis
  // as the row's other names centre on their stations, so it stands clear of the first kind's name and never reads
  // as that kind's label.
  nameText(L("五类情况", "Five kinds of situation"), AX, NY, {
    valign: "top",
    width: 220,
    color: P.muted,
    alpha: named(t, cue(s, "五类情况", "five kinds of situation")) * g1,
  });
  xs.forEach((x, i) => {
    const sign = ramp(t, signAt(i), 0.3) * g1;
    line(x, SY + SR + 2, x, WY - 2, { color: P.line, alpha: sign, width: 2 });
    stopSign(x, SY, SR, { alpha: sign });
    const lit = current(i);
    if (lit > 0)
      ring(x, SY, SR + 10, {
        color: P.unknown,
        alpha: lit * restMark(P.unknown, 0.5) * g1,
        width: 2,
      });
    // The escalation of the current station keeps one point travelling up to the person once its way has drawn up to
    // them, and begins no pass once the next station stands; an escalation already delivered recedes as the next
    // station stands.
    const up = { t, at: rise(i) + 0.05 },
      escalating = since(t, rise(i) + 0.85);
    link(x, SY - SR - 4, PX, OY + 34, {
      route: "vhv",
      mid: BUS,
      color: P.authority,
      alpha: g1 * mix(restMark(P.authority), 1, lit),
      draw: up,
      width: 2.5,
      flowing: escalating,
      last: i + 1 < xs.length ? since(signAt(i + 1) + 0.35, rise(i) + 0.85) : Infinity,
    });
    const held = kinds[i];
    // Two conditions stand one over the other; of three, the first two stand side by side over the third, the pair
    // centred on the column, the lock 30 px clear of the boundary's way.
    const spots =
      held.length > 2
        ? [
            [-62, -PAIR],
            [34, -PAIR],
            [0, PAIR],
          ]
        : held.length > 1
          ? [
              [0, -PAIR],
              [0, PAIR],
            ]
          : [[0, ONE]];
    held.forEach((k, n) => glyphs[k](x + spots[n][0], GY + spots[n][1], g1));
  });
  // The names hang on one baseline beneath the glyphs, and build as one list; in English every other name hangs a row
  // lower, on a short stem that rises from it toward its column.
  if (en)
    xs.forEach((x, i) => {
      if (i % 2)
        line(x, NY + 2, x, NY + RAIL_ROW - 6, {
          alpha: g1 * ramp(t, nameAts[i] - 0.15, 0.4),
          width: 2,
        });
    });
  railNames(names, xs, WY, {
    gap: (i) => NY - WY + (en && i % 2 ? RAIL_ROW : 0),
    wrap: 460,
    alpha: (i) => g1 * listIn(t, nameAts, i),
    set: "conditions",
  });
  // Independent authorized work keeps moving on its own lane, unaffected by the stops.
  const lane = ramp(t, independent + 0.05, 0.5) * g1;
  if (lane > 0) {
    line(150, LANE, 1770, LANE, { color: P.line, alpha: lane, width: 2 });
    // One point of work travels the lane, so the lane and its name stand as one named mark.
    const q = loopPhase(since(t, independent + 0.05), 1596);
    if (q !== null) flowDot(mix(162, 1758, q), LANE, 10, q, { color: P.evidence, alpha: lane });
    nameText(L("已授权的工作", "Independent authorized work"), 960, LANE + NAME_GAP, {
      valign: "top",
      color: P.muted,
      alpha: lane,
    });
  }
}

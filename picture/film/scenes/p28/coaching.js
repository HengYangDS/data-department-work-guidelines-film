/* 28's first stages: capability growing through real work, and coaching that tests a member's reasoning. */

import { restMark } from "../../drawing/levels.js";
import { link } from "../../drawing/links.js";
import {
  along,
  box,
  diamond,
  dot,
  labelSize,
  lengthOf,
  line,
  measure,
} from "../../drawing/strokes.js";
import { person, ring } from "../../drawing/symbols.js";
import { listIn, listLevel, named, speaking } from "../../naming/lists.js";
import { NAME_GAP, nameText, wrapName } from "../../naming/names.js";
import { railNames, railStations } from "../../naming/placement.js";
import { rejectedName } from "../../naming/rejected.js";
import { NOTE } from "../../naming/terms.js";
import { LABEL, P } from "../../palette.js";
import { L, en } from "../../timeline.js";
import { cue, cues } from "../../timing/cues.js";
import { mix, ramp, soon } from "../../timing/easing.js";
import { glide } from "../../timing/pace.js";

/* Stage 1: one task as a rail the member walks, stopping where the guidelines say to look. */
export function s28RealWork(s, t, grows, boundary, g1) {
  // The English last action stands whole on one line and is the widest name, so in English the rail starts 20 px
  // further left, the step rises 195 px further right and the next task's stop stands 160 px further on, its name
  // clear of the member climbing the step by the headless canvas's wider estimate too, which keeps every pair of
  // stations well apart.
  const moments = cues(s, [
    ["开头", "at the start"],
    ["重要决定时", "at important decisions"],
    ["交付后", "after delivery"],
  ]);
  const acts = cues(s, [
    ["确认边界", "confirm the boundary"],
    ["查推理", "examine the reasoning"],
    ["挑一个最关键", "agree on one"],
    ["约好下次", "for the next task"],
  ]);
  // The English first action wraps before its "and", so no line ends on the word that opens a phrase; the middle and
  // the last stand whole on one line, as no break keeps the last's phrase in an even block.
  const names = en
    ? [
        ["At the start", "Confirm boundary and success criteria"],
        ["At important decisions", ["Examine the reasoning"]],
        ["After delivery", ["Agree on one observable improvement"]],
        [null, "For the next task"],
      ]
    : [
        ["开头", "确认边界和成功标准"],
        ["重要决定时", "查推理"],
        ["交付后", "挑一个最关键的差距"],
        [null, "看得见的改进"],
      ];
  const half = ([moment, act]) =>
    Math.max(
      moment ? measure(moment, NOTE) / 2 : 0,
      ...wrapName(act, 360).map((line) => measure(line) / 2),
    );
  // The English lane widens by as much on each side as keeps the middle action, whole on one line, 34 px or more from
  // both its neighbours' names: the stops' pitch grows by that much.
  const delta = en
    ? Math.max(
        0,
        half(names[1]) +
          Math.max(half(names[0]), half(names[2])) +
          34 -
          (1495 - 70 - (200 - 20) - 48 - half(names[0]) - half(names[2])) / 2,
      )
    : 0;
  const Y = 570,
    UP = 370,
    X0 = L(220, 200 - delta),
    RISE = L(1300, 1495 + delta),
    X1 = 1700,
    rows = [Y, Y, Y, UP];
  // The task's three stops stand at one pitch about the middle of its lane (BX0 to BX1), as far apart as keeps every
  // stop's names inside the lane with room to spare; the next task's stop stands on the step beyond. The English
  // names, whose last is far the widest, stand centred as a row in the lane rather than on its middle stop.
  const BX0 = X0 - 20,
    BX1 = RISE - 70,
    BC = (BX0 + BX1) / 2;
  const pitch = en
    ? (BX1 - BX0 - 48 - half(names[0]) - half(names[2])) / 2
    : Math.min(BC - BX0 - half(names[0]), BX1 - BC - half(names[2])) - 24;
  const MC = en ? (BX0 + 24 + half(names[0]) + BX1 - 24 - half(names[2])) / 2 : BC,
    xs = [MC - pitch, MC, MC + pitch, L(1500, 1660)];
  const starts = acts.map((at, i) => Math.min(at, moments[i] ?? Infinity));
  // The rail, the task's whole course, stands from the first words, whole, so the stage stands balanced while its
  // stations build; each station marks on it on its own words.
  link(X0, Y, X1, UP, {
    route: "hvh",
    mid: RISE,
    color: P.muted,
    width: 3,
    alpha: g1 * ramp(t, grows - 0.1, 0.6),
    end: false,
  });
  // The task's boundary: a quiet lane around the walk, as tall as the walking member, set on the words that confirm
  // it, under the name of the work.
  box(BX0, Y - 80, BX1 - BX0, 96, { stroke: P.line, alpha: g1 * named(t, boundary), radius: 12 });
  nameText(L("真实的工作", "Real work"), X0 - 20, Y - 80 - NAME_GAP, {
    align: "left",
    valign: "bottom",
    alpha: g1 * named(t, cue(s, "真实的工作", "grows through real work")),
  });
  // The gap to close, the agreed improvement, is the step itself, lit on its words.
  link(RISE, Y, RISE, UP, {
    color: P.evidence,
    width: 4,
    alpha: g1 * named(t, acts[2]),
    draw: { t, at: acts[2] + 0.05 },
    end: false,
  });
  xs.forEach((x, i) => {
    const y = rows[i],
      lit = speaking(t, starts, i),
      on = named(t, starts[i]);
    const color = [P.evidence, P.authority, P.ink, P.evidence][i];
    dot(x, y, 9, { color, alpha: g1 * on });
    if (lit > 0) ring(x, y, 17, { color, alpha: g1 * lit * restMark(color, 0.6), width: 2 });
    const level = g1 * listLevel(t, starts, i);
    let top = y + NAME_GAP + 18;
    // The moment heads its action from 20 px above it, further than the action's own lines stand apart, so the two read
    // as a heading and its action rather than as one block of lines.
    if (names[i][0])
      top =
        nameText(names[i][0], x, top, {
          valign: "top",
          size: NOTE,
          color: P.muted,
          alpha: level * named(t, moments[i]),
          set: "stations",
        }).bottom + 20;
    nameText(names[i][1], x, top, {
      valign: "top",
      width: 360,
      alpha: level * named(t, acts[i]),
      set: "stations",
    });
  });
  // The member walks up to each station as it is named, then climbs the step to the next task, standing just short of
  // the station so its mark stays clear.
  const walk = [BX0 + 44, ...xs.slice(0, 3).map((x) => x - 56)].reduce(
    (x, to, k, all) => (k ? mix(x, to, glide(t, starts[k - 1] + 0.05, to - all[k - 1])) : to),
    0,
  );
  const climbWay = [
    [xs[2] - 56, Y],
    [RISE, Y],
    [RISE, UP],
    [xs[3] - 56, UP],
  ];
  const climb = glide(t, starts[3] + 0.05, lengthOf(climbWay)),
    at = along(climbWay, climb).point;
  const px = climb > 0 ? at[0] : walk,
    py = (climb > 0 ? at[1] : Y) - 30;
  person(px, py, { alpha: g1, size: 1.2 });
}

/* Stage 2: the member's reasoning as a rail to the judgment at its end, tested without making the judgment for them. */
export function s28Coaching(s, t, coaching, notJudge, weak, noDirection, fb, g2) {
  const judgmentAt = cue(s, "判断", "judgment"),
    SH = mix(L(25, 30), L(25, 0), soon(t, judgmentAt + 0.05, 0.6));
  const R = 550,
    MX = 290 + SH,
    CY = 350,
    JX = 1640 + SH,
    reasoning = cue(s, "成员的推理", "a member's reasoning"),
    rail = ramp(t, reasoning - 0.15, 0.4);
  const names = en
    ? ["Proposition", "Evidence", "Behavior", "Consequence"]
    : ["说法", "证据", "行为", "后果"];
  // The feedback stations stand at one pitch, ending far enough short of the judgment that its name keeps clear of the
  // last station's.
  const xs = railStations(names, 640 + SH, 1340 + SH);
  person(MX, R - 4, { alpha: g2 * named(t, reasoning), size: 1.1 });
  // The reasoning stands whole with the member it belongs to, so the stage stands balanced while the coach tests it.
  link(MX + 16, R, JX - 40, R, { color: P.muted, width: 3, alpha: g2 * rail, end: false });
  nameText(L("成员的推理", "A member's reasoning"), MX + 40, R - 40, {
    align: "left",
    valign: "bottom",
    alpha: g2 * named(t, reasoning),
  });
  // The judgment at the end of the reasoning stays the member's, and is named as theirs, on the stations' baseline.
  diamond(JX, R, 24, { color: P.ink, alpha: g2 * named(t, judgmentAt), solid: true });
  nameText(L("判断", "Their judgment"), JX, R + NAME_GAP + 18, {
    valign: "top",
    alpha: g2 * named(t, judgmentAt),
  });
  person(MX, CY, { alpha: g2, size: 1.1, color: P.authority });
  nameText(L("辅导", "Coaching"), MX - 34, CY - 8, {
    align: "right",
    color: P.authority,
    alpha: g2 * named(t, coaching),
  });
  // The coach's probe tests each station of the reasoning while that is said, gliding from one to the next, and rests
  // once the refusal is named.
  const scan = 3 * glide(t, reasoning + 0.2, 3 * Math.abs(xs[1] - xs[0])),
    k = Math.min(2, Math.floor(scan));
  ring(mix(xs[k], xs[k + 1], scan - k), R, 22, {
    color: P.authority,
    width: 2.5,
    alpha: g2 * ramp(t, reasoning + 0.05, 0.3) * (1 - ramp(t, notJudge + 0.05, 0.4)),
  });
  // The coach's way to the judgment draws on and stops short of it at a bar.
  link(MX + 40, CY, JX, R - 86, {
    route: "hv",
    color: P.authority,
    width: 2.5,
    alpha: g2 * named(t, notJudge),
    draw: { t, at: notJudge - 0.05 },
    end: false,
  });
  line(JX - 24, R - 78, JX + 24, R - 78, {
    color: P.unknown,
    alpha: g2 * ramp(t, notJudge + 0.55, 0.3),
    width: 4,
  });
  // The refusal is named over the coach's way, centred on its run.
  nameText(L("不是替他们判断", "Without judging for them"), (MX + 40 + JX) / 2, CY - NAME_GAP, {
    valign: "bottom",
    color: P.authority,
    alpha: g2 * named(t, notJudge),
  });
  xs.forEach((x, i) => {
    const lit = speaking(t, fb, i);
    dot(x, R, 9, { color: P.evidence, alpha: g2 * named(t, fb[i]) });
    if (lit > 0)
      ring(x, R, 17, {
        color: P.evidence,
        alpha: g2 * lit * restMark(P.evidence, 0.6),
        width: 2,
      });
  });
  railNames(names, xs, R, {
    alpha: (i) => g2 * listIn(t, fb, i),
    color: () => P.evidence,
    set: "feedback",
  });
  // The list reads as the sentence: what feedback names, then the stations it names.
  nameText(
    L("反馈要指出", "Feedback names"),
    xs[0] - measure(names[0], LABEL) / 2 - 34,
    R + NAME_GAP + 18 + labelSize(LABEL) / 2,
    {
      align: "right",
      size: NOTE,
      color: P.muted,
      alpha: g2 * named(t, cue(s, "反馈要指出", "feedback names")),
    },
  );
  rejectedName(L("“逻辑弱”", "“Weak logic”"), (xs[0] + xs[3]) / 2, R + 200, {
    alpha: g2 * named(t, weak),
    mark: ramp(t, noDirection - 0.1, 0.4),
  });
}

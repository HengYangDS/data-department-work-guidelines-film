/* 27's middle stages: the conditions to watch across the work cycles, and the threshold the drifting line crosses
 * well before failure. */

import { ctx } from "../../canvas.js";
import { restMark } from "../../drawing/levels.js";
import { link } from "../../drawing/links.js";
import { box, diamond, dot, line, measure, path } from "../../drawing/strokes.js";
import { agent, check, documentIcon, person, ring, shield } from "../../drawing/symbols.js";
import { building, listIn, named } from "../../naming/lists.js";
import { NAME_GAP, nameText } from "../../naming/names.js";
import { P } from "../../palette.js";
import { L, en } from "../../timeline.js";
import { cue, cueFrom } from "../../timing/cues.js";
import { clamp, ease, mix, ramp, soon, standard } from "../../timing/easing.js";
import { voiceTime } from "../../timing/pauses.js";

/* Stage 4: the conditions to watch, each a row across the same work cycles. */
export function s27Conditions(s, t, conds, watch, problem, four) {
  // The conditions' names stand outside the card, a name gap and more beyond its right edge (END + 30).
  const R = [351, 501, 651, 801],
    C = [580, 780, 980, 1180],
    START = 400,
    END = 1290,
    NX = END + 30 + NAME_GAP + 18,
    KX = START - 70,
    KY = R[0] - 136;
  const on = (at, lead = 0.15) => ramp(t, at - lead, 0.4) * four;
  const rowAts = [
    conds[0],
    conds[1],
    cue(s, "有些事", "forgetting something"),
    cue(s, "交给智能体", "agents will repeat"),
  ];
  // The judgments' row stands on the word that names the people it rests on, 少数人 in Chinese and "people's" in
  // English, whose "a few" comes too early, so its name, the unwritten knowledge, follows within half a second; the
  // card makes room for it as the condition begins. The forgetting's row
  // stands with its name on the words that say what forgetting can cause, its loss on its own words.
  const fewAt = cueFrom(s, "少数人", "people's", conds[1]),
    causeAt = cue(s, "可能造成", "could cause"),
    lineAts = [conds[0], fewAt, causeAt, rowAts[3]];
  const names = en
    ? ["Same kind of problem recurs", "Tacit knowledge", "Material loss", "Agents will repeat"]
    : ["同类问题反复出现", "没写下来的经验", "实质损失", "交给智能体反复做"];
  // The English names are long, so in English the card and its names stand centred together, from the card's left
  // edge to the end of the longest name.
  const lean = en ? 960 - (KX + NX + Math.max(...names.map((v) => measure(v)))) / 2 : 0;
  ctx.save();
  ctx.translate(lean, building(t, rowAts, (R[1] - R[0]) / 2, 0.5));
  // The card lengthens over 0.7 s from half a second before each row's words, so its edge and the work cycles' ends,
  // which lengthen with it, move at under half the drawing pace, and it has passed the row before the row's line comes.
  const extent = rowAts.reduce(
    (y, at, k) => mix(y, R[k] + [100, 100, 64, 64][k], ease((t - at + 0.5) / 0.7)),
    KY + 72,
  );
  documentIcon(KX, KY, END + 30 - KX, extent - KY, { alpha: four, rows: 0 });
  nameText(L("留意这几种", "Conditions to watch"), KX + 30, KY + 36, {
    align: "left",
    alpha: four * named(t, watch),
  });
  R.forEach((y, k) =>
    line(START + 30, y, END, y, { color: P.line, alpha: on(lineAts[k]), width: 2 }),
  );
  // The work cycles, from the words that name them, across the rows that stand: the rows' events fall in different
  // cycles.
  const cycle = cue(s, "周期", "work cycle");
  [480, 680, 880, 1080, 1280].forEach((x, k) =>
    line(x, R[0] - 44, x, extent - 28, {
      color: P.line,
      alpha: ramp(t, cycle + 0.05 + k * 0.06, 0.3) * four * 0.7,
      width: 2,
    }),
  );
  // The same problem comes back in each cycle, and reaches more than one person and a project.
  const recur = cue(s, "反复出现", "recurs"),
    backAt = [conds[0], recur + 0.05, recur + 0.3, recur + 0.55];
  C.forEach((x, k) => problem(x, R[0], 20, on(backAt[k], k ? -0.05 : 0.15)));
  const people = cue(s, "不止一个人", "more than one person"),
    project = cue(s, "项目", "project");
  [C[1], C[2]].forEach((x, k) => {
    const q = on(people + 0.2 * k, -0.05);
    line(x, R[0] + 20, x, R[0] + 44, { color: P.muted, alpha: q, width: 2 });
    person(x, R[0] + 62, { size: 0.55, color: P.muted, alpha: q });
  });
  const pq = on(project);
  line(C[3], R[0] + 20, C[3], R[0] + 40, { color: P.muted, alpha: pq, width: 2 });
  box(C[3] - 18, R[0] + 40, 36, 28, { stroke: P.muted, alpha: pq, radius: 4, width: 2 });
  line(C[3] - 18, R[0] + 48, C[3] + 18, R[0] + 48, { color: P.muted, alpha: pq, width: 2 });
  // Important judgments in three cycles all hang from one person, and the experience they rest on is written nowhere:
  // its page is a dashed outline beside the person.
  const unwritten = cue(s, "没写下来的经验", "tacit knowledge"),
    held = on(fewAt);
  person(START, R[1] + 12, { alpha: held, solid: false });
  dot(START, R[1] + 12 - 15 * 1.15, 15, { color: P.ink, alpha: held });
  line(START + 30, R[1], C[2], R[1], { color: P.authority, alpha: on(fewAt, 0.1), width: 2.5 });
  [0, 1, 2].forEach((k) =>
    diamond(C[k], R[1], 17, {
      color: P.authority,
      alpha: on(fewAt + 0.2 * k, k ? -0.05 : 0.15),
      width: 2.5,
    }),
  );
  box(START - 17, R[1] + 40, 34, 44, {
    stroke: P.muted,
    alpha: on(unwritten),
    radius: 4,
    width: 2,
    dash: [5, 4],
  });
  // Something done in every cycle, a ticked step, is forgotten in the third, an empty dashed outline, and a material
  // loss spreads from the fourth on its words, as 22.2's widening harm does, in voice time.
  [0, 1].forEach((k) => {
    const q = on(causeAt + 0.2 * k, k ? -0.05 : 0.15);
    box(C[k] - 15, R[2] - 15, 30, 30, {
      fill: P.row,
      stroke: P.ink,
      alpha: q,
      radius: 5,
      width: 2,
    });
    check(C[k], R[2] + 1, 16, { alpha: q, width: 2.5 });
  });
  box(C[2] - 15, R[2] - 15, 30, 30, {
    stroke: P.muted,
    alpha: on(causeAt + 0.4, -0.05),
    radius: 5,
    width: 2,
    dash: [5, 4],
  });
  const lossAt = cue(s, "实质损失", "material loss"),
    lost = on(lossAt),
    spread = standard((voiceTime(t) - voiceTime(lossAt + 0.05)) / 0.8);
  dot(C[3], R[2], 5, { color: P.unknown, alpha: lost });
  [13, 22].forEach((r, i) =>
    ring(C[3], R[2], mix(5, r, spread), {
      color: P.unknown,
      alpha: lost * restMark(P.unknown, 1 - i * 0.35),
      width: 2,
    }),
  );
  // The same work goes to an Agent again and again: one task in every cycle, in turn from the words that hand it over,
  // so the row is whole before the thought ends.
  const agents = cue(s, "交给智能体", "agents will repeat");
  agent(START, R[3], { alpha: on(agents), size: 0.9 });
  line(START + 30, R[3], END, R[3], {
    color: P.evidence,
    alpha: on(agents, 0.1) * 0.8,
    width: 2,
  });
  C.forEach((x, k) => {
    const q = ramp(t, agents + 0.2 + 0.12 * k, 0.3) * four;
    box(x - 15, R[3] - 15, 30, 30, {
      fill: P.row,
      stroke: P.evidence,
      alpha: q,
      radius: 5,
      width: 2,
    });
    dot(x, R[3], 4.5, { color: P.evidence, alpha: q });
  });
  // The names of the conditions build as one list in the column beyond the card, at the rows' pitch, each beside the
  // row where its condition happens; the forgetting's name is the loss it can cause, by its key words.
  const nameAts = [conds[0], unwritten, causeAt, agents];
  R.forEach((y, i) =>
    nameText(names[i], NX, y, {
      align: "left",
      width: 420,
      alpha: four * listIn(t, nameAts, i),
      set: "conditions",
    }),
  );
  ctx.restore();
}

/* Stage 5: the drifting line rising toward a threshold before the failure, and the safeguard left where it crosses. */
export function s27Threshold(s, t, material, leave, X0, B, problem, s27Line, these, five) {
  // The drift and the conditions at its start stand 59 px right of the scene's line, so the stage, from the axis to
  // the failure at the line's end, stands centred; it cuts in there, so nothing moves.
  ctx.save();
  ctx.translate(59, 0);
  const SX = 1000,
    FX = 1660,
    held = soon(t, leave + 0.05, 1.2),
    before = cue(s, "还没出过事", "before anything fails");
  const bring = cue(s, "只要带来", "brings material risk"),
    named5 = ramp(t, these - 0.15, 0.4) * five;
  // The conditions, in small and in spoken order: the returning problem, a judgment, the loss forgetting causes and an
  // Agent.
  const ey = B - 46;
  problem(238, ey, 14, named5);
  diamond(284, ey, 13, { color: P.authority, alpha: named5, width: 2.5 });
  dot(330, ey, 3, { color: P.unknown, alpha: named5 });
  [8, 13].forEach((r, i) =>
    ring(330, ey, r, {
      color: P.unknown,
      alpha: named5 * restMark(P.unknown, 1 - i * 0.35),
      width: 2,
    }),
  );
  agent(376, ey, { alpha: named5, size: 0.55 });
  nameText(L("这些情况", "Any of these"), 307, B + 26, { valign: "top", alpha: named5 });
  // The drift climbs steadily toward the failure at the line's end and crosses the threshold of material risk at SX;
  // after the safeguard the line eases back under the threshold and runs level.
  const climb = (x) => 260 * ease(clamp((x - 320) / (FX - 360))),
    TY = B - climb(SX);
  const level = (x) => climb(SX) - 40 * ease(clamp((x - SX) / 240));
  const yAt = (x) => B - (x <= SX ? climb(x) : mix(climb(x), level(x), held));
  s27Line(yAt, five, { x1: FX - 40, y0: B, draw: { t, at: bring + 0.05 } });
  // Once the safeguard holds the line, the course the drift was on stays as a dashed trace up to the failure.
  if (held > 0)
    path(
      Array.from({ length: 51 }, (_, k) => {
        const x = mix(SX, FX - 40, k / 50);
        return [x, B - climb(x)];
      }),
      { color: P.line, alpha: five * held, width: 2, dash: [6, 8] },
    );
  // The threshold of material risk, and the failure still ahead at the line's end, drawn on the words that say nothing
  // has failed yet. The failure has not happened, so it stands as a dashed outline at the end of the dashed course,
  // never a cross, which would read as refusing the case.
  line(X0, TY, FX - 40, TY, {
    color: P.unknown,
    alpha: five * restMark(P.unknown, 0.8) * named(t, material),
    width: 2,
  });
  // The name stands 8 px above a name's gap, so its ink keeps 8 px clear of the axis's top tick, which ends at its edge.
  nameText(L("实质风险", "Material risk"), X0, TY - NAME_GAP - 8, {
    align: "left",
    valign: "bottom",
    alpha: five * named(t, material),
  });
  const FY = B - climb(FX - 40);
  ring(FX, FY, 15, {
    color: P.unknown,
    alpha: five * named(t, before),
    width: 2.5,
    dash: [5, 5],
  });
  nameText(L("还没出过事", "Before anything fails"), FX + 12, FY - 12 - NAME_GAP, {
    align: "right",
    valign: "bottom",
    color: P.muted,
    alpha: five * named(t, before),
  });
  // The safeguard stands where the line crosses the threshold, from the words that leave it behind.
  const sg = ramp(t, leave - 0.1, 0.4) * five;
  shield(SX, B + 110, 40, { color: P.evidence, alpha: sg, fillColor: P.row });
  check(SX, B + 112, 28, { color: P.evidence, alpha: sg, width: 3 });
  link(SX, B + 62, SX, yAt(SX) + 12, {
    color: P.evidence,
    alpha: sg,
    draw: { t, at: leave + 0.05 },
  });
  nameText(L("能复用的预防措施", "Reusable prevention"), SX, B + 150 + NAME_GAP, {
    valign: "top",
    color: P.evidence,
    alpha: five * named(t, leave),
  });
  ctx.restore();
}

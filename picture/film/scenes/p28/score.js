/* 28's closing stages: the score that expresses delivery risk and never labels a person, and the high-risk signal
 * escalated at once. */

import { ctx } from "../../canvas.js";
import { link } from "../../drawing/links.js";
import { diamond, dot, fill, line, measure, path, stroke } from "../../drawing/strokes.js";
import { documentIcon, person, ring } from "../../drawing/symbols.js";
import { listIn, named } from "../../naming/lists.js";
import { NAME_GAP, nameText, wrapName } from "../../naming/names.js";
import { growName } from "../../naming/parts.js";
import { railNames } from "../../naming/placement.js";
import { rejectedName } from "../../naming/rejected.js";
import { P } from "../../palette.js";
import { L, en } from "../../timeline.js";
import { cue, cueFrom, cues } from "../../timing/cues.js";
import { clamp, ease, mix, ramp, soon } from "../../timing/easing.js";
import { glide } from "../../timing/pace.js";
import { voiceTime } from "../../timing/pauses.js";
import { STAGE_CUT, stageIn, stageOut } from "../../timing/stages.js";

/* Stage 4: the delivery with the score's gauge, beside the person the score must never label. */
export function s28Score(
  s,
  t,
  score,
  deliveryRisk,
  noLabel,
  metric,
  decision,
  gamed,
  anomaly,
  cases,
  mechanisms,
  g4,
) {
  const d1 = g4 * stageOut(t, metric);
  if (d1 > 0) {
    // The delivery and the person stand at their places from the stage's first words, so the pair stands centred and
    // the stage whole while the score is said, before the words turn to the person the score must never label.
    const DX = 580,
      DY = 330,
      DW = 240,
      DH = 230,
      gx = DX + DW / 2,
      gy = DY + 205,
      gr = 74,
      PX = DX + 720,
      PY = 480;
    documentIcon(DX, DY, DW, DH, { alpha: d1, rows: 1 });
    fill(() => ctx.arc(gx, gy, gr + 14, Math.PI, Math.PI * 2), { color: P.row, alpha: d1 });
    stroke(() => ctx.arc(gx, gy, gr, Math.PI, Math.PI * 2), {
      color: P.line,
      alpha: d1,
      width: 9,
      cap: "butt",
    });
    const read = ramp(t, deliveryRisk - 0.05, 0.8);
    if (read > 0)
      stroke(() => ctx.arc(gx, gy, gr, Math.PI, Math.PI * mix(1.001, 1.62, read)), {
        color: P.authority,
        alpha: d1,
        width: 9,
        cap: "butt",
      });
    const a = Math.PI * mix(1.04, 1.62, ramp(t, score + 0.1, 0.9));
    line(gx, gy, gx + Math.cos(a) * gr * 0.78, gy + Math.sin(a) * gr * 0.78, {
      color: P.ink,
      alpha: d1,
      width: 3,
    });
    nameText(L("打分", "The score"), gx, DY - NAME_GAP, {
      valign: "bottom",
      alpha: d1 * named(t, score),
    });
    nameText(L("交付风险", "Delivery risk"), gx, DY + DH + NAME_GAP, {
      valign: "top",
      color: P.authority,
      alpha: d1 * named(t, cue(s, "分数说的是", "expresses")),
    });
    // The score's way toward the person stops at a bar halfway between the pair.
    person(PX, PY, { alpha: d1, size: 1.6 });
    const go = soon(t, noLabel - 0.05, 0.7),
      BX = (DX + DW + PX) / 2 - 15;
    link(DX + DW + 30, PY, BX, PY, {
      color: P.unknown,
      alpha: d1 * named(t, noLabel),
      upto: go,
      end: false,
      dash: [8, 8],
    });
    // The refused phrase is named under the stop, beside the way it refuses.
    line(BX, PY - 34, BX, PY + 34, {
      color: P.unknown,
      alpha: d1 * ramp(t, noLabel + 0.55, 0.3),
      width: 4,
    });
    rejectedName(L("给人贴标签", "Label a person"), BX, PY + 34 + NAME_GAP, {
      valign: "top",
      alpha: d1 * named(t, noLabel),
      mark: ramp(t, noLabel + 0.55, 0.3),
    });
  }
  // The metric is a chart trace; the questions asked of it attach to it: the decision it supports at its end, the
  // way it could be gamed lifting off its tail, and an anomaly on it understood through cases and mechanisms, a
  // small tree hanging from the anomaly. The trace stands from the stage's first words; each question's mark arrives
  // on its own words.
  const d2 = g4 * stageIn(t, metric);
  if (d2 > 0) {
    const X0 = 460,
      X1 = 1180,
      Y = 470,
      yAt = (x) => Y - 22 * Math.sin((x - X0) / 64) - 9 * Math.sin((x - X0) / 21),
      YE = yAt(X1);
    // The stage stands centred from the metric's name to the wider of the names under the decision.
    const DX = 1500,
      factParts = L(["事实依据", "、周期", "、边界"], ["Fact source", ", period", ", boundary"]);
    const underDX = Math.max(
      ...wrapName(L("支持哪个决定", ""), 300).map((v) => measure(v)),
      measure(L("", "a metric supports")),
      measure(factParts.join("")),
    );
    ctx.save();
    ctx.translate(960 - (X0 - NAME_GAP - measure(L("指标", "Metric")) + DX + underDX / 2) / 2, 0);
    const pts = [];
    for (let x = X0; x <= X1; x += 8) pts.push([x, yAt(x)]);
    // The trace stands at the structure tier from the cut, so the stage opens on its object, and the metric draws on
    // over it in its own colour. It is named within 0.9 s of the words that name it.
    path(pts, { color: P.line, alpha: d2, width: 3 });
    path(pts, { color: P.evidence, alpha: d2, width: 3, draw: { t, at: metric + STAGE_CUT } });
    nameText(L("指标", "Metric"), X0 - NAME_GAP, yAt(X0), {
      align: "right",
      color: P.evidence,
      alpha: d2 * named(t, en ? Math.max(metric, cue(s, "", "a metric") - 0.8) : metric),
    });
    // The decision the metric supports: a link from the trace's end to the decision's mark, on the words that ask for
    // it (in English the clause that opens the stage, so the stage opens with three firm marks), and its name on its
    // own words.
    const ask = cue(s, "先明确它", "first identify what decision"),
      dm = named(t, ask),
      dc = named(t, decision);
    link(X1 + 16, YE, DX - 40, YE, {
      color: P.authority,
      alpha: d2 * dm,
      draw: { t, at: ask - 0.05 },
    });
    // The decision's mark stands with its name.
    diamond(DX, YE, 22, { color: P.authority, alpha: d2 * dc, solid: true });
    // The English name breaks before its article, so "a metric" stays one phrase.
    const decisionName = nameText(
      L("支持哪个决定", ["What decision", "a metric supports"]),
      DX,
      YE + 30 + NAME_GAP,
      { valign: "top", width: 300, color: P.authority, alpha: d2 * dc },
    );
    // What is identified first with the decision, its fact source, period and boundary, is one name under it, each part
    // joining on its own words; the English stands whole on one line.
    const factAt = cue(s, "事实依据", "fact source"),
      firstAts = [
        factAt,
        cueFrom(s, "周期", "period", factAt),
        cueFrom(s, "边界", "boundary", factAt),
      ];
    growName(t, factParts, firstAts, DX, decisionName.bottom + NAME_GAP, {
      valign: "top",
      align: "center",
      width: L(300, 420),
      alpha: d2,
      build: true,
    });
    // Gaming lifts the number off the work it should describe: a dashed trace leaves the tail and climbs.
    const gm = named(t, gamed),
      lift = soon(t, gamed - 0.05, 0.9),
      G0 = 980,
      gpts = [];
    for (let x = G0; x <= X1; x += 8)
      gpts.push([x, yAt(x) - 130 * lift * ease((x - G0) / (X1 - G0))]);
    path(gpts, { color: P.unknown, alpha: d2 * gm, width: 2.5, dash: [7, 7] });
    // Named by the key words of its clause, not its caption's whole line.
    nameText(
      L("怎样被钻空子", "How it could be gamed"),
      (G0 + X1) / 2 + 40,
      yAt(X1) - 130 - NAME_GAP,
      { valign: "bottom", color: P.muted, alpha: d2 * gm },
    );
    // The anomaly: one point standing off the trace, named above it.
    const AX = 700,
      ay = yAt(AX),
      an = named(t, anomaly),
      spike = glide(t, anomaly - 0.05, 84);
    line(AX, ay - 6, AX, ay - 6 - 84 * spike, { color: P.unknown, alpha: d2 * an, width: 2 });
    dot(AX, ay - 6 - 84 * spike, 9, { color: P.unknown, alpha: d2 * an });
    nameText(L("异常", "Anomaly"), AX, ay - 100 - NAME_GAP, { valign: "bottom", alpha: d2 * an });
    // Understood through cases and mechanisms: two leaves hang from the anomaly, each on its own words.
    const xs = [AX - 150, AX + 150],
      LY = 690,
      ats = [cases, mechanisms];
    xs.forEach((x, i) => {
      const q = named(t, ats[i]);
      link(AX, ay + 14, x, LY - 48, {
        route: "vhv",
        mid: (ay + LY) / 2,
        alpha: d2 * q,
        draw: { t, at: ats[i] - 0.05 },
      });
      if (!i) documentIcon(x - 22, LY - 28, 44, 56, { alpha: d2 * q, rows: 3 });
      else {
        for (let k = 0; k < 8; k++) {
          const a = (k * Math.PI) / 4 + voiceTime(t) * 0.4;
          line(
            x + Math.cos(a) * 17,
            LY + Math.sin(a) * 17,
            x + Math.cos(a) * 26,
            LY + Math.sin(a) * 26,
            { color: P.ink, alpha: d2 * q, width: 6, cap: "butt" },
          );
        }
        ring(x, LY, 17, { color: P.ink, alpha: d2 * q, width: 4 });
      }
    });
    railNames(en ? ["Cases", "Mechanisms"] : ["案例", "机制"], xs, LY + 40, {
      gap: NAME_GAP,
      alpha: (i) => d2 * listIn(t, ats, i),
      set: "through",
    });
    ctx.restore();
  }
}

/* Stage 5: the work's course rising toward its end, and the high-risk signal escalated at once. */
export function s28Escalation(s, t, g5) {
  const [sigAt, upAt] = cues(s, [
      ["高风险的苗头", "high-risk signals"],
      ["随时上报", "at once"],
    ]),
    escAt = en ? cue(s, "", "escalate high-risk") : upAt;
  const sigName = L("高风险的苗头", "High-risk signals"),
    upName = en ? ["Escalate", " at once"] : ["随时上报"];
  // The course and the column of the alert and the person stand centred together, from the course's start to the end
  // of the wider name beside the column; the rise lifts the alert well into the band, so the stage covers it before
  // the person comes.
  const R = 22,
    RUN = 720,
    RISE = 180,
    BASE = 660,
    wide = Math.max(measure(sigName), measure(upName.join("")));
  const X0 = 960 - (RUN + R + NAME_GAP + wide) / 2,
    SX = X0 + RUN,
    SY = BASE - RISE - R,
    PY = 270;
  const course = [];
  for (let x = X0; x <= SX + 0.5; x += 8)
    course.push([Math.min(x, SX), BASE - RISE * ease(clamp((x - (SX - 320)) / 320))]);
  path(course, { color: P.line, alpha: g5, width: 3 });
  const sq = ramp(t, sigAt - 0.15, 0.4) * g5;
  path(
    course.filter(([x]) => x >= SX - 320),
    { color: P.unknown, alpha: sq, width: 3 },
  );
  ring(SX, SY, R, { color: P.unknown, alpha: sq, width: 3 });
  line(SX, SY - 11, SX, SY + 3, { color: P.unknown, alpha: sq, width: 4 });
  dot(SX, SY + 10, 3, { color: P.unknown, alpha: sq });
  nameText(sigName, SX + R + NAME_GAP, SY, { align: "left", alpha: g5 * named(t, sigAt) });
  // In English the way starts up on the words just before "at once", so it runs on from the signal without a stop.
  const wayAt = en ? upAt - 0.3 : upAt - 0.05;
  link(SX, SY - R - 8, SX, PY + 44, {
    color: P.unknown,
    alpha: g5 * ramp(t, wayAt - 0.05, 0.4),
    draw: { t, at: wayAt },
    width: 2.5,
  });
  person(SX, PY, { color: P.authority, alpha: g5 * named(t, escAt), size: 1.4 });
  growName(t, upName, en ? [escAt, upAt] : [upAt], SX + R + NAME_GAP, PY - 8, {
    valign: "middle",
    color: P.authority,
    alpha: g5,
  });
}

/* 11 data: what we see now is not what we knew then. The scene: its cues and the cuts between its stages, each stage on
 * the words that name it. */

import { ctx } from "../../canvas.js";
import { SECOND } from "../../drawing/levels.js";
import { dot, lengthOf, line, path, stroke } from "../../drawing/strokes.js";
import { ring } from "../../drawing/symbols.js";
import { illustrative } from "../../framing/chapters.js";
import { named } from "../../naming/lists.js";
import { NAME_GAP, nameText } from "../../naming/names.js";
import { CONTENT_CY } from "../../naming/placement.js";
import { P } from "../../palette.js";
import { L, en } from "../../timeline.js";
import { cue, cues } from "../../timing/cues.js";
import { clamp, ease, mix, ramp, soon } from "../../timing/easing.js";
import { DRAW_PACE, drawShare } from "../../timing/pace.js";
import { thoughtEnd, voiceTime } from "../../timing/pauses.js";
import { STAGE_CUT, stageIn, stageOut } from "../../timing/stages.js";
import { scenes } from "../registry.js";
import { s11Admission, s11PeopleDecide } from "./admission.js";
import { s11Availability, s11Correction, s11RepairedValue } from "./availability.js";
import { s11Delegation } from "./delegation.js";
import { s11Bias, s11Feed, s11Gaps } from "./gaps.js";
import { DAY, DEC, X0, X1, priceAt, series } from "./prices.js";

scenes["11"] = function (s, t) {
  // The series is the scene's object: one price history on a time axis, drawn taller than its values so it fills the
  // frame about the content centre, with its names above and below. Each stage cuts on the words that name its first mark.
  const SY = 1.6,
    AY = 800,
    yv = (v) => CONTENT_CY + (v - 552) * SY,
    py = (x) => yv(priceAt(x));
  // Sampled at every half day, so each day's close keeps its corner.
  const lift = (fn, a, b) => series(fn, a, b, DAY / 2).map(([x, v]) => [x, yv(v)]);
  const [ill, corr, decAt, eachAt, thenV, todayS] = cues(s, [
    ["虚构", "illustrative"],
    ["修正了", "corrects"],
    ["修正之前的每次决策", "simulating decisions"],
    ["每次决策时拿得到的值", "each decision time"],
    ["拿得到的值", "values available at each decision"],
    ["今天修正过的数据", "today's corrected series"],
  ]);
  const [unknownCut, afterCut, biasCut, missingCut, feedCut, agentCut, leadCut] = cues(s, [
    ["不知道每个值", "without knowing when"],
    ["如果查明", "if a value became"],
    ["偏差", "bias"],
    ["缺失", "say how missing"],
    ["今天的数据", "today's accurate feed"],
    ["在委托范围内", "within its delegation"],
    ["任务负责人", "the task lead"],
  ]);
  const admitCut = cue(s, "这就叫准入", "Admission is permission");
  // The illustrative chip stays while the same case continues, through the admission decision it ends on.
  illustrative(ramp(t, ill - 0.2, 0.6));
  // The history is recorded day by day from the first word: the series draws from its first close to today's, its
  // latest price riding its head, and it is whole before 11.1's words end, so nothing moves in the quiet that follows.
  // The history draws on from the first word within its short thought, at the tip pace: the thought leaves time for its
  // latest stretch only, so the earlier history stands with the chart and the latest days draw on, whole 0.1 s before
  // the thought's words end.
  const head = s.words[0].start,
    drawFor = Math.min(1, voiceTime(thoughtEnd(head) - 0.1) - voiceTime(head + 0.05));
  const latest = (DRAW_PACE * drawFor) / 1.5,
    history = lengthOf(lift(priceAt));
  const standing = clamp(1 - latest / history),
    draw = mix(standing, 1, drawShare(t, head + 0.05, (1 - standing) * history, drawFor));
  // The chart is the scene's object: the axis, the series as first published and the three decisions made before the
  // vendor's correction, each standing on the value it could see then. Every mark carries its name while it
  // stands: a name enters on its words and, once a later stage annotates the chart, keeps the second ink beside its
  // mark; a mark leaves only with its name, at a stage cut.
  const plot = (q, { level = SECOND, decisions = true, values = true } = {}) => {
    if (q <= 0) return;
    const nq = (at) => q * level * named(t, at);
    const seriesAt = cue(s, "历史价格", "historical prices") + 0.05;
    // The chart's two axes, the time axis with its ticks clear of the decisions' places; the series draws on them and
    // is named on its words.
    const points = lift(priceAt),
      top = Math.min(...points.map(([, y]) => y)) - 24;
    line(X0, AY, X0, top, { color: P.line, width: 2, alpha: q });
    line(X0, AY, X1, AY, { color: P.line, width: 2, alpha: q });
    for (let x = X0 + 50; x < X1; x += 100)
      if (DEC.every((d) => Math.abs(d - x) > 30))
        line(x, AY, x, AY + 10, { color: P.line, width: 2, alpha: q });
    path(points, { color: P.ink, width: 2.5, alpha: q, upto: draw });
    nameText(L("历史价格", "Historical prices"), X0 - NAME_GAP, py(X0), {
      align: "right",
      width: L(180, 300),
      alpha: q * level * ramp(t, seriesAt, 0.4),
    });
    if (decisions) {
      // The three decisions' lines are one stroke, each rising from the axis to the value it could see on its own beat,
      // so the decisions read as one set under their name rather than as separate members each waiting for a name.
      stroke(
        () =>
          DEC.forEach((x, i) => {
            const up = drawShare(t, decAt - 0.1 + i * 0.25, AY + 2 - py(x));
            if (up > 0) {
              ctx.moveTo(x, AY + 14);
              ctx.lineTo(x, mix(AY + 14, py(x) + 12, up));
            }
          }),
        { color: P.authority, width: 2, alpha: ramp(t, decAt - 0.1, 0.5) * q },
      );
      DEC.forEach((x, i) => {
        const a = ramp(t, decAt - 0.1 + i * 0.25, 0.5) * q,
          p = clamp((t - eachAt - i * 0.3) / 0.7);
        dot(x, AY, 6, { color: P.authority, alpha: a });
        if (p > 0 && p < 1)
          ring(x, AY, 8 + 16 * p, {
            color: P.authority,
            alpha: a * (1 - p) * ease(p / 0.5),
            width: 2,
          });
      });
      line(DEC[0], AY + 14, DEC[2], AY + 14, {
        color: P.authority,
        width: 2,
        alpha: q * ramp(t, decAt + 0.5, 0.5),
      });
      nameText(L("决策", "Decisions"), DEC[0] - 40, AY - 16, {
        align: "right",
        valign: "bottom",
        color: P.authority,
        alpha: nq(decAt),
      });
    }
    if (values) {
      // The values each decision could see are points of the stretch they stand on, 14 px across, details of the chart
      // under their name rather than separate members each waiting for a name.
      const thenQ = ramp(t, thenV - 0.1, 0.6);
      if (thenQ > 0)
        path(lift(priceAt, X0, DEC[2]), { color: P.evidence, width: 3.5, alpha: q * thenQ });
      DEC.forEach((x, i) =>
        dot(x, py(x), 7, { color: P.evidence, alpha: q * ramp(t, thenV - 0.1 + i * 0.2, 0.35) }),
      );
      nameText(
        L("每次决策时拿得到的值", "Values available at each decision time"),
        DEC[2] + 26,
        py(DEC[2]) - 30,
        { align: "left", valign: "bottom", width: 500, color: P.evidence, alpha: nq(thenV) },
      );
    }
  };
  // Stages 1 to 3 tell the case on one chart: its names stand at full ink while the case is told, then at the second ink
  // once stage 2 annotates it. Stage 5 brings the series back alone, stage 6 the series with its decisions.
  // The chart eases 76 px right of its axis's place as the series is named in its left margin, so the chart and the
  // names in that margin stand about the centre; it eases back from the cut that brings today's feed in from the right
  // edge. The English series' name stands whole on one line, so its chart eases 110 px right on the words that name the
  // correction, reaching its place before the series is named, and stays there, today's feed coming in over a shorter way.
  const chartDx = en
    ? 110 * soon(t, corr + 0.05, 0.7)
    : 76 *
      soon(t, cue(s, "历史价格", "historical prices") + 0.05, 0.7) *
      (1 - soon(t, feedCut + STAGE_CUT, 0.7));
  ctx.save();
  ctx.translate(chartDx, 0);
  plot(stageOut(t, biasCut), { level: mix(1, SECOND, ramp(t, unknownCut + STAGE_CUT, 0.4)) });
  plot(stageIn(t, missingCut) * stageOut(t, feedCut), { decisions: false, values: false });
  plot(stageIn(t, feedCut) * stageOut(t, agentCut), { values: false });
  ctx.restore();
  // 1. The case: the vendor corrects a stretch of prices at a date after the decisions were made on them. The stretch
  // draws as the correction is said, under its name; the test needs the values each decision could see, not today's
  // corrected data, which is that stretch, refused above its own crest, and it leaves with its names at the next cut.
  const one = stageOut(t, unknownCut);
  if (one > 0) s11Correction(s, t, yv, py, lift, corr, todayS, head, drawFor, draw, chartDx, one);
  // 2. When each value first became available is unknown: above each decision a "?" stands on the words that say it is
  // not known, and the claim that the test used only what was available then is refused under the axis. The snapshots of
  // that time replace the marks, the correction history stands at the correction date, and authorized exploration is
  // allowed beside the refused claim on the condition that the unproven timing is stated.
  const two = stageIn(t, unknownCut) * stageOut(t, afterCut);
  if (two > 0) s11Availability(s, t, AY, chartDx, two);
  // 3. A repaired value became available only at the correction date, after the decisions: it stands on the repaired crest above
  // the last decision, and the way from it down to that decision stops at a bar, since the decision could never have used
  // it. Replaced by the value known then, or excluded, the test is rerun: a sweep runs the decisions again in order.
  const three = stageIn(t, afterCut) * stageOut(t, biasCut);
  if (three > 0) s11RepairedValue(s, t, AY, yv, py, afterCut, chartDx, three);
  // 4. Bias hides in the population rather than the prices: the words that say bias hides elsewhere open on the lens
  // and those words. Each place then arrives with its rails on its own words, in the order spoken, gathered by one
  // bracket that grows down to each: a frame picks the sample, one security changes its ticker part-way, the trading
  // calendar lays out its days with one wrong, and only today's survivors are kept, the one that ended before today
  // dropped on "today" (on the bias of survivorship bias in Chinese). The four places are named in one column, each
  // beside its rails.
  const four = stageIn(t, biasCut) * stageOut(t, missingCut);
  if (four > 0) s11Bias(s, t, biasCut, four);
  // 5. The series returns with what is missing, late, conflicting and anomalous marked on it, each named under the axis
  // on its own word. The conclusion stands above the whole series, and each gap reaches up to it as the words say they
  // affect it.
  const five = stageIn(t, missingCut) * stageOut(t, feedCut);
  if (five > 0) s11Gaps(s, t, AY, py, missingCut, chartDx, five);
  // 6. Today's feed, however accurate, flows into the series' present end. The way from it back along the time axis to
  // the decisions stops at a bar before it reaches them, where when each value became available stays unknown. The feed
  // comes in from a fixed place at the frame's right edge while the chart eases back toward it.
  const six = stageIn(t, feedCut) * stageOut(t, agentCut);
  if (six > 0) s11Feed(s, t, AY, py, feedCut, chartDx, six);
  // 7. The Agent works inside its delegation on a small copy of the series: it locates the snapshots, compares the
  // revisions and reruns the test, each named in one column as it is said and shown on the copy. Its way out toward
  // admission, which stands outside the frame, stops at a bar: whether the data may be used is not the Agent's to decide.
  const seven = stageIn(t, agentCut) * stageOut(t, admitCut);
  if (seven > 0) s11Delegation(s, t, agentCut, seven);
  // 8. Admission is permission for one specific use under stated conditions: the data waits at a closed gate; under the
  // conditions checked at the gate it opens, and one way runs through it to one use, which stands as the gate opens.
  // The Chinese opens the thought by naming admission, the English names it a sentence earlier and opens on that sentence's first
  // words, "Admission is permission", so the stage cut no longer falls inside a sentence (EN40-8).
  // The Chinese names the use only at the thought's end, so the data waits near enough to the gate that the stage is
  // balanced before the use arrives.
  const eight = stageIn(t, admitCut) * stageOut(t, leadCut);
  if (eight > 0) s11Admission(s, t, admitCut, eight);
  // 9. People decide. The task lead stands with the evidence, the snapshots found, and the open risks beside them; on the
  // words that hand them over one orthogonal way draws on from them to the frame of authority, and a point runs along
  // it. The frame stands with the decision owner, sized to the owner, and widens to hold the acceptor as they are
  // named; each figure arrives on its own words and is named under it.
  const nine = stageIn(t, leadCut);
  if (nine > 0) s11PeopleDecide(s, t, leadCut, nine);
};

/* 27 evolve: detect drift before failure. The scene: its cues and the cuts between its stages, each stage on the words
 * that name it. */

import { dot, line, path } from "../../drawing/strokes.js";
import { ring } from "../../drawing/symbols.js";
import { illustrative, opening } from "../../framing/chapters.js";
import { P } from "../../palette.js";
import { en } from "../../timeline.js";
import { cue, cues } from "../../timing/cues.js";
import { ramp } from "../../timing/easing.js";
import { pauseHold } from "../../timing/pauses.js";
import { stageIn, stageOut } from "../../timing/stages.js";
import { scenes } from "../registry.js";
import { s27Anomaly, s27SameMetric, s27SmallSignals } from "./drift.js";
import { s27Forms, s27OrderOfChoice } from "./safeguard.js";
import { s27Conditions, s27Threshold } from "./watch.js";

scenes["27"] = function (s, t) {
  // 27.1 opens on the small changes and names the defect they may signal: the line stands on the first words, the
  // defect at its end inks in and is named on its own words.
  const changes = cue(s, "有些小变化", "small changes"),
    defects = cue(s, "工作体系有缺陷", "system defect");
  // The small signals in spoken order, seven in both editions.
  const signals = en
    ? cues(s, [
        ["", "definitions drifting"],
        ["", "questions recurring"],
        ["", "people stepping"],
        ["", "evidence expiring"],
        ["", "ownership blurring"],
        ["", "intermittent failures"],
        ["", "slight delays"],
      ])
    : cues(s, [
        ["定义慢慢变了", ""],
        ["同样的问题", ""],
        ["临时靠人救火", ""],
        ["证据过期", ""],
        ["责任说不清", ""],
        ["偶尔出错", ""],
        ["略有延迟", ""],
      ]);
  const [anomaly, trend, pattern, impact, direction] = cues(s, [
    ["一次异常", "one anomaly"],
    ["看成趋势", "not a trend"],
    ["先看苗头的规律", "check the pattern"],
    ["影响", "impact"],
    ["走向", "direction"],
  ]);
  const [metric, weekly, signal] = cues(s, [
    ["同一个指标", "the same metric"],
    ["每周都有人问", "asks every week"],
    ["这就是一个苗头", "that is a signal"],
  ]);
  const conds = cues(s, [
    ["同类问题反复出现", "the same kind of problem recurs"],
    ["重要判断", "an important judgment rests"],
    ["交给智能体反复做", "agents will repeat"],
  ]);
  const [material, leave] = cues(s, [
    ["实质风险", "brings material risk"],
    ["留下能复用的预防措施", "leave reusable prevention"],
  ]);
  const forms = cues(s, [
    ["测试", "a test"],
    ["监控", "monitor"],
    ["清单", "checklist"],
    ["决策记录", "decision record"],
    ["更清楚的分工", "ownership and handoffs"],
  ]);
  const [improve, fresh, lightest] = cues(s, [
    ["先改已有的", "improve what exists"],
    ["再考虑新建", "creating something new"],
    ["选够用的最轻的那种", "choose the lightest form"],
  ]);
  const watch = cue(s, "留意这几种", "watch for these");
  const base = ramp(t, opening(s), 0.7),
    example = Math.min(metric, weekly);
  // The weekly question about one metric is an illustrative case. The chip arrives with it and leaves in its stage's own
  // cut on "watch for these", so the general conditions that follow never carry it.
  illustrative(ramp(t, pauseHold(example - 0.2, 0.4), 0.4) * stageOut(t, watch) * base);
  // One metric line carries the scene. It runs from X0 to X1 along its base Y0, read against a short axis; each stage
  // reshapes it (small bumps, one spike, a drift) and names what it shows.
  const X0 = 200,
    X1 = 1680,
    Y0 = 520,
    B = 556;
  // A problem that keeps coming back: a ring with an exclamation mark drawn in strokes.
  const problem = (x, y, r, alpha) => {
    dot(x, y, r - 1, { color: P.ground, alpha });
    ring(x, y, r, { color: P.unknown, alpha, width: 2.5 });
    line(x, y - r * 0.5, x, y + r * 0.12, { color: P.unknown, alpha, width: 3 });
    dot(x, y + r * 0.45, 2.2, { color: P.unknown, alpha });
  };
  const s27Line = (
    yAt,
    alpha,
    { upto = 1, draw = null, x0 = X0, x1 = X1, y0 = Y0, axis = alpha } = {},
  ) => {
    const pts = [];
    for (let x = x0; x <= x1; x += 6) pts.push([x, yAt(x)]);
    line(x0 - 12, y0 + 24, x0 - 12, y0 - 176, { color: P.muted, alpha: axis, width: 2 });
    for (let k = 0; k <= 2; k++)
      line(x0 - 12, y0 - k * 80, x0, y0 - k * 80, { color: P.muted, alpha: axis, width: 2 });
    path(pts, { color: P.ink, alpha, width: 3, upto, draw });
    return pts;
  };
  // 1. Many defects begin as small signals: the line runs on toward a defect at its end, and each small signal bumps the
  // line at its place on its own words, the names building into one rail below.
  const one = base * stageOut(t, anomaly);
  if (one > 0) s27SmallSignals(t, changes, defects, signals, X0, X1, Y0, s27Line, one);
  // 2. One anomaly is not a trend: the line spikes once. Carrying the spike's level on as a trend is refused at a bar;
  // the three checks build into a rail below the line, each under its mark: the pattern of the points before the
  // spike, the impact the spike measures, and the direction the line takes after it.
  const two = base * stageIn(t, anomaly) * stageOut(t, example);
  if (two > 0) s27Anomaly(t, anomaly, trend, pattern, impact, direction, Y0, s27Line, two);
  // 3. For example, the same metric: one week after another a question hangs below the line as someone asks again,
  // each bumping the line a little. When the words call it a signal, the recurring questions are enclosed as one.
  const three = base * stageIn(t, example) * stageOut(t, watch);
  if (three > 0) s27SameMetric(t, metric, weekly, signal, X0, Y0, s27Line, three);
  // 4. Watch for these conditions. Each is a row across the same work cycles, so each signal shows as what happens over
  // time: the same problem comes back cycle after cycle and reaches more people, a project and more cycles; important
  // judgments all hang from one person, with nothing written down; something done in every cycle is forgotten in one,
  // and a material loss follows; and the same work goes to an Agent again and again. The conditions are a watch list: a
  // card headed by the stage's name from its words; each condition's row arrives on the condition's first words, and
  // the card and the work cycles across it lengthen to take each row as it arrives. Each event draws on its own words,
  // and each condition's name arrives beside the row where it happens. The card stands centred as it grows: it stands
  // half a row lower for each row still to come and rises by that half row as the card makes room for the next.
  const these = cue(s, "这些情况", "when any of these"),
    four = base * stageIn(t, watch) * stageOut(t, these);
  if (four > 0) s27Conditions(s, t, conds, watch, problem, four);
  // 5. These conditions, once they bring material risk: the drifting line rises from them toward a threshold well before
  // the failure at its end. A reusable safeguard is left where it crosses, and from there the line runs level again,
  // below the threshold, so the failure never comes. The stage opens on the words that name these conditions, with
  // the four conditions standing at the line's start in small, under their name.
  const kinds = cue(s, "预防措施可以是", "prevention can be"),
    five = base * stageIn(t, these) * stageOut(t, kinds);
  if (five > 0) s27Threshold(s, t, material, leave, X0, B, problem, s27Line, these, five);
  // 6. A safeguard can take five forms: they hang from it on one trunk and one crossing row, which stand from the
  // stage's first words, the words that say what prevention can be; each form draws its drop and appears on its own
  // words, the names on one baseline below. The drops stand at one pitch, so the middle form hangs on the trunk.
  // The forms hold until the order of choice begins its sentence, and hand the picture to it in one cut.
  const six = base * stageIn(t, kinds) * stageOut(t, improve);
  if (six > 0) s27Forms(t, forms, kinds, six);
  // 7. The order of choice runs along one rail: the safeguard that exists, improved, stands first; something
  // new, not yet made, stands after it as a dashed outline on the words that name it, when the way to it draws on.
  // Choosing the lightest form that works rings the first. The stage cuts in on the sentence's first words, which
  // improve what exists: the safeguard stands at its place, named on those words, and the way on from it draws on as a
  // muted dashed run toward the place of something new; the new outline and its name come on their words, and the way
  // draws on firm over the run. Until then the stage stands 43 px right, about what stands, and eases to its place as
  // something new is named.
  const seven = base * stageIn(t, improve);
  if (seven > 0) s27OrderOfChoice(t, improve, fresh, lightest, seven);
};

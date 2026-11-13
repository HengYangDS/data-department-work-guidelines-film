/* 28 evolve: growing through real work. The scene: its cues and the cuts between its stages, each stage on the words
 * that name it. */

import { opening } from "../../framing/chapters.js";
import { cue, cues } from "../../timing/cues.js";
import { ramp } from "../../timing/easing.js";
import { stageIn, stageOut } from "../../timing/stages.js";
import { scenes } from "../registry.js";
import { s28Balance } from "./balance.js";
import { s28Coaching, s28RealWork } from "./coaching.js";
import { s28Escalation, s28Score } from "./score.js";

scenes["28"] = function (s, t) {
  const [grows, boundary] = cues(s, [
    ["能力在真实的工作里成长", "capability grows"],
    ["边界和成功标准", "the boundary and success"],
  ]);
  const [coaching, notJudge, weak, noDirection] = cues(s, [
    ["辅导是检验成员的推理", "coaching tests"],
    ["不是替他们判断", "without making the judgment"],
    ["逻辑弱", "weak logic"],
    ["给不出方向", "gives no direction"],
  ]);
  const fb = cues(s, [
    ["说法", "proposition"],
    ["证据", "evidence"],
    ["行为", "behavior"],
    ["后果", "consequence"],
  ]);
  // The stage of risks opens on its first words: "some risks" in Chinese, the qualities that cannot outweigh them in
  // English.
  const someRisks = cue(s, "有些风险", "fluency effort");
  const weights = cues(s, [
    ["再流畅", "fluency"],
    ["再努力", "effort"],
    ["智能体再高效", "agent efficiency"],
  ]);
  const risks = cues(s, [
    ["没核实的", "fabricated"],
    ["没核验当前版本", "completion claimed"],
    ["智能体的输出", "agent output"],
  ]);
  // Chinese opens the scoring with "if work is scored"; the score itself is said next, as in English.
  const [score, deliveryRisk, noLabel, metric, decision, gamed, anomaly, cases, mechanisms] = cues(
    s,
    [
      ["如果给工作打分", "if work is scored"],
      ["交付风险", "delivery risk"],
      ["不能给人贴标签", "never label a person"],
      ["看指标", "first identify what decision"],
      ["支持哪个决定", "first identify what decision"],
      ["钻空子", "could be gamed"],
      ["出了异常", "investigate anomalies"],
      ["案例", "cases"],
      ["机制", "and mechanisms"],
    ],
  );
  // The escalation of high-risk signals cuts in on the words that open it: in Chinese its thought's first words, in
  // English the sentence that closes the scoring's thought.
  const signalCut = cue(s, "高风险的苗头", "escalate high-risk");
  const base = ramp(t, opening(s), 0.7);
  // 1. Capability grows through real work. One task is a rail the member walks, named as the real work on its words,
  // stopping where the guidelines say to look: at the start, at important decisions and after delivery. The rail then
  // steps up to the next task, and the member climbs the step on the agreed improvement. Each station is named below the
  // rail by its moment and its action, each part on its own words; the stations build into one list that stays while
  // the rail stands.
  const g1 = base * stageOut(t, coaching);
  if (g1 > 0) s28RealWork(s, t, grows, boundary, g1);
  // 2. Coaching tests a member's reasoning without making the judgment for them. The reasoning is a rail from the member
  // to the judgment at its end; the member and the rail arrive with the words that name the reasoning, which name them
  // beside the member, along which the coach's probe then walks, and the coach's own way toward the judgment stops at a
  // bar on the words that refuse it. The judgment, the member's own, arrives and is named on its word. Feedback names
  // the stations, each taking its colour and name on its own words, one list under the rail; a label like "weak logic"
  // is refused below the chain, attached to none of it. The stage stands low enough that the coach above it and the
  // feedback below it balance on the centre. The coaching name hangs out at the stage's left, so the stage stands right
  // of its drawn place: 25 px in Chinese, where the whole stage centres, and 30 px in English while the reasoning waits
  // for its judgment. English, whose judgment has the longer name, eases back to its drawn place on the judgment's
  // words, so its light tray takes the member's place at the next cut.
  const g2 = base * stageIn(t, coaching) * stageOut(t, someRisks);
  if (g2 > 0) s28Coaching(s, t, coaching, notJudge, weak, noDirection, fb, g2);
  // 3. Fluency, effort and Agent efficiency never make up for some risks. A balance stands from the stage's first words: the
  // three qualities land on the light tray on their words and tip it a little, then the first risk outweighs them all
  // and the beam stays put while the rest of the risks build one column on the heavy tray, each a key phrase on one
  // line, with a short qualifier under it where the risk needs one, each in one slot so the column keeps one pitch, and
  // its weight on the tray as it is named. Both columns stand their weights one inset in from their tray's end.
  const g3 = base * stageIn(t, someRisks) * stageOut(t, score);
  if (g3 > 0) s28Balance(s, t, weights, risks, g3);
  // 4. If work is scored, the score expresses delivery risk and must never label a person: a pair, the delivery left of
  // centre with the score's gauge filling it, and the person whose work it is on the right, the two standing centred
  // together from the words that score the work, on which the stage opens and the score is named. The
  // way from the score toward the person stops at a bar on the words that refuse it, and the refused label stands
  // under the bar. The metric's questions then take the picture in one cut on their words.
  const g4 = base * stageIn(t, score) * stageOut(t, signalCut);
  if (g4 > 0)
    s28Score(
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
    );
  // 5. A high-risk signal is escalated at once. The work's course runs across the lower band from the stage's first
  // words, calm until it rises toward its end: that rise is the early sign of high risk, its alert standing at the
  // rise's tip and named beside it on its words. On the words that escalate it, its way runs straight up from the alert
  // to the person it goes to, who stands above it and is named beside it. The stage holds to the scene's end.
  const g5 = base * stageIn(t, signalCut);
  if (g5 > 0) s28Escalation(s, t, g5);
};

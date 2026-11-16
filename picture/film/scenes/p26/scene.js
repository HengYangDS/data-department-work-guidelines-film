/* 26 evolve: what learning is for. The scene: its cues and the cuts between its stages, each stage on the words that
 * name it. */

import { opening } from "../../framing/chapters.js";
import { en } from "../../timeline.js";
import { cue, cues } from "../../timing/cues.js";
import { ramp } from "../../timing/easing.js";
import { stageIn, stageOut } from "../../timing/stages.js";
import { scenes } from "../registry.js";
import { s26Learning } from "./learning.js";
import { s26Candidates, s26StillToShow } from "./practice.js";
import { s26Retire, s26Safeguard } from "./safeguards.js";

scenes["26"] = function (s, t) {
  const practice = cue(s, "全部门的做法", "department practice");
  const kinds = cues(s, [
    ["规则", "a rule"],
    ["模板", "template"],
    ["工具", "tool"],
    ["智能体流程", "Agent workflow"],
    ["平台机制", "platform mechanism"],
  ]);
  const needs = cues(s, [
    ["观察到的问题", "observed problem"],
    ["有依据的实质风险", "a substantiated material risk"],
    ["必须履行的义务", "an applicable obligation"],
  ]);
  const [falls, cost, small, maintainer] = cues(s, [
    ["现有边界", "why the existing boundaries"],
    ["新做法要多花多少", "the new practice's cost"],
    ["小范围试点", "a bounded trial"],
    ["谁来维护", "a named owner"],
  ]);
  // Chinese opens what must still be explained by counting it, "three things", so the stage that holds them cuts on
  // those words; English cuts on the first of them.
  const explain = cue(s, "还要做到三件事", "why the existing boundaries");
  const [safeguards, noWait] = cues(s, [
    ["必要的保障", "necessary safeguards"],
    ["不能等", "must not wait"],
  ]);
  const retire = cue(s, "就撤掉", "retire a rule");
  // Chinese names the rule before its reasons and retires it last; English retires the rule first.
  const ruleAt = cue(s, "规则要是", "retire a rule");
  // The reasons in spoken order: Chinese names the rule first and then its four reasons; both editions name what the
  // rule governs before its users, and the English first reason arrives with the words that give it, "nothing left to
  // govern".
  const reasons = en
    ? cues(s, [
        ["", "nothing left to govern"],
        ["", "no user"],
        ["", "duplicates a source"],
        ["", "costs more"],
      ])
    : cues(s, [
        ["失去适用对象", ""],
        ["没人用", ""],
        ["和权威来源重复", ""],
        ["得不偿失", ""],
      ]);
  const reasonNames = en
    ? [
        "Nothing left to govern",
        "No user",
        "Duplicates a source of truth",
        "Costs more than it returns",
      ]
    : ["失去适用对象", "没人用", "和权威来源重复", "得不偿失"];
  const base = ramp(t, opening(s), 0.7);
  // Department practice is one seal at one place in stages 2 and 3, so it stands still across their cut.
  const PRACTICE_X = 1430,
    PRACTICE_R = 60;
  // 1. What learning is for, on one lane of the next time, a track rather than a panel to fill, which stands from the
  // chapter's first words, with its way running along it from those words. Chinese names the lane by the next time and
  // the failure on it by its own word, as it says 下一次失败; English, which says "the next failure", names the failure
  // alone, at the start of the lane. Each name stands from the first words of the clause that says it, as a name may, so
  // the opening words are not left unnamed: the Chinese clause after 学习的目的, the English sentence; and Chinese names
  // its first clause too, what the lane is for, 学习的目的 over the lane's start on those words, so the lane never
  // stands unnamed through them. On the words that say it is found earlier, the place it is found stands near it while
  // the place it used to be found stays as a muted trace further on, and the time gained lights along the lane from the
  // old place to the new; no mark slides. The manual rescue it takes stands behind it as a long band on its words and
  // shrinks, leaving the muted outline of its old reach. More files are refused beside the lane.
  const g1 = base * stageOut(t, kinds[0]);
  if (g1 > 0) s26Learning(s, t, g1);
  // 2. The way into department practice. The five kinds of candidate build one column, each with its emblem (a rule's
  // page, a template's blank form, a tool, an Agent, a platform's wheel), and merge into one way, which splits into three
  // lanes: an observed problem, a substantiated material risk or an applicable obligation, any one of which gives the
  // reason, and the lanes rejoin before practice. Each candidate arrives with its link into the way on its own words, and the way runs
  // on from the junction toward practice as the first arrives, ahead of practice, which takes its seal and name on its
  // own words; so the stage stands about the centre while it builds and once it is whole. That straight way is the
  // middle lane; each need's mark and name arrive on its own words, and the other two lanes draw round with their needs.
  const judged = Math.min(retire, reasons[0], ruleAt);
  const g2 = base * stageIn(t, kinds[0]) * stageOut(t, explain);
  if (g2 > 0) s26Candidates(t, practice, kinds, needs, PRACTICE_X, PRACTICE_R, g2);
  // 3. What the candidate must still show, as one column of conditions, each checked on its own words and named by its
  // key words. Chinese counts them as three things: why the existing boundaries, interfaces and feedback fall short with
  // what the new practice costs to learn and maintain, a small trial that weighs the evidence, and who maintains it and
  // when it is revised or withdrawn. English keeps four: the existing boundaries, interfaces and feedback falling
  // short, the new practice's cost to understand and maintain, a bounded trial with evidence of net benefit, and a named
  // owner with triggers for revision or retirement. Every condition's qualifier stands under its name, and the conditions stand at one gap, so the
  // Chinese column, whose conditions all carry one, keeps one pitch. A light bracket encloses
  // the column as it builds, lengthening just before each condition arrives, and its rows stand close enough that it is
  // always more than half filled; one link runs from it to department practice once it reaches the link's level; the
  // seal is stamped once the last condition has been named.
  const g3 = base * stageIn(t, explain) * stageOut(t, safeguards);
  if (g3 > 0)
    s26StillToShow(s, t, falls, cost, small, maintainer, explain, PRACTICE_X, PRACTICE_R, g3);
  // 4. Necessary safeguards do not wait: the safeguard stands now on the left, and the two things it must not wait for,
  // an incident or a new practice's admission, stand together on the right inside one bracket, which opens with the incident
  // and lengthens to take the admission on its words. The way from the safeguard toward them draws on with the words
  // that refuse the wait and stops halfway at a short bar. Below, the safeguard stands on existing authority, and a
  // trial only chooses and verifies how to meet it. English names the safeguard with the wait it refuses. Chinese names the refused
  // wait under the bar, lights the safeguard again as such a safeguard is said to take a trial too, and names the trial on its word, what it only
  // does, choosing how and verifying it, joining on its own words; whether to meet the safeguard, which the trial never
  // decides, is refused after them on its words. The Chinese safeguard stands nearer the centre, so the stage is
  // balanced before the things it must not wait for arrive, and larger, its check with it, so the stage covers a tenth
  // of the frame's band while it stands alone.
  const g4 = base * stageIn(t, safeguards) * stageOut(t, judged);
  if (g4 > 0) s26Safeguard(s, t, safeguards, noWait, g4);
  // 5. Retire a rule that no longer earns its place. Any one of four reasons retires it: the reasons build into one
  // column, each on its words, and one bracket joins them to the rule; the bracket opens with the first reason and
  // lengthens just before each next one, its rows close enough that it stays more than half filled, and its link to the
  // rule joins it once it reaches the link's level. The rule stands from the stage's first words and is set aside as
  // retired on the words that retire it. Chinese names the rule first and retires it after its reasons; in English the
  // retirement is said first, so the rule stands retired before its reasons arrive.
  const g5 = base * stageIn(t, judged);
  if (g5 > 0) s26Retire(t, retire, reasons, reasonNames, judged, g5);
};

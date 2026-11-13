/* 08 decide: diagnose the failure, compare the options. The scene: its cues and the cuts between its stages, each stage
 * on the words that name it. */

import { opening } from "../../framing/chapters.js";
import { en } from "../../timeline.js";
import { cueFrom, cues } from "../../timing/cues.js";
import { ramp } from "../../timing/easing.js";
import { stageIn, stageOut } from "../../timing/stages.js";
import { scenes } from "../registry.js";
import { s08Decision, s08NewFacts, s08Options, s08Recommendation } from "./choice.js";
import { s08Layers, s08Timeline } from "./diagnosis.js";

scenes["08"] = function (s, t) {
  const [
    two,
    choose,
    options,
    statusQuo,
    notProve,
    recommend,
    premise,
    objection,
    first,
    revisit,
    authorized,
    overturn,
  ] = cues(s, [
    ["只做前两层", "only the first two"],
    ["做选择时", "when choosing"],
    ["可行的方案", "feasible options"],
    ["维持现状", "status quo"],
    ["证明不了它合适", "does not prove"],
    ["推荐方案时", "a recommendation"],
    ["前提", "premises"],
    ["最有力的反对意见", "strongest objection"],
    ["第一步", "first step"],
    ["什么情况下重新考虑", "trigger a revisit"],
    ["决定，由决策负责人做", "decision owner decides"],
    ["新的事实推翻了结论", "new facts overturn"],
  ]);
  const layers = cues(s, [
    ["控制影响", "containment"],
    ["修复", "repair"],
    ["防止再发生", "prevention"],
  ]);
  const criteria = cues(s, [
    ["收益", "benefit"],
    ["成本", "cost"],
    ["风险", "risk"],
    ["可逆性", "reversibility"],
    ["机会成本", "opportunity cost"],
  ]);
  const badgeAts = cues(s, [
    ["新颖", "novelty"],
    ["完整", "completeness"],
    ["流行", "popularity"],
  ]);
  const base = ramp(t, opening(s), 0.7);
  // 1. Diagnosis on one timeline. Its rail stands from the first words, which mark the failure on it and name it above
  // its mark, and the record's moments are swept in along it as the timeline is said to be kept. The direct cause is
  // found on it, and the existing system's two checks, prevention before the cause and detection after it, stand as
  // questions on the words that ask why neither caught it. The system spans them as one light bracket above the rail;
  // the stations' names share one baseline below it.
  const [failed, kept, timeline, found, system, toPrevent, toDetect] = cues(s, [
    ["出了问题", "something fails"],
    ["最初的症状", "original symptom"],
    ["时间线", "timeline"],
    ["直接原因", "direct cause"],
    ["现有的工作体系", "the existing"],
    ["预防", "prevent"],
    ["发现", "detect"],
  ]);
  const one = base * stageOut(t, layers[0]);
  if (one > 0) s08Timeline(s, t, failed, kept, timeline, found, system, toPrevent, toDetect, one);
  // 2. Three layers of response in one stack, the shallowest on top: containment, repair and prevention stand in order,
  // each on its own words. Doing only the first two is bracketed and refused, and checks mark those two while
  // prevention's mark stays an open, dashed ring; the fix at the root (a systemic fix in English) is the bracket that
  // encloses all three. The Chinese names the first two a fix of the symptom, not of the root.
  const lay = base * stageIn(t, layers[0]) * stageOut(t, choose);
  if (lay > 0) s08Layers(s, t, two, layers, lay);
  // 3. Choosing: the feasible options stand side by side as the columns of one table, the status quo among them, and one
  // basis runs across every column as its rows, so the rows themselves show that it is one. The stage cuts in on the
  // words that call for a choice, its first mark, with the options it chooses between as the heads of their columns;
  // the options' bracket joins them as they are named, and the status quo's column on its own words. Each column grows
  // down with each criterion's row, which arrives across all the options on its own words and scores them. Novelty,
  // completeness and popularity follow beside the table and are refused there: they do not prove a fit.
  const cmp = base * stageIn(t, choose) * stageOut(t, recommend);
  if (cmp > 0) s08Options(s, t, choose, options, statusQuo, notProve, criteria, badgeAts, cmp);
  // 4. A recommendation states four things: a document whose spine reaches each of its parts, one row each, built in
  // the order spoken. The spine grows from the document to each part as it is named and the part's mark stands at the
  // end of its branch. The part being named lights its mark; the parts stay while the recommendation stands.
  const rec = base * stageIn(t, recommend) * stageOut(t, authorized);
  if (rec > 0) s08Recommendation(t, recommend, premise, objection, first, revisit, rec);
  // 5. The decision owner decides: the owner's way runs straight to the decision and seals it. The phrases that are
  // not decisions ("agreed in principle", "keep looking", "keep going") leave the same way on branches toward the
  // decision and stop at bars short of it: none decides. Instead, a matter not yet decided says which state it is in,
  // each on its own words beneath them: ready for the decision, its page prepared beside a seal not yet set; blocked, its
  // way stopped at a bar; or deferred, set aside beside a clock. The decision is named on its own spoken word: "决定"
  // opens the zh sentence, "decides" closes the en one.
  const [holder, notDecision, decisionName] = cues(s, [
    ["决策负责人", "decision owner"],
    ["都不是决定", "are not decisions"],
    ["决定，由", "decides"],
  ]);
  const decides = cueFrom(s, "做", "decides", holder);
  const said = en
    ? cues(s, [
        ["", "agreed in principle"],
        ["", "keep looking"],
        ["", "keep going"],
      ])
    : cues(s, [
        ["原则上同意", ""],
        ["再看看", ""],
        ["继续推进", ""],
      ]);
  const phrases = en
    ? ["“Agreed in principle”", "“Keep looking”", "“Keep going”"]
    : ["“原则上同意”", "“再看看”", "“继续推进”"];
  // Each phrase arrives on its own words. The English first phrase is its caption line, a quotation with its comma,
  // which the sync audit counts as quoted (filmkit 0.21.0).
  const shown = said;
  const dec = base * stageIn(t, authorized) * stageOut(t, overturn);
  if (dec > 0) s08Decision(s, t, holder, notDecision, decisionName, decides, phrases, shown, dec);
  // 6. New facts overturn a conclusion: along one way in time the conclusion stands first, a stamped page, the new facts
  // arrive after it as a page of their own and cross it out, and the way runs on to the prompt correction, a newly
  // stamped page. The sunk costs lie below the old conclusion and reach up to hold on to it and are stopped at a bar:
  // they are not a reason to keep it.
  const [conclusion, overturned, correct, defend, sunkCue] = cues(s, [
    ["结论", "conclusion"],
    ["推翻了", "overturn"],
    ["就改", "correct it"],
    ["别被沉没成本绑住", "defending sunk costs"],
    ["沉没成本", "sunk costs"],
  ]);
  const fix = base * stageIn(t, overturn);
  if (fix > 0) s08NewFacts(t, overturn, conclusion, overturned, correct, defend, sunkCue, fix);
};

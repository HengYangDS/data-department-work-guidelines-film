/* 24 communicate: statements that can be checked. The scene: its cues and the cuts between its stages, each stage on
 * the words that name it. */

import { opening } from "../../framing/chapters.js";
import { cue, cues } from "../../timing/cues.js";
import { ramp } from "../../timing/easing.js";
import { stageIn, stageOut } from "../../timing/stages.js";
import { scenes } from "../registry.js";
import { s24Challenge, s24Checkable } from "./challenge.js";
import { s24Gates, s24Meeting } from "./meeting.js";

scenes["24"] = function (s, t) {
  const [meet, decisions, transcripts] = cues(s, [
    ["会议", "Meetings"],
    ["决定", "decisions"],
    ["流水账", "transcripts"],
  ]);
  const align = cue(s, "开会先核对", "Align");
  const base = ramp(t, opening(s), 0.7);

  // 1. A meeting is a table with its people seated round it. Its one output is a decision, linked out from the table;
  // the way on to a transcript closes at a bar. The meeting, its decision and the refused transcript stand centred as
  // one group. The stage holds until the meeting's order is named.
  const one = base * stageOut(t, align);
  if (one > 0) s24Meeting(t, meet, decisions, transcripts, one);

  // 2. The meeting's way is a rail with two gates, each standing on the words that name it: alignment of facts and
  // definitions (in Chinese, checking the facts and unifying the definitions) opens the first, and only then does the
  // question pass on to the comparison of options. Where the way ends a disagreement stands split in two, and a probe
  // searches the five layers it may lie in, a column that builds as each layer is named. The rail stands about the
  // centre until the layers are named, and on the words that send the probe to them (in Chinese "找", in English
  // "disagreement") the stage moves left, so it stands centred with the layers' column, settling before the probe's
  // first branch reaches its layer, so no mark moves as that branch arrives.
  const [alignAt, defs, compare, options, split, locate] = cues(s, [
    ["核对", "Align"],
    ["定义", "definitions"],
    ["再比方案", "comparing"],
    ["方案", "options"],
    ["分歧", "disagreement"],
    ["找", "locate"],
  ]);
  const layers = cues(s, [
    ["在事实", "in facts"],
    ["推论", "inference"],
    ["价值取向", "values"],
    ["资源", "resources"],
    ["权限", "authority"],
  ]);
  const challenge = cue(s, "质疑说法", "Challenge");
  const two = base * stageIn(t, align) * stageOut(t, challenge);
  if (two > 0) s24Gates(s, t, align, alignAt, defs, compare, options, split, locate, layers, two);

  // 3. What is challenged are the parts of what is said: the challenge is a lens at the head of one rail, and a claim
  // (in English, a proposition), its evidence and its cost arrive on the rail as three cards, each on its own words,
  // each lit while it is named. The way on from the cost to the person stops at a bar, and personalities and motives
  // are refused beside the person. The lens and its rail, which runs to the last card's place, stand centred until that
  // card is named; on its words the stage moves left, so the lens, the rail and the cards stand centred, and on the
  // words that turn to the person it moves left again, so it stands centred with the bar, the person and the refused
  // reading. Where those words follow too closely for two glides, the stage moves left once, arriving as the words turn
  // to the person.
  const parts = cues(s, [
    ["说法", "propositions"],
    ["证据", "evidence"],
    ["代价", "costs"],
  ]);
  const [never, personal, motive] = cues(s, [
    ["不质疑", "never"],
    ["人格", "personalities"],
    ["动机", "motives"],
  ]);
  const updates = cue(s, "汇报、答复", "In updates");
  const three = base * stageIn(t, challenge) * stageOut(t, updates);
  if (three > 0) s24Challenge(t, challenge, parts, never, personal, motive, three);

  // 4. In updates, say what another person can check. What is said is a card between its speaker and another person,
  // who reads it through a lens; the title above names what the card should hold. First the principle: the card is
  // ticked on "check". Then each vague phrase opens its own card on its words and is struck there, and the statements
  // that replace it are added beneath it on their own words, each with the mark of what it states: a check that passed,
  // the acceptor still to confirm, with the day the conclusion is due, the Agent's facts, what you verified, how far the
  // conclusion reaches. The Chinese due day reads 周五前 beside its calendar leaf, the spoken words before the conclusion,
  // as a label may not repeat its caption's whole line 周五前给结论. The card
  // lengthens to take each statement as it comes, and the next phrase replaces the card in one cut.
  const four = base * stageIn(t, updates);
  if (four > 0) s24Checkable(s, t, updates, four);
};

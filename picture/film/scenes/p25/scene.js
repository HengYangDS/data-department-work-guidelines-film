/* 25 communicate: fidelity, clarity, elegance. The scene: its cues and the cuts between its stages, each stage on the
 * words that name it. */

import { dot } from "../../drawing/strokes.js";
import { ring } from "../../drawing/symbols.js";
import { illustrative, opening } from "../../framing/chapters.js";
import { named } from "../../naming/lists.js";
import { NAME_GAP, nameText } from "../../naming/names.js";
import { P } from "../../palette.js";
import { L, en } from "../../timeline.js";
import { cue, cueFrom, cues } from "../../timing/cues.js";
import { ramp } from "../../timing/easing.js";
import { stageIn, stageOut } from "../../timing/stages.js";
import { scenes } from "../registry.js";
import { s25Mechanisms, s25ThreeAims } from "./aims.js";
import { s25ClarityChecks, s25OutsideReader } from "./clarity.js";
import { s25Escalation } from "./escalation.js";
import { s25ClarityExample, s25FidelityExample } from "./examples.js";

scenes["25"] = function (s, t) {
  const triad = cues(s, [
    ["信达", "fidelity clarity"],
    ["达雅", "clarity and elegance"],
    ["雅次序", "elegance in that"],
  ]);
  const [order, fidelity, clarity, elegance] = cues(s, [
    ["次序不能颠倒", "in that order"],
    ["信是忠于原意", "fidelity preserves"],
    ["达是在准确理解之后", "clarity begins"],
    ["雅是凭品位", "elegance brings"],
  ]);
  const [
    example,
    twoHours,
    write,
    roughly,
    fidelityIs,
    firstLead,
    decisionNeeded,
    detail,
    clarityIs,
  ] = cues(s, [
    ["采集晚了两个小时", "collection ran two hours late"],
    ["晚了两个小时", "two hours late"],
    ["就写晚了两个小时", "writing two hours late"],
    ["基本按时", "roughly on time"],
    ["这是信", "fidelity means"],
    ["结论", "conclusion"],
    ["需要谁来决定", "the decision needed"],
    ["细节", "the detail"],
    ["这是达", "clarity means"],
  ]);
  const [concrete, onePoint, terms, beforeSend, outsider] = cues(s, [
    ["有具体的标准", "clarity has concrete checks"],
    ["一段只讲一个意思", "one point per paragraph"],
    ["重要的术语", "important terms"],
    ["发出之前", "before sending"],
    ["局外人", "a reader outside"],
  ]);
  const restate = [
    cue(s, "结论", "conclusion", { last: true }),
    cue(s, "依据", "basis"),
    cue(s, "限度", "limits", { last: true }),
    cue(s, "下一步", "next action"),
  ];
  // Both editions name each part before what it holds, the Chinese by its number (一是风险, 二是影响, 三是控制影响,
  // 四是决定), so each part's cue is its name and the facts follow the impact.
  const [escalate, risk, facts, impact2, safe, contain, effect, options, costs, recommend, who] =
    cues(s, [
      ["上报风险", "escalating a risk"],
      ["一是风险", "the risk"],
      ["有哪些事实", "the facts"],
      ["二是影响", "its impact"],
      ["最晚什么时候决定还来得及", "latest safe time to decide"],
      ["三是控制影响", "containment"],
      ["效果怎样", "its result"],
      ["四是决定", "the decision the options"],
      ["代价", "their costs"],
      ["你的建议", "your recommendation"],
      ["谁必须", "who must decide"],
    ]);
  const base = ramp(t, opening(s), 0.7);
  const colors = [P.evidence, P.ink, P.authority],
    aims = en ? ["Fidelity", "Clarity", "Elegance"] : ["信", "达", "雅"];

  // 1. Writing aims for three things in an order: the three aims stand as three nodes in a row about the centre, each on
  // its own word, held by writing, which names them from above. When the order is spoken each node takes its number
  // and the way from the first to the last draws on through them, one point running it, so the order reads at once.
  const gA = base * stageOut(t, fidelity);
  if (gA > 0) s25ThreeAims(s, t, triad, order, colors, aims, gA);

  // 2. Each aim is one mechanism under its head, the three heads standing from the first aim's words as the order left
  // them, and each mechanism building on its own words while its head is lit.
  // Fidelity: the original meaning and the writing stand as two pages; each of who, under what conditions, what
  // responsibility and to what extent carries across on its word as one level line, and the lines turn sound once
  // they stay intact; a fact on the writing keeps its link back to its source; counterexamples, uncertainty and
  // failure stay visible on the writing, each on its word.
  // Clarity: what is understood is ticked on its page; it is then put plainly, a tangled line that runs out straight,
  // and it reaches a reader, who then acts.
  // Elegance: rhythm, transitions and form are bars of a measured rhythm, the curve that joins them and the frame that
  // holds them; a precise verb and a concrete noun stand in the frame; slogans and pretended depth are refused beneath,
  // each on its own words.
  const g1 = base * stageIn(t, fidelity) * stageOut(t, example);
  if (g1 > 0) s25Mechanisms(s, t, fidelity, clarity, elegance, example, colors, aims, g1);
  // 3. The examples, side by side, each under its aim's head and illustrative. First fidelity, about the centre: the
  // collection's row on a timeline, its planned time, the collection standing two hours past it, the true statement
  // hanging from the actual time and the refused one from the plan; the frame is named fidelity on its words, and the
  // true statement is checked once both are said. Then clarity: the message in its order, the conclusion and the
  // decision needed leading the page and the detail following; the page lengthens to take each part, and the frame is
  // named clarity, in English with the first part, since English names clarity just before the message begins. In
  // Chinese, whose one sentence contrasts the two, the case glides left to the left half and clarity inks in in the right
  // half as the glide ends, on the words that begin the message, and both stand together until the concrete checks; in
  // English, which says each in its own sentence, clarity is named on its own word, the sentence's first, where its
  // frame's head will stand, above the case and on the case's left edge; the case's contents and head fade on the next
  // word, and its frame, as wide as clarity's, re-forms into clarity's frame from the word after by the film's glide,
  // under that head, which stays, so the frame stands nearly formed as the message's first part arrives and no cut
  // falls inside the sentence.
  const gE = base * stageIn(t, example) * stageOut(t, concrete),
    clarityIn = firstLead - 0.15;
  illustrative(gE);
  const head = (x, y, name, color, at, a) => {
    const on = named(t, at) * a;
    ring(x + 15, y, 15, { color, alpha: on, width: 2.5 });
    dot(x + 15, y, 6, { color, alpha: on });
    nameText(name, x + 30 + NAME_GAP, y, { align: "left", color, alpha: on });
  };
  const CW = L(700, 880),
    CX = L(1030, 960 - CW / 2),
    CY = L(388, 330);
  const fadeAt = en ? cueFrom(s, "", "means", clarityIs) + 0.05 : Infinity,
    reformAt = en ? cueFrom(s, "", "leading", clarityIs) + 0.05 : Infinity;
  const gF = en ? gE * (1 - ramp(t, fadeAt, 0.4)) : gE;
  if (gF > 0)
    s25FidelityExample(
      t,
      example,
      twoHours,
      write,
      roughly,
      fidelityIs,
      clarityIn,
      head,
      fadeAt,
      gF,
    );
  if (en) head(CX, CY - 40, "Clarity", P.ink, clarityIs, gE);
  const gC = gE * (en ? (t >= fadeAt ? 1 : 0) : ramp(t, clarityIn, 0.4));
  if (gC > 0)
    s25ClarityExample(
      t,
      firstLead,
      decisionNeeded,
      detail,
      clarityIs,
      head,
      CW,
      CX,
      CY,
      reformAt,
      gC,
    );
  // 4. Clarity's concrete checks: a page on the left and its checklist beside it, row for row. Each check is ticked on its
  // own words and lights the part of the page it governs: one point to a paragraph, a term defined where it first
  // appears. English names the first check "One point to a paragraph", not its caption line's words, since each English
  // check is a caption line of its own. The list builds and stays
  // until the question before sending. The Chinese thought opens on 达, the word the thought before closes on, so the
  // stage cuts on the clause after it that says there are concrete checks, and its head names them in those words.
  // The question before sending begins a sentence in both editions, its own thought in Chinese and the sentence after
  // the checks in English, and the stage cuts to the draft on its first words.
  const sendCut = beforeSend;
  const gc = base * stageIn(t, concrete) * stageOut(t, sendCut);
  if (gc > 0) s25ClarityChecks(s, t, concrete, onePoint, terms, gc);
  // 4b. Before sending, an outside reader reads the draft: the draft stands with its name from the stage's cut, and the
  // way it is sent on draws to the reader as the reader is named; what the reader could restate builds into one column
  // on its words.
  const gr = base * stageIn(t, sendCut) * stageOut(t, escalate);
  if (gr > 0) s25OutsideReader(s, t, beforeSend, outsider, restate, gr);
  // 5. Escalating a risk takes four parts, and the report assembles them so that a decision can be made. The report is a
  // page headed by its title from the words that name the escalation, and it lengthens to take each part on the part's
  // own first words, stepping up a little each time so it stays about the centre: the part slides into its place from
  // the right with its name on the page beside it, while what it states draws on its own words: the risk; the impact,
  // the facts and how long a decision stays in time; the containment and how well it held; the decision's options with
  // their costs and the one recommended. Both editions name each part, so the page names them risk, impact, containment
  // and decision. No place stands before its part. The report goes to the person who must decide: that person stands
  // muted beside the report from the escalation's first words, so the stage stands whole about the centre while the
  // report lengthens, and when the words name who must decide, the person takes the authority's colour, the report goes
  // to them, with the time they must decide by.
  const g4 = base * stageIn(t, escalate);
  if (g4 > 0)
    s25Escalation(
      s,
      t,
      escalate,
      risk,
      facts,
      impact2,
      safe,
      contain,
      effect,
      options,
      costs,
      recommend,
      who,
      g4,
    );
};

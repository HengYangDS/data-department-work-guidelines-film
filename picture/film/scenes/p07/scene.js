/* 07 decide: the smallest sufficient model. The scene: its cues and the cuts between its stages, each stage on the
 * words that name it. */

import { illustrative, opening } from "../../framing/chapters.js";
import { cue, cues } from "../../timing/cues.js";
import { ramp } from "../../timing/easing.js";
import { span } from "../../timing/pauses.js";
import { stageIn, stageOut } from "../../timing/stages.js";
import { scenes } from "../registry.js";
import { s07Bounds, s07Reasoning } from "./conclusion.js";
import { s07Delay, s07Hypotheses, s07Observations } from "./evidence.js";
import { s07Interacting, s07Relationships, s07Understanding } from "./model.js";

scenes["07"] = function (s, t) {
  const base = ramp(t, opening(s), 0.7);
  // Stage cuts, each on the words that name the incoming stage's first mark. `experiment` is not a cut: it is the
  // fourth test's cue in stage 5, whose sentence it finishes.
  const [relations, interacting, observe, hypotheses, experiment, delay, reason, bounded] = cues(
    s,
    [
      ["先理关系", "model the relationships"],
      ["互相影响的因素", "interacting parts"],
      ["再把观察记清楚", "pin down the observations"],
      ["然后检验假设", "test the hypotheses"],
      ["用最小的实验", "smallest experiment"],
      ["昨晚那次延迟", "last night's delay"],
      ["相信结论之前", "before trusting a conclusion"],
      ["有边界的结论", "bound the conclusion"],
    ],
  );
  // Last night's delay returns as an illustrative case, and carries the chip while it is worked through.
  const lastNight = cue(s, "比如昨晚", "take last night");
  illustrative(span(t, lastNight - 0.2, reason - 0.2, 0.4) * base);
  // 1. Understanding a problem: the problem stands at the top as a knot of interacting parts from the first words, which
  // name it. Below it a long list and a small model are weighed against each other: the checklist arrives on "a longer
  // list", grows longer and is refused; the model's three parts and the relations between them draw in when the model
  // is named, so the frame weighs the long list against the few parts and relations that are enough. The English names
  // the model before the list, the Chinese after it; each side arrives on its own words.
  const one = base * stageOut(t, relations);
  if (one > 0) s07Understanding(s, t, one);
  // 2. Model the relationships: the knot is re-formed at the centre, now named as the relationships to model, and the
  // small mechanisms the words name build one row beneath it, each drawn on its own words and named below it, five in
  // both editions. They stand left to right in the order spoken, and the row reflows
  // toward its centre as they arrive. One concept keeps one meaning (a second meaning stops at a bar); a cause
  // drives its effect; a dependent hangs from the smaller node of what it needs, its own size among the row's nodes, so
  // the pair reads as one mechanism under its name; a constraint stops a way at its limit; feedback runs back to where
  // it began.
  const two = base * stageIn(t, relations) * stageOut(t, interacting);
  if (two > 0) s07Relationships(s, t, relations, two);
  // 3. Two refused ways, one above the other. Above, two parts influence each other around one loop; forced into
  // separate boxes, the loop is cut at the wall between them. Below, one effect reaches two tallies; the second count
  // stops at a bar. The two parts stand from the cut, which falls on the words that name them; the loop's way from the
  // first part to the second draws on from the cut and its way back on 影响, the words that make the influence mutual
  // (in English with the first, from the cut), so the loop stands whole about the centre before the refused boxes are
  // named under it. The loop is drawn at 3 px, so the stage reads, and balances, while it is the only structure. The
  // effect and its two tallies stand on the effect's words.
  const three = base * stageIn(t, interacting) * stageOut(t, observe);
  if (three > 0) s07Interacting(s, t, interacting, three);
  // 4. Pin down the observations: an eye that observes stands at the centre from the stage's first words, which name
  // it, above the record line the observations are pinned to. Important facts are pinned to it on their words and take
  // their source (a document) and their time (a clock); each unknown hangs from it as an open question, and its way runs
  // down to the one decision it bears on, which stands on its own words.
  const four = base * stageIn(t, observe) * stageOut(t, hypotheses);
  if (four > 0) s07Observations(s, t, observe, four);
  // 5. Test the hypotheses: a tree from the hypothesis to the ways it is tested, which build into one column through the
  // whole sentence. A counterexample is the one point that breaks the run; the baseline is the level a change is read
  // against; not acting is the course the case takes when nothing is done; the smallest experiment forks to the likely
  // explanations and tells them apart, each ending in its own mark. Each test joins the tree on its own words. The tree
  // holds until last night's delay cuts in (stage 7).
  const five = base * stageIn(t, hypotheses) * stageOut(t, delay);
  if (five > 0) s07Hypotheses(s, t, hypotheses, experiment, five);
  // 7. Last night's delay, worked through as the smallest experiment: the delay and the one check that settles it stand
  // side by side, the delay leading to the vendor's publication time, which forks below to the two explanations it
  // separates. Each explanation is a small timeline: the vendor's publication (a document) above our job's start (a
  // point), against the time they were due (the dashed tick); what came late is marked. Each timeline stands on its own
  // words as the fork reaches it, and is named below. The delay and the check stand 360 px either side of the centre, so
  // the two cover the band while they stand above the explanations still to come.
  const seven = base * stageIn(t, delay) * stageOut(t, reason);
  if (seven > 0) s07Delay(s, t, delay, seven);
  // 8. Check the reasoning before trusting a conclusion: the conclusion stands at the centre as a stamped page of text
  // rows, wide enough to carry the stage while it waits for its first trap, and the one way of the reasoning rises to it
  // from its name below when the reasoning is named. The stage stands centred on what stands: the page with its way,
  // then each trap as it is named, gliding to each new extent as the trap's words begin. The reasoning traps the
  // words name, seven in each edition, build around the page in two mirrored columns, each mark beside the
  // page and its name beyond it, in the order they are spoken, left then right. Each trap is a mechanism at reading size
  // that commits its error while its words are spoken and is then refused beside its name: two series rise and fall
  // together and are then joined as cause and effect; one case's ink floods the whole; a necessary part, with the other
  // condition still missing, is taken to produce the outcome; an outcome is traced back to one of its possible causes; a
  // lens takes in only the agreeing points; a result stops short of its mark and the mark is moved back past it; and
  // a practice reaches a case beyond its bounds, which stand dashed once the words name them.
  const eight = base * stageIn(t, reason) * stageOut(t, bounded);
  if (eight > 0) s07Reasoning(s, t, reason, eight);
  // 9. Bound the conclusion: the same conclusion now carries its bounds, a bracket enclosing a column of five. How far
  // the evidence supports it (a run that ends at a limit), how confident it is (a meter part filled), what remains
  // possible (open alternatives beside it), what to verify next (a check with its way ahead) and what would change the
  // judgment (a point not yet seen that would turn the way). The bracket stands on the words that name the bounds; each
  // bound's station arrives on it with its mark and name on the bound's own words.
  const nine = base * stageIn(t, bounded);
  if (nine > 0) s07Bounds(s, t, bounded, nine);
};

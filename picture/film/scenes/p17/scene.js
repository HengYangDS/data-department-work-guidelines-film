/* 17 deliver: evidence sets the limit of the claim. The scene: its cues and the cuts between its stages, each stage on
 * the words that name it. */

import { ctx } from "../../canvas.js";
import { restMark } from "../../drawing/levels.js";
import { link } from "../../drawing/links.js";
import { dot, labelSize, line, measure } from "../../drawing/strokes.js";
import { ring } from "../../drawing/symbols.js";
import { opening } from "../../framing/chapters.js";
import { listLevel, named, speaking } from "../../naming/lists.js";
import { NAME_GAP, nameText } from "../../naming/names.js";
import { CONTENT_CY } from "../../naming/placement.js";
import { NOTE, termRow } from "../../naming/terms.js";
import { LABEL, P } from "../../palette.js";
import { en } from "../../timeline.js";
import { cue, cueFrom, cues } from "../../timing/cues.js";
import { ramp } from "../../timing/easing.js";
import { glide, glideTime, smoother } from "../../timing/pace.js";
import { pauseHold } from "../../timing/pauses.js";
import { stageIn, stageOut } from "../../timing/stages.js";
import { scenes } from "../registry.js";
import { s17Narrowing, s17Questions } from "./claim.js";
import { s17Complete } from "./complete.js";

scenes["17"] = function (s, t) {
  const complete = cue(s, "才能说完成", "say complete"),
    questions = cue(s, "每次说完成", "every completion claim");
  const nots = cues(s, [
    ["测试通过", "a passing test"],
    ["智能体说完成了", "an agent reporting"],
  ]);
  const [missing, narrow] = cues(s, [
    ["证据不够", "when evidence is missing"],
    ["收窄说法", "narrow the claim"],
  ]);
  const base = ramp(t, opening(s), 0.7);
  // 1. Say complete only when every condition holds. The claim stands at the centre from the first words: a stamp whose
  // ring is six quiet arcs, one per condition, under the name of the rule. The conditions then build round it in two
  // columns read row by row, each a key term with its qualifier on its own words and a box that is ticked when the
  // condition is said to hold; a link then runs from the box into the condition's arc, which lights. When the sixth
  // arc lights, the stamp's check is struck. The six stay whole across both thoughts and hand the picture to the
  // claim's questions in one cut. While the first condition stands alone at the upper left, the whole stage stands to
  // the right, so the two are balanced within 70 px of the centre; it returns, to within 15 px of the centre, as the
  // second condition arrives, and as the fourth, the widest, arrives it moves on to stand centred on its finished
  // columns.
  // Each row: its key term and the word that begins it, its qualifier and its word, and the words that say it holds. A
  // term given as lines keeps them, one under the other, in its column. The risks, limits, uncovered cases and follow-up
  // owners stand in two lines broken at the clause, the Chinese second line keeping the comma that leads to its
  // qualifier 都已记录, so its block keeps the last line's share; as that row fits beside no qualifier, both editions set
  // every qualifier under its term.
  const rows = (
    en
      ? [
          [
            "Deliverable",
            "the deliverable",
            "at the agreed location",
            "at the agreed location",
            "is at the agreed location",
          ],
          ["Completion criteria", "every completion criterion", "all met", "is met", "is met"],
          [
            "Current verification",
            "current verification",
            "matching the claim, passed",
            "matching the claim",
            "has passed",
          ],
          [
            ["Risks, limits, uncovered cases", "and follow-up owners"],
            "risks",
            "recorded",
            "are recorded",
            "are recorded",
          ],
          ["Agreed state", "the agreed state", "reached", "is reached", "is reached"],
          [
            "Human acceptance",
            "human acceptance",
            "where required",
            "where human acceptance",
            "has accepted it",
          ],
        ]
      : [
          ["交付物", "交付物", "在约定的位置", "在约定的位置", "在约定的位置"],
          ["每条完成标准", "每条完成标准", "达到了", "达到了", "都达到了"],
          ["当前的核验", "当前的核验", "对得上说法，已跑过", "对得上说法", "也通过了"],
          [
            ["风险、限度、没覆盖到的情况，", "以及后续由谁负责，"],
            "风险",
            "都已记录",
            "都已记录",
            "都已记录",
          ],
          ["约定的状态", "约定的状态", "达到了", "达到了约定的状态", "达到了约定的状态"],
          ["验收人", "验收人", "需要时已验收", "需要人来验收", "已验收"],
        ]
  ).map(([term, termCue, qual, qualCue, holdCue]) => [
    [].concat(term),
    cue(s, termCue, termCue),
    qual,
    cue(s, qualCue, qualCue),
    cue(s, holdCue, holdCue),
  ]);
  // A row builds from the first of its words; its box stands with its key term, the name that stands beside it.
  const starts = rows.map(([, termAt, , qualAt]) => Math.min(termAt, qualAt)),
    marks = rows.map(([, termAt]) => termAt);
  const holds = rows.map(([, termAt, , qualAt, holdAt]) => Math.max(termAt, qualAt, holdAt)),
    done = holds[5];
  const g1 = base * stageOut(t, questions);
  if (g1 > 0) s17Complete(s, t, complete, rows, starts, marks, holds, done, g1);
  // 2. Every completion claim answers the same questions, and the claim carries its answers. The claim is a card at the
  // centre, standing on the words that open the questions with its completion mark and its wording, sized to them; its
  // wording lights line by line when what it claims is asked. It is pinned on the right to the subject it is about,
  // whose version is tagged, and the verification signs it from the left: who, when and by what method, each mark, name
  // and signature on its own words, in the order they are asked. On the subject, what the claim covers fills, and what
  // is left unproved stays open and dashed with its question marks. The claim holds until the first pair of states is
  // named and hands the picture over in one cut. The card stands centred alone; as the subject is pinned on its right
  // the pair moves left to within 70 px of the centre, and as the first signature arrives on the left the whole claim
  // moves back to stand centred.
  const g2 = base * stageIn(t, questions) * stageOut(t, nots[0]);
  if (g2 > 0) s17Questions(s, t, questions, g2);
  // 3. Adjacent states are not each other. Each pair stands in one row of a ledger: the state reached on the left, its
  // mark filled, and the state it does not make on the right, its ring hollow and dashed, each on its own words. The way
  // from one toward the other draws on from the reached mark and stops at the table's gate, one tall bar through the
  // table's whole extent, which stands at the structure tier from the words that deny the first pair, where the first
  // way meets it; each pair's stretch of it takes its colour on the words that deny that pair, so each table of refusals
  // builds and stands instead of its rows replacing each other, and stands as tall as it will be once its first pair
  // has been refused. Both editions say two pairs, the passing test and the Agent's report (English in one thought,
  // Chinese in two), so one table holds them until missing evidence is named. The table balances on the frame: it grows
  // about the content centre, its first row on the centre line and the first row stepping up by half a row as the words
  // that bring the second begin, and it stands centred across on the rows said so far.
  // In English the passing test's bar stands on "does not prove", and the Agent's on "does not make".
  const stopWords = en ? ["does not prove", "does not make"] : ["不等于", "也"];
  const stops = nots.map((at, i) => cueFrom(s, stopWords[i], stopWords[i], at));
  // A reached state given as lines would keep them, one under the other, each ending at the column's edge; every state
  // stands on one line, as said, the Chinese Agent's report among them.
  const left = en
    ? [
        [["A passing test"], []],
        [["An Agent reports completion"], []],
      ]
    : [
        [["测试通过"], []],
        [["智能体说完成了"], []],
      ];
  const right = en
    ? [
        ["Reviewed, correct overall or accepted", "was reviewed"],
        ["Work complete", "work complete"],
      ]
    : [
        ["已评审、整体正确或已验收", "已评审"],
        ["完成了", "完成了"],
      ];
  const rightAts = right.map(([, v], i) => cueFrom(s, v, v, stops[i]));
  // A reached state's qualifier stands under its name, so the name stands beside its mark from its own words.
  const termW = ([term]) =>
    (term.length > 1
      ? Math.max(...term.map((v) => measure(v, LABEL)))
      : measure(term.join(""), LABEL)) + 1;
  const rowW = ([term, qual]) =>
    Math.max(termW([term]), qual.length ? measure(qual.join(""), NOTE) : 0);
  // The ledger is laid out from its widest names across most of the frame and centred on the content centre.
  const wL = Math.max(...left.map(rowW)),
    wR = Math.max(...right.map(([v]) => measure(v, LABEL)));
  const DOT = 15,
    RING = 20,
    LINK = Math.max(380, 1440 - wL - wR - 2 * NAME_GAP - DOT - RING);
  const x0 = 960 - (wL + NAME_GAP + DOT + LINK + RING + NAME_GAP + wR) / 2;
  const DL = x0 + wL + NAME_GAP + DOT,
    DR = DL + LINK,
    BAR = DL + LINK / 2;
  const from = DL + DOT + 8,
    to = DR - RING - 8,
    reach = (BAR - 8 - from) / (to - from);
  // The pair being said lights its reached mark; a light that would end in the quiet between thoughts waits for words.
  const litAts = nots.map((v) => pauseHold(v - 0.15, 0.3) + 0.15);
  // One table: its rows, their heights now and once all are said, its fade, its sets' key, and the word on which its
  // names are whole again. A table stands centred on its own names, from its widest reached state to its widest state
  // not made, so a table of shorter names keeps the columns' spacing and still balances on the frame; it counts the
  // reached states said so far, and glides to stay centred as a wider one arrives.
  const ledger = (rows, ys, last, a, key, whole) => {
    const reachedAts = rows.map((i) => nots[i]),
      notAts = rows.map((i) => rightAts[i]),
      lights = rows.map((i) => litAts[i]);
    const spanR = Math.max(...rows.map((i) => measure(right[i][0], LABEL)));
    const centreOn = (n) =>
      960 -
      (DL -
        DOT -
        NAME_GAP -
        Math.max(...rows.slice(0, n).map((i) => rowW(left[i]))) +
        DR +
        RING +
        NAME_GAP +
        spanR) /
        2;
    const shift = rows.slice(1).reduce((v, i, k) => {
      const d = centreOn(k + 2) - centreOn(k + 1);
      return v + d * glide(t, nots[i] - 0.1, d);
    }, centreOn(1));
    // While the table's first reached state stands without the state it does not make, the table stands ALONE px right
    // of its place, so that state stands within 400 px of the centre; once its way has reached the gate the table
    // glides to its place, arriving as the other state is named.
    const ALONE = 150,
      opens = rows[0],
      wayDone = nots[opens] + 0.05 + Math.max(0.4, stops[opens] - nots[opens]),
      alone =
        ALONE * (1 - glide(t, Math.max(rightAts[opens] - 0.15 - glideTime(ALONE), wayDone), ALONE));
    ctx.save();
    ctx.translate(shift + alone, 0);
    line(BAR, last[0] - 50, BAR, last.at(-1) + 50, {
      color: P.line,
      alpha: ramp(t, stops[rows[0]] + 0.05, 0.3) * a,
      width: 4,
    });
    rows.forEach((i, k) => {
      const [term, qual] = left[i],
        y = ys[k],
        lit = speaking(t, lights, k);
      dot(DL, y, DOT + 1, { color: P.evidence, alpha: ramp(t, nots[i] + 0.05, 0.3) * a });
      if (lit > 0)
        ring(DL, y, DOT + 9, {
          color: P.evidence,
          alpha: lit * restMark(P.evidence, 0.6) * a,
          width: 2,
        });
      ring(DR, y, RING, {
        color: P.muted,
        alpha: named(t, rightAts[i]) * a,
        width: 2.5,
        dash: [6, 6],
      });
      link(from, y, to, y, {
        alpha: a,
        upto: reach,
        draw: { t, at: nots[i] + 0.05, least: Math.max(0.4, stops[i] - nots[i]) },
        end: false,
      });
      line(BAR, y - 50, BAR, y + 50, {
        color: P.unknown,
        alpha: ramp(t, stops[i] + 0.05, 0.3) * a,
        width: 4,
      });
      const qualAts = qual.length ? [cueFrom(s, qual[0], qual[0], nots[i])] : [];
      // A name of one line starts where its width ends it at the column's edge; a name of lines ends each at that edge.
      const lines = term.length > 1;
      termRow(
        t,
        term,
        [nots[i]],
        qual,
        qualAts,
        DL - DOT - NAME_GAP - (lines ? 1 : rowW(left[i])),
        y - labelSize(LABEL) / 2,
        {
          width: lines ? 0 : termW(left[i]),
          align: lines ? "right" : "left",
          alpha: a * Math.max(listLevel(t, reachedAts, k), ramp(t, whole + 0.05, 0.25)),
          set: `reached ${key}`,
        },
      );
      // The states not made return to full ink together on the last one's key word, before the thought ends.
      nameText(right[i][0], DR + RING + NAME_GAP, y, {
        align: "left",
        color: P.muted,
        set: `not made ${key}`,
        alpha:
          a *
          named(t, rightAts[i]) *
          Math.max(listLevel(t, notAts, k), ramp(t, whole + 0.05, 0.25)),
      });
    });
    ctx.restore();
  };
  const g3 = base * stageIn(t, nots[0]) * stageOut(t, missing);
  if (g3 > 0) {
    // The first row steps up half a row, 80 px, on the glide's curve in the time that way takes.
    const STEP_UP = 80,
      grown = smoother((t - pauseHold(nots[1] - 0.3, 0.6)) / glideTime(STEP_UP)),
      row = (n) => [0, 1].map((k) => CONTENT_CY + 2 * STEP_UP * (k - n / 2));
    ledger([0, 1], row(grown), row(1), g3, "all", cueFrom(s, "完成了", "complete", rightAts[1]));
  }
  // 4. When evidence is missing, the claim narrows to it. A row of evidence stands on the words that say evidence is
  // missing: the evidence that exists is checked, and what is missing stays a dashed, open
  // outline with a question mark. The claim stands as one card over the row on the words that narrow it, its wording
  // filling it, and draws in to the evidence's limit, leaving its larger extent as an open dashed trace.
  const g4 = base * stageIn(t, missing);
  if (g4 > 0) s17Narrowing(s, t, missing, narrow, g4);
};

/* 21 human-agent: check the actual work. The scene: its cues and the cuts between its stages, each stage on the words
 * that name it. */

import { ctx } from "../../canvas.js";
import { line, path, stroke } from "../../drawing/strokes.js";
import { documentIcon, ring } from "../../drawing/symbols.js";
import { opening } from "../../framing/chapters.js";
import { P } from "../../palette.js";
import { cues } from "../../timing/cues.js";
import { ramp } from "../../timing/easing.js";
import { stageIn, stageOut } from "../../timing/stages.js";
import { scenes } from "../registry.js";
import { s21Parallel, s21Path } from "./agents.js";
import { s21Majority, s21TeamFact } from "./facts.js";
import { s21Checklist, s21Output } from "./work.js";

scenes["21"] = function (s, t) {
  const [own, unrelated, parallel, integrate, majority] = cues(s, [
    ["智能体也要先确认", "an agent must first confirm"],
    ["不顺手改无关的东西", "without incidental changes"],
    ["多个智能体并行", "parallel agents"],
    ["指定一个人", "one person verifying"],
    ["多数意见不是证据", "majority opinion"],
  ]);
  const [lasting, authoritative, teamFact] = cues(s, [
    ["检查过的输出", "even checked output"],
    ["这项工作的权威记录", "authoritative record"],
    ["长期依靠的事实", "lasting team fact"],
  ]);
  const base = ramp(t, opening(s), 0.7);
  // The actual work is a stack of pages, named in the first stage. The lens is the reviewer's look.
  const WX = 630,
    WY = 340,
    WW = 340,
    WH = 380,
    wcx = WX + WW / 2,
    wcy = WY + WH / 2;
  const work = (a, x = WX) => {
    // The pages behind show only the edges that stand clear of the front page.
    for (let k = 2; k >= 1; k--)
      path(
        [
          [x + k * 26, WY - (k - 1) * 26],
          [x + k * 26, WY - k * 26],
          [x + WW + k * 26, WY - k * 26],
          [x + WW + k * 26, WY + WH - k * 26],
          [x + WW + (k - 1) * 26, WY + WH - k * 26],
        ],
        { color: P.ink, alpha: a, width: 2 },
      );
    documentIcon(x, WY, WW, WH, { alpha: a, rows: 0 });
    // The page's lines are written as one block of text.
    stroke(
      () => {
        for (let i = 0; i < 9; i++) {
          ctx.moveTo(x + 34, WY + 44 + i * 36);
          ctx.lineTo(x + WW - (i % 3 === 2 ? 120 : 40), WY + 44 + i * 36);
        }
      },
      { color: P.muted, alpha: a * 0.8, width: 2 },
    );
  };
  const lens = (x, y, a) => {
    ring(x, y, 54, { color: P.evidence, alpha: a, width: 3.5 });
    line(x + 39, y + 39, x + 76, y + 76, { color: P.evidence, alpha: a, width: 5 });
  };
  const [output, actual, summary, first] = cues(s, [
    ["智能体的输出", "an agent's output"],
    ["实际的工作", "checking the work"],
    ["它写的摘要", "its summary"],
    ["行动依据和现状", "is the authority to act correct"],
  ]);
  // 1. Checking an Agent's output means checking the work, not just its summary. The output stands near the centre on
  // the first words as one stack of pages under its name, with the check's lens over it; the lens settles onto the
  // pages on the words that name the work, and the summary the Agent wrote stands beside the stack on its own name,
  // unread. While the stack stands alone it stands centred, and on the summary's words it moves left to its place
  // beside the summary.
  const one = base * stageOut(t, first);
  if (one > 0) s21Output(s, t, WX, WY, WW, WH, wcx, wcy, work, lens, output, actual, summary, one);
  // 2. The check reads the actual work. The work is one page whose questions build down it as one checklist: each
  // question's row arrives on its own words with its marks and name, and is ticked on the words that ask whether it
  // holds. The basis the work relies on (in Chinese, its rules) is a sealed document and the current state a clock; the
  // inputs are a full set; assumptions, inferences and judgments stand apart; the changes lie inside what was agreed
  // and reported; the verification runs on the current version in the right environment; and the
  // high-risk action carries the seal of the decision owner who approved it. The page grows with its rows and stays
  // centred: each new row reflows the column by half a row, eased from just before its words. The list spans two thoughts
  // in Chinese and one in English.
  const two = base * stageIn(t, first) * stageOut(t, own);
  if (two > 0) s21Checklist(s, t, two);
  // 3. The Agent's own way runs as one path: it confirms the task, the object it handles (in English, its target), the
  // current state and the responsible person at the start, advances step by step, each step reversible and verifiable,
  // leaves the side way to unrelated changes barred, runs the checks that match its claim, reads the complete results
  // and only then concludes. The path stands as a firm rail from
  // the stage's first words, which name the Agent's own way, and the Agent is named at its head on those words; each
  // station marks as the Agent reaches it, each stone is laid on its own word as the Agent steps onto it, and the names
  // build below the path on one baseline and stay.
  const three = base * stageIn(t, own) * stageOut(t, parallel);
  if (three > 0) s21Path(s, t, own, unrelated, three);
  // 4. Parallel Agents suit only independent questions, paths or review angles: the work flows down the frame. The
  // Agents stand together on the first lane from the stage's first words, which name them, the ones still to take a
  // lane stacked behind the first, and the independent questions stand over the lanes, one each, on their own words;
  // each Agent takes its own lane on the words of its role, which is named beside it, and leaves the stack as it arrives
  // there, so no Agent stands without a name. The line of changing nothing crosses every lane on its words, and the
  // lanes join below the one person who combines their results and owns the judgment, as that person is named; each
  // lane's way down leaves clear of its lock. The stage is centred on its extent, from its row labels' left edge to what
  // stands at its right: the lock's line while the last role is still to come, then the last role's name, which it
  // moves to make room for on that role's words.
  const four = base * stageIn(t, parallel) * stageOut(t, majority);
  if (four > 0) s21Parallel(s, t, parallel, integrate, four);
  // 5. A majority opinion is not evidence: two small frames side by side, the Agents' agreement in one and evidence in
  // the other, and the way from the first to the second stops at a bar on the words that refuse it.
  const five = base * stageIn(t, majority) * stageOut(t, lasting);
  if (five > 0) s21Majority(s, t, majority, five);
  // 6. Even checked output becomes a lasting team fact only once its source and limits enter the work's authoritative
  // record. The work flows down the frame: the checked output stands at the top with its source and limits written
  // beside it on their own words, and when they are recorded a way runs down from it into the record below, which
  // appears with its earlier entries on its own words and takes a new entry; the record is stamped as a fact the team
  // can rely on once both the record and the fact are named. The checked output is the stack of the work's pages, as
  // the first stage drew it, so it and its first entry fill the picture while the record is still to come. The stage
  // is centred on its extent, from the output's or the record's name at the left to the entry's rows or the fact at
  // the right.
  const six = base * stageIn(t, lasting);
  if (six > 0) s21TeamFact(s, t, lasting, authoritative, teamFact, six);
};

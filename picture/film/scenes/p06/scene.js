/* 06 decide: six kinds of statement. The scene, with the grid its six kinds stand on and each kind's mark. */

import { ctx } from "../../canvas.js";
import { tableIcon } from "../../drawing/datasets.js";
import { SECOND, markLevel, mutedLevel, restMark } from "../../drawing/levels.js";
import { link } from "../../drawing/links.js";
import { box, dot, labelSize, line, measure, stroke, text } from "../../drawing/strokes.js";
import { check, documentIcon, person, ring } from "../../drawing/symbols.js";
import { illustrative, opening } from "../../framing/chapters.js";
import { beats, listLevel, named, speaking } from "../../naming/lists.js";
import { NAME_GAP, nameText } from "../../naming/names.js";
import { growName, growTexts } from "../../naming/parts.js";
import { CONTENT_CY } from "../../naming/placement.js";
import { termRow } from "../../naming/terms.js";
import { LABEL, P } from "../../palette.js";
import { L, en } from "../../timeline.js";
import { cue, cueFrom, cues } from "../../timing/cues.js";
import { mix, ramp } from "../../timing/easing.js";
import { glide, glideTime } from "../../timing/pace.js";
import { STAGE_CUT, stageIn, stageOut } from "../../timing/stages.js";
import { scenes } from "../registry.js";

/* The six kinds on a grid of three rows of two, read in the order they are spoken, left then right: fact and
 * hypothesis, inference and judgment, decision and action. Each kind has a mark at its place, its name beside the mark
 * and its statement or conditions below the name, on one left edge, set off from the name by a heading's gap rather
 * than a line's. The columns are as wide as the edition's lines; the left column stands at the frame's left margin and
 * the right one as far from the right, so the grid is centred. */
const S06R = 26,
  S06ROWS = [330, 520, 710],
  S06TEXT = en ? 480 : 300,
  S06HEAD = 26;
const s06Place = (i) => [i % 2 ? 1498 - S06TEXT : 400, S06ROWS[Math.floor(i / 2)]];
const s06Colour = (i) => [P.evidence, P.muted, P.ink, P.ink, P.authority, P.ink][i];
/* A kind's name heads its place in the kind's colour and in bold, so all six read as headings over their statements
 * and conditions, the three kinds drawn in ink included. */
const s06Kind = (v, i, x, y, o) =>
  nameText(v, x, y, { align: "left", color: s06Colour(i), bold: true, ...o });
/* A kind's mark: a recorded fact is checked, a hypothesis is an open question, an inference is a therefore, a
 * judgment weighs against a standard, a decision has its owner and an action its time. */
function s06Mark(i, x, y, { alpha = 1, lit = 0 } = {}) {
  if (alpha < 0.01) return;
  const c = s06Colour(i);
  dot(x, y, S06R, { color: P.ground, alpha });
  ring(x, y, S06R, { color: c, alpha, width: 2.5, dash: i === 1 ? [5, 5] : null });
  if (lit > 0) ring(x, y, S06R + 10, { color: c, alpha: alpha * lit * restMark(c, 0.5), width: 2 });
  if (i === 0) check(x, y + 1, 22, { color: c, alpha });
  if (i === 1) text("?", x, y + 1, 26, { role: "mark", align: "center", color: c, alpha });
  if (i === 2)
    [
      [-8, 6],
      [8, 6],
      [0, -8],
    ].forEach(([dx, dy]) => dot(x + dx, y + dy, 3.5, { color: c, alpha }));
  if (i === 3) {
    line(x, y - 12, x, y + 11, { color: c, alpha, width: 2.5 });
    line(x - 8, y + 12, x + 8, y + 12, { color: c, alpha, width: 2.5 });
    line(x - 15, y - 9, x + 15, y - 9, { color: c, alpha, width: 2.5 });
    [-12, 12].forEach((dx) =>
      stroke(() => ctx.arc(x + dx, y - 4, 5, 0, Math.PI), { color: c, alpha, width: 2.5 }),
    );
  }
  if (i === 4) person(x, y + 3, { color: c, alpha, size: 0.6 });
  if (i === 5) {
    line(x, y, x, y - 14, { color: c, alpha, width: 3 });
    line(x, y, x + 11, y + 5, { color: c, alpha, width: 3 });
  }
}
scenes["06"] = function (s, t) {
  const [six, , example, data, conditions] = cues(s, [
    ["有六种说法", "six kinds of statement"],
    ["要分清", "stay distinct"],
    ["虚构的例子", "illustrative case"],
    ["昨晚的价格数据", "last night's price collection"],
    ["这六种说法", "a fact states"],
  ]);
  const restate = cue(s, "晚了两小时", "two hours late is"),
    distinct = cue(s, "要分清", "need to stay distinct");
  const base = ramp(t, opening(s), 0.7);
  // The example is marked as illustrative from its words until the general conditions begin.
  illustrative(ramp(t, example - 0.2, 0.6) * base * (1 - ramp(t, conditions + 0.05, 0.4)));
  // 1. Six kinds of statement: six statements, each a page of text drawn in ink so the row carries the thought, stand in
  // one row from the first words, which count them; on the words that keep them distinct a divider rises between each
  // pair. A kind's own mark waits for the kind's name, so no mark stands here unnamed. The row hands the picture to the
  // case on the words that name its data rather than in one frame: its name fades first, then its pages as the case
  // inks in about the centre, so the row's name never meets the case's marks and a name stands throughout.
  const one = base * (1 - ramp(t, data - 0.25, 0.45)),
    rowName = base * (1 - ramp(t, data - 0.45, 0.4));
  if (one > 0) {
    // The row stands high enough that its thought, which ends on the case standing low below the grid, balances on the
    // content centre as a whole.
    const y = 400,
      PW = 96,
      PH = 124,
      pitch = 220;
    for (let i = 0; i < 6; i++) {
      // The pages arrive with the words that count them, just after the name, so the scene's cut waits for its name.
      const x = 960 + (i - 2.5) * pitch,
        q = one * ramp(t, six - 0.1 + i * 0.12, 0.45);
      documentIcon(x - PW / 2, y - PH / 2, PW, PH, { alpha: q, rows: 3, fillColor: P.ground });
      if (i)
        link(x - pitch / 2, y + PH / 2 + 4, x - pitch / 2, y - PH / 2 - 4, {
          color: P.line,
          width: 3,
          alpha: one,
          draw: { t, at: distinct - 0.05 + (i - 1) * 0.12 },
          end: false,
        });
    }
    nameText(L("六种说法", "Six kinds of statement"), 960, y + PH / 2 + NAME_GAP, {
      valign: "top",
      alpha: rowName * named(t, six),
    });
  }
  // The case's statements, each with the words that say it: its term, and its qualifier where it has one. A statement
  // builds from its first words, and its kind's ring, mark and name arrive together on the kind's noun; the ring
  // lights while its statement is said.
  const kindAts = cues(s, [
    ["事实", "fact"],
    ["假设", "hypothesis"],
    ["推论", "inference"],
    ["判断", "judgment"],
    ["决定", "decision"],
    ["行动", "action"],
  ]);
  const kinds = en
    ? ["Fact", "Hypothesis", "Inference", "Judgment", "Decision", "Action"]
    : ["事实", "假设", "推论", "判断", "决定", "行动"];
  const rows = (
    en
      ? [
          [["Two hours late"], ["two hours late is"], ["recorded"], ["recorded"]],
          [["Late publication by the vendor"], ["late publication"], ["untested"], ["untested"]],
          [["Scheduling may explain"], ["scheduling may explain"], [], []],
          [
            ["Delivery failed"],
            ["by the timeliness"],
            ["by the timeliness standard"],
            ["by the timeliness"],
          ],
          [
            ["Starting the job earlier"],
            ["starting the job"],
            ["the decision owner"],
            ["the decision owner"],
          ],
          [["Who makes the change, and by when"], ["who makes the change"], [], []],
        ]
      : [
          [["晚了两小时"], ["晚了两小时"], ["有记录"], ["有记录"]],
          [["供应商发布晚了"], ["供应商发布晚了"], ["还没检验"], ["还没检验"]],
          [["问题就可能出在调度上"], ["问题就可能"], [], []],
          [["交付不合格"], ["按及时性的标准"], ["按及时性的标准"], ["按及时性的标准"]],
          [["把任务提前启动"], ["把任务提前启动"], ["决策负责人"], ["决策负责人作出的决定"]],
          [["谁在什么时候改好"], ["谁在什么时候"], [], []],
        ]
  ).map(([term, termWords, qual, qualWords]) => [
    term,
    termWords.map((w) => cue(s, L(w, ""), L("", w))),
    qual,
    qualWords.map((w) => cue(s, L(w, ""), L("", w))),
  ]);
  const starts = rows.map(([, termAts, , qualAts]) => Math.min(...termAts, ...qualAts));
  // A kind's place: its mark at (x, y), its name beside the mark and its statement below the name. A statement without
  // a qualifier wraps within its column; one with a qualifier is a term row. A judgment's verdict is set whole from the
  // standard that begins it.
  const statement = (
    i,
    x,
    y,
    alpha,
    listed,
    kindAt = kindAts[i],
    termAts = rows[i][1],
    qualAts = rows[i][3],
  ) => {
    const [term, , qual] = rows[i],
      lit = speaking(t, starts, i),
      left = x + S06R + NAME_GAP,
      kind = ramp(t, kindAt - 0.15, 0.4);
    if (lit > 0)
      ring(x, y, S06R + 10, {
        color: s06Colour(i),
        alpha: alpha * lit * restMark(s06Colour(i), 0.5) * kind,
        width: 2,
      });
    s06Mark(i, x, y, { alpha: alpha * kind });
    const level = alpha * listLevel(t, starts, i),
      top = y + labelSize(LABEL) / 2 + S06HEAD;
    s06Kind(kinds[i], i, left, y, {
      alpha: (s06Colour(i) === P.muted ? mutedLevel(level) : level) * named(t, kindAt),
      set: listed ? "kinds" : null,
    });
    // Every statement's qualifier stands under it, so the six read one way.
    if (qual.length)
      termRow(t, term, termAts, qual, qualAts, left, top, {
        width: S06TEXT,
        alpha: level,
        set: listed ? "statements" : null,
        inline: false,
      });
    else
      growName(t, term, termAts, left, top, {
        width: S06TEXT,
        alpha: level,
        set: listed ? "statements" : null,
      });
  };
  // 2. The illustrative case: last night's price collection inks in on the words that name its data, standing on the
  // hour it arrived on a line of the night's hours. When the words say it ran two hours late, the two hours are measured
  // below the line, from the hour it was due to the arrival. While it stands alone it stands about the content centre;
  // when the delay is restated as a recorded fact it glides down under the grid's first row, the span's name gives way
  // to the fact's statement, which takes the first place of the grid the next stage builds, and its due place stands
  // clear of the inference's place. The case stands below the grid's first row while the hypothesis is said and while
  // the inference's premise is shown on it: on its words, the place it was due stands as a dashed outline named on time,
  // an empty place that arrives with its name, and the two hours are named as the job's late start. It stands through
  // the inference and leaves in one cut on the next thought's first words, the standard of the judgment.
  const two = base * (t >= data - 0.3 ? 1 : 0) * stageOut(t, starts[3]);
  if (two > 0) {
    const ranLate = cue(s, "采集晚了两个小时", "ran two hours late");
    const AY = 700,
      due = 780,
      actual = 1140,
      TW = 300,
      TH = 100,
      top = AY - 36 - TH,
      SY = AY + 36;
    // Once its delay is restated as a fact, the case steps back to the second ink and the fact's statement leads.
    const back = mix(1, SECOND, ramp(t, restate + 0.05, 0.7)),
      on = two * back * ramp(t, data - 0.1, 0.4);
    // The premise's two parts light what they name in full ink: the hour that was on time, and the two hours late.
    const onTime = cueFrom(s, "准时", "on time", starts[1]),
      startedLate = cueFrom(s, "启动得晚", "job started late", starts[1]);
    // The two hours are an accent mark: they step back only to the unknown's level, and light again on their words.
    const span =
      two *
      ramp(t, ranLate + 0.05, 0.3) *
      mix(markLevel(P.unknown, back), 1, named(t, startedLate));
    // Alone, the case's extent, from its table's top to the names under the two hours, stands about the content centre;
    // below the grid its due place stands 14 px under the inference's statement.
    const raise = (top + SY + 10 + NAME_GAP + labelSize(LABEL)) / 2 - CONTENT_CY,
      lower = 40;
    ctx.save();
    ctx.translate(0, -raise + (raise + lower) * glide(t, restate + 0.05, raise + lower));
    // The night's hours: one line with a tick at each hour, drawn as one stroke.
    stroke(
      () => {
        ctx.moveTo(240, AY);
        ctx.lineTo(1680, AY);
        for (let x = 240; x <= 1680; x += 180) {
          ctx.moveTo(x, AY - 7);
          ctx.lineTo(x, AY + 7);
        }
      },
      { color: P.line, alpha: on, width: 3.5 },
    );
    box(due - TW / 2, top, TW, TH, {
      stroke: P.line,
      alpha: two * named(t, onTime),
      radius: 6,
      dash: [6, 6],
    });
    nameText(L("准时", "On time"), due, top + TH / 2, {
      valign: "middle",
      alpha: two * named(t, onTime),
    });
    line(actual, top + TH, actual, AY, { color: P.line, alpha: on, width: 2 });
    // The table's rules are one stroke with it, so the table reads as one mark under its name.
    tableIcon(actual - TW / 2, top, TW, TH, { alpha: on, joined: true });
    // The collection is named beside its table, clear of the grid's first row, whose statements stand over the table,
    // and within the night's line, whole on one line.
    // The name joins once the row's pages beside it have faded.
    nameText(
      L("昨晚的价格数据", "Last night's price collection"),
      actual + TW / 2 + NAME_GAP,
      top + TH / 2,
      { align: "left", width: 360, alpha: two * back * named(t, data + 0.2) },
    );
    // The two hours, measured below the line from the due hour to the arrival.
    link(due, SY, actual, SY, {
      color: P.unknown,
      alpha: span,
      width: 3,
      draw: { t, at: ranLate + 0.05 },
      end: false,
    });
    line(due, SY - 10, due, SY + 10, { color: P.unknown, alpha: span, width: 3 });
    line(actual, SY - 10, actual, SY + 10, {
      color: P.unknown,
      alpha: span * ramp(t, ranLate + 0.45, 0.3),
      width: 3,
    });
    // It names the two hours until the case has glided under the grid, and then gives way to the fact's statement.
    nameText(L("采集晚了两个小时", "Ran two hours late"), (due + actual) / 2, SY + 10 + NAME_GAP, {
      valign: "top",
      alpha:
        two * named(t, ranLate) * (1 - ramp(t, restate + 0.05 + glideTime(raise + lower), 0.3)),
    });
    nameText(L("启动得晚", "Job started late"), (due + actual) / 2, SY + 10 + NAME_GAP, {
      valign: "top",
      alpha: two * named(t, startedLate),
    });
    ctx.restore();
    // In the case the fact's kind arrives within the clause that names it a fact: in English with its restated statement,
    // at most 1.4 s ahead of its own word; in Chinese with the word that records it. The grid takes the fact over on the
    // hypothesis's first words.
    if (t < starts[1] + STAGE_CUT)
      statement(
        0,
        ...s06Place(0),
        two * ramp(t, restate + 0.05, 0.3),
        false,
        en ? Math.max(restate, kindAts[0] - 0.9) : Math.min(kindAts[0], cue(s, "有记录", "")),
      );
  }
  // 3. The case's statements sorted into the six kinds. The stage begins on the second statement's first words, while
  // the case still stands below; the recorded fact stands in its place as the case left it, and each further statement
  // arrives at its kind's ring on its own words, the inference's above the case, which has glided clear of it.
  const three = base * stageIn(t, starts[1]) * stageOut(t, conditions);
  // The stage begins on the hypothesis's own first words, so its term inks in from the cut rather than standing at most
  // of its ink in the cut's first frame; the judgment, whose place the case's table reaches until the case leaves in its
  // cut, inks in from that cut.
  const fromCut = (i) => rows[i][1].map(() => starts[i] + STAGE_CUT + 0.15);
  if (three > 0)
    rows.forEach((_, i) =>
      statement(
        i,
        ...s06Place(i),
        three,
        true,
        kindAts[i],
        i === 1 || i === 3 ? fromCut(i) : rows[i][1],
        i === 3 ? fromCut(i) : rows[i][3],
      ),
    );
  // 4. Each kind carries its own conditions. The case's statements leave in one cut on the thought's first words, which
  // begin the conditions in English and in Chinese first say that each kind has its own to account for, named above
  // the grid until the next thought; the six kinds keep their marks, positions and names, and each
  // kind's conditions build below its name, each part on its own words. The kind being spoken lights its mark: the first
  // three in one thought, the last three in the next. The grid holds to the scene's end.
  const four = base * stageIn(t, conditions);
  if (four > 0) {
    const again = kinds.map((v, i) =>
      cueFrom(
        s,
        ["事实要有", "假设要说清", "推论要讲明", "判断要有", "决定要写明", "行动要落到"][i],
        v.toLowerCase(),
        conditions,
      ),
    );
    const conds = (
      en
        ? [
            [
              ["Source", ", subject", ", time", " and scope"],
              ["states its source", "subject", "time and scope", "and scope"],
            ],
            [["What observation could refute it"], ["what observation could refute"]],
            [
              ["Reasoning", " and", " alternative explanations"],
              ["its reasoning", "alternative explanations", "alternative explanations"],
            ],
            [
              ["Criterion", ", confidence", " and limits"],
              ["its criterion", "confidence", "and limits"],
            ],
            [
              ["Who made it", ", the trade-off", ", what triggers a revisit"],
              ["who made it", "the trade-off", "and what would trigger"],
            ],
            [
              ["Owner", ", deadline", ", completion condition"],
              ["its owner", "deadline", "completion condition"],
            ],
          ]
        : [
            [
              ["来源", "、对象", "、时间", "和范围"],
              ["要有来源", "对象", "时间和范围", "和范围"],
            ],
            [["什么观察能推翻它"], ["什么观察能推翻"]],
            [
              ["推理过程", "和其他解释"],
              ["推理过程", "和其他解释"],
            ],
            [
              ["标准", "、把握", "和限度"],
              ["要有标准", "把握", "和限度"],
            ],
            [
              ["谁定的", "、怎么取舍", "、什么情况下重新考虑"],
              ["谁定的", "怎么取舍", "什么情况下重新考虑"],
            ],
            [
              ["谁来做", "、什么时候做完", "、怎样算完"],
              ["谁来做", "什么时候做完", "怎样算完"],
            ],
          ]
    ).map(([parts, words]) => [parts, words.map((w) => cue(s, w, w))]);
    // The grid stands centred in each state as its conditions build. The right column's conditions are shorter than the
    // statements the grid was laid out for, so from the stage's cut the grid moves right to stand centred on its names
    // alone; on the hypothesis's condition, which reaches furthest right, it moves back left to stand centred on it; and on
    // the judgment's words it moves to stand centred between the judgment's conditions and the whole grid. In Chinese,
    // whose last conditions stand on one line, it stands centred on the judgment's conditions until the action's first
    // condition, and moves then to stand centred on the whole grid. The grid's left edge is its marks', 26 px left of its
    // left column. Each Chinese
    // condition stands on one line, as does the English inference's, which no break keeps whole as a phrase in an even
    // block; the other English conditions break at their commas.
    const condWidth = (i) => (en ? (i === 2 ? 520 : S06TEXT) : 540);
    const condW = (i) =>
      Math.max(
        ...growTexts(conds[i][0], condWidth(i), LABEL).map((line) =>
          line.reduce((sum, [, v]) => sum + measure(v), 0),
        ),
      );
    const textX = (i) => s06Place(i)[0] + S06R + NAME_GAP,
      kindsEnd = Math.max(...[1, 3, 5].map((i) => textX(i) + measure(kinds[i], LABEL, true)));
    const reach = [1, 3, 5].reduce(
      (v, i) => [...v, Math.max(v.at(-1), textX(i) + condW(i))],
      [kindsEnd],
    );
    const mid = (a, b) => 960 - (400 - S06R + (a + b) / 2) / 2;
    const centred = [
      mid(reach[0], reach[0]),
      mid(reach[1], reach[1]),
      L(mid(reach[2], reach[2]), mid(reach[2], reach[3])),
      L(mid(reach[3], reach[3]), mid(reach[2], reach[3])),
    ];
    const moves = [
      conditions + STAGE_CUT,
      conds[1][1][0] + 0.05,
      again[3] + 0.05,
      conds[5][1][0] + 0.05,
    ];
    const ox = moves.reduce((x, at, k) => {
      const d = centred[k] - (k ? centred[k - 1] : 0);
      return x + d * glide(t, at, d);
    }, 0);
    if (!en) {
      const own = cue(s, "各有各要交代的", ""),
        next = cue(s, "判断要有", "");
      // The heading arrives just before its words, within the sync tolerance, so the statements that left are replaced
      // by a name within the thought's first second; it heads the grid, so it moves with it.
      nameText("各有各要交代的", 960 + ox, S06ROWS[0] - S06R - NAME_GAP - 20, {
        valign: "bottom",
        alpha: four * named(t, own - 0.18) * (1 - ramp(t, next + 0.05, 0.3)),
      });
    }
    conds.forEach(([parts, ats], i) => {
      const [x0, y] = s06Place(i),
        x = x0 + ox,
        left = x + S06R + NAME_GAP;
      // The kind being spoken lights its mark, which beats once for each of its conditions after the first.
      s06Mark(i, x, y, { alpha: four, lit: speaking(t, again, i) });
      beats(t, x, y, S06R + 10, ats.slice(1), { color: s06Colour(i), alpha: four });
      s06Kind(kinds[i], i, left, y, { alpha: four, set: "kinds" });
      growName(t, parts, ats, left, y + labelSize(LABEL) / 2 + S06HEAD, {
        width: condWidth(i),
        alpha: four * listLevel(t, again, i),
        set: "conditions",
      });
    });
  }
};

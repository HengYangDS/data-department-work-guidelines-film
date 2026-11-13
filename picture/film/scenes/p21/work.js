/* 21's first stages: an Agent's output checked as the work and not its summary, and the checklist the check reads
 * the work by. */

import { ctx } from "../../canvas.js";
import { tableIcon } from "../../drawing/datasets.js";
import { flowDot, pass } from "../../drawing/flows.js";
import { link } from "../../drawing/links.js";
import { s17Page } from "../../drawing/pages.js";
import { box, diamond, dot, fill, line, path, text } from "../../drawing/strokes.js";
import { check, clock, documentIcon, person, ring, seal } from "../../drawing/symbols.js";
import { listLevel, named, speaking } from "../../naming/lists.js";
import { NAME_GAP, nameText } from "../../naming/names.js";
import { P } from "../../palette.js";
import { L, en } from "../../timeline.js";
import { cue } from "../../timing/cues.js";
import { ease, mix, ramp, soon } from "../../timing/easing.js";
import { GLIDE_PEAK, glide } from "../../timing/pace.js";
import { pauseHold, voiceTime } from "../../timing/pauses.js";

/* Stage 1: the Agent's output as a stack of pages under the check's lens, the work and not just its summary. */
export function s21Output(
  s,
  t,
  WX,
  WY,
  WW,
  WH,
  wcx,
  wcy,
  work,
  lens,
  output,
  actual,
  summary,
  one,
) {
  // The summary stands on the stack's bottom line, so the two names under them share one baseline.
  const SX = 1090,
    SW = 190,
    SH = 240,
    SY = WY + WH - SH,
    scx = SX + SW / 2;
  const go = glide(t, actual + 0.05, Math.hypot(70, 60)),
    sway = ramp(voiceTime(t), voiceTime(actual + 1), 0.6),
    v = voiceTime(t) - voiceTime(actual);
  // The stack's pages span WX to WX + WW + 52; alone, they stand that far right of their place. The move to their
  // place beside the summary is a glide; it advances in voice time, so a move still under way when the English thought
  // ends on "summary" rests with the voice and settles as the next thought begins.
  const pairOff = 960 - (2 * WX + WW + 52) / 2,
    paired = glide(t, summary + 0.05, pairOff),
    lead = pairOff * (1 - paired);
  // The lens settles within a short reach of where it stands at first, so it never slides across the frame.
  const opens = named(t, s.words[0].start),
    LX = wcx + 70,
    LY = wcy - 80;
  work(one * opens, WX + lead);
  s17Page(SX, SY, SW, SH, { alpha: one * named(t, summary), rows: 2 });
  // The output's name heads what stands of it: the stack alone, then the stack and its summary, moving to their centre
  // on the summary's words.
  const headX = mix(960, (WX + SX + SW) / 2, paired);
  nameText(L("智能体的输出", "An Agent's output"), headX, WY - 52 - NAME_GAP, {
    valign: "bottom",
    alpha: one * named(t, output),
  });
  nameText(L("实际的工作", "The work"), wcx + 26 + lead, WY + WH + NAME_GAP, {
    valign: "top",
    alpha: one * named(t, actual),
  });
  nameText(L("它写的摘要", "Its summary"), scx, SY + SH + NAME_GAP, {
    valign: "top",
    color: P.muted,
    alpha: one * named(t, summary),
  });
  lens(
    mix(LX, wcx, go) + lead + Math.sin(v * 1.1) * 10 * sway,
    mix(LY, wcy - 20, go) + Math.cos(v * 0.9) * 7 * sway,
    one * opens,
  );
}

/* Stage 2: the work as one page whose questions build down it as a checklist. */
export function s21Checklist(s, t, two) {
  const c = (zh, english) => cue(s, zh, english);
  // Each part's marks, on the words that show them, and the word that ticks the part.
  const marks = en
    ? [
        [c("", "authority"), c("", "the state current")],
        [c("", "inputs")],
        [c("", "assumptions"), c("", "inferences"), c("", "and judgments")],
        [c("", "actual changes"), c("", "agreed and reported scope")],
        [
          c("", "verification"),
          c("", "current version"),
          c("", "right environment"),
          c("", "really run"),
        ],
        [c("", "anything highrisk"), c("", "the decision owner"), c("", "explicitly approve")],
      ]
    : [
        [c("行动依据", ""), c("现状", "")],
        [c("输入", "")],
        [c("假定", ""), c("推论", ""), c("判断", "")],
        [c("实际改动", ""), c("约定", "")],
        [c("核验真在", ""), c("当前版本", ""), c("正确环境", ""), c("跑过吗", "")],
        [c("高风险的操作", ""), c("决策负责人", ""), c("明确批准", "")],
      ];
  const sealAt = Math.max(marks[5][0], marks[5][2]) + 0.05;
  // The scope row's question ends on its scope, which the English names after "agreed and reported".
  const ticks = (
    en
      ? [
          c("", "current"),
          c("", "true and complete"),
          c("", "kept apart"),
          c("", "reported scope") + 0.45,
          marks[4][2] + 0.45,
        ]
      : [c("最新", ""), c("真实完整", ""), c("分清了吗", ""), c("一致吗", ""), marks[4][3] + 0.45]
  ).concat(sealAt);
  const starts = marks.map((v) => Math.min(...v));
  const PL = 360,
    PW = 1200,
    pitch = 90,
    IX = 480,
    NX = 620,
    TX = PL + PW - 60;
  // A row whose words open a thought reflows the page on those words, not in the quiet before them, and the page is
  // grown to take the row before the row stands in it.
  const shown = starts.map((at) => soon(t, pauseHold(at - 0.3, 0.4), 0.4)),
    n = shown.reduce((a, b) => a + b, 0);
  const rowAt = starts.map((at) => Math.max(at - 0.15, pauseHold(at - 0.3, 0.4) + 0.25));
  // A mark stands on its words, and not before its row does.
  const on = (k, j) => ramp(t, Math.max(marks[k][j] - 0.15, rowAt[k]), 0.4) * two;
  const yOf = (k) => 500 + (k - (n - 1) / 2) * pitch,
    top = 500 - (n * pitch) / 2 - 24,
    bottom = 500 + (n * pitch) / 2 + 24;
  documentIcon(PL, top, PW, bottom - top, { alpha: two, rows: 0 });
  nameText(L("实际的工作", "The work"), PL, top - NAME_GAP, {
    align: "left",
    valign: "bottom",
    alpha: two,
  });
  const names = en
    ? [
        "Authority to act",
        "Inputs",
        "Assumptions, inferences and judgments",
        "Actual changes",
        "Verification",
        "Approve anything high-risk",
      ]
    : ["行动依据和现状", "输入", "假定、推论和判断", "实际改动", "核验", "高风险的操作"];
  names.forEach((v, k) => {
    // The row being asked stays marked until the next row stands, so its mark never fades in the quiet before it. The
    // mark enters with its row, which may stand after the row's words begin, so it never appears at once.
    const y = yOf(k),
      row = ramp(t, rowAt[k], 0.4) * two,
      lit =
        k + 1 < starts.length
          ? ramp(t, starts[k] - 0.15, 0.3) * (1 - ramp(t, rowAt[k + 1], 0.3))
          : speaking(t, starts, k);
    if (row <= 0) return;
    if (lit > 0)
      line(PL + 22, y - 30, PL + 22, y + 30, { color: P.evidence, alpha: lit * row, width: 4 });
    // The row is one mark under its name: a rule under the row runs from its marks to the box where it is ticked.
    line(IX - 80, y + 40, TX + 18, y + 40, { color: P.line, alpha: row, width: 2 });
    // The reviewer reads the row: a bright run travels along its rule, under its name, from its marks to its box while
    // it is asked, easing off and settling as the row is ticked, and leaves as the row is ticked. It runs in voice
    // time, so a run still under way when a thought ends rests in the quiet.
    const read = ease(
        (voiceTime(t) - voiceTime(starts[k])) /
          Math.max(
            0.6,
            voiceTime(ticks[k]) - voiceTime(starts[k]),
            (1.5 * (TX - 90 - IX + 80)) / GLIDE_PEAK,
          ),
      ),
      rx = mix(IX - 80, TX - 90, read);
    if (read > 0 && read < 1)
      line(rx, y + 40, rx + 60, y + 40, {
        color: P.evidence,
        alpha: two * pass(read, 0.15),
        width: 6,
      });
    // The box stands level with its row's name, centred on the name's line and clear of the rule under it.
    box(TX - 18, y - 18, 36, 36, { stroke: P.evidence, alpha: row, radius: 6, width: 2.5 });
    if (k === 0) {
      // The basis, a document under a seal, and the current state, a clock.
      documentIcon(IX - 74, y - 34, 52, 68, { alpha: on(0, 0), rows: 0 });
      dot(IX - 26, y + 24, 13, { color: P.row, alpha: on(0, 0) });
      seal(IX - 26, y + 24, 13, { alpha: on(0, 0) });
      clock(IX + 44, y, 24, { hand: 0.3, color: P.evidence, alpha: on(0, 1) });
    }
    // The inputs: the full set of records the work read.
    if (k === 1)
      for (let j = 0; j < 3; j++)
        tableIcon(IX - 74 + j * 20, y - 32 + j * 12, 100, 40, {
          alpha: on(1, 0),
          rows: 3,
          cols: 3,
        });
    if (k === 2) {
      // Assumptions, inferences and judgments, each its own mark as 06 marks a kind: an assumption a dashed ring, an
      // inference a therefore, a judgment its beam on a stand; two dividers rise between them as the row is ticked.
      ring(IX - 52, y, 14, { color: P.muted, alpha: on(2, 0), width: 2.5, dash: [4, 4] });
      [
        [-7, 6],
        [7, 6],
        [0, -7],
      ].forEach(([dx, dy]) => dot(IX + dx, y + dy, 3.5, { color: P.ink, alpha: on(2, 1) }));
      line(IX + 52, y - 12, IX + 52, y + 12, { color: P.ink, alpha: on(2, 2), width: 2.5 });
      line(IX + 38, y - 10, IX + 66, y - 10, { color: P.ink, alpha: on(2, 2), width: 2.5 });
      line(IX + 44, y + 12, IX + 60, y + 12, { color: P.ink, alpha: on(2, 2), width: 2.5 });
      [IX - 26, IX + 26].forEach((x, j) =>
        link(x, y + 24, x, y - 24, {
          color: P.line,
          alpha: two,
          draw: { t, at: ticks[2] + 0.05 + j * 0.12 },
          end: false,
          width: 2,
        }),
      );
    }
    if (k === 3) {
      // The changes, inside the agreed scope that is drawn around them.
      [
        [-52, -18, 70],
        [-24, 0, 84],
        [-46, 18, 56],
      ].forEach(([dx, dy, w]) =>
        box(IX + dx, y + dy - 6, w, 12, { fill: P.evidence, alpha: on(3, 0), radius: 6 }),
      );
      const scope = { t, at: marks[3][1] + 0.05 };
      path(
        [
          [IX - 76, y - 36],
          [IX + 76, y - 36],
          [IX + 76, y + 36],
          [IX - 76, y + 36],
          [IX - 76, y - 36],
        ],
        { color: P.ink, alpha: two, width: 2.5, draw: scope },
      );
    }
    if (k === 4) {
      // The verification: a run on the current version, in the right environment around it.
      const runX = IX - 34;
      ring(runX, y, 24, { color: P.evidence, alpha: on(4, 0), width: 3 });
      fill(
        () => {
          ctx.moveTo(runX - 7, y - 10);
          ctx.lineTo(runX + 11, y);
          ctx.lineTo(runX - 7, y + 10);
          ctx.closePath();
        },
        { color: P.evidence, alpha: on(4, 0) },
      );
      const lap = glide(t, marks[4][3] + 0.05, 2 * Math.PI * 24, 1);
      if (lap > 0 && lap < 1)
        flowDot(
          runX + 24 * Math.cos(-Math.PI / 2 + lap * Math.PI * 2),
          y + 24 * Math.sin(-Math.PI / 2 + lap * Math.PI * 2),
          6,
          lap,
          { alpha: two },
          2 * Math.PI * 24,
        );
      box(IX + 10, y - 17, 54, 34, { fill: P.row, alpha: on(4, 1), radius: 6 });
      text("v2", IX + 37, y + 1, 26, {
        role: "mark",
        align: "center",
        color: P.evidence,
        alpha: on(4, 1),
      });
      box(IX - 78, y - 38, 156, 76, { stroke: P.ink, alpha: on(4, 2), radius: 12, width: 2 });
    }
    if (k === 5) {
      // The high-risk action and the decision owner, whose seal moves onto the action once it is approved.
      diamond(IX - 46, y + 6, 18, { color: P.unknown, alpha: on(5, 0), solid: true });
      person(IX + 44, y + 12, { color: P.authority, alpha: on(5, 1), size: 0.8 });
      const move = soon(t, sealAt, 0.35),
        sealX = mix(IX + 44, IX - 26, move),
        sealY = mix(y - 30, y - 12, move);
      dot(sealX, sealY, 14, { color: P.row, alpha: on(5, 2) });
      seal(sealX, sealY, 14, { alpha: on(5, 2) });
    }
    // Each row is ticked in its box on its words; its name stands on the row's first words, one list down the page.
    check(TX, y, 24, { alpha: two, draw: { t, at: ticks[k] + 0.05 } });
    nameText(v, NX, y, {
      align: "left",
      alpha: two * ramp(t, rowAt[k], 0.4) * listLevel(t, starts, k),
      set: "checks",
    });
  });
}

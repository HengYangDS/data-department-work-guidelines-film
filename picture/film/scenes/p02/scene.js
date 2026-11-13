/* 02 purpose: four failures, three outcomes. The scene: its cues and the cuts between its stages, each stage on the
 * words that name it. */

import { ctx } from "../../canvas.js";
import { blend } from "../../drawing/colour.js";
import { flowDot, loopPhase, since } from "../../drawing/flows.js";
import { link } from "../../drawing/links.js";
import {
  box,
  diamond,
  dot,
  labelSize,
  line,
  measure,
  path,
  stroke,
  text,
} from "../../drawing/strokes.js";
import {
  agent,
  check,
  clock,
  cross,
  documentIcon,
  person,
  ring,
  token,
} from "../../drawing/symbols.js";
import { beats, listLevel, named, speaking } from "../../naming/lists.js";
import { NAME_GAP, nameText, wrapName } from "../../naming/names.js";
import { growName, growTexts } from "../../naming/parts.js";
import { CONTENT_CY } from "../../naming/placement.js";
import { rejectedName } from "../../naming/rejected.js";
import { NOTE, termRow, termRowLayout } from "../../naming/terms.js";
import { LABEL, P } from "../../palette.js";
import { L, en } from "../../timeline.js";
import { cue, cues } from "../../timing/cues.js";
import { mix, ramp, soon } from "../../timing/easing.js";
import { drawShare, glide } from "../../timing/pace.js";
import { STAGE_CUT, stageIn, stageOut } from "../../timing/stages.js";
import { scenes } from "../registry.js";

scenes["02"] = function (s, t) {
  const [guide, agree, four, task, three] = cues(s, [
    ["数据部门工作指南", "Data Department Work Guidelines"],
    ["部门关于工作质量的契约", "contract for work quality"],
    ["四种失败", "four failures"],
    ["一项任务", "a task"],
    ["三件事", "achieve three things"],
  ]);
  const starts = cues(s, [
    ["把事实和选择", "confuses facts with choices"],
    ["只治了症状", "fixes the symptom"],
    ["沟通完了", "is communication"],
    ["人工智能写出了", "is ai that produces"],
  ]);
  // 1. The guidelines as the scene's first words name them: the guideline stands in one cut at the centre on those
  // words, named as they are called, and its rows are written in turn; when it is called the department's contract, the
  // department's members stand on either side of the contract they share.
  const one = stageOut(t, four);
  if (one > 0) {
    // The guideline is a page whose seven rows fill it.
    const DW = 250,
      DH = 330,
      DX = 960 - DW / 2,
      DY = CONTENT_CY + 30 - DH / 2,
      rowY = (i) => DY + DH * (0.2 + i * 0.11),
      rows = [0, 1, 2, 3, 4, 5, 6];
    // The page and its name stand on the guidelines' words, and its rows are written in turn as one hand's lines.
    const doc = stageIn(t, guide) * one;
    documentIcon(DX, DY, DW, DH, { alpha: doc, rows: 0 });
    nameText(L("数据部门工作指南", "Data Department Work Guidelines"), 960, DY - NAME_GAP, {
      valign: "bottom",
      alpha: doc * named(t, guide),
    });
    const rowAt = (i) => guide + STAGE_CUT + i * 0.06,
      x0 = DX + 50;
    rows.forEach((i) =>
      dot(DX + 34, rowY(i), 5, { color: P.evidence, alpha: doc * ramp(t, rowAt(i), 0.25) }),
    );
    stroke(
      () =>
        rows.forEach((i) => {
          const q = drawShare(t, rowAt(i), DX + DW * (i % 2 ? 0.7 : 0.86) - x0);
          if (q > 0.01) {
            ctx.moveTo(x0, rowY(i));
            ctx.lineTo(mix(x0, DX + DW * (i % 2 ? 0.7 : 0.86), q), rowY(i));
          }
        }),
      { color: P.line, alpha: doc * ramp(t, rowAt(0), 0.35), width: 2 },
    );
    // The department's members stand on either side of the contract on its words.
    const members = named(t, agree) * one;
    [-1, 1].forEach((k) =>
      person(960 + k * 440, CONTENT_CY + 20, { alpha: members, color: P.authority, size: 1.3 }),
    );
    nameText(
      L("部门关于工作质量的契约", "The department's contract for work quality"),
      960,
      DY + DH + NAME_GAP,
      { valign: "top", width: 760, alpha: members },
    );
  }
  // 2. Four failures as the four places of one grid. The words that count them draw the grid's dividing cross, firm,
  // with its name, so the four places stand in view from the count; each failure takes its place, its number and its
  // title on its own words and stays, and its picture builds under its title. The failure being described lights its
  // number. The completed grid stands until the words name the task that delivers the outcomes.
  const two = stageIn(t, four) * stageOut(t, task);
  // The grid stands 40 px below the content centre, so the count's name over its cross stands clear of the running
  // head; its cells keep 20 px from the vertical axis, and the horizontal axis runs 20 px past the outer cells, so every
  // cell's content keeps one inset from the line at its left.
  const W = 760,
    H = 330,
    GY = CONTENT_CY + 40,
    cells = [0, 1, 2, 3].map((i) => [960 + (i % 2 ? 20 : -20 - W), GY + (i > 1 ? 15 : -15 - H)]);
  if (two > 0) {
    // Each failure is named by its key words, so the title reads at a glance beside the sentence that states it; the
    // English third is the communication the charter names, and its seats below say what it leaves.
    const titles = en
      ? [
          ["Confusing facts with choices"],
          ["Fixing the symptom", ", not the mechanism"],
          ["Communication"],
          ["AI that produces more material"],
        ]
      : [
          ["把事实和选择混在一起"],
          ["只治了症状", "，没改机制"],
          ["沟通完了"],
          ["人工智能写出了更多材料"],
        ];
    const titleAts = [
      [starts[0]],
      [starts[1], cue(s, "没改机制", "and leaves the mechanism")],
      [starts[2]],
      [starts[3]],
    ];
    const top = cells[0][1],
      bottom = cells[3][1] + H;
    line(960, top, 960, bottom, { color: P.line, alpha: two, width: 4 });
    line(cells[0][0] - 20, GY, cells[1][0] + W + 20, GY, { color: P.line, alpha: two, width: 4 });
    // The count's name stands with the grid while its four failures stand.
    nameText(L("四种失败", "Four failures"), 960, top - NAME_GAP, {
      valign: "bottom",
      alpha: two * named(t, four),
    });
    cells.forEach(([x0, y0], i) => {
      const lit = speaking(t, starts, i),
        ty = y0 + 46,
        own = ramp(t, starts[i] - 0.15, 0.4) * two;
      text(String(i + 1), x0 + 42, ty, 26, {
        role: "mark",
        align: "center",
        color: blend(P.muted, P.evidence, lit),
        alpha: own,
      });
      growName(t, titles[i], titleAts[i], x0 + 72, ty - labelSize(LABEL) / 2, {
        width: W - 110,
        alpha: two * listLevel(t, starts, i),
        set: "failures",
      });
    });
    // Failure 1: the late data, a fact, and the change of vendors, a choice, are bound together by one tie that draws on
    // from the fact once the choice is named; on the words that set them apart, 'two different things' or the choice
    // named as a choice, the tie fades as a divider draws down between them at the tip pace, so neither the tie leaves
    // nor the divider arrives in one frame.
    const [late, vendor, apart] = cues(s, [
      ["数据晚到了", "data arriving late"],
      ["要不要换供应商", "changing vendors"],
      ["是两件事", "is a choice"],
    ]);
    {
      const [x0, y0] = cells[0],
        my = y0 + 175,
        fx = x0 + 210,
        cx = x0 + 550,
        split = ramp(t, apart + 0.05, 0.35);
      clock(fx, my, 30, { hand: 0.2, color: P.evidence, alpha: named(t, late) * two });
      diamond(cx, my, 30, { color: P.authority, alpha: named(t, vendor) * two });
      link(fx + 44, my, cx - 44, my, { alpha: two * (1 - split), draw: { t, at: vendor + 0.05 } });
      // The divider that sets them apart stands midway in the clear space between their names.
      const lateName = L("数据晚到了", "Data arriving late"),
        vendorName = L("要不要换供应商", "Changing vendors");
      const wide = (v) => Math.max(...wrapName(v, 300).map((line) => measure(line))),
        dx = (fx + wide(lateName) / 2 + cx - wide(vendorName) / 2) / 2;
      const divided = drawShare(t, apart + 0.05, 150);
      if (divided > 0.01)
        line(dx, my - 54, dx, my - 54 + 150 * divided, { color: P.line, alpha: two, width: 2 });
      nameText(lateName, fx, my + 40 + NAME_GAP, {
        valign: "top",
        width: 300,
        color: P.evidence,
        alpha: two * named(t, late),
      });
      nameText(vendorName, cx, my + 40 + NAME_GAP, {
        valign: "top",
        width: 300,
        color: P.authority,
        alpha: two * named(t, vendor),
      });
    }
    // Failure 2: a mechanism with a break leaks; a patch by hand catches the leak below it, but the break stays, and next
    // month the leak runs past the patch again.
    const [backfill, month] = cues(s, [
      ["手工补一次数据", "someone backfills by hand"],
      ["下个月照样出错", "next month it breaks again"],
    ]);
    {
      const [x0, y0] = cells[1],
        py = y0 + 152,
        xb = x0 + 240,
        on = ramp(t, starts[1] - 0.15, 0.4) * two;
      line(x0 + 80, py, xb - 22, py, { color: P.ink, alpha: on, width: 4 });
      line(xb + 22, py, x0 + W - 80, py, { color: P.ink, alpha: on, width: 4 });
      cross(xb, py - 32, 20, { alpha: on });
      const patched = named(t, backfill) * two,
        again = named(t, month) * two,
        PY = py + 62;
      // The patch itself stands from just before its words, so it is in place before a drop that runs down to it leaves.
      box(xb - 50, PY - 13, 100, 26, {
        fill: P.row,
        stroke: P.muted,
        alpha: ramp(t, backfill - 0.35, 0.3) * two,
        radius: 6,
      });
      // One drop at a time leaks from the break at the film's flow pace: it runs down to the patch's place and leaves by
      // its size there, and below it comes out by its size and runs on, unless the patch holds it.
      const upper = 30,
        lower = y0 + H - 42 - PY,
        run = loopPhase(since(t, starts[1] - 0.15), upper + lower);
      if (run !== null) {
        const at = run * (upper + lower);
        if (at < upper)
          flowDot(xb, py + 14 + at, 5, at / upper, { color: P.unknown, alpha: on }, upper);
        else
          flowDot(
            xb,
            PY + 18 + at - upper,
            5,
            (at - upper) / lower,
            { color: P.unknown, alpha: on * (1 - patched + again) },
            lower,
          );
      }
      nameText(L("手工补一次数据", "Someone backfills by hand"), xb + 50 + NAME_GAP, PY, {
        align: "left",
        color: P.muted,
        alpha: patched,
      });
      nameText(L("下个月照样出错", "Next month it breaks again"), xb + 50 + NAME_GAP, PY + 70, {
        align: "left",
        alpha: again,
      });
    }
    // Failure 3: the communication is over, and the two seats it should leave filled stay empty: no one able to decide
    // or act, each seat standing on its own words with an open question in it. The two are one phrase, so they
    // take one name in one colour, whole from its first words and centred under both seats, which stand at equal
    // distances either side of it.
    const [decide, act] = cues(s, [
      ["没有人能做决定", "no one able to decide"],
      ["或动手", "or act"],
    ]);
    {
      const [x0, y0] = cells[2],
        my = y0 + 165,
        on = ramp(t, starts[2] - 0.15, 0.4) * two;
      [
        [x0 + 130, my - 14],
        [x0 + 190, my + 24],
      ].forEach(([bx, by]) => {
        box(bx - 56, by - 22, 112, 44, { stroke: P.muted, alpha: on, radius: 18 });
        [-16, 0, 16].forEach((dx) => dot(bx + dx, by, 3, { color: P.muted, alpha: on }));
      });
      const whole = L("没有人能做决定或动手", "No one able to decide or act"),
        cx = x0 + 505,
        D = Math.max(80, measure(whole) / 4);
      [
        [cx - D, decide],
        [cx + D, act],
      ].forEach(([sx, at]) => {
        const q = named(t, at) * two;
        person(sx, my, { alpha: q, color: P.line, size: 1.2, solid: false });
        text("?", sx, my - 21, 26, { role: "mark", align: "center", color: P.unknown, alpha: q });
      });
      nameText(whole, cx, my + 44 + NAME_GAP, { valign: "top", alpha: two * named(t, decide) });
    }
    // Failure 4: the Agent's material climbs on its words while judgment and results stay flat beside it.
    const [more, grow] = cues(s, [
      ["更多材料", "more material"],
      ["没有变得更可靠", "grow no more"],
    ]);
    {
      const [x0, y0] = cells[3],
        on = ramp(t, starts[3] - 0.15, 0.4) * two,
        base = y0 + 270,
        ox = x0 + 260,
        ex = x0 + W - L(220, 240);
      agent(x0 + 110, y0 + 160, { alpha: on, size: 1.1 });
      const rise = soon(t, more - 0.1, 1.6),
        flat = soon(t, grow - 0.1, 0.9),
        top = base - 150 * rise;
      line(ox, base, ex, base, { color: P.line, alpha: on, width: 2 });
      line(ox, base, ox, y0 + 90, { color: P.line, alpha: on, width: 2 });
      path(
        [
          [ox, base - 10],
          [mix(ox, ex, rise), base - 10 - 150 * rise],
        ],
        { color: P.muted, alpha: on * ramp(t, more - 0.15, 0.3), width: 3 },
      );
      path(
        [
          [ox, base - 40],
          [mix(ox, ex, flat), base - 40],
        ],
        { color: P.authority, alpha: named(t, grow) * two, width: 3.5 },
      );
      nameText(L("材料", "Material"), ex + NAME_GAP, top - 10, {
        align: "left",
        color: P.muted,
        alpha: two * named(t, more),
      });
      nameText(L("判断和结果", "Judgment and results"), ex + NAME_GAP, base - 40, {
        align: "left",
        width: L(200, 300),
        color: P.authority,
        alpha: two * named(t, cue(s, "判断和结果", "judgment and results")),
      });
    }
  }
  // 3. Three outcomes as one column of rows, delivered by one task. The stage cuts in on the words that name the task,
  // which stands left of centre with its name, and the column it delivers to stands to its right. On the words that
  // count the outcomes the column is named and the task's three ways draw out to the outcomes' places, so the three
  // stand in view from the count; each outcome draws its ring at its way's end, inks the ring and takes its name on its
  // own words, and lights while it is spoken. On the last thought three required reports, aligned with its rows, are
  // refused on the task's other side. Everything stands where it ends from the cut, so nothing slides when the reports
  // join: the stage stands centred between its last two pictures, the task with its whole column and the whole stage
  // with the reports, so the column leans as far right of the centre as the finished stage leans left.
  const out = stageIn(t, task);
  if (out > 0) {
    const reports = cue(s, "三份必须交的报告", "three required reports");
    // Each outcome is named by its key words: in English as a result, so its name reads at a glance rather than repeating
    // the spoken command, and in Chinese by the words that state it; the second, a clause in Chinese, keeps under its
    // name only what the test must state, when the judgment holds, so its row does not repeat the spoken clause whole;
    // the third, a sentence in Chinese, takes the run of its spoken words that names what the work system can do better,
    // its alternative included, as its name on one line.
    const rows = en
      ? [
          [["Problem solved"], []],
          [["Judgment tested"], ["with its limits"]],
          [
            ["Work system left better"],
            ["able to recognize", " or handle", " the next occurrence"],
          ],
        ]
      : [
          [["解决问题"], []],
          [["检验判断"], ["在什么情况下成立"]],
          [["工作体系能更好地发现或应对"], []],
        ];
    const termAts = en
      ? [
          [cue(s, "", "solve the problem")],
          [cue(s, "", "test the judgment")],
          [cue(s, "", "and leave the")],
        ]
      : [[cue(s, "解决问题", "")], [cue(s, "检验判断", "")], [cue(s, "工作体系能更好地发现", "")]];
    // The third gloss stands whole from its first words; its second cue, "handle", settles the outcome's centre.
    const qualAts = [
      [],
      [cue(s, "说清它在什么情况下成立", "and its limits")],
      en
        ? [
            cue(s, "", "able to recognize"),
            cue(s, "", "or handle the next"),
            cue(s, "", "or handle the next"),
          ]
        : [],
    ];
    const ats = termAts.map((v) => v[0]),
      settles = en ? qualAts[2][1] : cue(s, "应对", "");
    // The third gloss, the longest, takes two lines, so the column's right edge stays near its other rows'; in English
    // it breaks before the occurrence both verbs act on, so its first line is the longer and the row's three lines,
    // with the outcome's name, do not zigzag.
    const width = 640,
      widths = [width, width, L(400, 420)],
      R = 64,
      TR = 18,
      run = 150,
      taskName = L("一项任务", "A task");
    // The stage's extents from the task: the rows' names begin 300 px right of it, the task's name centres on it and the
    // reports' column begins 186 px left of it.
    const lineW = (parts, w, size) =>
      Math.max(
        ...growTexts(parts, w, size).map((line) =>
          line.reduce((sum, [, v]) => sum + measure(v, size), 0),
        ),
      );
    const rowsEnd =
      300 +
      Math.max(
        ...rows.map(([term, qual], i) =>
          Math.max(lineW(term, widths[i], LABEL), qual.length ? lineW(qual, widths[i], NOTE) : 0),
        ),
      );
    const columnMid = (rowsEnd - Math.max(TR + 7, measure(taskName) / 2)) / 2,
      stageMid = (rowsEnd - 186) / 2;
    const TY = CONTENT_CY + 30,
      TX = Math.round(960 - (columnMid + stageMid) / 2),
      MX = TX + run + R,
      NX = MX + R + NAME_GAP,
      RX = TX - 160;
    const ys = [TY - 170, TY, TY + 170],
      colors = [P.ink, P.evidence, P.authority];
    // Until the first outcome arrives the task stands right of its place, balanced between the task alone and the task
    // with its ways and the outcomes' name (in English, whose task stands alone only briefly, mostly the latter), and it
    // moves to its place with the first outcome, on its words. The outcomes' name begins `run` right of the task, at its
    // rings' left, past the ways' ends.
    const pairMid =
      (run + measure(L("三件事", "Three things")) - Math.max(TR + 7, measure(taskName) / 2)) / 2;
    const early = 960 - TX - L(0.35, 0.8) * pairMid;
    // The third outcome reaches further right than the first two, so until it arrives the stage stands right by half that
    // reach, where the finished column centres it, and eases left on its words; the first move takes the rest of `early`.
    const before3 =
      300 +
      Math.max(
        ...rows
          .slice(0, 2)
          .map(([term, qual], i) =>
            Math.max(lineW(term, widths[i], LABEL), qual.length ? lineW(qual, widths[i], NOTE) : 0),
          ),
      );
    const lean3 = Math.max(0, (rowsEnd - before3) / 2);
    ctx.save();
    ctx.translate(
      (early - lean3) * (1 - glide(t, ats[0] + 0.05, early - lean3)) +
        lean3 * (1 - glide(t, ats[2] + 0.05, lean3)),
      0,
    );
    token(TX, TY, { r: TR, alpha: out * named(t, task) });
    nameText(taskName, TX, TY + TR + 7 + NAME_GAP, { valign: "top", alpha: out * named(t, task) });
    rows.forEach(([term, qual], i) => {
      const y = ys[i],
        on = ramp(t, ats[i] - 0.15, 0.4) * out,
        lit = speaking(t, ats, i),
        c = colors[i];
      // The outcome's way from the task draws out on the count, one after another, to the place its ring takes.
      link(TX + TR + 14, TY, MX - R - 8, y, {
        route: "hvh",
        mid: (TX + MX - R) / 2,
        alpha: out,
        draw: { t, at: three + 0.05 + 0.12 * i },
      });
      ring(MX, y, R, { color: c, alpha: on, width: 2.5 + lit, draw: { t, at: ats[i] - 0.15 } });
      // A solved problem is one decisive check.
      if (i === 0) check(MX + 2, y + 2, 50, { alpha: on, draw: { t, at: ats[i] + 0.2 }, width: 5 });
      // A tested judgment: the judgment, then the boundary where it holds drawn around it.
      if (i === 1) {
        dot(MX, y, 11, { color: c, alpha: on });
        box(MX - 36, y - 28, 72, 56, {
          stroke: c,
          alpha: named(t, qualAts[1][0]) * out,
          radius: 10,
        });
      }
      // Recognized better: the rings widen; handled better: the centre settles. Each later part of the gloss beats on one
      // more ring inside the outcome's own, on its words, so the mark answers the sentence as it is said.
      if (i === 2) {
        for (let k = 0; k < 2; k++)
          ring(MX, y, 20 + k * 18, {
            color: c,
            alpha: on * (1 - k * 0.3),
            width: 2,
            draw: { t, at: ats[i] + k * 0.3 },
          });
        dot(MX, y, 7, { color: c, alpha: named(t, settles) * out });
        beats(t, MX, y, R - 12, en ? qualAts[2] : [cue(s, "更好地发现", ""), settles], {
          color: c,
          alpha: out,
        });
      }
      // Each outcome is named on its words.
      // The list sets every qualifier one way, under its term, since one of them is too long to run on its line.
      const top = y - termRowLayout(term, qual, widths[i], false).height / 2;
      termRow(t, term, termAts[i], qual, qualAts[i], NX, top, {
        width: widths[i],
        alpha: out * listLevel(t, ats, i),
        set: "outcomes",
        inline: false,
      });
      // Three required reports, one level with each outcome on the task's other side, are refused on the last words.
      documentIcon(RX - 26, y - 34, 52, 68, {
        alpha: named(t, reports) * out * 0.8,
        stroke: P.muted,
        rows: 3,
      });
    });
    const head = ys[0] - R - NAME_GAP;
    nameText(L("三件事", "Three things"), MX - R, head, {
      align: "left",
      valign: "bottom",
      alpha: out * named(t, three),
    });
    // The refused reports' name starts at their column's left edge, its cross following it, as the outcomes' name starts
    // at its rings' left edge. The English name says the reports' kind, as its three pages count them: with its count
    // it would run its cross into the outcomes' name.
    rejectedName(L("三份必须交的报告", "Required reports"), RX - 26, head, {
      align: "left",
      valign: "bottom",
      alpha: out * named(t, reports),
      mark: ramp(t, reports + 0.3, 0.4),
    });
    ctx.restore();
  }
};

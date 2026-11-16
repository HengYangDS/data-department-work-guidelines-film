/* 01 purpose: finished is not the same as reliable. The scene: its cues and the cuts between its stages, each stage on
 * the words that name it. */

import { ctx } from "../../canvas.js";
import { blend } from "../../drawing/colour.js";
import { REPORT_ROW, reportCard, tableIcon } from "../../drawing/datasets.js";
import { flowDot, loopPhase, since } from "../../drawing/flows.js";
import { SECOND } from "../../drawing/levels.js";
import { link } from "../../drawing/links.js";
import {
  diamond,
  dot,
  labelSize,
  line,
  measure,
  path,
  stroke,
  text,
} from "../../drawing/strokes.js";
import { check, documentIcon, person, ring } from "../../drawing/symbols.js";
import { illustrative } from "../../framing/chapters.js";
import { titleSignature } from "../../framing/titles.js";
import { listIn, named, speaking } from "../../naming/lists.js";
import { NAME_GAP, nameText } from "../../naming/names.js";
import { blockHeight } from "../../naming/parts.js";
import {
  CONTENT_CY,
  HEAD_CLEAR,
  RAIL_ROW_CLEAR,
  railNames,
  railStations,
  stackTops,
} from "../../naming/placement.js";
import { rejectedName } from "../../naming/rejected.js";
import { NOTE, termRow } from "../../naming/terms.js";
import { LABEL, P } from "../../palette.js";
import { L, en } from "../../timeline.js";
import { cue, cueFrom, cues } from "../../timing/cues.js";
import { mix, ramp, soon } from "../../timing/easing.js";
import { glide } from "../../timing/pace.js";
import { pauseHold, voiceTime } from "../../timing/pauses.js";
import { STAGE_CUT, stageIn, stageOut } from "../../timing/stages.js";
import { scenes } from "../registry.js";

scenes["01"] = function (s, t) {
  const [report, next, judge, need, means, when, basis, use] = cues(s, [
    ["一份历史价格数据", "A historical price dataset"],
    ["下一位用它的人", "next person"],
    ["判断吗", "rely on it"],
    ["需要知道", "need to know"],
    ["每个数字是什么意思", "each number means"],
    ["哪个时间", "which time"],
    ["依据从哪里来", "evidence it rests"],
    ["用在哪里", "used for"],
  ]);
  const [researchers, backtest, trading, risk, unclear, chain] = cues(s, [
    ["研究员", "Researchers"],
    ["回测", "backtest"],
    ["交易系统", "trading systems"],
    ["控风险", "control risk"],
    ["说不清的数字", "nobody can explain"],
    ["顺着链条", "travels down"],
  ]);
  // The roles in the order each edition names them: Chinese names production and platforms apart, English together;
  // both name governance and operational delivery apart.
  const roles = en
    ? cues(s, [
        ["", "acquisition"],
        ["", "analysis and modeling"],
        ["", "development"],
        ["", "production and platforms"],
        ["", "product management"],
        ["", "governance"],
        ["", "operational delivery"],
      ])
    : cues(s, [
        ["采集", ""],
        ["分析建模", ""],
        ["开发", ""],
        ["生产", ""],
        ["平台", ""],
        ["产品", ""],
        ["治理", ""],
        ["运营交付", ""],
      ]);
  const [hand, file, table] = cues(s, [
    ["每个环节", "every step"],
    ["一个文件", "a file"],
    ["一张表", "a table"],
  ]);
  const paper = cue(s, "一份报告", "a report", { last: true }),
    started = cue(s, "启动一个流程", "the start of a process");
  // Opening title, then the price dataset that seems finished. The title hands the picture to the dataset in one short
  // swap just before the voice begins, so the dataset stands on the first word and the frame never loses its mark.
  const title = stageOut(t, Math.min(report, s.voice_start) - 0.45);
  if (title > 0) titleSignature(title);
  // The dataset stands through the first three thoughts; the chain of roles replaces it on the words that begin the
  // chain, its first role or, where the steps are named first, "every step"; the way to the next user replaces the chain
  // on the words that name the value it weighs, and holds to the end of the scene, which ends on that value.
  const chainAt = Math.min(roles[0], hand),
    valueAt = cue(s, "数据工作的价值", "the value of data work");
  const data = stageIn(t, Math.min(report, s.voice_start) - 0.45) * stageOut(t, chainAt);
  const stage2 = stageIn(t, chainAt) * stageOut(t, valueAt),
    worth = stageIn(t, valueAt);
  // The price dataset is an illustrative case, so the chip marks it while it is shown.
  illustrative(data);
  // The stage stays balanced as it builds, its card moving on the words that bring each part: the card alone stands
  // 30 px right of centre, so the thought that brings its next user stays balanced as a whole, steps right as its next
  // user arrives at its left, left as what they need to know builds at its right, right again as the needs give way to
  // the researcher, and left as the trading system joins. The stage stands a little below the content centre, balancing
  // the Illustrative chip in the head band.
  // The card's left edge alone, with the next user, with their needs, with the researcher and with both users.
  const places = [780, 970, 815, 990, 830],
    moves = [next, means, researchers, trading];
  const CX = moves.reduce(
    (x, at, i) => x + (places[i + 1] - places[i]) * glide(t, at + 0.05, places[i + 1] - places[i]),
    places[0],
  );
  // The next user stands at its own place from the moment it is named, while the card steps right beside it; it moves
  // with the card from the card's second place on.
  const UX = moves
    .slice(1)
    .reduce(
      (x, at, i) =>
        x + (places[i + 2] - places[i + 1]) * glide(t, at + 0.05, places[i + 2] - places[i + 1]),
      places[1],
    );
  const Y1 = CONTENT_CY + 48,
    K = 1.4,
    CY = Y1 - 180 * K,
    edgeX = CX + 300 * K,
    hotY = CY + REPORT_ROW(2, K);
  const dark = ramp(t, unclear - 0.1, 0.6);
  reportCard(CX, CY, {
    alpha: data,
    scale: K,
    highlight: ramp(t, means - 0.1, 0.5),
    unknown: dark,
    done: soon(t, report + 0.6, 0.6),
    named: data * named(t, report),
  });
  // 1. Its next user stands at the left of the data they would rely on, the data running to them, and the open question,
  // whether they can rely on it, stands at the card's other side on its words. It leaves when they are said to need to
  // know, and the four things they need then build into one column where it stood, each on its own words.
  const ask = data * stageOut(t, researchers);
  if (ask > 0) {
    // The user stands level with the value in question, the row their judgment rests on; the way from it reaches their
    // shoulders, and the researcher of the next thought takes their place on the same way.
    const PX = UX - 400,
      PY = hotY,
      user = named(t, next) * ask,
      QX = edgeX + 50,
      asking = stageOut(t, need);
    // The next user appears when named.
    person(PX, PY - 10, { alpha: user, size: 1.4 });
    nameText(L("下一位用它的人", "The next person"), PX, PY + 22 + NAME_GAP, {
      valign: "top",
      alpha: user,
    });
    link(CX - 20, PY, PX + 54, PY, { alpha: user, draw: { t, at: next - 0.1 } });
    text("?", QX, Y1, 44, {
      role: "mark",
      align: "center",
      color: P.unknown,
      alpha: ramp(t, judge - 0.1, 0.4) * ask * asking,
    });
    // Each need is named by its key words, so the column reads at a glance beside the spoken sentence.
    const needs = [means, when, basis, use],
      names = en
        ? ["What each number means", "Which time it describes", "Its evidence", "Its permitted use"]
        : ["每个数字是什么意思", "对应哪个时间", "依据从哪里来", "能用在哪里"];
    const tops = stackTops(
      names.map(() => blockHeight(1)),
      Y1,
      40,
    );
    names.forEach((v, i) => {
      const y = tops[i] + labelSize(LABEL) / 2,
        on = ramp(t, needs[i] - 0.15, 0.4) * ask;
      // Each need's ring and dot appear on its own words.
      ring(QX, y, 17, { color: P.evidence, alpha: on, width: 2.5 });
      dot(QX, y, 5 + 3 * speaking(t, needs, i), { color: P.evidence, alpha: on });
      // Each need is named lit and the earlier ones turn quiet as the next is named. The tree replaces the column as the
      // next thought names its first user, too soon for the usual return after the list, so the column returns to full
      // ink as its last need is named, and the third need stays lit rather than dimming for a moment.
      const quiet = i < 2 ? ramp(t, pauseHold(needs[i + 1] - 0.15, 0.3), 0.3) : 0,
        whole = ramp(t, use + 0.05, 0.4);
      nameText(v, QX + 17 + NAME_GAP, y, {
        align: "left",
        alpha: ask * ramp(t, needs[i] - 0.15, 0.4) * mix(mix(1, SECOND, quiet), 1, whole),
        set: "needs",
      });
    });
  }
  // 2. Two users rely on the same data: the researcher's backtest at the left and the trading system's risk control at
  // the right, each reached from the value in question by its own branch, which draws on with the user's words. When a
  // number nobody can explain is named the value turns unknown, and as it travels down the chain the unknown runs along
  // both branches and reaches both users. Each user is named with its use in a few key words, its use under its name.
  const uses = data * stageIn(t, researchers);
  if (uses > 0) {
    const xs = [CX - 400, edgeX + 180],
      ats = [researchers, trading],
      from = [CX - 20, edgeX + 16],
      to = [xs[0] + 54, xs[1] - 58];
    const rows = en
      ? [
          [["Researchers"], ["backtest"]],
          [["Trading systems"], ["control risk"]],
        ]
      : [
          [["研究员"], ["拿数据做回测"]],
          [["交易系统"], ["拿数据控风险"]],
        ];
    const qualAts = en
      ? [backtest, risk]
      : [cueFrom(s, "拿数据", "", researchers), cueFrom(s, "拿数据", "", trading)];
    // The unknown sets off down the chain as it is named and reaches both users on its last words, turning them unknown
    // while the clause is still spoken, so nothing changes in the quiet that follows it.
    const arrive = cue(s, "传下去", "down the chain"),
      travel = { t, at: chain - 0.1, least: arrive - chain };
    xs.forEach((x, i) => {
      const on = named(t, ats[i]) * uses,
        reached = ramp(t, arrive + 0.05, 0.4),
        tone = blend(P.ink, P.unknown, reached),
        y = hotY;
      ring(x, y, 46, { color: tone, alpha: on, width: 2.5 });
      if (i === 0) person(x, y + 6, { alpha: on, color: tone, size: 0.9 });
      else
        path(
          [
            [x - 26, y + 16],
            [x - 8, y - 4],
            [x + 6, y + 6],
            [x + 26, y - 18],
          ],
          { color: tone, alpha: on, width: 3 },
        );
      // The researcher's way is the next user's, already drawn; the trading system's draws on with its words.
      link(from[i], y, to[i], y, { alpha: uses, draw: i ? { t, at: ats[i] - 0.1 } : null });
      link(from[i], y, to[i], y, {
        color: P.unknown,
        alpha: uses,
        draw: travel,
        flowing: since(t, arrive - 0.1),
        lag: i * 0.5,
      });
      // The user's name and its use stand under its ring, the use under the name, each line centred on the ring's axis.
      const [term, qual] = rows[i];
      termRow(t, term, [ats[i]], qual, [qualAts[i]], x, y + 46 + NAME_GAP, {
        alpha: uses,
        inline: false,
        align: "center",
      });
    });
    nameText(L("一个说不清的数字", "A number nobody can explain"), CX + 210, CY + 504 + NAME_GAP, {
      valign: "top",
      alpha: uses * named(t, unclear),
    });
  }
  // 3. The chain of roles: one station for each role named, on one rail, seven in English and eight in Chinese, which
  // names production and platforms apart. The rail is the chain's span, one firm rail standing whole on the
  // words that open it, its first role in Chinese and "every step" in English, so the chain is in view from its first
  // words. Each role stands at its station on its own words, and the way to it from the one before draws on over the
  // rail. On the words that every step hands something to the next person, a person named as every step stands above
  // the rail, the next person joins it on their own words and a point passes from the one to the other; from the
  // hand-over's first words one point runs along each span toward the next station.
  if (stage2 > 0) {
    // The English names stand whole, each on one line, so they stand on two baselines at one even pitch, every other
    // name a row lower on a short stem from its station, within the height two lines of a name would take.
    const y = CONTENT_CY + 20,
      names = en
        ? [
            ["Acquisition"],
            ["Analysis and modeling"],
            ["Development"],
            ["Production and platforms"],
            ["Product management"],
            ["Governance"],
            ["Operational delivery"],
          ]
        : ["采集", "分析建模", "开发", "生产", "平台", "产品", "治理", "运营交付"];
    // The English rail stands 26 px right of the frame's centre, so with its last and widest name still to come it
    // leans no further left than the whole chain leans right.
    const xs = en ? names.map((_, i) => 266 + i * 232) : railStations(names, 230, 1690),
      R = 40;
    line(xs[0], y, xs.at(-1), y, {
      color: P.line,
      alpha: stage2 * ramp(t, chainAt + STAGE_CUT, 0.25),
      width: 4,
    });
    xs.forEach((x, i) => {
      const on = ramp(t, roles[i] - 0.15, 0.4) * stage2,
        lit = speaking(t, roles, i);
      dot(x, y, R, { color: P.ground, alpha: on });
      ring(x, y, R, { color: blend(P.ink, P.evidence, lit), alpha: on, width: 2.5 + lit });
      person(x, y + 6, { alpha: on, color: blend(P.ink, P.evidence, lit), size: 0.72 });
      if (i)
        link(xs[i - 1] + R + 8, y, x - R - 8, y, {
          alpha: stage2,
          draw: { t, at: roles[i] - 0.15 },
          flowing: since(t, Math.max(hand, roles[i] + 0.35)),
          lag: i * 0.17,
        });
    });
    if (en)
      xs.forEach((x, i) => {
        if (i % 2)
          line(x, y + R + 8, x, y + R + NAME_GAP + 26 + RAIL_ROW_CLEAR - 6, {
            alpha: stage2 * ramp(t, roles[i] - 0.15, 0.4),
            width: 2,
          });
      });
    railNames(names, xs, y + R, {
      gap: (i) => NAME_GAP + 26 + (en && i % 2 ? RAIL_ROW_CLEAR : 0),
      alpha: (i) => stage2 * listIn(t, roles, i),
      set: "roles",
    });
    // The hand-over stands over the chain, its two persons named on one baseline well clear of the stations below, so
    // it names the whole chain's hand-over rather than reading as one station's name: every step at the left and the
    // next person at the right, each on its own words and standing over its own name, 48 px apart, so each person has
    // the name the voice gives it; the point passes from the one to the other once both stand. The persons reach 21 px
    // below their line.
    const mid = (xs[0] + xs.at(-1)) / 2,
      nextAt = cueFrom(s, "下一个人", "the next person", hand),
      nameBottom = y - R - HEAD_CLEAR;
    const HY = nameBottom - labelSize(LABEL) - NAME_GAP - 21,
      pair = [L("每个环节", "Every step"), L("下一个人", "The next person")];
    const D = (measure(pair[0]) + measure(pair[1])) / 4 + 24,
      way = 2 * D - 72;
    [hand, nextAt].forEach((at, k) => {
      const on = stage2 * named(t, at),
        x = mid + (k ? D : -D);
      person(x, HY + 6, { alpha: on, size: 0.6 });
      nameText(pair[k], x, nameBottom, { valign: "bottom", alpha: on });
    });
    const q = loopPhase(since(t, nextAt), way);
    if (q !== null)
      flowDot(
        mix(mid - D + 36, mid + D - 36, q),
        HY - 2,
        6,
        q,
        { color: P.evidence, alpha: stage2 },
        way,
      );
  }
  // 4. Where the value lies. The value of data work is named over the way that leads to the work's next user, who stands
  // at its end with the name the opening gave them: what is handed over is weighed by whether they can rely on it. What
  // is handed over builds below the way, each refused on its own words. On the words that name the real-world signals
  // the refused set leaves as a whole, the signals run in at the way's start, and the reliable judgments, data assets
  // and actions they become take their stations on the way, each on its own word; once all three stand, points travel
  // along the way to the next user, who can rely on them.
  if (worth > 0) {
    const LY = 480,
      W0 = 380,
      W1 = 600,
      UX = 1480,
      signalAt = cue(s, "现实里的信号", "real-world signals"),
      open = named(t, valueAt) * worth;
    const resultAt = [
      ["判断", "judgments"],
      ["数据资产", "data assets"],
      ["行动", "actions"],
    ].map((pair) => cue(s, ...pair, { last: true }));
    // The value of data work heads the stage, clear above the signals' name over the way's start, so the two never
    // read as one staggered row.
    nameText(
      L("数据工作的价值", "The value of data work"),
      960,
      LY - 24 - NAME_GAP - labelSize(LABEL) - HEAD_CLEAR,
      { valign: "bottom", alpha: open },
    );
    // The way runs right and turns down into the next user, who stands below its end.
    const UY = LY + 96;
    person(UX, UY, { alpha: open, size: 1.3 });
    nameText(L("下一位用它的人", "The next person"), UX, UY + 15 * 1.3 * 1.52 + NAME_GAP, {
      valign: "top",
      alpha: open,
    });
    link(W1 + 10, LY, UX, UY - 15 * 1.3 * 2.15 - 10, {
      route: "hv",
      width: 4,
      alpha: worth * ramp(t, valueAt + STAGE_CUT, 0.25),
      draw: { t, at: valueAt + STAGE_CUT },
      flowing: since(t, valueAt + STAGE_CUT + 1.6),
    });
    // What is handed over: one column below the way's start, centred under the place where the signals run in, so
    // the stage is balanced while it builds; each item is refused on its own words, the whole set leaving together when
    // the signals are named. The column spans its icons' left edge to its crosses' right edge.
    const outs = [file, table, paper, started],
      refused = en
        ? ["A file", "A table", "A report", "The start of a process"]
        : ["一个文件", "一张表", "一份报告", "启动一个流程"];
    const widest = Math.max(...refused.map((v) => measure(v, LABEL))),
      IX = Math.round((W0 + W1) / 2 - (48 + widest + 68) / 2 + 26);
    const leave = 1 - ramp(t, pauseHold(signalAt, 0.4), 0.4);
    outs.forEach((at, i) => {
      const y = LY + 78 + i * 60,
        on = ramp(t, at - 0.15, 0.4) * worth * leave,
        tone = blend(P.muted, P.ink, speaking(t, outs, i));
      if (i === 0 || i === 2)
        documentIcon(IX - 20, y - 26, 40, 52, { alpha: on, stroke: tone, rows: i ? 3 : 2 });
      if (i === 1)
        tableIcon(IX - 26, y - 20, 52, 40, { alpha: on, stroke: tone, rows: 3, cols: 3 });
      if (i === 3) {
        ring(IX, y, 22, { color: tone, alpha: on, width: 2.5 });
        path(
          [
            [IX - 6, y - 11],
            [IX + 11, y],
            [IX - 6, y + 11],
            [IX - 6, y - 11],
          ],
          { color: tone, alpha: on, width: 2.5 },
        );
      }
      // The crosses stand in one column after the longest refused name; each comes half a second after its name, as the
      // refusal is heard, so it never stands long before the next name reaches it.
      rejectedName(refused[i], IX + 48, y, {
        align: "left",
        alpha: named(t, at) * worth * leave,
        mark: ramp(t, at + 0.45, 0.4),
        set: "refused",
        markLeft: IX + 48 + widest + 16,
      });
    });
    // The signals run in at the way's start.
    const run = soon(t, signalAt - 0.1, 1.0),
      wave = [];
    for (let x = W0; x <= mix(W0, W1, run); x += 6)
      wave.push([
        x,
        LY + Math.sin((x - W0) / 22 - voiceTime(t) * 2.4) * 14 * (1 - ((x - W0) / (W1 - W0)) * 0.7),
      ]);
    if (wave.length > 1) path(wave, { color: P.evidence, alpha: worth, width: 3 });
    nameText(L("现实里的信号", "Real-world signals"), (W0 + W1) / 2, LY - 24 - NAME_GAP, {
      valign: "bottom",
      color: P.evidence,
      alpha: worth * named(t, signalAt),
    });
    // What it becomes stands on the way, each on its own word, with the qualifier under all three: the three stand far
    // enough apart that their names keep clear of each other, and the qualifier stands under the bracket that spans them.
    const xs = [760, 1000, 1240],
      glyphs = [P.authority, P.evidence, P.ink],
      results = en ? ["Judgments", "Data assets", "Actions"] : ["判断", "数据资产", "行动"];
    xs.forEach((x, i) => {
      const on = ramp(t, resultAt[i] - 0.15, 0.4) * worth;
      dot(x, LY, 30, { color: P.ground, alpha: on });
      ring(x, LY, 30, { color: glyphs[i], alpha: on, width: 2.5 });
      if (i === 0) diamond(x, LY, 12, { color: glyphs[i], alpha: on, solid: true });
      if (i === 1)
        tableIcon(x - 16, LY - 12, 32, 24, { alpha: on, stroke: glyphs[i], rows: 2, cols: 2 });
      if (i === 2) check(x + 1, LY + 1, 26, { color: glyphs[i], alpha: on });
      nameText(results[i], x, LY + 30 + NAME_GAP, {
        valign: "top",
        color: glyphs[i],
        alpha: worth * listIn(t, resultAt, i),
        set: "results",
      });
    });
    // Reliable qualifies all three: a bracket under their names spans them, from the first name's left edge to the last
    // one's right, and the qualifier stands centred under it, on its words.
    const relyAt = cue(s, "可靠的", "reliable"),
      rely = worth * named(t, relyAt),
      BY = LY + 30 + NAME_GAP + labelSize(LABEL) + 14;
    const BL = xs[0] - Math.max(30, measure(results[0]) / 2) - 4,
      BR = xs[2] + Math.max(30, measure(results[2]) / 2) + 4;
    stroke(
      () => {
        ctx.moveTo(BL, BY - 12);
        ctx.lineTo(BL, BY);
        ctx.lineTo(BR, BY);
        ctx.lineTo(BR, BY - 12);
      },
      { color: P.line, alpha: rely, width: 2 },
    );
    nameText(L("可靠的", "Reliable"), (BL + BR) / 2, BY + NAME_GAP, {
      valign: "top",
      size: NOTE,
      color: P.muted,
      alpha: rely,
    });
  }
};

/* 21's middle stages: the Agent's own way as one path, and parallel Agents on independent lanes. */

import { ctx } from "../../canvas.js";
import { since } from "../../drawing/flows.js";
import { restMark } from "../../drawing/levels.js";
import { link } from "../../drawing/links.js";
import { s17Page } from "../../drawing/pages.js";
import { box, diamond, dot, line, measure, stroke, text } from "../../drawing/strokes.js";
import { agent, check, lock, person, ring } from "../../drawing/symbols.js";
import { listIn, listLevel, named, speaking } from "../../naming/lists.js";
import { NAME_GAP, hangOf, nameText } from "../../naming/names.js";
import { growName, growTexts } from "../../naming/parts.js";
import { rejectedName } from "../../naming/rejected.js";
import { termRow } from "../../naming/terms.js";
import { P } from "../../palette.js";
import { L, en } from "../../timeline.js";
import { cue, cueFrom, cues } from "../../timing/cues.js";
import { clamp, mix, ramp, soon } from "../../timing/easing.js";
import { glide, glideTime, smoother } from "../../timing/pace.js";
import { voiceTime } from "../../timing/pauses.js";

/* Stage 3: the Agent's own way as one path, confirmed at its start and advanced step by step. */
export function s21Path(s, t, own, unrelated, three) {
  // The first station stands clear of the frame's edge, so its English name of five things, listed by commas as key
  // words with the rules named by theirs, fits on two even lines, the task, target and current state over the person
  // and the rules (with "and" before the rules no two lines keep a block's shape), and its Chinese name, 60 px
  // further right, on two. Each other name stands on one line but the Chinese steps', a
  // term row whose term, 一步步来, stands over what it says of each step; the stations keep the names 40 px apart or more
  // (the English ones 48 px or more, the clear gap two names on one row keep: its first station stands 20 px further
  // left and its last 4 px further right for that), the steps' name centres on its stones, and the Chinese checks' name
  // stands clear of the side way's column.
  const Y = 560,
    xs = en ? [320, 720, 1080, 1390, 1704] : [400, 820, 1230, 1520, 1720],
    stones = [565, 655, 745, 835].map((x) => x + L(120, 20)),
    SP = L(1020, 900);
  const [confirm, runs, read, conclude] = cues(s, [
    ["先确认", "first confirm"],
    ["跑完对得上说法的核验", "runs checks"],
    ["读完全部结果", "reads the complete results"],
    ["再下结论", "before summarizing"],
  ]);
  // The things confirmed first: the current state is said once in each edition from the Agent's words on.
  const stateAt = cueFrom(s, "现状", "current state", own),
    ticks = [
      cue(s, "任务", "the task"),
      cue(s, "要处理的对象", "target"),
      stateAt,
      cueFrom(s, "负责人", "responsible person", stateAt),
      cueFrom(s, "适用的项目规则", "applicable local rules", stateAt),
    ];
  // The stones, one on each word of the steps.
  const stepAts = cues(s, [
    ["一步步来", "moves in"],
    ["每步", "reversible"],
    ["可逆", "verifiable"],
    ["可核验", "steps"],
  ]);
  // The first name keeps its five things on two lines in each edition, so it is set wider than the rail's other
  // names.
  const firstName = [
    en
      ? ["Task", ", target", ", current state", ", responsible person", ", local rules"]
      : ["先确认任务、", "要处理的对象、", "现状、", "负责人", "和适用的项目规则"],
    [confirm, ...ticks.slice(1)],
  ];
  const stepName = en
    ? [["Reversible,", " verifiable steps"], stepAts.slice(1, 3)]
    : [["一步步来", "，每步", "都可逆、可核验"], stepAts.slice(0, 3)];
  const way = [confirm, stepName[1][0], runs, read, conclude],
    NY = Y + NAME_GAP + 18,
    wrap = L(280, 360),
    FIRST = L(560, 430);
  // Every name of the row centres its lines on its station. The Agent's name heads the column of the first station's
  // name, on the left edge of its widest line's ink, and the path begins one name gap after it.
  const firstLines = growTexts(firstName[0], FIRST).map((line) => line.map(([, v]) => v).join(""));
  const widest = firstLines.reduce((a, b) => (measure(b) > measure(a) ? b : a));
  const head = L("智能体", "Agent"),
    headX = xs[0] - measure(widest) / 2 + hangOf(widest, "center");
  line(headX + measure(head) + NAME_GAP, Y, xs[4] + 70, Y, {
    color: P.muted,
    alpha: three,
    width: 3,
  });
  nameText(head, headX, Y, { align: "left", color: P.evidence, alpha: three * named(t, own) });
  [0, 2, 3, 4].forEach((i) => {
    // Each station's halo stands well wider than the Agent, so the Agent walking past is never read as one of them.
    if (speaking(t, way, i) > 0)
      ring(xs[i], Y, 30, {
        color: P.evidence,
        alpha: speaking(t, way, i) * restMark(P.evidence, 0.5) * three,
        width: 2,
      });
  });
  // The five things it confirms first, one box each, ticked on its own word.
  ticks.forEach((at, k) => {
    const bx = xs[0] + (k - (ticks.length - 1) / 2) * 40,
      on = named(t, at) * three;
    box(bx - 13, Y - 90, 26, 26, { stroke: P.evidence, alpha: on, radius: 5, width: 2.5 });
    check(bx, Y - 77, 15, { alpha: on, upto: clamp((t - at + 0.1) / 0.35) });
  });
  // Steps: each stone is laid on its own word and ticked as the Agent steps onto it.
  // Each stone is laid a tenth of a second into its word, so it never stands long before the steps' name reaches it.
  stones.forEach((x, k) => {
    const on = soon(t, stepAts[k] + 0.1, 0.5);
    box(x - 30, Y - 7, 60, 14, { fill: P.row, stroke: P.ink, alpha: three * on, radius: 7 });
    check(x, Y - 40, 18, { alpha: three * on, upto: clamp((t - stepAts[k] - 0.1) / 0.35) });
  });
  // The side way to unrelated things stops at a bar halfway; the refused change names the place it would reach.
  const tryAt = unrelated + 0.05,
    barY = Y - 135;
  box(SP - 50, Y - 300, 100, 60, {
    stroke: P.muted,
    alpha: three * ramp(t, tryAt, 0.3),
    radius: 6,
    dash: [6, 6],
  });
  link(SP, Y - 16, SP, Y - 240, {
    color: P.unknown,
    alpha: three * ramp(t, tryAt, 0.3),
    upto: 0.53,
    draw: { t, at: tryAt },
    end: false,
    dash: [8, 8],
  });
  line(SP - 22, barY, SP + 22, barY, {
    color: P.unknown,
    alpha: ramp(t, tryAt + 0.5, 0.3) * three,
    width: 4,
  });
  rejectedName(L("顺手改无关的东西", "Incidental changes"), SP, Y - 300 - NAME_GAP, {
    valign: "bottom",
    alpha: three * named(t, unrelated),
    mark: ramp(t, tryAt + 0.5, 0.3),
  });
  // The checks run, the complete results are read to their end, and only then the conclusion is written.
  check(xs[2], Y - 80, 36, {
    alpha: three * named(t, runs),
    upto: clamp((t - runs - 0.3) / 0.5),
  });
  // The results are read to the end: the page's rows light in turn, from the first to the last.
  const RW = 120,
    RH = 160,
    rx = xs[3] - RW / 2,
    ry = Y - 260,
    readQ = clamp((t - read - 0.05) / 1.2) * 6;
  s17Page(rx, ry, RW, RH, { alpha: three * named(t, read), rows: 6 });
  for (let i = 0; i < 6; i++) {
    const yy = ry + RH * (0.3 + (i * 0.55) / 6);
    line(rx + RW * 0.14, yy, rx + RW * (i % 2 ? 0.62 : 0.82), yy, {
      color: P.evidence,
      alpha: three * clamp(readQ - i),
      width: 2.5,
    });
  }
  s17Page(xs[4] - 40, Y - 200, 80, 104, { alpha: three * named(t, conclude), rows: 2 });
  let ax = xs[0];
  // Each stride is a glide timed by its length, in voice time. The steps' words come closer together than a stride
  // takes, so the walk over the four stones is one glide from the steps' first word to their last, which reaches each
  // stone near its own word and never adds two strides' paces.
  const walk = [
    [stepAts[0], stones[3], xs[0]],
    [runs, xs[2], stones[3]],
    [read, xs[3], xs[2]],
    [conclude, xs[4], xs[3]],
  ];
  walk.forEach(([at, x, x0], k) => {
    const go = voiceTime(at + 0.05),
      span = k ? glideTime(x - x0) : Math.max(glideTime(x - x0), voiceTime(stepAts[3] + 0.05) - go);
    ax = mix(ax, x, smoother((voiceTime(t) - go) / span));
  });
  // Each station lights as the Agent nears it, its dot growing over the Agent's last 40 px to it, and stays lit.
  [0, 2, 3, 4].forEach((i) => {
    const near = ax >= xs[i] ? 1 : clamp(1 - (xs[i] - ax) / 40);
    if (near > 0) dot(xs[i], Y, 13 * near, { color: P.evidence, alpha: three });
  });
  agent(ax, Y, { alpha: three });
  // The names, one baseline below the path, their lines centred on their stations; the growing ones keep their final
  // lines and build part by part on their words.
  [firstName, stepName].forEach(([parts, ats], i) => {
    if (i && !en)
      termRow(t, [parts[0]], [ats[0]], [parts[1].slice(1), parts[2]], ats.slice(1), xs[i], NY, {
        inline: false,
        align: "center",
        alpha: three * listLevel(t, way, i),
        set: "way",
        build: true,
      });
    else
      growName(t, parts, ats, xs[i], NY, {
        width: i ? wrap : FIRST,
        alpha: three * listLevel(t, way, i),
        set: "way",
        build: true,
        align: "center",
      });
  });
  // The last three names stand whole on one line each, so no line ends on the article of an object or breaks inside
  // a modifier.
  (en
    ? ["Runs checks", "Reads the complete results", "Summarizing"]
    : ["跑完对得上说法的核验", "读完全部结果", "再下结论"]
  ).forEach((v, k) =>
    nameText(v, xs[k + 2], NY, {
      valign: "top",
      width: 370,
      alpha: three * listIn(t, way, k + 2),
      set: "way",
    }),
  );
}

/* Stage 4: the parallel Agents taking their lanes as the work flows down the frame. */
export function s21Parallel(s, t, parallel, integrate, four) {
  const [apart, readOnly] = cues(s, [
    ["能拆开的独立问题", "independent questions"],
    ["只看不改", "read-only"],
  ]);
  const roles = cues(s, [
    ["研究", "research"],
    ["评审和", "review and"],
    ["交叉核对", "crosschecking"],
  ]);
  const rnames = en ? ["Research", "Review", "Cross-checking"] : ["研究", "评审", "交叉核对"],
    ownerName = L("一个人汇总、核验、做最后判断", "");
  // The separable work is named in its three kinds on two lines, centred on the questions' row; the stage's left
  // extent is its widest line.
  const apartLines = L(
    ["能拆开的独立问题、", "路径或评审角度"],
    ["Independent questions,", "paths or review angles"],
  );
  const left =
    700 -
    60 -
    NAME_GAP -
    Math.max(
      measure(L("多个智能体并行", "Parallel Agents")),
      measure(L("只看不改", "Read-only")),
      ...apartLines.map((v) => measure(v)),
    );
  const reach = Math.max(
    1220 + 30 + NAME_GAP + measure(rnames[2]),
    960 + 30 + NAME_GAP + measure(ownerName),
  );
  const sh0 = 960 - (left + 1220 + 40) / 2,
    sh1 = 960 - (left + reach) / 2,
    sh = mix(sh0, sh1, glide(t, roles[2] + 0.05, sh1 - sh0));
  const xs = [700, 960, 1220].map((x) => x + sh),
    BY = 270,
    QY = 340,
    AY = 480,
    KY = 630,
    OY = 760,
    join = { t, at: integrate + 0.05 };
  const asked = named(t, apart) * four,
    shut = named(t, readOnly) * four,
    owner = named(t, integrate) * four;
  nameText(L("多个智能体并行", "Parallel Agents"), xs[0] - 60 - NAME_GAP, AY, {
    align: "right",
    alpha: four * named(t, parallel),
  });
  nameText(apartLines, xs[0] - 60 - NAME_GAP, QY, { align: "right", alpha: asked });
  nameText(L("只看不改", "Read-only"), xs[0] - 60 - NAME_GAP, KY, {
    align: "right",
    color: P.evidence,
    alpha: shut,
  });
  line(xs[0] - 40, KY, xs[2] + 40, KY, { color: P.evidence, alpha: shut, width: 2 });
  // The work splits into three independent lanes, one Agent each: the bar and its lanes stand with the Agents.
  stroke(
    () => {
      ctx.moveTo(xs[0], BY);
      ctx.lineTo(xs[2], BY);
      xs.forEach((x) =>
        [
          [BY, QY - 24],
          [QY + 24, AY - 30],
          [AY + 30, KY - 18],
        ].forEach(([a, b]) => {
          ctx.moveTo(x, a);
          ctx.lineTo(x, b);
        }),
      );
    },
    { color: P.muted, alpha: four, width: 3 },
  );
  // The stack: the Agents still to take their lanes stand behind the first, each 9 px further up and to the left, and
  // the back one leaves as each lane's Agent arrives, so the stack closes up as it empties.
  const takes = roles.map((at, i) => (i ? ramp(t, at - 0.15, 0.4) : 1)),
    AR = 22 * 1.15;
  [2, 1].forEach((k) => {
    const q = four * (1 - takes[3 - k]),
      x = xs[0] - k * 9,
      y = AY - k * 9;
    diamond(x, y, AR, { color: P.ground, alpha: q, solid: true });
    diamond(x, y, AR, { color: P.evidence, alpha: q });
  });
  xs.forEach((x, i) => {
    ring(x, QY, 20, { color: P.unknown, alpha: asked, width: 2.5 });
    text("?", x, QY + 1, 22, { align: "center", color: P.unknown, alpha: asked, role: "mark" });
    if (!i) diamond(x, AY, AR, { color: P.ground, alpha: four, solid: true });
    agent(x, AY, { alpha: four * takes[i], size: 1.15 });
    const lit = speaking(t, roles, i);
    if (lit > 0)
      ring(x, AY, 38, {
        color: P.evidence,
        alpha: lit * restMark(P.evidence, 0.5) * four,
        width: 2,
      });
    nameText(rnames[i], x + 30 + NAME_GAP, AY, {
      align: "left",
      alpha: four * listIn(t, roles, i),
      set: "roles",
    });
    lock(x, KY, { alpha: shut, color: P.evidence, closed: soon(t, readOnly, 0.5) });
    link(x, KY + 28, xs[1], OY - 42, {
      route: "vhv",
      mid: (KY + OY - 22) / 2,
      alpha: four * ramp(t, integrate - 0.1, 0.3),
      draw: join,
      flowing: since(t, integrate + 0.65),
      lag: i / 3,
    });
  });
  person(xs[1], OY, { alpha: owner, color: P.authority, size: 1.2 });
  // The English person is named only by its caption ("with one person verifying and judging the combined result."),
  // so a name would repeat that caption and is left to it.
  nameText(ownerName, xs[1] + 30 + NAME_GAP, OY, {
    align: "left",
    width: 520,
    color: P.authority,
    alpha: owner,
  });
}

/* 18 deliver: the working loop. The scene: its cues and the cuts between its stages, each stage on the words that name
 * it. */

import { ctx } from "../../canvas.js";
import { blend } from "../../drawing/colour.js";
import { pass, since } from "../../drawing/flows.js";
import { restMark } from "../../drawing/levels.js";
import { link } from "../../drawing/links.js";
import { s17Page } from "../../drawing/pages.js";
import { box, dot, labelSize, line, measure, path, stroke } from "../../drawing/strokes.js";
import { check, clock, person, ring } from "../../drawing/symbols.js";
import { illustrative, opening } from "../../framing/chapters.js";
import { beats, listIn, named, speaking } from "../../naming/lists.js";
import { NAME_GAP, nameText } from "../../naming/names.js";
import { growName } from "../../naming/parts.js";
import { CONTENT_CY, radialName, railNames } from "../../naming/placement.js";
import { rejectedName } from "../../naming/rejected.js";
import { termRow } from "../../naming/terms.js";
import { LABEL, P } from "../../palette.js";
import { L, en } from "../../timeline.js";
import { cue, cueFrom, cues } from "../../timing/cues.js";
import { mix, ramp } from "../../timing/easing.js";
import { drawShare, glide } from "../../timing/pace.js";
import { thoughtEnd, voiceTime } from "../../timing/pauses.js";
import { stageIn, stageOut } from "../../timing/stages.js";
import { scenes } from "../registry.js";

scenes["18"] = function (s, t) {
  // The loop is named from just before the first words of the clause that names it, within the 0.3 s a name may lead its
  // clause. The Chinese clause opens on 就, a second into its thought, so its name leads a little more and the picture
  // still gives way within the thought's first second.
  const loopWord = cue(s, "就是一个工作循环", "runs as a loop");
  const steps = cues(s, [
    ["界定", "frame"],
    ["分析", "analyze"],
    ["决定", "decide"],
    ["执行", "execute"],
    ["核验", "verify"],
    ["总结", "learn"],
  ]);
  const [evidence, risk, review, judgment] = cues(s, [
    ["证据或风险", "evidence or risk"],
    ["风险变了", "risk changes"],
    ["重新看", "review the judgment"],
    ["受影响的判断", "judgment it affects"],
  ]);
  const [subject, outcome, bounds, reframe] = cues(s, [
    ["对象、目标", "subject, outcome"],
    ["目标或边界", "outcome or boundaries"],
    ["边界变了", "boundaries change"],
    ["才重新界定", "frame the work again"],
  ]);
  const high = cue(s, "影响大", "high-impact");
  const kept = cues(s, [
    ["测试", "the test"],
    ["监控", "monitor"],
    ["规则", "rule"],
    ["恢复办法", "recovery path"],
  ]);
  const [leave, example, agreed, noData, warn] = cues(s, [
    ["现有负责人", "the existing owners"],
    ["比如修好了昨晚的延迟", "fixing last night's delay"],
    ["约定的时间", "the agreed time"],
    ["数据还没到", "without the data"],
    ["告警", "warns when"],
  ]);
  const [effort, directory, report] = cues(s, [
    ["为了证明自己努力过", "to prove effort"],
    ["没人用的证据目录", "create an evidence directory nobody uses"],
    ["没人读的报告", "report nobody reads"],
  ]);
  const base = ramp(t, opening(s), 0.7);
  const before = cue(s, "说完成之前", "before calling"),
    two = Math.min(high, before);
  const out = stageOut(t, example);
  // 1. The working loop: the ring draws on the first words, which string the steps together into a loop, and is named
  // on the loop's words; each step then takes its station on the ring on its own word, named there, and the step being
  // said lights its mark. Each change stands outside the loop at an end of its top line, named on its first words, and
  // each further part said over it flashes its mark. When evidence or risk changes, its run reaches down into analysis
  // and the arc of the judgment it affects, from analysis to decision, lights; when the subject, outcome or boundaries
  // change, the other run reaches the first step, which lights again.
  // The loop holds until the next thought names the work it asks more of, and hands the picture over in one cut.
  // The two changes are a list said member by member, the right one first, so from the right change's words the loop
  // eases toward the left change's side by as much as centres the loop with the right change, 62 px in Chinese and 120
  // in English, whose right change stands further out, and eases back as the left change comes, so the stage stays
  // balanced while it builds.
  const one = base * stageOut(t, two);
  if (one > 0) {
    const lean = L(62, 120);
    ctx.save();
    ctx.translate(-lean * (glide(t, evidence - 0.1, lean) - glide(t, subject - 0.1, lean)), 0);
    const cx = 960,
      cy = CONTENT_CY,
      R = 270,
      top = cy - R;
    // The ring draws on from Frame's station and stays open there by a hair, under the station's mark.
    const drawn = ramp(t, opening(s), 1.2);
    ring(cx, cy, R, {
      color: P.muted,
      alpha: one,
      width: 3,
      start: -Math.PI / 2 + 0.035,
      upto: drawn * (1 - 0.07 / (2 * Math.PI)),
    });
    // The judgment the change affects, the arc from analysis to decision, draws on as the change's run reaches it.
    const affects = Math.max(judgment, review + 0.55) - 0.1;
    ring(cx, cy, R, {
      color: P.evidence,
      alpha: one * ramp(t, affects, 0.3),
      width: 6,
      start: -Math.PI / 6,
      upto: 1 / 6,
      draw: { t, at: affects },
    });
    // Each side of the ring between the stations carries a quiet point, sized as link() ends a relation of the ring's
    // width, rather than an arrowhead: the way round is read from the steps, named in turn round the ring.
    [0, Math.PI].forEach((a) =>
      dot(cx + Math.cos(a) * R, cy + Math.sin(a) * R, 3 + 2.5, {
        color: P.muted,
        alpha: one * ramp(t, opening(s) + 0.6, 0.4),
      }),
    );
    nameText(L("工作循环", "A loop"), cx, cy, {
      color: P.muted,
      alpha: one * named(t, loopWord - L(0.34, 0.25)),
    });
    // The loop is not mandatory separate stages: that reading is refused under the loop's name on its words.
    const stagesAt = cue(s, "必须分开走的阶段", "mandatory separate stages");
    rejectedName(L("必须分开走的阶段", "Mandatory separate stages"), cx, cy + 56, {
      alpha: one * named(t, stagesAt),
      mark: ramp(t, stagesAt + 0.25, 0.35),
    });
    const names = en
      ? ["Frame", "Analyze", "Decide", "Execute", "Verify", "Learn"]
      : ["界定", "分析", "决定", "执行", "核验", "总结"];
    steps.forEach((at, i) => {
      const a = -Math.PI / 2 + (i * Math.PI) / 3,
        x = cx + Math.cos(a) * R,
        y = cy + Math.sin(a) * R,
        lit = speaking(t, steps, i);
      dot(x, y, 14, { color: P.ground, alpha: one * ramp(t, at - 0.15, 0.4) });
      dot(x, y, 14, { color: P.ink, alpha: one * ramp(t, at - 0.15, 0.4) });
      if (lit > 0) ring(x, y, 24, { color: P.ink, alpha: lit * 0.5 * one, width: 2 });
      radialName(names[i], cx, cy, R + 14, a, { alpha: one * listIn(t, steps, i), set: "steps" });
    });
    // The changes, at either end of the top line: evidence or risk on the right, over analysis, and the subject, outcome
    // or boundaries on the left, before the first step. Each run draws on from its change on the words that say what
    // to do, and a dot keeps running along it. The changes stand 340 px either side of the centre, the English ones 352
    // px left and 412 px right, since each English name stands whole on one line and the left is the longer, so the two
    // stand balanced once both have come and the left keeps a clear 48 px from the first step's name on their line.
    const changes = [
      {
        x: cx + L(340, 412),
        ats: [evidence, risk],
        color: P.evidence,
        beat: P.unknown,
        act: review,
        name: L("证据或风险变了", "Evidence or risk changes"),
        to: [cx + R * Math.cos(Math.PI / 6), cy - R / 2 - 30],
        route: "hv",
      },
      {
        x: cx - L(340, 352),
        ats: [subject, outcome, bounds],
        color: P.ink,
        beat: P.ink,
        act: reframe,
        name: L("对象、目标或边界变了", "Subject, outcome or boundaries change"),
        to: [cx - 30, top],
        route: null,
      },
    ];
    changes.forEach(({ x, ats, color, beat, act, name, to, route }) => {
      const side = Math.sign(x - cx);
      dot(x, top, 10, { color, alpha: one * ramp(t, ats[0] - 0.15, 0.4) });
      beats(t, x, top, 18, ats.slice(1), { color: beat, alpha: one });
      // The changes' names share the top line's baseline with the first step's name, clear of the first step's mark, the
      // line's largest.
      nameText(name, x, top - 14 - NAME_GAP, {
        valign: "bottom",
        alpha: one * named(t, ats[0]),
        set: "changes",
      });
      link(x - side * 18, top, ...to, {
        route,
        width: 3,
        alpha: one * ramp(t, act + 0.05, 0.3),
        draw: { t, at: act + 0.05 },
        flowing: since(t, act + 0.75),
      });
    });
    // The first step lights again once the other run has reached it, and settles before the thought ends.
    ring(cx, top, 24, {
      color: P.ink,
      alpha: one * ramp(t, Math.min(reframe + 0.7, thoughtEnd(reframe) - 0.35), 0.3) * 0.7,
      width: 3,
    });
    ctx.restore();
  }
  // 2. What the work leaves behind. High-impact or repeated work stands as a stack of its runs, named beside it on its
  // first words, the name and the stack centred as one group so the work fills the picture from those words; its
  // completion stamp stands open on its corner on the words "before calling it complete", and before it is called
  // complete, each tool it needs drops from it on its own noun into one row below, the row reaching out to each tool
  // just before it comes, and the one being said lights its mark. The existing owners, who will maintain the tools, are
  // a frame drawn round them on their name, and the work's stamp is struck once the tools are left with them. The stage
  // holds until the example is named.
  const repeated = cue(s, "反复出现", "repeated");
  const g2 = base * stageIn(t, two) * out;
  if (g2 > 0) {
    const work = en ? ["High-impact", " or repeated work"] : ["影响大", "或反复出现的工作"];
    // The work's name stands at its left, centred on its page, and the page stands as far right of the centre as centres
    // the name and the stack together; the trunk drops from the middle of the stack.
    const WW = 150,
      WH = 220,
      WX = 960 + (measure(work.join(""), LABEL) + NAME_GAP - WW - 44) / 2,
      WY = 312,
      TX = WX + (WW + 44) / 2;
    const BUS = 582,
      IY = 656,
      FY = 606,
      FH = 175;
    // The row of tools stands centred on the frame as it grows: the first tool drops at its middle, and the row steps
    // left by half its pitch as the row reaches out to each further tool, in 0.5 s, so no name travels 40 px in a frame.
    const lean = kept.slice(1).reduce((v, at) => v + 120 * (1 - glide(t, at - 0.3, 120)), 0),
      xs = [600, 840, 1080, 1320].map((x) => x + lean);
    // Its runs: the pages behind show only the edges that stand clear of the front page.
    for (let k = 2; k >= 1; k--)
      path(
        [
          [WX + k * 22, WY - (k - 1) * 22],
          [WX + k * 22, WY - k * 22],
          [WX + WW + k * 22, WY - k * 22],
          [WX + WW + k * 22, WY + WH - k * 22],
          [WX + WW + (k - 1) * 22, WY + WH - k * 22],
        ],
        { color: P.ink, alpha: g2, width: 2 },
      );
    s17Page(WX, WY, WW, WH, { alpha: g2, rows: 5 });
    growName(t, work, [high, repeated], WX - NAME_GAP, WY + WH / 2, {
      valign: "middle",
      align: "right",
      alpha: g2,
    });
    // The stamp on the work's corner stands open on the words before calling it complete, and is struck once the tools
    // are left with the owners.
    const SX = WX + WW,
      SY = WY + WH,
      stamp = g2 * ramp(t, before - 0.15, 0.4);
    dot(SX, SY, 30, { color: P.ground, alpha: stamp });
    ring(SX, SY, 30, { color: P.ink, alpha: stamp, width: 2.5 });
    check(SX, SY + 1, 26, { alpha: stamp, draw: { t, at: leave + 0.3 } });
    // The row reaches out from the work to each tool just before the tool is named, and each drops on its noun.
    // The trunk reaches the row before the row starts to grow, so the row grows out of it from nothing.
    const reach = kept.map((at, i) => drawShare(t, at - 0.3, Math.abs(xs[i] - TX)));
    link(TX, SY, TX, BUS, { alpha: g2, draw: { t, at: kept[0] - 0.65 }, end: false });
    const left = Math.min(TX, ...xs.map((x, i) => mix(TX, x, reach[i]))),
      right = Math.max(TX, ...xs.map((x, i) => mix(TX, x, reach[i])));
    if (right - left > 1) line(left, BUS, right, BUS, { color: P.line, alpha: g2, width: 2 });
    box(440, FY, 1040, FH, {
      fill: P.row,
      stroke: P.ink,
      alpha: g2 * named(t, leave),
      radius: 14,
      width: 2.5,
    });
    kept.forEach((at, i) => {
      const x = xs[i],
        q = ramp(t, at - 0.05, 0.4) * g2,
        lit = speaking(t, kept, i);
      link(x, BUS, x, IY - 44, { alpha: g2, draw: { t, at: at - 0.15 }, end: false });
      if (lit > 0) ring(x, IY, 46, { color: P.ink, alpha: lit * 0.5 * g2, width: 2 });
      if (i === 0) check(x, IY, 34, { alpha: q });
      if (i === 1) {
        box(x - 30, IY - 22, 60, 44, { stroke: P.ink, alpha: q, radius: 8 });
        stroke(() => ctx.arc(x, IY + 10, 14, Math.PI, Math.PI * 2), {
          color: P.evidence,
          alpha: q,
          width: 2.5,
        });
      }
      if (i === 2) s17Page(x - 20, IY - 26, 40, 52, { alpha: q, rows: 3 });
      if (i === 3) {
        path(
          [
            [x + 22, IY - 14],
            [x - 20, IY - 14],
            [x - 20, IY + 14],
            [x + 14, IY + 14],
          ],
          { color: P.ink, alpha: q, width: 2.5 },
        );
        dot(x + 16, IY + 14, 5, { color: P.evidence, alpha: q });
      }
    });
    railNames(
      en ? ["Test", "Monitor", "Rule", "Recovery path"] : ["测试", "监控", "规则", "恢复办法"],
      xs,
      IY + 46,
      { gap: NAME_GAP, alpha: (i) => g2 * listIn(t, kept, i), set: "kept" },
    );
    termRow(t, [L("现有负责人", "The existing owners")], [leave], [], [], 440, FY + FH + NAME_GAP, {
      width: 1040,
      alpha: g2,
    });
  }
  // What not to build cuts in on the words that name its first mark: the motive in Chinese, the directory in English.
  const notBuilt = Math.min(effort, directory);
  const exOut = stageOut(t, notBuilt);
  // 3. The example, on the schedule's timeline in two lanes that share the agreed time. Above, last night: the
  // publication ran past the agreed time, and the delay is marked on its lane and checked once it is fixed. Below, the
  // schedule, standing on its own words, with the monitor left on the agreed time: the data that should have come by
  // then stands as an empty, dashed place on the schedule just before it, on the words that say it has not arrived, and
  // the monitor warns once both its warning and the missing data are said. The case is marked as illustrative while it
  // is shown; it holds until the refusal begins.
  const ex = stageIn(t, example) * base * exOut;
  illustrative(ex);
  if (ex > 0) {
    // The lanes stand high enough that the case, its delay named under its lane, stays balanced on the content centre.
    const YA = 395,
      YB = 735,
      AX = 1080,
      LATE = 1420,
      MY = YB - 150,
      TOPV = YA - 90;
    const [delay, fixed, schedule, mWord] = [
      cue(s, "修好了昨晚的延迟", "last night's delay"),
      cue(s, "就在调度", "can leave"),
      cue(s, "调度", "schedule"),
      cueFrom(s, "监控", "monitor", example),
    ];
    // Each lane is a firm axis, so last night's lane carries the case from its first words.
    [
      [YA, ex],
      [YB, ex * ramp(t, schedule - 0.15, 0.4)],
    ].forEach(([y, a]) => {
      line(300, y, 1620, y, { color: P.muted, alpha: a, width: 3 });
      for (let x = 300; x <= 1620; x += 132)
        line(x, y - 20, x, y + 20, { color: P.muted, alpha: a, width: 2 });
    });
    nameText(L("调度", "The schedule"), 300, YB + 20 + NAME_GAP, {
      align: "left",
      valign: "top",
      alpha: ex * named(t, schedule),
    });
    // The agreed time runs through both lanes as a line in the authority's ink, drawn when it is named.
    line(AX, TOPV, AX, YB + 18, {
      color: P.authority,
      alpha: ex * ramp(t, agreed - 0.15, 0.4),
      width: 2,
    });
    nameText(L("约定的时间", "The agreed time"), AX, TOPV - NAME_GAP, {
      valign: "bottom",
      color: P.authority,
      alpha: ex * named(t, agreed),
    });
    // Last night's delay: the span past the agreed time, which turns quiet and is checked once it is fixed.
    const fix = ramp(t, fixed + 0.05, 0.5),
      late = blend(P.unknown, P.line, fix);
    line(AX, YA, LATE, YA, { color: late, alpha: ex, width: 6 });
    dot(LATE, YA, 11, { color: late, alpha: ex });
    // The delay is named under its span, apart from the agreed time's name over the line, with its check after it.
    const dn = L("昨晚的延迟", "Last night's delay"),
      dw = measure(dn, LABEL),
      dy = YA + 20 + NAME_GAP;
    nameText(dn, (AX + LATE) / 2, dy, { valign: "top", alpha: ex * named(t, delay) });
    check((AX + LATE) / 2 + dw / 2 + 30, dy + labelSize(LABEL) / 2, 24, {
      alpha: ex,
      draw: { t, at: fixed + 0.05 },
    });
    // The monitor on the agreed time of the schedule arrives on its words; its ground hides the agreed time's line
    // behind it.
    const m = ramp(t, mWord - 0.15, 0.4) * ex,
      warnQ = ramp(t, Math.max(noData, warn) + 0.05, 0.3);
    box(AX - 60, MY, 120, 84, { fill: P.ground, stroke: P.ink, alpha: m, radius: 10, width: 2.5 });
    stroke(() => ctx.arc(AX, MY + 60, 22, Math.PI, Math.PI * 2), {
      color: blend(P.evidence, P.unknown, warnQ),
      alpha: m,
      width: 3,
    });
    termRow(
      t,
      [L("监控", "Monitor")],
      [mWord],
      [L("告警", "warns")],
      [warn],
      AX + 60 + NAME_GAP,
      MY + 42 - labelSize(LABEL) / 2,
      { alpha: ex },
    );
    // The data that should have come by the agreed time: an empty, dashed place on the schedule just before it.
    const DX = AX - 70,
      dq = ex * ramp(t, noData - 0.1, 0.4);
    ring(DX, YB, 14, { color: P.unknown, alpha: dq, width: 2.5, dash: [5, 5] });
    nameText(L("数据还没到", "Without the data"), DX, YB + 20 + NAME_GAP, {
      valign: "top",
      alpha: ex * named(t, noData),
    });
    if (warnQ > 0)
      for (let k = 0; k < 3; k++) {
        const w = (voiceTime(t) * 1.2 + k / 3) % 1;
        // Each pulse enters and leaves by its length at the unknown's level, centred on the same arc, as a flow's dot
        // enters by its size.
        const p = pass(w, 0.25);
        ring(AX, MY + 42, 74 + 34 * w, {
          color: P.unknown,
          alpha: warnQ * ex * restMark(P.unknown),
          width: 2.5,
          start: -Math.PI * (0.5 + 0.3 * p),
          upto: 0.3 * p,
        });
      }
  }
  // 4. What not to build: a directory nobody uses and a report nobody reads, made on one desk by one person for the
  // motive. The desk stands from the stage's first mark, so the picture opens wide and centred whichever comes first:
  // the motive in Chinese, the directory in English. Each thing arrives standing on the desk on its own words, refused
  // with its cross, and a dashed way runs out from it to the empty seat of the user it lacks; its maker stands behind
  // the desk at the centre on the motive's words, under a clock whose hand keeps turning, the time spent to prove
  // effort. The item being said lights its frame.
  const no = stageIn(t, notBuilt) * base;
  if (no > 0) {
    // The empty seats stand 100 px beyond the desk's ends. While the first thing and its seat stand without the second,
    // the stage stands 60 px right, so they stand centred with the desk: from the stage's first mark where it is the
    // first thing (in English), and easing there on its words where the motive comes first (in Chinese); it eases back
    // as the second arrives.
    const ats = [directory, report],
      lean =
        60 *
        ((directory <= notBuilt + 1e-6 ? 1 : glide(t, directory - 0.1, 60)) -
          glide(t, report - 0.1, 60));
    ctx.save();
    ctx.translate(lean, 0);
    const DY = 640,
      W = 200,
      H = 220,
      TOP = DY - H,
      MY = TOP + H / 2,
      xs = [700, 1220],
      seats = [460, 1460];
    const names = en
      ? ["An evidence directory nobody uses", "A report nobody reads"]
      : ["没人用的证据目录", "没人读的报告"];
    line(560, DY, 1360, DY, { color: P.muted, alpha: no, width: 4 });
    xs.forEach((x, i) => {
      const q = ramp(t, ats[i] - 0.15, 0.4) * no,
        lit = speaking(t, ats, i),
        side = i ? 1 : -1;
      if (lit > 0)
        box(x - W / 2 - 12, TOP - 12, W + 24, H + 6, {
          stroke: P.ink,
          alpha: lit * 0.45 * no,
          radius: 16,
          width: 2,
        });
      if (i === 0) {
        box(x - W / 2, TOP, W, H - 4, { fill: P.row, stroke: P.muted, alpha: q, radius: 10 });
        line(x - W / 2, TOP + 44, x + W / 2, TOP + 44, { color: P.muted, alpha: q });
        for (let k = 0; k < 3; k++)
          box(x - 60, TOP + 72 + k * 44, 120, 28, { stroke: P.line, alpha: q, radius: 4 });
      } else
        s17Page(x - W / 2 + 20, TOP + 10, W - 40, H - 14, { alpha: q, rows: 5, stroke: P.muted });
      // The user nobody is: an empty seat that stands on the item's words, when a dashed way runs out to it.
      person(seats[i], MY + 8, { alpha: q, color: P.line, size: 0.9, solid: false });
      link(x + side * (W / 2 + 12), MY, seats[i] - side * 34, MY, {
        color: P.line,
        alpha: q,
        upto: drawShare(
          t,
          ats[i] + 0.05,
          Math.abs(seats[i] - side * 34 - (x + side * (W / 2 + 12))),
          0.6,
        ),
        dash: [8, 8],
      });
      rejectedName(names[i], x, TOP - 12 - NAME_GAP, {
        valign: "bottom",
        width: 460,
        alpha: no * named(t, ats[i]),
        mark: ramp(t, ats[i] + 0.45, 0.3),
        set: "unused",
      });
    });
    // The clock stands on the maker's head, one mark with the maker.
    const motive = ramp(t, effort - 0.15, 0.4) * no,
      PY = DY - 34;
    person(960, PY, { alpha: motive, size: 1.2 });
    clock(960, PY - 75, 30, { hand: (voiceTime(t) * 0.6) % 1, color: P.muted, alpha: motive });
    nameText(L("为了证明自己努力过", "To prove effort"), 960, DY + NAME_GAP, {
      valign: "top",
      color: P.muted,
      alpha: no * named(t, effort),
    });
    ctx.restore();
  }
};

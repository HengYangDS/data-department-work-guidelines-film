/* 25's aims of writing: the three aims in their order, and the mechanism under each aim's head. */

import { ctx } from "../../canvas.js";
import { blend } from "../../drawing/colour.js";
import { flowDot, loopPhase, since } from "../../drawing/flows.js";
import { restMark } from "../../drawing/levels.js";
import { link } from "../../drawing/links.js";
import { s23Page } from "../../drawing/pages.js";
import { box, dot, measure, path, stroke, text } from "../../drawing/strokes.js";
import { check, person, ring } from "../../drawing/symbols.js";
import { listIn, listLevel, named } from "../../naming/lists.js";
import { NAME_GAP, nameText } from "../../naming/names.js";
import { railNames } from "../../naming/placement.js";
import { rejectedName } from "../../naming/rejected.js";
import { termRow, termRowLayout } from "../../naming/terms.js";
import { P } from "../../palette.js";
import { L, en } from "../../timeline.js";
import { cue, cues } from "../../timing/cues.js";
import { mix, ramp, soon } from "../../timing/easing.js";
import { drawShare, drawTime, glide } from "../../timing/pace.js";
import { span } from "../../timing/pauses.js";

/* Stage 1: the three aims as three nodes in a row, held by writing and numbered in their order. */
export function s25ThreeAims(s, t, triad, order, colors, aims, gA) {
  const xs = [520, 960, 1400],
    y = 500,
    R = 38,
    by = y - R - 46,
    writing = cue(s, "写作", "writing");
  // Writing holds its aims from the first word: its name, its stem and the bar its aims hang from.
  const held = gA * named(t, writing);
  nameText(L("写作", "Writing"), 960, by - 26 - NAME_GAP, { valign: "bottom", alpha: held });
  link(960, by - 26, 960, by, { alpha: held, end: false });
  path(
    [
      [xs[0], by],
      [xs[2], by],
    ],
    { color: P.line, alpha: held, width: 2.5 },
  );
  const run = glide(t, order, xs[2] - xs[0] - 2 * R - 12);
  link(xs[0] + R + 6, y, xs[2] - R - 6, y, {
    color: P.evidence,
    alpha: gA * ramp(t, order - 0.1, 0.3),
    draw: { t, at: order - 0.05 },
    width: 3,
    flow: run > 0 && run < 1 ? run * 0.999 : null,
  });
  xs.forEach((x, c) => {
    const on = named(t, triad[c]) * gA;
    path(
      [
        [x, by],
        [x, y - R - 4],
      ],
      { color: P.line, alpha: on, width: 2.5 },
    );
    dot(x, y, R, { color: P.ground, alpha: on });
    ring(x, y, R, { color: colors[c], alpha: on, width: 3 });
    // The node's point gives way to its number when the order is spoken, over 0.35 s, so it never leaves within a frame.
    dot(x, y, 8, { color: colors[c], alpha: on * (1 - ramp(t, order - 0.1, 0.35)) });
    text(String(c + 1), x, y + 1, 26, {
      role: "mark",
      align: "center",
      color: colors[c],
      alpha: on * ramp(t, order + 0.1, 0.3),
    });
  });
  railNames(aims, xs, y + R, {
    gap: NAME_GAP,
    alpha: (i) => gA * listIn(t, triad, i),
    color: (i) => colors[i],
    set: "triad",
  });
}

/* Stage 2: the mechanism of each aim, building under its head while the head is lit. */
export function s25Mechanisms(s, t, fidelity, clarity, elegance, example, colors, aims, g1) {
  // The elegance column comes last and carries the widest parts, so the stage stands right while the first two build
  // (80 px in Chinese, 30 in English) and moves on elegance's first word, which opens its thought: the Chinese glides
  // 120 px to stand 40 px left, and English, whose refusals beneath the frame are long, eases to 35 px left, so each
  // state stands centred.
  const OPEN = en
    ? mix(30, -35, soon(t, elegance + 0.05, 0.9))
    : mix(80, -40, glide(t, elegance + 0.05, 120));
  const COLX = [390, 850, 1310].map((x) => x + OPEN),
    HY = 330,
    starts = [fidelity, clarity, elegance];
  const heads = en
    ? [["preserves the meaning"], ["understanding first"], ["taste and judgment"]]
    : [["忠于原意"], ["在准确理解之后"], ["凭品位和审美"]];
  const means = cues(s, [
    ["忠于原意", "preserves the meaning"],
    ["在准确理解之后", "begins with accurate understanding"],
    ["凭品位和审美", "brings taste"],
  ]);
  // The three heads set their meanings one way: inline when every one fits on its head's line, otherwise each under its
  // head.
  const inline = heads.every((h, c) => termRowLayout([aims[c]], h, 330).one);
  const said = (zh, english, lead = 0.15) => ramp(t, cue(s, zh, english) - lead, 0.4) * g1;
  COLX.forEach((L0, c) => {
    const lit = span(t, starts[c] - 0.15, c < 2 ? starts[c + 1] - 0.2 : example - 0.2, 0.3),
      hx = L0 + 15;
    ring(hx, HY, 15, { color: colors[c], alpha: g1, width: 2.5 });
    dot(hx, HY, 6 + 2 * lit, { color: colors[c], alpha: g1 });
    if (lit > 0)
      ring(hx, HY, 23, {
        color: colors[c],
        alpha: lit * restMark(colors[c], 0.5) * g1,
        width: 2,
      });
    const hh = termRowLayout([aims[c]], heads[c], 330, inline).height;
    termRow(
      t,
      [aims[c]],
      [Math.min(starts[c], fidelity)],
      heads[c],
      [means[c]],
      hx + 15 + NAME_GAP,
      HY - hh / 2,
      { width: 330, color: colors[c], alpha: g1 * listLevel(t, starts, c), set: "aims", inline },
    );
  });
  // Fidelity.
  {
    const L0 = COLX[0],
      on = ramp(t, means[0] - 0.15, 0.4) * g1,
      items = cues(s, [
        ["谁", "actors"],
        ["在什么条件下", "conditions"],
        ["负什么责", "responsibilities"],
        ["到什么程度", "limits"],
      ]);
    const intact = said("都不走样", "stay intact"),
      ys = [450, 480, 510, 540];
    path(
      [
        [L0 + 15, HY + 15],
        [L0 + 15, 410],
      ],
      { color: P.line, alpha: on, width: 2 },
    );
    s23Page(L0 + 10, 410, 100, 200, { alpha: on, rows: 3 });
    s23Page(L0 + 200, 400, 150, 270, { alpha: on, rows: 3 });
    // The four lines are one stroke, and each draws on across the gap from the original on its own word at the tip
    // pace, so no line joins the figure whole within a frame.
    const carried = items.map((at) => drawShare(t, at - 0.05, 78));
    if (carried[0] > 0.01)
      stroke(
        () =>
          ys.forEach((y, k) => {
            if (carried[k] > 0.01) {
              ctx.moveTo(L0 + 116, y);
              ctx.lineTo(mix(L0 + 116, L0 + 194, carried[k]), y);
            }
          }),
        { color: blend(P.ink, P.evidence, intact / Math.max(g1, 1e-6)), alpha: on, width: 3 },
      );
    // The meaning travels across while the aim is spoken, along the second line once that line is drawn.
    const carry = loopPhase(since(t, items[1] - 0.05 + drawTime(78)), 78);
    if (carry !== null)
      flowDot(
        mix(L0 + 116, L0 + 194, carry),
        ys[1],
        5,
        carry,
        { color: P.evidence, alpha: on * span(t, items[0], clarity - 0.2, 0.3) },
        78,
      );
    // What the writing keeps is marked large enough to read at a glance, each mark on its word.
    check(L0 + 322, 430, 28, { alpha: intact });
    const src = said("事实有来源", "facts keep their sources");
    dot(L0 + 252, 590, 9, { color: P.evidence, alpha: src });
    link(L0 + 240, 590, L0 + 116, 590, {
      color: P.evidence,
      alpha: src,
      draw: { t, at: cue(s, "事实有来源", "facts keep their sources") + 0.05 },
      width: 3.5,
    });
    text("≠", L0 + 232, 640, 36, {
      role: "mark",
      align: "center",
      color: P.unknown,
      alpha: said("反例", "counterexamples"),
    });
    text("?", L0 + 274, 640, 36, {
      role: "mark",
      align: "center",
      color: P.unknown,
      alpha: said("不确定", "uncertainty"),
    });
    const fail = said("失败", "failure");
    stroke(
      () => {
        ctx.moveTo(L0 + 303, 627);
        ctx.lineTo(L0 + 329, 653);
        ctx.moveTo(L0 + 329, 627);
        ctx.lineTo(L0 + 303, 653);
      },
      { color: P.unknown, alpha: fail, width: 4 },
    );
  }
  // Clarity.
  {
    const L0 = COLX[1],
      on = ramp(t, clarity - 0.15, 0.4) * g1,
      y = 480;
    path(
      [
        [L0 + 15, HY + 15],
        [L0 + 15, 420],
      ],
      { color: P.line, alpha: on, width: 2 },
    );
    s23Page(L0 + 10, 420, 90, 120, { alpha: on, rows: 3 });
    check(L0 + 80, 430, 24, { alpha: said("在准确理解之后", "accurate understanding") });
    const plain = cue(s, "把意思讲清楚", "puts it plainly"),
      drawn = soon(t, plain + 0.05, 0.7),
      flat = soon(t, cue(s, "讲通顺", "fluently") + 0.05, 0.7);
    if (drawn > 0) {
      const pts = Array.from({ length: 13 }, (_, k) => [
        L0 + 108 + k * 11,
        y + (k % 2 ? -1 : 1) * 14 * (1 - flat) * (k && k < 12 ? 1 : 0),
      ]);
      path(pts, { color: P.evidence, alpha: on, draw: { t, at: plain + 0.05 }, width: 3 });
      // Once it runs plain, what is said travels it to the reader.
      const sent = loopPhase(since(t, plain + 0.8), 124);
      if (drawn >= 1 && sent !== null)
        flowDot(
          mix(L0 + 108, L0 + 232, sent),
          y,
          5,
          sent,
          { color: P.evidence, alpha: on * span(t, plain + 0.8, elegance - 0.2, 0.3) },
          124,
        );
    }
    const reader = said("让读者能理解", "the reader can understand");
    person(L0 + 270, y + 10, { alpha: reader, size: 1.3 });
    const act = said("也能行动", "and act");
    dot(L0 + 304, y, 6, { color: P.ink, alpha: act });
    link(L0 + 312, y, L0 + 346, y, {
      color: P.ink,
      alpha: act,
      draw: { t, at: cue(s, "也能行动", "and act") + 0.05 },
      width: 3,
      end: false,
    });
    ring(L0 + 356, y, 9, { color: P.ink, alpha: act, width: 3 });
  }
  // Elegance.
  {
    const L0 = COLX[2],
      on = ramp(t, elegance - 0.15, 0.4) * g1,
      base0 = 590,
      hs = [60, 104, 72, 124, 84];
    const rhythm = said("节奏", "rhythm"),
      joined = said("过渡", "transitions"),
      form = said("形式", "and form");
    path(
      [
        [L0 + 15, HY + 15],
        [L0 + 15, base0],
      ],
      { color: P.line, alpha: on, width: 2 },
    );
    if (rhythm > 0)
      stroke(
        () => {
          ctx.moveTo(L0 + 15, base0);
          ctx.lineTo(L0 + 236, base0);
          hs.forEach((h, i) => {
            ctx.moveTo(L0 + 44 + i * 42, base0);
            ctx.lineTo(L0 + 44 + i * 42, base0 - h);
          });
        },
        { color: P.authority, alpha: rhythm, width: 4 },
      );
    if (joined > 0)
      stroke(
        () => {
          ctx.moveTo(L0 + 44, base0 - hs[0]);
          hs.slice(1).forEach((h, i) =>
            ctx.quadraticCurveTo(
              L0 + 44 + i * 42 + 21,
              base0 - Math.max(h, hs[i]) - 24,
              L0 + 44 + (i + 1) * 42,
              base0 - h,
            ),
          );
        },
        { color: P.authority, alpha: joined * 0.8, width: 2.5 },
      );
    box(L0 - 8, 420, 310, 190, { stroke: P.authority, alpha: form, radius: 12, width: 2 });
    dot(L0 + 264, 520, 12, { color: P.ink, alpha: said("准确的动词", "precise verbs") });
    box(L0 + 247, 552, 34, 34, {
      fill: P.ink,
      alpha: said("具体的名词", "concrete nouns"),
      radius: 4,
    });
    // The two refusals stand beneath the frame on one baseline, each named and struck on its own words, the pair with
    // its crosses centred on the frame.
    const refused = en ? ["Slogans", "Pretended depth"] : ["喊口号", "故作高深"],
      refusedAt = cues(s, [
        ["喊口号", "slogans"],
        ["故作高深", "pretended depth"],
      ]);
    const rw = refused.map((v) => measure(v) + 42),
      rx0 = L0 - 8 + 310 / 2 - (rw[0] + 40 + rw[1]) / 2;
    refused.forEach((v, k) =>
      rejectedName(v, rx0 + k * (rw[0] + 40), 610 + 22 + NAME_GAP, {
        align: "left",
        valign: "top",
        alpha: g1 * named(t, refusedAt[k]),
        mark: ramp(t, refusedAt[k] + 0.05, 0.35),
      }),
    );
  }
}

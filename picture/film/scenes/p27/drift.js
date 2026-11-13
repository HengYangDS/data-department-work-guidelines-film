/* 27's line of drift: the small signals a defect begins as, one anomaly that is not a trend, and the same metric
 * asked about week after week. */

import { ctx } from "../../canvas.js";
import { restMark } from "../../drawing/levels.js";
import { link } from "../../drawing/links.js";
import { box, dot, line, path, stroke, text } from "../../drawing/strokes.js";
import { cross, ring } from "../../drawing/symbols.js";
import { listIn, named, speaking } from "../../naming/lists.js";
import { NAME_GAP, nameText } from "../../naming/names.js";
import { RAIL_ROW, railNames } from "../../naming/placement.js";
import { rejectedName } from "../../naming/rejected.js";
import { P } from "../../palette.js";
import { L, en } from "../../timeline.js";
import { mix, ramp, soon } from "../../timing/easing.js";
import { drawShare, glide } from "../../timing/pace.js";

/* Stage 1: the line running on toward a defect, bumped by each small signal on its own words. */
export function s27SmallSignals(t, changes, defects, signals, X0, X1, Y0, s27Line, one) {
  const names = en
    ? [
        ["Definitions drifting"],
        ["Questions recurring"],
        ["Stepping in to rescue"],
        ["Evidence expiring"],
        ["Ownership blurring"],
        ["Intermittent failures"],
        ["Slight delays"],
      ]
    : [
        ["定义慢慢变了"],
        ["同样的问题反复被问"],
        ["临时靠人救火"],
        ["证据过期"],
        ["责任说不清"],
        ["偶尔出错"],
        ["略有延迟"],
      ];
  // The seven names stand whole, each on one line, on two baselines at one even pitch, every other name a row lower
  // on a short stem from the line, in both editions.
  const wrap = 280;
  const xs = names.map((_, i) => L(268 + i * 220, 270 + i * 205)),
    lift = signals.map((at) => soon(t, at - 0.1, 0.5));
  const yAt = (x) =>
    Y0 - xs.reduce((a, sx, i) => a + 22 * lift[i] * Math.exp(-(((x - sx) / 22) ** 2)), 0);
  // The line stands whole from the first words, the small changes, with its axis.
  const shape = ramp(t, changes - 0.1, 0.6) * one;
  s27Line(yAt, shape, { axis: shape });
  // The defect stands at the end of the line from the words that name it.
  cross(X1, Y0, 24, { alpha: ramp(t, defects - 0.15, 0.4) * one, width: 3 });
  // The defect is named over the line's end, and the small changes the line carries over its start on the first words,
  // so the line runs from them to the defect they may signal; both names stand clear of the halo of a signal's bump.
  nameText(L("工作体系有缺陷", "Work-system defect"), X1, Y0 - 28 - NAME_GAP, {
    valign: "bottom",
    alpha: one * named(t, defects),
  });
  nameText(L("小变化", "Small changes"), X0 + 12, Y0 - 28 - NAME_GAP, {
    align: "left",
    valign: "bottom",
    alpha: one * named(t, changes),
  });
  xs.forEach((x, i) => {
    const q = ramp(t, signals[i] - 0.15, 0.3),
      lit = speaking(t, signals, i);
    dot(x, yAt(x), 7, { color: P.unknown, alpha: q * one });
    if (lit > 0)
      ring(x, yAt(x), 15, {
        color: P.unknown,
        alpha: lit * restMark(P.unknown, 0.6) * one,
        width: 2,
      });
  });
  xs.forEach((x, i) => {
    if (i % 2)
      line(x, Y0 + 12, x, Y0 + NAME_GAP + 18 + RAIL_ROW - 6, {
        alpha: one * ramp(t, signals[i] - 0.15, 0.3),
        width: 2,
      });
  });
  railNames(names, xs, Y0, {
    wrap,
    gap: (i) => NAME_GAP + 18 + (i % 2 ? RAIL_ROW : 0),
    alpha: (i) => one * listIn(t, signals, i),
    set: "signals",
  });
}

/* Stage 2: the line spiking once, and the three checks before one anomaly is called a trend. */
export function s27Anomaly(t, anomaly, trend, pattern, impact, direction, Y0, s27Line, two) {
  const PX = 1000,
    H = 170,
    peak = Y0 - H,
    up = glide(t, anomaly + 0.05, H),
    checks = [pattern, impact, direction];
  const yAt = (x) => Y0 - H * up * Math.exp(-(((x - PX) / 18) ** 2));
  s27Line(yAt, two);
  nameText(L("一次异常", "One anomaly"), PX, peak - 12 - NAME_GAP, {
    valign: "bottom",
    alpha: two * named(t, anomaly),
  });
  // The spike's level carried on to the right would read it as a trend: the way stops at a bar.
  const refuse = ramp(t, trend + 0.45, 0.3) * two,
    TX = 1420;
  link(PX + 18, peak, TX - 10, peak, {
    color: P.unknown,
    alpha: two * ramp(t, trend + 0.05, 0.3),
    upto: drawShare(t, trend + 0.05, Math.abs(TX - 10 - (PX + 18)), 0.6),
    end: false,
    dash: [8, 8],
  });
  line(TX, peak - 24, TX, peak + 24, { color: P.unknown, alpha: refuse, width: 4 });
  rejectedName(L("看成趋势", "A trend"), TX + 24, peak, {
    align: "left",
    alpha: two * named(t, trend),
    mark: refuse / Math.max(two, 1e-6),
  });
  // The checks: the pattern rings the points before the spike, the impact measures its height, the direction follows
  // the line after it.
  const lit = (i) => speaking(t, checks, i),
    seen = (i) => ramp(t, checks[i] - 0.1, 0.4) * two;
  [360, 480, 600, 720, 840].forEach((x, k) =>
    ring(x, Y0, 9 + 3 * lit(0), {
      color: P.evidence,
      alpha: seen(0) * ramp(t, pattern - 0.1 + k * 0.06, 0.3),
      width: 2.5,
    }),
  );
  const mx = PX - 34,
    im = seen(1);
  line(mx, Y0, mx, peak, { color: P.authority, alpha: im, width: 2.5 + lit(1) });
  line(mx - 10, Y0, mx + 10, Y0, { color: P.authority, alpha: im, width: 2.5 });
  line(mx - 10, peak, mx + 10, peak, { color: P.authority, alpha: im, width: 2.5 });
  path(
    [
      [1150, Y0],
      [1660, Y0],
    ],
    { color: P.evidence, alpha: seen(2), width: 5 + lit(2), draw: { t, at: direction - 0.1 } },
  );
  railNames(
    en ? ["Pattern", "Impact", "Direction"] : ["规律", "影响", "走向"],
    [600, PX, 1405],
    Y0,
    { alpha: (i) => two * listIn(t, checks, i), set: "checks" },
  );
}

/* Stage 3: the same metric, a question hanging below the line week after week until it is called a signal. */
export function s27SameMetric(t, metric, weekly, signal, X0, Y0, s27Line, three) {
  const xs = [460, 640, 820, 1000, 1180, 1360],
    QY = Y0 + 160,
    asked = xs.map((x, k) => ramp(t, weekly - 0.1 + k * 0.12, 0.35));
  const yAt = (x) =>
    Y0 - xs.reduce((a, sx, k) => a + 14 * asked[k] * Math.exp(-(((x - sx) / 20) ** 2)), 0);
  s27Line(yAt, three);
  nameText(L("同一个指标", "The same metric"), X0, Y0 - NAME_GAP, {
    align: "left",
    valign: "bottom",
    color: P.evidence,
    alpha: three * named(t, metric),
  });
  // Each week's question arrives in turn on the words that say someone asks every week: its drop draws on from the
  // line and its ring draws round from the drop's end. All the drops are one stroke and all the rings another, so the
  // weekly questions read as one question asked again and again, not as six marks each waiting for a name of its own.
  stroke(
    () =>
      xs.forEach((x, k) => {
        if (asked[k] > 0) {
          ctx.moveTo(x, yAt(x) + 8);
          ctx.lineTo(x, mix(yAt(x) + 8, QY - 28, asked[k]));
        }
      }),
    { color: P.line, alpha: three * 0.8, width: 2 },
  );
  stroke(
    () =>
      xs.forEach((x, k) => {
        if (asked[k] > 0) {
          ctx.moveTo(x, QY - 22);
          ctx.ellipse(x, QY, 22, 22, -Math.PI / 2, 0, Math.PI * 2 * asked[k]);
        }
      }),
    { color: P.authority, alpha: three, width: 2.5 },
  );
  xs.forEach((x, k) =>
    text("?", x, QY + 1, 26, {
      role: "mark",
      align: "center",
      color: P.authority,
      alpha: asked[k] * three,
    }),
  );
  nameText(L("每周都有人问", "Asked every week"), 910, QY + 40 + NAME_GAP, {
    valign: "top",
    width: 640,
    color: P.authority,
    alpha: three * named(t, weekly),
  });
  // The signal: the recurring questions, enclosed as one.
  const sg = ramp(t, signal + 0.05, 0.4) * three;
  box(xs[0] - 40, QY - 40, xs.at(-1) - xs[0] + 80, 80, {
    stroke: P.unknown,
    alpha: sg,
    radius: 40,
    width: 2.5,
  });
  nameText(L("一个苗头", "A signal"), xs.at(-1) + 40 + NAME_GAP, QY, {
    align: "left",
    alpha: three * named(t, signal),
  });
}

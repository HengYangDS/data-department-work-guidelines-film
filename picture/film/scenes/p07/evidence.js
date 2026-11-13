/* 07's middle stages: the observations pinned to the record, the hypotheses and the ways they are tested, and last
 * night's delay worked through as the smallest experiment. */

import { ctx } from "../../canvas.js";
import { since } from "../../drawing/flows.js";
import { restMark } from "../../drawing/levels.js";
import { link } from "../../drawing/links.js";
import {
  dashed,
  diamond,
  dot,
  labelSize,
  line,
  measure,
  path,
  stroke,
  text,
} from "../../drawing/strokes.js";
import { clock, documentIcon, ring } from "../../drawing/symbols.js";
import { listIn, listLevel, named, speaking } from "../../naming/lists.js";
import { NAME_GAP, nameText } from "../../naming/names.js";
import { NOTE, termRow } from "../../naming/terms.js";
import { LABEL, P } from "../../palette.js";
import { L, en } from "../../timeline.js";
import { cue, cues } from "../../timing/cues.js";
import { mix, ramp, soon } from "../../timing/easing.js";
import { drawShare, glide } from "../../timing/pace.js";
import { s07Eye } from "./marks.js";

/* Stage 4: the eye over the record line, the facts pinned to it and the unknowns that bear on the decision. */
export function s07Observations(s, t, observe, four) {
  const [facts, sourceTime, unknown, affects, decision] = cues(s, [
    ["重要的事实", "important facts"],
    ["来源和时间", "source and time"],
    ["每个未知因素", "each unknown"],
    ["对这个决定", "affects the decision"],
    ["这个决定", "the decision"],
  ]);
  const EX = 960,
    EY = 360,
    LY = 530,
    fy = 610,
    dy = 765,
    dr = 40,
    em = labelSize(LABEL);
  const factNames = [L("重要的事实", "Facts"), L("带上来源和时间", "source and time")],
    unknownNames = [L("每个未知因素", "Unknowns"), L("对决定的影响", "effect on the decision")];
  // The facts and the unknowns hang from the record as one pair, each name over its qualifier, and the pair stands
  // centred on the record: it runs from the facts' point, 10 px left of their drop, to the end of the unknowns' names.
  const wide = ([name, note]) => Math.max(measure(name), measure(note, NOTE)),
    fx = 960 - (500 + 40 + wide(unknownNames) + 10) / 2 + 10,
    ux = fx + 500;
  const on = four * named(t, observe);
  s07Eye(EX, EY, on);
  nameText(L("再把观察记清楚", "The observations"), EX, EY + 64 + NAME_GAP, {
    valign: "top",
    alpha: on,
  });
  line(480, LY, 1440, LY, { color: P.line, alpha: on, width: 3.5 });
  // The facts: a firm point pinned to the record, which takes its source and its time.
  const fq = four * ramp(t, facts - 0.1, 0.45),
    sq = four * ramp(t, sourceTime - 0.1, 0.45),
    uq = four * ramp(t, unknown - 0.1, 0.45);
  link(fx, LY + 4, fx, fy - 14, {
    color: P.ink,
    alpha: fq,
    draw: { t, at: facts - 0.1 },
    end: false,
  });
  dot(fx, fy, 10, { color: P.evidence, alpha: fq });
  documentIcon(fx + 28, fy - 20, 32, 40, { alpha: sq, rows: 2 });
  clock(fx + 96, fy, 16, { hand: 0.62, color: P.evidence, alpha: sq });
  termRow(t, [factNames[0]], [facts], [factNames[1]], [sourceTime], fx + 130, fy - em / 2, {
    alpha: four,
    inline: false,
  });
  // The unknowns: an open question hanging from the record, whose way runs down to the decision. Its drop and its ring
  // are one dashed stroke, so the question and the line it hangs from read as one mark under its name.
  const hang = soon(t, unknown - 0.1, 0.4);
  stroke(
    () => {
      if (hang > 0) {
        ctx.moveTo(ux, LY + 4);
        ctx.lineTo(ux, mix(LY + 4, fy - 20, hang));
      }
      ctx.moveTo(ux, fy - 16);
      ctx.ellipse(ux, fy, 16, 16, -Math.PI / 2, 0, Math.PI * 2);
    },
    { color: P.unknown, alpha: uq, width: 2.5, dash: [4, 4] },
  );
  text("?", ux, fy + 1, 22, { align: "center", color: P.unknown, alpha: uq, role: "mark" });
  termRow(t, [unknownNames[0]], [unknown], [unknownNames[1]], [affects], ux + 40, fy - em / 2, {
    alpha: four,
    inline: false,
  });
  link(ux, fy + 20, ux, dy - dr - 10, {
    alpha: uq,
    upto: drawShare(t, affects + 0.05, Math.abs(dy - dr - 10 - (fy + 20)), 0.6),
    dash: [6, 6],
    flowing: since(t, affects + 0.65),
  });
  const dq = four * ramp(t, decision - 0.1, 0.45);
  diamond(ux, dy, dr, { color: P.authority, alpha: dq, width: 3 });
  nameText(L("这个决定", "The decision"), ux + dr + NAME_GAP, dy, {
    align: "left",
    color: P.authority,
    alpha: four * named(t, decision),
  });
}

/* Stage 5: the tree from the hypothesis to the ways it is tested. */
export function s07Hypotheses(s, t, hypotheses, experiment, five) {
  const ats = [
    ...cues(s, [
      ["找反例", "look for counterexamples"],
      ["跟基准比", "check the baseline"],
      ["也想想不做", "consider not acting"],
    ]),
    experiment,
  ];
  const separates = cue(s, "分清说得通", "separates the plausible");
  // The tree stands centred as it builds: while its short tests stand it stands right of its finished place, 168 px
  // right of the hypothesis's first place in Chinese and 132 in English. The Chinese eases to 85 px as the experiment's
  // qualifier, which runs on its line, arrives; the English eases to 85 px on the experiment's words, its widest test,
  // and on to 18 px as its qualifier arrives, whole under its term.
  const sx = en
    ? 132 - 47 * glide(t, experiment - 0.1, 47) - 67 * glide(t, separates - 0.1, 67)
    : 168 - 83 * glide(t, separates - 0.1, 83);
  const hx = 480 + sx,
    hy = 480,
    R = 40,
    ys = [300, 420, 540, 660],
    ax = 820 + sx,
    gx = 860 + sx,
    nx = 1020 + sx;
  dot(hx, hy, R, { color: P.row, alpha: five });
  ring(hx, hy, R, { color: P.ink, alpha: five, width: 2.5 });
  text("?", hx, hy + 1, 26, { align: "center", color: P.muted, alpha: five, role: "mark" });
  nameText(L("检验假设", "Hypotheses"), hx, hy + R + NAME_GAP, {
    valign: "top",
    alpha: five * named(t, hypotheses),
  });
  ats.forEach((at, i) => {
    const y = ys[i],
      q = five * ramp(t, at - 0.1, 0.45),
      lit = speaking(t, ats, i);
    dot(ax, y, 12, { color: P.evidence, alpha: q });
    if (lit > 0)
      ring(ax, y, 21, {
        color: P.evidence,
        alpha: lit * restMark(P.evidence, 0.5) * q,
        width: 2,
      });
    link(hx + R + 8, hy, ax - 20, y, {
      route: "hvh",
      mid: 650 + sx,
      alpha: five,
      draw: { t, at: at - 0.1 },
      end: false,
    });
    if (i === 0) {
      // A run of agreeing points and the one that breaks it.
      [0, 1, 2, 3].forEach((k) =>
        dot(gx + 10 + k * 28, y + 12 - k * 8, 7, { color: P.evidence, alpha: q }),
      );
      dot(gx + 112, y + 18, 8, { color: P.unknown, alpha: q * ramp(t, at + 0.3, 0.3) });
    } else if (i === 1) {
      line(gx, y + 18, gx + 120, y + 18, { color: P.muted, alpha: q, width: 2 });
      path(
        [
          [gx, y + 12],
          [gx + 40, y + 6],
          [gx + 80, y - 4],
          [gx + 120, y - 18],
        ],
        { color: P.evidence, alpha: q, width: 2.5, draw: { t, at: at + 0.1 } },
      );
    } else if (i === 2) {
      // Two courses from one point: acting, and the course the case takes with no action, drawn dashed.
      link(gx, y, gx + 120, y - 20, {
        route: "hvh",
        mid: gx + 40,
        alpha: q * 0.8,
        draw: { t, at: at },
      });
      link(gx, y, gx + 120, y + 20, {
        route: "hvh",
        mid: gx + 40,
        color: P.muted,
        alpha: q,
        dash: [5, 6],
        upto: drawShare(t, at + 0.2, Math.abs(gx + 120 - gx) + Math.abs(y + 20 - y), 0.5),
      });
    } else {
      const sq = five * ramp(t, separates - 0.1, 0.45),
        fork = soon(t, separates - 0.05, 0.6);
      ring(gx + 14, y, 13, { color: P.evidence, alpha: q, width: 2.5 });
      line(gx + 23, y + 9, gx + 32, y + 18, { color: P.evidence, alpha: q, width: 3 });
      [-16, 16].forEach((d, k) => {
        link(gx + 36, y, gx + 108, y + d, {
          route: "hvh",
          mid: gx + 70,
          alpha: sq,
          upto: fork,
          end: false,
        });
        dot(gx + 116, y + d, 7, {
          color: k ? P.authority : P.evidence,
          alpha: sq * ramp(t, separates + 0.3, 0.3),
        });
      });
    }
  });
  const tests = en
    ? ["Counterexamples", "The baseline", "Not acting"]
    : ["找反例", "跟基准比", "不做会怎样"];
  tests.forEach((v, i) =>
    nameText(v, nx, ys[i], { align: "left", alpha: five * listIn(t, ats, i), set: "tests" }),
  );
  // The qualifier keeps the key words of what the experiment separates, short of the whole clause its caption shows:
  // the Chinese takes the verb and its object, each part on its own words. The English qualifier stands under its term
  // on one line, and the tree stands further left to take it.
  const qual = en ? ["that separates", " the plausible explanations"] : ["分清", "几种解释"];
  const qualAts = en ? [separates] : [separates, cue(s, "几种解释", "")];
  termRow(
    t,
    [L("最小的实验", "The smallest experiment")],
    [experiment],
    qual,
    qualAts,
    nx,
    ys[3] - labelSize(LABEL) / 2,
    {
      width: en ? 620 : 1780 - nx,
      inline: en ? false : null,
      alpha: five * listLevel(t, ats, 3),
      set: "tests",
    },
  );
}

/* Stage 7: last night's delay, worked through as the smallest experiment. */
export function s07Delay(s, t, delay, seven) {
  const [checkAt, ...why] = cues(s, [
    ["查供应商", "checking"],
    ["是发布晚了", "did the vendor publish late"],
    ["我们的任务启动晚了", "did our job start late"],
  ]);
  // The delay's and the check's names share one baseline, a name's gap over the taller mark.
  const cy = 430,
    dx = 600,
    px = 1320,
    CR = 60,
    MR = 56,
    y = 680,
    w = 380,
    x0s = [360, 1180],
    nameY = cy - Math.max(CR, MR) - NAME_GAP;
  clock(dx, cy, CR, { hand: 0.62, color: P.unknown, alpha: seven });
  // The delay is named as the words name it.
  nameText(L("昨晚那次延迟", "Last night's delay"), dx, nameY, {
    valign: "bottom",
    alpha: seven * named(t, delay),
  });
  const cq = seven * ramp(t, checkAt - 0.1, 0.45),
    tip = MR * 0.72;
  link(dx + CR + 10, cy, px - MR - 8, cy, { alpha: cq, draw: { t, at: checkAt - 0.1 } });
  ring(px, cy, MR, { color: P.evidence, alpha: cq, width: 3 });
  line(px + tip, cy + tip, px + tip + 30, cy + tip + 30, {
    color: P.evidence,
    alpha: cq,
    width: 5,
  });
  clock(px, cy, MR * 0.55, { hand: 0.3, color: P.evidence, alpha: cq });
  nameText(L("供应商的发布时间", "Publication time"), px, nameY, {
    valign: "bottom",
    width: 320,
    alpha: seven * named(t, checkAt),
  });
  const names = en
    ? ["Did the vendor publish late?", "Did our job start late?"]
    : ["发布晚了", "我们的任务启动晚了"];
  x0s.forEach((x0, k) => {
    const q = seven * ramp(t, why[k] - 0.1, 0.45),
      lit = speaking(t, why, k),
      due = x0 + 190;
    const rail = seven * ramp(t, why[k] - 0.15, 0.4);
    line(x0, y - 24, x0 + w, y - 24, { color: P.line, alpha: rail, width: 2 });
    line(x0, y + 24, x0 + w, y + 24, { color: P.line, alpha: rail, width: 2 });
    dashed(due, y - 52, due, y + 52, { color: P.line, alpha: rail });
    link(px, cy + MR + 12, x0 + w / 2, y - 64, {
      route: "vhv",
      mid: 590,
      alpha: rail,
      draw: { t, at: why[k] - 0.15 },
    });
    // The vendor published late and the job followed; or the vendor was on time and our job started late.
    const docX = k ? x0 + 90 : x0 + 270,
      jobX = k ? x0 + 290 : x0 + 330;
    documentIcon(docX - 17, y - 48, 34, 44, {
      alpha: q,
      rows: 2,
      stroke: k ? P.evidence : P.unknown,
    });
    dot(jobX, y + 24, 12, { color: k ? P.unknown : P.muted, alpha: q });
    if (lit > 0)
      ring(k ? jobX : docX, k ? y + 24 : y - 26, 30, {
        color: P.unknown,
        alpha: lit * restMark(P.unknown, 0.5) * q,
        width: 2,
      });
    nameText(names[k], x0 + w / 2, y + 52 + NAME_GAP, {
      valign: "top",
      width: 380,
      alpha: seven * listIn(t, why, k),
      set: "explanations",
    });
  });
}

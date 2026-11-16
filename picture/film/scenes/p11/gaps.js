/* 11's middle stages: bias hiding in the population, the series with its gaps under the conclusion, and today's feed
 * that cannot reach back to the decisions. */

import { ctx } from "../../canvas.js";
import { blend } from "../../drawing/colour.js";
import { since } from "../../drawing/flows.js";
import { restMark } from "../../drawing/levels.js";
import { link } from "../../drawing/links.js";
import { box, dashed, dot, labelSize, line, path, text } from "../../drawing/strokes.js";
import { clock, cross, ring } from "../../drawing/symbols.js";
import { listIn, listLevel, named, speaking } from "../../naming/lists.js";
import { NAME_GAP, nameText } from "../../naming/names.js";
import { growName } from "../../naming/parts.js";
import { railNames } from "../../naming/placement.js";
import { LABEL, P } from "../../palette.js";
import { L, en } from "../../timeline.js";
import { cue, cueFrom, cues } from "../../timing/cues.js";
import { mix, ramp } from "../../timing/easing.js";
import { glide } from "../../timing/pace.js";
import { DEC, X0, X1 } from "./prices.js";

/* Stage 4: the lens on where bias hides, each place arriving with its rails. */
export function s11Bias(s, t, biasCut, four) {
  const ats = cues(s, [
    ["样本选择", "sample selection"],
    ["证券代码和公司", "changed tickers"],
    ["交易日历", "trading calendar"],
    ["幸存者偏差", "keeping only today's survivors"],
  ]);
  // Rails, top to bottom in the order spoken: the two the sample picks, the security that changes its ticker, the
  // calendar, and the survivors' pair, the second of which ends before today. The four places stand at one pitch, so
  // their names form an even column; the ticker's identifiers hang under its rail, clear of the sample's frame. The
  // Chinese places' names are short, so its stage stands 50 px right: about the centre once the first place has joined
  // the lens and once all four are named, and the English 40 px, for its lens's name on one line. Until the second place
  // is named the stage stands further right, so the lens
  // with the first place stands about the centre (110 px in Chinese; 70 px in English, so its first place's name
  // stands centred and the second's, arriving just before the stage moves, stays inside the safe area), and it eases
  // to its place on the second place's words.
  const sx = L(50, 40),
    RX = 560 + sx,
    GX = 1220 + sx,
    NX = 1290 + sx,
    ROW = 125,
    R0 = 335,
    END = RX + 340;
  const SA = [R0 - 35, R0 + 35],
    TK = R0 + ROW,
    CAL = R0 + 2 * ROW,
    SV = [R0 + 3 * ROW - 35, R0 + 3 * ROW + 35];
  // The stage eases back from the second place's words until the third place rises, so it keeps moving between them.
  // While the lens stands alone, before the first place rises, the stage stands further right still, so the lens stands
  // within 350 px of the centre, and it eases left as that place rises.
  const ALONE = L(170, 190),
    rise0 = ats[0] - L(0.5, 0.45);
  ctx.save();
  ctx.translate(
    ALONE * (1 - glide(t, rise0, ALONE)) + L(110, 70) * (1 - glide(t, ats[1] + 0.05, L(110, 70))),
    0,
  );
  // Each place rises just before its words, the first a little earlier, so the lens never stands alone for long; the
  // Chinese first place, after the lens's longer phrase, rises 0.5 s before its words, the English 0.45 s.
  const lens = four * named(t, biasCut),
    on = (i) => ramp(t, i ? ats[i] - 0.25 : rise0, 0.4) * four,
    lit = (i) => speaking(t, ats, i);
  // The whole set returns to full ink on the last item's words, inside its thought, so it stands complete before the
  // stage cuts; the item being spoken keeps its own light.
  const lastWhole = ramp(t, ats[3] + 0.05, 0.4),
    level = (i) => Math.max(listLevel(t, ats, i), lastWhole);
  // The ended security's line breaks into dashes over a third of a second from its drop, as 13.1's join does: each
  // 20 px of it opens a gap from its end, so the dashes keep their places and nothing changes in one frame.
  const dropAt = cueFrom(s, "偏差", "today's", ats[3]),
    dropped = ramp(t, dropAt + 0.05, 0.35);
  // The bracket gathers the places present: it opens on the sample's rails and grows down to each further place.
  const ends = [SA[1], TK, CAL + 4, SV[1]].map((y) => y + 22);
  const bottom = ends
    .slice(1)
    .reduce((y, end, i) => mix(y, end, ramp(t, ats[i + 1] - 0.25, 0.4)), ends[0]);
  path(
    [
      [RX - 26, SA[0] - 22],
      [RX - 40, SA[0] - 22],
      [RX - 40, bottom],
      [RX - 26, bottom],
    ],
    { color: P.line, alpha: on(0), width: 2 },
  );
  // The lens stands at 405, above the places' middle, so across this stage's two cuts its handle and the chart's axis,
  // which stands near it before and after, are never read as one mark jumping. The English name stands on one line, as
  // no break keeps its phrase and its block, so its lens stands 20 px further left and the name keeps 40 px from the
  // bracket. The Chinese name says the clause by its key words on one line, short of the whole clause its caption
  // shows, as the English does: the clause whole would repeat that caption word for word, which the sync gate refuses,
  // and a run of its words short of it loses its subject (还可能藏在别的地方).
  const LY = 405,
    LX = RX - L(220, 240);
  ring(LX, LY, 44, { color: P.ink, alpha: lens, width: 4 });
  line(LX + 31, LY + 31, LX + 62, LY + 62, { color: P.ink, alpha: lens, width: 6 });
  nameText(L("偏差可能藏在别处", "Bias may hide elsewhere"), LX, LY + 62 + NAME_GAP, {
    valign: "top",
    width: L(280, 340),
    alpha: lens,
  });
  // The sample: a frame picks two securities, and they take the ink.
  box(RX - 24, SA[0] - 34, GX - RX + 48, SA[1] - SA[0] + 68, {
    stroke: P.evidence,
    width: 2 + lit(0),
    alpha: on(0),
    radius: 12,
  });
  SA.forEach((y) => line(RX, y, GX, y, { color: P.ink, width: 3, alpha: on(0) }));
  // The changed ticker: one security's identifier changes part-way along its rail.
  line(RX, TK, RX + 310, TK, { color: P.ink, width: 3, alpha: on(1) });
  line(RX + 330, TK, GX, TK, { color: P.ink, width: 3, alpha: on(1) });
  text("ID A1", RX + 155, TK + 30, 26, {
    role: "mark",
    align: "center",
    color: P.muted,
    alpha: on(1),
  });
  text("ID B7", RX + 555, TK + 30, 26, {
    role: "mark",
    align: "center",
    color: P.authority,
    alpha: on(1),
  });
  ring(RX + 320, TK, 10 + 4 * lit(1), { color: P.authority, alpha: on(1), width: 2.5 });
  // The trading calendar lays out its days on its own words, one of them wrong. The days stand a little lighter than
  // the line colour, about 4.8:1 against the ground, since the scan of resting text reads their cells as glyphs.
  for (let k = 0; RX + k * 46 + 36 <= GX; k++) {
    const x = RX + k * 46;
    box(x, CAL - 24, 36, 48, {
      stroke: blend(P.line, P.muted, 0.3),
      width: 2,
      alpha: four * ramp(t, ats[2] - 0.1 + k * 0.02, 0.3),
      radius: 4,
    });
    if (k === 10) {
      box(x, CAL - 24, 36, 48, { stroke: P.unknown, width: 2 + lit(2), alpha: on(2), radius: 4 });
      cross(x + 18, CAL, 22, { alpha: on(2), width: 3 });
    }
  }
  // Survivors: the security that lasts to today takes the ink; the one that ended before today stands to its end with
  // it and is dropped, dashed and crossed, on "today". While the survivors are said their cross lights by its stroke,
  // as the sample's frame and the calendar's wrong day light by theirs, so it keeps one size, unlike the lens's handle.
  line(RX, SV[0], GX, SV[0], { color: P.ink, width: 3, alpha: on(3) });
  line(RX, SV[1], END, SV[1], {
    color: P.line,
    width: 3.5,
    alpha: on(3),
    dash: dropped > 0 ? [20 - 10 * dropped, 10 * dropped] : null,
  });
  line(END, SV[1] - 18, END, SV[1] + 18, { color: P.line, width: 4, alpha: on(3) });
  cross(END + 30, SV[1], 24, {
    alpha: four * ramp(t, dropAt - 0.1, 0.3),
    width: 3 + 1.5 * lit(3),
  });
  const names = en
    ? [
        "Sample selection",
        "Changed tickers or issuers",
        "The trading calendar",
        "Only today's survivors",
      ]
    : ["样本选择", "证券代码和公司的变更", "交易日历", "幸存者偏差"];
  [(SA[0] + SA[1]) / 2, TK, CAL, (SV[0] + SV[1]) / 2].forEach((y, i) =>
    nameText(names[i], NX, y, {
      align: "left",
      width: 470,
      alpha: four * ramp(t, ats[i] - 0.15, 0.4) * level(i),
      set: "bias",
    }),
  );
  ctx.restore();
}

/* Stage 5: the series with what is missing, late, conflicting and anomalous marked on it, under the conclusion. */
export function s11Gaps(s, t, AY, py, missingCut, chartDx, five) {
  ctx.save();
  ctx.translate(chartDx, 0);
  const ats = cues(s, [
    ["缺失", "missing"],
    ["延迟", "late"],
    ["冲突", "conflicting"],
    ["异常", "anomalous"],
  ]);
  const changesAt = cue(s, "影响结论", "affects the conclusion");
  const concAt = cueFrom(s, "结论", "conclusion", missingCut),
    xs = [925, 1140, 1360, 1570],
    BAR = 230,
    mark = (i) => ramp(t, ats[i] - 0.1, 0.4) * five;
  // Missing: the line breaks and a dashed trace holds its place.
  box(xs[0] - 34, py(xs[0]) - 60, 68, 120, { fill: P.ground, alpha: mark(0) });
  dashed(xs[0] - 34, py(xs[0] - 34), xs[0] + 34, py(xs[0] + 34), {
    color: P.unknown,
    alpha: mark(0),
  });
  // Late: the value comes with a clock, which sits on it, so the two are one mark on the series; conflicting: two
  // values stand at one time.
  dot(xs[1], py(xs[1]), 7, { color: P.unknown, alpha: mark(1) });
  clock(xs[1], py(xs[1]) - 34, 18, { hand: 0.32, color: P.unknown, alpha: mark(1) });
  dot(xs[2], py(xs[2]), 7, { color: P.unknown, alpha: mark(2) });
  dot(xs[2], py(xs[2]) - 56, 8, { color: P.unknown, alpha: mark(2), hollow: true, width: 2.5 });
  dashed(xs[2], py(xs[2]) - 46, xs[2], py(xs[2]) - 10, { color: P.unknown, alpha: mark(2) });
  // Anomalous: one value leaps from the course of its neighbours.
  path(
    [
      [xs[3] - 16, py(xs[3] - 16)],
      [xs[3], py(xs[3]) - 58],
      [xs[3] + 16, py(xs[3] + 16)],
    ],
    { color: P.unknown, alpha: mark(3), width: 2.5 },
  );
  dot(xs[3], py(xs[3]) - 58, 7, { color: P.unknown, alpha: mark(3) });
  xs.forEach((x, i) => {
    if (speaking(t, ats, i) > 0)
      ring(x, py(x), 16, {
        color: P.unknown,
        alpha: five * speaking(t, ats, i) * restMark(P.unknown, 0.6),
        width: 2,
      });
  });
  railNames(
    en ? ["Missing", "Late", "Conflicting", "Anomalous"] : ["缺失", "延迟", "冲突", "异常"],
    xs,
    AY,
    { alpha: (i) => five * listIn(t, ats, i), set: "gaps" },
  );
  // The conclusion spans the series. Its bar is a filled band 6 px deep, a mark of its own, never one more line like
  // the time axis below it.
  const claim = ramp(t, concAt - 0.15, 0.4) * five,
    a1 = X1;
  box(X0, BAR - 3, a1 - X0, 6, { fill: P.ink, alpha: claim, radius: 0 });
  line(X0, BAR - 14, X0, BAR + 14, { color: P.ink, width: 3, alpha: claim });
  line(a1, BAR - 14, a1, BAR + 14, { color: P.ink, width: 3, alpha: claim });
  // The conclusion is named on its first mention.
  const concName = L("结论", "Conclusion"),
    concY = BAR - 30 - NAME_GAP - labelSize(LABEL);
  growName(t, [concName], [concAt], X0, concY, { alpha: five });
  // Each way rises from the top of its gap's mark: the late value's clock sits on its value.
  xs.forEach((x, i) =>
    link(x, py(x) - [66, 56, 76, 76][i], x, BAR + 18, {
      alpha: five,
      draw: { t, at: changesAt - 0.05 + i * 0.15 },
    }),
  );
  ctx.restore();
}

/* Stage 6: today's feed at the series' present end, its way back to the decisions stopped at a bar. */
export function s11Feed(s, t, AY, py, feedCut, chartDx, six) {
  ctx.save();
  ctx.translate(chartDx, 0);
  const proveAt = cue(s, "说明不了", "cannot prove");
  // The open questions' row stands 54 px under the axis, so the refusal's first line keeps clear of the axis's ticks.
  // The English feed comes in 24 px nearer its chart, which stays 110 px right, so the stage rests within 30 px of centre.
  const whenAt = cueFrom(s, "当时能不能拿到", "available then", feedCut),
    fy = py(X1),
    WY = AY + 54,
    stop = 1222,
    FX = L(1800, 1776) - chartDx;
  link(FX, fy, X1 + 14, fy, {
    color: P.evidence,
    width: 3,
    alpha: ramp(t, feedCut - 0.1, 0.5) * six,
    flowing: since(t, feedCut - 0.1),
  });
  nameText(L("今天的数据再准", "Today's accurate feed"), FX, fy - 28, {
    align: "right",
    valign: "bottom",
    width: 300,
    color: P.evidence,
    alpha: six * named(t, feedCut),
  });
  const back = ramp(t, proveAt - 0.05, 0.3) * six;
  link(L(1700, 1652), fy + 24, 1060, WY, {
    route: "vh",
    alpha: back,
    upto: 0.8,
    draw: { t, at: proveAt - 0.05 },
    end: false,
  });
  line(stop, WY - 18, stop, WY + 18, {
    color: P.unknown,
    width: 4,
    alpha: ramp(t, proveAt + 0.75, 0.3) * six,
  });
  // The refusal is named at the left end of the open questions it leaves, clear of the caption band, by its key words;
  // the English stands whole on one line under the way it stops, beyond the last decision's line.
  nameText(
    L("说明不了", "Cannot prove what was available then"),
    L(DEC[0] - 40, DEC[2] + 16),
    L(WY, WY + 44),
    { align: L("right", "left"), width: L(320, 640), alpha: six * named(t, proveAt) },
  );
  DEC.forEach((x, i) =>
    text("?", x, WY, 26, {
      role: "mark",
      align: "center",
      color: P.unknown,
      alpha: ramp(t, whenAt - 0.1 + i * 0.15, 0.4) * six,
    }),
  );
  ctx.restore();
}

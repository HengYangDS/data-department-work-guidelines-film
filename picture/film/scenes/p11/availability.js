/* 11's first stages on the price chart: the vendor's correction, the unknown time each value became available, and
 * the repaired value that came after the decisions. */

import { ctx } from "../../canvas.js";
import { restMark } from "../../drawing/levels.js";
import { link } from "../../drawing/links.js";
import { box, dashed, dot, labelSize, line, measure, path, text } from "../../drawing/strokes.js";
import { check, documentIcon, ring } from "../../drawing/symbols.js";
import { named } from "../../naming/lists.js";
import { NAME_GAP, nameText, wrapName } from "../../naming/names.js";
import { growName } from "../../naming/parts.js";
import { rejectedName } from "../../naming/rejected.js";
import { NOTE, TERM_GAP, termRow } from "../../naming/terms.js";
import { LABEL, P } from "../../palette.js";
import { L, en } from "../../timeline.js";
import { cue, cueFrom, cues } from "../../timing/cues.js";
import { clamp, ease, mix, ramp, soon } from "../../timing/easing.js";
import { GLIDE_PEAK, drawShare } from "../../timing/pace.js";
import { voiceTime } from "../../timing/pauses.js";
import {
  CORR,
  CORR_DATE,
  DAY,
  DEC,
  X0,
  X1,
  corrected,
  priceAt,
  priceLabel,
  series,
} from "./prices.js";

/* Stage 1: the case, a stretch of prices the vendor corrects after the decisions were made on them. */
export function s11Correction(s, t, yv, py, lift, corr, todayS, head, drawFor, chartDx, one) {
  ctx.save();
  ctx.translate(chartDx, 0);
  // The case is named as it is introduced, above the chart it is told on: in English a line and 60 px above the
  // correction's name, so the two never read as one stepped two-line name; the Chinese names stand apart across, so
  // its case stands 34 px above that line and nearer the chart than the head.
  nameText(L("虚构的例子", "Illustrative case"), X0, L(216, 190), {
    align: "left",
    valign: "bottom",
    alpha: one * named(t, cue(s, "看一个虚构的例子", "here is an illustrative case")),
  });
  // Today's price stands where the history ends, at its latest close. It inks in there over the last 0.3 s of the
  // history's drawing, on the voice clock the history draws by, so it is whole as the head arrives at it, before the
  // thought ends. It does not ride the head: the head draws on at the tip pace, faster than a mark may travel, and a
  // mark that waited for the head to slow would have to ink in within a frame.
  const today = one * ease((voiceTime(t) - voiceTime(head + 0.05) - (drawFor - 0.3)) / 0.3);
  dot(X1, py(X1), 6, { color: P.ink, alpha: today });
  text(priceLabel(X1), X1 + 16, py(X1), 26, { role: "mark", color: P.ink, alpha: today });
  path(lift(corrected, CORR[0] - 20, CORR[1] + 20), {
    color: P.ink,
    width: 2.5,
    alpha: one * mix(1, 0.45, ramp(t, todayS, 0.6)),
    draw: { t, at: corr },
  });
  // The stretch is named by the correction that made it, above its left part; the refusal stands above its crest. Both
  // stand on one baseline, clear of the highest close beneath either.
  const top = (a, b) => Math.min(...series(corrected, a, b, DAY / 2).map(([, v]) => yv(v)));
  const over = Math.min(top(470, 650), top(690, 1070)) - NAME_GAP;
  nameText(L("供应商修正", "Vendor corrects"), 560, over, {
    valign: "bottom",
    alpha: one * named(t, corr),
  });
  rejectedName(L("今天修正过的数据", "Corrected series"), 880, over, {
    valign: "bottom",
    alpha: one * named(t, todayS),
    mark: ramp(t, todayS + 0.4, 0.4),
  });
  ctx.restore();
}

/* Stage 2: the open question over each decision of when its value first became available. */
export function s11Availability(s, t, AY, chartDx, two) {
  ctx.save();
  ctx.translate(chartDx, 0);
  // The English snapshots stand 36 px lower, so the question over them stands inside the content band.
  const FY = L(140, 176),
    FW = 180,
    FH = 96;
  const [whenAt, claimAt, snapNameAt, snapAt, recordAt, limitAt, exploreAt] = cues(s, [
    ["最早什么时候能拿到", "when each value first"],
    ["回测只用了", "used only what"],
    ["当时存下的快照", "earlier snapshots"],
    ["快照", "snapshots"],
    ["修正记录", "correction history"],
    ["讲明可用时间", "timing is unproven"],
    ["授权内的探索", "authorized exploration"],
  ]);
  // The words that say when each value first became available draw an empty dashed slot at each snapshot's place, one
  // after another, so the picture answers the sentence as it goes on.
  const becameAt = cue(s, "最早什么时候能拿到", "first became");
  DEC.forEach((c, i) => {
    // The "?" stands above its decision, in its empty slot, until that snapshot is found; then the snapshot is drawn
    // there, as far as its decision: what was known then. The mark arrives with its slot and gives way in the snapshot's
    // first moment, fading as the drawing begins, and the slot gives way as the snapshot's frame inks in over it.
    const found = snapAt - 0.1 + i * 0.25,
      fill = ramp(t, found, 0.5) * two,
      slotAt = becameAt - 0.1 + i * 0.25;
    path(
      [
        [c - FW / 2, FY],
        [c + FW / 2, FY],
        [c + FW / 2, FY + FH],
        [c - FW / 2, FY + FH],
        [c - FW / 2, FY],
      ],
      {
        color: P.unknown,
        dash: [6, 6],
        width: 2,
        alpha: two * (1 - ramp(t, found, 0.5)),
        draw: { t, at: slotAt },
      },
    );
    text("?", c, FY + FH / 2, 26, {
      role: "mark",
      align: "center",
      color: P.unknown,
      alpha: two * ramp(t, slotAt, 0.3) * (1 - ramp(t, found - 0.25, 0.25)),
    });
    box(c - FW / 2, FY, FW, FH, { stroke: P.evidence, width: 2, alpha: fill, radius: 6 });
    const mx = (x) => c - FW / 2 + 12 + ((x - X0) / (X1 - X0)) * (FW - 24),
      my = (v) => FY + FH / 2 + (v - 552) * 0.3;
    path(
      series(priceAt, X0, c).map(([x, v]) => [mx(x), my(v)]),
      { color: P.evidence, width: 2, alpha: two, draw: { t, at: found } },
    );
    line(mx(c), FY + 10, mx(c), FY + FH - 10, { color: P.authority, width: 2, alpha: fill });
  });
  // The left margin's names share one left edge, the edge of the series' name, unless that would bring this one nearer
  // the first snapshot than the name gap; like the series' name, its lines end together, toward its mark. The English
  // question stands whole on one line, over the three snapshots it asks about.
  if (en)
    nameText("When each value first became available", DEC[1], FY - NAME_GAP, {
      valign: "bottom",
      alpha: two * named(t, whenAt),
    });
  else {
    const widest = (lines) => Math.max(...lines.map((v) => measure(v))),
      when = wrapName("最早什么时候能拿到", 340);
    const margin = Math.min(
      X0 - NAME_GAP - widest(wrapName("历史价格", 180)),
      DEC[0] - FW / 2 - NAME_GAP - widest(when),
    );
    nameText(when, margin + widest(when), FY + FH / 2, {
      align: "right",
      alpha: two * named(t, whenAt),
    });
  }
  nameText(L("当时存下的快照", "Earlier snapshots"), DEC[1], FY + FH + NAME_GAP, {
    valign: "top",
    color: P.evidence,
    alpha: two * named(t, snapNameAt),
  });
  const rec = ramp(t, recordAt - 0.15, 0.4) * two;
  documentIcon(CORR_DATE - 38, FY + 6, 76, FH - 12, { alpha: rec, rows: 3 });
  nameText(L("修正记录", "Correction history"), CORR_DATE, FY + FH + NAME_GAP, {
    valign: "top",
    alpha: two * named(t, recordAt),
  });
  // The refused claim starts at the decisions' bracket, as its successor does. The exploration allowed beside it
  // follows on the same line one wide gap after its cross while the pair ends within the time axis; a pair too long
  // for that (the English) sets the exploration on the next row at the claim's edge, its check hung before it, 48 px
  // down, as far as the caption band's clearance allows, so neither runs past the axis.
  const low = AY + 14 + NAME_GAP;
  const refusal = rejectedName(
    L("回测只用了当时的信息", "Used only what was available then"),
    DEC[0],
    low,
    {
      align: "left",
      valign: "top",
      alpha: two * named(t, claimAt),
      mark: ramp(t, claimAt + 0.4, 0.4),
    },
  );
  const term = [L("授权内的探索可以继续", "Authorized exploration may continue")],
    qual = [L("讲明可用时间还没证实", "timing is unproven")];
  const beside = refusal.right + 64 + 42,
    fits = beside + measure(term[0]) + TERM_GAP + measure(qual[0], NOTE) <= X1;
  const ex = fits ? beside : DEC[0],
    ey = fits ? low : low + 48;
  check(ex - 30, ey + labelSize(LABEL) / 2, 24, {
    alpha: ramp(t, exploreAt - 0.15, 0.4) * two,
    draw: { t, at: exploreAt - 0.1 },
  });
  termRow(t, term, [exploreAt], qual, [limitAt], ex, ey, { width: X1 - ex, alpha: two });
  ctx.restore();
}

/* Stage 3: the repaired value, available only at the correction date, whose way to the last decision stops at a bar. */
export function s11RepairedValue(s, t, AY, yv, py, afterCut, chartDx, three) {
  ctx.save();
  ctx.translate(chartDx, 0);
  const [lateAt, neverAt, replaceAt, rerunAt] = cues(s, [
    ["决策之后", "became available only"],
    ["不可能用到它", "could never have used"],
    ["换掉", "replace or exclude"],
    ["再跑一遍", "rerun the test"],
  ]);
  const vx = 900,
    top = yv(corrected(vx)),
    dx = DEC[2],
    low = AY + 14 + NAME_GAP;
  // The value arrives, named, on the words that name it; its date follows on the words that date it.
  const valueAt = cueFrom(s, "某个值", "a value", afterCut);
  const vq = ramp(t, valueAt - 0.15, 0.4) * three,
    gone = soon(t, replaceAt + 0.05, 0.5);
  // The repaired value: a hollow mark above the series where the repaired crest stood, dated at the correction on the
  // axis.
  ring(vx, top, 14, { color: P.unknown, alpha: vq * (1 - gone), width: 2.5 });
  dot(vx, top, 6, { color: P.unknown, alpha: vq * (1 - gone) });
  nameText(L("某个值", "A value"), vx - 14 - NAME_GAP, top, {
    align: "right",
    alpha: three * named(t, valueAt) * (1 - gone),
  });
  const late = ramp(t, lateAt - 0.1, 0.4) * three;
  dashed(vx, top + 18, vx, AY - 6, {
    color: P.unknown,
    alpha: late * restMark(P.unknown, 0.6) * (1 - gone),
  });
  line(CORR_DATE, AY - 18, CORR_DATE, AY + 18, { color: P.unknown, width: 4, alpha: late });
  nameText(L("决策之后才拿得到", "Available only after the decision"), CORR_DATE, low, {
    valign: "top",
    width: 300,
    alpha: three * named(t, lateAt),
  });
  link(vx + 6, AY - 4, CORR_DATE - 8, AY - 4, {
    color: P.unknown,
    alpha: late * restMark(P.unknown, 0.8) * (1 - gone),
    upto: drawShare(t, lateAt - 0.05, Math.abs(CORR_DATE - 8 - (vx + 6)), 0.5),
    dash: [6, 8],
    end: false,
  });
  // The way from the late value to the decision it would serve, refused halfway.
  const barY = top + 80;
  link(vx + 16, top, dx, barY, {
    route: "hv",
    color: P.unknown,
    alpha: ramp(t, neverAt - 0.05, 0.3) * three * (1 - gone),
    draw: { t, at: neverAt - 0.05 },
    end: false,
  });
  line(dx - 18, barY, dx + 18, barY, {
    color: P.unknown,
    width: 4,
    alpha: ramp(t, neverAt + 0.45, 0.3) * three * (1 - gone),
  });
  // The refusal is named at the hook's corner, on the late value's line, so the value, the way and its refusal read as
  // one row.
  nameText(L("不可能用到它", "Could never have used it"), dx + NAME_GAP, top, {
    align: "left",
    alpha: three * named(t, neverAt) * (1 - gone),
  });
  // Replaced, the decision takes the value known then, lit on the original series.
  ring(dx, py(dx), 16, {
    color: P.evidence,
    alpha: three * ramp(t, replaceAt + 0.05, 0.4),
    width: 2.5,
  });
  growName(
    t,
    en ? ["Replace or exclude", ", and rerun"] : ["换掉或剔除", "，再跑一遍"],
    [replaceAt, rerunAt],
    DEC[0],
    low,
    { width: 520, alpha: three },
  );
  // The rerun runs the decisions again in voice time; each lights as the sweep passes it.
  const sweep = clamp(
      (voiceTime(t) - voiceTime(rerunAt + 0.05)) / Math.max(1.1, (DEC[2] + 20 - X0) / GLIDE_PEAK),
    ),
    sx = mix(X0, DEC[2] + 20, sweep);
  if (sweep > 0 && sweep < 1)
    line(sx, 250, sx, 700, {
      color: P.evidence,
      width: 3,
      alpha: three * clamp(sweep / 0.2) * clamp((1 - sweep) / 0.2),
    });
  DEC.forEach((x) => {
    const p = clamp((sx - x) / 120);
    if (sweep > 0 && p > 0 && p < 1)
      ring(x, AY, 10 + 16 * p, {
        color: P.authority,
        alpha: three * (1 - p) * clamp(p / 0.5),
        width: 2,
      });
  });
  ctx.restore();
}

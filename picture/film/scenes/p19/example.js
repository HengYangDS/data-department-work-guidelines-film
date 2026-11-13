/* 19's example: the vendor's two price snapshots compared read-only and reported, the conditions to stop, and the
 * phrase that sets no boundary. */

import { ctx } from "../../canvas.js";
import { tableIcon } from "../../drawing/datasets.js";
import { pass } from "../../drawing/flows.js";
import { link } from "../../drawing/links.js";
import { s17Page } from "../../drawing/pages.js";
import { box, dot, line, measure, path, text } from "../../drawing/strokes.js";
import { agent, clock, lock, person, ring, seal } from "../../drawing/symbols.js";
import { listIn, named, speaking } from "../../naming/lists.js";
import { NAME_GAP, nameText } from "../../naming/names.js";
import { rejectedName } from "../../naming/rejected.js";
import { LABEL, P } from "../../palette.js";
import { L, en } from "../../timeline.js";
import { cue } from "../../timing/cues.js";
import { mix, ramp, soon } from "../../timing/easing.js";
import { glide, smoother } from "../../timing/pace.js";
import { voiceTime } from "../../timing/pauses.js";

/* Stages 5 and 6: the vendor's earlier and revised snapshots on one chart, and the report made from it. */
export function s19Comparison(s, t, earlier, revised, report, items, contents, FW, GAP, fx, g5) {
  const fy = 310,
    fh = 380,
    at = [earlier, revised],
    snapshots = cue(s, "价格快照", "price snapshots");
  const px = (k) => fx + 100 + k * 115,
    base0 = fy + fh / 2 + 10,
    frame = ramp(t, earlier - 0.2, 0.4) * g5;
  box(fx, fy, FW, fh, { fill: P.row, stroke: P.ink, alpha: frame, radius: 10, width: 2.5 });
  path(
    [
      [fx + 50, fy + 34],
      [fx + 50, fy + fh - 40],
      [fx + FW - 40, fy + fh - 40],
    ],
    { color: P.line, alpha: frame, width: 2 },
  );
  nameText(L("价格快照", "Price snapshots"), fx + FW / 2, fy - NAME_GAP, {
    valign: "bottom",
    alpha: g5 * named(t, snapshots),
  });
  const series = [
    [60, -10, 40, -60, -20],
    [60, -10, 10, -100, -120],
  ];
  series.forEach((dys, i) => {
    const q = ramp(t, at[i] - 0.15, 0.4) * g5,
      c = i ? P.ink : P.evidence,
      pts = dys.map((dy, k) => [px(k), base0 + dy]);
    path(pts, { color: c, alpha: q, width: 3, draw: { t, at: at[i] - 0.1 } });
    pts.forEach(([x, y]) => dot(x, y, 5, { color: c, alpha: q }));
    nameText(i ? L("修正后", "Revised") : L("修正前", "Earlier"), px(4) + 18, pts[4][1], {
      align: "left",
      color: c,
      alpha: g5 * named(t, at[i]),
    });
  });
  // The comparison reads both series at the same moment, in voice time.
  const scan = ramp(t, revised + 0.2, 0.4) * g5,
    u = (voiceTime(t) * 0.18) % 1,
    sx = mix(px(0), px(4), u);
  line(sx, fy + 24, sx, fy + fh - 52, {
    color: P.authority,
    alpha: scan * 0.8 * pass(u, 0.1),
    width: 2,
  });
  // The report: its page and name head the column, and its contents follow, each a mark of one size with its sign in
  // it; the item being said is shown by its ring's weight.
  const ix = fx + FW + GAP + 18,
    hy = 395,
    ys = [465, 535, 605],
    on = g5 * named(t, report);
  // The Agent the example is delegated to heads the report it writes, a row above it at the column's pitch, so its
  // name stands on, unbroken, through the conditions to stop that it applies.
  agent(ix, hy - 70, { alpha: on, size: 1.1 });
  nameText(L("智能体", "Agent"), ix + 24 + NAME_GAP, hy - 70, {
    align: "left",
    color: P.evidence,
    alpha: on,
  });
  s17Page(ix - 14, hy - 18, 28, 36, { alpha: on, rows: 2, stroke: P.evidence });
  nameText(L("报告", "Report"), ix + 24 + NAME_GAP, hy, {
    align: "left",
    color: P.evidence,
    alpha: on,
  });
  ys.forEach((y, i) => {
    const q = ramp(t, items[i] - 0.15, 0.4) * g5,
      lit = speaking(t, items, i),
      c = i === 2 ? P.unknown : P.evidence;
    if (i === 0) clock(ix, y, 18, { hand: 0.15, color: c, alpha: q });
    else ring(ix, y, 18, { color: c, alpha: q, width: 2.5 });
    if (i === 1) text("≠", ix, y, 24, { role: "mark", align: "center", color: c, alpha: q });
    if (i === 2) text("?", ix, y, 24, { role: "mark", align: "center", color: c, alpha: q });
    if (lit > 0) ring(ix, y, 18, { color: c, alpha: q * lit, width: 4.5 });
    nameText(contents[i], ix + 24 + NAME_GAP, y, {
      align: "left",
      alpha: g5 * listIn(t, items, i),
      set: "report",
    });
  });
}

/* The lock under the example's stage, which closes on the words that change nothing. */
export function s19ReadOnly(t, readOnly, kept) {
  const lw = measure(L("只看不改", "Read-only"), LABEL),
    lx = 960 - (lw + 19 + NAME_GAP) / 2,
    ly = 310 + 380 + 86;
  lock(lx, ly, {
    alpha: ramp(t, readOnly - 0.15, 0.4) * kept,
    color: P.evidence,
    size: 1.1,
    closed: soon(t, readOnly, 0.5),
  });
  nameText(L("只看不改", "Read-only"), lx + 19 + NAME_GAP, ly, {
    align: "left",
    color: P.evidence,
    alpha: kept * named(t, readOnly),
  });
}

/* Stage 7: the Agent over the conditions to stop, and the release it does not grant. */
export function s19StopConditions(t, noSnap, prodWrite, noApprove, g7) {
  // The three leaves stand on one row and are named on one line, the release's refused between the two stops.
  const ax = 960,
    ay = 300,
    bus = 420,
    xs = [450, 1470, 960],
    ends = [540, 540, 540],
    ys = [620, 620, 620],
    at = [noSnap, prodWrite, noApprove];
  const on = at.map((v) => ramp(t, v - 0.15, 0.4) * g7);
  agent(ax, ay, { alpha: g7, size: 1.8 });
  nameText(L("智能体", "Agent"), ax + 40 + NAME_GAP, ay, {
    align: "left",
    color: P.evidence,
    alpha: g7,
  });
  link(ax, ay + 40, ax, bus, { alpha: g7, end: false });
  const row = soon(t, noSnap - 0.1, 0.45);
  line(mix(ax, xs[0], row), bus, mix(ax, xs[1], row), bus, {
    color: P.muted,
    alpha: g7,
    width: 3,
  });
  xs.forEach((x, i) => {
    const q = on[i],
      go = soon(t, at[i] - 0.1, 0.6);
    link(x, bus, x, ends[i], { alpha: q * 0.8, end: false, dash: [6, 6] });
    link(x, bus, x, mix(bus, ends[i], go), { color: P.unknown, alpha: q, end: false });
    line(x - 26, ends[i] + 12, x + 26, ends[i] + 12, {
      color: P.unknown,
      alpha: ramp(t, at[i] + 0.4, 0.3) * g7,
      width: 4,
    });
  });
  // What each way would reach, on that way's words.
  box(xs[0] - 34, ys[0] - 44, 68, 88, { stroke: P.muted, alpha: on[0], radius: 6, dash: [6, 6] });
  text("?", xs[0], ys[0], 30, { role: "mark", align: "center", color: P.unknown, alpha: on[0] });
  tableIcon(xs[1] - 64, ys[1] - 42, 128, 84, { alpha: on[1], stroke: P.ink });
  seal(xs[2], ys[2], 36, { alpha: on[2], hollow: true });
  // The two stop conditions are the list, so the pair returns to full ink once both are said; the release is a
  // separate prohibition, refused on its own words.
  const stops = en
    ? ["Earlier snapshot is missing", "A production write"]
    : ["没有修正前的快照", "要改生产数据"];
  stops.forEach((v, i) =>
    nameText(v, xs[i], ys[i] + 44 + NAME_GAP, {
      valign: "top",
      width: 380,
      alpha: g7 * listIn(t, at.slice(0, 2), i),
      set: "stops",
    }),
  );
  rejectedName(L("放行这份数据", "Grant admission"), xs[2], ys[2] + 44 + NAME_GAP, {
    valign: "top",
    width: 420,
    alpha: g7 * named(t, noApprove),
    mark: ramp(t, noApprove + 0.45, 0.4),
  });
}

/* Stage 8: “just handle it” refused beside the member, with the boundary it does not set marked by its corners. */
export function s19JustHandleIt(s, t, MY, vague, notSet, authAt, g8) {
  // The English phrase beside the member is wider, so there the boundary stands further right to balance it.
  const mx = L(492, 450),
    fx = L(902, 930),
    fy = 300,
    fw = 600,
    fh = 500,
    cx = fx + fw / 2,
    cornerAt = cue(s, "划不出", "set an authorization");
  const corner = named(t, cornerAt) * g8;
  // The English says the phrase well before the corners' words, so until the corners stand the member and the phrase
  // stand 200 px right of their places, balanced with the Agent, and ease to them as the corners arrive; the Agent,
  // whose drift begins then, keeps its own place.
  const wait = L(0, 200) * (1 - glide(t, cornerAt + 0.05, L(0, 200)));
  ctx.save();
  ctx.translate(wait, 0);
  person(mx, MY, { alpha: g8, color: P.authority, size: 1.7 });
  nameText(L("成员", "Member"), mx, MY + 38 + NAME_GAP, {
    valign: "top",
    color: P.authority,
    alpha: g8,
  });
  rejectedName(L("“帮我搞定”", "“Just handle it”"), mx, 420, {
    valign: "bottom",
    alpha: g8 * named(t, vague),
    mark: ramp(t, notSet + 0.05, 0.3),
  });
  ctx.restore();
  [
    [fx, fy, 1, 1],
    [fx + fw, fy, -1, 1],
    [fx, fy + fh, 1, -1],
    [fx + fw, fy + fh, -1, -1],
  ].forEach(([x, y, sx, sy]) =>
    path(
      [
        [x, y + sy * 70],
        [x, y],
        [x + sx * 70, y],
      ],
      { color: P.muted, alpha: corner, width: 3, dash: [10, 7] },
    ),
  );
  nameText(L("授权的边界", "An authorization boundary"), fx, fy - NAME_GAP, {
    align: "left",
    valign: "bottom",
    color: P.muted,
    alpha: named(t, authAt) * g8,
  });
  // The drift widens in voice time, so a drift still widening when the thought ends rests in the quiet. It wanders
  // at a pace the eye follows: its sway and its widening together stay under GLIDE_PEAK px/s.
  const since = voiceTime(t) - voiceTime(notSet + 0.05),
    drift = smoother(since / 2),
    at = (k) => {
      const v = voiceTime(t) - k * 0.08,
        d = smoother((since - k * 0.08) / 2);
      return [cx + Math.sin(v * 0.9) * 380 * d, 540 + Math.cos(v * 0.7) * 160 * d];
    };
  if (drift > 0)
    path(
      Array.from({ length: 31 }, (_, k) => at(k)),
      { color: P.unknown, alpha: g8 * 0.6 * drift, width: 2, dash: [5, 6] },
    );
  agent(...at(0), { alpha: g8, size: 1.8 });
  nameText(L("智能体", "Agent"), cx, 596 + NAME_GAP, {
    valign: "top",
    color: P.evidence,
    alpha: g8 * (1 - ramp(t, notSet + 0.05, 0.3)),
  });
}

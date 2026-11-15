/* 29's closing stages: what urgency does not change, the record completed after containment, and a recurring
 * exception as a mechanism problem. */

import { ctx } from "../../canvas.js";
import { blend } from "../../drawing/colour.js";
import { s29Gear } from "../../drawing/gears.js";
import { link } from "../../drawing/links.js";
import { box, dot, labelSize, line, measure, stroke, text } from "../../drawing/strokes.js";
import { check, clock, documentIcon, ring, seal } from "../../drawing/symbols.js";
import { listLevel, named, speaking } from "../../naming/lists.js";
import { NAME_GAP, nameText } from "../../naming/names.js";
import { growName } from "../../naming/parts.js";
import { NOTE } from "../../naming/terms.js";
import { LABEL, P } from "../../palette.js";
import { L, en } from "../../timeline.js";
import { cue } from "../../timing/cues.js";
import { ease, mix, ramp, soon } from "../../timing/easing.js";
import { drawShare, glide, glideYield } from "../../timing/pace.js";
import { voiceTime } from "../../timing/pauses.js";
import { STAGE_CUT } from "../../timing/stages.js";

/* Stage 7: urgency's clock and its two ways, neither reaching a reliable result nor authority. */
export function s29Urgency(s, t, urgency, uncertain, noAuthority, eight) {
  // The clock reaches 46 px either side of its axis, or its name further; the uncertain result's page reaches 45 px
  // right of its axis, or its name further.
  const [reliable, target] = [cue(s, "变可靠", "reliable"), cue(s, "可靠", "reliable")],
    clockReach = Math.max(46, measure(L("再紧急", "Urgency")) / 2);
  const pairE =
    960 -
    (600 - clockReach + 900 + Math.max(45, measure(L("不确定的结果", "An uncertain result")) / 2)) /
      2;
  // The English says the result and reliable within a second, so its stage eases to its place in one move from the
  // result's words rather than settling between two.
  const E = en
    ? mix(360, -80, glide(t, uncertain - 0.1, 440))
    : mix(
        mix(360, pairE, glide(t, uncertain - 0.1, 360 - pairE)),
        -70,
        glide(t, target - 0.1, pairE + 70),
      );
  // The clock's hand turns on the stage that glides, so its clock gives its pace up to the glides'.
  const carried = en
    ? glideYield(t, uncertain - 0.1, 440)
    : glideYield(t, uncertain - 0.1, 360 - pairE) + glideYield(t, target - 0.1, pairE + 70);
  const cx = 600 + E,
    cy = 510,
    rows = [400, 620],
    sx = 900 + E,
    bx = 1200 + E,
    tx = 1480 + E;
  const un = ramp(t, uncertain - 0.15, 0.4) * eight;
  // The clock stands on the centre, near where the response's last marks stood, so it fades in over the cut's first
  // frames rather than in one and is not read as one of them jumping to it.
  // Its hand turns at 0.3 of a turn a second, slowly enough that no part of it is followed as moving at a pace.
  clock(cx, cy, 44, {
    hand: ((voiceTime(t) - carried) * 0.3) % 1,
    color: P.unknown,
    alpha: eight * ramp(t, urgency + STAGE_CUT, 0.15),
  });
  nameText(L("再紧急", "Urgency"), cx, cy + 44 + NAME_GAP, {
    valign: "top",
    alpha: eight * named(t, urgency),
  });
  link(cx + 52, cy, sx - 58, rows[0], {
    route: "hvh",
    mid: 750 + E,
    r: 18,
    alpha: un,
    end: false,
  });
  // Each refused way inks in over 0.3 s while it draws on, as the film's other refused ways do, so it never stands at
  // firm ink in the first frame it is seen.
  link(cx + 52, cy, bx - 16, rows[1], {
    route: "hvh",
    mid: 750 + E,
    r: 18,
    color: P.unknown,
    alpha: eight * ramp(t, noAuthority - 0.15, 0.3),
    upto: drawShare(
      t,
      noAuthority - 0.15,
      Math.abs(bx - 16 - (cx + 52)) + Math.abs(rows[1] - cy),
      0.5,
    ),
    end: false,
    dash: [8, 8],
  });
  // The uncertain result keeps its question mark; the way on toward reliable stops at the bar.
  documentIcon(sx - 44, rows[0] - 56, 88, 112, { alpha: un, rows: 0 });
  text("?", sx, rows[0] + 6, 44, { role: "mark", align: "center", color: P.unknown, alpha: un });
  nameText(L("不确定的结果", "An uncertain result"), sx, rows[0] + 56 + NAME_GAP, {
    valign: "top",
    alpha: eight * named(t, uncertain),
  });
  link(sx + 58, rows[0], bx - 16, rows[0], {
    color: P.unknown,
    alpha: eight * ramp(t, reliable - 0.15, 0.3),
    upto: drawShare(t, reliable - 0.15, Math.abs(bx - 16 - (sx + 58)), 0.45),
    end: false,
    dash: [8, 8],
  });
  [
    [rows[0], reliable],
    [rows[1], noAuthority],
  ].forEach(([y, at]) =>
    line(bx, y - 30, bx, y + 30, {
      color: P.unknown,
      alpha: ramp(t, at + 0.05, 0.3) * eight,
      width: 4,
    }),
  );
  // What urgency cannot reach stands beyond the bars, muted, on its words.
  ring(tx, rows[0], 34, { color: P.muted, alpha: eight * named(t, target), width: 2 });
  check(tx, rows[0] + 2, 30, { color: P.muted, alpha: eight * named(t, target) });
  seal(tx, rows[1], 32, { color: P.muted, alpha: eight * named(t, noAuthority), hollow: true });
  nameText(L("可靠", "Reliable"), tx, rows[0] + 56 + NAME_GAP, {
    valign: "top",
    color: P.muted,
    alpha: eight * named(t, target),
  });
  nameText(L("权限", "Authority"), tx, rows[1] + 34 + NAME_GAP, {
    valign: "top",
    color: P.muted,
    alpha: eight * named(t, noAuthority),
  });
}

/* Stage 8: the incident held first, and the record beside it filled row by row. */
export function s29Record(s, t, fields, verifyAt, reviewAt, nine) {
  // The Chinese contains the incident while the record still waits, narrow, so the incident stands 80 px nearer the
  // centre until the record opens and eases to its place as it opens.
  const later = cue(s, "再补记录", "then complete the record"),
    ix = 590 + (en ? 0 : 80 * (1 - glide(t, later - 0.45, 80))),
    cy = 500,
    rx = 800,
    rw = 640;
  // The Chinese last row is its caption's whole line, so it drops the 下 of 什么情况下.
  const rows = en
    ? [
        ["Who decided what"],
        ["On which facts", " and authority"],
        ["How long the measure lasts"],
        ["Who takes over"],
        ["When to roll back"],
      ]
    : [["谁", "凭哪些事实和权限，", "决定了什么"], ["措施管多久"], ["谁接手"], ["什么情况回滚"]];
  const rowAts = en
    ? [[fields[0]], [fields[1], cue(s, "", "and authority")], [fields[2]], [fields[3]], [fields[4]]]
    : [
        [fields[0], fields[1], cue(s, "决定了什么", "decided what")],
        [fields[2]],
        [fields[3]],
        [fields[4]],
      ];
  // The page's top and its name's line; each row's name stands one row's pitch below the one before.
  const starts = rowAts.map((v) => v[0]),
    RH = 66,
    top = cy - (RH * rows.length) / 2 + 10,
    PT9 = top - 60,
    HC = PT9 + 40;
  // The incident arrives already held, a firm ring around it, on the words that contain it first (in Chinese with the
  // clause that says so), so it is never seen before it is named.
  const firstAt = cue(s, "就先控制影响", "contain first") - 0.15,
    held9 = ramp(t, firstAt - 0.15, 0.4);
  const verified = ramp(t, verifyAt - 0.15, 0.4);
  dot(ix, cy, 12, { color: P.unknown, alpha: nine * held9 * (1 - verified) });
  ring(ix, cy, 26, { color: P.evidence, alpha: nine * held9, width: 3 });
  check(ix, cy + 1, 26, {
    color: P.evidence,
    alpha: nine * verified,
    draw: { t, at: verifyAt - 0.05 },
  });
  // The containment's name hangs under the incident; if it would nearly meet a row of the record beside it, it stands
  // on that row's line instead.
  const nominal = cy + 46 + NAME_GAP + labelSize(LABEL) / 2,
    rowMid = rows.map((_, i) => HC + RH * (i + 1)).find((m) => Math.abs(m - nominal) < 13);
  const contained = nameText(L("先控制影响", "Contain first"), ix, rowMid ?? nominal, {
    color: P.evidence,
    alpha: nine * named(t, firstAt),
  });
  // Verifying the correction and reviewing the cause, beneath the containment, centred under the incident, each act
  // joining the name on its own words.
  const after = en ? ["Verify the correction", ", review the cause"] : ["核验修正", "，复盘原因"],
    AW = 340;
  // The later step stands apart from the containment, each of its lines centred under the incident.
  growName(t, after, [verifyAt, reviewAt], ix, contained.bottom + 60, {
    width: AW,
    color: P.evidence,
    alpha: nine,
    align: "center",
    build: true,
  });
  // Each row's top: a row's rule lies 46 px below its top. The open page's top stands 44 px, its rows' left inset,
  // above its name's ink, and it ends 27 px below the last rule, which leaves the same room below the last row's
  // words; with its name alone the name stands in its middle, and each row lengthens it to the row's own end. The
  // waiting page's top rises to the open page's as it opens.
  const rowTop = (i) => HC + RH * (i + 1) - labelSize(LABEL) / 2,
    grownRows = starts.map((at) => soon(t, at - 0.5, 0.35));
  const OT = HC - labelSize(LABEL) / 2 - 44,
    foot = grownRows.reduce((y, q, i) => mix(y, rowTop(i) + 46 + 27, q), 2 * HC - OT);
  // The waiting page opens about its middle into the record over 1.6 s of voice time from 0.45 s before its words, each
  // edge peaking near 260 px/s; the name joins on its words inside the page, carried with the page's left edge as it
  // opens, as the frame's name of the incident moves with its frame, and the rows' rules end inside the page as it
  // stands.
  const open = ease((voiceTime(t) - voiceTime(later - 0.45)) / 1.6),
    pageW = mix(96, rw, open),
    waitX = rx + (rw - 96) / 2,
    px9 = mix(waitX, rx, open);
  documentIcon(px9, mix(PT9, OT, open), pageW, mix(120, foot - OT, open), {
    alpha: nine,
    rows: 0,
  });
  clock(px9 + 48, top + 14, 24, {
    hand: (voiceTime(t) * 0.5) % 1,
    color: P.muted,
    alpha: nine * (1 - ramp(open, 0, 0.4)),
  });
  nameText(L("再补记录", "Then complete the record"), px9 + 44, HC, {
    align: "left",
    alpha: nine * named(t, later + L(0.3, 0.6)),
  });
  // Why the record waits, under the waiting page on the words that say so, until the page opens over it.
  nameText(
    L("先记录会耽误应对", "Recording would delay the response"),
    waitX,
    top + 60 + NAME_GAP,
    {
      align: "left",
      valign: "top",
      size: NOTE,
      color: P.muted,
      alpha:
        nine *
        named(t, cue(s, "先记录会耽误应对", "recording would delay the response")) *
        (1 - ramp(t, later - 0.4, 0.25)),
    },
  );
  // The rows' rules are one stroke, each drawn on from its row's name as its row arrives, so they read as the page's
  // ruling and each row's name names its own box. A rule ends 44 px before the page's right border, the inset of its
  // box from the left border.
  stroke(
    () =>
      starts.forEach((at, i) => {
        const y = rowTop(i) + 46,
          end = Math.max(rx + 140, px9 + pageW - 44),
          q = drawShare(t, at - 0.15, end - rx - 96);
        if (q > 0) {
          ctx.moveTo(rx + 96, y);
          ctx.lineTo(mix(rx + 96, end, q), y);
        }
      }),
    { color: P.line, alpha: nine * 0.7, width: 2 },
  );
  rows.forEach((row, i) => {
    const y = rowTop(i),
      q = ramp(t, starts[i] - 0.15, 0.4),
      lit = speaking(t, starts, i),
      held = q * nine;
    box(rx + 44, y + 4, 24, 24, {
      stroke: lit > 0 ? blend(P.line, P.authority, lit) : P.line,
      alpha: held,
      radius: 4,
      width: 2,
    });
    if (q > 0)
      check(rx + 56, y + 16, 22, { color: P.authority, alpha: q * nine, upto: q, width: 3 });
    growName(t, row, rowAts[i], rx + 96, y, {
      alpha: nine * listLevel(t, starts, i),
      set: "record",
    });
  });
}

/* Stage 9: the same mark repeating along one rail, a recurring exception treated as a mechanism problem. */
export function s29Recurrence(s, t, again, recurring, mechanism, ten) {
  const xs = [520, 740, 960, 1180, 1400],
    ry = 380,
    bus = 474,
    gy = 612,
    gr = 60;
  // The repeats land on words spread evenly over the clause, from its first word to the last word of the recurrence.
  const close = cue(s, "反复出现", "a recurring kind of exception", { end: true }),
    said = s.words.filter((w) => w.start >= again - 1e-6 && w.start < close).map((w) => w.start);
  const beats = xs.map((_, k) => said[Math.round((k * (said.length - 1)) / (xs.length - 1))]);
  const mech = ramp(t, mechanism - 0.15, 0.4),
    turn = Math.max(0, voiceTime(t) - voiceTime(mechanism + 0.05)) * 0.25;
  line(
    xs[0] - 60,
    ry,
    mix(
      xs[0] - 60,
      xs.at(-1) + 60,
      drawShare(t, again - 0.1, xs.at(-1) - xs[0] + 120, Math.max(0.9, close - again)),
    ),
    ry,
    { color: P.line, alpha: ten, width: 2 },
  );
  xs.forEach((x, k) => {
    const q = ramp(t, beats[k] - 0.1, 0.3) * ten;
    dot(x, ry, 20, { color: P.ground, alpha: q });
    ring(x, ry, 20, { color: P.unknown, alpha: q, width: 2 });
    dot(x, ry, 9, { color: P.unknown, alpha: q });
    link(x, ry + 28, 960, gy - gr * 1.24 - 10, {
      route: "vhv",
      mid: bus,
      r: 16,
      alpha: ten * mech,
      draw: { t, at: mechanism - 0.1 },
      end: k === 2,
    });
  });
  s29Gear(960, gy, gr, { turn, alpha: ten * mech });
  const parts = en ? ["Treat", " a recurring kind of exception"] : ["同类紧急处置", "反复出现"];
  growName(
    t,
    parts,
    [again, recurring],
    960 - measure(parts.join(""), LABEL) / 2,
    ry - 20 - NAME_GAP,
    { valign: "bottom", alpha: ten },
  );
  nameText(L("按机制问题处理", "As a mechanism problem"), 960, gy + gr * 1.24 + NAME_GAP, {
    valign: "top",
    color: P.evidence,
    alpha: ten * named(t, mechanism),
  });
}

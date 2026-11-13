/* 10 data: one price, five moments. The scene, with the price on its own card; it carries the price across the cut from
 * scene 09. */

import { blend } from "../../drawing/colour.js";
import { tableIcon } from "../../drawing/datasets.js";
import { restMark } from "../../drawing/levels.js";
import { link } from "../../drawing/links.js";
import { box, dot, line, measure, path, text } from "../../drawing/strokes.js";
import { agent, check, clock, documentIcon, person, ring } from "../../drawing/symbols.js";
import { across } from "../../framing/camera.js";
import { listIn, named, speaking } from "../../naming/lists.js";
import { NAME_GAP, nameText, wrapName } from "../../naming/names.js";
import { blockHeight } from "../../naming/parts.js";
import { RAIL_ROW, RAIL_WRAP, railNames } from "../../naming/placement.js";
import { rejectedName } from "../../naming/rejected.js";
import { P } from "../../palette.js";
import { L, en } from "../../timeline.js";
import { cue, cueFrom, cues } from "../../timing/cues.js";
import { clamp, ease, mix, ramp, soon } from "../../timing/easing.js";
import { drawShare, glide, glideTime } from "../../timing/pace.js";
import { voiceTime } from "../../timing/pauses.js";
import { stageIn, stageOut } from "../../timing/stages.js";
import { scenes } from "../registry.js";

/* The price on its own card. A value is a mark, so the card itself carries no name; a stage names it beside the card
 * where the words call it the price. */
function s10Card(x, y, { alpha = 1, w = 150, h = 56, border = P.ink, value = "101.37" } = {}) {
  if (alpha < 0.01) return;
  box(x - w / 2, y - h / 2, w, h, { fill: P.row, stroke: border, width: 2, alpha, radius: 6 });
  text(value, x, y + 1, 26, {
    role: "mark",
    align: "center",
    color: P.ink,
    alpha: alpha * clamp((w - 100) / 40),
  });
}
scenes["10"] = function (s, t) {
  const priceAt = cue(s, "同一个价格", "One price");
  // Each moment is cued on the first of its name's words.
  const at = cues(s, [
    ["在市场上成交", "a trade sets it"],
    ["供应商", "The vendor"],
    ["我们采集", "We collect"],
    ["入库", "write it into"],
    ["用它的人或系统", "becomes available"],
  ]);
  // The lookup's stage cuts on its thought's first words: the Chinese opens by repeating the term, which names the
  // stage's centre station, the English on "It is not". The history's stage cuts on the words that keep it: "Keep"
  // opens the English thought, and the Chinese names the history's first record first.
  const [term, keepCut] = cues(s, [
    ["可用时间", "availability time"],
    ["修订", "keep the history"],
  ]);
  const notAt = cueFrom(s, "可用时间", "It is not", term + 0.1);
  // 1. One price, five moments. The price lifts out of the previous scene's table on the words that name it, and its
  // name goes with it as it lands on a timeline; the table gives way over the card's flight, so the scene never opens
  // thin. The rail stands at the structure tier as the price lands, and on the words that count the five moments one
  // bracket stands over the stations, named by those words. As each moment is named the card moves on to its station,
  // the actor who stamps it stands in its own ring above, and its name joins one baseline between them. The last
  // moment takes its term under the card.
  const one = stageOut(t, notAt);
  if (one > 0) {
    const RAIL = 636,
      ICON = 426,
      R = 50,
      five = cue(s, "至少对应五个时刻", "at least five moments");
    // Each English name stands whole on one line, so the names stand on two baselines at the rail's one pitch: every other
    // name a row nearer its icon, within the height two lines of a name would take.
    const names = en
      ? [
          ["A trade in the market"],
          ["Published by the vendor"],
          ["We collect"],
          ["Written into the receiving system"],
          ["Available to people or systems"],
        ]
      : ["在市场上成交", "供应商发布", "我们采集", "入库", "用它的人或系统"];
    // The English names are long, so the last interval is wider, its two last names clear of each other across their two
    // baselines, and the rail is centred again within the safe area as the camera drifts; the moments of a timeline are
    // not like items, so one pitch need not hold.
    const xs = en ? [258, 558, 858, 1158, 1604] : [360, 660, 960, 1260, 1560];
    // The previous scene's source table, where it was left: it gives up one cell and leaves as the cell lifts.
    const tableOut = 1 - ramp(t, priceAt - 0.05, 0.8);
    if (tableOut > 0) {
      const [tx, ty, k] = across(s, t, 960, 285);
      tableIcon(tx - 120 * k, ty - 75 * k, 240 * k, 150 * k, { alpha: tableOut });
    }
    // The card flies from its cell in the table to the first station on the rail.
    const [cx0, cy0, k0] = across(s, t, 960, 303.75),
      flightWay = Math.hypot(xs[0] - cx0, RAIL - cy0);
    const flightTime = Math.min(
      glideTime(flightWay),
      voiceTime(at[0] - 0.3) - voiceTime(priceAt - 0.05),
    );
    // The way is long for the time the words leave it, so the card gathers pace over the flight's first fifth, flies on
    // at one even pace and slows over its last fifth: its pace peaks at 1.25 times its mean, not 1.5 as on a smoothstep.
    const cruise = (q) => {
      q = clamp(q);
      return q < 0.2 ? (q * q) / 0.32 : q > 0.8 ? 1 - ((1 - q) * (1 - q)) / 0.32 : (q - 0.1) / 0.8;
    };
    const flight = cruise((voiceTime(t) - voiceTime(priceAt - 0.05)) / flightTime);
    // The rail shows no direction, so it stands whole rather than drawing on. The card's name, flying under the card,
    // crosses the rail's line only left of the second station, so the rail from there on fades in as the card sets off
    // (and balances the card through its flight), and its first stretch, under the first station, fades in from the
    // card's last tenth of flight, when the name stands 16 px or more below the rail, over 0.4 s of voice time however
    // short the flight, so the stretch never inks in within a frame.
    const grouped = ramp(t, five + 0.1, 0.4),
      BY = ICON - R - 40;
    const lastTenth = voiceTime(priceAt - 0.05) + (1 - Math.sqrt(0.032)) * flightTime,
      first = ease((voiceTime(t) - lastTenth) / 0.4);
    if (flight > 0.35)
      line(xs[1] - 70, RAIL, xs[4] + 70, RAIL, {
        color: P.line,
        width: 2.5,
        alpha: ease((flight - 0.35) / 0.2),
      });
    if (first > 0)
      line(xs[0] - 70, RAIL, xs[1] - 70, RAIL, { color: P.line, width: 2.5, alpha: first });
    // The bracket spans the five moments' names as well as their marks, 16 px past the widest end name, symmetric about
    // the bracket's name.
    const endW = [names[0], names[4]].map((v) =>
      Math.max(...wrapName(v, RAIL_WRAP).map((line) => measure(line))),
    );
    const reach = Math.min(
      L(Infinity, 830),
      Math.max(xs[4] + 70 - 960, 960 - (xs[0] - endW[0] / 2 - 16), xs[4] + endW[1] / 2 + 16 - 960),
    );
    path(
      [
        [960 - reach, BY + 14],
        [960 - reach, BY],
        [960 + reach, BY],
        [960 + reach, BY + 14],
      ],
      { color: P.line, alpha: grouped, width: 2 },
    );
    nameText(L("五个时刻", "Five moments"), 960, BY - NAME_GAP, {
      valign: "bottom",
      alpha: grouped,
    });
    const icons = [
      (x, a) =>
        path(
          [
            [x - 38, ICON + 16],
            [x - 14, ICON - 2],
            [x + 4, ICON + 10],
            [x + 38, ICON - 20],
          ],
          { color: P.evidence, alpha: a, width: 3 },
        ),
      (x, a) => documentIcon(x - 26, ICON - 35, 52, 70, { alpha: a, rows: 3 }),
      (x, a) => {
        path(
          [
            [x - 32, ICON - 2],
            [x - 32, ICON + 24],
            [x + 32, ICON + 24],
            [x + 32, ICON - 2],
          ],
          { color: P.ink, alpha: a, width: 2.5 },
        );
        link(x, ICON - 32, x, ICON + 10, { color: P.ink, alpha: a });
      },
      (x, a) => tableIcon(x - 36, ICON - 26, 72, 52, { alpha: a, rows: 3, cols: 3 }),
      (x, a) => {
        person(x - 20, ICON + 4, { alpha: a, size: 0.8 });
        agent(x + 22, ICON, { alpha: a, size: 0.8 });
      },
    ];
    xs.forEach((x, i) => {
      ring(x, ICON, R, { color: P.line, alpha: ramp(t, at[i] - 0.15, 0.4), width: 2 });
      dot(x, RAIL, 12, { color: i === 4 ? P.evidence : P.ink, alpha: ramp(t, at[i] - 0.1, 0.4) });
      icons[i](x, ramp(t, at[i] - 0.15, 0.4));
      // The last moment stays lit from its words on: the next thought names it.
      const lit = i === 4 ? ramp(t, at[4] - 0.15, 0.3) : speaking(t, at, i);
      if (lit > 0)
        ring(x, ICON, R, { color: P.evidence, alpha: lit * restMark(P.evidence, 0.7), width: 2 });
    });
    if (en)
      xs.forEach((x, i) => {
        if (i % 2)
          line(x, RAIL - 18, x, RAIL - 28 - NAME_GAP - RAIL_ROW + 6, {
            alpha: ramp(t, at[i] - 0.15, 0.4),
            width: 2,
          });
      });
    railNames(names, xs, RAIL, {
      side: -1,
      gap: (i) => 28 + NAME_GAP + (en && i % 2 ? RAIL_ROW : 0),
      alpha: (i) => listIn(t, at, i),
      set: "moments",
    });
    nameText(
      L("可用时间", "Availability time"),
      xs[4],
      RAIL + 28 + NAME_GAP + blockHeight(1) + 10,
      { valign: "top", color: P.evidence, alpha: named(t, term) },
    );
    // The card: lifted from its cell, it lands on the first station and moves on with each moment. Its name follows
    // beneath it from the moment it clears the table, and each move from one moment to the next is a glide.
    let x = xs[0];
    for (let i = 1; i < 5; i++) x = mix(x, xs[i], glide(t, at[i] - 0.1, xs[i] - xs[i - 1]));
    const px = mix(cx0, x, flight),
      py = mix(cy0, RAIL, flight),
      ph = mix(37.5 * k0, 56, flight);
    s10Card(px, py, {
      alpha: ramp(t, priceAt - 0.25, 0.2),
      w: mix(80 * k0, 150, flight),
      h: ph,
      border: blend(P.ink, P.evidence, ramp(t, at[4] - 0.1, 0.5)),
    });
    // The card's name joins under it once the card has lifted clear of the table it leaves.
    nameText(L("同一个价格", "One price"), px, py + ph / 2 + NAME_GAP, {
      valign: "top",
      alpha: named(t, priceAt + 0.2) * ramp(flight, 0.04, 0.4),
    });
  }
  // 2. It is not when you look it up today. One rail carries three times: then, availability and today. Above each a
  // slot shows what a lookup at that time finds: the value is there from its availability on, a lookup today finds it,
  // and a lookup then finds an empty slot. The time you look it up today is refused as the availability time.
  const two = stageIn(t, notAt) * stageOut(t, keepCut);
  if (two > 0) {
    const RAIL = 590,
      SLOT = 400,
      xs = [500, 840, 1400];
    // The time you look it up today arrives as its refusal begins ("不是你今天…", "when you look…").
    const [nowAt, foundAt, thenAt] = cues(s, [
      ["不是你今天", "when you look"],
      ["今天拿得到", "available now"],
      ["当时", "available then"],
    ]);
    line(xs[0] - 160, RAIL, xs[2] + 200, RAIL, { color: P.line, width: 2.5, alpha: two });
    box(xs[0] - 75, SLOT - 28, 150, 56, {
      stroke: P.unknown,
      alpha: two * ramp(t, thenAt, 0.3),
      radius: 6,
      dash: [6, 6],
    });
    // Availability: the value stands in its slot from this time on, and the span to today keeps it.
    dot(xs[1], RAIL, 12, { color: P.evidence, alpha: two });
    ring(xs[1], RAIL, 22, { color: P.evidence, alpha: two, width: 2 });
    link(xs[1], RAIL - 12, xs[1], SLOT + 28, { color: P.evidence, alpha: two, end: false });
    s10Card(xs[1], SLOT, { alpha: two, border: P.evidence });
    link(xs[1] + 75, SLOT, xs[2] - 75, SLOT, {
      color: P.evidence,
      alpha: two,
      draw: { t, at: foundAt - 0.05 },
      end: false,
    });
    // Today: a lookup finds the value.
    dot(xs[2], RAIL, 10, { color: P.ink, alpha: two * named(t, nowAt) });
    link(xs[2], RAIL - 10, xs[2], SLOT + 28, {
      color: P.ink,
      alpha: two,
      draw: { t, at: foundAt - 0.1 },
      end: false,
    });
    s10Card(xs[2], SLOT, { alpha: two * ramp(t, foundAt + 0.2, 0.4) });
    // Then: the same lookup finds an empty slot.
    dot(xs[0], RAIL, 10, { color: P.unknown, alpha: two * named(t, thenAt) });
    link(xs[0], RAIL - 10, xs[0], SLOT + 28, {
      color: P.unknown,
      alpha: two,
      upto: drawShare(t, thenAt - 0.15, Math.abs(SLOT + 28 - (RAIL - 10)), 0.45),
      end: false,
      dash: [6, 6],
    });
    text("?", xs[0], SLOT + 1, 26, {
      role: "mark",
      align: "center",
      color: P.unknown,
      alpha: two * ramp(t, thenAt, 0.3),
    });
    const y = RAIL + 28 + NAME_GAP;
    nameText(L("当时", "Then"), xs[0], y, { valign: "top", alpha: two * named(t, thenAt) });
    nameText(L("可用时间", "Availability time"), xs[1], y, {
      valign: "top",
      color: P.evidence,
      alpha: two,
    });
    rejectedName(L("你今天查到它的时间", "When you look it up today"), xs[2], y, {
      valign: "top",
      width: 360,
      alpha: two * named(t, nowAt),
      mark: ramp(t, nowAt + 0.6, 0.4),
    });
  }
  // 3. Keep the history. The stage cuts on the words that keep it, with the history's name over the line its records
  // stand on; each record (revisions, backfills, derivations) arrives on the line with its clock and name on its own
  // words. A bracket gathers the records and one link carries them down to the current value, which the history now
  // explains: where it came from and when it first became available.
  const three = stageIn(t, keepCut);
  if (three > 0) {
    const RY = 480,
      xs = [640, 960, 1280],
      VY = 730,
      BY = RY + 104;
    const kinds = cues(s, [
      ["修订", "revisions"],
      ["回补", "backfills"],
      ["加工", "derivations"],
    ]);
    const [histAt, valueAt] = cues(s, [
      ["历史都要留着", "Keep the history"],
      ["当前这个值", "explain the current value"],
    ]);
    const answers = en
      ? [["When it became available"], [cue(s, "", "when it became available")]]
      : [
          ["从哪来", "最早什么时候能拿到"],
          cues(s, [
            ["从哪来", ""],
            ["最早什么时候能拿到", ""],
          ]),
        ];
    const names = en ? ["Revisions", "Backfills", "Derivations"] : ["修订", "回补", "加工"];
    // The history's line stands from the cut. The Chinese names the history in the clause after its three records, so
    // its name stands from the first words of that clause.
    const drawn = drawShare(t, keepCut + 0.05, 1600 - 320);
    line(320, RY, mix(320, 1600, drawn), RY, { color: P.line, width: 3.5, alpha: three });
    line(320, RY - 14, 320, RY + 14, { color: P.line, width: 3.5, alpha: three });
    line(1600, RY - 14, 1600, RY + 14, {
      color: P.line,
      width: 3.5,
      alpha: three * ramp(t, keepCut + 0.55, 0.3),
    });
    const histShown = en ? histAt : cue(s, "这些历史", "");
    nameText(L("历史都要留着", "Keep the history"), 960, RY - 70 - NAME_GAP, {
      valign: "bottom",
      alpha: three * named(t, histShown),
    });
    xs.forEach((x, i) => {
      const kept = ramp(t, kinds[i] - 0.1, 0.4),
        lit = speaking(t, kinds, i);
      dot(x, RY, 12, { color: P.ink, alpha: three * kept });
      clock(x, RY - 44, 17, { hand: 0.15 + i * 0.2, color: P.muted, alpha: three * kept });
      if (lit > 0)
        ring(x, RY, 22, {
          color: P.evidence,
          alpha: three * lit * restMark(P.evidence, 0.6),
          width: 2,
        });
    });
    // The records' names hang 12 px clear of the ring that lights round the record being said.
    railNames(names, xs, RY, {
      gap: 22 + 12,
      alpha: (i) => three * listIn(t, kinds, i),
      set: "history",
    });
    // The bracket gathers the records and carries them down to the current value.
    const gather = soon(t, valueAt - 0.1, 0.6);
    path(
      [
        [xs[0] - 90, BY - 14],
        [xs[0] - 90, BY],
        [xs[2] + 90, BY],
        [xs[2] + 90, BY - 14],
      ],
      { color: P.line, alpha: three * gather, width: 2 },
    );
    link(960, BY, 960, VY - 32 - 12, { alpha: three, upto: gather });
    s10Card(960, VY, {
      alpha: three * ramp(t, valueAt - 0.1, 0.4),
      w: 180,
      h: 64,
      border: P.evidence,
    });
    nameText(L("当前这个值", "Explain the current value"), 960 - 90 - NAME_GAP, VY, {
      align: "right",
      alpha: three * named(t, valueAt),
    });
    answers[0].forEach((v, i) => {
      const y = VY + (i - (answers[0].length - 1) / 2) * 44;
      check(960 + 90 + 40, y, 24, { alpha: three * ramp(t, answers[1][i] - 0.1, 0.4) });
      nameText(v, 960 + 90 + 70, y, {
        align: "left",
        alpha: three * listIn(t, answers[1], i),
        set: "answers",
      });
    });
  }
};
/* The price lifts out of the previous scene's table, so scene 10 changes on its first word. */
scenes["10"].carries = true;

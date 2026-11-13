/* 15 deliver: the chain of trust cannot skip a link. The scene: its cues and the cuts between its stages, each stage on
 * the words that name it. */

import { ctx } from "../../canvas.js";
import { since } from "../../drawing/flows.js";
import { restMark } from "../../drawing/levels.js";
import { link } from "../../drawing/links.js";
import { box, dot, labelSize, line, measure, path, stroke } from "../../drawing/strokes.js";
import { check, documentIcon, person, ring } from "../../drawing/symbols.js";
import { clearOfTitle, opening } from "../../framing/chapters.js";
import { listIn, named, speaking } from "../../naming/lists.js";
import { NAME_GAP, nameText } from "../../naming/names.js";
import { RAIL_ROW, radialName, railNames } from "../../naming/placement.js";
import { rejectedName } from "../../naming/rejected.js";
import { termRow } from "../../naming/terms.js";
import { LABEL, P } from "../../palette.js";
import { L, en } from "../../timeline.js";
import { cue, cueFrom, cues } from "../../timing/cues.js";
import { clamp, mix, ramp, soon } from "../../timing/easing.js";
import { glide } from "../../timing/pace.js";
import { thoughtEnd } from "../../timing/pauses.js";
import { stageIn, stageOut } from "../../timing/stages.js";
import { scenes } from "../registry.js";

scenes["15"] = function (s, t) {
  const [commitment, owner, condition, chain] = cues(s, [
    ["承诺", "the commitment"],
    ["负责人", "owner"],
    ["完成条件摆到明面上", "completion condition visible"],
    ["是一条信任链", "is a chain of trust"],
  ]);
  // The six links of the chain, each on the clause that describes it.
  const links = cues(s, [
    ["先明确决策负责人是谁", "name the decision owner"],
    ["答应交什么", "agree on the deliverable"],
    ["只在范围里动手", "act only within it"],
    ["拿出当前的证据", "produce current evidence"],
    ["只说证据撑得住的话", "claim only what it supports"],
    ["最后验收", "then accept and learn"],
  ]);
  // The Chinese says the chain cannot lose a link: the skip starts on the chain's words and stops on that rule.
  const [lighter, skip, before] = cues(s, [
    ["手续可以随风险变轻", "lower risk allows less process"],
    ["这条链", "cannot skip a link"],
    ["改动之前", "before changing anything"],
  ]);
  const checks = cues(s, [
    ["改的是哪个对象", "target"],
    ["哪个版本", "version"],
    ["在哪个环境", "environment"],
    ["现状如何", "current state"],
    ["有没有并行的工作", "concurrent work"],
    ["怎么恢复", "recovery path"],
  ]);
  const [scope, record] = cues(s, [
    ["范围或风险有了实质变化", "if scope or risk changes"],
    ["记进现有的工作记录", "existing work record"],
  ]);
  // The decision owner was first named in the chain of trust; here it is the one the change returns to.
  const decider = cueFrom(s, "决策负责人", "the decision owner", scope);
  const base = ramp(t, opening(s), 0.7);
  // 1. Before acting, three things are made visible: the commitment, the owner and the completion condition. The scene
  // opens on these words, under the chapter's rising title: the action stands on the right behind a closed bar from the
  // words that put it after them. The three build one row of stations on the left, each station with its mark on its
  // own words, and the one being named lights its station; on the words that make them visible the bar lifts and the
  // way runs on to the action. The row holds until the chain of trust is named and leaves in one cut.
  const [acting, visibleAt] = cues(s, [
    ["动手之前", "before acting"],
    ["摆到明面上", "visible"],
  ]);
  const seats = clearOfTitle(s, t, 375) * base * stageOut(t, chain);
  if (seats > 0) {
    const xs = [460, 780, 1100],
      y = 440,
      sy = 566,
      AX = 1540,
      BX = 1320,
      at = [commitment, owner, condition],
      q = (i) => ramp(t, at[i] - 0.1, 0.45) * seats;
    // The bar lifts within its thought, so it is still before the quiet that follows the words that lift it.
    const open = soon(t, visibleAt + 0.05, Math.min(0.5, thoughtEnd(visibleAt) - visibleAt - 0.1));
    const act = seats * ramp(t, acting - 0.45, 0.45);
    ring(AX, y, 54, { color: P.ink, alpha: act, width: 3 });
    path(
      [
        [AX - 14, y - 24],
        [AX + 26, y],
        [AX - 14, y + 24],
        [AX - 14, y - 24],
      ],
      { color: P.ink, alpha: act, width: 3 },
    );
    nameText(L("动手", "Acting"), AX, sy + 17 + NAME_GAP, {
      valign: "top",
      alpha: seats * named(t, acting),
    });
    line(BX, y - 56, BX, y + 56, { color: P.unknown, alpha: act * (1 - open), width: 4 });
    link(xs[2] + 70, y, AX - 66, y, {
      alpha: seats * ramp(t, visibleAt + 0.05, 0.3),
      draw: { t, at: visibleAt + 0.05 },
      flowing: since(t, visibleAt + 0.75),
    });
    documentIcon(xs[0] - 50, y - 65, 100, 130, { alpha: q(0), rows: 3 });
    dot(xs[0] + 28, y + 36, 13, { color: P.authority, alpha: q(0) });
    person(xs[1], y + 10, { alpha: q(1), color: P.authority, size: 1.5 });
    box(xs[2] - 55, y - 55, 110, 110, { fill: P.row, stroke: P.evidence, alpha: q(2), radius: 10 });
    check(xs[2], y + 4, 48, { alpha: q(2), upto: clamp((t - condition - 0.1) / 0.35) });
    xs.forEach((x, i) => {
      dot(x, sy, 9, { color: i === 1 ? P.authority : P.evidence, alpha: q(i) });
      const lit = speaking(t, at, i);
      if (lit > 0)
        ring(x, sy, 17, {
          color: i === 1 ? P.authority : P.evidence,
          alpha: lit * restMark(i === 1 ? P.authority : P.evidence, 0.5) * seats,
          width: 2,
        });
    });
    railNames(
      en ? ["Commitment", "Owner", "Completion condition"] : ["承诺", "负责人", "完成条件"],
      xs,
      sy,
      { gap: 17 + NAME_GAP, wrap: 320, alpha: (i) => seats * listIn(t, at, i), set: "visible" },
    );
  }
  // 2. The chain of trust: six links on one rail, each overlapping the next, so the order and the joining are carried
  // by the layout. The rail stands whole from the cut, on the words that name the chain, with the chain's name at its
  // start edge: grown from one end it would stand off centre while it builds, and grown from its middle it would wait
  // for that name; so the chain's span, under its name, carries the stage until its first link is described; each
  // link closes round the rail in its colour on its own clause, named under it on those words, the link being described
  // lit, and the names build into the whole set below.
  // 3. Lower risk allows less process: the links slim down but all six stay. The chain cannot skip a link (in Chinese,
  // cannot lose one): a way leaves the action within the scope over the evidence toward the claim and stops at a bar
  // above the evidence, with the refused words beside it. The chain holds until the checks before a change are named
  // and leaves in one cut.
  const ch = base * stageIn(t, chain) * stageOut(t, before);
  if (ch > 0) {
    // Each link is named by the key phrase of its clause; a clause that is its own key phrase is named without its
    // caption's whole words: the English action by the scope its pronoun stands for, as the Chinese names it, and the
    // English claim as the claims the evidence beside it supports;
    // the Chinese claim without its last 话, still read as what is said, not as "if"; the Chinese deliverable with the
    // scope agreed with it. The names stand whole, each on one line, on two baselines at the links' one pitch, in both
    // editions.
    const names = en
      ? [
          ["Decision owner and subject"],
          ["Deliverable and its scope"],
          ["Act only within scope"],
          ["Current evidence"],
          ["Only supported claims"],
          ["Accept and learn"],
        ]
      : [
          ["决策负责人、针对什么"],
          ["答应交什么、范围到哪"],
          ["只在范围里"],
          ["当前的证据"],
          ["只说证据撑得住的"],
          ["验收、总结"],
        ];
    const pitch = L(272, 254),
      Y = 500,
      H = 92,
      xs = names.map((_, i) => L(280, 325) + i * pitch),
      W = pitch + 26;
    const thin = soon(t, lighter + 0.05, 1.1),
      h = mix(H, 62, thin),
      sw = mix(4, 2.5, thin);
    const railQ = ch * named(t, chain);
    dot(xs[0] - W / 2, Y, 6, { color: P.muted, alpha: railQ });
    link(xs[0] - W / 2, Y, xs[5] + W / 2, Y, { color: P.muted, alpha: railQ, width: 3 });
    // A link whose name stands a row lower carries a stem down to it, one stroke with the link, one mark.
    names.forEach((_, i) => {
      const x = xs[i],
        q = ramp(t, links[i] - 0.1, 0.45) * ch,
        lit = speaking(t, links, i),
        color = i === 5 ? P.authority : P.evidence;
      stroke(
        () => {
          ctx.roundRect(x - W / 2, Y - h / 2, W, h, h / 2);
          if (i % 2) {
            ctx.moveTo(x, Y + h / 2);
            ctx.lineTo(x, Y + H / 2 + NAME_GAP + RAIL_ROW - 6);
          }
        },
        { color, alpha: q, width: sw + 1.5 * lit },
      );
    });
    railNames(names, xs, Y + H / 2, {
      gap: (i) => NAME_GAP + (i % 2 ? RAIL_ROW : 0),
      alpha: (i) => ch * listIn(t, links, i),
      set: "chain",
    });
    // The chain is named at its start edge; how light its process may be joins the name as its qualifier.
    termRow(
      t,
      [L("信任链", "Chain of trust")],
      [chain],
      [L("手续可以随风险变轻", "Lower risk allows less process")],
      [lighter],
      xs[0] - W / 2,
      Y - H / 2 - NAME_GAP - labelSize(LABEL),
      { width: 900, alpha: ch, color: P.evidence },
    );
    // The skip: up from the action, across toward the claim, stopped at a bar above the evidence.
    const top = Y - h / 2 - 12,
      mid = Y - 168,
      skipWords = cue(s, "一环都不能少", "skip a link"),
      stopAt = skipWords + 0.05;
    const run = (top - mid) * 2 + (xs[4] - xs[2]),
      stop = (top - mid + (xs[3] - xs[2]) - 12) / run;
    link(xs[2], top, xs[4], top, {
      route: "vhv",
      mid,
      color: P.unknown,
      alpha: ch * ramp(t, skip - 0.05, 0.3),
      upto: stop,
      draw: { t, at: skip - 0.05, least: stopAt - skip + 0.05 },
      end: false,
      dash: [8, 8],
      width: 2.5,
    });
    line(xs[3], mid - 24, xs[3], mid + 24, {
      color: P.unknown,
      alpha: ramp(t, stopAt, 0.25) * ch,
      width: 4,
    });
    // The English refuses the skip by name; the Chinese names the rule the bar keeps, that no link may be missing.
    if (en)
      rejectedName("Skip a link", xs[3], mid - 24 - NAME_GAP, {
        valign: "bottom",
        alpha: ch * named(t, skipWords),
        mark: ramp(t, stopAt, 0.25),
      });
    else
      nameText("一环都不能少", xs[3], mid - 24 - NAME_GAP, {
        valign: "bottom",
        alpha: ch * named(t, skipWords),
      });
  }
  // 4a. Before changing anything, six facts are checked around the change: one ring stands about the change from the
  // words that name it, and each fact takes its mark on the ring and is checked on its own words; the one being named
  // lights its mark, and the names build into the whole set. The ring holds until scope or risk changes and leaves in
  // one cut. While the facts named on the ring's right stand without those on its left, the ring stands left of the
  // centre by as much as balances them, easing there on the first of them and back on the first on its left.
  const lean = L(56, 81),
    cx = 960 - lean * (glide(t, checks[1] - 0.1, lean) - glide(t, checks[4] - 0.1, lean));
  const four = base * stageIn(t, before) * stageOut(t, scope);
  if (four > 0) {
    const cy = 500,
      rx = 400,
      ry = 250;
    const names = en
      ? ["Target", "Version", "Environment", "Current state", "Concurrent work", "Recovery path"]
      : ["哪个对象", "哪个版本", "哪个环境", "现状如何", "并行的工作", "怎么恢复"];
    // The ring stands firm from the words that name the change, as six arcs that leave room for each fact's mark.
    stroke(
      () =>
        [0, 1, 2, 3, 4, 5].forEach((i) => {
          const a0 = -Math.PI / 2 + (i * Math.PI) / 3 + 0.09,
            a1 = a0 + Math.PI / 3 - 0.18;
          Array.from({ length: 17 }, (_, k) => a0 + ((a1 - a0) * k) / 16).forEach((a, k) =>
            (k ? ctx.lineTo : ctx.moveTo).call(ctx, cx + Math.cos(a) * rx, cy + Math.sin(a) * ry),
          );
        }),
      { color: P.muted, alpha: four, width: 3 },
    );
    // The change at the centre, a delta, named on its words.
    path(
      [
        [cx, cy - 62],
        [cx + 58, cy + 38],
        [cx - 58, cy + 38],
        [cx, cy - 62],
        [cx + 58, cy + 38],
      ],
      { color: P.ink, alpha: four, width: 3 },
    );
    nameText(L("改动之前", "Before changing anything"), cx, cy + 38 + NAME_GAP, {
      valign: "top",
      alpha: four * named(t, before),
    });
    checks.forEach((at, i) => {
      const a = -Math.PI / 2 + (i * Math.PI) / 3,
        x = cx + Math.cos(a) * rx,
        y = cy + Math.sin(a) * ry,
        q = ramp(t, at - 0.1, 0.4) * four;
      const lit = speaking(t, checks, i);
      dot(x, y, 17, { color: P.ground, alpha: q });
      dot(x, y, 17, { color: P.evidence, alpha: q, hollow: true, width: 3 });
      check(x, y + 1, 18, { alpha: q, upto: clamp((t - at) / 0.3) });
      if (lit > 0)
        ring(x, y, 26, {
          color: P.evidence,
          alpha: lit * restMark(P.evidence, 0.5) * four,
          width: 2,
        });
      radialName(names[i], cx, cy, rx + 17, a, {
        ry: ry + 17,
        alpha: four * listIn(t, checks, i),
        set: "checks",
      });
    });
  }
  // 5. A material change of scope or risk goes back to the decision owner. The change stands inside the
  // frame of its scope from the first words, at the centre, and the frame visibly widens on the words that say the
  // change is material.
  // A link rises from the change to its owner, who stands over it, high enough that the two stand as one tall stage, from
  // the first words of the clause that returns to it, a point travelling the link. The change and the decision are then
  // written into the work record that already exists: the record stands with its earlier entries on the words that
  // begin the writing, the change runs straight across to it and the decision comes down from the owner, each writing
  // its own row, and the record is named on its words.
  const five = base * stageIn(t, scope);
  if (five > 0) {
    const back = cue(s, "回头找", "return to"),
      changed = cueFrom(s, "变化", "the change", decider),
      decided = cueFrom(s, "决定", "decision", changed);
    const ownerAt = cue(s, "就回头找", "return to");
    // The change and then its owner stand centred while the record is still to come. The record stands close enough to
    // the change that the stage, from the change's widened frame to the rows' names beside the record, ends centred in
    // each edition, and the owner stands midway between the change and the record, at the middle of the bracket its two
    // links make: on the words that begin the writing the change glides left into that stage, the record entering beside
    // it, and the owner takes its place over the bracket.
    const writing = cue(s, "把变化", "record the change");
    const DX = 740,
      dy = 590,
      oy = 300,
      ry = 515,
      rw = 120,
      rh = 150,
      under = dy + 110 + NAME_GAP;
    const RX =
      1920 -
      (DX - 130) -
      rw -
      NAME_GAP -
      Math.max(...(en ? ["Change", "Decision"] : ["变化", "决定"]).map((v) => measure(v)));
    const apart = glide(t, writing + 0.05, 960 - DX),
      dx = mix(960, DX, apart),
      rx = RX + dx - DX,
      ox = mix(960, (DX + RX + rw / 2) / 2, apart);
    // The scope's frame stands firm around the change and widens on "materially"; it stays a card-sized frame.
    const widen = soon(t, cue(s, "实质变化", "changes materially") + 0.05, 0.6),
      fw = mix(210, 260, widen),
      fh = mix(180, 216, widen);
    box(dx - fw / 2, dy - fh / 2, fw, fh, { stroke: P.muted, alpha: five, radius: 14, width: 3 });
    path(
      [
        [dx, dy - 50],
        [dx + 50, dy + 36],
        [dx - 50, dy + 36],
        [dx, dy - 50],
        [dx + 50, dy + 36],
      ],
      { color: P.unknown, alpha: five, width: 3 },
    );
    nameText(en ? "Material change of scope or risk" : ["范围或风险", "有了实质变化"], dx, under, {
      valign: "top",
      width: 360,
      alpha: five * named(t, scope),
    });
    const own = ramp(t, ownerAt - 0.1, 0.45) * five;
    person(ox, oy, { alpha: own, color: P.authority, size: 1.5 });
    nameText(L("决策负责人", "Decision owner"), ox, oy - 52 - NAME_GAP, {
      valign: "bottom",
      color: P.authority,
      alpha: five * named(t, ownerAt),
    });
    // Over the change the link rises straight to the owner's feet; as the two part it turns to the owner's side.
    link(dx, dy - fh / 2 - 12, ox - 44 * apart, mix(oy + 46, oy, apart), {
      route: "vh",
      color: P.authority,
      alpha: five,
      width: 2.5,
      draw: { t, at: back - 0.05 },
      flowing: since(t, back + 0.85),
      span: Math.abs((DX + RX + rw / 2) / 2 - 44 - DX) + (dy - 216 / 2 - 12 - oy),
    });
    // The existing record: a document at full ink from the words that begin the writing, its earlier entries ruled as
    // one stroke over the rows to be written, named on its own words; its two rows are written on their words.
    const kept = named(t, record),
      held = five * named(t, writing);
    documentIcon(rx, ry, rw, rh, { alpha: held, rows: 0 });
    stroke(
      () =>
        [
          [30, 0.62],
          [50, 0.42],
        ].forEach(([d, w]) => {
          ctx.moveTo(rx + 18, ry + d);
          ctx.lineTo(rx + 18 + rw * w, ry + d);
        }),
      { color: P.muted, alpha: held * 0.8, width: 2 },
    );
    // The record is named on the change's line, whole on one line centred under the record, clear below the rows' names.
    nameText(L("现有的工作记录", "Existing work record"), rx + rw / 2, under, {
      valign: "top",
      alpha: five * kept,
    });
    const rows = [
      [dy, P.ink, changed],
      [dy + 48, P.authority, decided],
    ];
    link(dx + fw / 2 + 12, dy, rx - 14, dy, { alpha: five, draw: { t, at: changed - 0.05 } });
    link(ox + 44, oy, rx + rw / 2, ry - 12, {
      route: "hv",
      color: P.authority,
      alpha: five,
      width: 2.5,
      draw: { t, at: decided - 0.05 },
    });
    // Each written row is named beside the record on its own word: a list of two that builds and stays, its current row lit.
    const recAts = [changed, decided];
    rows.forEach(([y, color, at], i) => {
      const lit = speaking(t, recAts, i);
      line(rx + 18, y, mix(rx + 18, rx + rw - 22, clamp((t - at - 0.6) / 0.4)), y, {
        color,
        alpha: five * ramp(t, at + 0.55, 0.2),
        width: 3 + 1.5 * lit,
      });
      nameText(en ? ["Change", "Decision"][i] : ["变化", "决定"][i], rx + rw + NAME_GAP, y, {
        align: "left",
        color: i ? P.authority : P.ink,
        alpha: five * listIn(t, recAts, i),
        set: "recorded",
      });
    });
  }
};

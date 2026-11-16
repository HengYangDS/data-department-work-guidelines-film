/* 23 communicate: answer first, then explain. The scene: its cues and the cuts between its stages, each stage on the
 * words that name it. */

import { ctx } from "../../canvas.js";
import { since } from "../../drawing/flows.js";
import { restMark } from "../../drawing/levels.js";
import { link } from "../../drawing/links.js";
import { s23Page } from "../../drawing/pages.js";
import { box, dot, labelSize, line, measure, stroke, text } from "../../drawing/strokes.js";
import { check, documentIcon, person, ring } from "../../drawing/symbols.js";
import { opening } from "../../framing/chapters.js";
import { listIn, listLevel, named, speaking } from "../../naming/lists.js";
import { NAME_GAP, nameText } from "../../naming/names.js";
import { CONTENT_CY, radialName, railNames } from "../../naming/placement.js";
import { NOTE, termRow, termRowLayout } from "../../naming/terms.js";
import { LABEL, P } from "../../palette.js";
import { L, en } from "../../timeline.js";
import { cue, cues } from "../../timing/cues.js";
import { mix, ramp, soon } from "../../timing/easing.js";
import { drawShare, drawTime, glide, glideYield, ride } from "../../timing/pace.js";
import { pauseHold } from "../../timing/pauses.js";
import { STAGE_CUT, stageIn, stageOut } from "../../timing/stages.js";
import { scenes } from "../registry.js";

scenes["23"] = function (s, t) {
  const [work, comm, become, others, answers, notYet, process] = cues(s, [
    ["工作的成果", "results"],
    ["沟通", "communication"],
    ["变成", "become"],
    ["别人", "others can act"],
    ["回答", "answer the reader"],
    ["别急着", "before"],
    ["从头讲过程", "recounting the whole process"],
  ]);
  const [purpose, update] = cues(s, [
    ["这次交流的目的", "name the purpose"],
    ["重要的汇报", "important update"],
  ]);
  const base = ramp(t, opening(s), 0.7),
    RY = 470;
  // 1. Through communication, results become something others can act on: the result, the channel and the reader stand as
  // three stations on one rail, each arriving on its own words; the way between them draws on when the result becomes
  // action, and one point then travels it from the result to the reader. The reader stands as the result becomes action,
  // just before the words name them. Each edition opens on what it names first, which stands from the first words, so
  // the chapter opens on it. The Chinese names the result alone first: it
  // stands centred until the channel is named, the two then stand centred as a pair, and on the words that make the
  // result action they move to their stations. The English names the channel first and the result just before it
  // becomes action, so there each stands at its station from its words, the channel alone at the centre.
  const one = base * stageOut(t, answers);
  if (one > 0) {
    const names = en
      ? ["Results", "Communication", "What others can act on"]
      : ["工作的成果", "沟通", "别人能接着做的事"];
    const centred = 960 - (460 - 60 + 960 + Math.max(42, measure(names[1]) / 2)) / 2,
      settle = 1 - glide(t, become + 0.05, Math.abs(centred));
    // The Chinese result moves from the centre to its place in the pair on the channel's word and on to its station
    // on the words that make it action. Those words follow within half a second, before the first move could end, so
    // the two are one ride through the pair's place to the station, at the glide's pace.
    const result = en ? 460 : ride(t, 960, [460 + centred, 460], [comm + 0.05, become + 0.05]);
    // The Chinese channel arrives at its place in the centred pair and stays there until the stations; only the result
    // moves. The first of each edition stands from the opening.
    const xs = [result, 960 + L(centred, 0) * settle, 1460],
      at = [work, comm, others],
      first = L(0, 1);
    const seen = (i) =>
      (i === first ? 1 : ramp(t, (i === 2 ? Math.min(at[i], become + 0.05) : at[i]) - 0.15, 0.4)) *
      one;
    const go = { t, at: become - 0.05 };
    link(xs[0] + 76, RY, xs[2] - 60, RY, {
      color: P.evidence,
      alpha: one * ramp(t, become - 0.05, 0.3),
      draw: go,
      width: 2.5,
      flowing: since(t, become + 0.9),
    });
    // The result's page, a station of the rail.
    documentIcon(xs[0] - 60, RY - 75, 120, 150, { alpha: seen(0), rows: 4 });
    // The channel sits on the way, its disc covering the way where they meet; both editions name it before the result
    // becomes action, so the way then draws on beneath it.
    dot(xs[1], RY, 40, { color: P.ground, alpha: seen(1) });
    dot(xs[1], RY, 40, {
      color: P.evidence,
      alpha: seen(1),
      hollow: true,
      width: 3,
    });
    dot(xs[1], RY, 12, { color: P.evidence, alpha: seen(1) });
    person(xs[2], RY + 4, { alpha: seen(2), size: 2 });
    // Each name stands whole on one line, so it keeps one layout while the stations glide apart.
    railNames(
      names.map((v) => [v]),
      xs,
      RY + 75,
      { gap: NAME_GAP, wrap: 340, alpha: (i) => one * named(t, at[i]) },
    );
  }
  // 2. So answer the reader's actual need before recounting the whole process: the answer is one card next
  // to the reader, a tick and its two lines, and it reaches the reader on its words; the whole process waits beneath it
  // as a long tape that unrolls on its words. The reader and the answer stand as one group about the centre, and on the
  // words that hold the process back they move left, so the group and the process's name beside its tape are centred.
  const two = base * stageIn(t, answers) * stageOut(t, purpose);
  if (two > 0) {
    // The reader's figure reaches 62.5 px left of its axis at this size; the card and the tape end at x 1300.
    const later = L("别急着从头讲过程", "The whole process"),
      left = 540 - 62.5;
    const sh = mix(
      960 - (left + 1300) / 2,
      960 - (left + 1300 + NAME_GAP + measure(later)) / 2,
      glide(t, notYet + 0.05, (NAME_GAP + measure(later)) / 2),
    );
    const px = 540 + sh,
      ax = 700 + sh,
      aw = 600,
      ah = 220,
      ty = RY + 250,
      tx0 = 620 + sh,
      tx1 = 1300 + sh,
      ans = ramp(t, answers - 0.1, 0.4) * two;
    person(px, RY + 4, { alpha: two, size: 2.6 });
    box(ax, RY - ah / 2, aw, ah, {
      fill: P.row,
      stroke: P.evidence,
      alpha: ans,
      radius: 14,
      width: 2.5,
    });
    check(ax + 74, RY, 60, { alpha: ans * ramp(t, answers + 0.2, 0.4) });
    stroke(
      () =>
        [
          [RY - 56, aw - 210],
          [RY, aw - 250],
          [RY + 56, aw - 300],
        ].forEach(([y, w]) => {
          ctx.moveTo(ax + 150, y);
          ctx.lineTo(ax + 150 + w, y);
        }),
      { color: P.ink, alpha: ans * 0.85, width: 5 },
    );
    // The answer reaches the reader, and goes on reaching them while the stage stands. While the group glides left to
    // make the process room, the flow, which runs the same way, gives its pace up to the glide's.
    const reach = soon(t, answers + 0.1, 0.5),
      reaching = since(t, answers + 0.6);
    link(ax - 14, RY, px + 72, RY, {
      color: P.evidence,
      alpha: ans,
      upto: reach,
      width: 2.5,
      flowing:
        reaching === null
          ? null
          : reaching - glideYield(t, notYet + 0.05, (NAME_GAP + measure(later)) / 2),
    });
    nameText(
      L("回答对方真正需要的", "Answer the reader's actual need"),
      ax + aw / 2,
      RY + ah / 2 + NAME_GAP,
      { valign: "top", width: 440, color: P.evidence, alpha: two * named(t, answers) },
    );
    // The process unrolls as a tape on its words and waits there; the unrolling advances in voice time, so a tape still
    // unrolling when the thought ends rests in the quiet and finishes on the next words.
    const tape = drawShare(t, process - 0.1, tx1 - tx0, 1.2),
      ta = ramp(t, process - 0.15, 0.4) * two,
      x1 = mix(tx0, tx1, tape);
    if (tape > 0) {
      box(tx0, ty - 30, x1 - tx0, 60, { fill: P.row, stroke: P.muted, alpha: ta, radius: 8 });
      // The tape's steps, one ruled strip, ink in once the tape has unrolled, so the strip never lengthens in steps and
      // no step appears at once.
      stroke(
        () => {
          for (let x = tx0 + 24; x < tx1 - 12; x += 28) {
            ctx.moveTo(x, ty - 12);
            ctx.lineTo(x, ty + 12);
          }
        },
        {
          color: P.muted,
          alpha: ta * 0.7 * ramp(t, process - 0.1 + drawTime(tx1 - tx0, 1.2), 0.45),
          width: 2,
        },
      );
    }
    nameText(later, tx1 + NAME_GAP, ty, {
      align: "left",
      color: P.muted,
      alpha: two * named(t, notYet),
    });
  }
  // 3. Name the purpose first: a selector stands on one arc from the purpose's words; each kind of exchange takes its
  // setting on the arc as it is named and the needle turns to it, so the settings build into the whole set. The arc is
  // the selector's whole range, so it stands firm from the start. The selector is centred on its finished extent, from
  // its first setting's name to its last's, whose English names run longer on the left.
  const purposes = cues(s, [
    ["同步", "synchronize"],
    ["讨论", "discuss"],
    ["决定", "decide"],
    ["上报", "escalate"],
    ["复盘", "review"],
  ]);
  const three = base * stageIn(t, purpose) * stageOut(t, update);
  if (three > 0) {
    const r = 320,
      angles = [-162, -126, -90, -54, -18].map((a) => (a * Math.PI) / 180);
    const names = en
      ? ["Synchronize", "Discuss", "Decide", "Escalate", "Review"]
      : ["同步", "讨论", "决定", "上报", "复盘"];
    // Each name's extent as radialName sets it about a hub at x 960.
    const spans = angles.map((g, i) => {
      const c = Math.cos(g),
        x = 960 + c * (r + 12 + NAME_GAP),
        w = measure(names[i]);
      return c > 0.3 ? [x, x + w] : c < -0.3 ? [x - w, x] : [x - w / 2, x + w / 2];
    });
    // While the settings on its left stand without those on its right, the selector stands right of its place by as much
    // as balances them, 44 px in Chinese and 64 in English, easing there on the first setting and back on the fourth.
    const lean =
      L(44, 64) * (glide(t, purposes[0] - 0.1, L(44, 64)) - glide(t, purposes[3] - 0.1, L(44, 64)));
    const cx =
        lean +
        1920 -
        (Math.min(960 - r, ...spans.map((v) => v[0])) +
          Math.max(960 + r, ...spans.map((v) => v[1]))) /
          2,
      cy = 640;
    ring(cx, cy, r, { color: P.line, alpha: three, width: 3.5, start: -Math.PI, upto: 0.5 });
    let a = -Math.PI;
    purposes.forEach((at, i) => {
      a = mix(a, angles[i], soon(t, at - 0.12, 0.45));
    });
    angles.forEach((g, i) => {
      const x = cx + Math.cos(g) * r,
        y = cy + Math.sin(g) * r,
        lit = speaking(t, purposes, i),
        on = ramp(t, purposes[i] - 0.1, 0.4) * three;
      // The setting covers the arc where it sits as it arrives.
      dot(x, y, 12, { color: P.ground, alpha: on });
      dot(x, y, 12, { color: P.authority, alpha: on });
      if (lit > 0)
        ring(x, y, 21, {
          color: P.authority,
          alpha: lit * restMark(P.authority, 0.5) * three,
          width: 2,
        });
      radialName(names[i], cx, cy, r + 12, g, {
        alpha: three * listIn(t, purposes, i),
        set: "purposes",
      });
    });
    // The needle turns from the hub toward the setting being named and stays on the last.
    line(cx, cy, cx + Math.cos(a) * (r - 44), cy + Math.sin(a) * (r - 44), {
      color: P.authority,
      alpha: three,
      width: 4,
    });
    dot(cx, cy, 14, { color: P.authority, alpha: three });
    nameText(en ? "The purpose" : "这次交流的目的", cx, cy + 14 + NAME_GAP, {
      valign: "top",
      color: P.authority,
      alpha: three * named(t, purpose),
    });
  }
  // 4. An important update (in Chinese, an important report) is one page given to its reader and read from the top, and
  // each of its four sections shows what it holds: the conclusion or present state with what changed since last time;
  // the decisive facts, the impact and the risks; the recommendation and the decision needed, from whom and by when; and
  // the next action with who does it, when it is done and what shows it is done. The reader stands at the page's head,
  // so what reaches them first is the lead. Each part of a section draws on its own words, the number of the section
  // being said lit, and the section's name, its spoken key phrase with the words that qualify it, stands beside the
  // page, centred on its section; the first section's lead and present state stand on the lines of its name and its
  // qualifier, and its rows and every later section's keep one pitch, so the names stand at that pitch too. The page
  // opens with its first section and lengthens to take each next one as it comes, stepping up a little each time so the
  // page stays about the centre.
  const dontKnow = cue(s, "不知道", "when you don't know");
  const four = base * stageIn(t, update) * stageOut(t, dontKnow);
  if (four > 0) {
    const sections = [
      // Each section is named by its spoken heading. The first takes the words that follow it as its qualifier; the
      // others name their parts only in their own captions, so a qualifier there would repeat the caption standing with
      // it, and they keep the heading alone.
      [
        en ? ["Conclusion or present state"] : ["结论或现状"],
        [["结论", "conclusion"]],
        en ? ["and what actually changed"] : ["说清这次和上次比，实际变了什么"],
        [["说清这次和上次比", "what actually changed"]],
      ],
      [en ? ["Decisive facts"] : ["关键的依据"], [["关键的依据", "decisive facts"]], [], []],
      [en ? ["Recommendation"] : ["建议"], [["建议", "your recommendation"]], [], []],
      [en ? ["Next action"] : ["下一步"], [["下一步", "the next action"]], [], []],
    ].map(([term, termCues, qual, qualCues]) => [term, cues(s, termCues), qual, cues(s, qualCues)]);
    const starts = sections.map(([, termAts]) => termAts[0]);
    const part = (zh, english) => ramp(t, cue(s, zh, english) - 0.15, 0.4) * four;
    const NW = Math.max(
      ...sections.map(([term, , qual]) =>
        Math.max(measure(term.join("")), qual.length ? measure(qual.join(""), NOTE) : 0),
      ),
    );
    // The first section holds two lines, the lead and the present state, about the middle a one-line section has; its
    // second line stands `drop` below that middle, and the section is taller by that drop, so the line stands one
    // section's pitch above the next section's line. The page starts higher by half the drop, so its middle stays where
    // sections of one height put it.
    const hh0 = termRowLayout(sections[0][0], sections[0][2], NW + 10).height,
      drop = hh0 / 2 - labelSize(NOTE) / 2;
    // While the first section's names are still to come, the page and the reader stand right of their places, so what
    // stands is centred: by half the names' column and its gap until the term comes, then by half of what the qualifier
    // will add to the term, and at their places once the qualifier comes.
    const [[termAt], [qualAt]] = [sections[0][1], sections[0][3]];
    const aside0 = (50 + NW) / 2,
      aside1 = (NW - measure(sections[0][0].join(""))) / 2;
    const aside = mix(
      mix(aside0, aside1, glide(t, termAt + 0.05, aside0 - aside1)),
      0,
      glide(t, qualAt + 0.05, aside1),
    );
    const PW = 500,
      PAD = 14,
      GAP = 10,
      heights = [104 + drop, 104, 104, 104],
      STEP = 30,
      left = 960 - (230 + PW + 50 + NW) / 2 + aside;
    // The sections' marks start 84 px into the page, their left edge 79 px in, so the page keeps one inset at either
    // side of what it holds: the lead ends on the change's triangle beneath it, 79 px short of the page's right edge.
    const rx = left + 70,
      x0 = left + 230,
      NX = x0 + PW + 50,
      g = x0 + 84;
    const grown = starts.map((at) => soon(t, pauseHold(at - 0.45, 0.4), 0.4));
    const T = 400 - drop / 2 - STEP * grown.slice(1).reduce((a, b) => a + b, 0);
    const tops = heights.reduce(
      (acc, h, k) => [...acc, k ? acc[k - 1] + heights[k - 1] + GAP : T + PAD],
      [],
    );
    // The page keeps below its last section's marks the padding its lead has above it, about 44 px.
    const H = PAD + 14 + heights.reduce((sum, h, k) => sum + (h + (k ? GAP : 0)) * grown[k], 0);
    s23Page(x0, T, PW, H, { alpha: four });
    nameText(en ? "An important update" : "重要的汇报", x0, T - NAME_GAP, {
      align: "left",
      valign: "bottom",
      alpha: four * named(t, update),
    });
    // The reader at the page's head: the lead reaches them first. The lead stands on the line of the first section's
    // name and the present state on the line of its qualifier.
    const mid0 = tops[0] + heights[1] / 2,
      lead = mid0 - hh0 / 2 + labelSize(LABEL) / 2,
      stateY = mid0 + drop;
    person(rx, lead + 52, { alpha: four, size: 2.6 });
    // The lead goes on reaching the reader; while the page and the reader glide left to their places, the flow, which
    // runs the same way, gives its pace up to each glide's.
    const given = soon(t, update + STAGE_CUT, 0.5),
      giving = since(t, update + STAGE_CUT + 0.5);
    link(x0 - 12, lead, rx + 64, lead, {
      color: P.evidence,
      alpha: four,
      upto: given,
      width: 2.5,
      flowing:
        giving === null
          ? null
          : giving -
            glideYield(t, termAt + 0.05, aside0 - aside1) -
            glideYield(t, qualAt + 0.05, aside1),
    });
    sections.forEach(([term, termAts, qual, qualAts], i) => {
      const top = tops[i],
        h = heights[i],
        cy = i ? top + h / 2 : mid0,
        on = ramp(t, starts[i] - 0.15, 0.4) * four,
        lit = speaking(t, starts, i);
      const color = i ? P.ink : P.evidence;
      // The section being said is marked at the page's edge.
      if (lit > 0)
        line(x0 + 30, top + 12, x0 + 30, top + h - 12, { color, alpha: lit * four, width: 4 });
      if (i === 0) {
        // The lead statement across the page; the present state beneath it, with last time's beside it and the change.
        // The lead runs across the page; its round end meets the right corner of the change's triangle beneath it, so the
        // section's lines end on one edge.
        line(g, lead, g + 336 + 1.25 - 4.5, lead, { color: P.evidence, alpha: on, width: 9 });
        // The present state and what changed form one glyph from 12 px above its first line to 24 px below it, so its
        // first line stands 6 px above the qualifier's line and the glyph is centred on it.
        const state = part("现状", "present state"),
          sy = stateY - 6;
        dot(g + 14, sy, 9, { color: P.authority, alpha: state });
        line(g + 40, sy, g + 256, sy, { color: P.ink, alpha: state, width: 5 });
        const changed = part("这次和上次比", "what actually changed");
        line(g + 40, sy + 24, g + 176, sy + 24, { color: P.muted, alpha: changed, width: 5 });
        stroke(
          () => {
            ctx.moveTo(g + 316, sy - 12);
            ctx.lineTo(g + 336, sy + 24);
            ctx.lineTo(g + 296, sy + 24);
            ctx.closePath();
          },
          { color: P.evidence, alpha: changed, width: 2.5 },
        );
      }
      if (i === 1) {
        s23Page(g - 4, cy - 30, 46, 60, { alpha: on, rows: 3 });
        const spread = part("影响", "impact");
        dot(g + 110, cy, 7, { color: P.unknown, alpha: spread });
        ring(g + 110, cy, mix(7, 24, soon(t, cue(s, "影响", "impact") + 0.05, 0.6)), {
          color: P.unknown,
          alpha: spread,
          width: 2,
        });
        const risk = part("风险", "risks");
        stroke(
          () => {
            ctx.moveTo(g + 200, cy - 22);
            ctx.lineTo(g + 224, cy + 20);
            ctx.lineTo(g + 176, cy + 20);
            ctx.closePath();
          },
          { color: P.unknown, alpha: risk, width: 2.5 },
        );
        // The blockers: the film's blocked mark, a bar across the way, at the marks' pitch after the risks.
        line(g + 290, cy - 24, g + 290, cy + 24, {
          color: P.unknown,
          alpha: part("障碍", "blockers"),
          width: 4,
        });
      }
      if (i === 2) {
        // The options and the one recommended, the person who must decide and the time they decide by.
        box(g - 2, cy - 18, 38, 36, { stroke: P.ink, alpha: on, radius: 7, width: 2 });
        box(g + 46, cy - 24, 52, 48, { stroke: P.evidence, alpha: on, radius: 8, width: 2.5 });
        check(g + 72, cy, 26, { alpha: on });
        person(g + 156, cy + 4, {
          color: P.authority,
          alpha: part("需要谁", "from whom"),
          size: 0.8,
        });
        const when = part("在什么时候", "by when");
        ring(g + 232, cy, 20, { color: P.authority, alpha: when, width: 2.5 });
        stroke(
          () => {
            ctx.moveTo(g + 232, cy - 11);
            ctx.lineTo(g + 232, cy);
            ctx.lineTo(g + 242, cy + 7);
          },
          { color: P.authority, alpha: when, width: 3 },
        );
      }
      if (i === 3) {
        // The next action as one step on, its owner, its due time and the condition that shows it is done.
        dot(g + 4, cy, 7, { color: P.ink, alpha: on });
        link(g + 14, cy, g + 52, cy, { color: P.ink, alpha: on, width: 3, end: false });
        ring(g + 62, cy, 9, { color: P.ink, alpha: on, width: 3 });
        person(g + 116, cy + 4, { alpha: part("谁来做", "its owner"), size: 0.7 });
        const due = part("什么时候做完", "due time");
        stroke(
          () => {
            ctx.roundRect(g + 152, cy - 20, 40, 40, 6);
            ctx.moveTo(g + 152, cy - 8);
            ctx.lineTo(g + 192, cy - 8);
          },
          { color: P.ink, alpha: due, width: 2 },
        );
        dot(g + 172, cy + 7, 5, { color: P.authority, alpha: due });
        const done = part("怎样算完", "what will show it is done");
        box(g + 216, cy - 18, 36, 36, { stroke: P.ink, alpha: done, radius: 6, width: 2 });
        check(g + 234, cy, 22, { alpha: done });
      }
      const hh = termRowLayout(term, qual, NW + 10).height;
      termRow(t, term, termAts, qual, qualAts, NX, cy - hh / 2, {
        width: NW + 10,
        color,
        alpha: four * listLevel(t, starts, i),
        set: "update",
      });
    });
  }
  // 5. Not knowing is said plainly: one row, read left to right, across the middle of the band. It opens on the person
  // who does not know, the question over them; the plain statement follows on its words. The two stand far enough apart
  // and large enough that the row alone fills the stage. The row holds to the scene's end.
  const sayDont = cue(s, "直说不知道", "say so");
  const five = base * stageIn(t, dontKnow);
  if (five > 0) {
    const ya = CONTENT_CY + 5,
      on = (at) => ramp(t, at - 0.15, 0.4) * five;
    // Not knowing: the person with the open question over them, then the plain statement they make.
    const xa = [580, 1340];
    person(xa[0], ya + 6, { alpha: five, size: 1.8 });
    ring(xa[0] + 54, ya - 82, 26, { color: P.unknown, alpha: five, width: 2.5, dash: [5, 5] });
    text("?", xa[0] + 54, ya - 81, 30, {
      role: "mark",
      align: "center",
      color: P.unknown,
      alpha: five,
    });
    const said = { t, at: sayDont - 0.1 };
    link(xa[0] + 70, ya, xa[1] - 86, ya, {
      color: P.ink,
      alpha: on(sayDont),
      draw: said,
      flowing: since(t, sayDont + 0.4),
    });
    box(xa[1] - 72, ya - 46, 144, 92, {
      fill: P.row,
      stroke: P.ink,
      alpha: on(sayDont),
      radius: 12,
      width: 2.5,
    });
    text("?", xa[1], ya + 1, 30, {
      role: "mark",
      align: "center",
      color: P.unknown,
      alpha: on(sayDont),
    });
    railNames(en ? ["Don't know", "Say so"] : ["不知道", "直说不知道"], xa, ya + 70, {
      gap: NAME_GAP,
      alpha: (i) => five * (i ? named(t, sayDont) : 1),
      color: (i) => [P.muted, P.ink][i],
      set: "plainly",
    });
  }
};

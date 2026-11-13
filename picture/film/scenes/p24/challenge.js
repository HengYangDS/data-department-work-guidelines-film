/* 24's later stages: the parts of what is said that a challenge addresses, and what another person can check. */

import { ctx } from "../../canvas.js";
import { blend } from "../../drawing/colour.js";
import { tableIcon } from "../../drawing/datasets.js";
import { since } from "../../drawing/flows.js";
import { link } from "../../drawing/links.js";
import { box, dot, labelSize, line, measure, stroke } from "../../drawing/strokes.js";
import { agent, check, person, ring } from "../../drawing/symbols.js";
import { listIn, named, speaking } from "../../naming/lists.js";
import { NAME_GAP, nameText, wrapName } from "../../naming/names.js";
import { railNames } from "../../naming/placement.js";
import { rejectedName } from "../../naming/rejected.js";
import { LABEL, P } from "../../palette.js";
import { L, en } from "../../timeline.js";
import { cue, cueFrom, cues } from "../../timing/cues.js";
import { mix, ramp, soon } from "../../timing/easing.js";
import { glide, glideTime } from "../../timing/pace.js";
import { pauseHold, voiceTime } from "../../timing/pauses.js";
import { STAGE_CUT, stageIn, stageOut } from "../../timing/stages.js";

/* Stage 3: the challenge as a lens at the head of a rail, on which a claim, its evidence and its cost arrive. */
export function s24Challenge(t, challenge, parts, never, personal, motive, three) {
  // The lens reaches 48 px left of its axis, the rail ends 112 px before the last card's axis and the cards reach
  // 106 px either side of theirs; the refused reading stands centred with its cross under the person, whose figure
  // reaches 40 px either side.
  const refusedName = L("人格和动机", "Personalities or motives"),
    lensLeft = Math.min(380 - 48, 380 - measure(L("质疑", "Challenge")) / 2);
  const refusedW = L(300, 340),
    reach =
      1560 +
      Math.max(
        40,
        (Math.max(...wrapName(refusedName, refusedW).map((v) => measure(v))) +
          16 +
          Math.min(26, labelSize(LABEL) * 0.9)) /
          2,
      );
  // The stage makes room for the refused reading as a glide that has arrived as its name comes in, so the name
  // stands inside the safe area from its first frame. When that glide would begin before the move that centres the
  // cards has ended, the two are one glide, from the lens and rail's place to the refusal's, so their paces never add.
  const sh0 = 960 - (lensLeft + 1140 - 112) / 2,
    sh1 = 960 - (lensLeft + 1140 + 106) / 2,
    sh2 = 960 - (lensLeft + reach) / 2;
  const cardsFrom = parts[2] + 0.05,
    refuseFrom = Math.min(never + 0.05, personal - 0.15 - glideTime(sh2 - sh1));
  const sh =
    voiceTime(refuseFrom) >= voiceTime(cardsFrom) + glideTime(sh1 - sh0)
      ? mix(mix(sh0, sh1, glide(t, cardsFrom, sh1 - sh0)), sh2, glide(t, refuseFrom, sh2 - sh1))
      : mix(
          sh0,
          sh2,
          glide(t, Math.min(cardsFrom, personal - 0.15 - glideTime(sh2 - sh0)), sh2 - sh0),
        );
  const y = 470,
    lx = 380 + sh,
    xs = [640, 890, 1140].map((x) => x + sh),
    barX = 1370 + sh,
    hx = 1560 + sh;
  // The lens stands near the meeting's first gate, so it fades in over the cut's first frames rather than in one and
  // is not read as the gate jumping to it.
  const lens = three * ramp(t, challenge + STAGE_CUT, 0.15);
  ring(lx, y, 46, { color: P.evidence, alpha: lens, width: 3 });
  line(lx + 33, y + 33, lx + 56, y + 56, { color: P.evidence, alpha: lens, width: 4 });
  nameText(L("质疑", "Challenge"), lx, y - 46 - NAME_GAP, {
    valign: "bottom",
    color: P.evidence,
    alpha: three * named(t, challenge),
  });
  link(lx + 52, y, xs[2] - 112, y, {
    color: P.evidence,
    alpha: three,
    draw: { t, at: challenge + STAGE_CUT },
    end: false,
  });
  const go = soon(t, never - 0.05, 0.6);
  link(xs[2] + 112, y, hx - 50, y, {
    color: P.unknown,
    alpha: three * ramp(t, never - 0.05, 0.3),
    upto: 0.5 * go,
    end: false,
    dash: [8, 8],
  });
  line(barX, y - 34, barX, y + 34, {
    color: P.unknown,
    alpha: ramp(t, never + 0.4, 0.3) * three,
    width: 4,
  });
  // What is challenged and what never is are one contrast, so the bar's name stands on the lens's name's baseline.
  nameText(L("不质疑", "Never"), barX, y - 46 - NAME_GAP, {
    valign: "bottom",
    alpha: three * named(t, never),
  });
  xs.forEach((x, i) => {
    const lit = speaking(t, parts, i),
      q = ramp(t, parts[i] - 0.15, 0.4) * three;
    box(x - 105, y - 95, 210, 190, {
      fill: P.row,
      stroke: blend(P.line, P.evidence, lit),
      alpha: q,
      radius: 10,
      width: 2 + 0.5 * lit,
    });
    if (i === 0)
      stroke(
        () =>
          [0, 1, 2].forEach((k) => {
            ctx.moveTo(x - 56, y - 28 + k * 28);
            ctx.lineTo(x + (k === 2 ? 18 : 56), y - 28 + k * 28);
          }),
        { color: P.ink, alpha: q, width: 3 },
      );
    if (i === 1) tableIcon(x - 60, y - 40, 120, 80, { alpha: q, stroke: P.ink, rows: 3, cols: 3 });
    if (i === 2)
      [0, 1, 2].forEach((k) =>
        box(x - 38 + (k === 1 ? 8 : 0), y + 18 - k * 23, 76, 20, {
          fill: P.row,
          stroke: P.authority,
          alpha: q,
          radius: 10,
          width: 2.5,
        }),
      );
  });
  railNames(en ? ["Propositions", "Evidence", "Costs"] : ["说法", "证据", "代价"], xs, y + 95, {
    gap: NAME_GAP,
    alpha: (i) => three * listIn(t, parts, i),
    set: "challenged",
  });
  // The person appears when the words turn to the person.
  person(hx, y + 8, { alpha: three * ramp(t, never - 0.15, 0.4), size: 1.6 });
  // The refused reading hangs on the line of the parts' names, so the two read as one row of what is and is not
  // challenged.
  rejectedName(refusedName, hx, y + 95 + NAME_GAP, {
    valign: "top",
    width: refusedW,
    alpha: three * named(t, personal),
    mark: ramp(t, motive + 0.05, 0.35),
  });
}

/* Stage 4: what is said as a card between its speaker and another person, who reads it through a lens. */
export function s24Checkable(s, t, updates, four) {
  const vague = cues(s, [
    ["积极推进", "actively progressing"],
    ["智能体分析过了", "the Agent analyzed it"],
  ]);
  // Each vague phrase is struck on the words that say what replaces it: 不如说 after the first and, in Chinese, 要说
  // after the second; English says "say" after both.
  const instead = vague.map((at, k) => cueFrom(s, k ? "要说" : "不如说", "say", at)),
    sayAt = cue(s, "说别人", "say things");
  const groups = en
    ? [
        [
          ["Tests pass", "tests pass", "check"],
          ["The acceptor still needs to confirm", "the acceptor still needs", "owner"],
          ["We'll conclude by Friday", "we'll conclude", "due"],
        ],
        [
          ["Facts it produced", "which facts it produced", "agent"],
          ["What you verified", "what you verified", "check"],
          ["Where the conclusion stops", "where the conclusion stops", "limit"],
        ],
      ]
    : [
        [
          ["测试通过了", "测试通过", "check"],
          ["还要等验收人确认", "还要等", "owner"],
          ["周五前", "周五前", "due"],
        ],
        [
          ["它给出了哪些事实", "它给出了", "agent"],
          ["你核实了什么", "你核实了", "check"],
          ["结论能说到哪", "结论能说到", "limit"],
        ],
      ];
  const refused = en
    ? ["“Actively progressing”", "“The Agent analyzed it”"]
    : ["“积极推进”", "“智能体分析过了”"];
  // The fixed frame of the exchange: the speaker on the left, the card about the centre, the reader and the lens on
  // the right, and the title over the card.
  const SX = 380,
    RX = 1500,
    LX = 1420,
    TOP = 432,
    ROW = 58,
    LY = TOP + 17 + ROW / 2;
  // Until the reader comes, the speaker, the card and the way toward the reader stand centred together, and they
  // glide to their places as the reader comes.
  const shift = 960 - (SX - 15 * 1.6 * 1.55 + LX - 52) / 2;
  ctx.save();
  ctx.translate(shift * (1 - glide(t, sayAt - 0.15, shift)), 0);
  person(SX, LY + 40, { alpha: four, size: 1.6 });
  person(RX, LY + 36, { alpha: four * ramp(t, sayAt - 0.15, 0.4), size: 1.4, color: P.evidence });
  ring(LX, LY, 46, { color: P.evidence, alpha: four * ramp(t, sayAt - 0.15, 0.4), width: 3 });
  line(LX + 33, LY + 33, LX + 56, LY + 56, {
    color: P.evidence,
    alpha: four * ramp(t, sayAt - 0.15, 0.4),
    width: 4,
  });
  nameText(L("别人能检查的话", "Things others can check"), 960, TOP - 30 - NAME_GAP, {
    valign: "bottom",
    alpha: four * named(t, sayAt),
  });
  // What is said travels from the speaker to the card and from the card to the reader's lens, one point on each way.
  const card = (x0, w, h, a) => {
    box(x0, TOP, w, h, { fill: P.row, stroke: P.ink, alpha: a, radius: 12, width: 2.5 });
    const q = since(t, updates + STAGE_CUT);
    link(SX + 26, LY, x0 - 8, LY, { alpha: a, end: false, flowing: q });
    link(x0 + w + 8, LY, LX - 52, LY, {
      color: P.evidence,
      alpha: a,
      end: false,
      flowing: q,
      lag: 0.5,
    });
  };
  const principle = four * stageOut(t, vague[0] - 0.2);
  if (principle > 0) {
    const checkAt = cueFrom(s, "检查", "check", updates),
      w = 300;
    card(960 - w / 2, w, 2 * ROW + 40, principle);
    stroke(
      () =>
        [0, 1, 2].forEach((k) => {
          ctx.moveTo(960 - w / 2 + 30, TOP + 36 + k * 30);
          ctx.lineTo(960 - w / 2 + 30 + [190, 150, 170][k], TOP + 36 + k * 30);
        }),
      { color: P.muted, alpha: principle, width: 4 },
    );
    check(960 + w / 2 - 44, TOP + 2 * ROW + 6, 30, {
      alpha: principle,
      draw: { t, at: checkAt + 0.05 },
    });
    // The occasions the principle holds for name the card from the first words.
    nameText(
      L("汇报、答复、纪要和上报", "Updates, answers, meeting records and escalations"),
      960,
      TOP + 2 * ROW + 40 + NAME_GAP,
      { valign: "top", width: 420, alpha: principle * named(t, updates) },
    );
  }
  const mark = (kind, x, my, a) => {
    if (kind === "check") check(x, my + 2, 26, { alpha: a });
    if (kind === "owner") person(x, my + 3, { alpha: a, size: 0.55, color: P.authority });
    if (kind === "agent") agent(x, my, { alpha: a, size: 0.6 });
    // A due day: a calendar leaf with its day marked.
    if (kind === "due") {
      box(x - 14, my - 13, 28, 27, { stroke: P.ink, alpha: a, radius: 4, width: 2 });
      line(x - 14, my - 5, x + 14, my - 5, { color: P.ink, alpha: a, width: 2 });
      dot(x, my + 5, 4, { color: P.authority, alpha: a });
    }
    if (kind === "limit") {
      line(x - 13, my, x + 5, my, { color: P.ink, alpha: a, width: 3 });
      line(x + 9, my - 12, x + 9, my + 12, { color: P.ink, alpha: a, width: 4 });
    }
  };
  groups.forEach((g, k) => {
    const shown =
      four *
      stageIn(t, vague[k] - 0.2) *
      (k + 1 < groups.length ? stageOut(t, vague[k + 1] - 0.2) : 1);
    if (shown <= 0) return;
    // The refused phrase heads the statements that replace it, centred over them with its cross, and the statements
    // stand as one block centred under it, from the ring of the statement being said to their longest name's end; the
    // card is as wide as the wider of the two with one padding, 36 px, at either side. Before its cross the phrase
    // stands centred alone, and it steps left by half the cross's room as the cross arrives. The phrase is measured by
    // its ink, from its opening quote's to its closing quote's: each quote leaves blank beyond its ink, 0.625 em of a
    // Chinese quote's em and 0.072 em of an English quote. The cross stands 18 px after that ink, where a Chinese
    // phrase's advance ends, and its room is that gap, its 26 px and its stroke's round end. Where that centring would
    // leave the phrase's left edge within three quarters of an em of the statements' names, the eye reads the two as
    // almost aligned, so the phrase steps instead to stand flush with them, its em box on their left edge.
    const ats = g.map(([, said]) => cue(s, said, said)),
      em = labelSize(LABEL),
      blank = L(0.625, 0.072) * em;
    const phrase = measure(refused[k]) - 2 * blank,
      room = 18 + Math.min(26, em * 0.9) + 1.5;
    // A statement's lit ring reaches 24 px left of its axis, and its name starts 52 px right of it.
    const rowsW = 24 + 30 + NAME_GAP + Math.max(...g.map(([v]) => measure(v))),
      w = 72 + Math.max(phrase + room, rowsW),
      x0 = 960 - w / 2;
    const MX = (w - rowsW) / 2 + 24,
      NX = MX + 30 + NAME_GAP,
      centred = x0 + (w - phrase - room) / 2;
    const inkEnd = Math.abs(centred - blank - (x0 + NX)) <= 0.75 * em ? x0 + NX + blank : centred;
    const ink = mix(x0 + (w - phrase) / 2, inkEnd, soon(t, instead[k] + 0.05, 0.35));
    const h = ats.reduce(
      (sum, at) => sum + ROW * soon(t, pauseHold(at - 0.45, 0.4), 0.4),
      ROW + 34,
    );
    card(x0, w, h, shown);
    rejectedName(refused[k], ink - blank, LY, {
      align: "left",
      alpha: shown * named(t, vague[k]),
      mark: ramp(t, instead[k] + 0.05, 0.35),
      markLeft: ink + phrase + 18,
    });
    g.forEach(([v, , kind], j) => {
      const my = LY + (j + 1) * ROW,
        lit = speaking(t, ats, j);
      if (lit > 0) ring(x0 + MX, my, 22, { color: P.evidence, alpha: shown * lit, width: 2.5 });
      mark(kind, x0 + MX, my, shown * ramp(t, ats[j] - 0.15, 0.4));
      nameText(v, x0 + NX, my, {
        align: "left",
        alpha: shown * listIn(t, ats, j),
        set: `statements${k}`,
      });
    });
  });
  ctx.restore();
}

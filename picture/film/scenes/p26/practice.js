/* 26's way into department practice: the five kinds of candidate, and what a candidate must still show. */

import { ctx } from "../../canvas.js";
import { blend } from "../../drawing/colour.js";
import { since } from "../../drawing/flows.js";
import { link, rounded } from "../../drawing/links.js";
import { box, dot, labelSize, line, measure, path, stroke } from "../../drawing/strokes.js";
import { agent, check, documentIcon, ring, seal } from "../../drawing/symbols.js";
import { listIn, listLevel, named, speaking } from "../../naming/lists.js";
import { NAME_GAP, nameText } from "../../naming/names.js";
import { CONTENT_CY, stackTops } from "../../naming/placement.js";
import { NOTE, termRow, termRowLayout } from "../../naming/terms.js";
import { LABEL, P } from "../../palette.js";
import { L, en } from "../../timeline.js";
import { cue, cues } from "../../timing/cues.js";
import { clamp, mix, ramp, soon } from "../../timing/easing.js";
import { glide } from "../../timing/pace.js";
import { pauseHold } from "../../timing/pauses.js";

/* Stage 2: the five kinds of candidate in one column, each with its emblem, on their way into department practice. */
export function s26Candidates(t, practice, kinds, needs, PRACTICE_X, PRACTICE_R, g2) {
  // The needs stand on the middle of the fork their lanes draw, between its split and its join. The fork is laid out
  // back from practice's place, which puts the whole stage, from the widest candidate's name to practice's name, about
  // the centre, and its lanes rejoin far enough before practice that the English name, wider than the seal, stands
  // clear of the join.
  // The English candidates' names are longer, so their emblems stand 50 px nearer the junction and the stage, from the
  // widest name to practice's name, stays about the centre.
  const PX = PRACTICE_X,
    PR = PRACTICE_R,
    RX = PX - 180,
    SX = RX - 340,
    JX = SX - 20,
    DX = JX - L(330, 280),
    MX = DX + 230,
    NX = DX - 40,
    NEED = (SX + RX) / 2;
  // The five kinds stand at one pitch about the way's row, their names on one right edge.
  const cys = [340, 420, 500, 580, 660],
    lys = [370, 500, 630];
  const kindNames = en
    ? ["Rule", "Template", "Tool", "Agent workflow", "Platform mechanism"]
    : ["规则", "模板", "工具", "智能体流程", "平台机制"];
  // Until practice is named the way runs on toward its place alone, so the stage stands right of its place by what
  // centres the candidates' names with the way, and glides there as practice takes its seal, well before stage 3 keeps
  // the seal's place.
  const leftmost =
      NX -
      Math.max(...kindNames.map((v) => Math.max(...[].concat(v).map((line) => measure(line))))),
    lean = 960 - (leftmost + PX - PR - 10) / 2;
  ctx.save();
  ctx.translate(lean * (1 - glide(t, practice - 0.15, lean)), 0);
  const needNames = en
    ? ["Observed problem", "Substantiated material risk", "Applicable obligation"]
    : ["观察到的问题", "有依据的实质风险", "必须履行的义务"];
  kinds.forEach((at, i) => {
    const q = ramp(t, at - 0.15, 0.4) * g2,
      lit = speaking(t, kinds, i),
      y = cys[i],
      color = blend(P.ink, P.evidence, lit);
    if (i === 0) documentIcon(DX - 18, y - 23, 36, 46, { alpha: q, rows: 3, stroke: color });
    if (i === 1) {
      documentIcon(DX - 18, y - 23, 36, 46, { alpha: q, rows: 0, stroke: color });
      box(DX - 10, y - 9, 20, 18, { stroke: color, alpha: q, radius: 3, width: 2, dash: [3, 3] });
    }
    if (i === 2) {
      line(DX - 12, y + 12, DX + 3, y - 3, { color, alpha: q, width: 4 });
      ring(DX + 8, y - 8, 7, { color, alpha: q, width: 3 });
    }
    if (i === 3) agent(DX, y, { alpha: q, size: 0.6, color });
    if (i === 4) {
      ring(DX, y, 12, { color, alpha: q, width: 3 });
      dot(DX, y, 4, { color, alpha: q });
      stroke(
        () =>
          [0, 1, 2, 3, 4, 5].forEach((k) => {
            const a = (k * Math.PI) / 3;
            ctx.moveTo(DX + Math.cos(a) * 14, y + Math.sin(a) * 14);
            ctx.lineTo(DX + Math.cos(a) * 20, y + Math.sin(a) * 20);
          }),
        { color, alpha: q, width: 3 },
      );
    }
    link(DX + 28, y, JX, 500, { route: "hvh", mid: MX, alpha: q, width: 3, end: false });
    nameText(kindNames[i], NX, y, {
      align: "right",
      alpha: g2 * listIn(t, kinds, i),
      set: "candidates",
    });
  });
  dot(JX, 500, 6, { color: P.line, alpha: g2 * ramp(t, kinds[0] - 0.15, 0.4) });
  lys.forEach((ly, k) => {
    const q = ramp(t, needs[k] - 0.15, 0.4) * g2,
      lit = speaking(t, needs, k),
      round = { t, at: needs[k] - 0.15 };
    // The four links merge into a way one step firmer than they are, and its lanes keep that stroke: the way carries
    // the stage's right while it builds, and a thinner way on the middle row is lost in a frame seen small.
    if (ly === 500)
      link(JX, 500, PX - PR - 10, 500, {
        alpha: g2 * ramp(t, kinds[0] - 0.15, 0.4),
        draw: { t, at: kinds[0] + 0.05 },
        width: 4,
        end: false,
        flowing: since(t, Math.max(practice + 0.6, kinds[0] + 0.95)),
      });
    else {
      // The way out to the round and the way back draw on as one stroke from the junction, so the way back grows on
      // from where the way out ends rather than setting off as a second mark.
      path(
        rounded(
          [
            [JX, 500],
            [SX, 500],
            [SX, ly],
            [RX, ly],
            [RX, 500],
            [PX - PR - 10, 500],
          ],
          14,
        ),
        { color: P.line, alpha: q, draw: round, width: 4 },
      );
    }
    ring(NEED, ly, 14, { color: P.authority, alpha: q, width: 2.5 });
    dot(NEED, ly, 6 + 2 * lit, { color: P.authority, alpha: q });
    nameText(needNames[k], NEED, ly - 14 - NAME_GAP, {
      valign: "bottom",
      width: L(260, 320),
      alpha: g2 * listIn(t, needs, k),
      set: "needs",
    });
  });
  // Department practice: an unstamped seal, on its words.
  const pr = ramp(t, practice - 0.15, 0.4) * g2;
  seal(PX, 500, PR, { color: P.authority, alpha: pr, hollow: true });
  nameText(L("全部门的做法", "Department practice"), PX, 500 + PR + NAME_GAP, {
    valign: "top",
    color: P.authority,
    alpha: g2 * named(t, practice),
  });
  ctx.restore();
}

/* Stage 3: the one column of conditions a candidate must still show, each checked on its own words. */
export function s26StillToShow(
  s,
  t,
  falls,
  cost,
  small,
  maintainer,
  explain,
  PRACTICE_X,
  PRACTICE_R,
  g3,
) {
  const [evidenceAt, triggers] = cues(s, [
    ["用证据看利弊", "evidence of net benefit"],
    ["什么时候改或撤", "stated triggers"],
  ]);
  const rows = en
    ? [
        [["Existing boundaries, interfaces and feedback fall short"], [falls], [], []],
        [
          ["New practice's cost"],
          [cost],
          ["to understand and maintain"],
          [cue(s, "", "to understand and maintain")],
        ],
        [["Bounded trial"], [small], ["net-benefit evidence"], [evidenceAt]],
        [["Named owner"], [maintainer], ["revision and retirement triggers"], [triggers]],
      ]
    : [
        [
          ["现有边界、分工衔接和反馈为什么不够"],
          [falls],
          ["新做法要多花多少学习和维护成本"],
          [cost],
        ],
        [["小范围试点"], [small], ["用证据看利弊"], [evidenceAt]],
        [["谁来维护"], [maintainer], ["什么时候改或撤"], [triggers]],
      ];
  const W = 600,
    PR = PRACTICE_R,
    starts = rows.map(([, termAts, , qualAts]) => Math.min(...termAts, ...qualAts));
  const rights = rows.map(([term, , qual]) =>
    Math.max(measure(term.join("")), qual.length ? Math.min(measure(qual.join(""), NOTE), W) : 0),
  );
  const right = Math.max(...rights),
    practiceName = L("全部门的做法", "Department practice");
  // Practice keeps its place from stage 2: the link to it is as long as centres the column, the link and practice with
  // practice there.
  const half = Math.max(PR, measure(practiceName) / 2),
    LINK = 2 * (PRACTICE_X - 960) - (48 + right + 36 + PR) + half;
  const whole = 48 + right + 36 + LINK + PR + half,
    LX = 960 - whole / 2 + 48;
  const BX = LX + right + 36,
    PX = BX + LINK + PR;
  const blocks = rows.map(([term, , qual]) => termRowLayout(term, qual, W, false).height),
    pad = 24 - labelSize(LABEL) / 2;
  const tops = stackTops(blocks, CONTENT_CY, 36);
  const ys = tops.map((top) => top + labelSize(LABEL) / 2),
    top = tops[0] - pad;
  rows.forEach(([term, termAts, qual, qualAts], r) => {
    const q = ramp(t, starts[r] - 0.15, 0.4),
      lit = speaking(t, starts, r);
    ring(LX - 34, ys[r], 16 + 2 * lit, { color: P.authority, alpha: g3 * q, width: 2.5 });
    check(LX - 34, ys[r] + 1, 18, {
      color: P.authority,
      alpha: g3 * ramp(t, starts[r] + 0.05, 0.4),
    });
    termRow(t, term, termAts, qual, qualAts, LX, tops[r], {
      width: W,
      alpha: g3 * listLevel(t, starts, r),
      set: "conditions",
      inline: false,
    });
  });
  // The bracket lengthens to take each condition's name and then its qualifier, starting just before each arrives so
  // its room is there when it does; the link to practice joins it once it has reached the link's level, inking in over
  // 0.4 s once the step that brings the bracket there is done rather than in the frame or two the bracket takes to
  // pass it, and carries one point once stamped.
  let joinAt = Infinity;
  const held = rows.reduce((b, [, , , qualAts], r) => {
    const nameFrom = pauseHold(starts[r] - 0.45, 0.4),
      nameTo = tops[r] + labelSize(LABEL) + pad;
    if (nameTo > CONTENT_CY) joinAt = Math.min(joinAt, nameFrom);
    const named = mix(b, nameTo, soon(t, nameFrom, 0.4));
    if (!qualAts.length) return named;
    const qualFrom = pauseHold(qualAts[0] - 0.45, 0.4),
      qualTo = tops[r] + blocks[r] + pad;
    if (qualTo > CONTENT_CY) joinAt = Math.min(joinAt, qualFrom);
    return mix(named, qualTo, soon(t, qualFrom, 0.4));
  }, top);
  if (held > top + 0.5)
    path(
      [
        [BX - 16, top],
        [BX, top],
        [BX, held],
        [BX - 16, held],
      ],
      { color: P.line, alpha: g3 * clamp((held - top) / 60), width: 2 },
    );
  const done = ramp(t, triggers + 0.05, 0.4);
  link(BX, CONTENT_CY, PX - PR - 12, CONTENT_CY, {
    alpha: g3 * Math.min(clamp((held - CONTENT_CY) / 24), ramp(t, joinAt + 0.4, 0.4)),
    end: false,
    flowing: since(t, triggers + 0.05),
  });
  seal(PX, CONTENT_CY, PR, { color: P.authority, alpha: g3, hollow: true });
  check(PX, CONTENT_CY + 3, PR * 0.8, { color: P.authority, alpha: g3 * done });
  nameText(practiceName, PX, CONTENT_CY + PR + NAME_GAP, {
    valign: "top",
    color: P.authority,
    alpha: g3,
  });
  // Chinese counts what must be explained before the column builds, and the count heads the column from its words.
  if (!en)
    nameText("还要做到三件事", LX, top - 24 - NAME_GAP, {
      align: "left",
      valign: "bottom",
      color: P.muted,
      alpha: g3 * named(t, explain),
    });
}

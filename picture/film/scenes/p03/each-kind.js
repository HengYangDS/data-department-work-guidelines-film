/* 03's two orders, one for each kind of authority, each a frame drawn by order.js: the order of authority to act,
 * and what establishes a fact. */

import { ctx } from "../../canvas.js";
import { link } from "../../drawing/links.js";
import { dot, line, measure } from "../../drawing/strokes.js";
import { ring } from "../../drawing/symbols.js";
import { beats, named } from "../../naming/lists.js";
import { NAME_GAP, nameText } from "../../naming/names.js";
import { NOTE } from "../../naming/terms.js";
import { LABEL, P } from "../../palette.js";
import { L, en } from "../../timeline.js";
import { cueFrom } from "../../timing/cues.js";
import { ramp } from "../../timing/easing.js";
import { drawShare } from "../../timing/pace.js";
import { s03Order } from "./order.js";

/* Stage 3: the first kind's order, authority to act, one rank to a row. */
export function s03ToAct(s, t, decideQ, ranks, order, truthQ, g2) {
  // The frame leans right by half the width its ranks have still to take, up to 220 px in English, whose frame is
  // wide, so the order stands centred as its first rank builds; the English order cuts in with that rank.
  ctx.save();
  const colors = [P.authority, P.authority, P.ink, P.muted];
  // Each rank as [term, qualifier], named by its spoken words: a rank that lists several members names its first as
  // its term and the rest as its qualifier, and each further member joins the qualifier on its own words, so a rank
  // said over several seconds keeps building. The second rank is the owner's decision, never the owner: both editions
  // say the owner first and name the whole phrase, so the rank's name ends on the decision in both editions. A term
  // keeps the punctuation that follows it, and an English
  // enumeration's qualifier opens on the space that continues the term's line.
  const names = en
    ? [
        [["Law,"], [" regulation, security requirements", " and mandatory company policy"]],
        [["What the decision owner for this matter explicitly decides"], []],
        [["Contracts,"], [" policies", ", specifications", " and decision records in force"]],
        [["Work plans,"], [" provisional agreements", " and personal preferences"]],
      ]
    : [
        [["法律、"], ["监管、安全要求", "和公司的强制性制度"]],
        [["这件事的决策负责人作出的明确决定"], []],
        [["有效的契约、"], ["制度", "、规范", "和决策记录"]],
        [["工作计划、"], ["临时约定", "和个人偏好"]],
      ];
  // What each rank holds, as it is said: its station beats once for each member after the first, on the words that
  // bring that member to the rank's qualifier.
  const members = (
    en
      ? [
          ["regulation", "security requirements", "mandatory company policy"],
          [],
          ["policies", "specifications", "decision records"],
          ["provisional agreements", "personal preferences"],
        ]
      : [
          ["监管", "安全要求", "公司的强制性制度"],
          [],
          ["制度", "规范", "决策记录"],
          ["临时约定", "个人偏好"],
        ]
  ).map((rest, r) => [ranks[r], ...rest.map((v) => cueFrom(s, v, v, ranks[r]))]);
  // The words each qualifier's parts join on: each further member's. Both editions name their first rank's members
  // in two parts, so the frame stands near its full width from the first and the rank still grows while the rest is
  // said, and the order's opening frame, its head alone, never stands thin for long.
  const parts = members.map((m) => m.slice(1));
  parts[0] = [members[0][1], members[0][3]];
  const head = s03Order(t, g2, {
    FT: L(320, 280),
    leave: en ? truthQ : Infinity,
    width: L(640, 960),
    leanMax: L(120, 220),
    color: P.authority,
    question: L("行动依据", "Authority to act"),
    questionAt: decideQ,
    frameAt: en ? ranks[0] : order,
    build: true,
    joined: en ? [true, false, true, true] : true,
    rows: names.map(([term, qual], r) => [
      term,
      [ranks[r]],
      qual,
      parts[r],
      ranks[r],
      0,
      colors[r],
      "ranks",
    ]),
    station: (x, y, r, q, lit) => {
      dot(x, y, 11, { color: P.ground, alpha: q });
      dot(x, y, 11, { color: P.line, alpha: q, hollow: true, width: 2 });
      dot(x, y, 12.5 - r * 1.5, { color: colors[r], alpha: q });
      beats(t, x, y, 19, members[r].slice(1), { color: colors[r], alpha: g2, lit });
    },
  });
  // The order's title stands over the frame's corner from the words that announce it and leaves with the ranks.
  nameText(L("有先后", "Order of precedence"), head.SX - 110, L(320, 280) - NAME_GAP, {
    align: "left",
    valign: "bottom",
    color: P.muted,
    alpha: g2 * named(t, order) * (1 - ramp(t, truthQ + 0.05, 0.3)),
  });
  ctx.restore();
}

/* Stage 4: the second kind's answer, what establishes a fact, from primary records down. */
export function s03AboutFacts(
  t,
  truthQ,
  asks,
  record,
  observe,
  onlyLeads,
  attrs,
  leads,
  rise,
  g3f,
) {
  const facts = en
    ? [
        [["Primary records"], [record], [], []],
        [
          ["Repeatable observations"],
          [observe],
          ["with a source", ", time", ", subject", " and scope"],
          attrs,
        ],
        [
          ["Only leads"],
          [onlyLeads],
          ["Second-hand accounts", ", Caches", ", Generated views", ", Agent output", ", Memory"],
          leads,
        ],
      ]
    : [
        [["原始记录"], [record], [], []],
        [["能重复的观察"], [observe], ["并说清来源", "、时间", "、对象和范围"], attrs],
        [
          ["只能算线索"],
          [onlyLeads],
          ["转述", "、记忆", "、缓存", "、派生视图", "、智能体的输出"],
          leads,
        ],
      ];
  const starts = facts.map(([, termAts, , qualAts]) => Math.min(...termAts, ...qualAts));
  // A row's station beats once for each part of the row after the first as it is said.
  const parts = facts.map(([, termAts, , qualAts], r) =>
    r === 2 ? qualAts : [...termAts, ...qualAts],
  );
  // The English kind first stands where it stood under the closed head, 150 px below the head's frame (280 + 220),
  // centred with its question; it is named as its words end.
  const asked = truthQ + 0.85,
    answers = "What can establish what is true";
  const ow =
    72 +
    NAME_GAP +
    Math.max(
      measure(L("事实依据", "Authority about facts"), LABEL),
      en ? measure(answers, NOTE) : 0,
    );
  const { SX, ys, tops } = s03Order(t, g3f, {
    FT: 260,
    width: L(640, 760),
    color: P.evidence,
    question: L("事实依据", "Authority about facts"),
    questionAt: L(truthQ, asked),
    note: L("", answers),
    noteAt: asks[1],
    arrive: en ? { x: 960 - ow / 2 + 36, y: 650, r: 36, at: asked, rise } : null,
    frameAt: record,
    leanMax: 260,
    build: true,
    rows: facts.map(([term, termAts, qual, qualAts], r) => [
      term,
      termAts,
      qual,
      qualAts,
      starts[r],
      r === 2 ? 30 : 0,
      r < 2 ? P.evidence : P.muted,
      "facts",
      r === 2 ? "leads" : null,
    ]),
    station: (x, y, r, q, lit) => {
      dot(x, y, 11, { color: P.ground, alpha: q });
      dot(x, y, 11, { color: P.line, alpha: q, hollow: true, width: 2 });
      if (r < 2) dot(x, y, 12.5, { color: P.evidence, alpha: q });
      else ring(x, y, 12.5, { color: P.unknown, alpha: q, width: 3 });
      beats(t, x, y, 19, parts[r].slice(1), {
        color: r < 2 ? P.evidence : P.unknown,
        alpha: g3f,
        lit,
      });
    },
  });
  const barY = tops[2] - 26,
    tried = ramp(t, leads[0] - 0.15, 0.4) * g3f;
  link(SX, ys[2] - 14, SX, barY + 12, {
    color: P.unknown,
    alpha: tried,
    upto: drawShare(t, leads[0] - 0.1, Math.abs(barY + 12 - (ys[2] - 14)), 0.7),
    end: false,
    dash: [6, 6],
  });
  line(SX - 24, barY, SX + 24, barY, {
    color: P.unknown,
    alpha: ramp(t, leads[0] + 0.45, 0.3) * g3f,
    width: 4,
  });
}

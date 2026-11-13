/* 26's closing stages: the necessary safeguard that does not wait, and the rule retired when it no longer earns its
 * place. */

import { blend } from "../../drawing/colour.js";
import { restMark } from "../../drawing/levels.js";
import { link } from "../../drawing/links.js";
import { s23Page } from "../../drawing/pages.js";
import { dot, labelSize, line, measure, path, text } from "../../drawing/strokes.js";
import { check, cross, ring, seal, shield } from "../../drawing/symbols.js";
import { listIn, named, speaking } from "../../naming/lists.js";
import { LEADING, NAME_GAP, nameText } from "../../naming/names.js";
import { blockHeight, growName } from "../../naming/parts.js";
import { CONTENT_CY, stackTops } from "../../naming/placement.js";
import { rejectedName } from "../../naming/rejected.js";
import { NOTE, TERM_GAP, termRow, termRowLayout } from "../../naming/terms.js";
import { LABEL, P } from "../../palette.js";
import { L, en } from "../../timeline.js";
import { cue, cueFrom, cues } from "../../timing/cues.js";
import { clamp, mix, ramp, soon } from "../../timing/easing.js";
import { glide } from "../../timing/pace.js";
import { pauseHold, span } from "../../timing/pauses.js";

/* Stage 4: the safeguard standing now, and the two things it must not wait for. */
export function s26Safeguard(s, t, safeguards, noWait, g4) {
  const [incidentAt, approvalAt] = cues(s, [
    ["出事", "an incident"],
    ["新做法获批", "a new practice's admission"],
  ]);
  // The safeguard's column keeps the shield's left edge: its name above, the authority's line and its name below, and
  // the trial's fork and names under them. It stands on the centre, with its name and its refused way, until the
  // first thing it must not wait for is named, and then eases left until the whole stage centres; the events and
  // their bracket stand at their places.
  const LEFT = mix(L(140, 316), L(-150, -120), glide(t, incidentAt - 0.1, L(290, 436)));
  // The English admission's name stands whole on one line, since no break of it keeps a block's shape, so the events
  // and their bracket stand 85 px further left in English and the stage keeps its centre.
  const SX = L(620, 540) + LEFT,
    SR = L(120, 88),
    EX = L(1300, 1215),
    BX = EX - 50,
    ys = [452, 548],
    E = SX - SR * 0.85;
  // Chinese has already said 试点 for the conditions' small trial, so its cue is the one that 这类保障也可以试点 says.
  const trialAt = cueFrom(
    s,
    "试点",
    "a trial only chooses",
    cue(s, "这类保障也可以试点", "a trial only chooses"),
  );
  const onlyAt = cueFrom(s, "只用来选定", "only chooses", trialAt),
    howAt = cueFrom(s, "选定", "chooses", trialAt);
  shield(SX, CONTENT_CY, SR, { alpha: g4, fillColor: P.row });
  check(SX, CONTENT_CY + 3, SR * 0.52, {
    color: P.evidence,
    alpha: g4 * ramp(t, safeguards + 0.05, 0.4),
    width: 4.5,
  });
  // Each edition names the safeguard by its key words, as the things it must not wait for stand beside it.
  if (en)
    growName(t, ["Necessary safeguards"], [safeguards], E, CONTENT_CY - SR - NAME_GAP, {
      valign: "bottom",
      alpha: g4,
      color: P.evidence,
    });
  else {
    const term = ["必要的保障"],
      NW = 620;
    termRow(
      t,
      term,
      [safeguards],
      [],
      [],
      E,
      CONTENT_CY - SR - NAME_GAP - termRowLayout(term, [], NW).height,
      { width: NW, alpha: g4, color: P.evidence },
    );
    const lit = span(t, cue(s, "这类保障", "") - 0.15, onlyAt - 0.1, 0.3);
    if (lit > 0)
      ring(SX, CONTENT_CY, SR + 16, {
        color: P.evidence,
        alpha: lit * restMark(P.evidence, 0.5) * g4,
        width: 2,
      });
  }
  // The two later events, each on its own words.
  const names = en ? ["An incident", "A new practice's admission"] : ["出事", "新做法获批"];
  [incidentAt, approvalAt].forEach((at, k) => {
    const q = ramp(t, at - 0.15, 0.4) * g4,
      y = ys[k];
    if (k) seal(EX, y, 22, { color: P.authority, alpha: q, hollow: true });
    else {
      ring(EX, y, 22, { color: P.unknown, alpha: q, width: 2.5 });
      text("!", EX, y + 1, 26, { role: "mark", align: "center", color: P.unknown, alpha: q });
    }
    nameText(names[k], EX + 30 + NAME_GAP, y, {
      align: "left",
      width: 380,
      alpha: g4 * named(t, at),
    });
  });
  const reach = mix(ys[0] + 30, ys[1] + 30, soon(t, pauseHold(approvalAt - 0.45, 0.4), 0.4));
  path(
    [
      [BX + 16, ys[0] - 30],
      [BX, ys[0] - 30],
      [BX, reach],
      [BX + 16, reach],
    ],
    { color: P.line, alpha: g4 * named(t, incidentAt), width: 2 },
  );
  // The waiting way is refused: it draws on from the safeguard toward the things it must not wait for and stops at a
  // bar halfway to the Chinese bracket's place, 1238 px. The English events stand 85 px further left, and their way
  // keeps that stop, so the safeguard's own build-up, with its way and bar, stands as near the centre as before.
  const go = soon(t, noWait - 0.05, 0.6),
    wayEnd = 1238,
    stopX = (SX + SR + 12 + wayEnd) / 2;
  link(SX + SR + 12, CONTENT_CY, wayEnd, CONTENT_CY, {
    color: P.unknown,
    alpha: g4 * ramp(t, noWait - 0.05, 0.3),
    upto: 0.5 * go,
    end: false,
    dash: [8, 8],
  });
  line(stopX, CONTENT_CY - 34, stopX, CONTENT_CY + 34, {
    color: P.unknown,
    alpha: g4 * ramp(t, noWait + 0.45, 0.3),
    width: 4,
  });
  if (!en)
    nameText("不能等", stopX, CONTENT_CY + 34 + NAME_GAP, {
      valign: "top",
      alpha: g4 * named(t, noWait),
    });
  // The safeguard is put in place now, within the authority that already exists: it stands on that authority's line,
  // which is drawn and named below it on the words that name it.
  const withinAt = cue(s, "在现有权限里", "within existing authority");
  const groundY = CONTENT_CY + SR + 20,
    oblige = L("在现有权限里", "Within existing authority");
  line(E, groundY, SX + SR * 0.85, groundY, {
    color: P.authority,
    alpha: g4 * ramp(t, withinAt - 0.15, 0.4),
    width: 3,
  });
  nameText(oblige, E, groundY + NAME_GAP, {
    align: "left",
    valign: "top",
    color: P.authority,
    alpha: g4 * named(t, withinAt),
  });
  // A trial only chooses and verifies how to meet the safeguard, not whether: ways fan out below it, and the trial
  // lights the one it chooses; it then verifies it: the chosen way's end turns to a check on the words that verify it.
  const TY = groundY + NAME_GAP + blockHeight(1) + 44,
    tq = ramp(t, trialAt - 0.15, 0.4) * g4,
    pick = ramp(t, howAt - 0.1, 0.4);
  const verifyAt = cueFrom(s, "核验怎么做", "verifies", trialAt),
    verified = ramp(t, verifyAt - 0.1, 0.4);
  dot(E + 6, TY, 6, { color: P.ink, alpha: tq });
  [-22, 0, 22].forEach((dy, k) => {
    const color = k === 1 ? blend(P.line, P.evidence, pick) : P.line;
    line(E + 12, TY, E + 64, TY + dy, { color, alpha: tq, width: k === 1 ? 2.5 + pick : 2 });
    dot(E + 70, TY + dy, 5, { color, alpha: tq * (k === 1 ? 1 - verified : 1) });
  });
  check(E + 70, TY, 20, {
    color: P.evidence,
    alpha: tq * verified,
    draw: { t, at: verifyAt + 0.05 },
  });
  const trialX = E + 70 + 12 + NAME_GAP,
    trialY = TY - labelSize(LABEL) / 2;
  if (en)
    growName(t, ["A trial", " only chooses and verifies how"], [trialAt, onlyAt], trialX, trialY, {
      width: 560,
      alpha: g4,
    });
  else {
    // The trial is named on the word that first says it, and what it only does joins after it on its own clause, in
    // the qualifier's size: the two are said in different clauses, so they are two names.
    nameText("试点", trialX, TY, { align: "left", alpha: g4 * named(t, trialAt) });
    nameText("只用来选定、核验怎么做", trialX + measure("试点") + TERM_GAP, TY, {
      align: "left",
      size: NOTE,
      color: P.muted,
      alpha: g4 * named(t, onlyAt),
    });
    // The decision the trial never makes, whether to meet the safeguard at all, is refused on its words (不决定做不做),
    // on the line under the trial's name, from its edge, so the line keeps one size.
    const whetherAt = cueFrom(s, "决定做不做", "", trialAt);
    rejectedName("决定做不做", trialX, TY + labelSize(LABEL) * LEADING, {
      align: "left",
      alpha: g4 * named(t, whetherAt),
      mark: ramp(t, whetherAt + 0.05, 0.35),
    });
  }
}

/* Stage 5: the rule and the four reasons, any one of which retires it. */
export function s26Retire(t, retire, reasons, reasonNames, judged, g5) {
  const RX = 1300,
    RW = 150,
    RH = 190,
    LX = 560,
    out = ramp(t, retire + 0.05, 0.4);
  const tops = stackTops(
      reasonNames.map(() => labelSize(LABEL)),
      CONTENT_CY,
      26,
    ),
    ys = tops.map((top) => top + labelSize(LABEL) / 2);
  const BX = LX + Math.max(...reasonNames.map((v) => measure(v))) + 40;
  reasons.forEach((at, i) => {
    const q = ramp(t, at - 0.15, 0.4) * g5,
      lit = speaking(t, reasons, i);
    ring(LX - 34, ys[i], 14 + 2 * lit, { color: P.unknown, alpha: q, width: 2.5 });
    dot(LX - 34, ys[i], 5, { color: P.unknown, alpha: q });
    nameText(reasonNames[i], LX, ys[i], {
      align: "left",
      alpha: g5 * listIn(t, reasons, i),
      set: "reasons",
    });
  });
  const held = reasons.reduce(
    (b, at, i) => mix(b, ys[i] + 24, soon(t, pauseHold(at - 0.45, 0.4), 0.4)),
    ys[0] + 24,
  );
  path(
    [
      [BX - 16, ys[0] - 24],
      [BX, ys[0] - 24],
      [BX, held],
      [BX - 16, held],
    ],
    { color: P.line, alpha: g5 * ramp(t, reasons[0] - 0.15, 0.4), width: 2 },
  );
  // The rule: a page crossed through and dimmed when retired. It stands with its name from the stage's first
  // words, as the subject the reasons describe. It is drawn as 23's pages are, its ruled rows in one stroke, so the
  // rows read as the page's text rather than as a list of rows whose last the retirement's name below would seem to
  // name.
  const ruleOn = named(t, judged);
  link(BX, CONTENT_CY, RX - RW / 2 - 14, CONTENT_CY, {
    alpha: g5 * clamp((held - CONTENT_CY) / 80),
    end: false,
  });
  s23Page(RX - RW / 2, CONTENT_CY - RH / 2, RW, RH, {
    alpha: g5 * ruleOn * mix(1, 0.7, out),
    rows: 4,
    stroke: blend(P.ink, P.muted, out),
  });
  nameText(L("规则", "A rule"), RX, CONTENT_CY - RH / 2 - NAME_GAP, {
    valign: "bottom",
    alpha: g5 * ruleOn,
  });
  cross(RX + RW / 2 + 44, CONTENT_CY, 36, { alpha: g5 * out, width: 3.5 });
  nameText(L("撤掉", "Retire"), RX, CONTENT_CY + RH / 2 + NAME_GAP, {
    valign: "top",
    color: P.muted,
    alpha: g5 * named(t, retire),
  });
}

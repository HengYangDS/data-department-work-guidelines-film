/* 08's choice: the feasible options on one basis, the four things a recommendation states, the decision owner's
 * decision, and new facts that overturn a conclusion. */

import { ctx } from "../../canvas.js";
import { since } from "../../drawing/flows.js";
import { restMark } from "../../drawing/levels.js";
import { link } from "../../drawing/links.js";
import { box, diamond, dot, labelSize, line, measure, text } from "../../drawing/strokes.js";
import { clock, cross, documentIcon, person, ring, seal, token } from "../../drawing/symbols.js";
import { listIn, named, speaking } from "../../naming/lists.js";
import { NAME_GAP, nameText } from "../../naming/names.js";
import { CONTENT_CY, railNames, stackTops } from "../../naming/placement.js";
import { rejectedName } from "../../naming/rejected.js";
import { NOTE } from "../../naming/terms.js";
import { LABEL, P } from "../../palette.js";
import { L, en } from "../../timeline.js";
import { cueFrom } from "../../timing/cues.js";
import { mix, ramp, soon } from "../../timing/easing.js";
import { drawShare, glide } from "../../timing/pace.js";

/* Stage 3: the feasible options as the columns of one table, the status quo among them, on one basis. */
export function s08Options(s, t, choose, options, statusQuo, notProve, criteria, badgeAts, cmp) {
  // The table stands 20 px right of its place while it builds alone, and eases left to make room for the refused
  // qualities beside it, so the table alone and the table with them each stand about the centre and inside the safe
  // area: 115 px in Chinese, on the words that bring them, and 185 px in English, whose qualities stand on one line
  // over their verdict, on its last criterion's last word, so the table reaches its place as they arrive and the table
  // alone stands about the centre until then.
  const easeAt = en ? cueFrom(s, "", "cost", criteria.at(-1)) : badgeAts[0];
  ctx.save();
  ctx.translate(20 - L(115, 185) * glide(t, easeAt + 0.05, L(115, 185)), 0);
  // The options' headers hang from one line near the cards' top, so a header of two lines shares its first line with
  // the one-line headers; the headers stand at the note size in both editions, all three alike, so the status quo
  // stands whole on one line within its card with clear card on either side. The cards stay narrow enough to read as
  // cards rather than containers.
  const LR = 580,
    xs = [800, 1060, 1320],
    CW = 140,
    top = 400,
    headY = top + 46 - labelSize(LABEL) / 2,
    rowY = (i) => 550 + i * 58;
  const opened = [statusQuo, choose, choose];
  // A column reaches just past its latest row: it grows to each row 0.3 s before the row's words, over 0.4 s.
  const low = criteria.reduce(
    (h, at, i) => mix(h, rowY(i) + 40, soon(t, at - 0.3, 0.4)),
    top + 130,
  );
  xs.forEach((x, j) => {
    box(x - CW / 2, top, CW, low - top, {
      fill: P.row,
      stroke: P.line,
      alpha: ramp(t, opened[j] - 0.1, 0.4) * cmp,
      radius: 14,
      width: 2.5,
    });
  });
  // The choice still to be made, an open diamond at the table's corner, and the feasible options, the status quo
  // included, held together by one bracket over their columns, which the choice joins.
  const CX = LR - 24,
    BY = top - 46,
    opts = ramp(t, options - 0.15, 0.4) * cmp,
    open = cmp * named(t, choose);
  diamond(CX, BY, 20, { color: P.authority, alpha: open });
  text("?", CX, BY + 1, 22, { role: "mark", align: "center", color: P.authority, alpha: open });
  nameText(L("选择", "Choosing"), CX - 20 - NAME_GAP, BY, {
    align: "right",
    color: P.authority,
    alpha: open,
  });
  // The bracket holds the two options from their words and reaches on to the status quo as it is named.
  const xl = mix(xs[1], xs[0], glide(t, statusQuo - 0.3, xs[1] - xs[0]));
  link(CX + 26, BY, xl, BY, { alpha: opts, draw: { t, at: options - 0.1 } });
  link(xl, top - 14, xs[2], top - 14, {
    route: "vhv",
    mid: BY,
    end: false,
    alpha: opts,
    draw: { t, at: options - 0.1 },
  });
  nameText(L("可行的方案", "Feasible options"), xs[1], top - 46 - NAME_GAP, {
    valign: "bottom",
    alpha: cmp * named(t, options),
  });
  const headSize = NOTE;
  nameText(L(["维持现状"], ["Status quo"]), xs[0], headY, {
    valign: "top",
    size: headSize,
    alpha: cmp * named(t, statusQuo),
  });
  ["A", "B"].forEach((v, j) =>
    nameText(v, xs[j + 1], headY, {
      valign: "top",
      size: headSize,
      alpha: cmp * named(t, choose),
    }),
  );
  // Each criterion is a row across all the options; its cells are assessed on its own words, sweeping across every
  // option, and the row being named lights. The illustrative cells differ, so the row reads as a comparison.
  const rows = en
    ? ["Benefit", "Cost", "Risk", "Reversibility", "Opportunity cost"]
    : ["收益", "成本", "风险", "可逆性", "机会成本"];
  const fav = [
    [0.3, 0.8, 0.9],
    [0.8, 0.4, 0.1],
    [0.5, 0.6, 0.2],
    [1, 0.7, 0.3],
    [0.4, 0.5, 0.6],
  ];
  rows.forEach((v, i) => {
    const y = rowY(i),
      lit = speaking(t, criteria, i) * cmp,
      grid = ramp(t, criteria[i] - 0.15, 0.4) * cmp;
    line(LR + 40, y, xs[2] + CW / 2, y, { color: P.line, alpha: grid * 0.5, width: 2 });
    line(LR + 40, y, xs[2] + CW / 2, y, { color: P.muted, alpha: lit, width: 2.5 });
    xs.forEach((x, j) => {
      dot(x, y, 6, { color: P.line, alpha: grid, hollow: true });
      dot(x, y, 6 + 14 * fav[i][j] * soon(t, criteria[i] - 0.1 + j * 0.12, 0.4), {
        color: P.evidence,
        alpha: ramp(t, criteria[i] - 0.1 + j * 0.12, 0.3) * cmp,
      });
    });
    nameText(v, LR, y, { align: "right", alpha: cmp * listIn(t, criteria, i), set: "basis" });
  });
  // The qualities that do not prove a fit, said as one phrase: one name beside the table, refused with its verdict.
  const QX = xs[2] + CW / 2 + 30,
    QY = rowY(2),
    refuse = ramp(t, notProve - 0.1, 0.4);
  const qualities = rejectedName(
    L("新颖、完整、流行", "Novelty, completeness or popularity"),
    QX,
    QY,
    { align: "left", width: L(340, Infinity), alpha: cmp * named(t, badgeAts[0]), mark: refuse },
  );
  nameText(L("证明不了它合适", "does not prove a fit"), QX, qualities.bottom + 12, {
    align: "left",
    valign: "top",
    alpha: cmp * named(t, notProve),
  });
  ctx.restore();
}

/* Stage 4: the recommendation as a document whose spine reaches each of the four things it states. */
export function s08Recommendation(t, recommend, premise, objection, first, revisit, rec) {
  // The Chinese parts' names are short, so its recommendation stands 64 px right, centred on its extent. The English
  // document and its premises stand 60 px right until the strongest objection is named, and ease to their place then.
  ctx.save();
  ctx.translate(en ? 60 - 60 * glide(t, objection + 0.05, 60) : 64, 0);
  const parts = [premise, objection, first, revisit],
    LX = 1000,
    ys = stackTops([0, 0, 0, 0], CONTENT_CY, 96);
  const names = en
    ? ["Premises", "The strongest objection", "The first step", "What would trigger a revisit"]
    : ["前提", "最有力的反对意见", "第一步", "重新考虑"];
  documentIcon(560, CONTENT_CY - 130, 200, 260, { alpha: rec, rows: 4 });
  nameText(L("推荐方案", "A recommendation"), 660, CONTENT_CY + 130 + NAME_GAP, {
    valign: "top",
    alpha: rec * named(t, recommend),
  });
  const spine = 860,
    grow = (i) => soon(t, parts[i] - 0.15, 0.5);
  link(760 + 12, CONTENT_CY, spine, CONTENT_CY, { alpha: rec, end: false });
  // The spine runs up from the document's link to the first part, passing the second, and down to the third and then
  // the fourth.
  link(spine, CONTENT_CY, spine, ys[0], { alpha: rec * 0.9, upto: grow(0), end: false });
  link(spine, CONTENT_CY, spine, ys[3], {
    alpha: rec * 0.9,
    end: false,
    upto: (grow(2) * (ys[2] - CONTENT_CY) + grow(3) * (ys[3] - ys[2])) / (ys[3] - CONTENT_CY),
  });
  ys.forEach((y, i) => {
    const q = ramp(t, parts[i] - 0.1, 0.4) * rec,
      lit = speaking(t, parts, i) * rec;
    link(spine, y, LX - 34 - 13, y, { alpha: rec * 0.8, upto: grow(i), end: false });
    dot(LX - 34, y, 13, { color: P.evidence, alpha: q });
    if (lit > 0)
      ring(LX - 34, y, 21, {
        color: P.evidence,
        alpha: lit * restMark(P.evidence, 0.5),
        width: 2,
      });
    nameText(names[i], LX, y, {
      align: "left",
      alpha: rec * listIn(t, parts, i),
      set: "recommendation",
    });
  });
  ctx.restore();
}

/* Stage 5: the decision owner, whose way runs to the decision and seals it. */
export function s08Decision(s, t, holder, notDecision, decisionName, decides, phrases, shown, dec) {
  // The owner and the decision stand 840 px apart and the seal is 58 px in radius, so the two cover the band while
  // they stand alone, before the phrases arrive.
  const Y = CONTENT_CY - 50,
    px = 560,
    sx = 1400,
    SR = 58,
    jx = 820,
    stop = 1250,
    ys = [Y - 170, Y - 90, Y + 130];
  person(px, Y - 6, { alpha: dec, color: P.authority, size: 1.3 });
  nameText(L("决策负责人", "The decision owner"), px, Y + 50 + NAME_GAP, {
    valign: "top",
    color: P.authority,
    alpha: dec * named(t, holder),
  });
  // The person's way runs to the decision and seals it on "decides".
  link(px + 44, Y, sx - SR - 14, Y, {
    color: P.authority,
    alpha: dec,
    draw: { t, at: holder - 0.1, least: decides - holder + 0.3 },
    width: 2.5,
  });
  seal(sx, Y, SR, { alpha: ramp(t, decides - 0.1, 0.4) * dec });
  nameText(L("决定", "Decides"), sx, Y + SR + NAME_GAP, {
    valign: "top",
    alpha: dec * named(t, decisionName),
  });
  // The refused phrases stand over or under their branches, centred on the branches' axis with their crosses as one
  // unit, as a lone refusal is centred. Where two of them stand stacked on one side they read as a list, and all its
  // crosses stand in one column after the longest phrase; where each stands alone on its side, its cross follows it.
  // Until its cross enters, a phrase alone stands centred on its branch, and it moves into its unit as the cross enters.
  const refuse = ramp(t, notDecision + 0.05, 0.4),
    cs = Math.min(26, labelSize(LABEL) * 0.9),
    px0 = (jx + stop) / 2 - (16 + cs) / 2;
  const stacked = ys.some((y, i) => ys.some((v, k) => k !== i && v > Y === y > Y));
  const widths = phrases.map((v) => measure(v)),
    markAt = (i) => px0 + (stacked ? Math.max(...widths) : widths[i]) / 2 + 16;
  shown.forEach((at, i) => {
    const y = ys[i],
      below = y > Y;
    link(jx, Y, stop, y, {
      route: "vh",
      alpha: dec * ramp(t, at - 0.15, 0.3),
      draw: { t, at: at - 0.1 },
      end: false,
    });
    line(stop, y - 18, stop, y + 18, { color: P.unknown, alpha: refuse * dec, width: 4 });
    rejectedName(
      phrases[i],
      mix((jx + stop) / 2, px0, refuse),
      y + (below ? NAME_GAP : -NAME_GAP),
      {
        valign: below ? "top" : "bottom",
        alpha: dec * mix(listIn(t, shown, i), named(t, at), refuse),
        mark: refuse,
        set: "phrases",
        markLeft: markAt(i),
      },
    );
  });
  const states = [
    ["待决定", "ready for decision"],
    ["受阻", "blocked"],
    ["暂缓", "deferred"],
  ].map(([zh, english]) => cueFrom(s, zh, english, notDecision));
  const SY = Y + 280,
    sxs = [680, 960, 1240];
  states.forEach((at, i) => {
    const x = sxs[i],
      q = dec * ramp(t, at - 0.1, 0.4),
      go = soon(t, at - 0.05, 0.6);
    if (i === 0) {
      documentIcon(x - 60, SY - 26, 40, 52, { alpha: q, rows: 2 });
      seal(x + 24, SY, 26, { alpha: q, hollow: true });
    } else if (i === 1) {
      // The stopped way stands centred on its name: it runs from 40 px left of the name's centre to its bar 40 px right.
      link(x - 40, SY, x + 26, SY, { alpha: q, upto: go, end: false });
      token(mix(x - 40, x + 14, go), SY, { alpha: q, r: 11 });
      line(x + 38, SY - 22, x + 38, SY + 22, { color: P.unknown, alpha: q, width: 4 });
    } else {
      token(x - 30, SY, { alpha: q, r: 11 });
      clock(x + 22, SY, 22, { hand: 0.25, color: P.muted, alpha: q });
    }
    nameText(
      en ? ["Ready for decision", "Blocked", "Deferred"][i] : ["待决定", "受阻", "暂缓"][i],
      x,
      SY + 30 + NAME_GAP,
      { valign: "top", alpha: dec * listIn(t, states, i), set: "readiness" },
    );
  });
}

/* Stage 6: new facts arriving after a conclusion and crossing it out, on one way in time. */
export function s08NewFacts(t, overturn, conclusion, overturned, correct, defend, sunkCue, fix) {
  // The way's three pages stand with the new facts 30 px left of the centre, so the stage, the cross beside the old
  // conclusion on its left included, stands centred once the correction arrives. Until the correction is named the
  // conclusion and the new facts stand 150 px right, centred, and the stage eases left on its words.
  ctx.save();
  ctx.translate(150 - 150 * glide(t, correct + 0.05, 150), 0);
  const Y = 470,
    xs = [550, 990, 1430],
    PW = 200,
    PH = 290,
    FW = 170,
    FH = 220,
    my = Y + PH / 2 + 70,
    SR = 54;
  // The way reaches the new facts first and runs on past them to the correction.
  const from = xs[0] + PW / 2 + 12,
    to = xs[2] - PW / 2 - 12,
    facts = (xs[1] - FW / 2 - 12 - from) / (to - from);
  link(from, Y, to, Y, {
    alpha: fix * 0.9,
    upto: mix(facts, 1, drawShare(t, correct - 0.1, (1 - facts) * (to - from))),
    end: false,
    flowing: since(t, correct + 0.5),
  });
  // The overturned conclusion steps back to the authority's level as a cross stands beside it, on the side away from
  // the way, so the two never meet.
  const old = fix * mix(1, restMark(P.authority), ramp(t, overturned + 0.05, 0.4)),
    fresh = ramp(t, correct - 0.1, 0.4) * fix;
  documentIcon(xs[0] - PW / 2, Y - PH / 2, PW, PH, { alpha: old, rows: 0 });
  seal(xs[0], Y - 8, SR, { alpha: old });
  cross(xs[0] - PW / 2 - 40, Y, 34, { alpha: ramp(t, overturned + 0.05, 0.4) * fix, width: 4 });
  documentIcon(xs[1] - FW / 2, Y - FH / 2, FW, FH, { alpha: fix, rows: 3, stroke: P.evidence });
  documentIcon(xs[2] - PW / 2, Y - PH / 2, PW, PH, { alpha: fresh, rows: 0 });
  seal(xs[2], Y - 8, SR, { alpha: fresh });
  railNames(
    en ? ["A conclusion", "New facts", "Correct it"] : ["结论", "新的事实", "就改"],
    xs,
    Y - PH / 2,
    {
      side: -1,
      gap: NAME_GAP,
      alpha: (i) =>
        fix * named(t, [Math.min(conclusion, overturn + 0.2), overturn + 0.2, correct][i]),
    },
  );
  // Sunk costs: spent blocks under the old conclusion, which stand as they are named; their way up to it stops short
  // at a bar.
  [0, 1, 2].forEach((k) =>
    box(xs[0] - 60, my + k * 34, 120, 26, {
      fill: P.row,
      stroke: P.muted,
      alpha: fix * named(t, defend),
      radius: 4,
    }),
  );
  link(xs[0], my - 14, xs[0], my - 72, {
    alpha: fix * named(t, defend),
    draw: { t, at: defend - 0.05 },
    end: false,
  });
  line(xs[0] - 22, my - 72, xs[0] + 22, my - 72, {
    color: P.unknown,
    alpha: ramp(t, sunkCue + 0.05, 0.3) * fix,
    width: 4,
  });
  rejectedName(L("被沉没成本绑住", "Defending sunk costs"), xs[0] + 60 + NAME_GAP, my + 47, {
    align: "left",
    alpha: fix * named(t, defend),
    mark: ramp(t, sunkCue + 0.05, 0.4),
  });
  ctx.restore();
}

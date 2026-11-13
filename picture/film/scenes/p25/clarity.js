/* 25's clarity in practice: its concrete checks beside the page, and the outside reader before sending. */

import { blend } from "../../drawing/colour.js";
import { restMark } from "../../drawing/levels.js";
import { link } from "../../drawing/links.js";
import { s23Page } from "../../drawing/pages.js";
import { box, dot, labelSize, line, measure } from "../../drawing/strokes.js";
import { check, person, ring } from "../../drawing/symbols.js";
import { listLevel, named, speaking } from "../../naming/lists.js";
import { LEADING, NAME_GAP, nameText, wrapName } from "../../naming/names.js";
import { CONTENT_CY, stackTops } from "../../naming/placement.js";
import { NOTE, TERM_GAP, termRow, termRowLayout } from "../../naming/terms.js";
import { LABEL, P } from "../../palette.js";
import { L, en } from "../../timeline.js";
import { cue } from "../../timing/cues.js";
import { ramp } from "../../timing/easing.js";
import { glide, glideTime, smoother } from "../../timing/pace.js";
import { voiceTime } from "../../timing/pauses.js";
import { STAGE_CUT } from "../../timing/stages.js";

/* Stage 4: the page and its checklist row for row, each check lighting the part of the page it governs. */
export function s25ClarityChecks(s, t, concrete, onePoint, terms, gc) {
  const firstUse = cue(s, "第一次出现", "defined at first use");
  const rows = en
    ? [
        [["One point to a paragraph"], [onePoint], [], []],
        [["Terms"], [terms], ["defined at first use"], [firstUse]],
      ]
    : [
        [["一段只讲一个意思"], [onePoint], [], []],
        [["术语"], [terms], ["第一次出现就讲明白"], [firstUse]],
      ];
  const rowW = ([term, , qual]) =>
    measure(term.join("")) + (qual.length ? TERM_GAP + measure(qual.join(""), NOTE) : 0);
  // With two checks the page is wider and the rows further apart, so the page and its list still fill the stage.
  const PW = 400,
    listW = Math.max(...rows.map(rowW)),
    groupW = PW + 120 + 50 + listW,
    LX = 960 - groupW / 2 + PW + 120 + 50;
  // English names the checks over a second before the first of them: the page stands alone on the centre until then and
  // makes room for them in a glide from the thought's first word, "Clarity", so it has cleared the first check's box
  // before the box appears.
  const room = (groupW - PW) / 2,
    px =
      960 - groupW / 2 + (en ? room * (1 - glide(t, cue(s, "", "clarity has") + 0.05, room)) : 0);
  const starts = rows.map((r) => r[1][0]),
    tops = stackTops(
      rows.map(([term, , qual]) => termRowLayout(term, qual, Infinity).height),
      CONTENT_CY + 50,
      120,
    );
  const mids = tops.map((v) => v + labelSize(LABEL) / 2),
    ticked = starts.map((at) => ramp(t, at - 0.15, 0.4) * gc);
  // The head names the checks; the page stands with its parts at the structure tier from the stage's first words, and
  // each check's box arrives with its tick on its own words.
  const hy3 = tops[0] - 110,
    headA = named(t, concrete) * gc;
  ring(px + 15, hy3, 15, { color: P.ink, alpha: headA, width: 2.5 });
  dot(px + 15, hy3, 6, { color: P.ink, alpha: headA });
  nameText(L("具体的标准", "Concrete checks"), px + 30 + NAME_GAP, hy3, {
    align: "left",
    alpha: headA,
  });
  const pt = hy3 + 46,
    pb = mids[1] + 60;
  box(px, pt, PW, pb - pt, { fill: P.row, stroke: P.line, alpha: gc, radius: 10 });
  const lit = (i, base2 = P.line) => blend(base2, P.evidence, ticked[i] / Math.max(gc, 1e-6));
  // The English page opens on the centre, where the message's lines stood a moment before, so its parts come up over
  // 0.2 s from the cut rather than read as those lines jumping to new places.
  const part = gc * (en ? ramp(t, concrete + STAGE_CUT, 0.2) : 1);
  // One point to a paragraph: each paragraph's point and its line.
  [-16, 16].forEach((dy) => {
    dot(px + 42, mids[0] + dy, 5, { color: lit(0), alpha: part });
    line(px + 62, mids[0] + dy, px + PW - 40 - (dy > 0 ? 60 : 0), mids[0] + dy, {
      color: P.line,
      alpha: part,
      width: 2,
    });
  });
  // A line of text whose term is marked where it first appears.
  line(px + 30, mids[1], px + PW - 30, mids[1], { color: P.line, alpha: part, width: 2 });
  line(px + 110, mids[1] + 12, px + 200, mids[1] + 12, { color: lit(1), alpha: part, width: 4 });
  // When the last check's closing words are said the list is whole: every row returns to full ink; the row being
  // spoken keeps its light.
  const whole = ramp(t, cue(s, "讲明白", "first use") + 0.05, 0.4);
  rows.forEach(([term, termAts, qual, qualAts], i) => {
    const cx3 = LX - 50,
      on = speaking(t, starts, i);
    box(cx3 - 16, mids[i] - 16, 32, 32, {
      stroke: blend(P.line, P.ink, on),
      alpha: ticked[i],
      radius: 6,
      width: 2,
    });
    check(cx3, mids[i], 22, { alpha: ticked[i] });
    termRow(t, term, termAts, qual, qualAts, LX, tops[i], {
      alpha: gc * Math.max(listLevel(t, starts, i), whole),
      set: "checks",
    });
  });
}

/* Stage 4b: the draft sent on to an outside reader before it is sent. */
export function s25OutsideReader(s, t, beforeSend, outsider, restate, gr) {
  const names = en
    ? ["Conclusion", "Basis", "Limits", "Next action"]
    : ["结论", "依据", "限度", "下一步"];
  // The column stands where the whole stage centres; both editions show the draft alone and then with its reader before
  // the column, so the two stand right of their places, centred (157 px in Chinese, 110 in English, whose reader's
  // name is wider), and glide into their places just before the column's first item inks in, so the column's stem
  // never crosses the reader's name.
  const aside = L(157, 110),
    readerGlide = glideTime(aside);
  const reach =
    aside *
    (1 - smoother((voiceTime(t) - voiceTime(restate[0] - 0.15) + readerGlide) / readerGlide));
  const DX = 420 + reach,
    DW = 190,
    DH = 280,
    my = CONTENT_CY,
    ox = L(1130, 1100) + reach,
    CX = 1130 + 210;
  const tops = stackTops(
      names.map(() => labelSize(LABEL)),
      my,
      64,
    ),
    mids = tops.map((v) => v + labelSize(LABEL) / 2);
  s23Page(DX, my - DH / 2, DW, DH, { alpha: gr, rows: 4 });
  nameText(L("发出之前", "Before sending"), DX, my - DH / 2 - NAME_GAP, {
    align: "left",
    valign: "bottom",
    alpha: gr * named(t, beforeSend),
  });
  // The draft goes to the outside reader: one point glides along the way once the reader is named.
  const reads = glide(t, outsider, ox - 50 - DX - DW - 24);
  const ou = named(t, outsider) * gr;
  link(DX + DW + 24, my, ox - 50, my, {
    alpha: ou,
    draw: { t, at: outsider - 0.15 },
    flow: reads > 0 && reads < 1 ? reads * 0.999 : null,
  });
  person(ox, my + 6, { alpha: ou, color: P.muted, size: 1.3 });
  // The reader's name hangs under the reader; a last line that would nearly meet a line of the column beside it stands
  // on that line instead.
  // The English name stands whole on one line, as no break keeps its phrase in an even block; its reader stands 30 px
  // further left, so the name keeps 40 px from the column's stem.
  const readerName = L("局外人", "A reader outside the work"),
    readerTop = my + 6 + 15 * 1.3 * 2.6 + NAME_GAP;
  const readerLast =
    readerTop +
    labelSize(LABEL) / 2 +
    (wrapName(readerName, 360).length - 1) * labelSize(LABEL) * LEADING;
  const meets = mids.find((m) => Math.abs(m - readerLast) < 13);
  nameText(readerName, ox, readerTop + (meets === undefined ? 0 : meets - readerLast), {
    valign: "top",
    width: 360,
    color: P.muted,
    alpha: ou,
  });
  // What the reader could restate: the column's stem and its link from the reader draw with the first item, and each
  // item brings its branch, its point and its name on its own words.
  const col = named(t, restate[0]) * gr;
  link(ox + 40, my, CX - 30, my, { alpha: col * 0.8, end: false });
  line(CX - 30, mids[0], CX - 30, mids[3], { color: P.line, alpha: col, width: 2 });
  // The column is whole on its last word, inside the thought: every name returns to full ink; the last keeps its light.
  const whole = ramp(t, cue(s, "步", "action", { last: true }) + 0.05, 0.25);
  names.forEach((v, i) => {
    const got = named(t, restate[i]),
      lit = speaking(t, restate, i);
    link(CX - 30, mids[i], CX - 13, mids[i], { alpha: gr * 0.8 * got, end: false, r: 0 });
    dot(CX, mids[i], 6 + 2 * lit, { color: P.evidence, alpha: got * gr });
    if (lit > 0)
      ring(CX, mids[i], 18, {
        color: P.evidence,
        alpha: lit * restMark(P.evidence, 0.5) * gr,
        width: 2,
      });
    nameText(v, CX + 11 + NAME_GAP, mids[i], {
      align: "left",
      alpha: gr * got * Math.max(listLevel(t, restate, i), whole),
      set: "restate",
    });
  });
}

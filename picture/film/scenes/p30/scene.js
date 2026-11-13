/* 30 coda: back to the dataset. The scene: its cues and the cuts between its stages, each stage on the words that name
 * it. */

import { reportCard } from "../../drawing/datasets.js";
import { since } from "../../drawing/flows.js";
import { restMark } from "../../drawing/levels.js";
import { link } from "../../drawing/links.js";
import { s23Page } from "../../drawing/pages.js";
import { dot, labelSize, line, measure, path, text } from "../../drawing/strokes.js";
import { check, person, ring } from "../../drawing/symbols.js";
import { clearOfTitle, illustrative, opening } from "../../framing/chapters.js";
import { beats, listIn, listLevel, named, speaking } from "../../naming/lists.js";
import { NAME_GAP, nameText, wrapName } from "../../naming/names.js";
import { blockHeight, growTexts } from "../../naming/parts.js";
import { CONTENT_CY, RAIL_WRAP, railNames, stackTops } from "../../naming/placement.js";
import { LABEL, P } from "../../palette.js";
import { L, en } from "../../timeline.js";
import { cue, cues } from "../../timing/cues.js";
import { mix, ramp, soon } from "../../timing/easing.js";
import { glide } from "../../timing/pace.js";
import { HOLD, pauseHold } from "../../timing/pauses.js";
import { STAGE_CUT, stageIn, stageOut } from "../../timing/stages.js";
import { scenes } from "../registry.js";

scenes["30"] = function (s, t) {
  const [back, next, finished, rely] = cues(s, [
    ["回到开头那份价格数据", "back to the price dataset"],
    ["下一位用它的人", "its next user"],
    ["做完了", "a finished dataset"],
    ["可靠", "reliable"],
  ]);
  const needs = cues(s, [
    ["清楚的含义", "clear meaning"],
    ["当时能拿到的事实", "the facts available"],
    ["对得上说法的证据", "evidence matching"],
    ["经过准入", "an admitted"],
  ]);
  const results = cues(s, [
    ["发布指南", "publishing these guidelines"],
    ["真正采用它", "adopting them"],
    ["让工作变好", "improving the work"],
  ]);
  const three = cue(s, "三回事", "three different results");
  // Real work shows the last two results: Chinese names the two before what shows them, English after it.
  const [lastTwo, realAt, show] = cues(s, [
    ["后两件", "the last two"],
    ["真实的工作", "real work"],
    ["才能证明", "can show"],
  ]);
  const [q1, q2, q3, yes] = cues(s, [
    ["问题解决了吗", "was the problem solved"],
    ["判断经过检验", "was the judgment tested its limits clear"],
    ["下一次", "and is the"],
    ["肯定的", "yes"],
  ]);
  const base = ramp(t, opening(s), 0.7);
  // 1. The opening's dataset returns, with its next user to its right and the four things that user needs in one column
  // beside them, as in the opening; now each need arrives with its check as it is named. The stage holds through the next
  // thought, which refers to the four: the card is named finished, and the way to the user turns to evidence as the
  // dataset becomes reliable. The illustrative chip stands with the dataset and leaves with
  // this stage.
  const g1 = base * stageOut(t, results[0]);
  const needNames = en
    ? [
        "Clear meaning",
        "Facts available then",
        "Evidence matching claims",
        "An admitted, bounded use",
      ]
    : ["清楚的含义", "当时能拿到的事实", "对得上说法的证据", "经过准入、有边界的用途"];
  // The settled stage: the opening's positions, moved in as far as the longest need requires to stay inside the safe
  // area, and then left until the card, its user and the needs centre (60 px in Chinese, 80 in English); the needs stand
  // far enough right of the user that the user's name keeps clear of their column. While it builds, the card stands
  // alone on the centre, eases left as its next user is named so the two stand centred, and moves on with the user as
  // the needs begin.
  const QX =
      Math.min(1370, 1790 - 17 - NAME_GAP - Math.max(...needNames.map((v) => measure(v, LABEL)))) +
      L(-60, -80),
    PX0 = QX - 200;
  const Y1 = CONTENT_CY + 48,
    K = 1.4,
    CX0 = Math.min(330 + L(-60, -80), PX0 - 300 * K - 370),
    CY = Y1 - 180 * K;
  const userAt = Math.min(next, cue(s, "下一位用它的人", "with") + 0.05);
  const pair = (1920 - (PX0 - CX0) - measure(L("下一位用它的人", "Its next user")) / 2) / 2 - CX0;
  const lone = 960 - 150 * K - CX0,
    onward = glide(t, needs[0] - 0.1, Math.max(Math.abs(pair), Math.abs(pair - lone)));
  const CX = CX0 + mix(mix(lone, pair, glide(t, userAt - 0.1, pair - lone)), 0, onward),
    PX = PX0 + pair * (1 - onward),
    edgeX = CX + 300 * K;
  const lift = (y) => clearOfTitle(s, t, y);
  // The chip stands in the head band, clear of the rising title, so it waits for the first words rather than ink in
  // with the card in the quiet before them, and fades in over 0.4 s.
  illustrative(g1 * Math.min(lift(CY), ramp(t, s.words[0].start - HOLD, 0.4)));
  if (g1 > 0) {
    // The next user stands as the sentence that returns to the dataset ends, and is named on its own words.
    const card = g1 * lift(CY),
      user = named(t, Math.min(next, cue(s, "下一位用它的人", "with") + 0.05)) * g1 * lift(Y1 - 60);
    reportCard(CX, CY, { alpha: card, scale: K, done: 1, named: card * named(t, back) });
    // The card is named finished over its top, as a page is named over it, clear of the card's ruled rows below.
    nameText(L("做完了", "A finished dataset"), CX + 150 * K, CY - NAME_GAP, {
      valign: "bottom",
      alpha: g1 * named(t, finished),
    });
    // The next user appears when named.
    person(PX, Y1, { alpha: user, size: 1.4 });
    nameText(L("下一位用它的人", "Its next user"), PX, Y1 + 32 + NAME_GAP, {
      valign: "top",
      alpha: named(t, next) * g1 * lift(Y1 - 60),
    });
    // The way to the user draws on as the user is named; it turns to evidence and carries one point once the dataset is
    // reliable, and that word is named above it.
    const relied = ramp(t, rely - 0.1, 0.5);
    link(edgeX + 20, Y1, PX - 60, Y1, { alpha: user, draw: { t, at: next - 0.1 } });
    // Its point starts at the way's start as the way turns, so it enters by its size.
    link(edgeX + 20, Y1, PX - 60, Y1, {
      color: P.evidence,
      alpha: g1 * relied,
      width: 2.5,
      flowing: since(t, rely + 0.1),
    });
    nameText(L("可靠", "Reliable"), (edgeX + PX - 40) / 2, Y1 - NAME_GAP, {
      valign: "bottom",
      width: PX - edgeX - 110,
      alpha: g1 * named(t, rely),
    });
    const names = needNames,
      tops = stackTops(
        names.map(() => blockHeight(1)),
        Y1,
        40,
      );
    names.forEach((v, i) => {
      const y = tops[i] + labelSize(LABEL) / 2,
        on = ramp(t, needs[i] - 0.15, 0.4) * g1,
        lit = speaking(t, needs, i);
      ring(QX, y, 17, { color: P.evidence, alpha: on, width: 2.5 });
      check(QX, y + 1, 18, { color: P.evidence, alpha: on, draw: { t, at: needs[i] - 0.1 } });
      if (lit > 0)
        ring(QX, y, 25, {
          color: P.evidence,
          alpha: lit * restMark(P.evidence, 0.5) * g1,
          width: 2,
        });
      nameText(v, QX + 17 + NAME_GAP, y, {
        align: "left",
        alpha: g1 * listIn(t, needs, i),
        set: "needs",
      });
    });
  }
  // 2. Three different results stand as three columns of one table: each result draws its ring on its own words, and
  // rules between the columns set them apart on the words that count them as different. Real work runs under the table
  // as its ground, drawn on its words; on the words that say it can show them, one point rises from it into each of the
  // last two columns, whose check stands once the two are named: the first result, which publishing shows, keeps its
  // place empty. Row heads at one right edge name the results' row and the ground on their words.
  const asks = q1,
    g2 = base * stageIn(t, results[0]) * stageOut(t, asks);
  if (g2 > 0) {
    const names = en
      ? ["Publishing these guidelines", "Adopting them", "Improving the work"]
      : ["发布指南", "真正采用它", "让工作变好"];
    const heads = en ? ["Three different results", "Real work"] : ["三回事", "真实的工作"];
    // The English columns stand 40 px wider, so the first result's name stands whole on one line between its rules. The
    // results are large enough that the first two, standing while the third is still to come, cover their share of the
    // band; their marks are drawn at the rings' scale.
    const R = 90,
      k = R / 62,
      D = L(380, 420),
      GAP = 70,
      wrap = D - 40,
      HW = Math.max(...heads.map((v) => measure(v, LABEL)));
    const lines = names.map((v) => wrapName(v, wrap)),
      nameHalf = Math.max(
        R,
        ...lines.map((ls) => Math.max(...ls.map((l) => measure(l, LABEL))) / 2),
      );
    // The table stands further right until its third result is named (105 px in Chinese, 60 in English), so the first
    // two stand about the centre, and eases back as a glide on the third result's words.
    const total = 2 * D + nameHalf + R + GAP + HW,
      rightUntil = L(105, 60) * (1 - glide(t, results[2] - 0.1, L(105, 60)));
    const x0 = L(940, 965) + rightUntil - total / 2 + R + GAP + HW,
      xs = [x0, x0 + D, x0 + 2 * D],
      HX = x0 - R - GAP;
    // The table stands a little below the content centre, so its first row, which stands alone while the results are
    // named, is not left in the upper part of the frame, and the whole table still balances on the centre.
    const bh = blockHeight(Math.max(...lines.map((ls) => ls.length))),
      span = 2 * R + 10 + NAME_GAP + bh + 76 + 120;
    const MY = CONTENT_CY + 50 - span / 2 + R + 10,
      EY = MY + R + NAME_GAP + bh + 76,
      WY = EY + 120;
    const left = xs[0] - R,
      right = xs[2] + R,
      shown = Math.max(show, lastTwo);
    // Real work is the ground, named on its words. Drawn at the tip pace from those words it would still be drawing when
    // the thought ends, so it stands whole from the stage's cut and comes in on them.
    link(left, WY, right, WY, {
      color: P.ink,
      alpha: g2 * ramp(t, realAt - 0.05, 0.4),
      width: 3,
      end: false,
    });
    results.forEach((at, i) => {
      const x = xs[i],
        on = ramp(t, at - 0.15, 0.4) * g2,
        lit = speaking(t, results, i);
      ring(x, MY, R, { color: P.ink, alpha: on, width: 2.5 });
      // The halo on the result being said stands at rest at 0.55 of full ink, 2.5 px wide, and enters and leaves as a
      // pulse does, its ink following its width, so it neither appears nor vanishes within a frame; its ink rises late in
      // its entrance and falls early in its exit, so two halos never stand firm together as one hands over to the next.
      if (lit > 0.02)
        ring(x, MY, R + 10, {
          color: P.ink,
          alpha: 0.55 * g2 * lit ** 3,
          width: Math.max(1, 2.5 * lit),
        });
      // The published guidelines are a page drawn as 23's pages are, its ruled rows in one stroke.
      if (i === 0) s23Page(x - 22 * k, MY - 30 * k, 44 * k, 58 * k, { alpha: on, rows: 3 });
      else if (i === 1) person(x, MY + 10 * k, { alpha: on, size: 1.15 * k });
      else
        path(
          [
            [x - 30 * k, MY + 18 * k],
            [x - 10 * k, MY],
            [x + 6 * k, MY + 8 * k],
            [x + 30 * k, MY - 20 * k],
          ],
          { color: P.ink, alpha: on, width: 3 },
        );
      if (!i) return;
      // Real work shows the result: its point rises from the ground into the column, in voice time once risen, and the
      // column's check stands under the result's name.
      const rise = soon(t, show - 0.05 + (i - 1) * 0.1, 0.5),
        proof = ramp(t, shown - 0.1 + (i - 1) * 0.12, 0.4) * g2;
      link(x, WY - 3, x, EY + 30, {
        alpha: g2,
        upto: rise,
        flowing: since(t, show + 0.45 + (i - 1) * 0.1),
        lag: i * 0.33,
      });
      ring(x, EY, 22, { color: P.evidence, alpha: proof, width: 2.5 });
      check(x, EY + 1, 22, {
        color: P.evidence,
        alpha: proof,
        draw: { t, at: shown + (i - 1) * 0.12 },
      });
    });
    railNames(names, xs, MY + R, {
      gap: NAME_GAP,
      wrap,
      alpha: (i) => g2 * listIn(t, results, i),
      set: "results",
    });
    // The count says the three are different results: rules between the columns stand on those words and set them apart.
    const apart = ramp(t, three - 0.15, 0.4) * g2;
    [0, 1].forEach((k) =>
      line(xs[k] + D / 2, MY - R - 10, xs[k] + D / 2, WY, {
        color: P.line,
        alpha: apart,
        width: 2,
      }),
    );
    [
      [MY, three, P.muted],
      [WY, realAt, P.ink],
    ].forEach(([y, at, color], k) =>
      nameText(heads[k], HX, y, { align: "right", color, alpha: g2 * named(t, at) }),
    );
  }
  // 3. The test in real work: three questions stand as three stations on one firm rail, the rail from the cut and each
  // station on its own words, where the question takes its station with a "?" and is named below it by its key words.
  // The questions stand left to right in the order asked, as the opening's three outcomes did, on a rail that is
  // balanced from the cut. As the last line turns to the answer to all three, the three stations light together; as it
  // answers them yes, each "?" gives way to a check, and as it says the work has value, one light bracket gathers the
  // three from above under that name, settled before the voice ends.
  const g3 = base * stageIn(t, asks);
  if (g3 > 0) {
    const [earlier, better, worth] = cues(s, [
      ["能不能更好地发现", "better able to recognize"],
      ["应对", "or handle"],
      ["这项工作就有了价值", "the work has value"],
    ]);
    // Each question is named by its spoken phrases, each line centred on its station; a phrase stays whole on its line.
    // The Chinese second question is its caption's whole line, so its name keeps its words without the closing 吗, the
    // station's "?" keeping the question, on one line, as its one comma gives no even break; the Chinese third is named
    // by its words from its subject, the work system, which it names on them.
    // The Chinese third question's station and name stand together on its subject, the work system.
    const third = en ? q3 : cue(s, "工作体系能不能", "");
    const asked = [q1, q2, third],
      ats = [[q1], [q2], [third, earlier, better]],
      all = cue(s, "三个答案", "the answer to all three");
    const answered = ramp(t, pauseHold(all - 0.1, 0.3), 0.3) * (1 - ramp(t, yes + 0.05, 0.3));
    // The Chinese third question has no clause mark from its subject on, so it stands whole on one line.
    const names = en
      ? [
          ["Problem solved?"],
          ["Judgment tested, limits clear?"],
          ["Better able to recognize", " or handle", " the next occurrence?"],
        ]
      : [["问题解决了吗"], ["判断经过检验，限度清楚"], ["工作体系能不能更好地发现或应对"]];
    // The rail, its names and the bracket with the value above it are balanced on the content centre. A name wraps no
    // wider than W, the third a little wider; in Chinese W is the rail's own wrap width, so its two long questions break
    // at their clause marks and neighbouring names stand well apart.
    const W = en ? 380 : RAIL_WRAP,
      R = 56,
      Y = CONTENT_CY - 20,
      xs = [520, 960, 1400],
      done = t >= yes + 0.05;
    const settle = ramp(t, asks + STAGE_CUT, 0.15);
    line(xs[0] - 230, Y, xs[2] + 230, Y, { color: P.line, alpha: g3 * settle, width: 3.5 });
    asked.forEach((at, i) => {
      // A station arrives on its question's words, held out of the quiet before a question that opens its thought, and
      // covers the rail where it sits quickly enough that the rail never runs through its "?".
      const x = xs[i],
        from = Math.max(pauseHold(at - 0.15, 0.4), i ? -Infinity : asks + STAGE_CUT),
        on = ramp(t, from, 0.4) * g3;
      const lit = Math.max(speaking(t, asked, i) * (i ? 1 : settle), answered);
      dot(x, Y, R, { color: P.ground, alpha: g3 * ramp(t, from, 0.1) });
      ring(x, Y, R, { color: P.evidence, alpha: on, width: 2.5 });
      if (lit > 0)
        ring(x, Y, R + 10, {
          color: P.evidence,
          alpha: lit * restMark(P.evidence, 0.45) * g3,
          width: 2,
        });
      // The question stands open until the words that answer it yes; the check then draws on in its place.
      // The question fades as the check begins to draw on in its place.
      text("?", x, Y + 2, 40, {
        role: "mark",
        align: "center",
        color: P.ink,
        alpha: on * (1 - ramp(t, yes - 0.2, 0.4)),
      });
      if (done) check(x, Y + 3, 36, { color: P.evidence, alpha: g3, draw: { t, at: yes + 0.05 } });
    });
    // The third question is asked over three phrases: its station beats on the words of each phrase after its first.
    beats(t, xs[2], Y, R + 10, [earlier, better], { color: P.evidence, alpha: g3 });
    // A name stands whole on its first words, so its lines are set as one name, centred on the station.
    names.forEach((parts, i) =>
      nameText(
        growTexts(parts, i < 2 ? W : W + 120).map((line) => line.map(([, v]) => v).join("")),
        xs[i],
        Y + R + NAME_GAP,
        {
          valign: "top",
          alpha: g3 * listLevel(t, asked, i) * named(t, ats[i][0]),
          set: "questions",
        },
      ),
    );
    // The work has value: one light bracket encloses the three from above, and the value is named over it. The outer
    // drops leave the bar's ends at the latest 0.4 s before the film's last word ends.
    const BY = Y - R - 64,
      reach = { t, at: worth - 0.1 },
      outer = Math.min(worth + 0.6, s.words.at(-1).end - 0.4);
    if (t >= reach.at) {
      link(960, BY, xs[0], BY, { alpha: g3, draw: reach, end: false });
      link(960, BY, xs[2], BY, { alpha: g3, draw: reach, end: false });
      // Each drop leaves the bar once the bar has reached it: the middle one at once, the outer ones at the bar's ends.
      xs.forEach((x, i) =>
        link(x, BY, x, Y - R - 14, {
          alpha: g3,
          end: false,
          draw: { t, at: i === 1 ? worth - 0.1 : outer },
        }),
      );
    }
    nameText(L("这项工作就有了价值", "The work has value"), 960, BY - NAME_GAP, {
      valign: "bottom",
      color: P.evidence,
      alpha: g3 * named(t, worth),
    });
  }
};

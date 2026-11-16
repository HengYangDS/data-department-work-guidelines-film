/* 26's first stage: what learning is for, on the lane of the next time. */

import { restMark } from "../../drawing/levels.js";
import { link } from "../../drawing/links.js";
import { box, dot, line, measure } from "../../drawing/strokes.js";
import { documentIcon, ring } from "../../drawing/symbols.js";
import { named } from "../../naming/lists.js";
import { NAME_GAP, nameText } from "../../naming/names.js";
import { growName } from "../../naming/parts.js";
import { rejectedName } from "../../naming/rejected.js";
import { P } from "../../palette.js";
import { L, en } from "../../timeline.js";
import { cue, cues } from "../../timing/cues.js";
import { mix, ramp, soon } from "../../timing/easing.js";
import { drawShare, glide } from "../../timing/pace.js";

/* Stage 1: the lane of the next time, and what learning changes along it. */
export function s26Learning(s, t, g1) {
  const [sooner, judge, less, more] = cues(s, [
    ["更早被发现", "earlier"],
    ["更容易判断", "judge it more easily"],
    ["少靠人救火", "less manual rescue"],
    ["让文件变多", "add files"],
  ]);
  const fails = en ? s.words[0].start : cue(s, "失败", "");
  // The files beside the lane's end come last, so the stage stands right of its place while it builds and moves left
  // as the files arrive in their place, settling within their words, so it stands centred both while it builds and once
  // it is whole: 65 px right and then 75 px left in Chinese, whose lane's name stands at its left; 25 px right and
  // then 100 px left in English, which names nothing there.
  const OFF = mix(L(65, 25), L(-75, -100), glide(t, more - 0.1, L(140, 125)));
  const Y = 500,
    X0 = 420 + OFF,
    X1 = 1440 + OFF,
    LH = 46,
    FX = 520 + OFF,
    LATE = 1080 + OFF,
    EARLY = 740 + OFF,
    BAND = Y + 30,
    BH = 12,
    OLD = 360,
    NEW = 150;
  const shrink = soon(t, less + 0.25, 0.8),
    top = Y - LH - NAME_GAP,
    below = Y + LH + NAME_GAP;
  // The lane's edge is firm enough to carry the opening before its names arrive.
  box(X0, Y - LH, X1 - X0, 2 * LH, {
    fill: P.row,
    stroke: P.line,
    alpha: g1,
    radius: 16,
    width: 4,
  });
  // The way runs the lane's length from the chapter's first words to the words that say the failure is found earlier.
  const way = s.words[0].start;
  line(
    X0 + 24,
    Y,
    mix(X0 + 24, X1 - 24, drawShare(t, way - 0.1, X1 - X0 - 48, Math.max(1.2, sooner - way))),
    Y,
    { color: P.line, alpha: g1, width: 2 },
  );
  if (!en)
    nameText("下一次", X0 - NAME_GAP, Y, {
      align: "right",
      alpha: g1 * named(t, cue(s, "是让", "")),
    });
  if (!en)
    nameText("学习的目的", X0, top, {
      align: "left",
      valign: "bottom",
      alpha: g1 * named(t, cue(s, "学习的目的", "")),
    });
  const fq = g1 * ramp(t, fails - 0.15, 0.4);
  ring(FX, Y, 14, { color: P.unknown, alpha: fq, width: 2.5 });
  dot(FX, Y, 6, { color: P.unknown, alpha: fq });
  // The failure is named under its mark, on the line of the names below the lane, so the name above the lane stands
  // alone there.
  nameText(L("失败", "The next failure"), FX, below, {
    valign: "top",
    alpha: g1 * named(t, en ? Math.max(fails, cue(s, "", "the next failure") - 0.7) : fails),
  });
  // Found earlier: the place the failure used to be found and how long its manual rescue ran stay as muted traces at
  // the structure tier, while the new place stands near the failure and the band shrinks.
  const found = g1 * ramp(t, sooner - 0.1, 0.3);
  line(LATE, Y - 38, LATE, Y + 38, { color: P.line, alpha: found, width: 2 });
  link(LATE - 4, Y, EARLY + 8, Y, {
    color: P.evidence,
    alpha: found,
    width: 2.5,
    draw: { t, at: sooner + 0.05 },
    end: false,
  });
  box(EARLY, BAND, OLD, BH, {
    stroke: P.line,
    alpha: g1 * ramp(t, less + 0.25, 0.4),
    radius: 5,
    width: 2,
  });
  line(EARLY, Y - 38, EARLY, Y + 38, { color: P.evidence, alpha: found, width: 4 });
  ring(EARLY, Y, 24, { color: P.evidence, alpha: g1 * ramp(t, judge - 0.05, 0.4), width: 2.5 });
  box(EARLY, BAND, mix(OLD, NEW, shrink), BH, {
    fill: P.unknown,
    alpha: g1 * restMark(P.unknown, 0.55) * ramp(t, less - 0.15, 0.3),
    radius: 5,
  });
  // Found earlier, then judged more easily: one name above the mark, each part on its own words, on two even lines in
  // Chinese and on one line in English, whose two lines would not stand even. It begins on the mark's line, where the
  // rescue's band begins, and the rescue's name below begins there too.
  const parts = [L("更早被发现", "Find it earlier"), L("、更容易判断", ", judge it more easily")];
  growName(t, parts, [sooner, judge], EARLY, top, {
    valign: "bottom",
    width: en ? Infinity : measure(parts[0]) + 8,
    alpha: g1,
    color: P.evidence,
  });
  nameText(L("少靠人救火", "Less manual rescue"), EARLY, below, {
    align: "left",
    valign: "top",
    alpha: g1 * named(t, less),
  });
  // Not more files: a small stack of documents appears on its words and is refused.
  const fl = g1 * ramp(t, more - 0.15, 0.4);
  for (let k = 0; k < 3; k++)
    documentIcon(1556 + OFF + k * 16, Y - 74 + k * 14, 80, 100, {
      alpha: fl,
      rows: 3,
      stroke: P.muted,
    });
  rejectedName(L("让文件变多", "Add files"), 1612 + OFF, below, {
    valign: "top",
    alpha: g1 * named(t, more),
    mark: ramp(t, cue(s, "文件", "files") + 0.05, 0.3),
  });
}

/* 14's first stage: the one result the engineering owner carries through every stage. */

import { ctx } from "../../canvas.js";
import { box, labelSize, line, measure, stroke } from "../../drawing/strokes.js";
import { cross, seal } from "../../drawing/symbols.js";
import { opening } from "../../framing/chapters.js";
import { listIn, named } from "../../naming/lists.js";
import { NAME_GAP, nameText, wrapName } from "../../naming/names.js";
import { blockHeight } from "../../naming/parts.js";
import { RAIL_ROW, RAIL_WRAP, railNames } from "../../naming/placement.js";
import { LABEL, P } from "../../palette.js";
import { L, en } from "../../timeline.js";
import { ramp } from "../../timing/easing.js";
import { glide, glideTime } from "../../timing/pace.js";
import { span } from "../../timing/pauses.js";

/* Stage 1: the track with its stages, and the result riding along it under the engineering owner's one
 * responsibility. */
export function s14Track(
  s,
  t,
  stations,
  asNeeded,
  owner,
  both,
  oneDuty,
  quality,
  next,
  names,
  trackY,
  xs,
  trackEnd,
  widthOf,
  pA,
  tx,
  tokQ,
) {
  const slot = ramp(t, opening(s) + 0.2, 0.6) * pA;
  // The track is drawn firm, so the whole way the result will travel stands from the first words.
  line(320, trackY, trackEnd, trackY, { color: P.muted, alpha: slot, width: 3 });
  if (tx > 321) line(320, trackY, tx, trackY, { color: P.authority, alpha: tokQ * pA, width: 4 });
  // The stages are named on one baseline below the track and the owner above its figure; every name stays while the
  // track stands, the stage being named at full ink and the named ones at the second level until all are named.
  railNames(names, xs, trackY, {
    gap: (i) => NAME_GAP + 18 + (en && i % 2 ? RAIL_ROW : 0),
    alpha: (i) => pA * listIn(t, stations, i),
  });
  // The names above the track stand on one line, a name gap over the tallest mark on it, the owner's figure (32 px
  // above the track), so the owner's, the qualifier's and quality's names keep one gap from their marks.
  const above = trackY - 32 - NAME_GAP;
  nameText(L("工程负责人", "Engineering owner"), 250, above, {
    valign: "bottom",
    width: 260,
    color: P.authority,
    alpha: pA * named(t, owner),
  });
  // The chain covers the stages the work involves: the qualifier stands at the chain's far end on its words, ending
  // where the last stage's name ends.
  const lastEnd = xs.at(-1) + widthOf(names.at(-1)) / 2;
  nameText(L("视工作需要", "As the work requires"), lastEnd, above, {
    align: "right",
    valign: "bottom",
    alpha: pA * named(t, asNeeded),
  });
  stations.forEach((at, i) => {
    const lit = ramp(t, at - 0.15, 0.4),
      pulse = 7 * span(t, both - 0.15, both + 0.9, 0.3) * (i === 2 || i === 3 ? 1 : 0);
    // A station whose English name stands a row lower carries a stem down to it, one stroke with its ring, one mark.
    stroke(
      () => {
        ctx.ellipse(xs[i], trackY, 24 + pulse, 24 + pulse, -Math.PI / 2, 0, Math.PI * 2);
        if (en && i % 2) {
          ctx.moveTo(xs[i], trackY + 30 + pulse);
          ctx.lineTo(xs[i], trackY + NAME_GAP + 18 + RAIL_ROW - 6);
        }
      },
      { color: P.ink, alpha: pA * lit, width: 2.5 },
    );
  });
  // Development and verification sit inside one responsibility, named above its frame; quality does not leave it.
  const od = ramp(t, oneDuty - 0.2, 0.6) * pA,
    half = (i) => Math.max(60, measure(wrapName(names[i], RAIL_WRAP)[0]) / 2 + 24);
  const fx0 = xs[2] - half(2),
    fx1 = xs[3] + half(3);
  // The responsibility's frame is drawn in its colour around the two stations when it is named, as far above quality's
  // name as below the stages' names.
  const em = labelSize(LABEL),
    row = L(0, RAIL_ROW),
    namesBottom =
      trackY +
      NAME_GAP +
      18 +
      row +
      blockHeight(Math.max(...[2, 3].map((i) => wrapName(names[i], RAIL_WRAP).length)));
  const pad = 670 + row - namesBottom,
    ftop = above - em - pad;
  box(fx0, ftop, fx1 - fx0, 670 + row - ftop, {
    stroke: P.authority,
    alpha: od,
    radius: 22,
    width: 2.5,
  });
  nameText(L("一份责任", "One responsibility"), (fx0 + fx1) / 2, ftop - NAME_GAP, {
    valign: "bottom",
    color: P.authority,
    alpha: pA * named(t, oneDuty),
  });
  // Quality's seal steps out past the frame and back as the next stage is named, each way a glide.
  const step = fx1 - xs[3] + 20,
    qq = ramp(t, quality - 0.15, 0.4) * pA,
    out = glide(t, next - 0.1, step),
    back = glide(t, next - 0.1 + glideTime(step) + 0.05, step);
  const qx = xs[3] + step * out * (1 - back);
  seal(qx, trackY, 13, { color: P.evidence, alpha: qq });
  // The seal tries to leave and returns; its name stays at verification, where quality belongs.
  nameText(L("质量", "Quality"), xs[3], above, {
    valign: "bottom",
    color: P.evidence,
    alpha: pA * named(t, quality),
  });
  cross(fx1 + 34, trackY - 44, 22, { alpha: ramp(t, next + 0.4, 0.3) * pA, width: 3 });
}

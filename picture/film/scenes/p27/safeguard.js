/* 27's closing stages: the five forms a safeguard can take, and the order in which one is chosen. */

import { ctx } from "../../canvas.js";
import { blend } from "../../drawing/colour.js";
import { link } from "../../drawing/links.js";
import { box, diamond, dot, line, path } from "../../drawing/strokes.js";
import { check, documentIcon, person, ring, shield } from "../../drawing/symbols.js";
import { building, listIn, named, speaking } from "../../naming/lists.js";
import { NAME_GAP, nameText } from "../../naming/names.js";
import { RAIL_WRAP, railNames, railStations } from "../../naming/placement.js";
import { P } from "../../palette.js";
import { L, en } from "../../timeline.js";
import { ramp } from "../../timing/easing.js";
import { drawShare, glide } from "../../timing/pace.js";

/* Stage 6: the safeguard and its five forms, hanging from it on one trunk. */
export function s27Forms(t, forms, kinds, six) {
  // The English last form's name is the widest, so while the forms build the stage stands 39 px right for each of the
  // last two still to come (see building), and stands centred as each comes.
  ctx.save();
  ctx.translate(en ? building(t, forms.slice(2), 39) : 0, 0);
  const sx = 960,
    sy = 290,
    bus = 420,
    iy = 530;
  const names = en
    ? ["Test", "Monitor", "Checklist", "Decision record", "Ownership and handoffs"]
    : ["测试", "监控", "清单", "决策记录", "分工"];
  // The English last form stands whole on one line, so its stations are spaced from their names' widths.
  const formsWrap = L(RAIL_WRAP, 340),
    xs = railStations(names, L(440, 320), 1480, { wrap: formsWrap });
  shield(sx, sy, 40, { color: P.evidence, alpha: six, fillColor: P.row });
  check(sx, sy + 2, 28, { color: P.evidence, alpha: six, width: 3 });
  // English names the safeguard as the stage before did, since its sentence calls it only "it".
  nameText(L("预防措施", "Reusable prevention"), sx + 40 + NAME_GAP, sy, {
    align: "left",
    color: P.evidence,
    alpha: six * named(t, kinds),
  });
  link(sx, sy + 44, sx, bus, { alpha: six, end: false });
  line(xs[0], bus, xs.at(-1), bus, { color: P.line, alpha: six, width: 2 });
  forms.forEach((at, i) => {
    const x = xs[i],
      q = ramp(t, at - 0.15, 0.35) * six,
      lit = speaking(t, forms, i);
    // Each form appears on its words, and its drop lights while it is said.
    link(x, bus, x, iy - 50, {
      color: blend(P.line, P.evidence, lit),
      alpha: six,
      draw: { t, at: at - 0.15 },
      end: false,
    });
    if (i === 0) {
      box(x - 23, iy - 23, 46, 46, {
        fill: P.row,
        stroke: P.evidence,
        alpha: q,
        radius: 6,
        width: 2.5,
      });
      check(x, iy + 2, 26, { color: P.evidence, alpha: q, width: 3.5 });
    } else if (i === 1) {
      box(x - 34, iy - 26, 68, 44, { stroke: P.ink, alpha: q, radius: 5 });
      path(
        [
          [x - 24, iy + 4],
          [x - 10, iy - 8],
          [x + 2, iy + 2],
          [x + 22, iy - 14],
        ],
        { color: P.evidence, alpha: q, width: 2 },
      );
      line(x, iy + 18, x, iy + 30, { color: P.ink, alpha: q, width: 2 });
      line(x - 14, iy + 30, x + 14, iy + 30, { color: P.ink, alpha: q, width: 2 });
    } else if (i === 2) {
      documentIcon(x - 22, iy - 30, 44, 58, { alpha: q, rows: 3 });
      check(x - 30, iy - 10, 12, { color: P.evidence, alpha: q, width: 2.5 });
      check(x - 30, iy + 10, 12, { color: P.evidence, alpha: q, width: 2.5 });
    } else if (i === 3) {
      documentIcon(x - 22, iy - 30, 44, 58, { alpha: q, rows: 2 });
      diamond(x, iy + 12, 9, { color: P.authority, alpha: q, width: 2 });
    } else {
      person(x - 22, iy + 2, { alpha: q, size: 0.55, color: P.authority });
      person(x + 22, iy + 2, { alpha: q, size: 0.55, color: P.ink });
      dot(x, iy - 2, 5, { color: P.evidence, alpha: q });
    }
  });
  railNames(names, xs, iy + 42, {
    gap: NAME_GAP,
    wrap: formsWrap,
    alpha: (i) => six * listIn(t, forms, i),
    set: "forms",
  });
  ctx.restore();
}

/* Stage 7: the order of choice along one rail, the existing safeguard improved before anything new. */
export function s27OrderOfChoice(t, improve, fresh, lightest, seven) {
  const xs = [560, 1360],
    y = 510,
    R = 80,
    order = [improve, fresh];
  ctx.save();
  ctx.translate(43 * (1 - glide(t, fresh + 0.05, 43)), 0);
  shield(xs[0], y, R, { color: P.evidence, alpha: seven, fillColor: P.row });
  check(xs[0], y + 3, 50, { color: P.evidence, alpha: seven, width: 4 });
  link(xs[0] + R + 14, y, xs[1] - R - 14, y, {
    color: P.muted,
    alpha: seven,
    width: 2.5,
    dash: [8, 8],
    end: false,
    upto: drawShare(t, improve + 0.05, xs[1] - xs[0] - 2 * R - 28, 0.6),
  });
  const nw = ramp(t, fresh - 0.15, 0.4) * seven;
  box(xs[1] - R, y - R, 2 * R, 2 * R, {
    stroke: P.muted,
    alpha: 0.9 * nw,
    radius: 16,
    dash: [6, 6],
  });
  line(xs[1], y - 26, xs[1], y + 26, { color: P.muted, alpha: nw, width: 3 });
  line(xs[1] - 26, y, xs[1] + 26, y, { color: P.muted, alpha: nw, width: 3 });
  link(xs[0] + R + 14, y, xs[1] - R - 14, y, { alpha: nw, draw: { t, at: fresh - 0.1 } });
  railNames(
    en ? ["Improve what exists", "Creating something new"] : ["先改已有的", "再考虑新建"],
    xs,
    y + R + 16,
    {
      gap: NAME_GAP,
      alpha: (i) => seven * listIn(t, order, i),
      color: (i) => (i ? P.muted : P.ink),
      set: "order",
      wrap: 420,
    },
  );
  ring(xs[0], y, R + 16, {
    color: P.evidence,
    alpha: ramp(t, lightest + 0.05, 0.4) * seven,
    width: 2.5,
  });
  nameText(L("够用的最轻的那种", "The lightest form that works"), xs[0], y - R - 16 - NAME_GAP, {
    valign: "bottom",
    color: P.evidence,
    alpha: seven * named(t, lightest),
  });
  ctx.restore();
}

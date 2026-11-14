/* 07's first stages: the problem as a knot with a long list weighed against a small model, the relationships to
 * model, and the two refused ways of treating interacting parts. */

import { flowDot, loopPhase, since } from "../../drawing/flows.js";
import { restMark } from "../../drawing/levels.js";
import { link } from "../../drawing/links.js";
import { box, dot, line } from "../../drawing/strokes.js";
import { ring } from "../../drawing/symbols.js";
import { building, listIn, named, speaking } from "../../naming/lists.js";
import { NAME_GAP, nameText } from "../../naming/names.js";
import { railNames } from "../../naming/placement.js";
import { rejectedName } from "../../naming/rejected.js";
import { P } from "../../palette.js";
import { L, en } from "../../timeline.js";
import { cue, cueFrom, cues } from "../../timing/cues.js";
import { mix, ramp, soon } from "../../timing/easing.js";
import { glide, glideTime } from "../../timing/pace.js";
import { thoughtEnd } from "../../timing/pauses.js";
import { s07Knot } from "./marks.js";

/* Stage 1: the problem's knot, with a long list and a small model weighed against each other below it. */
export function s07Understanding(s, t, one) {
  const [problem, longer, listWord, model] = cues(s, [
    ["想清楚问题", "understanding a problem"],
    ["更长的清单", "longer list"],
    ["清单", "list"],
    ["刚好够用的模型", "the smallest model"],
  ]);
  const k = one * named(t, problem);
  s07Knot(960, 300, k);
  nameText(L("想清楚问题", "Understanding a problem"), 960, 300 + 92 + NAME_GAP, {
    valign: "top",
    alpha: k,
  });
  // The side named first stands alone centred under the knot, and moves out to its own side on the words that name
  // the other, so the frame stays balanced while one side stands alone. The list is 264 px wide; the model centres on
  // its lower part (x 1230). The English model sets off on the first word of the clause that names the list, "not",
  // so it has all but reached its side when the thought ends and the frame rests within 30 px of the centre.
  const second = en ? cue(s, "", "not a longer list") : model,
    alone = 1 - glide(t, second + 0.05, en ? 960 - 1230 + 50 : 960 - 132 - 560);
  // The English model rests 50 px left of its place, so its whole name keeps the stage centred.
  const lx = 560 + (en ? 0 : (960 - 132 - 560) * alone),
    mdx = en ? -50 + (960 - 1230 + 50) * alone : 0;
  const top = 500,
    step = 30,
    nameY = top + 9 * step + 11 + NAME_GAP;
  for (let r = 0; r < 10; r++) {
    const y = top + r * step,
      q = one * (r < 7 ? ramp(t, longer - 0.1, 0.4) : ramp(t, longer + 0.05 + (r - 7) * 0.08, 0.3));
    box(lx, y - 9, 18, 18, { stroke: P.muted, alpha: q * 0.8, radius: 4 });
    line(lx + 34, y, lx + 34 + 230 - (r % 4) * 44, y, {
      color: P.muted,
      alpha: q * 0.8,
      width: 3,
    });
  }
  rejectedName(L("更长的清单", "Longer list"), lx, nameY, {
    align: "left",
    valign: "top",
    alpha: one * named(t, longer),
    mark: ramp(t, listWord + 0.05, 0.35),
  });
  // The model: three parts, a chain of two relations and the feedback that closes it.
  const R = 30,
    nodes = [
      [1110 + mdx, 540],
      [1350 + mdx, 540],
      [1230 + mdx, 720],
    ],
    fillAt = model;
  const q = one * ramp(t, fillAt - 0.1, 0.5),
    knotAt = (j) => ({ t, at: fillAt + 0.05 + j * 0.25 });
  nodes.forEach(([x, y]) => {
    dot(x, y, R, { color: P.row, alpha: q });
    ring(x, y, R, { color: P.ink, alpha: q, width: 2.5 });
  });
  const [a, b, c] = nodes;
  link(a[0] + R + 8, a[1], b[0] - R - 8, b[1], { alpha: q, draw: knotAt(0) });
  link(b[0], b[1] + R + 8, c[0] + R + 8, c[1], { route: "vh", alpha: q, draw: knotAt(1) });
  // The feedback's point runs while the thought is spoken: no pass begins in its last 0.3 s.
  link(c[0] - R - 8, c[1], a[0], a[1] + R + 8, {
    route: "hv",
    alpha: q,
    draw: knotAt(2),
    flowing: since(t, fillAt + 1.05),
    last: since(thoughtEnd(fillAt) - 0.3, fillAt + 1.05),
  });
  // The model is named under it: in Chinese from its left edge, as the list is; in English whole on one line, centred
  // under the model, as no break keeps the noun phrase whole in an even block.
  nameText(L("刚好够用的模型", "The smallest model that will do"), en ? c[0] : a[0] - R, nameY, {
    align: L("left", "center"),
    valign: "top",
    width: L(360, 440),
    alpha: one * named(t, model),
  });
}

/* Stage 2: the knot as the relationships to model, and the mechanisms the words name in one row beneath it. */
export function s07Relationships(s, t, relations, two) {
  const ats = cues(s, [
    ["一个概念只用一个意思", "one meaning per concept"],
    ["谁影响谁", "causes"],
    ["谁依赖谁", "dependencies"],
    ["受什么限制", "constraints"],
    ["有哪些反馈回路", "feedback loops"],
  ]);
  // The row steps half its 260 px pitch toward its open end for each mechanism still to come, so the mechanisms
  // already shown stand centred under the knot at every step.
  const shift = building(t, ats, 130),
    xs = [440, 700, 960, 1220, 1480].map((x) => x + shift);
  // A mechanism's flow begins once the row has closed up under the knot, as the last mechanism's glide ends, so its
  // point never rides the row's glide, which would carry it back against its own way and stop it dead.
  const still = ats.at(-1) - 0.1 + glideTime(130);
  const cy = 650,
    r = 20,
    h = 70;
  s07Knot(960, 390, two);
  nameText(L("先理关系", "Relationships"), 960, 390 + 92 + NAME_GAP, {
    valign: "top",
    alpha: two * named(t, relations),
  });
  const node = (x, y, q, lit = 0, size = r) => {
    dot(x, y, size, { color: P.row, alpha: q });
    ring(x, y, size, { color: P.ink, alpha: q, width: 2.5 });
    if (lit > 0)
      ring(x, y, size + 9, {
        color: P.evidence,
        alpha: lit * restMark(P.evidence, 0.5) * q,
        width: 2,
      });
  };
  ats.forEach((at, i) => {
    const x = xs[i],
      q = two * ramp(t, at - 0.1, 0.5),
      go = soon(t, at + 0.05, 0.7),
      lit = speaking(t, ats, i),
      drawn = since(t, Math.max(at + 0.75, still));
    if (i === 0) {
      // One concept, one meaning: the way to a second meaning stops at a bar. The mark stands 6 px right of its
      // station, so the node's ring and the meanings' dots stand centred on the station and its name.
      const c = x + 6;
      node(c - h, cy, q, lit);
      dot(c + h, cy - 34, 9, { color: P.evidence, alpha: q });
      dot(c + h, cy + 34, 9, { color: P.muted, alpha: q * 0.8, hollow: true });
      link(c - h + r + 6, cy, c + h - 16, cy - 34, { route: "hvh", mid: c, alpha: q, upto: go });
      link(c - h + r + 6, cy, c + h - 16, cy + 34, {
        route: "hvh",
        mid: c,
        alpha: q * 0.8,
        upto: go,
        end: false,
        dash: [5, 6],
      });
      line(c + 36, cy + 34 - 16, c + 36, cy + 34 + 16, {
        color: P.unknown,
        alpha: q * ramp(t, at + 0.5, 0.3),
        width: 4,
      });
    } else if (i === 1) {
      node(x - h, cy, q, lit);
      node(x + h, cy, q * go);
      link(x - h + r + 6, cy, x + h - r - 6, cy, { alpha: q, upto: go, flowing: drawn });
    } else if (i === 2) {
      // The dependent hangs below what it needs, a node of radius 16.
      node(x, cy - 44, q * go, 0, 16);
      node(x, cy + 44, q, lit);
      link(x, cy + 44 - r - 6, x, cy - 44 + 16 + 6, { alpha: q, upto: go });
    } else if (i === 3) {
      // The node and the limit its way stops at stand 66 px either side of the station, so the mark centres on its name.
      const from = x - 46,
        limit = x + 64;
      node(from, cy, q, lit);
      link(from + r + 6, cy, limit, cy, { alpha: q, upto: go, end: false });
      // Its point runs nine tenths of the way and leaves by its size short of the limit.
      const way = 0.9 * (limit - from - r - 6),
        run = loopPhase(drawn, way);
      if (run !== null)
        flowDot(mix(from + r + 6, limit, 0.9 * run), cy, 4, run, { color: P.line, alpha: q }, way);
      line(limit, cy - 26, limit, cy + 26, {
        color: P.authority,
        alpha: q * ramp(t, at + 0.5, 0.3),
        width: 4,
      });
    } else {
      node(x - h, cy - 8, q, lit);
      node(x + h, cy - 8, q * go);
      link(x - h + r + 6, cy - 8, x + h - r - 6, cy - 8, { alpha: q, upto: go });
      link(x + h, cy - 8 + r + 6, x - h, cy - 8 + r + 6, {
        route: "vhv",
        mid: cy + 50,
        alpha: q,
        draw: { t, at: at + 0.5 },
        flowing: since(t, at + 1.3),
      });
    }
  });
  // The names share one baseline below the row, set from left to right; each takes its level from its spoken turn. The
  // Chinese first name stands whole on one line, which its station's room takes.
  const names = en
    ? ["One meaning per concept", "Causes", "Dependencies", "Constraints", "Feedback loops"]
    : [["一个概念只用一个意思"], "谁影响谁", "谁依赖谁", "受什么限制", "有哪些反馈回路"];
  railNames(names, xs, cy + 64, { alpha: (i) => two * listIn(t, ats, i), set: "relations" });
}

/* Stage 3: two refused ways, interacting parts forced into separate boxes and one effect counted twice. */
export function s07Interacting(s, t, interacting, three) {
  const [force, boxes, effect, twice] = cues(s, [
    ["硬拆成", "force interacting parts"],
    ["互不相干的几块", "separate boxes"],
    ["同一个影响", "one effect"],
    ["算两次", "twice"],
  ]);
  const back = en ? interacting : cueFrom(s, "影响", "", interacting);
  const cy = 470,
    ax = 640,
    bx = 1280,
    r = 36,
    LY = 100,
    wall = 960;
  const cut = ramp(t, boxes + 0.05, 0.4),
    walls = soon(t, boxes + 0.05, 0.6);
  [ax, bx].forEach((x) => {
    dot(x, cy, r, { color: P.row, alpha: three });
    ring(x, cy, r, { color: P.ink, alpha: three, width: 2.5 });
  });
  // The loop: across the top from A to B, back along the bottom from B to A; once boxed, its flow fades and stops.
  const stopped = 1 - ramp(t, boxes, 0.3);
  link(ax, cy - r - 8, bx, cy - r - 8, {
    route: "vhv",
    mid: cy - LY,
    alpha: three,
    draw: { t, at: interacting + 0.2 },
    width: 3,
    flowing: since(t, interacting + 1),
    fade: stopped,
  });
  link(bx, cy + r + 8, ax, cy + r + 8, {
    route: "vhv",
    mid: cy + LY,
    alpha: three,
    draw: { t, at: back + 0.2 },
    width: 3,
    flowing: since(t, back + 1),
    fade: stopped,
  });
  [-LY, LY].forEach((dy) =>
    line(wall, cy + dy - 18, wall, cy + dy + 18, {
      color: P.unknown,
      alpha: three * cut,
      width: 4,
    }),
  );
  [ax, bx].forEach((x) =>
    box(x - 110, cy - 75 + 75 * (1 - walls), 220, 150 * walls, {
      stroke: P.muted,
      alpha: three * cut,
      radius: 6,
    }),
  );
  nameText(L("互相影响的因素", "Interacting parts"), wall, cy - LY - 18 - NAME_GAP, {
    valign: "bottom",
    alpha: three * named(t, interacting),
  });
  rejectedName(L("硬拆成互不相干的几块", "Separate boxes"), wall, cy + LY + 18 + NAME_GAP, {
    valign: "top",
    width: 440,
    alpha: three * named(t, force),
    mark: ramp(t, boxes + 0.45, 0.35),
  });
  // One effect reaches two tallies: the first count holds, the second is the same effect counted again.
  const ey = 750,
    ex = 820,
    tx = 1060,
    ty = [ey - 50, ey + 50];
  const eq = three * ramp(t, effect - 0.1, 0.45),
    tq = three * ramp(t, twice - 0.1, 0.4);
  dot(ex, ey, r, { color: P.row, alpha: eq });
  ring(ex, ey, r, { color: P.evidence, alpha: eq, width: 2.5 });
  // The first count is made with the effect; the second count, its tally a larger box, starts on "twice" and stops at
  // a bar before its tally, which stays empty.
  const stop = (ex + tx) / 2 + 50;
  box(tx - 22, ty[0] - 22, 44, 44, { stroke: P.line, alpha: eq * 0.8, radius: 6 });
  box(tx - 26, ty[1] - 26, 52, 52, { stroke: P.line, alpha: tq * 0.8, radius: 6 });
  link(ex + r + 8, ey, tx - 30, ty[0], {
    route: "hvh",
    mid: (ex + tx) / 2 - 20,
    alpha: eq,
    draw: { t, at: effect + 0.1 },
  });
  dot(tx, ty[0], 10, { color: P.evidence, alpha: eq * ramp(t, effect + 0.5, 0.3) });
  link(ex + r + 8, ey, stop - 8, ty[1], {
    route: "hvh",
    mid: (ex + tx) / 2 - 20,
    alpha: tq,
    draw: { t, at: twice + 0.05 },
    end: false,
  });
  line(stop, ty[1] - 18, stop, ty[1] + 18, {
    color: P.unknown,
    alpha: three * ramp(t, twice + 0.2, 0.25),
    width: 4,
  });
  // The effect is named beside its ring, at the left where its ways begin, so its name never stands under the refused
  // boxes' name as a second line of it.
  nameText(L("同一个影响", "One effect"), ex - r - NAME_GAP, ey, {
    align: "right",
    color: P.evidence,
    alpha: three * named(t, effect),
  });
  rejectedName(L("算两次", "Counted twice"), tx + 26 + NAME_GAP, ty[1], {
    align: "left",
    alpha: three * named(t, twice),
    mark: ramp(t, twice + 0.1, 0.3),
  });
}

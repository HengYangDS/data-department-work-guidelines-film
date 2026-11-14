/* 07's closing stages: the reasoning checked before a conclusion is trusted, and the conclusion with its bounds. */

import { ctx } from "../../canvas.js";
import { blend } from "../../drawing/colour.js";
import { since } from "../../drawing/flows.js";
import { markLevel } from "../../drawing/levels.js";
import { link } from "../../drawing/links.js";
import { along, box, diamond, dot, line, measure, path, stroke } from "../../drawing/strokes.js";
import { check, documentIcon, ring, seal } from "../../drawing/symbols.js";
import { listIn, listLevel, named, speaking } from "../../naming/lists.js";
import { NAME_GAP, nameText, wrapName } from "../../naming/names.js";
import { blockHeight } from "../../naming/parts.js";
import { HEAD_CLEAR } from "../../naming/placement.js";
import { rejectedName } from "../../naming/rejected.js";
import { P } from "../../palette.js";
import { L, en } from "../../timeline.js";
import { cue, cues } from "../../timing/cues.js";
import { mix, ramp, soon } from "../../timing/easing.js";
import { glide } from "../../timing/pace.js";

/* Stage 8: the conclusion as a stamped page, and the traps on the way of the reasoning that leads to it. */
export function s07Reasoning(s, t, reason, eight) {
  const [checkAt, ...ats] = cues(s, [
    ["查推理", "check the reasoning"],
    ["相关看成因果", "correlation presented"],
    ["个案看成全部", "one case taken"],
    ["必要条件看成", "necessary condition"],
    ["认定只有一个原因", "one outcome blamed"],
    ["只找对自己有利", "selective evidence"],
    ["中途换标准", "criteria changed midstream"],
    ["搬出常识", "an appeal to common sense"],
  ]);
  // The mechanism each spoken trap takes, in spoken order.
  const kinds = [0, 1, 2, 3, 4, 6, 5];
  const limitsAt = cue(s, "在这里适不适用", "its limits");
  // The page stands a little above the rows' middle, so its top stands under 90 px below the heading that names it and
  // the two read as one.
  const PW = 360,
    PH = 230,
    py = 465,
    cols = [680, 1240],
    ys = [360, 460, 560, 660],
    NW = 450,
    BY = 710;
  // The English first trap is named by its key words on one line, so while it stands alone beside the page the stage
  // stays within the build balance; its second trap is named by its key words on one line, short of the clause its
  // caption shows, and its third trap, the widest name to stand while its row's right-hand trap is still to come,
  // stands on two authored lines, so the stage stays balanced as it builds; the last trap lists its three appeals by
  // commas as key words, on two lines of even width, so its name already lies inside the action-safe area when it
  // inks in, before the stage has glided to its new extent: with "or", the even break ends a line on it, and the
  // break before it leaves the wider second line outside that area as it inks in.
  // Each Chinese trap stands on one line, as said; the one-sided search by its key words, short of the clause its
  // caption shows.
  const names = en
    ? [
        ["Correlation as cause"],
        "One case for the whole",
        ["A necessary condition", "treated as sufficient"],
        "Blamed on a single cause",
        "Selective evidence",
        "Criteria changed midstream",
        ["Common sense, experience,", "best practice without its limits"],
      ]
    : [
        "把相关看成因果",
        "把个案看成全部",
        "把必要条件看成充分条件",
        "认定只有一个原因",
        "只找有利的证据",
        "换标准",
        "搬出常识、经验或“最佳实践”",
      ];
  // What stands at each step reaches from its widest left-hand name to the cross after its widest right-hand one: the
  // page with its way and the way's name first, then each trap on its side as it is named.
  const nameW = (i) => Math.max(...wrapName(names[i], NW).map((line) => measure(line)));
  const extents = [
    [960 - PW / 2, Math.max(960 + PW / 2, 978 + measure(L("查推理", "Check the reasoning")))],
  ];
  ats.forEach((_, i) => {
    const [l, r] = extents.at(-1);
    extents.push(
      i % 2
        ? [l, Math.max(r, cols[1] + 86 + nameW(i) + 16 + 26)]
        : [Math.min(l, cols[0] - 128 - nameW(i)), r],
    );
  });
  const centreOf = ([l, r]) => 960 - (l + r) / 2;
  const dx = extents.slice(1).reduce((v, e, i) => {
    const d = centreOf(e) - centreOf(extents[i]);
    return v + d * glide(t, ats[i] - 0.3, d);
  }, centreOf(extents[0]));
  ctx.save();
  ctx.translate(dx, 0);
  // The page's text rows run across most of it, so the page is filled as a group's frame is; the seal stands on its
  // own ground over them.
  documentIcon(960 - PW / 2, py - PH / 2, PW, PH, { alpha: eight, rows: 0 });
  stroke(
    () => {
      for (let i = 0; i < 6; i++) {
        const ry = py - PH / 2 + PH * (0.18 + i * 0.12);
        ctx.moveTo(960 - PW * 0.38, ry);
        ctx.lineTo(960 + PW * (i % 2 ? 0.22 : 0.36), ry);
      }
    },
    { color: P.muted, alpha: eight * 0.8, width: 2 },
  );
  dot(960, py - 6, 56, { color: P.row, alpha: eight });
  seal(960, py - 6, 50, { alpha: eight });
  // The heading stands clear above the traps' first row, its taller name or its marks, so it heads the page and the
  // six around it rather than standing among the first row's names.
  const rowHalf = Math.max(
    26,
    ...names.slice(0, 2).map((v) => blockHeight(wrapName(v, NW).length) / 2),
  );
  nameText(L("相信结论之前", "A conclusion"), 960, ys[0] - rowHalf - HEAD_CLEAR, {
    valign: "bottom",
    width: 300,
    alpha: eight * named(t, reason),
  });
  // The reasoning: one way rising from its name below the page to the conclusion as the reasoning is named.
  const rq = eight * ramp(t, checkAt - 0.1, 0.4);
  link(960, BY, 960, py + PH / 2 + 8, { alpha: rq, draw: { t, at: checkAt }, width: 2.5 });
  nameText(L("查推理", "Check the reasoning"), 978, (py + PH / 2 + BY) / 2, {
    align: "left",
    alpha: eight * named(t, checkAt),
  });
  // Each trap's glyph keeps sizes unlike every other trap's parts, so the parts of different traps never read as one
  // row of repeated stations, each waiting for a name of its own: a small part is a detail under 16 px.
  ats.forEach((at, i) => {
    // Each mechanism runs once from its words and then rests in the state that shows its error.
    const gx = cols[i % 2],
      y = ys[Math.floor(i / 2)],
      q = eight * ramp(t, at - 0.1, 0.45),
      kind = kinds[i];
    const go = soon(t, at + 0.05, 0.8),
      err = soon(t, at + 0.45, 0.5);
    if (kind === 0) {
      // Two series rise and fall together as they draw; the pair is then presented as cause and effect.
      const d = [8, -4, 2, -10, -2, -14],
        a = d.map((v, k) => [gx - 60 + 24 * k, y - 12 + v]),
        b = d.map((v, k) => [gx - 60 + 24 * k, y + 14 + v]);
      path(along(a, go).kept, { color: P.ink, alpha: q, width: 3 });
      path(along(b, go).kept, { color: P.evidence, alpha: q, width: 3 });
      link(gx + 72, a[5][1], gx + 72, b[5][1], {
        color: P.unknown,
        alpha: q,
        upto: err,
        width: 2.5,
      });
    } else if (kind === 1) {
      // The one case's ink spreads through every member of the whole, column by column, each member inking in on the
      // smoothstep so it never appears at once.
      dot(gx - 48, y, 10, { color: P.ink, alpha: q });
      link(gx - 34, y, gx - 22, y, { color: P.ink, alpha: q, upto: go, end: false });
      for (let k = 0; k < 8; k++) {
        const x = gx - 6 + (k % 4) * 21,
          yy = y - 11 + Math.floor(k / 4) * 22,
          flood = ramp(t, at + 0.2 + (k % 4) * 0.12, 0.4);
        dot(x, yy, 7, { color: P.muted, alpha: q * (1 - flood), hollow: true });
        dot(x, yy, 7, { color: P.ink, alpha: q * flood });
      }
    } else if (kind === 2) {
      // One condition stands and the other is missing, yet the way from the one alone reaches the outcome, which fills.
      box(gx - 55, y - 19, 15, 15, { fill: P.evidence, alpha: q * 0.9, radius: 4 });
      box(gx - 55, y + 4, 15, 15, { stroke: P.muted, alpha: q, radius: 4, dash: [4, 4] });
      link(gx - 34, y - 11.5, gx + 30, y, {
        route: "hvh",
        mid: gx - 4,
        color: P.ink,
        alpha: q,
        upto: go,
        end: false,
      });
      ring(gx + 44, y, 13, { color: P.ink, alpha: q, width: 2.5 });
      dot(gx + 44, y, 13, { color: P.ink, alpha: q * err });
    } else if (kind === 3) {
      // An outcome is traced back to a single cause, while the other possible causes stay open.
      [-20, 0, 20].forEach((d) =>
        dot(gx - 48, y + d, 7, { color: P.muted, alpha: q, hollow: true }),
      );
      dot(gx + 46, y, 7, { color: P.ink, alpha: q });
      link(gx + 32, y, gx - 36, y, {
        color: P.unknown,
        alpha: q,
        upto: go,
        width: 2.5,
        end: false,
      });
      dot(gx - 48, y, 7, { color: P.unknown, alpha: q * err });
    } else if (kind === 4) {
      // The lens moves only to the agreeing points, skipping the contrary ones, and each point it takes is ringed.
      const px = [0, 1, 2, 3, 4].map((k) => gx - 52 + 26 * k),
        lx = mix(mix(px[0], px[2], soon(t, at + 0.25, 0.35)), px[4], soon(t, at + 0.65, 0.35));
      px.forEach((x, k) => {
        dot(x, y - 4, 6, { color: k % 2 ? P.unknown : P.evidence, alpha: q });
        if (k % 2 === 0)
          ring(x, y - 4, 10, {
            color: P.evidence,
            alpha: q * ramp(t, at + 0.05 + k * 0.2 + 0.25, 0.4),
            width: 2,
          });
      });
      ring(lx, y - 4, 16, { color: P.ink, alpha: q, width: 2.5 });
      line(lx + 11, y + 7, lx + 20, y + 16, { color: P.ink, alpha: q, width: 3 });
    } else if (kind === 6) {
      // A criterion moved midstream: a result runs along its scale and stops short of the mark set for it, and the
      // mark is then moved back past the result, its first place left as a dashed trace above the scale.
      const tx = mix(gx + 30, gx - 46, glide(t, at + 0.45, 76));
      line(gx - 62, y + 6, gx + 62, y + 6, { color: P.line, alpha: q, width: 2 });
      line(gx + 30, y - 30, gx + 30, y - 12, {
        color: P.muted,
        alpha: q * err,
        width: 2,
        dash: [3, 3],
      });
      line(tx, y - 30, tx, y - 12, {
        color: blend(P.authority, P.unknown, err),
        alpha: q,
        width: 4,
      });
      dot(mix(gx - 54, gx - 10, glide(t, at + 0.05, 44)), y + 6, 9, { color: P.ink, alpha: q });
    } else {
      // A practice reaches a case outside where it applies; its bounds stand dashed once the words name them.
      diamond(gx - 40, y, 16, { color: P.authority, alpha: q, solid: true });
      link(gx - 22, y, gx + 34, y, {
        color: P.unknown,
        alpha: q,
        upto: go,
        width: 2.5,
        end: false,
        flowing: since(t, at + 0.85),
        last: since(limitsAt, at + 0.85),
      });
      ring(gx + 46, y, 7, { color: P.ink, alpha: q, width: 2.5 });
      dot(gx + 46, y, 7, { color: P.ink, alpha: q * err });
      ring(gx - 40, y, 30, {
        color: P.muted,
        alpha: q * ramp(t, limitsAt - 0.1, 0.4),
        width: 2,
        dash: [4, 5],
      });
    }
  });
  // A refused name steps back only to the unknown's level, so a crossed earlier item and its cross still read at 4.6:1.
  // Each is refused once its mechanism has shown the error; the last once its missing bounds are named, which its
  // mechanism shows, so the name keeps the trap's key words. A name states the error itself in words its trap says
  // within one clause, so it never reads far ahead of the voice. A name wider than its column wraps onto a second
  // line, centred on its row; on the left a name ends at its cross, beside its mark, and on the right each cross
  // follows its own name, 16 px after its longer line.
  names.forEach((v, i) =>
    rejectedName(v, i % 2 ? cols[1] + 86 : cols[0] - 128, ys[Math.floor(i / 2)], {
      align: i % 2 ? "left" : "right",
      width: NW,
      mark: ramp(t, i === names.length - 1 ? limitsAt + 0.1 : ats[i] + 0.7, 0.3),
      set: "errors",
      alpha: eight * ramp(t, ats[i] - 0.15, 0.4) * markLevel(P.unknown, listLevel(t, ats, i)),
    }),
  );
  ctx.restore();
}

/* Stage 9: the same conclusion carrying its bounds, a bracket enclosing a column of five. */
export function s07Bounds(s, t, bounded, nine) {
  const ats = cues(s, [
    ["证据支持到哪一步", "what the evidence supports"],
    ["有几成把握", "how confident"],
    ["还有哪些可能", "what remains possible"],
    ["下一步怎么核验", "what to verify next"],
    ["看到什么会改判", "what observation"],
  ]);
  // The Chinese bounds' names are short, so its stage stands 80 px right, centred on its extent as the English is.
  const sx = L(80, 0),
    cx = 580 + sx,
    cy = 500,
    R = 44,
    bx = 860 + sx,
    gx = 960 + sx,
    nx = 1040 + sx,
    ys = [330, 415, 500, 585, 670];
  dot(cx, cy, R, { color: P.row, alpha: nine });
  ring(cx, cy, R, { color: P.evidence, alpha: nine, width: 2.5 });
  check(cx, cy, 30, { color: P.evidence, alpha: nine });
  nameText(L("有边界的结论", "Bound the conclusion"), cx, cy + R + NAME_GAP, {
    valign: "top",
    width: 320,
    alpha: nine * named(t, bounded),
  });
  line(bx, ys[0], bx, ys.at(-1), { color: P.line, alpha: nine, width: 2 });
  link(cx + R + 8, cy, bx - 6, cy, { alpha: nine, draw: { t, at: bounded + 0.2 } });
  ats.forEach((at, i) => {
    const y = ys[i],
      q = nine * ramp(t, at - 0.1, 0.45),
      lit = speaking(t, ats, i),
      go = soon(t, at, 0.6);
    line(bx, y, bx + 22, y, { color: P.line, alpha: q, width: 2 });
    // The station's dot takes the evidence colour as its bound is spoken, blended by its light, so it never snaps.
    dot(bx + 22, y, 4 + 3 * lit, { color: blend(P.line, P.evidence, lit), alpha: q });
    if (i === 0) {
      line(gx - 40, y, mix(gx - 40, gx + 10, go), y, { color: P.evidence, alpha: q, width: 4 });
      line(gx + 20, y - 16, gx + 20, y + 16, {
        color: P.authority,
        alpha: q * ramp(t, at + 0.4, 0.3),
        width: 4,
      });
    } else if (i === 1) {
      line(gx - 40, y, gx + 30, y, { color: P.line, alpha: q, width: 10, cap: "butt" });
      line(gx - 40, y, mix(gx - 40, gx + 12, go), y, {
        color: P.evidence,
        alpha: q,
        width: 10,
        cap: "butt",
      });
    } else if (i === 2) {
      dot(gx - 30, y, 10, { color: P.evidence, alpha: q });
      [0, 1].forEach((k) =>
        dot(gx + 2 + k * 26, y, 9, {
          color: P.muted,
          alpha: q * ramp(t, at + k * 0.3, 0.4),
          hollow: true,
        }),
      );
    } else if (i === 3) {
      ring(gx - 26, y, 14, { color: P.evidence, alpha: q, width: 2.5 });
      check(gx - 26, y + 1, 16, { color: P.evidence, alpha: q });
      link(gx - 6, y, gx + 34, y, { alpha: q, upto: go });
    } else {
      ring(gx - 26, y, 13, { color: P.evidence, alpha: q, width: 2, dash: [4, 4] });
      link(gx - 10, y, gx + 30, y - 18, { route: "hvh", mid: gx + 10, alpha: q, upto: go });
    }
  });
  const names = en
    ? [
        "What the evidence supports",
        "How confident you are",
        "What remains possible",
        "What to verify next",
        "What observation would change it",
      ]
    : ["证据支持到哪一步", "有几成把握", "还有哪些可能", "下一步怎么核验", "看到什么会改判"];
  names.forEach((v, i) =>
    nameText(v, nx, ys[i], {
      align: "left",
      width: 620,
      alpha: nine * listIn(t, ats, i),
      set: "bounds",
    }),
  );
}

/* 12's later stages: from a signal to controlled use, what a signal or a deployment does not yet mean, and admission
 * before a use against adoption of it. */

import { ctx } from "../../canvas.js";
import { flowDot, loopPhase, since } from "../../drawing/flows.js";
import { restMark } from "../../drawing/levels.js";
import { link } from "../../drawing/links.js";
import { box, dot, labelSize, line, measure, path, stroke } from "../../drawing/strokes.js";
import { check, ring, token } from "../../drawing/symbols.js";
import { listIn, listLevel, named, speaking } from "../../naming/lists.js";
import { NAME_GAP, nameText } from "../../naming/names.js";
import { CONTENT_CY, radialName } from "../../naming/placement.js";
import { NOTE, TERM_GAP, termRow, termRowLayout } from "../../naming/terms.js";
import { LABEL, P } from "../../palette.js";
import { L, en } from "../../timeline.js";
import { cues } from "../../timing/cues.js";
import { clamp, mix, ramp, soon } from "../../timing/easing.js";
import { glide } from "../../timing/pace.js";

/* Stage 3: the way from the signal through the ring of questions round the intended use to controlled use. */
export function s12ControlledUse(t, path_, steps, forUse, ctrlAt, applyAt, three) {
  // The Chinese signal's name is wide and its use's short, so its signal stands 140 px nearer the ring and the stage
  // stands about the centre; its way to the ring stays 72 px shorter than the way on to the use, so the two read as
  // the flow's two different legs rather than one repeated mark. The English signal stands 50 px further out and its
  // use 40 px, so its way to the ring stays 78 px longer than the way on, and each question stands whole on one line.
  const cx = 960,
    cy = CONTENT_CY,
    R = 210,
    sx = L(420, 230),
    ux = L(1560, 1600),
    gap = 0.05;
  const names = en
    ? [
        "Worth evaluating",
        "What the data is",
        "Key findings reproducible",
        "Runs reliably",
        "Permitted for this use",
        "Feedback supports continuing",
      ]
    : ["值不值得评估", "数据是什么", "能不能复现", "能不能稳定运行", "能不能准入", "该不该继续"];
  path(
    [
      [sx - 60, cy + 10],
      [sx - 30, cy - 4],
      [sx, cy + 6],
      [sx + 30, cy - 18],
      [sx + 60, cy - 30],
    ],
    { color: P.authority, alpha: three, width: 3 },
  );
  // The flow's two ends are named on one line, under the taller of their marks, the use's frame; in English over them,
  // so the question at the ring's lower right keeps clear of the use's name.
  const endY = L(cy + 50 + NAME_GAP, cy - 50 - NAME_GAP),
    endAlign = L("top", "bottom");
  nameText(L("有希望的信号", "Signal"), sx, endY, {
    valign: endAlign,
    width: 300,
    color: P.authority,
    alpha: three * named(t, path_),
  });
  link(sx + 84, cy, cx - R - 2, cy, {
    alpha: three,
    draw: { t, at: path_ + 0.05 },
    flowing: since(t, path_ + 0.65),
  });
  box(ux - 60, cy - 50, 120, 100, {
    stroke: P.authority,
    alpha: three * ramp(t, ctrlAt - 0.15, 0.4),
    radius: 12,
  });
  check(ux, cy, 34, { color: P.authority, alpha: three * ramp(t, ctrlAt - 0.1, 0.4) });
  nameText(L("受控使用", "Controlled use"), ux, endY, {
    valign: endAlign,
    color: P.authority,
    alpha: three * named(t, ctrlAt),
  });
  link(cx + R + 2, cy, ux - 72, cy, { alpha: three, draw: { t, at: ctrlAt + 0.05 } });
  // The ring's two arcs are one stroke: one ring, open where the way passes. It stands at the structure tier as 09.3's
  // ring of questions does, firm enough to read, so the stage stands balanced on the whole ring while the questions on
  // its upper half are asked.
  stroke(
    () => {
      ctx.arc(cx, cy, R, gap, Math.PI - gap);
      ctx.moveTo(cx + R * Math.cos(Math.PI + gap), cy + R * Math.sin(Math.PI + gap));
      ctx.arc(cx, cy, R, Math.PI + gap, 2 * Math.PI - gap);
    },
    { alpha: three * ramp(t, applyAt - 0.15, 0.4), width: 3.5 },
  );
  const use = ramp(t, forUse - 0.1, 0.4) * three;
  ring(cx, cy - 64, 22, { color: P.evidence, alpha: use, width: 2.5 });
  dot(cx, cy - 64, 8, { color: P.evidence, alpha: use });
  nameText(L("针对计划中的用途", "The intended use"), cx, cy, {
    color: P.evidence,
    alpha: three * named(t, forUse),
  });
  nameText(L("适用的问题", "The questions that apply"), cx, cy + 60, {
    alpha: three * named(t, applyAt),
  });
  steps.forEach((at, i) => {
    const a = -Math.PI / 2 + (i * Math.PI) / 3,
      x = cx + Math.cos(a) * R,
      y = cy + Math.sin(a) * R,
      lit = speaking(t, steps, i);
    const q = ramp(t, at - 0.1, 0.4) * three;
    dot(x, y, 12, { color: P.ground, alpha: q });
    dot(x, y, 12, { color: P.evidence, alpha: q });
    if (lit > 0)
      ring(x, y, 21, {
        color: P.evidence,
        alpha: lit * restMark(P.evidence, 0.5) * three,
        width: 2,
      });
    // The top and bottom names centre on their stations; a name at the side begins (or ends) a gap from its station and
    // its first line stands level with it, so mirrored names share a line whatever their length.
    const o = { width: 400, alpha: three * listIn(t, steps, i), set: "questions" },
      side = Math.sign(Math.round(Math.cos(a) * 10));
    if (!side) radialName(names[i], cx, cy, R + 12, a, o);
    else
      nameText(names[i], x + side * (12 + NAME_GAP), y - labelSize(LABEL) / 2, {
        ...o,
        align: side > 0 ? "left" : "right",
        valign: "top",
      });
  });
}

/* Stage 4: three ways from what holds toward what does not follow from it, each stopped at a gate's bar. */
export function s12NotYet(t, rights, lefts, nots, rowAts, four) {
  // The English rows stand 20 px right, so their bars stand near the admission gate that replaces them at the cut. The
  // marks of what holds stand as far left of the bar as centres the rows with their names: the English names of what
  // does not follow are longer than those of what holds, so there the ways from what holds are longer.
  const dx = L(0, 20),
    rx = 1380 + dx,
    bar = 960 + dx,
    MR = 24,
    PITCH = 96,
    pairs = en
      ? [
          ["A signal", "Production-ready"],
          ["Deployed", "Admitted"],
          [null, "For another use"],
        ]
      : [
          ["有信号", "能投产"],
          ["已经部署", "准入了"],
          [null, "别的用途"],
        ];
  const widest = (side) => Math.max(...pairs.filter((v) => v[side]).map((v) => measure(v[side]))),
    lx = Math.min(540 + dx, 1920 - rx - widest(1) + widest(0));
  const grown = [1, 2].reduce((sum, k) => sum + soon(t, rowAts[k] - 0.3, 0.35), 0),
    ys = rowAts.map((_, i) => 510 + PITCH * (i - grown / 2));
  line(bar, 510 - PITCH - 36, bar, 510 + PITCH + 36, {
    color: P.line,
    alpha: ramp(t, nots[0] + 0.45, 0.3) * four,
    width: 4,
  });
  rowAts.forEach((at, i) => {
    const y = ys[i],
      deny = { t, at: nots[i] + 0.05 },
      row = ramp(t, at - 0.1, 0.4) * four,
      barred = ramp(t, nots[i] + 0.45, 0.3);
    if (i < 2) {
      const lit = speaking(t, lefts, i);
      ring(lx, y, MR, { color: P.evidence, alpha: row, width: 2.5 });
      dot(lx, y, 10, { color: P.evidence, alpha: row });
      if (lit > 0)
        ring(lx, y, MR + 10, {
          color: P.evidence,
          alpha: lit * restMark(P.evidence, 0.5) * four,
          width: 2,
        });
      link(lx + MR + 12, y, bar - 12, y, { alpha: four, draw: deny, end: false });
      nameText(pairs[i][0], lx - MR - NAME_GAP, y, {
        align: "right",
        alpha: four * listIn(t, lefts, i),
        set: "holds",
      });
    } else
      link(lx, ys[1] + MR + 12, bar - 12, y, {
        route: "vh",
        alpha: four,
        draw: deny,
        end: false,
      });
    line(bar, y - 36, bar, y + 36, { color: P.unknown, alpha: barred * four, width: 4 });
    // What does not follow stands as an unreached outcome, in the dashed outline 17.3 gives one.
    ring(rx, y, MR, {
      color: P.muted,
      alpha: ramp(t, rights[i] - 0.1, 0.4) * four,
      width: 2.5,
      dash: [6, 6],
    });
    // A row is one item: what does not follow enters on its own words and takes its row's level.
    nameText(pairs[i][1], rx + MR + NAME_GAP, y, {
      align: "left",
      color: P.muted,
      alpha: four * named(t, rights[i]) * listLevel(t, rowAts, i),
      set: "follows",
    });
  });
}

/* Stage 5: the admission gate that permits a specified use before it begins, and adoption as that use observed. */
export function s12Adoption(s, t, admission, adoption, five) {
  // The frame of conditions is as wide as the adoption's words need: they end where its lane ends, one inset inside its
  // right wall (at most at 1590), the inset the observer keeps under its top, so the frame holds its content evenly
  // whatever the words' length.
  const x0 = 880,
    y0 = 330,
    y1 = 670,
    ly = 500,
    ux = 600,
    ex = 1035,
    ey = 405,
    INSET = 48;
  // The Chinese adoption is qualified by the words that hold its condition, the use under the stated conditions.
  const adoptTerm = [L("采用", "Adoption")],
    adoptQual = [L("在讲明的条件下用上了它", "use actually observed")];
  const room = 1590 - INSET - ex - 64,
    inline = termRowLayout(adoptTerm, adoptQual, room).one,
    termW = measure(adoptTerm[0]),
    qualW = measure(adoptQual.join(""), NOTE);
  const x1 =
    ex + 64 + Math.min(room, inline ? termW + TERM_GAP + qualW : Math.max(termW, qualW)) + INSET;
  const [permits, useAt, exampleAt, condAt, observedAt] = cues(s, [
    ["放行一项用途", "permits a specified use"],
    ["一项用途", "a specified use"],
    ["比如那次回测", "like that backtest"],
    ["讲明的条件", "stated conditions"],
    ["事后真看到", "actually observed"],
  ]);
  // The stage builds from the use at its left: it stands right of its place while the use and the gate stand alone,
  // 190 px in Chinese and 203 in English, so they stand centred, and eases left on the words that bring what lies
  // beyond the gate, the adoption, so the stage stands centred once it is whole.
  const [lone, whole] = L([190, -50], [203, -30]);
  ctx.save();
  ctx.translate(lone - (lone - whole) * glide(t, adoption + 0.05, lone - whole), 0);
  const open = soon(t, permits + 0.05, 0.45);
  path(
    [
      [x0, y0],
      [x1, y0],
      [x1, y1],
      [x0, y1],
    ],
    { color: P.line, alpha: five * ramp(t, condAt - 0.15, 0.4), width: 2 },
  );
  // The gate's two posts are one stroke, one gate.
  stroke(
    () => {
      ctx.moveTo(x0, y0);
      ctx.lineTo(x0, ly - 40);
      ctx.moveTo(x0, ly + 40);
      ctx.lineTo(x0, y1);
    },
    { color: P.authority, alpha: five, width: 5 },
  );
  if (open < 1)
    line(x0, ly - 40, x0, mix(ly + 40, ly - 40, open), {
      color: P.authority,
      alpha: five * clamp((1 - open) / 0.15),
      width: 5,
    });
  nameText(L("准入", "Admission"), x0, y0 - NAME_GAP, {
    valign: "bottom",
    color: P.authority,
    alpha: five * named(t, admission),
  });
  nameText(L("讲明的条件", "Stated conditions"), x1, y0 - NAME_GAP, {
    valign: "bottom",
    align: "right",
    color: P.muted,
    alpha: five * named(t, condAt),
  });
  token(ux, ly, { color: P.authority, alpha: five * ramp(t, permits - 0.15, 0.4), r: 12 });
  // The use's name and the backtest it stands for, as one name under the use, each line centred on it.
  const use = [L("一项用途", "A specified use")],
    example = [L("比如那次回测", "like that backtest")];
  termRow(t, use, [useAt], example, [exampleAt], ux, ly + 19 + NAME_GAP, {
    inline: false,
    align: "center",
    color: P.authority,
    alpha: five,
  });
  link(ux + 31, ly, x0 + 130, ly, {
    color: P.authority,
    alpha: five,
    draw: { t, at: permits + 0.05 },
  });
  const adopted = ramp(t, adoption - 0.1, 0.4) * five;
  link(x0 + 144, ly, x1 - INSET, ly, {
    alpha: five,
    draw: { t, at: adoption + 0.05 },
    end: false,
  });
  // One use moves along the lane inside the conditions: the single flow point of this stage.
  // English names the conditions last, so its use sets off once the frame of conditions it moves in is named.
  const q = loopPhase(
    since(t, en ? Math.max(adoption + 0.75, condAt + 0.35) : adoption + 0.75),
    x1 - INSET - 6 - x0 - 150,
  );
  if (q !== null)
    flowDot(mix(x0 + 150, x1 - INSET - 6, q), ly, 8, q, { color: P.evidence, alpha: adopted });
  stroke(() => ctx.ellipse(ex, ey, 40, 22, 0, 0, Math.PI * 2), {
    color: P.ink,
    alpha: adopted,
    width: 2.5,
  });
  dot(ex, ey, 9, { color: P.ink, alpha: adopted });
  line(ex, ey + 30, ex, ly - 14, {
    color: P.ink,
    alpha: five * ramp(t, observedAt + 0.05, 0.4),
    width: 2,
  });
  // The adoption is named with what it is, as a term and its qualifier on one line inside the frame.
  // The qualifier joins on the words that say the use is observed, within its clause and ahead of its condition's words.
  termRow(t, adoptTerm, [adoption], adoptQual, [observedAt], ex + 64, ey - labelSize(LABEL) / 2, {
    width: room,
    alpha: five,
  });
  ctx.restore();
}

/* 05's first stages: an analysis framed by the decision it must support, and the illustrative case of a better data
 * catalog. */

import { ctx } from "../../canvas.js";
import { since } from "../../drawing/flows.js";
import { restMark } from "../../drawing/levels.js";
import { link } from "../../drawing/links.js";
import { box, diamond, dot, fill, line, measure, text } from "../../drawing/strokes.js";
import { clock, cross, person, ring } from "../../drawing/symbols.js";
import { clearOfTitle, opening } from "../../framing/chapters.js";
import { listIn, named, speaking } from "../../naming/lists.js";
import { NAME_GAP, nameText, wrapName } from "../../naming/names.js";
import { LABEL, P } from "../../palette.js";
import { L, en } from "../../timeline.js";
import { ramp, soon } from "../../timing/easing.js";
import { glide, glideTime } from "../../timing/pace.js";
import { voiceTime } from "../../timing/pauses.js";
import { STAGE_CUT } from "../../timing/stages.js";

/* Stage 1: the analysis gathering inside the frame of the decision it must support. */
export function s05Decision(s, t, analysis, which, who, what, when, one) {
  // The decision's name stands over it on the line of its first part, so the two never stand as a staggered pair, and
  // the parts stand far enough right of the decision that its name keeps clear of the branches' turn.
  const parts = en
    ? [
        [who, "Who decides", "who"],
        [what, "What", "what"],
        [when, "By when", "when"],
      ]
    : [
        [who, "谁", "who"],
        [when, "在什么时候之前", "when"],
        [what, "要决定什么", "what"],
      ];
  // The problem stands centred while it is alone; on the decision's words the stage moves left as the decision joins
  // it, while the drift settles, so the problem and its decision stand centred, and on the first part's words it moves
  // again, so the problem, its decision and the decision's parts stand centred once named. The stage runs from the
  // problem's frame to the decision's name, or once its parts are named to the end of the widest part's name. The frame
  // keeps 44 px round the drift's columns and rows, clear of the drift's 20 px sway and its points.
  const GX0 = 560,
    DX0 = 1130,
    IX0 = 1360,
    SX = 100,
    FP = 44,
    partsW = Math.max(...parts.map(([, label]) => measure(label)));
  const alone = 960 - (GX0 + 2 * SX),
    decided = 960 - (GX0 - FP + DX0 + measure(L("哪个决定", "Which decision")) / 2) / 2;
  const parted = 960 - (GX0 - FP + IX0 + 28 + NAME_GAP + partsW) / 2;
  const sh =
    alone +
    (decided - alone) * glide(t, which + 0.05, decided - alone) +
    (parted - decided) * glide(t, Math.min(...parts.map(([at]) => at)) - 0.15, parted - decided);
  const g = one * clearOfTitle(s, t, 330),
    GX = GX0 + sh,
    GY = 410,
    SY = 90,
    DX = DX0 + sh,
    IX = IX0 + sh,
    ys = [400, 500, 600];
  const drift = 1 - soon(t, which - 0.2, 1.2);
  for (let k = 0; k < 15; k++) {
    const x = GX + (k % 5) * SX + Math.sin(k * 2.3 + voiceTime(t) * 0.7) * 20 * drift;
    const y = GY + Math.floor(k / 5) * SY + Math.cos(k * 1.7 + voiceTime(t) * 0.6) * 20 * drift;
    dot(x, y, 8, { color: P.muted, alpha: g * 0.85 * ramp(t, opening(s) + 0.2 + k * 0.07, 0.4) });
  }
  // The frame stands open, dashed, from the problem's words, and closes as the decision frames the problem.
  const frameQ = g * named(t, analysis),
    closed = soon(t, which + 0.05, 0.6),
    FB = GY + 2 * SY + FP;
  box(GX - FP, GY - FP, 4 * SX + 2 * FP, 2 * SY + 2 * FP, {
    stroke: P.line,
    alpha: frameQ * (1 - closed),
    radius: 14,
    width: 3,
    dash: [10, 8],
  });
  box(GX - FP, GY - FP, 4 * SX + 2 * FP, 2 * SY + 2 * FP, {
    stroke: P.line,
    alpha: frameQ * closed,
    radius: 14,
    width: 3,
  });
  nameText(L("分析", "Analysis"), GX + 2 * SX, FB + NAME_GAP, {
    valign: "top",
    alpha: g * named(t, analysis),
  });
  link(GX + 4 * SX + FP + 6, 500, DX - 30, 500, {
    alpha: g,
    draw: { t, at: which - 0.05 },
    flowing: since(t, which + 0.75),
  });
  // The decision: a ring with its point, named as it is asked; its parts branch from it.
  const ats = parts.map(([at]) => at),
    dec = named(t, which) * g;
  ring(DX, 500, 22, { color: P.authority, alpha: dec, width: 3 });
  dot(DX, 500, 8, { color: P.authority, alpha: dec });
  nameText(L("哪个决定", "Which decision"), DX, ys[0], { color: P.authority, alpha: dec });
  parts.forEach(([at, label, kind], i) => {
    const y = ys[i],
      q = ramp(t, at - 0.1, 0.4) * g,
      lit = speaking(t, ats, i);
    link(DX + 28, 500, IX - 34, y, {
      route: "hvh",
      mid: IX - 50,
      alpha: g,
      draw: { t, at: at - 0.15 },
    });
    if (lit > 0)
      ring(IX, y, 36, {
        color: P.authority,
        alpha: lit * restMark(P.authority, 0.5) * g,
        width: 2,
      });
    if (kind === "who") person(IX, y + 9, { size: 0.72, alpha: q });
    if (kind === "when") clock(IX, y, 15, { hand: 0.3, alpha: q });
    if (kind === "what") diamond(IX, y, 15, { color: P.authority, alpha: q, solid: true });
    nameText(label, IX + 28 + NAME_GAP, y, {
      align: "left",
      alpha: g * listIn(t, ats, i),
      set: "decision",
    });
  });
}

/* Stage 2: the illustrative case, a better data catalog, as a tree of what people cannot find or cannot settle. */
export function s05Catalog(
  t,
  catalog,
  notFound,
  found,
  meaning,
  quality,
  permission,
  differ,
  teamAt,
  two,
) {
  // The tree grows on the case where it stands: each node and branch arrives on its own words, and in English the case
  // glides from the first question's words to stand centred on the answers.
  const tree = 1,
    CY = 485,
    rows = [310, 660, 530, 660, 790];
  const names = en
    ? [
        "Can't find the data",
        "They find it",
        "What it means",
        "How good it is",
        "Whether they may use it",
      ]
    : ["找不到数据", "找到了", "看不懂含义", "拿不准质量", "不知道能不能用"];
  // The tree's places from the catalog at x 520: the two answers at 800, the three questions at 1160, and the fixes one
  // column right of the longest problem's name, so the shortest link along a row is 70 px.
  const ends = [800, 800, 1160, 1160, 1160].map(
    (x, i) => x + 16 + NAME_GAP + measure(names[i], LABEL),
  );
  const FX0 = Math.max(...[0, 2, 3, 4].map((i) => ends[i])) + 24 + 70 + 30;
  // Before the tree the English case stands centred on the team and the catalog, and its tree re-forms centred on its
  // answers. The Chinese names the catalog first and its users only as the tree begins, so its case cuts in on the
  // catalog 130 px left of the centre, clear of where the decision and its link stood, and moves from the cut to stand
  // centred while the catalog and then its users stand alone; its tree grows from the catalog where it stands and the
  // stage moves back as it grows, its answers standing within the frame's balance. The tree then stands centred on its
  // questions from the words of the first, and on the whole tree as the fixes join it, moving left on those words. The
  // team stands TEAM px left of the catalog's centre, its far edge 62 px further, and the catalog's edge 111 px right of
  // it; in English, where the team and the catalog stand alone until the first question, the team stands further out,
  // so the pair covers a tenth of the band.
  const fixW = Math.max(
    13,
    ...wrapName(L("各不相同", "A different fix"), 260).map((v) => measure(v) / 2),
  );
  const TEAM = L(215, 310),
    far = TEAM + 62;
  const opened = L(830, 960 + (far - 111) / 2),
    centred = (right) => 960 - (520 - far + right) / 2;
  const lone = en
    ? 0
    : (960 - opened) *
      glide(t, catalog + STAGE_CUT, 960 - opened) *
      (1 - glide(t, notFound + STAGE_CUT, 960 - opened));
  const answered = en ? centred(Math.max(ends[0], ends[1])) : opened - 520,
    asked = centred(Math.max(...ends)),
    whole = centred(FX0 + fixW);
  const T =
    answered +
    (asked - answered) * glide(t, meaning + 0.05, asked - answered) +
    (whole - asked) * glide(t, differ + 0.05, whole - asked) +
    lone;
  // The fixes join the tree at their final place, as it moves to stand centred with them.
  const lead = en
    ? (opened - 520 - answered) * (1 - glide(t, notFound + 0.05, opened - 520 - answered))
    : 0;
  const CX = 520 + T + lead,
    N1 = 800 + T + lead,
    N2 = 1160 + T + lead,
    FX = FX0 + whole;
  const team = named(t, teamAt) * two,
    TX = CX - TEAM;
  [TX - 45, TX, TX + 45].forEach((x) => person(x, 325, { alpha: team, size: 0.75 }));
  nameText(L("大家", "A team"), TX, 342 + NAME_GAP, { valign: "top", alpha: team });
  // The catalog stands on its own words.
  const book = two * named(t, catalog);
  box(CX - 110, CY - 85, 220, 170, { fill: P.row, stroke: P.ink, alpha: book, radius: 12 });
  box(CX - 86, CY - 61, 172, 34, { stroke: P.muted, alpha: book, radius: 17 });
  dot(CX - 66, CY - 44, 8, { color: P.muted, alpha: book, hollow: true });
  for (let k = 0; k < 3; k++)
    line(CX - 80, CY + k * 30, CX + 60 - k * 30, CY + k * 30, {
      color: P.line,
      alpha: book,
      width: 3,
    });
  nameText(L("数据目录", "Data catalog"), CX, CY + 85 + NAME_GAP, { valign: "top", alpha: book });
  const ats = [notFound, found, meaning, quality, permission],
    xs = [N1, N1, N2, N2, N2];
  const all = ramp(t, differ - 0.1, 0.3) * two * tree;
  // The tree: the catalog forks to the two answers, and "found" forks to its three open questions.
  if (tree)
    [0, 1].forEach((i) =>
      link(CX + 118, CY, N1 - 24, rows[i], {
        route: "hvh",
        mid: CX + 190,
        alpha: two,
        draw: { t, at: ats[i] - 0.15 },
      }),
    );
  const fork = N1 + 16 + NAME_GAP + measure(names[1], LABEL) + 24;
  if (tree)
    [2, 3, 4].forEach((i) =>
      link(fork, rows[1], N2 - 24, rows[i], {
        route: "hvh",
        mid: fork + 70,
        alpha: two,
        draw: { t, at: ats[i] - 0.15 },
      }),
    );
  if (tree)
    ats.forEach((at, i) => {
      const x = xs[i],
        y = rows[i],
        q = ramp(t, at - 0.1, 0.4) * two,
        lit = Math.max(speaking(t, ats, i), i === 1 ? 0 : all);
      if (lit > 0)
        ring(x, y, 24, {
          color: i === 1 ? P.evidence : P.unknown,
          alpha: lit * restMark(i === 1 ? P.evidence : P.unknown, 0.5) * two,
          width: 2,
        });
      if (i === 1) dot(x, y, 9, { color: P.evidence, alpha: q });
      else ring(x, y, 16, { color: P.unknown, alpha: q, width: 2.5 });
      if (i === 0) cross(x, y, 12, { alpha: q, width: 3 });
      if (i > 1)
        text("?", x, y + 1, 22, { align: "center", color: P.unknown, alpha: q, role: "mark" });
      nameText(names[i], x + 16 + NAME_GAP, y, {
        align: "left",
        alpha: two * listIn(t, ats, i),
        set: "catalog",
      });
    });
  // Each problem's own fix: one column of different shapes, each linked along its problem's row.
  const fix = ramp(t, differ - 0.1, 0.5) * two * tree,
    fy = [0, 2, 3, 4].map((i) => rows[i]);
  // The name is the key words of its caption line, not the whole line.
  nameText(L("各不相同", "A different fix"), FX, fy[0] - 40, {
    valign: "bottom",
    width: 260,
    color: P.evidence,
    alpha: two * named(t, differ),
  });
  [0, 2, 3, 4].forEach((i, k) => {
    const y = fy[k],
      from = xs[i] + 16 + NAME_GAP + measure(names[i], LABEL) + 24;
    link(from, y, FX - 30, y, {
      alpha: two * tree * ramp(t, differ - 0.1, 0.3),
      draw: { t, at: differ + 0.05 + glideTime(whole - asked) },
    });
    if (k === 0) dot(FX, y, 12, { color: P.evidence, alpha: fix });
    if (k === 1) box(FX - 11, y - 11, 22, 22, { fill: P.evidence, alpha: fix, radius: 2 });
    if (k === 2) diamond(FX, y, 14, { color: P.evidence, alpha: fix, solid: true });
    if (k === 3)
      fill(
        () => {
          ctx.moveTo(FX, y - 13);
          ctx.lineTo(FX + 13, y + 10);
          ctx.lineTo(FX - 13, y + 10);
          ctx.closePath();
        },
        { color: P.evidence, alpha: fix },
      );
  });
}

/* 29's middle stages: managers showing how they judge on real work, and the choice made by the person closest to the
 * facts. */

import { markLevel } from "../../drawing/levels.js";
import { link, rounded } from "../../drawing/links.js";
import { box, dot, labelSize, line, measure, path } from "../../drawing/strokes.js";
import { check, documentIcon, person } from "../../drawing/symbols.js";
import { listIn, listLevel, named, speaking } from "../../naming/lists.js";
import { NAME_GAP, nameText } from "../../naming/names.js";
import { blockHeight } from "../../naming/parts.js";
import { stackTops } from "../../naming/placement.js";
import { rejectedName } from "../../naming/rejected.js";
import { LABEL, P } from "../../palette.js";
import { L, en } from "../../timeline.js";
import { cue } from "../../timing/cues.js";
import { clamp, mix, ramp } from "../../timing/easing.js";
import { glide } from "../../timing/pace.js";
import { voiceTime } from "../../timing/pauses.js";
import { STAGE_CUT } from "../../timing/stages.js";

/* Stage 3: the manager marking a work document row by row, beside the three uses the guidelines refuse. */
export function s29Demonstration(s, t, demo, misuse, four) {
  // The manager and the work stand on the centre while the demonstration is said, and ease left on the words that
  // refuse the guidelines' misuse, to where they centre with the refused uses, which stand at their places. The work
  // is a page tall enough that the pair alone covers a tenth of the frame's band while the demonstration is said.
  // The English first refusal is wider than the column's others, so the stage stands further left by half of what it
  // adds, measured, keeping its balance about the centre; each English cross stays 16 px after its own words.
  const names = en
    ? ["Retrospective fault-finding", "Ceremonial review", "Micromanagement"]
    : ["事后挑错", "走过场", "微观管理"];
  const wider = en
    ? Math.max(0, measure(names[0]) - Math.max(measure(names[1]), measure(names[2]))) / 2
    : 0;
  const pair = L(-52, -112 - wider),
    shift = mix(
      L(178, 184),
      pair,
      glide(t, cue(s, "不拿这份指南", "never use") - 0.1, L(178, 184) - pair),
    );
  const dx = 750 + shift,
    dy = 300,
    dw = 250,
    dh = 310,
    px = 610 + shift,
    py = dy + dh - 40;
  person(px, py, { alpha: four, color: P.authority, size: 1.2 });
  // The work: a page with its title line and its rows, on which the manager marks each judgment in turn.
  documentIcon(dx, dy, dw, dh, { alpha: four, rows: 6 });
  line(dx + 30, dy + 40, dx + 200, dy + 40, { color: P.ink, alpha: four, width: 4 });
  const judge = clamp((voiceTime(t) - voiceTime(demo + 0.05)) / 2.2);
  [0, 1, 2].forEach((k) =>
    line(
      dx + 36,
      dy + 100 + k * 60,
      mix(dx + 36, dx + dw - 50 - k * 30, clamp(judge * 3.4 - k)),
      dy + 100 + k * 60,
      { color: P.authority, alpha: four, width: 4 },
    ),
  );
  check(dx + dw - 40, dy + 54, 30, {
    color: P.authority,
    alpha: four,
    upto: clamp((judge - 0.8) * 5),
  });
  nameText(L("管理者", "Managers"), px, dy + dh + NAME_GAP, {
    valign: "top",
    color: P.authority,
    alpha: four,
  });
  nameText(L("示范怎样判断", "Show how to judge"), dx + dw / 2, dy + dh + NAME_GAP, {
    valign: "top",
    width: 300,
    alpha: four * named(t, demo),
  });
  const LX = 1300 + pair;
  // Each English refusal is struck 16 px after its own words, which differ widely in length; the Chinese crosses, after
  // names within one character of each other, stand in one column after the longest.
  const tops = stackTops(
      names.map(() => blockHeight(1)),
      dy + dh / 2,
      64,
    ),
    markLeft = en ? null : LX + Math.max(...names.map((v) => measure(v))) + 16;
  misuse.forEach((at, i) => {
    const my = tops[i] + labelSize(LABEL) / 2,
      q = ramp(t, at - 0.15, 0.4) * four,
      lit = speaking(t, misuse, i);
    dot(LX - 40, my, 6 + 2 * lit, { color: P.unknown, alpha: q });
    // A refused name steps back only to the unknown's level, so its cross stays at 4.6:1; the dot of the one being
    // said grows.
    const level = markLevel(P.unknown, listLevel(t, misuse, i));
    rejectedName(names[i], LX, my, {
      align: "left",
      alpha: four * ramp(t, at - 0.15, 0.4) * level,
      mark: ramp(t, at + 0.05, 0.3),
      set: "misuse",
      markLeft,
    });
  });
}

/* Stage 4: the stated boundary, and the ways the person closest to the facts chooses among within it. */
export function s29Closest(t, within, closest, paths, boundCut, five) {
  const fw = mix(700, 980, glide(t, paths[0] - 0.55, 140)),
    fx = 960 - fw / 2,
    fy = 375,
    fh = 250,
    my = fy + fh / 2,
    px = fx + 480,
    sx = fx + 800;
  const edge = rounded(
    [
      [fx, fy + fh / 2],
      [fx, fy],
      [fx + fw, fy],
      [fx + fw, fy + fh],
      [fx, fy + fh],
      [fx, fy + fh / 2],
    ],
    22,
  );
  box(fx, fy, fw, fh, { fill: P.row, alpha: five, radius: 22 });
  path(edge, {
    color: P.authority,
    alpha: five,
    width: 2,
    draw: { t, at: boundCut + STAGE_CUT, least: 1.2 },
  });
  nameText(L("在边界之内", "Stated boundaries"), fx, fy - NAME_GAP, {
    align: "left",
    valign: "bottom",
    color: P.authority,
    alpha: five * named(t, within),
  });
  const cl = five,
    DX = fx + 60;
  documentIcon(DX, my - 64, 84, 108, { alpha: cl, rows: 3, stroke: P.evidence });
  person(px, my + 2, { alpha: cl, size: 1.3 });
  const closestY = my + 44 + NAME_GAP + labelSize(LABEL) / 2,
    D = closestY - my;
  nameText(L("离事实最近的负责人", "Closest to the facts"), px, closestY, {
    width: 330,
    alpha: five * named(t, closest),
  });
  const ys = [my - D, my, my + D],
    names = en ? ["Method", "Tools", "Path"] : ["方法", "工具", "实施路径"];
  // Each way draws on at the stage's ink from the person, so its tip grows from nothing whenever its draw sets off and
  // no drawn stretch inks in within a frame.
  paths.forEach((at, i) => {
    const q = ramp(t, at - 0.15, 0.4) * five,
      lit = speaking(t, paths, i);
    link(px + 48, my, sx - 20, ys[i], {
      route: "hvh",
      mid: fx + 660,
      r: 18,
      alpha: five,
      draw: { t, at: at - 0.15 },
      end: false,
    });
    dot(sx, ys[i], 8 + 2 * lit, { color: P.evidence, alpha: q });
    nameText(names[i], sx + 13 + NAME_GAP, ys[i], {
      align: "left",
      alpha: five * listIn(t, paths, i),
      set: "paths",
    });
  });
}

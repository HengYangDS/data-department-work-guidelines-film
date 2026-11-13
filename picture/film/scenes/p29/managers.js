/* 29's first stages: what managers make clear and act on in time, and the management system repaired first under
 * strain. */

import { ctx } from "../../canvas.js";
import { s29Wheel } from "../../drawing/gears.js";
import { restMark } from "../../drawing/levels.js";
import { link } from "../../drawing/links.js";
import { box, diamond, dot, fill, line, measure, path, stroke } from "../../drawing/strokes.js";
import { check, person, ring } from "../../drawing/symbols.js";
import { opening } from "../../framing/chapters.js";
import { listIn, listLevel, named, speaking } from "../../naming/lists.js";
import { NAME_GAP, nameText } from "../../naming/names.js";
import { radialName, railNames, railStations } from "../../naming/placement.js";
import { P } from "../../palette.js";
import { L, en } from "../../timeline.js";
import { cue } from "../../timing/cues.js";
import { mix, ramp, soon } from "../../timing/easing.js";
import { voiceTime } from "../../timing/pauses.js";

/* Stage 1: the manager joined to two rows, what they make clear and where they act in time. */
export function s29Managers(s, t, managers, clarify, conflicts, stalled, protect, one) {
  // The manager stands at 325 and the duties span 645 to 1565, so the named structure stands about the centre; in
  // English the manager stands 25 px further left and the duties span 620 to 1620, so the last act's name stands whole
  // on one line, 40 px from its neighbour, as no break keeps its phrase.
  const MX = L(325, 300),
    TX = L(475, 450),
    RA = 375,
    RB = 665,
    MY = (RA + RB) / 2,
    place = ramp(t, opening(s) + 0.1, 0.6) * one;
  const namesA = en
    ? ["Direction", "Priorities", "Decision boundaries", "Resources"]
    : ["方向", "优先级", "决定的边界", "资源"];
  const namesB = en
    ? ["Cross-domain conflicts", "Stalled decisions", ["Those who expose problems"]]
    : ["跨领域的冲突", "久拖不决的事项", "暴露问题的人"];
  const xa = railStations(namesA, L(645, 620), L(1565, 1620), { wrap: 300 }),
    xb = xa.slice(0, namesB.length);
  const duties = [...clarify, conflicts, stalled, protect];
  person(MX, MY - 24, {
    alpha: one * ramp(t, managers - 0.2, 0.5),
    color: P.authority,
    size: 1.3,
  });
  nameText(L("管理者", "Managers"), MX, MY + NAME_GAP + 18, {
    valign: "top",
    color: P.authority,
    alpha: one * named(t, managers),
  });
  // Both rails are drawn firm, so the structure the managers make clear spans the frame from the first words.
  [
    [xa, RA, 0, place],
    [xb, RB, 4, named(t, conflicts) * one],
  ].forEach(([xs, ry, k0, rail]) => {
    link(MX + 56, MY, xs.at(-1), ry, {
      route: "hvh",
      mid: TX,
      alpha: rail,
      width: 3,
      end: false,
    });
    xs.forEach((x, j) => {
      const q = ramp(t, duties[k0 + j] - 0.15, 0.4) * one,
        lit = speaking(t, duties, k0 + j);
      // The station covers its rail where it sits as it arrives.
      dot(x, ry, 8, { color: P.ground, alpha: q });
      dot(x, ry, 8, { color: P.authority, alpha: q });
      if (lit > 0)
        ring(x, ry, 17, {
          color: P.authority,
          alpha: lit * restMark(P.authority, 0.5) * one,
          width: 2,
        });
    });
  });
  // The top row's marks: a compass turning to its heading, priority bars, a bounded frame and a stack of resources.
  clarify.forEach((at, i) => {
    const x = xa[i],
      y = RA - 96,
      q = ramp(t, at - 0.15, 0.4) * one;
    if (i === 0) {
      ring(x, y, 32, { color: P.authority, alpha: q, width: 2.5 });
      const a = (-Math.PI / 4) * soon(t, at - 0.15, 0.6) - Math.PI / 4;
      fill(
        () => {
          ctx.moveTo(x + Math.cos(a) * 24, y + Math.sin(a) * 24);
          ctx.lineTo(x + Math.cos(a + 1.57) * 6, y + Math.sin(a + 1.57) * 6);
          ctx.lineTo(x - Math.cos(a) * 16, y - Math.sin(a) * 16);
          ctx.lineTo(x - Math.cos(a + 1.57) * 6, y - Math.sin(a + 1.57) * 6);
          ctx.closePath();
        },
        { color: P.authority, alpha: q },
      );
    } else if (i === 1)
      [88, 64, 40].forEach((w, k) =>
        box(x - 44, y - 26 + k * 18, w, 12, {
          fill: P.authority,
          alpha: q * mix(1, restMark(P.authority), k / 2),
          radius: 3,
        }),
      );
    else if (i === 2) {
      box(x - 46, y - 32, 92, 64, { stroke: P.authority, alpha: q, radius: 10 });
      dot(x, y, 6, { color: P.ink, alpha: q });
    } else
      [
        [64, 0],
        [50, -21],
        [36, -42],
      ].forEach(([w, dy]) =>
        box(x - w / 2, y + 12 + dy, w, 18, { stroke: P.authority, alpha: q, radius: 4 }),
      );
  });
  // The row beneath: two domains whose pointers face apart turn to one direction when the next act is named; a
  // decision paused by two bars is settled with a check on the last act; a person raising a flag is covered by an arc.
  const iy = RB - 96,
    [cx, sx, rx] = xb,
    cf = ramp(t, conflicts - 0.15, 0.4) * one,
    fix = soon(t, stalled + 0.05, 0.6);
  [-1, 1].forEach((side) => {
    const bx = cx + side * 21,
      a = mix((side * Math.PI) / 2, 0, fix),
      r = 10;
    box(bx - 17, iy - 15, 34, 30, { stroke: P.muted, alpha: cf, radius: 5 });
    const tri = () => {
      ctx.moveTo(bx + Math.cos(a) * r, iy + Math.sin(a) * r);
      ctx.lineTo(bx + Math.cos(a + 2.4) * r * 0.8, iy + Math.sin(a + 2.4) * r * 0.8);
      ctx.lineTo(bx + Math.cos(a - 2.4) * r * 0.8, iy + Math.sin(a - 2.4) * r * 0.8);
      ctx.closePath();
    };
    fill(tri, { color: P.unknown, alpha: cf * (1 - fix) });
    fill(tri, { color: P.authority, alpha: cf * fix });
  });
  const st = ramp(t, stalled - 0.15, 0.4) * one,
    settle = ramp(t, protect + 0.05, 0.4);
  diamond(sx, iy, 30, { color: P.muted, alpha: st * (1 - settle) });
  diamond(sx, iy, 30, { color: P.authority, alpha: st * settle });
  [-6, 6].forEach((d) =>
    line(sx + d, iy - 10, sx + d, iy + 10, { color: P.ink, alpha: st * (1 - settle), width: 3 }),
  );
  check(sx, iy + 1, 22, { color: P.authority, alpha: st * settle, upto: settle });
  const pr = ramp(t, protect - 0.15, 0.4) * one,
    px = rx - 7;
  person(px, iy - 4, { alpha: pr, size: 0.6 });
  line(px + 19, iy + 22, px + 19, iy - 27, { color: P.ink, alpha: pr, width: 2 });
  box(px + 19, iy - 27, 18, 12, { fill: P.unknown, alpha: pr, radius: 2 });
  stroke(
    () =>
      ctx.arc(
        px + 6,
        iy + 11,
        38,
        Math.PI * 1.1,
        Math.PI * mix(1.1, 1.9, soon(t, protect + 0.05, 0.6)),
      ),
    { color: P.authority, alpha: pr, width: 3 },
  );
  // The list's own return to full ink would come only as the strains begin, at this stage's cut, so the whole list
  // returns on the sentence's last words instead, while the stage still stands.
  const whole = ramp(t, cue(s, "问题的人", "expose problems") + 0.05, 0.4);
  const ink = (i) => one * ramp(t, duties[i] - 0.15, 0.4) * mix(listLevel(t, duties, i), 1, whole);
  railNames(namesA, xa, RA, { wrap: 300, alpha: (i) => ink(i), set: "duties" });
  railNames(namesB, xb, RB, { wrap: 320, alpha: (i) => ink(i + 4), set: "duties" });
}

/* Stage 2: the management system as a gear whose rim cracks at each strain, repaired before a member is blamed. */
export function s29Strain(t, strains, repair, blame, three) {
  const cx = L(953, 947);
  const cy = 470,
    R = 150,
    k = R / 100,
    fixed = soon(t, repair + 0.05, 0.8),
    turn = Math.max(0, voiceTime(t) - voiceTime(repair + 0.05)) * 0.25 * fixed;
  s29Wheel(cx, cy, R, { turn, alpha: three });
  dot(cx, cy, 10, { color: P.evidence, alpha: three * fixed });
  const names = en
    ? [
        "Goals conflict",
        "Priorities drift",
        "Resources run short",
        "Decisions stall",
        "Interfaces mislead",
      ]
    : ["目标冲突", "优先级变来变去", "资源不足", "决定一拖再拖", "分工衔接让人误判"];
  // The strains crack the rim from the upper left in spoken order, the first three clockwise; the two left still stand
  // on the left, away from the member on the right, the wider name at the rim's left end, where it stands as far out
  // as the other at the lower left: in English the fifth, in Chinese the fourth, since the fifth's name there would
  // reach so far left that no still place of the gear centres both the first three strains and the five.
  const angles = en ? [-2.4, -0.74, 0.74, 2.4, Math.PI] : [-2.4, -0.74, 0.74, Math.PI, 2.4];
  strains.forEach((at, i) => {
    const a = angles[i],
      q = ramp(t, at - 0.15, 0.4) * three,
      lit = speaking(t, strains, i),
      px = cx + Math.cos(a) * R,
      py = cy + Math.sin(a) * R;
    const nx = -Math.sin(a) * 9 * k,
      ny = Math.cos(a) * 9 * k;
    const crack = [
      [px + Math.cos(a) * 22 * k + nx, py + Math.sin(a) * 22 * k + ny],
      [px + Math.cos(a) * 6 * k - nx, py + Math.sin(a) * 6 * k - ny],
      [px - Math.cos(a) * 8 * k + nx, py - Math.sin(a) * 8 * k + ny],
      [px - Math.cos(a) * 20 * k - nx, py - Math.sin(a) * 20 * k - ny],
    ];
    path(crack, { color: P.unknown, alpha: q * (1 - fixed), width: 4 + 2 * lit });
    path(crack, { color: P.evidence, alpha: q * fixed, width: 4 });
    radialName(names[i], cx, cy, R * 1.24 + 12, a, {
      width: L(260, 300),
      alpha: three * listIn(t, strains, i),
      set: "strains",
    });
  });
  // The repair and the member are named by the key words of their clauses, not their caption lines whole.
  nameText(L("先从管理上改起", "Management system"), cx, cy + R * 1.24 + NAME_GAP + 24, {
    valign: "top",
    color: P.evidence,
    alpha: three * named(t, repair),
  });
  // The member stands beside the gear, on the words that refuse to blame them; nothing is pinned on them. Their name
  // starts at the strain names' distance from the rim, on the right, where no strain stands, and the member stands
  // over it, the two centred on the gear's axis between the strains on that side.
  const member = L("不要急着怪成员", "A member's capability"),
    mx = cx + R * 1.24 + 12 + NAME_GAP + measure(member) / 2;
  const bl = ramp(t, blame - 0.15, 0.4) * three,
    memberTop = cy + 42.75;
  person(mx, memberTop - 58 - NAME_GAP, { alpha: bl, size: 1.1, color: P.muted });
  nameText(member, mx, memberTop, {
    valign: "top",
    color: P.muted,
    alpha: three * named(t, blame),
  });
}

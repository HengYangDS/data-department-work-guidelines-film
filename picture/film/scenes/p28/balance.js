/* 28's balance: the qualities that never make up for some risks. */

import { ctx } from "../../canvas.js";
import { box, dot, labelSize, line, stroke } from "../../drawing/strokes.js";
import { listIn, listLevel, named, speaking } from "../../naming/lists.js";
import { NAME_GAP, nameText } from "../../naming/names.js";
import { stackTops } from "../../naming/placement.js";
import { NOTE, termRow, termRowLayout } from "../../naming/terms.js";
import { LABEL, P } from "../../palette.js";
import { L, en } from "../../timeline.js";
import { cue } from "../../timing/cues.js";
import { soon } from "../../timing/easing.js";

/* Stage 3: the balance on which fluency, effort and Agent efficiency never outweigh the risks. */
export function s28Balance(s, t, weights, risks, g3) {
  // The English risks carry longer qualifiers, so its balance stands 35 px further left to centre once they are named.
  const R = 470,
    cx = L(930, 895),
    cy = 640,
    H = 70,
    B = 150;
  const theta =
    -0.02 * weights.reduce((a, at) => a + soon(t, at + 0.05, 0.5), 0) +
    0.2 * soon(t, risks[0] + 0.05, 0.8);
  const lx = cx - R * Math.cos(theta),
    ly = cy - R * Math.sin(theta),
    rx = cx + R * Math.cos(theta),
    ry = cy + R * Math.sin(theta);
  stroke(
    () => {
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx - 50, cy + B);
      ctx.lineTo(cx + 50, cy + B);
      ctx.closePath();
    },
    { color: P.ink, alpha: g3, width: 3 },
  );
  line(cx - 120, cy + B, cx + 120, cy + B, { color: P.ink, alpha: g3, width: 3 });
  line(lx, ly, rx, ry, { color: P.ink, alpha: g3, width: 4 });
  dot(cx, cy, 7, { color: P.ink, alpha: g3 });
  // The two trays hang from the beam on one stroke, so the balance reads as one structure rather than as two like
  // hangers each waiting for a name of its own.
  stroke(
    () =>
      [
        [lx, ly],
        [rx, ry],
      ].forEach(([x, y]) => {
        ctx.moveTo(x, y);
        ctx.lineTo(x, y - H);
      }),
    { color: P.ink, alpha: g3, width: 3 },
  );
  [
    [lx, ly, P.muted, 170],
    [rx, ry, P.unknown, 220],
  ].forEach(([x, y, color, w]) => {
    line(x - w, y - H, x + w, y - H, { color, alpha: g3, width: 4 });
    line(x - w, y - H, x - w, y - H - 12, { color, alpha: g3, width: 3 });
    line(x + w, y - H, x + w, y - H - 12, { color, alpha: g3, width: 3 });
  });
  // The light tray: the qualities, one column of names, each beside its small weight.
  const wNames = en ? ["Fluency", "Effort", "Agent efficiency"] : ["流畅", "努力", "智能体再高效"],
    em = labelSize(LABEL);
  const INSET = 16,
    wTops = stackTops(
      wNames.map(() => em),
      0,
      18,
    ),
    wLeft = lx - 170 + INSET + 36,
    wBase = ly - H - 24 - (wTops[2] + em);
  wNames.forEach((v, i) => {
    const y = wBase + wTops[i] + em / 2;
    box(wLeft - 36, y - 9, 18, 18, {
      fill: P.muted,
      alpha: g3 * named(t, weights[i]),
      radius: 3,
    });
    nameText(v, wLeft, y, { align: "left", alpha: g3 * listIn(t, weights, i), set: "qualities" });
  });
  // The heavy tray: the risks, one column of term rows on the tray, each beside its weight, lit while it is said. Each
  // risk is said as one caption line, so a row names its risk by the key words rather than repeating that line whole:
  // the claimed completion stands currently unverified, and Chinese drops the connecting 就.
  const rows = en
    ? [
        [
          ["Fabricated, hidden or unverified facts"],
          [risks[0]],
          ["as established"],
          [cue(s, "", "presented as established")],
        ],
        [
          ["Completion claimed"],
          [risks[1]],
          ["currently unverified"],
          [cue(s, "", "without current verification")],
        ],
        [
          ["Agent output"],
          [risks[2]],
          ["as fact, authorization or responsibility"],
          [cue(s, "", "standing in for")],
        ],
      ]
    : [
        [["没核实的、编造的、挑过的事实"], [risks[0]], ["说成确定"], [cue(s, "说成确定", "")]],
        [["没核验当前版本"], [risks[1]], ["说完成"], [cue(s, "就说完成", "")]],
        [
          ["智能体的输出"],
          [risks[2]],
          ["充当事实或授权，", "或者让它替人负责"],
          [cue(s, "充当事实或授权", ""), cue(s, "或者让它替人负责", "")],
        ],
      ];
  const width = 520,
    slot = Math.max(
      ...rows.map(([term, , qual]) => termRowLayout(term, qual, width, false).height),
    ),
    heights = rows.map(() => slot);
  // Each risk is a name over its qualifier; the English rows, two lines each, stand 28 px apart, further than a risk's own
  // lines, so each risk reads as one item. The Chinese rows each keep room for three lines, which already sets them apart.
  const tops = stackTops(heights, 0, L(16, 28)),
    rLeft = rx - 220 + INSET + 36,
    rBase = ry - H - 24 - (tops.at(-1) + heights.at(-1));
  // The risks' heading stands under the heavy end of the beam, so the balance is named as its first words are said.
  nameText(L("有些风险", "Risks like these"), rx, ry + NAME_GAP, {
    valign: "top",
    size: NOTE,
    color: P.muted,
    alpha: g3 * named(t, cue(s, "有些风险", "risks like these")),
  });
  rows.forEach(([term, termAts, qual, qualAts], i) => {
    const top = rBase + tops[i],
      my = top + em / 2,
      lit = speaking(t, risks, i);
    box(rLeft - 36 - 2 * lit, my - 9 - 2 * lit, 18 + 4 * lit, 18 + 4 * lit, {
      fill: P.unknown,
      alpha: g3 * named(t, risks[i]),
      radius: 3,
    });
    termRow(t, term, termAts, qual, qualAts, rLeft, top, {
      width,
      alpha: g3 * listLevel(t, risks, i),
      set: "risks",
      build: true,
      inline: false,
    });
  });
}

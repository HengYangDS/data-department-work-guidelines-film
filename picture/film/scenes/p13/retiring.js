/* 13's retiring of the old identifier: the tree from it to its affected consumers. */

import { ctx } from "../../canvas.js";
import { link } from "../../drawing/links.js";
import { box, fill, labelSize, line, measure, path, stroke, text } from "../../drawing/strokes.js";
import { check, documentIcon, stopSign } from "../../drawing/symbols.js";
import { named } from "../../naming/lists.js";
import { NAME_GAP, nameText } from "../../naming/names.js";
import { stackTops } from "../../naming/placement.js";
import { NOTE, TERM_GAP, termRow } from "../../naming/terms.js";
import { LABEL, P } from "../../palette.js";
import { L } from "../../timeline.js";
import { cueFrom } from "../../timing/cues.js";
import { mix, ramp } from "../../timing/easing.js";
import { drawShare, glide } from "../../timing/pace.js";
import { series } from "../p11/prices.js";

/* Stage 4: the tree from the old identifier to its affected consumers, migrated or not, before it is retired. */
export function s13Retiring(s, t, retire, migrated, ended, notice, p4) {
  const [showAt, affected, owner, notProof] = [
    cueFrom(s, "先证明每个", "show that every", retire),
    cueFrom(s, "每个受影响的使用方", "every affected consumer", retire),
    cueFrom(s, "决策负责人", "the decision owner", retire),
    cueFrom(s, "证明不了", "does not prove migration", retire),
  ];
  // The identifier's card and the consumers' column share a top, so their headings share a baseline; the tree runs
  // from the card's middle.
  const CY = 480,
    ys = stackTops(
      [0, 1, 2, 3].map(() => 52),
      CY,
      40,
    ).map((v) => v + 26),
    tree = ramp(t, showAt - 0.1, 0.5) * p4;
  // The stage spans from the card's left edge to its farthest name: the consumers' heading, a name beside the
  // consumers or the notice's row under the card, each measured in its edition.
  const consumers = L("每个受影响的使用方", "Every affected consumer"),
    noticeTerm = [L("弃用通知", "A deprecation notice")],
    noticeQual = [L("证明不了迁移", "does not prove migration")];
  const RW = 260,
    wide = Math.max(
      380 + measure(consumers),
      584 +
        Math.max(
          measure(L("都已迁移", "Migrated")),
          measure(L("决策负责人", "The decision owner")),
        ),
      112 + measure(noticeTerm[0]) + TERM_GAP + measure(noticeQual[0], NOTE),
    );
  const RX = mix(960 - RW / 2, 960 - wide / 2, glide(t, showAt + 0.05, (wide - RW) / 2)),
    RH = 100,
    RY = ys[0] - 26 + RH,
    CX = RX + 420,
    SX = RX + 530,
    NX = SX + 54;
  box(RX, RY - RH, RW, RH * 2, { fill: P.row, stroke: P.ink, alpha: p4, radius: 12 });
  [-50, 0, 50].forEach((dy) =>
    line(RX + RW / 2 - 30, RY + dy, RX + RW / 2 + 30, RY + dy, {
      color: P.muted,
      alpha: p4,
      width: 3,
    }),
  );
  nameText(L("旧公司代码", "Old identifier"), RX, RY - RH - NAME_GAP, {
    align: "left",
    valign: "bottom",
    alpha: p4 * named(t, retire),
  });
  text("ID A1", RX + RW / 2, RY + RH + 34, 26, {
    role: "mark",
    align: "center",
    color: P.muted,
    alpha: p4,
  });
  // The consumers depend on the identifier: its links to them stand at the structure tier as the consumers arrive. The
  // four consumers are one column, drawn as one set of frames with their series.
  const seen = ramp(t, showAt - 0.15, 0.4) * p4;
  fill(() => ys.forEach((y) => ctx.roundRect(CX - 40, y - 26, 80, 52, 8)), {
    color: P.row,
    alpha: seen,
  });
  stroke(() => ys.forEach((y) => ctx.roundRect(CX - 40, y - 26, 80, 52, 8)), {
    color: P.ink,
    alpha: seen,
    width: 2,
  });
  stroke(
    () =>
      ys.forEach((y, k) =>
        series((x) => y + 8 - 10 * Math.sin((x - CX) / 9 + k), CX - 26, CX + 26, 4).forEach(
          ([x, v], i) => (i ? ctx.lineTo(x, v) : ctx.moveTo(x, v)),
        ),
      ),
    { color: P.evidence, alpha: seen, width: 2 },
  );
  ys.forEach((y) =>
    link(RX + RW + 12, RY, CX - 52, y, { route: "hvh", mid: RX + RW + 80, r: 12, alpha: tree }),
  );
  const moved = ramp(t, migrated - 0.1, 0.4) * p4,
    ended2 = ramp(t, ended - 0.1, 0.4) * p4;
  [0, 1, 2].forEach((k) => check(SX, ys[k] + 2, 26, { alpha: moved }));
  stopSign(SX, ys[3], 18, { alpha: ended2, color: P.authority });
  path(
    [
      [SX + 26, ys[0]],
      [SX + 36, ys[0]],
      [SX + 36, ys[2]],
      [SX + 26, ys[2]],
    ],
    { color: P.evidence, alpha: moved * 0.8, width: 2 },
  );
  nameText(consumers, CX - 40, ys[0] - 26 - NAME_GAP, {
    align: "left",
    valign: "bottom",
    alpha: p4 * named(t, affected),
  });
  nameText(L("都已迁移", "Migrated"), NX, ys[1], {
    align: "left",
    color: P.evidence,
    alpha: p4 * named(t, migrated),
  });
  nameText(L("决策负责人", "The decision owner"), NX, ys[3], {
    align: "left",
    color: P.authority,
    alpha: p4 * named(t, owner),
  });
  // The notice under the identifier: its way up stops at a bar halfway, on the words that deny it.
  const nt = ramp(t, notice - 0.15, 0.4) * p4,
    nx = RX + 45,
    ny = RY + RH + 120,
    wayTop = RY + RH + 12;
  documentIcon(nx - 45, ny, 90, 116, { alpha: nt, rows: 3, stroke: P.muted });
  link(nx, ny - 12, nx, wayTop, {
    color: P.unknown,
    alpha: nt,
    upto: 0.5 * drawShare(t, notProof - 0.1, 0.5 * Math.abs(wayTop - (ny - 12)), 0.5),
    end: false,
    dash: [6, 6],
  });
  line(nx - 30, (ny - 12 + wayTop) / 2, nx + 30, (ny - 12 + wayTop) / 2, {
    color: P.unknown,
    alpha: ramp(t, notProof + 0.3, 0.3) * p4,
    width: 4,
  });
  termRow(
    t,
    noticeTerm,
    [notice],
    noticeQual,
    [notProof],
    nx + 45 + NAME_GAP,
    ny + 58 - labelSize(LABEL) / 2,
    { alpha: p4 },
  );
}

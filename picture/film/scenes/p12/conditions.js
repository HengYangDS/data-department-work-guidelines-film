/* 12's first stages: the eight conditions that must hold before data enters a lasting work system, and the labels
 * data takes when one is unmet. */

import { ctx } from "../../canvas.js";
import { tableIcon } from "../../drawing/datasets.js";
import { restMark } from "../../drawing/levels.js";
import { link } from "../../drawing/links.js";
import { dot, labelSize, line, measure, stroke, text } from "../../drawing/strokes.js";
import { ring } from "../../drawing/symbols.js";
import { listIn, listLevel, named, speaking } from "../../naming/lists.js";
import { NAME_GAP, nameText } from "../../naming/names.js";
import { CONTENT_CY, radialName, stackTops } from "../../naming/placement.js";
import { NOTE, termRow, termRowLayout } from "../../naming/terms.js";
import { LABEL, P } from "../../palette.js";
import { L, en } from "../../timeline.js";
import { cueFrom, cues } from "../../timing/cues.js";
import { ramp } from "../../timing/easing.js";
import { glide } from "../../timing/pace.js";
import { s12Arc } from "./arc.js";

/* Stage 1: the data and the lasting work system as a ring of eight conditions that must all hold. */
export function s12Conditions(s, t, together, conds, arc, one) {
  const cy = CONTENT_CY,
    R = 230,
    [dataAt, enterAt, systemAt] = cues(s, [
      ["数据要", "before data enters"],
      ["用在", "enters"],
      ["工作里", "lasting work system"],
    ]);
  const names = en
    ? [
        "Meaning explainable",
        "Source traceable",
        "Time identifiable",
        "Process reproducible",
        "Quality verifiable",
        "Operation observable",
        "Owner identifiable",
        "Use bounded",
      ]
    : ["含义", "来源", "时间", "过程能复现", "质量能核验", "运行看得见", "有负责人", "用途有边界"];
  // The stage is centred on its extent, from the data's table at the left to the end of the longest name beginning
  // right of the ring, so the shorter Chinese names do not leave it standing left of the centre. It stands 3 px right
  // of exact, which keeps the data's way, across the cut, out of the motion audit's jump band to the next table.
  const reach = Math.max(
    ...names.map((v, i) =>
      Math.cos(arc(i)[2]) > 0.3 ? Math.cos(arc(i)[2]) * (R + 18 + NAME_GAP) + measure(v) : 0,
    ),
  );
  const shift = 963 - (380 - 90 + 1120 + reach) / 2,
    cx = 1120 + shift,
    dx = 380 + shift;
  // The English names its eight conditions three seconds after the data and its system stand, so until the first is
  // named the two stand 80 px right, about the centre without the names, and ease to their place on its words.
  ctx.save();
  ctx.translate(en ? 80 * (1 - glide(t, conds[0] + 0.05, 80)) : 0, 0);
  ring(cx, cy, R, {
    color: P.line,
    alpha: one * named(t, systemAt),
    width: 3.5,
    start: Math.PI + 0.1,
    upto: 1 - 0.2 / (2 * Math.PI),
  });
  tableIcon(dx - 90, cy - 60, 180, 120, { alpha: one });
  // Chinese says the data and the system it enters in one phrase, which names the system from its first words, so with
  // the eight conditions and their three groups the stage carries twelve names; its table is the data it speaks of.
  // The table's name stands level with the ring's nearest name, the owner's, when that leaves at least the name gap
  // above the table, so the two read on one line.
  const level = Math.min(
    cy + Math.sin(arc(6)[2]) * (R + 18 + NAME_GAP),
    cy - 60 - NAME_GAP - labelSize(LABEL) / 2,
  );
  if (en) nameText("Data", dx, level, { alpha: one * named(t, dataAt) });
  link(dx + 102, cy, cx - R - 30, cy, { alpha: one, draw: { t, at: enterAt + 0.05 } });
  // The Chinese system name stands in two lines, so the two groups named above it on either side keep clear of its ends.
  nameText(L(["数据要长期", "用在工作里"], "Lasting work system"), cx, cy, {
    width: 2 * R - 80,
    color: P.evidence,
    alpha: one * named(t, L(dataAt, systemAt)),
  });
  // The eight close around the system as one thin ring on "all hold" (in Chinese "同时满足"), drawn on as one stroke.
  ring(cx, cy, R + 18, {
    color: P.evidence,
    alpha: one * ramp(t, together + 0.05, 0.3),
    width: 2,
    draw: { t, at: together + 0.05 },
  });
  if (!en) {
    // Each of the three groups then thickens the run of the ring over the conditions it gathers, its run fading in
    // over the thin ring on the words that open it, and is named inside it on those words. The three names stand
    // inside the ring 120° apart, each within the run it gathers, the upper two 30° above the centre line, so they
    // balance about the system's two-line name rather than crowding over it.
    const titles = ["说得清", "对得上", "管得住"],
      opens = cues(
        s,
        titles.map((v) => [v, ""]),
      ),
      at = [-Math.PI / 6, Math.PI / 2, (Math.PI * 7) / 6];
    const edge = [0, 3, 5, 8].map((i) => -Math.PI / 2 + (i * Math.PI) / 4);
    titles.forEach((title, g) => {
      const am = at[g],
        lit = ramp(t, opens[g] - 0.1, 0.4);
      if (lit > 0)
        stroke(() => s12Arc(cx, cy, R + 18, edge[g], edge[g + 1]), {
          color: P.evidence,
          alpha: one * lit,
          width: 4,
        });
      nameText(title, cx + Math.cos(am) * (R - 72), cy + Math.sin(am) * (R - 72), {
        color: P.evidence,
        alpha: one * named(t, opens[g]),
        set: "groups",
      });
    });
  }
  conds.forEach((at, i) => {
    const [a0, a1, am] = arc(i),
      q = ramp(t, at - 0.1, 0.4),
      lit = speaking(t, conds, i);
    stroke(() => s12Arc(cx, cy, R, a0, a1), {
      color: P.evidence,
      alpha: q * one,
      width: 10 + 4 * lit,
      cap: "butt",
    });
    radialName(names[i], cx, cy, R + 18, am, {
      width: 420,
      alpha: one * listIn(t, conds, i),
      set: "conditions",
    });
  });
  ctx.restore();
}

/* Stage 2: the ring with one arc missing, and the way from it to the four labels unqualified data takes. */
export function s12Labels(s, t, conds, labels, arc, two) {
  const dx = L(30, 0),
    cx = 670 + dx,
    cy = CONTENT_CY,
    R = 150,
    gone = 7,
    sx = 1050 + dx,
    mx = 1110 + dx;
  const [labelAt, permitAt] = cues(s, [
    ["标成", "label the data"],
    ["和权限", "and permission"],
  ]);
  const [denyAt, assetAt] = cues(s, [
    ["不因此", "does not make"],
    ["完全合格的资产", "fully qualified asset"],
  ]);
  const rows = en
    ? [["Exploratory"], ["Temporary"], ["Limited use"], ["Awaiting verification"]]
    : [["探索"], ["临时"], ["有限使用"], ["待核验"]];
  const quals = [[], [], en ? ["own evidence", " and permission"] : ["自己的证据", "和权限"], []];
  // The asset stands on the limited use's line beyond its block, at 12.4's spacing: its way, the bar that stops it,
  // its open ring and its name after the ring.
  const NX = mx + NAME_GAP + 8,
    blockW = (r) =>
      Math.max(measure(rows[r].join("")), quals[r].length ? measure(quals[r].join(""), NOTE) : 0);
  const columnEnd = NX + Math.max(...rows.map((_, r) => blockW(r))),
    wx = NX + blockW(2) + 24,
    bx = wx + 80,
    rx = bx + 60;
  const assetName = L("完全合格的资产", "Fully qualified asset"),
    room = Math.max(0, (rx + 24 + NAME_GAP + measure(assetName) - columnEnd) / 2);
  // While only the first two labels stand, which are short, the stage stands right of its place by as much as centres
  // them, 40 px in Chinese and 60 in English, and eases to its place as the limited use, the widest, is named.
  const early = L(40, 60);
  ctx.save();
  ctx.translate(
    960 -
      cx -
      (960 - cx - early) * glide(t, labelAt + 0.05, 960 - cx - early) -
      early * glide(t, labels[2] - 0.1, early) -
      room * glide(t, denyAt + 0.05, room),
    0,
  );
  const limitedAt = cueFrom(s, "有限使用也要", "a limited use needs", labels[2]);
  tableIcon(cx - 75, cy - 50, 150, 100, { alpha: two });
  conds.forEach((_, i) => {
    const [a0, a1] = arc(i);
    stroke(
      () => ctx.arc(cx, cy, R, a0, a1),
      i === gone
        ? { color: P.unknown, alpha: two, width: 6, cap: "butt", dash: [8, 8] }
        : { color: P.evidence, alpha: two, width: 10, cap: "butt" },
    );
  });
  const am = arc(gone)[2];
  text("?", cx + Math.cos(am) * (R + 34), cy + Math.sin(am) * (R + 34), 26, {
    role: "mark",
    align: "center",
    color: P.unknown,
    alpha: two,
  });
  nameText(L("任何一条不满足", "If any condition is unmet"), cx, cy + R + 18 + NAME_GAP, {
    valign: "top",
    alpha: two,
  });
  // The data's way out of the ring is the trunk of the labels' branches, drawn firm as it is said to be labelled.
  link(cx + R + 24, cy, sx, cy, {
    alpha: two,
    width: 3,
    draw: { t, at: labelAt + 0.05 },
    end: false,
  });
  const width = 1780 - mx - NAME_GAP - 8,
    tops = stackTops(
      rows.map((term, r) => termRowLayout(term, quals[r], width, false).height),
      cy,
      60,
    );
  rows.forEach((term, r) => {
    const my = tops[r] + labelSize(LABEL) / 2,
      q = ramp(t, labels[r] - 0.15, 0.4) * two,
      again = ramp(t, limitedAt - 0.15, 0.3);
    const lit =
      r === 2
        ? Math.max(speaking(t, labels, r), again)
        : speaking(t, labels, r) * (r === 3 ? 1 - again : 1);
    link(sx, cy, mx - 16, my, {
      route: "vh",
      alpha: two,
      draw: { t, at: labels[r] - 0.15 },
      end: false,
    });
    dot(mx, my, 11, { color: P.unknown, alpha: q });
    if (lit > 0)
      ring(mx, my, 17, {
        color: P.unknown,
        alpha: lit * restMark(P.unknown, 0.6) * two,
        width: 2,
      });
    // Limited use returns to full ink when it is spoken again with its qualifier.
    const level = r === 2 ? Math.max(listLevel(t, labels, r), again) : listLevel(t, labels, r);
    termRow(t, term, [labels[r]], quals[r], [limitedAt, permitAt], NX, tops[r], {
      width,
      inline: false,
      alpha: two * level,
      set: "labels",
    });
  });
  // The limited use does not reach the fully qualified asset: its way stops at the bar, and the asset stays open.
  const ly = tops[2] + labelSize(LABEL) / 2;
  link(wx, ly, bx - 12, ly, { alpha: two, draw: { t, at: denyAt + 0.05 }, end: false });
  line(bx, ly - 36, bx, ly + 36, {
    color: P.unknown,
    alpha: ramp(t, denyAt + 0.45, 0.3) * two,
    width: 4,
  });
  ring(rx, ly, 24, {
    color: P.muted,
    alpha: ramp(t, assetAt - 0.1, 0.4) * two,
    width: 2.5,
    dash: [6, 6],
  });
  nameText(assetName, rx + 24 + NAME_GAP, ly, {
    align: "left",
    color: P.muted,
    alpha: two * named(t, assetAt),
  });
  ctx.restore();
}

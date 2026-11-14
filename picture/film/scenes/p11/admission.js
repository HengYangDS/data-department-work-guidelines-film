/* 11's closing stages: admission as permission for one specific use under stated conditions, and the people who
 * decide. */

import { ctx } from "../../canvas.js";
import { since } from "../../drawing/flows.js";
import { SECOND } from "../../drawing/levels.js";
import { link } from "../../drawing/links.js";
import { box, diamond, line, measure, path } from "../../drawing/strokes.js";
import { check, person } from "../../drawing/symbols.js";
import { named } from "../../naming/lists.js";
import { NAME_GAP, nameText, wrapName } from "../../naming/names.js";
import { blockHeight, growName } from "../../naming/parts.js";
import { P } from "../../palette.js";
import { L, en } from "../../timeline.js";
import { cueFrom, cues } from "../../timing/cues.js";
import { mix, ramp, soon } from "../../timing/easing.js";
import { drawTime, glide, pacedTo } from "../../timing/pace.js";
import { DEC, X0, X1, priceAt, series } from "./prices.js";

/* Stage 8: the data waiting at a closed gate, which opens under the conditions checked there to one use. */
export function s11Admission(s, t, admitCut, eight) {
  const [condAt, releaseAt, useAt] = cues(s, [
    ["讲明的条件", "stated conditions"],
    ["放行", "under stated"],
    ["一项具体用途", "one specific use"],
  ]);
  const gateAt = cueFrom(s, "准入", "permission", admitCut);
  // The English use is named just after the cut, so its stage stands 65 px left, centred once the use stands; the
  // Chinese stage stands 129 px right while the data waits at the gate, centred with it, and eases 174 px left on the
  // use's words.
  ctx.save();
  ctx.translate(en ? -65 : 129 - 174 * glide(t, useAt + 0.05, 174), 0);
  // The way stands at 575, within 5 px of the middle of the gate's posts (330 to 810) and 75 px below the axis of the
  // copy in the Agent's frame it replaces, so at the cut the data's frame is not read as that copy jumping.
  const GX = 1000,
    RY = 575,
    DX = 500,
    UX = 1480,
    place = eight,
    open = soon(t, releaseAt + 0.05, 0.6),
    released = { t, at: releaseAt + 0.05 };
  box(DX - 80, RY - 50, 160, 100, { stroke: P.ink, width: 2, alpha: place, radius: 6 });
  path(
    series(priceAt, X0, X1, 12).map(([x, v]) => [
      DX - 64 + ((x - X0) / (X1 - X0)) * 128,
      RY + (v - 552) * 0.28,
    ]),
    { color: P.ink, width: 2, alpha: place },
  );
  // The data at the gate is the same series and keeps its name at the second ink.
  nameText(L("历史价格", "Historical prices"), DX, RY + 50 + NAME_GAP, {
    valign: "top",
    width: 300,
    alpha: place * SECOND,
  });
  // The gate: two posts and a bar between them that lifts as the gate opens.
  line(GX, 330, GX, RY - 60, { color: P.authority, width: 5, alpha: place });
  line(GX, RY + 60, GX, 810, { color: P.authority, width: 5, alpha: place });
  line(GX, mix(RY - 60, RY - 60, open), GX, mix(RY + 60, RY - 60, open), {
    color: P.authority,
    width: 5,
    alpha: place * (1 - open),
  });
  nameText(L("准入", "Admission"), GX, 330 - NAME_GAP, {
    valign: "bottom",
    color: P.authority,
    alpha: eight * (en ? 1 : named(t, gateAt)),
  });
  // The stated conditions are checked at the gate before it opens.
  [0, 1, 2].forEach((i) =>
    check(GX + 40, 380 + i * 42, 22, {
      alpha: ramp(t, condAt - 0.1 + i * 0.15, 0.35) * eight,
      draw: { t, at: condAt - 0.1 + i * 0.15 },
    }),
  );
  nameText(L("讲明的条件", "Stated conditions"), GX + 40 + 11 + NAME_GAP, 422, {
    align: "left",
    alpha: eight * named(t, condAt),
  });
  // The way from the data stops at the closed gate, then runs through it to one use.
  link(DX + 92, RY, GX - 12, RY, { alpha: place, end: false });
  link(GX + 12, RY, UX - 92, RY, {
    color: P.evidence,
    width: 2.5,
    alpha: eight,
    draw: released,
    flowing: since(t, releaseAt + 0.65),
  });
  box(UX - 80, RY - 45, 160, 90, {
    stroke: P.evidence,
    width: 2.5,
    alpha: eight * ramp(t, releaseAt + 0.3, 0.5),
    radius: 6,
  });
  // The data and the use are named on one line, under the taller of their two frames.
  nameText(L("一项具体用途", "One specific use"), UX, RY + 50 + NAME_GAP, {
    valign: "top",
    color: P.evidence,
    alpha: eight * named(t, useAt),
  });
  ctx.restore();
}

/* Stage 9: the task lead handing the evidence and the open risks to the frame of authority, where people decide. */
export function s11PeopleDecide(s, t, leadCut, nine) {
  const evAt = cueFrom(s, "证据", "evidence", leadCut),
    [riskAt, giveAt, ownerAt, accAt] = cues(s, [
      ["还没解决的风险", "open risks"],
      ["交给", "to the decision owner"],
      ["决策负责人", "decision owner"],
      ["验收人", "acceptor"],
    ]);
  const Y = 650,
    SZ = 1.8,
    LX = 550,
    OX = 1180,
    AX = 1460,
    under = Y + 15 * SZ * 1.55 + NAME_GAP;
  // The frame holds each figure and its name with one padding on every side: from the head's top to the name's last
  // line, and from the wider of the figure and its name.
  const PAD = 36,
    ownerName = L("决策负责人", "Decision owner"),
    accName = L("验收人", "Acceptor");
  const half = (v) =>
    Math.max(
      15 * SZ * 1.55,
      ...wrapName(v, 240)
        .map((line) => measure(line))
        .map((w) => w / 2),
    );
  const FT = Y - 15 * SZ * 2.15 - PAD,
    FB =
      under +
      blockHeight(Math.max(wrapName(ownerName, 240).length, wrapName(accName, 240).length)) +
      PAD;
  // The frame widens to the acceptor at the tip pace, wide before the acceptor comes.
  const r0 = OX + half(ownerName) + PAD,
    r1 = AX + half(accName) + PAD;
  // The stage stands right of its place while the lead and the bundle stand alone, 198 px in Chinese and 193 in
  // English, so they stand centred; it eases left as the owner joins, to 65 and 46 px, so the owner's frame stands
  // centred with them; and it eases on to 61 px left of its place as the frame begins to widen for the acceptor, so it
  // stands centred once the acceptor joins, the glide done before the thought's last word ends. The first glide sets
  // off 0.15 s before the owner's word, so at the glide peak of 420 px/s it has all but settled when the frame begins
  // to widen: a frame whose left edge still glides as its right edge sets out would stand still for one frame.
  const [bundle, owned] = L([198, 65], [193, 46]);
  ctx.save();
  ctx.translate(
    bundle -
      (bundle - owned) * glide(t, ownerAt - 0.15, bundle - owned) -
      (owned + 61) * glide(t, accAt - 0.1 - drawTime(r1 - r0, 0.4), owned + 61),
    0,
  );
  const right = mix(r0, r1, pacedTo(t, accAt - 0.1, r1 - r0, 0.4)),
    fq = nine * 0.8 * ramp(t, ownerAt - 0.15, 0.4);
  box(OX - half(ownerName) - PAD, FT, right - OX + half(ownerName) + PAD, FB - FT, {
    stroke: P.authority,
    alpha: fq,
    radius: 18,
  });
  [
    [LX, leadCut, L("任务负责人", "Task lead")],
    [OX, ownerAt, ownerName],
    [AX, accAt, accName],
  ].forEach(([x, at, v]) => {
    person(x, Y, { color: P.authority, size: SZ, alpha: nine * ramp(t, at - 0.15, 0.3) });
    nameText(v, x, under, { valign: "top", width: 240, alpha: nine * named(t, at) });
  });
  // The bundle: three snapshots side by side and an open-risk mark, above and beside the lead, named above itself.
  const bx = LX + 90,
    BYT = Y - 230,
    ev = ramp(t, evAt - 0.15, 0.4) * nine;
  [0, 1, 2].forEach((i) => {
    const x = bx + i * 120,
      y = BYT + 14;
    box(x, y, 104, 64, { fill: P.ground, stroke: P.evidence, width: 2, alpha: ev, radius: 4 });
    path(
      series(priceAt, X0, DEC[i]).map(([u, v]) => [
        x + 10 + ((u - X0) / (X1 - X0)) * 84,
        y + 32 + (v - 552) * 0.14,
      ]),
      { color: P.evidence, width: 1.5, alpha: ev },
    );
  });
  diamond(bx + 372, BYT + 46, 12, {
    color: P.unknown,
    alpha: ramp(t, riskAt - 0.15, 0.4) * nine,
    solid: true,
  });
  growName(
    t,
    en ? ["Evidence", " and open risks"] : ["证据", "和还没解决的风险"],
    [evAt, riskAt],
    bx,
    BYT - NAME_GAP,
    { valign: "bottom", alpha: nine },
  );
  // The hand-over: the way from the bundle to the frame draws on as it is said, and one point runs along it.
  const go = soon(t, giveAt - 0.05, 0.8),
    wy = BYT + 46;
  link(bx + 396, wy, OX, FT - 10, {
    route: "hv",
    color: P.authority,
    alpha: nine,
    upto: go,
    width: 2.5,
    flowing: since(t, giveAt + 0.75),
  });
  ctx.restore();
}

/* 20's first stages: the five roles a piece of work involves, and the several roles one person may hold. */

import { link } from "../../drawing/links.js";
import { s17Page } from "../../drawing/pages.js";
import { box, dot, line, measure, path } from "../../drawing/strokes.js";
import { agent, person, ring, seal } from "../../drawing/symbols.js";
import { beats, listIn, named, speaking } from "../../naming/lists.js";
import { NAME_GAP, nameText } from "../../naming/names.js";
import { P } from "../../palette.js";
import { L, en } from "../../timeline.js";
import { cue, cueFrom } from "../../timing/cues.js";
import { mix, ramp } from "../../timing/easing.js";
import { drawShare, glide } from "../../timing/pace.js";

/* Stage 1: the piece of work as a page, and its five roles in one column the page's spine reaches. */
export function s20FiveRoles(s, t, roles, g1) {
  const work = cue(s, "一件事", "a piece of work"),
    on = g1 * named(t, work);
  const roleNames = en
    ? ["Task lead", "Executing member", "Agent", "Reviewer", "Acceptor"]
    : ["任务负责人", "执行的成员", "智能体", "评审人", "验收人"];
  // The English first role's name is short, so while it stands alone in the column the tree stands 73 px right, and
  // it eases to its place as the second, wider name comes.
  const early = en ? 73 * (1 - glide(t, roles[1] - 0.1, 73)) : 0;
  const shift =
    early +
    960 -
    (Math.min(640 - 70, 640 - measure(L("一件事", "A piece of work")) / 2) +
      1000 +
      34 +
      NAME_GAP +
      Math.max(...roleNames.map((v) => measure(v)))) /
      2;
  const WX = 640 + shift,
    WY = 500,
    SX = 880 + shift,
    RX = 1000 + shift,
    ys = [330, 415, 500, 585, 670];
  s17Page(WX - 70, WY - 90, 140, 180, { alpha: on, rows: 4 });
  nameText(L("一件事", "A piece of work"), WX, WY + 90 + NAME_GAP, { valign: "top", alpha: on });
  link(WX + 82, WY, SX, WY, { alpha: on, end: false, draw: { t, at: roles[0] - 0.45 } });
  // The spine runs up to the first roles and down to the last as each is about to be named.
  const reach = roles.map((at, k) => drawShare(t, at - 0.35, Math.abs(ys[k] - WY)));
  const top = ys.reduce((v, y, k) => (y < WY ? Math.min(v, mix(WY, y, reach[k])) : v), WY);
  const bottom = ys.reduce((v, y, k) => (y > WY ? Math.max(v, mix(WY, y, reach[k])) : v), WY);
  if (bottom - top > 1) line(SX, top, SX, bottom, { color: P.line, alpha: g1, width: 2 });
  ys.forEach((y, i) => {
    const q = ramp(t, roles[i] - 0.15, 0.4) * g1,
      lit = speaking(t, roles, i);
    // Each branch reaches its role's mark, so the branch and the role read as one member under its name.
    link(SX, y, RX - 22, y, { alpha: g1, draw: { t, at: roles[i] - 0.2 }, end: false });
    if (i === 2) agent(RX, y, { alpha: q, size: 1.1 });
    else person(RX, y + 17, { alpha: q, color: P.authority, size: 1 });
    if (lit > 0)
      ring(RX, y, 36, { color: i === 2 ? P.evidence : P.authority, alpha: g1 * lit, width: 2.5 });
    nameText(roleNames[i], RX + 34 + NAME_GAP, y, {
      align: "left",
      color: i === 2 ? P.evidence : P.authority,
      alpha: g1 * listIn(t, roles, i),
      set: "roles",
    });
  });
}

/* Stage 2: one person holding several roles where policy permits, and a title alone that grants nothing. */
export function s20SeveralRoles(s, t, policy, title, samePerson, several, holders, powers, g2) {
  // The roles arrive as seats. The policy keeps its page clear left of where the work's page stood; the seats stand far enough right that the stage, from
  // the policy's name to the held roles' names, is centred in each edition, and the one person stands midway between.
  // The row stands 50 px above the content centre, so with the title's row below it the stage stands about the centre.
  const heldNames = [L("几种角色", "Several roles")],
    PX = 520,
    Y2 = 450;
  const HX =
    1920 -
    PX +
    Math.max(60, measure(L("制度允许时", "Where policy permits")) / 2) -
    40 -
    NAME_GAP -
    Math.max(...heldNames.map((v) => measure(v)));
  const ys = [Y2 - 110, Y2, Y2 + 110],
    OX = (PX + HX) / 2,
    rule = g2 * named(t, policy);
  // The policy stands high enough that its name shares the one person's line, the stage's one line of names.
  const line1 = Y2 + 6 + 32 + NAME_GAP,
    PY = line1 - 65 - NAME_GAP;
  s17Page(PX - 60, PY - 85, 120, 150, { alpha: rule, rows: 4 });
  dot(PX + 44, PY + 52, 20, { color: P.row, alpha: rule });
  seal(PX + 44, PY + 52, 20, { alpha: rule });
  nameText(L("制度允许时", "Where policy permits"), PX, line1, { valign: "top", alpha: rule });
  ys.forEach((y, i) => {
    const q = ramp(t, holders[i] - 0.15, 0.4) * g2;
    person(HX, y + 5, { alpha: q, color: P.authority, size: 1.15, solid: false });
  });
  nameText(heldNames[0], HX + 40 + NAME_GAP, Y2, {
    align: "left",
    color: P.authority,
    alpha: g2 * named(t, several),
  });
  // One person holds the roles: a bracket gathers them and one link runs to the person on the roles' words, the person
  // standing first.
  const one = named(t, samePerson) * g2,
    gather = several,
    held = named(t, gather) * g2;
  // In Chinese each power is then said to need its own authorization: the policy's seal beats on those words, then
  // on the authorization, while the roles stand gathered.
  if (!en)
    beats(t, PX + 44, PY + 52, 30, [cue(s, "每种角色的权限", ""), cue(s, "授权", "")], {
      color: P.authority,
      alpha: g2,
    });
  path(
    [
      [HX - 44, ys[0]],
      [HX - 62, ys[0]],
      [HX - 62, ys[2]],
      [HX - 44, ys[2]],
    ],
    { color: P.authority, alpha: held, width: 2.5 },
  );
  link(HX - 62, Y2, OX + 40, Y2, {
    color: P.authority,
    alpha: held,
    draw: { t, at: gather + 0.05 },
  });
  person(OX, Y2 + 6, { alpha: one, color: P.authority, size: 1.4 });
  nameText(L("一个人", "One person"), OX, line1, {
    valign: "top",
    color: P.authority,
    alpha: one,
  });
  // The title stands alone under the one person, a card with its name under it, and each of its two ways to the powers
  // it names draws toward that power and stops at a short bar as the power is named; the first way leaves on the words
  // that refuse the power. The two powers stand symmetric about the title's row.
  const tx = OX,
    ty = 740,
    TW = 150,
    TH = 90,
    px = tx + 440,
    d = 60,
    pys = [ty - d, ty + d],
    refuse = cue(s, "不等于", "grants no");
  const card = g2 * named(t, title),
    bar = tx + 340;
  // Each bar lands on the word that names the refused power, so the last one stands before the thought ends.
  const stops = [cueFrom(s, "做决定", "decide", title), powers[1]];
  box(tx - TW / 2, ty - TH / 2, TW, TH, { stroke: P.muted, alpha: card, radius: 10, width: 2 });
  line(tx - 46, ty - 12, tx + 46, ty - 12, { color: P.muted, alpha: card, width: 3 });
  line(tx - 46, ty + 14, tx + 18, ty + 14, { color: P.muted, alpha: card * 0.7, width: 3 });
  nameText(L("任务负责人", "A title alone"), tx, ty + TH / 2 + NAME_GAP, {
    valign: "top",
    color: P.muted,
    alpha: card,
  });
  pys.forEach((y, i) => {
    // Each way runs from the title toward its power from the words that refuse it and reaches its short bar, well
    // before the power, as the bar lands on the power's word.
    const from = i ? stops[0] + 0.05 : refuse - 0.05,
      q = ramp(t, powers[i] - 0.15, 0.4) * g2;
    link(tx + TW / 2 + 10, ty, bar - 6, y, {
      route: "hvh",
      mid: tx + 200,
      color: P.unknown,
      alpha: g2 * ramp(t, from - 0.05, 0.3),
      draw: { t, at: from, least: Math.max(0.3, stops[i] - from) },
      end: false,
      dash: [8, 8],
    });
    line(bar, y - 20, bar, y + 20, {
      color: P.unknown,
      alpha: ramp(t, stops[i] - 0.15, 0.35) * g2,
      width: 4,
    });
    seal(px, y, 26, { alpha: q, hollow: true });
    nameText(en ? ["Decide", "Accept"][i] : ["做决定", "验收"][i], px + 26 + NAME_GAP, y, {
      align: "left",
      color: P.authority,
      alpha: g2 * listIn(t, powers, i),
      set: "powers",
    });
  });
}

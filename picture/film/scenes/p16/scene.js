/* 16 deliver: name the state, not the effort. The scene: its cues and the cuts between its stages, each stage on the
 * words that name it. */

import { ctx } from "../../canvas.js";
import { blend } from "../../drawing/colour.js";
import { restMark } from "../../drawing/levels.js";
import { link } from "../../drawing/links.js";
import { s17Page } from "../../drawing/pages.js";
import {
  box,
  dashed,
  dot,
  labelSize,
  line,
  measure,
  path,
  stroke,
  text,
} from "../../drawing/strokes.js";
import { check, documentIcon, person, ring, seal } from "../../drawing/symbols.js";
import { opening } from "../../framing/chapters.js";
import { listIn, named, speaking } from "../../naming/lists.js";
import { NAME_GAP, nameText } from "../../naming/names.js";
import { growName } from "../../naming/parts.js";
import { railNames, stackTops } from "../../naming/placement.js";
import { rejectedName } from "../../naming/rejected.js";
import { NOTE } from "../../naming/terms.js";
import { LABEL, P } from "../../palette.js";
import { L, en } from "../../timeline.js";
import { cue, cueFrom, cues } from "../../timing/cues.js";
import { clamp, mix, ramp, soon } from "../../timing/easing.js";
import { drawShare, glide } from "../../timing/pace.js";
import { voiceTime } from "../../timing/pauses.js";
import { stageIn, stageOut } from "../../timing/stages.js";
import { scenes } from "../registry.js";

scenes["16"] = function (s, t) {
  const [report, effortWord, unframed, planned, executing, awaiting] = cues(s, [
    ["说做到哪一步", "report the state"],
    ["不说花了多少力气", "not the effort"],
    ["叫未界定", "work is unframed"],
    ["叫已计划", "it is planned"],
    ["叫执行中", "it is executing"],
    ["叫待核验", "awaiting verification"],
  ]);
  const verified = cue(s, "叫已核验", "verified", { last: true });
  const [accepted, published, inUse, observed, almost, almostWord, blocked] = cues(s, [
    ["才叫已验收", "accepted"],
    ["发布到约定的地方", "published at the agreed destination"],
    ["有人在用", "mean in use"],
    ["实际看到了什么", "actually observed"],
    ["别把执行中", "work that's executing"],
    ["快做完了", "almost done"],
    ["受阻时", "when blocked"],
  ]);
  const base = ramp(t, opening(s), 0.7),
    firstCondition = cue(s, "问题", "the problem");
  // The six states are stations on one rail, in the order work moves through them, and the work is a card that rides
  // the rail: the station it stands at is its state.
  const RY = 620,
    xs = [320, 576, 832, 1088, 1344, 1600],
    CW = 150,
    CH = 110,
    CT = RY - 24 - CH;
  const card = (x, a) =>
    box(x - CW / 2, CT, CW, CH, { fill: P.row, stroke: P.ink, alpha: a, radius: 10, width: 2.5 });
  // 1. Report the state, not the effort (in Chinese, how far the work has got, not how much effort it took). The rail of
  // states and the state's name at its first station arrive on the words that say to report the state. The usual report
  // of effort, a bar at 90%, stands above the rail and is refused on its words. The work's card enters with the first
  // thing it lacks.
  const one = base * stageOut(t, firstCondition);
  if (one > 0) {
    const on = one * named(t, report);
    line(xs[0] - 140, RY, xs[5] + 140, RY, { color: P.muted, alpha: on, width: 3 });
    nameText(L("做到哪一步", "State"), xs[0], RY + NAME_GAP + 18, {
      valign: "top",
      color: P.evidence,
      alpha: on,
    });
    const BX = 560,
      BW = 1100,
      BY = 420,
      refuse = ramp(t, effortWord + 0.05, 0.3),
      bar = one * mix(1, 0.6, refuse);
    box(BX, BY - 25, BW, 50, { stroke: P.muted, alpha: bar, radius: 25 });
    // The fill is the line colour stepped toward the ground and the numeral dims by a quarter as the bar is refused, so
    // the numeral keeps 4.5:1 or more against its fill, full or dimmed.
    box(BX, BY - 25, BW * 0.9, 50, { fill: blend(P.ground, P.line, 0.85), alpha: bar, radius: 25 });
    text("90%", BX + BW * 0.45, BY + 1, 26, {
      role: "mark",
      align: "center",
      color: P.ink,
      alpha: one * mix(1, 0.75, refuse),
    });
    rejectedName(L("花了多少力气", "Effort"), BX, BY - 25 - NAME_GAP, {
      align: "left",
      valign: "bottom",
      alpha: one * named(t, effortWord),
      mark: refuse,
    });
  }
  // 2. The card moves on to a state's station only on that state's own words, once it carries what the state needs.
  // Unframed: the problem, the scope and the completion condition (in Chinese, what counts as done) are empty dashed
  // slots on the card, each on its own word. Planned: they are written in as the route (in Chinese, the way of doing it)
  // lights ahead along the rail, and the owner joins the card.
  // Executing: the card turns as it works. Awaiting verification: the deliverable stands on the card, and the closed
  // gate of the checks stands ahead of it. Verified: the checks pass, the gate's mark is ticked and its bar
  // lifts, what the verification holds for is named over it bound by bound, and the card passes through. Accepted: the
  // acceptor stands at the end of the rail and its seal is stamped on the deliverable. Each station fills and
  // is named as the card reaches it, and the states build one list along the rail.
  const two = base * stageIn(t, firstCondition) * stageOut(t, published);
  if (two > 0) {
    const ats = [unframed, planned, executing, awaiting, verified, accepted],
      colors = [P.ink, P.ink, P.ink, P.evidence, P.evidence, P.authority];
    const parts = cues(s, [
      ["问题", "the problem"],
      ["范围", "scope"],
      ["怎样算完成", "completion condition"],
    ]);
    const [routeAt, ownerAt, underWay, unchecked, made, passed, acceptor, confirmed] = cues(s, [
      ["有了做法", "a route"],
      ["负责人", "owner"],
      ["正在做", "under way"],
      ["核验还没通过", "checks have not passed"],
      ["交付物有了", "the deliverable"],
      ["核验通过了", "checks passed"],
      ["有授权的验收人", "an authorized acceptor"],
      ["确认了", "confirmed by"],
    ]);
    // What the verification holds for: the subject (in Chinese, the subject stated), version, environment and scope
    // or limit.
    const versionAt = cue(s, "版本", "version"),
      holdsFor = [
        cue(s, "讲明的对象", "subject"),
        versionAt,
        cue(s, "环境", "environment"),
        cueFrom(s, "限度", "limit", versionAt),
      ];
    // Each move ends before its thought does, so the card rests in the quiet that follows.
    let x = xs[0];
    ats.forEach((at, k) => {
      if (k) x = mix(x, xs[k], glide(t, at + 0.05, xs[k] - xs[k - 1]));
    });
    // The rail, drawn firm so the states' whole way stands from the first words, and the route ahead of the card, which
    // lights along it once the work has one.
    line(xs[0] - 140, RY, xs[5] + 140, RY, { color: P.muted, alpha: two, width: 3 });
    const route = drawShare(t, routeAt + 0.05, xs[5] - xs[0]);
    if (route > 0)
      line(xs[0], RY, mix(xs[0], xs[5], route), RY, { color: P.ink, alpha: two, width: 3 });
    ats.forEach((at, k) => {
      dot(xs[k], RY, 11, { color: colors[k], alpha: named(t, at) * two });
      ring(xs[k], RY, 21, {
        color: colors[k],
        alpha: speaking(t, ats, k) * restMark(colors[k], 0.6) * two,
        width: 2,
      });
    });
    // The English state awaiting verification stands whole on one line, which its neighbours' short names leave room for.
    railNames(
      en
        ? ["Unframed", "Planned", "Executing", ["Awaiting verification"], "Verified", "Accepted"]
        : ["未界定", "已计划", "执行中", "待核验", "已核验", "已验收"],
      xs,
      RY,
      { alpha: (i) => two * listIn(t, ats, i), color: (i) => colors[i], set: "states" },
    );
    // The checks are a gate across the rail between awaiting verification and verified: a bar hanging from a post that
    // carries the gate's mark and its name. It stands closed from the words that say the checks have not passed; on the
    // words that pass the checks its mark is ticked and its bar lifts into the post, which stays over the open way.
    const GX = (xs[3] + xs[4]) / 2,
      GT = CT - 92,
      MY = GT - 60,
      gate = named(t, unchecked) * two,
      open = drawShare(t, passed + 0.05, RY + 26 - GT, 0.6),
      tick = ramp(t, passed + 0.05, 0.4);
    line(GX, MY + 20, GX, GT, { color: P.line, alpha: gate, width: 3 });
    if (open < 1)
      line(GX, GT, GX, mix(RY + 26, GT, open), {
        color: P.unknown,
        // The bar's ink falls over most of its opening, so it never leaves within one frame while it is still firm.
        alpha: gate * clamp((1 - open) / 0.6),
        width: 4,
      });
    ring(GX, MY, 20, { color: P.line, alpha: gate * (1 - tick), width: 2.5 });
    ring(GX, MY, 20, { color: P.evidence, alpha: gate * tick, width: 3 });
    check(GX, MY + 1, 20, { alpha: gate, upto: tick });
    // The mark's names keep the name gap from its dashed scope: the checks beside it, and what the verification holds
    // for over the mark and its name together.
    const SR = 31 + 1,
      checksName = L("核验", "Checks"),
      groupMid = GX + (NAME_GAP + measure(checksName)) / 2;
    nameText(checksName, GX + SR + NAME_GAP, MY, { align: "left", alpha: gate });
    // What the verification holds for closes round its mark one quarter per limit as each is named, a dashed scope it
    // stays inside.
    holdsFor.forEach((at, k) =>
      path(
        Array.from({ length: 9 }, (_, j) => {
          const a = -Math.PI / 2 + (k * Math.PI) / 2 + 0.08 + (j * (Math.PI / 2 - 0.16)) / 8;
          return [GX + 31 * Math.cos(a), MY + 31 * Math.sin(a)];
        }),
        { color: P.evidence, alpha: gate * ramp(t, at - 0.1, 0.3), width: 2, dash: [5, 5] },
      ),
    );
    const bounds = L(
      ["讲明的对象", "、版本", "、环境", "和限度"],
      ["Subject", ", version", ", environment", " and limit"],
    );
    growName(t, bounds, holdsFor, groupMid - measure(bounds.join("")) / 2, MY - SR - NAME_GAP, {
      valign: "bottom",
      color: P.evidence,
      alpha: two,
    });
    // The card turns while it executes, from "under way" until the deliverable exists.
    const busy = ramp(t, underWay + 0.05, 0.3) * (1 - ramp(t, made + 0.05, 0.3)) * two;
    if (busy > 0)
      for (let k = 0; k < 3; k++) {
        const a = voiceTime(t) * 2.4 + k * 2.09;
        stroke(() => ctx.arc(x, CT + CH / 2, 82, a, a + 1.2), {
          color: P.ink,
          alpha: busy * 0.8,
          width: 2.5,
        });
      }
    card(x, two);
    // The parts that frame the work: empty dashed slots while they are missing, written in as the work gains its route.
    // Their name stands over the card from their words; once the card moves on, it names what the unframed state lacks,
    // so it stays over the first station while the states it heads stand, risen 64 px on the route's words so the card's
    // turning and its deliverable pass under it. The slots stand close under it, so the name reaches all three.
    const framed = soon(t, routeAt + 0.05, 0.5),
      lx = x - CW / 2 + 20;
    parts.forEach((at, k) => {
      const y = CT + 22 + k * 24,
        w = [100, 74, 90][k];
      box(lx, y - 8, w, 16, {
        stroke: P.unknown,
        alpha: named(t, at) * (1 - framed) * two,
        radius: 4,
        width: 2,
        dash: [5, 5],
      });
      if (framed > 0) line(lx, y, lx + w * framed, y, { color: P.ink, alpha: two, width: 4 });
    });
    growName(
      t,
      L(["问题", "、范围", "或怎样算完成"], ["The problem", ", scope", " or completion condition"]),
      parts,
      xs[0] - CW / 2,
      CT - NAME_GAP - 64 * soon(t, routeAt + 0.05, 0.6),
      { valign: "bottom", color: P.unknown, alpha: two },
    );
    // The owner walks beside the card from its words; the deliverable stands on the card from its words, its lines ruled
    // as one stroke, one page, and the acceptor's seal is stamped on it once the acceptor has confirmed.
    person(x - CW / 2 - 38, RY - 27, { alpha: named(t, ownerAt) * two });
    s17Page(x - 32, CT - 76, 64, 84, { alpha: named(t, made) * two, rows: 3 });
    const stamp = ramp(t, Math.max(acceptor, confirmed) + 0.05, 0.3) * two;
    if (stamp > 0) {
      dot(x, CT - 32, 23, { color: P.row, alpha: stamp });
      seal(x, CT - 32, mix(30, 22, stamp), { alpha: stamp });
    }
    person(xs[5] + CW / 2 + 44, RY - 27, {
      color: P.authority,
      alpha: named(t, acceptor) * two,
      size: 1.1,
    });
  }
  // 3. Published is not in use (in Chinese, not someone using it). Two frames stand side by side about the centre: the
  // work at its agreed destination, and the work in use. The way from one to the other stops at a bar, named with the
  // words that refuse it; the claim of use rests on what was observed, an eye below the in-use frame, arriving with its
  // name and joined to the frame by one link.
  const three = base * stageIn(t, published) * stageOut(t, almost);
  if (three > 0) {
    const fy = 380,
      fh = 190,
      fw = 300,
      lx = 450,
      ax = 1170,
      mid = fy + fh / 2,
      ex = ax + fw / 2,
      ey = fy + fh + 80;
    // The in-use frame comes with the words that compare the two, and its name on its own words.
    const notSame = cue(s, "不代表", "does not mean"),
      use = ramp(t, notSame - 0.15, 0.4);
    box(lx, fy, fw, fh, { stroke: P.ink, alpha: three, radius: 10 });
    box(ax, fy, fw, fh, { stroke: P.evidence, alpha: three * use, radius: 10 });
    nameText(L("发布到约定的地方", "Published at the agreed destination"), lx, fy - NAME_GAP, {
      align: "left",
      valign: "bottom",
      width: 480,
      alpha: three * named(t, published),
    });
    nameText(L("有人在用", "In use"), ax, fy - NAME_GAP, {
      align: "left",
      valign: "bottom",
      color: P.evidence,
      alpha: three * named(t, inUse),
    });
    // The deliverable sits in its agreed place; in use, a person works with the same deliverable.
    documentIcon(lx + fw / 2 - 42, mid - 54, 84, 108, {
      alpha: three * ramp(t, published - 0.1, 0.4),
      rows: 3,
    });
    documentIcon(ax + fw / 2 - 92, mid - 54, 84, 108, { alpha: three * use, rows: 3 });
    person(ax + fw / 2 + 80, mid + 6, { alpha: three * use, color: P.evidence, size: 1.3 });
    // The way across stops halfway at a bar on the words that refuse it.
    const go = soon(t, notSame - 0.05, 0.6);
    link(lx + fw + 12, mid, ax - 12, mid, {
      color: P.unknown,
      alpha: three * ramp(t, notSame - 0.05, 0.3),
      upto: 0.46 * go,
      end: false,
      dash: [8, 8],
    });
    line(960, mid - 30, 960, mid + 30, {
      color: P.unknown,
      alpha: ramp(t, notSame + 0.3, 0.3) * three,
      width: 4,
    });
    nameText(L("不代表", "does not mean"), 960, mid + 30 + NAME_GAP, {
      valign: "top",
      size: NOTE,
      color: P.muted,
      alpha: three * named(t, notSame),
    });
    // To claim use, say what was observed: the eye opens below the in-use frame with its name, and its link rises to the
    // frame.
    const eye = ramp(t, observed - 0.15, 0.4) * three,
      lid = soon(t, observed - 0.15, 0.6),
      look = Math.sin((voiceTime(t) - voiceTime(observed)) * 2.2) * 8 * lid;
    stroke(() => ctx.ellipse(ex, ey, 40, mix(4, 20, lid), 0, 0, Math.PI * 2), {
      color: P.evidence,
      alpha: eye,
      width: 2.5,
    });
    dot(ex + look, ey, 8 * lid, { color: P.evidence, alpha: eye });
    link(ex, ey - 28, ex, fy + fh + 10, {
      color: P.evidence,
      alpha: eye,
      draw: { t, at: observed - 0.05 },
    });
    nameText(L("实际看到了什么", "What was actually observed"), ex, ey + 22 + NAME_GAP, {
      valign: "top",
      color: P.evidence,
      alpha: three * named(t, observed),
    });
  }
  // 4. Executing is not almost done; blocked work says what it lacks. The work stands on its lane, turning while it is
  // executing, its state named above it and the claim of almost done refused beside the state. When it is blocked a bar
  // closes the lane ahead and the turning stops and fades; the report hangs from the work in one column that grows item
  // by item, the escalation reaching the person it goes to.
  const four = base * stageIn(t, almost);
  if (four > 0) {
    const AY = 430,
      TX = 880,
      BAR = 942,
      called = cueFrom(s, "执行中", "executing", almost);
    const [gapAt, impactAt, escAt] = cues(s, [
      ["缺什么", "the gap"],
      ["影响什么", "its impact"],
      ["报给了谁", "the escalation"],
    ]);
    // The work's lane is drawn firm, the way ahead of it dashed, so the lane stands across the frame from its words.
    line(300, AY, TX, AY, { color: P.muted, alpha: four, width: 3 });
    dashed(TX, AY, 1620, AY, { color: P.muted, alpha: four, width: 3 });
    // The work turns while it executes and stops turning on the word that blocks it: its turning marks stop and fade
    // out with the stop, so no stilled turn stands beside the work waiting for the report to name it.
    const halted = mix(0.8, 0, ramp(t, blocked + 0.05, 0.4));
    for (let k = 0; k < 3; k++) {
      const a = voiceTime(Math.min(t, blocked + 0.05)) * 2.4 + k * 2.09;
      stroke(() => ctx.arc(TX, AY, 32, a, a + 1.2), {
        color: P.ink,
        alpha: four * halted,
        width: 2.5,
      });
    }
    box(TX - 17, AY - 17, 34, 34, { fill: P.ink, alpha: four, radius: 7 });
    const head = nameText(L("执行中", "Executing"), TX, AY - 40 - NAME_GAP, {
      valign: "bottom",
      alpha: four * named(t, called),
    });
    const wide = measure(L("执行中", "Executing"), LABEL);
    rejectedName(
      L("“快做完了”", "“Almost done”"),
      TX + wide / 2 + 48,
      (head.top + head.bottom) / 2,
      { align: "left", alpha: four * named(t, almostWord), mark: ramp(t, almostWord + 0.5, 0.4) },
    );
    line(BAR, AY - 34, BAR, AY + 34, {
      color: P.unknown,
      alpha: ramp(t, blocked + 0.05, 0.3) * four,
      width: 4,
    });
    // The report hangs from the work: its line reaches down to each item as the item is named, and the item's mark
    // fills there.
    const ats = [gapAt, impactAt, escAt],
      tops = stackTops(
        [0, 1, 2].map(() => labelSize(LABEL)),
        585,
        40,
      ),
      ys = tops.map((v) => v + labelSize(LABEL) / 2);
    const reach = ys.reduce((y, to, i) => mix(y, to, soon(t, ats[i] - 0.1, 0.45)), AY + 40);
    if (reach > AY + 41) line(TX, AY + 40, TX, reach, { color: P.line, alpha: four, width: 2 });
    const report = en
      ? ["The gap", "Its impact", "The escalation"]
      : ["缺什么", "影响什么", "报给了谁"];
    ys.forEach((y, i) => {
      dot(TX, y, 10, { color: P.unknown, alpha: ramp(t, ats[i] - 0.1, 0.3) * four });
      ring(TX, y, 19, {
        color: P.unknown,
        alpha: speaking(t, ats, i) * restMark(P.unknown, 0.6) * four,
        width: 2,
      });
      nameText(report[i], TX + 10 + NAME_GAP + 8, y, {
        align: "left",
        alpha: four * listIn(t, ats, i),
        set: "blocked report",
      });
    });
    // The escalation reaches the person it goes to.
    const escEnd = TX + 40 + measure(report[2], LABEL) + 24,
      PX = 1400;
    link(escEnd, ys[2], PX - 40, ys[2], {
      color: P.authority,
      alpha: four * ramp(t, escAt - 0.05, 0.3),
      draw: { t, at: escAt - 0.05 },
    });
    person(PX, ys[2] + 4, {
      color: P.authority,
      alpha: four * ramp(t, escAt + 0.3, 0.4),
      size: 1.1,
    });
  }
};

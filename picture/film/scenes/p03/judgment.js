/* 03's closing stages: authority and fact set against each other, and professional judgment as a balance of
 * competence and facts. */

import { ctx } from "../../canvas.js";
import { blend } from "../../drawing/colour.js";
import { restMark } from "../../drawing/levels.js";
import { link } from "../../drawing/links.js";
import { dot, line, measure, stroke, text } from "../../drawing/strokes.js";
import { check, documentIcon, person, ring, seal } from "../../drawing/symbols.js";
import { beats, listIn, named, speaking } from "../../naming/lists.js";
import { NAME_GAP, nameText } from "../../naming/names.js";
import { rejectedName } from "../../naming/rejected.js";
import { P } from "../../palette.js";
import { L } from "../../timeline.js";
import { cue, cueFrom } from "../../timing/cues.js";
import { ramp, soon } from "../../timing/easing.js";
import { drawShare, glide } from "../../timing/pace.js";
import { voiceTime } from "../../timing/pauses.js";

/* Stage 5: authority and fact set against each other, each one's way toward the other's ground stopped at a bar. */
export function s03Against(s, t, noTrue, conflict, report, quiet, release, versus, g4c) {
  const M = 960,
    Y = 520,
    AX = M - 480,
    BX = M + 480,
    R = 50,
    PY = 300,
    DY = 770,
    xs = [M - 260, M + 260];
  const factAt = cueFrom(s, "事实依据", "a fact does not", versus),
    grant = cue(s, "给不了动手的权限", "grant permission");
  const ox = 0;
  seal(AX + ox, Y - 14, R, { alpha: g4c });
  nameText(L("行动依据", "Authority to act"), AX + ox, Y - 14 + R + NAME_GAP, {
    valign: "top",
    color: P.authority,
    alpha: g4c * named(t, versus),
  });
  seal(BX, Y - 14, R, { color: P.evidence, alpha: g4c });
  nameText(L("事实依据", "Authority about facts"), BX, Y - 14 + R + NAME_GAP, {
    valign: "top",
    color: P.evidence,
    alpha: g4c * named(t, versus),
  });
  beats(t, AX + ox, Y - 14, R + 10, [release], { color: P.authority, alpha: g4c });
  beats(t, BX, Y - 14, R + 10, [conflict], { color: P.evidence, alpha: g4c });
  // The two refused names stand alike, one line each, whose seals stand far enough apart to take them whole, so no
  // line splits the phrase it refuses; their crosses, centred on their names, stand level, and they mirror each other
  // about the middle: each cross stands toward the middle beside its way's bar, its name beyond it, the left name
  // ending 16 px before its cross as the right name begins 16 px after its own. The fact's way sets off on the fact's
  // words, or half a second before what it cannot grant is named where that comes later, as in English, so the way
  // never stands long before its name.
  [
    [
      AX + R + 14,
      M - 35,
      noTrue,
      noTrue,
      L("把假的变成真的", "Make a false fact true"),
      Infinity,
      -1,
      ox,
    ],
    [
      BX - R - 14,
      M + 35,
      Math.max(factAt, grant - 0.5),
      grant,
      L("动手的权限", "Grant permission to act"),
      Infinity,
      1,
      0,
    ],
  ].forEach(([x0, bar, go, at, v, width, side, dx]) => {
    link(x0 + dx, Y, bar + dx, Y, {
      color: P.unknown,
      alpha: ramp(t, go - 0.1, 0.3) * g4c,
      upto: drawShare(t, go + 0.05, Math.abs(bar + dx - (x0 + dx)), 0.7),
      end: false,
      dash: [8, 8],
    });
    line(bar + dx, Y - 24, bar + dx, Y + 24, {
      color: P.unknown,
      alpha: ramp(t, at + 0.45, 0.3) * g4c,
      width: 4,
    });
    const cross = 26;
    rejectedName(v, (side < 0 ? M - 40 - cross - 16 : M + 40 + cross + 16) + dx, Y - 36, {
      align: side < 0 ? "right" : "left",
      valign: "bottom",
      width,
      alpha: g4c * named(t, at),
      mark: ramp(t, at + 0.45, 0.3),
      markLeft: (side < 0 ? M - 40 - cross : M + 40) + dx,
    });
  });
  // The middle, where the two meet: the conflict stands there on its words.
  const c = ramp(t, conflict - 0.15, 0.4) * g4c;
  ring(M, Y, 24 + 3 * Math.sin(voiceTime(t) * 4), { color: P.unknown, alpha: c, width: 3 });
  dot(M, Y, 7, { color: P.unknown, alpha: c });
  // The conflict and its impact are reported: the way up from the conflict draws on as the report is named, and the
  // report stands at its end, named by what it reports; in English by its key words, since the clause is a caption
  // cue of its own.
  const RW = 64,
    RH = 84,
    RX = M - RW / 2,
    RY = PY - RH / 2;
  link(M, Y - 36, M, RY + RH + 12, {
    color: P.evidence,
    alpha: ramp(t, report - 0.1, 0.3) * g4c,
    draw: { t, at: report + 0.05 },
    width: 2.5,
  });
  documentIcon(RX, RY, RW, RH, { alpha: ramp(t, report + 0.3, 0.4) * g4c, rows: 2 });
  nameText(L("讲出冲突和影响", "Conflict and impact"), RX + RW + NAME_GAP, PY, {
    align: "left",
    alpha: g4c * named(t, report),
  });
  // The quiet ways out stop at their bars: the record is not altered, and no side is quietly acted for.
  const alter = cue(s, "改记录", "alter the record");
  [
    [alter, L("改记录", "Alter the record")],
    [quiet, L("悄悄按决定或核验结果去做", "Silently act as if one side had won")],
  ].forEach(([at, v], k) => {
    link(M, Y + 36, xs[k], DY - 40, {
      route: "vhv",
      mid: Y + 150,
      color: P.unknown,
      alpha: ramp(t, at - 0.1, 0.3) * g4c,
      upto: drawShare(t, at + 0.05, Math.abs(xs[k] - M) + Math.abs(DY - 40 - (Y + 36)), 0.7),
      end: false,
      dash: [8, 8],
    });
    line(xs[k] - 24, DY - 40, xs[k] + 24, DY - 40, {
      color: P.unknown,
      alpha: ramp(t, at + 0.45, 0.3) * g4c,
      width: 4,
    });
    rejectedName(v, xs[k], DY, {
      valign: "top",
      width: 440,
      alpha: g4c * named(t, at),
      mark: ramp(t, at + 0.45, 0.3),
    });
  });
}

/* Stage 6: professional judgment as a balance that rests on both the competence and the facts. */
export function s03Judgment(s, t, expert, missing, domainOwner, alone, noPower, g5) {
  const B = 210,
    PW = 64,
    lead = 920 - B - PW - NAME_GAP - measure(L("既懂行", "Competence"));
  const tail = Math.max(
    1480 + measure(L("相应领域的负责人", "Domain owner")) / 2,
    920 + B + PW + NAME_GAP + measure(L("又了解事实", "The facts")),
  );
  const needs = 960 - (lead + 920 + B + PW + NAME_GAP + measure(L("又了解事实", "The facts"))) / 2;
  const centring = 960 - (lead + tail) / 2,
    ox = needs + (centring - needs) * glide(t, domainOwner + 0.05, centring - needs);
  const PX = 920 + ox,
    PY = 350,
    BASE = 590,
    HANG = 120,
    OX = 1480 + ox,
    OY = 520,
    OS = 1.4,
    barY = 720,
    SY = 800;
  const needAts = [
    cueFrom(s, "既懂行", "competence", expert),
    cueFrom(s, "又了解事实", "the facts", expert),
  ];
  // The facts' flight from the owner to the empty pan, as a glide over its arc.
  const lost = ramp(t, missing + 0.05, 0.3),
    back = glide(t, domainOwner + 0.6, Math.abs(1480 - 64 - 920 - B) + 280),
    gone = lost * (1 - back);
  // The beam tips toward the heavier pan, so it rests level only while both needs are in.
  const landed = needAts.map((at) => soon(t, at + 0.05, 0.5)),
    tilt = (landed[0] - landed[1] * (1 - gone)) * 0.12;
  const ends = [
    [PX - B * Math.cos(tilt), PY + B * Math.sin(tilt)],
    [PX + B * Math.cos(tilt), PY - B * Math.sin(tilt)],
  ];
  const pans = ends.map(([x, y]) => [x, y + HANG]);
  line(PX, PY, PX, BASE, { color: P.ink, alpha: g5, width: 3 });
  line(PX - 70, BASE, PX + 70, BASE, { color: P.ink, alpha: g5, width: 3 });
  line(...ends[0], ...ends[1], { color: P.ink, alpha: g5, width: 4 });
  dot(PX, PY, 7, { color: P.ink, alpha: g5 });
  nameText(L("专业判断", "Professional judgment"), PX, PY - 30 - NAME_GAP, {
    valign: "bottom",
    alpha: g5 * named(t, expert),
  });
  // Each pan hangs from its end of the beam on two strings: a shallow bowl through the strings' feet. The four strings
  // are one stroke and the two bowls another, so the balance is one instrument rather than repeated strings and bowls
  // each waiting for a name of its own.
  const BOWL = [Math.PI * 0.344, Math.PI * 0.656];
  stroke(
    () =>
      pans.forEach(([x, y], i) =>
        [-PW, PW].forEach((d) => {
          ctx.moveTo(...ends[i]);
          ctx.lineTo(x + d, y);
        }),
      ),
    { color: P.line, alpha: g5, width: 2 },
  );
  stroke(
    () =>
      pans.forEach(([x, y]) => {
        ctx.moveTo(x + 136 * Math.cos(BOWL[0]), y - 120 + 136 * Math.sin(BOWL[0]));
        ctx.arc(x, y - 120, 136, ...BOWL);
      }),
    { color: P.ink, alpha: g5, width: 3 },
  );
  pans.forEach(([x, y], i) => {
    const lit = speaking(t, needAts, i);
    if (lit > 0)
      ring(x, y - 24, 32, {
        color: P.evidence,
        alpha: lit * restMark(P.evidence, 0.5) * g5,
        width: 2,
      });
  });
  // Competence lands in the left pan and the facts in the right; the facts leave when one is missing, and a question
  // stands in their place until the domain owner's facts land there. The question inks in over 0.4 s, as a mark that
  // arrives does, so no frame takes it from unseen to firm.
  const [[lx, ly], [rx, ry]] = pans,
    q = needAts.map((at) => ramp(t, at - 0.15, 0.4) * g5);
  ring(lx, ly - 24, 18, { color: P.evidence, alpha: q[0], width: 2.5 });
  check(lx, ly - 23, 18, { alpha: q[0] });
  documentIcon(rx - 17, ry - 50, 34, 44, { alpha: q[1] * (1 - lost), rows: 3 });
  text("?", rx, ry - 26, 26, {
    role: "mark",
    align: "center",
    color: P.unknown,
    alpha: q[1] * ramp(t, missing + 0.35, 0.4) * (1 - back),
  });
  nameText(L("既懂行", "Competence"), PX - B - PW - NAME_GAP, PY + HANG - 12, {
    align: "right",
    alpha: g5 * listIn(t, needAts, 0),
    set: "needs",
  });
  nameText(L("又了解事实", "The facts"), PX + B + PW + NAME_GAP, PY + HANG - 12, {
    align: "left",
    color: blend(P.ink, P.muted, gone),
    alpha: g5 * listIn(t, needAts, 1),
    set: "needs",
  });
  // The domain owner is brought in on the right with the facts, which travel over the facts' name into the empty pan:
  // they leave the owner straight up and sweep across on one curve, so they clear their name's end before they pass
  // over it, and they set off and land at rest.
  const come = ramp(t, domainOwner - 0.15, 0.4) * g5;
  person(OX, OY, { color: P.authority, alpha: come, size: OS });
  nameText(L("相应领域的负责人", "Domain owner"), OX, OY + 15 * OS * 1.51 + NAME_GAP, {
    valign: "top",
    color: P.authority,
    alpha: g5 * named(t, domainOwner),
  });
  const fx0 = OX - 64,
    fy0 = OY - 2,
    fx = fx0 + back * back * (rx - fx0),
    fy = fy0 - 2 * back * (1 - back) * 280 + back * back * (ry - fy0);
  documentIcon(fx - 17, fy - 50, 34, 44, { alpha: come * lost, rows: 3 });
  // Expertise alone does not reach the power to decide or act.
  link(PX, BASE + 10, PX, barY, {
    color: P.unknown,
    alpha: ramp(t, alone - 0.1, 0.3) * g5,
    upto: drawShare(t, alone + 0.05, Math.abs(barY - (BASE + 10)), 0.7),
    end: false,
    dash: [8, 8],
  });
  line(PX - 28, barY, PX + 28, barY, {
    color: P.unknown,
    alpha: ramp(t, noPower + 0.05, 0.3) * g5,
    width: 4,
  });
  nameText(L("懂行", "Expertise alone"), PX - 24, (BASE + 10 + barY) / 2, {
    align: "right",
    alpha: g5 * named(t, alone),
  });
  seal(PX, SY, 34, { alpha: g5 * 0.9 * named(t, noPower), hollow: true });
  nameText(L("有权决定或动手", "Authority to decide or act"), PX, SY + 34 + NAME_GAP, {
    valign: "top",
    color: P.authority,
    alpha: g5 * named(t, noPower),
  });
}

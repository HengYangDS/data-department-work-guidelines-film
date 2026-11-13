/* 21's closing stages: a majority opinion that is not evidence, and checked output on its way to a lasting team
 * fact. */

import { since } from "../../drawing/flows.js";
import { link } from "../../drawing/links.js";
import { s17Page } from "../../drawing/pages.js";
import { box, dot, line, measure, path } from "../../drawing/strokes.js";
import { agent, check, documentIcon, ring } from "../../drawing/symbols.js";
import { listIn, named } from "../../naming/lists.js";
import { NAME_GAP, nameText } from "../../naming/names.js";
import { P } from "../../palette.js";
import { L, en } from "../../timeline.js";
import { cues } from "../../timing/cues.js";
import { clamp, mix, ramp, soon } from "../../timing/easing.js";
import { drawShare } from "../../timing/pace.js";

/* Stage 5: the Agents' agreement and the evidence in two frames, the way between them stopped at a bar. */
export function s21Majority(s, t, majority, five) {
  const [opinion, not, evidence] = cues(s, [
    ["意见", "opinion"],
    ["不是证据", "not evidence"],
    ["证据", "evidence"],
  ]);
  const fy = 405,
    fh = 190,
    lx = 445,
    lw = 280,
    ax = 1200,
    aw = 240,
    mid = fy + fh / 2,
    go = { t, at: opinion + 0.05 },
    ev = named(t, evidence) * five;
  box(lx, fy, lw, fh, { stroke: P.line, alpha: five, radius: 10 });
  box(ax, fy, aw, fh, { fill: P.row, stroke: P.evidence, alpha: ev, radius: 10 });
  nameText(L("多数意见", "A majority opinion"), lx, fy - NAME_GAP, {
    align: "left",
    valign: "bottom",
    alpha: five * named(t, majority),
  });
  nameText(L("证据", "Evidence"), ax, fy - NAME_GAP, {
    align: "left",
    valign: "bottom",
    color: P.evidence,
    alpha: ev,
  });
  [lx + 62, lx + 140, lx + 218].forEach((x) => {
    agent(x, mid + 34, { alpha: five, size: 1 });
    // Each Agent's agreement is a muted tick: an opinion, not the evidence-blue proof in the other frame.
    check(x, mid - 40, 26, { alpha: five, color: P.muted });
  });
  s17Page(ax + aw / 2 - 55, mid - 70, 110, 140, { alpha: ev, rows: 5, stroke: P.evidence });
  link(lx + lw + 12, mid, ax - 12, mid, {
    color: P.unknown,
    alpha: five * ramp(t, opinion + 0.05, 0.3),
    upto: 0.5,
    draw: go,
    end: false,
    dash: [8, 8],
  });
  line((lx + lw + ax) / 2, mid - 34, (lx + lw + ax) / 2, mid + 34, {
    color: P.unknown,
    alpha: ramp(t, not + 0.05, 0.3) * five,
    width: 4,
  });
}

/* Stage 6: the checked output, whose source and limits enter the authoritative record before it is a team fact. */
export function s21TeamFact(s, t, lasting, authoritative, teamFact, six) {
  const [recorded, src, lim] = cues(s, [
    ["记进", "recorded"],
    ["来源", "source"],
    ["限度", "limits"],
  ]);
  const outputName = L("检查过的输出", "Checked output"),
    recordName = L("这项工作的权威记录", ""),
    factName = L("", "A lasting team fact");
  const entries = en ? ["Source", "Limits"] : ["来源", "限度"];
  // The pages behind the front one stand BACK px apart up and to the right; the entries stand clear of them.
  const BACK = 26,
    left = Math.min(
      1000 - 110 - NAME_GAP - measure(outputName),
      810 - (recordName ? NAME_GAP + measure(recordName) : 0),
    );
  const right = Math.max(
    1110 + 2 * BACK + 26 + NAME_GAP + Math.max(...entries.map((v) => measure(v))),
    1190 + 30 + (factName ? NAME_GAP + measure(factName) : 0),
  );
  const shift = 960 - (left + right) / 2;
  const OX = 1000 + shift,
    OY = 300,
    OW = 220,
    OH = 260,
    RX = 810 + shift,
    RY = 640,
    RW = 380,
    RH = 150,
    stampAt = Math.max(teamFact, authoritative) + 0.05;
  const go = soon(t, recorded + 0.05, 0.6),
    rec = named(t, authoritative) * six,
    EX = OX + OW / 2 + 2 * BACK + 26;
  // The checked output: the work's pages with its check. The pages behind show only the edges that stand clear of the
  // front page.
  const PX = OX - OW / 2;
  for (let k = 2; k >= 1; k--)
    path(
      [
        [PX + k * BACK, OY - (k - 1) * BACK],
        [PX + k * BACK, OY - k * BACK],
        [PX + OW + k * BACK, OY - k * BACK],
        [PX + OW + k * BACK, OY + OH - k * BACK],
        [PX + OW + (k - 1) * BACK, OY + OH - k * BACK],
      ],
      { color: P.ink, alpha: six, width: 2 },
    );
  documentIcon(PX, OY, OW, OH, { alpha: six, rows: 0 });
  check(OX, OY + OH / 2 + 6, 90, { alpha: six });
  nameText(outputName, PX - NAME_GAP, OY + OH / 2, {
    align: "right",
    alpha: six * named(t, lasting),
  });
  // Its source and limits, one row each beside it, on their own words; the stamp makes the whole entry full ink.
  [src, lim].forEach((at, k) => {
    const y = OY + 90 + k * 56,
      whole = named(t, at) * ramp(t, stampAt, 0.35);
    dot(EX, y, 6, { color: P.evidence, alpha: six * named(t, at) });
    nameText(entries[k], EX + NAME_GAP, y, {
      align: "left",
      color: P.evidence,
      alpha: six * Math.max(listIn(t, [src, lim], k), whole),
      set: "entry",
    });
  });
  link(OX, OY + OH + 12, OX, RY - 12, {
    color: P.evidence,
    alpha: six * named(t, recorded),
    upto: go,
    flowing: since(t, recorded + 0.65),
  });
  box(RX, RY, RW, RH, { fill: P.row, stroke: P.ink, alpha: rec, radius: 12, width: 2.5 });
  // The English names the record only in its caption ("in the authoritative record for that work."), so its name there would repeat
  // the caption word for word and is left to it.
  nameText(recordName, RX - NAME_GAP, RY + RH / 2, { align: "right", width: 320, alpha: rec });
  [RY + 30, RY + 75].forEach((y, k) =>
    line(RX + 40, y, RX + RW - 60 - k * 90, y, { color: P.line, alpha: rec, width: 3 }),
  );
  // The new entry the recording adds: a ruled row in the evidence colour, drawn once the way has reached the record.
  line(
    RX + 40,
    RY + 120,
    mix(RX + 40, RX + RW - 100, drawShare(t, recorded + 0.65, RW - 140)),
    RY + 120,
    { color: P.evidence, alpha: six * ramp(t, recorded + 0.65, 0.4), width: 4 },
  );
  // The stamp sits on the record's right edge and stamps on the later of the record's and the fact's words, so the
  // record and the fact have both been said when it lands; a fact said before it is recorded (English names it first)
  // stands dashed in its place until then.
  const SX = RX + RW,
    SY = RY + RH / 2,
    stamp = ramp(t, stampAt, 0.35) * six;
  if (teamFact + 0.5 < stampAt)
    ring(SX, SY, 30, {
      color: P.evidence,
      alpha: six * named(t, teamFact) * (1 - ramp(t, stampAt, 0.35)),
      width: 2,
      dash: [6, 6],
    });
  dot(SX, SY, 30, { color: P.ground, alpha: stamp });
  ring(SX, SY, 30, { color: P.evidence, alpha: stamp, width: 3 });
  check(SX, SY + 2, 26, { alpha: stamp, upto: clamp((t - stampAt) / 0.35) });
  // The Chinese fact is said only in its own caption ("才算团队能长期依靠的事实。"), so its name would repeat that
  // caption and is left to it; the English names it in a longer line.
  nameText(factName, SX + 30 + NAME_GAP, SY, { align: "left", alpha: six * named(t, teamFact) });
}

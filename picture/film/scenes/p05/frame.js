/* 05's later stages: the frame of the problem and what it must hold, the stop while something is unclear, and
 * information's worth by the judgment it could change. */

import { ctx } from "../../canvas.js";
import { blend } from "../../drawing/colour.js";
import { since } from "../../drawing/flows.js";
import { restMark } from "../../drawing/levels.js";
import { link } from "../../drawing/links.js";
import {
  box,
  dashed,
  diamond,
  dot,
  labelSize,
  line,
  measure,
  path,
  text,
} from "../../drawing/strokes.js";
import { check, cross, person, ring, token } from "../../drawing/symbols.js";
import { listIn, named, speaking } from "../../naming/lists.js";
import { NAME_GAP, nameText } from "../../naming/names.js";
import { CONTENT_CY, railNames, railStations } from "../../naming/placement.js";
import { rejectedName } from "../../naming/rejected.js";
import { LABEL, P } from "../../palette.js";
import { L, en } from "../../timeline.js";
import { cue, cueFrom, cues } from "../../timing/cues.js";
import { ease, mix, ramp } from "../../timing/easing.js";
import { drawnShare, glide } from "../../timing/pace.js";
import { voiceTime } from "../../timing/pauses.js";
import { s03Extent } from "../p03/order.js";

/* Stage 3: the frame of the problem, and what it must hold in one column inside it. */
export function s05Frame(s, t, frame, subject, present, criteria, outScope, limits, commit, three) {
  // The frame's sides grow down with each item by the padding above the first, so the items stand centred between its
  // top and the sides' feet as they build, and its bottom edge stands that far below the last item.
  // The English frame keeps 75 px round its four items, 70 px apart, centred where the Chinese frame stands, so its
  // first picture, the frame round one item, covers a tenth of the band while its bottom edge stands where the limits
  // have room above the next stage. It stands 40 px wider on each side than its items alone would ask, so the limits'
  // names, at the one pitch that keeps the widest pair 50 px apart, stand inside its sides by the inset they kept.
  const FL = L(560, 500),
    FR = L(1360, 1420),
    FT = L(370, 385),
    ys = en ? [460, 530, 600, 670] : [470, 575, 680],
    PADV = ys[0] - FT,
    FB = ys.at(-1) + PADV;
  const commitQ = ramp(t, commit - 0.1, 0.6),
    tone = blend(P.ink, P.authority, commitQ);
  // Each item's first words.
  const items = en ? [subject, present, criteria, outScope] : [subject, present, criteria];
  const limitAts = [
    ["时间", "time"],
    ["成本", "cost"],
    ["合规", "compliance"],
    ["技术", "technical"],
    ["资源", "resource"],
  ].map(([zh, english]) => cueFrom(s, zh, english, limits - 0.05));
  // Its two sides, each with a foot of the bottom edge, and its top; the sides grow down with each item and reach the
  // bottom edge as the limits begin.
  const low = s03Extent(t, ys[0] + PADV, [
    ...items.slice(1).map((at) => [at, ys[1] - ys[0]]),
    [limitAts[0], FB - ys.at(-1) - PADV],
  ]);
  path(
    [
      [FL + 46, low],
      [FL, low],
      [FL, FT],
      [FR, FT],
    ],
    { color: tone, alpha: three, width: 3 },
  );
  path(
    [
      [FR, FT],
      [FR, low],
      [FR - 46, low],
    ],
    { color: tone, alpha: three, width: 3 },
  );
  nameText(L("问题", "The problem"), FL, FT - NAME_GAP, {
    align: "left",
    valign: "bottom",
    alpha: three * named(t, frame),
  });
  nameText(L("能执行的承诺", "Executable commitment"), FR, FT - NAME_GAP, {
    align: "right",
    valign: "bottom",
    color: P.authority,
    alpha: three * named(t, commit),
  });
  // Each item is named by its key words; each Chinese pair, a caption cue of its own, is named by the words of its first
  // half, and the mark beside it takes its second half on its words: the baseline the present state is compared with
  // draws in dashes, and a cross for what is out of scope joins the check of success.
  const names = en
    ? [
        "Its subject and who is affected",
        "Present state and baseline",
        "The success criteria",
        "What is out of scope",
      ]
    : ["针对什么，影响谁", "现在怎样", "怎样算成功"];
  const [baselineAt, outAt] = en
    ? [present, outScope]
    : cues(s, [
        ["跟什么比", ""],
        ["哪些不做", ""],
      ]);
  const MX = 960 + 22 - (50 + NAME_GAP + Math.max(...names.map((v) => measure(v, LABEL)))) / 2,
    NX = MX + 28 + NAME_GAP;
  // The goal lights again when the limits sentence names it, and stays lit until the stage cut: the goal is the item
  // that says what counts as success, the third in both editions.
  const again = cueFrom(s, "目标", "a goal", outScope),
    aim = ramp(t, again - 0.1, 0.3);
  items.forEach((at, i) => {
    const y = ys[i],
      q = ramp(t, at - 0.1, 0.4) * three,
      lit = Math.max(speaking(t, items, i), i === 2 ? aim : 0);
    // The item's mark; each Chinese pair takes the mark of the English item it opens with.
    const kind = (en ? [0, 1, 3, 4] : [0, 1, 3])[i];
    if (lit > 0)
      ring(MX, y, 30, {
        color: i === 2 ? P.authority : P.ink,
        alpha: lit * restMark(i === 2 ? P.authority : P.ink, 0.5) * three,
        width: 2,
      });
    if (kind === 0) {
      dot(MX - 8, y - 4, 6, { color: P.evidence, alpha: q });
      person(MX + 7, y + 6, { size: 0.45, alpha: q });
    }
    if (kind === 1) {
      line(MX - 12, y - 5, MX + 4, y - 5, { color: P.ink, alpha: q, width: 5 });
      dashed(MX - 12, y + 6, MX + 12, y + 6, {
        color: P.muted,
        alpha: ramp(t, baselineAt - 0.1, 0.4) * three,
      });
    }
    if (kind === 2) {
      ring(MX, y, 12, { color: P.ink, alpha: q, width: 2.5 });
      dot(MX, y, 5, { color: P.authority, alpha: q });
    }
    if (kind === 3 && en) check(MX, y, 20, { alpha: q });
    if (kind === 3 && !en) {
      check(MX - 9, y, 16, { alpha: q });
      cross(MX + 14, y, 11, { alpha: ramp(t, outAt - 0.1, 0.4) * three, width: 3 });
    }
    if (kind === 4) cross(MX, y, 14, { alpha: q, width: 3 });
    nameText(names[i], NX, y, {
      align: "left",
      alpha: three * listIn(t, items, i),
      set: "frame",
    });
  });
  // The bottom edge, closed by its limits.
  // The row of the limits' names stands centred on the frame: its first and last names keep one inset from the sides.
  // The English names differ most in width, so they stand at one pitch, the widest pair's need, their row's ink
  // centred on the frame, each name centred on its tick. The widest pair keeps a clear gap of 50 px, the gap two names
  // on one row keep (48 px at 1080p and 1.5 em).
  const limitNames = en
    ? ["Time", "Cost", "Compliance", "Technical", "Resource"]
    : ["时间", "成本", "合规", "技术", "资源"];
  const [w0, wn] = [limitNames[0], limitNames.at(-1)].map((v) => measure(v, LABEL)),
    inset = (180 - (w0 + wn) / 2) / 2;
  const [firstX, lastX] = [FL + inset + w0 / 2, FR - inset - wn / 2];
  const pitchEn = Math.max(
    (lastX - firstX) / 4,
    ...limitNames
      .slice(1)
      .map((v, i) => (measure(limitNames[i], LABEL) + measure(v, LABEL)) / 2 + 50),
  );
  const xs = en
    ? limitNames.map((_, i) => 960 - (wn - w0) / 4 + (i - 2) * pitchEn)
    : railStations(limitNames, firstX, lastX);
  line(
    FL + 46,
    FB,
    mix(FL + 46, FR - 46, drawnShare({ t, at: limitAts[4] - 0.1 }, FR - FL - 92)),
    FB,
    { color: tone, alpha: three * ramp(t, limitAts[0] - 0.1, 0.3), width: 3 },
  );
  limitAts.forEach((at, i) => {
    const q = ramp(t, at - 0.1, 0.4) * three,
      lit = speaking(t, limitAts, i);
    line(xs[i], FB - 14, xs[i], FB + 14, { color: P.authority, alpha: q, width: 3 + lit });
  });
  railNames(limitNames, xs, FB, {
    alpha: (i) => three * listIn(t, limitAts, i),
    color: () => P.authority,
    set: "limits",
  });
}

/* Stage 4: the affected action stopped while the subject, the authority or an irreversible consequence is unclear. */
export function s05Unclear(s, t, unclear, stop, ask, unSubject, four) {
  const LY = 650,
    BX = 1402,
    HX = BX - 44,
    PY = 390,
    MX = 502,
    ys = [380, 470, 560];
  const conds = [
    unSubject,
    ...cues(s, [
      ["行动依据", "the authority"],
      ["后果是否可逆", "irreversible consequence"],
    ]),
  ];
  const names = en
    ? ["The subject", "The authority", "An irreversible consequence"]
    : ["要处理的对象", "行动依据", "后果是否可逆"];
  const lane = ramp(t, unSubject - 0.15, 0.4) * four;
  nameText(L("说不清", "Unclear"), MX - 20, ys[0] - 34 - NAME_GAP, {
    align: "left",
    valign: "bottom",
    alpha: four * named(t, unclear),
  });
  link(MX - 40, ys[0] - 20, BX, LY, { route: "vh", alpha: lane, width: 3, end: false });
  conds.forEach((at, i) => {
    const y = ys[i],
      q = ramp(t, at - 0.1, 0.4) * four,
      lit = speaking(t, conds, i);
    ring(MX, y, 20, { color: P.unknown, alpha: q, width: 2.5 });
    if (lit > 0)
      ring(MX, y, 30, {
        color: P.unknown,
        alpha: lit * restMark(P.unknown, 0.5) * four,
        width: 2,
      });
    text("?", MX, y + 1, 22, { align: "center", color: P.unknown, alpha: q, role: "mark" });
    nameText(names[i], MX + 20 + NAME_GAP, y, {
      align: "left",
      alpha: four * listIn(t, conds, i),
      set: "unclear",
    });
  });
  // The affected action moves along its lane in voice time, setting off from rest, and settles at the bar as it is
  // stopped; the way on beyond it is drawn dashed on the words that stop the action: open, but untaken.
  dashed(BX + 24, LY, BX + 120, LY, { color: P.line, alpha: four * ramp(t, stop - 0.05, 0.3) });
  const run = ease(
    (voiceTime(t) - voiceTime(unSubject)) / Math.max(0.5, voiceTime(stop) - voiceTime(unSubject)),
  );
  token(mix(MX + 70, HX, run), LY, { color: P.evidence, alpha: lane, r: 18 });
  line(BX, LY - 34, BX, LY + 34, {
    color: P.unknown,
    alpha: ramp(t, stop - 0.05, 0.3) * four,
    width: 4,
  });
  nameText(L("停下受影响的事", "Stop the affected action"), HX, LY + 34 + NAME_GAP, {
    valign: "top",
    alpha: four * named(t, stop),
  });
  // The question rises above the halted action to the person who decides, who appears on the words.
  const fills = ramp(t, ask - 0.1, 0.5);
  person(HX, PY, { color: P.authority, alpha: fills * four, size: 1.05 });
  link(HX, LY - 32, HX, PY + 44, {
    color: P.authority,
    alpha: four,
    draw: { t, at: ask - 0.05 },
    width: 2.5,
  });
  nameText(L("有授权的人", "An authorized person"), HX - 16 - NAME_GAP, PY - 17, {
    align: "right",
    width: 300,
    color: P.authority,
    alpha: four * named(t, ask),
  });
}

/* Stage 5: the collected information in its tray, linked to the judgment it could change. */
export function s05Information(s, t, collect, change, five) {
  // The row stands centred between the tray's left edge and the end of the judgment's name at the right.
  const end = 1210 + 18 + NAME_GAP + measure(L("能改变哪个判断", "The judgment it could change"));
  const sx = 960 - (379 + end) / 2;
  const LX = 380 + sx,
    RX = 1210 + sx,
    AY = CONTENT_CY + 20,
    W = 340,
    H = 120;
  // Until the judgment it could change arrives, the tray and the aim it is taken for stand centred as a pair, from
  // the tray's left edge to the aim's cross, and they move to their places with the judgment, on its words; the pair
  // stands no further right than keeps the judgment's name, arriving there, inside the safe area.
  const goalW = measure(L("目的", "The aim")) + 16 + Math.min(26, labelSize(LABEL) * 0.9);
  const pair = Math.min(960 - (LX + RX + goalW / 2) / 2, 1800 - (end + sx));
  ctx.save();
  ctx.translate(pair * (1 - glide(t, change + 0.05, pair)), 0);
  const tray = ramp(t, collect + 0.05, 0.5) * five;
  box(LX, AY - H / 2, W, H, { stroke: P.line, alpha: tray, radius: 12, width: 2 });
  const tied = ramp(t, change - 0.1, 0.5);
  for (let k = 0; k < 18; k++) {
    const useful = k % 5 === 1,
      x = LX + 40 + (k % 6) * 52,
      y = AY - 30 + Math.floor(k / 6) * 30;
    dot(x, y, 8, {
      color: useful ? blend(P.muted, P.evidence, tied) : P.muted,
      alpha: five * ramp(t, collect - 0.1 + k * 0.04, 0.35) * (useful ? 1 : mix(0.85, 0.6, tied)),
    });
  }
  nameText(L("收集信息", "Collecting information"), LX, AY - H / 2 - NAME_GAP, {
    align: "left",
    valign: "bottom",
    alpha: five * named(t, collect),
  });
  // Collecting is not the aim: the aim it is taken for stands struck where the judgment will stand, and gives way to
  // the judgment it could change.
  const notGoal = cue(s, "不是目的", "is not the aim"),
    judged = cueFrom(s, "判断", "judgment", notGoal);
  rejectedName(L("目的", "The aim"), RX, AY - 64, {
    alpha: five * named(t, notGoal) * (1 - ramp(t, judged - 0.2, 0.3)),
    mark: ramp(t, notGoal + 0.3, 0.3),
  });
  link(LX + W + 12, AY, RX - 30, AY, {
    alpha: five * ramp(t, change - 0.1, 0.3),
    draw: { t, at: change - 0.05 },
    flowing: since(t, change + 0.55),
  });
  diamond(RX, AY, 18, {
    color: P.authority,
    alpha: ramp(t, change - 0.1, 0.4) * five,
    solid: true,
  });
  nameText(L("能改变哪个判断", "The judgment it could change"), RX + 18 + NAME_GAP, AY, {
    align: "left",
    color: P.authority,
    alpha: five * named(t, change),
  });
  ctx.restore();
}

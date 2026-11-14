/* 11's Agent stage: the Agent at work inside its delegation on a small copy of the series. */

import { ctx } from "../../canvas.js";
import { SECOND } from "../../drawing/levels.js";
import { link } from "../../drawing/links.js";
import { box, dot, labelSize, line, measure, path } from "../../drawing/strokes.js";
import { agent } from "../../drawing/symbols.js";
import { listIn, named, speaking } from "../../naming/lists.js";
import { NAME_GAP, nameText, wrapName } from "../../naming/names.js";
import { rejectedName } from "../../naming/rejected.js";
import { LABEL, P } from "../../palette.js";
import { L, en } from "../../timeline.js";
import { cueFrom, cues } from "../../timing/cues.js";
import { clamp, mix, ramp } from "../../timing/easing.js";
import { GLIDE_PEAK, drawShare, glide, smoother } from "../../timing/pace.js";
import { thoughtEnd, voiceTime } from "../../timing/pauses.js";
import { CORR, DEC, X0, X1, corrected, priceAt, series } from "./prices.js";

/* Stage 7: the Agent locating the snapshots, comparing the revisions and rerunning the test inside its delegation. */
export function s11Delegation(s, t, agentCut, seven) {
  const [no, refused] = cues(s, [
    ["这份数据能不能用", "cannot grant admission"],
    ["它定不了", "cannot grant admission"],
  ]);
  // The frame stands right of its place while the Agent's tasks are named, about the centre and over the series it
  // replaces at the cut (the Chinese frame is narrower, so it stands 100 px right, the English 200), and the stage eases
  // to 120 px left of its place on the words that ask about admission, so the frame alone and the frame with admission
  // beside it each stand centred. The Chinese ease runs on to the words that refuse admission, which follow a second
  // later, so the picture keeps moving between the two; the English ends within its thought.
  const alone = L(100, 200),
    shift = alone - (alone + 120) * glide(t, no + 0.05, alone + 120);
  ctx.save();
  ctx.translate(shift, 0);
  // The English said "rerun the test" once already, in 11.6, so the third task is taken from this thought on.
  const ats = [
    ...cues(s, [
      ["找快照", "locate snapshots"],
      ["比对修正前后的值", "compare revisions"],
    ]),
    cueFrom(s, "用当时的数据重跑", "rerun the test", agentCut),
  ];
  // The copy of the chart keeps its names at the second ink, since the series and its decisions are not the subject
  // here; the revision appears only when the words compare it.
  const mx = (x) => 440 + (x - X0) * 0.48,
    my = (v) => 380 + (v - 552) * 0.75,
    mini = (fn, a, b) => series(fn, a, b).map(([x, v]) => [mx(x), my(v)]);
  // The Agent's column of tasks stands twice the name gap below the copy's decisions, so their name reads with the
  // bracket above it, and the frame holds the snapshots, the copy and the column with one padding on every side.
  const seriesName = wrapName(L("历史价格", "Historical prices"), L(150, 300)),
    names = en
      ? ["Locate snapshots", "Compare revisions", "Rerun the test"]
      : ["找快照", "比对修正前后的值", "用当时的数据重跑"];
  const ROWS = 508 + NAME_GAP + labelSize(LABEL) + 2 * NAME_GAP + labelSize(LABEL) / 2,
    STEP = 58,
    PAD = NAME_GAP;
  // The Agent stands so its name shares its last task's line.
  const AGY = ROWS + 2 * STEP - 34 - NAME_GAP - labelSize(LABEL) / 2;
  const inner = [
    mx(X0),
    262 - 24,
    Math.max(
      mx(X1) + (en ? 0 : NAME_GAP + Math.max(...seriesName.map((v) => measure(v)))),
      ...names.map((v) => 640 + 10 + NAME_GAP + measure(v)),
    ),
    Math.max(AGY + 34 + NAME_GAP + labelSize(LABEL), ROWS + 2 * STEP + labelSize(LABEL) / 2),
  ];
  // The snapshots' frames run along the frame's top, so the frame stands 5 px higher above them than the padding: they
  // keep about the clearance the column's last line keeps above the bottom (its words end above their line's foot).
  const F = {
      x: inner[0] - PAD,
      y: inner[1] - PAD - 5,
      w: inner[2] - inner[0] + 2 * PAD,
      h: inner[3] - inner[1] + 2 * PAD + 5,
    },
    place = seven;
  box(F.x, F.y, F.w, F.h, { stroke: P.evidence, alpha: place, radius: 16 });
  nameText(L("委托范围", "Within its delegation"), F.x, F.y - NAME_GAP, {
    align: "left",
    valign: "bottom",
    color: P.evidence,
    alpha: seven * named(t, agentCut),
  });
  line(mx(X0), 500, mx(X1), 500, { color: P.line, width: 2, alpha: place });
  path(mini(priceAt), { color: P.ink, width: 2, alpha: place });
  // The series is named beyond its end in Chinese; the English name, whole on one line, ends under the axis's end, on
  // the decisions' line, so the frame keeps to the copy's width.
  if (en)
    nameText(seriesName, mx(X1), 508 + NAME_GAP, {
      align: "right",
      valign: "top",
      alpha: place * SECOND,
    });
  else
    nameText(seriesName, mx(X1) + NAME_GAP, my(priceAt(X1)), {
      align: "left",
      alpha: place * SECOND,
    });
  line(mx(DEC[0]), 508, mx(DEC[2]), 508, { color: P.authority, width: 2, alpha: place });
  nameText(L("决策", "Decisions"), mx(DEC[1]), 508 + NAME_GAP, {
    valign: "top",
    color: P.authority,
    alpha: place * SECOND,
  });
  DEC.forEach((x, i) => {
    line(mx(x), 508, mx(x), my(priceAt(x)) + 8, { color: P.authority, width: 2, alpha: place });
    const sx = mx(x);
    box(sx - 34, 262 - 24, 68, 40, {
      stroke: P.evidence,
      width: 2,
      alpha: seven * ramp(t, ats[0] - 0.1 + i * 0.2, 0.25),
      radius: 4,
    });
    path(
      series(priceAt, X0, x).map(([u, v]) => [
        sx - 28 + ((u - X0) / (X1 - X0)) * 56,
        258 + (v - 552) * 0.12,
      ]),
      { color: P.evidence, width: 1.5, alpha: seven, draw: { t, at: ats[0] - 0.1 + i * 0.2 } },
    );
  });
  // Compare: the two versions of the corrected stretch light together; rerun: a sweep runs the decisions again.
  path(mini(corrected, CORR[0] - 20, CORR[1] + 20), {
    color: P.evidence,
    width: 3.5,
    alpha: seven,
    draw: { t, at: ats[1] - 0.05 },
  });
  // The sweep runs at one even pace, GLIDE_PEAK px/s at most, so it crosses the copy in 1.2 s or as long as that asks.
  const sweep = clamp(
      (voiceTime(t) - voiceTime(ats[2] + 0.05)) / Math.max(1.2, (mx(X1) - mx(X0)) / GLIDE_PEAK),
    ),
    sx = mix(mx(X0), mx(X1), sweep);
  if (sweep > 0 && sweep < 1)
    line(sx, 300, sx, 494, {
      color: P.evidence,
      width: 3,
      alpha: seven * clamp(sweep / 0.2) * clamp((1 - sweep) / 0.2),
    });
  // The Agent and the column of its tasks below the copy.
  // The Agent arrives with its name on its own word.
  const agentAt = cueFrom(s, "智能体", "agent", agentCut);
  agent(520, AGY, { alpha: seven * named(t, agentAt), size: 1.1 });
  nameText(L("智能体", "Agent"), 520, AGY + 34 + NAME_GAP, {
    valign: "top",
    color: P.evidence,
    alpha: seven * named(t, agentAt),
  });
  ats.forEach((at, i) => {
    const y = ROWS + i * STEP,
      lit = speaking(t, ats, i);
    dot(640, y, 6 + 2 * lit, { color: P.evidence, alpha: seven * ramp(t, at - 0.1, 0.25) });
    nameText(names[i], 640 + 10 + NAME_GAP, y, {
      align: "left",
      alpha: seven * listIn(t, ats, i),
      set: "agent tasks",
    });
  });
  // Admission stands outside the frame, drawn in the authority colour on the words that ask about it; the way to it
  // draws on, and stops at a bar, on the words that refuse it to the Agent. The Chinese asks whether the data may be
  // used and says the Agent cannot settle it, so admission is named there by that question and the refusal by those
  // words; the English says both in one phrase. The Chinese names admission, and refuses it, once the frame has eased
  // to its place, so its gate, bar and refusal stand at their place in the finished stage from the first, inside the
  // safe area, while the frame eases away from them; the English refuses it as it names it, so they ease with the frame
  // over the frame's whole glide, easing from rest to rest from 1630 to 1540 on screen, and stand inside the safe area
  // from their first frame.
  const share = (alone - shift) / (alone + 120),
    hold = en ? shift + 30 + 90 * smoother(share) : 120 + shift;
  const gx = 1660 - hold,
    gq = ramp(t, no - 0.15, 0.4) * seven,
    mid = F.y + F.h / 2;
  line(gx, mid - 150, gx, mid + 150, { color: P.authority, width: 5, alpha: gq });
  nameText(L("能不能用", "Admission"), gx, mid - 150 - NAME_GAP, {
    valign: "bottom",
    color: P.authority,
    alpha: seven * named(t, no),
  });
  // The way runs on just past the bar that stops it, whatever the frame's width.
  const wayFrom = F.x + F.w + 12,
    stopX = 1470 - hold;
  link(wayFrom, mid, gx - 24, mid, {
    color: P.unknown,
    alpha: ramp(t, refused - 0.15, 0.4) * seven,
    upto:
      ((stopX + 11 - wayFrom) / (gx - 24 - wayFrom)) *
      drawShare(t, refused - 0.05, stopX + 11 - wayFrom, 0.6),
    dash: [8, 8],
    end: false,
  });
  // The bar and the refusal's cross come once the way has reached the bar, and within the refusal's thought, so they
  // stand still in the quiet after it.
  const barAt = Math.min(refused + 0.45, thoughtEnd(refused) - 0.35);
  line(stopX, mid - 30, stopX, mid + 30, {
    color: P.unknown,
    width: 4,
    alpha: ramp(t, barAt, 0.3) * seven,
  });
  rejectedName(L("它定不了", "Grant admission"), stopX, mid + 30 + NAME_GAP, {
    valign: "top",
    alpha: seven * named(t, refused),
    mark: ramp(t, barAt, 0.3),
  });
  ctx.restore();
}

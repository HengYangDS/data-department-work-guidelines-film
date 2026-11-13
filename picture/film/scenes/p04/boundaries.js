/* 04's four boundaries: their column beside the field, the action that halts at a line and is escalated to the
 * owner, and the duties that apply whatever the risk. */

import { ctx } from "../../canvas.js";
import { blend } from "../../drawing/colour.js";
import { restMark } from "../../drawing/levels.js";
import { link } from "../../drawing/links.js";
import { box, dot, labelSize, line, stroke } from "../../drawing/strokes.js";
import { documentIcon, person, ring } from "../../drawing/symbols.js";
import { listLevel, named, speaking } from "../../naming/lists.js";
import { NAME_GAP, nameText } from "../../naming/names.js";
import { CONTENT_CY, stackTops } from "../../naming/placement.js";
import { termRow, termRowLayout } from "../../naming/terms.js";
import { LABEL, P } from "../../palette.js";
import { L, en } from "../../timeline.js";
import { cue, cueFrom, cues } from "../../timing/cues.js";
import { clamp, mix, ramp, soon } from "../../timing/easing.js";
import { drawShare } from "../../timing/pace.js";
import { voiceTime } from "../../timing/pauses.js";
import { STAGE_CUT } from "../../timing/stages.js";

/* Stage 1: the four boundaries in one column beside the field, each a key term and what it rules out or covers. */
export function s04Boundaries(t, truth, boundaryRows, W1, LX1, ox, clear, starts, said, one) {
  // Every qualifier stands under its term, since some are too long to run on their term's line, so the list sets its
  // glosses one way: each Chinese qualifier takes two lines and the English ones two or three, at one pitch.
  const rows = boundaryRows,
    LX = LX1 + ox,
    W = W1,
    G = 36;
  const tops = stackTops(
    rows.map(([term, qual]) => termRowLayout([term], qual, W, false).height),
    CONTENT_CY,
    44,
  );
  rows.forEach(([term, qual], r) => {
    // The first boundary's row comes in as the gliding field clears it, its key a quarter second after its words, so
    // neither stands inside the field; each further row comes in on its own words.
    const at = r ? starts[r] : Math.max(truth + STAGE_CUT + 0.15, clear),
      keyAt = r ? at : at + 0.25;
    const my = tops[r] + labelSize(LABEL) / 2,
      gx = LX - 34 - G,
      h = G / 2;
    const c = [
        [gx, my - h],
        [gx + G, my - h],
        [gx + G, my + h],
        [gx, my + h],
      ],
      [a, b] = [c[r], c[(r + 1) % 4]];
    box(gx, my - h, G, G, {
      stroke: P.line,
      alpha: one * ramp(t, keyAt - 0.15, 0.4),
      radius: 2,
      width: 2,
    });
    // The boundary's own side, solid and thick, so the key reads as that side of the field rather than a checkbox.
    const drawn = soon(t, keyAt - 0.15, 0.5);
    if (drawn > 0)
      line(a[0], a[1], mix(a[0], b[0], drawn), mix(a[1], b[1], drawn), {
        color: P.authority,
        alpha: one,
        width: 8,
        cap: "butt",
      });
    // The English fourth boundary is said over five seconds, the claims it withholds last, so its qualifier builds
    // part by part on their words; the other rows stand whole on theirs.
    termRow(t, [term], [at], qual, said[r], LX, tops[r], {
      width: W,
      alpha: one * listLevel(t, starts, r),
      set: "boundaries",
      build: en && r === 3,
      inline: false,
    });
  });
}

/* Stage 2: work moving inside the four lines, and an action about to cross one halted and escalated to the owner. */
export function s04Escalation(s, t, inside, near, breach, caseRows, W2, LX2, ox, FX, FY, FS, two) {
  const freeAts = cues(s, [
    ["欢迎自主", "autonomy"],
    ["探索", "exploration"],
    ["创造", "creative work"],
  ]);
  const nearAts = [
    cueFrom(s, "停下来", "stop", near),
    ...cues(s, [
      ["讲出来", "make it visible"],
      ["并上报", "and escalate"],
    ]),
  ];
  const outAts = cues(s, [
    ["停下受影响", "stop the affected"],
    ["如实说明", "disclose it"],
    ["在权限内纠正", "correct it within"],
    ["按风险上报", "escalate as the risk"],
  ]);
  const free = ramp(t, freeAts[0] - 0.15, 0.5) * two;
  for (let k = 0; k < 5; k++) {
    const x = FX + 96 + Math.sin(voiceTime(t) * 0.6 + k * 1.9) * 52,
      y = FY + FS / 2 - 10 + Math.cos(voiceTime(t) * 0.47 + k * 2.4) * 110;
    dot(x, y, 8, { color: P.evidence, alpha: free * 0.9 });
  }
  // The owner stands inside the field's top right corner; both escalations end at it. Each escalation leaves its action
  // 14 px clear of the action's ring, so the way up is a mark of the field in its own right and never takes over the
  // action it starts from.
  const OX = FX + FS - 46,
    OY = FY + 70,
    owner = ramp(t, nearAts[2] - 0.15, 0.4) * two;
  person(OX, OY, { color: P.authority, alpha: owner, size: 0.8 });
  const nx = mix(FX + FS * 0.5, FX + FS - 46, soon(t, near - 0.1, 1.0)),
    ny = FY + FS * 0.6,
    nq = ramp(t, near - 0.15, 0.4) * two;
  dot(nx, ny, 10, { color: P.ink, alpha: nq });
  ring(nx, ny, 20, {
    color: P.authority,
    alpha: ramp(t, nearAts[1] - 0.15, 0.3) * two,
    width: 2,
  });
  link(nx, ny - 34, OX, OY + 42, {
    color: P.authority,
    alpha: two,
    draw: { t, at: nearAts[2] - 0.1 },
    width: 2.5,
  });
  // The breach crosses the bottom side on its words, stops outside and returns inside when it is corrected.
  const bx = FX + 210,
    out = soon(t, breach - 0.1, 0.7),
    back = soon(t, outAts[2] - 0.1, 0.8),
    by = mix(FY + FS - 60, FY + FS + 46, out * (1 - back));
  const bq = ramp(t, breach - 0.15, 0.3) * two;
  dot(bx, by, 10, { color: blend(P.ink, P.unknown, clamp(out * 2) * (1 - back)), alpha: bq });
  ring(bx, by, 20, { color: P.authority, alpha: ramp(t, outAts[1] - 0.15, 0.3) * two, width: 2 });
  link(bx, by - 34, OX - 30, OY, {
    route: "vh",
    color: P.authority,
    alpha: two,
    draw: { t, at: outAts[3] - 0.1 },
    width: 2.5,
  });
  const rows = caseRows.map(([term, qual], r) => [
    term,
    [[inside, near, breach][r]],
    qual,
    [freeAts, nearAts, outAts][r],
  ]);
  // Every case's parts stand under its name, as the boundaries' qualifiers do, since the breach's are too long to run
  // on its line; they take two lines, so the whole column is about as wide as its first two cases.
  const LX = LX2 + ox,
    W = W2,
    rowAt = [inside, near, breach],
    hue = [P.evidence, P.ink, P.unknown];
  const tops = stackTops(
    rows.map(([term, , qual]) => termRowLayout([term], qual, W, false).height),
    CONTENT_CY,
    64,
  );
  rows.forEach(([term, termAts, qual, qualAts], r) => {
    const my = tops[r] + labelSize(LABEL) / 2,
      lit = speaking(t, rowAt, r);
    dot(LX - 34, my, 8, { color: hue[r], alpha: two * ramp(t, rowAt[r] - 0.15, 0.4) });
    if (lit > 0)
      ring(LX - 34, my, 17, {
        color: hue[r],
        alpha: two * lit * restMark(hue[r], 0.6),
        width: 2,
      });
    termRow(t, [term], termAts, qual, qualAts, LX, tops[r], {
      width: W,
      alpha: two * listLevel(t, rowAt, r),
      set: "cases",
      inline: false,
    });
  });
}

/* Stage 4: the three tiers side by side, each inside the same field of four lines, since every duty still applies. */
export function s04Duties(s, t, duty, four4) {
  const xs = [560, 960, 1360],
    S = 260,
    CY = CONTENT_CY - 50,
    docs = [
      [64, 82],
      [92, 118],
      [126, 162],
    ];
  const notAt = cue(s, "该尽的义务", "every duty"),
    formLit = ramp(t, duty - 0.15, 0.4) * (1 - ramp(t, notAt - 0.15, 0.4));
  const dutyLit = ramp(t, notAt - 0.15, 0.4);
  xs.forEach((x, i) => {
    const [w, h] = docs[i];
    documentIcon(x - w / 2, CY - h / 2, w, h, {
      alpha: four4,
      rows: 3 + i,
      stroke: blend(P.ink, P.evidence, formLit),
    });
  });
  // The same four lines around every tier: one stroke for the three fields, so they read as one set of duties. Their
  // tops are already drawing on in the cut's first frame, so the fields come in with the cut rather than a frame after.
  stroke(
    () =>
      xs.forEach((x) => {
        const c = [
          [x - S / 2, CY - S / 2],
          [x + S / 2, CY - S / 2],
          [x + S / 2, CY + S / 2],
          [x - S / 2, CY + S / 2],
        ];
        c.forEach(([x1, y1], j) => {
          const [x2, y2] = c[(j + 1) % 4],
            drawn = drawShare(t, duty + STAGE_CUT - 0.1 + j * 0.12, S);
          if (drawn > 0.01) {
            ctx.moveTo(x1, y1);
            ctx.lineTo(mix(x1, x2, drawn), mix(y1, y2, drawn));
          }
        });
      }),
    { color: P.authority, alpha: four4, width: 3 + dutyLit },
  );
  // Two names, each on its words. The risk that sizes the documents stands over the row, centred, on the words that
  // open the stage. The duty that still applies is the same set of fields around every tier: it stands under the row,
  // centred on a bracket that spans the three fields, so no field is named alone and the heaviest tier does not read
  // as the duty itself.
  nameText(L("不论风险高低", "Whatever the risk"), xs[1], CY - S / 2 - NAME_GAP, {
    valign: "bottom",
    alpha: four4 * named(t, duty),
  });
  const BY = CY + S / 2 + 26,
    bracket = four4 * named(t, notAt);
  stroke(
    () => {
      ctx.moveTo(xs[0] - S / 2, BY - 12);
      ctx.lineTo(xs[0] - S / 2, BY);
      ctx.lineTo(xs[2] + S / 2, BY);
      ctx.lineTo(xs[2] + S / 2, BY - 12);
    },
    { color: P.authority, alpha: bracket, width: 2.5 },
  );
  nameText(L("义务一样不能少", "Every duty"), xs[1], BY + NAME_GAP, {
    valign: "top",
    alpha: bracket,
  });
}

/* 13's first stages: the shared data, its downstream calculation and the join between them, and the several distinct
 * decisions the change needs. */

import { ctx } from "../../canvas.js";
import { blend } from "../../drawing/colour.js";
import { s13Table } from "../../drawing/datasets.js";
import { restMark } from "../../drawing/levels.js";
import { link } from "../../drawing/links.js";
import { s17Page } from "../../drawing/pages.js";
import { box, dot, labelSize, line, measure, path, stroke, text } from "../../drawing/strokes.js";
import { check, person, ring } from "../../drawing/symbols.js";
import { listIn, named, speaking } from "../../naming/lists.js";
import { NAME_GAP, nameText } from "../../naming/names.js";
import { growName } from "../../naming/parts.js";
import { LABEL, P } from "../../palette.js";
import { L, en } from "../../timeline.js";
import { cue, cueFrom } from "../../timing/cues.js";
import { clamp, mix, ramp, soon } from "../../timing/easing.js";
import { drawShare, glide } from "../../timing/pace.js";
import { series } from "../p11/prices.js";

/* Stage 1: the case, the shared data and the downstream factor calculation on one row with the join between them. */
export function s13Join(s, t, example, changeId, tests, join, wrong, p1) {
  // The data and the calculation are blocks of one height on one row, so their headings share a baseline. The finished
  // pair, out to the end of the tests' name beside the data, is centred in each edition. The data's table shows its
  // values and is wide enough that the data, with the case named over it, stands substantial while it is told alone.
  // The English names the tests by their words without "pass", which its caption says whole; the check beside the
  // name says they pass.
  const testsName = L("本地测试通过", "Local tests"),
    issuerName = L("一套公司代码", "Issuer identifier");
  const Y = 520,
    H = 220,
    W = 380,
    RW = 260,
    CH = H,
    reach = W + 26 + NAME_GAP + measure(testsName),
    rl = 960 - (720 + reach) / 2,
    top = Y - H / 2,
    ctop = Y - CH / 2,
    low = top + H + 50;
  const caseAt = cue(s, "一个虚构的例子", "an illustrative change"),
    dataAt = cueFrom(s, "一份共享数据", "a shared dataset", example);
  const idAt = cue(s, "一套公司代码", "issuer identifier"),
    factorAt = cue(s, "下游的因子计算", "factor calculation"),
    lost = cue(s, "漏掉一些", "lose matches");
  const outs = [wrong, lost];
  // Until the tests are said the data's group, from the identifier's name under it to its heading, stands centred under
  // the case's name; on the tests' words it eases left until the calculation arrives, so the group with the tests' name
  // is centred; on the calculation's first words it moves to the pair, over a second, so no name travels more than 40
  // px in a frame and the English calculation's name, which stands whole on one line, never meets the data's.
  const moveAt = en ? cue(s, "", "but a downstream") : factorAt;
  const lo = Math.min(0, (W - measure(issuerName)) / 2),
    told = soon(t, tests + 0.05, Math.max(0.7, moveAt - 0.15 - (tests + 0.05)));
  const solo = 960 - (lo + Math.max(W, measure(L("共享数据", "Shared dataset")), W - lo)) / 2,
    alone = 960 - (lo + reach) / 2;
  const apart = glide(t, moveAt + 0.05, Math.abs(rl + 720 - alone)),
    dl = mix(mix(solo, alone, told), rl + 720, apart),
    dx = dl + W / 2;
  // The case's file stands from the first word and its name beside it on its words, centred on the frame and then
  // over the pair. The file's lines are ruled as one stroke, so the file reads, and counts, as one mark its name names.
  const caseName = L("一个虚构的例子", "An illustrative change"),
    hx = mix(960, rl + (720 + W) / 2, apart) - (48 + measure(caseName)) / 2,
    hy = top - 120;
  const file = ramp(t, s.voice_start - 0.3, 0.4) * p1,
    data = ramp(t, dataAt - 0.15, 0.4) * p1;
  s17Page(hx, hy - labelSize(LABEL) / 2 - 20, 32, 40, { alpha: file, rows: 3 });
  nameText(caseName, hx + 48, hy, {
    align: "left",
    valign: "bottom",
    alpha: p1 * named(t, caseAt),
  });
  s13Table(dl, top, W, H, { alpha: data, values: true });
  nameText(L("共享数据", "Shared dataset"), dl, top - NAME_GAP, {
    align: "left",
    valign: "bottom",
    alpha: p1 * named(t, dataAt),
  });
  // Local tests pass: a check on the data's corner, named beside it.
  const ok = ramp(t, tests - 0.1, 0.4) * p1;
  dot(dl + W, top, 26, { color: P.ground, alpha: ok });
  ring(dl + W, top, 26, { color: P.evidence, alpha: ok, width: 2.5 });
  check(dl + W, top + 2, 22, { alpha: ok });
  nameText(testsName, dl + W + 26 + NAME_GAP, top, {
    align: "left",
    color: P.evidence,
    alpha: p1 * named(t, tests),
  });
  // The issuer's identifier flips over under the data instead of cutting from one value to the other.
  const flip = clamp((t - changeId + 0.1) / 0.6),
    sx = Math.max(0.04, Math.abs(Math.cos(Math.PI * flip)));
  ctx.save();
  ctx.translate(dx, low);
  ctx.scale(sx, 1);
  ctx.translate(-dx, -low);
  // Edge on, the old value fades out over the last frames of its half turn and the new one fades in over the first of
  // its own, so neither value leaves or arrives in one frame and the two never stand together.
  if (flip < 0.5)
    text("ID A1", dx, low, 26, {
      role: "mark",
      align: "center",
      color: P.ink,
      alpha: data * clamp((0.5 - flip) / 0.5),
    });
  else
    text("ID X9", dx, low, 26, {
      role: "mark",
      align: "center",
      color: P.authority,
      alpha: data * clamp((flip - 0.5) / 0.5),
    });
  ctx.restore();
  nameText(issuerName, dx, low + 18 + NAME_GAP, { valign: "top", alpha: p1 * named(t, idAt) });
  // Downstream, across from the data, the factor calculation arrives when it is named: a factor series computed from
  // the shared data.
  const fq = ramp(t, factorAt - 0.15, 0.4) * p1;
  box(rl, ctop, RW, CH, { fill: P.row, stroke: P.ink, alpha: fq, radius: 12 });
  path(
    series(
      (x) => Y + 24 + 34 * Math.sin((x - rl) / 38) * Math.exp(-(x - rl) / 360) - (x - rl) * 0.14,
      rl + 30,
      rl + RW - 30,
      6,
    ),
    { color: P.evidence, alpha: fq, width: 2.5 },
  );
  nameText(L("下游的因子计算", "Downstream factor calculation"), rl, ctop - NAME_GAP, {
    align: "left",
    valign: "bottom",
    width: 420,
    alpha: p1 * named(t, factorAt),
  });
  // The join on the old identifier draws on from the data to the calculation, its key above it and its name below;
  // when the wrong matches are named it breaks into a dashed, doubtful way over a third of a second: each 16 px of it
  // opens a gap from its end, so the dashes keep their places and nothing changes in one frame.
  const j = { t, at: join - 0.1 },
    bad = ramp(t, wrong - 0.1, 0.4),
    jx0 = dl - 12,
    jx1 = rl + RW + 12,
    jm = (jx0 + jx1) / 2;
  const broken = ramp(t, wrong + 0.05, 0.35);
  if (t >= join - 0.1)
    link(jx0, Y, jx1, Y, {
      color: blend(P.ink, P.unknown, bad),
      alpha: p1,
      draw: j,
      width: 2.5,
      dash: broken > 0 ? [16 - 8 * broken, 8 * broken] : null,
    });
  text("A1", jm, Y - 34, 26, {
    role: "mark",
    align: "center",
    color: blend(P.muted, P.unknown, bad),
    alpha: p1 * ramp(t, join - 0.1, 0.4),
  });
  nameText(L("按旧代码关联财务数据", "Joins on the old one"), jm, Y + NAME_GAP, {
    valign: "top",
    alpha: p1 * named(t, join),
  });
  // What the old join may do to the calculation: match the wrong companies or entities, or lose some; each row's mark
  // appears on its words, in a column under the calculation.
  outs.forEach((at, i) => {
    // The first outcome stands on the line of the identifier's name across the row, the second a row below.
    const y = low + 18 + NAME_GAP + labelSize(LABEL) / 2 + i * 70,
      q = ramp(t, at - 0.1, 0.4) * p1,
      lit = speaking(t, outs, i),
      mx = rl + 12;
    if (i === 0) dot(mx, y, 13, { color: P.unknown, alpha: q });
    else ring(mx, y, 11, { color: P.unknown, alpha: q, width: 3 });
    if (lit > 0)
      ring(mx, y, 18, { color: P.unknown, alpha: lit * restMark(P.unknown, 0.5) * p1, width: 2 });
    nameText(
      [L("关联错公司", "Match the wrong entities"), L("漏掉一些", "Lose matches")][i],
      mx + 11 + NAME_GAP,
      y,
      { align: "left", alpha: p1 * listIn(t, outs, i), set: "outcomes" },
    );
  });
}

/* Stage 2: several distinct decisions, each an open question that gives way to its owner. */
export function s13Decisions(s, t, decisions, schema, owners, opensDecisions, p2) {
  // The two owners stand symmetric about the decisions' name, and each list hangs centred under its owner.
  const xs = [520, 1400];
  const ownerNames = [
    L("有授权的领域负责人", "Authorized domain owners"),
    L("数据模型负责人", "Data-model owner"),
  ];
  // The English fifth item, a clause, is authored as its lines, so the column keeps the width of its other names.
  const items = en
    ? [
        ["Entities", "Relationships", "Rules", "Metric meanings"],
        [
          "Grain",
          "IDs and keys",
          "Constraints",
          "Time and version rules",
          ["How agreed meaning", "is represented"],
        ],
      ]
    : [
        ["公司是谁", "有什么关系", "业务规则是什么", "指标什么含义"],
        [
          "数据的粒度",
          "用什么代码和键关联",
          "有哪些约束",
          "时间和版本按什么规则",
          "约定的含义怎么表示",
        ],
      ];
  const itemAts = (
    en
      ? [
          ["entities", "relationships", "rules", "metric meanings"],
          ["grain", "IDs and keys", "constraints", "time and version", "how the agreed meaning"],
        ]
      : items
  ).map((list) => list.map((w) => cueFrom(s, w, w, decisions)));
  // The second list is the longer, so as its last item comes the stage glides 80 px up, and the whole stage, with the
  // schema under it, stands about the content centre.
  const Y = 480 - 80 * glide(t, itemAts[1].at(-1) - 0.3, 80);
  // The first owner's name and list stand while the second question still waits, and then both owners stand with
  // their lists; each owner reaches half the wider of its name and its list either side of it, and the question half
  // its mark. The stage stands right of the frame's centre by as much as balances those two pictures, so neither
  // leans far.
  const listW = (k) => 7 + 9 + NAME_GAP + 7 + Math.max(...items[k].flat().map((v) => measure(v))),
    half = (k) => Math.max(measure(ownerNames[k]), listW(k)) / 2;
  const shift =
    960 - (2 * (xs[0] - half(0)) + 2 * xs[1] + measure("?", 80, false, "mark") / 2 + half(1)) / 4;
  ctx.save();
  ctx.translate(shift, 0);
  const heading = p2 * named(t, opensDecisions) * (1 - ramp(t, itemAts[1].at(-1) - 0.15, 0.3));
  nameText(L("几件不同的事", "Several distinct decisions"), 960, Y - 160, { alpha: heading });
  // The decisions part from their name toward the two places where their owners will stand.
  stroke(
    () => {
      ctx.moveTo(960, Y - 140);
      ctx.lineTo(960, Y - 124);
      ctx.moveTo(xs[0], Y - 106);
      ctx.lineTo(xs[0], Y - 124);
      ctx.lineTo(xs[1], Y - 124);
      ctx.lineTo(xs[1], Y - 106);
    },
    { alpha: heading, width: 2 },
  );
  xs.forEach((x, k) => {
    const ats = itemAts[k],
      seen = ramp(t, owners[k] - 0.15, 0.4) * p2;
    // The open question: who decides is unknown until the owner is named, and it leaves just before the owner arrives.
    const open = p2 * named(t, opensDecisions) * (1 - ramp(t, owners[k] - 0.4, 0.25));
    text("?", x, Y - 6, 80, { role: "mark", align: "center", color: P.authority, alpha: open });
    person(x, Y, { alpha: seen, color: P.authority, size: 1.1 });
    nameText(ownerNames[k], x, Y - 45 - NAME_GAP, {
      valign: "bottom",
      color: P.authority,
      alpha: p2 * named(t, owners[k]),
    });
    const bx =
      x + 7 - (7 + 9 + NAME_GAP + 7 + Math.max(...items[k].flat().map((v) => measure(v)))) / 2;
    ats.forEach((at, i) => {
      // An item of two lines hangs its first line on the list's pitch and grows downward, so its first line stands as
      // far from the item before it as every item does.
      const y = Y + 80 + i * 72,
        q = ramp(t, at - 0.15, 0.4) * p2,
        lit = speaking(t, ats, i),
        lines = Array.isArray(items[k][i]);
      dot(bx, y, 7 + 2 * lit, { color: P.authority, alpha: q });
      nameText(items[k][i], bx + 9 + NAME_GAP, lines ? y - labelSize(LABEL) / 2 : y, {
        align: "left",
        valign: lines ? "top" : "middle",
        alpha: p2 * listIn(t, ats, i),
        set: `settles${k}`,
      });
    });
  });
  // The schema stands between the columns. Its way toward the meaning column draws on as it arrives and stops at a bar
  // before it reaches the column; the refusal is named under the schema, at full ink by the words that say it, as the
  // schema's qualifier: the two are one name, as a term and its qualifier are.
  const resolveAt = cue(s, "解决不了", "cannot resolve"),
    sc = ramp(t, schema - 0.15, 0.4) * p2,
    ty = Y + 150,
    way = 760;
  const stop = named(t, resolveAt - 0.2) * p2,
    barX = (960 - 80 - 12 + way) / 2;
  // The English schema is named without its article, so the schema and its refusal never repeat their caption line whole.
  const schemaName = L("表结构选得再方便", "Convenient schema"),
    refusal = L("解决不了含义上的分歧", "Cannot resolve a conflict of meaning");
  s13Table(880, ty, 160, 70, { alpha: sc, stroke: P.muted, rows: 3 });
  growName(t, [schemaName], [schema], 960, ty - NAME_GAP, {
    valign: "bottom",
    align: "center",
    alpha: p2,
    whole: `${schemaName} ${refusal}`,
  });
  link(880 - 12, ty + 35, way, ty + 35, {
    color: P.unknown,
    alpha: sc,
    upto: 0.5 * drawShare(t, schema + 0.1, 0.5 * Math.abs(way - (880 - 12)), 0.6),
    end: false,
    dash: [6, 6],
  });
  line(barX, ty + 5, barX, ty + 65, { color: P.unknown, alpha: stop, width: 4 });
  // The English refusal stands whole on one line between the two columns, as no break keeps its phrase in an even block.
  growName(t, [refusal], [resolveAt - 0.2], 960, ty + 70 + NAME_GAP, {
    valign: "top",
    align: "center",
    width: 480,
    alpha: p2,
    whole: `${schemaName} ${refusal}`,
  });
  ctx.restore();
}

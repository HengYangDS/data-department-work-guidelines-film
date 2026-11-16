/* 09 data: qualify data for a specific use. The scene: its cues and the cuts between its stages, each stage on the
 * words that name it. */

import { ctx } from "../../canvas.js";
import { tableIcon } from "../../drawing/datasets.js";
import { since } from "../../drawing/flows.js";
import { restMark } from "../../drawing/levels.js";
import { link } from "../../drawing/links.js";
import { box, diamond, dot, line, path, text } from "../../drawing/strokes.js";
import { check, documentIcon, person, ring } from "../../drawing/symbols.js";
import { opening } from "../../framing/chapters.js";
import { building, listIn, named, speaking } from "../../naming/lists.js";
import { NAME_GAP, nameText, wrapName } from "../../naming/names.js";
import { blockHeight, growName } from "../../naming/parts.js";
import { radialName, railNames } from "../../naming/placement.js";
import { P } from "../../palette.js";
import { L, en } from "../../timeline.js";
import { cue, cues } from "../../timing/cues.js";
import { clamp, mix, ramp, soon } from "../../timing/easing.js";
import { glide } from "../../timing/pace.js";
import { voiceTime } from "../../timing/pauses.js";
import { STAGE_CUT, stageIn, stageOut } from "../../timing/stages.js";
import { scenes } from "../registry.js";

scenes["09"] = function (s, t) {
  const [specific, file, chart, signal, six, unclear, , , truth] = cues(s, [
    ["证明适合某个具体用途", "shown fit for a specific use"],
    ["能打开的文件", "a file that opens"],
    ["好看的图", "a chart that looks good"],
    ["看起来有效的模型信号", "a promising model signal"],
    ["先答清六个问题", "answer six questions"],
    ["含义、质量或", "data with unknown meaning"],
    ["探索", "explored"],
    ["共享", "sharing, production and decisions"],
    ["权威来源", "source of truth"],
  ]);
  const asks = cues(s, [
    ["从哪里来", "where did it come from"],
    ["最早什么时候能拿到", "when did it become available"],
    ["含义是什么", "what does it mean"],
    ["被什么改过", "what changed it"],
    ["质量怎么样", "how good is it"],
    ["能用在哪里", "how may it be used"],
  ]);
  const views = cues(s, [
    ["报告", "reports"],
    ["数据目录", "catalogs"],
    ["缓存", "caches"],
    ["智能体的摘要", "agent summaries"],
  ]);
  const unknowns = cues(s, [
    ["含义", "meaning"],
    ["质量", "quality"],
    ["使用权限", "permission"],
    ["复现", "reproducibility"],
  ]);
  const [dataAt, useAt, trustAt] = cues(s, [
    ["数据", "data"],
    ["具体用途", "a specific use"],
    ["才谈得上可信", "earns trust"],
  ]);
  // The data that may only be explored is named with its unknowns. English names them as the data's own words open its
  // thought, so the exploration stage cuts in on them. Chinese first recalls three of the six questions as the ones
  // still unclear, 含义、质量或最早能拿到的时间还说不清, so the ring holds through that clause and marks each on its
  // words, and the exploration stage cuts in as the clause that allows exploring begins.
  const explore = cue(s, "可以在授权范围里探索", "may be explored"),
    opensFour = en ? unclear : explore;
  const recalled = en ? [] : [unclear, cue(s, "质量或", ""), cue(s, "最早能拿到的时间", "")],
    recalls = [2, 4, 1];
  const base = ramp(t, opening(s), 0.7);
  const cx = 960,
    cy = 470,
    W = 560,
    H = 340,
    top = cy - H / 2;
  // Stages 1 to 3 stand about the data. The English open questions' names are long, so in English the data and all that
  // stands about it ease 55 px left as the first open question is named, and stay there while the ring's first four
  // questions are named on its right and below; the ring's English names are short, so the stage eases back to the
  // centre over the words of the two questions named on its left, in one move from the fifth question to the end of the
  // sixth: the second stage and the ring then stand about the centre as they build. The Chinese ring's names balance
  // about the data, so the Chinese stage stands still.
  // The English ring stands alone, and then with its first question named over it, for two seconds before a question
  // is named on its right, so the stage eases back to the centre as the ring cuts in and left again as the second
  // question is asked.
  const back = glide(t, asks[4] + 0.05, 55),
    ringCut = en ? glide(t, six + STAGE_CUT, 55) - glide(t, asks[1] - 0.1, 55) : 0;
  ctx.save();
  ctx.translate(en ? -55 * (glide(t, unknowns[0] + 0.05, 55) - ringCut - back) : 0, 0);
  // 1-3. The price data stands at the centre while it is questioned: its name above its left edge, the specific use it
  // must be shown fit for above its right edge on the same line, and its trust an open seal on its corner. Its rules are
  // one stroke with it, so the table reads as one mark under its name.
  const center = base * stageOut(t, opensFour);
  if (center > 0) {
    const core = ramp(t, Math.min(specific - 0.4, opening(s) + 0.2), 0.7) * center;
    tableIcon(cx - W / 2, top, W, H, { alpha: core, joined: true });
    [
      ["101.18", "101.25", "100.97"],
      ["100.94", "101.02", "100.88"],
      ["101.37", "101.41", "101.12"],
      ["101.06", "101.10", "100.95"],
    ].forEach((row, r) =>
      row.forEach((v, c) =>
        text(v, cx - W / 3 + (c * W) / 3, top + (H * (r + 0.5)) / 4, 26, {
          align: "center",
          color: c ? P.muted : P.ink,
          alpha: core,
          role: "mark",
        }),
      ),
    );
    // The chapter's first sentence is about its subject, data, which both editions name from its first word.
    nameText(L("数据", "Data"), cx - W / 2, top - NAME_GAP, {
      align: "left",
      valign: "bottom",
      alpha: center * named(t, Math.min(dataAt, s.words[0].start)),
    });
    nameText(L("具体用途", "A specific use"), cx + W / 2, top - NAME_GAP, {
      align: "right",
      valign: "bottom",
      color: P.evidence,
      alpha: center * named(t, useAt),
    });
    const badge = ramp(t, trustAt - 0.15, 0.4) * center;
    dot(cx + W / 2, top + H, 28, { color: P.ground, alpha: badge });
    ring(cx + W / 2, top + H, 28, { color: P.evidence, alpha: badge, width: 2.5, dash: [5, 5] });
    check(cx + W / 2, top + H + 2, 24, { color: P.muted, alpha: badge });
  }
  // 2. Opening, looking good or looking promising establishes nothing: the three stand in a row below the data, and
  // what none of them establishes forms a column of open questions beside it. The three stand 375 px apart and the
  // column 90 px from the data, so the stage stays about the centre once it is whole; while the row builds it stands
  // 120 px right for each of the three still to come, closing a step on each one's words, so the first two stand
  // about the centre with the data too.
  const two = base * stageOut(t, six);
  if (two > 0) {
    const y = 760,
      at = [file, chart, signal],
      seen = (i) => ramp(t, at[i] - 0.1, 0.5) * two,
      xs = [585, 960, 1335].map((x) => x + building(t, at, 120));
    documentIcon(xs[0] - 40, y - 50, 80, 100, { alpha: seen(0), rows: 3 });
    box(xs[1] - 64, y - 44, 128, 88, { stroke: P.ink, alpha: seen(1), radius: 6 });
    path(
      [
        [xs[1] - 44, y + 24],
        [xs[1] - 14, y - 2],
        [xs[1] + 12, y + 10],
        [xs[1] + 44, y - 24],
      ],
      { color: P.evidence, alpha: seen(1) },
    );
    path(
      [
        [xs[2] - 62, y + 20],
        [xs[2] - 26, y + 14],
        [xs[2] + 2, y - 2],
        [xs[2] + 30, y - 18],
        [xs[2] + 62, y - 40],
      ],
      { color: P.authority, alpha: seen(2), width: 3 },
    );
    // The three names share one baseline, a name's gap under the tallest of the three marks, the document; each English
    // name stands whole on one line, which the 375 px pitch leaves room for.
    railNames(
      en
        ? ["A file that opens", "A chart that looks good", "A promising model signal"]
        : ["能打开的文件", "好看的图", "看起来有效的模型信号"],
      xs,
      y + 50,
      { gap: NAME_GAP, wrap: 340, alpha: (i) => two * named(t, at[i]) },
    );
    const ux = cx + W / 2 + 90,
      names = en
        ? ["Meaning", "Quality", "Permission", "Reproducibility"]
        : ["含义", "质量", "权限", "复现"];
    unknowns.forEach((at2, i) => {
      const yy = top + 50 + i * 64,
        q = ramp(t, at2 - 0.1, 0.4) * two;
      ring(ux, yy, 17, { color: P.unknown, alpha: q, width: 2.5, dash: [4, 4] });
      text("?", ux, yy + 1, 22, { align: "center", color: P.unknown, alpha: q, role: "mark" });
      nameText(names[i], ux + 17 + NAME_GAP, yy, {
        align: "left",
        alpha: two * listIn(t, unknowns, i),
        set: "unknowns",
      });
    });
  }
  // 3. Six questions ring the data from the words that count them, replacing the three non-proofs in one cut: the ring
  // is counted in at the structure tier and named as six questions under the data, and each question's station arrives
  // on the ring, filled, when its question is asked; the names build into the whole set and leave with the ring when
  // the exploration stage cuts in. Each question is named by the noun of what it asks, as its caption shows the whole
  // question: in English, whose questions lose their sense without their question words, and in Chinese alike. The
  // Chinese sixth, where the data may be used, is named 使用范围: the scene says 用途 a few seconds later of the one use
  // the data must be shown fit for, which 用途 here would seem to anticipate; the second is named 最早时间, a noun short
  // of the term 可用时间, which first stands where 10 defines it. The English names are the data's own, each "Its …",
  // so a name the next thought says again (meaning, quality) is matched to its own question. As Chinese recalls meaning, quality and
  // availability as still unclear, each of the three takes the open question's dashed ring of stage 2 on its words and
  // keeps it while the ring stands.
  const three = base * stageIn(t, six) * stageOut(t, opensFour);
  if (three > 0) {
    const rx = 460,
      ry = 320,
      names = en
        ? [
            "Its source",
            "Its availability",
            "Its meaning",
            "Its changes",
            "Its quality",
            "Its permitted use",
          ]
        : ["来源", "最早时间", "含义", "改动", "质量", "使用范围"];
    path(
      Array.from({ length: 97 }, (_, k) => [
        cx + Math.cos((k * Math.PI) / 48) * rx,
        cy + Math.sin((k * Math.PI) / 48) * ry,
      ]),
      { color: P.line, alpha: three, width: 3.5 },
    );
    nameText(L("六个问题", "Six questions"), cx, top + H + 28 + NAME_GAP, {
      valign: "top",
      alpha: three * named(t, six),
    });
    asks.forEach((at, i) => {
      const a = -Math.PI / 2 + (i * Math.PI) / 3,
        x = cx + Math.cos(a) * rx,
        y = cy + Math.sin(a) * ry,
        lit = speaking(t, asks, i);
      const asked = ramp(t, at - 0.1, 0.4) * three;
      dot(x, y, 12, { color: P.ground, alpha: asked });
      dot(x, y, 12, { color: P.evidence, alpha: asked, hollow: true, width: 2.5 });
      dot(x, y, 12, { color: P.evidence, alpha: asked });
      if (lit > 0)
        ring(x, y, 21, {
          color: P.evidence,
          alpha: lit * restMark(P.evidence, 0.5) * three,
          width: 2,
        });
      const k = recalls.indexOf(i),
        open = k >= 0 && k < recalled.length ? ramp(t, recalled[k] + 0.05, 0.4) * three : 0;
      if (open > 0) ring(x, y, 24, { color: P.unknown, alpha: open, width: 2.5, dash: [4, 4] });
      radialName(names[i], cx, cy, rx + 12, a, {
        ry: ry + 12,
        alpha: three * listIn(t, asks, i),
        set: "questions",
      });
    });
  }
  ctx.restore();
  // 4. Data with unknown meaning, quality or historical availability may be explored within an authorized scope but
  // must stay out of sharing, production and decisions until qualified for that use. The data stands from the cut with its
  // question mark, named as the words say it: in English by its unknown meaning, the words the stage cuts in on, and in
  // Chinese 还说不清, the words that close the clause before the cut, whose unknowns the ring has just marked. Its
  // exploration scope, a frame sized to it, stands round it from the cut and takes its name on the words that allow
  // exploring ("可以…", "may be explored"), with the cut in Chinese, so the English stage never stands as the data alone
  // through the words that name its unknowns; the work it stays out of stands beside it as a small frame whose three
  // uses arrive on their words. The way from the data toward that work stops at a boundary halfway, on the words that
  // refuse it. Both editions say what the data must first be shown, fit for this use, last, as the stage gives way, so
  // the boundary stands for it unnamed.
  const four = base * stageIn(t, opensFour) * stageOut(t, views[0]);
  if (four > 0) {
    const scope = explore,
      uses = cues(s, [
        ["共享", "sharing"],
        ["投产", "production"],
        ["做决策", "decisions"],
      ]);
    // The exploration side stands right of its place while it builds alone, and the stage eases to 135 px left of it as
    // the work it stays out of is named, so the pair of frames stands centred once that work stands beside it. The
    // English stands 90 px right, so its table opens over the ring of questions it replaces.
    const build = L(45, 90);
    // The English work's name stands whole on one line, so its stage eases 60 px further left, from the words that refuse
    // the way, and stands inside the safe area as the name arrives.
    const toWork = build + L(135, 195),
      toWorkAt = en ? cue(s, "但若用于", "but must stay out of") + 0.05 : uses[0] + 0.05;
    ctx.save();
    ctx.translate(build - toWork * glide(t, toWorkAt, toWork), 0);
    // The two frames stand on one top, so their names stand on one line above them, and the way from exploration runs
    // into the work's frame at its centre. What the exploration frame holds, the table, its question and its name,
    // stands centred in it, with equal room above and below; the English name stands whole on one line, centred in the
    // frame under the table and its question, and its frame is 80 px wider than the Chinese, what the frame holds moving
    // with its centre, so the name keeps its padding and the frame, standing alone with what it holds until the
    // exploration is named, covers a tenth of the band. The frame is drawn 2.5 px wide, so it reads as lit structure on
    // its own, round quiet marks.
    const lx = 650,
      fy = 340,
      fw = L(400, 480),
      fh = 320,
      ax = 1250,
      ay = fy,
      aw = 290,
      ah = 200,
      mid = ay + ah / 2,
      unclearW = L(260, 380),
      inset = (fw - 400) / 2;
    const unclearName = L("还说不清", "Data with unknown meaning"),
      unclearAt = en ? unclear : cue(s, "还说不清", "");
    const ct = fy + (fh - 150 - NAME_GAP - blockHeight(wrapName(unclearName, unclearW).length)) / 2;
    box(lx, fy, fw, fh, { stroke: P.muted, width: 2.5, alpha: four, radius: 10 });
    nameText(L("在授权范围里探索", "Explored within an authorized scope"), lx, fy - NAME_GAP, {
      align: "left",
      valign: "bottom",
      alpha: four * named(t, scope),
    });
    tableIcon(lx + 50 + inset, ct, 220, 150, { alpha: four, stroke: P.muted, rows: 2, cols: 2 });
    text("?", lx + 330 + inset, ct + 75, 56, {
      align: "center",
      color: P.unknown,
      alpha: four,
      role: "mark",
    });
    nameText(unclearName, lx + L(160, fw / 2), ct + 150 + NAME_GAP, {
      valign: "top",
      width: unclearW,
      color: P.muted,
      alpha: four * named(t, unclearAt),
    });
    // The work it stays out of: shared use (two people), production (a running table) and decisions (a diamond).
    const wq = four * named(t, uses[0]);
    box(ax, ay, aw, ah, { fill: P.row, stroke: P.ink, alpha: wq, radius: 10 });
    nameText(L("共享、投产或做决策", "Sharing, production and decisions"), ax, ay - NAME_GAP, {
      align: "left",
      valign: "bottom",
      width: L(420, 600),
      alpha: wq,
    });
    const uq = (i) => four * ramp(t, uses[i] - 0.1, 0.4),
      ux = (i) => ax + (aw * (i + 0.5)) / 3,
      uy = ay + ah / 2;
    person(ux(0) - 12, uy + 4, { alpha: uq(0), size: 0.7 });
    person(ux(0) + 14, uy + 4, { alpha: uq(0), size: 0.7, color: P.muted });
    tableIcon(ux(1) - 30, uy - 22, 60, 44, { alpha: uq(1), rows: 3, cols: 2 });
    diamond(ux(2), uy, 20, { color: P.authority, alpha: uq(2), width: 3 });
    // The way from exploration toward that work runs straight across and stops at a boundary halfway, on the words that
    // refuse it, so the stop stands before the work is named.
    const refuse = cue(s, "但若用于", "but must stay out of"),
      go = soon(t, refuse - 0.05, 0.6),
      bx = (lx + fw + ax) / 2;
    link(lx + fw + 12, mid, ax - 12, mid, {
      color: P.unknown,
      alpha: four * ramp(t, refuse - 0.05, 0.3),
      upto: 0.46 * go,
      end: false,
      dash: [8, 8],
    });
    line(bx, mid - 34, bx, mid + 34, {
      color: P.unknown,
      alpha: ramp(t, refuse + 0.45, 0.3) * four,
      width: 4,
    });
    ctx.restore();
  }
  // 5. Reports, catalogs, caches and Agent summaries are derived: they hang from the source of truth on
  // one trunk and one crossing row, the order of a family tree, and what flows down each drop is a copy. When the words
  // say none may quietly be treated as the source of truth, a short bar closes the trunk, the one way every view would
  // take back up, and a point leaves the last view, runs up its drop and along the crossing row, and stops below the
  // bar; every view keeps its position, so the names keep one baseline. The source of truth stands on the words that
  // name it, at the position and size the next scene lifts its price from.
  const five = base * stageIn(t, views[0]);
  if (five > 0) {
    // The views stand centred under their source: the crossing row's middle meets the trunk, so its two arms are equal.
    // The row stands whole from the stage's first words, a rail that shows no direction, so the stage stands as wide as
    // it will be, about the centre, while each view takes its place on it on its own words: the Chinese names its views
    // late in its thought, after a long first sentence, so a row grown out to each view would leave the picture thin
    // there. The source keeps the frame's centre, where the next scene lifts its price from, so the price's flight keeps
    // its length. The English views stand 5 px left, as their last name is far the widest: the row's arms then differ by
    // 10 px in 1020 and the finished stage rests within 30 px of the centre.
    const xs = [450, 790, 1130, 1470].map((x) => x - L(0, 5)),
      sx = cx,
      sb = 360,
      bus = 410,
      iconTop = 480;
    const become = cue(s, "悄悄被当成", "quietly be treated as"),
      rootAt = cue(s, "权威来源", "source of truth");
    tableIcon(sx - 120, 210, 240, 150, { alpha: five * ramp(t, rootAt - 0.15, 0.4) });
    growName(t, [L("权威来源", "Source of truth")], [rootAt], sx - 120, 210 - NAME_GAP, {
      valign: "bottom",
      alpha: five,
    });
    const shown = views.map((at) => ramp(t, at - 0.15, 0.4) * five);
    // The trunk rises from the crossing row to the source as the source is named.
    link(sx, sb + 12, sx, bus, {
      alpha: five * ramp(t, Math.min(rootAt, become) - 0.15, 0.4),
      end: false,
    });
    // The crossing row is drawn 2.5 px wide, so it reads as lit structure on its own now that the copies on the drops
    // run in passes instead of standing on every drop at once.
    line(xs[0], bus, xs[3], bus, { color: P.line, alpha: five, width: 2.5 });
    const names = en
      ? ["Reports", "Catalogs", "Caches", "Agent summaries"]
      : ["报告", "数据目录", "缓存", "智能体的摘要"];
    views.forEach((at, i) => {
      const q = shown[i];
      if (q <= 0) return;
      const y = iconTop;
      // What flows down each drop is a copy; once the last view is about to be treated as the source, no copy leaves for
      // it again.
      link(xs[i], bus, xs[i], y - 10, {
        alpha: q,
        draw: { t, at: at + 0.15 },
        end: false,
        flowing: since(t, at + 0.45),
        last: i === 3 ? since(become + 0.05, at + 0.45) : Infinity,
      });
      // A derived view: a copy drawn over a dashed trace of its source.
      box(xs[i] - 34, y + 8, 72, 96, { stroke: P.line, alpha: q, radius: 4, dash: [5, 5] });
      documentIcon(xs[i] - 42, y, 72, 96, { alpha: q, rows: 3 });
      nameText(names[i], xs[i], y + 104 + NAME_GAP, {
        valign: "top",
        alpha: five * listIn(t, views, i),
        set: "views",
      });
    });
    const barY = (sb + 12 + bus) / 2;
    if (t >= become + 0.05) {
      // The point's way back: up the last drop, along the crossing row, and up the trunk to just below the bar.
      const way = [
        [xs[3], iconTop - 10],
        [xs[3], bus],
        [sx, bus],
        [sx, barY + 16],
      ];
      // The point grows at the foot of the drop and glides along the way back, settling below the bar.
      const legs = way.slice(1).map(([x, y], k) => Math.hypot(x - way[k][0], y - way[k][1])),
        total = legs.reduce((a, b) => a + b, 0);
      let left = glide(t, become + 0.05, total) * total,
        k = 0;
      while (k < legs.length - 1 && left > legs[k]) left -= legs[k++];
      const u = clamp(left / legs[k]),
        [x0, y0] = way[k],
        [x1, y1] = way[k + 1];
      dot(
        mix(x0, x1, u),
        mix(y0, y1, u),
        6 * clamp((voiceTime(t) - voiceTime(become + 0.05)) / 0.25),
        { color: P.unknown, alpha: shown[3] },
      );
    }
    line(sx - 24, barY, sx + 24, barY, {
      color: P.unknown,
      alpha: ramp(t, truth + 0.05, 0.3) * five,
      width: 4,
    });
  }
};

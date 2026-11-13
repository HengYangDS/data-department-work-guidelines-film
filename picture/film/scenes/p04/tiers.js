/* 04's risk sets the process: the three tiers down one spine of rising risk. */

import { ctx } from "../../canvas.js";
import { blend } from "../../drawing/colour.js";
import { since } from "../../drawing/flows.js";
import { mutedLevel } from "../../drawing/levels.js";
import { link } from "../../drawing/links.js";
import { box, labelSize, measure, stroke } from "../../drawing/strokes.js";
import { documentIcon } from "../../drawing/symbols.js";
import { listLevel, named, speaking } from "../../naming/lists.js";
import { NAME_GAP, nameText } from "../../naming/names.js";
import { growTexts } from "../../naming/parts.js";
import { CONTENT_CY, stackTops } from "../../naming/placement.js";
import { NOTE, TERM_STACK } from "../../naming/terms.js";
import { LABEL, P } from "../../palette.js";
import { L, en } from "../../timeline.js";
import { cue, cueFrom, cues } from "../../timing/cues.js";
import { mix, ramp, soon } from "../../timing/easing.js";
import { glide } from "../../timing/pace.js";
import { STAGE_CUT } from "../../timing/stages.js";
import { s04Groups, s04Grow, s04Height } from "./names.js";

/* Stage 3: the three tiers down one spine of rising risk, each a document of the size its risk calls for. */
export function s04Tiers(s, t, form, high, three) {
  const onceAt = cue(s, "一次讲清", "one clear exchange"),
    recordAt = cue(s, "现有的工作记录", "the existing work record");
  const needs = cues(s, [
    ["书面决定", "written decision"],
    ["明确授权", "explicit authorization"],
    ["回滚或降级预案", "a rollback or degradation path"],
    ["独立评审", "independent review"],
    ["最后由人验收", "human acceptance"],
  ]);
  // Chinese names the high-risk work before what it needs, English after; English counts its triggers from their
  // second mention, which defines high risk.
  const highFrom = en ? cue(s, "", "high risk means") : high;
  // The English high-risk work breaks only between its conditions, so each coordinated pair stands whole.
  const triggers = (
    en
      ? [
          "production",
          "funds",
          "sensitive data",
          "security or compliance",
          "deletion",
          "external commitments",
          "irreversible consequences",
        ]
      : ["生产", "资金", "敏感数据", "安全合规", "或者删除覆盖", "对外承诺", "后果不可逆"]
  ).map((w) => cueFrom(s, en ? "" : w, en ? w : "", highFrom));
  const lowAts = cues(s, [
    ["局部", "local"],
    ["可逆", "reversible"],
    ["不对外承诺", "no external commitment"],
  ]);
  const midAts = cues(s, [
    ["跨角色", "cross-role"],
    ["有几种方案", "or work with"],
    ["重大不确定", "or material uncertainty"],
  ]);
  // The record's rows are written on the words that name its contents, in both editions.
  const problemAt = cueFrom(s, "问题", "the problem", recordAt);
  const recordRows = [
    problemAt,
    cueFrom(s, "方案", "options", problemAt),
    cueFrom(s, "做法", "execution path", problemAt),
    cueFrom(s, "验收", "acceptance", problemAt),
  ];
  const onceRows = en
    ? [0, 1, 2].map((k) => onceAt + 0.2 + k * 0.3)
    : [cue(s, "结论", ""), cue(s, "依据", ""), cueFrom(s, "行动", "", onceAt)];
  const tiers = en
    ? [
        [
          ["One clear exchange"],
          [onceAt],
          ["Local", ", reversible work", " with no external commitment"],
          lowAts,
          onceRows,
        ],
        [
          [
            "The existing work record:",
            " the problem",
            ", options",
            ", execution path",
            " and acceptance",
          ],
          [recordAt, ...recordRows],
          [
            "Cross-role or extended work",
            ", or work with competing options",
            " or material uncertainty",
          ],
          midAts,
          recordRows,
        ],
        [
          [
            "Written decision",
            "Explicit authorization",
            "Rollback or degradation",
            "Independent review",
            "Human acceptance",
          ],
          needs,
          [
            "Production,",
            "funds,",
            "sensitive data,",
            "security or compliance,",
            "deletion or overwrite,",
            "external commitments",
            "or irreversible consequences",
          ],
          triggers,
          needs,
        ],
      ]
    : [
        [
          ["一次讲清", "结论", "、依据", "和行动"],
          [onceAt, ...onceRows],
          ["局部", "、可逆", "、不对外承诺的工作"],
          lowAts,
          onceRows,
        ],
        [
          ["在现有的工作记录里写清", "问题", "、方案", "、做法", "和验收"],
          [recordAt, ...recordRows],
          ["工作跨角色", "、周期长", "、有几种方案", "或者有重大不确定性"],
          [midAts[0], cue(s, "周期长", ""), midAts[1], cueFrom(s, "或者", "", midAts[1])],
          recordRows,
        ],
        [
          ["书面决定", "、明确授权", "、回滚或降级预案", "、独立评审", "，最后由人验收"],
          needs,
          [
            "涉及生产",
            "、资金",
            "、敏感数据",
            "、安全合规，",
            "或者删除覆盖",
            "、对外承诺",
            "、后果不可逆的事",
          ],
          triggers,
          needs,
        ],
      ];
  // Risk rises down one spine through the three documents; the work stands on its left, one spoken part to a line set
  // against the document, and the form it calls for on its right, so every row reads across and grows toward its mark.
  // Each side is set as a balanced block of a few lines, so the highest tier's requirements face the conditions that
  // call for them as two even blocks, and each document is large enough to read as its rung of the ladder.
  // The work column sets each condition as a block of even lines; the English column is narrower, so its blocks
  // balance the forms across the spine. In Chinese each tier's name, said in the list that opens the stage, heads its
  // work in ink at the label size; the first tier's work stands on one line; the middle tier's conditions stand as a
  // list of the two clauses they are said in, each on one line, 「或者」 opening the second, so the ladder shows at most
  // twelve names with the three tiers' names; and the high-risk work, the longest, is one block of three even lines,
  // each part joining it on its words, so no line of a block stands under
  // four fifths of its longest and no last line under three fifths. In English the first tier's work stands on one
  // line, which no break would keep even, and the middle tier's breaks before each "or". The high-risk work and
  // requirements keep the words they are said in. In English the seven conditions of high risk stand as one name, one
  // condition to a line, each joining it on its words, so the ladder still shows twelve names; no break of them keeps
  // an even block, a declared exception to the block rule. The five English requirements,
  // which no break keeps in a block's shape either, stand as a list, one name to a line. In Chinese they take two
  // lines in a 540 px column, the first through 「回滚或降级预案」 and the second from 「独立评审」: of their five
  // spoken parts no three lines keep a block's shape, since 「回滚或降级预案、」 alone is under four fifths of either
  // neighbour, so the block runs past the lower tiers' processes rather than breaking a part.
  // The Chinese work column is 360 px for the first and last tiers, which takes the first tier's fourteen characters on
  // one line and breaks the last tier's thirty-seven into lines of twelve, eleven and twelve; the middle tier's 380 px
  // holds its longer clause, 「工作跨角色、周期长、有几种方案」, on one line.
  const W = 600,
    QW = (i) => L([360, 380, 360][i], [620, 420, 600][i]),
    tw = (i) => (i === 2 ? L(540, 760) : W),
    docs = [
      [60, 76],
      [86, 110],
      [118, 152],
    ],
    GAP = 45 + 34;
  // The parts that begin each group of a tier's work, and each name of a tier's form: the English high-risk
  // requirements are five names, one to a line, and its work one name of seven lines.
  const groups = (i) => (!en && i === 1 ? [0, 3] : en && i === 2 ? [0, 1, 2, 3, 4, 5, 6] : [0]),
    forms = (i) => (en && i === 2 ? [0, 1, 2, 3, 4] : [0]);
  const workWhole = (i) => (en && i === 2 ? tiers[2][2].join(" ") : null);
  // The height of a Chinese tier's name over its work.
  const headH = en ? 0 : labelSize(LABEL) + TERM_STACK;
  // The spine stands where the ladder is balanced. Each tier's work reaches left of the spine and its form right of
  // it, and where a side holds no block yet the spine's own names and documents reach half their width. The ladder's
  // pictures follow the words: each tier's work and then its form, except the English high-risk tier, which says its
  // form first, and in Chinese, which lists the tiers before it speaks of each, the spine with its documents before
  // them. Through each of three stretches, before the first form is said, until the third tier's first block is whole
  // and after it, the ladder stands so that no picture of the stretch leans further one way than another leans the
  // other, so the first work never leans far while its form is still to come, and it glides to the next stretch's
  // place on the words that begin it: the first form's, and those of that block's last part, which leave the whole
  // ladder centred. In English, whose first work is one long line, the second stretch ends where the second form
  // begins instead, so the first work and its form stand centred while the second work joins them, and the ladder
  // with both forms stands centred from the second form's words to the end. The English spine stands alone only until the first work is said, too briefly to count. The next
  // stage re-forms in its cut, so the ladder need not end where that stage's middle document stands.
  const blockW = (parts, width, size, g = [0]) =>
    Math.max(
      ...s04Groups(parts, g).flatMap(([, v]) =>
        growTexts(v, width, size).map((line) =>
          line.reduce((sum, [, piece]) => sum + measure(piece, size), 0),
        ),
      ),
    );
  const lefts = tiers.map(([, , qual], i) => blockW(qual, QW(i), NOTE, groups(i))),
    rights = tiers.map(([term], i) => blockW(term, tw(i), LABEL, forms(i)));
  const head = L("要留多少记录、走多少手续", "The process"),
    foot = L("风险", "Risk");
  const axis = Math.max(measure(head) / 2, measure(foot) / 2, docs[2][0] / 2);
  const reach = (blocks, widths) =>
    blocks.length ? GAP + Math.max(...blocks.map((i) => widths[i])) : axis;
  // The offset from the spine of the centre of a picture holding the work of tiers `l` and the forms of tiers `r`, and
  // the place that centres a set of pictures so that none leans further one way than another leans the other.
  const lean = ([l, r]) => (reach(r, rights) - reach(l, lefts)) / 2;
  const centred = (pictures) =>
    -(Math.min(...pictures.map(lean)) + Math.max(...pictures.map(lean))) / 2;
  const workFirst = !en,
    third = workFirst ? triggers.at(-1) : needs.at(-1);
  const pictures = en
    ? [
        [[0], []],
        [[0], [0]],
        [[0, 1], [0]],
        [
          [0, 1],
          [0, 1],
        ],
        [
          [0, 1],
          [0, 1, 2],
        ],
        [
          [0, 1, 2],
          [0, 1, 2],
        ],
      ]
    : [
        [[], []],
        [[0], []],
        [[0], [0]],
        [[0, 1], [0]],
        [
          [0, 1],
          [0, 1],
        ],
        [
          [0, 1, 2],
          [0, 1],
        ],
        [
          [0, 1, 2],
          [0, 1, 2],
        ],
      ];
  const first = pictures.findIndex(([, r]) => r.length),
    last = pictures.length - 2,
    second = pictures.findIndex(([, r]) => r.length > 1);
  const [alone, built, whole] = [
    pictures.slice(0, first),
    pictures.slice(first, en ? second : last + 1),
    pictures.slice(en ? second : last),
  ].map(centred);
  const turn = en ? tiers[1][1][0] : third;
  // In Chinese the spine stands alone through a whole thought before the first work is said, so it stands centred
  // alone and moves on the work's words to centre the work with it; English says its first work at once.
  const lone = en ? alone : -lean(pictures[0]),
    joined = en ? alone : -lean(pictures[1]);
  const SX =
    960 +
    lone +
    (joined - lone) * glide(t, tiers[0][3][0] + 0.05, joined - lone) +
    (built - joined) * glide(t, tiers[0][1][0] + 0.05, built - joined) +
    (whole - built) * glide(t, turn + 0.05, whole - built);
  // Each tier is spoken in its own thought, which opens with its work in English and with its tier's name in Chinese.
  const tierAt = en
    ? tiers.map(([, , , qualAts], i) => (i < 2 ? qualAts[0] : cue(s, "", "high-risk work")))
    : [cue(s, "轻量档", ""), cue(s, "标准档", ""), cue(s, "高风险档", "")];
  const listedAt = en
    ? []
    : cues(s, [
        ["轻量", ""],
        ["标准", ""],
        ["高风险", ""],
      ]);
  // A Chinese tier's name stands on its form's first line and its work hangs below it, so the tier takes the height
  // that keeps both sides within it about the document.
  const heights = tiers.map(([term, , qual], i) => {
    const formH = s04Height(term, tw(i), LABEL, forms(i)),
      leftH = headH + s04Height(qual, QW(i), NOTE, groups(i));
    return Math.max(docs[i][1], formH, leftH, en ? 0 : 2 * leftH - formH);
  });
  const tops = stackTops(heights, CONTENT_CY - 20, 40),
    mids = tops.map((y, i) => y + heights[i] / 2),
    end = tops[2] + heights[2] + 24;
  // Risk rises down the spine through three levels; the stage's words name the spine above it. The spine stands whole
  // from the stage's cut, so the stage holds its structure from its first frame, and the point that travels down it
  // stands at full size on it from the cut, already entered, at the flow pace.
  const from = tops[0] - 24;
  link(SX, from, SX, end, { alpha: three, flowing: since(t, form + STAGE_CUT), lag: -0.12 });
  // In Chinese the thought opens by asking how much record and process the work needs; that question names the spine.
  // In English the process that risk sets names it, since the sentence that says so is a caption cue of its own.
  nameText(head, SX, from - NAME_GAP, { valign: "bottom", alpha: three * named(t, form) });
  nameText(foot, SX, end + NAME_GAP, {
    valign: "top",
    color: P.muted,
    alpha: three * named(t, cueFrom(s, "风险", "risk", form)),
  });
  tiers.forEach(([term, termAts, qual, qualAts, rowAts], i) => {
    // Chinese names the three tiers in one list before it speaks of each, so each tier's document stands on the spine
    // on its name there; English brings each document with the form its tier calls for.
    const docAt = en ? termAts[0] : Math.min(termAts[0], listedAt[i]);
    const [w, h] = docs[i],
      x = SX - w / 2,
      y = mids[i] - h / 2,
      q = three * ramp(t, docAt - 0.15, 0.4),
      lit = speaking(t, tierAt, i);
    // The document masks the spine behind it as it stands, so the spine runs unbroken until then.
    box(x, y, w, h, { fill: P.ground, alpha: q, radius: 4 });
    documentIcon(x, y, w, h, { alpha: q, rows: 0, stroke: blend(P.ink, P.evidence, lit) });
    // Its rows are written in turn as one hand's lines, one stroke, so the document stays one mark rather than
    // repeated rows each waiting for a name of its own.
    stroke(
      () =>
        rowAts.forEach((at, k) => {
          const ry = y + h * (0.3 + (k * 0.55) / rowAts.length),
            x0 = x + w * 0.14,
            x1 = x + w * (k % 2 ? 0.62 : 0.82),
            drawn = soon(t, at - 0.1, 0.5);
          if (drawn > 0.01) {
            ctx.moveTo(x0, ry);
            ctx.lineTo(mix(x0, x1, drawn), ry);
          }
        }),
      { color: P.muted, alpha: q, width: 2 },
    );
    const level = three * listLevel(t, tierAt, i);
    // In Chinese the tier's name heads its work, from its words in the list that opens the stage, on the baseline of
    // its form's first line, so the two read as one row across the spine; the work hangs below the name.
    const workH = s04Height(qual, QW(i), NOTE, groups(i)),
      headY = mids[i] - s04Height(term, tw(i), LABEL, forms(i)) / 2 + labelSize(LABEL) / 2;
    if (!en)
      nameText(["轻量", "标准", "高风险"][i], SX - GAP, headY, {
        align: "right",
        alpha: level * named(t, listedAt[i]),
        set: "forms",
      });
    // The work and the form it calls for build part by part on their words; the English high-risk requirements stand
    // as a list, one name to a line.
    s04Grow(
      t,
      qual,
      qualAts,
      SX - GAP,
      en ? mids[i] : headY + labelSize(LABEL) / 2 + TERM_STACK + workH / 2,
      {
        width: QW(i),
        size: NOTE,
        color: P.muted,
        align: "right",
        alpha: mutedLevel(level),
        set: "forms",
        groups: groups(i),
        build: true,
        whole: workWhole(i),
      },
    );
    s04Grow(t, term, termAts, SX + GAP, mids[i], {
      width: tw(i),
      alpha: level,
      set: "forms",
      groups: forms(i),
      build: true,
    });
  });
}

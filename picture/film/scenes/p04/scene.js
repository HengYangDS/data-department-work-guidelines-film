/* 04 purpose: four boundaries, form follows risk. The scene: its cues and the cuts between its stages, each stage on
 * the words that name it. */

import { ctx } from "../../canvas.js";
import { line, measure, stroke } from "../../drawing/strokes.js";
import { opening } from "../../framing/chapters.js";
import { named, saidShare, speaking } from "../../naming/lists.js";
import { NAME_GAP, nameText } from "../../naming/names.js";
import { growTexts } from "../../naming/parts.js";
import { NOTE } from "../../naming/terms.js";
import { P } from "../../palette.js";
import { L, en } from "../../timeline.js";
import { cues } from "../../timing/cues.js";
import { mix, soon } from "../../timing/easing.js";
import { glide, glideTime } from "../../timing/pace.js";
import { thoughtJoins } from "../../timing/pauses.js";
import { stageIn, stageOut } from "../../timing/stages.js";
import { scenes } from "../registry.js";
import { s04Boundaries, s04Duties, s04Escalation } from "./boundaries.js";
import { s04Tiers } from "./tiers.js";

scenes["04"] = function (s, t) {
  const [four, truth, bounds, owner, done, inside, near, breach, form, high, duty] = cues(s, [
    ["四条底线", "four boundaries"],
    ["说真话", "tell the truth"],
    ["守边界", "stay in bounds"],
    ["责任落到人", "name the owner"],
    ["不虚报完成", "do not claim false completion"],
    ["在这四条底线之内", "inside these boundaries"],
    ["会越线时", "would cross one"],
    ["已经越线", "after a breach"],
    ["要留多少记录", "risk sets the process"],
    ["涉及生产", "production funds"],
    ["不论风险高低", "whatever the risk"],
  ]);
  // The field the four boundaries enclose stands through the first two stages; its sides run clockwise from the top, one
  // for each boundary. While the four are only counted it stands centred; from the first boundary's thought it glides
  // with its name to its place at the left, and the first boundary's row comes in beside it as the field clears it.
  // The column beside the field: the four boundaries in the first stage and the three cases in the second, each a key
  // term with, under it, what it rules out or covers in its key words. Each column is set narrow enough that its rows'
  // blocks are about one width, so it builds as one block.
  const boundaryRows = en
    ? [
        [
          "Tell the truth",
          ["no fabrication", ", hiding", ", cherry-picking", " or false certainty"],
        ],
        [
          "Stay in bounds",
          [
            "subject and time",
            ", professional competence",
            " and permission",
            ", data, security, compliance",
            " and action",
          ],
        ],
        [
          "Name the owner",
          ["every important judgment", ", decision", ", change", " and acceptance"],
        ],
        [
          "Do not claim false completion",
          [
            "without current evidence",
            " matching the claim",
            ", call nothing complete",
            ", correct",
            ", usable",
            " or adopted",
          ],
        ],
      ]
    : [
        ["说真话", ["不编造", "、不隐瞒", "、不挑着说", "、没把握的不说成有把握"]],
        ["守边界", ["对象和时间", "、专业能力和权限", "，数据、安全、合规", "和行动的界限"]],
        ["责任落到人", ["重要的判断", "、决定", "、变更", "和验收", "，都有人负责"]],
        [
          "不虚报完成",
          ["说做完了", "、做对了", "、能用了", "、有人在用", "，都要有当前的、对得上的证据"],
        ],
      ];
  const caseRows = en
    ? [
        ["Inside these boundaries", ["autonomy", ", exploration", ", creative work"]],
        ["When an action would cross one", ["stop", ", make it visible", ", escalate"]],
        [
          "After a breach",
          ["stop", ", disclose", ", correct within authority", ", escalate by risk"],
        ],
      ]
    : [
        ["底线之内", ["欢迎自主", "、探索", "和创造"]],
        ["会越线", ["停下来", "，讲出来", "，并上报"]],
        ["已经越线", ["就停下受影响的事", "，如实说明", "，在权限内纠正", "，并按风险上报"]],
      ];
  // The Chinese cases are named by their key words, 底线之内, 会越线 and 已经越线, so no case row repeats its spoken
  // clause whole; they are the narrower column, so it stands nearer the field. The English columns take a qualifier of
  // up to 620 px on one line, since none of their two-line breaks would stand even.
  const W1 = L(480, 620),
    W2 = L(360, 620),
    LX1 = 840,
    LX2 = L(900, 940);
  // The field and its column stand centred between the column's first picture and its whole one: in the first stage the
  // first boundary alone and all four, in the second the cases before the breach and all three (in English, whose last
  // gloss, on one line, is far the widest, the first two alone, moving on the breach's words to all three). So each stage leans no
  // further one way while its column builds than the other way once it is built; the field and the column move together
  // to the second stage's place on the words that open it. Places are reckoned from the field's left edge.
  const rowW = ([term, qual], W) =>
    Math.max(
      measure(term),
      ...growTexts(qual, W, NOTE).map((line) =>
        line.reduce((sum, [, v]) => sum + measure(v, NOTE), 0),
      ),
    );
  const place = (LX, widths, built) =>
    960 - (290 + LX + (Math.max(...widths.slice(0, built)) + Math.max(...widths)) / 2) / 2;
  const caseW = caseRows.map((v) => rowW(v, W2));
  const ox =
    mix(
      place(
        LX1,
        boundaryRows.map((v) => rowW(v, W1)),
        1,
      ),
      L(place(LX2, caseW, 2), place(LX2, caseW.slice(0, 2), 2)),
      soon(t, inside + 0.05, 0.55),
    ) +
    L(0, place(LX2, caseW, 3) - place(LX2, caseW.slice(0, 2), 2)) * soon(t, breach + 0.05, 0.55);
  const formed = stageIn(t, truth);
  // The glide sets off on the first word of the first boundary's thought, over the field's whole way, and the first
  // row's key and words wait until the field's right side has passed them.
  const go =
    Math.max(...thoughtJoins.map(([, next]) => next).filter((v) => v <= truth + 1e-6)) + 0.05;
  const way =
      735 -
      290 -
      place(
        LX1,
        boundaryRows.map((v) => rowW(v, W1)),
        1,
      ),
    clear = go + 0.85 * glideTime(way);
  const FX = mix(735, 290 + ox, glide(t, go, way)),
    FY = 275,
    FS = 450,
    corner = [
      [FX, FY],
      [FX + FS, FY],
      [FX + FS, FY + FS],
      [FX, FY + FS],
    ];
  const starts = [truth, bounds, owner, done],
    field = stageOut(t, form);
  // What each boundary rules out or covers, part by part as it is said.
  const said = en
    ? [
        cues(s, [
          ["", "no fabrication"],
          ["", "no hiding"],
          ["", "no cherry-picking"],
          ["", "no uncertainty"],
        ]),
        cues(s, [
          ["", "subject and time"],
          ["", "professional competence and permission"],
          ["", "data security compliance"],
          ["", "and action"],
        ]),
        cues(s, [
          ["", "every important"],
          ["", "decision"],
          ["", "change"],
          ["", "acceptance"],
        ]),
        cues(s, [
          ["", "without current evidence"],
          ["", "matching the claim"],
          ["", "call nothing complete"],
          ["", "correct"],
          ["", "usable"],
          ["", "or adopted"],
        ]),
      ]
    : [
        cues(s, [
          ["不编造", ""],
          ["不隐瞒", ""],
          ["不挑着说", ""],
          ["没把握的", ""],
        ]),
        cues(s, [
          ["对象和时间", ""],
          ["专业能力和权限", ""],
          ["数据安全合规", ""],
          ["行动的界限", ""],
        ]),
        cues(s, [
          ["重要的", ""],
          ["决定", ""],
          ["变更", ""],
          ["验收", ""],
          ["有人负责", ""],
        ]),
        cues(s, [
          ["说做完了", ""],
          ["做对了", ""],
          ["能用了", ""],
          ["有人在用", ""],
          ["都要有当前的", ""],
        ]),
      ];
  // Each boundary is drawn from what it covers: its side turns gold one step per part as the part is said, the English
  // last boundary stepping on each claim it withholds too, so the field closes as the four are spelled out.
  const steps = said;
  const gold = (j) => saidShare(t, steps[j]);
  // On "four boundaries" the four sides are counted in one after another at the structure tier; each side lights while
  // its line is spoken and turns gold as its parts are said, keeping the colour once named.
  // While only counted the square is drawn as two strokes that meet at its corners, its horizontal and its vertical
  // sides, read as one field under its name. From the first boundary's cut its settled sides are one stroke and the
  // gold of the sides already whole another, so the field stays one mark under its name rather than four repeated sides
  // each waiting for a name of its own; the side being spoken, drawn wider, and a side still turning gold stand on their
  // own, so each change is drawn where it is seen.
  const counted = (j) => soon(t, Math.min(four - 0.1, opening(s) + 0.3) + j * 0.25, 0.5);
  const sideTo = (j, q) => {
    const [x1, y1] = corner[j],
      [x2, y2] = corner[(j + 1) % 4];
    return [x1, y1, mix(x1, x2, q), mix(y1, y2, q)];
  };
  const sides = (share, keep, o) =>
    stroke(
      () =>
        corner.forEach((_, j) => {
          const q = share(j);
          if (keep(j) && q > 0.01) {
            const [x1, y1, x2, y2] = sideTo(j, q);
            ctx.moveTo(x1, y1);
            ctx.lineTo(x2, y2);
          }
        }),
      { alpha: field, width: 4, ...o },
    );
  if (!formed) [0, 1].forEach((k) => sides(counted, (j) => j % 2 === k, { color: P.line }));
  else {
    const lits = corner.map((_, j) => speaking(t, starts, j)),
      golds = corner.map((_, j) => gold(j)),
      quiet = (j) => lits[j] <= 0;
    sides(counted, quiet, { color: P.line });
    sides(gold, (j) => quiet(j) && golds[j] >= 1, { color: P.authority });
    corner.forEach((_, j) => {
      const width = 4 + 2 * lits[j];
      if (!quiet(j)) line(...sideTo(j, counted(j)), { color: P.line, alpha: field, width });
      if (golds[j] > 0 && (!quiet(j) || golds[j] < 1))
        line(...sideTo(j, golds[j]), { color: P.authority, alpha: field, width });
    });
  }
  // 1. The four boundaries build into one column beside the field, each a key term and, smaller, what it rules out or
  // covers in its key words. Each row's mark is the field in small with that boundary's own side drawn as a solid gold
  // edge, standing with its boundary's words.
  const one = stageOut(t, inside);
  if (one > 0) s04Boundaries(t, truth, boundaryRows, W1, LX1, ox, clear, starts, said, one);
  nameText(L("四条底线", "Four boundaries"), FX, FY - NAME_GAP, {
    align: "left",
    valign: "bottom",
    alpha: field * named(t, four),
  });
  // 2. Inside the four lines work moves freely. An action about to cross one halts short of its side, is made
  // visible and is escalated to the owner who stands in the field; an action that has crossed stops outside, is
  // disclosed, is brought back within authority and is escalated as the risk requires. The column beside the field names
  // the three cases, each part on its own words, and the case being spoken lights its mark.
  const two = stageIn(t, inside) * field;
  if (two > 0) s04Escalation(s, t, inside, near, breach, caseRows, W2, LX2, ox, FX, FY, FS, two);
  // 3. Risk sets the process: the three tiers build down one spine of rising risk, named by the words that open the
  // stage, one tier to each thought. Each tier is a document of the size its risk calls for, the work it serves on its
  // left, smaller and muted, and the process itself on its right, each side named by its key words in a block of a few
  // lines that stands on its words, the high-risk work in the two groups it is said in; each document stands on the
  // words that name its process, and its rows are written as its contents are named.
  const three = stageIn(t, form) * stageOut(t, duty);
  if (three > 0) s04Tiers(s, t, form, high, three);
  // 4. Whatever the risk, every duty still applies: the three tiers stand side by side in one row, each inside the same
  // field of four lines. The documents keep the sizes their risk gave them and light as the risk is named; the four
  // sides of every field draw on in the cut and light when the duty is named.
  const four4 = stageIn(t, duty);
  if (four4 > 0) s04Duties(s, t, duty, four4);
};

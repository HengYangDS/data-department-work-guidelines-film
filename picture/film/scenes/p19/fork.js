/* 19's closing stage: the fork that missing context puts in the Agent's work. */

import { since } from "../../drawing/flows.js";
import { link } from "../../drawing/links.js";
import { s17Page } from "../../drawing/pages.js";
import { box, labelSize, measure, text } from "../../drawing/strokes.js";
import { agent, person, ring, stopSign } from "../../drawing/symbols.js";
import { beats, listLevel, named } from "../../naming/lists.js";
import { LEADING, NAME_GAP, nameText } from "../../naming/names.js";
import { blockHeight, growName } from "../../naming/parts.js";
import { CONTENT_CY, stackTops } from "../../naming/placement.js";
import { NOTE, TERM_GAP, TERM_STACK, termRow, termRowLayout } from "../../naming/terms.js";
import { LABEL, P } from "../../palette.js";
import { L, en } from "../../timeline.js";
import { cue, cueFrom } from "../../timing/cues.js";
import { mix, ramp } from "../../timing/easing.js";
import { glide } from "../../timing/pace.js";
import { s19Lines } from "./boundary.js";

/* Stage 9: the tree from the Agent, which proceeds on stated assumptions or stops and asks. */
export function s19MissingContext(s, t, em, ACTOR, snap, gap, g9) {
  const ask = cue(s, "停下来问", "stops and asks"),
    assume = cue(s, "写明合理的假定", "proceeds on reasonable"),
    onward = cue(s, "接着做", "proceeds on reasonable");
  const fine = cue(s, "不影响", "does not materially"),
    first = cue(s, "要处理的对象", "target");
  // Each condition: its words (a term, or the members of a list) and the words that bring each, its qualifier and the
  // words that bring it, whether it stops the Agent, and the words its ring beats on. The English says authority
  // earlier in the scene, so the list reads it from its first member on.
  const parts = (list) => list.map(([zh, english]) => cue(s, zh, english));
  const proceeds = en
    ? [
        ["Does not materially affect"],
        [fine],
        ["direction, safety or authority"],
        fine,
        false,
        parts([
          ["", "direction"],
          ["", "safety"],
          ["", "or authority"],
        ]),
      ]
    : [
        ["不影响"],
        [fine],
        ["方向、安全和权限"],
        fine,
        false,
        [cue(s, "方向", ""), cue(s, "安全", ""), cueFrom(s, "和权限", "", cue(s, "安全", ""))],
      ];
  const members = [
    first,
    cue(s, "事实依据", "fact source"),
    cue(s, "负责人", "responsible person"),
    cueFrom(s, "权限", "authority", first),
    cue(s, "后果是否可逆", "or an irreversible"),
  ];
  const stops = [
    en
      ? [
          "Target",
          ", fact source",
          ", responsible person",
          ", authority",
          " or an irreversible consequence",
        ]
      : ["要处理的对象", "、事实依据", "、负责人", "、权限", "、后果是否可逆"],
    members,
    [L("有一样说不清", "is unclear")],
    cue(s, "有一样说不清", "is unclear"),
    true,
    members.slice(1),
  ];
  const rows = en ? [proceeds, stops] : [stops, proceeds];
  const outB = L("停下来问", "Stops and asks");
  // The member stays where the last stage left them. While the first condition builds, the fork stands S1 px right of
  // its place beside the member, on the first outcome it moves to S2 px from that place, and on the second to S3 px:
  // the Chinese second outcome's name is long, so the finished tree stands centred only once the fork has moved again. The English S1 is taken
  // from the full-size draft, whose Latin lines run narrower than the headless estimate. The English column takes what
  // may be unclear on two even lines, each ending on a whole member, so there the fork ends 20 px left of its place,
  // its branches turn nearer the Agent and its outcomes stand nearer their conditions, and the finished tree stays
  // about the centre. The first condition stands far enough right that it and the member stand within 40 px of the
  // centre while it builds.
  const [S1, S2, S3] = en ? [378, -20, -20] : [380, 90, 0];
  const fork =
    mix(S1, S2, glide(t, (en ? assume : ask) + 0.05, S1 - S2)) +
    (S3 - S2) * glide(t, (en ? ask : assume) + 0.05, S3 - S2);
  const CW = en ? 560 : 480,
    mx = 450,
    rx = mx + 150 + fork,
    cx0 = rx + L(130, 116);
  // Each condition's block: the list's lines, the block's height and width, and the width of its first line, where its
  // outcome's run leaves.
  const lineW = (line) => line.reduce((w, [, v]) => w + measure(v), 0);
  const blocks = rows.map(([term, , qual, , stop]) => {
    if (stop) {
      const lines = s19Lines(term, CW),
        widths = lines.map(lineW);
      return {
        lines,
        height: blockHeight(lines.length) + TERM_STACK + blockHeight(1, NOTE),
        width: Math.max(...widths, measure(qual.join(""), NOTE)),
        head: widths[0],
      };
    }
    // Both conditions set their qualifiers the same way, under them: the list's must stand under its lines.
    const { one, height } = termRowLayout(term, qual, CW, false),
      head = measure(term.join(""), LABEL),
      note = measure(qual.join(""), NOTE);
    return {
      height,
      width: one ? head + TERM_GAP + note : Math.max(head, note),
      head: one ? head + TERM_GAP + note : head,
    };
  });
  const colW = Math.max(...blocks.map((v) => v.width)),
    ox = cx0 + colW + L(70, 60);
  // The Chinese opens on its list building alone at the top of the fork, so there the branches stand further apart
  // and the opening fills the frame; the English opens on proceeding, which a wider fork would raise level with the
  // open question's name, so it keeps the usual gap.
  const tops0 = stackTops(
    blocks.map((v) => v.height),
    CONTENT_CY,
    en ? 150 : 250,
  );
  const drop = snap(
    tops0.flatMap((top, r) =>
      Array.from(
        { length: blocks[r].lines?.length ?? 1 },
        (_, k) => top + em / 2 + k * em * LEADING,
      ),
    ),
  );
  const tops = tops0.map((top) => top + drop),
    ys = tops.map((top) => top + labelSize(LABEL) / 2);
  person(mx, 506, { alpha: g9, color: P.authority, size: 1.7 });
  nameText(L("成员", "Member"), mx, 506 + 38 + NAME_GAP, {
    valign: "top",
    color: P.authority,
    alpha: g9,
  });
  link(mx + 40, 500, rx - 40, 500, { alpha: g9 });
  agent(rx, 500, { alpha: g9, size: 1.8 });
  nameText(L("智能体", "Agent"), rx, ACTOR, {
    valign: "top",
    color: P.evidence,
    alpha: g9 * named(t, cueFrom(s, "智能体", "the agent", gap)),
  });
  // The open question: an empty, dashed outline above the Agent with a question in it, named on its words in English.
  // It stands high enough that its English name clears the first condition's mark and the ring that beats round it.
  const QY = 310;
  box(rx - 30, QY, 60, 76, { stroke: P.unknown, alpha: g9, radius: 8, dash: [6, 6] });
  text("?", rx, QY + 38, 30, { role: "mark", align: "center", color: P.unknown, alpha: g9 });
  if (en)
    nameText("Missing context", rx, QY - NAME_GAP, {
      valign: "bottom",
      alpha: g9 * named(t, gap),
    });
  rows.forEach(([term, termAts, qual, qualAt, stop, partAts], r) => {
    const y = ys[r],
      begin = Math.min(termAts[0], qualAt),
      q = ramp(t, begin - 0.15, 0.4) * g9,
      mark = cx0 - 14 - NAME_GAP;
    link(rx + 40, 500, mark - 18, y, { route: "hvh", mid: cx0 - 50, alpha: q * 0.8, end: false });
    ring(mark, y, 14, { color: stop ? P.unknown : P.evidence, alpha: q, width: 2.5 });
    beats(t, mark, y, 22, partAts, { color: stop ? P.unknown : P.evidence, alpha: g9 });
    if (stop) {
      // Each member at its place in the block, a separator it hangs at the end of the line before with it, on its own
      // words and at its level in the list; the qualifier on the line below, on its own words. The list and its
      // qualifier are one name, as a term row's term and qualifier are, so its members are read as the parts of one
      // name, not as names of their own.
      const whole = [...term, ...qual].join(" ");
      blocks[r].lines.forEach((line, k) => {
        let left = cx0;
        line.forEach(([i, v]) => {
          growName(t, [v], [termAts[i]], left, tops[r] + k * labelSize(LABEL) * LEADING, {
            alpha: g9 * listLevel(t, termAts, i),
            whole,
            set: "context",
          });
          left += measure(v);
        });
      });
      growName(t, qual, [qualAt], cx0, tops[r] + blockHeight(blocks[r].lines.length) + TERM_STACK, {
        size: NOTE,
        color: P.muted,
        alpha: g9,
        whole,
        set: "context",
      });
    } else
      termRow(
        t,
        term,
        term.map(() => termAts[0]),
        qual,
        qual.map(() => qualAt),
        cx0,
        tops[r],
        { width: CW, inline: false, alpha: g9, set: "context" },
      );
    // The outcome: a straight run from its condition's first line to its mark, drawn on the outcome's words.
    const at = stop ? ask : assume,
      go = { t, at: at - 0.1 },
      on = ramp(t, at - 0.15, 0.4) * g9;
    link(cx0 + blocks[r].head + 20, y, ox - 30, y, {
      color: stop ? P.unknown : P.evidence,
      alpha: on,
      draw: go,
      flowing: stop ? null : since(t, Math.max(onward + 0.2, at + 0.4)),
    });
    if (stop) stopSign(ox, y, 18, { alpha: on });
    else s17Page(ox - 14, y - 18, 28, 36, { alpha: on, rows: 2, stroke: P.evidence });
    if (stop)
      nameText(outB, en ? ox - 18 : ox + 24 + NAME_GAP, en ? y + 18 + NAME_GAP : y, {
        align: "left",
        valign: en ? "top" : "middle",
        color: P.authority,
        alpha: g9 * named(t, ask),
      });
    // The English outcome stands whole on one line and on its own words, when the fork has come to its place; both
    // English outcomes are named under their marks on one left edge, so the finished tree stands about the centre.
    else
      growName(
        t,
        en ? ["Stated", " assumptions"] : ["写明合理的假定", "，接着做"],
        en
          ? [cue(s, "", "stated assumptions"), cue(s, "", "stated assumptions")]
          : [assume, onward],
        en ? ox - 18 : ox + 24 + NAME_GAP,
        en ? y + 18 + NAME_GAP : y - labelSize(LABEL) / 2,
        { width: en ? 340 : 1810 - ox - 24 - NAME_GAP, color: P.evidence, alpha: g9 },
      );
  });
}

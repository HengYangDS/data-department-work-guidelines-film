/* 22 human-agent: stop and hand off. The scene: its cues and the cuts between its stages, each stage on the words that
 * name it. */

import { flowDot, loopPhase, since } from "../../drawing/flows.js";
import { restMark } from "../../drawing/levels.js";
import { link } from "../../drawing/links.js";
import { box, dot, line, path, text } from "../../drawing/strokes.js";
import {
  agent,
  check,
  clock,
  cross,
  documentIcon,
  lock,
  person,
  ring,
  seal,
} from "../../drawing/symbols.js";
import { opening } from "../../framing/chapters.js";
import { NAME_GAP, nameText } from "../../naming/names.js";
import { P } from "../../palette.js";
import { L, en } from "../../timeline.js";
import { cue, cueFrom, cues } from "../../timing/cues.js";
import { mix, ramp, soon, standard } from "../../timing/easing.js";
import { voiceTime } from "../../timing/pauses.js";
import { stageIn, stageOut } from "../../timing/stages.js";
import { scenes } from "../registry.js";
import { s22Escalation } from "./escalation.js";
import { s22Records } from "./records.js";

scenes["22"] = function (s, t) {
  // The words that stop the Agent and send the escalation up. Both editions name five kinds of situation once and then
  // number them across two thoughts, kinds one and two in the first and three to five in the next.
  const [stopAt, escalate] = cues(s, [
    ["要停下受影响的事", "stop"],
    ["上报", "escalate"],
  ]);
  const independent = cue(s, "已授权的工作", "independent authorized work");
  const [handoff, ...told] = en
    ? cues(s, [
        ["", "a completion report names"],
        ["", "the work"],
        ["", "the delivery state"],
        ["", "the evidence"],
        ["", "the limits"],
        ["", "any acceptance"],
      ])
    : cues(s, [
        ["汇报完成时", ""],
        ["做到了哪一步", ""],
        ["做了什么", ""],
        ["怎么核验的", ""],
        ["还有哪些限度", ""],
        ["还要谁验收", ""],
      ]);
  // What an interruption keeps is read from the interruption on: 22.2 also names uncommitted work.
  const interrupt = cue(s, "中途停下", "on interruption");
  const kept = [
    ["保留现场", "preserve the state"],
    ["没提交的改动", "uncommitted work"],
    ["试过和失败", "attempts and failures"],
    ["从哪里接着做", "where to resume"],
  ].map(([zh, english]) => cueFrom(s, zh, english, interrupt));
  const base = ramp(t, opening(s), 0.7);
  // 1. Stop and escalate, in five kinds of situation, all five on one way, the course of action the kinds stop. A member
  // and an Agent head the way together under one name, as the five bind members and Agents alike, and the person the
  // escalation reaches stands above the way from the first escalation. Each kind is a station on the way: its stop sign stands on a short post over the way, so the sign and
  // its post read as one station, its escalation rises from the sign to the person, and what the kind holds shows
  // beneath the way under its name, each part drawn on its own words. The first sign stands on the words that stop the
  // Agent and is named there; its escalation rises on "escalate", and every later sign and its escalation arrive with
  // the name of their kind. Kind one stacks its two conditions in its column, the conflict over what cannot be
  // identified; kind two stands its first two, too little authority and a boundary the action would cross, side by
  // side over its third, an irreversible step without authorization or recovery, in the order spoken; the one condition
  // of each other kind hangs just above its name, so the name reaches every part of it as it comes. The five build as one list
  // across the two thoughts that number them and stand whole together until the handoff is named, while independent
  // authorized work keeps moving on its own lane below them; they are named as a group on the words that announce them,
  // left of their names and a word space and more clear of the first. The stations stand at one pitch along the way, so
  // the five signs, columns and names keep an even rhythm whatever each holds. Each kind is
  // named by the key phrase that opens it: in Chinese the names the words give kinds one and two ("说不清", "权限不够")
  // and for the others the condition each opens with, each station standing on the word that numbers its kind; in
  // English, where each number is a clause of its own, each station stands on the words after its number, which open
  // its condition, so the English kind two is named "Authority is insufficient", as the Chinese names it 权限不够. Where
  // those words alone lose the clause that gives them their sense, the English name keeps that sense in a short phrase:
  // kind three is "Unrecognized work" and kind five "Continuing would harm", as the Chinese kind five is 再做下去有害.
  // The English names stand whole, each on one line, so each keeps its subject and predicate together: the rail is too
  // dense for them on one baseline, so they stand on two at its one pitch, every other name a row lower on a short stem.
  const names = en
    ? [
        ["Instructions materially conflict"],
        ["Authority is insufficient"],
        ["Unrecognized work"],
        ["Contradicts expectation"],
        ["Continuing would harm"],
      ]
    : ["说不清", "权限不够", "来历不明", "核验和预期相反", "再做下去有害"];
  const nameAts = cues(
    s,
    en
      ? [
          ["", "instructions materially conflict"],
          ["", "authority is insufficient"],
          ["", "you find unrecognized work"],
          ["", "verification contradicts"],
          ["", "continuing would"],
        ]
      : [
          ["一是", ""],
          ["二是", ""],
          ["三是", ""],
          ["四是", ""],
          ["五是", ""],
        ],
  );
  const WY = 520,
    SY = 480,
    SR = 22,
    BUS = 360,
    GY = 632,
    PAIR = 48,
    ONE = 34,
    NY = 744,
    PX = 960,
    OY = 280,
    AX = 230,
    LANE = 852;
  // What each condition is, beneath its station, each part drawn on its own words.
  const said = (g, zh, english, lead = 0.15) => ramp(t, cue(s, zh, english) - lead, 0.4) * g;
  const glyphs = [
    // Two instructions that cannot both hold.
    (x, y, g) => {
      const q = said(g, "指令有实质冲突", "instructions materially conflict");
      documentIcon(x - 70, y - 30, 44, 58, { alpha: q, rows: 3 });
      documentIcon(x + 26, y - 30, 44, 58, { alpha: q, rows: 3 });
      text("≠", x, y + 1, 30, {
        role: "mark",
        align: "center",
        color: P.unknown,
        alpha: said(g, "冲突", "conflict"),
      });
    },
    // The target, the fact source and the responsible person, each on its own words, and each marked unknown as it
    // is said not to be identifiable: in English, which names them first, the marks on the words that say so, and in
    // Chinese, which says so first, each mark with its own name, the target on the words that say it cannot be
    // determined.
    (x, y, g) => {
      const [aim, basis, who] = en
        ? [said(g, "", "the target"), said(g, "", "fact source"), said(g, "", "responsible person")]
        : [said(g, "确定不了要处理的对象", ""), said(g, "事实依据", ""), said(g, "负责人", "")];
      const unknown = en ? ramp(t, cue(s, "", "can't be identified") - 0.15, 0.4) : 1;
      ring(x - 56, y + 8, 20, { color: P.ink, alpha: aim, width: 2.5 });
      dot(x - 56, y + 8, 5, { color: P.ink, alpha: aim });
      box(x - 17, y - 14, 34, 44, {
        fill: P.row,
        stroke: P.ink,
        alpha: basis,
        radius: 4,
        width: 2,
      });
      // The source's two lines of text are short details of its mark, not ruled rows of a list.
      [y - 2, y + 10].forEach((ry, i) =>
        line(x - 7, ry, x + (i ? 3 : 7), ry, { color: P.muted, alpha: basis, width: 2 }),
      );
      person(x + 56, y + 16, { size: 0.8, alpha: who });
      [
        [x - 56, aim],
        [x, basis],
        [x + 56, who],
      ].forEach(([qx, q]) =>
        text("?", qx, y - 38, 26, {
          role: "mark",
          align: "center",
          color: P.unknown,
          alpha: q * unknown,
        }),
      );
    },
    // Authority that does not reach.
    (x, y, g) =>
      lock(x, y + 6, { alpha: said(g, "权限不够", "authority is insufficient"), size: 1.1 }),
    // An action that would cross a permission, compliance, security or data boundary: the action's way reaches the
    // boundary, which stands in the colour 04 gives the boundaries, and the stretch beyond it, where the action would
    // go, draws on dashed in the unknown colour, after it, as the boundary is named.
    (x, y, g) => {
      const at = cue(s, "越过权限", "cross a permission"),
        q = said(g, "越过权限", "cross a permission");
      line(x, y - 24, x, y + 24, { color: P.authority, alpha: q, width: 4 });
      link(x - 46, y, x - 12, y, {
        color: P.ink,
        alpha: q,
        width: 3,
        draw: { t, at: at + 0.05 },
        end: false,
      });
      link(x + 12, y, x + 44, y, {
        color: P.unknown,
        alpha: q,
        width: 2.5,
        dash: [5, 5],
        draw: { t, at: at + 0.3 },
      });
    },
    // A step that cannot be taken back: the authorization it lacks is an empty seal, and the recovery it lacks is the
    // recovery path's turn, drawn dashed and crossed.
    (x, y, g) => {
      const q = said(g, "不可逆的操作", "irreversible step");
      path(
        [
          [x - 78, y - 22],
          [x - 40, y - 22],
          [x - 40, y + 22],
          [x - 6, y + 22],
        ],
        { color: P.ink, alpha: q, width: 3 },
      );
      dot(x - 6, y + 22, 5, { color: P.ink, alpha: q });
      seal(x + 40, y - 20, 16, { alpha: said(g, "缺授权", "lacks authorization"), hollow: true });
      const back = said(g, "恢复办法", "recovery");
      path(
        [
          [x + 64, y + 10],
          [x + 18, y + 10],
          [x + 18, y + 38],
          [x + 58, y + 38],
        ],
        { color: P.muted, alpha: back, width: 2, dash: [5, 5] },
      );
      dot(x + 60, y + 38, 4, { color: P.muted, alpha: back });
      cross(x + 40, y + 24, 14, { alpha: back, width: 3 });
    },
    // Work of unknown origin, someone else's uncommitted work, and work whose owner is unknown, each on its words, laid
    // over the one before as a fanned stack of three different sheets, so the three read as one mark that the kind's
    // name names.
    (x, y, g) => {
      const q = said(g, "来历不明", "you find unrecognized work"),
        other = said(g, "别人还没提交", "someone else"),
        owner = said(g, "归属不明", "owner is unknown");
      documentIcon(x - 54, y - 26, 38, 50, { alpha: q, rows: 0 });
      text("?", x - 39, y + 2, 26, { role: "mark", align: "center", color: P.unknown, alpha: q });
      box(x - 22, y - 20, 46, 40, {
        fill: P.row,
        stroke: P.ink,
        alpha: other,
        radius: 4,
        width: 2,
      });
      [y - 6, y + 6].forEach((ry, i) =>
        line(x - 13, ry, x + (i ? 5 : 15), ry, { color: P.muted, alpha: other, width: 2 }),
      );
      documentIcon(x + 18, y - 21, 32, 42, { alpha: owner, rows: 0 });
      person(x + 34, y + 5, { size: 0.5, alpha: owner, solid: false, color: P.unknown });
    },
    // A check expected to pass fails, and evidence whose time has run out.
    (x, y, g) => {
      const v = said(g, "核验和预期相反", "contradicts expectation"),
        flip = ramp(t, cue(s, "相反", "contradicts") - 0.15, 0.4);
      box(x - 58, y - 22, 44, 44, { fill: P.row, stroke: P.ink, alpha: v, radius: 6, width: 2 });
      check(x - 36, y + 1, 26, { color: P.evidence, alpha: v * (1 - flip) });
      cross(x - 36, y, 20, { alpha: v * flip });
      const old = said(g, "证据过期", "evidence has expired");
      documentIcon(x + 8, y - 30, 44, 58, { alpha: old, rows: 3 });
      dot(x + 52, y + 20, 18, { color: P.ground, alpha: old });
      clock(x + 52, y + 20, 15, { color: P.unknown, alpha: old, hand: 0.62 });
    },
    // What continuing would do: hide a failure, corrupt the source of truth, present a guess as fact, widen the damage.
    (x, y, g) => {
      const hideAt = cue(s, "掩盖失败", "hide a failure"),
        cover = soon(t, hideAt + 0.2, 0.5),
        hide = said(g, "掩盖失败", "hide a failure");
      cross(x - 30, y - 24, 30, { alpha: hide, width: 3 });
      box(mix(x - 71, x - 41, cover), y - 35, 22, 22, {
        fill: P.row,
        stroke: P.ink,
        alpha: hide * cover,
        radius: 4,
        width: 2,
      });
      const pollute = cue(s, "污染权威来源", "corrupt a source");
      documentIcon(x + 14, y - 46, 34, 44, {
        alpha: said(g, "污染权威来源", "corrupt a source"),
        rows: 2,
      });
      [
        [x + 24, y - 16],
        [x + 38, y - 28],
        [x + 36, y - 10],
      ].forEach(([px, py], i) =>
        dot(px, py, 4, { color: P.unknown, alpha: ramp(t, pollute + 0.1 + i * 0.12, 0.2) * g }),
      );
      const guessAt = cue(s, "把猜测说成事实", "present a guess");
      text("?", x - 42, y + 28, 26, {
        role: "mark",
        align: "center",
        color: P.muted,
        alpha: ramp(t, guessAt - 0.15, 0.4) * g,
      });
      check(x - 18, y + 28, 22, { color: P.unknown, alpha: ramp(t, guessAt + 0.3, 0.3) * g });
      // The harm widens in voice time, so a widening still under way when the thought ends rests in the quiet.
      const worseAt = cue(s, "扩大损害", "worsen the harm"),
        grow = standard((voiceTime(t) - voiceTime(worseAt + 0.05)) / 0.8),
        worse = ramp(t, worseAt - 0.15, 0.4) * g;
      dot(x + 32, y + 28, 5, { color: P.unknown, alpha: worse });
      [13, 22].forEach((r, i) =>
        ring(x + 32, y + 28, mix(5, r, grow), {
          color: P.unknown,
          alpha: worse * restMark(P.unknown, 1 - i * 0.35),
          width: 2,
        }),
      );
    },
  ];
  // The conditions each kind holds, stacked in its column beneath its station.
  const kinds = [[0, 1], [2, 3, 4], [5], [6], [7]];
  const g1 = base * stageOut(t, handoff);
  if (g1 > 0)
    s22Escalation(
      s,
      t,
      stopAt,
      escalate,
      independent,
      names,
      nameAts,
      WY,
      SY,
      SR,
      BUS,
      GY,
      PAIR,
      ONE,
      NY,
      PX,
      OY,
      AX,
      LANE,
      glyphs,
      kinds,
      g1,
    );
  // The handoff's way, from stage 2 to the end of the scene: the Agent stands named at its head and the way runs on to
  // its quiet end at the right, one point travelling it while the work is handed on. Each stage hangs what it shows
  // beneath the way's middle, so the way and the Agent stand through the stage cuts.
  // The way stands high enough that the report and the frame hung beneath it stay balanced about the centre.
  const HY = 340,
    HX0 = 300,
    HX1 = 1620;
  const handway = (g, flowing, from) => {
    line(HX0 + 36, HY, HX1, HY, { color: P.line, alpha: g, width: 3.5 });
    dot(HX1, HY, 6, { color: P.line, alpha: g });
    agent(HX0, HY, { alpha: g, size: 1.3 });
    nameText(L("智能体", "Agent"), HX0, HY + 22 * 1.3 + NAME_GAP, {
      valign: "top",
      color: P.evidence,
      alpha: g,
    });
    // The point of work enters at the way's head from the stage's cut, `from`, and travels at the film's flow pace.
    const q = flowing > 0 ? loopPhase(since(t, from), HX1 - 12 - HX0 - 44) : null;
    if (q !== null)
      flowDot(mix(HX0 + 44, HX1 - 12, q), HY, 7, q, { color: P.evidence, alpha: g * flowing });
  };
  // 2. Handoff and interruption, one thought and one picture: two records hang from the way. First the report, one
  // page headed by its name: each thing it states (in English, what it names) takes its row on its own words, an icon
  // of what it is with its short name, and the page lengthens to take each row as it comes. Then, on the words that
  // stop the work midway, the work pauses under a pause sign on the way, named there, and what it preserves is saved in
  // one frame hung beneath the sign: each of the four things takes its row on its words, an icon in its box with its
  // name, and the frame lengthens and widens to take each as it comes, so whoever resumes starts where the work
  // stopped. Neither record stands larger than what it holds; the two stand as one group about the frame's centre. The
  // two records hold to the scene's end.
  const g2 = base * stageIn(t, handoff);
  if (g2 > 0) s22Records(t, handoff, told, interrupt, kept, HY, handway, g2);
};

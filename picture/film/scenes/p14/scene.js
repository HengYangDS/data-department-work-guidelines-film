/* 14 data: implementation, verification and production change. The scene: its cues and the cuts between its stages,
 * each stage on the words that name it. */

import { measure } from "../../drawing/strokes.js";
import { person, token } from "../../drawing/symbols.js";
import { opening } from "../../framing/chapters.js";
import { NAME_GAP, wrapName } from "../../naming/names.js";
import { growTexts } from "../../naming/parts.js";
import { RAIL_WRAP, railStations } from "../../naming/placement.js";
import { P } from "../../palette.js";
import { L, en } from "../../timeline.js";
import { cue, cueFrom, cues } from "../../timing/cues.js";
import { ramp } from "../../timing/easing.js";
import { glide, glideYield, ride } from "../../timing/pace.js";
import { STAGE_CUT, stageIn, stageOut } from "../../timing/stages.js";
import { scenes } from "../registry.js";
import { s14Handover } from "./handover.js";
import { s14Approval, s14Vault } from "./production.js";
import { s14Track } from "./track.js";

scenes["14"] = function (s, t) {
  // The Chinese names six stages, the last the improvement after running; the English names seven.
  const stations = cues(
    s,
    en
      ? [
          ["", "requirements"],
          ["", "design"],
          ["", "implementation"],
          ["", "verification release"],
          ["", "release"],
          ["", "operational feedback"],
          ["", "improvement"],
        ]
      : [
          ["需求", ""],
          ["设计", ""],
          ["实现", ""],
          ["核验发布", ""],
          ["发布", ""],
          ["运行后的改进", ""],
        ],
  );
  const asNeeded = cue(s, "视工作需要", "as the work requires");
  const [owner, result, both, oneDuty, quality, next, handing] = cues(s, [
    ["工程负责人", "engineering owners"],
    ["结果负责", "result from"],
    ["开发和核验", "development and verification"],
    ["一份责任", "one responsibility"],
    ["质量", "quality is not"],
    ["推给下一个环节", "next stage"],
    ["交出结果之前", "before handing"],
  ]);
  // The hand-over's five parts: the criteria, the actual inputs, version and environment, the results and what they did
  // not cover, each failure and how it was handled, and the remaining risk with its owner, each part's words in the order
  // spoken. Each edition states them as three things, which `groups` gives as the list the names build in: in Chinese
  // the criteria with the inputs, the results, and the failures with the risk; in English, by its semicolons, the
  // criteria, the inputs with the results, and the failures with the risk.
  const rows = (
    en
      ? [
          [["", "criteria tested"]],
          [
            ["", "inputs version"],
            ["", "version"],
            ["", "environment"],
          ],
          [
            ["", "results with"],
            ["", "not covered"],
          ],
          [
            ["", "each failure"],
            ["", "its handling"],
          ],
          [
            ["", "who owns"],
            ["", "remaining risk"],
          ],
        ]
      : [
          [["按什么标准", ""]],
          [
            ["输入", ""],
            ["版本", ""],
            ["环境", ""],
          ],
          [
            ["结果怎样", ""],
            ["没覆盖到", ""],
          ],
          [
            ["失败或差异", ""],
            ["怎么处理", ""],
          ],
          [
            ["剩下的风险", ""],
            ["归谁", ""],
          ],
        ]
  ).map((pairs) => cues(s, pairs));
  const groups = en ? [0, 1, 1, 2, 2] : [0, 0, 1, 2, 2];
  const vaultAts = cues(
    s,
    en
      ? [
          ["", "production shared"],
          ["", "shared assets"],
          ["", "critical management chains"],
        ]
      : [
          ["生产环境", ""],
          ["共享资产", ""],
          ["关键的管理流程", ""],
        ],
  );
  // Each control's gate arrives on the words that begin it and opens one step per requirement said. A control whose key
  // phrase closes its clause arrives near those words, so its name never stands long before them: the rerun control on
  // the outputs, the Chinese way back once the release window has been said, and the evidence from the current version
  // and environment on the words that say where it must come from.
  const lockAts = (
    en
      ? [
          [
            ["", "a defined subject"],
            ["", "impact"],
            ["", "task lead"],
            ["", "and authority"],
          ],
          [
            ["", "outputs that"],
            ["", "rerun exactly"],
          ],
          [
            ["", "tests acceptance"],
            ["", "acceptance"],
            ["", "operational observation"],
          ],
          [
            ["", "release window"],
            ["", "rollback or degradation"],
          ],
          [
            ["", "security"],
            ["", "permission and"],
            ["", "sensitive-data checks"],
          ],
          [
            ["", "conditions"],
            ["", "hand control"],
            ["", "or stop"],
          ],
        ]
      : [
          [
            ["讲明改什么", ""],
            ["影响谁", ""],
            ["谁负责", ""],
            ["谁授权", ""],
          ],
          [
            ["输出", ""],
            ["原样重跑", ""],
          ],
          [
            ["有测试", ""],
            ["验收和", ""],
            ["发布后的观察", ""],
          ],
          [
            ["有发布窗口", ""],
            ["回滚或降级预案", ""],
          ],
          [
            ["安全", ""],
            ["权限和", ""],
            ["敏感信息", ""],
          ],
          [
            ["什么时候上报", ""],
            ["交给人接管", ""],
            ["停下", ""],
          ],
        ]
  ).map((pairs) => cues(s, pairs));
  // The seventh control's environment is the one said after the current version, as the hand-over names one before it.
  const currentAt = cue(s, "当前的版本", "current version");
  lockAts.push([
    cue(s, "来自当前", "come from"),
    currentAt,
    cueFrom(s, "环境", "environment", currentAt),
  ]);
  const risky = cues(s, [
    ["高风险", "high-risk"],
    ["权限变更", "permission changes"],
    ["生产发布", "production releases"],
    ["删除覆盖", "deletion"],
    ["不可逆", "irreversible"],
  ]);
  const [ownerAt, approveAt, agentAt, cannotAt] = cues(s, [
    ["决策负责人", "the decision owner"],
    ["批准", "must approve"],
    ["智能体", "an agent"],
    ["不能批准", "cannot approve"],
  ]);
  // The high-risk stage cuts in on its thought's first words in English, the decision owner. The Chinese names the owner
  // and the approval before the five actions, as the English does, but opens on the count, 有五类事: its stage cuts in on
  // 五类事, 0.16 s into the thought, so the owner, who stands from the cut, waits under 0.6 s for its name on 必须.
  const highCut = cue(s, "五类事", "the decision owner");
  const base = ramp(t, opening(s), 0.7);
  // 1. The engineering owner carries one result through every stage; the line of responsibility follows it.
  // The English sixth stage, two words, is authored as its one line, as each English name stands whole on one line.
  const names = en
    ? [
        "Requirements",
        "Design",
        "Implementation",
        "Verification",
        "Release",
        ["Operational feedback"],
        "Improvement",
      ]
    : ["需求", "设计", "实现", "核验", "发布", "运行后的改进"];
  // The stations are spaced from their names, so every name stands on one baseline without crowding its neighbours. The
  // English rail carries seven stages, so it is wider about the same axis and keeps one pitch, and its names, each whole
  // on one line, stand on two baselines, every other name a row lower on a short stem from its station.
  const trackY = 560,
    [first, last] = L([440, 1640], [404, 1676]),
    xs = en
      ? names.map((_, i) => first + (i * (last - first)) / 6)
      : railStations(names, first, last, { gap: 34 });
  const trackEnd = last + 40,
    widthOf = (v) => Math.max(...wrapName(v, RAIL_WRAP).map((line) => measure(line)));
  // The track holds until the hand-over is named and hands the picture to the report in one cut.
  const pA = base * stageOut(t, handing);
  // The hand-over holds until the vault is named and then hands the picture over in one cut, so the two large
  // compositions never cross-fade and the frame keeps a legible mark between them.
  // The production change's stage cuts in on its thought's first word, the changes its first name says, as the word
  // begins rather than a cut's 0.18 s after it, since the word is short.
  const changesCut = cue(s, "改动生产环境", "changes to production") - STAGE_CUT + 0.05,
    handOff = stageOut(t, changesCut);
  // The owner carries the result through the stages and leaves with the track; the result stays and docks.
  person(250, trackY, { alpha: ramp(t, owner - 0.15, 0.5) * pA, color: P.authority });
  // The result rides to each stage as it is named. The stages are named faster than a glide reaches them, so the
  // rides the next stage's word finds under way are one move through those stages, at the glide's pace.
  const tx = ride(
    t,
    320,
    xs,
    stations.map((at) => at - 0.1),
  );
  const tokQ = ramp(t, result - 0.15, 0.4) * base;
  if (pA > 0)
    s14Track(
      s,
      t,
      stations,
      asNeeded,
      owner,
      both,
      oneDuty,
      quality,
      next,
      names,
      trackY,
      xs,
      trackEnd,
      widthOf,
      pA,
      tx,
      tokQ,
    );
  // 2. Before handing a result over, its owner states three things, each a group of parts that attach to the result on
  // their words, sliding in until their ways meet the result's ring. The result the owner carried stands at the centre,
  // and the three stand left of it, round it and right of it, in the order spoken. In Chinese: the criteria and the
  // actual inputs, version and environment they were tested with, one over the other on the left; the results, the ring
  // that draws round the result, all but one stretch at its foot, what was not covered, which stays a dashed gap; and
  // each failure with how it was handled over the remaining risk, held by the one who owns it, on the right. In English,
  // by its semicolons: the criteria on the left; the actual inputs, version and environment as tiles from above, with the
  // results and what was not covered; and the failures over the risk on the right. A side's two
  // parts join the result by one way, so each side reads as one group, and the parts' names stand on one edge beyond
  // them. The names build as the three things the narration speaks, the parts of one thing sharing its level, and every
  // part stays until the production change takes the picture. The report stands centred on what it holds: centred on its
  // first two things about the result, it moves left on the words of the third to where it ends centred.
  const pB = stageIn(t, handing) * base * handOff,
    resultAt = cueFrom(s, "结果", "result", handing);
  const modelName = L(["按什么标准"], ["Criteria tested"]),
    inputsName = en
      ? ["Actual inputs", ", version", ", environment"]
      : ["实际的输入", "、版本", "和环境"];
  const failName = en ? ["Each failure", ", its handling"] : ["每个失败或差异", "怎么处理"],
    riskName = en ? ["Remaining risk", " and its owner"] : ["剩下的风险", "归谁"];
  // A side's two parts stand 45 px above and below the result's line, their outer edges on one line 296 px from the
  // result (the English criteria, alone, on the line with its edge 270 px out), and their ways meet 112 px from it.
  const TW = 76,
    RR = 64,
    PAIR = 45,
    OUT = en ? 270 : 296,
    MEET = 112;
  const widest = (parts, width) =>
    Math.max(
      ...growTexts(parts, width).map((line) => line.reduce((w, [, v]) => w + measure(v), 0)),
    );
  // The report's reach either side of the result: its left edge at the left names, and its right edge at the result's
  // ring, then in English the inputs' name, and then the failures' and the risk's names.
  const reportLeft =
    -OUT - NAME_GAP - Math.max(measure(modelName.join("")), en ? 0 : widest(inputsName, 480));
  const firstRight = Math.max(
    reportLeft + measure(L("交出结果之前，讲清三件事", "Before handing over")),
    RR + 8,
  );
  const inputsRight = Math.max(firstRight, en ? TW + NAME_GAP + widest(inputsName, 480) : 0);
  const wholeRight = Math.max(
    inputsRight,
    220 + 50 + NAME_GAP + Math.max(widest(failName, 480), measure(riskName.join(""))),
  );
  const centreOn = (right) => 960 - (reportLeft + right) / 2,
    third = cue(s, "每个失败或差异", "each failure");
  // The report moves on the inputs' words in English, about 190 px, and on the first words of the third thing, about
  // 270 px in Chinese and 100 px in English, so the third's names arrive inside the frame; each move is a glide from 0.3 s
  // before those words, so the room is there as the names arrive.
  const toInputs = centreOn(inputsRight) - centreOn(firstRight),
    toWhole = centreOn(wholeRight) - centreOn(inputsRight);
  const docked = t >= handing + STAGE_CUT,
    RCY = 550,
    RCX =
      centreOn(firstRight) +
      toInputs * glide(t, rows[1][0] - 0.3, toInputs) +
      toWhole * glide(t, third - 0.3, toWhole);
  // A part that docks on the report the way the report glides gives its own pace up to the glide's, as a flow does:
  // the voice time its dock has given up to those glides by the time u.
  const carried = (u) =>
    glideYield(u, rows[1][0] - 0.3, toInputs) + glideYield(u, third - 0.3, toWhole);
  if (pB > 0)
    s14Handover(
      t,
      handing,
      rows,
      groups,
      pB,
      resultAt,
      modelName,
      inputsName,
      failName,
      riskName,
      TW,
      RR,
      PAIR,
      OUT,
      MEET,
      widest,
      reportLeft,
      RCY,
      RCX,
      carried,
    );
  // The result stands at its dock from the cut that brings the report, rather than gliding there across the frame.
  token(docked ? RCX : tx, docked ? RCY : trackY, { alpha: tokQ * handOff, r: docked ? 24 : 10 });
  // 3. Changing production, shared assets or critical management chains needs more. The change waits at the start
  // of a way to the vault that holds them, named from the cut by the voice's first word, the change itself, and the way
  // crosses seven gates, one per required control, the last the evidence from the current version and environment:
  // each gate arrives shut on the words that name its control and opens one step per requirement as each is said,
  // named by its key words, above and below the way in turn. The vault grows as each object it holds is named, and the
  // objects are named together over it. When the last gate has opened, the change's way draws on through all of them
  // into the vault. With the change's and the vault's names the stage carries ten names in each
  // edition.
  const p3 = stageIn(t, changesCut) * base * stageOut(t, highCut);
  if (p3 > 0) s14Vault(s, t, vaultAts, lockAts, p3);
  // 4. High-risk actions need the decision owner's approval: the five build into one column whose ways
  // converge on one point, where the lock the owner holds appears shut on the word that approves and opens. The column
  // stands top to bottom in the order spoken; in English it reflows toward its centre as they arrive, so it stays about
  // the centre line as it grows. The owner stands above the lock
  // and holds it along one link; the Agent stands below it. Both editions name the owner and the approval before the
  // actions, so the lock opens before the ways reach it. The Chinese first says there are five kinds of action that the
  // owner must approve: on those words the count heads the column and its five places stand as one quiet mark, with the
  // owner above the lock, and each action's mark fills its place on its own words. The Agent may implement or
  // help verify within its delegation, which closes round it as a solid boundary on those words; its way up to the lock
  // appears only with the bar that stops it, on the words that say it cannot approve.
  const p4 = stageIn(t, highCut) * base;
  if (p4 <= 0) return;
  s14Approval(s, t, risky, ownerAt, approveAt, agentAt, cannotAt, highCut, p4);
};

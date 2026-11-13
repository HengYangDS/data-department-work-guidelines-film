/* 13 data: changing a shared identifier. The scene: its cues and the cuts between its stages, each stage on the words
 * that name it. */

import { illustrative, opening } from "../../framing/chapters.js";
import { cue, cues } from "../../timing/cues.js";
import { ramp } from "../../timing/easing.js";
import { stageIn, stageOut } from "../../timing/stages.js";
import { scenes } from "../registry.js";
import { s13Decisions, s13Join } from "./decisions.js";
import { s13Responsibilities } from "./responsibilities.js";
import { s13Retiring } from "./retiring.js";

scenes["13"] = function (s, t) {
  const [example, changeId, tests, join, wrong, decisions, schema] = cues(s, [
    ["虚构的例子", "illustrative change"],
    ["换了一套公司代码", "changes its issuer identifier"],
    ["本地测试通过了", "local tests pass"],
    ["按旧代码关联财务数据", "joins on the old one"],
    ["关联错公司", "match the wrong entities"],
    ["几件不同的事", "several distinct decisions"],
    ["表结构选得再方便", "convenient schema"],
  ]);
  // Both editions name each role just before saying what it does.
  const roles = cues(s, [
    ["开发", "development checks"],
    ["技术", "technical owners check"],
    ["产品", "product owner identifies"],
    ["生产", "production owner plans"],
    ["治理", "governance confirms"],
  ]);
  const [seats, coordinate, retire, migrated, ended, notice] = cues(s, [
    ["这些是责任", "responsibilities not seats"],
    ["任务负责人", "task lead"],
    ["旧公司代码要停用", "retiring the old identifier"],
    ["都已迁移", "has migrated"],
    ["终止那项使用", "ended its use"],
    ["弃用通知", "deprecation notice"],
  ]);
  // Each decision's owner is named on its own noun; the items it settles fill on their own words in stage 2.
  const owners = [
    cue(s, "有授权的领域负责人", "authorized domain owners"),
    cue(s, "数据模型负责人", "data-model owner"),
  ];
  // The decisions' stage cuts in on its thought's first words, which in Chinese lead to the decisions by a clause.
  const opensDecisions = cue(s, "这时要定", "this raises");
  const base = ramp(t, opening(s), 0.7);
  const p1 =
    ramp(t, Math.min(example - 0.3, opening(s) + 0.2), 0.7) * base * stageOut(t, opensDecisions);
  // The identifier change is marked as illustrative while it is worked through, to the old identifier's retirement.
  illustrative(ramp(t, example - 0.2, 0.6) * base);
  // 1. A pair on one row: the shared data on the right, the downstream factor calculation on the left, and the join
  // between them. The case is named over the pair as it is introduced, and the data it is told on arrives with its name
  // on the words that bring it in, near the centre. The data's issuer identifier flips over under it; local tests pass
  // on its corner; the join from the data still runs on the old identifier, turns doubtful, and what it may do builds
  // into a column under the calculation. Each state of the build stands centred: the case's name stands centred on the
  // frame, and the data, its check and their names stand centred under it until the calculation is named; on its words
  // the data moves right to its place across from the calculation and the case's name moves over the pair.
  if (p1 > 0) s13Join(s, t, example, changeId, tests, join, wrong, p1);
  // 2. Several distinct decisions: two open questions stand on one row under their name, for who decides is not yet
  // said, each a large question mark where its owner will stand. Each question gives way to its owner on the
  // owner's words, and what that owner settles builds into a column under the owner, each item on its own words. A
  // convenient schema then stands between the columns, and its way toward the meaning column stops at a bar: it cannot
  // resolve a conflict of meaning. The decisions' name and the way that parts them give way as the last thing the
  // data-model owner settles arrives, and what the schema cannot resolve is its qualifier, one name with it, so the
  // stage never shows more than twelve names; the schema stands high between the columns, so the stage stays centred
  // once the name has left.
  const p2 = stageIn(t, opensDecisions) * base * stageOut(t, roles[0]);
  if (p2 > 0) s13Decisions(s, t, decisions, schema, owners, opensDecisions, p2);
  // 3. The roles of the change are responsibilities: things a holder can carry. Each arrives on its words as a token in
  // the authority colour, named above it, and its mark plays what it does on those words: a join is checked, a part
  // slides into its socket, consumers are found and their ways to the new key drawn, a release steps up with its way back
  // planned, a seal is stamped beside an exit that opens; the joins Development checks stand under the row's centre,
  // joined to its token, while the roles are named. Both editions say what each of the five does, so every mark plays
  // on the words that say it. The five stand on one row left to right in the order named, and the row reflows toward
  // its centre as they arrive, so it stays balanced as it builds. On "not seats" an empty seat stands dashed under each
  // and is refused; the seats give way as the task lead comes, who stands under the row's centre and coordinates the
  // five along one way up to a bracket under the row, and deciding for the others is refused under its name.
  const p3 = stageIn(t, roles[0]) * base * stageOut(t, retire);
  if (p3 > 0) s13Responsibilities(s, t, roles, seats, coordinate, p3);
  // 4. Retiring the old identifier: a tree from the identifier to its affected consumers, which stands with them on the
  // words that ask to show every affected consumer. Three consumers have migrated, under one bracket; the decision owner
  // has ended the fourth's use: the owner is named beside it on the owner's words, and its stop, in the owner's colour,
  // stands on the words that end it. A deprecation notice stands under the identifier, and its way up to the identifier
  // stops at a bar. The identifier's old value, A1, stands under its card as the value stood under the data in stage 1,
  // and the two hold the frame alone while the English names the retirement before the consumers. The identifier and
  // the column of consumers are composed about the centre: the card stands centred while it is alone, and on the words
  // that show the consumers the stage moves left, its tree growing to the right, to where it ends centred.
  const p4 = stageIn(t, retire) * base;
  if (p4 > 0) s13Retiring(s, t, retire, migrated, ended, notice, p4);
};

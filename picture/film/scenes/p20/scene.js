/* 20 human-agent: delegation transfers the work, not the duty. The scene: its cues and the cuts between its stages,
 * each stage on the words that name it. */

import { opening } from "../../framing/chapters.js";
import { cue, cueFrom, cues } from "../../timing/cues.js";
import { ramp } from "../../timing/easing.js";
import { stageIn, stageOut } from "../../timing/stages.js";
import { scenes } from "../registry.js";
import { s20Acceptor, s20Caller, s20Duty, s20Submitting } from "./duty.js";
import { s20FiveRoles, s20SeveralRoles } from "./roles.js";

scenes["20"] = function (s, t) {
  const base = ramp(t, opening(s), 0.7);
  const policy = cue(s, "制度允许时", "where policy permits");
  // 1. A piece of work involves five roles. The piece of work is a page at the left, drawn and named on the first
  // words; the roles build into one column at its right, each arriving and named on its own words, and the page's
  // spine reaches each role just before it comes, so the tree grows with its members. The tree is centred on its
  // extent, from the page or its name to the end of the longest role's name.
  const roles = cues(s, [
    ["任务负责人", "task lead"],
    ["执行的成员", "executing member"],
    ["智能体评审人", "an agent a reviewer"],
    ["评审人", "reviewer"],
    ["验收人", "acceptor"],
  ]);
  const g1 = base * stageOut(t, policy);
  if (g1 > 0) s20FiveRoles(s, t, roles, g1);
  // 2. Where policy permits, one person may hold several roles, but a title alone grants no authority to decide or
  // accept (in Chinese, being the task lead does not mean one may decide or accept). One stage holds the whole sentence,
  // so nothing leaves inside it: the roles stand above, and the title and the powers it does not grant arrive below them
  // on the title's words. The policy stands at the left as a page with its seal, named on the words that open the
  // thought. Both editions name the person first and then the several roles it may hold: the person stands on its words,
  // and on the roles' words three empty seats arrive at the right, gathered to the person by the bracket and named once
  // as a group; in Chinese each power is then said to need its own authorization.
  const title = cue(s, "当了任务负责人", "a title alone"),
    samePerson = cue(s, "一个人", "one person");
  const several = cue(s, "兼几种角色", "hold several roles"),
    holders = [several, several, several];
  const caller = cue(s, "调用智能体的人", "the person who calls");
  const powers = [
    cue(s, "做决定", "grants no authority to decide"),
    cueFrom(s, "验收", "accept", title + 1),
  ];
  const g2 = base * stageIn(t, policy) * stageOut(t, caller);
  if (g2 > 0) s20SeveralRoles(s, t, policy, title, samePerson, several, holders, powers, g2);
  // 4. The person who calls an Agent owns the information it uses (in English, its context), its permissions,
  // verification and result: the caller and the Agent stand on one line, and what the caller owns builds into one rail
  // between them, each item marked on its words.
  const submit = cue(s, "提交它帮忙做的工作", "submitting");
  const infoAt = cue(s, "背景材料", "context");
  const owned = [
    infoAt,
    cueFrom(s, "权限", "permissions", infoAt),
    ...cues(s, [
      ["核验", "verification"],
      ["结果", "result"],
    ]),
  ];
  const g4 = base * stageIn(t, caller) * stageOut(t, submit);
  if (g4 > 0) s20Caller(s, t, caller, owned, g4);
  // 5. Submitting work an Agent helped with means you have understood it, checked it and accept responsibility for its
  // consequences. The
  // person who called the Agent stands at the left, named so until the words address it as you, and the work it submits
  // at the right, so the pair is centred before the vouchers come; the three vouchers then build into one column between
  // them, each checked on its words.
  const transfers = cue(s, "委托转移的是工作", "delegation transfers");
  const vouched = cues(s, [
    ["看懂了", "understood"],
    ["检查过", "checked it"],
    ["为后果负责", "accept responsibility"],
  ]);
  const g5 = base * stageIn(t, submit) * stageOut(t, transfers);
  if (g5 > 0) s20Submitting(s, t, submit, vouched, g5);
  // 6. Delegation transfers the work, not that duty: the person and the Agent face each other across the way of the
  // delegation, drawn and named on its first word, and the work is named with it, in the same clause, so its page never
  // waits for its name. On "transfers" the work crosses along it to the Agent; the duty stays with the person, and its
  // way across stops at a short bar.
  const examine = cue(s, "检查实际的工作和证据", "examines the actual work"),
    dutyAt = cue(s, "这份责任", "not that duty");
  const acceptor = cue(s, "验收人检查", "the acceptor examines");
  const g6 = base * stageIn(t, transfers) * stageOut(t, acceptor);
  if (g6 > 0) s20Duty(s, t, transfers, dutyAt, g6);
  // 7. The acceptor examines the actual work and evidence: the stage cuts in on the words that name the acceptor, the
  // acceptor stands over the work at the centre, and the Agent stands at the left. Unmet conditions send the work back to
  // the member: a way runs from the work on the words that send it back, and the member arrives at its end, beside the
  // Agent, on the words that name them; the delegated boundary (in Chinese, the scope of the delegation) is drawn round
  // both on the words that name it. Met ones let it be accepted, recorded and handed off, three steps on one rail at the
  // right. Acceptance never expands permission: the boundary keeps its size and the expansion is refused. Until the met
  // branch is named, what stands of the stage stands right of its place, centred on the frame, and on the met branch's
  // words it moves left to its place as the rail draws on; the rail stands as far left as centres the whole stage on
  // the work, which stands at the centre.
  const [unmet, met, noExpand] = cues(s, [
    ["条件不满足", "if the agreed conditions are unmet"],
    ["满足了", "if they are met"],
    ["验收不会扩大权限", "acceptance never expands"],
  ]);
  const steps = cues(s, [
    ["才验收", "accepted"],
    ["记录", "recorded"],
    ["交接", "handed off"],
  ]);
  const g7 = base * stageIn(t, acceptor);
  if (g7 > 0) s20Acceptor(s, t, examine, acceptor, unmet, met, noExpand, steps, g7);
};

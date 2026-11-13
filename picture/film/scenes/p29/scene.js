/* 29 evolve: management responsibilities and emergencies. The scene: its cues and the cuts between its stages, each
 * stage on the words that name it. */

import { opening } from "../../framing/chapters.js";
import { L } from "../../timeline.js";
import { cue, cues } from "../../timing/cues.js";
import { ramp } from "../../timing/easing.js";
import { STAGE_CUT, stageIn, stageOut } from "../../timing/stages.js";
import { scenes } from "../registry.js";
import { s29Containment, s29Response } from "./incident.js";
import { s29Closest, s29Demonstration } from "./judgment.js";
import { s29Managers, s29Strain } from "./managers.js";
import { s29Record, s29Recurrence, s29Urgency } from "./record.js";

scenes["29"] = function (s, t) {
  const managers = cue(s, "管理者要讲清", "managers clarify");
  const clarify = cues(s, [
    ["方向", "direction"],
    ["优先级", "priorities"],
    ["决定的边界", "decision boundaries"],
    ["和资源", "and resources"],
  ]);
  const [conflicts, stalled, protect] = cues(s, [
    ["跨领域的冲突", "cross-domain conflicts"],
    ["久拖不决的事项", "stalled decisions"],
    ["保护如实暴露问题的人", "people who honestly"],
  ]);
  const strains = cues(s, [
    ["目标冲突", "goals conflict"],
    ["优先级变来变去", "priorities drift"],
    ["资源不足", "resources run short"],
    ["决定一拖再拖", "decisions stall"],
    ["分工衔接让人误判", "interfaces mislead"],
  ]);
  const [repair, blame] = cues(s, [
    ["先从管理上改起", "repair the management system"],
    ["不要急着怪成员", "before blaming"],
  ]);
  const [demo, ...misuse] = cues(s, [
    ["用真实的工作示范", "show how they judge"],
    ["事后挑错", "retrospective fault-finding"],
    ["走过场", "ceremonial review"],
    ["微观管理", "micromanagement"],
  ]);
  const [within, closest] = cues(s, [
    ["在边界之内", "within the stated boundaries"],
    ["离事实最近的负责人", "the responsible person closest"],
  ]);
  const paths = cues(s, [
    ["选方法", "the method"],
    ["工具", "tools"],
    ["实施路径", "and path"],
  ]);
  const kinds = cues(s, [
    ["数据出错", "a data error"],
    ["生产故障", "production failure"],
    ["越权违规", "permission or compliance"],
  ]);
  // Both editions open the incident with its condition, 紧急情况下 and "it is an emergency when", a second before the
  // first kind; the stage opens on its key words.
  const emergency = cue(s, "紧急情况下", "an emergency");
  const [finder, contain, tell, ownerLeads] = cues(s, [
    ["发现的人", "whoever finds it"],
    ["在自己权限内控制影响", "contains it within"],
    ["通知数据或生产负责人", "tells the data or production owner"],
    ["受影响工作的负责人", "the owner of the affected work"],
  ]);
  const [urgency, uncertain, noAuthority] = cues(s, [
    ["再紧急", "urgency does not"],
    ["不确定的结果", "an uncertain result"],
    ["权限也不会变大", "grant authority"],
    ["先控制影响", "contain first"],
  ]);
  const fields = cues(s, [
    ["谁凭哪些事实和权限", "who decided what"],
    ["凭哪些事实和权限", "on which facts"],
    ["措施管多久", "how long the measure"],
    ["谁接手", "who takes over"],
    ["什么情况下回滚", "when to roll back"],
  ]);
  // Chinese also names verifying the correction among what the kept inputs serve (29.6); the act itself is its last
  // mention, once the incident holds.
  const [verifyAt, reviewAt] = cues(s, [
    ["核验修正", "verify the correction", { last: true }],
    ["复盘原因", "and review"],
  ]);
  const [again, recurring, mechanism] = cues(s, [
    ["同类紧急处置", "treat a recurring"],
    ["反复出现", "a recurring kind of exception"],
    ["按机制问题处理", "as a mechanism problem"],
  ]);
  const base = ramp(t, opening(s), 0.7);
  // 1. Managers make four things clear and act in time, in one structure: the manager stands at the left, joined to two
  // rows. On the top row direction, priorities, decision boundaries and resources take their stations; on the row
  // beneath stand the three acts: two domains pointing apart turn to one direction, a paused decision is settled, and
  // a person raising a problem is covered by an arc. The top row's rail stands from the first words, which say what
  // managers make clear, and the row beneath draws in with its first act; each duty takes its station on its own
  // words. The seven names build as one list and stay: earlier names step to second ink while later ones build, and
  // all return to full ink on the sentence's last words. The duties stand at one pitch, and the acts beneath stand
  // under the first three of them, so the two rows keep one grid. The stage holds until the strains are named.
  const one = base * stageOut(t, strains[0]);
  if (one > 0) s29Managers(s, t, managers, clarify, conflicts, stalled, protect, one);
  // 2. Under strain the management system is repaired first: the system is a gear whose rim cracks at each strain as it
  // is named, each name set outside the rim along its crack. On the repair the cracks mend and the gear turns, while
  // the member beside it stays untouched and unjudged. The stage holds until the demonstration is named. The gear stands
  // still from its first strain to the cut, so no name it has shown glides: it stands where its strains, once named,
  // and the member beside it stand centred, and each state of the build stands within 40 px of the centre (the first
  // strain alone, a build-up of half a second, a little more).
  // The demonstration's stage cuts in on its thought's first word, the managers it names, as the word begins.
  const demoCut =
    cue(s, "管理者用真实的工作示范", "managers show how they judge") - STAGE_CUT + 0.05;
  const three = base * stageIn(t, strains[0]) * stageOut(t, demoCut);
  if (three > 0) s29Strain(t, strains, repair, blame, three);
  // 3. Managers show how they judge on real work: the manager stands at a work document and marks its rows one by one,
  // then checks it. Beside it the three uses the guidelines refuse build into one column, each arriving with its cross on
  // its own words. The next stage cuts in on the words that name the stated boundaries, so the boundary draws on as
  // they are said, or just before the person closest to the facts if an edition names that person first. English says
  // the boundaries over a long clause before the person, so its stage holds 0.57 s into that clause and the boundary
  // never stands nearly empty through a second of speech.
  const boundCut = Math.min(closest - 0.35, within + L(0, 0.57)),
    four = base * stageIn(t, demoCut) * stageOut(t, boundCut);
  if (four > 0) s29Demonstration(s, t, demo, misuse, four);
  // 4. Within the stated boundaries the person closest to the facts chooses: the stage cuts in just before the person is
  // named, with the boundary drawing on round its ground and its name, sized to the facts and their responsible person
  // standing inside it; on the words that name the first choice the ground widens to take the choices, which branch
  // from that person into one column, each drawn on and named on its own words. The ground widens about its own middle,
  // so the stage stays centred: its left edge and what stands in it reflow by half the widening. The person's name
  // stands under the person, on the line of the last choice's name.
  const five = base * stageIn(t, boundCut) * stageOut(t, emergency);
  if (five > 0) s29Closest(t, within, closest, paths, boundCut, five);
  // 5. An incident is contained by whoever finds it, within their own authority. Both editions open it with the
  // emergency: the urgency clock of the urgency stage below stands over the row, small and named on its words, as the
  // stage's first mark. The kinds of incident build into one row, left to right in the order spoken, each a firm ring
  // with its spreading pulse, inside one frame that opens around the first kind and widens to the right just before each
  // next one; the frame is the finder's authority, and widens to the left to take the finder on the words that find it.
  // On the containment the pulses stop at the firm rings, which turn to evidence, and the frame takes its name. The
  // condition the path applies under stands beneath the frame, building on its words. Telling the owner draws one link
  // from the finder out of the frame, under the condition with clear room, to the owner beyond it, in three straight
  // runs joined by quarter turns. The stage holds until the owner takes over. The finder and the owner stand with their
  // feet on the line of the rings' lowest points, and the finder at the kinds' pitch before the first; every name hangs
  // under its mark on the kinds' names' line, and the frame keeps one padding above the finder's head and below the
  // lowest name, and one at its two ends; the frame's name and, a line above it, the emergency are centred over the
  // frame as it stands, moving with it as it widens, so the two headings keep one rule, the emergency's clock hung
  // before its line.
  const six = base * stageIn(t, emergency) * stageOut(t, ownerLeads);
  if (six > 0) s29Containment(s, t, kinds, emergency, finder, contain, tell, six);
  // 6. The owner of the affected work leads the response: the owner stands at the head of a small tree, with the
  // affected work, a page marked by the incident, beside them from the words that name it. The preserved inputs and
  // versions sit beneath the owner, and from them two branches reach what they are kept for: establishing the impact
  // and verifying a correction. English names the kept inputs before their uses. Chinese names the uses first
  // (保留查明影响、核验修正所需的输入和版本): on the words that keep them the stem draws down from the owner through the
  // stack's place, the branches leave its foot on their own words, and the stack settles over the stem on the words
  // that name it. When the response needs further
  // permission, the owner escalates to the person with the authority to decide, the decision owner, on the left. Each
  // part of the tree draws in with its own words, and the decision owner appears on the words that name the escalation.
  // The English tree stands lower, so it is balanced through the thought before its two branches arrive at its end.
  const seven = base * stageIn(t, ownerLeads) * stageOut(t, urgency);
  if (seven > 0) s29Response(s, t, ownerLeads, seven);
  // 7. Urgency changes neither the result nor the authority: urgency's clock stands at the left and two ways leave it.
  // The first carries an uncertain result on toward reliable and stops at a bar; the second reaches toward more
  // authority and stops at a bar at the same place. Each way and what it carries arrive on their own words: the way on
  // toward reliable and its bar on the words that would make the result reliable (in Chinese 变可靠), and what it cannot
  // reach on reliable itself (可靠). The stage builds about the centre: the clock stands alone on it, the clock and the
  // uncertain result centre as a pair as the result is named, and as reliable is named the stage eases to its place,
  // where the whole stage centres.
  const recordAt = cue(s, "如果先记录", "if recording would");
  const eight = base * stageIn(t, urgency) * stageOut(t, recordAt);
  if (eight > 0) s29Urgency(s, t, urgency, uncertain, noAuthority, eight);
  // 8. Contain first, then complete the record: the incident arrives held, a firm ring, on the words that contain it
  // first, at the left, and the record beside it fills row by row on the words that ask for each, one row per spoken
  // clause. The record waits as a small page at the middle of its place from the stage's first words, which name the
  // recording, a clock on it turning while it would delay the response and why it waits beneath it; on the words that
  // complete it the clock goes and the page opens about its middle into the record, headed by its name inside it and as
  // long as the rows it holds, and each row arrives with its box, its check and its name on its own words. The name
  // stands one row's pitch above the first row, and the open page keeps one padding round its words: above its name, at
  // its left and below its last row. The page is as wide as its rows need, so the incident and the record stand about
  // the centre, and while the record waits the incident and the waiting page stand apart about it.
  // Once it holds, the correction is verified and the cause reviewed: the held incident turns to a check on the words
  // that verify the correction, and the two acts are named beneath it, each on its own words. The stage holds until
  // recurrence is named.
  const nine = base * stageIn(t, recordAt) * stageOut(t, again);
  if (nine > 0) s29Record(s, t, fields, verifyAt, reviewAt, nine);
  // 9. A recurring kind of exception (in Chinese, the same kind of emergency handling) is a mechanism problem: the same mark
  // repeats along one rail across the clause
  // that says it recurs, and on the mechanism every repeat drops into one gear below, a small tree whose root is the
  // mechanism. Each repeat arrives on its beat, and the gear appears and turns on the words that name the mechanism.
  const ten = base * stageIn(t, again);
  if (ten > 0) s29Recurrence(s, t, again, recurring, mechanism, ten);
};

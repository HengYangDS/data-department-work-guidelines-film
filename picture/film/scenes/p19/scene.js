/* 19 human-agent: delegate a boundary, not a pile of context. The scene: its cues and the cuts between its stages, each
 * stage on the words that name it. */

import { labelSize, measure } from "../../drawing/strokes.js";
import { clearOfTitle, illustrative, opening } from "../../framing/chapters.js";
import { NAME_GAP } from "../../naming/names.js";
import { LABEL } from "../../palette.js";
import { L, en } from "../../timeline.js";
import { cue, cues } from "../../timing/cues.js";
import { ramp } from "../../timing/easing.js";
import { glide } from "../../timing/pace.js";
import { stageIn, stageOut } from "../../timing/stages.js";
import { scenes } from "../registry.js";
import { s19Cannot, s19ClearBoundary, s19Delegation, s19Extends } from "./delegation.js";
import { s19Comparison, s19JustHandleIt, s19ReadOnly, s19StopConditions } from "./example.js";
import { s19MissingContext } from "./fork.js";

scenes["19"] = function (s, t) {
  const base = ramp(t, opening(s), 0.7);
  const within = cue(s, "在委托范围内", "within a delegated boundary"),
    extend = cue(s, "扩展", "agents extend");
  // The member who delegates stands at one place through the scene's first stages, and the Agent's boundary to its
  // right; the stages are composed about the frame's centre, wide enough to read as one group. The boundary stands
  // further right in Chinese, whose names inside it are shorter, so the member and the boundary balance in each edition.
  const MX = 580,
    MY = 506,
    FX = L(970, 920),
    small = 160;
  // The member's left edge: its figure reaches 41 px left of its axis at this size, its English name further.
  const memberLeft = MX - Math.max(41, measure(L("成员", "Member")) / 2);
  // The actors' names, the member's and the Agent's, stand on one line under the member, the taller figure. A column
  // beside them that has a row within an em of that line stands so that row is on it, so the row reads level with them.
  const em = labelSize(LABEL),
    ACTOR = MY + 38 + NAME_GAP;
  const snap = (firsts) => {
    const d = firsts
      .map((y) => ACTOR + em / 2 - y)
      .reduce((a, b) => (Math.abs(b) < Math.abs(a) ? b : a), Infinity);
    return Math.abs(d) <= em ? d : 0;
  };
  // 1. The member delegates kinds of work to an Agent: the kinds build into one column beside the member as they are
  // named, and on the words that hand them over the column is joined to the Agent by one link. The member stands from
  // the first words, clear of the rising chapter title; each kind arrives on its own word and the Agent on its name.
  // Until the handover the member and the column stand alone, centred as one group, and on the handover's words they
  // move left to their places beside the Agent, the member to the place it keeps through the next stages. Before the
  // first kind is named the member stands alone at the centre, and it moves to its place in the group on that kind's
  // words; English says what the member does first, so there the member sets off on "delegate", and the group covers
  // the picture's band from the first kind on rather than after it has moved. The column stands nearer the Agent than
  // the member, its rows a wide pitch apart and its last row on the
  // actors' line, so the member and the kinds fill the picture from the first kind on while the Agent is still to come.
  const kinds = cues(s, [
    ["查资料", "search"],
    ["分析", "analysis"],
    ["起草", "drafting"],
  ]);
  const settleAt = en ? cue(s, "", "delegate work") : kinds[0];
  const toAgent = cue(s, "委托给智能体", "to agents"),
    agentAt = cue(s, "智能体", "agents");
  const g1 = base * clearOfTitle(s, t, 350) * stageOut(t, Math.min(within, extend));
  if (g1 > 0)
    s19Delegation(s, t, MX, MY, memberLeft, em, ACTOR, snap, kinds, settleAt, toAgent, agentAt, g1);
  // 2. Within the delegated boundary the Agent extends what people can investigate, reason about and do: the boundary
  // stands round the Agent as a frame, and the three abilities build into one column inside it, each with its mark.
  // The frame opens on the stage's first words about the Agent alone and widens to the column as its first ability
  // arrives; until then it stands round the Agent at the middle of where the boundary will stand, so the member and the
  // boundary are balanced, and the Agent steps to its side as the frame widens. The frame is named on its own words,
  // which open the stage in Chinese and close it in English, where it holds the Agent and its abilities before then.
  const abilities = cues(s, [
    ["调查", "investigate"],
    ["推理", "reason about"],
    ["动手", "and do"],
  ]);
  // The next stage cuts in on its first words: the Agent's own column in Chinese, the refusal in English.
  const sourceCut = cue(s, "智能体能执行", "but an agent");
  // Each column's frame is as wide as its own widest name, so the boundary is filled by what it holds.
  // The refused authorization stands whole on one line, the frame widening to take it.
  const kx = FX + 210,
    refused = L("组织的授权", "Organizational authorization"),
    RW = 400,
    lean19 = L(83, 164);
  const widthFor = (names) => 210 + 20 + NAME_GAP + Math.max(...names) + 40;
  const g2 = base * stageIn(t, Math.min(within, extend)) * stageOut(t, sourceCut);
  if (g2 > 0)
    s19Extends(t, within, extend, MX, MY, FX, small, em, ACTOR, snap, abilities, kx, widthFor, g2);
  // 3. The Agent executes and reasons, but it cannot grant organizational authorization or make commitments for people:
  // inside the boundary the Agent's own column builds on its words, and the authorization and the commitments it cannot
  // give are refused in it, so the frame shows what stays with the Agent and what does not. The English names only the
  // two refusals, so its column holds those rows.
  const boundary = cue(s, "要划清边界", "delegate with a clear boundary");
  const g3 = base * stageIn(t, sourceCut) * stageOut(t, boundary);
  if (g3 > 0)
    s19Cannot(
      s,
      t,
      within,
      extend,
      MX,
      MY,
      FX,
      small,
      em,
      ACTOR,
      snap,
      refused,
      RW,
      lean19,
      widthFor,
      g3,
    );
  // 4. Delegate with a clear boundary, not a pile of context: the pile under the member is refused, and the boundary
  // handed to the Agent states five things. The boundary opens about the Agent alone and grows with the five as they
  // build into one column inside it, each with its own mark. Until they come it closes round the Agent at its side on
  // the stage's first words and moves to the middle of where it will stand, so the stage is balanced while it waits.
  const pile = cue(s, "一堆背景材料", "a pile of context");
  // The example cuts in on the words that name its first mark (changing nothing in Chinese; in English the comparison,
  // whose chart stands from its verb), so the boundary holds over "for example" rather than leaving the frame without a
  // mark before the example's words.
  const [readOnly, earlier, revised] = cues(s, [
    ["只看不改", "read-only"],
    ["供应商修正前", "compare the vendor's earlier"],
    ["修正前后", "revised"],
  ]);
  const example = Math.min(readOnly, earlier) - 0.2;
  const parts = cues(s, [
    ["目的和范围", "purpose and scope"],
    ["交什么", "the deliverable"],
    ["限制和权限", "limits and permissions"],
    ["怎么验收", "how the result will be accepted"],
    ["什么时候必须停", "when to stop"],
  ]);
  const g4 = base * stageIn(t, boundary) * stageOut(t, example);
  if (g4 > 0)
    s19ClearBoundary(
      s,
      t,
      within,
      extend,
      MX,
      MY,
      FX,
      small,
      em,
      ACTOR,
      snap,
      lean19,
      boundary,
      pile,
      parts,
      g4,
    );
  // 5. For example: compare the vendor's earlier and revised price snapshots, read-only, and report each value's source
  // and observation time, the differences, and what cannot be verified. The vendor's prices stand as one chart at the
  // centre, its frame and axes drawn with its first series so they never stand empty, and its name on the words that
  // name the snapshots; each snapshot is one series of the same prices, drawn on its own words and named at its end, and
  // the revised one departs from the earlier. A cursor reads both series at the same moment, and the lock under the
  // stage closes on the words that change nothing, which Chinese says first. The illustrative chip stands while the
  // example is drawn.
  // 6. The report joins the chart it is made from, in the same sentence in Chinese: the chart eases left by half the room
  // the report takes, whole before the report is named, and the report stands at its right as one column, its page and
  // name over its three contents, each a mark and a name on its own words. The chart and the report hold together until
  // the conditions to stop begin, so no picture leaves inside the sentence.
  const report = cue(s, "报告", "report"),
    vague = cue(s, "帮我搞定", "just handle it"),
    told = cue(s, "一句", "telling");
  const noSnap = cue(s, "没有修正前的快照", "stop if");
  const items = cues(s, [
    ["每个值的来源", "each value's source"],
    ["哪些有差异", "the differences"],
    ["哪些核实不了", "what cannot be verified"],
  ]);
  const contents = en
    ? ["Source and observation time", "The differences", "What cannot be verified"]
    : ["每个值的来源和观察时间", "哪些有差异", "哪些核实不了"];
  const FW = 700,
    GAP = 80,
    CW = 18 + 24 + NAME_GAP + Math.max(...contents.map((v) => measure(v))),
    room = (GAP + CW) / 2;
  const fx = 960 - FW / 2 - room * glide(t, report - 1, room);
  illustrative(base * stageIn(t, example) * stageOut(t, told));
  const g5 = base * stageIn(t, example) * stageOut(t, noSnap);
  if (g5 > 0) s19Comparison(s, t, earlier, revised, report, items, contents, FW, GAP, fx, g5);
  // Changing nothing: a lock under the stage, its name beside it, which closes on its words. It limits the whole
  // delegation, so it stands outside the chart's stage, centred under the chart and the report, until the conditions to
  // stop begin.
  const kept = base * stageIn(t, example) * stageOut(t, noSnap);
  if (kept > 0) s19ReadOnly(t, readOnly, kept);
  // 7. Stop if the earlier snapshot is missing or the data in production would have to change; do not release the data
  // for use (in English, do not grant admission). The Agent stands over one crossing row, drawn with the stage, from
  // which its ways leave: the two conditions to stop on either side, each with what it would reach, and the release
  // straight down the middle, refused. Each way, dashed, and what it would reach arrive on its own words: the missing
  // earlier snapshot as an empty dashed outline, production, and the admission seal; each way stops at a short bar
  // across it.
  const [prodWrite, noApprove] = cues(s, [
    ["要改生产数据", "a production write"],
    ["不要放行", "do not grant admission"],
  ]);
  const g7 = base * stageIn(t, noSnap) * stageOut(t, told);
  if (g7 > 0) s19StopConditions(t, noSnap, prodWrite, noApprove, g7);
  // 8. "Just handle it" does not set an authorization boundary: the phrase beside the member is refused, the boundary
  // that is not set is only marked by its four dashed corners, which stand on the verb that does not draw it (in
  // English on "set", close enough to the boundary's name that the corners never wait for it), and the Agent, standing
  // named where the boundary would be, drifts from the refusal in and out of it in voice time, trailing a dashed path;
  // the boundary is named on its own words. The next stage cuts in on the words that open the fork: the first thing
  // that may be unclear in Chinese, missing context in English.
  const gap = cue(s, "要处理的对象", "missing context"),
    notSet = cue(s, "划不出", "does not set"),
    authAt = cue(s, "授权的边界", "authorization boundary", { last: true });
  const g8 = base * stageIn(t, told) * stageOut(t, gap);
  if (g8 > 0) s19JustHandleIt(s, t, MY, vague, notSet, authAt, g8);
  // 9. Missing context forks the Agent's work. A tree from the Agent: where direction, safety and authority are not
  // materially affected it proceeds on stated assumptions; where something it must know is unclear it stops and asks.
  // The branches stand in the spoken order: the English says the assumptions first, the Chinese first names what may be
  // unclear. Each branch reaches its condition on the condition's first words. Proceeding is a key term with its
  // qualifier, in two lines at most: it stands whole on its first words, and while its parts are said its ring beats
  // once on each part's words. What may be unclear is a list said member by member (the object to handle, the source of
  // truth, the responsible person, the authority, and whether the consequence can be undone): its members are set on
  // the lines of one block as the parts of one name wrap, and each arrives at its place on its own words and takes its
  // level in the list, so the condition builds as it is said and nothing in it moves; its ring beats on each further
  // member, and that any one of them is unclear is its qualifier, on its own words on the line below. Each outcome's
  // run leaves its own condition's first line. The column wraps the list, and in English the qualifier of proceeding,
  // so the tree is no wider than its words need. The member who delegated stays where the last stage left them, at the
  // root's left; while the first condition builds, the Agent and its fork stand further right, so the member and the
  // growing tree are balanced, and on the first outcome's words the fork moves left to its place, where the finished
  // tree is centred. The Agent's open question stands above it; the English names it missing context on its words,
  // while the Chinese never names missing context as such, so there it stays a mark of what the Agent does not know.
  const g9 = base * stageIn(t, gap);
  if (g9 > 0) s19MissingContext(s, t, em, ACTOR, snap, gap, g9);
};

/* 03 purpose: two kinds of authority. The scene: its cues and the cuts between its stages, each stage on the words that
 * name it. */

import { opening } from "../../framing/chapters.js";
import { en } from "../../timeline.js";
import { cue, cueFrom, cues } from "../../timing/cues.js";
import { ramp } from "../../timing/easing.js";
import { drawShare, glideTime } from "../../timing/pace.js";
import { stageIn, stageOut } from "../../timing/stages.js";
import { scenes } from "../registry.js";
import { s03AboutFacts, s03ToAct } from "./each-kind.js";
import { s03Guidelines, s03Kinds } from "./guidelines.js";
import { s03Against, s03Judgment } from "./judgment.js";

scenes["03"] = function (s, t) {
  const [bind, agentAt, search, reason, act, people] = cues(s, [
    ["这份指南适用于部门成员", "the guidelines apply to members"],
    ["智能体", "agents they delegate"],
    ["调查", "investigate"],
    ["推理", "reason"],
    ["和动手", "and act"],
    ["始终在人手里", "stay with people"],
  ]);
  const duties = cues(s, [
    ["方向", "direction"],
    ["授权", "authorization"],
    ["决定", "decisions"],
    ["后果", "responsibility for consequences"],
  ]);
  // The two kinds of authority are both named in the thought that counts them: authority to act, and authority about
  // facts.
  const [two, apart, decideQ, factQ] = cues(s, [
    ["两种依据", "two kinds of authority"],
    ["分开看", "stay apart"],
    ["行动依据", "authority to act"],
    ["事实依据", "authority about facts"],
  ]);
  const ranks = cues(s, [
    ["法律", "law"],
    ["这件事的决策负责人", "what the decision owner"],
    ["有效的契约", "then contracts"],
    ["工作计划、临时约定", "work plans provisional agreements"],
  ]);
  // Both editions name authority to act again as the thought that answers it begins. Chinese announces its order right
  // after those words, so the two kinds give way to the order's head as the name ends, on 「依据」, and its frame stands
  // alone only briefly before its first rank; English first says, in one sentence, what that authority answers and that
  // it has an order, so the two kinds stand through it, the order's name joining the first kind's question, and give way
  // to the order on the next sentence's first word, its first rank. The frame of the order opens on its announcement in
  // Chinese and with its first rank in English, and takes the announcement as its title.
  const order = cue(s, "有先后", "it has an order"),
    actQ = cueFrom(s, "行动依据", "authority to act", factQ);
  const orderCut = en ? ranks[0] : cueFrom(s, "依据", "", actQ);
  // The second kind is named again where its answer begins.
  const truthQ = cueFrom(s, "事实依据", "authority about facts", ranks[3]);
  // English says what each kind answers as the thought about it begins, where Chinese says both as it names the two.
  const asks = en
    ? [cueFrom(s, "", "answers", actQ), cueFrom(s, "", "answers", truthQ)]
    : [Infinity, Infinity];
  const [record, observe, onlyLeads] = cues(s, [
    ["原始记录", "primary records"],
    ["能重复的观察", "repeatable observations"],
    ["只能算线索", "only leads"],
  ]);
  // What an observation must state, in the order each edition speaks it.
  const attrs = en
    ? cues(s, [
        ["", "a source"],
        ["", "time"],
        ["", "subject"],
        ["", "scope"],
      ])
    : cues(s, [
        ["并说清来源", ""],
        ["时间", ""],
        ["对象和范围", ""],
      ]);
  // The leads, in the order each edition speaks them.
  const leads = en
    ? cues(s, [
        ["", "second-hand accounts"],
        ["", "caches"],
        ["", "generated views"],
        ["", "agent output"],
        ["", "memory"],
      ])
    : cues(s, [
        ["转述", ""],
        ["记忆", ""],
        ["缓存", ""],
        ["派生视图", ""],
        ["智能体的输出", ""],
      ]);
  const [noTrue, conflict, report, quiet] = cues(s, [
    ["假的变成真的", "make a false fact true"],
    ["核验却发现数据有错", "verification finds the data wrong"],
    ["讲出冲突和影响", "report the conflict"],
    ["悄悄按决定或核验结果去做", "act as if one side"],
  ]);
  // The example's decision: the release set for today.
  const release = cue(s, "定了今天发布", "if a release is set for today");
  const [expert, missing, domainOwner, alone] = cues(s, [
    ["专业判断", "professional judgment belongs"],
    ["缺了哪一样", "either is missing"],
    ["相应领域的负责人", "bring in the domain owner"],
    ["懂行", "expertise alone"],
  ]);
  // Both editions say first that expertise is not authority.
  const noPower = cueFrom(s, "不等于有权", "no authority to decide", alone),
    judgeAt = Math.min(expert, alone);

  // 1. The guidelines apply to members and the Agents they delegate to: one frame holds both figures, joined by the
  // delegation, each above its own column. The frame opens around the members on the first words, which apply to them, and
  // grows as what it applies to arrives: it widens to the Agent on the words that bring the Agent or the delegation, and it
  // deepens to each row of the columns as the row's first item is named. What the Agent can do builds under it;
  // direction, authorization, decisions and the responsibility for consequences build under the members, and the
  // members' column takes their colour when the words say these stay with people. The stage holds until the two kinds
  // of authority are named.
  const membersAt = cue(s, "部门成员", "members"),
    delegate = cue(s, "委托", "delegate to");
  // How far a column's rail has drawn down from `top`: to each station from the one above it as its item is named, as a
  // share of the rail's length to the last station.
  const reachOf = (ats, ys, top) =>
    ats.reduce((sum, at, i) => {
      const d = ys[i] - (i ? ys[i - 1] : top);
      return sum + drawShare(t, at - 0.15, d, 0.5) * d;
    }, 0) /
    (ys[ats.length - 1] - top);
  const g1 = ramp(t, opening(s), 0.7) * stageOut(t, two);
  if (g1 > 0)
    s03Guidelines(
      s,
      t,
      bind,
      agentAt,
      search,
      reason,
      act,
      people,
      duties,
      membersAt,
      delegate,
      reachOf,
      g1,
    );

  // 2. The two kinds of authority. On the words that count them one frame, sized to them, stands under their name with
  // an open question mark in each half, as large as the seal that will answer it so the frame never stands as an empty
  // form, and a divider parts it into two on the words that keep them apart. Each kind then takes its seal and stands
  // under it on its own words: the seal's rim closes around the mark, and once the rim stands the mark gives way and
  // the seal is stamped where it stood, so the half is never empty and the mark never shares its place with the stamp.
  // The frame grows to hold the kind's name, and the stage gives way as the first kind's order begins. English names
  // authority to act again to say what it answers and that it has an order before the order's first rank: the count's
  // name gives way as the kind is named again, and the question the kind answers, then the order's name, stand under
  // the kind's name, smaller, each on its own words, the frame deepening to hold them.
  const versus = cue(s, "行动依据不能", "authority to act cannot");
  const kinds = stageIn(t, two) * stageOut(t, orderCut);
  if (kinds > 0) s03Kinds(t, two, apart, decideQ, factQ, order, actQ, asks, kinds);
  // 3. The first kind's order on the words that begin it: a frame in its colour, headed by its seal and name and
  // centred, that opens with its head and grows with the order of authority to act, one rank to a row, each rank
  // within the one above it. The rail draws down to each rank as it is named, and the rank's station, a mark that
  // shrinks from rank to rank, stands at its end. Each rank is named by its spoken words: a rank that enumerates sets its
  // head term and, in the rank's ink on the same line at the same size, the rest of what it holds, so each enumeration
  // is set at one size and in one ink; the owner's decision is qualified by its owner, smaller. When the second kind is
  // named again the order gives way: in Chinese at once, as the second kind's stage cuts in; in English, which names the
  // second kind's first answer only in the middle of its sentence, the ranks leave as a whole and the frame returns to
  // its head, under which the second kind stands (see 4), and the head fades as the second kind rises to head its own
  // order, so no cut falls inside the sentence. It rises from under the closed head (y 650) to its order's head (y 370),
  // its seal growing by 14 px, and arrives as primary records begin to ink in; the closed head has faded before the
  // rising seal reaches it.
  const rise = en ? record - 0.15 - glideTime(650 - 370 + 50 - 36) : Infinity;
  const g2 = stageIn(t, orderCut) * (en ? 1 - ramp(t, rise + 0.2, 0.4) : stageOut(t, truthQ));
  if (g2 > 0) s03ToAct(s, t, decideQ, ranks, order, truthQ, g2);
  // 4. The second kind's answer: its own frame, headed by its seal and name and centred, opens with primary records and
  // grows with what establishes a fact. Chinese cuts to its head as the kind is named again. In English the kind's seal
  // and name stand under the closed head of the first kind's order once its ranks have gone, centred, the question it
  // answers under the name on the words that say it answers, and they rise to head their own order as the first kind's
  // head fades, growing to the head's size, so they stand in place before primary records are named; while the head
  // stands alone it stands right of its place by half the width still to come. Primary records and repeatable
  // observations stand on the rail under the fact seal; the leads stand below a bar across it, and their way up toward
  // the seal stops at the bar. The leads are a list: each is named on its own words where the row's qualifier stands,
  // and the name that calls them only leads comes last, on its own words. The Chinese rows are set within the width of
  // the order of authority to act, so the leads stand under their name and the frame stands nearer the centre while its
  // first rows build. The English leads, five names of one list, each begin with a capital, as Agent output must. The
  // order holds until the first refusal of the next thought is said.
  const g3f = stageIn(t, truthQ) * stageOut(t, versus);
  if (g3f > 0) s03AboutFacts(t, truthQ, asks, record, observe, onlyLeads, attrs, leads, rise, g3f);

  // 5. Authority and fact set against each other, each seal standing on its own words in its colour: authority's way
  // toward making a false fact true stops at a bar short of the middle, and so does a fact's way toward permission to
  // act. Each refused name stands over its way on its own side of the middle, so the way up to the report passes between
  // them. In the example the release set for today beats on authority's seal and the verification that finds the data
  // wrong on the fact's; the conflict then stands in the middle and is reported with its impact, while its ways down to
  // altering the record or quietly acting for one side stop at their bars. No one is named to settle it here. The stage
  // holds until the words on expertise begin. It cuts in on the thought's first word, which names authority, with
  // authority's seal and name; the first refusal's way joins it on its own words. The seals stand 480 px either side of
  // the middle in both editions,
  // so the pair covers the band from the cut. The middle stands at the frame's centre. Both seals stand with their names,
  // the two kinds the scene has named, from the thought's first word, and each refused way and name follows on its own
  // words.
  const g4c = stageIn(t, versus) * stageOut(t, judgeAt);
  if (g4c > 0) s03Against(s, t, noTrue, conflict, report, quiet, release, versus, g4c);

  // 6. Professional judgment rests on both the competence and the facts: the judgment is a balance, standing from the
  // stage's first words, and each need lands in its pan on its own words; the beam tips toward the pan that holds a need
  // and settles level only when both are in. When one is missing its weight leaves the pan, a question stands there and
  // the beam tips again; the domain owner is brought in on the right and carries the missing facts into the pan, and
  // the beam levels. Below, expertise alone runs toward the power to decide or act and stops at a bar short of it; that
  // power's hollow seal stands below on the words that deny it. Both editions say this first, so the stage cuts in on
  // the thought's opening words. The balance stands where it and its two needs' names, once both are named, stand
  // centred, so the picture is balanced from its first words and as the needs land; the domain owner then stands at
  // the right, so on the owner's words the whole stage moves left by as much as centres the finished stage, from the
  // needs' names at its left to the owner's name at its right.
  const g5 = stageIn(t, judgeAt);
  if (g5 > 0) s03Judgment(s, t, expert, missing, domainOwner, alone, noPower, g5);
};

/* 05 decide: start from the decision. The scene: its cues and the cuts between its stages, each stage on the words that
 * name it. */

import { illustrative, opening } from "../../framing/chapters.js";
import { en } from "../../timeline.js";
import { cue, cueFrom, cues } from "../../timing/cues.js";
import { ramp } from "../../timing/easing.js";
import { stageIn, stageOut } from "../../timing/stages.js";
import { scenes } from "../registry.js";
import { s05Catalog, s05Decision } from "./decision.js";
import { s05Frame, s05Information, s05Unclear } from "./frame.js";

scenes["05"] = function (s, t) {
  const [
    analysis,
    which,
    who,
    what,
    when,
    catalog,
    notFound,
    found,
    meaning,
    quality,
    permission,
    differ,
  ] = cues(s, [
    ["分析之前", "before analysis"],
    ["支持哪个决定", "which decision"],
    ["谁", "who decides"],
    ["要决定什么", "what"],
    ["在什么时候之前", "by when"],
    ["改进数据目录", "wants a better data catalog"],
    ["找不到数据", "can't find the data"],
    ["找到了", "do they find it"],
    ["看不懂含义", "what it means"],
    ["拿不准质量", "how good it is"],
    ["不知道能不能用", "whether they may use it"],
    ["办法各不相同", "each needs a different fix"],
  ]);
  const [
    frame,
    subject,
    present,
    criteria,
    outScope,
    limits,
    commit,
    unclear,
    stop,
    ask,
    collect,
    change,
  ] = cues(s, [
    ["先把问题说清", "frame the problem"],
    ["针对什么", "its subject and who is affected"],
    ["现在怎样", "present state"],
    ["怎样算成功", "success criteria"],
    ["哪些不做", "out of scope"],
    ["限制也要讲明", "without time cost compliance"],
    ["能执行的承诺", "executable commitment"],
    ["说不清", "is unclear"],
    ["停下受影响的事", "stop the affected action"],
    ["请有授权的人来定", "ask an authorized person"],
    ["收集信息不是目的", "collecting information"],
    ["能改变哪个判断", "say which judgment it could change"],
  ]);
  const base = ramp(t, opening(s), 0.7);
  // 1. An analysis is framed by the decision it must support. The analysis gathers left of centre from the chapter's first
  // words as a loose drift inside the open, dashed outline of its frame, which stands with its name on the analysis's own
  // words in the first clause, near enough to the centre to stand alone. On the decision's words one quiet link carries
  // it to the decision, one mark named as it is asked, and the decision's three parts (who, by when, what) branch from
  // it, each arriving on its own words in the order each edition speaks them, while the drift settles into rows and its
  // frame closes: framed, the analysis has its aim. Everything waits for the rising chapter title to clear it.
  // The illustrative case cuts in on its first named mark: the catalog in Chinese, the team that wants it in English.
  const teamAt = cue(s, "大家", "a team"),
    caseAt = Math.min(catalog, teamAt);
  const one = base * stageOut(t, caseAt);
  if (one > 0) s05Decision(s, t, analysis, which, who, what, when, one);
  // 2. An illustrative case, a better data catalog, as a tree: either people cannot find the data, or they find it and
  // three questions stay open. The case opens centred on the catalog and the people who use it, each on its own words;
  // on the words of its first question the tree grows from the catalog, which in English glides to the left with it. Each node and
  // the branch to it arrive on the node's own words; when the fixes are said to differ every problem lights and gains a
  // fix of its own shape in one column, linked along its row.
  const two = base * stageIn(t, caseAt) * stageOut(t, frame);
  illustrative(two);
  if (two > 0)
    s05Catalog(t, catalog, notFound, found, meaning, quality, permission, differ, teamAt, two);
  // 3. Frame the problem. The frame opens on its first words around the room of its first item, open at the bottom, and
  // what it must hold builds in one column inside it, each item on its own words with a mark of its own, the frame's
  // sides growing down to hold each item as it arrives: four items in English, and in Chinese the three pairs it asks,
  // each pair one item. Its bottom edge stays open until the limits are spoken: the sides reach it as the first limit is
  // named, each limit stands as a station on it, named on one baseline, and the edge closes on the last; on the
  // commitment the frame turns the decision's colour.
  const unSubject = en ? cueFrom(s, "", "subject", commit) : cue(s, "要处理的对象", "");
  const three = base * stageIn(t, frame) * stageOut(t, unSubject);
  if (three > 0) s05Frame(s, t, frame, subject, present, criteria, outScope, limits, commit, three);
  // 4. When the subject, the authority or an irreversible consequence is unclear, the affected action stops and someone
  // with authority decides. The affected action moves on along its lane from the stage's first words, which name
  // the first of its unclear conditions. The conditions build in one column on a stem that stands on the lane, each with
  // an open mark on its own words. The action reaches a short bar on the words that stop it, where the way on is left
  // untaken, and one quiet link rises from it to the person who decides above, who appears when that person is asked.
  // The stage stands 22 px right of where the conditions and the lane alone would centre, so it leans no further left
  // while the action moves than it leans right once the action has stopped and the way on is drawn; the person who
  // decides is named at their left, over the lane.
  // The halo on the condition being said stands 10 px clear of its mark, as the frame's halos do, so it never matches
  // the moving action's outer ring and the action stays one mark with the lane it runs on.
  const four = base * stageIn(t, unSubject) * stageOut(t, collect);
  if (four > 0) s05Unclear(s, t, unclear, stop, ask, unSubject, four);
  // 5. Information earns its worth by the judgment it could change: the collected information sits in its tray and one
  // quiet link carries it to the judgment it could change, which stands at the link's end on its words, lighting the
  // pieces that bear on it. The row stands at the middle of the band.
  const five = base * stageIn(t, collect);
  if (five > 0) s05Information(s, t, collect, change, five);
};

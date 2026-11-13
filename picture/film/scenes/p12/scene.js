/* 12 data: from a signal to controlled use. The scene: its cues and the cuts between its stages, each stage on the
 * words that name it. */

import { opening } from "../../framing/chapters.js";
import { cue, cueFrom, cues } from "../../timing/cues.js";
import { ramp } from "../../timing/easing.js";
import { stageIn, stageOut } from "../../timing/stages.js";
import { scenes } from "../registry.js";
import { s12Conditions, s12Labels } from "./conditions.js";
import { s12Adoption, s12ControlledUse, s12NotYet } from "./use.js";

scenes["12"] = function (s, t) {
  const together = cue(s, "同时满足", "all hold");
  const conds = cues(s, [
    ["含义", "meaning is explainable"],
    ["来源", "source traceable"],
    ["时间", "time identifiable"],
    ["过程能复现", "process is reproducible"],
    ["质量能核验", "quality verifiable"],
    ["运行看得见", "operation observable"],
    ["有负责人", "owner is identifiable"],
    ["用途有边界", "use bounded"],
  ]);
  const [missing, ...labels] = cues(s, [
    ["任何一条不满足", "if any condition is unmet"],
    ["探索", "exploratory"],
    ["临时", "temporary"],
    ["有限使用", "limited-use"],
    ["待核验", "awaiting verification"],
  ]);
  const [path_, ...steps] = cues(s, [
    ["从有希望的信号到受控使用", "from a signal to controlled use"],
    ["值不值得评估", "evaluation worthwhile"],
    ["数据是什么", "what is the data"],
    ["能不能复现", "key findings be reproduced"],
    ["能不能稳定运行", "run reliably"],
    ["能不能准入", "serve this use"],
    ["该不该继续", "support continuing"],
  ]);
  const [signalNot, deployed, admission, adoption] = cues(s, [
    ["有信号", "a signal is not"],
    ["已经部署", "deployed does not mean"],
    ["准入是事先放行", "admission permits"],
    ["采用", "adoption is"],
  ]);
  const base = ramp(t, opening(s), 0.7);
  // The ring of the work system: eight arcs, one per condition, the first at the top and the rest clockwise.
  const arc = (i) => {
    const a0 = -Math.PI / 2 + (i * Math.PI) / 4 + 0.06,
      a1 = a0 + Math.PI / 4 - 0.12;
    return [a0, a1, (a0 + a1) / 2];
  };
  // 1. Before data enters a lasting work system, eight conditions must all hold. The data stands from the first words,
  // and the system stands as a ring on its own words, open at its left where the data's way reaches it, the way in
  // drawing on as "enters" is said; the ring stands at the structure tier, firm enough to read, so the stage stands as
  // wide and tall as the system from its words. A thin ring closes around the system on "all hold", and each condition
  // draws its arc of the ring and is named outside it on its own words, so the eight build into one set around the
  // system. The names are the conditions' key words. The Chinese says the eight in three groups, each opened by its own
  // words (说得清, 对得上, 管得住): each group thickens the thin ring over the conditions it gathers on the words that
  // open it, and is named inside the ring at its middle on those words. The stage hands over in one cut when a missing
  // condition is named.
  const one = base * stageOut(t, missing);
  if (one > 0) s12Conditions(s, t, together, conds, arc, one);
  // 2. If any condition is unmet, the data is labelled exploratory, temporary, limited-use or awaiting verification.
  // The ring of conditions stands around the data with one arc missing, and one way leaves it for the four labels: a
  // column on its own branches that builds as each label is said, each branch and mark arriving with its label. A
  // limited use needs its own evidence and permission: its row lights again and the qualifier joins it on those words.
  // It does not make the data a fully qualified asset: a way from the limited use draws on on the words that deny it and
  // stops at a bar, and the asset beyond stays an open dashed ring, the outline 12.4 gives what does not follow, named
  // on its own words. The ring and the column are composed about the centre: the limited use's qualifier stands under
  // its term, so the column stays narrow, and the Chinese stage, whose first labels are short, stands 30 px right of the
  // ring's first place, about the centre while they build and once the qualifier joins. While the ring stands alone it
  // stands at the centre, and it eases to its place on the words that label the data, as its way out draws toward the
  // labels; on the words that deny the asset it eases left again by half the room the asset takes beyond the column,
  // so it stands centred once the asset stands beside the limited use.
  const two = base * stageIn(t, missing) * stageOut(t, path_);
  if (two > 0) s12Labels(s, t, conds, labels, arc, two);
  // 3. From a signal to controlled use, the questions that apply are answered for the intended use. The way from the
  // signal reaches a ring around the use, open where the way enters at its left and leaves at its right for controlled
  // use, so either arc may be walked first. The ring stands at the structure tier from the words that name the questions
  // that apply, so it never stands bare for long; each question takes its station on it in its colour as it is asked and
  // lights it, named by its key words, and the six build around the use. Under the use, inside the ring, both editions
  // name the questions that apply. The stage hands over in one cut on the first inequality. The Chinese calls the signal
  // promising.
  const [forUse, ctrlAt] = cues(s, [
    ["针对计划中的用途", "the intended use"],
    ["受控使用", "controlled use"],
  ]);
  const applyAt = cue(s, "适用的问题", "the questions that apply");
  const three = base * stageIn(t, path_) * stageOut(t, signalNot);
  if (three > 0) s12ControlledUse(t, path_, steps, forUse, ctrlAt, applyAt, three);
  // 4. A signal is not yet production-ready; deployed does not mean admitted, still less that another use may follow
  // (in English, admitted, let alone for another use). Three rows, each a way from what holds toward what is said not to
  // follow: the way draws on on the words that deny it and stops at a gate's bar, and what lies beyond stays an open
  // mark, named on its own words. The third row says what deployment brings still less, so its way branches from
  // deployment's mark on the words that deny it, and it has no name of its own on the left.
  // The marks and the gate are set at reading size, so the first row alone already spans the frame. The rows build into
  // one set until admission is named. The set stays centred as it grows: the first row stands on the centre line, and
  // the rows already shown step up by half a row as the words that bring the next one begin. The rows share one gate, a
  // bar through their whole extent at the structure tier, which stands where the first way meets it, so the table
  // stands as tall as it will be from its first refusal; each row's stretch of it takes its colour when its way reaches
  // it.
  const rights = cues(s, [
    ["能投产", "production ready"],
    ["准入了", "admitted"],
    ["别的用途", "for another use"],
  ]);
  const lefts = [signalNot, deployed];
  const nots = [
    cueFrom(s, "还不能", "is not yet", signalNot),
    cueFrom(s, "不等于", "does not mean", deployed),
    cueFrom(s, "更不等于", "let alone", deployed),
  ];
  const rowAts = [...lefts, nots[2]];
  const four = base * stageIn(t, signalNot) * stageOut(t, admission);
  if (four > 0) s12NotYet(t, rights, lefts, nots, rowAts, four);
  // 5. Admission permits a specified use, like that backtest, before it begins; adoption is that use, actually observed
  // under the stated conditions. The admission gate stands at the centre, shut by its bar; a use comes to wait
  // before it on the words that let it through and is named on its own words, the backtest it stands for joining its
  // name on its words, and on "permits" the bar lifts into the gate and the use's way draws on through it. The
  // conditions close round the space beyond the gate as one frame, the gate as its left wall, and are named, on their own
  // words, in the adoption. On adoption, use moves along a lane inside the frame
  // and an observer above it watches, so the observed use is seen within the same conditions.
  const five = base * stageIn(t, admission);
  if (five > 0) s12Adoption(s, t, admission, adoption, five);
};

/* seg12 reaches the right margin; a gentler push keeps its gated path inside the action-safe area. */
scenes["12"].push = 0.01;

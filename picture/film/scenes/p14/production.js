/* 14's production change: the change waiting on the way to the vault of production, shared assets and critical
 * chains, and the high-risk actions that need the decision owner's approval. */

import { ctx } from "../../canvas.js";
import { blend } from "../../drawing/colour.js";
import { s13Table } from "../../drawing/datasets.js";
import { restMark } from "../../drawing/levels.js";
import { link } from "../../drawing/links.js";
import { box, dot, labelSize, line, measure, stroke } from "../../drawing/strokes.js";
import { agent, lock, person, ring, token } from "../../drawing/symbols.js";
import { building, listIn, named, saidShare, speaking } from "../../naming/lists.js";
import { LEADING, NAME_GAP, hangOf, nameText, wrapName } from "../../naming/names.js";
import { rejectedName } from "../../naming/rejected.js";
import { NOTE, termRow } from "../../naming/terms.js";
import { LABEL, P } from "../../palette.js";
import { L, en } from "../../timeline.js";
import { cue } from "../../timing/cues.js";
import { clamp, mix, ramp, soon } from "../../timing/easing.js";
import { glide } from "../../timing/pace.js";

/* Stage 3: the change at the start of the way to the vault, and the controls that changing what it holds needs. */
export function s14Vault(s, t, vaultAts, lockAts, p3) {
  // Each control is named by its spoken words for every requirement it names, never its caption's whole line. The
  // Chinese third and fifth stand as one name in two authored lines, an even block; the Chinese fourth names the
  // release window and, under it, the rollback or degradation plan, which joins on its own words, as the first
  // control's second pair does, and the English third its operational observation; so the stage shows at most twelve
  // names.
  const keys = en
    ? [
        ["Subject, impact", "Task lead, authority"],
        "Rerun exactly",
        ["Tests, acceptance", "Observation"],
        "Rollback or degradation",
        "Security, permission",
        "Escalate, hand over, stop",
        "Current version\nand environment",
      ]
    : [
        ["改什么、影响谁", "谁负责、谁授权"],
        "原样重跑",
        "测试、验收和\n发布后的观察",
        ["发布窗口", "回滚或降级预案"],
        "查安全、权限\n和敏感信息",
        ["上报、交给人接管或停下"],
        "当前的版本和环境",
      ];
  // The vault's name heads the vault, its lines centred on it, and the stage, from the change's ring to the name's
  // far edge, stands centred on the frame in each edition. The Chinese name is authored as two even lines, each
  // group whole on its line.
  const vaultName = L(
    ["生产环境、共享资产，", "或者关键的管理流程"],
    "Production, shared assets or critical management chains",
  );
  // The gates stand 158 px apart in Chinese and 185 px in English, so each control's name stands whole on one line, 48
  // px or more from the next name on its side of the way, the clear gap two names on one row keep; the first gate stands
  // 140 px from the change, so its halo keeps clear of the change's name, and the vault stands 40 px clear of the last
  // control's name. The English last control stands as one name in two lines,
  // broken before its "and", so the seven gates and the vault stand centred inside the safe area.
  const lastW = Math.max(...wrapName(keys.at(-1), Infinity).map((v) => measure(v)));
  const GP = L(158, 185),
    VX0 = 470 + (keys.length - 1) * GP + lastW / 2 + 40,
    VW = 140;
  const half = Math.max(...wrapName(vaultName, 480).map((v) => measure(v))) / 2,
    ox = 960 - (330 - 23 + VX0 + VW / 2 + half) / 2;
  const LY = 510,
    CX0 = 330 + ox,
    gx = (k) => 470 + ox + k * GP,
    VX = VX0 + ox,
    starts = lockAts.map((ats) => ats[0]);
  // The vault opens around its first object and grows on the words that bring each next one; its name moves with its
  // top edge, so the two always stand together.
  const shown = vaultAts.slice(1).reduce((n, at) => n + soon(t, at - 0.3, 0.35), 1),
    VH = 40 + 80 * shown,
    vy = LY - VH / 2;
  box(VX, vy, VW, VH, { fill: P.row, stroke: P.ink, alpha: p3, radius: 6, width: 2.5 });
  // The table and the chain are each drawn as one mark, the table's rules and the chain's three links in one stroke,
  // so each object reads as one thing the vault holds rather than as parts waiting for their own names.
  vaultAts.forEach((at, i) => {
    const y = LY + 80 * (i - (shown - 1) / 2),
      mx = VX + VW / 2,
      q = ramp(t, at - 0.15, 0.4) * p3;
    if (i === 0) s13Table(mx - 32, y - 24, 64, 48, { alpha: q, rows: 3, cols: 3 });
    if (i === 1) {
      box(mx - 30, y - 22, 38, 32, { stroke: P.ink, alpha: q, radius: 5 });
      box(mx - 8, y - 10, 38, 32, { fill: P.row, stroke: P.ink, alpha: q, radius: 5 });
    }
    if (i === 2) {
      stroke(
        () =>
          [-22, 0, 22].forEach((d) => {
            ctx.moveTo(mx + d + 12, y);
            ctx.arc(mx + d, y, 12, 0, Math.PI * 2);
          }),
        { color: P.ink, alpha: q, width: 2.5 },
      );
    }
  });
  // The vault's name stands over its top edge; the controls named above the way stand well clear of it.
  nameText(vaultName, VX + VW / 2, vy - NAME_GAP, {
    valign: "bottom",
    width: 480,
    alpha: p3 * named(t, vaultAts[0]),
  });
  // The change and its way to the vault stand from the cut, the change named under it from the way's start edge, as a
  // way's first name stands.
  token(CX0, LY, { alpha: p3, r: 16 });
  nameText(L("改动", "Changes"), CX0 - 23, LY + 23 + NAME_GAP, {
    align: "left",
    valign: "top",
    alpha: p3 * named(t, cue(s, "改动", "changes")),
  });
  link(CX0 + 30, LY, VX - 12, LY, { alpha: p3, end: false });
  lockAts.forEach((ats, k) => {
    const x = gx(k),
      at = ats[0],
      q = ramp(t, at - 0.3, 0.3) * p3,
      open = saidShare(t, ats),
      up = k % 2 === 0;
    // The gate's two posts are one stroke, one gate; its bar lifts into the upper post as its requirements are said.
    stroke(
      () => {
        ctx.moveTo(x, LY - 46);
        ctx.lineTo(x, LY - 16);
        ctx.moveTo(x, LY + 16);
        ctx.lineTo(x, LY + 46);
      },
      { color: P.evidence, alpha: q, width: 4 },
    );
    if (open < 1)
      line(x, LY - 16, x, mix(LY + 16, LY - 16, open), {
        color: P.unknown,
        alpha: q * clamp((1 - open) / 0.15),
        width: 4,
      });
    ring(x, LY, 58, {
      color: P.evidence,
      alpha: speaking(t, starts, k) * restMark(P.evidence, 0.45) * p3,
      width: 2,
    });
    // The first control names its subject and impact first; the second pair, the task lead with the authority, joins
    // its name on the task lead's words, a line nearer the way, so the station changes while its four requirements are
    // spoken and its two lines stand at one width. The Chinese escalation stands whole on one authored line, in the
    // voice's words, 48 px from its neighbour below the way, as no break at its list mark keeps an even block.
    const ky = up ? LY - 46 - NAME_GAP : LY + 46 + NAME_GAP;
    const key = Array.isArray(keys[k]) ? keys[k] : [keys[k]];
    key.forEach((part, j) =>
      nameText(part, x, ky + (up ? j - key.length + 1 : j) * labelSize(LABEL) * LEADING, {
        valign: up ? "bottom" : "top",
        width: Array.isArray(keys[k]) ? Infinity : L(300, Infinity),
        alpha: p3 * listIn(t, starts, k) * (j ? named(t, ats[Math.min(j + 1, ats.length - 1)]) : 1),
        set: "controls",
      }),
    );
  });
  // Once every gate is open the change's way runs through them all into the vault.
  const passAt = lockAts.at(-1).at(-1);
  link(CX0 + 30, LY, VX - 12, LY, {
    color: P.authority,
    width: 3,
    alpha: p3,
    draw: { t, at: passAt + 0.05 },
  });
}

/* Stage 4: the high-risk actions converging on the lock the decision owner holds, and the Agent that cannot approve. */
export function s14Approval(s, t, risky, ownerAt, approveAt, agentAt, cannotAt, highCut, p4) {
  const actions = en
    ? [
        "High-risk use admission",
        "Permission changes",
        "Production releases",
        "Deletion or overwrite",
        "Irreversible actions",
      ]
    : ["高风险的用途准入", "权限变更", "生产发布", "删除覆盖", "不可逆的操作"];
  const ownerName = L("决策负责人", "Decision owner"),
    mayAt = cue(s, "可以在委托范围内", "may implement");
  // What the Agent may do stands in two lines in English, broken between its two phrases, so the left column stays about
  // as narrow as its other names; the Chinese stands on one line, as no break at its list mark keeps an even block, and
  // the left column widens to take it.
  const agentTerm = [L("智能体", "Agent")],
    agentQual = en ? ["may implement", " or help verify"] : ["委托范围内去做、帮忙核验"];
  // The names of the marks on the lock's axis, the owner, the approval, the refusal and the Agent, stand in one column
  // left of it, ending a name gap from its widest mark, the owner; the actions' names stand in their own column right.
  // The stage is centred on the two columns, measured in each edition.
  const LY = 520,
    AY = LY + 300,
    OY = LY - 210,
    inset = 15 * 1.8 * 1.55 + NAME_GAP;
  const leftW = Math.max(
    measure(ownerName),
    measure(L("批准", "Approve")),
    42 + measure(L("不能批准", "Cannot approve")),
    measure(agentTerm[0]),
    ...agentQual.map((v) => measure(v.trim(), NOTE) - hangOf(v.trim(), "right", NOTE)),
  );
  // The Chinese left column widens only when its long gloss arrives, so the stage stands centred without it until then.
  const leftBefore = Math.max(
    measure(ownerName),
    measure(L("批准", "Approve")),
    42 + measure(L("不能批准", "Cannot approve")),
    measure(agentTerm[0]),
  );
  // The Chinese column stands from the cut with only its count named, so until the first action is named the stage
  // stands 66 px right, centred on the owner and the count, and eases to its place on that action's words.
  const early = en ? 0 : 66 * (1 - glide(t, risky[0] - 0.25, 66));
  const lockX =
      960 +
      early -
      (300 +
        18 +
        NAME_GAP +
        Math.max(...actions.map((v) => measure(v))) -
        inset -
        L(mix(leftBefore, leftW, soon(t, mayAt - 0.2, 0.5)), leftW)) /
        2,
    mx = lockX + 300,
    busX = lockX + 160;
  const edge = lockX - inset;
  const approve = soon(t, approveAt + 0.05, 0.45);
  // The lock appears shut where the ways meet on the word that approves, takes the owner's colour and opens.
  lock(lockX, LY, {
    closed: 1 - approve,
    color: blend(P.muted, P.authority, approve),
    alpha: p4 * ramp(t, approveAt - 0.15, 0.3),
    size: 1.5,
  });
  nameText(L("批准", "Approve"), edge, LY, {
    align: "right",
    color: P.authority,
    alpha: p4 * named(t, approveAt),
  });
  // In Chinese the count and the column's five places stand from the cut, on the words that count them, so the column
  // stands whole and does not reflow; in English it builds toward its centre.
  const drop = en ? building(t, risky) : 0;
  if (!en) {
    stroke(
      () =>
        risky.forEach((_, i) => {
          const y = LY + (i - 2) * 120;
          ctx.moveTo(mx + 13, y);
          ctx.arc(mx, y, 13, 0, Math.PI * 2);
        }),
      { color: P.muted, alpha: p4, width: 2.5 },
    );
    nameText("五类事", mx + 18 + NAME_GAP, LY - 300, {
      align: "left",
      color: P.muted,
      alpha: p4 * named(t, highCut),
    });
  }
  risky.forEach((at, i) => {
    const y = LY + (i - 2) * 120 + drop,
      q = ramp(t, at - 0.15, 0.4) * p4,
      lit = speaking(t, risky, i);
    // Each action's mark fills on its own words and lights while it is named, and its way draws on toward the lock.
    ring(mx, y, 18, { color: P.unknown, alpha: lit * restMark(P.unknown, 0.7) * p4, width: 2 });
    dot(mx, y, 8 + 2 * lit, { color: P.unknown, alpha: q });
    // Each way draws on over at least 0.9 s, since its mark is still dropping into place as it sets off.
    link(mx - 24, y, lockX + 36, LY, {
      route: "hvh",
      mid: busX,
      alpha: q,
      width: 3,
      draw: { t, at: at - 0.1, least: 0.9 },
    });
    nameText(actions[i], mx + 18 + NAME_GAP, y, {
      align: "left",
      alpha: p4 * listIn(t, risky, i),
      set: "high-risk",
    });
  });
  // The Chinese opens on the five kinds the owner must approve, so the owner stands from the cut and is named as the
  // clause that names it begins; the English names the owner first, on its own words.
  const ownerFrom = en ? ownerAt : cue(s, "必须", "") - 0.2,
    ow = (en ? ramp(t, ownerAt - 0.15, 0.4) : 1) * p4;
  person(lockX, OY, { color: P.authority, alpha: ow, size: 1.8 });
  nameText(ownerName, edge, OY, {
    align: "right",
    color: P.authority,
    alpha: p4 * named(t, ownerFrom),
  });
  link(lockX, OY + 46, lockX, LY - 44, {
    color: P.authority,
    alpha: ow,
    draw: { t, at: approveAt - 0.1 },
    width: 2.5,
  });
  const ag = ramp(t, agentAt - 0.15, 0.4) * p4,
    delegAt = cue(s, "委托范围内", "within its delegation");
  agent(lockX, AY, { alpha: ag });
  // The Agent's delegation closes round it on the words that bound its work, solid as every delegation boundary is.
  ring(lockX, AY, 40, {
    color: P.evidence,
    alpha: ag * ramp(t, delegAt - 0.1, 0.3),
    width: 2.5,
    draw: { t, at: delegAt + 0.05 },
  });
  // The Agent's name stands level with it and what it may do under its name, both ending at the column's edge.
  termRow(t, agentTerm, [agentAt], agentQual, [mayAt], edge, AY - labelSize(LABEL) / 2, {
    width: leftW,
    inline: false,
    align: "right",
    alpha: p4,
    color: P.evidence,
    set: "agent",
  });
  const go = soon(t, cannotAt - 0.1, 0.5),
    barY = (AY - 32 + LY + 28) / 2,
    no = ramp(t, cannotAt + 0.05, 0.3);
  link(lockX, AY - 32, lockX, LY + 28, {
    alpha: ag * ramp(t, cannotAt - 0.1, 0.2),
    upto: 0.46 * go,
    end: false,
    dash: [8, 8],
  });
  line(lockX - 24, barY, lockX + 24, barY, { color: P.unknown, alpha: no * p4, width: 4 });
  rejectedName(L("不能批准", "Cannot approve"), edge - 42, barY, {
    align: "right",
    alpha: p4 * named(t, cannotAt),
    mark: no,
  });
}

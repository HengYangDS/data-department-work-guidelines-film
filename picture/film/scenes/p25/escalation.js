/* 25's closing stage: the report that escalates a risk. */

import { blend } from "../../drawing/colour.js";
import { link } from "../../drawing/links.js";
import { s23Page } from "../../drawing/pages.js";
import { box, dot, line, measure } from "../../drawing/strokes.js";
import { check, clock, person, ring, shield } from "../../drawing/symbols.js";
import { listIn, named } from "../../naming/lists.js";
import { nameText } from "../../naming/names.js";
import { P } from "../../palette.js";
import { L, en } from "../../timeline.js";
import { cue } from "../../timing/cues.js";
import { mix, ramp, soon } from "../../timing/easing.js";
import { glide } from "../../timing/pace.js";
import { pauseHold } from "../../timing/pauses.js";

/* Stage 5: the report assembling the four parts of an escalated risk, so that a decision can be made. */
export function s25Escalation(
  s,
  t,
  escalate,
  risk,
  facts,
  impact2,
  safe,
  contain,
  effect,
  options,
  costs,
  recommend,
  who,
  g4,
) {
  const names = en
    ? ["Risk or blocker", "Impact", "Containment", "Decision"]
    : ["风险或障碍", "影响", "控制影响", "决定"];
  const GW = 320,
    nameW = Math.max(...names.map((v) => measure(v))),
    SW = GW + 40,
    PW = 28 + nameW + 32 + SW + 24,
    HEAD = 96,
    SH = 96,
    STEP = 32;
  // The second part arrives on its first words, which name the impact.
  const starts = [risk, Math.min(facts, impact2), contain, options],
    grown = starts.map((at) => soon(t, pauseHold(at - 0.5, 0.4), 0.35));
  // The report stands where it centres with the person who must decide 200 px beyond it and their clock (305 px in all).
  const PX = 960 - PW / 2 - 152;
  const PY = 380 - STEP * grown.slice(1).reduce((a, b) => a + b, 0),
    SX = PX + 28 + nameW + 32,
    gx = SX + SW / 2;
  const tops = starts.map((_, k) => PY + HEAD + k * (SH + 12)),
    mids = tops.map((v) => v + SH / 2);
  const length = grown.reduce((h, q, k) => h + (k ? SH + 12 : SH + 24) * q, HEAD);
  s23Page(PX, PY, PW, length, { alpha: g4 });
  nameText(L("上报风险", "Escalating a risk"), PX + 28, PY + HEAD / 2, {
    align: "left",
    alpha: g4 * named(t, escalate),
  });
  // A part slides into its place from the right, and its name stands on the page beside the place; the part returns
  // the offset its contents still carry.
  const attach = (k) => {
    const dx = 32 * (1 - soon(t, starts[k] - 0.1, 0.5));
    box(SX + dx, tops[k], SW, SH, {
      fill: P.row,
      stroke: P.ink,
      alpha: ramp(t, starts[k] - 0.15, 0.4) * g4,
      radius: 10,
      width: 2,
    });
    nameText(names[k], PX + 28, mids[k], {
      align: "left",
      alpha: g4 * listIn(t, starts, k),
      set: "parts",
    });
    return dx;
  };
  const on = (at) => ramp(t, at - 0.15, 0.4) * g4;
  // The risk itself.
  {
    const x = gx + attach(0),
      y = mids[0];
    dot(x, y, 13, { color: P.unknown, alpha: on(risk) });
    ring(x, y, 26, { color: P.unknown, alpha: on(risk), width: 2.5 });
    ring(x, y, 38, { color: P.unknown, alpha: on(risk), width: 2 });
  }
  // The facts, the impact spreading from the risk, and the latest time a decision is still in time: the time from
  // now runs safe up to its mark and unsafe after it.
  {
    const x = gx + attach(1),
      y = mids[1],
      run = soon(t, safe + 0.05, 0.7);
    s23Page(x - 154, y - 31, 48, 62, { alpha: on(facts), rows: 3 });
    dot(x - 46, y, 7, { color: P.unknown, alpha: on(impact2) });
    ring(x - 46, y, mix(7, 26, soon(t, impact2 + 0.05, 0.6)), {
      color: P.unknown,
      alpha: on(impact2),
      width: 2,
    });
    dot(x + 14, y, 6, { color: P.ink, alpha: on(safe) });
    line(x + 14, y, mix(x + 14, x + 112, run), y, {
      color: P.evidence,
      alpha: on(safe),
      width: 3.5,
    });
    line(x + 112, y - 24, x + 112, y + 24, {
      color: P.authority,
      alpha: on(safe) * ramp(t, safe + 0.4, 0.3),
      width: 4,
    });
    line(x + 120, y, x + 156, y, {
      color: P.unknown,
      alpha: on(safe) * ramp(t, safe + 0.6, 0.3),
      width: 2.5,
    });
  }
  // The containment tried, and how well it held: a gauge fills to its share.
  {
    const x = gx + attach(2),
      y = mids[2],
      held = soon(t, effect + 0.05, 0.8);
    shield(x - 112, y, 34, { color: P.evidence, alpha: on(contain), fillColor: P.row });
    check(x - 112, y + 2, 26, { color: P.evidence, alpha: on(contain) });
    box(x - 52, y - 13, 200, 26, { stroke: P.line, alpha: on(effect), radius: 13, width: 2 });
    box(x - 47, y - 8, mix(16, 118, held), 16, {
      fill: P.evidence,
      alpha: on(effect),
      radius: 8,
    });
  }
  // The decision: its options, each with its cost beneath it, and the recommended one marked; the options draw on the
  // word that names them.
  {
    const x = gx + attach(3),
      y = mids[3],
      pick = ramp(t, recommend - 0.15, 0.4),
      optionsAt = cue(s, "选项", "the options");
    [x - 70, x + 46].forEach((ox, i) => {
      box(ox - 40, y - 34, 80, 42, {
        fill: P.ground,
        stroke: i ? blend(P.ink, P.evidence, pick) : P.ink,
        alpha: on(optionsAt),
        radius: 8,
        width: 2,
      });
      if (i) check(ox, y - 13, 26, { alpha: pick * g4 });
      dot(ox, y - 13, 6, { color: P.ink, alpha: on(optionsAt) * (i ? 1 - pick : 1) });
      line(ox - 36, y + 24, ox - 36 + [66, 32][i], y + 24, {
        color: P.unknown,
        alpha: on(costs),
        width: 7,
      });
    });
  }
  // Who must decide, and by when: the person beside the report lights, the report goes to them, and the time they
  // must decide by stands with them.
  // The report's way draws on to them as a glide and ends in its point, which grows in as the way arrives.
  const DX = PX + PW + 200,
    DY = mids[1] + 54,
    go = glide(t, who + 0.05, DX - 48 - PX - PW - 14);
  person(DX, DY + 10, {
    color: blend(P.muted, P.authority, ramp(t, who - 0.15, 0.4)),
    alpha: g4,
    size: 1.4,
  });
  link(PX + PW + 14, DY, DX - 48, DY, {
    color: P.authority,
    alpha: on(who),
    upto: go,
    width: 2.5,
  });
  clock(DX + 80, DY - 34, 24, {
    color: P.authority,
    alpha: on(cue(s, "在什么时候决定", "by when")),
    hand: 0.8,
  });
}

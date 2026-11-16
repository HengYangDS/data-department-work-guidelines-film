/* 13's roles of the change as responsibilities a holder can carry. */

import { ctx } from "../../canvas.js";
import { blend } from "../../drawing/colour.js";
import { since } from "../../drawing/flows.js";
import { restMark } from "../../drawing/levels.js";
import { link } from "../../drawing/links.js";
import {
  along,
  box,
  dot,
  fill,
  labelSize,
  line,
  measure,
  path,
  stroke,
} from "../../drawing/strokes.js";
import { check, person, ring } from "../../drawing/symbols.js";
import { building, listIn, named, speaking } from "../../naming/lists.js";
import { NAME_GAP, nameText } from "../../naming/names.js";
import { growName } from "../../naming/parts.js";
import { RAIL_ROW_CLEAR } from "../../naming/placement.js";
import { rejectedName } from "../../naming/rejected.js";
import { LABEL, P } from "../../palette.js";
import { L, en } from "../../timeline.js";
import { cueFrom } from "../../timing/cues.js";
import { mix, ramp, soon } from "../../timing/easing.js";
import { drawShare, drawTime, glide } from "../../timing/pace.js";
import { STAGE_CUT } from "../../timing/stages.js";

/* Stage 3: the roles of the change, each a token in the authority colour that plays what it does. */
export function s13Responsibilities(s, t, roles, seats, coordinate, p3) {
  const names = en
    ? ["Development", "Technical owners", "Product owner", "Production", "Governance"]
    : ["开发方", "技术方", "产品负责人", "生产方", "治理方"];
  const acts = [
    ["核对关联", "checks the joins"],
    ["检查兼容性", "check compatibility"],
    ["找出", "identifies"],
    ["规划发布", "plans release"],
    ["确认", "confirms permission"],
  ].map(([a, b], i) => cueFrom(s, a, b, roles[i]));
  const [pathsAt, recoverAt, exitAt] = [
    cueFrom(s, "安排迁移", "their migration", roles[2]),
    cueFrom(s, "恢复", "recovery", roles[3]),
    cueFrom(s, "停用条件", "exit conditions", roles[4]),
  ];
  const notSeats = cueFrom(s, "不是岗位", "not seats", seats);
  const [coordAt, takeAt] = [
    cueFrom(s, "统筹", "coordinates", coordinate),
    cueFrom(s, "替各方做决定", "taking over", coordinate),
  ];
  // Where each token stands, left to right in the order the roles are named.
  // The Chinese row stands as wide as the duties under its tokens need, so the product owner's duty stands whole on
  // one line, 40 px or more from its neighbours. Once the duties have given way, as the roles are said to be
  // responsibilities, it closes up to 220 px, a glide, so the row the task lead coordinates stands compact; its short
  // names keep wide gaps at that pitch. Both rows stand at one pitch about the centre, and the lead under it.
  // As it closes up the row also moves back the 40 px it stood left for its duties, so its first token travels
  // 2 * 70 + 40 px, and the one glide that carries both is timed by that way.
  const closeUp = en ? 0 : glide(t, seats + 0.05, 2 * 70 + 40),
    PITCH = mix(L(290, 275), 220, closeUp);
  const TR = 50,
    Y = 440,
    FY = 680,
    trayY = Y + TR + 12,
    LX = 960;
  // The row stands toward its open end while it builds, two steps until the fourth role and one until the fifth, so
  // each partial row stands balanced with the joins under the centre while Development's way down to them stays
  // 50 px clear of their left end (at 740).
  // The Chinese duties end in the longest, under the last role, so the whole row with them stands 40 px further left,
  // a glide with the last role, and glides back as the duties give way and the row closes up.
  // The Chinese third duty is wide too, so the row stands 62 px further left from the third role to the fourth.
  // A step and a lean that fall on one word are one glide, timed by the way the row makes on that word: 62 px left on
  // the third role, 145 - 62 on the fourth, 145 + 40 on the fifth, and 40 back with the closing up. Timed each by its
  // own way they would add their paces.
  const STEP = L(145, 140),
    [third, fourth, fifth] = roles.slice(2).map((at) => at - 0.45);
  const shift = en
      ? building(t, roles.slice(2), STEP, 0.45)
      : 2 * STEP -
        62 * glide(t, third, 62) -
        (STEP - 62) * glide(t, fourth, STEP - 62) -
        (STEP + 40) * glide(t, fifth, STEP + 40) +
        40 * closeUp,
    xs = [-2, -1, 0, 1, 2].map((k) => 960 + k * PITCH + shift);
  const these = ramp(t, seats + 0.05, 0.3) * (1 - ramp(t, notSeats + 0.05, 0.3));
  // The joins Development checks stand under the row's centre while the roles are named, reached by one way down and
  // across from Development's token: the shared data and the calculation joined, checked on the words that say so.
  // Standing 70 px right of the centre, they balance the row's first members, which stand at its left. The Chinese
  // names them under their way on the words that say Development checks them. They give way, with that name, as the
  // roles are said to be responsibilities. In Chinese they stand 36 px lower, clear of the duties' second baseline.
  const joins = ramp(t, roles[0] + STAGE_CUT, 0.4) * (1 - ramp(t, seats + 0.05, 0.3)) * p3,
    JY = L(676, 640),
    jx = 1030;
  stroke(
    () => {
      ctx.moveTo(xs[0], Y + TR + 12);
      ctx.lineTo(xs[0], JY);
      ctx.lineTo(jx - 220, JY);
      ctx.moveTo(jx - 160, JY);
      ctx.lineTo(jx + 160, JY);
    },
    { color: P.ink, alpha: joins, width: 2.5 },
  );
  fill(() => [jx - 190, jx + 190].forEach((x) => ctx.roundRect(x - 30, JY - 20, 60, 40, 6)), {
    color: P.row,
    alpha: joins,
  });
  stroke(() => [jx - 190, jx + 190].forEach((x) => ctx.roundRect(x - 30, JY - 20, 60, 40, 6)), {
    color: P.ink,
    alpha: joins,
    width: 2.5,
  });
  check(jx, JY - 2, 24, { alpha: joins, draw: { t, at: acts[0] + 0.05 } });
  if (!en)
    nameText("核对关联", jx, JY + NAME_GAP, {
      valign: "top",
      alpha: p3 * named(t, acts[0]) * (1 - ramp(t, seats + 0.05, 0.3)),
    });
  // Five seats, one under each token, stand dashed as "not seats" begins, are refused on its words, and give way when
  // the task lead comes.
  const seatQ = p3 * ramp(t, notSeats - 0.22, 0.4) * (1 - ramp(t, coordinate + 0.05, 0.4)),
    seatY = Y + TR + 12 + 12 * 2.15;
  stroke(
    () =>
      xs.forEach((x) => {
        ctx.moveTo(x + 12, seatY - 12 * 1.15);
        ctx.arc(x, seatY - 12 * 1.15, 12, 0, Math.PI * 2);
      }),
    { color: P.muted, alpha: seatQ, width: 2, dash: [4, 4] },
  );
  stroke(
    () =>
      xs.forEach((x) => {
        ctx.moveTo(
          x + 18.6 * Math.cos(Math.PI * 1.08),
          seatY + 12 * 1.9 + 18.6 * Math.sin(Math.PI * 1.08),
        );
        ctx.arc(x, seatY + 12 * 1.9, 18.6, Math.PI * 1.08, Math.PI * 1.92);
      }),
    { color: P.muted, alpha: seatQ, width: 2.5, dash: [4, 4] },
  );
  rejectedName(L("岗位", "Seats"), 960, seatY + 60, {
    alpha: p3 * named(t, notSeats - 0.12) * (1 - ramp(t, coordinate + 0.05, 0.4)),
    mark: ramp(t, notSeats + 0.35, 0.3),
  });
  // Each token's mark plays its responsibility on the words that say it, drawn at the token's scale with its own strokes.
  // Each token rises a little earlier than its name, so the row is never left with one token for long.
  const icon = (i, x, y, q) => {
    const go = soon(t, acts[i] + 0.05, 0.6),
      u = (v) => (v * TR) / 34;
    if (i === 0) {
      dot(x - u(13), y - u(8), u(4.5), { color: P.ink, alpha: q });
      dot(x + u(13), y - u(8), u(4.5), { color: P.ink, alpha: q });
      line(x - u(8), y - u(8), x + u(8), y - u(8), { color: P.ink, alpha: q, width: 3 });
      check(x, y + u(7), u(15), { color: P.evidence, alpha: q, upto: go, width: 3.5 });
    } else if (i === 1) {
      path(
        [
          [x + u(1), y - u(11)],
          [x + u(15), y - u(11)],
          [x + u(15), y + u(11)],
          [x + u(1), y + u(11)],
        ],
        { color: P.ink, alpha: q, width: 3 },
      );
      box(mix(x - u(22), x + u(1), go), y - u(6), u(12), u(12), {
        fill: P.evidence,
        alpha: q,
        radius: 3,
      });
    } else if (i === 2) {
      [-11, 0, 11].forEach((d, k) => {
        dot(x - u(13), y + u(d), u(4), {
          color: blend(P.muted, P.evidence, ramp(t, acts[2] + 0.05 + k * 0.12, 0.25)),
          alpha: q,
        });
        link(x - u(7), y + u(d), x + u(12), y, {
          route: "hvh",
          mid: x + u(3),
          r: 5,
          color: P.evidence,
          alpha: q,
          draw: { t, at: pathsAt + 0.05 + k * 0.1 },
          end: false,
          width: 2.5,
        });
      });
      dot(x + u(15), y, u(4), { color: P.evidence, alpha: q * ramp(t, pathsAt + 0.35, 0.3) });
    } else if (i === 3) {
      path(
        along(
          [
            [x - u(17), y + u(6)],
            [x - u(3), y + u(6)],
            [x - u(3), y - u(9)],
            [x + u(17), y - u(9)],
          ],
          go,
        ).kept,
        { color: P.ink, alpha: q, width: 3 },
      );
      link(x + u(17), y - u(4), x - u(17), y + u(15), {
        route: "vh",
        r: 5,
        color: P.muted,
        alpha: q,
        upto: drawShare(
          t,
          recoverAt + 0.05,
          Math.abs(x - u(17) - (x + u(17))) + Math.abs(y + u(15) - (y - u(4))),
          0.5,
        ),
        end: false,
        dash: [4, 5],
      });
    } else {
      ring(x - u(8), y, u(9), { color: P.authority, alpha: q, width: 2.5 });
      check(x - u(8), y + u(1), u(10), { color: P.authority, alpha: q, upto: go, width: 3 });
      box(x + u(6), y - u(11), u(12), u(22), { stroke: P.ink, alpha: q, radius: 2, width: 2.5 });
      box(x + u(6), y - u(11), u(mix(12, 4, soon(t, exitAt + 0.05, 0.35))), u(22), {
        fill: P.ink,
        alpha: q * 0.8,
        radius: 2,
      });
    }
  };
  names.forEach((v, i) => {
    const x = xs[i],
      q = ramp(t, roles[i] - 0.45, 0.4) * p3,
      lit = Math.max(speaking(t, roles, i), these);
    dot(x, Y, TR, { color: P.row, alpha: q });
    ring(x, Y, TR, { color: P.authority, alpha: q, width: 2.5 });
    if (lit > 0)
      ring(x, Y, TR + 9, {
        color: P.authority,
        alpha: lit * restMark(P.authority, 0.5) * q,
        width: 2,
      });
    icon(i, x, Y, q);
    nameText(v, x, Y - TR - NAME_GAP, {
      valign: "bottom",
      alpha: p3 * listIn(t, roles, i),
      set: "roles",
    });
  });
  // The Chinese names each further duty under its role on the words that say it, whole on one line, its second part
  // joining on its own words, so every holder is read by what it does. The duties stand on two baselines at the row's
  // one pitch, every other one a rail row lower on a short stem from its role, so each stands whole and 48 px or more
  // clear of its neighbours on the other baseline; they give way with 核对关联 as the roles are said to be
  // responsibilities.
  if (!en) {
    const duties = [
      [["检查兼容性"], [acts[1]]],
      [["找出下游使用方、安排迁移"], [acts[2]]],
      [
        ["规划发布", "和恢复"],
        [acts[3], recoverAt],
      ],
      [
        ["确认使用权限", "和停用条件"],
        [acts[4], exitAt],
      ],
    ];
    const top = Y + TR + 9 + NAME_GAP,
      kept = p3 * (1 - ramp(t, seats + 0.05, 0.3));
    duties.forEach(([parts, ats], k) => {
      const low = k % 2 ? RAIL_ROW_CLEAR : 0;
      if (low)
        line(xs[k + 1], Y + TR + 12, xs[k + 1], top + low - 6, {
          alpha: kept * ramp(t, ats[0] - 0.15, 0.4),
          width: 2,
        });
      growName(t, parts, ats, xs[k + 1], top + low, {
        align: "center",
        alpha: kept,
        set: "duties",
        build: true,
      });
    });
  }
  // The task lead under the row: one way rises from it to a bracket under the five, which grows from its middle as the
  // way arrives, and it coordinates them along it; it decides for no one.
  const lead = named(t, coordinate) * p3,
    wayUp = FY - 44 - (trayY + 2),
    flowing = since(t, coordAt + 0.65);
  person(LX, FY, { size: 1.3, color: P.evidence, alpha: lead });
  nameText(L("任务负责人", "Task lead"), LX, FY + 30 + NAME_GAP, {
    valign: "top",
    color: P.evidence,
    alpha: lead,
  });
  link(LX, FY - 44, LX, trayY + 2, {
    color: P.evidence,
    alpha: lead,
    draw: { t, at: coordAt + 0.05 },
    flowing,
    end: false,
  });
  const spread = { t, at: coordAt + 0.05 + drawTime(wayUp) },
    l = xs[0] - TR - 12,
    r = xs[4] + TR + 12;
  [l, r].forEach((x) =>
    path(
      [
        [LX, trayY],
        [x, trayY],
        [x, trayY - 10],
      ],
      { color: P.evidence, alpha: lead, width: 2.5, draw: spread },
    ),
  );
  // The refusal is spoken with its phrase ("without taking over"), so the cross arrives with the words. Its words stand
  // centred on the lead's axis, under the lead's name, and the cross hangs after them.
  const takeName = L("替各方做决定", "Taking over authority");
  rejectedName(takeName, LX, FY + 30 + NAME_GAP + labelSize(LABEL) + 14, {
    valign: "top",
    alpha: p3 * named(t, takeAt),
    mark: named(t, takeAt),
    markLeft: LX + measure(takeName) / 2 + 16,
  });
}

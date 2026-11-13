/* Gears: a management mechanism as a toothed wheel, whole and under strain. Scenes 17 and 29 draw them. */

import { ctx } from "../canvas.js";
import { P } from "../palette.js";
import { stroke } from "./strokes.js";
import { ring } from "./symbols.js";

/* A gear's ten teeth outside its rim, turned by `turn` radians, drawn in one stroke so they read as the wheel's texture
 * rather than as a list of like marks each waiting for a name of its own. */
function s29Teeth(x, y, r, turn, { alpha = 1, color = P.ink } = {}) {
  stroke(
    () => {
      for (let k = 0; k < 10; k++) {
        const a = (k * Math.PI) / 5 + Math.PI / 10 + turn;
        ctx.moveTo(x + Math.cos(a) * r, y + Math.sin(a) * r);
        ctx.lineTo(x + Math.cos(a) * (r + r * 0.24), y + Math.sin(a) * (r + r * 0.24));
      }
    },
    { color, alpha, width: r * 0.12, cap: "butt" },
  );
}
/* A gear standing for a management mechanism: ten teeth outside a rim and a hub, turned by `turn` radians. */
export function s29Gear(x, y, r, { turn = 0, alpha = 1, color = P.ink } = {}) {
  s29Teeth(x, y, r, turn, { color, alpha });
  ring(x, y, r, { color, alpha, width: r * 0.06 });
  ring(x, y, r * 0.26, { color, alpha, width: 4 });
}
/* The management system under strain: the same gear as s29Gear, but its rim stops just short of closing under one tooth,
 * so the wheel reads as one mark rather than an empty ring. Used only by scene 29's strain stage. */
export function s29Wheel(x, y, r, { turn = 0, alpha = 1, color = P.ink } = {}) {
  s29Teeth(x, y, r, turn, { color, alpha });
  ring(x, y, r, { color, alpha, width: r * 0.06, start: Math.PI / 10 + turn + 0.03, upto: 0.99 });
  ring(x, y, r * 0.26, { color, alpha, width: 4 });
}

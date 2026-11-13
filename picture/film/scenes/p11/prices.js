/* 11's price history: the vendor's closes as the chart draws them, the corrected course and the scale they are read
 * on. Scene 13 samples its own course with the same series. */

import { clamp, mix } from "../../timing/easing.js";

export const X0 = 300,
  X1 = 1600;
export const DEC = [560, 800, 1040],
  CORR = [460, 1060],
  CORR_DATE = 1300;
/* The vendor's price history: one close per trading day (DAY px apart) around a slow course, so it reads as a market
 * record rather than a smooth curve. Each day's move is a fixed pseudo-random draw, so every frame and every copy of the
 * chart shows the same history. */
export const DAY = 10;
const dayMove = (i) => {
  const v = Math.sin(i * 12.9898 + 78.233) * 43758.5453;
  return v - Math.floor(v) - 0.5;
};
export function priceAt(x) {
  const u = (x - X0) / (X1 - X0),
    d = (x - X0) / DAY,
    i = Math.floor(d),
    w = Math.floor(d / 4);
  const day =
    mix(dayMove(i), dayMove(i + 1), d - i) * 13 +
    mix(dayMove(w + 500), dayMove(w + 501), d / 4 - w) * 10;
  return (
    520 -
    72 * Math.sin(u * 5.1 + 0.4) -
    38 * Math.sin(u * 13.7 + 1.2) -
    16 * Math.sin(u * 31.3) +
    60 * u +
    day
  );
}
/* The close at x as a price: the chart's height read on a fictional scale near the opening card's values. */
export const priceLabel = (x) => (101.2 - (priceAt(x) - 552) * 0.004).toFixed(2);
export function corrected(x) {
  const w = clamp((x - CORR[0]) / 40) * clamp((CORR[1] - x) / 40);
  return priceAt(x) - 34 * w * (0.6 + 0.4 * Math.sin((x - CORR[0]) / 55));
}
export const series = (fn, a = X0, b = X1, step = 6) => {
  const p = [];
  for (let x = a; x <= b; x += step) p.push([x, fn(x)]);
  return p;
};

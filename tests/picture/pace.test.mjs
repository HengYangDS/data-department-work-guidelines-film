/* The timing helpers `ride` and `glideYield` of picture/film/timing/pace.js, on a film of one thought, where the voice
 * clock is the film's clock: a mark never moves faster than a glide, however quickly its stops are named and whatever
 * glide carries its way. */
import test from "node:test";
import assert from "node:assert/strict";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

const words = [{ text: "one", start: 1, end: 1.2 }];
globalThis.window = {
  FILM: {
    edition: "en",
    render_offset: 0,
    duration: 100,
    captions: [],
    segments: [{ id: "01", text: "one", utterance_groups: ["one"], words, start: 0, end: 100 }],
  },
};
const noop = () => {};
const ctx = new Proxy(
  {},
  { get: (o, k) => (k in o ? o[k] : noop), set: (o, k, v) => ((o[k] = v), true) },
);
globalThis.document = {
  getElementById: (id) =>
    id === "picture" ? { getContext: () => ctx } : { dataset: { width: "1920" } },
};
const { GLIDE_PEAK, glide, glideTime, glideYield, ride } = await import(
  pathToFileURL(resolve(process.cwd(), "picture/film/timing/pace.js")).href
);

const DT = 1 / 600;
/* The fastest pace of x(t) over [a, b], in px/s. */
const fastest = (x, a, b) => {
  let peak = 0;
  for (let t = a; t < b; t += DT) peak = Math.max(peak, Math.abs(x(t + DT) - x(t)) / DT);
  return peak;
};

test("a ride alone is a glide to its stop", () => {
  for (const t of [9.9, 10, 10.2, 10.5, 11, 12])
    assert.equal(ride(t, 320, [540], [10]), 320 + 220 * glide(t, 10, 220));
});

test("rides whose stops are named apart stay separate glides", () => {
  const x = (t) => ride(t, 0, [200, 400], [10, 12]);
  assert.equal(x(11.5), 200);
  assert.equal(x(14), 400);
  assert.equal(x(12.3), 200 + 200 * glide(12.3, 12, 200));
});

test("rides named faster than a glide takes are one move at the glide's pace", () => {
  // Six stations at uneven pitch, named as the Chinese 14.1 names its stages: a glide of 220 px takes 0.98 s, and
  // the last four stages are named 0.56 s apart.
  const stops = [440, 640, 860, 1090, 1320, 1640],
    starts = [0, 0.56, 1.61, 2.17, 2.74, 3.3].map((v) => 10 + v);
  const x = (t) => ride(t, 320, stops, starts);
  const peak = fastest(x, 9, 20);
  assert.ok(peak <= GLIDE_PEAK + 0.5, `peak ${peak}`);
  assert.ok(peak >= GLIDE_PEAK - 0.5, `peak ${peak}`);
  assert.equal(x(9.99), 320);
  assert.equal(x(20), stops.at(-1));
  // It never turns back, and it is at rest at both ends.
  for (let t = 9; t < 20; t += DT) assert.ok(x(t + DT) >= x(t) - 1e-9);
  assert.ok(fastest(x, 10, 10.02) < 20);
  // The first two rides are one move and the last four another, from 640: 1000 px at the glide's pace and its ramp.
  assert.equal(x(11.6), 640);
  const done = 11.61 + 1000 / GLIDE_PEAK + 0.5;
  assert.ok(x(done - 0.02) < stops.at(-1) && x(done) === stops.at(-1));
  assert.ok(fastest(x, done - 0.02, done) < 20);
});

test("however quickly its stops are named, a ride keeps the glide's pace where nested glides compound", () => {
  const stops = [1, 2, 3, 4, 5, 6].map((k) => 320 + 220 * k),
    starts = stops.map((_, k) => 10 + 0.3 * k);
  const x = (t) => ride(t, 320, stops, starts);
  const nested = (t) =>
    stops.reduce(
      (at, stop, k) => at + (stop - at) * glide(t, starts[k], stop - (k ? stops[k - 1] : 320)),
      320,
    );
  assert.ok(fastest(x, 9, 20) <= GLIDE_PEAK + 0.5, `ride ${fastest(x, 9, 20)}`);
  assert.ok(fastest(nested, 9, 20) > 450, `nested ${fastest(nested, 9, 20)}`);
  assert.equal(x(20), nested(20));
});

test("a short joined move is one glide over its whole way", () => {
  const x = (t) => ride(t, 0, [60, 120], [10, 10.3]);
  assert.equal(x(10.3), 120 * glide(10.3, 10, 120));
  assert.ok(fastest(x, 9, 12) <= GLIDE_PEAK + 0.5);
});

test("a ride back the other way is its own glide", () => {
  const x = (t) => ride(t, 0, [300, 100], [10, 10.4]);
  assert.equal(x(20), 100);
});

test("a flow carried by a glide yields its pace to the glide's", () => {
  // A dot at FLOW px/s along a way that a glide of 500 px carries the same way.
  const FLOW = 160,
    d = 500,
    T = glideTime(d);
  const dot = (t) => d * glide(t, 10, d) + FLOW * (t - 8 - glideYield(t, 10, d));
  const peak = fastest(dot, 8, 10 + T + 2);
  assert.ok(peak <= GLIDE_PEAK + 0.5, `peak ${peak}`);
  // Unyielding, it would add its pace to the glide's.
  assert.ok(fastest((t) => d * glide(t, 10, d) + FLOW * (t - 8), 8, 10 + T + 2) > 450);
  // The flow's clock never runs back, gives nothing up before the glide and d / GLIDE_PEAK seconds in all.
  for (let t = 8; t < 10 + T + 2; t += DT)
    assert.ok(t + DT - glideYield(t + DT, 10, d) >= t - glideYield(t, 10, d) - 1e-9);
  assert.equal(glideYield(9.9, 10, d), 0);
  assert.ok(Math.abs(glideYield(10 + T + 1, 10, d) - d / GLIDE_PEAK) < 1e-9);
});

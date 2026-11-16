/* The tip-drawn stroke of picture/film/timing/pace.js (`drawnShare`), on a film of one segment and two thoughts: a
 * stroke never rests part-drawn through the quiet after its thought, however late in the thought its words come
 * (review round 41, Z41-1: a bracket 460 px long, named on its thought's last two words, stood at three fifths through
 * the quiet and left with its stage). */
import test from "node:test";
import assert from "node:assert/strict";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

const word = (text, start, end) => ({ text, start, end });
// "zero." then a quiet; "one two three four five, six." (its last clause one word); a quiet of one second; "seven."
const words = [
  word("zero", 1, 1.3),
  word("one", 3, 3.3),
  word("two", 3.3, 3.6),
  word("three", 3.6, 3.9),
  word("four", 3.9, 4.2),
  word("five", 4.2, 4.5),
  word("six", 4.6, 4.9),
  word("seven", 5.9, 6.2),
];
globalThis.window = {
  FILM: {
    edition: "en",
    render_offset: 0,
    duration: 100,
    captions: [],
    segments: [
      {
        id: "01",
        text: "zero. one two three four five, six. seven. ",
        utterance_groups: ["zero. ", "one two three four five, six. ", "seven. "],
        words,
        start: 0,
        end: 100,
      },
    ],
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
const at = (file) => pathToFileURL(resolve(process.cwd(), "picture/film", file)).href;
const { DRAW_PACE, drawTime, drawnShare } = await import(at("timing/pace.js"));
const { HOLD } = await import(at("timing/pauses.js"));

// The quiet after the second thought, from the voice clock's rest to its resuming.
const QUIET = [4.9 + HOLD, 5.9 - HOLD];
const share = (t, cue, length, least) => drawnShare({ t, at: cue, least }, length);

test("a stroke that fits after its words sets off on them", () => {
  // 100 px takes 0.4 s; named on "three" it is whole long before the thought's last word.
  assert.equal(share(3.59, 3.6, 100), 0);
  assert.ok(share(3.8, 3.6, 100) > 0 && share(3.8, 3.6, 100) < 1);
  assert.equal(share(4.01, 3.6, 100), 1);
});

test("a long stroke named on its thought's last word is whole when the voice comes to rest", () => {
  // 460 px takes 0.84 s at the tip pace; named on "six", 0.3 s before the thought ends, it cannot fit in its clause.
  const length = 460,
    need = drawTime(length);
  assert.ok(need > 0.8 && 4.6 + need > QUIET[0]);
  for (const t of [QUIET[0], (QUIET[0] + QUIET[1]) / 2, QUIET[1]])
    assert.equal(
      share(t, 4.6, length),
      1,
      `at ${t} s the stroke stands at ${share(t, 4.6, length)}`,
    );
  // It set off before its clause, inside its thought, and it is whole 0.3 s before the thought's last word ends.
  assert.equal(share(3, 4.6, length), 0);
  assert.ok(share(4.3, 4.6, length) > 0 && share(4.3, 4.6, length) < 1);
  assert.equal(share(4.61, 4.6, length), 1);
});

test("a stroke longer than its thought takes the time there is, and is still whole at the rest", () => {
  // 1,200 px would take 2.2 s; the thought's voice runs for less from its first word to its rest.
  const length = 1200;
  assert.ok(drawTime(length) > 2);
  assert.equal(share(3, 4.6, length), 0);
  assert.ok(share(4, 4.6, length) > 0 && share(4, 4.6, length) < 1);
  for (const t of QUIET)
    assert.equal(
      share(t, 4.6, length),
      1,
      `at ${t} s the stroke stands at ${share(t, 4.6, length)}`,
    );
  // Its tip then runs faster than the tip pace, which the scan of drawn tips reads (under 900 px/s in the films).
  assert.ok((1.5 * length) / 1.9 > DRAW_PACE);
});

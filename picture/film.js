/* DDWG: a working guideline explained through its objects, processes and relations. */
"use strict";
const film = window.FILM;
const canvas = document.getElementById("picture");
/* The drawing context; the search for a scene's first legible label swaps in a measuring context while it surveys the opening. */
let ctx = canvas.getContext("2d", {alpha: false});
const resolution = Number(document.getElementById("film").dataset.width) / 1920;
const P = {ground: "#0F1519", row: "#1E2932", line: "#63758B", ink: "#ECE8DF", muted: "#9BA8B1",
  evidence: "#7DB7D8", authority: "#E0BF78", unknown: "#C9785C"};
const en = film.edition === "en";
const L = (zh, english) => en ? english : zh;
/* One label size for both editions: the film's labels read at one size, 29 px after the label scale below. */
const LABEL = 26;
/* Scene labels are drawn this much larger than their layout size so they stay legible on small screens; captions,
 * chapter cards and title cards keep their own sizes. */
const TYPE = 1.12;
const clamp = q => Math.max(0, Math.min(1, q));
const mix = (a, b, q) => a + (b - a) * q;
const ease = q => { q = clamp(q); return q * q * (3 - 2 * q); };
const easeOut = q => { q = clamp(q); return 1 - Math.pow(1 - q, 3); };
const units = v => v.replace(/[^\p{L}\p{N}]/gu, "").toLowerCase();
const ramp = (t, start, duration = .7) => ease((t - start) / duration);
/* Movement easing: the standard curve cubic-bezier(.4, 0, .2, 1). A movement leaves rest gently, travels quickly and
 * settles softly, so it neither snaps into motion nor stops dead. */
const bezier = (x1, y1, x2, y2) => q => {
  q = clamp(q);
  let u = q;
  for (let i = 0; i < 8; i++) {
    const x = 3 * (1 - u) ** 2 * u * x1 + 3 * (1 - u) * u ** 2 * x2 + u ** 3 - q;
    const dx = 3 * (1 - u) ** 2 * x1 + 6 * (1 - u) * u * (x2 - x1) + 3 * u ** 2 * (1 - x2);
    if (Math.abs(x) < 1e-5 || Math.abs(dx) < 1e-6) break;
    u = clamp(u - x / dx);
  }
  return 3 * (1 - u) ** 2 * u * y1 + 3 * (1 - u) * u ** 2 * y2 + u ** 3;
};
const standard = bezier(.4, 0, .2, 1);
const soon = (t, start, duration = .55) => standard((t - start) / duration);
/* A structural glide (a stage re-centring as it grows, a list closing up, a mark carried to its place) moves `d` px from
 * `start` on the smootherstep curve, 6x⁵ - 15x⁴ + 10x³, whose pace rises from rest and falls back to it with no jerk, so
 * even sampled at 30 frames a second it neither sets off nor stops at a visible pace; it peaks at 1.875 times its mean
 * pace, and the glide lasts at least `min` seconds and long enough that its pace peaks at GLIDE_PEAK px/s, well within
 * what the eye follows at 1080p. It advances in voice time, so a glide still under way when a thought ends rests with
 * the voice clock and finishes on the next words. Returns the share of the move made at t. */
const GLIDE_PEAK = 450, GLIDE_MIN = .6;
const smoother = q => { q = clamp(q); return q * q * q * (q * (q * 6 - 15) + 10); };
const glideTime = (d, min = GLIDE_MIN) => Math.max(min, 1.875 * Math.abs(d) / GLIDE_PEAK);
const glide = (t, start, d, min = GLIDE_MIN) => smoother((voiceTime(t) - voiceTime(start)) / glideTime(d, min));
/* A stroke drawing on, solid or dashed, as only its tip moves: the smoothstep curve in voice time, at least `least`
 * seconds and otherwise long enough that its tip peaks at DRAW_PACE px/s, under the 900 px/s at which a mark races: a
 * smoothstep's tip peaks at 1.5 times its mean pace. Returns the share of a stroke `length` px long drawn at t from `at`. */
const DRAW_PACE = 820;
const drawTime = (length, least = .4) => Math.max(least, 1.5 * Math.abs(length) / DRAW_PACE);
const drawShare = (t, at, length, least = .4) => ease((voiceTime(t) - voiceTime(at)) / drawTime(length, least));
/* The share of a change `d` px long, a frame's edge widening or deepening, made at the same tip pace and complete at
 * `end`, so a frame has taken its new size before the name it makes room for is legible. It advances in voice time. */
const pacedTo = (t, end, d, least = .35) => { const T = drawTime(d, least); return ease((voiceTime(t) - voiceTime(end) + T) / T); };
/* A link, path, ring or check drawn on by `draw` ({t, at, least}) draws over `extent` (the share of its full `length` it
 * reaches) at that tip pace, so a long stroke takes longer than a short one and no tip races, and it rests with the
 * voice in a quiet. It sets off at `at`, on its words, unless it would then still be drawing as its thought's voice
 * comes to rest: it then sets off as much earlier as it needs within its clause, never before the stage that holds it
 * cut in, so it is whole by its thought's last word and never rests part-drawn through the quiet after it (see
 * drawStart). Returns the share of the full length drawn at t. */
const drawnShare = (draw, length, extent = 1) =>
  extent * ease((voiceTime(draw.t) - drawStart(draw, length * extent)) / drawTime(length * extent, draw.least ?? .4));
/* How far the quiet point a stroke drawn at that pace lands on has grown: from 0, LANDING seconds of voice time before
 * the stroke is drawn (or from its start when it draws in less), to 1 as it is drawn, so the point grows over the same
 * time however short the stroke and never appears whole within a frame. */
const LANDING = .15;
const landedShare = (draw, length, extent = 1) => {
  const time = drawTime(length * extent, draw.least ?? .4), landing = Math.min(LANDING, time);
  return ease((voiceTime(draw.t) - drawStart(draw, length * extent) - (time - landing)) / landing);
};
/* The voice time at which a stroke `length` px long drawn at the tip pace from `draw.at` sets off: `at` itself, or, when
 * it would not be whole WHOLE_BY seconds before the last word of the thought speaking at `at` ends, as much earlier as
 * that needs, but not before the first word of its clause nor before the last stage cut of its scene at or before `at`. */
const WHOLE_BY = .3;
const drawStart = (draw, length) => {
  const v = voiceTime(draw.at), by = voiceTime(thoughtEnd(draw.at) - WHOLE_BY) - drawTime(length, draw.least ?? .4);
  if (by >= v) return v;
  const cuts = [...(stageCuts.get(layout.scene) ?? [])].filter(c => c <= draw.at + 1e-6);
  return Math.min(v, Math.max(by, voiceTime(Math.max(clauseStart(draw.at), ...cuts))));
};
/* Visible from `a` to `b`. A fade that would run into the quiet between two thoughts waits for the next thought's
 * words (see pauseHold), so neither edge changes the picture in a pause. */
const span = (t, a, b, fade = .45) => ramp(t, pauseHold(a, fade), fade) * (1 - ramp(t, pauseHold(b - fade, fade), fade));
/* Within a scene one stage hands the picture to the next in a cut on the word that names the incoming stage's first
 * mark: the outgoing stage holds its words and marks until 0.18 s after that word begins, and the incoming stage
 * replaces it from that frame. The two stages never stand together, so no label meets the other stage's marks and
 * nothing ghosts, and the frame never passes through bare ground. */
const STAGE_CUT = .18;
/* Every cut a scene declares is kept per scene, so a list can be whole again before the stage that holds it leaves. */
const stageCuts = new Map();
const declareCut = at => { const id = layout.scene; if (id === null) return; const v = stageCuts.get(id) ?? new Set(); v.add(at); stageCuts.set(id, v); };
const stageOut = (t, word) => { declareCut(word + STAGE_CUT); return t < word + STAGE_CUT ? 1 : 0; };
const stageIn = (t, word) => { declareCut(word + STAGE_CUT); return t < word + STAGE_CUT ? 0 : 1; };
/* A looping flow (dots along a path, a widening pulse): each pass enters at its start and leaves at its end, so a
 * wrap never pops a mark back to its beginning. `q` is the pass phase in [0, 1). */
const pass = (q, edge = .12) => clamp(q / edge) * clamp((1 - q) / edge);
/* A flow's dot enters and leaves by its size at full ink, growing over the first FLOW_EDGE px of its way and shrinking
 * over the last (an eighth of a long way, at most half a short one), so at the flow pace it takes a few frames to
 * grow on any way; below 1.5 px it is not drawn, so the frames between two passes stand without a dot. A flow rests
 * with the voice in the quiet between thoughts, so a dot stopped near either end of its pass stays a small firm mark
 * rather than a half-faded one. `length` is the way's length in px. */
const FLOW_EDGE = 24;
const flowDot = (x, y, r, q, o, length = Infinity) => {
  const size = r * pass(q, Math.min(.5, Math.max(.12, FLOW_EDGE / length)));
  if (size >= 1.5) dot(x, y, size, o);
};
/* A looping flow's dot travels at one calm pace, FLOW_PACE px for each second of voice time, whatever the length of its
 * way, so a short way and a long one run alike. Each pass enters at the way's start and leaves at its end by its size,
 * and the next enters one frame later, so a dot never leaps back along its way and the flow runs on without a pause.
 * `flowing` is the voice time since the flow began (see `since`), so the first dot enters at the start; `lag` holds a
 * way's first pass back by that share of a pass, so neighbouring ways do not run in step; a flow that stops begins no
 * pass after `last` (voice time since it began), and the pass under way runs to the way's end. Returns the pass phase,
 * or null between passes. */
const FLOW_PACE = 160, FLOW_GAP = 1 / 30;
const loopPhase = (flowing, length, lag = 0, last = Infinity) => {
  if (flowing === null || !(length >= 1)) return null;
  const travel = length / FLOW_PACE, period = travel + FLOW_GAP, run = flowing - lag * period;
  if (run < 0 || last === null || run - run % period + lag * period > last) return null;
  const u = run % period;
  return u < travel ? u / travel : null;
};
/* Voice time since `from`, or null before it: the clock of a looping flow that begins at `from`. */
const since = (t, from) => t >= from ? voiceTime(t) - voiceTime(from) : null;
const phraseEnd = new Map();
/* The quiet between consecutive thoughts, as [end of one thought, start of the next]. A change that would fall in
 * that quiet holds through it and happens on the next words, so the picture changes with the speech rather than in
 * a pause. */
const RECEDE = .6;
const thoughtJoins = (() => {
  const joins = [];
  let previous = null;
  for (const s of film.segments) {
    let k = 0;
    for (const group of s.utterance_groups) {
      const need = units(group).length, first = k;
      let n = 0;
      while (k < s.words.length && n < need) n += units(s.words[k++].text).length;
      if (previous !== null) joins.push([previous, s.words[first].start]);
      previous = s.words[k - 1].end;
    }
  }
  return joins;
})();
const pauseHold = (at, lasting = RECEDE) => {
  for (const [end, next] of thoughtJoins) if (at + lasting > end && at < next) return next;
  return at;
};
/* The last word's end of the thought speaking at `at`. */
const thoughtEnd = at => { for (const [end] of thoughtJoins) if (end >= at) return end; return Infinity; };
/* Voice time: the film's clock, slowed to rest in the quiet between thoughts. A scene's slow camera move, every looping
 * movement (a turn, an orbit, a sway, a flow's dots) and a movement still under way when a thought ends advance with it,
 * so they rest in the quiet between two thoughts and resume where they stopped. The clock never stops or sets off at
 * once, which a viewer sees as a stutter: over the last SETTLE seconds before HOLD after a thought's last word it eases
 * to rest, and over SETTLE seconds from HOLD before the next thought's first word it eases back to full pace, each by
 * the smoothstep curve, so a moving mark settles and sets off as a thing with weight does. The picture stands unchanged
 * from HOLD after one thought to HOLD before the next. A thought shorter than two easings shares its span between them.
 * A flow's dots enter and leave by size, so a flow at rest in the quiet leaves no half-faded dot. */
const HOLD = .05, SETTLE = .45;
/* The share of an easing's time a smoothstep easing to rest has covered at x: the integral of 3x² - 2x³. */
const covered = x => x ** 3 - x ** 4 / 2;
const easings = (() => {
  const joins = thoughtJoins.map(([end, next]) => {
    const middle = (end + next) / 2;
    return {rest: Math.min(end + HOLD, middle), resume: Math.max(next - HOLD, middle)};
  });
  joins.forEach((j, k) => {
    j.down = Math.min(SETTLE, k ? (j.rest - joins[k - 1].resume) / 2 : j.rest);
    j.up = Math.min(SETTLE, k + 1 < joins.length ? (joins[k + 1].rest - j.resume) / 2 : SETTLE);
  });
  let taken = 0;
  for (const j of joins) { j.before = taken; taken += j.down / 2 + (j.resume - j.rest) + j.up / 2; }
  return joins;
})();
const voiceTime = t => {
  let lo = 0, hi = easings.length;
  while (lo < hi) { const mid = (lo + hi) >> 1; if (easings[mid].rest - easings[mid].down <= t) lo = mid + 1; else hi = mid; }
  if (!lo) return t;
  const {rest, resume, down, up, before} = easings[lo - 1];
  if (t < rest) return t - before - down * covered((t - rest + down) / down);
  if (t < resume) return t - before - down / 2 - (t - rest);
  if (t < resume + up) { const x = (t - resume) / up; return t - before - down / 2 - (resume - rest) - up * (x - covered(x)); }
  return t - before - down / 2 - (resume - rest) - up / 2;
};
const cueCache = new Map();
let layout = {texts: [], scene: null};
let sceneFade = 1, wordFade = 1;

/* Clause boundaries of a segment's spoken text, as counts of spoken letters and digits before each boundary. */
const clauseCache = new Map();
function clauseEnds(s) {
  if (!clauseCache.has(s.id)) {
    const ends = [];
    let n = 0;
    for (const ch of s.spoken_text ?? s.text) {
      if (/[\p{L}\p{N}]/u.test(ch)) n += units(ch).length;
      else if (/[，。；：！？,.;:!?—]/u.test(ch)) ends.push(n);
    }
    clauseCache.set(s.id, ends);
  }
  return clauseCache.get(s.id);
}
/* The first word of the clause spoken at `at` (a cue may lead its word by a little): the start of the latest word that
 * begins a clause of its segment at or before `at` + 0.2 s, or -Infinity outside the words. */
const clauseStartCache = new Map();
function clauseStart(at) {
  const s = film.segments.find(v => v.words.length && v.words[0].start - .5 <= at && at <= v.words.at(-1).end + .5);
  if (!s) return -Infinity;
  if (!clauseStartCache.has(s.id)) {
    const ends = clauseEnds(s), starts = [];
    let before = 0, previous = 0;
    s.words.forEach((w, k) => {
      if (!k || ends.some(e => e > previous && e <= before)) starts.push(w.start);
      previous = before;
      before += units(w.text).length;
    });
    clauseStartCache.set(s.id, starts);
  }
  let start = -Infinity;
  for (const v of clauseStartCache.get(s.id)) { if (v <= at + .2) start = v; else break; }
  return start;
}
/* Spoken cues: the first (or last) word that begins the named phrase in this edition. */
function cue(s, zh, english, {last = false, end = false} = {}) {
  const key = `${s.id}:${zh}:${english}:${last}:${end}`;
  if (cueCache.has(key)) return cueCache.get(key);
  const target = units(L(zh, english));
  const spoken = s.words.map(w => units(w.text)).join("");
  const index = last ? spoken.lastIndexOf(target) : spoken.indexOf(target);
  if (index < 0 || !target) throw Error(`Missing spoken cue ${key}`);
  // A label keeps its emphasis until the clause that names it has been spoken, for at most 4.5 seconds.
  const clause = clauseEnds(s).find(n => n >= index + target.length) ?? spoken.length;
  let cursor = 0, first = null, close = null, said = null;
  for (const w of s.words) {
    const n = units(w.text).length;
    if (first === null && cursor + n > index) first = w.start;
    if (close === null && cursor + n >= index + target.length) close = w.end;
    if (cursor + n >= clause) { said = w.end; break; }
    cursor += n;
  }
  if (first === null || close === null) throw Error(`Unresolved spoken cue ${key}`);
  phraseEnd.set(first, Math.max(phraseEnd.get(first) ?? 0, Math.min(said ?? close, first + 4.5), close));
  const value = end ? close : first;
  cueCache.set(key, value);
  return value;
}
const cues = (s, pairs) => pairs.map(pair => cue(s, ...pair));
/* The first word of the named phrase spoken at or after `from`, for phrases the segment repeats. */
function cueFrom(s, zh, english, from) {
  const target = units(L(zh, english));
  let spoken = "";
  const starts = s.words.map(w => { const at = spoken.length; spoken += units(w.text); return at; });
  const k = s.words.findIndex(w => w.start >= from - 1e-6);
  const index = spoken.indexOf(target, k < 0 ? spoken.length : starts[k]);
  if (index < 0 || !target) throw Error(`Missing spoken cue ${s.id}:${zh}:${english} after ${from}`);
  let i = starts.length - 1;
  while (starts[i] > index) i--;
  return s.words[i].start;
}

/* Drawing primitives. Every painted text registers its box for the geometry check. */
function font(size, bold, sample) {
  const latin = !/[一-鿿]/u.test(sample);
  return `${bold ? "700 " : ""}${size}px ${latin ? (bold ? "DDWGLatinBold" : "DDWGLatin") : (bold ? "DDWGBold" : "DDWG")}`;
}
const labelSize = size => size * TYPE;
/* Display copy: an apostrophe is set as a typographic right single quote, as in the captions. */
const typeset = v => v.replaceAll("'", "\u2019");
function measure(v, size = LABEL, bold = false, role = "label") {
  v = typeset(v);
  ctx.save(); ctx.font = font(role === "label" ? labelSize(size) : size, bold, v); const w = ctx.measureText(v).width; ctx.restore(); return w;
}
/* `group` names a structural set (the roles of a chain, the states of a rail): its labels stand together while the
 * structure stands, and they are read, and counted, as one object. */
function text(v, x, y, size = LABEL, {color = P.ink, alpha = 1, align = "left", bold = false, baseline = "middle", role = "label", tracking = 0, group = null, whole = null, set = null} = {}) {
  if (alpha < .015 || !v) return null;
  v = typeset(v); whole = whole === null ? null : typeset(whole);
  ctx.save(); ctx.globalAlpha = clamp(alpha) * wordFade; ctx.font = font(role === "label" ? labelSize(size) : size, bold, v);
  ctx.letterSpacing = `${tracking}px`; ctx.textAlign = align; ctx.textBaseline = baseline; ctx.fillStyle = color;
  ctx.fillText(v, x, y);
  const m = ctx.measureText(v), tr = ctx.getTransform();
  const box = [x - m.actualBoundingBoxLeft, y - m.actualBoundingBoxAscent, x + m.actualBoundingBoxRight, y + m.actualBoundingBoxDescent];
  const toScreen = (px, py) => [(tr.a * px + tr.c * py + tr.e) / resolution, (tr.b * px + tr.d * py + tr.f) / resolution];
  const [x0, y0] = toScreen(box[0], box[1]), [x1, y1] = toScreen(box[2], box[3]);
  ctx.restore();
  // A name placed by a layout primitive carries its whole text, so a wrapped or growing name is read as one; `set` names
  // the list it belongs to, which builds and leaves as a whole.
  const record = {text: v, bounds: [Math.min(x0, x1), Math.min(y0, y1), Math.max(x0, x1), Math.max(y0, y1)], alpha: clamp(alpha) * wordFade, role, scene: layout.scene, color, group,
    whole: whole ?? v, placed: whole !== null, size, set};
  layout.texts.push(record);
  return record;
}
/* Structure strokes (the line and muted colours) are thin and often dashed, so at 1080p their antialiased pixels read
 * far fainter than their nominal ink. They are drawn at least 2 px wide, and their opacity is compensated on a concave
 * curve (1 - (1 - a)^2): a stroke at full ink is unchanged, a quiet placeholder at 0.45-0.8 stays at 0.7-0.96, at or
 * above 3:1 against the ground, and fades stay continuous. */
const STRUCTURE = new Set([P.line, P.muted]);
function stroke(build, {color = P.line, width = 2, alpha = 1, dash = null, cap = "round"} = {}) {
  if (alpha < .01) return;
  const structure = STRUCTURE.has(color), a = structure ? 1 - (1 - clamp(alpha)) ** 2 : clamp(alpha);
  ctx.save(); ctx.globalAlpha = a * sceneFade; ctx.strokeStyle = color; ctx.lineWidth = structure ? Math.max(2, width) : width; ctx.lineCap = cap; ctx.lineJoin = "round";
  if (dash) ctx.setLineDash(dash);
  ctx.beginPath(); build(); ctx.stroke(); ctx.restore();
}
function fill(build, {color = P.row, alpha = 1} = {}) {
  if (alpha < .01) return;
  ctx.save(); ctx.globalAlpha = clamp(alpha) * sceneFade; ctx.fillStyle = color; ctx.beginPath(); build(); ctx.fill(); ctx.restore();
}
const line = (x1, y1, x2, y2, o = {}) => stroke(() => { ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); }, o);
const dashed = (x1, y1, x2, y2, o = {}) => line(x1, y1, x2, y2, {dash: [8, 9], ...o});
function box(x, y, w, h, {fill: f = null, stroke: s = null, width = 2, alpha = 1, radius = 8, dash = null} = {}) {
  if (f) fill(() => ctx.roundRect(x, y, w, h, radius), {color: f, alpha});
  if (s) stroke(() => ctx.roundRect(x, y, w, h, radius), {color: s, width, alpha, dash});
}
function dot(x, y, r, {color = P.evidence, alpha = 1, hollow = false, width = 2} = {}) {
  if (hollow) stroke(() => ctx.arc(x, y, r, 0, Math.PI * 2), {color, alpha, width});
  else fill(() => ctx.arc(x, y, r, 0, Math.PI * 2), {color, alpha});
}
function path(points, {upto = 1, draw = null, ...o} = {}) {
  if (points.length < 2) return;
  // A polyline draws on along its length, so a check or a trace grows from its first point instead of adding whole
  // segments at once; with `draw` it draws on over `upto` of its length at the tip pace (drawnShare).
  if (draw) upto = drawnShare(draw, lengthOf(points), clamp(upto));
  if (upto <= 0) return;
  const drawn = upto >= 1 ? points : along(points, upto).kept;
  if (drawn.length < 2) return;
  stroke(() => drawn.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)), {width: 2.5, color: P.ink, ...o});
}
function diamond(x, y, r, {color = P.evidence, alpha = 1, solid = false, width = 2.5} = {}) {
  const build = () => { ctx.moveTo(x, y - r); ctx.lineTo(x + r, y); ctx.lineTo(x, y + r); ctx.lineTo(x - r, y); ctx.closePath(); };
  if (solid) fill(build, {color, alpha}); else stroke(build, {color, alpha, width});
}

/* Icons: people decide, Agents act inside boundaries, documents carry claims. */
/* A work item moving through a process. */
function token(x, y, {color = P.ink, alpha = 1, r = 14, hollow = false} = {}) {
  dot(x, y, r, {color, alpha, hollow, width: 3});
  if (!hollow) ring(x, y, r + 7, {color, alpha: secondStroke(color, alpha, .45), width: 2});
}
function lock(x, y, {closed = 1, color = P.authority, alpha = 1, size = 1} = {}) {
  const w = 34 * size, h = 26 * size, lift = (1 - ease(closed)) * 12 * size;
  box(x - w / 2, y - h / 2, w, h, {fill: P.row, stroke: color, alpha, radius: 5 * size, width: 2.5});
  stroke(() => ctx.arc(x, y - h / 2 - lift, w * .32, Math.PI, 0), {color, alpha, width: 3 * size});
  dot(x, y + 1, 3.5 * size, {color, alpha});
}
function clock(x, y, r, {hand = 0, color = P.ink, alpha = 1} = {}) {
  ring(x, y, r, {color, alpha, width: 2.5});
  const a = -Math.PI / 2 + Math.PI * 2 * hand;
  line(x, y, x + r * .75 * Math.cos(a), y + r * .75 * Math.sin(a), {color, alpha, width: 3});
  line(x, y, x, y - r * .5, {color, alpha: secondStroke(color, alpha, .6), width: 2});
}
function shield(x, y, r, {color = P.evidence, alpha = 1, fillColor = null} = {}) {
  const build = () => { ctx.moveTo(x, y - r); ctx.lineTo(x + r * .85, y - r * .62); ctx.lineTo(x + r * .72, y + r * .35);
    ctx.quadraticCurveTo(x + r * .4, y + r * .85, x, y + r); ctx.quadraticCurveTo(x - r * .4, y + r * .85, x - r * .72, y + r * .35);
    ctx.lineTo(x - r * .85, y - r * .62); ctx.closePath(); };
  if (fillColor) fill(build, {color: fillColor, alpha});
  stroke(build, {color, alpha, width: 2.5});
}
/* A seal stamps what a role may grant: a rim with an inner ring and a check inside. `stamp` is the opacity of the inner
 * ring and the check, so a seal's rim can stand before the seal is stamped. */
function seal(x, y, r, {color = P.authority, alpha = 1, hollow = false, stamp = alpha} = {}) {
  ring(x, y, r, {color, alpha, width: 3});
  ring(x, y, r * .74, {color, alpha: secondStroke(color, stamp, .6), width: 1.5, dash: hollow ? [5, 5] : null});
  if (!hollow) check(x, y + r * .05, r * .8, {color, alpha: stamp});
}
function person(x, y, {color = P.ink, alpha = 1, size = 1, solid = true} = {}) {
  // `solid` may be a fraction: a seat becomes a person as its outlined head fills in.
  const r = 15 * size, fillQ = solid === true ? 1 : solid === false ? 0 : clamp(solid);
  if (fillQ < 1) dot(x, y - r * 1.15, r, {color, alpha: alpha * (1 - fillQ), hollow: true, width: 2.5});
  if (fillQ > 0) dot(x, y - r * 1.15, r, {color, alpha: alpha * fillQ});
  stroke(() => ctx.arc(x, y + r * 1.9, r * 1.55, Math.PI * 1.08, Math.PI * 1.92), {color, alpha, width: 3 * size});
}
function agent(x, y, {alpha = 1, size = 1, color = P.evidence} = {}) {
  diamond(x, y, 22 * size, {color, alpha});
  dot(x, y, 4.5 * size, {color, alpha});
}
function documentIcon(x, y, w, h, {alpha = 1, stroke: s = P.ink, rows = 4, fillColor = P.row, fold = true} = {}) {
  if (alpha < .01) return;
  const c = Math.min(22, w * .2);
  fill(() => { ctx.moveTo(x, y); ctx.lineTo(x + w - c, y); ctx.lineTo(x + w, y + c); ctx.lineTo(x + w, y + h); ctx.lineTo(x, y + h); ctx.closePath(); }, {color: fillColor, alpha});
  stroke(() => { ctx.moveTo(x, y); ctx.lineTo(x + w - c, y); ctx.lineTo(x + w, y + c); ctx.lineTo(x + w, y + h); ctx.lineTo(x, y + h); ctx.closePath(); }, {color: s, alpha, width: 2});
  if (fold) stroke(() => { ctx.moveTo(x + w - c, y); ctx.lineTo(x + w - c, y + c); ctx.lineTo(x + w, y + c); }, {color: s, alpha, width: 1.5});
  for (let i = 0; i < rows; i++) {
    const ry = y + h * (.3 + i * .55 / Math.max(1, rows));
    line(x + w * .14, ry, x + w * (i % 2 ? .62 : .82), ry, {color: P.muted, alpha: alpha * .8, width: 2});
  }
}
function check(x, y, s, {color = P.evidence, alpha = 1, upto = 1, draw = null, width = 3.5} = {}) {
  path([[x - s * .5, y], [x - s * .12, y + s * .38], [x + s * .55, y - s * .42]], {color, alpha, upto, draw, width});
}
function cross(x, y, s, {color = P.unknown, alpha = 1, width = 3.5} = {}) {
  line(x - s / 2, y - s / 2, x + s / 2, y + s / 2, {color, alpha, width});
  line(x + s / 2, y - s / 2, x - s / 2, y + s / 2, {color, alpha, width});
}
function stopSign(x, y, r, {alpha = 1, color = P.unknown} = {}) {
  const build = () => { for (let i = 0; i < 8; i++) { const a = Math.PI / 8 + i * Math.PI / 4; const px = x + r * Math.cos(a), py = y + r * Math.sin(a); i ? ctx.lineTo(px, py) : ctx.moveTo(px, py); } ctx.closePath(); };
  stroke(build, {color, alpha, width: 3});
  line(x - r * .45, y, x + r * .45, y, {color, alpha, width: 4});
}
function ring(x, y, r, {color = P.evidence, alpha = 1, width = 2, upto = 1, draw = null, start = -Math.PI / 2, dash = null} = {}) {
  // With `draw` a ring draws on over `upto` of its circumference at the tip pace (drawnShare).
  if (draw) upto = drawnShare(draw, 2 * Math.PI * r, clamp(upto));
  if (upto <= 0) return;
  // An ellipse turned to the start angle and swept from zero: the renderer's browser rounds an arc that starts away
  // from zero and sweeps a whole turn in single precision, and at some start angles paints no ink at all.
  stroke(() => ctx.ellipse(x, y, r, r, start, 0, Math.PI * 2 * clamp(upto)), {color, alpha, width, dash});
}
/* A pill's word may follow the label tiers through `ink` while its frame keeps the place at `alpha`. */
function pill(label, x, y, {alpha = 1, ink = null, color = P.ink, border = P.line, fillColor = P.row, size = LABEL, align = "center", padX = 18, h = null, bold = false, dash = null, dashed = null, group = null, role = "label"} = {}) {
  if (alpha < .015) return null;
  const w = measure(label, size, bold, role) + padX * 2, height = h ?? size * TYPE + 22;
  const left = align === "center" ? x - w / 2 : align === "right" ? x - w : x;
  box(left, y - height / 2, w, height, {fill: fillColor, alpha, radius: height / 2});
  // `dashed` turns a solid outline into a dashed one gradually, keeping one set of words.
  if (dashed === null) box(left, y - height / 2, w, height, {stroke: border, alpha, radius: height / 2, dash});
  else {
    box(left, y - height / 2, w, height, {stroke: border, alpha: alpha * (1 - clamp(dashed)), radius: height / 2});
    box(left, y - height / 2, w, height, {stroke: border, alpha: alpha * clamp(dashed), radius: height / 2, dash: dash ?? [6, 6]});
  }
  text(label, left + w / 2, y + 1, size, {align: "center", color, alpha: ink ?? alpha, bold, group, role});
  return {left, right: left + w, top: y - height / 2, bottom: y + height / 2, width: w};
}
/* Visual system. A stage shows one structure, and its names stay with their marks while the stage stands, so a
 * structure is seen whole and never loses its words. Every name is placed by the rule of the structure it belongs to
 * (a rail, a ring, a column), at one gap from its mark and on one shared baseline or edge, so no scene sets words by
 * hand. Relations are carried by position, alignment and containment; where a relation must be drawn, it follows the
 * grid in straight runs and quarter turns, draws on from its source and ends in a quiet point, not an arrowhead. */
const NAME_GAP = 22, LEADING = 1.3;
/* A name arrives on its words and stays while its mark stands; it leaves with its stage or its mark. */
const named = (t, at) => ramp(t, at - .15, .4);
/* A spoken list builds: each item arrives on its own words and stays, so the whole set forms on the screen. While the
 * list is spoken, the item being named stands at full ink and the items already named share one second level; once
 * the last item has been said the whole set returns to full ink, and it leaves as a whole when the argument moves on
 * at `until`. None of these changes falls in a pause. The second level keeps every name legible: at 0.74 of full ink
 * the muted colour, the faintest colour a list's names take, still reads at 4.6:1 against the ground (ink needs 0.51,
 * authority 0.62 and evidence 0.69), so the step back never leaves a named item below 4.5:1. */
const SECOND = .74;
/* A muted qualifier or work column steps back less far: its level maps the list's level onto MUTED_SECOND at the second
 * level, scaling linearly below it, so the muted colour at the second level reads at 5.6:1 against the ground rather
 * than at the 4.6:1 floor, and the item being said still stands out by its own mark. */
const MUTED_SECOND = .83;
const mutedLevel = a => a < SECOND ? a * MUTED_SECOND / SECOND : mix(MUTED_SECOND, 1, (a - SECOND) / (1 - SECOND));
/* A mark drawn in an accent colour keeps a legible level at rest too: authority, evidence and unknown read at 4.6:1
 * against the ground at 0.62, 0.69 and 0.89 of full ink. A mark that steps back, the halo on the item being said and
 * an icon's second stroke stand at least at their colour's level, so no accent at rest falls below 4.5:1; the item
 * being said stands out by its own mark, its size or its halo, never by dimming the others below that level. A colour
 * without an accent role keeps the level it is given. */
const MARK_LEVEL = {[P.authority]: .62, [P.evidence]: .69, [P.unknown]: .89};
const restMark = (color, level = 0) => Math.max(level, MARK_LEVEL[color] ?? 0);
/* A list's level for a mark in an accent colour: the list's second level maps onto the colour's own level. */
const markLevel = (color, level) => mix(restMark(color), 1, clamp((level - SECOND) / (1 - SECOND)));
/* An icon's second stroke (a seal's inner ring, a clock's short hand, a token's outer ring) stands at its colour's
 * level, or with the icon while the icon is fainter, so it reads wherever the icon does; another colour keeps its own
 * share of the icon's ink. */
const secondStroke = (color, alpha, share) => color in MARK_LEVEL ? Math.min(alpha, MARK_LEVEL[color]) : alpha * share;
const listLevel = (t, ats, i, until = Infinity) => {
  // The set has been said once the last item's clause has ended. It is whole again within that item's own thought, so
  // the return never waits through the pause for a next thought that may already show another stage: when the clause
  // ends too close to the pause, the set returns as its last item arrives, quickly enough to settle before the pause.
  // A stage cut later in the same thought bounds the return in the same way, so the set leaves whole.
  const last = ats.at(-1), said = pauseHold(Math.max(last + 1.5, (phraseEnd.get(last) ?? last) + .3), .4);
  const cut = Math.min(...[...(stageCuts.get(layout.scene) ?? [])].filter(c => c > last && c < thoughtEnd(last)));
  const end = Math.min(thoughtEnd(last), cut);
  const done = Math.min(said, Math.max(last - .1, end - .45)), back = Math.min(.4, Math.max(.15, end - .05 - done));
  // An item dims when the next one arrives, unless the set is whole again before that dim could settle.
  const dims = i + 1 < ats.length && done - ats[i + 1] > .6;
  const level = i + 1 < ats.length ? mix(mix(1, SECOND, dims ? ramp(t, pauseHold(ats[i + 1] - .15, .3), .3) : 0), 1, ramp(t, done, back)) : 1;
  return level * (1 - ramp(t, pauseHold(until, .4), .4));
};
/* An item's ink: its entrance on its own words times its level in the list. A name whose parts arrive on their own
 * words takes the level alone, since each part brings its own entrance. */
const listIn = (t, ats, i, until = Infinity) => ramp(t, ats[i] - .15, .4) * listLevel(t, ats, i, until);
/* The item being spoken, from its words until the next item's (the last until its clause has been said): its own mark
 * lights for that time, while every name keeps one ink. */
const speaking = (t, ats, i) => {
  const until = i + 1 < ats.length ? ats[i + 1] - .15 : pauseHold(Math.max(ats[i] + 1.5, (phraseEnd.get(ats[i]) ?? ats[i]) + .3), .3);
  return ramp(t, ats[i] - .15, .3) * (1 - ramp(t, until, .3));
};
/* How much of a list has been said: each part adds its share on its own words, so a mark drawn to this share grows
 * one step per part as the parts are named. */
const saidShare = (t, ats) => ats.reduce((v, at) => v + soon(t, at + .05, .35), 0) / ats.length;
/* One beat for each part said over a single mark: the mark's ring flashes on the part's words, within its own extent,
 * so a list spoken at one place shows each part arriving. A beat swells and thins by its width at its colour's level,
 * as a flow's dot enters by its size, so it never stands as a faint ring. A station whose halo, lighting the item being
 * spoken (`lit`), stands at the beat's own radius draws both as this one ring, which swells from the halo's width on
 * each beat, so no two rings stand in one place to be taken for each other as one fades and the other swells. */
function beats(t, x, y, r, ats, {color = P.ink, alpha = 1, lit = 0} = {}) {
  const flash = Math.max(0, ...ats.map(at => { const p = clamp((t - at - .05) / .5); return p > 0 && p < 1 ? Math.sin(Math.PI * p) : 0; }));
  // Its ink follows its swell, so a beat fades in and out with its width and never ends as a hairline at its colour's
  // full level; it is never drawn thinner than 1 px.
  const level = Math.max(flash, lit);
  if (level > .02) ring(x, y, r, {color, alpha: alpha * restMark(color, .5) * level, width: Math.max(1, 3.5 * flash, lit > 0 ? 2 : 0)});
}
/* A list said member by member keeps its spoken order along its axis and stays balanced while it builds: each member
 * stands at its place in the list's final layout, and the whole list stands `step` px toward its open end for each
 * member still to come, closing one step on each further member's words as a glide. Returns that offset at t. */
const building = (t, ats, step = 48, lead = .1) => step * ats.slice(1).reduce((v, at) => v + 1 - glide(t, at - lead, step), 0);
/* The break rules of a wrapped name. An English name breaks at a phrase: no line but the last ends on a word that
 * leads into the words after it (an article, determiner, preposition, conjunction, relative or question word, or an
 * auxiliary), and a name of three or more words leaves more than one word on its last line. A block of lines keeps
 * its shape, read on the ink as the lines are painted: no line stands under four fifths of the longest, and the last
 * not under three fifths. */
const LEADS = new Set(("a an the of in on at by to for with from into onto over under about after before between through " +
  "without within against per via as than like and or but nor its their his her our your my this that these those each " +
  "every any no some which who whose whom what when where why how whether if because although though while unless " +
  "until since is are was were be been can will would should may must not").split(" "));
const lastWord = v => (v.trim().split(/\s+/).at(-1) ?? "").toLowerCase().replaceAll("’", "'").replace(/^[^\p{L}\p{N}']+|[^\p{L}\p{N}']+$/gu, "");
const phraseBreaks = lines => lines.slice(0, -1).every(v => !LEADS.has(lastWord(v)))
  && (lines.join(" ").trim().split(/\s+/).length < 3 || lines.at(-1).trim().split(/\s+/).length > 1);
function inkWidth(v, size = LABEL) {
  v = typeset(v);
  ctx.save(); ctx.font = font(labelSize(size), false, v); const m = ctx.measureText(v); ctx.restore();
  return m.actualBoundingBoxLeft + m.actualBoundingBoxRight;
}
function evenBlock(lines, size = LABEL) {
  const widths = lines.map(v => inkWidth(v, size)), top = Math.max(...widths);
  return widths.slice(0, -1).every(w => w >= .8 * top) && widths.at(-1) >= .6 * top;
}
/* Every way to cut `count` units into `n` runs, as the index where each run starts. */
function runStarts(count, n, from = 0) {
  if (n === 1) return from < count ? [[from]] : [];
  const out = [];
  for (let k = from + 1; k <= count - n + 1; k++) for (const rest of runStarts(count, n - 1, k)) out.push([from, ...rest]);
  return out;
}
/* Breaks a name into balanced lines no wider than `width`: English between words, and a Chinese name only after a
 * list or clause mark, a clause mark before a list mark where its lines fit, so no line begins inside a word. A
 * Chinese name without such a mark breaks between characters, so a name whose break would split a word is authored as
 * its lines. A name that fits stays on one line. Authored lines are kept as written: an array, or a string whose lines
 * are separated by newlines. Of the breaks that fit, an English name keeps one at a phrase, and a break whose block
 * keeps its shape is preferred to a more balanced one; where no break fits the rules, the balanced break stands, and
 * such a name is authored as its lines or given room. */
const NAME_JOINT = /[、，。；：,]$/u, CLAUSE_JOINT = /[，。；：,]$/u;
function wrapName(v, width, size = LABEL) {
  if (Array.isArray(v)) return v;
  if (typeof v === "string" && v.includes("\n")) return v.split("\n");
  if (!Number.isFinite(width) || measure(v, size) <= width) return [v];
  const latin = !/[一-鿿]/u.test(v), tokens = latin ? v.split(/(?<= )/) : [...v], splits = [];
  for (let k = 1; k < tokens.length; k++) {
    const a = tokens.slice(0, k).join("").trimEnd(), b = tokens.slice(k).join("").trimStart();
    if (!a || !b || /^[、，。；：）”]/u.test(b)) continue;
    splits.push({a, b, joint: !latin && NAME_JOINT.test(a), worst: Math.max(measure(a, size), measure(b, size))});
  }
  // A Chinese name splits at a mark whose lines fit, a clause mark first, else at any mark, and between characters
  // only when it has no mark; of the marks, one whose lines fit and keep the block's shape is kept before the others,
  // and then the split whose wider line is narrowest.
  const joints = splits.filter(s => s.joint), fitting = joints.filter(s => s.worst <= width);
  const clauses = fitting.filter(s => CLAUSE_JOINT.test(s.a));
  const pool = clauses.length ? clauses : fitting.length ? fitting : joints.length ? joints : splits;
  if (!pool.length) return [v];
  const narrowest = list => list.reduce((x, s) => (s.worst < x.worst ? s : x));
  const even = latin || pool === splits ? [] : pool.filter(s => s.worst <= width && evenBlock([s.a, s.b], size));
  const best = narrowest(even.length ? even : pool);
  let lines;
  if (best.worst <= width || tokens.length < 3) lines = [best.a, best.b];
  else {
    const [head, ...rest] = wrapName(best.a, width, size);
    lines = [head, ...wrapName([...rest, best.b].join(latin ? " " : ""), width, size)];
  }
  if (!latin || tokens.length > 16 || (phraseBreaks(lines) && evenBlock(lines, size))) return lines;
  // An English name takes, of the breaks into as many lines that fit, one at a phrase, an even block first.
  const options = runStarts(tokens.length, lines.length).map(starts => starts.map((k, i) => tokens.slice(k, starts[i + 1]).join("").trim()))
    .filter(ls => phraseBreaks(ls) && ls.every(line => measure(line, size) <= width))
    .map(ls => ({ls, even: evenBlock(ls, size), worst: Math.max(...ls.map(line => measure(line, size)))}));
  if (!options.length) return lines;
  const kept = options.filter(o => o.even);
  return (kept.length ? kept : options).reduce((x, o) => (o.worst < x.worst ? o : x)).ls;
}
/* A name of one or more lines anchored at (x, y): `valign` top hangs it below the point, bottom stands it above, and
 * middle centres it. Its lines share one edge, so a wrapped name stays one block, and it counts as one name. */
/* The ink of a final 、，。；：！？ fills only the left of its em, so a right-aligned line hangs it half an em past the
 * edge and a centred line moves 0.3 em right, and its ink keeps the edge or centre of the other lines. Every name sets
 * its lines by this rule. */
const hangOf = (line, align, size = LABEL) => /[、，。；：！？]$/u.test(line) ? (align === "right" ? .5 : align === "center" ? .3 : 0) * labelSize(size) : 0;
function nameText(v, x, y, {width = Infinity, size = LABEL, valign = "middle", align = "center", ...o} = {}) {
  const lines = Array.isArray(v) ? v : wrapName(v, width, size), em = labelSize(size), step = em * LEADING;
  const top = valign === "top" ? y + em / 2 : valign === "bottom" ? y - em / 2 - step * (lines.length - 1) : y - step * (lines.length - 1) / 2;
  lines.forEach((line, k) => text(line, x + hangOf(line, align, size), top + k * step, size, {align, ...o, whole: lines.join(" ")}));
  return {lines, top: top - em / 2, bottom: top + step * (lines.length - 1) + em / 2};
}
/* The lines of a name whose parts wrap as units onto lines no wider than `width`, as indices into its parts. Parts fill
 * each line in their authored phrases; when those lines break the rules of a wrapped name (see LEADS), the same number
 * of lines is set again from its parts, an English name at a phrase, lines that keep the block's shape before others
 * and then the widest line as narrow as possible, so the name reads as one block. Where no setting keeps the phrase
 * rule, a short tail (a last line under two fifths of the widest) is still rebalanced. A line wider than `width` holds
 * a single part. */
const lineCaches = new WeakMap();
function growLines(parts, width = Infinity, size = LABEL) {
  // Widths depend on the context measuring them, so each context keeps its own layouts.
  const cache = lineCaches.get(ctx) ?? new Map(), key = `${width}\u0002${size}\u0002${parts.join("\u0001")}`;
  lineCaches.set(ctx, cache);
  if (cache.has(key)) return cache.get(key);
  const greedy = [[]];
  parts.forEach((part, k) => {
    const line = greedy.at(-1);
    if (line.length && measure([...line.map(j => parts[j]), part].join(""), size) > width) greedy.push([k]); else line.push(k);
  });
  let lines = greedy;
  const n = greedy.length, span = (a, b) => measure(parts.slice(a, b).join(""), size), latin = !/[一-鿿]/u.test(parts.join(""));
  // The text each line paints, as growTexts sets it: a wrapped part's leading separator hangs its mark on the line before.
  const lead = v => v.match(/^[、，,;；\s]+/u)?.[0] ?? "";
  const texts = (starts, ends) => starts.map((a, i) => (i ? parts[a].slice(lead(parts[a]).length) : parts[a]) + parts.slice(a + 1, ends[i]).join("")
    + (i + 1 < starts.length ? lead(parts[starts[i + 1]]).replace(/\s+/gu, "") : ""));
  const widths = greedy.map(line => span(line[0], line.at(-1) + 1)), painted = texts(greedy.map(line => line[0]), greedy.map(line => line.at(-1) + 1));
  if (n > 1 && parts.length <= 16 && !((!latin || phraseBreaks(painted)) && evenBlock(painted, size))) {
    const options = runStarts(parts.length, n).map(starts => {
      const ends = [...starts.slice(1), parts.length], ws = ends.map((end, i) => span(starts[i], end));
      return {starts, ends, ls: texts(starts, ends), fit: ws.every((w, i) => w <= width || ends[i] - starts[i] === 1),
        worst: Math.max(...ws), spread: ws.reduce((sum, v) => sum + v * v, 0)};
    }).filter(o => o.fit);
    const phrased = options.filter(o => !latin || phraseBreaks(o.ls)), even = phrased.filter(o => evenBlock(o.ls, size));
    const pool = even.length ? even : phrased.length ? phrased : widths.at(-1) < .4 * Math.max(...widths) ? options : [];
    // Where no setting keeps the block's shape, the authored fill stands against an equally balanced one.
    const seed = pool === phrased ? pool.find(o => o.starts.join() === greedy.map(line => line[0]).join()) ?? null : null;
    const best = pool.reduce((x, o) => (!x || o.worst < x.worst - .5 || (Math.abs(o.worst - x.worst) <= .5 && o.spread < x.spread) ? o : x), seed);
    if (best) lines = best.ends.map((end, i) => Array.from({length: end - best.starts[i]}, (_, j) => best.starts[i] + j));
  }
  cache.set(key, lines);
  return lines;
}
/* The height of a block of `lines` lines of one size. */
const blockHeight = (lines, size = LABEL) => labelSize(size) * (1 + LEADING * (lines - 1));
/* A name of authored parts, set whole: it stands complete from the words that begin it, so its text never changes
 * after it appears and the eye never reads a phrase being typed on. It is laid out from its whole text: parts wrap as
 * units onto lines no wider than `width`, and the lines share one left edge. */
/* The texts of each line of a name of parts, as [part, text] pairs. A part that wraps to a new line starts that line
 * without its leading separator, and the separator's mark hangs at the end of the line before: no line starts with a
 * comma and no comma is lost. */
function growTexts(parts, width = Infinity, size = LABEL) {
  const lines = growLines(parts, width, size).map(line => line.map(k => [k, parts[k]]));
  lines.forEach((line, r) => {
    const [k, v] = line[0], lead = r ? v.match(/^[、，,;；\s]+/u)?.[0] ?? "" : "";
    if (!lead) return;
    line[0] = [k, v.slice(lead.length)];
    const mark = lead.replace(/\s+/gu, "");
    if (mark) lines[r - 1].push([k, mark]);
  });
  return lines;
}
/* A name stands whole on the words of its first part; a name that lists what is said over several seconds may `build`,
 * each part joining it in its place on its own words, so the picture keeps changing while the list is spoken. */
function growName(t, parts, ats, x, y, {width = Infinity, size = LABEL, valign = "top", alpha = 1, build = false, align = "left", ...o} = {}) {
  const em = labelSize(size), step = em * LEADING, lines = growTexts(parts, width, size);
  const top = valign === "top" ? y + em / 2 : valign === "bottom" ? y - em / 2 - step * (lines.length - 1) : y - step * (lines.length - 1) / 2;
  lines.forEach((line, r) => {
    // A line starts at x, or centres or ends on it by `align`, its final mark hung as nameText hangs it.
    const span = line.reduce((w, [, v]) => w + measure(v, size), 0);
    let left = (align === "center" ? x - span / 2 : align === "right" ? x - span : x) + hangOf(line.map(([, v]) => v).join(""), align, size);
    line.forEach(([k, v]) => {
      const at = build ? ats[k] ?? ats[0] : ats[0];
      text(v, left, top + r * step, size, {align: "left", ...o, alpha: alpha * ramp(t, at - .15, .4), whole: o.whole ?? parts.join("")});
      left += measure(v, size);
    });
  });
  return {lines: lines.length, top: top - em / 2, bottom: top + step * (lines.length - 1) + em / 2};
}
/* A key term and its qualifier, read as one name: the term at the label size, the qualifier smaller and muted after it
 * on the same centre line, or on the next line when the row would be wider than `width`. The term stands whole from its
 * words and the qualifier joins it whole on its own, so a long condition reads as a few key words rather than a
 * sentence; a qualifier that lists what is said over several seconds may `build`, each part on its own words. */
const NOTE = 22, TERM_GAP = 16;
/* A qualifier set under its term stands this far below the term's line, so at least 12 px of ground stays clear
 * between their inks. */
const TERM_STACK = 10;
/* Whether a term row keeps its qualifier on the term's line, and the row's height. A list sets every row's qualifier
 * the same way: `inline` true or false decides it for the row, and null lets the row's own width decide. */
function termRowLayout(term, qual, width = Infinity, inline = null) {
  const one = !qual.length || (inline ?? measure(term.join(""), LABEL) + TERM_GAP + measure(qual.join(""), NOTE) <= width);
  const head = blockHeight(growLines(term, width).length);
  return {one, height: one ? head : head + TERM_STACK + blockHeight(growLines(qual, width, NOTE).length, NOTE)};
}
/* A row centred or ended on x by `align` sets its qualifier under the term unless `inline` says otherwise, so the term
 * stands on x from its first word and does not move when the qualifier joins. When the two share a line they centre
 * or end on x together; when the qualifier stands under the term, each line centres or ends on x. */
function termRow(t, term, termAts, qual, qualAts, x, y, {width = Infinity, alpha = 1, color = P.ink, set = null, build = false, inline = null, align = "left"} = {}) {
  const whole = [...term, ...qual].join(" "), {one} = termRowLayout(term, qual, width, inline ?? (align === "left" ? null : false)), shared = one && qual.length;
  const span = measure(term.join(""), LABEL) + TERM_GAP + measure(qual.join(""), NOTE), left = shared ? (align === "center" ? x - span / 2 : align === "right" ? x - span : x) : x;
  const head = growName(t, term, termAts, left, y, {width, alpha, color, whole, set, align: shared ? "left" : align});
  if (!qual.length) return head;
  const after = left + measure(term.join(""), LABEL) + TERM_GAP;
  const tail = growName(t, qual, qualAts, one ? after : x, one ? head.top + (labelSize(LABEL) - labelSize(NOTE)) / 2 : head.bottom + TERM_STACK,
    {size: NOTE, alpha: mutedLevel(alpha), color: P.muted, width: one ? Infinity : width, whole, set, build, align: one ? "left" : align});
  return {top: head.top, bottom: Math.max(head.bottom, tail.bottom)};
}
/* The tops of blocks stacked in one column at one gap, the column centred on `cy`. */
function stackTops(heights, cy, gap) {
  const total = heights.reduce((a, b) => a + b, 0) + gap * (heights.length - 1);
  return heights.reduce((tops, h, i) => [...tops, i ? tops[i - 1] + heights[i - 1] + gap : cy - total / 2], []);
}
/* The centre line of the content area, between the chapter label and the caption band; a composed stage balances its
 * groups about it. */
const CONTENT_CY = 500;
/* Names along a rail: all on one side, on one baseline, each centred on its station; a name wider than its share of
 * the rail wraps onto a second line instead of stepping off the baseline. A rail too dense to keep its names whole on
 * one baseline takes `gap` as a function of a name's place, so its names, authored as one line each, stand on two
 * baselines at the rail's one pitch. */
function railNames(names, xs, y, {side = 1, gap = NAME_GAP + 18, size = LABEL, alpha = () => 1, color = () => P.ink, wrap = RAIL_WRAP, set = `rail:${names[0]}`} = {}) {
  // Each name may use the rail up to its neighbours' share, less a gap, and wraps no wider than the rail's wrap width.
  const room = i => Math.min(i ? xs[i] - xs[i - 1] : Infinity, i + 1 < xs.length ? xs[i + 1] - xs[i] : Infinity) - 30;
  const gapOf = typeof gap === "function" ? gap : () => gap;
  names.forEach((v, i) => {
    const width = Math.min(wrap, room(i));
    nameText(v, xs[i], y + side * gapOf(i), {width, size, valign: side > 0 ? "top" : "bottom", align: "center", alpha: alpha(i), color: color(i), set});
  });
}
/* Stations along a rail: evenly pitched from the first to the last, as long as every pair of neighbours keeps half of
 * each name's width plus a gap between them; otherwise each pair stands that far apart and the room left over is
 * shared evenly, so a long name widens its own interval rather than leaving the baseline. A name wider than the wrap
 * width is measured as wrapped, as railNames sets it. */
const RAIL_WRAP = 240;
/* The second baseline of a rail whose names stand on two: a name's own height and leading below the first, so the two
 * rows take the height two lines of a name would. */
const RAIL_ROW = 44;
function railStations(names, first, last, {size = LABEL, gap = 34, wrap = RAIL_WRAP} = {}) {
  const widths = names.map(v => Math.max(...wrapName(v, wrap, size).map(line => measure(line, size))));
  const need = widths.slice(1).map((w, i) => (widths[i] + w) / 2 + gap), pitch = names.length > 1 ? (last - first) / (names.length - 1) : 0;
  if (need.every(d => d <= pitch)) return names.map((_, i) => first + i * pitch);
  const slack = Math.max(0, last - first - need.reduce((a, b) => a + b, 0)) / Math.max(1, need.length);
  return need.reduce((xs, d) => [...xs, xs.at(-1) + d + slack], [first]);
}
/* A name around a ring, set `gap` outside it along its angle: names on the right begin at their mark, names on the
 * left end at it, and names at the top and bottom centre on it. */
function radialName(v, cx, cy, r, a, {gap = NAME_GAP, ry = r, width = 260, ...o} = {}) {
  const c = Math.cos(a), sn = Math.sin(a), x = cx + c * (r + gap), y = cy + sn * (ry + gap);
  const align = c > .3 ? "left" : c < -.3 ? "right" : "center", valign = align === "center" ? (sn > 0 ? "top" : "bottom") : "middle";
  return nameText(v, x, y, {align, valign, width, ...o});
}
/* A drawn relation follows the grid: a straight run when its ends share a row or a column, otherwise an orthogonal
 * route whose corners are quarter turns of radius `r` (never a diagonal). It draws on from its source along its length
 * and ends in a quiet point rather than an arrowhead; `flowing`, the voice time since its flow began, runs dots along it
 * at the film's one flow pace to show the way the relation runs, so they rest in the quiet between thoughts, and `flow`,
 * a share of the way, carries one dot once along it. Routes: "vhv" leaves vertically, crosses at `mid` and arrives vertically; "hvh" the reverse;
 * "vh" and "hv" turn once. */
function rounded(corners, r) {
  const out = [corners[0]];
  for (let i = 1; i < corners.length - 1; i++) {
    const [ax, ay] = corners[i - 1], [bx, by] = corners[i], [cx2, cy2] = corners[i + 1];
    const d1 = Math.hypot(bx - ax, by - ay), d2 = Math.hypot(cx2 - bx, cy2 - by);
    if (d1 < 1e-6 || d2 < 1e-6) continue;
    const k = Math.min(r, d1 / 2, d2 / 2), p = [bx - (bx - ax) / d1 * k, by - (by - ay) / d1 * k], q = [bx + (cx2 - bx) / d2 * k, by + (cy2 - by) / d2 * k];
    for (let n = 0; n <= 6; n++) { const u = n / 6; out.push([(1 - u) ** 2 * p[0] + 2 * (1 - u) * u * bx + u * u * q[0], (1 - u) ** 2 * p[1] + 2 * (1 - u) * u * by + u * u * q[1]]); }
  }
  out.push(corners.at(-1));
  return out;
}
/* The length of a polyline. */
const lengthOf = points => points.slice(1).reduce((sum, pt, i) => sum + Math.hypot(pt[0] - points[i][0], pt[1] - points[i][1]), 0);
/* The point at share q of a polyline's length, and the polyline up to it. */
function along(points, q) {
  const lengths = points.slice(1).map((pt, i) => Math.hypot(pt[0] - points[i][0], pt[1] - points[i][1])), total = lengths.reduce((a, b) => a + b, 0);
  let left = clamp(q) * total;
  const kept = [points[0]];
  for (let i = 0; i < lengths.length; i++) {
    if (left >= lengths[i]) { kept.push(points[i + 1]); left -= lengths[i]; continue; }
    const f = lengths[i] ? left / lengths[i] : 0, a = points[i], b = points[i + 1];
    kept.push([a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f]);
    break;
  }
  return {point: kept.at(-1), kept};
}
function link(x1, y1, x2, y2, {route = null, mid = null, r = 14, color = P.line, alpha = 1, upto = 1, draw = null, width = 2, dash = null, flow = null, flowing = null, lag = 0, last = Infinity, span = null, fade = 1, end = true} = {}) {
  if (alpha < .01 || upto <= 0 || Math.hypot(x2 - x1, y2 - y1) < 1) return;
  const kind = route ?? (Math.abs(x1 - x2) < .5 || Math.abs(y1 - y2) < .5 ? "straight" : "vhv");
  const m = mid ?? (kind === "vhv" ? (y1 + y2) / 2 : (x1 + x2) / 2);
  const corners = {straight: [[x1, y1], [x2, y2]], vhv: [[x1, y1], [x1, m], [x2, m], [x2, y2]], hvh: [[x1, y1], [m, y1], [m, y2], [x2, y2]],
    vh: [[x1, y1], [x1, y2], [x2, y2]], hv: [[x1, y1], [x2, y1], [x2, y2]]}[kind];
  const points = rounded(corners, r), length = lengthOf(points), extent = clamp(upto);
  // `draw` draws it on from its source over `upto` of its length at the tip pace (drawnShare).
  if (draw) upto = drawnShare(draw, length, extent);
  if (upto <= 0) return;
  const drawn = along(points, upto).kept;
  if (drawn.length > 1) stroke(() => drawn.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)), {color, alpha, width, dash});
  // The quiet point at the end grows by its size as it inks in while the line arrives, as a flow's dot enters, so it
  // never stands out at once: over the last tenth of the line, or, drawn at the tip pace, over its last LANDING seconds
  // (landedShare), so a short link's point does not appear whole within a frame.
  const arrived = draw && extent >= 1 ? landedShare(draw, length) : clamp((upto - .9) / .1);
  if (end) dot(x2, y2, (width + 2.5) * arrived, {color, alpha: alpha * arrived});
  // A looping flow (`flowing`, voice time since it began) runs its dots at the film's one flow pace (see loopPhase), timed
  // by the way's length, or by `span` for a way whose ends move, so its dot never skips as the way stretches;
  // `flow` instead stands one dot at that share of the way, for a dot carried once along it; `fade` fades the dot alone.
  if (flowing === null && flow === null) return;
  const way = span ?? length, q = flowing !== null ? loopPhase(flowing, way, lag, last) : flow;
  if (q !== null && q < upto && fade > .01) { const [px, py] = along(points, q).point; flowDot(px, py, width + 2, q, {color, alpha: alpha * fade}, way); }
}

/* A phrase the guidelines reject, set as a name: muted plain text that keeps its full ink as it is refused, so it stays
 * legible, while the cross beside the words rather than over them carries the refusal. */
/* A centred refusal centres its words and their cross together on x. `markLeft` stands the cross's left edge at one
 * x instead, so the crosses of a list of refused names form one column after its longest name; by default the cross
 * follows its own name. */
/* A Chinese closing quotation mark keeps most of its advance blank after its ink, so a mark set after a quoted name is
 * placed from the ink, as after any other name: the blank is the mark's advance as the line measures it, less where
 * its ink ends, in em of Noto Sans CJK SC. */
const CLOSING_INK = {"”": .376, "」": .35, "』": .35, "’": .194};
const closingBlank = (line, size = LABEL) => {
  const ink = /[一-鿿]/u.test(line) ? CLOSING_INK[line.at(-1)] : undefined;
  return ink === undefined ? 0 : Math.max(0, measure(line, size) - measure(line.slice(0, -1), size) - ink * labelSize(size));
};
function rejectedName(v, x, y, {alpha = 1, mark = 1, size = LABEL, align = "center", valign = "middle", width = Infinity, set = null, markLeft = null} = {}) {
  const s = Math.min(26, labelSize(size) * .9), cx = align === "center" && markLeft === null ? x - (16 + s) / 2 : x;
  const block = nameText(v, cx, y, {align, valign, width, size, color: P.muted, alpha, set});
  const w = Math.max(...block.lines.map(line => measure(line, size))), left = align === "left" ? cx : align === "right" ? cx - w : cx - w / 2;
  // The cross follows the ink of the line that reaches furthest right, and its stroke stays 3 px clear of the lines'
  // boxes, as a mark keeps clear of a name.
  const reach = Math.max(...block.lines.map(line => {
    const lw = measure(line, size);
    return (align === "left" ? left + lw : align === "right" ? cx : cx + lw / 2) - closingBlank(line, size);
  }));
  const at = markLeft ?? Math.max(reach + 16, left + w + 5);
  cross(at + s / 2, (block.top + block.bottom) / 2, s, {alpha: alpha * mark, width: 3});
  return {...block, left, right: at + s};
}

/* Film-level framing: a flat ground with no radial darkening or glow. Each scene has one slow camera move chosen
 * for its content: a push toward the object it argues with, a pull back that reveals a structure as it is built,
 * a drift along a track or timeline, or stillness for a dense comparison. The move advances in voice time, so it
 * rests in the quiet between thoughts. */
const CAMERA = {
  push: ["01", "03", "05", "07", "13", "17", "21", "24", "27", "29"],
  reveal: ["02", "04", "09", "12", "14", "18", "22", "26", "28"],
  drift: ["10", "11", "15", "16", "19", "20", "23", "25", "30"],
};
/* A scene's camera at time t, as screen = origin + k × (point − anchor). Every stage is composed on the fixed canvas,
 * so the picture never zooms or pans between thoughts: only this slow move applies. */
function cameraOf(s, t, amount = scenes[s.id]?.push ?? .02) {
  const cx = film.segments.indexOf(s) % 2 ? 840 : 1080, cy = 500;
  const from = voiceTime(s.start), q = ease(clamp((voiceTime(t) - from) / Math.max(1, voiceTime(s.end) - from)));
  if (CAMERA.drift.includes(s.id)) return {k: 1 + amount * .5, ox: 960 + mix(-12, 12, q), oy: cy, ax: 960, ay: cy};
  const k = CAMERA.reveal.includes(s.id) ? 1 + amount * (1 - q) : CAMERA.push.includes(s.id) ? 1 + amount * q : 1;
  return {k, ox: cx, oy: cy, ax: cx, ay: cy};
}

/* A measuring context records where a scene paints without drawing it; the search for each scene's first legible label
 * draws into one. */
let measuring = false;
const groundLuminance = (() => { const lin = c => { c /= 255; return c <= .04045 ? c / 12.92 : ((c + .055) / 1.055) ** 2.4; };
  return rgb => .2126 * lin(rgb[0]) + .7152 * lin(rgb[1]) + .0722 * lin(rgb[2]); })();
const rgbOf = v => /^#[0-9a-f]{6}$/i.test(v ?? "") ? [1, 3, 5].map(i => parseInt(v.slice(i, i + 2), 16)) : null;
const GROUND = rgbOf(P.ground);
function contrastOf(color, alpha) {
  const rgb = rgbOf(color);
  if (!rgb) return 1;
  const mixed = rgb.map((v, i) => alpha * v + (1 - alpha) * GROUND[i]);
  return (groundLuminance(mixed) + .05) / (groundLuminance(GROUND) + .05);
}
/* Records painted extents in logical screen coordinates without drawing. Text uses a fixed width estimate rather than
 * loaded fonts, so every renderer computes the same framing; the estimate errs wide, so a framed label keeps its
 * margin in any font. */
function measuringContext() {
  let m = [1, 0, 0, 1, 0, 0], path = [], last = [0, 0];
  const stack = [], marks = {strong: null, seen: null};
  const keys = ["globalAlpha", "strokeStyle", "fillStyle", "lineWidth", "lineCap", "lineJoin", "font", "textAlign", "textBaseline", "letterSpacing"];
  const tx = (x, y) => [m[0] * x + m[2] * y + m[4], m[1] * x + m[3] * y + m[5]];
  const by = b => { const a = m; m = [a[0] * b[0] + a[2] * b[1], a[1] * b[0] + a[3] * b[1], a[0] * b[2] + a[2] * b[3], a[1] * b[2] + a[3] * b[3],
    a[0] * b[4] + a[2] * b[5] + a[4], a[1] * b[4] + a[3] * b[5] + a[5]]; };
  const add = (key, [x, y]) => { const e = marks[key] ?? (marks[key] = [x, y, x, y]);
    e[0] = Math.min(e[0], x); e[1] = Math.min(e[1], y); e[2] = Math.max(e[2], x); e[3] = Math.max(e[3], y); };
  const sizeOf = () => Number(/(\d+(?:\.\d+)?)px/.exec(meter.font)?.[1] ?? 30);
  const widthOf = v => [...v].reduce((w, ch) => w + (/[\u4e00-\u9fff\u3000-\u303f\uff00-\uffef]/u.test(ch) ? 1.02 : /[A-Z]/.test(ch) ? .72 : .6), 0) * sizeOf();
  function paint(color, points) {
    if (meter.globalAlpha <= .15) return;
    const strong = contrastOf(color, meter.globalAlpha) >= 3;
    for (const point of points) { add("seen", point); if (strong) add("strong", point); }
  }
  function arcPoints(x, y, rx, ry, a0, a1) {
    const n = Math.max(4, Math.ceil(Math.abs(a1 - a0) / (Math.PI / 12)));
    for (let i = 0; i <= n; i++) { const a = a0 + (a1 - a0) * i / n; path.push(tx(x + rx * Math.cos(a), y + ry * Math.sin(a))); }
    last = [x + rx * Math.cos(a1), y + ry * Math.sin(a1)];
  }
  const meter = {
    marks, globalAlpha: 1, strokeStyle: "#000000", fillStyle: "#000000", lineWidth: 1, lineCap: "butt", lineJoin: "miter",
    font: "30px DDWG", textAlign: "left", textBaseline: "middle", letterSpacing: "0px",
    save() { stack.push([m, keys.map(k => meter[k])]); },
    restore() { const [saved, values] = stack.pop(); m = saved; keys.forEach((k, i) => { meter[k] = values[i]; }); },
    setTransform(a, b, c, d, e, f) { m = [a, b, c, d, e, f]; },
    getTransform() { return {a: m[0], b: m[1], c: m[2], d: m[3], e: m[4], f: m[5]}; },
    translate(x, y) { by([1, 0, 0, 1, x, y]); },
    scale(x, y) { by([x, 0, 0, y, 0, 0]); },
    setLineDash() {}, fillRect() {},
    beginPath() { path = []; },
    closePath() {},
    moveTo(x, y) { path.push(tx(x, y)); last = [x, y]; },
    lineTo(x, y) { path.push(tx(x, y)); last = [x, y]; },
    arc(x, y, r, a0, a1) { arcPoints(x, y, r, r, a0, a1); },
    ellipse(x, y, rx, ry, rotation, a0, a1) { arcPoints(x, y, rx, ry, a0, a1); },
    quadraticCurveTo(cx, cy, x, y) {
      const [x0, y0] = last;
      for (let i = 1; i <= 8; i++) { const q = i / 8, u = 1 - q; path.push(tx(u * u * x0 + 2 * u * q * cx + q * q * x, u * u * y0 + 2 * u * q * cy + q * q * y)); }
      last = [x, y];
    },
    roundRect(x, y, w, h) { path.push(tx(x, y), tx(x + w, y), tx(x + w, y + h), tx(x, y + h)); last = [x, y]; },
    stroke() { paint(meter.strokeStyle, path); },
    fill() { paint(meter.fillStyle, path); },
    measureText(v) {
      const size = sizeOf(), width = widthOf(v), left = meter.textAlign === "center" ? width / 2 : meter.textAlign === "right" ? width : 0;
      const ascent = meter.textBaseline === "top" ? 0 : meter.textBaseline === "middle" ? size * .52 : size * .8;
      const descent = meter.textBaseline === "top" ? size * 1.05 : meter.textBaseline === "middle" ? size * .52 : size * .22;
      return {width, actualBoundingBoxLeft: left, actualBoundingBoxRight: width - left, actualBoundingBoxAscent: ascent, actualBoundingBoxDescent: descent};
    },
    fillText(v, x, y) {
      const b = meter.measureText(v);
      paint(meter.fillStyle, [tx(x - b.actualBoundingBoxLeft, y - b.actualBoundingBoxAscent), tx(x + b.actualBoundingBoxRight, y + b.actualBoundingBoxDescent)]);
    },
  };
  return meter;
}
function push(s, t) {
  const c = cameraOf(s, t);
  ctx.translate(c.ox, c.oy); ctx.scale(c.k, c.k); ctx.translate(-c.ax, -c.ay);
}
/* Where a point drawn by the previous scene appears in this scene's coordinates, and the scale between them, so an
 * object that continues across a cut starts exactly where it was shown. */
function across(s, t, x, y) {
  const a = cameraOf(film.segments[film.segments.indexOf(s) - 1], t), b = cameraOf(s, t);
  const sx = a.ox + a.k * (x - a.ax), sy = a.oy + a.k * (y - a.ay);
  return [b.ax + (sx - b.ox) / b.k, b.ay + (sy - b.oy) / b.k, a.k / b.k];
}
const chapterOrder = film.chapters.map(c => c.id);
const chapterNumber = id => String(chapterOrder.indexOf(id) + 1).padStart(2, "0");
const opensChapter = s => { const i = film.segments.indexOf(s); return i > 0 && film.segments[i - 1].chapter !== s.chapter; };
/* A chapter's first scene begins under its rising title, so it stands at full contrast on the first word; within a
 * chapter it begins under the dissolve. */
const opening = s => opensChapter(s) ? Math.max(s.start, s.voice_start - .75) : s.start - .25;
/* Marks in the rising chapter title's path wait until it has risen above them (a mark at height y appears as the title
 * passes y - 45 and stands once it is 60 px higher), so the two never meet, and they still stand by the first word. */
const titleY = (s, t) => mix(540, 72, ease(clamp((t - (cardLanding(s) - RISE)) / RISE)));
/* How far the rising chapter title has cleared a mark drawn at height y, measured on screen through the scene's
 * camera, so a closer shot keeps clear of the title as well as the scene's own frame. */
const clearOfTitle = (s, t, y = 400) => {
  if (!opensChapter(s)) return 1;
  const c = cameraOf(s, t);
  return clamp((c.oy + c.k * (y - c.ay) - 45 - titleY(s, t)) / 60);
};

function titleSignature(alpha, signed = alpha) {
  text("DDWG", 237, 300, 300, {bold: true, tracking: -4, alpha, baseline: "top", role: "title"});
  line(260, 652, 1624, 652, {color: P.line, width: 2, alpha});
  text(L("数据部门工作指南", "Data Department Work Guidelines"), 260, 724, en ? 42 : 50, {alpha, role: "title"});
  text("Yang HENG", 1624, 846, 34, {align: "right", alpha: signed, role: "title"});
}
/* Blend two #rrggbb colours. */
function blend(a, b, q) {
  const rgb = v => [1, 3, 5].map(i => parseInt(v.slice(i, i + 2), 16));
  const [x, y] = [rgb(a), rgb(b)];
  return "#" + x.map((c, i) => Math.round(mix(c, y[i], clamp(q))).toString(16).padStart(2, "0")).join("");
}
/* A chapter opens on one centred line, its number and title, with a short rule beneath, once the previous chapter has
 * faded. The line then rises and shrinks into the running head it becomes over 1.1 s with an ease-in-out, landing just
 * after the first word, so it travels at most about 11 px per frame; the rule fades in place below it, so nothing
 * crosses. The head stands in the muted colour at 0.8 of full ink, 5.2:1 against the ground, and the line lands on it. */
const cardLanding = s => s.voice_start + .1, RISE = 1.1, HEAD_INK = .8;
function chapterCard(s, t) {
  if (!opensChapter(s) || t >= cardLanding(s)) return;
  const enter = ramp(t, s.start, .3);
  if (enter <= 0) return;
  const chapter = film.chapters.find(c => c.id === s.chapter), number = chapterNumber(s.chapter);
  const large = en ? 54 : 60, p = clamp((t - (cardLanding(s) - RISE)) / RISE), q = ease(p), size = mix(large, 24, q);
  // The head's own spacing, scaled with the line: the number, two spaces, then the title.
  ctx.save(); ctx.font = font(24, false, `${number}  ${chapter.title}`); const prefix = ctx.measureText(`${number}  `).width; ctx.restore();
  const gap = prefix * size / 24, total = gap + measure(chapter.title, size, false, "chapter");
  const left = mix(960 - total / 2, 96, q), y = mix(540, 72, q), ink = mix(1, HEAD_INK, q) * enter;
  text(number, left, y, size, {color: blend(P.evidence, P.muted, q), alpha: ink, role: "chapter"});
  text(chapter.title, left + gap, y, size, {color: blend(P.ink, P.muted, q), alpha: ink, role: "chapter"});
  line(900, 600, 1020, 600, {color: P.line, alpha: enter * (1 - ramp(t, cardLanding(s) - RISE, .35))});
}
/* The Illustrative chip of an illustrative case: one fixed slot at the right of the running head, in screen space, so
 * it keeps its place and size from scene to scene. Like the running head it is a marker of the head band rather than a
 * label of the argument, so it adds no reading load. */
function illustrative(alpha) {
  // A measuring pass looks for the scene's own first label, so the chip in the head band is left out of it.
  if (alpha < .015 || measuring) return;
  ctx.save(); ctx.setTransform(resolution, 0, 0, resolution, 0, 0);
  pill(L("示意", "Illustrative"), 1824, 74, {alpha, color: P.muted, border: P.line, size: 22 * TYPE, align: "right", padX: 14, h: 36, role: "marker"});
  ctx.restore();
}
function runningHead(s, t) {
  if (t < film.segments[0].voice_start) return;
  const first = film.segments.find(v => v.chapter === s.chapter);
  // The first chapter's head fades in with the voice; later heads are the chapter titles that rose into place.
  const a = HEAD_INK * (first === film.segments[0] ? ramp(t, first.voice_start, .6) : t >= cardLanding(first) ? 1 : 0);
  const chapter = film.chapters.find(c => c.id === s.chapter);
  text(`${chapterNumber(s.chapter)}  ${chapter.title}`, 96, 72, 24, {color: P.muted, alpha: a, role: "chapter"});
}
/* Cues closer than this are lines of one speech: the earlier holds through the gap and the next replaces it in place,
 * so the caption band does not blink to ground between them. A cue fades only beside a longer quiet. */
const CAPTION_JOIN = .3;
function caption(t) {
  const caps = film.captions;
  const joined = (a, b) => a && b && b.start - a.end <= CAPTION_JOIN;
  let i = caps.findIndex(v => v.start <= t && t < v.end);
  if (i < 0) i = caps.findIndex((v, k) => v.end <= t && t < caps[k + 1]?.start && joined(v, caps[k + 1]));
  if (i < 0) return;
  const c = caps[i];
  const a = (joined(caps[i - 1], c) ? 1 : ramp(t, c.start - .04, .12)) * (joined(c, caps[i + 1]) ? 1 : 1 - ramp(t, c.end - .1, .1));
  text((c.display_text ?? c.text).trim(), 960, 970, 26, {align: "center", color: P.ink, alpha: .94 * Math.max(a, .001), role: "caption"});
}
function credits(t) {
  const start = film.duration - film.credits_duration;
  const a = ramp(t, start, .5);
  titleSignature(a, ramp(t, start + .2, .5));
  text(L("旁白为合成语音", "Narration: synthetic voice"), 1624, 902, 24, {align: "right", color: P.muted, alpha: ramp(t, start + .1, .35), role: "title"});
}

const scenes = {};
/* ---------------- 01 purpose: finished is not the same as reliable ---------------- */
/* A heading over a row of names or marks stands this far clear above them, so it heads the whole row instead of
 * reading as one more line of the nearest name. Scenes 01-10 use it. */
const HEAD_CLEAR = 64;
/* The finished dataset of the opening: a short price history whose values the next user must be able to rely on. */
const PRICES = ["101.18", "100.94", "101.37", "101.06"];
/* The dataset as a card: its name through the name layout and its values as marks. The third value is the number in
 * question: a bar at its row lights as each number is asked about, and it turns unknown when nobody can explain it. The
 * card's content keeps one inset on each side: the title, the rule and the row marks start at one left edge, the rule,
 * the values and the check end at one right edge, and the content block stands at equal padding from the card's top
 * and bottom. The rows are ruled in one stroke, the card's one table, so they are part of the named card rather than
 * repeated marks each waiting for a name of its own. */
const REPORT_ROW = (i, scale = 1) => (119 + i * 66) * scale;
function reportCard(x, y, {alpha = 1, scale = 1, highlight = 0, unknown = 0, done = 0, rows = PRICES, named = alpha} = {}) {
  if (alpha < .01) return;
  const w = 300 * scale, h = 360 * scale, inset = 28 * scale, head = y + 45 * scale, rule = y + 73 * scale;
  box(x, y, w, h, {fill: P.row, alpha, radius: 10});
  box(x, y, w, h, {stroke: P.ink, alpha: alpha * .9, radius: 10});
  line(x + inset, rule, x + w - inset, rule, {color: P.line, alpha, width: 2});
  nameText(L("历史价格", "Price history"), x + inset, head, {align: "left", color: P.muted, alpha: named});
  stroke(() => rows.forEach((_, i) => { ctx.moveTo(x + inset, y + REPORT_ROW(i, scale)); ctx.lineTo(x + 120 * scale, y + REPORT_ROW(i, scale)); }),
    {color: P.line, alpha, width: 2});
  rows.forEach((value, i) => {
    const ry = y + REPORT_ROW(i, scale), hot = i === 2, tone = blend(P.evidence, P.unknown, unknown);
    if (hot && highlight > 0) line(x + 14 * scale, ry - 20 * scale, x + 14 * scale, ry + 20 * scale, {color: tone, alpha: alpha * highlight, width: 4});
    // Once one value is in question, the others step back, to 0.51 of full ink, at which ink still reads at 4.6:1
    // against the ground. The values are marks at the name size, so the card adds no third text size to the frame.
    text(value, x + w - inset, ry + 1, 26, {role: "mark", align: "right", alpha: hot ? alpha : alpha * mix(1, .51, highlight),
      color: hot ? blend(blend(P.ink, P.evidence, highlight), P.unknown, unknown) : P.ink});
  });
  // The check's stroke ends at the right edge: its long arm reaches 0.55 of its size right of its centre, plus the
  // stroke's round cap.
  const s = 26 * scale;
  if (done > 0) check(x + w - inset - s * .55 - 1.75, head, s, {color: P.evidence, alpha, upto: done});
}

scenes["01"] = function (s, t) {
  const [report, next, judge, need, means, when, basis, use] = cues(s, [
    ["一份历史价格数据", "A historical price dataset"], ["下一位用它的人", "next person"], ["判断吗", "rely on it"],
    ["需要知道", "need to know"], ["每个数字是什么意思", "each number means"], ["哪个时间", "which time"],
    ["依据从哪里来", "evidence it rests"], ["用在哪里", "used for"]]);
  const [researchers, backtest, trading, risk, unclear, chain] = cues(s, [["研究员", "Researchers"], ["回测", "backtest"],
    ["交易系统", "trading systems"], ["控风险", "control risk"], ["说不清的数字", "nobody can explain"], ["顺着链条", "travels down"]]);
  // The roles in the order each edition names them: Chinese names production and platforms apart, English together;
  // both name governance and operational delivery apart.
  const roles = en ? cues(s, [["", "acquisition"], ["", "analysis and modeling"], ["", "development"], ["", "production and platforms"],
    ["", "product management"], ["", "governance"], ["", "operational delivery"]])
    : cues(s, [["采集", ""], ["分析建模", ""], ["开发", ""], ["生产", ""], ["平台", ""], ["产品", ""], ["治理", ""], ["运营交付", ""]]);
  const [hand, file, table] = cues(s, [["每个环节", "every step"], ["一个文件", "a file"], ["一张表", "a table"]]);
  const paper = cue(s, "一份报告", "a report", {last: true}), started = cue(s, "启动一个流程", "the start of a process");
  // Opening title, then the price dataset that seems finished. The title hands the picture to the dataset in one short
  // swap just before the voice begins, so the dataset stands on the first word and the frame never loses its mark.
  const title = stageOut(t, Math.min(report, s.voice_start) - .45);
  if (title > 0) titleSignature(title);
  // The dataset stands through the first three thoughts; the chain of roles replaces it on the words that begin the
  // chain, its first role or, where the steps are named first, "every step"; the way to the next user replaces the chain
  // on the words that name the value it weighs, and holds to the end of the scene, which ends on that value.
  const chainAt = Math.min(roles[0], hand), valueAt = cue(s, "数据工作的价值", "the value of data work");
  const data = stageIn(t, Math.min(report, s.voice_start) - .45) * stageOut(t, chainAt);
  const stage2 = stageIn(t, chainAt) * stageOut(t, valueAt), worth = stageIn(t, valueAt);
  // The price dataset is an illustrative case, so the chip marks it while it is shown.
  illustrative(data);
  // The stage stays balanced as it builds, its card moving on the words that bring each part: the card alone stands
  // 30 px right of centre, so the thought that brings its next user stays balanced as a whole, steps right as its next
  // user arrives at its left, left as what they need to know builds at its right, right again as the needs give way to
  // the researcher, and left as the trading system joins. The stage stands a little below the content centre, balancing
  // the Illustrative chip in the head band.
  // The card's left edge alone, with the next user, with their needs, with the researcher and with both users.
  const places = [780, 970, 815, 990, 830], moves = [next, means, researchers, trading];
  const CX = moves.reduce((x, at, i) => x + (places[i + 1] - places[i]) * glide(t, at + .05, places[i + 1] - places[i]), places[0]);
  // The next user stands at its own place from the moment it is named, while the card steps right beside it; it moves
  // with the card from the card's second place on.
  const UX = moves.slice(1).reduce((x, at, i) => x + (places[i + 2] - places[i + 1]) * glide(t, at + .05, places[i + 2] - places[i + 1]), places[1]);
  const Y1 = CONTENT_CY + 48, K = 1.4, CY = Y1 - 180 * K, edgeX = CX + 300 * K, hotY = CY + REPORT_ROW(2, K);
  const dark = ramp(t, unclear - .1, .6);
  reportCard(CX, CY, {alpha: data, scale: K, highlight: ramp(t, means - .1, .5), unknown: dark, done: soon(t, report + .6, .6),
    named: data * named(t, report)});
  // 1. Its next user stands at the left of the data they would rely on, the data running to them, and the open question,
  // whether they can rely on it, stands at the card's other side on its words. It leaves when they are said to need to
  // know, and the four things they need then build into one column where it stood, each on its own words.
  const ask = data * stageOut(t, researchers);
  if (ask > 0) {
    // The user stands level with the value in question, the row their judgment rests on; the way from it reaches their
    // shoulders, and the researcher of the next thought takes their place on the same way.
    const PX = UX - 400, PY = hotY, user = named(t, next) * ask, QX = edgeX + 50, asking = stageOut(t, need);
    // The next user appears when named.
    person(PX, PY - 10, {alpha: user, size: 1.4});
    nameText(L("下一位用它的人", "The next person"), PX, PY + 22 + NAME_GAP, {valign: "top", alpha: user});
    link(CX - 20, PY, PX + 54, PY, {alpha: user, draw: {t, at: next - .1}});
    text("?", QX, Y1, 44, {role: "mark", align: "center", color: P.unknown, alpha: ramp(t, judge - .1, .4) * ask * asking});
    // Each need is named by its key words, so the column reads at a glance beside the spoken sentence.
    const needs = [means, when, basis, use], names = en
      ? ["What each number means", "Which time it describes", "Its evidence", "Its permitted use"]
      : ["每个数字是什么意思", "对应哪个时间", "依据从哪里来", "能用在哪里"];
    const tops = stackTops(names.map(() => blockHeight(1)), Y1, 40);
    names.forEach((v, i) => {
      const y = tops[i] + labelSize(LABEL) / 2, on = ramp(t, needs[i] - .15, .4) * ask;
      // Each need's ring and dot appear on its own words.
      ring(QX, y, 17, {color: P.evidence, alpha: on, width: 2.5});
      dot(QX, y, 5 + 3 * speaking(t, needs, i), {color: P.evidence, alpha: on});
      // Each need is named lit and the earlier ones turn quiet as the next is named. The tree replaces the column as the
      // next thought names its first user, too soon for the usual return after the list, so the column returns to full
      // ink as its last need is named, and the third need stays lit rather than dimming for a moment.
      const quiet = i < 2 ? ramp(t, pauseHold(needs[i + 1] - .15, .3), .3) : 0, whole = ramp(t, use + .05, .4);
      nameText(v, QX + 17 + NAME_GAP, y, {align: "left", alpha: ask * ramp(t, needs[i] - .15, .4) * mix(mix(1, SECOND, quiet), 1, whole),
        set: "needs"});
    });
  }
  // 2. Two users rely on the same data: the researcher's backtest at the left and the trading system's risk control at
  // the right, each reached from the value in question by its own branch, which draws on with the user's words. When a
  // number nobody can explain is named the value turns unknown, and as it travels down the chain the unknown runs along
  // both branches and reaches both users. Each user is named with its use in a few key words, its use under its name.
  const uses = data * stageIn(t, researchers);
  if (uses > 0) {
    const xs = [CX - 400, edgeX + 180], ats = [researchers, trading], from = [CX - 20, edgeX + 16], to = [xs[0] + 54, xs[1] - 58];
    const rows = en ? [[["Researchers"], ["backtest"]], [["Trading systems"], ["control risk"]]]
      : [[["研究员"], ["拿数据做回测"]], [["交易系统"], ["拿数据控风险"]]];
    const qualAts = en ? [backtest, risk] : [cueFrom(s, "拿数据", "", researchers), cueFrom(s, "拿数据", "", trading)];
    // The unknown sets off down the chain as it is named and reaches both users on its last words, turning them unknown
    // while the clause is still spoken, so nothing changes in the quiet that follows it.
    const arrive = cue(s, "传下去", "down the chain"), travel = {t, at: chain - .1, least: arrive - chain};
    xs.forEach((x, i) => {
      const on = named(t, ats[i]) * uses, reached = ramp(t, arrive + .05, .4), tone = blend(P.ink, P.unknown, reached), y = hotY;
      ring(x, y, 46, {color: tone, alpha: on, width: 2.5});
      if (i === 0) person(x, y + 6, {alpha: on, color: tone, size: .9});
      else path([[x - 26, y + 16], [x - 8, y - 4], [x + 6, y + 6], [x + 26, y - 18]], {color: tone, alpha: on, width: 3});
      // The researcher's way is the next user's, already drawn; the trading system's draws on with its words.
      link(from[i], y, to[i], y, {alpha: uses, draw: i ? {t, at: ats[i] - .1} : null});
      link(from[i], y, to[i], y, {color: P.unknown, alpha: uses, draw: travel, flowing: since(t, arrive - .1), lag: i * .5});
      // The user's name and its use stand under its ring, the use under the name, each line centred on the ring's axis.
      const [term, qual] = rows[i];
      termRow(t, term, [ats[i]], qual, [qualAts[i]], x, y + 46 + NAME_GAP, {alpha: uses, inline: false, align: "center"});
    });
    nameText(L("一个说不清的数字", "A number nobody can explain"), CX + 210, CY + 504 + NAME_GAP, {valign: "top", alpha: uses * named(t, unclear)});
  }
  // 3. The chain of roles: one station for each role named, on one rail, seven in English and eight in Chinese, which
  // names production and platforms apart. The rail is the chain's span, one firm rail standing whole on the
  // words that open it, its first role in Chinese and "every step" in English, so the chain is in view from its first
  // words. Each role stands at its station on its own words, and the way to it from the one before draws on over the
  // rail. On the words that every step hands something to the next person, a person named as every step stands above
  // the rail, the next person joins it on their own words and a point passes from the one to the other; from the
  // hand-over's first words one point runs along each span toward the next station.
  if (stage2 > 0) {
    // The English names stand whole, each on one line, so they stand on two baselines at one even pitch, every other
    // name a row lower on a short stem from its station, within the height two lines of a name would take.
    const y = CONTENT_CY + 20, names = en
      ? [["Acquisition"], ["Analysis and modeling"], ["Development"], ["Production and platforms"], ["Product management"], ["Governance"], ["Operational delivery"]]
      : ["采集", "分析建模", "开发", "生产", "平台", "产品", "治理", "运营交付"];
    // The English rail stands 26 px right of the frame's centre, so with its last and widest name still to come it
    // leans no further left than the whole chain leans right.
    const xs = en ? names.map((_, i) => 266 + i * 232) : railStations(names, 230, 1690), R = 40;
    line(xs[0], y, xs.at(-1), y, {color: P.line, alpha: stage2 * ramp(t, chainAt + STAGE_CUT, .25), width: 4});
    xs.forEach((x, i) => {
      const on = ramp(t, roles[i] - .15, .4) * stage2, lit = speaking(t, roles, i);
      dot(x, y, R, {color: P.ground, alpha: on});
      ring(x, y, R, {color: blend(P.ink, P.evidence, lit), alpha: on, width: 2.5 + lit});
      person(x, y + 6, {alpha: on, color: blend(P.ink, P.evidence, lit), size: .72});
      if (i) link(xs[i - 1] + R + 8, y, x - R - 8, y, {alpha: stage2, draw: {t, at: roles[i] - .15},
        flowing: since(t, Math.max(hand, roles[i] + .35)), lag: i * .17});
    });
    if (en) xs.forEach((x, i) => { if (i % 2) line(x, y + R + 8, x, y + R + NAME_GAP + 26 + RAIL_ROW - 6, {alpha: stage2 * ramp(t, roles[i] - .15, .4), width: 2}); });
    railNames(names, xs, y + R, {gap: i => NAME_GAP + 26 + (en && i % 2 ? RAIL_ROW : 0), alpha: i => stage2 * listIn(t, roles, i), set: "roles"});
    // The hand-over stands over the chain, its two persons named on one baseline well clear of the stations below, so
    // it names the whole chain's hand-over rather than reading as one station's name: every step at the left and the
    // next person at the right, each on its own words and standing over its own name, 48 px apart, so each person has
    // the name the voice gives it; the point passes from the one to the other once both stand. The persons reach 21 px
    // below their line.
    const mid = (xs[0] + xs.at(-1)) / 2, nextAt = cueFrom(s, "下一个人", "the next person", hand), nameBottom = y - R - HEAD_CLEAR;
    const HY = nameBottom - labelSize(LABEL) - NAME_GAP - 21, pair = [L("每个环节", "Every step"), L("下一个人", "The next person")];
    const D = (measure(pair[0]) + measure(pair[1])) / 4 + 24, way = 2 * D - 72;
    [hand, nextAt].forEach((at, k) => {
      const on = stage2 * named(t, at), x = mid + (k ? D : -D);
      person(x, HY + 6, {alpha: on, size: .6});
      nameText(pair[k], x, nameBottom, {valign: "bottom", alpha: on});
    });
    const q = loopPhase(since(t, nextAt), way);
    if (q !== null) flowDot(mix(mid - D + 36, mid + D - 36, q), HY - 2, 6, q, {color: P.evidence, alpha: stage2}, way);
  }
  // 4. Where the value lies. The value of data work is named over the way that leads to the work's next user, who stands
  // at its end with the name the opening gave them: what is handed over is weighed by whether they can rely on it. What
  // is handed over builds below the way, each refused on its own words. On the words that name the real-world signals
  // the refused set leaves as a whole, the signals run in at the way's start, and the reliable judgments, data assets
  // and actions they become take their stations on the way, each on its own word; once all three stand, points travel
  // along the way to the next user, who can rely on them.
  if (worth > 0) {
    const LY = 480, W0 = 380, W1 = 600, UX = 1480, signalAt = cue(s, "现实里的信号", "real-world signals"), open = named(t, valueAt) * worth;
    const resultAt = [["判断", "judgments"], ["数据资产", "data assets"], ["行动", "actions"]].map(pair => cue(s, ...pair, {last: true}));
    // The value of data work heads the stage, clear above the signals' name over the way's start, so the two never
    // read as one staggered row.
    nameText(L("数据工作的价值", "The value of data work"), 960, LY - 24 - NAME_GAP - labelSize(LABEL) - HEAD_CLEAR, {valign: "bottom", alpha: open});
    // The way runs right and turns down into the next user, who stands below its end.
    const UY = LY + 96;
    person(UX, UY, {alpha: open, size: 1.3});
    nameText(L("下一位用它的人", "The next person"), UX, UY + 15 * 1.3 * 1.52 + NAME_GAP, {valign: "top", alpha: open});
    link(W1 + 10, LY, UX, UY - 15 * 1.3 * 2.15 - 10, {route: "hv", width: 4, alpha: worth * ramp(t, valueAt + STAGE_CUT, .25),
      draw: {t, at: valueAt + STAGE_CUT}, flowing: since(t, valueAt + STAGE_CUT + 1.6)});
    // What is handed over: one column below the way's start, centred under the place where the signals run in, so
    // the stage is balanced while it builds; each item is refused on its own words, the whole set leaving together when
    // the signals are named. The column spans its icons' left edge to its crosses' right edge.
    const outs = [file, table, paper, started], refused = en ? ["A file", "A table", "A report", "The start of a process"]
      : ["一个文件", "一张表", "一份报告", "启动一个流程"];
    const widest = Math.max(...refused.map(v => measure(v, LABEL))), IX = Math.round((W0 + W1) / 2 - (48 + widest + 68) / 2 + 26);
    const leave = 1 - ramp(t, pauseHold(signalAt, .4), .4);
    outs.forEach((at, i) => {
      const y = LY + 78 + i * 60, on = ramp(t, at - .15, .4) * worth * leave, tone = blend(P.muted, P.ink, speaking(t, outs, i));
      if (i === 0 || i === 2) documentIcon(IX - 20, y - 26, 40, 52, {alpha: on, stroke: tone, rows: i ? 3 : 2});
      if (i === 1) tableIcon(IX - 26, y - 20, 52, 40, {alpha: on, stroke: tone, rows: 3, cols: 3});
      if (i === 3) { ring(IX, y, 22, {color: tone, alpha: on, width: 2.5}); path([[IX - 6, y - 11], [IX + 11, y], [IX - 6, y + 11], [IX - 6, y - 11]], {color: tone, alpha: on, width: 2.5}); }
      // The crosses stand in one column after the longest refused name; each comes half a second after its name, as the
      // refusal is heard, so it never stands long before the next name reaches it.
      rejectedName(refused[i], IX + 48, y, {align: "left", alpha: named(t, at) * worth * leave, mark: ramp(t, at + .45, .4), set: "refused",
        markLeft: IX + 48 + widest + 16});
    });
    // The signals run in at the way's start.
    const run = soon(t, signalAt - .1, 1.0), wave = [];
    for (let x = W0; x <= mix(W0, W1, run); x += 6) wave.push([x, LY + Math.sin((x - W0) / 22 - voiceTime(t) * 2.4) * 14 * (1 - (x - W0) / (W1 - W0) * .7)]);
    if (wave.length > 1) path(wave, {color: P.evidence, alpha: worth, width: 3});
    nameText(L("现实里的信号", "Real-world signals"), (W0 + W1) / 2, LY - 24 - NAME_GAP, {valign: "bottom", color: P.evidence, alpha: worth * named(t, signalAt)});
    // What it becomes stands on the way, each on its own word, with the qualifier under all three: the three stand far
    // enough apart that their names keep clear of each other, and the qualifier stands under the bracket that spans them.
    const xs = [760, 1000, 1240], glyphs = [P.authority, P.evidence, P.ink], results = en ? ["Judgments", "Data assets", "Actions"] : ["判断", "数据资产", "行动"];
    xs.forEach((x, i) => {
      const on = ramp(t, resultAt[i] - .15, .4) * worth;
      dot(x, LY, 30, {color: P.ground, alpha: on});
      ring(x, LY, 30, {color: glyphs[i], alpha: on, width: 2.5});
      if (i === 0) diamond(x, LY, 12, {color: glyphs[i], alpha: on, solid: true});
      if (i === 1) tableIcon(x - 16, LY - 12, 32, 24, {alpha: on, stroke: glyphs[i], rows: 2, cols: 2});
      if (i === 2) check(x + 1, LY + 1, 26, {color: glyphs[i], alpha: on});
      nameText(results[i], x, LY + 30 + NAME_GAP, {valign: "top", color: glyphs[i], alpha: worth * listIn(t, resultAt, i), set: "results"});
    });
    // Reliable qualifies all three: a bracket under their names spans them, from the first name's left edge to the last
    // one's right, and the qualifier stands centred under it, on its words.
    const relyAt = cue(s, "可靠的", "reliable"), rely = worth * named(t, relyAt), BY = LY + 30 + NAME_GAP + labelSize(LABEL) + 14;
    const BL = xs[0] - Math.max(30, measure(results[0]) / 2) - 4, BR = xs[2] + Math.max(30, measure(results[2]) / 2) + 4;
    stroke(() => { ctx.moveTo(BL, BY - 12); ctx.lineTo(BL, BY); ctx.lineTo(BR, BY); ctx.lineTo(BR, BY - 12); }, {color: P.line, alpha: rely, width: 2});
    nameText(L("可靠的", "Reliable"), (BL + BR) / 2, BY + NAME_GAP, {valign: "top", size: NOTE, color: P.muted, alpha: rely});
  }
};

/* ---------------- 02 purpose: four failures, three outcomes ---------------- */
scenes["02"] = function (s, t) {
  const [guide, agree, four, task, three] = cues(s, [["数据部门工作指南", "Data Department Work Guidelines"], ["部门关于工作质量的契约", "contract for work quality"],
    ["四种失败", "four failures"], ["一项任务", "a task"], ["三件事", "achieve three things"]]);
  const starts = cues(s, [["把事实和选择", "confuses facts with choices"], ["只治了症状", "fixes the symptom"], ["沟通完了", "is communication"],
    ["人工智能写出了", "is ai that produces"]]);
  // 1. The guidelines as the scene's first words name them: the guideline stands in one cut at the centre on those
  // words, named as they are called, and its rows are written in turn; when it is called the department's contract, the
  // department's members stand on either side of the contract they share.
  const one = stageOut(t, four);
  if (one > 0) {
    // The guideline is a page whose seven rows fill it.
    const DW = 250, DH = 330, DX = 960 - DW / 2, DY = CONTENT_CY + 30 - DH / 2, rowY = i => DY + DH * (.2 + i * .11), rows = [0, 1, 2, 3, 4, 5, 6];
    // The page and its name stand on the guidelines' words, and its rows are written in turn as one hand's lines.
    const doc = stageIn(t, guide) * one;
    documentIcon(DX, DY, DW, DH, {alpha: doc, rows: 0});
    nameText(L("数据部门工作指南", "Data Department Work Guidelines"), 960, DY - NAME_GAP, {valign: "bottom", alpha: doc * named(t, guide)});
    const rowAt = i => guide + STAGE_CUT + i * .06, x0 = DX + 50;
    rows.forEach(i => dot(DX + 34, rowY(i), 5, {color: P.evidence, alpha: doc * ramp(t, rowAt(i), .25)}));
    stroke(() => rows.forEach(i => {
      const q = drawShare(t, rowAt(i), DX + DW * (i % 2 ? .7 : .86) - x0);
      if (q > .01) { ctx.moveTo(x0, rowY(i)); ctx.lineTo(mix(x0, DX + DW * (i % 2 ? .7 : .86), q), rowY(i)); }
    }), {color: P.line, alpha: doc * ramp(t, rowAt(0), .35), width: 2});
    // The department's members stand on either side of the contract on its words.
    const members = named(t, agree) * one;
    [-1, 1].forEach(k => person(960 + k * 440, CONTENT_CY + 20, {alpha: members, color: P.authority, size: 1.3}));
    nameText(L("部门关于工作质量的契约", "The department's contract for work quality"), 960, DY + DH + NAME_GAP,
      {valign: "top", width: 760, alpha: members});
  }
  // 2. Four failures as the four places of one grid. The words that count them draw the grid's dividing cross, firm,
  // with its name, so the four places stand in view from the count; each failure takes its place, its number and its
  // title on its own words and stays, and its picture builds under its title. The failure being described lights its
  // number. The completed grid stands until the words name the task that delivers the outcomes.
  const two = stageIn(t, four) * stageOut(t, task);
  // The grid stands 40 px below the content centre, so the count's name over its cross stands clear of the running
  // head; its cells keep 20 px from the vertical axis, and the horizontal axis runs 20 px past the outer cells, so every
  // cell's content keeps one inset from the line at its left.
  const W = 760, H = 330, GY = CONTENT_CY + 40, cells = [0, 1, 2, 3].map(i => [960 + (i % 2 ? 20 : -20 - W), GY + (i > 1 ? 15 : -15 - H)]);
  if (two > 0) {
    // Each failure is named by its key words, so the title reads at a glance beside the sentence that states it; the
    // English third is the communication the charter names, and its seats below say what it leaves.
    const titles = en ? [["Confusing facts with choices"], ["Fixing the symptom", ", not the mechanism"], ["Communication"],
      ["AI that produces more material"]] : [["把事实和选择混在一起"], ["只治了症状", "，没改机制"], ["沟通完了"], ["人工智能写出了更多材料"]];
    const titleAts = [[starts[0]], [starts[1], cue(s, "没改机制", "and leaves the mechanism")], [starts[2]], [starts[3]]];
    const top = cells[0][1], bottom = cells[3][1] + H;
    line(960, top, 960, bottom, {color: P.line, alpha: two, width: 4});
    line(cells[0][0] - 20, GY, cells[1][0] + W + 20, GY, {color: P.line, alpha: two, width: 4});
    // The count's name stands with the grid while its four failures stand.
    nameText(L("四种失败", "Four failures"), 960, top - NAME_GAP, {valign: "bottom", alpha: two * named(t, four)});
    cells.forEach(([x0, y0], i) => {
      const lit = speaking(t, starts, i), ty = y0 + 46, own = ramp(t, starts[i] - .15, .4) * two;
      text(String(i + 1), x0 + 42, ty, 26, {role: "mark", align: "center", color: blend(P.muted, P.evidence, lit), alpha: own});
      growName(t, titles[i], titleAts[i], x0 + 72, ty - labelSize(LABEL) / 2, {width: W - 110, alpha: two * listLevel(t, starts, i), set: "failures"});
    });
    // Failure 1: the late data, a fact, and the change of vendors, a choice, are bound together by one tie that draws on
    // from the fact once the choice is named; on the words that set them apart, 'two different things' or the choice
    // named as a choice, the tie fades as a divider draws down between them at the tip pace, so neither the tie leaves
    // nor the divider arrives in one frame.
    const [late, vendor, apart] = cues(s, [["数据晚到了", "data arriving late"], ["要不要换供应商", "changing vendors"],
      ["是两件事", "is a choice"]]);
    {
      const [x0, y0] = cells[0], my = y0 + 175, fx = x0 + 210, cx = x0 + 550, split = ramp(t, apart + .05, .35);
      clock(fx, my, 30, {hand: .2, color: P.evidence, alpha: named(t, late) * two});
      diamond(cx, my, 30, {color: P.authority, alpha: named(t, vendor) * two});
      link(fx + 44, my, cx - 44, my, {alpha: two * (1 - split), draw: {t, at: vendor + .05}});
      // The divider that sets them apart stands midway in the clear space between their names.
      const lateName = L("数据晚到了", "Data arriving late"), vendorName = L("要不要换供应商", "Changing vendors");
      const wide = v => Math.max(...wrapName(v, 300).map(line => measure(line))), dx = (fx + wide(lateName) / 2 + cx - wide(vendorName) / 2) / 2;
      const divided = drawShare(t, apart + .05, 150);
      if (divided > .01) line(dx, my - 54, dx, my - 54 + 150 * divided, {color: P.line, alpha: two, width: 2});
      nameText(lateName, fx, my + 40 + NAME_GAP, {valign: "top", width: 300, color: P.evidence, alpha: two * named(t, late)});
      nameText(vendorName, cx, my + 40 + NAME_GAP, {valign: "top", width: 300, color: P.authority, alpha: two * named(t, vendor)});
    }
    // Failure 2: a mechanism with a break leaks; a patch by hand catches the leak below it, but the break stays, and next
    // month the leak runs past the patch again.
    const [backfill, month] = cues(s, [["手工补一次数据", "someone backfills by hand"], ["下个月照样出错", "next month it breaks again"]]);
    {
      const [x0, y0] = cells[1], py = y0 + 152, xb = x0 + 240, on = ramp(t, starts[1] - .15, .4) * two;
      line(x0 + 80, py, xb - 22, py, {color: P.ink, alpha: on, width: 4});
      line(xb + 22, py, x0 + W - 80, py, {color: P.ink, alpha: on, width: 4});
      cross(xb, py - 32, 20, {alpha: on});
      const patched = named(t, backfill) * two, again = named(t, month) * two, PY = py + 62;
      // The patch itself stands from just before its words, so it is in place before a drop that runs down to it leaves.
      box(xb - 50, PY - 13, 100, 26, {fill: P.row, stroke: P.muted, alpha: ramp(t, backfill - .35, .3) * two, radius: 6});
      // One drop at a time leaks from the break at the film's flow pace: it runs down to the patch's place and leaves by
      // its size there, and below it comes out by its size and runs on, unless the patch holds it.
      const upper = 30, lower = y0 + H - 42 - PY, run = loopPhase(since(t, starts[1] - .15), upper + lower);
      if (run !== null) {
        const at = run * (upper + lower);
        if (at < upper) flowDot(xb, py + 14 + at, 5, at / upper, {color: P.unknown, alpha: on}, upper);
        else flowDot(xb, PY + 18 + at - upper, 5, (at - upper) / lower, {color: P.unknown, alpha: on * (1 - patched + again)}, lower);
      }
      nameText(L("手工补一次数据", "Someone backfills by hand"), xb + 50 + NAME_GAP, PY, {align: "left", color: P.muted, alpha: patched});
      nameText(L("下个月照样出错", "Next month it breaks again"), xb + 50 + NAME_GAP, PY + 70, {align: "left", alpha: again});
    }
    // Failure 3: the communication is over, and the two seats it should leave filled stay empty: no one able to decide
    // or act, each seat standing on its own words with an open question in it. The two are one phrase, so they
    // take one name in one colour, whole from its first words and centred under both seats, which stand at equal
    // distances either side of it.
    const [decide, act] = cues(s, [["没有人能做决定", "no one able to decide"], ["或动手", "or act"]]);
    {
      const [x0, y0] = cells[2], my = y0 + 165, on = ramp(t, starts[2] - .15, .4) * two;
      [[x0 + 130, my - 14], [x0 + 190, my + 24]].forEach(([bx, by]) => {
        box(bx - 56, by - 22, 112, 44, {stroke: P.muted, alpha: on, radius: 18});
        [-16, 0, 16].forEach(dx => dot(bx + dx, by, 3, {color: P.muted, alpha: on}));
      });
      const whole = L("没有人能做决定或动手", "No one able to decide or act"), cx = x0 + 505, D = Math.max(80, measure(whole) / 4);
      [[cx - D, decide], [cx + D, act]].forEach(([sx, at]) => {
        const q = named(t, at) * two;
        person(sx, my, {alpha: q, color: P.line, size: 1.2, solid: false});
        text("?", sx, my - 21, 26, {role: "mark", align: "center", color: P.unknown, alpha: q});
      });
      nameText(whole, cx, my + 44 + NAME_GAP, {valign: "top", alpha: two * named(t, decide)});
    }
    // Failure 4: the Agent's material climbs on its words while judgment and results stay flat beside it.
    const [more, grow] = cues(s, [["更多材料", "more material"], ["没有变得更可靠", "grow no more"]]);
    {
      const [x0, y0] = cells[3], on = ramp(t, starts[3] - .15, .4) * two, base = y0 + 270, ox = x0 + 260, ex = x0 + W - L(220, 240);
      agent(x0 + 110, y0 + 160, {alpha: on, size: 1.1});
      const rise = soon(t, more - .1, 1.6), flat = soon(t, grow - .1, .9), top = base - 150 * rise;
      line(ox, base, ex, base, {color: P.line, alpha: on, width: 2});
      line(ox, base, ox, y0 + 90, {color: P.line, alpha: on, width: 2});
      path([[ox, base - 10], [mix(ox, ex, rise), base - 10 - 150 * rise]], {color: P.muted, alpha: on * ramp(t, more - .15, .3), width: 3});
      path([[ox, base - 40], [mix(ox, ex, flat), base - 40]], {color: P.authority, alpha: named(t, grow) * two, width: 3.5});
      nameText(L("材料", "Material"), ex + NAME_GAP, top - 10, {align: "left", color: P.muted, alpha: two * named(t, more)});
      nameText(L("判断和结果", "Judgment and results"), ex + NAME_GAP, base - 40, {align: "left", width: L(200, 300), color: P.authority,
        alpha: two * named(t, cue(s, "判断和结果", "judgment and results"))});
    }
  }
  // 3. Three outcomes as one column of rows, delivered by one task. The stage cuts in on the words that name the task,
  // which stands left of centre with its name, and the column it delivers to stands to its right. On the words that
  // count the outcomes the column is named and the task's three ways draw out to the outcomes' places, so the three
  // stand in view from the count; each outcome draws its ring at its way's end, inks the ring and takes its name on its
  // own words, and lights while it is spoken. On the last thought three required reports, aligned with its rows, are
  // refused on the task's other side. Everything stands where it ends from the cut, so nothing slides when the reports
  // join: the stage stands centred between its last two pictures, the task with its whole column and the whole stage
  // with the reports, so the column leans as far right of the centre as the finished stage leans left.
  const out = stageIn(t, task);
  if (out > 0) {
    const reports = cue(s, "三份必须交的报告", "three required reports");
    // Each outcome is named by its key words: in English as a result, so its name reads at a glance rather than repeating
    // the spoken command, and in Chinese by the words that state it; the second, a clause in Chinese, keeps under its
    // name only what the test must state, when the judgment holds, so its row does not repeat the spoken clause whole;
    // the third, a sentence in Chinese, takes the run of its spoken words that names what the work system can do better
    // as its name, and the alternative it adds as its gloss.
    const rows = en ? [[["Problem solved"], []], [["Judgment tested"], ["with its limits"]],
      [["System left better"], ["able to recognize", " or handle", " the next occurrence"]]]
      : [[["解决问题"], []], [["检验判断"], ["在什么情况下成立"]], [["工作体系能更好地发现"], ["或应对"]]];
    const termAts = en ? [[cue(s, "", "solve the problem")], [cue(s, "", "test the judgment")], [cue(s, "", "and leave the system")]]
      : [[cue(s, "解决问题", "")], [cue(s, "检验判断", "")], [cue(s, "工作体系能更好地发现", "")]];
    // The third gloss stands whole from its first words; its second cue, "handle", settles the outcome's centre.
    const qualAts = [[], [cue(s, "说清它在什么情况下成立", "and its limits")],
      en ? [cue(s, "", "able to recognize"), cue(s, "", "or handle the next"), cue(s, "", "or handle the next")] : [cue(s, "或应对", ""), cue(s, "应对", "")]];
    const ats = termAts.map(v => v[0]), settles = qualAts[2][1];
    // The third gloss, the longest, takes two lines, so the column's right edge stays near its other rows'; in English
    // it breaks before the occurrence both verbs act on, so its first line is the longer and the row's three lines,
    // with the outcome's name, do not zigzag.
    const width = 640, widths = [width, width, L(320, 420)], R = 64, TR = 18, run = 150, taskName = L("一项任务", "A task");
    // The stage's extents from the task: the rows' names begin 300 px right of it, the task's name centres on it and the
    // reports' column begins 186 px left of it.
    const lineW = (parts, w, size) => Math.max(...growTexts(parts, w, size).map(line => line.reduce((sum, [, v]) => sum + measure(v, size), 0)));
    const rowsEnd = 300 + Math.max(...rows.map(([term, qual], i) => Math.max(lineW(term, widths[i], LABEL), qual.length ? lineW(qual, widths[i], NOTE) : 0)));
    const columnMid = (rowsEnd - Math.max(TR + 7, measure(taskName) / 2)) / 2, stageMid = (rowsEnd - 186) / 2;
    const TY = CONTENT_CY + 30, TX = Math.round(960 - (columnMid + stageMid) / 2), MX = TX + run + R, NX = MX + R + NAME_GAP, RX = TX - 160;
    const ys = [TY - 170, TY, TY + 170], colors = [P.ink, P.evidence, P.authority];
    // Until the first outcome arrives the task stands right of its place, balanced between the task alone and the task
    // with its ways and the outcomes' name (in English, whose task stands alone only briefly, mostly the latter), and it
    // moves to its place with the first outcome, on its words. The outcomes' name begins `run` right of the task, at its
    // rings' left, past the ways' ends.
    const pairMid = (run + measure(L("三件事", "Three things")) - Math.max(TR + 7, measure(taskName) / 2)) / 2;
    const early = 960 - TX - L(.35, .8) * pairMid;
    ctx.save(); ctx.translate(early * (1 - glide(t, ats[0] + .05, early)), 0);
    token(TX, TY, {r: TR, alpha: out * named(t, task)});
    nameText(taskName, TX, TY + TR + 7 + NAME_GAP, {valign: "top", alpha: out * named(t, task)});
    rows.forEach(([term, qual], i) => {
      const y = ys[i], on = ramp(t, ats[i] - .15, .4) * out, lit = speaking(t, ats, i), c = colors[i];
      // The outcome's way from the task draws out on the count, one after another, to the place its ring takes.
      link(TX + TR + 14, TY, MX - R - 8, y, {route: "hvh", mid: (TX + MX - R) / 2, alpha: out, draw: {t, at: three + .05 + .12 * i}});
      ring(MX, y, R, {color: c, alpha: on, width: 2.5 + lit, draw: {t, at: ats[i] - .15}});
      // A solved problem is one decisive check.
      if (i === 0) check(MX + 2, y + 2, 50, {alpha: on, draw: {t, at: ats[i] + .2}, width: 5});
      // A tested judgment: the judgment, then the boundary where it holds drawn around it.
      if (i === 1) { dot(MX, y, 11, {color: c, alpha: on}); box(MX - 36, y - 28, 72, 56, {stroke: c, alpha: named(t, qualAts[1][0]) * out, radius: 10}); }
      // Recognized better: the rings widen; handled better: the centre settles. Each later part of the gloss beats on one
      // more ring inside the outcome's own, on its words, so the mark answers the sentence as it is said.
      if (i === 2) {
        for (let k = 0; k < 2; k++) ring(MX, y, 20 + k * 18, {color: c, alpha: on * (1 - k * .3), width: 2, draw: {t, at: ats[i] + k * .3}});
        dot(MX, y, 7, {color: c, alpha: named(t, settles) * out});
        beats(t, MX, y, R - 12, en ? qualAts[2] : [cue(s, "更好地发现", ""), settles], {color: c, alpha: out});
      }
      // Each outcome is named on its words.
      // The list sets every qualifier one way, under its term, since one of them is too long to run on its line.
      const top = y - termRowLayout(term, qual, widths[i], false).height / 2;
      termRow(t, term, termAts[i], qual, qualAts[i], NX, top, {width: widths[i], alpha: out * listLevel(t, ats, i), set: "outcomes", inline: false});
      // Three required reports, one level with each outcome on the task's other side, are refused on the last words.
      documentIcon(RX - 26, y - 34, 52, 68, {alpha: named(t, reports) * out * .8, stroke: P.muted, rows: 3});
    });
    const head = ys[0] - R - NAME_GAP;
    nameText(L("三件事", "Three things"), MX - R, head, {align: "left", valign: "bottom", alpha: out * named(t, three)});
    // The refused reports' name starts at their column's left edge, its cross following it, as the outcomes' name starts
    // at its rings' left edge. The English name says the reports' kind, as its three pages count them: with its count
    // it would run its cross into the outcomes' name.
    rejectedName(L("三份必须交的报告", "Required reports"), RX - 26, head, {align: "left", valign: "bottom", alpha: out * named(t, reports), mark: ramp(t, reports + .3, .4)});
    ctx.restore();
  }
};

/* ---------------- 03 purpose: two kinds of authority ---------------- */
/* The extent a container has grown to: `base` plus each step's size, each step growing over 0.35 s from 0.3 s before the
 * words of the member it makes room for, so the room is there when the member arrives. */
const s03Extent = (t, base, steps) => steps.reduce((v, [at, d]) => v + d * pacedTo(t, at - .1, d), base);
/* One order of authority as a frame that grows with its members: its seal and question head it, and each member's row
 * joins below on its words, the frame widening to each part of the row as the part is named and deepening to hold the
 * row's lines. A rail runs down from the seal to each member's station as the member is named. `rows` are [term,
 * termAts, qual, qualAts, at, gap, color, set, list] with `gap` extra room above the row. A row with a `list` is a spoken
 * list named by its term: its qualifier's parts are the list's members, each its own name in the set `list`, built on
 * its own words where the qualifier stands. With `build`, each other row's qualifier joins it part by part on the
 * parts' own words. With `joined` (for every row, or row by row as an array), a qualifier that names the rest of a
 * rank's members continues its term's line at the term's size, muted, so one enumeration is set at one size with its
 * list marks' own spacing. The frame is laid out at its final width, centred, and opens at the width of what it holds
 * so far, from `frameAt` when its head stands before the words that announce the order, standing right of its place
 * while it opens so what it holds is balanced. It keeps one padding on every side, and returns to its head's own frame,
 * moving toward the centre, when the order leaves. */
function s03Order(t, g, {FT, color, question, questionAt, rows, station, width = 560, leave = Infinity, frameAt = -Infinity, build = false, joined = false, leanMax = 120}) {
  const SR = 50, PAD = 60, qx = SR * 2 + NAME_GAP, nx = SR + 11 + NAME_GAP, joins = r => Array.isArray(joined) ? joined[r] : joined;
  const qW = measure(question, LABEL), layouts = rows.map(([term, , qual], r) => joins(r) && qual.length
    ? {one: true, height: blockHeight(growLines([...term, ...qual], width).length)} : termRowLayout(term, qual, width));
  const termW = rows.map(([term]) => Math.min(width, measure(term.join(""), LABEL)));
  // A list's members, and with `build` each qualifier's parts, widen the frame one at a time as each is named.
  const members = rows.map(([term, , qual, , , , , , list], r) => list || (build && qual.length) ? s03Members(term, qual, width, joins(r) && !list) : null);
  const rowW = rows.map(([, , qual], r) => members[r] ? Math.max(termW[r], ...members[r].map(v => v.right))
    : layouts[r].one ? termW[r] + (qual.length ? TERM_GAP + measure(qual.join(""), NOTE) : 0)
    : Math.max(termW[r], Math.min(width, measure(qual.join(""), NOTE))));
  const headW = PAD + qx + qW + PAD, FW = Math.max(headW, ...rowW.map(w => PAD + nx + w + PAD));
  const FX0 = Math.round(960 - FW / 2), SY = FT + PAD + SR, H0 = 2 * (PAD + SR);
  const termH = labelSize(LABEL), heights = layouts.map(v => v.height);
  const tops = rows.reduce((acc, [, , , , , gap], r) => [...acc, (r ? acc[r - 1] + heights[r - 1] + 40 : FT + H0 + 16) + gap], []);
  // Growth steps: each row's term widens and deepens the frame on its words, and its qualifier on its own words; a
  // list's members do so each on its own words.
  const steps = [];
  let w = headW, b = FT + H0;
  rows.forEach(([, termAts, qual, qualAts], r) => {
    const parts = [[termAts[0], PAD + nx + termW[r] + PAD, tops[r] + termH + PAD]];
    if (members[r]) members[r].forEach(v => parts.push([qualAts[v.k], PAD + nx + v.right + PAD, tops[r] + v.bottom + PAD]));
    else if (qual.length) parts.push([qualAts[0], PAD + nx + rowW[r] + PAD, tops[r] + heights[r] + PAD]);
    parts.sort((p, q) => p[0] - q[0]).forEach(([at, pw, pb]) => {
      steps.push([at, Math.max(0, pw - w), Math.max(0, pb - b)]);
      w = Math.max(w, pw); b = Math.max(b, pb);
    });
  });
  // When the order leaves, its rows go as a whole, and once they have gone the frame closes snugly around its head, 30 px
  // clear of the seal and the question on every side, and the head glides to the centre as the frame closes round it:
  // the frame's edges close on their own easing, so the frame has closed before the next name stands under it, and the
  // head and the frame's place follow as a glide.
  const home = (FW - headW) / 2, gone = 1 - ramp(t, leave + .05, .3), CLOSE = 30;
  // The frame closes at the tip pace: its sides over their way, and its top and foot over theirs, so its foot has
  // risen past the place of the name that follows it before that name stands.
  const fullBottom = steps.reduce((v, [, , db]) => v + db, FT + H0), closing = FW - headW + PAD - CLOSE;
  const back = drawShare(t, leave + .35, closing, Math.max(.65, home / 300)), centring = glide(t, leave + .35, home);
  const rise = drawShare(t, leave + .35, fullBottom - SY - SR - CLOSE, .65);
  // The order stands balanced as its frame opens and closes. While the frame is narrower than its full width the order
  // stands right of its place by half the width still to come, at most `leanMax` px, and follows each widening as a
  // glide, so the order itself never travels faster than the eye follows while its frame's edges open on the widening's
  // easing.
  const grown = s03Extent(t, headW, steps.map(([at, dw]) => [at, dw]));
  const lean = width => Math.min(leanMax, (FW - width) / 2), widths = steps.reduce((v, [, dw]) => [...v, v.at(-1) + dw], [headW]);
  const shift = steps.reduce((v, [at], k) => { const d = lean(widths[k + 1]) - lean(widths[k]); return v + d * glide(t, at - .3, d); }, lean(headW));
  const FX = FX0 + mix(shift, home, centring), SX = FX + PAD + SR;
  const left = mix(FX, FX + PAD - CLOSE, back), top = mix(FT, FT + PAD - CLOSE, rise);
  const right = mix(FX + grown, FX + headW - PAD + CLOSE, back);
  const bottom = mix(s03Extent(t, FT + H0, steps.map(([at, , db]) => [at, db])), SY + SR + CLOSE, rise);
  box(left, top, right - left, bottom - top, {stroke: color, alpha: g * .85 * ramp(t, frameAt - .15, .4), radius: 16, width: 3});
  seal(SX, SY, SR, {color, alpha: g});
  nameText(question, FX + PAD + qx, SY, {align: "left", color, alpha: g * named(t, questionAt)});
  // The rail runs down from the seal to each station as its member is named. A station stands on its term's line; a list
  // whose members stand under its term and are said before it stands its station on the members' first line, so the
  // members never hang below their station while the name they are said before is still to come.
  const ats = rows.map(([, , , , at]) => at), ys = tops.map((top, r) => {
    const [, termAts, , qualAts, , , , , list] = rows[r], first = members[r]?.[0];
    return top + (list && first && first.y > 0 && Math.min(...qualAts) < termAts[0] ? first.y + labelSize(NOTE) / 2 : termH / 2);
  });
  const reach = ats.reduce((sum, at, r) => { const d = ys[r] - (r ? ys[r - 1] : SY + SR + 6); return sum + drawShare(t, at - .15, d, .5) * d; }, 0);
  if (reach > 1) line(SX, SY + SR + 6, SX, SY + SR + 6 + reach, {color: P.line, alpha: g * gone, width: 2});
  rows.forEach(([term, termAts, qual, qualAts, at, , rowColor, set, list], r) => {
    station(SX, ys[r], r, ramp(t, at - .15, .4) * g * gone, speaking(t, ats, r));
    const x = SX + 11 + NAME_GAP, o = {width, color: rowColor ?? color, alpha: g * listLevel(t, ats, r, leave), set, build};
    if (joins(r) && !list && qual.length) {
      // The rank's other members continue its line at the term's size and in its ink, each on its own words, so a rank
      // reads as one line of equals in its rank's colour. Its whole name joins the parts as a term row does, the opening
      // space of the qualifier taken as the join.
      const whole = [...term, qual[0].trimStart(), ...qual.slice(1)].join(" ");
      growName(t, term, termAts, x, tops[r], {...o, whole});
      members[r].forEach(v => growName(t, [v.text], [build ? qualAts[v.k] : qualAts[0]], x + v.x, tops[r] + v.y, {color: o.color, alpha: o.alpha, whole, set}));
      return;
    }
    if (!list) { termRow(t, term, termAts, qual, qualAts, x, tops[r], o); return; }
    // A list's name stands as its own name, and each member as its own, on its words, at the list's levels.
    growName(t, term, termAts, x, tops[r], {...o, whole: term.join("")});
    members[r].forEach(v => growName(t, [v.text], [qualAts[v.k]], x + v.x, tops[r] + v.y, {size: NOTE, color: P.muted,
      alpha: o.alpha * listLevel(t, qualAts, v.k), whole: qual[v.k].replace(/^[、，,\s]+/u, ""), set: list}));
  });
  return {SX, ys, tops, heights, head: FT + H0};
}
/* A term row's qualifier laid out as termRow sets it, piece by piece: each piece's member `k`, its `text`, its place
 * (`x`, `y` of its line's top) and its extent (`right`, and `bottom` with the term's line), from the row's top left. A
 * member whose separator hangs at the end of the line before has a piece on each line. A `joined` qualifier continues
 * the term's line at the term's size, wrapping with it. */
function s03Members(term, qual, width, joined = false) {
  if (joined) {
    const em = labelSize(LABEL);
    return growTexts([...term, ...qual], width, LABEL).flatMap((line, r) => {
      let left = 0;
      return line.map(([k, text]) => {
        const x = left, y = r * em * LEADING;
        left += measure(text, LABEL);
        return {k: k - term.length, text, x, y, right: left, bottom: y + em};
      });
    }).filter(v => v.k >= 0);
  }
  const {one} = termRowLayout(term, qual, width), head = blockHeight(growLines(term, width).length), em = labelSize(NOTE);
  const x0 = one ? measure(term.join(""), LABEL) + TERM_GAP : 0, y0 = one ? (labelSize(LABEL) - em) / 2 : head + TERM_STACK;
  return growTexts(qual, one ? Infinity : width, NOTE).flatMap((line, r) => {
    let left = x0;
    return line.map(([k, text]) => {
      const x = left, y = y0 + r * em * LEADING;
      left += measure(text, NOTE);
      return {k, text, x, y, right: left, bottom: Math.max(head, y + em)};
    });
  });
}
scenes["03"] = function (s, t) {
  const [bind, agentAt, search, reason, act, people] = cues(s, [["这份指南适用于部门成员", "the guidelines apply to members"], ["智能体", "agents they delegate"],
    ["调查", "investigate"], ["推理", "reason"], ["和动手", "and act"], ["始终在人手里", "stay with people"]]);
  const duties = cues(s, [["方向", "direction"], ["授权", "authorization"], ["决定", "decisions"], ["后果", "responsibility for consequences"]]);
  // The two kinds of authority are both named in the thought that counts them: authority to act, and authority about
  // facts.
  const [two, apart, decideQ, factQ] = cues(s, [["两种依据", "two kinds of authority"], ["分开看", "stay apart"], ["行动依据", "authority to act"],
    ["事实依据", "authority about facts"]]);
  const ranks = cues(s, [["法律", "law"], ["这件事的决策负责人", "what the decision owner"], ["有效的契约", "then contracts"], ["工作计划、临时约定", "work plans provisional agreements"]]);
  // Both editions name authority to act again as the thought that answers it begins. Chinese announces its order right
  // after those words, so the two kinds give way to the order's head as the name ends, on 「依据」, and its frame stands
  // alone only briefly before its first rank; English first says what that authority answers, so the two kinds stand
  // through it and give way as the order is announced. The frame of the order opens on its announcement, in English on
  // its last word, and takes it as its title.
  const order = cue(s, "有先后", "it has an order"), actQ = cueFrom(s, "行动依据", "authority to act", factQ);
  const orderCut = en ? order : cueFrom(s, "依据", "", actQ);
  // The second kind is named again where its answer begins.
  const truthQ = cueFrom(s, "事实依据", "authority about facts", ranks[3]);
  // English says what each kind answers as the thought about it begins, where Chinese says both as it names the two.
  const asks = en ? [cueFrom(s, "", "answers", actQ), cueFrom(s, "", "answers", truthQ)] : [Infinity, Infinity];
  const [record, observe, onlyLeads] = cues(s, [["原始记录", "primary records"], ["能重复的观察", "repeatable observations"], ["只能算线索", "only leads"]]);
  // What an observation must state, in the order each edition speaks it.
  const attrs = en ? cues(s, [["", "a source"], ["", "time"], ["", "subject"], ["", "scope"]]) : cues(s, [["并说清来源", ""], ["时间", ""], ["对象和范围", ""]]);
  // The leads, in the order each edition speaks them.
  const leads = en ? cues(s, [["", "second-hand accounts"], ["", "caches"], ["", "generated views"], ["", "agent output"], ["", "memory"]])
    : cues(s, [["转述", ""], ["记忆", ""], ["缓存", ""], ["派生视图", ""], ["智能体的输出", ""]]);
  const [noTrue, conflict, report, quiet] = cues(s, [["假的变成真的", "make a false fact true"],
    ["核验却发现数据有错", "verification finds the data wrong"], ["讲出冲突和影响", "report the conflict"], ["悄悄按决定或核验结果去做", "act as if one side"]]);
  // The example's decision: the release set for today.
  const release = cue(s, "定了今天发布", "if a release is set for today");
  const [expert, missing, domainOwner, alone] = cues(s, [["专业判断", "professional judgment belongs"], ["缺了哪一样", "either is missing"],
    ["相应领域的负责人", "bring in the domain owner"], ["懂行", "expertise alone"]]);
  // Both editions say first that expertise is not authority.
  const noPower = cueFrom(s, "不等于有权", "no authority to decide", alone), judgeAt = Math.min(expert, alone);

  // 1. The guidelines apply to members and the Agents they delegate to: one frame holds both figures, joined by the
  // delegation, each above its own column. The frame opens around the members on the first words, which apply to them, and
  // grows as what it applies to arrives: it widens to the Agent on the words that bring the Agent or the delegation, and it
  // deepens to each row of the columns as the row's first item is named. What the Agent can do builds under it;
  // direction, authorization, decisions and the responsibility for consequences build under the members, and the
  // members' column takes their colour when the words say these stay with people. The stage holds until the two kinds
  // of authority are named.
  const membersAt = cue(s, "部门成员", "members"), delegate = cue(s, "委托", "delegate to");
  // How far a column's rail has drawn down from `top`: to each station from the one above it as its item is named, as a
  // share of the rail's length to the last station.
  const reachOf = (ats, ys, top) => ats.reduce((sum, at, i) => { const d = ys[i] - (i ? ys[i - 1] : top); return sum + drawShare(t, at - .15, d, .5) * d; }, 0)
    / (ys[ats.length - 1] - top);
  const g1 = ramp(t, opening(s), .7) * stageOut(t, two);
  if (g1 > 0) {
    // The frame keeps one padding, 32 px, round what it holds: left of the members' name, right of the Agents' name, above
    // the delegation's name and below each row it deepens to.
    const MX = 640, AX = 1240, FY = 440, rows = [550, 624, 698, 772], PADG = 32, FT = FY - 90;
    const abilities = [search, reason, act], agentName = L("智能体", "Agents"), membersName = L("部门成员", "Members");
    const FL = MX - 36 - NAME_GAP - measure(membersName) - PADG, below = labelSize(LABEL) / 2 + PADG;
    const rowAt = rows.map((_, r) => Math.min(duties[r], abilities[r] ?? Infinity));
    // The frame takes its wide form with the words that bring the Agent or the delegation, whichever is first (in
    // Chinese the delegation's words begin with 及其, the members who delegate), so the members' small frame does not stand
    // alone through the words before it.
    const widen = Math.min(agentAt, delegate, en ? Infinity : cue(s, "及其委托", ""));
    // The Chinese members' small frame stands centred until it widens, and the stage glides to its place as the frame
    // widens over 1.1 s on the smoothstep curve, both setting off just after the members are named, before the
    // delegation's words: the right edge, moving against the glide, stays near the drawing pace, the frame covers its
    // share of the band within two seconds of the first words, and the stage stays balanced as it widens. The English frame, which does not glide, opens to the Agent's side as the members' small
    // frame gives way to the wide one over 0.4 s on the Agent's words, so no edge sweeps through the Agent or its name.
    // The frame reaches past the wider of the Agent's name and the names of what it may do, so no name meets its edge.
    const abilityNames = en ? ["Investigate", "Reason", "Act"] : ["调查", "推理", "动手"];
    const reachRight = Math.max(AX + 34 + NAME_GAP + measure(agentName), AX + 9 + NAME_GAP + Math.max(...abilityNames.map(v => measure(v)))) + PADG,
      centred = 960 - (FL + MX + 120) / 2;
    ctx.save(); ctx.translate(en ? 0 : centred * (1 - glide(t, widen - .45, centred)), 0);
    const bottom = s03Extent(t, FY + 80, rowAt.map((at, r) => [at, Math.max(0, rows[r] + below - (r ? Math.max(FY + 80, rows[r - 1] + below) : FY + 80))]));
    if (en) {
      const wideQ = ramp(t, widen - .15, .4);
      box(FL, FT, MX + 120 - FL, bottom - FT, {stroke: P.muted, alpha: g1 * (1 - wideQ), radius: 16, width: 2.5});
      box(FL, FT, reachRight - FL, bottom - FT, {stroke: P.muted, alpha: g1 * wideQ, radius: 16, width: 2.5});
    } else box(FL, FT, mix(MX + 120, reachRight, ease((t - widen + .45) / 1.1)) - FL, bottom - FT, {stroke: P.muted, alpha: g1, radius: 16, width: 2.5});
    nameText(L("这份指南", "Guidelines"), FL, FT - NAME_GAP, {align: "left", valign: "bottom", color: P.muted, alpha: g1 * named(t, bind)});
    person(MX, FY, {alpha: g1, color: P.authority, size: 1.2});
    nameText(membersName, MX - 36 - NAME_GAP, FY - 6, {align: "right", color: P.authority, alpha: g1 * named(t, membersAt)});
    // The Agent stands beside the members on its own words.
    agent(AX, FY - 6, {alpha: ramp(t, agentAt - .15, .4) * g1, size: 1.3});
    nameText(agentName, AX + 34 + NAME_GAP, FY - 6, {align: "left", color: P.evidence, alpha: g1 * named(t, agentAt)});
    // The delegation runs from the members to the Agent, one point travelling along it.
    link(MX + 44, FY - 6, AX - 40, FY - 6, {alpha: g1 * ramp(t, delegate - .1, .3), draw: {t, at: delegate - .1},
      flowing: since(t, delegate + .6)});
    nameText(L("委托", "Delegate"), (MX + AX) / 2, FY - 6 - NAME_GAP, {valign: "bottom", color: P.muted, alpha: g1 * named(t, delegate)});
    // Two columns hang from the figures. Each column's rail draws down to an item as it is named and the item's mark stands
    // at its end; the item being said lights its mark.
    const columns = [[MX, duties, en ? ["Direction", "Authorization", "Decisions", "Responsibility for consequences"] : ["方向", "授权", "决定", "后果"], P.authority, "duties"],
      [AX, abilities, abilityNames, P.ink, "abilities"]];
    columns.forEach(([x, ats, names, color, set], c) => {
      const last = rows[ats.length - 1], own = c ? 0 : ramp(t, people + .05, .3), reach = reachOf(ats, rows, FY + 40);
      link(x, FY + 40, x, last, {alpha: g1, upto: reach, end: false});
      if (own > 0) link(x, FY + 40, x, last, {color: P.authority, alpha: g1 * own, upto: reach, end: false, width: 2.5});
      ats.forEach((at, i) => {
        const y = rows[i], q = ramp(t, at - .15, .4) * g1, lit = speaking(t, ats, i);
        dot(x, y, 10.5, {color, alpha: q});
        if (lit > 0) ring(x, y, 17, {color, alpha: lit * restMark(color, .5) * g1, width: 2});
        nameText(names[i], x + 9 + NAME_GAP, y, {align: "left", color, alpha: g1 * listIn(t, ats, i), set});
      });
    });
    ctx.restore();
  }

  // 2. The two kinds of authority. On the words that count them one frame, sized to them, stands under their name with
  // an open question mark in each half, as large as the seal that will answer it so the frame never stands as an empty
  // form, and a divider parts it into two on the words that keep them apart. Each kind then takes its seal and stands
  // under it on its own words: the seal's rim closes around the mark, and once the rim stands the mark gives way and
  // the seal is stamped where it stood, so the half is never empty and the mark never shares its place with the stamp.
  // The frame grows to hold the kind's name, and the stage gives way as the first kind's order begins. English names
  // authority to act again to say what it answers before it announces the order: the count's name gives way as the
  // kind is named again, and the question the kind answers stands under its name, smaller, on the words that say it
  // answers, the frame deepening to hold it.
  const versus = cue(s, "行动依据不能", "authority to act cannot");
  const kinds = stageIn(t, two) * stageOut(t, orderCut);
  if (kinds > 0) {
    // The pair stands where the guidelines' frame stood, so the frame reads as re-formed in place rather than moved.
    // The frame stands symmetric about its divider, and each kind stands at the centre of its half with its name under
    // it: 220 px from the divider in a half of 440 px, or a half as wide as the widest name and its padding on both
    // sides, so each kind keeps equal room toward the divider and the border. The frame opens snug round the two
    // question marks (half as wide as a 100 px mark, plus 30 px), so what it holds fills it; on the first kind's words it
    // widens on both sides at once to hold that kind, its seal and its name, with the padding beyond them, and on the
    // second kind's words to its halves, so it stays at least half filled while the second kind still waits for its
    // seal. From the first kind's words each kind stands at the centre of its half of the frame as it stands, moving out
    // with the frame. It deepens, by the padding above the seals, to hold each kind's name and the question it answers,
    // and the divider runs its full height.
    const SY = CONTENT_CY + 60, R = 60, P0 = 38, on = kinds * named(t, two);
    const questions = [L("行动依据", "Authority to act"), L("事实依据", "Authority about facts")];
    const ask = L("", "Who may decide what to do");
    const widest = Math.max(2 * R, ...questions.map(v => measure(v, LABEL)), en ? measure(ask, NOTE) : 0);
    const halfW = Math.max(440, widest + 2 * P0), sx = halfW / 2, open = sx + 27 + 30, qTop = SY + R + NAME_GAP;
    const first = Math.min(halfW, Math.max(open, sx + Math.max(R, measure(questions[0], LABEL) / 2) + P0));
    const half = s03Extent(t, open, [[decideQ, first - open], [factQ, halfW - first]]), left = 960 - half, right = 960 + half;
    const kx = mix(sx, half / 2, glide(t, decideQ - .3, sx - open / 2));
    const low = s03Extent(t, SY + R + P0, [[decideQ, NAME_GAP + labelSize(LABEL)], [asks[0], TERM_STACK + labelSize(NOTE)]]);
    box(left, SY - R - P0, right - left, low - SY + R + P0, {stroke: P.line, alpha: on, radius: 16, width: 3});
    // The count's name gives way as the first kind is named, in English as it is named again to say what it answers.
    nameText(L("两种依据", "Two kinds of authority"), 960, SY - R - P0 - NAME_GAP, {valign: "bottom",
      alpha: on * (1 - ramp(t, L(decideQ, actQ) + .05, .3))});
    if (en) nameText(ask, 960 - kx, qTop + labelSize(LABEL) + TERM_STACK, {valign: "top", size: NOTE, color: P.muted, alpha: kinds * named(t, asks[0])});
    [[960 - kx, decideQ, P.authority], [960 + kx, factQ, P.evidence]].forEach(([x, at, color]) => {
      text("?", x, SY, 100, {role: "mark", align: "center", color, alpha: on * (1 - ramp(t, at + .1, .3))});
      seal(x, SY, R, {color, alpha: kinds * named(t, at), stamp: kinds * ramp(t, at + .35, .3)});
    });
    line(960, SY - R - P0, 960, low, {color: P.line, alpha: kinds * ramp(t, apart - .1, .4), width: 4});
    nameText(questions[0], 960 - kx, qTop, {valign: "top", color: P.authority, alpha: kinds * named(t, decideQ)});
    nameText(questions[1], 960 + kx, qTop, {valign: "top", color: P.evidence, alpha: kinds * named(t, factQ)});
  }
  // 3. The first kind's order on the words that begin it: a frame in its colour, headed by its seal and name and
  // centred, that opens with its head and grows with the order of authority to act, one rank to a row, each rank
  // within the one above it. The rail draws down to each rank as it is named, and the rank's station, a mark that
  // shrinks from rank to rank, stands at its end. Each rank is named by its spoken words: a rank that enumerates sets its
  // head term and, in the rank's ink on the same line at the same size, the rest of what it holds, so each enumeration
  // is set at one size and in one ink; the owner's decision is qualified by its owner, smaller. When the second kind is
  // named again the ranks leave
  // as a whole and the frame returns to its head; once it has closed, the second kind's seal and name stand under it, in
  // English with the question it answers on the words that say it answers, and the stage gives way on the words that
  // name the first of its answers.
  const g2 = stageIn(t, orderCut) * stageOut(t, record);
  if (g2 > 0) {
    // The English frame is wide and its first rank comes a second after the frame opens, so until that rank comes the
    // stage stands 150 px right, its opening head and title centred with the frame's own lean, and glides back as it
    // comes; the frame leans right by half the width its ranks have still to take, up to 220 px, so the order also
    // stands centred as its first rank builds. The English frame opens on the announcement's last word, "precedence", so its head does not stand in it
    // alone for over a second of speech before the first rank comes.
    ctx.save(); ctx.translate(L(0, 150 * (1 - glide(t, ranks[0] - .1, 150))), 0);
    const colors = [P.authority, P.authority, P.ink, P.muted];
    // Each rank as [term, qualifier], named by its spoken words: a rank that lists several members names its first as
    // its term and the rest as its qualifier, and each further member joins the qualifier on its own words, so a rank
    // said over several seconds keeps building. The second rank is the owner's decision, never the owner: both editions
    // say the owner first and name the whole phrase, so the rank's name ends on the decision in both editions. A term
    // keeps the punctuation that follows it, and an English
    // enumeration's qualifier opens on the space that continues the term's line.
    const names = en ? [[["Law,"], [" regulation, security requirements", " and mandatory company policy"]],
      [["What the decision owner for this matter explicitly decides"], []],
      [["Contracts,"], [" policies", ", specifications", " and decision records in force"]],
      [["Work plans,"], [" provisional agreements", " and personal preferences"]]]
      : [[["法律、"], ["监管、安全要求", "和公司的强制性制度"]], [["这件事的决策负责人作出的明确决定"], []],
        [["有效的契约、"], ["制度", "、规范", "和决策记录"]], [["工作计划、"], ["临时约定", "和个人偏好"]]];
    // What each rank holds, as it is said: its station beats once for each member after the first, on the words that
    // bring that member to the rank's qualifier.
    const members = (en ? [["regulation", "security requirements", "mandatory company policy"], [],
      ["policies", "specifications", "decision records"], ["provisional agreements", "personal preferences"]]
      : [["监管", "安全要求", "公司的强制性制度"], [], ["制度", "规范", "决策记录"], ["临时约定", "个人偏好"]])
      .map((rest, r) => [ranks[r], ...rest.map(v => cueFrom(s, v, v, ranks[r]))]);
    // The words each qualifier's parts join on: each further member's. Both editions name their first rank's members
    // in two parts, so the frame stands near its full width from the first and the rank still grows while the rest is
    // said, and the order's opening frame, its head alone, never stands thin for long.
    const parts = members.map(m => m.slice(1));
    parts[0] = [members[0][1], members[0][3]];
    const head = s03Order(t, g2, {FT: L(320, 280), leave: truthQ, width: L(640, 960), leanMax: L(120, 220), color: P.authority, question: L("行动依据", "Authority to act"), questionAt: decideQ, frameAt: en ? cueFrom(s, "", "precedence", order) : order,
      build: true, joined: en ? [true, false, true, true] : true, rows: names.map(([term, qual], r) => [term, [ranks[r]], qual, parts[r], ranks[r], 0, colors[r], "ranks"]),
      station: (x, y, r, q, lit) => {
        dot(x, y, 11, {color: P.ground, alpha: q});
        dot(x, y, 11, {color: P.line, alpha: q, hollow: true, width: 2});
        dot(x, y, 12.5 - r * 1.5, {color: colors[r], alpha: q});
        beats(t, x, y, 19, members[r].slice(1), {color: colors[r], alpha: g2, lit});
      }});
    // The order's title stands over the frame's corner from the words that announce it and leaves with the ranks.
    nameText(L("有先后", "Order of precedence"), head.SX - 110, L(320, 280) - NAME_GAP, {align: "left", valign: "bottom", color: P.muted,
      alpha: g2 * named(t, order) * (1 - ramp(t, truthQ + .05, .3))});
    // The second kind is named as the ranks leave, so it stands once they have gone, as its words end. It stands centred
    // under the closed head, the English with the question it answers under its name.
    const other = L("事实依据", "Authority about facts"), answers = "What can establish what is true", oy = head.head + 150;
    const ow = 72 + NAME_GAP + Math.max(measure(other, LABEL), en ? measure(answers, NOTE) : 0), ox = 960 - ow / 2;
    const asked = truthQ + .85;
    seal(ox + 36, oy, 36, {color: P.evidence, alpha: g2 * ramp(t, asked - .15, .4)});
    nameText(other, ox + 72 + NAME_GAP, oy, {align: "left", color: P.evidence, alpha: g2 * named(t, asked)});
    if (en) nameText(answers, ox + 72 + NAME_GAP, oy + labelSize(LABEL) / 2 + TERM_STACK, {align: "left", valign: "top", size: NOTE,
      color: P.muted, alpha: g2 * named(t, asks[1])});
    ctx.restore();
  }
  // 4. The second kind's answer on the words of its first member: its own frame, headed by its seal and name and
  // centred, opens with primary records and grows with what establishes a fact. Primary records and repeatable
  // observations stand on the rail under the fact seal; the leads stand below a bar across it, and their way up toward
  // the seal stops at the bar. The leads are a list: each is named on its own words where the row's qualifier stands,
  // and the name that calls them only leads comes last, on its own words. The Chinese rows are set within the width of
  // the order of authority to act, so the leads stand under their name and the frame stands nearer the centre while its
  // first rows build. The English leads, five names of one list, each begin with a capital, as Agent output must. The
  // order holds until the first refusal of the next thought is said.
  const g3f = stageIn(t, record) * stageOut(t, versus);
  if (g3f > 0) {
    const facts = en ? [[["Primary records"], [record], [], []],
      [["Repeatable observations"], [observe], ["with a source", ", time", ", subject", " and scope"], attrs],
      [["Only leads"], [onlyLeads], ["Second-hand accounts", ", Caches", ", Generated views", ", Agent output", ", Memory"], leads]]
      : [[["原始记录"], [record], [], []], [["能重复的观察"], [observe], ["并说清来源", "、时间", "、对象和范围"], attrs],
        [["只能算线索"], [onlyLeads], ["转述", "、记忆", "、缓存", "、派生视图", "、智能体的输出"], leads]];
    const starts = facts.map(([, termAts, , qualAts]) => Math.min(...termAts, ...qualAts));
    // A row's station beats once for each part of the row after the first as it is said.
    const parts = facts.map(([, termAts, , qualAts], r) => r === 2 ? qualAts : [...termAts, ...qualAts]);
    const {SX, ys, tops} = s03Order(t, g3f, {FT: 260, width: L(640, 760), color: P.evidence, question: L("事实依据", "Authority about facts"), questionAt: truthQ,
      build: true, rows: facts.map(([term, termAts, qual, qualAts], r) => [term, termAts, qual, qualAts, starts[r], r === 2 ? 30 : 0, r < 2 ? P.evidence : P.muted, "facts",
        r === 2 ? "leads" : null]),
      station: (x, y, r, q, lit) => {
        dot(x, y, 11, {color: P.ground, alpha: q});
        dot(x, y, 11, {color: P.line, alpha: q, hollow: true, width: 2});
        if (r < 2) dot(x, y, 12.5, {color: P.evidence, alpha: q}); else ring(x, y, 12.5, {color: P.unknown, alpha: q, width: 3});
        beats(t, x, y, 19, parts[r].slice(1), {color: r < 2 ? P.evidence : P.unknown, alpha: g3f, lit});
      }});
    const barY = tops[2] - 26, tried = ramp(t, leads[0] - .15, .4) * g3f;
    link(SX, ys[2] - 14, SX, barY + 12, {color: P.unknown, alpha: tried, upto: drawShare(t, leads[0] - .1, Math.abs(barY + 12 - (ys[2] - 14)), .7), end: false, dash: [6, 6]});
    line(SX - 24, barY, SX + 24, barY, {color: P.unknown, alpha: ramp(t, leads[0] + .45, .3) * g3f, width: 4});
  }

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
  if (g4c > 0) {
    const M = 960, Y = 520, AX = M - 480, BX = M + 480, R = 50, PY = 300, DY = 770, xs = [M - 260, M + 260];
    const factAt = cueFrom(s, "事实依据", "a fact does not", versus), grant = cue(s, "给不了动手的权限", "grant permission");
    const ox = 0;
    seal(AX + ox, Y - 14, R, {alpha: g4c});
    nameText(L("行动依据", "Authority to act"), AX + ox, Y - 14 + R + NAME_GAP, {valign: "top", color: P.authority, alpha: g4c * named(t, versus)});
    seal(BX, Y - 14, R, {color: P.evidence, alpha: g4c});
    nameText(L("事实依据", "Authority about facts"), BX, Y - 14 + R + NAME_GAP, {valign: "top", color: P.evidence, alpha: g4c * named(t, versus)});
    beats(t, AX + ox, Y - 14, R + 10, [release], {color: P.authority, alpha: g4c});
    beats(t, BX, Y - 14, R + 10, [conflict], {color: P.evidence, alpha: g4c});
    // The two refused names stand alike, one line each, whose seals stand far enough apart to take them whole, so no
    // line splits the phrase it refuses; their crosses, centred on their names, stand level, and they mirror each other
    // about the middle: each cross stands toward the middle beside its way's bar, its name beyond it, the left name
    // ending 16 px before its cross as the right name begins 16 px after its own. The fact's way sets off on the fact's
    // words, or half a second before what it cannot grant is named where that comes later, as in English, so the way
    // never stands long before its name.
    [[AX + R + 14, M - 35, noTrue, noTrue, L("把假的变成真的", "Make a false fact true"), Infinity, -1, ox],
      [BX - R - 14, M + 35, Math.max(factAt, grant - .5), grant, L("动手的权限", "Grant permission to act"), Infinity, 1, 0]]
      .forEach(([x0, bar, go, at, v, width, side, dx]) => {
        link(x0 + dx, Y, bar + dx, Y, {color: P.unknown, alpha: ramp(t, go - .1, .3) * g4c, upto: drawShare(t, go + .05, Math.abs(bar + dx - (x0 + dx)), .7), end: false, dash: [8, 8]});
        line(bar + dx, Y - 24, bar + dx, Y + 24, {color: P.unknown, alpha: ramp(t, at + .45, .3) * g4c, width: 4});
        const cross = 26;
        rejectedName(v, (side < 0 ? M - 40 - cross - 16 : M + 40 + cross + 16) + dx, Y - 36, {align: side < 0 ? "right" : "left", valign: "bottom", width,
          alpha: g4c * named(t, at), mark: ramp(t, at + .45, .3), markLeft: (side < 0 ? M - 40 - cross : M + 40) + dx});
      });
    // The middle, where the two meet: the conflict stands there on its words.
    const c = ramp(t, conflict - .15, .4) * g4c;
    ring(M, Y, 24 + 3 * Math.sin(voiceTime(t) * 4), {color: P.unknown, alpha: c, width: 3});
    dot(M, Y, 7, {color: P.unknown, alpha: c});
    // The conflict and its impact are reported: the way up from the conflict draws on as the report is named, and the
    // report stands at its end, named by what it reports; in English by its key words, since the clause is a caption
    // cue of its own.
    const RW = 64, RH = 84, RX = M - RW / 2, RY = PY - RH / 2;
    link(M, Y - 36, M, RY + RH + 12, {color: P.evidence, alpha: ramp(t, report - .1, .3) * g4c, draw: {t, at: report + .05}, width: 2.5});
    documentIcon(RX, RY, RW, RH, {alpha: ramp(t, report + .3, .4) * g4c, rows: 2});
    nameText(L("讲出冲突和影响", "Conflict and impact"), RX + RW + NAME_GAP, PY, {align: "left", alpha: g4c * named(t, report)});
    // The quiet ways out stop at their bars: the record is not altered, and no side is quietly acted for.
    const alter = cue(s, "改记录", "alter the record");
    [[alter, L("改记录", "Alter the record")], [quiet, L("悄悄按决定或核验结果去做", "Silently act as if one side had won")]].forEach(([at, v], k) => {
      link(M, Y + 36, xs[k], DY - 40, {route: "vhv", mid: Y + 150, color: P.unknown, alpha: ramp(t, at - .1, .3) * g4c,
        upto: drawShare(t, at + .05, Math.abs(xs[k] - M) + Math.abs(DY - 40 - (Y + 36)), .7), end: false, dash: [8, 8]});
      line(xs[k] - 24, DY - 40, xs[k] + 24, DY - 40, {color: P.unknown, alpha: ramp(t, at + .45, .3) * g4c, width: 4});
      rejectedName(v, xs[k], DY, {valign: "top", width: 440, alpha: g4c * named(t, at), mark: ramp(t, at + .45, .3)});
    });
  }

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
  if (g5 > 0) {
    const B = 210, PW = 64, lead = 920 - B - PW - NAME_GAP - measure(L("既懂行", "Competence"));
    const tail = Math.max(1480 + measure(L("相应领域的负责人", "Domain owner")) / 2, 920 + B + PW + NAME_GAP + measure(L("又了解事实", "The facts")));
    const needs = 960 - (lead + 920 + B + PW + NAME_GAP + measure(L("又了解事实", "The facts"))) / 2;
    const centring = 960 - (lead + tail) / 2, ox = needs + (centring - needs) * glide(t, domainOwner + .05, centring - needs);
    const PX = 920 + ox, PY = 350, BASE = 590, HANG = 120, OX = 1480 + ox, OY = 520, OS = 1.4, barY = 720, SY = 800;
    const needAts = [cueFrom(s, "既懂行", "competence", expert), cueFrom(s, "又了解事实", "the facts", expert)];
    // The facts' flight from the owner to the empty pan, as a glide over its arc.
    const lost = ramp(t, missing + .05, .3), back = glide(t, domainOwner + .6, Math.abs(1480 - 64 - 920 - B) + 280), gone = lost * (1 - back);
    // The beam tips toward the heavier pan, so it rests level only while both needs are in.
    const landed = needAts.map(at => soon(t, at + .05, .5)), tilt = (landed[0] - landed[1] * (1 - gone)) * .12;
    const ends = [[PX - B * Math.cos(tilt), PY + B * Math.sin(tilt)], [PX + B * Math.cos(tilt), PY - B * Math.sin(tilt)]];
    const pans = ends.map(([x, y]) => [x, y + HANG]);
    line(PX, PY, PX, BASE, {color: P.ink, alpha: g5, width: 3});
    line(PX - 70, BASE, PX + 70, BASE, {color: P.ink, alpha: g5, width: 3});
    line(...ends[0], ...ends[1], {color: P.ink, alpha: g5, width: 4});
    dot(PX, PY, 7, {color: P.ink, alpha: g5});
    nameText(L("专业判断", "Professional judgment"), PX, PY - 30 - NAME_GAP, {valign: "bottom", alpha: g5 * named(t, expert)});
    // Each pan hangs from its end of the beam on two strings: a shallow bowl through the strings' feet. The four strings
    // are one stroke and the two bowls another, so the balance is one instrument rather than repeated strings and bowls
    // each waiting for a name of its own.
    const BOWL = [Math.PI * .344, Math.PI * .656];
    stroke(() => pans.forEach(([x, y], i) => [-PW, PW].forEach(d => { ctx.moveTo(...ends[i]); ctx.lineTo(x + d, y); })), {color: P.line, alpha: g5, width: 2});
    stroke(() => pans.forEach(([x, y]) => { ctx.moveTo(x + 136 * Math.cos(BOWL[0]), y - 120 + 136 * Math.sin(BOWL[0])); ctx.arc(x, y - 120, 136, ...BOWL); }),
      {color: P.ink, alpha: g5, width: 3});
    pans.forEach(([x, y], i) => {
      const lit = speaking(t, needAts, i);
      if (lit > 0) ring(x, y - 24, 32, {color: P.evidence, alpha: lit * restMark(P.evidence, .5) * g5, width: 2});
    });
    // Competence lands in the left pan and the facts in the right; the facts leave when one is missing, and a question
    // stands in their place until the domain owner's facts land there. The question inks in over 0.4 s, as a mark that
    // arrives does, so no frame takes it from unseen to firm.
    const [[lx, ly], [rx, ry]] = pans, q = needAts.map(at => ramp(t, at - .15, .4) * g5);
    ring(lx, ly - 24, 18, {color: P.evidence, alpha: q[0], width: 2.5});
    check(lx, ly - 23, 18, {alpha: q[0]});
    documentIcon(rx - 17, ry - 50, 34, 44, {alpha: q[1] * (1 - lost), rows: 3});
    text("?", rx, ry - 26, 26, {role: "mark", align: "center", color: P.unknown, alpha: q[1] * ramp(t, missing + .35, .4) * (1 - back)});
    nameText(L("既懂行", "Competence"), PX - B - PW - NAME_GAP, PY + HANG - 12, {align: "right", alpha: g5 * listIn(t, needAts, 0), set: "needs"});
    nameText(L("又了解事实", "The facts"), PX + B + PW + NAME_GAP, PY + HANG - 12, {align: "left", color: blend(P.ink, P.muted, gone),
      alpha: g5 * listIn(t, needAts, 1), set: "needs"});
    // The domain owner is brought in on the right with the facts, which travel over the facts' name into the empty pan:
    // they leave the owner straight up and sweep across on one curve, so they clear their name's end before they pass
    // over it, and they set off and land at rest.
    const come = ramp(t, domainOwner - .15, .4) * g5;
    person(OX, OY, {color: P.authority, alpha: come, size: OS});
    nameText(L("相应领域的负责人", "Domain owner"), OX, OY + 15 * OS * 1.51 + NAME_GAP, {valign: "top", color: P.authority, alpha: g5 * named(t, domainOwner)});
    const fx0 = OX - 64, fy0 = OY - 2, fx = fx0 + back * back * (rx - fx0), fy = fy0 - 2 * back * (1 - back) * 280 + back * back * (ry - fy0);
    documentIcon(fx - 17, fy - 50, 34, 44, {alpha: come * lost, rows: 3});
    // Expertise alone does not reach the power to decide or act.
    link(PX, BASE + 10, PX, barY, {color: P.unknown, alpha: ramp(t, alone - .1, .3) * g5, upto: drawShare(t, alone + .05, Math.abs(barY - (BASE + 10)), .7), end: false, dash: [8, 8]});
    line(PX - 28, barY, PX + 28, barY, {color: P.unknown, alpha: ramp(t, noPower + .05, .3) * g5, width: 4});
    nameText(L("懂行", "Expertise alone"), PX - 24, (BASE + 10 + barY) / 2, {align: "right", alpha: g5 * named(t, alone)});
    seal(PX, SY, 34, {alpha: g5 * .9 * named(t, noPower), hollow: true});
    nameText(L("有权决定或动手", "Authority to decide or act"), PX, SY + 34 + NAME_GAP, {valign: "top", color: P.authority, alpha: g5 * named(t, noPower)});
  }
};

/* ---------------- 04 purpose: four boundaries, form follows risk ---------------- */
scenes["04"] = function (s, t) {
  const [four, truth, bounds, owner, done, inside, near, breach, form, high, duty] = cues(s, [
    ["四条底线", "four boundaries"], ["说真话", "tell the truth"], ["守边界", "stay in bounds"], ["责任落到人", "name the owner"],
    ["不虚报完成", "do not claim false completion"], ["在这四条底线之内", "inside these boundaries"], ["会越线时", "would cross one"],
    ["已经越线", "after a breach"], ["要留多少记录", "risk sets the process"], ["涉及生产", "production funds"],
    ["不论风险高低", "whatever the risk"]]);
  // The field the four boundaries enclose stands through the first two stages; its sides run clockwise from the top, one
  // for each boundary. While the four are only counted it stands centred; from the first boundary's thought it glides
  // with its name to its place at the left, and the first boundary's row comes in beside it as the field clears it.
  // The column beside the field: the four boundaries in the first stage and the three cases in the second, each a key
  // term with, under it, what it rules out or covers in its key words. Each column is set narrow enough that its rows'
  // blocks are about one width, so it builds as one block.
  const boundaryRows = en ? [
    ["Tell the truth", ["no fabrication", ", hiding", ", cherry-picking", " or false certainty"]],
    ["Stay in bounds", ["subject and time", ", professional competence", " and permission", ", data, security, compliance", " and action"]],
    ["Name the owner", ["every important judgment", ", decision", ", change", " and acceptance"]],
    ["Do not claim false completion", ["without current evidence", " matching the claim", ", call nothing complete", ", correct",
      ", usable", " or adopted"]]]
  : [
    ["说真话", ["不编造", "、不隐瞒", "、不挑着说", "、没把握的不说成有把握"]],
    ["守边界", ["对象和时间", "、专业能力和权限", "，数据、安全、合规", "和行动的界限"]],
    ["责任落到人", ["重要的判断", "、决定", "、变更", "和验收", "，都有人负责"]],
    ["不虚报完成", ["说做完了", "、做对了", "、能用了", "、有人在用", "，都要有当前的、对得上的证据"]]];
  const caseRows = en ? [["Inside these boundaries", ["autonomy", ", exploration", ", creative work"]],
    ["When an action would cross one", ["stop", ", make it visible", ", escalate"]],
    ["After a breach", ["stop", ", disclose", ", correct within authority", ", escalate by risk"]]]
  : [["底线之内", ["欢迎自主", "、探索", "和创造"]], ["会越线", ["停下来", "，讲出来", "，并上报"]],
    ["已经越线", ["就停下受影响的事", "，如实说明", "，在权限内纠正", "，并按风险上报"]]];
  // The Chinese cases are named by their key words, 底线之内, 会越线 and 已经越线, so no case row repeats its spoken
  // clause whole; they are the narrower column, so it stands nearer the field. The English columns take a qualifier of
  // up to 620 px on one line, since none of their two-line breaks would stand even.
  const W1 = L(480, 620), W2 = L(360, 620), LX1 = 840, LX2 = L(900, 940);
  // The field and its column stand centred between the column's first picture and its whole one: in the first stage the
  // first boundary alone and all four, in the second the cases before the breach and all three (in English, whose last
  // gloss, on one line, is far the widest, the first two alone, moving on the breach's words to all three). So each stage leans no
  // further one way while its column builds than the other way once it is built; the field and the column move together
  // to the second stage's place on the words that open it. Places are reckoned from the field's left edge.
  const rowW = ([term, qual], W) => Math.max(measure(term), ...growTexts(qual, W, NOTE).map(line => line.reduce((sum, [, v]) => sum + measure(v, NOTE), 0)));
  const place = (LX, widths, built) => 960 - (290 + LX + (Math.max(...widths.slice(0, built)) + Math.max(...widths)) / 2) / 2;
  const caseW = caseRows.map(v => rowW(v, W2));
  const ox = mix(place(LX1, boundaryRows.map(v => rowW(v, W1)), 1), L(place(LX2, caseW, 2), place(LX2, caseW.slice(0, 2), 2)), soon(t, inside + .05, .55))
    + L(0, place(LX2, caseW, 3) - place(LX2, caseW.slice(0, 2), 2)) * soon(t, breach + .05, .55);
  const formed = stageIn(t, truth);
  // The glide sets off on the first word of the first boundary's thought, over the field's whole way, and the first
  // row's key and words wait until the field's right side has passed them.
  const go = Math.max(...thoughtJoins.map(([, next]) => next).filter(v => v <= truth + 1e-6)) + .05;
  const way = 735 - 290 - place(LX1, boundaryRows.map(v => rowW(v, W1)), 1), clear = go + .85 * glideTime(way);
  const FX = mix(735, 290 + ox, glide(t, go, way)), FY = 275, FS = 450, corner = [[FX, FY], [FX + FS, FY], [FX + FS, FY + FS], [FX, FY + FS]];
  const starts = [truth, bounds, owner, done], field = stageOut(t, form);
  // What each boundary rules out or covers, part by part as it is said.
  const said = en ? [
    cues(s, [["", "no fabrication"], ["", "no hiding"], ["", "no cherry-picking"], ["", "no uncertainty"]]),
    cues(s, [["", "subject and time"], ["", "professional competence and permission"], ["", "data security compliance"], ["", "and action"]]),
    cues(s, [["", "every important"], ["", "decision"], ["", "change"], ["", "acceptance"]]),
    cues(s, [["", "without current evidence"], ["", "matching the claim"], ["", "call nothing complete"], ["", "correct"], ["", "usable"],
      ["", "or adopted"]])] : [
    cues(s, [["不编造", ""], ["不隐瞒", ""], ["不挑着说", ""], ["没把握的", ""]]),
    cues(s, [["对象和时间", ""], ["专业能力和权限", ""], ["数据安全合规", ""], ["行动的界限", ""]]),
    cues(s, [["重要的", ""], ["决定", ""], ["变更", ""], ["验收", ""], ["有人负责", ""]]),
    cues(s, [["说做完了", ""], ["做对了", ""], ["能用了", ""], ["有人在用", ""], ["都要有当前的", ""]])];
  // Each boundary is drawn from what it covers: its side turns gold one step per part as the part is said, the English
  // last boundary stepping on each claim it withholds too, so the field closes as the four are spelled out.
  const steps = said;
  const gold = j => saidShare(t, steps[j]);
  // On "four boundaries" the four sides are counted in one after another at the structure tier; each side lights while
  // its line is spoken and turns gold as its parts are said, keeping the colour once named.
  // While only counted the square is drawn as two strokes that meet at its corners, its horizontal and its vertical
  // sides, read as one field under its name. From the first boundary's cut its settled sides are one stroke and the
  // gold of the sides already whole another, so the field stays one mark under its name rather than four repeated sides
  // each waiting for a name of its own; the side being spoken, drawn wider, and a side still turning gold stand on their
  // own, so each change is drawn where it is seen.
  const counted = j => soon(t, Math.min(four - .1, opening(s) + .3) + j * .25, .5);
  const sideTo = (j, q) => { const [x1, y1] = corner[j], [x2, y2] = corner[(j + 1) % 4]; return [x1, y1, mix(x1, x2, q), mix(y1, y2, q)]; };
  const sides = (share, keep, o) => stroke(() => corner.forEach((_, j) => {
    const q = share(j);
    if (keep(j) && q > .01) { const [x1, y1, x2, y2] = sideTo(j, q); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); }
  }), {alpha: field, width: 4, ...o});
  if (!formed) [0, 1].forEach(k => sides(counted, j => j % 2 === k, {color: P.line}));
  else {
    const lits = corner.map((_, j) => speaking(t, starts, j)), golds = corner.map((_, j) => gold(j)), quiet = j => lits[j] <= 0;
    sides(counted, quiet, {color: P.line});
    sides(gold, j => quiet(j) && golds[j] >= 1, {color: P.authority});
    corner.forEach((_, j) => {
      const width = 4 + 2 * lits[j];
      if (!quiet(j)) line(...sideTo(j, counted(j)), {color: P.line, alpha: field, width});
      if (golds[j] > 0 && (!quiet(j) || golds[j] < 1)) line(...sideTo(j, golds[j]), {color: P.authority, alpha: field, width});
    });
  }
  // 1. The four boundaries build into one column beside the field, each a key term and, smaller, what it rules out or
  // covers in its key words. Each row's mark is the field in small with that boundary's own side drawn as a solid gold
  // edge, standing with its boundary's words.
  const one = stageOut(t, inside);
  if (one > 0) {
    // Every qualifier stands under its term, since some are too long to run on their term's line, so the list sets its
    // glosses one way: each Chinese qualifier takes two lines and the English ones two or three, at one pitch.
    const rows = boundaryRows, LX = LX1 + ox, W = W1, G = 36;
    const tops = stackTops(rows.map(([term, qual]) => termRowLayout([term], qual, W, false).height), CONTENT_CY, 44);
    rows.forEach(([term, qual], r) => {
      // The first boundary's row comes in as the gliding field clears it, its key a quarter second after its words, so
      // neither stands inside the field; each further row comes in on its own words.
      const at = r ? starts[r] : Math.max(truth + STAGE_CUT + .15, clear), keyAt = r ? at : at + .25;
      const my = tops[r] + labelSize(LABEL) / 2, gx = LX - 34 - G, h = G / 2;
      const c = [[gx, my - h], [gx + G, my - h], [gx + G, my + h], [gx, my + h]], [a, b] = [c[r], c[(r + 1) % 4]];
      box(gx, my - h, G, G, {stroke: P.line, alpha: one * ramp(t, keyAt - .15, .4), radius: 2, width: 2});
      // The boundary's own side, solid and thick, so the key reads as that side of the field rather than a checkbox.
      const drawn = soon(t, keyAt - .15, .5);
      if (drawn > 0) line(a[0], a[1], mix(a[0], b[0], drawn), mix(a[1], b[1], drawn), {color: P.authority, alpha: one, width: 8, cap: "butt"});
      // The English fourth boundary is said over five seconds, the claims it withholds last, so its qualifier builds
      // part by part on their words; the other rows stand whole on theirs.
      termRow(t, [term], [at], qual, said[r], LX, tops[r], {width: W, alpha: one * listLevel(t, starts, r), set: "boundaries",
        build: en && r === 3, inline: false});
    });
  }
  nameText(L("四条底线", "Four boundaries"), FX, FY - NAME_GAP, {align: "left", valign: "bottom", alpha: field * named(t, four)});
  // 2. Inside the four lines work moves freely. An action about to cross one halts short of its side, is made
  // visible and is escalated to the owner who stands in the field; an action that has crossed stops outside, is
  // disclosed, is brought back within authority and is escalated as the risk requires. The column beside the field names
  // the three cases, each part on its own words, and the case being spoken lights its mark.
  const two = stageIn(t, inside) * field;
  if (two > 0) {
    const freeAts = cues(s, [["欢迎自主", "autonomy"], ["探索", "exploration"], ["创造", "creative work"]]);
    const nearAts = [cueFrom(s, "停下来", "stop", near), ...cues(s, [["讲出来", "make it visible"], ["并上报", "and escalate"]])];
    const outAts = cues(s, [["停下受影响", "stop the affected"], ["如实说明", "disclose it"], ["在权限内纠正", "correct it within"], ["按风险上报", "escalate as the risk"]]);
    const free = ramp(t, freeAts[0] - .15, .5) * two;
    for (let k = 0; k < 5; k++) {
      const x = FX + 96 + Math.sin(voiceTime(t) * .6 + k * 1.9) * 52, y = FY + FS / 2 - 10 + Math.cos(voiceTime(t) * .47 + k * 2.4) * 110;
      dot(x, y, 8, {color: P.evidence, alpha: free * .9});
    }
    // The owner stands inside the field's top right corner; both escalations end at it. Each escalation leaves its action
    // 14 px clear of the action's ring, so the way up is a mark of the field in its own right and never takes over the
    // action it starts from.
    const OX = FX + FS - 46, OY = FY + 70, owner = ramp(t, nearAts[2] - .15, .4) * two;
    person(OX, OY, {color: P.authority, alpha: owner, size: .8});
    const nx = mix(FX + FS * .5, FX + FS - 46, soon(t, near - .1, 1.0)), ny = FY + FS * .6, nq = ramp(t, near - .15, .4) * two;
    dot(nx, ny, 10, {color: P.ink, alpha: nq});
    ring(nx, ny, 20, {color: P.authority, alpha: ramp(t, nearAts[1] - .15, .3) * two, width: 2});
    link(nx, ny - 34, OX, OY + 42, {color: P.authority, alpha: two, draw: {t, at: nearAts[2] - .1}, width: 2.5});
    // The breach crosses the bottom side on its words, stops outside and returns inside when it is corrected.
    const bx = FX + 210, out = soon(t, breach - .1, .7), back = soon(t, outAts[2] - .1, .8), by = mix(FY + FS - 60, FY + FS + 46, out * (1 - back));
    const bq = ramp(t, breach - .15, .3) * two;
    dot(bx, by, 10, {color: blend(P.ink, P.unknown, clamp(out * 2) * (1 - back)), alpha: bq});
    ring(bx, by, 20, {color: P.authority, alpha: ramp(t, outAts[1] - .15, .3) * two, width: 2});
    link(bx, by - 34, OX - 30, OY, {route: "vh", color: P.authority, alpha: two, draw: {t, at: outAts[3] - .1}, width: 2.5});
    const rows = caseRows.map(([term, qual], r) => [term, [[inside, near, breach][r]], qual, [freeAts, nearAts, outAts][r]]);
    // Every case's parts stand under its name, as the boundaries' qualifiers do, since the breach's are too long to run
    // on its line; they take two lines, so the whole column is about as wide as its first two cases.
    const LX = LX2 + ox, W = W2, rowAt = [inside, near, breach], hue = [P.evidence, P.ink, P.unknown];
    const tops = stackTops(rows.map(([term, , qual]) => termRowLayout([term], qual, W, false).height), CONTENT_CY, 64);
    rows.forEach(([term, termAts, qual, qualAts], r) => {
      const my = tops[r] + labelSize(LABEL) / 2, lit = speaking(t, rowAt, r);
      dot(LX - 34, my, 8, {color: hue[r], alpha: two * ramp(t, rowAt[r] - .15, .4)});
      if (lit > 0) ring(LX - 34, my, 17, {color: hue[r], alpha: two * lit * restMark(hue[r], .6), width: 2});
      termRow(t, [term], termAts, qual, qualAts, LX, tops[r], {width: W, alpha: two * listLevel(t, rowAt, r), set: "cases", inline: false});
    });
  }
  // 3. Risk sets the process: the three tiers build down one spine of rising risk, named by the words that open the
  // stage, one tier to each thought. Each tier is a document of the size its risk calls for, the work it serves on its
  // left, smaller and muted, and the process itself on its right, each side named by its key words in a block of a few
  // lines that stands on its words, the high-risk work in the two groups it is said in; each document stands on the
  // words that name its process, and its rows are written as its contents are named.
  const three = stageIn(t, form) * stageOut(t, duty);
  if (three > 0) {
    const onceAt = cue(s, "一次讲清", "one clear exchange"), recordAt = cue(s, "现有的工作记录", "the existing work record");
    const needs = cues(s, [["书面决定", "written decision"], ["明确授权", "explicit authorization"], ["回滚或降级预案", "a rollback or degradation path"],
      ["独立评审", "independent review"], ["最后由人验收", "human acceptance"]]);
    // Chinese names the high-risk work before what it needs, English after; English counts its triggers from their
    // second mention, which defines high risk.
    const highFrom = en ? cue(s, "", "high risk means") : high;
    // The English high-risk work breaks only between its conditions, so each coordinated pair stands whole.
    const triggers = (en ? ["production", "funds", "sensitive data", "security or compliance", "deletion", "external commitments",
      "irreversible consequences"] : ["生产", "资金", "敏感数据", "安全合规", "或者删除覆盖", "对外承诺", "后果不可逆"]).map(w => cueFrom(s, en ? "" : w, en ? w : "", highFrom));
    const lowAts = cues(s, [["局部", "local"], ["可逆", "reversible"], ["不对外承诺", "no external commitment"]]);
    const midAts = cues(s, [["跨角色", "cross-role"], ["有几种方案", "or work with"], ["重大不确定", "or material uncertainty"]]);
    // The record's rows are written on the words that name its contents, in both editions.
    const problemAt = cueFrom(s, "问题", "the problem", recordAt);
    const recordRows = [problemAt, cueFrom(s, "方案", "options", problemAt), cueFrom(s, "做法", "execution path", problemAt),
      cueFrom(s, "验收", "acceptance", problemAt)];
    const onceRows = en ? [0, 1, 2].map(k => onceAt + .2 + k * .3) : [cue(s, "结论", ""), cue(s, "依据", ""), cueFrom(s, "行动", "", onceAt)];
    const tiers = en ? [
      [["One clear exchange"], [onceAt], ["Local", ", reversible work", " with no external commitment"], lowAts, onceRows],
      [["The existing work record:", " the problem", ", options", ", execution path", " and acceptance"], [recordAt, ...recordRows],
        ["Cross-role or extended work", ", or work with competing options", " or material uncertainty"], midAts, recordRows],
      [["Written decision", "Explicit authorization", "Rollback or degradation", "Independent review", "Human acceptance"], needs,
        ["Production,", "funds,", "sensitive data,", "security or compliance,", "deletion or overwrite,", "external commitments",
          "or irreversible consequences"], triggers, needs]]
    : [
      [["一次讲清", "结论", "、依据", "和行动"], [onceAt, ...onceRows], ["局部", "、可逆", "、不对外承诺的工作"], lowAts, onceRows],
      [["在现有的工作记录里写清", "问题", "、方案", "、做法", "和验收"], [recordAt, ...recordRows], ["工作跨角色", "、周期长", "、有几种方案", "或者有重大不确定性"],
        [midAts[0], cue(s, "周期长", ""), midAts[1], cueFrom(s, "或者", "", midAts[1])], recordRows],
      [["书面决定", "、明确授权", "、回滚或降级预案", "、独立评审", "，最后由人验收"], needs,
        ["涉及生产", "、资金", "、敏感数据", "、安全合规，", "或者删除覆盖", "、对外承诺", "、后果不可逆的事"], triggers, needs]];
    // Risk rises down one spine through the three documents; the work stands on its left, one spoken part to a line set
    // against the document, and the form it calls for on its right, so every row reads across and grows toward its mark.
    // Each side is set as a balanced block of a few lines, so the highest tier's requirements face the conditions that
    // call for them as two even blocks, and each document is large enough to read as its rung of the ladder.
    // The work column sets each condition as a block of even lines; the English column is narrower, so its blocks
    // balance the forms across the spine. In Chinese each tier's name, said in the list that opens the stage, heads its
    // work in ink at the label size; the first tier's work stands on one line; the middle tier's conditions stand as a
    // list of the two clauses they are said in, each on one line, 「或者」 opening the second, so the ladder shows at most
    // twelve names with the three tiers' names; and the high-risk work, the longest, is one block of three even lines,
    // each part joining it on its words, so no line of a block stands under
    // four fifths of its longest and no last line under three fifths. In English the first tier's work stands on one
    // line, which no break would keep even, and the middle tier's breaks before each "or". The high-risk work and
    // requirements keep the words they are said in. In English the seven conditions of high risk stand as one name, one
    // condition to a line, each joining it on its words, so the ladder still shows twelve names; no break of them keeps
    // an even block, a declared exception to the block rule. The five English requirements,
    // which no break keeps in a block's shape either, stand as a list, one name to a line. In Chinese they take two
    // lines in a 540 px column, the first through 「回滚或降级预案」 and the second from 「独立评审」: of their five
    // spoken parts no three lines keep a block's shape, since 「回滚或降级预案、」 alone is under four fifths of either
    // neighbour, so the block runs past the lower tiers' processes rather than breaking a part.
    // The Chinese work column is 360 px for the first and last tiers, which takes the first tier's fourteen characters on
    // one line and breaks the last tier's thirty-seven into lines of twelve, eleven and twelve; the middle tier's 380 px
    // holds its longer clause, 「工作跨角色、周期长、有几种方案」, on one line.
    const W = 600, QW = i => L([360, 380, 360][i], [620, 420, 600][i]), tw = i => i === 2 ? L(540, 760) : W, docs = [[60, 76], [86, 110], [118, 152]], GAP = 45 + 34;
    // The parts that begin each group of a tier's work, and each name of a tier's form: the English high-risk
    // requirements are five names, one to a line, and its work one name of seven lines.
    const groups = i => !en && i === 1 ? [0, 3] : en && i === 2 ? [0, 1, 2, 3, 4, 5, 6] : [0], forms = i => en && i === 2 ? [0, 1, 2, 3, 4] : [0];
    const workWhole = i => en && i === 2 ? tiers[2][2].join(" ") : null;
    // The height of a Chinese tier's name over its work.
    const headH = en ? 0 : labelSize(LABEL) + TERM_STACK;
    // The spine stands where the ladder is balanced. Each tier's work reaches left of the spine and its form right of
    // it, and where a side holds no block yet the spine's own names and documents reach half their width. The ladder's
    // pictures follow the words: each tier's work and then its form, except the English high-risk tier, which says its
    // form first, and in Chinese, which lists the tiers before it speaks of each, the spine with its documents before
    // them. Through each of three stretches, before the first form is said, until the third tier's first block is whole
    // and after it, the ladder stands so that no picture of the stretch leans further one way than another leans the
    // other, so the first work never leans far while its form is still to come, and it glides to the next stretch's
    // place on the words that begin it: the first form's, and those of that block's last part, which leave the whole
    // ladder centred. In English, whose first work is one long line, the second stretch ends where the second form
    // begins instead, so the first work and its form stand centred while the second work joins them, and the ladder
    // with both forms stands centred from the second form's words to the end. The English spine stands alone only until the first work is said, too briefly to count. The next
    // stage re-forms in its cut, so the ladder need not end where that stage's middle document stands.
    const blockW = (parts, width, size, g = [0]) => Math.max(...s04Groups(parts, g).flatMap(([, v]) =>
      growTexts(v, width, size).map(line => line.reduce((sum, [, piece]) => sum + measure(piece, size), 0))));
    const lefts = tiers.map(([, , qual], i) => blockW(qual, QW(i), NOTE, groups(i))), rights = tiers.map(([term], i) => blockW(term, tw(i), LABEL, forms(i)));
    const head = L("要留多少记录、走多少手续", "The process"), foot = L("风险", "Risk");
    const axis = Math.max(measure(head) / 2, measure(foot) / 2, docs[2][0] / 2);
    const reach = (blocks, widths) => blocks.length ? GAP + Math.max(...blocks.map(i => widths[i])) : axis;
    // The offset from the spine of the centre of a picture holding the work of tiers `l` and the forms of tiers `r`, and
    // the place that centres a set of pictures so that none leans further one way than another leans the other.
    const lean = ([l, r]) => (reach(r, rights) - reach(l, lefts)) / 2;
    const centred = pictures => -(Math.min(...pictures.map(lean)) + Math.max(...pictures.map(lean))) / 2;
    const workFirst = !en, third = workFirst ? triggers.at(-1) : needs.at(-1);
    const pictures = en ? [[[0], []], [[0], [0]], [[0, 1], [0]], [[0, 1], [0, 1]], [[0, 1], [0, 1, 2]], [[0, 1, 2], [0, 1, 2]]]
      : [[[], []], [[0], []], [[0], [0]], [[0, 1], [0]], [[0, 1], [0, 1]], [[0, 1, 2], [0, 1]], [[0, 1, 2], [0, 1, 2]]];
    const first = pictures.findIndex(([, r]) => r.length), last = pictures.length - 2, second = pictures.findIndex(([, r]) => r.length > 1);
    const [alone, built, whole] = [pictures.slice(0, first), pictures.slice(first, en ? second : last + 1), pictures.slice(en ? second : last)].map(centred);
    const turn = en ? tiers[1][1][0] : third;
    // In Chinese the spine stands alone through a whole thought before the first work is said, so it stands centred
    // alone and moves on the work's words to centre the work with it; English says its first work at once.
    const lone = en ? alone : -lean(pictures[0]), joined = en ? alone : -lean(pictures[1]);
    const SX = 960 + lone + (joined - lone) * glide(t, tiers[0][3][0] + .05, joined - lone) + (built - joined) * glide(t, tiers[0][1][0] + .05, built - joined)
      + (whole - built) * glide(t, turn + .05, whole - built);
    // Each tier is spoken in its own thought, which opens with its work in English and with its tier's name in Chinese.
    const tierAt = en ? tiers.map(([, , , qualAts], i) => i < 2 ? qualAts[0] : cue(s, "", "high-risk work"))
      : [cue(s, "轻量档", ""), cue(s, "标准档", ""), cue(s, "高风险档", "")];
    const listedAt = en ? [] : cues(s, [["轻量", ""], ["标准", ""], ["高风险", ""]]);
    // A Chinese tier's name stands on its form's first line and its work hangs below it, so the tier takes the height
    // that keeps both sides within it about the document.
    const heights = tiers.map(([term, , qual], i) => {
      const formH = s04Height(term, tw(i), LABEL, forms(i)), leftH = headH + s04Height(qual, QW(i), NOTE, groups(i));
      return Math.max(docs[i][1], formH, leftH, en ? 0 : 2 * leftH - formH);
    });
    const tops = stackTops(heights, CONTENT_CY - 20, 40), mids = tops.map((y, i) => y + heights[i] / 2), end = tops[2] + heights[2] + 24;
    // Risk rises down the spine through three levels; the stage's words name the spine above it. The spine stands whole
    // from the stage's cut, so the stage holds its structure from its first frame, and the point that travels down it
    // stands at full size on it from the cut, already entered, at the flow pace.
    const from = tops[0] - 24;
    link(SX, from, SX, end, {alpha: three, flowing: since(t, form + STAGE_CUT), lag: -.12});
    // In Chinese the thought opens by asking how much record and process the work needs; that question names the spine.
    // In English the process that risk sets names it, since the sentence that says so is a caption cue of its own.
    nameText(head, SX, from - NAME_GAP, {valign: "bottom", alpha: three * named(t, form)});
    nameText(foot, SX, end + NAME_GAP, {valign: "top", color: P.muted, alpha: three * named(t, cueFrom(s, "风险", "risk", form))});
    tiers.forEach(([term, termAts, qual, qualAts, rowAts], i) => {
      // Chinese names the three tiers in one list before it speaks of each, so each tier's document stands on the spine
      // on its name there; English brings each document with the form its tier calls for.
      const docAt = en ? termAts[0] : Math.min(termAts[0], listedAt[i]);
      const [w, h] = docs[i], x = SX - w / 2, y = mids[i] - h / 2, q = three * ramp(t, docAt - .15, .4), lit = speaking(t, tierAt, i);
      // The document masks the spine behind it as it stands, so the spine runs unbroken until then.
      box(x, y, w, h, {fill: P.ground, alpha: q, radius: 4});
      documentIcon(x, y, w, h, {alpha: q, rows: 0, stroke: blend(P.ink, P.evidence, lit)});
      // Its rows are written in turn as one hand's lines, one stroke, so the document stays one mark rather than
      // repeated rows each waiting for a name of its own.
      stroke(() => rowAts.forEach((at, k) => {
        const ry = y + h * (.3 + k * .55 / rowAts.length), x0 = x + w * .14, x1 = x + w * (k % 2 ? .62 : .82), drawn = soon(t, at - .1, .5);
        if (drawn > .01) { ctx.moveTo(x0, ry); ctx.lineTo(mix(x0, x1, drawn), ry); }
      }), {color: P.muted, alpha: q, width: 2});
      const level = three * listLevel(t, tierAt, i);
      // In Chinese the tier's name heads its work, from its words in the list that opens the stage, on the baseline of
      // its form's first line, so the two read as one row across the spine; the work hangs below the name.
      const workH = s04Height(qual, QW(i), NOTE, groups(i)), headY = mids[i] - s04Height(term, tw(i), LABEL, forms(i)) / 2 + labelSize(LABEL) / 2;
      if (!en) nameText(["轻量", "标准", "高风险"][i], SX - GAP, headY, {align: "right", alpha: level * named(t, listedAt[i]), set: "forms"});
      // The work and the form it calls for build part by part on their words; the English high-risk requirements stand
      // as a list, one name to a line.
      s04Grow(t, qual, qualAts, SX - GAP, en ? mids[i] : headY + labelSize(LABEL) / 2 + TERM_STACK + workH / 2, {width: QW(i), size: NOTE,
        color: P.muted, align: "right", alpha: mutedLevel(level), set: "forms", groups: groups(i), build: true, whole: workWhole(i)});
      s04Grow(t, term, termAts, SX + GAP, mids[i], {width: tw(i), alpha: level, set: "forms", groups: forms(i), build: true});
    });
  }
  // 4. Whatever the risk, every duty still applies: the three tiers stand side by side in one row, each inside the same
  // field of four lines. The documents keep the sizes their risk gave them and light as the risk is named; the four
  // sides of every field draw on in the cut and light when the duty is named.
  const four4 = stageIn(t, duty);
  if (four4 > 0) {
    const xs = [560, 960, 1360], S = 260, CY = CONTENT_CY - 50, docs = [[64, 82], [92, 118], [126, 162]];
    const notAt = cue(s, "该尽的义务", "every duty"), formLit = ramp(t, duty - .15, .4) * (1 - ramp(t, notAt - .15, .4));
    const dutyLit = ramp(t, notAt - .15, .4);
    xs.forEach((x, i) => {
      const [w, h] = docs[i];
      documentIcon(x - w / 2, CY - h / 2, w, h, {alpha: four4, rows: 3 + i, stroke: blend(P.ink, P.evidence, formLit)});
    });
    // The same four lines around every tier: one stroke for the three fields, so they read as one set of duties. Their
    // tops are already drawing on in the cut's first frame, so the fields come in with the cut rather than a frame after.
    stroke(() => xs.forEach(x => {
      const c = [[x - S / 2, CY - S / 2], [x + S / 2, CY - S / 2], [x + S / 2, CY + S / 2], [x - S / 2, CY + S / 2]];
      c.forEach(([x1, y1], j) => {
        const [x2, y2] = c[(j + 1) % 4], drawn = drawShare(t, duty + STAGE_CUT - .1 + j * .12, S);
        if (drawn > .01) { ctx.moveTo(x1, y1); ctx.lineTo(mix(x1, x2, drawn), mix(y1, y2, drawn)); }
      });
    }), {color: P.authority, alpha: four4, width: 3 + dutyLit});
    // Two names, each on its words. The risk that sizes the documents stands over the row, centred, on the words that
    // open the stage. The duty that still applies is the same set of fields around every tier: it stands under the row,
    // centred on a bracket that spans the three fields, so no field is named alone and the heaviest tier does not read
    // as the duty itself.
    nameText(L("不论风险高低", "Whatever the risk"), xs[1], CY - S / 2 - NAME_GAP, {valign: "bottom", alpha: four4 * named(t, duty)});
    const BY = CY + S / 2 + 26, bracket = four4 * named(t, notAt);
    stroke(() => { ctx.moveTo(xs[0] - S / 2, BY - 12); ctx.lineTo(xs[0] - S / 2, BY); ctx.lineTo(xs[2] + S / 2, BY); ctx.lineTo(xs[2] + S / 2, BY - 12); },
      {color: P.authority, alpha: bracket, width: 2.5});
    nameText(L("义务一样不能少", "Every duty"), xs[1], BY + NAME_GAP, {valign: "top", alpha: bracket});
  }
};
/* The groups of a name of `parts`, as [the index of the group's first part, its parts]; `groups` holds the index of the
 * part that begins each group. */
const s04Groups = (parts, groups = [0]) => groups.map((k, g) => [k, parts.slice(k, groups[g + 1] ?? parts.length)]);
/* The height of a growing name of `parts` wrapped to `width`, its groups' lines stacked as one block. */
const s04Height = (parts, width, size, groups) => blockHeight(s04Groups(parts, groups).reduce((n, [, v]) => n + growLines(v, width, size).length, 0), size);
/* A name of authored parts set whole as one block centred on y: its lines begin at x, or with `align` right every line
 * ends at x. A long name said in groups is set as one name for each group, `groups` holding the index of the part that
 * begins each: each group stands whole on the words that begin it and its lines follow the group before in one block,
 * so no group stands long before its words; with `build`, each part joins its group on its own words. A list set one
 * part to a line may stand as one name: `whole`, its whole text, names every group. Proposed as a
 * primitive: growName with right alignment and a middle anchor. */
function s04Grow(t, parts, ats, x, y, {width, size = LABEL, align = "left", alpha = 1, color = P.ink, set = null, groups = [0], build = false, whole = null} = {}) {
  const blocks = s04Groups(parts, groups).map(([k, v]) => [k, v, growTexts(v, width, size)]), step = labelSize(size) * LEADING;
  const top = y - blockHeight(blocks.reduce((n, [, , lines]) => n + lines.length, 0), size) / 2;
  let r = 0;
  blocks.forEach(([k, v, lines]) => lines.forEach(line => {
    // A right-aligned line hangs a final list or clause mark half an em past the edge, as names do, since the mark's ink
    // fills only the left of its em, so the line's ink keeps the block's edge.
    const w = line.reduce((sum, [, piece]) => sum + measure(piece, size), 0);
    const hang = align === "right" && /[、，。；：！？]$/u.test(line.at(-1)[1]) ? .5 * labelSize(size) : 0;
    growName(t, line.map(([, piece]) => piece), line.map(([j]) => build ? ats[k + j] ?? ats[k] : ats[k]), align === "right" ? x - w + hang : x,
      top + r++ * step, {size, alpha, color, whole: whole ?? v.join(""), set, build});
  }));
}


/* ---------------- 05 decide: start from the decision ---------------- */
scenes["05"] = function (s, t) {
  const [analysis, which, who, what, when, catalog, notFound, found, meaning, quality, permission, differ] = cues(s, [
    ["分析之前", "before analysis"], ["支持哪个决定", "which decision"], ["谁", "who decides"], ["要决定什么", "what"],
    ["在什么时候之前", "by when"], ["改进数据目录", "wants a better data catalog"], ["找不到数据", "can't find the data"], ["找到了", "do they find it"],
    ["看不懂含义", "what it means"], ["拿不准质量", "how good it is"], ["不知道能不能用", "whether they may use it"],
    ["办法各不相同", "each needs a different fix"]]);
  const [frame, subject, present, criteria, outScope, limits, commit, unclear, stop, ask, collect, change] = cues(s, [
    ["先把问题说清", "frame the problem"], ["针对什么", "its subject and who is affected"], ["现在怎样", "present state"],
    ["怎样算成功", "success criteria"], ["哪些不做", "out of scope"], ["限制也要讲明", "without time cost compliance"],
    ["能执行的承诺", "executable commitment"], ["说不清", "is unclear"], ["停下受影响的事", "stop the affected action"],
    ["请有授权的人来定", "ask an authorized person"], ["收集信息不是目的", "collecting information"], ["能改变哪个判断", "say which judgment it could change"]]);
  const base = ramp(t, opening(s), .7);
  // 1. An analysis is framed by the decision it must support. The analysis gathers left of centre from the chapter's first
  // words as a loose drift inside the open, dashed outline of its frame, which stands with its name on the analysis's own
  // words in the first clause, near enough to the centre to stand alone. On the decision's words one quiet link carries
  // it to the decision, one mark named as it is asked, and the decision's three parts (who, by when, what) branch from
  // it, each arriving on its own words in the order each edition speaks them, while the drift settles into rows and its
  // frame closes: framed, the analysis has its aim. Everything waits for the rising chapter title to clear it.
  // The illustrative case cuts in on its first named mark: the catalog in Chinese, the team that wants it in English.
  const teamAt = cue(s, "大家", "a team"), caseAt = Math.min(catalog, teamAt);
  const one = base * stageOut(t, caseAt);
  if (one > 0) {
    // The decision's name stands over it on the line of its first part, so the two never stand as a staggered pair, and
    // the parts stand far enough right of the decision that its name keeps clear of the branches' turn.
    const parts = en ? [[who, "Who decides", "who"], [what, "What", "what"], [when, "By when", "when"]]
      : [[who, "谁", "who"], [when, "在什么时候之前", "when"], [what, "要决定什么", "what"]];
    // The problem stands centred while it is alone; on the decision's words the stage moves left as the decision joins
    // it, while the drift settles, so the problem and its decision stand centred, and on the first part's words it moves
    // again, so the problem, its decision and the decision's parts stand centred once named. The stage runs from the
    // problem's frame to the decision's name, or once its parts are named to the end of the widest part's name. The frame
    // keeps 44 px round the drift's columns and rows, clear of the drift's 20 px sway and its points.
    const GX0 = 560, DX0 = 1130, IX0 = 1360, SX = 100, FP = 44, partsW = Math.max(...parts.map(([, label]) => measure(label)));
    const alone = 960 - (GX0 + 2 * SX), decided = 960 - (GX0 - FP + DX0 + measure(L("哪个决定", "Which decision")) / 2) / 2;
    const parted = 960 - (GX0 - FP + IX0 + 28 + NAME_GAP + partsW) / 2;
    const sh = alone + (decided - alone) * glide(t, which + .05, decided - alone)
      + (parted - decided) * glide(t, Math.min(...parts.map(([at]) => at)) - .15, parted - decided);
    const g = one * clearOfTitle(s, t, 330), GX = GX0 + sh, GY = 410, SY = 90, DX = DX0 + sh, IX = IX0 + sh, ys = [400, 500, 600];
    const drift = 1 - soon(t, which - .2, 1.2);
    for (let k = 0; k < 15; k++) {
      const x = GX + (k % 5) * SX + Math.sin(k * 2.3 + voiceTime(t) * .7) * 20 * drift;
      const y = GY + Math.floor(k / 5) * SY + Math.cos(k * 1.7 + voiceTime(t) * .6) * 20 * drift;
      dot(x, y, 8, {color: P.muted, alpha: g * .85 * ramp(t, opening(s) + .2 + k * .07, .4)});
    }
    // The frame stands open, dashed, from the problem's words, and closes as the decision frames the problem.
    const frameQ = g * named(t, analysis), closed = soon(t, which + .05, .6), FB = GY + 2 * SY + FP;
    box(GX - FP, GY - FP, 4 * SX + 2 * FP, 2 * SY + 2 * FP, {stroke: P.line, alpha: frameQ * (1 - closed), radius: 14, width: 3, dash: [10, 8]});
    box(GX - FP, GY - FP, 4 * SX + 2 * FP, 2 * SY + 2 * FP, {stroke: P.line, alpha: frameQ * closed, radius: 14, width: 3});
    nameText(L("分析", "Analysis"), GX + 2 * SX, FB + NAME_GAP, {valign: "top", alpha: g * named(t, analysis)});
    link(GX + 4 * SX + FP + 6, 500, DX - 30, 500, {alpha: g, draw: {t, at: which - .05}, flowing: since(t, which + .75)});
    // The decision: a ring with its point, named as it is asked; its parts branch from it.
    const ats = parts.map(([at]) => at), dec = named(t, which) * g;
    ring(DX, 500, 22, {color: P.authority, alpha: dec, width: 3});
    dot(DX, 500, 8, {color: P.authority, alpha: dec});
    nameText(L("哪个决定", "Which decision"), DX, ys[0], {color: P.authority, alpha: dec});
    parts.forEach(([at, label, kind], i) => {
      const y = ys[i], q = ramp(t, at - .1, .4) * g, lit = speaking(t, ats, i);
      link(DX + 28, 500, IX - 34, y, {route: "hvh", mid: IX - 50, alpha: g, draw: {t, at: at - .15}});
      if (lit > 0) ring(IX, y, 36, {color: P.authority, alpha: lit * restMark(P.authority, .5) * g, width: 2});
      if (kind === "who") person(IX, y + 9, {size: .72, alpha: q});
      if (kind === "when") clock(IX, y, 15, {hand: .3, alpha: q});
      if (kind === "what") diamond(IX, y, 15, {color: P.authority, alpha: q, solid: true});
      nameText(label, IX + 28 + NAME_GAP, y, {align: "left", alpha: g * listIn(t, ats, i), set: "decision"});
    });
  }
  // 2. An illustrative case, a better data catalog, as a tree: either people cannot find the data, or they find it and
  // three questions stay open. The case opens centred on the catalog and the people who use it, each on its own words;
  // on the words of its first question the tree grows from the catalog, which in English glides to the left with it. Each node and
  // the branch to it arrive on the node's own words; when the fixes are said to differ every problem lights and gains a
  // fix of its own shape in one column, linked along its row.
  const two = base * stageIn(t, caseAt) * stageOut(t, frame);
  illustrative(two);
  if (two > 0) {
    // The tree grows on the case where it stands: each node and branch arrives on its own words, and in English the case
    // glides from the first question's words to stand centred on the answers.
    const tree = 1, CY = 485, rows = [310, 660, 530, 660, 790];
    const names = en ? ["Can't find the data", "They find it", "What it means", "How good it is", "Whether they may use it"]
      : ["找不到数据", "找到了", "看不懂含义", "拿不准质量", "不知道能不能用"];
    // The tree's places from the catalog at x 520: the two answers at 800, the three questions at 1160, and the fixes one
    // column right of the longest problem's name, so the shortest link along a row is 70 px.
    const ends = [800, 800, 1160, 1160, 1160].map((x, i) => x + 16 + NAME_GAP + measure(names[i], LABEL));
    const FX0 = Math.max(...[0, 2, 3, 4].map(i => ends[i])) + 24 + 70 + 30;
    // Before the tree the English case stands centred on the team and the catalog, and its tree re-forms centred on its
    // answers. The Chinese names the catalog first and its users only as the tree begins, so its case cuts in on the
    // catalog 130 px left of the centre, clear of where the decision and its link stood, and moves from the cut to stand
    // centred while the catalog and then its users stand alone; its tree grows from the catalog where it stands and the
    // stage moves back as it grows, its answers standing within the frame's balance. The tree then stands centred on its
    // questions from the words of the first, and on the whole tree as the fixes join it, moving left on those words. The
    // team stands TEAM px left of the catalog's centre, its far edge 62 px further, and the catalog's edge 111 px right of
    // it; in English, where the team and the catalog stand alone until the first question, the team stands further out,
    // so the pair covers a tenth of the band.
    const fixW = Math.max(13, ...wrapName(L("各不相同", "A different fix"), 260).map(v => measure(v) / 2));
    const TEAM = L(215, 310), far = TEAM + 62;
    const opened = L(830, 960 + (far - 111) / 2), centred = right => 960 - (520 - far + right) / 2;
    const lone = en ? 0 : (960 - opened) * glide(t, catalog + STAGE_CUT, 960 - opened) * (1 - glide(t, notFound + STAGE_CUT, 960 - opened));
    const answered = en ? centred(Math.max(ends[0], ends[1])) : opened - 520, asked = centred(Math.max(...ends)), whole = centred(FX0 + fixW);
    const T = answered + (asked - answered) * glide(t, meaning + .05, asked - answered) + (whole - asked) * glide(t, differ + .05, whole - asked) + lone;
    // The fixes join the tree at their final place, as it moves to stand centred with them.
    const lead = en ? (opened - 520 - answered) * (1 - glide(t, notFound + .05, opened - 520 - answered)) : 0;
    const CX = 520 + T + lead, N1 = 800 + T + lead, N2 = 1160 + T + lead, FX = FX0 + whole;
    const team = named(t, teamAt) * two, TX = CX - TEAM;
    [TX - 45, TX, TX + 45].forEach(x => person(x, 325, {alpha: team, size: .75}));
    nameText(L("大家", "A team"), TX, 342 + NAME_GAP, {valign: "top", alpha: team});
    // The catalog stands on its own words.
    const book = two * named(t, catalog);
    box(CX - 110, CY - 85, 220, 170, {fill: P.row, stroke: P.ink, alpha: book, radius: 12});
    box(CX - 86, CY - 61, 172, 34, {stroke: P.muted, alpha: book, radius: 17});
    dot(CX - 66, CY - 44, 8, {color: P.muted, alpha: book, hollow: true});
    for (let k = 0; k < 3; k++) line(CX - 80, CY + k * 30, CX + 60 - k * 30, CY + k * 30, {color: P.line, alpha: book, width: 3});
    nameText(L("数据目录", "Data catalog"), CX, CY + 85 + NAME_GAP, {valign: "top", alpha: book});
    const ats = [notFound, found, meaning, quality, permission], xs = [N1, N1, N2, N2, N2];
    const all = ramp(t, differ - .1, .3) * two * tree;
    // The tree: the catalog forks to the two answers, and "found" forks to its three open questions.
    if (tree) [0, 1].forEach(i => link(CX + 118, CY, N1 - 24, rows[i], {route: "hvh", mid: CX + 190, alpha: two,
      draw: {t, at: ats[i] - .15}}));
    const fork = N1 + 16 + NAME_GAP + measure(names[1], LABEL) + 24;
    if (tree) [2, 3, 4].forEach(i => link(fork, rows[1], N2 - 24, rows[i], {route: "hvh", mid: fork + 70, alpha: two, draw: {t, at: ats[i] - .15}}));
    if (tree) ats.forEach((at, i) => {
      const x = xs[i], y = rows[i], q = ramp(t, at - .1, .4) * two, lit = Math.max(speaking(t, ats, i), i === 1 ? 0 : all);
      if (lit > 0) ring(x, y, 24, {color: i === 1 ? P.evidence : P.unknown, alpha: lit * restMark(i === 1 ? P.evidence : P.unknown, .5) * two, width: 2});
      if (i === 1) dot(x, y, 9, {color: P.evidence, alpha: q});
      else ring(x, y, 16, {color: P.unknown, alpha: q, width: 2.5});
      if (i === 0) cross(x, y, 12, {alpha: q, width: 3});
      if (i > 1) text("?", x, y + 1, 22, {align: "center", color: P.unknown, alpha: q, role: "mark"});
      nameText(names[i], x + 16 + NAME_GAP, y, {align: "left", alpha: two * listIn(t, ats, i), set: "catalog"});
    });
    // Each problem's own fix: one column of different shapes, each linked along its problem's row.
    const fix = ramp(t, differ - .1, .5) * two * tree, fy = [0, 2, 3, 4].map(i => rows[i]);
    // The name is the key words of its caption line, not the whole line.
    nameText(L("各不相同", "A different fix"), FX, fy[0] - 40, {valign: "bottom", width: 260, color: P.evidence, alpha: two * named(t, differ)});
    [0, 2, 3, 4].forEach((i, k) => {
      const y = fy[k], from = xs[i] + 16 + NAME_GAP + measure(names[i], LABEL) + 24;
      link(from, y, FX - 30, y, {alpha: two * tree * ramp(t, differ - .1, .3), draw: {t, at: differ + .05 + glideTime(whole - asked)}});
      if (k === 0) dot(FX, y, 12, {color: P.evidence, alpha: fix});
      if (k === 1) box(FX - 11, y - 11, 22, 22, {fill: P.evidence, alpha: fix, radius: 2});
      if (k === 2) diamond(FX, y, 14, {color: P.evidence, alpha: fix, solid: true});
      if (k === 3) fill(() => { ctx.moveTo(FX, y - 13); ctx.lineTo(FX + 13, y + 10); ctx.lineTo(FX - 13, y + 10); ctx.closePath(); }, {color: P.evidence, alpha: fix});
    });
  }
  // 3. Frame the problem. The frame opens on its first words around the room of its first item, open at the bottom, and
  // what it must hold builds in one column inside it, each item on its own words with a mark of its own, the frame's
  // sides growing down to hold each item as it arrives: four items in English, and in Chinese the three pairs it asks,
  // each pair one item. Its bottom edge stays open until the limits are spoken: the sides reach it as the first limit is
  // named, each limit stands as a station on it, named on one baseline, and the edge closes on the last; on the
  // commitment the frame turns the decision's colour.
  const unSubject = en ? cueFrom(s, "", "subject", commit) : cue(s, "要处理的对象", "");
  const three = base * stageIn(t, frame) * stageOut(t, unSubject);
  if (three > 0) {
    // The frame's sides grow down with each item by the padding above the first, so the items stand centred between its
    // top and the sides' feet as they build, and its bottom edge stands that far below the last item.
    // The English frame keeps 75 px round its four items, 70 px apart, centred where the Chinese frame stands, so its
    // first picture, the frame round one item, covers a tenth of the band while its bottom edge stands where the limits
    // have room above the next stage.
    const FL = L(560, 540), FR = L(1360, 1380), FT = L(370, 385), ys = en ? [460, 530, 600, 670] : [470, 575, 680], PADV = ys[0] - FT, FB = ys.at(-1) + PADV;
    const commitQ = ramp(t, commit - .1, .6), tone = blend(P.ink, P.authority, commitQ);
    // Each item's first words.
    const items = en ? [subject, present, criteria, outScope] : [subject, present, criteria];
    const limitAts = [["时间", "time"], ["成本", "cost"], ["合规", "compliance"], ["技术", "technical"], ["资源", "resource"]]
      .map(([zh, english]) => cueFrom(s, zh, english, limits - .05));
    // Its two sides, each with a foot of the bottom edge, and its top; the sides grow down with each item and reach the
    // bottom edge as the limits begin.
    const low = s03Extent(t, ys[0] + PADV, [...items.slice(1).map(at => [at, ys[1] - ys[0]]), [limitAts[0], FB - ys.at(-1) - PADV]]);
    path([[FL + 46, low], [FL, low], [FL, FT], [FR, FT]], {color: tone, alpha: three, width: 3});
    path([[FR, FT], [FR, low], [FR - 46, low]], {color: tone, alpha: three, width: 3});
    nameText(L("问题", "The problem"), FL, FT - NAME_GAP, {align: "left", valign: "bottom", alpha: three * named(t, frame)});
    nameText(L("能执行的承诺", "Executable commitment"), FR, FT - NAME_GAP, {align: "right", valign: "bottom", color: P.authority, alpha: three * named(t, commit)});
    // Each item is named by its key words; each Chinese pair, a caption cue of its own, is named by the words of its first
    // half, and the mark beside it takes its second half on its words: the baseline the present state is compared with
    // draws in dashes, and a cross for what is out of scope joins the check of success.
    const names = en ? ["Its subject and who is affected", "Present state and baseline", "The success criteria", "What is out of scope"]
      : ["针对什么，影响谁", "现在怎样", "怎样算成功"];
    const [baselineAt, outAt] = en ? [present, outScope] : cues(s, [["跟什么比", ""], ["哪些不做", ""]]);
    const MX = 960 + 22 - (50 + NAME_GAP + Math.max(...names.map(v => measure(v, LABEL)))) / 2, NX = MX + 28 + NAME_GAP;
    // The goal lights again when the limits sentence names it, and stays lit until the stage cut: the goal is the item
    // that says what counts as success, the third in both editions.
    const again = cueFrom(s, "目标", "a goal", outScope), aim = ramp(t, again - .1, .3);
    items.forEach((at, i) => {
      const y = ys[i], q = ramp(t, at - .1, .4) * three, lit = Math.max(speaking(t, items, i), i === 2 ? aim : 0);
      // The item's mark; each Chinese pair takes the mark of the English item it opens with.
      const kind = (en ? [0, 1, 3, 4] : [0, 1, 3])[i];
      if (lit > 0) ring(MX, y, 30, {color: i === 2 ? P.authority : P.ink, alpha: lit * restMark(i === 2 ? P.authority : P.ink, .5) * three, width: 2});
      if (kind === 0) { dot(MX - 8, y - 4, 6, {color: P.evidence, alpha: q}); person(MX + 7, y + 6, {size: .45, alpha: q}); }
      if (kind === 1) { line(MX - 12, y - 5, MX + 4, y - 5, {color: P.ink, alpha: q, width: 5});
        dashed(MX - 12, y + 6, MX + 12, y + 6, {color: P.muted, alpha: ramp(t, baselineAt - .1, .4) * three}); }
      if (kind === 2) { ring(MX, y, 12, {color: P.ink, alpha: q, width: 2.5}); dot(MX, y, 5, {color: P.authority, alpha: q}); }
      if (kind === 3 && en) check(MX, y, 20, {alpha: q});
      if (kind === 3 && !en) { check(MX - 9, y, 16, {alpha: q}); cross(MX + 14, y, 11, {alpha: ramp(t, outAt - .1, .4) * three, width: 3}); }
      if (kind === 4) cross(MX, y, 14, {alpha: q, width: 3});
      nameText(names[i], NX, y, {align: "left", alpha: three * listIn(t, items, i), set: "frame"});
    });
    // The bottom edge, closed by its limits.
    // The row of the limits' names stands centred on the frame: its first and last names keep one inset from the sides.
    // The English names differ most in width, so they stand at one pitch, the widest pair's need, their row's ink
    // centred on the frame, each name centred on its tick.
    const limitNames = en ? ["Time", "Cost", "Compliance", "Technical", "Resource"] : ["时间", "成本", "合规", "技术", "资源"];
    const [w0, wn] = [limitNames[0], limitNames.at(-1)].map(v => measure(v, LABEL)), inset = (180 - (w0 + wn) / 2) / 2;
    const [firstX, lastX] = [FL + inset + w0 / 2, FR - inset - wn / 2];
    const pitchEn = Math.max((lastX - firstX) / 4, ...limitNames.slice(1).map((v, i) => (measure(limitNames[i], LABEL) + measure(v, LABEL)) / 2 + 34));
    const xs = en ? limitNames.map((_, i) => 960 - (wn - w0) / 4 + (i - 2) * pitchEn) : railStations(limitNames, firstX, lastX);
    line(FL + 46, FB, mix(FL + 46, FR - 46, drawnShare({t, at: limitAts[4] - .1}, FR - FL - 92)), FB, {color: tone, alpha: three * ramp(t, limitAts[0] - .1, .3), width: 3});
    limitAts.forEach((at, i) => {
      const q = ramp(t, at - .1, .4) * three, lit = speaking(t, limitAts, i);
      line(xs[i], FB - 14, xs[i], FB + 14, {color: P.authority, alpha: q, width: 3 + lit});
    });
    railNames(limitNames, xs, FB, {alpha: i => three * listIn(t, limitAts, i), color: () => P.authority, set: "limits"});
  }
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
  if (four > 0) {
    const LY = 650, BX = 1402, HX = BX - 44, PY = 390, MX = 502, ys = [380, 470, 560];
    const conds = [unSubject, ...cues(s, [["行动依据", "the authority"], ["后果是否可逆", "irreversible consequence"]])];
    const names = en ? ["The subject", "The authority", "An irreversible consequence"] : ["要处理的对象", "行动依据", "后果是否可逆"];
    const lane = ramp(t, unSubject - .15, .4) * four;
    nameText(L("说不清", "Unclear"), MX - 20, ys[0] - 34 - NAME_GAP, {align: "left", valign: "bottom", alpha: four * named(t, unclear)});
    link(MX - 40, ys[0] - 20, BX, LY, {route: "vh", alpha: lane, width: 3, end: false});
    conds.forEach((at, i) => {
      const y = ys[i], q = ramp(t, at - .1, .4) * four, lit = speaking(t, conds, i);
      ring(MX, y, 20, {color: P.unknown, alpha: q, width: 2.5});
      if (lit > 0) ring(MX, y, 30, {color: P.unknown, alpha: lit * restMark(P.unknown, .5) * four, width: 2});
      text("?", MX, y + 1, 22, {align: "center", color: P.unknown, alpha: q, role: "mark"});
      nameText(names[i], MX + 20 + NAME_GAP, y, {align: "left", alpha: four * listIn(t, conds, i), set: "unclear"});
    });
    // The affected action moves along its lane in voice time, setting off from rest, and settles at the bar as it is
    // stopped; the way on beyond it is drawn dashed on the words that stop the action: open, but untaken.
    dashed(BX + 24, LY, BX + 120, LY, {color: P.line, alpha: four * ramp(t, stop - .05, .3)});
    const run = ease((voiceTime(t) - voiceTime(unSubject)) / Math.max(.5, voiceTime(stop) - voiceTime(unSubject)));
    token(mix(MX + 70, HX, run), LY, {color: P.evidence, alpha: lane, r: 18});
    line(BX, LY - 34, BX, LY + 34, {color: P.unknown, alpha: ramp(t, stop - .05, .3) * four, width: 4});
    nameText(L("停下受影响的事", "Stop the affected action"), HX, LY + 34 + NAME_GAP, {valign: "top", alpha: four * named(t, stop)});
    // The question rises above the halted action to the person who decides, who appears on the words.
    const fills = ramp(t, ask - .1, .5);
    person(HX, PY, {color: P.authority, alpha: fills * four, size: 1.05});
    link(HX, LY - 32, HX, PY + 44, {color: P.authority, alpha: four, draw: {t, at: ask - .05}, width: 2.5});
    nameText(L("有授权的人", "An authorized person"), HX - 16 - NAME_GAP, PY - 17, {align: "right", width: 300,
      color: P.authority, alpha: four * named(t, ask)});
  }
  // 5. Information earns its worth by the judgment it could change: the collected information sits in its tray and one
  // quiet link carries it to the judgment it could change, which stands at the link's end on its words, lighting the
  // pieces that bear on it. The row stands at the middle of the band.
  const five = base * stageIn(t, collect);
  if (five > 0) {
    // The row stands centred between the tray's left edge and the end of the judgment's name at the right.
    const end = 1210 + 18 + NAME_GAP + measure(L("能改变哪个判断", "The judgment it could change"));
    const sx = 960 - (379 + end) / 2;
    const LX = 380 + sx, RX = 1210 + sx, AY = CONTENT_CY + 20, W = 340, H = 120;
    // Until the judgment it could change arrives, the tray and the aim it is taken for stand centred as a pair, from
    // the tray's left edge to the aim's cross, and they move to their places with the judgment, on its words; the pair
    // stands no further right than keeps the judgment's name, arriving there, inside the safe area.
    const goalW = measure(L("目的", "The aim")) + 16 + Math.min(26, labelSize(LABEL) * .9);
    const pair = Math.min(960 - (LX + RX + goalW / 2) / 2, 1800 - (end + sx));
    ctx.save(); ctx.translate(pair * (1 - glide(t, change + .05, pair)), 0);
    const tray = ramp(t, collect + .05, .5) * five;
    box(LX, AY - H / 2, W, H, {stroke: P.line, alpha: tray, radius: 12, width: 2});
    const tied = ramp(t, change - .1, .5);
    for (let k = 0; k < 18; k++) {
      const useful = k % 5 === 1, x = LX + 40 + (k % 6) * 52, y = AY - 30 + Math.floor(k / 6) * 30;
      dot(x, y, 8, {color: useful ? blend(P.muted, P.evidence, tied) : P.muted,
        alpha: five * ramp(t, collect - .1 + k * .04, .35) * (useful ? 1 : mix(.85, .6, tied))});
    }
    nameText(L("收集信息", "Collecting information"), LX, AY - H / 2 - NAME_GAP, {align: "left", valign: "bottom", alpha: five * named(t, collect)});
    // Collecting is not the aim: the aim it is taken for stands struck where the judgment will stand, and gives way to
    // the judgment it could change.
    const notGoal = cue(s, "不是目的", "is not the aim"), judged = cueFrom(s, "判断", "judgment", notGoal);
    rejectedName(L("目的", "The aim"), RX, AY - 64, {alpha: five * named(t, notGoal) * (1 - ramp(t, judged - .2, .3)),
      mark: ramp(t, notGoal + .3, .3)});
    link(LX + W + 12, AY, RX - 30, AY, {alpha: five * ramp(t, change - .1, .3), draw: {t, at: change - .05}, flowing: since(t, change + .55)});
    diamond(RX, AY, 18, {color: P.authority, alpha: ramp(t, change - .1, .4) * five, solid: true});
    nameText(L("能改变哪个判断", "The judgment it could change"), RX + 18 + NAME_GAP, AY, {align: "left", color: P.authority, alpha: five * named(t, change)});
    ctx.restore();
  }
};

/* ---------------- 06 decide: six kinds of statement ---------------- */
/* The six kinds on a grid of three rows of two, read in the order they are spoken, left then right: fact and
 * hypothesis, inference and judgment, decision and action. Each kind has a mark at its place, its name beside the mark
 * and its statement or conditions below the name, on one left edge, set off from the name by a heading's gap rather
 * than a line's. The columns are as wide as the edition's lines; the left column stands at the frame's left margin and
 * the right one as far from the right, so the grid is centred. */
const S06R = 26, S06ROWS = [330, 520, 710], S06TEXT = en ? 480 : 300, S06HEAD = 26;
const s06Place = i => [i % 2 ? 1498 - S06TEXT : 400, S06ROWS[Math.floor(i / 2)]];
const s06Colour = i => [P.evidence, P.muted, P.ink, P.ink, P.authority, P.ink][i];
/* A kind's name heads its place in the kind's colour and in bold, so all six read as headings over their statements
 * and conditions, the three kinds drawn in ink included. */
const s06Kind = (v, i, x, y, o) => nameText(v, x, y, {align: "left", color: s06Colour(i), bold: true, ...o});
/* A kind's mark: a recorded fact is checked, a hypothesis is an open question, an inference is a therefore, a
 * judgment weighs against a standard, a decision has its owner and an action its time. */
function s06Mark(i, x, y, {alpha = 1, lit = 0} = {}) {
  if (alpha < .01) return;
  const c = s06Colour(i);
  dot(x, y, S06R, {color: P.ground, alpha});
  ring(x, y, S06R, {color: c, alpha, width: 2.5, dash: i === 1 ? [5, 5] : null});
  if (lit > 0) ring(x, y, S06R + 10, {color: c, alpha: alpha * lit * restMark(c, .5), width: 2});
  if (i === 0) check(x, y + 1, 22, {color: c, alpha});
  if (i === 1) text("?", x, y + 1, 26, {role: "mark", align: "center", color: c, alpha});
  if (i === 2) [[-8, 6], [8, 6], [0, -8]].forEach(([dx, dy]) => dot(x + dx, y + dy, 3.5, {color: c, alpha}));
  if (i === 3) {
    line(x, y - 12, x, y + 11, {color: c, alpha, width: 2.5}); line(x - 8, y + 12, x + 8, y + 12, {color: c, alpha, width: 2.5});
    line(x - 15, y - 9, x + 15, y - 9, {color: c, alpha, width: 2.5});
    [-12, 12].forEach(dx => stroke(() => ctx.arc(x + dx, y - 4, 5, 0, Math.PI), {color: c, alpha, width: 2.5}));
  }
  if (i === 4) person(x, y + 3, {color: c, alpha, size: .6});
  if (i === 5) { line(x, y, x, y - 14, {color: c, alpha, width: 3}); line(x, y, x + 11, y + 5, {color: c, alpha, width: 3}); }
}
scenes["06"] = function (s, t) {
  const [six, , example, data, conditions] = cues(s, [["有六种说法", "six kinds of statement"], ["要分清", "stay distinct"],
    ["虚构的例子", "illustrative case"], ["昨晚的价格数据", "last night's price collection"], ["这六种说法", "a fact states"]]);
  const restate = cue(s, "晚了两小时", "two hours late is"), distinct = cue(s, "要分清", "need to stay distinct");
  const base = ramp(t, opening(s), .7);
  // The example is marked as illustrative from its words until the general conditions begin.
  illustrative(ramp(t, example - .2, .6) * base * (1 - ramp(t, conditions + .05, .4)));
  // 1. Six kinds of statement: six statements, each a page of text drawn in ink so the row carries the thought, stand in
  // one row from the first words, which count them; on the words that keep them distinct a divider rises between each
  // pair. A kind's own mark waits for the kind's name, so no mark stands here unnamed. The row hands the picture to the
  // case on the words that name its data rather than in one frame: its name fades first, then its pages as the case
  // inks in about the centre, so the row's name never meets the case's marks and a name stands throughout.
  const one = base * (1 - ramp(t, data - .25, .45)), rowName = base * (1 - ramp(t, data - .45, .4));
  if (one > 0) {
    // The row stands high enough that its thought, which ends on the case standing low below the grid, balances on the
    // content centre as a whole.
    const y = 400, PW = 96, PH = 124, pitch = 220;
    for (let i = 0; i < 6; i++) {
      // The pages arrive with the words that count them, just after the name, so the scene's cut waits for its name.
      const x = 960 + (i - 2.5) * pitch, q = one * ramp(t, six - .1 + i * .12, .45);
      documentIcon(x - PW / 2, y - PH / 2, PW, PH, {alpha: q, rows: 3, fillColor: P.ground});
      if (i) link(x - pitch / 2, y + PH / 2 + 4, x - pitch / 2, y - PH / 2 - 4, {color: P.line, width: 3, alpha: one, draw: {t, at: distinct - .05 + (i - 1) * .12}, end: false});
    }
    nameText(L("六种说法", "Six kinds of statement"), 960, y + PH / 2 + NAME_GAP, {valign: "top", alpha: rowName * named(t, six)});
  }
  // The case's statements, each with the words that say it: its term, and its qualifier where it has one. A statement
  // builds from its first words, and its kind's ring, mark and name arrive together on the kind's noun; the ring
  // lights while its statement is said.
  const kindAts = cues(s, [["事实", "fact"], ["假设", "hypothesis"], ["推论", "inference"], ["判断", "judgment"], ["决定", "decision"], ["行动", "action"]]);
  const kinds = en ? ["Fact", "Hypothesis", "Inference", "Judgment", "Decision", "Action"] : ["事实", "假设", "推论", "判断", "决定", "行动"];
  const rows = (en ? [
    [["Two hours late"], ["two hours late is"], ["recorded"], ["recorded"]],
    [["Late publication by the vendor"], ["late publication"], ["untested"], ["untested"]],
    [["Scheduling may explain"], ["scheduling may explain"], [], []],
    [["Delivery failed"], ["by the timeliness"], ["by the timeliness standard"], ["by the timeliness"]],
    [["Starting the job earlier"], ["starting the job"], ["the decision owner"], ["the decision owner"]],
    [["Who makes the change, and by when"], ["who makes the change"], [], []]]
  : [
    [["晚了两小时"], ["晚了两小时"], ["有记录"], ["有记录"]],
    [["供应商发布晚了"], ["供应商发布晚了"], ["还没检验"], ["还没检验"]],
    [["问题就可能出在调度上"], ["问题就可能"], [], []],
    [["交付不合格"], ["按及时性的标准"], ["按及时性的标准"], ["按及时性的标准"]],
    [["把任务提前启动"], ["把任务提前启动"], ["决策负责人"], ["决策负责人作出的决定"]],
    [["谁在什么时候改好"], ["谁在什么时候"], [], []]]).map(([term, termWords, qual, qualWords]) =>
    [term, termWords.map(w => cue(s, L(w, ""), L("", w))), qual, qualWords.map(w => cue(s, L(w, ""), L("", w)))]);
  const starts = rows.map(([, termAts, , qualAts]) => Math.min(...termAts, ...qualAts));
  // A kind's place: its mark at (x, y), its name beside the mark and its statement below the name. A statement without
  // a qualifier wraps within its column; one with a qualifier is a term row. A judgment's verdict is set whole from the
  // standard that begins it.
  const statement = (i, x, y, alpha, listed, kindAt = kindAts[i], termAts = rows[i][1], qualAts = rows[i][3]) => {
    const [term, , qual] = rows[i], lit = speaking(t, starts, i), left = x + S06R + NAME_GAP, kind = ramp(t, kindAt - .15, .4);
    if (lit > 0) ring(x, y, S06R + 10, {color: s06Colour(i), alpha: alpha * lit * restMark(s06Colour(i), .5) * kind, width: 2});
    s06Mark(i, x, y, {alpha: alpha * kind});
    const level = alpha * listLevel(t, starts, i), top = y + labelSize(LABEL) / 2 + S06HEAD;
    s06Kind(kinds[i], i, left, y, {alpha: level * named(t, kindAt), set: listed ? "kinds" : null});
    // Every statement's qualifier stands under it, so the six read one way.
    if (qual.length) termRow(t, term, termAts, qual, qualAts, left, top, {width: S06TEXT, alpha: level, set: listed ? "statements" : null, inline: false});
    else growName(t, term, termAts, left, top, {width: S06TEXT, alpha: level, set: listed ? "statements" : null});
  };
  // 2. The illustrative case: last night's price collection inks in on the words that name its data, standing on the
  // hour it arrived on a line of the night's hours. When the words say it ran two hours late, the two hours are measured
  // below the line, from the hour it was due to the arrival. While it stands alone it stands about the content centre;
  // when the delay is restated as a recorded fact it glides down under the grid's first row, the span's name gives way
  // to the fact's statement, which takes the first place of the grid the next stage builds, and its due place stands
  // clear of the inference's place. The case stands below the grid's first row while the hypothesis is said and while
  // the inference's premise is shown on it: on its words, the place it was due stands as a dashed outline named on time,
  // an empty place that arrives with its name, and the two hours are named as the job's late start. It stands through
  // the inference and leaves in one cut on the next thought's first words, the standard of the judgment.
  const two = base * (t >= data - .3 ? 1 : 0) * stageOut(t, starts[3]);
  if (two > 0) {
    const ranLate = cue(s, "采集晚了两个小时", "ran two hours late");
    const AY = 700, due = 780, actual = 1140, TW = 300, TH = 100, top = AY - 36 - TH, SY = AY + 36;
    // Once its delay is restated as a fact, the case steps back to the second ink and the fact's statement leads.
    const back = mix(1, SECOND, ramp(t, restate + .05, .7)), on = two * back * ramp(t, data - .1, .4);
    // The premise's two parts light what they name in full ink: the hour that was on time, and the two hours late.
    const onTime = cueFrom(s, "准时", "on time", starts[1]), startedLate = cueFrom(s, "启动得晚", "job started late", starts[1]);
    // The two hours are an accent mark: they step back only to the unknown's level, and light again on their words.
    const span = two * ramp(t, ranLate + .05, .3) * mix(markLevel(P.unknown, back), 1, named(t, startedLate));
    // Alone, the case's extent, from its table's top to the names under the two hours, stands about the content centre;
    // below the grid its due place stands 14 px under the inference's statement.
    const raise = (top + SY + 10 + NAME_GAP + labelSize(LABEL)) / 2 - CONTENT_CY, lower = 40;
    ctx.save(); ctx.translate(0, -raise + (raise + lower) * glide(t, restate + .05, raise + lower));
    // The night's hours: one line with a tick at each hour, drawn as one stroke.
    stroke(() => { ctx.moveTo(240, AY); ctx.lineTo(1680, AY); for (let x = 240; x <= 1680; x += 180) { ctx.moveTo(x, AY - 7); ctx.lineTo(x, AY + 7); } },
      {color: P.line, alpha: on, width: 3.5});
    box(due - TW / 2, top, TW, TH, {stroke: P.line, alpha: two * named(t, onTime), radius: 6, dash: [6, 6]});
    nameText(L("准时", "On time"), due, top + TH / 2, {valign: "middle", alpha: two * named(t, onTime)});
    line(actual, top + TH, actual, AY, {color: P.line, alpha: on, width: 2});
    // The table's rules are one stroke with it, so the table reads as one mark under its name.
    tableIcon(actual - TW / 2, top, TW, TH, {alpha: on, joined: true});
    // The collection is named beside its table, clear of the grid's first row, whose statements stand over the table,
    // and within the night's line, whole on one line.
    // The name joins once the row's pages beside it have faded.
    nameText(L("昨晚的价格数据", "Last night's price collection"), actual + TW / 2 + NAME_GAP, top + TH / 2, {align: "left", width: 360,
      alpha: two * back * named(t, data + .2)});
    // The two hours, measured below the line from the due hour to the arrival.
    link(due, SY, actual, SY, {color: P.unknown, alpha: span, width: 3, draw: {t, at: ranLate + .05}, end: false});
    line(due, SY - 10, due, SY + 10, {color: P.unknown, alpha: span, width: 3});
    line(actual, SY - 10, actual, SY + 10, {color: P.unknown, alpha: span * ramp(t, ranLate + .45, .3), width: 3});
    // It names the two hours until the case has glided under the grid, and then gives way to the fact's statement.
    nameText(L("采集晚了两个小时", "Ran two hours late"), (due + actual) / 2, SY + 10 + NAME_GAP, {valign: "top",
      alpha: two * named(t, ranLate) * (1 - ramp(t, restate + .05 + glideTime(raise + lower), .3))});
    nameText(L("启动得晚", "Job started late"), (due + actual) / 2, SY + 10 + NAME_GAP, {valign: "top", alpha: two * named(t, startedLate)});
    ctx.restore();
    // In the case the fact's kind arrives within the clause that names it a fact: in English with its restated statement,
    // at most 1.4 s ahead of its own word; in Chinese with the word that records it. The grid takes the fact over on the
    // hypothesis's first words.
    if (t < starts[1] + STAGE_CUT) statement(0, ...s06Place(0), two * ramp(t, restate + .05, .3), false, en ? Math.max(restate, kindAts[0] - 1.4) : Math.min(kindAts[0], cue(s, "有记录", "")));
  }
  // 3. The case's statements sorted into the six kinds. The stage begins on the second statement's first words, while
  // the case still stands below; the recorded fact stands in its place as the case left it, and each further statement
  // arrives at its kind's ring on its own words, the inference's above the case, which has glided clear of it.
  const three = base * stageIn(t, starts[1]) * stageOut(t, conditions);
  // The stage begins on the hypothesis's own first words, so its term inks in from the cut rather than standing at most
  // of its ink in the cut's first frame; the judgment, whose place the case's table reaches until the case leaves in its
  // cut, inks in from that cut.
  const fromCut = i => rows[i][1].map(() => starts[i] + STAGE_CUT + .15);
  if (three > 0) rows.forEach((_, i) => statement(i, ...s06Place(i), three, true, kindAts[i], i === 1 || i === 3 ? fromCut(i) : rows[i][1],
    i === 3 ? fromCut(i) : rows[i][3]));
  // 4. Each kind carries its own conditions. The case's statements leave in one cut on the thought's first words, which
  // begin the conditions in English and in Chinese first say that each kind has its own to account for, named above
  // the grid until the next thought; the six kinds keep their marks, positions and names, and each
  // kind's conditions build below its name, each part on its own words. The kind being spoken lights its mark: the first
  // three in one thought, the last three in the next. The grid holds to the scene's end.
  const four = base * stageIn(t, conditions);
  if (four > 0) {
    const again = kinds.map((v, i) => cueFrom(s, ["事实要有", "假设要说清", "推论要讲明", "判断要有", "决定要写明", "行动要落到"][i], v.toLowerCase(), conditions));
    const conds = (en ? [
      [["Source", ", subject", ", time", " and scope"], ["states its source", "subject", "time and scope", "and scope"]],
      [["What observation could refute it"], ["what observation could refute"]],
      [["Reasoning", " and", " alternative explanations"], ["its reasoning", "alternative explanations", "alternative explanations"]],
      [["Criterion", ", confidence", " and limits"], ["its criterion", "confidence", "and limits"]],
      [["Who made it", ", the trade-off", ", what triggers a revisit"], ["who made it", "the trade-off", "and what would trigger"]],
      [["Owner", ", deadline", ", completion condition"], ["its owner", "deadline", "completion condition"]]]
    : [
      [["来源", "、对象", "、时间", "和范围"], ["要有来源", "对象", "时间和范围", "和范围"]],
      [["什么观察能推翻它"], ["什么观察能推翻"]],
      [["推理过程", "和其他解释"], ["推理过程", "和其他解释"]],
      [["标准", "、把握", "和限度"], ["要有标准", "把握", "和限度"]],
      [["谁定的", "、怎么取舍", "、什么情况下重新考虑"], ["谁定的", "怎么取舍", "什么情况下重新考虑"]],
      [["谁来做", "、什么时候做完", "、怎样算完"], ["谁来做", "什么时候做完", "怎样算完"]]]).map(([parts, words]) => [parts, words.map(w => cue(s, w, w))]);
    // The grid stands centred in each state as its conditions build. The right column's conditions are shorter than the
    // statements the grid was laid out for, so from the stage's cut the grid moves right to stand centred on its names
    // alone; on the hypothesis's condition, which reaches furthest right, it moves back left to stand centred on it; and on
    // the judgment's words it moves to stand centred between the judgment's conditions and the whole grid. In Chinese,
    // whose last conditions stand on one line, it stands centred on the judgment's conditions until the action's first
    // condition, and moves then to stand centred on the whole grid. The grid's left edge is its marks', 26 px left of its
    // left column. Each Chinese
    // condition stands on one line, as does the English inference's, which no break keeps whole as a phrase in an even
    // block; the other English conditions break at their commas.
    const condWidth = i => en ? (i === 2 ? 520 : S06TEXT) : 540;
    const condW = i => Math.max(...growTexts(conds[i][0], condWidth(i), LABEL).map(line => line.reduce((sum, [, v]) => sum + measure(v), 0)));
    const textX = i => s06Place(i)[0] + S06R + NAME_GAP, kindsEnd = Math.max(...[1, 3, 5].map(i => textX(i) + measure(kinds[i], LABEL, true)));
    const reach = [1, 3, 5].reduce((v, i) => [...v, Math.max(v.at(-1), textX(i) + condW(i))], [kindsEnd]);
    const mid = (a, b) => 960 - (400 - S06R + (a + b) / 2) / 2;
    const centred = [mid(reach[0], reach[0]), mid(reach[1], reach[1]), L(mid(reach[2], reach[2]), mid(reach[2], reach[3])),
      L(mid(reach[3], reach[3]), mid(reach[2], reach[3]))];
    const moves = [conditions + STAGE_CUT, conds[1][1][0] + .05, again[3] + .05, conds[5][1][0] + .05];
    const ox = moves.reduce((x, at, k) => { const d = centred[k] - (k ? centred[k - 1] : 0); return x + d * glide(t, at, d); }, 0);
    if (!en) {
      const own = cue(s, "各有各要交代的", ""), next = cue(s, "判断要有", "");
      // The heading arrives just before its words, within the sync tolerance, so the statements that left are replaced
      // by a name within the thought's first second; it heads the grid, so it moves with it.
      nameText("各有各要交代的", 960 + ox, S06ROWS[0] - S06R - NAME_GAP - 20, {valign: "bottom", alpha: four * named(t, own - .18) * (1 - ramp(t, next + .05, .3))});
    }
    conds.forEach(([parts, ats], i) => {
      const [x0, y] = s06Place(i), x = x0 + ox, left = x + S06R + NAME_GAP;
      // The kind being spoken lights its mark, which beats once for each of its conditions after the first.
      s06Mark(i, x, y, {alpha: four, lit: speaking(t, again, i)});
      beats(t, x, y, S06R + 10, ats.slice(1), {color: s06Colour(i), alpha: four});
      s06Kind(kinds[i], i, left, y, {alpha: four, set: "kinds"});
      growName(t, parts, ats, left, y + labelSize(LABEL) / 2 + S06HEAD, {width: condWidth(i), alpha: four * listLevel(t, again, i), set: "conditions"});
    });
  }
};

/* ---------------- 07 decide: the smallest sufficient model ---------------- */
/* The problem as a knot of interacting parts: an open question at its centre, joined to four parts around it. The first
 * two stages keep it in one place, so the relationships of the second are the knot's own. */
function s07Knot(x, y, alpha) {
  if (alpha < .01) return;
  [[-170, -60], [170, -70], [-140, 80], [160, 70]].forEach(([dx, dy]) => {
    link(x + Math.sign(dx) * 52, y, x + dx, y + dy - Math.sign(dy) * 16, {route: "hv", alpha, end: false});
    dot(x + dx, y + dy, 12, {color: P.muted, alpha});
  });
  dot(x, y, 44, {color: P.row, alpha});
  ring(x, y, 44, {color: P.ink, alpha, width: 2.5});
  text("?", x, y + 1, 26, {align: "center", color: P.muted, alpha, role: "mark"});
}
/* The eye that observes, drawn as an almond with its iris. */
function s07Eye(x, y, alpha) {
  if (alpha < .01) return;
  stroke(() => { ctx.moveTo(x - 230, y); ctx.quadraticCurveTo(x, y - 128, x + 230, y); ctx.quadraticCurveTo(x, y + 128, x - 230, y); }, {color: P.ink, alpha, width: 3});
  ring(x, y, 44, {color: P.evidence, alpha, width: 3});
  dot(x, y, 16, {color: P.evidence, alpha});
}
scenes["07"] = function (s, t) {
  const base = ramp(t, opening(s), .7);
  // Stage cuts, each on the words that name the incoming stage's first mark. `experiment` is not a cut: it is the
  // fourth test's cue in stage 5, whose sentence it finishes.
  const [relations, interacting, observe, hypotheses, experiment, delay, reason, bounded] = cues(s, [
    ["先理关系", "model the relationships"], ["互相影响的因素", "interacting parts"], ["再把观察记清楚", "pin down the observations"],
    ["然后检验假设", "test the hypotheses"], ["用最小的实验", "smallest experiment"], ["昨晚那次延迟", "last night's delay"],
    ["相信结论之前", "before trusting a conclusion"], ["有边界的结论", "bound the conclusion"]]);
  // Last night's delay returns as an illustrative case, and carries the chip while it is worked through.
  const lastNight = cue(s, "比如昨晚", "take last night");
  illustrative(span(t, lastNight - .2, reason - .2, .4) * base);
  // 1. Understanding a problem: the problem stands at the top as a knot of interacting parts from the first words, which
  // name it. Below it a long list and a small model are weighed against each other: the checklist arrives on "a longer
  // list", grows longer and is refused; the model's three parts and the relations between them draw in when the model
  // is named, so the frame weighs the long list against the few parts and relations that are enough. The English names
  // the model before the list, the Chinese after it; each side arrives on its own words.
  const one = base * stageOut(t, relations);
  if (one > 0) {
    const [problem, longer, listWord, model] = cues(s, [["想清楚问题", "understanding a problem"], ["更长的清单", "longer list"],
      ["清单", "list"], ["刚好够用的模型", "the smallest model"]]);
    const k = one * named(t, problem);
    s07Knot(960, 300, k);
    nameText(L("想清楚问题", "Understanding a problem"), 960, 300 + 92 + NAME_GAP, {valign: "top", alpha: k});
    // The side named first stands alone centred under the knot, and moves out to its own side on the words that name
    // the other, so the frame stays balanced while one side stands alone. The list is 264 px wide; the model centres on
    // its lower part (x 1230).
    const second = en ? longer : model, alone = 1 - glide(t, second + .05, en ? 960 - 1230 + 50 : 960 - 132 - 560);
    // The English model rests 50 px left of its place, so its whole name keeps the stage centred.
    const lx = 560 + (en ? 0 : (960 - 132 - 560) * alone), mdx = en ? -50 + (960 - 1230 + 50) * alone : 0;
    const top = 500, step = 30, nameY = top + 9 * step + 11 + NAME_GAP;
    for (let r = 0; r < 10; r++) {
      const y = top + r * step, q = one * (r < 7 ? ramp(t, longer - .1, .4) : ramp(t, longer + .05 + (r - 7) * .08, .3));
      box(lx, y - 9, 18, 18, {stroke: P.muted, alpha: q * .8, radius: 4});
      line(lx + 34, y, lx + 34 + 230 - (r % 4) * 44, y, {color: P.muted, alpha: q * .8, width: 3});
    }
    rejectedName(L("更长的清单", "Longer list"), lx, nameY, {align: "left", valign: "top", alpha: one * named(t, longer),
      mark: ramp(t, listWord + .05, .35)});
    // The model: three parts, a chain of two relations and the feedback that closes it.
    const R = 30, nodes = [[1110 + mdx, 540], [1350 + mdx, 540], [1230 + mdx, 720]], fillAt = model;
    const q = one * ramp(t, fillAt - .1, .5), knotAt = j => ({t, at: fillAt + .05 + j * .25});
    nodes.forEach(([x, y]) => {
      dot(x, y, R, {color: P.row, alpha: q});
      ring(x, y, R, {color: P.ink, alpha: q, width: 2.5});
    });
    const [a, b, c] = nodes;
    link(a[0] + R + 8, a[1], b[0] - R - 8, b[1], {alpha: q, draw: knotAt(0)});
    link(b[0], b[1] + R + 8, c[0] + R + 8, c[1], {route: "vh", alpha: q, draw: knotAt(1)});
    // The feedback's point runs while the thought is spoken: no pass begins in its last 0.3 s.
    link(c[0] - R - 8, c[1], a[0], a[1] + R + 8, {route: "hv", alpha: q, draw: knotAt(2), flowing: since(t, fillAt + 1.05),
      last: since(thoughtEnd(fillAt) - .3, fillAt + 1.05)});
    // The model is named under it: in Chinese from its left edge, as the list is; in English whole on one line, centred
    // under the model, as no break keeps the noun phrase whole in an even block.
    nameText(L("刚好够用的模型", "The smallest model that will do"), en ? c[0] : a[0] - R, nameY, {align: L("left", "center"), valign: "top",
      width: L(360, 440), alpha: one * named(t, model)});
  }
  // 2. Model the relationships: the knot is re-formed at the centre, now named as the relationships to model, and the
  // small mechanisms the words name build one row beneath it, each drawn on its own words and named below it, five in
  // both editions. They stand left to right in the order spoken, and the row reflows
  // toward its centre as they arrive. One concept keeps one meaning (a second meaning stops at a bar); a cause
  // drives its effect; a dependent hangs from the smaller node of what it needs, its own size among the row's nodes, so
  // the pair reads as one mechanism under its name; a constraint stops a way at its limit; feedback runs back to where
  // it began.
  const two = base * stageIn(t, relations) * stageOut(t, interacting);
  if (two > 0) {
    const ats = cues(s, [["一个概念只用一个意思", "one meaning per concept"], ["谁影响谁", "causes"], ["谁依赖谁", "dependencies"],
      ["受什么限制", "constraints"], ["有哪些反馈回路", "feedback loops"]]);
    // The row steps half its 260 px pitch toward its open end for each mechanism still to come, so the mechanisms
    // already shown stand centred under the knot at every step.
    const shift = building(t, ats, 130), xs = [440, 700, 960, 1220, 1480].map(x => x + shift);
    // A mechanism's flow begins once the row has closed up under the knot, as the last mechanism's glide ends, so its
    // point never rides the row's glide, which would carry it back against its own way and stop it dead.
    const still = ats.at(-1) - .1 + glideTime(130);
    const cy = 650, r = 20, h = 70;
    s07Knot(960, 390, two);
    nameText(L("先理关系", "Relationships"), 960, 390 + 92 + NAME_GAP, {valign: "top", alpha: two * named(t, relations)});
    const node = (x, y, q, lit = 0, size = r) => {
      dot(x, y, size, {color: P.row, alpha: q});
      ring(x, y, size, {color: P.ink, alpha: q, width: 2.5});
      if (lit > 0) ring(x, y, size + 9, {color: P.evidence, alpha: lit * restMark(P.evidence, .5) * q, width: 2});
    };
    ats.forEach((at, i) => {
      const x = xs[i], q = two * ramp(t, at - .1, .5), go = soon(t, at + .05, .7), lit = speaking(t, ats, i), drawn = since(t, Math.max(at + .75, still));
      if (i === 0) {
        // One concept, one meaning: the way to a second meaning stops at a bar. The mark stands 6 px right of its
        // station, so the node's ring and the meanings' dots stand centred on the station and its name.
        const c = x + 6;
        node(c - h, cy, q, lit);
        dot(c + h, cy - 34, 9, {color: P.evidence, alpha: q});
        dot(c + h, cy + 34, 9, {color: P.muted, alpha: q * .8, hollow: true});
        link(c - h + r + 6, cy, c + h - 16, cy - 34, {route: "hvh", mid: c, alpha: q, upto: go});
        link(c - h + r + 6, cy, c + h - 16, cy + 34, {route: "hvh", mid: c, alpha: q * .8, upto: go, end: false, dash: [5, 6]});
        line(c + 36, cy + 34 - 16, c + 36, cy + 34 + 16, {color: P.unknown, alpha: q * ramp(t, at + .5, .3), width: 4});
      } else if (i === 1) {
        node(x - h, cy, q, lit); node(x + h, cy, q * go);
        link(x - h + r + 6, cy, x + h - r - 6, cy, {alpha: q, upto: go, flowing: drawn});
      } else if (i === 2) {
        // The dependent hangs below what it needs, a node of radius 16.
        node(x, cy - 44, q * go, 0, 16); node(x, cy + 44, q, lit);
        link(x, cy + 44 - r - 6, x, cy - 44 + 16 + 6, {alpha: q, upto: go});
      } else if (i === 3) {
        // The node and the limit its way stops at stand 66 px either side of the station, so the mark centres on its name.
        const from = x - 46, limit = x + 64;
        node(from, cy, q, lit);
        link(from + r + 6, cy, limit, cy, {alpha: q, upto: go, end: false});
        // Its point runs nine tenths of the way and leaves by its size short of the limit.
        const way = .9 * (limit - from - r - 6), run = loopPhase(drawn, way);
        if (run !== null) flowDot(mix(from + r + 6, limit, .9 * run), cy, 4, run, {color: P.line, alpha: q}, way);
        line(limit, cy - 26, limit, cy + 26, {color: P.authority, alpha: q * ramp(t, at + .5, .3), width: 4});
      } else {
        node(x - h, cy - 8, q, lit); node(x + h, cy - 8, q * go);
        link(x - h + r + 6, cy - 8, x + h - r - 6, cy - 8, {alpha: q, upto: go});
        link(x + h, cy - 8 + r + 6, x - h, cy - 8 + r + 6, {route: "vhv", mid: cy + 50, alpha: q, draw: {t, at: at + .5}, flowing: since(t, at + 1.3)});
      }
    });
    // The names share one baseline below the row, set from left to right; each takes its level from its spoken turn. The
    // Chinese first name stands whole on one line, which its station's room takes.
    const names = en ? ["One meaning per concept", "Causes", "Dependencies", "Constraints", "Feedback loops"] : [["一个概念只用一个意思"], "谁影响谁", "谁依赖谁", "受什么限制", "有哪些反馈回路"];
    railNames(names, xs, cy + 64, {alpha: i => two * listIn(t, ats, i), set: "relations"});
  }
  // 3. Two refused ways, one above the other. Above, two parts influence each other around one loop; forced into
  // separate boxes, the loop is cut at the wall between them. Below, one effect reaches two tallies; the second count
  // stops at a bar. The two parts stand from the cut, which falls on the words that name them; the loop's way from the
  // first part to the second draws on from the cut and its way back on 影响, the words that make the influence mutual
  // (in English with the first, from the cut), so the loop stands whole about the centre before the refused boxes are
  // named under it. The loop is drawn at 3 px, so the stage reads, and balances, while it is the only structure. The
  // effect and its two tallies stand on the effect's words.
  const three = base * stageIn(t, interacting) * stageOut(t, observe);
  if (three > 0) {
    const [force, boxes, effect, twice] = cues(s, [["硬拆成", "force interacting parts"], ["互不相干的几块", "separate boxes"],
      ["同一个影响", "one effect"], ["算两次", "twice"]]);
    const back = en ? interacting : cueFrom(s, "影响", "", interacting);
    const cy = 470, ax = 640, bx = 1280, r = 36, LY = 100, wall = 960;
    const cut = ramp(t, boxes + .05, .4), walls = soon(t, boxes + .05, .6);
    [ax, bx].forEach(x => { dot(x, cy, r, {color: P.row, alpha: three}); ring(x, cy, r, {color: P.ink, alpha: three, width: 2.5}); });
    // The loop: across the top from A to B, back along the bottom from B to A; once boxed, its flow fades and stops.
    const stopped = 1 - ramp(t, boxes, .3);
    link(ax, cy - r - 8, bx, cy - r - 8, {route: "vhv", mid: cy - LY, alpha: three, draw: {t, at: interacting + .2}, width: 3, flowing: since(t, interacting + 1), fade: stopped});
    link(bx, cy + r + 8, ax, cy + r + 8, {route: "vhv", mid: cy + LY, alpha: three, draw: {t, at: back + .2}, width: 3, flowing: since(t, back + 1), fade: stopped});
    [-LY, LY].forEach(dy => line(wall, cy + dy - 18, wall, cy + dy + 18, {color: P.unknown, alpha: three * cut, width: 4}));
    [ax, bx].forEach(x => box(x - 110, cy - 75 + 75 * (1 - walls), 220, 150 * walls, {stroke: P.muted, alpha: three * cut, radius: 6}));
    nameText(L("互相影响的因素", "Interacting parts"), wall, cy - LY - 18 - NAME_GAP, {valign: "bottom", alpha: three * named(t, interacting)});
    rejectedName(L("硬拆成互不相干的几块", "Separate boxes"), wall, cy + LY + 18 + NAME_GAP, {valign: "top", width: 440, alpha: three * named(t, force),
      mark: ramp(t, boxes + .45, .35)});
    // One effect reaches two tallies: the first count holds, the second is the same effect counted again.
    const ey = 750, ex = 820, tx = 1060, ty = [ey - 50, ey + 50];
    const eq = three * ramp(t, effect - .1, .45), tq = three * ramp(t, twice - .1, .4);
    dot(ex, ey, r, {color: P.row, alpha: eq}); ring(ex, ey, r, {color: P.evidence, alpha: eq, width: 2.5});
    // The first count is made with the effect; the second count, its tally a larger box, starts on "twice" and stops at
    // a bar before its tally, which stays empty.
    const stop = (ex + tx) / 2 + 50;
    box(tx - 22, ty[0] - 22, 44, 44, {stroke: P.line, alpha: eq * .8, radius: 6});
    box(tx - 26, ty[1] - 26, 52, 52, {stroke: P.line, alpha: tq * .8, radius: 6});
    link(ex + r + 8, ey, tx - 30, ty[0], {route: "hvh", mid: (ex + tx) / 2 - 20, alpha: eq, draw: {t, at: effect + .1}});
    dot(tx, ty[0], 10, {color: P.evidence, alpha: eq * ramp(t, effect + .5, .3)});
    link(ex + r + 8, ey, stop - 8, ty[1], {route: "hvh", mid: (ex + tx) / 2 - 20, alpha: tq, draw: {t, at: twice + .05}, end: false});
    line(stop, ty[1] - 18, stop, ty[1] + 18, {color: P.unknown, alpha: three * ramp(t, twice + .2, .25), width: 4});
    // The effect is named beside its ring, at the left where its ways begin, so its name never stands under the refused
    // boxes' name as a second line of it.
    nameText(L("同一个影响", "One effect"), ex - r - NAME_GAP, ey, {align: "right", color: P.evidence, alpha: three * named(t, effect)});
    rejectedName(L("算两次", "Counted twice"), tx + 26 + NAME_GAP, ty[1], {align: "left", alpha: three * named(t, twice), mark: ramp(t, twice + .1, .3)});
  }
  // 4. Pin down the observations: an eye that observes stands at the centre from the stage's first words, which name
  // it, above the record line the observations are pinned to. Important facts are pinned to it on their words and take
  // their source (a document) and their time (a clock); each unknown hangs from it as an open question, and its way runs
  // down to the one decision it bears on, which stands on its own words.
  const four = base * stageIn(t, observe) * stageOut(t, hypotheses);
  if (four > 0) {
    const [facts, sourceTime, unknown, affects, decision] = cues(s, [["重要的事实", "important facts"], ["来源和时间", "source and time"],
      ["每个未知因素", "each unknown"], ["对这个决定", "affects the decision"], ["这个决定", "the decision"]]);
    const EX = 960, EY = 360, LY = 530, fy = 610, dy = 765, dr = 40, em = labelSize(LABEL);
    const factNames = [L("重要的事实", "Facts"), L("带上来源和时间", "source and time")], unknownNames = [L("每个未知因素", "Unknowns"), L("对决定的影响", "effect on the decision")];
    // The facts and the unknowns hang from the record as one pair, each name over its qualifier, and the pair stands
    // centred on the record: it runs from the facts' point, 10 px left of their drop, to the end of the unknowns' names.
    const wide = ([name, note]) => Math.max(measure(name), measure(note, NOTE)), fx = 960 - (500 + 40 + wide(unknownNames) + 10) / 2 + 10, ux = fx + 500;
    const on = four * named(t, observe);
    s07Eye(EX, EY, on);
    nameText(L("再把观察记清楚", "The observations"), EX, EY + 64 + NAME_GAP, {valign: "top", alpha: on});
    line(480, LY, 1440, LY, {color: P.line, alpha: on, width: 3.5});
    // The facts: a firm point pinned to the record, which takes its source and its time.
    const fq = four * ramp(t, facts - .1, .45), sq = four * ramp(t, sourceTime - .1, .45), uq = four * ramp(t, unknown - .1, .45);
    link(fx, LY + 4, fx, fy - 14, {color: P.ink, alpha: fq, draw: {t, at: facts - .1}, end: false});
    dot(fx, fy, 10, {color: P.evidence, alpha: fq});
    documentIcon(fx + 28, fy - 20, 32, 40, {alpha: sq, rows: 2});
    clock(fx + 96, fy, 16, {hand: .62, color: P.evidence, alpha: sq});
    termRow(t, [factNames[0]], [facts], [factNames[1]], [sourceTime], fx + 130, fy - em / 2, {alpha: four, inline: false});
    // The unknowns: an open question hanging from the record, whose way runs down to the decision. Its drop and its ring
    // are one dashed stroke, so the question and the line it hangs from read as one mark under its name.
    const hang = soon(t, unknown - .1, .4);
    stroke(() => {
      if (hang > 0) { ctx.moveTo(ux, LY + 4); ctx.lineTo(ux, mix(LY + 4, fy - 20, hang)); }
      ctx.moveTo(ux, fy - 16); ctx.ellipse(ux, fy, 16, 16, -Math.PI / 2, 0, Math.PI * 2);
    }, {color: P.unknown, alpha: uq, width: 2.5, dash: [4, 4]});
    text("?", ux, fy + 1, 22, {align: "center", color: P.unknown, alpha: uq, role: "mark"});
    termRow(t, [unknownNames[0]], [unknown], [unknownNames[1]], [affects], ux + 40, fy - em / 2, {alpha: four, inline: false});
    link(ux, fy + 20, ux, dy - dr - 10, {alpha: uq, upto: drawShare(t, affects + .05, Math.abs(dy - dr - 10 - (fy + 20)), .6), dash: [6, 6], flowing: since(t, affects + .65)});
    const dq = four * ramp(t, decision - .1, .45);
    diamond(ux, dy, dr, {color: P.authority, alpha: dq, width: 3});
    nameText(L("这个决定", "The decision"), ux + dr + NAME_GAP, dy, {align: "left", color: P.authority, alpha: four * named(t, decision)});
  }
  // 5. Test the hypotheses: a tree from the hypothesis to the ways it is tested, which build into one column through the
  // whole sentence. A counterexample is the one point that breaks the run; the baseline is the level a change is read
  // against; not acting is the course the case takes when nothing is done; the smallest experiment forks to the likely
  // explanations and tells them apart, each ending in its own mark. Each test joins the tree on its own words. The tree
  // holds until last night's delay cuts in (stage 7).
  const five = base * stageIn(t, hypotheses) * stageOut(t, delay);
  if (five > 0) {
    const ats = [...cues(s, [["找反例", "look for counterexamples"], ["跟基准比", "check the baseline"], ["也想想不做", "consider not acting"]]), experiment];
    const separates = cue(s, "分清说得通", "separates the plausible");
    // The tree stands centred as it builds: while its short tests stand it stands right of its finished place, 168 px
    // right of the hypothesis's first place in Chinese and 132 in English. The Chinese eases to 85 px as the experiment's
    // qualifier, which runs on its line, arrives; the English eases to 85 px on the experiment's words, its widest test,
    // and on to 18 px as its qualifier arrives, whole under its term.
    const sx = en ? 132 - 47 * glide(t, experiment - .1, 47) - 67 * glide(t, separates - .1, 67) : 168 - 83 * glide(t, separates - .1, 83);
    const hx = 480 + sx, hy = 480, R = 40, ys = [300, 420, 540, 660], ax = 820 + sx, gx = 860 + sx, nx = 1020 + sx;
    dot(hx, hy, R, {color: P.row, alpha: five});
    ring(hx, hy, R, {color: P.ink, alpha: five, width: 2.5});
    text("?", hx, hy + 1, 26, {align: "center", color: P.muted, alpha: five, role: "mark"});
    nameText(L("检验假设", "Hypotheses"), hx, hy + R + NAME_GAP, {valign: "top", alpha: five * named(t, hypotheses)});
    ats.forEach((at, i) => {
      const y = ys[i], q = five * ramp(t, at - .1, .45), lit = speaking(t, ats, i);
      dot(ax, y, 12, {color: P.evidence, alpha: q});
      if (lit > 0) ring(ax, y, 21, {color: P.evidence, alpha: lit * restMark(P.evidence, .5) * q, width: 2});
      link(hx + R + 8, hy, ax - 20, y, {route: "hvh", mid: 650 + sx, alpha: five, draw: {t, at: at - .1}, end: false});
      if (i === 0) {
        // A run of agreeing points and the one that breaks it.
        [0, 1, 2, 3].forEach(k => dot(gx + 10 + k * 28, y + 12 - k * 8, 7, {color: P.evidence, alpha: q}));
        dot(gx + 112, y + 18, 8, {color: P.unknown, alpha: q * ramp(t, at + .3, .3)});
      } else if (i === 1) {
        line(gx, y + 18, gx + 120, y + 18, {color: P.muted, alpha: q, width: 2});
        path([[gx, y + 12], [gx + 40, y + 6], [gx + 80, y - 4], [gx + 120, y - 18]], {color: P.evidence, alpha: q, width: 2.5, draw: {t, at: at + .1}});
      } else if (i === 2) {
        // Two courses from one point: acting, and the course the case takes with no action, drawn dashed.
        link(gx, y, gx + 120, y - 20, {route: "hvh", mid: gx + 40, alpha: q * .8, draw: {t, at: at}});
        link(gx, y, gx + 120, y + 20, {route: "hvh", mid: gx + 40, color: P.muted, alpha: q, dash: [5, 6], upto: drawShare(t, at + .2, Math.abs(gx + 120 - (gx)) + Math.abs(y + 20 - (y)), .5)});
      } else {
        const sq = five * ramp(t, separates - .1, .45), fork = soon(t, separates - .05, .6);
        ring(gx + 14, y, 13, {color: P.evidence, alpha: q, width: 2.5});
        line(gx + 23, y + 9, gx + 32, y + 18, {color: P.evidence, alpha: q, width: 3});
        [-16, 16].forEach((d, k) => {
          link(gx + 36, y, gx + 108, y + d, {route: "hvh", mid: gx + 70, alpha: sq, upto: fork, end: false});
          dot(gx + 116, y + d, 7, {color: k ? P.authority : P.evidence, alpha: sq * ramp(t, separates + .3, .3)});
        });
      }
    });
    const tests = en ? ["Counterexamples", "The baseline", "Not acting"] : ["找反例", "跟基准比", "不做会怎样"];
    tests.forEach((v, i) => nameText(v, nx, ys[i], {align: "left", alpha: five * listIn(t, ats, i), set: "tests"}));
    // The qualifier keeps the key words of what the experiment separates, short of the whole clause its caption shows:
    // the Chinese takes the verb and its object, each part on its own words. The English qualifier stands under its term
    // on one line, and the tree stands further left to take it.
    const qual = en ? ["that separates", " the plausible explanations"] : ["分清", "几种解释"];
    const qualAts = en ? [separates] : [separates, cue(s, "几种解释", "")];
    termRow(t, [L("最小的实验", "The smallest experiment")], [experiment], qual, qualAts, nx, ys[3] - labelSize(LABEL) / 2,
      {width: en ? 620 : 1780 - nx, inline: en ? false : null, alpha: five * listLevel(t, ats, 3), set: "tests"});
  }
  // 7. Last night's delay, worked through as the smallest experiment: the delay and the one check that settles it stand
  // side by side, the delay leading to the vendor's publication time, which forks below to the two explanations it
  // separates. Each explanation is a small timeline: the vendor's publication (a document) above our job's start (a
  // point), against the time they were due (the dashed tick); what came late is marked. Each timeline stands on its own
  // words as the fork reaches it, and is named below. The delay and the check stand 360 px either side of the centre, so
  // the two cover the band while they stand above the explanations still to come.
  const seven = base * stageIn(t, delay) * stageOut(t, reason);
  if (seven > 0) {
    const [checkAt, ...why] = cues(s, [["查供应商", "checking"], ["是发布晚了", "did the vendor publish late"],
      ["我们的任务启动晚了", "did our job start late"]]);
    // The delay's and the check's names share one baseline, a name's gap over the taller mark.
    const cy = 430, dx = 600, px = 1320, CR = 60, MR = 56, y = 680, w = 380, x0s = [360, 1180], nameY = cy - Math.max(CR, MR) - NAME_GAP;
    clock(dx, cy, CR, {hand: .62, color: P.unknown, alpha: seven});
    // The delay is named as the words name it.
    nameText(L("昨晚那次延迟", "Last night's delay"), dx, nameY, {valign: "bottom", alpha: seven * named(t, delay)});
    const cq = seven * ramp(t, checkAt - .1, .45), tip = MR * .72;
    link(dx + CR + 10, cy, px - MR - 8, cy, {alpha: cq, draw: {t, at: checkAt - .1}});
    ring(px, cy, MR, {color: P.evidence, alpha: cq, width: 3});
    line(px + tip, cy + tip, px + tip + 30, cy + tip + 30, {color: P.evidence, alpha: cq, width: 5});
    clock(px, cy, MR * .55, {hand: .3, color: P.evidence, alpha: cq});
    nameText(L("供应商的发布时间", "Publication time"), px, nameY, {valign: "bottom", width: 320, alpha: seven * named(t, checkAt)});
    const names = en ? ["Did the vendor publish late?", "Did our job start late?"] : ["发布晚了", "我们的任务启动晚了"];
    x0s.forEach((x0, k) => {
      const q = seven * ramp(t, why[k] - .1, .45), lit = speaking(t, why, k), due = x0 + 190;
      const rail = seven * ramp(t, why[k] - .15, .4);
      line(x0, y - 24, x0 + w, y - 24, {color: P.line, alpha: rail, width: 2});
      line(x0, y + 24, x0 + w, y + 24, {color: P.line, alpha: rail, width: 2});
      dashed(due, y - 52, due, y + 52, {color: P.line, alpha: rail});
      link(px, cy + MR + 12, x0 + w / 2, y - 64, {route: "vhv", mid: 590, alpha: rail, draw: {t, at: why[k] - .15}});
      // The vendor published late and the job followed; or the vendor was on time and our job started late.
      const docX = k ? x0 + 90 : x0 + 270, jobX = k ? x0 + 290 : x0 + 330;
      documentIcon(docX - 17, y - 48, 34, 44, {alpha: q, rows: 2, stroke: k ? P.evidence : P.unknown});
      dot(jobX, y + 24, 12, {color: k ? P.unknown : P.muted, alpha: q});
      if (lit > 0) ring(k ? jobX : docX, k ? y + 24 : y - 26, 30, {color: P.unknown, alpha: lit * restMark(P.unknown, .5) * q, width: 2});
      nameText(names[k], x0 + w / 2, y + 52 + NAME_GAP, {valign: "top", width: 380, alpha: seven * listIn(t, why, k), set: "explanations"});
    });
  }
  // 8. Check the reasoning before trusting a conclusion: the conclusion stands at the centre as a stamped page of text
  // rows, wide enough to carry the stage while it waits for its first trap, and the one way of the reasoning rises to it
  // from its name below when the reasoning is named. The stage stands centred on what stands: the page with its way,
  // then each trap as it is named, gliding to each new extent as the trap's words begin. The reasoning traps the
  // words name, six in each edition, build around the page in two mirrored columns, each mark beside the
  // page and its name beyond it, in the order they are spoken, left then right. Each trap is a mechanism at reading size
  // that commits its error while its words are spoken and is then refused beside its name: two series rise and fall
  // together and are then joined as cause and effect; one case's ink floods the whole; a necessary part, with the other
  // condition still missing, is taken to produce the outcome; an outcome is traced back to one of its possible causes; a
  // lens takes in only the agreeing points; and a practice reaches a case beyond its bounds, which stand
  // dashed once the words name them.
  const eight = base * stageIn(t, reason) * stageOut(t, bounded);
  if (eight > 0) {
    const [checkAt, ...ats] = cues(s, [["查推理", "check the reasoning"], ["相关看成因果", "correlation presented"], ["个案看成全部", "one case taken"],
      ["必要条件看成", "necessary condition"], ["认定只有一个原因", "one outcome blamed"], ["只找对自己有利", "selective evidence"],
      ["搬出最佳实践", "best practice"]]);
    // The mechanism each spoken trap takes, in spoken order.
    const kinds = [0, 1, 2, 3, 4, 5];
    const limitsAt = cue(s, "在这里适不适用", "its limits");
    // The page stands a little above the rows' middle, so its top stands under 90 px below the heading that names it and
    // the two read as one.
    const PW = 360, PH = 230, py = 465, cols = [680, 1240], ys = [360, 460, 560, 660], NW = 450, BY = 710;
    // The English first trap is named by its key words on one line, so while it stands alone beside the page the stage
    // stays within the build balance; its second trap is named by its key words on one line, short of the clause its
    // caption shows, and its third trap, the widest name to stand while its row's right-hand trap is still to come,
    // stands on two authored lines, so the stage stays balanced as it builds. Each Chinese trap stands on one line, as said; the one-sided search by its key words, short
    // of the clause its caption shows.
    const names = en ? [["Correlation as cause"], "One case for the whole", ["A necessary condition", "treated as sufficient"],
      "Blamed on a single cause", "Selective evidence", "Best practice without its limits"]
      : ["把相关看成因果", "把个案看成全部", "把必要条件看成充分条件", "认定只有一个原因", "只找有利的证据", "搬出“最佳实践”"];
    // What stands at each step reaches from its widest left-hand name to the cross after its widest right-hand one: the
    // page with its way and the way's name first, then each trap on its side as it is named.
    const nameW = i => Math.max(...wrapName(names[i], NW).map(line => measure(line)));
    const extents = [[960 - PW / 2, Math.max(960 + PW / 2, 978 + measure(L("查推理", "Check the reasoning")))]];
    ats.forEach((_, i) => {
      const [l, r] = extents.at(-1);
      extents.push(i % 2 ? [l, Math.max(r, cols[1] + 86 + nameW(i) + 16 + 26)] : [Math.min(l, cols[0] - 128 - nameW(i)), r]);
    });
    const centreOf = ([l, r]) => 960 - (l + r) / 2;
    const dx = extents.slice(1).reduce((v, e, i) => { const d = centreOf(e) - centreOf(extents[i]); return v + d * glide(t, ats[i] - .3, d); }, centreOf(extents[0]));
    ctx.save(); ctx.translate(dx, 0);
    // The page's text rows run across most of it, so the page is filled as a group's frame is; the seal stands on its
    // own ground over them.
    documentIcon(960 - PW / 2, py - PH / 2, PW, PH, {alpha: eight, rows: 0});
    stroke(() => { for (let i = 0; i < 6; i++) { const ry = py - PH / 2 + PH * (.18 + i * .12); ctx.moveTo(960 - PW * .38, ry); ctx.lineTo(960 + PW * (i % 2 ? .22 : .36), ry); } },
      {color: P.muted, alpha: eight * .8, width: 2});
    dot(960, py - 6, 56, {color: P.row, alpha: eight});
    seal(960, py - 6, 50, {alpha: eight});
    // The heading stands clear above the traps' first row, its taller name or its marks, so it heads the page and the
    // six around it rather than standing among the first row's names.
    const rowHalf = Math.max(26, ...names.slice(0, 2).map(v => blockHeight(wrapName(v, NW).length) / 2));
    nameText(L("相信结论之前", "A conclusion"), 960, ys[0] - rowHalf - HEAD_CLEAR, {valign: "bottom", width: 300, alpha: eight * named(t, reason)});
    // The reasoning: one way rising from its name below the page to the conclusion as the reasoning is named.
    const rq = eight * ramp(t, checkAt - .1, .4);
    link(960, BY, 960, py + PH / 2 + 8, {alpha: rq, draw: {t, at: checkAt}, width: 2.5});
    nameText(L("查推理", "Check the reasoning"), 978, (py + PH / 2 + BY) / 2, {align: "left", alpha: eight * named(t, checkAt)});
    // Each trap's glyph keeps sizes unlike every other trap's parts, so the parts of different traps never read as one
    // row of repeated stations, each waiting for a name of its own: a small part is a detail under 16 px.
    ats.forEach((at, i) => {
      // Each mechanism runs once from its words and then rests in the state that shows its error.
      const gx = cols[i % 2], y = ys[Math.floor(i / 2)], q = eight * ramp(t, at - .1, .45), kind = kinds[i];
      const go = soon(t, at + .05, .8), err = soon(t, at + .45, .5);
      if (kind === 0) {
        // Two series rise and fall together as they draw; the pair is then presented as cause and effect.
        const d = [8, -4, 2, -10, -2, -14], a = d.map((v, k) => [gx - 60 + 24 * k, y - 12 + v]), b = d.map((v, k) => [gx - 60 + 24 * k, y + 14 + v]);
        path(along(a, go).kept, {color: P.ink, alpha: q, width: 3});
        path(along(b, go).kept, {color: P.evidence, alpha: q, width: 3});
        link(gx + 72, a[5][1], gx + 72, b[5][1], {color: P.unknown, alpha: q, upto: err, width: 2.5});
      } else if (kind === 1) {
        // The one case's ink spreads through every member of the whole, column by column, each member inking in on the
        // smoothstep so it never appears at once.
        dot(gx - 48, y, 10, {color: P.ink, alpha: q});
        link(gx - 34, y, gx - 22, y, {color: P.ink, alpha: q, upto: go, end: false});
        for (let k = 0; k < 8; k++) {
          const x = gx - 6 + (k % 4) * 21, yy = y - 11 + Math.floor(k / 4) * 22, flood = ramp(t, at + .2 + (k % 4) * .12, .4);
          dot(x, yy, 7, {color: P.muted, alpha: q * (1 - flood), hollow: true});
          dot(x, yy, 7, {color: P.ink, alpha: q * flood});
        }
      } else if (kind === 2) {
        // One condition stands and the other is missing, yet the way from the one alone reaches the outcome, which fills.
        box(gx - 55, y - 19, 15, 15, {fill: P.evidence, alpha: q * .9, radius: 4});
        box(gx - 55, y + 4, 15, 15, {stroke: P.muted, alpha: q, radius: 4, dash: [4, 4]});
        link(gx - 34, y - 11.5, gx + 30, y, {route: "hvh", mid: gx - 4, color: P.ink, alpha: q, upto: go, end: false});
        ring(gx + 44, y, 13, {color: P.ink, alpha: q, width: 2.5});
        dot(gx + 44, y, 13, {color: P.ink, alpha: q * err});
      } else if (kind === 3) {
        // An outcome is traced back to a single cause, while the other possible causes stay open.
        [-20, 0, 20].forEach(d => dot(gx - 48, y + d, 7, {color: P.muted, alpha: q, hollow: true}));
        dot(gx + 46, y, 7, {color: P.ink, alpha: q});
        link(gx + 32, y, gx - 36, y, {color: P.unknown, alpha: q, upto: go, width: 2.5, end: false});
        dot(gx - 48, y, 7, {color: P.unknown, alpha: q * err});
      } else if (kind === 4) {
        // The lens moves only to the agreeing points, skipping the contrary ones, and each point it takes is ringed.
        const px = [0, 1, 2, 3, 4].map(k => gx - 52 + 26 * k), lx = mix(mix(px[0], px[2], soon(t, at + .25, .35)), px[4], soon(t, at + .65, .35));
        px.forEach((x, k) => {
          dot(x, y - 4, 6, {color: k % 2 ? P.unknown : P.evidence, alpha: q});
          if (k % 2 === 0) ring(x, y - 4, 10, {color: P.evidence, alpha: q * ramp(t, at + .05 + k * .2 + .25, .4), width: 2});
        });
        ring(lx, y - 4, 16, {color: P.ink, alpha: q, width: 2.5});
        line(lx + 11, y + 7, lx + 20, y + 16, {color: P.ink, alpha: q, width: 3});
      } else {
        // A practice reaches a case outside where it applies; its bounds stand dashed once the words name them.
        diamond(gx - 40, y, 16, {color: P.authority, alpha: q, solid: true});
        link(gx - 22, y, gx + 34, y, {color: P.unknown, alpha: q, upto: go, width: 2.5, end: false, flowing: since(t, at + .85),
          last: since(limitsAt, at + .85)});
        ring(gx + 46, y, 7, {color: P.ink, alpha: q, width: 2.5});
        dot(gx + 46, y, 7, {color: P.ink, alpha: q * err});
        ring(gx - 40, y, 30, {color: P.muted, alpha: q * ramp(t, limitsAt - .1, .4), width: 2, dash: [4, 5]});
      }
    });
    // A refused name steps back only to the unknown's level, so a crossed earlier item and its cross still read at 4.6:1.
    // Each is refused once its mechanism has shown the error; the last once its missing bounds are named, which its
    // mechanism shows, so the name keeps the trap's key words. A name states the error itself in words its trap says
    // within one clause, so it never reads far ahead of the voice. A name wider than its column wraps onto a second
    // line, centred on its row; on the left a name ends at its cross, beside its mark, and on the right each cross
    // follows its own name, 16 px after its longer line.
    names.forEach((v, i) => rejectedName(v, i % 2 ? cols[1] + 86 : cols[0] - 128, ys[Math.floor(i / 2)], {align: i % 2 ? "left" : "right", width: NW,
      mark: ramp(t, i === names.length - 1 ? limitsAt + .1 : ats[i] + .7, .3), set: "errors",
      alpha: eight * ramp(t, ats[i] - .15, .4) * markLevel(P.unknown, listLevel(t, ats, i))}));
    ctx.restore();
  }
  // 9. Bound the conclusion: the same conclusion now carries its bounds, a bracket enclosing a column of five. How far
  // the evidence supports it (a run that ends at a limit), how confident it is (a meter part filled), what remains
  // possible (open alternatives beside it), what to verify next (a check with its way ahead) and what would change the
  // judgment (a point not yet seen that would turn the way). The bracket stands on the words that name the bounds; each
  // bound's station arrives on it with its mark and name on the bound's own words.
  const nine = base * stageIn(t, bounded);
  if (nine > 0) {
    const ats = cues(s, [["证据支持到哪一步", "what the evidence supports"], ["有几成把握", "how confident"], ["还有哪些可能", "what remains possible"],
      ["下一步怎么核验", "what to verify next"], ["看到什么会改判", "what observation"]]);
    // The Chinese bounds' names are short, so its stage stands 80 px right, centred on its extent as the English is.
    const sx = L(80, 0), cx = 580 + sx, cy = 500, R = 44, bx = 860 + sx, gx = 960 + sx, nx = 1040 + sx, ys = [330, 415, 500, 585, 670];
    dot(cx, cy, R, {color: P.row, alpha: nine});
    ring(cx, cy, R, {color: P.evidence, alpha: nine, width: 2.5});
    check(cx, cy, 30, {color: P.evidence, alpha: nine});
    nameText(L("有边界的结论", "Bound the conclusion"), cx, cy + R + NAME_GAP, {valign: "top", width: 320, alpha: nine * named(t, bounded)});
    line(bx, ys[0], bx, ys.at(-1), {color: P.line, alpha: nine, width: 2});
    link(cx + R + 8, cy, bx - 6, cy, {alpha: nine, draw: {t, at: bounded + .2}});
    ats.forEach((at, i) => {
      const y = ys[i], q = nine * ramp(t, at - .1, .45), lit = speaking(t, ats, i), go = soon(t, at, .6);
      line(bx, y, bx + 22, y, {color: P.line, alpha: q, width: 2});
      // The station's dot takes the evidence colour as its bound is spoken, blended by its light, so it never snaps.
      dot(bx + 22, y, 4 + 3 * lit, {color: blend(P.line, P.evidence, lit), alpha: q});
      if (i === 0) {
        line(gx - 40, y, mix(gx - 40, gx + 10, go), y, {color: P.evidence, alpha: q, width: 4});
        line(gx + 20, y - 16, gx + 20, y + 16, {color: P.authority, alpha: q * ramp(t, at + .4, .3), width: 4});
      } else if (i === 1) {
        line(gx - 40, y, gx + 30, y, {color: P.line, alpha: q, width: 10, cap: "butt"});
        line(gx - 40, y, mix(gx - 40, gx + 12, go), y, {color: P.evidence, alpha: q, width: 10, cap: "butt"});
      } else if (i === 2) {
        dot(gx - 30, y, 10, {color: P.evidence, alpha: q});
        [0, 1].forEach(k => dot(gx + 2 + k * 26, y, 9, {color: P.muted, alpha: q * ramp(t, at + k * .3, .4), hollow: true}));
      } else if (i === 3) {
        ring(gx - 26, y, 14, {color: P.evidence, alpha: q, width: 2.5});
        check(gx - 26, y + 1, 16, {color: P.evidence, alpha: q});
        link(gx - 6, y, gx + 34, y, {alpha: q, upto: go});
      } else {
        ring(gx - 26, y, 13, {color: P.evidence, alpha: q, width: 2, dash: [4, 4]});
        link(gx - 10, y, gx + 30, y - 18, {route: "hvh", mid: gx + 10, alpha: q, upto: go});
      }
    });
    const names = en ? ["What the evidence supports", "How confident you are", "What remains possible", "What to verify next",
      "What observation would change it"] : ["证据支持到哪一步", "有几成把握", "还有哪些可能", "下一步怎么核验", "看到什么会改判"];
    names.forEach((v, i) => nameText(v, nx, ys[i], {align: "left", width: 620, alpha: nine * listIn(t, ats, i), set: "bounds"}));
  }

};

/* ---------------- 08 decide: diagnose the failure, compare the options ---------------- */
scenes["08"] = function (s, t) {
  const [two, choose, options, statusQuo, notProve, recommend, premise, objection, first, revisit, authorized, overturn] = cues(s, [
    ["只做前两层", "only the first two"], ["做选择时", "when choosing"], ["可行的方案", "feasible options"], ["维持现状", "status quo"],
    ["证明不了它合适", "does not prove"], ["推荐方案时", "a recommendation"], ["前提", "premises"],
    ["最有力的反对意见", "strongest objection"], ["第一步", "first step"], ["什么情况下重新考虑", "trigger a revisit"],
    ["决定，由决策负责人做", "decision owner decides"], ["新的事实推翻了结论", "new facts overturn"]]);
  const layers = cues(s, [["控制影响", "containment"], ["修复", "repair"], ["防止再发生", "prevention"]]);
  const criteria = cues(s, [["收益", "benefit"], ["成本", "cost"], ["风险", "risk"], ["可逆性", "reversibility"], ["机会成本", "opportunity cost"]]);
  const badgeAts = cues(s, [["新颖", "novelty"], ["完整", "completeness"], ["流行", "popularity"]]);
  const base = ramp(t, opening(s), .7);
  // 1. Diagnosis on one timeline. Its rail stands from the first words, which mark the failure on it and name it above
  // its mark, and the record's moments are swept in along it as the timeline is said to be kept. The direct cause is
  // found on it, and the existing system's two checks, prevention before the cause and detection after it, stand as
  // questions on the words that ask why neither caught it. The system spans them as one light bracket above the rail;
  // the stations' names share one baseline below it.
  const [failed, kept, timeline, found, system, toPrevent, toDetect] = cues(s, [["出了问题", "something fails"],
    ["最初的症状", "original symptom"], ["时间线", "timeline"], ["直接原因", "direct cause"], ["现有的工作体系", "existing system"],
    ["预防", "prevent"], ["发现", "detect"]]);
  const one = base * stageOut(t, layers[0]);
  if (one > 0) {
    const Y = 550, xs = [480, 800, 1120, 1440], rail = ramp(t, opening(s) + .2, .6) * one;
    line(260, Y, 1660, Y, {color: P.line, alpha: rail, width: 4});
    const sweep = clamp((t - timeline + .1) / 1.2);
    [340, 640, 960, 1280, 1580].forEach(x => line(x, Y - 12, x, Y + 12, {color: P.muted,
      alpha: rail * clamp((sweep * 1400 - (x - 260)) / 300), width: 2}));
    nameText(L("时间线", "Timeline"), 260, Y - NAME_GAP, {align: "left", valign: "bottom", alpha: one * named(t, timeline)});
    // The existing system holds both checks: a bracket from prevention to detection, drawn on as it is named.
    const sys = ramp(t, system - .15, .4) * one;
    link(xs[0], Y - 30, xs[2], Y - 30, {route: "vhv", mid: Y - 130, alpha: sys, draw: {t, at: system - .1}, end: false});
    nameText(L("现有的工作体系", "The existing system"), (xs[0] + xs[2]) / 2, Y - 130 - NAME_GAP, {valign: "bottom", alpha: one * named(t, system)});
    const ats = [toPrevent, found, toDetect, kept];
    xs.forEach((x, i) => {
      const q = ramp(t, (i === 3 ? failed : ats[i]) - .1, .4) * one;
      // A station's mark masks the rail beneath it from the moment it begins to stand, so the rail never runs through
      // its mark or its question.
      dot(x, Y, 21, {color: P.ground, alpha: clamp(q * 8)});
      if (i === 0 || i === 2) {
        ring(x, Y, 20, {color: P.unknown, alpha: q, width: 2.5});
        text("?", x, Y + 1, 26, {role: "mark", align: "center", color: P.unknown, alpha: q});
      } else {
        ring(x, Y, 20, {color: P.unknown, alpha: q, width: 3});
        dot(x, Y, i === 3 ? 10 : 6, {color: P.unknown, alpha: q});
      }
      // The failure is flagged where it happened: a marker rises from its mark, and the failure is named above it.
      if (i === 3) line(x, Y - 26, x, Y - 64, {color: P.unknown, alpha: q, width: 3});
    });
    railNames(en ? ["Prevent", "Direct cause", "Detect", "Original symptom"] : ["预防", "直接原因", "发现", "最初的症状"], xs, Y,
      {alpha: i => one * named(t, ats[i])});
    nameText(L("出了问题", "Something fails"), xs[3], Y - 64 - NAME_GAP, {valign: "bottom", alpha: one * named(t, failed)});
  }
  // 2. Three layers of response in one stack, the shallowest on top: containment, repair and prevention stand in order,
  // each on its own words. Doing only the first two is bracketed and refused, and checks mark those two while
  // prevention's mark stays an open, dashed ring; the fix at the root (a systemic fix in English) is the bracket that
  // encloses all three. The Chinese names the first two a fix of the symptom, not of the root.
  const lay = base * stageIn(t, layers[0]) * stageOut(t, choose);
  if (lay > 0) {
    // The stage stands centred in each of its states: the stack with its names alone; with the refused first two, which
    // join it on its left, it eases right on their words; and with the fix at the root, which closes it on the right, it
    // eases back left on those words.
    const ys = [330, 500, 670], x0 = 680, x1 = 1180, h = 84, names = en ? ["Containment", "Repair", "Prevention"] : ["控制影响", "修复", "防止再发生"];
    const not = cue(s, "不算", "is not a"), whole = cue(s, "治本", "systemic fix"), done = ramp(t, two - .1, .4) * lay;
    const nameEnd = x1 + NAME_GAP + Math.max(...names.map(v => measure(v))), refusedEnd = x0 - 40 - NAME_GAP - 42 - measure(L("只做前两层", "Only the first two"));
    const fixEnd = nameEnd + 40 + NAME_GAP + measure(L("治本", "A systemic fix")), centre = (l, r) => 960 - (l + r) / 2;
    const states = [centre(x0, nameEnd), centre(refusedEnd, nameEnd), centre(refusedEnd, fixEnd)];
    const ox = states[0] + (states[1] - states[0]) * glide(t, two - .1, states[1] - states[0]) + (states[2] - states[1]) * glide(t, whole - .1, states[2] - states[1]);
    // The stack builds downward, so it stands half a row lower for each layer still to come and rises as each comes.
    ctx.save(); ctx.translate(ox, building(t, layers, (ys[1] - ys[0]) / 2));
    ys.forEach((y, i) => {
      const q = ramp(t, layers[i] - .1, .4) * lay, lit = speaking(t, layers, i) * lay;
      box(x0, y - h / 2, x1 - x0, h, {fill: P.row, stroke: P.line, alpha: q, radius: 10, width: 2.5});
      box(x0, y - h / 2, x1 - x0, h, {stroke: P.ink, alpha: q * lit, radius: 10, width: 3});
      if (i < 2) check(x0 + 200, y, 30, {alpha: done, draw: {t, at: two - .05 + i * .2}});
      else ring(x0 + 200, y, 17, {color: P.unknown, alpha: done, width: 2.5, dash: [4, 5]});
      nameText(names[i], x1 + NAME_GAP, y, {align: "left", alpha: lay * listIn(t, layers, i), set: "layers"});
    });
    // Only the first two: a bracket on the left encloses them, and the phrase is refused on "is not" ("不算").
    const lx = x0 - 40, top = ys[0] - h / 2;
    link(x0 - 18, top, x0 - 18, ys[1] + h / 2, {route: "hvh", mid: lx, end: false, alpha: done, draw: {t, at: two - .1}});
    rejectedName(L("只做前两层", "Only the first two"), lx - NAME_GAP - 42, (ys[0] + ys[1]) / 2,
      {align: "right", alpha: lay * named(t, two), mark: ramp(t, not + .05, .4)});
    // The fix at the root encloses all three layers, on the right beyond their names.
    const bx = x1 + NAME_GAP + Math.max(...names.map(v => measure(v))) + 40;
    link(bx - 18, top, bx - 18, ys[2] + h / 2, {route: "hvh", mid: bx, end: false, alpha: ramp(t, whole - .1, .4) * lay, draw: {t, at: whole - .1}});
    nameText(L("治本", "A systemic fix"), bx + NAME_GAP, ys[1], {align: "left", alpha: lay * named(t, whole)});
    ctx.restore();
  }
  // 3. Choosing: the feasible options stand side by side as the columns of one table, the status quo among them, and one
  // basis runs across every column as its rows, so the rows themselves show that it is one. The stage cuts in on the
  // words that call for a choice, its first mark, with the options it chooses between as the heads of their columns;
  // the options' bracket joins them as they are named, and the status quo's column on its own words. Each column grows
  // down with each criterion's row, which arrives across all the options on its own words and scores them. Novelty,
  // completeness and popularity follow beside the table and are refused there: they do not prove a fit.
  const cmp = base * stageIn(t, choose) * stageOut(t, recommend);
  if (cmp > 0) {
    // The table stands 20 px right of its place while it builds alone, and eases left to make room for the refused
    // qualities beside it, so the table alone and the table with them each stand about the centre and inside the safe
    // area: 115 px in Chinese, on the words that bring them, and 185 px in English, whose qualities stand on one line
    // over their verdict, on its last criterion's last word, so the table reaches its place as they arrive and the table
    // alone stands about the centre until then.
    const easeAt = en ? cueFrom(s, "", "cost", criteria.at(-1)) : badgeAts[0];
    ctx.save(); ctx.translate(20 - L(115, 185) * glide(t, easeAt + .05, L(115, 185)), 0);
    // The options' headers hang from one line near the cards' top, so a header of two lines shares its first line with
    // the one-line headers; the headers stand at the note size in both editions, all three alike, so the status quo
    // stands whole on one line within its card with clear card on either side. The cards stay narrow enough to read as
    // cards rather than containers.
    const LR = 580, xs = [800, 1060, 1320], CW = 140, top = 400, headY = top + 46 - labelSize(LABEL) / 2, rowY = i => 550 + i * 58;
    const opened = [statusQuo, choose, choose];
    // A column reaches just past its latest row: it grows to each row 0.3 s before the row's words, over 0.4 s.
    const low = criteria.reduce((h, at, i) => mix(h, rowY(i) + 40, soon(t, at - .3, .4)), top + 130);
    xs.forEach((x, j) => {
      box(x - CW / 2, top, CW, low - top, {fill: P.row, stroke: P.line, alpha: ramp(t, opened[j] - .1, .4) * cmp, radius: 14, width: 2.5});
    });
    // The choice still to be made, an open diamond at the table's corner, and the feasible options, the status quo
    // included, held together by one bracket over their columns, which the choice joins.
    const CX = LR - 24, BY = top - 46, opts = ramp(t, options - .15, .4) * cmp, open = cmp * named(t, choose);
    diamond(CX, BY, 20, {color: P.authority, alpha: open});
    text("?", CX, BY + 1, 22, {role: "mark", align: "center", color: P.authority, alpha: open});
    nameText(L("选择", "Choosing"), CX - 20 - NAME_GAP, BY, {align: "right", color: P.authority, alpha: open});
    // The bracket holds the two options from their words and reaches on to the status quo as it is named.
    const xl = mix(xs[1], xs[0], glide(t, statusQuo - .3, xs[1] - xs[0]));
    link(CX + 26, BY, xl, BY, {alpha: opts, draw: {t, at: options - .1}});
    link(xl, top - 14, xs[2], top - 14, {route: "vhv", mid: BY, end: false, alpha: opts, draw: {t, at: options - .1}});
    nameText(L("可行的方案", "Feasible options"), xs[1], top - 46 - NAME_GAP, {valign: "bottom", alpha: cmp * named(t, options)});
    const headSize = NOTE;
    nameText(L(["维持现状"], ["Status quo"]), xs[0], headY, {valign: "top", size: headSize, alpha: cmp * named(t, statusQuo)});
    ["A", "B"].forEach((v, j) => nameText(v, xs[j + 1], headY, {valign: "top", size: headSize, alpha: cmp * named(t, choose)}));
    // Each criterion is a row across all the options; its cells are assessed on its own words, sweeping across every
    // option, and the row being named lights. The illustrative cells differ, so the row reads as a comparison.
    const rows = en ? ["Benefit", "Cost", "Risk", "Reversibility", "Opportunity cost"] : ["收益", "成本", "风险", "可逆性", "机会成本"];
    const fav = [[.3, .8, .9], [.8, .4, .1], [.5, .6, .2], [1, .7, .3], [.4, .5, .6]];
    rows.forEach((v, i) => {
      const y = rowY(i), lit = speaking(t, criteria, i) * cmp, grid = ramp(t, criteria[i] - .15, .4) * cmp;
      line(LR + 40, y, xs[2] + CW / 2, y, {color: P.line, alpha: grid * .5, width: 2});
      line(LR + 40, y, xs[2] + CW / 2, y, {color: P.muted, alpha: lit, width: 2.5});
      xs.forEach((x, j) => {
        dot(x, y, 6, {color: P.line, alpha: grid, hollow: true});
        dot(x, y, 6 + 14 * fav[i][j] * soon(t, criteria[i] - .1 + j * .12, .4), {color: P.evidence, alpha: ramp(t, criteria[i] - .1 + j * .12, .3) * cmp});
      });
      nameText(v, LR, y, {align: "right", alpha: cmp * listIn(t, criteria, i), set: "basis"});
    });
    // The qualities that do not prove a fit, said as one phrase: one name beside the table, refused with its verdict.
    const QX = xs[2] + CW / 2 + 30, QY = rowY(2), refuse = ramp(t, notProve - .1, .4);
    const qualities = rejectedName(L("新颖、完整、流行", "Novelty, completeness or popularity"), QX, QY, {align: "left", width: L(340, Infinity),
      alpha: cmp * named(t, badgeAts[0]), mark: refuse});
    nameText(L("证明不了它合适", "does not prove a fit"), QX, qualities.bottom + 12, {align: "left", valign: "top", alpha: cmp * named(t, notProve)});
    ctx.restore();
  }
  // 4. A recommendation states four things: a document whose spine reaches each of its parts, one row each, built in
  // the order spoken. The spine grows from the document to each part as it is named and the part's mark stands at the
  // end of its branch. The part being named lights its mark; the parts stay while the recommendation stands.
  const rec = base * stageIn(t, recommend) * stageOut(t, authorized);
  if (rec > 0) {
    // The Chinese parts' names are short, so its recommendation stands 64 px right, centred on its extent. The English
    // document and its premises stand 60 px right until the strongest objection is named, and ease to their place then.
    ctx.save(); ctx.translate(en ? 60 - 60 * glide(t, objection + .05, 60) : 64, 0);
    const parts = [premise, objection, first, revisit], LX = 1000, ys = stackTops([0, 0, 0, 0], CONTENT_CY, 96);
    const names = en ? ["Premises", "The strongest objection", "The first step", "What would trigger a revisit"]
      : ["前提", "最有力的反对意见", "第一步", "重新考虑"];
    documentIcon(560, CONTENT_CY - 130, 200, 260, {alpha: rec, rows: 4});
    nameText(L("推荐方案", "A recommendation"), 660, CONTENT_CY + 130 + NAME_GAP, {valign: "top", alpha: rec * named(t, recommend)});
    const spine = 860, grow = i => soon(t, parts[i] - .15, .5);
    link(760 + 12, CONTENT_CY, spine, CONTENT_CY, {alpha: rec, end: false});
    // The spine runs up from the document's link to the first part, passing the second, and down to the third and then
    // the fourth.
    link(spine, CONTENT_CY, spine, ys[0], {alpha: rec * .9, upto: grow(0), end: false});
    link(spine, CONTENT_CY, spine, ys[3], {alpha: rec * .9, end: false,
      upto: (grow(2) * (ys[2] - CONTENT_CY) + grow(3) * (ys[3] - ys[2])) / (ys[3] - CONTENT_CY)});
    ys.forEach((y, i) => {
      const q = ramp(t, parts[i] - .1, .4) * rec, lit = speaking(t, parts, i) * rec;
      link(spine, y, LX - 34 - 13, y, {alpha: rec * .8, upto: grow(i), end: false});
      dot(LX - 34, y, 13, {color: P.evidence, alpha: q});
      if (lit > 0) ring(LX - 34, y, 21, {color: P.evidence, alpha: lit * restMark(P.evidence, .5), width: 2});
      nameText(names[i], LX, y, {align: "left", alpha: rec * listIn(t, parts, i), set: "recommendation"});
    });
    ctx.restore();
  }
  // 5. The decision owner decides: the owner's way runs straight to the decision and seals it. The phrases that are
  // not decisions ("agreed in principle", "keep looking", "keep going") leave the same way on branches toward the
  // decision and stop at bars short of it: none decides. Instead, a matter not yet decided says which state it is in,
  // each on its own words beneath them: ready for the decision, its page prepared beside a seal not yet set; blocked, its
  // way stopped at a bar; or deferred, set aside beside a clock. The decision is named on its own spoken word: "决定"
  // opens the zh sentence, "decides" closes the en one.
  const [holder, notDecision, decisionName] = cues(s, [["决策负责人", "decision owner"], ["都不是决定", "are not decisions"],
    ["决定，由", "decides"]]);
  const decides = cueFrom(s, "做", "decides", holder);
  const said = en ? cues(s, [["", "agreed in principle"], ["", "keep looking"], ["", "keep going"]]) : cues(s, [["原则上同意", ""], ["再看看", ""], ["继续推进", ""]]);
  const phrases = en ? ["“Agreed in principle”", "“Keep looking”", "“Keep going”"] : ["“原则上同意”", "“再看看”", "“继续推进”"];
  // The English first phrase is its whole caption line, the quotation and its comma, so it waits for that line to pass
  // and arrives with the second phrase; shown while its own line stands, it would only repeat it.
  const shown = en ? [said[1] + .1, said[1] + .1, said[2]] : said;
  const dec = base * stageIn(t, authorized) * stageOut(t, overturn);
  if (dec > 0) {
    // The owner and the decision stand 840 px apart and the seal is 58 px in radius, so the two cover the band while
    // they stand alone, before the phrases arrive.
    const Y = CONTENT_CY - 50, px = 560, sx = 1400, SR = 58, jx = 820, stop = 1250, ys = [Y - 170, Y - 90, Y + 130];
    person(px, Y - 6, {alpha: dec, color: P.authority, size: 1.3});
    nameText(L("决策负责人", "The decision owner"), px, Y + 50 + NAME_GAP, {valign: "top", color: P.authority, alpha: dec * named(t, holder)});
    // The person's way runs to the decision and seals it on "decides".
    link(px + 44, Y, sx - SR - 14, Y, {color: P.authority, alpha: dec, draw: {t, at: holder - .1, least: decides - holder + .3}, width: 2.5});
    seal(sx, Y, SR, {alpha: ramp(t, decides - .1, .4) * dec});
    nameText(L("决定", "Decides"), sx, Y + SR + NAME_GAP, {valign: "top", alpha: dec * named(t, decisionName)});
    // The refused phrases stand over or under their branches, centred on the branches' axis with their crosses as one
    // unit, as a lone refusal is centred. Where two of them stand stacked on one side they read as a list, and all its
    // crosses stand in one column after the longest phrase; where each stands alone on its side, its cross follows it.
    // Until its cross enters, a phrase alone stands centred on its branch, and it moves into its unit as the cross enters.
    const refuse = ramp(t, notDecision + .05, .4), cs = Math.min(26, labelSize(LABEL) * .9), px0 = (jx + stop) / 2 - (16 + cs) / 2;
    const stacked = ys.some((y, i) => ys.some((v, k) => k !== i && (v > Y) === (y > Y)));
    const widths = phrases.map(v => measure(v)), markAt = i => px0 + (stacked ? Math.max(...widths) : widths[i]) / 2 + 16;
    shown.forEach((at, i) => {
      const y = ys[i], below = y > Y;
      link(jx, Y, stop, y, {route: "vh", alpha: dec * ramp(t, at - .15, .3), draw: {t, at: at - .1}, end: false});
      line(stop, y - 18, stop, y + 18, {color: P.unknown, alpha: refuse * dec, width: 4});
      rejectedName(phrases[i], mix((jx + stop) / 2, px0, refuse), y + (below ? NAME_GAP : -NAME_GAP),
        {valign: below ? "top" : "bottom", alpha: dec * mix(listIn(t, shown, i), named(t, at), refuse), mark: refuse, set: "phrases", markLeft: markAt(i)});
    });
    const states = [["待决定", "ready for decision"], ["受阻", "blocked"], ["暂缓", "deferred"]].map(([zh, english]) => cueFrom(s, zh, english, notDecision));
    const SY = Y + 280, sxs = [680, 960, 1240];
    states.forEach((at, i) => {
      const x = sxs[i], q = dec * ramp(t, at - .1, .4), go = soon(t, at - .05, .6);
      if (i === 0) {
        documentIcon(x - 60, SY - 26, 40, 52, {alpha: q, rows: 2});
        seal(x + 24, SY, 26, {alpha: q, hollow: true});
      } else if (i === 1) {
        // The stopped way stands centred on its name: it runs from 40 px left of the name's centre to its bar 40 px right.
        link(x - 40, SY, x + 26, SY, {alpha: q, upto: go, end: false});
        token(mix(x - 40, x + 14, go), SY, {alpha: q, r: 11});
        line(x + 38, SY - 22, x + 38, SY + 22, {color: P.unknown, alpha: q, width: 4});
      } else {
        token(x - 30, SY, {alpha: q, r: 11});
        clock(x + 22, SY, 22, {hand: .25, color: P.muted, alpha: q});
      }
      nameText(en ? ["Ready for decision", "Blocked", "Deferred"][i] : ["待决定", "受阻", "暂缓"][i], x, SY + 30 + NAME_GAP,
        {valign: "top", alpha: dec * listIn(t, states, i), set: "readiness"});
    });
  }
  // 6. New facts overturn a conclusion: along one way in time the conclusion stands first, a stamped page, the new facts
  // arrive after it as a page of their own and cross it out, and the way runs on to the prompt correction, a newly
  // stamped page. The sunk costs lie below the old conclusion and reach up to hold on to it and are stopped at a bar:
  // they are not a reason to keep it.
  const [conclusion, overturned, correct, defend, sunkCue] = cues(s, [["结论", "conclusion"], ["推翻了", "overturn"], ["就改", "correct it"],
    ["别被沉没成本绑住", "defending sunk costs"], ["沉没成本", "sunk costs"]]);
  const fix = base * stageIn(t, overturn);
  if (fix > 0) {
    // The way's three pages stand with the new facts 30 px left of the centre, so the stage, the cross beside the old
    // conclusion on its left included, stands centred once the correction arrives. Until the correction is named the
    // conclusion and the new facts stand 150 px right, centred, and the stage eases left on its words.
    ctx.save(); ctx.translate(150 - 150 * glide(t, correct + .05, 150), 0);
    const Y = 470, xs = [550, 990, 1430], PW = 200, PH = 290, FW = 170, FH = 220, my = Y + PH / 2 + 70, SR = 54;
    // The way reaches the new facts first and runs on past them to the correction.
    const from = xs[0] + PW / 2 + 12, to = xs[2] - PW / 2 - 12, facts = (xs[1] - FW / 2 - 12 - from) / (to - from);
    link(from, Y, to, Y, {alpha: fix * .9, upto: mix(facts, 1, drawShare(t, correct - .1, (1 - facts) * (to - from))), end: false,
      flowing: since(t, correct + .5)});
    // The overturned conclusion steps back to the authority's level as a cross stands beside it, on the side away from
    // the way, so the two never meet.
    const old = fix * mix(1, restMark(P.authority), ramp(t, overturned + .05, .4)), fresh = ramp(t, correct - .1, .4) * fix;
    documentIcon(xs[0] - PW / 2, Y - PH / 2, PW, PH, {alpha: old, rows: 0});
    seal(xs[0], Y - 8, SR, {alpha: old});
    cross(xs[0] - PW / 2 - 40, Y, 34, {alpha: ramp(t, overturned + .05, .4) * fix, width: 4});
    documentIcon(xs[1] - FW / 2, Y - FH / 2, FW, FH, {alpha: fix, rows: 3, stroke: P.evidence});
    documentIcon(xs[2] - PW / 2, Y - PH / 2, PW, PH, {alpha: fresh, rows: 0});
    seal(xs[2], Y - 8, SR, {alpha: fresh});
    railNames(en ? ["A conclusion", "New facts", "Correct it"] : ["结论", "新的事实", "就改"], xs, Y - PH / 2, {side: -1, gap: NAME_GAP,
      alpha: i => fix * named(t, [Math.min(conclusion, overturn + .2), overturn + .2, correct][i])});
    // Sunk costs: spent blocks under the old conclusion, which stand as they are named; their way up to it stops short
    // at a bar.
    [0, 1, 2].forEach(k => box(xs[0] - 60, my + k * 34, 120, 26, {fill: P.row, stroke: P.muted, alpha: fix * named(t, defend), radius: 4}));
    link(xs[0], my - 14, xs[0], my - 72, {alpha: fix * named(t, defend), draw: {t, at: defend - .05}, end: false});
    line(xs[0] - 22, my - 72, xs[0] + 22, my - 72, {color: P.unknown, alpha: ramp(t, sunkCue + .05, .3) * fix, width: 4});
    rejectedName(L("被沉没成本绑住", "Defending sunk costs"), xs[0] + 60 + NAME_GAP, my + 47, {align: "left",
      alpha: fix * named(t, defend), mark: ramp(t, sunkCue + .05, .4)});
    ctx.restore();
  }
};

/* ---------------- 09 data: qualify data for a specific use ---------------- */
/* A table: its panel, its outline and its ruled rows and columns. With `joined` the rules are drawn in one stroke, so
 * they read as the table's own lines rather than as separate members waiting for names, as 06's collection and 09's
 * price data are drawn. */
function tableIcon(x, y, w, h, {alpha = 1, stroke: s = P.ink, rows = 4, cols = 3, joined = false} = {}) {
  if (alpha < .01) return;
  box(x, y, w, h, {fill: P.row, stroke: s, alpha, radius: 8});
  if (joined) {
    stroke(() => {
      for (let r = 1; r < rows; r++) { ctx.moveTo(x, y + h * r / rows); ctx.lineTo(x + w, y + h * r / rows); }
      for (let c = 1; c < cols; c++) { ctx.moveTo(x + w * c / cols, y); ctx.lineTo(x + w * c / cols, y + h); }
    }, {alpha, width: 1.5});
    return;
  }
  for (let r = 1; r < rows; r++) line(x, y + h * r / rows, x + w, y + h * r / rows, {color: P.line, alpha, width: 1.5});
  for (let c = 1; c < cols; c++) line(x + w * c / cols, y, x + w * c / cols, y + h, {color: P.line, alpha, width: 1.5});
}

scenes["09"] = function (s, t) {
  const [specific, file, chart, signal, six, unclear, , , truth] = cues(s, [
    ["证明适合某个具体用途", "shown fit for a specific use"], ["能打开的文件", "a file that opens"], ["好看的图", "a chart that looks good"],
    ["看起来有效的模型信号", "a promising model signal"], ["先答清六个问题", "answer six questions"], ["含义、质量或", "data with unknown meaning"],
    ["探索", "explored"], ["共享", "sharing, production and decisions"], ["权威来源", "source of truth"]]);
  const asks = cues(s, [["从哪里来", "where did it come from"], ["最早什么时候能拿到", "when did it become available"], ["含义是什么", "what does it mean"],
    ["被什么改过", "what changed it"], ["质量怎么样", "how good is it"], ["能用在哪里", "how may it be used"]]);
  const views = cues(s, [["报告", "reports"], ["数据目录", "catalogs"], ["缓存", "caches"], ["智能体的摘要", "agent summaries"]]);
  const unknowns = cues(s, [["含义", "meaning"], ["质量", "quality"], ["使用权限", "permission"], ["复现", "reproducibility"]]);
  const [dataAt, useAt, trustAt] = cues(s, [["再看数据", "data"], ["具体用途", "a specific use"], ["才谈得上可信", "earns trust"]]);
  // The data that may only be explored is named with its unknowns. English names them as the data's own words open its
  // thought, so the exploration stage cuts in on them. Chinese first recalls three of the six questions as the ones
  // still unclear, 含义、质量或最早能拿到的时间还说不清, so the ring holds through that clause and marks each on its
  // words, and the exploration stage cuts in as the clause that allows exploring begins.
  const explore = cue(s, "可以在授权范围里探索", "may be explored"), opensFour = en ? unclear : explore;
  const recalled = en ? [] : [unclear, cue(s, "质量或", ""), cue(s, "最早能拿到的时间", "")], recalls = [2, 4, 1];
  const base = ramp(t, opening(s), .7);
  const cx = 960, cy = 470, W = 560, H = 340, top = cy - H / 2;
  // Stages 1 to 3 stand about the data. The English open questions' names are long, so in English the data and all that
  // stands about it ease 55 px left as the first open question is named, and stay there while the ring's first four
  // questions are named on its right and below; the ring's English names are short, so the stage eases back to the
  // centre over the words of the two questions named on its left, in one move from the fifth question to the end of the
  // sixth: the second stage and the ring then stand about the centre as they build. The Chinese second question keeps
  // its spoken words, the ring's longest name, on its right, so in Chinese the stage eases 30 px left as it is asked.
  // The English ring stands alone, and then with its first question named over it, for two seconds before a question
  // is named on its right, so the stage eases back to the centre as the ring cuts in and left again as the second
  // question is asked.
  const back = glide(t, asks[4] + .05, 55), ringCut = en ? glide(t, six + STAGE_CUT, 55) - glide(t, asks[1] - .1, 55) : 0;
  ctx.save(); ctx.translate(en ? -55 * (glide(t, unknowns[0] + .05, 55) - ringCut - back) : -30 * glide(t, asks[1] + .05, 30), 0);
  // 1-3. The price data stands at the centre while it is questioned: its name above its left edge, the specific use it
  // must be shown fit for above its right edge on the same line, and its trust an open seal on its corner. Its rules are
  // one stroke with it, so the table reads as one mark under its name.
  const center = base * stageOut(t, opensFour) * clearOfTitle(s, t, top - 60);
  if (center > 0) {
    const core = ramp(t, Math.min(specific - .4, opening(s) + .2), .7) * center;
    tableIcon(cx - W / 2, top, W, H, {alpha: core, joined: true});
    [["101.18", "101.25", "100.97"], ["100.94", "101.02", "100.88"], ["101.37", "101.41", "101.12"], ["101.06", "101.10", "100.95"]]
      .forEach((row, r) => row.forEach((v, c) => text(v, cx - W / 3 + c * W / 3, top + H * (r + .5) / 4, 26,
        {align: "center", color: c ? P.muted : P.ink, alpha: core, role: "mark"})));
    // The chapter's first sentence turns to its subject, data: the English names it from its first word, the Chinese
    // as the clause that turns to it begins (0.3 s ahead of it, so the opening words are not left without a name).
    nameText(L("数据", "Data"), cx - W / 2, top - NAME_GAP, {align: "left", valign: "bottom",
      alpha: center * named(t, en ? Math.min(dataAt, s.words[0].start) : dataAt - .3)});
    nameText(L("具体用途", "A specific use"), cx + W / 2, top - NAME_GAP, {align: "right", valign: "bottom", color: P.evidence,
      alpha: center * named(t, useAt)});
    const badge = ramp(t, trustAt - .15, .4) * center;
    dot(cx + W / 2, top + H, 28, {color: P.ground, alpha: badge});
    ring(cx + W / 2, top + H, 28, {color: P.evidence, alpha: badge, width: 2.5, dash: [5, 5]});
    check(cx + W / 2, top + H + 2, 24, {color: P.muted, alpha: badge});
  }
  // 2. Opening, looking good or looking promising establishes nothing: the three stand in a row below the data, and
  // what none of them establishes forms a column of open questions beside it. The three stand 375 px apart and the
  // column 90 px from the data, so the stage stays about the centre once it is whole; while the row builds it stands
  // 120 px right for each of the three still to come, closing a step on each one's words, so the first two stand
  // about the centre with the data too.
  const two = base * stageOut(t, six);
  if (two > 0) {
    const y = 760, at = [file, chart, signal], seen = i => ramp(t, at[i] - .1, .5) * two, xs = [585, 960, 1335].map(x => x + building(t, at, 120));
    documentIcon(xs[0] - 40, y - 50, 80, 100, {alpha: seen(0), rows: 3});
    box(xs[1] - 64, y - 44, 128, 88, {stroke: P.ink, alpha: seen(1), radius: 6});
    path([[xs[1] - 44, y + 24], [xs[1] - 14, y - 2], [xs[1] + 12, y + 10], [xs[1] + 44, y - 24]], {color: P.evidence, alpha: seen(1)});
    path([[xs[2] - 62, y + 20], [xs[2] - 26, y + 14], [xs[2] + 2, y - 2], [xs[2] + 30, y - 18], [xs[2] + 62, y - 40]], {color: P.authority, alpha: seen(2), width: 3});
    // The three names share one baseline, a name's gap under the tallest of the three marks, the document; each English
    // name stands whole on one line, which the 375 px pitch leaves room for.
    railNames(en ? ["A file that opens", "A chart that looks good", "A promising model signal"] : ["能打开的文件", "好看的图", "看起来有效的模型信号"],
      xs, y + 50, {gap: NAME_GAP, wrap: 340, alpha: i => two * named(t, at[i])});
    const ux = cx + W / 2 + 90, names = en ? ["Meaning", "Quality", "Permission", "Reproducibility"] : ["含义", "质量", "权限", "复现"];
    unknowns.forEach((at2, i) => {
      const yy = top + 50 + i * 64, q = ramp(t, at2 - .1, .4) * two;
      ring(ux, yy, 17, {color: P.unknown, alpha: q, width: 2.5, dash: [4, 4]});
      text("?", ux, yy + 1, 22, {align: "center", color: P.unknown, alpha: q, role: "mark"});
      nameText(names[i], ux + 17 + NAME_GAP, yy, {align: "left", alpha: two * listIn(t, unknowns, i), set: "unknowns"});
    });
  }
  // 3. Six questions ring the data from the words that count them, replacing the three non-proofs in one cut: the ring
  // is counted in at the structure tier and named as six questions under the data, and each question's station arrives
  // on the ring, filled, when its question is asked; the names build into the whole set and leave with the ring when
  // the exploration stage cuts in. Each question is named by the noun of what it asks, as its caption shows the whole
  // question: in English, whose questions lose their sense without their question words, and in Chinese alike. The
  // Chinese sixth, where the data may be used, is named 使用范围: the scene says 用途 a few seconds later of the one use
  // the data must be shown fit for, which 用途 here would seem to anticipate; the second keeps the words it is asked in,
  // 最早什么时候, so the term 可用时间 first stands where 10 defines it. As Chinese recalls meaning, quality and
  // availability as still unclear, each of the three takes the open question's dashed ring of stage 2 on its words and
  // keeps it while the ring stands.
  const three = base * stageIn(t, six) * stageOut(t, opensFour);
  if (three > 0) {
    const rx = 460, ry = 320, names = en ? ["Source", "Availability", "Meaning", "Changes", "Quality", "Permitted use"]
      : ["来源", "最早什么时候", "含义", "改动", "质量", "使用范围"];
    path(Array.from({length: 97}, (_, k) => [cx + Math.cos(k * Math.PI / 48) * rx, cy + Math.sin(k * Math.PI / 48) * ry]),
      {color: P.line, alpha: three, width: 3.5});
    nameText(L("六个问题", "Six questions"), cx, top + H + 28 + NAME_GAP, {valign: "top", alpha: three * named(t, six)});
    asks.forEach((at, i) => {
      const a = -Math.PI / 2 + i * Math.PI / 3, x = cx + Math.cos(a) * rx, y = cy + Math.sin(a) * ry, lit = speaking(t, asks, i);
      const asked = ramp(t, at - .1, .4) * three;
      dot(x, y, 12, {color: P.ground, alpha: asked});
      dot(x, y, 12, {color: P.evidence, alpha: asked, hollow: true, width: 2.5});
      dot(x, y, 12, {color: P.evidence, alpha: asked});
      if (lit > 0) ring(x, y, 21, {color: P.evidence, alpha: lit * restMark(P.evidence, .5) * three, width: 2});
      const k = recalls.indexOf(i), open = k >= 0 && k < recalled.length ? ramp(t, recalled[k] + .05, .4) * three : 0;
      if (open > 0) ring(x, y, 24, {color: P.unknown, alpha: open, width: 2.5, dash: [4, 4]});
      radialName(names[i], cx, cy, rx + 12, a, {ry: ry + 12, alpha: three * listIn(t, asks, i), set: "questions"});
    });
  }
  ctx.restore();
  // 4. Data with unknown meaning, quality or historical availability may be explored within an authorized scope but
  // must stay out of sharing, production and decisions until qualified for that use. The data stands from the cut with its
  // question mark, named as the words say it: in English by its unknown meaning, the words the stage cuts in on, and in
  // Chinese 还说不清, the words that close the clause before the cut, whose unknowns the ring has just marked. Its
  // exploration scope, a frame sized to it, stands round it from the cut and takes its name on the words that allow
  // exploring ("可以…", "may be explored"), with the cut in Chinese, so the English stage never stands as the data alone
  // through the words that name its unknowns; the work it stays out of stands beside it as a small frame whose three
  // uses arrive on their words. The way from the data toward that work stops at a boundary halfway, on the words that
  // refuse it. Both editions say what the data must first be shown, fit for this use, last, as the stage gives way, so
  // the boundary stands for it unnamed.
  const four = base * stageIn(t, opensFour) * stageOut(t, views[0]);
  if (four > 0) {
    const scope = explore, uses = cues(s, [["共享", "sharing"], ["投产", "production"], ["做决策", "decisions"]]);
    // The exploration side stands right of its place while it builds alone, and the stage eases to 135 px left of it as
    // the work it stays out of is named, so the pair of frames stands centred once that work stands beside it. The
    // English stands 90 px right, so its table opens over the ring of questions it replaces.
    const build = L(45, 90);
    // The English work's name stands whole on one line, so its stage eases 60 px further left, from the words that refuse
    // the way, and stands inside the safe area as the name arrives.
    const toWork = build + L(135, 195), toWorkAt = en ? cue(s, "但若用于", "but must stay out of") + .05 : uses[0] + .05;
    ctx.save(); ctx.translate(build - toWork * glide(t, toWorkAt, toWork), 0);
    // The two frames stand on one top, so their names stand on one line above them, and the way from exploration runs
    // into the work's frame at its centre. What the exploration frame holds, the table, its question and its name,
    // stands centred in it, with equal room above and below; the English name stands whole on one line, centred in the
    // frame under the table and its question, and its frame is 80 px wider than the Chinese, what the frame holds moving
    // with its centre, so the name keeps its padding and the frame, standing alone with what it holds until the
    // exploration is named, covers a tenth of the band. The frame is drawn 2.5 px wide, so it reads as lit structure on
    // its own, round quiet marks.
    const lx = 650, fy = 340, fw = L(400, 480), fh = 320, ax = 1250, ay = fy, aw = 290, ah = 200, mid = ay + ah / 2, unclearW = L(260, 380), inset = (fw - 400) / 2;
    const unclearName = L("还说不清", "Data with unknown meaning"), unclearAt = en ? unclear : cue(s, "还说不清", "");
    const ct = fy + (fh - 150 - NAME_GAP - blockHeight(wrapName(unclearName, unclearW).length)) / 2;
    box(lx, fy, fw, fh, {stroke: P.muted, width: 2.5, alpha: four, radius: 10});
    nameText(L("在授权范围里探索", "Explored within an authorized scope"), lx, fy - NAME_GAP, {align: "left", valign: "bottom", alpha: four * named(t, scope)});
    tableIcon(lx + 50 + inset, ct, 220, 150, {alpha: four, stroke: P.muted, rows: 2, cols: 2});
    text("?", lx + 330 + inset, ct + 75, 56, {align: "center", color: P.unknown, alpha: four, role: "mark"});
    nameText(unclearName, lx + L(160, fw / 2), ct + 150 + NAME_GAP, {valign: "top", width: unclearW, color: P.muted, alpha: four * named(t, unclearAt)});
    // The work it stays out of: shared use (two people), production (a running table) and decisions (a diamond).
    const wq = four * named(t, uses[0]);
    box(ax, ay, aw, ah, {fill: P.row, stroke: P.ink, alpha: wq, radius: 10});
    nameText(L("共享、投产或做决策", "Sharing, production and decisions"), ax, ay - NAME_GAP, {align: "left", valign: "bottom", width: L(420, 600), alpha: wq});
    const uq = i => four * ramp(t, uses[i] - .1, .4), ux = i => ax + aw * (i + .5) / 3, uy = ay + ah / 2;
    person(ux(0) - 12, uy + 4, {alpha: uq(0), size: .7}); person(ux(0) + 14, uy + 4, {alpha: uq(0), size: .7, color: P.muted});
    tableIcon(ux(1) - 30, uy - 22, 60, 44, {alpha: uq(1), rows: 3, cols: 2});
    diamond(ux(2), uy, 20, {color: P.authority, alpha: uq(2), width: 3});
    // The way from exploration toward that work runs straight across and stops at a boundary halfway, on the words that
    // refuse it, so the stop stands before the work is named.
    const refuse = cue(s, "但若用于", "but must stay out of"), go = soon(t, refuse - .05, .6), bx = (lx + fw + ax) / 2;
    link(lx + fw + 12, mid, ax - 12, mid, {color: P.unknown, alpha: four * ramp(t, refuse - .05, .3), upto: .46 * go, end: false, dash: [8, 8]});
    line(bx, mid - 34, bx, mid + 34, {color: P.unknown, alpha: ramp(t, refuse + .45, .3) * four, width: 4});
    ctx.restore();
  }
  // 5. Reports, catalogs, caches and Agent summaries are derived: they hang from the source of truth on
  // one trunk and one crossing row, the order of a family tree, and what flows down each drop is a copy. When the words
  // say none may quietly be treated as the source of truth, a short bar closes the trunk, the one way every view would
  // take back up, and a point leaves the last view, runs up its drop and along the crossing row, and stops below the
  // bar; every view keeps its position, so the names keep one baseline. The source of truth stands on the words that
  // name it, at the position and size the next scene lifts its price from.
  const five = base * stageIn(t, views[0]);
  if (five > 0) {
    // The views stand centred under their source: the crossing row's middle meets the trunk, so its two arms are equal.
    // The row stands whole from the stage's first words, a rail that shows no direction, so the stage stands as wide as
    // it will be, about the centre, while each view takes its place on it on its own words: the Chinese names its views
    // late in its thought, after a long first sentence, so a row grown out to each view would leave the picture thin
    // there. The source keeps the frame's centre, where the next scene lifts its price from, so the price's flight keeps
    // its length.
    const xs = [450, 790, 1130, 1470], sx = cx, sb = 360, bus = 410, iconTop = 480;
    const become = cue(s, "悄悄被当成", "quietly be treated as"), rootAt = cue(s, "权威来源", "source of truth");
    tableIcon(sx - 120, 210, 240, 150, {alpha: five * ramp(t, rootAt - .15, .4)});
    growName(t, [L("权威来源", "Source of truth")], [rootAt], sx - 120, 210 - NAME_GAP, {valign: "bottom", alpha: five});
    const shown = views.map(at => ramp(t, at - .15, .4) * five);
    // The trunk rises from the crossing row to the source as the source is named.
    link(sx, sb + 12, sx, bus, {alpha: five * ramp(t, Math.min(rootAt, become) - .15, .4), end: false});
    // The crossing row is drawn 2.5 px wide, so it reads as lit structure on its own now that the copies on the drops
    // run in passes instead of standing on every drop at once.
    line(xs[0], bus, xs[3], bus, {color: P.line, alpha: five, width: 2.5});
    const names = en ? ["Reports", "Catalogs", "Caches", "Agent summaries"] : ["报告", "数据目录", "缓存", "智能体的摘要"];
    views.forEach((at, i) => {
      const q = shown[i];
      if (q <= 0) return;
      const y = iconTop;
      // What flows down each drop is a copy; once the last view is about to be treated as the source, no copy leaves for
      // it again.
      link(xs[i], bus, xs[i], y - 10, {alpha: q, draw: {t, at: at + .15}, end: false, flowing: since(t, at + .45),
        last: i === 3 ? since(become + .05, at + .45) : Infinity});
      // A derived view: a copy drawn over a dashed trace of its source.
      box(xs[i] - 34, y + 8, 72, 96, {stroke: P.line, alpha: q, radius: 4, dash: [5, 5]});
      documentIcon(xs[i] - 42, y, 72, 96, {alpha: q, rows: 3});
      nameText(names[i], xs[i], y + 104 + NAME_GAP, {valign: "top", alpha: five * listIn(t, views, i), set: "views"});
    });
    const barY = (sb + 12 + bus) / 2;
    if (t >= become + .05) {
      // The point's way back: up the last drop, along the crossing row, and up the trunk to just below the bar.
      const way = [[xs[3], iconTop - 10], [xs[3], bus], [sx, bus], [sx, barY + 16]];
      // The point grows at the foot of the drop and glides along the way back, settling below the bar.
      const legs = way.slice(1).map(([x, y], k) => Math.hypot(x - way[k][0], y - way[k][1])), total = legs.reduce((a, b) => a + b, 0);
      let left = glide(t, become + .05, total) * total, k = 0;
      while (k < legs.length - 1 && left > legs[k]) left -= legs[k++];
      const u = clamp(left / legs[k]), [x0, y0] = way[k], [x1, y1] = way[k + 1];
      dot(mix(x0, x1, u), mix(y0, y1, u), 6 * clamp((voiceTime(t) - voiceTime(become + .05)) / .25), {color: P.unknown, alpha: shown[3]});
    }
    line(sx - 24, barY, sx + 24, barY, {color: P.unknown, alpha: ramp(t, truth + .05, .3) * five, width: 4});
  }
};

/* ---------------- 10 data: one price, five moments ---------------- */
/* The price on its own card. A value is a mark, so the card itself carries no name; a stage names it beside the card
 * where the words call it the price. */
function s10Card(x, y, {alpha = 1, w = 150, h = 56, border = P.ink, value = "101.37"} = {}) {
  if (alpha < .01) return;
  box(x - w / 2, y - h / 2, w, h, {fill: P.row, stroke: border, width: 2, alpha, radius: 6});
  text(value, x, y + 1, 26, {role: "mark", align: "center", color: P.ink, alpha: alpha * clamp((w - 100) / 40)});
}
scenes["10"] = function (s, t) {
  const priceAt = cue(s, "同一个价格", "One price");
  // Each moment is cued on the first of its name's words.
  const at = cues(s, [["在市场上成交", "a trade sets it"], ["供应商", "The vendor"], ["我们采集", "We collect"],
    ["入库", "write it into"], ["用它的人或系统", "becomes available"]]);
  // The lookup's stage cuts on its thought's first words: the Chinese opens by repeating the term, which names the
  // stage's centre station, the English on "It is not". The history's stage cuts on the words that keep it: "Keep"
  // opens the English thought, and the Chinese names the history's first record first.
  const [term, keepCut] = cues(s, [["可用时间", "availability time"], ["修订", "keep the history"]]);
  const notAt = cueFrom(s, "可用时间", "It is not", term + .1);
  // 1. One price, five moments. The price lifts out of the previous scene's table on the words that name it, and its
  // name goes with it as it lands on a timeline; the table gives way over the card's flight, so the scene never opens
  // thin. The rail stands at the structure tier as the price lands, and on the words that count the five moments one
  // bracket stands over the stations, named by those words. As each moment is named the card moves on to its station,
  // the actor who stamps it stands in its own ring above, and its name joins one baseline between them. The last
  // moment takes its term under the card.
  const one = stageOut(t, notAt);
  if (one > 0) {
    const RAIL = 636, ICON = 426, R = 50, five = cue(s, "至少对应五个时刻", "at least five moments");
    // Each English name stands whole on one line, so the names stand on two baselines at the rail's one pitch: every other
    // name a row nearer its icon, within the height two lines of a name would take.
    const names = en ? [["A trade in the market"], ["Published by the vendor"], ["We collect"], ["Written into the receiving system"],
      ["Available to people or systems"]] : ["在市场上成交", "供应商发布", "我们采集", "入库", "用它的人或系统"];
    // The English names are long, so the last interval is wider, its two last names clear of each other across their two
    // baselines, and the rail is centred again within the safe area as the camera drifts; the moments of a timeline are
    // not like items, so one pitch need not hold.
    const xs = en ? [258, 558, 858, 1158, 1604] : [360, 660, 960, 1260, 1560];
    // The previous scene's source table, where it was left: it gives up one cell and leaves as the cell lifts.
    const tableOut = 1 - ramp(t, priceAt - .05, .8);
    if (tableOut > 0) {
      const [tx, ty, k] = across(s, t, 960, 285);
      tableIcon(tx - 120 * k, ty - 75 * k, 240 * k, 150 * k, {alpha: tableOut});
    }
    // The card flies from its cell in the table to the first station on the rail.
    const [cx0, cy0, k0] = across(s, t, 960, 303.75), flightWay = Math.hypot(xs[0] - cx0, RAIL - cy0);
    const flightTime = Math.min(glideTime(flightWay), voiceTime(at[0] - .3) - voiceTime(priceAt - .05));
    // The way is long for the time the words leave it, so the card gathers pace over the flight's first fifth, flies on
    // at one even pace and slows over its last fifth: its pace peaks at 1.25 times its mean, not 1.5 as on a smoothstep.
    const cruise = q => { q = clamp(q); return q < .2 ? q * q / .32 : q > .8 ? 1 - (1 - q) * (1 - q) / .32 : (q - .1) / .8; };
    const flight = cruise((voiceTime(t) - voiceTime(priceAt - .05)) / flightTime);
    // The rail shows no direction, so it stands whole rather than drawing on. The card's name, flying under the card,
    // crosses the rail's line only left of the second station, so the rail from there on fades in as the card sets off
    // (and balances the card through its flight), and its first stretch, under the first station, fades in from the
    // card's last tenth of flight, when the name stands 16 px or more below the rail, over 0.4 s of voice time however
    // short the flight, so the stretch never inks in within a frame.
    const grouped = ramp(t, five + .1, .4), BY = ICON - R - 40;
    const lastTenth = voiceTime(priceAt - .05) + (1 - Math.sqrt(.032)) * flightTime, first = ease((voiceTime(t) - lastTenth) / .4);
    if (flight > .35) line(xs[1] - 70, RAIL, xs[4] + 70, RAIL, {color: P.line, width: 2.5, alpha: ease((flight - .35) / .2)});
    if (first > 0) line(xs[0] - 70, RAIL, xs[1] - 70, RAIL, {color: P.line, width: 2.5, alpha: first});
    // The bracket spans the five moments' names as well as their marks, 16 px past the widest end name, symmetric about
    // the bracket's name.
    const endW = [names[0], names[4]].map(v => Math.max(...wrapName(v, RAIL_WRAP).map(line => measure(line))));
    const reach = Math.min(L(Infinity, 830), Math.max(xs[4] + 70 - 960, 960 - (xs[0] - endW[0] / 2 - 16), xs[4] + endW[1] / 2 + 16 - 960));
    path([[960 - reach, BY + 14], [960 - reach, BY], [960 + reach, BY], [960 + reach, BY + 14]], {color: P.line, alpha: grouped, width: 2});
    nameText(L("五个时刻", "Five moments"), 960, BY - NAME_GAP, {valign: "bottom", alpha: grouped});
    const icons = [
      (x, a) => path([[x - 38, ICON + 16], [x - 14, ICON - 2], [x + 4, ICON + 10], [x + 38, ICON - 20]], {color: P.evidence, alpha: a, width: 3}),
      (x, a) => documentIcon(x - 26, ICON - 35, 52, 70, {alpha: a, rows: 3}),
      (x, a) => { path([[x - 32, ICON - 2], [x - 32, ICON + 24], [x + 32, ICON + 24], [x + 32, ICON - 2]], {color: P.ink, alpha: a, width: 2.5});
        link(x, ICON - 32, x, ICON + 10, {color: P.ink, alpha: a}); },
      (x, a) => tableIcon(x - 36, ICON - 26, 72, 52, {alpha: a, rows: 3, cols: 3}),
      (x, a) => { person(x - 20, ICON + 4, {alpha: a, size: .8}); agent(x + 22, ICON, {alpha: a, size: .8}); },
    ];
    xs.forEach((x, i) => {
      ring(x, ICON, R, {color: P.line, alpha: ramp(t, at[i] - .15, .4), width: 2});
      dot(x, RAIL, 12, {color: i === 4 ? P.evidence : P.ink, alpha: ramp(t, at[i] - .1, .4)});
      icons[i](x, ramp(t, at[i] - .15, .4));
      // The last moment stays lit from its words on: the next thought names it.
      const lit = i === 4 ? ramp(t, at[4] - .15, .3) : speaking(t, at, i);
      if (lit > 0) ring(x, ICON, R, {color: P.evidence, alpha: lit * restMark(P.evidence, .7), width: 2});
    });
    if (en) xs.forEach((x, i) => { if (i % 2) line(x, RAIL - 18, x, RAIL - 28 - NAME_GAP - RAIL_ROW + 6, {alpha: ramp(t, at[i] - .15, .4), width: 2}); });
    railNames(names, xs, RAIL, {side: -1, gap: i => 28 + NAME_GAP + (en && i % 2 ? RAIL_ROW : 0), alpha: i => listIn(t, at, i), set: "moments"});
    nameText(L("可用时间", "Availability time"), xs[4], RAIL + 28 + NAME_GAP + blockHeight(1) + 10, {valign: "top", color: P.evidence,
      alpha: named(t, term)});
    // The card: lifted from its cell, it lands on the first station and moves on with each moment. Its name follows
    // beneath it from the moment it clears the table, and each move from one moment to the next is a glide.
    let x = xs[0];
    for (let i = 1; i < 5; i++) x = mix(x, xs[i], glide(t, at[i] - .1, xs[i] - xs[i - 1]));
    const px = mix(cx0, x, flight), py = mix(cy0, RAIL, flight), ph = mix(37.5 * k0, 56, flight);
    s10Card(px, py, {alpha: ramp(t, priceAt - .25, .2), w: mix(80 * k0, 150, flight), h: ph,
      border: blend(P.ink, P.evidence, ramp(t, at[4] - .1, .5))});
    // The card's name joins under it once the card has lifted clear of the table it leaves.
    nameText(L("同一个价格", "One price"), px, py + ph / 2 + NAME_GAP, {valign: "top", alpha: named(t, priceAt + .2) * ramp(flight, .04, .4)});
  }
  // 2. It is not when you look it up today. One rail carries three times: then, availability and today. Above each a
  // slot shows what a lookup at that time finds: the value is there from its availability on, a lookup today finds it,
  // and a lookup then finds an empty slot. The time you look it up today is refused as the availability time.
  const two = stageIn(t, notAt) * stageOut(t, keepCut);
  if (two > 0) {
    const RAIL = 590, SLOT = 400, xs = [500, 840, 1400];
    // The time you look it up today arrives as its refusal begins ("不是你今天…", "when you look…").
    const [nowAt, foundAt, thenAt] = cues(s, [["不是你今天", "when you look"], ["今天拿得到", "available now"], ["当时", "available then"]]);
    line(xs[0] - 160, RAIL, xs[2] + 200, RAIL, {color: P.line, width: 2.5, alpha: two});
    box(xs[0] - 75, SLOT - 28, 150, 56, {stroke: P.unknown, alpha: two * ramp(t, thenAt, .3), radius: 6, dash: [6, 6]});
    // Availability: the value stands in its slot from this time on, and the span to today keeps it.
    dot(xs[1], RAIL, 12, {color: P.evidence, alpha: two});
    ring(xs[1], RAIL, 22, {color: P.evidence, alpha: two, width: 2});
    link(xs[1], RAIL - 12, xs[1], SLOT + 28, {color: P.evidence, alpha: two, end: false});
    s10Card(xs[1], SLOT, {alpha: two, border: P.evidence});
    link(xs[1] + 75, SLOT, xs[2] - 75, SLOT, {color: P.evidence, alpha: two, draw: {t, at: foundAt - .05}, end: false});
    // Today: a lookup finds the value.
    dot(xs[2], RAIL, 10, {color: P.ink, alpha: two * named(t, nowAt)});
    link(xs[2], RAIL - 10, xs[2], SLOT + 28, {color: P.ink, alpha: two, draw: {t, at: foundAt - .1}, end: false});
    s10Card(xs[2], SLOT, {alpha: two * ramp(t, foundAt + .2, .4)});
    // Then: the same lookup finds an empty slot.
    dot(xs[0], RAIL, 10, {color: P.unknown, alpha: two * named(t, thenAt)});
    link(xs[0], RAIL - 10, xs[0], SLOT + 28, {color: P.unknown, alpha: two, upto: drawShare(t, thenAt - .15, Math.abs(SLOT + 28 - (RAIL - 10)), .45), end: false, dash: [6, 6]});
    text("?", xs[0], SLOT + 1, 26, {role: "mark", align: "center", color: P.unknown, alpha: two * ramp(t, thenAt, .3)});
    const y = RAIL + 28 + NAME_GAP;
    nameText(L("当时", "Then"), xs[0], y, {valign: "top", alpha: two * named(t, thenAt)});
    nameText(L("可用时间", "Availability time"), xs[1], y, {valign: "top", color: P.evidence, alpha: two});
    rejectedName(L("你今天查到它的时间", "When you look it up today"), xs[2], y, {valign: "top", width: 360,
      alpha: two * named(t, nowAt), mark: ramp(t, nowAt + .6, .4)});
  }
  // 3. Keep the history. The stage cuts on the words that keep it, with the history's name over the line its records
  // stand on; each record (revisions, backfills, derivations) arrives on the line with its clock and name on its own
  // words. A bracket gathers the records and one link carries them down to the current value, which the history now
  // explains: where it came from and when it first became available.
  const three = stageIn(t, keepCut);
  if (three > 0) {
    const RY = 480, xs = [640, 960, 1280], VY = 730, BY = RY + 104;
    const kinds = cues(s, [["修订", "revisions"], ["回补", "backfills"], ["加工", "derivations"]]);
    const [histAt, valueAt] = cues(s, [["历史都要留着", "Keep the history"], ["当前这个值", "explain the current value"]]);
    const answers = en ? [["When it became available"], [cue(s, "", "when it became available")]]
      : [["从哪来", "最早什么时候能拿到"], cues(s, [["从哪来", ""], ["最早什么时候能拿到", ""]])];
    const names = en ? ["Revisions", "Backfills", "Derivations"] : ["修订", "回补", "加工"];
    // The history's line stands from the cut. The Chinese names the history in the clause after its three records, so
    // its name stands from the first words of that clause.
    const drawn = drawShare(t, keepCut + .05, 1600 - 320);
    line(320, RY, mix(320, 1600, drawn), RY, {color: P.line, width: 3.5, alpha: three});
    line(320, RY - 14, 320, RY + 14, {color: P.line, width: 3.5, alpha: three});
    line(1600, RY - 14, 1600, RY + 14, {color: P.line, width: 3.5, alpha: three * ramp(t, keepCut + .55, .3)});
    const histShown = en ? histAt : cue(s, "这些历史", "");
    nameText(L("历史都要留着", "Keep the history"), 960, RY - 70 - NAME_GAP, {valign: "bottom", alpha: three * named(t, histShown)});
    xs.forEach((x, i) => {
      const kept = ramp(t, kinds[i] - .1, .4), lit = speaking(t, kinds, i);
      dot(x, RY, 12, {color: P.ink, alpha: three * kept});
      clock(x, RY - 44, 17, {hand: .15 + i * .2, color: P.muted, alpha: three * kept});
      if (lit > 0) ring(x, RY, 22, {color: P.evidence, alpha: three * lit * restMark(P.evidence, .6), width: 2});
    });
    // The records' names hang 12 px clear of the ring that lights round the record being said.
    railNames(names, xs, RY, {gap: 22 + 12, alpha: i => three * listIn(t, kinds, i), set: "history"});
    // The bracket gathers the records and carries them down to the current value.
    const gather = soon(t, valueAt - .1, .6);
    path([[xs[0] - 90, BY - 14], [xs[0] - 90, BY], [xs[2] + 90, BY], [xs[2] + 90, BY - 14]], {color: P.line, alpha: three * gather, width: 2});
    link(960, BY, 960, VY - 32 - 12, {alpha: three, upto: gather});
    s10Card(960, VY, {alpha: three * ramp(t, valueAt - .1, .4), w: 180, h: 64, border: P.evidence});
    nameText(L("当前这个值", "Explain the current value"), 960 - 90 - NAME_GAP, VY, {align: "right", alpha: three * named(t, valueAt)});
    answers[0].forEach((v, i) => {
      const y = VY + (i - (answers[0].length - 1) / 2) * 44;
      check(960 + 90 + 40, y, 24, {alpha: three * ramp(t, answers[1][i] - .1, .4)});
      nameText(v, 960 + 90 + 70, y, {align: "left", alpha: three * listIn(t, answers[1], i), set: "answers"});
    });
  }
};

/* ---------------- 11 data: what we see now is not what we knew then ---------------- */
const X0 = 300, X1 = 1600;
const DEC = [560, 800, 1040], CORR = [460, 1060], CORR_DATE = 1300;
/* The vendor's price history: one close per trading day (DAY px apart) around a slow course, so it reads as a market
 * record rather than a smooth curve. Each day's move is a fixed pseudo-random draw, so every frame and every copy of the
 * chart shows the same history. */
const DAY = 10;
const dayMove = i => { const v = Math.sin(i * 12.9898 + 78.233) * 43758.5453; return v - Math.floor(v) - .5; };
function priceAt(x) {
  const u = (x - X0) / (X1 - X0), d = (x - X0) / DAY, i = Math.floor(d), w = Math.floor(d / 4);
  const day = mix(dayMove(i), dayMove(i + 1), d - i) * 13 + mix(dayMove(w + 500), dayMove(w + 501), d / 4 - w) * 10;
  return 520 - 72 * Math.sin(u * 5.1 + .4) - 38 * Math.sin(u * 13.7 + 1.2) - 16 * Math.sin(u * 31.3) + 60 * u + day;
}
/* The close at x as a price: the chart's height read on a fictional scale near the opening card's values. */
const priceLabel = x => (101.2 - (priceAt(x) - 552) * .004).toFixed(2);
function corrected(x) {
  const w = clamp((x - CORR[0]) / 40) * clamp((CORR[1] - x) / 40);
  return priceAt(x) - 34 * w * (.6 + .4 * Math.sin((x - CORR[0]) / 55));
}
const series = (fn, a = X0, b = X1, step = 6) => { const p = []; for (let x = a; x <= b; x += step) p.push([x, fn(x)]); return p; };
scenes["11"] = function (s, t) {
  // The series is the scene's object: one price history on a time axis, drawn taller than its values so it fills the
  // frame about the content centre, with its names above and below. Each stage cuts on the words that name its first mark.
  const SY = 1.6, AY = 800, yv = v => CONTENT_CY + (v - 552) * SY, py = x => yv(priceAt(x));
  // Sampled at every half day, so each day's close keeps its corner.
  const lift = (fn, a, b) => series(fn, a, b, DAY / 2).map(([x, v]) => [x, yv(v)]);
  const [ill, corr, decAt, eachAt, thenV, todayS] = cues(s, [["虚构", "illustrative"], ["修正了", "corrects"],
    ["修正之前的每次决策", "simulating decisions"], ["每次决策时拿得到的值", "each decision time"],
    ["拿得到的值", "values available at each decision"], ["今天修正过的数据", "today's corrected series"]]);
  const [unknownCut, afterCut, biasCut, missingCut, feedCut, agentCut, leadCut] = cues(s, [["不知道每个值", "without knowing when"],
    ["如果查明", "if a value became"], ["偏差", "bias"], ["缺失", "say how missing"],
    ["今天的数据", "today's accurate feed"], ["在委托范围内", "within its delegation"], ["任务负责人", "the task lead"]]);
  const admitCut = cue(s, "这就叫准入", "permission");
  // The illustrative chip stays while the same case continues, through the admission decision it ends on.
  illustrative(ramp(t, ill - .2, .6));
  // The history is recorded day by day from the first word: the series draws from its first close to today's, its
  // latest price riding its head, and it is whole before 11.1's words end, so nothing moves in the quiet that follows.
  // The history draws on from the first word within its short thought, at the tip pace: the thought leaves time for its
  // latest stretch only, so the earlier history stands with the chart and the latest days draw on, whole 0.1 s before
  // the thought's words end.
  const head = s.words[0].start, drawFor = Math.min(1, voiceTime(thoughtEnd(head) - .1) - voiceTime(head + .05));
  const latest = DRAW_PACE * drawFor / 1.5, history = lengthOf(lift(priceAt));
  const standing = clamp(1 - latest / history), draw = mix(standing, 1, drawShare(t, head + .05, (1 - standing) * history, drawFor));
  // The chart is the scene's object: the axis, the series as first published and the three decisions made before the
  // vendor's correction, each standing on the value it could see then. Every mark carries its name while it
  // stands: a name enters on its words and, once a later stage annotates the chart, keeps the second ink beside its
  // mark; a mark leaves only with its name, at a stage cut.
  const plot = (q, {level = SECOND, decisions = true, values = true} = {}) => {
    if (q <= 0) return;
    const nq = at => q * level * named(t, at);
    const seriesAt = cue(s, "历史价格", "historical prices") + .05;
    // The chart's two axes, the time axis with its ticks clear of the decisions' places; the series draws on them and
    // is named on its words.
    const points = lift(priceAt), top = Math.min(...points.map(([, y]) => y)) - 24;
    line(X0, AY, X0, top, {color: P.line, width: 2, alpha: q});
    line(X0, AY, X1, AY, {color: P.line, width: 2, alpha: q});
    for (let x = X0 + 50; x < X1; x += 100) if (DEC.every(d => Math.abs(d - x) > 30)) line(x, AY, x, AY + 10, {color: P.line, width: 2, alpha: q});
    path(points, {color: P.ink, width: 2.5, alpha: q, upto: draw});
    nameText(L("历史价格", "Historical prices"), X0 - NAME_GAP, py(X0), {align: "right", width: L(180, 300), alpha: q * level * ramp(t, seriesAt, .4)});
    if (decisions) {
      // The three decisions' lines are one stroke, each rising from the axis to the value it could see on its own beat,
      // so the decisions read as one set under their name rather than as separate members each waiting for a name.
      stroke(() => DEC.forEach((x, i) => {
        const up = drawShare(t, decAt - .1 + i * .25, AY + 2 - py(x));
        if (up > 0) { ctx.moveTo(x, AY + 14); ctx.lineTo(x, mix(AY + 14, py(x) + 12, up)); }
      }), {color: P.authority, width: 2, alpha: ramp(t, decAt - .1, .5) * q});
      DEC.forEach((x, i) => {
        const a = ramp(t, decAt - .1 + i * .25, .5) * q, p = clamp((t - eachAt - i * .3) / .7);
        dot(x, AY, 6, {color: P.authority, alpha: a});
        if (p > 0 && p < 1) ring(x, AY, 8 + 16 * p, {color: P.authority, alpha: a * (1 - p) * ease(p / .5), width: 2});
      });
      line(DEC[0], AY + 14, DEC[2], AY + 14, {color: P.authority, width: 2, alpha: q * ramp(t, decAt + .5, .5)});
      nameText(L("决策", "Decisions"), DEC[0] - 40, AY - 16, {align: "right", valign: "bottom", color: P.authority, alpha: nq(decAt)});
    }
    if (values) {
      // The values each decision could see are points of the stretch they stand on, 14 px across, details of the chart
      // under their name rather than separate members each waiting for a name.
      const thenQ = ramp(t, thenV - .1, .6);
      if (thenQ > 0) path(lift(priceAt, X0, DEC[2]), {color: P.evidence, width: 3.5, alpha: q * thenQ});
      DEC.forEach((x, i) => dot(x, py(x), 7, {color: P.evidence, alpha: q * ramp(t, thenV - .1 + i * .2, .35)}));
      nameText(L("每次决策时拿得到的值", "Values available at each decision time"), DEC[2] + 26, py(DEC[2]) - 30,
        {align: "left", valign: "bottom", width: 500, color: P.evidence, alpha: nq(thenV)});
    }
  };
  // Stages 1 to 3 tell the case on one chart: its names stand at full ink while the case is told, then at the second ink
  // once stage 2 annotates it. Stage 5 brings the series back alone, stage 6 the series with its decisions.
  // The chart eases 76 px right of its axis's place as the series is named in its left margin, so the chart and the
  // names in that margin stand about the centre; it eases back from the cut that brings today's feed in from the right
  // edge. The English series' name stands whole on one line, so its chart eases 110 px right on the words that name the
  // correction, reaching its place before the series is named, and stays there, today's feed coming in over a shorter way.
  const chartDx = en ? 110 * soon(t, corr + .05, .7) : 76 * soon(t, cue(s, "历史价格", "historical prices") + .05, .7) * (1 - soon(t, feedCut + STAGE_CUT, .7));
  ctx.save(); ctx.translate(chartDx, 0);
  plot(stageOut(t, biasCut), {level: mix(1, SECOND, ramp(t, unknownCut + STAGE_CUT, .4))});
  plot(stageIn(t, missingCut) * stageOut(t, feedCut), {decisions: false, values: false});
  plot(stageIn(t, feedCut) * stageOut(t, agentCut), {values: false});
  ctx.restore();
  // 1. The case: the vendor corrects a stretch of prices at a date after the decisions were made on them. The stretch
  // draws as the correction is said, under its name; the test needs the values each decision could see, not today's
  // corrected data, which is that stretch, refused above its own crest, and it leaves with its names at the next cut.
  const one = stageOut(t, unknownCut);
  if (one > 0) {
    ctx.save(); ctx.translate(chartDx, 0);
    // The case is named as it is introduced, above the chart it is told on: in English a line and 60 px above the
    // correction's name, so the two never read as one stepped two-line name; the Chinese names stand apart across, so
    // its case stands 34 px above that line and nearer the chart than the head.
    nameText(L("虚构的例子", "Illustrative case"), X0, L(216, 190), {align: "left", valign: "bottom", alpha: one * named(t, cue(s, "看一个虚构的例子", "here is an illustrative case"))});
    // Today's price stands at the head of the history once it has been recorded, at its latest close: it inks in as the
    // history comes to rest rather than racing along the head as the history draws on.
    const hx = mix(X0, X1, draw), today = one * ramp(t, head + .05 + drawFor - .15, .3);
    dot(hx, py(hx), 6, {color: P.ink, alpha: today});
    text(priceLabel(hx), hx + 16, py(hx), 26, {role: "mark", color: P.ink, alpha: today});
    path(lift(corrected, CORR[0] - 20, CORR[1] + 20), {color: P.ink, width: 2.5, alpha: one * mix(1, .45, ramp(t, todayS, .6)),
      draw: {t, at: corr}});
    // The stretch is named by the correction that made it, above its left part; the refusal stands above its crest. Both
    // stand on one baseline, clear of the highest close beneath either.
    const top = (a, b) => Math.min(...series(corrected, a, b, DAY / 2).map(([, v]) => yv(v)));
    const over = Math.min(top(470, 650), top(690, 1070)) - NAME_GAP;
    nameText(L("供应商修正", "Vendor corrects"), 560, over, {valign: "bottom", alpha: one * named(t, corr)});
    rejectedName(L("今天修正过的数据", "Corrected series"), 880, over,
      {valign: "bottom", alpha: one * named(t, todayS), mark: ramp(t, todayS + .4, .4)});
    ctx.restore();
  }
  // 2. When each value first became available is unknown: above each decision a "?" stands on the words that say it is
  // not known, and the claim that the test used only what was available then is refused under the axis. The snapshots of
  // that time replace the marks, the correction history stands at the correction date, and authorized exploration is
  // allowed beside the refused claim on the condition that the unproven timing is stated.
  const two = stageIn(t, unknownCut) * stageOut(t, afterCut);
  if (two > 0) {
    ctx.save(); ctx.translate(chartDx, 0);
    // The English snapshots stand 36 px lower, so the question over them stands inside the content band.
    const FY = L(140, 176), FW = 180, FH = 96;
    const [whenAt, claimAt, snapNameAt, snapAt, recordAt, limitAt, exploreAt] = cues(s, [["最早什么时候能拿到", "when each value first"],
      ["回测只用了", "used only what"], ["当时存下的快照", "earlier snapshots"], ["快照", "snapshots"], ["修正记录", "correction history"],
      ["讲明可用时间", "timing is unproven"], ["授权内的探索", "authorized exploration"]]);
    // The words that say when each value first became available draw an empty dashed slot at each snapshot's place, one
    // after another, so the picture answers the sentence as it goes on.
    const becameAt = cue(s, "最早什么时候能拿到", "first became");
    DEC.forEach((c, i) => {
      // The "?" stands above its decision, in its empty slot, until that snapshot is found; then the snapshot is drawn
      // there, as far as its decision: what was known then. The mark arrives with its slot and gives way in the snapshot's
      // first moment, fading as the drawing begins, and the slot gives way as the snapshot's frame inks in over it.
      const found = snapAt - .1 + i * .25, fill = ramp(t, found, .5) * two, slotAt = becameAt - .1 + i * .25;
      path([[c - FW / 2, FY], [c + FW / 2, FY], [c + FW / 2, FY + FH], [c - FW / 2, FY + FH], [c - FW / 2, FY]],
        {color: P.unknown, dash: [6, 6], width: 2, alpha: two * (1 - ramp(t, found, .5)), draw: {t, at: slotAt}});
      text("?", c, FY + FH / 2, 26, {role: "mark", align: "center", color: P.unknown, alpha: two * ramp(t, slotAt, .3) * (1 - ramp(t, found - .25, .25))});
      box(c - FW / 2, FY, FW, FH, {stroke: P.evidence, width: 2, alpha: fill, radius: 6});
      const mx = x => c - FW / 2 + 12 + (x - X0) / (X1 - X0) * (FW - 24), my = v => FY + FH / 2 + (v - 552) * .3;
      path(series(priceAt, X0, c).map(([x, v]) => [mx(x), my(v)]), {color: P.evidence, width: 2, alpha: two, draw: {t, at: found}});
      line(mx(c), FY + 10, mx(c), FY + FH - 10, {color: P.authority, width: 2, alpha: fill});
    });
    // The left margin's names share one left edge, the edge of the series' name, unless that would bring this one nearer
    // the first snapshot than the name gap; like the series' name, its lines end together, toward its mark. The English
    // question stands whole on one line, over the three snapshots it asks about.
    if (en) nameText("When each value first became available", DEC[1], FY - NAME_GAP, {valign: "bottom", alpha: two * named(t, whenAt)});
    else {
      const widest = lines => Math.max(...lines.map(v => measure(v))), when = wrapName("最早什么时候能拿到", 340);
      const margin = Math.min(X0 - NAME_GAP - widest(wrapName("历史价格", 180)), DEC[0] - FW / 2 - NAME_GAP - widest(when));
      nameText(when, margin + widest(when), FY + FH / 2, {align: "right", alpha: two * named(t, whenAt)});
    }
    nameText(L("当时存下的快照", "Earlier snapshots"), DEC[1], FY + FH + NAME_GAP, {valign: "top", color: P.evidence, alpha: two * named(t, snapNameAt)});
    const rec = ramp(t, recordAt - .15, .4) * two;
    documentIcon(CORR_DATE - 38, FY + 6, 76, FH - 12, {alpha: rec, rows: 3});
    nameText(L("修正记录", "Correction history"), CORR_DATE, FY + FH + NAME_GAP, {valign: "top", alpha: two * named(t, recordAt)});
    // The refused claim starts at the decisions' bracket, as its successor does. The exploration allowed beside it
    // follows on the same line one wide gap after its cross while the pair ends within the time axis; a pair too long
    // for that (the English) sets the exploration on the next row at the claim's edge, its check hung before it, 48 px
    // down, as far as the caption band's clearance allows, so neither runs past the axis.
    const low = AY + 14 + NAME_GAP;
    const refusal = rejectedName(L("回测只用了当时的信息", "Used only what was available then"), DEC[0], low,
      {align: "left", valign: "top", alpha: two * named(t, claimAt), mark: ramp(t, claimAt + .4, .4)});
    const term = [L("授权内的探索可以继续", "Authorized exploration may continue")], qual = [L("讲明可用时间还没证实", "timing is unproven")];
    const beside = refusal.right + 64 + 42, fits = beside + measure(term[0]) + TERM_GAP + measure(qual[0], NOTE) <= X1;
    const ex = fits ? beside : DEC[0], ey = fits ? low : low + 48;
    check(ex - 30, ey + labelSize(LABEL) / 2, 24, {alpha: ramp(t, exploreAt - .15, .4) * two, draw: {t, at: exploreAt - .1}});
    termRow(t, term, [exploreAt], qual, [limitAt], ex, ey, {width: X1 - ex, alpha: two});
    ctx.restore();
  }
  // 3. A repaired value became available only at the correction date, after the decisions: it stands on the repaired crest above
  // the last decision, and the way from it down to that decision stops at a bar, since the decision could never have used
  // it. Replaced by the value known then, or excluded, the test is rerun: a sweep runs the decisions again in order.
  const three = stageIn(t, afterCut) * stageOut(t, biasCut);
  if (three > 0) {
    ctx.save(); ctx.translate(chartDx, 0);
    const [lateAt, neverAt, replaceAt, rerunAt] = cues(s, [["决策之后", "became available only"],
      ["不可能用到它", "could never have used"], ["换掉", "replace or exclude"], ["再跑一遍", "rerun the test"]]);
    const vx = 900, top = yv(corrected(vx)), dx = DEC[2], low = AY + 14 + NAME_GAP;
    // The value arrives, named, on the words that name it; its date follows on the words that date it.
    const valueAt = cueFrom(s, "某个值", "a value", afterCut);
    const vq = ramp(t, valueAt - .15, .4) * three, gone = soon(t, replaceAt + .05, .5);
    // The repaired value: a hollow mark above the series where the repaired crest stood, dated at the correction on the
    // axis.
    ring(vx, top, 14, {color: P.unknown, alpha: vq * (1 - gone), width: 2.5});
    dot(vx, top, 6, {color: P.unknown, alpha: vq * (1 - gone)});
    nameText(L("某个值", "A value"), vx - 14 - NAME_GAP, top, {align: "right", alpha: three * named(t, valueAt) * (1 - gone)});
    const late = ramp(t, lateAt - .1, .4) * three;
    dashed(vx, top + 18, vx, AY - 6, {color: P.unknown, alpha: late * restMark(P.unknown, .6) * (1 - gone)});
    line(CORR_DATE, AY - 18, CORR_DATE, AY + 18, {color: P.unknown, width: 4, alpha: late});
    nameText(L("决策之后才拿得到", "Available only after the decision"), CORR_DATE, low, {valign: "top", width: 300, alpha: three * named(t, lateAt)});
    link(vx + 6, AY - 4, CORR_DATE - 8, AY - 4, {color: P.unknown, alpha: late * restMark(P.unknown, .8) * (1 - gone), upto: drawShare(t, lateAt - .05, Math.abs(CORR_DATE - 8 - (vx + 6)), .5), dash: [6, 8], end: false});
    // The way from the late value to the decision it would serve, refused halfway.
    const barY = top + 80;
    link(vx + 16, top, dx, barY, {route: "hv", color: P.unknown, alpha: ramp(t, neverAt - .05, .3) * three * (1 - gone), draw: {t, at: neverAt - .05}, end: false});
    line(dx - 18, barY, dx + 18, barY, {color: P.unknown, width: 4, alpha: ramp(t, neverAt + .45, .3) * three * (1 - gone)});
    // The refusal is named at the hook's corner, on the late value's line, so the value, the way and its refusal read as
    // one row.
    nameText(L("不可能用到它", "Could never have used it"), dx + NAME_GAP, top, {align: "left", alpha: three * named(t, neverAt) * (1 - gone)});
    // Replaced, the decision takes the value known then, lit on the original series.
    ring(dx, py(dx), 16, {color: P.evidence, alpha: three * ramp(t, replaceAt + .05, .4), width: 2.5});
    growName(t, en ? ["Replace or exclude", ", and rerun"] : ["换掉或剔除", "，再跑一遍"], [replaceAt, rerunAt], DEC[0], low,
      {width: 520, alpha: three});
    // The rerun runs the decisions again in voice time; each lights as the sweep passes it.
    const sweep = clamp((voiceTime(t) - voiceTime(rerunAt + .05)) / Math.max(1.1, (DEC[2] + 20 - X0) / GLIDE_PEAK)), sx = mix(X0, DEC[2] + 20, sweep);
    if (sweep > 0 && sweep < 1) line(sx, 250, sx, 700, {color: P.evidence, width: 3, alpha: three * clamp(sweep / .2) * clamp((1 - sweep) / .2)});
    DEC.forEach(x => { const p = clamp((sx - x) / 120); if (sweep > 0 && p > 0 && p < 1) ring(x, AY, 10 + 16 * p, {color: P.authority, alpha: three * (1 - p) * clamp(p / .5), width: 2}); });
    ctx.restore();
  }
  // 4. Bias hides in the population rather than the prices: the words that say bias hides elsewhere open on the lens
  // and those words. Each place then arrives with its rails on its own words, in the order spoken, gathered by one
  // bracket that grows down to each: a frame picks the sample, one security changes its ticker part-way, the trading
  // calendar lays out its days with one wrong, and only today's survivors are kept, the one that ended before today
  // dropped on "today" (on the bias of survivorship bias in Chinese). The four places are named in one column, each
  // beside its rails.
  const four = stageIn(t, biasCut) * stageOut(t, missingCut);
  if (four > 0) {
    const ats = cues(s, [["样本选择", "sample selection"], ["证券代码和公司", "changed tickers"], ["交易日历", "trading calendar"],
      ["幸存者偏差", "keeping only today's survivors"]]);
    // Rails, top to bottom in the order spoken: the two the sample picks, the security that changes its ticker, the
    // calendar, and the survivors' pair, the second of which ends before today. The four places stand at one pitch, so
    // their names form an even column; the ticker's identifiers hang under its rail, clear of the sample's frame. The
    // Chinese places' names are short, so its stage stands 50 px right: about the centre once the first place has joined
    // the lens and once all four are named, and the English 40 px, for its lens's name on one line. Until the second place
    // is named the stage stands further right, so the lens
    // with the first place stands about the centre (110 px in Chinese; 70 px in English, so its first place's name
    // stands centred and the second's, arriving just before the stage moves, stays inside the safe area), and it eases
    // to its place on the second place's words.
    const sx = L(50, 40), RX = 560 + sx, GX = 1220 + sx, NX = 1290 + sx, ROW = 125, R0 = 335, END = RX + 340;
    const SA = [R0 - 35, R0 + 35], TK = R0 + ROW, CAL = R0 + 2 * ROW, SV = [R0 + 3 * ROW - 35, R0 + 3 * ROW + 35];
    // The stage eases back from the second place's words until the third place rises, so it keeps moving between them.
    ctx.save(); ctx.translate(L(110, 70) * (1 - glide(t, ats[1] + .05, L(110, 70))), 0);
    // Each place rises just before its words, the first a little earlier, so the lens never stands alone for long; the
    // Chinese first place, after the lens's longer phrase, rises 0.5 s before its words, the English 0.45 s.
    const lens = four * named(t, biasCut), on = i => ramp(t, ats[i] - (i ? .25 : L(.5, .45)), .4) * four, lit = i => speaking(t, ats, i);
    // The whole set returns to full ink on the last item's words, inside its thought, so it stands complete before the
    // stage cuts; the item being spoken keeps its own light.
    const lastWhole = ramp(t, ats[3] + .05, .4), level = i => Math.max(listLevel(t, ats, i), lastWhole);
    // The ended security's line breaks into dashes over a third of a second from its drop, as 13.1's join does: each
    // 20 px of it opens a gap from its end, so the dashes keep their places and nothing changes in one frame.
    const dropAt = cueFrom(s, "偏差", "today's", ats[3]), dropped = ramp(t, dropAt + .05, .35);
    // The bracket gathers the places present: it opens on the sample's rails and grows down to each further place.
    const ends = [SA[1], TK, CAL + 4, SV[1]].map(y => y + 22);
    const bottom = ends.slice(1).reduce((y, end, i) => mix(y, end, ramp(t, ats[i + 1] - .25, .4)), ends[0]);
    path([[RX - 26, SA[0] - 22], [RX - 40, SA[0] - 22], [RX - 40, bottom], [RX - 26, bottom]], {color: P.line, alpha: on(0), width: 2});
    // The lens stands at 405, above the places' middle, so across this stage's two cuts its handle and the chart's axis,
    // which stands near it before and after, are never read as one mark jumping. The English name stands on one line, as
    // no break keeps its phrase and its block, so its lens stands 20 px further left and the name keeps 40 px from the
    // bracket. The Chinese name says the clause by its key words on one line, short of the whole clause its caption
    // shows, as the English does.
    const LY = 405, LX = RX - L(220, 240);
    ring(LX, LY, 44, {color: P.ink, alpha: lens, width: 4});
    line(LX + 31, LY + 31, LX + 62, LY + 62, {color: P.ink, alpha: lens, width: 6});
    nameText(L("偏差可能藏在别处", "Bias may hide elsewhere"), LX, LY + 62 + NAME_GAP, {valign: "top", width: L(280, 340), alpha: lens});
    // The sample: a frame picks two securities, and they take the ink.
    box(RX - 24, SA[0] - 34, GX - RX + 48, SA[1] - SA[0] + 68, {stroke: P.evidence, width: 2 + lit(0), alpha: on(0), radius: 12});
    SA.forEach(y => line(RX, y, GX, y, {color: P.ink, width: 3, alpha: on(0)}));
    // The changed ticker: one security's identifier changes part-way along its rail.
    line(RX, TK, RX + 310, TK, {color: P.ink, width: 3, alpha: on(1)}); line(RX + 330, TK, GX, TK, {color: P.ink, width: 3, alpha: on(1)});
    text("ID A1", RX + 155, TK + 30, 26, {role: "mark", align: "center", color: P.muted, alpha: on(1)});
    text("ID B7", RX + 555, TK + 30, 26, {role: "mark", align: "center", color: P.authority, alpha: on(1)});
    ring(RX + 320, TK, 10 + 4 * lit(1), {color: P.authority, alpha: on(1), width: 2.5});
    // The trading calendar lays out its days on its own words, one of them wrong. The days stand a little lighter than
    // the line colour, about 4.8:1 against the ground, since the scan of resting text reads their cells as glyphs.
    for (let k = 0; RX + k * 46 + 36 <= GX; k++) {
      const x = RX + k * 46;
      box(x, CAL - 24, 36, 48, {stroke: blend(P.line, P.muted, .3), width: 2, alpha: four * ramp(t, ats[2] - .1 + k * .02, .3), radius: 4});
      if (k === 10) { box(x, CAL - 24, 36, 48, {stroke: P.unknown, width: 2 + lit(2), alpha: on(2), radius: 4}); cross(x + 18, CAL, 22, {alpha: on(2), width: 3}); }
    }
    // Survivors: the security that lasts to today takes the ink; the one that ended before today stands to its end with
    // it and is dropped, dashed and crossed, on "today". While the survivors are said their cross lights by its stroke,
    // as the sample's frame and the calendar's wrong day light by theirs, so it keeps one size, unlike the lens's handle.
    line(RX, SV[0], GX, SV[0], {color: P.ink, width: 3, alpha: on(3)});
    line(RX, SV[1], END, SV[1], {color: P.line, width: 3.5, alpha: on(3), dash: dropped > 0 ? [20 - 10 * dropped, 10 * dropped] : null});
    line(END, SV[1] - 18, END, SV[1] + 18, {color: P.line, width: 4, alpha: on(3)});
    cross(END + 30, SV[1], 24, {alpha: four * ramp(t, dropAt - .1, .3), width: 3 + 1.5 * lit(3)});
    const names = en ? ["Sample selection", "Changed tickers or issuers", "The trading calendar", "Only today's survivors"]
      : ["样本选择", "证券代码和公司的变更", "交易日历", "幸存者偏差"];
    [(SA[0] + SA[1]) / 2, TK, CAL, (SV[0] + SV[1]) / 2].forEach((y, i) =>
      nameText(names[i], NX, y, {align: "left", width: 470, alpha: four * ramp(t, ats[i] - .15, .4) * level(i), set: "bias"}));
    ctx.restore();
  }
  // 5. The series returns with what is missing, late, conflicting and anomalous marked on it, each named under the axis
  // on its own word. The conclusion stands above the whole series, and each gap reaches up to it as the words say they
  // affect it.
  const five = stageIn(t, missingCut) * stageOut(t, feedCut);
  if (five > 0) {
    ctx.save(); ctx.translate(chartDx, 0);
    const ats = cues(s, [["缺失", "missing"], ["延迟", "late"], ["冲突", "conflicting"], ["异常", "anomalous"]]);
    const changesAt = cue(s, "影响结论", "affects the conclusion");
    const concAt = cueFrom(s, "结论", "conclusion", missingCut), xs = [925, 1140, 1360, 1570], BAR = 230, mark = i => ramp(t, ats[i] - .1, .4) * five;
    // Missing: the line breaks and a dashed trace holds its place.
    box(xs[0] - 34, py(xs[0]) - 60, 68, 120, {fill: P.ground, alpha: mark(0)});
    dashed(xs[0] - 34, py(xs[0] - 34), xs[0] + 34, py(xs[0] + 34), {color: P.unknown, alpha: mark(0)});
    // Late: the value comes with a clock, which sits on it, so the two are one mark on the series; conflicting: two
    // values stand at one time.
    dot(xs[1], py(xs[1]), 7, {color: P.unknown, alpha: mark(1)});
    clock(xs[1], py(xs[1]) - 34, 18, {hand: .32, color: P.unknown, alpha: mark(1)});
    dot(xs[2], py(xs[2]), 7, {color: P.unknown, alpha: mark(2)});
    dot(xs[2], py(xs[2]) - 56, 8, {color: P.unknown, alpha: mark(2), hollow: true, width: 2.5});
    dashed(xs[2], py(xs[2]) - 46, xs[2], py(xs[2]) - 10, {color: P.unknown, alpha: mark(2)});
    // Anomalous: one value leaps from the course of its neighbours.
    path([[xs[3] - 16, py(xs[3] - 16)], [xs[3], py(xs[3]) - 58], [xs[3] + 16, py(xs[3] + 16)]], {color: P.unknown, alpha: mark(3), width: 2.5});
    dot(xs[3], py(xs[3]) - 58, 7, {color: P.unknown, alpha: mark(3)});
    xs.forEach((x, i) => { if (speaking(t, ats, i) > 0) ring(x, py(x), 16, {color: P.unknown, alpha: five * speaking(t, ats, i) * restMark(P.unknown, .6), width: 2}); });
    railNames(en ? ["Missing", "Late", "Conflicting", "Anomalous"] : ["缺失", "延迟", "冲突", "异常"], xs, AY, {alpha: i => five * listIn(t, ats, i), set: "gaps"});
    // The conclusion spans the series. Its bar is a filled band 6 px deep, a mark of its own, never one more line like
    // the time axis below it.
    const claim = ramp(t, concAt - .15, .4) * five, a1 = X1;
    box(X0, BAR - 3, a1 - X0, 6, {fill: P.ink, alpha: claim, radius: 0});
    line(X0, BAR - 14, X0, BAR + 14, {color: P.ink, width: 3, alpha: claim});
    line(a1, BAR - 14, a1, BAR + 14, {color: P.ink, width: 3, alpha: claim});
    // The conclusion is named on its first mention.
    const concName = L("结论", "Conclusion"), concY = BAR - 30 - NAME_GAP - labelSize(LABEL);
    growName(t, [concName], [concAt], X0, concY, {alpha: five});
    // Each way rises from the top of its gap's mark: the late value's clock sits on its value.
    xs.forEach((x, i) => link(x, py(x) - [66, 56, 76, 76][i], x, BAR + 18, {alpha: five, draw: {t, at: changesAt - .05 + i * .15}}));
    ctx.restore();
  }
  // 6. Today's feed, however accurate, flows into the series' present end. The way from it back along the time axis to
  // the decisions stops at a bar before it reaches them, where when each value became available stays unknown. The feed
  // comes in from a fixed place at the frame's right edge while the chart eases back toward it.
  const six = stageIn(t, feedCut) * stageOut(t, agentCut);
  if (six > 0) {
    ctx.save(); ctx.translate(chartDx, 0);
    const proveAt = cue(s, "说明不了", "cannot prove");
    // The open questions' row stands 54 px under the axis, so the refusal's first line keeps clear of the axis's ticks.
    const whenAt = cueFrom(s, "当时能不能拿到", "available then", feedCut), fy = py(X1), WY = AY + 54, stop = 1222, FX = 1800 - chartDx;
    link(FX, fy, X1 + 14, fy, {color: P.evidence, width: 3, alpha: ramp(t, feedCut - .1, .5) * six, flowing: since(t, feedCut - .1)});
    nameText(L("今天的数据再准", "Today's accurate feed"), FX, fy - 28, {align: "right", valign: "bottom", width: 300,
      color: P.evidence, alpha: six * named(t, feedCut)});
    const back = ramp(t, proveAt - .05, .3) * six;
    link(L(1700, 1652), fy + 24, 1060, WY, {route: "vh", alpha: back, upto: .8, draw: {t, at: proveAt - .05}, end: false});
    line(stop, WY - 18, stop, WY + 18, {color: P.unknown, width: 4, alpha: ramp(t, proveAt + .75, .3) * six});
    // The refusal is named at the left end of the open questions it leaves, clear of the caption band, by its key words;
    // the English stands whole on one line under the way it stops, beyond the last decision's line.
    nameText(L("说明不了", "Cannot prove what was available then"), L(DEC[0] - 40, DEC[2] + 16), L(WY, WY + 44),
      {align: L("right", "left"), width: L(320, 640), alpha: six * named(t, proveAt)});
    DEC.forEach((x, i) => text("?", x, WY, 26, {role: "mark", align: "center", color: P.unknown, alpha: ramp(t, whenAt - .1 + i * .15, .4) * six}));
    ctx.restore();
  }
  // 7. The Agent works inside its delegation on a small copy of the series: it locates the snapshots, compares the
  // revisions and reruns the test, each named in one column as it is said and shown on the copy. Its way out toward
  // admission, which stands outside the frame, stops at a bar: whether the data may be used is not the Agent's to decide.
  const seven = stageIn(t, agentCut) * stageOut(t, admitCut);
  if (seven > 0) {
    const [no, refused] = cues(s, [["这份数据能不能用", "cannot grant admission"], ["它定不了", "cannot grant admission"]]);
    // The frame stands right of its place while the Agent's tasks are named, about the centre and over the series it
    // replaces at the cut (the Chinese frame is narrower, so it stands 100 px right, the English 200), and the stage eases
    // to 120 px left of its place on the words that ask about admission, so the frame alone and the frame with admission
    // beside it each stand centred. The Chinese ease runs on to the words that refuse admission, which follow a second
    // later, so the picture keeps moving between the two; the English ends within its thought.
    const alone = L(100, 200), shift = alone - (alone + 120) * glide(t, no + .05, alone + 120);
    ctx.save(); ctx.translate(shift, 0);
    // The English said "rerun the test" once already, in 11.6, so the third task is taken from this thought on.
    const ats = [...cues(s, [["找快照", "locate snapshots"], ["比对修正前后的值", "compare revisions"]]),
      cueFrom(s, "用当时的数据重跑", "rerun the test", agentCut)];
    // The copy of the chart keeps its names at the second ink, since the series and its decisions are not the subject
    // here; the revision appears only when the words compare it.
    const mx = x => 440 + (x - X0) * .48, my = v => 380 + (v - 552) * .75, mini = (fn, a, b) => series(fn, a, b).map(([x, v]) => [mx(x), my(v)]);
    // The Agent's column of tasks stands twice the name gap below the copy's decisions, so their name reads with the
    // bracket above it, and the frame holds the snapshots, the copy and the column with one padding on every side.
    const seriesName = wrapName(L("历史价格", "Historical prices"), L(150, 300)), names = en ? ["Locate snapshots", "Compare revisions", "Rerun the test"]
      : ["找快照", "比对修正前后的值", "用当时的数据重跑"];
    const ROWS = 508 + NAME_GAP + labelSize(LABEL) + 2 * NAME_GAP + labelSize(LABEL) / 2, STEP = 58, PAD = NAME_GAP;
    // The Agent stands so its name shares its last task's line.
    const AGY = ROWS + 2 * STEP - 34 - NAME_GAP - labelSize(LABEL) / 2;
    const inner = [mx(X0), 262 - 24, Math.max(mx(X1) + (en ? 0 : NAME_GAP + Math.max(...seriesName.map(v => measure(v)))),
      ...names.map(v => 640 + 10 + NAME_GAP + measure(v))), Math.max(AGY + 34 + NAME_GAP + labelSize(LABEL), ROWS + 2 * STEP + labelSize(LABEL) / 2)];
    // The snapshots' frames run along the frame's top, so the frame stands 5 px higher above them than the padding: they
    // keep about the clearance the column's last line keeps above the bottom (its words end above their line's foot).
    const F = {x: inner[0] - PAD, y: inner[1] - PAD - 5, w: inner[2] - inner[0] + 2 * PAD, h: inner[3] - inner[1] + 2 * PAD + 5}, place = seven;
    box(F.x, F.y, F.w, F.h, {stroke: P.evidence, alpha: place, radius: 16});
    nameText(L("委托范围", "Within its delegation"), F.x, F.y - NAME_GAP, {align: "left", valign: "bottom", color: P.evidence, alpha: seven * named(t, agentCut)});
    line(mx(X0), 500, mx(X1), 500, {color: P.line, width: 2, alpha: place});
    path(mini(priceAt), {color: P.ink, width: 2, alpha: place});
    // The series is named beyond its end in Chinese; the English name, whole on one line, ends under the axis's end, on
    // the decisions' line, so the frame keeps to the copy's width.
    if (en) nameText(seriesName, mx(X1), 508 + NAME_GAP, {align: "right", valign: "top", alpha: place * SECOND});
    else nameText(seriesName, mx(X1) + NAME_GAP, my(priceAt(X1)), {align: "left", alpha: place * SECOND});
    line(mx(DEC[0]), 508, mx(DEC[2]), 508, {color: P.authority, width: 2, alpha: place});
    nameText(L("决策", "Decisions"), mx(DEC[1]), 508 + NAME_GAP, {valign: "top", color: P.authority, alpha: place * SECOND});
    DEC.forEach((x, i) => {
      line(mx(x), 508, mx(x), my(priceAt(x)) + 8, {color: P.authority, width: 2, alpha: place});
      const sx = mx(x);
      box(sx - 34, 262 - 24, 68, 40, {stroke: P.evidence, width: 2, alpha: seven * ramp(t, ats[0] - .1 + i * .2, .25), radius: 4});
      path(series(priceAt, X0, x).map(([u, v]) => [sx - 28 + (u - X0) / (X1 - X0) * 56, 258 + (v - 552) * .12]), {color: P.evidence, width: 1.5,
        alpha: seven, draw: {t, at: ats[0] - .1 + i * .2}});
    });
    // Compare: the two versions of the corrected stretch light together; rerun: a sweep runs the decisions again.
    path(mini(corrected, CORR[0] - 20, CORR[1] + 20), {color: P.evidence, width: 3.5, alpha: seven, draw: {t, at: ats[1] - .05}});
    const sweep = clamp((voiceTime(t) - voiceTime(ats[2] + .05)) / 1.2), sx = mix(mx(X0), mx(X1), sweep);
    if (sweep > 0 && sweep < 1) line(sx, 300, sx, 494, {color: P.evidence, width: 3, alpha: seven * clamp(sweep / .2) * clamp((1 - sweep) / .2)});
    // The Agent and the column of its tasks below the copy.
    // The Agent arrives with its name on its own word.
    const agentAt = cueFrom(s, "智能体", "agent", agentCut);
    agent(520, AGY, {alpha: seven * named(t, agentAt), size: 1.1});
    nameText(L("智能体", "Agent"), 520, AGY + 34 + NAME_GAP, {valign: "top", color: P.evidence, alpha: seven * named(t, agentAt)});
    ats.forEach((at, i) => {
      const y = ROWS + i * STEP, lit = speaking(t, ats, i);
      dot(640, y, 6 + 2 * lit, {color: P.evidence, alpha: seven * ramp(t, at - .1, .25)});
      nameText(names[i], 640 + 10 + NAME_GAP, y, {align: "left", alpha: seven * listIn(t, ats, i), set: "agent tasks"});
    });
    // Admission stands outside the frame, drawn in the authority colour on the words that ask about it; the way to it
    // draws on, and stops at a bar, on the words that refuse it to the Agent. The Chinese asks whether the data may be
    // used and says the Agent cannot settle it, so admission is named there by that question and the refusal by those
    // words; the English says both in one phrase. The Chinese names admission, and refuses it, once the frame has eased
    // to its place, so its gate, bar and refusal stand at their place in the finished stage from the first, inside the
    // safe area, while the frame eases away from them; the English refuses it as it names it, so they ease with the frame
    // over the frame's whole glide, easing from rest to rest from 1630 to 1540 on screen, and stand inside the safe area
    // from their first frame.
    const share = (alone - shift) / (alone + 120), hold = en ? shift + 30 + 90 * smoother(share) : 120 + shift;
    const gx = 1660 - hold, gq = ramp(t, no - .15, .4) * seven, mid = F.y + F.h / 2;
    line(gx, mid - 150, gx, mid + 150, {color: P.authority, width: 5, alpha: gq});
    nameText(L("能不能用", "Admission"), gx, mid - 150 - NAME_GAP, {valign: "bottom", color: P.authority, alpha: seven * named(t, no)});
    // The way runs on just past the bar that stops it, whatever the frame's width.
    const wayFrom = F.x + F.w + 12, stopX = 1470 - hold;
    link(wayFrom, mid, gx - 24, mid, {color: P.unknown, alpha: ramp(t, refused - .15, .4) * seven, upto: (stopX + 11 - wayFrom) / (gx - 24 - wayFrom) * drawShare(t, refused - .05, stopX + 11 - wayFrom, .6), dash: [8, 8], end: false});
    // The bar and the refusal's cross come once the way has reached the bar, and within the refusal's thought, so they
    // stand still in the quiet after it.
    const barAt = Math.min(refused + .45, thoughtEnd(refused) - .35);
    line(stopX, mid - 30, stopX, mid + 30, {color: P.unknown, width: 4, alpha: ramp(t, barAt, .3) * seven});
    rejectedName(L("它定不了", "Grant admission"), stopX, mid + 30 + NAME_GAP, {valign: "top", alpha: seven * named(t, refused), mark: ramp(t, barAt, .3)});
    ctx.restore();
  }
  // 8. Admission is permission for one specific use under stated conditions: the data waits at a closed gate; under the
  // conditions checked at the gate it opens, and one way runs through it to one use, which stands as the gate opens.
  // The Chinese opens the thought by naming admission, the English names it a thought earlier and opens on "permission".
  // The Chinese names the use only at the thought's end, so the data waits near enough to the gate that the stage is
  // balanced before the use arrives.
  const eight = stageIn(t, admitCut) * stageOut(t, leadCut);
  if (eight > 0) {
    const [condAt, releaseAt, useAt] = cues(s, [["讲明的条件", "stated conditions"], ["放行", "under stated"], ["一项具体用途", "one specific use"]]);
    const gateAt = cueFrom(s, "准入", "permission", admitCut);
    // The English use is named just after the cut, so its stage stands 65 px left, centred once the use stands; the
    // Chinese stage stands 129 px right while the data waits at the gate, centred with it, and eases 174 px left on the
    // use's words.
    ctx.save(); ctx.translate(en ? -65 : 129 - 174 * glide(t, useAt + .05, 174), 0);
    // The way stands at 575, within 5 px of the middle of the gate's posts (330 to 810) and 75 px below the axis of the
    // copy in the Agent's frame it replaces, so at the cut the data's frame is not read as that copy jumping.
    const GX = 1000, RY = 575, DX = 500, UX = 1480, place = eight, open = soon(t, releaseAt + .05, .6), released = {t, at: releaseAt + .05};
    box(DX - 80, RY - 50, 160, 100, {stroke: P.ink, width: 2, alpha: place, radius: 6});
    path(series(priceAt, X0, X1, 12).map(([x, v]) => [DX - 64 + (x - X0) / (X1 - X0) * 128, RY + (v - 552) * .28]), {color: P.ink, width: 2, alpha: place});
    // The data at the gate is the same series and keeps its name at the second ink.
    nameText(L("历史价格", "Historical prices"), DX, RY + 50 + NAME_GAP, {valign: "top", width: 300, alpha: place * SECOND});
    // The gate: two posts and a bar between them that lifts as the gate opens.
    line(GX, 330, GX, RY - 60, {color: P.authority, width: 5, alpha: place});
    line(GX, RY + 60, GX, 810, {color: P.authority, width: 5, alpha: place});
    line(GX, mix(RY - 60, RY - 60, open), GX, mix(RY + 60, RY - 60, open), {color: P.authority, width: 5, alpha: place * (1 - open)});
    nameText(L("准入", "Admission"), GX, 330 - NAME_GAP, {valign: "bottom", color: P.authority, alpha: eight * (en ? 1 : named(t, gateAt))});
    // The stated conditions are checked at the gate before it opens.
    [0, 1, 2].forEach(i => check(GX + 40, 380 + i * 42, 22, {alpha: ramp(t, condAt - .1 + i * .15, .35) * eight, draw: {t, at: condAt - .1 + i * .15}}));
    nameText(L("讲明的条件", "Stated conditions"), GX + 40 + 11 + NAME_GAP, 422, {align: "left", alpha: eight * named(t, condAt)});
    // The way from the data stops at the closed gate, then runs through it to one use.
    link(DX + 92, RY, GX - 12, RY, {alpha: place, end: false});
    link(GX + 12, RY, UX - 92, RY, {color: P.evidence, width: 2.5, alpha: eight, draw: released, flowing: since(t, releaseAt + .65)});
    box(UX - 80, RY - 45, 160, 90, {stroke: P.evidence, width: 2.5, alpha: eight * ramp(t, releaseAt + .3, .5), radius: 6});
    // The data and the use are named on one line, under the taller of their two frames.
    nameText(L("一项具体用途", "One specific use"), UX, RY + 50 + NAME_GAP, {valign: "top", color: P.evidence, alpha: eight * named(t, useAt)});
    ctx.restore();
  }
  // 9. People decide. The task lead stands with the evidence, the snapshots found, and the open risks beside them; on the
  // words that hand them over one orthogonal way draws on from them to the frame of authority, and a point runs along
  // it. The frame stands with the decision owner, sized to the owner, and widens to hold the acceptor as they are
  // named; each figure arrives on its own words and is named under it.
  const nine = stageIn(t, leadCut);
  if (nine > 0) {
    const evAt = cueFrom(s, "证据", "evidence", leadCut), [riskAt, giveAt, ownerAt, accAt] = cues(s, [["还没解决的风险", "open risks"],
      ["交给", "to the decision owner"], ["决策负责人", "decision owner"], ["验收人", "acceptor"]]);
    const Y = 650, SZ = 1.8, LX = 550, OX = 1180, AX = 1460, under = Y + 15 * SZ * 1.55 + NAME_GAP;
    // The frame holds each figure and its name with one padding on every side: from the head's top to the name's last
    // line, and from the wider of the figure and its name.
    const PAD = 36, ownerName = L("决策负责人", "Decision owner"), accName = L("验收人", "Acceptor");
    const half = v => Math.max(15 * SZ * 1.55, ...wrapName(v, 240).map(line => measure(line)).map(w => w / 2));
    const FT = Y - 15 * SZ * 2.15 - PAD, FB = under + blockHeight(Math.max(wrapName(ownerName, 240).length, wrapName(accName, 240).length)) + PAD;
    // The frame widens to the acceptor at the tip pace, wide before the acceptor comes.
    const r0 = OX + half(ownerName) + PAD, r1 = AX + half(accName) + PAD;
    // The stage stands right of its place while the lead and the bundle stand alone, 198 px in Chinese and 193 in
    // English, so they stand centred; it eases left as the owner joins, to 65 and 46 px, so the owner's frame stands
    // centred with them; and it eases on to 61 px left of its place as the frame begins to widen for the acceptor, so it
    // stands centred once the acceptor joins, the glide done before the thought's last word ends.
    const [bundle, owned] = L([198, 65], [193, 46]);
    ctx.save(); ctx.translate(bundle - (bundle - owned) * glide(t, ownerAt - .1, bundle - owned) - (owned + 61) * glide(t, accAt - .1 - drawTime(r1 - r0, .4), owned + 61), 0);
    const right = mix(r0, r1, pacedTo(t, accAt - .1, r1 - r0, .4)), fq = nine * .8 * ramp(t, ownerAt - .15, .4);
    box(OX - half(ownerName) - PAD, FT, right - OX + half(ownerName) + PAD, FB - FT, {stroke: P.authority, alpha: fq, radius: 18});
    [[LX, leadCut, L("任务负责人", "Task lead")], [OX, ownerAt, ownerName], [AX, accAt, accName]].forEach(([x, at, v]) => {
      person(x, Y, {color: P.authority, size: SZ, alpha: nine * ramp(t, at - .15, .3)});
      nameText(v, x, under, {valign: "top", width: 240, alpha: nine * named(t, at)});
    });
    // The bundle: three snapshots side by side and an open-risk mark, above and beside the lead, named above itself.
    const bx = LX + 90, BYT = Y - 230, ev = ramp(t, evAt - .15, .4) * nine;
    [0, 1, 2].forEach(i => {
      const x = bx + i * 120, y = BYT + 14;
      box(x, y, 104, 64, {fill: P.ground, stroke: P.evidence, width: 2, alpha: ev, radius: 4});
      path(series(priceAt, X0, DEC[i]).map(([u, v]) => [x + 10 + (u - X0) / (X1 - X0) * 84, y + 32 + (v - 552) * .14]), {color: P.evidence, width: 1.5, alpha: ev});
    });
    diamond(bx + 372, BYT + 46, 12, {color: P.unknown, alpha: ramp(t, riskAt - .15, .4) * nine, solid: true});
    growName(t, en ? ["Evidence", " and open risks"] : ["证据", "和还没解决的风险"], [evAt, riskAt], bx, BYT - NAME_GAP, {valign: "bottom", alpha: nine});
    // The hand-over: the way from the bundle to the frame draws on as it is said, and one point runs along it.
    const go = soon(t, giveAt - .05, .8), wy = BYT + 46;
    link(bx + 396, wy, OX, FT - 10, {route: "hv", color: P.authority, alpha: nine, upto: go, width: 2.5, flowing: since(t, giveAt + .75)});
    ctx.restore();
  }
};

/* ---------------- 12 data: from a signal to controlled use ---------------- */
/* An arc of 12.1's ring drawn through its own points, so each condition's arc and each group's run is a mark of its own
 * extent: as a canvas arc it would report its whole circle, the place of every other arc of the ring, and one arc
 * lighting while the next arrives would read as one arc taking another's place. */
function s12Arc(cx, cy, r, a0, a1) {
  const n = Math.max(2, Math.ceil(Math.abs(a1 - a0) / .04));
  for (let k = 0; k <= n; k++) { const a = a0 + (a1 - a0) * k / n; (k ? ctx.lineTo : ctx.moveTo).call(ctx, cx + r * Math.cos(a), cy + r * Math.sin(a)); }
}
scenes["12"] = function (s, t) {
  const together = cue(s, "同时满足", "all hold");
  const conds = cues(s, [["含义", "meaning is explainable"], ["来源", "source traceable"], ["时间", "time identifiable"],
    ["过程能复现", "process is reproducible"], ["质量能核验", "quality verifiable"], ["运行看得见", "operation observable"],
    ["有负责人", "owner is identifiable"], ["用途有边界", "use bounded"]]);
  const [missing, ...labels] = cues(s, [["任何一条不满足", "if any condition is unmet"], ["探索", "exploratory"], ["临时", "temporary"], ["有限使用", "limited-use"], ["待核验", "awaiting verification"]]);
  const [path_, ...steps] = cues(s, [["从有希望的信号到受控使用", "from a signal to controlled use"], ["值不值得评估", "evaluation worthwhile"], ["数据是什么", "what is the data"],
    ["能不能复现", "key findings be reproduced"], ["能不能稳定运行", "run reliably"], ["能不能准入", "serve this use"], ["该不该继续", "support continuing"]]);
  const [signalNot, deployed, admission, adoption] = cues(s, [["有信号", "a signal is not"],
    ["已经部署", "deployed does not mean"], ["准入是事先放行", "admission permits"], ["采用", "adoption is"]]);
  const base = ramp(t, opening(s), .7);
  // The ring of the work system: eight arcs, one per condition, the first at the top and the rest clockwise.
  const arc = i => { const a0 = -Math.PI / 2 + i * Math.PI / 4 + .06, a1 = a0 + Math.PI / 4 - .12; return [a0, a1, (a0 + a1) / 2]; };
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
  if (one > 0) {
    const cy = CONTENT_CY, R = 230, [dataAt, enterAt, systemAt] = cues(s, [["数据要", "before data enters"],
      ["用在", "enters"], ["工作里", "lasting work system"]]);
    const names = en ? ["Meaning explainable", "Source traceable", "Time identifiable", "Process reproducible", "Quality verifiable",
      "Operation observable", "Owner identifiable", "Use bounded"] : ["含义", "来源", "时间", "过程能复现", "质量能核验", "运行看得见", "有负责人", "用途有边界"];
    // The stage is centred on its extent, from the data's table at the left to the end of the longest name beginning
    // right of the ring, so the shorter Chinese names do not leave it standing left of the centre. It stands 3 px right
    // of exact, which keeps the data's way, across the cut, out of the motion audit's jump band to the next table.
    const reach = Math.max(...names.map((v, i) => Math.cos(arc(i)[2]) > .3 ? Math.cos(arc(i)[2]) * (R + 18 + NAME_GAP) + measure(v) : 0));
    const shift = 963 - (380 - 90 + 1120 + reach) / 2, cx = 1120 + shift, dx = 380 + shift;
    // The English names its eight conditions three seconds after the data and its system stand, so until the first is
    // named the two stand 80 px right, about the centre without the names, and ease to their place on its words.
    ctx.save(); ctx.translate(en ? 80 * (1 - glide(t, conds[0] + .05, 80)) : 0, 0);
    ring(cx, cy, R, {color: P.line, alpha: one * named(t, systemAt), width: 3.5, start: Math.PI + .1, upto: 1 - .2 / (2 * Math.PI)});
    tableIcon(dx - 90, cy - 60, 180, 120, {alpha: one});
    // Chinese says the data and the system it enters in one phrase, which names the system from its first words, so with
    // the eight conditions and their three groups the stage carries twelve names; its table is the data it speaks of.
    // The table's name stands level with the ring's nearest name, the owner's, when that leaves at least the name gap
    // above the table, so the two read on one line.
    const level = Math.min(cy + Math.sin(arc(6)[2]) * (R + 18 + NAME_GAP), cy - 60 - NAME_GAP - labelSize(LABEL) / 2);
    if (en) nameText("Data", dx, level, {alpha: one * named(t, dataAt)});
    link(dx + 102, cy, cx - R - 30, cy, {alpha: one, draw: {t, at: enterAt + .05}});
    // The Chinese system name stands in two lines, so the two groups named above it on either side keep clear of its ends.
    nameText(L(["数据要长期", "用在工作里"], "Lasting work system"), cx, cy, {width: 2 * R - 80, color: P.evidence,
      alpha: one * named(t, L(dataAt, systemAt))});
    // The eight close around the system as one thin ring on "all hold" (in Chinese "同时满足"), drawn on as one stroke.
    ring(cx, cy, R + 18, {color: P.evidence, alpha: one * ramp(t, together + .05, .3), width: 2, draw: {t, at: together + .05}});
    if (!en) {
      // Each of the three groups then thickens the run of the ring over the conditions it gathers, its run fading in
      // over the thin ring on the words that open it, and is named inside it on those words. The three names stand
      // inside the ring 120° apart, each within the run it gathers, the upper two 30° above the centre line, so they
      // balance about the system's two-line name rather than crowding over it.
      const titles = ["说得清", "对得上", "管得住"], opens = cues(s, titles.map(v => [v, ""])), at = [-Math.PI / 6, Math.PI / 2, Math.PI * 7 / 6];
      const edge = [0, 3, 5, 8].map(i => -Math.PI / 2 + i * Math.PI / 4);
      titles.forEach((title, g) => {
        const am = at[g], lit = ramp(t, opens[g] - .1, .4);
        if (lit > 0) stroke(() => s12Arc(cx, cy, R + 18, edge[g], edge[g + 1]), {color: P.evidence, alpha: one * lit, width: 4});
        nameText(title, cx + Math.cos(am) * (R - 72), cy + Math.sin(am) * (R - 72), {color: P.evidence, alpha: one * named(t, opens[g]), set: "groups"});
      });
    }
    conds.forEach((at, i) => {
      const [a0, a1, am] = arc(i), q = ramp(t, at - .1, .4), lit = speaking(t, conds, i);
      stroke(() => s12Arc(cx, cy, R, a0, a1), {color: P.evidence, alpha: q * one, width: 10 + 4 * lit, cap: "butt"});
      radialName(names[i], cx, cy, R + 18, am, {width: 420, alpha: one * listIn(t, conds, i), set: "conditions"});
    });
    ctx.restore();
  }
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
  if (two > 0) {
    const dx = L(30, 0), cx = 670 + dx, cy = CONTENT_CY, R = 150, gone = 7, sx = 1050 + dx, mx = 1110 + dx;
    const [labelAt, permitAt] = cues(s, [["标成", "label the data"], ["和权限", "and permission"]]);
    const [denyAt, assetAt] = cues(s, [["不因此", "does not make"], ["完全合格的资产", "fully qualified asset"]]);
    const rows = en ? [["Exploratory"], ["Temporary"], ["Limited use"], ["Awaiting verification"]] : [["探索"], ["临时"], ["有限使用"], ["待核验"]];
    const quals = [[], [], en ? ["own evidence", " and permission"] : ["自己的证据", "和权限"], []];
    // The asset stands on the limited use's line beyond its block, at 12.4's spacing: its way, the bar that stops it,
    // its open ring and its name after the ring.
    const NX = mx + NAME_GAP + 8, blockW = r => Math.max(measure(rows[r].join("")), quals[r].length ? measure(quals[r].join(""), NOTE) : 0);
    const columnEnd = NX + Math.max(...rows.map((_, r) => blockW(r))), wx = NX + blockW(2) + 24, bx = wx + 80, rx = bx + 60;
    const assetName = L("完全合格的资产", "Fully qualified asset"), room = Math.max(0, (rx + 24 + NAME_GAP + measure(assetName) - columnEnd) / 2);
    // While only the first two labels stand, which are short, the stage stands right of its place by as much as centres
    // them, 40 px in Chinese and 60 in English, and eases to its place as the limited use, the widest, is named.
    const early = L(40, 60);
    ctx.save(); ctx.translate((960 - cx) - (960 - cx - early) * glide(t, labelAt + .05, 960 - cx - early) - early * glide(t, labels[2] - .1, early)
      - room * glide(t, denyAt + .05, room), 0);
    const limitedAt = cueFrom(s, "有限使用也要", "a limited use needs", labels[2]);
    tableIcon(cx - 75, cy - 50, 150, 100, {alpha: two});
    conds.forEach((_, i) => {
      const [a0, a1] = arc(i);
      stroke(() => ctx.arc(cx, cy, R, a0, a1), i === gone ? {color: P.unknown, alpha: two, width: 6, cap: "butt", dash: [8, 8]}
        : {color: P.evidence, alpha: two, width: 10, cap: "butt"});
    });
    const am = arc(gone)[2];
    text("?", cx + Math.cos(am) * (R + 34), cy + Math.sin(am) * (R + 34), 26, {role: "mark", align: "center", color: P.unknown, alpha: two});
    nameText(L("任何一条不满足", "If any condition is unmet"), cx, cy + R + 18 + NAME_GAP, {valign: "top", alpha: two});
    // The data's way out of the ring is the trunk of the labels' branches, drawn firm as it is said to be labelled.
    link(cx + R + 24, cy, sx, cy, {alpha: two, width: 3, draw: {t, at: labelAt + .05}, end: false});
    const width = 1780 - mx - NAME_GAP - 8, tops = stackTops(rows.map((term, r) => termRowLayout(term, quals[r], width, false).height), cy, 60);
    rows.forEach((term, r) => {
      const my = tops[r] + labelSize(LABEL) / 2, q = ramp(t, labels[r] - .15, .4) * two, again = ramp(t, limitedAt - .15, .3);
      const lit = r === 2 ? Math.max(speaking(t, labels, r), again) : speaking(t, labels, r) * (r === 3 ? 1 - again : 1);
      link(sx, cy, mx - 16, my, {route: "vh", alpha: two, draw: {t, at: labels[r] - .15}, end: false});
      dot(mx, my, 11, {color: P.unknown, alpha: q});
      if (lit > 0) ring(mx, my, 17, {color: P.unknown, alpha: lit * restMark(P.unknown, .6) * two, width: 2});
      // Limited use returns to full ink when it is spoken again with its qualifier.
      const level = r === 2 ? Math.max(listLevel(t, labels, r), again) : listLevel(t, labels, r);
      termRow(t, term, [labels[r]], quals[r], [limitedAt, permitAt], NX, tops[r], {width, inline: false, alpha: two * level, set: "labels"});
    });
    // The limited use does not reach the fully qualified asset: its way stops at the bar, and the asset stays open.
    const ly = tops[2] + labelSize(LABEL) / 2;
    link(wx, ly, bx - 12, ly, {alpha: two, draw: {t, at: denyAt + .05}, end: false});
    line(bx, ly - 36, bx, ly + 36, {color: P.unknown, alpha: ramp(t, denyAt + .45, .3) * two, width: 4});
    ring(rx, ly, 24, {color: P.muted, alpha: ramp(t, assetAt - .1, .4) * two, width: 2.5, dash: [6, 6]});
    nameText(assetName, rx + 24 + NAME_GAP, ly, {align: "left", color: P.muted, alpha: two * named(t, assetAt)});
    ctx.restore();
  }
  // 3. From a signal to controlled use, the questions that apply are answered for the intended use. The way from the
  // signal reaches a ring around the use, open where the way enters at its left and leaves at its right for controlled
  // use, so either arc may be walked first. The ring stands at the structure tier from the words that name the questions
  // that apply, so it never stands bare for long; each question takes its station on it in its colour as it is asked and
  // lights it, named by its key words, and the six build around the use. Under the use, inside the ring, both editions
  // name the questions that apply. The stage hands over in one cut on the first inequality. The Chinese calls the signal
  // promising.
  const [forUse, ctrlAt] = cues(s, [["针对计划中的用途", "the intended use"], ["受控使用", "controlled use"]]);
  const applyAt = cue(s, "适用的问题", "the questions that apply");
  const three = base * stageIn(t, path_) * stageOut(t, signalNot);
  if (three > 0) {
    // The Chinese signal's name is wide and its use's short, so its signal stands 140 px nearer the ring and the stage
    // stands about the centre; its way to the ring stays 72 px shorter than the way on to the use, so the two read as
    // the flow's two different legs rather than one repeated mark. The English signal stands 50 px further out and its
    // use 40 px, so its way to the ring stays 78 px longer than the way on, and each question stands whole on one line.
    const cx = 960, cy = CONTENT_CY, R = 210, sx = L(420, 230), ux = L(1560, 1600), gap = .05;
    const names = en ? ["Worth evaluating", "What the data is", "Key findings reproducible", "Runs reliably",
      "Permitted for this use", "Feedback supports continuing"] : ["值不值得评估", "数据是什么", "能不能复现", "能不能稳定运行",
      "能不能准入", "该不该继续"];
    path([[sx - 60, cy + 10], [sx - 30, cy - 4], [sx, cy + 6], [sx + 30, cy - 18], [sx + 60, cy - 30]], {color: P.authority, alpha: three, width: 3});
    // The flow's two ends are named on one line, under the taller of their marks, the use's frame; in English over them,
    // so the question at the ring's lower right keeps clear of the use's name.
    const endY = L(cy + 50 + NAME_GAP, cy - 50 - NAME_GAP), endAlign = L("top", "bottom");
    nameText(L("有希望的信号", "Signal"), sx, endY, {valign: endAlign, width: 300, color: P.authority, alpha: three * named(t, path_)});
    link(sx + 84, cy, cx - R - 2, cy, {alpha: three, draw: {t, at: path_ + .05}, flowing: since(t, path_ + .65)});
    box(ux - 60, cy - 50, 120, 100, {stroke: P.authority, alpha: three * ramp(t, ctrlAt - .15, .4), radius: 12});
    check(ux, cy, 34, {color: P.authority, alpha: three * ramp(t, ctrlAt - .1, .4)});
    nameText(L("受控使用", "Controlled use"), ux, endY, {valign: endAlign, color: P.authority, alpha: three * named(t, ctrlAt)});
    link(cx + R + 2, cy, ux - 72, cy, {alpha: three, draw: {t, at: ctrlAt + .05}});
    // The ring's two arcs are one stroke: one ring, open where the way passes. It stands at the structure tier as 09.3's
    // ring of questions does, firm enough to read, so the stage stands balanced on the whole ring while the questions on
    // its upper half are asked.
    stroke(() => { ctx.arc(cx, cy, R, gap, Math.PI - gap); ctx.moveTo(cx + R * Math.cos(Math.PI + gap), cy + R * Math.sin(Math.PI + gap));
      ctx.arc(cx, cy, R, Math.PI + gap, 2 * Math.PI - gap); }, {alpha: three * ramp(t, applyAt - .15, .4), width: 3.5});
    const use = ramp(t, forUse - .1, .4) * three;
    ring(cx, cy - 64, 22, {color: P.evidence, alpha: use, width: 2.5});
    dot(cx, cy - 64, 8, {color: P.evidence, alpha: use});
    nameText(L("针对计划中的用途", "The intended use"), cx, cy, {color: P.evidence, alpha: three * named(t, forUse)});
    nameText(L("适用的问题", "The questions that apply"), cx, cy + 60, {alpha: three * named(t, applyAt)});
    steps.forEach((at, i) => {
      const a = -Math.PI / 2 + i * Math.PI / 3, x = cx + Math.cos(a) * R, y = cy + Math.sin(a) * R, lit = speaking(t, steps, i);
      const q = ramp(t, at - .1, .4) * three;
      dot(x, y, 12, {color: P.ground, alpha: q});
      dot(x, y, 12, {color: P.evidence, alpha: q});
      if (lit > 0) ring(x, y, 21, {color: P.evidence, alpha: lit * restMark(P.evidence, .5) * three, width: 2});
      // The top and bottom names centre on their stations; a name at the side begins (or ends) a gap from its station and
      // its first line stands level with it, so mirrored names share a line whatever their length.
      const o = {width: 400, alpha: three * listIn(t, steps, i), set: "questions"}, side = Math.sign(Math.round(Math.cos(a) * 10));
      if (!side) radialName(names[i], cx, cy, R + 12, a, o);
      else nameText(names[i], x + side * (12 + NAME_GAP), y - labelSize(LABEL) / 2, {...o, align: side > 0 ? "left" : "right", valign: "top"});
    });
  }
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
  const rights = cues(s, [["能投产", "production ready"], ["准入了", "admitted"], ["别的用途", "for another use"]]);
  const lefts = [signalNot, deployed];
  const nots = [cueFrom(s, "还不能", "is not yet", signalNot), cueFrom(s, "不等于", "does not mean", deployed), cueFrom(s, "更不等于", "let alone", deployed)];
  const rowAts = [...lefts, nots[2]];
  const four = base * stageIn(t, signalNot) * stageOut(t, admission);
  if (four > 0) {
    // The English rows stand 20 px right, so their bars stand near the admission gate that replaces them at the cut. The
    // marks of what holds stand as far left of the bar as centres the rows with their names: the English names of what
    // does not follow are longer than those of what holds, so there the ways from what holds are longer.
    const dx = L(0, 20), rx = 1380 + dx, bar = 960 + dx, MR = 24, PITCH = 96, pairs = en ? [["A signal", "Production-ready"],
      ["Deployed", "Admitted"], [null, "For another use"]] : [["有信号", "能投产"], ["已经部署", "准入了"], [null, "别的用途"]];
    const widest = side => Math.max(...pairs.filter(v => v[side]).map(v => measure(v[side]))), lx = Math.min(540 + dx, 1920 - rx - widest(1) + widest(0));
    const grown = [1, 2].reduce((sum, k) => sum + soon(t, rowAts[k] - .3, .35), 0), ys = rowAts.map((_, i) => 510 + PITCH * (i - grown / 2));
    line(bar, 510 - PITCH - 36, bar, 510 + PITCH + 36, {color: P.line, alpha: ramp(t, nots[0] + .45, .3) * four, width: 4});
    rowAts.forEach((at, i) => {
      const y = ys[i], deny = {t, at: nots[i] + .05}, row = ramp(t, at - .1, .4) * four, barred = ramp(t, nots[i] + .45, .3);
      if (i < 2) {
        const lit = speaking(t, lefts, i);
        ring(lx, y, MR, {color: P.evidence, alpha: row, width: 2.5});
        dot(lx, y, 10, {color: P.evidence, alpha: row});
        if (lit > 0) ring(lx, y, MR + 10, {color: P.evidence, alpha: lit * restMark(P.evidence, .5) * four, width: 2});
        link(lx + MR + 12, y, bar - 12, y, {alpha: four, draw: deny, end: false});
        nameText(pairs[i][0], lx - MR - NAME_GAP, y, {align: "right", alpha: four * listIn(t, lefts, i), set: "holds"});
      } else link(lx, ys[1] + MR + 12, bar - 12, y, {route: "vh", alpha: four, draw: deny, end: false});
      line(bar, y - 36, bar, y + 36, {color: P.unknown, alpha: barred * four, width: 4});
      // What does not follow stands as an unreached outcome, in the dashed outline 17.3 gives one.
      ring(rx, y, MR, {color: P.muted, alpha: ramp(t, rights[i] - .1, .4) * four, width: 2.5, dash: [6, 6]});
      // A row is one item: what does not follow enters on its own words and takes its row's level.
      nameText(pairs[i][1], rx + MR + NAME_GAP, y, {align: "left", color: P.muted, alpha: four * named(t, rights[i]) * listLevel(t, rowAts, i), set: "follows"});
    });
  }
  // 5. Admission permits a specified use, like that backtest, before it begins; adoption is that use, actually observed
  // under the stated conditions. The admission gate stands at the centre, shut by its bar; a use comes to wait
  // before it on the words that let it through and is named on its own words, the backtest it stands for joining its
  // name on its words, and on "permits" the bar lifts into the gate and the use's way draws on through it. The
  // conditions close round the space beyond the gate as one frame, the gate as its left wall, and are named, on their own
  // words, in the adoption. On adoption, use moves along a lane inside the frame
  // and an observer above it watches, so the observed use is seen within the same conditions.
  const five = base * stageIn(t, admission);
  if (five > 0) {
    // The frame of conditions is as wide as the adoption's words need: they end where its lane ends, one inset inside its
    // right wall (at most at 1590), the inset the observer keeps under its top, so the frame holds its content evenly
    // whatever the words' length.
    const x0 = 880, y0 = 330, y1 = 670, ly = 500, ux = 600, ex = 1035, ey = 405, INSET = 48;
    // The Chinese adoption is qualified by the words that hold its condition, the use under the stated conditions.
    const adoptTerm = [L("采用", "Adoption")], adoptQual = [L("在讲明的条件下用上了它", "use actually observed")];
    const room = 1590 - INSET - ex - 64, inline = termRowLayout(adoptTerm, adoptQual, room).one, termW = measure(adoptTerm[0]), qualW = measure(adoptQual.join(""), NOTE);
    const x1 = ex + 64 + Math.min(room, inline ? termW + TERM_GAP + qualW : Math.max(termW, qualW)) + INSET;
    const [permits, useAt, exampleAt, condAt, observedAt] = cues(s, [["放行一项用途", "permits a specified use"], ["一项用途", "a specified use"],
      ["比如那次回测", "like that backtest"], ["讲明的条件", "stated conditions"], ["事后真看到", "actually observed"]]);
    // The stage builds from the use at its left: it stands right of its place while the use and the gate stand alone,
    // 190 px in Chinese and 203 in English, so they stand centred, and eases left on the words that bring what lies
    // beyond the gate, the adoption, so the stage stands centred once it is whole.
    const [lone, whole] = L([190, -50], [203, -30]);
    ctx.save(); ctx.translate(lone - (lone - whole) * glide(t, adoption + .05, lone - whole), 0);
    const open = soon(t, permits + .05, .45);
    path([[x0, y0], [x1, y0], [x1, y1], [x0, y1]], {color: P.line, alpha: five * ramp(t, condAt - .15, .4), width: 2});
    // The gate's two posts are one stroke, one gate.
    stroke(() => { ctx.moveTo(x0, y0); ctx.lineTo(x0, ly - 40); ctx.moveTo(x0, ly + 40); ctx.lineTo(x0, y1); }, {color: P.authority, alpha: five, width: 5});
    if (open < 1) line(x0, ly - 40, x0, mix(ly + 40, ly - 40, open), {color: P.authority, alpha: five * clamp((1 - open) / .15), width: 5});
    nameText(L("准入", "Admission"), x0, y0 - NAME_GAP, {valign: "bottom", color: P.authority, alpha: five * named(t, admission)});
    nameText(L("讲明的条件", "Stated conditions"), x1, y0 - NAME_GAP, {valign: "bottom", align: "right", color: P.muted, alpha: five * named(t, condAt)});
    token(ux, ly, {color: P.authority, alpha: five * ramp(t, permits - .15, .4), r: 12});
    // The use's name and the backtest it stands for, as one name under the use, each line centred on it.
    const use = [L("一项用途", "A specified use")], example = [L("比如那次回测", "like that backtest")];
    termRow(t, use, [useAt], example, [exampleAt], ux, ly + 19 + NAME_GAP, {inline: false, align: "center", color: P.authority, alpha: five});
    link(ux + 31, ly, x0 + 130, ly, {color: P.authority, alpha: five, draw: {t, at: permits + .05}});
    const adopted = ramp(t, adoption - .1, .4) * five;
    link(x0 + 144, ly, x1 - INSET, ly, {alpha: five, draw: {t, at: adoption + .05}, end: false});
    // One use moves along the lane inside the conditions: the single flow point of this stage.
    // English names the conditions last, so its use sets off once the frame of conditions it moves in is named.
    const q = loopPhase(since(t, en ? Math.max(adoption + .75, condAt + .35) : adoption + .75), x1 - INSET - 6 - x0 - 150);
    if (q !== null) flowDot(mix(x0 + 150, x1 - INSET - 6, q), ly, 8, q, {color: P.evidence, alpha: adopted});
    stroke(() => ctx.ellipse(ex, ey, 40, 22, 0, 0, Math.PI * 2), {color: P.ink, alpha: adopted, width: 2.5});
    dot(ex, ey, 9, {color: P.ink, alpha: adopted});
    line(ex, ey + 30, ex, ly - 14, {color: P.ink, alpha: five * ramp(t, observedAt + .05, .4), width: 2});
    // The adoption is named with what it is, as a term and its qualifier on one line inside the frame.
    // The qualifier joins on the words that say the use is observed, within its clause and ahead of its condition's words.
    termRow(t, adoptTerm, [adoption], adoptQual, [observedAt], ex + 64, ey - labelSize(LABEL) / 2,
      {width: room, alpha: five});
    ctx.restore();
  }
};

/* ---------------- 13 data: changing a shared identifier ---------------- */
/* A table drawn as one mark: its panel, its outline and its ruled rows and columns in one stroke, so its rules read as
 * the table's own lines rather than as separate members waiting for names. A table that shows its data holds a value
 * in each cell, ruled as one stroke as its lines are, so the values read, and count, as the table's content. */
function s13Table(x, y, w, h, {alpha = 1, stroke: s = P.ink, rows = 4, cols = 3, values = false} = {}) {
  if (alpha < .01) return;
  box(x, y, w, h, {fill: P.row, stroke: s, alpha, radius: 8});
  stroke(() => {
    for (let r = 1; r < rows; r++) { ctx.moveTo(x, y + h * r / rows); ctx.lineTo(x + w, y + h * r / rows); }
    for (let c = 1; c < cols; c++) { ctx.moveTo(x + w * c / cols, y); ctx.lineTo(x + w * c / cols, y + h); }
  }, {alpha, width: 1.5});
  if (values) stroke(() => {
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
      const vx = x + w * (c + .2) / cols, vy = y + h * (r + .5) / rows;
      ctx.moveTo(vx, vy); ctx.lineTo(vx + w / cols * ((r + c) % 2 ? .45 : .6), vy);
    }
  }, {color: P.muted, alpha: alpha * .8, width: 2});
}

scenes["13"] = function (s, t) {
  const [example, changeId, tests, join, wrong, decisions, schema] = cues(s, [["虚构的例子", "illustrative change"],
    ["换了一套公司代码", "changes its issuer identifier"], ["本地测试通过了", "local tests pass"], ["按旧代码关联财务数据", "joins on the old one"],
    ["关联错公司", "match the wrong entities"], ["几件不同的事", "several distinct decisions"], ["表结构选得再方便", "convenient schema"]]);
  // Both editions name each role just before saying what it does.
  const roles = cues(s, [["开发", "development checks"], ["技术", "technical owners check"], ["产品", "product owner identifies"],
    ["生产", "production owner plans"], ["治理", "governance confirms"]]);
  const [seats, coordinate, retire, migrated, ended, notice] = cues(s, [["这些是责任", "responsibilities not seats"],
    ["任务负责人", "task lead"], ["旧公司代码要停用", "retiring the old identifier"], ["都已迁移", "has migrated"], ["终止那项使用", "ended its use"], ["弃用通知", "deprecation notice"]]);
  // Each decision's owner is named on its own noun; the items it settles fill on their own words in stage 2.
  const owners = [cue(s, "有授权的领域负责人", "authorized domain owners"), cue(s, "数据模型负责人", "data-model owner")];
  // The decisions' stage cuts in on its thought's first words, which in Chinese lead to the decisions by a clause.
  const opensDecisions = cue(s, "这时要定", "this raises");
  const base = ramp(t, opening(s), .7);
  const p1 = ramp(t, Math.min(example - .3, opening(s) + .2), .7) * base * stageOut(t, opensDecisions);
  // The identifier change is marked as illustrative while it is worked through, to the old identifier's retirement.
  illustrative(ramp(t, example - .2, .6) * base);
  // 1. A pair on one row: the shared data on the right, the downstream factor calculation on the left, and the join
  // between them. The case is named over the pair as it is introduced, and the data it is told on arrives with its name
  // on the words that bring it in, near the centre. The data's issuer identifier flips over under it; local tests pass
  // on its corner; the join from the data still runs on the old identifier, turns doubtful, and what it may do builds
  // into a column under the calculation. Each state of the build stands centred: the case's name stands centred on the
  // frame, and the data, its check and their names stand centred under it until the calculation is named; on its words
  // the data moves right to its place across from the calculation and the case's name moves over the pair.
  if (p1 > 0) {
    // The data and the calculation are blocks of one height on one row, so their headings share a baseline. The finished
    // pair, out to the end of the tests' name beside the data, is centred in each edition. The data's table shows its
    // values and is wide enough that the data, with the case named over it, stands substantial while it is told alone.
    // The English names the tests by their words without "pass", which its caption says whole; the check beside the
    // name says they pass.
    const testsName = L("本地测试通过", "Local tests"), issuerName = L("一套公司代码", "Issuer identifier");
    const Y = 520, H = 220, W = 380, RW = 260, CH = H, reach = W + 26 + NAME_GAP + measure(testsName), rl = 960 - (720 + reach) / 2, top = Y - H / 2, ctop = Y - CH / 2, low = top + H + 50;
    const caseAt = cue(s, "一个虚构的例子", "an illustrative change"), dataAt = cueFrom(s, "一份共享数据", "a shared dataset", example);
    const idAt = cue(s, "一套公司代码", "issuer identifier"), factorAt = cue(s, "下游的因子计算", "factor calculation"), lost = cue(s, "漏掉一些", "lose matches");
    const outs = [wrong, lost];
    // Until the tests are said the data's group, from the identifier's name under it to its heading, stands centred under
    // the case's name; on the tests' words it eases left until the calculation arrives, so the group with the tests' name
    // is centred; on the calculation's first words it moves to the pair, over a second, so no name travels more than 40
    // px in a frame and the English calculation's name, which stands whole on one line, never meets the data's.
    const moveAt = en ? cue(s, "", "but a downstream") : factorAt;
    const lo = Math.min(0, (W - measure(issuerName)) / 2), told = soon(t, tests + .05, Math.max(.7, moveAt - .15 - (tests + .05)));
    const solo = 960 - (lo + Math.max(W, measure(L("共享数据", "Shared dataset")), W - lo)) / 2, alone = 960 - (lo + reach) / 2;
    const apart = glide(t, moveAt + .05, Math.abs(rl + 720 - alone)), dl = mix(mix(solo, alone, told), rl + 720, apart), dx = dl + W / 2;
    // The case's file stands from the first word and its name beside it on its words, centred on the frame and then
    // over the pair. The file's lines are ruled as one stroke, so the file reads, and counts, as one mark its name names.
    const caseName = L("一个虚构的例子", "An illustrative change"), hx = mix(960, rl + (720 + W) / 2, apart) - (48 + measure(caseName)) / 2, hy = top - 120;
    const file = ramp(t, s.voice_start - .3, .4) * p1, data = ramp(t, dataAt - .15, .4) * p1;
    s17Page(hx, hy - labelSize(LABEL) / 2 - 20, 32, 40, {alpha: file, rows: 3});
    nameText(caseName, hx + 48, hy, {align: "left", valign: "bottom", alpha: p1 * named(t, caseAt)});
    s13Table(dl, top, W, H, {alpha: data, values: true});
    nameText(L("共享数据", "Shared dataset"), dl, top - NAME_GAP, {align: "left", valign: "bottom", alpha: p1 * named(t, dataAt)});
    // Local tests pass: a check on the data's corner, named beside it.
    const ok = ramp(t, tests - .1, .4) * p1;
    dot(dl + W, top, 26, {color: P.ground, alpha: ok});
    ring(dl + W, top, 26, {color: P.evidence, alpha: ok, width: 2.5});
    check(dl + W, top + 2, 22, {alpha: ok});
    nameText(testsName, dl + W + 26 + NAME_GAP, top, {align: "left", color: P.evidence, alpha: p1 * named(t, tests)});
    // The issuer's identifier flips over under the data instead of cutting from one value to the other.
    const flip = clamp((t - changeId + .1) / .6), sx = Math.max(.04, Math.abs(Math.cos(Math.PI * flip))), swapped = flip >= .5;
    ctx.save(); ctx.translate(dx, low); ctx.scale(sx, 1); ctx.translate(-dx, -low);
    // Edge on, the old value fades out over the last frames of its half turn and the new one fades in over the first of
    // its own, so neither value leaves or arrives in one frame and the two never stand together.
    if (flip < .5) text("ID A1", dx, low, 26, {role: "mark", align: "center", color: P.ink, alpha: data * clamp((.5 - flip) / .5)});
    else text("ID X9", dx, low, 26, {role: "mark", align: "center", color: P.authority, alpha: data * clamp((flip - .5) / .5)});
    ctx.restore();
    nameText(issuerName, dx, low + 18 + NAME_GAP, {valign: "top", alpha: p1 * named(t, idAt)});
    // Downstream, across from the data, the factor calculation arrives when it is named: a factor series computed from
    // the shared data.
    const fq = ramp(t, factorAt - .15, .4) * p1;
    box(rl, ctop, RW, CH, {fill: P.row, stroke: P.ink, alpha: fq, radius: 12});
    path(series(x => Y + 24 + 34 * Math.sin((x - rl) / 38) * Math.exp(-(x - rl) / 360) - (x - rl) * .14, rl + 30, rl + RW - 30, 6),
      {color: P.evidence, alpha: fq, width: 2.5});
    nameText(L("下游的因子计算", "Downstream factor calculation"), rl, ctop - NAME_GAP, {align: "left", valign: "bottom", width: 420, alpha: p1 * named(t, factorAt)});
    // The join on the old identifier draws on from the data to the calculation, its key above it and its name below;
    // when the wrong matches are named it breaks into a dashed, doubtful way over a third of a second: each 16 px of it
    // opens a gap from its end, so the dashes keep their places and nothing changes in one frame.
    const j = {t, at: join - .1}, bad = ramp(t, wrong - .1, .4), jx0 = dl - 12, jx1 = rl + RW + 12, jm = (jx0 + jx1) / 2;
    const broken = ramp(t, wrong + .05, .35);
    if (t >= join - .1) link(jx0, Y, jx1, Y, {color: blend(P.ink, P.unknown, bad), alpha: p1, draw: j, width: 2.5,
      dash: broken > 0 ? [16 - 8 * broken, 8 * broken] : null});
    text("A1", jm, Y - 34, 26, {role: "mark", align: "center", color: blend(P.muted, P.unknown, bad), alpha: p1 * ramp(t, join - .1, .4)});
    nameText(L("按旧代码关联财务数据", "Joins on the old one"), jm, Y + NAME_GAP, {valign: "top", alpha: p1 * named(t, join)});
    // What the old join may do to the calculation: match the wrong companies or entities, or lose some; each row's mark
    // appears on its words, in a column under the calculation.
    outs.forEach((at, i) => {
      // The first outcome stands on the line of the identifier's name across the row, the second a row below.
      const y = low + 18 + NAME_GAP + labelSize(LABEL) / 2 + i * 70, q = ramp(t, at - .1, .4) * p1, lit = speaking(t, outs, i), mx = rl + 12;
      if (i === 0) dot(mx, y, 13, {color: P.unknown, alpha: q});
      else ring(mx, y, 11, {color: P.unknown, alpha: q, width: 3});
      if (lit > 0) ring(mx, y, 18, {color: P.unknown, alpha: lit * restMark(P.unknown, .5) * p1, width: 2});
      nameText([L("关联错公司", "Match the wrong entities"), L("漏掉一些", "Lose matches")][i], mx + 11 + NAME_GAP, y,
        {align: "left", alpha: p1 * listIn(t, outs, i), set: "outcomes"});
    });
  }
  // 2. Several distinct decisions: two open questions stand on one row under their name, for who decides is not yet
  // said, each a large question mark where its owner will stand. Each question gives way to its owner on the
  // owner's words, and what that owner settles builds into a column under the owner, each item on its own words. A
  // convenient schema then stands between the columns, and its way toward the meaning column stops at a bar: it cannot
  // resolve a conflict of meaning. The decisions' name and the way that parts them give way as the last thing the
  // data-model owner settles arrives, and what the schema cannot resolve is its qualifier, one name with it, so the
  // stage never shows more than twelve names; the schema stands high between the columns, so the stage stays centred
  // once the name has left.
  const p2 = stageIn(t, opensDecisions) * base * stageOut(t, roles[0]);
  if (p2 > 0) {
    // The two owners stand symmetric about the decisions' name, and each list hangs centred under its owner.
    const xs = [520, 1400];
    const ownerNames = [L("有授权的领域负责人", "Authorized domain owners"), L("数据模型负责人", "Data-model owner")];
    // The English fifth item, a clause, is authored as its lines, so the column keeps the width of its other names.
    const items = en ? [["Entities", "Relationships", "Rules", "Metric meanings"], ["Grain", "IDs and keys", "Constraints", "Time and version rules",
      ["How agreed meaning", "is represented"]]]
      : [["公司是谁", "有什么关系", "业务规则是什么", "指标什么含义"], ["数据的粒度", "用什么代码和键关联", "有哪些约束", "时间和版本按什么规则", "约定的含义怎么表示"]];
    const itemAts = (en ? [["entities", "relationships", "rules", "metric meanings"], ["grain", "IDs and keys", "constraints", "time and version",
      "how the agreed meaning"]] : items).map(list => list.map(w => cueFrom(s, w, w, decisions)));
    // The second list is the longer, so as its last item comes the stage glides 80 px up, and the whole stage, with the
    // schema under it, stands about the content centre.
    const Y = 480 - 80 * glide(t, itemAts[1].at(-1) - .3, 80);
    // The first owner's name and list stand while the second question still waits, and then both owners stand with
    // their lists; each owner reaches half the wider of its name and its list either side of it, and the question half
    // its mark. The stage stands right of the frame's centre by as much as balances those two pictures, so neither
    // leans far.
    const listW = k => 7 + 9 + NAME_GAP + 7 + Math.max(...items[k].flat().map(v => measure(v))), half = k => Math.max(measure(ownerNames[k]), listW(k)) / 2;
    const shift = 960 - (2 * (xs[0] - half(0)) + 2 * xs[1] + measure("?", 80, false, "mark") / 2 + half(1)) / 4;
    ctx.save(); ctx.translate(shift, 0);
    const heading = p2 * named(t, opensDecisions) * (1 - ramp(t, itemAts[1].at(-1) - .15, .3));
    nameText(L("几件不同的事", "Several distinct decisions"), 960, Y - 160, {alpha: heading});
    // The decisions part from their name toward the two places where their owners will stand.
    stroke(() => { ctx.moveTo(960, Y - 140); ctx.lineTo(960, Y - 124); ctx.moveTo(xs[0], Y - 106); ctx.lineTo(xs[0], Y - 124); ctx.lineTo(xs[1], Y - 124);
      ctx.lineTo(xs[1], Y - 106); }, {alpha: heading, width: 2});
    xs.forEach((x, k) => {
      const ats = itemAts[k], seen = ramp(t, owners[k] - .15, .4) * p2;
      // The open question: who decides is unknown until the owner is named, and it leaves just before the owner arrives.
      const open = p2 * named(t, opensDecisions) * (1 - ramp(t, owners[k] - .4, .25));
      text("?", x, Y - 6, 80, {role: "mark", align: "center", color: P.authority, alpha: open});
      person(x, Y, {alpha: seen, color: P.authority, size: 1.1});
      nameText(ownerNames[k], x, Y - 45 - NAME_GAP, {valign: "bottom", color: P.authority, alpha: p2 * named(t, owners[k])});
      const bx = x + 7 - (7 + 9 + NAME_GAP + 7 + Math.max(...items[k].flat().map(v => measure(v)))) / 2;
      ats.forEach((at, i) => {
        // An item of two lines hangs its first line on the list's pitch and grows downward, so its first line stands as
        // far from the item before it as every item does.
        const y = Y + 80 + i * 72, q = ramp(t, at - .15, .4) * p2, lit = speaking(t, ats, i), lines = Array.isArray(items[k][i]);
        dot(bx, y, 7 + 2 * lit, {color: P.authority, alpha: q});
        nameText(items[k][i], bx + 9 + NAME_GAP, lines ? y - labelSize(LABEL) / 2 : y, {align: "left", valign: lines ? "top" : "middle",
          alpha: p2 * listIn(t, ats, i), set: `settles${k}`});
      });
    });
    // The schema stands between the columns. Its way toward the meaning column draws on as it arrives and stops at a bar
    // before it reaches the column; the refusal is named under the schema, at full ink by the words that say it, as the
    // schema's qualifier: the two are one name, as a term and its qualifier are.
    const resolveAt = cue(s, "解决不了", "cannot resolve"), sc = ramp(t, schema - .15, .4) * p2, ty = Y + 150, way = 760;
    const stop = named(t, resolveAt - .2) * p2, barX = (960 - 80 - 12 + way) / 2;
    // The English schema is named without its article, so the schema and its refusal never repeat their caption line whole.
    const schemaName = L("表结构选得再方便", "Convenient schema"), refusal = L("解决不了含义上的分歧", "Cannot resolve a conflict of meaning");
    s13Table(880, ty, 160, 70, {alpha: sc, stroke: P.muted, rows: 3});
    growName(t, [schemaName], [schema], 960, ty - NAME_GAP, {valign: "bottom", align: "center", alpha: p2, whole: `${schemaName} ${refusal}`});
    link(880 - 12, ty + 35, way, ty + 35, {color: P.unknown, alpha: sc, upto: .5 * drawShare(t, schema + .1, .5 * Math.abs(way - (880 - 12)), .6), end: false, dash: [6, 6]});
    line(barX, ty + 5, barX, ty + 65, {color: P.unknown, alpha: stop, width: 4});
    // The English refusal stands whole on one line between the two columns, as no break keeps its phrase in an even block.
    growName(t, [refusal], [resolveAt - .2], 960, ty + 70 + NAME_GAP, {valign: "top", align: "center", width: 480, alpha: p2, whole: `${schemaName} ${refusal}`});
    ctx.restore();
  }
  // 3. The roles of the change are responsibilities: things a holder can carry. Each arrives on its words as a token in
  // the authority colour, named above it, and its mark plays what it does on those words: a join is checked, a part
  // slides into its socket, consumers are found and their ways to the new key drawn, a release steps up with its way back
  // planned, a seal is stamped beside an exit that opens; the joins Development checks stand under the row's centre,
  // joined to its token, while the roles are named. Both editions say what each of the five does, so every mark plays
  // on the words that say it. The five stand on one row left to right in the order named, and the row reflows toward
  // its centre as they arrive, so it stays balanced as it builds. On "not seats" an empty seat stands dashed under each
  // and is refused; the seats give way as the task lead comes, who stands under the row's centre and coordinates the
  // five along one way up to a bracket under the row, and deciding for the others is refused under its name.
  const p3 = stageIn(t, roles[0]) * base * stageOut(t, retire);
  if (p3 > 0) {
    const names = en ? ["Development", "Technical owners", "Product owner", "Production", "Governance"] : ["开发方", "技术方", "产品负责人", "生产方", "治理方"];
    const acts = [["核对关联", "checks the joins"], ["检查兼容性", "check compatibility"], ["找出", "identifies"], ["规划发布", "plans release"],
      ["确认", "confirms permission"]].map(([a, b], i) => cueFrom(s, a, b, roles[i]));
    const [pathsAt, recoverAt, exitAt] = [cueFrom(s, "安排迁移", "their migration", roles[2]), cueFrom(s, "恢复", "recovery", roles[3]),
      cueFrom(s, "停用条件", "exit conditions", roles[4])];
    const notSeats = cueFrom(s, "不是岗位", "not seats", seats);
    const [coordAt, takeAt] = [cueFrom(s, "统筹", "coordinates", coordinate), cueFrom(s, "替各方做决定", "taking over", coordinate)];
    // Where each token stands, left to right in the order the roles are named.
    // The Chinese row stands as wide as the duties under its tokens need, so the product owner's duty stands whole on
    // one line, 40 px or more from its neighbours. Once the duties have given way, as the roles are said to be
    // responsibilities, it closes up to 220 px, a glide, so the row the task lead coordinates stands compact; its short
    // names keep wide gaps at that pitch. Both rows stand at one pitch about the centre, and the lead under it.
    const closeUp = en ? 0 : glide(t, seats + .05, 2 * 70), PITCH = mix(L(290, 275), 220, closeUp);
    const TR = 50, Y = 440, FY = 680, trayY = Y + TR + 12, LX = 960;
    // The row stands toward its open end while it builds, two steps until the fourth role and one until the fifth, so
    // each partial row stands balanced with the joins under the centre while Development's way down to them stays
    // 50 px clear of their left end (at 740).
    // The Chinese duties end in the longest, under the last role, so the whole row with them stands 40 px further left,
    // a glide with the last role, and glides back as the duties give way and the row closes up.
    // The Chinese third duty is wide too, so the row stands 62 px further left from the third role to the fourth.
    const lean = en ? 0 : -40 * (glide(t, roles[4] - .45, 40) - glide(t, seats + .05, 40)) - 62 * (glide(t, roles[2] - .45, 62) - glide(t, roles[3] - .45, 62));
    const shift = building(t, roles.slice(2), L(145, 140), .45), xs = [-2, -1, 0, 1, 2].map(k => 960 + k * PITCH + shift + lean);
    const these = ramp(t, seats + .05, .3) * (1 - ramp(t, notSeats + .05, .3));
    // The joins Development checks stand under the row's centre while the roles are named, reached by one way down and
    // across from Development's token: the shared data and the calculation joined, checked on the words that say so.
    // Standing 70 px right of the centre, they balance the row's first members, which stand at its left. The Chinese
    // names them under their way on the words that say Development checks them. They give way, with that name, as the
    // roles are said to be responsibilities.
    const joins = ramp(t, roles[0] + STAGE_CUT, .4) * (1 - ramp(t, seats + .05, .3)) * p3, JY = 640, jx = 1030;
    stroke(() => { ctx.moveTo(xs[0], Y + TR + 12); ctx.lineTo(xs[0], JY); ctx.lineTo(jx - 220, JY); ctx.moveTo(jx - 160, JY); ctx.lineTo(jx + 160, JY); },
      {color: P.ink, alpha: joins, width: 2.5});
    fill(() => [jx - 190, jx + 190].forEach(x => ctx.roundRect(x - 30, JY - 20, 60, 40, 6)), {color: P.row, alpha: joins});
    stroke(() => [jx - 190, jx + 190].forEach(x => ctx.roundRect(x - 30, JY - 20, 60, 40, 6)), {color: P.ink, alpha: joins, width: 2.5});
    check(jx, JY - 2, 24, {alpha: joins, draw: {t, at: acts[0] + .05}});
    if (!en) nameText("核对关联", jx, JY + NAME_GAP, {valign: "top", alpha: p3 * named(t, acts[0]) * (1 - ramp(t, seats + .05, .3))});
    // Five seats, one under each token, stand dashed as "not seats" begins, are refused on its words, and give way when
    // the task lead comes.
    const seatQ = p3 * ramp(t, notSeats - .22, .4) * (1 - ramp(t, coordinate + .05, .4)), seatY = Y + TR + 12 + 12 * 2.15;
    stroke(() => xs.forEach(x => { ctx.moveTo(x + 12, seatY - 12 * 1.15); ctx.arc(x, seatY - 12 * 1.15, 12, 0, Math.PI * 2); }), {color: P.muted, alpha: seatQ, width: 2, dash: [4, 4]});
    stroke(() => xs.forEach(x => { ctx.moveTo(x + 18.6 * Math.cos(Math.PI * 1.08), seatY + 12 * 1.9 + 18.6 * Math.sin(Math.PI * 1.08));
      ctx.arc(x, seatY + 12 * 1.9, 18.6, Math.PI * 1.08, Math.PI * 1.92); }), {color: P.muted, alpha: seatQ, width: 2.5, dash: [4, 4]});
    rejectedName(L("岗位", "Seats"), 960, seatY + 60, {alpha: p3 * named(t, notSeats - .12) * (1 - ramp(t, coordinate + .05, .4)), mark: ramp(t, notSeats + .35, .3)});
    // Each token's mark plays its responsibility on the words that say it, drawn at the token's scale with its own strokes.
    // Each token rises a little earlier than its name, so the row is never left with one token for long.
    const icon = (i, x, y, q) => {
      const go = soon(t, acts[i] + .05, .6), u = v => v * TR / 34;
      if (i === 0) {
        dot(x - u(13), y - u(8), u(4.5), {color: P.ink, alpha: q}); dot(x + u(13), y - u(8), u(4.5), {color: P.ink, alpha: q});
        line(x - u(8), y - u(8), x + u(8), y - u(8), {color: P.ink, alpha: q, width: 3});
        check(x, y + u(7), u(15), {color: P.evidence, alpha: q, upto: go, width: 3.5});
      } else if (i === 1) {
        path([[x + u(1), y - u(11)], [x + u(15), y - u(11)], [x + u(15), y + u(11)], [x + u(1), y + u(11)]], {color: P.ink, alpha: q, width: 3});
        box(mix(x - u(22), x + u(1), go), y - u(6), u(12), u(12), {fill: P.evidence, alpha: q, radius: 3});
      } else if (i === 2) {
        [-11, 0, 11].forEach((d, k) => {
          dot(x - u(13), y + u(d), u(4), {color: blend(P.muted, P.evidence, ramp(t, acts[2] + .05 + k * .12, .25)), alpha: q});
          link(x - u(7), y + u(d), x + u(12), y, {route: "hvh", mid: x + u(3), r: 5, color: P.evidence, alpha: q, draw: {t, at: pathsAt + .05 + k * .1},
            end: false, width: 2.5});
        });
        dot(x + u(15), y, u(4), {color: P.evidence, alpha: q * ramp(t, pathsAt + .35, .3)});
      } else if (i === 3) {
        path(along([[x - u(17), y + u(6)], [x - u(3), y + u(6)], [x - u(3), y - u(9)], [x + u(17), y - u(9)]], go).kept, {color: P.ink, alpha: q, width: 3});
        link(x + u(17), y - u(4), x - u(17), y + u(15), {route: "vh", r: 5, color: P.muted, alpha: q, upto: drawShare(t, recoverAt + .05, Math.abs(x - u(17) - (x + u(17))) + Math.abs(y + u(15) - (y - u(4))), .5), end: false, dash: [4, 5]});
      } else {
        ring(x - u(8), y, u(9), {color: P.authority, alpha: q, width: 2.5});
        check(x - u(8), y + u(1), u(10), {color: P.authority, alpha: q, upto: go, width: 3});
        box(x + u(6), y - u(11), u(12), u(22), {stroke: P.ink, alpha: q, radius: 2, width: 2.5});
        box(x + u(6), y - u(11), u(mix(12, 4, soon(t, exitAt + .05, .35))), u(22), {fill: P.ink, alpha: q * .8, radius: 2});
      }
    };
    names.forEach((v, i) => {
      const x = xs[i], q = ramp(t, roles[i] - .45, .4) * p3, lit = Math.max(speaking(t, roles, i), these);
      dot(x, Y, TR, {color: P.row, alpha: q});
      ring(x, Y, TR, {color: P.authority, alpha: q, width: 2.5});
      if (lit > 0) ring(x, Y, TR + 9, {color: P.authority, alpha: lit * restMark(P.authority, .5) * q, width: 2});
      icon(i, x, Y, q);
      nameText(v, x, Y - TR - NAME_GAP, {valign: "bottom", alpha: p3 * listIn(t, roles, i), set: "roles"});
    });
    // The Chinese names each further duty under its role on the words that say it, whole on one line, its second part
    // joining on its own words, so every holder is read by what it does. The duties stand on two baselines at the row's
    // one pitch, every other one a row lower on a short stem from its role, so each stands whole and clear of its
    // neighbours; they give way with 核对关联 as the roles are said to be responsibilities.
    if (!en) {
      const duties = [[["检查兼容性"], [acts[1]]], [["找出下游使用方、安排迁移"], [acts[2]]],
        [["规划发布", "和恢复"], [acts[3], recoverAt]], [["确认使用权限", "和停用条件"], [acts[4], exitAt]]];
      const em = labelSize(LABEL), top = Y + TR + 9 + NAME_GAP, kept = p3 * (1 - ramp(t, seats + .05, .3));
      duties.forEach(([parts, ats], k) => {
        const low = k % 2 ? em * LEADING : 0;
        if (low) line(xs[k + 1], Y + TR + 12, xs[k + 1], top + low - 6, {alpha: kept * ramp(t, ats[0] - .15, .4), width: 2});
        growName(t, parts, ats, xs[k + 1], top + low, {align: "center", alpha: kept, set: "duties", build: true});
      });
    }
    // The task lead under the row: one way rises from it to a bracket under the five, which grows from its middle as the
    // way arrives, and it coordinates them along it; it decides for no one.
    const lead = named(t, coordinate) * p3, wayUp = FY - 44 - (trayY + 2), flowing = since(t, coordAt + .65);
    person(LX, FY, {size: 1.3, color: P.evidence, alpha: lead});
    nameText(L("任务负责人", "Task lead"), LX, FY + 30 + NAME_GAP, {valign: "top", color: P.evidence, alpha: lead});
    link(LX, FY - 44, LX, trayY + 2, {color: P.evidence, alpha: lead, draw: {t, at: coordAt + .05}, flowing, end: false});
    const spread = {t, at: coordAt + .05 + drawTime(wayUp)}, l = xs[0] - TR - 12, r = xs[4] + TR + 12;
    [l, r].forEach(x => path([[LX, trayY], [x, trayY], [x, trayY - 10]], {color: P.evidence, alpha: lead, width: 2.5, draw: spread}));
    // The refusal is spoken with its phrase ("without taking over"), so the cross arrives with the words. Its words stand
    // centred on the lead's axis, under the lead's name, and the cross hangs after them.
    const takeName = L("替各方做决定", "Taking over authority");
    rejectedName(takeName, LX, FY + 30 + NAME_GAP + labelSize(LABEL) + 14,
      {valign: "top", alpha: p3 * named(t, takeAt), mark: named(t, takeAt), markLeft: LX + measure(takeName) / 2 + 16});
  }
  // 4. Retiring the old identifier: a tree from the identifier to its affected consumers, which stands with them on the
  // words that ask to show every affected consumer. Three consumers have migrated, under one bracket; the decision owner
  // has ended the fourth's use: the owner is named beside it on the owner's words, and its stop, in the owner's colour,
  // stands on the words that end it. A deprecation notice stands under the identifier, and its way up to the identifier
  // stops at a bar. The identifier's old value, A1, stands under its card as the value stood under the data in stage 1,
  // and the two hold the frame alone while the English names the retirement before the consumers. The identifier and
  // the column of consumers are composed about the centre: the card stands centred while it is alone, and on the words
  // that show the consumers the stage moves left, its tree growing to the right, to where it ends centred.
  const p4 = stageIn(t, retire) * base;
  if (p4 > 0) {
    const [showAt, affected, owner, notProof] = [cueFrom(s, "先证明每个", "show that every", retire), cueFrom(s, "每个受影响的使用方", "every affected consumer", retire),
      cueFrom(s, "决策负责人", "the decision owner", retire), cueFrom(s, "证明不了", "does not prove migration", retire)];
    // The identifier's card and the consumers' column share a top, so their headings share a baseline; the tree runs
    // from the card's middle.
    const CY = 480, ys = stackTops([0, 1, 2, 3].map(() => 52), CY, 40).map(v => v + 26), tree = ramp(t, showAt - .1, .5) * p4;
    // The stage spans from the card's left edge to its farthest name: the consumers' heading, a name beside the
    // consumers or the notice's row under the card, each measured in its edition.
    const consumers = L("每个受影响的使用方", "Every affected consumer"), noticeTerm = [L("弃用通知", "A deprecation notice")], noticeQual = [L("证明不了迁移", "does not prove migration")];
    const RW = 260, wide = Math.max(380 + measure(consumers), 584 + Math.max(measure(L("都已迁移", "Migrated")), measure(L("决策负责人", "The decision owner"))),
      112 + measure(noticeTerm[0]) + TERM_GAP + measure(noticeQual[0], NOTE));
    const RX = mix(960 - RW / 2, 960 - wide / 2, glide(t, showAt + .05, (wide - RW) / 2)), RH = 100, RY = ys[0] - 26 + RH, CX = RX + 420, SX = RX + 530, NX = SX + 54;
    box(RX, RY - RH, RW, RH * 2, {fill: P.row, stroke: P.ink, alpha: p4, radius: 12});
    [-50, 0, 50].forEach(dy => line(RX + RW / 2 - 30, RY + dy, RX + RW / 2 + 30, RY + dy, {color: P.muted, alpha: p4, width: 3}));
    nameText(L("旧公司代码", "Old identifier"), RX, RY - RH - NAME_GAP, {align: "left", valign: "bottom", alpha: p4 * named(t, retire)});
    text("ID A1", RX + RW / 2, RY + RH + 34, 26, {role: "mark", align: "center", color: P.muted, alpha: p4});
    // The consumers depend on the identifier: its links to them stand at the structure tier as the consumers arrive. The
    // four consumers are one column, drawn as one set of frames with their series.
    const seen = ramp(t, showAt - .15, .4) * p4;
    fill(() => ys.forEach(y => ctx.roundRect(CX - 40, y - 26, 80, 52, 8)), {color: P.row, alpha: seen});
    stroke(() => ys.forEach(y => ctx.roundRect(CX - 40, y - 26, 80, 52, 8)), {color: P.ink, alpha: seen, width: 2});
    stroke(() => ys.forEach((y, k) => series(x => y + 8 - 10 * Math.sin((x - CX) / 9 + k), CX - 26, CX + 26, 4)
      .forEach(([x, v], i) => i ? ctx.lineTo(x, v) : ctx.moveTo(x, v))), {color: P.evidence, alpha: seen, width: 2});
    ys.forEach(y => link(RX + RW + 12, RY, CX - 52, y, {route: "hvh", mid: RX + RW + 80, r: 12, alpha: tree}));
    const moved = ramp(t, migrated - .1, .4) * p4, ended2 = ramp(t, ended - .1, .4) * p4;
    [0, 1, 2].forEach(k => check(SX, ys[k] + 2, 26, {alpha: moved}));
    stopSign(SX, ys[3], 18, {alpha: ended2, color: P.authority});
    path([[SX + 26, ys[0]], [SX + 36, ys[0]], [SX + 36, ys[2]], [SX + 26, ys[2]]], {color: P.evidence, alpha: moved * .8, width: 2});
    nameText(consumers, CX - 40, ys[0] - 26 - NAME_GAP, {align: "left", valign: "bottom", alpha: p4 * named(t, affected)});
    nameText(L("都已迁移", "Migrated"), NX, ys[1], {align: "left", color: P.evidence, alpha: p4 * named(t, migrated)});
    nameText(L("决策负责人", "The decision owner"), NX, ys[3], {align: "left", color: P.authority, alpha: p4 * named(t, owner)});
    // The notice under the identifier: its way up stops at a bar halfway, on the words that deny it.
    const nt = ramp(t, notice - .15, .4) * p4, nx = RX + 45, ny = RY + RH + 120, wayTop = RY + RH + 12;
    documentIcon(nx - 45, ny, 90, 116, {alpha: nt, rows: 3, stroke: P.muted});
    link(nx, ny - 12, nx, wayTop, {color: P.unknown, alpha: nt, upto: .5 * drawShare(t, notProof - .1, .5 * Math.abs(wayTop - (ny - 12)), .5), end: false, dash: [6, 6]});
    line(nx - 30, (ny - 12 + wayTop) / 2, nx + 30, (ny - 12 + wayTop) / 2, {color: P.unknown, alpha: ramp(t, notProof + .3, .3) * p4, width: 4});
    termRow(t, noticeTerm, [notice], noticeQual, [notProof], nx + 45 + NAME_GAP, ny + 58 - labelSize(LABEL) / 2, {alpha: p4});
  }
};

/* ---------------- 14 data: implementation, verification and production change ---------------- */
scenes["14"] = function (s, t) {
  // The Chinese names six stages, the last the improvement after running; the English names seven.
  const stations = cues(s, en ? [["", "requirements"], ["", "design"], ["", "implementation"], ["", "verification release"],
    ["", "release"], ["", "operational feedback"], ["", "improvement"]]
    : [["需求", ""], ["设计", ""], ["实现", ""], ["核验发布", ""], ["发布", ""], ["运行后的改进", ""]]);
  const asNeeded = cue(s, "视工作需要", "as the work requires");
  const [owner, result, both, oneDuty, quality, next, handing] = cues(s, [["工程负责人", "engineering owners"], ["结果负责", "result from"],
    ["开发和核验", "development and verification"], ["一份责任", "one responsibility"], ["质量", "quality is not"], ["推给下一个环节", "next stage"],
    ["交出结果之前", "before handing"]]);
  // The hand-over's five parts: the criteria, the actual inputs, version and environment, the results and what they did
  // not cover, each failure and how it was handled, and the remaining risk with its owner, each part's words in the order
  // spoken. Each edition states them as three things, which `groups` gives as the list the names build in: in Chinese
  // the criteria with the inputs, the results, and the failures with the risk; in English, by its semicolons, the
  // criteria, the inputs with the results, and the failures with the risk.
  const rows = (en ? [[["", "criteria tested"]],
    [["", "inputs version"], ["", "version"], ["", "environment"]],
    [["", "results with"], ["", "not covered"]], [["", "each failure"], ["", "its handling"]],
    [["", "who owns"], ["", "remaining risk"]]]
    : [[["按什么标准", ""]], [["输入", ""], ["版本", ""], ["环境", ""]], [["结果怎样", ""], ["没覆盖到", ""]],
      [["失败或差异", ""], ["怎么处理", ""]], [["剩下的风险", ""], ["归谁", ""]]]).map(pairs => cues(s, pairs));
  const groups = en ? [0, 1, 1, 2, 2] : [0, 0, 1, 2, 2];
  const vaultAts = cues(s, en ? [["", "production shared"], ["", "shared assets"], ["", "critical management chains"]] : [["生产环境", ""], ["共享资产", ""], ["关键管理链条", ""]]);
  // Each control's gate arrives on the words that begin it and opens one step per requirement said. A control whose key
  // phrase closes its clause arrives near those words, so its name never stands long before them: the rerun control on
  // the outputs, the Chinese way back once the release window has been said, and the evidence from the current version
  // and environment on the words that say where it must come from.
  const lockAts = (en ? [[["", "a defined subject"], ["", "impact"], ["", "task lead"], ["", "and authority"]],
    [["", "outputs that"], ["", "rerun exactly"]], [["", "tests acceptance"], ["", "acceptance"], ["", "operational observation"]],
    [["", "release window"], ["", "rollback or degradation"]], [["", "security"], ["", "permission and"], ["", "sensitive-data checks"]],
    [["", "conditions"], ["", "hand control"], ["", "or stop"]]]
    : [[["讲明改什么", ""], ["影响谁", ""], ["谁负责", ""], ["谁授权", ""]], [["输出", ""], ["原样重跑", ""]],
      [["有测试", ""], ["验收和", ""], ["发布后的观察", ""]], [["有发布窗口", ""], ["回滚或降级预案", ""]], [["安全", ""], ["权限和", ""], ["敏感信息", ""]],
      [["什么时候上报", ""], ["交给人接管", ""], ["停下", ""]]]).map(pairs => cues(s, pairs));
  // The seventh control's environment is the one said after the current version, as the hand-over names one before it.
  const currentAt = cue(s, "当前的版本", "current version");
  lockAts.push([cue(s, "来自当前", "come from"), currentAt, cueFrom(s, "环境", "environment", currentAt)]);
  const risky = cues(s, [["高风险", "high-risk"], ["权限变更", "permission changes"], ["生产发布", "production releases"], ["删除覆盖", "deletion"], ["不可逆", "irreversible"]]);
  const [ownerAt, approveAt, agentAt, cannotAt] = cues(s, [["决策负责人", "the decision owner"], ["批准", "must approve"], ["智能体", "an agent"],
    ["不能批准", "cannot approve"]]);
  // The high-risk stage cuts in on its thought's first words, the decision owner in both editions: the Chinese now names
  // the owner and the approval before the five actions, as the English does.
  const highCut = cue(s, "有五类事", "the decision owner");
  const base = ramp(t, opening(s), .7);
  // 1. The engineering owner carries one result through every stage; the line of responsibility follows it.
  // The English sixth stage, two words, is authored as its one line, as each English name stands whole on one line.
  const names = en ? ["Requirements", "Design", "Implementation", "Verification", "Release", ["Operational feedback"], "Improvement"]
    : ["需求", "设计", "实现", "核验", "发布", "运行后的改进"];
  // The stations are spaced from their names, so every name stands on one baseline without crowding its neighbours. The
  // English rail carries seven stages, so it is wider about the same axis and keeps one pitch, and its names, each whole
  // on one line, stand on two baselines, every other name a row lower on a short stem from its station.
  const trackY = 560, [first, last] = L([440, 1640], [404, 1676]), xs = en ? names.map((_, i) => first + i * (last - first) / 6) : railStations(names, first, last, {gap: 34});
  const trackEnd = last + 40, widthOf = v => Math.max(...wrapName(v, RAIL_WRAP).map(line => measure(line)));
  // The track holds until the hand-over is named and hands the picture to the report in one cut.
  const pA = base * stageOut(t, handing);
  // The hand-over holds until the vault is named and then hands the picture over in one cut, so the two large
  // compositions never cross-fade and the frame keeps a legible mark between them.
  // The production change's stage cuts in on its thought's first word, the changes its first name says, as the word
  // begins rather than a cut's 0.18 s after it, since the word is short.
  const changesCut = cue(s, "改动生产环境", "changes to production") - STAGE_CUT + .05, handOff = stageOut(t, changesCut);
  // The owner carries the result through the stages and leaves with the track; the result stays and docks.
  person(250, trackY, {alpha: ramp(t, owner - .15, .5) * pA, color: P.authority});
  // The result rides to each stage as it is named, each ride a glide.
  let tx = 320;
  stations.forEach((at, k) => { tx = mix(tx, xs[k], glide(t, at - .1, xs[k] - (k ? xs[k - 1] : 320))); });
  const tokQ = ramp(t, result - .15, .4) * base;
  if (pA > 0) {
    const slot = ramp(t, opening(s) + .2, .6) * pA;
    // The track is drawn firm, so the whole way the result will travel stands from the first words.
    line(320, trackY, trackEnd, trackY, {color: P.muted, alpha: slot, width: 3});
    if (tx > 321) line(320, trackY, tx, trackY, {color: P.authority, alpha: tokQ * pA, width: 4});
    // The stages are named on one baseline below the track and the owner above its figure; every name stays while the
    // track stands, the stage being named at full ink and the named ones at the second level until all are named.
    railNames(names, xs, trackY, {gap: i => NAME_GAP + 18 + (en && i % 2 ? RAIL_ROW : 0), alpha: i => pA * listIn(t, stations, i)});
    // The names above the track stand on one line, a name gap over the tallest mark on it, the owner's figure (32 px
    // above the track), so the owner's, the qualifier's and quality's names keep one gap from their marks.
    const above = trackY - 32 - NAME_GAP;
    nameText(L("工程负责人", "Engineering owner"), 250, above, {valign: "bottom", width: 260, color: P.authority, alpha: pA * named(t, owner)});
    // The chain covers the stages the work involves: the qualifier stands at the chain's far end on its words, ending
    // where the last stage's name ends.
    const lastEnd = xs.at(-1) + widthOf(names.at(-1)) / 2;
    nameText(L("视工作需要", "As the work requires"), lastEnd, above, {align: "right", valign: "bottom", alpha: pA * named(t, asNeeded)});
    stations.forEach((at, i) => {
      const lit = ramp(t, at - .15, .4), pulse = 7 * span(t, both - .15, both + .9, .3) * (i === 2 || i === 3 ? 1 : 0);
      // A station whose English name stands a row lower carries a stem down to it, one stroke with its ring, one mark.
      stroke(() => { ctx.ellipse(xs[i], trackY, 24 + pulse, 24 + pulse, -Math.PI / 2, 0, Math.PI * 2); if (en && i % 2) { ctx.moveTo(xs[i], trackY + 30 + pulse); ctx.lineTo(xs[i], trackY + NAME_GAP + 18 + RAIL_ROW - 6); } },
        {color: P.ink, alpha: pA * lit, width: 2.5});
    });
    // Development and verification sit inside one responsibility, named above its frame; quality does not leave it.
    const od = ramp(t, oneDuty - .2, .6) * pA, half = i => Math.max(60, measure(wrapName(names[i], RAIL_WRAP)[0]) / 2 + 24);
    const fx0 = xs[2] - half(2), fx1 = xs[3] + half(3);
    // The responsibility's frame is drawn in its colour around the two stations when it is named, as far above quality's
    // name as below the stages' names.
    const em = labelSize(LABEL), row = L(0, RAIL_ROW), namesBottom = trackY + NAME_GAP + 18 + row + blockHeight(Math.max(...[2, 3].map(i => wrapName(names[i], RAIL_WRAP).length)));
    const pad = 670 + row - namesBottom, ftop = above - em - pad;
    box(fx0, ftop, fx1 - fx0, 670 + row - ftop, {stroke: P.authority, alpha: od, radius: 22, width: 2.5});
    nameText(L("一份责任", "One responsibility"), (fx0 + fx1) / 2, ftop - NAME_GAP, {valign: "bottom", color: P.authority, alpha: pA * named(t, oneDuty)});
    // Quality's seal steps out past the frame and back as the next stage is named, each way a glide.
    const step = fx1 - xs[3] + 20, qq = ramp(t, quality - .15, .4) * pA, out = glide(t, next - .1, step), back = glide(t, next - .1 + glideTime(step) + .05, step);
    const qx = xs[3] + step * out * (1 - back);
    seal(qx, trackY, 13, {color: P.evidence, alpha: qq});
    // The seal tries to leave and returns; its name stays at verification, where quality belongs.
    nameText(L("质量", "Quality"), xs[3], above, {valign: "bottom", color: P.evidence, alpha: pA * named(t, quality)});
    cross(fx1 + 34, trackY - 44, 22, {alpha: ramp(t, next + .4, .3) * pA, width: 3});
  }
  // 2. Before handing a result over, its owner states three things, each a group of parts that attach to the result on
  // their words, sliding in until their ways meet the result's ring. The result the owner carried stands at the centre,
  // and the three stand left of it, round it and right of it, in the order spoken. In Chinese: the criteria and the
  // actual inputs, version and environment they were tested with, one over the other on the left; the results, the ring
  // that draws round the result, all but one stretch at its foot, what was not covered, which stays a dashed gap; and
  // each failure with how it was handled over the remaining risk, held by the one who owns it, on the right. In English,
  // by its semicolons: the criteria on the left; the actual inputs, version and environment as tiles from above, with the
  // results and what was not covered; and the failures over the risk on the right. A side's two
  // parts join the result by one way, so each side reads as one group, and the parts' names stand on one edge beyond
  // them. The names build as the three things the narration speaks, the parts of one thing sharing its level, and every
  // part stays until the production change takes the picture. The report stands centred on what it holds: centred on its
  // first two things about the result, it moves left on the words of the third to where it ends centred.
  const pB = stageIn(t, handing) * base * handOff, resultAt = cueFrom(s, "结果", "result", handing);
  const modelName = L(["按什么标准"], ["Criteria tested"]), inputsName = en ? ["Actual inputs", ", version", ", environment"] : ["实际的输入", "、版本", "和环境"];
  const failName = en ? ["Each failure", ", its handling"] : ["每个失败或差异", "怎么处理"], riskName = en ? ["Remaining risk", " and its owner"] : ["剩下的风险", "归谁"];
  // A side's two parts stand 45 px above and below the result's line, their outer edges on one line 296 px from the
  // result (the English criteria, alone, on the line with its edge 270 px out), and their ways meet 112 px from it.
  const TW = 76, RR = 64, PAIR = 45, OUT = en ? 270 : 296, MEET = 112;
  const widest = (parts, width) => Math.max(...growTexts(parts, width).map(line => line.reduce((w, [, v]) => w + measure(v), 0)));
  // The report's reach either side of the result: its left edge at the left names, and its right edge at the result's
  // ring, then in English the inputs' name, and then the failures' and the risk's names.
  const reportLeft = -OUT - NAME_GAP - Math.max(measure(modelName.join("")), en ? 0 : widest(inputsName, 480));
  const firstRight = Math.max(reportLeft + measure(L("交出结果之前，讲清三件事", "Before handing over")), RR + 8);
  const inputsRight = Math.max(firstRight, en ? TW + NAME_GAP + widest(inputsName, 480) : 0);
  const wholeRight = Math.max(inputsRight, 220 + 50 + NAME_GAP + Math.max(widest(failName, 480), measure(riskName.join(""))));
  const centreOn = right => 960 - (reportLeft + right) / 2, third = cue(s, "每个失败或差异", "each failure");
  // The report moves on the inputs' words in English, about 190 px, and on the first words of the third thing, about
  // 270 px in Chinese and 100 px in English, so the third's names arrive inside the frame; each move is a glide from 0.3 s
  // before those words, so the room is there as the names arrive.
  const toInputs = centreOn(inputsRight) - centreOn(firstRight), toWhole = centreOn(wholeRight) - centreOn(inputsRight);
  const docked = t >= handing + STAGE_CUT, RCY = 550, RCX = centreOn(firstRight) + toInputs * glide(t, rows[1][0] - .3, toInputs)
    + toWhole * glide(t, third - .3, toWhole);
  if (pB > 0) {
    // The heading starts where the diagram starts, at the left names, and stands well clear above the inputs' tiles.
    const modelLeft = RCX + reportLeft;
    nameText(L("交出结果之前，讲清三件事", "Before handing over"), modelLeft, 338 - 22 - 40, {align: "left", valign: "bottom", alpha: pB * named(t, handing)});
    const starts = rows.filter((_, i) => groups[i] !== groups[i - 1]).map(v => v[0]), level = i => pB * listLevel(t, starts, groups[i]);
    const on = at => ramp(t, at - .15, .35) * pB, att = at => soon(t, at + .05, .5);
    // The results: the stretch the tests covered draws round the result, and the stretch at its foot they did not reach
    // stays a gap, named under it. The results are named over the ring in Chinese and, above its inputs' way, at its upper
    // left in English.
    const G0 = Math.PI * 55 / 180, G1 = Math.PI * 125 / 180;
    ring(RCX, RCY, RR, {color: P.evidence, alpha: on(rows[2][0]), width: 6, start: G1, upto: 290 / 360, draw: {t, at: rows[2][0] + .05}});
    stroke(() => ctx.arc(RCX, RCY, RR, G0, G1), {color: P.unknown, alpha: on(rows[2][1]), width: 4, dash: [7, 7]});
    radialName(L("结果", "Result"), RCX, RCY, RR, en ? -Math.PI * 3 / 4 : -Math.PI / 2, {gap: NAME_GAP + 4, alpha: pB * named(t, resultAt)});
    radialName(L("哪里没覆盖到", "What was not covered"), RCX, RCY, RR, Math.PI / 2, {gap: NAME_GAP + 14, width: 420,
      alpha: level(2) * named(t, rows[2][1]), set: "report"});
    // The criteria, from the left: a card of three linked parts, and a scale with the standard marked on it. Both editions
    // name the criteria alone, so the card and its scale arrive together.
    // The report's ways draw on over at least 0.9 s, since the diagram may still be gliding to its place as they set off.
    const my = en ? RCY : RCY - PAIR, mq = on(rows[0][0]), mx = RCX - OUT + 50 - 28 * (1 - att(rows[0][0])), cq = on(rows[0].at(-1));
    box(mx - 50, my - 36, 100, 72, {fill: P.row, stroke: P.evidence, alpha: mq, radius: 8});
    const parts = [[mx - 32, my - 13], [mx - 8, my - 13], [mx - 20, my + 13]];
    path([...parts, parts[0]], {color: P.ink, alpha: mq, width: 2});
    parts.forEach(([x, y]) => dot(x, y, 5, {color: P.ink, alpha: mq}));
    // The scale, its rule and its four ticks, is one stroke, so it moves whole with the card; ticks drawn one by one, 11
    // px apart, would read at the card's pace as each tick taking its neighbour's place.
    stroke(() => { ctx.moveTo(mx + 6, my + 14); ctx.lineTo(mx + 40, my + 14);
      [0, 1, 2, 3].forEach(k => { ctx.moveTo(mx + 6 + k * 11, my + 14); ctx.lineTo(mx + 6 + k * 11, my + 7); }); }, {color: P.ink, alpha: cq, width: 2});
    line(mx + 28, my - 18, mx + 28, my + 14, {color: P.authority, alpha: cq, width: 3});
    link(mx + 58, my, RCX - RR - 8, RCY, {route: en ? null : "hvh", mid: RCX - MEET, color: P.evidence, alpha: mq, draw: {t, at: rows[0][0] + .05, least: .9}});
    growName(t, modelName, rows[0], mx - 50 - NAME_GAP - measure(modelName.join("")), my, {valign: "middle", alpha: level(0), set: "report"});
    // The actual inputs, version and environment: a tile for each, docking down onto one bar on its word. The Chinese
    // tiles stand under the criteria, and the English three above the ring.
    const IX = en ? RCX : RCX - OUT + TW, IY = en ? 338 : RCY + PAIR;
    [-54, 0, 54].forEach((dx, k) => {
      const q = on(rows[1][k]), x = IX + dx, y = IY - 20 * (1 - att(rows[1][k]));
      box(x - 22, y - 22, 44, 44, {fill: P.row, stroke: P.evidence, alpha: q, radius: 6});
      if (k === 0) { box(x - 12, y - 10, 24, 20, {stroke: P.ink, alpha: q, radius: 2}); line(x - 12, y, x + 12, y, {color: P.ink, alpha: q}); line(x, y - 10, x, y + 10, {color: P.ink, alpha: q}); }
      if (k === 1) text("v2", x, y + 1, 26, {role: "mark", align: "center", color: P.ink, alpha: q});
      if (k === 2) { box(x - 13, y - 11, 26, 22, {stroke: P.ink, alpha: q, radius: 4}); dot(x, y, 4, {color: P.ink, alpha: q}); }
    });
    const iq = on(rows[1][0]);
    line(IX - TW, IY + 30, IX + TW, IY + 30, {color: P.evidence, alpha: iq, width: 2});
    if (en) link(RCX, 368, RCX, RCY - RR - 8, {color: P.evidence, alpha: iq, draw: {t, at: rows[1][0] + .05, least: .9}});
    else link(IX + TW + 8, IY, RCX - RR - 8, RCY, {route: "hvh", mid: RCX - MEET, color: P.evidence, alpha: iq, draw: {t, at: rows[1][0] + .05, least: .9}});
    growName(t, inputsName, rows[1], en ? RCX + TW + NAME_GAP : RCX - OUT - NAME_GAP - widest(inputsName, 480), IY, {valign: "middle", width: 480,
      alpha: level(1), set: "report"});
    // Each failure and how it was handled, from the right: two failures, each handled along its own way.
    const fy = RCY - PAIR, fq = on(rows[3][0]), fx = RCX + 220 + 28 * (1 - att(rows[3][0])), dq = on(rows[3][1]);
    box(fx - 50, fy - 36, 100, 72, {fill: P.row, stroke: P.evidence, alpha: fq, radius: 8});
    [-16, 16].forEach((d, k) => {
      const go = soon(t, rows[3][1] + .05 + k * .15, .4);
      cross(fx - 28, fy + d, 14, {alpha: fq, width: 3});
      link(fx - 16, fy + d, fx + 14, fy + d, {color: P.muted, alpha: dq, upto: go, end: false});
      check(fx + 28, fy + d, 15, {alpha: dq, upto: clamp((go - .6) / .4), width: 3});
    });
    link(fx - 58, fy, RCX + RR + 8, RCY, {route: "hvh", mid: RCX + MEET, color: P.evidence, alpha: fq, draw: {t, at: rows[3][0] + .05, least: .9}});
    growName(t, failName, rows[3], fx + 50 + NAME_GAP, fy, {valign: "middle", width: 480, alpha: level(3), set: "report"});
    // The remaining risk, under the failures: the risk docks from below, held by the one who owns it, and joins the
    // failures' way to the result. The English names the owner before the risk, the Chinese the risk before its owner.
    const [whoAt, riskAt] = en ? rows[4] : [rows[4][1], rows[4][0]];
    const DX = RCX + 198, wq = on(whoAt), rq = on(riskAt), ry = RCY + PAIR + 24 * (1 - att(riskAt));
    person(DX + 58, RCY + PAIR + 6, {color: P.authority, alpha: wq, size: .9});
    diamond(DX, ry, 14, {color: P.unknown, alpha: rq, solid: true});
    link(DX + 16, ry, DX + 34, ry, {color: P.authority, alpha: rq, upto: att(riskAt), end: false});
    link(DX - 22, ry, RCX + RR + 8, RCY, {route: "hvh", mid: RCX + MEET, color: P.evidence, alpha: rq, draw: {t, at: riskAt + .05, least: .9}});
    // The risk and its owner are named on the failures' edge, beside the one who owns it.
    growName(t, riskName, rows[4], RCX + 220 + 50 + NAME_GAP, RCY + PAIR, {valign: "middle", alpha: level(4), set: "report"});
  }
  // The result stands at its dock from the cut that brings the report, rather than gliding there across the frame.
  token(docked ? RCX : tx, docked ? RCY : trackY, {alpha: tokQ * handOff, r: docked ? 24 : 10});
  // 3. Changing production, shared assets or critical management chains needs more. The change waits at the start
  // of a way to the vault that holds them, named from the cut by the voice's first word, the change itself, and the way
  // crosses seven gates, one per required control, the last the evidence from the current version and environment:
  // each gate arrives shut on the words that name its control and opens one step per requirement as each is said,
  // named by its key words, above and below the way in turn. The vault grows as each object it holds is named, and the
  // objects are named together over it. When the last gate has opened, the change's way draws on through all of them
  // into the vault. With the change's and the vault's names and, in English, its examples the stage carries ten names
  // in Chinese and eleven in English.
  const p3 = stageIn(t, changesCut) * base * stageOut(t, highCut);
  if (p3 > 0) {
    // Each control is named by its spoken words for every requirement it names, never its caption's whole line. The
    // Chinese third and fifth stand as one name in two authored lines, an even block; the Chinese fourth names the
    // release window and, under it, the rollback or degradation plan, which joins on its own words, as the first
    // control's second pair does, and the English third its operational observation; so the stage shows at most twelve
    // names.
    const keys = en ? [["Subject, impact", "Task lead, authority"], "Rerun exactly", ["Tests, acceptance", "Observation"], "Rollback or degradation",
      "Security, permission", "Escalate, hand over, stop", "Current version\nand environment"]
      : [["改什么、影响谁", "谁负责、谁授权"], "原样重跑", "测试、验收和\n发布后的观察", ["发布窗口", "回滚或降级预案"], "查安全、权限\n和敏感信息",
        "上报、交人接管或停下", "当前的版本和环境"];
    // The vault's name heads the vault, its lines centred on it, and the stage, from the change's ring to the name's
    // far edge, stands centred on the frame in each edition. The Chinese name is authored as three even lines, each
    // group of its examples whole on its line.
    const vaultName = L(["生产环境、共享资产，", "或者风控、监管报送", "这类关键管理链条"], "Production, shared assets or critical management chains");
    // The gates stand 144 px apart in Chinese and 180 px in English, so each control's name stands whole on one line, 40
    // px or more from the next name on its side of the way; the vault stands 40 px clear of the last control's name. The
    // English last control stands as one name in two lines, broken before its "and", and the note under the vault in
    // two, so the seven gates and the vault stand centred inside the safe area.
    const lastW = Math.max(...wrapName(keys.at(-1), Infinity).map(v => measure(v)));
    const vaultNote = "Such as risk control or regulatory reporting", GP = L(144, 180), VX0 = 470 + (keys.length - 1) * GP + lastW / 2 + 40, VW = 140;
    const half = Math.max(...wrapName(vaultName, 480).map(v => measure(v)), ...(en ? wrapName(vaultNote, 400, NOTE).map(v => measure(v, NOTE)) : [])) / 2, ox = 960 - (330 - 23 + VX0 + VW / 2 + half) / 2;
    const LY = 510, CX0 = 330 + ox, gx = k => 470 + ox + k * GP, VX = VX0 + ox, starts = lockAts.map(ats => ats[0]);
    // The vault opens around its first object and grows on the words that bring each next one; its name moves with its
    // top edge, so the two always stand together.
    const shown = vaultAts.slice(1).reduce((n, at) => n + soon(t, at - .3, .35), 1), VH = 40 + 80 * shown, vy = LY - VH / 2;
    box(VX, vy, VW, VH, {fill: P.row, stroke: P.ink, alpha: p3, radius: 6, width: 2.5});
    // English names two of the chains as examples after them: a link of the chain beats on each. The table and the
    // chain are each drawn as one mark, the table's rules and the chain's three links in one stroke, so each object
    // reads as one thing the vault holds rather than as parts waiting for their own names.
    const examples = en ? cues(s, [["", "risk control"], ["", "regulatory reporting"]]) : [];
    vaultAts.forEach((at, i) => {
      const y = LY + 80 * (i - (shown - 1) / 2), mx = VX + VW / 2, q = ramp(t, at - .15, .4) * p3;
      if (i === 0) s13Table(mx - 32, y - 24, 64, 48, {alpha: q, rows: 3, cols: 3});
      if (i === 1) { box(mx - 30, y - 22, 38, 32, {stroke: P.ink, alpha: q, radius: 5}); box(mx - 8, y - 10, 38, 32, {fill: P.row, stroke: P.ink, alpha: q, radius: 5}); }
      if (i === 2) {
        stroke(() => [-22, 0, 22].forEach(d => { ctx.moveTo(mx + d + 12, y); ctx.arc(mx + d, y, 12, 0, Math.PI * 2); }), {color: P.ink, alpha: q, width: 2.5});
        examples.forEach((at, k) => beats(t, mx - 22 + 22 * k, y, 18, [at], {color: P.evidence, alpha: q}));
      }
    });
    // The vault's name stands over its top edge; the controls named above the way stand well clear of it.
    nameText(vaultName, VX + VW / 2, vy - NAME_GAP, {valign: "bottom", width: 480, alpha: p3 * named(t, vaultAts[0])});
    // English names the chains' examples after the chains, so they join under the vault on their own words, smaller and
    // muted, following its bottom edge and centred on it as its name is; the Chinese name says them before the chains.
    if (en) nameText(vaultNote, VX + VW / 2, vy + VH + NAME_GAP, {valign: "top", width: 400,
      size: NOTE, color: P.muted, alpha: p3 * named(t, cue(s, "", "such as risk control"))});
    // The change and its way to the vault stand from the cut, the change named under it from the way's start edge, as a
    // way's first name stands.
    token(CX0, LY, {alpha: p3, r: 16});
    nameText(L("改动", "Changes"), CX0 - 23, LY + 23 + NAME_GAP, {align: "left", valign: "top", alpha: p3 * named(t, cue(s, "改动", "changes"))});
    link(CX0 + 30, LY, VX - 12, LY, {alpha: p3, end: false});
    lockAts.forEach((ats, k) => {
      const x = gx(k), at = ats[0], q = ramp(t, at - .3, .3) * p3, open = saidShare(t, ats), up = k % 2 === 0;
      // The gate's two posts are one stroke, one gate; its bar lifts into the upper post as its requirements are said.
      stroke(() => { ctx.moveTo(x, LY - 46); ctx.lineTo(x, LY - 16); ctx.moveTo(x, LY + 16); ctx.lineTo(x, LY + 46); }, {color: P.evidence, alpha: q, width: 4});
      if (open < 1) line(x, LY - 16, x, mix(LY + 16, LY - 16, open), {color: P.unknown, alpha: q * clamp((1 - open) / .15), width: 4});
      ring(x, LY, 58, {color: P.evidence, alpha: speaking(t, starts, k) * restMark(P.evidence, .45) * p3, width: 2});
      // The first control names its subject and impact first; the second pair, the task lead with the authority, joins
      // its name on the task lead's words, a line nearer the way, so the station changes while its four requirements are
      // spoken and its two lines stand at one width. The Chinese escalation stands on one line, 40 px from its neighbour
      // below the way, as no break at its list mark keeps an even block.
      const ky = up ? LY - 46 - NAME_GAP : LY + 46 + NAME_GAP;
      const key = Array.isArray(keys[k]) ? keys[k] : [keys[k]];
      key.forEach((part, j) => nameText(part, x, ky + (up ? j - key.length + 1 : j) * labelSize(LABEL) * LEADING,
        {valign: up ? "bottom" : "top", width: Array.isArray(keys[k]) ? Infinity : L(300, Infinity),
          alpha: p3 * listIn(t, starts, k) * (j ? named(t, ats[Math.min(j + 1, ats.length - 1)]) : 1), set: "controls"}));
    });
    // Once every gate is open the change's way runs through them all into the vault.
    const passAt = lockAts.at(-1).at(-1);
    link(CX0 + 30, LY, VX - 12, LY, {color: P.authority, width: 3, alpha: p3, draw: {t, at: passAt + .05}});
  }
  // 4. High-risk actions need the decision owner's approval: the five build into one column whose ways
  // converge on one point, where the lock the owner holds appears shut on the word that approves and opens. The column
  // stands top to bottom in the order spoken; in English it reflows toward its centre as they arrive, so it stays about
  // the centre line as it grows. The owner stands above the lock
  // and holds it along one link; the Agent stands below it. Both editions name the owner and the approval before the
  // actions, so the lock opens before the ways reach it. The Chinese first says there are five kinds of action that the
  // owner must approve: on those words the count heads the column and its five places stand as one quiet mark, with the
  // owner above the lock, and each action's mark fills its place on its own words. The Agent may implement or
  // help verify within its delegation, which closes round it as a solid boundary on those words; its way up to the lock
  // appears only with the bar that stops it, on the words that say it cannot approve.
  const p4 = stageIn(t, highCut) * base;
  if (p4 <= 0) return;
  const actions = en ? ["High-risk use admission", "Permission changes", "Production releases", "Deletion or overwrite", "Irreversible actions"]
    : ["高风险的用途准入", "权限变更", "生产发布", "删除覆盖", "不可逆的操作"];
  const ownerName = L("决策负责人", "Decision owner"), mayAt = cue(s, "可以在委托范围内", "may implement");
  // What the Agent may do stands in two lines in English, broken between its two phrases, so the left column stays about
  // as narrow as its other names; the Chinese stands on one line, as no break at its list mark keeps an even block, and
  // the left column widens to take it.
  const agentTerm = [L("智能体", "Agent")], agentQual = en ? ["may implement", " or help verify"] : ["委托范围内去做、帮忙核验"];
  // The names of the marks on the lock's axis, the owner, the approval, the refusal and the Agent, stand in one column
  // left of it, ending a name gap from its widest mark, the owner; the actions' names stand in their own column right.
  // The stage is centred on the two columns, measured in each edition.
  const LY = 520, AY = LY + 300, OY = LY - 210, inset = 15 * 1.8 * 1.55 + NAME_GAP;
  const leftW = Math.max(measure(ownerName), measure(L("批准", "Approve")), 42 + measure(L("不能批准", "Cannot approve")), measure(agentTerm[0]),
    ...agentQual.map(v => measure(v.trim(), NOTE) - hangOf(v.trim(), "right", NOTE)));
  // The Chinese left column widens only when its long gloss arrives, so the stage stands centred without it until then.
  const leftBefore = Math.max(measure(ownerName), measure(L("批准", "Approve")), 42 + measure(L("不能批准", "Cannot approve")), measure(agentTerm[0]));
  // The Chinese column stands from the cut with only its count named, so until the first action is named the stage
  // stands 66 px right, centred on the owner and the count, and eases to its place on that action's words.
  const early = en ? 0 : 66 * (1 - glide(t, risky[0] - .25, 66));
  const lockX = 960 + early - (300 + 18 + NAME_GAP + Math.max(...actions.map(v => measure(v))) - inset - L(mix(leftBefore, leftW, soon(t, mayAt - .2, .5)), leftW)) / 2, mx = lockX + 300, busX = lockX + 160;
  const edge = lockX - inset;
  const approve = soon(t, approveAt + .05, .45);
  // The lock appears shut where the ways meet on the word that approves, takes the owner's colour and opens.
  lock(lockX, LY, {closed: 1 - approve, color: blend(P.muted, P.authority, approve), alpha: p4 * ramp(t, approveAt - .15, .3), size: 1.5});
  nameText(L("批准", "Approve"), edge, LY, {align: "right", color: P.authority, alpha: p4 * named(t, approveAt)});
  // In Chinese the count and the column's five places stand from the cut, on the words that count them, so the column
  // stands whole and does not reflow; in English it builds toward its centre.
  const drop = en ? building(t, risky) : 0;
  if (!en) {
    stroke(() => risky.forEach((_, i) => { const y = LY + (i - 2) * 120; ctx.moveTo(mx + 13, y); ctx.arc(mx, y, 13, 0, Math.PI * 2); }), {color: P.muted, alpha: p4, width: 2.5});
    nameText("五类事", mx + 18 + NAME_GAP, LY - 300, {align: "left", color: P.muted, alpha: p4 * named(t, highCut)});
  }
  risky.forEach((at, i) => {
    const y = LY + (i - 2) * 120 + drop, q = ramp(t, at - .15, .4) * p4, lit = speaking(t, risky, i);
    // Each action's mark fills on its own words and lights while it is named, and its way draws on toward the lock.
    ring(mx, y, 18, {color: P.unknown, alpha: lit * restMark(P.unknown, .7) * p4, width: 2});
    dot(mx, y, 8 + 2 * lit, {color: P.unknown, alpha: q});
    // Each way draws on over at least 0.9 s, since its mark is still dropping into place as it sets off.
    link(mx - 24, y, lockX + 36, LY, {route: "hvh", mid: busX, alpha: q, width: 3, draw: {t, at: at - .1, least: .9}});
    nameText(actions[i], mx + 18 + NAME_GAP, y, {align: "left", alpha: p4 * listIn(t, risky, i), set: "high-risk"});
  });
  // The Chinese opens on the five kinds the owner must approve, so the owner stands from the cut and is named as the
  // clause that names it begins; the English names the owner first, on its own words.
  const ownerFrom = en ? ownerAt : cue(s, "必须", "") - .2, ow = (en ? ramp(t, ownerAt - .15, .4) : 1) * p4;
  person(lockX, OY, {color: P.authority, alpha: ow, size: 1.8});
  nameText(ownerName, edge, OY, {align: "right", color: P.authority, alpha: p4 * named(t, ownerFrom)});
  link(lockX, OY + 46, lockX, LY - 44, {color: P.authority, alpha: ow, draw: {t, at: approveAt - .1}, width: 2.5});
  const ag = ramp(t, agentAt - .15, .4) * p4, delegAt = cue(s, "委托范围内", "within its delegation");
  agent(lockX, AY, {alpha: ag});
  // The Agent's delegation closes round it on the words that bound its work, solid as every delegation boundary is.
  ring(lockX, AY, 40, {color: P.evidence, alpha: ag * ramp(t, delegAt - .1, .3), width: 2.5, draw: {t, at: delegAt + .05}});
  // The Agent's name stands level with it and what it may do under its name, both ending at the column's edge.
  termRow(t, agentTerm, [agentAt], agentQual, [mayAt], edge, AY - labelSize(LABEL) / 2, {width: leftW, inline: false, align: "right", alpha: p4, color: P.evidence, set: "agent"});
  const go = soon(t, cannotAt - .1, .5), barY = (AY - 32 + LY + 28) / 2, no = ramp(t, cannotAt + .05, .3);
  link(lockX, AY - 32, lockX, LY + 28, {alpha: ag * ramp(t, cannotAt - .1, .2), upto: .46 * go, end: false, dash: [8, 8]});
  line(lockX - 24, barY, lockX + 24, barY, {color: P.unknown, alpha: no * p4, width: 4});
  rejectedName(L("不能批准", "Cannot approve"), edge - 42, barY, {align: "right", alpha: p4 * named(t, cannotAt), mark: no});
};

/* seg12 reaches the right margin; a gentler push keeps its gated path inside the action-safe area. */
scenes["12"].push = .01;
/* The price lifts out of the previous scene's table, so scene 10 changes on its first word. */
scenes["10"].carries = true;

/* ---------------- 15 deliver: the chain of trust cannot skip a link ---------------- */
scenes["15"] = function (s, t) {
  const [commitment, owner, condition, chain] = cues(s, [["承诺", "the commitment"], ["负责人", "owner"],
    ["完成条件摆到明面上", "completion condition visible"], ["是一条信任链", "is a chain of trust"]]);
  // The six links of the chain, each on the clause that describes it.
  const links = cues(s, [["先明确决策负责人是谁", "name the decision owner"], ["答应交什么", "agree on the deliverable"],
    ["只在范围里动手", "act only within it"], ["拿出当前的证据", "produce current evidence"], ["只说证据撑得住的话", "claim only what it supports"],
    ["最后验收", "then accept and learn"]]);
  // The Chinese says the chain cannot lose a link: the skip starts on the chain's words and stops on that rule.
  const [lighter, skip, before] = cues(s, [["手续可以随风险变轻", "lower risk allows less process"], ["这条链", "cannot skip a link"], ["改动之前", "before changing anything"]]);
  const checks = cues(s, [["改的是哪个对象", "target"], ["哪个版本", "version"], ["在哪个环境", "environment"], ["现状如何", "current state"],
    ["有没有并行的工作", "concurrent work"], ["怎么恢复", "recovery path"]]);
  const [scope, record] = cues(s, [["范围或风险有了实质变化", "if scope or risk changes"], ["记进现有的工作记录", "existing work record"]]);
  // The decision owner was first named in the chain of trust; here it is the one the change returns to.
  const decider = cueFrom(s, "决策负责人", "the decision owner", scope);
  const base = ramp(t, opening(s), .7);
  // 1a. Bridge from the data chapter: trusted data still needs a delivery that can be verified. Three stations stand on
  // one rail, the data, the delivery and its verification. The data stands on the chapter's first word, the rail draws
  // on to each of the others as it is named, and the verification fills with its check on its words. The row stands
  // centred as it grows: the data alone stands at the centre, and the row steps left by half its pitch as each further
  // station arrives.
  // The rail stands until acting is named and hands the picture over in one cut.
  const [trusted, delivery, verified] = cues(s, [["数据可信了", "Trusted data"], ["交付也要", "delivery that"], ["经得起核验", "can be verified"]]);
  const [acting, visibleAt] = cues(s, [["动手之前", "before acting"], ["摆到明面上", "visible"]]);
  const one = clearOfTitle(s, t, 380) * base * stageOut(t, acting);
  if (one > 0) {
    // Each step of 200 px takes 0.7 s, so no name travels more than 40 px in a frame.
    const y = 480, at = [trusted, delivery, verified], step = at.slice(1).reduce((v, a) => v + 200 * (1 - glide(t, a - .1, 200)), 0);
    const xs = [560, 960, 1360].map(x => x + step), seen = i => ramp(t, at[i] - (i ? .1 : .45), .45) * one;
    tableIcon(xs[0] - 100, y - 70, 200, 140, {alpha: seen(0)});
    check(xs[0] + 72, y - 92, 26, {alpha: seen(0), upto: clamp((t - trusted - .2) / .35)});
    documentIcon(xs[1] - 40, y - 52, 80, 104, {alpha: seen(1), rows: 3});
    ring(xs[2], y, 54, {color: P.evidence, alpha: seen(2), width: 3.5});
    check(xs[2], y + 2, 40, {alpha: seen(2), upto: clamp((t - verified - .25) / .35)});
    link(xs[0] + 112, y, xs[1] - 52, y, {alpha: one, draw: {t, at: delivery - .1}});
    link(xs[1] + 52, y, xs[2] - 66, y, {alpha: one, draw: {t, at: verified - .1}});
    railNames(en ? ["Trusted data", "Delivery", "Can be verified"] : ["数据可信了", "交付", "经得起核验"], xs, y + 70,
      {gap: NAME_GAP, alpha: i => one * named(t, at[i]), color: i => i === 2 ? P.evidence : P.ink});
  }
  // 1b. Before acting, three things are made visible: the commitment, the owner and the completion condition. The action
  // stands on the right behind a closed bar from the words that put it after them. The three build one row of stations
  // on the left, each station with its mark on its own words, and the one being named lights its station; on the words
  // that make them visible the bar lifts and the way runs on to the action. The row holds until the chain of trust is
  // named and leaves in one cut.
  const seats = base * stageIn(t, acting) * stageOut(t, chain);
  if (seats > 0) {
    const xs = [460, 780, 1100], y = 440, sy = 566, AX = 1540, BX = 1320, at = [commitment, owner, condition], q = i => ramp(t, at[i] - .1, .45) * seats;
    // The bar lifts within its thought, so it is still before the quiet that follows the words that lift it.
    const open = soon(t, visibleAt + .05, Math.min(.5, thoughtEnd(visibleAt) - visibleAt - .1));
    ring(AX, y, 54, {color: P.ink, alpha: seats, width: 3});
    path([[AX - 14, y - 24], [AX + 26, y], [AX - 14, y + 24], [AX - 14, y - 24]], {color: P.ink, alpha: seats, width: 3});
    nameText(L("动手", "Acting"), AX, sy + 17 + NAME_GAP, {valign: "top", alpha: seats * named(t, acting)});
    line(BX, y - 56, BX, y + 56, {color: P.unknown, alpha: seats * (1 - open), width: 4});
    link(xs[2] + 70, y, AX - 66, y, {alpha: seats * ramp(t, visibleAt + .05, .3), draw: {t, at: visibleAt + .05}, flowing: since(t, visibleAt + .75)});
    documentIcon(xs[0] - 50, y - 65, 100, 130, {alpha: q(0), rows: 3});
    dot(xs[0] + 28, y + 36, 13, {color: P.authority, alpha: q(0)});
    person(xs[1], y + 10, {alpha: q(1), color: P.authority, size: 1.5});
    box(xs[2] - 55, y - 55, 110, 110, {fill: P.row, stroke: P.evidence, alpha: q(2), radius: 10});
    check(xs[2], y + 4, 48, {alpha: q(2), upto: clamp((t - condition - .1) / .35)});
    xs.forEach((x, i) => {
      dot(x, sy, 9, {color: i === 1 ? P.authority : P.evidence, alpha: q(i)});
      const lit = speaking(t, at, i);
      if (lit > 0) ring(x, sy, 17, {color: i === 1 ? P.authority : P.evidence, alpha: lit * restMark(i === 1 ? P.authority : P.evidence, .5) * seats, width: 2});
    });
    railNames(en ? ["Commitment", "Owner", "Completion condition"] : ["承诺", "负责人", "完成条件"], xs, sy,
      {gap: 17 + NAME_GAP, wrap: 320, alpha: i => seats * listIn(t, at, i), set: "visible"});
  }
  // 2. The chain of trust: six links on one rail, each overlapping the next, so the order and the joining are carried
  // by the layout. The rail stands whole from the cut, on the words that name the chain, with the chain's name at its
  // start edge: grown from one end it would stand off centre while it builds, and grown from its middle it would wait
  // for that name; so the chain's span, under its name, carries the stage until its first link is described; each
  // link closes round the rail in its colour on its own clause, named under it on those words, the link being described
  // lit, and the names build into the whole set below.
  // 3. Lower risk allows less process: the links slim down but all six stay. The chain cannot skip a link (in Chinese,
  // cannot lose one): a way leaves the action within the scope over the evidence toward the claim and stops at a bar
  // above the evidence, with the refused words beside it. The chain holds until the checks before a change are named
  // and leaves in one cut.
  const ch = base * stageIn(t, chain) * stageOut(t, before);
  if (ch > 0) {
    // Each link is named by the key phrase of its clause; a clause that is its own key phrase is named without its
    // caption's whole words: the English action by the scope its pronoun stands for, as the Chinese names it, and the
    // English claim as the claims the evidence beside it supports;
    // the Chinese claim without its last 话, still read as what is said, not as "if"; the Chinese deliverable with the
    // scope agreed with it. The names stand whole, each on one line, on two baselines at the links' one pitch, in both
    // editions.
    const names = en ? [["Decision owner and subject"], ["Deliverable and its scope"], ["Act only within scope"], ["Current evidence"],
      ["Only supported claims"], ["Accept and learn"]] : [["决策负责人、针对什么"], ["答应交什么、范围到哪"], ["只在范围里"], ["当前的证据"], ["只说证据撑得住的"], ["验收、总结"]];
    const pitch = L(272, 254), Y = 500, H = 92, xs = names.map((_, i) => L(280, 325) + i * pitch), W = pitch + 26;
    const thin = soon(t, lighter + .05, 1.1), h = mix(H, 62, thin), sw = mix(4, 2.5, thin);
    const railQ = ch * named(t, chain);
    dot(xs[0] - W / 2, Y, 6, {color: P.muted, alpha: railQ});
    link(xs[0] - W / 2, Y, xs[5] + W / 2, Y, {color: P.muted, alpha: railQ, width: 3});
    // A link whose name stands a row lower carries a stem down to it, one stroke with the link, one mark.
    names.forEach((_, i) => {
      const x = xs[i], q = ramp(t, links[i] - .1, .45) * ch, lit = speaking(t, links, i), color = i === 5 ? P.authority : P.evidence;
      stroke(() => { ctx.roundRect(x - W / 2, Y - h / 2, W, h, h / 2);
        if (i % 2) { ctx.moveTo(x, Y + h / 2); ctx.lineTo(x, Y + H / 2 + NAME_GAP + RAIL_ROW - 6); } }, {color, alpha: q, width: sw + 1.5 * lit});
    });
    railNames(names, xs, Y + H / 2, {gap: i => NAME_GAP + (i % 2 ? RAIL_ROW : 0), alpha: i => ch * listIn(t, links, i), set: "chain"});
    // The chain is named at its start edge; how light its process may be joins the name as its qualifier.
    termRow(t, [L("信任链", "Chain of trust")], [chain], [L("手续可以随风险变轻", "Lower risk allows less process")], [lighter],
      xs[0] - W / 2, Y - H / 2 - NAME_GAP - labelSize(LABEL), {width: 900, alpha: ch, color: P.evidence});
    // The skip: up from the action, across toward the claim, stopped at a bar above the evidence.
    const top = Y - h / 2 - 12, mid = Y - 168, skipWords = cue(s, "一环都不能少", "skip a link"), stopAt = skipWords + .05;
    const run = (top - mid) * 2 + (xs[4] - xs[2]), stop = ((top - mid) + (xs[3] - xs[2]) - 12) / run;
    link(xs[2], top, xs[4], top, {route: "vhv", mid, color: P.unknown, alpha: ch * ramp(t, skip - .05, .3), upto: stop, draw: {t, at: skip - .05, least: stopAt - skip + .05}, end: false, dash: [8, 8], width: 2.5});
    line(xs[3], mid - 24, xs[3], mid + 24, {color: P.unknown, alpha: ramp(t, stopAt, .25) * ch, width: 4});
    // The English refuses the skip by name; the Chinese names the rule the bar keeps, that no link may be missing.
    if (en) rejectedName("Skip a link", xs[3], mid - 24 - NAME_GAP, {valign: "bottom", alpha: ch * named(t, skipWords), mark: ramp(t, stopAt, .25)});
    else nameText("一环都不能少", xs[3], mid - 24 - NAME_GAP, {valign: "bottom", alpha: ch * named(t, skipWords)});
  }
  // 4a. Before changing anything, six facts are checked around the change: one ring stands about the change from the
  // words that name it, and each fact takes its mark on the ring and is checked on its own words; the one being named
  // lights its mark, and the names build into the whole set. The ring holds until scope or risk changes and leaves in
  // one cut. While the facts named on the ring's right stand without those on its left, the ring stands left of the
  // centre by as much as balances them, easing there on the first of them and back on the first on its left.
  const lean = L(56, 81), cx = 960 - lean * (glide(t, checks[1] - .1, lean) - glide(t, checks[4] - .1, lean));
  const four = base * stageIn(t, before) * stageOut(t, scope);
  if (four > 0) {
    const cy = 500, rx = 400, ry = 250;
    const names = en ? ["Target", "Version", "Environment", "Current state", "Concurrent work", "Recovery path"] : ["哪个对象", "哪个版本", "哪个环境", "现状如何", "并行的工作", "怎么恢复"];
    // The ring stands firm from the words that name the change, as six arcs that leave room for each fact's mark.
    stroke(() => [0, 1, 2, 3, 4, 5].forEach(i => {
      const a0 = -Math.PI / 2 + i * Math.PI / 3 + .09, a1 = a0 + Math.PI / 3 - .18;
      Array.from({length: 17}, (_, k) => a0 + (a1 - a0) * k / 16).forEach((a, k) => (k ? ctx.lineTo : ctx.moveTo).call(ctx, cx + Math.cos(a) * rx, cy + Math.sin(a) * ry));
    }), {color: P.muted, alpha: four, width: 3});
    // The change at the centre, a delta, named on its words.
    path([[cx, cy - 62], [cx + 58, cy + 38], [cx - 58, cy + 38], [cx, cy - 62], [cx + 58, cy + 38]], {color: P.ink, alpha: four, width: 3});
    nameText(L("改动之前", "Before changing anything"), cx, cy + 38 + NAME_GAP, {valign: "top", alpha: four * named(t, before)});
    checks.forEach((at, i) => {
      const a = -Math.PI / 2 + i * Math.PI / 3, x = cx + Math.cos(a) * rx, y = cy + Math.sin(a) * ry, q = ramp(t, at - .1, .4) * four;
      const lit = speaking(t, checks, i);
      dot(x, y, 17, {color: P.ground, alpha: q});
      dot(x, y, 17, {color: P.evidence, alpha: q, hollow: true, width: 3});
      check(x, y + 1, 18, {alpha: q, upto: clamp((t - at) / .3)});
      if (lit > 0) ring(x, y, 26, {color: P.evidence, alpha: lit * restMark(P.evidence, .5) * four, width: 2});
      radialName(names[i], cx, cy, rx + 17, a, {ry: ry + 17, alpha: four * listIn(t, checks, i), set: "checks"});
    });
  }
  // 5. A material change of scope or risk goes back to the decision owner. The change stands inside the
  // frame of its scope from the first words, at the centre, and the frame visibly widens on the words that say the
  // change is material.
  // A link rises from the change to its owner, who stands over it, high enough that the two stand as one tall stage, from
  // the first words of the clause that returns to it, a point travelling the link. The change and the decision are then
  // written into the work record that already exists: the record stands with its earlier entries on the words that
  // begin the writing, the change runs straight across to it and the decision comes down from the owner, each writing
  // its own row, and the record is named on its words.
  const five = base * stageIn(t, scope);
  if (five > 0) {
    const back = cue(s, "回头找", "return to"), changed = cueFrom(s, "变化", "the change", decider), decided = cueFrom(s, "决定", "decision", changed);
    const ownerAt = cue(s, "就回头找", "return to");
    // The change and then its owner stand centred while the record is still to come. The record stands close enough to
    // the change that the stage, from the change's widened frame to the rows' names beside the record, ends centred in
    // each edition, and the owner stands midway between the change and the record, at the middle of the bracket its two
    // links make: on the words that begin the writing the change glides left into that stage, the record entering beside
    // it, and the owner takes its place over the bracket.
    const writing = cue(s, "把变化", "record the change");
    const DX = 740, dy = 590, oy = 300, ry = 515, rw = 120, rh = 150, under = dy + 110 + NAME_GAP;
    const RX = 1920 - (DX - 130) - rw - NAME_GAP - Math.max(...(en ? ["Change", "Decision"] : ["变化", "决定"]).map(v => measure(v)));
    const apart = glide(t, writing + .05, 960 - DX), dx = mix(960, DX, apart), rx = RX + dx - DX, ox = mix(960, (DX + RX + rw / 2) / 2, apart);
    // The scope's frame stands firm around the change and widens on "materially"; it stays a card-sized frame.
    const widen = soon(t, cue(s, "实质变化", "changes materially") + .05, .6), fw = mix(210, 260, widen), fh = mix(180, 216, widen);
    box(dx - fw / 2, dy - fh / 2, fw, fh, {stroke: P.muted, alpha: five, radius: 14, width: 3});
    path([[dx, dy - 50], [dx + 50, dy + 36], [dx - 50, dy + 36], [dx, dy - 50], [dx + 50, dy + 36]], {color: P.unknown, alpha: five, width: 3});
    nameText(en ? "Material change of scope or risk" : ["范围或风险", "有了实质变化"], dx, under, {valign: "top", width: 360, alpha: five * named(t, scope)});
    const own = ramp(t, ownerAt - .1, .45) * five;
    person(ox, oy, {alpha: own, color: P.authority, size: 1.5});
    nameText(L("决策负责人", "Decision owner"), ox, oy - 52 - NAME_GAP, {valign: "bottom", color: P.authority, alpha: five * named(t, ownerAt)});
    // Over the change the link rises straight to the owner's feet; as the two part it turns to the owner's side.
    link(dx, dy - fh / 2 - 12, ox - 44 * apart, mix(oy + 46, oy, apart), {route: "vh", color: P.authority, alpha: five, width: 2.5, draw: {t, at: back - .05},
      flowing: since(t, back + .85), span: Math.abs((DX + RX + rw / 2) / 2 - 44 - DX) + (dy - 216 / 2 - 12 - oy)});
    // The existing record: a document at full ink from the words that begin the writing, its earlier entries ruled as
    // one stroke over the rows to be written, named on its own words; its two rows are written on their words.
    const kept = named(t, record), held = five * named(t, writing);
    documentIcon(rx, ry, rw, rh, {alpha: held, rows: 0});
    stroke(() => [[30, .62], [50, .42]].forEach(([d, w]) => { ctx.moveTo(rx + 18, ry + d); ctx.lineTo(rx + 18 + rw * w, ry + d); }), {color: P.muted, alpha: held * .8, width: 2});
    // The record is named on the change's line, whole on one line centred under the record, clear below the rows' names.
    nameText(L("现有的工作记录", "Existing work record"), rx + rw / 2, under, {valign: "top", alpha: five * kept});
    const rows = [[dy, P.ink, changed], [dy + 48, P.authority, decided]];
    link(dx + fw / 2 + 12, dy, rx - 14, dy, {alpha: five, draw: {t, at: changed - .05}});
    link(ox + 44, oy, rx + rw / 2, ry - 12, {route: "hv", color: P.authority, alpha: five, width: 2.5, draw: {t, at: decided - .05}});
    // Each written row is named beside the record on its own word: a list of two that builds and stays, its current row lit.
    const recAts = [changed, decided];
    rows.forEach(([y, color, at], i) => {
      const lit = speaking(t, recAts, i);
      line(rx + 18, y, mix(rx + 18, rx + rw - 22, clamp((t - at - .6) / .4)), y, {color, alpha: five * ramp(t, at + .55, .2), width: 3 + 1.5 * lit});
      nameText(en ? ["Change", "Decision"][i] : ["变化", "决定"][i], rx + rw + NAME_GAP, y, {align: "left", color: i ? P.authority : P.ink,
        alpha: five * listIn(t, recAts, i), set: "recorded"});
    });
  }
};

/* ---------------- 16 deliver: name the state, not the effort ---------------- */
scenes["16"] = function (s, t) {
  const [report, effortWord, unframed, planned, executing, awaiting] = cues(s, [["说做到哪一步", "report the state"], ["不说花了多少力气", "not the effort"], ["叫未界定", "work is unframed"],
    ["叫已计划", "it is planned"], ["叫执行中", "it is executing"], ["叫待核验", "awaiting verification"]]);
  const verified = cue(s, "叫已核验", "verified", {last: true});
  const [accepted, published, inUse, observed, almost, almostWord, blocked] = cues(s, [["才叫已验收", "accepted"],
    ["发布到约定的地方", "published at the agreed destination"], ["有人在用", "mean in use"], ["实际看到了什么", "actually observed"], ["别把执行中", "work that's executing"],
    ["快做完了", "almost done"], ["受阻时", "when blocked"]]);
  const base = ramp(t, opening(s), .7), firstCondition = cue(s, "问题", "the problem");
  // The six states are stations on one rail, in the order work moves through them, and the work is a card that rides
  // the rail: the station it stands at is its state.
  const RY = 620, xs = [320, 576, 832, 1088, 1344, 1600], CW = 150, CH = 110, CT = RY - 24 - CH;
  const card = (x, a) => box(x - CW / 2, CT, CW, CH, {fill: P.row, stroke: P.ink, alpha: a, radius: 10, width: 2.5});
  // 1. Report the state, not the effort (in Chinese, how far the work has got, not how much effort it took). The rail of
  // states and the state's name at its first station arrive on the words that say to report the state. The usual report
  // of effort, a bar at 90%, stands above the rail and is refused on its words. The work's card enters with the first
  // thing it lacks.
  const one = base * stageOut(t, firstCondition);
  if (one > 0) {
    const on = one * named(t, report);
    line(xs[0] - 140, RY, xs[5] + 140, RY, {color: P.muted, alpha: on, width: 3});
    nameText(L("做到哪一步", "State"), xs[0], RY + NAME_GAP + 18, {valign: "top", color: P.evidence, alpha: on});
    const BX = 560, BW = 1100, BY = 420, refuse = ramp(t, effortWord + .05, .3), bar = one * mix(1, .6, refuse);
    box(BX, BY - 25, BW, 50, {stroke: P.muted, alpha: bar, radius: 25});
    // The fill is the line colour stepped toward the ground and the numeral dims by a quarter as the bar is refused, so
    // the numeral keeps 4.5:1 or more against its fill, full or dimmed.
    box(BX, BY - 25, BW * .9, 50, {fill: blend(P.ground, P.line, .85), alpha: bar, radius: 25});
    text("90%", BX + BW * .45, BY + 1, 26, {role: "mark", align: "center", color: P.ink, alpha: one * mix(1, .75, refuse)});
    rejectedName(L("花了多少力气", "Effort"), BX, BY - 25 - NAME_GAP, {align: "left", valign: "bottom", alpha: one * named(t, effortWord), mark: refuse});
  }
  // 2. The card moves on to a state's station only on that state's own words, once it carries what the state needs.
  // Unframed: the problem, the scope and the completion condition (in Chinese, what counts as done) are empty dashed
  // slots on the card, each on its own word. Planned: they are written in as the route (in Chinese, the way of doing it)
  // lights ahead along the rail, and the owner joins the card.
  // Executing: the card turns as it works. Awaiting verification: the deliverable stands on the card, and the closed
  // gate of the checks stands ahead of it. Verified: the checks pass, the gate's mark is ticked and its bar
  // lifts, what the verification holds for is named over it bound by bound, and the card passes through. Accepted: the
  // acceptor stands at the end of the rail and its seal is stamped on the deliverable. Each station fills and
  // is named as the card reaches it, and the states build one list along the rail.
  const two = base * stageIn(t, firstCondition) * stageOut(t, published);
  if (two > 0) {
    const ats = [unframed, planned, executing, awaiting, verified, accepted], colors = [P.ink, P.ink, P.ink, P.evidence, P.evidence, P.authority];
    const parts = cues(s, [["问题", "the problem"], ["范围", "scope"], ["怎样算完成", "completion condition"]]);
    const [routeAt, ownerAt, underWay, unchecked, made, passed, acceptor, confirmed] = cues(s, [["有了做法", "a route"], ["负责人", "owner"],
      ["正在做", "under way"], ["核验还没通过", "checks have not passed"], ["交付物有了", "the deliverable"], ["核验通过了", "checks passed"],
      ["有授权的验收人", "an authorized acceptor"], ["确认了", "confirmed by"]]);
    // What the verification holds for: the subject (in Chinese, the subject stated), version, environment and scope
    // or limit.
    const versionAt = cue(s, "版本", "version"), holdsFor = [cue(s, "讲明的对象", "subject"), versionAt, cue(s, "环境", "environment"), cueFrom(s, "限度", "limit", versionAt)];
    // Each move ends before its thought does, so the card rests in the quiet that follows.
    let x = xs[0];
    ats.forEach((at, k) => { if (k) x = mix(x, xs[k], glide(t, at + .05, xs[k] - xs[k - 1])); });
    // The rail, drawn firm so the states' whole way stands from the first words, and the route ahead of the card, which
    // lights along it once the work has one.
    line(xs[0] - 140, RY, xs[5] + 140, RY, {color: P.muted, alpha: two, width: 3});
    const route = drawShare(t, routeAt + .05, xs[5] - xs[0]);
    if (route > 0) line(xs[0], RY, mix(xs[0], xs[5], route), RY, {color: P.ink, alpha: two, width: 3});
    ats.forEach((at, k) => {
      dot(xs[k], RY, 11, {color: colors[k], alpha: named(t, at) * two});
      ring(xs[k], RY, 21, {color: colors[k], alpha: speaking(t, ats, k) * restMark(colors[k], .6) * two, width: 2});
    });
    // The English state awaiting verification stands whole on one line, which its neighbours' short names leave room for.
    railNames(en ? ["Unframed", "Planned", "Executing", ["Awaiting verification"], "Verified", "Accepted"] : ["未界定", "已计划", "执行中", "待核验", "已核验", "已验收"],
      xs, RY, {alpha: i => two * listIn(t, ats, i), color: i => colors[i], set: "states"});
    // The checks are a gate across the rail between awaiting verification and verified: a bar hanging from a post that
    // carries the gate's mark and its name. It stands closed from the words that say the checks have not passed; on the
    // words that pass the checks its mark is ticked and its bar lifts into the post, which stays over the open way.
    const GX = (xs[3] + xs[4]) / 2, GT = CT - 92, MY = GT - 60, gate = named(t, unchecked) * two, open = drawShare(t, passed + .05, RY + 26 - GT, .6), tick = ramp(t, passed + .05, .4);
    line(GX, MY + 20, GX, GT, {color: P.line, alpha: gate, width: 3});
    if (open < 1) line(GX, GT, GX, mix(RY + 26, GT, open), {color: P.unknown, alpha: gate * clamp((1 - open) / .15), width: 4});
    ring(GX, MY, 20, {color: P.line, alpha: gate * (1 - tick), width: 2.5});
    ring(GX, MY, 20, {color: P.evidence, alpha: gate * tick, width: 3});
    check(GX, MY + 1, 20, {alpha: gate, upto: tick});
    // The mark's names keep the name gap from its dashed scope: the checks beside it, and what the verification holds
    // for over the mark and its name together.
    const SR = 31 + 1, checksName = L("核验", "Checks"), groupMid = GX + (NAME_GAP + measure(checksName)) / 2;
    nameText(checksName, GX + SR + NAME_GAP, MY, {align: "left", alpha: gate});
    // What the verification holds for closes round its mark one quarter per limit as each is named, a dashed scope it
    // stays inside.
    holdsFor.forEach((at, k) => path(Array.from({length: 9}, (_, j) => {
      const a = -Math.PI / 2 + k * Math.PI / 2 + .08 + j * (Math.PI / 2 - .16) / 8;
      return [GX + 31 * Math.cos(a), MY + 31 * Math.sin(a)];
    }), {color: P.evidence, alpha: gate * ramp(t, at - .1, .3), width: 2, dash: [5, 5]}));
    const bounds = L(["讲明的对象", "、版本", "、环境", "和限度"], ["Subject", ", version", ", environment", " and limit"]);
    growName(t, bounds, holdsFor, groupMid - measure(bounds.join("")) / 2, MY - SR - NAME_GAP, {valign: "bottom", color: P.evidence, alpha: two});
    // The card turns while it executes, from "under way" until the deliverable exists.
    const busy = ramp(t, underWay + .05, .3) * (1 - ramp(t, made + .05, .3)) * two;
    if (busy > 0) for (let k = 0; k < 3; k++) { const a = voiceTime(t) * 2.4 + k * 2.09; stroke(() => ctx.arc(x, CT + CH / 2, 82, a, a + 1.2), {color: P.ink, alpha: busy * .8, width: 2.5}); }
    card(x, two);
    // The parts that frame the work: empty dashed slots while they are missing, written in as the work gains its route.
    // Their name stands over the card from their words; once the card moves on, it names what the unframed state lacks,
    // so it stays over the first station while the states it heads stand, risen 64 px on the route's words so the card's
    // turning and its deliverable pass under it. The slots stand close under it, so the name reaches all three.
    const framed = soon(t, routeAt + .05, .5), lx = x - CW / 2 + 20;
    parts.forEach((at, k) => {
      const y = CT + 22 + k * 24, w = [100, 74, 90][k];
      box(lx, y - 8, w, 16, {stroke: P.unknown, alpha: named(t, at) * (1 - framed) * two, radius: 4, width: 2, dash: [5, 5]});
      if (framed > 0) line(lx, y, lx + w * framed, y, {color: P.ink, alpha: two, width: 4});
    });
    growName(t, L(["问题", "、范围", "或怎样算完成"], ["The problem", ", scope", " or completion condition"]), parts, xs[0] - CW / 2,
      CT - NAME_GAP - 64 * soon(t, routeAt + .05, .6), {valign: "bottom", color: P.unknown, alpha: two});
    // The owner walks beside the card from its words; the deliverable stands on the card from its words, its lines ruled
    // as one stroke, one page, and the acceptor's seal is stamped on it once the acceptor has confirmed.
    person(x - CW / 2 - 38, RY - 27, {alpha: named(t, ownerAt) * two});
    s17Page(x - 32, CT - 76, 64, 84, {alpha: named(t, made) * two, rows: 3});
    const stamp = ramp(t, Math.max(acceptor, confirmed) + .05, .3) * two;
    if (stamp > 0) { dot(x, CT - 32, 23, {color: P.row, alpha: stamp}); seal(x, CT - 32, mix(30, 22, stamp), {alpha: stamp}); }
    person(xs[5] + CW / 2 + 44, RY - 27, {color: P.authority, alpha: named(t, acceptor) * two, size: 1.1});
  }
  // 3. Published is not in use (in Chinese, not someone using it). Two frames stand side by side about the centre: the
  // work at its agreed destination, and the work in use. The way from one to the other stops at a bar, named with the
  // words that refuse it; the claim of use rests on what was observed, an eye below the in-use frame, arriving with its
  // name and joined to the frame by one link.
  const three = base * stageIn(t, published) * stageOut(t, almost);
  if (three > 0) {
    const fy = 380, fh = 190, fw = 300, lx = 450, ax = 1170, mid = fy + fh / 2, ex = ax + fw / 2, ey = fy + fh + 80;
    // The in-use frame comes with the words that compare the two, and its name on its own words.
    const notSame = cue(s, "不代表", "does not mean"), use = ramp(t, notSame - .15, .4);
    box(lx, fy, fw, fh, {stroke: P.ink, alpha: three, radius: 10});
    box(ax, fy, fw, fh, {stroke: P.evidence, alpha: three * use, radius: 10});
    nameText(L("发布到约定的地方", "Published at the agreed destination"), lx, fy - NAME_GAP, {align: "left", valign: "bottom", width: 480, alpha: three * named(t, published)});
    nameText(L("有人在用", "In use"), ax, fy - NAME_GAP, {align: "left", valign: "bottom", color: P.evidence, alpha: three * named(t, inUse)});
    // The deliverable sits in its agreed place; in use, a person works with the same deliverable.
    documentIcon(lx + fw / 2 - 42, mid - 54, 84, 108, {alpha: three * ramp(t, published - .1, .4), rows: 3});
    documentIcon(ax + fw / 2 - 92, mid - 54, 84, 108, {alpha: three * use, rows: 3});
    person(ax + fw / 2 + 80, mid + 6, {alpha: three * use, color: P.evidence, size: 1.3});
    // The way across stops halfway at a bar on the words that refuse it.
    const go = soon(t, notSame - .05, .6);
    link(lx + fw + 12, mid, ax - 12, mid, {color: P.unknown, alpha: three * ramp(t, notSame - .05, .3), upto: .46 * go, end: false, dash: [8, 8]});
    line(960, mid - 30, 960, mid + 30, {color: P.unknown, alpha: ramp(t, notSame + .3, .3) * three, width: 4});
    nameText(L("不代表", "does not mean"), 960, mid + 30 + NAME_GAP, {valign: "top", size: NOTE, color: P.muted, alpha: three * named(t, notSame)});
    // To claim use, say what was observed: the eye opens below the in-use frame with its name, and its link rises to the
    // frame.
    const eye = ramp(t, observed - .15, .4) * three, lid = soon(t, observed - .15, .6), look = Math.sin((voiceTime(t) - voiceTime(observed)) * 2.2) * 8 * lid;
    stroke(() => ctx.ellipse(ex, ey, 40, mix(4, 20, lid), 0, 0, Math.PI * 2), {color: P.evidence, alpha: eye, width: 2.5});
    dot(ex + look, ey, 8 * lid, {color: P.evidence, alpha: eye});
    link(ex, ey - 28, ex, fy + fh + 10, {color: P.evidence, alpha: eye, draw: {t, at: observed - .05}});
    nameText(L("实际看到了什么", "What was actually observed"), ex, ey + 22 + NAME_GAP, {valign: "top", color: P.evidence, alpha: three * named(t, observed)});
  }
  // 4. Executing is not almost done; blocked work says what it lacks. The work stands on its lane, turning while it is
  // executing, its state named above it and the claim of almost done refused beside the state. When it is blocked a bar
  // closes the lane ahead and the turning stops and fades; the report hangs from the work in one column that grows item
  // by item, the escalation reaching the person it goes to.
  const four = base * stageIn(t, almost);
  if (four > 0) {
    const AY = 430, TX = 880, BAR = 942, called = cueFrom(s, "执行中", "executing", almost);
    const [gapAt, impactAt, escAt] = cues(s, [["缺什么", "the gap"], ["影响什么", "its impact"], ["报给了谁", "the escalation"]]);
    // The work's lane is drawn firm, the way ahead of it dashed, so the lane stands across the frame from its words.
    line(300, AY, TX, AY, {color: P.muted, alpha: four, width: 3});
    dashed(TX, AY, 1620, AY, {color: P.muted, alpha: four, width: 3});
    // The work turns while it executes and stops turning on the word that blocks it: its turning marks stop and fade
    // out with the stop, so no stilled turn stands beside the work waiting for the report to name it.
    const halted = mix(.8, 0, ramp(t, blocked + .05, .4));
    for (let k = 0; k < 3; k++) { const a = voiceTime(Math.min(t, blocked + .05)) * 2.4 + k * 2.09; stroke(() => ctx.arc(TX, AY, 32, a, a + 1.2), {color: P.ink, alpha: four * halted, width: 2.5}); }
    box(TX - 17, AY - 17, 34, 34, {fill: P.ink, alpha: four, radius: 7});
    const head = nameText(L("执行中", "Executing"), TX, AY - 40 - NAME_GAP, {valign: "bottom", alpha: four * named(t, called)});
    const wide = measure(L("执行中", "Executing"), LABEL);
    rejectedName(L("“快做完了”", "“Almost done”"), TX + wide / 2 + 48, (head.top + head.bottom) / 2, {align: "left", alpha: four * named(t, almostWord), mark: ramp(t, almostWord + .5, .4)});
    line(BAR, AY - 34, BAR, AY + 34, {color: P.unknown, alpha: ramp(t, blocked + .05, .3) * four, width: 4});
    // The report hangs from the work: its line reaches down to each item as the item is named, and the item's mark
    // fills there.
    const ats = [gapAt, impactAt, escAt], tops = stackTops([0, 1, 2].map(() => labelSize(LABEL)), 585, 40), ys = tops.map(v => v + labelSize(LABEL) / 2);
    const reach = ys.reduce((y, to, i) => mix(y, to, soon(t, ats[i] - .1, .45)), AY + 40);
    if (reach > AY + 41) line(TX, AY + 40, TX, reach, {color: P.line, alpha: four, width: 2});
    const report = en ? ["The gap", "Its impact", "The escalation"] : ["缺什么", "影响什么", "报给了谁"];
    ys.forEach((y, i) => {
      dot(TX, y, 10, {color: P.unknown, alpha: ramp(t, ats[i] - .1, .3) * four});
      ring(TX, y, 19, {color: P.unknown, alpha: speaking(t, ats, i) * restMark(P.unknown, .6) * four, width: 2});
      nameText(report[i], TX + 10 + NAME_GAP + 8, y, {align: "left", alpha: four * listIn(t, ats, i), set: "blocked report"});
    });
    // The escalation reaches the person it goes to.
    const escEnd = TX + 40 + measure(report[2], LABEL) + 24, PX = 1400;
    link(escEnd, ys[2], PX - 40, ys[2], {color: P.authority, alpha: four * ramp(t, escAt - .05, .3), draw: {t, at: escAt - .05}});
    person(PX, ys[2] + 4, {color: P.authority, alpha: four * ramp(t, escAt + .3, .4), size: 1.1});
  }
};

/* ---------------- 17 deliver: evidence sets the limit of the claim ---------------- */
/* A page of my scenes: the document icon with its text rows ruled as one stroke, set where the icon sets them, so a
 * page's lines read, and count, as one block of text rather than as separate marks. */
function s17Page(x, y, w, h, {alpha = 1, stroke: edge = P.ink, rows = 4, fillColor = P.row, fold = true} = {}) {
  if (alpha < .01) return;
  documentIcon(x, y, w, h, {alpha, stroke: edge, rows: 0, fillColor, fold});
  if (rows > 0) stroke(() => {
    for (let i = 0; i < rows; i++) { const ry = y + h * (.3 + i * .55 / Math.max(1, rows)); ctx.moveTo(x + w * .14, ry); ctx.lineTo(x + w * (i % 2 ? .62 : .82), ry); }
  }, {color: P.muted, alpha: alpha * .8, width: 2});
}
/* The completion stamp of 17.1: one quiet ring standing from the claim's first words, open by a hair at its top, with
 * its check waiting in it, quiet, and its name. Each condition lights one arc of the ring where its row meets it, the
 * arc spreading from that point to its ends, so completion reads as the sum of its conditions; the arcs tile the ring,
 * and the check is struck when all six have lit. The lit arcs of one colour are one stroke, so the lit ring reads, and
 * counts, as one part of the stamp rather than as arcs each waiting for a name. `arcs` are the arcs' extents in
 * degrees, clockwise from the right, and `meets` the angles where their rows meet the ring. */
function s17Stamp(x, y, r, arcs, meets, lights, colors, {alpha = 1, struck = 0} = {}) {
  ring(x, y, r, {color: P.line, alpha: alpha * .9, width: 4, start: -Math.PI / 2 + .04, upto: 1 - .08 / (2 * Math.PI)});
  [...new Set(colors)].forEach(color => {
    if (!arcs.some((_, k) => colors[k] === color && lights[k] > 0)) return;
    stroke(() => arcs.forEach(([a, b], k) => {
      if (colors[k] !== color || lights[k] <= 0) return;
      const m = meets[k], a0 = (m - (m - a - 1.5) * lights[k]) * Math.PI / 180, a1 = (m + (b - 1.5 - m) * lights[k]) * Math.PI / 180;
      ctx.moveTo(x + r * Math.cos(a0), y + r * Math.sin(a0)); ctx.arc(x, y, r, a0, a1);
    }), {color, alpha, width: 8});
  });
  check(x, y - 22, r * .5, {color: P.line, alpha: alpha * .7});
  check(x, y - 22, r * .5, {alpha, upto: struck});
}
scenes["17"] = function (s, t) {
  const complete = cue(s, "才能说完成", "say complete"), questions = cue(s, "每次说完成", "every completion claim");
  const nots = cues(s, [["测试通过", "a passing test"], ["智能体说完成了", "an agent reporting"]]);
  const [missing, narrow] = cues(s, [["证据不够", "when evidence is missing"], ["收窄说法", "narrow the claim"]]);
  const base = ramp(t, opening(s), .7);
  // 1. Say complete only when every condition holds. The claim stands at the centre from the first words: a stamp whose
  // ring is six quiet arcs, one per condition, under the name of the rule. The conditions then build round it in two
  // columns read row by row, each a key term with its qualifier on its own words and a box that is ticked when the
  // condition is said to hold; a link then runs from the box into the condition's arc, which lights. When the sixth
  // arc lights, the stamp's check is struck. The six stay whole across both thoughts and hand the picture to the
  // claim's questions in one cut. While the first condition stands alone at the upper left, the whole stage stands to
  // the right, so the two are balanced within 70 px of the centre; it returns, to within 15 px of the centre, as the
  // second condition arrives, and as the fourth, the widest, arrives it moves on to stand centred on its finished
  // columns.
  // Each row: its key term and the word that begins it, its qualifier and its word, and the words that say it holds. A
  // term given as lines keeps them, one under the other, in its column. The risks, limits, uncovered cases and follow-up
  // owners stand in two lines broken at the clause, the Chinese second line keeping the comma that leads to its
  // qualifier 都已记录, so its block keeps the last line's share; as that row fits beside no qualifier, both editions set
  // every qualifier under its term.
  const rows = (en ? [
    ["Deliverable", "the deliverable", "at the agreed location", "at the agreed location", "is at the agreed location"],
    ["Completion criteria", "every completion criterion", "all met", "is met", "is met"],
    ["Current verification", "current verification", "matching the claim, passed", "matching the claim", "has passed"],
    [["Risks, limits, uncovered cases", "and follow-up owners"], "risks", "recorded", "are recorded", "are recorded"],
    ["Agreed state", "the agreed state", "reached", "is reached", "is reached"],
    ["Human acceptance", "human acceptance", "where required", "where human acceptance", "has accepted it"]]
  : [
    ["交付物", "交付物", "在约定的位置", "在约定的位置", "在约定的位置"],
    ["每条完成标准", "每条完成标准", "达到了", "达到了", "都达到了"],
    ["当前的核验", "当前的核验", "对得上说法，已跑过", "对得上说法", "也通过了"],
    [["风险、限度、没覆盖到的情况，", "以及后续由谁负责，"], "风险", "都已记录", "都已记录", "都已记录"],
    ["约定的状态", "约定的状态", "达到了", "达到了约定的状态", "达到了约定的状态"],
    ["验收人", "验收人", "需要时已验收", "需要人来验收", "已验收"]])
    .map(([term, termCue, qual, qualCue, holdCue]) => [[].concat(term), cue(s, termCue, termCue), qual, cue(s, qualCue, qualCue), cue(s, holdCue, holdCue)]);
  // A row builds from the first of its words; its box stands with its key term, the name that stands beside it.
  const starts = rows.map(([, termAt, , qualAt]) => Math.min(termAt, qualAt)), marks = rows.map(([, termAt]) => termAt);
  const holds = rows.map(([, termAt, , qualAt, holdAt]) => Math.max(termAt, qualAt, holdAt)), done = holds[5];
  const g1 = base * stageOut(t, questions);
  if (g1 > 0) {
    const SY = 525, R = 225, GY = 160, BXo = 320, width = 460, first = s.words[0].start;
    const colors = rows.map((_, r) => r === 5 ? P.authority : P.evidence);
    const termW = term => measure(term.join(" "), LABEL), inline = rows.every(([term, , qual]) => termW(term) + TERM_GAP + measure(qual, NOTE) <= width);
    // A term of lines is set on them: no line holds two of them, whatever the font's widths.
    const wrapAt = term => term.length > 1 ? 0 : width;
    // How far each row's block reaches from its box. While the first row stands alone the stage leans right by what
    // keeps the pair within 70 px of the centre; once the second has come it leans at most 15 px toward its shorter
    // column, so the finished columns stand nearer the centre.
    const blockW = ([term, , qual]) => inline ? termW(term) + TERM_GAP + measure(qual, NOTE)
      : Math.max(...growTexts(term, wrapAt(term)).map(line => line.reduce((w, [, v]) => w + measure(v), 0)), measure(qual, NOTE));
    const reach = side => Math.max(...rows.filter((_, r) => r % 2 === side).map(blockW));
    const lean = Math.max(0, (BXo + 14 + NAME_GAP + blockW(rows[0]) - R) / 2 - 70), finish = (reach(0) - reach(1)) / 2, settle = Math.max(-15, Math.min(15, finish));
    // The Chinese first thought ends with three rows, two in the left column, so the stage glides right as the third
    // arrives, to stand centred between the left column and the right one's single row, and back as the next thought
    // begins.
    const d3 = en ? 0 : (Math.max(blockW(rows[0]), blockW(rows[2])) - blockW(rows[1])) / 2 - settle;
    const third = en ? 0 : d3 * (glide(t, starts[2] + .05, d3) - glide(t, cue(s, "另外", "") + .05, d3));
    const SX = 960 + lean * glide(t, starts[0] + .05, lean) + (settle - lean) * glide(t, starts[1] + .05, settle - lean)
      + (finish - settle) * glide(t, starts[3] + .05, finish - settle) + third;
    // Each row meets the ring at the angle of its own height, and its arc reaches halfway to its neighbours' angles.
    const meet = Math.asin(GY / R) * 180 / Math.PI, top = 180 + meet, low = 180 - meet;
    const arcs = [[(top + 180) / 2, 270], [270, (360 - meet + 360) / 2], [(low + 180) / 2, (top + 180) / 2], [-meet / 2, meet / 2], [90, (low + 180) / 2], [meet / 2, 90]];
    const meets = [top, 360 - meet, 180, 0, low, meet];
    // When the last condition holds, the stamp is struck and the whole list returns to full ink with it. An arc lights
    // once its link has reached it, and has lit before its thought ends, so no arc changes in the quiet that follows.
    const struck = ramp(t, done + .05, .55), place = ramp(t, opening(s) + .2, .6) * g1;
    s17Stamp(SX, SY, R, arcs, meets, holds.map(at => ramp(t, Math.min(at + .45, thoughtEnd(at) - .3), .3)), colors, {alpha: place, struck: struck * g1});
    nameText(L("完成", "Complete"), SX, SY + 70, {alpha: g1 * named(t, complete)});
    // The rule is named from the scene's first words, so the scene cuts in with its claim in view.
    const allAt = cue(s, "这些条件全都满足", "every condition holds");
    nameText(L("这些条件全都满足", "Every condition holds"), SX, SY - R - NAME_GAP, {valign: "bottom", alpha: g1 * ramp(t, Math.max(allAt - 1.3, first - .25), .3)});
    rows.forEach(([term, termAt, qual, qualAt], r) => {
      const side = r % 2 ? 1 : -1, dy = (Math.floor(r / 2) - 1) * GY, y = SY + dy, mx = SX + side * BXo, lit = speaking(t, marks, r);
      box(mx - 14, y - 14, 28, 28, {stroke: colors[r], alpha: named(t, marks[r]) * g1, radius: 5, width: 2.5});
      if (lit > 0) box(mx - 21, y - 21, 42, 42, {stroke: colors[r], alpha: lit * restMark(colors[r], .6) * g1, radius: 8, width: 2});
      check(mx, y, 20, {color: colors[r], alpha: g1, draw: {t, at: holds[r] + .05}});
      // Once the condition holds, its box feeds its arc along one straight run to the ring.
      link(mx - side * 22, y, SX + side * Math.sqrt(R * R - dy * dy), y, {color: colors[r], alpha: g1 * .9, draw: {t, at: holds[r] + .1}});
      // The six set their qualifiers one way, decided once for the list: after the term when every row fits its column,
      // else under it. Each block keeps its column's edge, the box's side: on the left both lines end there.
      const alpha = g1 * Math.max(listLevel(t, starts, r), struck), em = labelSize(LABEL), edge = mx + side * (14 + NAME_GAP);
      const block = termRow(t, term, [termAt], [qual], [qualAt], side > 0 || !inline ? edge : edge - (termW(term) + TERM_GAP + measure(qual, NOTE)),
        y - em / 2, {width: wrapAt(term), inline, align: side > 0 || inline ? "left" : "right", alpha, set: "conditions"});
      // The Chinese verification is said to have passed, 也通过了, after it is said to match and to have run: the pass is
      // the ticked box's own qualifier, a line of its own under the row's on the words that tick the box, so the row
      // keeps the voice's words without one label repeating its caption line whole.
      if (!en && r === 2 && !inline) growName(t, ["也通过了"], [holds[r]], edge, block.bottom + labelSize(NOTE) * (LEADING - 1),
        {size: NOTE, alpha: mutedLevel(alpha), color: P.muted, align: side > 0 ? "left" : "right", set: "conditions", whole: "也通过了"});
    });
  }
  // 2. Every completion claim answers the same questions, and the claim carries its answers. The claim is a card at the
  // centre, standing on the words that open the questions with its completion mark and its wording, sized to them; its
  // wording lights line by line when what it claims is asked. It is pinned on the right to the subject it is about,
  // whose version is tagged, and the verification signs it from the left: who, when and by what method, each mark, name
  // and signature on its own words, in the order they are asked. On the subject, what the claim covers fills, and what
  // is left unproved stays open and dashed with its question marks. The claim holds until the first pair of states is
  // named and hands the picture over in one cut. The card stands centred alone; as the subject is pinned on its right
  // the pair moves left to within 70 px of the centre, and as the first signature arrives on the left the whole claim
  // moves back to stand centred.
  const g2 = base * stageIn(t, questions) * stageOut(t, nots[0]);
  if (g2 > 0) {
    // The Chinese asks what is said about which subject at once, and 谁 is said once before the questions.
    const [claimed, about, versionAt, covered, unproved] = cues(s, [["说的是哪个对象", "what is claimed"], ["哪个对象", "about which subject"],
      ["哪个版本", "version"], ["覆盖了什么", "covering what"], ["还有什么没证明", "leaving what unproved"]]);
    const [who, when, how] = [["谁", "by whom"], ["什么时候", "when"], ["什么方法", "how"]].map(([a, b]) => cueFrom(s, a, b, questions));
    // The subject reaches 110 + 320 px past the card's right edge, the signatures 196 px and their widest name past its
    // left; the card eases left by half the subject's reach as the subject is pinned, so the pair stands centred, and
    // back as the signatures come, each move a glide at the film's pace.
    const CW = 700, CH = 290, CT = 355, CY = CT + CH / 2, OW = 320, OH = 120, OT = CY - OH / 2;
    const signW = Math.max(...[L("谁", "By whom"), L("什么时候", "When"), L("什么方法", "How")].map(v => measure(v)));
    const pairLean = (110 + OW) / 2, wholeLean = (OW + 110 - 196 - signW) / 2;
    const CL = 960 - CW / 2 - pairLean * glide(t, about + .05, pairLean) + (pairLean - wholeLean) * glide(t, Math.min(who, when, how) + .05, pairLean - wholeLean), OL = CL + CW + 110;
    const on = named(t, questions) * g2;
    box(CL, CT, CW, CH, {fill: P.row, stroke: P.ink, alpha: on, radius: 14, width: 2.5});
    nameText(L("每次说完成", "Every completion claim"), CL + CW / 2, CT - NAME_GAP, {valign: "bottom", alpha: on});
    ring(CL + 120, CY, 66, {color: P.evidence, alpha: on, width: 3.5});
    check(CL + 120, CY + 3, 60, {alpha: on});
    // What is claimed: the claim's wording stands with it and lights, line by line, when what it claims is asked.
    [400, 320, 360].forEach((w, k) => {
      const y = CY - 80 + k * 80, lit = soon(t, claimed + .05 + k * .2, .4);
      line(CL + 230, y, CL + 230 + w, y, {color: blend(P.muted, P.ink, lit), alpha: on, width: 6});
    });
    // The verification signs the claim from the left: who, when and by what method, each mark and name on its own words,
    // its signature drawn on into the card.
    const signs = [["who", who, L("谁", "By whom")], ["when", when, L("什么时候", "When")], ["how", how, L("什么方法", "How")]].sort((a, b) => a[1] - b[1]);
    const signAts = signs.map(([, at]) => at), IX = CL - 140;
    signs.forEach(([kind, at, v], i) => {
      const y = CY + (i - 1) * 80, q = named(t, at) * g2;
      if (kind === "who") person(IX, y + 4, {alpha: q, size: .85});
      if (kind === "when") clock(IX, y, 22, {hand: .3, alpha: q});
      if (kind === "how") s29Gear(IX, y, 21, {alpha: q});
      link(IX + 34, y, CL - 12, y, {alpha: q, draw: {t, at: at + .05}});
      nameText(v, IX - 34 - NAME_GAP, y, {align: "right", alpha: g2 * listIn(t, signAts, i), set: "signed"});
    });
    // The subject the claim is about: pinned to the claim on its words, its version tagged on its own word.
    const pin = named(t, about) * g2, PY = CY;
    link(CL + CW, PY, OL - 12, PY, {alpha: g2, draw: {t, at: about + .05}});
    box(OL, OT, OW, OH, {fill: P.row, stroke: P.ink, alpha: pin, radius: 8, width: 2.5});
    // The subject's parts, ruled as one comb so they read as one subject.
    stroke(() => { for (let c = 1; c < 5; c++) { ctx.moveTo(OL + c * OW / 5, OT); ctx.lineTo(OL + c * OW / 5, OT + OH); } }, {color: P.line, alpha: pin, width: 1.5});
    nameText(L("哪个对象", "Subject"), OL + OW / 2, OT + OH + NAME_GAP, {valign: "top", alpha: pin});
    const tag = named(t, versionAt) * g2;
    text("v2", OL + OW - 6, OT - 20, 26, {role: "mark", align: "right", color: P.evidence, alpha: tag});
    // What the claim covers fills on its words; what is left unproved stays open, dashed, with its question marks.
    const cover = named(t, covered) * g2, open = named(t, unproved) * g2;
    for (let c = 0; c < 5; c++) {
      const x = OL + c * OW / 5 + 7, w = OW / 5 - 14;
      if (c < 3) {
        // The cover's tint stays a ground for the cell, under 1.8:1 against the frame's ground (1.70:1 over the row at
        // 0.16); the cell's outline carries the evidence colour.
        box(x, OT + 8, w, OH - 16, {fill: P.evidence, alpha: cover * .16, radius: 5});
        box(x, OT + 8, w, OH - 16, {stroke: P.evidence, alpha: cover, radius: 5, width: 2.5});
      } else {
        box(x, OT + 8, w, OH - 16, {stroke: P.unknown, alpha: open, radius: 5, width: 2, dash: [6, 6]});
        text("?", x + w / 2, PY + 1, 26, {role: "mark", align: "center", color: P.unknown, alpha: open});
      }
    }
  }
  // 3. Adjacent states are not each other. Each pair stands in one row of a ledger: the state reached on the left, its
  // mark filled, and the state it does not make on the right, its ring hollow and dashed, each on its own words. The way
  // from one toward the other draws on from the reached mark and stops at the table's gate, one tall bar through the
  // table's whole extent, which stands at the structure tier from the words that deny the first pair, where the first
  // way meets it; each pair's stretch of it takes its colour on the words that deny that pair, so each table of refusals
  // builds and stands instead of its rows replacing each other, and stands as tall as it will be once its first pair
  // has been refused. Both editions say two pairs, the passing test and the Agent's report (English in one thought,
  // Chinese in two), so one table holds them until missing evidence is named. The table balances on the frame: it grows
  // about the content centre, its first row on the centre line and the first row stepping up by half a row as the words
  // that bring the second begin, and it stands centred across on the rows said so far.
  // In English the passing test's bar stands on "proves neither", and the Agent's on "does not".
  const stopWords = en ? ["proves neither", "does not"] : ["不等于", "也不代表"];
  const stops = nots.map((at, i) => cueFrom(s, stopWords[i], stopWords[i], at));
  // A reached state given as lines would keep them, one under the other, each ending at the column's edge; every state
  // stands on one line, as said, the Chinese Agent's report among them.
  const left = en ? [[["A passing test"], []], [["An Agent reports completion"], []]] : [[["测试通过"], []], [["智能体说完成了"], []]];
  const right = en ? [["Overall correctness or acceptance", "overall correctness"], ["Work complete", "work complete"]]
    : [["整体正确或已验收", "整体正确或已验收"], ["完成了", "完成了"]];
  const rightAts = right.map(([, v], i) => cueFrom(s, v, v, stops[i]));
  // A reached state's qualifier stands under its name, so the name stands beside its mark from its own words.
  const termW = ([term]) => (term.length > 1 ? Math.max(...term.map(v => measure(v, LABEL))) : measure(term.join(""), LABEL)) + 1;
  const rowW = ([term, qual]) => Math.max(termW([term]), qual.length ? measure(qual.join(""), NOTE) : 0);
  // The ledger is laid out from its widest names across most of the frame and centred on the content centre.
  const wL = Math.max(...left.map(rowW)), wR = Math.max(...right.map(([v]) => measure(v, LABEL)));
  const DOT = 15, RING = 20, LINK = Math.max(380, 1440 - wL - wR - 2 * NAME_GAP - DOT - RING);
  const x0 = 960 - (wL + NAME_GAP + DOT + LINK + RING + NAME_GAP + wR) / 2;
  const DL = x0 + wL + NAME_GAP + DOT, DR = DL + LINK, BAR = DL + LINK / 2;
  const from = DL + DOT + 8, to = DR - RING - 8, reach = (BAR - 8 - from) / (to - from);
  // The pair being said lights its reached mark; a light that would end in the quiet between thoughts waits for words.
  const litAts = nots.map(v => pauseHold(v - .15, .3) + .15);
  // One table: its rows, their heights now and once all are said, its fade, its sets' key, and the word on which its
  // names are whole again. A table stands centred on its own names, from its widest reached state to its widest state
  // not made, so a table of shorter names keeps the columns' spacing and still balances on the frame; it counts the
  // reached states said so far, and glides to stay centred as a wider one arrives.
  const ledger = (rows, ys, last, a, key, whole) => {
    const reachedAts = rows.map(i => nots[i]), notAts = rows.map(i => rightAts[i]), lights = rows.map(i => litAts[i]);
    const spanR = Math.max(...rows.map(i => measure(right[i][0], LABEL)));
    const centreOn = n => 960 - (DL - DOT - NAME_GAP - Math.max(...rows.slice(0, n).map(i => rowW(left[i]))) + DR + RING + NAME_GAP + spanR) / 2;
    const shift = rows.slice(1).reduce((v, i, k) => { const d = centreOn(k + 2) - centreOn(k + 1); return v + d * glide(t, nots[i] - .1, d); }, centreOn(1));
    ctx.save(); ctx.translate(shift, 0);
    line(BAR, last[0] - 50, BAR, last.at(-1) + 50, {color: P.line, alpha: ramp(t, stops[rows[0]] + .05, .3) * a, width: 4});
    rows.forEach((i, k) => {
      const [term, qual] = left[i], y = ys[k], lit = speaking(t, lights, k);
      dot(DL, y, DOT + 1, {color: P.evidence, alpha: ramp(t, nots[i] + .05, .3) * a});
      if (lit > 0) ring(DL, y, DOT + 9, {color: P.evidence, alpha: lit * restMark(P.evidence, .6) * a, width: 2});
      ring(DR, y, RING, {color: P.muted, alpha: named(t, rightAts[i]) * a, width: 2.5, dash: [6, 6]});
      link(from, y, to, y, {alpha: a, upto: reach, draw: {t, at: nots[i] + .05, least: Math.max(.4, stops[i] - nots[i])}, end: false});
      line(BAR, y - 50, BAR, y + 50, {color: P.unknown, alpha: ramp(t, stops[i] + .05, .3) * a, width: 4});
      const qualAts = qual.length ? [cueFrom(s, qual[0], qual[0], nots[i])] : [];
      // A name of one line starts where its width ends it at the column's edge; a name of lines ends each at that edge.
      const lines = term.length > 1;
      termRow(t, term, [nots[i]], qual, qualAts, DL - DOT - NAME_GAP - (lines ? 1 : rowW(left[i])), y - labelSize(LABEL) / 2,
        {width: lines ? 0 : termW(left[i]), align: lines ? "right" : "left", alpha: a * Math.max(listLevel(t, reachedAts, k), ramp(t, whole + .05, .25)), set: `reached ${key}`});
      // The states not made return to full ink together on the last one's key word, before the thought ends.
      nameText(right[i][0], DR + RING + NAME_GAP, y, {align: "left", color: P.muted, set: `not made ${key}`,
        alpha: a * named(t, rightAts[i]) * Math.max(listLevel(t, notAts, k), ramp(t, whole + .05, .25))});
    });
    ctx.restore();
  };
  const g3 = base * stageIn(t, nots[0]) * stageOut(t, missing);
  if (g3 > 0) {
    const grown = soon(t, pauseHold(nots[1] - .3, .4), .4), row = n => [0, 1].map(k => CONTENT_CY + 160 * (k - n / 2));
    ledger([0, 1], row(grown), row(1), g3, "all", cueFrom(s, "完成了", "complete", rightAts[1]));
  }
  // 4. When evidence is missing, the claim narrows to it. A row of evidence stands on the words that say evidence is
  // missing: the evidence that exists is checked, and what is missing stays a dashed, open
  // outline with a question mark. The claim stands as one card over the row on the words that narrow it, its wording
  // filling it, and draws in to the evidence's limit, leaving its larger extent as an open dashed trace.
  const g4 = base * stageIn(t, missing);
  if (g4 > 0) {
    const n = 6, have = 4, cw = 164, gap = 24, x0 = 960 - (n * cw + (n - 1) * gap) / 2, full = x0 + n * cw + (n - 1) * gap;
    const limit = x0 + have * cw + (have - 1) * gap, CT = 356, CHt = 96, ET = 500, EH = 140;
    const evidence = cue(s, "证据不够", "evidence");
    const right = mix(full, limit, glide(t, narrow + .05, full - limit)), claimOn = named(t, narrow);
    // The extent the claim gives up stays as an open trace beyond the limit.
    path([[limit + 12, CT], [full - 12, CT], [full, CT + 12], [full, CT + CHt - 12], [full - 12, CT + CHt], [limit + 12, CT + CHt]],
      {color: P.line, alpha: g4 * soon(t, narrow + .05, .9), width: 2, dash: [8, 8]});
    // The claim stands on its words and narrows.
    box(x0, CT, right - x0, CHt, {fill: P.row, stroke: P.ink, alpha: g4 * claimOn, radius: 12, width: 3});
    // The claim's wording: two lines of words that fill it and narrow with it.
    line(x0 + 34, CT + 26, right - 34, CT + 26, {color: P.muted, alpha: g4 * claimOn, width: 6});
    line(x0 + 34, CT + 70, right - 130, CT + 70, {color: P.muted, alpha: g4 * claimOn, width: 6});
    for (let i = 0; i < n; i++) {
      const x = x0 + i * (cw + gap), cx = x + cw / 2, cy = ET + EH / 2;
      if (i < have) {
        box(x, ET, cw, EH, {fill: P.row, stroke: P.evidence, alpha: g4, radius: 10, width: 2.5});
        check(cx, cy + 2, 48, {alpha: g4});
      } else {
        box(x, ET, cw, EH, {stroke: P.line, alpha: g4, radius: 10, width: 2, dash: [6, 6]});
        ring(cx, cy, 24, {color: P.unknown, alpha: g4 * ramp(t, missing + .05, .3), width: 2.5, dash: [4, 4]});
        text("?", cx, cy + 1, 26, {role: "mark", align: "center", color: P.unknown, alpha: g4 * ramp(t, missing + .05, .3)});
      }
    }
    nameText(L("证据", "Evidence"), x0, ET + EH + NAME_GAP, {align: "left", valign: "top", color: P.evidence, alpha: g4 * named(t, evidence)});
    nameText(L("收窄说法", "Claim"), x0, CT - NAME_GAP, {align: "left", valign: "bottom", alpha: g4 * claimOn});
  }
};

/* ---------------- 18 deliver: the working loop ---------------- */
scenes["18"] = function (s, t) {
  // The loop is named from just before the first words of the clause that names it, within the 0.3 s a name may lead its
  // clause. The Chinese clause opens on 就, a second into its thought, so its name leads a little more and the picture
  // still gives way within the thought's first second.
  const loopWord = cue(s, "就是一个工作循环", "runs as a loop");
  const steps = cues(s, [["界定", "frame"], ["分析", "analyze"], ["决定", "decide"], ["执行", "execute"], ["核验", "verify"], ["总结", "learn"]]);
  const [evidence, risk, review, judgment] = cues(s, [["证据或风险", "evidence or risk"], ["风险变了", "risk changes"],
    ["重新看", "review the judgment"], ["受影响的判断", "judgment it affects"]]);
  const [subject, outcome, bounds, reframe] = cues(s, [["对象、目标", "subject, outcome"], ["目标或边界", "outcome or boundaries"],
    ["边界变了", "boundaries change"], ["才重新界定", "frame the work again"]]);
  const high = cue(s, "影响大", "high-impact");
  const kept = cues(s, [["测试", "the test"], ["监控", "monitor"], ["规则", "rule"], ["恢复办法", "recovery path"]]);
  const [leave, example, agreed, noData, warn] = cues(s, [["现有负责人", "the existing owners"], ["比如修好了昨晚的延迟", "fixing last night's delay"],
    ["约定的时间", "the agreed time"], ["数据还没到", "without the data"], ["告警", "warns when"]]);
  const [effort, directory, report] = cues(s, [["为了证明自己努力过", "to prove effort"], ["没人用的证据目录", "create an evidence directory nobody uses"], ["没人读的报告", "report nobody reads"]]);
  const base = ramp(t, opening(s), .7);
  const before = cue(s, "说完成之前", "before calling"), two = Math.min(high, before);
  const out = stageOut(t, example);
  // 1. The working loop: the ring draws on the first words, which string the steps together into a loop, and is named
  // on the loop's words; each step then takes its station on the ring on its own word, named there, and the step being
  // said lights its mark. Each change stands outside the loop at an end of its top line, named on its first words, and
  // each further part said over it flashes its mark. When evidence or risk changes, its run reaches down into analysis
  // and the arc of the judgment it affects, from analysis to decision, lights; when the subject, outcome or boundaries
  // change, the other run reaches the first step, which lights again.
  // The loop holds until the next thought names the work it asks more of, and hands the picture over in one cut.
  // The two changes are a list said member by member, the right one first, so from the right change's words the loop
  // eases toward the left change's side by as much as centres the loop with the right change, 62 px in Chinese and 114
  // in English, whose right change stands further out, and eases back as the left change comes, so the stage stays
  // balanced while it builds.
  const one = base * stageOut(t, two);
  if (one > 0) {
    const lean = L(62, 114);
    ctx.save(); ctx.translate(-lean * (glide(t, evidence - .1, lean) - glide(t, subject - .1, lean)), 0);
    const cx = 960, cy = CONTENT_CY, R = 270, top = cy - R;
    // The ring draws on from Frame's station and stays open there by a hair, under the station's mark.
    const drawn = ramp(t, opening(s), 1.2);
    ring(cx, cy, R, {color: P.muted, alpha: one, width: 3, start: -Math.PI / 2 + .035, upto: drawn * (1 - .07 / (2 * Math.PI))});
    // The judgment the change affects, the arc from analysis to decision, draws on as the change's run reaches it.
    const affects = Math.max(judgment, review + .55) - .1;
    ring(cx, cy, R, {color: P.evidence, alpha: one * ramp(t, affects, .3), width: 6, start: -Math.PI / 6, upto: 1 / 6, draw: {t, at: affects}});
    // Each side of the ring between the stations carries a quiet point, sized as link() ends a relation of the ring's
    // width, rather than an arrowhead: the way round is read from the steps, named in turn round the ring.
    [0, Math.PI].forEach(a => dot(cx + Math.cos(a) * R, cy + Math.sin(a) * R, 3 + 2.5, {color: P.muted, alpha: one * ramp(t, opening(s) + .6, .4)}));
    nameText(L("工作循环", "A loop"), cx, cy, {color: P.muted, alpha: one * named(t, loopWord - L(.34, .25))});
    // The loop is not mandatory separate stages: that reading is refused under the loop's name on its words.
    const stagesAt = cue(s, "必须分开走的阶段", "mandatory separate stages");
    rejectedName(L("必须分开走的阶段", "Mandatory separate stages"), cx, cy + 56, {alpha: one * named(t, stagesAt), mark: ramp(t, stagesAt + .25, .35)});
    const names = en ? ["Frame", "Analyze", "Decide", "Execute", "Verify", "Learn"] : ["界定", "分析", "决定", "执行", "核验", "总结"];
    steps.forEach((at, i) => {
      const a = -Math.PI / 2 + i * Math.PI / 3, x = cx + Math.cos(a) * R, y = cy + Math.sin(a) * R, lit = speaking(t, steps, i);
      dot(x, y, 14, {color: P.ground, alpha: one * ramp(t, at - .15, .4)});
      dot(x, y, 14, {color: P.ink, alpha: one * ramp(t, at - .15, .4)});
      if (lit > 0) ring(x, y, 24, {color: P.ink, alpha: lit * .5 * one, width: 2});
      radialName(names[i], cx, cy, R + 14, a, {alpha: one * listIn(t, steps, i), set: "steps"});
    });
    // The changes, at either end of the top line: evidence or risk on the right, over analysis, and the subject, outcome
    // or boundaries on the left, before the first step. Each run draws on from its change on the words that say what
    // to do, and a dot keeps running along it. The changes stand 340 px either side of the centre, the right English one
    // 400 px, since each English name stands whole on one line and the left is the longer, so the two stand balanced once
    // both have come.
    const changes = [
      {x: cx + L(340, 400), ats: [evidence, risk], color: P.evidence, beat: P.unknown, act: review, name: L("证据或风险变了", "Evidence or risk changes"),
        to: [cx + R * Math.cos(Math.PI / 6), cy - R / 2 - 30], route: "hv"},
      {x: cx - 340, ats: [subject, outcome, bounds], color: P.ink, beat: P.ink, act: reframe,
        name: L("对象、目标或边界变了", "Subject, outcome or boundaries change"), to: [cx - 30, top], route: null}];
    changes.forEach(({x, ats, color, beat, act, name, to, route}) => {
      const side = Math.sign(x - cx);
      dot(x, top, 10, {color, alpha: one * ramp(t, ats[0] - .15, .4)});
      beats(t, x, top, 18, ats.slice(1), {color: beat, alpha: one});
      // The changes' names share the top line's baseline with the first step's name, clear of the first step's mark, the
      // line's largest.
      nameText(name, x, top - 14 - NAME_GAP, {valign: "bottom", alpha: one * named(t, ats[0]), set: "changes"});
      link(x - side * 18, top, ...to, {route, width: 3, alpha: one * ramp(t, act + .05, .3), draw: {t, at: act + .05},
        flowing: since(t, act + .75)});
    });
    // The first step lights again once the other run has reached it, and settles before the thought ends.
    ring(cx, top, 24, {color: P.ink, alpha: one * ramp(t, Math.min(reframe + .7, thoughtEnd(reframe) - .35), .3) * .7, width: 3});
    ctx.restore();
  }
  // 2. What the work leaves behind. High-impact or repeated work stands as a stack of its runs, named beside it on its
  // first words, the name and the stack centred as one group so the work fills the picture from those words; its
  // completion stamp stands open on its corner on the words "before calling it complete", and before it is called
  // complete, each tool it needs drops from it on its own noun into one row below, the row reaching out to each tool
  // just before it comes, and the one being said lights its mark. The existing owners, who will maintain the tools, are
  // a frame drawn round them on their name, and the work's stamp is struck once the tools are left with them. The stage
  // holds until the example is named.
  const repeated = cue(s, "反复出现", "repeated");
  const g2 = base * stageIn(t, two) * out;
  if (g2 > 0) {
    const work = en ? ["High-impact", " or repeated work"] : ["影响大", "或反复出现的工作"];
    // The work's name stands at its left, centred on its page, and the page stands as far right of the centre as centres
    // the name and the stack together; the trunk drops from the middle of the stack.
    const WW = 150, WH = 220, WX = 960 + (measure(work.join(""), LABEL) + NAME_GAP - WW - 44) / 2, WY = 312, TX = WX + (WW + 44) / 2;
    const BUS = 582, IY = 656, FY = 606, FH = 175;
    // The row of tools stands centred on the frame as it grows: the first tool drops at its middle, and the row steps
    // left by half its pitch as the row reaches out to each further tool, in 0.5 s, so no name travels 40 px in a frame.
    const lean = kept.slice(1).reduce((v, at) => v + 120 * (1 - glide(t, at - .3, 120)), 0), xs = [600, 840, 1080, 1320].map(x => x + lean);
    // Its runs: the pages behind show only the edges that stand clear of the front page.
    for (let k = 2; k >= 1; k--) path([[WX + k * 22, WY - (k - 1) * 22], [WX + k * 22, WY - k * 22], [WX + WW + k * 22, WY - k * 22], [WX + WW + k * 22, WY + WH - k * 22],
      [WX + WW + (k - 1) * 22, WY + WH - k * 22]], {color: P.ink, alpha: g2, width: 2});
    s17Page(WX, WY, WW, WH, {alpha: g2, rows: 5});
    growName(t, work, [high, repeated], WX - NAME_GAP, WY + WH / 2, {valign: "middle", align: "right", alpha: g2});
    // The stamp on the work's corner stands open on the words before calling it complete, and is struck once the tools
    // are left with the owners.
    const SX = WX + WW, SY = WY + WH, stamp = g2 * ramp(t, before - .15, .4);
    dot(SX, SY, 30, {color: P.ground, alpha: stamp});
    ring(SX, SY, 30, {color: P.ink, alpha: stamp, width: 2.5});
    check(SX, SY + 1, 26, {alpha: stamp, draw: {t, at: leave + .3}});
    // The row reaches out from the work to each tool just before the tool is named, and each drops on its noun.
    // The trunk reaches the row before the row starts to grow, so the row grows out of it from nothing.
    const reach = kept.map((at, i) => drawShare(t, at - .3, Math.abs(xs[i] - TX)));
    link(TX, SY, TX, BUS, {alpha: g2, draw: {t, at: kept[0] - .65}, end: false});
    const left = Math.min(TX, ...xs.map((x, i) => mix(TX, x, reach[i]))), right = Math.max(TX, ...xs.map((x, i) => mix(TX, x, reach[i])));
    if (right - left > 1) line(left, BUS, right, BUS, {color: P.line, alpha: g2, width: 2});
    box(440, FY, 1040, FH, {fill: P.row, stroke: P.ink, alpha: g2 * named(t, leave), radius: 14, width: 2.5});
    kept.forEach((at, i) => {
      const x = xs[i], q = ramp(t, at - .05, .4) * g2, lit = speaking(t, kept, i);
      link(x, BUS, x, IY - 44, {alpha: g2, draw: {t, at: at - .15}, end: false});
      if (lit > 0) ring(x, IY, 46, {color: P.ink, alpha: lit * .5 * g2, width: 2});
      if (i === 0) check(x, IY, 34, {alpha: q});
      if (i === 1) {
        box(x - 30, IY - 22, 60, 44, {stroke: P.ink, alpha: q, radius: 8});
        stroke(() => ctx.arc(x, IY + 10, 14, Math.PI, Math.PI * 2), {color: P.evidence, alpha: q, width: 2.5});
      }
      if (i === 2) s17Page(x - 20, IY - 26, 40, 52, {alpha: q, rows: 3});
      if (i === 3) {
        path([[x + 22, IY - 14], [x - 20, IY - 14], [x - 20, IY + 14], [x + 14, IY + 14]], {color: P.ink, alpha: q, width: 2.5});
        dot(x + 16, IY + 14, 5, {color: P.evidence, alpha: q});
      }
    });
    railNames(en ? ["Test", "Monitor", "Rule", "Recovery path"] : ["测试", "监控", "规则", "恢复办法"], xs, IY + 46,
      {gap: NAME_GAP, alpha: i => g2 * listIn(t, kept, i), set: "kept"});
    termRow(t, [L("现有负责人", "The existing owners")], [leave], [], [], 440, FY + FH + NAME_GAP, {width: 1040, alpha: g2});
  }
  // What not to build cuts in on the words that name its first mark: the motive in Chinese, the directory in English.
  const notBuilt = Math.min(effort, directory);
  const exOut = stageOut(t, notBuilt);
  // 3. The example, on the schedule's timeline in two lanes that share the agreed time. Above, last night: the
  // publication ran past the agreed time, and the delay is marked on its lane and checked once it is fixed. Below, the
  // schedule, standing on its own words, with the monitor left on the agreed time: the data that should have come by
  // then stands as an empty, dashed place on the schedule just before it, on the words that say it has not arrived, and
  // the monitor warns once both its warning and the missing data are said. The case is marked as illustrative while it
  // is shown; it holds until the refusal begins.
  const ex = stageIn(t, example) * base * exOut;
  illustrative(ex);
  if (ex > 0) {
    // The lanes stand high enough that the case, its delay named under its lane, stays balanced on the content centre.
    const YA = 395, YB = 735, AX = 1080, LATE = 1420, MY = YB - 150, TOPV = YA - 90;
    const [delay, fixed, schedule, mWord] = [cue(s, "修好了昨晚的延迟", "last night's delay"), cue(s, "就在调度", "can leave"),
      cue(s, "调度", "schedule"), cueFrom(s, "监控", "monitor", example)];
    // Each lane is a firm axis, so last night's lane carries the case from its first words.
    [[YA, ex], [YB, ex * ramp(t, schedule - .15, .4)]].forEach(([y, a]) => {
      line(300, y, 1620, y, {color: P.muted, alpha: a, width: 3});
      for (let x = 300; x <= 1620; x += 132) line(x, y - 20, x, y + 20, {color: P.muted, alpha: a, width: 2});
    });
    nameText(L("调度", "The schedule"), 300, YB + 20 + NAME_GAP, {align: "left", valign: "top", alpha: ex * named(t, schedule)});
    // The agreed time runs through both lanes as a line in the authority's ink, drawn when it is named.
    line(AX, TOPV, AX, YB + 18, {color: P.authority, alpha: ex * ramp(t, agreed - .15, .4), width: 2});
    nameText(L("约定的时间", "The agreed time"), AX, TOPV - NAME_GAP, {valign: "bottom", color: P.authority, alpha: ex * named(t, agreed)});
    // Last night's delay: the span past the agreed time, which turns quiet and is checked once it is fixed.
    const fix = ramp(t, fixed + .05, .5), late = blend(P.unknown, P.line, fix);
    line(AX, YA, LATE, YA, {color: late, alpha: ex, width: 6});
    dot(LATE, YA, 11, {color: late, alpha: ex});
    // The delay is named under its span, apart from the agreed time's name over the line, with its check after it.
    const dn = L("昨晚的延迟", "Last night's delay"), dw = measure(dn, LABEL), dy = YA + 20 + NAME_GAP;
    nameText(dn, (AX + LATE) / 2, dy, {valign: "top", alpha: ex * named(t, delay)});
    check((AX + LATE) / 2 + dw / 2 + 30, dy + labelSize(LABEL) / 2, 24, {alpha: ex, draw: {t, at: fixed + .05}});
    // The monitor on the agreed time of the schedule arrives on its words; its ground hides the agreed time's line
    // behind it.
    const m = ramp(t, mWord - .15, .4) * ex, warnQ = ramp(t, Math.max(noData, warn) + .05, .3);
    box(AX - 60, MY, 120, 84, {fill: P.ground, stroke: P.ink, alpha: m, radius: 10, width: 2.5});
    stroke(() => ctx.arc(AX, MY + 60, 22, Math.PI, Math.PI * 2), {color: blend(P.evidence, P.unknown, warnQ), alpha: m, width: 3});
    termRow(t, [L("监控", "Monitor")], [mWord], [L("告警", "warns")], [warn], AX + 60 + NAME_GAP, MY + 42 - labelSize(LABEL) / 2, {alpha: ex});
    // The data that should have come by the agreed time: an empty, dashed place on the schedule just before it.
    const DX = AX - 70, dq = ex * ramp(t, noData - .1, .4);
    ring(DX, YB, 14, {color: P.unknown, alpha: dq, width: 2.5, dash: [5, 5]});
    nameText(L("数据还没到", "Without the data"), DX, YB + 20 + NAME_GAP, {valign: "top", alpha: ex * named(t, noData)});
    if (warnQ > 0) for (let k = 0; k < 3; k++) {
      const w = (voiceTime(t) * 1.2 + k / 3) % 1;
      // Each pulse enters and leaves by its length at the unknown's level, centred on the same arc, as a flow's dot
      // enters by its size.
      const p = pass(w, .25);
      ring(AX, MY + 42, 74 + 34 * w, {color: P.unknown, alpha: warnQ * ex * restMark(P.unknown), width: 2.5, start: -Math.PI * (.5 + .3 * p), upto: .3 * p});
    }
  }
  // 4. What not to build: a directory nobody uses and a report nobody reads, made on one desk by one person for the
  // motive. The desk stands from the stage's first mark, so the picture opens wide and centred whichever comes first:
  // the motive in Chinese, the directory in English. Each thing arrives standing on the desk on its own words, refused
  // with its cross, and a dashed way runs out from it to the empty seat of the user it lacks; its maker stands behind
  // the desk at the centre on the motive's words, under a clock whose hand keeps turning, the time spent to prove
  // effort. The item being said lights its frame.
  const no = stageIn(t, notBuilt) * base;
  if (no > 0) {
    // The empty seats stand 100 px beyond the desk's ends. While the first thing and its seat stand without the second,
    // the stage stands 60 px right, so they stand centred with the desk: from the stage's first mark where it is the
    // first thing (in English), and easing there on its words where the motive comes first (in Chinese); it eases back
    // as the second arrives.
    const ats = [directory, report], lean = 60 * ((directory <= notBuilt + 1e-6 ? 1 : glide(t, directory - .1, 60)) - glide(t, report - .1, 60));
    ctx.save(); ctx.translate(lean, 0);
    const DY = 640, W = 200, H = 220, TOP = DY - H, MY = TOP + H / 2, xs = [700, 1220], seats = [460, 1460];
    const names = en ? ["An evidence directory nobody uses", "A report nobody reads"] : ["没人用的证据目录", "没人读的报告"];
    line(560, DY, 1360, DY, {color: P.muted, alpha: no, width: 4});
    xs.forEach((x, i) => {
      const q = ramp(t, ats[i] - .15, .4) * no, lit = speaking(t, ats, i), side = i ? 1 : -1;
      if (lit > 0) box(x - W / 2 - 12, TOP - 12, W + 24, H + 6, {stroke: P.ink, alpha: lit * .45 * no, radius: 16, width: 2});
      if (i === 0) {
        box(x - W / 2, TOP, W, H - 4, {fill: P.row, stroke: P.muted, alpha: q, radius: 10});
        line(x - W / 2, TOP + 44, x + W / 2, TOP + 44, {color: P.muted, alpha: q});
        for (let k = 0; k < 3; k++) box(x - 60, TOP + 72 + k * 44, 120, 28, {stroke: P.line, alpha: q, radius: 4});
      } else s17Page(x - W / 2 + 20, TOP + 10, W - 40, H - 14, {alpha: q, rows: 5, stroke: P.muted});
      // The user nobody is: an empty seat that stands on the item's words, when a dashed way runs out to it.
      person(seats[i], MY + 8, {alpha: q, color: P.line, size: .9, solid: false});
      link(x + side * (W / 2 + 12), MY, seats[i] - side * 34, MY, {color: P.line, alpha: q, upto: drawShare(t, ats[i] + .05, Math.abs(seats[i] - side * 34 - (x + side * (W / 2 + 12))), .6), dash: [8, 8]});
      rejectedName(names[i], x, TOP - 12 - NAME_GAP, {valign: "bottom", width: 460, alpha: no * named(t, ats[i]),
        mark: ramp(t, ats[i] + .45, .3), set: "unused"});
    });
    // The clock stands on the maker's head, one mark with the maker.
    const motive = ramp(t, effort - .15, .4) * no, PY = DY - 34;
    person(960, PY, {alpha: motive, size: 1.2});
    clock(960, PY - 75, 30, {hand: (voiceTime(t) * .6) % 1, color: P.muted, alpha: motive});
    nameText(L("为了证明自己努力过", "To prove effort"), 960, DY + NAME_GAP, {valign: "top", color: P.muted, alpha: no * named(t, effort)});
    ctx.restore();
  }
};

/* ---------------- 19 human-agent: delegate a boundary, not a pile of context ---------------- */
/* A delegated boundary round an Agent: the frame opens about the Agent alone, too small to hold a group, and on the
 * words of the first member set inside it widens to its full width, its top rising to hold the first row; its bottom
 * then grows down with the rows below the Agent as they arrive. Each growth starts just before its member's words and
 * lasts 0.4 s. `ys` are the rows' centres from the top and `ats` their words; the small frame's edges and the full
 * frame's are given as [top, bottom], and `full` may be a width that grows with the rows. With `middle`, a width, the
 * small frame stands that wide round the Agent at the middle of where the full frame will stand, so the stage is
 * balanced while its members are still to come, and it widens about that middle over 0.7 s while the Agent returns to
 * its side; with `from`, a time, it first closes round the Agent at its side and moves to the middle from then, over
 * 0.7 s; `toward` stands the waiting frame that many px right of that middle, and it widens from there to its full
 * place. It returns the frame's box and the Agent's x. */
function s19Frame(t, fx, small, full, ys, ats, [top0, bottom0], [top1, bottom1], {middle = null, from = null, toward = 0, opens = 0} = {}) {
  // A card waiting at the middle grows into the full frame as a glide timed by the farther of its edges' ways, finishing
  // as its first part's name comes in, so neither the frame nor the name over it travels faster than the eye follows.
  const reach = middle === null ? 0 : Math.max(Math.abs(full / 2 + toward - middle / 2), Math.abs(full / 2 - toward - middle / 2));
  const grow = middle === null ? soon(t, ats[0] - .3, .4) : glide(t, ats[0] - .15 - glideTime(reach), reach), top = mix(top0, Math.min(top1, ys[0] - 45), grow);
  let bottom = mix(bottom0, bottom1, grow);
  ys.forEach((y, k) => { if (y + 45 > bottom) bottom = mix(bottom, y + 45, soon(t, ats[k] - .3, .4)); });
  const side = fx + small / 2, h = bottom - top;
  if (middle === null) return {x: fx, y: top, w: typeof full === "function" ? full(t) : mix(small, full, grow), h, ax: side};
  // A card that opens from further away glides further; the frame's edges open on the widening's easing, while the
  // Agent steps back to its side as a glide, so it never travels faster than the eye follows.
  const go = from === null ? 1 : glide(t, from, Math.abs(fx + full / 2 + toward - side - opens)), at = mix(side + opens, fx + full / 2 + toward, go), w = mix(mix(small, middle, go), full, grow);
  return {x: mix(at, fx + full / 2, grow) - w / 2, y: top, w, h, ax: mix(at, side, grow)};
}
/* The lines of a list said member by member, set as growTexts sets them (a member's leading mark hangs at the end of
 * the line before), but balanced: of the splits into as few lines as fit `width`, the one whose widest line is
 * narrowest, so no member is stranded on a short line between two long ones. */
function s19Lines(parts, width) {
  const n = growLines(parts, width).length, span = (a, b) => measure(parts.slice(a, b).join(""));
  let best = null;
  const search = (from, cuts) => {
    if (cuts.length === n - 1) {
      const starts = [0, ...cuts], ends = [...cuts, parts.length], worst = Math.max(...starts.map((a, i) => span(a, ends[i])));
      if (worst <= width + .5 && (!best || worst < best.worst - .5)) best = {starts, ends, worst};
      return;
    }
    for (let c = from + 1; c <= parts.length - (n - 1 - cuts.length); c++) search(c, [...cuts, c]);
  };
  search(0, []);
  if (!best) return growTexts(parts, width);
  const lines = best.starts.map((a, i) => Array.from({length: best.ends[i] - a}, (_, j) => [a + j, parts[a + j]]));
  lines.forEach((line, r) => {
    const [k, v] = line[0], lead = r ? v.match(/^[、，,;；\s]+/u)?.[0] ?? "" : "";
    if (!lead) return;
    line[0] = [k, v.slice(lead.length)];
    const mark = lead.replace(/\s+/gu, "");
    if (mark) lines[r - 1].push([k, mark]);
  });
  return lines;
}
scenes["19"] = function (s, t) {
  const base = ramp(t, opening(s), .7);
  const within = cue(s, "在委托范围内", "within a delegated boundary"), extend = cue(s, "扩展", "agents extend");
  // The member who delegates stands at one place through the scene's first stages, and the Agent's boundary to its
  // right; the stages are composed about the frame's centre, wide enough to read as one group. The boundary stands
  // further right in Chinese, whose names inside it are shorter, so the member and the boundary balance in each edition.
  const MX = 580, MY = 506, FX = L(970, 920), small = 160;
  // The member's left edge: its figure reaches 41 px left of its axis at this size, its English name further.
  const memberLeft = MX - Math.max(41, measure(L("成员", "Member")) / 2);
  // The actors' names, the member's and the Agent's, stand on one line under the member, the taller figure. A column
  // beside them that has a row within an em of that line stands so that row is on it, so the row reads level with them.
  const em = labelSize(LABEL), ACTOR = MY + 38 + NAME_GAP;
  const snap = firsts => { const d = firsts.map(y => ACTOR + em / 2 - y).reduce((a, b) => Math.abs(b) < Math.abs(a) ? b : a, Infinity); return Math.abs(d) <= em ? d : 0; };
  // 1. The member delegates kinds of work to an Agent: the kinds build into one column beside the member as they are
  // named, and on the words that hand them over the column is joined to the Agent by one link. The member stands from
  // the first words, clear of the rising chapter title; each kind arrives on its own word and the Agent on its name.
  // Until the handover the member and the column stand alone, centred as one group, and on the handover's words they
  // move left to their places beside the Agent, the member to the place it keeps through the next stages. Before the
  // first kind is named the member stands alone at the centre, and it moves to its place in the group on that kind's
  // words; English says what the member does first, so there the member sets off on "delegate", and the group covers
  // the picture's band from the first kind on rather than after it has moved. The column stands nearer the Agent than
  // the member, its rows a wide pitch apart and its last row on the
  // actors' line, so the member and the kinds fill the picture from the first kind on while the Agent is still to come.
  const kinds = cues(s, [["查资料", "search"], ["分析", "analysis"], ["起草", "drafting"]]);
  const settleAt = en ? cue(s, "", "delegate work") : kinds[0];
  const toAgent = cue(s, "委托给智能体", "to agents"), agentAt = cue(s, "智能体", "agents");
  const g1 = base * clearOfTitle(s, t, 350) * stageOut(t, Math.min(within, extend));
  if (g1 > 0) {
    const names = en ? ["Search", "Analysis", "Drafting"] : ["查资料", "分析", "起草"];
    const CX = 1080, wide = Math.max(...names.map(v => measure(v, LABEL))), group = (memberLeft + CX + wide) / 2;
    const lead = (960 - group) * (1 - glide(t, toAgent + .05, 960 - group)), solo = (group - MX) * (1 - glide(t, settleAt + .05, group - MX));
    const ax = 1400, ay = 500, cx = CX + lead, mx = MX + lead;
    ctx.save(); ctx.translate(solo, 0);
    person(mx, MY, {alpha: g1, color: P.authority, size: 1.7});
    nameText(L("成员", "Member"), mx, MY + 38 + NAME_GAP, {valign: "top", color: P.authority, alpha: g1 * named(t, cue(s, "成员", "members"))});
    ctx.restore();
    const tops0 = stackTops(names.map(() => blockHeight(1)), CONTENT_CY, 80), lift = snap(tops0.map(v => v + em / 2));
    const tops = tops0.map(v => v + lift), mid = i => tops[i] + labelSize(LABEL) / 2;
    names.forEach((v, i) => {
      const y = mid(i), on = ramp(t, kinds[i] - .15, .4), lit = speaking(t, kinds, i);
      box(cx - 80, y - 21, 56, 42, {fill: P.row, stroke: P.muted, alpha: g1 * on, radius: 7, width: 2});
      if (lit > 0) box(cx - 80, y - 21, 56, 42, {stroke: P.ink, alpha: g1 * lit, radius: 7, width: 2.5});
      nameText(v, cx, y, {align: "left", alpha: g1 * listIn(t, kinds, i), set: "work"});
    });
    // The handover: a bracket closes the column and one link runs from it to the Agent, a point travelling along it.
    const bx = cx + wide + 34, hand = ramp(t, toAgent - .1, .3) * g1, go = soon(t, toAgent - .05, .7);
    line(bx, mid(0), bx, mid(names.length - 1), {color: P.line, alpha: hand, width: 2});
    link(bx, CONTENT_CY, ax - 48, ay, {alpha: hand, upto: go, flowing: since(t, toAgent + .65)});
    const here = ramp(t, agentAt - .15, .4);
    agent(ax, ay, {alpha: here * g1, size: 1.8});
    nameText(L("智能体", "Agent"), ax, ACTOR, {valign: "top", color: P.evidence, alpha: g1 * named(t, agentAt)});
  }
  // 2. Within the delegated boundary the Agent extends what people can investigate, reason about and do: the boundary
  // stands round the Agent as a frame, and the three abilities build into one column inside it, each with its mark.
  // The frame opens on the stage's first words about the Agent alone and widens to the column as its first ability
  // arrives; until then it stands round the Agent at the middle of where the boundary will stand, so the member and the
  // boundary are balanced, and the Agent steps to its side as the frame widens. The frame is named on its own words,
  // which open the stage in Chinese and close it in English, where it holds the Agent and its abilities before then.
  const abilities = cues(s, [["调查", "investigate"], ["推理", "reason about"], ["动手", "and do"]]);
  // The next stage cuts in on its first words: the Agent's own column in Chinese, the refusal in English.
  const sourceCut = cue(s, "智能体能执行", "but an agent");
  // Each column's frame is as wide as its own widest name, so the boundary is filled by what it holds.
  // The refused authorization stands whole on one line, the frame widening to take it.
  const kx = FX + 210, refused = L("组织的授权", "Organizational authorization"), RW = 400, lean19 = L(83, 150);
  const widthFor = names => 210 + 20 + NAME_GAP + Math.max(...names) + 40;
  const g2 = base * stageIn(t, Math.min(within, extend)) * stageOut(t, sourceCut);
  if (g2 > 0) {
    const names = en ? ["Investigate", "Reason about", "Do"] : ["调查", "推理", "动手"];
    const ys0 = stackTops(names.map(() => blockHeight(1)), CONTENT_CY, 34).map(top => top + em / 2), ys = ys0.map(y => y + snap(ys0));
    person(MX, MY, {alpha: g2, color: P.authority, size: 1.7});
    nameText(L("成员", "Member"), MX, MY + 38 + NAME_GAP, {valign: "top", color: P.authority, alpha: g2});
    // The waiting frame is a 240 px square, small enough to read as a card, and stands at its full height, so its name
    // keeps its line as the frame widens. It waits at the far end of where the boundary will stand, its right edge where
    // the frame's will be, so the member and the card balance the stage, and the frame opens toward the member.
    const full = widthFor(names.map(v => measure(v, LABEL)));
    const f = s19Frame(t, FX, small, full, ys, abilities, [380, 620], [380, 620], {middle: 240, toward: (full - 240) / 2}),
      on = ramp(t, Math.min(within, extend) - .15, .4) * g2;
    box(f.x, f.y, f.w, f.h, {stroke: P.evidence, alpha: on, radius: 22, width: 2.5});
    nameText(L("委托范围", "A delegated boundary"), f.x, f.y - NAME_GAP, {align: "left", valign: "bottom", color: P.evidence, alpha: g2 * named(t, within)});
    // The member's link to the boundary carries one flow through stages 2 to 4, timed by its length once the frame
    // stands at its place.
    link(MX + 40, 500, f.x - 12, 500, {alpha: g2, flowing: since(t, Math.min(within, extend) + STAGE_CUT), span: FX - MX - 52});
    agent(f.ax, 490, {alpha: g2, size: 1.6});
    nameText(L("智能体", "Agent"), f.ax, ACTOR, {valign: "top", color: P.evidence, alpha: g2});
    names.forEach((v, i) => {
      const y = ys[i], q = ramp(t, abilities[i] - .15, .4) * g2, lit = speaking(t, abilities, i);
      if (i === 0) { ring(kx - 4, y - 4, 9, {alpha: q, width: 2.5}); line(kx + 3, y + 3, kx + 11, y + 11, {color: P.evidence, alpha: q, width: 3}); }
      if (i === 1) { dot(kx - 9, y + 6, 4.5, {alpha: q}); dot(kx + 9, y - 6, 4.5, {alpha: q}); line(kx - 9, y + 6, kx + 9, y - 6, {color: P.evidence, alpha: q, width: 2}); }
      if (i === 2) check(kx, y, 18, {alpha: q});
      if (lit > 0) ring(kx, y, 20, {color: P.evidence, alpha: g2 * lit, width: 2.5});
      nameText(v, kx + 20 + NAME_GAP, y, {align: "left", color: P.evidence, alpha: g2 * listIn(t, abilities, i), set: "abilities"});
    });
  }
  // 3. The Agent executes and reasons, but it cannot grant organizational authorization or make commitments for people:
  // inside the boundary the Agent's own column builds on its words, and the authorization and the commitments it cannot
  // give are refused in it, so the frame shows what stays with the Agent and what does not. The English names only the
  // two refusals, so its column holds those rows.
  const boundary = cue(s, "要划清边界", "delegate with a clear boundary");
  const g3 = base * stageIn(t, sourceCut) * stageOut(t, boundary);
  if (g3 > 0) {
    person(MX, MY, {alpha: g3, color: P.authority, size: 1.7});
    nameText(L("成员", "Member"), MX, MY + 38 + NAME_GAP, {valign: "top", color: P.authority, alpha: g3});
    // The rows each edition says: executes, reasons, the refused authorization and the refused commitment in Chinese;
    // the two refusals in English. The frame opens about the Agent and widens to each row as it arrives.
    const said = en ? [2, 3] : [0, 1, 2, 3], promise = L("替人作出承诺", "Commitments for people");
    const does = en ? cues(s, [["", "organizational authorization"], ["", "make commitments for people"]])
      : cues(s, [["智能体能执行", ""], ["能推理", ""], ["给不了组织的授权", ""], ["替人作出承诺", ""]]);
    const ys0 = stackTops(said.map(() => blockHeight(1)), CONTENT_CY, 34).map(top => top + em / 2), ys = ys0.map(y => y + snap(ys0));
    // The two refusals' crosses stand in one column after the longer of their names, so each refusal's row reaches it.
    const refusals = Math.max(...wrapName(refused, RW).map(v => measure(v, LABEL)), measure(promise, LABEL));
    const widths = [...(en ? [] : ["执行", "推理"].map(v => measure(v, LABEL))), refusals + 16 + 26, refusals + 16 + 26];
    // Each widening is made at the tip pace and is whole 0.1 s into its row's words, as its name comes.
    const targets = widths.map((_, k) => Math.max(small, widthFor(widths.slice(0, k + 1))));
    const grown = tt => targets.reduce((w, to, k) => { const d = to - (k ? targets[k - 1] : small); return w + d * pacedTo(tt, does[k] + .1, d, .4); }, small);
    // As the frame widens to take the refused names whole, it and the Agent ease left, 83 px in Chinese and 150 in
    // English, so the stage stays centred.
    const fx3 = FX - lean19 * glide(t, does[0] - .3, lean19), ax3 = fx3 + small / 2, kx3 = fx3 + 210;
    const f = s19Frame(t, fx3, small, grown, ys, does, [365, 635], [380, 620]);
    box(f.x, f.y, f.w, f.h, {stroke: P.evidence, alpha: g3, radius: 22, width: 2.5});
    nameText(L("委托范围", "A delegated boundary"), fx3, f.y - NAME_GAP, {align: "left", valign: "bottom", color: P.evidence, alpha: g3});
    link(MX + 40, 500, fx3 - 12, 500, {alpha: g3, flowing: since(t, Math.min(within, extend) + STAGE_CUT), span: FX - lean19 - MX - 52});
    agent(ax3, 490, {alpha: g3, size: 1.6});
    nameText(L("智能体", "Agent"), ax3, ACTOR, {valign: "top", color: P.evidence, alpha: g3});
    said.forEach((i, k) => {
      const y = ys[k], q = ramp(t, does[k] - .15, .4) * g3;
      if (i === 0) check(kx3, y, 18, {alpha: q});
      if (i === 1) { dot(kx3 - 9, y + 6, 4.5, {alpha: q}); dot(kx3 + 9, y - 6, 4.5, {alpha: q}); line(kx3 - 9, y + 6, kx3 + 9, y - 6, {color: P.evidence, alpha: q, width: 2}); }
      if (i >= 2) seal(kx3, y, 16, {alpha: q * .8, hollow: true});
      const at = ramp(t, does[k] - .15, .4) * listLevel(t, does, k);
      if (i < 2) nameText(["执行", "推理"][i], kx3 + 20 + NAME_GAP, y, {align: "left", color: P.evidence, alpha: g3 * at, set: "agent"});
      else rejectedName(i === 2 ? refused : promise, kx3 + 20 + NAME_GAP, y, {align: "left", width: RW, alpha: g3 * ramp(t, does[k] - .15, .4), mark: ramp(t, does[k] + .4, .4),
        markLeft: kx3 + 20 + NAME_GAP + refusals + 16});
    });
  }
  // 4. Delegate with a clear boundary, not a pile of context: the pile under the member is refused, and the boundary
  // handed to the Agent states five things. The boundary opens about the Agent alone and grows with the five as they
  // build into one column inside it, each with its own mark. Until they come it closes round the Agent at its side on
  // the stage's first words and moves to the middle of where it will stand, so the stage is balanced while it waits.
  const pile = cue(s, "一堆背景材料", "a pile of context");
  // The example cuts in on the words that name its first mark (changing nothing in Chinese; in English the comparison,
  // whose chart stands from its verb), so the boundary holds over "for example" rather than leaving the frame without a
  // mark before the example's words.
  const [readOnly, earlier, revised] = cues(s, [["只看不改", "read-only"], ["供应商修正前", "compare the vendor's earlier"],
    ["修正前后", "revised"]]);
  const example = Math.min(readOnly, earlier) - .2;
  const parts = cues(s, [["目的和范围", "purpose and scope"], ["交什么", "the deliverable"], ["限制和权限", "limits and permissions"], ["怎么验收", "how the result will be accepted"], ["什么时候必须停", "when to stop"]]);
  const g4 = base * stageIn(t, boundary) * stageOut(t, example);
  if (g4 > 0) {
    // The last part's Chinese name keeps its key words in a shorter form, 何时必须停下交接, so it does not repeat the
    // caption that shows that part alone.
    const names = en ? ["Purpose and scope", "The deliverable", "Limits and permissions", "How the result will be accepted", "When to stop and hand off"]
      : ["目的和范围", "交什么", "限制和权限", "怎么验收", "何时必须停下交接"];
    // A part wider than the column wraps onto a second line, and each part stands centred on its own row.
    const PW = 360, blocks = names.map(v => wrapName(v, PW)), heights = blocks.map(v => blockHeight(v.length));
    const tops = stackTops(heights, CONTENT_CY, 40), lift = snap(tops.flatMap((top, i) => blocks[i].map((_, k) => top + em / 2 + k * em * LEADING)));
    const ys = tops.map((top, i) => top + lift + heights[i] / 2);
    const fw = 210 + 20 + NAME_GAP + Math.max(...blocks.flat().map(v => measure(v, LABEL))) + 40;
    person(MX, MY, {alpha: g4, color: P.authority, size: 1.7});
    nameText(L("成员", "Member"), MX, MY + 38 + NAME_GAP, {valign: "top", color: P.authority, alpha: g4});
    // The pile of context stays with the member, refused. In Chinese it is set down on the verb that hands it over, just
    // before it is named.
    const heap = ramp(t, Math.min(pile, cue(s, "只给", "a pile of context")) - .15, .4) * g4;
    // The pile stands centred under the member, clear of its name, and is named centred under itself with its cross.
    for (let k = 0; k < 4; k++) box(MX - 64 + k * 8, 648 - k * 10, 104, 64, {fill: P.row, stroke: P.muted, alpha: heap, radius: 6});
    rejectedName(L("一堆背景材料", "A pile of context"), MX, 712 + NAME_GAP, {valign: "top", alpha: g4 * named(t, pile), mark: ramp(t, pile + .45, .4)});
    // The waiting frame stands at its full top, so its name never moves up across the first part, and small enough to
    // read as a card: 200 px wide in Chinese, 160 px in English, whose longer name stands centred over it; the card
    // stands 50 px right of the full frame's middle, so the member, the pile and the card stay balanced.
    const top4 = Math.min(330, ys[0] - 45);
    const f = s19Frame(t, FX, small, fw, ys, parts, [top4, 615], [330, 660], {middle: L(200, 160), from: boundary + STAGE_CUT, toward: 50, opens: -lean19});
    link(MX + 40, 500, f.x - 12, 500, {alpha: g4, flowing: since(t, Math.min(within, extend) + STAGE_CUT), span: FX - MX - 52});
    box(f.x, f.y, f.w, f.h, {stroke: P.evidence, alpha: g4, radius: 22, width: mix(2.5, 4, ramp(t, boundary + .05, .3) * (1 - ramp(t, boundary + 1.4, .5)))});
    // The frame's name stands at its left edge; over a waiting frame narrower than the name (the English) it stands
    // centred, so it overhangs neither side alone, and it reaches the edge as the frame widens past it.
    const clear = L("划清边界", "A clear boundary");
    nameText(clear, f.x + Math.min(0, (f.w - measure(clear)) / 2), f.y - NAME_GAP, {align: "left", valign: "bottom", color: P.evidence, alpha: g4});
    agent(f.ax, 490, {alpha: g4, size: 1.6});
    nameText(L("智能体", "Agent"), f.ax, ACTOR, {valign: "top", color: P.evidence, alpha: g4});
    names.forEach((v, i) => {
      const y = ys[i], q = ramp(t, parts[i] - .15, .4) * g4, lit = speaking(t, parts, i);
      if (i === 0) { ring(kx, y, 10, {alpha: q, width: 2.5}); dot(kx, y, 3.5, {alpha: q}); }
      if (i === 1) s17Page(kx - 9, y - 12, 18, 24, {alpha: q, rows: 2, stroke: P.evidence});
      if (i === 2) lock(kx, y + 2, {alpha: q, color: P.evidence, size: .5});
      if (i === 3) check(kx, y, 18, {alpha: q});
      if (i === 4) stopSign(kx, y, 11, {alpha: q});
      if (lit > 0) ring(kx, y, 20, {color: P.evidence, alpha: g4 * lit, width: 2.5});
      nameText(v, kx + 20 + NAME_GAP, y, {align: "left", width: PW, alpha: g4 * listIn(t, parts, i), set: "parts"});
    });
  }
  // 5. For example: compare the vendor's earlier and revised price snapshots, read-only, and report each value's source
  // and observation time, the differences, and what cannot be verified. The vendor's prices stand as one chart at the
  // centre, its frame and axes drawn with its first series so they never stand empty, and its name on the words that
  // name the snapshots; each snapshot is one series of the same prices, drawn on its own words and named at its end, and
  // the revised one departs from the earlier. A cursor reads both series at the same moment, and the lock under the
  // stage closes on the words that change nothing, which Chinese says first. The illustrative chip stands while the
  // example is drawn.
  // 6. The report joins the chart it is made from, in the same sentence in Chinese: the chart eases left by half the room
  // the report takes, whole before the report is named, and the report stands at its right as one column, its page and
  // name over its three contents, each a mark and a name on its own words. The chart and the report hold together until
  // the conditions to stop begin, so no picture leaves inside the sentence.
  const report = cue(s, "报告", "report"), vague = cue(s, "帮我搞定", "just handle it"), told = cue(s, "一句", "telling");
  const noSnap = cue(s, "没有修正前的快照", "stop if");
  const items = cues(s, [["每个值的来源", "each value's source"], ["哪些有差异", "the differences"], ["哪些核实不了", "what cannot be verified"]]);
  const contents = en ? ["Source and observation time", "The differences", "What cannot be verified"] : ["每个值的来源和观察时间", "哪些有差异", "哪些核实不了"];
  const FW = 700, GAP = 80, CW = 18 + 24 + NAME_GAP + Math.max(...contents.map(v => measure(v))), room = (GAP + CW) / 2;
  const fx = 960 - FW / 2 - room * glide(t, report - 1, room);
  illustrative(base * stageIn(t, example) * stageOut(t, told));
  const g5 = base * stageIn(t, example) * stageOut(t, noSnap);
  if (g5 > 0) {
    const fy = 310, fh = 380, at = [earlier, revised], snapshots = cue(s, "价格快照", "price snapshots");
    const px = k => fx + 100 + k * 115, base0 = fy + fh / 2 + 10, frame = ramp(t, earlier - .2, .4) * g5;
    box(fx, fy, FW, fh, {fill: P.row, stroke: P.ink, alpha: frame, radius: 10, width: 2.5});
    path([[fx + 50, fy + 34], [fx + 50, fy + fh - 40], [fx + FW - 40, fy + fh - 40]], {color: P.line, alpha: frame, width: 2});
    nameText(L("价格快照", "Price snapshots"), fx + FW / 2, fy - NAME_GAP, {valign: "bottom", alpha: g5 * named(t, snapshots)});
    const series = [[60, -10, 40, -60, -20], [60, -10, 10, -100, -120]];
    series.forEach((dys, i) => {
      const q = ramp(t, at[i] - .15, .4) * g5, c = i ? P.ink : P.evidence, pts = dys.map((dy, k) => [px(k), base0 + dy]);
      path(pts, {color: c, alpha: q, width: 3, draw: {t, at: at[i] - .1}});
      pts.forEach(([x, y]) => dot(x, y, 5, {color: c, alpha: q}));
      nameText(i ? L("修正后", "Revised") : L("修正前", "Earlier"), px(4) + 18, pts[4][1], {align: "left", color: c, alpha: g5 * named(t, at[i])});
    });
    // The comparison reads both series at the same moment, in voice time.
    const scan = ramp(t, revised + .2, .4) * g5, u = (voiceTime(t) * .18) % 1, sx = mix(px(0), px(4), u);
    line(sx, fy + 24, sx, fy + fh - 52, {color: P.authority, alpha: scan * .8 * pass(u, .1), width: 2});
    // The report: its page and name head the column, and its contents follow, each a mark of one size with its sign in
    // it; the item being said is shown by its ring's weight.
    const ix = fx + FW + GAP + 18, hy = 395, ys = [465, 535, 605], on = g5 * named(t, report);
    s17Page(ix - 14, hy - 18, 28, 36, {alpha: on, rows: 2, stroke: P.evidence});
    nameText(L("报告", "Report"), ix + 24 + NAME_GAP, hy, {align: "left", color: P.evidence, alpha: on});
    ys.forEach((y, i) => {
      const q = ramp(t, items[i] - .15, .4) * g5, lit = speaking(t, items, i), c = i === 2 ? P.unknown : P.evidence;
      if (i === 0) clock(ix, y, 18, {hand: .15, color: c, alpha: q});
      else ring(ix, y, 18, {color: c, alpha: q, width: 2.5});
      if (i === 1) text("≠", ix, y, 24, {role: "mark", align: "center", color: c, alpha: q});
      if (i === 2) text("?", ix, y, 24, {role: "mark", align: "center", color: c, alpha: q});
      if (lit > 0) ring(ix, y, 18, {color: c, alpha: q * lit, width: 4.5});
      nameText(contents[i], ix + 24 + NAME_GAP, y, {align: "left", alpha: g5 * listIn(t, items, i), set: "report"});
    });
  }
  // Changing nothing: a lock under the stage, its name beside it, which closes on its words. It limits the whole
  // delegation, so it stands outside the chart's stage, centred under the chart and the report, until the conditions to
  // stop begin.
  const kept = base * stageIn(t, example) * stageOut(t, noSnap);
  if (kept > 0) {
    const lw = measure(L("只看不改", "Read-only"), LABEL), lx = 960 - (lw + 19 + NAME_GAP) / 2, ly = 310 + 380 + 86;
    lock(lx, ly, {alpha: ramp(t, readOnly - .15, .4) * kept, color: P.evidence, size: 1.1, closed: soon(t, readOnly, .5)});
    nameText(L("只看不改", "Read-only"), lx + 19 + NAME_GAP, ly, {align: "left", color: P.evidence, alpha: kept * named(t, readOnly)});
  }
  // 7. Stop if the earlier snapshot is missing or the data in production would have to change; do not release the data
  // for use (in English, do not grant admission). The Agent stands over one crossing row, drawn with the stage, from
  // which its ways leave: the two conditions to stop on either side, each with what it would reach, and the release
  // straight down the middle, refused. Each way, dashed, and what it would reach arrive on its own words: the missing
  // earlier snapshot as an empty dashed outline, production, and the admission seal; each way stops at a short bar
  // across it.
  const [prodWrite, noApprove] = cues(s, [["要改生产数据", "a production write"], ["不要放行", "do not grant admission"]]);
  const g7 = base * stageIn(t, noSnap) * stageOut(t, told);
  if (g7 > 0) {
    // The three leaves stand on one row and are named on one line, the release's refused between the two stops.
    const ax = 960, ay = 300, bus = 420, xs = [450, 1470, 960], ends = [540, 540, 540], ys = [620, 620, 620], at = [noSnap, prodWrite, noApprove];
    const on = at.map(v => ramp(t, v - .15, .4) * g7);
    agent(ax, ay, {alpha: g7, size: 1.8});
    nameText(L("智能体", "Agent"), ax + 40 + NAME_GAP, ay, {align: "left", color: P.evidence, alpha: g7});
    link(ax, ay + 40, ax, bus, {alpha: g7, end: false});
    const row = soon(t, noSnap - .1, .45);
    line(mix(ax, xs[0], row), bus, mix(ax, xs[1], row), bus, {color: P.muted, alpha: g7, width: 3});
    xs.forEach((x, i) => {
      const q = on[i], go = soon(t, at[i] - .1, .6);
      link(x, bus, x, ends[i], {alpha: q * .8, end: false, dash: [6, 6]});
      link(x, bus, x, mix(bus, ends[i], go), {color: P.unknown, alpha: q, end: false});
      line(x - 26, ends[i] + 12, x + 26, ends[i] + 12, {color: P.unknown, alpha: ramp(t, at[i] + .4, .3) * g7, width: 4});
    });
    // What each way would reach, on that way's words.
    box(xs[0] - 34, ys[0] - 44, 68, 88, {stroke: P.muted, alpha: on[0], radius: 6, dash: [6, 6]});
    text("?", xs[0], ys[0], 30, {role: "mark", align: "center", color: P.unknown, alpha: on[0]});
    tableIcon(xs[1] - 64, ys[1] - 42, 128, 84, {alpha: on[1], stroke: P.ink});
    seal(xs[2], ys[2], 36, {alpha: on[2], hollow: true});
    // The two stop conditions are the list, so the pair returns to full ink once both are said; the release is a
    // separate prohibition, refused on its own words.
    const stops = en ? ["Earlier snapshot is missing", "A production write"] : ["没有修正前的快照", "要改生产数据"];
    stops.forEach((v, i) => nameText(v, xs[i], ys[i] + 44 + NAME_GAP, {valign: "top", width: 380, alpha: g7 * listIn(t, at.slice(0, 2), i), set: "stops"}));
    rejectedName(L("放行这份数据", "Grant admission"), xs[2], ys[2] + 44 + NAME_GAP, {valign: "top", width: 420,
      alpha: g7 * named(t, noApprove), mark: ramp(t, noApprove + .45, .4)});
  }
  // 8. "Just handle it" does not set an authorization boundary: the phrase beside the member is refused, the boundary
  // that is not set is only marked by its four dashed corners, which stand on the verb that does not draw it (in
  // English on "set", close enough to the boundary's name that the corners never wait for it), and the Agent, standing
  // named where the boundary would be, drifts from the refusal in and out of it in voice time, trailing a dashed path;
  // the boundary is named on its own words. The next stage cuts in on the words that open the fork: the first thing
  // that may be unclear in Chinese, missing context in English.
  const gap = cue(s, "要处理的对象", "missing context"), notSet = cue(s, "划不出", "does not set"), authAt = cue(s, "授权的边界", "authorization boundary", {last: true});
  const g8 = base * stageIn(t, told) * stageOut(t, gap);
  if (g8 > 0) {
    // The English phrase beside the member is wider, so there the boundary stands further right to balance it.
    const mx = L(492, 450), fx = L(902, 930), fy = 300, fw = 600, fh = 500, cx = fx + fw / 2, cornerAt = cue(s, "划不出", "set an authorization");
    const corner = named(t, cornerAt) * g8;
    // The English says the phrase well before the corners' words, so until the corners stand the member and the phrase
    // stand 200 px right of their places, balanced with the Agent, and ease to them as the corners arrive; the Agent,
    // whose drift begins then, keeps its own place.
    const wait = L(0, 200) * (1 - glide(t, cornerAt + .05, L(0, 200)));
    ctx.save(); ctx.translate(wait, 0);
    person(mx, MY, {alpha: g8, color: P.authority, size: 1.7});
    nameText(L("成员", "Member"), mx, MY + 38 + NAME_GAP, {valign: "top", color: P.authority, alpha: g8});
    rejectedName(L("“帮我搞定”", "“Just handle it”"), mx, 420, {valign: "bottom", alpha: g8 * named(t, vague), mark: ramp(t, notSet + .05, .3)});
    ctx.restore();
    [[fx, fy, 1, 1], [fx + fw, fy, -1, 1], [fx, fy + fh, 1, -1], [fx + fw, fy + fh, -1, -1]].forEach(([x, y, sx, sy]) =>
      path([[x, y + sy * 70], [x, y], [x + sx * 70, y]], {color: P.muted, alpha: corner, width: 3, dash: [10, 7]}));
    nameText(L("授权的边界", "An authorization boundary"), fx, fy - NAME_GAP, {align: "left", valign: "bottom", color: P.muted, alpha: named(t, authAt) * g8});
    // The drift widens in voice time, so a drift still widening when the thought ends rests in the quiet. It wanders
    // at a pace the eye follows: its sway and its widening together stay under GLIDE_PEAK px/s.
    const since = voiceTime(t) - voiceTime(notSet + .05), drift = smoother(since / 2), at = k => {
      const v = voiceTime(t) - k * .08, d = smoother((since - k * .08) / 2);
      return [cx + Math.sin(v * .9) * 380 * d, 540 + Math.cos(v * .7) * 160 * d];
    };
    if (drift > 0) path(Array.from({length: 31}, (_, k) => at(k)), {color: P.unknown, alpha: g8 * .6 * drift, width: 2, dash: [5, 6]});
    agent(...at(0), {alpha: g8, size: 1.8});
    nameText(L("智能体", "Agent"), cx, 596 + NAME_GAP, {valign: "top", color: P.evidence, alpha: g8 * (1 - ramp(t, notSet + .05, .3))});
  }
  // 9. Missing context forks the Agent's work. A tree from the Agent: where direction, safety and authority are not
  // materially affected it proceeds on stated assumptions; where something it must know is unclear it stops and asks.
  // The branches stand in the spoken order: the English says the assumptions first, the Chinese first names what may be
  // unclear. Each branch reaches its condition on the condition's first words. Proceeding is a key term with its
  // qualifier, in two lines at most: it stands whole on its first words, and while its parts are said its ring beats
  // once on each part's words. What may be unclear is a list said member by member (the object to handle, the source of
  // truth, the responsible person, the authority, and whether the consequence can be undone): its members are set on
  // the lines of one block as the parts of one name wrap, and each arrives at its place on its own words and takes its
  // level in the list, so the condition builds as it is said and nothing in it moves; its ring beats on each further
  // member, and that any one of them is unclear is its qualifier, on its own words on the line below. Each outcome's
  // run leaves its own condition's first line. The column wraps the list, and in English the qualifier of proceeding,
  // so the tree is no wider than its words need. The member who delegated stays where the last stage left them, at the
  // root's left; while the first condition builds, the Agent and its fork stand further right, so the member and the
  // growing tree are balanced, and on the first outcome's words the fork moves left to its place, where the finished
  // tree is centred. The Agent's open question stands above it; the English names it missing context on its words,
  // while the Chinese never names missing context as such, so there it stays a mark of what the Agent does not know.
  const g9 = base * stageIn(t, gap);
  if (g9 > 0) {
    const ask = cue(s, "停下来问", "stops and asks"), assume = cue(s, "写明合理的假定", "proceeds on reasonable"), onward = cue(s, "接着做", "proceeds on reasonable");
    const fine = cue(s, "不影响", "does not materially"), first = cue(s, "要处理的对象", "target");
    // Each condition: its words (a term, or the members of a list) and the words that bring each, its qualifier and the
    // words that bring it, whether it stops the Agent, and the words its ring beats on. The English says authority
    // earlier in the scene, so the list reads it from its first member on.
    const parts = list => list.map(([zh, english]) => cue(s, zh, english));
    const proceeds = en ? [["Does not materially affect"], [fine], ["direction, safety or authority"], fine, false, parts([["", "direction"], ["", "safety"], ["", "or authority"]])]
      : [["不影响"], [fine], ["方向、安全和权限"], fine, false, [cue(s, "方向", ""), cue(s, "安全", ""), cueFrom(s, "和权限", "", cue(s, "安全", ""))]];
    const members = [first, cue(s, "事实依据", "fact source"), cue(s, "负责人", "responsible person"), cueFrom(s, "权限", "authority", first),
      cue(s, "后果是否可逆", "or an irreversible")];
    const stops = [en ? ["Target", ", fact source", ", responsible person", ", authority", " or an irreversible consequence"]
      : ["要处理的对象", "、事实依据", "、负责人", "、权限", "、后果是否可逆"], members, [L("有一样说不清", "is unclear")], cue(s, "有一样说不清", "is unclear"), true,
      members.slice(1)];
    const rows = en ? [proceeds, stops] : [stops, proceeds];
    const outB = L("停下来问", "Stops and asks");
    // The member stays where the last stage left them. While the first condition builds, the fork stands S1 px right of
    // its place beside the member, on the first outcome it moves to S2 px from that place, and on the second to S3 px:
    // the Chinese second outcome's name is long, so the finished tree stands centred only once the fork has moved again. The English S1 is taken
    // from the full-size draft, whose Latin lines run narrower than the headless estimate. The English column takes what
    // may be unclear on two even lines, each ending on a whole member, so there the fork ends 20 px left of its place,
    // its branches turn nearer the Agent and its outcomes stand nearer their conditions, and the finished tree stays
    // about the centre. The first condition stands far enough right that it and the member stand within 40 px of the
    // centre while it builds.
    const [S1, S2, S3] = en ? [378, -20, -20] : [380, 90, 0];
    const fork = mix(S1, S2, glide(t, (en ? assume : ask) + .05, S1 - S2)) + (S3 - S2) * glide(t, (en ? ask : assume) + .05, S3 - S2);
    const CW = en ? 560 : 480, mx = 450, rx = mx + 150 + fork, cx0 = rx + L(130, 116);
    // Each condition's block: the list's lines, the block's height and width, and the width of its first line, where its
    // outcome's run leaves.
    const lineW = line => line.reduce((w, [, v]) => w + measure(v), 0);
    const blocks = rows.map(([term, , qual, , stop]) => {
      if (stop) {
        const lines = s19Lines(term, CW), widths = lines.map(lineW);
        return {lines, height: blockHeight(lines.length) + TERM_STACK + blockHeight(1, NOTE), width: Math.max(...widths, measure(qual.join(""), NOTE)), head: widths[0]};
      }
      // Both conditions set their qualifiers the same way, under them: the list's must stand under its lines.
      const {one, height} = termRowLayout(term, qual, CW, false), head = measure(term.join(""), LABEL), note = measure(qual.join(""), NOTE);
      return {height, width: one ? head + TERM_GAP + note : Math.max(head, note), head: one ? head + TERM_GAP + note : head};
    });
    const colW = Math.max(...blocks.map(v => v.width)), ox = cx0 + colW + L(70, 60);
    // The Chinese opens on its list building alone at the top of the fork, so there the branches stand further apart
    // and the opening fills the frame; the English opens on proceeding, which a wider fork would raise level with the
    // open question's name, so it keeps the usual gap.
    const tops0 = stackTops(blocks.map(v => v.height), CONTENT_CY, en ? 150 : 250);
    const drop = snap(tops0.flatMap((top, r) => Array.from({length: blocks[r].lines?.length ?? 1}, (_, k) => top + em / 2 + k * em * LEADING)));
    const tops = tops0.map(top => top + drop), ys = tops.map(top => top + labelSize(LABEL) / 2);
    person(mx, 506, {alpha: g9, color: P.authority, size: 1.7});
    nameText(L("成员", "Member"), mx, 506 + 38 + NAME_GAP, {valign: "top", color: P.authority, alpha: g9});
    link(mx + 40, 500, rx - 40, 500, {alpha: g9});
    agent(rx, 500, {alpha: g9, size: 1.8});
    nameText(L("智能体", "Agent"), rx, ACTOR, {valign: "top", color: P.evidence, alpha: g9 * named(t, cueFrom(s, "智能体", "the agent", gap))});
    // The open question: an empty, dashed outline above the Agent with a question in it, named on its words in English.
    // It stands high enough that its English name clears the first condition's mark and the ring that beats round it.
    const QY = 310;
    box(rx - 30, QY, 60, 76, {stroke: P.unknown, alpha: g9, radius: 8, dash: [6, 6]});
    text("?", rx, QY + 38, 30, {role: "mark", align: "center", color: P.unknown, alpha: g9});
    if (en) nameText("Missing context", rx, QY - NAME_GAP, {valign: "bottom", alpha: g9 * named(t, gap)});
    rows.forEach(([term, termAts, qual, qualAt, stop, partAts], r) => {
      const y = ys[r], begin = Math.min(termAts[0], qualAt), q = ramp(t, begin - .15, .4) * g9, mark = cx0 - 14 - NAME_GAP;
      link(rx + 40, 500, mark - 18, y, {route: "hvh", mid: cx0 - 50, alpha: q * .8, end: false});
      ring(mark, y, 14, {color: stop ? P.unknown : P.evidence, alpha: q, width: 2.5});
      beats(t, mark, y, 22, partAts, {color: stop ? P.unknown : P.evidence, alpha: g9});
      if (stop) {
        // Each member at its place in the block, a separator it hangs at the end of the line before with it, on its own
        // words and at its level in the list; the qualifier on the line below, on its own words. The list and its
        // qualifier are one name, as a term row's term and qualifier are, so its members are read as the parts of one
        // name, not as names of their own.
        const whole = [...term, ...qual].join(" ");
        blocks[r].lines.forEach((line, k) => {
          let left = cx0;
          line.forEach(([i, v]) => {
            growName(t, [v], [termAts[i]], left, tops[r] + k * labelSize(LABEL) * LEADING,
              {alpha: g9 * listLevel(t, termAts, i), whole, set: "context"});
            left += measure(v);
          });
        });
        growName(t, qual, [qualAt], cx0, tops[r] + blockHeight(blocks[r].lines.length) + TERM_STACK, {size: NOTE, color: P.muted, alpha: g9, whole, set: "context"});
      } else termRow(t, term, term.map(() => termAts[0]), qual, qual.map(() => qualAt), cx0, tops[r], {width: CW, inline: false, alpha: g9, set: "context"});
      // The outcome: a straight run from its condition's first line to its mark, drawn on the outcome's words.
      const at = stop ? ask : assume, go = {t, at: at - .1}, on = ramp(t, at - .15, .4) * g9;
      link(cx0 + blocks[r].head + 20, y, ox - 30, y, {color: stop ? P.unknown : P.evidence, alpha: on, draw: go, flowing: stop ? null : since(t, Math.max(onward + .2, at + .4))});
      if (stop) stopSign(ox, y, 18, {alpha: on});
      else s17Page(ox - 14, y - 18, 28, 36, {alpha: on, rows: 2, stroke: P.evidence});
      if (stop) nameText(outB, ox + 24 + NAME_GAP, y, {align: "left", color: P.authority, alpha: g9 * named(t, ask)});
      // The English outcome stands whole on one line and on its own words, when the fork has come to its place, so the
      // finished tree stands about the centre and the name never stands past the safe area.
      else growName(t, en ? ["Stated", " assumptions"] : ["写明合理的假定", "，接着做"], en ? [cue(s, "", "stated assumptions"), cue(s, "", "stated assumptions")] : [assume, onward],
        ox + 24 + NAME_GAP, y - labelSize(LABEL) / 2, {width: en ? 340 : 1810 - ox - 24 - NAME_GAP, color: P.evidence, alpha: g9});
    });
  }
};

/* ---------------- 20 human-agent: delegation transfers the work, not the duty ---------------- */
scenes["20"] = function (s, t) {
  const base = ramp(t, opening(s), .7);
  const policy = cue(s, "制度允许时", "where policy permits");
  // 1. A piece of work involves five roles. The piece of work is a page at the left, drawn and named on the first
  // words; the roles build into one column at its right, each arriving and named on its own words, and the page's
  // spine reaches each role just before it comes, so the tree grows with its members. The tree is centred on its
  // extent, from the page or its name to the end of the longest role's name.
  const roles = cues(s, [["任务负责人", "task lead"], ["执行的成员", "executing member"], ["智能体评审人", "an agent a reviewer"], ["评审人", "reviewer"], ["验收人", "acceptor"]]);
  const g1 = base * stageOut(t, policy);
  if (g1 > 0) {
    const work = cue(s, "一件事", "a piece of work"), on = g1 * named(t, work);
    const roleNames = en ? ["Task lead", "Executing member", "Agent", "Reviewer", "Acceptor"] : ["任务负责人", "执行的成员", "智能体", "评审人", "验收人"];
    // The English first role's name is short, so while it stands alone in the column the tree stands 73 px right, and
    // it eases to its place as the second, wider name comes.
    const early = en ? 73 * (1 - glide(t, roles[1] - .1, 73)) : 0;
    const shift = early + 960 - (Math.min(640 - 70, 640 - measure(L("一件事", "A piece of work")) / 2) + 1000 + 34 + NAME_GAP + Math.max(...roleNames.map(v => measure(v)))) / 2;
    const WX = 640 + shift, WY = 500, SX = 880 + shift, RX = 1000 + shift, ys = [330, 415, 500, 585, 670];
    s17Page(WX - 70, WY - 90, 140, 180, {alpha: on, rows: 4});
    nameText(L("一件事", "A piece of work"), WX, WY + 90 + NAME_GAP, {valign: "top", alpha: on});
    link(WX + 82, WY, SX, WY, {alpha: on, end: false, draw: {t, at: roles[0] - .45}});
    // The spine runs up to the first roles and down to the last as each is about to be named.
    const reach = roles.map((at, k) => drawShare(t, at - .35, Math.abs(ys[k] - WY)));
    const top = ys.reduce((v, y, k) => y < WY ? Math.min(v, mix(WY, y, reach[k])) : v, WY);
    const bottom = ys.reduce((v, y, k) => y > WY ? Math.max(v, mix(WY, y, reach[k])) : v, WY);
    if (bottom - top > 1) line(SX, top, SX, bottom, {color: P.line, alpha: g1, width: 2});
    ys.forEach((y, i) => {
      const q = ramp(t, roles[i] - .15, .4) * g1, lit = speaking(t, roles, i);
      // Each branch reaches its role's mark, so the branch and the role read as one member under its name.
      link(SX, y, RX - 22, y, {alpha: g1, draw: {t, at: roles[i] - .2}, end: false});
      if (i === 2) agent(RX, y, {alpha: q, size: 1.1});
      else person(RX, y + 17, {alpha: q, color: P.authority, size: 1});
      if (lit > 0) ring(RX, y, 36, {color: i === 2 ? P.evidence : P.authority, alpha: g1 * lit, width: 2.5});
      nameText(roleNames[i], RX + 34 + NAME_GAP, y, {align: "left", color: i === 2 ? P.evidence : P.authority, alpha: g1 * listIn(t, roles, i), set: "roles"});
    });
  }
  // 2. Where policy permits, one person may hold several roles, but a title alone grants no authority to decide or
  // accept (in Chinese, being the task lead does not mean one may decide or accept). One stage holds the whole sentence,
  // so nothing leaves inside it: the roles stand above, and the title and the powers it does not grant arrive below them
  // on the title's words. The policy stands at the left as a page with its seal, named on the words that open the
  // thought. Both editions name the person first and then the several roles it may hold: the person stands on its words,
  // and on the roles' words three empty seats arrive at the right, gathered to the person by the bracket and named once
  // as a group; in Chinese each power is then said to need its own authorization.
  const title = cue(s, "当了任务负责人", "a title alone"), samePerson = cue(s, "一个人", "one person");
  const several = cue(s, "兼几种角色", "hold several roles"), holders = [several, several, several];
  const caller = cue(s, "调用智能体的人", "the person who calls");
  const powers = [cue(s, "做决定", "grants no authority to decide"), cueFrom(s, "验收", "accept", title + 1)];
  const g2 = base * stageIn(t, policy) * stageOut(t, caller);
  if (g2 > 0) {
    // The roles arrive as seats. The policy keeps its page clear left of where the work's page stood; the seats stand far enough right that the stage, from
    // the policy's name to the held roles' names, is centred in each edition, and the one person stands midway between.
    // The row stands 50 px above the content centre, so with the title's row below it the stage stands about the centre.
    const heldNames = [L("几种角色", "Several roles")], PX = 520, Y2 = 450;
    const HX = 1920 - PX + Math.max(60, measure(L("制度允许时", "Where policy permits")) / 2) - 40 - NAME_GAP - Math.max(...heldNames.map(v => measure(v)));
    const ys = [Y2 - 110, Y2, Y2 + 110], OX = (PX + HX) / 2, rule = g2 * named(t, policy);
    // The policy stands high enough that its name shares the one person's line, the stage's one line of names.
    const line1 = Y2 + 6 + 32 + NAME_GAP, PY = line1 - 65 - NAME_GAP;
    s17Page(PX - 60, PY - 85, 120, 150, {alpha: rule, rows: 4});
    dot(PX + 44, PY + 52, 20, {color: P.row, alpha: rule});
    seal(PX + 44, PY + 52, 20, {alpha: rule});
    nameText(L("制度允许时", "Where policy permits"), PX, line1, {valign: "top", alpha: rule});
    ys.forEach((y, i) => {
      const q = ramp(t, holders[i] - .15, .4) * g2;
      person(HX, y + 5, {alpha: q, color: P.authority, size: 1.15, solid: false});
    });
    nameText(heldNames[0], HX + 40 + NAME_GAP, Y2, {align: "left", color: P.authority, alpha: g2 * named(t, several)});
    // One person holds the roles: a bracket gathers them and one link runs to the person on the roles' words, the person
    // standing first.
    const one = named(t, samePerson) * g2, gather = several, held = named(t, gather) * g2;
    // In Chinese each power is then said to need its own authorization: the policy's seal beats on those words, then
    // on the authorization, while the roles stand gathered.
    if (!en) beats(t, PX + 44, PY + 52, 30, [cue(s, "每种角色的权限", ""), cue(s, "授权", "")], {color: P.authority, alpha: g2});
    path([[HX - 44, ys[0]], [HX - 62, ys[0]], [HX - 62, ys[2]], [HX - 44, ys[2]]], {color: P.authority, alpha: held, width: 2.5});
    link(HX - 62, Y2, OX + 40, Y2, {color: P.authority, alpha: held, draw: {t, at: gather + .05}});
    person(OX, Y2 + 6, {alpha: one, color: P.authority, size: 1.4});
    nameText(L("一个人", "One person"), OX, line1, {valign: "top", color: P.authority, alpha: one});
    // The title stands alone under the one person, a card with its name under it, and each of its two ways to the powers
    // it names draws toward that power and stops at a short bar as the power is named; the first way leaves on the words
    // that refuse the power. The two powers stand symmetric about the title's row.
    const tx = OX, ty = 740, TW = 150, TH = 90, px = tx + 440, d = 60, pys = [ty - d, ty + d], refuse = cue(s, "不等于", "grants no");
    const card = g2 * named(t, title), bar = tx + 340;
    // Each bar lands on the word that names the refused power, so the last one stands before the thought ends.
    const stops = [cueFrom(s, "做决定", "decide", title), powers[1]];
    box(tx - TW / 2, ty - TH / 2, TW, TH, {stroke: P.muted, alpha: card, radius: 10, width: 2});
    line(tx - 46, ty - 12, tx + 46, ty - 12, {color: P.muted, alpha: card, width: 3});
    line(tx - 46, ty + 14, tx + 18, ty + 14, {color: P.muted, alpha: card * .7, width: 3});
    nameText(L("任务负责人", "A title alone"), tx, ty + TH / 2 + NAME_GAP, {valign: "top", color: P.muted, alpha: card});
    pys.forEach((y, i) => {
      // Each way runs from the title toward its power from the words that refuse it and reaches its short bar, well
      // before the power, as the bar lands on the power's word.
      const from = i ? stops[0] + .05 : refuse - .05, q = ramp(t, powers[i] - .15, .4) * g2;
      link(tx + TW / 2 + 10, ty, bar - 6, y, {route: "hvh", mid: tx + 200, color: P.unknown, alpha: g2 * ramp(t, from - .05, .3), draw: {t, at: from, least: Math.max(.3, stops[i] - from)}, end: false, dash: [8, 8]});
      line(bar, y - 20, bar, y + 20, {color: P.unknown, alpha: ramp(t, stops[i] - .15, .35) * g2, width: 4});
      seal(px, y, 26, {alpha: q, hollow: true});
      nameText(en ? ["Decide", "Accept"][i] : ["做决定", "验收"][i], px + 26 + NAME_GAP, y, {align: "left", color: P.authority,
        alpha: g2 * listIn(t, powers, i), set: "powers"});
    });
  }
  // 4. The person who calls an Agent owns the information it uses (in English, its context), its permissions,
  // verification and result: the caller and the Agent stand on one line, and what the caller owns builds into one rail
  // between them, each item marked on its words.
  const submit = cue(s, "提交它帮忙做的工作", "submitting");
  const infoAt = cue(s, "背景材料", "context");
  const owned = [infoAt, cueFrom(s, "权限", "permissions", infoAt), ...cues(s, [["核验", "verification"], ["结果", "result"]])];
  const g4 = base * stageIn(t, caller) * stageOut(t, submit);
  if (g4 > 0) {
    // The English caller stands 80 px further right, so its name, whole on one line, keeps the stage about the centre.
    const px = L(380, 460), ax = 1540, y = 500, rail = 500, xs = [700, 900, 1100, 1300];
    person(px, y, {alpha: g4, color: P.authority, size: 1.7});
    nameText(L("调用智能体的人", "The person who calls an Agent"), px, y + 38 + NAME_GAP, {valign: "top", width: 400, color: P.authority, alpha: g4});
    agent(ax, y - 5, {alpha: g4, size: 1.8});
    nameText(L("智能体", "Agent"), ax, y + 38 + NAME_GAP, {valign: "top", color: P.evidence, alpha: g4});
    link(px + 56, rail - 5, ax - 52, rail - 5, {alpha: g4, end: false});
    xs.forEach((x, i) => {
      const q = ramp(t, owned[i] - .15, .4) * g4, lit = speaking(t, owned, i);
      dot(x, rail - 5, 16, {color: P.ground, alpha: q});
      dot(x, rail - 5, 16, {color: P.authority, alpha: q * .7, hollow: true, width: 2});
      dot(x, rail - 5, 10, {color: P.authority, alpha: q});
      if (lit > 0) ring(x, rail - 5, 25, {color: P.authority, alpha: g4 * lit, width: 2});
    });
    railNames(en ? ["Context", "Permissions", "Verification", "Result"] : ["背景材料", "权限", "核验", "结果"], xs, rail - 5,
      {side: -1, gap: NAME_GAP + 24, alpha: i => g4 * listIn(t, owned, i), color: () => P.authority, set: "owned"});
    // The note under the rail is centred on all four marks and stands on its own word: the English says "owns" before
    // the marks arrive, so they fill in under it.
    nameText(L("负责", "Owns"), 1000, rail + 30, {valign: "top", color: P.muted, size: NOTE, alpha: g4 * named(t, cueFrom(s, "负责", "owns", caller))});
  }
  // 5. Submitting work an Agent helped with means you have understood it, checked it and accept responsibility for its
  // consequences. The
  // person who called the Agent stands at the left, named so until the words address it as you, and the work it submits
  // at the right, so the pair is centred before the vouchers come; the three vouchers then build into one column between
  // them, each checked on its words.
  const transfers = cue(s, "委托转移的是工作", "delegation transfers");
  const vouched = cues(s, [["看懂了", "understood"], ["检查过", "checked it"], ["为后果负责", "accept responsibility"]]);
  const g5 = base * stageIn(t, submit) * stageOut(t, transfers);
  if (g5 > 0) {
    // The caller's name gives way just before the words that address it as you, so the two never stand together. The
    // person and the work stand on one ground line, the page's foot, and their names hang from it on one line, a row
    // clear below the vouchers' last item rather than just off its line. The English vouchers stand 30 px further
    // left, so their longest name keeps well clear of the work's name on the line below rather than stepping into it.
    const px = 560, y = 500, wx = 1340, kx = L(800, 770), youAt = cueFrom(s, "你", "you", submit), you = named(t, youAt);
    const foot = y + 100, nameTop = foot + NAME_GAP;
    person(px, foot - 38, {alpha: g5, color: P.authority, size: 1.7});
    nameText(L("调用智能体的人", "The person who calls an Agent"), px, nameTop, {valign: "top", width: 400, color: P.authority, alpha: g5 * (1 - ramp(t, youAt - .45, .3))});
    nameText(L("你", "You"), px, nameTop, {valign: "top", color: P.authority, alpha: g5 * you});
    s17Page(wx - 90, y - 130, 180, 230, {alpha: g5, rows: 4});
    agent(wx + 90, y - 130, {alpha: g5, size: 1});
    nameText(L("它帮忙做的工作", "Agent-assisted work"), wx, nameTop, {valign: "top", width: 300, alpha: g5 * named(t, submit)});
    const tops = stackTops(vouched.map(() => blockHeight(1)), CONTENT_CY - 10, 72), mid = i => tops[i] + labelSize(LABEL) / 2;
    vouched.forEach((at, i) => {
      const yy = mid(i), q = ramp(t, at - .15, .4) * g5;
      check(kx, yy, 26, {color: P.authority, alpha: q, upto: clamp((t - at + .15) / .35)});
      if (speaking(t, vouched, i) > 0) ring(kx, yy, 26, {color: P.authority, alpha: g5 * speaking(t, vouched, i), width: 2.5});
      nameText(en ? ["Understood", "Checked it", "Accept responsibility"][i] : ["看懂了", "检查过", "为后果负责"][i], kx + 26 + NAME_GAP, yy,
        {align: "left", alpha: g5 * listIn(t, vouched, i), set: "vouched"});
    });
  }
  // 6. Delegation transfers the work, not that duty: the person and the Agent face each other across the way of the
  // delegation, drawn and named on its first word, and the work is named with it, in the same clause, so its page never
  // waits for its name. On "transfers" the work crosses along it to the Agent; the duty stays with the person, and its
  // way across stops at a short bar.
  const examine = cue(s, "检查实际的工作和证据", "examines the actual work"), dutyAt = cue(s, "不是这份责任", "not that duty");
  const acceptor = cue(s, "验收人检查", "the acceptor examines");
  const g6 = base * stageIn(t, transfers) * stageOut(t, acceptor);
  if (g6 > 0) {
    const lx = 300, rx = 1080, fw = 540, move = glide(t, cue(s, "转移", "transfers") + .05, rx + 170 - lx - 330);
    person(lx + 120, 506, {alpha: g6, color: P.authority, size: 1.2});
    agent(rx + fw - 120, 500, {alpha: g6, size: 1.3});
    // The work travels along the delegation from the person's side to the Agent's, covering the way as it passes. The
    // way rises from the person, runs over both sides and comes down to the Agent, where it ends in a point.
    const wx = mix(lx + 330, rx + 170, move);
    link(lx + 120, 458, rx + fw - 120, 464, {route: "vhv", mid: 402, alpha: g6, draw: {t, at: transfers + .05}});
    nameText(L("委托", "Delegation"), (lx + fw + rx) / 2, 330, {valign: "bottom", alpha: g6 * named(t, transfers)});
    s17Page(wx - 50, 340, 100, 124, {alpha: g6, rows: 3});
    nameText(L("工作", "The work"), wx, 340 + 124 + NAME_GAP, {valign: "top", alpha: g6 * named(t, transfers)});
    // The duty stays: a seal on the person's side whose way across stops at the gap between the two sides.
    seal(lx + 330, 600, 30, {alpha: g6 * ramp(t, dutyAt - .15, .4)});
    link(lx + 370, 600, 954, 600, {color: P.unknown, alpha: g6 * ramp(t, dutyAt + .05, .3), upto: drawShare(t, dutyAt + .05, Math.abs(954 - (lx + 370)), .5), end: false, dash: [8, 8]});
    line(960, 572, 960, 628, {color: P.unknown, alpha: ramp(t, cueFrom(s, "责任", "duty", dutyAt) + .05, .25) * g6, width: 4});
    nameText(L("这份责任", "That duty"), lx + 330, 600 + 30 + NAME_GAP, {valign: "top", color: P.authority, alpha: g6 * named(t, dutyAt)});
  }
  // 7. The acceptor examines the actual work and evidence: the stage cuts in on the words that name the acceptor, the
  // acceptor stands over the work at the centre, and the Agent stands at the left. Unmet conditions send the work back to
  // the member: a way runs from the work on the words that send it back, and the member arrives at its end, beside the
  // Agent, on the words that name them; the delegated boundary (in Chinese, the scope of the delegation) is drawn round
  // both on the words that name it. Met ones let it be accepted, recorded and handed off, three steps on one rail at the
  // right. Acceptance never expands permission: the boundary keeps its size and the expansion is refused. Until the met
  // branch is named, what stands of the stage stands right of its place, centred on the frame, and on the met branch's
  // words it moves left to its place as the rail draws on; the rail stands as far left as centres the whole stage on
  // the work, which stands at the centre.
  const [unmet, met, noExpand] = cues(s, [["条件不满足", "if the agreed conditions are unmet"], ["满足了", "if they are met"], ["验收不会扩大权限", "acceptance never expands"]]);
  const steps = cues(s, [["才验收", "accepted"], ["记录", "recorded"], ["交接", "handed off"]]);
  const g7 = base * stageIn(t, acceptor);
  if (g7 > 0) {
    // The two branches' conditions are named on one line: the met branch's rail stands so its label shares the unmet
    // reason's first line under the boundary, clear below the line of names. The English rail stops 100 px left, short
    // of the 135 px that would centre the stage exactly, so its start keeps clear of the work's page.
    const lead = L(210, 170) * (1 - glide(t, met + .05, L(210, 170)));
    const ax = 470 + lead, ay = 500, mx = 630 + lead, bx = 395 + lead, by = 430, bw = 320, bh = 190, ex = 960 + lead, ey = 500;
    const xs = [1220, 1400, 1580].map(x => x - L(84, 100)), ry = by + bh + NAME_GAP + labelSize(LABEL) + NAME_GAP + 22;
    const returns = cueFrom(s, "退回", "goes back", unmet), memberAt = cueFrom(s, "成员", "the member", unmet);
    const nameY = ay + 30 + NAME_GAP;
    // The boundary stands on the words that name it, the boundary within which the work goes back.
    const bound = named(t, cueFrom(s, "委托范围", "the delegation boundary", unmet)) * g7;
    box(bx, by, bw, bh, {stroke: P.evidence, alpha: bound, radius: 22, width: mix(2.5, 4, ramp(t, noExpand + .05, .3))});
    nameText(L("委托范围", "The delegation boundary"), bx, by - NAME_GAP, {align: "left", valign: "bottom", color: P.evidence, alpha: bound});
    // The Agent comes in just after the cut, so it never reads as the last stage's person stepping across.
    const agentIn = g7 * ramp(t, acceptor + STAGE_CUT, .3);
    agent(ax, ay, {alpha: agentIn, size: 1.3});
    nameText(L("智能体", "Agent"), ax, nameY, {valign: "top", color: P.evidence, alpha: agentIn});
    // The member the unmet work goes back to, beside the Agent within the boundary. It stands at the acceptor's size, an
    // icon's height, so its head and shoulders read as one figure under its name.
    person(mx, ay, {color: P.authority, size: 1.1, alpha: g7 * ramp(t, memberAt - .15, .4)});
    nameText(L("成员", "Member"), mx, nameY, {valign: "top", color: P.authority, alpha: g7 * named(t, memberAt)});
    // The work stands on the words that name it, under the acceptor's look, its foot on the line where the Agent and the
    // member stand, so the three are named on one line.
    const actual = cueFrom(s, "实际的工作", "actual work", examine), WT = nameY - NAME_GAP - 124;
    s17Page(ex - 50, WT, 100, 124, {alpha: g7 * ramp(t, actual - .15, .4), rows: 3});
    // The acceptor examines from above the work.
    person(ex, 290, {alpha: g7, color: P.authority, size: 1.1});
    nameText(L("验收人", "The acceptor"), ex + 17 + NAME_GAP, 290 - 8, {align: "left", color: P.authority, alpha: g7});
    link(ex, 330, ex, WT - 10, {color: P.authority, alpha: g7 * ramp(t, examine + .05, .3), draw: {t, at: examine + .05}});
    // The work's name stands on one line in each edition, clear above the met branch's name.
    nameText(L("实际的工作和证据", "The actual work and evidence"), ex, nameY, {valign: "top", width: L(300, 460), alpha: g7 * named(t, actual)});
    // Unmet conditions: a way back from the work to the member, drawn on the words that send it back, and the reason
    // beneath the boundary. It is a firm way, as the met branch's rail is, since both are conditions the acceptor applies.
    link(ex - 62, ey, mx + 40, ey, {color: P.unknown, alpha: g7 * ramp(t, returns - .1, .3), draw: {t, at: returns - .05}});
    // The reason keeps its spoken words, wrapping as its parts under the boundary. The Chinese reason ends on the member
    // it returns the work to, so it stands under the member and comes in with the member's name; the English keeps to
    // the condition, since with "the work goes back" it would repeat its caption: it stands centred under the Agent,
    // alone there, and moves to the middle of the boundary's place as the member arrives beside the Agent.
    const unmetParts = en ? ["Conditions are unmet"] : ["条件不满足", "，就退回给成员"];
    const unmetW = Math.max(...growTexts(unmetParts, 340).map(line => measure(line.map(([, v]) => v).join(""))));
    growName(t, unmetParts, en ? [unmet, returns] : [memberAt, memberAt], L(mx, mix(ax, bx + bw / 2, glide(t, memberAt + .05, bx + bw / 2 - ax))) - unmetW / 2, by + bh + NAME_GAP,
      {width: 340, color: P.muted, alpha: g7});
    // The met branch's rail is drawn 3 px wide, firm enough to read as part of the picture while its steps arrive.
    link(xs[0] - 70, ry, xs[2], ry, {alpha: g7 * ramp(t, met - .1, .3), draw: {t, at: met}, end: false, width: 3});
    xs.forEach((x, i) => {
      const q = ramp(t, steps[i] - .15, .4) * g7;
      dot(x, ry, 22, {color: P.ground, alpha: q});
      if (i === 0) check(x, ry, 22, {alpha: q});
      if (i === 1) s17Page(x - 12, ry - 15, 24, 30, {alpha: q, rows: 2});
      if (i === 2) link(x - 14, ry, x + 14, ry, {color: P.ink, alpha: q});
      if (speaking(t, steps, i) > 0) ring(x, ry, 22, {color: P.evidence, alpha: g7 * speaking(t, steps, i), width: 2.5});
    });
    railNames(en ? ["Accepted", "Recorded", "Handed off"] : ["验收", "记录", "交接"], xs, ry + 22, {gap: NAME_GAP, alpha: i => g7 * listIn(t, steps, i), set: "steps"});
    // The met branch's condition is named over its first step, centred on the check's axis as the step's name is below.
    nameText(L("满足了", "If they are met"), xs[0], ry - 22 - NAME_GAP, {valign: "bottom", color: P.evidence, alpha: g7 * named(t, met)});
    // Acceptance never expands permission: over the boundary, the expansion is refused and the boundary keeps its size.
    // It starts at the boundary's edge, as the boundary's name does, a wide gap above that name.
    rejectedName(L("扩大权限", "Expands permission"), bx, by - NAME_GAP - labelSize(LABEL) - 40, {align: "left", valign: "bottom",
      alpha: g7 * named(t, noExpand), mark: ramp(t, noExpand + .5, .4)});
  }
};


/* ---------------- 21 human-agent: check the actual work ---------------- */
scenes["21"] = function (s, t) {
  const [own, unrelated, parallel, integrate, majority] = cues(s, [["智能体也要先确认", "an agent must first confirm"],
    ["不顺手改无关的东西", "without incidental changes"], ["多个智能体并行", "parallel agents"], ["指定一个人", "one person verifying"], ["多数意见不是证据", "majority opinion"]]);
  const [lasting, authoritative, teamFact] = cues(s, [["检查过的输出", "even checked output"], ["这项工作的权威记录", "authoritative record"],
    ["长期依靠的事实", "lasting team fact"]]);
  const base = ramp(t, opening(s), .7);
  // The actual work is a stack of pages, named in the first stage. The lens is the reviewer's look.
  const WX = 630, WY = 340, WW = 340, WH = 380, wcx = WX + WW / 2, wcy = WY + WH / 2;
  const work = (a, x = WX) => {
    // The pages behind show only the edges that stand clear of the front page.
    for (let k = 2; k >= 1; k--) path([[x + k * 26, WY - (k - 1) * 26], [x + k * 26, WY - k * 26], [x + WW + k * 26, WY - k * 26], [x + WW + k * 26, WY + WH - k * 26],
      [x + WW + (k - 1) * 26, WY + WH - k * 26]], {color: P.ink, alpha: a, width: 2});
    documentIcon(x, WY, WW, WH, {alpha: a, rows: 0});
    // The page's lines are written as one block of text.
    stroke(() => { for (let i = 0; i < 9; i++) { ctx.moveTo(x + 34, WY + 44 + i * 36); ctx.lineTo(x + WW - (i % 3 === 2 ? 120 : 40), WY + 44 + i * 36); } },
      {color: P.muted, alpha: a * .8, width: 2});
  };
  const lens = (x, y, a) => {
    ring(x, y, 54, {color: P.evidence, alpha: a, width: 3.5});
    line(x + 39, y + 39, x + 76, y + 76, {color: P.evidence, alpha: a, width: 5});
  };
  const [output, actual, summary, first] = cues(s, [["智能体的输出", "an agent's output"], ["实际的工作", "checking the work"], ["它写的摘要", "its summary"],
    ["行动依据和现状", "is the authority to act correct"]]);
  // 1. Checking an Agent's output means checking the work, not just its summary. The output stands near the centre on
  // the first words as one stack of pages under its name, with the check's lens over it; the lens settles onto the
  // pages on the words that name the work, and the summary the Agent wrote stands beside the stack on its own name,
  // unread. While the stack stands alone it stands centred, and on the summary's words it moves left to its place
  // beside the summary.
  const one = base * stageOut(t, first);
  if (one > 0) {
    // The summary stands on the stack's bottom line, so the two names under them share one baseline.
    const SX = 1090, SW = 190, SH = 240, SY = WY + WH - SH, scx = SX + SW / 2;
    const go = glide(t, actual + .05, Math.hypot(70, 60)), sway = ramp(voiceTime(t), voiceTime(actual + 1), .6), v = voiceTime(t) - voiceTime(actual);
    // The stack's pages span WX to WX + WW + 52; alone, they stand that far right of their place. The move to their
    // place beside the summary is a glide; it advances in voice time, so a move still under way when the English thought
    // ends on "summary" rests with the voice and settles as the next thought begins.
    const pairOff = 960 - (2 * WX + WW + 52) / 2, paired = glide(t, summary + .05, pairOff), lead = pairOff * (1 - paired);
    // The lens settles within a short reach of where it stands at first, so it never slides across the frame.
    const opens = named(t, s.words[0].start), LX = wcx + 70, LY = wcy - 80;
    work(one * opens, WX + lead);
    s17Page(SX, SY, SW, SH, {alpha: one * named(t, summary), rows: 2});
    // The output's name heads what stands of it: the stack alone, then the stack and its summary, moving to their centre
    // on the summary's words.
    const headX = mix(960, (WX + SX + SW) / 2, paired);
    nameText(L("智能体的输出", "An Agent's output"), headX, WY - 52 - NAME_GAP, {valign: "bottom", alpha: one * named(t, output)});
    nameText(L("实际的工作", "The work"), wcx + 26 + lead, WY + WH + NAME_GAP, {valign: "top", alpha: one * named(t, actual)});
    nameText(L("它写的摘要", "Its summary"), scx, SY + SH + NAME_GAP, {valign: "top", color: P.muted, alpha: one * named(t, summary)});
    lens(mix(LX, wcx, go) + lead + Math.sin(v * 1.1) * 10 * sway, mix(LY, wcy - 20, go) + Math.cos(v * .9) * 7 * sway, one * opens);
  }
  // 2. The check reads the actual work. The work is one page whose questions build down it as one checklist: each
  // question's row arrives on its own words with its marks and name, and is ticked on the words that ask whether it
  // holds. The basis the work relies on (in Chinese, its rules) is a sealed document and the current state a clock; the
  // inputs are a full set; the changes lie inside what was agreed and reported; the verification runs on the current version in the right environment; and the
  // high-risk action carries the seal of the decision owner who approved it. The page grows with its rows and stays
  // centred: each new row reflows the column by half a row, eased from just before its words. The list spans two thoughts
  // in Chinese and one in English.
  const two = base * stageIn(t, first) * stageOut(t, own);
  if (two > 0) {
    const c = (zh, english) => cue(s, zh, english);
    // Each part's marks, on the words that show them, and the word that ticks the part.
    const marks = en ? [[c("", "authority"), c("", "the state current")], [c("", "inputs")],
      [c("", "actual changes"), c("", "agreed and reported scope")], [c("", "verification"), c("", "current version"), c("", "right environment"), c("", "really run")],
      [c("", "anything highrisk"), c("", "the decision owner"), c("", "explicitly approve")]]
      : [[c("行动依据", ""), c("现状", "")], [c("输入", "")],
        [c("实际改动", ""), c("约定", "")], [c("核验真在", ""), c("当前版本", ""), c("正确环境", ""), c("跑过吗", "")],
        [c("高风险的操作", ""), c("决策负责人", ""), c("明确批准", "")]];
    const sealAt = Math.max(marks[4][0], marks[4][2]) + .05;
    // The scope row's question ends on its scope, which the English names after "agreed and reported".
    const ticks = (en ? [c("", "current"), c("", "true and complete"), c("", "reported scope") + .45, marks[3][2] + .45]
      : [c("最新", ""), c("真实完整", ""), c("一致吗", ""), marks[3][3] + .45]).concat(sealAt);
    const starts = marks.map(v => Math.min(...v));
    const PL = 360, PW = 1200, pitch = 90, IX = 480, NX = 620, TX = PL + PW - 60;
    // A row whose words open a thought reflows the page on those words, not in the quiet before them, and the page is
    // grown to take the row before the row stands in it.
    const shown = starts.map(at => soon(t, pauseHold(at - .3, .4), .4)), n = shown.reduce((a, b) => a + b, 0);
    const rowAt = starts.map(at => Math.max(at - .15, pauseHold(at - .3, .4) + .25));
    // A mark stands on its words, and not before its row does.
    const on = (k, j) => ramp(t, Math.max(marks[k][j] - .15, rowAt[k]), .4) * two;
    const yOf = k => 500 + (k - (n - 1) / 2) * pitch, top = 500 - n * pitch / 2 - 24, bottom = 500 + n * pitch / 2 + 24;
    documentIcon(PL, top, PW, bottom - top, {alpha: two, rows: 0});
    nameText(L("实际的工作", "The work"), PL, top - NAME_GAP, {align: "left", valign: "bottom", alpha: two});
    const names = en ? ["Authority to act", "Inputs", "Actual changes", "Verification", "Approve anything high-risk"]
      : ["行动依据和现状", "输入", "实际改动", "核验", "高风险的操作"];
    names.forEach((v, k) => {
      // The row being asked stays marked until the next row stands, so its mark never fades in the quiet before it. The
      // mark enters with its row, which may stand after the row's words begin, so it never appears at once.
      const y = yOf(k), row = ramp(t, rowAt[k], .4) * two, lit = k + 1 < starts.length ? ramp(t, starts[k] - .15, .3) * (1 - ramp(t, rowAt[k + 1], .3)) : speaking(t, starts, k);
      if (row <= 0) return;
      if (lit > 0) line(PL + 22, y - 30, PL + 22, y + 30, {color: P.evidence, alpha: lit * row, width: 4});
      // The row is one mark under its name: a rule under the row runs from its marks to the box where it is ticked.
      line(IX - 80, y + 40, TX + 18, y + 40, {color: P.line, alpha: row, width: 2});
      // The reviewer reads the row: a bright run travels along its rule, under its name, from its marks to its box while
      // it is asked, easing off and settling as the row is ticked, and leaves as the row is ticked. It runs in voice
      // time, so a run still under way when a thought ends rests in the quiet.
      const read = ease((voiceTime(t) - voiceTime(starts[k])) / Math.max(.6, voiceTime(ticks[k]) - voiceTime(starts[k]), 1.5 * (TX - 90 - IX + 80) / GLIDE_PEAK)), rx = mix(IX - 80, TX - 90, read);
      if (read > 0 && read < 1) line(rx, y + 40, rx + 60, y + 40, {color: P.evidence, alpha: two * pass(read, .15), width: 6});
      // The box stands level with its row's name, centred on the name's line and clear of the rule under it.
      box(TX - 18, y - 18, 36, 36, {stroke: P.evidence, alpha: row, radius: 6, width: 2.5});
      if (k === 0) {
        // The basis, a document under a seal, and the current state, a clock.
        documentIcon(IX - 74, y - 34, 52, 68, {alpha: on(0, 0), rows: 0});
        dot(IX - 26, y + 24, 13, {color: P.row, alpha: on(0, 0)});
        seal(IX - 26, y + 24, 13, {alpha: on(0, 0)});
        clock(IX + 44, y, 24, {hand: .3, color: P.evidence, alpha: on(0, 1)});
      }
      // The inputs: the full set of records the work read.
      if (k === 1) for (let j = 0; j < 3; j++) tableIcon(IX - 74 + j * 20, y - 32 + j * 12, 100, 40, {alpha: on(1, 0), rows: 3, cols: 3});
      if (k === 2) {
        // The changes, inside the agreed scope that is drawn around them.
        [[-52, -18, 70], [-24, 0, 84], [-46, 18, 56]].forEach(([dx, dy, w]) => box(IX + dx, y + dy - 6, w, 12, {fill: P.evidence, alpha: on(2, 0), radius: 6}));
        const scope = {t, at: marks[2][1] + .05};
        path([[IX - 76, y - 36], [IX + 76, y - 36], [IX + 76, y + 36], [IX - 76, y + 36], [IX - 76, y - 36]], {color: P.ink, alpha: two, width: 2.5, draw: scope});
      }
      if (k === 3) {
        // The verification: a run on the current version, in the right environment around it.
        const runX = IX - 34;
        ring(runX, y, 24, {color: P.evidence, alpha: on(3, 0), width: 3});
        fill(() => { ctx.moveTo(runX - 7, y - 10); ctx.lineTo(runX + 11, y); ctx.lineTo(runX - 7, y + 10); ctx.closePath(); }, {color: P.evidence, alpha: on(3, 0)});
        const lap = glide(t, marks[3][3] + .05, 2 * Math.PI * 24, 1);
        if (lap > 0 && lap < 1) flowDot(runX + 24 * Math.cos(-Math.PI / 2 + lap * Math.PI * 2), y + 24 * Math.sin(-Math.PI / 2 + lap * Math.PI * 2), 6, lap, {alpha: two}, 2 * Math.PI * 24);
        box(IX + 10, y - 17, 54, 34, {fill: P.row, alpha: on(3, 1), radius: 6});
        text("v2", IX + 37, y + 1, 26, {role: "mark", align: "center", color: P.evidence, alpha: on(3, 1)});
        box(IX - 78, y - 38, 156, 76, {stroke: P.ink, alpha: on(3, 2), radius: 12, width: 2});
      }
      if (k === 4) {
        // The high-risk action and the decision owner, whose seal moves onto the action once it is approved.
        diamond(IX - 46, y + 6, 18, {color: P.unknown, alpha: on(4, 0), solid: true});
        person(IX + 44, y + 12, {color: P.authority, alpha: on(4, 1), size: .8});
        const move = soon(t, sealAt, .35), sealX = mix(IX + 44, IX - 26, move), sealY = mix(y - 30, y - 12, move);
        dot(sealX, sealY, 14, {color: P.row, alpha: on(4, 2)});
        seal(sealX, sealY, 14, {alpha: on(4, 2)});
      }
      // Each row is ticked in its box on its words; its name stands on the row's first words, one list down the page.
      check(TX, y, 24, {alpha: two, draw: {t, at: ticks[k] + .05}});
      nameText(v, NX, y, {align: "left", alpha: two * ramp(t, rowAt[k], .4) * listLevel(t, starts, k), set: "checks"});
    });
  }
  // 3. The Agent's own way runs as one path: it confirms the task, the object it handles (in English, its target), the
  // current state and the responsible person at the start, advances step by step, each step reversible and verifiable,
  // leaves the side way to unrelated changes barred, runs the checks that match its claim, reads the complete results
  // and only then concludes. The path stands as a firm rail from
  // the stage's first words, which name the Agent's own way, and the Agent is named at its head on those words; each
  // station marks as the Agent reaches it, each stone is laid on its own word as the Agent steps onto it, and the names
  // build below the path on one baseline and stay.
  const three = base * stageIn(t, own) * stageOut(t, parallel);
  if (three > 0) {
    // The first station stands clear of the frame's edge, so its English name of five things, listed by commas as key
    // words with the rules named by theirs, fits on two even lines, the task, target and current state over the person
    // and the rules (with "and" before the rules no two lines keep a block's shape), and its Chinese name, 60 px
    // further right, on two. Each other name stands on one line but the Chinese steps', a
    // term row whose term, 一步步来, stands over what it says of each step; the stations keep the names 40 px apart or more,
    // the steps' name centres on its stones, and the Chinese checks' name stands clear of the side way's column.
    const Y = 560, xs = en ? [340, 720, 1080, 1390, 1700] : [400, 820, 1230, 1520, 1720], stones = [565, 655, 745, 835].map(x => x + L(120, 20)), SP = L(1020, 900);
    const [confirm, runs, read, conclude] = cues(s, [["先确认", "first confirm"], ["跑完对得上说法的核验", "runs checks"], ["读完全部结果", "reads the complete results"],
      ["再下结论", "before summarizing"]]);
    // The things confirmed first: the current state is said once in each edition from the Agent's words on.
    const stateAt = cueFrom(s, "现状", "current state", own), ticks = [cue(s, "任务", "the task"), cue(s, "要处理的对象", "target"), stateAt,
      cueFrom(s, "负责人", "responsible person", stateAt), cueFrom(s, "适用的项目规则", "applicable local rules", stateAt)];
    // The stones, one on each word of the steps.
    const stepAts = cues(s, [["一步步来", "moves in"], ["每步", "reversible"], ["可逆", "verifiable"], ["可核验", "steps"]]);
    // The first name keeps its five things on two lines in each edition, so it is set wider than the rail's other
    // names.
    const firstName = [en ? ["Task", ", target", ", current state", ", responsible person", ", local rules"]
      : ["先确认任务、", "要处理的对象、", "现状、", "负责人", "和适用的项目规则"],
      [confirm, ...ticks.slice(1)]];
    const stepName = en ? [["Reversible,", " verifiable steps"], stepAts.slice(1, 3)] : [["一步步来", "，每步", "都可逆、可核验"], stepAts.slice(0, 3)];
    const way = [confirm, stepName[1][0], runs, read, conclude], NY = Y + NAME_GAP + 18, wrap = L(280, 360), FIRST = L(560, 430);
    // Every name of the row centres its lines on its station. The Agent's name heads the column of the first station's
    // name, on the left edge of its widest line's ink, and the path begins one name gap after it.
    const firstLines = growTexts(firstName[0], FIRST).map(line => line.map(([, v]) => v).join(""));
    const widest = firstLines.reduce((a, b) => measure(b) > measure(a) ? b : a);
    const head = L("智能体", "Agent"), headX = xs[0] - measure(widest) / 2 + hangOf(widest, "center");
    line(headX + measure(head) + NAME_GAP, Y, xs[4] + 70, Y, {color: P.muted, alpha: three, width: 3});
    nameText(head, headX, Y, {align: "left", color: P.evidence, alpha: three * named(t, own)});
    [0, 2, 3, 4].forEach(i => {
      // Each station's halo stands well wider than the Agent, so the Agent walking past is never read as one of them.
      if (speaking(t, way, i) > 0) ring(xs[i], Y, 30, {color: P.evidence, alpha: speaking(t, way, i) * restMark(P.evidence, .5) * three, width: 2});
    });
    // The five things it confirms first, one box each, ticked on its own word.
    ticks.forEach((at, k) => {
      const bx = xs[0] + (k - (ticks.length - 1) / 2) * 40, on = named(t, at) * three;
      box(bx - 13, Y - 90, 26, 26, {stroke: P.evidence, alpha: on, radius: 5, width: 2.5});
      check(bx, Y - 77, 15, {alpha: on, upto: clamp((t - at + .1) / .35)});
    });
    // Steps: each stone is laid on its own word and ticked as the Agent steps onto it.
    // Each stone is laid a tenth of a second into its word, so it never stands long before the steps' name reaches it.
    stones.forEach((x, k) => {
      const on = soon(t, stepAts[k] + .1, .5);
      box(x - 30, Y - 7, 60, 14, {fill: P.row, stroke: P.ink, alpha: three * on, radius: 7});
      check(x, Y - 40, 18, {alpha: three * on, upto: clamp((t - stepAts[k] - .1) / .35)});
    });
    // The side way to unrelated things stops at a bar halfway; the refused change names the place it would reach.
    const tryAt = unrelated + .05, barY = Y - 135;
    box(SP - 50, Y - 300, 100, 60, {stroke: P.muted, alpha: three * ramp(t, tryAt, .3), radius: 6, dash: [6, 6]});
    link(SP, Y - 16, SP, Y - 240, {color: P.unknown, alpha: three * ramp(t, tryAt, .3), upto: .53, draw: {t, at: tryAt}, end: false, dash: [8, 8]});
    line(SP - 22, barY, SP + 22, barY, {color: P.unknown, alpha: ramp(t, tryAt + .5, .3) * three, width: 4});
    rejectedName(L("顺手改无关的东西", "Incidental changes"), SP, Y - 300 - NAME_GAP, {valign: "bottom", alpha: three * named(t, unrelated), mark: ramp(t, tryAt + .5, .3)});
    // The checks run, the complete results are read to their end, and only then the conclusion is written.
    check(xs[2], Y - 80, 36, {alpha: three * named(t, runs), upto: clamp((t - runs - .3) / .5)});
    // The results are read to the end: the page's rows light in turn, from the first to the last.
    const RW = 120, RH = 160, rx = xs[3] - RW / 2, ry = Y - 260, readQ = clamp((t - read - .05) / 1.2) * 6;
    s17Page(rx, ry, RW, RH, {alpha: three * named(t, read), rows: 6});
    for (let i = 0; i < 6; i++) {
      const yy = ry + RH * (.3 + i * .55 / 6);
      line(rx + RW * .14, yy, rx + RW * (i % 2 ? .62 : .82), yy, {color: P.evidence, alpha: three * clamp(readQ - i), width: 2.5});
    }
    s17Page(xs[4] - 40, Y - 200, 80, 104, {alpha: three * named(t, conclude), rows: 2});
    let ax = xs[0];
    // Each stride is a glide timed by its length, in voice time. The steps' words come closer together than a stride
    // takes, so the walk over the four stones is one glide from the steps' first word to their last, which reaches each
    // stone near its own word and never adds two strides' paces.
    const walk = [[stepAts[0], stones[3], xs[0]], [runs, xs[2], stones[3]], [read, xs[3], xs[2]], [conclude, xs[4], xs[3]]];
    walk.forEach(([at, x, x0], k) => {
      const go = voiceTime(at + .05), span = k ? glideTime(x - x0) : Math.max(glideTime(x - x0), voiceTime(stepAts[3] + .05) - go);
      ax = mix(ax, x, smoother((voiceTime(t) - go) / span));
    });
    // Each station lights as the Agent nears it, its dot growing over the Agent's last 40 px to it, and stays lit.
    [0, 2, 3, 4].forEach(i => { const near = ax >= xs[i] ? 1 : clamp(1 - (xs[i] - ax) / 40); if (near > 0) dot(xs[i], Y, 13 * near, {color: P.evidence, alpha: three}); });
    agent(ax, Y, {alpha: three});
    // The names, one baseline below the path, their lines centred on their stations; the growing ones keep their final
    // lines and build part by part on their words.
    [firstName, stepName].forEach(([parts, ats], i) => {
      if (i && !en) termRow(t, [parts[0]], [ats[0]], [parts[1].slice(1), parts[2]], ats.slice(1), xs[i], NY,
        {inline: false, align: "center", alpha: three * listLevel(t, way, i), set: "way", build: true});
      else growName(t, parts, ats, xs[i], NY, {width: i ? wrap : FIRST, alpha: three * listLevel(t, way, i), set: "way", build: true, align: "center"});
    });
    // The last three names stand whole on one line each, so no line ends on the article of an object or breaks inside
    // a modifier.
    (en ? ["Runs checks", "Reads the complete results", "Summarizing"] : ["跑完对得上说法的核验", "读完全部结果", "再下结论"])
      .forEach((v, k) => nameText(v, xs[k + 2], NY, {valign: "top", width: 370, alpha: three * listIn(t, way, k + 2), set: "way"}));
  }
  // 4. Parallel Agents suit only independent questions, paths or review angles: the work flows down the frame. The
  // Agents stand together on the first lane from the stage's first words, which name them, the ones still to take a
  // lane stacked behind the first, and the independent questions stand over the lanes, one each, on their own words;
  // each Agent takes its own lane on the words of its role, which is named beside it, and leaves the stack as it arrives
  // there, so no Agent stands without a name. The line of changing nothing crosses every lane on its words, and the
  // lanes join below the one person who combines their results and owns the judgment, as that person is named; each
  // lane's way down leaves clear of its lock. The stage is centred on its extent, from its row labels' left edge to what
  // stands at its right: the lock's line while the last role is still to come, then the last role's name, which it
  // moves to make room for on that role's words.
  const four = base * stageIn(t, parallel) * stageOut(t, majority);
  if (four > 0) {
    const [apart, readOnly] = cues(s, [["能拆开的独立问题", "independent questions"], ["只看不改", "read-only"]]);
    const roles = cues(s, [["研究", "research"], ["评审和", "review and"], ["交叉核对", "crosschecking"]]);
    const rnames = en ? ["Research", "Review", "Cross-checking"] : ["研究", "评审", "交叉核对"], ownerName = L("一个人汇总、核验、做最后判断", "");
    // The separable work is named in its three kinds on two lines, centred on the questions' row; the stage's left
    // extent is its widest line.
    const apartLines = L(["能拆开的独立问题、", "路径或评审角度"], ["Independent questions,", "paths or review angles"]);
    const left = 700 - 60 - NAME_GAP - Math.max(measure(L("多个智能体并行", "Parallel Agents")), measure(L("只看不改", "Read-only")),
      ...apartLines.map(v => measure(v)));
    const reach = Math.max(1220 + 30 + NAME_GAP + measure(rnames[2]), 960 + 30 + NAME_GAP + measure(ownerName));
    const sh0 = 960 - (left + 1220 + 40) / 2, sh1 = 960 - (left + reach) / 2, sh = mix(sh0, sh1, glide(t, roles[2] + .05, sh1 - sh0));
    const xs = [700, 960, 1220].map(x => x + sh), BY = 270, QY = 340, AY = 480, KY = 630, OY = 760, join = {t, at: integrate + .05};
    const asked = named(t, apart) * four, shut = named(t, readOnly) * four, owner = named(t, integrate) * four;
    nameText(L("多个智能体并行", "Parallel Agents"), xs[0] - 60 - NAME_GAP, AY, {align: "right", alpha: four * named(t, parallel)});
    nameText(apartLines, xs[0] - 60 - NAME_GAP, QY, {align: "right", alpha: asked});
    nameText(L("只看不改", "Read-only"), xs[0] - 60 - NAME_GAP, KY, {align: "right", color: P.evidence, alpha: shut});
    line(xs[0] - 40, KY, xs[2] + 40, KY, {color: P.evidence, alpha: shut, width: 2});
    // The work splits into three independent lanes, one Agent each: the bar and its lanes stand with the Agents.
    stroke(() => {
      ctx.moveTo(xs[0], BY); ctx.lineTo(xs[2], BY);
      xs.forEach(x => [[BY, QY - 24], [QY + 24, AY - 30], [AY + 30, KY - 18]].forEach(([a, b]) => { ctx.moveTo(x, a); ctx.lineTo(x, b); }));
    }, {color: P.muted, alpha: four, width: 3});
    // The stack: the Agents still to take their lanes stand behind the first, each 9 px further up and to the left, and
    // the back one leaves as each lane's Agent arrives, so the stack closes up as it empties.
    const takes = roles.map((at, i) => i ? ramp(t, at - .15, .4) : 1), AR = 22 * 1.15;
    [2, 1].forEach(k => {
      const q = four * (1 - takes[3 - k]), x = xs[0] - k * 9, y = AY - k * 9;
      diamond(x, y, AR, {color: P.ground, alpha: q, solid: true});
      diamond(x, y, AR, {color: P.evidence, alpha: q});
    });
    xs.forEach((x, i) => {
      ring(x, QY, 20, {color: P.unknown, alpha: asked, width: 2.5});
      text("?", x, QY + 1, 22, {align: "center", color: P.unknown, alpha: asked, role: "mark"});
      if (!i) diamond(x, AY, AR, {color: P.ground, alpha: four, solid: true});
      agent(x, AY, {alpha: four * takes[i], size: 1.15});
      const lit = speaking(t, roles, i);
      if (lit > 0) ring(x, AY, 38, {color: P.evidence, alpha: lit * restMark(P.evidence, .5) * four, width: 2});
      nameText(rnames[i], x + 30 + NAME_GAP, AY, {align: "left", alpha: four * listIn(t, roles, i), set: "roles"});
      lock(x, KY, {alpha: shut, color: P.evidence, closed: soon(t, readOnly, .5)});
      link(x, KY + 28, xs[1], OY - 42, {route: "vhv", mid: (KY + OY - 22) / 2, alpha: four * ramp(t, integrate - .1, .3), draw: join, flowing: since(t, integrate + .65), lag: i / 3});
    });
    person(xs[1], OY, {alpha: owner, color: P.authority, size: 1.2});
    // The English person is named only by its caption ("with one person verifying and judging the combined result."),
    // so a name would repeat that caption and is left to it.
    nameText(ownerName, xs[1] + 30 + NAME_GAP, OY, {align: "left", width: 520, color: P.authority, alpha: owner});
  }
  // 5. A majority opinion is not evidence: two small frames side by side, the Agents' agreement in one and evidence in
  // the other, and the way from the first to the second stops at a bar on the words that refuse it.
  const five = base * stageIn(t, majority) * stageOut(t, lasting);
  if (five > 0) {
    const [opinion, not, evidence] = cues(s, [["意见", "opinion"], ["不是证据", "not evidence"], ["证据", "evidence"]]);
    const fy = 405, fh = 190, lx = 445, lw = 280, ax = 1200, aw = 240, mid = fy + fh / 2, go = {t, at: opinion + .05}, ev = named(t, evidence) * five;
    box(lx, fy, lw, fh, {stroke: P.line, alpha: five, radius: 10});
    box(ax, fy, aw, fh, {fill: P.row, stroke: P.evidence, alpha: ev, radius: 10});
    nameText(L("多数意见", "A majority opinion"), lx, fy - NAME_GAP, {align: "left", valign: "bottom", alpha: five * named(t, majority)});
    nameText(L("证据", "Evidence"), ax, fy - NAME_GAP, {align: "left", valign: "bottom", color: P.evidence, alpha: ev});
    [lx + 62, lx + 140, lx + 218].forEach(x => {
      agent(x, mid + 34, {alpha: five, size: 1});
      // Each Agent's agreement is a muted tick: an opinion, not the evidence-blue proof in the other frame.
      check(x, mid - 40, 26, {alpha: five, color: P.muted});
    });
    s17Page(ax + aw / 2 - 55, mid - 70, 110, 140, {alpha: ev, rows: 5, stroke: P.evidence});
    link(lx + lw + 12, mid, ax - 12, mid, {color: P.unknown, alpha: five * ramp(t, opinion + .05, .3), upto: .5, draw: go, end: false, dash: [8, 8]});
    line((lx + lw + ax) / 2, mid - 34, (lx + lw + ax) / 2, mid + 34, {color: P.unknown, alpha: ramp(t, not + .05, .3) * five, width: 4});
  }
  // 6. Even checked output becomes a lasting team fact only once its source and limits enter the work's authoritative
  // record. The work flows down the frame: the checked output stands at the top with its source and limits written
  // beside it on their own words, and when they are recorded a way runs down from it into the record below, which
  // appears with its earlier entries on its own words and takes a new entry; the record is stamped as a fact the team
  // can rely on once both the record and the fact are named. The checked output is the stack of the work's pages, as
  // the first stage drew it, so it and its first entry fill the picture while the record is still to come. The stage
  // is centred on its extent, from the output's or the record's name at the left to the entry's rows or the fact at
  // the right.
  const six = base * stageIn(t, lasting);
  if (six > 0) {
    const [recorded, src, lim] = cues(s, [["记进", "recorded"], ["来源", "source"], ["限度", "limits"]]);
    const outputName = L("检查过的输出", "Checked output"), recordName = L("这项工作的权威记录", ""), factName = L("", "A lasting team fact");
    const entries = en ? ["Source", "Limits"] : ["来源", "限度"];
    // The pages behind the front one stand BACK px apart up and to the right; the entries stand clear of them.
    const BACK = 26, left = Math.min(1000 - 110 - NAME_GAP - measure(outputName), 810 - (recordName ? NAME_GAP + measure(recordName) : 0));
    const right = Math.max(1110 + 2 * BACK + 26 + NAME_GAP + Math.max(...entries.map(v => measure(v))), 1190 + 30 + (factName ? NAME_GAP + measure(factName) : 0));
    const shift = 960 - (left + right) / 2;
    const OX = 1000 + shift, OY = 300, OW = 220, OH = 260, RX = 810 + shift, RY = 640, RW = 380, RH = 150, stampAt = Math.max(teamFact, authoritative) + .05;
    const go = soon(t, recorded + .05, .6), rec = named(t, authoritative) * six, EX = OX + OW / 2 + 2 * BACK + 26;
    // The checked output: the work's pages with its check. The pages behind show only the edges that stand clear of the
    // front page.
    const PX = OX - OW / 2;
    for (let k = 2; k >= 1; k--) path([[PX + k * BACK, OY - (k - 1) * BACK], [PX + k * BACK, OY - k * BACK], [PX + OW + k * BACK, OY - k * BACK],
      [PX + OW + k * BACK, OY + OH - k * BACK], [PX + OW + (k - 1) * BACK, OY + OH - k * BACK]], {color: P.ink, alpha: six, width: 2});
    documentIcon(PX, OY, OW, OH, {alpha: six, rows: 0});
    check(OX, OY + OH / 2 + 6, 90, {alpha: six});
    nameText(outputName, PX - NAME_GAP, OY + OH / 2, {align: "right", alpha: six * named(t, lasting)});
    // Its source and limits, one row each beside it, on their own words; the stamp makes the whole entry full ink.
    [src, lim].forEach((at, k) => {
      const y = OY + 90 + k * 56, whole = named(t, at) * ramp(t, stampAt, .35);
      dot(EX, y, 6, {color: P.evidence, alpha: six * named(t, at)});
      nameText(entries[k], EX + NAME_GAP, y, {align: "left", color: P.evidence, alpha: six * Math.max(listIn(t, [src, lim], k), whole), set: "entry"});
    });
    link(OX, OY + OH + 12, OX, RY - 12, {color: P.evidence, alpha: six * named(t, recorded), upto: go, flowing: since(t, recorded + .65)});
    box(RX, RY, RW, RH, {fill: P.row, stroke: P.ink, alpha: rec, radius: 12, width: 2.5});
    // The English names the record only in its caption ("in the authoritative record for that work."), so its name there would repeat
    // the caption word for word and is left to it.
    nameText(recordName, RX - NAME_GAP, RY + RH / 2, {align: "right", width: 320, alpha: rec});
    [RY + 30, RY + 75].forEach((y, k) => line(RX + 40, y, RX + RW - 60 - k * 90, y, {color: P.line, alpha: rec, width: 3}));
    // The new entry the recording adds: a ruled row in the evidence colour, drawn once the way has reached the record.
    line(RX + 40, RY + 120, mix(RX + 40, RX + RW - 100, drawShare(t, recorded + .65, RW - 140)), RY + 120, {color: P.evidence, alpha: six * ramp(t, recorded + .65, .4), width: 4});
    // The stamp sits on the record's right edge and stamps on the later of the record's and the fact's words, so the
    // record and the fact have both been said when it lands; a fact said before it is recorded (English names it first)
    // stands dashed in its place until then.
    const SX = RX + RW, SY = RY + RH / 2, stamp = ramp(t, stampAt, .35) * six;
    if (teamFact + .5 < stampAt) ring(SX, SY, 30, {color: P.evidence, alpha: six * named(t, teamFact) * (1 - ramp(t, stampAt, .35)), width: 2, dash: [6, 6]});
    dot(SX, SY, 30, {color: P.ground, alpha: stamp});
    ring(SX, SY, 30, {color: P.evidence, alpha: stamp, width: 3});
    check(SX, SY + 2, 26, {alpha: stamp, upto: clamp((t - stampAt) / .35)});
    // The Chinese fact is said only in its own caption ("才算团队能长期依靠的事实。"), so its name would repeat that
    // caption and is left to it; the English names it in a longer line.
    nameText(factName, SX + 30 + NAME_GAP, SY, {align: "left", alpha: six * named(t, teamFact)});
  }
};

/* ---------------- 22 human-agent: stop and hand off ---------------- */
scenes["22"] = function (s, t) {
  // The words that stop the Agent and send the escalation up. Both editions name five kinds of situation once and then
  // number them across two thoughts, kinds one and two in the first and three to five in the next.
  const [stopAt, escalate] = cues(s, [["要停下受影响的事", "stop"], ["上报", "escalate"]]);
  const independent = cue(s, "已授权的工作", "independent authorized work");
  const [handoff, ...told] = en ? cues(s, [["", "a completion report names"], ["", "the work"], ["", "the delivery state"], ["", "the evidence"], ["", "the limits"], ["", "any acceptance"]])
    : cues(s, [["汇报完成时", ""], ["做到了哪一步", ""], ["做了什么", ""], ["怎么核验的", ""], ["还有哪些限度", ""], ["还要谁验收", ""]]);
  // What an interruption keeps is read from the interruption on: 22.2 also names uncommitted work.
  const interrupt = cue(s, "中途停下", "on interruption");
  const kept = [["保留现场", "preserve the state"], ["没提交的改动", "uncommitted work"], ["试过和失败", "attempts and failures"],
    ["从哪里接着做", "where to resume"]].map(([zh, english]) => cueFrom(s, zh, english, interrupt));
  const base = ramp(t, opening(s), .7);
  // 1. Stop and escalate, in five kinds of situation, all five on one way, the course of action the kinds stop. A member
  // and an Agent head the way together under one name, as the five bind members and Agents alike, and the person the
  // escalation reaches stands above the way from the first escalation. Each kind is a station on the way: its stop sign stands on a short post over the way, so the sign and
  // its post read as one station, its escalation rises from the sign to the person, and what the kind holds shows
  // beneath the way under its name, each part drawn on its own words. The first sign stands on the words that stop the
  // Agent and is named there; its escalation rises on "escalate", and every later sign and its escalation arrive with
  // the name of their kind. Kind one stacks its two conditions in its column, the conflict over what cannot be
  // identified; kind two stands its first two, too little authority and a boundary the action would cross, side by
  // side over its third, an irreversible step without authorization or recovery, in the order spoken; the one condition
  // of each other kind hangs just above its name, so the name reaches every part of it as it comes. The five build as one list
  // across the two thoughts that number them and stand whole together until the handoff is named, while independent
  // authorized work keeps moving on its own lane below them; they are named as a group on the words that announce them,
  // left of their names and a word space and more clear of the first. The stations stand at one pitch along the way, so
  // the five signs, columns and names keep an even rhythm whatever each holds. Each kind is
  // named by the key phrase that opens it: in Chinese the names the words give kinds one and two ("说不清", "权限不够")
  // and for the others the condition each opens with, each station standing on the word that numbers its kind; in
  // English, where each number is a clause of its own, each station stands on the words after its number, which open
  // its condition, so the English kind two is named "Authority is insufficient", as the Chinese names it 权限不够. Where
  // those words alone lose the clause that gives them their sense, the English name keeps that sense in a short phrase:
  // kind three is "Unrecognized work" and kind five "Continuing would harm", as the Chinese kind five is 再做下去有害.
  // The English names stand whole, each on one line, so each keeps its subject and predicate together: the rail is too
  // dense for them on one baseline, so they stand on two at its one pitch, every other name a row lower on a short stem.
  const names = en ? [["Instructions materially conflict"], ["Authority is insufficient"], ["Unrecognized work"], ["Contradicts expectation"], ["Continuing would harm"]]
    : ["说不清", "权限不够", "来历不明", "核验和预期相反", "再做下去有害"];
  const nameAts = cues(s, en ? [["", "instructions materially conflict"], ["", "authority is insufficient"], ["", "you find unrecognized work"], ["", "verification contradicts"], ["", "continuing would"]]
    : [["一是", ""], ["二是", ""], ["三是", ""], ["四是", ""], ["五是", ""]]);
  const WY = 520, SY = 480, SR = 22, BUS = 360, GY = 632, PAIR = 48, ONE = 34, NY = 744, PX = 960, OY = 280, AX = 230, LANE = 852;
  // What each condition is, beneath its station, each part drawn on its own words.
  const said = (g, zh, english, lead = .15) => ramp(t, cue(s, zh, english) - lead, .4) * g;
  const glyphs = [
    // Two instructions that cannot both hold.
    (x, y, g) => {
      const q = said(g, "指令有实质冲突", "instructions materially conflict");
      documentIcon(x - 70, y - 30, 44, 58, {alpha: q, rows: 3});
      documentIcon(x + 26, y - 30, 44, 58, {alpha: q, rows: 3});
      text("≠", x, y + 1, 30, {role: "mark", align: "center", color: P.unknown, alpha: said(g, "冲突", "conflict")});
    },
    // The target, the fact source and the responsible person, each on its own words, and each marked unknown as it
    // is said not to be identifiable: in English, which names them first, the marks on the words that say so, and in
    // Chinese, which says so first, each mark with its own name, the target on the words that say it cannot be
    // determined.
    (x, y, g) => {
      const [aim, basis, who] = en ? [said(g, "", "the target"), said(g, "", "fact source"), said(g, "", "responsible person")]
        : [said(g, "确定不了要处理的对象", ""), said(g, "事实依据", ""), said(g, "负责人", "")];
      const unknown = en ? ramp(t, cue(s, "", "can't be identified") - .15, .4) : 1;
      ring(x - 56, y + 8, 20, {color: P.ink, alpha: aim, width: 2.5});
      dot(x - 56, y + 8, 5, {color: P.ink, alpha: aim});
      box(x - 17, y - 14, 34, 44, {fill: P.row, stroke: P.ink, alpha: basis, radius: 4, width: 2});
      // The source's two lines of text are short details of its mark, not ruled rows of a list.
      [y - 2, y + 10].forEach((ry, i) => line(x - 7, ry, x + (i ? 3 : 7), ry, {color: P.muted, alpha: basis, width: 2}));
      person(x + 56, y + 16, {size: .8, alpha: who});
      [[x - 56, aim], [x, basis], [x + 56, who]].forEach(([qx, q]) => text("?", qx, y - 38, 26, {role: "mark", align: "center", color: P.unknown, alpha: q * unknown}));
    },
    // Authority that does not reach.
    (x, y, g) => lock(x, y + 6, {alpha: said(g, "权限不够", "authority is insufficient"), size: 1.1}),
    // An action that would cross a permission, compliance, security or data boundary: the action's way reaches the
    // boundary, which stands in the colour 04 gives the boundaries, and the stretch beyond it, where the action would
    // go, draws on dashed in the unknown colour, after it, as the boundary is named.
    (x, y, g) => {
      const at = cue(s, "越过权限", "cross a permission"), q = said(g, "越过权限", "cross a permission");
      line(x, y - 24, x, y + 24, {color: P.authority, alpha: q, width: 4});
      link(x - 46, y, x - 12, y, {color: P.ink, alpha: q, width: 3, draw: {t, at: at + .05}, end: false});
      link(x + 12, y, x + 44, y, {color: P.unknown, alpha: q, width: 2.5, dash: [5, 5], draw: {t, at: at + .3}});
    },
    // A step that cannot be taken back: the authorization it lacks is an empty seal, and the recovery it lacks is the
    // recovery path's turn, drawn dashed and crossed.
    (x, y, g) => {
      const q = said(g, "不可逆的操作", "irreversible step");
      path([[x - 78, y - 22], [x - 40, y - 22], [x - 40, y + 22], [x - 6, y + 22]], {color: P.ink, alpha: q, width: 3});
      dot(x - 6, y + 22, 5, {color: P.ink, alpha: q});
      seal(x + 40, y - 20, 16, {alpha: said(g, "缺授权", "lacks authorization"), hollow: true});
      const back = said(g, "恢复办法", "recovery");
      path([[x + 64, y + 10], [x + 18, y + 10], [x + 18, y + 38], [x + 58, y + 38]], {color: P.muted, alpha: back, width: 2, dash: [5, 5]});
      dot(x + 60, y + 38, 4, {color: P.muted, alpha: back});
      cross(x + 40, y + 24, 14, {alpha: back, width: 3});
    },
    // Work of unknown origin, someone else's uncommitted work, and work whose owner is unknown, each on its words, laid
    // over the one before as a fanned stack of three different sheets, so the three read as one mark that the kind's
    // name names.
    (x, y, g) => {
      const q = said(g, "来历不明", "you find unrecognized work"), other = said(g, "别人还没提交", "someone else"), owner = said(g, "归属不明", "owner is unknown");
      documentIcon(x - 54, y - 26, 38, 50, {alpha: q, rows: 0});
      text("?", x - 39, y + 2, 26, {role: "mark", align: "center", color: P.unknown, alpha: q});
      box(x - 22, y - 20, 46, 40, {fill: P.row, stroke: P.ink, alpha: other, radius: 4, width: 2});
      [y - 6, y + 6].forEach((ry, i) => line(x - 13, ry, x + (i ? 5 : 15), ry, {color: P.muted, alpha: other, width: 2}));
      documentIcon(x + 18, y - 21, 32, 42, {alpha: owner, rows: 0});
      person(x + 34, y + 5, {size: .5, alpha: owner, solid: false, color: P.unknown});
    },
    // A check expected to pass fails, and evidence whose time has run out.
    (x, y, g) => {
      const v = said(g, "核验和预期相反", "contradicts expectation"), flip = ramp(t, cue(s, "相反", "contradicts") - .15, .4);
      box(x - 58, y - 22, 44, 44, {fill: P.row, stroke: P.ink, alpha: v, radius: 6, width: 2});
      check(x - 36, y + 1, 26, {color: P.evidence, alpha: v * (1 - flip)});
      cross(x - 36, y, 20, {alpha: v * flip});
      const old = said(g, "证据过期", "evidence has expired");
      documentIcon(x + 8, y - 30, 44, 58, {alpha: old, rows: 3});
      dot(x + 52, y + 20, 18, {color: P.ground, alpha: old});
      clock(x + 52, y + 20, 15, {color: P.unknown, alpha: old, hand: .62});
    },
    // What continuing would do: hide a failure, corrupt the source of truth, present a guess as fact, widen the damage.
    (x, y, g) => {
      const hideAt = cue(s, "掩盖失败", "hide a failure"), cover = soon(t, hideAt + .2, .5), hide = said(g, "掩盖失败", "hide a failure");
      cross(x - 30, y - 24, 30, {alpha: hide, width: 3});
      box(mix(x - 71, x - 41, cover), y - 35, 22, 22, {fill: P.row, stroke: P.ink, alpha: hide * cover, radius: 4, width: 2});
      const pollute = cue(s, "污染权威来源", "corrupt a source");
      documentIcon(x + 14, y - 46, 34, 44, {alpha: said(g, "污染权威来源", "corrupt a source"), rows: 2});
      [[x + 24, y - 16], [x + 38, y - 28], [x + 36, y - 10]].forEach(([px, py], i) => dot(px, py, 4, {color: P.unknown, alpha: ramp(t, pollute + .1 + i * .12, .2) * g}));
      const guessAt = cue(s, "把猜测说成事实", "present a guess");
      text("?", x - 42, y + 28, 26, {role: "mark", align: "center", color: P.muted, alpha: ramp(t, guessAt - .15, .4) * g});
      check(x - 18, y + 28, 22, {color: P.unknown, alpha: ramp(t, guessAt + .3, .3) * g});
      // The harm widens in voice time, so a widening still under way when the thought ends rests in the quiet.
      const worseAt = cue(s, "扩大损害", "worsen the harm"), grow = standard((voiceTime(t) - voiceTime(worseAt + .05)) / .8), worse = ramp(t, worseAt - .15, .4) * g;
      dot(x + 32, y + 28, 5, {color: P.unknown, alpha: worse});
      [13, 22].forEach((r, i) => ring(x + 32, y + 28, mix(5, r, grow), {color: P.unknown, alpha: worse * restMark(P.unknown, 1 - i * .35), width: 2}));
    }];
  // The conditions each kind holds, stacked in its column beneath its station.
  const kinds = [[0, 1], [2, 3, 4], [5], [6], [7]];
  const g1 = base * stageOut(t, handoff);
  if (g1 > 0) {
    line(150, WY, 1770, WY, {color: P.line, alpha: g1, width: 3.5});
    // The member stands on the way beside the Agent, the two named once under both; the member is drawn smaller than the
    // person the escalation reaches, so the two are not read as members of one list.
    person(AX - 30, WY - 19, {alpha: g1, color: P.authority, size: .85});
    agent(AX + 32, WY, {alpha: g1, size: 1.2});
    nameText(L("成员和智能体", "Members and Agents"), AX, WY + 22 * 1.2 + NAME_GAP, {valign: "top", width: 260, alpha: g1});
    // The person the escalation reaches, named by it.
    const owner = named(t, escalate) * g1;
    person(PX, OY, {alpha: owner, color: P.authority, size: 1.1});
    nameText(L("上报", "Escalate"), PX + 15 * 1.1 + NAME_GAP, OY - 15 * 1.1 * 1.15, {align: "left", color: P.authority, alpha: owner});
    // The stations stand at one pitch from the first to the last: the Chinese as railStations pitches them when every
    // pair of names fits, the names measured as railNames wraps them within that pitch; the English, whose names stand
    // on two baselines, from a first station far enough right that its name stands a word space and more clear of the
    // group's name, to a last whose name ends with the way.
    const xs = en ? names.map((_, i) => 540 + i * 270) : railStations(names, 500, 1660, {wrap: 260});
    // The first sign stands on the words that stop the Agent and its escalation rises on "escalate"; every later sign
    // stands with its kind's name, and its escalation rises as it stands.
    const signAt = i => (i ? nameAts[i] : stopAt) - .15, rise = i => i ? nameAts[i] + .05 : escalate;
    const current = i => ramp(t, signAt(i) + .2, .3) * (i + 1 < xs.length ? 1 - ramp(t, signAt(i + 1) + .2, .3) : 1);
    // The person lights as each escalation arrives.
    const arrived = Math.max(...xs.map((_, i) => ramp(t, rise(i) + .7, .3) * (1 - ramp(t, rise(i) + 1.1, .45))));
    if (arrived > 0) ring(PX, OY - 19, 30, {color: P.authority, alpha: arrived * restMark(P.authority, .6) * g1, width: 2});
    nameText(L("停下", "Stop"), xs[0] - SR - NAME_GAP, SY, {align: "right", alpha: named(t, stopAt - .1) * g1});
    // The group's name stands muted in the Agent's column on the names' baseline, its lines centred on the Agent's axis
    // as the row's other names centre on their stations, so it stands clear of the first kind's name and never reads
    // as that kind's label.
    nameText(L("五类情况", "Five kinds of situation"), AX, NY, {valign: "top", width: 220, color: P.muted,
      alpha: named(t, cue(s, "五类情况", "five kinds of situation")) * g1});
    xs.forEach((x, i) => {
      const sign = ramp(t, signAt(i), .3) * g1;
      line(x, SY + SR + 2, x, WY - 2, {color: P.line, alpha: sign, width: 2});
      stopSign(x, SY, SR, {alpha: sign});
      const lit = current(i);
      if (lit > 0) ring(x, SY, SR + 10, {color: P.unknown, alpha: lit * restMark(P.unknown, .5) * g1, width: 2});
      // The escalation of the current station keeps one point travelling up to the person once its way has drawn up to
      // them, and begins no pass once the next station stands; an escalation already delivered recedes as the next
      // station stands.
      const up = {t, at: rise(i) + .05}, escalating = since(t, rise(i) + .85);
      link(x, SY - SR - 4, PX, OY + 34, {route: "vhv", mid: BUS, color: P.authority, alpha: g1 * mix(restMark(P.authority), 1, lit), draw: up, width: 2.5,
        flowing: escalating, last: i + 1 < xs.length ? since(signAt(i + 1) + .35, rise(i) + .85) : Infinity});
      const held = kinds[i];
      // Two conditions stand one over the other; of three, the first two stand side by side over the third, the pair
      // centred on the column, the lock 30 px clear of the boundary's way.
      const spots = held.length > 2 ? [[-62, -PAIR], [34, -PAIR], [0, PAIR]] : held.length > 1 ? [[0, -PAIR], [0, PAIR]] : [[0, ONE]];
      held.forEach((k, n) => glyphs[k](x + spots[n][0], GY + spots[n][1], g1));
    });
    // The names hang on one baseline beneath the glyphs, and build as one list; in English every other name hangs a row
    // lower, on a short stem that rises from it toward its column.
    if (en) xs.forEach((x, i) => { if (i % 2) line(x, NY + 2, x, NY + RAIL_ROW - 6, {alpha: g1 * ramp(t, nameAts[i] - .15, .4), width: 2}); });
    railNames(names, xs, WY, {gap: i => NY - WY + (en && i % 2 ? RAIL_ROW : 0), wrap: 460, alpha: i => g1 * listIn(t, nameAts, i), set: "conditions"});
    // Independent authorized work keeps moving on its own lane, unaffected by the stops.
    const lane = ramp(t, independent + .05, .5) * g1;
    if (lane > 0) {
      line(150, LANE, 1770, LANE, {color: P.line, alpha: lane, width: 2});
      // One point of work travels the lane, so the lane and its name stand as one named mark.
      const q = loopPhase(since(t, independent + .05), 1596);
      if (q !== null) flowDot(mix(162, 1758, q), LANE, 10, q, {color: P.evidence, alpha: lane});
      nameText(L("已授权的工作", "Independent authorized work"), 960, LANE + NAME_GAP, {valign: "top", color: P.muted, alpha: lane});
    }
  }
  // The handoff's way, from stage 2 to the end of the scene: the Agent stands named at its head and the way runs on to
  // its quiet end at the right, one point travelling it while the work is handed on. Each stage hangs what it shows
  // beneath the way's middle, so the way and the Agent stand through the stage cuts.
  // The way stands high enough that the report and the frame hung beneath it stay balanced about the centre.
  const HY = 340, HX0 = 300, HX1 = 1620;
  const handway = (g, flowing, from) => {
    line(HX0 + 36, HY, HX1, HY, {color: P.line, alpha: g, width: 3.5});
    dot(HX1, HY, 6, {color: P.line, alpha: g});
    agent(HX0, HY, {alpha: g, size: 1.3});
    nameText(L("智能体", "Agent"), HX0, HY + 22 * 1.3 + NAME_GAP, {valign: "top", color: P.evidence, alpha: g});
    // The point of work enters at the way's head from the stage's cut, `from`, and travels at the film's flow pace.
    const q = flowing > 0 ? loopPhase(since(t, from), HX1 - 12 - HX0 - 44) : null;
    if (q !== null) flowDot(mix(HX0 + 44, HX1 - 12, q), HY, 7, q, {color: P.evidence, alpha: g * flowing});
  };
  // 2. Handoff and interruption, one thought and one picture: two records hang from the way. First the report, one
  // page headed by its name: each thing it states (in English, what it names) takes its row on its own words, an icon
  // of what it is with its short name, and the page lengthens to take each row as it comes. Then, on the words that
  // stop the work midway, the work pauses under a pause sign on the way, named there, and what it preserves is saved in
  // one frame hung beneath the sign: each of the four things takes its row on its words, an icon in its box with its
  // name, and the frame lengthens and widens to take each as it comes, so whoever resumes starts where the work
  // stopped. Neither record stands larger than what it holds; the two stand as one group about the frame's centre. The
  // two records hold to the scene's end.
  const g2 = base * stageIn(t, handoff);
  if (g2 > 0) {
    // The handoff moves along the way until the work pauses.
    handway(g2, 1 - ramp(t, interrupt, .4), handoff + STAGE_CUT);
    const items = en ? [["The work", "work"], ["Delivery state", "state"], ["Evidence", "evidence"], ["Limits", "limits"], ["Acceptance still needed", "acceptance"]]
      : [["做到了哪一步", "state"], ["做了什么", "work"], ["怎么核验的", "evidence"], ["还有哪些限度", "limits"], ["还要谁验收", "acceptance"]];
    const names3 = en ? ["The state", "Uncommitted work", "Attempts and failures", "Where to resume"] : ["现场", "没提交的改动", "试过和失败的办法", "从哪里接着做"];
    // The report and the frame hang side by side with their tops on one line and their feet on one line: the report's
    // page is as tall as the finished frame, whose rows keep one and a half of the report's row. The report's first row
    // stands one row below its heading's band and its last keeps the heading's padding above the page's foot, its rows
    // at one pitch between them, so each stands level with a frame row or clearly between two.
    const HEAD = 64, ROW = 68, IX = 50, NX = 92, PT = HY + 64, ROW3 = ROW * 1.5, FT = PT, NX3 = 130, PR = 26, FPAD = 24;
    const PH = 2 * FPAD - (ROW3 - 80) + ROW3 * names3.length, FIRST = HEAD + ROW, PITCH = (PH - HEAD / 2 - FIRST) / (items.length - 1);
    const PW = NX + Math.max(...items.map(([v]) => measure(v))) + 34, widths = names3.map(v => NX3 + measure(v) + 30), FWmax = Math.max(...widths);
    const px0 = 960 - (PW + 100 + FWmax) / 2 + 30, FX = px0 + PW + 100, SX = FX + FWmax / 2;
    // The report.
    link(px0 + PW / 2, HY + 6, px0 + PW / 2, PT - 4, {alpha: g2, draw: {t, at: handoff + STAGE_CUT}, end: false});
    // The page is its heading's band before the rows come, so its name stands centred in it, and it lengthens to take
    // each row as it comes, keeping the heading's padding below the last.
    const length = told.reduce((h, at, k) => h + (k ? PITCH : FIRST - HEAD / 2) * soon(t, pauseHold(at - .45, .4), .4), HEAD);
    documentIcon(px0, PT, PW, length, {alpha: g2, rows: 0});
    nameText(L("汇报完成", "A completion report"), px0 + 28, PT + HEAD / 2, {align: "left", alpha: g2 * named(t, handoff)});
    items.forEach(([v, kind], k) => {
      const y = PT + FIRST + k * PITCH, x = px0 + IX, q = ramp(t, told[k] - .15, .4) * g2, lit = speaking(t, told, k);
      if (lit > 0) ring(x, y, 25, {color: P.evidence, alpha: lit * restMark(P.evidence, .6) * g2, width: 2});
      if (kind === "work") documentIcon(x - 14, y - 19, 28, 38, {alpha: q, rows: 2});
      if (kind === "state") { stroke(() => ctx.arc(x, y + 8, 17, Math.PI, Math.PI * 2), {color: P.authority, alpha: q, width: 3}); line(x, y + 8, x + 10, y - 5, {color: P.ink, alpha: q, width: 3}); dot(x, y + 8, 3.5, {color: P.ink, alpha: q}); }
      if (kind === "evidence") check(x, y, 26, {alpha: q});
      if (kind === "limits") { line(x - 15, y, x + 5, y, {color: P.ink, alpha: q, width: 3}); line(x + 10, y - 14, x + 10, y + 14, {color: P.ink, alpha: q, width: 4}); }
      if (kind === "acceptance") seal(x, y, 15, {alpha: q, hollow: true});
      nameText(v, px0 + NX, y, {align: "left", alpha: g2 * listIn(t, told, k), set: "handoff"});
    });
    // The interruption.
    const pause = ramp(t, interrupt - .15, .4) * g2;
    if (pause > 0) {
      dot(SX, HY, PR, {color: P.ground, alpha: pause});
      ring(SX, HY, PR, {color: P.authority, alpha: pause, width: 3});
      box(SX - 12, HY - 12, 8, 24, {fill: P.authority, alpha: pause, radius: 3});
      box(SX + 4, HY - 12, 8, 24, {fill: P.authority, alpha: pause, radius: 3});
      nameText(L("中途停下", "On interruption"), SX + PR + NAME_GAP, HY - PR, {align: "left", valign: "bottom", color: P.authority, alpha: g2 * named(t, interrupt)});
    }
    const grown = kept.map(at => soon(t, pauseHold(at - .45, .4), .4));
    // The frame keeps one padding round its 80 px boxes, above and below alike, about the 22 px between them.
    const FW = grown.reduce((w, q, k) => mix(w, Math.max(w, widths[k]), q), widths[0]), FH = grown.reduce((h, q) => h + ROW3 * q, 2 * FPAD - (ROW3 - 80));
    if (grown[0] > 0) box(FX, FT, FW, FH, {stroke: P.authority, alpha: g2 * grown[0], radius: 14, width: 2});
    kept.forEach((at, k) => {
      const q = ramp(t, at - .15, .4) * g2, y = FT + FPAD + 40 + k * ROW3;
      box(FX + 28, y - 40, 80, 80, {fill: P.row, stroke: P.authority, alpha: q, radius: 8, width: 2});
      if (q > 0) dlKept[k](FX + 68, y, q);
      nameText(names3[k], FX + NX3, y, {align: "left", alpha: g2 * listIn(t, kept, k), set: "kept"});
    });
  }
};
/* Icons for what an interruption preserves: state, uncommitted work, attempts and failures, and where to resume (a
 * page marked at the row to pick up from). */
const dlKept = [
  (x, y, a) => { stroke(() => ctx.arc(x, y + 10, 24, Math.PI, Math.PI * 2), {color: P.authority, alpha: a, width: 3}); line(x, y + 10, x + 14, y - 8, {color: P.ink, alpha: a, width: 3}); dot(x, y + 10, 4, {color: P.ink, alpha: a}); },
  (x, y, a) => { box(x - 17, y - 24, 34, 48, {stroke: P.ink, alpha: a, radius: 4, width: 2, dash: [5, 4]}); line(x - 9, y - 6, x + 9, y - 6, {color: P.muted, alpha: a, width: 2}); line(x - 9, y + 6, x + 5, y + 6, {color: P.muted, alpha: a, width: 2}); },
  (x, y, a) => { cross(x - 14, y - 12, 14, {alpha: a, width: 3}); cross(x - 14, y + 12, 14, {alpha: a, width: 3}); check(x + 14, y, 22, {alpha: a}); },
  (x, y, a) => { box(x - 13, y - 24, 26, 48, {stroke: P.ink, alpha: a, radius: 3, width: 2}); line(x - 24, y + 4, x + 20, y + 4, {color: P.evidence, alpha: a, width: 3}); dot(x - 24, y + 4, 5, {color: P.evidence, alpha: a}); },
];

/* ---------------- 23 communicate: answer first, then explain ---------------- */
/* A page of scene 23 drawn in few strokes: its fill, its outline with the fold in one stroke, and its ruled rows in
 * one stroke, so a stage of pages and glyphs leaves the frame in one cut without a scatter of separate marks. */
function s23Page(x, y, w, h, {alpha = 1, stroke: s = P.ink, rows = 0} = {}) {
  if (alpha < .01) return;
  const c = Math.min(22, w * .2);
  fill(() => { ctx.moveTo(x, y); ctx.lineTo(x + w - c, y); ctx.lineTo(x + w, y + c); ctx.lineTo(x + w, y + h); ctx.lineTo(x, y + h); ctx.closePath(); }, {color: P.row, alpha});
  stroke(() => { ctx.moveTo(x + w - c, y + c); ctx.lineTo(x + w - c, y); ctx.lineTo(x, y); ctx.lineTo(x, y + h); ctx.lineTo(x + w, y + h); ctx.lineTo(x + w, y + c); ctx.lineTo(x + w - c, y + c); ctx.lineTo(x + w - c, y); }, {color: s, alpha, width: 2});
  if (rows) stroke(() => { for (let i = 0; i < rows; i++) { const ry = y + h * (.3 + i * .55 / Math.max(1, rows)); ctx.moveTo(x + w * .14, ry); ctx.lineTo(x + w * (i % 2 ? .62 : .82), ry); } }, {color: P.muted, alpha: alpha * .8, width: 2});
}
scenes["23"] = function (s, t) {
  const [work, comm, become, others, answers, notYet, process] = cues(s, [["工作的成果", "results"], ["沟通", "communication"],
    ["变成", "become"], ["别人", "others can act"], ["回答", "answer the reader"], ["别急着", "before"], ["从头讲过程", "recounting the whole process"]]);
  const [purpose, update] = cues(s, [["这次交流的目的", "name the purpose"], ["重要的汇报", "important update"]]);
  const base = ramp(t, opening(s), .7), RY = 470;
  // 1. Through communication, results become something others can act on: the result, the channel and the reader stand as
  // three stations on one rail, each arriving on its own words; the way between them draws on when the result becomes
  // action, and one point then travels it from the result to the reader. The reader stands as the result becomes action,
  // just before the words name them. Each edition opens on what it names first, which stands from the first words under
  // the rising chapter title, so the chapter opens on it at full contrast. The Chinese names the result alone first: it
  // stands centred until the channel is named, the two then stand centred as a pair, and on the words that make the
  // result action they move to their stations. The English names the channel first and the result just before it
  // becomes action, so there each stands at its station from its words, the channel alone at the centre.
  const one = base * stageOut(t, answers);
  if (one > 0) {
    const names = en ? ["Results", "Communication", "What others can act on"] : ["工作的成果", "沟通", "别人能接着做的事"];
    const centred = 960 - (460 - 60 + 960 + Math.max(42, measure(names[1]) / 2)) / 2, settle = 1 - glide(t, become + .05, Math.abs(centred));
    const pair = (en ? 0 : mix(960 - 460, centred, glide(t, comm + .05, centred - 500))) * settle;
    // The Chinese channel arrives at its place in the centred pair and stays there until the stations; only the result
    // moves. The first of each edition stands from the opening.
    const xs = [460 + pair, 960 + L(centred, 0) * settle, 1460], at = [work, comm, others], first = L(0, 1);
    const seen = i => (i === first ? 1 : ramp(t, (i === 2 ? Math.min(at[i], become + .05) : at[i]) - .15, .4)) * one;
    const clear = y => clearOfTitle(s, t, y);
    const go = {t, at: become - .05};
    link(xs[0] + 76, RY, xs[2] - 60, RY, {color: P.evidence, alpha: one * ramp(t, become - .05, .3) * clear(RY), draw: go, width: 2.5,
      flowing: since(t, become + .9)});
    // The result's page, a station of the rail.
    documentIcon(xs[0] - 60, RY - 75, 120, 150, {alpha: seen(0) * clear(RY - 75), rows: 4});
    // The channel sits on the way, its disc covering the way where they meet; both editions name it before the result
    // becomes action, so the way then draws on beneath it.
    dot(xs[1], RY, 40, {color: P.ground, alpha: seen(1) * clear(RY - 40)});
    dot(xs[1], RY, 40, {color: P.evidence, alpha: seen(1) * clear(RY - 40), hollow: true, width: 3});
    dot(xs[1], RY, 12, {color: P.evidence, alpha: seen(1) * clear(RY - 40)});
    person(xs[2], RY + 4, {alpha: seen(2) * clear(RY - 64), size: 2});
    // Each name stands whole on one line, so it keeps one layout while the stations glide apart.
    railNames(names.map(v => [v]), xs, RY + 75, {gap: NAME_GAP, wrap: 340, alpha: i => one * named(t, at[i]) * clear(RY + 97)});
  }
  // 2. So answer the reader's actual need before recounting the whole process: the answer is one card next
  // to the reader, a tick and its two lines, and it reaches the reader on its words; the whole process waits beneath it
  // as a long tape that unrolls on its words. The reader and the answer stand as one group about the centre, and on the
  // words that hold the process back they move left, so the group and the process's name beside its tape are centred.
  const two = base * stageIn(t, answers) * stageOut(t, purpose);
  if (two > 0) {
    // The reader's figure reaches 62.5 px left of its axis at this size; the card and the tape end at x 1300.
    const later = L("别急着从头讲过程", "The whole process"), left = 540 - 62.5;
    const sh = mix(960 - (left + 1300) / 2, 960 - (left + 1300 + NAME_GAP + measure(later)) / 2, glide(t, notYet + .05, (NAME_GAP + measure(later)) / 2));
    const px = 540 + sh, ax = 700 + sh, aw = 600, ah = 220, ty = RY + 250, tx0 = 620 + sh, tx1 = 1300 + sh, ans = ramp(t, answers - .1, .4) * two;
    person(px, RY + 4, {alpha: two, size: 2.6});
    box(ax, RY - ah / 2, aw, ah, {fill: P.row, stroke: P.evidence, alpha: ans, radius: 14, width: 2.5});
    check(ax + 74, RY, 60, {alpha: ans * ramp(t, answers + .2, .4)});
    stroke(() => [[RY - 56, aw - 210], [RY, aw - 250], [RY + 56, aw - 300]].forEach(([y, w]) => { ctx.moveTo(ax + 150, y); ctx.lineTo(ax + 150 + w, y); }),
      {color: P.ink, alpha: ans * .85, width: 5});
    // The answer reaches the reader, and goes on reaching them while the stage stands.
    const reach = soon(t, answers + .1, .5);
    link(ax - 14, RY, px + 72, RY, {color: P.evidence, alpha: ans, upto: reach, width: 2.5, flowing: since(t, answers + .6)});
    nameText(L("回答对方真正需要的", "Answer the reader's actual need"), ax + aw / 2, RY + ah / 2 + NAME_GAP, {valign: "top", width: 440, color: P.evidence,
      alpha: two * named(t, answers)});
    // The process unrolls as a tape on its words and waits there; the unrolling advances in voice time, so a tape still
    // unrolling when the thought ends rests in the quiet and finishes on the next words.
    const tape = drawShare(t, process - .1, tx1 - tx0, 1.2), ta = ramp(t, process - .15, .4) * two, x1 = mix(tx0, tx1, tape);
    if (tape > 0) {
      box(tx0, ty - 30, x1 - tx0, 60, {fill: P.row, stroke: P.muted, alpha: ta, radius: 8});
      // The tape's steps, one ruled strip, ink in once the tape has unrolled, so the strip never lengthens in steps and
      // no step appears at once.
      stroke(() => { for (let x = tx0 + 24; x < tx1 - 12; x += 28) { ctx.moveTo(x, ty - 12); ctx.lineTo(x, ty + 12); } },
        {color: P.muted, alpha: ta * .7 * ramp(t, process - .1 + drawTime(tx1 - tx0, 1.2), .45), width: 2});
    }
    nameText(later, tx1 + NAME_GAP, ty, {align: "left", color: P.muted, alpha: two * named(t, notYet)});
  }
  // 3. Name the purpose first: a selector stands on one arc from the purpose's words; each kind of exchange takes its
  // setting on the arc as it is named and the needle turns to it, so the settings build into the whole set. The arc is
  // the selector's whole range, so it stands firm from the start. The selector is centred on its finished extent, from
  // its first setting's name to its last's, whose English names run longer on the left.
  const purposes = cues(s, [["同步", "synchronize"], ["讨论", "discuss"], ["决定", "decide"], ["上报", "escalate"], ["复盘", "review"]]);
  const three = base * stageIn(t, purpose) * stageOut(t, update);
  if (three > 0) {
    const r = 320, angles = [-162, -126, -90, -54, -18].map(a => a * Math.PI / 180);
    const names = en ? ["Synchronize", "Discuss", "Decide", "Escalate", "Review"] : ["同步", "讨论", "决定", "上报", "复盘"];
    // Each name's extent as radialName sets it about a hub at x 960.
    const spans = angles.map((g, i) => { const c = Math.cos(g), x = 960 + c * (r + 12 + NAME_GAP), w = measure(names[i]); return c > .3 ? [x, x + w] : c < -.3 ? [x - w, x] : [x - w / 2, x + w / 2]; });
    // While the settings on its left stand without those on its right, the selector stands right of its place by as much
    // as balances them, 44 px in Chinese and 64 in English, easing there on the first setting and back on the fourth.
    const lean = L(44, 64) * (glide(t, purposes[0] - .1, L(44, 64)) - glide(t, purposes[3] - .1, L(44, 64)));
    const cx = lean + 1920 - (Math.min(960 - r, ...spans.map(v => v[0])) + Math.max(960 + r, ...spans.map(v => v[1]))) / 2, cy = 640;
    ring(cx, cy, r, {color: P.line, alpha: three, width: 3.5, start: -Math.PI, upto: .5});
    let a = -Math.PI;
    purposes.forEach((at, i) => { a = mix(a, angles[i], soon(t, at - .12, .45)); });
    angles.forEach((g, i) => {
      const x = cx + Math.cos(g) * r, y = cy + Math.sin(g) * r, lit = speaking(t, purposes, i), on = ramp(t, purposes[i] - .1, .4) * three;
      // The setting covers the arc where it sits as it arrives.
      dot(x, y, 12, {color: P.ground, alpha: on});
      dot(x, y, 12, {color: P.authority, alpha: on});
      if (lit > 0) ring(x, y, 21, {color: P.authority, alpha: lit * restMark(P.authority, .5) * three, width: 2});
      radialName(names[i], cx, cy, r + 12, g, {alpha: three * listIn(t, purposes, i), set: "purposes"});
    });
    // The needle turns from the hub toward the setting being named and stays on the last.
    line(cx, cy, cx + Math.cos(a) * (r - 44), cy + Math.sin(a) * (r - 44), {color: P.authority, alpha: three, width: 4});
    dot(cx, cy, 14, {color: P.authority, alpha: three});
    nameText(en ? "The purpose" : "这次交流的目的", cx, cy + 14 + NAME_GAP, {valign: "top", color: P.authority, alpha: three * named(t, purpose)});
  }
  // 4. An important update (in Chinese, an important report) is one page given to its reader and read from the top, and
  // each of its four sections shows what it holds: the conclusion or present state with what changed since last time;
  // the decisive facts, the impact and the risks; the recommendation and the decision needed, from whom and by when; and
  // the next action with who does it, when it is done and what shows it is done. The reader stands at the page's head,
  // so what reaches them first is the lead. Each part of a section draws on its own words, the number of the section
  // being said lit, and the section's name, its spoken key phrase with the words that qualify it, stands beside the
  // page, centred on its section; the first section's lead and present state stand on the lines of its name and its
  // qualifier, and its rows and every later section's keep one pitch, so the names stand at that pitch too. The page
  // opens with its first section and lengthens to take each next one as it comes, stepping up a little each time so the
  // page stays about the centre.
  const dontKnow = cue(s, "不知道", "when you don't know");
  const four = base * stageIn(t, update) * stageOut(t, dontKnow);
  if (four > 0) {
    const sections = [
      // Each section is named by its spoken heading. The first takes the words that follow it as its qualifier; the
      // others name their parts only in their own captions, so a qualifier there would repeat the caption standing with
      // it, and they keep the heading alone.
      [en ? ["Conclusion or present state"] : ["结论或现状"], [["结论", "conclusion"]], en ? ["and what actually changed"] : ["说清这次和上次比，实际变了什么"],
        [["说清这次和上次比", "what actually changed"]]],
      [en ? ["Decisive facts"] : ["关键的依据"], [["关键的依据", "decisive facts"]], [], []],
      [en ? ["Recommendation"] : ["建议"], [["建议", "your recommendation"]], [], []],
      [en ? ["Next action"] : ["下一步"], [["下一步", "the next action"]], [], []],
    ].map(([term, termCues, qual, qualCues]) => [term, cues(s, termCues), qual, cues(s, qualCues)]);
    const starts = sections.map(([, termAts]) => termAts[0]);
    const part = (zh, english) => ramp(t, cue(s, zh, english) - .15, .4) * four;
    const NW = Math.max(...sections.map(([term, , qual]) => Math.max(measure(term.join("")), qual.length ? measure(qual.join(""), NOTE) : 0)));
    // The first section holds two lines, the lead and the present state, about the middle a one-line section has; its
    // second line stands `drop` below that middle, and the section is taller by that drop, so the line stands one
    // section's pitch above the next section's line. The page starts higher by half the drop, so its middle stays where
    // sections of one height put it.
    const hh0 = termRowLayout(sections[0][0], sections[0][2], NW + 10).height, drop = hh0 / 2 - labelSize(NOTE) / 2;
    // While the first section's names are still to come, the page and the reader stand right of their places, so what
    // stands is centred: by half the names' column and its gap until the term comes, then by half of what the qualifier
    // will add to the term, and at their places once the qualifier comes.
    const [[termAt], [qualAt]] = [sections[0][1], sections[0][3]];
    const aside0 = (50 + NW) / 2, aside1 = (NW - measure(sections[0][0].join(""))) / 2;
    const aside = mix(mix(aside0, aside1, glide(t, termAt + .05, aside0 - aside1)), 0, glide(t, qualAt + .05, aside1));
    const PW = 500, PAD = 14, GAP = 10, heights = [104 + drop, 104, 104, 104], STEP = 30, left = 960 - (230 + PW + 50 + NW) / 2 + aside;
    // The sections' marks start 84 px into the page, their left edge 79 px in, so the page keeps one inset at either
    // side of what it holds: the lead ends on the change's triangle beneath it, 79 px short of the page's right edge.
    const rx = left + 70, x0 = left + 230, NX = x0 + PW + 50, g = x0 + 84;
    const grown = starts.map(at => soon(t, pauseHold(at - .45, .4), .4));
    const T = 400 - drop / 2 - STEP * grown.slice(1).reduce((a, b) => a + b, 0);
    const tops = heights.reduce((acc, h, k) => [...acc, k ? acc[k - 1] + heights[k - 1] + GAP : T + PAD], []);
    // The page keeps below its last section's marks the padding its lead has above it, about 44 px.
    const H = PAD + 14 + heights.reduce((sum, h, k) => sum + (h + (k ? GAP : 0)) * grown[k], 0);
    s23Page(x0, T, PW, H, {alpha: four});
    nameText(en ? "An important update" : "重要的汇报", x0, T - NAME_GAP, {align: "left", valign: "bottom", alpha: four * named(t, update)});
    // The reader at the page's head: the lead reaches them first. The lead stands on the line of the first section's
    // name and the present state on the line of its qualifier.
    const mid0 = tops[0] + heights[1] / 2, lead = mid0 - hh0 / 2 + labelSize(LABEL) / 2, stateY = mid0 + drop;
    person(rx, lead + 52, {alpha: four, size: 2.6});
    const given = soon(t, update + STAGE_CUT, .5);
    link(x0 - 12, lead, rx + 64, lead, {color: P.evidence, alpha: four, upto: given, width: 2.5, flowing: since(t, update + STAGE_CUT + .5)});
    sections.forEach(([term, termAts, qual, qualAts], i) => {
      const top = tops[i], h = heights[i], cy = i ? top + h / 2 : mid0, on = ramp(t, starts[i] - .15, .4) * four, lit = speaking(t, starts, i);
      const color = i ? P.ink : P.evidence;
      // The section being said is marked at the page's edge.
      if (lit > 0) line(x0 + 30, top + 12, x0 + 30, top + h - 12, {color, alpha: lit * four, width: 4});
      if (i === 0) {
        // The lead statement across the page; the present state beneath it, with last time's beside it and the change.
        // The lead runs across the page; its round end meets the right corner of the change's triangle beneath it, so the
        // section's lines end on one edge.
        line(g, lead, g + 336 + 1.25 - 4.5, lead, {color: P.evidence, alpha: on, width: 9});
        // The present state and what changed form one glyph from 12 px above its first line to 24 px below it, so its
        // first line stands 6 px above the qualifier's line and the glyph is centred on it.
        const state = part("现状", "present state"), sy = stateY - 6;
        dot(g + 14, sy, 9, {color: P.authority, alpha: state});
        line(g + 40, sy, g + 256, sy, {color: P.ink, alpha: state, width: 5});
        const changed = part("这次和上次比", "what actually changed");
        line(g + 40, sy + 24, g + 176, sy + 24, {color: P.muted, alpha: changed, width: 5});
        stroke(() => { ctx.moveTo(g + 316, sy - 12); ctx.lineTo(g + 336, sy + 24); ctx.lineTo(g + 296, sy + 24); ctx.closePath(); }, {color: P.evidence, alpha: changed, width: 2.5});
      }
      if (i === 1) {
        s23Page(g - 4, cy - 30, 46, 60, {alpha: on, rows: 3});
        const spread = part("影响", "impact");
        dot(g + 110, cy, 7, {color: P.unknown, alpha: spread});
        ring(g + 110, cy, mix(7, 24, soon(t, cue(s, "影响", "impact") + .05, .6)), {color: P.unknown, alpha: spread, width: 2});
        const risk = part("风险", "risks");
        stroke(() => { ctx.moveTo(g + 200, cy - 22); ctx.lineTo(g + 224, cy + 20); ctx.lineTo(g + 176, cy + 20); ctx.closePath(); }, {color: P.unknown, alpha: risk, width: 2.5});
        // The blockers: the film's blocked mark, a bar across the way, at the marks' pitch after the risks.
        line(g + 290, cy - 24, g + 290, cy + 24, {color: P.unknown, alpha: part("障碍", "blockers"), width: 4});
      }
      if (i === 2) {
        // The options and the one recommended, the person who must decide and the time they decide by.
        box(g - 2, cy - 18, 38, 36, {stroke: P.ink, alpha: on, radius: 7, width: 2});
        box(g + 46, cy - 24, 52, 48, {stroke: P.evidence, alpha: on, radius: 8, width: 2.5});
        check(g + 72, cy, 26, {alpha: on});
        person(g + 156, cy + 4, {color: P.authority, alpha: part("需要谁", "from whom"), size: .8});
        const when = part("在什么时候", "by when");
        ring(g + 232, cy, 20, {color: P.authority, alpha: when, width: 2.5});
        stroke(() => { ctx.moveTo(g + 232, cy - 11); ctx.lineTo(g + 232, cy); ctx.lineTo(g + 242, cy + 7); }, {color: P.authority, alpha: when, width: 3});
      }
      if (i === 3) {
        // The next action as one step on, its owner, its due time and the condition that shows it is done.
        dot(g + 4, cy, 7, {color: P.ink, alpha: on});
        link(g + 14, cy, g + 52, cy, {color: P.ink, alpha: on, width: 3, end: false});
        ring(g + 62, cy, 9, {color: P.ink, alpha: on, width: 3});
        person(g + 116, cy + 4, {alpha: part("谁来做", "its owner"), size: .7});
        const due = part("什么时候做完", "due time");
        stroke(() => { ctx.roundRect(g + 152, cy - 20, 40, 40, 6); ctx.moveTo(g + 152, cy - 8); ctx.lineTo(g + 192, cy - 8); }, {color: P.ink, alpha: due, width: 2});
        dot(g + 172, cy + 7, 5, {color: P.authority, alpha: due});
        const done = part("怎样算完", "what will show it is done");
        box(g + 216, cy - 18, 36, 36, {stroke: P.ink, alpha: done, radius: 6, width: 2});
        check(g + 234, cy, 22, {alpha: done});
      }
      const hh = termRowLayout(term, qual, NW + 10).height;
      termRow(t, term, termAts, qual, qualAts, NX, cy - hh / 2, {width: NW + 10, color, alpha: four * listLevel(t, starts, i), set: "update"});
    });
  }
  // 5. Not knowing is said plainly: one row, read left to right, across the middle of the band. It opens on the person
  // who does not know, the question over them; the plain statement follows on its words. The two stand far enough apart
  // and large enough that the row alone fills the stage. The row holds to the scene's end.
  const sayDont = cue(s, "直说不知道", "say so");
  const five = base * stageIn(t, dontKnow);
  if (five > 0) {
    const ya = CONTENT_CY + 5, on = at => ramp(t, at - .15, .4) * five;
    // Not knowing: the person with the open question over them, then the plain statement they make.
    const xa = [580, 1340];
    person(xa[0], ya + 6, {alpha: five, size: 1.8});
    ring(xa[0] + 54, ya - 82, 26, {color: P.unknown, alpha: five, width: 2.5, dash: [5, 5]});
    text("?", xa[0] + 54, ya - 81, 30, {role: "mark", align: "center", color: P.unknown, alpha: five});
    const said = {t, at: sayDont - .1};
    link(xa[0] + 70, ya, xa[1] - 86, ya, {color: P.ink, alpha: on(sayDont), draw: said, flowing: since(t, sayDont + .4)});
    box(xa[1] - 72, ya - 46, 144, 92, {fill: P.row, stroke: P.ink, alpha: on(sayDont), radius: 12, width: 2.5});
    text("?", xa[1], ya + 1, 30, {role: "mark", align: "center", color: P.unknown, alpha: on(sayDont)});
    railNames(en ? ["Don't know", "Say so"] : ["不知道", "直说不知道"], xa, ya + 70, {gap: NAME_GAP, alpha: i => five * (i ? named(t, sayDont) : 1),
      color: i => [P.muted, P.ink][i], set: "plainly"});
  }
};

/* ---------------- 24 communicate: statements that can be checked ---------------- */
scenes["24"] = function (s, t) {
  const [meet, decisions, transcripts] = cues(s, [["会议", "Meetings"], ["决定", "decisions"], ["流水账", "transcripts"]]);
  const align = cue(s, "开会先核对", "Align");
  const base = ramp(t, opening(s), .7);

  // 1. A meeting is a table with its people seated round it. Its one output is a decision, linked out from the table;
  // the way on to a transcript closes at a bar. The meeting, its decision and the refused transcript stand centred as
  // one group. The stage holds until the meeting's order is named.
  const one = base * stageOut(t, align);
  if (one > 0) {
    // The stage's extent: the table's seats reach 92 px left of its centre; the decision's and the transcript's names end
    // it at the right.
    const right = 800 + 340 + Math.max(160 + NAME_GAP + measure(L("决定", "Decisions")), 125 + NAME_GAP + measure(L("流水账", "Transcripts")) + 16 + 26);
    const sh = 960 - (800 - 92 + right) / 2;
    const mx = 800 + sh, my = 470, jx = mx + 240, cx = mx + 340;
    ring(mx, my, 56, {color: P.line, alpha: one, width: 2.5});
    for (let k = 0; k < 6; k++) { const a = Math.PI / 6 + k * Math.PI / 3; person(mx + Math.cos(a) * 78, my + Math.sin(a) * 78, {alpha: one, size: .62}); }
    nameText(L("会议", "Meetings"), mx, my + 96 + NAME_GAP, {valign: "top", alpha: one * named(t, meet)});
    // The decision: a card with a check, reached by the meeting's link.
    const dq = ramp(t, decisions - .15, .4) * one, reach = {t, at: decisions - .1};
    box(cx, 310, 160, 100, {fill: P.row, stroke: P.authority, alpha: dq, radius: 12, width: 2.5});
    check(cx + 80, 362, 40, {color: P.authority, alpha: dq});
    link(mx + 100, my, cx - 10, 360, {route: "hvh", mid: jx, alpha: one, draw: reach, flowing: since(t, decisions + .5)});
    nameText(L("决定", "Decisions"), cx + 160 + NAME_GAP, 360, {align: "left", color: P.authority, alpha: one * named(t, decisions)});
    // The transcript: its branch drops from the same junction and stops at a bar.
    const tq = ramp(t, transcripts - .15, .4) * one, drop = soon(t, transcripts - .05, .5);
    documentIcon(cx + 35, 522, 90, 116, {alpha: tq * .7, rows: 5, stroke: P.muted});
    link(jx, my, cx + 25, 580, {route: "vh", color: P.unknown, alpha: tq, upto: .26 * drop, end: false, dash: [8, 8]});
    line(jx - 22, 532, jx + 22, 532, {color: P.unknown, alpha: ramp(t, transcripts + .35, .3) * one, width: 4});
    rejectedName(L("流水账", "Transcripts"), cx + 125 + NAME_GAP, 580, {align: "left", alpha: one * named(t, transcripts), mark: ramp(t, transcripts + .35, .35)});
  }

  // 2. The meeting's way is a rail with two gates, each standing on the words that name it: alignment of facts and
  // definitions (in Chinese, checking the facts and unifying the definitions) opens the first, and only then does the
  // question pass on to the comparison of options. Where the way ends a disagreement stands split in two, and a probe
  // searches the five layers it may lie in, a column that builds as each layer is named. The rail stands about the
  // centre until the layers are named, and on the words that send the probe to them (in Chinese "找", in English
  // "disagreement") the stage moves left, so it stands centred with the layers' column, settling before the probe's
  // first branch reaches its layer, so no mark moves as that branch arrives.
  const [alignAt, defs, compare, options, split, locate] = cues(s, [["核对", "Align"], ["定义", "definitions"], ["再比方案", "comparing"],
    ["方案", "options"], ["分歧", "disagreement"], ["找", "locate"]]);
  const layers = cues(s, [["在事实", "in facts"], ["推论", "inference"], ["价值取向", "values"], ["资源", "resources"], ["权限", "authority"]]);
  const challenge = cue(s, "质疑说法", "Challenge");
  const two = base * stageIn(t, align) * stageOut(t, challenge);
  if (two > 0) {
    const layerNames = en ? ["Facts", "Inference", "Values", "Resources", "Authority"] : ["事实", "推论", "价值取向", "资源", "权限"];
    // Until the layers come the way, from x 520 to 1270, and its name hanging at its left stand centred; the finished
    // stage is centred on its extent, from that name to the layers' longest name.
    const left = 520 - NAME_GAP - measure(L("开会", "Meetings"));
    const sh0 = 960 - (left + 1270) / 2, sh1 = 960 - (left + 1480 + 12 + NAME_GAP + Math.max(...layerNames.map(v => measure(v)))) / 2;
    const sh = mix(sh0, sh1, glide(t, Math.max(locate, split) + .05, sh1 - sh0));
    // The way ends far enough from the probe's stem that the disagreement's name, set just above the split, keeps clear
    // of it, and its baseline stands well clear of the layers' names. The English gates stand 365 px apart, so the first
    // gate's name stands whole on one line, clear of the second's by the headless canvas's wider estimate too.
    const y = 500, x0 = 520 + sh, g1 = L(790, 755) + sh, g2 = L(1090, 1120) + sh, sx = 1270 + sh, CX = 1480 + sh, ys = [290, 395, 500, 605, 710];
    // The meeting's way, named at its start as the stage opens.
    line(x0, y, sx, y, {color: P.line, alpha: two, width: 2.5});
    nameText(L("开会", "Meetings"), x0 - NAME_GAP, y, {align: "right", alpha: two});
    // A gate is one mark: its two leaves open apart on their words.
    const gateAt = (x, at, open, color) => {
      const o = ease(open) * 48, q = two * ramp(t, at - .15, .4);
      stroke(() => { ctx.moveTo(x, y - 64 - o); ctx.lineTo(x, y - 6 - o); ctx.moveTo(x, y + 6 + o); ctx.lineTo(x, y + 64 + o); }, {color, alpha: q, width: 5});
    };
    gateAt(g1, alignAt, ramp(t, defs + .05, .45), P.evidence);
    gateAt(g2, compare, ramp(t, options + .05, .45), P.ink);
    railNames(en ? [["Align facts and definitions"], "Comparing options"] : ["核对事实、统一定义", "比方案"], [g1, g2], y,
      {gap: 130, wrap: 280, alpha: i => two * named(t, [alignAt, compare][i]), color: i => [P.evidence, P.ink][i]});
    // The question runs along the way as far as the gates let it, one point at a time at the film's flow pace, passing
    // each gate once it opens: a point leaves by its size where the way ends; where the way ends a disagreement stands
    // split in two. The way's reach extends past each opened gate as a glide in voice time, so a point that has left at
    // the closed gate comes back beyond it by its size rather than at once.
    const reach = mix(mix(g1 - 30, g2 - 30, glide(t, defs + .25, g2 - g1)), sx - 26, glide(t, options + .25, sx - g2 + 4));
    const full = sx - 26 - x0 - 10, way = reach - x0 - 10, run = loopPhase(since(t, align), full), sp = ramp(t, split + .05, .4);
    // The point fades out before the split, so it has left before the stage eases left and never reverses on screen.
    if (run !== null && run * full < way) dot(x0 + 10 + run * full, y, 9 * pass(run * full / way), {color: P.evidence, alpha: two * (1 - ramp(t, split - .25, .3))});
    if (sp > 0) [-1, 1].forEach(k => token(sx, y + k * 13, {color: P.unknown, alpha: two * sp, r: 11}));
    // The disagreement is named where the way ends as the words turn to it ("and locate any disagreement", in English).
    nameText(L("分歧", "Disagreement"), sx, y - 50, {valign: "bottom", alpha: two * named(t, en ? cue(s, "", "and locate") : split)});
    // Each of the five layers appears as it is named.
    ys.forEach((ly, i) => {
      const on = ramp(t, layers[i] - .15, .4) * two, lit = speaking(t, layers, i);
      dot(CX, ly, 7 + 2 * lit, {color: P.ink, alpha: on});
      if (lit > 0) ring(CX, ly, 20, {color: P.unknown, alpha: lit * restMark(P.unknown, .6) * two, width: 2});
      nameText(layerNames[i], CX + 12 + NAME_GAP, ly, {align: "left", alpha: two * listIn(t, layers, i), set: "layers"});
    });
    // The probe searches the layers from the split: a branch reaches each layer as it is named, the branch being said
    // lit and the ones already searched receding. A branch grows in voice time, so the last one, named as the thought
    // ends, rests in the quiet and finishes on the next words.
    layers.forEach((at, i) => {
      const from = i ? at + .05 : Math.max(locate, split, at - .15) + .05, grown = voiceTime(t) - voiceTime(from);
      link(sx + 22, y, CX - 26, ys[i], {route: "hvh", mid: CX - 50, color: P.unknown, alpha: two * ease(grown / .3) * mix(restMark(P.unknown), 1, speaking(t, layers, i)),
        draw: {t, at: from}});
    });
  }

  // 3. What is challenged are the parts of what is said: the challenge is a lens at the head of one rail, and a claim
  // (in English, a proposition), its evidence and its cost arrive on the rail as three cards, each on its own words,
  // each lit while it is named. The way on from the cost to the person stops at a bar, and personalities and motives
  // are refused beside the person. The lens and its rail, which runs to the last card's place, stand centred until that
  // card is named; on its words the stage moves left, so the lens, the rail and the cards stand centred, and on the
  // words that turn to the person it moves left again, so it stands centred with the bar, the person and the refused
  // reading. Where those words follow too closely for two glides, the stage moves left once, arriving as the words turn
  // to the person.
  const parts = cues(s, [["说法", "propositions"], ["证据", "evidence"], ["代价", "costs"]]);
  const [never, personal, motive] = cues(s, [["不质疑", "never"], ["人格", "personalities"], ["动机", "motives"]]);
  const updates = cue(s, "汇报、答复", "In updates");
  const three = base * stageIn(t, challenge) * stageOut(t, updates);
  if (three > 0) {
    // The lens reaches 48 px left of its axis, the rail ends 112 px before the last card's axis and the cards reach
    // 106 px either side of theirs; the refused reading stands centred with its cross under the person, whose figure
    // reaches 40 px either side.
    const refusedName = L("人格和动机", "Personalities or motives"), lensLeft = Math.min(380 - 48, 380 - measure(L("质疑", "Challenge")) / 2);
    const refusedW = L(300, 340), reach = 1560 + Math.max(40, (Math.max(...wrapName(refusedName, refusedW).map(v => measure(v))) + 16 + Math.min(26, labelSize(LABEL) * .9)) / 2);
    // The stage makes room for the refused reading as a glide that has arrived as its name comes in, so the name
    // stands inside the safe area from its first frame. When that glide would begin before the move that centres the
    // cards has ended, the two are one glide, from the lens and rail's place to the refusal's, so their paces never add.
    const sh0 = 960 - (lensLeft + 1140 - 112) / 2, sh1 = 960 - (lensLeft + 1140 + 106) / 2, sh2 = 960 - (lensLeft + reach) / 2;
    const cardsFrom = parts[2] + .05, refuseFrom = Math.min(never + .05, personal - .15 - glideTime(sh2 - sh1));
    const sh = voiceTime(refuseFrom) >= voiceTime(cardsFrom) + glideTime(sh1 - sh0)
      ? mix(mix(sh0, sh1, glide(t, cardsFrom, sh1 - sh0)), sh2, glide(t, refuseFrom, sh2 - sh1))
      : mix(sh0, sh2, glide(t, Math.min(cardsFrom, personal - .15 - glideTime(sh2 - sh0)), sh2 - sh0));
    const y = 470, lx = 380 + sh, xs = [640, 890, 1140].map(x => x + sh), barX = 1370 + sh, hx = 1560 + sh;
    // The lens stands near the meeting's first gate, so it fades in over the cut's first frames rather than in one and
    // is not read as the gate jumping to it.
    const lens = three * ramp(t, challenge + STAGE_CUT, .15);
    ring(lx, y, 46, {color: P.evidence, alpha: lens, width: 3});
    line(lx + 33, y + 33, lx + 56, y + 56, {color: P.evidence, alpha: lens, width: 4});
    nameText(L("质疑", "Challenge"), lx, y - 46 - NAME_GAP, {valign: "bottom", color: P.evidence, alpha: three * named(t, challenge)});
    link(lx + 52, y, xs[2] - 112, y, {color: P.evidence, alpha: three, draw: {t, at: challenge + STAGE_CUT}, end: false});
    const go = soon(t, never - .05, .6);
    link(xs[2] + 112, y, hx - 50, y, {color: P.unknown, alpha: three * ramp(t, never - .05, .3), upto: .5 * go, end: false, dash: [8, 8]});
    line(barX, y - 34, barX, y + 34, {color: P.unknown, alpha: ramp(t, never + .4, .3) * three, width: 4});
    // What is challenged and what never is are one contrast, so the bar's name stands on the lens's name's baseline.
    nameText(L("不质疑", "Never"), barX, y - 46 - NAME_GAP, {valign: "bottom", alpha: three * named(t, never)});
    xs.forEach((x, i) => {
      const lit = speaking(t, parts, i), q = ramp(t, parts[i] - .15, .4) * three;
      box(x - 105, y - 95, 210, 190, {fill: P.row, stroke: blend(P.line, P.evidence, lit), alpha: q, radius: 10, width: 2 + .5 * lit});
      if (i === 0) stroke(() => [0, 1, 2].forEach(k => { ctx.moveTo(x - 56, y - 28 + k * 28); ctx.lineTo(x + (k === 2 ? 18 : 56), y - 28 + k * 28); }), {color: P.ink, alpha: q, width: 3});
      if (i === 1) tableIcon(x - 60, y - 40, 120, 80, {alpha: q, stroke: P.ink, rows: 3, cols: 3});
      if (i === 2) [0, 1, 2].forEach(k => box(x - 38 + (k === 1 ? 8 : 0), y + 18 - k * 23, 76, 20, {fill: P.row, stroke: P.authority, alpha: q, radius: 10, width: 2.5}));
    });
    railNames(en ? ["Propositions", "Evidence", "Costs"] : ["说法", "证据", "代价"], xs, y + 95, {gap: NAME_GAP,
      alpha: i => three * listIn(t, parts, i), set: "challenged"});
    // The person appears when the words turn to the person.
    person(hx, y + 8, {alpha: three * ramp(t, never - .15, .4), size: 1.6});
    // The refused reading hangs on the line of the parts' names, so the two read as one row of what is and is not
    // challenged.
    rejectedName(refusedName, hx, y + 95 + NAME_GAP, {valign: "top", width: refusedW, alpha: three * named(t, personal),
      mark: ramp(t, motive + .05, .35)});
  }

  // 4. In updates, say what another person can check. What is said is a card between its speaker and another person,
  // who reads it through a lens; the title above names what the card should hold. First the principle: the card is
  // ticked on "check". Then each vague phrase opens its own card on its words and is struck there, and the statements
  // that replace it are added beneath it on their own words, each with the mark of what it states: a check that passed,
  // the acceptor still to confirm, with the day the conclusion is due, the Agent's facts, what you verified, how far the
  // conclusion reaches. The Chinese due day reads 周五前 beside its calendar leaf, the spoken words before the conclusion,
  // as a label may not repeat its caption's whole line 周五前给结论. The card
  // lengthens to take each statement as it comes, and the next phrase replaces the card in one cut.
  const four = base * stageIn(t, updates);
  if (four > 0) {
    const vague = cues(s, [["积极推进", "actively progressing"], ["智能体分析过了", "the Agent analyzed it"]]);
    // Each vague phrase is struck on the words that say what replaces it: 不如说 after the first and, in Chinese, 要说
    // after the second; English says "say" after both.
    const instead = vague.map((at, k) => cueFrom(s, k ? "要说" : "不如说", "say", at)), sayAt = cue(s, "说别人", "say things");
    const groups = en ? [
      [["Tests pass", "tests pass", "check"], ["The acceptor still needs to confirm", "the acceptor still needs", "owner"], ["We'll conclude by Friday", "we'll conclude", "due"]],
      [["Facts it produced", "which facts it produced", "agent"], ["What you verified", "what you verified", "check"], ["Where the conclusion stops", "where the conclusion stops", "limit"]]]
    : [
      [["测试通过了", "测试通过", "check"], ["还要等验收人确认", "还要等", "owner"], ["周五前", "周五前", "due"]],
      [["它给出了哪些事实", "它给出了", "agent"], ["你核实了什么", "你核实了", "check"], ["结论能说到哪", "结论能说到", "limit"]]];
    const refused = en ? ["“Actively progressing”", "“The Agent analyzed it”"] : ["“积极推进”", "“智能体分析过了”"];
    // The fixed frame of the exchange: the speaker on the left, the card about the centre, the reader and the lens on
    // the right, and the title over the card.
    const SX = 380, RX = 1500, LX = 1420, TOP = 432, ROW = 58, LY = TOP + 17 + ROW / 2;
    // Until the reader comes, the speaker, the card and the way toward the reader stand centred together, and they
    // glide to their places as the reader comes.
    const shift = 960 - (SX - 15 * 1.6 * 1.55 + LX - 52) / 2;
    ctx.save(); ctx.translate(shift * (1 - glide(t, sayAt - .15, shift)), 0);
    person(SX, LY + 40, {alpha: four, size: 1.6});
    person(RX, LY + 36, {alpha: four * ramp(t, sayAt - .15, .4), size: 1.4, color: P.evidence});
    ring(LX, LY, 46, {color: P.evidence, alpha: four * ramp(t, sayAt - .15, .4), width: 3});
    line(LX + 33, LY + 33, LX + 56, LY + 56, {color: P.evidence, alpha: four * ramp(t, sayAt - .15, .4), width: 4});
    nameText(L("别人能检查的话", "Things others can check"), 960, TOP - 30 - NAME_GAP, {valign: "bottom", alpha: four * named(t, sayAt)});
    // What is said travels from the speaker to the card and from the card to the reader's lens, one point on each way.
    const card = (x0, w, h, a) => {
      box(x0, TOP, w, h, {fill: P.row, stroke: P.ink, alpha: a, radius: 12, width: 2.5});
      const q = since(t, updates + STAGE_CUT);
      link(SX + 26, LY, x0 - 8, LY, {alpha: a, end: false, flowing: q});
      link(x0 + w + 8, LY, LX - 52, LY, {color: P.evidence, alpha: a, end: false, flowing: q, lag: .5});
    };
    const principle = four * stageOut(t, vague[0] - .2);
    if (principle > 0) {
      const checkAt = cueFrom(s, "检查", "check", updates), w = 300;
      card(960 - w / 2, w, 2 * ROW + 40, principle);
      stroke(() => [0, 1, 2].forEach(k => { ctx.moveTo(960 - w / 2 + 30, TOP + 36 + k * 30); ctx.lineTo(960 - w / 2 + 30 + [190, 150, 170][k], TOP + 36 + k * 30); }),
        {color: P.muted, alpha: principle, width: 4});
      check(960 + w / 2 - 44, TOP + 2 * ROW + 6, 30, {alpha: principle, draw: {t, at: checkAt + .05}});
      // The occasions the principle holds for name the card from the first words.
      nameText(L("汇报、答复、纪要和上报", "Updates, answers, meeting records and escalations"), 960, TOP + 2 * ROW + 40 + NAME_GAP,
        {valign: "top", width: 420, alpha: principle * named(t, updates)});
    }
    const mark = (kind, x, my, a) => {
      if (kind === "check") check(x, my + 2, 26, {alpha: a});
      if (kind === "owner") person(x, my + 3, {alpha: a, size: .55, color: P.authority});
      if (kind === "agent") agent(x, my, {alpha: a, size: .6});
      // A due day: a calendar leaf with its day marked.
      if (kind === "due") { box(x - 14, my - 13, 28, 27, {stroke: P.ink, alpha: a, radius: 4, width: 2}); line(x - 14, my - 5, x + 14, my - 5, {color: P.ink, alpha: a, width: 2}); dot(x, my + 5, 4, {color: P.authority, alpha: a}); }
      if (kind === "limit") { line(x - 13, my, x + 5, my, {color: P.ink, alpha: a, width: 3}); line(x + 9, my - 12, x + 9, my + 12, {color: P.ink, alpha: a, width: 4}); }
    };
    groups.forEach((g, k) => {
      const shown = four * stageIn(t, vague[k] - .2) * (k + 1 < groups.length ? stageOut(t, vague[k + 1] - .2) : 1);
      if (shown <= 0) return;
      // The refused phrase heads the statements that replace it, centred over them with its cross, and the statements
      // stand as one block centred under it, from the ring of the statement being said to their longest name's end; the
      // card is as wide as the wider of the two with one padding, 36 px, at either side. Before its cross the phrase
      // stands centred alone, and it steps left by half the cross's room as the cross arrives. The phrase is measured by
      // its ink, from its opening quote's to its closing quote's: each quote leaves blank beyond its ink, 0.625 em of a
      // Chinese quote's em and 0.072 em of an English quote. The cross stands 18 px after that ink, where a Chinese
      // phrase's advance ends, and its room is that gap, its 26 px and its stroke's round end. Where that centring would
      // leave the phrase's left edge within three quarters of an em of the statements' names, the eye reads the two as
      // almost aligned, so the phrase steps instead to stand flush with them, its em box on their left edge.
      const ats = g.map(([, said]) => cue(s, said, said)), em = labelSize(LABEL), blank = L(.625, .072) * em;
      const phrase = measure(refused[k]) - 2 * blank, room = 18 + Math.min(26, em * .9) + 1.5;
      // A statement's lit ring reaches 24 px left of its axis, and its name starts 52 px right of it.
      const rowsW = 24 + 30 + NAME_GAP + Math.max(...g.map(([v]) => measure(v))), w = 72 + Math.max(phrase + room, rowsW), x0 = 960 - w / 2;
      const MX = (w - rowsW) / 2 + 24, NX = MX + 30 + NAME_GAP, centred = x0 + (w - phrase - room) / 2;
      const inkEnd = Math.abs(centred - blank - (x0 + NX)) <= .75 * em ? x0 + NX + blank : centred;
      const ink = mix(x0 + (w - phrase) / 2, inkEnd, soon(t, instead[k] + .05, .35));
      const h = ats.reduce((sum, at) => sum + ROW * soon(t, pauseHold(at - .45, .4), .4), ROW + 34);
      card(x0, w, h, shown);
      rejectedName(refused[k], ink - blank, LY, {align: "left", alpha: shown * named(t, vague[k]), mark: ramp(t, instead[k] + .05, .35), markLeft: ink + phrase + 18});
      g.forEach(([v, , kind], j) => {
        const my = LY + (j + 1) * ROW, lit = speaking(t, ats, j);
        if (lit > 0) ring(x0 + MX, my, 22, {color: P.evidence, alpha: shown * lit, width: 2.5});
        mark(kind, x0 + MX, my, shown * ramp(t, ats[j] - .15, .4));
        nameText(v, x0 + NX, my, {align: "left", alpha: shown * listIn(t, ats, j), set: `statements${k}`});
      });
    });
    ctx.restore();
  }
};

/* ---------------- 25 communicate: fidelity, clarity, elegance ---------------- */
scenes["25"] = function (s, t) {
  const triad = cues(s, [["信达", "fidelity clarity"], ["达雅", "clarity and elegance"], ["雅次序", "elegance in that"]]);
  const [order, fidelity, clarity, elegance] = cues(s, [["次序不能颠倒", "in that order"], ["信是忠于原意", "fidelity preserves"],
    ["达是在准确理解之后", "clarity begins"], ["雅是凭品位", "elegance brings"]]);
  const [example, twoHours, write, roughly, fidelityIs, firstLead, decisionNeeded, detail, clarityIs] = cues(s, [["采集晚了两个小时", "collection ran two hours late"],
    ["晚了两个小时", "two hours late"], ["就写晚了两个小时", "writing two hours late"], ["基本按时", "roughly on time"], ["这是信", "fidelity means"],
    ["结论", "conclusion"], ["需要谁来决定", "the decision needed"], ["细节", "the detail"], ["这是达", "clarity means"]]);
  const [concrete, onePoint, terms, beforeSend, outsider] = cues(s, [["有具体的标准", "clarity has concrete checks"],
    ["一段只讲一个意思", "one point per paragraph"], ["重要的术语", "important terms"], ["发出之前", "before sending"], ["局外人", "a reader outside"]]);
  const restate = [cue(s, "结论", "conclusion", {last: true}), cue(s, "依据", "basis"), cue(s, "限度", "limits", {last: true}), cue(s, "下一步", "next action")];
  // Both editions name each part before what it holds, the Chinese by its number (一是风险, 二是影响, 三是控制影响,
  // 四是决定), so each part's cue is its name and the facts follow the impact.
  const [escalate, risk, facts, impact2, safe, contain, effect, options, costs, recommend, who] = cues(s, [["上报风险", "escalating a risk"],
    ["一是风险", "the risk"], ["有哪些事实", "the facts"], ["二是影响", "its impact"], ["最晚什么时候决定还来得及", "latest safe time to decide"],
    ["三是控制影响", "containment"], ["效果怎样", "its result"], ["四是决定", "the decision the options"], ["代价", "their costs"], ["你的建议", "your recommendation"],
    ["谁必须", "who must decide"]]);
  const base = ramp(t, opening(s), .7);
  const colors = [P.evidence, P.ink, P.authority], aims = en ? ["Fidelity", "Clarity", "Elegance"] : ["信", "达", "雅"];

  // 1. Writing aims for three things in an order: the three aims stand as three nodes in a row about the centre, each on
  // its own word, held by writing, which names them from above. When the order is spoken each node takes its number
  // and the way from the first to the last draws on through them, one point running it, so the order reads at once.
  const gA = base * stageOut(t, fidelity);
  if (gA > 0) {
    const xs = [520, 960, 1400], y = 500, R = 38, by = y - R - 46, writing = cue(s, "写作", "writing");
    // Writing holds its aims from the first word: its name, its stem and the bar its aims hang from.
    const held = gA * named(t, writing);
    nameText(L("写作", "Writing"), 960, by - 26 - NAME_GAP, {valign: "bottom", alpha: held});
    link(960, by - 26, 960, by, {alpha: held, end: false});
    path([[xs[0], by], [xs[2], by]], {color: P.line, alpha: held, width: 2.5});
    const run = glide(t, order, xs[2] - xs[0] - 2 * R - 12);
    link(xs[0] + R + 6, y, xs[2] - R - 6, y, {color: P.evidence, alpha: gA * ramp(t, order - .1, .3), draw: {t, at: order - .05}, width: 3,
      flow: run > 0 && run < 1 ? run * .999 : null});
    xs.forEach((x, c) => {
      const on = named(t, triad[c]) * gA;
      path([[x, by], [x, y - R - 4]], {color: P.line, alpha: on, width: 2.5});
      dot(x, y, R, {color: P.ground, alpha: on});
      ring(x, y, R, {color: colors[c], alpha: on, width: 3});
      // The node's point gives way to its number when the order is spoken, over 0.35 s, so it never leaves within a frame.
      dot(x, y, 8, {color: colors[c], alpha: on * (1 - ramp(t, order - .1, .35))});
      text(String(c + 1), x, y + 1, 26, {role: "mark", align: "center", color: colors[c], alpha: on * ramp(t, order + .1, .3)});
    });
    railNames(aims, xs, y + R, {gap: NAME_GAP, alpha: i => gA * listIn(t, triad, i), color: i => colors[i], set: "triad"});
  }

  // 2. Each aim is one mechanism under its head, the three heads standing from the first aim's words as the order left
  // them, and each mechanism building on its own words while its head is lit.
  // Fidelity: the original meaning and the writing stand as two pages; each of who, under what conditions, what
  // responsibility and to what extent carries across on its word as one level line, and the lines turn sound once
  // they stay intact; a fact on the writing keeps its link back to its source; counterexamples, uncertainty and
  // failure stay visible on the writing, each on its word.
  // Clarity: what is understood is ticked on its page; it is then put plainly, a tangled line that runs out straight,
  // and it reaches a reader, who then acts.
  // Elegance: rhythm, transitions and form are bars of a measured rhythm, the curve that joins them and the frame that
  // holds them; a precise verb and a concrete noun stand in the frame; slogans and pretended depth are refused beneath,
  // each on its own words.
  const g1 = base * stageIn(t, fidelity) * stageOut(t, example);
  if (g1 > 0) {
    // The elegance column comes last and carries the widest parts, so the stage stands right while the first two build
    // (80 px in Chinese, 30 in English) and moves on elegance's first word, which opens its thought: the Chinese glides
    // 120 px to stand 40 px left, and English, whose refusals beneath the frame are long, eases to 35 px left, so each
    // state stands centred.
    const OPEN = en ? mix(30, -35, soon(t, elegance + .05, .9)) : mix(80, -40, glide(t, elegance + .05, 120));
    const COLX = [390, 850, 1310].map(x => x + OPEN), HY = 330, starts = [fidelity, clarity, elegance];
    const heads = en ? [["preserves the meaning"], ["understanding first"], ["taste and judgment"]] : [["忠于原意"], ["在准确理解之后"], ["凭品位和审美"]];
    const means = cues(s, [["忠于原意", "preserves the meaning"], ["在准确理解之后", "begins with accurate understanding"], ["凭品位和审美", "brings taste"]]);
    // The three heads set their meanings one way: inline when every one fits on its head's line, otherwise each under its
    // head.
    const inline = heads.every((h, c) => termRowLayout([aims[c]], h, 330).one);
    const said = (zh, english, lead = .15) => ramp(t, cue(s, zh, english) - lead, .4) * g1;
    COLX.forEach((L0, c) => {
      const lit = span(t, starts[c] - .15, c < 2 ? starts[c + 1] - .2 : example - .2, .3), hx = L0 + 15;
      ring(hx, HY, 15, {color: colors[c], alpha: g1, width: 2.5});
      dot(hx, HY, 6 + 2 * lit, {color: colors[c], alpha: g1});
      if (lit > 0) ring(hx, HY, 23, {color: colors[c], alpha: lit * restMark(colors[c], .5) * g1, width: 2});
      const hh = termRowLayout([aims[c]], heads[c], 330, inline).height;
      termRow(t, [aims[c]], [Math.min(starts[c], fidelity)], heads[c], [means[c]], hx + 15 + NAME_GAP, HY - hh / 2,
        {width: 330, color: colors[c], alpha: g1 * listLevel(t, starts, c), set: "aims", inline});
    });
    // Fidelity.
    {
      const L0 = COLX[0], on = ramp(t, means[0] - .15, .4) * g1, items = cues(s, [["谁", "actors"], ["在什么条件下", "conditions"], ["负什么责", "responsibilities"], ["到什么程度", "limits"]]);
      const intact = said("都不走样", "stay intact"), ys = [450, 480, 510, 540];
      path([[L0 + 15, HY + 15], [L0 + 15, 410]], {color: P.line, alpha: on, width: 2});
      s23Page(L0 + 10, 410, 100, 200, {alpha: on, rows: 3});
      s23Page(L0 + 200, 400, 150, 270, {alpha: on, rows: 3});
      // The four lines are one stroke, and each draws on across the gap from the original on its own word at the tip
      // pace, so no line joins the figure whole within a frame.
      const carried = items.map(at => drawShare(t, at - .05, 78));
      if (carried[0] > .01) stroke(() => ys.forEach((y, k) => { if (carried[k] > .01) { ctx.moveTo(L0 + 116, y); ctx.lineTo(mix(L0 + 116, L0 + 194, carried[k]), y); } }),
        {color: blend(P.ink, P.evidence, intact / Math.max(g1, 1e-6)), alpha: on, width: 3});
      // The meaning travels across while the aim is spoken, along the second line once that line is drawn.
      const carry = loopPhase(since(t, items[1] - .05 + drawTime(78)), 78);
      if (carry !== null) flowDot(mix(L0 + 116, L0 + 194, carry), ys[1], 5, carry, {color: P.evidence, alpha: on * span(t, items[0], clarity - .2, .3)}, 78);
      // What the writing keeps is marked large enough to read at a glance, each mark on its word.
      check(L0 + 322, 430, 28, {alpha: intact});
      const src = said("事实有来源", "facts keep their sources");
      dot(L0 + 252, 590, 9, {color: P.evidence, alpha: src});
      link(L0 + 240, 590, L0 + 116, 590, {color: P.evidence, alpha: src, draw: {t, at: cue(s, "事实有来源", "facts keep their sources") + .05}, width: 3.5});
      text("≠", L0 + 232, 640, 36, {role: "mark", align: "center", color: P.unknown, alpha: said("反例", "counterexamples")});
      text("?", L0 + 274, 640, 36, {role: "mark", align: "center", color: P.unknown, alpha: said("不确定", "uncertainty")});
      const fail = said("失败", "failure");
      stroke(() => { ctx.moveTo(L0 + 303, 627); ctx.lineTo(L0 + 329, 653); ctx.moveTo(L0 + 329, 627); ctx.lineTo(L0 + 303, 653); }, {color: P.unknown, alpha: fail, width: 4});
    }
    // Clarity.
    {
      const L0 = COLX[1], on = ramp(t, clarity - .15, .4) * g1, y = 480;
      path([[L0 + 15, HY + 15], [L0 + 15, 420]], {color: P.line, alpha: on, width: 2});
      s23Page(L0 + 10, 420, 90, 120, {alpha: on, rows: 3});
      check(L0 + 80, 430, 24, {alpha: said("在准确理解之后", "accurate understanding")});
      const plain = cue(s, "把意思讲清楚", "puts it plainly"), drawn = soon(t, plain + .05, .7), flat = soon(t, cue(s, "讲通顺", "fluently") + .05, .7);
      if (drawn > 0) {
        const pts = Array.from({length: 13}, (_, k) => [L0 + 108 + k * 11, y + (k % 2 ? -1 : 1) * 14 * (1 - flat) * (k && k < 12 ? 1 : 0)]);
        path(pts, {color: P.evidence, alpha: on, draw: {t, at: plain + .05}, width: 3});
        // Once it runs plain, what is said travels it to the reader.
        const sent = loopPhase(since(t, plain + .8), 124);
        if (drawn >= 1 && sent !== null) flowDot(mix(L0 + 108, L0 + 232, sent), y, 5, sent, {color: P.evidence, alpha: on * span(t, plain + .8, elegance - .2, .3)}, 124);
      }
      const reader = said("让读者能理解", "the reader can understand");
      person(L0 + 270, y + 10, {alpha: reader, size: 1.3});
      const act = said("也能行动", "and act");
      dot(L0 + 304, y, 6, {color: P.ink, alpha: act});
      link(L0 + 312, y, L0 + 346, y, {color: P.ink, alpha: act, draw: {t, at: cue(s, "也能行动", "and act") + .05}, width: 3, end: false});
      ring(L0 + 356, y, 9, {color: P.ink, alpha: act, width: 3});
    }
    // Elegance.
    {
      const L0 = COLX[2], on = ramp(t, elegance - .15, .4) * g1, base0 = 590, hs = [60, 104, 72, 124, 84];
      const rhythm = said("节奏", "rhythm"), joined = said("过渡", "transitions"), form = said("形式", "and form");
      path([[L0 + 15, HY + 15], [L0 + 15, base0]], {color: P.line, alpha: on, width: 2});
      if (rhythm > 0) stroke(() => { ctx.moveTo(L0 + 15, base0); ctx.lineTo(L0 + 236, base0); hs.forEach((h, i) => { ctx.moveTo(L0 + 44 + i * 42, base0); ctx.lineTo(L0 + 44 + i * 42, base0 - h); }); },
        {color: P.authority, alpha: rhythm, width: 4});
      if (joined > 0) stroke(() => { ctx.moveTo(L0 + 44, base0 - hs[0]); hs.slice(1).forEach((h, i) => ctx.quadraticCurveTo(L0 + 44 + i * 42 + 21, base0 - Math.max(h, hs[i]) - 24, L0 + 44 + (i + 1) * 42, base0 - h)); },
        {color: P.authority, alpha: joined * .8, width: 2.5});
      box(L0 - 8, 420, 310, 190, {stroke: P.authority, alpha: form, radius: 12, width: 2});
      dot(L0 + 264, 520, 12, {color: P.ink, alpha: said("准确的动词", "precise verbs")});
      box(L0 + 247, 552, 34, 34, {fill: P.ink, alpha: said("具体的名词", "concrete nouns"), radius: 4});
      // The two refusals stand beneath the frame on one baseline, each named and struck on its own words, the pair with
      // its crosses centred on the frame.
      const refused = en ? ["Slogans", "Pretended depth"] : ["喊口号", "故作高深"], refusedAt = cues(s, [["喊口号", "slogans"], ["故作高深", "pretended depth"]]);
      const rw = refused.map(v => measure(v) + 42), rx0 = L0 - 8 + 310 / 2 - (rw[0] + 40 + rw[1]) / 2;
      refused.forEach((v, k) => rejectedName(v, rx0 + k * (rw[0] + 40), 610 + 22 + NAME_GAP, {align: "left", valign: "top", alpha: g1 * named(t, refusedAt[k]),
        mark: ramp(t, refusedAt[k] + .05, .35)}));
    }
  }
  // 3. The examples, side by side, each under its aim's head and illustrative. First fidelity, about the centre: the
  // collection's row on a timeline, its planned time, the collection standing two hours past it, the true statement
  // hanging from the actual time and the refused one from the plan; the frame is named fidelity on its words, and the
  // true statement is checked once both are said. Then clarity: the message in its order, the conclusion and the
  // decision needed leading the page and the detail following; the page lengthens to take each part, and the frame is
  // named clarity, in English with the first part, since English names clarity just before the message begins. In
  // Chinese, whose one sentence contrasts the two, the case glides left to the left half and clarity inks in in the right
  // half as the glide ends, on the words that begin the message, and both stand together until the concrete checks; in
  // English, which says each in its own sentence, clarity replaces the case in one cut on the words that begin the
  // message, about the centre.
  const gE = base * stageIn(t, example) * stageOut(t, concrete), clarityIn = firstLead - .15;
  illustrative(gE);
  const head = (x, y, name, color, at, a) => {
    const on = named(t, at) * a;
    ring(x + 15, y, 15, {color, alpha: on, width: 2.5});
    dot(x + 15, y, 6, {color, alpha: on});
    nameText(name, x + 30 + NAME_GAP, y, {align: "left", color, alpha: on});
  };
  const gF = L(gE, gE * stageOut(t, firstLead));
  if (gF > 0) {
    // The case's frame opens about the collection's row and grows to take the two hours and then the statements; in
    // Chinese it glides 390 px left to stand in the left half, clear of the clarity frame, and is all but there as that
    // frame inks in.
    ctx.save(); ctx.translate(L(-390 * glide(t, clarityIn - .85 * glideTime(390), 390), 0), 0);
    const fy = 300, lw = L(760, 880), lx = 960 - lw / 2, rowY = fy + 200;
    // The frame is lit structure, 2.5 px, so the case covers its share of the band from its first words; it takes the
    // statements' room as they begin, in English as fidelity is named, just before them.
    const up = drawShare(t, pauseHold(twoHours - .45, .4), 72, .4), down = drawShare(t, pauseHold(Math.min(write, fidelityIs) - .45, .4), 160, .4);
    box(lx, mix(rowY - 40, rowY - 112, up), lw, mix(rowY + 40, rowY + 200, down) - mix(rowY - 40, rowY - 112, up), {stroke: P.line, alpha: gF, radius: 10, width: 2.5});
    head(lx, rowY - 152, L("信", "Fidelity"), P.evidence, fidelityIs, gF);
    // The collection's row: the planned time stays open, dashed, and the collection slips two hours past it.
    // The true statement and its check stand inside the frame; the plan stands the same two hours before it.
    const ay = fy + 200, rowName = L("采集", "Collection"), truth = L("晚了两个小时", "Two hours late"), x0 = lx + 40 + measure(rowName) + NAME_GAP;
    const qx = lx + lw - 60 - measure(truth) / 2 - 56, px = Math.max(x0 + 60, qx - 370);
    nameText(rowName, lx + 40, ay, {align: "left", alpha: gF * named(t, example)});
    line(x0, ay, lx + lw - 40, ay, {color: P.line, alpha: gF, width: 2});
    ring(px, ay, 12, {color: P.line, alpha: gF, width: 2, dash: [4, 5]});
    // The collection stands at its actual time, two hours past the plan, as the span between them draws on.
    const slip = drawShare(t, twoHours - .1, qx - px), cx2 = mix(px, qx, slip), late = gF * ramp(t, twoHours - .15, .4);
    dot(qx, ay, 10, {color: P.evidence, alpha: late});
    const span2 = late * clamp((cx2 - px) / 80);
    stroke(() => { ctx.moveTo(px, ay - 52); ctx.lineTo(px, ay - 36); ctx.moveTo(px, ay - 44); ctx.lineTo(cx2, ay - 44); ctx.moveTo(cx2, ay - 52); ctx.lineTo(cx2, ay - 36); },
      {color: P.unknown, alpha: span2, width: 2});
    text(L("2 小时", "2 h"), (px + qx) / 2, ay - 78, LABEL, {role: "mark", align: "center", color: P.unknown, alpha: gF * ramp(t, twoHours + .4, .4)});
    // Each statement hangs from the time it claims: the true one from the actual time, the refused one from the plan.
    const sy = fy + 360;
    link(qx, ay + 16, qx, sy - 28, {alpha: gF * ramp(t, write - .15, .4), draw: {t, at: write - .1}, end: false});
    nameText(truth, qx, sy, {color: P.evidence, alpha: gF * named(t, write)});
    check(qx + measure(truth) / 2 + 30, sy, 26, {alpha: gF * ramp(t, Math.max(fidelityIs, write) - .15, .4)});
    link(px, ay + 16, px, sy - 28, {alpha: gF * ramp(t, roughly - .15, .4), upto: drawShare(t, roughly - .1, Math.abs(sy - 28 - (ay + 16)), .5), end: false, dash: [6, 6]});
    rejectedName(L("“基本按时”", "“Roughly on time”"), px, sy, {alpha: gF * named(t, roughly), mark: ramp(t, roughly + .4, .4)});
    ctx.restore();
  }
  const gC = gE * L(ramp(t, clarityIn, .4), stageIn(t, firstLead));
  if (gC > 0) {
    // The message in its order: what leads stands at the top of the page and the detail follows below it; the page's
    // spine stands with its frame, and the frame lengthens as each part comes.
    const lead = [firstLead, decisionNeeded, detail], leadNames = en ? ["The conclusion", "The decision needed", "Detail"] : ["结论", "需要谁来决定", "细节"];
    const rw = L(700, 820), rx = L(1030, 960 - rw / 2), fy = L(388, 330), rows = [fy + 70, fy + 180, fy + 290], sx = rx + 60;
    // The frame keeps the room above its first part's words below its last line too: 57 px.
    const grown = lead.map((at, i) => i ? drawShare(t, at - .45, [0, 110, 154][i], .4) : 1), fh = 70 + 36 + 57 + 110 * grown[1] + (110 + 44) * grown[2];
    box(rx, fy, rw, fh, {stroke: P.line, alpha: gC, radius: 10, width: 3.5});
    head(rx, fy - 40, L("达", "Clarity"), P.ink, clarityIs, gC);
    path([[sx, rows[0]], [sx, mix(rows[0], mix(rows[1], rows[2], grown[2]), grown[1])]], {color: P.line, alpha: gC, width: 3});
    // Once the order is named clarity and its detail said, the message is whole: every part returns to full ink and none
    // stays lit.
    const whole = ramp(t, Math.max(clarityIs, detail) + .05, .4);
    lead.forEach((at, i) => {
      const y = rows[i], got = named(t, at), lit = speaking(t, lead, i) * (1 - whole), color = i < 2 ? P.ink : P.muted;
      dot(sx, y, 5 + 2 * lit, {color, alpha: got * gC});
      if (lit > 0) ring(sx, y, 15, {color: P.ink, alpha: lit * .5 * gC, width: 2});
      nameText(leadNames[i], sx + 15 + NAME_GAP, y, {align: "left", color, alpha: gC * ramp(t, at - .15, .4) * Math.max(listLevel(t, lead, i), whole), set: "lead"});
      // Paragraph lines beneath each part: one for each part that leads, three for the detail.
      stroke(() => { for (let k = 0; k < (i < 2 ? 1 : 3); k++) { ctx.moveTo(sx + 37, y + 36 + k * 22); ctx.lineTo(rx + rw - 60 - (k === 2 ? 140 : 0), y + 36 + k * 22); } },
        {color: P.muted, alpha: got * gC * .8, width: 2.5});
    });
  }
  // 4. Clarity's concrete checks: a page on the left and its checklist beside it, row for row. Each check is ticked on its
  // own words and lights the part of the page it governs: one point to a paragraph, a term defined where it first
  // appears. English names the first check "One point to a paragraph", not its caption line's words, since each English
  // check is a caption line of its own. The list builds and stays
  // until the question before sending. The Chinese thought opens on 达, the word the thought before closes on, so the
  // stage cuts on the clause after it that says there are concrete checks, and its head names them in those words.
  // In English that question continues the thought that lists the checks, so the checked page is named as the draft
  // before sending on those words and the list holds until the outside reader is named; in Chinese it begins its own
  // thought, which cuts to the draft on its first words.
  const sendCut = en ? outsider : beforeSend;
  const gc = base * stageIn(t, concrete) * stageOut(t, sendCut);
  if (gc > 0) {
    const firstUse = cue(s, "第一次出现", "defined at first use");
    const rows = en ? [[["One point to a paragraph"], [onePoint], [], []], [["Terms"], [terms], ["defined at first use"], [firstUse]]]
      : [[["一段只讲一个意思"], [onePoint], [], []], [["术语"], [terms], ["第一次出现就讲明白"], [firstUse]]];
    const rowW = ([term, , qual]) => measure(term.join("")) + (qual.length ? TERM_GAP + measure(qual.join(""), NOTE) : 0);
    // With two checks the page is wider and the rows further apart, so the page and its list still fill the stage.
    const PW = 400, listW = Math.max(...rows.map(rowW)), groupW = PW + 120 + 50 + listW, LX = 960 - groupW / 2 + PW + 120 + 50;
    // English names the checks over a second before the first of them: the page stands alone on the centre until then and
    // makes room for them in a glide from the thought's first word, "Clarity", so it has cleared the first check's box
    // before the box appears.
    const room = (groupW - PW) / 2, px = 960 - groupW / 2 + (en ? room * (1 - glide(t, cue(s, "", "clarity has") + .05, room)) : 0);
    const starts = rows.map(r => r[1][0]), tops = stackTops(rows.map(([term, , qual]) => termRowLayout(term, qual, Infinity).height), CONTENT_CY + 50, 120);
    const mids = tops.map(v => v + labelSize(LABEL) / 2), ticked = starts.map(at => ramp(t, at - .15, .4) * gc);
    // The head names the checks; the page stands with its parts at the structure tier from the stage's first words, and
    // each check's box arrives with its tick on its own words.
    const hy3 = tops[0] - 110, headA = named(t, concrete) * gc;
    ring(px + 15, hy3, 15, {color: P.ink, alpha: headA, width: 2.5});
    dot(px + 15, hy3, 6, {color: P.ink, alpha: headA});
    nameText(L("具体的标准", "Concrete checks"), px + 30 + NAME_GAP, hy3, {align: "left", alpha: headA});
    const pt = hy3 + 46, pb = mids[1] + 60;
    box(px, pt, PW, pb - pt, {fill: P.row, stroke: P.line, alpha: gc, radius: 10});
    if (sendCut > beforeSend) nameText(L("发出之前", "Before sending"), px, pb + NAME_GAP, {align: "left", valign: "top", alpha: gc * named(t, beforeSend)});
    const lit = (i, base2 = P.line) => blend(base2, P.evidence, ticked[i] / Math.max(gc, 1e-6));
    // The English page opens on the centre, where the message's lines stood a moment before, so its parts come up over
    // 0.2 s from the cut rather than read as those lines jumping to new places.
    const part = gc * (en ? ramp(t, concrete + STAGE_CUT, .2) : 1);
    // One point to a paragraph: each paragraph's point and its line.
    [-16, 16].forEach(dy => { dot(px + 42, mids[0] + dy, 5, {color: lit(0), alpha: part}); line(px + 62, mids[0] + dy, px + PW - 40 - (dy > 0 ? 60 : 0), mids[0] + dy, {color: P.line, alpha: part, width: 2}); });
    // A line of text whose term is marked where it first appears.
    line(px + 30, mids[1], px + PW - 30, mids[1], {color: P.line, alpha: part, width: 2});
    line(px + 110, mids[1] + 12, px + 200, mids[1] + 12, {color: lit(1), alpha: part, width: 4});
    // When the last check's closing words are said the list is whole: every row returns to full ink; the row being
    // spoken keeps its light.
    const whole = ramp(t, cue(s, "讲明白", "first use") + .05, .4);
    rows.forEach(([term, termAts, qual, qualAts], i) => {
      const cx3 = LX - 50, on = speaking(t, starts, i);
      box(cx3 - 16, mids[i] - 16, 32, 32, {stroke: blend(P.line, P.ink, on), alpha: ticked[i], radius: 6, width: 2});
      check(cx3, mids[i], 22, {alpha: ticked[i]});
      termRow(t, term, termAts, qual, qualAts, LX, tops[i], {alpha: gc * Math.max(listLevel(t, starts, i), whole), set: "checks"});
    });
  }
  // 4b. Before sending, an outside reader reads the draft: the draft stands with its name from the stage's cut, and the
  // way it is sent on draws to the reader as the reader is named; what the reader could restate builds into one column
  // on its words.
  const gr = base * stageIn(t, sendCut) * stageOut(t, escalate);
  if (gr > 0) {
    const names = en ? ["Conclusion", "Basis", "Limits", "Next action"] : ["结论", "依据", "限度", "下一步"];
    // The column stands where the whole stage centres; Chinese shows the draft alone and then with its reader before the
    // column, so the two stand 157 px right of their places, centred, and glide into their places just before the
    // column's first item inks in, so the column's stem never crosses the reader's name.
    const readerGlide = glideTime(157);
    const reach = en ? 0 : 157 * (1 - smoother((voiceTime(t) - voiceTime(restate[0] - .15) + readerGlide) / readerGlide));
    const DX = 420 + reach, DW = 190, DH = 280, my = CONTENT_CY, ox = L(1130, 1100) + reach, CX = 1130 + 210;
    const tops = stackTops(names.map(() => labelSize(LABEL)), my, 64), mids = tops.map(v => v + labelSize(LABEL) / 2);
    s23Page(DX, my - DH / 2, DW, DH, {alpha: gr, rows: 4});
    nameText(L("发出之前", "Before sending"), DX, my - DH / 2 - NAME_GAP, {align: "left", valign: "bottom", alpha: gr * named(t, beforeSend)});
    // The draft goes to the outside reader: one point glides along the way once the reader is named.
    const reads = glide(t, outsider, ox - 50 - DX - DW - 24);
    const ou = named(t, outsider) * gr;
    link(DX + DW + 24, my, ox - 50, my, {alpha: ou, draw: {t, at: outsider - .15}, flow: reads > 0 && reads < 1 ? reads * .999 : null});
    person(ox, my + 6, {alpha: ou, color: P.muted, size: 1.3});
    // The reader's name hangs under the reader; a last line that would nearly meet a line of the column beside it stands
    // on that line instead.
    // The English name stands whole on one line, as no break keeps its phrase in an even block; its reader stands 30 px
    // further left, so the name keeps 40 px from the column's stem.
    const readerName = L("局外人", "A reader outside the work"), readerTop = my + 6 + 15 * 1.3 * 2.6 + NAME_GAP;
    const readerLast = readerTop + labelSize(LABEL) / 2 + (wrapName(readerName, 360).length - 1) * labelSize(LABEL) * LEADING;
    const meets = mids.find(m => Math.abs(m - readerLast) < 13);
    nameText(readerName, ox, readerTop + (meets === undefined ? 0 : meets - readerLast), {valign: "top", width: 360, color: P.muted, alpha: ou});
    // What the reader could restate: the column's stem and its link from the reader draw with the first item, and each
    // item brings its branch, its point and its name on its own words.
    const col = named(t, restate[0]) * gr;
    link(ox + 40, my, CX - 30, my, {alpha: col * .8, end: false});
    line(CX - 30, mids[0], CX - 30, mids[3], {color: P.line, alpha: col, width: 2});
    // The column is whole on its last word, inside the thought: every name returns to full ink; the last keeps its light.
    const whole = ramp(t, cue(s, "步", "action", {last: true}) + .05, .25);
    names.forEach((v, i) => {
      const got = named(t, restate[i]), lit = speaking(t, restate, i);
      link(CX - 30, mids[i], CX - 13, mids[i], {alpha: gr * .8 * got, end: false, r: 0});
      dot(CX, mids[i], 6 + 2 * lit, {color: P.evidence, alpha: got * gr});
      if (lit > 0) ring(CX, mids[i], 18, {color: P.evidence, alpha: lit * restMark(P.evidence, .5) * gr, width: 2});
      nameText(v, CX + 11 + NAME_GAP, mids[i], {align: "left", alpha: gr * got * Math.max(listLevel(t, restate, i), whole), set: "restate"});
    });
  }
  // 5. Escalating a risk takes four parts, and the report assembles them so that a decision can be made. The report is a
  // page headed by its title from the words that name the escalation, and it lengthens to take each part on the part's
  // own first words, stepping up a little each time so it stays about the centre: the part slides into its place from
  // the right with its name on the page beside it, while what it states draws on its own words: the risk; the impact,
  // the facts and how long a decision stays in time; the containment and how well it held; the decision's options with
  // their costs and the one recommended. Both editions name each part, so the page names them risk, impact, containment
  // and decision. No place stands before its part. The report goes to the person who must decide: that person stands
  // muted beside the report from the escalation's first words, so the stage stands whole about the centre while the
  // report lengthens, and when the words name who must decide, the person takes the authority's colour, the report goes
  // to them, with the time they must decide by.
  const g4 = base * stageIn(t, escalate);
  if (g4 > 0) {
    const names = en ? ["Risk", "Impact", "Containment", "Decision"] : ["风险", "影响", "控制影响", "决定"];
    const GW = 320, nameW = Math.max(...names.map(v => measure(v))), SW = GW + 40, PW = 28 + nameW + 32 + SW + 24, HEAD = 96, SH = 96, STEP = 32;
    // The second part arrives on its first words, which name the impact.
    const starts = [risk, Math.min(facts, impact2), contain, options], grown = starts.map(at => soon(t, pauseHold(at - .5, .4), .35));
    // The report stands where it centres with the person who must decide 200 px beyond it and their clock (305 px in all).
    const PX = 960 - PW / 2 - 152;
    const PY = 380 - STEP * grown.slice(1).reduce((a, b) => a + b, 0), SX = PX + 28 + nameW + 32, gx = SX + SW / 2;
    const tops = starts.map((_, k) => PY + HEAD + k * (SH + 12)), mids = tops.map(v => v + SH / 2);
    const length = grown.reduce((h, q, k) => h + (k ? SH + 12 : SH + 24) * q, HEAD);
    s23Page(PX, PY, PW, length, {alpha: g4});
    nameText(L("上报风险", "Escalating a risk"), PX + 28, PY + HEAD / 2, {align: "left", alpha: g4 * named(t, escalate)});
    // A part slides into its place from the right, and its name stands on the page beside the place; the part returns
    // the offset its contents still carry.
    const attach = k => {
      const dx = 32 * (1 - soon(t, starts[k] - .1, .5));
      box(SX + dx, tops[k], SW, SH, {fill: P.row, stroke: P.ink, alpha: ramp(t, starts[k] - .15, .4) * g4, radius: 10, width: 2});
      nameText(names[k], PX + 28, mids[k], {align: "left", alpha: g4 * listIn(t, starts, k), set: "parts"});
      return dx;
    };
    const on = at => ramp(t, at - .15, .4) * g4;
    // The risk itself.
    {
      const x = gx + attach(0), y = mids[0];
      dot(x, y, 13, {color: P.unknown, alpha: on(risk)});
      ring(x, y, 26, {color: P.unknown, alpha: on(risk) * restMark(P.unknown, .8), width: 2.5});
      ring(x, y, 38, {color: P.unknown, alpha: on(risk) * restMark(P.unknown, .4), width: 1.5});
    }
    // The facts, the impact spreading from the risk, and the latest time a decision is still in time: the time from
    // now runs safe up to its mark and unsafe after it.
    {
      const x = gx + attach(1), y = mids[1], run = soon(t, safe + .05, .7);
      s23Page(x - 154, y - 31, 48, 62, {alpha: on(facts), rows: 3});
      dot(x - 46, y, 7, {color: P.unknown, alpha: on(impact2)});
      ring(x - 46, y, mix(7, 26, soon(t, impact2 + .05, .6)), {color: P.unknown, alpha: on(impact2), width: 2});
      dot(x + 14, y, 6, {color: P.ink, alpha: on(safe)});
      line(x + 14, y, mix(x + 14, x + 112, run), y, {color: P.evidence, alpha: on(safe), width: 3.5});
      line(x + 112, y - 24, x + 112, y + 24, {color: P.authority, alpha: on(safe) * ramp(t, safe + .4, .3), width: 4});
      line(x + 120, y, x + 156, y, {color: P.unknown, alpha: on(safe) * ramp(t, safe + .6, .3), width: 2.5});
    }
    // The containment tried, and how well it held: a gauge fills to its share.
    {
      const x = gx + attach(2), y = mids[2], held = soon(t, effect + .05, .8);
      shield(x - 112, y, 34, {color: P.evidence, alpha: on(contain), fillColor: P.row});
      check(x - 112, y + 2, 26, {color: P.evidence, alpha: on(contain)});
      box(x - 52, y - 13, 200, 26, {stroke: P.line, alpha: on(effect), radius: 13, width: 2});
      box(x - 47, y - 8, mix(16, 118, held), 16, {fill: P.evidence, alpha: on(effect), radius: 8});
    }
    // The decision: its options, each with its cost beneath it, and the recommended one marked; the options draw on the
    // word that names them.
    {
      const x = gx + attach(3), y = mids[3], pick = ramp(t, recommend - .15, .4), optionsAt = cue(s, "选项", "the options");
      [x - 70, x + 46].forEach((ox, i) => {
        box(ox - 40, y - 34, 80, 42, {fill: P.ground, stroke: i ? blend(P.ink, P.evidence, pick) : P.ink, alpha: on(optionsAt), radius: 8, width: 2});
        if (i) check(ox, y - 13, 26, {alpha: pick * g4});
        dot(ox, y - 13, 6, {color: P.ink, alpha: on(optionsAt) * (i ? 1 - pick : 1)});
        line(ox - 36, y + 24, ox - 36 + [66, 32][i], y + 24, {color: P.unknown, alpha: on(costs), width: 7});
      });
    }
    // Who must decide, and by when: the person beside the report lights, the report goes to them, and the time they
    // must decide by stands with them.
    // The report's way draws on to them as a glide and ends in its point, which grows in as the way arrives.
    const DX = PX + PW + 200, DY = mids[1] + 54, go = glide(t, who + .05, DX - 48 - PX - PW - 14);
    person(DX, DY + 10, {color: blend(P.muted, P.authority, ramp(t, who - .15, .4)), alpha: g4, size: 1.4});
    link(PX + PW + 14, DY, DX - 48, DY, {color: P.authority, alpha: on(who), upto: go, width: 2.5});
    clock(DX + 80, DY - 34, 24, {color: P.authority, alpha: on(cue(s, "在什么时候决定", "by when")), hand: .8});
  }
};

/* ---------------- 26 evolve: what learning is for ---------------- */
scenes["26"] = function (s, t) {
  const practice = cue(s, "全部门的做法", "department practice");
  const kinds = cues(s, [["规则", "a rule"], ["模板", "template"], ["工具", "tool"], ["智能体流程", "Agent workflow"], ["平台机制", "platform mechanism"]]);
  const needs = cues(s, [["观察到的问题", "observed problem"], ["有依据的实质风险", "a substantiated material risk"], ["必须履行的义务", "an applicable obligation"]]);
  const [falls, cost, small, maintainer] = cues(s, [["现有边界", "why the existing boundaries"], ["新做法要多花多少", "the new practice's cost"],
    ["小范围试点", "a bounded trial"], ["谁来维护", "a named owner"]]);
  // Chinese opens what must still be explained by counting it, "three things", so the stage that holds them cuts on
  // those words; English cuts on the first of them.
  const explain = cue(s, "还要做到三件事", "why the existing boundaries");
  const [safeguards, noWait] = cues(s, [["必要的保障", "necessary safeguards"], ["不能等", "must not wait"]]);
  const retire = cue(s, "就撤掉", "retire a rule");
  // Chinese names the rule before its reasons and retires it last; English retires the rule first.
  const ruleAt = cue(s, "规则要是", "retire a rule");
  // The reasons in spoken order: Chinese names the rule first and then its four reasons; both editions name what the
  // rule governs before its users, and the English first reason arrives with the words that give it, "nothing left to
  // govern".
  const reasons = en ? cues(s, [["", "nothing left to govern"], ["", "no user"], ["", "duplicates a source"], ["", "costs more"]])
    : cues(s, [["失去适用对象", ""], ["没人用", ""], ["和权威来源重复", ""], ["得不偿失", ""]]);
  const reasonNames = en ? ["Nothing left to govern", "No user", "Duplicates a source of truth", "Costs more than it returns"]
    : ["失去适用对象", "没人用", "和权威来源重复", "得不偿失"];
  const base = ramp(t, opening(s), .7);
  // Department practice is one seal at one place in stages 2 and 3, so it stands still across their cut.
  const PRACTICE_X = 1430, PRACTICE_R = 60;
  // 1. What learning is for, on one lane of the next time, a track rather than a panel to fill, which stands from the
  // chapter's first words, with its way running along it from those words. Chinese names the lane by the next time and
  // the failure on it by its own word, as it says 下一次失败; English, which says "the next failure", names the failure
  // alone, at the start of the lane. Each name stands from the first words of the clause that says it, as a name may, so
  // the opening words are not left unnamed: the Chinese clause after 学习的目的, the English sentence; and Chinese names
  // its first clause too, what the lane is for, 学习的目的 over the lane's start on those words, so the lane never
  // stands unnamed through them. On the words that say it is found earlier, the place it is found stands near it while
  // the place it used to be found stays as a muted trace further on, and the time gained lights along the lane from the
  // old place to the new; no mark slides. The manual rescue it takes stands behind it as a long band on its words and
  // shrinks, leaving the muted outline of its old reach. More files are refused beside the lane. The stage stands clear
  // of the rising chapter title.
  const g1 = base * clearOfTitle(s, t, 360) * stageOut(t, kinds[0]);
  if (g1 > 0) {
    const [sooner, judge, less, more] = cues(s, [["更早被发现", "earlier"], ["更容易判断", "judge it more easily"], ["少靠人救火", "less manual rescue"],
      ["让文件变多", "add files"]]);
    const fails = en ? s.words[0].start : cue(s, "失败", "");
    // The files beside the lane's end come last, so the stage stands right of its place while it builds and moves left
    // as the files arrive in their place, settling within their words, so it stands centred both while it builds and once
    // it is whole: 65 px right and then 75 px left in Chinese, whose lane's name stands at its left; 25 px right and
    // then 100 px left in English, which names nothing there.
    const OFF = mix(L(65, 25), L(-75, -100), glide(t, more - .1, L(140, 125)));
    const Y = 500, X0 = 420 + OFF, X1 = 1440 + OFF, LH = 46, FX = 520 + OFF, LATE = 1080 + OFF, EARLY = 740 + OFF, BAND = Y + 30, BH = 12, OLD = 360, NEW = 150;
    const shrink = soon(t, less + .25, .8), top = Y - LH - NAME_GAP, below = Y + LH + NAME_GAP;
    // The lane's edge is firm enough to carry the opening before its names arrive.
    box(X0, Y - LH, X1 - X0, 2 * LH, {fill: P.row, stroke: P.line, alpha: g1, radius: 16, width: 4});
    // The way runs the lane's length from the chapter's first words to the words that say the failure is found earlier.
    const way = s.words[0].start;
    line(X0 + 24, Y, mix(X0 + 24, X1 - 24, drawShare(t, way - .1, X1 - X0 - 48, Math.max(1.2, sooner - way))), Y, {color: P.line, alpha: g1, width: 2});
    if (!en) nameText("下一次", X0 - NAME_GAP, Y, {align: "right", alpha: g1 * named(t, cue(s, "是让", ""))});
    if (!en) nameText("学习的目的", X0, top, {align: "left", valign: "bottom", alpha: g1 * named(t, cue(s, "学习的目的", ""))});
    const fq = g1 * ramp(t, fails - .15, .4);
    ring(FX, Y, 14, {color: P.unknown, alpha: fq, width: 2.5});
    dot(FX, Y, 6, {color: P.unknown, alpha: fq});
    // The failure is named under its mark, on the line of the names below the lane, so the name above the lane stands
    // alone there.
    nameText(L("失败", "The next failure"), FX, below, {valign: "top", alpha: g1 * named(t, fails)});
    // Found earlier: the place the failure used to be found and how long its manual rescue ran stay as muted traces at
    // the structure tier, while the new place stands near the failure and the band shrinks.
    const found = g1 * ramp(t, sooner - .1, .3);
    line(LATE, Y - 38, LATE, Y + 38, {color: P.line, alpha: found, width: 2});
    link(LATE - 4, Y, EARLY + 8, Y, {color: P.evidence, alpha: found, width: 2.5, draw: {t, at: sooner + .05}, end: false});
    box(EARLY, BAND, OLD, BH, {stroke: P.line, alpha: g1 * ramp(t, less + .25, .4), radius: 5, width: 2});
    line(EARLY, Y - 38, EARLY, Y + 38, {color: P.evidence, alpha: found, width: 4});
    ring(EARLY, Y, 24, {color: P.evidence, alpha: g1 * ramp(t, judge - .05, .4), width: 2.5});
    box(EARLY, BAND, mix(OLD, NEW, shrink), BH, {fill: P.unknown, alpha: g1 * restMark(P.unknown, .55) * ramp(t, less - .15, .3), radius: 5});
    // Found earlier, then judged more easily: one name above the mark, each part on its own words, on two even lines in
    // Chinese and on one line in English, whose two lines would not stand even. It begins on the mark's line, where the
    // rescue's band begins, and the rescue's name below begins there too.
    const parts = [L("更早被发现", "Find it earlier"), L("、更容易判断", ", judge it more easily")];
    growName(t, parts, [sooner, judge], EARLY, top, {valign: "bottom", width: en ? Infinity : measure(parts[0]) + 8, alpha: g1, color: P.evidence});
    nameText(L("少靠人救火", "Less manual rescue"), EARLY, below, {align: "left", valign: "top", alpha: g1 * named(t, less)});
    // Not more files: a small stack of documents appears on its words and is refused.
    const fl = g1 * ramp(t, more - .15, .4);
    for (let k = 0; k < 3; k++) documentIcon(1556 + OFF + k * 16, Y - 74 + k * 14, 80, 100, {alpha: fl, rows: 3, stroke: P.muted});
    rejectedName(L("让文件变多", "Add files"), 1612 + OFF, below, {valign: "top", alpha: g1 * named(t, more), mark: ramp(t, cue(s, "文件", "files") + .05, .3)});
  }
  // 2. The way into department practice. The five kinds of candidate build one column, each with its emblem (a rule's
  // page, a template's blank form, a tool, an Agent, a platform's wheel), and merge into one way, which splits into three
  // lanes: an observed problem, a substantiated material risk or an applicable obligation, any one of which gives the
  // reason, and the lanes rejoin before practice. Each candidate arrives with its link into the way on its own words, and the way runs
  // on from the junction toward practice as the first arrives, ahead of practice, which takes its seal and name on its
  // own words; so the stage stands about the centre while it builds and once it is whole. That straight way is the
  // middle lane; each need's mark and name arrive on its own words, and the other two lanes draw round with their needs.
  const judged = Math.min(retire, reasons[0], ruleAt);
  const g2 = base * stageIn(t, kinds[0]) * stageOut(t, explain);
  if (g2 > 0) {
    // The needs stand on the middle of the fork their lanes draw, between its split and its join. The fork is laid out
    // back from practice's place, which puts the whole stage, from the widest candidate's name to practice's name, about
    // the centre, and its lanes rejoin far enough before practice that the English name, wider than the seal, stands
    // clear of the join.
    // The English candidates' names are longer, so their emblems stand 50 px nearer the junction and the stage, from the
    // widest name to practice's name, stays about the centre.
    const PX = PRACTICE_X, PR = PRACTICE_R, RX = PX - 180, SX = RX - 340, JX = SX - 20, DX = JX - L(330, 280), MX = DX + 230, NX = DX - 40, NEED = (SX + RX) / 2;
    // The five kinds stand at one pitch about the way's row, their names on one right edge.
    const cys = [340, 420, 500, 580, 660], lys = [370, 500, 630];
    const kindNames = en ? ["Rule", "Template", "Tool", "Agent workflow", "Platform mechanism"] : ["规则", "模板", "工具", "智能体流程", "平台机制"];
    // Until practice is named the way runs on toward its place alone, so the stage stands right of its place by what
    // centres the candidates' names with the way, and glides there as practice takes its seal, well before stage 3 keeps
    // the seal's place.
    const leftmost = NX - Math.max(...kindNames.map(v => Math.max(...[].concat(v).map(line => measure(line))))), lean = 960 - (leftmost + PX - PR - 10) / 2;
    ctx.save(); ctx.translate(lean * (1 - glide(t, practice - .15, lean)), 0);
    const needNames = en ? ["Observed problem", "Substantiated material risk", "Applicable obligation"] : ["观察到的问题", "有依据的实质风险", "必须履行的义务"];
    kinds.forEach((at, i) => {
      const q = ramp(t, at - .15, .4) * g2, lit = speaking(t, kinds, i), y = cys[i], color = blend(P.ink, P.evidence, lit);
      if (i === 0) documentIcon(DX - 18, y - 23, 36, 46, {alpha: q, rows: 3, stroke: color});
      if (i === 1) {
        documentIcon(DX - 18, y - 23, 36, 46, {alpha: q, rows: 0, stroke: color});
        box(DX - 10, y - 9, 20, 18, {stroke: color, alpha: q, radius: 3, width: 2, dash: [3, 3]});
      }
      if (i === 2) { line(DX - 12, y + 12, DX + 3, y - 3, {color, alpha: q, width: 4}); ring(DX + 8, y - 8, 7, {color, alpha: q, width: 3}); }
      if (i === 3) agent(DX, y, {alpha: q, size: .6, color});
      if (i === 4) {
        ring(DX, y, 12, {color, alpha: q, width: 3});
        dot(DX, y, 4, {color, alpha: q});
        stroke(() => [0, 1, 2, 3, 4, 5].forEach(k => { const a = k * Math.PI / 3; ctx.moveTo(DX + Math.cos(a) * 14, y + Math.sin(a) * 14);
          ctx.lineTo(DX + Math.cos(a) * 20, y + Math.sin(a) * 20); }), {color, alpha: q, width: 3});
      }
      link(DX + 28, y, JX, 500, {route: "hvh", mid: MX, alpha: q, width: 3, end: false});
      nameText(kindNames[i], NX, y, {align: "right", alpha: g2 * listIn(t, kinds, i), set: "candidates"});
    });
    dot(JX, 500, 6, {color: P.line, alpha: g2 * ramp(t, kinds[0] - .15, .4)});
    lys.forEach((ly, k) => {
      const q = ramp(t, needs[k] - .15, .4) * g2, lit = speaking(t, needs, k), round = {t, at: needs[k] - .15};
      // The four links merge into a way one step firmer than they are, and its lanes keep that stroke: the way carries
      // the stage's right while it builds, and a thinner way on the middle row is lost in a frame seen small.
      if (ly === 500) link(JX, 500, PX - PR - 10, 500, {alpha: g2 * ramp(t, kinds[0] - .15, .4), draw: {t, at: kinds[0] + .05}, width: 4, end: false,
        flowing: since(t, Math.max(practice + .6, kinds[0] + .95))});
      else {
        // The way out to the round and the way back draw on as one stroke from the junction, so the way back grows on
        // from where the way out ends rather than setting off as a second mark.
        path(rounded([[JX, 500], [SX, 500], [SX, ly], [RX, ly], [RX, 500], [PX - PR - 10, 500]], 14), {color: P.line, alpha: q, draw: round, width: 4});
      }
      ring(NEED, ly, 14, {color: P.authority, alpha: q, width: 2.5});
      dot(NEED, ly, 6 + 2 * lit, {color: P.authority, alpha: q});
      nameText(needNames[k], NEED, ly - 14 - NAME_GAP, {valign: "bottom", width: L(260, 320), alpha: g2 * listIn(t, needs, k), set: "needs"});
    });
    // Department practice: an unstamped seal, on its words.
    const pr = ramp(t, practice - .15, .4) * g2;
    seal(PX, 500, PR, {color: P.authority, alpha: pr, hollow: true});
    nameText(L("全部门的做法", "Department practice"), PX, 500 + PR + NAME_GAP, {valign: "top", color: P.authority, alpha: g2 * named(t, practice)});
    ctx.restore();
  }
  // 3. What the candidate must still show, as one column of conditions, each checked on its own words and named by its
  // key words. Chinese counts them as three things: why the existing boundaries, interfaces and feedback fall short with
  // what the new practice costs to learn and maintain, a small trial that weighs the evidence, and who maintains it and
  // when it is revised or withdrawn. English keeps four: the existing boundaries, interfaces and feedback falling
  // short, the new practice's cost to understand and maintain, a bounded trial with evidence of net benefit, and a named
  // owner with triggers for revision or retirement. Every condition's qualifier stands under its name, and the conditions stand at one gap, so the
  // Chinese column, whose conditions all carry one, keeps one pitch. A light bracket encloses
  // the column as it builds, lengthening just before each condition arrives, and its rows stand close enough that it is
  // always more than half filled; one link runs from it to department practice once it reaches the link's level; the
  // seal is stamped once the last condition has been named.
  const g3 = base * stageIn(t, explain) * stageOut(t, safeguards);
  if (g3 > 0) {
    const [evidenceAt, triggers] = cues(s, [["用证据看利弊", "evidence of net benefit"], ["什么时候改或撤", "stated triggers"]]);
    const rows = en ? [
      [["Existing boundaries, interfaces and feedback fall short"], [falls], [], []],
      [["New practice's cost"], [cost], ["to understand and maintain"], [cue(s, "", "to understand and maintain")]],
      [["Bounded trial"], [small], ["net-benefit evidence"], [evidenceAt]],
      [["Named owner"], [maintainer], ["revision and retirement triggers"], [triggers]]]
    : [
      [["现有边界、分工衔接和反馈为什么不够"], [falls], ["新做法要多花多少学习和维护成本"], [cost]],
      [["小范围试点"], [small], ["用证据看利弊"], [evidenceAt]],
      [["谁来维护"], [maintainer], ["什么时候改或撤"], [triggers]]];
    const W = 600, PR = PRACTICE_R, starts = rows.map(([, termAts, , qualAts]) => Math.min(...termAts, ...qualAts));
    const rights = rows.map(([term, , qual]) => Math.max(measure(term.join("")), qual.length ? Math.min(measure(qual.join(""), NOTE), W) : 0));
    const right = Math.max(...rights), practiceName = L("全部门的做法", "Department practice");
    // Practice keeps its place from stage 2: the link to it is as long as centres the column, the link and practice with
    // practice there.
    const half = Math.max(PR, measure(practiceName) / 2), LINK = 2 * (PRACTICE_X - 960) - (48 + right + 36 + PR) + half;
    const whole = 48 + right + 36 + LINK + PR + half, LX = 960 - whole / 2 + 48;
    const BX = LX + right + 36, PX = BX + LINK + PR;
    const blocks = rows.map(([term, , qual]) => termRowLayout(term, qual, W, false).height), pad = 24 - labelSize(LABEL) / 2;
    const tops = stackTops(blocks, CONTENT_CY, 36);
    const ys = tops.map(top => top + labelSize(LABEL) / 2), top = tops[0] - pad;
    rows.forEach(([term, termAts, qual, qualAts], r) => {
      const q = ramp(t, starts[r] - .15, .4), lit = speaking(t, starts, r);
      ring(LX - 34, ys[r], 16 + 2 * lit, {color: P.authority, alpha: g3 * q, width: 2.5});
      check(LX - 34, ys[r] + 1, 18, {color: P.authority, alpha: g3 * ramp(t, starts[r] + .05, .4)});
      termRow(t, term, termAts, qual, qualAts, LX, tops[r], {width: W, alpha: g3 * listLevel(t, starts, r), set: "conditions", inline: false});
    });
    // The bracket lengthens to take each condition's name and then its qualifier, starting just before each arrives so
    // its room is there when it does; the link to practice joins it once it has reached the link's level, inking in over
    // 0.4 s once the step that brings the bracket there is done rather than in the frame or two the bracket takes to
    // pass it, and carries one point once stamped.
    let joinAt = Infinity;
    const held = rows.reduce((b, [, , , qualAts], r) => {
      const nameFrom = pauseHold(starts[r] - .45, .4), nameTo = tops[r] + labelSize(LABEL) + pad;
      if (nameTo > CONTENT_CY) joinAt = Math.min(joinAt, nameFrom);
      const named = mix(b, nameTo, soon(t, nameFrom, .4));
      if (!qualAts.length) return named;
      const qualFrom = pauseHold(qualAts[0] - .45, .4), qualTo = tops[r] + blocks[r] + pad;
      if (qualTo > CONTENT_CY) joinAt = Math.min(joinAt, qualFrom);
      return mix(named, qualTo, soon(t, qualFrom, .4));
    }, top);
    if (held > top + .5) path([[BX - 16, top], [BX, top], [BX, held], [BX - 16, held]], {color: P.line, alpha: g3 * clamp((held - top) / 60), width: 2});
    const done = ramp(t, triggers + .05, .4);
    link(BX, CONTENT_CY, PX - PR - 12, CONTENT_CY, {alpha: g3 * Math.min(clamp((held - CONTENT_CY) / 24), ramp(t, joinAt + .4, .4)), end: false,
      flowing: since(t, triggers + .05)});
    seal(PX, CONTENT_CY, PR, {color: P.authority, alpha: g3, hollow: true});
    check(PX, CONTENT_CY + 3, PR * .8, {color: P.authority, alpha: g3 * done});
    nameText(practiceName, PX, CONTENT_CY + PR + NAME_GAP, {valign: "top", color: P.authority, alpha: g3});
    // Chinese counts what must be explained before the column builds, and the count heads the column from its words.
    if (!en) nameText("还要做到三件事", LX, top - 24 - NAME_GAP, {align: "left", valign: "bottom", color: P.muted, alpha: g3 * named(t, explain)});
  }
  // 4. Necessary safeguards do not wait: the safeguard stands now on the left, and the two things it must not wait for,
  // an incident or a new practice's admission, stand together on the right inside one bracket, which opens with the incident
  // and lengthens to take the admission on its words. The way from the safeguard toward them draws on with the words
  // that refuse the wait and stops halfway at a short bar. Below, the safeguard stands on existing authority, and a
  // trial only chooses and verifies how to meet it. English names the safeguard with the wait it refuses. Chinese names the refused
  // wait under the bar, lights the safeguard again as such a safeguard is said to take a trial too, and names the trial on its word, what it only
  // does, choosing how and verifying it, joining on its own words; whether to meet the safeguard, which the trial never
  // decides, is refused after them on its words. The Chinese safeguard stands nearer the centre, so the stage is
  // balanced before the things it must not wait for arrive, and larger, its check with it, so the stage covers a tenth
  // of the frame's band while it stands alone.
  const g4 = base * stageIn(t, safeguards) * stageOut(t, judged);
  if (g4 > 0) {
    const [incidentAt, approvalAt] = cues(s, [["出事", "an incident"], ["新做法获批", "a new practice's admission"]]);
    // The safeguard's column keeps the shield's left edge: its name above, the authority's line and its name below, and
    // the trial's fork and names under them. It stands on the centre, with its name and its refused way, until the
    // first thing it must not wait for is named, and then eases left until the whole stage centres; the events and
    // their bracket stand at their places.
    const LEFT = mix(L(140, 316), L(-150, -120), glide(t, incidentAt - .1, L(290, 436)));
    // The English admission's name stands whole on one line, since no break of it keeps a block's shape, so the events
    // and their bracket stand 85 px further left in English and the stage keeps its centre.
    const SX = L(620, 540) + LEFT, SR = L(120, 88), EX = L(1300, 1215), BX = EX - 50, ys = [452, 548], E = SX - SR * .85;
    // Chinese has already said 试点 for the conditions' small trial, so its cue is the one that 这类保障也可以试点 says.
    const trialAt = cueFrom(s, "试点", "a trial only chooses", cue(s, "这类保障也可以试点", "a trial only chooses"));
    const onlyAt = cueFrom(s, "只用来选定", "only chooses", trialAt), howAt = cueFrom(s, "选定", "chooses", trialAt);
    shield(SX, CONTENT_CY, SR, {alpha: g4, fillColor: P.row});
    check(SX, CONTENT_CY + 3, SR * .52, {color: P.evidence, alpha: g4 * ramp(t, safeguards + .05, .4), width: 4.5});
    // Each edition names the safeguard by its key words, as the things it must not wait for stand beside it.
    if (en) growName(t, ["Necessary safeguards"], [safeguards], E, CONTENT_CY - SR - NAME_GAP,
      {valign: "bottom", alpha: g4, color: P.evidence});
    else {
      const term = ["必要的保障"], NW = 620;
      termRow(t, term, [safeguards], [], [], E, CONTENT_CY - SR - NAME_GAP - termRowLayout(term, [], NW).height, {width: NW, alpha: g4, color: P.evidence});
      const lit = span(t, cue(s, "这类保障", "") - .15, onlyAt - .1, .3);
      if (lit > 0) ring(SX, CONTENT_CY, SR + 16, {color: P.evidence, alpha: lit * restMark(P.evidence, .5) * g4, width: 2});
    }
    // The two later events, each on its own words.
    const names = en ? ["An incident", "A new practice's admission"] : ["出事", "新做法获批"];
    [incidentAt, approvalAt].forEach((at, k) => {
      const q = ramp(t, at - .15, .4) * g4, y = ys[k];
      if (k) seal(EX, y, 22, {color: P.authority, alpha: q, hollow: true});
      else { ring(EX, y, 22, {color: P.unknown, alpha: q, width: 2.5}); text("!", EX, y + 1, 26, {role: "mark", align: "center", color: P.unknown, alpha: q}); }
      nameText(names[k], EX + 30 + NAME_GAP, y, {align: "left", width: 380, alpha: g4 * named(t, at)});
    });
    const reach = mix(ys[0] + 30, ys[1] + 30, soon(t, pauseHold(approvalAt - .45, .4), .4));
    path([[BX + 16, ys[0] - 30], [BX, ys[0] - 30], [BX, reach], [BX + 16, reach]], {color: P.line, alpha: g4 * named(t, incidentAt), width: 2});
    // The waiting way is refused: it draws on from the safeguard toward the things it must not wait for and stops at a
    // bar halfway to the Chinese bracket's place, 1238 px. The English events stand 85 px further left, and their way
    // keeps that stop, so the safeguard's own build-up, with its way and bar, stands as near the centre as before.
    const go = soon(t, noWait - .05, .6), wayEnd = 1238, stopX = (SX + SR + 12 + wayEnd) / 2;
    link(SX + SR + 12, CONTENT_CY, wayEnd, CONTENT_CY, {color: P.unknown, alpha: g4 * ramp(t, noWait - .05, .3), upto: .5 * go, end: false, dash: [8, 8]});
    line(stopX, CONTENT_CY - 34, stopX, CONTENT_CY + 34, {color: P.unknown, alpha: g4 * ramp(t, noWait + .45, .3), width: 4});
    if (!en) nameText("不能等", stopX, CONTENT_CY + 34 + NAME_GAP, {valign: "top", alpha: g4 * named(t, noWait)});
    // The safeguard is put in place now, within the authority that already exists: it stands on that authority's line,
    // which is drawn and named below it on the words that name it.
    const withinAt = cue(s, "在现有权限里", "within existing authority");
    const groundY = CONTENT_CY + SR + 20, oblige = L("在现有权限里", "Within existing authority");
    line(E, groundY, SX + SR * .85, groundY, {color: P.authority, alpha: g4 * ramp(t, withinAt - .15, .4), width: 3});
    nameText(oblige, E, groundY + NAME_GAP, {align: "left", valign: "top", color: P.authority, alpha: g4 * named(t, withinAt)});
    // A trial only chooses and verifies how to meet the safeguard, not whether: ways fan out below it, and the trial
    // lights the one it chooses; it then verifies it: the chosen way's end turns to a check on the words that verify it.
    const TY = groundY + NAME_GAP + blockHeight(1) + 44, tq = ramp(t, trialAt - .15, .4) * g4, pick = ramp(t, howAt - .1, .4);
    const verifyAt = cueFrom(s, "核验怎么做", "verifies", trialAt), verified = ramp(t, verifyAt - .1, .4);
    dot(E + 6, TY, 6, {color: P.ink, alpha: tq});
    [-22, 0, 22].forEach((dy, k) => {
      const color = k === 1 ? blend(P.line, P.evidence, pick) : P.line;
      line(E + 12, TY, E + 64, TY + dy, {color, alpha: tq, width: k === 1 ? 2.5 + pick : 2});
      dot(E + 70, TY + dy, 5, {color, alpha: tq * (k === 1 ? 1 - verified : 1)});
    });
    check(E + 70, TY, 20, {color: P.evidence, alpha: tq * verified, draw: {t, at: verifyAt + .05}});
    const trialX = E + 70 + 12 + NAME_GAP, trialY = TY - labelSize(LABEL) / 2;
    if (en) growName(t, ["A trial", " only chooses and verifies how"], [trialAt, onlyAt], trialX, trialY, {width: 560, alpha: g4});
    else {
      // The trial is named on the word that first says it, and what it only does joins after it on its own clause, in
      // the qualifier's size: the two are said in different clauses, so they are two names.
      nameText("试点", trialX, TY, {align: "left", alpha: g4 * named(t, trialAt)});
      nameText("只用来选定、核验怎么做", trialX + measure("试点") + TERM_GAP, TY, {align: "left", size: NOTE, color: P.muted,
        alpha: g4 * named(t, onlyAt)});
      // The decision the trial never makes, whether to meet the safeguard at all, is refused on its words (不决定做不做),
      // on the line under the trial's name, from its edge, so the line keeps one size.
      const whetherAt = cueFrom(s, "决定做不做", "", trialAt);
      rejectedName("决定做不做", trialX, TY + labelSize(LABEL) * LEADING, {align: "left", alpha: g4 * named(t, whetherAt), mark: ramp(t, whetherAt + .05, .35)});
    }
  }
  // 5. Retire a rule that no longer earns its place. Any one of four reasons retires it: the reasons build into one
  // column, each on its words, and one bracket joins them to the rule; the bracket opens with the first reason and
  // lengthens just before each next one, its rows close enough that it stays more than half filled, and its link to the
  // rule joins it once it reaches the link's level. The rule stands from the stage's first words and is set aside as
  // retired on the words that retire it. Chinese names the rule first and retires it after its reasons; in English the
  // retirement is said first, so the rule stands retired before its reasons arrive.
  const g5 = base * stageIn(t, judged);
  if (g5 > 0) {
    const RX = 1300, RW = 150, RH = 190, LX = 560, out = ramp(t, retire + .05, .4);
    const tops = stackTops(reasonNames.map(() => labelSize(LABEL)), CONTENT_CY, 26), ys = tops.map(top => top + labelSize(LABEL) / 2);
    const BX = LX + Math.max(...reasonNames.map(v => measure(v))) + 40;
    reasons.forEach((at, i) => {
      const q = ramp(t, at - .15, .4) * g5, lit = speaking(t, reasons, i);
      ring(LX - 34, ys[i], 14 + 2 * lit, {color: P.unknown, alpha: q, width: 2.5});
      dot(LX - 34, ys[i], 5, {color: P.unknown, alpha: q});
      nameText(reasonNames[i], LX, ys[i], {align: "left", alpha: g5 * listIn(t, reasons, i), set: "reasons"});
    });
    const held = reasons.reduce((b, at, i) => mix(b, ys[i] + 24, soon(t, pauseHold(at - .45, .4), .4)), ys[0] + 24);
    path([[BX - 16, ys[0] - 24], [BX, ys[0] - 24], [BX, held], [BX - 16, held]], {color: P.line, alpha: g5 * ramp(t, reasons[0] - .15, .4), width: 2});
    // The rule: a page crossed through and dimmed when retired. It stands with its name from the stage's first
    // words, as the subject the reasons describe. It is drawn as 23's pages are, its ruled rows in one stroke, so the
    // rows read as the page's text rather than as a list of rows whose last the retirement's name below would seem to
    // name.
    const ruleOn = named(t, judged);
    link(BX, CONTENT_CY, RX - RW / 2 - 14, CONTENT_CY, {alpha: g5 * clamp((held - CONTENT_CY) / 80), end: false});
    s23Page(RX - RW / 2, CONTENT_CY - RH / 2, RW, RH, {alpha: g5 * ruleOn * mix(1, .7, out), rows: 4, stroke: blend(P.ink, P.muted, out)});
    nameText(L("规则", "A rule"), RX, CONTENT_CY - RH / 2 - NAME_GAP, {valign: "bottom", alpha: g5 * ruleOn});
    cross(RX + RW / 2 + 44, CONTENT_CY, 36, {alpha: g5 * out, width: 3.5});
    nameText(L("撤掉", "Retire"), RX, CONTENT_CY + RH / 2 + NAME_GAP, {valign: "top", color: P.muted, alpha: g5 * named(t, retire)});
  }
};

/* ---------------- 27 evolve: detect drift before failure ---------------- */
scenes["27"] = function (s, t) {
  // 27.1 opens on the small changes and names the defect they may signal: the line stands on the first words, the
  // defect at its end inks in and is named on its own words.
  const changes = cue(s, "有些小变化", "small changes"), defects = cue(s, "工作体系有缺陷", "a system defect");
  // The small signals in spoken order, seven in both editions.
  const signals = en ? cues(s, [["", "definitions drifting"], ["", "questions recurring"], ["", "people stepping"], ["", "evidence expiring"],
    ["", "ownership blurring"], ["", "intermittent failures"], ["", "slight delays"]])
    : cues(s, [["定义慢慢变了", ""], ["同样的问题", ""], ["临时靠人救火", ""], ["证据过期", ""], ["责任说不清", ""], ["偶尔出错", ""], ["略有延迟", ""]]);
  const [anomaly, trend, pattern, impact, direction] = cues(s, [["一次异常", "one anomaly"], ["看成趋势", "not a trend"], ["先看苗头的规律", "check the pattern"],
    ["影响", "impact"], ["走向", "direction"]]);
  const [metric, weekly, signal] = cues(s, [["同一个指标", "the same metric"], ["每周都有人问", "asks every week"], ["这就是一个苗头", "that is a signal"]]);
  const conds = cues(s, [["同类问题反复出现", "the same kind of problem recurs"], ["重要判断", "an important judgment rests"], ["交给智能体反复做", "agents will repeat"]]);
  const [material, leave] = cues(s, [["实质风险", "brings material risk"], ["留下能复用的预防措施", "leave reusable prevention"]]);
  const forms = cues(s, [["测试", "a test"], ["监控", "monitor"], ["清单", "checklist"], ["决策记录", "decision record"], ["更清楚的分工", "ownership and handoffs"]]);
  const [improve, fresh, lightest] = cues(s, [["先改已有的", "improve what exists"], ["再考虑新建", "creating something new"], ["选够用的最轻的那种", "choose the lightest form"]]);
  const watch = cue(s, "留意这几种", "watch for these");
  const base = ramp(t, opening(s), .7), example = Math.min(metric, weekly);
  // The weekly question about one metric is an illustrative case. The chip arrives with it and leaves in its stage's own
  // cut on "watch for these", so the general conditions that follow never carry it.
  illustrative(ramp(t, pauseHold(example - .2, .4), .4) * stageOut(t, watch) * base);
  // One metric line carries the scene. It runs from X0 to X1 along its base Y0, read against a short axis; each stage
  // reshapes it (small bumps, one spike, a drift) and names what it shows.
  const X0 = 200, X1 = 1680, Y0 = 520, B = 556;
  // A problem that keeps coming back: a ring with an exclamation mark drawn in strokes.
  const problem = (x, y, r, alpha) => {
    dot(x, y, r - 1, {color: P.ground, alpha});
    ring(x, y, r, {color: P.unknown, alpha, width: 2.5});
    line(x, y - r * .5, x, y + r * .12, {color: P.unknown, alpha, width: 3});
    dot(x, y + r * .45, 2.2, {color: P.unknown, alpha});
  };
  const s27Line = (yAt, alpha, {upto = 1, draw = null, x0 = X0, x1 = X1, y0 = Y0, axis = alpha} = {}) => {
    const pts = [];
    for (let x = x0; x <= x1; x += 6) pts.push([x, yAt(x)]);
    line(x0 - 12, y0 + 24, x0 - 12, y0 - 176, {color: P.muted, alpha: axis, width: 2});
    for (let k = 0; k <= 2; k++) line(x0 - 12, y0 - k * 80, x0, y0 - k * 80, {color: P.muted, alpha: axis, width: 2});
    path(pts, {color: P.ink, alpha, width: 3, upto, draw});
    return pts;
  };
  // 1. Many defects begin as small signals: the line runs on toward a defect at its end, and each small signal bumps the
  // line at its place on its own words, the names building into one rail below.
  const one = base * stageOut(t, anomaly);
  if (one > 0) {
    const names = en ? [["Definitions drifting"], ["Questions recurring"], ["Stepping in to rescue"], ["Evidence expiring"], ["Ownership blurring"],
      ["Intermittent failures"], ["Slight delays"]] : [["定义慢慢变了"], ["同样的问题反复被问"], ["临时靠人救火"], ["证据过期"], ["责任说不清"], ["偶尔出错"], ["略有延迟"]];
    // The seven names stand whole, each on one line, on two baselines at one even pitch, every other name a row lower
    // on a short stem from the line, in both editions.
    const wrap = 280;
    const xs = names.map((_, i) => L(268 + i * 220, 270 + i * 205)), lift = signals.map(at => soon(t, at - .1, .5));
    const yAt = x => Y0 - xs.reduce((a, sx, i) => a + 22 * lift[i] * Math.exp(-(((x - sx) / 22) ** 2)), 0);
    // The line stands whole from the first words, the small changes, with its axis.
    const shape = ramp(t, changes - .1, .6) * one;
    s27Line(yAt, shape, {axis: shape});
    // The defect stands at the end of the line from the words that name it.
    cross(X1, Y0, 24, {alpha: ramp(t, defects - .15, .4) * one, width: 3});
    // The defect is named over the line's end, and the small changes the line carries over its start on the first words,
    // so the line runs from them to the defect they may signal; both names stand clear of the halo of a signal's bump.
    nameText(L("体系缺陷", "System defect"), X1, Y0 - 28 - NAME_GAP, {valign: "bottom", alpha: one * named(t, defects)});
    nameText(L("小变化", "Small changes"), X0 + 12, Y0 - 28 - NAME_GAP, {align: "left", valign: "bottom", alpha: one * named(t, changes)});
    xs.forEach((x, i) => {
      const q = ramp(t, signals[i] - .15, .3), lit = speaking(t, signals, i);
      dot(x, yAt(x), 7, {color: P.unknown, alpha: q * one});
      if (lit > 0) ring(x, yAt(x), 15, {color: P.unknown, alpha: lit * restMark(P.unknown, .6) * one, width: 2});
    });
    xs.forEach((x, i) => { if (i % 2) line(x, Y0 + 12, x, Y0 + NAME_GAP + 18 + RAIL_ROW - 6, {alpha: one * ramp(t, signals[i] - .15, .3), width: 2}); });
    railNames(names, xs, Y0, {wrap, gap: i => NAME_GAP + 18 + (i % 2 ? RAIL_ROW : 0), alpha: i => one * listIn(t, signals, i), set: "signals"});
  }
  // 2. One anomaly is not a trend: the line spikes once. Carrying the spike's level on as a trend is refused at a bar;
  // the three checks build into a rail below the line, each under its mark: the pattern of the points before the
  // spike, the impact the spike measures, and the direction the line takes after it.
  const two = base * stageIn(t, anomaly) * stageOut(t, example);
  if (two > 0) {
    const PX = 1000, H = 170, peak = Y0 - H, up = glide(t, anomaly + .05, H), checks = [pattern, impact, direction];
    const yAt = x => Y0 - H * up * Math.exp(-(((x - PX) / 18) ** 2));
    s27Line(yAt, two);
    nameText(L("一次异常", "One anomaly"), PX, peak - 12 - NAME_GAP, {valign: "bottom", alpha: two * named(t, anomaly)});
    // The spike's level carried on to the right would read it as a trend: the way stops at a bar.
    const refuse = ramp(t, trend + .45, .3) * two, TX = 1420;
    link(PX + 18, peak, TX - 10, peak, {color: P.unknown, alpha: two * ramp(t, trend + .05, .3), upto: drawShare(t, trend + .05, Math.abs(TX - 10 - (PX + 18)), .6), end: false, dash: [8, 8]});
    line(TX, peak - 24, TX, peak + 24, {color: P.unknown, alpha: refuse, width: 4});
    rejectedName(L("看成趋势", "A trend"), TX + 24, peak, {align: "left", alpha: two * named(t, trend), mark: refuse / Math.max(two, 1e-6)});
    // The checks: the pattern rings the points before the spike, the impact measures its height, the direction follows
    // the line after it.
    const lit = i => speaking(t, checks, i), seen = i => ramp(t, checks[i] - .1, .4) * two;
    [360, 480, 600, 720, 840].forEach((x, k) => ring(x, Y0, 9 + 3 * lit(0), {color: P.evidence, alpha: seen(0) * ramp(t, pattern - .1 + k * .06, .3), width: 2.5}));
    const mx = PX - 34, im = seen(1);
    line(mx, Y0, mx, peak, {color: P.authority, alpha: im, width: 2.5 + lit(1)});
    line(mx - 10, Y0, mx + 10, Y0, {color: P.authority, alpha: im, width: 2.5});
    line(mx - 10, peak, mx + 10, peak, {color: P.authority, alpha: im, width: 2.5});
    path([[1150, Y0], [1660, Y0]], {color: P.evidence, alpha: seen(2), width: 5 + lit(2), draw: {t, at: direction - .1}});
    railNames(en ? ["Pattern", "Impact", "Direction"] : ["规律", "影响", "走向"], [600, PX, 1405], Y0,
      {alpha: i => two * listIn(t, checks, i), set: "checks"});
  }
  // 3. For example, the same metric: one week after another a question hangs below the line as someone asks again,
  // each bumping the line a little. When the words call it a signal, the recurring questions are enclosed as one.
  const three = base * stageIn(t, example) * stageOut(t, watch);
  if (three > 0) {
    const xs = [460, 640, 820, 1000, 1180, 1360], QY = Y0 + 160, asked = xs.map((x, k) => ramp(t, weekly - .1 + k * .12, .35));
    const yAt = x => Y0 - xs.reduce((a, sx, k) => a + 14 * asked[k] * Math.exp(-(((x - sx) / 20) ** 2)), 0);
    s27Line(yAt, three);
    nameText(L("同一个指标", "The same metric"), X0, Y0 - NAME_GAP, {align: "left", valign: "bottom", color: P.evidence, alpha: three * named(t, metric)});
    // Each week's question arrives in turn on the words that say someone asks every week: its drop draws on from the
    // line and its ring draws round from the drop's end. All the drops are one stroke and all the rings another, so the
    // weekly questions read as one question asked again and again, not as six marks each waiting for a name of its own.
    stroke(() => xs.forEach((x, k) => { if (asked[k] > 0) { ctx.moveTo(x, yAt(x) + 8); ctx.lineTo(x, mix(yAt(x) + 8, QY - 28, asked[k])); } }),
      {color: P.line, alpha: three * .8, width: 2});
    stroke(() => xs.forEach((x, k) => { if (asked[k] > 0) { ctx.moveTo(x, QY - 22); ctx.ellipse(x, QY, 22, 22, -Math.PI / 2, 0, Math.PI * 2 * asked[k]); } }),
      {color: P.authority, alpha: three, width: 2.5});
    xs.forEach((x, k) => text("?", x, QY + 1, 26, {role: "mark", align: "center", color: P.authority, alpha: asked[k] * three}));
    nameText(L("每周都有人问", "Asked every week"), 910, QY + 40 + NAME_GAP,
      {valign: "top", width: 640, color: P.authority, alpha: three * named(t, weekly)});
    // The signal: the recurring questions, enclosed as one.
    const sg = ramp(t, signal + .05, .4) * three;
    box(xs[0] - 40, QY - 40, xs.at(-1) - xs[0] + 80, 80, {stroke: P.unknown, alpha: sg, radius: 40, width: 2.5});
    nameText(L("一个苗头", "A signal"), xs.at(-1) + 40 + NAME_GAP, QY, {align: "left", alpha: three * named(t, signal)});
  }
  // 4. Watch for these conditions. Each is a row across the same work cycles, so each signal shows as what happens over
  // time: the same problem comes back cycle after cycle and reaches more people, a project and more cycles; important
  // judgments all hang from one person, with nothing written down; something done in every cycle is forgotten in one,
  // and a material loss follows; and the same work goes to an Agent again and again. The conditions are a watch list: a
  // card headed by the stage's name from its words; each condition's row arrives on the condition's first words, and
  // the card and the work cycles across it lengthen to take each row as it arrives. Each event draws on its own words,
  // and each condition's name arrives beside the row where it happens. The card stands centred as it grows: it stands
  // half a row lower for each row still to come and rises by that half row as the card makes room for the next.
  const these = cue(s, "这些情况", "when any of these"), four = base * stageIn(t, watch) * stageOut(t, these);
  if (four > 0) {
    // The conditions' names stand outside the card, a name gap and more beyond its right edge (END + 30).
    const R = [351, 501, 651, 801], C = [580, 780, 980, 1180], START = 400, END = 1290, NX = END + 30 + NAME_GAP + 18, KX = START - 70, KY = R[0] - 136;
    const on = (at, lead = .15) => ramp(t, at - lead, .4) * four;
    const rowAts = [conds[0], conds[1], cue(s, "有些事", "forgetting something"), cue(s, "交给智能体", "agents will repeat")];
    // The judgments' row stands on the word that names the people it rests on, 少数人 in Chinese and "people's" in
    // English, whose "a few" comes too early, so its name, the unwritten knowledge, follows within half a second; the
    // card makes room for it as the condition begins. The forgetting's row
    // stands with its name on the words that say what forgetting can cause, its loss on its own words.
    const fewAt = cueFrom(s, "少数人", "people's", conds[1]), causeAt = cue(s, "可能造成", "could cause"), lineAts = [conds[0], fewAt, causeAt, rowAts[3]];
    const names = en ? ["Same kind of problem recurs", "Tacit knowledge", "Material loss", "Agents will repeat"] : ["同类问题反复出现", "没写下来的经验", "实质损失", "交给智能体反复做"];
    // The English names are long, so in English the card and its names stand centred together, from the card's left
    // edge to the end of the longest name.
    const lean = en ? 960 - (KX + NX + Math.max(...names.map(v => measure(v)))) / 2 : 0;
    ctx.save(); ctx.translate(lean, building(t, rowAts, (R[1] - R[0]) / 2, .5));
    // The card lengthens over 0.7 s from half a second before each row's words, so its edge and the work cycles' ends,
    // which lengthen with it, move at under half the drawing pace, and it has passed the row before the row's line comes.
    const extent = rowAts.reduce((y, at, k) => mix(y, R[k] + [100, 100, 64, 64][k], ease((t - at + .5) / .7)), KY + 72);
    documentIcon(KX, KY, END + 30 - KX, extent - KY, {alpha: four, rows: 0});
    nameText(L("留意这几种", "Conditions to watch"), KX + 30, KY + 36, {align: "left", alpha: four * named(t, watch)});
    R.forEach((y, k) => line(START + 30, y, END, y, {color: P.line, alpha: on(lineAts[k]), width: 2}));
    // The work cycles, from the words that name them, across the rows that stand: the rows' events fall in different
    // cycles.
    const cycle = cue(s, "周期", "work cycle");
    [480, 680, 880, 1080, 1280].forEach((x, k) => line(x, R[0] - 44, x, extent - 28, {color: P.line, alpha: ramp(t, cycle + .05 + k * .06, .3) * four * .7, width: 2}));
    // The same problem comes back in each cycle, and reaches more than one person and a project.
    const recur = cue(s, "反复出现", "recurs"), backAt = [conds[0], recur + .05, recur + .3, recur + .55];
    C.forEach((x, k) => problem(x, R[0], 20, on(backAt[k], k ? -.05 : .15)));
    const people = cue(s, "不止一个人", "more than one person"), project = cue(s, "项目", "project");
    [C[1], C[2]].forEach((x, k) => {
      const q = on(people + .2 * k, -.05);
      line(x, R[0] + 20, x, R[0] + 44, {color: P.muted, alpha: q, width: 2});
      person(x, R[0] + 62, {size: .55, color: P.muted, alpha: q});
    });
    const pq = on(project);
    line(C[3], R[0] + 20, C[3], R[0] + 40, {color: P.muted, alpha: pq, width: 2});
    box(C[3] - 18, R[0] + 40, 36, 28, {stroke: P.muted, alpha: pq, radius: 4, width: 2});
    line(C[3] - 18, R[0] + 48, C[3] + 18, R[0] + 48, {color: P.muted, alpha: pq, width: 2});
    // Important judgments in three cycles all hang from one person, and the experience they rest on is written nowhere:
    // its page is a dashed outline beside the person.
    const unwritten = cue(s, "没写下来的经验", "tacit knowledge"), held = on(fewAt);
    person(START, R[1] + 12, {alpha: held, solid: false});
    dot(START, R[1] + 12 - 15 * 1.15, 15, {color: P.ink, alpha: held});
    line(START + 30, R[1], C[2], R[1], {color: P.authority, alpha: on(fewAt, .1), width: 2.5});
    [0, 1, 2].forEach(k => diamond(C[k], R[1], 17, {color: P.authority, alpha: on(fewAt + .2 * k, k ? -.05 : .15), width: 2.5}));
    box(START - 17, R[1] + 40, 34, 44, {stroke: P.muted, alpha: on(unwritten), radius: 4, width: 2, dash: [5, 4]});
    // Something done in every cycle, a ticked step, is forgotten in the third, an empty dashed outline, and a material
    // loss spreads from the fourth on its words, as 22.2's widening harm does, in voice time.
    [0, 1].forEach(k => {
      const q = on(causeAt + .2 * k, k ? -.05 : .15);
      box(C[k] - 15, R[2] - 15, 30, 30, {fill: P.row, stroke: P.ink, alpha: q, radius: 5, width: 2});
      check(C[k], R[2] + 1, 16, {alpha: q, width: 2.5});
    });
    box(C[2] - 15, R[2] - 15, 30, 30, {stroke: P.muted, alpha: on(causeAt + .4, -.05), radius: 5, width: 2, dash: [5, 4]});
    const lossAt = cue(s, "实质损失", "material loss"), lost = on(lossAt), spread = standard((voiceTime(t) - voiceTime(lossAt + .05)) / .8);
    dot(C[3], R[2], 5, {color: P.unknown, alpha: lost});
    [13, 22].forEach((r, i) => ring(C[3], R[2], mix(5, r, spread), {color: P.unknown, alpha: lost * restMark(P.unknown, 1 - i * .35), width: 2}));
    // The same work goes to an Agent again and again: one task in every cycle, in turn from the words that hand it over,
    // so the row is whole before the thought ends.
    const agents = cue(s, "交给智能体", "agents will repeat");
    agent(START, R[3], {alpha: on(agents), size: .9});
    line(START + 30, R[3], END, R[3], {color: P.evidence, alpha: on(agents, .1) * .8, width: 2});
    C.forEach((x, k) => {
      const q = ramp(t, agents + .2 + .12 * k, .3) * four;
      box(x - 15, R[3] - 15, 30, 30, {fill: P.row, stroke: P.evidence, alpha: q, radius: 5, width: 2});
      dot(x, R[3], 4.5, {color: P.evidence, alpha: q});
    });
    // The names of the conditions build as one list in the column beyond the card, at the rows' pitch, each beside the
    // row where its condition happens; the forgetting's name is the loss it can cause, by its key words.
    const nameAts = [conds[0], unwritten, causeAt, agents];
    R.forEach((y, i) => nameText(names[i], NX, y, {align: "left", width: 420,
      alpha: four * listIn(t, nameAts, i), set: "conditions"}));
    ctx.restore();
  }
  // 5. These conditions, once they bring material risk: the drifting line rises from them toward a threshold well before
  // the failure at its end. A reusable safeguard is left where it crosses, and from there the line runs level again,
  // below the threshold, so the failure never comes. The stage opens on the words that name these conditions, with
  // the four conditions standing at the line's start in small, under their name.
  const kinds = cue(s, "预防措施可以是", "prevention can be"), five = base * stageIn(t, these) * stageOut(t, kinds);
  if (five > 0) {
    // The drift and the conditions at its start stand 59 px right of the scene's line, so the stage, from the axis to
    // the failure at the line's end, stands centred; it cuts in there, so nothing moves.
    ctx.save(); ctx.translate(59, 0);
    const SX = 1000, FX = 1660, held = soon(t, leave + .05, 1.2), before = cue(s, "还没出过事", "before anything fails");
    const bring = cue(s, "只要带来", "brings material risk"), named5 = ramp(t, these - .15, .4) * five;
    // The conditions, in small and in spoken order: the returning problem, a judgment, the loss forgetting causes and an
    // Agent.
    const ey = B - 46;
    problem(238, ey, 14, named5);
    diamond(284, ey, 13, {color: P.authority, alpha: named5, width: 2.5});
    dot(330, ey, 3, {color: P.unknown, alpha: named5});
    [8, 13].forEach((r, i) => ring(330, ey, r, {color: P.unknown, alpha: named5 * restMark(P.unknown, 1 - i * .35), width: 2}));
    agent(376, ey, {alpha: named5, size: .55});
    nameText(L("这些情况", "Any of these"), 307, B + 26, {valign: "top", alpha: named5});
    // The drift climbs steadily toward the failure at the line's end and crosses the threshold of material risk at SX;
    // after the safeguard the line eases back under the threshold and runs level.
    const climb = x => 260 * ease(clamp((x - 320) / (FX - 360))), TY = B - climb(SX);
    const level = x => climb(SX) - 40 * ease(clamp((x - SX) / 240));
    const yAt = x => B - (x <= SX ? climb(x) : mix(climb(x), level(x), held));
    s27Line(yAt, five, {x1: FX - 40, y0: B, draw: {t, at: bring + .05}});
    // Once the safeguard holds the line, the course the drift was on stays as a dashed trace up to the failure.
    if (held > 0) path(Array.from({length: 51}, (_, k) => { const x = mix(SX, FX - 40, k / 50); return [x, B - climb(x)]; }),
      {color: P.line, alpha: five * held, width: 2, dash: [6, 8]});
    // The threshold of material risk, and the failure still ahead at the line's end, drawn on the words that say nothing
    // has failed yet. The failure has not happened, so it stands as a dashed outline at the end of the dashed course,
    // never a cross, which would read as refusing the case.
    line(X0, TY, FX - 40, TY, {color: P.unknown, alpha: five * restMark(P.unknown, .8) * named(t, material), width: 2});
    // The name stands 8 px above a name's gap, so its ink keeps 8 px clear of the axis's top tick, which ends at its edge.
    nameText(L("实质风险", "Material risk"), X0, TY - NAME_GAP - 8, {align: "left", valign: "bottom", alpha: five * named(t, material)});
    const FY = B - climb(FX - 40);
    ring(FX, FY, 15, {color: P.unknown, alpha: five * named(t, before), width: 2.5, dash: [5, 5]});
    nameText(L("还没出过事", "Before anything fails"), FX + 12, FY - 12 - NAME_GAP, {align: "right", valign: "bottom", color: P.muted,
      alpha: five * named(t, before)});
    // The safeguard stands where the line crosses the threshold, from the words that leave it behind.
    const sg = ramp(t, leave - .1, .4) * five;
    shield(SX, B + 110, 40, {color: P.evidence, alpha: sg, fillColor: P.row});
    check(SX, B + 112, 28, {color: P.evidence, alpha: sg, width: 3});
    link(SX, B + 62, SX, yAt(SX) + 12, {color: P.evidence, alpha: sg, draw: {t, at: leave + .05}});
    nameText(L("能复用的预防措施", "Reusable prevention"), SX, B + 150 + NAME_GAP, {valign: "top", color: P.evidence, alpha: five * named(t, leave)});
    ctx.restore();
  }
  // 6. A safeguard can take five forms: they hang from it on one trunk and one crossing row, which stand from the
  // stage's first words, the words that say what prevention can be; each form draws its drop and appears on its own
  // words, the names on one baseline below. The drops stand at one pitch, so the middle form hangs on the trunk.
  // The forms hold until something new is named, and hand the picture to the order of choice in one cut.
  const six = base * stageIn(t, kinds) * stageOut(t, fresh);
  if (six > 0) {
    // The English last form's name is the widest, so while the forms build the stage stands 39 px right for each of the
    // last two still to come (see building), and stands centred as each comes.
    ctx.save(); ctx.translate(en ? building(t, forms.slice(2), 39) : 0, 0);
    const sx = 960, sy = 290, bus = 420, iy = 530;
    const names = en ? ["Test", "Monitor", "Checklist", "Decision record", "Ownership and handoffs"] : ["测试", "监控", "清单", "决策记录", "分工"];
    // The English last form stands whole on one line, so its stations are spaced from their names' widths.
    const formsWrap = L(RAIL_WRAP, 340), xs = railStations(names, L(440, 320), 1480, {wrap: formsWrap});
    shield(sx, sy, 40, {color: P.evidence, alpha: six, fillColor: P.row});
    check(sx, sy + 2, 28, {color: P.evidence, alpha: six, width: 3});
    // English names the safeguard as the stage before did, since its sentence calls it only "it".
    nameText(L("预防措施", "Reusable prevention"), sx + 40 + NAME_GAP, sy, {align: "left", color: P.evidence, alpha: six * named(t, kinds)});
    link(sx, sy + 44, sx, bus, {alpha: six, end: false});
    line(xs[0], bus, xs.at(-1), bus, {color: P.line, alpha: six, width: 2});
    forms.forEach((at, i) => {
      const x = xs[i], q = ramp(t, at - .15, .35) * six, lit = speaking(t, forms, i);
      // Each form appears on its words, and its drop lights while it is said.
      link(x, bus, x, iy - 50, {color: blend(P.line, P.evidence, lit), alpha: six, draw: {t, at: at - .15}, end: false});
      if (i === 0) {
        box(x - 23, iy - 23, 46, 46, {fill: P.row, stroke: P.evidence, alpha: q, radius: 6, width: 2.5});
        check(x, iy + 2, 26, {color: P.evidence, alpha: q, width: 3.5});
      } else if (i === 1) {
        box(x - 34, iy - 26, 68, 44, {stroke: P.ink, alpha: q, radius: 5});
        path([[x - 24, iy + 4], [x - 10, iy - 8], [x + 2, iy + 2], [x + 22, iy - 14]], {color: P.evidence, alpha: q, width: 2});
        line(x, iy + 18, x, iy + 30, {color: P.ink, alpha: q, width: 2}); line(x - 14, iy + 30, x + 14, iy + 30, {color: P.ink, alpha: q, width: 2});
      } else if (i === 2) {
        documentIcon(x - 22, iy - 30, 44, 58, {alpha: q, rows: 3});
        check(x - 30, iy - 10, 12, {color: P.evidence, alpha: q, width: 2.5}); check(x - 30, iy + 10, 12, {color: P.evidence, alpha: q, width: 2.5});
      } else if (i === 3) {
        documentIcon(x - 22, iy - 30, 44, 58, {alpha: q, rows: 2});
        diamond(x, iy + 12, 9, {color: P.authority, alpha: q, width: 2});
      } else {
        person(x - 22, iy + 2, {alpha: q, size: .55, color: P.authority});
        person(x + 22, iy + 2, {alpha: q, size: .55, color: P.ink});
        dot(x, iy - 2, 5, {color: P.evidence, alpha: q});
      }
    });
    railNames(names, xs, iy + 42, {gap: NAME_GAP, wrap: formsWrap, alpha: i => six * listIn(t, forms, i), set: "forms"});
    // What exists is improved before anything new: the row that links the forms lights on those words, and the choice is
    // named below them.
    line(xs[0], bus, xs.at(-1), bus, {color: P.evidence, alpha: ramp(t, improve - .15, .4) * six, width: 2.5});
    nameText(L("先改已有的", "Improve what exists"), 960, iy + 42 + NAME_GAP + blockHeight(2) + 34,
      {valign: "top", width: 420, color: P.evidence, alpha: six * named(t, improve)});
    ctx.restore();
  }
  // 7. The order of choice runs along one rail: the safeguard that exists, improved, stands first; something
  // new, not yet made, stands after it as a dashed outline on the words that name it, when the way to it draws on.
  // Choosing the lightest form that works rings the first.
  const seven = base * stageIn(t, fresh);
  if (seven > 0) {
    const xs = [560, 1360], y = 510, R = 80, order = [improve, fresh];
    shield(xs[0], y, R, {color: P.evidence, alpha: seven, fillColor: P.row});
    check(xs[0], y + 3, 50, {color: P.evidence, alpha: seven, width: 4});
    const nw = ramp(t, fresh - .15, .4) * seven;
    box(xs[1] - R, y - R, 2 * R, 2 * R, {stroke: P.muted, alpha: .9 * nw, radius: 16, dash: [6, 6]});
    line(xs[1], y - 26, xs[1], y + 26, {color: P.muted, alpha: nw, width: 3});
    line(xs[1] - 26, y, xs[1] + 26, y, {color: P.muted, alpha: nw, width: 3});
    link(xs[0] + R + 14, y, xs[1] - R - 14, y, {alpha: nw, draw: {t, at: fresh - .1}});
    railNames(en ? ["Improve what exists", "Creating something new"] : ["先改已有的", "再考虑新建"], xs, y + R + 16,
      {gap: NAME_GAP, alpha: i => seven * listIn(t, order, i), color: i => i ? P.muted : P.ink, set: "order", wrap: 420});
    ring(xs[0], y, R + 16, {color: P.evidence, alpha: ramp(t, lightest + .05, .4) * seven, width: 2.5});
    nameText(L("够用的最轻的那种", "The lightest form that works"), xs[0], y - R - 16 - NAME_GAP, {valign: "bottom", color: P.evidence,
      alpha: seven * named(t, lightest)});
  }
};

/* ---------------- 28 evolve: growing through real work ---------------- */
scenes["28"] = function (s, t) {
  const [grows, boundary] = cues(s, [["能力在真实的工作里成长", "capability grows"], ["边界和成功标准", "the boundary and success"]]);
  const [coaching, notJudge, weak, noDirection] = cues(s, [["辅导是检验成员的推理", "coaching tests"], ["不是替他们判断", "without making the judgment"],
    ["逻辑弱", "weak logic"], ["给不出方向", "gives no direction"]]);
  const fb = cues(s, [["说法", "proposition"], ["证据", "evidence"], ["行为", "behavior"], ["后果", "consequence"]]);
  // The stage of risks opens on its first words: "some risks" in Chinese, the qualities that cannot outweigh them in
  // English.
  const someRisks = cue(s, "有些风险", "fluency effort");
  const weights = cues(s, [["再流畅", "fluency"], ["再努力", "effort"], ["智能体再高效", "agent efficiency"]]);
  const risks = cues(s, [["没核实的", "fabricated"], ["没核验当前版本", "completion claimed"], ["智能体的输出", "agent output"]]);
  // Chinese opens the scoring with "if work is scored"; the score itself is said next, as in English.
  const [score, deliveryRisk, noLabel, metric, decision, gamed, anomaly, cases, mechanisms] = cues(s, [["如果给工作打分", "if work is scored"], ["交付风险", "delivery risk"],
    ["不能给人贴标签", "never label a person"], ["看指标", "first identify what decision"], ["支持哪个决定", "first identify what decision"], ["钻空子", "could be gamed"],
    ["出了异常", "investigate anomalies"], ["案例", "cases"], ["机制", "and mechanisms"]]);
  // The escalation of high-risk signals cuts in on the words that open it: in Chinese its thought's first words, in
  // English the sentence that closes the scoring's thought.
  const signalCut = cue(s, "高风险的苗头", "escalate high-risk");
  const base = ramp(t, opening(s), .7);
  // 1. Capability grows through real work. One task is a rail the member walks, named as the real work on its words,
  // stopping where the guidelines say to look: at the start, at important decisions and after delivery. The rail then
  // steps up to the next task, and the member climbs the step on the agreed improvement. Each station is named below the
  // rail by its moment and its action, each part on its own words; the stations build into one list that stays while
  // the rail stands.
  const g1 = base * stageOut(t, coaching);
  if (g1 > 0) {
    // The English last action stands whole on one line and is the widest name, so in English the rail starts 20 px
    // further left, the step rises 195 px further right and the next task's stop stands 160 px further on, its name
    // clear of the member climbing the step by the headless canvas's wider estimate too, which keeps every pair of
    // stations well apart.
    const moments = cues(s, [["开头", "at the start"], ["重要决定时", "at important decisions"], ["交付后", "after delivery"]]);
    const acts = cues(s, [["确认边界", "confirm the boundary"], ["查推理", "examine the reasoning"], ["挑一个最关键", "agree on one"], ["约好下次", "for the next task"]]);
    // The English first action wraps before its "and", so no line ends on the word that opens a phrase; the middle and
    // the last stand whole on one line, as no break keeps the last's phrase in an even block.
    const names = en ? [["At the start", "Confirm boundary and success criteria"], ["At important decisions", ["Examine the reasoning"]],
      ["After delivery", ["Agree on one observable improvement"]], [null, "For the next task"]]
      : [["开头", "确认边界和成功标准"], ["重要决定时", "查推理"], ["交付后", "挑一个最关键的差距"], [null, "看得见的改进"]];
    const half = ([moment, act]) => Math.max(moment ? measure(moment, NOTE) / 2 : 0, ...wrapName(act, 360).map(line => measure(line) / 2));
    // The English lane widens by as much on each side as keeps the middle action, whole on one line, 34 px or more from
    // both its neighbours' names: the stops' pitch grows by that much.
    const delta = en ? Math.max(0, half(names[1]) + Math.max(half(names[0]), half(names[2])) + 34
      - (1495 - 70 - (200 - 20) - 48 - half(names[0]) - half(names[2])) / 2) : 0;
    const Y = 570, UP = 370, X0 = L(220, 200 - delta), RISE = L(1300, 1495 + delta), X1 = 1700, rows = [Y, Y, Y, UP];
    // The task's three stops stand at one pitch about the middle of its lane (BX0 to BX1), as far apart as keeps every
    // stop's names inside the lane with room to spare; the next task's stop stands on the step beyond. The English
    // names, whose last is far the widest, stand centred as a row in the lane rather than on its middle stop.
    const BX0 = X0 - 20, BX1 = RISE - 70, BC = (BX0 + BX1) / 2;
    const pitch = en ? (BX1 - BX0 - 48 - half(names[0]) - half(names[2])) / 2 : Math.min(BC - BX0 - half(names[0]), BX1 - BC - half(names[2])) - 24;
    const MC = en ? (BX0 + 24 + half(names[0]) + BX1 - 24 - half(names[2])) / 2 : BC, xs = [MC - pitch, MC, MC + pitch, L(1500, 1660)];
    const starts = acts.map((at, i) => Math.min(at, moments[i] ?? Infinity));
    // The rail, the task's whole course, stands from the first words, whole, so the stage stands balanced while its
    // stations build; each station marks on it on its own words.
    link(X0, Y, X1, UP, {route: "hvh", mid: RISE, color: P.muted, width: 3, alpha: g1 * ramp(t, grows - .1, .6), end: false});
    // The task's boundary: a quiet lane around the walk, as tall as the walking member, set on the words that confirm
    // it, under the name of the work.
    box(BX0, Y - 80, BX1 - BX0, 96, {stroke: P.line, alpha: g1 * named(t, boundary), radius: 12});
    nameText(L("真实的工作", "Real work"), X0 - 20, Y - 80 - NAME_GAP, {align: "left", valign: "bottom",
      alpha: g1 * named(t, cue(s, "真实的工作", "grows through real work"))});
    // The gap to close, the agreed improvement, is the step itself, lit on its words.
    link(RISE, Y, RISE, UP, {color: P.evidence, width: 4, alpha: g1 * named(t, acts[2]), draw: {t, at: acts[2] + .05}, end: false});
    xs.forEach((x, i) => {
      const y = rows[i], lit = speaking(t, starts, i), on = named(t, starts[i]);
      const color = [P.evidence, P.authority, P.ink, P.evidence][i];
      dot(x, y, 9, {color, alpha: g1 * on});
      if (lit > 0) ring(x, y, 17, {color, alpha: g1 * lit * restMark(color, .6), width: 2});
      const level = g1 * listLevel(t, starts, i);
      let top = y + NAME_GAP + 18;
      // The moment heads its action from 20 px above it, further than the action's own lines stand apart, so the two read
      // as a heading and its action rather than as one block of lines.
      if (names[i][0]) top = nameText(names[i][0], x, top, {valign: "top", size: NOTE, color: P.muted, alpha: level * named(t, moments[i]), set: "stations"}).bottom + 20;
      nameText(names[i][1], x, top, {valign: "top", width: 360, alpha: level * named(t, acts[i]), set: "stations"});
    });
    // The member walks up to each station as it is named, then climbs the step to the next task, standing just short of
    // the station so its mark stays clear.
    const walk = [BX0 + 44, ...xs.slice(0, 3).map(x => x - 56)].reduce((x, to, k, all) => k ? mix(x, to, glide(t, starts[k - 1] + .05, to - all[k - 1])) : to, 0);
    const climbWay = [[xs[2] - 56, Y], [RISE, Y], [RISE, UP], [xs[3] - 56, UP]];
    const climb = glide(t, starts[3] + .05, lengthOf(climbWay)), at = along(climbWay, climb).point;
    const px = climb > 0 ? at[0] : walk, py = (climb > 0 ? at[1] : Y) - 30;
    person(px, py, {alpha: g1, size: 1.2});
  }
  // 2. Coaching tests a member's reasoning without making the judgment for them. The reasoning is a rail from the member
  // to the judgment at its end; the member and the rail arrive with the words that name the reasoning, which name them
  // beside the member, along which the coach's probe then walks, and the coach's own way toward the judgment stops at a
  // bar on the words that refuse it. The judgment, the member's own, arrives and is named on its word. Feedback names
  // the stations, each taking its colour and name on its own words, one list under the rail; a label like "weak logic"
  // is refused below the chain, attached to none of it. The stage stands low enough that the coach above it and the
  // feedback below it balance on the centre. The coaching name hangs out at the stage's left, so the stage stands right
  // of its drawn place: 25 px in Chinese, where the whole stage centres, and 30 px in English while the reasoning waits
  // for its judgment. English, whose judgment has the longer name, eases back to its drawn place on the judgment's
  // words, so its light tray takes the member's place at the next cut.
  const g2 = base * stageIn(t, coaching) * stageOut(t, someRisks);
  if (g2 > 0) {
    const judgmentAt = cue(s, "判断", "judgment"), SH = mix(L(25, 30), L(25, 0), soon(t, judgmentAt + .05, .6));
    const R = 550, MX = 290 + SH, CY = 350, JX = 1640 + SH, reasoning = cue(s, "成员的推理", "a member's reasoning"), rail = ramp(t, reasoning - .15, .4);
    const names = en ? ["Proposition", "Evidence", "Behavior", "Consequence"] : ["说法", "证据", "行为", "后果"];
    // The feedback stations stand at one pitch, ending far enough short of the judgment that its name keeps clear of the
    // last station's.
    const xs = railStations(names, 640 + SH, 1340 + SH);
    person(MX, R - 4, {alpha: g2 * named(t, reasoning), size: 1.1});
    // The reasoning stands whole with the member it belongs to, so the stage stands balanced while the coach tests it.
    link(MX + 16, R, JX - 40, R, {color: P.muted, width: 3, alpha: g2 * rail, end: false});
    nameText(L("成员的推理", "A member's reasoning"), MX + 40, R - 40, {align: "left", valign: "bottom", alpha: g2 * named(t, reasoning)});
    // The judgment at the end of the reasoning stays the member's, and is named as theirs, on the stations' baseline.
    diamond(JX, R, 24, {color: P.ink, alpha: g2 * named(t, judgmentAt), solid: true});
    nameText(L("判断", "Their judgment"), JX, R + NAME_GAP + 18, {valign: "top", alpha: g2 * named(t, judgmentAt)});
    person(MX, CY, {alpha: g2, size: 1.1, color: P.authority});
    nameText(L("辅导", "Coaching"), MX - 34, CY - 8, {align: "right", color: P.authority, alpha: g2 * named(t, coaching)});
    // The coach's probe tests each station of the reasoning while that is said, gliding from one to the next, and rests
    // once the refusal is named.
    const scan = 3 * glide(t, reasoning + .2, 3 * Math.abs(xs[1] - xs[0])), k = Math.min(2, Math.floor(scan));
    ring(mix(xs[k], xs[k + 1], scan - k), R, 22, {color: P.authority, width: 2.5,
      alpha: g2 * ramp(t, reasoning + .05, .3) * (1 - ramp(t, notJudge + .05, .4))});
    // The coach's way to the judgment draws on and stops short of it at a bar.
    link(MX + 40, CY, JX, R - 86, {route: "hv", color: P.authority, width: 2.5, alpha: g2 * named(t, notJudge), draw: {t, at: notJudge - .05}, end: false});
    line(JX - 24, R - 78, JX + 24, R - 78, {color: P.unknown, alpha: g2 * ramp(t, notJudge + .55, .3), width: 4});
    // The refusal is named over the coach's way, centred on its run.
    nameText(L("不是替他们判断", "Without judging for them"), (MX + 40 + JX) / 2, CY - NAME_GAP, {valign: "bottom", color: P.authority, alpha: g2 * named(t, notJudge)});
    xs.forEach((x, i) => {
      const lit = speaking(t, fb, i);
      dot(x, R, 9, {color: P.evidence, alpha: g2 * named(t, fb[i])});
      if (lit > 0) ring(x, R, 17, {color: P.evidence, alpha: g2 * lit * restMark(P.evidence, .6), width: 2});
    });
    railNames(names, xs, R, {alpha: i => g2 * listIn(t, fb, i), color: () => P.evidence, set: "feedback"});
    // The list reads as the sentence: what feedback names, then the stations it names.
    nameText(L("反馈要指出", "Feedback names"), xs[0] - measure(names[0], LABEL) / 2 - 34, R + NAME_GAP + 18 + labelSize(LABEL) / 2,
      {align: "right", size: NOTE, color: P.muted, alpha: g2 * named(t, cue(s, "反馈要指出", "feedback names"))});
    rejectedName(L("“逻辑弱”", "“Weak logic”"), (xs[0] + xs[3]) / 2, R + 200, {alpha: g2 * named(t, weak), mark: ramp(t, noDirection - .1, .4)});
  }
  // 3. Fluency, effort and Agent efficiency never make up for some risks. A balance stands from the stage's first words: the
  // three qualities land on the light tray on their words and tip it a little, then the first risk outweighs them all
  // and the beam stays put while the rest of the risks build one column on the heavy tray, each a key phrase on one
  // line, with a short qualifier under it where the risk needs one, each in one slot so the column keeps one pitch, and
  // its weight on the tray as it is named. Both columns stand their weights one inset in from their tray's end.
  const g3 = base * stageIn(t, someRisks) * stageOut(t, score);
  if (g3 > 0) {
    // The English risks carry longer qualifiers, so its balance stands 35 px further left to centre once they are named.
    const R = 470, cx = L(930, 895), cy = 640, H = 70, B = 150;
    const theta = -.02 * weights.reduce((a, at) => a + soon(t, at + .05, .5), 0) + .2 * soon(t, risks[0] + .05, .8);
    const lx = cx - R * Math.cos(theta), ly = cy - R * Math.sin(theta), rx = cx + R * Math.cos(theta), ry = cy + R * Math.sin(theta);
    stroke(() => { ctx.moveTo(cx, cy); ctx.lineTo(cx - 50, cy + B); ctx.lineTo(cx + 50, cy + B); ctx.closePath(); }, {color: P.ink, alpha: g3, width: 3});
    line(cx - 120, cy + B, cx + 120, cy + B, {color: P.ink, alpha: g3, width: 3});
    line(lx, ly, rx, ry, {color: P.ink, alpha: g3, width: 4});
    dot(cx, cy, 7, {color: P.ink, alpha: g3});
    // The two trays hang from the beam on one stroke, so the balance reads as one structure rather than as two like
    // hangers each waiting for a name of its own.
    stroke(() => [[lx, ly], [rx, ry]].forEach(([x, y]) => { ctx.moveTo(x, y); ctx.lineTo(x, y - H); }), {color: P.ink, alpha: g3, width: 3});
    [[lx, ly, P.muted, 170], [rx, ry, P.unknown, 220]].forEach(([x, y, color, w]) => {
      line(x - w, y - H, x + w, y - H, {color, alpha: g3, width: 4});
      line(x - w, y - H, x - w, y - H - 12, {color, alpha: g3, width: 3}); line(x + w, y - H, x + w, y - H - 12, {color, alpha: g3, width: 3});
    });
    // The light tray: the qualities, one column of names, each beside its small weight.
    const wNames = en ? ["Fluency", "Effort", "Agent efficiency"] : ["流畅", "努力", "智能体再高效"], em = labelSize(LABEL);
    const INSET = 16, wTops = stackTops(wNames.map(() => em), 0, 18), wLeft = lx - 170 + INSET + 36, wBase = ly - H - 24 - (wTops[2] + em);
    wNames.forEach((v, i) => {
      const y = wBase + wTops[i] + em / 2;
      box(wLeft - 36, y - 9, 18, 18, {fill: P.muted, alpha: g3 * named(t, weights[i]), radius: 3});
      nameText(v, wLeft, y, {align: "left", alpha: g3 * listIn(t, weights, i), set: "qualities"});
    });
    // The heavy tray: the risks, one column of term rows on the tray, each beside its weight, lit while it is said. Each
    // risk is said as one caption line, so a row names its risk by the key words rather than repeating that line whole:
    // the claimed completion stands currently unverified, and Chinese drops the connecting 就.
    const rows = en ? [
      [["Fabricated or unverified facts"], [risks[0]], ["as established"], [cue(s, "", "presented as established")]],
      [["Completion claimed"], [risks[1]], ["currently unverified"], [cue(s, "", "without current verification")]],
      [["Agent output"], [risks[2]], ["as fact, authorization or responsibility"], [cue(s, "", "standing in for")]]]
    : [
      [["没核实的、编造的、挑过的事实"], [risks[0]], ["说成确定"], [cue(s, "说成确定", "")]],
      [["没核验当前版本"], [risks[1]], ["说完成"], [cue(s, "就说完成", "")]],
      [["智能体的输出"], [risks[2]], ["充当事实或授权，", "或者让它替人负责"], [cue(s, "充当事实或授权", ""), cue(s, "或者让它替人负责", "")]]];
    const width = 520, slot = Math.max(...rows.map(([term, , qual]) => termRowLayout(term, qual, width, false).height)), heights = rows.map(() => slot);
    // Each risk is a name over its qualifier; the English rows, two lines each, stand 28 px apart, further than a risk's own
    // lines, so each risk reads as one item. The Chinese rows each keep room for three lines, which already sets them apart.
    const tops = stackTops(heights, 0, L(16, 28)), rLeft = rx - 220 + INSET + 36, rBase = ry - H - 24 - (tops.at(-1) + heights.at(-1));
    // The risks' heading stands under the heavy end of the beam, so the balance is named as its first words are said.
    nameText(L("有些风险", "Risks like these"), rx, ry + NAME_GAP, {valign: "top", size: NOTE, color: P.muted,
      alpha: g3 * named(t, cue(s, "有些风险", "risks like these"))});
    rows.forEach(([term, termAts, qual, qualAts], i) => {
      const top = rBase + tops[i], my = top + em / 2, lit = speaking(t, risks, i);
      box(rLeft - 36 - 2 * lit, my - 9 - 2 * lit, 18 + 4 * lit, 18 + 4 * lit, {fill: P.unknown, alpha: g3 * named(t, risks[i]), radius: 3});
      termRow(t, term, termAts, qual, qualAts, rLeft, top, {width, alpha: g3 * listLevel(t, risks, i), set: "risks", build: true, inline: false});
    });
  }
  // 4. If work is scored, the score expresses delivery risk and must never label a person: a pair, the delivery left of
  // centre with the score's gauge filling it, and the person whose work it is on the right, the two standing centred
  // together from the words that score the work, on which the stage opens and the score is named. The
  // way from the score toward the person stops at a bar on the words that refuse it, and the refused label stands
  // under the bar. The metric's questions then take the picture in one cut on their words.
  const g4 = base * stageIn(t, score) * stageOut(t, signalCut);
  if (g4 > 0) {
    const d1 = g4 * stageOut(t, metric);
    if (d1 > 0) {
      // The delivery and the person stand at their places from the stage's first words, so the pair stands centred and
      // the stage whole while the score is said, before the words turn to the person the score must never label.
      const DX = 580, DY = 330, DW = 240, DH = 230, gx = DX + DW / 2, gy = DY + 205, gr = 74, PX = DX + 720, PY = 480;
      documentIcon(DX, DY, DW, DH, {alpha: d1, rows: 1});
      fill(() => ctx.arc(gx, gy, gr + 14, Math.PI, Math.PI * 2), {color: P.row, alpha: d1});
      stroke(() => ctx.arc(gx, gy, gr, Math.PI, Math.PI * 2), {color: P.line, alpha: d1, width: 9, cap: "butt"});
      const read = ramp(t, deliveryRisk - .05, .8);
      if (read > 0) stroke(() => ctx.arc(gx, gy, gr, Math.PI, Math.PI * mix(1.001, 1.62, read)), {color: P.authority, alpha: d1, width: 9, cap: "butt"});
      const a = Math.PI * mix(1.04, 1.62, ramp(t, score + .1, .9));
      line(gx, gy, gx + Math.cos(a) * gr * .78, gy + Math.sin(a) * gr * .78, {color: P.ink, alpha: d1, width: 3});
      nameText(L("打分", "The score"), gx, DY - NAME_GAP, {valign: "bottom", alpha: d1 * named(t, score)});
      nameText(L("交付风险", "Delivery risk"), gx, DY + DH + NAME_GAP, {valign: "top", color: P.authority, alpha: d1 * named(t, cue(s, "分数说的是", "expresses"))});
      // The score's way toward the person stops at a bar halfway between the pair.
      person(PX, PY, {alpha: d1, size: 1.6});
      const go = soon(t, noLabel - .05, .7), BX = (DX + DW + PX) / 2 - 15;
      link(DX + DW + 30, PY, BX, PY, {color: P.unknown, alpha: d1 * named(t, noLabel), upto: go, end: false, dash: [8, 8]});
      // The refused phrase is named under the stop, beside the way it refuses.
      line(BX, PY - 34, BX, PY + 34, {color: P.unknown, alpha: d1 * ramp(t, noLabel + .55, .3), width: 4});
      rejectedName(L("给人贴标签", "Label a person"), BX, PY + 34 + NAME_GAP, {valign: "top", alpha: d1 * named(t, noLabel), mark: ramp(t, noLabel + .55, .3)});
    }
    // The metric is a chart trace; the questions asked of it attach to it: the decision it supports at its end, the
    // way it could be gamed lifting off its tail, and an anomaly on it understood through cases and mechanisms, a
    // small tree hanging from the anomaly. The trace stands from the stage's first words; each question's mark arrives
    // on its own words.
    const d2 = g4 * stageIn(t, metric);
    if (d2 > 0) {
      const X0 = 460, X1 = 1180, Y = 470, yAt = x => Y - 22 * Math.sin((x - X0) / 64) - 9 * Math.sin((x - X0) / 21), YE = yAt(X1);
      // The stage stands centred from the metric's name to the wider of the names under the decision.
      const DX = 1500, factParts = L(["事实依据", "、周期", "、边界"], ["Fact source", ", period", ", boundary"]);
      const underDX = Math.max(...wrapName(L("支持哪个决定", ""), 300).map(v => measure(v)), measure(L("", "a metric supports")), measure(factParts.join("")));
      ctx.save(); ctx.translate(960 - (X0 - NAME_GAP - measure(L("指标", "Metric")) + DX + underDX / 2) / 2, 0);
      const pts = [];
      for (let x = X0; x <= X1; x += 8) pts.push([x, yAt(x)]);
      // The trace stands at the structure tier from the cut, so the stage opens on its object, and the metric draws on
      // over it in its own colour. It is named from the clause that opens the stage, which names it.
      path(pts, {color: P.line, alpha: d2, width: 3});
      path(pts, {color: P.evidence, alpha: d2, width: 3, draw: {t, at: metric + STAGE_CUT}});
      nameText(L("指标", "Metric"), X0 - NAME_GAP, yAt(X0), {align: "right", color: P.evidence, alpha: d2 * named(t, metric)});
      // The decision the metric supports: a link from the trace's end to the decision's mark, on the words that ask for
      // it (in English the clause that opens the stage, so the stage opens with three firm marks), and its name on its
      // own words.
      const ask = cue(s, "先明确它", "first identify what decision"), dm = named(t, ask), dc = named(t, decision);
      link(X1 + 16, YE, DX - 40, YE, {color: P.authority, alpha: d2 * dm, draw: {t, at: ask - .05}});
      // The decision's mark stands with its name.
      diamond(DX, YE, 22, {color: P.authority, alpha: d2 * dc, solid: true});
      // The English name breaks before its article, so "a metric" stays one phrase.
      const decisionName = nameText(L("支持哪个决定", ["What decision", "a metric supports"]), DX, YE + 30 + NAME_GAP, {valign: "top", width: 300, color: P.authority, alpha: d2 * dc});
      // What is identified first with the decision, its fact source, period and boundary, is one name under it, each part
      // joining on its own words; the English stands whole on one line.
      const factAt = cue(s, "事实依据", "fact source"), firstAts = [factAt, cueFrom(s, "周期", "period", factAt), cueFrom(s, "边界", "boundary", factAt)];
      growName(t, factParts, firstAts, DX, decisionName.bottom + NAME_GAP,
        {valign: "top", align: "center", width: L(300, 420), alpha: d2, build: true});
      // Gaming lifts the number off the work it should describe: a dashed trace leaves the tail and climbs.
      const gm = named(t, gamed), lift = soon(t, gamed - .05, .9), G0 = 980, gpts = [];
      for (let x = G0; x <= X1; x += 8) gpts.push([x, yAt(x) - 130 * lift * ease((x - G0) / (X1 - G0))]);
      path(gpts, {color: P.unknown, alpha: d2 * gm, width: 2.5, dash: [7, 7]});
      // Named by the key words of its clause, not its caption's whole line.
      nameText(L("怎样被钻空子", "How it could be gamed"), (G0 + X1) / 2 + 40, yAt(X1) - 130 - NAME_GAP, {valign: "bottom", color: P.muted, alpha: d2 * gm});
      // The anomaly: one point standing off the trace, named above it.
      const AX = 700, ay = yAt(AX), an = named(t, anomaly), spike = soon(t, anomaly - .05, .5);
      line(AX, ay - 6, AX, ay - 6 - 84 * spike, {color: P.unknown, alpha: d2 * an, width: 2});
      dot(AX, ay - 6 - 84 * spike, 9, {color: P.unknown, alpha: d2 * an});
      nameText(L("异常", "Anomaly"), AX, ay - 100 - NAME_GAP, {valign: "bottom", alpha: d2 * an});
      // Understood through cases and mechanisms: two leaves hang from the anomaly, each on its own words.
      const xs = [AX - 150, AX + 150], LY = 690, ats = [cases, mechanisms];
      xs.forEach((x, i) => {
        const q = named(t, ats[i]);
        link(AX, ay + 14, x, LY - 48, {route: "vhv", mid: (ay + LY) / 2, alpha: d2 * q, draw: {t, at: ats[i] - .05}});
        if (!i) documentIcon(x - 22, LY - 28, 44, 56, {alpha: d2 * q, rows: 3});
        else {
          for (let k = 0; k < 8; k++) { const a = k * Math.PI / 4 + voiceTime(t) * .4; line(x + Math.cos(a) * 17, LY + Math.sin(a) * 17, x + Math.cos(a) * 26, LY + Math.sin(a) * 26, {color: P.ink, alpha: d2 * q, width: 6, cap: "butt"}); }
          ring(x, LY, 17, {color: P.ink, alpha: d2 * q, width: 4});
        }
      });
      railNames(en ? ["Cases", "Mechanisms"] : ["案例", "机制"], xs, LY + 40, {gap: NAME_GAP, alpha: i => d2 * listIn(t, ats, i), set: "through"});
      ctx.restore();
    }
  }
  // 5. A high-risk signal is escalated at once. The work's course runs across the lower band from the stage's first
  // words, calm until it rises toward its end: that rise is the early sign of high risk, its alert standing at the
  // rise's tip and named beside it on its words. On the words that escalate it, its way runs straight up from the alert
  // to the person it goes to, who stands above it and is named beside it. The stage holds to the scene's end.
  const g5 = base * stageIn(t, signalCut);
  if (g5 > 0) {
    const [sigAt, upAt] = cues(s, [["高风险的苗头", "high-risk signals"], ["随时上报", "at once"]]), escAt = en ? cue(s, "", "escalate high-risk") : upAt;
    const sigName = L("高风险的苗头", "High-risk signals"), upName = en ? ["Escalate", " at once"] : ["随时上报"];
    // The course and the column of the alert and the person stand centred together, from the course's start to the end
    // of the wider name beside the column; the rise lifts the alert well into the band, so the stage covers it before
    // the person comes.
    const R = 22, RUN = 720, RISE = 180, BASE = 660, wide = Math.max(measure(sigName), measure(upName.join("")));
    const X0 = 960 - (RUN + R + NAME_GAP + wide) / 2, SX = X0 + RUN, SY = BASE - RISE - R, PY = 270;
    const course = [];
    for (let x = X0; x <= SX + .5; x += 8) course.push([Math.min(x, SX), BASE - RISE * ease(clamp((x - (SX - 320)) / 320))]);
    path(course, {color: P.line, alpha: g5, width: 3});
    const sq = ramp(t, sigAt - .15, .4) * g5;
    path(course.filter(([x]) => x >= SX - 320), {color: P.unknown, alpha: sq, width: 3});
    ring(SX, SY, R, {color: P.unknown, alpha: sq, width: 3});
    line(SX, SY - 11, SX, SY + 3, {color: P.unknown, alpha: sq, width: 4});
    dot(SX, SY + 10, 3, {color: P.unknown, alpha: sq});
    nameText(sigName, SX + R + NAME_GAP, SY, {align: "left", alpha: g5 * named(t, sigAt)});
    // In English the way starts up on the words just before "at once", so it runs on from the signal without a stop.
    const wayAt = en ? upAt - .3 : upAt - .05;
    link(SX, SY - R - 8, SX, PY + 44, {color: P.unknown, alpha: g5 * ramp(t, wayAt - .05, .4), draw: {t, at: wayAt}, width: 2.5});
    person(SX, PY, {color: P.authority, alpha: g5 * named(t, escAt), size: 1.4});
    growName(t, upName, en ? [escAt, upAt] : [upAt], SX + R + NAME_GAP, PY - 8, {valign: "middle", color: P.authority, alpha: g5});
  }
};

/* ---------------- 29 evolve: management responsibilities and emergencies ---------------- */
/* A gear's ten teeth outside its rim, turned by `turn` radians, drawn in one stroke so they read as the wheel's texture
 * rather than as a list of like marks each waiting for a name of its own. */
function s29Teeth(x, y, r, turn, {alpha = 1, color = P.ink} = {}) {
  stroke(() => {
    for (let k = 0; k < 10; k++) {
      const a = k * Math.PI / 5 + Math.PI / 10 + turn;
      ctx.moveTo(x + Math.cos(a) * r, y + Math.sin(a) * r); ctx.lineTo(x + Math.cos(a) * (r + r * .24), y + Math.sin(a) * (r + r * .24));
    }
  }, {color, alpha, width: r * .12, cap: "butt"});
}
/* A gear standing for a management mechanism: ten teeth outside a rim and a hub, turned by `turn` radians. */
function s29Gear(x, y, r, {turn = 0, alpha = 1, color = P.ink} = {}) {
  s29Teeth(x, y, r, turn, {color, alpha});
  ring(x, y, r, {color, alpha, width: r * .06});
  ring(x, y, r * .26, {color, alpha, width: 4});
}
/* The management system under strain: the same gear as s29Gear, but its rim stops just short of closing under one tooth,
 * so the wheel reads as one mark rather than an empty ring. Used only by scene 29's strain stage. */
function s29Wheel(x, y, r, {turn = 0, alpha = 1, color = P.ink} = {}) {
  s29Teeth(x, y, r, turn, {color, alpha});
  ring(x, y, r, {color, alpha, width: r * .06, start: Math.PI / 10 + turn + .03, upto: .99});
  ring(x, y, r * .26, {color, alpha, width: 4});
}
scenes["29"] = function (s, t) {
  const managers = cue(s, "管理者要讲清", "managers clarify");
  const clarify = cues(s, [["方向", "direction"], ["优先级", "priorities"], ["决定的边界", "decision boundaries"], ["和资源", "and resources"]]);
  const [conflicts, stalled, protect] = cues(s, [["跨领域的冲突", "cross-domain conflicts"], ["久拖不决的事项", "stalled decisions"], ["保护如实暴露问题的人", "people who honestly"]]);
  const strains = cues(s, [["目标冲突", "goals conflict"], ["优先级变来变去", "priorities drift"], ["资源不足", "resources run short"], ["决定一拖再拖", "decisions stall"],
    ["分工衔接让人误判", "interfaces mislead"]]);
  const [repair, blame] = cues(s, [["先从管理上改起", "repair the management system"], ["不要急着怪成员", "before blaming"]]);
  const [demo, ...misuse] = cues(s, [["用真实的工作示范", "show how they judge"], ["事后挑错", "retrospective fault-finding"], ["走过场", "ceremonial review"], ["微观管理", "micromanagement"]]);
  const [within, closest] = cues(s, [["在边界之内", "within the stated boundaries"], ["离事实最近的负责人", "the responsible person closest"]]);
  const paths = cues(s, [["选方法", "the method"], ["工具", "tools"], ["实施路径", "and path"]]);
  const kinds = cues(s, [["数据出错", "a data error"], ["生产故障", "production failure"], ["越权违规", "permission or compliance"]]);
  // Both editions open the incident with its condition, 紧急情况下 and "it is an emergency when", a second before the
  // first kind; the stage opens on its key words.
  const emergency = cue(s, "紧急情况下", "an emergency");
  const [finder, contain, tell, ownerLeads] = cues(s, [["发现的人", "whoever finds it"], ["在自己权限内控制影响", "contains it within"], ["通知数据或生产负责人", "tells the data or production owner"],
    ["受影响工作的负责人", "the owner of the affected work"]]);
  const [urgency, uncertain, noAuthority] = cues(s, [["再紧急", "urgency does not"], ["不确定的结果", "an uncertain result"], ["权限也不会变大", "grant authority"], ["先控制影响", "contain first"]]);
  const fields = cues(s, [["谁凭哪些事实和权限", "who decided what"], ["凭哪些事实和权限", "on which facts"], ["措施管多久", "how long the measure"], ["谁接手", "who takes over"], ["什么情况下回滚", "when to roll back"]]);
  // Chinese also names verifying the correction among what the kept inputs serve (29.6); the act itself is its last
  // mention, once the incident holds.
  const [verifyAt, reviewAt] = cues(s, [["核验修正", "verify the correction", {last: true}], ["复盘原因", "and review"]]);
  const [again, recurring, mechanism] = cues(s, [["同类紧急处置", "treat a recurring"], ["反复出现", "a recurring kind of exception"], ["按机制问题处理", "as a mechanism problem"]]);
  const base = ramp(t, opening(s), .7);
  // 1. Managers make four things clear and act in time, in one structure: the manager stands at the left, joined to two
  // rows. On the top row direction, priorities, decision boundaries and resources take their stations; on the row
  // beneath stand the three acts: two domains pointing apart turn to one direction, a paused decision is settled, and
  // a person raising a problem is covered by an arc. The top row's rail stands from the first words, which say what
  // managers make clear, and the row beneath draws in with its first act; each duty takes its station on its own
  // words. The seven names build as one list and stay: earlier names step to second ink while later ones build, and
  // all return to full ink on the sentence's last words. The duties stand at one pitch, and the acts beneath stand
  // under the first three of them, so the two rows keep one grid. The stage holds until the strains are named.
  const one = base * stageOut(t, strains[0]);
  if (one > 0) {
    // The manager stands at 325 and the duties span 645 to 1565, so the named structure stands about the centre; in
    // English the manager stands 25 px further left and the duties span 620 to 1620, so the last act's name stands whole
    // on one line, 40 px from its neighbour, as no break keeps its phrase.
    const MX = L(325, 300), TX = L(475, 450), RA = 375, RB = 665, MY = (RA + RB) / 2, place = ramp(t, opening(s) + .1, .6) * one;
    const namesA = en ? ["Direction", "Priorities", "Decision boundaries", "Resources"] : ["方向", "优先级", "决定的边界", "资源"];
    const namesB = en ? ["Cross-domain conflicts", "Stalled decisions", ["Those who expose problems"]] : ["跨领域的冲突", "久拖不决的事项", "暴露问题的人"];
    const xa = railStations(namesA, L(645, 620), L(1565, 1620), {wrap: 300}), xb = xa.slice(0, namesB.length);
    const duties = [...clarify, conflicts, stalled, protect];
    person(MX, MY - 24, {alpha: one * ramp(t, managers - .2, .5), color: P.authority, size: 1.3});
    nameText(L("管理者", "Managers"), MX, MY + NAME_GAP + 18, {valign: "top", color: P.authority, alpha: one * named(t, managers)});
    // Both rails are drawn firm, so the structure the managers make clear spans the frame from the first words.
    [[xa, RA, 0, place], [xb, RB, 4, named(t, conflicts) * one]].forEach(([xs, ry, k0, rail]) => {
      link(MX + 56, MY, xs.at(-1), ry, {route: "hvh", mid: TX, alpha: rail, width: 3, end: false});
      xs.forEach((x, j) => {
        const q = ramp(t, duties[k0 + j] - .15, .4) * one, lit = speaking(t, duties, k0 + j);
        // The station covers its rail where it sits as it arrives.
        dot(x, ry, 8, {color: P.ground, alpha: q});
        dot(x, ry, 8, {color: P.authority, alpha: q});
        if (lit > 0) ring(x, ry, 17, {color: P.authority, alpha: lit * restMark(P.authority, .5) * one, width: 2});
      });
    });
    // The top row's marks: a compass turning to its heading, priority bars, a bounded frame and a stack of resources.
    clarify.forEach((at, i) => {
      const x = xa[i], y = RA - 96, q = ramp(t, at - .15, .4) * one;
      if (i === 0) {
        ring(x, y, 32, {color: P.authority, alpha: q, width: 2.5});
        const a = -Math.PI / 4 * soon(t, at - .15, .6) - Math.PI / 4;
        fill(() => { ctx.moveTo(x + Math.cos(a) * 24, y + Math.sin(a) * 24); ctx.lineTo(x + Math.cos(a + 1.57) * 6, y + Math.sin(a + 1.57) * 6);
          ctx.lineTo(x - Math.cos(a) * 16, y - Math.sin(a) * 16); ctx.lineTo(x - Math.cos(a + 1.57) * 6, y - Math.sin(a + 1.57) * 6); ctx.closePath(); }, {color: P.authority, alpha: q});
      }
      else if (i === 1) [88, 64, 40].forEach((w, k) => box(x - 44, y - 26 + k * 18, w, 12, {fill: P.authority, alpha: q * mix(1, restMark(P.authority), k / 2), radius: 3}));
      else if (i === 2) { box(x - 46, y - 32, 92, 64, {stroke: P.authority, alpha: q, radius: 10}); dot(x, y, 6, {color: P.ink, alpha: q}); }
      else [[64, 0], [50, -21], [36, -42]].forEach(([w, dy]) => box(x - w / 2, y + 12 + dy, w, 18, {stroke: P.authority, alpha: q, radius: 4}));
    });
    // The row beneath: two domains whose pointers face apart turn to one direction when the next act is named; a
    // decision paused by two bars is settled with a check on the last act; a person raising a flag is covered by an arc.
    const iy = RB - 96, [cx, sx, rx] = xb, cf = ramp(t, conflicts - .15, .4) * one, fix = soon(t, stalled + .05, .6);
    [-1, 1].forEach(side => {
      const bx = cx + side * 21, a = mix(side * Math.PI / 2, 0, fix), r = 10;
      box(bx - 17, iy - 15, 34, 30, {stroke: P.muted, alpha: cf, radius: 5});
      const tri = () => { ctx.moveTo(bx + Math.cos(a) * r, iy + Math.sin(a) * r); ctx.lineTo(bx + Math.cos(a + 2.4) * r * .8, iy + Math.sin(a + 2.4) * r * .8);
        ctx.lineTo(bx + Math.cos(a - 2.4) * r * .8, iy + Math.sin(a - 2.4) * r * .8); ctx.closePath(); };
      fill(tri, {color: P.unknown, alpha: cf * (1 - fix)});
      fill(tri, {color: P.authority, alpha: cf * fix});
    });
    const st = ramp(t, stalled - .15, .4) * one, settle = ramp(t, protect + .05, .4);
    diamond(sx, iy, 30, {color: P.muted, alpha: st * (1 - settle)});
    diamond(sx, iy, 30, {color: P.authority, alpha: st * settle});
    [-6, 6].forEach(d => line(sx + d, iy - 10, sx + d, iy + 10, {color: P.ink, alpha: st * (1 - settle), width: 3}));
    check(sx, iy + 1, 22, {color: P.authority, alpha: st * settle, upto: settle});
    const pr = ramp(t, protect - .15, .4) * one, px = rx - 7;
    person(px, iy - 4, {alpha: pr, size: .6});
    line(px + 19, iy + 22, px + 19, iy - 27, {color: P.ink, alpha: pr, width: 2});
    box(px + 19, iy - 27, 18, 12, {fill: P.unknown, alpha: pr, radius: 2});
    stroke(() => ctx.arc(px + 6, iy + 11, 38, Math.PI * 1.1, Math.PI * mix(1.1, 1.9, soon(t, protect + .05, .6))), {color: P.authority, alpha: pr, width: 3});
    // The list's own return to full ink would come only as the strains begin, at this stage's cut, so the whole list
    // returns on the sentence's last words instead, while the stage still stands.
    const whole = ramp(t, cue(s, "问题的人", "expose problems") + .05, .4);
    const ink = i => one * ramp(t, duties[i] - .15, .4) * mix(listLevel(t, duties, i), 1, whole);
    railNames(namesA, xa, RA, {wrap: 300, alpha: i => ink(i), set: "duties"});
    railNames(namesB, xb, RB, {wrap: 320, alpha: i => ink(i + 4), set: "duties"});
  }
  // 2. Under strain the management system is repaired first: the system is a gear whose rim cracks at each strain as it
  // is named, each name set outside the rim along its crack. On the repair the cracks mend and the gear turns, while
  // the member beside it stays untouched and unjudged. The stage holds until the demonstration is named. The gear stands
  // still from its first strain to the cut, so no name it has shown glides: it stands where its strains, once named,
  // and the member beside it stand centred, and each state of the build stands within 40 px of the centre (the first
  // strain alone, a build-up of half a second, a little more).
  // The demonstration's stage cuts in on its thought's first word, the managers it names, as the word begins.
  const demoCut = cue(s, "管理者用真实的工作示范", "managers show how they judge") - STAGE_CUT + .05;
  const three = base * stageIn(t, strains[0]) * stageOut(t, demoCut);
  if (three > 0) {
    const cx = L(953, 947);
    const cy = 470, R = 150, k = R / 100, fixed = soon(t, repair + .05, .8), turn = Math.max(0, voiceTime(t) - voiceTime(repair + .05)) * .25 * fixed;
    s29Wheel(cx, cy, R, {turn, alpha: three});
    dot(cx, cy, 10, {color: P.evidence, alpha: three * fixed});
    const names = en ? ["Goals conflict", "Priorities drift", "Resources run short", "Decisions stall", "Interfaces mislead"]
      : ["目标冲突", "优先级变来变去", "资源不足", "决定一拖再拖", "分工衔接让人误判"];
    // The strains crack the rim from the upper left in spoken order, the first three clockwise; the two left still stand
    // on the left, away from the member on the right, the wider name at the rim's left end, where it stands as far out
    // as the other at the lower left: in English the fifth, in Chinese the fourth, since the fifth's name there would
    // reach so far left that no still place of the gear centres both the first three strains and the five.
    const angles = en ? [-2.4, -.74, .74, 2.4, Math.PI] : [-2.4, -.74, .74, Math.PI, 2.4];
    strains.forEach((at, i) => {
      const a = angles[i], q = ramp(t, at - .15, .4) * three, lit = speaking(t, strains, i), px = cx + Math.cos(a) * R, py = cy + Math.sin(a) * R;
      const nx = -Math.sin(a) * 9 * k, ny = Math.cos(a) * 9 * k;
      const crack = [[px + Math.cos(a) * 22 * k + nx, py + Math.sin(a) * 22 * k + ny], [px + Math.cos(a) * 6 * k - nx, py + Math.sin(a) * 6 * k - ny],
        [px - Math.cos(a) * 8 * k + nx, py - Math.sin(a) * 8 * k + ny], [px - Math.cos(a) * 20 * k - nx, py - Math.sin(a) * 20 * k - ny]];
      path(crack, {color: P.unknown, alpha: q * (1 - fixed), width: 4 + 2 * lit});
      path(crack, {color: P.evidence, alpha: q * fixed, width: 4});
      radialName(names[i], cx, cy, R * 1.24 + 12, a, {width: L(260, 300), alpha: three * listIn(t, strains, i), set: "strains"});
    });
    // The repair and the member are named by the key words of their clauses, not their caption lines whole.
    nameText(L("先从管理上改起", "Management system"), cx, cy + R * 1.24 + NAME_GAP + 24, {valign: "top", color: P.evidence, alpha: three * named(t, repair)});
    // The member stands beside the gear, on the words that refuse to blame them; nothing is pinned on them. Their name
    // starts at the strain names' distance from the rim, on the right, where no strain stands, and the member stands
    // over it, the two centred on the gear's axis between the strains on that side.
    const member = L("不要急着怪成员", "Before blaming a member"), mx = cx + R * 1.24 + 12 + NAME_GAP + measure(member) / 2;
    const bl = ramp(t, blame - .15, .4) * three, memberTop = cy + 42.75;
    person(mx, memberTop - 58 - NAME_GAP, {alpha: bl, size: 1.1, color: P.muted});
    nameText(member, mx, memberTop, {valign: "top", color: P.muted, alpha: three * named(t, blame)});
  }
  // 3. Managers show how they judge on real work: the manager stands at a work document and marks its rows one by one,
  // then checks it. Beside it the three uses the guidelines refuse build into one column, each arriving with its cross on
  // its own words. The next stage cuts in on the words that name the stated boundaries, so the boundary draws on as
  // they are said, or just before the person closest to the facts if an edition names that person first. English says
  // the boundaries over a long clause before the person, so its stage holds 0.57 s into that clause and the boundary
  // never stands nearly empty through a second of speech.
  const boundCut = Math.min(closest - .35, within + L(0, .57)), four = base * stageIn(t, demoCut) * stageOut(t, boundCut);
  if (four > 0) {
    // The manager and the work stand on the centre while the demonstration is said, and ease left on the words that
    // refuse the guidelines' misuse, to where they centre with the refused uses, which stand at their places. The work
    // is a page tall enough that the pair alone covers a tenth of the frame's band while the demonstration is said.
    // The English first refusal is wider than the column's others, so the stage stands further left by half of what it
    // adds, measured, keeping its balance about the centre; each English cross stays 16 px after its own words.
    const names = en ? ["Retrospective fault-finding", "Ceremonial review", "Micromanagement"] : ["事后挑错", "走过场", "微观管理"];
    const wider = en ? Math.max(0, measure(names[0]) - Math.max(measure(names[1]), measure(names[2]))) / 2 : 0;
    const pair = L(-52, -112 - wider), shift = mix(L(178, 184), pair, glide(t, cue(s, "不拿这份指南", "never use") - .1, L(178, 184) - pair));
    const dx = 750 + shift, dy = 300, dw = 250, dh = 310, px = 610 + shift, py = dy + dh - 40;
    person(px, py, {alpha: four, color: P.authority, size: 1.2});
    // The work: a page with its title line and its rows, on which the manager marks each judgment in turn.
    documentIcon(dx, dy, dw, dh, {alpha: four, rows: 6});
    line(dx + 30, dy + 40, dx + 200, dy + 40, {color: P.ink, alpha: four, width: 4});
    const judge = clamp((voiceTime(t) - voiceTime(demo + .05)) / 2.2);
    [0, 1, 2].forEach(k => line(dx + 36, dy + 100 + k * 60, mix(dx + 36, dx + dw - 50 - k * 30, clamp(judge * 3.4 - k)), dy + 100 + k * 60,
      {color: P.authority, alpha: four, width: 4}));
    check(dx + dw - 40, dy + 54, 30, {color: P.authority, alpha: four, upto: clamp((judge - .8) * 5)});
    nameText(L("管理者", "Managers"), px, dy + dh + NAME_GAP, {valign: "top", color: P.authority, alpha: four});
    nameText(L("示范怎样判断", "Show how to judge"), dx + dw / 2, dy + dh + NAME_GAP,
      {valign: "top", width: 300, alpha: four * named(t, demo)});
    const LX = 1300 + pair;
    // Each English refusal is struck 16 px after its own words, which differ widely in length; the Chinese crosses, after
    // names within one character of each other, stand in one column after the longest.
    const tops = stackTops(names.map(() => blockHeight(1)), dy + dh / 2, 64), markLeft = en ? null : LX + Math.max(...names.map(v => measure(v))) + 16;
    misuse.forEach((at, i) => {
      const my = tops[i] + labelSize(LABEL) / 2, q = ramp(t, at - .15, .4) * four, lit = speaking(t, misuse, i);
      dot(LX - 40, my, 6 + 2 * lit, {color: P.unknown, alpha: q});
      // A refused name steps back only to the unknown's level, so its cross stays at 4.6:1; the dot of the one being
      // said grows.
      const level = markLevel(P.unknown, listLevel(t, misuse, i));
      rejectedName(names[i], LX, my, {align: "left", alpha: four * ramp(t, at - .15, .4) * level, mark: ramp(t, at + .05, .3), set: "misuse", markLeft});
    });
  }
  // 4. Within the stated boundaries the person closest to the facts chooses: the stage cuts in just before the person is
  // named, with the boundary drawing on round its ground and its name, sized to the facts and their responsible person
  // standing inside it; on the words that name the first choice the ground widens to take the choices, which branch
  // from that person into one column, each drawn on and named on its own words. The ground widens about its own middle,
  // so the stage stays centred: its left edge and what stands in it reflow by half the widening. The person's name
  // stands under the person, on the line of the last choice's name.
  const five = base * stageIn(t, boundCut) * stageOut(t, emergency);
  if (five > 0) {
    const fw = mix(700, 980, glide(t, paths[0] - .55, 140)), fx = 960 - fw / 2, fy = 375, fh = 250, my = fy + fh / 2, px = fx + 480, sx = fx + 800;
    const edge = rounded([[fx, fy + fh / 2], [fx, fy], [fx + fw, fy], [fx + fw, fy + fh], [fx, fy + fh], [fx, fy + fh / 2]], 22);
    box(fx, fy, fw, fh, {fill: P.row, alpha: five, radius: 22});
    path(edge, {color: P.authority, alpha: five, width: 2, draw: {t, at: boundCut + STAGE_CUT, least: 1.2}});
    nameText(L("在边界之内", "Stated boundaries"), fx, fy - NAME_GAP, {align: "left", valign: "bottom", color: P.authority, alpha: five * named(t, within)});
    const cl = five, DX = fx + 60;
    documentIcon(DX, my - 64, 84, 108, {alpha: cl, rows: 3, stroke: P.evidence});
    person(px, my + 2, {alpha: cl, size: 1.3});
    const closestY = my + 44 + NAME_GAP + labelSize(LABEL) / 2, D = closestY - my;
    nameText(L("离事实最近的负责人", "Closest to the facts"), px, closestY, {width: 330, alpha: five * named(t, closest)});
    const ys = [my - D, my, my + D], names = en ? ["Method", "Tools", "Path"] : ["方法", "工具", "实施路径"];
    // Each way draws on at the stage's ink from the person, so its tip grows from nothing whenever its draw sets off and
    // no drawn stretch inks in within a frame.
    paths.forEach((at, i) => {
      const q = ramp(t, at - .15, .4) * five, lit = speaking(t, paths, i);
      link(px + 48, my, sx - 20, ys[i], {route: "hvh", mid: fx + 660, r: 18, alpha: five, draw: {t, at: at - .15}, end: false});
      dot(sx, ys[i], 8 + 2 * lit, {color: P.evidence, alpha: q});
      nameText(names[i], sx + 13 + NAME_GAP, ys[i], {align: "left", alpha: five * listIn(t, paths, i), set: "paths"});
    });
  }
  // 5. An incident is contained by whoever finds it, within their own authority. Both editions open it with the
  // emergency: the urgency clock of the urgency stage below stands over the row, small and named on its words, as the
  // stage's first mark. The kinds of incident build into one row, left to right in the order spoken, each a firm ring
  // with its spreading pulse, inside one frame that opens around the first kind and widens to the right just before each
  // next one; the frame is the finder's authority, and widens to the left to take the finder on the words that find it.
  // On the containment the pulses stop at the firm rings, which turn to evidence, and the frame takes its name. The
  // condition the path applies under stands beneath the frame, building on its words. Telling the owner draws one link
  // from the finder out of the frame, under the condition with clear room, to the owner beyond it, in three straight
  // runs joined by quarter turns. The stage holds until the owner takes over. The finder and the owner stand with their
  // feet on the line of the rings' lowest points, and the finder at the kinds' pitch before the first; every name hangs
  // under its mark on the kinds' names' line, and the frame keeps one padding above the finder's head and below the
  // lowest name, and one at its two ends; the frame's name and, a line above it, the emergency are centred over the
  // frame as it stands, moving with it as it widens, so the two headings keep one rule, the emergency's clock hung
  // before its line.
  const six = base * stageIn(t, emergency) * stageOut(t, ownerLeads);
  if (six > 0) {
    const KY = 470, M = 160, PAD = 30, py = KY + 26 - 29, NY6 = KY + 26 + NAME_GAP;
    const held6 = ramp(t, contain - .15, .4), place = ramp(t, kinds[0] - .1, .5) * six;
    // The English kinds alternate on two baselines, as the film's dense rails set their names: the first and the third,
    // whole on one line, stand a row lower on a short stem from their rings, so the kinds keep one pitch; the frame
    // reaches 44 px past the third's name, and the finder's side keeps that padding.
    const names = en ? ["Data error", "Production failure", ["Permission or compliance breach"]] : ["数据出错", "生产故障", "越权、违规"];
    const finderName = L("发现的人", "Whoever finds it"), FW6 = 280, half = (v, w) => Math.max(...wrapName(v, w).map(line => measure(line))) / 2;
    // The frame's edges follow its members: each next kind widens it to the right just before it arrives, and the
    // finder widens it to the left. The stage keeps the frame on the centre as it widens, so what stands in it reflows by
    // half of each widening; as the owner is told it closes left, the owner coming in at their place beside it, until the
    // frame and the owner centre together. Its headings and the condition beneath it centre on it as it stands.
    const ownerName = L("数据或生产负责人", "Data or production owner"), M3 = L(M, half(names[2], 300) + 44), row6 = L(0, RAIL_ROW);
    // Each widening is a glide in voice time that has nearly arrived as its member comes in, so the frame's edges and what
    // the stage re-centres move at a pace the eye follows and the member never stands outside the frame.
    const widenFrom = (at, d) => at - .15 - .85 * glideTime(d);
    const FL0 = 2 * 710 - 980 - half(finderName, FW6) - (M3 - half(names[2], 300));
    const left0 = mix(710 - M, FL0, glide(t, widenFrom(finder, 710 - M - FL0), 710 - M - FL0));
    const right0 = mix(mix(710 + M, 980 + M, glide(t, widenFrom(kinds[1], 270), 270)), 1250 + M3, glide(t, widenFrom(kinds[2], 1250 + M3 - 980 - M), 1250 + M3 - 980 - M));
    // The English owner's name stands whole on one line, as no break keeps it a phrase, so the owner stands a gap past
    // the frame by its name's own width, the frame with the owner centres on their whole extent, and the frame closes
    // from the words before the owner's, so the owner arrives inside the safe area.
    const owner0 = L(1570, 1250 + M3 + 30 + half(ownerName, 340));
    const shift0 = 960 - (left0 + right0) / 2, shift1 = L(-30, 960 - (FL0 + owner0 + half(ownerName, 340)) / 2), shift = mix(shift0, shift1, glide(t, tell - L(.1, .8), shift1 - shift0));
    const kxs = [710, 980, 1250].map(x => x + shift), px = 2 * kxs[0] - kxs[1], ox = owner0 + shift;
    const lines6 = Math.max(...names.map(v => wrapName(v, 300).length), wrapName(finderName, FW6).length);
    const fy = py - 15 * 1.2 * 2.15 - PAD, fh = NY6 + blockHeight(lines6) + row6 + PAD - fy;
    const left = left0 + shift, right = right0 + shift, FC = (left + right) / 2;
    {
      const emergencyName = L("紧急情况下", "Emergency"), ex = FC - measure(emergencyName) / 2, eq = named(t, emergency) * six;
      const ey = fy - NAME_GAP - labelSize(LABEL) / 2 - labelSize(LABEL) * LEADING;
      clock(ex - NAME_GAP - 18, ey, 18, {hand: (voiceTime(t) * .6) % 1, color: P.unknown, alpha: eq});
      nameText(emergencyName, FC, ey, {alpha: eq});
    }
    box(left, fy, right - left, fh, {stroke: P.line, alpha: place, radius: 20, width: 3.5});
    nameText(L("在自己权限内控制影响", "Contains it within their authority"), FC, fy - NAME_GAP, {valign: "bottom", color: P.authority, alpha: six * named(t, contain)});
    // The path applies when the incident threatens harm: the condition stands beneath the frame, centred on the frame
    // as its headings are, as two names on one line, each arriving on its own words (the threats to data and
    // production, then the rest), so its last words are never read seconds before they are said.
    const threat = cue(s, "威胁到", "threatens");
    const condition = en ? ["Threatens data, production,", "downstream use or compliance"] : ["威胁到数据、生产、", "下游或合规"];
    const conditionAts = [threat, cueFrom(s, "下游或合规", "downstream use", threat)], space = en ? measure(" ", NOTE) : 0;
    const headW = measure(condition[0], NOTE) + space, conditionX = FC - (headW + measure(condition[1], NOTE)) / 2;
    const conditionBottom = Math.max(...condition.map((v, k) => nameText(v, conditionX + k * headW, fy + fh + NAME_GAP,
      {align: "left", valign: "top", size: NOTE, color: P.muted, alpha: six * named(t, conditionAts[k])}).bottom));
    kinds.forEach((at, i) => {
      const kx = kxs[i], q = ramp(t, at - .15, .4) * six, lit = speaking(t, kinds, i), tone = blend(P.unknown, P.evidence, held6);
      dot(kx, KY, 8 + 2 * lit, {color: P.unknown, alpha: q});
      ring(kx, KY, 26, {color: tone, alpha: q, width: 3});
      // The incident spreads in pulses beyond its ring until it is contained; each pulse grows out of the ring at no
      // width, its ink rising with its width as a beat's does, and thins as it widens, so it never stands out at once at
      // the ring's edge.
      const wave = (voiceTime(Math.min(t, contain - .15)) * .8 + i / 3) % 1, swell = clamp(wave / .15);
      ring(kx, KY, 26 + 24 * wave, {color: P.unknown, alpha: q * swell * (1 - wave) * .7 * (1 - held6), width: 2 * swell});
      const lower = en && i !== 1;
      if (lower) line(kx, KY + 32, kx, NY6 + row6 - 6, {alpha: q, width: 2});
      nameText(names[i], kx, NY6 + (lower ? row6 : 0), {valign: "top", width: 300, alpha: six * listIn(t, kinds, i), set: "kinds"});
    });
    // The finder stands inside the frame at its left and the owner beyond the frame, each named under them, and the link
    // from the finder runs down from under the finder's name out of the frame, under it, and up to under the owner's.
    const fd = ramp(t, finder - .15, .4) * six;
    person(px, py, {alpha: fd, size: 1.2});
    const finderBlock = nameText(finderName, px, NY6, {valign: "top", width: FW6, alpha: six * named(t, finder)});
    const ow = ramp(t, tell - .15, .4) * six;
    person(ox, py, {alpha: ow, color: P.authority, size: 1.2});
    const ownerBlock = nameText(ownerName, ox, NY6, {valign: "top", width: 340, color: P.authority, alpha: six * named(t, tell)});
    // The link runs under the condition with clear room, so it never underlines it. It is one way, down, across and up
    // in quarter turns, one stroke. Drawn at the tip pace on the words that bring the owner it would still be drawing
    // when the thought ends, so it stands whole from the stage's cut and comes in with the owner, on those words.
    const lowY = conditionBottom + 18;
    link(px, finderBlock.bottom + 12, ox, ownerBlock.bottom + 12, {route: "vhv", mid: lowY, alpha: ow, width: 2.5});
  }
  // 6. The owner of the affected work leads the response: the owner stands at the head of a small tree, with the
  // affected work, a page marked by the incident, beside them from the words that name it. The preserved inputs and
  // versions sit beneath the owner, and from them two branches reach what they are kept for: establishing the impact
  // and verifying a correction. English names the kept inputs before their uses. Chinese names the uses first
  // (保留查明影响、核验修正所需的输入和版本): on the words that keep them the stem draws down from the owner through the
  // stack's place, the branches leave its foot on their own words, and the stack settles over the stem on the words
  // that name it. When the response needs further
  // permission, the owner escalates to the person with the authority to decide, the decision owner, on the left. Each
  // part of the tree draws in with its own words, and the decision owner appears on the words that name the escalation.
  // The English tree stands lower, so it is balanced through the thought before its two branches arrive at its end.
  const seven = base * stageIn(t, ownerLeads) * stageOut(t, urgency);
  if (seven > 0) {
    const [keep, impact] = cues(s, [["保留查明影响", "preserves the inputs"], ["查明影响", "establish the impact"]]);
    const [needAt, escAt] = cues(s, [["需要更多权限时", "for any further permission"], ["上报决策负责人", "escalates to the decision owner"]]);
    const kept = en ? keep : cue(s, "输入和版本", "");
    // The tree stands where it centres on its own until the decision owner is named, and then moves right, the decision
    // owner standing at their place on the left, until the whole stage centres.
    const OPEN = L(90, 100), wide = OPEN * soon(t, escAt - .1, .8);
    const lower = en ? 30 : 0, ox = 960 + wide, oy = 360 + lower, sy = 525 + lower, by = 610 + lower, xs = [640 + wide, 1280 + wide], ly = 730 + lower;
    person(ox, oy, {alpha: seven, color: P.authority, size: 1.3});
    // The owner's role, each part on its own words. The Chinese role is its caption's whole line, so it names what the
    // owner does by its key word, 接手, on the words 接手应对.
    const [role, roleAts] = en ? [["Owner of the affected work", " sees the response through"], [ownerLeads, cue(s, "", "sees the response through")]]
      : [["受影响工作的负责人", "接手"], [ownerLeads, cue(s, "接手应对", "")]];
    growName(t, role, roleAts, ox + 60, oy - 6, {width: 520, valign: "middle", color: P.authority, alpha: seven});
    // The affected work stands far enough left of the kept versions that its name keeps clear of them, and the versions'
    // name stands on the line of the work's name. Its page is drawn as 23's pages are, its ruled rows in one stroke, so
    // they read as the page's text rather than as rows each waiting for a name.
    const hit = seven * ramp(t, ownerLeads + STAGE_CUT, .3), WX = 700 + wide, WY = 440 + lower, workNameY = WY + 60 + NAME_GAP + labelSize(LABEL) / 2;
    s23Page(WX - 50, WY - 60, 100, 120, {alpha: hit, rows: 3});
    // The owner takes the affected work in hand on the words that say they see the response through.
    link(ox - 32, oy + 44, WX + 58, WY, {route: "vh", color: P.authority, alpha: hit, draw: {t, at: roleAts[1] + .05}, width: 2.5});
    nameText(L("受影响工作", "The affected work"), WX, WY + 60 + NAME_GAP, {valign: "top", alpha: hit});
    ring(WX + 50, WY - 60, 14, {color: P.unknown, alpha: hit, width: 2.5});
    dot(WX + 50, WY - 60, 5, {color: P.unknown, alpha: hit});
    // The kept inputs and versions: a stack of three versions, each a dated copy of the input, hung from the owner.
    // The Chinese stem runs on to the branches' foot, and quickly, since the first use follows its keeping words at once.
    const kp = ramp(t, kept - .15, .4) * seven;
    link(ox, oy + 62, ox, en ? sy - 60 : sy + 42, {alpha: seven * ramp(t, keep - .15, .2), draw: {t, at: keep - .15}, end: false});
    [2, 1, 0].forEach(k => box(ox - 60 + k * 12, sy - 46 - k * 12, 104, 76, {fill: P.row, stroke: k ? P.line : P.ink, alpha: kp, radius: 6}));
    [0, 1, 2].forEach(k => line(ox - 44, sy - 22 + k * 16, ox + 22 - k * 14, sy - 22 + k * 16, {color: P.evidence, alpha: kp, width: 3}));
    nameText(L("输入和版本", "Inputs and versions kept"), ox + 68 + NAME_GAP + 12, workNameY, {align: "left", alpha: seven * named(t, kept)});
    const uses = [impact, cue(s, "核验修正", "verify a correction")], names = en ? ["Establish the impact", "Verify a correction"] : ["查明影响", "核验修正"];
    uses.forEach((at, i) => {
      const q = ramp(t, at - .15, .4) * seven, x = xs[i];
      link(ox, sy + 42, x, ly - 34, {route: "vhv", mid: by + 40, r: 18, alpha: seven * ramp(t, at - .15, .2), draw: {t, at: at - .15}, end: false});
      if (i === 0) [0, 1, 2].forEach(k => ring(x, ly, 8 + k * 9, {color: P.unknown, alpha: q * mix(1, restMark(P.unknown), k / 2), width: 2}));
      else check(x, ly + 2, 26, {color: P.evidence, alpha: q, draw: {t, at: at - .05}});
    });
    railNames(names, xs, ly + 8, {wrap: 400, alpha: i => seven * listIn(t, uses, i), set: "uses"});
    // The decision owner stands a size smaller than the owner, so the figure reads as one person, head and shoulders,
    // which its one name names.
    const DX = 420 + OPEN, up = ramp(t, escAt - .15, .4) * seven;
    person(DX, oy, {alpha: up, color: P.authority, size: 1.1});
    nameText(L("决策负责人", "Decision owner"), DX, oy + 44 + NAME_GAP, {valign: "top", color: P.authority, alpha: seven * named(t, escAt)});
    link(ox - 52, oy - 10, DX + 60, oy - 10, {color: P.authority, alpha: up, draw: {t, at: escAt - .05}, width: 2.5});
    // The further permission is named over the escalation's way as it stands once the tree has moved; Chinese names it
    // before the escalation.
    nameText(L("需要更多权限时", "For any further permission"), (960 + OPEN - 52 + DX + 60) / 2, oy - 10 - NAME_GAP,
      {valign: "bottom", width: 380, color: P.authority, alpha: seven * named(t, needAt)});
  }
  // 7. Urgency changes neither the result nor the authority: urgency's clock stands at the left and two ways leave it.
  // The first carries an uncertain result on toward reliable and stops at a bar; the second reaches toward more
  // authority and stops at a bar at the same place. Each way and what it carries arrive on their own words: the way on
  // toward reliable and its bar on the words that would make the result reliable (in Chinese 变可靠), and what it cannot
  // reach on reliable itself (可靠). The stage builds about the centre: the clock stands alone on it, the clock and the
  // uncertain result centre as a pair as the result is named, and as reliable is named the stage eases to its place,
  // where the whole stage centres.
  const recordAt = cue(s, "如果先记录", "if recording would");
  const eight = base * stageIn(t, urgency) * stageOut(t, recordAt);
  if (eight > 0) {
    // The clock reaches 46 px either side of its axis, or its name further; the uncertain result's page reaches 45 px
    // right of its axis, or its name further.
    const [reliable, target] = [cue(s, "变可靠", "reliable"), cue(s, "可靠", "reliable")], clockReach = Math.max(46, measure(L("再紧急", "Urgency")) / 2);
    const pairE = 960 - (600 - clockReach + 900 + Math.max(45, measure(L("不确定的结果", "An uncertain result")) / 2)) / 2;
    // The English says the result and reliable within a second, so its stage eases to its place in one move from the
    // result's words rather than settling between two.
    const E = en ? mix(360, -80, glide(t, uncertain - .1, 440))
      : mix(mix(360, pairE, glide(t, uncertain - .1, 360 - pairE)), -70, glide(t, target - .1, pairE + 70));
    const cx = 600 + E, cy = 510, rows = [400, 620], sx = 900 + E, bx = 1200 + E, tx = 1480 + E;
    const un = ramp(t, uncertain - .15, .4) * eight;
    // The clock stands on the centre, near where the response's last marks stood, so it fades in over the cut's first
    // frames rather than in one and is not read as one of them jumping to it.
    // Its hand turns at 0.3 of a turn a second, slowly enough that no part of it is followed as moving at a pace.
    clock(cx, cy, 44, {hand: (voiceTime(t) * .3) % 1, color: P.unknown, alpha: eight * ramp(t, urgency + STAGE_CUT, .15)});
    nameText(L("再紧急", "Urgency"), cx, cy + 44 + NAME_GAP, {valign: "top", alpha: eight * named(t, urgency)});
    link(cx + 52, cy, sx - 58, rows[0], {route: "hvh", mid: 750 + E, r: 18, alpha: un, end: false});
    // Each refused way inks in over 0.3 s while it draws on, as the film's other refused ways do, so it never stands at
    // firm ink in the first frame it is seen.
    link(cx + 52, cy, bx - 16, rows[1], {route: "hvh", mid: 750 + E, r: 18, color: P.unknown, alpha: eight * ramp(t, noAuthority - .15, .3),
      upto: drawShare(t, noAuthority - .15, Math.abs(bx - 16 - (cx + 52)) + Math.abs(rows[1] - cy), .5), end: false, dash: [8, 8]});
    // The uncertain result keeps its question mark; the way on toward reliable stops at the bar.
    documentIcon(sx - 44, rows[0] - 56, 88, 112, {alpha: un, rows: 0});
    text("?", sx, rows[0] + 6, 44, {role: "mark", align: "center", color: P.unknown, alpha: un});
    nameText(L("不确定的结果", "An uncertain result"), sx, rows[0] + 56 + NAME_GAP, {valign: "top", alpha: eight * named(t, uncertain)});
    link(sx + 58, rows[0], bx - 16, rows[0], {color: P.unknown, alpha: eight * ramp(t, reliable - .15, .3), upto: drawShare(t, reliable - .15, Math.abs(bx - 16 - (sx + 58)), .45), end: false, dash: [8, 8]});
    [[rows[0], reliable], [rows[1], noAuthority]].forEach(([y, at]) => line(bx, y - 30, bx, y + 30, {color: P.unknown, alpha: ramp(t, at + .05, .3) * eight, width: 4}));
    // What urgency cannot reach stands beyond the bars, muted, on its words.
    ring(tx, rows[0], 34, {color: P.muted, alpha: eight * named(t, target), width: 2});
    check(tx, rows[0] + 2, 30, {color: P.muted, alpha: eight * named(t, target)});
    seal(tx, rows[1], 32, {color: P.muted, alpha: eight * named(t, noAuthority), hollow: true});
    nameText(L("可靠", "Reliable"), tx, rows[0] + 56 + NAME_GAP, {valign: "top", color: P.muted, alpha: eight * named(t, target)});
    nameText(L("权限", "Authority"), tx, rows[1] + 34 + NAME_GAP, {valign: "top", color: P.muted, alpha: eight * named(t, noAuthority)});
  }
  // 8. Contain first, then complete the record: the incident arrives held, a firm ring, on the words that contain it
  // first, at the left, and the record beside it fills row by row on the words that ask for each, one row per spoken
  // clause. The record waits as a small page at the middle of its place from the stage's first words, which name the
  // recording, a clock on it turning while it would delay the response and why it waits beneath it; on the words that
  // complete it the clock goes and the page opens about its middle into the record, headed by its name inside it and as
  // long as the rows it holds, and each row arrives with its box, its check and its name on its own words. The name
  // stands one row's pitch above the first row, and the open page keeps one padding round its words: above its name, at
  // its left and below its last row. The page is as wide as its rows need, so the incident and the record stand about
  // the centre, and while the record waits the incident and the waiting page stand apart about it.
  // Once it holds, the correction is verified and the cause reviewed: the held incident turns to a check on the words
  // that verify the correction, and the two acts are named beneath it, each on its own words. The stage holds until
  // recurrence is named.
  const nine = base * stageIn(t, recordAt) * stageOut(t, again);
  if (nine > 0) {
    // The Chinese contains the incident while the record still waits, narrow, so the incident stands 80 px nearer the
    // centre until the record opens and eases to its place as it opens.
    const later = cue(s, "再补记录", "then complete the record"), ix = 590 + (en ? 0 : 80 * (1 - glide(t, later - .45, 80))), cy = 500, rx = 800, rw = 640;
    // The Chinese last row is its caption's whole line, so it drops the 下 of 什么情况下.
    const rows = en
      ? [["Who decided what"], ["On which facts", " and authority"], ["How long the measure lasts"], ["Who takes over"], ["When to roll back"]]
      : [["谁", "凭哪些事实和权限，", "决定了什么"], ["措施管多久"], ["谁接手"], ["什么情况回滚"]];
    const rowAts = en
      ? [[fields[0]], [fields[1], cue(s, "", "and authority")], [fields[2]], [fields[3]], [fields[4]]]
      : [[fields[0], fields[1], cue(s, "决定了什么", "decided what")], [fields[2]], [fields[3]], [fields[4]]];
    // The page's top and its name's line; each row's name stands one row's pitch below the one before.
    const starts = rowAts.map(v => v[0]), RH = 66, top = cy - RH * rows.length / 2 + 10, PT9 = top - 60, HC = PT9 + 40;
    // The incident arrives already held, a firm ring around it, on the words that contain it first (in Chinese with the
    // clause that says so), so it is never seen before it is named.
    const firstAt = cue(s, "就先控制影响", "contain first") - .15, held9 = ramp(t, firstAt - .15, .4);
    const verified = ramp(t, verifyAt - .15, .4);
    dot(ix, cy, 12, {color: P.unknown, alpha: nine * held9 * (1 - verified)});
    ring(ix, cy, 26, {color: P.evidence, alpha: nine * held9, width: 3});
    check(ix, cy + 1, 26, {color: P.evidence, alpha: nine * verified, draw: {t, at: verifyAt - .05}});
    // The containment's name hangs under the incident; if it would nearly meet a row of the record beside it, it stands
    // on that row's line instead.
    const nominal = cy + 46 + NAME_GAP + labelSize(LABEL) / 2, rowMid = rows.map((_, i) => HC + RH * (i + 1)).find(m => Math.abs(m - nominal) < 13);
    const contained = nameText(L("先控制影响", "Contain first"), ix, rowMid ?? nominal, {color: P.evidence, alpha: nine * named(t, firstAt)});
    // Verifying the correction and reviewing the cause, beneath the containment, centred under the incident, each act
    // joining the name on its own words.
    const after = en ? ["Verify the correction", ", review the cause"] : ["核验修正", "，复盘原因"], AW = 340;
    // The later step stands apart from the containment, each of its lines centred under the incident.
    growName(t, after, [verifyAt, reviewAt], ix, contained.bottom + 60, {width: AW, color: P.evidence, alpha: nine, align: "center", build: true});
    // Each row's top: a row's rule lies 46 px below its top. The open page's top stands 44 px, its rows' left inset,
    // above its name's ink, and it ends 27 px below the last rule, which leaves the same room below the last row's
    // words; with its name alone the name stands in its middle, and each row lengthens it to the row's own end. The
    // waiting page's top rises to the open page's as it opens.
    const rowTop = i => HC + RH * (i + 1) - labelSize(LABEL) / 2, grownRows = starts.map(at => soon(t, at - .5, .35));
    const OT = HC - labelSize(LABEL) / 2 - 44, foot = grownRows.reduce((y, q, i) => mix(y, rowTop(i) + 46 + 27, q), 2 * HC - OT);
    // The waiting page opens about its middle into the record over 1.6 s of voice time from 0.45 s before its words, each
    // edge peaking near 260 px/s; the name joins on its words inside the page, carried with the page's left edge as it
    // opens, as the frame's name of the incident moves with its frame, and the rows' rules end inside the page as it
    // stands.
    const open = ease((voiceTime(t) - voiceTime(later - .45)) / 1.6), pageW = mix(96, rw, open), waitX = rx + (rw - 96) / 2, px9 = mix(waitX, rx, open);
    documentIcon(px9, mix(PT9, OT, open), pageW, mix(120, foot - OT, open), {alpha: nine, rows: 0});
    clock(px9 + 48, top + 14, 24, {hand: (voiceTime(t) * .5) % 1, color: P.muted, alpha: nine * (1 - ramp(open, 0, .4))});
    nameText(L("再补记录", "Then complete the record"), px9 + 44, HC, {align: "left", alpha: nine * named(t, later + L(.3, .6))});
    // Why the record waits, under the waiting page on the words that say so, until the page opens over it.
    nameText(L("先记录会耽误应对", "Recording would delay the response"), waitX, top + 60 + NAME_GAP, {align: "left", valign: "top", size: NOTE,
      color: P.muted, alpha: nine * named(t, cue(s, "先记录会耽误应对", "recording would delay the response")) * (1 - ramp(t, later - .4, .25))});
    // The rows' rules are one stroke, each drawn on from its row's name as its row arrives, so they read as the page's
    // ruling and each row's name names its own box. A rule ends 44 px before the page's right border, the inset of its
    // box from the left border.
    stroke(() => starts.forEach((at, i) => {
      const y = rowTop(i) + 46, end = Math.max(rx + 140, px9 + pageW - 44), q = drawShare(t, at - .15, end - rx - 96);
      if (q > 0) { ctx.moveTo(rx + 96, y); ctx.lineTo(mix(rx + 96, end, q), y); }
    }), {color: P.line, alpha: nine * .7, width: 2});
    rows.forEach((row, i) => {
      const y = rowTop(i), q = ramp(t, starts[i] - .15, .4), lit = speaking(t, starts, i), held = q * nine;
      box(rx + 44, y + 4, 24, 24, {stroke: lit > 0 ? blend(P.line, P.authority, lit) : P.line, alpha: held, radius: 4, width: 2});
      if (q > 0) check(rx + 56, y + 16, 22, {color: P.authority, alpha: q * nine, upto: q, width: 3});
      growName(t, row, rowAts[i], rx + 96, y, {alpha: nine * listLevel(t, starts, i), set: "record"});
    });
  }
  // 9. A recurring kind of exception (in Chinese, the same kind of emergency handling) is a mechanism problem: the same mark
  // repeats along one rail across the clause
  // that says it recurs, and on the mechanism every repeat drops into one gear below, a small tree whose root is the
  // mechanism. Each repeat arrives on its beat, and the gear appears and turns on the words that name the mechanism.
  const ten = base * stageIn(t, again);
  if (ten > 0) {
    const xs = [520, 740, 960, 1180, 1400], ry = 380, bus = 474, gy = 612, gr = 60;
    // The repeats land on words spread evenly over the clause, from its first word to the last word of the recurrence.
    const close = cue(s, "反复出现", "a recurring kind of exception", {end: true}), said = s.words.filter(w => w.start >= again - 1e-6 && w.start < close).map(w => w.start);
    const beats = xs.map((_, k) => said[Math.round(k * (said.length - 1) / (xs.length - 1))]);
    const mech = ramp(t, mechanism - .15, .4), turn = Math.max(0, voiceTime(t) - voiceTime(mechanism + .05)) * .25;
    line(xs[0] - 60, ry, mix(xs[0] - 60, xs.at(-1) + 60, drawShare(t, again - .1, xs.at(-1) - xs[0] + 120, Math.max(.9, close - again))), ry, {color: P.line, alpha: ten, width: 2});
    xs.forEach((x, k) => {
      const q = ramp(t, beats[k] - .1, .3) * ten;
      dot(x, ry, 20, {color: P.ground, alpha: q});
      ring(x, ry, 20, {color: P.unknown, alpha: q, width: 2});
      dot(x, ry, 9, {color: P.unknown, alpha: q});
      link(x, ry + 28, 960, gy - gr * 1.24 - 10, {route: "vhv", mid: bus, r: 16, alpha: ten * mech, draw: {t, at: mechanism - .1}, end: k === 2});
    });
    s29Gear(960, gy, gr, {turn, alpha: ten * mech});
    const parts = en ? ["Treat", " a recurring kind of exception"] : ["同类紧急处置", "反复出现"];
    growName(t, parts, [again, recurring], 960 - measure(parts.join(""), LABEL) / 2, ry - 20 - NAME_GAP, {valign: "bottom", alpha: ten});
    nameText(L("按机制问题处理", "As a mechanism problem"), 960, gy + gr * 1.24 + NAME_GAP, {valign: "top", color: P.evidence, alpha: ten * named(t, mechanism)});
  }
};

/* ---------------- 30 coda: back to the dataset ---------------- */
scenes["30"] = function (s, t) {
  const [back, next, finished, rely] = cues(s, [["回到开头那份价格数据", "back to the price dataset"], ["下一位用它的人", "its next user"],
    ["做完了", "a finished dataset"], ["可靠", "reliable"]]);
  const needs = cues(s, [["清楚的含义", "clear meaning"], ["当时能拿到的事实", "the facts available"], ["对得上说法的证据", "evidence matching"],
    ["经过准入", "an admitted"]]);
  const results = cues(s, [["发布指南", "publishing these guidelines"], ["真正采用它", "adopting them"], ["让工作变好", "improving the work"]]);
  const three = cue(s, "三回事", "three different results");
  // Real work shows the last two results: Chinese names the two before what shows them, English after it.
  const [lastTwo, realAt, show] = cues(s, [["后两件", "the last two"], ["真实的工作", "real work"], ["才能证明", "can show"]]);
  const [q1, q2, q3, yes] = cues(s, [["问题解决了吗", "was the problem solved"], ["判断经过检验", "was the judgment tested its limits clear"],
    ["下一次", "and is the system"], ["肯定的", "yes"]]);
  const base = ramp(t, opening(s), .7);
  // 1. The opening's dataset returns, with its next user to its right and the four things that user needs in one column
  // beside them, as in the opening; now each need arrives with its check as it is named. The stage holds through the next
  // thought, which refers to the four: the card is named finished, and the way to the user turns to evidence as the
  // dataset becomes reliable. The illustrative chip stands with the dataset and leaves with
  // this stage.
  const g1 = base * stageOut(t, results[0]);
  const needNames = en ? ["Clear meaning", "Facts available then", "Evidence matching claims", "An admitted, bounded use"]
    : ["清楚的含义", "当时能拿到的事实", "对得上说法的证据", "经过准入、有边界的用途"];
  // The settled stage: the opening's positions, moved in as far as the longest need requires to stay inside the safe
  // area, and then left until the card, its user and the needs centre (60 px in Chinese, 80 in English); the needs stand
  // far enough right of the user that the user's name keeps clear of their column. While it builds, the card stands
  // alone on the centre, eases left as its next user is named so the two stand centred, and moves on with the user as
  // the needs begin.
  const QX = Math.min(1370, 1790 - 17 - NAME_GAP - Math.max(...needNames.map(v => measure(v, LABEL)))) + L(-60, -80), PX0 = QX - 200;
  const Y1 = CONTENT_CY + 48, K = 1.4, CX0 = Math.min(330 + L(-60, -80), PX0 - 300 * K - 370), CY = Y1 - 180 * K;
  const userAt = Math.min(next, cue(s, "下一位用它的人", "with") + .05);
  const pair = (1920 - (PX0 - CX0) - measure(L("下一位用它的人", "Its next user")) / 2) / 2 - CX0;
  const lone = 960 - 150 * K - CX0, onward = glide(t, needs[0] - .1, Math.max(Math.abs(pair), Math.abs(pair - lone)));
  const CX = CX0 + mix(mix(lone, pair, glide(t, userAt - .1, pair - lone)), 0, onward), PX = PX0 + pair * (1 - onward), edgeX = CX + 300 * K;
  const lift = y => clearOfTitle(s, t, y);
  // The chip stands in the head band, clear of the rising title, so it waits for the first words rather than ink in
  // with the card in the quiet before them, and fades in over 0.4 s.
  illustrative(g1 * Math.min(lift(CY), ramp(t, s.words[0].start - HOLD, .4)));
  if (g1 > 0) {
    // The next user stands as the sentence that returns to the dataset ends, and is named on its own words.
    const card = g1 * lift(CY), user = named(t, Math.min(next, cue(s, "下一位用它的人", "with") + .05)) * g1 * lift(Y1 - 60);
    reportCard(CX, CY, {alpha: card, scale: K, done: 1, named: card * named(t, back)});
    // The card is named finished over its top, as a page is named over it, clear of the card's ruled rows below.
    nameText(L("做完了", "A finished dataset"), CX + 150 * K, CY - NAME_GAP, {valign: "bottom", alpha: g1 * named(t, finished)});
    // The next user appears when named.
    person(PX, Y1, {alpha: user, size: 1.4});
    nameText(L("下一位用它的人", "Its next user"), PX, Y1 + 32 + NAME_GAP, {valign: "top", alpha: named(t, next) * g1 * lift(Y1 - 60)});
    // The way to the user draws on as the user is named; it turns to evidence and carries one point once the dataset is
    // reliable, and that word is named above it.
    const relied = ramp(t, rely - .1, .5);
    link(edgeX + 20, Y1, PX - 60, Y1, {alpha: user, draw: {t, at: next - .1}});
    // Its point starts at the way's start as the way turns, so it enters by its size.
    link(edgeX + 20, Y1, PX - 60, Y1, {color: P.evidence, alpha: g1 * relied, width: 2.5, flowing: since(t, rely + .1)});
    nameText(L("可靠", "Reliable"), (edgeX + PX - 40) / 2, Y1 - NAME_GAP,
      {valign: "bottom", width: PX - edgeX - 110, alpha: g1 * named(t, rely)});
    const names = needNames, tops = stackTops(names.map(() => blockHeight(1)), Y1, 40);
    names.forEach((v, i) => {
      const y = tops[i] + labelSize(LABEL) / 2, on = ramp(t, needs[i] - .15, .4) * g1, lit = speaking(t, needs, i);
      ring(QX, y, 17, {color: P.evidence, alpha: on, width: 2.5});
      check(QX, y + 1, 18, {color: P.evidence, alpha: on, draw: {t, at: needs[i] - .1}});
      if (lit > 0) ring(QX, y, 25, {color: P.evidence, alpha: lit * restMark(P.evidence, .5) * g1, width: 2});
      nameText(v, QX + 17 + NAME_GAP, y, {align: "left", alpha: g1 * listIn(t, needs, i), set: "needs"});
    });
  }
  // 2. Three different results stand as three columns of one table: each result draws its ring on its own words, and
  // rules between the columns set them apart on the words that count them as different. Real work runs under the table
  // as its ground, drawn on its words; on the words that say it can show them, one point rises from it into each of the
  // last two columns, whose check stands once the two are named: the first result, which publishing shows, keeps its
  // place empty. Row heads at one right edge name the results' row and the ground on their words.
  const asks = q1, g2 = base * stageIn(t, results[0]) * stageOut(t, asks);
  if (g2 > 0) {
    const names = en ? ["Publishing these guidelines", "Adopting them", "Improving the work"] : ["发布指南", "真正采用它", "让工作变好"];
    const heads = en ? ["Three different results", "Real work"] : ["三回事", "真实的工作"];
    // The English columns stand 40 px wider, so the first result's name stands whole on one line between its rules. The
    // results are large enough that the first two, standing while the third is still to come, cover their share of the
    // band; their marks are drawn at the rings' scale.
    const R = 90, k = R / 62, D = L(380, 420), GAP = 70, wrap = D - 40, HW = Math.max(...heads.map(v => measure(v, LABEL)));
    const lines = names.map(v => wrapName(v, wrap)), nameHalf = Math.max(R, ...lines.map(ls => Math.max(...ls.map(l => measure(l, LABEL))) / 2));
    // The table stands further right until its third result is named (105 px in Chinese, 60 in English), so the first
    // two stand about the centre, and eases back as a glide on the third result's words.
    const total = 2 * D + nameHalf + R + GAP + HW, rightUntil = L(105, 60) * (1 - glide(t, results[2] - .1, L(105, 60)));
    const x0 = L(940, 965) + rightUntil - total / 2 + R + GAP + HW, xs = [x0, x0 + D, x0 + 2 * D], HX = x0 - R - GAP;
    // The table stands a little below the content centre, so its first row, which stands alone while the results are
    // named, is not left in the upper part of the frame, and the whole table still balances on the centre.
    const bh = blockHeight(Math.max(...lines.map(ls => ls.length))), span = 2 * R + 10 + NAME_GAP + bh + 76 + 120;
    const MY = CONTENT_CY + 50 - span / 2 + R + 10, EY = MY + R + NAME_GAP + bh + 76, WY = EY + 120;
    const left = xs[0] - R, right = xs[2] + R, shown = Math.max(show, lastTwo);
    // Real work is the ground, named on its words. Drawn at the tip pace from those words it would still be drawing when
    // the thought ends, so it stands whole from the stage's cut and comes in on them.
    link(left, WY, right, WY, {color: P.ink, alpha: g2 * ramp(t, realAt - .05, .4), width: 3, end: false});
    results.forEach((at, i) => {
      const x = xs[i], on = ramp(t, at - .15, .4) * g2, lit = speaking(t, results, i);
      ring(x, MY, R, {color: P.ink, alpha: on, width: 2.5});
      // The halo on the result being said stands at rest at 0.55 of full ink, 2.5 px wide, and enters and leaves as a
      // pulse does, its ink following its width, so it neither appears nor vanishes within a frame; its ink rises late in
      // its entrance and falls early in its exit, so two halos never stand firm together as one hands over to the next.
      if (lit > .02) ring(x, MY, R + 10, {color: P.ink, alpha: .55 * g2 * lit ** 3, width: Math.max(1, 2.5 * lit)});
      // The published guidelines are a page drawn as 23's pages are, its ruled rows in one stroke.
      if (i === 0) s23Page(x - 22 * k, MY - 30 * k, 44 * k, 58 * k, {alpha: on, rows: 3});
      else if (i === 1) person(x, MY + 10 * k, {alpha: on, size: 1.15 * k});
      else path([[x - 30 * k, MY + 18 * k], [x - 10 * k, MY], [x + 6 * k, MY + 8 * k], [x + 30 * k, MY - 20 * k]], {color: P.ink, alpha: on, width: 3});
      if (!i) return;
      // Real work shows the result: its point rises from the ground into the column, in voice time once risen, and the
      // column's check stands under the result's name.
      const rise = soon(t, show - .05 + (i - 1) * .1, .5), proof = ramp(t, shown - .1 + (i - 1) * .12, .4) * g2;
      link(x, WY - 3, x, EY + 30, {alpha: g2, upto: rise, flowing: since(t, show + .45 + (i - 1) * .1), lag: i * .33});
      ring(x, EY, 22, {color: P.evidence, alpha: proof, width: 2.5});
      check(x, EY + 1, 22, {color: P.evidence, alpha: proof, draw: {t, at: shown + (i - 1) * .12}});
    });
    railNames(names, xs, MY + R, {gap: NAME_GAP, wrap, alpha: i => g2 * listIn(t, results, i), set: "results"});
    // The count says the three are different results: rules between the columns stand on those words and set them apart.
    const apart = ramp(t, three - .15, .4) * g2;
    [0, 1].forEach(k => line(xs[k] + D / 2, MY - R - 10, xs[k] + D / 2, WY, {color: P.line, alpha: apart, width: 2}));
    [[MY, three, P.muted], [WY, realAt, P.ink]].forEach(([y, at, color], k) =>
      nameText(heads[k], HX, y, {align: "right", color, alpha: g2 * named(t, at)}));
  }
  // 3. The test in real work: three questions stand as three stations on one firm rail, the rail from the cut and each
  // station on its own words, where the question takes its station with a "?" and is named below it by its key words.
  // The questions stand left to right in the order asked, as the opening's three outcomes did, on a rail that is
  // balanced from the cut. As the last line turns to the answer to all three, the three stations light together; as it
  // answers them yes, each "?" gives way to a check, and as it says the work has value, one light bracket gathers the
  // three from above under that name, settled before the voice ends.
  const g3 = base * stageIn(t, asks);
  if (g3 > 0) {
    const [earlier, better, worth] = cues(s, [["能不能更好地发现", "better able to recognize"], ["应对", "or handle"], ["这项工作就有了价值", "the work has value"]]);
    // Each question is named by its spoken phrases, each line centred on its station; a phrase stays whole on its line.
    // The Chinese second question is its caption's whole line, so its name keeps its words without the closing 吗, the
    // station's "?" keeping the question, on one line, as its one comma gives no even break; the Chinese third is named
    // by its words from its subject, the work system, which it names on them.
    // The Chinese third question's station and name stand together on its subject, the work system.
    const third = en ? q3 : cue(s, "工作体系能不能", "");
    const asked = [q1, q2, third], ats = [[q1], [q2], [third, earlier, better]], all = cue(s, "三个答案", "the answer to all three");
    const answered = ramp(t, pauseHold(all - .1, .3), .3) * (1 - ramp(t, yes + .05, .3));
    // The Chinese third question has no clause mark from its subject on, so it stands whole on one line.
    const names = en ? [["Problem solved?"], ["Judgment tested, limits clear?"], ["Better able to recognize", " or handle", " the next occurrence?"]]
      : [["问题解决了吗"], ["判断经过检验，限度清楚"], ["工作体系能不能更好地发现或应对"]];
    // The rail, its names and the bracket with the value above it are balanced on the content centre. A name wraps no
    // wider than W, the third a little wider; in Chinese W is the rail's own wrap width, so its two long questions break
    // at their clause marks and neighbouring names stand well apart.
    const W = en ? 380 : RAIL_WRAP, R = 56, Y = CONTENT_CY - 20, xs = [520, 960, 1400], done = t >= yes + .05;
    const settle = ramp(t, asks + STAGE_CUT, .15);
    line(xs[0] - 230, Y, xs[2] + 230, Y, {color: P.line, alpha: g3 * settle, width: 3.5});
    asked.forEach((at, i) => {
      // A station arrives on its question's words, held out of the quiet before a question that opens its thought, and
      // covers the rail where it sits quickly enough that the rail never runs through its "?".
      const x = xs[i], from = Math.max(pauseHold(at - .15, .4), i ? -Infinity : asks + STAGE_CUT), on = ramp(t, from, .4) * g3;
      const lit = Math.max(speaking(t, asked, i) * (i ? 1 : settle), answered);
      dot(x, Y, R, {color: P.ground, alpha: g3 * ramp(t, from, .1)});
      ring(x, Y, R, {color: P.evidence, alpha: on, width: 2.5});
      if (lit > 0) ring(x, Y, R + 10, {color: P.evidence, alpha: lit * restMark(P.evidence, .45) * g3, width: 2});
      // The question stands open until the words that answer it yes; the check then draws on in its place.
      // The question fades as the check begins to draw on in its place.
      text("?", x, Y + 2, 40, {role: "mark", align: "center", color: P.ink, alpha: on * (1 - ramp(t, yes - .2, .4))});
      if (done) check(x, Y + 3, 36, {color: P.evidence, alpha: g3, draw: {t, at: yes + .05}});
    });
    // The third question is asked over three phrases: its station beats on the words of each phrase after its first.
    beats(t, xs[2], Y, R + 10, [earlier, better], {color: P.evidence, alpha: g3});
    // A name stands whole on its first words, so its lines are set as one name, centred on the station.
    names.forEach((parts, i) => nameText(growTexts(parts, i < 2 ? W : W + 120).map(line => line.map(([, v]) => v).join("")), xs[i], Y + R + NAME_GAP,
      {valign: "top", alpha: g3 * listLevel(t, asked, i) * named(t, ats[i][0]), set: "questions"}));
    // The work has value: one light bracket encloses the three from above, and the value is named over it. The outer
    // drops leave the bar's ends at the latest 0.4 s before the film's last word ends.
    const BY = Y - R - 64, reach = {t, at: worth - .1}, outer = Math.min(worth + .6, s.words.at(-1).end - .4);
    if (t >= reach.at) {
      link(960, BY, xs[0], BY, {alpha: g3, draw: reach, end: false});
      link(960, BY, xs[2], BY, {alpha: g3, draw: reach, end: false});
      // Each drop leaves the bar once the bar has reached it: the middle one at once, the outer ones at the bar's ends.
      xs.forEach((x, i) => link(x, BY, x, Y - R - 14, {alpha: g3, end: false,
        draw: {t, at: i === 1 ? worth - .1 : outer}}));
    }
    nameText(L("这项工作就有了价值", "The work has value"), 960, BY - NAME_GAP, {valign: "bottom", color: P.evidence, alpha: g3 * named(t, worth)});
  }
};


/* Within a chapter the picture changes as the next voice begins, in the same cut as a stage within a scene: the
 * outgoing scene holds and the incoming one replaces it in one frame, so the change reads as one cut rather than a
 * double exposure or a blink. The cut falls on the incoming scene's first label at reading contrast, no earlier than its
 * first word and at most CUT_LAG after it, so the outgoing picture holds over the first syllables instead of leaving
 * the frame without a legible mark while the new scene waits for its first named place. */
const CUT_LAG = .6;
const continues = i => i > 0 && film.segments[i - 1].chapter === film.segments[i].chapter;
const firstTexts = new Map();
function firstTextOf(s) {
  if (firstTexts.has(s.id)) return firstTexts.get(s.id);
  const saved = {ctx, layout, sceneFade, wordFade, scene: window.__sceneId, measuring};
  const meter = measuringContext();
  let found = Infinity;
  measuring = true; ctx = meter;
  try {
    for (let t = s.voice_start - .3; t <= s.voice_start + CUT_LAG + .2; t += 1 / 60) {
      layout = {texts: [], scene: s.id}; sceneFade = 1; wordFade = 1;
      meter.setTransform(1, 0, 0, 1, 0, 0); meter.save(); push(s, t); scenes[s.id](s, t); meter.restore();
      if (layout.texts.some(v => contrastOf(v.color, v.alpha) >= 4.5)) { found = t; break; }
    }
  } finally {
    ({ctx, layout, sceneFade, wordFade, measuring} = saved); window.__sceneId = saved.scene;
  }
  firstTexts.set(s.id, found);
  return found;
}
/* A scene that carries objects across the cut changes on its first word: it draws them where the previous scene
 * left them, so the frame stays continuous, and they leave their old places only once the new scene has been cut in. */
const cutAt = v => {
  // The voice clip may open a few hundredths before its first aligned word; the cut waits for the word itself.
  const voice = Math.max(v.start, v.voice_start, v.words?.[0]?.start ?? -Infinity);
  return scenes[v.id]?.carries ? voice : Math.min(voice + CUT_LAG, Math.max(voice, firstTextOf(v)));
};
const visualStart = i => continues(i) ? cutAt(film.segments[i]) : film.segments[i].start;
/* Marks fade with `fade`; words with `words`, so a stage can keep its marks while its words wait. */
function drawScene(s, t, fade, words = fade) {
  const scene = scenes[s.id];
  if (!scene) throw Error(`Unimplemented scene ${s.id}`);
  // The scene being drawn is published so a checker can attribute every mark to its scene.
  layout.scene = s.id; sceneFade = fade; wordFade = words; window.__sceneId = s.id;
  ctx.save(); push(s, t); scene(s, t); ctx.restore();
  layout.scene = null; sceneFade = 1; wordFade = 1; window.__sceneId = null;
}
function drawAt(t) {
  layout = {texts: [], scene: null, time: t};
  ctx.setTransform(resolution, 0, 0, resolution, 0, 0);
  ctx.globalAlpha = 1; ctx.fillStyle = P.ground; ctx.fillRect(0, 0, 1920, 1080);
  const creditStart = film.duration - film.credits_duration;
  if (t >= creditStart) { credits(t); publish(t); return; }
  const index = Math.max(0, film.segments.findLastIndex(v => v.start <= t));
  const s = film.segments[index];
  const next = film.segments[index + 1], prev = film.segments[index - 1];
  // The scene on screen: the outgoing scene of a chapter holds until its successor's cut.
  let shown = index;
  while (shown > 0 && continues(shown) && t < visualStart(shown)) shown--;
  if (next && continues(index + 1) && t >= visualStart(index + 1)) shown = index + 1;
  // Chapters fade through the ground: every mark of the scene carries the fade, so checks see what is shown.
  const fadeIn = index === 0 || (prev && prev.chapter === s.chapter) ? 1 : ramp(t, s.start, .6);
  const fadeOut = next && next.chapter === s.chapter ? 1 : 1 - ramp(t, s.end - .5, .5);
  const keep = Math.min(fadeIn, fadeOut);
  const v = film.segments[shown];
  drawScene(v, t, keep);
  // A chapter card already shows while the previous chapter's last scene fades out.
  chapterCard(next && opensChapter(next) && t >= next.start - .15 ? next : s, t);
  runningHead(s, t);
  caption(t);
  publish(t);
}
function publish(t) { window.__filmLayout = {time: t, texts: layout.texts}; }
window.renderFrame = t => drawAt(t + (film.render_offset || 0));
window.renderCover = () => { layout = {texts: []}; ctx.setTransform(resolution, 0, 0, resolution, 0, 0); ctx.fillStyle = P.ground; ctx.fillRect(0, 0, 1920, 1080); titleSignature(1); };
window.__filmScenes = scenes;
window.renderFrame(0);

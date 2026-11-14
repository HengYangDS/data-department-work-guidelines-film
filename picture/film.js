/* Generated from picture/film/ by npm run compose: edit the modules, not this file. */
"use strict";

// picture/film/canvas.js
var canvas = document.getElementById("picture");
var ctx = canvas.getContext("2d", { alpha: false });
var resolution = Number(document.getElementById("film").dataset.width) / 1920;
var layout = { texts: [], scene: null };
var sceneFade = 1;
var wordFade = 1;
var measuring = false;
function setDrawing(next) {
  if ("ctx" in next) ctx = next.ctx;
  if ("layout" in next) layout = next.layout;
  if ("sceneFade" in next) sceneFade = next.sceneFade;
  if ("wordFade" in next) wordFade = next.wordFade;
  if ("measuring" in next) measuring = next.measuring;
}

// picture/film/palette.js
var P = {
  ground: "#0F1519",
  row: "#1E2932",
  line: "#63758B",
  ink: "#ECE8DF",
  muted: "#9BA8B1",
  evidence: "#7DB7D8",
  authority: "#E0BF78",
  unknown: "#C9785C"
};
var LABEL = 26;
var TYPE = 1.12;

// picture/film/timing/easing.js
var clamp = (q) => Math.max(0, Math.min(1, q));
var mix = (a, b, q) => a + (b - a) * q;
var ease = (q) => {
  q = clamp(q);
  return q * q * (3 - 2 * q);
};
var ramp = (t, start, duration = 0.7) => ease((t - start) / duration);
var bezier = (x1, y1, x2, y2) => (q) => {
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
var standard = bezier(0.4, 0, 0.2, 1);
var soon = (t, start, duration = 0.55) => standard((t - start) / duration);

// picture/film/drawing/colour.js
var groundLuminance = /* @__PURE__ */ (() => {
  const lin = (c) => {
    c /= 255;
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  };
  return (rgb) => 0.2126 * lin(rgb[0]) + 0.7152 * lin(rgb[1]) + 0.0722 * lin(rgb[2]);
})();
var rgbOf = (v) => /^#[0-9a-f]{6}$/i.test(v ?? "") ? [1, 3, 5].map((i) => parseInt(v.slice(i, i + 2), 16)) : null;
var GROUND = rgbOf(P.ground);
function contrastOf(color, alpha) {
  const rgb = rgbOf(color);
  if (!rgb) return 1;
  const mixed = rgb.map((v, i) => alpha * v + (1 - alpha) * GROUND[i]);
  return (groundLuminance(mixed) + 0.05) / (groundLuminance(GROUND) + 0.05);
}
function blend(a, b, q) {
  const rgb = (v) => [1, 3, 5].map((i) => parseInt(v.slice(i, i + 2), 16));
  const [x, y] = [rgb(a), rgb(b)];
  return "#" + x.map(
    (c, i) => Math.round(mix(c, y[i], clamp(q))).toString(16).padStart(2, "0")
  ).join("");
}

// picture/film/scenes/registry.js
var scenes = {};

// picture/film/timeline.js
var film = window.FILM;
var en = film.edition === "en";
var L = (zh, english) => en ? english : zh;

// picture/film/timing/cues.js
var units = (v) => v.replace(/[^\p{L}\p{N}]/gu, "").toLowerCase();
var phraseEnd = /* @__PURE__ */ new Map();
var cueCache = /* @__PURE__ */ new Map();
var clauseCache = /* @__PURE__ */ new Map();
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
var clauseStartCache = /* @__PURE__ */ new Map();
function clauseStart(at) {
  const s = film.segments.find(
    (v) => v.words.length && v.words[0].start - 0.5 <= at && at <= v.words.at(-1).end + 0.5
  );
  if (!s) return -Infinity;
  if (!clauseStartCache.has(s.id)) {
    const ends = clauseEnds(s), starts = [];
    let before = 0, previous = 0;
    s.words.forEach((w, k) => {
      if (!k || ends.some((e) => e > previous && e <= before)) starts.push(w.start);
      previous = before;
      before += units(w.text).length;
    });
    clauseStartCache.set(s.id, starts);
  }
  let start = -Infinity;
  for (const v of clauseStartCache.get(s.id)) {
    if (v <= at + 0.2) start = v;
    else break;
  }
  return start;
}
function cue(s, zh, english, { last = false, end = false } = {}) {
  const key = `${s.id}:${zh}:${english}:${last}:${end}`;
  if (cueCache.has(key)) return cueCache.get(key);
  const target = units(L(zh, english));
  const spoken = s.words.map((w) => units(w.text)).join("");
  const index = last ? spoken.lastIndexOf(target) : spoken.indexOf(target);
  if (index < 0 || !target) throw Error(`Missing spoken cue ${key}`);
  const clause = clauseEnds(s).find((n) => n >= index + target.length) ?? spoken.length;
  let cursor = 0, first = null, close = null, said = null;
  for (const w of s.words) {
    const n = units(w.text).length;
    if (first === null && cursor + n > index) first = w.start;
    if (close === null && cursor + n >= index + target.length) close = w.end;
    if (cursor + n >= clause) {
      said = w.end;
      break;
    }
    cursor += n;
  }
  if (first === null || close === null) throw Error(`Unresolved spoken cue ${key}`);
  phraseEnd.set(
    first,
    Math.max(phraseEnd.get(first) ?? 0, Math.min(said ?? close, first + 4.5), close)
  );
  const value = end ? close : first;
  cueCache.set(key, value);
  return value;
}
var cues = (s, pairs) => pairs.map((pair) => cue(s, ...pair));
function cueFrom(s, zh, english, from) {
  const target = units(L(zh, english));
  let spoken = "";
  const starts = s.words.map((w) => {
    const at = spoken.length;
    spoken += units(w.text);
    return at;
  });
  const k = s.words.findIndex((w) => w.start >= from - 1e-6);
  const index = spoken.indexOf(target, k < 0 ? spoken.length : starts[k]);
  if (index < 0 || !target)
    throw Error(`Missing spoken cue ${s.id}:${zh}:${english} after ${from}`);
  let i = starts.length - 1;
  while (starts[i] > index) i--;
  return s.words[i].start;
}

// picture/film/timing/pauses.js
var span = (t, a, b, fade = 0.45) => ramp(t, pauseHold(a, fade), fade) * (1 - ramp(t, pauseHold(b - fade, fade), fade));
var RECEDE = 0.6;
var thoughtJoins = (() => {
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
var pauseHold = (at, lasting = RECEDE) => {
  for (const [end, next] of thoughtJoins) if (at + lasting > end && at < next) return next;
  return at;
};
var thoughtEnd = (at) => {
  for (const [end] of thoughtJoins) if (end >= at) return end;
  return Infinity;
};
var HOLD = 0.05;
var SETTLE = 0.45;
var covered = (x) => x ** 3 - x ** 4 / 2;
var easings = (() => {
  const joins = thoughtJoins.map(([end, next]) => {
    const middle = (end + next) / 2;
    return { rest: Math.min(end + HOLD, middle), resume: Math.max(next - HOLD, middle) };
  });
  joins.forEach((j, k) => {
    j.down = Math.min(SETTLE, k ? (j.rest - joins[k - 1].resume) / 2 : j.rest);
    j.up = Math.min(SETTLE, k + 1 < joins.length ? (joins[k + 1].rest - j.resume) / 2 : SETTLE);
  });
  let taken = 0;
  for (const j of joins) {
    j.before = taken;
    taken += j.down / 2 + (j.resume - j.rest) + j.up / 2;
  }
  return joins;
})();
var voiceTime = (t) => {
  let lo = 0, hi = easings.length;
  while (lo < hi) {
    const mid = lo + hi >> 1;
    if (easings[mid].rest - easings[mid].down <= t) lo = mid + 1;
    else hi = mid;
  }
  if (!lo) return t;
  const { rest, resume, down, up, before } = easings[lo - 1];
  if (t < rest) return t - before - down * covered((t - rest + down) / down);
  if (t < resume) return t - before - down / 2 - (t - rest);
  if (t < resume + up) {
    const x = (t - resume) / up;
    return t - before - down / 2 - (resume - rest) - up * (x - covered(x));
  }
  return t - before - down / 2 - (resume - rest) - up / 2;
};

// picture/film/framing/camera.js
var CAMERA = {
  push: ["01", "03", "05", "07", "13", "17", "21", "24", "27", "29"],
  reveal: ["02", "04", "09", "12", "14", "18", "22", "26", "28"],
  drift: ["10", "11", "15", "16", "19", "20", "23", "25", "30"]
};
function cameraOf(s, t, amount = scenes[s.id]?.push ?? 0.02) {
  const cx = film.segments.indexOf(s) % 2 ? 840 : 1080, cy = 500;
  const from = voiceTime(s.start), q = ease(clamp((voiceTime(t) - from) / Math.max(1, voiceTime(s.end) - from)));
  if (CAMERA.drift.includes(s.id))
    return { k: 1 + amount * 0.5, ox: 960 + mix(-12, 12, q), oy: cy, ax: 960, ay: cy };
  const k = CAMERA.reveal.includes(s.id) ? 1 + amount * (1 - q) : CAMERA.push.includes(s.id) ? 1 + amount * q : 1;
  return { k, ox: cx, oy: cy, ax: cx, ay: cy };
}
function push(s, t) {
  const c = cameraOf(s, t);
  ctx.translate(c.ox, c.oy);
  ctx.scale(c.k, c.k);
  ctx.translate(-c.ax, -c.ay);
}
function across(s, t, x, y) {
  const a = cameraOf(film.segments[film.segments.indexOf(s) - 1], t), b = cameraOf(s, t);
  const sx = a.ox + a.k * (x - a.ax), sy = a.oy + a.k * (y - a.ay);
  return [b.ax + (sx - b.ox) / b.k, b.ay + (sy - b.oy) / b.k, a.k / b.k];
}

// picture/film/timing/stages.js
var STAGE_CUT = 0.18;
var stageCuts = /* @__PURE__ */ new Map();
var declareCut = (at) => {
  const id = layout.scene;
  if (id === null) return;
  const v = stageCuts.get(id) ?? /* @__PURE__ */ new Set();
  v.add(at);
  stageCuts.set(id, v);
};
var stageOut = (t, word) => {
  declareCut(word + STAGE_CUT);
  return t < word + STAGE_CUT ? 1 : 0;
};
var stageIn = (t, word) => {
  declareCut(word + STAGE_CUT);
  return t < word + STAGE_CUT ? 0 : 1;
};

// picture/film/timing/pace.js
var GLIDE_PEAK = 450;
var GLIDE_MIN = 0.6;
var smoother = (q) => {
  q = clamp(q);
  return q * q * q * (q * (q * 6 - 15) + 10);
};
var glideTime = (d, min = GLIDE_MIN) => Math.max(min, 1.875 * Math.abs(d) / GLIDE_PEAK);
var glide = (t, start, d, min = GLIDE_MIN) => smoother((voiceTime(t) - voiceTime(start)) / glideTime(d, min));
var DRAW_PACE = 820;
var drawTime = (length, least = 0.4) => Math.max(least, 1.5 * Math.abs(length) / DRAW_PACE);
var drawShare = (t, at, length, least = 0.4) => ease((voiceTime(t) - voiceTime(at)) / drawTime(length, least));
var pacedTo = (t, end, d, least = 0.35) => {
  const T = drawTime(d, least);
  return ease((voiceTime(t) - voiceTime(end) + T) / T);
};
var drawnShare = (draw, length, extent = 1) => extent * ease(
  (voiceTime(draw.t) - drawStart(draw, length * extent)) / drawTime(length * extent, draw.least ?? 0.4)
);
var LANDING = 0.15;
var landedShare = (draw, length, extent = 1) => {
  const time = drawTime(length * extent, draw.least ?? 0.4), landing = Math.min(LANDING, time);
  return ease((voiceTime(draw.t) - drawStart(draw, length * extent) - (time - landing)) / landing);
};
var WHOLE_BY = 0.3;
var drawStart = (draw, length) => {
  const v = voiceTime(draw.at), by = voiceTime(thoughtEnd(draw.at) - WHOLE_BY) - drawTime(length, draw.least ?? 0.4);
  if (by >= v) return v;
  const cuts = [...stageCuts.get(layout.scene) ?? []].filter((c) => c <= draw.at + 1e-6);
  return Math.min(v, Math.max(by, voiceTime(Math.max(clauseStart(draw.at), ...cuts))));
};

// picture/film/drawing/strokes.js
function font(size, bold, sample) {
  const latin = !/[一-鿿]/u.test(sample);
  return `${bold ? "700 " : ""}${size}px ${latin ? bold ? "DDWGLatinBold" : "DDWGLatin" : bold ? "DDWGBold" : "DDWG"}`;
}
var labelSize = (size) => size * TYPE;
var typeset = (v) => v.replaceAll("'", "’");
function measure(v, size = LABEL, bold = false, role = "label") {
  v = typeset(v);
  ctx.save();
  ctx.font = font(role === "label" ? labelSize(size) : size, bold, v);
  const w = ctx.measureText(v).width;
  ctx.restore();
  return w;
}
function text(v, x, y, size = LABEL, {
  color = P.ink,
  alpha = 1,
  align = "left",
  bold = false,
  baseline = "middle",
  role = "label",
  tracking = 0,
  group = null,
  whole = null,
  set = null
} = {}) {
  if (alpha < 0.015 || !v) return null;
  v = typeset(v);
  whole = whole === null ? null : typeset(whole);
  ctx.save();
  ctx.globalAlpha = clamp(alpha) * wordFade;
  ctx.font = font(role === "label" ? labelSize(size) : size, bold, v);
  ctx.letterSpacing = `${tracking}px`;
  ctx.textAlign = align;
  ctx.textBaseline = baseline;
  ctx.fillStyle = color;
  ctx.fillText(v, x, y);
  const m = ctx.measureText(v), tr = ctx.getTransform();
  const box2 = [
    x - m.actualBoundingBoxLeft,
    y - m.actualBoundingBoxAscent,
    x + m.actualBoundingBoxRight,
    y + m.actualBoundingBoxDescent
  ];
  const toScreen = (px, py) => [
    (tr.a * px + tr.c * py + tr.e) / resolution,
    (tr.b * px + tr.d * py + tr.f) / resolution
  ];
  const [x0, y0] = toScreen(box2[0], box2[1]), [x1, y1] = toScreen(box2[2], box2[3]);
  ctx.restore();
  const record = {
    text: v,
    bounds: [Math.min(x0, x1), Math.min(y0, y1), Math.max(x0, x1), Math.max(y0, y1)],
    alpha: clamp(alpha) * wordFade,
    role,
    scene: layout.scene,
    color,
    group,
    whole: whole ?? v,
    placed: whole !== null,
    size,
    set
  };
  layout.texts.push(record);
  return record;
}
var STRUCTURE = /* @__PURE__ */ new Set([P.line, P.muted]);
function stroke(build, { color = P.line, width = 2, alpha = 1, dash = null, cap = "round" } = {}) {
  if (alpha < 0.01) return;
  const structure = STRUCTURE.has(color), a = structure ? 1 - (1 - clamp(alpha)) ** 2 : clamp(alpha);
  ctx.save();
  ctx.globalAlpha = a * sceneFade;
  ctx.strokeStyle = color;
  ctx.lineWidth = structure ? Math.max(2, width) : width;
  ctx.lineCap = cap;
  ctx.lineJoin = "round";
  if (dash) ctx.setLineDash(dash);
  ctx.beginPath();
  build();
  ctx.stroke();
  ctx.restore();
}
function fill(build, { color = P.row, alpha = 1 } = {}) {
  if (alpha < 0.01) return;
  ctx.save();
  ctx.globalAlpha = clamp(alpha) * sceneFade;
  ctx.fillStyle = color;
  ctx.beginPath();
  build();
  ctx.fill();
  ctx.restore();
}
var line = (x1, y1, x2, y2, o = {}) => stroke(() => {
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
}, o);
var dashed = (x1, y1, x2, y2, o = {}) => line(x1, y1, x2, y2, { dash: [8, 9], ...o });
function box(x, y, w, h, { fill: f = null, stroke: s = null, width = 2, alpha = 1, radius = 8, dash = null } = {}) {
  if (f) fill(() => ctx.roundRect(x, y, w, h, radius), { color: f, alpha });
  if (s) stroke(() => ctx.roundRect(x, y, w, h, radius), { color: s, width, alpha, dash });
}
function dot(x, y, r, { color = P.evidence, alpha = 1, hollow = false, width = 2 } = {}) {
  if (hollow) stroke(() => ctx.arc(x, y, r, 0, Math.PI * 2), { color, alpha, width });
  else fill(() => ctx.arc(x, y, r, 0, Math.PI * 2), { color, alpha });
}
function path(points, { upto = 1, draw = null, ...o } = {}) {
  if (points.length < 2) return;
  if (draw) upto = drawnShare(draw, lengthOf(points), clamp(upto));
  if (upto <= 0) return;
  const drawn = upto >= 1 ? points : along(points, upto).kept;
  if (drawn.length < 2) return;
  stroke(() => drawn.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)), {
    width: 2.5,
    color: P.ink,
    ...o
  });
}
function diamond(x, y, r, { color = P.evidence, alpha = 1, solid = false, width = 2.5 } = {}) {
  const build = () => {
    ctx.moveTo(x, y - r);
    ctx.lineTo(x + r, y);
    ctx.lineTo(x, y + r);
    ctx.lineTo(x - r, y);
    ctx.closePath();
  };
  if (solid) fill(build, { color, alpha });
  else stroke(build, { color, alpha, width });
}
var lengthOf = (points) => points.slice(1).reduce((sum, pt, i) => sum + Math.hypot(pt[0] - points[i][0], pt[1] - points[i][1]), 0);
function along(points, q) {
  const lengths = points.slice(1).map((pt, i) => Math.hypot(pt[0] - points[i][0], pt[1] - points[i][1])), total = lengths.reduce((a, b) => a + b, 0);
  let left = clamp(q) * total;
  const kept = [points[0]];
  for (let i = 0; i < lengths.length; i++) {
    if (left >= lengths[i]) {
      kept.push(points[i + 1]);
      left -= lengths[i];
      continue;
    }
    const f = lengths[i] ? left / lengths[i] : 0, a = points[i], b = points[i + 1];
    kept.push([a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f]);
    break;
  }
  return { point: kept.at(-1), kept };
}

// picture/film/framing/captions.js
var CAPTION_JOIN = 0.3;
function caption(t) {
  const caps = film.captions;
  const joined = (a2, b) => a2 && b && b.start - a2.end <= CAPTION_JOIN;
  let i = caps.findIndex((v) => v.start <= t && t < v.end);
  if (i < 0)
    i = caps.findIndex((v, k) => v.end <= t && t < caps[k + 1]?.start && joined(v, caps[k + 1]));
  if (i < 0) return;
  const c = caps[i];
  const a = (joined(caps[i - 1], c) ? 1 : ramp(t, c.start - 0.04, 0.12)) * (joined(c, caps[i + 1]) ? 1 : 1 - ramp(t, c.end - 0.1, 0.1));
  text((c.display_text ?? c.text).trim(), 960, 970, 26, {
    align: "center",
    color: P.ink,
    alpha: 0.94 * Math.max(a, 1e-3),
    role: "caption"
  });
}

// picture/film/drawing/levels.js
var SECOND = 0.74;
var MUTED_SECOND = 0.83;
var mutedLevel = (a) => a < SECOND ? a * MUTED_SECOND / SECOND : mix(MUTED_SECOND, 1, (a - SECOND) / (1 - SECOND));
var MARK_LEVEL = { [P.authority]: 0.62, [P.evidence]: 0.69, [P.unknown]: 0.89 };
var restMark = (color, level = 0) => Math.max(level, MARK_LEVEL[color] ?? 0);
var markLevel = (color, level) => mix(restMark(color), 1, clamp((level - SECOND) / (1 - SECOND)));
var secondStroke = (color, alpha, share) => color in MARK_LEVEL ? Math.min(alpha, MARK_LEVEL[color]) : alpha * share;

// picture/film/drawing/symbols.js
function token(x, y, { color = P.ink, alpha = 1, r = 14, hollow = false } = {}) {
  dot(x, y, r, { color, alpha, hollow, width: 3 });
  if (!hollow) ring(x, y, r + 7, { color, alpha: secondStroke(color, alpha, 0.45), width: 2 });
}
function lock(x, y, { closed = 1, color = P.authority, alpha = 1, size = 1 } = {}) {
  const w = 34 * size, h = 26 * size, lift = (1 - ease(closed)) * 12 * size;
  box(x - w / 2, y - h / 2, w, h, {
    fill: P.row,
    stroke: color,
    alpha,
    radius: 5 * size,
    width: 2.5
  });
  stroke(() => ctx.arc(x, y - h / 2 - lift, w * 0.32, Math.PI, 0), {
    color,
    alpha,
    width: 3 * size
  });
  dot(x, y + 1, 3.5 * size, { color, alpha });
}
function clock(x, y, r, { hand = 0, color = P.ink, alpha = 1 } = {}) {
  ring(x, y, r, { color, alpha, width: 2.5 });
  const a = -Math.PI / 2 + Math.PI * 2 * hand;
  line(x, y, x + r * 0.75 * Math.cos(a), y + r * 0.75 * Math.sin(a), { color, alpha, width: 3 });
  line(x, y, x, y - r * 0.5, { color, alpha: secondStroke(color, alpha, 0.6), width: 2 });
}
function shield(x, y, r, { color = P.evidence, alpha = 1, fillColor = null } = {}) {
  const build = () => {
    ctx.moveTo(x, y - r);
    ctx.lineTo(x + r * 0.85, y - r * 0.62);
    ctx.lineTo(x + r * 0.72, y + r * 0.35);
    ctx.quadraticCurveTo(x + r * 0.4, y + r * 0.85, x, y + r);
    ctx.quadraticCurveTo(x - r * 0.4, y + r * 0.85, x - r * 0.72, y + r * 0.35);
    ctx.lineTo(x - r * 0.85, y - r * 0.62);
    ctx.closePath();
  };
  if (fillColor) fill(build, { color: fillColor, alpha });
  stroke(build, { color, alpha, width: 2.5 });
}
function seal(x, y, r, { color = P.authority, alpha = 1, hollow = false, stamp = alpha } = {}) {
  ring(x, y, r, { color, alpha, width: 3 });
  ring(x, y, r * 0.74, {
    color,
    alpha: secondStroke(color, stamp, 0.6),
    width: 1.5,
    dash: hollow ? [5, 5] : null
  });
  if (!hollow) check(x, y + r * 0.05, r * 0.8, { color, alpha: stamp });
}
function person(x, y, { color = P.ink, alpha = 1, size = 1, solid = true } = {}) {
  const r = 15 * size, fillQ = solid === true ? 1 : solid === false ? 0 : clamp(solid);
  if (fillQ < 1)
    dot(x, y - r * 1.15, r, { color, alpha: alpha * (1 - fillQ), hollow: true, width: 2.5 });
  if (fillQ > 0) dot(x, y - r * 1.15, r, { color, alpha: alpha * fillQ });
  stroke(() => ctx.arc(x, y + r * 1.9, r * 1.55, Math.PI * 1.08, Math.PI * 1.92), {
    color,
    alpha,
    width: 3 * size
  });
}
function agent(x, y, { alpha = 1, size = 1, color = P.evidence } = {}) {
  diamond(x, y, 22 * size, { color, alpha });
  dot(x, y, 4.5 * size, { color, alpha });
}
function documentIcon(x, y, w, h, { alpha = 1, stroke: s = P.ink, rows = 4, fillColor = P.row, fold = true } = {}) {
  if (alpha < 0.01) return;
  const c = Math.min(22, w * 0.2);
  fill(
    () => {
      ctx.moveTo(x, y);
      ctx.lineTo(x + w - c, y);
      ctx.lineTo(x + w, y + c);
      ctx.lineTo(x + w, y + h);
      ctx.lineTo(x, y + h);
      ctx.closePath();
    },
    { color: fillColor, alpha }
  );
  stroke(
    () => {
      ctx.moveTo(x, y);
      ctx.lineTo(x + w - c, y);
      ctx.lineTo(x + w, y + c);
      ctx.lineTo(x + w, y + h);
      ctx.lineTo(x, y + h);
      ctx.closePath();
    },
    { color: s, alpha, width: 2 }
  );
  if (fold)
    stroke(
      () => {
        ctx.moveTo(x + w - c, y);
        ctx.lineTo(x + w - c, y + c);
        ctx.lineTo(x + w, y + c);
      },
      { color: s, alpha, width: 1.5 }
    );
  for (let i = 0; i < rows; i++) {
    const ry = y + h * (0.3 + i * 0.55 / Math.max(1, rows));
    line(x + w * 0.14, ry, x + w * (i % 2 ? 0.62 : 0.82), ry, {
      color: P.muted,
      alpha: alpha * 0.8,
      width: 2
    });
  }
}
function check(x, y, s, { color = P.evidence, alpha = 1, upto = 1, draw = null, width = 3.5 } = {}) {
  path(
    [
      [x - s * 0.5, y],
      [x - s * 0.12, y + s * 0.38],
      [x + s * 0.55, y - s * 0.42]
    ],
    { color, alpha, upto, draw, width }
  );
}
function cross(x, y, s, { color = P.unknown, alpha = 1, width = 3.5 } = {}) {
  line(x - s / 2, y - s / 2, x + s / 2, y + s / 2, { color, alpha, width });
  line(x + s / 2, y - s / 2, x - s / 2, y + s / 2, { color, alpha, width });
}
function stopSign(x, y, r, { alpha = 1, color = P.unknown } = {}) {
  const build = () => {
    for (let i = 0; i < 8; i++) {
      const a = Math.PI / 8 + i * Math.PI / 4;
      const px = x + r * Math.cos(a), py = y + r * Math.sin(a);
      i ? ctx.lineTo(px, py) : ctx.moveTo(px, py);
    }
    ctx.closePath();
  };
  stroke(build, { color, alpha, width: 3 });
  line(x - r * 0.45, y, x + r * 0.45, y, { color, alpha, width: 4 });
}
function ring(x, y, r, {
  color = P.evidence,
  alpha = 1,
  width = 2,
  upto = 1,
  draw = null,
  start = -Math.PI / 2,
  dash = null
} = {}) {
  if (draw) upto = drawnShare(draw, 2 * Math.PI * r, clamp(upto));
  if (upto <= 0) return;
  stroke(() => ctx.ellipse(x, y, r, r, start, 0, Math.PI * 2 * clamp(upto)), {
    color,
    alpha,
    width,
    dash
  });
}
function pill(label, x, y, {
  alpha = 1,
  ink = null,
  color = P.ink,
  border = P.line,
  fillColor = P.row,
  size = LABEL,
  align = "center",
  padX = 18,
  h = null,
  bold = false,
  dash = null,
  dashed: dashed2 = null,
  group = null,
  role = "label"
} = {}) {
  if (alpha < 0.015) return null;
  const w = measure(label, size, bold, role) + padX * 2, height = h ?? size * TYPE + 22;
  const left = align === "center" ? x - w / 2 : align === "right" ? x - w : x;
  box(left, y - height / 2, w, height, { fill: fillColor, alpha, radius: height / 2 });
  if (dashed2 === null)
    box(left, y - height / 2, w, height, { stroke: border, alpha, radius: height / 2, dash });
  else {
    box(left, y - height / 2, w, height, {
      stroke: border,
      alpha: alpha * (1 - clamp(dashed2)),
      radius: height / 2
    });
    box(left, y - height / 2, w, height, {
      stroke: border,
      alpha: alpha * clamp(dashed2),
      radius: height / 2,
      dash: dash ?? [6, 6]
    });
  }
  text(label, left + w / 2, y + 1, size, {
    align: "center",
    color,
    alpha: ink ?? alpha,
    bold,
    group,
    role
  });
  return { left, right: left + w, top: y - height / 2, bottom: y + height / 2, width: w };
}

// picture/film/framing/chapters.js
var chapterOrder = film.chapters.map((c) => c.id);
var chapterNumber = (id) => String(chapterOrder.indexOf(id) + 1).padStart(2, "0");
var opensChapter = (s) => {
  const i = film.segments.indexOf(s);
  return i > 0 && film.segments[i - 1].chapter !== s.chapter;
};
var opening = (s) => opensChapter(s) ? Math.max(s.start, s.voice_start - 0.75) : s.start - 0.25;
var titleY = (s, t) => mix(540, 72, ease(clamp((t - (cardLanding(s) - RISE)) / RISE)));
var clearOfTitle = (s, t, y = 400) => {
  if (!opensChapter(s)) return 1;
  const c = cameraOf(s, t);
  return clamp((c.oy + c.k * (y - c.ay) - 45 - titleY(s, t)) / 60);
};
var cardLanding = (s) => s.voice_start + 0.1;
var RISE = 1.1;
var HEAD_INK = 0.8;
function chapterCard(s, t) {
  if (!opensChapter(s) || t >= cardLanding(s)) return;
  const enter = ramp(t, s.start, 0.3);
  if (enter <= 0) return;
  const chapter = film.chapters.find((c) => c.id === s.chapter), number = chapterNumber(s.chapter);
  const large = en ? 54 : 60, p = clamp((t - (cardLanding(s) - RISE)) / RISE), q = ease(p), size = mix(large, 24, q);
  ctx.save();
  ctx.font = font(24, false, `${number}  ${chapter.title}`);
  const prefix = ctx.measureText(`${number}  `).width;
  ctx.restore();
  const gap = prefix * size / 24, total = gap + measure(chapter.title, size, false, "chapter");
  const left = mix(960 - total / 2, 96, q), y = mix(540, 72, q), ink = mix(1, HEAD_INK, q) * enter;
  text(number, left, y, size, {
    color: blend(P.evidence, P.muted, q),
    alpha: ink,
    role: "chapter"
  });
  text(chapter.title, left + gap, y, size, {
    color: blend(P.ink, P.muted, q),
    alpha: ink,
    role: "chapter"
  });
  line(900, 600, 1020, 600, {
    color: P.line,
    alpha: enter * (1 - ramp(t, cardLanding(s) - RISE, 0.35))
  });
}
function illustrative(alpha) {
  if (alpha < 0.015 || measuring) return;
  ctx.save();
  ctx.setTransform(resolution, 0, 0, resolution, 0, 0);
  pill(L("示意", "Illustrative"), 1824, 74, {
    alpha,
    color: P.muted,
    border: P.line,
    size: 22 * TYPE,
    align: "right",
    padX: 14,
    h: 36,
    role: "marker"
  });
  ctx.restore();
}
function runningHead(s, t) {
  if (t < film.segments[0].voice_start) return;
  const first = film.segments.find((v) => v.chapter === s.chapter);
  const a = HEAD_INK * (first === film.segments[0] ? ramp(t, first.voice_start, 0.6) : t >= cardLanding(first) ? 1 : 0);
  const chapter = film.chapters.find((c) => c.id === s.chapter);
  text(`${chapterNumber(s.chapter)}  ${chapter.title}`, 96, 72, 24, {
    color: P.muted,
    alpha: a,
    role: "chapter"
  });
}

// picture/film/framing/measuring.js
function measuringContext() {
  let m = [1, 0, 0, 1, 0, 0], path2 = [], last = [0, 0];
  const stack = [], marks = { strong: null, seen: null };
  const keys = [
    "globalAlpha",
    "strokeStyle",
    "fillStyle",
    "lineWidth",
    "lineCap",
    "lineJoin",
    "font",
    "textAlign",
    "textBaseline",
    "letterSpacing"
  ];
  const tx = (x, y) => [m[0] * x + m[2] * y + m[4], m[1] * x + m[3] * y + m[5]];
  const by = (b) => {
    const a = m;
    m = [
      a[0] * b[0] + a[2] * b[1],
      a[1] * b[0] + a[3] * b[1],
      a[0] * b[2] + a[2] * b[3],
      a[1] * b[2] + a[3] * b[3],
      a[0] * b[4] + a[2] * b[5] + a[4],
      a[1] * b[4] + a[3] * b[5] + a[5]
    ];
  };
  const add = (key, [x, y]) => {
    const e = marks[key] ?? (marks[key] = [x, y, x, y]);
    e[0] = Math.min(e[0], x);
    e[1] = Math.min(e[1], y);
    e[2] = Math.max(e[2], x);
    e[3] = Math.max(e[3], y);
  };
  const sizeOf = () => Number(/(\d+(?:\.\d+)?)px/.exec(meter.font)?.[1] ?? 30);
  const widthOf = (v) => [...v].reduce(
    (w, ch) => w + (/[\u4e00-\u9fff\u3000-\u303f\uff00-\uffef]/u.test(ch) ? 1.02 : /[A-Z]/.test(ch) ? 0.72 : 0.6),
    0
  ) * sizeOf();
  function paint(color, points) {
    if (meter.globalAlpha <= 0.15) return;
    const strong = contrastOf(color, meter.globalAlpha) >= 3;
    for (const point of points) {
      add("seen", point);
      if (strong) add("strong", point);
    }
  }
  function arcPoints(x, y, rx, ry, a0, a1) {
    const n = Math.max(4, Math.ceil(Math.abs(a1 - a0) / (Math.PI / 12)));
    for (let i = 0; i <= n; i++) {
      const a = a0 + (a1 - a0) * i / n;
      path2.push(tx(x + rx * Math.cos(a), y + ry * Math.sin(a)));
    }
    last = [x + rx * Math.cos(a1), y + ry * Math.sin(a1)];
  }
  const meter = {
    marks,
    globalAlpha: 1,
    strokeStyle: "#000000",
    fillStyle: "#000000",
    lineWidth: 1,
    lineCap: "butt",
    lineJoin: "miter",
    font: "30px DDWG",
    textAlign: "left",
    textBaseline: "middle",
    letterSpacing: "0px",
    save() {
      stack.push([m, keys.map((k) => meter[k])]);
    },
    restore() {
      const [saved, values] = stack.pop();
      m = saved;
      keys.forEach((k, i) => {
        meter[k] = values[i];
      });
    },
    setTransform(a, b, c, d, e, f) {
      m = [a, b, c, d, e, f];
    },
    getTransform() {
      return { a: m[0], b: m[1], c: m[2], d: m[3], e: m[4], f: m[5] };
    },
    translate(x, y) {
      by([1, 0, 0, 1, x, y]);
    },
    scale(x, y) {
      by([x, 0, 0, y, 0, 0]);
    },
    setLineDash() {
    },
    fillRect() {
    },
    beginPath() {
      path2 = [];
    },
    closePath() {
    },
    moveTo(x, y) {
      path2.push(tx(x, y));
      last = [x, y];
    },
    lineTo(x, y) {
      path2.push(tx(x, y));
      last = [x, y];
    },
    arc(x, y, r, a0, a1) {
      arcPoints(x, y, r, r, a0, a1);
    },
    ellipse(x, y, rx, ry, rotation, a0, a1) {
      arcPoints(x, y, rx, ry, a0, a1);
    },
    quadraticCurveTo(cx, cy, x, y) {
      const [x0, y0] = last;
      for (let i = 1; i <= 8; i++) {
        const q = i / 8, u = 1 - q;
        path2.push(
          tx(u * u * x0 + 2 * u * q * cx + q * q * x, u * u * y0 + 2 * u * q * cy + q * q * y)
        );
      }
      last = [x, y];
    },
    roundRect(x, y, w, h) {
      path2.push(tx(x, y), tx(x + w, y), tx(x + w, y + h), tx(x, y + h));
      last = [x, y];
    },
    stroke() {
      paint(meter.strokeStyle, path2);
    },
    fill() {
      paint(meter.fillStyle, path2);
    },
    measureText(v) {
      const size = sizeOf(), width = widthOf(v), left = meter.textAlign === "center" ? width / 2 : meter.textAlign === "right" ? width : 0;
      const ascent = meter.textBaseline === "top" ? 0 : meter.textBaseline === "middle" ? size * 0.52 : size * 0.8;
      const descent = meter.textBaseline === "top" ? size * 1.05 : meter.textBaseline === "middle" ? size * 0.52 : size * 0.22;
      return {
        width,
        actualBoundingBoxLeft: left,
        actualBoundingBoxRight: width - left,
        actualBoundingBoxAscent: ascent,
        actualBoundingBoxDescent: descent
      };
    },
    fillText(v, x, y) {
      const b = meter.measureText(v);
      paint(meter.fillStyle, [
        tx(x - b.actualBoundingBoxLeft, y - b.actualBoundingBoxAscent),
        tx(x + b.actualBoundingBoxRight, y + b.actualBoundingBoxDescent)
      ]);
    }
  };
  return meter;
}

// picture/film/framing/titles.js
function titleSignature(alpha, signed = alpha) {
  text("DDWG", 237, 300, 300, { bold: true, tracking: -4, alpha, baseline: "top", role: "title" });
  line(260, 652, 1624, 652, { color: P.line, width: 2, alpha });
  text(L("数据部门工作指南", "Data Department Work Guidelines"), 260, 724, en ? 42 : 50, {
    alpha,
    role: "title"
  });
  text("Yang HENG", 1624, 846, 34, { align: "right", alpha: signed, role: "title" });
}
function credits(t) {
  const start = film.duration - film.credits_duration;
  const a = ramp(t, start, 0.5);
  titleSignature(a, ramp(t, start + 0.2, 0.5));
  text(L("旁白为合成语音", "Narration: synthetic voice"), 1624, 902, 24, {
    align: "right",
    color: P.muted,
    alpha: ramp(t, start + 0.1, 0.35),
    role: "title"
  });
}

// picture/film/naming/names.js
var NAME_GAP = 22;
var LEADING = 1.3;
var LEADS = new Set(
  "a an the of in on at by to for with from into onto over under about after before between through without within against per via as than like and or but nor its their his her our your my this that these those each every any no some which who whose whom what when where why how whether if because although though while unless until since is are was were be been can will would should may must not".split(" ")
);
var lastWord = (v) => (v.trim().split(/\s+/).at(-1) ?? "").toLowerCase().replaceAll("’", "'").replace(/^[^\p{L}\p{N}']+|[^\p{L}\p{N}']+$/gu, "");
var phraseBreaks = (lines) => lines.slice(0, -1).every((v) => !LEADS.has(lastWord(v))) && (lines.join(" ").trim().split(/\s+/).length < 3 || lines.at(-1).trim().split(/\s+/).length > 1);
function inkWidth(v, size = LABEL) {
  v = typeset(v);
  ctx.save();
  ctx.font = font(labelSize(size), false, v);
  const m = ctx.measureText(v);
  ctx.restore();
  return m.actualBoundingBoxLeft + m.actualBoundingBoxRight;
}
function evenBlock(lines, size = LABEL) {
  const widths = lines.map((v) => inkWidth(v, size)), top = Math.max(...widths);
  return widths.slice(0, -1).every((w) => w >= 0.8 * top) && widths.at(-1) >= 0.6 * top;
}
function runStarts(count, n, from = 0) {
  if (n === 1) return from < count ? [[from]] : [];
  const out = [];
  for (let k = from + 1; k <= count - n + 1; k++)
    for (const rest of runStarts(count, n - 1, k)) out.push([from, ...rest]);
  return out;
}
var NAME_JOINT = /[、，。；：,]$/u;
var CLAUSE_JOINT = /[，。；：,]$/u;
function wrapName(v, width, size = LABEL) {
  if (Array.isArray(v)) return v;
  if (typeof v === "string" && v.includes("\n")) return v.split("\n");
  if (!Number.isFinite(width) || measure(v, size) <= width) return [v];
  const latin = !/[一-鿿]/u.test(v), tokens = latin ? v.split(/(?<= )/) : [...v], splits = [];
  for (let k = 1; k < tokens.length; k++) {
    const a = tokens.slice(0, k).join("").trimEnd(), b = tokens.slice(k).join("").trimStart();
    if (!a || !b || /^[、，。；：）”]/u.test(b)) continue;
    splits.push({
      a,
      b,
      joint: !latin && NAME_JOINT.test(a),
      worst: Math.max(measure(a, size), measure(b, size))
    });
  }
  const joints = splits.filter((s) => s.joint), fitting = joints.filter((s) => s.worst <= width);
  const clauses = fitting.filter((s) => CLAUSE_JOINT.test(s.a));
  const pool = clauses.length ? clauses : fitting.length ? fitting : joints.length ? joints : splits;
  if (!pool.length) return [v];
  const narrowest = (list) => list.reduce((x, s) => s.worst < x.worst ? s : x);
  const even = latin || pool === splits ? [] : pool.filter((s) => s.worst <= width && evenBlock([s.a, s.b], size));
  const best = narrowest(even.length ? even : pool);
  let lines;
  if (best.worst <= width || tokens.length < 3) lines = [best.a, best.b];
  else {
    const [head, ...rest] = wrapName(best.a, width, size);
    lines = [head, ...wrapName([...rest, best.b].join(latin ? " " : ""), width, size)];
  }
  if (!latin || tokens.length > 16 || phraseBreaks(lines) && evenBlock(lines, size)) return lines;
  const options = runStarts(tokens.length, lines.length).map(
    (starts) => starts.map(
      (k, i) => tokens.slice(k, starts[i + 1]).join("").trim()
    )
  ).filter((ls) => phraseBreaks(ls) && ls.every((line2) => measure(line2, size) <= width)).map((ls) => ({
    ls,
    even: evenBlock(ls, size),
    worst: Math.max(...ls.map((line2) => measure(line2, size)))
  }));
  if (!options.length) return lines;
  const kept = options.filter((o) => o.even);
  return (kept.length ? kept : options).reduce((x, o) => o.worst < x.worst ? o : x).ls;
}
var hangOf = (line2, align, size = LABEL) => /[、，。；：！？]$/u.test(line2) ? (align === "right" ? 0.5 : align === "center" ? 0.3 : 0) * labelSize(size) : 0;
function nameText(v, x, y, { width = Infinity, size = LABEL, valign = "middle", align = "center", ...o } = {}) {
  const lines = Array.isArray(v) ? v : wrapName(v, width, size), em = labelSize(size), step = em * LEADING;
  const top = valign === "top" ? y + em / 2 : valign === "bottom" ? y - em / 2 - step * (lines.length - 1) : y - step * (lines.length - 1) / 2;
  lines.forEach(
    (line2, k) => text(line2, x + hangOf(line2, align, size), top + k * step, size, {
      align,
      ...o,
      whole: lines.join(" ")
    })
  );
  return { lines, top: top - em / 2, bottom: top + step * (lines.length - 1) + em / 2 };
}

// picture/film/drawing/datasets.js
var PRICES = ["101.18", "100.94", "101.37", "101.06"];
var REPORT_ROW = (i, scale = 1) => (119 + i * 66) * scale;
function reportCard(x, y, { alpha = 1, scale = 1, highlight = 0, unknown = 0, done = 0, rows = PRICES, named: named2 = alpha } = {}) {
  if (alpha < 0.01) return;
  const w = 300 * scale, h = 360 * scale, inset = 28 * scale, head = y + 45 * scale, rule = y + 73 * scale;
  box(x, y, w, h, { fill: P.row, alpha, radius: 10 });
  box(x, y, w, h, { stroke: P.ink, alpha: alpha * 0.9, radius: 10 });
  line(x + inset, rule, x + w - inset, rule, { color: P.line, alpha, width: 2 });
  nameText(L("历史价格", "Price history"), x + inset, head, {
    align: "left",
    color: P.muted,
    alpha: named2
  });
  stroke(
    () => rows.forEach((_, i) => {
      ctx.moveTo(x + inset, y + REPORT_ROW(i, scale));
      ctx.lineTo(x + 120 * scale, y + REPORT_ROW(i, scale));
    }),
    { color: P.line, alpha, width: 2 }
  );
  rows.forEach((value, i) => {
    const ry = y + REPORT_ROW(i, scale), hot = i === 2, tone = blend(P.evidence, P.unknown, unknown);
    if (hot && highlight > 0)
      line(x + 14 * scale, ry - 20 * scale, x + 14 * scale, ry + 20 * scale, {
        color: tone,
        alpha: alpha * highlight,
        width: 4
      });
    text(value, x + w - inset, ry + 1, 26, {
      role: "mark",
      align: "right",
      alpha: hot ? alpha : alpha * mix(1, 0.51, highlight),
      color: hot ? blend(blend(P.ink, P.evidence, highlight), P.unknown, unknown) : P.ink
    });
  });
  const s = 26 * scale;
  if (done > 0)
    check(x + w - inset - s * 0.55 - 1.75, head, s, { color: P.evidence, alpha, upto: done });
}
function tableIcon(x, y, w, h, { alpha = 1, stroke: s = P.ink, rows = 4, cols = 3, joined = false } = {}) {
  if (alpha < 0.01) return;
  box(x, y, w, h, { fill: P.row, stroke: s, alpha, radius: 8 });
  if (joined) {
    stroke(
      () => {
        for (let r = 1; r < rows; r++) {
          ctx.moveTo(x, y + h * r / rows);
          ctx.lineTo(x + w, y + h * r / rows);
        }
        for (let c = 1; c < cols; c++) {
          ctx.moveTo(x + w * c / cols, y);
          ctx.lineTo(x + w * c / cols, y + h);
        }
      },
      { alpha, width: 1.5 }
    );
    return;
  }
  for (let r = 1; r < rows; r++)
    line(x, y + h * r / rows, x + w, y + h * r / rows, { color: P.line, alpha, width: 1.5 });
  for (let c = 1; c < cols; c++)
    line(x + w * c / cols, y, x + w * c / cols, y + h, { color: P.line, alpha, width: 1.5 });
}
function s13Table(x, y, w, h, { alpha = 1, stroke: s = P.ink, rows = 4, cols = 3, values = false } = {}) {
  if (alpha < 0.01) return;
  box(x, y, w, h, { fill: P.row, stroke: s, alpha, radius: 8 });
  stroke(
    () => {
      for (let r = 1; r < rows; r++) {
        ctx.moveTo(x, y + h * r / rows);
        ctx.lineTo(x + w, y + h * r / rows);
      }
      for (let c = 1; c < cols; c++) {
        ctx.moveTo(x + w * c / cols, y);
        ctx.lineTo(x + w * c / cols, y + h);
      }
    },
    { alpha, width: 1.5 }
  );
  if (values)
    stroke(
      () => {
        for (let r = 0; r < rows; r++)
          for (let c = 0; c < cols; c++) {
            const vx = x + w * (c + 0.2) / cols, vy = y + h * (r + 0.5) / rows;
            ctx.moveTo(vx, vy);
            ctx.lineTo(vx + w / cols * ((r + c) % 2 ? 0.45 : 0.6), vy);
          }
      },
      { color: P.muted, alpha: alpha * 0.8, width: 2 }
    );
}

// picture/film/drawing/flows.js
var pass = (q, edge = 0.12) => clamp(q / edge) * clamp((1 - q) / edge);
var FLOW_EDGE = 24;
var flowDot = (x, y, r, q, o, length = Infinity) => {
  const size = r * pass(q, Math.min(0.5, Math.max(0.12, FLOW_EDGE / length)));
  if (size >= 1.5) dot(x, y, size, o);
};
var FLOW_PACE = 160;
var FLOW_GAP = 1 / 30;
var loopPhase = (flowing, length, lag = 0, last = Infinity) => {
  if (flowing === null || !(length >= 1)) return null;
  const travel = length / FLOW_PACE, period = travel + FLOW_GAP, run = flowing - lag * period;
  if (run < 0 || last === null || run - run % period + lag * period > last) return null;
  const u = run % period;
  return u < travel ? u / travel : null;
};
var since = (t, from) => t >= from ? voiceTime(t) - voiceTime(from) : null;

// picture/film/drawing/links.js
function rounded(corners, r) {
  const out = [corners[0]];
  for (let i = 1; i < corners.length - 1; i++) {
    const [ax, ay] = corners[i - 1], [bx, by] = corners[i], [cx2, cy2] = corners[i + 1];
    const d1 = Math.hypot(bx - ax, by - ay), d2 = Math.hypot(cx2 - bx, cy2 - by);
    if (d1 < 1e-6 || d2 < 1e-6) continue;
    const k = Math.min(r, d1 / 2, d2 / 2), p = [bx - (bx - ax) / d1 * k, by - (by - ay) / d1 * k], q = [bx + (cx2 - bx) / d2 * k, by + (cy2 - by) / d2 * k];
    for (let n = 0; n <= 6; n++) {
      const u = n / 6;
      out.push([
        (1 - u) ** 2 * p[0] + 2 * (1 - u) * u * bx + u * u * q[0],
        (1 - u) ** 2 * p[1] + 2 * (1 - u) * u * by + u * u * q[1]
      ]);
    }
  }
  out.push(corners.at(-1));
  return out;
}
function link(x1, y1, x2, y2, {
  route = null,
  mid = null,
  r = 14,
  color = P.line,
  alpha = 1,
  upto = 1,
  draw = null,
  width = 2,
  dash = null,
  flow = null,
  flowing = null,
  lag = 0,
  last = Infinity,
  span: span2 = null,
  fade = 1,
  end = true
} = {}) {
  if (alpha < 0.01 || upto <= 0 || Math.hypot(x2 - x1, y2 - y1) < 1) return;
  const kind = route ?? (Math.abs(x1 - x2) < 0.5 || Math.abs(y1 - y2) < 0.5 ? "straight" : "vhv");
  const m = mid ?? (kind === "vhv" ? (y1 + y2) / 2 : (x1 + x2) / 2);
  const corners = {
    straight: [
      [x1, y1],
      [x2, y2]
    ],
    vhv: [
      [x1, y1],
      [x1, m],
      [x2, m],
      [x2, y2]
    ],
    hvh: [
      [x1, y1],
      [m, y1],
      [m, y2],
      [x2, y2]
    ],
    vh: [
      [x1, y1],
      [x1, y2],
      [x2, y2]
    ],
    hv: [
      [x1, y1],
      [x2, y1],
      [x2, y2]
    ]
  }[kind];
  const points = rounded(corners, r), length = lengthOf(points), extent = clamp(upto);
  if (draw) upto = drawnShare(draw, length, extent);
  if (upto <= 0) return;
  const drawn = along(points, upto).kept;
  if (drawn.length > 1)
    stroke(() => drawn.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)), {
      color,
      alpha,
      width,
      dash
    });
  const arrived = draw && extent >= 1 ? landedShare(draw, length) : clamp((upto - 0.9) / 0.1);
  if (end) dot(x2, y2, (width + 2.5) * arrived, { color, alpha: alpha * arrived });
  if (flowing === null && flow === null) return;
  const way = span2 ?? length, q = flowing !== null ? loopPhase(flowing, way, lag, last) : flow;
  if (q !== null && q < upto && fade > 0.01) {
    const [px, py] = along(points, q).point;
    flowDot(px, py, width + 2, q, { color, alpha: alpha * fade }, way);
  }
}

// picture/film/naming/lists.js
var named = (t, at) => ramp(t, at - 0.15, 0.4);
var listLevel = (t, ats, i, until = Infinity) => {
  const last = ats.at(-1), said = pauseHold(Math.max(last + 1.5, (phraseEnd.get(last) ?? last) + 0.3), 0.4);
  const cut = Math.min(
    ...[...stageCuts.get(layout.scene) ?? []].filter((c) => c > last && c < thoughtEnd(last))
  );
  const end = Math.min(thoughtEnd(last), cut);
  const done = Math.min(said, Math.max(last - 0.1, end - 0.45)), back = Math.min(0.4, Math.max(0.15, end - 0.05 - done));
  const dims = i + 1 < ats.length && done - ats[i + 1] > 0.6;
  const level = i + 1 < ats.length ? mix(
    mix(1, SECOND, dims ? ramp(t, pauseHold(ats[i + 1] - 0.15, 0.3), 0.3) : 0),
    1,
    ramp(t, done, back)
  ) : 1;
  return level * (1 - ramp(t, pauseHold(until, 0.4), 0.4));
};
var listIn = (t, ats, i, until = Infinity) => ramp(t, ats[i] - 0.15, 0.4) * listLevel(t, ats, i, until);
var speaking = (t, ats, i) => {
  const until = i + 1 < ats.length ? ats[i + 1] - 0.15 : pauseHold(Math.max(ats[i] + 1.5, (phraseEnd.get(ats[i]) ?? ats[i]) + 0.3), 0.3);
  return ramp(t, ats[i] - 0.15, 0.3) * (1 - ramp(t, until, 0.3));
};
var saidShare = (t, ats) => ats.reduce((v, at) => v + soon(t, at + 0.05, 0.35), 0) / ats.length;
function beats(t, x, y, r, ats, { color = P.ink, alpha = 1, lit = 0 } = {}) {
  const flash = Math.max(
    0,
    ...ats.map((at) => {
      const p = clamp((t - at - 0.05) / 0.5);
      return p > 0 && p < 1 ? Math.sin(Math.PI * p) : 0;
    })
  );
  const level = Math.max(flash, lit);
  if (level > 0.02)
    ring(x, y, r, {
      color,
      alpha: alpha * restMark(color, 0.5) * level,
      width: Math.max(1, 3.5 * flash, lit > 0 ? 2 : 0)
    });
}
var building = (t, ats, step = 48, lead = 0.1) => step * ats.slice(1).reduce((v, at) => v + 1 - glide(t, at - lead, step), 0);

// picture/film/naming/parts.js
var lineCaches = /* @__PURE__ */ new WeakMap();
function growLines(parts, width = Infinity, size = LABEL) {
  const cache = lineCaches.get(ctx) ?? /* @__PURE__ */ new Map(), key = `${width}${size}${parts.join("")}`;
  lineCaches.set(ctx, cache);
  if (cache.has(key)) return cache.get(key);
  const greedy = [[]];
  parts.forEach((part, k) => {
    const line2 = greedy.at(-1);
    if (line2.length && measure([...line2.map((j) => parts[j]), part].join(""), size) > width)
      greedy.push([k]);
    else line2.push(k);
  });
  let lines = greedy;
  const n = greedy.length, span2 = (a, b) => measure(parts.slice(a, b).join(""), size), latin = !/[一-鿿]/u.test(parts.join(""));
  const lead = (v) => v.match(/^[、，,;；\s]+/u)?.[0] ?? "";
  const texts = (starts, ends) => starts.map(
    (a, i) => (i ? parts[a].slice(lead(parts[a]).length) : parts[a]) + parts.slice(a + 1, ends[i]).join("") + (i + 1 < starts.length ? lead(parts[starts[i + 1]]).replace(/\s+/gu, "") : "")
  );
  const widths = greedy.map((line2) => span2(line2[0], line2.at(-1) + 1)), painted = texts(
    greedy.map((line2) => line2[0]),
    greedy.map((line2) => line2.at(-1) + 1)
  );
  if (n > 1 && parts.length <= 16 && !((!latin || phraseBreaks(painted)) && evenBlock(painted, size))) {
    const options = runStarts(parts.length, n).map((starts) => {
      const ends = [...starts.slice(1), parts.length], ws = ends.map((end, i) => span2(starts[i], end));
      return {
        starts,
        ends,
        ls: texts(starts, ends),
        fit: ws.every((w, i) => w <= width || ends[i] - starts[i] === 1),
        worst: Math.max(...ws),
        spread: ws.reduce((sum, v) => sum + v * v, 0)
      };
    }).filter((o) => o.fit);
    const phrased = options.filter((o) => !latin || phraseBreaks(o.ls)), even = phrased.filter((o) => evenBlock(o.ls, size));
    const pool = even.length ? even : phrased.length ? phrased : widths.at(-1) < 0.4 * Math.max(...widths) ? options : [];
    const seed = pool === phrased ? pool.find((o) => o.starts.join() === greedy.map((line2) => line2[0]).join()) ?? null : null;
    const best = pool.reduce(
      (x, o) => !x || o.worst < x.worst - 0.5 || Math.abs(o.worst - x.worst) <= 0.5 && o.spread < x.spread ? o : x,
      seed
    );
    if (best)
      lines = best.ends.map(
        (end, i) => Array.from({ length: end - best.starts[i] }, (_, j) => best.starts[i] + j)
      );
  }
  cache.set(key, lines);
  return lines;
}
var blockHeight = (lines, size = LABEL) => labelSize(size) * (1 + LEADING * (lines - 1));
function growTexts(parts, width = Infinity, size = LABEL) {
  const lines = growLines(parts, width, size).map((line2) => line2.map((k) => [k, parts[k]]));
  lines.forEach((line2, r) => {
    const [k, v] = line2[0], lead = r ? v.match(/^[、，,;；\s]+/u)?.[0] ?? "" : "";
    if (!lead) return;
    line2[0] = [k, v.slice(lead.length)];
    const mark = lead.replace(/\s+/gu, "");
    if (mark) lines[r - 1].push([k, mark]);
  });
  return lines;
}
function growName(t, parts, ats, x, y, {
  width = Infinity,
  size = LABEL,
  valign = "top",
  alpha = 1,
  build = false,
  align = "left",
  ...o
} = {}) {
  const em = labelSize(size), step = em * LEADING, lines = growTexts(parts, width, size);
  const top = valign === "top" ? y + em / 2 : valign === "bottom" ? y - em / 2 - step * (lines.length - 1) : y - step * (lines.length - 1) / 2;
  lines.forEach((line2, r) => {
    const span2 = line2.reduce((w, [, v]) => w + measure(v, size), 0);
    let left = (align === "center" ? x - span2 / 2 : align === "right" ? x - span2 : x) + hangOf(line2.map(([, v]) => v).join(""), align, size);
    line2.forEach(([k, v]) => {
      const at = build ? ats[k] ?? ats[0] : ats[0];
      text(v, left, top + r * step, size, {
        align: "left",
        ...o,
        alpha: alpha * ramp(t, at - 0.15, 0.4),
        whole: o.whole ?? parts.join("")
      });
      left += measure(v, size);
    });
  });
  return {
    lines: lines.length,
    top: top - em / 2,
    bottom: top + step * (lines.length - 1) + em / 2
  };
}

// picture/film/naming/placement.js
function stackTops(heights, cy, gap) {
  const total = heights.reduce((a, b) => a + b, 0) + gap * (heights.length - 1);
  return heights.reduce(
    (tops, h, i) => [...tops, i ? tops[i - 1] + heights[i - 1] + gap : cy - total / 2],
    []
  );
}
var CONTENT_CY = 500;
function railNames(names, xs, y, {
  side = 1,
  gap = NAME_GAP + 18,
  size = LABEL,
  alpha = () => 1,
  color = () => P.ink,
  wrap = RAIL_WRAP,
  set = `rail:${names[0]}`
} = {}) {
  const room = (i) => Math.min(i ? xs[i] - xs[i - 1] : Infinity, i + 1 < xs.length ? xs[i + 1] - xs[i] : Infinity) - 30;
  const gapOf = typeof gap === "function" ? gap : () => gap;
  names.forEach((v, i) => {
    const width = Math.min(wrap, room(i));
    nameText(v, xs[i], y + side * gapOf(i), {
      width,
      size,
      valign: side > 0 ? "top" : "bottom",
      align: "center",
      alpha: alpha(i),
      color: color(i),
      set
    });
  });
}
var RAIL_WRAP = 240;
var RAIL_ROW = 44;
function railStations(names, first, last, { size = LABEL, gap = 34, wrap = RAIL_WRAP } = {}) {
  const widths = names.map(
    (v) => Math.max(...wrapName(v, wrap, size).map((line2) => measure(line2, size)))
  );
  const need = widths.slice(1).map((w, i) => (widths[i] + w) / 2 + gap), pitch = names.length > 1 ? (last - first) / (names.length - 1) : 0;
  if (need.every((d) => d <= pitch)) return names.map((_, i) => first + i * pitch);
  const slack = Math.max(0, last - first - need.reduce((a, b) => a + b, 0)) / Math.max(1, need.length);
  return need.reduce((xs, d) => [...xs, xs.at(-1) + d + slack], [first]);
}
function radialName(v, cx, cy, r, a, { gap = NAME_GAP, ry = r, width = 260, ...o } = {}) {
  const c = Math.cos(a), sn = Math.sin(a), x = cx + c * (r + gap), y = cy + sn * (ry + gap);
  const align = c > 0.3 ? "left" : c < -0.3 ? "right" : "center", valign = align === "center" ? sn > 0 ? "top" : "bottom" : "middle";
  return nameText(v, x, y, { align, valign, width, ...o });
}
var HEAD_CLEAR = 64;

// picture/film/naming/rejected.js
var CLOSING_INK = { "”": 0.376, "」": 0.35, "』": 0.35, "’": 0.194 };
var closingBlank = (line2, size = LABEL) => {
  const ink = /[一-鿿]/u.test(line2) ? CLOSING_INK[line2.at(-1)] : void 0;
  return ink === void 0 ? 0 : Math.max(0, measure(line2, size) - measure(line2.slice(0, -1), size) - ink * labelSize(size));
};
function rejectedName(v, x, y, {
  alpha = 1,
  mark = 1,
  size = LABEL,
  align = "center",
  valign = "middle",
  width = Infinity,
  set = null,
  markLeft = null
} = {}) {
  const s = Math.min(26, labelSize(size) * 0.9), cx = align === "center" && markLeft === null ? x - (16 + s) / 2 : x;
  const block = nameText(v, cx, y, { align, valign, width, size, color: P.muted, alpha, set });
  const w = Math.max(...block.lines.map((line2) => measure(line2, size))), left = align === "left" ? cx : align === "right" ? cx - w : cx - w / 2;
  const reach = Math.max(
    ...block.lines.map((line2) => {
      const lw = measure(line2, size);
      return (align === "left" ? left + lw : align === "right" ? cx : cx + lw / 2) - closingBlank(line2, size);
    })
  );
  const at = markLeft ?? Math.max(reach + 16, left + w + 5);
  cross(at + s / 2, (block.top + block.bottom) / 2, s, { alpha: alpha * mark, width: 3 });
  return { ...block, left, right: at + s };
}

// picture/film/naming/terms.js
var NOTE = 22;
var TERM_GAP = 16;
var TERM_STACK = 10;
function termRowLayout(term, qual, width = Infinity, inline = null) {
  const one = !qual.length || (inline ?? measure(term.join(""), LABEL) + TERM_GAP + measure(qual.join(""), NOTE) <= width);
  const head = blockHeight(growLines(term, width).length);
  return {
    one,
    height: one ? head : head + TERM_STACK + blockHeight(growLines(qual, width, NOTE).length, NOTE)
  };
}
function termRow(t, term, termAts, qual, qualAts, x, y, {
  width = Infinity,
  alpha = 1,
  color = P.ink,
  set = null,
  build = false,
  inline = null,
  align = "left"
} = {}) {
  const whole = [...term, ...qual].join(" "), { one } = termRowLayout(term, qual, width, inline ?? (align === "left" ? null : false)), shared = one && qual.length;
  const span2 = measure(term.join(""), LABEL) + TERM_GAP + measure(qual.join(""), NOTE), left = shared ? align === "center" ? x - span2 / 2 : align === "right" ? x - span2 : x : x;
  const head = growName(t, term, termAts, left, y, {
    width,
    alpha,
    color,
    whole,
    set,
    align: shared ? "left" : align
  });
  if (!qual.length) return head;
  const after = left + measure(term.join(""), LABEL) + TERM_GAP;
  const tail = growName(
    t,
    qual,
    qualAts,
    one ? after : x,
    one ? head.top + (labelSize(LABEL) - labelSize(NOTE)) / 2 : head.bottom + TERM_STACK,
    {
      size: NOTE,
      alpha: mutedLevel(alpha),
      color: P.muted,
      width: one ? Infinity : width,
      whole,
      set,
      build,
      align: one ? "left" : align
    }
  );
  return { top: head.top, bottom: Math.max(head.bottom, tail.bottom) };
}

// picture/film/scenes/p01/scene.js
scenes["01"] = function(s, t) {
  const [report, next, judge, need, means, when, basis, use] = cues(s, [
    ["一份历史价格数据", "A historical price dataset"],
    ["下一位用它的人", "next person"],
    ["判断吗", "rely on it"],
    ["需要知道", "need to know"],
    ["每个数字是什么意思", "each number means"],
    ["哪个时间", "which time"],
    ["依据从哪里来", "evidence it rests"],
    ["用在哪里", "used for"]
  ]);
  const [researchers, backtest, trading, risk, unclear, chain] = cues(s, [
    ["研究员", "Researchers"],
    ["回测", "backtest"],
    ["交易系统", "trading systems"],
    ["控风险", "control risk"],
    ["说不清的数字", "nobody can explain"],
    ["顺着链条", "travels down"]
  ]);
  const roles = en ? cues(s, [
    ["", "acquisition"],
    ["", "analysis and modeling"],
    ["", "development"],
    ["", "production and platforms"],
    ["", "product management"],
    ["", "governance"],
    ["", "operational delivery"]
  ]) : cues(s, [
    ["采集", ""],
    ["分析建模", ""],
    ["开发", ""],
    ["生产", ""],
    ["平台", ""],
    ["产品", ""],
    ["治理", ""],
    ["运营交付", ""]
  ]);
  const [hand, file, table] = cues(s, [
    ["每个环节", "every step"],
    ["一个文件", "a file"],
    ["一张表", "a table"]
  ]);
  const paper = cue(s, "一份报告", "a report", { last: true }), started = cue(s, "启动一个流程", "the start of a process");
  const title = stageOut(t, Math.min(report, s.voice_start) - 0.45);
  if (title > 0) titleSignature(title);
  const chainAt = Math.min(roles[0], hand), valueAt = cue(s, "数据工作的价值", "the value of data work");
  const data = stageIn(t, Math.min(report, s.voice_start) - 0.45) * stageOut(t, chainAt);
  const stage2 = stageIn(t, chainAt) * stageOut(t, valueAt), worth = stageIn(t, valueAt);
  illustrative(data);
  const places = [780, 970, 815, 990, 830], moves = [next, means, researchers, trading];
  const CX = moves.reduce(
    (x, at, i) => x + (places[i + 1] - places[i]) * glide(t, at + 0.05, places[i + 1] - places[i]),
    places[0]
  );
  const UX = moves.slice(1).reduce(
    (x, at, i) => x + (places[i + 2] - places[i + 1]) * glide(t, at + 0.05, places[i + 2] - places[i + 1]),
    places[1]
  );
  const Y1 = CONTENT_CY + 48, K = 1.4, CY = Y1 - 180 * K, edgeX = CX + 300 * K, hotY = CY + REPORT_ROW(2, K);
  const dark = ramp(t, unclear - 0.1, 0.6);
  reportCard(CX, CY, {
    alpha: data,
    scale: K,
    highlight: ramp(t, means - 0.1, 0.5),
    unknown: dark,
    done: soon(t, report + 0.6, 0.6),
    named: data * named(t, report)
  });
  const ask = data * stageOut(t, researchers);
  if (ask > 0) {
    const PX = UX - 400, PY = hotY, user = named(t, next) * ask, QX = edgeX + 50, asking = stageOut(t, need);
    person(PX, PY - 10, { alpha: user, size: 1.4 });
    nameText(L("下一位用它的人", "The next person"), PX, PY + 22 + NAME_GAP, {
      valign: "top",
      alpha: user
    });
    link(CX - 20, PY, PX + 54, PY, { alpha: user, draw: { t, at: next - 0.1 } });
    text("?", QX, Y1, 44, {
      role: "mark",
      align: "center",
      color: P.unknown,
      alpha: ramp(t, judge - 0.1, 0.4) * ask * asking
    });
    const needs = [means, when, basis, use], names = en ? ["What each number means", "Which time it describes", "Its evidence", "Its permitted use"] : ["每个数字是什么意思", "对应哪个时间", "依据从哪里来", "能用在哪里"];
    const tops = stackTops(
      names.map(() => blockHeight(1)),
      Y1,
      40
    );
    names.forEach((v, i) => {
      const y = tops[i] + labelSize(LABEL) / 2, on = ramp(t, needs[i] - 0.15, 0.4) * ask;
      ring(QX, y, 17, { color: P.evidence, alpha: on, width: 2.5 });
      dot(QX, y, 5 + 3 * speaking(t, needs, i), { color: P.evidence, alpha: on });
      const quiet = i < 2 ? ramp(t, pauseHold(needs[i + 1] - 0.15, 0.3), 0.3) : 0, whole = ramp(t, use + 0.05, 0.4);
      nameText(v, QX + 17 + NAME_GAP, y, {
        align: "left",
        alpha: ask * ramp(t, needs[i] - 0.15, 0.4) * mix(mix(1, SECOND, quiet), 1, whole),
        set: "needs"
      });
    });
  }
  const uses = data * stageIn(t, researchers);
  if (uses > 0) {
    const xs = [CX - 400, edgeX + 180], ats = [researchers, trading], from = [CX - 20, edgeX + 16], to = [xs[0] + 54, xs[1] - 58];
    const rows = en ? [
      [["Researchers"], ["backtest"]],
      [["Trading systems"], ["control risk"]]
    ] : [
      [["研究员"], ["拿数据做回测"]],
      [["交易系统"], ["拿数据控风险"]]
    ];
    const qualAts = en ? [backtest, risk] : [cueFrom(s, "拿数据", "", researchers), cueFrom(s, "拿数据", "", trading)];
    const arrive = cue(s, "传下去", "down the chain"), travel = { t, at: chain - 0.1, least: arrive - chain };
    xs.forEach((x, i) => {
      const on = named(t, ats[i]) * uses, reached = ramp(t, arrive + 0.05, 0.4), tone = blend(P.ink, P.unknown, reached), y = hotY;
      ring(x, y, 46, { color: tone, alpha: on, width: 2.5 });
      if (i === 0) person(x, y + 6, { alpha: on, color: tone, size: 0.9 });
      else
        path(
          [
            [x - 26, y + 16],
            [x - 8, y - 4],
            [x + 6, y + 6],
            [x + 26, y - 18]
          ],
          { color: tone, alpha: on, width: 3 }
        );
      link(from[i], y, to[i], y, { alpha: uses, draw: i ? { t, at: ats[i] - 0.1 } : null });
      link(from[i], y, to[i], y, {
        color: P.unknown,
        alpha: uses,
        draw: travel,
        flowing: since(t, arrive - 0.1),
        lag: i * 0.5
      });
      const [term, qual] = rows[i];
      termRow(t, term, [ats[i]], qual, [qualAts[i]], x, y + 46 + NAME_GAP, {
        alpha: uses,
        inline: false,
        align: "center"
      });
    });
    nameText(L("一个说不清的数字", "A number nobody can explain"), CX + 210, CY + 504 + NAME_GAP, {
      valign: "top",
      alpha: uses * named(t, unclear)
    });
  }
  if (stage2 > 0) {
    const y = CONTENT_CY + 20, names = en ? [
      ["Acquisition"],
      ["Analysis and modeling"],
      ["Development"],
      ["Production and platforms"],
      ["Product management"],
      ["Governance"],
      ["Operational delivery"]
    ] : ["采集", "分析建模", "开发", "生产", "平台", "产品", "治理", "运营交付"];
    const xs = en ? names.map((_, i) => 266 + i * 232) : railStations(names, 230, 1690), R = 40;
    line(xs[0], y, xs.at(-1), y, {
      color: P.line,
      alpha: stage2 * ramp(t, chainAt + STAGE_CUT, 0.25),
      width: 4
    });
    xs.forEach((x, i) => {
      const on = ramp(t, roles[i] - 0.15, 0.4) * stage2, lit = speaking(t, roles, i);
      dot(x, y, R, { color: P.ground, alpha: on });
      ring(x, y, R, { color: blend(P.ink, P.evidence, lit), alpha: on, width: 2.5 + lit });
      person(x, y + 6, { alpha: on, color: blend(P.ink, P.evidence, lit), size: 0.72 });
      if (i)
        link(xs[i - 1] + R + 8, y, x - R - 8, y, {
          alpha: stage2,
          draw: { t, at: roles[i] - 0.15 },
          flowing: since(t, Math.max(hand, roles[i] + 0.35)),
          lag: i * 0.17
        });
    });
    if (en)
      xs.forEach((x, i) => {
        if (i % 2)
          line(x, y + R + 8, x, y + R + NAME_GAP + 26 + RAIL_ROW - 6, {
            alpha: stage2 * ramp(t, roles[i] - 0.15, 0.4),
            width: 2
          });
      });
    railNames(names, xs, y + R, {
      gap: (i) => NAME_GAP + 26 + (en && i % 2 ? RAIL_ROW : 0),
      alpha: (i) => stage2 * listIn(t, roles, i),
      set: "roles"
    });
    const mid = (xs[0] + xs.at(-1)) / 2, nextAt = cueFrom(s, "下一个人", "the next person", hand), nameBottom = y - R - HEAD_CLEAR;
    const HY = nameBottom - labelSize(LABEL) - NAME_GAP - 21, pair = [L("每个环节", "Every step"), L("下一个人", "The next person")];
    const D = (measure(pair[0]) + measure(pair[1])) / 4 + 24, way = 2 * D - 72;
    [hand, nextAt].forEach((at, k) => {
      const on = stage2 * named(t, at), x = mid + (k ? D : -D);
      person(x, HY + 6, { alpha: on, size: 0.6 });
      nameText(pair[k], x, nameBottom, { valign: "bottom", alpha: on });
    });
    const q = loopPhase(since(t, nextAt), way);
    if (q !== null)
      flowDot(
        mix(mid - D + 36, mid + D - 36, q),
        HY - 2,
        6,
        q,
        { color: P.evidence, alpha: stage2 },
        way
      );
  }
  if (worth > 0) {
    const LY = 480, W0 = 380, W1 = 600, UX2 = 1480, signalAt = cue(s, "现实里的信号", "real-world signals"), open = named(t, valueAt) * worth;
    const resultAt = [
      ["判断", "judgments"],
      ["数据资产", "data assets"],
      ["行动", "actions"]
    ].map((pair) => cue(s, ...pair, { last: true }));
    nameText(
      L("数据工作的价值", "The value of data work"),
      960,
      LY - 24 - NAME_GAP - labelSize(LABEL) - HEAD_CLEAR,
      { valign: "bottom", alpha: open }
    );
    const UY = LY + 96;
    person(UX2, UY, { alpha: open, size: 1.3 });
    nameText(L("下一位用它的人", "The next person"), UX2, UY + 15 * 1.3 * 1.52 + NAME_GAP, {
      valign: "top",
      alpha: open
    });
    link(W1 + 10, LY, UX2, UY - 15 * 1.3 * 2.15 - 10, {
      route: "hv",
      width: 4,
      alpha: worth * ramp(t, valueAt + STAGE_CUT, 0.25),
      draw: { t, at: valueAt + STAGE_CUT },
      flowing: since(t, valueAt + STAGE_CUT + 1.6)
    });
    const outs = [file, table, paper, started], refused = en ? ["A file", "A table", "A report", "The start of a process"] : ["一个文件", "一张表", "一份报告", "启动一个流程"];
    const widest = Math.max(...refused.map((v) => measure(v, LABEL))), IX = Math.round((W0 + W1) / 2 - (48 + widest + 68) / 2 + 26);
    const leave = 1 - ramp(t, pauseHold(signalAt, 0.4), 0.4);
    outs.forEach((at, i) => {
      const y = LY + 78 + i * 60, on = ramp(t, at - 0.15, 0.4) * worth * leave, tone = blend(P.muted, P.ink, speaking(t, outs, i));
      if (i === 0 || i === 2)
        documentIcon(IX - 20, y - 26, 40, 52, { alpha: on, stroke: tone, rows: i ? 3 : 2 });
      if (i === 1)
        tableIcon(IX - 26, y - 20, 52, 40, { alpha: on, stroke: tone, rows: 3, cols: 3 });
      if (i === 3) {
        ring(IX, y, 22, { color: tone, alpha: on, width: 2.5 });
        path(
          [
            [IX - 6, y - 11],
            [IX + 11, y],
            [IX - 6, y + 11],
            [IX - 6, y - 11]
          ],
          { color: tone, alpha: on, width: 2.5 }
        );
      }
      rejectedName(refused[i], IX + 48, y, {
        align: "left",
        alpha: named(t, at) * worth * leave,
        mark: ramp(t, at + 0.45, 0.4),
        set: "refused",
        markLeft: IX + 48 + widest + 16
      });
    });
    const run = soon(t, signalAt - 0.1, 1), wave = [];
    for (let x = W0; x <= mix(W0, W1, run); x += 6)
      wave.push([
        x,
        LY + Math.sin((x - W0) / 22 - voiceTime(t) * 2.4) * 14 * (1 - (x - W0) / (W1 - W0) * 0.7)
      ]);
    if (wave.length > 1) path(wave, { color: P.evidence, alpha: worth, width: 3 });
    nameText(L("现实里的信号", "Real-world signals"), (W0 + W1) / 2, LY - 24 - NAME_GAP, {
      valign: "bottom",
      color: P.evidence,
      alpha: worth * named(t, signalAt)
    });
    const xs = [760, 1e3, 1240], glyphs = [P.authority, P.evidence, P.ink], results = en ? ["Judgments", "Data assets", "Actions"] : ["判断", "数据资产", "行动"];
    xs.forEach((x, i) => {
      const on = ramp(t, resultAt[i] - 0.15, 0.4) * worth;
      dot(x, LY, 30, { color: P.ground, alpha: on });
      ring(x, LY, 30, { color: glyphs[i], alpha: on, width: 2.5 });
      if (i === 0) diamond(x, LY, 12, { color: glyphs[i], alpha: on, solid: true });
      if (i === 1)
        tableIcon(x - 16, LY - 12, 32, 24, { alpha: on, stroke: glyphs[i], rows: 2, cols: 2 });
      if (i === 2) check(x + 1, LY + 1, 26, { color: glyphs[i], alpha: on });
      nameText(results[i], x, LY + 30 + NAME_GAP, {
        valign: "top",
        color: glyphs[i],
        alpha: worth * listIn(t, resultAt, i),
        set: "results"
      });
    });
    const relyAt = cue(s, "可靠的", "reliable"), rely = worth * named(t, relyAt), BY = LY + 30 + NAME_GAP + labelSize(LABEL) + 14;
    const BL = xs[0] - Math.max(30, measure(results[0]) / 2) - 4, BR = xs[2] + Math.max(30, measure(results[2]) / 2) + 4;
    stroke(
      () => {
        ctx.moveTo(BL, BY - 12);
        ctx.lineTo(BL, BY);
        ctx.lineTo(BR, BY);
        ctx.lineTo(BR, BY - 12);
      },
      { color: P.line, alpha: rely, width: 2 }
    );
    nameText(L("可靠的", "Reliable"), (BL + BR) / 2, BY + NAME_GAP, {
      valign: "top",
      size: NOTE,
      color: P.muted,
      alpha: rely
    });
  }
};

// picture/film/scenes/p02/scene.js
scenes["02"] = function(s, t) {
  const [guide, agree, four, task, three] = cues(s, [
    ["数据部门工作指南", "Data Department Work Guidelines"],
    ["部门关于工作质量的契约", "contract for work quality"],
    ["四种失败", "four failures"],
    ["一项任务", "a task"],
    ["三件事", "achieve three things"]
  ]);
  const starts = cues(s, [
    ["把事实和选择", "confuses facts with choices"],
    ["只治了症状", "fixes the symptom"],
    ["沟通完了", "is communication"],
    ["人工智能写出了", "is ai that produces"]
  ]);
  const one = stageOut(t, four);
  if (one > 0) {
    const DW = 250, DH = 330, DX = 960 - DW / 2, DY = CONTENT_CY + 30 - DH / 2, rowY = (i) => DY + DH * (0.2 + i * 0.11), rows = [0, 1, 2, 3, 4, 5, 6];
    const doc = stageIn(t, guide) * one;
    documentIcon(DX, DY, DW, DH, { alpha: doc, rows: 0 });
    nameText(L("数据部门工作指南", "Data Department Work Guidelines"), 960, DY - NAME_GAP, {
      valign: "bottom",
      alpha: doc * named(t, guide)
    });
    const rowAt = (i) => guide + STAGE_CUT + i * 0.06, x0 = DX + 50;
    rows.forEach(
      (i) => dot(DX + 34, rowY(i), 5, { color: P.evidence, alpha: doc * ramp(t, rowAt(i), 0.25) })
    );
    stroke(
      () => rows.forEach((i) => {
        const q = drawShare(t, rowAt(i), DX + DW * (i % 2 ? 0.7 : 0.86) - x0);
        if (q > 0.01) {
          ctx.moveTo(x0, rowY(i));
          ctx.lineTo(mix(x0, DX + DW * (i % 2 ? 0.7 : 0.86), q), rowY(i));
        }
      }),
      { color: P.line, alpha: doc * ramp(t, rowAt(0), 0.35), width: 2 }
    );
    const members = named(t, agree) * one;
    [-1, 1].forEach(
      (k) => person(960 + k * 440, CONTENT_CY + 20, { alpha: members, color: P.authority, size: 1.3 })
    );
    nameText(
      L("部门关于工作质量的契约", "The department's contract for work quality"),
      960,
      DY + DH + NAME_GAP,
      { valign: "top", width: 760, alpha: members }
    );
  }
  const two = stageIn(t, four) * stageOut(t, task);
  const W = 760, H = 330, GY = CONTENT_CY + 40, cells = [0, 1, 2, 3].map((i) => [960 + (i % 2 ? 20 : -20 - W), GY + (i > 1 ? 15 : -15 - H)]);
  if (two > 0) {
    const titles = en ? [
      ["Confusing facts with choices"],
      ["Fixing the symptom", ", not the mechanism"],
      ["Communication"],
      ["AI that produces more material"]
    ] : [
      ["把事实和选择混在一起"],
      ["只治了症状", "，没改机制"],
      ["沟通完了"],
      ["人工智能写出了更多材料"]
    ];
    const titleAts = [
      [starts[0]],
      [starts[1], cue(s, "没改机制", "and leaves the mechanism")],
      [starts[2]],
      [starts[3]]
    ];
    const top = cells[0][1], bottom = cells[3][1] + H;
    line(960, top, 960, bottom, { color: P.line, alpha: two, width: 4 });
    line(cells[0][0] - 20, GY, cells[1][0] + W + 20, GY, { color: P.line, alpha: two, width: 4 });
    nameText(L("四种失败", "Four failures"), 960, top - NAME_GAP, {
      valign: "bottom",
      alpha: two * named(t, four)
    });
    cells.forEach(([x0, y0], i) => {
      const lit = speaking(t, starts, i), ty = y0 + 46, own = ramp(t, starts[i] - 0.15, 0.4) * two;
      text(String(i + 1), x0 + 42, ty, 26, {
        role: "mark",
        align: "center",
        color: blend(P.muted, P.evidence, lit),
        alpha: own
      });
      growName(t, titles[i], titleAts[i], x0 + 72, ty - labelSize(LABEL) / 2, {
        width: W - 110,
        alpha: two * listLevel(t, starts, i),
        set: "failures"
      });
    });
    const [late, vendor, apart] = cues(s, [
      ["数据晚到了", "data arriving late"],
      ["要不要换供应商", "changing vendors"],
      ["是两件事", "is a choice"]
    ]);
    {
      const [x0, y0] = cells[0], my = y0 + 175, fx = x0 + 210, cx = x0 + 550, split = ramp(t, apart + 0.05, 0.35);
      clock(fx, my, 30, { hand: 0.2, color: P.evidence, alpha: named(t, late) * two });
      diamond(cx, my, 30, { color: P.authority, alpha: named(t, vendor) * two });
      link(fx + 44, my, cx - 44, my, { alpha: two * (1 - split), draw: { t, at: vendor + 0.05 } });
      const lateName = L("数据晚到了", "Data arriving late"), vendorName = L("要不要换供应商", "Changing vendors");
      const wide = (v) => Math.max(...wrapName(v, 300).map((line2) => measure(line2))), dx = (fx + wide(lateName) / 2 + cx - wide(vendorName) / 2) / 2;
      const divided = drawShare(t, apart + 0.05, 150);
      if (divided > 0.01)
        line(dx, my - 54, dx, my - 54 + 150 * divided, { color: P.line, alpha: two, width: 2 });
      nameText(lateName, fx, my + 40 + NAME_GAP, {
        valign: "top",
        width: 300,
        color: P.evidence,
        alpha: two * named(t, late)
      });
      nameText(vendorName, cx, my + 40 + NAME_GAP, {
        valign: "top",
        width: 300,
        color: P.authority,
        alpha: two * named(t, vendor)
      });
    }
    const [backfill, month] = cues(s, [
      ["手工补一次数据", "someone backfills by hand"],
      ["下个月照样出错", "next month it breaks again"]
    ]);
    {
      const [x0, y0] = cells[1], py = y0 + 152, xb = x0 + 240, on = ramp(t, starts[1] - 0.15, 0.4) * two;
      line(x0 + 80, py, xb - 22, py, { color: P.ink, alpha: on, width: 4 });
      line(xb + 22, py, x0 + W - 80, py, { color: P.ink, alpha: on, width: 4 });
      cross(xb, py - 32, 20, { alpha: on });
      const patched = named(t, backfill) * two, again = named(t, month) * two, PY = py + 62;
      box(xb - 50, PY - 13, 100, 26, {
        fill: P.row,
        stroke: P.muted,
        alpha: ramp(t, backfill - 0.35, 0.3) * two,
        radius: 6
      });
      const upper = 30, lower = y0 + H - 42 - PY, run = loopPhase(since(t, starts[1] - 0.15), upper + lower);
      if (run !== null) {
        const at = run * (upper + lower);
        if (at < upper)
          flowDot(xb, py + 14 + at, 5, at / upper, { color: P.unknown, alpha: on }, upper);
        else
          flowDot(
            xb,
            PY + 18 + at - upper,
            5,
            (at - upper) / lower,
            { color: P.unknown, alpha: on * (1 - patched + again) },
            lower
          );
      }
      nameText(L("手工补一次数据", "Someone backfills by hand"), xb + 50 + NAME_GAP, PY, {
        align: "left",
        color: P.muted,
        alpha: patched
      });
      nameText(L("下个月照样出错", "Next month it breaks again"), xb + 50 + NAME_GAP, PY + 70, {
        align: "left",
        alpha: again
      });
    }
    const [decide, act] = cues(s, [
      ["没有人能做决定", "no one able to decide"],
      ["或动手", "or act"]
    ]);
    {
      const [x0, y0] = cells[2], my = y0 + 165, on = ramp(t, starts[2] - 0.15, 0.4) * two;
      [
        [x0 + 130, my - 14],
        [x0 + 190, my + 24]
      ].forEach(([bx, by]) => {
        box(bx - 56, by - 22, 112, 44, { stroke: P.muted, alpha: on, radius: 18 });
        [-16, 0, 16].forEach((dx) => dot(bx + dx, by, 3, { color: P.muted, alpha: on }));
      });
      const whole = L("没有人能做决定或动手", "No one able to decide or act"), cx = x0 + 505, D = Math.max(80, measure(whole) / 4);
      [
        [cx - D, decide],
        [cx + D, act]
      ].forEach(([sx, at]) => {
        const q = named(t, at) * two;
        person(sx, my, { alpha: q, color: P.line, size: 1.2, solid: false });
        text("?", sx, my - 21, 26, { role: "mark", align: "center", color: P.unknown, alpha: q });
      });
      nameText(whole, cx, my + 44 + NAME_GAP, { valign: "top", alpha: two * named(t, decide) });
    }
    const [more, grow] = cues(s, [
      ["更多材料", "more material"],
      ["没有变得更可靠", "grow no more"]
    ]);
    {
      const [x0, y0] = cells[3], on = ramp(t, starts[3] - 0.15, 0.4) * two, base = y0 + 270, ox = x0 + 260, ex = x0 + W - L(220, 240);
      agent(x0 + 110, y0 + 160, { alpha: on, size: 1.1 });
      const rise = soon(t, more - 0.1, 1.6), flat = soon(t, grow - 0.1, 0.9), top2 = base - 150 * rise;
      line(ox, base, ex, base, { color: P.line, alpha: on, width: 2 });
      line(ox, base, ox, y0 + 90, { color: P.line, alpha: on, width: 2 });
      path(
        [
          [ox, base - 10],
          [mix(ox, ex, rise), base - 10 - 150 * rise]
        ],
        { color: P.muted, alpha: on * ramp(t, more - 0.15, 0.3), width: 3 }
      );
      path(
        [
          [ox, base - 40],
          [mix(ox, ex, flat), base - 40]
        ],
        { color: P.authority, alpha: named(t, grow) * two, width: 3.5 }
      );
      nameText(L("材料", "Material"), ex + NAME_GAP, top2 - 10, {
        align: "left",
        color: P.muted,
        alpha: two * named(t, more)
      });
      nameText(L("判断和结果", "Judgment and results"), ex + NAME_GAP, base - 40, {
        align: "left",
        width: L(200, 300),
        color: P.authority,
        alpha: two * named(t, cue(s, "判断和结果", "judgment and results"))
      });
    }
  }
  const out = stageIn(t, task);
  if (out > 0) {
    const reports = cue(s, "三份必须交的报告", "three required reports");
    const rows = en ? [
      [["Problem solved"], []],
      [["Judgment tested"], ["with its limits"]],
      [
        ["Work system left better"],
        ["able to recognize", " or handle", " the next occurrence"]
      ]
    ] : [
      [["解决问题"], []],
      [["检验判断"], ["在什么情况下成立"]],
      [["工作体系能更好地发现或应对"], []]
    ];
    const termAts = en ? [
      [cue(s, "", "solve the problem")],
      [cue(s, "", "test the judgment")],
      [cue(s, "", "and leave the")]
    ] : [[cue(s, "解决问题", "")], [cue(s, "检验判断", "")], [cue(s, "工作体系能更好地发现", "")]];
    const qualAts = [
      [],
      [cue(s, "说清它在什么情况下成立", "and its limits")],
      en ? [
        cue(s, "", "able to recognize"),
        cue(s, "", "or handle the next"),
        cue(s, "", "or handle the next")
      ] : []
    ];
    const ats = termAts.map((v) => v[0]), settles = en ? qualAts[2][1] : cue(s, "应对", "");
    const width = 640, widths = [width, width, L(400, 420)], R = 64, TR = 18, run = 150, taskName = L("一项任务", "A task");
    const lineW = (parts, w, size) => Math.max(
      ...growTexts(parts, w, size).map(
        (line2) => line2.reduce((sum, [, v]) => sum + measure(v, size), 0)
      )
    );
    const rowsEnd = 300 + Math.max(
      ...rows.map(
        ([term, qual], i) => Math.max(lineW(term, widths[i], LABEL), qual.length ? lineW(qual, widths[i], NOTE) : 0)
      )
    );
    const columnMid = (rowsEnd - Math.max(TR + 7, measure(taskName) / 2)) / 2, stageMid = (rowsEnd - 186) / 2;
    const TY = CONTENT_CY + 30, TX = Math.round(960 - (columnMid + stageMid) / 2), MX = TX + run + R, NX = MX + R + NAME_GAP, RX = TX - 160;
    const ys = [TY - 170, TY, TY + 170], colors = [P.ink, P.evidence, P.authority];
    const pairMid = (run + measure(L("三件事", "Three things")) - Math.max(TR + 7, measure(taskName) / 2)) / 2;
    const early = 960 - TX - L(0.35, 0.8) * pairMid;
    const before3 = 300 + Math.max(
      ...rows.slice(0, 2).map(
        ([term, qual], i) => Math.max(lineW(term, widths[i], LABEL), qual.length ? lineW(qual, widths[i], NOTE) : 0)
      )
    );
    const lean3 = Math.max(0, (rowsEnd - before3) / 2);
    ctx.save();
    ctx.translate(
      (early - lean3) * (1 - glide(t, ats[0] + 0.05, early - lean3)) + lean3 * (1 - glide(t, ats[2] + 0.05, lean3)),
      0
    );
    token(TX, TY, { r: TR, alpha: out * named(t, task) });
    nameText(taskName, TX, TY + TR + 7 + NAME_GAP, { valign: "top", alpha: out * named(t, task) });
    rows.forEach(([term, qual], i) => {
      const y = ys[i], on = ramp(t, ats[i] - 0.15, 0.4) * out, lit = speaking(t, ats, i), c = colors[i];
      link(TX + TR + 14, TY, MX - R - 8, y, {
        route: "hvh",
        mid: (TX + MX - R) / 2,
        alpha: out,
        draw: { t, at: three + 0.05 + 0.12 * i }
      });
      ring(MX, y, R, { color: c, alpha: on, width: 2.5 + lit, draw: { t, at: ats[i] - 0.15 } });
      if (i === 0) check(MX + 2, y + 2, 50, { alpha: on, draw: { t, at: ats[i] + 0.2 }, width: 5 });
      if (i === 1) {
        dot(MX, y, 11, { color: c, alpha: on });
        box(MX - 36, y - 28, 72, 56, {
          stroke: c,
          alpha: named(t, qualAts[1][0]) * out,
          radius: 10
        });
      }
      if (i === 2) {
        for (let k = 0; k < 2; k++)
          ring(MX, y, 20 + k * 18, {
            color: c,
            alpha: on * (1 - k * 0.3),
            width: 2,
            draw: { t, at: ats[i] + k * 0.3 }
          });
        dot(MX, y, 7, { color: c, alpha: named(t, settles) * out });
        beats(t, MX, y, R - 12, en ? qualAts[2] : [cue(s, "更好地发现", ""), settles], {
          color: c,
          alpha: out
        });
      }
      const top = y - termRowLayout(term, qual, widths[i], false).height / 2;
      termRow(t, term, termAts[i], qual, qualAts[i], NX, top, {
        width: widths[i],
        alpha: out * listLevel(t, ats, i),
        set: "outcomes",
        inline: false
      });
      documentIcon(RX - 26, y - 34, 52, 68, {
        alpha: named(t, reports) * out * 0.8,
        stroke: P.muted,
        rows: 3
      });
    });
    const head = ys[0] - R - NAME_GAP;
    nameText(L("三件事", "Three things"), MX - R, head, {
      align: "left",
      valign: "bottom",
      alpha: out * named(t, three)
    });
    rejectedName(L("三份必须交的报告", "Required reports"), RX - 26, head, {
      align: "left",
      valign: "bottom",
      alpha: out * named(t, reports),
      mark: ramp(t, reports + 0.3, 0.4)
    });
    ctx.restore();
  }
};

// picture/film/scenes/p03/order.js
var s03Extent = (t, base, steps) => steps.reduce((v, [at, d]) => v + d * pacedTo(t, at - 0.1, d), base);
function s03Order(t, g, {
  FT,
  color,
  question,
  questionAt,
  rows,
  station,
  width = 560,
  leave = Infinity,
  frameAt = -Infinity,
  build = false,
  joined = false,
  leanMax = 120,
  note = "",
  noteAt = Infinity,
  arrive = null
}) {
  const SR = 50, PAD = 60, qx = SR * 2 + NAME_GAP, nx = SR + 11 + NAME_GAP, joins = (r) => Array.isArray(joined) ? joined[r] : joined;
  const qW = Math.max(measure(question, LABEL), note ? measure(note, NOTE) : 0), layouts = rows.map(
    ([term, , qual], r) => joins(r) && qual.length ? { one: true, height: blockHeight(growLines([...term, ...qual], width).length) } : termRowLayout(term, qual, width)
  );
  const termW = rows.map(([term]) => Math.min(width, measure(term.join(""), LABEL)));
  const members = rows.map(
    ([term, , qual, , , , , , list], r) => list || build && qual.length ? s03Members(term, qual, width, joins(r) && !list) : null
  );
  const rowW = rows.map(
    ([, , qual], r) => members[r] ? Math.max(termW[r], ...members[r].map((v) => v.right)) : layouts[r].one ? termW[r] + (qual.length ? TERM_GAP + measure(qual.join(""), NOTE) : 0) : Math.max(termW[r], Math.min(width, measure(qual.join(""), NOTE)))
  );
  const headW = PAD + qx + qW + PAD, FW = Math.max(headW, ...rowW.map((w2) => PAD + nx + w2 + PAD));
  const FX0 = Math.round(960 - FW / 2), SY = FT + PAD + SR, H0 = 2 * (PAD + SR);
  const termH = labelSize(LABEL), heights = layouts.map((v) => v.height);
  const tops = rows.reduce(
    (acc, [, , , , , gap], r) => [
      ...acc,
      (r ? acc[r - 1] + heights[r - 1] + 40 : FT + H0 + 16) + gap
    ],
    []
  );
  const steps = [];
  let w = headW, b = FT + H0;
  rows.forEach(([, termAts, qual, qualAts], r) => {
    const parts = [[termAts[0], PAD + nx + termW[r] + PAD, tops[r] + termH + PAD]];
    if (members[r])
      members[r].forEach(
        (v) => parts.push([qualAts[v.k], PAD + nx + v.right + PAD, tops[r] + v.bottom + PAD])
      );
    else if (qual.length)
      parts.push([qualAts[0], PAD + nx + rowW[r] + PAD, tops[r] + heights[r] + PAD]);
    parts.sort((p, q) => p[0] - q[0]).forEach(([at, pw, pb]) => {
      steps.push([at, Math.max(0, pw - w), Math.max(0, pb - b)]);
      w = Math.max(w, pw);
      b = Math.max(b, pb);
    });
  });
  const home = (FW - headW) / 2, gone = 1 - ramp(t, leave + 0.05, 0.3), CLOSE = 30;
  const fullBottom = steps.reduce((v, [, , db]) => v + db, FT + H0), closing = FW - headW + PAD - CLOSE;
  const back = drawShare(t, leave + 0.35, closing, Math.max(0.65, home / 300)), centring = glide(t, leave + 0.35, home);
  const rise = drawShare(t, leave + 0.35, fullBottom - SY - SR - CLOSE, 0.65);
  const grown = s03Extent(
    t,
    headW,
    steps.map(([at, dw]) => [at, dw])
  );
  const lean = (width2) => Math.min(leanMax, (FW - width2) / 2), widths = steps.reduce((v, [, dw]) => [...v, v.at(-1) + dw], [headW]);
  const shift = steps.reduce((v, [at], k) => {
    const d = lean(widths[k + 1]) - lean(widths[k]);
    return v + d * glide(t, at - 0.3, d);
  }, lean(headW));
  const FX = FX0 + mix(shift, home, centring), SX = FX + PAD + SR;
  const left = mix(FX, FX + PAD - CLOSE, back), top = mix(FT, FT + PAD - CLOSE, rise);
  const right = mix(FX + grown, FX + headW - PAD + CLOSE, back);
  const bottom = mix(
    s03Extent(
      t,
      FT + H0,
      steps.map(([at, , db]) => [at, db])
    ),
    SY + SR + CLOSE,
    rise
  );
  box(left, top, right - left, bottom - top, {
    stroke: color,
    alpha: g * 0.85 * ramp(t, frameAt - 0.15, 0.4),
    radius: 16,
    width: 3
  });
  const up = arrive ? glide(t, arrive.rise, Math.hypot(SX - arrive.x, SY - arrive.y) + Math.abs(SR - arrive.r)) : 1;
  const hx = arrive ? mix(arrive.x, SX, up) : SX, hy = arrive ? mix(arrive.y, SY, up) : SY, hr = arrive ? mix(arrive.r, SR, up) : SR;
  const nx0 = arrive ? hx + hr + NAME_GAP : FX + PAD + qx;
  seal(hx, hy, hr, { color, alpha: g * (arrive ? ramp(t, arrive.at - 0.15, 0.4) : 1) });
  nameText(question, nx0, hy, { align: "left", color, alpha: g * named(t, questionAt) });
  if (note)
    nameText(note, nx0, hy + labelSize(LABEL) / 2 + TERM_STACK, {
      align: "left",
      valign: "top",
      size: NOTE,
      color: P.muted,
      alpha: g * named(t, noteAt)
    });
  const ats = rows.map(([, , , , at]) => at), ys = tops.map((top2, r) => {
    const [, termAts, , qualAts, , , , , list] = rows[r], first = members[r]?.[0];
    return top2 + (list && first && first.y > 0 && Math.min(...qualAts) < termAts[0] ? first.y + labelSize(NOTE) / 2 : termH / 2);
  });
  const reach = ats.reduce((sum, at, r) => {
    const d = ys[r] - (r ? ys[r - 1] : SY + SR + 6);
    return sum + drawShare(t, at - 0.15, d, 0.5) * d;
  }, 0);
  if (reach > 1)
    line(SX, SY + SR + 6, SX, SY + SR + 6 + reach, { color: P.line, alpha: g * gone, width: 2 });
  rows.forEach(([term, termAts, qual, qualAts, at, , rowColor, set, list], r) => {
    station(SX, ys[r], r, ramp(t, at - 0.15, 0.4) * g * gone, speaking(t, ats, r));
    const x = SX + 11 + NAME_GAP, o = { width, color: rowColor ?? color, alpha: g * listLevel(t, ats, r, leave), set, build };
    if (joins(r) && !list && qual.length) {
      const whole = [...term, qual[0].trimStart(), ...qual.slice(1)].join(" ");
      growName(t, term, termAts, x, tops[r], { ...o, whole });
      members[r].forEach(
        (v) => growName(t, [v.text], [build ? qualAts[v.k] : qualAts[0]], x + v.x, tops[r] + v.y, {
          color: o.color,
          alpha: o.alpha,
          whole,
          set
        })
      );
      return;
    }
    if (!list) {
      termRow(t, term, termAts, qual, qualAts, x, tops[r], o);
      return;
    }
    growName(t, term, termAts, x, tops[r], { ...o, whole: term.join("") });
    members[r].forEach(
      (v) => growName(t, [v.text], [qualAts[v.k]], x + v.x, tops[r] + v.y, {
        size: NOTE,
        color: P.muted,
        alpha: o.alpha * listLevel(t, qualAts, v.k),
        whole: qual[v.k].replace(/^[、，,\s]+/u, ""),
        set: list
      })
    );
  });
  return { SX, ys, tops, heights, head: FT + H0 };
}
function s03Members(term, qual, width, joined = false) {
  if (joined) {
    const em2 = labelSize(LABEL);
    return growTexts([...term, ...qual], width, LABEL).flatMap((line2, r) => {
      let left = 0;
      return line2.map(([k, text2]) => {
        const x = left, y = r * em2 * LEADING;
        left += measure(text2, LABEL);
        return { k: k - term.length, text: text2, x, y, right: left, bottom: y + em2 };
      });
    }).filter((v) => v.k >= 0);
  }
  const { one } = termRowLayout(term, qual, width), head = blockHeight(growLines(term, width).length), em = labelSize(NOTE);
  const x0 = one ? measure(term.join(""), LABEL) + TERM_GAP : 0, y0 = one ? (labelSize(LABEL) - em) / 2 : head + TERM_STACK;
  return growTexts(qual, one ? Infinity : width, NOTE).flatMap((line2, r) => {
    let left = x0;
    return line2.map(([k, text2]) => {
      const x = left, y = y0 + r * em * LEADING;
      left += measure(text2, NOTE);
      return { k, text: text2, x, y, right: left, bottom: Math.max(head, y + em) };
    });
  });
}

// picture/film/scenes/p03/each-kind.js
function s03ToAct(s, t, decideQ, ranks, order, truthQ, g2) {
  ctx.save();
  const colors = [P.authority, P.authority, P.ink, P.muted];
  const names = en ? [
    [["Law,"], [" regulation, security requirements", " and mandatory company policy"]],
    [["What the decision owner for this matter explicitly decides"], []],
    [["Contracts,"], [" policies", ", specifications", " and decision records in force"]],
    [["Work plans,"], [" provisional agreements", " and personal preferences"]]
  ] : [
    [["法律、"], ["监管、安全要求", "和公司的强制性制度"]],
    [["这件事的决策负责人作出的明确决定"], []],
    [["有效的契约、"], ["制度", "、规范", "和决策记录"]],
    [["工作计划、"], ["临时约定", "和个人偏好"]]
  ];
  const members = (en ? [
    ["regulation", "security requirements", "mandatory company policy"],
    [],
    ["policies", "specifications", "decision records"],
    ["provisional agreements", "personal preferences"]
  ] : [
    ["监管", "安全要求", "公司的强制性制度"],
    [],
    ["制度", "规范", "决策记录"],
    ["临时约定", "个人偏好"]
  ]).map((rest, r) => [ranks[r], ...rest.map((v) => cueFrom(s, v, v, ranks[r]))]);
  const parts = members.map((m) => m.slice(1));
  parts[0] = [members[0][1], members[0][3]];
  const head = s03Order(t, g2, {
    FT: L(320, 280),
    leave: en ? truthQ : Infinity,
    width: L(640, 960),
    leanMax: L(120, 220),
    color: P.authority,
    question: L("行动依据", "Authority to act"),
    questionAt: decideQ,
    frameAt: en ? ranks[0] : order,
    build: true,
    joined: en ? [true, false, true, true] : true,
    rows: names.map(([term, qual], r) => [
      term,
      [ranks[r]],
      qual,
      parts[r],
      ranks[r],
      0,
      colors[r],
      "ranks"
    ]),
    station: (x, y, r, q, lit) => {
      dot(x, y, 11, { color: P.ground, alpha: q });
      dot(x, y, 11, { color: P.line, alpha: q, hollow: true, width: 2 });
      dot(x, y, 12.5 - r * 1.5, { color: colors[r], alpha: q });
      beats(t, x, y, 19, members[r].slice(1), { color: colors[r], alpha: g2, lit });
    }
  });
  nameText(L("有先后", "Order of precedence"), head.SX - 110, L(320, 280) - NAME_GAP, {
    align: "left",
    valign: "bottom",
    color: P.muted,
    alpha: g2 * named(t, order) * (1 - ramp(t, truthQ + 0.05, 0.3))
  });
  ctx.restore();
}
function s03AboutFacts(t, truthQ, asks, record, observe, onlyLeads, attrs, leads, rise, g3f) {
  const facts = en ? [
    [["Primary records"], [record], [], []],
    [
      ["Repeatable observations"],
      [observe],
      ["with a source", ", time", ", subject", " and scope"],
      attrs
    ],
    [
      ["Only leads"],
      [onlyLeads],
      ["Second-hand accounts", ", Caches", ", Generated views", ", Agent output", ", Memory"],
      leads
    ]
  ] : [
    [["原始记录"], [record], [], []],
    [["能重复的观察"], [observe], ["并说清来源", "、时间", "、对象和范围"], attrs],
    [
      ["只能算线索"],
      [onlyLeads],
      ["转述", "、记忆", "、缓存", "、派生视图", "、智能体的输出"],
      leads
    ]
  ];
  const starts = facts.map(([, termAts, , qualAts]) => Math.min(...termAts, ...qualAts));
  const parts = facts.map(
    ([, termAts, , qualAts], r) => r === 2 ? qualAts : [...termAts, ...qualAts]
  );
  const asked = truthQ + 0.85, answers = "What can establish what is true";
  const ow = 72 + NAME_GAP + Math.max(
    measure(L("事实依据", "Authority about facts"), LABEL),
    en ? measure(answers, NOTE) : 0
  );
  const { SX, ys, tops } = s03Order(t, g3f, {
    FT: 260,
    width: L(640, 760),
    color: P.evidence,
    question: L("事实依据", "Authority about facts"),
    questionAt: L(truthQ, asked),
    note: L("", answers),
    noteAt: asks[1],
    arrive: en ? { x: 960 - ow / 2 + 36, y: 650, r: 36, at: asked, rise } : null,
    frameAt: record,
    leanMax: 260,
    build: true,
    rows: facts.map(([term, termAts, qual, qualAts], r) => [
      term,
      termAts,
      qual,
      qualAts,
      starts[r],
      r === 2 ? 30 : 0,
      r < 2 ? P.evidence : P.muted,
      "facts",
      r === 2 ? "leads" : null
    ]),
    station: (x, y, r, q, lit) => {
      dot(x, y, 11, { color: P.ground, alpha: q });
      dot(x, y, 11, { color: P.line, alpha: q, hollow: true, width: 2 });
      if (r < 2) dot(x, y, 12.5, { color: P.evidence, alpha: q });
      else ring(x, y, 12.5, { color: P.unknown, alpha: q, width: 3 });
      beats(t, x, y, 19, parts[r].slice(1), {
        color: r < 2 ? P.evidence : P.unknown,
        alpha: g3f,
        lit
      });
    }
  });
  const barY = tops[2] - 26, tried = ramp(t, leads[0] - 0.15, 0.4) * g3f;
  link(SX, ys[2] - 14, SX, barY + 12, {
    color: P.unknown,
    alpha: tried,
    upto: drawShare(t, leads[0] - 0.1, Math.abs(barY + 12 - (ys[2] - 14)), 0.7),
    end: false,
    dash: [6, 6]
  });
  line(SX - 24, barY, SX + 24, barY, {
    color: P.unknown,
    alpha: ramp(t, leads[0] + 0.45, 0.3) * g3f,
    width: 4
  });
}

// picture/film/scenes/p03/guidelines.js
function s03Guidelines(s, t, bind, agentAt, search, reason, act, people, duties, membersAt, delegate, reachOf, g1) {
  const MX = 640, AX = 1240, FY = 440, rows = [550, 624, 698, 772], PADG = 32, FT = FY - 90;
  const abilities = [search, reason, act], agentName = L("智能体", "Agents"), membersName = L("部门成员", "Members");
  const FL = MX - 36 - NAME_GAP - measure(membersName) - PADG, below = labelSize(LABEL) / 2 + PADG;
  const rowAt = rows.map((_, r) => Math.min(duties[r], abilities[r] ?? Infinity));
  const widen = Math.min(agentAt, delegate, en ? Infinity : cue(s, "及其委托", ""));
  const abilityNames = en ? ["Investigate", "Reason", "Act"] : ["调查", "推理", "动手"];
  const reachRight = Math.max(
    AX + 34 + NAME_GAP + measure(agentName),
    AX + 9 + NAME_GAP + Math.max(...abilityNames.map((v) => measure(v)))
  ) + PADG, centred = 960 - (FL + MX + 120) / 2;
  ctx.save();
  ctx.translate(en ? 0 : centred * (1 - glide(t, widen - 0.45, centred)), 0);
  const bottom = s03Extent(
    t,
    FY + 80,
    rowAt.map((at, r) => [
      at,
      Math.max(0, rows[r] + below - (r ? Math.max(FY + 80, rows[r - 1] + below) : FY + 80))
    ])
  );
  if (en) {
    const wideQ = ramp(t, widen - 0.15, 0.4);
    box(FL, FT, MX + 120 - FL, bottom - FT, {
      stroke: P.muted,
      alpha: g1 * (1 - wideQ),
      radius: 16,
      width: 2.5
    });
    box(FL, FT, reachRight - FL, bottom - FT, {
      stroke: P.muted,
      alpha: g1 * wideQ,
      radius: 16,
      width: 2.5
    });
  } else
    box(FL, FT, mix(MX + 120, reachRight, ease((t - widen + 0.45) / 1.1)) - FL, bottom - FT, {
      stroke: P.muted,
      alpha: g1,
      radius: 16,
      width: 2.5
    });
  nameText(L("这份指南", "Guidelines"), FL, FT - NAME_GAP, {
    align: "left",
    valign: "bottom",
    color: P.muted,
    alpha: g1 * named(t, bind)
  });
  person(MX, FY, { alpha: g1, color: P.authority, size: 1.2 });
  nameText(membersName, MX - 36 - NAME_GAP, FY - 6, {
    align: "right",
    color: P.authority,
    alpha: g1 * named(t, membersAt)
  });
  agent(AX, FY - 6, { alpha: ramp(t, agentAt - 0.15, 0.4) * g1, size: 1.3 });
  nameText(agentName, AX + 34 + NAME_GAP, FY - 6, {
    align: "left",
    color: P.evidence,
    alpha: g1 * named(t, agentAt)
  });
  link(MX + 44, FY - 6, AX - 40, FY - 6, {
    alpha: g1 * ramp(t, delegate - 0.1, 0.3),
    draw: { t, at: delegate - 0.1 },
    flowing: since(t, delegate + 0.6)
  });
  nameText(L("委托", "Delegate"), (MX + AX) / 2, FY - 6 - NAME_GAP, {
    valign: "bottom",
    color: P.muted,
    alpha: g1 * named(t, delegate)
  });
  const columns = [
    [
      MX,
      duties,
      en ? ["Direction", "Authorization", "Decisions", "Responsibility for consequences"] : ["方向", "授权", "决定", "后果"],
      P.authority,
      "duties"
    ],
    [AX, abilities, abilityNames, P.ink, "abilities"]
  ];
  columns.forEach(([x, ats, names, color, set], c) => {
    const last = rows[ats.length - 1], own = c ? 0 : ramp(t, people + 0.05, 0.3), reach = reachOf(ats, rows, FY + 40);
    link(x, FY + 40, x, last, { alpha: g1, upto: reach, end: false });
    if (own > 0)
      link(x, FY + 40, x, last, {
        color: P.authority,
        alpha: g1 * own,
        upto: reach,
        end: false,
        width: 2.5
      });
    ats.forEach((at, i) => {
      const y = rows[i], q = ramp(t, at - 0.15, 0.4) * g1, lit = speaking(t, ats, i);
      dot(x, y, 10.5, { color, alpha: q });
      if (lit > 0) ring(x, y, 17, { color, alpha: lit * restMark(color, 0.5) * g1, width: 2 });
      nameText(names[i], x + 9 + NAME_GAP, y, {
        align: "left",
        color,
        alpha: g1 * listIn(t, ats, i),
        set
      });
    });
  });
  ctx.restore();
}
function s03Kinds(t, two, apart, decideQ, factQ, order, actQ, asks, kinds) {
  const SY = CONTENT_CY + 60, R = 60, P0 = 38, on = kinds * named(t, two);
  const questions = [L("行动依据", "Authority to act"), L("事实依据", "Authority about facts")];
  const ask = L("", "Who may decide what to do");
  const widest = Math.max(
    2 * R,
    ...questions.map((v) => measure(v, LABEL)),
    en ? measure(ask, NOTE) : 0
  );
  const halfW = Math.max(440, widest + 2 * P0), sx = halfW / 2, open = sx + 27 + 30, qTop = SY + R + NAME_GAP;
  const first = Math.min(
    halfW,
    Math.max(open, sx + Math.max(R, measure(questions[0], LABEL) / 2) + P0)
  );
  const half = s03Extent(t, open, [
    [decideQ, first - open],
    [factQ, halfW - first]
  ]), left = 960 - half, right = 960 + half;
  const kx = mix(sx, half / 2, glide(t, decideQ - 0.3, sx - open / 2));
  const low = s03Extent(t, SY + R + P0, [
    [decideQ, NAME_GAP + labelSize(LABEL)],
    [asks[0], TERM_STACK + labelSize(NOTE)],
    [en ? order : Infinity, TERM_STACK + labelSize(NOTE)]
  ]);
  box(left, SY - R - P0, right - left, low - SY + R + P0, {
    stroke: P.line,
    alpha: on,
    radius: 16,
    width: 3
  });
  nameText(L("两种依据", "Two kinds of authority"), 960, SY - R - P0 - NAME_GAP, {
    valign: "bottom",
    alpha: on * (1 - ramp(t, L(decideQ, actQ) + 0.05, 0.3))
  });
  if (en)
    nameText(ask, 960 - kx, qTop + labelSize(LABEL) + TERM_STACK, {
      valign: "top",
      size: NOTE,
      color: P.muted,
      alpha: kinds * named(t, asks[0])
    });
  if (en)
    nameText(
      "Order of precedence",
      960 - kx,
      qTop + labelSize(LABEL) + 2 * TERM_STACK + labelSize(NOTE),
      { valign: "top", size: NOTE, color: P.muted, alpha: kinds * named(t, order) }
    );
  [
    [960 - kx, decideQ, P.authority],
    [960 + kx, factQ, P.evidence]
  ].forEach(([x, at, color]) => {
    text("?", x, SY, 100, {
      role: "mark",
      align: "center",
      color,
      alpha: on * (1 - ramp(t, at + 0.1, 0.3))
    });
    seal(x, SY, R, {
      color,
      alpha: kinds * named(t, at),
      stamp: kinds * ramp(t, at + 0.35, 0.3)
    });
  });
  line(960, SY - R - P0, 960, low, {
    color: P.line,
    alpha: kinds * ramp(t, apart - 0.1, 0.4),
    width: 4
  });
  nameText(questions[0], 960 - kx, qTop, {
    valign: "top",
    color: P.authority,
    alpha: kinds * named(t, decideQ)
  });
  nameText(questions[1], 960 + kx, qTop, {
    valign: "top",
    color: P.evidence,
    alpha: kinds * named(t, factQ)
  });
}

// picture/film/scenes/p03/judgment.js
function s03Against(s, t, noTrue, conflict, report, quiet, release, versus, g4c) {
  const M = 960, Y = 520, AX = M - 480, BX = M + 480, R = 50, PY = 300, DY = 770, xs = [M - 260, M + 260];
  const factAt = cueFrom(s, "事实依据", "a fact does not", versus), grant = cue(s, "给不了动手的权限", "grant permission");
  const ox = 0;
  seal(AX + ox, Y - 14, R, { alpha: g4c });
  nameText(L("行动依据", "Authority to act"), AX + ox, Y - 14 + R + NAME_GAP, {
    valign: "top",
    color: P.authority,
    alpha: g4c * named(t, versus)
  });
  seal(BX, Y - 14, R, { color: P.evidence, alpha: g4c });
  nameText(L("事实依据", "Authority about facts"), BX, Y - 14 + R + NAME_GAP, {
    valign: "top",
    color: P.evidence,
    alpha: g4c * named(t, versus)
  });
  beats(t, AX + ox, Y - 14, R + 10, [release], { color: P.authority, alpha: g4c });
  beats(t, BX, Y - 14, R + 10, [conflict], { color: P.evidence, alpha: g4c });
  [
    [
      AX + R + 14,
      M - 35,
      noTrue,
      noTrue,
      L("把假的变成真的", "Make a false fact true"),
      Infinity,
      -1,
      ox
    ],
    [
      BX - R - 14,
      M + 35,
      Math.max(factAt, grant - 0.5),
      grant,
      L("动手的权限", "Grant permission to act"),
      Infinity,
      1,
      0
    ]
  ].forEach(([x0, bar, go, at, v, width, side, dx]) => {
    link(x0 + dx, Y, bar + dx, Y, {
      color: P.unknown,
      alpha: ramp(t, go - 0.1, 0.3) * g4c,
      upto: drawShare(t, go + 0.05, Math.abs(bar + dx - (x0 + dx)), 0.7),
      end: false,
      dash: [8, 8]
    });
    line(bar + dx, Y - 24, bar + dx, Y + 24, {
      color: P.unknown,
      alpha: ramp(t, at + 0.45, 0.3) * g4c,
      width: 4
    });
    const cross2 = 26;
    rejectedName(v, (side < 0 ? M - 40 - cross2 - 16 : M + 40 + cross2 + 16) + dx, Y - 36, {
      align: side < 0 ? "right" : "left",
      valign: "bottom",
      width,
      alpha: g4c * named(t, at),
      mark: ramp(t, at + 0.45, 0.3),
      markLeft: (side < 0 ? M - 40 - cross2 : M + 40) + dx
    });
  });
  const c = ramp(t, conflict - 0.15, 0.4) * g4c;
  ring(M, Y, 24 + 3 * Math.sin(voiceTime(t) * 4), { color: P.unknown, alpha: c, width: 3 });
  dot(M, Y, 7, { color: P.unknown, alpha: c });
  const RW = 64, RH = 84, RX = M - RW / 2, RY = PY - RH / 2;
  link(M, Y - 36, M, RY + RH + 12, {
    color: P.evidence,
    alpha: ramp(t, report - 0.1, 0.3) * g4c,
    draw: { t, at: report + 0.05 },
    width: 2.5
  });
  documentIcon(RX, RY, RW, RH, { alpha: ramp(t, report + 0.3, 0.4) * g4c, rows: 2 });
  nameText(L("讲出冲突和影响", "Conflict and impact"), RX + RW + NAME_GAP, PY, {
    align: "left",
    alpha: g4c * named(t, report)
  });
  const alter = cue(s, "改记录", "alter the record");
  [
    [alter, L("改记录", "Alter the record")],
    [quiet, L("悄悄按决定或核验结果去做", "Silently act as if one side had won")]
  ].forEach(([at, v], k) => {
    link(M, Y + 36, xs[k], DY - 40, {
      route: "vhv",
      mid: Y + 150,
      color: P.unknown,
      alpha: ramp(t, at - 0.1, 0.3) * g4c,
      upto: drawShare(t, at + 0.05, Math.abs(xs[k] - M) + Math.abs(DY - 40 - (Y + 36)), 0.7),
      end: false,
      dash: [8, 8]
    });
    line(xs[k] - 24, DY - 40, xs[k] + 24, DY - 40, {
      color: P.unknown,
      alpha: ramp(t, at + 0.45, 0.3) * g4c,
      width: 4
    });
    rejectedName(v, xs[k], DY, {
      valign: "top",
      width: 440,
      alpha: g4c * named(t, at),
      mark: ramp(t, at + 0.45, 0.3)
    });
  });
}
function s03Judgment(s, t, expert, missing, domainOwner, alone, noPower, g5) {
  const B = 210, PW = 64, lead = 920 - B - PW - NAME_GAP - measure(L("既懂行", "Competence"));
  const tail = Math.max(
    1480 + measure(L("相应领域的负责人", "Domain owner")) / 2,
    920 + B + PW + NAME_GAP + measure(L("又了解事实", "The facts"))
  );
  const needs = 960 - (lead + 920 + B + PW + NAME_GAP + measure(L("又了解事实", "The facts"))) / 2;
  const centring = 960 - (lead + tail) / 2, ox = needs + (centring - needs) * glide(t, domainOwner + 0.05, centring - needs);
  const PX = 920 + ox, PY = 350, BASE = 590, HANG = 120, OX = 1480 + ox, OY = 520, OS = 1.4, barY = 720, SY = 800;
  const needAts = [
    cueFrom(s, "既懂行", "competence", expert),
    cueFrom(s, "又了解事实", "the facts", expert)
  ];
  const lost = ramp(t, missing + 0.05, 0.3), back = glide(t, domainOwner + 0.6, Math.abs(1480 - 64 - 920 - B) + 280), gone = lost * (1 - back);
  const landed = needAts.map((at) => soon(t, at + 0.05, 0.5)), tilt = (landed[0] - landed[1] * (1 - gone)) * 0.12;
  const ends = [
    [PX - B * Math.cos(tilt), PY + B * Math.sin(tilt)],
    [PX + B * Math.cos(tilt), PY - B * Math.sin(tilt)]
  ];
  const pans = ends.map(([x, y]) => [x, y + HANG]);
  line(PX, PY, PX, BASE, { color: P.ink, alpha: g5, width: 3 });
  line(PX - 70, BASE, PX + 70, BASE, { color: P.ink, alpha: g5, width: 3 });
  line(...ends[0], ...ends[1], { color: P.ink, alpha: g5, width: 4 });
  dot(PX, PY, 7, { color: P.ink, alpha: g5 });
  nameText(L("专业判断", "Professional judgment"), PX, PY - 30 - NAME_GAP, {
    valign: "bottom",
    alpha: g5 * named(t, expert)
  });
  const BOWL = [Math.PI * 0.344, Math.PI * 0.656];
  stroke(
    () => pans.forEach(
      ([x, y], i) => [-PW, PW].forEach((d) => {
        ctx.moveTo(...ends[i]);
        ctx.lineTo(x + d, y);
      })
    ),
    { color: P.line, alpha: g5, width: 2 }
  );
  stroke(
    () => pans.forEach(([x, y]) => {
      ctx.moveTo(x + 136 * Math.cos(BOWL[0]), y - 120 + 136 * Math.sin(BOWL[0]));
      ctx.arc(x, y - 120, 136, ...BOWL);
    }),
    { color: P.ink, alpha: g5, width: 3 }
  );
  pans.forEach(([x, y], i) => {
    const lit = speaking(t, needAts, i);
    if (lit > 0)
      ring(x, y - 24, 32, {
        color: P.evidence,
        alpha: lit * restMark(P.evidence, 0.5) * g5,
        width: 2
      });
  });
  const [[lx, ly], [rx, ry]] = pans, q = needAts.map((at) => ramp(t, at - 0.15, 0.4) * g5);
  ring(lx, ly - 24, 18, { color: P.evidence, alpha: q[0], width: 2.5 });
  check(lx, ly - 23, 18, { alpha: q[0] });
  documentIcon(rx - 17, ry - 50, 34, 44, { alpha: q[1] * (1 - lost), rows: 3 });
  text("?", rx, ry - 26, 26, {
    role: "mark",
    align: "center",
    color: P.unknown,
    alpha: q[1] * ramp(t, missing + 0.35, 0.4) * (1 - back)
  });
  nameText(L("既懂行", "Competence"), PX - B - PW - NAME_GAP, PY + HANG - 12, {
    align: "right",
    alpha: g5 * listIn(t, needAts, 0),
    set: "needs"
  });
  nameText(L("又了解事实", "The facts"), PX + B + PW + NAME_GAP, PY + HANG - 12, {
    align: "left",
    color: blend(P.ink, P.muted, gone),
    alpha: g5 * listIn(t, needAts, 1),
    set: "needs"
  });
  const come = ramp(t, domainOwner - 0.15, 0.4) * g5;
  person(OX, OY, { color: P.authority, alpha: come, size: OS });
  nameText(L("相应领域的负责人", "Domain owner"), OX, OY + 15 * OS * 1.51 + NAME_GAP, {
    valign: "top",
    color: P.authority,
    alpha: g5 * named(t, domainOwner)
  });
  const fx0 = OX - 64, fy0 = OY - 2, fx = fx0 + back * back * (rx - fx0), fy = fy0 - 2 * back * (1 - back) * 280 + back * back * (ry - fy0);
  documentIcon(fx - 17, fy - 50, 34, 44, { alpha: come * lost, rows: 3 });
  link(PX, BASE + 10, PX, barY, {
    color: P.unknown,
    alpha: ramp(t, alone - 0.1, 0.3) * g5,
    upto: drawShare(t, alone + 0.05, Math.abs(barY - (BASE + 10)), 0.7),
    end: false,
    dash: [8, 8]
  });
  line(PX - 28, barY, PX + 28, barY, {
    color: P.unknown,
    alpha: ramp(t, noPower + 0.05, 0.3) * g5,
    width: 4
  });
  nameText(L("懂行", "Expertise alone"), PX - 24, (BASE + 10 + barY) / 2, {
    align: "right",
    alpha: g5 * named(t, alone)
  });
  seal(PX, SY, 34, { alpha: g5 * 0.9 * named(t, noPower), hollow: true });
  nameText(L("有权决定或动手", "Authority to decide or act"), PX, SY + 34 + NAME_GAP, {
    valign: "top",
    color: P.authority,
    alpha: g5 * named(t, noPower)
  });
}

// picture/film/scenes/p03/scene.js
scenes["03"] = function(s, t) {
  const [bind, agentAt, search, reason, act, people] = cues(s, [
    ["这份指南适用于部门成员", "the guidelines apply to members"],
    ["智能体", "agents they delegate"],
    ["调查", "investigate"],
    ["推理", "reason"],
    ["和动手", "and act"],
    ["始终在人手里", "stay with people"]
  ]);
  const duties = cues(s, [
    ["方向", "direction"],
    ["授权", "authorization"],
    ["决定", "decisions"],
    ["后果", "responsibility for consequences"]
  ]);
  const [two, apart, decideQ, factQ] = cues(s, [
    ["两种依据", "two kinds of authority"],
    ["分开看", "stay apart"],
    ["行动依据", "authority to act"],
    ["事实依据", "authority about facts"]
  ]);
  const ranks = cues(s, [
    ["法律", "law"],
    ["这件事的决策负责人", "what the decision owner"],
    ["有效的契约", "then contracts"],
    ["工作计划、临时约定", "work plans provisional agreements"]
  ]);
  const order = cue(s, "有先后", "it has an order"), actQ = cueFrom(s, "行动依据", "authority to act", factQ);
  const orderCut = en ? ranks[0] : cueFrom(s, "依据", "", actQ);
  const truthQ = cueFrom(s, "事实依据", "authority about facts", ranks[3]);
  const asks = en ? [cueFrom(s, "", "answers", actQ), cueFrom(s, "", "answers", truthQ)] : [Infinity, Infinity];
  const [record, observe, onlyLeads] = cues(s, [
    ["原始记录", "primary records"],
    ["能重复的观察", "repeatable observations"],
    ["只能算线索", "only leads"]
  ]);
  const attrs = en ? cues(s, [
    ["", "a source"],
    ["", "time"],
    ["", "subject"],
    ["", "scope"]
  ]) : cues(s, [
    ["并说清来源", ""],
    ["时间", ""],
    ["对象和范围", ""]
  ]);
  const leads = en ? cues(s, [
    ["", "second-hand accounts"],
    ["", "caches"],
    ["", "generated views"],
    ["", "agent output"],
    ["", "memory"]
  ]) : cues(s, [
    ["转述", ""],
    ["记忆", ""],
    ["缓存", ""],
    ["派生视图", ""],
    ["智能体的输出", ""]
  ]);
  const [noTrue, conflict, report, quiet] = cues(s, [
    ["假的变成真的", "make a false fact true"],
    ["核验却发现数据有错", "verification finds the data wrong"],
    ["讲出冲突和影响", "report the conflict"],
    ["悄悄按决定或核验结果去做", "act as if one side"]
  ]);
  const release = cue(s, "定了今天发布", "if a release is set for today");
  const [expert, missing, domainOwner, alone] = cues(s, [
    ["专业判断", "professional judgment belongs"],
    ["缺了哪一样", "either is missing"],
    ["相应领域的负责人", "bring in the domain owner"],
    ["懂行", "expertise alone"]
  ]);
  const noPower = cueFrom(s, "不等于有权", "no authority to decide", alone), judgeAt = Math.min(expert, alone);
  const membersAt = cue(s, "部门成员", "members"), delegate = cue(s, "委托", "delegate to");
  const reachOf = (ats, ys, top) => ats.reduce((sum, at, i) => {
    const d = ys[i] - (i ? ys[i - 1] : top);
    return sum + drawShare(t, at - 0.15, d, 0.5) * d;
  }, 0) / (ys[ats.length - 1] - top);
  const g1 = ramp(t, opening(s), 0.7) * stageOut(t, two);
  if (g1 > 0)
    s03Guidelines(
      s,
      t,
      bind,
      agentAt,
      search,
      reason,
      act,
      people,
      duties,
      membersAt,
      delegate,
      reachOf,
      g1
    );
  const versus = cue(s, "行动依据不能", "authority to act cannot");
  const kinds = stageIn(t, two) * stageOut(t, orderCut);
  if (kinds > 0) s03Kinds(t, two, apart, decideQ, factQ, order, actQ, asks, kinds);
  const rise = en ? record - 0.15 - glideTime(650 - 370 + 50 - 36) : Infinity;
  const g2 = stageIn(t, orderCut) * (en ? 1 - ramp(t, rise + 0.2, 0.4) : stageOut(t, truthQ));
  if (g2 > 0) s03ToAct(s, t, decideQ, ranks, order, truthQ, g2);
  const g3f = stageIn(t, truthQ) * stageOut(t, versus);
  if (g3f > 0) s03AboutFacts(t, truthQ, asks, record, observe, onlyLeads, attrs, leads, rise, g3f);
  const g4c = stageIn(t, versus) * stageOut(t, judgeAt);
  if (g4c > 0) s03Against(s, t, noTrue, conflict, report, quiet, release, versus, g4c);
  const g5 = stageIn(t, judgeAt);
  if (g5 > 0) s03Judgment(s, t, expert, missing, domainOwner, alone, noPower, g5);
};

// picture/film/scenes/p04/boundaries.js
function s04Boundaries(t, truth, boundaryRows, W1, LX1, ox, clear, starts, said, one) {
  const rows = boundaryRows, LX = LX1 + ox, W = W1, G = 36;
  const tops = stackTops(
    rows.map(([term, qual]) => termRowLayout([term], qual, W, false).height),
    CONTENT_CY,
    44
  );
  rows.forEach(([term, qual], r) => {
    const at = r ? starts[r] : Math.max(truth + STAGE_CUT + 0.15, clear), keyAt = r ? at : at + 0.25;
    const my = tops[r] + labelSize(LABEL) / 2, gx = LX - 34 - G, h = G / 2;
    const c = [
      [gx, my - h],
      [gx + G, my - h],
      [gx + G, my + h],
      [gx, my + h]
    ], [a, b] = [c[r], c[(r + 1) % 4]];
    box(gx, my - h, G, G, {
      stroke: P.line,
      alpha: one * ramp(t, keyAt - 0.15, 0.4),
      radius: 2,
      width: 2
    });
    const drawn = soon(t, keyAt - 0.15, 0.5);
    if (drawn > 0)
      line(a[0], a[1], mix(a[0], b[0], drawn), mix(a[1], b[1], drawn), {
        color: P.authority,
        alpha: one,
        width: 8,
        cap: "butt"
      });
    termRow(t, [term], [at], qual, said[r], LX, tops[r], {
      width: W,
      alpha: one * listLevel(t, starts, r),
      set: "boundaries",
      build: en && r === 3,
      inline: false
    });
  });
}
function s04Escalation(s, t, inside, near, breach, caseRows, W2, LX2, ox, FX, FY, FS, two) {
  const freeAts = cues(s, [
    ["欢迎自主", "autonomy"],
    ["探索", "exploration"],
    ["创造", "creative work"]
  ]);
  const nearAts = [
    cueFrom(s, "停下来", "stop", near),
    ...cues(s, [
      ["讲出来", "make it visible"],
      ["并上报", "and escalate"]
    ])
  ];
  const outAts = cues(s, [
    ["停下受影响", "stop the affected"],
    ["如实说明", "disclose it"],
    ["在权限内纠正", "correct it within"],
    ["按风险上报", "escalate as the risk"]
  ]);
  const free = ramp(t, freeAts[0] - 0.15, 0.5) * two;
  for (let k = 0; k < 5; k++) {
    const x = FX + 96 + Math.sin(voiceTime(t) * 0.6 + k * 1.9) * 52, y = FY + FS / 2 - 10 + Math.cos(voiceTime(t) * 0.47 + k * 2.4) * 110;
    dot(x, y, 8, { color: P.evidence, alpha: free * 0.9 });
  }
  const OX = FX + FS - 46, OY = FY + 70, owner = ramp(t, nearAts[2] - 0.15, 0.4) * two;
  person(OX, OY, { color: P.authority, alpha: owner, size: 0.8 });
  const nx = mix(FX + FS * 0.5, FX + FS - 46, soon(t, near - 0.1, 1)), ny = FY + FS * 0.6, nq = ramp(t, near - 0.15, 0.4) * two;
  dot(nx, ny, 10, { color: P.ink, alpha: nq });
  ring(nx, ny, 20, {
    color: P.authority,
    alpha: ramp(t, nearAts[1] - 0.15, 0.3) * two,
    width: 2
  });
  link(nx, ny - 34, OX, OY + 42, {
    color: P.authority,
    alpha: two,
    draw: { t, at: nearAts[2] - 0.1 },
    width: 2.5
  });
  const bx = FX + 210, out = soon(t, breach - 0.1, 0.7), back = soon(t, outAts[2] - 0.1, 0.8), by = mix(FY + FS - 60, FY + FS + 46, out * (1 - back));
  const bq = ramp(t, breach - 0.15, 0.3) * two;
  dot(bx, by, 10, { color: blend(P.ink, P.unknown, clamp(out * 2) * (1 - back)), alpha: bq });
  ring(bx, by, 20, { color: P.authority, alpha: ramp(t, outAts[1] - 0.15, 0.3) * two, width: 2 });
  link(bx, by - 34, OX - 30, OY, {
    route: "vh",
    color: P.authority,
    alpha: two,
    draw: { t, at: outAts[3] - 0.1 },
    width: 2.5
  });
  const rows = caseRows.map(([term, qual], r) => [
    term,
    [[inside, near, breach][r]],
    qual,
    [freeAts, nearAts, outAts][r]
  ]);
  const LX = LX2 + ox, W = W2, rowAt = [inside, near, breach], hue = [P.evidence, P.ink, P.unknown];
  const tops = stackTops(
    rows.map(([term, , qual]) => termRowLayout([term], qual, W, false).height),
    CONTENT_CY,
    64
  );
  rows.forEach(([term, termAts, qual, qualAts], r) => {
    const my = tops[r] + labelSize(LABEL) / 2, lit = speaking(t, rowAt, r);
    dot(LX - 34, my, 8, { color: hue[r], alpha: two * ramp(t, rowAt[r] - 0.15, 0.4) });
    if (lit > 0)
      ring(LX - 34, my, 17, {
        color: hue[r],
        alpha: two * lit * restMark(hue[r], 0.6),
        width: 2
      });
    termRow(t, [term], termAts, qual, qualAts, LX, tops[r], {
      width: W,
      alpha: two * listLevel(t, rowAt, r),
      set: "cases",
      inline: false
    });
  });
}
function s04Duties(s, t, duty, four4) {
  const xs = [560, 960, 1360], S = 260, CY = CONTENT_CY - 50, docs = [
    [64, 82],
    [92, 118],
    [126, 162]
  ];
  const notAt = cue(s, "该尽的义务", "every duty"), formLit = ramp(t, duty - 0.15, 0.4) * (1 - ramp(t, notAt - 0.15, 0.4));
  const dutyLit = ramp(t, notAt - 0.15, 0.4);
  xs.forEach((x, i) => {
    const [w, h] = docs[i];
    documentIcon(x - w / 2, CY - h / 2, w, h, {
      alpha: four4,
      rows: 3 + i,
      stroke: blend(P.ink, P.evidence, formLit)
    });
  });
  stroke(
    () => xs.forEach((x) => {
      const c = [
        [x - S / 2, CY - S / 2],
        [x + S / 2, CY - S / 2],
        [x + S / 2, CY + S / 2],
        [x - S / 2, CY + S / 2]
      ];
      c.forEach(([x1, y1], j) => {
        const [x2, y2] = c[(j + 1) % 4], drawn = drawShare(t, duty + STAGE_CUT - 0.1 + j * 0.12, S);
        if (drawn > 0.01) {
          ctx.moveTo(x1, y1);
          ctx.lineTo(mix(x1, x2, drawn), mix(y1, y2, drawn));
        }
      });
    }),
    { color: P.authority, alpha: four4, width: 3 + dutyLit }
  );
  nameText(L("不论风险高低", "Whatever the risk"), xs[1], CY - S / 2 - NAME_GAP, {
    valign: "bottom",
    alpha: four4 * named(t, duty)
  });
  const BY = CY + S / 2 + 26, bracket = four4 * named(t, notAt);
  stroke(
    () => {
      ctx.moveTo(xs[0] - S / 2, BY - 12);
      ctx.lineTo(xs[0] - S / 2, BY);
      ctx.lineTo(xs[2] + S / 2, BY);
      ctx.lineTo(xs[2] + S / 2, BY - 12);
    },
    { color: P.authority, alpha: bracket, width: 2.5 }
  );
  nameText(L("义务一样不能少", "Every duty"), xs[1], BY + NAME_GAP, {
    valign: "top",
    alpha: bracket
  });
}

// picture/film/scenes/p04/names.js
var s04Groups = (parts, groups = [0]) => groups.map((k, g) => [k, parts.slice(k, groups[g + 1] ?? parts.length)]);
var s04Height = (parts, width, size, groups) => blockHeight(
  s04Groups(parts, groups).reduce((n, [, v]) => n + growLines(v, width, size).length, 0),
  size
);
function s04Grow(t, parts, ats, x, y, {
  width,
  size = LABEL,
  align = "left",
  alpha = 1,
  color = P.ink,
  set = null,
  groups = [0],
  build = false,
  whole = null
} = {}) {
  const blocks = s04Groups(parts, groups).map(([k, v]) => [k, v, growTexts(v, width, size)]), step = labelSize(size) * LEADING;
  const top = y - blockHeight(
    blocks.reduce((n, [, , lines]) => n + lines.length, 0),
    size
  ) / 2;
  let r = 0;
  blocks.forEach(
    ([k, v, lines]) => lines.forEach((line2) => {
      const w = line2.reduce((sum, [, piece]) => sum + measure(piece, size), 0);
      const hang = align === "right" && /[、，。；：！？]$/u.test(line2.at(-1)[1]) ? 0.5 * labelSize(size) : 0;
      growName(
        t,
        line2.map(([, piece]) => piece),
        line2.map(([j]) => build ? ats[k + j] ?? ats[k] : ats[k]),
        align === "right" ? x - w + hang : x,
        top + r++ * step,
        { size, alpha, color, whole: whole ?? v.join(""), set, build }
      );
    })
  );
}

// picture/film/scenes/p04/tiers.js
function s04Tiers(s, t, form, high, three) {
  const onceAt = cue(s, "一次讲清", "one clear exchange"), recordAt = cue(s, "现有的工作记录", "the existing work record");
  const needs = cues(s, [
    ["书面决定", "written decision"],
    ["明确授权", "explicit authorization"],
    ["回滚或降级预案", "a rollback or degradation path"],
    ["独立评审", "independent review"],
    ["最后由人验收", "human acceptance"]
  ]);
  const highFrom = en ? cue(s, "", "high risk means") : high;
  const triggers = (en ? [
    "production",
    "funds",
    "sensitive data",
    "security or compliance",
    "deletion",
    "external commitments",
    "irreversible consequences"
  ] : ["生产", "资金", "敏感数据", "安全合规", "或者删除覆盖", "对外承诺", "后果不可逆"]).map((w) => cueFrom(s, en ? "" : w, en ? w : "", highFrom));
  const lowAts = cues(s, [
    ["局部", "local"],
    ["可逆", "reversible"],
    ["不对外承诺", "no external commitment"]
  ]);
  const midAts = cues(s, [
    ["跨角色", "cross-role"],
    ["有几种方案", "or work with"],
    ["重大不确定", "or material uncertainty"]
  ]);
  const problemAt = cueFrom(s, "问题", "the problem", recordAt);
  const recordRows = [
    problemAt,
    cueFrom(s, "方案", "options", problemAt),
    cueFrom(s, "做法", "execution path", problemAt),
    cueFrom(s, "验收", "acceptance", problemAt)
  ];
  const onceRows = en ? [0, 1, 2].map((k) => onceAt + 0.2 + k * 0.3) : [cue(s, "结论", ""), cue(s, "依据", ""), cueFrom(s, "行动", "", onceAt)];
  const tiers = en ? [
    [
      ["One clear exchange"],
      [onceAt],
      ["Local", ", reversible work", " with no external commitment"],
      lowAts,
      onceRows
    ],
    [
      [
        "The existing work record:",
        " the problem",
        ", options",
        ", execution path",
        " and acceptance"
      ],
      [recordAt, ...recordRows],
      [
        "Cross-role or extended work",
        ", or work with competing options",
        " or material uncertainty"
      ],
      midAts,
      recordRows
    ],
    [
      [
        "Written decision",
        "Explicit authorization",
        "Rollback or degradation",
        "Independent review",
        "Human acceptance"
      ],
      needs,
      [
        "Production,",
        "funds,",
        "sensitive data,",
        "security or compliance,",
        "deletion or overwrite,",
        "external commitments",
        "or irreversible consequences"
      ],
      triggers,
      needs
    ]
  ] : [
    [
      ["一次讲清", "结论", "、依据", "和行动"],
      [onceAt, ...onceRows],
      ["局部", "、可逆", "、不对外承诺的工作"],
      lowAts,
      onceRows
    ],
    [
      ["在现有的工作记录里写清", "问题", "、方案", "、做法", "和验收"],
      [recordAt, ...recordRows],
      ["工作跨角色", "、周期长", "、有几种方案", "或者有重大不确定性"],
      [midAts[0], cue(s, "周期长", ""), midAts[1], cueFrom(s, "或者", "", midAts[1])],
      recordRows
    ],
    [
      ["书面决定", "、明确授权", "、回滚或降级预案", "、独立评审", "，最后由人验收"],
      needs,
      [
        "涉及生产",
        "、资金",
        "、敏感数据",
        "、安全合规，",
        "或者删除覆盖",
        "、对外承诺",
        "、后果不可逆的事"
      ],
      triggers,
      needs
    ]
  ];
  const W = 600, QW = (i) => L([360, 380, 360][i], [620, 420, 600][i]), tw = (i) => i === 2 ? L(540, 760) : W, docs = [
    [60, 76],
    [86, 110],
    [118, 152]
  ], GAP = 45 + 34;
  const groups = (i) => !en && i === 1 ? [0, 3] : en && i === 2 ? [0, 1, 2, 3, 4, 5, 6] : [0], forms = (i) => en && i === 2 ? [0, 1, 2, 3, 4] : [0];
  const workWhole = (i) => en && i === 2 ? tiers[2][2].join(" ") : null;
  const headH = en ? 0 : labelSize(LABEL) + TERM_STACK;
  const blockW = (parts, width, size, g = [0]) => Math.max(
    ...s04Groups(parts, g).flatMap(
      ([, v]) => growTexts(v, width, size).map(
        (line2) => line2.reduce((sum, [, piece]) => sum + measure(piece, size), 0)
      )
    )
  );
  const lefts = tiers.map(([, , qual], i) => blockW(qual, QW(i), NOTE, groups(i))), rights = tiers.map(([term], i) => blockW(term, tw(i), LABEL, forms(i)));
  const head = L("要留多少记录、走多少手续", "The process"), foot = L("风险", "Risk");
  const axis = Math.max(measure(head) / 2, measure(foot) / 2, docs[2][0] / 2);
  const reach = (blocks, widths) => blocks.length ? GAP + Math.max(...blocks.map((i) => widths[i])) : axis;
  const lean = ([l, r]) => (reach(r, rights) - reach(l, lefts)) / 2;
  const centred = (pictures2) => -(Math.min(...pictures2.map(lean)) + Math.max(...pictures2.map(lean))) / 2;
  const workFirst = !en, third = workFirst ? triggers.at(-1) : needs.at(-1);
  const pictures = en ? [
    [[0], []],
    [[0], [0]],
    [[0, 1], [0]],
    [
      [0, 1],
      [0, 1]
    ],
    [
      [0, 1],
      [0, 1, 2]
    ],
    [
      [0, 1, 2],
      [0, 1, 2]
    ]
  ] : [
    [[], []],
    [[0], []],
    [[0], [0]],
    [[0, 1], [0]],
    [
      [0, 1],
      [0, 1]
    ],
    [
      [0, 1, 2],
      [0, 1]
    ],
    [
      [0, 1, 2],
      [0, 1, 2]
    ]
  ];
  const first = pictures.findIndex(([, r]) => r.length), last = pictures.length - 2, second = pictures.findIndex(([, r]) => r.length > 1);
  const [alone, built, whole] = [
    pictures.slice(0, first),
    pictures.slice(first, en ? second : last + 1),
    pictures.slice(en ? second : last)
  ].map(centred);
  const turn = en ? tiers[1][1][0] : third;
  const lone = en ? alone : -lean(pictures[0]), joined = en ? alone : -lean(pictures[1]);
  const SX = 960 + lone + (joined - lone) * glide(t, tiers[0][3][0] + 0.05, joined - lone) + (built - joined) * glide(t, tiers[0][1][0] + 0.05, built - joined) + (whole - built) * glide(t, turn + 0.05, whole - built);
  const tierAt = en ? tiers.map(([, , , qualAts], i) => i < 2 ? qualAts[0] : cue(s, "", "high-risk work")) : [cue(s, "轻量档", ""), cue(s, "标准档", ""), cue(s, "高风险档", "")];
  const listedAt = en ? [] : cues(s, [
    ["轻量", ""],
    ["标准", ""],
    ["高风险", ""]
  ]);
  const heights = tiers.map(([term, , qual], i) => {
    const formH = s04Height(term, tw(i), LABEL, forms(i)), leftH = headH + s04Height(qual, QW(i), NOTE, groups(i));
    return Math.max(docs[i][1], formH, leftH, en ? 0 : 2 * leftH - formH);
  });
  const tops = stackTops(heights, CONTENT_CY - 20, 40), mids = tops.map((y, i) => y + heights[i] / 2), end = tops[2] + heights[2] + 24;
  const from = tops[0] - 24;
  link(SX, from, SX, end, { alpha: three, flowing: since(t, form + STAGE_CUT), lag: -0.12 });
  nameText(head, SX, from - NAME_GAP, { valign: "bottom", alpha: three * named(t, form) });
  nameText(foot, SX, end + NAME_GAP, {
    valign: "top",
    color: P.muted,
    alpha: three * named(t, cueFrom(s, "风险", "risk", form))
  });
  tiers.forEach(([term, termAts, qual, qualAts, rowAts], i) => {
    const docAt = en ? termAts[0] : Math.min(termAts[0], listedAt[i]);
    const [w, h] = docs[i], x = SX - w / 2, y = mids[i] - h / 2, q = three * ramp(t, docAt - 0.15, 0.4), lit = speaking(t, tierAt, i);
    box(x, y, w, h, { fill: P.ground, alpha: q, radius: 4 });
    documentIcon(x, y, w, h, { alpha: q, rows: 0, stroke: blend(P.ink, P.evidence, lit) });
    stroke(
      () => rowAts.forEach((at, k) => {
        const ry = y + h * (0.3 + k * 0.55 / rowAts.length), x0 = x + w * 0.14, x1 = x + w * (k % 2 ? 0.62 : 0.82), drawn = soon(t, at - 0.1, 0.5);
        if (drawn > 0.01) {
          ctx.moveTo(x0, ry);
          ctx.lineTo(mix(x0, x1, drawn), ry);
        }
      }),
      { color: P.muted, alpha: q, width: 2 }
    );
    const level = three * listLevel(t, tierAt, i);
    const workH = s04Height(qual, QW(i), NOTE, groups(i)), headY = mids[i] - s04Height(term, tw(i), LABEL, forms(i)) / 2 + labelSize(LABEL) / 2;
    if (!en)
      nameText(["轻量", "标准", "高风险"][i], SX - GAP, headY, {
        align: "right",
        alpha: level * named(t, listedAt[i]),
        set: "forms"
      });
    s04Grow(
      t,
      qual,
      qualAts,
      SX - GAP,
      en ? mids[i] : headY + labelSize(LABEL) / 2 + TERM_STACK + workH / 2,
      {
        width: QW(i),
        size: NOTE,
        color: P.muted,
        align: "right",
        alpha: mutedLevel(level),
        set: "forms",
        groups: groups(i),
        build: true,
        whole: workWhole(i)
      }
    );
    s04Grow(t, term, termAts, SX + GAP, mids[i], {
      width: tw(i),
      alpha: level,
      set: "forms",
      groups: forms(i),
      build: true
    });
  });
}

// picture/film/scenes/p04/scene.js
scenes["04"] = function(s, t) {
  const [four, truth, bounds, owner, done, inside, near, breach, form, high, duty] = cues(s, [
    ["四条底线", "four boundaries"],
    ["说真话", "tell the truth"],
    ["守边界", "stay in bounds"],
    ["责任落到人", "name the owner"],
    ["不虚报完成", "do not claim false completion"],
    ["在这四条底线之内", "inside these boundaries"],
    ["会越线时", "would cross one"],
    ["已经越线", "after a breach"],
    ["要留多少记录", "risk sets the process"],
    ["涉及生产", "production funds"],
    ["不论风险高低", "whatever the risk"]
  ]);
  const boundaryRows = en ? [
    [
      "Tell the truth",
      ["no fabrication", ", hiding", ", cherry-picking", " or false certainty"]
    ],
    [
      "Stay in bounds",
      [
        "subject and time",
        ", professional competence",
        " and permission",
        ", data, security, compliance",
        " and action"
      ]
    ],
    [
      "Name the owner",
      ["every important judgment", ", decision", ", change", " and acceptance"]
    ],
    [
      "Do not claim false completion",
      [
        "without current evidence",
        " matching the claim",
        ", call nothing complete",
        ", correct",
        ", usable",
        " or adopted"
      ]
    ]
  ] : [
    ["说真话", ["不编造", "、不隐瞒", "、不挑着说", "、没把握的不说成有把握"]],
    ["守边界", ["对象和时间", "、专业能力和权限", "，数据、安全、合规", "和行动的界限"]],
    ["责任落到人", ["重要的判断", "、决定", "、变更", "和验收", "，都有人负责"]],
    [
      "不虚报完成",
      ["说做完了", "、做对了", "、能用了", "、有人在用", "，都要有当前的、对得上的证据"]
    ]
  ];
  const caseRows = en ? [
    ["Inside these boundaries", ["autonomy", ", exploration", ", creative work"]],
    ["When an action would cross one", ["stop", ", make it visible", ", escalate"]],
    [
      "After a breach",
      ["stop", ", disclose", ", correct within authority", ", escalate by risk"]
    ]
  ] : [
    ["底线之内", ["欢迎自主", "、探索", "和创造"]],
    ["会越线", ["停下来", "，讲出来", "，并上报"]],
    ["已经越线", ["就停下受影响的事", "，如实说明", "，在权限内纠正", "，并按风险上报"]]
  ];
  const W1 = L(480, 620), W2 = L(360, 620), LX1 = 840, LX2 = L(900, 940);
  const rowW = ([term, qual], W) => Math.max(
    measure(term),
    ...growTexts(qual, W, NOTE).map(
      (line2) => line2.reduce((sum, [, v]) => sum + measure(v, NOTE), 0)
    )
  );
  const place = (LX, widths, built) => 960 - (290 + LX + (Math.max(...widths.slice(0, built)) + Math.max(...widths)) / 2) / 2;
  const caseW = caseRows.map((v) => rowW(v, W2));
  const ox = mix(
    place(
      LX1,
      boundaryRows.map((v) => rowW(v, W1)),
      1
    ),
    L(place(LX2, caseW, 2), place(LX2, caseW.slice(0, 2), 2)),
    soon(t, inside + 0.05, 0.55)
  ) + L(0, place(LX2, caseW, 3) - place(LX2, caseW.slice(0, 2), 2)) * soon(t, breach + 0.05, 0.55);
  const formed = stageIn(t, truth);
  const go = Math.max(...thoughtJoins.map(([, next]) => next).filter((v) => v <= truth + 1e-6)) + 0.05;
  const way = 735 - 290 - place(
    LX1,
    boundaryRows.map((v) => rowW(v, W1)),
    1
  ), clear = go + 0.85 * glideTime(way);
  const FX = mix(735, 290 + ox, glide(t, go, way)), FY = 275, FS = 450, corner = [
    [FX, FY],
    [FX + FS, FY],
    [FX + FS, FY + FS],
    [FX, FY + FS]
  ];
  const starts = [truth, bounds, owner, done], field = stageOut(t, form);
  const said = en ? [
    cues(s, [
      ["", "no fabrication"],
      ["", "no hiding"],
      ["", "no cherry-picking"],
      ["", "no uncertainty"]
    ]),
    cues(s, [
      ["", "subject and time"],
      ["", "professional competence and permission"],
      ["", "data security compliance"],
      ["", "and action"]
    ]),
    cues(s, [
      ["", "every important"],
      ["", "decision"],
      ["", "change"],
      ["", "acceptance"]
    ]),
    cues(s, [
      ["", "without current evidence"],
      ["", "matching the claim"],
      ["", "call nothing complete"],
      ["", "correct"],
      ["", "usable"],
      ["", "or adopted"]
    ])
  ] : [
    cues(s, [
      ["不编造", ""],
      ["不隐瞒", ""],
      ["不挑着说", ""],
      ["没把握的", ""]
    ]),
    cues(s, [
      ["对象和时间", ""],
      ["专业能力和权限", ""],
      ["数据安全合规", ""],
      ["行动的界限", ""]
    ]),
    cues(s, [
      ["重要的", ""],
      ["决定", ""],
      ["变更", ""],
      ["验收", ""],
      ["有人负责", ""]
    ]),
    cues(s, [
      ["说做完了", ""],
      ["做对了", ""],
      ["能用了", ""],
      ["有人在用", ""],
      ["都要有当前的", ""]
    ])
  ];
  const steps = said;
  const gold = (j) => saidShare(t, steps[j]);
  const counted = (j) => soon(t, Math.min(four - 0.1, opening(s) + 0.3) + j * 0.25, 0.5);
  const sideTo = (j, q) => {
    const [x1, y1] = corner[j], [x2, y2] = corner[(j + 1) % 4];
    return [x1, y1, mix(x1, x2, q), mix(y1, y2, q)];
  };
  const sides = (share, keep, o) => stroke(
    () => corner.forEach((_, j) => {
      const q = share(j);
      if (keep(j) && q > 0.01) {
        const [x1, y1, x2, y2] = sideTo(j, q);
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
      }
    }),
    { alpha: field, width: 4, ...o }
  );
  if (!formed) [0, 1].forEach((k) => sides(counted, (j) => j % 2 === k, { color: P.line }));
  else {
    const lits = corner.map((_, j) => speaking(t, starts, j)), golds = corner.map((_, j) => gold(j)), quiet = (j) => lits[j] <= 0;
    sides(counted, quiet, { color: P.line });
    sides(gold, (j) => quiet(j) && golds[j] >= 1, { color: P.authority });
    corner.forEach((_, j) => {
      const width = 4 + 2 * lits[j];
      if (!quiet(j)) line(...sideTo(j, counted(j)), { color: P.line, alpha: field, width });
      if (golds[j] > 0 && (!quiet(j) || golds[j] < 1))
        line(...sideTo(j, golds[j]), { color: P.authority, alpha: field, width });
    });
  }
  const one = stageOut(t, inside);
  if (one > 0) s04Boundaries(t, truth, boundaryRows, W1, LX1, ox, clear, starts, said, one);
  nameText(L("四条底线", "Four boundaries"), FX, FY - NAME_GAP, {
    align: "left",
    valign: "bottom",
    alpha: field * named(t, four)
  });
  const two = stageIn(t, inside) * field;
  if (two > 0) s04Escalation(s, t, inside, near, breach, caseRows, W2, LX2, ox, FX, FY, FS, two);
  const three = stageIn(t, form) * stageOut(t, duty);
  if (three > 0) s04Tiers(s, t, form, high, three);
  const four4 = stageIn(t, duty);
  if (four4 > 0) s04Duties(s, t, duty, four4);
};

// picture/film/scenes/p05/decision.js
function s05Decision(s, t, analysis, which, who, what, when, one) {
  const parts = en ? [
    [who, "Who decides", "who"],
    [what, "What", "what"],
    [when, "By when", "when"]
  ] : [
    [who, "谁", "who"],
    [when, "在什么时候之前", "when"],
    [what, "要决定什么", "what"]
  ];
  const GX0 = 560, DX0 = 1130, IX0 = 1360, SX = 100, FP = 44, partsW = Math.max(...parts.map(([, label]) => measure(label)));
  const alone = 960 - (GX0 + 2 * SX), decided = 960 - (GX0 - FP + DX0 + measure(L("哪个决定", "Which decision")) / 2) / 2;
  const parted = 960 - (GX0 - FP + IX0 + 28 + NAME_GAP + partsW) / 2;
  const sh = alone + (decided - alone) * glide(t, which + 0.05, decided - alone) + (parted - decided) * glide(t, Math.min(...parts.map(([at]) => at)) - 0.15, parted - decided);
  const g = one * clearOfTitle(s, t, 330), GX = GX0 + sh, GY = 410, SY = 90, DX = DX0 + sh, IX = IX0 + sh, ys = [400, 500, 600];
  const drift = 1 - soon(t, which - 0.2, 1.2);
  for (let k = 0; k < 15; k++) {
    const x = GX + k % 5 * SX + Math.sin(k * 2.3 + voiceTime(t) * 0.7) * 20 * drift;
    const y = GY + Math.floor(k / 5) * SY + Math.cos(k * 1.7 + voiceTime(t) * 0.6) * 20 * drift;
    dot(x, y, 8, { color: P.muted, alpha: g * 0.85 * ramp(t, opening(s) + 0.2 + k * 0.07, 0.4) });
  }
  const frameQ = g * named(t, analysis), closed = soon(t, which + 0.05, 0.6), FB = GY + 2 * SY + FP;
  box(GX - FP, GY - FP, 4 * SX + 2 * FP, 2 * SY + 2 * FP, {
    stroke: P.line,
    alpha: frameQ * (1 - closed),
    radius: 14,
    width: 3,
    dash: [10, 8]
  });
  box(GX - FP, GY - FP, 4 * SX + 2 * FP, 2 * SY + 2 * FP, {
    stroke: P.line,
    alpha: frameQ * closed,
    radius: 14,
    width: 3
  });
  nameText(L("分析", "Analysis"), GX + 2 * SX, FB + NAME_GAP, {
    valign: "top",
    alpha: g * named(t, analysis)
  });
  link(GX + 4 * SX + FP + 6, 500, DX - 30, 500, {
    alpha: g,
    draw: { t, at: which - 0.05 },
    flowing: since(t, which + 0.75)
  });
  const ats = parts.map(([at]) => at), dec = named(t, which) * g;
  ring(DX, 500, 22, { color: P.authority, alpha: dec, width: 3 });
  dot(DX, 500, 8, { color: P.authority, alpha: dec });
  nameText(L("哪个决定", "Which decision"), DX, ys[0], { color: P.authority, alpha: dec });
  parts.forEach(([at, label, kind], i) => {
    const y = ys[i], q = ramp(t, at - 0.1, 0.4) * g, lit = speaking(t, ats, i);
    link(DX + 28, 500, IX - 34, y, {
      route: "hvh",
      mid: IX - 50,
      alpha: g,
      draw: { t, at: at - 0.15 }
    });
    if (lit > 0)
      ring(IX, y, 36, {
        color: P.authority,
        alpha: lit * restMark(P.authority, 0.5) * g,
        width: 2
      });
    if (kind === "who") person(IX, y + 9, { size: 0.72, alpha: q });
    if (kind === "when") clock(IX, y, 15, { hand: 0.3, alpha: q });
    if (kind === "what") diamond(IX, y, 15, { color: P.authority, alpha: q, solid: true });
    nameText(label, IX + 28 + NAME_GAP, y, {
      align: "left",
      alpha: g * listIn(t, ats, i),
      set: "decision"
    });
  });
}
function s05Catalog(t, catalog, notFound, found, meaning, quality, permission, differ, teamAt, two) {
  const tree = 1, CY = 485, rows = [310, 660, 530, 660, 790];
  const names = en ? [
    "Can't find the data",
    "They find it",
    "What it means",
    "How good it is",
    "Whether they may use it"
  ] : ["找不到数据", "找到了", "看不懂含义", "拿不准质量", "不知道能不能用"];
  const ends = [800, 800, 1160, 1160, 1160].map(
    (x, i) => x + 16 + NAME_GAP + measure(names[i], LABEL)
  );
  const FX0 = Math.max(...[0, 2, 3, 4].map((i) => ends[i])) + 24 + 70 + 30;
  const fixW = Math.max(
    13,
    ...wrapName(L("各不相同", "A different fix"), 260).map((v) => measure(v) / 2)
  );
  const TEAM = L(215, 310), far = TEAM + 62;
  const opened = L(830, 960 + (far - 111) / 2), centred = (right) => 960 - (520 - far + right) / 2;
  const lone = en ? 0 : (960 - opened) * glide(t, catalog + STAGE_CUT, 960 - opened) * (1 - glide(t, notFound + STAGE_CUT, 960 - opened));
  const answered = en ? centred(Math.max(ends[0], ends[1])) : opened - 520, asked = centred(Math.max(...ends)), whole = centred(FX0 + fixW);
  const T = answered + (asked - answered) * glide(t, meaning + 0.05, asked - answered) + (whole - asked) * glide(t, differ + 0.05, whole - asked) + lone;
  const lead = en ? (opened - 520 - answered) * (1 - glide(t, notFound + 0.05, opened - 520 - answered)) : 0;
  const CX = 520 + T + lead, N1 = 800 + T + lead, N2 = 1160 + T + lead, FX = FX0 + whole;
  const team = named(t, teamAt) * two, TX = CX - TEAM;
  [TX - 45, TX, TX + 45].forEach((x) => person(x, 325, { alpha: team, size: 0.75 }));
  nameText(L("大家", "A team"), TX, 342 + NAME_GAP, { valign: "top", alpha: team });
  const book = two * named(t, catalog);
  box(CX - 110, CY - 85, 220, 170, { fill: P.row, stroke: P.ink, alpha: book, radius: 12 });
  box(CX - 86, CY - 61, 172, 34, { stroke: P.muted, alpha: book, radius: 17 });
  dot(CX - 66, CY - 44, 8, { color: P.muted, alpha: book, hollow: true });
  for (let k = 0; k < 3; k++)
    line(CX - 80, CY + k * 30, CX + 60 - k * 30, CY + k * 30, {
      color: P.line,
      alpha: book,
      width: 3
    });
  nameText(L("数据目录", "Data catalog"), CX, CY + 85 + NAME_GAP, { valign: "top", alpha: book });
  const ats = [notFound, found, meaning, quality, permission], xs = [N1, N1, N2, N2, N2];
  const all = ramp(t, differ - 0.1, 0.3) * two * tree;
  if (tree)
    [0, 1].forEach(
      (i) => link(CX + 118, CY, N1 - 24, rows[i], {
        route: "hvh",
        mid: CX + 190,
        alpha: two,
        draw: { t, at: ats[i] - 0.15 }
      })
    );
  const fork = N1 + 16 + NAME_GAP + measure(names[1], LABEL) + 24;
  if (tree)
    [2, 3, 4].forEach(
      (i) => link(fork, rows[1], N2 - 24, rows[i], {
        route: "hvh",
        mid: fork + 70,
        alpha: two,
        draw: { t, at: ats[i] - 0.15 }
      })
    );
  if (tree)
    ats.forEach((at, i) => {
      const x = xs[i], y = rows[i], q = ramp(t, at - 0.1, 0.4) * two, lit = Math.max(speaking(t, ats, i), i === 1 ? 0 : all);
      if (lit > 0)
        ring(x, y, 24, {
          color: i === 1 ? P.evidence : P.unknown,
          alpha: lit * restMark(i === 1 ? P.evidence : P.unknown, 0.5) * two,
          width: 2
        });
      if (i === 1) dot(x, y, 9, { color: P.evidence, alpha: q });
      else ring(x, y, 16, { color: P.unknown, alpha: q, width: 2.5 });
      if (i === 0) cross(x, y, 12, { alpha: q, width: 3 });
      if (i > 1)
        text("?", x, y + 1, 22, { align: "center", color: P.unknown, alpha: q, role: "mark" });
      nameText(names[i], x + 16 + NAME_GAP, y, {
        align: "left",
        alpha: two * listIn(t, ats, i),
        set: "catalog"
      });
    });
  const fix = ramp(t, differ - 0.1, 0.5) * two * tree, fy = [0, 2, 3, 4].map((i) => rows[i]);
  nameText(L("各不相同", "A different fix"), FX, fy[0] - 40, {
    valign: "bottom",
    width: 260,
    color: P.evidence,
    alpha: two * named(t, differ)
  });
  [0, 2, 3, 4].forEach((i, k) => {
    const y = fy[k], from = xs[i] + 16 + NAME_GAP + measure(names[i], LABEL) + 24;
    link(from, y, FX - 30, y, {
      alpha: two * tree * ramp(t, differ - 0.1, 0.3),
      draw: { t, at: differ + 0.05 + glideTime(whole - asked) }
    });
    if (k === 0) dot(FX, y, 12, { color: P.evidence, alpha: fix });
    if (k === 1) box(FX - 11, y - 11, 22, 22, { fill: P.evidence, alpha: fix, radius: 2 });
    if (k === 2) diamond(FX, y, 14, { color: P.evidence, alpha: fix, solid: true });
    if (k === 3)
      fill(
        () => {
          ctx.moveTo(FX, y - 13);
          ctx.lineTo(FX + 13, y + 10);
          ctx.lineTo(FX - 13, y + 10);
          ctx.closePath();
        },
        { color: P.evidence, alpha: fix }
      );
  });
}

// picture/film/scenes/p05/frame.js
function s05Frame(s, t, frame, subject, present, criteria, outScope, limits, commit, three) {
  const FL = L(560, 540), FR = L(1360, 1380), FT = L(370, 385), ys = en ? [460, 530, 600, 670] : [470, 575, 680], PADV = ys[0] - FT, FB = ys.at(-1) + PADV;
  const commitQ = ramp(t, commit - 0.1, 0.6), tone = blend(P.ink, P.authority, commitQ);
  const items = en ? [subject, present, criteria, outScope] : [subject, present, criteria];
  const limitAts = [
    ["时间", "time"],
    ["成本", "cost"],
    ["合规", "compliance"],
    ["技术", "technical"],
    ["资源", "resource"]
  ].map(([zh, english]) => cueFrom(s, zh, english, limits - 0.05));
  const low = s03Extent(t, ys[0] + PADV, [
    ...items.slice(1).map((at) => [at, ys[1] - ys[0]]),
    [limitAts[0], FB - ys.at(-1) - PADV]
  ]);
  path(
    [
      [FL + 46, low],
      [FL, low],
      [FL, FT],
      [FR, FT]
    ],
    { color: tone, alpha: three, width: 3 }
  );
  path(
    [
      [FR, FT],
      [FR, low],
      [FR - 46, low]
    ],
    { color: tone, alpha: three, width: 3 }
  );
  nameText(L("问题", "The problem"), FL, FT - NAME_GAP, {
    align: "left",
    valign: "bottom",
    alpha: three * named(t, frame)
  });
  nameText(L("能执行的承诺", "Executable commitment"), FR, FT - NAME_GAP, {
    align: "right",
    valign: "bottom",
    color: P.authority,
    alpha: three * named(t, commit)
  });
  const names = en ? [
    "Its subject and who is affected",
    "Present state and baseline",
    "The success criteria",
    "What is out of scope"
  ] : ["针对什么，影响谁", "现在怎样", "怎样算成功"];
  const [baselineAt, outAt] = en ? [present, outScope] : cues(s, [
    ["跟什么比", ""],
    ["哪些不做", ""]
  ]);
  const MX = 960 + 22 - (50 + NAME_GAP + Math.max(...names.map((v) => measure(v, LABEL)))) / 2, NX = MX + 28 + NAME_GAP;
  const again = cueFrom(s, "目标", "a goal", outScope), aim = ramp(t, again - 0.1, 0.3);
  items.forEach((at, i) => {
    const y = ys[i], q = ramp(t, at - 0.1, 0.4) * three, lit = Math.max(speaking(t, items, i), i === 2 ? aim : 0);
    const kind = (en ? [0, 1, 3, 4] : [0, 1, 3])[i];
    if (lit > 0)
      ring(MX, y, 30, {
        color: i === 2 ? P.authority : P.ink,
        alpha: lit * restMark(i === 2 ? P.authority : P.ink, 0.5) * three,
        width: 2
      });
    if (kind === 0) {
      dot(MX - 8, y - 4, 6, { color: P.evidence, alpha: q });
      person(MX + 7, y + 6, { size: 0.45, alpha: q });
    }
    if (kind === 1) {
      line(MX - 12, y - 5, MX + 4, y - 5, { color: P.ink, alpha: q, width: 5 });
      dashed(MX - 12, y + 6, MX + 12, y + 6, {
        color: P.muted,
        alpha: ramp(t, baselineAt - 0.1, 0.4) * three
      });
    }
    if (kind === 2) {
      ring(MX, y, 12, { color: P.ink, alpha: q, width: 2.5 });
      dot(MX, y, 5, { color: P.authority, alpha: q });
    }
    if (kind === 3 && en) check(MX, y, 20, { alpha: q });
    if (kind === 3 && !en) {
      check(MX - 9, y, 16, { alpha: q });
      cross(MX + 14, y, 11, { alpha: ramp(t, outAt - 0.1, 0.4) * three, width: 3 });
    }
    if (kind === 4) cross(MX, y, 14, { alpha: q, width: 3 });
    nameText(names[i], NX, y, {
      align: "left",
      alpha: three * listIn(t, items, i),
      set: "frame"
    });
  });
  const limitNames = en ? ["Time", "Cost", "Compliance", "Technical", "Resource"] : ["时间", "成本", "合规", "技术", "资源"];
  const [w0, wn] = [limitNames[0], limitNames.at(-1)].map((v) => measure(v, LABEL)), inset = (180 - (w0 + wn) / 2) / 2;
  const [firstX, lastX] = [FL + inset + w0 / 2, FR - inset - wn / 2];
  const pitchEn = Math.max(
    (lastX - firstX) / 4,
    ...limitNames.slice(1).map((v, i) => (measure(limitNames[i], LABEL) + measure(v, LABEL)) / 2 + 34)
  );
  const xs = en ? limitNames.map((_, i) => 960 - (wn - w0) / 4 + (i - 2) * pitchEn) : railStations(limitNames, firstX, lastX);
  line(
    FL + 46,
    FB,
    mix(FL + 46, FR - 46, drawnShare({ t, at: limitAts[4] - 0.1 }, FR - FL - 92)),
    FB,
    { color: tone, alpha: three * ramp(t, limitAts[0] - 0.1, 0.3), width: 3 }
  );
  limitAts.forEach((at, i) => {
    const q = ramp(t, at - 0.1, 0.4) * three, lit = speaking(t, limitAts, i);
    line(xs[i], FB - 14, xs[i], FB + 14, { color: P.authority, alpha: q, width: 3 + lit });
  });
  railNames(limitNames, xs, FB, {
    alpha: (i) => three * listIn(t, limitAts, i),
    color: () => P.authority,
    set: "limits"
  });
}
function s05Unclear(s, t, unclear, stop, ask, unSubject, four) {
  const LY = 650, BX = 1402, HX = BX - 44, PY = 390, MX = 502, ys = [380, 470, 560];
  const conds = [
    unSubject,
    ...cues(s, [
      ["行动依据", "the authority"],
      ["后果是否可逆", "irreversible consequence"]
    ])
  ];
  const names = en ? ["The subject", "The authority", "An irreversible consequence"] : ["要处理的对象", "行动依据", "后果是否可逆"];
  const lane = ramp(t, unSubject - 0.15, 0.4) * four;
  nameText(L("说不清", "Unclear"), MX - 20, ys[0] - 34 - NAME_GAP, {
    align: "left",
    valign: "bottom",
    alpha: four * named(t, unclear)
  });
  link(MX - 40, ys[0] - 20, BX, LY, { route: "vh", alpha: lane, width: 3, end: false });
  conds.forEach((at, i) => {
    const y = ys[i], q = ramp(t, at - 0.1, 0.4) * four, lit = speaking(t, conds, i);
    ring(MX, y, 20, { color: P.unknown, alpha: q, width: 2.5 });
    if (lit > 0)
      ring(MX, y, 30, {
        color: P.unknown,
        alpha: lit * restMark(P.unknown, 0.5) * four,
        width: 2
      });
    text("?", MX, y + 1, 22, { align: "center", color: P.unknown, alpha: q, role: "mark" });
    nameText(names[i], MX + 20 + NAME_GAP, y, {
      align: "left",
      alpha: four * listIn(t, conds, i),
      set: "unclear"
    });
  });
  dashed(BX + 24, LY, BX + 120, LY, { color: P.line, alpha: four * ramp(t, stop - 0.05, 0.3) });
  const run = ease(
    (voiceTime(t) - voiceTime(unSubject)) / Math.max(0.5, voiceTime(stop) - voiceTime(unSubject))
  );
  token(mix(MX + 70, HX, run), LY, { color: P.evidence, alpha: lane, r: 18 });
  line(BX, LY - 34, BX, LY + 34, {
    color: P.unknown,
    alpha: ramp(t, stop - 0.05, 0.3) * four,
    width: 4
  });
  nameText(L("停下受影响的事", "Stop the affected action"), HX, LY + 34 + NAME_GAP, {
    valign: "top",
    alpha: four * named(t, stop)
  });
  const fills = ramp(t, ask - 0.1, 0.5);
  person(HX, PY, { color: P.authority, alpha: fills * four, size: 1.05 });
  link(HX, LY - 32, HX, PY + 44, {
    color: P.authority,
    alpha: four,
    draw: { t, at: ask - 0.05 },
    width: 2.5
  });
  nameText(L("有授权的人", "An authorized person"), HX - 16 - NAME_GAP, PY - 17, {
    align: "right",
    width: 300,
    color: P.authority,
    alpha: four * named(t, ask)
  });
}
function s05Information(s, t, collect, change, five) {
  const end = 1210 + 18 + NAME_GAP + measure(L("能改变哪个判断", "The judgment it could change"));
  const sx = 960 - (379 + end) / 2;
  const LX = 380 + sx, RX = 1210 + sx, AY = CONTENT_CY + 20, W = 340, H = 120;
  const goalW = measure(L("目的", "The aim")) + 16 + Math.min(26, labelSize(LABEL) * 0.9);
  const pair = Math.min(960 - (LX + RX + goalW / 2) / 2, 1800 - (end + sx));
  ctx.save();
  ctx.translate(pair * (1 - glide(t, change + 0.05, pair)), 0);
  const tray = ramp(t, collect + 0.05, 0.5) * five;
  box(LX, AY - H / 2, W, H, { stroke: P.line, alpha: tray, radius: 12, width: 2 });
  const tied = ramp(t, change - 0.1, 0.5);
  for (let k = 0; k < 18; k++) {
    const useful = k % 5 === 1, x = LX + 40 + k % 6 * 52, y = AY - 30 + Math.floor(k / 6) * 30;
    dot(x, y, 8, {
      color: useful ? blend(P.muted, P.evidence, tied) : P.muted,
      alpha: five * ramp(t, collect - 0.1 + k * 0.04, 0.35) * (useful ? 1 : mix(0.85, 0.6, tied))
    });
  }
  nameText(L("收集信息", "Collecting information"), LX, AY - H / 2 - NAME_GAP, {
    align: "left",
    valign: "bottom",
    alpha: five * named(t, collect)
  });
  const notGoal = cue(s, "不是目的", "is not the aim"), judged = cueFrom(s, "判断", "judgment", notGoal);
  rejectedName(L("目的", "The aim"), RX, AY - 64, {
    alpha: five * named(t, notGoal) * (1 - ramp(t, judged - 0.2, 0.3)),
    mark: ramp(t, notGoal + 0.3, 0.3)
  });
  link(LX + W + 12, AY, RX - 30, AY, {
    alpha: five * ramp(t, change - 0.1, 0.3),
    draw: { t, at: change - 0.05 },
    flowing: since(t, change + 0.55)
  });
  diamond(RX, AY, 18, {
    color: P.authority,
    alpha: ramp(t, change - 0.1, 0.4) * five,
    solid: true
  });
  nameText(L("能改变哪个判断", "The judgment it could change"), RX + 18 + NAME_GAP, AY, {
    align: "left",
    color: P.authority,
    alpha: five * named(t, change)
  });
  ctx.restore();
}

// picture/film/scenes/p05/scene.js
scenes["05"] = function(s, t) {
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
    differ
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
    ["办法各不相同", "each needs a different fix"]
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
    change
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
    ["能改变哪个判断", "say which judgment it could change"]
  ]);
  const base = ramp(t, opening(s), 0.7);
  const teamAt = cue(s, "大家", "a team"), caseAt = Math.min(catalog, teamAt);
  const one = base * stageOut(t, caseAt);
  if (one > 0) s05Decision(s, t, analysis, which, who, what, when, one);
  const two = base * stageIn(t, caseAt) * stageOut(t, frame);
  illustrative(two);
  if (two > 0)
    s05Catalog(t, catalog, notFound, found, meaning, quality, permission, differ, teamAt, two);
  const unSubject = en ? cueFrom(s, "", "subject", commit) : cue(s, "要处理的对象", "");
  const three = base * stageIn(t, frame) * stageOut(t, unSubject);
  if (three > 0) s05Frame(s, t, frame, subject, present, criteria, outScope, limits, commit, three);
  const four = base * stageIn(t, unSubject) * stageOut(t, collect);
  if (four > 0) s05Unclear(s, t, unclear, stop, ask, unSubject, four);
  const five = base * stageIn(t, collect);
  if (five > 0) s05Information(s, t, collect, change, five);
};

// picture/film/scenes/p06/scene.js
var S06R = 26;
var S06ROWS = [330, 520, 710];
var S06TEXT = en ? 480 : 300;
var S06HEAD = 26;
var s06Place = (i) => [i % 2 ? 1498 - S06TEXT : 400, S06ROWS[Math.floor(i / 2)]];
var s06Colour = (i) => [P.evidence, P.muted, P.ink, P.ink, P.authority, P.ink][i];
var s06Kind = (v, i, x, y, o) => nameText(v, x, y, { align: "left", color: s06Colour(i), bold: true, ...o });
function s06Mark(i, x, y, { alpha = 1, lit = 0 } = {}) {
  if (alpha < 0.01) return;
  const c = s06Colour(i);
  dot(x, y, S06R, { color: P.ground, alpha });
  ring(x, y, S06R, { color: c, alpha, width: 2.5, dash: i === 1 ? [5, 5] : null });
  if (lit > 0) ring(x, y, S06R + 10, { color: c, alpha: alpha * lit * restMark(c, 0.5), width: 2 });
  if (i === 0) check(x, y + 1, 22, { color: c, alpha });
  if (i === 1) text("?", x, y + 1, 26, { role: "mark", align: "center", color: c, alpha });
  if (i === 2)
    [
      [-8, 6],
      [8, 6],
      [0, -8]
    ].forEach(([dx, dy]) => dot(x + dx, y + dy, 3.5, { color: c, alpha }));
  if (i === 3) {
    line(x, y - 12, x, y + 11, { color: c, alpha, width: 2.5 });
    line(x - 8, y + 12, x + 8, y + 12, { color: c, alpha, width: 2.5 });
    line(x - 15, y - 9, x + 15, y - 9, { color: c, alpha, width: 2.5 });
    [-12, 12].forEach(
      (dx) => stroke(() => ctx.arc(x + dx, y - 4, 5, 0, Math.PI), { color: c, alpha, width: 2.5 })
    );
  }
  if (i === 4) person(x, y + 3, { color: c, alpha, size: 0.6 });
  if (i === 5) {
    line(x, y, x, y - 14, { color: c, alpha, width: 3 });
    line(x, y, x + 11, y + 5, { color: c, alpha, width: 3 });
  }
}
scenes["06"] = function(s, t) {
  const [six, , example, data, conditions] = cues(s, [
    ["有六种说法", "six kinds of statement"],
    ["要分清", "stay distinct"],
    ["虚构的例子", "illustrative case"],
    ["昨晚的价格数据", "last night's price collection"],
    ["这六种说法", "a fact states"]
  ]);
  const restate = cue(s, "晚了两小时", "two hours late is"), distinct = cue(s, "要分清", "need to stay distinct");
  const base = ramp(t, opening(s), 0.7);
  illustrative(ramp(t, example - 0.2, 0.6) * base * (1 - ramp(t, conditions + 0.05, 0.4)));
  const one = base * (1 - ramp(t, data - 0.25, 0.45)), rowName = base * (1 - ramp(t, data - 0.45, 0.4));
  if (one > 0) {
    const y = 400, PW = 96, PH = 124, pitch = 220;
    for (let i = 0; i < 6; i++) {
      const x = 960 + (i - 2.5) * pitch, q = one * ramp(t, six - 0.1 + i * 0.12, 0.45);
      documentIcon(x - PW / 2, y - PH / 2, PW, PH, { alpha: q, rows: 3, fillColor: P.ground });
      if (i)
        link(x - pitch / 2, y + PH / 2 + 4, x - pitch / 2, y - PH / 2 - 4, {
          color: P.line,
          width: 3,
          alpha: one,
          draw: { t, at: distinct - 0.05 + (i - 1) * 0.12 },
          end: false
        });
    }
    nameText(L("六种说法", "Six kinds of statement"), 960, y + PH / 2 + NAME_GAP, {
      valign: "top",
      alpha: rowName * named(t, six)
    });
  }
  const kindAts = cues(s, [
    ["事实", "fact"],
    ["假设", "hypothesis"],
    ["推论", "inference"],
    ["判断", "judgment"],
    ["决定", "decision"],
    ["行动", "action"]
  ]);
  const kinds = en ? ["Fact", "Hypothesis", "Inference", "Judgment", "Decision", "Action"] : ["事实", "假设", "推论", "判断", "决定", "行动"];
  const rows = (en ? [
    [["Two hours late"], ["two hours late is"], ["recorded"], ["recorded"]],
    [["Late publication by the vendor"], ["late publication"], ["untested"], ["untested"]],
    [["Scheduling may explain"], ["scheduling may explain"], [], []],
    [
      ["Delivery failed"],
      ["by the timeliness"],
      ["by the timeliness standard"],
      ["by the timeliness"]
    ],
    [
      ["Starting the job earlier"],
      ["starting the job"],
      ["the decision owner"],
      ["the decision owner"]
    ],
    [["Who makes the change, and by when"], ["who makes the change"], [], []]
  ] : [
    [["晚了两小时"], ["晚了两小时"], ["有记录"], ["有记录"]],
    [["供应商发布晚了"], ["供应商发布晚了"], ["还没检验"], ["还没检验"]],
    [["问题就可能出在调度上"], ["问题就可能"], [], []],
    [["交付不合格"], ["按及时性的标准"], ["按及时性的标准"], ["按及时性的标准"]],
    [["把任务提前启动"], ["把任务提前启动"], ["决策负责人"], ["决策负责人作出的决定"]],
    [["谁在什么时候改好"], ["谁在什么时候"], [], []]
  ]).map(([term, termWords, qual, qualWords]) => [
    term,
    termWords.map((w) => cue(s, L(w, ""), L("", w))),
    qual,
    qualWords.map((w) => cue(s, L(w, ""), L("", w)))
  ]);
  const starts = rows.map(([, termAts, , qualAts]) => Math.min(...termAts, ...qualAts));
  const statement = (i, x, y, alpha, listed, kindAt = kindAts[i], termAts = rows[i][1], qualAts = rows[i][3]) => {
    const [term, , qual] = rows[i], lit = speaking(t, starts, i), left = x + S06R + NAME_GAP, kind = ramp(t, kindAt - 0.15, 0.4);
    if (lit > 0)
      ring(x, y, S06R + 10, {
        color: s06Colour(i),
        alpha: alpha * lit * restMark(s06Colour(i), 0.5) * kind,
        width: 2
      });
    s06Mark(i, x, y, { alpha: alpha * kind });
    const level = alpha * listLevel(t, starts, i), top = y + labelSize(LABEL) / 2 + S06HEAD;
    s06Kind(kinds[i], i, left, y, {
      alpha: (s06Colour(i) === P.muted ? mutedLevel(level) : level) * named(t, kindAt),
      set: listed ? "kinds" : null
    });
    if (qual.length)
      termRow(t, term, termAts, qual, qualAts, left, top, {
        width: S06TEXT,
        alpha: level,
        set: listed ? "statements" : null,
        inline: false
      });
    else
      growName(t, term, termAts, left, top, {
        width: S06TEXT,
        alpha: level,
        set: listed ? "statements" : null
      });
  };
  const two = base * (t >= data - 0.3 ? 1 : 0) * stageOut(t, starts[3]);
  if (two > 0) {
    const ranLate = cue(s, "采集晚了两个小时", "ran two hours late");
    const AY = 700, due = 780, actual = 1140, TW = 300, TH = 100, top = AY - 36 - TH, SY = AY + 36;
    const back = mix(1, SECOND, ramp(t, restate + 0.05, 0.7)), on = two * back * ramp(t, data - 0.1, 0.4);
    const onTime = cueFrom(s, "准时", "on time", starts[1]), startedLate = cueFrom(s, "启动得晚", "job started late", starts[1]);
    const span2 = two * ramp(t, ranLate + 0.05, 0.3) * mix(markLevel(P.unknown, back), 1, named(t, startedLate));
    const raise = (top + SY + 10 + NAME_GAP + labelSize(LABEL)) / 2 - CONTENT_CY, lower = 40;
    ctx.save();
    ctx.translate(0, -raise + (raise + lower) * glide(t, restate + 0.05, raise + lower));
    stroke(
      () => {
        ctx.moveTo(240, AY);
        ctx.lineTo(1680, AY);
        for (let x = 240; x <= 1680; x += 180) {
          ctx.moveTo(x, AY - 7);
          ctx.lineTo(x, AY + 7);
        }
      },
      { color: P.line, alpha: on, width: 3.5 }
    );
    box(due - TW / 2, top, TW, TH, {
      stroke: P.line,
      alpha: two * named(t, onTime),
      radius: 6,
      dash: [6, 6]
    });
    nameText(L("准时", "On time"), due, top + TH / 2, {
      valign: "middle",
      alpha: two * named(t, onTime)
    });
    line(actual, top + TH, actual, AY, { color: P.line, alpha: on, width: 2 });
    tableIcon(actual - TW / 2, top, TW, TH, { alpha: on, joined: true });
    nameText(
      L("昨晚的价格数据", "Last night's price collection"),
      actual + TW / 2 + NAME_GAP,
      top + TH / 2,
      { align: "left", width: 360, alpha: two * back * named(t, data + 0.2) }
    );
    link(due, SY, actual, SY, {
      color: P.unknown,
      alpha: span2,
      width: 3,
      draw: { t, at: ranLate + 0.05 },
      end: false
    });
    line(due, SY - 10, due, SY + 10, { color: P.unknown, alpha: span2, width: 3 });
    line(actual, SY - 10, actual, SY + 10, {
      color: P.unknown,
      alpha: span2 * ramp(t, ranLate + 0.45, 0.3),
      width: 3
    });
    nameText(L("采集晚了两个小时", "Ran two hours late"), (due + actual) / 2, SY + 10 + NAME_GAP, {
      valign: "top",
      alpha: two * named(t, ranLate) * (1 - ramp(t, restate + 0.05 + glideTime(raise + lower), 0.3))
    });
    nameText(L("启动得晚", "Job started late"), (due + actual) / 2, SY + 10 + NAME_GAP, {
      valign: "top",
      alpha: two * named(t, startedLate)
    });
    ctx.restore();
    if (t < starts[1] + STAGE_CUT)
      statement(
        0,
        ...s06Place(0),
        two * ramp(t, restate + 0.05, 0.3),
        false,
        en ? Math.max(restate, kindAts[0] - 1.4) : Math.min(kindAts[0], cue(s, "有记录", ""))
      );
  }
  const three = base * stageIn(t, starts[1]) * stageOut(t, conditions);
  const fromCut = (i) => rows[i][1].map(() => starts[i] + STAGE_CUT + 0.15);
  if (three > 0)
    rows.forEach(
      (_, i) => statement(
        i,
        ...s06Place(i),
        three,
        true,
        kindAts[i],
        i === 1 || i === 3 ? fromCut(i) : rows[i][1],
        i === 3 ? fromCut(i) : rows[i][3]
      )
    );
  const four = base * stageIn(t, conditions);
  if (four > 0) {
    const again = kinds.map(
      (v, i) => cueFrom(
        s,
        ["事实要有", "假设要说清", "推论要讲明", "判断要有", "决定要写明", "行动要落到"][i],
        v.toLowerCase(),
        conditions
      )
    );
    const conds = (en ? [
      [
        ["Source", ", subject", ", time", " and scope"],
        ["states its source", "subject", "time and scope", "and scope"]
      ],
      [["What observation could refute it"], ["what observation could refute"]],
      [
        ["Reasoning", " and", " alternative explanations"],
        ["its reasoning", "alternative explanations", "alternative explanations"]
      ],
      [
        ["Criterion", ", confidence", " and limits"],
        ["its criterion", "confidence", "and limits"]
      ],
      [
        ["Who made it", ", the trade-off", ", what triggers a revisit"],
        ["who made it", "the trade-off", "and what would trigger"]
      ],
      [
        ["Owner", ", deadline", ", completion condition"],
        ["its owner", "deadline", "completion condition"]
      ]
    ] : [
      [
        ["来源", "、对象", "、时间", "和范围"],
        ["要有来源", "对象", "时间和范围", "和范围"]
      ],
      [["什么观察能推翻它"], ["什么观察能推翻"]],
      [
        ["推理过程", "和其他解释"],
        ["推理过程", "和其他解释"]
      ],
      [
        ["标准", "、把握", "和限度"],
        ["要有标准", "把握", "和限度"]
      ],
      [
        ["谁定的", "、怎么取舍", "、什么情况下重新考虑"],
        ["谁定的", "怎么取舍", "什么情况下重新考虑"]
      ],
      [
        ["谁来做", "、什么时候做完", "、怎样算完"],
        ["谁来做", "什么时候做完", "怎样算完"]
      ]
    ]).map(([parts, words]) => [parts, words.map((w) => cue(s, w, w))]);
    const condWidth = (i) => en ? i === 2 ? 520 : S06TEXT : 540;
    const condW = (i) => Math.max(
      ...growTexts(conds[i][0], condWidth(i), LABEL).map(
        (line2) => line2.reduce((sum, [, v]) => sum + measure(v), 0)
      )
    );
    const textX = (i) => s06Place(i)[0] + S06R + NAME_GAP, kindsEnd = Math.max(...[1, 3, 5].map((i) => textX(i) + measure(kinds[i], LABEL, true)));
    const reach = [1, 3, 5].reduce(
      (v, i) => [...v, Math.max(v.at(-1), textX(i) + condW(i))],
      [kindsEnd]
    );
    const mid = (a, b) => 960 - (400 - S06R + (a + b) / 2) / 2;
    const centred = [
      mid(reach[0], reach[0]),
      mid(reach[1], reach[1]),
      L(mid(reach[2], reach[2]), mid(reach[2], reach[3])),
      L(mid(reach[3], reach[3]), mid(reach[2], reach[3]))
    ];
    const moves = [
      conditions + STAGE_CUT,
      conds[1][1][0] + 0.05,
      again[3] + 0.05,
      conds[5][1][0] + 0.05
    ];
    const ox = moves.reduce((x, at, k) => {
      const d = centred[k] - (k ? centred[k - 1] : 0);
      return x + d * glide(t, at, d);
    }, 0);
    if (!en) {
      const own = cue(s, "各有各要交代的", ""), next = cue(s, "判断要有", "");
      nameText("各有各要交代的", 960 + ox, S06ROWS[0] - S06R - NAME_GAP - 20, {
        valign: "bottom",
        alpha: four * named(t, own - 0.18) * (1 - ramp(t, next + 0.05, 0.3))
      });
    }
    conds.forEach(([parts, ats], i) => {
      const [x0, y] = s06Place(i), x = x0 + ox, left = x + S06R + NAME_GAP;
      s06Mark(i, x, y, { alpha: four, lit: speaking(t, again, i) });
      beats(t, x, y, S06R + 10, ats.slice(1), { color: s06Colour(i), alpha: four });
      s06Kind(kinds[i], i, left, y, { alpha: four, set: "kinds" });
      growName(t, parts, ats, left, y + labelSize(LABEL) / 2 + S06HEAD, {
        width: condWidth(i),
        alpha: four * listLevel(t, again, i),
        set: "conditions"
      });
    });
  }
};

// picture/film/scenes/p07/conclusion.js
function s07Reasoning(s, t, reason, eight) {
  const [checkAt, ...ats] = cues(s, [
    ["查推理", "check the reasoning"],
    ["相关看成因果", "correlation presented"],
    ["个案看成全部", "one case taken"],
    ["必要条件看成", "necessary condition"],
    ["认定只有一个原因", "one outcome blamed"],
    ["只找对自己有利", "selective evidence"],
    ["中途换标准", "criteria changed midstream"],
    ["搬出常识", "an appeal to common sense"]
  ]);
  const kinds = [0, 1, 2, 3, 4, 6, 5];
  const limitsAt = cue(s, "在这里适不适用", "its limits");
  const PW = 360, PH = 230, py = 465, cols = [680, 1240], ys = [360, 460, 560, 660], NW = 450, BY = 710;
  const names = en ? [
    ["Correlation as cause"],
    "One case for the whole",
    ["A necessary condition", "treated as sufficient"],
    "Blamed on a single cause",
    "Selective evidence",
    "Criteria changed midstream",
    ["Common sense, experience,", "best practice without its limits"]
  ] : [
    "把相关看成因果",
    "把个案看成全部",
    "把必要条件看成充分条件",
    "认定只有一个原因",
    "只找有利的证据",
    "换标准",
    "搬出常识、经验或“最佳实践”"
  ];
  const nameW = (i) => Math.max(...wrapName(names[i], NW).map((line2) => measure(line2)));
  const extents = [
    [960 - PW / 2, Math.max(960 + PW / 2, 978 + measure(L("查推理", "Check the reasoning")))]
  ];
  ats.forEach((_, i) => {
    const [l, r] = extents.at(-1);
    extents.push(
      i % 2 ? [l, Math.max(r, cols[1] + 86 + nameW(i) + 16 + 26)] : [Math.min(l, cols[0] - 128 - nameW(i)), r]
    );
  });
  const centreOf = ([l, r]) => 960 - (l + r) / 2;
  const dx = extents.slice(1).reduce((v, e, i) => {
    const d = centreOf(e) - centreOf(extents[i]);
    return v + d * glide(t, ats[i] - 0.3, d);
  }, centreOf(extents[0]));
  ctx.save();
  ctx.translate(dx, 0);
  documentIcon(960 - PW / 2, py - PH / 2, PW, PH, { alpha: eight, rows: 0 });
  stroke(
    () => {
      for (let i = 0; i < 6; i++) {
        const ry = py - PH / 2 + PH * (0.18 + i * 0.12);
        ctx.moveTo(960 - PW * 0.38, ry);
        ctx.lineTo(960 + PW * (i % 2 ? 0.22 : 0.36), ry);
      }
    },
    { color: P.muted, alpha: eight * 0.8, width: 2 }
  );
  dot(960, py - 6, 56, { color: P.row, alpha: eight });
  seal(960, py - 6, 50, { alpha: eight });
  const rowHalf = Math.max(
    26,
    ...names.slice(0, 2).map((v) => blockHeight(wrapName(v, NW).length) / 2)
  );
  nameText(L("相信结论之前", "A conclusion"), 960, ys[0] - rowHalf - HEAD_CLEAR, {
    valign: "bottom",
    width: 300,
    alpha: eight * named(t, reason)
  });
  const rq = eight * ramp(t, checkAt - 0.1, 0.4);
  link(960, BY, 960, py + PH / 2 + 8, { alpha: rq, draw: { t, at: checkAt }, width: 2.5 });
  nameText(L("查推理", "Check the reasoning"), 978, (py + PH / 2 + BY) / 2, {
    align: "left",
    alpha: eight * named(t, checkAt)
  });
  ats.forEach((at, i) => {
    const gx = cols[i % 2], y = ys[Math.floor(i / 2)], q = eight * ramp(t, at - 0.1, 0.45), kind = kinds[i];
    const go = soon(t, at + 0.05, 0.8), err = soon(t, at + 0.45, 0.5);
    if (kind === 0) {
      const d = [8, -4, 2, -10, -2, -14], a = d.map((v, k) => [gx - 60 + 24 * k, y - 12 + v]), b = d.map((v, k) => [gx - 60 + 24 * k, y + 14 + v]);
      path(along(a, go).kept, { color: P.ink, alpha: q, width: 3 });
      path(along(b, go).kept, { color: P.evidence, alpha: q, width: 3 });
      link(gx + 72, a[5][1], gx + 72, b[5][1], {
        color: P.unknown,
        alpha: q,
        upto: err,
        width: 2.5
      });
    } else if (kind === 1) {
      dot(gx - 48, y, 10, { color: P.ink, alpha: q });
      link(gx - 34, y, gx - 22, y, { color: P.ink, alpha: q, upto: go, end: false });
      for (let k = 0; k < 8; k++) {
        const x = gx - 6 + k % 4 * 21, yy = y - 11 + Math.floor(k / 4) * 22, flood = ramp(t, at + 0.2 + k % 4 * 0.12, 0.4);
        dot(x, yy, 7, { color: P.muted, alpha: q * (1 - flood), hollow: true });
        dot(x, yy, 7, { color: P.ink, alpha: q * flood });
      }
    } else if (kind === 2) {
      box(gx - 55, y - 19, 15, 15, { fill: P.evidence, alpha: q * 0.9, radius: 4 });
      box(gx - 55, y + 4, 15, 15, { stroke: P.muted, alpha: q, radius: 4, dash: [4, 4] });
      link(gx - 34, y - 11.5, gx + 30, y, {
        route: "hvh",
        mid: gx - 4,
        color: P.ink,
        alpha: q,
        upto: go,
        end: false
      });
      ring(gx + 44, y, 13, { color: P.ink, alpha: q, width: 2.5 });
      dot(gx + 44, y, 13, { color: P.ink, alpha: q * err });
    } else if (kind === 3) {
      [-20, 0, 20].forEach(
        (d) => dot(gx - 48, y + d, 7, { color: P.muted, alpha: q, hollow: true })
      );
      dot(gx + 46, y, 7, { color: P.ink, alpha: q });
      link(gx + 32, y, gx - 36, y, {
        color: P.unknown,
        alpha: q,
        upto: go,
        width: 2.5,
        end: false
      });
      dot(gx - 48, y, 7, { color: P.unknown, alpha: q * err });
    } else if (kind === 4) {
      const px = [0, 1, 2, 3, 4].map((k) => gx - 52 + 26 * k), lx = mix(mix(px[0], px[2], soon(t, at + 0.25, 0.35)), px[4], soon(t, at + 0.65, 0.35));
      px.forEach((x, k) => {
        dot(x, y - 4, 6, { color: k % 2 ? P.unknown : P.evidence, alpha: q });
        if (k % 2 === 0)
          ring(x, y - 4, 10, {
            color: P.evidence,
            alpha: q * ramp(t, at + 0.05 + k * 0.2 + 0.25, 0.4),
            width: 2
          });
      });
      ring(lx, y - 4, 16, { color: P.ink, alpha: q, width: 2.5 });
      line(lx + 11, y + 7, lx + 20, y + 16, { color: P.ink, alpha: q, width: 3 });
    } else if (kind === 6) {
      const tx = mix(gx + 30, gx - 46, glide(t, at + 0.45, 76));
      line(gx - 62, y + 6, gx + 62, y + 6, { color: P.line, alpha: q, width: 2 });
      line(gx + 30, y - 30, gx + 30, y - 12, {
        color: P.muted,
        alpha: q * err,
        width: 2,
        dash: [3, 3]
      });
      line(tx, y - 30, tx, y - 12, {
        color: blend(P.authority, P.unknown, err),
        alpha: q,
        width: 4
      });
      dot(mix(gx - 54, gx - 10, glide(t, at + 0.05, 44)), y + 6, 9, { color: P.ink, alpha: q });
    } else {
      diamond(gx - 40, y, 16, { color: P.authority, alpha: q, solid: true });
      link(gx - 22, y, gx + 34, y, {
        color: P.unknown,
        alpha: q,
        upto: go,
        width: 2.5,
        end: false,
        flowing: since(t, at + 0.85),
        last: since(limitsAt, at + 0.85)
      });
      ring(gx + 46, y, 7, { color: P.ink, alpha: q, width: 2.5 });
      dot(gx + 46, y, 7, { color: P.ink, alpha: q * err });
      ring(gx - 40, y, 30, {
        color: P.muted,
        alpha: q * ramp(t, limitsAt - 0.1, 0.4),
        width: 2,
        dash: [4, 5]
      });
    }
  });
  names.forEach(
    (v, i) => rejectedName(v, i % 2 ? cols[1] + 86 : cols[0] - 128, ys[Math.floor(i / 2)], {
      align: i % 2 ? "left" : "right",
      width: NW,
      mark: ramp(t, i === names.length - 1 ? limitsAt + 0.1 : ats[i] + 0.7, 0.3),
      set: "errors",
      alpha: eight * ramp(t, ats[i] - 0.15, 0.4) * markLevel(P.unknown, listLevel(t, ats, i))
    })
  );
  ctx.restore();
}
function s07Bounds(s, t, bounded, nine) {
  const ats = cues(s, [
    ["证据支持到哪一步", "what the evidence supports"],
    ["有几成把握", "how confident"],
    ["还有哪些可能", "what remains possible"],
    ["下一步怎么核验", "what to verify next"],
    ["看到什么会改判", "what observation"]
  ]);
  const sx = L(80, 0), cx = 580 + sx, cy = 500, R = 44, bx = 860 + sx, gx = 960 + sx, nx = 1040 + sx, ys = [330, 415, 500, 585, 670];
  dot(cx, cy, R, { color: P.row, alpha: nine });
  ring(cx, cy, R, { color: P.evidence, alpha: nine, width: 2.5 });
  check(cx, cy, 30, { color: P.evidence, alpha: nine });
  nameText(L("有边界的结论", "Bound the conclusion"), cx, cy + R + NAME_GAP, {
    valign: "top",
    width: 320,
    alpha: nine * named(t, bounded)
  });
  line(bx, ys[0], bx, ys.at(-1), { color: P.line, alpha: nine, width: 2 });
  link(cx + R + 8, cy, bx - 6, cy, { alpha: nine, draw: { t, at: bounded + 0.2 } });
  ats.forEach((at, i) => {
    const y = ys[i], q = nine * ramp(t, at - 0.1, 0.45), lit = speaking(t, ats, i), go = soon(t, at, 0.6);
    line(bx, y, bx + 22, y, { color: P.line, alpha: q, width: 2 });
    dot(bx + 22, y, 4 + 3 * lit, { color: blend(P.line, P.evidence, lit), alpha: q });
    if (i === 0) {
      line(gx - 40, y, mix(gx - 40, gx + 10, go), y, { color: P.evidence, alpha: q, width: 4 });
      line(gx + 20, y - 16, gx + 20, y + 16, {
        color: P.authority,
        alpha: q * ramp(t, at + 0.4, 0.3),
        width: 4
      });
    } else if (i === 1) {
      line(gx - 40, y, gx + 30, y, { color: P.line, alpha: q, width: 10, cap: "butt" });
      line(gx - 40, y, mix(gx - 40, gx + 12, go), y, {
        color: P.evidence,
        alpha: q,
        width: 10,
        cap: "butt"
      });
    } else if (i === 2) {
      dot(gx - 30, y, 10, { color: P.evidence, alpha: q });
      [0, 1].forEach(
        (k) => dot(gx + 2 + k * 26, y, 9, {
          color: P.muted,
          alpha: q * ramp(t, at + k * 0.3, 0.4),
          hollow: true
        })
      );
    } else if (i === 3) {
      ring(gx - 26, y, 14, { color: P.evidence, alpha: q, width: 2.5 });
      check(gx - 26, y + 1, 16, { color: P.evidence, alpha: q });
      link(gx - 6, y, gx + 34, y, { alpha: q, upto: go });
    } else {
      ring(gx - 26, y, 13, { color: P.evidence, alpha: q, width: 2, dash: [4, 4] });
      link(gx - 10, y, gx + 30, y - 18, { route: "hvh", mid: gx + 10, alpha: q, upto: go });
    }
  });
  const names = en ? [
    "What the evidence supports",
    "How confident you are",
    "What remains possible",
    "What to verify next",
    "What observation would change it"
  ] : ["证据支持到哪一步", "有几成把握", "还有哪些可能", "下一步怎么核验", "看到什么会改判"];
  names.forEach(
    (v, i) => nameText(v, nx, ys[i], {
      align: "left",
      width: 620,
      alpha: nine * listIn(t, ats, i),
      set: "bounds"
    })
  );
}

// picture/film/scenes/p07/marks.js
function s07Knot(x, y, alpha) {
  if (alpha < 0.01) return;
  [
    [-170, -60],
    [170, -70],
    [-140, 80],
    [160, 70]
  ].forEach(([dx, dy]) => {
    link(x + Math.sign(dx) * 52, y, x + dx, y + dy - Math.sign(dy) * 16, {
      route: "hv",
      alpha,
      end: false
    });
    dot(x + dx, y + dy, 12, { color: P.muted, alpha });
  });
  dot(x, y, 44, { color: P.row, alpha });
  ring(x, y, 44, { color: P.ink, alpha, width: 2.5 });
  text("?", x, y + 1, 26, { align: "center", color: P.muted, alpha, role: "mark" });
}
function s07Eye(x, y, alpha) {
  if (alpha < 0.01) return;
  stroke(
    () => {
      ctx.moveTo(x - 230, y);
      ctx.quadraticCurveTo(x, y - 128, x + 230, y);
      ctx.quadraticCurveTo(x, y + 128, x - 230, y);
    },
    { color: P.ink, alpha, width: 3 }
  );
  ring(x, y, 44, { color: P.evidence, alpha, width: 3 });
  dot(x, y, 16, { color: P.evidence, alpha });
}

// picture/film/scenes/p07/evidence.js
function s07Observations(s, t, observe, four) {
  const [facts, sourceTime, unknown, affects, decision] = cues(s, [
    ["重要的事实", "important facts"],
    ["来源和时间", "source and time"],
    ["每个未知因素", "each unknown"],
    ["对这个决定", "affects the decision"],
    ["这个决定", "the decision"]
  ]);
  const EX = 960, EY = 360, LY = 530, fy = 610, dy = 765, dr = 40, em = labelSize(LABEL);
  const factNames = [L("重要的事实", "Facts"), L("带上来源和时间", "source and time")], unknownNames = [L("每个未知因素", "Unknowns"), L("对决定的影响", "effect on the decision")];
  const wide = ([name, note]) => Math.max(measure(name), measure(note, NOTE)), fx = 960 - (500 + 40 + wide(unknownNames) + 10) / 2 + 10, ux = fx + 500;
  const on = four * named(t, observe);
  s07Eye(EX, EY, on);
  nameText(L("再把观察记清楚", "The observations"), EX, EY + 64 + NAME_GAP, {
    valign: "top",
    alpha: on
  });
  line(480, LY, 1440, LY, { color: P.line, alpha: on, width: 3.5 });
  const fq = four * ramp(t, facts - 0.1, 0.45), sq = four * ramp(t, sourceTime - 0.1, 0.45), uq = four * ramp(t, unknown - 0.1, 0.45);
  link(fx, LY + 4, fx, fy - 14, {
    color: P.ink,
    alpha: fq,
    draw: { t, at: facts - 0.1 },
    end: false
  });
  dot(fx, fy, 10, { color: P.evidence, alpha: fq });
  documentIcon(fx + 28, fy - 20, 32, 40, { alpha: sq, rows: 2 });
  clock(fx + 96, fy, 16, { hand: 0.62, color: P.evidence, alpha: sq });
  termRow(t, [factNames[0]], [facts], [factNames[1]], [sourceTime], fx + 130, fy - em / 2, {
    alpha: four,
    inline: false
  });
  const hang = soon(t, unknown - 0.1, 0.4);
  stroke(
    () => {
      if (hang > 0) {
        ctx.moveTo(ux, LY + 4);
        ctx.lineTo(ux, mix(LY + 4, fy - 20, hang));
      }
      ctx.moveTo(ux, fy - 16);
      ctx.ellipse(ux, fy, 16, 16, -Math.PI / 2, 0, Math.PI * 2);
    },
    { color: P.unknown, alpha: uq, width: 2.5, dash: [4, 4] }
  );
  text("?", ux, fy + 1, 22, { align: "center", color: P.unknown, alpha: uq, role: "mark" });
  termRow(t, [unknownNames[0]], [unknown], [unknownNames[1]], [affects], ux + 40, fy - em / 2, {
    alpha: four,
    inline: false
  });
  link(ux, fy + 20, ux, dy - dr - 10, {
    alpha: uq,
    upto: drawShare(t, affects + 0.05, Math.abs(dy - dr - 10 - (fy + 20)), 0.6),
    dash: [6, 6],
    flowing: since(t, affects + 0.65)
  });
  const dq = four * ramp(t, decision - 0.1, 0.45);
  diamond(ux, dy, dr, { color: P.authority, alpha: dq, width: 3 });
  nameText(L("这个决定", "The decision"), ux + dr + NAME_GAP, dy, {
    align: "left",
    color: P.authority,
    alpha: four * named(t, decision)
  });
}
function s07Hypotheses(s, t, hypotheses, experiment, five) {
  const ats = [
    ...cues(s, [
      ["找反例", "look for counterexamples"],
      ["跟基准比", "check the baseline"],
      ["也想想不做", "consider not acting"]
    ]),
    experiment
  ];
  const separates = cue(s, "分清说得通", "separates the plausible");
  const sx = en ? 132 - 47 * glide(t, experiment - 0.1, 47) - 67 * glide(t, separates - 0.1, 67) : 168 - 83 * glide(t, separates - 0.1, 83);
  const hx = 480 + sx, hy = 480, R = 40, ys = [300, 420, 540, 660], ax = 820 + sx, gx = 860 + sx, nx = 1020 + sx;
  dot(hx, hy, R, { color: P.row, alpha: five });
  ring(hx, hy, R, { color: P.ink, alpha: five, width: 2.5 });
  text("?", hx, hy + 1, 26, { align: "center", color: P.muted, alpha: five, role: "mark" });
  nameText(L("检验假设", "Hypotheses"), hx, hy + R + NAME_GAP, {
    valign: "top",
    alpha: five * named(t, hypotheses)
  });
  ats.forEach((at, i) => {
    const y = ys[i], q = five * ramp(t, at - 0.1, 0.45), lit = speaking(t, ats, i);
    dot(ax, y, 12, { color: P.evidence, alpha: q });
    if (lit > 0)
      ring(ax, y, 21, {
        color: P.evidence,
        alpha: lit * restMark(P.evidence, 0.5) * q,
        width: 2
      });
    link(hx + R + 8, hy, ax - 20, y, {
      route: "hvh",
      mid: 650 + sx,
      alpha: five,
      draw: { t, at: at - 0.1 },
      end: false
    });
    if (i === 0) {
      [0, 1, 2, 3].forEach(
        (k) => dot(gx + 10 + k * 28, y + 12 - k * 8, 7, { color: P.evidence, alpha: q })
      );
      dot(gx + 112, y + 18, 8, { color: P.unknown, alpha: q * ramp(t, at + 0.3, 0.3) });
    } else if (i === 1) {
      line(gx, y + 18, gx + 120, y + 18, { color: P.muted, alpha: q, width: 2 });
      path(
        [
          [gx, y + 12],
          [gx + 40, y + 6],
          [gx + 80, y - 4],
          [gx + 120, y - 18]
        ],
        { color: P.evidence, alpha: q, width: 2.5, draw: { t, at: at + 0.1 } }
      );
    } else if (i === 2) {
      link(gx, y, gx + 120, y - 20, {
        route: "hvh",
        mid: gx + 40,
        alpha: q * 0.8,
        draw: { t, at }
      });
      link(gx, y, gx + 120, y + 20, {
        route: "hvh",
        mid: gx + 40,
        color: P.muted,
        alpha: q,
        dash: [5, 6],
        upto: drawShare(t, at + 0.2, Math.abs(gx + 120 - gx) + Math.abs(y + 20 - y), 0.5)
      });
    } else {
      const sq = five * ramp(t, separates - 0.1, 0.45), fork = soon(t, separates - 0.05, 0.6);
      ring(gx + 14, y, 13, { color: P.evidence, alpha: q, width: 2.5 });
      line(gx + 23, y + 9, gx + 32, y + 18, { color: P.evidence, alpha: q, width: 3 });
      [-16, 16].forEach((d, k) => {
        link(gx + 36, y, gx + 108, y + d, {
          route: "hvh",
          mid: gx + 70,
          alpha: sq,
          upto: fork,
          end: false
        });
        dot(gx + 116, y + d, 7, {
          color: k ? P.authority : P.evidence,
          alpha: sq * ramp(t, separates + 0.3, 0.3)
        });
      });
    }
  });
  const tests = en ? ["Counterexamples", "The baseline", "Not acting"] : ["找反例", "跟基准比", "不做会怎样"];
  tests.forEach(
    (v, i) => nameText(v, nx, ys[i], { align: "left", alpha: five * listIn(t, ats, i), set: "tests" })
  );
  const qual = en ? ["that separates", " the plausible explanations"] : ["分清", "几种解释"];
  const qualAts = en ? [separates] : [separates, cue(s, "几种解释", "")];
  termRow(
    t,
    [L("最小的实验", "The smallest experiment")],
    [experiment],
    qual,
    qualAts,
    nx,
    ys[3] - labelSize(LABEL) / 2,
    {
      width: en ? 620 : 1780 - nx,
      inline: en ? false : null,
      alpha: five * listLevel(t, ats, 3),
      set: "tests"
    }
  );
}
function s07Delay(s, t, delay, seven) {
  const [checkAt, ...why] = cues(s, [
    ["查供应商", "checking"],
    ["是发布晚了", "did the vendor publish late"],
    ["我们的任务启动晚了", "did our job start late"]
  ]);
  const cy = 430, dx = 600, px = 1320, CR = 60, MR = 56, y = 680, w = 380, x0s = [360, 1180], nameY = cy - Math.max(CR, MR) - NAME_GAP;
  clock(dx, cy, CR, { hand: 0.62, color: P.unknown, alpha: seven });
  nameText(L("昨晚那次延迟", "Last night's delay"), dx, nameY, {
    valign: "bottom",
    alpha: seven * named(t, delay)
  });
  const cq = seven * ramp(t, checkAt - 0.1, 0.45), tip = MR * 0.72;
  link(dx + CR + 10, cy, px - MR - 8, cy, { alpha: cq, draw: { t, at: checkAt - 0.1 } });
  ring(px, cy, MR, { color: P.evidence, alpha: cq, width: 3 });
  line(px + tip, cy + tip, px + tip + 30, cy + tip + 30, {
    color: P.evidence,
    alpha: cq,
    width: 5
  });
  clock(px, cy, MR * 0.55, { hand: 0.3, color: P.evidence, alpha: cq });
  nameText(L("供应商的发布时间", "Publication time"), px, nameY, {
    valign: "bottom",
    width: 320,
    alpha: seven * named(t, checkAt)
  });
  const names = en ? ["Did the vendor publish late?", "Did our job start late?"] : ["发布晚了", "我们的任务启动晚了"];
  x0s.forEach((x0, k) => {
    const q = seven * ramp(t, why[k] - 0.1, 0.45), lit = speaking(t, why, k), due = x0 + 190;
    const rail = seven * ramp(t, why[k] - 0.15, 0.4);
    line(x0, y - 24, x0 + w, y - 24, { color: P.line, alpha: rail, width: 2 });
    line(x0, y + 24, x0 + w, y + 24, { color: P.line, alpha: rail, width: 2 });
    dashed(due, y - 52, due, y + 52, { color: P.line, alpha: rail });
    link(px, cy + MR + 12, x0 + w / 2, y - 64, {
      route: "vhv",
      mid: 590,
      alpha: rail,
      draw: { t, at: why[k] - 0.15 }
    });
    const docX = k ? x0 + 90 : x0 + 270, jobX = k ? x0 + 290 : x0 + 330;
    documentIcon(docX - 17, y - 48, 34, 44, {
      alpha: q,
      rows: 2,
      stroke: k ? P.evidence : P.unknown
    });
    dot(jobX, y + 24, 12, { color: k ? P.unknown : P.muted, alpha: q });
    if (lit > 0)
      ring(k ? jobX : docX, k ? y + 24 : y - 26, 30, {
        color: P.unknown,
        alpha: lit * restMark(P.unknown, 0.5) * q,
        width: 2
      });
    nameText(names[k], x0 + w / 2, y + 52 + NAME_GAP, {
      valign: "top",
      width: 380,
      alpha: seven * listIn(t, why, k),
      set: "explanations"
    });
  });
}

// picture/film/scenes/p07/model.js
function s07Understanding(s, t, one) {
  const [problem, longer, listWord, model] = cues(s, [
    ["想清楚问题", "understanding a problem"],
    ["更长的清单", "longer list"],
    ["清单", "list"],
    ["刚好够用的模型", "the smallest model"]
  ]);
  const k = one * named(t, problem);
  s07Knot(960, 300, k);
  nameText(L("想清楚问题", "Understanding a problem"), 960, 300 + 92 + NAME_GAP, {
    valign: "top",
    alpha: k
  });
  const second = en ? longer : model, alone = 1 - glide(t, second + 0.05, en ? 960 - 1230 + 50 : 960 - 132 - 560);
  const lx = 560 + (en ? 0 : (960 - 132 - 560) * alone), mdx = en ? -50 + (960 - 1230 + 50) * alone : 0;
  const top = 500, step = 30, nameY = top + 9 * step + 11 + NAME_GAP;
  for (let r = 0; r < 10; r++) {
    const y = top + r * step, q2 = one * (r < 7 ? ramp(t, longer - 0.1, 0.4) : ramp(t, longer + 0.05 + (r - 7) * 0.08, 0.3));
    box(lx, y - 9, 18, 18, { stroke: P.muted, alpha: q2 * 0.8, radius: 4 });
    line(lx + 34, y, lx + 34 + 230 - r % 4 * 44, y, {
      color: P.muted,
      alpha: q2 * 0.8,
      width: 3
    });
  }
  rejectedName(L("更长的清单", "Longer list"), lx, nameY, {
    align: "left",
    valign: "top",
    alpha: one * named(t, longer),
    mark: ramp(t, listWord + 0.05, 0.35)
  });
  const R = 30, nodes = [
    [1110 + mdx, 540],
    [1350 + mdx, 540],
    [1230 + mdx, 720]
  ], fillAt = model;
  const q = one * ramp(t, fillAt - 0.1, 0.5), knotAt = (j) => ({ t, at: fillAt + 0.05 + j * 0.25 });
  nodes.forEach(([x, y]) => {
    dot(x, y, R, { color: P.row, alpha: q });
    ring(x, y, R, { color: P.ink, alpha: q, width: 2.5 });
  });
  const [a, b, c] = nodes;
  link(a[0] + R + 8, a[1], b[0] - R - 8, b[1], { alpha: q, draw: knotAt(0) });
  link(b[0], b[1] + R + 8, c[0] + R + 8, c[1], { route: "vh", alpha: q, draw: knotAt(1) });
  link(c[0] - R - 8, c[1], a[0], a[1] + R + 8, {
    route: "hv",
    alpha: q,
    draw: knotAt(2),
    flowing: since(t, fillAt + 1.05),
    last: since(thoughtEnd(fillAt) - 0.3, fillAt + 1.05)
  });
  nameText(L("刚好够用的模型", "The smallest model that will do"), en ? c[0] : a[0] - R, nameY, {
    align: L("left", "center"),
    valign: "top",
    width: L(360, 440),
    alpha: one * named(t, model)
  });
}
function s07Relationships(s, t, relations, two) {
  const ats = cues(s, [
    ["一个概念只用一个意思", "one meaning per concept"],
    ["谁影响谁", "causes"],
    ["谁依赖谁", "dependencies"],
    ["受什么限制", "constraints"],
    ["有哪些反馈回路", "feedback loops"]
  ]);
  const shift = building(t, ats, 130), xs = [440, 700, 960, 1220, 1480].map((x) => x + shift);
  const still = ats.at(-1) - 0.1 + glideTime(130);
  const cy = 650, r = 20, h = 70;
  s07Knot(960, 390, two);
  nameText(L("先理关系", "Relationships"), 960, 390 + 92 + NAME_GAP, {
    valign: "top",
    alpha: two * named(t, relations)
  });
  const node = (x, y, q, lit = 0, size = r) => {
    dot(x, y, size, { color: P.row, alpha: q });
    ring(x, y, size, { color: P.ink, alpha: q, width: 2.5 });
    if (lit > 0)
      ring(x, y, size + 9, {
        color: P.evidence,
        alpha: lit * restMark(P.evidence, 0.5) * q,
        width: 2
      });
  };
  ats.forEach((at, i) => {
    const x = xs[i], q = two * ramp(t, at - 0.1, 0.5), go = soon(t, at + 0.05, 0.7), lit = speaking(t, ats, i), drawn = since(t, Math.max(at + 0.75, still));
    if (i === 0) {
      const c = x + 6;
      node(c - h, cy, q, lit);
      dot(c + h, cy - 34, 9, { color: P.evidence, alpha: q });
      dot(c + h, cy + 34, 9, { color: P.muted, alpha: q * 0.8, hollow: true });
      link(c - h + r + 6, cy, c + h - 16, cy - 34, { route: "hvh", mid: c, alpha: q, upto: go });
      link(c - h + r + 6, cy, c + h - 16, cy + 34, {
        route: "hvh",
        mid: c,
        alpha: q * 0.8,
        upto: go,
        end: false,
        dash: [5, 6]
      });
      line(c + 36, cy + 34 - 16, c + 36, cy + 34 + 16, {
        color: P.unknown,
        alpha: q * ramp(t, at + 0.5, 0.3),
        width: 4
      });
    } else if (i === 1) {
      node(x - h, cy, q, lit);
      node(x + h, cy, q * go);
      link(x - h + r + 6, cy, x + h - r - 6, cy, { alpha: q, upto: go, flowing: drawn });
    } else if (i === 2) {
      node(x, cy - 44, q * go, 0, 16);
      node(x, cy + 44, q, lit);
      link(x, cy + 44 - r - 6, x, cy - 44 + 16 + 6, { alpha: q, upto: go });
    } else if (i === 3) {
      const from = x - 46, limit = x + 64;
      node(from, cy, q, lit);
      link(from + r + 6, cy, limit, cy, { alpha: q, upto: go, end: false });
      const way = 0.9 * (limit - from - r - 6), run = loopPhase(drawn, way);
      if (run !== null)
        flowDot(mix(from + r + 6, limit, 0.9 * run), cy, 4, run, { color: P.line, alpha: q }, way);
      line(limit, cy - 26, limit, cy + 26, {
        color: P.authority,
        alpha: q * ramp(t, at + 0.5, 0.3),
        width: 4
      });
    } else {
      node(x - h, cy - 8, q, lit);
      node(x + h, cy - 8, q * go);
      link(x - h + r + 6, cy - 8, x + h - r - 6, cy - 8, { alpha: q, upto: go });
      link(x + h, cy - 8 + r + 6, x - h, cy - 8 + r + 6, {
        route: "vhv",
        mid: cy + 50,
        alpha: q,
        draw: { t, at: at + 0.5 },
        flowing: since(t, at + 1.3)
      });
    }
  });
  const names = en ? ["One meaning per concept", "Causes", "Dependencies", "Constraints", "Feedback loops"] : [["一个概念只用一个意思"], "谁影响谁", "谁依赖谁", "受什么限制", "有哪些反馈回路"];
  railNames(names, xs, cy + 64, { alpha: (i) => two * listIn(t, ats, i), set: "relations" });
}
function s07Interacting(s, t, interacting, three) {
  const [force, boxes, effect, twice] = cues(s, [
    ["硬拆成", "force interacting parts"],
    ["互不相干的几块", "separate boxes"],
    ["同一个影响", "one effect"],
    ["算两次", "twice"]
  ]);
  const back = en ? interacting : cueFrom(s, "影响", "", interacting);
  const cy = 470, ax = 640, bx = 1280, r = 36, LY = 100, wall = 960;
  const cut = ramp(t, boxes + 0.05, 0.4), walls = soon(t, boxes + 0.05, 0.6);
  [ax, bx].forEach((x) => {
    dot(x, cy, r, { color: P.row, alpha: three });
    ring(x, cy, r, { color: P.ink, alpha: three, width: 2.5 });
  });
  const stopped = 1 - ramp(t, boxes, 0.3);
  link(ax, cy - r - 8, bx, cy - r - 8, {
    route: "vhv",
    mid: cy - LY,
    alpha: three,
    draw: { t, at: interacting + 0.2 },
    width: 3,
    flowing: since(t, interacting + 1),
    fade: stopped
  });
  link(bx, cy + r + 8, ax, cy + r + 8, {
    route: "vhv",
    mid: cy + LY,
    alpha: three,
    draw: { t, at: back + 0.2 },
    width: 3,
    flowing: since(t, back + 1),
    fade: stopped
  });
  [-LY, LY].forEach(
    (dy) => line(wall, cy + dy - 18, wall, cy + dy + 18, {
      color: P.unknown,
      alpha: three * cut,
      width: 4
    })
  );
  [ax, bx].forEach(
    (x) => box(x - 110, cy - 75 + 75 * (1 - walls), 220, 150 * walls, {
      stroke: P.muted,
      alpha: three * cut,
      radius: 6
    })
  );
  nameText(L("互相影响的因素", "Interacting parts"), wall, cy - LY - 18 - NAME_GAP, {
    valign: "bottom",
    alpha: three * named(t, interacting)
  });
  rejectedName(L("硬拆成互不相干的几块", "Separate boxes"), wall, cy + LY + 18 + NAME_GAP, {
    valign: "top",
    width: 440,
    alpha: three * named(t, force),
    mark: ramp(t, boxes + 0.45, 0.35)
  });
  const ey = 750, ex = 820, tx = 1060, ty = [ey - 50, ey + 50];
  const eq = three * ramp(t, effect - 0.1, 0.45), tq = three * ramp(t, twice - 0.1, 0.4);
  dot(ex, ey, r, { color: P.row, alpha: eq });
  ring(ex, ey, r, { color: P.evidence, alpha: eq, width: 2.5 });
  const stop = (ex + tx) / 2 + 50;
  box(tx - 22, ty[0] - 22, 44, 44, { stroke: P.line, alpha: eq * 0.8, radius: 6 });
  box(tx - 26, ty[1] - 26, 52, 52, { stroke: P.line, alpha: tq * 0.8, radius: 6 });
  link(ex + r + 8, ey, tx - 30, ty[0], {
    route: "hvh",
    mid: (ex + tx) / 2 - 20,
    alpha: eq,
    draw: { t, at: effect + 0.1 }
  });
  dot(tx, ty[0], 10, { color: P.evidence, alpha: eq * ramp(t, effect + 0.5, 0.3) });
  link(ex + r + 8, ey, stop - 8, ty[1], {
    route: "hvh",
    mid: (ex + tx) / 2 - 20,
    alpha: tq,
    draw: { t, at: twice + 0.05 },
    end: false
  });
  line(stop, ty[1] - 18, stop, ty[1] + 18, {
    color: P.unknown,
    alpha: three * ramp(t, twice + 0.2, 0.25),
    width: 4
  });
  nameText(L("同一个影响", "One effect"), ex - r - NAME_GAP, ey, {
    align: "right",
    color: P.evidence,
    alpha: three * named(t, effect)
  });
  rejectedName(L("算两次", "Counted twice"), tx + 26 + NAME_GAP, ty[1], {
    align: "left",
    alpha: three * named(t, twice),
    mark: ramp(t, twice + 0.1, 0.3)
  });
}

// picture/film/scenes/p07/scene.js
scenes["07"] = function(s, t) {
  const base = ramp(t, opening(s), 0.7);
  const [relations, interacting, observe, hypotheses, experiment, delay, reason, bounded] = cues(
    s,
    [
      ["先理关系", "model the relationships"],
      ["互相影响的因素", "interacting parts"],
      ["再把观察记清楚", "pin down the observations"],
      ["然后检验假设", "test the hypotheses"],
      ["用最小的实验", "smallest experiment"],
      ["昨晚那次延迟", "last night's delay"],
      ["相信结论之前", "before trusting a conclusion"],
      ["有边界的结论", "bound the conclusion"]
    ]
  );
  const lastNight = cue(s, "比如昨晚", "take last night");
  illustrative(span(t, lastNight - 0.2, reason - 0.2, 0.4) * base);
  const one = base * stageOut(t, relations);
  if (one > 0) s07Understanding(s, t, one);
  const two = base * stageIn(t, relations) * stageOut(t, interacting);
  if (two > 0) s07Relationships(s, t, relations, two);
  const three = base * stageIn(t, interacting) * stageOut(t, observe);
  if (three > 0) s07Interacting(s, t, interacting, three);
  const four = base * stageIn(t, observe) * stageOut(t, hypotheses);
  if (four > 0) s07Observations(s, t, observe, four);
  const five = base * stageIn(t, hypotheses) * stageOut(t, delay);
  if (five > 0) s07Hypotheses(s, t, hypotheses, experiment, five);
  const seven = base * stageIn(t, delay) * stageOut(t, reason);
  if (seven > 0) s07Delay(s, t, delay, seven);
  const eight = base * stageIn(t, reason) * stageOut(t, bounded);
  if (eight > 0) s07Reasoning(s, t, reason, eight);
  const nine = base * stageIn(t, bounded);
  if (nine > 0) s07Bounds(s, t, bounded, nine);
};

// picture/film/scenes/p08/choice.js
function s08Options(s, t, choose, options, statusQuo, notProve, criteria, badgeAts, cmp) {
  const easeAt = en ? cueFrom(s, "", "cost", criteria.at(-1)) : badgeAts[0];
  ctx.save();
  ctx.translate(20 - L(115, 185) * glide(t, easeAt + 0.05, L(115, 185)), 0);
  const LR = 580, xs = [800, 1060, 1320], CW = 140, top = 400, headY = top + 46 - labelSize(LABEL) / 2, rowY = (i) => 550 + i * 58;
  const opened = [statusQuo, choose, choose];
  const low = criteria.reduce(
    (h, at, i) => mix(h, rowY(i) + 40, soon(t, at - 0.3, 0.4)),
    top + 130
  );
  xs.forEach((x, j) => {
    box(x - CW / 2, top, CW, low - top, {
      fill: P.row,
      stroke: P.line,
      alpha: ramp(t, opened[j] - 0.1, 0.4) * cmp,
      radius: 14,
      width: 2.5
    });
  });
  const CX = LR - 24, BY = top - 46, opts = ramp(t, options - 0.15, 0.4) * cmp, open = cmp * named(t, choose);
  diamond(CX, BY, 20, { color: P.authority, alpha: open });
  text("?", CX, BY + 1, 22, { role: "mark", align: "center", color: P.authority, alpha: open });
  nameText(L("选择", "Choosing"), CX - 20 - NAME_GAP, BY, {
    align: "right",
    color: P.authority,
    alpha: open
  });
  const xl = mix(xs[1], xs[0], glide(t, statusQuo - 0.3, xs[1] - xs[0]));
  link(CX + 26, BY, xl, BY, { alpha: opts, draw: { t, at: options - 0.1 } });
  link(xl, top - 14, xs[2], top - 14, {
    route: "vhv",
    mid: BY,
    end: false,
    alpha: opts,
    draw: { t, at: options - 0.1 }
  });
  nameText(L("可行的方案", "Feasible options"), xs[1], top - 46 - NAME_GAP, {
    valign: "bottom",
    alpha: cmp * named(t, options)
  });
  const headSize = NOTE;
  nameText(L(["维持现状"], ["Status quo"]), xs[0], headY, {
    valign: "top",
    size: headSize,
    alpha: cmp * named(t, statusQuo)
  });
  ["A", "B"].forEach(
    (v, j) => nameText(v, xs[j + 1], headY, {
      valign: "top",
      size: headSize,
      alpha: cmp * named(t, choose)
    })
  );
  const rows = en ? ["Benefit", "Cost", "Risk", "Reversibility", "Opportunity cost"] : ["收益", "成本", "风险", "可逆性", "机会成本"];
  const fav = [
    [0.3, 0.8, 0.9],
    [0.8, 0.4, 0.1],
    [0.5, 0.6, 0.2],
    [1, 0.7, 0.3],
    [0.4, 0.5, 0.6]
  ];
  rows.forEach((v, i) => {
    const y = rowY(i), lit = speaking(t, criteria, i) * cmp, grid = ramp(t, criteria[i] - 0.15, 0.4) * cmp;
    line(LR + 40, y, xs[2] + CW / 2, y, { color: P.line, alpha: grid * 0.5, width: 2 });
    line(LR + 40, y, xs[2] + CW / 2, y, { color: P.muted, alpha: lit, width: 2.5 });
    xs.forEach((x, j) => {
      dot(x, y, 6, { color: P.line, alpha: grid, hollow: true });
      dot(x, y, 6 + 14 * fav[i][j] * soon(t, criteria[i] - 0.1 + j * 0.12, 0.4), {
        color: P.evidence,
        alpha: ramp(t, criteria[i] - 0.1 + j * 0.12, 0.3) * cmp
      });
    });
    nameText(v, LR, y, { align: "right", alpha: cmp * listIn(t, criteria, i), set: "basis" });
  });
  const QX = xs[2] + CW / 2 + 30, QY = rowY(2), refuse = ramp(t, notProve - 0.1, 0.4);
  const qualities = rejectedName(
    L("新颖、完整、流行", "Novelty, completeness or popularity"),
    QX,
    QY,
    { align: "left", width: L(340, Infinity), alpha: cmp * named(t, badgeAts[0]), mark: refuse }
  );
  nameText(L("证明不了它合适", "does not prove a fit"), QX, qualities.bottom + 12, {
    align: "left",
    valign: "top",
    alpha: cmp * named(t, notProve)
  });
  ctx.restore();
}
function s08Recommendation(t, recommend, premise, objection, first, revisit, rec) {
  ctx.save();
  ctx.translate(en ? 60 - 60 * glide(t, objection + 0.05, 60) : 64, 0);
  const parts = [premise, objection, first, revisit], LX = 1e3, ys = stackTops([0, 0, 0, 0], CONTENT_CY, 96);
  const names = en ? ["Premises", "The strongest objection", "The first step", "What would trigger a revisit"] : ["前提", "最有力的反对意见", "第一步", "重新考虑"];
  documentIcon(560, CONTENT_CY - 130, 200, 260, { alpha: rec, rows: 4 });
  nameText(L("推荐方案", "A recommendation"), 660, CONTENT_CY + 130 + NAME_GAP, {
    valign: "top",
    alpha: rec * named(t, recommend)
  });
  const spine = 860, grow = (i) => soon(t, parts[i] - 0.15, 0.5);
  link(760 + 12, CONTENT_CY, spine, CONTENT_CY, { alpha: rec, end: false });
  link(spine, CONTENT_CY, spine, ys[0], { alpha: rec * 0.9, upto: grow(0), end: false });
  link(spine, CONTENT_CY, spine, ys[3], {
    alpha: rec * 0.9,
    end: false,
    upto: (grow(2) * (ys[2] - CONTENT_CY) + grow(3) * (ys[3] - ys[2])) / (ys[3] - CONTENT_CY)
  });
  ys.forEach((y, i) => {
    const q = ramp(t, parts[i] - 0.1, 0.4) * rec, lit = speaking(t, parts, i) * rec;
    link(spine, y, LX - 34 - 13, y, { alpha: rec * 0.8, upto: grow(i), end: false });
    dot(LX - 34, y, 13, { color: P.evidence, alpha: q });
    if (lit > 0)
      ring(LX - 34, y, 21, {
        color: P.evidence,
        alpha: lit * restMark(P.evidence, 0.5),
        width: 2
      });
    nameText(names[i], LX, y, {
      align: "left",
      alpha: rec * listIn(t, parts, i),
      set: "recommendation"
    });
  });
  ctx.restore();
}
function s08Decision(s, t, holder, notDecision, decisionName, decides, phrases, shown, dec) {
  const Y = CONTENT_CY - 50, px = 560, sx = 1400, SR = 58, jx = 820, stop = 1250, ys = [Y - 170, Y - 90, Y + 130];
  person(px, Y - 6, { alpha: dec, color: P.authority, size: 1.3 });
  nameText(L("决策负责人", "The decision owner"), px, Y + 50 + NAME_GAP, {
    valign: "top",
    color: P.authority,
    alpha: dec * named(t, holder)
  });
  link(px + 44, Y, sx - SR - 14, Y, {
    color: P.authority,
    alpha: dec,
    draw: { t, at: holder - 0.1, least: decides - holder + 0.3 },
    width: 2.5
  });
  seal(sx, Y, SR, { alpha: ramp(t, decides - 0.1, 0.4) * dec });
  nameText(L("决定", "Decides"), sx, Y + SR + NAME_GAP, {
    valign: "top",
    alpha: dec * named(t, decisionName)
  });
  const refuse = ramp(t, notDecision + 0.05, 0.4), cs = Math.min(26, labelSize(LABEL) * 0.9), px0 = (jx + stop) / 2 - (16 + cs) / 2;
  const stacked = ys.some((y, i) => ys.some((v, k) => k !== i && v > Y === y > Y));
  const widths = phrases.map((v) => measure(v)), markAt = (i) => px0 + (stacked ? Math.max(...widths) : widths[i]) / 2 + 16;
  shown.forEach((at, i) => {
    const y = ys[i], below = y > Y;
    link(jx, Y, stop, y, {
      route: "vh",
      alpha: dec * ramp(t, at - 0.15, 0.3),
      draw: { t, at: at - 0.1 },
      end: false
    });
    line(stop, y - 18, stop, y + 18, { color: P.unknown, alpha: refuse * dec, width: 4 });
    rejectedName(
      phrases[i],
      mix((jx + stop) / 2, px0, refuse),
      y + (below ? NAME_GAP : -NAME_GAP),
      {
        valign: below ? "top" : "bottom",
        alpha: dec * mix(listIn(t, shown, i), named(t, at), refuse),
        mark: refuse,
        set: "phrases",
        markLeft: markAt(i)
      }
    );
  });
  const states = [
    ["待决定", "ready for decision"],
    ["受阻", "blocked"],
    ["暂缓", "deferred"]
  ].map(([zh, english]) => cueFrom(s, zh, english, notDecision));
  const SY = Y + 280, sxs = [680, 960, 1240];
  states.forEach((at, i) => {
    const x = sxs[i], q = dec * ramp(t, at - 0.1, 0.4), go = soon(t, at - 0.05, 0.6);
    if (i === 0) {
      documentIcon(x - 60, SY - 26, 40, 52, { alpha: q, rows: 2 });
      seal(x + 24, SY, 26, { alpha: q, hollow: true });
    } else if (i === 1) {
      link(x - 40, SY, x + 26, SY, { alpha: q, upto: go, end: false });
      token(mix(x - 40, x + 14, go), SY, { alpha: q, r: 11 });
      line(x + 38, SY - 22, x + 38, SY + 22, { color: P.unknown, alpha: q, width: 4 });
    } else {
      token(x - 30, SY, { alpha: q, r: 11 });
      clock(x + 22, SY, 22, { hand: 0.25, color: P.muted, alpha: q });
    }
    nameText(
      en ? ["Ready for decision", "Blocked", "Deferred"][i] : ["待决定", "受阻", "暂缓"][i],
      x,
      SY + 30 + NAME_GAP,
      { valign: "top", alpha: dec * listIn(t, states, i), set: "readiness" }
    );
  });
}
function s08NewFacts(t, overturn, conclusion, overturned, correct, defend, sunkCue, fix) {
  ctx.save();
  ctx.translate(150 - 150 * glide(t, correct + 0.05, 150), 0);
  const Y = 470, xs = [550, 990, 1430], PW = 200, PH = 290, FW = 170, FH = 220, my = Y + PH / 2 + 70, SR = 54;
  const from = xs[0] + PW / 2 + 12, to = xs[2] - PW / 2 - 12, facts = (xs[1] - FW / 2 - 12 - from) / (to - from);
  link(from, Y, to, Y, {
    alpha: fix * 0.9,
    upto: mix(facts, 1, drawShare(t, correct - 0.1, (1 - facts) * (to - from))),
    end: false,
    flowing: since(t, correct + 0.5)
  });
  const old = fix * mix(1, restMark(P.authority), ramp(t, overturned + 0.05, 0.4)), fresh = ramp(t, correct - 0.1, 0.4) * fix;
  documentIcon(xs[0] - PW / 2, Y - PH / 2, PW, PH, { alpha: old, rows: 0 });
  seal(xs[0], Y - 8, SR, { alpha: old });
  cross(xs[0] - PW / 2 - 40, Y, 34, { alpha: ramp(t, overturned + 0.05, 0.4) * fix, width: 4 });
  documentIcon(xs[1] - FW / 2, Y - FH / 2, FW, FH, { alpha: fix, rows: 3, stroke: P.evidence });
  documentIcon(xs[2] - PW / 2, Y - PH / 2, PW, PH, { alpha: fresh, rows: 0 });
  seal(xs[2], Y - 8, SR, { alpha: fresh });
  railNames(
    en ? ["A conclusion", "New facts", "Correct it"] : ["结论", "新的事实", "就改"],
    xs,
    Y - PH / 2,
    {
      side: -1,
      gap: NAME_GAP,
      alpha: (i) => fix * named(t, [Math.min(conclusion, overturn + 0.2), overturn + 0.2, correct][i])
    }
  );
  [0, 1, 2].forEach(
    (k) => box(xs[0] - 60, my + k * 34, 120, 26, {
      fill: P.row,
      stroke: P.muted,
      alpha: fix * named(t, defend),
      radius: 4
    })
  );
  link(xs[0], my - 14, xs[0], my - 72, {
    alpha: fix * named(t, defend),
    draw: { t, at: defend - 0.05 },
    end: false
  });
  line(xs[0] - 22, my - 72, xs[0] + 22, my - 72, {
    color: P.unknown,
    alpha: ramp(t, sunkCue + 0.05, 0.3) * fix,
    width: 4
  });
  rejectedName(L("被沉没成本绑住", "Defending sunk costs"), xs[0] + 60 + NAME_GAP, my + 47, {
    align: "left",
    alpha: fix * named(t, defend),
    mark: ramp(t, sunkCue + 0.05, 0.4)
  });
  ctx.restore();
}

// picture/film/scenes/p08/diagnosis.js
function s08Timeline(s, t, failed, kept, timeline, found, system, toPrevent, toDetect, one) {
  const Y = 550, xs = [480, 800, 1120, 1440], rail = ramp(t, opening(s) + 0.2, 0.6) * one;
  line(260, Y, 1660, Y, { color: P.line, alpha: rail, width: 4 });
  const sweep = clamp((t - timeline + 0.1) / 1.2);
  [340, 640, 960, 1280, 1580].forEach(
    (x) => line(x, Y - 12, x, Y + 12, {
      color: P.muted,
      alpha: rail * clamp((sweep * 1400 - (x - 260)) / 300),
      width: 2
    })
  );
  nameText(L("时间线", "Timeline"), 260, Y - NAME_GAP, {
    align: "left",
    valign: "bottom",
    alpha: one * named(t, timeline)
  });
  const sys = ramp(t, system - 0.15, 0.4) * one;
  link(xs[0], Y - 30, xs[2], Y - 30, {
    route: "vhv",
    mid: Y - 130,
    alpha: sys,
    draw: { t, at: system - 0.1 },
    end: false
  });
  nameText(
    L("现有的工作体系", "The existing work system"),
    (xs[0] + xs[2]) / 2,
    Y - 130 - NAME_GAP,
    { valign: "bottom", alpha: one * named(t, system) }
  );
  const ats = [toPrevent, found, toDetect, kept];
  xs.forEach((x, i) => {
    const q = ramp(t, (i === 3 ? failed : ats[i]) - 0.1, 0.4) * one;
    dot(x, Y, 21, { color: P.ground, alpha: clamp(q * 8) });
    if (i === 0 || i === 2) {
      ring(x, Y, 20, { color: P.unknown, alpha: q, width: 2.5 });
      text("?", x, Y + 1, 26, { role: "mark", align: "center", color: P.unknown, alpha: q });
    } else {
      ring(x, Y, 20, { color: P.unknown, alpha: q, width: 3 });
      dot(x, Y, i === 3 ? 10 : 6, { color: P.unknown, alpha: q });
    }
    if (i === 3) line(x, Y - 26, x, Y - 64, { color: P.unknown, alpha: q, width: 3 });
  });
  railNames(
    en ? ["Prevent", "Direct cause", "Detect", "Original symptom"] : ["预防", "直接原因", "发现", "最初的症状"],
    xs,
    Y,
    { alpha: (i) => one * named(t, ats[i]) }
  );
  nameText(L("出了问题", "Something fails"), xs[3], Y - 64 - NAME_GAP, {
    valign: "bottom",
    alpha: one * named(t, failed)
  });
}
function s08Layers(s, t, two, layers, lay) {
  const ys = [330, 500, 670], x0 = 680, x1 = 1180, h = 84, names = en ? ["Containment", "Repair", "Prevention"] : ["控制影响", "修复", "防止再发生"];
  const not = cue(s, "不算", "is not a"), whole = cue(s, "治本", "systemic fix"), done = ramp(t, two - 0.1, 0.4) * lay;
  const nameEnd = x1 + NAME_GAP + Math.max(...names.map((v) => measure(v))), refusedEnd = x0 - 40 - NAME_GAP - 42 - measure(L("只做前两层", "Only the first two"));
  const fixEnd = nameEnd + 40 + NAME_GAP + measure(L("治本", "A systemic fix")), centre = (l, r) => 960 - (l + r) / 2;
  const states = [centre(x0, nameEnd), centre(refusedEnd, nameEnd), centre(refusedEnd, fixEnd)];
  const ox = states[0] + (states[1] - states[0]) * glide(t, two - 0.1, states[1] - states[0]) + (states[2] - states[1]) * glide(t, not + 0.05, states[2] - states[1]);
  ctx.save();
  ctx.translate(ox, building(t, layers, (ys[1] - ys[0]) / 2));
  ys.forEach((y, i) => {
    const q = ramp(t, layers[i] - 0.1, 0.4) * lay, lit = speaking(t, layers, i) * lay;
    box(x0, y - h / 2, x1 - x0, h, {
      fill: P.row,
      stroke: P.line,
      alpha: q,
      radius: 10,
      width: 2.5
    });
    box(x0, y - h / 2, x1 - x0, h, { stroke: P.ink, alpha: q * lit, radius: 10, width: 3 });
    if (i < 2) check(x0 + 200, y, 30, { alpha: done, draw: { t, at: two - 0.05 + i * 0.2 } });
    else ring(x0 + 200, y, 17, { color: P.unknown, alpha: done, width: 2.5, dash: [4, 5] });
    nameText(names[i], x1 + NAME_GAP, y, {
      align: "left",
      alpha: lay * listIn(t, layers, i),
      set: "layers"
    });
  });
  const lx = x0 - 40, top = ys[0] - h / 2;
  link(x0 - 18, top, x0 - 18, ys[1] + h / 2, {
    route: "hvh",
    mid: lx,
    end: false,
    alpha: done,
    draw: { t, at: two - 0.1 }
  });
  rejectedName(L("只做前两层", "Only the first two"), lx - NAME_GAP - 42, (ys[0] + ys[1]) / 2, {
    align: "right",
    alpha: lay * named(t, two),
    mark: ramp(t, not + 0.05, 0.4)
  });
  const bx = x1 + NAME_GAP + Math.max(...names.map((v) => measure(v))) + 40;
  link(bx - 18, top, bx - 18, ys[2] + h / 2, {
    route: "hvh",
    mid: bx,
    end: false,
    alpha: ramp(t, whole - 0.1, 0.4) * lay,
    draw: { t, at: whole - 0.1 }
  });
  nameText(L("治本", "A systemic fix"), bx + NAME_GAP, ys[1], {
    align: "left",
    alpha: lay * named(t, whole)
  });
  ctx.restore();
}

// picture/film/scenes/p08/scene.js
scenes["08"] = function(s, t) {
  const [
    two,
    choose,
    options,
    statusQuo,
    notProve,
    recommend,
    premise,
    objection,
    first,
    revisit,
    authorized,
    overturn
  ] = cues(s, [
    ["只做前两层", "only the first two"],
    ["做选择时", "when choosing"],
    ["可行的方案", "feasible options"],
    ["维持现状", "status quo"],
    ["证明不了它合适", "does not prove"],
    ["推荐方案时", "a recommendation"],
    ["前提", "premises"],
    ["最有力的反对意见", "strongest objection"],
    ["第一步", "first step"],
    ["什么情况下重新考虑", "trigger a revisit"],
    ["决定，由决策负责人做", "decision owner decides"],
    ["新的事实推翻了结论", "new facts overturn"]
  ]);
  const layers = cues(s, [
    ["控制影响", "containment"],
    ["修复", "repair"],
    ["防止再发生", "prevention"]
  ]);
  const criteria = cues(s, [
    ["收益", "benefit"],
    ["成本", "cost"],
    ["风险", "risk"],
    ["可逆性", "reversibility"],
    ["机会成本", "opportunity cost"]
  ]);
  const badgeAts = cues(s, [
    ["新颖", "novelty"],
    ["完整", "completeness"],
    ["流行", "popularity"]
  ]);
  const base = ramp(t, opening(s), 0.7);
  const [failed, kept, timeline, found, system, toPrevent, toDetect] = cues(s, [
    ["出了问题", "something fails"],
    ["最初的症状", "original symptom"],
    ["时间线", "timeline"],
    ["直接原因", "direct cause"],
    ["现有的工作体系", "the existing"],
    ["预防", "prevent"],
    ["发现", "detect"]
  ]);
  const one = base * stageOut(t, layers[0]);
  if (one > 0) s08Timeline(s, t, failed, kept, timeline, found, system, toPrevent, toDetect, one);
  const lay = base * stageIn(t, layers[0]) * stageOut(t, choose);
  if (lay > 0) s08Layers(s, t, two, layers, lay);
  const cmp = base * stageIn(t, choose) * stageOut(t, recommend);
  if (cmp > 0) s08Options(s, t, choose, options, statusQuo, notProve, criteria, badgeAts, cmp);
  const rec = base * stageIn(t, recommend) * stageOut(t, authorized);
  if (rec > 0) s08Recommendation(t, recommend, premise, objection, first, revisit, rec);
  const [holder, notDecision, decisionName] = cues(s, [
    ["决策负责人", "decision owner"],
    ["都不是决定", "are not decisions"],
    ["决定，由", "decides"]
  ]);
  const decides = cueFrom(s, "做", "decides", holder);
  const said = en ? cues(s, [
    ["", "agreed in principle"],
    ["", "keep looking"],
    ["", "keep going"]
  ]) : cues(s, [
    ["原则上同意", ""],
    ["再看看", ""],
    ["继续推进", ""]
  ]);
  const phrases = en ? ["“Agreed in principle”", "“Keep looking”", "“Keep going”"] : ["“原则上同意”", "“再看看”", "“继续推进”"];
  const shown = said;
  const dec = base * stageIn(t, authorized) * stageOut(t, overturn);
  if (dec > 0) s08Decision(s, t, holder, notDecision, decisionName, decides, phrases, shown, dec);
  const [conclusion, overturned, correct, defend, sunkCue] = cues(s, [
    ["结论", "conclusion"],
    ["推翻了", "overturn"],
    ["就改", "correct it"],
    ["别被沉没成本绑住", "defending sunk costs"],
    ["沉没成本", "sunk costs"]
  ]);
  const fix = base * stageIn(t, overturn);
  if (fix > 0) s08NewFacts(t, overturn, conclusion, overturned, correct, defend, sunkCue, fix);
};

// picture/film/scenes/p09/scene.js
scenes["09"] = function(s, t) {
  const [specific, file, chart, signal, six, unclear, , , truth] = cues(s, [
    ["证明适合某个具体用途", "shown fit for a specific use"],
    ["能打开的文件", "a file that opens"],
    ["好看的图", "a chart that looks good"],
    ["看起来有效的模型信号", "a promising model signal"],
    ["先答清六个问题", "answer six questions"],
    ["含义、质量或", "data with unknown meaning"],
    ["探索", "explored"],
    ["共享", "sharing, production and decisions"],
    ["权威来源", "source of truth"]
  ]);
  const asks = cues(s, [
    ["从哪里来", "where did it come from"],
    ["最早什么时候能拿到", "when did it become available"],
    ["含义是什么", "what does it mean"],
    ["被什么改过", "what changed it"],
    ["质量怎么样", "how good is it"],
    ["能用在哪里", "how may it be used"]
  ]);
  const views = cues(s, [
    ["报告", "reports"],
    ["数据目录", "catalogs"],
    ["缓存", "caches"],
    ["智能体的摘要", "agent summaries"]
  ]);
  const unknowns = cues(s, [
    ["含义", "meaning"],
    ["质量", "quality"],
    ["使用权限", "permission"],
    ["复现", "reproducibility"]
  ]);
  const [dataAt, useAt, trustAt] = cues(s, [
    ["数据", "data"],
    ["具体用途", "a specific use"],
    ["才谈得上可信", "earns trust"]
  ]);
  const explore = cue(s, "可以在授权范围里探索", "may be explored"), opensFour = en ? unclear : explore;
  const recalled = en ? [] : [unclear, cue(s, "质量或", ""), cue(s, "最早能拿到的时间", "")], recalls = [2, 4, 1];
  const base = ramp(t, opening(s), 0.7);
  const cx = 960, cy = 470, W = 560, H = 340, top = cy - H / 2;
  const back = glide(t, asks[4] + 0.05, 55), ringCut = en ? glide(t, six + STAGE_CUT, 55) - glide(t, asks[1] - 0.1, 55) : 0;
  ctx.save();
  ctx.translate(en ? -55 * (glide(t, unknowns[0] + 0.05, 55) - ringCut - back) : 0, 0);
  const center = base * stageOut(t, opensFour) * clearOfTitle(s, t, top - 60);
  if (center > 0) {
    const core = ramp(t, Math.min(specific - 0.4, opening(s) + 0.2), 0.7) * center;
    tableIcon(cx - W / 2, top, W, H, { alpha: core, joined: true });
    [
      ["101.18", "101.25", "100.97"],
      ["100.94", "101.02", "100.88"],
      ["101.37", "101.41", "101.12"],
      ["101.06", "101.10", "100.95"]
    ].forEach(
      (row, r) => row.forEach(
        (v, c) => text(v, cx - W / 3 + c * W / 3, top + H * (r + 0.5) / 4, 26, {
          align: "center",
          color: c ? P.muted : P.ink,
          alpha: core,
          role: "mark"
        })
      )
    );
    nameText(L("数据", "Data"), cx - W / 2, top - NAME_GAP, {
      align: "left",
      valign: "bottom",
      alpha: center * named(t, Math.min(dataAt, s.words[0].start))
    });
    nameText(L("具体用途", "A specific use"), cx + W / 2, top - NAME_GAP, {
      align: "right",
      valign: "bottom",
      color: P.evidence,
      alpha: center * named(t, useAt)
    });
    const badge = ramp(t, trustAt - 0.15, 0.4) * center;
    dot(cx + W / 2, top + H, 28, { color: P.ground, alpha: badge });
    ring(cx + W / 2, top + H, 28, { color: P.evidence, alpha: badge, width: 2.5, dash: [5, 5] });
    check(cx + W / 2, top + H + 2, 24, { color: P.muted, alpha: badge });
  }
  const two = base * stageOut(t, six);
  if (two > 0) {
    const y = 760, at = [file, chart, signal], seen = (i) => ramp(t, at[i] - 0.1, 0.5) * two, xs = [585, 960, 1335].map((x) => x + building(t, at, 120));
    documentIcon(xs[0] - 40, y - 50, 80, 100, { alpha: seen(0), rows: 3 });
    box(xs[1] - 64, y - 44, 128, 88, { stroke: P.ink, alpha: seen(1), radius: 6 });
    path(
      [
        [xs[1] - 44, y + 24],
        [xs[1] - 14, y - 2],
        [xs[1] + 12, y + 10],
        [xs[1] + 44, y - 24]
      ],
      { color: P.evidence, alpha: seen(1) }
    );
    path(
      [
        [xs[2] - 62, y + 20],
        [xs[2] - 26, y + 14],
        [xs[2] + 2, y - 2],
        [xs[2] + 30, y - 18],
        [xs[2] + 62, y - 40]
      ],
      { color: P.authority, alpha: seen(2), width: 3 }
    );
    railNames(
      en ? ["A file that opens", "A chart that looks good", "A promising model signal"] : ["能打开的文件", "好看的图", "看起来有效的模型信号"],
      xs,
      y + 50,
      { gap: NAME_GAP, wrap: 340, alpha: (i) => two * named(t, at[i]) }
    );
    const ux = cx + W / 2 + 90, names = en ? ["Meaning", "Quality", "Permission", "Reproducibility"] : ["含义", "质量", "权限", "复现"];
    unknowns.forEach((at2, i) => {
      const yy = top + 50 + i * 64, q = ramp(t, at2 - 0.1, 0.4) * two;
      ring(ux, yy, 17, { color: P.unknown, alpha: q, width: 2.5, dash: [4, 4] });
      text("?", ux, yy + 1, 22, { align: "center", color: P.unknown, alpha: q, role: "mark" });
      nameText(names[i], ux + 17 + NAME_GAP, yy, {
        align: "left",
        alpha: two * listIn(t, unknowns, i),
        set: "unknowns"
      });
    });
  }
  const three = base * stageIn(t, six) * stageOut(t, opensFour);
  if (three > 0) {
    const rx = 460, ry = 320, names = en ? [
      "Its source",
      "Its availability",
      "Its meaning",
      "Its changes",
      "Its quality",
      "Its permitted use"
    ] : ["来源", "最早时间", "含义", "改动", "质量", "使用范围"];
    path(
      Array.from({ length: 97 }, (_, k) => [
        cx + Math.cos(k * Math.PI / 48) * rx,
        cy + Math.sin(k * Math.PI / 48) * ry
      ]),
      { color: P.line, alpha: three, width: 3.5 }
    );
    nameText(L("六个问题", "Six questions"), cx, top + H + 28 + NAME_GAP, {
      valign: "top",
      alpha: three * named(t, six)
    });
    asks.forEach((at, i) => {
      const a = -Math.PI / 2 + i * Math.PI / 3, x = cx + Math.cos(a) * rx, y = cy + Math.sin(a) * ry, lit = speaking(t, asks, i);
      const asked = ramp(t, at - 0.1, 0.4) * three;
      dot(x, y, 12, { color: P.ground, alpha: asked });
      dot(x, y, 12, { color: P.evidence, alpha: asked, hollow: true, width: 2.5 });
      dot(x, y, 12, { color: P.evidence, alpha: asked });
      if (lit > 0)
        ring(x, y, 21, {
          color: P.evidence,
          alpha: lit * restMark(P.evidence, 0.5) * three,
          width: 2
        });
      const k = recalls.indexOf(i), open = k >= 0 && k < recalled.length ? ramp(t, recalled[k] + 0.05, 0.4) * three : 0;
      if (open > 0) ring(x, y, 24, { color: P.unknown, alpha: open, width: 2.5, dash: [4, 4] });
      radialName(names[i], cx, cy, rx + 12, a, {
        ry: ry + 12,
        alpha: three * listIn(t, asks, i),
        set: "questions"
      });
    });
  }
  ctx.restore();
  const four = base * stageIn(t, opensFour) * stageOut(t, views[0]);
  if (four > 0) {
    const scope = explore, uses = cues(s, [
      ["共享", "sharing"],
      ["投产", "production"],
      ["做决策", "decisions"]
    ]);
    const build = L(45, 90);
    const toWork = build + L(135, 195), toWorkAt = en ? cue(s, "但若用于", "but must stay out of") + 0.05 : uses[0] + 0.05;
    ctx.save();
    ctx.translate(build - toWork * glide(t, toWorkAt, toWork), 0);
    const lx = 650, fy = 340, fw = L(400, 480), fh = 320, ax = 1250, ay = fy, aw = 290, ah = 200, mid = ay + ah / 2, unclearW = L(260, 380), inset = (fw - 400) / 2;
    const unclearName = L("还说不清", "Data with unknown meaning"), unclearAt = en ? unclear : cue(s, "还说不清", "");
    const ct = fy + (fh - 150 - NAME_GAP - blockHeight(wrapName(unclearName, unclearW).length)) / 2;
    box(lx, fy, fw, fh, { stroke: P.muted, width: 2.5, alpha: four, radius: 10 });
    nameText(L("在授权范围里探索", "Explored within an authorized scope"), lx, fy - NAME_GAP, {
      align: "left",
      valign: "bottom",
      alpha: four * named(t, scope)
    });
    tableIcon(lx + 50 + inset, ct, 220, 150, { alpha: four, stroke: P.muted, rows: 2, cols: 2 });
    text("?", lx + 330 + inset, ct + 75, 56, {
      align: "center",
      color: P.unknown,
      alpha: four,
      role: "mark"
    });
    nameText(unclearName, lx + L(160, fw / 2), ct + 150 + NAME_GAP, {
      valign: "top",
      width: unclearW,
      color: P.muted,
      alpha: four * named(t, unclearAt)
    });
    const wq = four * named(t, uses[0]);
    box(ax, ay, aw, ah, { fill: P.row, stroke: P.ink, alpha: wq, radius: 10 });
    nameText(L("共享、投产或做决策", "Sharing, production and decisions"), ax, ay - NAME_GAP, {
      align: "left",
      valign: "bottom",
      width: L(420, 600),
      alpha: wq
    });
    const uq = (i) => four * ramp(t, uses[i] - 0.1, 0.4), ux = (i) => ax + aw * (i + 0.5) / 3, uy = ay + ah / 2;
    person(ux(0) - 12, uy + 4, { alpha: uq(0), size: 0.7 });
    person(ux(0) + 14, uy + 4, { alpha: uq(0), size: 0.7, color: P.muted });
    tableIcon(ux(1) - 30, uy - 22, 60, 44, { alpha: uq(1), rows: 3, cols: 2 });
    diamond(ux(2), uy, 20, { color: P.authority, alpha: uq(2), width: 3 });
    const refuse = cue(s, "但若用于", "but must stay out of"), go = soon(t, refuse - 0.05, 0.6), bx = (lx + fw + ax) / 2;
    link(lx + fw + 12, mid, ax - 12, mid, {
      color: P.unknown,
      alpha: four * ramp(t, refuse - 0.05, 0.3),
      upto: 0.46 * go,
      end: false,
      dash: [8, 8]
    });
    line(bx, mid - 34, bx, mid + 34, {
      color: P.unknown,
      alpha: ramp(t, refuse + 0.45, 0.3) * four,
      width: 4
    });
    ctx.restore();
  }
  const five = base * stageIn(t, views[0]);
  if (five > 0) {
    const xs = [450, 790, 1130, 1470], sx = cx, sb = 360, bus = 410, iconTop = 480;
    const become = cue(s, "悄悄被当成", "quietly be treated as"), rootAt = cue(s, "权威来源", "source of truth");
    tableIcon(sx - 120, 210, 240, 150, { alpha: five * ramp(t, rootAt - 0.15, 0.4) });
    growName(t, [L("权威来源", "Source of truth")], [rootAt], sx - 120, 210 - NAME_GAP, {
      valign: "bottom",
      alpha: five
    });
    const shown = views.map((at) => ramp(t, at - 0.15, 0.4) * five);
    link(sx, sb + 12, sx, bus, {
      alpha: five * ramp(t, Math.min(rootAt, become) - 0.15, 0.4),
      end: false
    });
    line(xs[0], bus, xs[3], bus, { color: P.line, alpha: five, width: 2.5 });
    const names = en ? ["Reports", "Catalogs", "Caches", "Agent summaries"] : ["报告", "数据目录", "缓存", "智能体的摘要"];
    views.forEach((at, i) => {
      const q = shown[i];
      if (q <= 0) return;
      const y = iconTop;
      link(xs[i], bus, xs[i], y - 10, {
        alpha: q,
        draw: { t, at: at + 0.15 },
        end: false,
        flowing: since(t, at + 0.45),
        last: i === 3 ? since(become + 0.05, at + 0.45) : Infinity
      });
      box(xs[i] - 34, y + 8, 72, 96, { stroke: P.line, alpha: q, radius: 4, dash: [5, 5] });
      documentIcon(xs[i] - 42, y, 72, 96, { alpha: q, rows: 3 });
      nameText(names[i], xs[i], y + 104 + NAME_GAP, {
        valign: "top",
        alpha: five * listIn(t, views, i),
        set: "views"
      });
    });
    const barY = (sb + 12 + bus) / 2;
    if (t >= become + 0.05) {
      const way = [
        [xs[3], iconTop - 10],
        [xs[3], bus],
        [sx, bus],
        [sx, barY + 16]
      ];
      const legs = way.slice(1).map(([x, y], k2) => Math.hypot(x - way[k2][0], y - way[k2][1])), total = legs.reduce((a, b) => a + b, 0);
      let left = glide(t, become + 0.05, total) * total, k = 0;
      while (k < legs.length - 1 && left > legs[k]) left -= legs[k++];
      const u = clamp(left / legs[k]), [x0, y0] = way[k], [x1, y1] = way[k + 1];
      dot(
        mix(x0, x1, u),
        mix(y0, y1, u),
        6 * clamp((voiceTime(t) - voiceTime(become + 0.05)) / 0.25),
        { color: P.unknown, alpha: shown[3] }
      );
    }
    line(sx - 24, barY, sx + 24, barY, {
      color: P.unknown,
      alpha: ramp(t, truth + 0.05, 0.3) * five,
      width: 4
    });
  }
};

// picture/film/scenes/p10/scene.js
function s10Card(x, y, { alpha = 1, w = 150, h = 56, border = P.ink, value = "101.37" } = {}) {
  if (alpha < 0.01) return;
  box(x - w / 2, y - h / 2, w, h, { fill: P.row, stroke: border, width: 2, alpha, radius: 6 });
  text(value, x, y + 1, 26, {
    role: "mark",
    align: "center",
    color: P.ink,
    alpha: alpha * clamp((w - 100) / 40)
  });
}
scenes["10"] = function(s, t) {
  const priceAt2 = cue(s, "同一个价格", "One price");
  const at = cues(s, [
    ["在市场上成交", "a trade sets it"],
    ["供应商", "The vendor"],
    ["我们采集", "We collect"],
    ["入库", "write it into"],
    ["用它的人或系统", "becomes available"]
  ]);
  const [term, keepCut] = cues(s, [
    ["可用时间", "availability time"],
    ["修订", "keep the history"]
  ]);
  const notAt = cueFrom(s, "可用时间", "It is not", term + 0.1);
  const one = stageOut(t, notAt);
  if (one > 0) {
    const RAIL = 636, ICON = 426, R = 50, five = cue(s, "至少对应五个时刻", "at least five moments");
    const names = en ? [
      ["A trade in the market"],
      ["Published by the vendor"],
      ["We collect"],
      ["Written into the receiving system"],
      ["Available to people or systems"]
    ] : ["在市场上成交", "供应商发布", "我们采集", "入库", "用它的人或系统"];
    const xs = en ? [258, 558, 858, 1158, 1604] : [360, 660, 960, 1260, 1560];
    const tableOut = 1 - ramp(t, priceAt2 - 0.05, 0.8);
    if (tableOut > 0) {
      const [tx, ty, k] = across(s, t, 960, 285);
      tableIcon(tx - 120 * k, ty - 75 * k, 240 * k, 150 * k, { alpha: tableOut });
    }
    const [cx0, cy0, k0] = across(s, t, 960, 303.75), flightWay = Math.hypot(xs[0] - cx0, RAIL - cy0);
    const flightTime = Math.min(
      glideTime(flightWay),
      voiceTime(at[0] - 0.3) - voiceTime(priceAt2 - 0.05)
    );
    const cruise = (q) => {
      q = clamp(q);
      return q < 0.2 ? q * q / 0.32 : q > 0.8 ? 1 - (1 - q) * (1 - q) / 0.32 : (q - 0.1) / 0.8;
    };
    const flight = cruise((voiceTime(t) - voiceTime(priceAt2 - 0.05)) / flightTime);
    const grouped = ramp(t, five + 0.1, 0.4), BY = ICON - R - 40;
    const lastTenth = voiceTime(priceAt2 - 0.05) + (1 - Math.sqrt(0.032)) * flightTime, first = ease((voiceTime(t) - lastTenth) / 0.4);
    if (flight > 0.35)
      line(xs[1] - 70, RAIL, xs[4] + 70, RAIL, {
        color: P.line,
        width: 2.5,
        alpha: ease((flight - 0.35) / 0.2)
      });
    if (first > 0)
      line(xs[0] - 70, RAIL, xs[1] - 70, RAIL, { color: P.line, width: 2.5, alpha: first });
    const endW = [names[0], names[4]].map(
      (v) => Math.max(...wrapName(v, RAIL_WRAP).map((line2) => measure(line2)))
    );
    const reach = Math.min(
      L(Infinity, 830),
      Math.max(xs[4] + 70 - 960, 960 - (xs[0] - endW[0] / 2 - 16), xs[4] + endW[1] / 2 + 16 - 960)
    );
    path(
      [
        [960 - reach, BY + 14],
        [960 - reach, BY],
        [960 + reach, BY],
        [960 + reach, BY + 14]
      ],
      { color: P.line, alpha: grouped, width: 2 }
    );
    nameText(L("五个时刻", "Five moments"), 960, BY - NAME_GAP, {
      valign: "bottom",
      alpha: grouped
    });
    const icons = [
      (x2, a) => path(
        [
          [x2 - 38, ICON + 16],
          [x2 - 14, ICON - 2],
          [x2 + 4, ICON + 10],
          [x2 + 38, ICON - 20]
        ],
        { color: P.evidence, alpha: a, width: 3 }
      ),
      (x2, a) => documentIcon(x2 - 26, ICON - 35, 52, 70, { alpha: a, rows: 3 }),
      (x2, a) => {
        path(
          [
            [x2 - 32, ICON - 2],
            [x2 - 32, ICON + 24],
            [x2 + 32, ICON + 24],
            [x2 + 32, ICON - 2]
          ],
          { color: P.ink, alpha: a, width: 2.5 }
        );
        link(x2, ICON - 32, x2, ICON + 10, { color: P.ink, alpha: a });
      },
      (x2, a) => tableIcon(x2 - 36, ICON - 26, 72, 52, { alpha: a, rows: 3, cols: 3 }),
      (x2, a) => {
        person(x2 - 20, ICON + 4, { alpha: a, size: 0.8 });
        agent(x2 + 22, ICON, { alpha: a, size: 0.8 });
      }
    ];
    xs.forEach((x2, i) => {
      ring(x2, ICON, R, { color: P.line, alpha: ramp(t, at[i] - 0.15, 0.4), width: 2 });
      dot(x2, RAIL, 12, { color: i === 4 ? P.evidence : P.ink, alpha: ramp(t, at[i] - 0.1, 0.4) });
      icons[i](x2, ramp(t, at[i] - 0.15, 0.4));
      const lit = i === 4 ? ramp(t, at[4] - 0.15, 0.3) : speaking(t, at, i);
      if (lit > 0)
        ring(x2, ICON, R, { color: P.evidence, alpha: lit * restMark(P.evidence, 0.7), width: 2 });
    });
    if (en)
      xs.forEach((x2, i) => {
        if (i % 2)
          line(x2, RAIL - 18, x2, RAIL - 28 - NAME_GAP - RAIL_ROW + 6, {
            alpha: ramp(t, at[i] - 0.15, 0.4),
            width: 2
          });
      });
    railNames(names, xs, RAIL, {
      side: -1,
      gap: (i) => 28 + NAME_GAP + (en && i % 2 ? RAIL_ROW : 0),
      alpha: (i) => listIn(t, at, i),
      set: "moments"
    });
    nameText(
      L("可用时间", "Availability time"),
      xs[4],
      RAIL + 28 + NAME_GAP + blockHeight(1) + 10,
      { valign: "top", color: P.evidence, alpha: named(t, term) }
    );
    let x = xs[0];
    for (let i = 1; i < 5; i++) x = mix(x, xs[i], glide(t, at[i] - 0.1, xs[i] - xs[i - 1]));
    const px = mix(cx0, x, flight), py = mix(cy0, RAIL, flight), ph = mix(37.5 * k0, 56, flight);
    s10Card(px, py, {
      alpha: ramp(t, priceAt2 - 0.25, 0.2),
      w: mix(80 * k0, 150, flight),
      h: ph,
      border: blend(P.ink, P.evidence, ramp(t, at[4] - 0.1, 0.5))
    });
    nameText(L("同一个价格", "One price"), px, py + ph / 2 + NAME_GAP, {
      valign: "top",
      alpha: named(t, priceAt2 + 0.2) * ramp(flight, 0.04, 0.4)
    });
  }
  const two = stageIn(t, notAt) * stageOut(t, keepCut);
  if (two > 0) {
    const RAIL = 590, SLOT = 400, xs = [500, 840, 1400];
    const [nowAt, foundAt, thenAt] = cues(s, [
      ["不是你今天", "when you look"],
      ["今天拿得到", "available now"],
      ["当时", "available then"]
    ]);
    line(xs[0] - 160, RAIL, xs[2] + 200, RAIL, { color: P.line, width: 2.5, alpha: two });
    box(xs[0] - 75, SLOT - 28, 150, 56, {
      stroke: P.unknown,
      alpha: two * ramp(t, thenAt, 0.3),
      radius: 6,
      dash: [6, 6]
    });
    dot(xs[1], RAIL, 12, { color: P.evidence, alpha: two });
    ring(xs[1], RAIL, 22, { color: P.evidence, alpha: two, width: 2 });
    link(xs[1], RAIL - 12, xs[1], SLOT + 28, { color: P.evidence, alpha: two, end: false });
    s10Card(xs[1], SLOT, { alpha: two, border: P.evidence });
    link(xs[1] + 75, SLOT, xs[2] - 75, SLOT, {
      color: P.evidence,
      alpha: two,
      draw: { t, at: foundAt - 0.05 },
      end: false
    });
    dot(xs[2], RAIL, 10, { color: P.ink, alpha: two * named(t, nowAt) });
    link(xs[2], RAIL - 10, xs[2], SLOT + 28, {
      color: P.ink,
      alpha: two,
      draw: { t, at: foundAt - 0.1 },
      end: false
    });
    s10Card(xs[2], SLOT, { alpha: two * ramp(t, foundAt + 0.2, 0.4) });
    dot(xs[0], RAIL, 10, { color: P.unknown, alpha: two * named(t, thenAt) });
    link(xs[0], RAIL - 10, xs[0], SLOT + 28, {
      color: P.unknown,
      alpha: two,
      upto: drawShare(t, thenAt - 0.15, Math.abs(SLOT + 28 - (RAIL - 10)), 0.45),
      end: false,
      dash: [6, 6]
    });
    text("?", xs[0], SLOT + 1, 26, {
      role: "mark",
      align: "center",
      color: P.unknown,
      alpha: two * ramp(t, thenAt, 0.3)
    });
    const y = RAIL + 28 + NAME_GAP;
    nameText(L("当时", "Then"), xs[0], y, { valign: "top", alpha: two * named(t, thenAt) });
    nameText(L("可用时间", "Availability time"), xs[1], y, {
      valign: "top",
      color: P.evidence,
      alpha: two
    });
    rejectedName(L("你今天查到它的时间", "When you look it up today"), xs[2], y, {
      valign: "top",
      width: 360,
      alpha: two * named(t, nowAt),
      mark: ramp(t, nowAt + 0.6, 0.4)
    });
  }
  const three = stageIn(t, keepCut);
  if (three > 0) {
    const RY = 480, xs = [640, 960, 1280], VY = 730, BY = RY + 104;
    const kinds = cues(s, [
      ["修订", "revisions"],
      ["回补", "backfills"],
      ["加工", "derivations"]
    ]);
    const [histAt, valueAt] = cues(s, [
      ["历史都要留着", "Keep the history"],
      ["当前这个值", "explain the current value"]
    ]);
    const answers = en ? [["When it became available"], [cue(s, "", "when it became available")]] : [
      ["从哪来", "最早什么时候能拿到"],
      cues(s, [
        ["从哪来", ""],
        ["最早什么时候能拿到", ""]
      ])
    ];
    const names = en ? ["Revisions", "Backfills", "Derivations"] : ["修订", "回补", "加工"];
    const drawn = drawShare(t, keepCut + 0.05, 1600 - 320);
    line(320, RY, mix(320, 1600, drawn), RY, { color: P.line, width: 3.5, alpha: three });
    line(320, RY - 14, 320, RY + 14, { color: P.line, width: 3.5, alpha: three });
    line(1600, RY - 14, 1600, RY + 14, {
      color: P.line,
      width: 3.5,
      alpha: three * ramp(t, keepCut + 0.55, 0.3)
    });
    const histShown = en ? histAt : cue(s, "这些历史", "");
    nameText(L("历史都要留着", "Keep the history"), 960, RY - 70 - NAME_GAP, {
      valign: "bottom",
      alpha: three * named(t, histShown)
    });
    xs.forEach((x, i) => {
      const kept = ramp(t, kinds[i] - 0.1, 0.4), lit = speaking(t, kinds, i);
      dot(x, RY, 12, { color: P.ink, alpha: three * kept });
      clock(x, RY - 44, 17, { hand: 0.15 + i * 0.2, color: P.muted, alpha: three * kept });
      if (lit > 0)
        ring(x, RY, 22, {
          color: P.evidence,
          alpha: three * lit * restMark(P.evidence, 0.6),
          width: 2
        });
    });
    railNames(names, xs, RY, {
      gap: 22 + 12,
      alpha: (i) => three * listIn(t, kinds, i),
      set: "history"
    });
    const gather = soon(t, valueAt - 0.1, 0.6);
    path(
      [
        [xs[0] - 90, BY - 14],
        [xs[0] - 90, BY],
        [xs[2] + 90, BY],
        [xs[2] + 90, BY - 14]
      ],
      { color: P.line, alpha: three * gather, width: 2 }
    );
    link(960, BY, 960, VY - 32 - 12, { alpha: three, upto: gather });
    s10Card(960, VY, {
      alpha: three * ramp(t, valueAt - 0.1, 0.4),
      w: 180,
      h: 64,
      border: P.evidence
    });
    nameText(L("当前这个值", "Explain the current value"), 960 - 90 - NAME_GAP, VY, {
      align: "right",
      alpha: three * named(t, valueAt)
    });
    answers[0].forEach((v, i) => {
      const y = VY + (i - (answers[0].length - 1) / 2) * 44;
      check(960 + 90 + 40, y, 24, { alpha: three * ramp(t, answers[1][i] - 0.1, 0.4) });
      nameText(v, 960 + 90 + 70, y, {
        align: "left",
        alpha: three * listIn(t, answers[1], i),
        set: "answers"
      });
    });
  }
};
scenes["10"].carries = true;

// picture/film/scenes/p11/prices.js
var X0 = 300;
var X1 = 1600;
var DEC = [560, 800, 1040];
var CORR = [460, 1060];
var CORR_DATE = 1300;
var DAY = 10;
var dayMove = (i) => {
  const v = Math.sin(i * 12.9898 + 78.233) * 43758.5453;
  return v - Math.floor(v) - 0.5;
};
function priceAt(x) {
  const u = (x - X0) / (X1 - X0), d = (x - X0) / DAY, i = Math.floor(d), w = Math.floor(d / 4);
  const day = mix(dayMove(i), dayMove(i + 1), d - i) * 13 + mix(dayMove(w + 500), dayMove(w + 501), d / 4 - w) * 10;
  return 520 - 72 * Math.sin(u * 5.1 + 0.4) - 38 * Math.sin(u * 13.7 + 1.2) - 16 * Math.sin(u * 31.3) + 60 * u + day;
}
var priceLabel = (x) => (101.2 - (priceAt(x) - 552) * 4e-3).toFixed(2);
function corrected(x) {
  const w = clamp((x - CORR[0]) / 40) * clamp((CORR[1] - x) / 40);
  return priceAt(x) - 34 * w * (0.6 + 0.4 * Math.sin((x - CORR[0]) / 55));
}
var series = (fn, a = X0, b = X1, step = 6) => {
  const p = [];
  for (let x = a; x <= b; x += step) p.push([x, fn(x)]);
  return p;
};

// picture/film/scenes/p11/admission.js
function s11Admission(s, t, admitCut, eight) {
  const [condAt, releaseAt, useAt] = cues(s, [
    ["讲明的条件", "stated conditions"],
    ["放行", "under stated"],
    ["一项具体用途", "one specific use"]
  ]);
  const gateAt = cueFrom(s, "准入", "permission", admitCut);
  ctx.save();
  ctx.translate(en ? -65 : 129 - 174 * glide(t, useAt + 0.05, 174), 0);
  const GX = 1e3, RY = 575, DX = 500, UX = 1480, place = eight, open = soon(t, releaseAt + 0.05, 0.6), released = { t, at: releaseAt + 0.05 };
  box(DX - 80, RY - 50, 160, 100, { stroke: P.ink, width: 2, alpha: place, radius: 6 });
  path(
    series(priceAt, X0, X1, 12).map(([x, v]) => [
      DX - 64 + (x - X0) / (X1 - X0) * 128,
      RY + (v - 552) * 0.28
    ]),
    { color: P.ink, width: 2, alpha: place }
  );
  nameText(L("历史价格", "Historical prices"), DX, RY + 50 + NAME_GAP, {
    valign: "top",
    width: 300,
    alpha: place * SECOND
  });
  line(GX, 330, GX, RY - 60, { color: P.authority, width: 5, alpha: place });
  line(GX, RY + 60, GX, 810, { color: P.authority, width: 5, alpha: place });
  line(GX, mix(RY - 60, RY - 60, open), GX, mix(RY + 60, RY - 60, open), {
    color: P.authority,
    width: 5,
    alpha: place * (1 - open)
  });
  nameText(L("准入", "Admission"), GX, 330 - NAME_GAP, {
    valign: "bottom",
    color: P.authority,
    alpha: eight * (en ? 1 : named(t, gateAt))
  });
  [0, 1, 2].forEach(
    (i) => check(GX + 40, 380 + i * 42, 22, {
      alpha: ramp(t, condAt - 0.1 + i * 0.15, 0.35) * eight,
      draw: { t, at: condAt - 0.1 + i * 0.15 }
    })
  );
  nameText(L("讲明的条件", "Stated conditions"), GX + 40 + 11 + NAME_GAP, 422, {
    align: "left",
    alpha: eight * named(t, condAt)
  });
  link(DX + 92, RY, GX - 12, RY, { alpha: place, end: false });
  link(GX + 12, RY, UX - 92, RY, {
    color: P.evidence,
    width: 2.5,
    alpha: eight,
    draw: released,
    flowing: since(t, releaseAt + 0.65)
  });
  box(UX - 80, RY - 45, 160, 90, {
    stroke: P.evidence,
    width: 2.5,
    alpha: eight * ramp(t, releaseAt + 0.3, 0.5),
    radius: 6
  });
  nameText(L("一项具体用途", "One specific use"), UX, RY + 50 + NAME_GAP, {
    valign: "top",
    color: P.evidence,
    alpha: eight * named(t, useAt)
  });
  ctx.restore();
}
function s11PeopleDecide(s, t, leadCut, nine) {
  const evAt = cueFrom(s, "证据", "evidence", leadCut), [riskAt, giveAt, ownerAt, accAt] = cues(s, [
    ["还没解决的风险", "open risks"],
    ["交给", "to the decision owner"],
    ["决策负责人", "decision owner"],
    ["验收人", "acceptor"]
  ]);
  const Y = 650, SZ = 1.8, LX = 550, OX = 1180, AX = 1460, under = Y + 15 * SZ * 1.55 + NAME_GAP;
  const PAD = 36, ownerName = L("决策负责人", "Decision owner"), accName = L("验收人", "Acceptor");
  const half = (v) => Math.max(
    15 * SZ * 1.55,
    ...wrapName(v, 240).map((line2) => measure(line2)).map((w) => w / 2)
  );
  const FT = Y - 15 * SZ * 2.15 - PAD, FB = under + blockHeight(Math.max(wrapName(ownerName, 240).length, wrapName(accName, 240).length)) + PAD;
  const r0 = OX + half(ownerName) + PAD, r1 = AX + half(accName) + PAD;
  const [bundle, owned] = L([198, 65], [193, 46]);
  ctx.save();
  ctx.translate(
    bundle - (bundle - owned) * glide(t, ownerAt - 0.1, bundle - owned) - (owned + 61) * glide(t, accAt - 0.1 - drawTime(r1 - r0, 0.4), owned + 61),
    0
  );
  const right = mix(r0, r1, pacedTo(t, accAt - 0.1, r1 - r0, 0.4)), fq = nine * 0.8 * ramp(t, ownerAt - 0.15, 0.4);
  box(OX - half(ownerName) - PAD, FT, right - OX + half(ownerName) + PAD, FB - FT, {
    stroke: P.authority,
    alpha: fq,
    radius: 18
  });
  [
    [LX, leadCut, L("任务负责人", "Task lead")],
    [OX, ownerAt, ownerName],
    [AX, accAt, accName]
  ].forEach(([x, at, v]) => {
    person(x, Y, { color: P.authority, size: SZ, alpha: nine * ramp(t, at - 0.15, 0.3) });
    nameText(v, x, under, { valign: "top", width: 240, alpha: nine * named(t, at) });
  });
  const bx = LX + 90, BYT = Y - 230, ev = ramp(t, evAt - 0.15, 0.4) * nine;
  [0, 1, 2].forEach((i) => {
    const x = bx + i * 120, y = BYT + 14;
    box(x, y, 104, 64, { fill: P.ground, stroke: P.evidence, width: 2, alpha: ev, radius: 4 });
    path(
      series(priceAt, X0, DEC[i]).map(([u, v]) => [
        x + 10 + (u - X0) / (X1 - X0) * 84,
        y + 32 + (v - 552) * 0.14
      ]),
      { color: P.evidence, width: 1.5, alpha: ev }
    );
  });
  diamond(bx + 372, BYT + 46, 12, {
    color: P.unknown,
    alpha: ramp(t, riskAt - 0.15, 0.4) * nine,
    solid: true
  });
  growName(
    t,
    en ? ["Evidence", " and open risks"] : ["证据", "和还没解决的风险"],
    [evAt, riskAt],
    bx,
    BYT - NAME_GAP,
    { valign: "bottom", alpha: nine }
  );
  const go = soon(t, giveAt - 0.05, 0.8), wy = BYT + 46;
  link(bx + 396, wy, OX, FT - 10, {
    route: "hv",
    color: P.authority,
    alpha: nine,
    upto: go,
    width: 2.5,
    flowing: since(t, giveAt + 0.75)
  });
  ctx.restore();
}

// picture/film/scenes/p11/availability.js
function s11Correction(s, t, yv, py, lift, corr, todayS, head, drawFor, draw, chartDx, one) {
  ctx.save();
  ctx.translate(chartDx, 0);
  nameText(L("虚构的例子", "Illustrative case"), X0, L(216, 190), {
    align: "left",
    valign: "bottom",
    alpha: one * named(t, cue(s, "看一个虚构的例子", "here is an illustrative case"))
  });
  const hx = mix(X0, X1, draw), today = one * ramp(t, head + 0.05 + drawFor - 0.15, 0.3);
  dot(hx, py(hx), 6, { color: P.ink, alpha: today });
  text(priceLabel(hx), hx + 16, py(hx), 26, { role: "mark", color: P.ink, alpha: today });
  path(lift(corrected, CORR[0] - 20, CORR[1] + 20), {
    color: P.ink,
    width: 2.5,
    alpha: one * mix(1, 0.45, ramp(t, todayS, 0.6)),
    draw: { t, at: corr }
  });
  const top = (a, b) => Math.min(...series(corrected, a, b, DAY / 2).map(([, v]) => yv(v)));
  const over = Math.min(top(470, 650), top(690, 1070)) - NAME_GAP;
  nameText(L("供应商修正", "Vendor corrects"), 560, over, {
    valign: "bottom",
    alpha: one * named(t, corr)
  });
  rejectedName(L("今天修正过的数据", "Corrected series"), 880, over, {
    valign: "bottom",
    alpha: one * named(t, todayS),
    mark: ramp(t, todayS + 0.4, 0.4)
  });
  ctx.restore();
}
function s11Availability(s, t, AY, chartDx, two) {
  ctx.save();
  ctx.translate(chartDx, 0);
  const FY = L(140, 176), FW = 180, FH = 96;
  const [whenAt, claimAt, snapNameAt, snapAt, recordAt, limitAt, exploreAt] = cues(s, [
    ["最早什么时候能拿到", "when each value first"],
    ["回测只用了", "used only what"],
    ["当时存下的快照", "earlier snapshots"],
    ["快照", "snapshots"],
    ["修正记录", "correction history"],
    ["讲明可用时间", "timing is unproven"],
    ["授权内的探索", "authorized exploration"]
  ]);
  const becameAt = cue(s, "最早什么时候能拿到", "first became");
  DEC.forEach((c, i) => {
    const found = snapAt - 0.1 + i * 0.25, fill2 = ramp(t, found, 0.5) * two, slotAt = becameAt - 0.1 + i * 0.25;
    path(
      [
        [c - FW / 2, FY],
        [c + FW / 2, FY],
        [c + FW / 2, FY + FH],
        [c - FW / 2, FY + FH],
        [c - FW / 2, FY]
      ],
      {
        color: P.unknown,
        dash: [6, 6],
        width: 2,
        alpha: two * (1 - ramp(t, found, 0.5)),
        draw: { t, at: slotAt }
      }
    );
    text("?", c, FY + FH / 2, 26, {
      role: "mark",
      align: "center",
      color: P.unknown,
      alpha: two * ramp(t, slotAt, 0.3) * (1 - ramp(t, found - 0.25, 0.25))
    });
    box(c - FW / 2, FY, FW, FH, { stroke: P.evidence, width: 2, alpha: fill2, radius: 6 });
    const mx = (x) => c - FW / 2 + 12 + (x - X0) / (X1 - X0) * (FW - 24), my = (v) => FY + FH / 2 + (v - 552) * 0.3;
    path(
      series(priceAt, X0, c).map(([x, v]) => [mx(x), my(v)]),
      { color: P.evidence, width: 2, alpha: two, draw: { t, at: found } }
    );
    line(mx(c), FY + 10, mx(c), FY + FH - 10, { color: P.authority, width: 2, alpha: fill2 });
  });
  if (en)
    nameText("When each value first became available", DEC[1], FY - NAME_GAP, {
      valign: "bottom",
      alpha: two * named(t, whenAt)
    });
  else {
    const widest = (lines) => Math.max(...lines.map((v) => measure(v))), when = wrapName("最早什么时候能拿到", 340);
    const margin = Math.min(
      X0 - NAME_GAP - widest(wrapName("历史价格", 180)),
      DEC[0] - FW / 2 - NAME_GAP - widest(when)
    );
    nameText(when, margin + widest(when), FY + FH / 2, {
      align: "right",
      alpha: two * named(t, whenAt)
    });
  }
  nameText(L("当时存下的快照", "Earlier snapshots"), DEC[1], FY + FH + NAME_GAP, {
    valign: "top",
    color: P.evidence,
    alpha: two * named(t, snapNameAt)
  });
  const rec = ramp(t, recordAt - 0.15, 0.4) * two;
  documentIcon(CORR_DATE - 38, FY + 6, 76, FH - 12, { alpha: rec, rows: 3 });
  nameText(L("修正记录", "Correction history"), CORR_DATE, FY + FH + NAME_GAP, {
    valign: "top",
    alpha: two * named(t, recordAt)
  });
  const low = AY + 14 + NAME_GAP;
  const refusal = rejectedName(
    L("回测只用了当时的信息", "Used only what was available then"),
    DEC[0],
    low,
    {
      align: "left",
      valign: "top",
      alpha: two * named(t, claimAt),
      mark: ramp(t, claimAt + 0.4, 0.4)
    }
  );
  const term = [L("授权内的探索可以继续", "Authorized exploration may continue")], qual = [L("讲明可用时间还没证实", "timing is unproven")];
  const beside = refusal.right + 64 + 42, fits = beside + measure(term[0]) + TERM_GAP + measure(qual[0], NOTE) <= X1;
  const ex = fits ? beside : DEC[0], ey = fits ? low : low + 48;
  check(ex - 30, ey + labelSize(LABEL) / 2, 24, {
    alpha: ramp(t, exploreAt - 0.15, 0.4) * two,
    draw: { t, at: exploreAt - 0.1 }
  });
  termRow(t, term, [exploreAt], qual, [limitAt], ex, ey, { width: X1 - ex, alpha: two });
  ctx.restore();
}
function s11RepairedValue(s, t, AY, yv, py, afterCut, chartDx, three) {
  ctx.save();
  ctx.translate(chartDx, 0);
  const [lateAt, neverAt, replaceAt, rerunAt] = cues(s, [
    ["决策之后", "became available only"],
    ["不可能用到它", "could never have used"],
    ["换掉", "replace or exclude"],
    ["再跑一遍", "rerun the test"]
  ]);
  const vx = 900, top = yv(corrected(vx)), dx = DEC[2], low = AY + 14 + NAME_GAP;
  const valueAt = cueFrom(s, "某个值", "a value", afterCut);
  const vq = ramp(t, valueAt - 0.15, 0.4) * three, gone = soon(t, replaceAt + 0.05, 0.5);
  ring(vx, top, 14, { color: P.unknown, alpha: vq * (1 - gone), width: 2.5 });
  dot(vx, top, 6, { color: P.unknown, alpha: vq * (1 - gone) });
  nameText(L("某个值", "A value"), vx - 14 - NAME_GAP, top, {
    align: "right",
    alpha: three * named(t, valueAt) * (1 - gone)
  });
  const late = ramp(t, lateAt - 0.1, 0.4) * three;
  dashed(vx, top + 18, vx, AY - 6, {
    color: P.unknown,
    alpha: late * restMark(P.unknown, 0.6) * (1 - gone)
  });
  line(CORR_DATE, AY - 18, CORR_DATE, AY + 18, { color: P.unknown, width: 4, alpha: late });
  nameText(L("决策之后才拿得到", "Available only after the decision"), CORR_DATE, low, {
    valign: "top",
    width: 300,
    alpha: three * named(t, lateAt)
  });
  link(vx + 6, AY - 4, CORR_DATE - 8, AY - 4, {
    color: P.unknown,
    alpha: late * restMark(P.unknown, 0.8) * (1 - gone),
    upto: drawShare(t, lateAt - 0.05, Math.abs(CORR_DATE - 8 - (vx + 6)), 0.5),
    dash: [6, 8],
    end: false
  });
  const barY = top + 80;
  link(vx + 16, top, dx, barY, {
    route: "hv",
    color: P.unknown,
    alpha: ramp(t, neverAt - 0.05, 0.3) * three * (1 - gone),
    draw: { t, at: neverAt - 0.05 },
    end: false
  });
  line(dx - 18, barY, dx + 18, barY, {
    color: P.unknown,
    width: 4,
    alpha: ramp(t, neverAt + 0.45, 0.3) * three * (1 - gone)
  });
  nameText(L("不可能用到它", "Could never have used it"), dx + NAME_GAP, top, {
    align: "left",
    alpha: three * named(t, neverAt) * (1 - gone)
  });
  ring(dx, py(dx), 16, {
    color: P.evidence,
    alpha: three * ramp(t, replaceAt + 0.05, 0.4),
    width: 2.5
  });
  growName(
    t,
    en ? ["Replace or exclude", ", and rerun"] : ["换掉或剔除", "，再跑一遍"],
    [replaceAt, rerunAt],
    DEC[0],
    low,
    { width: 520, alpha: three }
  );
  const sweep = clamp(
    (voiceTime(t) - voiceTime(rerunAt + 0.05)) / Math.max(1.1, (DEC[2] + 20 - X0) / GLIDE_PEAK)
  ), sx = mix(X0, DEC[2] + 20, sweep);
  if (sweep > 0 && sweep < 1)
    line(sx, 250, sx, 700, {
      color: P.evidence,
      width: 3,
      alpha: three * clamp(sweep / 0.2) * clamp((1 - sweep) / 0.2)
    });
  DEC.forEach((x) => {
    const p = clamp((sx - x) / 120);
    if (sweep > 0 && p > 0 && p < 1)
      ring(x, AY, 10 + 16 * p, {
        color: P.authority,
        alpha: three * (1 - p) * clamp(p / 0.5),
        width: 2
      });
  });
  ctx.restore();
}

// picture/film/scenes/p11/delegation.js
function s11Delegation(s, t, agentCut, seven) {
  const [no, refused] = cues(s, [
    ["这份数据能不能用", "cannot grant admission"],
    ["它定不了", "cannot grant admission"]
  ]);
  const alone = L(100, 200), shift = alone - (alone + 120) * glide(t, no + 0.05, alone + 120);
  ctx.save();
  ctx.translate(shift, 0);
  const ats = [
    ...cues(s, [
      ["找快照", "locate snapshots"],
      ["比对修正前后的值", "compare revisions"]
    ]),
    cueFrom(s, "用当时的数据重跑", "rerun the test", agentCut)
  ];
  const mx = (x) => 440 + (x - X0) * 0.48, my = (v) => 380 + (v - 552) * 0.75, mini = (fn, a, b) => series(fn, a, b).map(([x, v]) => [mx(x), my(v)]);
  const seriesName = wrapName(L("历史价格", "Historical prices"), L(150, 300)), names = en ? ["Locate snapshots", "Compare revisions", "Rerun the test"] : ["找快照", "比对修正前后的值", "用当时的数据重跑"];
  const ROWS = 508 + NAME_GAP + labelSize(LABEL) + 2 * NAME_GAP + labelSize(LABEL) / 2, STEP = 58, PAD = NAME_GAP;
  const AGY = ROWS + 2 * STEP - 34 - NAME_GAP - labelSize(LABEL) / 2;
  const inner = [
    mx(X0),
    262 - 24,
    Math.max(
      mx(X1) + (en ? 0 : NAME_GAP + Math.max(...seriesName.map((v) => measure(v)))),
      ...names.map((v) => 640 + 10 + NAME_GAP + measure(v))
    ),
    Math.max(AGY + 34 + NAME_GAP + labelSize(LABEL), ROWS + 2 * STEP + labelSize(LABEL) / 2)
  ];
  const F = {
    x: inner[0] - PAD,
    y: inner[1] - PAD - 5,
    w: inner[2] - inner[0] + 2 * PAD,
    h: inner[3] - inner[1] + 2 * PAD + 5
  }, place = seven;
  box(F.x, F.y, F.w, F.h, { stroke: P.evidence, alpha: place, radius: 16 });
  nameText(L("委托范围", "Within its delegation"), F.x, F.y - NAME_GAP, {
    align: "left",
    valign: "bottom",
    color: P.evidence,
    alpha: seven * named(t, agentCut)
  });
  line(mx(X0), 500, mx(X1), 500, { color: P.line, width: 2, alpha: place });
  path(mini(priceAt), { color: P.ink, width: 2, alpha: place });
  if (en)
    nameText(seriesName, mx(X1), 508 + NAME_GAP, {
      align: "right",
      valign: "top",
      alpha: place * SECOND
    });
  else
    nameText(seriesName, mx(X1) + NAME_GAP, my(priceAt(X1)), {
      align: "left",
      alpha: place * SECOND
    });
  line(mx(DEC[0]), 508, mx(DEC[2]), 508, { color: P.authority, width: 2, alpha: place });
  nameText(L("决策", "Decisions"), mx(DEC[1]), 508 + NAME_GAP, {
    valign: "top",
    color: P.authority,
    alpha: place * SECOND
  });
  DEC.forEach((x, i) => {
    line(mx(x), 508, mx(x), my(priceAt(x)) + 8, { color: P.authority, width: 2, alpha: place });
    const sx2 = mx(x);
    box(sx2 - 34, 262 - 24, 68, 40, {
      stroke: P.evidence,
      width: 2,
      alpha: seven * ramp(t, ats[0] - 0.1 + i * 0.2, 0.25),
      radius: 4
    });
    path(
      series(priceAt, X0, x).map(([u, v]) => [
        sx2 - 28 + (u - X0) / (X1 - X0) * 56,
        258 + (v - 552) * 0.12
      ]),
      { color: P.evidence, width: 1.5, alpha: seven, draw: { t, at: ats[0] - 0.1 + i * 0.2 } }
    );
  });
  path(mini(corrected, CORR[0] - 20, CORR[1] + 20), {
    color: P.evidence,
    width: 3.5,
    alpha: seven,
    draw: { t, at: ats[1] - 0.05 }
  });
  const sweep = clamp((voiceTime(t) - voiceTime(ats[2] + 0.05)) / 1.2), sx = mix(mx(X0), mx(X1), sweep);
  if (sweep > 0 && sweep < 1)
    line(sx, 300, sx, 494, {
      color: P.evidence,
      width: 3,
      alpha: seven * clamp(sweep / 0.2) * clamp((1 - sweep) / 0.2)
    });
  const agentAt = cueFrom(s, "智能体", "agent", agentCut);
  agent(520, AGY, { alpha: seven * named(t, agentAt), size: 1.1 });
  nameText(L("智能体", "Agent"), 520, AGY + 34 + NAME_GAP, {
    valign: "top",
    color: P.evidence,
    alpha: seven * named(t, agentAt)
  });
  ats.forEach((at, i) => {
    const y = ROWS + i * STEP, lit = speaking(t, ats, i);
    dot(640, y, 6 + 2 * lit, { color: P.evidence, alpha: seven * ramp(t, at - 0.1, 0.25) });
    nameText(names[i], 640 + 10 + NAME_GAP, y, {
      align: "left",
      alpha: seven * listIn(t, ats, i),
      set: "agent tasks"
    });
  });
  const share = (alone - shift) / (alone + 120), hold = en ? shift + 30 + 90 * smoother(share) : 120 + shift;
  const gx = 1660 - hold, gq = ramp(t, no - 0.15, 0.4) * seven, mid = F.y + F.h / 2;
  line(gx, mid - 150, gx, mid + 150, { color: P.authority, width: 5, alpha: gq });
  nameText(L("能不能用", "Admission"), gx, mid - 150 - NAME_GAP, {
    valign: "bottom",
    color: P.authority,
    alpha: seven * named(t, no)
  });
  const wayFrom = F.x + F.w + 12, stopX = 1470 - hold;
  link(wayFrom, mid, gx - 24, mid, {
    color: P.unknown,
    alpha: ramp(t, refused - 0.15, 0.4) * seven,
    upto: (stopX + 11 - wayFrom) / (gx - 24 - wayFrom) * drawShare(t, refused - 0.05, stopX + 11 - wayFrom, 0.6),
    dash: [8, 8],
    end: false
  });
  const barAt = Math.min(refused + 0.45, thoughtEnd(refused) - 0.35);
  line(stopX, mid - 30, stopX, mid + 30, {
    color: P.unknown,
    width: 4,
    alpha: ramp(t, barAt, 0.3) * seven
  });
  rejectedName(L("它定不了", "Grant admission"), stopX, mid + 30 + NAME_GAP, {
    valign: "top",
    alpha: seven * named(t, refused),
    mark: ramp(t, barAt, 0.3)
  });
  ctx.restore();
}

// picture/film/scenes/p11/gaps.js
function s11Bias(s, t, biasCut, four) {
  const ats = cues(s, [
    ["样本选择", "sample selection"],
    ["证券代码和公司", "changed tickers"],
    ["交易日历", "trading calendar"],
    ["幸存者偏差", "keeping only today's survivors"]
  ]);
  const sx = L(50, 40), RX = 560 + sx, GX = 1220 + sx, NX = 1290 + sx, ROW = 125, R0 = 335, END = RX + 340;
  const SA = [R0 - 35, R0 + 35], TK = R0 + ROW, CAL = R0 + 2 * ROW, SV = [R0 + 3 * ROW - 35, R0 + 3 * ROW + 35];
  ctx.save();
  ctx.translate(L(110, 70) * (1 - glide(t, ats[1] + 0.05, L(110, 70))), 0);
  const lens = four * named(t, biasCut), on = (i) => ramp(t, ats[i] - (i ? 0.25 : L(0.5, 0.45)), 0.4) * four, lit = (i) => speaking(t, ats, i);
  const lastWhole = ramp(t, ats[3] + 0.05, 0.4), level = (i) => Math.max(listLevel(t, ats, i), lastWhole);
  const dropAt = cueFrom(s, "偏差", "today's", ats[3]), dropped = ramp(t, dropAt + 0.05, 0.35);
  const ends = [SA[1], TK, CAL + 4, SV[1]].map((y) => y + 22);
  const bottom = ends.slice(1).reduce((y, end, i) => mix(y, end, ramp(t, ats[i + 1] - 0.25, 0.4)), ends[0]);
  path(
    [
      [RX - 26, SA[0] - 22],
      [RX - 40, SA[0] - 22],
      [RX - 40, bottom],
      [RX - 26, bottom]
    ],
    { color: P.line, alpha: on(0), width: 2 }
  );
  const LY = 405, LX = RX - L(220, 240);
  ring(LX, LY, 44, { color: P.ink, alpha: lens, width: 4 });
  line(LX + 31, LY + 31, LX + 62, LY + 62, { color: P.ink, alpha: lens, width: 6 });
  nameText(L("偏差可能藏在别处", "Bias may hide elsewhere"), LX, LY + 62 + NAME_GAP, {
    valign: "top",
    width: L(280, 340),
    alpha: lens
  });
  box(RX - 24, SA[0] - 34, GX - RX + 48, SA[1] - SA[0] + 68, {
    stroke: P.evidence,
    width: 2 + lit(0),
    alpha: on(0),
    radius: 12
  });
  SA.forEach((y) => line(RX, y, GX, y, { color: P.ink, width: 3, alpha: on(0) }));
  line(RX, TK, RX + 310, TK, { color: P.ink, width: 3, alpha: on(1) });
  line(RX + 330, TK, GX, TK, { color: P.ink, width: 3, alpha: on(1) });
  text("ID A1", RX + 155, TK + 30, 26, {
    role: "mark",
    align: "center",
    color: P.muted,
    alpha: on(1)
  });
  text("ID B7", RX + 555, TK + 30, 26, {
    role: "mark",
    align: "center",
    color: P.authority,
    alpha: on(1)
  });
  ring(RX + 320, TK, 10 + 4 * lit(1), { color: P.authority, alpha: on(1), width: 2.5 });
  for (let k = 0; RX + k * 46 + 36 <= GX; k++) {
    const x = RX + k * 46;
    box(x, CAL - 24, 36, 48, {
      stroke: blend(P.line, P.muted, 0.3),
      width: 2,
      alpha: four * ramp(t, ats[2] - 0.1 + k * 0.02, 0.3),
      radius: 4
    });
    if (k === 10) {
      box(x, CAL - 24, 36, 48, { stroke: P.unknown, width: 2 + lit(2), alpha: on(2), radius: 4 });
      cross(x + 18, CAL, 22, { alpha: on(2), width: 3 });
    }
  }
  line(RX, SV[0], GX, SV[0], { color: P.ink, width: 3, alpha: on(3) });
  line(RX, SV[1], END, SV[1], {
    color: P.line,
    width: 3.5,
    alpha: on(3),
    dash: dropped > 0 ? [20 - 10 * dropped, 10 * dropped] : null
  });
  line(END, SV[1] - 18, END, SV[1] + 18, { color: P.line, width: 4, alpha: on(3) });
  cross(END + 30, SV[1], 24, {
    alpha: four * ramp(t, dropAt - 0.1, 0.3),
    width: 3 + 1.5 * lit(3)
  });
  const names = en ? [
    "Sample selection",
    "Changed tickers or issuers",
    "The trading calendar",
    "Only today's survivors"
  ] : ["样本选择", "证券代码和公司的变更", "交易日历", "幸存者偏差"];
  [(SA[0] + SA[1]) / 2, TK, CAL, (SV[0] + SV[1]) / 2].forEach(
    (y, i) => nameText(names[i], NX, y, {
      align: "left",
      width: 470,
      alpha: four * ramp(t, ats[i] - 0.15, 0.4) * level(i),
      set: "bias"
    })
  );
  ctx.restore();
}
function s11Gaps(s, t, AY, py, missingCut, chartDx, five) {
  ctx.save();
  ctx.translate(chartDx, 0);
  const ats = cues(s, [
    ["缺失", "missing"],
    ["延迟", "late"],
    ["冲突", "conflicting"],
    ["异常", "anomalous"]
  ]);
  const changesAt = cue(s, "影响结论", "affects the conclusion");
  const concAt = cueFrom(s, "结论", "conclusion", missingCut), xs = [925, 1140, 1360, 1570], BAR = 230, mark = (i) => ramp(t, ats[i] - 0.1, 0.4) * five;
  box(xs[0] - 34, py(xs[0]) - 60, 68, 120, { fill: P.ground, alpha: mark(0) });
  dashed(xs[0] - 34, py(xs[0] - 34), xs[0] + 34, py(xs[0] + 34), {
    color: P.unknown,
    alpha: mark(0)
  });
  dot(xs[1], py(xs[1]), 7, { color: P.unknown, alpha: mark(1) });
  clock(xs[1], py(xs[1]) - 34, 18, { hand: 0.32, color: P.unknown, alpha: mark(1) });
  dot(xs[2], py(xs[2]), 7, { color: P.unknown, alpha: mark(2) });
  dot(xs[2], py(xs[2]) - 56, 8, { color: P.unknown, alpha: mark(2), hollow: true, width: 2.5 });
  dashed(xs[2], py(xs[2]) - 46, xs[2], py(xs[2]) - 10, { color: P.unknown, alpha: mark(2) });
  path(
    [
      [xs[3] - 16, py(xs[3] - 16)],
      [xs[3], py(xs[3]) - 58],
      [xs[3] + 16, py(xs[3] + 16)]
    ],
    { color: P.unknown, alpha: mark(3), width: 2.5 }
  );
  dot(xs[3], py(xs[3]) - 58, 7, { color: P.unknown, alpha: mark(3) });
  xs.forEach((x, i) => {
    if (speaking(t, ats, i) > 0)
      ring(x, py(x), 16, {
        color: P.unknown,
        alpha: five * speaking(t, ats, i) * restMark(P.unknown, 0.6),
        width: 2
      });
  });
  railNames(
    en ? ["Missing", "Late", "Conflicting", "Anomalous"] : ["缺失", "延迟", "冲突", "异常"],
    xs,
    AY,
    { alpha: (i) => five * listIn(t, ats, i), set: "gaps" }
  );
  const claim = ramp(t, concAt - 0.15, 0.4) * five, a1 = X1;
  box(X0, BAR - 3, a1 - X0, 6, { fill: P.ink, alpha: claim, radius: 0 });
  line(X0, BAR - 14, X0, BAR + 14, { color: P.ink, width: 3, alpha: claim });
  line(a1, BAR - 14, a1, BAR + 14, { color: P.ink, width: 3, alpha: claim });
  const concName = L("结论", "Conclusion"), concY = BAR - 30 - NAME_GAP - labelSize(LABEL);
  growName(t, [concName], [concAt], X0, concY, { alpha: five });
  xs.forEach(
    (x, i) => link(x, py(x) - [66, 56, 76, 76][i], x, BAR + 18, {
      alpha: five,
      draw: { t, at: changesAt - 0.05 + i * 0.15 }
    })
  );
  ctx.restore();
}
function s11Feed(s, t, AY, py, feedCut, chartDx, six) {
  ctx.save();
  ctx.translate(chartDx, 0);
  const proveAt = cue(s, "说明不了", "cannot prove");
  const whenAt = cueFrom(s, "当时能不能拿到", "available then", feedCut), fy = py(X1), WY = AY + 54, stop = 1222, FX = 1800 - chartDx;
  link(FX, fy, X1 + 14, fy, {
    color: P.evidence,
    width: 3,
    alpha: ramp(t, feedCut - 0.1, 0.5) * six,
    flowing: since(t, feedCut - 0.1)
  });
  nameText(L("今天的数据再准", "Today's accurate feed"), FX, fy - 28, {
    align: "right",
    valign: "bottom",
    width: 300,
    color: P.evidence,
    alpha: six * named(t, feedCut)
  });
  const back = ramp(t, proveAt - 0.05, 0.3) * six;
  link(L(1700, 1652), fy + 24, 1060, WY, {
    route: "vh",
    alpha: back,
    upto: 0.8,
    draw: { t, at: proveAt - 0.05 },
    end: false
  });
  line(stop, WY - 18, stop, WY + 18, {
    color: P.unknown,
    width: 4,
    alpha: ramp(t, proveAt + 0.75, 0.3) * six
  });
  nameText(
    L("说明不了", "Cannot prove what was available then"),
    L(DEC[0] - 40, DEC[2] + 16),
    L(WY, WY + 44),
    { align: L("right", "left"), width: L(320, 640), alpha: six * named(t, proveAt) }
  );
  DEC.forEach(
    (x, i) => text("?", x, WY, 26, {
      role: "mark",
      align: "center",
      color: P.unknown,
      alpha: ramp(t, whenAt - 0.1 + i * 0.15, 0.4) * six
    })
  );
  ctx.restore();
}

// picture/film/scenes/p11/scene.js
scenes["11"] = function(s, t) {
  const SY = 1.6, AY = 800, yv = (v) => CONTENT_CY + (v - 552) * SY, py = (x) => yv(priceAt(x));
  const lift = (fn, a, b) => series(fn, a, b, DAY / 2).map(([x, v]) => [x, yv(v)]);
  const [ill, corr, decAt, eachAt, thenV, todayS] = cues(s, [
    ["虚构", "illustrative"],
    ["修正了", "corrects"],
    ["修正之前的每次决策", "simulating decisions"],
    ["每次决策时拿得到的值", "each decision time"],
    ["拿得到的值", "values available at each decision"],
    ["今天修正过的数据", "today's corrected series"]
  ]);
  const [unknownCut, afterCut, biasCut, missingCut, feedCut, agentCut, leadCut] = cues(s, [
    ["不知道每个值", "without knowing when"],
    ["如果查明", "if a value became"],
    ["偏差", "bias"],
    ["缺失", "say how missing"],
    ["今天的数据", "today's accurate feed"],
    ["在委托范围内", "within its delegation"],
    ["任务负责人", "the task lead"]
  ]);
  const admitCut = cue(s, "这就叫准入", "Admission is permission");
  illustrative(ramp(t, ill - 0.2, 0.6));
  const head = s.words[0].start, drawFor = Math.min(1, voiceTime(thoughtEnd(head) - 0.1) - voiceTime(head + 0.05));
  const latest = DRAW_PACE * drawFor / 1.5, history = lengthOf(lift(priceAt));
  const standing = clamp(1 - latest / history), draw = mix(standing, 1, drawShare(t, head + 0.05, (1 - standing) * history, drawFor));
  const plot = (q, { level = SECOND, decisions = true, values = true } = {}) => {
    if (q <= 0) return;
    const nq = (at) => q * level * named(t, at);
    const seriesAt = cue(s, "历史价格", "historical prices") + 0.05;
    const points = lift(priceAt), top = Math.min(...points.map(([, y]) => y)) - 24;
    line(X0, AY, X0, top, { color: P.line, width: 2, alpha: q });
    line(X0, AY, X1, AY, { color: P.line, width: 2, alpha: q });
    for (let x = X0 + 50; x < X1; x += 100)
      if (DEC.every((d) => Math.abs(d - x) > 30))
        line(x, AY, x, AY + 10, { color: P.line, width: 2, alpha: q });
    path(points, { color: P.ink, width: 2.5, alpha: q, upto: draw });
    nameText(L("历史价格", "Historical prices"), X0 - NAME_GAP, py(X0), {
      align: "right",
      width: L(180, 300),
      alpha: q * level * ramp(t, seriesAt, 0.4)
    });
    if (decisions) {
      stroke(
        () => DEC.forEach((x, i) => {
          const up = drawShare(t, decAt - 0.1 + i * 0.25, AY + 2 - py(x));
          if (up > 0) {
            ctx.moveTo(x, AY + 14);
            ctx.lineTo(x, mix(AY + 14, py(x) + 12, up));
          }
        }),
        { color: P.authority, width: 2, alpha: ramp(t, decAt - 0.1, 0.5) * q }
      );
      DEC.forEach((x, i) => {
        const a = ramp(t, decAt - 0.1 + i * 0.25, 0.5) * q, p = clamp((t - eachAt - i * 0.3) / 0.7);
        dot(x, AY, 6, { color: P.authority, alpha: a });
        if (p > 0 && p < 1)
          ring(x, AY, 8 + 16 * p, {
            color: P.authority,
            alpha: a * (1 - p) * ease(p / 0.5),
            width: 2
          });
      });
      line(DEC[0], AY + 14, DEC[2], AY + 14, {
        color: P.authority,
        width: 2,
        alpha: q * ramp(t, decAt + 0.5, 0.5)
      });
      nameText(L("决策", "Decisions"), DEC[0] - 40, AY - 16, {
        align: "right",
        valign: "bottom",
        color: P.authority,
        alpha: nq(decAt)
      });
    }
    if (values) {
      const thenQ = ramp(t, thenV - 0.1, 0.6);
      if (thenQ > 0)
        path(lift(priceAt, X0, DEC[2]), { color: P.evidence, width: 3.5, alpha: q * thenQ });
      DEC.forEach(
        (x, i) => dot(x, py(x), 7, { color: P.evidence, alpha: q * ramp(t, thenV - 0.1 + i * 0.2, 0.35) })
      );
      nameText(
        L("每次决策时拿得到的值", "Values available at each decision time"),
        DEC[2] + 26,
        py(DEC[2]) - 30,
        { align: "left", valign: "bottom", width: 500, color: P.evidence, alpha: nq(thenV) }
      );
    }
  };
  const chartDx = en ? 110 * soon(t, corr + 0.05, 0.7) : 76 * soon(t, cue(s, "历史价格", "historical prices") + 0.05, 0.7) * (1 - soon(t, feedCut + STAGE_CUT, 0.7));
  ctx.save();
  ctx.translate(chartDx, 0);
  plot(stageOut(t, biasCut), { level: mix(1, SECOND, ramp(t, unknownCut + STAGE_CUT, 0.4)) });
  plot(stageIn(t, missingCut) * stageOut(t, feedCut), { decisions: false, values: false });
  plot(stageIn(t, feedCut) * stageOut(t, agentCut), { values: false });
  ctx.restore();
  const one = stageOut(t, unknownCut);
  if (one > 0) s11Correction(s, t, yv, py, lift, corr, todayS, head, drawFor, draw, chartDx, one);
  const two = stageIn(t, unknownCut) * stageOut(t, afterCut);
  if (two > 0) s11Availability(s, t, AY, chartDx, two);
  const three = stageIn(t, afterCut) * stageOut(t, biasCut);
  if (three > 0) s11RepairedValue(s, t, AY, yv, py, afterCut, chartDx, three);
  const four = stageIn(t, biasCut) * stageOut(t, missingCut);
  if (four > 0) s11Bias(s, t, biasCut, four);
  const five = stageIn(t, missingCut) * stageOut(t, feedCut);
  if (five > 0) s11Gaps(s, t, AY, py, missingCut, chartDx, five);
  const six = stageIn(t, feedCut) * stageOut(t, agentCut);
  if (six > 0) s11Feed(s, t, AY, py, feedCut, chartDx, six);
  const seven = stageIn(t, agentCut) * stageOut(t, admitCut);
  if (seven > 0) s11Delegation(s, t, agentCut, seven);
  const eight = stageIn(t, admitCut) * stageOut(t, leadCut);
  if (eight > 0) s11Admission(s, t, admitCut, eight);
  const nine = stageIn(t, leadCut);
  if (nine > 0) s11PeopleDecide(s, t, leadCut, nine);
};

// picture/film/scenes/p12/arc.js
function s12Arc(cx, cy, r, a0, a1) {
  const n = Math.max(2, Math.ceil(Math.abs(a1 - a0) / 0.04));
  for (let k = 0; k <= n; k++) {
    const a = a0 + (a1 - a0) * k / n;
    (k ? ctx.lineTo : ctx.moveTo).call(ctx, cx + r * Math.cos(a), cy + r * Math.sin(a));
  }
}

// picture/film/scenes/p12/conditions.js
function s12Conditions(s, t, together, conds, arc, one) {
  const cy = CONTENT_CY, R = 230, [dataAt, enterAt, systemAt] = cues(s, [
    ["数据要", "before data enters"],
    ["用在", "enters"],
    ["工作里", "lasting work system"]
  ]);
  const names = en ? [
    "Meaning explainable",
    "Source traceable",
    "Time identifiable",
    "Process reproducible",
    "Quality verifiable",
    "Operation observable",
    "Owner identifiable",
    "Use bounded"
  ] : ["含义", "来源", "时间", "过程能复现", "质量能核验", "运行看得见", "有负责人", "用途有边界"];
  const reach = Math.max(
    ...names.map(
      (v, i) => Math.cos(arc(i)[2]) > 0.3 ? Math.cos(arc(i)[2]) * (R + 18 + NAME_GAP) + measure(v) : 0
    )
  );
  const shift = 963 - (380 - 90 + 1120 + reach) / 2, cx = 1120 + shift, dx = 380 + shift;
  ctx.save();
  ctx.translate(en ? 80 * (1 - glide(t, conds[0] + 0.05, 80)) : 0, 0);
  ring(cx, cy, R, {
    color: P.line,
    alpha: one * named(t, systemAt),
    width: 3.5,
    start: Math.PI + 0.1,
    upto: 1 - 0.2 / (2 * Math.PI)
  });
  tableIcon(dx - 90, cy - 60, 180, 120, { alpha: one });
  const level = Math.min(
    cy + Math.sin(arc(6)[2]) * (R + 18 + NAME_GAP),
    cy - 60 - NAME_GAP - labelSize(LABEL) / 2
  );
  if (en) nameText("Data", dx, level, { alpha: one * named(t, dataAt) });
  link(dx + 102, cy, cx - R - 30, cy, { alpha: one, draw: { t, at: enterAt + 0.05 } });
  nameText(L(["数据要长期", "用在工作里"], "Lasting work system"), cx, cy, {
    width: 2 * R - 80,
    color: P.evidence,
    alpha: one * named(t, L(dataAt, systemAt))
  });
  ring(cx, cy, R + 18, {
    color: P.evidence,
    alpha: one * ramp(t, together + 0.05, 0.3),
    width: 2,
    draw: { t, at: together + 0.05 }
  });
  if (!en) {
    const titles = ["说得清", "对得上", "管得住"], opens = cues(
      s,
      titles.map((v) => [v, ""])
    ), at = [-Math.PI / 6, Math.PI / 2, Math.PI * 7 / 6];
    const edge = [0, 3, 5, 8].map((i) => -Math.PI / 2 + i * Math.PI / 4);
    titles.forEach((title, g) => {
      const am = at[g], lit = ramp(t, opens[g] - 0.1, 0.4);
      if (lit > 0)
        stroke(() => s12Arc(cx, cy, R + 18, edge[g], edge[g + 1]), {
          color: P.evidence,
          alpha: one * lit,
          width: 4
        });
      nameText(title, cx + Math.cos(am) * (R - 72), cy + Math.sin(am) * (R - 72), {
        color: P.evidence,
        alpha: one * named(t, opens[g]),
        set: "groups"
      });
    });
  }
  conds.forEach((at, i) => {
    const [a0, a1, am] = arc(i), q = ramp(t, at - 0.1, 0.4), lit = speaking(t, conds, i);
    stroke(() => s12Arc(cx, cy, R, a0, a1), {
      color: P.evidence,
      alpha: q * one,
      width: 10 + 4 * lit,
      cap: "butt"
    });
    radialName(names[i], cx, cy, R + 18, am, {
      width: 420,
      alpha: one * listIn(t, conds, i),
      set: "conditions"
    });
  });
  ctx.restore();
}
function s12Labels(s, t, conds, labels, arc, two) {
  const dx = L(30, 0), cx = 670 + dx, cy = CONTENT_CY, R = 150, gone = 7, sx = 1050 + dx, mx = 1110 + dx;
  const [labelAt, permitAt] = cues(s, [
    ["标成", "label the data"],
    ["和权限", "and permission"]
  ]);
  const [denyAt, assetAt] = cues(s, [
    ["不因此", "does not make"],
    ["完全合格的资产", "fully qualified asset"]
  ]);
  const rows = en ? [["Exploratory"], ["Temporary"], ["Limited use"], ["Awaiting verification"]] : [["探索"], ["临时"], ["有限使用"], ["待核验"]];
  const quals = [[], [], en ? ["own evidence", " and permission"] : ["自己的证据", "和权限"], []];
  const NX = mx + NAME_GAP + 8, blockW = (r) => Math.max(measure(rows[r].join("")), quals[r].length ? measure(quals[r].join(""), NOTE) : 0);
  const columnEnd = NX + Math.max(...rows.map((_, r) => blockW(r))), wx = NX + blockW(2) + 24, bx = wx + 80, rx = bx + 60;
  const assetName = L("完全合格的资产", "Fully qualified asset"), room = Math.max(0, (rx + 24 + NAME_GAP + measure(assetName) - columnEnd) / 2);
  const early = L(40, 60);
  ctx.save();
  ctx.translate(
    960 - cx - (960 - cx - early) * glide(t, labelAt + 0.05, 960 - cx - early) - early * glide(t, labels[2] - 0.1, early) - room * glide(t, denyAt + 0.05, room),
    0
  );
  const limitedAt = cueFrom(s, "有限使用也要", "a limited use needs", labels[2]);
  tableIcon(cx - 75, cy - 50, 150, 100, { alpha: two });
  conds.forEach((_, i) => {
    const [a0, a1] = arc(i);
    stroke(
      () => ctx.arc(cx, cy, R, a0, a1),
      i === gone ? { color: P.unknown, alpha: two, width: 6, cap: "butt", dash: [8, 8] } : { color: P.evidence, alpha: two, width: 10, cap: "butt" }
    );
  });
  const am = arc(gone)[2];
  text("?", cx + Math.cos(am) * (R + 34), cy + Math.sin(am) * (R + 34), 26, {
    role: "mark",
    align: "center",
    color: P.unknown,
    alpha: two
  });
  nameText(L("任何一条不满足", "If any condition is unmet"), cx, cy + R + 18 + NAME_GAP, {
    valign: "top",
    alpha: two
  });
  link(cx + R + 24, cy, sx, cy, {
    alpha: two,
    width: 3,
    draw: { t, at: labelAt + 0.05 },
    end: false
  });
  const width = 1780 - mx - NAME_GAP - 8, tops = stackTops(
    rows.map((term, r) => termRowLayout(term, quals[r], width, false).height),
    cy,
    60
  );
  rows.forEach((term, r) => {
    const my = tops[r] + labelSize(LABEL) / 2, q = ramp(t, labels[r] - 0.15, 0.4) * two, again = ramp(t, limitedAt - 0.15, 0.3);
    const lit = r === 2 ? Math.max(speaking(t, labels, r), again) : speaking(t, labels, r) * (r === 3 ? 1 - again : 1);
    link(sx, cy, mx - 16, my, {
      route: "vh",
      alpha: two,
      draw: { t, at: labels[r] - 0.15 },
      end: false
    });
    dot(mx, my, 11, { color: P.unknown, alpha: q });
    if (lit > 0)
      ring(mx, my, 17, {
        color: P.unknown,
        alpha: lit * restMark(P.unknown, 0.6) * two,
        width: 2
      });
    const level = r === 2 ? Math.max(listLevel(t, labels, r), again) : listLevel(t, labels, r);
    termRow(t, term, [labels[r]], quals[r], [limitedAt, permitAt], NX, tops[r], {
      width,
      inline: false,
      alpha: two * level,
      set: "labels"
    });
  });
  const ly = tops[2] + labelSize(LABEL) / 2;
  link(wx, ly, bx - 12, ly, { alpha: two, draw: { t, at: denyAt + 0.05 }, end: false });
  line(bx, ly - 36, bx, ly + 36, {
    color: P.unknown,
    alpha: ramp(t, denyAt + 0.45, 0.3) * two,
    width: 4
  });
  ring(rx, ly, 24, {
    color: P.muted,
    alpha: ramp(t, assetAt - 0.1, 0.4) * two,
    width: 2.5,
    dash: [6, 6]
  });
  nameText(assetName, rx + 24 + NAME_GAP, ly, {
    align: "left",
    color: P.muted,
    alpha: two * named(t, assetAt)
  });
  ctx.restore();
}

// picture/film/scenes/p12/use.js
function s12ControlledUse(t, path_, steps, forUse, ctrlAt, applyAt, three) {
  const cx = 960, cy = CONTENT_CY, R = 210, sx = L(420, 230), ux = L(1560, 1600), gap = 0.05;
  const names = en ? [
    "Worth evaluating",
    "What the data is",
    "Key findings reproducible",
    "Runs reliably",
    "Permitted for this use",
    "Feedback supports continuing"
  ] : ["值不值得评估", "数据是什么", "能不能复现", "能不能稳定运行", "能不能准入", "该不该继续"];
  path(
    [
      [sx - 60, cy + 10],
      [sx - 30, cy - 4],
      [sx, cy + 6],
      [sx + 30, cy - 18],
      [sx + 60, cy - 30]
    ],
    { color: P.authority, alpha: three, width: 3 }
  );
  const endY = L(cy + 50 + NAME_GAP, cy - 50 - NAME_GAP), endAlign = L("top", "bottom");
  nameText(L("有希望的信号", "Signal"), sx, endY, {
    valign: endAlign,
    width: 300,
    color: P.authority,
    alpha: three * named(t, path_)
  });
  link(sx + 84, cy, cx - R - 2, cy, {
    alpha: three,
    draw: { t, at: path_ + 0.05 },
    flowing: since(t, path_ + 0.65)
  });
  box(ux - 60, cy - 50, 120, 100, {
    stroke: P.authority,
    alpha: three * ramp(t, ctrlAt - 0.15, 0.4),
    radius: 12
  });
  check(ux, cy, 34, { color: P.authority, alpha: three * ramp(t, ctrlAt - 0.1, 0.4) });
  nameText(L("受控使用", "Controlled use"), ux, endY, {
    valign: endAlign,
    color: P.authority,
    alpha: three * named(t, ctrlAt)
  });
  link(cx + R + 2, cy, ux - 72, cy, { alpha: three, draw: { t, at: ctrlAt + 0.05 } });
  stroke(
    () => {
      ctx.arc(cx, cy, R, gap, Math.PI - gap);
      ctx.moveTo(cx + R * Math.cos(Math.PI + gap), cy + R * Math.sin(Math.PI + gap));
      ctx.arc(cx, cy, R, Math.PI + gap, 2 * Math.PI - gap);
    },
    { alpha: three * ramp(t, applyAt - 0.15, 0.4), width: 3.5 }
  );
  const use = ramp(t, forUse - 0.1, 0.4) * three;
  ring(cx, cy - 64, 22, { color: P.evidence, alpha: use, width: 2.5 });
  dot(cx, cy - 64, 8, { color: P.evidence, alpha: use });
  nameText(L("针对计划中的用途", "The intended use"), cx, cy, {
    color: P.evidence,
    alpha: three * named(t, forUse)
  });
  nameText(L("适用的问题", "The questions that apply"), cx, cy + 60, {
    alpha: three * named(t, applyAt)
  });
  steps.forEach((at, i) => {
    const a = -Math.PI / 2 + i * Math.PI / 3, x = cx + Math.cos(a) * R, y = cy + Math.sin(a) * R, lit = speaking(t, steps, i);
    const q = ramp(t, at - 0.1, 0.4) * three;
    dot(x, y, 12, { color: P.ground, alpha: q });
    dot(x, y, 12, { color: P.evidence, alpha: q });
    if (lit > 0)
      ring(x, y, 21, {
        color: P.evidence,
        alpha: lit * restMark(P.evidence, 0.5) * three,
        width: 2
      });
    const o = { width: 400, alpha: three * listIn(t, steps, i), set: "questions" }, side = Math.sign(Math.round(Math.cos(a) * 10));
    if (!side) radialName(names[i], cx, cy, R + 12, a, o);
    else
      nameText(names[i], x + side * (12 + NAME_GAP), y - labelSize(LABEL) / 2, {
        ...o,
        align: side > 0 ? "left" : "right",
        valign: "top"
      });
  });
}
function s12NotYet(t, rights, lefts, nots, rowAts, four) {
  const dx = L(0, 20), rx = 1380 + dx, bar = 960 + dx, MR = 24, PITCH = 96, pairs = en ? [
    ["A signal", "Production-ready"],
    ["Deployed", "Admitted"],
    [null, "For another use"]
  ] : [
    ["有信号", "能投产"],
    ["已经部署", "准入了"],
    [null, "别的用途"]
  ];
  const widest = (side) => Math.max(...pairs.filter((v) => v[side]).map((v) => measure(v[side]))), lx = Math.min(540 + dx, 1920 - rx - widest(1) + widest(0));
  const grown = [1, 2].reduce((sum, k) => sum + soon(t, rowAts[k] - 0.3, 0.35), 0), ys = rowAts.map((_, i) => 510 + PITCH * (i - grown / 2));
  line(bar, 510 - PITCH - 36, bar, 510 + PITCH + 36, {
    color: P.line,
    alpha: ramp(t, nots[0] + 0.45, 0.3) * four,
    width: 4
  });
  rowAts.forEach((at, i) => {
    const y = ys[i], deny = { t, at: nots[i] + 0.05 }, row = ramp(t, at - 0.1, 0.4) * four, barred = ramp(t, nots[i] + 0.45, 0.3);
    if (i < 2) {
      const lit = speaking(t, lefts, i);
      ring(lx, y, MR, { color: P.evidence, alpha: row, width: 2.5 });
      dot(lx, y, 10, { color: P.evidence, alpha: row });
      if (lit > 0)
        ring(lx, y, MR + 10, {
          color: P.evidence,
          alpha: lit * restMark(P.evidence, 0.5) * four,
          width: 2
        });
      link(lx + MR + 12, y, bar - 12, y, { alpha: four, draw: deny, end: false });
      nameText(pairs[i][0], lx - MR - NAME_GAP, y, {
        align: "right",
        alpha: four * listIn(t, lefts, i),
        set: "holds"
      });
    } else
      link(lx, ys[1] + MR + 12, bar - 12, y, {
        route: "vh",
        alpha: four,
        draw: deny,
        end: false
      });
    line(bar, y - 36, bar, y + 36, { color: P.unknown, alpha: barred * four, width: 4 });
    ring(rx, y, MR, {
      color: P.muted,
      alpha: ramp(t, rights[i] - 0.1, 0.4) * four,
      width: 2.5,
      dash: [6, 6]
    });
    nameText(pairs[i][1], rx + MR + NAME_GAP, y, {
      align: "left",
      color: P.muted,
      alpha: four * named(t, rights[i]) * listLevel(t, rowAts, i),
      set: "follows"
    });
  });
}
function s12Adoption(s, t, admission, adoption, five) {
  const x0 = 880, y0 = 330, y1 = 670, ly = 500, ux = 600, ex = 1035, ey = 405, INSET = 48;
  const adoptTerm = [L("采用", "Adoption")], adoptQual = [L("在讲明的条件下用上了它", "use actually observed")];
  const room = 1590 - INSET - ex - 64, inline = termRowLayout(adoptTerm, adoptQual, room).one, termW = measure(adoptTerm[0]), qualW = measure(adoptQual.join(""), NOTE);
  const x1 = ex + 64 + Math.min(room, inline ? termW + TERM_GAP + qualW : Math.max(termW, qualW)) + INSET;
  const [permits, useAt, exampleAt, condAt, observedAt] = cues(s, [
    ["放行一项用途", "permits a specified use"],
    ["一项用途", "a specified use"],
    ["比如那次回测", "like that backtest"],
    ["讲明的条件", "stated conditions"],
    ["事后真看到", "actually observed"]
  ]);
  const [lone, whole] = L([190, -50], [203, -30]);
  ctx.save();
  ctx.translate(lone - (lone - whole) * glide(t, adoption + 0.05, lone - whole), 0);
  const open = soon(t, permits + 0.05, 0.45);
  path(
    [
      [x0, y0],
      [x1, y0],
      [x1, y1],
      [x0, y1]
    ],
    { color: P.line, alpha: five * ramp(t, condAt - 0.15, 0.4), width: 2 }
  );
  stroke(
    () => {
      ctx.moveTo(x0, y0);
      ctx.lineTo(x0, ly - 40);
      ctx.moveTo(x0, ly + 40);
      ctx.lineTo(x0, y1);
    },
    { color: P.authority, alpha: five, width: 5 }
  );
  if (open < 1)
    line(x0, ly - 40, x0, mix(ly + 40, ly - 40, open), {
      color: P.authority,
      alpha: five * clamp((1 - open) / 0.15),
      width: 5
    });
  nameText(L("准入", "Admission"), x0, y0 - NAME_GAP, {
    valign: "bottom",
    color: P.authority,
    alpha: five * named(t, admission)
  });
  nameText(L("讲明的条件", "Stated conditions"), x1, y0 - NAME_GAP, {
    valign: "bottom",
    align: "right",
    color: P.muted,
    alpha: five * named(t, condAt)
  });
  token(ux, ly, { color: P.authority, alpha: five * ramp(t, permits - 0.15, 0.4), r: 12 });
  const use = [L("一项用途", "A specified use")], example = [L("比如那次回测", "like that backtest")];
  termRow(t, use, [useAt], example, [exampleAt], ux, ly + 19 + NAME_GAP, {
    inline: false,
    align: "center",
    color: P.authority,
    alpha: five
  });
  link(ux + 31, ly, x0 + 130, ly, {
    color: P.authority,
    alpha: five,
    draw: { t, at: permits + 0.05 }
  });
  const adopted = ramp(t, adoption - 0.1, 0.4) * five;
  link(x0 + 144, ly, x1 - INSET, ly, {
    alpha: five,
    draw: { t, at: adoption + 0.05 },
    end: false
  });
  const q = loopPhase(
    since(t, en ? Math.max(adoption + 0.75, condAt + 0.35) : adoption + 0.75),
    x1 - INSET - 6 - x0 - 150
  );
  if (q !== null)
    flowDot(mix(x0 + 150, x1 - INSET - 6, q), ly, 8, q, { color: P.evidence, alpha: adopted });
  stroke(() => ctx.ellipse(ex, ey, 40, 22, 0, 0, Math.PI * 2), {
    color: P.ink,
    alpha: adopted,
    width: 2.5
  });
  dot(ex, ey, 9, { color: P.ink, alpha: adopted });
  line(ex, ey + 30, ex, ly - 14, {
    color: P.ink,
    alpha: five * ramp(t, observedAt + 0.05, 0.4),
    width: 2
  });
  termRow(t, adoptTerm, [adoption], adoptQual, [observedAt], ex + 64, ey - labelSize(LABEL) / 2, {
    width: room,
    alpha: five
  });
  ctx.restore();
}

// picture/film/scenes/p12/scene.js
scenes["12"] = function(s, t) {
  const together = cue(s, "同时满足", "all hold");
  const conds = cues(s, [
    ["含义", "meaning is explainable"],
    ["来源", "source traceable"],
    ["时间", "time identifiable"],
    ["过程能复现", "process is reproducible"],
    ["质量能核验", "quality verifiable"],
    ["运行看得见", "operation observable"],
    ["有负责人", "owner is identifiable"],
    ["用途有边界", "use bounded"]
  ]);
  const [missing, ...labels] = cues(s, [
    ["任何一条不满足", "if any condition is unmet"],
    ["探索", "exploratory"],
    ["临时", "temporary"],
    ["有限使用", "limited-use"],
    ["待核验", "awaiting verification"]
  ]);
  const [path_, ...steps] = cues(s, [
    ["从有希望的信号到受控使用", "from a signal to controlled use"],
    ["值不值得评估", "evaluation worthwhile"],
    ["数据是什么", "what is the data"],
    ["能不能复现", "key findings be reproduced"],
    ["能不能稳定运行", "run reliably"],
    ["能不能准入", "serve this use"],
    ["该不该继续", "support continuing"]
  ]);
  const [signalNot, deployed, admission, adoption] = cues(s, [
    ["有信号", "a signal is not"],
    ["已经部署", "deployed does not mean"],
    ["准入是事先放行", "admission permits"],
    ["采用", "adoption is"]
  ]);
  const base = ramp(t, opening(s), 0.7);
  const arc = (i) => {
    const a0 = -Math.PI / 2 + i * Math.PI / 4 + 0.06, a1 = a0 + Math.PI / 4 - 0.12;
    return [a0, a1, (a0 + a1) / 2];
  };
  const one = base * stageOut(t, missing);
  if (one > 0) s12Conditions(s, t, together, conds, arc, one);
  const two = base * stageIn(t, missing) * stageOut(t, path_);
  if (two > 0) s12Labels(s, t, conds, labels, arc, two);
  const [forUse, ctrlAt] = cues(s, [
    ["针对计划中的用途", "the intended use"],
    ["受控使用", "controlled use"]
  ]);
  const applyAt = cue(s, "适用的问题", "the questions that apply");
  const three = base * stageIn(t, path_) * stageOut(t, signalNot);
  if (three > 0) s12ControlledUse(t, path_, steps, forUse, ctrlAt, applyAt, three);
  const rights = cues(s, [
    ["能投产", "production ready"],
    ["准入了", "admitted"],
    ["别的用途", "for another use"]
  ]);
  const lefts = [signalNot, deployed];
  const nots = [
    cueFrom(s, "还不能", "is not yet", signalNot),
    cueFrom(s, "不等于", "does not mean", deployed),
    cueFrom(s, "更不等于", "let alone", deployed)
  ];
  const rowAts = [...lefts, nots[2]];
  const four = base * stageIn(t, signalNot) * stageOut(t, admission);
  if (four > 0) s12NotYet(t, rights, lefts, nots, rowAts, four);
  const five = base * stageIn(t, admission);
  if (five > 0) s12Adoption(s, t, admission, adoption, five);
};
scenes["12"].push = 0.01;

// picture/film/drawing/pages.js
function s17Page(x, y, w, h, { alpha = 1, stroke: edge = P.ink, rows = 4, fillColor = P.row, fold = true } = {}) {
  if (alpha < 0.01) return;
  documentIcon(x, y, w, h, { alpha, stroke: edge, rows: 0, fillColor, fold });
  if (rows > 0)
    stroke(
      () => {
        for (let i = 0; i < rows; i++) {
          const ry = y + h * (0.3 + i * 0.55 / Math.max(1, rows));
          ctx.moveTo(x + w * 0.14, ry);
          ctx.lineTo(x + w * (i % 2 ? 0.62 : 0.82), ry);
        }
      },
      { color: P.muted, alpha: alpha * 0.8, width: 2 }
    );
}
function s23Page(x, y, w, h, { alpha = 1, stroke: s = P.ink, rows = 0 } = {}) {
  if (alpha < 0.01) return;
  const c = Math.min(22, w * 0.2);
  fill(
    () => {
      ctx.moveTo(x, y);
      ctx.lineTo(x + w - c, y);
      ctx.lineTo(x + w, y + c);
      ctx.lineTo(x + w, y + h);
      ctx.lineTo(x, y + h);
      ctx.closePath();
    },
    { color: P.row, alpha }
  );
  stroke(
    () => {
      ctx.moveTo(x + w - c, y + c);
      ctx.lineTo(x + w - c, y);
      ctx.lineTo(x, y);
      ctx.lineTo(x, y + h);
      ctx.lineTo(x + w, y + h);
      ctx.lineTo(x + w, y + c);
      ctx.lineTo(x + w - c, y + c);
      ctx.lineTo(x + w - c, y);
    },
    { color: s, alpha, width: 2 }
  );
  if (rows)
    stroke(
      () => {
        for (let i = 0; i < rows; i++) {
          const ry = y + h * (0.3 + i * 0.55 / Math.max(1, rows));
          ctx.moveTo(x + w * 0.14, ry);
          ctx.lineTo(x + w * (i % 2 ? 0.62 : 0.82), ry);
        }
      },
      { color: P.muted, alpha: alpha * 0.8, width: 2 }
    );
}

// picture/film/scenes/p13/decisions.js
function s13Join(s, t, example, changeId, tests, join, wrong, p1) {
  const testsName = L("本地测试通过", "Local tests"), issuerName = L("一套公司代码", "Issuer identifier");
  const Y = 520, H = 220, W = 380, RW = 260, CH = H, reach = W + 26 + NAME_GAP + measure(testsName), rl = 960 - (720 + reach) / 2, top = Y - H / 2, ctop = Y - CH / 2, low = top + H + 50;
  const caseAt = cue(s, "一个虚构的例子", "an illustrative change"), dataAt = cueFrom(s, "一份共享数据", "a shared dataset", example);
  const idAt = cue(s, "一套公司代码", "issuer identifier"), factorAt = cue(s, "下游的因子计算", "factor calculation"), lost = cue(s, "漏掉一些", "lose matches");
  const outs = [wrong, lost];
  const moveAt = en ? cue(s, "", "but a downstream") : factorAt;
  const lo = Math.min(0, (W - measure(issuerName)) / 2), told = soon(t, tests + 0.05, Math.max(0.7, moveAt - 0.15 - (tests + 0.05)));
  const solo = 960 - (lo + Math.max(W, measure(L("共享数据", "Shared dataset")), W - lo)) / 2, alone = 960 - (lo + reach) / 2;
  const apart = glide(t, moveAt + 0.05, Math.abs(rl + 720 - alone)), dl = mix(mix(solo, alone, told), rl + 720, apart), dx = dl + W / 2;
  const caseName = L("一个虚构的例子", "An illustrative change"), hx = mix(960, rl + (720 + W) / 2, apart) - (48 + measure(caseName)) / 2, hy = top - 120;
  const file = ramp(t, s.voice_start - 0.3, 0.4) * p1, data = ramp(t, dataAt - 0.15, 0.4) * p1;
  s17Page(hx, hy - labelSize(LABEL) / 2 - 20, 32, 40, { alpha: file, rows: 3 });
  nameText(caseName, hx + 48, hy, {
    align: "left",
    valign: "bottom",
    alpha: p1 * named(t, caseAt)
  });
  s13Table(dl, top, W, H, { alpha: data, values: true });
  nameText(L("共享数据", "Shared dataset"), dl, top - NAME_GAP, {
    align: "left",
    valign: "bottom",
    alpha: p1 * named(t, dataAt)
  });
  const ok = ramp(t, tests - 0.1, 0.4) * p1;
  dot(dl + W, top, 26, { color: P.ground, alpha: ok });
  ring(dl + W, top, 26, { color: P.evidence, alpha: ok, width: 2.5 });
  check(dl + W, top + 2, 22, { alpha: ok });
  nameText(testsName, dl + W + 26 + NAME_GAP, top, {
    align: "left",
    color: P.evidence,
    alpha: p1 * named(t, tests)
  });
  const flip = clamp((t - changeId + 0.1) / 0.6), sx = Math.max(0.04, Math.abs(Math.cos(Math.PI * flip)));
  ctx.save();
  ctx.translate(dx, low);
  ctx.scale(sx, 1);
  ctx.translate(-dx, -low);
  if (flip < 0.5)
    text("ID A1", dx, low, 26, {
      role: "mark",
      align: "center",
      color: P.ink,
      alpha: data * clamp((0.5 - flip) / 0.5)
    });
  else
    text("ID X9", dx, low, 26, {
      role: "mark",
      align: "center",
      color: P.authority,
      alpha: data * clamp((flip - 0.5) / 0.5)
    });
  ctx.restore();
  nameText(issuerName, dx, low + 18 + NAME_GAP, { valign: "top", alpha: p1 * named(t, idAt) });
  const fq = ramp(t, factorAt - 0.15, 0.4) * p1;
  box(rl, ctop, RW, CH, { fill: P.row, stroke: P.ink, alpha: fq, radius: 12 });
  path(
    series(
      (x) => Y + 24 + 34 * Math.sin((x - rl) / 38) * Math.exp(-(x - rl) / 360) - (x - rl) * 0.14,
      rl + 30,
      rl + RW - 30,
      6
    ),
    { color: P.evidence, alpha: fq, width: 2.5 }
  );
  nameText(L("下游的因子计算", "Downstream factor calculation"), rl, ctop - NAME_GAP, {
    align: "left",
    valign: "bottom",
    width: 420,
    alpha: p1 * named(t, factorAt)
  });
  const j = { t, at: join - 0.1 }, bad = ramp(t, wrong - 0.1, 0.4), jx0 = dl - 12, jx1 = rl + RW + 12, jm = (jx0 + jx1) / 2;
  const broken = ramp(t, wrong + 0.05, 0.35);
  if (t >= join - 0.1)
    link(jx0, Y, jx1, Y, {
      color: blend(P.ink, P.unknown, bad),
      alpha: p1,
      draw: j,
      width: 2.5,
      dash: broken > 0 ? [16 - 8 * broken, 8 * broken] : null
    });
  text("A1", jm, Y - 34, 26, {
    role: "mark",
    align: "center",
    color: blend(P.muted, P.unknown, bad),
    alpha: p1 * ramp(t, join - 0.1, 0.4)
  });
  nameText(L("按旧代码关联财务数据", "Joins on the old one"), jm, Y + NAME_GAP, {
    valign: "top",
    alpha: p1 * named(t, join)
  });
  outs.forEach((at, i) => {
    const y = low + 18 + NAME_GAP + labelSize(LABEL) / 2 + i * 70, q = ramp(t, at - 0.1, 0.4) * p1, lit = speaking(t, outs, i), mx = rl + 12;
    if (i === 0) dot(mx, y, 13, { color: P.unknown, alpha: q });
    else ring(mx, y, 11, { color: P.unknown, alpha: q, width: 3 });
    if (lit > 0)
      ring(mx, y, 18, { color: P.unknown, alpha: lit * restMark(P.unknown, 0.5) * p1, width: 2 });
    nameText(
      [L("关联错公司", "Match the wrong entities"), L("漏掉一些", "Lose matches")][i],
      mx + 11 + NAME_GAP,
      y,
      { align: "left", alpha: p1 * listIn(t, outs, i), set: "outcomes" }
    );
  });
}
function s13Decisions(s, t, decisions, schema, owners, opensDecisions, p2) {
  const xs = [520, 1400];
  const ownerNames = [
    L("有授权的领域负责人", "Authorized domain owners"),
    L("数据模型负责人", "Data-model owner")
  ];
  const items = en ? [
    ["Entities", "Relationships", "Rules", "Metric meanings"],
    [
      "Grain",
      "IDs and keys",
      "Constraints",
      "Time and version rules",
      ["How agreed meaning", "is represented"]
    ]
  ] : [
    ["公司是谁", "有什么关系", "业务规则是什么", "指标什么含义"],
    [
      "数据的粒度",
      "用什么代码和键关联",
      "有哪些约束",
      "时间和版本按什么规则",
      "约定的含义怎么表示"
    ]
  ];
  const itemAts = (en ? [
    ["entities", "relationships", "rules", "metric meanings"],
    ["grain", "IDs and keys", "constraints", "time and version", "how the agreed meaning"]
  ] : items).map((list) => list.map((w) => cueFrom(s, w, w, decisions)));
  const Y = 480 - 80 * glide(t, itemAts[1].at(-1) - 0.3, 80);
  const listW = (k) => 7 + 9 + NAME_GAP + 7 + Math.max(...items[k].flat().map((v) => measure(v))), half = (k) => Math.max(measure(ownerNames[k]), listW(k)) / 2;
  const shift = 960 - (2 * (xs[0] - half(0)) + 2 * xs[1] + measure("?", 80, false, "mark") / 2 + half(1)) / 4;
  ctx.save();
  ctx.translate(shift, 0);
  const heading = p2 * named(t, opensDecisions) * (1 - ramp(t, itemAts[1].at(-1) - 0.15, 0.3));
  nameText(L("几件不同的事", "Several distinct decisions"), 960, Y - 160, { alpha: heading });
  stroke(
    () => {
      ctx.moveTo(960, Y - 140);
      ctx.lineTo(960, Y - 124);
      ctx.moveTo(xs[0], Y - 106);
      ctx.lineTo(xs[0], Y - 124);
      ctx.lineTo(xs[1], Y - 124);
      ctx.lineTo(xs[1], Y - 106);
    },
    { alpha: heading, width: 2 }
  );
  xs.forEach((x, k) => {
    const ats = itemAts[k], seen = ramp(t, owners[k] - 0.15, 0.4) * p2;
    const open = p2 * named(t, opensDecisions) * (1 - ramp(t, owners[k] - 0.4, 0.25));
    text("?", x, Y - 6, 80, { role: "mark", align: "center", color: P.authority, alpha: open });
    person(x, Y, { alpha: seen, color: P.authority, size: 1.1 });
    nameText(ownerNames[k], x, Y - 45 - NAME_GAP, {
      valign: "bottom",
      color: P.authority,
      alpha: p2 * named(t, owners[k])
    });
    const bx = x + 7 - (7 + 9 + NAME_GAP + 7 + Math.max(...items[k].flat().map((v) => measure(v)))) / 2;
    ats.forEach((at, i) => {
      const y = Y + 80 + i * 72, q = ramp(t, at - 0.15, 0.4) * p2, lit = speaking(t, ats, i), lines = Array.isArray(items[k][i]);
      dot(bx, y, 7 + 2 * lit, { color: P.authority, alpha: q });
      nameText(items[k][i], bx + 9 + NAME_GAP, lines ? y - labelSize(LABEL) / 2 : y, {
        align: "left",
        valign: lines ? "top" : "middle",
        alpha: p2 * listIn(t, ats, i),
        set: `settles${k}`
      });
    });
  });
  const resolveAt = cue(s, "解决不了", "cannot resolve"), sc = ramp(t, schema - 0.15, 0.4) * p2, ty = Y + 150, way = 760;
  const stop = named(t, resolveAt - 0.2) * p2, barX = (960 - 80 - 12 + way) / 2;
  const schemaName = L("表结构选得再方便", "Convenient schema"), refusal = L("解决不了含义上的分歧", "Cannot resolve a conflict of meaning");
  s13Table(880, ty, 160, 70, { alpha: sc, stroke: P.muted, rows: 3 });
  growName(t, [schemaName], [schema], 960, ty - NAME_GAP, {
    valign: "bottom",
    align: "center",
    alpha: p2,
    whole: `${schemaName} ${refusal}`
  });
  link(880 - 12, ty + 35, way, ty + 35, {
    color: P.unknown,
    alpha: sc,
    upto: 0.5 * drawShare(t, schema + 0.1, 0.5 * Math.abs(way - (880 - 12)), 0.6),
    end: false,
    dash: [6, 6]
  });
  line(barX, ty + 5, barX, ty + 65, { color: P.unknown, alpha: stop, width: 4 });
  growName(t, [refusal], [resolveAt - 0.2], 960, ty + 70 + NAME_GAP, {
    valign: "top",
    align: "center",
    width: 480,
    alpha: p2,
    whole: `${schemaName} ${refusal}`
  });
  ctx.restore();
}

// picture/film/scenes/p13/responsibilities.js
function s13Responsibilities(s, t, roles, seats, coordinate, p3) {
  const names = en ? ["Development", "Technical owners", "Product owner", "Production", "Governance"] : ["开发方", "技术方", "产品负责人", "生产方", "治理方"];
  const acts = [
    ["核对关联", "checks the joins"],
    ["检查兼容性", "check compatibility"],
    ["找出", "identifies"],
    ["规划发布", "plans release"],
    ["确认", "confirms permission"]
  ].map(([a, b], i) => cueFrom(s, a, b, roles[i]));
  const [pathsAt, recoverAt, exitAt] = [
    cueFrom(s, "安排迁移", "their migration", roles[2]),
    cueFrom(s, "恢复", "recovery", roles[3]),
    cueFrom(s, "停用条件", "exit conditions", roles[4])
  ];
  const notSeats = cueFrom(s, "不是岗位", "not seats", seats);
  const [coordAt, takeAt] = [
    cueFrom(s, "统筹", "coordinates", coordinate),
    cueFrom(s, "替各方做决定", "taking over", coordinate)
  ];
  const closeUp = en ? 0 : glide(t, seats + 0.05, 2 * 70), PITCH = mix(L(290, 275), 220, closeUp);
  const TR = 50, Y = 440, FY = 680, trayY = Y + TR + 12, LX = 960;
  const lean = en ? 0 : -40 * (glide(t, roles[4] - 0.45, 40) - glide(t, seats + 0.05, 40)) - 62 * (glide(t, roles[2] - 0.45, 62) - glide(t, roles[3] - 0.45, 62));
  const shift = building(t, roles.slice(2), L(145, 140), 0.45), xs = [-2, -1, 0, 1, 2].map((k) => 960 + k * PITCH + shift + lean);
  const these = ramp(t, seats + 0.05, 0.3) * (1 - ramp(t, notSeats + 0.05, 0.3));
  const joins = ramp(t, roles[0] + STAGE_CUT, 0.4) * (1 - ramp(t, seats + 0.05, 0.3)) * p3, JY = 640, jx = 1030;
  stroke(
    () => {
      ctx.moveTo(xs[0], Y + TR + 12);
      ctx.lineTo(xs[0], JY);
      ctx.lineTo(jx - 220, JY);
      ctx.moveTo(jx - 160, JY);
      ctx.lineTo(jx + 160, JY);
    },
    { color: P.ink, alpha: joins, width: 2.5 }
  );
  fill(() => [jx - 190, jx + 190].forEach((x) => ctx.roundRect(x - 30, JY - 20, 60, 40, 6)), {
    color: P.row,
    alpha: joins
  });
  stroke(() => [jx - 190, jx + 190].forEach((x) => ctx.roundRect(x - 30, JY - 20, 60, 40, 6)), {
    color: P.ink,
    alpha: joins,
    width: 2.5
  });
  check(jx, JY - 2, 24, { alpha: joins, draw: { t, at: acts[0] + 0.05 } });
  if (!en)
    nameText("核对关联", jx, JY + NAME_GAP, {
      valign: "top",
      alpha: p3 * named(t, acts[0]) * (1 - ramp(t, seats + 0.05, 0.3))
    });
  const seatQ = p3 * ramp(t, notSeats - 0.22, 0.4) * (1 - ramp(t, coordinate + 0.05, 0.4)), seatY = Y + TR + 12 + 12 * 2.15;
  stroke(
    () => xs.forEach((x) => {
      ctx.moveTo(x + 12, seatY - 12 * 1.15);
      ctx.arc(x, seatY - 12 * 1.15, 12, 0, Math.PI * 2);
    }),
    { color: P.muted, alpha: seatQ, width: 2, dash: [4, 4] }
  );
  stroke(
    () => xs.forEach((x) => {
      ctx.moveTo(
        x + 18.6 * Math.cos(Math.PI * 1.08),
        seatY + 12 * 1.9 + 18.6 * Math.sin(Math.PI * 1.08)
      );
      ctx.arc(x, seatY + 12 * 1.9, 18.6, Math.PI * 1.08, Math.PI * 1.92);
    }),
    { color: P.muted, alpha: seatQ, width: 2.5, dash: [4, 4] }
  );
  rejectedName(L("岗位", "Seats"), 960, seatY + 60, {
    alpha: p3 * named(t, notSeats - 0.12) * (1 - ramp(t, coordinate + 0.05, 0.4)),
    mark: ramp(t, notSeats + 0.35, 0.3)
  });
  const icon = (i, x, y, q) => {
    const go = soon(t, acts[i] + 0.05, 0.6), u = (v) => v * TR / 34;
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
          [x + u(1), y + u(11)]
        ],
        { color: P.ink, alpha: q, width: 3 }
      );
      box(mix(x - u(22), x + u(1), go), y - u(6), u(12), u(12), {
        fill: P.evidence,
        alpha: q,
        radius: 3
      });
    } else if (i === 2) {
      [-11, 0, 11].forEach((d, k) => {
        dot(x - u(13), y + u(d), u(4), {
          color: blend(P.muted, P.evidence, ramp(t, acts[2] + 0.05 + k * 0.12, 0.25)),
          alpha: q
        });
        link(x - u(7), y + u(d), x + u(12), y, {
          route: "hvh",
          mid: x + u(3),
          r: 5,
          color: P.evidence,
          alpha: q,
          draw: { t, at: pathsAt + 0.05 + k * 0.1 },
          end: false,
          width: 2.5
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
            [x + u(17), y - u(9)]
          ],
          go
        ).kept,
        { color: P.ink, alpha: q, width: 3 }
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
          0.5
        ),
        end: false,
        dash: [4, 5]
      });
    } else {
      ring(x - u(8), y, u(9), { color: P.authority, alpha: q, width: 2.5 });
      check(x - u(8), y + u(1), u(10), { color: P.authority, alpha: q, upto: go, width: 3 });
      box(x + u(6), y - u(11), u(12), u(22), { stroke: P.ink, alpha: q, radius: 2, width: 2.5 });
      box(x + u(6), y - u(11), u(mix(12, 4, soon(t, exitAt + 0.05, 0.35))), u(22), {
        fill: P.ink,
        alpha: q * 0.8,
        radius: 2
      });
    }
  };
  names.forEach((v, i) => {
    const x = xs[i], q = ramp(t, roles[i] - 0.45, 0.4) * p3, lit = Math.max(speaking(t, roles, i), these);
    dot(x, Y, TR, { color: P.row, alpha: q });
    ring(x, Y, TR, { color: P.authority, alpha: q, width: 2.5 });
    if (lit > 0)
      ring(x, Y, TR + 9, {
        color: P.authority,
        alpha: lit * restMark(P.authority, 0.5) * q,
        width: 2
      });
    icon(i, x, Y, q);
    nameText(v, x, Y - TR - NAME_GAP, {
      valign: "bottom",
      alpha: p3 * listIn(t, roles, i),
      set: "roles"
    });
  });
  if (!en) {
    const duties = [
      [["检查兼容性"], [acts[1]]],
      [["找出下游使用方、安排迁移"], [acts[2]]],
      [
        ["规划发布", "和恢复"],
        [acts[3], recoverAt]
      ],
      [
        ["确认使用权限", "和停用条件"],
        [acts[4], exitAt]
      ]
    ];
    const em = labelSize(LABEL), top = Y + TR + 9 + NAME_GAP, kept = p3 * (1 - ramp(t, seats + 0.05, 0.3));
    duties.forEach(([parts, ats], k) => {
      const low = k % 2 ? em * LEADING : 0;
      if (low)
        line(xs[k + 1], Y + TR + 12, xs[k + 1], top + low - 6, {
          alpha: kept * ramp(t, ats[0] - 0.15, 0.4),
          width: 2
        });
      growName(t, parts, ats, xs[k + 1], top + low, {
        align: "center",
        alpha: kept,
        set: "duties",
        build: true
      });
    });
  }
  const lead = named(t, coordinate) * p3, wayUp = FY - 44 - (trayY + 2), flowing = since(t, coordAt + 0.65);
  person(LX, FY, { size: 1.3, color: P.evidence, alpha: lead });
  nameText(L("任务负责人", "Task lead"), LX, FY + 30 + NAME_GAP, {
    valign: "top",
    color: P.evidence,
    alpha: lead
  });
  link(LX, FY - 44, LX, trayY + 2, {
    color: P.evidence,
    alpha: lead,
    draw: { t, at: coordAt + 0.05 },
    flowing,
    end: false
  });
  const spread = { t, at: coordAt + 0.05 + drawTime(wayUp) }, l = xs[0] - TR - 12, r = xs[4] + TR + 12;
  [l, r].forEach(
    (x) => path(
      [
        [LX, trayY],
        [x, trayY],
        [x, trayY - 10]
      ],
      { color: P.evidence, alpha: lead, width: 2.5, draw: spread }
    )
  );
  const takeName = L("替各方做决定", "Taking over authority");
  rejectedName(takeName, LX, FY + 30 + NAME_GAP + labelSize(LABEL) + 14, {
    valign: "top",
    alpha: p3 * named(t, takeAt),
    mark: named(t, takeAt),
    markLeft: LX + measure(takeName) / 2 + 16
  });
}

// picture/film/scenes/p13/retiring.js
function s13Retiring(s, t, retire, migrated, ended, notice, p4) {
  const [showAt, affected, owner, notProof] = [
    cueFrom(s, "先证明每个", "show that every", retire),
    cueFrom(s, "每个受影响的使用方", "every affected consumer", retire),
    cueFrom(s, "决策负责人", "the decision owner", retire),
    cueFrom(s, "证明不了", "does not prove migration", retire)
  ];
  const CY = 480, ys = stackTops(
    [0, 1, 2, 3].map(() => 52),
    CY,
    40
  ).map((v) => v + 26), tree = ramp(t, showAt - 0.1, 0.5) * p4;
  const consumers = L("每个受影响的使用方", "Every affected consumer"), noticeTerm = [L("弃用通知", "A deprecation notice")], noticeQual = [L("证明不了迁移", "does not prove migration")];
  const RW = 260, wide = Math.max(
    380 + measure(consumers),
    584 + Math.max(
      measure(L("都已迁移", "Migrated")),
      measure(L("决策负责人", "The decision owner"))
    ),
    112 + measure(noticeTerm[0]) + TERM_GAP + measure(noticeQual[0], NOTE)
  );
  const RX = mix(960 - RW / 2, 960 - wide / 2, glide(t, showAt + 0.05, (wide - RW) / 2)), RH = 100, RY = ys[0] - 26 + RH, CX = RX + 420, SX = RX + 530, NX = SX + 54;
  box(RX, RY - RH, RW, RH * 2, { fill: P.row, stroke: P.ink, alpha: p4, radius: 12 });
  [-50, 0, 50].forEach(
    (dy) => line(RX + RW / 2 - 30, RY + dy, RX + RW / 2 + 30, RY + dy, {
      color: P.muted,
      alpha: p4,
      width: 3
    })
  );
  nameText(L("旧公司代码", "Old identifier"), RX, RY - RH - NAME_GAP, {
    align: "left",
    valign: "bottom",
    alpha: p4 * named(t, retire)
  });
  text("ID A1", RX + RW / 2, RY + RH + 34, 26, {
    role: "mark",
    align: "center",
    color: P.muted,
    alpha: p4
  });
  const seen = ramp(t, showAt - 0.15, 0.4) * p4;
  fill(() => ys.forEach((y) => ctx.roundRect(CX - 40, y - 26, 80, 52, 8)), {
    color: P.row,
    alpha: seen
  });
  stroke(() => ys.forEach((y) => ctx.roundRect(CX - 40, y - 26, 80, 52, 8)), {
    color: P.ink,
    alpha: seen,
    width: 2
  });
  stroke(
    () => ys.forEach(
      (y, k) => series((x) => y + 8 - 10 * Math.sin((x - CX) / 9 + k), CX - 26, CX + 26, 4).forEach(
        ([x, v], i) => i ? ctx.lineTo(x, v) : ctx.moveTo(x, v)
      )
    ),
    { color: P.evidence, alpha: seen, width: 2 }
  );
  ys.forEach(
    (y) => link(RX + RW + 12, RY, CX - 52, y, { route: "hvh", mid: RX + RW + 80, r: 12, alpha: tree })
  );
  const moved = ramp(t, migrated - 0.1, 0.4) * p4, ended2 = ramp(t, ended - 0.1, 0.4) * p4;
  [0, 1, 2].forEach((k) => check(SX, ys[k] + 2, 26, { alpha: moved }));
  stopSign(SX, ys[3], 18, { alpha: ended2, color: P.authority });
  path(
    [
      [SX + 26, ys[0]],
      [SX + 36, ys[0]],
      [SX + 36, ys[2]],
      [SX + 26, ys[2]]
    ],
    { color: P.evidence, alpha: moved * 0.8, width: 2 }
  );
  nameText(consumers, CX - 40, ys[0] - 26 - NAME_GAP, {
    align: "left",
    valign: "bottom",
    alpha: p4 * named(t, affected)
  });
  nameText(L("都已迁移", "Migrated"), NX, ys[1], {
    align: "left",
    color: P.evidence,
    alpha: p4 * named(t, migrated)
  });
  nameText(L("决策负责人", "The decision owner"), NX, ys[3], {
    align: "left",
    color: P.authority,
    alpha: p4 * named(t, owner)
  });
  const nt = ramp(t, notice - 0.15, 0.4) * p4, nx = RX + 45, ny = RY + RH + 120, wayTop = RY + RH + 12;
  documentIcon(nx - 45, ny, 90, 116, { alpha: nt, rows: 3, stroke: P.muted });
  link(nx, ny - 12, nx, wayTop, {
    color: P.unknown,
    alpha: nt,
    upto: 0.5 * drawShare(t, notProof - 0.1, 0.5 * Math.abs(wayTop - (ny - 12)), 0.5),
    end: false,
    dash: [6, 6]
  });
  line(nx - 30, (ny - 12 + wayTop) / 2, nx + 30, (ny - 12 + wayTop) / 2, {
    color: P.unknown,
    alpha: ramp(t, notProof + 0.3, 0.3) * p4,
    width: 4
  });
  termRow(
    t,
    noticeTerm,
    [notice],
    noticeQual,
    [notProof],
    nx + 45 + NAME_GAP,
    ny + 58 - labelSize(LABEL) / 2,
    { alpha: p4 }
  );
}

// picture/film/scenes/p13/scene.js
scenes["13"] = function(s, t) {
  const [example, changeId, tests, join, wrong, decisions, schema] = cues(s, [
    ["虚构的例子", "illustrative change"],
    ["换了一套公司代码", "changes its issuer identifier"],
    ["本地测试通过了", "local tests pass"],
    ["按旧代码关联财务数据", "joins on the old one"],
    ["关联错公司", "match the wrong entities"],
    ["几件不同的事", "several distinct decisions"],
    ["表结构选得再方便", "convenient schema"]
  ]);
  const roles = cues(s, [
    ["开发", "development checks"],
    ["技术", "technical owners check"],
    ["产品", "product owner identifies"],
    ["生产", "production owner plans"],
    ["治理", "governance confirms"]
  ]);
  const [seats, coordinate, retire, migrated, ended, notice] = cues(s, [
    ["这些是责任", "responsibilities not seats"],
    ["任务负责人", "task lead"],
    ["旧公司代码要停用", "retiring the old identifier"],
    ["都已迁移", "has migrated"],
    ["终止那项使用", "ended its use"],
    ["弃用通知", "deprecation notice"]
  ]);
  const owners = [
    cue(s, "有授权的领域负责人", "authorized domain owners"),
    cue(s, "数据模型负责人", "data-model owner")
  ];
  const opensDecisions = cue(s, "这时要定", "this raises");
  const base = ramp(t, opening(s), 0.7);
  const p1 = ramp(t, Math.min(example - 0.3, opening(s) + 0.2), 0.7) * base * stageOut(t, opensDecisions);
  illustrative(ramp(t, example - 0.2, 0.6) * base);
  if (p1 > 0) s13Join(s, t, example, changeId, tests, join, wrong, p1);
  const p2 = stageIn(t, opensDecisions) * base * stageOut(t, roles[0]);
  if (p2 > 0) s13Decisions(s, t, decisions, schema, owners, opensDecisions, p2);
  const p3 = stageIn(t, roles[0]) * base * stageOut(t, retire);
  if (p3 > 0) s13Responsibilities(s, t, roles, seats, coordinate, p3);
  const p4 = stageIn(t, retire) * base;
  if (p4 > 0) s13Retiring(s, t, retire, migrated, ended, notice, p4);
};

// picture/film/scenes/p14/handover.js
function s14Handover(t, handing, rows, groups, pB, resultAt, modelName, inputsName, failName, riskName, TW, RR, PAIR, OUT, MEET, widest, reportLeft, RCY, RCX) {
  const modelLeft = RCX + reportLeft;
  nameText(L("交出结果之前，讲清三件事", "Before handing over"), modelLeft, 338 - 22 - 40, {
    align: "left",
    valign: "bottom",
    alpha: pB * named(t, handing)
  });
  const starts = rows.filter((_, i) => groups[i] !== groups[i - 1]).map((v) => v[0]), level = (i) => pB * listLevel(t, starts, groups[i]);
  const on = (at) => ramp(t, at - 0.15, 0.35) * pB, att = (at) => soon(t, at + 0.05, 0.5);
  const G0 = Math.PI * 55 / 180, G1 = Math.PI * 125 / 180;
  ring(RCX, RCY, RR, {
    color: P.evidence,
    alpha: on(rows[2][0]),
    width: 6,
    start: G1,
    upto: 290 / 360,
    draw: { t, at: rows[2][0] + 0.05 }
  });
  stroke(() => ctx.arc(RCX, RCY, RR, G0, G1), {
    color: P.unknown,
    alpha: on(rows[2][1]),
    width: 4,
    dash: [7, 7]
  });
  radialName(L("结果", "Result"), RCX, RCY, RR, en ? -Math.PI * 3 / 4 : -Math.PI / 2, {
    gap: NAME_GAP + 4,
    alpha: pB * named(t, resultAt)
  });
  radialName(L("哪里没覆盖到", "What was not covered"), RCX, RCY, RR, Math.PI / 2, {
    gap: NAME_GAP + 14,
    width: 420,
    alpha: level(2) * named(t, rows[2][1]),
    set: "report"
  });
  const my = en ? RCY : RCY - PAIR, mq = on(rows[0][0]), mx = RCX - OUT + 50 - 28 * (1 - att(rows[0][0])), cq = on(rows[0].at(-1));
  box(mx - 50, my - 36, 100, 72, { fill: P.row, stroke: P.evidence, alpha: mq, radius: 8 });
  const parts = [
    [mx - 32, my - 13],
    [mx - 8, my - 13],
    [mx - 20, my + 13]
  ];
  path([...parts, parts[0]], { color: P.ink, alpha: mq, width: 2 });
  parts.forEach(([x, y]) => dot(x, y, 5, { color: P.ink, alpha: mq }));
  stroke(
    () => {
      ctx.moveTo(mx + 6, my + 14);
      ctx.lineTo(mx + 40, my + 14);
      [0, 1, 2, 3].forEach((k) => {
        ctx.moveTo(mx + 6 + k * 11, my + 14);
        ctx.lineTo(mx + 6 + k * 11, my + 7);
      });
    },
    { color: P.ink, alpha: cq, width: 2 }
  );
  line(mx + 28, my - 18, mx + 28, my + 14, { color: P.authority, alpha: cq, width: 3 });
  link(mx + 58, my, RCX - RR - 8, RCY, {
    route: en ? null : "hvh",
    mid: RCX - MEET,
    color: P.evidence,
    alpha: mq,
    draw: { t, at: rows[0][0] + 0.05, least: 0.9 }
  });
  growName(t, modelName, rows[0], mx - 50 - NAME_GAP - measure(modelName.join("")), my, {
    valign: "middle",
    alpha: level(0),
    set: "report"
  });
  const IX = en ? RCX : RCX - OUT + TW, IY = en ? 338 : RCY + PAIR;
  [-54, 0, 54].forEach((dx, k) => {
    const q = on(rows[1][k]), x = IX + dx, y = IY - 20 * (1 - att(rows[1][k]));
    box(x - 22, y - 22, 44, 44, { fill: P.row, stroke: P.evidence, alpha: q, radius: 6 });
    if (k === 0) {
      box(x - 12, y - 10, 24, 20, { stroke: P.ink, alpha: q, radius: 2 });
      line(x - 12, y, x + 12, y, { color: P.ink, alpha: q });
      line(x, y - 10, x, y + 10, { color: P.ink, alpha: q });
    }
    if (k === 1)
      text("v2", x, y + 1, 26, { role: "mark", align: "center", color: P.ink, alpha: q });
    if (k === 2) {
      box(x - 13, y - 11, 26, 22, { stroke: P.ink, alpha: q, radius: 4 });
      dot(x, y, 4, { color: P.ink, alpha: q });
    }
  });
  const iq = on(rows[1][0]);
  line(IX - TW, IY + 30, IX + TW, IY + 30, { color: P.evidence, alpha: iq, width: 2 });
  if (en)
    link(RCX, 368, RCX, RCY - RR - 8, {
      color: P.evidence,
      alpha: iq,
      draw: { t, at: rows[1][0] + 0.05, least: 0.9 }
    });
  else
    link(IX + TW + 8, IY, RCX - RR - 8, RCY, {
      route: "hvh",
      mid: RCX - MEET,
      color: P.evidence,
      alpha: iq,
      draw: { t, at: rows[1][0] + 0.05, least: 0.9 }
    });
  growName(
    t,
    inputsName,
    rows[1],
    en ? RCX + TW + NAME_GAP : RCX - OUT - NAME_GAP - widest(inputsName, 480),
    IY,
    { valign: "middle", width: 480, alpha: level(1), set: "report" }
  );
  const fy = RCY - PAIR, fq = on(rows[3][0]), fx = RCX + 220 + 28 * (1 - att(rows[3][0])), dq = on(rows[3][1]);
  box(fx - 50, fy - 36, 100, 72, { fill: P.row, stroke: P.evidence, alpha: fq, radius: 8 });
  [-16, 16].forEach((d, k) => {
    const go = soon(t, rows[3][1] + 0.05 + k * 0.15, 0.4);
    cross(fx - 28, fy + d, 14, { alpha: fq, width: 3 });
    link(fx - 16, fy + d, fx + 14, fy + d, { color: P.muted, alpha: dq, upto: go, end: false });
    check(fx + 28, fy + d, 15, { alpha: dq, upto: clamp((go - 0.6) / 0.4), width: 3 });
  });
  link(fx - 58, fy, RCX + RR + 8, RCY, {
    route: "hvh",
    mid: RCX + MEET,
    color: P.evidence,
    alpha: fq,
    draw: { t, at: rows[3][0] + 0.05, least: 0.9 }
  });
  growName(t, failName, rows[3], fx + 50 + NAME_GAP, fy, {
    valign: "middle",
    width: 480,
    alpha: level(3),
    set: "report"
  });
  const [whoAt, riskAt] = en ? rows[4] : [rows[4][1], rows[4][0]];
  const DX = RCX + 198, wq = on(whoAt), rq = on(riskAt), ry = RCY + PAIR + 24 * (1 - att(riskAt));
  person(DX + 58, RCY + PAIR + 6, { color: P.authority, alpha: wq, size: 0.9 });
  diamond(DX, ry, 14, { color: P.unknown, alpha: rq, solid: true });
  link(DX + 16, ry, DX + 34, ry, {
    color: P.authority,
    alpha: rq,
    upto: att(riskAt),
    end: false
  });
  link(DX - 22, ry, RCX + RR + 8, RCY, {
    route: "hvh",
    mid: RCX + MEET,
    color: P.evidence,
    alpha: rq,
    draw: { t, at: riskAt + 0.05, least: 0.9 }
  });
  growName(t, riskName, rows[4], RCX + 220 + 50 + NAME_GAP, RCY + PAIR, {
    valign: "middle",
    alpha: level(4),
    set: "report"
  });
}

// picture/film/scenes/p14/production.js
function s14Vault(s, t, vaultAts, lockAts, p3) {
  const keys = en ? [
    ["Subject, impact", "Task lead, authority"],
    "Rerun exactly",
    ["Tests, acceptance", "Observation"],
    "Rollback or degradation",
    "Security, permission",
    "Escalate, hand over, stop",
    "Current version\nand environment"
  ] : [
    ["改什么、影响谁", "谁负责、谁授权"],
    "原样重跑",
    "测试、验收和\n发布后的观察",
    ["发布窗口", "回滚或降级预案"],
    "查安全、权限\n和敏感信息",
    "上报、交人接管或停下",
    "当前的版本和环境"
  ];
  const vaultName = L(
    ["生产环境、共享资产，", "或者关键的管理流程"],
    "Production, shared assets or critical management chains"
  );
  const lastW = Math.max(...wrapName(keys.at(-1), Infinity).map((v) => measure(v)));
  const GP = L(144, 180), VX0 = 470 + (keys.length - 1) * GP + lastW / 2 + 40, VW = 140;
  const half = Math.max(...wrapName(vaultName, 480).map((v) => measure(v))) / 2, ox = 960 - (330 - 23 + VX0 + VW / 2 + half) / 2;
  const LY = 510, CX0 = 330 + ox, gx = (k) => 470 + ox + k * GP, VX = VX0 + ox, starts = lockAts.map((ats) => ats[0]);
  const shown = vaultAts.slice(1).reduce((n, at) => n + soon(t, at - 0.3, 0.35), 1), VH = 40 + 80 * shown, vy = LY - VH / 2;
  box(VX, vy, VW, VH, { fill: P.row, stroke: P.ink, alpha: p3, radius: 6, width: 2.5 });
  vaultAts.forEach((at, i) => {
    const y = LY + 80 * (i - (shown - 1) / 2), mx = VX + VW / 2, q = ramp(t, at - 0.15, 0.4) * p3;
    if (i === 0) s13Table(mx - 32, y - 24, 64, 48, { alpha: q, rows: 3, cols: 3 });
    if (i === 1) {
      box(mx - 30, y - 22, 38, 32, { stroke: P.ink, alpha: q, radius: 5 });
      box(mx - 8, y - 10, 38, 32, { fill: P.row, stroke: P.ink, alpha: q, radius: 5 });
    }
    if (i === 2) {
      stroke(
        () => [-22, 0, 22].forEach((d) => {
          ctx.moveTo(mx + d + 12, y);
          ctx.arc(mx + d, y, 12, 0, Math.PI * 2);
        }),
        { color: P.ink, alpha: q, width: 2.5 }
      );
    }
  });
  nameText(vaultName, VX + VW / 2, vy - NAME_GAP, {
    valign: "bottom",
    width: 480,
    alpha: p3 * named(t, vaultAts[0])
  });
  token(CX0, LY, { alpha: p3, r: 16 });
  nameText(L("改动", "Changes"), CX0 - 23, LY + 23 + NAME_GAP, {
    align: "left",
    valign: "top",
    alpha: p3 * named(t, cue(s, "改动", "changes"))
  });
  link(CX0 + 30, LY, VX - 12, LY, { alpha: p3, end: false });
  lockAts.forEach((ats, k) => {
    const x = gx(k), at = ats[0], q = ramp(t, at - 0.3, 0.3) * p3, open = saidShare(t, ats), up = k % 2 === 0;
    stroke(
      () => {
        ctx.moveTo(x, LY - 46);
        ctx.lineTo(x, LY - 16);
        ctx.moveTo(x, LY + 16);
        ctx.lineTo(x, LY + 46);
      },
      { color: P.evidence, alpha: q, width: 4 }
    );
    if (open < 1)
      line(x, LY - 16, x, mix(LY + 16, LY - 16, open), {
        color: P.unknown,
        alpha: q * clamp((1 - open) / 0.15),
        width: 4
      });
    ring(x, LY, 58, {
      color: P.evidence,
      alpha: speaking(t, starts, k) * restMark(P.evidence, 0.45) * p3,
      width: 2
    });
    const ky = up ? LY - 46 - NAME_GAP : LY + 46 + NAME_GAP;
    const key = Array.isArray(keys[k]) ? keys[k] : [keys[k]];
    key.forEach(
      (part, j) => nameText(part, x, ky + (up ? j - key.length + 1 : j) * labelSize(LABEL) * LEADING, {
        valign: up ? "bottom" : "top",
        width: Array.isArray(keys[k]) ? Infinity : L(300, Infinity),
        alpha: p3 * listIn(t, starts, k) * (j ? named(t, ats[Math.min(j + 1, ats.length - 1)]) : 1),
        set: "controls"
      })
    );
  });
  const passAt = lockAts.at(-1).at(-1);
  link(CX0 + 30, LY, VX - 12, LY, {
    color: P.authority,
    width: 3,
    alpha: p3,
    draw: { t, at: passAt + 0.05 }
  });
}
function s14Approval(s, t, risky, ownerAt, approveAt, agentAt, cannotAt, highCut, p4) {
  const actions = en ? [
    "High-risk use admission",
    "Permission changes",
    "Production releases",
    "Deletion or overwrite",
    "Irreversible actions"
  ] : ["高风险的用途准入", "权限变更", "生产发布", "删除覆盖", "不可逆的操作"];
  const ownerName = L("决策负责人", "Decision owner"), mayAt = cue(s, "可以在委托范围内", "may implement");
  const agentTerm = [L("智能体", "Agent")], agentQual = en ? ["may implement", " or help verify"] : ["委托范围内去做、帮忙核验"];
  const LY = 520, AY = LY + 300, OY = LY - 210, inset = 15 * 1.8 * 1.55 + NAME_GAP;
  const leftW = Math.max(
    measure(ownerName),
    measure(L("批准", "Approve")),
    42 + measure(L("不能批准", "Cannot approve")),
    measure(agentTerm[0]),
    ...agentQual.map((v) => measure(v.trim(), NOTE) - hangOf(v.trim(), "right", NOTE))
  );
  const leftBefore = Math.max(
    measure(ownerName),
    measure(L("批准", "Approve")),
    42 + measure(L("不能批准", "Cannot approve")),
    measure(agentTerm[0])
  );
  const early = en ? 0 : 66 * (1 - glide(t, risky[0] - 0.25, 66));
  const lockX = 960 + early - (300 + 18 + NAME_GAP + Math.max(...actions.map((v) => measure(v))) - inset - L(mix(leftBefore, leftW, soon(t, mayAt - 0.2, 0.5)), leftW)) / 2, mx = lockX + 300, busX = lockX + 160;
  const edge = lockX - inset;
  const approve = soon(t, approveAt + 0.05, 0.45);
  lock(lockX, LY, {
    closed: 1 - approve,
    color: blend(P.muted, P.authority, approve),
    alpha: p4 * ramp(t, approveAt - 0.15, 0.3),
    size: 1.5
  });
  nameText(L("批准", "Approve"), edge, LY, {
    align: "right",
    color: P.authority,
    alpha: p4 * named(t, approveAt)
  });
  const drop = en ? building(t, risky) : 0;
  if (!en) {
    stroke(
      () => risky.forEach((_, i) => {
        const y = LY + (i - 2) * 120;
        ctx.moveTo(mx + 13, y);
        ctx.arc(mx, y, 13, 0, Math.PI * 2);
      }),
      { color: P.muted, alpha: p4, width: 2.5 }
    );
    nameText("五类事", mx + 18 + NAME_GAP, LY - 300, {
      align: "left",
      color: P.muted,
      alpha: p4 * named(t, highCut)
    });
  }
  risky.forEach((at, i) => {
    const y = LY + (i - 2) * 120 + drop, q = ramp(t, at - 0.15, 0.4) * p4, lit = speaking(t, risky, i);
    ring(mx, y, 18, { color: P.unknown, alpha: lit * restMark(P.unknown, 0.7) * p4, width: 2 });
    dot(mx, y, 8 + 2 * lit, { color: P.unknown, alpha: q });
    link(mx - 24, y, lockX + 36, LY, {
      route: "hvh",
      mid: busX,
      alpha: q,
      width: 3,
      draw: { t, at: at - 0.1, least: 0.9 }
    });
    nameText(actions[i], mx + 18 + NAME_GAP, y, {
      align: "left",
      alpha: p4 * listIn(t, risky, i),
      set: "high-risk"
    });
  });
  const ownerFrom = en ? ownerAt : cue(s, "必须", "") - 0.2, ow = (en ? ramp(t, ownerAt - 0.15, 0.4) : 1) * p4;
  person(lockX, OY, { color: P.authority, alpha: ow, size: 1.8 });
  nameText(ownerName, edge, OY, {
    align: "right",
    color: P.authority,
    alpha: p4 * named(t, ownerFrom)
  });
  link(lockX, OY + 46, lockX, LY - 44, {
    color: P.authority,
    alpha: ow,
    draw: { t, at: approveAt - 0.1 },
    width: 2.5
  });
  const ag = ramp(t, agentAt - 0.15, 0.4) * p4, delegAt = cue(s, "委托范围内", "within its delegation");
  agent(lockX, AY, { alpha: ag });
  ring(lockX, AY, 40, {
    color: P.evidence,
    alpha: ag * ramp(t, delegAt - 0.1, 0.3),
    width: 2.5,
    draw: { t, at: delegAt + 0.05 }
  });
  termRow(t, agentTerm, [agentAt], agentQual, [mayAt], edge, AY - labelSize(LABEL) / 2, {
    width: leftW,
    inline: false,
    align: "right",
    alpha: p4,
    color: P.evidence,
    set: "agent"
  });
  const go = soon(t, cannotAt - 0.1, 0.5), barY = (AY - 32 + LY + 28) / 2, no = ramp(t, cannotAt + 0.05, 0.3);
  link(lockX, AY - 32, lockX, LY + 28, {
    alpha: ag * ramp(t, cannotAt - 0.1, 0.2),
    upto: 0.46 * go,
    end: false,
    dash: [8, 8]
  });
  line(lockX - 24, barY, lockX + 24, barY, { color: P.unknown, alpha: no * p4, width: 4 });
  rejectedName(L("不能批准", "Cannot approve"), edge - 42, barY, {
    align: "right",
    alpha: p4 * named(t, cannotAt),
    mark: no
  });
}

// picture/film/scenes/p14/track.js
function s14Track(s, t, stations, asNeeded, owner, both, oneDuty, quality, next, names, trackY, xs, trackEnd, widthOf, pA, tx, tokQ) {
  const slot = ramp(t, opening(s) + 0.2, 0.6) * pA;
  line(320, trackY, trackEnd, trackY, { color: P.muted, alpha: slot, width: 3 });
  if (tx > 321) line(320, trackY, tx, trackY, { color: P.authority, alpha: tokQ * pA, width: 4 });
  railNames(names, xs, trackY, {
    gap: (i) => NAME_GAP + 18 + (en && i % 2 ? RAIL_ROW : 0),
    alpha: (i) => pA * listIn(t, stations, i)
  });
  const above = trackY - 32 - NAME_GAP;
  nameText(L("工程负责人", "Engineering owner"), 250, above, {
    valign: "bottom",
    width: 260,
    color: P.authority,
    alpha: pA * named(t, owner)
  });
  const lastEnd = xs.at(-1) + widthOf(names.at(-1)) / 2;
  nameText(L("视工作需要", "As the work requires"), lastEnd, above, {
    align: "right",
    valign: "bottom",
    alpha: pA * named(t, asNeeded)
  });
  stations.forEach((at, i) => {
    const lit = ramp(t, at - 0.15, 0.4), pulse = 7 * span(t, both - 0.15, both + 0.9, 0.3) * (i === 2 || i === 3 ? 1 : 0);
    stroke(
      () => {
        ctx.ellipse(xs[i], trackY, 24 + pulse, 24 + pulse, -Math.PI / 2, 0, Math.PI * 2);
        if (en && i % 2) {
          ctx.moveTo(xs[i], trackY + 30 + pulse);
          ctx.lineTo(xs[i], trackY + NAME_GAP + 18 + RAIL_ROW - 6);
        }
      },
      { color: P.ink, alpha: pA * lit, width: 2.5 }
    );
  });
  const od = ramp(t, oneDuty - 0.2, 0.6) * pA, half = (i) => Math.max(60, measure(wrapName(names[i], RAIL_WRAP)[0]) / 2 + 24);
  const fx0 = xs[2] - half(2), fx1 = xs[3] + half(3);
  const em = labelSize(LABEL), row = L(0, RAIL_ROW), namesBottom = trackY + NAME_GAP + 18 + row + blockHeight(Math.max(...[2, 3].map((i) => wrapName(names[i], RAIL_WRAP).length)));
  const pad = 670 + row - namesBottom, ftop = above - em - pad;
  box(fx0, ftop, fx1 - fx0, 670 + row - ftop, {
    stroke: P.authority,
    alpha: od,
    radius: 22,
    width: 2.5
  });
  nameText(L("一份责任", "One responsibility"), (fx0 + fx1) / 2, ftop - NAME_GAP, {
    valign: "bottom",
    color: P.authority,
    alpha: pA * named(t, oneDuty)
  });
  const step = fx1 - xs[3] + 20, qq = ramp(t, quality - 0.15, 0.4) * pA, out = glide(t, next - 0.1, step), back = glide(t, next - 0.1 + glideTime(step) + 0.05, step);
  const qx = xs[3] + step * out * (1 - back);
  seal(qx, trackY, 13, { color: P.evidence, alpha: qq });
  nameText(L("质量", "Quality"), xs[3], above, {
    valign: "bottom",
    color: P.evidence,
    alpha: pA * named(t, quality)
  });
  cross(fx1 + 34, trackY - 44, 22, { alpha: ramp(t, next + 0.4, 0.3) * pA, width: 3 });
}

// picture/film/scenes/p14/scene.js
scenes["14"] = function(s, t) {
  const stations = cues(
    s,
    en ? [
      ["", "requirements"],
      ["", "design"],
      ["", "implementation"],
      ["", "verification release"],
      ["", "release"],
      ["", "operational feedback"],
      ["", "improvement"]
    ] : [
      ["需求", ""],
      ["设计", ""],
      ["实现", ""],
      ["核验发布", ""],
      ["发布", ""],
      ["运行后的改进", ""]
    ]
  );
  const asNeeded = cue(s, "视工作需要", "as the work requires");
  const [owner, result, both, oneDuty, quality, next, handing] = cues(s, [
    ["工程负责人", "engineering owners"],
    ["结果负责", "result from"],
    ["开发和核验", "development and verification"],
    ["一份责任", "one responsibility"],
    ["质量", "quality is not"],
    ["推给下一个环节", "next stage"],
    ["交出结果之前", "before handing"]
  ]);
  const rows = (en ? [
    [["", "criteria tested"]],
    [
      ["", "inputs version"],
      ["", "version"],
      ["", "environment"]
    ],
    [
      ["", "results with"],
      ["", "not covered"]
    ],
    [
      ["", "each failure"],
      ["", "its handling"]
    ],
    [
      ["", "who owns"],
      ["", "remaining risk"]
    ]
  ] : [
    [["按什么标准", ""]],
    [
      ["输入", ""],
      ["版本", ""],
      ["环境", ""]
    ],
    [
      ["结果怎样", ""],
      ["没覆盖到", ""]
    ],
    [
      ["失败或差异", ""],
      ["怎么处理", ""]
    ],
    [
      ["剩下的风险", ""],
      ["归谁", ""]
    ]
  ]).map((pairs) => cues(s, pairs));
  const groups = en ? [0, 1, 1, 2, 2] : [0, 0, 1, 2, 2];
  const vaultAts = cues(
    s,
    en ? [
      ["", "production shared"],
      ["", "shared assets"],
      ["", "critical management chains"]
    ] : [
      ["生产环境", ""],
      ["共享资产", ""],
      ["关键的管理流程", ""]
    ]
  );
  const lockAts = (en ? [
    [
      ["", "a defined subject"],
      ["", "impact"],
      ["", "task lead"],
      ["", "and authority"]
    ],
    [
      ["", "outputs that"],
      ["", "rerun exactly"]
    ],
    [
      ["", "tests acceptance"],
      ["", "acceptance"],
      ["", "operational observation"]
    ],
    [
      ["", "release window"],
      ["", "rollback or degradation"]
    ],
    [
      ["", "security"],
      ["", "permission and"],
      ["", "sensitive-data checks"]
    ],
    [
      ["", "conditions"],
      ["", "hand control"],
      ["", "or stop"]
    ]
  ] : [
    [
      ["讲明改什么", ""],
      ["影响谁", ""],
      ["谁负责", ""],
      ["谁授权", ""]
    ],
    [
      ["输出", ""],
      ["原样重跑", ""]
    ],
    [
      ["有测试", ""],
      ["验收和", ""],
      ["发布后的观察", ""]
    ],
    [
      ["有发布窗口", ""],
      ["回滚或降级预案", ""]
    ],
    [
      ["安全", ""],
      ["权限和", ""],
      ["敏感信息", ""]
    ],
    [
      ["什么时候上报", ""],
      ["交给人接管", ""],
      ["停下", ""]
    ]
  ]).map((pairs) => cues(s, pairs));
  const currentAt = cue(s, "当前的版本", "current version");
  lockAts.push([
    cue(s, "来自当前", "come from"),
    currentAt,
    cueFrom(s, "环境", "environment", currentAt)
  ]);
  const risky = cues(s, [
    ["高风险", "high-risk"],
    ["权限变更", "permission changes"],
    ["生产发布", "production releases"],
    ["删除覆盖", "deletion"],
    ["不可逆", "irreversible"]
  ]);
  const [ownerAt, approveAt, agentAt, cannotAt] = cues(s, [
    ["决策负责人", "the decision owner"],
    ["批准", "must approve"],
    ["智能体", "an agent"],
    ["不能批准", "cannot approve"]
  ]);
  const highCut = cue(s, "五类事", "the decision owner");
  const base = ramp(t, opening(s), 0.7);
  const names = en ? [
    "Requirements",
    "Design",
    "Implementation",
    "Verification",
    "Release",
    ["Operational feedback"],
    "Improvement"
  ] : ["需求", "设计", "实现", "核验", "发布", "运行后的改进"];
  const trackY = 560, [first, last] = L([440, 1640], [404, 1676]), xs = en ? names.map((_, i) => first + i * (last - first) / 6) : railStations(names, first, last, { gap: 34 });
  const trackEnd = last + 40, widthOf = (v) => Math.max(...wrapName(v, RAIL_WRAP).map((line2) => measure(line2)));
  const pA = base * stageOut(t, handing);
  const changesCut = cue(s, "改动生产环境", "changes to production") - STAGE_CUT + 0.05, handOff = stageOut(t, changesCut);
  person(250, trackY, { alpha: ramp(t, owner - 0.15, 0.5) * pA, color: P.authority });
  let tx = 320;
  stations.forEach((at, k) => {
    tx = mix(tx, xs[k], glide(t, at - 0.1, xs[k] - (k ? xs[k - 1] : 320)));
  });
  const tokQ = ramp(t, result - 0.15, 0.4) * base;
  if (pA > 0)
    s14Track(
      s,
      t,
      stations,
      asNeeded,
      owner,
      both,
      oneDuty,
      quality,
      next,
      names,
      trackY,
      xs,
      trackEnd,
      widthOf,
      pA,
      tx,
      tokQ
    );
  const pB = stageIn(t, handing) * base * handOff, resultAt = cueFrom(s, "结果", "result", handing);
  const modelName = L(["按什么标准"], ["Criteria tested"]), inputsName = en ? ["Actual inputs", ", version", ", environment"] : ["实际的输入", "、版本", "和环境"];
  const failName = en ? ["Each failure", ", its handling"] : ["每个失败或差异", "怎么处理"], riskName = en ? ["Remaining risk", " and its owner"] : ["剩下的风险", "归谁"];
  const TW = 76, RR = 64, PAIR = 45, OUT = en ? 270 : 296, MEET = 112;
  const widest = (parts, width) => Math.max(
    ...growTexts(parts, width).map((line2) => line2.reduce((w, [, v]) => w + measure(v), 0))
  );
  const reportLeft = -OUT - NAME_GAP - Math.max(measure(modelName.join("")), en ? 0 : widest(inputsName, 480));
  const firstRight = Math.max(
    reportLeft + measure(L("交出结果之前，讲清三件事", "Before handing over")),
    RR + 8
  );
  const inputsRight = Math.max(firstRight, en ? TW + NAME_GAP + widest(inputsName, 480) : 0);
  const wholeRight = Math.max(
    inputsRight,
    220 + 50 + NAME_GAP + Math.max(widest(failName, 480), measure(riskName.join("")))
  );
  const centreOn = (right) => 960 - (reportLeft + right) / 2, third = cue(s, "每个失败或差异", "each failure");
  const toInputs = centreOn(inputsRight) - centreOn(firstRight), toWhole = centreOn(wholeRight) - centreOn(inputsRight);
  const docked = t >= handing + STAGE_CUT, RCY = 550, RCX = centreOn(firstRight) + toInputs * glide(t, rows[1][0] - 0.3, toInputs) + toWhole * glide(t, third - 0.3, toWhole);
  if (pB > 0)
    s14Handover(
      t,
      handing,
      rows,
      groups,
      pB,
      resultAt,
      modelName,
      inputsName,
      failName,
      riskName,
      TW,
      RR,
      PAIR,
      OUT,
      MEET,
      widest,
      reportLeft,
      RCY,
      RCX
    );
  token(docked ? RCX : tx, docked ? RCY : trackY, { alpha: tokQ * handOff, r: docked ? 24 : 10 });
  const p3 = stageIn(t, changesCut) * base * stageOut(t, highCut);
  if (p3 > 0) s14Vault(s, t, vaultAts, lockAts, p3);
  const p4 = stageIn(t, highCut) * base;
  if (p4 <= 0) return;
  s14Approval(s, t, risky, ownerAt, approveAt, agentAt, cannotAt, highCut, p4);
};

// picture/film/scenes/p15/scene.js
scenes["15"] = function(s, t) {
  const [commitment, owner, condition, chain] = cues(s, [
    ["承诺", "the commitment"],
    ["负责人", "owner"],
    ["完成条件摆到明面上", "completion condition visible"],
    ["是一条信任链", "is a chain of trust"]
  ]);
  const links = cues(s, [
    ["先明确决策负责人是谁", "name the decision owner"],
    ["答应交什么", "agree on the deliverable"],
    ["只在范围里动手", "act only within it"],
    ["拿出当前的证据", "produce current evidence"],
    ["只说证据撑得住的话", "claim only what it supports"],
    ["最后验收", "then accept and learn"]
  ]);
  const [lighter, skip, before] = cues(s, [
    ["手续可以随风险变轻", "lower risk allows less process"],
    ["这条链", "cannot skip a link"],
    ["改动之前", "before changing anything"]
  ]);
  const checks = cues(s, [
    ["改的是哪个对象", "target"],
    ["哪个版本", "version"],
    ["在哪个环境", "environment"],
    ["现状如何", "current state"],
    ["有没有并行的工作", "concurrent work"],
    ["怎么恢复", "recovery path"]
  ]);
  const [scope, record] = cues(s, [
    ["范围或风险有了实质变化", "if scope or risk changes"],
    ["记进现有的工作记录", "existing work record"]
  ]);
  const decider = cueFrom(s, "决策负责人", "the decision owner", scope);
  const base = ramp(t, opening(s), 0.7);
  const [acting, visibleAt] = cues(s, [
    ["动手之前", "before acting"],
    ["摆到明面上", "visible"]
  ]);
  const seats = clearOfTitle(s, t, 375) * base * stageOut(t, chain);
  if (seats > 0) {
    const xs = [460, 780, 1100], y = 440, sy = 566, AX = 1540, BX = 1320, at = [commitment, owner, condition], q = (i) => ramp(t, at[i] - 0.1, 0.45) * seats;
    const open = soon(t, visibleAt + 0.05, Math.min(0.5, thoughtEnd(visibleAt) - visibleAt - 0.1));
    const act = seats * ramp(t, acting - 0.45, 0.45);
    ring(AX, y, 54, { color: P.ink, alpha: act, width: 3 });
    path(
      [
        [AX - 14, y - 24],
        [AX + 26, y],
        [AX - 14, y + 24],
        [AX - 14, y - 24]
      ],
      { color: P.ink, alpha: act, width: 3 }
    );
    nameText(L("动手", "Acting"), AX, sy + 17 + NAME_GAP, {
      valign: "top",
      alpha: seats * named(t, acting)
    });
    line(BX, y - 56, BX, y + 56, { color: P.unknown, alpha: act * (1 - open), width: 4 });
    link(xs[2] + 70, y, AX - 66, y, {
      alpha: seats * ramp(t, visibleAt + 0.05, 0.3),
      draw: { t, at: visibleAt + 0.05 },
      flowing: since(t, visibleAt + 0.75)
    });
    documentIcon(xs[0] - 50, y - 65, 100, 130, { alpha: q(0), rows: 3 });
    dot(xs[0] + 28, y + 36, 13, { color: P.authority, alpha: q(0) });
    person(xs[1], y + 10, { alpha: q(1), color: P.authority, size: 1.5 });
    box(xs[2] - 55, y - 55, 110, 110, { fill: P.row, stroke: P.evidence, alpha: q(2), radius: 10 });
    check(xs[2], y + 4, 48, { alpha: q(2), upto: clamp((t - condition - 0.1) / 0.35) });
    xs.forEach((x, i) => {
      dot(x, sy, 9, { color: i === 1 ? P.authority : P.evidence, alpha: q(i) });
      const lit = speaking(t, at, i);
      if (lit > 0)
        ring(x, sy, 17, {
          color: i === 1 ? P.authority : P.evidence,
          alpha: lit * restMark(i === 1 ? P.authority : P.evidence, 0.5) * seats,
          width: 2
        });
    });
    railNames(
      en ? ["Commitment", "Owner", "Completion condition"] : ["承诺", "负责人", "完成条件"],
      xs,
      sy,
      { gap: 17 + NAME_GAP, wrap: 320, alpha: (i) => seats * listIn(t, at, i), set: "visible" }
    );
  }
  const ch = base * stageIn(t, chain) * stageOut(t, before);
  if (ch > 0) {
    const names = en ? [
      ["Decision owner and subject"],
      ["Deliverable and its scope"],
      ["Act only within scope"],
      ["Current evidence"],
      ["Only supported claims"],
      ["Accept and learn"]
    ] : [
      ["决策负责人、针对什么"],
      ["答应交什么、范围到哪"],
      ["只在范围里"],
      ["当前的证据"],
      ["只说证据撑得住的"],
      ["验收、总结"]
    ];
    const pitch = L(272, 254), Y = 500, H = 92, xs = names.map((_, i) => L(280, 325) + i * pitch), W = pitch + 26;
    const thin = soon(t, lighter + 0.05, 1.1), h = mix(H, 62, thin), sw = mix(4, 2.5, thin);
    const railQ = ch * named(t, chain);
    dot(xs[0] - W / 2, Y, 6, { color: P.muted, alpha: railQ });
    link(xs[0] - W / 2, Y, xs[5] + W / 2, Y, { color: P.muted, alpha: railQ, width: 3 });
    names.forEach((_, i) => {
      const x = xs[i], q = ramp(t, links[i] - 0.1, 0.45) * ch, lit = speaking(t, links, i), color = i === 5 ? P.authority : P.evidence;
      stroke(
        () => {
          ctx.roundRect(x - W / 2, Y - h / 2, W, h, h / 2);
          if (i % 2) {
            ctx.moveTo(x, Y + h / 2);
            ctx.lineTo(x, Y + H / 2 + NAME_GAP + RAIL_ROW - 6);
          }
        },
        { color, alpha: q, width: sw + 1.5 * lit }
      );
    });
    railNames(names, xs, Y + H / 2, {
      gap: (i) => NAME_GAP + (i % 2 ? RAIL_ROW : 0),
      alpha: (i) => ch * listIn(t, links, i),
      set: "chain"
    });
    termRow(
      t,
      [L("信任链", "Chain of trust")],
      [chain],
      [L("手续可以随风险变轻", "Lower risk allows less process")],
      [lighter],
      xs[0] - W / 2,
      Y - H / 2 - NAME_GAP - labelSize(LABEL),
      { width: 900, alpha: ch, color: P.evidence }
    );
    const top = Y - h / 2 - 12, mid = Y - 168, skipWords = cue(s, "一环都不能少", "skip a link"), stopAt = skipWords + 0.05;
    const run = (top - mid) * 2 + (xs[4] - xs[2]), stop = (top - mid + (xs[3] - xs[2]) - 12) / run;
    link(xs[2], top, xs[4], top, {
      route: "vhv",
      mid,
      color: P.unknown,
      alpha: ch * ramp(t, skip - 0.05, 0.3),
      upto: stop,
      draw: { t, at: skip - 0.05, least: stopAt - skip + 0.05 },
      end: false,
      dash: [8, 8],
      width: 2.5
    });
    line(xs[3], mid - 24, xs[3], mid + 24, {
      color: P.unknown,
      alpha: ramp(t, stopAt, 0.25) * ch,
      width: 4
    });
    if (en)
      rejectedName("Skip a link", xs[3], mid - 24 - NAME_GAP, {
        valign: "bottom",
        alpha: ch * named(t, skipWords),
        mark: ramp(t, stopAt, 0.25)
      });
    else
      nameText("一环都不能少", xs[3], mid - 24 - NAME_GAP, {
        valign: "bottom",
        alpha: ch * named(t, skipWords)
      });
  }
  const lean = L(56, 81), cx = 960 - lean * (glide(t, checks[1] - 0.1, lean) - glide(t, checks[4] - 0.1, lean));
  const four = base * stageIn(t, before) * stageOut(t, scope);
  if (four > 0) {
    const cy = 500, rx = 400, ry = 250;
    const names = en ? ["Target", "Version", "Environment", "Current state", "Concurrent work", "Recovery path"] : ["哪个对象", "哪个版本", "哪个环境", "现状如何", "并行的工作", "怎么恢复"];
    stroke(
      () => [0, 1, 2, 3, 4, 5].forEach((i) => {
        const a0 = -Math.PI / 2 + i * Math.PI / 3 + 0.09, a1 = a0 + Math.PI / 3 - 0.18;
        Array.from({ length: 17 }, (_, k) => a0 + (a1 - a0) * k / 16).forEach(
          (a, k) => (k ? ctx.lineTo : ctx.moveTo).call(ctx, cx + Math.cos(a) * rx, cy + Math.sin(a) * ry)
        );
      }),
      { color: P.muted, alpha: four, width: 3 }
    );
    path(
      [
        [cx, cy - 62],
        [cx + 58, cy + 38],
        [cx - 58, cy + 38],
        [cx, cy - 62],
        [cx + 58, cy + 38]
      ],
      { color: P.ink, alpha: four, width: 3 }
    );
    nameText(L("改动之前", "Before changing anything"), cx, cy + 38 + NAME_GAP, {
      valign: "top",
      alpha: four * named(t, before)
    });
    checks.forEach((at, i) => {
      const a = -Math.PI / 2 + i * Math.PI / 3, x = cx + Math.cos(a) * rx, y = cy + Math.sin(a) * ry, q = ramp(t, at - 0.1, 0.4) * four;
      const lit = speaking(t, checks, i);
      dot(x, y, 17, { color: P.ground, alpha: q });
      dot(x, y, 17, { color: P.evidence, alpha: q, hollow: true, width: 3 });
      check(x, y + 1, 18, { alpha: q, upto: clamp((t - at) / 0.3) });
      if (lit > 0)
        ring(x, y, 26, {
          color: P.evidence,
          alpha: lit * restMark(P.evidence, 0.5) * four,
          width: 2
        });
      radialName(names[i], cx, cy, rx + 17, a, {
        ry: ry + 17,
        alpha: four * listIn(t, checks, i),
        set: "checks"
      });
    });
  }
  const five = base * stageIn(t, scope);
  if (five > 0) {
    const back = cue(s, "回头找", "return to"), changed = cueFrom(s, "变化", "the change", decider), decided = cueFrom(s, "决定", "decision", changed);
    const ownerAt = cue(s, "就回头找", "return to");
    const writing = cue(s, "把变化", "record the change");
    const DX = 740, dy = 590, oy = 300, ry = 515, rw = 120, rh = 150, under = dy + 110 + NAME_GAP;
    const RX = 1920 - (DX - 130) - rw - NAME_GAP - Math.max(...(en ? ["Change", "Decision"] : ["变化", "决定"]).map((v) => measure(v)));
    const apart = glide(t, writing + 0.05, 960 - DX), dx = mix(960, DX, apart), rx = RX + dx - DX, ox = mix(960, (DX + RX + rw / 2) / 2, apart);
    const widen = soon(t, cue(s, "实质变化", "changes materially") + 0.05, 0.6), fw = mix(210, 260, widen), fh = mix(180, 216, widen);
    box(dx - fw / 2, dy - fh / 2, fw, fh, { stroke: P.muted, alpha: five, radius: 14, width: 3 });
    path(
      [
        [dx, dy - 50],
        [dx + 50, dy + 36],
        [dx - 50, dy + 36],
        [dx, dy - 50],
        [dx + 50, dy + 36]
      ],
      { color: P.unknown, alpha: five, width: 3 }
    );
    nameText(en ? "Material change of scope or risk" : ["范围或风险", "有了实质变化"], dx, under, {
      valign: "top",
      width: 360,
      alpha: five * named(t, scope)
    });
    const own = ramp(t, ownerAt - 0.1, 0.45) * five;
    person(ox, oy, { alpha: own, color: P.authority, size: 1.5 });
    nameText(L("决策负责人", "Decision owner"), ox, oy - 52 - NAME_GAP, {
      valign: "bottom",
      color: P.authority,
      alpha: five * named(t, ownerAt)
    });
    link(dx, dy - fh / 2 - 12, ox - 44 * apart, mix(oy + 46, oy, apart), {
      route: "vh",
      color: P.authority,
      alpha: five,
      width: 2.5,
      draw: { t, at: back - 0.05 },
      flowing: since(t, back + 0.85),
      span: Math.abs((DX + RX + rw / 2) / 2 - 44 - DX) + (dy - 216 / 2 - 12 - oy)
    });
    const kept = named(t, record), held = five * named(t, writing);
    documentIcon(rx, ry, rw, rh, { alpha: held, rows: 0 });
    stroke(
      () => [
        [30, 0.62],
        [50, 0.42]
      ].forEach(([d, w]) => {
        ctx.moveTo(rx + 18, ry + d);
        ctx.lineTo(rx + 18 + rw * w, ry + d);
      }),
      { color: P.muted, alpha: held * 0.8, width: 2 }
    );
    nameText(L("现有的工作记录", "Existing work record"), rx + rw / 2, under, {
      valign: "top",
      alpha: five * kept
    });
    const rows = [
      [dy, P.ink, changed],
      [dy + 48, P.authority, decided]
    ];
    link(dx + fw / 2 + 12, dy, rx - 14, dy, { alpha: five, draw: { t, at: changed - 0.05 } });
    link(ox + 44, oy, rx + rw / 2, ry - 12, {
      route: "hv",
      color: P.authority,
      alpha: five,
      width: 2.5,
      draw: { t, at: decided - 0.05 }
    });
    const recAts = [changed, decided];
    rows.forEach(([y, color, at], i) => {
      const lit = speaking(t, recAts, i);
      line(rx + 18, y, mix(rx + 18, rx + rw - 22, clamp((t - at - 0.6) / 0.4)), y, {
        color,
        alpha: five * ramp(t, at + 0.55, 0.2),
        width: 3 + 1.5 * lit
      });
      nameText(en ? ["Change", "Decision"][i] : ["变化", "决定"][i], rx + rw + NAME_GAP, y, {
        align: "left",
        color: i ? P.authority : P.ink,
        alpha: five * listIn(t, recAts, i),
        set: "recorded"
      });
    });
  }
};

// picture/film/scenes/p16/scene.js
scenes["16"] = function(s, t) {
  const [report, effortWord, unframed, planned, executing, awaiting] = cues(s, [
    ["说做到哪一步", "report the state"],
    ["不说花了多少力气", "not the effort"],
    ["叫未界定", "work is unframed"],
    ["叫已计划", "it is planned"],
    ["叫执行中", "it is executing"],
    ["叫待核验", "awaiting verification"]
  ]);
  const verified = cue(s, "叫已核验", "verified", { last: true });
  const [accepted, published, inUse, observed, almost, almostWord, blocked] = cues(s, [
    ["才叫已验收", "accepted"],
    ["发布到约定的地方", "published at the agreed destination"],
    ["有人在用", "mean in use"],
    ["实际看到了什么", "actually observed"],
    ["别把执行中", "work that's executing"],
    ["快做完了", "almost done"],
    ["受阻时", "when blocked"]
  ]);
  const base = ramp(t, opening(s), 0.7), firstCondition = cue(s, "问题", "the problem");
  const RY = 620, xs = [320, 576, 832, 1088, 1344, 1600], CW = 150, CH = 110, CT = RY - 24 - CH;
  const card = (x, a) => box(x - CW / 2, CT, CW, CH, { fill: P.row, stroke: P.ink, alpha: a, radius: 10, width: 2.5 });
  const one = base * stageOut(t, firstCondition);
  if (one > 0) {
    const on = one * named(t, report);
    line(xs[0] - 140, RY, xs[5] + 140, RY, { color: P.muted, alpha: on, width: 3 });
    nameText(L("做到哪一步", "State"), xs[0], RY + NAME_GAP + 18, {
      valign: "top",
      color: P.evidence,
      alpha: on
    });
    const BX = 560, BW = 1100, BY = 420, refuse = ramp(t, effortWord + 0.05, 0.3), bar = one * mix(1, 0.6, refuse);
    box(BX, BY - 25, BW, 50, { stroke: P.muted, alpha: bar, radius: 25 });
    box(BX, BY - 25, BW * 0.9, 50, { fill: blend(P.ground, P.line, 0.85), alpha: bar, radius: 25 });
    text("90%", BX + BW * 0.45, BY + 1, 26, {
      role: "mark",
      align: "center",
      color: P.ink,
      alpha: one * mix(1, 0.75, refuse)
    });
    rejectedName(L("花了多少力气", "Effort"), BX, BY - 25 - NAME_GAP, {
      align: "left",
      valign: "bottom",
      alpha: one * named(t, effortWord),
      mark: refuse
    });
  }
  const two = base * stageIn(t, firstCondition) * stageOut(t, published);
  if (two > 0) {
    const ats = [unframed, planned, executing, awaiting, verified, accepted], colors = [P.ink, P.ink, P.ink, P.evidence, P.evidence, P.authority];
    const parts = cues(s, [
      ["问题", "the problem"],
      ["范围", "scope"],
      ["怎样算完成", "completion condition"]
    ]);
    const [routeAt, ownerAt, underWay, unchecked, made, passed, acceptor, confirmed] = cues(s, [
      ["有了做法", "a route"],
      ["负责人", "owner"],
      ["正在做", "under way"],
      ["核验还没通过", "checks have not passed"],
      ["交付物有了", "the deliverable"],
      ["核验通过了", "checks passed"],
      ["有授权的验收人", "an authorized acceptor"],
      ["确认了", "confirmed by"]
    ]);
    const versionAt = cue(s, "版本", "version"), holdsFor = [
      cue(s, "讲明的对象", "subject"),
      versionAt,
      cue(s, "环境", "environment"),
      cueFrom(s, "限度", "limit", versionAt)
    ];
    let x = xs[0];
    ats.forEach((at, k) => {
      if (k) x = mix(x, xs[k], glide(t, at + 0.05, xs[k] - xs[k - 1]));
    });
    line(xs[0] - 140, RY, xs[5] + 140, RY, { color: P.muted, alpha: two, width: 3 });
    const route = drawShare(t, routeAt + 0.05, xs[5] - xs[0]);
    if (route > 0)
      line(xs[0], RY, mix(xs[0], xs[5], route), RY, { color: P.ink, alpha: two, width: 3 });
    ats.forEach((at, k) => {
      dot(xs[k], RY, 11, { color: colors[k], alpha: named(t, at) * two });
      ring(xs[k], RY, 21, {
        color: colors[k],
        alpha: speaking(t, ats, k) * restMark(colors[k], 0.6) * two,
        width: 2
      });
    });
    railNames(
      en ? ["Unframed", "Planned", "Executing", ["Awaiting verification"], "Verified", "Accepted"] : ["未界定", "已计划", "执行中", "待核验", "已核验", "已验收"],
      xs,
      RY,
      { alpha: (i) => two * listIn(t, ats, i), color: (i) => colors[i], set: "states" }
    );
    const GX = (xs[3] + xs[4]) / 2, GT = CT - 92, MY = GT - 60, gate = named(t, unchecked) * two, open = drawShare(t, passed + 0.05, RY + 26 - GT, 0.6), tick = ramp(t, passed + 0.05, 0.4);
    line(GX, MY + 20, GX, GT, { color: P.line, alpha: gate, width: 3 });
    if (open < 1)
      line(GX, GT, GX, mix(RY + 26, GT, open), {
        color: P.unknown,
        alpha: gate * clamp((1 - open) / 0.15),
        width: 4
      });
    ring(GX, MY, 20, { color: P.line, alpha: gate * (1 - tick), width: 2.5 });
    ring(GX, MY, 20, { color: P.evidence, alpha: gate * tick, width: 3 });
    check(GX, MY + 1, 20, { alpha: gate, upto: tick });
    const SR = 31 + 1, checksName = L("核验", "Checks"), groupMid = GX + (NAME_GAP + measure(checksName)) / 2;
    nameText(checksName, GX + SR + NAME_GAP, MY, { align: "left", alpha: gate });
    holdsFor.forEach(
      (at, k) => path(
        Array.from({ length: 9 }, (_, j) => {
          const a = -Math.PI / 2 + k * Math.PI / 2 + 0.08 + j * (Math.PI / 2 - 0.16) / 8;
          return [GX + 31 * Math.cos(a), MY + 31 * Math.sin(a)];
        }),
        { color: P.evidence, alpha: gate * ramp(t, at - 0.1, 0.3), width: 2, dash: [5, 5] }
      )
    );
    const bounds = L(
      ["讲明的对象", "、版本", "、环境", "和限度"],
      ["Subject", ", version", ", environment", " and limit"]
    );
    growName(t, bounds, holdsFor, groupMid - measure(bounds.join("")) / 2, MY - SR - NAME_GAP, {
      valign: "bottom",
      color: P.evidence,
      alpha: two
    });
    const busy = ramp(t, underWay + 0.05, 0.3) * (1 - ramp(t, made + 0.05, 0.3)) * two;
    if (busy > 0)
      for (let k = 0; k < 3; k++) {
        const a = voiceTime(t) * 2.4 + k * 2.09;
        stroke(() => ctx.arc(x, CT + CH / 2, 82, a, a + 1.2), {
          color: P.ink,
          alpha: busy * 0.8,
          width: 2.5
        });
      }
    card(x, two);
    const framed = soon(t, routeAt + 0.05, 0.5), lx = x - CW / 2 + 20;
    parts.forEach((at, k) => {
      const y = CT + 22 + k * 24, w = [100, 74, 90][k];
      box(lx, y - 8, w, 16, {
        stroke: P.unknown,
        alpha: named(t, at) * (1 - framed) * two,
        radius: 4,
        width: 2,
        dash: [5, 5]
      });
      if (framed > 0) line(lx, y, lx + w * framed, y, { color: P.ink, alpha: two, width: 4 });
    });
    growName(
      t,
      L(["问题", "、范围", "或怎样算完成"], ["The problem", ", scope", " or completion condition"]),
      parts,
      xs[0] - CW / 2,
      CT - NAME_GAP - 64 * soon(t, routeAt + 0.05, 0.6),
      { valign: "bottom", color: P.unknown, alpha: two }
    );
    person(x - CW / 2 - 38, RY - 27, { alpha: named(t, ownerAt) * two });
    s17Page(x - 32, CT - 76, 64, 84, { alpha: named(t, made) * two, rows: 3 });
    const stamp = ramp(t, Math.max(acceptor, confirmed) + 0.05, 0.3) * two;
    if (stamp > 0) {
      dot(x, CT - 32, 23, { color: P.row, alpha: stamp });
      seal(x, CT - 32, mix(30, 22, stamp), { alpha: stamp });
    }
    person(xs[5] + CW / 2 + 44, RY - 27, {
      color: P.authority,
      alpha: named(t, acceptor) * two,
      size: 1.1
    });
  }
  const three = base * stageIn(t, published) * stageOut(t, almost);
  if (three > 0) {
    const fy = 380, fh = 190, fw = 300, lx = 450, ax = 1170, mid = fy + fh / 2, ex = ax + fw / 2, ey = fy + fh + 80;
    const notSame = cue(s, "不代表", "does not mean"), use = ramp(t, notSame - 0.15, 0.4);
    box(lx, fy, fw, fh, { stroke: P.ink, alpha: three, radius: 10 });
    box(ax, fy, fw, fh, { stroke: P.evidence, alpha: three * use, radius: 10 });
    nameText(L("发布到约定的地方", "Published at the agreed destination"), lx, fy - NAME_GAP, {
      align: "left",
      valign: "bottom",
      width: 480,
      alpha: three * named(t, published)
    });
    nameText(L("有人在用", "In use"), ax, fy - NAME_GAP, {
      align: "left",
      valign: "bottom",
      color: P.evidence,
      alpha: three * named(t, inUse)
    });
    documentIcon(lx + fw / 2 - 42, mid - 54, 84, 108, {
      alpha: three * ramp(t, published - 0.1, 0.4),
      rows: 3
    });
    documentIcon(ax + fw / 2 - 92, mid - 54, 84, 108, { alpha: three * use, rows: 3 });
    person(ax + fw / 2 + 80, mid + 6, { alpha: three * use, color: P.evidence, size: 1.3 });
    const go = soon(t, notSame - 0.05, 0.6);
    link(lx + fw + 12, mid, ax - 12, mid, {
      color: P.unknown,
      alpha: three * ramp(t, notSame - 0.05, 0.3),
      upto: 0.46 * go,
      end: false,
      dash: [8, 8]
    });
    line(960, mid - 30, 960, mid + 30, {
      color: P.unknown,
      alpha: ramp(t, notSame + 0.3, 0.3) * three,
      width: 4
    });
    nameText(L("不代表", "does not mean"), 960, mid + 30 + NAME_GAP, {
      valign: "top",
      size: NOTE,
      color: P.muted,
      alpha: three * named(t, notSame)
    });
    const eye = ramp(t, observed - 0.15, 0.4) * three, lid = soon(t, observed - 0.15, 0.6), look = Math.sin((voiceTime(t) - voiceTime(observed)) * 2.2) * 8 * lid;
    stroke(() => ctx.ellipse(ex, ey, 40, mix(4, 20, lid), 0, 0, Math.PI * 2), {
      color: P.evidence,
      alpha: eye,
      width: 2.5
    });
    dot(ex + look, ey, 8 * lid, { color: P.evidence, alpha: eye });
    link(ex, ey - 28, ex, fy + fh + 10, {
      color: P.evidence,
      alpha: eye,
      draw: { t, at: observed - 0.05 }
    });
    nameText(L("实际看到了什么", "What was actually observed"), ex, ey + 22 + NAME_GAP, {
      valign: "top",
      color: P.evidence,
      alpha: three * named(t, observed)
    });
  }
  const four = base * stageIn(t, almost);
  if (four > 0) {
    const AY = 430, TX = 880, BAR = 942, called = cueFrom(s, "执行中", "executing", almost);
    const [gapAt, impactAt, escAt] = cues(s, [
      ["缺什么", "the gap"],
      ["影响什么", "its impact"],
      ["报给了谁", "the escalation"]
    ]);
    line(300, AY, TX, AY, { color: P.muted, alpha: four, width: 3 });
    dashed(TX, AY, 1620, AY, { color: P.muted, alpha: four, width: 3 });
    const halted = mix(0.8, 0, ramp(t, blocked + 0.05, 0.4));
    for (let k = 0; k < 3; k++) {
      const a = voiceTime(Math.min(t, blocked + 0.05)) * 2.4 + k * 2.09;
      stroke(() => ctx.arc(TX, AY, 32, a, a + 1.2), {
        color: P.ink,
        alpha: four * halted,
        width: 2.5
      });
    }
    box(TX - 17, AY - 17, 34, 34, { fill: P.ink, alpha: four, radius: 7 });
    const head = nameText(L("执行中", "Executing"), TX, AY - 40 - NAME_GAP, {
      valign: "bottom",
      alpha: four * named(t, called)
    });
    const wide = measure(L("执行中", "Executing"), LABEL);
    rejectedName(
      L("“快做完了”", "“Almost done”"),
      TX + wide / 2 + 48,
      (head.top + head.bottom) / 2,
      { align: "left", alpha: four * named(t, almostWord), mark: ramp(t, almostWord + 0.5, 0.4) }
    );
    line(BAR, AY - 34, BAR, AY + 34, {
      color: P.unknown,
      alpha: ramp(t, blocked + 0.05, 0.3) * four,
      width: 4
    });
    const ats = [gapAt, impactAt, escAt], tops = stackTops(
      [0, 1, 2].map(() => labelSize(LABEL)),
      585,
      40
    ), ys = tops.map((v) => v + labelSize(LABEL) / 2);
    const reach = ys.reduce((y, to, i) => mix(y, to, soon(t, ats[i] - 0.1, 0.45)), AY + 40);
    if (reach > AY + 41) line(TX, AY + 40, TX, reach, { color: P.line, alpha: four, width: 2 });
    const report2 = en ? ["The gap", "Its impact", "The escalation"] : ["缺什么", "影响什么", "报给了谁"];
    ys.forEach((y, i) => {
      dot(TX, y, 10, { color: P.unknown, alpha: ramp(t, ats[i] - 0.1, 0.3) * four });
      ring(TX, y, 19, {
        color: P.unknown,
        alpha: speaking(t, ats, i) * restMark(P.unknown, 0.6) * four,
        width: 2
      });
      nameText(report2[i], TX + 10 + NAME_GAP + 8, y, {
        align: "left",
        alpha: four * listIn(t, ats, i),
        set: "blocked report"
      });
    });
    const escEnd = TX + 40 + measure(report2[2], LABEL) + 24, PX = 1400;
    link(escEnd, ys[2], PX - 40, ys[2], {
      color: P.authority,
      alpha: four * ramp(t, escAt - 0.05, 0.3),
      draw: { t, at: escAt - 0.05 }
    });
    person(PX, ys[2] + 4, {
      color: P.authority,
      alpha: four * ramp(t, escAt + 0.3, 0.4),
      size: 1.1
    });
  }
};

// picture/film/drawing/gears.js
function s29Teeth(x, y, r, turn, { alpha = 1, color = P.ink } = {}) {
  stroke(
    () => {
      for (let k = 0; k < 10; k++) {
        const a = k * Math.PI / 5 + Math.PI / 10 + turn;
        ctx.moveTo(x + Math.cos(a) * r, y + Math.sin(a) * r);
        ctx.lineTo(x + Math.cos(a) * (r + r * 0.24), y + Math.sin(a) * (r + r * 0.24));
      }
    },
    { color, alpha, width: r * 0.12, cap: "butt" }
  );
}
function s29Gear(x, y, r, { turn = 0, alpha = 1, color = P.ink } = {}) {
  s29Teeth(x, y, r, turn, { color, alpha });
  ring(x, y, r, { color, alpha, width: r * 0.06 });
  ring(x, y, r * 0.26, { color, alpha, width: 4 });
}
function s29Wheel(x, y, r, { turn = 0, alpha = 1, color = P.ink } = {}) {
  s29Teeth(x, y, r, turn, { color, alpha });
  ring(x, y, r, { color, alpha, width: r * 0.06, start: Math.PI / 10 + turn + 0.03, upto: 0.99 });
  ring(x, y, r * 0.26, { color, alpha, width: 4 });
}

// picture/film/scenes/p17/claim.js
function s17Questions(s, t, questions, g2) {
  const [claimed, about, versionAt, covered2, unproved] = cues(s, [
    ["说的是哪个对象", "what is claimed"],
    ["哪个对象", "about which subject"],
    ["哪个版本", "version"],
    ["覆盖了什么", "covering what"],
    ["还有什么没证明", "leaving what unproved"]
  ]);
  const [who, when, how] = [
    ["谁", "by whom"],
    ["什么时候", "when"],
    ["什么方法", "how"]
  ].map(([a, b]) => cueFrom(s, a, b, questions));
  const CW = 700, CH = 290, CT = 355, CY = CT + CH / 2, OW = 320, OH = 120, OT = CY - OH / 2;
  const signW = Math.max(
    ...[L("谁", "By whom"), L("什么时候", "When"), L("什么方法", "How")].map((v) => measure(v))
  );
  const pairLean = (110 + OW) / 2, wholeLean = (OW + 110 - 196 - signW) / 2;
  const CL = 960 - CW / 2 - pairLean * glide(t, about + 0.05, pairLean) + (pairLean - wholeLean) * glide(t, Math.min(who, when, how) + 0.05, pairLean - wholeLean), OL = CL + CW + 110;
  const on = named(t, questions) * g2;
  box(CL, CT, CW, CH, { fill: P.row, stroke: P.ink, alpha: on, radius: 14, width: 2.5 });
  nameText(L("每次说完成", "Every completion claim"), CL + CW / 2, CT - NAME_GAP, {
    valign: "bottom",
    alpha: on
  });
  ring(CL + 120, CY, 66, { color: P.evidence, alpha: on, width: 3.5 });
  check(CL + 120, CY + 3, 60, { alpha: on });
  [400, 320, 360].forEach((w, k) => {
    const y = CY - 80 + k * 80, lit = soon(t, claimed + 0.05 + k * 0.2, 0.4);
    line(CL + 230, y, CL + 230 + w, y, {
      color: blend(P.muted, P.ink, lit),
      alpha: on,
      width: 6
    });
  });
  const signs = [
    ["who", who, L("谁", "By whom")],
    ["when", when, L("什么时候", "When")],
    ["how", how, L("什么方法", "How")]
  ].sort((a, b) => a[1] - b[1]);
  const signAts = signs.map(([, at]) => at), IX = CL - 140;
  signs.forEach(([kind, at, v], i) => {
    const y = CY + (i - 1) * 80, q = named(t, at) * g2;
    if (kind === "who") person(IX, y + 4, { alpha: q, size: 0.85 });
    if (kind === "when") clock(IX, y, 22, { hand: 0.3, alpha: q });
    if (kind === "how") s29Gear(IX, y, 21, { alpha: q });
    link(IX + 34, y, CL - 12, y, { alpha: q, draw: { t, at: at + 0.05 } });
    nameText(v, IX - 34 - NAME_GAP, y, {
      align: "right",
      alpha: g2 * listIn(t, signAts, i),
      set: "signed"
    });
  });
  const pin = named(t, about) * g2, PY = CY;
  link(CL + CW, PY, OL - 12, PY, { alpha: g2, draw: { t, at: about + 0.05 } });
  box(OL, OT, OW, OH, { fill: P.row, stroke: P.ink, alpha: pin, radius: 8, width: 2.5 });
  stroke(
    () => {
      for (let c = 1; c < 5; c++) {
        ctx.moveTo(OL + c * OW / 5, OT);
        ctx.lineTo(OL + c * OW / 5, OT + OH);
      }
    },
    { color: P.line, alpha: pin, width: 1.5 }
  );
  nameText(L("哪个对象", "Subject"), OL + OW / 2, OT + OH + NAME_GAP, {
    valign: "top",
    alpha: pin
  });
  const tag = named(t, versionAt) * g2;
  text("v2", OL + OW - 6, OT - 20, 26, {
    role: "mark",
    align: "right",
    color: P.evidence,
    alpha: tag
  });
  const cover = named(t, covered2) * g2, open = named(t, unproved) * g2;
  for (let c = 0; c < 5; c++) {
    const x = OL + c * OW / 5 + 7, w = OW / 5 - 14;
    if (c < 3) {
      box(x, OT + 8, w, OH - 16, { fill: P.evidence, alpha: cover * 0.16, radius: 5 });
      box(x, OT + 8, w, OH - 16, { stroke: P.evidence, alpha: cover, radius: 5, width: 2.5 });
    } else {
      box(x, OT + 8, w, OH - 16, {
        stroke: P.unknown,
        alpha: open,
        radius: 5,
        width: 2,
        dash: [6, 6]
      });
      text("?", x + w / 2, PY + 1, 26, {
        role: "mark",
        align: "center",
        color: P.unknown,
        alpha: open
      });
    }
  }
}
function s17Narrowing(s, t, missing, narrow, g4) {
  const n = 6, have = 4, cw = 164, gap = 24, x0 = 960 - (n * cw + (n - 1) * gap) / 2, full = x0 + n * cw + (n - 1) * gap;
  const limit = x0 + have * cw + (have - 1) * gap, CT = 356, CHt = 96, ET = 500, EH = 140;
  const evidence = cue(s, "证据不够", "evidence");
  const right = mix(full, limit, glide(t, narrow + 0.05, full - limit)), claimOn = named(t, narrow);
  path(
    [
      [limit + 12, CT],
      [full - 12, CT],
      [full, CT + 12],
      [full, CT + CHt - 12],
      [full - 12, CT + CHt],
      [limit + 12, CT + CHt]
    ],
    { color: P.line, alpha: g4 * soon(t, narrow + 0.05, 0.9), width: 2, dash: [8, 8] }
  );
  box(x0, CT, right - x0, CHt, {
    fill: P.row,
    stroke: P.ink,
    alpha: g4 * claimOn,
    radius: 12,
    width: 3
  });
  line(x0 + 34, CT + 26, right - 34, CT + 26, { color: P.muted, alpha: g4 * claimOn, width: 6 });
  line(x0 + 34, CT + 70, right - 130, CT + 70, { color: P.muted, alpha: g4 * claimOn, width: 6 });
  for (let i = 0; i < n; i++) {
    const x = x0 + i * (cw + gap), cx = x + cw / 2, cy = ET + EH / 2;
    if (i < have) {
      box(x, ET, cw, EH, { fill: P.row, stroke: P.evidence, alpha: g4, radius: 10, width: 2.5 });
      check(cx, cy + 2, 48, { alpha: g4 });
    } else {
      box(x, ET, cw, EH, { stroke: P.line, alpha: g4, radius: 10, width: 2, dash: [6, 6] });
      ring(cx, cy, 24, {
        color: P.unknown,
        alpha: g4 * ramp(t, missing + 0.05, 0.3),
        width: 2.5,
        dash: [4, 4]
      });
      text("?", cx, cy + 1, 26, {
        role: "mark",
        align: "center",
        color: P.unknown,
        alpha: g4 * ramp(t, missing + 0.05, 0.3)
      });
    }
  }
  nameText(L("证据", "Evidence"), x0, ET + EH + NAME_GAP, {
    align: "left",
    valign: "top",
    color: P.evidence,
    alpha: g4 * named(t, evidence)
  });
  nameText(L("收窄说法", "Claim"), x0, CT - NAME_GAP, {
    align: "left",
    valign: "bottom",
    alpha: g4 * claimOn
  });
}

// picture/film/scenes/p17/stamp.js
function s17Stamp(x, y, r, arcs, meets, lights, colors, { alpha = 1, struck = 0 } = {}) {
  ring(x, y, r, {
    color: P.line,
    alpha: alpha * 0.9,
    width: 4,
    start: -Math.PI / 2 + 0.04,
    upto: 1 - 0.08 / (2 * Math.PI)
  });
  [...new Set(colors)].forEach((color) => {
    if (!arcs.some((_, k) => colors[k] === color && lights[k] > 0)) return;
    stroke(
      () => arcs.forEach(([a, b], k) => {
        if (colors[k] !== color || lights[k] <= 0) return;
        const m = meets[k], a0 = (m - (m - a - 1.5) * lights[k]) * Math.PI / 180, a1 = (m + (b - 1.5 - m) * lights[k]) * Math.PI / 180;
        ctx.moveTo(x + r * Math.cos(a0), y + r * Math.sin(a0));
        ctx.arc(x, y, r, a0, a1);
      }),
      { color, alpha, width: 8 }
    );
  });
  check(x, y - 22, r * 0.5, { color: P.line, alpha: alpha * 0.7 });
  check(x, y - 22, r * 0.5, { alpha, upto: struck });
}

// picture/film/scenes/p17/complete.js
function s17Complete(s, t, complete, rows, starts, marks, holds, done, g1) {
  const SY = 525, R = 225, GY = 160, BXo = 320, width = 460, first = s.words[0].start;
  const colors = rows.map((_, r) => r === 5 ? P.authority : P.evidence);
  const termW = (term) => measure(term.join(" "), LABEL), inline = rows.every(([term, , qual]) => termW(term) + TERM_GAP + measure(qual, NOTE) <= width);
  const wrapAt = (term) => term.length > 1 ? 0 : width;
  const blockW = ([term, , qual]) => inline ? termW(term) + TERM_GAP + measure(qual, NOTE) : Math.max(
    ...growTexts(term, wrapAt(term)).map(
      (line2) => line2.reduce((w, [, v]) => w + measure(v), 0)
    ),
    measure(qual, NOTE)
  );
  const reach = (side) => Math.max(...rows.filter((_, r) => r % 2 === side).map(blockW));
  const lean = Math.max(0, (BXo + 14 + NAME_GAP + blockW(rows[0]) - R) / 2 - 70), finish = (reach(0) - reach(1)) / 2, settle = Math.max(-15, Math.min(15, finish));
  const d3 = en ? 0 : (Math.max(blockW(rows[0]), blockW(rows[2])) - blockW(rows[1])) / 2 - settle;
  const third = en ? 0 : d3 * (glide(t, starts[2] + 0.05, d3) - glide(t, cue(s, "另外", "") + 0.05, d3));
  const SX = 960 + lean * glide(t, starts[0] + 0.05, lean) + (settle - lean) * glide(t, starts[1] + 0.05, settle - lean) + (finish - settle) * glide(t, starts[3] + 0.05, finish - settle) + third;
  const meet = Math.asin(GY / R) * 180 / Math.PI, top = 180 + meet, low = 180 - meet;
  const arcs = [
    [(top + 180) / 2, 270],
    [270, (360 - meet + 360) / 2],
    [(low + 180) / 2, (top + 180) / 2],
    [-meet / 2, meet / 2],
    [90, (low + 180) / 2],
    [meet / 2, 90]
  ];
  const meets = [top, 360 - meet, 180, 0, low, meet];
  const struck = ramp(t, done + 0.05, 0.55), place = ramp(t, opening(s) + 0.2, 0.6) * g1;
  s17Stamp(
    SX,
    SY,
    R,
    arcs,
    meets,
    holds.map((at) => ramp(t, Math.min(at + 0.45, thoughtEnd(at) - 0.3), 0.3)),
    colors,
    { alpha: place, struck: struck * g1 }
  );
  nameText(L("完成", "Complete"), SX, SY + 70, { alpha: g1 * named(t, complete) });
  const allAt = cue(s, "这些条件全都满足", "every condition holds");
  nameText(L("这些条件全都满足", "Every condition holds"), SX, SY - R - NAME_GAP, {
    valign: "bottom",
    alpha: g1 * ramp(t, Math.max(allAt - 1.3, first - 0.25), 0.3)
  });
  rows.forEach(([term, termAt, qual, qualAt], r) => {
    const side = r % 2 ? 1 : -1, dy = (Math.floor(r / 2) - 1) * GY, y = SY + dy, mx = SX + side * BXo, lit = speaking(t, marks, r);
    box(mx - 14, y - 14, 28, 28, {
      stroke: colors[r],
      alpha: named(t, marks[r]) * g1,
      radius: 5,
      width: 2.5
    });
    if (lit > 0)
      box(mx - 21, y - 21, 42, 42, {
        stroke: colors[r],
        alpha: lit * restMark(colors[r], 0.6) * g1,
        radius: 8,
        width: 2
      });
    check(mx, y, 20, { color: colors[r], alpha: g1, draw: { t, at: holds[r] + 0.05 } });
    link(mx - side * 22, y, SX + side * Math.sqrt(R * R - dy * dy), y, {
      color: colors[r],
      alpha: g1 * 0.9,
      draw: { t, at: holds[r] + 0.1 }
    });
    const alpha = g1 * Math.max(listLevel(t, starts, r), struck), em = labelSize(LABEL), edge = mx + side * (14 + NAME_GAP);
    const block = termRow(
      t,
      term,
      [termAt],
      [qual],
      [qualAt],
      side > 0 || !inline ? edge : edge - (termW(term) + TERM_GAP + measure(qual, NOTE)),
      y - em / 2,
      {
        width: wrapAt(term),
        inline,
        align: side > 0 || inline ? "left" : "right",
        alpha,
        set: "conditions"
      }
    );
    if (!en && r === 2 && !inline)
      growName(t, ["也通过了"], [holds[r]], edge, block.bottom + labelSize(NOTE) * (LEADING - 1), {
        size: NOTE,
        alpha: mutedLevel(alpha),
        color: P.muted,
        align: side > 0 ? "left" : "right",
        set: "conditions",
        whole: "也通过了"
      });
  });
}

// picture/film/scenes/p17/scene.js
scenes["17"] = function(s, t) {
  const complete = cue(s, "才能说完成", "say complete"), questions = cue(s, "每次说完成", "every completion claim");
  const nots = cues(s, [
    ["测试通过", "a passing test"],
    ["智能体说完成了", "an agent reporting"]
  ]);
  const [missing, narrow] = cues(s, [
    ["证据不够", "when evidence is missing"],
    ["收窄说法", "narrow the claim"]
  ]);
  const base = ramp(t, opening(s), 0.7);
  const rows = (en ? [
    [
      "Deliverable",
      "the deliverable",
      "at the agreed location",
      "at the agreed location",
      "is at the agreed location"
    ],
    ["Completion criteria", "every completion criterion", "all met", "is met", "is met"],
    [
      "Current verification",
      "current verification",
      "matching the claim, passed",
      "matching the claim",
      "has passed"
    ],
    [
      ["Risks, limits, uncovered cases", "and follow-up owners"],
      "risks",
      "recorded",
      "are recorded",
      "are recorded"
    ],
    ["Agreed state", "the agreed state", "reached", "is reached", "is reached"],
    [
      "Human acceptance",
      "human acceptance",
      "where required",
      "where human acceptance",
      "has accepted it"
    ]
  ] : [
    ["交付物", "交付物", "在约定的位置", "在约定的位置", "在约定的位置"],
    ["每条完成标准", "每条完成标准", "达到了", "达到了", "都达到了"],
    ["当前的核验", "当前的核验", "对得上说法，已跑过", "对得上说法", "也通过了"],
    [
      ["风险、限度、没覆盖到的情况，", "以及后续由谁负责，"],
      "风险",
      "都已记录",
      "都已记录",
      "都已记录"
    ],
    ["约定的状态", "约定的状态", "达到了", "达到了约定的状态", "达到了约定的状态"],
    ["验收人", "验收人", "需要时已验收", "需要人来验收", "已验收"]
  ]).map(([term, termCue, qual, qualCue, holdCue]) => [
    [].concat(term),
    cue(s, termCue, termCue),
    qual,
    cue(s, qualCue, qualCue),
    cue(s, holdCue, holdCue)
  ]);
  const starts = rows.map(([, termAt, , qualAt]) => Math.min(termAt, qualAt)), marks = rows.map(([, termAt]) => termAt);
  const holds = rows.map(([, termAt, , qualAt, holdAt]) => Math.max(termAt, qualAt, holdAt)), done = holds[5];
  const g1 = base * stageOut(t, questions);
  if (g1 > 0) s17Complete(s, t, complete, rows, starts, marks, holds, done, g1);
  const g2 = base * stageIn(t, questions) * stageOut(t, nots[0]);
  if (g2 > 0) s17Questions(s, t, questions, g2);
  const stopWords = en ? ["proves neither", "does not"] : ["不等于", "也"];
  const stops = nots.map((at, i) => cueFrom(s, stopWords[i], stopWords[i], at));
  const left = en ? [
    [["A passing test"], []],
    [["An Agent reports completion"], []]
  ] : [
    [["测试通过"], []],
    [["智能体说完成了"], []]
  ];
  const right = en ? [
    ["Review, overall correctness or acceptance", "review, overall correctness"],
    ["Work complete", "work complete"]
  ] : [
    ["整体正确或已验收", "整体正确或已验收"],
    ["完成了", "完成了"]
  ];
  const rightAts = right.map(([, v], i) => cueFrom(s, v, v, stops[i]));
  const termW = ([term]) => (term.length > 1 ? Math.max(...term.map((v) => measure(v, LABEL))) : measure(term.join(""), LABEL)) + 1;
  const rowW = ([term, qual]) => Math.max(termW([term]), qual.length ? measure(qual.join(""), NOTE) : 0);
  const wL = Math.max(...left.map(rowW)), wR = Math.max(...right.map(([v]) => measure(v, LABEL)));
  const DOT = 15, RING = 20, LINK = Math.max(380, 1440 - wL - wR - 2 * NAME_GAP - DOT - RING);
  const x0 = 960 - (wL + NAME_GAP + DOT + LINK + RING + NAME_GAP + wR) / 2;
  const DL = x0 + wL + NAME_GAP + DOT, DR = DL + LINK, BAR = DL + LINK / 2;
  const from = DL + DOT + 8, to = DR - RING - 8, reach = (BAR - 8 - from) / (to - from);
  const litAts = nots.map((v) => pauseHold(v - 0.15, 0.3) + 0.15);
  const ledger = (rows2, ys, last, a, key, whole) => {
    const reachedAts = rows2.map((i) => nots[i]), notAts = rows2.map((i) => rightAts[i]), lights = rows2.map((i) => litAts[i]);
    const spanR = Math.max(...rows2.map((i) => measure(right[i][0], LABEL)));
    const centreOn = (n) => 960 - (DL - DOT - NAME_GAP - Math.max(...rows2.slice(0, n).map((i) => rowW(left[i]))) + DR + RING + NAME_GAP + spanR) / 2;
    const shift = rows2.slice(1).reduce((v, i, k) => {
      const d = centreOn(k + 2) - centreOn(k + 1);
      return v + d * glide(t, nots[i] - 0.1, d);
    }, centreOn(1));
    ctx.save();
    ctx.translate(shift, 0);
    line(BAR, last[0] - 50, BAR, last.at(-1) + 50, {
      color: P.line,
      alpha: ramp(t, stops[rows2[0]] + 0.05, 0.3) * a,
      width: 4
    });
    rows2.forEach((i, k) => {
      const [term, qual] = left[i], y = ys[k], lit = speaking(t, lights, k);
      dot(DL, y, DOT + 1, { color: P.evidence, alpha: ramp(t, nots[i] + 0.05, 0.3) * a });
      if (lit > 0)
        ring(DL, y, DOT + 9, {
          color: P.evidence,
          alpha: lit * restMark(P.evidence, 0.6) * a,
          width: 2
        });
      ring(DR, y, RING, {
        color: P.muted,
        alpha: named(t, rightAts[i]) * a,
        width: 2.5,
        dash: [6, 6]
      });
      link(from, y, to, y, {
        alpha: a,
        upto: reach,
        draw: { t, at: nots[i] + 0.05, least: Math.max(0.4, stops[i] - nots[i]) },
        end: false
      });
      line(BAR, y - 50, BAR, y + 50, {
        color: P.unknown,
        alpha: ramp(t, stops[i] + 0.05, 0.3) * a,
        width: 4
      });
      const qualAts = qual.length ? [cueFrom(s, qual[0], qual[0], nots[i])] : [];
      const lines = term.length > 1;
      termRow(
        t,
        term,
        [nots[i]],
        qual,
        qualAts,
        DL - DOT - NAME_GAP - (lines ? 1 : rowW(left[i])),
        y - labelSize(LABEL) / 2,
        {
          width: lines ? 0 : termW(left[i]),
          align: lines ? "right" : "left",
          alpha: a * Math.max(listLevel(t, reachedAts, k), ramp(t, whole + 0.05, 0.25)),
          set: `reached ${key}`
        }
      );
      nameText(right[i][0], DR + RING + NAME_GAP, y, {
        align: "left",
        color: P.muted,
        set: `not made ${key}`,
        alpha: a * named(t, rightAts[i]) * Math.max(listLevel(t, notAts, k), ramp(t, whole + 0.05, 0.25))
      });
    });
    ctx.restore();
  };
  const g3 = base * stageIn(t, nots[0]) * stageOut(t, missing);
  if (g3 > 0) {
    const grown = soon(t, pauseHold(nots[1] - 0.3, 0.4), 0.4), row = (n) => [0, 1].map((k) => CONTENT_CY + 160 * (k - n / 2));
    ledger([0, 1], row(grown), row(1), g3, "all", cueFrom(s, "完成了", "complete", rightAts[1]));
  }
  const g4 = base * stageIn(t, missing);
  if (g4 > 0) s17Narrowing(s, t, missing, narrow, g4);
};

// picture/film/scenes/p18/scene.js
scenes["18"] = function(s, t) {
  const loopWord = cue(s, "就是一个工作循环", "runs as a loop");
  const steps = cues(s, [
    ["界定", "frame"],
    ["分析", "analyze"],
    ["决定", "decide"],
    ["执行", "execute"],
    ["核验", "verify"],
    ["总结", "learn"]
  ]);
  const [evidence, risk, review, judgment] = cues(s, [
    ["证据或风险", "evidence or risk"],
    ["风险变了", "risk changes"],
    ["重新看", "review the judgment"],
    ["受影响的判断", "judgment it affects"]
  ]);
  const [subject, outcome, bounds, reframe] = cues(s, [
    ["对象、目标", "subject, outcome"],
    ["目标或边界", "outcome or boundaries"],
    ["边界变了", "boundaries change"],
    ["才重新界定", "frame the work again"]
  ]);
  const high = cue(s, "影响大", "high-impact");
  const kept = cues(s, [
    ["测试", "the test"],
    ["监控", "monitor"],
    ["规则", "rule"],
    ["恢复办法", "recovery path"]
  ]);
  const [leave, example, agreed, noData, warn] = cues(s, [
    ["现有负责人", "the existing owners"],
    ["比如修好了昨晚的延迟", "fixing last night's delay"],
    ["约定的时间", "the agreed time"],
    ["数据还没到", "without the data"],
    ["告警", "warns when"]
  ]);
  const [effort, directory, report] = cues(s, [
    ["为了证明自己努力过", "to prove effort"],
    ["没人用的证据目录", "create an evidence directory nobody uses"],
    ["没人读的报告", "report nobody reads"]
  ]);
  const base = ramp(t, opening(s), 0.7);
  const before = cue(s, "说完成之前", "before calling"), two = Math.min(high, before);
  const out = stageOut(t, example);
  const one = base * stageOut(t, two);
  if (one > 0) {
    const lean = L(62, 114);
    ctx.save();
    ctx.translate(-lean * (glide(t, evidence - 0.1, lean) - glide(t, subject - 0.1, lean)), 0);
    const cx = 960, cy = CONTENT_CY, R = 270, top = cy - R;
    const drawn = ramp(t, opening(s), 1.2);
    ring(cx, cy, R, {
      color: P.muted,
      alpha: one,
      width: 3,
      start: -Math.PI / 2 + 0.035,
      upto: drawn * (1 - 0.07 / (2 * Math.PI))
    });
    const affects = Math.max(judgment, review + 0.55) - 0.1;
    ring(cx, cy, R, {
      color: P.evidence,
      alpha: one * ramp(t, affects, 0.3),
      width: 6,
      start: -Math.PI / 6,
      upto: 1 / 6,
      draw: { t, at: affects }
    });
    [0, Math.PI].forEach(
      (a) => dot(cx + Math.cos(a) * R, cy + Math.sin(a) * R, 3 + 2.5, {
        color: P.muted,
        alpha: one * ramp(t, opening(s) + 0.6, 0.4)
      })
    );
    nameText(L("工作循环", "A loop"), cx, cy, {
      color: P.muted,
      alpha: one * named(t, loopWord - L(0.34, 0.25))
    });
    const stagesAt = cue(s, "必须分开走的阶段", "mandatory separate stages");
    rejectedName(L("必须分开走的阶段", "Mandatory separate stages"), cx, cy + 56, {
      alpha: one * named(t, stagesAt),
      mark: ramp(t, stagesAt + 0.25, 0.35)
    });
    const names = en ? ["Frame", "Analyze", "Decide", "Execute", "Verify", "Learn"] : ["界定", "分析", "决定", "执行", "核验", "总结"];
    steps.forEach((at, i) => {
      const a = -Math.PI / 2 + i * Math.PI / 3, x = cx + Math.cos(a) * R, y = cy + Math.sin(a) * R, lit = speaking(t, steps, i);
      dot(x, y, 14, { color: P.ground, alpha: one * ramp(t, at - 0.15, 0.4) });
      dot(x, y, 14, { color: P.ink, alpha: one * ramp(t, at - 0.15, 0.4) });
      if (lit > 0) ring(x, y, 24, { color: P.ink, alpha: lit * 0.5 * one, width: 2 });
      radialName(names[i], cx, cy, R + 14, a, { alpha: one * listIn(t, steps, i), set: "steps" });
    });
    const changes = [
      {
        x: cx + L(340, 400),
        ats: [evidence, risk],
        color: P.evidence,
        beat: P.unknown,
        act: review,
        name: L("证据或风险变了", "Evidence or risk changes"),
        to: [cx + R * Math.cos(Math.PI / 6), cy - R / 2 - 30],
        route: "hv"
      },
      {
        x: cx - 340,
        ats: [subject, outcome, bounds],
        color: P.ink,
        beat: P.ink,
        act: reframe,
        name: L("对象、目标或边界变了", "Subject, outcome or boundaries change"),
        to: [cx - 30, top],
        route: null
      }
    ];
    changes.forEach(({ x, ats, color, beat, act, name, to, route }) => {
      const side = Math.sign(x - cx);
      dot(x, top, 10, { color, alpha: one * ramp(t, ats[0] - 0.15, 0.4) });
      beats(t, x, top, 18, ats.slice(1), { color: beat, alpha: one });
      nameText(name, x, top - 14 - NAME_GAP, {
        valign: "bottom",
        alpha: one * named(t, ats[0]),
        set: "changes"
      });
      link(x - side * 18, top, ...to, {
        route,
        width: 3,
        alpha: one * ramp(t, act + 0.05, 0.3),
        draw: { t, at: act + 0.05 },
        flowing: since(t, act + 0.75)
      });
    });
    ring(cx, top, 24, {
      color: P.ink,
      alpha: one * ramp(t, Math.min(reframe + 0.7, thoughtEnd(reframe) - 0.35), 0.3) * 0.7,
      width: 3
    });
    ctx.restore();
  }
  const repeated = cue(s, "反复出现", "repeated");
  const g2 = base * stageIn(t, two) * out;
  if (g2 > 0) {
    const work = en ? ["High-impact", " or repeated work"] : ["影响大", "或反复出现的工作"];
    const WW = 150, WH = 220, WX = 960 + (measure(work.join(""), LABEL) + NAME_GAP - WW - 44) / 2, WY = 312, TX = WX + (WW + 44) / 2;
    const BUS = 582, IY = 656, FY = 606, FH = 175;
    const lean = kept.slice(1).reduce((v, at) => v + 120 * (1 - glide(t, at - 0.3, 120)), 0), xs = [600, 840, 1080, 1320].map((x) => x + lean);
    for (let k = 2; k >= 1; k--)
      path(
        [
          [WX + k * 22, WY - (k - 1) * 22],
          [WX + k * 22, WY - k * 22],
          [WX + WW + k * 22, WY - k * 22],
          [WX + WW + k * 22, WY + WH - k * 22],
          [WX + WW + (k - 1) * 22, WY + WH - k * 22]
        ],
        { color: P.ink, alpha: g2, width: 2 }
      );
    s17Page(WX, WY, WW, WH, { alpha: g2, rows: 5 });
    growName(t, work, [high, repeated], WX - NAME_GAP, WY + WH / 2, {
      valign: "middle",
      align: "right",
      alpha: g2
    });
    const SX = WX + WW, SY = WY + WH, stamp = g2 * ramp(t, before - 0.15, 0.4);
    dot(SX, SY, 30, { color: P.ground, alpha: stamp });
    ring(SX, SY, 30, { color: P.ink, alpha: stamp, width: 2.5 });
    check(SX, SY + 1, 26, { alpha: stamp, draw: { t, at: leave + 0.3 } });
    const reach = kept.map((at, i) => drawShare(t, at - 0.3, Math.abs(xs[i] - TX)));
    link(TX, SY, TX, BUS, { alpha: g2, draw: { t, at: kept[0] - 0.65 }, end: false });
    const left = Math.min(TX, ...xs.map((x, i) => mix(TX, x, reach[i]))), right = Math.max(TX, ...xs.map((x, i) => mix(TX, x, reach[i])));
    if (right - left > 1) line(left, BUS, right, BUS, { color: P.line, alpha: g2, width: 2 });
    box(440, FY, 1040, FH, {
      fill: P.row,
      stroke: P.ink,
      alpha: g2 * named(t, leave),
      radius: 14,
      width: 2.5
    });
    kept.forEach((at, i) => {
      const x = xs[i], q = ramp(t, at - 0.05, 0.4) * g2, lit = speaking(t, kept, i);
      link(x, BUS, x, IY - 44, { alpha: g2, draw: { t, at: at - 0.15 }, end: false });
      if (lit > 0) ring(x, IY, 46, { color: P.ink, alpha: lit * 0.5 * g2, width: 2 });
      if (i === 0) check(x, IY, 34, { alpha: q });
      if (i === 1) {
        box(x - 30, IY - 22, 60, 44, { stroke: P.ink, alpha: q, radius: 8 });
        stroke(() => ctx.arc(x, IY + 10, 14, Math.PI, Math.PI * 2), {
          color: P.evidence,
          alpha: q,
          width: 2.5
        });
      }
      if (i === 2) s17Page(x - 20, IY - 26, 40, 52, { alpha: q, rows: 3 });
      if (i === 3) {
        path(
          [
            [x + 22, IY - 14],
            [x - 20, IY - 14],
            [x - 20, IY + 14],
            [x + 14, IY + 14]
          ],
          { color: P.ink, alpha: q, width: 2.5 }
        );
        dot(x + 16, IY + 14, 5, { color: P.evidence, alpha: q });
      }
    });
    railNames(
      en ? ["Test", "Monitor", "Rule", "Recovery path"] : ["测试", "监控", "规则", "恢复办法"],
      xs,
      IY + 46,
      { gap: NAME_GAP, alpha: (i) => g2 * listIn(t, kept, i), set: "kept" }
    );
    termRow(t, [L("现有负责人", "The existing owners")], [leave], [], [], 440, FY + FH + NAME_GAP, {
      width: 1040,
      alpha: g2
    });
  }
  const notBuilt = Math.min(effort, directory);
  const exOut = stageOut(t, notBuilt);
  const ex = stageIn(t, example) * base * exOut;
  illustrative(ex);
  if (ex > 0) {
    const YA = 395, YB = 735, AX = 1080, LATE = 1420, MY = YB - 150, TOPV = YA - 90;
    const [delay, fixed, schedule, mWord] = [
      cue(s, "修好了昨晚的延迟", "last night's delay"),
      cue(s, "就在调度", "can leave"),
      cue(s, "调度", "schedule"),
      cueFrom(s, "监控", "monitor", example)
    ];
    [
      [YA, ex],
      [YB, ex * ramp(t, schedule - 0.15, 0.4)]
    ].forEach(([y, a]) => {
      line(300, y, 1620, y, { color: P.muted, alpha: a, width: 3 });
      for (let x = 300; x <= 1620; x += 132)
        line(x, y - 20, x, y + 20, { color: P.muted, alpha: a, width: 2 });
    });
    nameText(L("调度", "The schedule"), 300, YB + 20 + NAME_GAP, {
      align: "left",
      valign: "top",
      alpha: ex * named(t, schedule)
    });
    line(AX, TOPV, AX, YB + 18, {
      color: P.authority,
      alpha: ex * ramp(t, agreed - 0.15, 0.4),
      width: 2
    });
    nameText(L("约定的时间", "The agreed time"), AX, TOPV - NAME_GAP, {
      valign: "bottom",
      color: P.authority,
      alpha: ex * named(t, agreed)
    });
    const fix = ramp(t, fixed + 0.05, 0.5), late = blend(P.unknown, P.line, fix);
    line(AX, YA, LATE, YA, { color: late, alpha: ex, width: 6 });
    dot(LATE, YA, 11, { color: late, alpha: ex });
    const dn = L("昨晚的延迟", "Last night's delay"), dw = measure(dn, LABEL), dy = YA + 20 + NAME_GAP;
    nameText(dn, (AX + LATE) / 2, dy, { valign: "top", alpha: ex * named(t, delay) });
    check((AX + LATE) / 2 + dw / 2 + 30, dy + labelSize(LABEL) / 2, 24, {
      alpha: ex,
      draw: { t, at: fixed + 0.05 }
    });
    const m = ramp(t, mWord - 0.15, 0.4) * ex, warnQ = ramp(t, Math.max(noData, warn) + 0.05, 0.3);
    box(AX - 60, MY, 120, 84, { fill: P.ground, stroke: P.ink, alpha: m, radius: 10, width: 2.5 });
    stroke(() => ctx.arc(AX, MY + 60, 22, Math.PI, Math.PI * 2), {
      color: blend(P.evidence, P.unknown, warnQ),
      alpha: m,
      width: 3
    });
    termRow(
      t,
      [L("监控", "Monitor")],
      [mWord],
      [L("告警", "warns")],
      [warn],
      AX + 60 + NAME_GAP,
      MY + 42 - labelSize(LABEL) / 2,
      { alpha: ex }
    );
    const DX = AX - 70, dq = ex * ramp(t, noData - 0.1, 0.4);
    ring(DX, YB, 14, { color: P.unknown, alpha: dq, width: 2.5, dash: [5, 5] });
    nameText(L("数据还没到", "Without the data"), DX, YB + 20 + NAME_GAP, {
      valign: "top",
      alpha: ex * named(t, noData)
    });
    if (warnQ > 0)
      for (let k = 0; k < 3; k++) {
        const w = (voiceTime(t) * 1.2 + k / 3) % 1;
        const p = pass(w, 0.25);
        ring(AX, MY + 42, 74 + 34 * w, {
          color: P.unknown,
          alpha: warnQ * ex * restMark(P.unknown),
          width: 2.5,
          start: -Math.PI * (0.5 + 0.3 * p),
          upto: 0.3 * p
        });
      }
  }
  const no = stageIn(t, notBuilt) * base;
  if (no > 0) {
    const ats = [directory, report], lean = 60 * ((directory <= notBuilt + 1e-6 ? 1 : glide(t, directory - 0.1, 60)) - glide(t, report - 0.1, 60));
    ctx.save();
    ctx.translate(lean, 0);
    const DY = 640, W = 200, H = 220, TOP = DY - H, MY = TOP + H / 2, xs = [700, 1220], seats = [460, 1460];
    const names = en ? ["An evidence directory nobody uses", "A report nobody reads"] : ["没人用的证据目录", "没人读的报告"];
    line(560, DY, 1360, DY, { color: P.muted, alpha: no, width: 4 });
    xs.forEach((x, i) => {
      const q = ramp(t, ats[i] - 0.15, 0.4) * no, lit = speaking(t, ats, i), side = i ? 1 : -1;
      if (lit > 0)
        box(x - W / 2 - 12, TOP - 12, W + 24, H + 6, {
          stroke: P.ink,
          alpha: lit * 0.45 * no,
          radius: 16,
          width: 2
        });
      if (i === 0) {
        box(x - W / 2, TOP, W, H - 4, { fill: P.row, stroke: P.muted, alpha: q, radius: 10 });
        line(x - W / 2, TOP + 44, x + W / 2, TOP + 44, { color: P.muted, alpha: q });
        for (let k = 0; k < 3; k++)
          box(x - 60, TOP + 72 + k * 44, 120, 28, { stroke: P.line, alpha: q, radius: 4 });
      } else
        s17Page(x - W / 2 + 20, TOP + 10, W - 40, H - 14, { alpha: q, rows: 5, stroke: P.muted });
      person(seats[i], MY + 8, { alpha: q, color: P.line, size: 0.9, solid: false });
      link(x + side * (W / 2 + 12), MY, seats[i] - side * 34, MY, {
        color: P.line,
        alpha: q,
        upto: drawShare(
          t,
          ats[i] + 0.05,
          Math.abs(seats[i] - side * 34 - (x + side * (W / 2 + 12))),
          0.6
        ),
        dash: [8, 8]
      });
      rejectedName(names[i], x, TOP - 12 - NAME_GAP, {
        valign: "bottom",
        width: 460,
        alpha: no * named(t, ats[i]),
        mark: ramp(t, ats[i] + 0.45, 0.3),
        set: "unused"
      });
    });
    const motive = ramp(t, effort - 0.15, 0.4) * no, PY = DY - 34;
    person(960, PY, { alpha: motive, size: 1.2 });
    clock(960, PY - 75, 30, { hand: voiceTime(t) * 0.6 % 1, color: P.muted, alpha: motive });
    nameText(L("为了证明自己努力过", "To prove effort"), 960, DY + NAME_GAP, {
      valign: "top",
      color: P.muted,
      alpha: no * named(t, effort)
    });
    ctx.restore();
  }
};

// picture/film/scenes/p19/boundary.js
function s19Frame(t, fx, small, full, ys, ats, [top0, bottom0], [top1, bottom1], { middle = null, from = null, toward = 0, opens = 0 } = {}) {
  const reach = middle === null ? 0 : Math.max(
    Math.abs(full / 2 + toward - middle / 2),
    Math.abs(full / 2 - toward - middle / 2)
  );
  const grow = middle === null ? soon(t, ats[0] - 0.3, 0.4) : glide(t, ats[0] - 0.15 - glideTime(reach), reach), top = mix(top0, Math.min(top1, ys[0] - 45), grow);
  let bottom = mix(bottom0, bottom1, grow);
  ys.forEach((y, k) => {
    if (y + 45 > bottom) bottom = mix(bottom, y + 45, soon(t, ats[k] - 0.3, 0.4));
  });
  const side = fx + small / 2, h = bottom - top;
  if (middle === null)
    return {
      x: fx,
      y: top,
      w: typeof full === "function" ? full(t) : mix(small, full, grow),
      h,
      ax: side
    };
  const go = from === null ? 1 : glide(t, from, Math.abs(fx + full / 2 + toward - side - opens)), at = mix(side + opens, fx + full / 2 + toward, go), w = mix(mix(small, middle, go), full, grow);
  return { x: mix(at, fx + full / 2, grow) - w / 2, y: top, w, h, ax: mix(at, side, grow) };
}
function s19Lines(parts, width) {
  const n = growLines(parts, width).length, span2 = (a, b) => measure(parts.slice(a, b).join(""));
  let best = null;
  const search = (from, cuts) => {
    if (cuts.length === n - 1) {
      const starts = [0, ...cuts], ends = [...cuts, parts.length], worst = Math.max(...starts.map((a, i) => span2(a, ends[i])));
      if (worst <= width + 0.5 && (!best || worst < best.worst - 0.5))
        best = { starts, ends, worst };
      return;
    }
    for (let c = from + 1; c <= parts.length - (n - 1 - cuts.length); c++) search(c, [...cuts, c]);
  };
  search(0, []);
  if (!best) return growTexts(parts, width);
  const lines = best.starts.map(
    (a, i) => Array.from({ length: best.ends[i] - a }, (_, j) => [a + j, parts[a + j]])
  );
  lines.forEach((line2, r) => {
    const [k, v] = line2[0], lead = r ? v.match(/^[、，,;；\s]+/u)?.[0] ?? "" : "";
    if (!lead) return;
    line2[0] = [k, v.slice(lead.length)];
    const mark = lead.replace(/\s+/gu, "");
    if (mark) lines[r - 1].push([k, mark]);
  });
  return lines;
}

// picture/film/scenes/p19/delegation.js
function s19Delegation(s, t, MX, MY, memberLeft, em, ACTOR, snap, kinds, settleAt, toAgent, agentAt, g1) {
  const names = en ? ["Search", "Analysis", "Drafting"] : ["查资料", "分析", "起草"];
  const CX = 1080, wide = Math.max(...names.map((v) => measure(v, LABEL))), group = (memberLeft + CX + wide) / 2;
  const lead = (960 - group) * (1 - glide(t, toAgent + 0.05, 960 - group)), solo = (group - MX) * (1 - glide(t, settleAt + 0.05, group - MX));
  const ax = 1400, ay = 500, cx = CX + lead, mx = MX + lead;
  ctx.save();
  ctx.translate(solo, 0);
  person(mx, MY, { alpha: g1, color: P.authority, size: 1.7 });
  nameText(L("成员", "Member"), mx, MY + 38 + NAME_GAP, {
    valign: "top",
    color: P.authority,
    alpha: g1 * named(t, cue(s, "成员", "members"))
  });
  ctx.restore();
  const tops0 = stackTops(
    names.map(() => blockHeight(1)),
    CONTENT_CY,
    80
  ), lift = snap(tops0.map((v) => v + em / 2));
  const tops = tops0.map((v) => v + lift), mid = (i) => tops[i] + labelSize(LABEL) / 2;
  names.forEach((v, i) => {
    const y = mid(i), on = ramp(t, kinds[i] - 0.15, 0.4), lit = speaking(t, kinds, i);
    box(cx - 80, y - 21, 56, 42, {
      fill: P.row,
      stroke: P.muted,
      alpha: g1 * on,
      radius: 7,
      width: 2
    });
    if (lit > 0)
      box(cx - 80, y - 21, 56, 42, { stroke: P.ink, alpha: g1 * lit, radius: 7, width: 2.5 });
    nameText(v, cx, y, { align: "left", alpha: g1 * listIn(t, kinds, i), set: "work" });
  });
  const bx = cx + wide + 34, hand = ramp(t, toAgent - 0.1, 0.3) * g1, go = soon(t, toAgent - 0.05, 0.7);
  line(bx, mid(0), bx, mid(names.length - 1), { color: P.line, alpha: hand, width: 2 });
  link(bx, CONTENT_CY, ax - 48, ay, { alpha: hand, upto: go, flowing: since(t, toAgent + 0.65) });
  const here = ramp(t, agentAt - 0.15, 0.4);
  agent(ax, ay, { alpha: here * g1, size: 1.8 });
  nameText(L("智能体", "Agent"), ax, ACTOR, {
    valign: "top",
    color: P.evidence,
    alpha: g1 * named(t, agentAt)
  });
}
function s19Extends(t, within, extend, MX, MY, FX, small, em, ACTOR, snap, abilities, kx, widthFor, g2) {
  const names = en ? ["Investigate", "Reason about", "Do"] : ["调查", "推理", "动手"];
  const ys0 = stackTops(
    names.map(() => blockHeight(1)),
    CONTENT_CY,
    34
  ).map((top) => top + em / 2), ys = ys0.map((y) => y + snap(ys0));
  person(MX, MY, { alpha: g2, color: P.authority, size: 1.7 });
  nameText(L("成员", "Member"), MX, MY + 38 + NAME_GAP, {
    valign: "top",
    color: P.authority,
    alpha: g2
  });
  const full = widthFor(names.map((v) => measure(v, LABEL)));
  const f = s19Frame(t, FX, small, full, ys, abilities, [380, 620], [380, 620], {
    middle: 240,
    toward: (full - 240) / 2
  }), on = ramp(t, Math.min(within, extend) - 0.15, 0.4) * g2;
  box(f.x, f.y, f.w, f.h, { stroke: P.evidence, alpha: on, radius: 22, width: 2.5 });
  nameText(L("委托范围", "A delegated boundary"), f.x, f.y - NAME_GAP, {
    align: "left",
    valign: "bottom",
    color: P.evidence,
    alpha: g2 * named(t, within)
  });
  link(MX + 40, 500, f.x - 12, 500, {
    alpha: g2,
    flowing: since(t, Math.min(within, extend) + STAGE_CUT),
    span: FX - MX - 52
  });
  agent(f.ax, 490, { alpha: g2, size: 1.6 });
  nameText(L("智能体", "Agent"), f.ax, ACTOR, { valign: "top", color: P.evidence, alpha: g2 });
  names.forEach((v, i) => {
    const y = ys[i], q = ramp(t, abilities[i] - 0.15, 0.4) * g2, lit = speaking(t, abilities, i);
    if (i === 0) {
      ring(kx - 4, y - 4, 9, { alpha: q, width: 2.5 });
      line(kx + 3, y + 3, kx + 11, y + 11, { color: P.evidence, alpha: q, width: 3 });
    }
    if (i === 1) {
      dot(kx - 9, y + 6, 4.5, { alpha: q });
      dot(kx + 9, y - 6, 4.5, { alpha: q });
      line(kx - 9, y + 6, kx + 9, y - 6, { color: P.evidence, alpha: q, width: 2 });
    }
    if (i === 2) check(kx, y, 18, { alpha: q });
    if (lit > 0) ring(kx, y, 20, { color: P.evidence, alpha: g2 * lit, width: 2.5 });
    nameText(v, kx + 20 + NAME_GAP, y, {
      align: "left",
      color: P.evidence,
      alpha: g2 * listIn(t, abilities, i),
      set: "abilities"
    });
  });
}
function s19Cannot(s, t, within, extend, MX, MY, FX, small, em, ACTOR, snap, refused, RW, lean19, widthFor, g3) {
  person(MX, MY, { alpha: g3, color: P.authority, size: 1.7 });
  nameText(L("成员", "Member"), MX, MY + 38 + NAME_GAP, {
    valign: "top",
    color: P.authority,
    alpha: g3
  });
  const said = en ? [2, 3] : [0, 1, 2, 3], promise = L("替人作出承诺", "Commitments for people");
  const does = en ? cues(s, [
    ["", "organizational authorization"],
    ["", "make commitments for people"]
  ]) : cues(s, [
    ["智能体能执行", ""],
    ["能推理", ""],
    ["给不了组织的授权", ""],
    ["替人作出承诺", ""]
  ]);
  const ys0 = stackTops(
    said.map(() => blockHeight(1)),
    CONTENT_CY,
    34
  ).map((top) => top + em / 2), ys = ys0.map((y) => y + snap(ys0));
  const refusals = Math.max(
    ...wrapName(refused, RW).map((v) => measure(v, LABEL)),
    measure(promise, LABEL)
  );
  const widths = [
    ...en ? [] : ["执行", "推理"].map((v) => measure(v, LABEL)),
    refusals + 16 + 26,
    refusals + 16 + 26
  ];
  const targets = widths.map((_, k) => Math.max(small, widthFor(widths.slice(0, k + 1))));
  const grown = (tt) => targets.reduce((w, to, k) => {
    const d = to - (k ? targets[k - 1] : small);
    return w + d * pacedTo(tt, does[k] + 0.1, d, 0.4);
  }, small);
  const fx3 = FX - lean19 * glide(t, does[0] - 0.3, lean19), ax3 = fx3 + small / 2, kx3 = fx3 + 210;
  const f = s19Frame(t, fx3, small, grown, ys, does, [365, 635], [380, 620]);
  box(f.x, f.y, f.w, f.h, { stroke: P.evidence, alpha: g3, radius: 22, width: 2.5 });
  nameText(L("委托范围", "A delegated boundary"), fx3, f.y - NAME_GAP, {
    align: "left",
    valign: "bottom",
    color: P.evidence,
    alpha: g3
  });
  link(MX + 40, 500, fx3 - 12, 500, {
    alpha: g3,
    flowing: since(t, Math.min(within, extend) + STAGE_CUT),
    span: FX - lean19 - MX - 52
  });
  agent(ax3, 490, { alpha: g3, size: 1.6 });
  nameText(L("智能体", "Agent"), ax3, ACTOR, { valign: "top", color: P.evidence, alpha: g3 });
  said.forEach((i, k) => {
    const y = ys[k], q = ramp(t, does[k] - 0.15, 0.4) * g3;
    if (i === 0) check(kx3, y, 18, { alpha: q });
    if (i === 1) {
      dot(kx3 - 9, y + 6, 4.5, { alpha: q });
      dot(kx3 + 9, y - 6, 4.5, { alpha: q });
      line(kx3 - 9, y + 6, kx3 + 9, y - 6, { color: P.evidence, alpha: q, width: 2 });
    }
    if (i >= 2) seal(kx3, y, 16, { alpha: q * 0.8, hollow: true });
    const at = ramp(t, does[k] - 0.15, 0.4) * listLevel(t, does, k);
    if (i < 2)
      nameText(["执行", "推理"][i], kx3 + 20 + NAME_GAP, y, {
        align: "left",
        color: P.evidence,
        alpha: g3 * at,
        set: "agent"
      });
    else
      rejectedName(i === 2 ? refused : promise, kx3 + 20 + NAME_GAP, y, {
        align: "left",
        width: RW,
        alpha: g3 * ramp(t, does[k] - 0.15, 0.4),
        mark: ramp(t, does[k] + 0.4, 0.4),
        markLeft: kx3 + 20 + NAME_GAP + refusals + 16
      });
  });
}
function s19ClearBoundary(s, t, within, extend, MX, MY, FX, small, em, ACTOR, snap, lean19, boundary, pile, parts, g4) {
  const names = en ? [
    "Purpose and scope",
    "The deliverable",
    "Limits and permissions",
    "How the result will be accepted",
    "When to stop and hand off"
  ] : ["目的和范围", "交什么", "限制和权限", "怎么验收", "什么时候必须停下交接"];
  const PW = 360, blocks = names.map((v) => wrapName(v, PW)), heights = blocks.map((v) => blockHeight(v.length));
  const tops = stackTops(heights, CONTENT_CY, 40), lift = snap(tops.flatMap((top, i) => blocks[i].map((_, k) => top + em / 2 + k * em * LEADING)));
  const ys = tops.map((top, i) => top + lift + heights[i] / 2);
  const fw = 210 + 20 + NAME_GAP + Math.max(...blocks.flat().map((v) => measure(v, LABEL))) + 40;
  person(MX, MY, { alpha: g4, color: P.authority, size: 1.7 });
  nameText(L("成员", "Member"), MX, MY + 38 + NAME_GAP, {
    valign: "top",
    color: P.authority,
    alpha: g4
  });
  const heap = ramp(t, Math.min(pile, cue(s, "只给", "a pile of context")) - 0.15, 0.4) * g4;
  for (let k = 0; k < 4; k++)
    box(MX - 64 + k * 8, 648 - k * 10, 104, 64, {
      fill: P.row,
      stroke: P.muted,
      alpha: heap,
      radius: 6
    });
  rejectedName(L("一堆背景材料", "A pile of context"), MX, 712 + NAME_GAP, {
    valign: "top",
    alpha: g4 * named(t, pile),
    mark: ramp(t, pile + 0.45, 0.4)
  });
  const top4 = Math.min(330, ys[0] - 45);
  const FX4 = 1920 - L(465, 446) - fw, kx4 = FX4 + 210, f = s19Frame(t, FX4, small, fw, ys, parts, [top4, 615], [330, 660], {
    middle: L(200, 160),
    from: boundary + STAGE_CUT,
    toward: 50 + FX - FX4,
    opens: FX - FX4 - lean19
  });
  link(MX + 40, 500, f.x - 12, 500, {
    alpha: g4,
    flowing: since(t, Math.min(within, extend) + STAGE_CUT),
    span: FX - MX - 52
  });
  box(f.x, f.y, f.w, f.h, {
    stroke: P.evidence,
    alpha: g4,
    radius: 22,
    width: mix(2.5, 4, ramp(t, boundary + 0.05, 0.3) * (1 - ramp(t, boundary + 1.4, 0.5)))
  });
  const clear = L("划清边界", "A clear boundary");
  nameText(clear, f.x + Math.min(0, (f.w - measure(clear)) / 2), f.y - NAME_GAP, {
    align: "left",
    valign: "bottom",
    color: P.evidence,
    alpha: g4
  });
  agent(f.ax, 490, { alpha: g4, size: 1.6 });
  nameText(L("智能体", "Agent"), f.ax, ACTOR, { valign: "top", color: P.evidence, alpha: g4 });
  names.forEach((v, i) => {
    const y = ys[i], q = ramp(t, parts[i] - 0.15, 0.4) * g4, lit = speaking(t, parts, i);
    if (i === 0) {
      ring(kx4, y, 10, { alpha: q, width: 2.5 });
      dot(kx4, y, 3.5, { alpha: q });
    }
    if (i === 1) s17Page(kx4 - 9, y - 12, 18, 24, { alpha: q, rows: 2, stroke: P.evidence });
    if (i === 2) lock(kx4, y + 2, { alpha: q, color: P.evidence, size: 0.5 });
    if (i === 3) check(kx4, y, 18, { alpha: q });
    if (i === 4) stopSign(kx4, y, 11, { alpha: q });
    if (lit > 0) ring(kx4, y, 20, { color: P.evidence, alpha: g4 * lit, width: 2.5 });
    nameText(v, kx4 + 20 + NAME_GAP, y, {
      align: "left",
      width: PW,
      alpha: g4 * listIn(t, parts, i),
      set: "parts"
    });
  });
}

// picture/film/scenes/p19/example.js
function s19Comparison(s, t, earlier, revised, report, items, contents, FW, GAP, fx, g5) {
  const fy = 310, fh = 380, at = [earlier, revised], snapshots = cue(s, "价格快照", "price snapshots");
  const px = (k) => fx + 100 + k * 115, base0 = fy + fh / 2 + 10, frame = ramp(t, earlier - 0.2, 0.4) * g5;
  box(fx, fy, FW, fh, { fill: P.row, stroke: P.ink, alpha: frame, radius: 10, width: 2.5 });
  path(
    [
      [fx + 50, fy + 34],
      [fx + 50, fy + fh - 40],
      [fx + FW - 40, fy + fh - 40]
    ],
    { color: P.line, alpha: frame, width: 2 }
  );
  nameText(L("价格快照", "Price snapshots"), fx + FW / 2, fy - NAME_GAP, {
    valign: "bottom",
    alpha: g5 * named(t, snapshots)
  });
  const series2 = [
    [60, -10, 40, -60, -20],
    [60, -10, 10, -100, -120]
  ];
  series2.forEach((dys, i) => {
    const q = ramp(t, at[i] - 0.15, 0.4) * g5, c = i ? P.ink : P.evidence, pts = dys.map((dy, k) => [px(k), base0 + dy]);
    path(pts, { color: c, alpha: q, width: 3, draw: { t, at: at[i] - 0.1 } });
    pts.forEach(([x, y]) => dot(x, y, 5, { color: c, alpha: q }));
    nameText(i ? L("修正后", "Revised") : L("修正前", "Earlier"), px(4) + 18, pts[4][1], {
      align: "left",
      color: c,
      alpha: g5 * named(t, at[i])
    });
  });
  const scan = ramp(t, revised + 0.2, 0.4) * g5, u = voiceTime(t) * 0.18 % 1, sx = mix(px(0), px(4), u);
  line(sx, fy + 24, sx, fy + fh - 52, {
    color: P.authority,
    alpha: scan * 0.8 * pass(u, 0.1),
    width: 2
  });
  const ix = fx + FW + GAP + 18, hy = 395, ys = [465, 535, 605], on = g5 * named(t, report);
  agent(ix, hy - 70, { alpha: on, size: 1.1 });
  nameText(L("智能体", "Agent"), ix + 24 + NAME_GAP, hy - 70, {
    align: "left",
    color: P.evidence,
    alpha: on
  });
  s17Page(ix - 14, hy - 18, 28, 36, { alpha: on, rows: 2, stroke: P.evidence });
  nameText(L("报告", "Report"), ix + 24 + NAME_GAP, hy, {
    align: "left",
    color: P.evidence,
    alpha: on
  });
  ys.forEach((y, i) => {
    const q = ramp(t, items[i] - 0.15, 0.4) * g5, lit = speaking(t, items, i), c = i === 2 ? P.unknown : P.evidence;
    if (i === 0) clock(ix, y, 18, { hand: 0.15, color: c, alpha: q });
    else ring(ix, y, 18, { color: c, alpha: q, width: 2.5 });
    if (i === 1) text("≠", ix, y, 24, { role: "mark", align: "center", color: c, alpha: q });
    if (i === 2) text("?", ix, y, 24, { role: "mark", align: "center", color: c, alpha: q });
    if (lit > 0) ring(ix, y, 18, { color: c, alpha: q * lit, width: 4.5 });
    nameText(contents[i], ix + 24 + NAME_GAP, y, {
      align: "left",
      alpha: g5 * listIn(t, items, i),
      set: "report"
    });
  });
}
function s19ReadOnly(t, readOnly, kept) {
  const lw = measure(L("只看不改", "Read-only"), LABEL), lx = 960 - (lw + 19 + NAME_GAP) / 2, ly = 310 + 380 + 86;
  lock(lx, ly, {
    alpha: ramp(t, readOnly - 0.15, 0.4) * kept,
    color: P.evidence,
    size: 1.1,
    closed: soon(t, readOnly, 0.5)
  });
  nameText(L("只看不改", "Read-only"), lx + 19 + NAME_GAP, ly, {
    align: "left",
    color: P.evidence,
    alpha: kept * named(t, readOnly)
  });
}
function s19StopConditions(t, noSnap, prodWrite, noApprove, g7) {
  const ax = 960, ay = 300, bus = 420, xs = [450, 1470, 960], ends = [540, 540, 540], ys = [620, 620, 620], at = [noSnap, prodWrite, noApprove];
  const on = at.map((v) => ramp(t, v - 0.15, 0.4) * g7);
  agent(ax, ay, { alpha: g7, size: 1.8 });
  nameText(L("智能体", "Agent"), ax + 40 + NAME_GAP, ay, {
    align: "left",
    color: P.evidence,
    alpha: g7
  });
  link(ax, ay + 40, ax, bus, { alpha: g7, end: false });
  const row = soon(t, noSnap - 0.1, 0.45);
  line(mix(ax, xs[0], row), bus, mix(ax, xs[1], row), bus, {
    color: P.muted,
    alpha: g7,
    width: 3
  });
  xs.forEach((x, i) => {
    const q = on[i], go = soon(t, at[i] - 0.1, 0.6);
    link(x, bus, x, ends[i], { alpha: q * 0.8, end: false, dash: [6, 6] });
    link(x, bus, x, mix(bus, ends[i], go), { color: P.unknown, alpha: q, end: false });
    line(x - 26, ends[i] + 12, x + 26, ends[i] + 12, {
      color: P.unknown,
      alpha: ramp(t, at[i] + 0.4, 0.3) * g7,
      width: 4
    });
  });
  box(xs[0] - 34, ys[0] - 44, 68, 88, { stroke: P.muted, alpha: on[0], radius: 6, dash: [6, 6] });
  text("?", xs[0], ys[0], 30, { role: "mark", align: "center", color: P.unknown, alpha: on[0] });
  tableIcon(xs[1] - 64, ys[1] - 42, 128, 84, { alpha: on[1], stroke: P.ink });
  seal(xs[2], ys[2], 36, { alpha: on[2], hollow: true });
  const stops = en ? ["Earlier snapshot is missing", "A production write"] : ["没有修正前的快照", "要改生产数据"];
  stops.forEach(
    (v, i) => nameText(v, xs[i], ys[i] + 44 + NAME_GAP, {
      valign: "top",
      width: 380,
      alpha: g7 * listIn(t, at.slice(0, 2), i),
      set: "stops"
    })
  );
  rejectedName(L("放行这份数据", "Grant admission"), xs[2], ys[2] + 44 + NAME_GAP, {
    valign: "top",
    width: 420,
    alpha: g7 * named(t, noApprove),
    mark: ramp(t, noApprove + 0.45, 0.4)
  });
}
function s19JustHandleIt(s, t, MY, vague, notSet, authAt, g8) {
  const mx = L(492, 450), fx = L(902, 930), fy = 300, fw = 600, fh = 500, cx = fx + fw / 2, cornerAt = cue(s, "划不出", "set an authorization");
  const corner = named(t, cornerAt) * g8;
  const wait = L(0, 200) * (1 - glide(t, cornerAt + 0.05, L(0, 200)));
  ctx.save();
  ctx.translate(wait, 0);
  person(mx, MY, { alpha: g8, color: P.authority, size: 1.7 });
  nameText(L("成员", "Member"), mx, MY + 38 + NAME_GAP, {
    valign: "top",
    color: P.authority,
    alpha: g8
  });
  rejectedName(L("“帮我搞定”", "“Just handle it”"), mx, 420, {
    valign: "bottom",
    alpha: g8 * named(t, vague),
    mark: ramp(t, notSet + 0.05, 0.3)
  });
  ctx.restore();
  [
    [fx, fy, 1, 1],
    [fx + fw, fy, -1, 1],
    [fx, fy + fh, 1, -1],
    [fx + fw, fy + fh, -1, -1]
  ].forEach(
    ([x, y, sx, sy]) => path(
      [
        [x, y + sy * 70],
        [x, y],
        [x + sx * 70, y]
      ],
      { color: P.muted, alpha: corner, width: 3, dash: [10, 7] }
    )
  );
  nameText(L("授权的边界", "An authorization boundary"), fx, fy - NAME_GAP, {
    align: "left",
    valign: "bottom",
    color: P.muted,
    alpha: named(t, authAt) * g8
  });
  const since2 = voiceTime(t) - voiceTime(notSet + 0.05), drift = smoother(since2 / 2), at = (k) => {
    const v = voiceTime(t) - k * 0.08, d = smoother((since2 - k * 0.08) / 2);
    return [cx + Math.sin(v * 0.9) * 380 * d, 540 + Math.cos(v * 0.7) * 160 * d];
  };
  if (drift > 0)
    path(
      Array.from({ length: 31 }, (_, k) => at(k)),
      { color: P.unknown, alpha: g8 * 0.6 * drift, width: 2, dash: [5, 6] }
    );
  agent(...at(0), { alpha: g8, size: 1.8 });
  nameText(L("智能体", "Agent"), cx, 596 + NAME_GAP, {
    valign: "top",
    color: P.evidence,
    alpha: g8 * (1 - ramp(t, notSet + 0.05, 0.3))
  });
}

// picture/film/scenes/p19/fork.js
function s19MissingContext(s, t, em, ACTOR, snap, gap, g9) {
  const ask = cue(s, "停下来问", "stops and asks"), assume = cue(s, "写明合理的假定", "proceeds on reasonable"), onward = cue(s, "接着做", "proceeds on reasonable");
  const fine = cue(s, "不影响", "does not materially"), first = cue(s, "要处理的对象", "target");
  const parts = (list) => list.map(([zh, english]) => cue(s, zh, english));
  const proceeds = en ? [
    ["Does not materially affect"],
    [fine],
    ["direction, safety or authority"],
    fine,
    false,
    parts([
      ["", "direction"],
      ["", "safety"],
      ["", "or authority"]
    ])
  ] : [
    ["不影响"],
    [fine],
    ["方向、安全和权限"],
    fine,
    false,
    [cue(s, "方向", ""), cue(s, "安全", ""), cueFrom(s, "和权限", "", cue(s, "安全", ""))]
  ];
  const members = [
    first,
    cue(s, "事实依据", "fact source"),
    cue(s, "负责人", "responsible person"),
    cueFrom(s, "权限", "authority", first),
    cue(s, "后果是否可逆", "or an irreversible")
  ];
  const stops = [
    en ? [
      "Target",
      ", fact source",
      ", responsible person",
      ", authority",
      " or an irreversible consequence"
    ] : ["要处理的对象", "、事实依据", "、负责人", "、权限", "、后果是否可逆"],
    members,
    [L("有一样说不清", "is unclear")],
    cue(s, "有一样说不清", "is unclear"),
    true,
    members.slice(1)
  ];
  const rows = en ? [proceeds, stops] : [stops, proceeds];
  const outB = L("停下来问", "Stops and asks");
  const [S1, S2, S3] = en ? [378, -20, -20] : [380, 90, 0];
  const fork = mix(S1, S2, glide(t, (en ? assume : ask) + 0.05, S1 - S2)) + (S3 - S2) * glide(t, (en ? ask : assume) + 0.05, S3 - S2);
  const CW = en ? 560 : 480, mx = 450, rx = mx + 150 + fork, cx0 = rx + L(130, 116);
  const lineW = (line2) => line2.reduce((w, [, v]) => w + measure(v), 0);
  const blocks = rows.map(([term, , qual, , stop]) => {
    if (stop) {
      const lines = s19Lines(term, CW), widths = lines.map(lineW);
      return {
        lines,
        height: blockHeight(lines.length) + TERM_STACK + blockHeight(1, NOTE),
        width: Math.max(...widths, measure(qual.join(""), NOTE)),
        head: widths[0]
      };
    }
    const { one, height } = termRowLayout(term, qual, CW, false), head = measure(term.join(""), LABEL), note = measure(qual.join(""), NOTE);
    return {
      height,
      width: one ? head + TERM_GAP + note : Math.max(head, note),
      head: one ? head + TERM_GAP + note : head
    };
  });
  const colW = Math.max(...blocks.map((v) => v.width)), ox = cx0 + colW + L(70, 60);
  const tops0 = stackTops(
    blocks.map((v) => v.height),
    CONTENT_CY,
    en ? 150 : 250
  );
  const drop = snap(
    tops0.flatMap(
      (top, r) => Array.from(
        { length: blocks[r].lines?.length ?? 1 },
        (_, k) => top + em / 2 + k * em * LEADING
      )
    )
  );
  const tops = tops0.map((top) => top + drop), ys = tops.map((top) => top + labelSize(LABEL) / 2);
  person(mx, 506, { alpha: g9, color: P.authority, size: 1.7 });
  nameText(L("成员", "Member"), mx, 506 + 38 + NAME_GAP, {
    valign: "top",
    color: P.authority,
    alpha: g9
  });
  link(mx + 40, 500, rx - 40, 500, { alpha: g9 });
  agent(rx, 500, { alpha: g9, size: 1.8 });
  nameText(L("智能体", "Agent"), rx, ACTOR, {
    valign: "top",
    color: P.evidence,
    alpha: g9 * named(t, cueFrom(s, "智能体", "the agent", gap))
  });
  const QY = 310;
  box(rx - 30, QY, 60, 76, { stroke: P.unknown, alpha: g9, radius: 8, dash: [6, 6] });
  text("?", rx, QY + 38, 30, { role: "mark", align: "center", color: P.unknown, alpha: g9 });
  if (en)
    nameText("Missing context", rx, QY - NAME_GAP, {
      valign: "bottom",
      alpha: g9 * named(t, gap)
    });
  rows.forEach(([term, termAts, qual, qualAt, stop, partAts], r) => {
    const y = ys[r], begin = Math.min(termAts[0], qualAt), q = ramp(t, begin - 0.15, 0.4) * g9, mark = cx0 - 14 - NAME_GAP;
    link(rx + 40, 500, mark - 18, y, { route: "hvh", mid: cx0 - 50, alpha: q * 0.8, end: false });
    ring(mark, y, 14, { color: stop ? P.unknown : P.evidence, alpha: q, width: 2.5 });
    beats(t, mark, y, 22, partAts, { color: stop ? P.unknown : P.evidence, alpha: g9 });
    if (stop) {
      const whole = [...term, ...qual].join(" ");
      blocks[r].lines.forEach((line2, k) => {
        let left = cx0;
        line2.forEach(([i, v]) => {
          growName(t, [v], [termAts[i]], left, tops[r] + k * labelSize(LABEL) * LEADING, {
            alpha: g9 * listLevel(t, termAts, i),
            whole,
            set: "context"
          });
          left += measure(v);
        });
      });
      growName(t, qual, [qualAt], cx0, tops[r] + blockHeight(blocks[r].lines.length) + TERM_STACK, {
        size: NOTE,
        color: P.muted,
        alpha: g9,
        whole,
        set: "context"
      });
    } else
      termRow(
        t,
        term,
        term.map(() => termAts[0]),
        qual,
        qual.map(() => qualAt),
        cx0,
        tops[r],
        { width: CW, inline: false, alpha: g9, set: "context" }
      );
    const at = stop ? ask : assume, go = { t, at: at - 0.1 }, on = ramp(t, at - 0.15, 0.4) * g9;
    link(cx0 + blocks[r].head + 20, y, ox - 30, y, {
      color: stop ? P.unknown : P.evidence,
      alpha: on,
      draw: go,
      flowing: stop ? null : since(t, Math.max(onward + 0.2, at + 0.4))
    });
    if (stop) stopSign(ox, y, 18, { alpha: on });
    else s17Page(ox - 14, y - 18, 28, 36, { alpha: on, rows: 2, stroke: P.evidence });
    if (stop)
      nameText(outB, en ? ox - 18 : ox + 24 + NAME_GAP, en ? y + 18 + NAME_GAP : y, {
        align: "left",
        valign: en ? "top" : "middle",
        color: P.authority,
        alpha: g9 * named(t, ask)
      });
    else
      growName(
        t,
        en ? ["Stated", " assumptions"] : ["写明合理的假定", "，接着做"],
        en ? [cue(s, "", "stated assumptions"), cue(s, "", "stated assumptions")] : [assume, onward],
        en ? ox - 18 : ox + 24 + NAME_GAP,
        en ? y + 18 + NAME_GAP : y - labelSize(LABEL) / 2,
        { width: en ? 340 : 1810 - ox - 24 - NAME_GAP, color: P.evidence, alpha: g9 }
      );
  });
}

// picture/film/scenes/p19/scene.js
scenes["19"] = function(s, t) {
  const base = ramp(t, opening(s), 0.7);
  const within = cue(s, "在委托范围内", "within a delegated boundary"), extend = cue(s, "扩展", "agents extend");
  const MX = 580, MY = 506, FX = L(970, 920), small = 160;
  const memberLeft = MX - Math.max(41, measure(L("成员", "Member")) / 2);
  const em = labelSize(LABEL), ACTOR = MY + 38 + NAME_GAP;
  const snap = (firsts) => {
    const d = firsts.map((y) => ACTOR + em / 2 - y).reduce((a, b) => Math.abs(b) < Math.abs(a) ? b : a, Infinity);
    return Math.abs(d) <= em ? d : 0;
  };
  const kinds = cues(s, [
    ["查资料", "search"],
    ["分析", "analysis"],
    ["起草", "drafting"]
  ]);
  const settleAt = en ? cue(s, "", "delegate work") : kinds[0];
  const toAgent = cue(s, "委托给智能体", "to agents"), agentAt = cue(s, "智能体", "agents");
  const g1 = base * clearOfTitle(s, t, 350) * stageOut(t, Math.min(within, extend));
  if (g1 > 0)
    s19Delegation(s, t, MX, MY, memberLeft, em, ACTOR, snap, kinds, settleAt, toAgent, agentAt, g1);
  const abilities = cues(s, [
    ["调查", "investigate"],
    ["推理", "reason about"],
    ["动手", "and do"]
  ]);
  const sourceCut = cue(s, "智能体能执行", "but an agent");
  const kx = FX + 210, refused = L("组织的授权", "Organizational authorization"), RW = 400, lean19 = L(83, 150);
  const widthFor = (names) => 210 + 20 + NAME_GAP + Math.max(...names) + 40;
  const g2 = base * stageIn(t, Math.min(within, extend)) * stageOut(t, sourceCut);
  if (g2 > 0)
    s19Extends(t, within, extend, MX, MY, FX, small, em, ACTOR, snap, abilities, kx, widthFor, g2);
  const boundary = cue(s, "要划清边界", "delegate with a clear boundary");
  const g3 = base * stageIn(t, sourceCut) * stageOut(t, boundary);
  if (g3 > 0)
    s19Cannot(
      s,
      t,
      within,
      extend,
      MX,
      MY,
      FX,
      small,
      em,
      ACTOR,
      snap,
      refused,
      RW,
      lean19,
      widthFor,
      g3
    );
  const pile = cue(s, "一堆背景材料", "a pile of context");
  const [readOnly, earlier, revised] = cues(s, [
    ["只看不改", "read-only"],
    ["供应商修正前", "compare the vendor's earlier"],
    ["修正前后", "revised"]
  ]);
  const example = Math.min(readOnly, earlier) - 0.2;
  const parts = cues(s, [
    ["目的和范围", "purpose and scope"],
    ["交什么", "the deliverable"],
    ["限制和权限", "limits and permissions"],
    ["怎么验收", "how the result will be accepted"],
    ["什么时候必须停", "when to stop"]
  ]);
  const g4 = base * stageIn(t, boundary) * stageOut(t, example);
  if (g4 > 0)
    s19ClearBoundary(
      s,
      t,
      within,
      extend,
      MX,
      MY,
      FX,
      small,
      em,
      ACTOR,
      snap,
      lean19,
      boundary,
      pile,
      parts,
      g4
    );
  const report = cue(s, "报告", "report"), vague = cue(s, "帮我搞定", "just handle it"), told = cue(s, "一句", "telling");
  const noSnap = cue(s, "没有修正前的快照", "stop if");
  const items = cues(s, [
    ["每个值的来源", "each value's source"],
    ["哪些有差异", "the differences"],
    ["哪些核实不了", "what cannot be verified"]
  ]);
  const contents = en ? ["Source and observation time", "The differences", "What cannot be verified"] : ["每个值的来源和观察时间", "哪些有差异", "哪些核实不了"];
  const FW = 700, GAP = 80, CW = 18 + 24 + NAME_GAP + Math.max(...contents.map((v) => measure(v))), room = (GAP + CW) / 2;
  const fx = 960 - FW / 2 - room * glide(t, report - 1, room);
  illustrative(base * stageIn(t, example) * stageOut(t, told));
  const g5 = base * stageIn(t, example) * stageOut(t, noSnap);
  if (g5 > 0) s19Comparison(s, t, earlier, revised, report, items, contents, FW, GAP, fx, g5);
  const kept = base * stageIn(t, example) * stageOut(t, noSnap);
  if (kept > 0) s19ReadOnly(t, readOnly, kept);
  const [prodWrite, noApprove] = cues(s, [
    ["要改生产数据", "a production write"],
    ["不要放行", "do not grant admission"]
  ]);
  const g7 = base * stageIn(t, noSnap) * stageOut(t, told);
  if (g7 > 0) s19StopConditions(t, noSnap, prodWrite, noApprove, g7);
  const gap = cue(s, "要处理的对象", "missing context"), notSet = cue(s, "划不出", "does not set"), authAt = cue(s, "授权的边界", "authorization boundary", { last: true });
  const g8 = base * stageIn(t, told) * stageOut(t, gap);
  if (g8 > 0) s19JustHandleIt(s, t, MY, vague, notSet, authAt, g8);
  const g9 = base * stageIn(t, gap);
  if (g9 > 0) s19MissingContext(s, t, em, ACTOR, snap, gap, g9);
};

// picture/film/scenes/p20/duty.js
function s20Caller(s, t, caller, owned, g4) {
  const px = L(380, 460), ax = 1540, y = 500, rail = 500, xs = [700, 900, 1100, 1300];
  person(px, y, { alpha: g4, color: P.authority, size: 1.7 });
  nameText(L("调用智能体的人", "The person who calls an Agent"), px, y + 38 + NAME_GAP, {
    valign: "top",
    width: 400,
    color: P.authority,
    alpha: g4
  });
  agent(ax, y - 5, { alpha: g4, size: 1.8 });
  nameText(L("智能体", "Agent"), ax, y + 38 + NAME_GAP, {
    valign: "top",
    color: P.evidence,
    alpha: g4
  });
  link(px + 56, rail - 5, ax - 52, rail - 5, { alpha: g4, end: false });
  xs.forEach((x, i) => {
    const q = ramp(t, owned[i] - 0.15, 0.4) * g4, lit = speaking(t, owned, i);
    dot(x, rail - 5, 16, { color: P.ground, alpha: q });
    dot(x, rail - 5, 16, { color: P.authority, alpha: q * 0.7, hollow: true, width: 2 });
    dot(x, rail - 5, 10, { color: P.authority, alpha: q });
    if (lit > 0) ring(x, rail - 5, 25, { color: P.authority, alpha: g4 * lit, width: 2 });
  });
  railNames(
    en ? ["Context", "Permissions", "Verification", "Result"] : ["背景材料", "权限", "核验", "结果"],
    xs,
    rail - 5,
    {
      side: -1,
      gap: NAME_GAP + 24,
      alpha: (i) => g4 * listIn(t, owned, i),
      color: () => P.authority,
      set: "owned"
    }
  );
  nameText(L("负责", "Owns"), 1e3, rail + 30, {
    valign: "top",
    color: P.muted,
    size: NOTE,
    alpha: g4 * named(t, cueFrom(s, "负责", "owns", caller))
  });
}
function s20Submitting(s, t, submit, vouched, g5) {
  const px = 560, y = 500, wx = 1340, kx = L(800, 770), youAt = cueFrom(s, "你", "you", submit), you = named(t, youAt);
  const foot = y + 100, nameTop = foot + NAME_GAP;
  person(px, foot - 38, { alpha: g5, color: P.authority, size: 1.7 });
  nameText(L("调用智能体的人", "The person who calls an Agent"), px, nameTop, {
    valign: "top",
    width: 400,
    color: P.authority,
    alpha: g5 * (1 - ramp(t, youAt - 0.45, 0.3))
  });
  nameText(L("你", "You"), px, nameTop, { valign: "top", color: P.authority, alpha: g5 * you });
  s17Page(wx - 90, y - 130, 180, 230, { alpha: g5, rows: 4 });
  agent(wx + 90, y - 130, { alpha: g5, size: 1 });
  nameText(L("它帮忙做的工作", "Agent-assisted work"), wx, nameTop, {
    valign: "top",
    width: 300,
    alpha: g5 * named(t, submit)
  });
  const tops = stackTops(
    vouched.map(() => blockHeight(1)),
    CONTENT_CY - 10,
    72
  ), mid = (i) => tops[i] + labelSize(LABEL) / 2;
  vouched.forEach((at, i) => {
    const yy = mid(i), q = ramp(t, at - 0.15, 0.4) * g5;
    check(kx, yy, 26, { color: P.authority, alpha: q, upto: clamp((t - at + 0.15) / 0.35) });
    if (speaking(t, vouched, i) > 0)
      ring(kx, yy, 26, { color: P.authority, alpha: g5 * speaking(t, vouched, i), width: 2.5 });
    nameText(
      en ? ["Understood", "Checked it", "Accept responsibility"][i] : ["看懂了", "检查过", "为后果负责"][i],
      kx + 26 + NAME_GAP,
      yy,
      { align: "left", alpha: g5 * listIn(t, vouched, i), set: "vouched" }
    );
  });
}
function s20Duty(s, t, transfers, dutyAt, g6) {
  const lx = 300, rx = 1080, fw = 540, move = glide(t, cue(s, "转移", "transfers") + 0.05, rx + 170 - lx - 330);
  person(lx + 120, 506, { alpha: g6, color: P.authority, size: 1.2 });
  agent(rx + fw - 120, 500, { alpha: g6, size: 1.3 });
  const wx = mix(lx + 330, rx + 170, move);
  link(lx + 120, 458, rx + fw - 120, 464, {
    route: "vhv",
    mid: 402,
    alpha: g6,
    draw: { t, at: transfers + 0.05 }
  });
  nameText(L("委托", "Delegation"), (lx + fw + rx) / 2, 330, {
    valign: "bottom",
    alpha: g6 * named(t, transfers)
  });
  s17Page(wx - 50, 340, 100, 124, { alpha: g6, rows: 3 });
  nameText(L("工作", "The work"), wx, 340 + 124 + NAME_GAP, {
    valign: "top",
    alpha: g6 * named(t, transfers)
  });
  seal(lx + 330, 600, 30, { alpha: g6 * ramp(t, dutyAt - 0.15, 0.4) });
  link(lx + 370, 600, 954, 600, {
    color: P.unknown,
    alpha: g6 * ramp(t, dutyAt + 0.05, 0.3),
    upto: drawShare(t, dutyAt + 0.05, Math.abs(954 - (lx + 370)), 0.5),
    end: false,
    dash: [8, 8]
  });
  line(960, 572, 960, 628, {
    color: P.unknown,
    alpha: ramp(t, cueFrom(s, "还在", "duty", dutyAt) + 0.05, 0.25) * g6,
    width: 4
  });
  nameText(L("这份责任", "That duty"), lx + 330, 600 + 30 + NAME_GAP, {
    valign: "top",
    color: P.authority,
    alpha: g6 * named(t, dutyAt)
  });
}
function s20Acceptor(s, t, examine, acceptor, unmet, met, noExpand, steps, g7) {
  const lead = L(210, 170) * (1 - glide(t, met + 0.05, L(210, 170)));
  const ax = 470 + lead, ay = 500, mx = 630 + lead, bx = 395 + lead, by = 430, bw = 320, bh = 190, ex = 960 + lead, ey = 500;
  const xs = [1220, 1400, 1580].map((x) => x - L(84, 100)), ry = by + bh + NAME_GAP + labelSize(LABEL) + NAME_GAP + 22;
  const returns = cueFrom(s, "退回", "goes back", unmet), memberAt = cueFrom(s, "成员", "the member", unmet);
  const nameY = ay + 30 + NAME_GAP;
  const bound = named(t, cueFrom(s, "委托范围", "the delegation boundary", unmet)) * g7;
  box(bx, by, bw, bh, {
    stroke: P.evidence,
    alpha: bound,
    radius: 22,
    width: mix(2.5, 4, ramp(t, noExpand + 0.05, 0.3))
  });
  nameText(L("委托范围", "The delegation boundary"), bx, by - NAME_GAP, {
    align: "left",
    valign: "bottom",
    color: P.evidence,
    alpha: bound
  });
  const agentIn = g7 * ramp(t, acceptor + STAGE_CUT, 0.3);
  agent(ax, ay, { alpha: agentIn, size: 1.3 });
  nameText(L("智能体", "Agent"), ax, nameY, { valign: "top", color: P.evidence, alpha: agentIn });
  person(mx, ay, { color: P.authority, size: 1.1, alpha: g7 * ramp(t, memberAt - 0.15, 0.4) });
  nameText(L("成员", "Member"), mx, nameY, {
    valign: "top",
    color: P.authority,
    alpha: g7 * named(t, memberAt)
  });
  const actual = cueFrom(s, "实际的工作", "actual work", examine), WT = nameY - NAME_GAP - 124;
  s17Page(ex - 50, WT, 100, 124, { alpha: g7 * ramp(t, actual - 0.15, 0.4), rows: 3 });
  person(ex, 290, { alpha: g7, color: P.authority, size: 1.1 });
  nameText(L("验收人", "The acceptor"), ex + 17 + NAME_GAP, 290 - 8, {
    align: "left",
    color: P.authority,
    alpha: g7
  });
  link(ex, 330, ex, WT - 10, {
    color: P.authority,
    alpha: g7 * ramp(t, examine + 0.05, 0.3),
    draw: { t, at: examine + 0.05 }
  });
  nameText(L("实际的工作和证据", "The actual work and evidence"), ex, nameY, {
    valign: "top",
    width: L(300, 460),
    alpha: g7 * named(t, actual)
  });
  link(ex - 62, ey, mx + 40, ey, {
    color: P.unknown,
    alpha: g7 * ramp(t, returns - 0.1, 0.3),
    draw: { t, at: returns - 0.05 }
  });
  const unmetParts = en ? ["Conditions are unmet"] : ["条件不满足", "，就退回给成员"];
  const unmetW = Math.max(
    ...growTexts(unmetParts, 340).map((line2) => measure(line2.map(([, v]) => v).join("")))
  );
  growName(
    t,
    unmetParts,
    en ? [unmet, returns] : [memberAt, memberAt],
    L(mx, mix(ax, bx + bw / 2, glide(t, memberAt + 0.05, bx + bw / 2 - ax))) - unmetW / 2,
    by + bh + NAME_GAP,
    { width: 340, color: P.muted, alpha: g7 }
  );
  link(xs[0] - 70, ry, xs[2], ry, {
    alpha: g7 * ramp(t, met - 0.1, 0.3),
    draw: { t, at: met },
    end: false,
    width: 3
  });
  xs.forEach((x, i) => {
    const q = ramp(t, steps[i] - 0.15, 0.4) * g7;
    dot(x, ry, 22, { color: P.ground, alpha: q });
    if (i === 0) check(x, ry, 22, { alpha: q });
    if (i === 1) s17Page(x - 12, ry - 15, 24, 30, { alpha: q, rows: 2 });
    if (i === 2) link(x - 14, ry, x + 14, ry, { color: P.ink, alpha: q });
    if (speaking(t, steps, i) > 0)
      ring(x, ry, 22, { color: P.evidence, alpha: g7 * speaking(t, steps, i), width: 2.5 });
  });
  railNames(en ? ["Accepted", "Recorded", "Handed off"] : ["验收", "记录", "交接"], xs, ry + 22, {
    gap: NAME_GAP,
    alpha: (i) => g7 * listIn(t, steps, i),
    set: "steps"
  });
  nameText(L("满足了", "If they are met"), xs[0], ry - 22 - NAME_GAP, {
    valign: "bottom",
    color: P.evidence,
    alpha: g7 * named(t, met)
  });
  rejectedName(L("扩大权限", "Expands permission"), bx, by - NAME_GAP - labelSize(LABEL) - 40, {
    align: "left",
    valign: "bottom",
    alpha: g7 * named(t, noExpand),
    mark: ramp(t, noExpand + 0.5, 0.4)
  });
}

// picture/film/scenes/p20/roles.js
function s20FiveRoles(s, t, roles, g1) {
  const work = cue(s, "一件事", "a piece of work"), on = g1 * named(t, work);
  const roleNames = en ? ["Task lead", "Executing member", "Agent", "Reviewer", "Acceptor"] : ["任务负责人", "执行的成员", "智能体", "评审人", "验收人"];
  const early = en ? 73 * (1 - glide(t, roles[1] - 0.1, 73)) : 0;
  const shift = early + 960 - (Math.min(640 - 70, 640 - measure(L("一件事", "A piece of work")) / 2) + 1e3 + 34 + NAME_GAP + Math.max(...roleNames.map((v) => measure(v)))) / 2;
  const WX = 640 + shift, WY = 500, SX = 880 + shift, RX = 1e3 + shift, ys = [330, 415, 500, 585, 670];
  s17Page(WX - 70, WY - 90, 140, 180, { alpha: on, rows: 4 });
  nameText(L("一件事", "A piece of work"), WX, WY + 90 + NAME_GAP, { valign: "top", alpha: on });
  link(WX + 82, WY, SX, WY, { alpha: on, end: false, draw: { t, at: roles[0] - 0.45 } });
  const reach = roles.map((at, k) => drawShare(t, at - 0.35, Math.abs(ys[k] - WY)));
  const top = ys.reduce((v, y, k) => y < WY ? Math.min(v, mix(WY, y, reach[k])) : v, WY);
  const bottom = ys.reduce((v, y, k) => y > WY ? Math.max(v, mix(WY, y, reach[k])) : v, WY);
  if (bottom - top > 1) line(SX, top, SX, bottom, { color: P.line, alpha: g1, width: 2 });
  ys.forEach((y, i) => {
    const q = ramp(t, roles[i] - 0.15, 0.4) * g1, lit = speaking(t, roles, i);
    link(SX, y, RX - 22, y, { alpha: g1, draw: { t, at: roles[i] - 0.2 }, end: false });
    if (i === 2) agent(RX, y, { alpha: q, size: 1.1 });
    else person(RX, y + 17, { alpha: q, color: P.authority, size: 1 });
    if (lit > 0)
      ring(RX, y, 36, { color: i === 2 ? P.evidence : P.authority, alpha: g1 * lit, width: 2.5 });
    nameText(roleNames[i], RX + 34 + NAME_GAP, y, {
      align: "left",
      color: i === 2 ? P.evidence : P.authority,
      alpha: g1 * listIn(t, roles, i),
      set: "roles"
    });
  });
}
function s20SeveralRoles(s, t, policy, title, samePerson, several, holders, powers, g2) {
  const heldNames = [L("几种角色", "Several roles")], PX = 520, Y2 = 450;
  const HX = 1920 - PX + Math.max(60, measure(L("制度允许时", "Where policy permits")) / 2) - 40 - NAME_GAP - Math.max(...heldNames.map((v) => measure(v)));
  const ys = [Y2 - 110, Y2, Y2 + 110], OX = (PX + HX) / 2, rule = g2 * named(t, policy);
  const line1 = Y2 + 6 + 32 + NAME_GAP, PY = line1 - 65 - NAME_GAP;
  s17Page(PX - 60, PY - 85, 120, 150, { alpha: rule, rows: 4 });
  dot(PX + 44, PY + 52, 20, { color: P.row, alpha: rule });
  seal(PX + 44, PY + 52, 20, { alpha: rule });
  nameText(L("制度允许时", "Where policy permits"), PX, line1, { valign: "top", alpha: rule });
  ys.forEach((y, i) => {
    const q = ramp(t, holders[i] - 0.15, 0.4) * g2;
    person(HX, y + 5, { alpha: q, color: P.authority, size: 1.15, solid: false });
  });
  nameText(heldNames[0], HX + 40 + NAME_GAP, Y2, {
    align: "left",
    color: P.authority,
    alpha: g2 * named(t, several)
  });
  const one = named(t, samePerson) * g2, gather = several, held = named(t, gather) * g2;
  if (!en)
    beats(t, PX + 44, PY + 52, 30, [cue(s, "每种角色的权限", ""), cue(s, "授权", "")], {
      color: P.authority,
      alpha: g2
    });
  path(
    [
      [HX - 44, ys[0]],
      [HX - 62, ys[0]],
      [HX - 62, ys[2]],
      [HX - 44, ys[2]]
    ],
    { color: P.authority, alpha: held, width: 2.5 }
  );
  link(HX - 62, Y2, OX + 40, Y2, {
    color: P.authority,
    alpha: held,
    draw: { t, at: gather + 0.05 }
  });
  person(OX, Y2 + 6, { alpha: one, color: P.authority, size: 1.4 });
  nameText(L("一个人", "One person"), OX, line1, {
    valign: "top",
    color: P.authority,
    alpha: one
  });
  const tx = OX, ty = 740, TW = 150, TH = 90, px = tx + 440, d = 60, pys = [ty - d, ty + d], refuse = cue(s, "不等于", "grants no");
  const card = g2 * named(t, title), bar = tx + 340;
  const stops = [cueFrom(s, "做决定", "decide", title), powers[1]];
  box(tx - TW / 2, ty - TH / 2, TW, TH, { stroke: P.muted, alpha: card, radius: 10, width: 2 });
  line(tx - 46, ty - 12, tx + 46, ty - 12, { color: P.muted, alpha: card, width: 3 });
  line(tx - 46, ty + 14, tx + 18, ty + 14, { color: P.muted, alpha: card * 0.7, width: 3 });
  nameText(L("任务负责人", "A title alone"), tx, ty + TH / 2 + NAME_GAP, {
    valign: "top",
    color: P.muted,
    alpha: card
  });
  pys.forEach((y, i) => {
    const from = i ? stops[0] + 0.05 : refuse - 0.05, q = ramp(t, powers[i] - 0.15, 0.4) * g2;
    link(tx + TW / 2 + 10, ty, bar - 6, y, {
      route: "hvh",
      mid: tx + 200,
      color: P.unknown,
      alpha: g2 * ramp(t, from - 0.05, 0.3),
      draw: { t, at: from, least: Math.max(0.3, stops[i] - from) },
      end: false,
      dash: [8, 8]
    });
    line(bar, y - 20, bar, y + 20, {
      color: P.unknown,
      alpha: ramp(t, stops[i] - 0.15, 0.35) * g2,
      width: 4
    });
    seal(px, y, 26, { alpha: q, hollow: true });
    nameText(en ? ["Decide", "Accept"][i] : ["做决定", "验收"][i], px + 26 + NAME_GAP, y, {
      align: "left",
      color: P.authority,
      alpha: g2 * listIn(t, powers, i),
      set: "powers"
    });
  });
}

// picture/film/scenes/p20/scene.js
scenes["20"] = function(s, t) {
  const base = ramp(t, opening(s), 0.7);
  const policy = cue(s, "制度允许时", "where policy permits");
  const roles = cues(s, [
    ["任务负责人", "task lead"],
    ["执行的成员", "executing member"],
    ["智能体评审人", "an agent a reviewer"],
    ["评审人", "reviewer"],
    ["验收人", "acceptor"]
  ]);
  const g1 = base * stageOut(t, policy);
  if (g1 > 0) s20FiveRoles(s, t, roles, g1);
  const title = cue(s, "当了任务负责人", "a title alone"), samePerson = cue(s, "一个人", "one person");
  const several = cue(s, "兼几种角色", "hold several roles"), holders = [several, several, several];
  const caller = cue(s, "调用智能体的人", "the person who calls");
  const powers = [
    cue(s, "做决定", "grants no authority to decide"),
    cueFrom(s, "验收", "accept", title + 1)
  ];
  const g2 = base * stageIn(t, policy) * stageOut(t, caller);
  if (g2 > 0) s20SeveralRoles(s, t, policy, title, samePerson, several, holders, powers, g2);
  const submit = cue(s, "提交它帮忙做的工作", "submitting");
  const infoAt = cue(s, "背景材料", "context");
  const owned = [
    infoAt,
    cueFrom(s, "权限", "permissions", infoAt),
    ...cues(s, [
      ["核验", "verification"],
      ["结果", "result"]
    ])
  ];
  const g4 = base * stageIn(t, caller) * stageOut(t, submit);
  if (g4 > 0) s20Caller(s, t, caller, owned, g4);
  const transfers = cue(s, "委托转移的是工作", "delegation transfers");
  const vouched = cues(s, [
    ["看懂了", "understood"],
    ["检查过", "checked it"],
    ["为后果负责", "accept responsibility"]
  ]);
  const g5 = base * stageIn(t, submit) * stageOut(t, transfers);
  if (g5 > 0) s20Submitting(s, t, submit, vouched, g5);
  const examine = cue(s, "检查实际的工作和证据", "examines the actual work"), dutyAt = cue(s, "这份责任", "not that duty");
  const acceptor = cue(s, "验收人检查", "the acceptor examines");
  const g6 = base * stageIn(t, transfers) * stageOut(t, acceptor);
  if (g6 > 0) s20Duty(s, t, transfers, dutyAt, g6);
  const [unmet, met, noExpand] = cues(s, [
    ["条件不满足", "if the agreed conditions are unmet"],
    ["满足了", "if they are met"],
    ["验收不会扩大权限", "acceptance never expands"]
  ]);
  const steps = cues(s, [
    ["才验收", "accepted"],
    ["记录", "recorded"],
    ["交接", "handed off"]
  ]);
  const g7 = base * stageIn(t, acceptor);
  if (g7 > 0) s20Acceptor(s, t, examine, acceptor, unmet, met, noExpand, steps, g7);
};

// picture/film/scenes/p21/agents.js
function s21Path(s, t, own, unrelated, three) {
  const Y = 560, xs = en ? [340, 720, 1080, 1390, 1700] : [400, 820, 1230, 1520, 1720], stones = [565, 655, 745, 835].map((x) => x + L(120, 20)), SP = L(1020, 900);
  const [confirm, runs, read, conclude] = cues(s, [
    ["先确认", "first confirm"],
    ["跑完对得上说法的核验", "runs checks"],
    ["读完全部结果", "reads the complete results"],
    ["再下结论", "before summarizing"]
  ]);
  const stateAt = cueFrom(s, "现状", "current state", own), ticks = [
    cue(s, "任务", "the task"),
    cue(s, "要处理的对象", "target"),
    stateAt,
    cueFrom(s, "负责人", "responsible person", stateAt),
    cueFrom(s, "适用的项目规则", "applicable local rules", stateAt)
  ];
  const stepAts = cues(s, [
    ["一步步来", "moves in"],
    ["每步", "reversible"],
    ["可逆", "verifiable"],
    ["可核验", "steps"]
  ]);
  const firstName = [
    en ? ["Task", ", target", ", current state", ", responsible person", ", local rules"] : ["先确认任务、", "要处理的对象、", "现状、", "负责人", "和适用的项目规则"],
    [confirm, ...ticks.slice(1)]
  ];
  const stepName = en ? [["Reversible,", " verifiable steps"], stepAts.slice(1, 3)] : [["一步步来", "，每步", "都可逆、可核验"], stepAts.slice(0, 3)];
  const way = [confirm, stepName[1][0], runs, read, conclude], NY = Y + NAME_GAP + 18, wrap = L(280, 360), FIRST = L(560, 430);
  const firstLines = growTexts(firstName[0], FIRST).map((line2) => line2.map(([, v]) => v).join(""));
  const widest = firstLines.reduce((a, b) => measure(b) > measure(a) ? b : a);
  const head = L("智能体", "Agent"), headX = xs[0] - measure(widest) / 2 + hangOf(widest, "center");
  line(headX + measure(head) + NAME_GAP, Y, xs[4] + 70, Y, {
    color: P.muted,
    alpha: three,
    width: 3
  });
  nameText(head, headX, Y, { align: "left", color: P.evidence, alpha: three * named(t, own) });
  [0, 2, 3, 4].forEach((i) => {
    if (speaking(t, way, i) > 0)
      ring(xs[i], Y, 30, {
        color: P.evidence,
        alpha: speaking(t, way, i) * restMark(P.evidence, 0.5) * three,
        width: 2
      });
  });
  ticks.forEach((at, k) => {
    const bx = xs[0] + (k - (ticks.length - 1) / 2) * 40, on = named(t, at) * three;
    box(bx - 13, Y - 90, 26, 26, { stroke: P.evidence, alpha: on, radius: 5, width: 2.5 });
    check(bx, Y - 77, 15, { alpha: on, upto: clamp((t - at + 0.1) / 0.35) });
  });
  stones.forEach((x, k) => {
    const on = soon(t, stepAts[k] + 0.1, 0.5);
    box(x - 30, Y - 7, 60, 14, { fill: P.row, stroke: P.ink, alpha: three * on, radius: 7 });
    check(x, Y - 40, 18, { alpha: three * on, upto: clamp((t - stepAts[k] - 0.1) / 0.35) });
  });
  const tryAt = unrelated + 0.05, barY = Y - 135;
  box(SP - 50, Y - 300, 100, 60, {
    stroke: P.muted,
    alpha: three * ramp(t, tryAt, 0.3),
    radius: 6,
    dash: [6, 6]
  });
  link(SP, Y - 16, SP, Y - 240, {
    color: P.unknown,
    alpha: three * ramp(t, tryAt, 0.3),
    upto: 0.53,
    draw: { t, at: tryAt },
    end: false,
    dash: [8, 8]
  });
  line(SP - 22, barY, SP + 22, barY, {
    color: P.unknown,
    alpha: ramp(t, tryAt + 0.5, 0.3) * three,
    width: 4
  });
  rejectedName(L("顺手改无关的东西", "Incidental changes"), SP, Y - 300 - NAME_GAP, {
    valign: "bottom",
    alpha: three * named(t, unrelated),
    mark: ramp(t, tryAt + 0.5, 0.3)
  });
  check(xs[2], Y - 80, 36, {
    alpha: three * named(t, runs),
    upto: clamp((t - runs - 0.3) / 0.5)
  });
  const RW = 120, RH = 160, rx = xs[3] - RW / 2, ry = Y - 260, readQ = clamp((t - read - 0.05) / 1.2) * 6;
  s17Page(rx, ry, RW, RH, { alpha: three * named(t, read), rows: 6 });
  for (let i = 0; i < 6; i++) {
    const yy = ry + RH * (0.3 + i * 0.55 / 6);
    line(rx + RW * 0.14, yy, rx + RW * (i % 2 ? 0.62 : 0.82), yy, {
      color: P.evidence,
      alpha: three * clamp(readQ - i),
      width: 2.5
    });
  }
  s17Page(xs[4] - 40, Y - 200, 80, 104, { alpha: three * named(t, conclude), rows: 2 });
  let ax = xs[0];
  const walk = [
    [stepAts[0], stones[3], xs[0]],
    [runs, xs[2], stones[3]],
    [read, xs[3], xs[2]],
    [conclude, xs[4], xs[3]]
  ];
  walk.forEach(([at, x, x0], k) => {
    const go = voiceTime(at + 0.05), span2 = k ? glideTime(x - x0) : Math.max(glideTime(x - x0), voiceTime(stepAts[3] + 0.05) - go);
    ax = mix(ax, x, smoother((voiceTime(t) - go) / span2));
  });
  [0, 2, 3, 4].forEach((i) => {
    const near = ax >= xs[i] ? 1 : clamp(1 - (xs[i] - ax) / 40);
    if (near > 0) dot(xs[i], Y, 13 * near, { color: P.evidence, alpha: three });
  });
  agent(ax, Y, { alpha: three });
  [firstName, stepName].forEach(([parts, ats], i) => {
    if (i && !en)
      termRow(t, [parts[0]], [ats[0]], [parts[1].slice(1), parts[2]], ats.slice(1), xs[i], NY, {
        inline: false,
        align: "center",
        alpha: three * listLevel(t, way, i),
        set: "way",
        build: true
      });
    else
      growName(t, parts, ats, xs[i], NY, {
        width: i ? wrap : FIRST,
        alpha: three * listLevel(t, way, i),
        set: "way",
        build: true,
        align: "center"
      });
  });
  (en ? ["Runs checks", "Reads the complete results", "Summarizing"] : ["跑完对得上说法的核验", "读完全部结果", "再下结论"]).forEach(
    (v, k) => nameText(v, xs[k + 2], NY, {
      valign: "top",
      width: 370,
      alpha: three * listIn(t, way, k + 2),
      set: "way"
    })
  );
}
function s21Parallel(s, t, parallel, integrate, four) {
  const [apart, readOnly] = cues(s, [
    ["能拆开的独立问题", "independent questions"],
    ["只看不改", "read-only"]
  ]);
  const roles = cues(s, [
    ["研究", "research"],
    ["评审和", "review and"],
    ["交叉核对", "crosschecking"]
  ]);
  const rnames = en ? ["Research", "Review", "Cross-checking"] : ["研究", "评审", "交叉核对"], ownerName = L("一个人汇总、核验、做最后判断", "");
  const apartLines = L(
    ["能拆开的独立问题、", "路径或评审角度"],
    ["Independent questions,", "paths or review angles"]
  );
  const left = 700 - 60 - NAME_GAP - Math.max(
    measure(L("多个智能体并行", "Parallel Agents")),
    measure(L("只看不改", "Read-only")),
    ...apartLines.map((v) => measure(v))
  );
  const reach = Math.max(
    1220 + 30 + NAME_GAP + measure(rnames[2]),
    960 + 30 + NAME_GAP + measure(ownerName)
  );
  const sh0 = 960 - (left + 1220 + 40) / 2, sh1 = 960 - (left + reach) / 2, sh = mix(sh0, sh1, glide(t, roles[2] + 0.05, sh1 - sh0));
  const xs = [700, 960, 1220].map((x) => x + sh), BY = 270, QY = 340, AY = 480, KY = 630, OY = 760, join = { t, at: integrate + 0.05 };
  const asked = named(t, apart) * four, shut = named(t, readOnly) * four, owner = named(t, integrate) * four;
  nameText(L("多个智能体并行", "Parallel Agents"), xs[0] - 60 - NAME_GAP, AY, {
    align: "right",
    alpha: four * named(t, parallel)
  });
  nameText(apartLines, xs[0] - 60 - NAME_GAP, QY, { align: "right", alpha: asked });
  nameText(L("只看不改", "Read-only"), xs[0] - 60 - NAME_GAP, KY, {
    align: "right",
    color: P.evidence,
    alpha: shut
  });
  line(xs[0] - 40, KY, xs[2] + 40, KY, { color: P.evidence, alpha: shut, width: 2 });
  stroke(
    () => {
      ctx.moveTo(xs[0], BY);
      ctx.lineTo(xs[2], BY);
      xs.forEach(
        (x) => [
          [BY, QY - 24],
          [QY + 24, AY - 30],
          [AY + 30, KY - 18]
        ].forEach(([a, b]) => {
          ctx.moveTo(x, a);
          ctx.lineTo(x, b);
        })
      );
    },
    { color: P.muted, alpha: four, width: 3 }
  );
  const takes = roles.map((at, i) => i ? ramp(t, at - 0.15, 0.4) : 1), AR = 22 * 1.15;
  [2, 1].forEach((k) => {
    const q = four * (1 - takes[3 - k]), x = xs[0] - k * 9, y = AY - k * 9;
    diamond(x, y, AR, { color: P.ground, alpha: q, solid: true });
    diamond(x, y, AR, { color: P.evidence, alpha: q });
  });
  xs.forEach((x, i) => {
    ring(x, QY, 20, { color: P.unknown, alpha: asked, width: 2.5 });
    text("?", x, QY + 1, 22, { align: "center", color: P.unknown, alpha: asked, role: "mark" });
    if (!i) diamond(x, AY, AR, { color: P.ground, alpha: four, solid: true });
    agent(x, AY, { alpha: four * takes[i], size: 1.15 });
    const lit = speaking(t, roles, i);
    if (lit > 0)
      ring(x, AY, 38, {
        color: P.evidence,
        alpha: lit * restMark(P.evidence, 0.5) * four,
        width: 2
      });
    nameText(rnames[i], x + 30 + NAME_GAP, AY, {
      align: "left",
      alpha: four * listIn(t, roles, i),
      set: "roles"
    });
    lock(x, KY, { alpha: shut, color: P.evidence, closed: soon(t, readOnly, 0.5) });
    link(x, KY + 28, xs[1], OY - 42, {
      route: "vhv",
      mid: (KY + OY - 22) / 2,
      alpha: four * ramp(t, integrate - 0.1, 0.3),
      draw: join,
      flowing: since(t, integrate + 0.65),
      lag: i / 3
    });
  });
  person(xs[1], OY, { alpha: owner, color: P.authority, size: 1.2 });
  nameText(ownerName, xs[1] + 30 + NAME_GAP, OY, {
    align: "left",
    width: 520,
    color: P.authority,
    alpha: owner
  });
}

// picture/film/scenes/p21/facts.js
function s21Majority(s, t, majority, five) {
  const [opinion, not, evidence] = cues(s, [
    ["意见", "opinion"],
    ["不是证据", "not evidence"],
    ["证据", "evidence"]
  ]);
  const fy = 405, fh = 190, lx = 445, lw = 280, ax = 1200, aw = 240, mid = fy + fh / 2, go = { t, at: opinion + 0.05 }, ev = named(t, evidence) * five;
  box(lx, fy, lw, fh, { stroke: P.line, alpha: five, radius: 10 });
  box(ax, fy, aw, fh, { fill: P.row, stroke: P.evidence, alpha: ev, radius: 10 });
  nameText(L("多数意见", "A majority opinion"), lx, fy - NAME_GAP, {
    align: "left",
    valign: "bottom",
    alpha: five * named(t, majority)
  });
  nameText(L("证据", "Evidence"), ax, fy - NAME_GAP, {
    align: "left",
    valign: "bottom",
    color: P.evidence,
    alpha: ev
  });
  [lx + 62, lx + 140, lx + 218].forEach((x) => {
    agent(x, mid + 34, { alpha: five, size: 1 });
    check(x, mid - 40, 26, { alpha: five, color: P.muted });
  });
  s17Page(ax + aw / 2 - 55, mid - 70, 110, 140, { alpha: ev, rows: 5, stroke: P.evidence });
  link(lx + lw + 12, mid, ax - 12, mid, {
    color: P.unknown,
    alpha: five * ramp(t, opinion + 0.05, 0.3),
    upto: 0.5,
    draw: go,
    end: false,
    dash: [8, 8]
  });
  line((lx + lw + ax) / 2, mid - 34, (lx + lw + ax) / 2, mid + 34, {
    color: P.unknown,
    alpha: ramp(t, not + 0.05, 0.3) * five,
    width: 4
  });
}
function s21TeamFact(s, t, lasting, authoritative, teamFact, six) {
  const [recorded, src, lim] = cues(s, [
    ["记进", "recorded"],
    ["来源", "source"],
    ["限度", "limits"]
  ]);
  const outputName = L("检查过的输出", "Checked output"), recordName = L("这项工作的权威记录", ""), factName = L("", "A lasting team fact");
  const entries = en ? ["Source", "Limits"] : ["来源", "限度"];
  const BACK = 26, left = Math.min(
    1e3 - 110 - NAME_GAP - measure(outputName),
    810 - (recordName ? NAME_GAP + measure(recordName) : 0)
  );
  const right = Math.max(
    1110 + 2 * BACK + 26 + NAME_GAP + Math.max(...entries.map((v) => measure(v))),
    1190 + 30 + (factName ? NAME_GAP + measure(factName) : 0)
  );
  const shift = 960 - (left + right) / 2;
  const OX = 1e3 + shift, OY = 300, OW = 220, OH = 260, RX = 810 + shift, RY = 640, RW = 380, RH = 150, stampAt = Math.max(teamFact, authoritative) + 0.05;
  const go = soon(t, recorded + 0.05, 0.6), rec = named(t, authoritative) * six, EX = OX + OW / 2 + 2 * BACK + 26;
  const PX = OX - OW / 2;
  for (let k = 2; k >= 1; k--)
    path(
      [
        [PX + k * BACK, OY - (k - 1) * BACK],
        [PX + k * BACK, OY - k * BACK],
        [PX + OW + k * BACK, OY - k * BACK],
        [PX + OW + k * BACK, OY + OH - k * BACK],
        [PX + OW + (k - 1) * BACK, OY + OH - k * BACK]
      ],
      { color: P.ink, alpha: six, width: 2 }
    );
  documentIcon(PX, OY, OW, OH, { alpha: six, rows: 0 });
  check(OX, OY + OH / 2 + 6, 90, { alpha: six });
  nameText(outputName, PX - NAME_GAP, OY + OH / 2, {
    align: "right",
    alpha: six * named(t, lasting)
  });
  [src, lim].forEach((at, k) => {
    const y = OY + 90 + k * 56, whole = named(t, at) * ramp(t, stampAt, 0.35);
    dot(EX, y, 6, { color: P.evidence, alpha: six * named(t, at) });
    nameText(entries[k], EX + NAME_GAP, y, {
      align: "left",
      color: P.evidence,
      alpha: six * Math.max(listIn(t, [src, lim], k), whole),
      set: "entry"
    });
  });
  link(OX, OY + OH + 12, OX, RY - 12, {
    color: P.evidence,
    alpha: six * named(t, recorded),
    upto: go,
    flowing: since(t, recorded + 0.65)
  });
  box(RX, RY, RW, RH, { fill: P.row, stroke: P.ink, alpha: rec, radius: 12, width: 2.5 });
  nameText(recordName, RX - NAME_GAP, RY + RH / 2, { align: "right", width: 320, alpha: rec });
  [RY + 30, RY + 75].forEach(
    (y, k) => line(RX + 40, y, RX + RW - 60 - k * 90, y, { color: P.line, alpha: rec, width: 3 })
  );
  line(
    RX + 40,
    RY + 120,
    mix(RX + 40, RX + RW - 100, drawShare(t, recorded + 0.65, RW - 140)),
    RY + 120,
    { color: P.evidence, alpha: six * ramp(t, recorded + 0.65, 0.4), width: 4 }
  );
  const SX = RX + RW, SY = RY + RH / 2, stamp = ramp(t, stampAt, 0.35) * six;
  if (teamFact + 0.5 < stampAt)
    ring(SX, SY, 30, {
      color: P.evidence,
      alpha: six * named(t, teamFact) * (1 - ramp(t, stampAt, 0.35)),
      width: 2,
      dash: [6, 6]
    });
  dot(SX, SY, 30, { color: P.ground, alpha: stamp });
  ring(SX, SY, 30, { color: P.evidence, alpha: stamp, width: 3 });
  check(SX, SY + 2, 26, { alpha: stamp, upto: clamp((t - stampAt) / 0.35) });
  nameText(factName, SX + 30 + NAME_GAP, SY, { align: "left", alpha: six * named(t, teamFact) });
}

// picture/film/scenes/p21/work.js
function s21Output(s, t, WX, WY, WW, WH, wcx, wcy, work, lens, output, actual, summary, one) {
  const SX = 1090, SW = 190, SH = 240, SY = WY + WH - SH, scx = SX + SW / 2;
  const go = glide(t, actual + 0.05, Math.hypot(70, 60)), sway = ramp(voiceTime(t), voiceTime(actual + 1), 0.6), v = voiceTime(t) - voiceTime(actual);
  const pairOff = 960 - (2 * WX + WW + 52) / 2, paired = glide(t, summary + 0.05, pairOff), lead = pairOff * (1 - paired);
  const opens = named(t, s.words[0].start), LX = wcx + 70, LY = wcy - 80;
  work(one * opens, WX + lead);
  s17Page(SX, SY, SW, SH, { alpha: one * named(t, summary), rows: 2 });
  const headX = mix(960, (WX + SX + SW) / 2, paired);
  nameText(L("智能体的输出", "An Agent's output"), headX, WY - 52 - NAME_GAP, {
    valign: "bottom",
    alpha: one * named(t, output)
  });
  nameText(L("实际的工作", "The work"), wcx + 26 + lead, WY + WH + NAME_GAP, {
    valign: "top",
    alpha: one * named(t, actual)
  });
  nameText(L("它写的摘要", "Its summary"), scx, SY + SH + NAME_GAP, {
    valign: "top",
    color: P.muted,
    alpha: one * named(t, summary)
  });
  lens(
    mix(LX, wcx, go) + lead + Math.sin(v * 1.1) * 10 * sway,
    mix(LY, wcy - 20, go) + Math.cos(v * 0.9) * 7 * sway,
    one * opens
  );
}
function s21Checklist(s, t, two) {
  const c = (zh, english) => cue(s, zh, english);
  const marks = en ? [
    [c("", "authority"), c("", "the state current")],
    [c("", "inputs")],
    [c("", "assumptions"), c("", "inferences"), c("", "and judgments")],
    [c("", "actual changes"), c("", "agreed and reported scope")],
    [
      c("", "verification"),
      c("", "current version"),
      c("", "right environment"),
      c("", "really run")
    ],
    [c("", "anything highrisk"), c("", "the decision owner"), c("", "explicitly approve")]
  ] : [
    [c("行动依据", ""), c("现状", "")],
    [c("输入", "")],
    [c("假定", ""), c("推论", ""), c("判断", "")],
    [c("实际改动", ""), c("约定", "")],
    [c("核验真在", ""), c("当前版本", ""), c("正确环境", ""), c("跑过吗", "")],
    [c("高风险的操作", ""), c("决策负责人", ""), c("明确批准", "")]
  ];
  const sealAt = Math.max(marks[5][0], marks[5][2]) + 0.05;
  const ticks = (en ? [
    c("", "current"),
    c("", "true and complete"),
    c("", "kept apart"),
    c("", "reported scope") + 0.45,
    marks[4][2] + 0.45
  ] : [c("最新", ""), c("真实完整", ""), c("分清了吗", ""), c("一致吗", ""), marks[4][3] + 0.45]).concat(sealAt);
  const starts = marks.map((v) => Math.min(...v));
  const PL = 360, PW = 1200, pitch = 90, IX = 480, NX = 620, TX = PL + PW - 60;
  const shown = starts.map((at) => soon(t, pauseHold(at - 0.3, 0.4), 0.4)), n = shown.reduce((a, b) => a + b, 0);
  const rowAt = starts.map((at) => Math.max(at - 0.15, pauseHold(at - 0.3, 0.4) + 0.25));
  const on = (k, j) => ramp(t, Math.max(marks[k][j] - 0.15, rowAt[k]), 0.4) * two;
  const yOf = (k) => 500 + (k - (n - 1) / 2) * pitch, top = 500 - n * pitch / 2 - 24, bottom = 500 + n * pitch / 2 + 24;
  documentIcon(PL, top, PW, bottom - top, { alpha: two, rows: 0 });
  nameText(L("实际的工作", "The work"), PL, top - NAME_GAP, {
    align: "left",
    valign: "bottom",
    alpha: two
  });
  const names = en ? [
    "Authority to act",
    "Inputs",
    "Assumptions, inferences and judgments",
    "Actual changes",
    "Verification",
    "Approve anything high-risk"
  ] : ["行动依据和现状", "输入", "假定、推论和判断", "实际改动", "核验", "高风险的操作"];
  names.forEach((v, k) => {
    const y = yOf(k), row = ramp(t, rowAt[k], 0.4) * two, lit = k + 1 < starts.length ? ramp(t, starts[k] - 0.15, 0.3) * (1 - ramp(t, rowAt[k + 1], 0.3)) : speaking(t, starts, k);
    if (row <= 0) return;
    if (lit > 0)
      line(PL + 22, y - 30, PL + 22, y + 30, { color: P.evidence, alpha: lit * row, width: 4 });
    line(IX - 80, y + 40, TX + 18, y + 40, { color: P.line, alpha: row, width: 2 });
    const read = ease(
      (voiceTime(t) - voiceTime(starts[k])) / Math.max(
        0.6,
        voiceTime(ticks[k]) - voiceTime(starts[k]),
        1.5 * (TX - 90 - IX + 80) / GLIDE_PEAK
      )
    ), rx = mix(IX - 80, TX - 90, read);
    if (read > 0 && read < 1)
      line(rx, y + 40, rx + 60, y + 40, {
        color: P.evidence,
        alpha: two * pass(read, 0.15),
        width: 6
      });
    box(TX - 18, y - 18, 36, 36, { stroke: P.evidence, alpha: row, radius: 6, width: 2.5 });
    if (k === 0) {
      documentIcon(IX - 74, y - 34, 52, 68, { alpha: on(0, 0), rows: 0 });
      dot(IX - 26, y + 24, 13, { color: P.row, alpha: on(0, 0) });
      seal(IX - 26, y + 24, 13, { alpha: on(0, 0) });
      clock(IX + 44, y, 24, { hand: 0.3, color: P.evidence, alpha: on(0, 1) });
    }
    if (k === 1)
      for (let j = 0; j < 3; j++)
        tableIcon(IX - 74 + j * 20, y - 32 + j * 12, 100, 40, {
          alpha: on(1, 0),
          rows: 3,
          cols: 3
        });
    if (k === 2) {
      ring(IX - 52, y, 14, { color: P.muted, alpha: on(2, 0), width: 2.5, dash: [4, 4] });
      [
        [-7, 6],
        [7, 6],
        [0, -7]
      ].forEach(([dx, dy]) => dot(IX + dx, y + dy, 3.5, { color: P.ink, alpha: on(2, 1) }));
      line(IX + 52, y - 12, IX + 52, y + 12, { color: P.ink, alpha: on(2, 2), width: 2.5 });
      line(IX + 38, y - 10, IX + 66, y - 10, { color: P.ink, alpha: on(2, 2), width: 2.5 });
      line(IX + 44, y + 12, IX + 60, y + 12, { color: P.ink, alpha: on(2, 2), width: 2.5 });
      [IX - 26, IX + 26].forEach(
        (x, j) => link(x, y + 24, x, y - 24, {
          color: P.line,
          alpha: two,
          draw: { t, at: ticks[2] + 0.05 + j * 0.12 },
          end: false,
          width: 2
        })
      );
    }
    if (k === 3) {
      [
        [-52, -18, 70],
        [-24, 0, 84],
        [-46, 18, 56]
      ].forEach(
        ([dx, dy, w]) => box(IX + dx, y + dy - 6, w, 12, { fill: P.evidence, alpha: on(3, 0), radius: 6 })
      );
      const scope = { t, at: marks[3][1] + 0.05 };
      path(
        [
          [IX - 76, y - 36],
          [IX + 76, y - 36],
          [IX + 76, y + 36],
          [IX - 76, y + 36],
          [IX - 76, y - 36]
        ],
        { color: P.ink, alpha: two, width: 2.5, draw: scope }
      );
    }
    if (k === 4) {
      const runX = IX - 34;
      ring(runX, y, 24, { color: P.evidence, alpha: on(4, 0), width: 3 });
      fill(
        () => {
          ctx.moveTo(runX - 7, y - 10);
          ctx.lineTo(runX + 11, y);
          ctx.lineTo(runX - 7, y + 10);
          ctx.closePath();
        },
        { color: P.evidence, alpha: on(4, 0) }
      );
      const lap = glide(t, marks[4][3] + 0.05, 2 * Math.PI * 24, 1);
      if (lap > 0 && lap < 1)
        flowDot(
          runX + 24 * Math.cos(-Math.PI / 2 + lap * Math.PI * 2),
          y + 24 * Math.sin(-Math.PI / 2 + lap * Math.PI * 2),
          6,
          lap,
          { alpha: two },
          2 * Math.PI * 24
        );
      box(IX + 10, y - 17, 54, 34, { fill: P.row, alpha: on(4, 1), radius: 6 });
      text("v2", IX + 37, y + 1, 26, {
        role: "mark",
        align: "center",
        color: P.evidence,
        alpha: on(4, 1)
      });
      box(IX - 78, y - 38, 156, 76, { stroke: P.ink, alpha: on(4, 2), radius: 12, width: 2 });
    }
    if (k === 5) {
      diamond(IX - 46, y + 6, 18, { color: P.unknown, alpha: on(5, 0), solid: true });
      person(IX + 44, y + 12, { color: P.authority, alpha: on(5, 1), size: 0.8 });
      const move = soon(t, sealAt, 0.35), sealX = mix(IX + 44, IX - 26, move), sealY = mix(y - 30, y - 12, move);
      dot(sealX, sealY, 14, { color: P.row, alpha: on(5, 2) });
      seal(sealX, sealY, 14, { alpha: on(5, 2) });
    }
    check(TX, y, 24, { alpha: two, draw: { t, at: ticks[k] + 0.05 } });
    nameText(v, NX, y, {
      align: "left",
      alpha: two * ramp(t, rowAt[k], 0.4) * listLevel(t, starts, k),
      set: "checks"
    });
  });
}

// picture/film/scenes/p21/scene.js
scenes["21"] = function(s, t) {
  const [own, unrelated, parallel, integrate, majority] = cues(s, [
    ["智能体也要先确认", "an agent must first confirm"],
    ["不顺手改无关的东西", "without incidental changes"],
    ["多个智能体并行", "parallel agents"],
    ["指定一个人", "one person verifying"],
    ["多数意见不是证据", "majority opinion"]
  ]);
  const [lasting, authoritative, teamFact] = cues(s, [
    ["检查过的输出", "even checked output"],
    ["这项工作的权威记录", "authoritative record"],
    ["长期依靠的事实", "lasting team fact"]
  ]);
  const base = ramp(t, opening(s), 0.7);
  const WX = 630, WY = 340, WW = 340, WH = 380, wcx = WX + WW / 2, wcy = WY + WH / 2;
  const work = (a, x = WX) => {
    for (let k = 2; k >= 1; k--)
      path(
        [
          [x + k * 26, WY - (k - 1) * 26],
          [x + k * 26, WY - k * 26],
          [x + WW + k * 26, WY - k * 26],
          [x + WW + k * 26, WY + WH - k * 26],
          [x + WW + (k - 1) * 26, WY + WH - k * 26]
        ],
        { color: P.ink, alpha: a, width: 2 }
      );
    documentIcon(x, WY, WW, WH, { alpha: a, rows: 0 });
    stroke(
      () => {
        for (let i = 0; i < 9; i++) {
          ctx.moveTo(x + 34, WY + 44 + i * 36);
          ctx.lineTo(x + WW - (i % 3 === 2 ? 120 : 40), WY + 44 + i * 36);
        }
      },
      { color: P.muted, alpha: a * 0.8, width: 2 }
    );
  };
  const lens = (x, y, a) => {
    ring(x, y, 54, { color: P.evidence, alpha: a, width: 3.5 });
    line(x + 39, y + 39, x + 76, y + 76, { color: P.evidence, alpha: a, width: 5 });
  };
  const [output, actual, summary, first] = cues(s, [
    ["智能体的输出", "an agent's output"],
    ["实际的工作", "checking the work"],
    ["它写的摘要", "its summary"],
    ["行动依据和现状", "is the authority to act correct"]
  ]);
  const one = base * stageOut(t, first);
  if (one > 0) s21Output(s, t, WX, WY, WW, WH, wcx, wcy, work, lens, output, actual, summary, one);
  const two = base * stageIn(t, first) * stageOut(t, own);
  if (two > 0) s21Checklist(s, t, two);
  const three = base * stageIn(t, own) * stageOut(t, parallel);
  if (three > 0) s21Path(s, t, own, unrelated, three);
  const four = base * stageIn(t, parallel) * stageOut(t, majority);
  if (four > 0) s21Parallel(s, t, parallel, integrate, four);
  const five = base * stageIn(t, majority) * stageOut(t, lasting);
  if (five > 0) s21Majority(s, t, majority, five);
  const six = base * stageIn(t, lasting);
  if (six > 0) s21TeamFact(s, t, lasting, authoritative, teamFact, six);
};

// picture/film/scenes/p22/escalation.js
function s22Escalation(s, t, stopAt, escalate, independent, names, nameAts, WY, SY, SR, BUS, GY, PAIR, ONE, NY, PX, OY, AX, LANE, glyphs, kinds, g1) {
  line(150, WY, 1770, WY, { color: P.line, alpha: g1, width: 3.5 });
  person(AX - 30, WY - 19, { alpha: g1, color: P.authority, size: 0.85 });
  agent(AX + 32, WY, { alpha: g1, size: 1.2 });
  nameText(L("成员和智能体", "Members and Agents"), AX, WY + 22 * 1.2 + NAME_GAP, {
    valign: "top",
    width: 260,
    alpha: g1
  });
  const owner = named(t, escalate) * g1;
  person(PX, OY, { alpha: owner, color: P.authority, size: 1.1 });
  nameText(L("上报", "Escalate"), PX + 15 * 1.1 + NAME_GAP, OY - 15 * 1.1 * 1.15, {
    align: "left",
    color: P.authority,
    alpha: owner
  });
  const xs = en ? names.map((_, i) => 540 + i * 270) : railStations(names, 500, 1660, { wrap: 260 });
  const signAt = (i) => (i ? nameAts[i] : stopAt) - 0.15, rise = (i) => i ? nameAts[i] + 0.05 : escalate;
  const current = (i) => ramp(t, signAt(i) + 0.2, 0.3) * (i + 1 < xs.length ? 1 - ramp(t, signAt(i + 1) + 0.2, 0.3) : 1);
  const arrived = Math.max(
    ...xs.map((_, i) => ramp(t, rise(i) + 0.7, 0.3) * (1 - ramp(t, rise(i) + 1.1, 0.45)))
  );
  if (arrived > 0)
    ring(PX, OY - 19, 30, {
      color: P.authority,
      alpha: arrived * restMark(P.authority, 0.6) * g1,
      width: 2
    });
  nameText(L("停下", "Stop"), xs[0] - SR - NAME_GAP, SY, {
    align: "right",
    alpha: named(t, stopAt - 0.1) * g1
  });
  nameText(L("五类情况", "Five kinds of situation"), AX, NY, {
    valign: "top",
    width: 220,
    color: P.muted,
    alpha: named(t, cue(s, "五类情况", "five kinds of situation")) * g1
  });
  xs.forEach((x, i) => {
    const sign = ramp(t, signAt(i), 0.3) * g1;
    line(x, SY + SR + 2, x, WY - 2, { color: P.line, alpha: sign, width: 2 });
    stopSign(x, SY, SR, { alpha: sign });
    const lit = current(i);
    if (lit > 0)
      ring(x, SY, SR + 10, {
        color: P.unknown,
        alpha: lit * restMark(P.unknown, 0.5) * g1,
        width: 2
      });
    const up = { t, at: rise(i) + 0.05 }, escalating = since(t, rise(i) + 0.85);
    link(x, SY - SR - 4, PX, OY + 34, {
      route: "vhv",
      mid: BUS,
      color: P.authority,
      alpha: g1 * mix(restMark(P.authority), 1, lit),
      draw: up,
      width: 2.5,
      flowing: escalating,
      last: i + 1 < xs.length ? since(signAt(i + 1) + 0.35, rise(i) + 0.85) : Infinity
    });
    const held = kinds[i];
    const spots = held.length > 2 ? [
      [-62, -PAIR],
      [34, -PAIR],
      [0, PAIR]
    ] : held.length > 1 ? [
      [0, -PAIR],
      [0, PAIR]
    ] : [[0, ONE]];
    held.forEach((k, n) => glyphs[k](x + spots[n][0], GY + spots[n][1], g1));
  });
  if (en)
    xs.forEach((x, i) => {
      if (i % 2)
        line(x, NY + 2, x, NY + RAIL_ROW - 6, {
          alpha: g1 * ramp(t, nameAts[i] - 0.15, 0.4),
          width: 2
        });
    });
  railNames(names, xs, WY, {
    gap: (i) => NY - WY + (en && i % 2 ? RAIL_ROW : 0),
    wrap: 460,
    alpha: (i) => g1 * listIn(t, nameAts, i),
    set: "conditions"
  });
  const lane = ramp(t, independent + 0.05, 0.5) * g1;
  if (lane > 0) {
    line(150, LANE, 1770, LANE, { color: P.line, alpha: lane, width: 2 });
    const q = loopPhase(since(t, independent + 0.05), 1596);
    if (q !== null) flowDot(mix(162, 1758, q), LANE, 10, q, { color: P.evidence, alpha: lane });
    nameText(L("已授权的工作", "Independent authorized work"), 960, LANE + NAME_GAP, {
      valign: "top",
      color: P.muted,
      alpha: lane
    });
  }
}

// picture/film/scenes/p22/kept.js
var dlKept = [
  (x, y, a) => {
    stroke(() => ctx.arc(x, y + 10, 24, Math.PI, Math.PI * 2), {
      color: P.authority,
      alpha: a,
      width: 3
    });
    line(x, y + 10, x + 14, y - 8, { color: P.ink, alpha: a, width: 3 });
    dot(x, y + 10, 4, { color: P.ink, alpha: a });
  },
  (x, y, a) => {
    box(x - 17, y - 24, 34, 48, { stroke: P.ink, alpha: a, radius: 4, width: 2, dash: [5, 4] });
    line(x - 9, y - 6, x + 9, y - 6, { color: P.muted, alpha: a, width: 2 });
    line(x - 9, y + 6, x + 5, y + 6, { color: P.muted, alpha: a, width: 2 });
  },
  (x, y, a) => {
    cross(x - 14, y - 12, 14, { alpha: a, width: 3 });
    cross(x - 14, y + 12, 14, { alpha: a, width: 3 });
    check(x + 14, y, 22, { alpha: a });
  },
  (x, y, a) => {
    box(x - 13, y - 24, 26, 48, { stroke: P.ink, alpha: a, radius: 3, width: 2 });
    line(x - 24, y + 4, x + 20, y + 4, { color: P.evidence, alpha: a, width: 3 });
    dot(x - 24, y + 4, 5, { color: P.evidence, alpha: a });
  }
];

// picture/film/scenes/p22/records.js
function s22Records(t, handoff, told, interrupt, kept, HY, handway, g2) {
  handway(g2, 1 - ramp(t, interrupt, 0.4), handoff + STAGE_CUT);
  const items = en ? [
    ["The work", "work"],
    ["Delivery state", "state"],
    ["Evidence", "evidence"],
    ["Limits", "limits"],
    ["Acceptance still needed", "acceptance"]
  ] : [
    ["做到了哪一步", "state"],
    ["做了什么", "work"],
    ["怎么核验的", "evidence"],
    ["还有哪些限度", "limits"],
    ["还要谁验收", "acceptance"]
  ];
  const names3 = en ? ["The state", "Uncommitted work", "Attempts and failures", "Where to resume"] : ["现场", "没提交的改动", "试过和失败的办法", "从哪里接着做"];
  const HEAD = 64, ROW = 68, IX = 50, NX = 92, PT = HY + 64, ROW3 = ROW * 1.5, FT = PT, NX3 = 130, PR = 26, FPAD = 24;
  const PH = 2 * FPAD - (ROW3 - 80) + ROW3 * names3.length, FIRST = HEAD + ROW, PITCH = (PH - HEAD / 2 - FIRST) / (items.length - 1);
  const PW = NX + Math.max(...items.map(([v]) => measure(v))) + 34, widths = names3.map((v) => NX3 + measure(v) + 30), FWmax = Math.max(...widths);
  const px0 = 960 - (PW + 100 + FWmax) / 2 + 30, FX = px0 + PW + 100, SX = FX + FWmax / 2;
  link(px0 + PW / 2, HY + 6, px0 + PW / 2, PT - 4, {
    alpha: g2,
    draw: { t, at: handoff + STAGE_CUT },
    end: false
  });
  const length = told.reduce(
    (h, at, k) => h + (k ? PITCH : FIRST - HEAD / 2) * soon(t, pauseHold(at - 0.45, 0.4), 0.4),
    HEAD
  );
  documentIcon(px0, PT, PW, length, { alpha: g2, rows: 0 });
  nameText(L("汇报完成", "A completion report"), px0 + 28, PT + HEAD / 2, {
    align: "left",
    alpha: g2 * named(t, handoff)
  });
  items.forEach(([v, kind], k) => {
    const y = PT + FIRST + k * PITCH, x = px0 + IX, q = ramp(t, told[k] - 0.15, 0.4) * g2, lit = speaking(t, told, k);
    if (lit > 0)
      ring(x, y, 25, {
        color: P.evidence,
        alpha: lit * restMark(P.evidence, 0.6) * g2,
        width: 2
      });
    if (kind === "work") documentIcon(x - 14, y - 19, 28, 38, { alpha: q, rows: 2 });
    if (kind === "state") {
      stroke(() => ctx.arc(x, y + 8, 17, Math.PI, Math.PI * 2), {
        color: P.authority,
        alpha: q,
        width: 3
      });
      line(x, y + 8, x + 10, y - 5, { color: P.ink, alpha: q, width: 3 });
      dot(x, y + 8, 3.5, { color: P.ink, alpha: q });
    }
    if (kind === "evidence") check(x, y, 26, { alpha: q });
    if (kind === "limits") {
      line(x - 15, y, x + 5, y, { color: P.ink, alpha: q, width: 3 });
      line(x + 10, y - 14, x + 10, y + 14, { color: P.ink, alpha: q, width: 4 });
    }
    if (kind === "acceptance") seal(x, y, 15, { alpha: q, hollow: true });
    nameText(v, px0 + NX, y, { align: "left", alpha: g2 * listIn(t, told, k), set: "handoff" });
  });
  const pause = ramp(t, interrupt - 0.15, 0.4) * g2;
  if (pause > 0) {
    dot(SX, HY, PR, { color: P.ground, alpha: pause });
    ring(SX, HY, PR, { color: P.authority, alpha: pause, width: 3 });
    box(SX - 12, HY - 12, 8, 24, { fill: P.authority, alpha: pause, radius: 3 });
    box(SX + 4, HY - 12, 8, 24, { fill: P.authority, alpha: pause, radius: 3 });
    nameText(L("中途停下", "On interruption"), SX + PR + NAME_GAP, HY - PR, {
      align: "left",
      valign: "bottom",
      color: P.authority,
      alpha: g2 * named(t, interrupt)
    });
  }
  const grown = kept.map((at) => soon(t, pauseHold(at - 0.45, 0.4), 0.4));
  const FW = grown.reduce((w, q, k) => mix(w, Math.max(w, widths[k]), q), widths[0]), FH = grown.reduce((h, q) => h + ROW3 * q, 2 * FPAD - (ROW3 - 80));
  if (grown[0] > 0)
    box(FX, FT, FW, FH, { stroke: P.authority, alpha: g2 * grown[0], radius: 14, width: 2 });
  kept.forEach((at, k) => {
    const q = ramp(t, at - 0.15, 0.4) * g2, y = FT + FPAD + 40 + k * ROW3;
    box(FX + 28, y - 40, 80, 80, {
      fill: P.row,
      stroke: P.authority,
      alpha: q,
      radius: 8,
      width: 2
    });
    if (q > 0) dlKept[k](FX + 68, y, q);
    nameText(names3[k], FX + NX3, y, {
      align: "left",
      alpha: g2 * listIn(t, kept, k),
      set: "kept"
    });
  });
}

// picture/film/scenes/p22/scene.js
scenes["22"] = function(s, t) {
  const [stopAt, escalate] = cues(s, [
    ["要停下受影响的事", "stop"],
    ["上报", "escalate"]
  ]);
  const independent = cue(s, "已授权的工作", "independent authorized work");
  const [handoff, ...told] = en ? cues(s, [
    ["", "a completion report names"],
    ["", "the work"],
    ["", "the delivery state"],
    ["", "the evidence"],
    ["", "the limits"],
    ["", "any acceptance"]
  ]) : cues(s, [
    ["汇报完成时", ""],
    ["做到了哪一步", ""],
    ["做了什么", ""],
    ["怎么核验的", ""],
    ["还有哪些限度", ""],
    ["还要谁验收", ""]
  ]);
  const interrupt = cue(s, "中途停下", "on interruption");
  const kept = [
    ["保留现场", "preserve the state"],
    ["没提交的改动", "uncommitted work"],
    ["试过和失败", "attempts and failures"],
    ["从哪里接着做", "where to resume"]
  ].map(([zh, english]) => cueFrom(s, zh, english, interrupt));
  const base = ramp(t, opening(s), 0.7);
  const names = en ? [
    ["Instructions materially conflict"],
    ["Authority is insufficient"],
    ["Unrecognized work"],
    ["Contradicts expectation"],
    ["Continuing would harm"]
  ] : ["说不清", "权限不够", "来历不明", "核验和预期相反", "再做下去有害"];
  const nameAts = cues(
    s,
    en ? [
      ["", "instructions materially conflict"],
      ["", "authority is insufficient"],
      ["", "you find unrecognized work"],
      ["", "verification contradicts"],
      ["", "continuing would"]
    ] : [
      ["一是", ""],
      ["二是", ""],
      ["三是", ""],
      ["四是", ""],
      ["五是", ""]
    ]
  );
  const WY = 520, SY = 480, SR = 22, BUS = 360, GY = 632, PAIR = 48, ONE = 34, NY = 744, PX = 960, OY = 280, AX = 230, LANE = 852;
  const said = (g, zh, english, lead = 0.15) => ramp(t, cue(s, zh, english) - lead, 0.4) * g;
  const glyphs = [
    // Two instructions that cannot both hold.
    (x, y, g) => {
      const q = said(g, "指令有实质冲突", "instructions materially conflict");
      documentIcon(x - 70, y - 30, 44, 58, { alpha: q, rows: 3 });
      documentIcon(x + 26, y - 30, 44, 58, { alpha: q, rows: 3 });
      text("≠", x, y + 1, 30, {
        role: "mark",
        align: "center",
        color: P.unknown,
        alpha: said(g, "冲突", "conflict")
      });
    },
    // The target, the fact source and the responsible person, each on its own words, and each marked unknown as it
    // is said not to be identifiable: in English, which names them first, the marks on the words that say so, and in
    // Chinese, which says so first, each mark with its own name, the target on the words that say it cannot be
    // determined.
    (x, y, g) => {
      const [aim, basis, who] = en ? [said(g, "", "the target"), said(g, "", "fact source"), said(g, "", "responsible person")] : [said(g, "确定不了要处理的对象", ""), said(g, "事实依据", ""), said(g, "负责人", "")];
      const unknown = en ? ramp(t, cue(s, "", "can't be identified") - 0.15, 0.4) : 1;
      ring(x - 56, y + 8, 20, { color: P.ink, alpha: aim, width: 2.5 });
      dot(x - 56, y + 8, 5, { color: P.ink, alpha: aim });
      box(x - 17, y - 14, 34, 44, {
        fill: P.row,
        stroke: P.ink,
        alpha: basis,
        radius: 4,
        width: 2
      });
      [y - 2, y + 10].forEach(
        (ry, i) => line(x - 7, ry, x + (i ? 3 : 7), ry, { color: P.muted, alpha: basis, width: 2 })
      );
      person(x + 56, y + 16, { size: 0.8, alpha: who });
      [
        [x - 56, aim],
        [x, basis],
        [x + 56, who]
      ].forEach(
        ([qx, q]) => text("?", qx, y - 38, 26, {
          role: "mark",
          align: "center",
          color: P.unknown,
          alpha: q * unknown
        })
      );
    },
    // Authority that does not reach.
    (x, y, g) => lock(x, y + 6, { alpha: said(g, "权限不够", "authority is insufficient"), size: 1.1 }),
    // An action that would cross a permission, compliance, security or data boundary: the action's way reaches the
    // boundary, which stands in the colour 04 gives the boundaries, and the stretch beyond it, where the action would
    // go, draws on dashed in the unknown colour, after it, as the boundary is named.
    (x, y, g) => {
      const at = cue(s, "越过权限", "cross a permission"), q = said(g, "越过权限", "cross a permission");
      line(x, y - 24, x, y + 24, { color: P.authority, alpha: q, width: 4 });
      link(x - 46, y, x - 12, y, {
        color: P.ink,
        alpha: q,
        width: 3,
        draw: { t, at: at + 0.05 },
        end: false
      });
      link(x + 12, y, x + 44, y, {
        color: P.unknown,
        alpha: q,
        width: 2.5,
        dash: [5, 5],
        draw: { t, at: at + 0.3 }
      });
    },
    // A step that cannot be taken back: the authorization it lacks is an empty seal, and the recovery it lacks is the
    // recovery path's turn, drawn dashed and crossed.
    (x, y, g) => {
      const q = said(g, "不可逆的操作", "irreversible step");
      path(
        [
          [x - 78, y - 22],
          [x - 40, y - 22],
          [x - 40, y + 22],
          [x - 6, y + 22]
        ],
        { color: P.ink, alpha: q, width: 3 }
      );
      dot(x - 6, y + 22, 5, { color: P.ink, alpha: q });
      seal(x + 40, y - 20, 16, { alpha: said(g, "缺授权", "lacks authorization"), hollow: true });
      const back = said(g, "恢复办法", "recovery");
      path(
        [
          [x + 64, y + 10],
          [x + 18, y + 10],
          [x + 18, y + 38],
          [x + 58, y + 38]
        ],
        { color: P.muted, alpha: back, width: 2, dash: [5, 5] }
      );
      dot(x + 60, y + 38, 4, { color: P.muted, alpha: back });
      cross(x + 40, y + 24, 14, { alpha: back, width: 3 });
    },
    // Work of unknown origin, someone else's uncommitted work, and work whose owner is unknown, each on its words, laid
    // over the one before as a fanned stack of three different sheets, so the three read as one mark that the kind's
    // name names.
    (x, y, g) => {
      const q = said(g, "来历不明", "you find unrecognized work"), other = said(g, "别人还没提交", "someone else"), owner = said(g, "归属不明", "owner is unknown");
      documentIcon(x - 54, y - 26, 38, 50, { alpha: q, rows: 0 });
      text("?", x - 39, y + 2, 26, { role: "mark", align: "center", color: P.unknown, alpha: q });
      box(x - 22, y - 20, 46, 40, {
        fill: P.row,
        stroke: P.ink,
        alpha: other,
        radius: 4,
        width: 2
      });
      [y - 6, y + 6].forEach(
        (ry, i) => line(x - 13, ry, x + (i ? 5 : 15), ry, { color: P.muted, alpha: other, width: 2 })
      );
      documentIcon(x + 18, y - 21, 32, 42, { alpha: owner, rows: 0 });
      person(x + 34, y + 5, { size: 0.5, alpha: owner, solid: false, color: P.unknown });
    },
    // A check expected to pass fails, and evidence whose time has run out.
    (x, y, g) => {
      const v = said(g, "核验和预期相反", "contradicts expectation"), flip = ramp(t, cue(s, "相反", "contradicts") - 0.15, 0.4);
      box(x - 58, y - 22, 44, 44, { fill: P.row, stroke: P.ink, alpha: v, radius: 6, width: 2 });
      check(x - 36, y + 1, 26, { color: P.evidence, alpha: v * (1 - flip) });
      cross(x - 36, y, 20, { alpha: v * flip });
      const old = said(g, "证据过期", "evidence has expired");
      documentIcon(x + 8, y - 30, 44, 58, { alpha: old, rows: 3 });
      dot(x + 52, y + 20, 18, { color: P.ground, alpha: old });
      clock(x + 52, y + 20, 15, { color: P.unknown, alpha: old, hand: 0.62 });
    },
    // What continuing would do: hide a failure, corrupt the source of truth, present a guess as fact, widen the damage.
    (x, y, g) => {
      const hideAt = cue(s, "掩盖失败", "hide a failure"), cover = soon(t, hideAt + 0.2, 0.5), hide = said(g, "掩盖失败", "hide a failure");
      cross(x - 30, y - 24, 30, { alpha: hide, width: 3 });
      box(mix(x - 71, x - 41, cover), y - 35, 22, 22, {
        fill: P.row,
        stroke: P.ink,
        alpha: hide * cover,
        radius: 4,
        width: 2
      });
      const pollute = cue(s, "污染权威来源", "corrupt a source");
      documentIcon(x + 14, y - 46, 34, 44, {
        alpha: said(g, "污染权威来源", "corrupt a source"),
        rows: 2
      });
      [
        [x + 24, y - 16],
        [x + 38, y - 28],
        [x + 36, y - 10]
      ].forEach(
        ([px, py], i) => dot(px, py, 4, { color: P.unknown, alpha: ramp(t, pollute + 0.1 + i * 0.12, 0.2) * g })
      );
      const guessAt = cue(s, "把猜测说成事实", "present a guess");
      text("?", x - 42, y + 28, 26, {
        role: "mark",
        align: "center",
        color: P.muted,
        alpha: ramp(t, guessAt - 0.15, 0.4) * g
      });
      check(x - 18, y + 28, 22, { color: P.unknown, alpha: ramp(t, guessAt + 0.3, 0.3) * g });
      const worseAt = cue(s, "扩大损害", "worsen the harm"), grow = standard((voiceTime(t) - voiceTime(worseAt + 0.05)) / 0.8), worse = ramp(t, worseAt - 0.15, 0.4) * g;
      dot(x + 32, y + 28, 5, { color: P.unknown, alpha: worse });
      [13, 22].forEach(
        (r, i) => ring(x + 32, y + 28, mix(5, r, grow), {
          color: P.unknown,
          alpha: worse * restMark(P.unknown, 1 - i * 0.35),
          width: 2
        })
      );
    }
  ];
  const kinds = [[0, 1], [2, 3, 4], [5], [6], [7]];
  const g1 = base * stageOut(t, handoff);
  if (g1 > 0)
    s22Escalation(
      s,
      t,
      stopAt,
      escalate,
      independent,
      names,
      nameAts,
      WY,
      SY,
      SR,
      BUS,
      GY,
      PAIR,
      ONE,
      NY,
      PX,
      OY,
      AX,
      LANE,
      glyphs,
      kinds,
      g1
    );
  const HY = 340, HX0 = 300, HX1 = 1620;
  const handway = (g, flowing, from) => {
    line(HX0 + 36, HY, HX1, HY, { color: P.line, alpha: g, width: 3.5 });
    dot(HX1, HY, 6, { color: P.line, alpha: g });
    agent(HX0, HY, { alpha: g, size: 1.3 });
    nameText(L("智能体", "Agent"), HX0, HY + 22 * 1.3 + NAME_GAP, {
      valign: "top",
      color: P.evidence,
      alpha: g
    });
    const q = flowing > 0 ? loopPhase(since(t, from), HX1 - 12 - HX0 - 44) : null;
    if (q !== null)
      flowDot(mix(HX0 + 44, HX1 - 12, q), HY, 7, q, { color: P.evidence, alpha: g * flowing });
  };
  const g2 = base * stageIn(t, handoff);
  if (g2 > 0) s22Records(t, handoff, told, interrupt, kept, HY, handway, g2);
};

// picture/film/scenes/p23/scene.js
scenes["23"] = function(s, t) {
  const [work, comm, become, others, answers, notYet, process] = cues(s, [
    ["工作的成果", "results"],
    ["沟通", "communication"],
    ["变成", "become"],
    ["别人", "others can act"],
    ["回答", "answer the reader"],
    ["别急着", "before"],
    ["从头讲过程", "recounting the whole process"]
  ]);
  const [purpose, update] = cues(s, [
    ["这次交流的目的", "name the purpose"],
    ["重要的汇报", "important update"]
  ]);
  const base = ramp(t, opening(s), 0.7), RY = 470;
  const one = base * stageOut(t, answers);
  if (one > 0) {
    const names = en ? ["Results", "Communication", "What others can act on"] : ["工作的成果", "沟通", "别人能接着做的事"];
    const centred = 960 - (460 - 60 + 960 + Math.max(42, measure(names[1]) / 2)) / 2, settle = 1 - glide(t, become + 0.05, Math.abs(centred));
    const pair = (en ? 0 : mix(960 - 460, centred, glide(t, comm + 0.05, centred - 500))) * settle;
    const xs = [460 + pair, 960 + L(centred, 0) * settle, 1460], at = [work, comm, others], first = L(0, 1);
    const seen = (i) => (i === first ? 1 : ramp(t, (i === 2 ? Math.min(at[i], become + 0.05) : at[i]) - 0.15, 0.4)) * one;
    const clear = (y) => clearOfTitle(s, t, y);
    const go = { t, at: become - 0.05 };
    link(xs[0] + 76, RY, xs[2] - 60, RY, {
      color: P.evidence,
      alpha: one * ramp(t, become - 0.05, 0.3) * clear(RY),
      draw: go,
      width: 2.5,
      flowing: since(t, become + 0.9)
    });
    documentIcon(xs[0] - 60, RY - 75, 120, 150, { alpha: seen(0) * clear(RY - 75), rows: 4 });
    dot(xs[1], RY, 40, { color: P.ground, alpha: seen(1) * clear(RY - 40) });
    dot(xs[1], RY, 40, {
      color: P.evidence,
      alpha: seen(1) * clear(RY - 40),
      hollow: true,
      width: 3
    });
    dot(xs[1], RY, 12, { color: P.evidence, alpha: seen(1) * clear(RY - 40) });
    person(xs[2], RY + 4, { alpha: seen(2) * clear(RY - 64), size: 2 });
    railNames(
      names.map((v) => [v]),
      xs,
      RY + 75,
      { gap: NAME_GAP, wrap: 340, alpha: (i) => one * named(t, at[i]) * clear(RY + 97) }
    );
  }
  const two = base * stageIn(t, answers) * stageOut(t, purpose);
  if (two > 0) {
    const later = L("别急着从头讲过程", "The whole process"), left = 540 - 62.5;
    const sh = mix(
      960 - (left + 1300) / 2,
      960 - (left + 1300 + NAME_GAP + measure(later)) / 2,
      glide(t, notYet + 0.05, (NAME_GAP + measure(later)) / 2)
    );
    const px = 540 + sh, ax = 700 + sh, aw = 600, ah = 220, ty = RY + 250, tx0 = 620 + sh, tx1 = 1300 + sh, ans = ramp(t, answers - 0.1, 0.4) * two;
    person(px, RY + 4, { alpha: two, size: 2.6 });
    box(ax, RY - ah / 2, aw, ah, {
      fill: P.row,
      stroke: P.evidence,
      alpha: ans,
      radius: 14,
      width: 2.5
    });
    check(ax + 74, RY, 60, { alpha: ans * ramp(t, answers + 0.2, 0.4) });
    stroke(
      () => [
        [RY - 56, aw - 210],
        [RY, aw - 250],
        [RY + 56, aw - 300]
      ].forEach(([y, w]) => {
        ctx.moveTo(ax + 150, y);
        ctx.lineTo(ax + 150 + w, y);
      }),
      { color: P.ink, alpha: ans * 0.85, width: 5 }
    );
    const reach = soon(t, answers + 0.1, 0.5);
    link(ax - 14, RY, px + 72, RY, {
      color: P.evidence,
      alpha: ans,
      upto: reach,
      width: 2.5,
      flowing: since(t, answers + 0.6)
    });
    nameText(
      L("回答对方真正需要的", "Answer the reader's actual need"),
      ax + aw / 2,
      RY + ah / 2 + NAME_GAP,
      { valign: "top", width: 440, color: P.evidence, alpha: two * named(t, answers) }
    );
    const tape = drawShare(t, process - 0.1, tx1 - tx0, 1.2), ta = ramp(t, process - 0.15, 0.4) * two, x1 = mix(tx0, tx1, tape);
    if (tape > 0) {
      box(tx0, ty - 30, x1 - tx0, 60, { fill: P.row, stroke: P.muted, alpha: ta, radius: 8 });
      stroke(
        () => {
          for (let x = tx0 + 24; x < tx1 - 12; x += 28) {
            ctx.moveTo(x, ty - 12);
            ctx.lineTo(x, ty + 12);
          }
        },
        {
          color: P.muted,
          alpha: ta * 0.7 * ramp(t, process - 0.1 + drawTime(tx1 - tx0, 1.2), 0.45),
          width: 2
        }
      );
    }
    nameText(later, tx1 + NAME_GAP, ty, {
      align: "left",
      color: P.muted,
      alpha: two * named(t, notYet)
    });
  }
  const purposes = cues(s, [
    ["同步", "synchronize"],
    ["讨论", "discuss"],
    ["决定", "decide"],
    ["上报", "escalate"],
    ["复盘", "review"]
  ]);
  const three = base * stageIn(t, purpose) * stageOut(t, update);
  if (three > 0) {
    const r = 320, angles = [-162, -126, -90, -54, -18].map((a2) => a2 * Math.PI / 180);
    const names = en ? ["Synchronize", "Discuss", "Decide", "Escalate", "Review"] : ["同步", "讨论", "决定", "上报", "复盘"];
    const spans = angles.map((g, i) => {
      const c = Math.cos(g), x = 960 + c * (r + 12 + NAME_GAP), w = measure(names[i]);
      return c > 0.3 ? [x, x + w] : c < -0.3 ? [x - w, x] : [x - w / 2, x + w / 2];
    });
    const lean = L(44, 64) * (glide(t, purposes[0] - 0.1, L(44, 64)) - glide(t, purposes[3] - 0.1, L(44, 64)));
    const cx = lean + 1920 - (Math.min(960 - r, ...spans.map((v) => v[0])) + Math.max(960 + r, ...spans.map((v) => v[1]))) / 2, cy = 640;
    ring(cx, cy, r, { color: P.line, alpha: three, width: 3.5, start: -Math.PI, upto: 0.5 });
    let a = -Math.PI;
    purposes.forEach((at, i) => {
      a = mix(a, angles[i], soon(t, at - 0.12, 0.45));
    });
    angles.forEach((g, i) => {
      const x = cx + Math.cos(g) * r, y = cy + Math.sin(g) * r, lit = speaking(t, purposes, i), on = ramp(t, purposes[i] - 0.1, 0.4) * three;
      dot(x, y, 12, { color: P.ground, alpha: on });
      dot(x, y, 12, { color: P.authority, alpha: on });
      if (lit > 0)
        ring(x, y, 21, {
          color: P.authority,
          alpha: lit * restMark(P.authority, 0.5) * three,
          width: 2
        });
      radialName(names[i], cx, cy, r + 12, g, {
        alpha: three * listIn(t, purposes, i),
        set: "purposes"
      });
    });
    line(cx, cy, cx + Math.cos(a) * (r - 44), cy + Math.sin(a) * (r - 44), {
      color: P.authority,
      alpha: three,
      width: 4
    });
    dot(cx, cy, 14, { color: P.authority, alpha: three });
    nameText(en ? "The purpose" : "这次交流的目的", cx, cy + 14 + NAME_GAP, {
      valign: "top",
      color: P.authority,
      alpha: three * named(t, purpose)
    });
  }
  const dontKnow = cue(s, "不知道", "when you don't know");
  const four = base * stageIn(t, update) * stageOut(t, dontKnow);
  if (four > 0) {
    const sections = [
      // Each section is named by its spoken heading. The first takes the words that follow it as its qualifier; the
      // others name their parts only in their own captions, so a qualifier there would repeat the caption standing with
      // it, and they keep the heading alone.
      [
        en ? ["Conclusion or present state"] : ["结论或现状"],
        [["结论", "conclusion"]],
        en ? ["and what actually changed"] : ["说清这次和上次比，实际变了什么"],
        [["说清这次和上次比", "what actually changed"]]
      ],
      [en ? ["Decisive facts"] : ["关键的依据"], [["关键的依据", "decisive facts"]], [], []],
      [en ? ["Recommendation"] : ["建议"], [["建议", "your recommendation"]], [], []],
      [en ? ["Next action"] : ["下一步"], [["下一步", "the next action"]], [], []]
    ].map(([term, termCues, qual, qualCues]) => [term, cues(s, termCues), qual, cues(s, qualCues)]);
    const starts = sections.map(([, termAts]) => termAts[0]);
    const part = (zh, english) => ramp(t, cue(s, zh, english) - 0.15, 0.4) * four;
    const NW = Math.max(
      ...sections.map(
        ([term, , qual]) => Math.max(measure(term.join("")), qual.length ? measure(qual.join(""), NOTE) : 0)
      )
    );
    const hh0 = termRowLayout(sections[0][0], sections[0][2], NW + 10).height, drop = hh0 / 2 - labelSize(NOTE) / 2;
    const [[termAt], [qualAt]] = [sections[0][1], sections[0][3]];
    const aside0 = (50 + NW) / 2, aside1 = (NW - measure(sections[0][0].join(""))) / 2;
    const aside = mix(
      mix(aside0, aside1, glide(t, termAt + 0.05, aside0 - aside1)),
      0,
      glide(t, qualAt + 0.05, aside1)
    );
    const PW = 500, PAD = 14, GAP = 10, heights = [104 + drop, 104, 104, 104], STEP = 30, left = 960 - (230 + PW + 50 + NW) / 2 + aside;
    const rx = left + 70, x0 = left + 230, NX = x0 + PW + 50, g = x0 + 84;
    const grown = starts.map((at) => soon(t, pauseHold(at - 0.45, 0.4), 0.4));
    const T = 400 - drop / 2 - STEP * grown.slice(1).reduce((a, b) => a + b, 0);
    const tops = heights.reduce(
      (acc, h, k) => [...acc, k ? acc[k - 1] + heights[k - 1] + GAP : T + PAD],
      []
    );
    const H = PAD + 14 + heights.reduce((sum, h, k) => sum + (h + (k ? GAP : 0)) * grown[k], 0);
    s23Page(x0, T, PW, H, { alpha: four });
    nameText(en ? "An important update" : "重要的汇报", x0, T - NAME_GAP, {
      align: "left",
      valign: "bottom",
      alpha: four * named(t, update)
    });
    const mid0 = tops[0] + heights[1] / 2, lead = mid0 - hh0 / 2 + labelSize(LABEL) / 2, stateY = mid0 + drop;
    person(rx, lead + 52, { alpha: four, size: 2.6 });
    const given = soon(t, update + STAGE_CUT, 0.5);
    link(x0 - 12, lead, rx + 64, lead, {
      color: P.evidence,
      alpha: four,
      upto: given,
      width: 2.5,
      flowing: since(t, update + STAGE_CUT + 0.5)
    });
    sections.forEach(([term, termAts, qual, qualAts], i) => {
      const top = tops[i], h = heights[i], cy = i ? top + h / 2 : mid0, on = ramp(t, starts[i] - 0.15, 0.4) * four, lit = speaking(t, starts, i);
      const color = i ? P.ink : P.evidence;
      if (lit > 0)
        line(x0 + 30, top + 12, x0 + 30, top + h - 12, { color, alpha: lit * four, width: 4 });
      if (i === 0) {
        line(g, lead, g + 336 + 1.25 - 4.5, lead, { color: P.evidence, alpha: on, width: 9 });
        const state = part("现状", "present state"), sy = stateY - 6;
        dot(g + 14, sy, 9, { color: P.authority, alpha: state });
        line(g + 40, sy, g + 256, sy, { color: P.ink, alpha: state, width: 5 });
        const changed = part("这次和上次比", "what actually changed");
        line(g + 40, sy + 24, g + 176, sy + 24, { color: P.muted, alpha: changed, width: 5 });
        stroke(
          () => {
            ctx.moveTo(g + 316, sy - 12);
            ctx.lineTo(g + 336, sy + 24);
            ctx.lineTo(g + 296, sy + 24);
            ctx.closePath();
          },
          { color: P.evidence, alpha: changed, width: 2.5 }
        );
      }
      if (i === 1) {
        s23Page(g - 4, cy - 30, 46, 60, { alpha: on, rows: 3 });
        const spread = part("影响", "impact");
        dot(g + 110, cy, 7, { color: P.unknown, alpha: spread });
        ring(g + 110, cy, mix(7, 24, soon(t, cue(s, "影响", "impact") + 0.05, 0.6)), {
          color: P.unknown,
          alpha: spread,
          width: 2
        });
        const risk = part("风险", "risks");
        stroke(
          () => {
            ctx.moveTo(g + 200, cy - 22);
            ctx.lineTo(g + 224, cy + 20);
            ctx.lineTo(g + 176, cy + 20);
            ctx.closePath();
          },
          { color: P.unknown, alpha: risk, width: 2.5 }
        );
        line(g + 290, cy - 24, g + 290, cy + 24, {
          color: P.unknown,
          alpha: part("障碍", "blockers"),
          width: 4
        });
      }
      if (i === 2) {
        box(g - 2, cy - 18, 38, 36, { stroke: P.ink, alpha: on, radius: 7, width: 2 });
        box(g + 46, cy - 24, 52, 48, { stroke: P.evidence, alpha: on, radius: 8, width: 2.5 });
        check(g + 72, cy, 26, { alpha: on });
        person(g + 156, cy + 4, {
          color: P.authority,
          alpha: part("需要谁", "from whom"),
          size: 0.8
        });
        const when = part("在什么时候", "by when");
        ring(g + 232, cy, 20, { color: P.authority, alpha: when, width: 2.5 });
        stroke(
          () => {
            ctx.moveTo(g + 232, cy - 11);
            ctx.lineTo(g + 232, cy);
            ctx.lineTo(g + 242, cy + 7);
          },
          { color: P.authority, alpha: when, width: 3 }
        );
      }
      if (i === 3) {
        dot(g + 4, cy, 7, { color: P.ink, alpha: on });
        link(g + 14, cy, g + 52, cy, { color: P.ink, alpha: on, width: 3, end: false });
        ring(g + 62, cy, 9, { color: P.ink, alpha: on, width: 3 });
        person(g + 116, cy + 4, { alpha: part("谁来做", "its owner"), size: 0.7 });
        const due = part("什么时候做完", "due time");
        stroke(
          () => {
            ctx.roundRect(g + 152, cy - 20, 40, 40, 6);
            ctx.moveTo(g + 152, cy - 8);
            ctx.lineTo(g + 192, cy - 8);
          },
          { color: P.ink, alpha: due, width: 2 }
        );
        dot(g + 172, cy + 7, 5, { color: P.authority, alpha: due });
        const done = part("怎样算完", "what will show it is done");
        box(g + 216, cy - 18, 36, 36, { stroke: P.ink, alpha: done, radius: 6, width: 2 });
        check(g + 234, cy, 22, { alpha: done });
      }
      const hh = termRowLayout(term, qual, NW + 10).height;
      termRow(t, term, termAts, qual, qualAts, NX, cy - hh / 2, {
        width: NW + 10,
        color,
        alpha: four * listLevel(t, starts, i),
        set: "update"
      });
    });
  }
  const sayDont = cue(s, "直说不知道", "say so");
  const five = base * stageIn(t, dontKnow);
  if (five > 0) {
    const ya = CONTENT_CY + 5, on = (at) => ramp(t, at - 0.15, 0.4) * five;
    const xa = [580, 1340];
    person(xa[0], ya + 6, { alpha: five, size: 1.8 });
    ring(xa[0] + 54, ya - 82, 26, { color: P.unknown, alpha: five, width: 2.5, dash: [5, 5] });
    text("?", xa[0] + 54, ya - 81, 30, {
      role: "mark",
      align: "center",
      color: P.unknown,
      alpha: five
    });
    const said = { t, at: sayDont - 0.1 };
    link(xa[0] + 70, ya, xa[1] - 86, ya, {
      color: P.ink,
      alpha: on(sayDont),
      draw: said,
      flowing: since(t, sayDont + 0.4)
    });
    box(xa[1] - 72, ya - 46, 144, 92, {
      fill: P.row,
      stroke: P.ink,
      alpha: on(sayDont),
      radius: 12,
      width: 2.5
    });
    text("?", xa[1], ya + 1, 30, {
      role: "mark",
      align: "center",
      color: P.unknown,
      alpha: on(sayDont)
    });
    railNames(en ? ["Don't know", "Say so"] : ["不知道", "直说不知道"], xa, ya + 70, {
      gap: NAME_GAP,
      alpha: (i) => five * (i ? named(t, sayDont) : 1),
      color: (i) => [P.muted, P.ink][i],
      set: "plainly"
    });
  }
};

// picture/film/scenes/p24/challenge.js
function s24Challenge(t, challenge, parts, never, personal, motive, three) {
  const refusedName = L("人格和动机", "Personalities or motives"), lensLeft = Math.min(380 - 48, 380 - measure(L("质疑", "Challenge")) / 2);
  const refusedW = L(300, 340), reach = 1560 + Math.max(
    40,
    (Math.max(...wrapName(refusedName, refusedW).map((v) => measure(v))) + 16 + Math.min(26, labelSize(LABEL) * 0.9)) / 2
  );
  const sh0 = 960 - (lensLeft + 1140 - 112) / 2, sh1 = 960 - (lensLeft + 1140 + 106) / 2, sh2 = 960 - (lensLeft + reach) / 2;
  const cardsFrom = parts[2] + 0.05, refuseFrom = Math.min(never + 0.05, personal - 0.15 - glideTime(sh2 - sh1));
  const sh = voiceTime(refuseFrom) >= voiceTime(cardsFrom) + glideTime(sh1 - sh0) ? mix(mix(sh0, sh1, glide(t, cardsFrom, sh1 - sh0)), sh2, glide(t, refuseFrom, sh2 - sh1)) : mix(
    sh0,
    sh2,
    glide(t, Math.min(cardsFrom, personal - 0.15 - glideTime(sh2 - sh0)), sh2 - sh0)
  );
  const y = 470, lx = 380 + sh, xs = [640, 890, 1140].map((x) => x + sh), barX = 1370 + sh, hx = 1560 + sh;
  const lens = three * ramp(t, challenge + STAGE_CUT, 0.15);
  ring(lx, y, 46, { color: P.evidence, alpha: lens, width: 3 });
  line(lx + 33, y + 33, lx + 56, y + 56, { color: P.evidence, alpha: lens, width: 4 });
  nameText(L("质疑", "Challenge"), lx, y - 46 - NAME_GAP, {
    valign: "bottom",
    color: P.evidence,
    alpha: three * named(t, challenge)
  });
  link(lx + 52, y, xs[2] - 112, y, {
    color: P.evidence,
    alpha: three,
    draw: { t, at: challenge + STAGE_CUT },
    end: false
  });
  const go = soon(t, never - 0.05, 0.6);
  link(xs[2] + 112, y, hx - 50, y, {
    color: P.unknown,
    alpha: three * ramp(t, never - 0.05, 0.3),
    upto: 0.5 * go,
    end: false,
    dash: [8, 8]
  });
  line(barX, y - 34, barX, y + 34, {
    color: P.unknown,
    alpha: ramp(t, never + 0.4, 0.3) * three,
    width: 4
  });
  nameText(L("不质疑", "Never"), barX, y - 46 - NAME_GAP, {
    valign: "bottom",
    alpha: three * named(t, never)
  });
  xs.forEach((x, i) => {
    const lit = speaking(t, parts, i), q = ramp(t, parts[i] - 0.15, 0.4) * three;
    box(x - 105, y - 95, 210, 190, {
      fill: P.row,
      stroke: blend(P.line, P.evidence, lit),
      alpha: q,
      radius: 10,
      width: 2 + 0.5 * lit
    });
    if (i === 0)
      stroke(
        () => [0, 1, 2].forEach((k) => {
          ctx.moveTo(x - 56, y - 28 + k * 28);
          ctx.lineTo(x + (k === 2 ? 18 : 56), y - 28 + k * 28);
        }),
        { color: P.ink, alpha: q, width: 3 }
      );
    if (i === 1) tableIcon(x - 60, y - 40, 120, 80, { alpha: q, stroke: P.ink, rows: 3, cols: 3 });
    if (i === 2)
      [0, 1, 2].forEach(
        (k) => box(x - 38 + (k === 1 ? 8 : 0), y + 18 - k * 23, 76, 20, {
          fill: P.row,
          stroke: P.authority,
          alpha: q,
          radius: 10,
          width: 2.5
        })
      );
  });
  railNames(en ? ["Propositions", "Evidence", "Costs"] : ["说法", "证据", "代价"], xs, y + 95, {
    gap: NAME_GAP,
    alpha: (i) => three * listIn(t, parts, i),
    set: "challenged"
  });
  person(hx, y + 8, { alpha: three * ramp(t, never - 0.15, 0.4), size: 1.6 });
  rejectedName(refusedName, hx, y + 95 + NAME_GAP, {
    valign: "top",
    width: refusedW,
    alpha: three * named(t, personal),
    mark: ramp(t, motive + 0.05, 0.35)
  });
}
function s24Checkable(s, t, updates, four) {
  const vague = cues(s, [
    ["积极推进", "actively progressing"],
    ["智能体分析过了", "the Agent analyzed it"]
  ]);
  const instead = vague.map((at, k) => cueFrom(s, k ? "要说" : "不如说", "say", at)), sayAt = cue(s, "说别人", "say things");
  const groups = en ? [
    [
      ["Tests pass", "tests pass", "check"],
      ["The acceptor still needs to confirm", "the acceptor still needs", "owner"],
      ["We'll conclude by Friday", "we'll conclude", "due"]
    ],
    [
      ["Facts it produced", "which facts it produced", "agent"],
      ["What you verified", "what you verified", "check"],
      ["Where the conclusion stops", "where the conclusion stops", "limit"]
    ]
  ] : [
    [
      ["测试通过了", "测试通过", "check"],
      ["还要等验收人确认", "还要等", "owner"],
      ["周五前", "周五前", "due"]
    ],
    [
      ["它给出了哪些事实", "它给出了", "agent"],
      ["你核实了什么", "你核实了", "check"],
      ["结论能说到哪", "结论能说到", "limit"]
    ]
  ];
  const refused = en ? ["“Actively progressing”", "“The Agent analyzed it”"] : ["“积极推进”", "“智能体分析过了”"];
  const SX = 380, RX = 1500, LX = 1420, TOP = 432, ROW = 58, LY = TOP + 17 + ROW / 2;
  const shift = 960 - (SX - 15 * 1.6 * 1.55 + LX - 52) / 2;
  ctx.save();
  ctx.translate(shift * (1 - glide(t, sayAt - 0.15, shift)), 0);
  person(SX, LY + 40, { alpha: four, size: 1.6 });
  person(RX, LY + 36, { alpha: four * ramp(t, sayAt - 0.15, 0.4), size: 1.4, color: P.evidence });
  ring(LX, LY, 46, { color: P.evidence, alpha: four * ramp(t, sayAt - 0.15, 0.4), width: 3 });
  line(LX + 33, LY + 33, LX + 56, LY + 56, {
    color: P.evidence,
    alpha: four * ramp(t, sayAt - 0.15, 0.4),
    width: 4
  });
  nameText(L("别人能检查的话", "Things others can check"), 960, TOP - 30 - NAME_GAP, {
    valign: "bottom",
    alpha: four * named(t, sayAt)
  });
  const card = (x0, w, h, a) => {
    box(x0, TOP, w, h, { fill: P.row, stroke: P.ink, alpha: a, radius: 12, width: 2.5 });
    const q = since(t, updates + STAGE_CUT);
    link(SX + 26, LY, x0 - 8, LY, { alpha: a, end: false, flowing: q });
    link(x0 + w + 8, LY, LX - 52, LY, {
      color: P.evidence,
      alpha: a,
      end: false,
      flowing: q,
      lag: 0.5
    });
  };
  const principle = four * stageOut(t, vague[0] - 0.2);
  if (principle > 0) {
    const checkAt = cueFrom(s, "检查", "check", updates), w = 300;
    card(960 - w / 2, w, 2 * ROW + 40, principle);
    stroke(
      () => [0, 1, 2].forEach((k) => {
        ctx.moveTo(960 - w / 2 + 30, TOP + 36 + k * 30);
        ctx.lineTo(960 - w / 2 + 30 + [190, 150, 170][k], TOP + 36 + k * 30);
      }),
      { color: P.muted, alpha: principle, width: 4 }
    );
    check(960 + w / 2 - 44, TOP + 2 * ROW + 6, 30, {
      alpha: principle,
      draw: { t, at: checkAt + 0.05 }
    });
    nameText(
      L("汇报、答复、纪要和上报", "Updates, answers, meeting records and escalations"),
      960,
      TOP + 2 * ROW + 40 + NAME_GAP,
      { valign: "top", width: 420, alpha: principle * named(t, updates) }
    );
  }
  const mark = (kind, x, my, a) => {
    if (kind === "check") check(x, my + 2, 26, { alpha: a });
    if (kind === "owner") person(x, my + 3, { alpha: a, size: 0.55, color: P.authority });
    if (kind === "agent") agent(x, my, { alpha: a, size: 0.6 });
    if (kind === "due") {
      box(x - 14, my - 13, 28, 27, { stroke: P.ink, alpha: a, radius: 4, width: 2 });
      line(x - 14, my - 5, x + 14, my - 5, { color: P.ink, alpha: a, width: 2 });
      dot(x, my + 5, 4, { color: P.authority, alpha: a });
    }
    if (kind === "limit") {
      line(x - 13, my, x + 5, my, { color: P.ink, alpha: a, width: 3 });
      line(x + 9, my - 12, x + 9, my + 12, { color: P.ink, alpha: a, width: 4 });
    }
  };
  groups.forEach((g, k) => {
    const shown = four * stageIn(t, vague[k] - 0.2) * (k + 1 < groups.length ? stageOut(t, vague[k + 1] - 0.2) : 1);
    if (shown <= 0) return;
    const ats = g.map(([, said]) => cue(s, said, said)), em = labelSize(LABEL), blank = L(0.625, 0.072) * em;
    const phrase = measure(refused[k]) - 2 * blank, room = 18 + Math.min(26, em * 0.9) + 1.5;
    const rowsW = 24 + 30 + NAME_GAP + Math.max(...g.map(([v]) => measure(v))), w = 72 + Math.max(phrase + room, rowsW), x0 = 960 - w / 2;
    const MX = (w - rowsW) / 2 + 24, NX = MX + 30 + NAME_GAP, centred = x0 + (w - phrase - room) / 2;
    const inkEnd = Math.abs(centred - blank - (x0 + NX)) <= 0.75 * em ? x0 + NX + blank : centred;
    const ink = mix(x0 + (w - phrase) / 2, inkEnd, soon(t, instead[k] + 0.05, 0.35));
    const h = ats.reduce(
      (sum, at) => sum + ROW * soon(t, pauseHold(at - 0.45, 0.4), 0.4),
      ROW + 34
    );
    card(x0, w, h, shown);
    rejectedName(refused[k], ink - blank, LY, {
      align: "left",
      alpha: shown * named(t, vague[k]),
      mark: ramp(t, instead[k] + 0.05, 0.35),
      markLeft: ink + phrase + 18
    });
    g.forEach(([v, , kind], j) => {
      const my = LY + (j + 1) * ROW, lit = speaking(t, ats, j);
      if (lit > 0) ring(x0 + MX, my, 22, { color: P.evidence, alpha: shown * lit, width: 2.5 });
      mark(kind, x0 + MX, my, shown * ramp(t, ats[j] - 0.15, 0.4));
      nameText(v, x0 + NX, my, {
        align: "left",
        alpha: shown * listIn(t, ats, j),
        set: `statements${k}`
      });
    });
  });
  ctx.restore();
}

// picture/film/scenes/p24/meeting.js
function s24Meeting(t, meet, decisions, transcripts, one) {
  const right = 800 + 340 + Math.max(
    160 + NAME_GAP + measure(L("决定", "Decisions")),
    125 + NAME_GAP + measure(L("流水账", "Transcripts")) + 16 + 26
  );
  const sh = 960 - (800 - 92 + right) / 2;
  const mx = 800 + sh, my = 470, jx = mx + 240, cx = mx + 340;
  ring(mx, my, 56, { color: P.line, alpha: one, width: 2.5 });
  for (let k = 0; k < 6; k++) {
    const a = Math.PI / 6 + k * Math.PI / 3;
    person(mx + Math.cos(a) * 78, my + Math.sin(a) * 78, { alpha: one, size: 0.62 });
  }
  nameText(L("会议", "Meetings"), mx, my + 96 + NAME_GAP, {
    valign: "top",
    alpha: one * named(t, meet)
  });
  const dq = ramp(t, decisions - 0.15, 0.4) * one, reach = { t, at: decisions - 0.1 };
  box(cx, 310, 160, 100, { fill: P.row, stroke: P.authority, alpha: dq, radius: 12, width: 2.5 });
  check(cx + 80, 362, 40, { color: P.authority, alpha: dq });
  link(mx + 100, my, cx - 10, 360, {
    route: "hvh",
    mid: jx,
    alpha: one,
    draw: reach,
    flowing: since(t, decisions + 0.5)
  });
  nameText(L("决定", "Decisions"), cx + 160 + NAME_GAP, 360, {
    align: "left",
    color: P.authority,
    alpha: one * named(t, decisions)
  });
  const tq = ramp(t, transcripts - 0.15, 0.4) * one, drop = soon(t, transcripts - 0.05, 0.5);
  documentIcon(cx + 35, 522, 90, 116, { alpha: tq * 0.7, rows: 5, stroke: P.muted });
  link(jx, my, cx + 25, 580, {
    route: "vh",
    color: P.unknown,
    alpha: tq,
    upto: 0.26 * drop,
    end: false,
    dash: [8, 8]
  });
  line(jx - 22, 532, jx + 22, 532, {
    color: P.unknown,
    alpha: ramp(t, transcripts + 0.35, 0.3) * one,
    width: 4
  });
  rejectedName(L("流水账", "Transcripts"), cx + 125 + NAME_GAP, 580, {
    align: "left",
    alpha: one * named(t, transcripts),
    mark: ramp(t, transcripts + 0.35, 0.35)
  });
}
function s24Gates(s, t, align, alignAt, defs, compare, options, split, locate, layers, two) {
  const layerNames = en ? ["Facts", "Inference", "Values", "Resources", "Authority"] : ["事实", "推论", "价值取向", "资源", "权限"];
  const left = 520 - NAME_GAP - measure(L("开会", "Meetings"));
  const sh0 = 960 - (left + 1270) / 2, sh1 = 960 - (left + 1480 + 12 + NAME_GAP + Math.max(...layerNames.map((v) => measure(v)))) / 2;
  const sh = mix(sh0, sh1, glide(t, Math.max(locate, split) + 0.05, sh1 - sh0));
  const y = 500, x0 = 520 + sh, g1 = L(790, 755) + sh, g2 = L(1090, 1120) + sh, sx = 1270 + sh, CX = 1480 + sh, ys = [290, 395, 500, 605, 710];
  line(x0, y, sx, y, { color: P.line, alpha: two, width: 2.5 });
  nameText(L("开会", "Meetings"), x0 - NAME_GAP, y, { align: "right", alpha: two });
  const gateAt = (x, at, open, color) => {
    const o = ease(open) * 48, q = two * ramp(t, at - 0.15, 0.4);
    stroke(
      () => {
        ctx.moveTo(x, y - 64 - o);
        ctx.lineTo(x, y - 6 - o);
        ctx.moveTo(x, y + 6 + o);
        ctx.lineTo(x, y + 64 + o);
      },
      { color, alpha: q, width: 5 }
    );
  };
  gateAt(g1, alignAt, ramp(t, defs + 0.05, 0.45), P.evidence);
  gateAt(g2, compare, ramp(t, options + 0.05, 0.45), P.ink);
  railNames(
    en ? [["Align facts and definitions"], "Comparing options"] : ["核对事实、统一定义", "比方案"],
    [g1, g2],
    y,
    {
      gap: 130,
      wrap: 280,
      alpha: (i) => two * named(t, [alignAt, compare][i]),
      color: (i) => [P.evidence, P.ink][i]
    }
  );
  const reach = mix(
    mix(g1 - 30, g2 - 30, glide(t, defs + 0.25, g2 - g1)),
    sx - 26,
    glide(t, options + 0.25, sx - g2 + 4)
  );
  const full = sx - 26 - x0 - 10, way = reach - x0 - 10, run = loopPhase(since(t, align), full), sp = ramp(t, split + 0.05, 0.4);
  if (run !== null && run * full < way)
    dot(x0 + 10 + run * full, y, 9 * pass(run * full / way), {
      color: P.evidence,
      alpha: two * (1 - ramp(t, split - 0.25, 0.3))
    });
  if (sp > 0)
    [-1, 1].forEach((k) => token(sx, y + k * 13, { color: P.unknown, alpha: two * sp, r: 11 }));
  nameText(L("分歧", "Disagreement"), sx, y - 50, {
    valign: "bottom",
    alpha: two * named(t, en ? cue(s, "", "and locate") : split)
  });
  ys.forEach((ly, i) => {
    const on = ramp(t, layers[i] - 0.15, 0.4) * two, lit = speaking(t, layers, i);
    dot(CX, ly, 7 + 2 * lit, { color: P.ink, alpha: on });
    if (lit > 0)
      ring(CX, ly, 20, {
        color: P.unknown,
        alpha: lit * restMark(P.unknown, 0.6) * two,
        width: 2
      });
    nameText(layerNames[i], CX + 12 + NAME_GAP, ly, {
      align: "left",
      alpha: two * listIn(t, layers, i),
      set: "layers"
    });
  });
  layers.forEach((at, i) => {
    const from = i ? at + 0.05 : Math.max(locate, split, at - 0.15) + 0.05, grown = voiceTime(t) - voiceTime(from);
    link(sx + 22, y, CX - 26, ys[i], {
      route: "hvh",
      mid: CX - 50,
      color: P.unknown,
      alpha: two * ease(grown / 0.3) * mix(restMark(P.unknown), 1, speaking(t, layers, i)),
      draw: { t, at: from }
    });
  });
}

// picture/film/scenes/p24/scene.js
scenes["24"] = function(s, t) {
  const [meet, decisions, transcripts] = cues(s, [
    ["会议", "Meetings"],
    ["决定", "decisions"],
    ["流水账", "transcripts"]
  ]);
  const align = cue(s, "开会先核对", "Align");
  const base = ramp(t, opening(s), 0.7);
  const one = base * stageOut(t, align);
  if (one > 0) s24Meeting(t, meet, decisions, transcripts, one);
  const [alignAt, defs, compare, options, split, locate] = cues(s, [
    ["核对", "Align"],
    ["定义", "definitions"],
    ["再比方案", "comparing"],
    ["方案", "options"],
    ["分歧", "disagreement"],
    ["找", "locate"]
  ]);
  const layers = cues(s, [
    ["在事实", "in facts"],
    ["推论", "inference"],
    ["价值取向", "values"],
    ["资源", "resources"],
    ["权限", "authority"]
  ]);
  const challenge = cue(s, "质疑说法", "Challenge");
  const two = base * stageIn(t, align) * stageOut(t, challenge);
  if (two > 0) s24Gates(s, t, align, alignAt, defs, compare, options, split, locate, layers, two);
  const parts = cues(s, [
    ["说法", "propositions"],
    ["证据", "evidence"],
    ["代价", "costs"]
  ]);
  const [never, personal, motive] = cues(s, [
    ["不质疑", "never"],
    ["人格", "personalities"],
    ["动机", "motives"]
  ]);
  const updates = cue(s, "汇报、答复", "In updates");
  const three = base * stageIn(t, challenge) * stageOut(t, updates);
  if (three > 0) s24Challenge(t, challenge, parts, never, personal, motive, three);
  const four = base * stageIn(t, updates);
  if (four > 0) s24Checkable(s, t, updates, four);
};

// picture/film/scenes/p25/aims.js
function s25ThreeAims(s, t, triad, order, colors, aims, gA) {
  const xs = [520, 960, 1400], y = 500, R = 38, by = y - R - 46, writing = cue(s, "写作", "writing");
  const held = gA * named(t, writing);
  nameText(L("写作", "Writing"), 960, by - 26 - NAME_GAP, { valign: "bottom", alpha: held });
  link(960, by - 26, 960, by, { alpha: held, end: false });
  path(
    [
      [xs[0], by],
      [xs[2], by]
    ],
    { color: P.line, alpha: held, width: 2.5 }
  );
  const run = glide(t, order, xs[2] - xs[0] - 2 * R - 12);
  link(xs[0] + R + 6, y, xs[2] - R - 6, y, {
    color: P.evidence,
    alpha: gA * ramp(t, order - 0.1, 0.3),
    draw: { t, at: order - 0.05 },
    width: 3,
    flow: run > 0 && run < 1 ? run * 0.999 : null
  });
  xs.forEach((x, c) => {
    const on = named(t, triad[c]) * gA;
    path(
      [
        [x, by],
        [x, y - R - 4]
      ],
      { color: P.line, alpha: on, width: 2.5 }
    );
    dot(x, y, R, { color: P.ground, alpha: on });
    ring(x, y, R, { color: colors[c], alpha: on, width: 3 });
    dot(x, y, 8, { color: colors[c], alpha: on * (1 - ramp(t, order - 0.1, 0.35)) });
    text(String(c + 1), x, y + 1, 26, {
      role: "mark",
      align: "center",
      color: colors[c],
      alpha: on * ramp(t, order + 0.1, 0.3)
    });
  });
  railNames(aims, xs, y + R, {
    gap: NAME_GAP,
    alpha: (i) => gA * listIn(t, triad, i),
    color: (i) => colors[i],
    set: "triad"
  });
}
function s25Mechanisms(s, t, fidelity, clarity, elegance, example, colors, aims, g1) {
  const OPEN = en ? mix(30, -35, soon(t, elegance + 0.05, 0.9)) : mix(80, -40, glide(t, elegance + 0.05, 120));
  const COLX = [390, 850, 1310].map((x) => x + OPEN), HY = 330, starts = [fidelity, clarity, elegance];
  const heads = en ? [["preserves the meaning"], ["understanding first"], ["taste and judgment"]] : [["忠于原意"], ["在准确理解之后"], ["凭品位和审美"]];
  const means = cues(s, [
    ["忠于原意", "preserves the meaning"],
    ["在准确理解之后", "begins with accurate understanding"],
    ["凭品位和审美", "brings taste"]
  ]);
  const inline = heads.every((h, c) => termRowLayout([aims[c]], h, 330).one);
  const said = (zh, english, lead = 0.15) => ramp(t, cue(s, zh, english) - lead, 0.4) * g1;
  COLX.forEach((L0, c) => {
    const lit = span(t, starts[c] - 0.15, c < 2 ? starts[c + 1] - 0.2 : example - 0.2, 0.3), hx = L0 + 15;
    ring(hx, HY, 15, { color: colors[c], alpha: g1, width: 2.5 });
    dot(hx, HY, 6 + 2 * lit, { color: colors[c], alpha: g1 });
    if (lit > 0)
      ring(hx, HY, 23, {
        color: colors[c],
        alpha: lit * restMark(colors[c], 0.5) * g1,
        width: 2
      });
    const hh = termRowLayout([aims[c]], heads[c], 330, inline).height;
    termRow(
      t,
      [aims[c]],
      [Math.min(starts[c], fidelity)],
      heads[c],
      [means[c]],
      hx + 15 + NAME_GAP,
      HY - hh / 2,
      { width: 330, color: colors[c], alpha: g1 * listLevel(t, starts, c), set: "aims", inline }
    );
  });
  {
    const L0 = COLX[0], on = ramp(t, means[0] - 0.15, 0.4) * g1, items = cues(s, [
      ["谁", "actors"],
      ["在什么条件下", "conditions"],
      ["负什么责", "responsibilities"],
      ["到什么程度", "limits"]
    ]);
    const intact = said("都不走样", "stay intact"), ys = [450, 480, 510, 540];
    path(
      [
        [L0 + 15, HY + 15],
        [L0 + 15, 410]
      ],
      { color: P.line, alpha: on, width: 2 }
    );
    s23Page(L0 + 10, 410, 100, 200, { alpha: on, rows: 3 });
    s23Page(L0 + 200, 400, 150, 270, { alpha: on, rows: 3 });
    const carried = items.map((at) => drawShare(t, at - 0.05, 78));
    if (carried[0] > 0.01)
      stroke(
        () => ys.forEach((y, k) => {
          if (carried[k] > 0.01) {
            ctx.moveTo(L0 + 116, y);
            ctx.lineTo(mix(L0 + 116, L0 + 194, carried[k]), y);
          }
        }),
        { color: blend(P.ink, P.evidence, intact / Math.max(g1, 1e-6)), alpha: on, width: 3 }
      );
    const carry = loopPhase(since(t, items[1] - 0.05 + drawTime(78)), 78);
    if (carry !== null)
      flowDot(
        mix(L0 + 116, L0 + 194, carry),
        ys[1],
        5,
        carry,
        { color: P.evidence, alpha: on * span(t, items[0], clarity - 0.2, 0.3) },
        78
      );
    check(L0 + 322, 430, 28, { alpha: intact });
    const src = said("事实有来源", "facts keep their sources");
    dot(L0 + 252, 590, 9, { color: P.evidence, alpha: src });
    link(L0 + 240, 590, L0 + 116, 590, {
      color: P.evidence,
      alpha: src,
      draw: { t, at: cue(s, "事实有来源", "facts keep their sources") + 0.05 },
      width: 3.5
    });
    text("≠", L0 + 232, 640, 36, {
      role: "mark",
      align: "center",
      color: P.unknown,
      alpha: said("反例", "counterexamples")
    });
    text("?", L0 + 274, 640, 36, {
      role: "mark",
      align: "center",
      color: P.unknown,
      alpha: said("不确定", "uncertainty")
    });
    const fail = said("失败", "failure");
    stroke(
      () => {
        ctx.moveTo(L0 + 303, 627);
        ctx.lineTo(L0 + 329, 653);
        ctx.moveTo(L0 + 329, 627);
        ctx.lineTo(L0 + 303, 653);
      },
      { color: P.unknown, alpha: fail, width: 4 }
    );
  }
  {
    const L0 = COLX[1], on = ramp(t, clarity - 0.15, 0.4) * g1, y = 480;
    path(
      [
        [L0 + 15, HY + 15],
        [L0 + 15, 420]
      ],
      { color: P.line, alpha: on, width: 2 }
    );
    s23Page(L0 + 10, 420, 90, 120, { alpha: on, rows: 3 });
    check(L0 + 80, 430, 24, { alpha: said("在准确理解之后", "accurate understanding") });
    const plain = cue(s, "把意思讲清楚", "puts it plainly"), drawn = soon(t, plain + 0.05, 0.7), flat = soon(t, cue(s, "讲通顺", "fluently") + 0.05, 0.7);
    if (drawn > 0) {
      const pts = Array.from({ length: 13 }, (_, k) => [
        L0 + 108 + k * 11,
        y + (k % 2 ? -1 : 1) * 14 * (1 - flat) * (k && k < 12 ? 1 : 0)
      ]);
      path(pts, { color: P.evidence, alpha: on, draw: { t, at: plain + 0.05 }, width: 3 });
      const sent = loopPhase(since(t, plain + 0.8), 124);
      if (drawn >= 1 && sent !== null)
        flowDot(
          mix(L0 + 108, L0 + 232, sent),
          y,
          5,
          sent,
          { color: P.evidence, alpha: on * span(t, plain + 0.8, elegance - 0.2, 0.3) },
          124
        );
    }
    const reader = said("让读者能理解", "the reader can understand");
    person(L0 + 270, y + 10, { alpha: reader, size: 1.3 });
    const act = said("也能行动", "and act");
    dot(L0 + 304, y, 6, { color: P.ink, alpha: act });
    link(L0 + 312, y, L0 + 346, y, {
      color: P.ink,
      alpha: act,
      draw: { t, at: cue(s, "也能行动", "and act") + 0.05 },
      width: 3,
      end: false
    });
    ring(L0 + 356, y, 9, { color: P.ink, alpha: act, width: 3 });
  }
  {
    const L0 = COLX[2], on = ramp(t, elegance - 0.15, 0.4) * g1, base0 = 590, hs = [60, 104, 72, 124, 84];
    const rhythm = said("节奏", "rhythm"), joined = said("过渡", "transitions"), form = said("形式", "and form");
    path(
      [
        [L0 + 15, HY + 15],
        [L0 + 15, base0]
      ],
      { color: P.line, alpha: on, width: 2 }
    );
    if (rhythm > 0)
      stroke(
        () => {
          ctx.moveTo(L0 + 15, base0);
          ctx.lineTo(L0 + 236, base0);
          hs.forEach((h, i) => {
            ctx.moveTo(L0 + 44 + i * 42, base0);
            ctx.lineTo(L0 + 44 + i * 42, base0 - h);
          });
        },
        { color: P.authority, alpha: rhythm, width: 4 }
      );
    if (joined > 0)
      stroke(
        () => {
          ctx.moveTo(L0 + 44, base0 - hs[0]);
          hs.slice(1).forEach(
            (h, i) => ctx.quadraticCurveTo(
              L0 + 44 + i * 42 + 21,
              base0 - Math.max(h, hs[i]) - 24,
              L0 + 44 + (i + 1) * 42,
              base0 - h
            )
          );
        },
        { color: P.authority, alpha: joined * 0.8, width: 2.5 }
      );
    box(L0 - 8, 420, 310, 190, { stroke: P.authority, alpha: form, radius: 12, width: 2 });
    dot(L0 + 264, 520, 12, { color: P.ink, alpha: said("准确的动词", "precise verbs") });
    box(L0 + 247, 552, 34, 34, {
      fill: P.ink,
      alpha: said("具体的名词", "concrete nouns"),
      radius: 4
    });
    const refused = en ? ["Slogans", "Pretended depth"] : ["喊口号", "故作高深"], refusedAt = cues(s, [
      ["喊口号", "slogans"],
      ["故作高深", "pretended depth"]
    ]);
    const rw = refused.map((v) => measure(v) + 42), rx0 = L0 - 8 + 310 / 2 - (rw[0] + 40 + rw[1]) / 2;
    refused.forEach(
      (v, k) => rejectedName(v, rx0 + k * (rw[0] + 40), 610 + 22 + NAME_GAP, {
        align: "left",
        valign: "top",
        alpha: g1 * named(t, refusedAt[k]),
        mark: ramp(t, refusedAt[k] + 0.05, 0.35)
      })
    );
  }
}

// picture/film/scenes/p25/clarity.js
function s25ClarityChecks(s, t, concrete, onePoint, terms, gc) {
  const firstUse = cue(s, "第一次出现", "defined at first use");
  const rows = en ? [
    [["One point to a paragraph"], [onePoint], [], []],
    [["Terms"], [terms], ["defined at first use"], [firstUse]]
  ] : [
    [["一段只讲一个意思"], [onePoint], [], []],
    [["术语"], [terms], ["第一次出现就讲明白"], [firstUse]]
  ];
  const rowW = ([term, , qual]) => measure(term.join("")) + (qual.length ? TERM_GAP + measure(qual.join(""), NOTE) : 0);
  const PW = 400, listW = Math.max(...rows.map(rowW)), groupW = PW + 120 + 50 + listW, LX = 960 - groupW / 2 + PW + 120 + 50;
  const room = (groupW - PW) / 2, px = 960 - groupW / 2 + (en ? room * (1 - glide(t, cue(s, "", "clarity has") + 0.05, room)) : 0);
  const starts = rows.map((r) => r[1][0]), tops = stackTops(
    rows.map(([term, , qual]) => termRowLayout(term, qual, Infinity).height),
    CONTENT_CY + 50,
    120
  );
  const mids = tops.map((v) => v + labelSize(LABEL) / 2), ticked = starts.map((at) => ramp(t, at - 0.15, 0.4) * gc);
  const hy3 = tops[0] - 110, headA = named(t, concrete) * gc;
  ring(px + 15, hy3, 15, { color: P.ink, alpha: headA, width: 2.5 });
  dot(px + 15, hy3, 6, { color: P.ink, alpha: headA });
  nameText(L("具体的标准", "Concrete checks"), px + 30 + NAME_GAP, hy3, {
    align: "left",
    alpha: headA
  });
  const pt = hy3 + 46, pb = mids[1] + 60;
  box(px, pt, PW, pb - pt, { fill: P.row, stroke: P.line, alpha: gc, radius: 10 });
  const lit = (i, base2 = P.line) => blend(base2, P.evidence, ticked[i] / Math.max(gc, 1e-6));
  const part = gc * (en ? ramp(t, concrete + STAGE_CUT, 0.2) : 1);
  [-16, 16].forEach((dy) => {
    dot(px + 42, mids[0] + dy, 5, { color: lit(0), alpha: part });
    line(px + 62, mids[0] + dy, px + PW - 40 - (dy > 0 ? 60 : 0), mids[0] + dy, {
      color: P.line,
      alpha: part,
      width: 2
    });
  });
  line(px + 30, mids[1], px + PW - 30, mids[1], { color: P.line, alpha: part, width: 2 });
  line(px + 110, mids[1] + 12, px + 200, mids[1] + 12, { color: lit(1), alpha: part, width: 4 });
  const whole = ramp(t, cue(s, "讲明白", "first use") + 0.05, 0.4);
  rows.forEach(([term, termAts, qual, qualAts], i) => {
    const cx3 = LX - 50, on = speaking(t, starts, i);
    box(cx3 - 16, mids[i] - 16, 32, 32, {
      stroke: blend(P.line, P.ink, on),
      alpha: ticked[i],
      radius: 6,
      width: 2
    });
    check(cx3, mids[i], 22, { alpha: ticked[i] });
    termRow(t, term, termAts, qual, qualAts, LX, tops[i], {
      alpha: gc * Math.max(listLevel(t, starts, i), whole),
      set: "checks"
    });
  });
}
function s25OutsideReader(s, t, beforeSend, outsider, restate, gr) {
  const names = en ? ["Conclusion", "Basis", "Limits", "Next action"] : ["结论", "依据", "限度", "下一步"];
  const aside = L(157, 110), readerGlide = glideTime(aside);
  const reach = aside * (1 - smoother((voiceTime(t) - voiceTime(restate[0] - 0.15) + readerGlide) / readerGlide));
  const DX = 420 + reach, DW = 190, DH = 280, my = CONTENT_CY, ox = L(1130, 1100) + reach, CX = 1130 + 210;
  const tops = stackTops(
    names.map(() => labelSize(LABEL)),
    my,
    64
  ), mids = tops.map((v) => v + labelSize(LABEL) / 2);
  s23Page(DX, my - DH / 2, DW, DH, { alpha: gr, rows: 4 });
  nameText(L("发出之前", "Before sending"), DX, my - DH / 2 - NAME_GAP, {
    align: "left",
    valign: "bottom",
    alpha: gr * named(t, beforeSend)
  });
  const reads = glide(t, outsider, ox - 50 - DX - DW - 24);
  const ou = named(t, outsider) * gr;
  link(DX + DW + 24, my, ox - 50, my, {
    alpha: ou,
    draw: { t, at: outsider - 0.15 },
    flow: reads > 0 && reads < 1 ? reads * 0.999 : null
  });
  person(ox, my + 6, { alpha: ou, color: P.muted, size: 1.3 });
  const readerName = L("局外人", "A reader outside the work"), readerTop = my + 6 + 15 * 1.3 * 2.6 + NAME_GAP;
  const readerLast = readerTop + labelSize(LABEL) / 2 + (wrapName(readerName, 360).length - 1) * labelSize(LABEL) * LEADING;
  const meets = mids.find((m) => Math.abs(m - readerLast) < 13);
  nameText(readerName, ox, readerTop + (meets === void 0 ? 0 : meets - readerLast), {
    valign: "top",
    width: 360,
    color: P.muted,
    alpha: ou
  });
  const col = named(t, restate[0]) * gr;
  link(ox + 40, my, CX - 30, my, { alpha: col * 0.8, end: false });
  line(CX - 30, mids[0], CX - 30, mids[3], { color: P.line, alpha: col, width: 2 });
  const whole = ramp(t, cue(s, "步", "action", { last: true }) + 0.05, 0.25);
  names.forEach((v, i) => {
    const got = named(t, restate[i]), lit = speaking(t, restate, i);
    link(CX - 30, mids[i], CX - 13, mids[i], { alpha: gr * 0.8 * got, end: false, r: 0 });
    dot(CX, mids[i], 6 + 2 * lit, { color: P.evidence, alpha: got * gr });
    if (lit > 0)
      ring(CX, mids[i], 18, {
        color: P.evidence,
        alpha: lit * restMark(P.evidence, 0.5) * gr,
        width: 2
      });
    nameText(v, CX + 11 + NAME_GAP, mids[i], {
      align: "left",
      alpha: gr * got * Math.max(listLevel(t, restate, i), whole),
      set: "restate"
    });
  });
}

// picture/film/scenes/p25/escalation.js
function s25Escalation(s, t, escalate, risk, facts, impact2, safe, contain, effect, options, costs, recommend, who, g4) {
  const names = en ? ["Risk or blocker", "Impact", "Containment", "Decision"] : ["风险或障碍", "影响", "控制影响", "决定"];
  const GW = 320, nameW = Math.max(...names.map((v) => measure(v))), SW = GW + 40, PW = 28 + nameW + 32 + SW + 24, HEAD = 96, SH = 96, STEP = 32;
  const starts = [risk, Math.min(facts, impact2), contain, options], grown = starts.map((at) => soon(t, pauseHold(at - 0.5, 0.4), 0.35));
  const PX = 960 - PW / 2 - 152;
  const PY = 380 - STEP * grown.slice(1).reduce((a, b) => a + b, 0), SX = PX + 28 + nameW + 32, gx = SX + SW / 2;
  const tops = starts.map((_, k) => PY + HEAD + k * (SH + 12)), mids = tops.map((v) => v + SH / 2);
  const length = grown.reduce((h, q, k) => h + (k ? SH + 12 : SH + 24) * q, HEAD);
  s23Page(PX, PY, PW, length, { alpha: g4 });
  nameText(L("上报风险", "Escalating a risk"), PX + 28, PY + HEAD / 2, {
    align: "left",
    alpha: g4 * named(t, escalate)
  });
  const attach = (k) => {
    const dx = 32 * (1 - soon(t, starts[k] - 0.1, 0.5));
    box(SX + dx, tops[k], SW, SH, {
      fill: P.row,
      stroke: P.ink,
      alpha: ramp(t, starts[k] - 0.15, 0.4) * g4,
      radius: 10,
      width: 2
    });
    nameText(names[k], PX + 28, mids[k], {
      align: "left",
      alpha: g4 * listIn(t, starts, k),
      set: "parts"
    });
    return dx;
  };
  const on = (at) => ramp(t, at - 0.15, 0.4) * g4;
  {
    const x = gx + attach(0), y = mids[0];
    dot(x, y, 13, { color: P.unknown, alpha: on(risk) });
    ring(x, y, 26, { color: P.unknown, alpha: on(risk), width: 2.5 });
    ring(x, y, 38, { color: P.unknown, alpha: on(risk), width: 2 });
  }
  {
    const x = gx + attach(1), y = mids[1], run = soon(t, safe + 0.05, 0.7);
    s23Page(x - 154, y - 31, 48, 62, { alpha: on(facts), rows: 3 });
    dot(x - 46, y, 7, { color: P.unknown, alpha: on(impact2) });
    ring(x - 46, y, mix(7, 26, soon(t, impact2 + 0.05, 0.6)), {
      color: P.unknown,
      alpha: on(impact2),
      width: 2
    });
    dot(x + 14, y, 6, { color: P.ink, alpha: on(safe) });
    line(x + 14, y, mix(x + 14, x + 112, run), y, {
      color: P.evidence,
      alpha: on(safe),
      width: 3.5
    });
    line(x + 112, y - 24, x + 112, y + 24, {
      color: P.authority,
      alpha: on(safe) * ramp(t, safe + 0.4, 0.3),
      width: 4
    });
    line(x + 120, y, x + 156, y, {
      color: P.unknown,
      alpha: on(safe) * ramp(t, safe + 0.6, 0.3),
      width: 2.5
    });
  }
  {
    const x = gx + attach(2), y = mids[2], held = soon(t, effect + 0.05, 0.8);
    shield(x - 112, y, 34, { color: P.evidence, alpha: on(contain), fillColor: P.row });
    check(x - 112, y + 2, 26, { color: P.evidence, alpha: on(contain) });
    box(x - 52, y - 13, 200, 26, { stroke: P.line, alpha: on(effect), radius: 13, width: 2 });
    box(x - 47, y - 8, mix(16, 118, held), 16, {
      fill: P.evidence,
      alpha: on(effect),
      radius: 8
    });
  }
  {
    const x = gx + attach(3), y = mids[3], pick = ramp(t, recommend - 0.15, 0.4), optionsAt = cue(s, "选项", "the options");
    [x - 70, x + 46].forEach((ox, i) => {
      box(ox - 40, y - 34, 80, 42, {
        fill: P.ground,
        stroke: i ? blend(P.ink, P.evidence, pick) : P.ink,
        alpha: on(optionsAt),
        radius: 8,
        width: 2
      });
      if (i) check(ox, y - 13, 26, { alpha: pick * g4 });
      dot(ox, y - 13, 6, { color: P.ink, alpha: on(optionsAt) * (i ? 1 - pick : 1) });
      line(ox - 36, y + 24, ox - 36 + [66, 32][i], y + 24, {
        color: P.unknown,
        alpha: on(costs),
        width: 7
      });
    });
  }
  const DX = PX + PW + 200, DY = mids[1] + 54, go = glide(t, who + 0.05, DX - 48 - PX - PW - 14);
  person(DX, DY + 10, {
    color: blend(P.muted, P.authority, ramp(t, who - 0.15, 0.4)),
    alpha: g4,
    size: 1.4
  });
  link(PX + PW + 14, DY, DX - 48, DY, {
    color: P.authority,
    alpha: on(who),
    upto: go,
    width: 2.5
  });
  clock(DX + 80, DY - 34, 24, {
    color: P.authority,
    alpha: on(cue(s, "在什么时候决定", "by when")),
    hand: 0.8
  });
}

// picture/film/scenes/p25/examples.js
function s25FidelityExample(t, example, twoHours, write, roughly, fidelityIs, clarityIn, head, fadeAt, gF) {
  ctx.save();
  ctx.translate(L(-390 * glide(t, clarityIn - 0.85 * glideTime(390), 390), 0), 0);
  const fy = 300, lw = L(760, 880), lx = 960 - lw / 2, rowY = fy + 200;
  const up = drawShare(t, pauseHold(twoHours - 0.45, 0.4), 72, 0.4), down = drawShare(t, pauseHold(Math.min(write, fidelityIs) - 0.45, 0.4), 160, 0.4);
  box(
    lx,
    mix(rowY - 40, rowY - 112, up),
    lw,
    mix(rowY + 40, rowY + 200, down) - mix(rowY - 40, rowY - 112, up),
    { stroke: P.line, alpha: en && t >= fadeAt ? 0 : gF, radius: 10, width: 2.5 }
  );
  head(lx, rowY - 152, L("信", "Fidelity"), P.evidence, fidelityIs, gF);
  const ay = fy + 200, rowName = L("采集", "Collection"), truth = L("晚了两个小时", "Two hours late"), x0 = lx + 40 + measure(rowName) + NAME_GAP;
  const qx = lx + lw - 60 - measure(truth) / 2 - 56, px = Math.max(x0 + 60, qx - 370);
  nameText(rowName, lx + 40, ay, { align: "left", alpha: gF * named(t, example) });
  line(x0, ay, lx + lw - 40, ay, { color: P.line, alpha: gF, width: 2 });
  ring(px, ay, 12, { color: P.line, alpha: gF, width: 2, dash: [4, 5] });
  const slip = drawShare(t, twoHours - 0.1, qx - px), cx2 = mix(px, qx, slip), late = gF * ramp(t, twoHours - 0.15, 0.4);
  dot(qx, ay, 10, { color: P.evidence, alpha: late });
  const span2 = late * clamp((cx2 - px) / 80);
  stroke(
    () => {
      ctx.moveTo(px, ay - 52);
      ctx.lineTo(px, ay - 36);
      ctx.moveTo(px, ay - 44);
      ctx.lineTo(cx2, ay - 44);
      ctx.moveTo(cx2, ay - 52);
      ctx.lineTo(cx2, ay - 36);
    },
    { color: P.unknown, alpha: span2, width: 2 }
  );
  text(L("2 小时", "2 h"), (px + qx) / 2, ay - 78, LABEL, {
    role: "mark",
    align: "center",
    color: P.unknown,
    alpha: gF * ramp(t, twoHours + 0.4, 0.4)
  });
  const sy = fy + 360;
  link(qx, ay + 16, qx, sy - 28, {
    alpha: gF * ramp(t, write - 0.15, 0.4),
    draw: { t, at: write - 0.1 },
    end: false
  });
  nameText(truth, qx, sy, { color: P.evidence, alpha: gF * named(t, write) });
  check(qx + measure(truth) / 2 + 30, sy, 26, {
    alpha: gF * ramp(t, Math.max(fidelityIs, write) - 0.15, 0.4)
  });
  link(px, ay + 16, px, sy - 28, {
    alpha: gF * ramp(t, roughly - 0.15, 0.4),
    upto: drawShare(t, roughly - 0.1, Math.abs(sy - 28 - (ay + 16)), 0.5),
    end: false,
    dash: [6, 6]
  });
  rejectedName(L("“基本按时”", "“Roughly on time”"), px, sy, {
    alpha: gF * named(t, roughly),
    mark: ramp(t, roughly + 0.4, 0.4)
  });
  ctx.restore();
}
function s25ClarityExample(t, firstLead, decisionNeeded, detail, clarityIs, head, CW, CX, CY, reformAt, gC) {
  const lead = [firstLead, decisionNeeded, detail], leadNames = en ? ["The conclusion", "The decision needed", "Detail"] : ["结论", "需要谁来决定", "细节"];
  const rw = CW, rx = CX, fy = CY, rows = [fy + 70, fy + 180, fy + 290], sx = rx + 60;
  const grown = lead.map((at, i) => i ? drawShare(t, at - 0.45, [0, 110, 154][i], 0.4) : 1), fh = 70 + 36 + 57 + 110 * grown[1] + (110 + 44) * grown[2];
  const k = en ? glide(t, reformAt, 207) : 1, top = en ? mix(388, fy, k) : fy, foot = en ? mix(700, fy + fh, k) : fy + fh;
  box(rx, top, rw, en ? foot - top : fh, {
    stroke: P.line,
    alpha: gC,
    radius: 10,
    width: en ? mix(2.5, 3.5, k) : 3.5
  });
  if (!en) head(rx, fy - 40, "达", P.ink, clarityIs, gC);
  path(
    [
      [sx, rows[0]],
      [sx, mix(rows[0], mix(rows[1], rows[2], grown[2]), grown[1])]
    ],
    { color: P.line, alpha: gC, width: 3 }
  );
  const whole = ramp(t, Math.max(clarityIs, detail) + 0.05, 0.4);
  lead.forEach((at, i) => {
    const y = rows[i], got = named(t, at), lit = speaking(t, lead, i) * (1 - whole), color = i < 2 ? P.ink : P.muted;
    dot(sx, y, 5 + 2 * lit, { color, alpha: got * gC });
    if (lit > 0) ring(sx, y, 15, { color: P.ink, alpha: lit * 0.5 * gC, width: 2 });
    nameText(leadNames[i], sx + 15 + NAME_GAP, y, {
      align: "left",
      color,
      alpha: gC * ramp(t, at - 0.15, 0.4) * Math.max(listLevel(t, lead, i), whole),
      set: "lead"
    });
    stroke(
      () => {
        for (let k2 = 0; k2 < (i < 2 ? 1 : 3); k2++) {
          ctx.moveTo(sx + 37, y + 36 + k2 * 22);
          ctx.lineTo(rx + rw - 60 - (k2 === 2 ? 140 : 0), y + 36 + k2 * 22);
        }
      },
      { color: P.muted, alpha: got * gC * 0.8, width: 2.5 }
    );
  });
}

// picture/film/scenes/p25/scene.js
scenes["25"] = function(s, t) {
  const triad = cues(s, [
    ["信达", "fidelity clarity"],
    ["达雅", "clarity and elegance"],
    ["雅次序", "elegance in that"]
  ]);
  const [order, fidelity, clarity, elegance] = cues(s, [
    ["次序不能颠倒", "in that order"],
    ["信是忠于原意", "fidelity preserves"],
    ["达是在准确理解之后", "clarity begins"],
    ["雅是凭品位", "elegance brings"]
  ]);
  const [
    example,
    twoHours,
    write,
    roughly,
    fidelityIs,
    firstLead,
    decisionNeeded,
    detail,
    clarityIs
  ] = cues(s, [
    ["采集晚了两个小时", "collection ran two hours late"],
    ["晚了两个小时", "two hours late"],
    ["就写晚了两个小时", "writing two hours late"],
    ["基本按时", "roughly on time"],
    ["这是信", "fidelity means"],
    ["结论", "conclusion"],
    ["需要谁来决定", "the decision needed"],
    ["细节", "the detail"],
    ["这是达", "clarity means"]
  ]);
  const [concrete, onePoint, terms, beforeSend, outsider] = cues(s, [
    ["有具体的标准", "clarity has concrete checks"],
    ["一段只讲一个意思", "one point per paragraph"],
    ["重要的术语", "important terms"],
    ["发出之前", "before sending"],
    ["局外人", "a reader outside"]
  ]);
  const restate = [
    cue(s, "结论", "conclusion", { last: true }),
    cue(s, "依据", "basis"),
    cue(s, "限度", "limits", { last: true }),
    cue(s, "下一步", "next action")
  ];
  const [escalate, risk, facts, impact2, safe, contain, effect, options, costs, recommend, who] = cues(s, [
    ["上报风险", "escalating a risk"],
    ["一是风险", "the risk"],
    ["有哪些事实", "the facts"],
    ["二是影响", "its impact"],
    ["最晚什么时候决定还来得及", "latest safe time to decide"],
    ["三是控制影响", "containment"],
    ["效果怎样", "its result"],
    ["四是决定", "the decision the options"],
    ["代价", "their costs"],
    ["你的建议", "your recommendation"],
    ["谁必须", "who must decide"]
  ]);
  const base = ramp(t, opening(s), 0.7);
  const colors = [P.evidence, P.ink, P.authority], aims = en ? ["Fidelity", "Clarity", "Elegance"] : ["信", "达", "雅"];
  const gA = base * stageOut(t, fidelity);
  if (gA > 0) s25ThreeAims(s, t, triad, order, colors, aims, gA);
  const g1 = base * stageIn(t, fidelity) * stageOut(t, example);
  if (g1 > 0) s25Mechanisms(s, t, fidelity, clarity, elegance, example, colors, aims, g1);
  const gE = base * stageIn(t, example) * stageOut(t, concrete), clarityIn = firstLead - 0.15;
  illustrative(gE);
  const head = (x, y, name, color, at, a) => {
    const on = named(t, at) * a;
    ring(x + 15, y, 15, { color, alpha: on, width: 2.5 });
    dot(x + 15, y, 6, { color, alpha: on });
    nameText(name, x + 30 + NAME_GAP, y, { align: "left", color, alpha: on });
  };
  const CW = L(700, 880), CX = L(1030, 960 - CW / 2), CY = L(388, 330);
  const fadeAt = en ? cueFrom(s, "", "means", clarityIs) + 0.05 : Infinity, reformAt = en ? cueFrom(s, "", "leading", clarityIs) + 0.05 : Infinity;
  const gF = en ? gE * (1 - ramp(t, fadeAt, 0.4)) : gE;
  if (gF > 0)
    s25FidelityExample(
      t,
      example,
      twoHours,
      write,
      roughly,
      fidelityIs,
      clarityIn,
      head,
      fadeAt,
      gF
    );
  if (en) head(CX, CY - 40, "Clarity", P.ink, clarityIs, gE);
  const gC = gE * (en ? t >= fadeAt ? 1 : 0 : ramp(t, clarityIn, 0.4));
  if (gC > 0)
    s25ClarityExample(
      t,
      firstLead,
      decisionNeeded,
      detail,
      clarityIs,
      head,
      CW,
      CX,
      CY,
      reformAt,
      gC
    );
  const sendCut = beforeSend;
  const gc = base * stageIn(t, concrete) * stageOut(t, sendCut);
  if (gc > 0) s25ClarityChecks(s, t, concrete, onePoint, terms, gc);
  const gr = base * stageIn(t, sendCut) * stageOut(t, escalate);
  if (gr > 0) s25OutsideReader(s, t, beforeSend, outsider, restate, gr);
  const g4 = base * stageIn(t, escalate);
  if (g4 > 0)
    s25Escalation(
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
      g4
    );
};

// picture/film/scenes/p26/learning.js
function s26Learning(s, t, g1) {
  const [sooner, judge, less, more] = cues(s, [
    ["更早被发现", "earlier"],
    ["更容易判断", "judge it more easily"],
    ["少靠人救火", "less manual rescue"],
    ["让文件变多", "add files"]
  ]);
  const fails = en ? s.words[0].start : cue(s, "失败", "");
  const OFF = mix(L(65, 25), L(-75, -100), glide(t, more - 0.1, L(140, 125)));
  const Y = 500, X02 = 420 + OFF, X12 = 1440 + OFF, LH = 46, FX = 520 + OFF, LATE = 1080 + OFF, EARLY = 740 + OFF, BAND = Y + 30, BH = 12, OLD = 360, NEW = 150;
  const shrink = soon(t, less + 0.25, 0.8), top = Y - LH - NAME_GAP, below = Y + LH + NAME_GAP;
  box(X02, Y - LH, X12 - X02, 2 * LH, {
    fill: P.row,
    stroke: P.line,
    alpha: g1,
    radius: 16,
    width: 4
  });
  const way = s.words[0].start;
  line(
    X02 + 24,
    Y,
    mix(X02 + 24, X12 - 24, drawShare(t, way - 0.1, X12 - X02 - 48, Math.max(1.2, sooner - way))),
    Y,
    { color: P.line, alpha: g1, width: 2 }
  );
  if (!en)
    nameText("下一次", X02 - NAME_GAP, Y, {
      align: "right",
      alpha: g1 * named(t, cue(s, "是让", ""))
    });
  if (!en)
    nameText("学习的目的", X02, top, {
      align: "left",
      valign: "bottom",
      alpha: g1 * named(t, cue(s, "学习的目的", ""))
    });
  const fq = g1 * ramp(t, fails - 0.15, 0.4);
  ring(FX, Y, 14, { color: P.unknown, alpha: fq, width: 2.5 });
  dot(FX, Y, 6, { color: P.unknown, alpha: fq });
  nameText(L("失败", "The next failure"), FX, below, {
    valign: "top",
    alpha: g1 * named(t, fails)
  });
  const found = g1 * ramp(t, sooner - 0.1, 0.3);
  line(LATE, Y - 38, LATE, Y + 38, { color: P.line, alpha: found, width: 2 });
  link(LATE - 4, Y, EARLY + 8, Y, {
    color: P.evidence,
    alpha: found,
    width: 2.5,
    draw: { t, at: sooner + 0.05 },
    end: false
  });
  box(EARLY, BAND, OLD, BH, {
    stroke: P.line,
    alpha: g1 * ramp(t, less + 0.25, 0.4),
    radius: 5,
    width: 2
  });
  line(EARLY, Y - 38, EARLY, Y + 38, { color: P.evidence, alpha: found, width: 4 });
  ring(EARLY, Y, 24, { color: P.evidence, alpha: g1 * ramp(t, judge - 0.05, 0.4), width: 2.5 });
  box(EARLY, BAND, mix(OLD, NEW, shrink), BH, {
    fill: P.unknown,
    alpha: g1 * restMark(P.unknown, 0.55) * ramp(t, less - 0.15, 0.3),
    radius: 5
  });
  const parts = [L("更早被发现", "Find it earlier"), L("、更容易判断", ", judge it more easily")];
  growName(t, parts, [sooner, judge], EARLY, top, {
    valign: "bottom",
    width: en ? Infinity : measure(parts[0]) + 8,
    alpha: g1,
    color: P.evidence
  });
  nameText(L("少靠人救火", "Less manual rescue"), EARLY, below, {
    align: "left",
    valign: "top",
    alpha: g1 * named(t, less)
  });
  const fl = g1 * ramp(t, more - 0.15, 0.4);
  for (let k = 0; k < 3; k++)
    documentIcon(1556 + OFF + k * 16, Y - 74 + k * 14, 80, 100, {
      alpha: fl,
      rows: 3,
      stroke: P.muted
    });
  rejectedName(L("让文件变多", "Add files"), 1612 + OFF, below, {
    valign: "top",
    alpha: g1 * named(t, more),
    mark: ramp(t, cue(s, "文件", "files") + 0.05, 0.3)
  });
}

// picture/film/scenes/p26/practice.js
function s26Candidates(t, practice, kinds, needs, PRACTICE_X, PRACTICE_R, g2) {
  const PX = PRACTICE_X, PR = PRACTICE_R, RX = PX - 180, SX = RX - 340, JX = SX - 20, DX = JX - L(330, 280), MX = DX + 230, NX = DX - 40, NEED = (SX + RX) / 2;
  const cys = [340, 420, 500, 580, 660], lys = [370, 500, 630];
  const kindNames = en ? ["Rule", "Template", "Tool", "Agent workflow", "Platform mechanism"] : ["规则", "模板", "工具", "智能体流程", "平台机制"];
  const leftmost = NX - Math.max(...kindNames.map((v) => Math.max(...[].concat(v).map((line2) => measure(line2))))), lean = 960 - (leftmost + PX - PR - 10) / 2;
  ctx.save();
  ctx.translate(lean * (1 - glide(t, practice - 0.15, lean)), 0);
  const needNames = en ? ["Observed problem", "Substantiated material risk", "Applicable obligation"] : ["观察到的问题", "有依据的实质风险", "必须履行的义务"];
  kinds.forEach((at, i) => {
    const q = ramp(t, at - 0.15, 0.4) * g2, lit = speaking(t, kinds, i), y = cys[i], color = blend(P.ink, P.evidence, lit);
    if (i === 0) documentIcon(DX - 18, y - 23, 36, 46, { alpha: q, rows: 3, stroke: color });
    if (i === 1) {
      documentIcon(DX - 18, y - 23, 36, 46, { alpha: q, rows: 0, stroke: color });
      box(DX - 10, y - 9, 20, 18, { stroke: color, alpha: q, radius: 3, width: 2, dash: [3, 3] });
    }
    if (i === 2) {
      line(DX - 12, y + 12, DX + 3, y - 3, { color, alpha: q, width: 4 });
      ring(DX + 8, y - 8, 7, { color, alpha: q, width: 3 });
    }
    if (i === 3) agent(DX, y, { alpha: q, size: 0.6, color });
    if (i === 4) {
      ring(DX, y, 12, { color, alpha: q, width: 3 });
      dot(DX, y, 4, { color, alpha: q });
      stroke(
        () => [0, 1, 2, 3, 4, 5].forEach((k) => {
          const a = k * Math.PI / 3;
          ctx.moveTo(DX + Math.cos(a) * 14, y + Math.sin(a) * 14);
          ctx.lineTo(DX + Math.cos(a) * 20, y + Math.sin(a) * 20);
        }),
        { color, alpha: q, width: 3 }
      );
    }
    link(DX + 28, y, JX, 500, { route: "hvh", mid: MX, alpha: q, width: 3, end: false });
    nameText(kindNames[i], NX, y, {
      align: "right",
      alpha: g2 * listIn(t, kinds, i),
      set: "candidates"
    });
  });
  dot(JX, 500, 6, { color: P.line, alpha: g2 * ramp(t, kinds[0] - 0.15, 0.4) });
  lys.forEach((ly, k) => {
    const q = ramp(t, needs[k] - 0.15, 0.4) * g2, lit = speaking(t, needs, k), round = { t, at: needs[k] - 0.15 };
    if (ly === 500)
      link(JX, 500, PX - PR - 10, 500, {
        alpha: g2 * ramp(t, kinds[0] - 0.15, 0.4),
        draw: { t, at: kinds[0] + 0.05 },
        width: 4,
        end: false,
        flowing: since(t, Math.max(practice + 0.6, kinds[0] + 0.95))
      });
    else {
      path(
        rounded(
          [
            [JX, 500],
            [SX, 500],
            [SX, ly],
            [RX, ly],
            [RX, 500],
            [PX - PR - 10, 500]
          ],
          14
        ),
        { color: P.line, alpha: q, draw: round, width: 4 }
      );
    }
    ring(NEED, ly, 14, { color: P.authority, alpha: q, width: 2.5 });
    dot(NEED, ly, 6 + 2 * lit, { color: P.authority, alpha: q });
    nameText(needNames[k], NEED, ly - 14 - NAME_GAP, {
      valign: "bottom",
      width: L(260, 320),
      alpha: g2 * listIn(t, needs, k),
      set: "needs"
    });
  });
  const pr = ramp(t, practice - 0.15, 0.4) * g2;
  seal(PX, 500, PR, { color: P.authority, alpha: pr, hollow: true });
  nameText(L("全部门的做法", "Department practice"), PX, 500 + PR + NAME_GAP, {
    valign: "top",
    color: P.authority,
    alpha: g2 * named(t, practice)
  });
  ctx.restore();
}
function s26StillToShow(s, t, falls, cost, small, maintainer, explain, PRACTICE_X, PRACTICE_R, g3) {
  const [evidenceAt, triggers] = cues(s, [
    ["用证据看利弊", "evidence of net benefit"],
    ["什么时候改或撤", "stated triggers"]
  ]);
  const rows = en ? [
    [["Existing boundaries, interfaces and feedback fall short"], [falls], [], []],
    [
      ["New practice's cost"],
      [cost],
      ["to understand and maintain"],
      [cue(s, "", "to understand and maintain")]
    ],
    [["Bounded trial"], [small], ["net-benefit evidence"], [evidenceAt]],
    [["Named owner"], [maintainer], ["revision and retirement triggers"], [triggers]]
  ] : [
    [
      ["现有边界、分工衔接和反馈为什么不够"],
      [falls],
      ["新做法要多花多少学习和维护成本"],
      [cost]
    ],
    [["小范围试点"], [small], ["用证据看利弊"], [evidenceAt]],
    [["谁来维护"], [maintainer], ["什么时候改或撤"], [triggers]]
  ];
  const W = 600, PR = PRACTICE_R, starts = rows.map(([, termAts, , qualAts]) => Math.min(...termAts, ...qualAts));
  const rights = rows.map(
    ([term, , qual]) => Math.max(measure(term.join("")), qual.length ? Math.min(measure(qual.join(""), NOTE), W) : 0)
  );
  const right = Math.max(...rights), practiceName = L("全部门的做法", "Department practice");
  const half = Math.max(PR, measure(practiceName) / 2), LINK = 2 * (PRACTICE_X - 960) - (48 + right + 36 + PR) + half;
  const whole = 48 + right + 36 + LINK + PR + half, LX = 960 - whole / 2 + 48;
  const BX = LX + right + 36, PX = BX + LINK + PR;
  const blocks = rows.map(([term, , qual]) => termRowLayout(term, qual, W, false).height), pad = 24 - labelSize(LABEL) / 2;
  const tops = stackTops(blocks, CONTENT_CY, 36);
  const ys = tops.map((top2) => top2 + labelSize(LABEL) / 2), top = tops[0] - pad;
  rows.forEach(([term, termAts, qual, qualAts], r) => {
    const q = ramp(t, starts[r] - 0.15, 0.4), lit = speaking(t, starts, r);
    ring(LX - 34, ys[r], 16 + 2 * lit, { color: P.authority, alpha: g3 * q, width: 2.5 });
    check(LX - 34, ys[r] + 1, 18, {
      color: P.authority,
      alpha: g3 * ramp(t, starts[r] + 0.05, 0.4)
    });
    termRow(t, term, termAts, qual, qualAts, LX, tops[r], {
      width: W,
      alpha: g3 * listLevel(t, starts, r),
      set: "conditions",
      inline: false
    });
  });
  let joinAt = Infinity;
  const held = rows.reduce((b, [, , , qualAts], r) => {
    const nameFrom = pauseHold(starts[r] - 0.45, 0.4), nameTo = tops[r] + labelSize(LABEL) + pad;
    if (nameTo > CONTENT_CY) joinAt = Math.min(joinAt, nameFrom);
    const named2 = mix(b, nameTo, soon(t, nameFrom, 0.4));
    if (!qualAts.length) return named2;
    const qualFrom = pauseHold(qualAts[0] - 0.45, 0.4), qualTo = tops[r] + blocks[r] + pad;
    if (qualTo > CONTENT_CY) joinAt = Math.min(joinAt, qualFrom);
    return mix(named2, qualTo, soon(t, qualFrom, 0.4));
  }, top);
  if (held > top + 0.5)
    path(
      [
        [BX - 16, top],
        [BX, top],
        [BX, held],
        [BX - 16, held]
      ],
      { color: P.line, alpha: g3 * clamp((held - top) / 60), width: 2 }
    );
  const done = ramp(t, triggers + 0.05, 0.4);
  link(BX, CONTENT_CY, PX - PR - 12, CONTENT_CY, {
    alpha: g3 * Math.min(clamp((held - CONTENT_CY) / 24), ramp(t, joinAt + 0.4, 0.4)),
    end: false,
    flowing: since(t, triggers + 0.05)
  });
  seal(PX, CONTENT_CY, PR, { color: P.authority, alpha: g3, hollow: true });
  check(PX, CONTENT_CY + 3, PR * 0.8, { color: P.authority, alpha: g3 * done });
  nameText(practiceName, PX, CONTENT_CY + PR + NAME_GAP, {
    valign: "top",
    color: P.authority,
    alpha: g3
  });
  if (!en)
    nameText("还要做到三件事", LX, top - 24 - NAME_GAP, {
      align: "left",
      valign: "bottom",
      color: P.muted,
      alpha: g3 * named(t, explain)
    });
}

// picture/film/scenes/p26/safeguards.js
function s26Safeguard(s, t, safeguards, noWait, g4) {
  const [incidentAt, approvalAt] = cues(s, [
    ["出事", "an incident"],
    ["新做法获批", "a new practice's admission"]
  ]);
  const LEFT = mix(L(140, 316), L(-150, -120), glide(t, incidentAt - 0.1, L(290, 436)));
  const SX = L(620, 540) + LEFT, SR = L(120, 88), EX = L(1300, 1215), BX = EX - 50, ys = [452, 548], E = SX - SR * 0.85;
  const trialAt = cueFrom(
    s,
    "试点",
    "a trial only chooses",
    cue(s, "这类保障也可以试点", "a trial only chooses")
  );
  const onlyAt = cueFrom(s, "只用来选定", "only chooses", trialAt), howAt = cueFrom(s, "选定", "chooses", trialAt);
  shield(SX, CONTENT_CY, SR, { alpha: g4, fillColor: P.row });
  check(SX, CONTENT_CY + 3, SR * 0.52, {
    color: P.evidence,
    alpha: g4 * ramp(t, safeguards + 0.05, 0.4),
    width: 4.5
  });
  if (en)
    growName(t, ["Necessary safeguards"], [safeguards], E, CONTENT_CY - SR - NAME_GAP, {
      valign: "bottom",
      alpha: g4,
      color: P.evidence
    });
  else {
    const term = ["必要的保障"], NW = 620;
    termRow(
      t,
      term,
      [safeguards],
      [],
      [],
      E,
      CONTENT_CY - SR - NAME_GAP - termRowLayout(term, [], NW).height,
      { width: NW, alpha: g4, color: P.evidence }
    );
    const lit = span(t, cue(s, "这类保障", "") - 0.15, onlyAt - 0.1, 0.3);
    if (lit > 0)
      ring(SX, CONTENT_CY, SR + 16, {
        color: P.evidence,
        alpha: lit * restMark(P.evidence, 0.5) * g4,
        width: 2
      });
  }
  const names = en ? ["An incident", "A new practice's admission"] : ["出事", "新做法获批"];
  [incidentAt, approvalAt].forEach((at, k) => {
    const q = ramp(t, at - 0.15, 0.4) * g4, y = ys[k];
    if (k) seal(EX, y, 22, { color: P.authority, alpha: q, hollow: true });
    else {
      ring(EX, y, 22, { color: P.unknown, alpha: q, width: 2.5 });
      text("!", EX, y + 1, 26, { role: "mark", align: "center", color: P.unknown, alpha: q });
    }
    nameText(names[k], EX + 30 + NAME_GAP, y, {
      align: "left",
      width: 380,
      alpha: g4 * named(t, at)
    });
  });
  const reach = mix(ys[0] + 30, ys[1] + 30, soon(t, pauseHold(approvalAt - 0.45, 0.4), 0.4));
  path(
    [
      [BX + 16, ys[0] - 30],
      [BX, ys[0] - 30],
      [BX, reach],
      [BX + 16, reach]
    ],
    { color: P.line, alpha: g4 * named(t, incidentAt), width: 2 }
  );
  const go = soon(t, noWait - 0.05, 0.6), wayEnd = 1238, stopX = (SX + SR + 12 + wayEnd) / 2;
  link(SX + SR + 12, CONTENT_CY, wayEnd, CONTENT_CY, {
    color: P.unknown,
    alpha: g4 * ramp(t, noWait - 0.05, 0.3),
    upto: 0.5 * go,
    end: false,
    dash: [8, 8]
  });
  line(stopX, CONTENT_CY - 34, stopX, CONTENT_CY + 34, {
    color: P.unknown,
    alpha: g4 * ramp(t, noWait + 0.45, 0.3),
    width: 4
  });
  if (!en)
    nameText("不能等", stopX, CONTENT_CY + 34 + NAME_GAP, {
      valign: "top",
      alpha: g4 * named(t, noWait)
    });
  const withinAt = cue(s, "在现有权限里", "within existing authority");
  const groundY = CONTENT_CY + SR + 20, oblige = L("在现有权限里", "Within existing authority");
  line(E, groundY, SX + SR * 0.85, groundY, {
    color: P.authority,
    alpha: g4 * ramp(t, withinAt - 0.15, 0.4),
    width: 3
  });
  nameText(oblige, E, groundY + NAME_GAP, {
    align: "left",
    valign: "top",
    color: P.authority,
    alpha: g4 * named(t, withinAt)
  });
  const TY = groundY + NAME_GAP + blockHeight(1) + 44, tq = ramp(t, trialAt - 0.15, 0.4) * g4, pick = ramp(t, howAt - 0.1, 0.4);
  const verifyAt = cueFrom(s, "核验怎么做", "verifies", trialAt), verified = ramp(t, verifyAt - 0.1, 0.4);
  dot(E + 6, TY, 6, { color: P.ink, alpha: tq });
  [-22, 0, 22].forEach((dy, k) => {
    const color = k === 1 ? blend(P.line, P.evidence, pick) : P.line;
    line(E + 12, TY, E + 64, TY + dy, { color, alpha: tq, width: k === 1 ? 2.5 + pick : 2 });
    dot(E + 70, TY + dy, 5, { color, alpha: tq * (k === 1 ? 1 - verified : 1) });
  });
  check(E + 70, TY, 20, {
    color: P.evidence,
    alpha: tq * verified,
    draw: { t, at: verifyAt + 0.05 }
  });
  const trialX = E + 70 + 12 + NAME_GAP, trialY = TY - labelSize(LABEL) / 2;
  if (en)
    growName(t, ["A trial", " only chooses and verifies how"], [trialAt, onlyAt], trialX, trialY, {
      width: 560,
      alpha: g4
    });
  else {
    nameText("试点", trialX, TY, { align: "left", alpha: g4 * named(t, trialAt) });
    nameText("只用来选定、核验怎么做", trialX + measure("试点") + TERM_GAP, TY, {
      align: "left",
      size: NOTE,
      color: P.muted,
      alpha: g4 * named(t, onlyAt)
    });
    const whetherAt = cueFrom(s, "决定做不做", "", trialAt);
    rejectedName("决定做不做", trialX, TY + labelSize(LABEL) * LEADING, {
      align: "left",
      alpha: g4 * named(t, whetherAt),
      mark: ramp(t, whetherAt + 0.05, 0.35)
    });
  }
}
function s26Retire(t, retire, reasons, reasonNames, judged, g5) {
  const RX = 1300, RW = 150, RH = 190, LX = 560, out = ramp(t, retire + 0.05, 0.4);
  const tops = stackTops(
    reasonNames.map(() => labelSize(LABEL)),
    CONTENT_CY,
    26
  ), ys = tops.map((top) => top + labelSize(LABEL) / 2);
  const BX = LX + Math.max(...reasonNames.map((v) => measure(v))) + 40;
  reasons.forEach((at, i) => {
    const q = ramp(t, at - 0.15, 0.4) * g5, lit = speaking(t, reasons, i);
    ring(LX - 34, ys[i], 14 + 2 * lit, { color: P.unknown, alpha: q, width: 2.5 });
    dot(LX - 34, ys[i], 5, { color: P.unknown, alpha: q });
    nameText(reasonNames[i], LX, ys[i], {
      align: "left",
      alpha: g5 * listIn(t, reasons, i),
      set: "reasons"
    });
  });
  const held = reasons.reduce(
    (b, at, i) => mix(b, ys[i] + 24, soon(t, pauseHold(at - 0.45, 0.4), 0.4)),
    ys[0] + 24
  );
  path(
    [
      [BX - 16, ys[0] - 24],
      [BX, ys[0] - 24],
      [BX, held],
      [BX - 16, held]
    ],
    { color: P.line, alpha: g5 * ramp(t, reasons[0] - 0.15, 0.4), width: 2 }
  );
  const ruleOn = named(t, judged);
  link(BX, CONTENT_CY, RX - RW / 2 - 14, CONTENT_CY, {
    alpha: g5 * clamp((held - CONTENT_CY) / 80),
    end: false
  });
  s23Page(RX - RW / 2, CONTENT_CY - RH / 2, RW, RH, {
    alpha: g5 * ruleOn * mix(1, 0.7, out),
    rows: 4,
    stroke: blend(P.ink, P.muted, out)
  });
  nameText(L("规则", "A rule"), RX, CONTENT_CY - RH / 2 - NAME_GAP, {
    valign: "bottom",
    alpha: g5 * ruleOn
  });
  cross(RX + RW / 2 + 44, CONTENT_CY, 36, { alpha: g5 * out, width: 3.5 });
  nameText(L("撤掉", "Retire"), RX, CONTENT_CY + RH / 2 + NAME_GAP, {
    valign: "top",
    color: P.muted,
    alpha: g5 * named(t, retire)
  });
}

// picture/film/scenes/p26/scene.js
scenes["26"] = function(s, t) {
  const practice = cue(s, "全部门的做法", "department practice");
  const kinds = cues(s, [
    ["规则", "a rule"],
    ["模板", "template"],
    ["工具", "tool"],
    ["智能体流程", "Agent workflow"],
    ["平台机制", "platform mechanism"]
  ]);
  const needs = cues(s, [
    ["观察到的问题", "observed problem"],
    ["有依据的实质风险", "a substantiated material risk"],
    ["必须履行的义务", "an applicable obligation"]
  ]);
  const [falls, cost, small, maintainer] = cues(s, [
    ["现有边界", "why the existing boundaries"],
    ["新做法要多花多少", "the new practice's cost"],
    ["小范围试点", "a bounded trial"],
    ["谁来维护", "a named owner"]
  ]);
  const explain = cue(s, "还要做到三件事", "why the existing boundaries");
  const [safeguards, noWait] = cues(s, [
    ["必要的保障", "necessary safeguards"],
    ["不能等", "must not wait"]
  ]);
  const retire = cue(s, "就撤掉", "retire a rule");
  const ruleAt = cue(s, "规则要是", "retire a rule");
  const reasons = en ? cues(s, [
    ["", "nothing left to govern"],
    ["", "no user"],
    ["", "duplicates a source"],
    ["", "costs more"]
  ]) : cues(s, [
    ["失去适用对象", ""],
    ["没人用", ""],
    ["和权威来源重复", ""],
    ["得不偿失", ""]
  ]);
  const reasonNames = en ? [
    "Nothing left to govern",
    "No user",
    "Duplicates a source of truth",
    "Costs more than it returns"
  ] : ["失去适用对象", "没人用", "和权威来源重复", "得不偿失"];
  const base = ramp(t, opening(s), 0.7);
  const PRACTICE_X = 1430, PRACTICE_R = 60;
  const g1 = base * clearOfTitle(s, t, 360) * stageOut(t, kinds[0]);
  if (g1 > 0) s26Learning(s, t, g1);
  const judged = Math.min(retire, reasons[0], ruleAt);
  const g2 = base * stageIn(t, kinds[0]) * stageOut(t, explain);
  if (g2 > 0) s26Candidates(t, practice, kinds, needs, PRACTICE_X, PRACTICE_R, g2);
  const g3 = base * stageIn(t, explain) * stageOut(t, safeguards);
  if (g3 > 0)
    s26StillToShow(s, t, falls, cost, small, maintainer, explain, PRACTICE_X, PRACTICE_R, g3);
  const g4 = base * stageIn(t, safeguards) * stageOut(t, judged);
  if (g4 > 0) s26Safeguard(s, t, safeguards, noWait, g4);
  const g5 = base * stageIn(t, judged);
  if (g5 > 0) s26Retire(t, retire, reasons, reasonNames, judged, g5);
};

// picture/film/scenes/p27/drift.js
function s27SmallSignals(t, changes, defects, signals, X02, X12, Y0, s27Line, one) {
  const names = en ? [
    ["Definitions drifting"],
    ["Questions recurring"],
    ["Stepping in to rescue"],
    ["Evidence expiring"],
    ["Ownership blurring"],
    ["Intermittent failures"],
    ["Slight delays"]
  ] : [
    ["定义慢慢变了"],
    ["同样的问题反复被问"],
    ["临时靠人救火"],
    ["证据过期"],
    ["责任说不清"],
    ["偶尔出错"],
    ["略有延迟"]
  ];
  const wrap = 280;
  const xs = names.map((_, i) => L(268 + i * 220, 270 + i * 205)), lift = signals.map((at) => soon(t, at - 0.1, 0.5));
  const yAt = (x) => Y0 - xs.reduce((a, sx, i) => a + 22 * lift[i] * Math.exp(-(((x - sx) / 22) ** 2)), 0);
  const shape = ramp(t, changes - 0.1, 0.6) * one;
  s27Line(yAt, shape, { axis: shape });
  cross(X12, Y0, 24, { alpha: ramp(t, defects - 0.15, 0.4) * one, width: 3 });
  nameText(L("工作体系有缺陷", "Work-system defect"), X12, Y0 - 28 - NAME_GAP, {
    valign: "bottom",
    alpha: one * named(t, defects)
  });
  nameText(L("小变化", "Small changes"), X02 + 12, Y0 - 28 - NAME_GAP, {
    align: "left",
    valign: "bottom",
    alpha: one * named(t, changes)
  });
  xs.forEach((x, i) => {
    const q = ramp(t, signals[i] - 0.15, 0.3), lit = speaking(t, signals, i);
    dot(x, yAt(x), 7, { color: P.unknown, alpha: q * one });
    if (lit > 0)
      ring(x, yAt(x), 15, {
        color: P.unknown,
        alpha: lit * restMark(P.unknown, 0.6) * one,
        width: 2
      });
  });
  xs.forEach((x, i) => {
    if (i % 2)
      line(x, Y0 + 12, x, Y0 + NAME_GAP + 18 + RAIL_ROW - 6, {
        alpha: one * ramp(t, signals[i] - 0.15, 0.3),
        width: 2
      });
  });
  railNames(names, xs, Y0, {
    wrap,
    gap: (i) => NAME_GAP + 18 + (i % 2 ? RAIL_ROW : 0),
    alpha: (i) => one * listIn(t, signals, i),
    set: "signals"
  });
}
function s27Anomaly(t, anomaly, trend, pattern, impact, direction, Y0, s27Line, two) {
  const PX = 1e3, H = 170, peak = Y0 - H, up = glide(t, anomaly + 0.05, H), checks = [pattern, impact, direction];
  const yAt = (x) => Y0 - H * up * Math.exp(-(((x - PX) / 18) ** 2));
  s27Line(yAt, two);
  nameText(L("一次异常", "One anomaly"), PX, peak - 12 - NAME_GAP, {
    valign: "bottom",
    alpha: two * named(t, anomaly)
  });
  const refuse = ramp(t, trend + 0.45, 0.3) * two, TX = 1420;
  link(PX + 18, peak, TX - 10, peak, {
    color: P.unknown,
    alpha: two * ramp(t, trend + 0.05, 0.3),
    upto: drawShare(t, trend + 0.05, Math.abs(TX - 10 - (PX + 18)), 0.6),
    end: false,
    dash: [8, 8]
  });
  line(TX, peak - 24, TX, peak + 24, { color: P.unknown, alpha: refuse, width: 4 });
  rejectedName(L("看成趋势", "A trend"), TX + 24, peak, {
    align: "left",
    alpha: two * named(t, trend),
    mark: refuse / Math.max(two, 1e-6)
  });
  const lit = (i) => speaking(t, checks, i), seen = (i) => ramp(t, checks[i] - 0.1, 0.4) * two;
  [360, 480, 600, 720, 840].forEach(
    (x, k) => ring(x, Y0, 9 + 3 * lit(0), {
      color: P.evidence,
      alpha: seen(0) * ramp(t, pattern - 0.1 + k * 0.06, 0.3),
      width: 2.5
    })
  );
  const mx = PX - 34, im = seen(1);
  line(mx, Y0, mx, peak, { color: P.authority, alpha: im, width: 2.5 + lit(1) });
  line(mx - 10, Y0, mx + 10, Y0, { color: P.authority, alpha: im, width: 2.5 });
  line(mx - 10, peak, mx + 10, peak, { color: P.authority, alpha: im, width: 2.5 });
  path(
    [
      [1150, Y0],
      [1660, Y0]
    ],
    { color: P.evidence, alpha: seen(2), width: 5 + lit(2), draw: { t, at: direction - 0.1 } }
  );
  railNames(
    en ? ["Pattern", "Impact", "Direction"] : ["规律", "影响", "走向"],
    [600, PX, 1405],
    Y0,
    { alpha: (i) => two * listIn(t, checks, i), set: "checks" }
  );
}
function s27SameMetric(t, metric, weekly, signal, X02, Y0, s27Line, three) {
  const xs = [460, 640, 820, 1e3, 1180, 1360], QY = Y0 + 160, asked = xs.map((x, k) => ramp(t, weekly - 0.1 + k * 0.12, 0.35));
  const yAt = (x) => Y0 - xs.reduce((a, sx, k) => a + 14 * asked[k] * Math.exp(-(((x - sx) / 20) ** 2)), 0);
  s27Line(yAt, three);
  nameText(L("同一个指标", "The same metric"), X02, Y0 - NAME_GAP, {
    align: "left",
    valign: "bottom",
    color: P.evidence,
    alpha: three * named(t, metric)
  });
  stroke(
    () => xs.forEach((x, k) => {
      if (asked[k] > 0) {
        ctx.moveTo(x, yAt(x) + 8);
        ctx.lineTo(x, mix(yAt(x) + 8, QY - 28, asked[k]));
      }
    }),
    { color: P.line, alpha: three * 0.8, width: 2 }
  );
  stroke(
    () => xs.forEach((x, k) => {
      if (asked[k] > 0) {
        ctx.moveTo(x, QY - 22);
        ctx.ellipse(x, QY, 22, 22, -Math.PI / 2, 0, Math.PI * 2 * asked[k]);
      }
    }),
    { color: P.authority, alpha: three, width: 2.5 }
  );
  xs.forEach(
    (x, k) => text("?", x, QY + 1, 26, {
      role: "mark",
      align: "center",
      color: P.authority,
      alpha: asked[k] * three
    })
  );
  nameText(L("每周都有人问", "Asked every week"), 910, QY + 40 + NAME_GAP, {
    valign: "top",
    width: 640,
    color: P.authority,
    alpha: three * named(t, weekly)
  });
  const sg = ramp(t, signal + 0.05, 0.4) * three;
  box(xs[0] - 40, QY - 40, xs.at(-1) - xs[0] + 80, 80, {
    stroke: P.unknown,
    alpha: sg,
    radius: 40,
    width: 2.5
  });
  nameText(L("一个苗头", "A signal"), xs.at(-1) + 40 + NAME_GAP, QY, {
    align: "left",
    alpha: three * named(t, signal)
  });
}

// picture/film/scenes/p27/safeguard.js
function s27Forms(t, forms, kinds, six) {
  ctx.save();
  ctx.translate(en ? building(t, forms.slice(2), 39) : 0, 0);
  const sx = 960, sy = 290, bus = 420, iy = 530;
  const names = en ? ["Test", "Monitor", "Checklist", "Decision record", "Ownership and handoffs"] : ["测试", "监控", "清单", "决策记录", "分工"];
  const formsWrap = L(RAIL_WRAP, 340), xs = railStations(names, L(440, 320), 1480, { wrap: formsWrap });
  shield(sx, sy, 40, { color: P.evidence, alpha: six, fillColor: P.row });
  check(sx, sy + 2, 28, { color: P.evidence, alpha: six, width: 3 });
  nameText(L("预防措施", "Reusable prevention"), sx + 40 + NAME_GAP, sy, {
    align: "left",
    color: P.evidence,
    alpha: six * named(t, kinds)
  });
  link(sx, sy + 44, sx, bus, { alpha: six, end: false });
  line(xs[0], bus, xs.at(-1), bus, { color: P.line, alpha: six, width: 2 });
  forms.forEach((at, i) => {
    const x = xs[i], q = ramp(t, at - 0.15, 0.35) * six, lit = speaking(t, forms, i);
    link(x, bus, x, iy - 50, {
      color: blend(P.line, P.evidence, lit),
      alpha: six,
      draw: { t, at: at - 0.15 },
      end: false
    });
    if (i === 0) {
      box(x - 23, iy - 23, 46, 46, {
        fill: P.row,
        stroke: P.evidence,
        alpha: q,
        radius: 6,
        width: 2.5
      });
      check(x, iy + 2, 26, { color: P.evidence, alpha: q, width: 3.5 });
    } else if (i === 1) {
      box(x - 34, iy - 26, 68, 44, { stroke: P.ink, alpha: q, radius: 5 });
      path(
        [
          [x - 24, iy + 4],
          [x - 10, iy - 8],
          [x + 2, iy + 2],
          [x + 22, iy - 14]
        ],
        { color: P.evidence, alpha: q, width: 2 }
      );
      line(x, iy + 18, x, iy + 30, { color: P.ink, alpha: q, width: 2 });
      line(x - 14, iy + 30, x + 14, iy + 30, { color: P.ink, alpha: q, width: 2 });
    } else if (i === 2) {
      documentIcon(x - 22, iy - 30, 44, 58, { alpha: q, rows: 3 });
      check(x - 30, iy - 10, 12, { color: P.evidence, alpha: q, width: 2.5 });
      check(x - 30, iy + 10, 12, { color: P.evidence, alpha: q, width: 2.5 });
    } else if (i === 3) {
      documentIcon(x - 22, iy - 30, 44, 58, { alpha: q, rows: 2 });
      diamond(x, iy + 12, 9, { color: P.authority, alpha: q, width: 2 });
    } else {
      person(x - 22, iy + 2, { alpha: q, size: 0.55, color: P.authority });
      person(x + 22, iy + 2, { alpha: q, size: 0.55, color: P.ink });
      dot(x, iy - 2, 5, { color: P.evidence, alpha: q });
    }
  });
  railNames(names, xs, iy + 42, {
    gap: NAME_GAP,
    wrap: formsWrap,
    alpha: (i) => six * listIn(t, forms, i),
    set: "forms"
  });
  ctx.restore();
}
function s27OrderOfChoice(t, improve, fresh, lightest, seven) {
  const xs = [560, 1360], y = 510, R = 80, order = [improve, fresh];
  ctx.save();
  ctx.translate(43 * (1 - glide(t, fresh + 0.05, 43)), 0);
  shield(xs[0], y, R, { color: P.evidence, alpha: seven, fillColor: P.row });
  check(xs[0], y + 3, 50, { color: P.evidence, alpha: seven, width: 4 });
  link(xs[0] + R + 14, y, xs[1] - R - 14, y, {
    color: P.muted,
    alpha: seven,
    width: 2.5,
    dash: [8, 8],
    end: false,
    upto: drawShare(t, improve + 0.05, xs[1] - xs[0] - 2 * R - 28, 0.6)
  });
  const nw = ramp(t, fresh - 0.15, 0.4) * seven;
  box(xs[1] - R, y - R, 2 * R, 2 * R, {
    stroke: P.muted,
    alpha: 0.9 * nw,
    radius: 16,
    dash: [6, 6]
  });
  line(xs[1], y - 26, xs[1], y + 26, { color: P.muted, alpha: nw, width: 3 });
  line(xs[1] - 26, y, xs[1] + 26, y, { color: P.muted, alpha: nw, width: 3 });
  link(xs[0] + R + 14, y, xs[1] - R - 14, y, { alpha: nw, draw: { t, at: fresh - 0.1 } });
  railNames(
    en ? ["Improve what exists", "Creating something new"] : ["先改已有的", "再考虑新建"],
    xs,
    y + R + 16,
    {
      gap: NAME_GAP,
      alpha: (i) => seven * listIn(t, order, i),
      color: (i) => i ? P.muted : P.ink,
      set: "order",
      wrap: 420
    }
  );
  ring(xs[0], y, R + 16, {
    color: P.evidence,
    alpha: ramp(t, lightest + 0.05, 0.4) * seven,
    width: 2.5
  });
  nameText(L("够用的最轻的那种", "The lightest form that works"), xs[0], y - R - 16 - NAME_GAP, {
    valign: "bottom",
    color: P.evidence,
    alpha: seven * named(t, lightest)
  });
  ctx.restore();
}

// picture/film/scenes/p27/watch.js
function s27Conditions(s, t, conds, watch, problem, four) {
  const R = [351, 501, 651, 801], C = [580, 780, 980, 1180], START = 400, END = 1290, NX = END + 30 + NAME_GAP + 18, KX = START - 70, KY = R[0] - 136;
  const on = (at, lead = 0.15) => ramp(t, at - lead, 0.4) * four;
  const rowAts = [
    conds[0],
    conds[1],
    cue(s, "有些事", "forgetting something"),
    cue(s, "交给智能体", "agents will repeat")
  ];
  const fewAt = cueFrom(s, "少数人", "people's", conds[1]), causeAt = cue(s, "可能造成", "could cause"), lineAts = [conds[0], fewAt, causeAt, rowAts[3]];
  const names = en ? ["Same kind of problem recurs", "Tacit knowledge", "Material loss", "Agents will repeat"] : ["同类问题反复出现", "没写下来的经验", "实质损失", "交给智能体反复做"];
  const lean = en ? 960 - (KX + NX + Math.max(...names.map((v) => measure(v)))) / 2 : 0;
  ctx.save();
  ctx.translate(lean, building(t, rowAts, (R[1] - R[0]) / 2, 0.5));
  const extent = rowAts.reduce(
    (y, at, k) => mix(y, R[k] + [100, 100, 64, 64][k], ease((t - at + 0.5) / 0.7)),
    KY + 72
  );
  documentIcon(KX, KY, END + 30 - KX, extent - KY, { alpha: four, rows: 0 });
  nameText(L("留意这几种", "Conditions to watch"), KX + 30, KY + 36, {
    align: "left",
    alpha: four * named(t, watch)
  });
  R.forEach(
    (y, k) => line(START + 30, y, END, y, { color: P.line, alpha: on(lineAts[k]), width: 2 })
  );
  const cycle = cue(s, "周期", "work cycle");
  [480, 680, 880, 1080, 1280].forEach(
    (x, k) => line(x, R[0] - 44, x, extent - 28, {
      color: P.line,
      alpha: ramp(t, cycle + 0.05 + k * 0.06, 0.3) * four * 0.7,
      width: 2
    })
  );
  const recur = cue(s, "反复出现", "recurs"), backAt = [conds[0], recur + 0.05, recur + 0.3, recur + 0.55];
  C.forEach((x, k) => problem(x, R[0], 20, on(backAt[k], k ? -0.05 : 0.15)));
  const people = cue(s, "不止一个人", "more than one person"), project = cue(s, "项目", "project");
  [C[1], C[2]].forEach((x, k) => {
    const q = on(people + 0.2 * k, -0.05);
    line(x, R[0] + 20, x, R[0] + 44, { color: P.muted, alpha: q, width: 2 });
    person(x, R[0] + 62, { size: 0.55, color: P.muted, alpha: q });
  });
  const pq = on(project);
  line(C[3], R[0] + 20, C[3], R[0] + 40, { color: P.muted, alpha: pq, width: 2 });
  box(C[3] - 18, R[0] + 40, 36, 28, { stroke: P.muted, alpha: pq, radius: 4, width: 2 });
  line(C[3] - 18, R[0] + 48, C[3] + 18, R[0] + 48, { color: P.muted, alpha: pq, width: 2 });
  const unwritten = cue(s, "没写下来的经验", "tacit knowledge"), held = on(fewAt);
  person(START, R[1] + 12, { alpha: held, solid: false });
  dot(START, R[1] + 12 - 15 * 1.15, 15, { color: P.ink, alpha: held });
  line(START + 30, R[1], C[2], R[1], { color: P.authority, alpha: on(fewAt, 0.1), width: 2.5 });
  [0, 1, 2].forEach(
    (k) => diamond(C[k], R[1], 17, {
      color: P.authority,
      alpha: on(fewAt + 0.2 * k, k ? -0.05 : 0.15),
      width: 2.5
    })
  );
  box(START - 17, R[1] + 40, 34, 44, {
    stroke: P.muted,
    alpha: on(unwritten),
    radius: 4,
    width: 2,
    dash: [5, 4]
  });
  [0, 1].forEach((k) => {
    const q = on(causeAt + 0.2 * k, k ? -0.05 : 0.15);
    box(C[k] - 15, R[2] - 15, 30, 30, {
      fill: P.row,
      stroke: P.ink,
      alpha: q,
      radius: 5,
      width: 2
    });
    check(C[k], R[2] + 1, 16, { alpha: q, width: 2.5 });
  });
  box(C[2] - 15, R[2] - 15, 30, 30, {
    stroke: P.muted,
    alpha: on(causeAt + 0.4, -0.05),
    radius: 5,
    width: 2,
    dash: [5, 4]
  });
  const lossAt = cue(s, "实质损失", "material loss"), lost = on(lossAt), spread = standard((voiceTime(t) - voiceTime(lossAt + 0.05)) / 0.8);
  dot(C[3], R[2], 5, { color: P.unknown, alpha: lost });
  [13, 22].forEach(
    (r, i) => ring(C[3], R[2], mix(5, r, spread), {
      color: P.unknown,
      alpha: lost * restMark(P.unknown, 1 - i * 0.35),
      width: 2
    })
  );
  const agents = cue(s, "交给智能体", "agents will repeat");
  agent(START, R[3], { alpha: on(agents), size: 0.9 });
  line(START + 30, R[3], END, R[3], {
    color: P.evidence,
    alpha: on(agents, 0.1) * 0.8,
    width: 2
  });
  C.forEach((x, k) => {
    const q = ramp(t, agents + 0.2 + 0.12 * k, 0.3) * four;
    box(x - 15, R[3] - 15, 30, 30, {
      fill: P.row,
      stroke: P.evidence,
      alpha: q,
      radius: 5,
      width: 2
    });
    dot(x, R[3], 4.5, { color: P.evidence, alpha: q });
  });
  const nameAts = [conds[0], unwritten, causeAt, agents];
  R.forEach(
    (y, i) => nameText(names[i], NX, y, {
      align: "left",
      width: 420,
      alpha: four * listIn(t, nameAts, i),
      set: "conditions"
    })
  );
  ctx.restore();
}
function s27Threshold(s, t, material, leave, X02, B, problem, s27Line, these, five) {
  ctx.save();
  ctx.translate(59, 0);
  const SX = 1e3, FX = 1660, held = soon(t, leave + 0.05, 1.2), before = cue(s, "还没出过事", "before anything fails");
  const bring = cue(s, "只要带来", "brings material risk"), named5 = ramp(t, these - 0.15, 0.4) * five;
  const ey = B - 46;
  problem(238, ey, 14, named5);
  diamond(284, ey, 13, { color: P.authority, alpha: named5, width: 2.5 });
  dot(330, ey, 3, { color: P.unknown, alpha: named5 });
  [8, 13].forEach(
    (r, i) => ring(330, ey, r, {
      color: P.unknown,
      alpha: named5 * restMark(P.unknown, 1 - i * 0.35),
      width: 2
    })
  );
  agent(376, ey, { alpha: named5, size: 0.55 });
  nameText(L("这些情况", "Any of these"), 307, B + 26, { valign: "top", alpha: named5 });
  const climb = (x) => 260 * ease(clamp((x - 320) / (FX - 360))), TY = B - climb(SX);
  const level = (x) => climb(SX) - 40 * ease(clamp((x - SX) / 240));
  const yAt = (x) => B - (x <= SX ? climb(x) : mix(climb(x), level(x), held));
  s27Line(yAt, five, { x1: FX - 40, y0: B, draw: { t, at: bring + 0.05 } });
  if (held > 0)
    path(
      Array.from({ length: 51 }, (_, k) => {
        const x = mix(SX, FX - 40, k / 50);
        return [x, B - climb(x)];
      }),
      { color: P.line, alpha: five * held, width: 2, dash: [6, 8] }
    );
  line(X02, TY, FX - 40, TY, {
    color: P.unknown,
    alpha: five * restMark(P.unknown, 0.8) * named(t, material),
    width: 2
  });
  nameText(L("实质风险", "Material risk"), X02, TY - NAME_GAP - 8, {
    align: "left",
    valign: "bottom",
    alpha: five * named(t, material)
  });
  const FY = B - climb(FX - 40);
  ring(FX, FY, 15, {
    color: P.unknown,
    alpha: five * named(t, before),
    width: 2.5,
    dash: [5, 5]
  });
  nameText(L("还没出过事", "Before anything fails"), FX + 12, FY - 12 - NAME_GAP, {
    align: "right",
    valign: "bottom",
    color: P.muted,
    alpha: five * named(t, before)
  });
  const sg = ramp(t, leave - 0.1, 0.4) * five;
  shield(SX, B + 110, 40, { color: P.evidence, alpha: sg, fillColor: P.row });
  check(SX, B + 112, 28, { color: P.evidence, alpha: sg, width: 3 });
  link(SX, B + 62, SX, yAt(SX) + 12, {
    color: P.evidence,
    alpha: sg,
    draw: { t, at: leave + 0.05 }
  });
  nameText(L("能复用的预防措施", "Reusable prevention"), SX, B + 150 + NAME_GAP, {
    valign: "top",
    color: P.evidence,
    alpha: five * named(t, leave)
  });
  ctx.restore();
}

// picture/film/scenes/p27/scene.js
scenes["27"] = function(s, t) {
  const changes = cue(s, "有些小变化", "small changes"), defects = cue(s, "工作体系有缺陷", "system defect");
  const signals = en ? cues(s, [
    ["", "definitions drifting"],
    ["", "questions recurring"],
    ["", "people stepping"],
    ["", "evidence expiring"],
    ["", "ownership blurring"],
    ["", "intermittent failures"],
    ["", "slight delays"]
  ]) : cues(s, [
    ["定义慢慢变了", ""],
    ["同样的问题", ""],
    ["临时靠人救火", ""],
    ["证据过期", ""],
    ["责任说不清", ""],
    ["偶尔出错", ""],
    ["略有延迟", ""]
  ]);
  const [anomaly, trend, pattern, impact, direction] = cues(s, [
    ["一次异常", "one anomaly"],
    ["看成趋势", "not a trend"],
    ["先看苗头的规律", "check the pattern"],
    ["影响", "impact"],
    ["走向", "direction"]
  ]);
  const [metric, weekly, signal] = cues(s, [
    ["同一个指标", "the same metric"],
    ["每周都有人问", "asks every week"],
    ["这就是一个苗头", "that is a signal"]
  ]);
  const conds = cues(s, [
    ["同类问题反复出现", "the same kind of problem recurs"],
    ["重要判断", "an important judgment rests"],
    ["交给智能体反复做", "agents will repeat"]
  ]);
  const [material, leave] = cues(s, [
    ["实质风险", "brings material risk"],
    ["留下能复用的预防措施", "leave reusable prevention"]
  ]);
  const forms = cues(s, [
    ["测试", "a test"],
    ["监控", "monitor"],
    ["清单", "checklist"],
    ["决策记录", "decision record"],
    ["更清楚的分工", "ownership and handoffs"]
  ]);
  const [improve, fresh, lightest] = cues(s, [
    ["先改已有的", "improve what exists"],
    ["再考虑新建", "creating something new"],
    ["选够用的最轻的那种", "choose the lightest form"]
  ]);
  const watch = cue(s, "留意这几种", "watch for these");
  const base = ramp(t, opening(s), 0.7), example = Math.min(metric, weekly);
  illustrative(ramp(t, pauseHold(example - 0.2, 0.4), 0.4) * stageOut(t, watch) * base);
  const X02 = 200, X12 = 1680, Y0 = 520, B = 556;
  const problem = (x, y, r, alpha) => {
    dot(x, y, r - 1, { color: P.ground, alpha });
    ring(x, y, r, { color: P.unknown, alpha, width: 2.5 });
    line(x, y - r * 0.5, x, y + r * 0.12, { color: P.unknown, alpha, width: 3 });
    dot(x, y + r * 0.45, 2.2, { color: P.unknown, alpha });
  };
  const s27Line = (yAt, alpha, { upto = 1, draw = null, x0 = X02, x1 = X12, y0 = Y0, axis = alpha } = {}) => {
    const pts = [];
    for (let x = x0; x <= x1; x += 6) pts.push([x, yAt(x)]);
    line(x0 - 12, y0 + 24, x0 - 12, y0 - 176, { color: P.muted, alpha: axis, width: 2 });
    for (let k = 0; k <= 2; k++)
      line(x0 - 12, y0 - k * 80, x0, y0 - k * 80, { color: P.muted, alpha: axis, width: 2 });
    path(pts, { color: P.ink, alpha, width: 3, upto, draw });
    return pts;
  };
  const one = base * stageOut(t, anomaly);
  if (one > 0) s27SmallSignals(t, changes, defects, signals, X02, X12, Y0, s27Line, one);
  const two = base * stageIn(t, anomaly) * stageOut(t, example);
  if (two > 0) s27Anomaly(t, anomaly, trend, pattern, impact, direction, Y0, s27Line, two);
  const three = base * stageIn(t, example) * stageOut(t, watch);
  if (three > 0) s27SameMetric(t, metric, weekly, signal, X02, Y0, s27Line, three);
  const these = cue(s, "这些情况", "when any of these"), four = base * stageIn(t, watch) * stageOut(t, these);
  if (four > 0) s27Conditions(s, t, conds, watch, problem, four);
  const kinds = cue(s, "预防措施可以是", "prevention can be"), five = base * stageIn(t, these) * stageOut(t, kinds);
  if (five > 0) s27Threshold(s, t, material, leave, X02, B, problem, s27Line, these, five);
  const six = base * stageIn(t, kinds) * stageOut(t, improve);
  if (six > 0) s27Forms(t, forms, kinds, six);
  const seven = base * stageIn(t, improve);
  if (seven > 0) s27OrderOfChoice(t, improve, fresh, lightest, seven);
};

// picture/film/scenes/p28/balance.js
function s28Balance(s, t, weights, risks, g3) {
  const R = 470, cx = L(930, 895), cy = 640, H = 70, B = 150;
  const theta = -0.02 * weights.reduce((a, at) => a + soon(t, at + 0.05, 0.5), 0) + 0.2 * soon(t, risks[0] + 0.05, 0.8);
  const lx = cx - R * Math.cos(theta), ly = cy - R * Math.sin(theta), rx = cx + R * Math.cos(theta), ry = cy + R * Math.sin(theta);
  stroke(
    () => {
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx - 50, cy + B);
      ctx.lineTo(cx + 50, cy + B);
      ctx.closePath();
    },
    { color: P.ink, alpha: g3, width: 3 }
  );
  line(cx - 120, cy + B, cx + 120, cy + B, { color: P.ink, alpha: g3, width: 3 });
  line(lx, ly, rx, ry, { color: P.ink, alpha: g3, width: 4 });
  dot(cx, cy, 7, { color: P.ink, alpha: g3 });
  stroke(
    () => [
      [lx, ly],
      [rx, ry]
    ].forEach(([x, y]) => {
      ctx.moveTo(x, y);
      ctx.lineTo(x, y - H);
    }),
    { color: P.ink, alpha: g3, width: 3 }
  );
  [
    [lx, ly, P.muted, 170],
    [rx, ry, P.unknown, 220]
  ].forEach(([x, y, color, w]) => {
    line(x - w, y - H, x + w, y - H, { color, alpha: g3, width: 4 });
    line(x - w, y - H, x - w, y - H - 12, { color, alpha: g3, width: 3 });
    line(x + w, y - H, x + w, y - H - 12, { color, alpha: g3, width: 3 });
  });
  const wNames = en ? ["Fluency", "Effort", "Agent efficiency"] : ["流畅", "努力", "智能体再高效"], em = labelSize(LABEL);
  const INSET = 16, wTops = stackTops(
    wNames.map(() => em),
    0,
    18
  ), wLeft = lx - 170 + INSET + 36, wBase = ly - H - 24 - (wTops[2] + em);
  wNames.forEach((v, i) => {
    const y = wBase + wTops[i] + em / 2;
    box(wLeft - 36, y - 9, 18, 18, {
      fill: P.muted,
      alpha: g3 * named(t, weights[i]),
      radius: 3
    });
    nameText(v, wLeft, y, { align: "left", alpha: g3 * listIn(t, weights, i), set: "qualities" });
  });
  const rows = en ? [
    [
      ["Fabricated, hidden or unverified facts"],
      [risks[0]],
      ["as established"],
      [cue(s, "", "presented as established")]
    ],
    [
      ["Completion claimed"],
      [risks[1]],
      ["currently unverified"],
      [cue(s, "", "without current verification")]
    ],
    [
      ["Agent output"],
      [risks[2]],
      ["as fact, authorization or responsibility"],
      [cue(s, "", "standing in for")]
    ]
  ] : [
    [["没核实的、编造的、挑过的事实"], [risks[0]], ["说成确定"], [cue(s, "说成确定", "")]],
    [["没核验当前版本"], [risks[1]], ["说完成"], [cue(s, "就说完成", "")]],
    [
      ["智能体的输出"],
      [risks[2]],
      ["充当事实或授权，", "或者让它替人负责"],
      [cue(s, "充当事实或授权", ""), cue(s, "或者让它替人负责", "")]
    ]
  ];
  const width = 520, slot = Math.max(
    ...rows.map(([term, , qual]) => termRowLayout(term, qual, width, false).height)
  ), heights = rows.map(() => slot);
  const tops = stackTops(heights, 0, L(16, 28)), rLeft = rx - 220 + INSET + 36, rBase = ry - H - 24 - (tops.at(-1) + heights.at(-1));
  nameText(L("有些风险", "Risks like these"), rx, ry + NAME_GAP, {
    valign: "top",
    size: NOTE,
    color: P.muted,
    alpha: g3 * named(t, cue(s, "有些风险", "risks like these"))
  });
  rows.forEach(([term, termAts, qual, qualAts], i) => {
    const top = rBase + tops[i], my = top + em / 2, lit = speaking(t, risks, i);
    box(rLeft - 36 - 2 * lit, my - 9 - 2 * lit, 18 + 4 * lit, 18 + 4 * lit, {
      fill: P.unknown,
      alpha: g3 * named(t, risks[i]),
      radius: 3
    });
    termRow(t, term, termAts, qual, qualAts, rLeft, top, {
      width,
      alpha: g3 * listLevel(t, risks, i),
      set: "risks",
      build: true,
      inline: false
    });
  });
}

// picture/film/scenes/p28/coaching.js
function s28RealWork(s, t, grows, boundary, g1) {
  const moments = cues(s, [
    ["开头", "at the start"],
    ["重要决定时", "at important decisions"],
    ["交付后", "after delivery"]
  ]);
  const acts = cues(s, [
    ["确认边界", "confirm the boundary"],
    ["查推理", "examine the reasoning"],
    ["挑一个最关键", "agree on one"],
    ["约好下次", "for the next task"]
  ]);
  const names = en ? [
    ["At the start", "Confirm boundary and success criteria"],
    ["At important decisions", ["Examine the reasoning"]],
    ["After delivery", ["Agree on one observable improvement"]],
    [null, "For the next task"]
  ] : [
    ["开头", "确认边界和成功标准"],
    ["重要决定时", "查推理"],
    ["交付后", "挑一个最关键的差距"],
    [null, "看得见的改进"]
  ];
  const half = ([moment, act]) => Math.max(
    moment ? measure(moment, NOTE) / 2 : 0,
    ...wrapName(act, 360).map((line2) => measure(line2) / 2)
  );
  const delta = en ? Math.max(
    0,
    half(names[1]) + Math.max(half(names[0]), half(names[2])) + 34 - (1495 - 70 - (200 - 20) - 48 - half(names[0]) - half(names[2])) / 2
  ) : 0;
  const Y = 570, UP = 370, X02 = L(220, 200 - delta), RISE2 = L(1300, 1495 + delta), X12 = 1700, rows = [Y, Y, Y, UP];
  const BX0 = X02 - 20, BX1 = RISE2 - 70, BC = (BX0 + BX1) / 2;
  const pitch = en ? (BX1 - BX0 - 48 - half(names[0]) - half(names[2])) / 2 : Math.min(BC - BX0 - half(names[0]), BX1 - BC - half(names[2])) - 24;
  const MC = en ? (BX0 + 24 + half(names[0]) + BX1 - 24 - half(names[2])) / 2 : BC, xs = [MC - pitch, MC, MC + pitch, L(1500, 1660)];
  const starts = acts.map((at2, i) => Math.min(at2, moments[i] ?? Infinity));
  link(X02, Y, X12, UP, {
    route: "hvh",
    mid: RISE2,
    color: P.muted,
    width: 3,
    alpha: g1 * ramp(t, grows - 0.1, 0.6),
    end: false
  });
  box(BX0, Y - 80, BX1 - BX0, 96, { stroke: P.line, alpha: g1 * named(t, boundary), radius: 12 });
  nameText(L("真实的工作", "Real work"), X02 - 20, Y - 80 - NAME_GAP, {
    align: "left",
    valign: "bottom",
    alpha: g1 * named(t, cue(s, "真实的工作", "grows through real work"))
  });
  link(RISE2, Y, RISE2, UP, {
    color: P.evidence,
    width: 4,
    alpha: g1 * named(t, acts[2]),
    draw: { t, at: acts[2] + 0.05 },
    end: false
  });
  xs.forEach((x, i) => {
    const y = rows[i], lit = speaking(t, starts, i), on = named(t, starts[i]);
    const color = [P.evidence, P.authority, P.ink, P.evidence][i];
    dot(x, y, 9, { color, alpha: g1 * on });
    if (lit > 0) ring(x, y, 17, { color, alpha: g1 * lit * restMark(color, 0.6), width: 2 });
    const level = g1 * listLevel(t, starts, i);
    let top = y + NAME_GAP + 18;
    if (names[i][0])
      top = nameText(names[i][0], x, top, {
        valign: "top",
        size: NOTE,
        color: P.muted,
        alpha: level * named(t, moments[i]),
        set: "stations"
      }).bottom + 20;
    nameText(names[i][1], x, top, {
      valign: "top",
      width: 360,
      alpha: level * named(t, acts[i]),
      set: "stations"
    });
  });
  const walk = [BX0 + 44, ...xs.slice(0, 3).map((x) => x - 56)].reduce(
    (x, to, k, all) => k ? mix(x, to, glide(t, starts[k - 1] + 0.05, to - all[k - 1])) : to,
    0
  );
  const climbWay = [
    [xs[2] - 56, Y],
    [RISE2, Y],
    [RISE2, UP],
    [xs[3] - 56, UP]
  ];
  const climb = glide(t, starts[3] + 0.05, lengthOf(climbWay)), at = along(climbWay, climb).point;
  const px = climb > 0 ? at[0] : walk, py = (climb > 0 ? at[1] : Y) - 30;
  person(px, py, { alpha: g1, size: 1.2 });
}
function s28Coaching(s, t, coaching, notJudge, weak, noDirection, fb, g2) {
  const judgmentAt = cue(s, "判断", "judgment"), SH = mix(L(25, 30), L(25, 0), soon(t, judgmentAt + 0.05, 0.6));
  const R = 550, MX = 290 + SH, CY = 350, JX = 1640 + SH, reasoning = cue(s, "成员的推理", "a member's reasoning"), rail = ramp(t, reasoning - 0.15, 0.4);
  const names = en ? ["Proposition", "Evidence", "Behavior", "Consequence"] : ["说法", "证据", "行为", "后果"];
  const xs = railStations(names, 640 + SH, 1340 + SH);
  person(MX, R - 4, { alpha: g2 * named(t, reasoning), size: 1.1 });
  link(MX + 16, R, JX - 40, R, { color: P.muted, width: 3, alpha: g2 * rail, end: false });
  nameText(L("成员的推理", "A member's reasoning"), MX + 40, R - 40, {
    align: "left",
    valign: "bottom",
    alpha: g2 * named(t, reasoning)
  });
  diamond(JX, R, 24, { color: P.ink, alpha: g2 * named(t, judgmentAt), solid: true });
  nameText(L("判断", "Their judgment"), JX, R + NAME_GAP + 18, {
    valign: "top",
    alpha: g2 * named(t, judgmentAt)
  });
  person(MX, CY, { alpha: g2, size: 1.1, color: P.authority });
  nameText(L("辅导", "Coaching"), MX - 34, CY - 8, {
    align: "right",
    color: P.authority,
    alpha: g2 * named(t, coaching)
  });
  const scan = 3 * glide(t, reasoning + 0.2, 3 * Math.abs(xs[1] - xs[0])), k = Math.min(2, Math.floor(scan));
  ring(mix(xs[k], xs[k + 1], scan - k), R, 22, {
    color: P.authority,
    width: 2.5,
    alpha: g2 * ramp(t, reasoning + 0.05, 0.3) * (1 - ramp(t, notJudge + 0.05, 0.4))
  });
  link(MX + 40, CY, JX, R - 86, {
    route: "hv",
    color: P.authority,
    width: 2.5,
    alpha: g2 * named(t, notJudge),
    draw: { t, at: notJudge - 0.05 },
    end: false
  });
  line(JX - 24, R - 78, JX + 24, R - 78, {
    color: P.unknown,
    alpha: g2 * ramp(t, notJudge + 0.55, 0.3),
    width: 4
  });
  nameText(L("不是替他们判断", "Without judging for them"), (MX + 40 + JX) / 2, CY - NAME_GAP, {
    valign: "bottom",
    color: P.authority,
    alpha: g2 * named(t, notJudge)
  });
  xs.forEach((x, i) => {
    const lit = speaking(t, fb, i);
    dot(x, R, 9, { color: P.evidence, alpha: g2 * named(t, fb[i]) });
    if (lit > 0)
      ring(x, R, 17, {
        color: P.evidence,
        alpha: g2 * lit * restMark(P.evidence, 0.6),
        width: 2
      });
  });
  railNames(names, xs, R, {
    alpha: (i) => g2 * listIn(t, fb, i),
    color: () => P.evidence,
    set: "feedback"
  });
  nameText(
    L("反馈要指出", "Feedback names"),
    xs[0] - measure(names[0], LABEL) / 2 - 34,
    R + NAME_GAP + 18 + labelSize(LABEL) / 2,
    {
      align: "right",
      size: NOTE,
      color: P.muted,
      alpha: g2 * named(t, cue(s, "反馈要指出", "feedback names"))
    }
  );
  rejectedName(L("“逻辑弱”", "“Weak logic”"), (xs[0] + xs[3]) / 2, R + 200, {
    alpha: g2 * named(t, weak),
    mark: ramp(t, noDirection - 0.1, 0.4)
  });
}

// picture/film/scenes/p28/score.js
function s28Score(s, t, score, deliveryRisk, noLabel, metric, decision, gamed, anomaly, cases, mechanisms, g4) {
  const d1 = g4 * stageOut(t, metric);
  if (d1 > 0) {
    const DX = 580, DY = 330, DW = 240, DH = 230, gx = DX + DW / 2, gy = DY + 205, gr = 74, PX = DX + 720, PY = 480;
    documentIcon(DX, DY, DW, DH, { alpha: d1, rows: 1 });
    fill(() => ctx.arc(gx, gy, gr + 14, Math.PI, Math.PI * 2), { color: P.row, alpha: d1 });
    stroke(() => ctx.arc(gx, gy, gr, Math.PI, Math.PI * 2), {
      color: P.line,
      alpha: d1,
      width: 9,
      cap: "butt"
    });
    const read = ramp(t, deliveryRisk - 0.05, 0.8);
    if (read > 0)
      stroke(() => ctx.arc(gx, gy, gr, Math.PI, Math.PI * mix(1.001, 1.62, read)), {
        color: P.authority,
        alpha: d1,
        width: 9,
        cap: "butt"
      });
    const a = Math.PI * mix(1.04, 1.62, ramp(t, score + 0.1, 0.9));
    line(gx, gy, gx + Math.cos(a) * gr * 0.78, gy + Math.sin(a) * gr * 0.78, {
      color: P.ink,
      alpha: d1,
      width: 3
    });
    nameText(L("打分", "The score"), gx, DY - NAME_GAP, {
      valign: "bottom",
      alpha: d1 * named(t, score)
    });
    nameText(L("交付风险", "Delivery risk"), gx, DY + DH + NAME_GAP, {
      valign: "top",
      color: P.authority,
      alpha: d1 * named(t, cue(s, "分数说的是", "expresses"))
    });
    person(PX, PY, { alpha: d1, size: 1.6 });
    const go = soon(t, noLabel - 0.05, 0.7), BX = (DX + DW + PX) / 2 - 15;
    link(DX + DW + 30, PY, BX, PY, {
      color: P.unknown,
      alpha: d1 * named(t, noLabel),
      upto: go,
      end: false,
      dash: [8, 8]
    });
    line(BX, PY - 34, BX, PY + 34, {
      color: P.unknown,
      alpha: d1 * ramp(t, noLabel + 0.55, 0.3),
      width: 4
    });
    rejectedName(L("给人贴标签", "Label a person"), BX, PY + 34 + NAME_GAP, {
      valign: "top",
      alpha: d1 * named(t, noLabel),
      mark: ramp(t, noLabel + 0.55, 0.3)
    });
  }
  const d2 = g4 * stageIn(t, metric);
  if (d2 > 0) {
    const X02 = 460, X12 = 1180, Y = 470, yAt = (x) => Y - 22 * Math.sin((x - X02) / 64) - 9 * Math.sin((x - X02) / 21), YE = yAt(X12);
    const DX = 1500, factParts = L(["事实依据", "、周期", "、边界"], ["Fact source", ", period", ", boundary"]);
    const underDX = Math.max(
      ...wrapName(L("支持哪个决定", ""), 300).map((v) => measure(v)),
      measure(L("", "a metric supports")),
      measure(factParts.join(""))
    );
    ctx.save();
    ctx.translate(960 - (X02 - NAME_GAP - measure(L("指标", "Metric")) + DX + underDX / 2) / 2, 0);
    const pts = [];
    for (let x = X02; x <= X12; x += 8) pts.push([x, yAt(x)]);
    path(pts, { color: P.line, alpha: d2, width: 3 });
    path(pts, { color: P.evidence, alpha: d2, width: 3, draw: { t, at: metric + STAGE_CUT } });
    nameText(L("指标", "Metric"), X02 - NAME_GAP, yAt(X02), {
      align: "right",
      color: P.evidence,
      alpha: d2 * named(t, metric)
    });
    const ask = cue(s, "先明确它", "first identify what decision"), dm = named(t, ask), dc = named(t, decision);
    link(X12 + 16, YE, DX - 40, YE, {
      color: P.authority,
      alpha: d2 * dm,
      draw: { t, at: ask - 0.05 }
    });
    diamond(DX, YE, 22, { color: P.authority, alpha: d2 * dc, solid: true });
    const decisionName = nameText(
      L("支持哪个决定", ["What decision", "a metric supports"]),
      DX,
      YE + 30 + NAME_GAP,
      { valign: "top", width: 300, color: P.authority, alpha: d2 * dc }
    );
    const factAt = cue(s, "事实依据", "fact source"), firstAts = [
      factAt,
      cueFrom(s, "周期", "period", factAt),
      cueFrom(s, "边界", "boundary", factAt)
    ];
    growName(t, factParts, firstAts, DX, decisionName.bottom + NAME_GAP, {
      valign: "top",
      align: "center",
      width: L(300, 420),
      alpha: d2,
      build: true
    });
    const gm = named(t, gamed), lift = soon(t, gamed - 0.05, 0.9), G0 = 980, gpts = [];
    for (let x = G0; x <= X12; x += 8)
      gpts.push([x, yAt(x) - 130 * lift * ease((x - G0) / (X12 - G0))]);
    path(gpts, { color: P.unknown, alpha: d2 * gm, width: 2.5, dash: [7, 7] });
    nameText(
      L("怎样被钻空子", "How it could be gamed"),
      (G0 + X12) / 2 + 40,
      yAt(X12) - 130 - NAME_GAP,
      { valign: "bottom", color: P.muted, alpha: d2 * gm }
    );
    const AX = 700, ay = yAt(AX), an = named(t, anomaly), spike = soon(t, anomaly - 0.05, 0.5);
    line(AX, ay - 6, AX, ay - 6 - 84 * spike, { color: P.unknown, alpha: d2 * an, width: 2 });
    dot(AX, ay - 6 - 84 * spike, 9, { color: P.unknown, alpha: d2 * an });
    nameText(L("异常", "Anomaly"), AX, ay - 100 - NAME_GAP, { valign: "bottom", alpha: d2 * an });
    const xs = [AX - 150, AX + 150], LY = 690, ats = [cases, mechanisms];
    xs.forEach((x, i) => {
      const q = named(t, ats[i]);
      link(AX, ay + 14, x, LY - 48, {
        route: "vhv",
        mid: (ay + LY) / 2,
        alpha: d2 * q,
        draw: { t, at: ats[i] - 0.05 }
      });
      if (!i) documentIcon(x - 22, LY - 28, 44, 56, { alpha: d2 * q, rows: 3 });
      else {
        for (let k = 0; k < 8; k++) {
          const a = k * Math.PI / 4 + voiceTime(t) * 0.4;
          line(
            x + Math.cos(a) * 17,
            LY + Math.sin(a) * 17,
            x + Math.cos(a) * 26,
            LY + Math.sin(a) * 26,
            { color: P.ink, alpha: d2 * q, width: 6, cap: "butt" }
          );
        }
        ring(x, LY, 17, { color: P.ink, alpha: d2 * q, width: 4 });
      }
    });
    railNames(en ? ["Cases", "Mechanisms"] : ["案例", "机制"], xs, LY + 40, {
      gap: NAME_GAP,
      alpha: (i) => d2 * listIn(t, ats, i),
      set: "through"
    });
    ctx.restore();
  }
}
function s28Escalation(s, t, g5) {
  const [sigAt, upAt] = cues(s, [
    ["高风险的苗头", "high-risk signals"],
    ["随时上报", "at once"]
  ]), escAt = en ? cue(s, "", "escalate high-risk") : upAt;
  const sigName = L("高风险的苗头", "High-risk signals"), upName = en ? ["Escalate", " at once"] : ["随时上报"];
  const R = 22, RUN = 720, RISE2 = 180, BASE = 660, wide = Math.max(measure(sigName), measure(upName.join("")));
  const X02 = 960 - (RUN + R + NAME_GAP + wide) / 2, SX = X02 + RUN, SY = BASE - RISE2 - R, PY = 270;
  const course = [];
  for (let x = X02; x <= SX + 0.5; x += 8)
    course.push([Math.min(x, SX), BASE - RISE2 * ease(clamp((x - (SX - 320)) / 320))]);
  path(course, { color: P.line, alpha: g5, width: 3 });
  const sq = ramp(t, sigAt - 0.15, 0.4) * g5;
  path(
    course.filter(([x]) => x >= SX - 320),
    { color: P.unknown, alpha: sq, width: 3 }
  );
  ring(SX, SY, R, { color: P.unknown, alpha: sq, width: 3 });
  line(SX, SY - 11, SX, SY + 3, { color: P.unknown, alpha: sq, width: 4 });
  dot(SX, SY + 10, 3, { color: P.unknown, alpha: sq });
  nameText(sigName, SX + R + NAME_GAP, SY, { align: "left", alpha: g5 * named(t, sigAt) });
  const wayAt = en ? upAt - 0.3 : upAt - 0.05;
  link(SX, SY - R - 8, SX, PY + 44, {
    color: P.unknown,
    alpha: g5 * ramp(t, wayAt - 0.05, 0.4),
    draw: { t, at: wayAt },
    width: 2.5
  });
  person(SX, PY, { color: P.authority, alpha: g5 * named(t, escAt), size: 1.4 });
  growName(t, upName, en ? [escAt, upAt] : [upAt], SX + R + NAME_GAP, PY - 8, {
    valign: "middle",
    color: P.authority,
    alpha: g5
  });
}

// picture/film/scenes/p28/scene.js
scenes["28"] = function(s, t) {
  const [grows, boundary] = cues(s, [
    ["能力在真实的工作里成长", "capability grows"],
    ["边界和成功标准", "the boundary and success"]
  ]);
  const [coaching, notJudge, weak, noDirection] = cues(s, [
    ["辅导是检验成员的推理", "coaching tests"],
    ["不是替他们判断", "without making the judgment"],
    ["逻辑弱", "weak logic"],
    ["给不出方向", "gives no direction"]
  ]);
  const fb = cues(s, [
    ["说法", "proposition"],
    ["证据", "evidence"],
    ["行为", "behavior"],
    ["后果", "consequence"]
  ]);
  const someRisks = cue(s, "有些风险", "fluency effort");
  const weights = cues(s, [
    ["再流畅", "fluency"],
    ["再努力", "effort"],
    ["智能体再高效", "agent efficiency"]
  ]);
  const risks = cues(s, [
    ["没核实的", "fabricated"],
    ["没核验当前版本", "completion claimed"],
    ["智能体的输出", "agent output"]
  ]);
  const [score, deliveryRisk, noLabel, metric, decision, gamed, anomaly, cases, mechanisms] = cues(
    s,
    [
      ["如果给工作打分", "if work is scored"],
      ["交付风险", "delivery risk"],
      ["不能给人贴标签", "never label a person"],
      ["看指标", "first identify what decision"],
      ["支持哪个决定", "first identify what decision"],
      ["钻空子", "could be gamed"],
      ["出了异常", "investigate anomalies"],
      ["案例", "cases"],
      ["机制", "and mechanisms"]
    ]
  );
  const signalCut = cue(s, "高风险的苗头", "escalate high-risk");
  const base = ramp(t, opening(s), 0.7);
  const g1 = base * stageOut(t, coaching);
  if (g1 > 0) s28RealWork(s, t, grows, boundary, g1);
  const g2 = base * stageIn(t, coaching) * stageOut(t, someRisks);
  if (g2 > 0) s28Coaching(s, t, coaching, notJudge, weak, noDirection, fb, g2);
  const g3 = base * stageIn(t, someRisks) * stageOut(t, score);
  if (g3 > 0) s28Balance(s, t, weights, risks, g3);
  const g4 = base * stageIn(t, score) * stageOut(t, signalCut);
  if (g4 > 0)
    s28Score(
      s,
      t,
      score,
      deliveryRisk,
      noLabel,
      metric,
      decision,
      gamed,
      anomaly,
      cases,
      mechanisms,
      g4
    );
  const g5 = base * stageIn(t, signalCut);
  if (g5 > 0) s28Escalation(s, t, g5);
};

// picture/film/scenes/p29/incident.js
function s29Containment(s, t, kinds, emergency, finder, contain, tell, six) {
  const KY = 470, M = 160, PAD = 30, py = KY + 26 - 29, NY6 = KY + 26 + NAME_GAP;
  const held6 = ramp(t, contain - 0.15, 0.4), place = ramp(t, kinds[0] - 0.1, 0.5) * six;
  const names = en ? ["Data error", "Production failure", ["Permission or compliance breach"]] : ["数据出错", "生产故障", "越权、违规"];
  const finderName = L("发现的人", "Whoever finds it"), FW6 = 280, half = (v, w) => Math.max(...wrapName(v, w).map((line2) => measure(line2))) / 2;
  const ownerName = L("数据或生产负责人", "Data or production owner"), M3 = L(M, half(names[2], 300) + 44), row6 = L(0, RAIL_ROW);
  const widenFrom = (at, d) => at - 0.15 - 0.85 * glideTime(d);
  const FL0 = 2 * 710 - 980 - half(finderName, FW6) - (M3 - half(names[2], 300));
  const left0 = mix(710 - M, FL0, glide(t, widenFrom(finder, 710 - M - FL0), 710 - M - FL0));
  const right0 = mix(
    mix(710 + M, 980 + M, glide(t, widenFrom(kinds[1], 270), 270)),
    1250 + M3,
    glide(t, widenFrom(kinds[2], 1250 + M3 - 980 - M), 1250 + M3 - 980 - M)
  );
  const owner0 = L(1570, 1250 + M3 + 30 + half(ownerName, 340));
  const shift0 = 960 - (left0 + right0) / 2, shift1 = L(-30, 960 - (FL0 + owner0 + half(ownerName, 340)) / 2), shift = mix(shift0, shift1, glide(t, tell - L(0.1, 0.8), shift1 - shift0));
  const kxs = [710, 980, 1250].map((x) => x + shift), px = 2 * kxs[0] - kxs[1], ox = owner0 + shift;
  const lines6 = Math.max(
    ...names.map((v) => wrapName(v, 300).length),
    wrapName(finderName, FW6).length
  );
  const fy = py - 15 * 1.2 * 2.15 - PAD, fh = NY6 + blockHeight(lines6) + row6 + PAD - fy;
  const left = left0 + shift, right = right0 + shift, FC = (left + right) / 2;
  {
    const emergencyName = L("紧急情况下", "Emergency"), ex = FC - measure(emergencyName) / 2, eq = named(t, emergency) * six;
    const ey = fy - NAME_GAP - labelSize(LABEL) / 2 - labelSize(LABEL) * LEADING;
    clock(ex - NAME_GAP - 18, ey, 18, {
      hand: voiceTime(t) * 0.6 % 1,
      color: P.unknown,
      alpha: eq
    });
    nameText(emergencyName, FC, ey, { alpha: eq });
  }
  box(left, fy, right - left, fh, { stroke: P.line, alpha: place, radius: 20, width: 3.5 });
  nameText(L("在自己权限内控制影响", "Contains it within their authority"), FC, fy - NAME_GAP, {
    valign: "bottom",
    color: P.authority,
    alpha: six * named(t, contain)
  });
  const threat = cue(s, "威胁到", "threatens");
  const condition = en ? ["Threatens data, production,", "downstream use or compliance"] : ["威胁到数据、生产、", "下游或合规"];
  const conditionAts = [threat, cueFrom(s, "下游或合规", "downstream use", threat)], space = en ? measure(" ", NOTE) : 0;
  const headW = measure(condition[0], NOTE) + space, conditionX = FC - (headW + measure(condition[1], NOTE)) / 2;
  const conditionBottom = Math.max(
    ...condition.map(
      (v, k) => nameText(v, conditionX + k * headW, fy + fh + NAME_GAP, {
        align: "left",
        valign: "top",
        size: NOTE,
        color: P.muted,
        alpha: six * named(t, conditionAts[k])
      }).bottom
    )
  );
  kinds.forEach((at, i) => {
    const kx = kxs[i], q = ramp(t, at - 0.15, 0.4) * six, lit = speaking(t, kinds, i), tone = blend(P.unknown, P.evidence, held6);
    dot(kx, KY, 8 + 2 * lit, { color: P.unknown, alpha: q });
    ring(kx, KY, 26, { color: tone, alpha: q, width: 3 });
    const wave = (voiceTime(Math.min(t, contain - 0.15)) * 0.8 + i / 3) % 1, swell = clamp(wave / 0.15);
    ring(kx, KY, 26 + 24 * wave, {
      color: P.unknown,
      alpha: q * swell * (1 - wave) * 0.7 * (1 - held6),
      width: 2 * swell
    });
    const lower = en && i !== 1;
    if (lower) line(kx, KY + 32, kx, NY6 + row6 - 6, { alpha: q, width: 2 });
    nameText(names[i], kx, NY6 + (lower ? row6 : 0), {
      valign: "top",
      width: 300,
      alpha: six * listIn(t, kinds, i),
      set: "kinds"
    });
  });
  const fd = ramp(t, finder - 0.15, 0.4) * six;
  person(px, py, { alpha: fd, size: 1.2 });
  const finderBlock = nameText(finderName, px, NY6, {
    valign: "top",
    width: FW6,
    alpha: six * named(t, finder)
  });
  const ow = ramp(t, tell - 0.15, 0.4) * six;
  person(ox, py, { alpha: ow, color: P.authority, size: 1.2 });
  const ownerBlock = nameText(ownerName, ox, NY6, {
    valign: "top",
    width: 340,
    color: P.authority,
    alpha: six * named(t, tell)
  });
  const lowY = conditionBottom + 18;
  link(px, finderBlock.bottom + 12, ox, ownerBlock.bottom + 12, {
    route: "vhv",
    mid: lowY,
    alpha: ow,
    width: 2.5
  });
}
function s29Response(s, t, ownerLeads, seven) {
  const [keep, impact] = cues(s, [
    ["保留查明影响", "preserves the inputs"],
    ["查明影响", "establish the impact"]
  ]);
  const [needAt, escAt] = cues(s, [
    ["需要更多权限时", "for any further permission"],
    ["上报决策负责人", "escalate"]
  ]);
  const kept = en ? keep : cue(s, "输入和版本", "");
  const OPEN = L(90, 100), wide = OPEN * soon(t, escAt - 0.1, 0.8);
  const lower = en ? 30 : 0, ox = 960 + wide, oy = 360 + lower, sy = 525 + lower, by = 610 + lower, xs = [640 + wide, 1280 + wide], ly = 730 + lower;
  person(ox, oy, { alpha: seven, color: P.authority, size: 1.3 });
  const [role, roleAts] = en ? [
    ["Owner of the affected work", " sees the response through"],
    [ownerLeads, cue(s, "", "sees the response through")]
  ] : [
    ["受影响工作的负责人", "接手"],
    [ownerLeads, cue(s, "接手应对", "")]
  ];
  growName(t, role, roleAts, ox + 60, oy - 6, {
    width: 520,
    valign: "middle",
    color: P.authority,
    alpha: seven
  });
  const hit = seven * ramp(t, ownerLeads + STAGE_CUT, 0.3), WX = 700 + wide, WY = 440 + lower, workNameY = WY + 60 + NAME_GAP + labelSize(LABEL) / 2;
  s23Page(WX - 50, WY - 60, 100, 120, { alpha: hit, rows: 3 });
  link(ox - 32, oy + 44, WX + 58, WY, {
    route: "vh",
    color: P.authority,
    alpha: hit,
    draw: { t, at: roleAts[1] + 0.05 },
    width: 2.5
  });
  nameText(L("受影响工作", "The affected work"), WX, WY + 60 + NAME_GAP, {
    valign: "top",
    alpha: hit
  });
  ring(WX + 50, WY - 60, 14, { color: P.unknown, alpha: hit, width: 2.5 });
  dot(WX + 50, WY - 60, 5, { color: P.unknown, alpha: hit });
  const kp = ramp(t, kept - 0.15, 0.4) * seven;
  link(ox, oy + 62, ox, en ? sy - 60 : sy + 42, {
    alpha: seven * ramp(t, keep - 0.15, 0.2),
    draw: { t, at: keep - 0.15 },
    end: false
  });
  [2, 1, 0].forEach(
    (k) => box(ox - 60 + k * 12, sy - 46 - k * 12, 104, 76, {
      fill: P.row,
      stroke: k ? P.line : P.ink,
      alpha: kp,
      radius: 6
    })
  );
  [0, 1, 2].forEach(
    (k) => line(ox - 44, sy - 22 + k * 16, ox + 22 - k * 14, sy - 22 + k * 16, {
      color: P.evidence,
      alpha: kp,
      width: 3
    })
  );
  nameText(L("输入和版本", "Inputs and versions kept"), ox + 68 + NAME_GAP + 12, workNameY, {
    align: "left",
    alpha: seven * named(t, kept)
  });
  const uses = [impact, cue(s, "核验修正", "verify a correction")], names = en ? ["Establish the impact", "Verify a correction"] : ["查明影响", "核验修正"];
  uses.forEach((at, i) => {
    const q = ramp(t, at - 0.15, 0.4) * seven, x = xs[i];
    link(ox, sy + 42, x, ly - 34, {
      route: "vhv",
      mid: by + 40,
      r: 18,
      alpha: seven * ramp(t, at - 0.15, 0.2),
      draw: { t, at: at - 0.15 },
      end: false
    });
    if (i === 0)
      [0, 1, 2].forEach(
        (k) => ring(x, ly, 8 + k * 9, {
          color: P.unknown,
          alpha: q * mix(1, restMark(P.unknown), k / 2),
          width: 2
        })
      );
    else check(x, ly + 2, 26, { color: P.evidence, alpha: q, draw: { t, at: at - 0.05 } });
  });
  railNames(names, xs, ly + 8, {
    wrap: 400,
    alpha: (i) => seven * listIn(t, uses, i),
    set: "uses"
  });
  const DX = 420 + OPEN, up = ramp(t, escAt - 0.15, 0.4) * seven;
  person(DX, oy, { alpha: up, color: P.authority, size: 1.1 });
  nameText(L("决策负责人", "Decision owner"), DX, oy + 44 + NAME_GAP, {
    valign: "top",
    color: P.authority,
    alpha: seven * named(t, escAt)
  });
  link(ox - 52, oy - 10, DX + 60, oy - 10, {
    color: P.authority,
    alpha: up,
    draw: { t, at: escAt - 0.05 },
    width: 2.5
  });
  nameText(
    L("需要更多权限时", "For any further permission"),
    (960 + OPEN - 52 + DX + 60) / 2,
    oy - 10 - NAME_GAP,
    { valign: "bottom", width: 380, color: P.authority, alpha: seven * named(t, needAt) }
  );
}

// picture/film/scenes/p29/judgment.js
function s29Demonstration(s, t, demo, misuse, four) {
  const names = en ? ["Retrospective fault-finding", "Ceremonial review", "Micromanagement"] : ["事后挑错", "走过场", "微观管理"];
  const wider = en ? Math.max(0, measure(names[0]) - Math.max(measure(names[1]), measure(names[2]))) / 2 : 0;
  const pair = L(-52, -112 - wider), shift = mix(
    L(178, 184),
    pair,
    glide(t, cue(s, "不拿这份指南", "never use") - 0.1, L(178, 184) - pair)
  );
  const dx = 750 + shift, dy = 300, dw = 250, dh = 310, px = 610 + shift, py = dy + dh - 40;
  person(px, py, { alpha: four, color: P.authority, size: 1.2 });
  documentIcon(dx, dy, dw, dh, { alpha: four, rows: 6 });
  line(dx + 30, dy + 40, dx + 200, dy + 40, { color: P.ink, alpha: four, width: 4 });
  const judge = clamp((voiceTime(t) - voiceTime(demo + 0.05)) / 2.2);
  [0, 1, 2].forEach(
    (k) => line(
      dx + 36,
      dy + 100 + k * 60,
      mix(dx + 36, dx + dw - 50 - k * 30, clamp(judge * 3.4 - k)),
      dy + 100 + k * 60,
      { color: P.authority, alpha: four, width: 4 }
    )
  );
  check(dx + dw - 40, dy + 54, 30, {
    color: P.authority,
    alpha: four,
    upto: clamp((judge - 0.8) * 5)
  });
  nameText(L("管理者", "Managers"), px, dy + dh + NAME_GAP, {
    valign: "top",
    color: P.authority,
    alpha: four
  });
  nameText(L("示范怎样判断", "Show how to judge"), dx + dw / 2, dy + dh + NAME_GAP, {
    valign: "top",
    width: 300,
    alpha: four * named(t, demo)
  });
  const LX = 1300 + pair;
  const tops = stackTops(
    names.map(() => blockHeight(1)),
    dy + dh / 2,
    64
  ), markLeft = en ? null : LX + Math.max(...names.map((v) => measure(v))) + 16;
  misuse.forEach((at, i) => {
    const my = tops[i] + labelSize(LABEL) / 2, q = ramp(t, at - 0.15, 0.4) * four, lit = speaking(t, misuse, i);
    dot(LX - 40, my, 6 + 2 * lit, { color: P.unknown, alpha: q });
    const level = markLevel(P.unknown, listLevel(t, misuse, i));
    rejectedName(names[i], LX, my, {
      align: "left",
      alpha: four * ramp(t, at - 0.15, 0.4) * level,
      mark: ramp(t, at + 0.05, 0.3),
      set: "misuse",
      markLeft
    });
  });
}
function s29Closest(t, within, closest, paths, boundCut, five) {
  const fw = mix(700, 980, glide(t, paths[0] - 0.55, 140)), fx = 960 - fw / 2, fy = 375, fh = 250, my = fy + fh / 2, px = fx + 480, sx = fx + 800;
  const edge = rounded(
    [
      [fx, fy + fh / 2],
      [fx, fy],
      [fx + fw, fy],
      [fx + fw, fy + fh],
      [fx, fy + fh],
      [fx, fy + fh / 2]
    ],
    22
  );
  box(fx, fy, fw, fh, { fill: P.row, alpha: five, radius: 22 });
  path(edge, {
    color: P.authority,
    alpha: five,
    width: 2,
    draw: { t, at: boundCut + STAGE_CUT, least: 1.2 }
  });
  nameText(L("在边界之内", "Stated boundaries"), fx, fy - NAME_GAP, {
    align: "left",
    valign: "bottom",
    color: P.authority,
    alpha: five * named(t, within)
  });
  const cl = five, DX = fx + 60;
  documentIcon(DX, my - 64, 84, 108, { alpha: cl, rows: 3, stroke: P.evidence });
  person(px, my + 2, { alpha: cl, size: 1.3 });
  const closestY = my + 44 + NAME_GAP + labelSize(LABEL) / 2, D = closestY - my;
  nameText(L("离事实最近的负责人", "Closest to the facts"), px, closestY, {
    width: 330,
    alpha: five * named(t, closest)
  });
  const ys = [my - D, my, my + D], names = en ? ["Method", "Tools", "Path"] : ["方法", "工具", "实施路径"];
  paths.forEach((at, i) => {
    const q = ramp(t, at - 0.15, 0.4) * five, lit = speaking(t, paths, i);
    link(px + 48, my, sx - 20, ys[i], {
      route: "hvh",
      mid: fx + 660,
      r: 18,
      alpha: five,
      draw: { t, at: at - 0.15 },
      end: false
    });
    dot(sx, ys[i], 8 + 2 * lit, { color: P.evidence, alpha: q });
    nameText(names[i], sx + 13 + NAME_GAP, ys[i], {
      align: "left",
      alpha: five * listIn(t, paths, i),
      set: "paths"
    });
  });
}

// picture/film/scenes/p29/managers.js
function s29Managers(s, t, managers, clarify, conflicts, stalled, protect, one) {
  const MX = L(325, 300), TX = L(475, 450), RA = 375, RB = 665, MY = (RA + RB) / 2, place = ramp(t, opening(s) + 0.1, 0.6) * one;
  const namesA = en ? ["Direction", "Priorities", "Decision boundaries", "Resources"] : ["方向", "优先级", "决定的边界", "资源"];
  const namesB = en ? ["Cross-domain conflicts", "Stalled decisions", ["Those who expose problems"]] : ["跨领域的冲突", "久拖不决的事项", "暴露问题的人"];
  const xa = railStations(namesA, L(645, 620), L(1565, 1620), { wrap: 300 }), xb = xa.slice(0, namesB.length);
  const duties = [...clarify, conflicts, stalled, protect];
  person(MX, MY - 24, {
    alpha: one * ramp(t, managers - 0.2, 0.5),
    color: P.authority,
    size: 1.3
  });
  nameText(L("管理者", "Managers"), MX, MY + NAME_GAP + 18, {
    valign: "top",
    color: P.authority,
    alpha: one * named(t, managers)
  });
  [
    [xa, RA, 0, place],
    [xb, RB, 4, named(t, conflicts) * one]
  ].forEach(([xs, ry, k0, rail]) => {
    link(MX + 56, MY, xs.at(-1), ry, {
      route: "hvh",
      mid: TX,
      alpha: rail,
      width: 3,
      end: false
    });
    xs.forEach((x, j) => {
      const q = ramp(t, duties[k0 + j] - 0.15, 0.4) * one, lit = speaking(t, duties, k0 + j);
      dot(x, ry, 8, { color: P.ground, alpha: q });
      dot(x, ry, 8, { color: P.authority, alpha: q });
      if (lit > 0)
        ring(x, ry, 17, {
          color: P.authority,
          alpha: lit * restMark(P.authority, 0.5) * one,
          width: 2
        });
    });
  });
  clarify.forEach((at, i) => {
    const x = xa[i], y = RA - 96, q = ramp(t, at - 0.15, 0.4) * one;
    if (i === 0) {
      ring(x, y, 32, { color: P.authority, alpha: q, width: 2.5 });
      const a = -Math.PI / 4 * soon(t, at - 0.15, 0.6) - Math.PI / 4;
      fill(
        () => {
          ctx.moveTo(x + Math.cos(a) * 24, y + Math.sin(a) * 24);
          ctx.lineTo(x + Math.cos(a + 1.57) * 6, y + Math.sin(a + 1.57) * 6);
          ctx.lineTo(x - Math.cos(a) * 16, y - Math.sin(a) * 16);
          ctx.lineTo(x - Math.cos(a + 1.57) * 6, y - Math.sin(a + 1.57) * 6);
          ctx.closePath();
        },
        { color: P.authority, alpha: q }
      );
    } else if (i === 1)
      [88, 64, 40].forEach(
        (w, k) => box(x - 44, y - 26 + k * 18, w, 12, {
          fill: P.authority,
          alpha: q * mix(1, restMark(P.authority), k / 2),
          radius: 3
        })
      );
    else if (i === 2) {
      box(x - 46, y - 32, 92, 64, { stroke: P.authority, alpha: q, radius: 10 });
      dot(x, y, 6, { color: P.ink, alpha: q });
    } else
      [
        [64, 0],
        [50, -21],
        [36, -42]
      ].forEach(
        ([w, dy]) => box(x - w / 2, y + 12 + dy, w, 18, { stroke: P.authority, alpha: q, radius: 4 })
      );
  });
  const iy = RB - 96, [cx, sx, rx] = xb, cf = ramp(t, conflicts - 0.15, 0.4) * one, fix = soon(t, stalled + 0.05, 0.6);
  [-1, 1].forEach((side) => {
    const bx = cx + side * 21, a = mix(side * Math.PI / 2, 0, fix), r = 10;
    box(bx - 17, iy - 15, 34, 30, { stroke: P.muted, alpha: cf, radius: 5 });
    const tri = () => {
      ctx.moveTo(bx + Math.cos(a) * r, iy + Math.sin(a) * r);
      ctx.lineTo(bx + Math.cos(a + 2.4) * r * 0.8, iy + Math.sin(a + 2.4) * r * 0.8);
      ctx.lineTo(bx + Math.cos(a - 2.4) * r * 0.8, iy + Math.sin(a - 2.4) * r * 0.8);
      ctx.closePath();
    };
    fill(tri, { color: P.unknown, alpha: cf * (1 - fix) });
    fill(tri, { color: P.authority, alpha: cf * fix });
  });
  const st = ramp(t, stalled - 0.15, 0.4) * one, settle = ramp(t, protect + 0.05, 0.4);
  diamond(sx, iy, 30, { color: P.muted, alpha: st * (1 - settle) });
  diamond(sx, iy, 30, { color: P.authority, alpha: st * settle });
  [-6, 6].forEach(
    (d) => line(sx + d, iy - 10, sx + d, iy + 10, { color: P.ink, alpha: st * (1 - settle), width: 3 })
  );
  check(sx, iy + 1, 22, { color: P.authority, alpha: st * settle, upto: settle });
  const pr = ramp(t, protect - 0.15, 0.4) * one, px = rx - 7;
  person(px, iy - 4, { alpha: pr, size: 0.6 });
  line(px + 19, iy + 22, px + 19, iy - 27, { color: P.ink, alpha: pr, width: 2 });
  box(px + 19, iy - 27, 18, 12, { fill: P.unknown, alpha: pr, radius: 2 });
  stroke(
    () => ctx.arc(
      px + 6,
      iy + 11,
      38,
      Math.PI * 1.1,
      Math.PI * mix(1.1, 1.9, soon(t, protect + 0.05, 0.6))
    ),
    { color: P.authority, alpha: pr, width: 3 }
  );
  const whole = ramp(t, cue(s, "问题的人", "expose problems") + 0.05, 0.4);
  const ink = (i) => one * ramp(t, duties[i] - 0.15, 0.4) * mix(listLevel(t, duties, i), 1, whole);
  railNames(namesA, xa, RA, { wrap: 300, alpha: (i) => ink(i), set: "duties" });
  railNames(namesB, xb, RB, { wrap: 320, alpha: (i) => ink(i + 4), set: "duties" });
}
function s29Strain(t, strains, repair, blame, three) {
  const cx = L(953, 947);
  const cy = 470, R = 150, k = R / 100, fixed = soon(t, repair + 0.05, 0.8), turn = Math.max(0, voiceTime(t) - voiceTime(repair + 0.05)) * 0.25 * fixed;
  s29Wheel(cx, cy, R, { turn, alpha: three });
  dot(cx, cy, 10, { color: P.evidence, alpha: three * fixed });
  const names = en ? [
    "Goals conflict",
    "Priorities drift",
    "Resources run short",
    "Decisions stall",
    "Interfaces mislead"
  ] : ["目标冲突", "优先级变来变去", "资源不足", "决定一拖再拖", "分工衔接让人误判"];
  const angles = en ? [-2.4, -0.74, 0.74, 2.4, Math.PI] : [-2.4, -0.74, 0.74, Math.PI, 2.4];
  strains.forEach((at, i) => {
    const a = angles[i], q = ramp(t, at - 0.15, 0.4) * three, lit = speaking(t, strains, i), px = cx + Math.cos(a) * R, py = cy + Math.sin(a) * R;
    const nx = -Math.sin(a) * 9 * k, ny = Math.cos(a) * 9 * k;
    const crack = [
      [px + Math.cos(a) * 22 * k + nx, py + Math.sin(a) * 22 * k + ny],
      [px + Math.cos(a) * 6 * k - nx, py + Math.sin(a) * 6 * k - ny],
      [px - Math.cos(a) * 8 * k + nx, py - Math.sin(a) * 8 * k + ny],
      [px - Math.cos(a) * 20 * k - nx, py - Math.sin(a) * 20 * k - ny]
    ];
    path(crack, { color: P.unknown, alpha: q * (1 - fixed), width: 4 + 2 * lit });
    path(crack, { color: P.evidence, alpha: q * fixed, width: 4 });
    radialName(names[i], cx, cy, R * 1.24 + 12, a, {
      width: L(260, 300),
      alpha: three * listIn(t, strains, i),
      set: "strains"
    });
  });
  nameText(L("先从管理上改起", "Management system"), cx, cy + R * 1.24 + NAME_GAP + 24, {
    valign: "top",
    color: P.evidence,
    alpha: three * named(t, repair)
  });
  const member = L("不要急着怪成员", "A member's capability"), mx = cx + R * 1.24 + 12 + NAME_GAP + measure(member) / 2;
  const bl = ramp(t, blame - 0.15, 0.4) * three, memberTop = cy + 42.75;
  person(mx, memberTop - 58 - NAME_GAP, { alpha: bl, size: 1.1, color: P.muted });
  nameText(member, mx, memberTop, {
    valign: "top",
    color: P.muted,
    alpha: three * named(t, blame)
  });
}

// picture/film/scenes/p29/record.js
function s29Urgency(s, t, urgency, uncertain, noAuthority, eight) {
  const [reliable, target] = [cue(s, "变可靠", "reliable"), cue(s, "可靠", "reliable")], clockReach = Math.max(46, measure(L("再紧急", "Urgency")) / 2);
  const pairE = 960 - (600 - clockReach + 900 + Math.max(45, measure(L("不确定的结果", "An uncertain result")) / 2)) / 2;
  const E = en ? mix(360, -80, glide(t, uncertain - 0.1, 440)) : mix(
    mix(360, pairE, glide(t, uncertain - 0.1, 360 - pairE)),
    -70,
    glide(t, target - 0.1, pairE + 70)
  );
  const cx = 600 + E, cy = 510, rows = [400, 620], sx = 900 + E, bx = 1200 + E, tx = 1480 + E;
  const un = ramp(t, uncertain - 0.15, 0.4) * eight;
  clock(cx, cy, 44, {
    hand: voiceTime(t) * 0.3 % 1,
    color: P.unknown,
    alpha: eight * ramp(t, urgency + STAGE_CUT, 0.15)
  });
  nameText(L("再紧急", "Urgency"), cx, cy + 44 + NAME_GAP, {
    valign: "top",
    alpha: eight * named(t, urgency)
  });
  link(cx + 52, cy, sx - 58, rows[0], {
    route: "hvh",
    mid: 750 + E,
    r: 18,
    alpha: un,
    end: false
  });
  link(cx + 52, cy, bx - 16, rows[1], {
    route: "hvh",
    mid: 750 + E,
    r: 18,
    color: P.unknown,
    alpha: eight * ramp(t, noAuthority - 0.15, 0.3),
    upto: drawShare(
      t,
      noAuthority - 0.15,
      Math.abs(bx - 16 - (cx + 52)) + Math.abs(rows[1] - cy),
      0.5
    ),
    end: false,
    dash: [8, 8]
  });
  documentIcon(sx - 44, rows[0] - 56, 88, 112, { alpha: un, rows: 0 });
  text("?", sx, rows[0] + 6, 44, { role: "mark", align: "center", color: P.unknown, alpha: un });
  nameText(L("不确定的结果", "An uncertain result"), sx, rows[0] + 56 + NAME_GAP, {
    valign: "top",
    alpha: eight * named(t, uncertain)
  });
  link(sx + 58, rows[0], bx - 16, rows[0], {
    color: P.unknown,
    alpha: eight * ramp(t, reliable - 0.15, 0.3),
    upto: drawShare(t, reliable - 0.15, Math.abs(bx - 16 - (sx + 58)), 0.45),
    end: false,
    dash: [8, 8]
  });
  [
    [rows[0], reliable],
    [rows[1], noAuthority]
  ].forEach(
    ([y, at]) => line(bx, y - 30, bx, y + 30, {
      color: P.unknown,
      alpha: ramp(t, at + 0.05, 0.3) * eight,
      width: 4
    })
  );
  ring(tx, rows[0], 34, { color: P.muted, alpha: eight * named(t, target), width: 2 });
  check(tx, rows[0] + 2, 30, { color: P.muted, alpha: eight * named(t, target) });
  seal(tx, rows[1], 32, { color: P.muted, alpha: eight * named(t, noAuthority), hollow: true });
  nameText(L("可靠", "Reliable"), tx, rows[0] + 56 + NAME_GAP, {
    valign: "top",
    color: P.muted,
    alpha: eight * named(t, target)
  });
  nameText(L("权限", "Authority"), tx, rows[1] + 34 + NAME_GAP, {
    valign: "top",
    color: P.muted,
    alpha: eight * named(t, noAuthority)
  });
}
function s29Record(s, t, fields, verifyAt, reviewAt, nine) {
  const later = cue(s, "再补记录", "then complete the record"), ix = 590 + (en ? 0 : 80 * (1 - glide(t, later - 0.45, 80))), cy = 500, rx = 800, rw = 640;
  const rows = en ? [
    ["Who decided what"],
    ["On which facts", " and authority"],
    ["How long the measure lasts"],
    ["Who takes over"],
    ["When to roll back"]
  ] : [["谁", "凭哪些事实和权限，", "决定了什么"], ["措施管多久"], ["谁接手"], ["什么情况回滚"]];
  const rowAts = en ? [[fields[0]], [fields[1], cue(s, "", "and authority")], [fields[2]], [fields[3]], [fields[4]]] : [
    [fields[0], fields[1], cue(s, "决定了什么", "decided what")],
    [fields[2]],
    [fields[3]],
    [fields[4]]
  ];
  const starts = rowAts.map((v) => v[0]), RH = 66, top = cy - RH * rows.length / 2 + 10, PT9 = top - 60, HC = PT9 + 40;
  const firstAt = cue(s, "就先控制影响", "contain first") - 0.15, held9 = ramp(t, firstAt - 0.15, 0.4);
  const verified = ramp(t, verifyAt - 0.15, 0.4);
  dot(ix, cy, 12, { color: P.unknown, alpha: nine * held9 * (1 - verified) });
  ring(ix, cy, 26, { color: P.evidence, alpha: nine * held9, width: 3 });
  check(ix, cy + 1, 26, {
    color: P.evidence,
    alpha: nine * verified,
    draw: { t, at: verifyAt - 0.05 }
  });
  const nominal = cy + 46 + NAME_GAP + labelSize(LABEL) / 2, rowMid = rows.map((_, i) => HC + RH * (i + 1)).find((m) => Math.abs(m - nominal) < 13);
  const contained = nameText(L("先控制影响", "Contain first"), ix, rowMid ?? nominal, {
    color: P.evidence,
    alpha: nine * named(t, firstAt)
  });
  const after = en ? ["Verify the correction", ", review the cause"] : ["核验修正", "，复盘原因"], AW = 340;
  growName(t, after, [verifyAt, reviewAt], ix, contained.bottom + 60, {
    width: AW,
    color: P.evidence,
    alpha: nine,
    align: "center",
    build: true
  });
  const rowTop = (i) => HC + RH * (i + 1) - labelSize(LABEL) / 2, grownRows = starts.map((at) => soon(t, at - 0.5, 0.35));
  const OT = HC - labelSize(LABEL) / 2 - 44, foot = grownRows.reduce((y, q, i) => mix(y, rowTop(i) + 46 + 27, q), 2 * HC - OT);
  const open = ease((voiceTime(t) - voiceTime(later - 0.45)) / 1.6), pageW = mix(96, rw, open), waitX = rx + (rw - 96) / 2, px9 = mix(waitX, rx, open);
  documentIcon(px9, mix(PT9, OT, open), pageW, mix(120, foot - OT, open), {
    alpha: nine,
    rows: 0
  });
  clock(px9 + 48, top + 14, 24, {
    hand: voiceTime(t) * 0.5 % 1,
    color: P.muted,
    alpha: nine * (1 - ramp(open, 0, 0.4))
  });
  nameText(L("再补记录", "Then complete the record"), px9 + 44, HC, {
    align: "left",
    alpha: nine * named(t, later + L(0.3, 0.6))
  });
  nameText(
    L("先记录会耽误应对", "Recording would delay the response"),
    waitX,
    top + 60 + NAME_GAP,
    {
      align: "left",
      valign: "top",
      size: NOTE,
      color: P.muted,
      alpha: nine * named(t, cue(s, "先记录会耽误应对", "recording would delay the response")) * (1 - ramp(t, later - 0.4, 0.25))
    }
  );
  stroke(
    () => starts.forEach((at, i) => {
      const y = rowTop(i) + 46, end = Math.max(rx + 140, px9 + pageW - 44), q = drawShare(t, at - 0.15, end - rx - 96);
      if (q > 0) {
        ctx.moveTo(rx + 96, y);
        ctx.lineTo(mix(rx + 96, end, q), y);
      }
    }),
    { color: P.line, alpha: nine * 0.7, width: 2 }
  );
  rows.forEach((row, i) => {
    const y = rowTop(i), q = ramp(t, starts[i] - 0.15, 0.4), lit = speaking(t, starts, i), held = q * nine;
    box(rx + 44, y + 4, 24, 24, {
      stroke: lit > 0 ? blend(P.line, P.authority, lit) : P.line,
      alpha: held,
      radius: 4,
      width: 2
    });
    if (q > 0)
      check(rx + 56, y + 16, 22, { color: P.authority, alpha: q * nine, upto: q, width: 3 });
    growName(t, row, rowAts[i], rx + 96, y, {
      alpha: nine * listLevel(t, starts, i),
      set: "record"
    });
  });
}
function s29Recurrence(s, t, again, recurring, mechanism, ten) {
  const xs = [520, 740, 960, 1180, 1400], ry = 380, bus = 474, gy = 612, gr = 60;
  const close = cue(s, "反复出现", "a recurring kind of exception", { end: true }), said = s.words.filter((w) => w.start >= again - 1e-6 && w.start < close).map((w) => w.start);
  const beats2 = xs.map((_, k) => said[Math.round(k * (said.length - 1) / (xs.length - 1))]);
  const mech = ramp(t, mechanism - 0.15, 0.4), turn = Math.max(0, voiceTime(t) - voiceTime(mechanism + 0.05)) * 0.25;
  line(
    xs[0] - 60,
    ry,
    mix(
      xs[0] - 60,
      xs.at(-1) + 60,
      drawShare(t, again - 0.1, xs.at(-1) - xs[0] + 120, Math.max(0.9, close - again))
    ),
    ry,
    { color: P.line, alpha: ten, width: 2 }
  );
  xs.forEach((x, k) => {
    const q = ramp(t, beats2[k] - 0.1, 0.3) * ten;
    dot(x, ry, 20, { color: P.ground, alpha: q });
    ring(x, ry, 20, { color: P.unknown, alpha: q, width: 2 });
    dot(x, ry, 9, { color: P.unknown, alpha: q });
    link(x, ry + 28, 960, gy - gr * 1.24 - 10, {
      route: "vhv",
      mid: bus,
      r: 16,
      alpha: ten * mech,
      draw: { t, at: mechanism - 0.1 },
      end: k === 2
    });
  });
  s29Gear(960, gy, gr, { turn, alpha: ten * mech });
  const parts = en ? ["Treat", " a recurring kind of exception"] : ["同类紧急处置", "反复出现"];
  growName(
    t,
    parts,
    [again, recurring],
    960 - measure(parts.join(""), LABEL) / 2,
    ry - 20 - NAME_GAP,
    { valign: "bottom", alpha: ten }
  );
  nameText(L("按机制问题处理", "As a mechanism problem"), 960, gy + gr * 1.24 + NAME_GAP, {
    valign: "top",
    color: P.evidence,
    alpha: ten * named(t, mechanism)
  });
}

// picture/film/scenes/p29/scene.js
scenes["29"] = function(s, t) {
  const managers = cue(s, "管理者要讲清", "managers clarify");
  const clarify = cues(s, [
    ["方向", "direction"],
    ["优先级", "priorities"],
    ["决定的边界", "decision boundaries"],
    ["和资源", "and resources"]
  ]);
  const [conflicts, stalled, protect] = cues(s, [
    ["跨领域的冲突", "cross-domain conflicts"],
    ["久拖不决的事项", "stalled decisions"],
    ["保护如实暴露问题的人", "people who honestly"]
  ]);
  const strains = cues(s, [
    ["目标冲突", "goals conflict"],
    ["优先级变来变去", "priorities drift"],
    ["资源不足", "resources run short"],
    ["决定一拖再拖", "decisions stall"],
    ["分工衔接让人误判", "interfaces mislead"]
  ]);
  const [repair, blame] = cues(s, [
    ["先从管理上改起", "repair the management system"],
    ["不要急着怪成员", "before blaming"]
  ]);
  const [demo, ...misuse] = cues(s, [
    ["用真实的工作示范", "show how they judge"],
    ["事后挑错", "retrospective fault-finding"],
    ["走过场", "ceremonial review"],
    ["微观管理", "micromanagement"]
  ]);
  const [within, closest] = cues(s, [
    ["在边界之内", "within the stated boundaries"],
    ["离事实最近的负责人", "the responsible person closest"]
  ]);
  const paths = cues(s, [
    ["选方法", "the method"],
    ["工具", "tools"],
    ["实施路径", "and path"]
  ]);
  const kinds = cues(s, [
    ["数据出错", "a data error"],
    ["生产故障", "production failure"],
    ["越权违规", "permission or compliance"]
  ]);
  const emergency = cue(s, "紧急情况下", "an emergency");
  const [finder, contain, tell, ownerLeads] = cues(s, [
    ["发现的人", "whoever finds it"],
    ["在自己权限内控制影响", "contains it within"],
    ["通知数据或生产负责人", "tells the data or production owner"],
    ["受影响工作的负责人", "the owner of the affected work"]
  ]);
  const [urgency, uncertain, noAuthority] = cues(s, [
    ["再紧急", "urgency does not"],
    ["不确定的结果", "an uncertain result"],
    ["权限也不会变大", "grant authority"],
    ["先控制影响", "contain first"]
  ]);
  const fields = cues(s, [
    ["谁凭哪些事实和权限", "who decided what"],
    ["凭哪些事实和权限", "on which facts"],
    ["措施管多久", "how long the measure"],
    ["谁接手", "who takes over"],
    ["什么情况下回滚", "when to roll back"]
  ]);
  const [verifyAt, reviewAt] = cues(s, [
    ["核验修正", "verify the correction", { last: true }],
    ["复盘原因", "and review"]
  ]);
  const [again, recurring, mechanism] = cues(s, [
    ["同类紧急处置", "treat a recurring"],
    ["反复出现", "a recurring kind of exception"],
    ["按机制问题处理", "as a mechanism problem"]
  ]);
  const base = ramp(t, opening(s), 0.7);
  const one = base * stageOut(t, strains[0]);
  if (one > 0) s29Managers(s, t, managers, clarify, conflicts, stalled, protect, one);
  const demoCut = cue(s, "管理者用真实的工作示范", "managers show how they judge") - STAGE_CUT + 0.05;
  const three = base * stageIn(t, strains[0]) * stageOut(t, demoCut);
  if (three > 0) s29Strain(t, strains, repair, blame, three);
  const boundCut = Math.min(closest - 0.35, within + L(0, 0.57)), four = base * stageIn(t, demoCut) * stageOut(t, boundCut);
  if (four > 0) s29Demonstration(s, t, demo, misuse, four);
  const five = base * stageIn(t, boundCut) * stageOut(t, emergency);
  if (five > 0) s29Closest(t, within, closest, paths, boundCut, five);
  const six = base * stageIn(t, emergency) * stageOut(t, ownerLeads);
  if (six > 0) s29Containment(s, t, kinds, emergency, finder, contain, tell, six);
  const seven = base * stageIn(t, ownerLeads) * stageOut(t, urgency);
  if (seven > 0) s29Response(s, t, ownerLeads, seven);
  const recordAt = cue(s, "如果先记录", "if recording would");
  const eight = base * stageIn(t, urgency) * stageOut(t, recordAt);
  if (eight > 0) s29Urgency(s, t, urgency, uncertain, noAuthority, eight);
  const nine = base * stageIn(t, recordAt) * stageOut(t, again);
  if (nine > 0) s29Record(s, t, fields, verifyAt, reviewAt, nine);
  const ten = base * stageIn(t, again);
  if (ten > 0) s29Recurrence(s, t, again, recurring, mechanism, ten);
};

// picture/film/scenes/p30/scene.js
scenes["30"] = function(s, t) {
  const [back, next, finished, rely] = cues(s, [
    ["回到开头那份价格数据", "back to the price dataset"],
    ["下一位用它的人", "its next user"],
    ["做完了", "a finished dataset"],
    ["可靠", "reliable"]
  ]);
  const needs = cues(s, [
    ["清楚的含义", "clear meaning"],
    ["当时能拿到的事实", "the facts available"],
    ["对得上说法的证据", "evidence matching"],
    ["经过准入", "an admitted"]
  ]);
  const results = cues(s, [
    ["发布指南", "publishing these guidelines"],
    ["真正采用它", "adopting them"],
    ["让工作变好", "improving the work"]
  ]);
  const three = cue(s, "三回事", "three different results");
  const [lastTwo, realAt, show] = cues(s, [
    ["后两件", "the last two"],
    ["真实的工作", "real work"],
    ["才能证明", "can show"]
  ]);
  const [q1, q2, q3, yes] = cues(s, [
    ["问题解决了吗", "was the problem solved"],
    ["判断经过检验", "was the judgment tested its limits clear"],
    ["下一次", "and is the"],
    ["肯定的", "yes"]
  ]);
  const base = ramp(t, opening(s), 0.7);
  const g1 = base * stageOut(t, results[0]);
  const needNames = en ? [
    "Clear meaning",
    "Facts available then",
    "Evidence matching claims",
    "An admitted, bounded use"
  ] : ["清楚的含义", "当时能拿到的事实", "对得上说法的证据", "经过准入、有边界的用途"];
  const QX = Math.min(1370, 1790 - 17 - NAME_GAP - Math.max(...needNames.map((v) => measure(v, LABEL)))) + L(-60, -80), PX0 = QX - 200;
  const Y1 = CONTENT_CY + 48, K = 1.4, CX0 = Math.min(330 + L(-60, -80), PX0 - 300 * K - 370), CY = Y1 - 180 * K;
  const userAt = Math.min(next, cue(s, "下一位用它的人", "with") + 0.05);
  const pair = (1920 - (PX0 - CX0) - measure(L("下一位用它的人", "Its next user")) / 2) / 2 - CX0;
  const lone = 960 - 150 * K - CX0, onward = glide(t, needs[0] - 0.1, Math.max(Math.abs(pair), Math.abs(pair - lone)));
  const CX = CX0 + mix(mix(lone, pair, glide(t, userAt - 0.1, pair - lone)), 0, onward), PX = PX0 + pair * (1 - onward), edgeX = CX + 300 * K;
  const lift = (y) => clearOfTitle(s, t, y);
  illustrative(g1 * Math.min(lift(CY), ramp(t, s.words[0].start - HOLD, 0.4)));
  if (g1 > 0) {
    const card = g1 * lift(CY), user = named(t, Math.min(next, cue(s, "下一位用它的人", "with") + 0.05)) * g1 * lift(Y1 - 60);
    reportCard(CX, CY, { alpha: card, scale: K, done: 1, named: card * named(t, back) });
    nameText(L("做完了", "A finished dataset"), CX + 150 * K, CY - NAME_GAP, {
      valign: "bottom",
      alpha: g1 * named(t, finished)
    });
    person(PX, Y1, { alpha: user, size: 1.4 });
    nameText(L("下一位用它的人", "Its next user"), PX, Y1 + 32 + NAME_GAP, {
      valign: "top",
      alpha: named(t, next) * g1 * lift(Y1 - 60)
    });
    const relied = ramp(t, rely - 0.1, 0.5);
    link(edgeX + 20, Y1, PX - 60, Y1, { alpha: user, draw: { t, at: next - 0.1 } });
    link(edgeX + 20, Y1, PX - 60, Y1, {
      color: P.evidence,
      alpha: g1 * relied,
      width: 2.5,
      flowing: since(t, rely + 0.1)
    });
    nameText(L("可靠", "Reliable"), (edgeX + PX - 40) / 2, Y1 - NAME_GAP, {
      valign: "bottom",
      width: PX - edgeX - 110,
      alpha: g1 * named(t, rely)
    });
    const names = needNames, tops = stackTops(
      names.map(() => blockHeight(1)),
      Y1,
      40
    );
    names.forEach((v, i) => {
      const y = tops[i] + labelSize(LABEL) / 2, on = ramp(t, needs[i] - 0.15, 0.4) * g1, lit = speaking(t, needs, i);
      ring(QX, y, 17, { color: P.evidence, alpha: on, width: 2.5 });
      check(QX, y + 1, 18, { color: P.evidence, alpha: on, draw: { t, at: needs[i] - 0.1 } });
      if (lit > 0)
        ring(QX, y, 25, {
          color: P.evidence,
          alpha: lit * restMark(P.evidence, 0.5) * g1,
          width: 2
        });
      nameText(v, QX + 17 + NAME_GAP, y, {
        align: "left",
        alpha: g1 * listIn(t, needs, i),
        set: "needs"
      });
    });
  }
  const asks = q1, g2 = base * stageIn(t, results[0]) * stageOut(t, asks);
  if (g2 > 0) {
    const names = en ? ["Publishing these guidelines", "Adopting them", "Improving the work"] : ["发布指南", "真正采用它", "让工作变好"];
    const heads = en ? ["Three different results", "Real work"] : ["三回事", "真实的工作"];
    const R = 90, k = R / 62, D = L(380, 420), GAP = 70, wrap = D - 40, HW = Math.max(...heads.map((v) => measure(v, LABEL)));
    const lines = names.map((v) => wrapName(v, wrap)), nameHalf = Math.max(
      R,
      ...lines.map((ls) => Math.max(...ls.map((l) => measure(l, LABEL))) / 2)
    );
    const total = 2 * D + nameHalf + R + GAP + HW, rightUntil = L(105, 60) * (1 - glide(t, results[2] - 0.1, L(105, 60)));
    const x0 = L(940, 965) + rightUntil - total / 2 + R + GAP + HW, xs = [x0, x0 + D, x0 + 2 * D], HX = x0 - R - GAP;
    const bh = blockHeight(Math.max(...lines.map((ls) => ls.length))), span2 = 2 * R + 10 + NAME_GAP + bh + 76 + 120;
    const MY = CONTENT_CY + 50 - span2 / 2 + R + 10, EY = MY + R + NAME_GAP + bh + 76, WY = EY + 120;
    const left = xs[0] - R, right = xs[2] + R, shown = Math.max(show, lastTwo);
    link(left, WY, right, WY, {
      color: P.ink,
      alpha: g2 * ramp(t, realAt - 0.05, 0.4),
      width: 3,
      end: false
    });
    results.forEach((at, i) => {
      const x = xs[i], on = ramp(t, at - 0.15, 0.4) * g2, lit = speaking(t, results, i);
      ring(x, MY, R, { color: P.ink, alpha: on, width: 2.5 });
      if (lit > 0.02)
        ring(x, MY, R + 10, {
          color: P.ink,
          alpha: 0.55 * g2 * lit ** 3,
          width: Math.max(1, 2.5 * lit)
        });
      if (i === 0) s23Page(x - 22 * k, MY - 30 * k, 44 * k, 58 * k, { alpha: on, rows: 3 });
      else if (i === 1) person(x, MY + 10 * k, { alpha: on, size: 1.15 * k });
      else
        path(
          [
            [x - 30 * k, MY + 18 * k],
            [x - 10 * k, MY],
            [x + 6 * k, MY + 8 * k],
            [x + 30 * k, MY - 20 * k]
          ],
          { color: P.ink, alpha: on, width: 3 }
        );
      if (!i) return;
      const rise = soon(t, show - 0.05 + (i - 1) * 0.1, 0.5), proof = ramp(t, shown - 0.1 + (i - 1) * 0.12, 0.4) * g2;
      link(x, WY - 3, x, EY + 30, {
        alpha: g2,
        upto: rise,
        flowing: since(t, show + 0.45 + (i - 1) * 0.1),
        lag: i * 0.33
      });
      ring(x, EY, 22, { color: P.evidence, alpha: proof, width: 2.5 });
      check(x, EY + 1, 22, {
        color: P.evidence,
        alpha: proof,
        draw: { t, at: shown + (i - 1) * 0.12 }
      });
    });
    railNames(names, xs, MY + R, {
      gap: NAME_GAP,
      wrap,
      alpha: (i) => g2 * listIn(t, results, i),
      set: "results"
    });
    const apart = ramp(t, three - 0.15, 0.4) * g2;
    [0, 1].forEach(
      (k2) => line(xs[k2] + D / 2, MY - R - 10, xs[k2] + D / 2, WY, {
        color: P.line,
        alpha: apart,
        width: 2
      })
    );
    [
      [MY, three, P.muted],
      [WY, realAt, P.ink]
    ].forEach(
      ([y, at, color], k2) => nameText(heads[k2], HX, y, { align: "right", color, alpha: g2 * named(t, at) })
    );
  }
  const g3 = base * stageIn(t, asks);
  if (g3 > 0) {
    const [earlier, better, worth] = cues(s, [
      ["能不能更好地发现", "better able to recognize"],
      ["应对", "or handle"],
      ["这项工作就有了价值", "the work has value"]
    ]);
    const third = en ? q3 : cue(s, "工作体系能不能", "");
    const asked = [q1, q2, third], ats = [[q1], [q2], [third, earlier, better]], all = cue(s, "三个答案", "the answer to all three");
    const answered = ramp(t, pauseHold(all - 0.1, 0.3), 0.3) * (1 - ramp(t, yes + 0.05, 0.3));
    const names = en ? [
      ["Problem solved?"],
      ["Judgment tested, limits clear?"],
      ["Better able to recognize", " or handle", " the next occurrence?"]
    ] : [["问题解决了吗"], ["判断经过检验，限度清楚"], ["工作体系能不能更好地发现或应对"]];
    const W = en ? 380 : RAIL_WRAP, R = 56, Y = CONTENT_CY - 20, xs = [520, 960, 1400], done = t >= yes + 0.05;
    const settle = ramp(t, asks + STAGE_CUT, 0.15);
    line(xs[0] - 230, Y, xs[2] + 230, Y, { color: P.line, alpha: g3 * settle, width: 3.5 });
    asked.forEach((at, i) => {
      const x = xs[i], from = Math.max(pauseHold(at - 0.15, 0.4), i ? -Infinity : asks + STAGE_CUT), on = ramp(t, from, 0.4) * g3;
      const lit = Math.max(speaking(t, asked, i) * (i ? 1 : settle), answered);
      dot(x, Y, R, { color: P.ground, alpha: g3 * ramp(t, from, 0.1) });
      ring(x, Y, R, { color: P.evidence, alpha: on, width: 2.5 });
      if (lit > 0)
        ring(x, Y, R + 10, {
          color: P.evidence,
          alpha: lit * restMark(P.evidence, 0.45) * g3,
          width: 2
        });
      text("?", x, Y + 2, 40, {
        role: "mark",
        align: "center",
        color: P.ink,
        alpha: on * (1 - ramp(t, yes - 0.2, 0.4))
      });
      if (done) check(x, Y + 3, 36, { color: P.evidence, alpha: g3, draw: { t, at: yes + 0.05 } });
    });
    beats(t, xs[2], Y, R + 10, [earlier, better], { color: P.evidence, alpha: g3 });
    names.forEach(
      (parts, i) => nameText(
        growTexts(parts, i < 2 ? W : W + 120).map((line2) => line2.map(([, v]) => v).join("")),
        xs[i],
        Y + R + NAME_GAP,
        {
          valign: "top",
          alpha: g3 * listLevel(t, asked, i) * named(t, ats[i][0]),
          set: "questions"
        }
      )
    );
    const BY = Y - R - 64, reach = { t, at: worth - 0.1 }, outer = Math.min(worth + 0.6, s.words.at(-1).end - 0.4);
    if (t >= reach.at) {
      link(960, BY, xs[0], BY, { alpha: g3, draw: reach, end: false });
      link(960, BY, xs[2], BY, { alpha: g3, draw: reach, end: false });
      xs.forEach(
        (x, i) => link(x, BY, x, Y - R - 14, {
          alpha: g3,
          end: false,
          draw: { t, at: i === 1 ? worth - 0.1 : outer }
        })
      );
    }
    nameText(L("这项工作就有了价值", "The work has value"), 960, BY - NAME_GAP, {
      valign: "bottom",
      color: P.evidence,
      alpha: g3 * named(t, worth)
    });
  }
};

// picture/film/playback.js
var CUT_LAG = 0.6;
var continues = (i) => i > 0 && film.segments[i - 1].chapter === film.segments[i].chapter;
var firstTexts = /* @__PURE__ */ new Map();
function firstTextOf(s) {
  if (firstTexts.has(s.id)) return firstTexts.get(s.id);
  const saved = { ctx, layout, sceneFade, wordFade, scene: window.__sceneId, measuring };
  const meter = measuringContext();
  let found = Infinity;
  setDrawing({ measuring: true, ctx: meter });
  try {
    for (let t = s.voice_start - 0.3; t <= s.voice_start + CUT_LAG + 0.2; t += 1 / 60) {
      setDrawing({ layout: { texts: [], scene: s.id }, sceneFade: 1, wordFade: 1 });
      meter.setTransform(1, 0, 0, 1, 0, 0);
      meter.save();
      push(s, t);
      scenes[s.id](s, t);
      meter.restore();
      if (layout.texts.some((v) => contrastOf(v.color, v.alpha) >= 4.5)) {
        found = t;
        break;
      }
    }
  } finally {
    setDrawing(saved);
    window.__sceneId = saved.scene;
  }
  firstTexts.set(s.id, found);
  return found;
}
var cutAt = (v) => {
  const voice = Math.max(v.start, v.voice_start, v.words?.[0]?.start ?? -Infinity);
  return scenes[v.id]?.carries ? voice : Math.min(voice + CUT_LAG, Math.max(voice, firstTextOf(v)));
};
var visualStart = (i) => continues(i) ? cutAt(film.segments[i]) : film.segments[i].start;
function drawScene(s, t, fade, words = fade) {
  const scene = scenes[s.id];
  if (!scene) throw Error(`Unimplemented scene ${s.id}`);
  layout.scene = s.id;
  setDrawing({ sceneFade: fade, wordFade: words });
  window.__sceneId = s.id;
  ctx.save();
  push(s, t);
  scene(s, t);
  ctx.restore();
  layout.scene = null;
  setDrawing({ sceneFade: 1, wordFade: 1 });
  window.__sceneId = null;
}
function drawAt(t) {
  setDrawing({ layout: { texts: [], scene: null, time: t } });
  ctx.setTransform(resolution, 0, 0, resolution, 0, 0);
  ctx.globalAlpha = 1;
  ctx.fillStyle = P.ground;
  ctx.fillRect(0, 0, 1920, 1080);
  const creditStart = film.duration - film.credits_duration;
  if (t >= creditStart) {
    credits(t);
    publish(t);
    return;
  }
  const index = Math.max(
    0,
    film.segments.findLastIndex((v2) => v2.start <= t)
  );
  const s = film.segments[index];
  const next = film.segments[index + 1], prev = film.segments[index - 1];
  let shown = index;
  while (shown > 0 && continues(shown) && t < visualStart(shown)) shown--;
  if (next && continues(index + 1) && t >= visualStart(index + 1)) shown = index + 1;
  const fadeIn = index === 0 || prev && prev.chapter === s.chapter ? 1 : ramp(t, s.start, 0.6);
  const fadeOut = next && next.chapter === s.chapter ? 1 : 1 - ramp(t, s.end - 0.5, 0.5);
  const keep = Math.min(fadeIn, fadeOut);
  const v = film.segments[shown];
  drawScene(v, t, keep);
  chapterCard(next && opensChapter(next) && t >= next.start - 0.15 ? next : s, t);
  runningHead(s, t);
  caption(t);
  publish(t);
}
function publish(t) {
  window.__filmLayout = { time: t, texts: layout.texts };
}
window.renderFrame = (t) => drawAt(t + (film.render_offset || 0));
window.renderCover = () => {
  setDrawing({ layout: { texts: [] } });
  ctx.setTransform(resolution, 0, 0, resolution, 0, 0);
  ctx.fillStyle = P.ground;
  ctx.fillRect(0, 0, 1920, 1080);
  titleSignature(1);
};
window.__filmScenes = scenes;
window.renderFrame(0);

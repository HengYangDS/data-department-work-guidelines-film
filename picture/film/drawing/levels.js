/* Ink levels: how far a list's names and the marks in accent colours step back at rest and stay legible. */

import { P } from "../palette.js";
import { clamp, mix } from "../timing/easing.js";

/* A spoken list builds: each item arrives on its own words and stays, so the whole set forms on the screen. While the
 * list is spoken, the item being named stands at full ink and the items already named share one second level; once
 * the last item has been said the whole set returns to full ink, and it leaves as a whole when the argument moves on
 * at `until`. None of these changes falls in a pause. The second level keeps every name legible: at 0.74 of full ink
 * the muted colour, the faintest colour a list's names take, still reads at 4.6:1 against the ground (ink needs 0.51,
 * authority 0.62 and evidence 0.69), so the step back never leaves a named item below 4.5:1. */
export const SECOND = 0.74;
/* A muted qualifier or work column steps back less far: its level maps the list's level onto MUTED_SECOND at the second
 * level, scaling linearly below it, so the muted colour at the second level reads at 5.6:1 against the ground rather
 * than at the 4.6:1 floor, and the item being said still stands out by its own mark. */
const MUTED_SECOND = 0.83;
export const mutedLevel = (a) =>
  a < SECOND ? (a * MUTED_SECOND) / SECOND : mix(MUTED_SECOND, 1, (a - SECOND) / (1 - SECOND));
/* A mark drawn in an accent colour keeps a legible level at rest too: authority, evidence and unknown read at 4.6:1
 * against the ground at 0.62, 0.69 and 0.89 of full ink. A mark that steps back, the halo on the item being said and
 * an icon's second stroke stand at least at their colour's level, so no accent at rest falls below 4.5:1; the item
 * being said stands out by its own mark, its size or its halo, never by dimming the others below that level. A colour
 * without an accent role keeps the level it is given. */
const MARK_LEVEL = { [P.authority]: 0.62, [P.evidence]: 0.69, [P.unknown]: 0.89 };
export const restMark = (color, level = 0) => Math.max(level, MARK_LEVEL[color] ?? 0);
/* A list's level for a mark in an accent colour: the list's second level maps onto the colour's own level. */
export const markLevel = (color, level) =>
  mix(restMark(color), 1, clamp((level - SECOND) / (1 - SECOND)));
/* An icon's second stroke (a seal's inner ring, a clock's short hand, a token's outer ring) stands at its colour's
 * level, or with the icon while the icon is fainter, so it reads wherever the icon does; another colour keeps its own
 * share of the icon's ink. */
export const secondStroke = (color, alpha, share) =>
  color in MARK_LEVEL ? Math.min(alpha, MARK_LEVEL[color]) : alpha * share;

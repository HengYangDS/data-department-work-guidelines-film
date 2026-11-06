# Design

## Context

The owner's requirement of 2026-11-05 applies to every film: each carries criteria that state what an excellent film shows, and every one of them scores at least 95. The ETHOS film and the DDWG essentials film adopted twelve dimensions and a list of the patterns the owner has rejected on the same day; this film declares nine dimensions and asks no reviewer to check those patterns.

The 1.2.0 editions were published on 2026-11-04 after review round 29, which scored the Chinese edition 96.1 and the English edition 95.9 with every one of the nine dimensions at 95 or above. Their properties that the new dimensions name are measurable on the published files:

- Voice clarity, as the median cepstral peak prominence over the loud speech frames of each soundtrack, by the computation the review prompt states step by step (frames within 18 dB of the 95th-percentile frame energy, 16 kHz mono, 1024-sample periodic-Hann frames with a 256-sample hop, quefrencies 1/400 to 1/60 s): 19.6 dB in Chinese and 17.3 dB in English. The ETHOS film's round-5 Chinese narration, made from the breathy identity root and heard by the owner as hoarse, measures 15.8 dB by the same computation.
- The picture stands on the neutral ground `#0F1519` from the title card to the credits, and the smallest text, the synthetic-voice notice of the closing card, has a contrast of about 7.5:1 against it.
- Each edition opens on its title card, closes on its signature and lasts 1500 s, five times five minutes.

## Goals / Non-Goals

**Goals:**

- One set of criteria across the three films, each dimension describing an excellent film.
- The patterns the owner has rejected are checked by every reviewer.
- The published films are judged under those criteria, and the result is published with the films.
- Where the criteria find a defect, the films are repaired at its cause and published as a new edition.

**Non-Goals:**

- Changing what the films say beyond what the review's findings require.
- A native clarity measurement in the engine; the reviewers measure it by the stated method until `filmkit` measures it.

## Decisions

### 1. The same twelve dimensions as the other two films

The dimensions carry the keys of the ETHOS and essentials films, so that one contract is read across the three films. Language quality, voice quality and visual aesthetics and colour become dimensions of their own: plain spoken language was scored inside pronunciation, voice clarity inside narration performance, and colour inside typography, where a strong neighbour could hide a weak quality. Faithfulness keeps this film's subject, the seven documents with their conditions and boundaries, and typography keeps the measured layout rules of 2026-11-03.

### 2. Voice quality is measured

The floors are 18 dB in Chinese and 17 dB in English: below every narration the owner has accepted, 19.6 to 19.9 dB in Chinese (this film and ETHOS v1.0.1) and 17.2 to 17.6 dB in English, and well above the 15.8 dB of the narration the owner rejected as hoarse. The Chinese voice the ETHOS and essentials films select measures 18.3 to 18.6 dB, so the floor stands below its spread rather than within it. English has its own floor, since the same narrator measures lower in English. The measure selects frames by their energy relative to the loudest speech, so pauses do not lower it. The Chinese floor was first declared at 18.5 dB from figures of an implementation that reads clear voices up to 0.7 dB higher (20.3 dB for this film's Chinese), and in round 30 the two reviewers' implementations of that looser statement read this film's Chinese at 19.64 and 20.28 dB. The prompt therefore states every step, and each reviewer measures it on the files under review.

### 3. Rejected patterns are material findings

The prompt lists nine patterns the owner rejected in earlier editions of these films, each with the dimension it fails: lists that slide or erase their items, ragged text, swallowed phrase tails, a hoarse voice, a colour cast or low contrast, a missing title card, a concept rendering that narrows its concept, machine-sounding phrasing and a runtime that is not a whole multiple of five minutes. A reviewer checks each one on the media and says what was checked; any occurrence is a material finding, which the verifier refuses.

### 4. The published films are reviewed again

The review round binds the published films by their release hashes. The context it needs, the timelines, recordings and measurements, comes from a rebuild of this head, which `film:compare` must first prove equivalent to the release. The round prompts state the change of contract and that the films are unchanged since round 29.

### 5. Release 1.3.0 is a repair edition

Review round 30 (`build/evidence/reviews/round-30/`) judged the published 1.2.0 films under the twelve dimensions: 94.2 in Chinese and 94.4 in English. Language quality scored 88 and 87 and visual aesthetics and colour 86 and 88, each with a material finding of a pattern the owner rejected, so neither review can be recorded. A review-only release, as 1.1.0 was, would publish films that fail their own contract. The repair below therefore changes the films, and release 1.3.0 publishes both new editions with their reviews; the 1.2.0 release stays published.

### 6. The narration states the guidelines, not the film's plan

01.6–01.7 (English 01.6) told the audience which parts the film would cover, and 26.1 opened with "the last part": run-ups that only announce what follows, while the chapter cards and the running head already carry the order. They are removed. 02.1 now names the Data Department Work Guidelines, which 01.6 used to name, as the department's work-quality contract against four failures, the charter's own description. English 01.5 states the charter's contrast between a file and a reliable judgment in one sentence. 30.2 says plainly that these four needs turn a finished dataset into something others can rely on, without answering an objection nobody raised, and 30.3 and 30.4 become one thought: publishing, adopting and improving are three results, and only real work shows the last two, as the charter and the evolve guideline state. The Chinese 03.5 says what a cache and a generated view are where it first names them (缓存下来的副本, 从记录加工出来的派生视图), as the concept contract defines them. The independent review of the repaired text asked for three more English repairs, which are adopted: 09.1 drops its signpost, 26.1 takes the evolve guideline's own sentence, and the closing thought says the work has value if the three answers are yes; the Chinese closing thought says the same without 真正.

The engine hold reproduces every unchanged thought from its seed, so only the changed thoughts are narrated again; each new take is auditioned until it ends on its own and opens in quiet, and the retakes bound by text follow their thoughts to their new places. Each edition stays 1500 s: the time the removed run-ups free goes to the designed pauses.

### 7. Every text at rest is legible

The review measured dimmed text below 4.5:1 against the ground `#0F1519`. A spoken list dimmed its named items to 0.58 of full ink, which leaves muted text at 3.34:1, evidence at 3.62:1, authority at 4.23:1 and unknown at 2.64:1; refused names fell to 0.7 of the muted colour (4.30:1), report-card values to 0.42 and the running head stood at 0.72 (4.48:1). By the WCAG 2 contrast of each colour composited at its opacity over the ground, 4.6:1, a margin above 4.5:1 for the video encoding, needs 0.51 of full ink for ink text, 0.74 for muted, 0.69 for evidence, 0.62 for authority and 0.89 for unknown. No text at rest goes below its colour's level: the list's second level keeps each colour at or above it, the item being spoken stands out by its own mark, a refused name keeps the muted colour at full ink while its cross carries the refusal, and the report cards and the running head rise to legible ink. Only a text entering or leaving the picture passes below it, for at most 0.7 s. A contrast scan of every staged frame before the render, and of the rendered films after it, confirms the rule.

Round 31 measured the same fault in the accent colours' marks: the escalation links of 22.1 and the probe's links of 24.1 stood at 0.45 of their colours while the next item was said, the refusal crosses of 07.6–07.7 at 0.83 of unknown, the halo on the item being said at 0.45 or 0.5 and an icon's second stroke at 0.6, between 2.0:1 and 4.45:1. A mark in an accent colour keeps its colour's level at rest as a text does: 0.62 of full ink for authority, 0.69 for evidence and 0.89 for unknown. A list's marks step back only to that level, the halo on the item being said stands at it, and an icon's second stroke (a seal's inner ring, a clock's short hand, a token's outer ring) stands at it, or with the icon while the icon is fainter. A pulse enters and leaves by its width or length at that level rather than by its opacity, as a flow's dot does by its size, and a tint that only grounds a cell stays below 1.8:1 against the frame's ground, the level below which the review's scan reads no mark (17.3's cover tint, 0.16 of evidence over its row, stands at 1.70:1). Only a mark entering or leaving the picture passes below its level. A scan of every accent stroke and fill of the staged frames before the render confirms the rule.

Round 32 measured two marks of the ink and muted colours below 3:1 at rest, the usual floor for graphics: 05.5's dimmed dots at 0.5 of muted (2.81:1) and 16.5's halo at 0.35 of ink (2.85:1). They now rest at 0.6 of muted and 0.4 of ink, at 3:1 or more.

### 8. Labels say what they name

On the English 09.3 ring the six questions lost their question words ('Mean' beside a table of prices reads as the statistic), and on the 22.1–22.2 rail 'You find work' and 'Continuing' lost the clauses that give them meaning. They become noun phrases: Source, Availability, Meaning, Changes, Quality and Permitted use; Unrecognized work and Continuing would harm. The working loop of 18.1, the only relation that ended in open chevrons, ends its arcs in quiet points like every other link.

Round 31 found two structures named by one of their parts. The English high-risk work of 04.7 stood in two groups of two lines whose free edge zigzagged; it becomes one block of four even lines. In 04.8 the duty that still applies is the same set of fields around every tier, so its name stands centred under the row on a bracket that spans the three fields rather than under the heaviest tier, and the process that risk decides is named over the row, in English at the lightest tier's end. In 12.4 what does not follow takes the dashed outline 17.3 gives an unreached outcome, and in 20.3 the way of the delegation runs from the person to the Agent and ends in a point.

Round 32 found blocks broken unevenly. The Chinese condition blocks of 04.6–04.7 broke 16/8 and 8/10/12/7 characters beside balanced procedure blocks. A block now breaks so that no line stands under four fifths of its longest and no last line under three fifths: the first tier's work stands on one line, the middle tier's in three lines that step evenly in from the spine, the last after its 「或者」, and the high-risk work in one block of three even lines. The traps of 07.6–07.7 and the Agent's report of 17.5 stand on one line each, as they are said, and the one-sided search is named whole, 「只找对自己有利的证据」. In English the refused qualities of 08.2 stand on one line over their verdict, and the table eases left on its last criterion's words, so the table and the qualities stand inside the safe area from the qualities' first frame.

A wrapped English label breaks at a phrase: no line ends on an article or a preposition, splits a noun phrase or leaves one word for the second line. 02.6's gloss breaks before the occurrence its verbs act on, 05.2's fix, 21.3's reading and 28.1's actions after the words that open them, 06.4's condition before the whole "alternative explanations" and 25.6's reader before "outside the work"; 03.5's refusals and 22.5's next responsible person stand on one line, their seals and cells widened to take them. A stack of lines in different roles must not zigzag either: 14.3's first control pairs its four requirements on two even lines, 28.1's moments head their actions from further than the actions' own lines stand apart, and 28.3's risks stand further apart than each risk's name and qualifier. Line breaks are read in the real browser before a render, on stills of every thought at rest, because the headless layout measures text only approximately; a column must take its text whole, including a mark that hangs at a line's end.

## Risks / Trade-offs

- [The English voice sits 0.3 dB above its floor] → The computation is exact, so a reviewer reproduces the producer's figure; a measurement below the floor is a material finding that a new recording, not a lower floor, resolves.
- [The stricter criteria find a defect in the published films] → The repair is part of this Change and its films become a new edition.
- [A re-narrated thought sounds unlike its neighbours] → Every unchanged take is reproduced from its seed; each new take is auditioned for a whole ending and a quiet opening and heard in its place.
- [Fewer dimmed items make the item being spoken less distinct] → Its own mark lights while it is spoken.
- [The reviewers' clarity method could drift from the stated one] → The prompt states every step, after two implementations of a looser statement read one soundtrack 0.6 dB apart; a native measurement in the engine follows.

## Migration Plan

Declare the criteria, rebuild and compare, review the published films, repair the text, narrate the changed thoughts, repair the picture, render, review and deliver both editions, record the reviews in release 1.3.0, prove, land on `dev`, publish on GitHub and archive the Change. Rollback reverts the Change; the 1.2.0 release and its reviews stay published.

## Open Questions

None.

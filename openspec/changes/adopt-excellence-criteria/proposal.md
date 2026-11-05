# Proposal

## Why

On 2026-11-05 the owner asked that every film carry criteria that describe an excellent film, and that each of them score at least 95. The DDWG films are judged on nine dimensions that predate the owner's later rejections: voice clarity, plain spoken language and the colour of the picture are not scored on their own, the opening title card and a runtime in whole multiples of five minutes are not named, and no reviewer is asked to check the patterns the owner has already rejected. The accepted specification still states eight dimensions and a floor of 90, although the declaration has held 95 since 2026-11-03. The ETHOS film and the DDWG essentials film adopted the same twelve dimensions and the rejected-pattern check on 2026-11-05.

## What Changes

- `content/film.toml` declares twelve review dimensions, each stating what an excellent film shows: faithfulness, concept fidelity, narrative clarity, language quality, voice quality with a measured clarity floor, narration performance, pronunciation, visual explanation and motion, composition and typography, visual aesthetics and colour, sound-picture continuity, and credits and delivery craft. Both floors stay at 95.
- `content/review/prompt.md` lists the patterns the owner has rejected in earlier editions; any occurrence is a material finding in the dimension it names.
- The review requirement states the declared dimensions, the 95 floors and the rejected-pattern check.
- The published 1.2.0 films are reviewed again under the twelve dimensions. Round 30 scored the Chinese edition 94.2 and the English 94.4: language quality 88 and 87, and visual aesthetics and colour 86 and 88, each with a material finding of a pattern the owner rejected. The films are therefore repaired and published as edition 1.3.0:
  - The narration drops the spoken table of contents of 01 and the signpost that opens 26, names the guidelines where 02 first needs them, explains a cache and a generated view where the Chinese first says them, and says 30.2 to 30.4 plainly. The changed thoughts are narrated again, and each edition still lasts 1500 s.
  - Every text at rest stands at 4.5:1 or more against the ground: a spoken list marks the item being spoken without dimming the named items below that contrast, a refused name keeps its ink and its cross, and the report cards and the running head rise to legible ink.
  - The English labels of 09.3 and 22.1–22.2 name their questions and conditions in full, and the working loop of 18.1 ends its arcs in quiet points.
- Release 1.3.0 publishes the repaired films with their reviews.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `film-production`: the final film's review scores every declared dimension at 95 or above and checks the patterns the owner has rejected, and every text the picture holds at rest stands at 4.5:1 or more against the ground.

## Impact

`content/film.toml`, `content/review/prompt.md`, the review requirement and a new legibility requirement; both scripts, casts, narration mirrors and the review readings; the recordings of the changed thoughts; `picture/film.js`; `content/release.json`, `VERSION`, `CHANGELOG.md` and `README.md`. The engine and supply are unchanged.

# Proposal

## Why

On 2026-11-05 the owner asked that every film carry criteria that describe an excellent film, and that each of them score at least 95. The DDWG films are judged on nine dimensions that predate the owner's later rejections: voice clarity, plain spoken language and the colour of the picture are not scored on their own, the opening title card and a runtime in whole multiples of five minutes are not named, and no reviewer is asked to check the patterns the owner has already rejected. The accepted specification still states eight dimensions and a floor of 90, although the declaration has held 95 since 2026-11-03. The ETHOS film and the DDWG essentials film adopted the same twelve dimensions and the rejected-pattern check on 2026-11-05.

## What Changes

- `content/film.toml` declares twelve review dimensions, each stating what an excellent film shows: faithfulness, concept fidelity, narrative clarity, language quality, voice quality with a measured clarity floor, narration performance, pronunciation, visual explanation and motion, composition and typography, visual aesthetics and colour, sound-picture continuity, and credits and delivery craft. Both floors stay at 95.
- `content/review/prompt.md` lists the patterns the owner has rejected in earlier editions; any occurrence is a material finding in the dimension it names.
- The review requirement states the declared dimensions, the 95 floors and the rejected-pattern check.
- The published 1.2.0 films are reviewed again under the twelve dimensions, and release 1.3.0 publishes those reviews. The films do not change unless a dimension falls below 95, in which case they are repaired and published as a new edition.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `film-production`: the final film's review scores every declared dimension at 95 or above and checks the patterns the owner has rejected.

## Impact

`content/film.toml`, `content/review/prompt.md`, the review requirement, `content/release.json`, `VERSION`, `CHANGELOG.md` and `README.md`. The scripts, recordings, picture, engine and supply are unchanged.

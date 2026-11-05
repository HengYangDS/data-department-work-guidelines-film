# Design

## Context

The owner's requirement of 2026-11-05 applies to every film: each carries criteria that state what an excellent film shows, and every one of them scores at least 95. The ETHOS film and the DDWG essentials film adopted twelve dimensions and a list of the patterns the owner has rejected on the same day; this film declares nine dimensions and asks no reviewer to check those patterns.

The 1.2.0 editions were published on 2026-11-04 after review round 29, which scored the Chinese edition 96.1 and the English edition 95.9 with every one of the nine dimensions at 95 or above. Their properties that the new dimensions name are measurable on the published files:

- Voice clarity, as the median cepstral peak prominence over the loud speech frames of each soundtrack (frames within 18 dB of the 95th-percentile frame energy, 16 kHz mono, 1024-sample Hann frames with a 256-sample hop, quefrencies 1/400 to 1/60 s): 20.3 dB in Chinese and 17.9 dB in English. The ETHOS film's current Chinese narration, made from the breathy identity root and heard by the owner as hoarse, measures 15.8 dB by the same method.
- The picture stands on the neutral ground `#0F1519` from the title card to the credits, and the smallest text, the synthetic-voice notice of the closing card, has a contrast of about 7.5:1 against it.
- Each edition opens on its title card, closes on its signature and lasts 1500 s, five times five minutes.

## Goals / Non-Goals

**Goals:**

- One set of criteria across the three films, each dimension describing an excellent film.
- The patterns the owner has rejected are checked by every reviewer.
- The published films are judged under those criteria, and the result is published with the films.

**Non-Goals:**

- Changing the films' text, recordings or picture unless the review finds a dimension below 95.
- A native clarity measurement in the engine; the reviewers measure it by the stated method until `filmkit` measures it.

## Decisions

### 1. The same twelve dimensions as the other two films

The dimensions carry the keys of the ETHOS and essentials films, so that one contract is read across the three films. Language quality, voice quality and visual aesthetics and colour become dimensions of their own: plain spoken language was scored inside pronunciation, voice clarity inside narration performance, and colour inside typography, where a strong neighbour could hide a weak quality. Faithfulness keeps this film's subject, the seven documents with their conditions and boundaries, and typography keeps the measured layout rules of 2026-11-03.

### 2. Voice quality is measured

The floors are 18.5 dB in Chinese and 17 dB in English: below the clear narrations this film already has, 20.3 dB and 17.9 dB, and well above the 15.8 dB of the narration the owner rejected as hoarse. The English narrations of the three films all measure about 18 dB, so English has its own floor. The measure selects frames by their energy relative to the loudest speech, so pauses do not lower it. The prompt states the method, and each reviewer measures it on the files under review.

### 3. Rejected patterns are material findings

The prompt lists nine patterns the owner rejected in earlier editions of these films, each with the dimension it fails: lists that slide or erase their items, ragged text, swallowed phrase tails, a hoarse voice, a colour cast or low contrast, a missing title card, a concept rendering that narrows its concept, machine-sounding phrasing and a runtime that is not a whole multiple of five minutes. A reviewer checks each one on the media and says what was checked; any occurrence is a material finding, which the verifier refuses.

### 4. The published films are reviewed again

The review round binds the published films by their release hashes. The context it needs, the timelines, recordings and measurements, comes from a rebuild of this head, which `film:compare` must first prove equivalent to the release. The round prompts state the change of contract and that the films are unchanged since round 29.

### 5. Release 1.3.0 publishes the reviews

A changed contract with unchanged films follows the precedent of 1.1.0: the release does not publish its films again. Release 1.3.0 publishes the two new production reviews and its `SHA256SUMS`; its manifest names the 1.2.0 films with their unchanged hashes, and the README's comparison downloads the 1.2.0 assets and then the 1.3.0 assets over them. If a dimension falls below 95, the repair replaces this decision with a new edition of the films.

## Risks / Trade-offs

- [The English voice sits 0.9 dB above its floor] → The floor follows the clear English reference; a reviewer's measurement below it is a material finding that a new recording, not a lower floor, resolves.
- [The stricter criteria find a defect in the published films] → The repair is part of this Change and its films become a new edition.
- [The reviewers' clarity method could drift from the stated one] → The prompt states every parameter; a native measurement in the engine follows.

## Migration Plan

Declare the criteria, rebuild and compare, review the published films, record the reviews in release 1.3.0, prove, land on `dev`, publish on GitHub and archive the Change. Rollback reverts the declaration; the 1.2.0 release and its reviews stay published.

## Open Questions

None.

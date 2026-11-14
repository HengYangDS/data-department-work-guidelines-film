## 1. Specification

- [x] 1.1 Amend the three requirements so that they name each edition's four films and both staged picture documents; done when `openspec validate refine-edition-1-3-1 --strict` passes and every asset a scenario names is listed in `content/release.json`.

## 2. Reproduction

- [ ] 2.1 Rebuild release 1.3.0 from an anonymous clone of the `v1.3.0` tag that holds no earlier output, by the README's steps, and compare it with the published assets; done when the reproduction report lists a minimum for each of the eight films.
- [ ] 2.2 Inspect each film's lowest frames side by side and record its floor in `content/release.json` at or below the measured minimum; done when the comparison passes against the recorded floors.

## 3. Engine

- [ ] 3.1 Adopt the `filmkit` release that offers thought levelling, typeset timeline text, clarity frame assignment as prompted, the glide and stopped-end gates, the transient test of the two masters and the row-gap probe (depends on that release); done when `pyproject.toml` and `uv.lock` pin it and `mise run check` passes.
- [ ] 3.2 Declare the film's thought-level tolerance (Z40-2, EN40-7); done when the assembled soundtracks show no step at or above 1.0 LU inside a segment and none above 1.2 LU across a pause.

## 4. Text

- [ ] 4.1 Ask the owner of the guidelines what "critical management chains" covers and how the sentence behind 21.2 reads (Z40-6, EN40-2); done when the answers are recorded here and the film's wording follows them or keeps the faithful term.
- [ ] 4.2 Adopt the complete bilingual text of the changed thoughts: the charter's two clauses (Z40-4), the three qualifiers (EN40-1), 14.2's verb (EN40-4), the split of 11.10.1 (EN40-8) and 07.6.2 (EN40-10); done when each is read against its source lines, an independent recheck judges it clear on first hearing, and the readings and concept checks pass.

## 5. Voice

- [ ] 5.1 Narrate the thoughts that task 4.2 changes; done when their takes pass the release checks.
- [ ] 5.2 Retake the English 13.2 against pair references that separate (EN40-3); done when the pairs verdict holds with at least three of four references separated and recognition writes the intended word.
- [ ] 5.3 Audition the English 17.1 and 21.4 for pace and 14.4 for its phrase end (EN40-5, EN40-6); done when the notes' rate lines hold and the engine lists no stopped phrase end.
- [ ] 5.4 Raise the English segment 08 with a clean 08.1 take (EN40-11); done when the soundtrack and every segment read at least 17.0 dB and segment 08 at least 17.2 dB.
- [ ] 5.5 Listen to the Chinese 18.3 and 21.2 and narrate them again only if the wrong syllable is heard (Z40-3); done when the listening result is recorded here.
- [ ] 5.6 Fit both soundtracks; done when each is exactly 1500 seconds with natural phrase ends and thought pauses.

## 6. Picture

- [ ] 6.1 Balance the opening of 15.1 in the Chinese edition (Z40-1); done when no run beyond 50 px lasts longer than 1.0 s there.
- [ ] 6.2 Set the eight labels of Z40-5 in the voice's words or declare them in the design; done when the picture-sync audit matches each label to its words or lists it as declared.
- [ ] 6.3 Lower the glide peak to 420 px/s with each glide timed by its distance (Z40-7, EN40-12); done when the motion audit shows every stage glide and flow at or under 450 px/s.
- [ ] 6.4 Centre the nine finished stages of EN40-14 where no shown name has to move; done when every rest stands within 30 px.
- [ ] 6.5 Give neighbouring names on one row a clear gap (EN40-16); done when no gap between two names on a row is under 48 px at 1080p.
- [ ] 6.6 End each reading run of 21.2 by its tick or its thought's last word (EN40-17); done when no run is visible after 21.2.6's last word unless it stands at its box.
- [ ] 6.7 Run the picture audits on both staged editions, with the two masters' transient test (EN40-13) and the typeset timeline (EN40-9); done when `mise run film:picture` reports no gated finding before its first render.

## 7. Edition

- [ ] 7.1 Set the version to 1.3.1 and record the edition in the Changelog; done when `mise run check` passes in a checkout that holds no build.
- [ ] 7.2 Build both editions; done when `mise run film:build` ends with every film verified.
- [ ] 7.3 Obtain an independent review of each edition; done when every dimension is at 95 or above and no material or minor finding stands.
- [ ] 7.4 Deliver the reviewed editions; done when the delivery reads back from Documents.
- [ ] 7.5 Record the 1.3.1 assets in `content/release.json`; done when `tests/delivery/test_release.py` passes against the staged release folder.

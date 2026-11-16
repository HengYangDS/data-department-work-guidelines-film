## Why

Release 1.3.0 published the films that review round 40 accepted: Chinese 98.8 and English 96.6, with no finding and twenty-four notes, seven on the Chinese edition and seventeen on the English one. The owner asked that notes are repaired, not set aside. The release also left the films' reproduction unproved from a clean checkout: its comparison ran beside the production build, and the hosted runs of the tag showed that a check which passes beside a build can fail without one. That rebuild is made on this edition's own tag by the Change that follows it.

The notes are recorded, each with its observation, repair and reverification line, in the review records that release 1.3.0 publishes, `ddwg-zh-production-review.md` and `ddwg-en-production-review.md`, under the ids Z40-1 to Z40-7 and EN40-1 to EN40-17. This Change cites them by id and does not copy them.

## What Changes

- The text says what five notes found missing or hard on first hearing: the charter's two clauses in both languages (Z40-4), three qualifiers of the source's checklists (EN40-1), a verb for the items of 14.2 (EN40-4), the split of 11.10.1 (EN40-8) and the idiom of 07.6.2 (EN40-10), each within the edition's runtime and rechecked independently.
- Two questions go to the source's owner, and the film follows the answers: what "critical management chains" covers (Z40-6) and the reading of the sentence that 21.2 renders (EN40-2).
- The voice gains clean takes where notes heard a word form, a brisk sentence, an abrupt phrase end or a segment near the clarity floor (EN40-3, EN40-5, EN40-6, EN40-11); 18.3 and 21.2 are narrated again only if listening hears the wrong syllable (Z40-3).
- The picture balances 15.1's opening (Z40-1), names eight labels in the voice's words or declares them (Z40-5), centres nine finished stages (EN40-14), gives neighbouring names on a row a clear gap (EN40-16) and ends 21.2's reading run before the quiet (EN40-17).
- Glides are timed by their distance under a lower peak (Z40-7, EN40-12).
- The soundtracks, captions and comparisons are made on the engine release that levels each thought within a declared tolerance, typesets the timeline text, assigns clarity frames as its prompt states, gates glides and stopped phrase ends, tests the two masters for one-frame transients and probes row gaps (Z40-2, EN40-6, EN40-7, EN40-9, EN40-11, EN40-12, EN40-13, EN40-16).
- Round 41 reviewed the first build and did not pass it: one minor finding in Chinese and two material findings in English. A second build repairs them: no chapter title travels (EN41-11, Z41-4), a stroke that draws on is whole when its thought's voice rests (Z41-1), names on a rail's two baselines stand clear of each other (Z41-3), two English sentences say what a first hearing needs (EN41-7), and the English thoughts under the clarity floor take clearer takes, with the line for a single thought put to the owner (EN41-1).
- The requirements name the four films and both staged picture documents that each edition publishes.

The films stay 1500 seconds, with the same narrator, chapters and argument. The result is edition 1.3.1.

Out of scope: the faint non-text marks of EN40-15, which meet their contrast line and need no repair unless such a mark comes to carry meaning; the engine's release itself, which `filmkit` owns; the rebuild from a clean checkout, which the Change that follows this edition makes on the `v1.3.1` tag.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `film-production`: the media requirement names the four films of each edition.
- `film-publication`: a release carries four films per edition and records both staged picture documents.
- `film-reproduction`: the comparison covers both staged picture documents of each edition.

## Impact

- `content/film-script.json`, `content/en/film-script.json`, the narration texts and both casts, which are film-bound sources: their digests, the release manifest and every review binding change with them.
- `picture/film` for the scenes the notes name and the glide timing, and the picture tests that pin them.
- `pyproject.toml`, `uv.lock` and `content/film.toml` for the engine release and its declared values.
- `content/release.json` for the new assets.
- Both editions are narrated where their text or cast changes, rendered and reviewed again; release 1.3.0 stays published as it is.

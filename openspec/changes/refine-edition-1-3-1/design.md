## Context

Edition 1.3.0 passed review round 40 without a finding. This Change repairs that round's notes and proves the release's reproduction from a clean checkout. The film's method, narrator, runtime and argument do not change, so the design of the Change that adopted the excellence criteria still describes the film; this document records only the decisions that the repairs need.

## Goals / Non-Goals

**Goals:**

- Repair every note of round 40 that the film owns, each against its own reverification line.
- Take from the engine the measures and gates that eight notes were deferred to, by adopting its release.
- Calibrate the picture floors with a rebuild that owes nothing to the production build.

**Non-Goals:**

- No change of what the guidelines say: a question about the source goes to its owner, and the film follows the answer.
- No film-local substitute for a measure or gate the engine owns.

## Decisions

1. **The published review records own the notes.** Tasks cite a note by its id; the observation, repair and reverification lines are read in the review records of release 1.3.0. A copy in this Change would be a second record that could drift.
2. **Text is settled before any narration.** The complete bilingual text of every changed thought is adopted, read against its source lines and rechecked independently for first hearing before a take is made. The English additions must fit the 0.60 s the edition has free and what the split of 11.10.1 and the shorter idioms release; a clause that does not fit waits and stays declared.
3. **A source question is the source owner's.** 14.3 keeps the faithful term and 21.2 the contract's words until the owner of the guidelines answers; the film does not resolve the source's ambiguity on its own.
4. **A retake needs evidence that it is nearer.** 13.2 is retaken only against pair references that separate; 18.3 and 21.2 only if listening hears the wrong syllable. Auditions for pace and phrase ends are judged by the notes' own measures within the edition's runtime.
5. **Labels use the voice's words or are declared.** Each of the eight labels of Z40-5 is either set in the words spoken at its moment or listed in the design with its reason; the picture-sync audit then judges every label.
6. **Glides are timed by distance.** The glide peak falls to 420 px/s and each glide takes the time its distance needs, checked by the engine's glide gate against the 450 px/s line of the notes.
7. **A row keeps a minimum gap between names.** Neighbouring names on one row stand at least four word spaces apart; long names wrap over two lines or the row's pitch widens. The engine's geometry check probes the gap, so the rule does not rest on a review script.
8. **Engine measures come from the engine.** Thought levelling, typeset timeline text, clarity frame assignment, the stopped-end gate and the transient test of the two masters are adopted with the `filmkit` release that offers them, and the film declares its values in `content/film.toml`.
9. **The floors come from a clean checkout.** The rebuild that calibrates them is made from an anonymous clone of the `v1.3.0` tag with no earlier output, following the README.

## Risks / Trade-offs

- The English edition has little free time. → Runtime is fitted from gaps and commas as before, never by deleting necessary punctuation or forcing pace; a clause that cannot fit stays a declared note.
- The engine release may change bytes of the soundtrack beyond the notes' thoughts. → The release checks and continuity measures run on the whole soundtrack, and both editions are reviewed again.
- Lower glide peaks lengthen moves and can push a change into a thought pause. → Each retimed glide keeps the quiet-join rule, and the motion audit runs on both editions before any render.
- The clean rebuild could show a film below its recorded floor. → The manifest then records the measured floor after the lowest frames are inspected side by side, as the reproduction requirement says.

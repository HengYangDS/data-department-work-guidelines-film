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
2. **Text is settled before any narration, and the English additions are taken in the order the runtime allows.** The complete bilingual text of every changed thought is adopted, read against its source lines and rechecked independently for first hearing before a take is made. The two editions have different room. In release 1.3.0 the English gaps already stand at their lower bounds (22 paragraph gaps of 1.01 s, 7 chapter gaps of 1.84 s) and its 130 thought pauses average 0.83 s, so every added English second has to come from text that gets shorter or from thought pauses; the Chinese gaps stand about 17 s above their bounds (paragraph gaps of 1.43 s against 1.1 s, chapter gaps of 3.32 s against 2.0 s). The repairs the notes ask for add about 37 English words, some 14 s. They are therefore taken in this order, each only while the fitted soundtrack keeps its thought pauses within the declared range and its boundary rule: the idiom of 07.6.2 reworded at equal length (EN40-10); the three qualifiers (EN40-1); the split of 11.10.1, which removes a picture cut inside a sentence (EN40-8); the verbs of 14.2 (EN40-4); the charter's two clauses (Z40-4). A clause that does not fit stays a declared note in both languages, so that the editions say the same things.
3. **A source question is the source owner's.** 14.3 keeps the faithful term and 21.2 the contract's words until the owner of the guidelines answers; the film does not resolve the source's ambiguity on its own.
4. **A retake needs evidence that it is nearer.** 13.2 is retaken only against pair references that separate; 18.3 and 21.2 only if listening hears the wrong syllable. Auditions for pace and phrase ends are judged by the notes' own measures within the edition's runtime.
5. **Labels use the voice's words or are declared.** Four of the eight labels of Z40-5 are set in the words spoken at their moment (07.7 只找对自己有利的证据, 11.6 偏差还可能藏在别的地方, 14.4 上报、交给人接管或停下, 24.3 汇报、答复、写纪要和上报). Four are declared: 22.1 成员和智能体 and 22.4 智能体 name the film's recurring figures where neither voice names an actor; 22.2 再做下去有害 is the kind's name within its rail's wrap, with the four harms drawn as its marks on their words; 29.8 什么情况回滚 is shortened because the voice's words repeat the caption cue 什么情况下回滚。 whole, which the caption-echo gate refuses.
6. **Glides are timed by distance.** The glide peak falls to 420 px/s and each glide takes the time its distance needs, checked by the engine's pace measure against the 450 px/s line of the notes. What stays faster is of three kinds: a move bounded by its words (10's price must land before the first moment's name, 21's seal moves onto the action at the thought's last words, where a longer glide would run into the quiet); a mark that rides a stroke's drawing tip or a frame whose ends move (11, 14, 15, 19, 23, 29); and two moves that compound (13, 17, 21). Each is recut where the words allow or declared with its reason once the staged picture's motion audit lists it.
7. **A row keeps a minimum gap between names.** Neighbouring names on one row stand at least four word spaces apart; long names wrap over two lines or the row's pitch widens. The engine's geometry check probes the gap, so the rule does not rest on a review script.
8. **Engine measures come from the engine.** Thought levelling, typeset timeline text, clarity frame assignment, the stopped-end gate and the transient test of the two masters are adopted with the `filmkit` release that offers them, and the film declares its values in `content/film.toml`.
9. **The floors come from a clean checkout.** The rebuild that calibrates them is made from an anonymous clone of the `v1.3.0` tag with no earlier output, following the README.

## Risks / Trade-offs

- The English edition has little free time. → Runtime is fitted from gaps and commas as before, never by deleting necessary punctuation or forcing pace; a clause that cannot fit stays a declared note.
- The engine release may change bytes of the soundtrack beyond the notes' thoughts. → The release checks and continuity measures run on the whole soundtrack, and both editions are reviewed again.
- Lower glide peaks lengthen moves and can push a change into a thought pause. → Each retimed glide keeps the quiet-join rule, and the motion audit runs on both editions before any render.
- The clean rebuild could show a film below its recorded floor. → The manifest then records the measured floor after the lowest frames are inspected side by side, as the reproduction requirement says.

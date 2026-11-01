# Tasks

## 1. Sources and concepts

- [ ] 1.1 Re-pin `content/source-manifest.json` to the guidelines' v8.0.0; verify each digest against a clone and that the seven guideline documents are byte-identical to the previously pinned commit.
- [ ] 1.2 Write `content/concepts.toml` from the concept table the user approved on 2026-11-01, with each sense's exact passage at the pinned commit and the faithful renderings of the improve-film-intelligibility glossary; verify that the `filmkit` concept check finds every quotation in its pinned document.

## 2. Engine

- [ ] 2.1 Depend on the `filmkit` release that checks concept contracts and readings, through its uv Git source and tag; verify that `uv sync --frozen` installs it and that `mise run check` passes.

## 3. Script repair

- [ ] 3.1 Apply the repairs of both editions in the design's audit table, keeping each repaired thought within its measured place, and declare each segment's concept senses; verify that the concept check passes on both scripts and that no unrepaired thought changed.
- [ ] 3.2 Pass an independent term audit of both scripts against the guidelines and the contract, with no material finding; verify that the audit binds both scripts' SHA-256.
- [ ] 3.3 Have the user approve the repaired text and record the decision; verify that the record names both scripts' SHA-256.

## 4. Narration and sound

- [ ] 4.1 Declare every ambiguous Chinese reading and every name's spoken form in the pronunciation contract, and audition each new declaration; verify that the coverage check passes.
- [ ] 4.2 Narrate the repaired thoughts and select their takes under the existing cast; verify that every new take ends on its own, matches its text by recognition and keeps its pauses within the declared caps.
- [ ] 4.3 Check every occurrence of a declared reading or name across both editions against its approved reference, and retake each mismatch; verify that the occurrence check passes.
- [ ] 4.4 Assemble each soundtrack and its captions at exactly 1500 seconds; verify the runtime, the program loudness and the caption timing.
- [ ] 4.5 Have the user listen to the repaired thoughts in context and record the decision; reopen 3.1 or 4.2 for a requested change.

## 5. Picture

- [ ] 5.1 Change the picture's labels and cue words for every repaired term, in 01, 03 and the chapter 19 to 22; verify the composition tests, the concept check on picture labels, and the geometry, still, motion and sync audits.
- [ ] 5.2 Render a 10 fps draft and scan its stills at both phases; verify that no frame shows a collision, clipping or a blank picture under speech.

## 6. Render, review and delivery

- [ ] 6.1 Render, package and verify both editions; verify the technical checks and that the tracked tree is unchanged.
- [ ] 6.2 Pass the independent production review of the exact build at 90 or more overall and in every declared dimension, concept fidelity among them; a fixed build is reviewed again.
- [ ] 6.3 Deliver both editions to `~/Documents/ddwg-introduction-film/` and read them back; verify every delivered file's SHA-256, both players in a real browser, and that each replaced v1.1.0 file lies in the rollback copy.
- [ ] 6.4 Record the user's acceptance of the delivered films; verify that the record names both editions' delivered films, and keep the rollback copy until it exists.

## 7. Release preparation

- [ ] 7.1 Set `VERSION` to 1.2.0, write the CHANGELOG entry, record the release manifest from the accepted films and verify a rebuild against it with `film:compare`; prepare the release folder with `SHA256SUMS` without publishing.

## Workflow follow-up

- Archive the Change, prove the archived head once, run the film gates on it, land it and close out.
- After the user confirms: publish `dev` and `main` to GitHub, tag `v1.2.0` and upload the release; then read back every asset and `SHA256SUMS`.
- Form the essentials film's own repository from the outline the user approved on 2026-11-01, with this contract and narrator.

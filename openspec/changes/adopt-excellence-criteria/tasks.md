# Tasks

## 1. Criteria

- [ ] 1.1 Declare the twelve review dimensions in `content/film.toml`, each stating what an excellent film shows, with both floors at 95; verify that the declaration loads and that the round prompt renders all twelve for both editions.
- [ ] 1.2 Add the patterns the owner has rejected to `content/review/prompt.md`, each with the dimension it fails and the clarity method stated in full; verify that `mise run check` passes.
- [ ] 1.3 State the review requirement in the specification delta; verify `openspec validate adopt-excellence-criteria --strict`.

## 2. Review of the published films

- [ ] 2.1 Rebuild both editions with `film:build` and compare them with the 1.2.0 release assets with `film:compare`; verify that the report passes.
- [ ] 2.2 Review both editions under the twelve dimensions on the published films; verify that every dimension and the mean are at least 95, that every rejected pattern is reported as checked and that no material finding remains.
- [ ] 2.3 Record both reviews; verify that the film-media verifier accepts each for its published film.

## 3. Release and landing

- [ ] 3.1 Prepare release 1.3.0: `VERSION`, the CHANGELOG entry, the README's comparison and `content/release.json` naming the 1.2.0 films and the new reviews; verify `film:compare` against the release folder.
- [ ] 3.2 Run the full proof on the final head and land it on `dev`; verify the landed head on GitHub.
- [ ] 3.3 Publish release 1.3.0 with the two reviews and `SHA256SUMS`; verify each asset's digest on GitHub against the manifest.
- [ ] 3.4 Archive the Change and retire the Work Lane; verify that the evidence the CHANGELOG cites is in the canonical checkout's `build/evidence/`.

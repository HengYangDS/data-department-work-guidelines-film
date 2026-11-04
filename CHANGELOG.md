# Changelog

All notable changes to the DDWG introduction films and their build are recorded here. The format follows [Keep a Changelog 1.1.0](https://keepachangelog.com/en/1.1.0/), and releases follow [Semantic Versioning 2.0.0](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.2.0] - 2026-11-04

### Added

- `CONTRIBUTING.md`: how to prepare the tools, change the films in an ETHOS Work Lane, verify a change, rebuild and compare the films, commit, and cut and publish a release.
- `content/concepts.toml`, the films' concept contract. It binds each concept of the guidelines that the films name to its passage at the pinned commit, its essence and one rendering per edition, such as 行动依据 and "authority to act", 事实依据 and "authority about facts", and 决策负责人 and "decision owner". The `filmkit` concept check refuses every rendering the contract avoids, in the narration, the captions and the picture's labels, and the review scores concept fidelity as its own dimension.

### Changed

- Both editions are repaired wherever a rendering narrowed a concept of the guidelines. The Chinese edition no longer asks 谁说了算 for the authority to act or calls the decision owner 有决定权的人, and its collaboration chapter is now 人与人工智能怎样协作 instead of 人与智能体怎样协作; the English edition names the authority to act and the authority about facts where it said "who decides" and "what counts as fact", and its chapter is now "Human–AI collaboration" instead of "Working with Agents". The repair changes 29 Chinese and 14 English thoughts and the Chinese titles of 03, 04, 09 and 14; every other thought keeps its v1.1.0 recording, and each edition still runs exactly 1500 seconds, with its soundtrack at −16.5 LUFS.
- The pronunciation contract declares the reading of 250 Chinese words over all 1,373 of their occurrences, and each occurrence was checked against an approved reference.
- The source manifest pins the guidelines at v8.0.0 (`b9da15d`), whose seven guideline documents are byte-identical to the previous pin `2c59ac0`.
- The picture's labels and cue words follow the repaired terms, and the reviews' findings are fixed: the Chinese order of authority to act ranks the owner's explicit decision, never the owner alone; the English refusals of 17.3 stand on one table that grows about the content centre; and the grid of 06.2 no longer stands high over an empty band, while the inference's premise is shown on its case as it is said.
- The picture's text is aligned and tidy, as the owner required on 2026-11-03, by layout alone; the narration and captions are unchanged. The shared naming code sets rail stations at one pitch whenever their names fit, centres each refusal with its cross and hangs line-final marks; in every scene the names of a row stand on one baseline, cards keep equal padding, labels stand clear of their marks, and a cross after a Chinese closing quotation mark follows the mark's ink. Every settled stage stands within 50 px of the content centre, and every build-up shown for 1.5 s or more within 90 px.
- Every review dimension must score at least 95: the verifier refuses a review whose overall score or any dimension falls below 95.
- The independent review of the films rendered from that composition scored the Chinese edition 96.1 and the English edition 95.9, with every dimension, concept fidelity among them, at 95 or above and no material or minor finding.
- The repository is now `data-department-work-guidelines-film`, titled "Data Department Work Guidelines: Film", so that its name corresponds to the guidelines' own repository; the old address redirects.
- The repository runs ETHOS 0.2.0-alpha.28, and its CI workflow uses `jdx/mise-action` 5.2.5.
- The films are built by `filmkit` 0.5.0, which renders with HyperFrames 0.9.5, and the supply moves to its latest stable releases: Node 26.13.0, uv 0.13.6, hatchling 1.33.0, coverage 7.17.0, pytest 9.2.0 and Mise 2026.10.25 in CI, with both locks at the newest releases their declarations admit. The speech engine stays at mlx-audio 0.5.8 and MLX 0.32.3, so every thought the repair leaves unchanged keeps its recording.

## [1.1.0] - 2026-10-31

### Changed

- The films are built by the published `filmkit` 0.1.0 release, which `pyproject.toml` pins by its tag `v0.1.0` and `uv.lock` by its commit, instead of the engine copy in `src/filmkit`. Every other locked package keeps its version. The declaration names the fonts the picture stages and the listening plan's readings, which `content/review/readings.json` holds, and the Mise tasks run the Node tools through `python -m filmkit.tools`.
- A rebuild with filmkit 0.1.0 on an Apple M5 Max reproduces the published `1.0.0` editions: every soundtrack, staged picture document, caption, transcript and cover is byte-identical, and each film has the published frame count, decoded audio and container, with every frame at or above the 45 dB PSNR floor; the lowest frame measured 51.6 dB.
- The portable proof runs the film's Python checks as the `film-checks` gate, because the repository no longer holds production Python for them to test, and measures the composition tests' coverage of `picture/film.js` alone.

### Removed

- `src/filmkit` and the engine's tests, which filmkit carries with its sample film. The film keeps the tests of its own composition, narration receipts, release manifest, declaration and players.

## [1.0.0] - 2026-10-30

### Added

- The Chinese and English introduction films to the Data Department Work Guidelines at commit `2c59ac0`, each exactly 1500 seconds at 60 fps, as accepted on 2026-10-28. The independent review scored each edition 95.9, with every dimension at 95 or above. Each edition is published as a UHD master and a captioned 1080p film, with SRT and WebVTT captions, a transcript, a cover and its review record, and `SHA256SUMS` lists every asset. Each Chinese film carries two one-frame encoding glitches, at 8:55.35 and 10:42.65, that are invisible at normal speed and that a rebuild does not reproduce.
- The `filmkit` engine and the Mise tasks that rebuild both editions from the tracked sources: `film:supply` installs the pinned browser build and speech models, `film:build` narrates, assembles, renders, packages and verifies both editions offline, and `film:compare` compares a rebuild with the published release.
- A rebuild on an Apple M5 Max reproduces the published editions: every soundtrack, caption, transcript, cover and staged picture document is byte-identical, and each film has the published frame count, decoded audio, streams, chapters and tags, with every frame at or above the 45 dB PSNR floor; the lowest frame measured 51.5 dB.
- ETHOS governance, with its portable proof projected into GitHub Actions.
- The MIT License for the code and CC BY 4.0 for the films' content, with the third-party notices and the narrator's provenance in `NOTICE`.

[Unreleased]: https://github.com/HengYangDS/data-department-work-guidelines-film/compare/v1.2.0...HEAD
[1.2.0]: https://github.com/HengYangDS/data-department-work-guidelines-film/releases/tag/v1.2.0
[1.1.0]: https://github.com/HengYangDS/data-department-work-guidelines-film/releases/tag/v1.1.0
[1.0.0]: https://github.com/HengYangDS/data-department-work-guidelines-film/releases/tag/v1.0.0

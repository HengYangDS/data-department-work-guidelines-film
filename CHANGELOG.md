# Changelog

All notable changes to the DDWG introduction films and their build are recorded here. The format follows [Keep a Changelog 1.1.0](https://keepachangelog.com/en/1.1.0/), and releases follow [Semantic Versioning 2.0.0](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.3.0] - 2026-11-13

### Added

- Each edition also comes without captions, as a UHD master and a 1080p film, whose picture is staged with no captions, and the player's captions control switches between the films with and without captions, keeping its place. The release publishes all four films of each edition with their SRT and WebVTT captions, transcript, cover and review records, and `SHA256SUMS`: 21 assets, where 1.2.0 published 17.
- Each film names its version in its QuickTime Information key, as 版本号 1.3.0 or Version 1.3.0, and so do the entry page and each player page; the verifier refuses a film or page made under another version.
- The review prompt lists the fourteen patterns the owner rejected in earlier editions, such as a hoarse voice or a mark that pops outside a stage cut. Reviewers check each on the media, and any occurrence is a material finding, which the verifier refuses.

### Changed

- The independent review judges each edition on twelve dimensions, where it judged nine: language quality, voice quality, and visual aesthetics and colour are scored on their own, and voice quality has a clarity floor of 18 dB in Chinese and 17 dB in English. Every dimension and the overall score must still reach 95, and each of the owner's three levels, 信, 达 and 雅 (faithful, conveyed and graceful), must pass. Under these criteria, round 30 scored the 1.2.0 films 94.2 in Chinese and 94.4 in English, with material findings in language quality and in visual aesthetics and colour, so this release repairs both editions.
- The opening no longer lists the parts the film will cover. Independent audits read every thought against the guidelines at `b9da15d`, and the text restores what they and the reviews found missing from a list, condition or scope, such as the seven traps of the guideline on decisions, all named in 07. Where the guidelines mean the department's work system, the Chinese says 工作体系, since a listener hears 系统 as a software or data system, and the English says "work system".
- The narration is trimmed so its pauses can be natural within 1500 seconds: the Chinese falls from 7,671 to 7,247 Han characters and the English from 4,508 to 4,217 words, each edition losing the last thought of 06, 22 and 23, and no English sentence has more than 30 words. Seven Chinese and three English segment titles change.
- The changed thoughts, and some whose takes a review flagged, are narrated again; every other thought keeps its recording, since the voice and the speech engine, mlx-audio 0.5.8 and MLX 0.32.3, are unchanged. Each edition still runs exactly 1500 seconds at −16.5 LUFS.
- A stage cut replaces its content, and a picture that keeps its marks moves them. Stages cut on a thought's first words or on those of a sentence or clause that turns to the next example, list or answer, with four declared exceptions.
- Text blocks break evenly, no line under four fifths of the longest and no last line under three fifths, and a wrapped English label breaks at a phrase; only the English 04.7 is declared against the rule. A mark stands at most 0.6 s before its name, and every thought's picture at rest stands within 40 px of the content centre.
- Each picture is drawn in Chrome's software rasterizer, because the GPU rasterizer drew one-frame faults into Chinese glyphs in renders of this edition. Before packaging, the engine compares each edition's two pictures at every frame and refuses a one-frame fault; it found none in the 90,000 frames of either edition.
- The player saves the transcript, chapter files and captions without leaving the page and opens every film and cover link in a new tab.
- Review round 39 scored the Chinese edition 98.8 and the English edition 96.7, with every one of the twelve dimensions at 96 or more, each of 信, 达 and 雅 passing and no material or minor finding. Its 7 Chinese and 15 English notes are listed in the published review records, `ddwg-zh-production-review.md` and `ddwg-en-production-review.md`.
- The films are built by `filmkit` 0.21.0 instead of 0.5.0 and rendered with HyperFrames 0.9.9 instead of 0.9.5; fontTools 4.68.0 and snowballstemmer 3.1.1 join the lock, every other locked package keeps its version, and Node moves from 26.13.0 to 26.13.1, a security release.

### Removed

- `content/player.html` and `content/en/player.html`: the engine renders each edition's player from the declaration, which holds its summary and colours.

### Fixed

- Round 30 measured dimmed list items, refused names, report-card values and the running head of the 1.2.0 films below 4.5:1 against the ground. Every text and accent mark at rest stands at 4.5:1 or more, and the engine's picture check refuses text at rest below that.
- The English labels of 09.3 and 22 say what they name: "Mean" beside a table of prices read as the statistic, and "You find work" and "Continuing" had lost their clauses. They now read "Its meaning", "Unrecognized work" and "Continuing would harm".
- Flow dots, turning icons and the camera's slow move stopped and started within one frame at every thought, which the owner saw as a stutter; the picture's clock now eases to rest and back over 0.45 s. About ninety moves crossed the frame at up to 2,100 px/s; a glide now eases over at least 0.6 s and a stroke's tip draws at no more than 820 px/s, so the fastest stage moves measure 580 px/s in Chinese and 708 px/s in English.
- The 1080p films no longer ring: VideoToolbox's scaler, which made the 1.2.0 1080p films, rings and lifts a white, so each 1080p film now averages each 2×2 block of its UHD picture.
- Spotlight lists each film's author once and its keywords with no leading space: the 1.2.0 films carried both the QuickTime artist and author keys, which Spotlight listed as two authors, and joined their keywords with a comma and a space, which it kept on each keyword after the first.

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
- A rebuild on an Apple M5 Max from a clean clone reproduces the accepted editions: every soundtrack, staged picture document, caption, transcript and cover is byte-identical, and each film has the published frame count, decoded audio, streams, chapters and tags, with every frame at or above the 45 dB PSNR floor; the lowest frame measured 51.3 dB.
- The repository is now `data-department-work-guidelines-film`, titled "Data Department Work Guidelines: Film", so that its name corresponds to the guidelines' own repository; the old address redirects.
- The repository runs ETHOS 0.2.0-alpha.29, and its CI workflow uses `jdx/mise-action` 5.2.6.
- The films are built by `filmkit` 0.5.0, which renders with HyperFrames 0.9.5, and the supply moves to its latest stable releases: Node 26.13.0, uv 0.13.7, hatchling 1.33.0, coverage 7.17.0, pytest 9.2.0 and Mise 2026.10.25 in CI, with both locks at the newest releases their declarations admit. The speech engine stays at mlx-audio 0.5.8 and MLX 0.32.3, so every thought the repair leaves unchanged keeps its recording.

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

[Unreleased]: https://github.com/HengYangDS/data-department-work-guidelines-film/compare/v1.3.0...HEAD
[1.3.0]: https://github.com/HengYangDS/data-department-work-guidelines-film/releases/tag/v1.3.0
[1.2.0]: https://github.com/HengYangDS/data-department-work-guidelines-film/releases/tag/v1.2.0
[1.1.0]: https://github.com/HengYangDS/data-department-work-guidelines-film/releases/tag/v1.1.0
[1.0.0]: https://github.com/HengYangDS/data-department-work-guidelines-film/releases/tag/v1.0.0

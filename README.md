# Data Department Work Guidelines: Film

Two introduction films to the [Data Department Work Guidelines](https://github.com/HengYangDS/data-department-work-guidelines), one in Chinese and one in English, and everything needed to rebuild them from source.

Each film explains the guidelines' seven documents, from the charter and decisions through delivery, data, communication and human–AI collaboration to practice evolution, with illustrative examples from a data department's work. Each edition lasts exactly 1500 seconds: 90,000 native 60 fps frames of 2D picture in 16:9, 48 kHz stereo narration in one synthetic voice, small single-line captions and no music. Each comes as a UHD master and a 1080p film, each with its captions drawn in the picture and again without them; the player's captions control switches between the two.

Author: Yang HENG.

## The films

All four films of each edition are published as release assets, together with their captions, transcripts, covers, independent review records and `SHA256SUMS`. [`content/release.json`](content/release.json) records each asset's name, size and SHA-256, the digests of the soundtrack and of the two staged pictures, with captions and without them, that each edition was made from, and those of the film-bound sources: the scripts, narration texts, voice contracts, reference recordings, source manifest, covers, fonts, composition and entry page whose exact bytes the build reads. The independent review of the `v1.3.0` films scored the Chinese edition 98.8 and the English edition 96.6 out of 100, with every one of its twelve dimensions at 96 or above, each of its three levels, 信, 达 and 雅, passing and no material or minor finding; the published review records list its notes. That review scores the audio from automated evidence; human listening is a separate acceptance.

The films of `v1.3.0` are the current editions, and those of `v1.2.0` and `v1.0.0` stay available as those releases' assets. A release that changes only how the films are built publishes no films of its own, and its tag names the source that rebuilds them.

## Rebuilding the films

The films are built by [filmkit](https://github.com/HengYangDS/filmkit), the film engine, at the release that `pyproject.toml` pins by its tag `v0.22.3` and `uv.lock` by its commit; this repository holds the film's sources and none of the engine's. A rebuild needs an Apple-silicon Mac with [mise](https://mise.jdx.dev), which installs the locked Node, Python, uv and ETHOS, and three Homebrew tools: FFmpeg with VideoToolbox, ExifTool and rsync 3.

```bash
brew install mise ffmpeg exiftool rsync
```

```bash
mise install --locked
```

```bash
mise run bootstrap
```

`film:supply` is the only step that reaches the network. It installs the browser build that the locked renderer pins and the three speech models at their pinned revisions below `build/runtime/tool-cache/`, and checks each against its pinned SHA-256. Set `HF_ENDPOINT` to a Hugging Face mirror where the hub is unreachable.

```bash
mise run film:supply
```

`film:build` then narrates both editions from the seeds in their casts, assembles the soundtracks and captions, renders each edition's picture with its captions and again without them, compares the two at every frame, packages the films and verifies every film, offline and only under `build/`. On an M5 Max the narration takes about 25 minutes, and each of the four picture renders takes 19 to 29.

```bash
mise run film:build
```

The stages also run one at a time: `film:narrate`, `film:sound`, `film:picture`, `film:package` and `film:verify`.

## Comparing a rebuild with the published films

Download the release assets into `build/artifacts/release/` and compare:

```bash
gh release download v1.3.0 --repo HengYangDS/data-department-work-guidelines-film --dir build/artifacts/release
```

```bash
mise run film:compare
```

The comparison refuses a published asset or a film-bound source that differs from the release manifest, and accepts a published review only when it binds the published films and the current script and composition. It then compares the rebuild layer by layer: each soundtrack and each edition's two staged picture documents, with captions and without them, must hold the recorded bytes, the captions, transcripts and covers the published bytes, and each of the eight films must have the published frame count, decoded audio, streams, chapters and tags, with every decoded frame's PSNR at or above the floor the manifest records, 45 dB for each film. The films are not compared byte for byte: packaging stamps each film with the time it was made, and two renders of one stage need not encode the same bytes. Since `v1.3.0` each picture is drawn in Chrome's software rasterizer, and two such renders of one Chinese picture differed at no frame by the engine's every-frame scan; the pictures of earlier releases were captured on the GPU, and the first rebuild of `v1.0.0` measured 51.5 dB at its lowest frame. The report goes to `build/evidence/reproduction/report.json`.

## Checks

`mise run check` runs the picture and Python test suites and the Markdown format check. The picture tests check that `picture/film.js` is the bundle of the modules under `picture/film/` and run the composition of each edition on the engine's headless runtime. The repository is governed by [ETHOS](https://github.com/HengYangDS/ethos): `ethos prove --full --execute` runs the portable proof that hosted CI also runs, including the `film-checks` gate, which runs the Python checks of the declaration, narration receipts and release manifest through the installed engine, and after a rebuild `ethos prove --host --gate film-media --gate film-reproduction --execute` verifies the films and their reproduction on this host. [CONTRIBUTING.md](CONTRIBUTING.md) explains how to change, verify, rebuild and release the films.

## Layout

| Path                            | Contents                                                                                                                                                                            |
| ------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `content/`                      | The film's declaration `film.toml`, both editions' scripts, casts and narration texts with each player's summary and colours, the entry page, source manifest and release manifest. |
| `picture/`                      | The picture composition: its modules under `picture/film/`, the bundle `picture/film.js` that the engine reads, and the page and styles that stage it.                              |
| `assets/`                       | The narrator's reference recordings, the covers and the fonts.                                                                                                                      |
| `tests/`                        | The film's tests: its composition against both scripts, its retained narration receipts, its release manifest, its declaration and players.                                         |
| `openspec/`                     | The accepted specification and any open Change.                                                                                                                                     |
| `system/gates.toml`, `.config/` | The ETHOS gates, the check policies, the CI declaration and the locked toolchain with its tasks.                                                                                    |

## License

The code is licensed under the [MIT License](LICENSE). The films' content, which is the scripts, narration texts, casts and pronunciation contract, the narrator's reference recordings, the covers, and the films, captions and transcripts built from them, is licensed under [Creative Commons Attribution 4.0 International](LICENSES/CC-BY-4.0.txt). The fonts in `assets/fonts/` keep the SIL Open Font License 1.1, whose texts lie beside them. [NOTICE](NOTICE) names the content's paths, the third-party software and models the build installs under their own licenses, and where the narrator's voice came from.

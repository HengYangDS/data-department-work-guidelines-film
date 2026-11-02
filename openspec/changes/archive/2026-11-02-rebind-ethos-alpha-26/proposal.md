## Why

ddwg-film declares and runs ETHOS 0.2.0-alpha.25. The owner asked that every governed repository run
the latest ETHOS release, which is now 0.2.0-alpha.26. Its adopter-facing changes are the paradigm
root rules, which this repository already meets (`CONTRIBUTING.md` beside `AGENTS.md` and
`README.md`, and `LICENSE` because releases are tagged), formatters that run on the settings ETHOS
ships, and the `jdx/mise-action` v5.2.5 pin of the common CI model. 0.2.0-alpha.26 is published with
its own Mise declaration, whose platform checksums equal the release's `SHA256SUMS` and the
published asset digests.

## What Changes

- Replace the 0.2.0-alpha.25 declaration in `.config/mise/config.toml` with the declaration
  published with 0.2.0-alpha.26, unchanged, and lock it again with native `mise lock`. The Node,
  Python and uv locks stay as they are.
- Bind the repository family to the 0.2.0-alpha.26 runtime through the locked console's
  `hook install`, keeping the 0.2.0-alpha.25 runtime as the rollback.
- Regenerate the CI projection, whose Mise action pin moves to v5.2.5.
- Record the move under `Unreleased` in the Changelog.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

None. The film, its sources and its editions do not change, so `.openspec.yaml` sets
`skip_specs: true`.

## Impact

`.config/mise/config.toml`, `.config/mise/mise.lock`, `.github/workflows/ci.yml`, `CHANGELOG.md`
and the repository-common runtime selection. `tasks.md` is the sole progress ledger.

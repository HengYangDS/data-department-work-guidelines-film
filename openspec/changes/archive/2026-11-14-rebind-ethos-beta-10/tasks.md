## 1. Runtime

- [x] 1.1 Replace the 0.2.0-alpha.29 declaration in `.config/mise/config.toml` with the one
      published with 0.2.0-beta.10, checked against the release's `SHA256SUMS` and asset digests,
      and lock it again with native `mise lock`; done when the lock holds 0.2.0-beta.10 for every
      platform it held 0.2.0-alpha.29 for, no 0.2.0-alpha.29 entry remains and it keeps
      `lockfile_version = 3`. The declaration is the release's own file (`sha256:2163ceaa…`), read
      back against `SHA256SUMS` and the asset digests; the lock holds 0.2.0-beta.10 for the same six
      platforms, holds no 0.2.0-alpha.29 entry and keeps `lockfile_version = 3`.
- [x] 1.2 Bind the repository family to the 0.2.0-beta.10 runtime with the locked console's
      `hook install`, keeping 0.2.0-alpha.29 as the rollback; done when CURRENT names the
      0.2.0-beta.10 runtime and ROLLBACK the 0.2.0-alpha.29 runtime. CURRENT names the 0.2.0-beta.10
      runtime `526c2ebafeba` and ROLLBACK the 0.2.0-alpha.29 runtime `a4323cd92099`.
- [x] 1.3 Remove the retired publication fields from `.ethos/release.toml` with
      `ethos lane repair-paradigm --apply` and declare the GitLab peer by its remote name; done when
      the repair reports the lane conforming and `ethos status` reports pass. The repair removed the
      two local command fields and the forge address; the repaired declaration equals the sister
      film's minus the GitLab peer, which commit `cd3bf23` adds; `ethos status` reports pass.

## 2. Hosted verification

- [x] 2.1 Declare the GitLab runner prerequisites, the GitLab jobs and the GitLab projection, move
      `mise_version` from 2026.10.25 to 2026.11.8 and generate both pipelines with
      `ethos lane project --apply`; done when `ethos lane project --check --json` reports both
      projections conforming. `.config/ci/runners.toml` went into commit `cd3bf23` first, because
      the projection admits its references only from the committed baseline;
      `ethos lane project --apply` then generated both pipelines, and the check reports both
      projections conforming.
- [x] 2.2 Record the move in the Changelog's Unreleased section; done when `mise run check` passes.
      The Unreleased section names the runtime, the two peers, the hosted jobs and the hosted Mise;
      `mise run check` passes with 20 Node tests and 16 Python tests.

## 3. Listening-plan test

- [x] 3.1 Derive the listening plan in `tests/test_film.py` instead of pinning its SHA-256, and
      record the repair under Fixed in the Changelog; done when the Python tests pass in the lane,
      which holds no local build. The test is the sister films'
      `test_the_listening_plan_derives_from_the_current_scripts`, byte for byte; the 16 Python tests
      pass in the lane, where the pinned digest had failed.

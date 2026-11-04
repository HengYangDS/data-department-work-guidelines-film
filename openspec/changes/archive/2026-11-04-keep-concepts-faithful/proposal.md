# Proposal

## Why

On 2026-11-01 the user found renderings in the films that narrow the concepts they translate, and asked for a fix at the mechanism rather than at each sentence. The DDWG films carry such renderings. The Chinese edition asks 谁说了算 for the guidelines' authority to act, which ranks law and policy above any person; calls the decision owner 有决定权的人, a person with power, where the guidelines name an accountable owner; and titles the collaboration chapter 人与智能体怎样协作, the human–Agent naming that DR-0001 rejects in favour of human–AI collaboration. The English edition says "who decides" and "what counts as fact" in place of the source's authority to act and authority about facts, and titles the same chapter "Working with Agents".

These renderings passed four review rounds because the films' glossary lived only in design prose, nothing checked a rendering against the source definition, and the reviewers judged consistency within an edition rather than fidelity to each concept. The same glossary itself gave 权限 for authority in every sense, which fits a person's scope of authority but not the authority about facts. The user also asked that every name and Chinese polyphone be read correctly and the same way each time, and that the films weigh what and why above how.

## What Changes

- A concept contract binds every DDWG concept the films name to its definition at the pinned guidelines, its essence in one sentence and one approved rendering per edition, distinguishing the senses that the source spells with one word, such as authority as an ordered set of sources and authority as the scope a person holds. Both editions are composed from the contract, and the user approves its renderings.
- The 25-minute editions (v1.2.0) are repaired wherever a rendering departs from the contract, in narration, captions and picture, and the affected thoughts are narrated again.
- The pronunciation contract declares the context reading of every Chinese polyphone the narration speaks and one reading for each name; every occurrence is checked against it.
- Language review judges concept fidelity against the contract as its own dimension.
- The source manifest pins the guidelines at v8.0.0, whose seven guideline documents are byte-identical to the currently pinned commit.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `film-production`: concept fidelity to the pinned guidelines, and pronunciation of names and polyphones.

## Impact

- Depends on a `filmkit` release that checks concept contracts and pronunciation against every occurrence (separate `filmkit` Changes); no narration starts before it is pinned.
- `~/Documents/ddwg-introduction-film/` receives v1.2.0 after both editions are qualified; v1.1.0 stays available as its Release assets.
- The guidelines repository stays read only.
- Out of scope: the ten-minute essentials film, which `filmkit`'s one-film-per-repository model places in its own repository after the user approves its outline; the ETHOS film; music and 3D.

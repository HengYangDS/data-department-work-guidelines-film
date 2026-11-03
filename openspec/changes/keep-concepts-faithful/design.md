# Design

## Context

The proposal states what is wrong and what changes. This design records the understanding of the guidelines that the concept contract is built from, the contract itself, how the 25-minute editions are repaired, and how the essentials film follows. Every statement about the guidelines below is our reading at the pinned release; the contract cites the exact passages.

### What the guidelines are

The Data Department Work Guidelines are the department's work-quality contract for its members and the Agents acting under their delegation. Their own summary: the department turns signals from the world into judgments and data assets that can be explained, checked and used within clear limits, and the guidelines help separate facts, responsibility, action and evidence without making every task fill the same form (README; charter, Purpose).

### Why they exist

The charter names four failures the contract stands against: reasoning that confuses facts with choices; quick fixes that leave the mechanism untouched; communication that leaves no one able to decide or act; and AI that produces more material without making judgment or outcomes more reliable. The value of data work is not a file acquired, a table produced, a report written or a process started. A task should resolve the problem, test the judgment and its limits, and leave the system better able to recognize the next occurrence; these are three outcomes, not three reports.

### How they hold together

- **Two kinds of authority.** Authority to act answers who may decide what to do, in a fixed order: law, regulation, security and mandatory policy; within them, the explicit decision of the authorized owner for the current matter; effective contracts, policies, specifications and decision records; and last, plans, provisional agreements and preferences. Authority about facts answers what can establish what is true: primary records and repeatable observations with a source, time, subject and scope; secondhand accounts, caches, generated views, Agent output and memory are leads. Neither stands in for the other: authority to act cannot make a false fact true, and evidence does not grant permission to act.
- **Four boundaries, and autonomy within them.** Tell the truth; stay in bounds; name the owner; do not claim false completion. Risk decides the form of the record, never whether a duty exists.
- **Reasoning that keeps meanings apart.** Fact, hypothesis, inference, judgment, decision and action are different statements; the smallest sufficient model and a bounded conclusion come before detail; a failure is explained together with why the system did not prevent or detect it.
- **Data qualified for a use.** Six questions and eight admission conditions decide whether data may serve a stated use; what could be known at the time is kept apart from hindsight; reports, caches and summaries never quietly become the source of truth; admission permits a use, and adoption is observed use.
- **Claims limited by evidence.** Name the state, not the effort; every completion claim says what, about which version, verified when, by whom and how, and what stays unproved.
- **Agents extend people.** People keep direction, authorization, decisions and responsibility; delegation transfers work, not that duty; DR-0001 names the whole relationship human–AI collaboration so that no single Agent stands for it.
- **Fidelity, clarity, elegance.** Communication answers the reader's need first, keeps actors, conditions and limits intact, and then seeks taste.
- **Learning that lowers rescue.** The aim is to find the next failure earlier and judge it more easily; a practice is admitted by evidence of net benefit and retired when it loses its subject.

### Where the films depart from the concepts

The audit of both editions at v1.1.0, and the independent audit of the repair's second revision (`build/evidence/script-audit/v1.2.0-repair-r2-audit.md`), found:

| Concept                                 | Chinese at v1.1.0                                                                       | English at v1.1.0                         |
| --------------------------------------- | --------------------------------------------------------------------------------------- | ----------------------------------------- |
| authority to act; authority about facts | 谁说了算 and 什么才算事实 (03)                                                          | "who decides", "what counts as fact" (03) |
| decision owner; authorized owner        | 有决定权的人 (03, 05, 06, 08, 11, 13, 14, 15, 21, 29); 谁有权决定 (05); 谁有决定权 (15) | decision owner (faithful)                 |
| deciding                                | 拍板 (02, 08, 20, 25)                                                                   | "decide" (faithful)                       |
| authority to act, as a held scope       | 权限 (04, 13, 19, 20, 22, 24, 26, 29), faithful; 许可 (09, 12, 13, 19)                  | authority, permission (faithful)          |
| lead                                    | 线索 (faithful)                                                                         | "clue", "clues" (03, 06)                  |
| fact source, in the stop rule           | 权威来源 (19, 22)                                                                       | "source of truth" (19, 22)                |
| qualifying data for a use               | 核验 (09)                                                                               | "shown fit" (faithful)                    |
| human–AI collaboration                  | 人与智能体怎样协作 (01 and the chapter of 19–22)                                        | "Working with Agents" (chapter of 19–22)  |

The rest of the term choices recorded by the improve-film-intelligibility design, such as 契约, 权威来源, 缓存, 派生视图, 公司代码 and 核验, remain faithful and enter the contract unchanged.

## Goals / Non-Goals

**Goals:**

- Every DDWG concept the films name keeps its source meaning in one rendering per edition, in narration, captions and picture, checked on every build.
- Both 25-minute editions are repaired and qualified as v1.2.0 without changing their structure, length or narrator.
- Every name and Chinese polyphone is read as declared, the same way each time.

**Non-Goals:**

- Restructuring the 25-minute editions; on 2026-11-01 the user decided that they are repaired only, and their walkthrough of the seven topics stays.
- The essentials film's production, which needs its own repository.
- Changes to the guidelines.

## Decisions

### 1. A concept contract owned by the film

`content/concepts.toml` holds one entry per concept sense: the source term, the exact passage and anchor at the pinned commit, its essence in one sentence, the approved Chinese and English renderings with the inflections the narration may use, and the counterexamples the audit found. Each segment of each edition's script declares the senses it states; both editions of a segment declare the same set; and the narration, captions and picture labels use only the approved renderings. The film owns its contract because the contract is a statement about this film's language; the check that enforces it belongs to `filmkit`. The entries that change or that the source spells alike:

| Sense                                | Source (pinned)                 | Essence                                                                                     | Chinese            | English                            |
| ------------------------------------ | ------------------------------- | ------------------------------------------------------------------------------------------- | ------------------ | ---------------------------------- |
| authority to act, as ordered sources | charter, Two Kinds of Authority | What decides what may be done, in an order where law and policy come before any person.     | 行动依据           | authority to act                   |
| authority about facts                | charter, Two Kinds of Authority | What can establish a fact: primary records and repeatable observations; the rest are leads. | 事实依据           | authority about facts; fact source |
| authority as a held scope            | charter; human-agent; evolve    | The range within which a person may act; it never grows by urgency or acceptance.           | 权限               | authority; permission              |
| authorization                        | charter; human-agent            | The act of granting that scope for a stated action.                                         | 授权               | authorization                      |
| decision owner; authorized owner     | decide; deliver; data           | The accountable person who decides the matter within their authority.                       | 决策负责人         | decision owner                     |
| human–AI collaboration               | DR-0001; human-agent            | The whole relationship, named so that no single Agent stands for it.                        | 人与人工智能的协作 | human–AI collaboration             |
| Agent                                | DR-0001; human-agent            | One executing or reasoning entity, never a source of organizational authority.              | 智能体             | Agent                              |
| source of truth                      | data                            | The authoritative record, against every report, cache and summary derived from it.          | 权威来源           | source of truth                    |
| lead                                 | charter                         | What only points toward a fact: accounts, caches, generated views, Agent output and memory. | 线索               | lead                               |
| qualified for a use                  | data                            | Showing that data's meaning, quality, permission and reproducibility fit one stated use.    | 证明适合           | shown fit                          |

The user approved these renderings on 2026-11-01. On 2026-11-02 the user approved the repair's third revision with its five choices: one name for the decision owner, so the contract drops 这件事的授权负责人; 权限 for every held scope, so 许可 goes; 证明适合 and "shown fit" for qualifying data, so 核验 keeps one meaning; 做决定 or 决定 for 拍板; and 事实依据 and "fact source" where the stop rule names the fact source. The independent audit of the third revision (`build/evidence/script-audit/v1.2.0-repair-r3-audit.md`) found two titles that still departed: 09 now says 证明数据适合具体用途, as choice 3 requires, and 14 says 实现、核验与生产变更, the contract's verification word. In 05.3 and 21.1 the Chinese says 行动依据, while the English keeps the source's own bare "authority" (decide, Frame the Right Problem; human-agent, Check Agent Output), so neither segment declares authority to act, and no sense binds the authority wording of those two thoughts: a recorded exception, not a gap. Unchanged thoughts that state a sense in one edition of their segment only, or by a form the contract does not list, stay undeclared as well: Chinese 01.6 and 26.4 (核验) and 14.2 and 20.0 (授权), and English 11.9 (permission), 20.0 (decision owner) and 30.0 (permitted). A rendering that a later review rejects changes here first, with the user's approval, and then everywhere it is used.

### 2. Repair without restructuring

Each departure in the audit table is rewritten in the source's sense, keeping the thought's length within its measured place so the 1500 s fit and the picture's timings move as little as possible. The authority segment 03 states both kinds of authority in the contract's words, the decision owner becomes 决策负责人 throughout, and the collaboration chapter and the roadmap of 01 use the DR-0001 name in both editions. Picture labels that show a changed term change with it.

The approved third revision (`build/runtime/work/repair/concept-edits-r3.md`), applied with `filmkit.narration.script_edits`, changes 29 Chinese thoughts in 18 segments and 14 English thoughts in 11 segments; no thought is split or merged. The Chinese grows by 37 Han characters and the English by about two dozen words. The titles of 03, 04, 09 and 14, the collaboration chapter's name, the release synopsis and keywords, both players and the README follow. The casts release the retakes of the changed thoughts; every other thought keeps its text and seed.

The pronunciation contract's hash enters every narration request, so both editions are narrated again in full from their casts' seeds, and new takes are selected for the repaired thoughts. The narration is qualified and heard before the picture is composed, under the existing lock order: script, voice, picture, one render, one review.

The repaired thoughts add 5.4 s of Chinese and 6.3 s of English speech, and v1.1.0 filled its 1500 s to within a tenth of a second, so the assembly refused both editions. The fit keeps every sentence break and thought pause, as earlier fits did. English commas, capped at 0.12 s, are capped at 0.1 s, which returns 6.4 s. Chinese commas are natively short, so a 0.12 s cap would return only 0.7 s, and the boundary floors already hold the Chinese statement mean at its declared 0.46 s; the Chinese time therefore comes from the gaps between segments: the chapter gap takes the English edition's 2.0 s, and the paragraph gap moves from 1.2 s to 1.1 s. Only each script's `voice_performance` changes; its segments, titles and metadata stay byte-identical to the audited and approved revision. Both editions then assemble at exactly 1500 s, with every boundary ratio as heard in v1.1.0 (`build/evidence/runtime-fit/2026-11-02-runtime-fit.json`).

On the repaired timelines three stages of the picture still followed the old words. English 03.3 now says what authority to act answers before it announces the order, so the two kinds stand until the announcement: the count's name gives way as the kind is named again, and the kind's question, who may decide what to do, stands under its name; 03.4 shows what authority about facts answers in the same way. The Chinese order of facts opened on its first rows with the width of its last row still to come, so it stood off the centre; its rows are now set within the width of the order of authority to act. The spine of risk in 04 carries its travelling point from the stage's first frame, so the stage never opens on its title and spine alone. The repaired Chinese 09.4 names its condition, shown fit for this use, where it named verification, and the longer clause held its stage still for 3.6 s of speech by the coarse still measure; that condition now stands under the boundary on its words.

Round 25 passed both editions, Chinese 95.3 and English 95.7, with one minor finding each, both in the picture, and both are fixed before delivery. The Chinese order of authority to act set each rank's first words in the name size, so its second rank read 这件事的决策负责人 large and 作出的明确决定 small: read by its large words, the order ranked a person, the narrowing the contract forbids. That rank's name is now the whole phrase and ends on the decision, as the English "The explicit decision" does, and a composition test holds each edition's order to rank the decision, never the owner alone. English 17.3 says its five refusals in one thought, but the picture cut to a second table on the merged change, so the first two refusals vanished while the list went on; one table now holds all five until missing evidence is named, while the Chinese, which says them in two thoughts, keeps a table for each. The Chinese rank's name stands whole from its first words, so its stage holds still for 3.03 s of speech, under the 3.5 s limit; no other picture measure changes.

Round 26 reviewed the fixed build, Chinese 95.9 without a minor finding and English 95.7 with one: the English table of 17.3 was laid out for its five rows from its first, so its first two rows stood high over an empty band, 19% above the content centre two seconds into the thought where the film allows 12%, for 5.8 s. The frame audit had reported that offset (`17.3 two 1%/-19%`) before the round-26 render, but the audits were read by their exit status, and the frame audit exits zero with gated findings. The table now grows about the content centre as 21.2's checklist does: its first row stands on the centre line, and the rows already shown step up by half a row as the words that bring the next one begin. A composition test holds the table's names within the balance limit as its rows arrive, and the frame audits of the fixed composition report no gated finding in either edition, the base's state.

Round 27 reviewed that build on HyperFrames 0.9.3, Chinese 96.0 without a minor finding and English 95.7 with one: in 06.2 the grid of the six kinds was laid out for its three rows from its first, so while only its first row was spoken, from the hypothesis to the inference, it stood 13% to 15% above the content centre for 5.2 s over an empty band, covering less than a tenth of it, and the picture held still for 3.1 s while the inference's premise was said. The frame audit samples balance at two instants of each thought, and both fell outside that run. The Chinese grid had the same layout and the same 5 s run, which the Chinese review did not measure. In both editions the case now stands below the grid's first row until the inference's own words begin, and the inference's premise is shown on it as it is said: the hour the collection was due is named as on time, and the two hours between as the job's late start. The case leaves in one cut on the inference's words, and the inference's term arrives with that cut, so it never stands over the case. Measured on the composition over the assembled timelines, the first row never stands alone, and from the hypothesis to the inference the lit picture stays within 6.4% of the content centre and covers at least 19% of the content band, with at most twelve names. A composition test holds both editions to the balance limit, a tenth of the band and no overlapping text, and checks that both parts of the premise are named as they are said; it fails on the round-27 composition and on two earlier fixes, `2cc3495`, which only eased the lone row down, and `148ea0b`, whose premise in the inference's slot made a thirteenth name.

### 3. Pronunciation

The pronunciation contract moves to schema version 2, which the `filmkit` readings check enforces on the spoken text. Its Chinese part declares 250 words that resolve all 1,373 watched occurrences: 245 words reviewed in context for the v1.1.0 text, including the 13 earlier targets the narration still says, 22 of them recording where the narration departs from the dictionary, such as the 得 of 做得 (de) and 当时 (dāng); 两种 and 待决定 for the repair; and 谁 shéi, 这 zhè and 那 nà, the one reading the approved text names for the edition. 一字不差 keeps the dictionary's chà. 谁, 这, 那 and 审美 hold no character the engine watches, so the readings check's occurrence plan has no row for them; the listening plan derived for the review lists every one of their occurrences. The Chinese narration says no Latin name. The English part names IDs as letter names beside AI.

The listening plan's analyst readings drop the 46 Chinese words that the contract now declares or the narration no longer says, and record the two new noun occurrences, lead (06) and leads (03), as /liːd/. The film's tests pin the plan derived from the repaired scripts. Every occurrence of a declared reading or name is heard against its approved reference, and a mismatch is retaken.

Recognition alone cannot hear a reading: given its context, the recognizer writes the word the sentence predicts. Of 19 misreadings narrated on purpose in this voice, short clips around the declared word revealed 5 and single characters 6. The check therefore has three parts. Recognition of a clip around each of the 1,373 declared occurrences catches a different syllable outright. A tone classifier trained on the narrator's own unambiguous syllables, which finds 15 of 17 tone misreadings, screens the 93 risky occurrences: readings the dictionary contradicts in context, a character's less used reading, characters read evenly both ways, the repair's new declarations, and recognition findings. Each flag is settled by minimal pairs: the thought is narrated again with a homophone of the declared reading and of the alternative, from the take's seed and a second seed, and the occurrence's syllable is compared with both by cepstra and pitch. An occurrence that these measures cannot settle goes to the user's ear.

### 4. Review

Language review reads the contract with the script and scores concept fidelity as its own dimension; a rendering that narrows, personifies or substitutes a concept is a material finding. The round-23 lesson stands: the term audit runs before narration, not after delivery.

### 5. The essentials film follows in its own repository

The user's plan for a ten-minute essentials edition beside the 25-minute editions cannot live in this repository: `filmkit` declares one film per repository, with two editions of equal length. The essentials film is therefore formed as its own repository from the same contract and narrator. The user approved this outline on 2026-11-01; it puts what and why first and follows one incident, the price data that arrived two hours late:

| Part | Content                                                                                                                                      | Seconds |
| ---- | -------------------------------------------------------------------------------------------------------------------------------------------- | ------: |
| 01   | The late data, and the four failures it invites: switching vendors at once, a manual patch, a meeting with no decision, an Agent's ten pages |      60 |
| 02   | What the guidelines are and why: reliable judgments others can depend on, and the three outcomes of a task                                   |      75 |
| 03   | The two kinds of authority, and why neither stands in for the other                                                                          |      95 |
| 04   | The four boundaries, and form following risk                                                                                                 |      85 |
| 05   | Data qualified for a use: the six questions, and what could be known then against hindsight                                                  |      85 |
| 06   | Evidence limits the claim: verified, published and in use are different states                                                               |      85 |
| 07   | Human–AI collaboration: Agents extend people, and responsibility stays with people                                                           |      70 |
| 08   | Learning: leave the check that finds the next delay earlier                                                                                  |      42 |
|      | Credits                                                                                                                                      |       3 |

### 6. The supply at the latest stable releases

On 2026-11-02 the owner asked that every supply move to its latest stable release. The film moves to `filmkit` 0.4.0, which renders with HyperFrames 0.9.3 and keeps Chrome Headless Shell 152.0.7977.30 and the `undici` 7.30.1 override; puppeteer-core 25.16.0 and @puppeteer/browsers 3.2.6 move with it. Node moves to 26.13.0, uv to 0.13.6, the CI's Mise to 2026.10.25, hatchling to 1.33.0, coverage to 7.17.0 and pytest to 9.2.0, and both locks take the newest releases their declarations admit; OSV reports no advisory in either lock. Python stays at 3.12.16, the newest release of the 3.12 line. A renderer that HyperFrames publishes while the edition is produced moves with the next recheck, as HyperFrames 0.9.4 does.

The fix of round 27 renders both editions again, so the film moves on 2026-11-03 to `filmkit` 0.5.0, which renders with HyperFrames 0.9.5 and still declares Chrome Headless Shell 152.0.7977.30; the npm lock also moves semver to 7.8.6, and OSV reports no advisory in either lock.

The speech engine stays at mlx-audio 0.5.8 and MLX 0.32.3, so that every thought the repair leaves unchanged still reproduces its v1.1.0 recording (task 4.2); the next full production moves it. `uv pip check` reports that override as an incompatibility with the mlx-audio that `filmkit` declares, so `check:dependencies` relies on the frozen sync check, which proves the environment is exactly the lock, until the hold ends. A new renderer can change the frames, so 6.1 renders both editions again on this supply, and the next review compares their frames with the `6702e20` render's.

## Alternatives Considered

| Approach                                                      | Trade-off                                                                                                                        | Decision |
| ------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- | -------- |
| Correct the flagged sentences only                            | Fast, but leaves no contract, so the next edition can drift the same way and review still lacks the definitions.                 | Rejected |
| A glossary in design prose, as in round 19                    | Already tried; it was never enforced and itself conflated two senses of authority.                                               | Rejected |
| A film-owned contract enforced by the engine on every build   | Needs a `filmkit` release and declared senses per segment; catches a departure before narration.                                 | Chosen   |
| Hold the essentials film as extra editions of this repository | Avoids a new repository, but the engine refuses editions of different length and both films would share one version and Release. | Rejected |

## Risks / Trade-offs

- **A repaired thought no longer fits its place.** → Rewrite within the measured length; if a thought must grow, re-fit through the pause contract, from commas or the gaps between segments as section 2 records, never by deleting needed punctuation or shortening a sentence break or thought pause.
- **A rendering is contested.** → The contract cites the passage; the user decides once.
- **New narration differs in tone from its neighbours.** → Retake whole thoughts with the narrator's existing reference and qualify them under the existing endings and loudness checks.
- **The essentials film waits on a new repository.** → Its outline is reviewed now; its formation follows the user's approval and does not block v1.2.0.

## Migration Plan

1. The user approved the contract's renderings, the repair-only scope of the 25-minute editions and the essentials outline on 2026-11-01.
2. Specifications and tasks follow; the script repairs are written and term-audited, and the user approved the third revision on 2026-11-02.
3. With `filmkit` 0.3.0 pinned, both editions are narrated from their casts' seeds and the repaired thoughts' takes are qualified and heard; then picture, render and review, the render on `filmkit` 0.4.0 after the supply move of section 6.
4. Both editions are delivered to Documents with readback and replace v1.1.0 there; v1.2.0 is released after the user confirms.

## Open Questions

- The essentials film's repository name and title, and its length: at the narrator's speaking rate its approved text runs about a third short of ten minutes, as the ETHOS film's does of fifteen, and the user decides how to close that gap.

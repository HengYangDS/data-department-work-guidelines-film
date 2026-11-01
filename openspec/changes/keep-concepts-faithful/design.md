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

The audit of both editions at v1.1.0 found:

| Concept                                 | Chinese at v1.1.0                                                                       | English at v1.1.0                         |
| --------------------------------------- | --------------------------------------------------------------------------------------- | ----------------------------------------- |
| authority to act; authority about facts | 谁说了算 and 什么才算事实 (03)                                                          | "who decides", "what counts as fact" (03) |
| decision owner; authorized owner        | 有决定权的人 (03, 05, 06, 08, 11, 13, 14, 15, 21, 29); 谁有权决定 (05); 谁有决定权 (15) | decision owner (faithful)                 |
| authority to act, as a held scope       | 权限 (04, 13, 19, 20, 22, 24, 26, 29), faithful                                         | authority (faithful)                      |
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

| Sense                                | Source (pinned)                 | Essence                                                                                     | Chinese                        | English                |
| ------------------------------------ | ------------------------------- | ------------------------------------------------------------------------------------------- | ------------------------------ | ---------------------- |
| authority to act, as ordered sources | charter, Two Kinds of Authority | What decides what may be done, in an order where law and policy come before any person.     | 行动依据                       | authority to act       |
| authority about facts                | charter, Two Kinds of Authority | What can establish a fact: primary records and repeatable observations; the rest are leads. | 事实依据                       | authority about facts  |
| authority as a held scope            | charter; human-agent; evolve    | The range within which a person may act; it never grows by urgency or acceptance.           | 权限                           | authority              |
| authorization                        | charter; human-agent            | The act of granting that scope for a stated action.                                         | 授权                           | authorization          |
| decision owner; authorized owner     | decide; deliver; data           | The accountable person who decides the matter within their authority.                       | 决策负责人；这件事的授权负责人 | decision owner         |
| human–AI collaboration               | DR-0001; human-agent            | The whole relationship, named so that no single Agent stands for it.                        | 人与人工智能的协作             | human–AI collaboration |
| Agent                                | DR-0001; human-agent            | One executing or reasoning entity, never a source of organizational authority.              | 智能体                         | Agent                  |
| source of truth; lead                | charter; data                   | The authoritative record, against everything that only points toward it.                    | 权威来源；线索                 | source of truth; lead  |

The user approved these renderings on 2026-11-01. A rendering that a later review rejects changes here first, with the user's approval, and then everywhere it is used.

### 2. Repair without restructuring

Each departure in the audit table is rewritten in the source's sense, keeping the thought's length within its measured place so the 1500 s fit and the picture's timings move as little as possible. The authority segment 03 states both questions in the contract's words, the decision owner becomes 决策负责人 throughout, and the collaboration chapter and the roadmap of 01 use the DR-0001 name in both editions. Picture labels that show a changed term change with it. The affected thoughts are narrated again, qualified and heard before the picture is composed, under the existing lock order: script, voice, picture, one render, one review.

### 3. Pronunciation

The pronunciation contract declares the context reading of every Chinese character whose dictionary reading is ambiguous, such as 行情 háng, 重新 chóng, 当时 dāng and the 得 of necessity, děi, and one reading for each name. One approved occurrence of each declared reading is the reference; every other occurrence must match it within the threshold the `filmkit` check is calibrated to, and a mismatch is retaken.

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

## Alternatives Considered

| Approach                                                      | Trade-off                                                                                                                        | Decision |
| ------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- | -------- |
| Correct the flagged sentences only                            | Fast, but leaves no contract, so the next edition can drift the same way and review still lacks the definitions.                 | Rejected |
| A glossary in design prose, as in round 19                    | Already tried; it was never enforced and itself conflated two senses of authority.                                               | Rejected |
| A film-owned contract enforced by the engine on every build   | Needs a `filmkit` release and declared senses per segment; catches a departure before narration.                                 | Chosen   |
| Hold the essentials film as extra editions of this repository | Avoids a new repository, but the engine refuses editions of different length and both films would share one version and Release. | Rejected |

## Risks / Trade-offs

- **A repaired thought no longer fits its place.** → Rewrite within the measured length; if a thought must grow, re-fit through the existing comma-capped runtime method, never by deleting needed punctuation.
- **A rendering is contested.** → The contract cites the passage; the user decides once.
- **New narration differs in tone from its neighbours.** → Retake whole thoughts with the narrator's existing reference and qualify them under the existing endings and loudness checks.
- **The essentials film waits on a new repository.** → Its outline is reviewed now; its formation follows the user's approval and does not block v1.2.0.

## Migration Plan

1. The user approved the contract's renderings, the repair-only scope of the 25-minute editions and the essentials outline on 2026-11-01.
2. Specifications and tasks follow; the script repairs are written, term-audited and approved.
3. After the `filmkit` release with the new checks is pinned, the affected thoughts are narrated, qualified and heard; then picture, render and review.
4. Both editions are delivered to Documents with readback and replace v1.1.0 there; v1.2.0 is released after the user confirms.

## Open Questions

- The essentials film's repository name and title.

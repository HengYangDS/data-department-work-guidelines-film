## MODIFIED Requirements

### Requirement: The final film earns an evidence-bound composite review

The final film MUST meet the declared review contract: every declared dimension, each stating what an excellent film shows, at least 95, and their mean at least 95. The reviewer MUST check every pattern the owner rejected in an earlier edition. The review MUST bind the final media and keep observed modalities apart from unassessed ones. Technical qualification MUST NOT imply human taste; audio is scored from automated evidence, and human listening is a later acceptance, not a scoring criterion.

#### Scenario: Final composite review qualifies

- **WHEN** every declared review dimension has been assessed against the final files
- **THEN** every dimension is at least 95
- **AND** the overall score, the mean of the dimensions, is at least 95
- **AND** every audio deduction cites a measured or observed property, never the absence of human listening
- **AND** no material semantic, pronunciation, readability, continuity or delivery finding remains

#### Scenario: The verifier enforces the recorded review

- **WHEN** the film-media gate verifies final acceptance for an edition
- **THEN** the review record must name both published movie hashes, the current script and composition
- **AND** a rebuilt movie inherits that review only by meeting the reproduction standard against its published movie
- **AND** missing dimensions, a mismatched mean, a score below threshold or a material finding refuses
- **AND** human listening is reported as recorded, never inferred from model review or measurements

#### Scenario: Each quality is scored on its own

- **WHEN** the review contract is read
- **THEN** it scores faithfulness, concept fidelity, narrative clarity, language quality, voice quality, narration performance, pronunciation, visual explanation, typography, visual aesthetics and colour, sound-picture continuity, and credits and delivery craft as separate dimensions
- **AND** voice quality states the measured clarity a narration must reach

#### Scenario: A rejected pattern cannot pass

- **WHEN** a reviewer finds in either edition a pattern the owner has rejected, such as a hoarse voice, a swallowed phrase tail, a ground with a colour cast or an opening without its title card
- **THEN** the finding is material and the review refuses

## ADDED Requirements

### Requirement: Every text at rest stays legible

Every text the picture holds at rest MUST stand at 4.5:1 or more against the ground in its painted colour and opacity, in both editions. A spoken list MUST show the item being spoken without dimming the items it has already named below that contrast, and a refused name MUST carry its refusal by its cross rather than by fading.

#### Scenario: A list builds on legible items

- **WHEN** a spoken list names its next item
- **THEN** every item it has already named stays at 4.5:1 or more against the ground
- **AND** the item being spoken stands out by its own mark, not by dimming the others below that contrast

#### Scenario: Secondary and key-coloured text stays legible

- **WHEN** a muted, evidence, authority or unknown text, a refused name, a report card's value or the running head rests on the picture
- **THEN** its colour at its painted opacity stands at 4.5:1 or more against the ground
- **AND** only a text entering or leaving the picture, for at most 0.7 s, stands below it

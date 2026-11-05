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

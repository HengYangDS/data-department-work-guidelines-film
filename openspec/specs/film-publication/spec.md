# film-publication Specification

## Purpose

Publish the films and their sources under clear licenses, with release assets whose identities the repository records.

## Requirements

### Requirement: Licenses are declared for every tracked file

Code SHALL be licensed MIT, the films' text, audio and images CC BY 4.0, and bundled fonts under their own licenses. The root LICENSE SHALL carry the MIT grant that the package manifests declare, NOTICE SHALL name the tracked paths under CC BY 4.0, every other tracked file being code, each license text SHALL be present, and third-party material SHALL keep its original notice.

#### Scenario: The license declarations cover the tree

- **WHEN** ETHOS checks the repository paradigm
- **THEN** the MIT grant in LICENSE is recognized, linked from the README and declared by the package manifests
- **AND** NOTICE names the license of every tracked path that is not code, and each license text it names is present

### Requirement: A release carries the films with their checksums

A release SHALL publish each edition's four films, at UHD and at 1080p, each with captions and without them, and its captions, transcript, cover and review record, together with their SHA-256 sums. The repository SHALL record each published asset's name, size and SHA-256, and the digests of the soundtrack and of the two staged picture documents, with captions and without them, that each edition was made from.

#### Scenario: Published assets read back

- **WHEN** a release has been published on a forge
- **THEN** each downloaded asset's SHA-256 equals the recorded one

#### Scenario: The manifest names every film of an edition

- **WHEN** the release manifest is read
- **THEN** it lists for each edition a UHD film and a 1080p film with captions, a UHD film and a 1080p film without captions, and the digests of both staged picture documents

### Requirement: The repository tracks no generated media or evidence

The tracked tree SHALL NOT contain films, recordings, renders, review outputs or build receipts. They SHALL be produced under `build/` or published as release assets.

#### Scenario: The tracked tree holds sources only

- **WHEN** the tracked files are listed
- **THEN** none is a generated film, recording, render, review output or build receipt

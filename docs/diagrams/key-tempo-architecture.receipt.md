# Key & Tempo architecture — delivery record

- Diagram type: `architecture`
- Authored language / viewer locale: English / `en`
- Output: [Interactive HTML](key-tempo-architecture.html)
- Validation: **9/9 showcase checks; 0 composition errors; 0 warnings**
- Browser evidence: **passed**, using the packaged `visual-check` command on the delivered artifact.
- Visual review: **passed**, image-capable inspection of the 1440×900 light and 2048×1320 dark screenshots. Labels, node fit, relationship corridors, and the overall vertical balance were inspected.
- Focused geometry correction rounds: **2** (edge-label clearance; desktop readability).

## Artifact identity

| File | Bytes | SHA-256 |
| --- | ---: | --- |
| Specification | 4866 | `409e0d9811554288055559e0f9b52a5030463a4244e8660263260fe328f6b99b` |
| Delivered HTML | 811234 | `03a258bb4379c3a0b589a2cc860d56be7c46a7be09180a633c51dfd77b637643` |

## Browser coverage

The exact delivered HTML passed horizontal and vertical containment at 1440×900, 1600×1000, 1920×1080, and 2048×1320. Automated captures cover light and dark themes at both endpoint sizes. Automated evidence and perceptual review are separate claims; the automated receipt correctly retains `visualReview: pending`.

- [Deterministic delivery receipt](key-tempo-architecture.delivery.json)
- [Final validation receipt](key-tempo-architecture.validation.json)
- [Automated browser receipt](key-tempo-architecture.visual-check.json)
- [Light / dark screenshot contact sheet](key-tempo-architecture.visual-check.html)
- [Editable specification](key-tempo-architecture.json)
- [Working-tree source evidence](key-tempo-architecture.sources.json)

## Scope and interpretation

The map reflects the current local working tree, not a published Git revision. Source paths and file digests are recorded separately because repository badges require a pinned repository revision. Static hosting is Pages-ready; this diagram does not claim the website has been deployed.

The main path shows browser-local inference. The lower branch is the optional local Python service, selected by the shared engine adapter. The diagram uses data-flow relationships: `MIDI bytes via API` explicitly includes the FastAPI orchestration step, rather than implying the inference module calls the download store directly. The API response and download endpoint are summarized in the contract card. The cache is optional, and neither S-KEY errors nor unavailable Cache Storage should block otherwise valid tempo output.

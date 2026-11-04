# Key & Tempo architecture — delivery record

- Diagram type: `architecture`
- Authored language / viewer locale: English / `en`
- Output: [Interactive HTML](key-tempo-architecture.html)
- README image: [Dark WebP](key-tempo-system.webp), exported through the delivered viewer's WebP action.
- Validation: **9/9 showcase checks; 0 composition errors; 0 warnings**
- Browser evidence: **passed**, using the packaged `visual-check` command on the delivered artifact.
- Visual review: **passed**, image-capable inspection of the 1440×900 light and 2048×1320 dark screenshots, plus the exported WebP. Node fit, labels, arrow corridors, vertical balance, and clean image export were inspected.
- Visual correction rounds: **1** (compacted authored vertical spacing and removed redundant explanatory cards to fit desktop viewports). Two edge-label clearance fixes preceded the first browser inspection.

## Artifact identity

| File | Bytes | SHA-256 |
| --- | ---: | --- |
| Specification | 6986 | `f716701ce6fcc3b0f6e85b16c278b01517dfa87a3ea1770deaac8af2376718ad` |
| Delivered HTML | 817797 | `a35ad264d4338d26fbcbcbb9c054a9150b495e1330fcfa2b7ddd73ecf4ca5a0e` |
| README WebP | 351220 | `b07b3001cd09b984c3f5f4f186f60303418beb6efae83c35567731e36b3883ca` |

## Browser coverage

The exact delivered HTML passed horizontal and vertical containment at 1440×900, 1600×1000, 1920×1080, and 2048×1320. Automated captures cover light and dark themes at both endpoint sizes. Automated evidence and perceptual review are separate claims; the automated receipt correctly retains `visualReview: pending`.

- [Deterministic delivery receipt](key-tempo-architecture.delivery.json)
- [Final validation receipt](key-tempo-architecture.validation.json)
- [Automated browser receipt](key-tempo-architecture.visual-check.json)
- [Light / dark screenshot contact sheet](key-tempo-architecture.visual-check.html)
- [Editable specification](key-tempo-architecture.json)
- [Pinned source evidence](key-tempo-architecture.sources.json)

## Scope and interpretation

The architecture reflects repository revision `996e71620f844adfdaeb2dd44b09da9bc72d8704`. All 22 component source references were verified against that commit.

The overview shows the shared upload/range UI, default browser ONNX workers, optional local FastAPI service, and common results/MIDI output. Browser model assets prefer pinned Hugging Face files, then fall back to GitHub-hosted copies; runtime assets use unpkg with a Pages fallback. Cache Storage is optional.

The lower inset expands enhanced pitch processing inside either engine: single htdemucs separates vocals, its Worker or Python child process exits, then GAME Large loads for note estimation. This inset describes an internal path, not a separate service. Enhanced mode is off by default and requires WebGPU in the browser. Standard pitch uses GAME Small. Beat This! and S-KEY continue to analyze the original mix or selected range. Local Python uses PyTorch for beat/key and ONNX Runtime CPU for GAME.

Results include estimated BPM, meter, global key, vocal range, and MIDI with Tempo plus available Lead Vocal notes. The diagram summarizes API orchestration: `POST /api/analyze` returns JSON and a MIDI download URL; `GET /api/download/{token}` serves the generated file. Source separation is not a separate public API.

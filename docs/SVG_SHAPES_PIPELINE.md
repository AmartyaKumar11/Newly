## SVG Shapes Pipeline & Safety Guardrails

This project treats SVGs as **untrusted input** by default. All shapes must pass through a
controlled normalization pipeline before they are available to the editor or to AI.

### Why SVGs must go through the normalization pipeline

- Raw SVGs can contain:
  - Embedded scripts (`<script>`, `onload`, `javascript:` URLs)
  - External references (`<image>`, `<use xlink:href>`, remote fonts)
  - Arbitrary CSS that can escape a sandbox
- To keep the editor safe and deterministic, we:
  - Ingest SVGs only from `/raw-svgs/`
  - Normalize them with a fixed SVGO configuration
  - Emit **production‑ready** assets into `/public/shapes/`
  - Auto‑generate a strongly‑typed `shapesRegistry` for lookup

### Why raw SVGs are unsafe

- SVG is effectively a mini DOM + CSS + scripting language.
- Without normalization, a malicious or buggy SVG can:
  - Execute XSS payloads
  - Exfiltrate data through external network requests
  - Break layout/UX by injecting unexpected CSS
- The pipeline ensures we only ever serve a **curated subset** of SVG features that
  are safe for embedding inside the editor.

### Why shapes are static assets (not DB‑backed yet)

- Shapes live in `/public/shapes/` and are registered in `src/lib/shapes/shapesRegistry.ts`.
- They are:
  - Version‑controlled with the code
  - Reviewed like any other asset
  - Immutable at runtime (no user‑generated SVGs)
- Keeping shapes as static assets avoids:
  - Runtime migration concerns
  - Arbitrary SVG upload surfaces
  - Schema drift between DB and editor

If we ever move to DB‑backed shapes, the same normalization + registry concepts must still apply.

### How AI safely references shapes

- The AI schema does **not** allow raw SVG or path data.
- AI can only reference shapes via a `shapeId` field on `shape` blocks.
- The translation layer (`src/utils/aiTranslation.ts`) enforces that:
  - Any `shapeId` must exist in `shapesRegistry`
  - Any attempt to include raw SVG / path payloads (e.g. `svg`, `paths`, `d`, `viewBox`) is rejected
  - Validation failures are **hard errors** that reject the entire AI response
- As a result:
  - Only pre‑normalized, pre‑approved shapes can be used by AI
  - There is a single source of truth for what shapes exist and how they are rendered

This design is intentionally conservative to satisfy enterprise review:
**no raw SVG from AI or users ever reaches the runtime without passing through
the normalization and registry pipeline.**


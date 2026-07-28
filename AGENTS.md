# Prototype Instructions

Run the local server yourself and open the preview in the browser available to this environment. Do not give the user server-start instructions when you can run it.

Before making substantial visual changes, use the Product Design plugin's `get-context` skill when the visual source is unclear or no longer matches the current goal. When the user gives durable prototype-specific design feedback, preferences, or decisions, record them in `AGENTS.md`.

When implementing from a selected generated mock, treat that image as the source of truth for layout, component anatomy, density, spacing, color, typography, visible content, and hierarchy.

Build app UI in `src/`. Keep `.openai/hosting.json`, `worker/index.js`, `scripts/prepare-sites-build.mjs`, and `tests/sites-worker.test.mjs` intact so the same local prototype can be handed to Sites. Before a Sites handoff, run `npm run build` and `npm run test:sites`; the build must leave `dist/client/index.html`, `dist/server/index.js`, and `dist/.openai/hosting.json`.

## Active Design Direction

- The user evolved the selected cinematic concept into a black-blue deep-space palette with oversized condensed type, cold-white copy, ice-cyan and cobalt interface accents, thin technical rules, and wide editorial project bands. Acid lime is reserved for the brand slash, live status, and collision moments.
- The hero asteroid must be a real-time Three.js scene, not a static raster. Preserve its slow rotation, irregular rocky surface, luminous orbit, pointer parallax, and reduced-motion fallback.

- The hero uses a fully 3D stochastic three-body gravity cycle. Every reset must sample fresh out-of-plane momentum, sustain a visibly chaotic orbit before the smaller bodies can collide, then fragment and magnetically reassemble without user input.



- The homepage is not a portfolio-only surface. Treat editorial writing as a core content type alongside projects, with readable article excerpts, metadata, and expandable body copy.


- Do not use decorative orbital splines or torus-knot lines behind the three-body system; the user considers them visually noisy. Use sparse spatial particles plus only the bodies' real simulated trails.
- Keep the black-blue palette near-black and desaturated. Avoid bright cyan fills or broadly distributed blue accents; premium editorial restraint is preferred.


- The left-side 01–05 rail is a real five-section page progress control, not hero decoration. It must map to Home, Projects, Notes, About, and Contact, update while scrolling, show continuous progress, and remain clickable.


- Label the projects section as “我的项目”, and give this section title more visual weight than the surrounding technical metadata labels.

- Keep the asteroids clearly legible against the near-black background. Use brighter slate-blue rock albedo, readable cold highlights, and controlled local fill light without lifting the whole page.
- Use the official NASA Bennu GLB as the hero bodies' production model, preserve its real silhouette and surface map, credit NASA VTAD, and keep the procedural geometry only as a loading fallback.
- Articles are genuine long-form content, not short accordion summaries. Each article should open into a structured reading experience with a lede, multiple titled chapters, substantial body copy, and an ending marker.
- Do not stack four full-size projects followed by inline article accordions. Interleave one featured essay between project tiers, keep only two flagship project bands, use compact cards for the rest, and open long-form writing in a dedicated reading layer.
- Treat each homepage story beat as a full-viewport snap panel. A wheel or swipe gesture must cross a meaningful threshold to advance; sub-threshold gestures preview a small offset and spring back. Keep the dedicated article reader freely scrollable outside this paging behavior.
- Do not render visible interface text below 11px. Use at least 12px for desktop mono labels and metadata, retain generous line-height, and keep secondary text contrast high enough to remain crisp on high-DPI displays.
- Treat Search Agent as the flagship project and keep it first in the project sequence. Its visual language should communicate heterogeneous document search, hybrid retrieval, evidence selection, and source provenance without becoming a literal software flowchart.
- Mark Search Agent as actively and rapidly evolving rather than finished. Build its case study gradually as a living engineering record, with room for architecture history, paper references, ablation studies, layered memory, multi-view representations, failures, and subsequent revisions.
- Keep meaningful interface text at 14px or larger on desktop and 13px or larger on compact/mobile layouts. Small technical labels must use sufficient weight and contrast, and Chinese UI text should avoid wide tracking that makes strokes look pixelated.
- Treat the hero seed label as a discreet interactive control: clicking `SEEDS / …` reveals an input, and the submitted seed deterministically defines cycle-one 3D momentum while later cycles derive distinct reproducible momenta from it.
- Keep the featured Vibe Coding essay title as two deliberate lines: “不看代码之后，你更应该看什么：” followed by “我的 Vibe Coding 方式”; do not leave this break to automatic wrapping.
- Keep Search Agent as the only full-screen flagship project while the project catalog is still shallow; do not promote placeholder projects into separate full-viewport panels.
- Returning from an article or project reader must preserve the current homepage panel; residual wheel or trackpad momentum and focus restoration must never advance the full-page snap sequence.
- Use the UI sans/CJK stack for Search Agent's Chinese category, live status, and action labels; keep letter-spacing neutral so Chinese strokes remain clean.
- Label the top navigation item as “关于我”, and render the Chinese navigation labels with the UI sans/CJK stack and neutral tracking.
- Use self-hosted Inter Variable for all interface, metadata, navigation, and technical labels; reserve the system code stack only for seed values and literal code blocks.
- In the hero identity lockup, `MAPLE /` must be the dominant headline. Keep `CREATIVE DEVELOPER` as a smaller secondary role label and pair it with the Chinese annotation “创意开发者 / AI 应用与 Agent 系统”.

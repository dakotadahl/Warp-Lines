# Alluvium

Warp lines canvas animation (GSAP). Production output is a single **script.js** for embedding; development uses a preview sandbox.

## Quick Start

```bash
npm install
npm run build          # → dist/script.js
npm run build:webflow  # → build + copy script to clipboard + embed instructions
```

## Project Structure

```
Alluvium/
├── index.html            # Warp-lines preview (GSAP + inline line field; open or npm run serve)
├── src/Homepage/
│   └── warp-lines.js     # Source: warp lines logic for dist/script.js (embed build)
├── dist/                 # Generated (gitignored)
│   └── script.js         # Production script — embed this
├── scripts/
│   ├── build-script.js   # Builds dist/script.js from warp-lines.js (terser)
│   ├── webflow-prep.js   # Copies script + prints embed steps
│   └── release.js        # Release helper (build + tag/prod instructions)
├── sandbox/              # Optional dev assets
├── docs/                 # Reference: audits, migration notes, legacy
│   └── legacy/           # Legacy RAF version (index-legacy.html; no build)
└── package.json
├── components/           # Reusable Webflow components (not part of the script build; copy-paste into Webflow)
```

## Development Workflow

1. **Preview**: Open **index.html** in a browser, or run `npm run serve` and open http://localhost:3000. The warp-lines animation is inline in index.html (no build required for preview).
2. **Edit**: Change **index.html** for preview behavior/layout; change `src/Homepage/warp-lines.js` for the embeddable script that builds to `dist/script.js`.
3. **Build**: `npm run build` → minified `dist/script.js`.
4. **Embed**: In production, load GSAP then `script.js`; add a container (see below).

## Production Embed

- **Requirement**: GSAP 3.12.x loaded before the script (e.g. CDN).
- **Option A — auto-init**: Add a container with `data-warp-lines`; the script inits on DOM ready.
    ```html
    <script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js"></script>
    <div data-warp-lines></div>
    <script src="script.js"></script>
    ```
- **Option B — manual init**: No attribute; call after DOM ready.
    ```html
    <script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js"></script>
    <div id="hero-canvas"></div>
    <script src="script.js"></script>
    <script>
        document.addEventListener('DOMContentLoaded', function () {
            initWarpLines({ container: '#hero-canvas' })
        })
    </script>
    ```
- Size the container (e.g. full viewport: `width: 100vw; height: 100vh`). The script creates the canvas inside it and fills the container.

## Build Commands

| Command                 | Description                                                                    |
| ----------------------- | ------------------------------------------------------------------------------ |
| `npm run build`         | Minify `warp-lines.js` → `dist/script.js`                                      |
| `npm run build:webflow` | Build + copy `dist/script.js` to clipboard + print embed steps                 |
| `npm run serve`         | Serve project root at http://localhost:3000 (so `index.html` loads by default) |
| `npm run watch`         | Rebuild on changes under `src/Homepage`                                        |

## Git & production

- **Branch strategy**: `main` is production-ready; feature work merges here. See **[WORKFLOW.md](WORKFLOW.md)** for branch strategy, release process, and tagging when you ship to Webflow.
- **Release**: `npm run release` runs build + webflow prep and prints the git tag commands so you can record what’s live.

## Notes

- `dist/` is gitignored. Console is stripped in production build.
- Legacy (non-GSAP) version: `docs/legacy/index-legacy.html`; not part of the script build.
- Reference and audit docs live in `docs/` (see `docs/README.md`).

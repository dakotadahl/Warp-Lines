# Alluvium

Line Field animation component for Webflow.

## Quick Start

```bash
# Install dependencies
npm install

# Build minified version for Webflow
npm run build:webflow
```

## Project Structure

```
Alluvium/
├── src/                    # Source code (unminified)
│   └── Homepage/
│       └── index.html     # Development version
├── dist/                   # Generated files (gitignored)
│   └── webflow/
│       └── index.html     # Minified, Webflow-ready
├── scripts/               # Build scripts
│   ├── minify.js          # Minification script
│   └── webflow-prep.js    # Webflow preparation script
└── webflow-ready.html     # Temporary copy-paste file (gitignored)
```

## Development Workflow

1. **Edit source code**: Make changes to `src/Homepage/index.html`
2. **Build**: Run `npm run build` to generate minified version
3. **Deploy**: Run `npm run build:webflow` and copy from `dist/webflow/index.html` or `webflow-ready.html`
4. **Paste**: Copy the minified code into Webflow's custom code section

## Build Commands

- `npm run build` - Generate minified version in `dist/webflow/`
- `npm run build:webflow` - Build + prepare for Webflow (creates `webflow-ready.html` and copies to clipboard on macOS)
- `npm run watch` - Watch for changes and auto-build (requires nodemon)

## Webflow Integration

1. Run `npm run build:webflow`
2. Open `webflow-ready.html` or copy from clipboard
3. In Webflow: Page Settings > Custom Code > Footer Code
4. Paste the minified HTML

## Notes

- Source code is kept unminified for readability
- Minified files are gitignored (generated on demand)
- Console.log statements are automatically removed during minification
- See `PERFORMANCE_AUDIT.md` for optimization details


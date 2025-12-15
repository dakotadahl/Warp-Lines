# Homepage Animation

Canvas-based line field animation with gyroscope support.

## Development

- Edit `index.html` directly
- Run `npm run build` to generate minified version
- Run `npm run build:webflow` to build and prepare for Webflow deployment

## Webflow Deployment

1. Run `npm run build:webflow`
2. Copy content from `dist/webflow/index.html` or `webflow-ready.html`
3. Paste into Webflow custom code section (in Page Settings > Custom Code > Footer Code)

## File Structure

- `index.html` - Source code (unminified, for development)
- `dist/webflow/index.html` - Minified version (generated, gitignored)
- `webflow-ready.html` - Temporary file for easy copy-paste (gitignored)

## Build Commands

```bash
# Build minified version
npm run build

# Build and prepare for Webflow (copies to clipboard on macOS)
npm run build:webflow

# Watch for changes and auto-build (optional)
npm run watch
```


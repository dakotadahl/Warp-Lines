# Git & production workflow

How this repo supports the **source → build → Webflow** pipeline.

## Branch strategy

| Branch   | Purpose |
|----------|--------|
| **main** | Single source of truth. Production-ready code; all feature work merges here. |
| **prod** | Dedicated deploy branch. The commit currently live in Webflow. Updated from `main` after each deploy. |
| **feature/*** | Work-in-progress. Merge into `main` when ready. |

- **Develop** on feature branches (or directly on `main` for small fixes).
- **Build** from `main`: `npm run build` → `dist/script.js`.
- **Ship** to Webflow: `npm run build:webflow` (build + clipboard + embed steps), then paste into Webflow.
- **Record** what’s live: tag a release and update `prod` to match `main`.

## Release process (what’s in production)

When you deploy the built script to Webflow:

1. Ensure you’re on `main` and everything is committed.
2. Build and copy to clipboard:
   ```bash
   npm run build:webflow
   ```
3. Paste the script into Webflow and publish.
4. Tag this commit so you know what’s live:
   ```bash
   git tag -a v1.0.0 -m "Release v1.0.0 – warp lines for Webflow"
   git push origin v1.0.0
   ```
5. Update the `prod` branch to this commit:
   ```bash
   git checkout prod && git merge main --ff-only && git push origin prod && git checkout main
   ```

Use [semver](https://semver.org/) if you like: **v1.0.0** (major.minor.patch). Bump patch for small fixes, minor for new behavior, major for breaking embed/API changes.

## Quick reference

```bash
# Feature work
git checkout -b feature/my-change
# ... edit src/Homepage/warp-lines.js or index.html, preview via index.html ...
git add -A && git commit -m "Describe change"
git checkout main && git merge feature/my-change

# Ship to Webflow
npm run build:webflow
# Paste in Webflow, then:
git tag -a v1.0.1 -m "Release v1.0.1"
git push origin v1.0.1
git checkout prod && git merge main --ff-only && git push origin prod && git checkout main
```

## Build artifacts

- **dist/** is gitignored. Production script is built from `src/Homepage/warp-lines.js`; it is not committed.
- To reproduce a past release: checkout the tag, run `npm run build`, use the generated `dist/script.js`.

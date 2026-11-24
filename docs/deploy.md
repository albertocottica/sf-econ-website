# Deployment

The site is published to GitHub Pages automatically. The live URL is:

https://scifieconomicslab.github.io/website/

## The workflow

`.github/workflows/pages.yml` runs on every push to `main` and on manual dispatch.

```yaml
on:
  push:
    branches: [main]
  workflow_dispatch:
```

Permissions:

- `contents: read`
- `pages: write`
- `id-token: write`

A concurrency group (`pages`) cancels an in-progress run when a newer push arrives.

### Build job

1. Check out the repository.
2. Set up Node 20 with npm caching.
3. `npm ci`
4. `npm test` (model golden test and heritage check)
5. `npm run build`
6. Upload `_site/` as a Pages artifact.

### Deploy job

Publishes the uploaded artifact to the `github-pages` environment with `actions/deploy-pages@v4`.

If `npm test` or `npm run build` fails, the deploy job does not run and the previous site stays live.

## Manual deploy

You do not need to run the workflow by hand, but you can:

1. Open the **Actions** tab on GitHub.
2. Select **Deploy site to GitHub Pages**.
3. Choose **Run workflow** on `main`.

To publish from another host, run `npm run build` and upload the contents of `_site/`. The site works from any static host and from a sub-path such as `example.org/lab/`, because all internal links are relative.

## Why relative URLs matter

GitHub Pages serves the project at `/website/`. Every link is relative and ends in `index.html`, so the same build works at the domain root, under a sub-path, and from `file://`.

If you add a hand-written link, write it as `../folder/index.html` rather than `/folder/`.

## Pull request checks

The workflow currently has no `pull_request` trigger. Pull requests therefore get no automated test or build. See [Testing](testing.md#ci) for the suggested trigger if you want checks before merge.

Until then, run `npm test` and `npm run build` locally before opening a pull request, and watch for `[warn]` lines.

## Preview

- **Live site:** https://scifieconomicslab.github.io/website/
- **Local preview:** `npm run serve` then open http://localhost:8080

See [Preview](preview.md) for the short version.

## Cache busting

CSS and JS URLs include a build timestamp (`?v=...`), so a deploy never serves new HTML with an old cached script. Static assets such as images and fonts keep stable names; if you replace one in place, it may stay cached until the next hard reload.

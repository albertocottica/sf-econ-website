# Preview

## Live site

https://scifieconomicslab.github.io/website/

Every push to `main` rebuilds and redeploys automatically. See [Deployment](deploy.md).

## Local preview

```bash
npm run serve        # http://localhost:8080
```

`npm run serve` rebuilds when a note, template, stylesheet, or data file changes. Reload the browser to see the result. The build itself is under a second.

## Static preview

```bash
npm run build
python3 -m http.server --directory _site 8080
```

You can also open `_site/index.html` directly in a browser. Relative links make the `file://` case work.

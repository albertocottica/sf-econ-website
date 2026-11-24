# Building and running

## Requirements

- Node.js 18 or newer, with npm. The GitHub Actions workflow uses Node 20.
- Python 3 only if you want the optional image tools or the reference model. See [Maintaining the site](maintaining.md).

## First-time setup

From the project root:

```bash
npm install
```

This installs Eleventy, markdown-it, its footnote plugin, and gray-matter into `node_modules/`.

## Commands

| Command | What it does |
|---|---|
| `npm run build` | Compiles the whole site into `_site/` |
| `npm run serve` | Builds, serves at `http://localhost:8080`, and rebuilds when a file changes |
| `npm test` | Runs the model golden test and the heritage integrity check |

The build takes under a second. It prints each page it writes.

## What the build produces

`_site/` is a complete, self-contained copy of the site:

- One folder per note, each holding an `index.html`. For example `_site/work/2024-05-science-fiction-economics-residency-in-messina/index.html`.
- `_site/assets/` with the compiled stylesheets, scripts, fonts, people photos, funder logos, and figures.
- `_site/index.html`, `_site/work/index.html`, `_site/people/index.html`, `_site/heritage/index.html`, and the model page.

Every internal link is relative and points at a real `index.html`. The output works in three ways:

1. Served by any static host.
2. Served locally with `python3 -m http.server` run inside `_site/`.
3. Opened straight from a folder, by double-clicking `_site/index.html`.

`_site/` is generated. Do not edit it by hand and do not commit it. It is listed in `.gitignore`.

## Reading the build output

Watch for lines starting with `[warn]`:

- `unresolved wikilinks` lists `[[links]]` that point at no note, as `file: [[target]]`.
- `duplicate note titles` lists titles that two notes share and that folder priority cannot settle. A bare link will resolve to `people/` first, then `work/`, `offers/`, and so on.

Heritage errors are different. They stop the build and name the thinker, branch, or sub-branch that does not match.

Fix warnings before you publish. Only errors stop the build.

## What the build skips

These folders and files are never published as pages:

`docs/`, `brief/`, `model/`, `templates/`, `ticker/`, `copy/`, `node_modules/`, `_site/`, `PLAN.md`, `README.md`, `AUDIT-*.md`, `essays/policy-on-opinion-essays.md`, and the Markdown inside `.site/assets/`.

Some of them still feed the site:

- `ticker/` is read as data by the Courier.
- `copy/` notes are injected into the landing page through the `noteBody` filter.
- `model/` is the reference implementation tested against the browser model.

## Project layout

```text
index.md                  landing page content (hero text and bullet points)
one-planet-one-humanity.md webinar page kept at the old site's URL (not in the navigation)
work/                     one note per piece of work, plus index.md for the list page
people/                   one note per person, plus index.md for the People page
heritage/                 the family tree of ideas, one note per node
method/                   the How we work steps and supporting notes
models/                   write-ups of the town model
offers/                   the Work with us cards
copy/                     text fragments pulled into the landing page (not published)
essays/                   opinion notes, published as ordinary pages
brief/                    planning notes, not published
ticker/                   voice of the Linden Cove Courier (cast, rules, templates)
model/                    reference economic model in Python and its test data
templates/                starter notes for each content type (not published)
docs/                     this documentation (not published)
.site/                    templates, styles, scripts, data, and tools
_site/                    build output (generated, gitignored)
```

Inside `.site/`:

```text
eleventy.config.js        build configuration, Markdown setup, filters, passthrough
layouts/                  page templates (base, landing, note, work, people, heritage)
plugins/                  vault reader, wikilink support, heritage data builder
_data/                    site settings, palettes, funders, and data built from the notes
pages/                    the tokens.css template that generates the palette variables
assets/                   css, js, fonts, images, people photos, funder logos, work illustrations, figures
tools/                    optional Python scripts and the heritage check
```

## Publishing

Deployment is automatic. Every push to `main` runs `.github/workflows/pages.yml`, which installs, tests, builds, and publishes `_site/` to GitHub Pages:

https://scifieconomicslab.github.io/website/

A failed test or build stops the deploy, so the previous site stays live. To publish from another host, run `npm run build` and upload the contents of `_site/`. Relative links mean a sub-path such as `example.org/lab/` needs no configuration.

See [Deployment](deploy.md) for the workflow details and the manual options.

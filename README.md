# Sci-Fi Economics Lab — Website (Prototype v3)

The public website for the [Science Fiction Economics Lab](https://scifieconomicslab.github.io/website/), built as a static site with **Eleventy (11ty)** from a folder of Markdown notes. There is no database and no server code: Markdown goes in, HTML comes out.

> **Live site:** https://scifieconomicslab.github.io/website/

---

## Quick start

```bash
npm install          # once
npm run serve        # live preview at http://localhost:8080
npm run build        # writes the finished site to _site/
npm test             # economic model + heritage integrity checks
```

**Requirements:** Node.js 18 or newer (the CI uses Node 20). Python 3 is optional, only for the image tools and the reference model.

The build takes under a second. `_site/` is generated and gitignored. Do not edit it by hand.

---

## What is where

Content is Markdown at the repository root. Each folder is one component of the site.

| Folder or file | What it is | Edit guide |
|---|---|---|
| `index.md` | The landing page: hero text, bullets, and the section order | [Landing page](docs/editing.md#landing-page) |
| `work/` | Projects, residencies, games, publications. Also `work/index.md` for the Our work page | [Work entries](docs/editing.md#work-entries) |
| `people/` | Team members and collaborators. Also `people/index.md` for the People page | [People](docs/editing.md#people) |
| `heritage/` | The three-level family tree: branches, clusters, and thinkers | [Heritage tree](docs/editing.md#heritage-tree) |
| `method/` | The nine generative ethnography steps plus supporting notes | [How we work](docs/editing.md#how-we-work) |
| `models/` | Write-ups of the economic models, starting with Linden Cove | [Models](docs/editing.md#models) |
| `offers/` | The "Work with us" cards | [Offers](docs/editing.md#offers) |
| `copy/` | Text fragments injected into the landing page. Not published as pages | [Copy fragments](docs/editing.md#copy-fragments) |
| `essays/` | Opinion pieces. The internal policy note is excluded from the build | [Essays](docs/editing.md#essays) |
| `ticker/` | The Linden Cove Courier: cast, rules, and headline templates | [The Courier](docs/editing.md#the-linden-cove-courier) |
| `brief/` | Planning notes from the design brief. Never published | [Brief](docs/editing.md#brief-notes) |
| `templates/` | Starter notes for each content type. Not published | [Templates](docs/editing.md#templates) |
| `PLAN.md` | The original design plan and model equations. Not published | — |
| `AUDIT-*.md` | Internal review notes. Not published | — |

Technical components live under `.site/` and `model/`.

| Path | What it is | Reference |
|---|---|---|
| `.site/eleventy.config.js` | Build configuration, Markdown setup, filters, passthrough, ignores | [Architecture](docs/architecture.md) |
| `.site/layouts/` | Nunjucks page templates (`base`, `landing`, `note`, `work`, `people`, `heritage`) | [Layouts](docs/maintaining.md#layouts) |
| `.site/_data/` | Site settings, palettes, funders, and data built from the notes | [Data files](docs/maintaining.md#data-files) |
| `.site/plugins/` | Vault reader, wikilinks, heritage data builder | [Plugins](docs/maintaining.md#plugins) |
| `.site/assets/js/` | The interactive modules (town model, charts, ticker, tree, palette) | [JavaScript modules](docs/maintaining.md#javascript-modules) |
| `.site/assets/css/` | Hand-written styles together with the generated `tokens.css` | [Styling](docs/maintaining.md#palettes-and-tokens) |
| `.site/assets/figures/` | The isometric town figure iframe | [Town figure](docs/maintaining.md#the-town-figure) |
| `.site/pages/tokens.css.njk` | Generates `assets/css/tokens.css` from `palettes.json` | [Palettes](docs/maintaining.md#palettes-and-tokens) |
| `.site/tools/` | Optional Python scripts that generate illustrations, plus the heritage check | [Tools](docs/maintaining.md#tools-and-generated-files) |
| `model/` | Python reference model, golden data, and the JS port test | [The town model](docs/maintaining.md#the-town-model) |
| `docs/` | This documentation. Never published | [Docs index](docs/README.md) |

---

## How the site is built

```text
Markdown notes and front matter (repository root)
        │
        ▼
.plugins/vault.js        reads every note, builds slugs, URLs, wikilinks, backlinks
.plugins/heritage.js     validates and derives the heritage tree
.plugins/wikilinks.js    renders [[links]], embeds, and callouts
        │
        ▼
Eleventy + Nunjucks layouts + .site/_data
        │
        ▼
_site/  (static HTML, CSS, JS, fonts, images)
        │
        ▼
GitHub Pages (Actions workflow on push to main)
```

Every internal link is relative and ends in `index.html`, so the built site also works when opened straight from a folder (`file://`) or served from a sub-path.

Two rules keep links stable:

- A note's file name becomes its URL: `work/2024-05-messina.md` is published at `/work/2024-05-messina/index.html`.
- Titles should be unique. If two notes share a title, a bare `[[Title]]` resolves to the highest priority folder (`people/`, then `work/`, `offers/`, and so on). Use a folder-qualified link such as `[[work/2024-05-messina]]` when you need to be explicit.

---

## Interactive components

All client-side JavaScript is plain JavaScript and lives in `.site/assets/js/`. There is no framework and no bundler.

| Module | Drives |
|---|---|
| `model.js` | The Linden Cove economic model, a line-for-line port of `model/reference_model.py` |
| `sim-ui.js` | The "Run the town" sliders, clocks, charts, events, and the follow-the-change map |
| `ticker.js` | The Courier's headlines, built from `ticker/` and the model output |
| `method-panel.js` | The scroll-driven method flowchart, drawn as SVG |
| `heritage.js` | The heritage tree, its filters, info panel, and the landing-page teaser |
| `palette.js` | The footer palette switcher, saved in the browser |

The model is checked against the Python reference by `npm test`. See [Testing](docs/testing.md).

---

## Editing in 30 seconds

1. Copy the matching starter from `templates/` into the content folder.
2. Rename it. The file name becomes the URL.
3. Fill in the front matter and write the body.
4. Run `npm run serve` and check the page.
5. Run `npm test` and `npm run build` before you commit.

Full field-by-field guidance is in [Editing content](docs/editing.md).

---

## Documentation

| Guide | Read it when you want to |
|---|---|
| [Building and running](docs/building.md) | Install, build, preview, understand the output, and see what the build skips |
| [Editing content](docs/editing.md) | Add or change any content component: landing, work, people, heritage, method, models, offers, copy, essays, ticker |
| [Maintaining the site](docs/maintaining.md) | Settings, palettes, fonts, logos, images, the town model, data files, JavaScript modules, and troubleshooting |
| [Architecture](docs/architecture.md) | Understand how the build works: vault loader, layouts, plugins, filters, routing, wikilinks |
| [Testing](docs/testing.md) | Run and extend the model and heritage checks, and the manual QA checklist |
| [Deployment](docs/deploy.md) | Understand the GitHub Pages workflow and how changes reach the live site |
| [Preview](docs/preview.md) | Quick links to the live site and local preview |

---

## Deploying

The site deploys automatically from `main` through `.github/workflows/pages.yml`:

1. `npm ci`
2. `npm test`
3. `npm run build`
4. Upload `_site/` and deploy to GitHub Pages

A failed test or build stops the deploy, so the previous site stays live. See [Deployment](docs/deploy.md) for details, including how to run it manually.

---

## Conventions

- **File first.** Content lives in Markdown, not in a CMS.
- **Wikilinks.** `[[Other Note]]` creates a cross-reference, resolved at build time.
- **Relative URLs.** No absolute paths, so the site works on any host and from `file://`.
- **Vanilla JavaScript.** No framework, no bundler, no transpilation.
- **No minification.** HTML, CSS, and JS are served as written, for readability.
- **Unique titles.** A build warning lists collisions the folder priority cannot settle.
- **Write only what a source supports.** Put anything unverified in a `confirm:` list.

---

## License

Content © Sci-Fi Economics Lab. Code MIT-licensed unless otherwise noted.

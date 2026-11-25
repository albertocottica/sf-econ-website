# Maintaining the site

Routine upkeep: settings, colours, fonts, logos, images, the town model, the JavaScript modules, and what to do when something breaks.

For content edits, see [Editing content](editing.md). For the build internals, see [Architecture](architecture.md).

## Contents

- [Site settings](#site-settings)
- [Palettes and tokens](#palettes-and-tokens)
- [Fonts](#fonts)
- [Funders and partners](#funders-and-partners)
- [Work illustrations](#work-illustrations)
- [People photos](#people-photos)
- [The town model](#the-town-model)
- [The town figure](#the-town-figure)
- [JavaScript modules](#javascript-modules)
- [Data files](#data-files)
- [Layouts](#layouts)
- [Plugins](#plugins)
- [Build configuration](#build-configuration)
- [Tools and generated files](#tools-and-generated-files)
- [Housekeeping checklist](#housekeeping-checklist)
- [Troubleshooting](#troubleshooting)

## Site settings

`.site/_data/site.json`:

| Key | Use |
|---|---|
| `title` | Site name in the title bar and header |
| `tagline` | Fallback page description |
| `contact` | Address behind the contact buttons and the footer |
| `edgeryders` | Link in the footer |
| `town_name` | Name of the toy town (Linden Cove) |

## Palettes and tokens

Colours live in `.site/_data/palettes.json`. Each palette has an `id`, a name, an `audience`, a `why` note, a light or dark `scheme`, a `ui` block, and a `fig` block for the town figure.

The `ui` block holds the CSS tokens: `paper`, `card`, `ink`, `mute`, `line`, `green`, `leaf`, `sun`, `sky`, `rust`, `accent`, `onaccent`, and the chart colours `c1` to `c5`. The `fig` block holds the figure-specific colours.

- `default` at the top of the file picks the palette visitors see first.
- `.site/pages/tokens.css.njk` generates `assets/css/tokens.css` on every build. Do not edit the generated file.
- Visitors switch palette from the footer. The choice is saved in `localStorage` under `lab-palette`, and a `?palette=<id>` query parameter overrides it.
- The inline script in `.site/layouts/base.njk` applies the saved palette before first paint. If the visitor has no saved choice and the system prefers dark, it uses `ledger`.
- The header and footer logo, the town figure, and the charts all follow the active palette.

To add a palette:

1. Copy an existing entry in `palettes.json`.
2. Give it a new `id`, name, and colours.
3. Check text contrast on both `paper` and `card`, and check the chart colours against the background.
4. Add the town-figure colours under `fig`.

## Fonts

Fonts are self-hosted in `.site/assets/fonts/` and declared with `@font-face` at the top of `.site/assets/css/site.css`. There are no requests to external font services.

- `bricolage-grotesque` for display text.
- `hanken-grotesk` for body text, upright and italic.
- `dm-mono` and `ibm-plex-mono` for labels and code.
- `fraunces` for some editorial headings.
- `figtree` is used by the town figure.

To add a font, put the `.woff2` file in the folder, add an `@font-face` block in `site.css`, and add the licence to `LICENSES.txt`. Only add fonts you have the right to serve.

## Funders and partners

The strip below the town lists funders and partners from `.site/_data/funders.json`.

1. Add an entry with `id`, `name`, and `url` to `funders` or `partners`.
2. Save the logo in `.site/assets/funders/` named after the id, for example `blivande.png`. Accepted formats: png, jpg, jpeg, svg, webp.
3. Add `"wordmark": "TEXT"` if the logo has no name in it and you want a word beside it.

Until a logo file exists, the site shows the name as text. `.site/tools/funders-README.md` records where the originals live.

## Work illustrations

Each work entry shows an SVG named after its file. Illustrations are generated, not hand-made:

```bash
python3 .site/tools/make-work-images.py
```

Run it from the project root. It writes `.site/assets/work/<note-name>.svg` for every work note. The build inlines those files through the `workImage` filter, so their colours follow the active palette.

- Available motifs: `bridge orbit4 graph blocks retrofit window podium city table planets town sprout paper radar megacity cards dialogue banners district cycle agents spotlight pyramid camp network school people`.
- A note with an unknown or missing motif prints a warning and gets no image.
- To add a motif, write one drawing function in the script and add its name to the `MOTIFS` list.
- To use a real picture instead, drop an SVG with the same name into `.site/assets/work/`. Re-running the tool overwrites it, so keep a copy.

## People photos

Files go in `.site/assets/people/`. Set `photo: assets/people/<file>` on the person note. Use a portrait crop at about 417 by 480 pixels, with the face in the upper half. Only add photos you have permission to publish, and note any required credit on the person's page.

## The town model

The interactive town runs on `.site/assets/js/model.js`. A Python reference version in `model/reference_model.py` is the source of truth for its numbers.

```bash
python3 model/reference_model.py            # prints the calibration, acceptance tests, and a sweep table
python3 model/reference_model.py --golden   # rewrites model/golden.json
npm test                                    # checks model.js against golden.json and runs the heritage check
```

`model/test_golden.js` runs five scenarios and compares the JavaScript output with `golden.json` field by field. It also exercises the budget-pool mechanics.

When you change the model:

1. Change `reference_model.py` and review its printed tests.
2. Regenerate `golden.json` with `--golden`.
3. Change `model.js` until `npm test` passes.
4. Update the "How this works" text in `models/linden-cove.md` so it matches the model.

`model/golden.json.bak` is ignored by source control.

## The town figure

The isometric town in the hero is an iframe: `.site/assets/figures/town.html`. On narrow screens it stacks below the hero text and becomes shorter.

- The page sends it values with `postMessage`, including weather, service levels, crowding, and the active figure palette.
- The figure sends nothing back; it is a display only.
- `sim-ui.js` pauses the figure when it is off screen or the tab is hidden.
- The HTML is treated as the master copy and is edited directly. `.site/tools/make-town-figure.py` is the historical generator and is not needed to change the figure.

## JavaScript modules

All client-side JavaScript lives in `.site/assets/js/` and is plain JavaScript. There is no framework, no bundler, and no transpilation. Most modules use modern syntax; `heritage.js` is deliberately written in ES5 style for broad compatibility, so keep it that way when editing it.

| Module | Used on | Reads | Does |
|---|---|---|---|
| `model.js` | Landing | Constants in the file | The Linden Cove model. Exposes `createTown`, `step`, `run`, `poolMove`, and helpers |
| `sim-ui.js` | Landing | `#site-data` JSON, the model, the ticker | Sliders, budget pool, clock, events, charts, follow-the-change map, figure messages |
| `ticker.js` | Landing | `site-data.ticker`, model output | Builds the Courier's headlines from rules and templates |
| `method-panel.js` | Landing | `site-data.method` | Draws the method flowchart and runs its timed reveal: Pause/Play, Replay, the step progress line and the caption strip. Clicking a node pins the tour to that step. Stops when the figure is off screen and shows everything at once under `prefers-reduced-motion` |
| `heritage.js` | Landing and Heritage | `site-data.heritage` | Draws the tree (one column per branch on the Heritage page, stacked teaser on the landing page), the filters, the fixed info card, and the small-screen list |
| `palette.js` | Every page | `#palettes-data` JSON | Footer palette switcher, saved in `localStorage` |

The page passes server data to these modules as JSON in `<script type="application/json">` blocks. The `json` filter escapes `<` to `\u003c`, so the JSON is safe inside the HTML.

The town model's module also runs in Node under `npm test`, so keep it free of browser-only APIs.

## Data files

Everything in `.site/_data/` is available to the templates.

| File | Kind | Purpose |
|---|---|---|
| `site.json` | Static | Site title, tagline, contact, footer links, town name |
| `palettes.json` | Static | Colour palettes for the theme switcher and town figure |
| `funders.json` | Static | Funders and partners, with logo ids |
| `vault.js` | Function | Collects notes by type (work, people, offers, models, places, concepts, essays), featured work, and missing links |
| `method.js` | Function | Ordered method steps for the flowchart and captions |
| `heritage.js` | Function | Branches, clusters, and thinkers for the tree. Throws on inconsistent data |
| `tickerData.js` | Function | Parses `ticker/cast.md`, `ticker/rules.md`, and `ticker/templates.md` |
| `build.js` | Value | A timestamp used to cache-bust CSS and JS URLs |
| `eleventyComputed.js` | Computed | Gives notes the `note.njk` layout and the default permalink |

`vault.js`, `method.js`, `heritage.js`, and `tickerData.js` read the Markdown notes through `.site/plugins/vault.js`.

## Layouts

`.site/layouts/` holds the Nunjucks templates.

| Layout | Used by | Renders |
|---|---|---|
| `base.njk` | Every page | Head, meta, palette boot script, header navigation, footer, palette switcher |
| `landing.njk` | `index.md` | Hero, town deck, Why we exist, funders, method flowchart, Our work, heritage teaser, Work with us, people strip |
| `note.njk` | Default for notes | Title, badges, facts, body, backlinks |
| `standalone.njk` | Notes kept at a legacy URL | Optional image with credit, title, body. No badges, facts, crumbs, or backlinks |
| `work.njk` | `work/index.md` | The filterable work grid |
| `people.njk` | `people/index.md` | The grouped team directory |
| `heritage.njk` | `heritage/index.md` | The tree, the sticky information panel, and the small-screen fallback |

`eleventyComputed.js` sets `note.njk` as the layout for any Markdown note that does not set one. Section index pages set their own layout and permalink in front matter.

## Plugins

`.site/plugins/` holds three build-time modules.

| Plugin | Purpose |
|---|---|
| `vault.js` | Walks the notes, parses front matter, builds slugs and URLs, indexes notes for wikilink resolution, and derives backlinks, missing links, and duplicate titles |
| `wikilinks.js` | markdown-it plugin for `[[links]]`, `[[note#heading]]`, `![[image]]`, and `> [!callout]` blocks |
| `heritage.js` | Builds the heritage tree from notes with `heritage_type` and validates branch, cluster, and thinker references |

The `vault.js` skip list decides what is not read as content. It skips dot folders, `node_modules`, `_site`, `model`, `templates`, `ticker`, `docs`, `brief`, `PLAN.md`, `README.md`, and `AUDIT-*.md`.

When two notes share a key, the index prefers the reader-facing folder: `people/`, then `work/`, `offers/`, `models/`, `places/`, `concepts/`, `essays/`, `heritage/`, and `copy/`. Ties break by file path. This keeps resolution deterministic.

## Build configuration

`.site/eleventy.config.js` does the following.

**Markdown.** Initialises markdown-it with HTML, linkify, footnotes, wikilinks, and a `heading_ids` rule. The rule gives every heading an `id` using the same slug function as wikilinks.

**Filters.**

| Filter | Use |
|---|---|
| `root` | Relative path from a page to the site root |
| `rel` | Relative URL from one page to another |
| `slug` | The project slug function |
| `json` | Safe JSON for inline data, escaping `<` |
| `backlinks` | Notes that link to a page |
| `noteBody` | Renders another note's body for a fragment such as the landing copy |
| `workImage` | Inlines a work SVG from `.site/assets/work/` |
| `funderLogo` | Finds a funder logo file by id |
| `year` | First four characters of a date string, or the year of a `Date` |

**Passthrough copy.** Copies scripts, figures, fonts, funders, images, people photos, and `site.css` into `_site/assets/`.

**Ignores.** Skips `node_modules`, `_site`, `model`, `docs`, `brief`, `templates`, `ticker`, `copy`, the opinion-essay policy note, `PLAN.md`, `README.md`, `AUDIT-*.md`, and the internals of `.site/`. The `copy/` notes are still read by the vault for the landing page.

**Cache busting.** `_data/build.js` returns a timestamp. Templates append it as `?v=` to CSS and JS URLs, so browsers never mix an old script with new HTML.

**Relative URLs.** `relUrl` computes the `../` depth from the current page URL and appends `index.html` for folder URLs. This is what makes the site work from `file://`.

## Tools and generated files

`.site/tools/` holds optional scripts. They are not part of the build.

| Tool | Purpose |
|---|---|
| `make-work-images.py` | Generates work illustrations from motifs |
| `make-town-figure.py` | Historical generator for the town figure. The HTML is now the master |
| `make-solarpunk-town.py` | Generates `assets/img/solarpunk-town.svg` |
| `split-brief.py` | One-off split of the original design brief. Do not run it again |
| `check-heritage.js` | Validates the heritage tree. Run by `npm test` |
| `funders-README.md` | Where the original funder logos live |

| Generated file | Source | Note |
|---|---|---|
| `_site/` | `npm run build` | Never edit or commit |
| `assets/css/tokens.css` | `palettes.json` via `pages/tokens.css.njk` | Never edit |
| `.site/assets/work/*.svg` | `make-work-images.py` | Re-running overwrites hand edits |
| `.site/assets/img/solarpunk-town.svg` | `make-solarpunk-town.py` | Illustration under Why we exist |
| `model/golden.json` | `reference_model.py --golden` | Committed; `.bak` is ignored |

## Housekeeping checklist

Before you publish:

- [ ] `npm run build` finishes with no `[warn]` lines.
- [ ] `npm test` passes.
- [ ] Open the landing page and run the town for a few seconds. The ticker should speak and the charts should move.
- [ ] Scroll through How we work. The chart should build step by step and the last caption should end the section cleanly.
- [ ] Check People, Our work, and Heritage in a narrow browser window.
- [ ] Skim `brief/open-questions.md` and decide whether any item is now resolved.
- [ ] Check `needs-url` tags and decide whether each can ship.
- [ ] `site.json` has the right contact address and repository.
- [ ] No orphaned build output. `_site/` is regenerated.

## Troubleshooting

**A new page does not appear.**
The file must be a `.md` file outside the skipped folders in [Building and running](building.md#what-the-build-skips) and must not start with `AUDIT-`. Check that its front matter opens and closes with `---`.

**The build fails with a YAML error.**
Usually an unquoted colon or a wrongly indented list in the front matter. Put the value in quotes.

**A date shows as `Mon Nov 02 2026 ...`.**
Quote the value: `accessed: "2026-11-02"`. Unquoted YAML dates become date objects.

**A `[[link]]` shows as plain text.**
No note has that title or file name. Check spelling, or write the file name without its folder. If two notes share a title, use a folder-qualified link such as `[[people/alberto-cottica]]`.

**The build warns about duplicate titles.**
Two notes share a title and the folder priority cannot settle them. Rename one, or accept the priority and use folder-qualified links. See [Editing content](editing.md#markdown-and-links).

**A person is missing from the People page.**
The note needs `type: person`. Check that `group` is one of Principals, Contributors, Advisers, or Alumni.

**A heritage page shows no explanation.**
Branch, cluster, and thinker notes need `why` and `summary`. Those two fields are what the info panel and the note page show.

**A card has no illustration.**
Run `python3 .site/tools/make-work-images.py` and check its output for an unknown motif.

**A logo does not show.**
The file name must match the funder `id` exactly, including case.

**A copy fragment shows literal `{{ ... }}`.**
Fragments rendered through `noteBody` are Markdown only. Write the value directly in the note.

**Changes do not show in the browser.**
The browser may be caching a stylesheet or script. Reload without the cache. During local development, make sure `npm run serve` is still running.

**The How we work chart looks wrong after an edit.**
Check that every `next` list has a matching `edge_label` list, that each `step` number is unique, and that `tone` is one of the palette tokens.

**Links break when the site is opened from a folder.**
They should not. Every internal link ends in `index.html`. If you add a hand-written link to a folder, write it as `../folder/index.html`.

## Where decisions are recorded

`PLAN.md` holds the original design plan: the audience, the model's equations, the page structure, and the reasons behind the main choices. Read it before changing the structure of the site. It is not published.

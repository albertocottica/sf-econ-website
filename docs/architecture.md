# Architecture

How the site is put together under the hood. Read this before changing the build, the layouts, or the link rules.

## Contents

- [Build pipeline](#build-pipeline)
- [The vault loader](#the-vault-loader)
- [Routing and permalinks](#routing-and-permalinks)
- [Markdown pipeline](#markdown-pipeline)
- [Wikilinks and backlinks](#wikilinks-and-backlinks)
- [Heritage data](#heritage-data)
- [Method data](#method-data)
- [Ticker data](#ticker-data)
- [Layouts and data flow](#layouts-and-data-flow)
- [Filters](#filters)
- [Passthrough and ignores](#passthrough-and-ignores)
- [CSS tokens](#css-tokens)
- [Client-side data handoff](#client-side-data-handoff)
- [Cache busting](#cache-busting)
- [Extension points](#extension-points)
- [Security notes](#security-notes)

## Build pipeline

Eleventy runs with `--config=.site/eleventy.config.js`. Its input is the repository root and its output is `_site/`.

```text
Eleventy startup
  ├─ .site/_data/*        runs the data functions once per build
  │    └─ plugins/vault.js loads and indexes the notes
  ├─ .site/eleventy.config.js
  │    ├─ configures markdown-it (footnotes, wikilinks, heading ids, callouts)
  │    ├─ registers filters
  │    ├─ registers passthrough copies and ignores
  │    └─ runs the pre-build warning check
  ├─ Reads each .md and .njk template
  │    ├─ eleventyComputed.js assigns layout and permalink
  │    ├─ the layout renders with the note's front matter and body
  │    └─ markdown-it renders the note body and any noteBody fragments
  └─ Writes _site/
```

The build is single-pass and takes under a second. There is no incremental cache beyond Eleventy's own.

## The vault loader

`.site/plugins/vault.js` is the single reader of the notes. Every data function and the wikilink plugin use it.

`load()` runs once per build and is cached. `reset()` clears the cache before each rebuild so the dev server sees edits.

### What it reads

It walks the repository root and collects `.md` files, skipping:

- Dot folders, so `.site`, `.github`, `.obsidian`, and `.git`.
- `node_modules`, `_site`, `model`, `templates`, `ticker`, `docs`, `brief`.
- `PLAN.md`, `README.md`, and any `AUDIT-*.md`.

`copy/` is still read because the landing page uses its fragments. It is excluded from the build output by the Eleventy ignores, not by the vault.

### What it records per note

| Field | Value |
|---|---|
| `rel` | Path from the root, with forward slashes |
| `base` | File name without `.md` |
| `folder` | Folder path, or empty at the root |
| `slug` | `slugify(base)` |
| `url` | The page URL |
| `title` | Front matter `title`, or the base name |
| `data` | Parsed front matter |
| `body` | Markdown body, without front matter |

`slugify` lowercases, normalises accents, turns `&` into `and`, replaces runs of non-alphanumerics with `-`, and trims dashes. `work/2016-01-network-papers-on-online-communities.md` becomes `2016-01-network-papers-on-online-communities`.

### The index

Every note is registered under five keys: `base`, `title`, `slug`, `folder/base`, and `folder/slug`. Keys are lowercased.

When two notes claim the same key, the loader keeps the higher-priority folder:

```text
people/ > work/ > offers/ > models/ > places/ > concepts/ > essays/ > heritage/ > copy/
```

Ties break by file path, so resolution is deterministic across machines. This is why a bare `[[Alberto Cottica]]` resolves to the people page even when a heritage note also uses the title.

### Derived data

- `backlinks(rel)` returns the notes whose body or front matter links to this note.
- `missing` lists unresolved `[[links]]` for the build warning.
- `duplicateTitles` lists title collisions that folder priority cannot settle.

Front matter is scanned for wikilinks as well as the body, so a link inside `summary` still produces a backlink.

## Routing and permalinks

`.site/_data/eleventyComputed.js` assigns:

- `layout`: the front matter layout, or `note.njk` for any Markdown note without one.
- `permalink`: the front matter permalink, or a default.

The default permalink is `/<folder>/<slug>/index.html`. A note called `index.md` maps to `/folder/` instead. The root `index.md` maps to `/index.html`, which Eleventy normalises to `/` as `page.url`.

Section index pages set both `layout` and `permalink` explicitly:

```yaml
layout: work.njk
permalink: /work/index.html
```

### Why URLs end in index.html

Every internal link is relative and points at a real `index.html`. Examples:

- From `/heritage/` to `/people/`: `../people/index.html`
- From `/` to `/models/linden-cove/`: `./models/linden-cove/index.html`

The `relUrl` helper computes the depth from the current page's URL, appends `../` for each folder, and adds `index.html` for folder targets. This is what makes the site work from `file://` and from a sub-path such as `/website/`.

## Markdown pipeline

markdown-it is configured in `.site/eleventy.config.js`:

- `html: true`, so raw HTML in notes is allowed.
- `linkify: true`, so bare URLs become links.
- `typographer: false`, so quotes and dashes are left as written.
- `markdown-it-footnote`, for `[^1]` footnotes.
- The project wikilink plugin.
- A `heading_ids` core rule that sets `id` on every heading using the same slug function as wikilinks. This makes `[[note#heading]]` links work.

Eleventy renders Markdown templates through Nunjucks first, so `{{ }}` expressions in a note are evaluated on the note's own page. The `noteBody` filter does not do this; see [Copy fragments](editing.md#copy-fragments).

## Wikilinks and backlinks

`.site/plugins/wikilinks.js` is a markdown-it inline rule plus a renderer.

Syntax:

| Write | Result |
|---|---|
| `[[Title]]` | Link to the note, label is the note title |
| `[[Title\|label]]` | Link with custom label |
| `[[folder/name\|label]]` | Folder-qualified link |
| `[[Title#Heading]]` | Link to a heading anchor |
| `![[file.svg]]` | Embed an image from `assets/` |

If the target does not resolve, the renderer emits a `<span class="wikilink missing" data-missing="...">` with the label, and the loader records it in `missing`.

Backlinks are derived, not written. A note that is linked from another appears in the target's "Linked from" block.

## Heritage data

`.site/_data/heritage.js` calls `.site/plugins/heritage.js`, which:

1. Selects every note with `heritage_type`, regardless of folder.
2. Builds branches from `heritage_type: branch`.
3. Builds clusters from `heritage_type: cluster`, linking each to its branch note.
4. Builds thinkers from `heritage_type: person`.
5. Derives cluster membership and branch sub-branch lists from the thinker notes only.
6. Validates the result and throws on error.

Validation rules:

- A cluster's `branch` must name a real branch.
- A thinker needs at least one branch and a `profession`.
- Every `sub_branch` must name a real cluster, and the named `branch` must match the cluster's branch.
- Thinker ids must be unique.
- A cluster with no thinkers is an error.

The `status` shown in the tree is `heritage_status` if present, otherwise `status`, otherwise `candidate`.

Branches, clusters, and thinkers expose `why` and `summary` to the tree. A note that is also a person page can set `heritage_why` and `heritage_summary`, which take precedence over the note's own `summary`.

## Method data

`.site/_data/method.js` selects notes in `method/` that have a `step`, sorts them by `step`, and exposes `label`, `next`, `edge`, `tone`, `caption_title`, `caption_body`, `summary`, and `url` to the flowchart.

`method-panel.js` holds the hand-drawn SVG geometry for the nodes and edges. The labels come from the notes through `next` and `edge_label`. If a note's `next` list and `edge_label` list have different lengths, the extra labels are simply not used; the build does not fail.

## Ticker data

`.site/_data/tickerData.js` reads `ticker/cast.md`, `ticker/rules.md`, and `ticker/templates.md` and returns:

- `firms`: the firm table with numeric weights.
- `residents`: the resident table.
- `templates`: one array of headline variants per rule id.
- `rules`: channel, cooldown, and priority per rule id.

The trigger logic stays in `.site/assets/js/ticker.js`.

## Layouts and data flow

| Layout | Receives | Produces |
|---|---|---|
| `base.njk` | `site`, `palettes`, `build`, `page` | The shared shell, navigation, footer, palette boot script |
| `landing.njk` | `vault`, `funders`, `palettes`, `site`, `tickerData`, `method`, `heritage` | The full landing page |
| `note.njk` | The note's front matter and body, `page` | A single note page with badges, facts, body, backlinks |
| `standalone.njk` | The note's front matter and body, `page` | A plain page with an optional image, title, and body. No badges, facts, crumbs, or backlinks. Used for pages kept at a legacy URL |
| `work.njk` | `vault.work` | The filterable work grid |
| `people.njk` | `vault.people` | The grouped people directory |
| `heritage.njk` | `heritage` | The tree page with a sticky info panel |

Base passes the shared data to every page. Page layouts add what they need.

## Filters

Registered in `.site/eleventy.config.js`:

| Filter | Signature | Use |
|---|---|---|
| `root` | `url` | Relative path from a page to the site root |
| `rel` | `to, from` | Relative URL from one page to another |
| `slug` | `s` | Slugify a string |
| `json` | `v` | JSON for inline `<script>`, with `<` escaped |
| `backlinks` | `page` | Notes linking to this page |
| `noteBody` | `rel, pageUrl` | Render another note's body as Markdown |
| `workImage` | `rel` | Inline `.site/assets/work/<base>.svg` |
| `funderLogo` | `id` | Find a funder logo file by id |
| `year` | `s` | First four characters, or the year of a `Date` |

## Passthrough and ignores

Passthrough copies:

```text
.site/assets/js       -> assets/js
.site/assets/figures  -> assets/figures
.site/assets/fonts    -> assets/fonts
.site/assets/funders  -> assets/funders
.site/assets/img      -> assets/img
.site/assets/people   -> assets/people
.site/assets/css/site.css -> assets/css/site.css
```

`assets/css/tokens.css` is not copied; it is generated by `.site/pages/tokens.css.njk` at the permalink `/assets/css/tokens.css`.

Ignored from template rendering:

`node_modules`, `_site`, `model`, `docs`, `brief`, `templates`, `ticker`, `copy`, `essays/policy-on-opinion-essays.md`, `PLAN.md`, `README.md`, `AUDIT-*.md`, `.site/layouts`, `.site/tools`, `.site/_data`, `.site/plugins`, and Markdown inside `.site/assets`.

Ignoring a file from rendering does not stop the vault from reading it. This is how `copy/` and `ticker/` feed the site without becoming pages.

## CSS tokens

`.site/pages/tokens.css.njk` loops over `palettes.json` and emits one `:root[data-palette="<id>"]` block per palette, with the default palette also applied to `:root`. `assets/css/site.css` holds all other styles and is copied as-is.

The palette switcher sets `data-palette` on `<html>`. The inline script in `base.njk` applies the saved or preferred palette before first paint to avoid a flash.

## Client-side data handoff

Templates embed server data as JSON:

```html
<script id="site-data" type="application/json">{ ... }</script>
<script id="palettes-data" type="application/json">{ ... }</script>
```

The modules read these with `JSON.parse(document.getElementById(...).textContent)`. The `json` filter escapes `<`, so a note containing `</script>` cannot break out.

The town figure is an iframe. `sim-ui.js` sends it `{ fig: { w, tw, event } }` with `postMessage(..., '*')`, and sends `{ fig: { run } }` to pause or resume. The figure does not send data back.

## Cache busting

`.site/_data/build.js` returns a timestamp as a base-36 string. Templates append it as `?v={{ build }}` to CSS and JS URLs. New HTML therefore never runs against an old cached script.

## Extension points

- **New content type.** Add a folder, a template, and a `type`. Add a collector in `_data/vault.js` if a template needs the list. Add a layout if the page needs a custom shape.
- **New filter.** Add it in `eleventy.config.js` and document it in [Maintaining the site](maintaining.md#build-configuration).
- **New client module.** Add a plain JavaScript file in `.site/assets/js/`, load it from the layout with `?v={{ build }}`, and pass data through a `site-data` JSON block.
- **New generated page.** Add a `.njk` file under `.site/pages/` with a `permalink`.
- **New palette.** Edit `palettes.json`. No code change is needed.

## Security notes

- Content is trusted. Raw HTML in notes is allowed, and `| safe` is used where rendered Markdown is injected.
- Inline JSON uses the `json` filter, which escapes `<`.
- Wikilink labels and titles are escaped with markdown-it's `escapeHtml` or the module's `esc` helper before they reach `innerHTML`.
- The iframe uses `postMessage` with `'*'`. It is same-origin content and receives no secrets, so this is acceptable. If the figure ever moves to another origin, set an explicit target origin.
- The site has no server code, no cookies, and no third-party requests. The only stored state is `localStorage['lab-palette']`.

## Related guides

- [Building and running](building.md)
- [Editing content](editing.md)
- [Maintaining the site](maintaining.md)
- [Testing](testing.md)

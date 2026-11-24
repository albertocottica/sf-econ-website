# Editing content

All content is Markdown with a block of settings at the top, called front matter. Edit the files in any text editor. The repository root also opens as an [Obsidian](https://obsidian.md) vault.

After any edit, run `npm run build` (or leave `npm run serve` running) and check the result in the browser.

## Contents

- [Editing through GitHub](#editing-through-github)
- [How a note works](#how-a-note-works)
- [Common fields](#common-fields)
- [Markdown and links](#markdown-and-links)
- [Landing page](#landing-page)
- [Work entries](#work-entries)
- [People](#people)
- [Heritage tree](#heritage-tree)
- [How we work](#how-we-work)
- [Models](#models)
- [Offers](#offers)
- [Copy fragments](#copy-fragments)
- [Essays](#essays)
- [The Linden Cove Courier](#the-linden-cove-courier)
- [Brief notes](#brief-notes)
- [Templates](#templates)
- [Adding a new content type](#adding-a-new-content-type)
- [Before you commit](#before-you-commit)

## Editing through GitHub

The site is not editable from its own pages. All changes go through the repository at <https://github.com/scifieconomicslab/website>:

1. Open the note in GitHub (or clone the repo) and edit it. The file path matches the section: `work/`, `people/`, `heritage/`, and so on.
2. Run `npm test` and `npm run build` locally if you cloned it. Both also run in CI.
3. Commit to `main`. The deploy workflow rebuilds and publishes the site. If a check fails, the old site stays live.

## How a note works

```markdown
---
title: "Space Economy Camp"
type: work
summary: "One sentence used on cards and link previews."
---

## What it is

Body text in Markdown.
```

- The file name becomes the page address. `work/2023-11-space-economy-camp.md` is published at `/work/2023-11-space-economy-camp/`.
- Start each new note from the matching file in `templates/`. Copy it, rename it, and fill it in.
- Put quotation marks around any value that contains a colon.
- Put quotation marks around dates such as `accessed: "2026-11-02"`. Unquoted dates are parsed into date objects and render as a long time string.
- A note with no `layout` uses `note.njk`, which shows the title, badges, facts, body, backlinks, and any `confirm` list.
- Section index pages (`work/index.md`, `people/index.md`, `heritage/index.md`) set their own `layout` and `permalink`.

### Front matter rules

- The file must start with `---` on the first line and close the block with `---`.
- YAML is indented with spaces.
- Lists can be inline (`tags: [showcase]`) or block form (`- item` per line).
- Strings containing `:`, `#`, `{`, `}`, `[`, `]`, or a leading special character should be quoted.

## Common fields

These fields work on any note.

| Field | Meaning |
|---|---|
| `title` | Page title, and the default text for a bare wikilink |
| `type` | `note`, `person`, `work`, `model`, `place`, `concept`, `essay`, `heritage`, `method`, or `offer` |
| `stage` | Growth stage: `seedling`, `sapling`, or `evergreen`. Shown as a badge |
| `status` | How settled the claim is: `speculative`, `working`, or `settled`. Shown as a badge |
| `summary` | One sentence for cards, previews, and the page lead. On heritage nodes it holds the rest of the explanation; see [Heritage tree](#heritage-tree) |
| `tags` | A list such as `[showcase]`, `[principal]`, or `[copy]` |
| `featured` | `true` shows a work note as a card in the landing page's Our work section |
| `thread` | Optional Edgeryders discussion link, shown at the foot of the page |
| `confirm` | A list of open questions, shown in a dashed "To confirm" box |
| `layout` | Override the template. Section indexes set this |
| `permalink` | Override the output path. Section indexes set this |

The facts box under a page's lead shows these when present: `period`, `who`, `kind`, `role`, `partners`, `country`, `decision`, `why_it_matters`, `url`, `accessed`, and `repo`.

## Markdown and links

Markdown is parsed by markdown-it with footnotes, link autodetection, and raw HTML enabled.

### Wikilinks

Link to another note by its title or file name, without the folder or extension:

| Write | Result |
|---|---|
| `[[Alberto Cottica]]` | Link using the note's title |
| `[[people/alberto-cottica\|Alberto]]` | Link with your own wording, or disambiguate when two notes share a title |
| `[[overview#Step 1]]` | Link to a heading |
| `![[town.svg]]` | Embed an image from `assets/` |

- **Resolution.** A link is matched against title, file name, slug, and folder-qualified name. Matching is case-insensitive and ignores `.md`.
- **Priority.** When two notes share a title, a bare link resolves to `people/`, then `work/`, `offers/`, `models/`, `places/`, `concepts/`, `essays/`, `heritage/`, `copy/`.
- **Unresolved links** render as plain text with a `data-missing` attribute, and the build prints a warning.
- **Backlinks.** Every note that links to a page appears in that page's "Linked from" block, derived automatically.
- **Heading links.** Headings get stable `id`s at build time, using the same slug rule as wikilinks.

### Callouts

```markdown
> [!note] A title
> The body of the callout.
```

The block becomes a styled `callout callout-note` with a title. Any word after `[!` works (`[!warning]`, `[!tip]`, and so on).

### Footnotes

```markdown
A claim with a footnote.[^1]

[^1]: The note text.
```

### Other Markdown

Tables, lists, blockquotes, code fences, images (`![alt](assets/img/file.svg)`), and raw HTML all work. Prefer relative paths that start with `assets/` or `../`.

## Landing page

The landing page is `index.md`. Its front matter sets the hero. Its body is empty because the layout builds the page.

```yaml
---
title: Sci-Fi Economics Lab
layout: landing.njk
eyebrow: A research lab for economic futures
hero_title: Economies are choices. What will you choose?
hero_lede: We support the design of local economies that put people and planet first.
hero_points:
  - Simulation models as thinking tools for your community, built on complexity economics.
  - Science fiction narratives to render economic policies into people's daily lives.
  - Participatory tools and techniques for economic democracy and policy design.
permalink: /index.html
eleventyExcludeFromCollections: true
---
```

Where the rest of the landing page comes from:

| Block | Source |
|---|---|
| Hero eyebrow, title, lede, bullets | `index.md` front matter |
| Run the town controls, charts, and ticker | `.site/layouts/landing.njk` plus the JavaScript modules |
| Why we exist text | Body of `copy/opening-provocation.md` |
| Funders and partners | `.site/_data/funders.json` and `.site/assets/funders/` |
| How we work flowchart | `method/*.md` through `.site/assets/js/method-panel.js` |
| Process name under the flowchart | Body of `copy/process-name.md` |
| Our work cards | Work notes with `featured: true` |
| Work with us cards | `offers/*.md` |
| Heritage teaser | Heritage notes |
| People strip | `people/*.md` |
| Contact, footer links, town name | `.site/_data/site.json` |

Several section intros (for example the lead above the Our work cards) are written directly in `.site/layouts/landing.njk`. To change those, edit the layout, not `index.md`.

To change the order of sections or remove one, edit `.site/layouts/landing.njk`.

## Work entries

Folder: `work/`. One note per piece of work. The Our work page sorts them newest first by `start`.

```yaml
---
title: "Space Economy Camp"
type: work
stage: sapling
status: working
period: "Nov 2023"          # text shown to readers
start: 2023-11              # YYYY-MM, used for sorting
kind: workshop              # see the groups below
who: "J M Applegate, Alberto Cottica"
motif: planets              # picks the illustration
featured: false
source_url: "https://example.org/the-original"
source_label: "Edgeryders, Designer economies"
summary: "One or two sentences."
why_it_matters: "Why a partner should care."
tags: [showcase]
confirm:
  - "Attendance is not in the source."
---
```

Body sections, in this order: `## What it is`, `## What we did`, `## How it turned out`, `## Sources`. Say only what a cited source supports.

Things to know:

- **Missing link.** Leave `source_url` empty and add the tag `needs-url`. The card shows "link to add" and the page shows "Original link to be added".
- **Open questions.** Put anything unverified in `confirm`. Delete the list when it is resolved.
- **Filter groups.** The Our work page groups kinds into Models and software, Games and worlds, Events, Teaching, Papers and reports, and Partnerships. The mapping is the `groupOf` table in `.site/layouts/work.njk`. Add new kinds there.
- **Kinds in use.** `model`, `simulation`, `data`, `game`, `world`, `event`, `festival`, `residency`, `seminar`, `webinars`, `workshop`, `talk`, `school`, `teaching`, `publication`, `report`, `research`, `collective`, `partnership`.
- **Illustration.** Each entry shows an SVG named after the file. Run `python3 .site/tools/make-work-images.py` after adding a note. See [Work illustrations](maintaining.md#work-illustrations).
- **The list page.** `work/index.md` sets its own `lead`. Edit it there.

To add a work entry:

1. Copy `templates/work.md` to `work/YYYY-MM-slug.md`.
2. Fill in the front matter. Set `start` and `period`.
3. Write the four body sections.
4. Run `python3 .site/tools/make-work-images.py` if the motif is new.
5. Run `npm run serve` and check `/work/`.

## People

Folder: `people/`. The People page is built from these notes. Add a person by copying `templates/person.md`.

```yaml
---
title: "Alberto Cottica"
type: person
role: "Principal"
group: Principals           # Principals, Contributors, Advisers, or Alumni
order: 1                    # lower numbers first inside a group
headline: "Economist and network scientist, Edgeryders"
photo: assets/people/alberto-cottica.jpg
summary: "Used on the card."
---
```

- **Groups** appear in this order: Principals, Contributors, Advisers, Alumni. A person with no `group` goes under Contributors. A group with nobody in it is hidden.
- **Photo.** Save the image in `.site/assets/people/` and set `photo` to `assets/people/<file>`. Use a portrait crop at about 417 by 480 pixels, with the face in the upper half. Without a photo the card shows the first letter of the name.
- **Landing page.** Every person also appears in the short strip under The people on the landing page.
- **Page intro.** The sentence under the People heading is the `lead` in `people/index.md`.
- **Heritage fields.** A person who is also a heritage thinker can carry the heritage fields on the same note. `people/alberto-cottica.md` does this with `heritage_type`, `branches`, `profession`, `heritage_why`, `heritage_summary`, `nominated_by`, and `heritage_status`. The `heritage_` prefix keeps these separate from the person's own `summary`. See [Heritage tree](#heritage-tree).

To add a person:

1. Copy `templates/person.md` to `people/first-last.md`.
2. Fill in the front matter and write the body, keeping `## What they bring` last.
3. Add a photo to `.site/assets/people/` and set `photo`.
4. Check `/people/` and the landing page.

## Heritage tree

Folder: `heritage/`. The tree has three levels. Each level is a small note with `type: heritage`.

Every heritage node has two text fields: `why` (the first sentence) and `summary` (the rest). There is no `short_hook`. The info panel and the note page show `why` then `summary`.

- **Branch** (`heritage/branches/`): `heritage_type: "branch"` and a `branch` name.
- **Cluster** (`heritage/clusters/`): `heritage_type: "cluster"`, a `sub_branch` name, and the `branch` it sits under.
- **Thinker** (`heritage/`): `heritage_type: "person"`, as below.

Branch note:

```yaml
---
title: "The Danger Zone"
type: heritage
heritage_type: "branch"
branch: "The Danger Zone"
why: "The vision of a unified social science at the intersection of economics and anthropology."
summary: "Epistemic inclusivity and interdisciplinarity are essential when you work on the ground on specific places."
---
```

Cluster note:

```yaml
---
title: "Money and finance"
type: heritage
heritage_type: "cluster"
branch: "The Chemical Wedding"
sub_branch: "Money and finance"
why: "One sentence on why this sub-branch is here."
summary: "The rest of the explanation."
---
```

Thinker note:

```yaml
---
title: "Albert O. Hirschman"
type: heritage
heritage_type: "person"
branches:
  - branch: "The Broken Tower"
    sub_branch: "Agency and development"
  # a second entry puts the thinker under another sub-branch too
profession: "Economist"
why: "One sentence on why this thinker is here."
summary: "The rest of the explanation."
nominated_by: ["alberto"]
status: "agreed"
---
```

Rules:

- **Membership lives in one place.** A thinker's `branches` list decides where they appear. Branch and cluster notes never list their people. The first entry is the thinker's home (filled dot in the tree); further entries show as hollow dots.
- **Names must match exactly.** `branch` and `sub_branch` have to spell a real branch and cluster title. `npm test` and the build both fail if one does not, and name the note that is wrong.
- **Four branches.** The Danger Zone (rust), The Chemical Wedding (sky), The Pluriversity (sun), and The Broken Tower (leaf). The colour map is in `.site/plugins/heritage.js`.
- **`status` is a heritage value**, not an epistemic one: `agreed`, `bridge`, `shared`, `contested`, or `full_only`. If the same note is also a person page with an epistemic `status`, put the heritage value in `heritage_status` instead. The builder reads `heritage_status` first.
- **Any folder works.** The tree includes every note with `heritage_type`, not only notes in `heritage/`. This lets a `people/` note act as its own tree entry.
- **Info panel text.** When any node is clicked, the panel shows `why` and then `summary`. Write the first sentence in `why` and the rest in `summary`.
- **Deep links.** `/heritage/#<cluster-id>` opens the page with that cluster selected and scrolled into view.
- **Adding a thinker.** Copy `templates/heritage-node.md` into `heritage/` and fill it in.
- **Adding a branch or cluster.** Copy `templates/heritage-branch.md` or `templates/heritage-cluster.md`. A cluster with no thinkers is a build error.

## How we work

Folder: `method/`. The scroll-driven flowchart on the landing page (`#method`) and the list of steps both read the notes that have a `step` number.

```yaml
---
title: "Model running, sliders in hand"
type: method
step: 3
state_label: "Model running, sliders in hand"
next: [4, 5]                          # steps this one leads to
edge_label: ["the option fails on paper", "the option holds"]
tone: leaf                            # colour of the node
icon: ""
caption_title: "Short heading for the left caption"
caption_body: "Body text for the left caption."
summary: "Shown on the chart and on the note page."
---
The body is the text shown under "Open the note".
```

Notes that describe the process without being a step live in the same folder and simply omit `step`: `overview.md`, `generative-ethnography.md`, `test-before-commit.md`, and `story-before-commit.md`.

Rules:

- `next` and `edge_label` must have the same number of items. Each label sits on the line to the matching next step.
- Steps are ordered by `step`, which must be unique.
- `tone` picks the node colour (`rust`, `sky`, `leaf`, `green`, `sun`, and so on).
- Changing a step number or its links changes the chart. Check the animation after any edit.
- The summary appears on the chart; the body appears on the note page at `/method/<slug>/`.

## Models

Folder: `models/`. One note per model. Linden Cove lives here.

```yaml
---
title: "How the Linden Cove model works"
type: model
stage: sapling
status: working
calibrated: false
summary: "One sentence."
repo: ""
demo: ""
---
The body is shown in the "How this works" drawer on the landing page.
```

- The body of `models/linden-cove.md` is injected into the landing page's "How this works" drawer through the `noteBody` filter.
- Do not put Nunjucks expressions such as `{{ site.contact }}` in this body. The drawer renders Markdown only, so the expression would appear literally. Write the value out.
- The model page itself is at `/models/linden-cove/`.
- `calibrated`, `repo`, and `demo` appear in the facts box.

## Offers

Folder: `offers/`. Each note becomes one card in the "Work with us" section on the landing page.

```yaml
---
title: "Workshops"
type: offer
stage: evergreen
status: speculative
summary: "The card text, one or two sentences."
---
Optional longer body, shown on the offer's own page.
```

- The landing page shows the `summary`.
- The note's own page shows the body.
- There is no offers index page. The cards on the landing page are the entry point.

## Copy fragments

Folder: `copy/`. These are Markdown fragments injected into the landing page. They are not published as pages.

```yaml
---
title: "Process name"
type: note
stage: sapling
status: working
summary: "What this fragment is for."
tags: [copy]
---

Our process is called **generative ethnography**: complexity economic theory, speculative futures thinking and inclusive community-building, working together.
```

- `copy/opening-provocation.md` fills the "Why we exist" block.
- `copy/process-name.md` fills the line under the "How we work" flowchart.
- The landing page pulls a fragment with `{{ 'copy/<file>.md' | noteBody(page.url) }}`. To use a new fragment, add a matching line to `.site/layouts/landing.njk`.
- Fragments are plain Markdown. Nunjucks expressions are not evaluated in this path.

## Essays

Folder: `essays/`. Opinion pieces are published as ordinary notes.

```yaml
---
title: "An opinion piece"
type: essay
author: "J M Applegate"
opinion: true
stage: sapling
status: working
summary: "One sentence."
---
The piece.
```

- `opinion: true` adds an "Opinion essay" badge to the page.
- `author` is shown in the facts box.
- The internal policy note `essays/policy-on-opinion-essays.md` is excluded from the build by `.site/eleventy.config.js`. Keep it as reference, or move it to `brief/`.
- Opinion pieces should not appear on the landing page, the Method section, or the Work with us section.

## The Linden Cove Courier

The news ticker in the town figure speaks in a voice you can edit as Markdown, in `ticker/`. The three files are read as data, not as pages.

### `ticker/cast.md`

Two tables under `## Firms` and `## Residents`.

Firm columns: `Firm`, `Sector`, `Export`, `Local`, `Weather`, `Service`, `Service key`. The four weights should sum to about 1. `Service key` names a service stock (`infra`, `edu`, `just`, `transit`, `health`, or `none`).

Resident columns: `Resident`, `Role`, `Cares about`.

### `ticker/rules.md`

One row per event id: `id`, `channel`, `cooldown`, `priority`, `trigger`.

- `cooldown` is in months (ticks).
- `priority` runs from 1 to 10. At most two items queue per tick, highest first. Priority 8 and above is announced to screen readers.
- `channel` is `news`, `biz`, `voice`, or `sky`.
- `trigger` is a description for editors. The actual trigger conditions live in `.site/assets/js/ticker.js`.

### `ticker/templates.md`

One `## <rule id>` heading per event, with bullet lists of headline variants. Slots in braces, such as `{firm}` or `{pct}`, are filled from the model. Keep headlines under 100 characters. A line with an unknown slot is dropped.

Voice lines start with the speaker and a colon, for example `Old Bram: The rent is eating us alive.`

## Brief notes

Folder: `brief/`. Planning notes from the design brief. They are never published, but they are useful background for editors. `PLAN.md` at the root holds the original plan and the model equations.

## Templates

Folder: `templates/`. Starter notes for each content type. These files are not published, and the `{{title}}` and `{{date}}` placeholders are meant to be replaced by hand.

| Template | Goes to |
|---|---|
| `templates/work.md` | `work/` |
| `templates/person.md` | `people/` |
| `templates/heritage-node.md` | `heritage/` |
| `templates/heritage-branch.md` | `heritage/branches/` |
| `templates/heritage-cluster.md` | `heritage/clusters/` |
| `templates/method-step.md` | `method/` |
| `templates/model.md` | `models/` |
| `templates/note.md` | Anywhere, for a plain note |
| `templates/essay.md` | `essays/` |
| `templates/place.md` | `places/` |
| `templates/concept.md` | `concepts/` |

## Adding a new content type

1. Create a folder at the repository root, for example `places/`.
2. Add notes with a new `type`, or reuse `type: note`. Use a template.
3. If the notes need their own address scheme, leave `layout` unset so `note.njk` applies and the default permalink (`/<folder>/<slug>/`) is used.
4. If you need a list page, add `places/index.md` with `layout: places.njk` and create `.site/layouts/places.njk`.
5. If the type should be collected for a template, add it to `.site/_data/vault.js` with `of('place')`.
6. If the folder should not be published, add it to the `ignores` list in `.site/eleventy.config.js` and to the vault `SKIP` set in `.site/plugins/vault.js`.
7. Add a navigation link in `.site/layouts/base.njk` if the section needs one.
8. Document it here and in the README component table.

## Before you commit

- [ ] `npm run build` finishes with no `[warn]` lines.
- [ ] `npm test` passes.
- [ ] The page renders at the expected URL and links resolve.
- [ ] Titles are unique. Use a folder-qualified wikilink if two notes must share a title.
- [ ] Dates are quoted.
- [ ] `confirm:` lists and `needs-url` tags are intentional.
- [ ] Heritage names, `next`/`edge_label` lengths, and `step` numbers are correct.

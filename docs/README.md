# Site documentation

The Sci-Fi Economics Lab site is a folder of Markdown notes that Eleventy compiles into plain static HTML. There is no database and no server code. This folder explains how to run it, edit it, and keep it healthy.

`docs/` is not published. The build skips it.

## Guides

| Guide | Read it when you want to |
|---|---|
| [Building and running](building.md) | Install, build, preview, and understand what the build produces and skips |
| [Editing content](editing.md) | Add or change any content component |
| [Maintaining the site](maintaining.md) | Change settings, colours, fonts, logos, images, and the town model |
| [Architecture](architecture.md) | Understand how the build works under the hood |
| [Testing](testing.md) | Run the checks and do the manual QA pass |
| [Deployment](deploy.md) | Learn how changes reach the live site |
| [Preview](preview.md) | Quick links to the live site and local preview |

## Choose your path

**I write or edit content.**
Start with [Editing content](editing.md). Each content component has its own section with a front matter example and the fields that matter.

**I change the design or the layout.**
Read [Maintaining the site](maintaining.md) for palettes, fonts, and images, then [Architecture](architecture.md#layouts-and-data-flow) for the page templates.

**I work on the town model or the interactive parts.**
Read [The town model](maintaining.md#the-town-model), [JavaScript modules](maintaining.md#javascript-modules), and [Testing](testing.md).

**I set up or deploy the site.**
Read [Building and running](building.md) and [Deployment](deploy.md).

## The short version

```bash
npm install          # once
npm run serve        # live preview at http://localhost:8080
npm run build        # writes the finished site to _site/
npm test             # model and heritage checks
```

Everything a visitor sees comes from three places:

- Markdown notes in the content folders at the repository root (`work/`, `people/`, `heritage/`, `method/`, and so on).
- Settings and derived data in `.site/_data/`.
- Page templates, styles, and scripts in `.site/`.

The notes are also readable as an [Obsidian](https://obsidian.md) vault. Wikilinks and backlinks behave the same way in the editor and on the site.

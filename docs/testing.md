# Testing

The project has two automated checks and a short manual pass. They catch the failures that matter most: the town model drifting from its reference, and the heritage tree disagreeing with itself.

## `npm test`

```bash
npm test
```

This runs two scripts in sequence:

1. `node model/test_golden.js`
2. `node .site/tools/check-heritage.js`

If either fails, the command exits non-zero and the CI deploy stops.

## The model golden test

`model/reference_model.py` is the source of truth. `model/golden.json` is its recorded output. `model/test_golden.js` runs the JavaScript port in `.site/assets/js/model.js` and compares it field by field.

Scenarios in `model/test_golden.js`:

| Run | Options |
|---|---|
| `default` | Starting rent, tax, and budget shares |
| `hard_decade` | Drought, storm, cargo, and bumper events at fixed months |
| `tax25` | Tax at 25 percent |
| `rent20` | Rent at 20 |
| `transit_heavy` | A larger transit share |

Each run steps the model 120 months. For every month the test compares `t`, `N`, `E`, `u`, `w`, `B`, `Q`, `svc`, `Hs`, `sales`, `cap`, `profit`, `mood`, `own_over_work`, and each of the five service stocks. The tolerance is `1e-9`. The output looks like:

```text
golden ok: 8400 comparisons, worst relative error 2.80e-16
```

The script then exercises the budget pool: moving shares, locking a share, and checking that the total stays at 100.

### Changing the model safely

1. Edit `model/reference_model.py`.
2. Run the Python acceptance tests it prints.
3. Regenerate the golden data:

   ```bash
   python3 model/reference_model.py --golden
   ```

4. Port the same change to `.site/assets/js/model.js`.
5. Run `npm test` until it passes.
6. Update the explanation in `models/linden-cove.md`.
7. Commit both the model and the regenerated `golden.json`.

Do not edit `golden.json` by hand. If a change is meant to alter behaviour, regenerate it from Python.

## The heritage check

`.site/tools/check-heritage.js` calls the same `build()` function the site uses. It fails when:

- A cluster names a branch that does not exist.
- A thinker has no `branches`, or no `profession`.
- A `sub_branch` does not match a cluster, or its `branch` does not match that cluster's branch.
- Two thinkers share an id.
- A cluster has no thinkers.

The success line looks like:

```text
heritage ok: 4 branches, 11 sub-branches, 52 thinkers
```

The build also runs the same validation. Heritage errors stop the build; they are not warnings.

## Build warnings

`npm run build` prints warnings that do not stop the build:

- `unresolved wikilinks` lists `[[links]]` with no target, as `file: [[target]]`.
- `duplicate note titles` lists titles that folder priority cannot settle.

Treat both as failures before you publish. They are not covered by `npm test`, so run the build as well.

## Optional: check for broken internal links

The build does not include a link checker. This short script checks the generated HTML against the files on disk:

```bash
python3 - <<'PY'
import os, re
root = '_site'
bad = []
for dp, _, fs in os.walk(root):
    for fn in fs:
        if not fn.endswith('.html'):
            continue
        p = os.path.join(dp, fn)
        txt = open(p, encoding='utf-8', errors='ignore').read()
        for _, u in re.findall(r'(href|src)="([^"]+)"', txt):
            if re.match(r'^(https?:|mailto:|data:|#|javascript:)', u):
                continue
            u = u.split('?')[0].split('#')[0]
            if not u:
                continue
            t = os.path.normpath(os.path.join(dp, u))
            if u.endswith('/'):
                t = os.path.normpath(os.path.join(dp, u, 'index.html'))
            if not os.path.exists(t):
                bad.append((p, u))
print(len(bad), 'broken refs')
for b in bad[:20]:
    print(b)
PY
```

Links built at runtime by JavaScript (for example the small-screen heritage list) are not in the static HTML, so this check covers static links only.

## CI

`.github/workflows/pages.yml` runs on every push to `main` and on manual dispatch:

1. `npm ci`
2. `npm test`
3. `npm run build`
4. Upload and deploy `_site/`

There is currently no `pull_request` trigger, so pull requests get no automated checks. If you want PR checks, add:

```yaml
on:
  pull_request:
  push:
    branches: [main]
```

Keep the existing permissions and jobs.

## Manual QA before publishing

- [ ] Landing page loads and the town runs. Sliders move the charts, the ticker speaks, and events apply.
- [ ] Pause, speed, restart, and the ten-year summary work.
- [ ] "Follow the change" updates after you move a slider.
- [ ] How we work plays in step order, the progress line and caption strip advance together, Pause holds and Replay restarts. Clicking a node holds on that step. With `prefers-reduced-motion` the whole chart appears at once with no controls.
- [ ] Heritage: click a branch, a cluster, and a thinker. The info card opens bottom-left (bottom sheet on narrow screens) and closes with ×. Filters and search work. The four columns fit one screen at 1280px and up.
- [ ] Our work: every filter chip shows the right cards.
- [ ] People: groups and order look right, photos load.
- [ ] Palette switcher changes the colours and survives a reload.
- [ ] Narrow viewport: navigation, town deck, heritage fallback list, and work cards are usable.
- [ ] `/one-planet-one-humanity/` loads, keeps its image credit and registration links, and is absent from the navigation and the Our work grid.
- [ ] No console errors.

## Adding tests

- **Model:** add a scenario to `RUNS` in `model/test_golden.js`, add it to `GOLDEN_RUNS` in `reference_model.py`, regenerate the golden data, and commit both.
- **Heritage:** add a rule to `build()` in `.site/plugins/heritage.js`. The check picks it up automatically.
- **Content integrity:** a new script can be added under `.site/tools/` and chained into the `test` script in `package.json`.

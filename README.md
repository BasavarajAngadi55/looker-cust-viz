# looker-cust-viz

A custom visualization for Looker (Google Cloud core), built with the Looker
Visualization API. `cust.js` renders a donut chart with a KPI total in the
centre, using plain SVG with no external chart library.

- **Visualization id:** `custom_donut_v4`
- **Label:** Custom Donut v4
- **Requires:** 1 dimension and 1 measure
- **Dependencies:** none

## Which URL to use

The Looker **Main** field and the manifest `url` parameter both need a direct
link that is served as executable JavaScript. Only one of the repo's addresses
qualifies.

| URL | Served as | Works in Looker |
| --- | --- | --- |
| `https://github.com/BasavarajAngadi55/looker-cust-viz/blob/main/cust.js` | HTML page | No |
| `https://raw.githubusercontent.com/BasavarajAngadi55/looker-cust-viz/main/cust.js` | `text/plain` with a sandbox CSP header | No |
| `https://cdn.jsdelivr.net/gh/BasavarajAngadi55/looker-cust-viz@main/cust.js` | `application/javascript` | Yes |

GitHub sends raw files with `content-security-policy: default-src 'none'; sandbox`,
which blocks the browser from running them as a script. jsDelivr mirrors the same
file and serves it with the correct JavaScript content type.

The jsDelivr URL follows this pattern:

```
https://cdn.jsdelivr.net/gh/<user>/<repo>@<branch-or-tag-or-commit>/<file>
```

## Option A: Install for the whole instance

Adds the chart to every Explore. Requires Looker admin access.

1. Go to **Admin** > **Platform** > **Visualizations**.
2. Click **Add Visualization**.
3. **ID:** `custom_donut_v4` — must match the `id` inside `cust.js`.
4. **Label:** `Custom Donut v4`
5. **Main:** `https://cdn.jsdelivr.net/gh/BasavarajAngadi55/looker-cust-viz@main/cust.js`
6. Leave **Dependencies** and **SRI hash** empty. This chart has no dependencies.
7. Click **Save** and reload any open Explore.

## Option B: Install for one LookML project, via URL

Adds the chart only to Explores in that project.

1. Open the project and turn on **Development Mode**.
2. Add this to `manifest.lkml` at the project root:

```lookml
visualization: {
  id: "custom_donut_v4"
  label: "Custom Donut v4"
  url: "https://cdn.jsdelivr.net/gh/BasavarajAngadi55/looker-cust-viz@main/cust.js"
}
```

3. Validate the LookML, commit, and **deploy to production**.

## Option C: Install the file into the LookML project

The most reliable option, because Looker serves the script itself and no external
request is made. Use this if A or B renders a blank chart.

The **+** button in the Looker IDE only creates `.lkml` files, so a `.js` file
cannot be created from that menu. It has to be dragged in.

1. On GitHub, open `cust.js` and click **Download raw file**.
2. In the Looker IDE, in Development Mode, drag `cust.js` from your computer onto
   the file browser panel. Optionally drop it into a `visualizations` folder.
3. Click the uploaded file so it opens, then click **Save**.
4. Point the manifest at the file. Use `file` **or** `url`, never both:

```lookml
visualization: {
  id: "custom_donut_v4"
  label: "Custom Donut v4"
  file: "cust.js"
}
```

If you placed it in a folder, use the path from the project root, for example
`visualizations/cust.js`.

5. Validate, commit, and **deploy to production**.

## Using the chart

1. Open an Explore and run a query with at least one dimension and one measure.
2. Open the visualization type menu and select **Custom Donut v4**.
3. Hover a slice to swap the centre text to that slice's name and value.
4. Click **Edit** to change the chart options:

| Section | Option | Purpose |
| --- | --- | --- |
| Style | Title | Heading shown above the chart |
| Style | Header Font Size | Size of the heading, in px |
| Style | Ring Thickness | Width of the donut ring, in px |
| Legend | Show Legend | Toggles the legend on or off |
| Legend | Legend Position | Right, Left, Top, or Bottom |
| Formatting | Decimals | Decimal places in the compact numbers |
| Formatting | Prefix | Currency symbol placed before values |

The legend lists each slice with its name, its share as a percentage, and its
formatted value. The centre shows the running total without the prefix.
4. Save it as a Look or add it to a dashboard like any built-in chart.

## Troubleshooting

**The chart area is blank.** Confirm the correct chart is selected in the
visualization menu — a different custom chart may still be active. Then reload
the Explore, since an already-rendered result will not pick up a new manifest.

**The chart is missing from the visualization menu.** The manifest change was not
deployed to production, or the Explore belongs to a different project.

**Console shows a CSP or MIME type error.** The URL is being refused. Switch to
Option C so Looker serves the file.

**Edits to `cust.js` do not show up.** jsDelivr caches a branch for up to 7 days.
Pin a commit instead of the branch, replacing `@main` with `@<commit-sha>`, and
update the URL after each push.

**"Missing Fields" error in the chart.** The query needs at least one dimension
and one measure.

## How the code works

The script registers itself by calling `looker.plugins.visualizations.add` with a
visualization object:

- `options` declares the settings shown in the chart's Edit panel.
- `create(element, config)` runs once and builds the DOM container.
- `updateAsync(data, element, config, queryResponse, details, done)` runs on every
  data or option change, draws the SVG arcs, and must call `done()` so dashboards
  and PDF exports know rendering has finished.

The `id` in this file and the `id` registered in Looker must be the same string.

## References

- [Admin settings - Visualizations](https://cloud.google.com/looker/docs/admin-panel-platform-visualizations)
- [manifest `visualization` parameter](https://cloud.google.com/looker/docs/reference/param-manifest-visualization)
- [Visualization API getting started](https://github.com/looker-open-source/custom_visualizations_v2/blob/master/docs/getting_started.md)
- [Visualization API reference](https://github.com/looker-open-source/custom_visualizations_v2/blob/master/docs/api_reference.md)

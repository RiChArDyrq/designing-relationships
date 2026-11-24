# Architecture

```
web/
  src/
    index.template.html   page markup with /*@@CSS@@*/ and /*@@SCRIPT:…@@*/ markers
    styles.css
    manifest.json         order of files in each <script> block
    app/                  UI + state (uses the global `S`, `$()`, DOM)
      00-i18n.js            Chinese/English copy, ui(), language switch
      01-state.js           TYPES, global state S, small helpers
      02-history.js         undo / redo
      04-recognition.js     magic wand, wall snapping
      05-graph-metrics.js   permeability graph + space-syntax metrics
      06-render.js          tab ① drawing
      07-interaction.js     mouse / keyboard
      08-ai-import.js       "import AI annotation" JSON
      10-plan-labels.js     label values transcribed from drawings
      11-label-scan.js      scan text labels on the image
      20-graph-editor.js    tab ② relationship editor
      21-run-generator.js   calls GEN.prepare / search / select
      22-candidates.js      draws generated options + report
      22c-design-brief.js    previews, applies and restores design briefs on the editable graph
      22b-use-check-ui.js   use-check settings, drawing, report lines, tab ① panel
      23-tabs.js, 24-load-save.js, 25-example.js, 26-init.js
      90-eichler-button.js  (second <script> block)
    engine/               pure functions, tested without a browser
      geometry.js           area, centroid, inPoly, dSeg/dPoly, labelPt, dist, rdp, simplifyClosed
      generator.js          GEN = {prepare, search, select, failure}
      design-brief.js       BRIEF parses two bilingual intents and compares sites and generated layouts
      use-check.js          USE = {check, attach, selectWithUse, …}: beds, door swings, wardrobes, routes, area guard
    data/eichler.js
  build.py                src → dist/index.html
  dist/index.html         the app (open it, or deploy it with GitHub Pages)
  tests/                  run_tests.py, cases.js, fixtures/, golden/, smoke test
```

## Data flow
annotate (tab ①) → `S.rooms`, `S.doors` → permeability graph → edit graph (tab ②) →
`GEN.prepare(input)` → `GEN.search(P, trial, iters, seed)` × N → `USE.selectWithUse(GEN, pool, n, P, scale)` → options with
`satisfied / total / missing / areaErr / bedrooms / use` → report and "adopt".

## Engine input (what `GEN.prepare` expects)
```js
{ rooms: [{id, name, type, pts:[[x,y]…], locked, original:[x,y], seed:[x,y], target: areaPx}],
  edges: [{a, b, kind:'door'|'opening', hard:boolean}],   // b may be 'EXT'
  scale: metresPerPixel, doorPx }
```

## Why a build step at all
The app still ships as one HTML file (easy to open, easy to host), but people and AI agents edit small
files with clear responsibilities, and every change is checked by tests instead of by eye.

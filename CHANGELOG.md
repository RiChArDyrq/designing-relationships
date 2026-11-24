# Changelog

## 0.5.8 (design briefs)
- Add Chinese and English design briefs for quiet bedrooms and a study near its owner's bedroom. Preview reference locations, review the evidence and apply a preference to the editable graph.
- Layout search now considers activity-room separation and owner proximity when briefs are active. Result reviews use the generated polygons and actual door connections. Reuse an existing study or create one with a proposed, editable direct door.
- Save applied briefs and their graph edits in project files. A stepped, unlocked source partition can also be split along a traced vertex when both pieces pass the geometry checks and preserve the footprint.
- The original QuickJS suite can also run unchanged assertions on Node/V8 when the Python extension is unavailable.

## 0.5.7 (bedroom use check)
- New `engine/use-check.js` (pure, tested): per bedroom, place a bed, keep it out of door-leaf swings,
  find a 0.6 m-wide walking route from each door to the bedside, and place a wardrobe.
  Main bedroom: 1.8 m bed (fallback 1.5), both sides, wardrobe 0.6 × 1.2 m + 0.8 m front.
  Other bedrooms: 1.2 m bed (fallback 0.9), one side. Area guard: 0.7–1.5 × target area.
- Generator untouched. Options are ranked after generation: GEN.select picks a diverse 3 × n set,
  every layout is checked, passing layouts go first (`USE.selectWithUse`).
- UI: settings in tab ② (main bed width, both sides, wardrobe, prefer passing); beds, swings, wardrobes
  and routes drawn on options; one report line per bedroom; likely reason for each missing relationship;
  ✓/✗ on thumbnails. Tab ① gets a "Bedroom use check" panel for the annotated plan itself.
- Tests: 9 use-check tests (incl. Samara bedrooms at measured size), golden snapshot `lanai-use`,
  end-to-end smoke test of tab ① and tab ②.
- Lanai (assumed scale): of 8 distinct layouts, 1 passes every bedroom check; most failures are a
  main bed reachable from one side only, or bedrooms 1.8–2× their target area.

## 0.5.6-split (repository restructure, no behaviour change)
- Split the single-file app into `web/src/` (20 ordered source files) + `build.py`, which rebuilds the same single-file HTML.
- `engine/geometry.js` made self-contained: `dist`, `rdp`, `simplifyClosed` moved in from app files (function bodies unchanged).
- Added tests: geometry, Lanai generator checks (hard edges kept, rooms preserved), golden snapshot, and a page smoke test that simulates uploading an image.
- Added `AGENTS.md` rules, CI and GitHub Pages workflows.

## 0.5.6 (Codex)
- Main bedroom bed + 0.6 m bedside route check; main rooms preferred as whole blocks.

# Plan2Graph

Read the spatial relationships out of a floor plan, edit them as a graph, generate new plans that keep
those relationships, then check whether the result is still livable (bed fits, bedside reachable from the door).

> A plan fixes one set of relationships in one geometry. Plan2Graph runs this backwards: read the
> relationships, make them editable, generate several geometries from them, and check that each one keeps them.

[Try Plan2Graph in your browser](https://richardyrq.github.io/designing-relationships/) or open `web/dist/plan2graph.html` in Chrome or Edge to use it offline.

## Design briefs (v0.5.8)
Open an annotated project and switch to **Edit graph & generate**. Enter one brief at a time, analyse it, then apply it before generating layouts. Examples include “Bedroom 2 should be quiet for my elderly parent” and “Add a working space for the owner”. Both preferences can be active at once. The panel asks which bedroom belongs to the owner when the plan is ambiguous.

The quietness estimate compares room-centre distance, shared activity-space walls and mapped routes. A corridor-end label requires a mapped opening at the end of a long rectangular corridor. Study siting also considers the owner's bedroom and access from common rooms. Select the proposed door before applying a new study. Read the result review on each option. These are offline rules for the two supported requests. Door annotations and a calibrated scale make route and furniture checks more informative.

## Develop
```bash
pip install quickjs
python web/build.py              # src → dist
python web/tests/run_tests.py    # engine tests, golden snapshot, page smoke test
```
Edit files in `web/src/` only. See `docs/ARCHITECTURE.md` for the module map and `AGENTS.md` for the rules
AI coding agents must follow.

## Status
v0.5.8: spatial design briefs, annotation, relationship graph + space-syntax metrics, graph editing, plan generation with
required relationships, and a bedroom use check (bed, door swing, wardrobe, 0.6 m route from the door,
area guard) on both the annotated plan and every generated option.
Test cases: Lanai (reconstructed, assumed scale); Samara bedrooms at measured size.
Next: Samara full plan at true scale (4 ft = 52 px), use the check inside the generator so rooms are
shaped for furniture from the start, plan recognition with an evaluated model.

## License
MIT (code). Case drawings belong to their owners; only self-traced coordinates are included.

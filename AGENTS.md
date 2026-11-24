# Rules for AI coding agents (Codex, ChatGPT, Claude…)

Read this before changing anything.

## Where the code lives
- Edit **`web/src/`** only. `web/dist/index.html` is generated; never edit it by hand and never create a new version by string-replacing the built HTML.
- `web/src/engine/` = pure logic (geometry, plan generator). **No DOM, no `$()`, no `S`, no `document`.** It must stay runnable in the tests without a browser.
- `web/src/app/` = UI and app state. It may call the engine; the engine never calls the app.
- `web/src/data/` = case data (e.g. the Eichler preset).
- New file? Add it to `web/src/manifest.json` in the right position. Files in one block share one global scope, in manifest order.

## Every change
```bash
python web/build.py
python web/tests/run_tests.py        # needs: pip install quickjs
```
Both must pass before you hand work back. If the generator's results change **on purpose**, run
`python web/tests/run_tests.py --update-golden` and state in the commit message what changed and why.

## Adding features
- Put new checks (furniture, door swing, wardrobe…) in a new engine file, e.g. `engine/use-check.js`, with tests in `web/tests/cases.js` before wiring the UI.
- Put user-facing text through the existing translation helpers (`ui()` / `englishCopy` in `app/00-i18n.js`).
- Bump `VERSION` and add a line to `CHANGELOG.md`.
- Keep each change small: one feature per commit.

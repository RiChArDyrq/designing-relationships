#!/usr/bin/env python3
"""Assemble web/src/* into the single-file app web/dist/index.html.

    python web/build.py           # build
    python web/build.py --check   # fail if dist/ is out of date (used by CI)

No dependencies. The order of files inside each <script> block comes from
src/manifest.json. Never edit dist/ by hand.
"""
import json, pathlib, sys

HERE = pathlib.Path(__file__).resolve().parent
SRC = HERE / "src"


def build() -> str:
    manifest = json.loads((SRC / "manifest.json").read_text(encoding="utf-8"))
    html = (SRC / "index.template.html").read_text(encoding="utf-8")

    def put(marker: str, text: str) -> None:
        nonlocal html
        if html.count(marker) != 1:
            sys.exit(f"build: marker {marker} must appear exactly once in index.template.html")
        html = html.replace(marker, text)

    put("/*@@CSS@@*/", (SRC / manifest["css"]).read_text(encoding="utf-8"))
    for block, files in manifest["scripts"].items():
        missing = [f for f in files if not (SRC / f).is_file()]
        if missing:
            sys.exit(f"build: files listed in manifest.json not found: {missing}")
        put(f"/*@@SCRIPT:{block}@@*/", "".join((SRC / f).read_text(encoding="utf-8") for f in files))

    listed = {f for files in manifest["scripts"].values() for f in files}
    stray = sorted(str(p.relative_to(SRC)).replace("\\", "/") for p in SRC.rglob("*.js")
                   if str(p.relative_to(SRC)).replace("\\", "/") not in listed)
    if stray:
        print(f"build: warning, .js files not in manifest.json (not bundled): {stray}")
    return html


def main() -> None:
    manifest = json.loads((SRC / "manifest.json").read_text(encoding="utf-8"))
    out = HERE / manifest["output"]
    html = build()
    if "--check" in sys.argv:
        current = out.read_text(encoding="utf-8") if out.exists() else ""
        if current != html:
            sys.exit("build --check: dist/ is out of date. Run `python web/build.py` and commit the result.")
        print("build --check: dist/ is up to date")
        return
    out.parent.mkdir(parents=True, exist_ok=True)
    with out.open("w", encoding="utf-8", newline="") as stream:
        stream.write(html)
    print(f"built {out.relative_to(HERE.parent)} ({len(html):,} chars)")


if __name__ == "__main__":
    main()

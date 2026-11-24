#!/usr/bin/env python3
"""Run the test suite.

    pip install quickjs
    python web/tests/run_tests.py                  # engine tests + golden snapshot + page smoke test
    python web/tests/run_tests.py --update-golden  # accept an intended change in generator output

Engine tests load src/engine/*.js directly (no browser). The smoke test loads the built
dist/index.html in a fake DOM and simulates "upload an image".
"""
import json, pathlib, re, sys, time
try:
    import quickjs
except ImportError:
    # Execute the same assertions and golden snapshots when QuickJS is unavailable.
    import node_context as quickjs

T = pathlib.Path(__file__).resolve().parent
WEB = T.parent
SRC = WEB / "src"
GOLDEN = T / "golden"
read = lambda p: p.read_text(encoding="utf-8")
HARNESS = r"""
var __results=[];
function test(name,fn){const t0=Date.now();try{fn();__results.push({name,ok:true})}
  catch(e){__results.push({name,ok:false,err:String(e&&e.message||e)})}}
function assert(c,m){if(!c)throw new Error(m||'assertion failed')}
"""

def run_engine_tests():
    ctx = quickjs.Context()
    ctx.eval(read(T / "polyfills.js"))
    ctx.eval(read(SRC / "engine/geometry.js") + read(SRC / "engine/generator.js") + read(SRC / "engine/use-check.js"))
    fixtures = {p.stem: json.loads(read(p)) for p in (T / "fixtures").glob("*.json")}
    ctx.eval("var FIXTURES=" + json.dumps(fixtures) + ";")
    ctx.eval(HARNESS)
    ctx.eval(read(T / "cases.js"))
    ctx.eval(read(T / "use_cases.js"))
    ctx.eval(read(SRC / "engine/design-brief.js"))
    ctx.eval(read(T / "brief_cases.js"))
    return json.loads(ctx.eval("JSON.stringify(__results)")), ctx

def run_golden(ctx, update, fn="lanaiSummary", stem="lanai"):
    got = json.loads(ctx.eval(f"JSON.stringify({fn}())"))
    # Baselines come from v0.5.7 on each engine. Its stochastic solver observes
    # small differences in the native math implementations of QuickJS and V8.
    suffix = "-v8" if quickjs.__name__ == "node_context" else ""
    path = GOLDEN / f"{stem}{suffix}.json"
    if update or not path.exists():
        GOLDEN.mkdir(exist_ok=True)
        path.write_text(json.dumps(got, indent=1, ensure_ascii=False) + "\n", encoding="utf-8")
        return {"name": f"golden: {stem} (snapshot written)", "ok": True}
    if got == json.loads(read(path)):
        return {"name": f"golden: {stem} output unchanged", "ok": True}
    return {"name": f"golden: {stem} output unchanged", "ok": False,
            "err": "output changed. If intended, run with --update-golden and explain why in the commit."}

def run_smoke():
    name = "smoke: page loads and accepts an uploaded image"
    dist = WEB / "dist/index.html"
    if not dist.exists():
        return {"name": name, "ok": False, "err": "dist/index.html missing - run build.py"}
    ctx = quickjs.Context()
    ctx.eval(read(T / "polyfills.js"))
    ctx.eval(read(T / "dom_stub.js"))
    for i, script in enumerate(re.findall(r"<script[^>]*>(.*?)</script>", read(dist), re.S)):
        try:
            ctx.eval(script)
        except Exception as e:
            return {"name": name, "ok": False, "err": f"script block {i} failed to load: {e}"}
    out = json.loads(ctx.eval(read(T / "smoke.js")))
    ok = out["img"] and out["w"] == 640 and not out["errs"]
    results = [{"name": name, "ok": ok, "err": None if ok else json.dumps(out)}]
    fixtures = {p.stem: json.loads(read(p)) for p in (T / "fixtures").glob("*.json")}
    ctx.eval("var FIXTURES=" + json.dumps(fixtures) + ";")
    out = json.loads(ctx.eval(read(T / "smoke_use.js")))
    ok = out["tab1"]["pass"] and out["tab1"]["bed"] and out["tab2"]["options"] >= 1 and out["tab2"]["report"] and not out["errs"]
    results.append({"name": "smoke: use check in tab 1 and on generated options in tab 2", "ok": ok, "err": None if ok else json.dumps(out, ensure_ascii=False)})
    brief = json.loads(ctx.eval(read(T / "smoke_brief.js")))
    results.append({"name": "smoke: analyse, apply, generate and restore briefs", **brief})
    return results

def main():
    t0 = time.time()
    results, ctx = run_engine_tests()
    results.append(run_golden(ctx, "--update-golden" in sys.argv))
    results.append(run_golden(ctx, "--update-golden" in sys.argv, "lanaiUseSummary", "lanai-use"))
    smoke = run_smoke()
    results.extend(smoke if isinstance(smoke, list) else [smoke])
    for r in results:
        print(("PASS " if r["ok"] else "FAIL ") + r["name"] + ("" if r["ok"] else f"\n     {r.get('err')}"))
    failed = [r for r in results if not r["ok"]]
    print(f"\n{len(results) - len(failed)}/{len(results)} passed in {time.time() - t0:.1f}s")
    sys.exit(1 if failed else 0)

if __name__ == "__main__":
    main()

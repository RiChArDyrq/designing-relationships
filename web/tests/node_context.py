"""Small Node/V8 fallback for the eval-only interface used by this test suite."""
import atexit
import json
import shutil
import subprocess

WORKER = """
const vm = require('vm'), lines = require('readline').createInterface({input:process.stdin});
const context = vm.createContext({});
lines.on('line', line => {
  try {
    const value = vm.runInContext(JSON.parse(line), context);
    const scalar = ['string','number','boolean'].includes(typeof value);
    process.stdout.write(JSON.stringify({result:scalar ? value : null})+'\\n');
  } catch (error) {
    process.stdout.write(JSON.stringify({error:String(error.stack || error)})+'\\n');
  }
});
"""

class Context:
    def __init__(self):
        node = shutil.which("node")
        if not node:
            raise RuntimeError("Install quickjs for Python or add Node.js to PATH.")
        self.process = subprocess.Popen(
            [node, "-e", WORKER], stdin=subprocess.PIPE, stdout=subprocess.PIPE,
            text=True, encoding="utf-8")
        atexit.register(self.process.terminate)

    def eval(self, script):
        self.process.stdin.write(json.dumps(script) + "\n")
        self.process.stdin.flush()
        response = json.loads(self.process.stdout.readline())
        if "error" in response:
            raise RuntimeError(response["error"])
        return response["result"]


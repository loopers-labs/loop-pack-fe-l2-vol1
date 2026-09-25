import { readdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { spawn } from "node:child_process";

const kitRoot = dirname(fileURLToPath(import.meta.url));
const entries = await readdir(kitRoot, { recursive: true, withFileTypes: true });
const tests = entries
  .filter((entry) => entry.isFile() && entry.name.endsWith(".test.mjs"))
  .map((entry) => resolve(entry.parentPath, entry.name))
  .sort();

if (tests.length === 0) {
  console.error("No mentor-kit tests found.");
  process.exit(1);
}

const child = spawn(process.execPath, ["--test", ...tests], {
  cwd: resolve(kitRoot, "../.."),
  stdio: "inherit",
  env: process.env,
});

child.on("exit", (code, signal) => {
  if (signal) {
    console.error(`mentor-kit tests terminated by ${signal}`);
    process.exit(1);
  }
  process.exit(code ?? 1);
});

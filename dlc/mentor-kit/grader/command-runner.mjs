import { spawn } from "node:child_process";

const ALLOWED_COMMANDS = new Set(["boundaries", "plan", "verify", "runtime"]);
const DEFAULT_TIMEOUT_MS = 10 * 60 * 1_000;
const MAX_OUTPUT_BYTES = 1024 * 1024;

const appendBounded = (current, chunk) => {
  const combined = Buffer.concat([current, chunk]);
  return combined.length <= MAX_OUTPUT_BYTES
    ? { value: combined, overflow: false }
    : { value: combined.subarray(0, MAX_OUTPUT_BYTES), overflow: true };
};

export async function runManifestCommand({ root, name, command, env = process.env, timeoutMs = DEFAULT_TIMEOUT_MS }) {
  const startedAt = Date.now();
  const child = spawn("/bin/sh", ["-lc", command], {
    cwd: root,
    env,
    detached: true,
    stdio: ["ignore", "pipe", "pipe"],
  });
  let stdout = Buffer.alloc(0);
  let stderr = Buffer.alloc(0);
  let outputLimitExceeded = false;
  let timedOut = false;
  let forceKill = null;
  const terminate = () => {
    try {
      process.kill(-child.pid, "SIGTERM");
    } catch {
      child.kill("SIGTERM");
    }
    forceKill = setTimeout(() => {
      try {
        process.kill(-child.pid, "SIGKILL");
      } catch {
        child.kill("SIGKILL");
      }
    }, 1_000);
    forceKill.unref();
  };

  const collect = (field, chunk) => {
    const next = appendBounded(field === "stdout" ? stdout : stderr, chunk);
    if (field === "stdout") stdout = next.value;
    else stderr = next.value;
    if (next.overflow && !outputLimitExceeded) {
      outputLimitExceeded = true;
      terminate();
    }
  };
  child.stdout.on("data", (chunk) => collect("stdout", chunk));
  child.stderr.on("data", (chunk) => collect("stderr", chunk));

  const timeout = setTimeout(() => {
    timedOut = true;
    terminate();
  }, timeoutMs);
  const { exitCode, signal } = await new Promise((resolve, reject) => {
    child.once("error", reject);
    child.once("exit", (code, childSignal) => resolve({ exitCode: code, signal: childSignal }));
  }).finally(() => {
    clearTimeout(timeout);
    if (forceKill) clearTimeout(forceKill);
  });

  return {
    name,
    command,
    ok: exitCode === 0 && !signal && !timedOut && !outputLimitExceeded,
    exitCode,
    signal,
    timedOut,
    outputLimitExceeded,
    durationMs: Date.now() - startedAt,
    stdout: stdout.toString("utf8"),
    stderr: stderr.toString("utf8"),
  };
}

export async function runManifestCommands({ root, manifest, names, env, timeoutMs }) {
  const selected = names?.length ? names : [...ALLOWED_COMMANDS];
  const unknown = selected.filter((name) => !ALLOWED_COMMANDS.has(name));
  if (unknown.length > 0) {
    return { ok: false, error: `unknown manifest command: ${unknown.join(",")}`, results: [] };
  }

  const results = [];
  for (const name of [...new Set(selected)]) {
    const command = manifest.commands?.[name];
    if (typeof command !== "string" || command.length === 0) {
      results.push({ name, command: null, ok: false, error: "manifest command is missing" });
      continue;
    }
    results.push(await runManifestCommand({ root, name, command, env, timeoutMs }));
  }
  return { ok: results.every(({ ok }) => ok), results };
}

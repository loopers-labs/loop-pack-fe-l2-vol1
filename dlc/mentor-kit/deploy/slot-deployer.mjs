import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { dirname } from "node:path";

const DIGEST_PATTERN = /^.+@sha256:[a-f0-9]{64}$/;

const readState = async (stateFile) => {
  try {
    return JSON.parse(await readFile(stateFile, "utf8"));
  } catch (error) {
    if (error?.code === "ENOENT") return { schemaVersion: 1, apps: {} };
    throw error;
  }
};

const writeState = async (stateFile, state) => {
  await mkdir(dirname(stateFile), { recursive: true });
  const temporary = `${stateFile}.tmp-${process.pid}`;
  await writeFile(temporary, `${JSON.stringify(state, null, 2)}\n`);
  await rename(temporary, stateFile);
};

const waitForReadiness = async ({
  readinessUrl,
  fetchImpl,
  attempts,
  intervalMs,
  sleep,
}) => {
  const failures = [];
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      const response = await fetchImpl(readinessUrl, {
        headers: { "user-agent": "loopers-dlc-slot-deployer/1" },
      });
      if (response.ok) return { attempt };
      failures.push(`attempt ${attempt}: HTTP ${response.status}`);
    } catch (error) {
      failures.push(`attempt ${attempt}: ${error.message}`);
    }
    if (attempt < attempts) await sleep(intervalMs);
  }
  throw new Error(`readiness failed (${failures.join("; ")})`);
};

export const deploySlot = async ({
  app,
  digest,
  slot,
  readinessUrl,
  stateFile,
  startSlot,
  stopSlot,
  switchTraffic,
  fetchImpl = fetch,
  attempts = 10,
  intervalMs = 1_000,
  sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms)),
  now = () => new Date().toISOString(),
  persistState = writeState,
}) => {
  if (!app || !slot || !readinessUrl || !stateFile) {
    throw new Error("app, slot, readinessUrl and stateFile are required");
  }
  if (!DIGEST_PATTERN.test(digest)) {
    throw new Error("digest must be an immutable repo@sha256 reference");
  }

  const before = await readState(stateFile);
  const previous = before.apps[app]?.current ?? null;
  let trafficSwitched = false;
  await startSlot({ app, digest, slot });

  try {
    const readiness = await waitForReadiness({
      readinessUrl,
      fetchImpl,
      attempts,
      intervalMs,
      sleep,
    });
    await switchTraffic({ app, slot });
    trafficSwitched = true;

    const current = { digest, slot, readinessUrl, deployedAt: now() };
    const after = {
      ...before,
      apps: {
        ...before.apps,
        [app]: { current, previous },
      },
    };
    await persistState(stateFile, after);
    return { ok: true, app, current, previous, readiness };
  } catch (error) {
    let recoveryError = null;
    if (trafficSwitched && previous) {
      try {
        await switchTraffic({ app, slot: previous.slot });
        await stopSlot({ app, slot });
      } catch (recovery) {
        recoveryError = recovery.message;
      }
    } else if (!trafficSwitched) {
      await stopSlot({ app, slot }).catch(() => undefined);
    }
    return {
      ok: false,
      app,
      attempted: { digest, slot, readinessUrl },
      preserved: previous,
      error: error.message,
      recoveryError,
    };
  }
};

export const rollbackSlot = async ({ app, stateFile, switchTraffic, stopSlot }) => {
  const state = await readState(stateFile);
  const appState = state.apps[app];
  if (!appState?.previous) throw new Error(`no previous deployment for ${app}`);

  await switchTraffic({ app, slot: appState.previous.slot });
  await stopSlot({ app, slot: appState.current.slot });
  state.apps[app] = {
    current: appState.previous,
    previous: appState.current,
  };
  await writeState(stateFile, state);
  return state.apps[app];
};

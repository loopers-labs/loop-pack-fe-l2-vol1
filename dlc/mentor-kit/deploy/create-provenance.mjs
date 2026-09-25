import { execFile } from "node:child_process";
import { mkdir, rename, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import { promisify } from "node:util";
import { pathToFileURL } from "node:url";

const execFileAsync = promisify(execFile);
const SHA_PATTERN = /^[0-9a-f]{40}$/;
const DIGEST_PATTERN = /^.+@sha256:[0-9a-f]{64}$/;

export const provenanceFromInspect = ({ app, revision, buildRunId, inspect, now }) => {
  if (!app || !SHA_PATTERN.test(revision) || !buildRunId) {
    throw new Error("app, a 40-character revision, and buildRunId are required");
  }
  const labels = inspect?.Config?.Labels ?? {};
  if (labels["org.opencontainers.image.revision"] !== revision) {
    throw new Error("image revision label does not match the requested commit");
  }
  const digest = (inspect?.RepoDigests ?? []).find((value) => DIGEST_PATTERN.test(value));
  if (!digest) throw new Error("image has no immutable repository digest; push it first");

  return {
    schemaVersion: 1,
    app,
    revision,
    buildRunId,
    digest,
    source: labels["org.opencontainers.image.source"] ?? null,
    createdAt: now(),
  };
};

const argument = (name) => {
  const index = process.argv.indexOf(name);
  return index === -1 ? undefined : process.argv[index + 1];
};

const main = async () => {
  const app = argument("--app");
  const image = argument("--image");
  const revision = argument("--revision");
  const buildRunId = argument("--build-run-id");
  const output = argument("--output");
  if (!image || !output) throw new Error("--image and --output are required");

  const { stdout } = await execFileAsync("docker", ["image", "inspect", image]);
  const [inspect] = JSON.parse(stdout);
  const provenance = provenanceFromInspect({
    app,
    revision,
    buildRunId,
    inspect,
    now: () => new Date().toISOString(),
  });
  await mkdir(dirname(output), { recursive: true });
  const temporary = `${output}.tmp-${process.pid}`;
  await writeFile(temporary, `${JSON.stringify(provenance, null, 2)}\n`);
  await rename(temporary, output);
  console.log(JSON.stringify(provenance));
};

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    console.error(error.message);
    process.exit(1);
  });
}

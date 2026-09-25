import assert from "node:assert/strict";
import test from "node:test";
import { provenanceFromInspect } from "./create-provenance.mjs";

const revision = "a".repeat(40);
const digest = `registry.local/web@sha256:${"b".repeat(64)}`;

test("connects a pushed digest to its revision label", () => {
  const result = provenanceFromInspect({
    app: "web",
    revision,
    buildRunId: "local-1",
    inspect: {
      RepoDigests: [digest],
      Config: {
        Labels: {
          "org.opencontainers.image.revision": revision,
          "org.opencontainers.image.source": "https://example.test/repo",
        },
      },
    },
    now: () => "2026-09-25T00:00:00.000Z",
  });
  assert.equal(result.digest, digest);
  assert.equal(result.revision, revision);
});

test("fails before registry push or when the revision label differs", () => {
  assert.throws(
    () =>
      provenanceFromInspect({
        app: "web",
        revision,
        buildRunId: "local-1",
        inspect: { RepoDigests: [], Config: { Labels: { "org.opencontainers.image.revision": revision } } },
        now: () => "2026-09-25T00:00:00.000Z",
      }),
    /no immutable repository digest/,
  );
  assert.throws(
    () =>
      provenanceFromInspect({
        app: "web",
        revision,
        buildRunId: "local-1",
        inspect: {
          RepoDigests: [digest],
          Config: { Labels: { "org.opencontainers.image.revision": "c".repeat(40) } },
        },
        now: () => "2026-09-25T00:00:00.000Z",
      }),
    /revision label/,
  );
});

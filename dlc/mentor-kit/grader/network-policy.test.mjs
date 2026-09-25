import assert from "node:assert/strict";
import test from "node:test";
import { validateComposeNetworkPolicy } from "./network-policy.mjs";

const safe = {
  services: {
    web: { networks: ["web-data", "web-analytics"] },
    admin: { networks: ["admin-data", "admin-analytics"] },
    "commerce-api": { networks: ["web-data", "admin-data"] },
    "analytics-sink": { networks: ["web-analytics", "admin-analytics"] },
  },
  networks: {
    "web-data": { internal: true },
    "web-analytics": { internal: true },
    "admin-data": { internal: true },
    "admin-analytics": { internal: true },
  },
};

test("separate internal app networks allow only mentor shared services", () => {
  assert.deepEqual(validateComposeNetworkPolicy(safe), { ok: true, errors: [] });
});

test("shared, egress-capable, and host-gateway app networks fail", () => {
  const unsafe = structuredClone(safe);
  unsafe.services.web.networks.push("shared-apps");
  unsafe.services.admin.networks.push("shared-apps");
  unsafe.services.web.extra_hosts = ["host.docker.internal:host-gateway"];
  unsafe.networks["shared-apps"] = { internal: false };
  const result = validateComposeNetworkPolicy(unsafe);
  assert.equal(result.ok, false);
  assert.ok(result.errors.some(({ code }) => code === "app-network-overlap"));
  assert.ok(result.errors.some(({ code }) => code === "non-internal-app-network"));
  assert.ok(result.errors.some(({ code }) => code === "host-gateway"));
});

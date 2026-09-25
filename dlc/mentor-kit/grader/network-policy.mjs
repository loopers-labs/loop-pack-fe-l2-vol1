import fs from "node:fs";
import { issue, validationResult } from "./result.mjs";

const networkNames = (service) => {
  if (Array.isArray(service?.networks)) return service.networks;
  if (service?.networks && typeof service.networks === "object") {
    return Object.keys(service.networks);
  }
  return ["default"];
};

export function validateComposeNetworkPolicy(
  compose,
  { webService = "web", adminService = "admin", sharedServices = ["commerce-api", "analytics-sink"] } = {},
) {
  const errors = [];
  const services = compose?.services ?? {};
  const networks = compose?.networks ?? {};
  const web = services[webService];
  const admin = services[adminService];
  if (!web) errors.push(issue("missing-service", `$.services.${webService}`, "web compose service가 없습니다."));
  if (!admin) errors.push(issue("missing-service", `$.services.${adminService}`, "admin compose service가 없습니다."));
  if (!web || !admin) return validationResult(errors);

  const webNetworks = new Set(networkNames(web));
  const adminNetworks = new Set(networkNames(admin));
  const overlap = [...webNetworks].filter((name) => adminNetworks.has(name));
  if (overlap.length > 0) {
    errors.push(issue("app-network-overlap", "$.services", `web/admin이 같은 network를 공유합니다: ${overlap.join(", ")}`));
  }

  for (const [name, service] of [[webService, web], [adminService, admin]]) {
    if (service.network_mode === "host") {
      errors.push(issue("host-network", `$.services.${name}.network_mode`, "app은 host network를 사용할 수 없습니다."));
    }
    const extraHosts = Array.isArray(service.extra_hosts) ? service.extra_hosts : [];
    if (extraHosts.some((entry) => String(entry).includes("host-gateway"))) {
      errors.push(issue("host-gateway", `$.services.${name}.extra_hosts`, "app에서 host gateway 우회를 허용할 수 없습니다."));
    }
    for (const network of networkNames(service)) {
      if (networks[network]?.internal !== true) {
        errors.push(issue("non-internal-app-network", `$.networks.${network}`, `${name} app network는 internal:true여야 합니다.`));
      }
    }
  }

  for (const sharedName of sharedServices) {
    const shared = services[sharedName];
    if (!shared) {
      errors.push(issue("missing-shared-service", `$.services.${sharedName}`, "mentor shared service가 없습니다."));
      continue;
    }
    const sharedNetworks = new Set(networkNames(shared));
    if (![...webNetworks].some((name) => sharedNetworks.has(name))) {
      errors.push(issue("unreachable-shared-service", `$.services.${sharedName}`, `${webService}에서 접근할 internal network가 없습니다.`));
    }
    if (![...adminNetworks].some((name) => sharedNetworks.has(name))) {
      errors.push(issue("unreachable-shared-service", `$.services.${sharedName}`, `${adminService}에서 접근할 internal network가 없습니다.`));
    }
  }

  return validationResult(errors);
}

export function readAndValidateComposeNetworkPolicy(filePath, options) {
  try {
    return validateComposeNetworkPolicy(JSON.parse(fs.readFileSync(filePath, "utf8")), options);
  } catch (error) {
    return validationResult([issue("invalid-json", "$", error.message)]);
  }
}

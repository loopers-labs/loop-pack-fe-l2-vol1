import { appendFileSync, existsSync } from "node:fs";

if (existsSync(".env.local")) {
  process.loadEnvFile(".env.local");
}

const isStrictEnvironment = process.env.CI === "true" || process.env.NODE_ENV === "production";

const requiredUrlEnvs = isStrictEnvironment ? ["APP_ORIGIN"] : [];
const requiredSecretEnvs = isStrictEnvironment ? ["AUTH_SESSION_SECRET"] : [];
const optionalUrlEnvs = ["APP_ORIGIN", "INTERNAL_API_BASE_URL", "NEXT_PUBLIC_API_BASE_URL"];
const publicScenarioEnvs = {
  NEXT_PUBLIC_HOME_API_SCENARIO: ["slow"],
};
const sensitivePublicNamePattern = /(?:SECRET|TOKEN|PASSWORD|DATABASE|PRIVATE|KEY)/i;

const errors = [];

const isValidUrl = (value) => {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
};

for (const name of requiredUrlEnvs) {
  const value = process.env[name];
  if (!value) {
    errors.push(`${name} is required.`);
    continue;
  }

  if (!isValidUrl(value)) {
    errors.push(`${name} must be an absolute http(s) URL.`);
  }
}

for (const name of optionalUrlEnvs) {
  const value = process.env[name];
  if (value && !isValidUrl(value)) {
    errors.push(`${name} must be an absolute http(s) URL when set.`);
  }
}

for (const [name, allowedValues] of Object.entries(publicScenarioEnvs)) {
  const value = process.env[name];
  if (value && !allowedValues.includes(value)) {
    errors.push(`${name} must be one of: ${allowedValues.join(", ")}.`);
  }
}

for (const name of requiredSecretEnvs) {
  if (!process.env[name]) {
    errors.push(`${name} is required.`);
  }
}

for (const name of Object.keys(process.env)) {
  if (name.startsWith("NEXT_PUBLIC_") && sensitivePublicNamePattern.test(name)) {
    errors.push(`${name} looks sensitive and must not be exposed with NEXT_PUBLIC_.`);
  }
}

if (process.env.AUTH_SESSION_SECRET && process.env.AUTH_SESSION_SECRET.length < 16) {
  errors.push("AUTH_SESSION_SECRET must be at least 16 characters when set.");
}

if (errors.length > 0) {
  const report = [
    "## Environment validation failed",
    "",
    ...errors.map((error) => `- ${error}`),
    "",
  ].join("\n");
  console.error(report);

  if (process.env.GITHUB_STEP_SUMMARY) {
    appendFileSync(process.env.GITHUB_STEP_SUMMARY, report);
  }

  process.exit(1);
}

const report = "## Environment validation passed\n\nRequired build environment is valid.\n";
process.stdout.write(report);

if (process.env.GITHUB_STEP_SUMMARY) {
  appendFileSync(process.env.GITHUB_STEP_SUMMARY, report);
}

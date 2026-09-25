import { createServer } from "node:http";

export const ANALYTICS_SINK_VERSION = "1.0.0";

const isNonEmptyString = (value, maxLength = 200) =>
  typeof value === "string" && value.length > 0 && value.length <= maxLength;

const writeJson = (response, status, body, headers = {}) => {
  const payload = JSON.stringify(body);
  response.writeHead(status, {
    "content-type": "application/json; charset=utf-8",
    "content-length": Buffer.byteLength(payload),
    "cache-control": "no-store",
    ...headers,
  });
  response.end(payload);
};

const readJson = async (request, maxBytes = 64 * 1024) => {
  const chunks = [];
  let size = 0;
  for await (const chunk of request) {
    size += chunk.length;
    if (size > maxBytes) {
      const error = new Error("request body is too large");
      error.statusCode = 413;
      throw error;
    }
    chunks.push(chunk);
  }
  try {
    return chunks.length === 0
      ? {}
      : JSON.parse(Buffer.concat(chunks).toString("utf8"));
  } catch {
    const error = new Error("request body must be valid JSON");
    error.statusCode = 400;
    throw error;
  }
};

const bearerMatches = (request, expected) =>
  request.headers.authorization === `Bearer ${expected}`;

export function createAnalyticsSink({
  writeToken,
  graderToken,
  serviceVersion = process.env.SERVICE_VERSION || ANALYTICS_SINK_VERSION,
  allowedOrigins = [],
  now = () => new Date().toISOString(),
  maxContexts = 1_000,
  maxEvents = 10_000,
  maxRecords = 20_000,
} = {}) {
  if (!writeToken || !graderToken) {
    throw new Error("writeToken and graderToken are required");
  }

  const identities = new Map();
  let events = [];
  let records = [];
  let sequence = 0;
  let recordSequence = 0;
  const originAllowlist = new Set(allowedOrigins.filter(Boolean));

  const clearAll = () => {
    identities.clear();
    events = [];
    records = [];
    sequence = 0;
    recordSequence = 0;
  };

  const appendRecord = (record) => {
    recordSequence += 1;
    records.push({
      id: `record-${String(recordSequence).padStart(5, "0")}`,
      recordedAt: now(),
      ...record,
    });
  };

  const requireWriter = (request, response) => {
    if (bearerMatches(request, writeToken)) {
      return true;
    }
    writeJson(response, 401, { error: "analytics_write_token_required" });
    return false;
  };

  const requireGrader = (request, response) => {
    if (bearerMatches(request, graderToken)) {
      return true;
    }
    writeJson(response, 403, { error: "grader_token_required" });
    return false;
  };

  const handler = async (request, response) => {
    const url = new URL(request.url ?? "/", "http://analytics-sink.internal");
    const origin = request.headers.origin;
    const corsHeaders =
      origin && originAllowlist.has(origin)
        ? {
            "access-control-allow-origin": origin,
            "access-control-allow-methods": "GET,POST,OPTIONS",
            "access-control-allow-headers": "authorization,content-type",
            vary: "Origin",
          }
        : {};

    if (request.method === "OPTIONS") {
      if (!origin || !originAllowlist.has(origin)) {
        return writeJson(response, 403, { error: "origin_not_allowed" });
      }
      response.writeHead(204, corsHeaders);
      return response.end();
    }

    if (origin && !originAllowlist.has(origin)) {
      return writeJson(response, 403, { error: "origin_not_allowed" });
    }

    const originalWriteHead = response.writeHead.bind(response);
    response.writeHead = (statusCode, headers = {}) =>
      originalWriteHead(statusCode, { ...corsHeaders, ...headers });

    if (request.method === "GET" && url.pathname === "/health") {
      return writeJson(response, 200, { status: "ok" });
    }
    if (request.method === "GET" && url.pathname === "/ready") {
      return writeJson(response, 200, { ready: true, service: "analytics-sink" });
    }
    if (request.method === "GET" && url.pathname === "/version") {
      return writeJson(response, 200, {
        service: "analytics-sink",
        version: serviceVersion,
        contractVersion: 1,
      });
    }

    if (request.method === "POST" && url.pathname === "/identify") {
      if (!requireWriter(request, response)) return;
      const body = await readJson(request);
      if (
        !isNonEmptyString(body.contextId) ||
        !isNonEmptyString(body.userId) ||
        !isNonEmptyString(body.app, 50) ||
        !isNonEmptyString(body.role, 50)
      ) {
        return writeJson(response, 400, { error: "invalid_identity" });
      }
      const identity = {
        contextId: body.contextId,
        userId: body.userId,
        app: body.app,
        role: body.role,
      };
      if (!identities.has(body.contextId) && identities.size >= maxContexts) {
        return writeJson(response, 429, { error: "context_limit_exceeded" });
      }
      if (records.length >= maxRecords) {
        return writeJson(response, 429, { error: "record_limit_exceeded" });
      }
      identities.set(body.contextId, identity);
      appendRecord({
        type: "identify",
        contextId: body.contextId,
        app: body.app,
        role: body.role,
        identity: body.userId,
      });
      return writeJson(response, 200, { identity: structuredClone(identity) });
    }

    if (request.method === "POST" && url.pathname === "/identity/reset") {
      if (!requireWriter(request, response)) return;
      const body = await readJson(request);
      if (!isNonEmptyString(body.contextId)) {
        return writeJson(response, 400, { error: "invalid_context_id" });
      }
      if (records.length >= maxRecords) {
        return writeJson(response, 429, { error: "record_limit_exceeded" });
      }
      const removed = identities.delete(body.contextId);
      appendRecord({
        type: "reset",
        contextId: body.contextId,
        identity: null,
      });
      return writeJson(response, 200, { contextId: body.contextId, removed });
    }

    if (request.method === "POST" && url.pathname === "/events") {
      if (!requireWriter(request, response)) return;
      const body = await readJson(request);
      if (
        !isNonEmptyString(body.contextId) ||
        !isNonEmptyString(body.event, 100) ||
        !isNonEmptyString(body.app, 50) ||
        (body.properties !== undefined &&
          (body.properties === null ||
            typeof body.properties !== "object" ||
            Array.isArray(body.properties)))
      ) {
        return writeJson(response, 400, { error: "invalid_event" });
      }

      const currentIdentity = identities.get(body.contextId) ?? null;
      if (currentIdentity && currentIdentity.app !== body.app) {
        return writeJson(response, 409, {
          error: "identity_app_mismatch",
          identifiedApp: currentIdentity.app,
          eventApp: body.app,
        });
      }
      if (events.length >= maxEvents || records.length >= maxRecords) {
        return writeJson(response, 429, { error: "event_limit_exceeded" });
      }

      sequence += 1;
      const event = {
        id: `event-${String(sequence).padStart(4, "0")}`,
        receivedAt: now(),
        contextId: body.contextId,
        app: body.app,
        event: body.event,
        identity: currentIdentity ? structuredClone(currentIdentity) : null,
        properties: body.properties ? structuredClone(body.properties) : {},
      };
      events.push(event);
      appendRecord({
        type: "track",
        contextId: body.contextId,
        app: body.app,
        event: body.event,
        identity: currentIdentity?.userId ?? null,
        properties: body.properties ? structuredClone(body.properties) : {},
      });
      return writeJson(response, 202, { accepted: true, eventId: event.id });
    }

    if (url.pathname === "/__grader/reset") {
      if (request.method !== "POST") {
        return writeJson(response, 405, { error: "method_not_allowed" }, { allow: "POST" });
      }
      if (!requireGrader(request, response)) return;
      clearAll();
      return writeJson(response, 200, { reset: true });
    }

    if (url.pathname === "/__grader/events" && request.method === "GET") {
      if (!requireGrader(request, response)) return;
      const contextId = url.searchParams.get("contextId");
      const app = url.searchParams.get("app");
      const selected = events.filter(
        (event) =>
          (contextId === null || event.contextId === contextId) &&
          (app === null || event.app === app),
      );
      return writeJson(response, 200, { events: structuredClone(selected) });
    }

    if (url.pathname === "/__grader/identities" && request.method === "GET") {
      if (!requireGrader(request, response)) return;
      return writeJson(response, 200, {
        identities: structuredClone([...identities.values()]),
      });
    }

    if (url.pathname === "/__grader/records" && request.method === "GET") {
      if (!requireGrader(request, response)) return;
      const contextId = url.searchParams.get("contextId");
      const selected = records.filter(
        (record) => contextId === null || record.contextId === contextId,
      );
      return writeJson(response, 200, { records: structuredClone(selected) });
    }

    return writeJson(response, 404, { error: "not_found" });
  };

  const server = createServer((request, response) => {
    handler(request, response).catch((error) => {
      const status = Number.isInteger(error.statusCode) ? error.statusCode : 500;
      writeJson(response, status, {
        error: status === 500 ? "internal_error" : "invalid_request",
        message: status === 500 ? "unexpected server error" : error.message,
      });
    });
  });

  return { server, clearAll };
}
